import { chromium, type Browser, type BrowserContext, type Page } from 'playwright-core';
import type {
  TestPlan,
  TestOptions,
  ExecutionResult,
  ExecutionStatus,
  TCCase,
  TCStep,
  ExecutedCase,
  CaseResult,
  FailureType,
} from '@qap/shared';
import type { IRunner } from '@qap/engine';
import { FileSystemStorage, LockManager, DependencyGraphResolver } from '@qap/knowledge';

import { resolveModuleSession } from './session-resolver.js';
import { interpolateStep } from './context/interpolator.js';
import {
  executeNavigate,
  executeClick,
  executeFill,
  executeAssert,
  executeWaitFor,
  executeScreenshot,
  executeCapture,
  executeSwitchAuth,
  executeEvaluate,
} from './actions/index.js';

function classifyError(error: unknown): { category: FailureType; message: string } {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
      ? error
      : JSON.stringify(error ?? '');

  if (/selector|element not found|locate/i.test(message)) {
    return { category: 'selector_not_found', message };
  }
  if (/navig|net::ERR|goto/i.test(message)) {
    return { category: 'navigation_error', message };
  }
  if (/network|fetch|http|500|404/i.test(message)) {
    return { category: 'network_error', message };
  }
  if (/timeout|exceeded|timed out/i.test(message)) {
    return { category: 'execution_timeout', message };
  }
  if (/auth|login|credential|unauthorized|403/i.test(message)) {
    return { category: 'auth_failed', message };
  }

  return { category: 'assertion_failed', message };
}

export interface PlaywrightRunnerOptions extends TestOptions {
  fail_fast?: boolean;
  storageResolver?: (moduleName: string, caseId: string) => Promise<TCCase>;
  screenshotsDir?: string;
  storageStatePath?: string; 
  projectRoot?: string;
}

export class PlaywrightRunner implements IRunner {
  private currentCaseId?: string;
  private currentOptions?: PlaywrightRunnerOptions;

