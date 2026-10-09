import { interpolateStep } from './context/interpolator.js';
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
}

export class PlaywrightRunner {
  public async execute(
    plan: TestPlan,
    options: PlaywrightRunnerOptions = {}
  ): Promise<ExecutionResult> {
    const startedAt = new Date().toISOString();

    const isHeadless = options.headless ?? true;
    const timeout = options.timeout_ms ?? plan.timeout_ms ?? 30000;
    const failFast = options.fail_fast ?? plan.fail_fast ?? false;
    const moduleName = plan.modules[0] ?? '';
    const env = options.environment ?? plan.environment ?? 'local';
    const screenshotsDir = options.screenshotsDir ?? '.qa/reports/screenshots';

    let browser: Browser | null = null;
    let context: BrowserContext | null = null;

    let totalPassed = 0;
    let totalFailed = 0;
    const totalSkipped = 0;
    const totalNotRun = 0;
    const casesResult: ExecutedCase[] = [];
    let timedOut = false;

    try {
      browser = await chromium.launch({
        headless: isHeadless,
        slowMo: options.slow_mo ?? 0,
      });

      context = await browser.newContext();
      const page = await context.newPage();
      page.setDefaultTimeout(timeout);

      const caseList = plan.cases ?? [];

      for (const caseId of caseList) {
        const caseStartMs = Date.now();
        const contextVariables: Record<string, string> = {};
        let caseResult: CaseResult = 'passed';
        let errorMessage: string | undefined;
        let failureType: FailureType = 'assertion_failed';
        let caseTitle = caseId;
        let failureScreenshotPath: string | undefined;

        try {
          if (options.storageResolver && moduleName) {
            const testCase = await options.storageResolver(moduleName, caseId);
            caseTitle = testCase.name || caseId;
            const steps = testCase.steps || [];
           for (const rawStep of steps) {
              const step = interpolateStep(rawStep, contextVariables);
              await this.executeStep(page, step, screenshotsDir, contextVariables);
            }
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
          } catch {
            // Ignorar fallos al tomar captura para no sobreescribir el error original
          }

          const classified = classifyError(err);
          failureType = classified.category;

          if (classified.category === 'execution_timeout') {
            timedOut = true;
          }

          if (failFast) {
            const failFastCase: ExecutedCase = {
              id: caseId,
              title: caseTitle,
              result: caseResult,
              failure_type: failureType,
              duration_ms: Date.now() - caseStartMs,
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
              ...(errorMessage
                ? {
                    failure_type: failureType,
                    steps: [
                      {
                        action: 'execute',
                        status: 'failed',
                        message: errorMessage,
                        ...(failureScreenshotPath ? { screenshot_path: failureScreenshotPath } : {}),
                      },
                    ],
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
      console.error('[PlaywrightRunner] Error no controlado antes del loop de casos:', err);
    } finally {
      if (context) await context.close().catch(() => {});
      if (browser) await browser.close().catch(() => {});
    }

    const finishedAt = new Date().toISOString();
    const total = totalPassed + totalFailed + totalSkipped + totalNotRun;
    const overallResult: ExecutionStatus =
      totalFailed === 0 ? 'passed' : totalPassed === 0 ? 'failed' : 'partial';

    const executionResult: ExecutionResult = {
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

    return executionResult;
  }

  private async executeStep(
    page: Page,
    step: TCStep,
    screenshotsDir: string = '.qa/reports/screenshots',
    contextVariables: Record<string, string> = {}
  ): Promise<void> {
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
      case 'capture':
        await executeCapture(page, step, contextVariables);
        break;
      case 'switch_auth':
        await executeSwitchAuth(page, step);
        break;
      case 'evaluate':
        await executeEvaluate(page, step, contextVariables);
        break;
      default:
        break;
    }
  }
}