  public async execute(
    plan: TestPlan,
    options: PlaywrightRunnerOptions = {}
  ): Promise<ExecutionResult> {
    const startedAt = new Date().toISOString();
    const projectRoot = options.projectRoot ?? process.cwd();
    const storage = new FileSystemStorage({ rootDir: projectRoot });

    this.currentOptions = options;

    const isHeadless = options.headless ?? true;
    const timeout = options.timeout_ms ?? plan.timeout_ms ?? 30000;
    const failFast = options.fail_fast ?? plan.fail_fast ?? false;
    const moduleName = plan.modules[0] ?? '';
    const env = options.environment ?? plan.environment ?? 'local';
    const screenshotsDir = options.screenshotsDir ?? '.qa/reports/screenshots';
    const flowVariables: Record<string, string> = options.context_data 
      ? Object.fromEntries(Object.entries(options.context_data).map(([k, v]) => [k, String(v)]))
      : {};

    const loadCase = options.storageResolver ?? ((mod: string, caseId: string) => storage.getTestCase(mod, caseId));

    let browser: Browser | null = null;
    let context: BrowserContext | null = null;
    let releaseLock: (() => void) | null = null;

    let totalPassed = 0;
    let totalFailed = 0;
    const totalSkipped = 0;
    const totalNotRun = 0;
    const casesResult: ExecutedCase[] = [];
    let timedOut = false;

    const cleanup = async () => {
      if (context) await context.close().catch(() => {});
      if (browser) await browser.close().catch(() => {});
      if (releaseLock) {
        try {
          releaseLock();
        } catch {}
      }
    };

    const sigintHandler = () => { cleanup().finally(() => process.exit(130)); };
    const sigtermHandler = () => { cleanup().finally(() => process.exit(143)); };
    const uncaughtHandler = (err: unknown) => {
      console.error('[PlaywrightRunner] Uncaught Exception:', err);
      cleanup().finally(() => process.exit(1));
    };

    process.once('SIGINT', sigintHandler);
    process.once('SIGTERM', sigtermHandler);
    process.once('uncaughtException', uncaughtHandler);

    try {
      if (moduleName) {
        const lockManager = new LockManager({ rootDir: projectRoot });
        releaseLock = await lockManager.acquireModuleLock(moduleName);
      }

      let storageState: any = undefined;
      if (moduleName) {
        try {
          storageState = await resolveModuleSession(projectRoot, moduleName);
        } catch (error) {
          console.warn(`[PlaywrightRunner] No se pudo resolver la sesión autenticada para ${moduleName}:`, error);
        }
      }

      browser = await chromium.launch({
        headless: isHeadless,
        slowMo: options.slow_mo ?? 0,
      });

      context = await browser.newContext(storageState ? { storageState } : undefined);
      
      const page = await context.newPage();
      page.setDefaultTimeout(timeout);

      let caseIds = plan.cases ?? [];

      if (moduleName && caseIds.length > 0) {
        try {
          const loadedCases: Array<{ id: string; depends_on?: string[]; tc: TCCase }> = [];
          for (const cId of caseIds) {
            const tc = await loadCase(moduleName, cId);
            if (tc) {
              loadedCases.push({ id: cId, depends_on: tc.depends_on, tc });
            }
          }
          const graphResult = DependencyGraphResolver.resolveOrder(loadedCases);
          if (!graphResult.hasCycles) {
            caseIds = graphResult.orderedNodes.map((n) => n.id);
          }
        } catch (err) {
          console.warn('[PlaywrightRunner] No se pudo aplicar el ordenamiento topológico del grafo:', err);
        }
      }

      for (const caseId of caseIds) {
        this.currentCaseId = caseId;
        const caseStartMs = Date.now();
        const contextVariables: Record<string, string> = {};
        let caseResult: CaseResult = 'passed';
        let errorMessage: string | undefined;
        let failureType: FailureType = 'assertion_failed';
        let caseTitle = caseId;
        let failureScreenshotPath: string | undefined;
        const executedSteps: Array<{ action: string; status: string; message?: string; screenshot_path?: string }> = [];

        try {
          if (!moduleName) {
            throw new Error(`No se puede ejecutar el caso '${caseId}': el plan no especifica ningún módulo.`);
          }

          const testCase = await loadCase(moduleName, caseId);
          if (!testCase) {
            throw new Error(`No se encontró el caso '${caseId}' para el módulo '${moduleName}'.`);
          }

          caseTitle = testCase.name || caseId;
          const steps = testCase.steps || [];
          for (const rawStep of steps) {
            const step = interpolateStep(rawStep, contextVariables, flowVariables);
            const stepRes = await this.executeStep(page, step, screenshotsDir, contextVariables);
            executedSteps.push(stepRes);
          }
          
          totalPassed++;
        } catch (err: unknown) {
          caseResult = 'failed';
          totalFailed++;
          errorMessage = err instanceof Error ? err.message : String(err);

          try {
            failureScreenshotPath = await executeScreenshot(
              page,
              { type: 'screenshot', filename: `failure_${caseId}_${Date.now()}.png` },
              screenshotsDir
            );
          } catch {}

          const classified = classifyError(err);
          failureType = classified.category;

          if (classified.category === 'execution_timeout') {
            timedOut = true;
          }

          executedSteps.push({
            action: 'execute',
            status: 'failed',
            message: errorMessage,
            ...(failureScreenshotPath ? { screenshot_path: failureScreenshotPath } : {}),
          });

          if (failFast) {
            const failFastCase: ExecutedCase = {
              id: caseId,
              title: caseTitle,
              result: caseResult,
              failure_type: failureType,
              duration_ms: Date.now() - caseStartMs,
              steps: executedSteps,
            };
            casesResult.push(failFastCase);
            break;
          }
        } finally {
          if (caseResult !== 'failed' || !failFast) {
            const executedCase: ExecutedCase = {
              id: caseId,
              title: caseTitle,
              result: caseResult,
              duration_ms: Date.now() - caseStartMs,
              steps: executedSteps,
              ...(errorMessage
                ? {
                    failure_type: failureType,
                  }
                : {}),
            };

            casesResult.push(executedCase);
          }
        }
      }
    } catch (err: unknown) {
      if (casesResult.length === 0) {
        totalFailed = Math.max(totalFailed, 1);
      }
      console.error('[PlaywrightRunner] Error crítico durante la ejecución:', err);
    } finally {
      process.removeListener('SIGINT', sigintHandler);
      process.removeListener('SIGTERM', sigtermHandler);
      process.removeListener('uncaughtException', uncaughtHandler);
      await cleanup();
    }

    const finishedAt = new Date().toISOString();
    const total = totalPassed + totalFailed + totalSkipped + totalNotRun;
    const overallResult: ExecutionStatus =
      totalFailed === 0 ? 'passed' : totalPassed === 0 ? 'failed' : 'partial';

    return {
      _version: '1',
      execution_id: `exec_${Date.now()}`,
      module: moduleName,
      env,
      started_at: startedAt,
      finished_at: finishedAt,
      result: overallResult,
      timed_out: timedOut,
      summary: {
        total,
        passed: totalPassed,
        failed: totalFailed,
        skipped: totalSkipped,
        not_run: totalNotRun,
      },
      cases: casesResult,
    };
  }

  private async executeStep(
    page: Page,
    step: TCStep,
    screenshotsDir: string = '.qa/reports/screenshots',
    contextVariables: Record<string, string> = {}
  ): Promise<{ action: string; status: string; message?: string }> {
    let stepMsg: string | undefined;

    switch (step.type) {
      case 'navigate':
        await executeNavigate(page, step);
        break;
      case 'click':
        await executeClick(page, step);
        break;
      case 'fill':
        await executeFill(page, step);
        break;
      case 'assert':
        await executeAssert(page, step);
        break;
      case 'waitFor':
        await executeWaitFor(page, step);
        break;
      case 'screenshot':
        await executeScreenshot(page, step, screenshotsDir);
        break;
      case 'capture': {
        const capturedVal = await executeCapture(page, step, contextVariables, {
          caseId: this.currentCaseId,
          context_data: this.currentOptions?.context_data,
        });
        stepMsg = JSON.stringify({
          captured_as: step.capture_as,
          value: capturedVal,
        });
        break;
      }
      case 'switch_auth':
        await executeSwitchAuth(page, step);
        break;
      case 'evaluate':
        await executeEvaluate(page, step, contextVariables, {
          sandbox: (step as any).sandbox !== false,
          args: (step as any).args as Record<string, unknown>,
        });
        break;
      default:
        break;
    }

    return {
      action: step.type,
      status: 'passed',
      ...(stepMsg ? { message: stepMsg } : {}),
    };
  }
}