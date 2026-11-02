import path from 'node:path';

import type { IRunner } from '@qap/engine';
import { FileSystemStorage, LockManager, DependencyGraphResolver } from '@qap/knowledge';
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
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright-core';

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
import { interpolateStep } from './context/interpolator.js';
import { resolveModuleSession } from './session-resolver.js';

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
  if (/navig|net::ERR|goto|network|fetch|http|500|404/i.test(message)) {
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
  /** Override opcional para pruebas: si se pasa, se usa en vez de cargar vía FileSystemStorage. */
  storageResolver?: (moduleName: string, caseId: string) => Promise<TCCase>;
  screenshotsDir?: string;
  storageStatePath?: string; 
  /** Raíz del proyecto para FileSystemStorage: por defecto process.cwd().*/
  projectRoot?: string;
  registerSignalHandlers?: boolean;
  signal?: AbortSignal;
}

export class PlaywrightRunner implements IRunner {
  public async execute(
    plan: TestPlan,
    options: PlaywrightRunnerOptions = {}
  ): Promise<ExecutionResult> {
    const startedAt = new Date().toISOString();
    const projectRoot = options.projectRoot ? path.resolve(options.projectRoot) : process.cwd();
    const storage = new FileSystemStorage({ rootDir: projectRoot });

    const isHeadless = options.headless ?? true;
    const timeout = options.timeout_ms ?? plan.timeout_ms ?? 30000;
    const failFast = options.fail_fast ?? plan.fail_fast ?? false;
    const moduleName = plan.modules[0] ?? '';
    const env = options.environment ?? plan.environment ?? 'local';
    const rawScreenshotsDir = options.screenshotsDir ?? '.qa/reports/screenshots';
    const screenshotsDir = path.isAbsolute(rawScreenshotsDir)
      ? rawScreenshotsDir
      : path.resolve(projectRoot, rawScreenshotsDir);

    const flowVariables: Record<string, string> = options.context_data
      ? Object.fromEntries(Object.entries(options.context_data).map(([k, v]) => [k, String(v)]))
      : {};

    const loadCase = options.storageResolver ?? ((mod: string, caseId: string) => storage.getTestCase(mod, caseId));

    let browser: Browser | null = null;
    let context: BrowserContext | null = null;
    let releaseLock: (() => Promise<void>) | null = null;

    let totalPassed = 0;
    let totalFailed = 0;
    const totalSkipped = 0;
    let totalNotRun = 0;
    const casesResult: ExecutedCase[] = [];
    let timedOut = false;

    // Rutina de limpieza ante cancelación o finalización
    const cleanup = async () => {
      if (context) await context.close().catch(() => {});
      if (browser) await browser.close().catch(() => {});
      if (releaseLock) {
        try {
          await releaseLock();
        } catch {
          // Ignorar si ya fue liberado
        }
      }
    };

    const sigintHandler = () => {
      void cleanup().finally(() => process.exit(130));
    };
    const sigtermHandler = () => {
      void cleanup().finally(() => process.exit(143));
    };
    const uncaughtHandler = (err: unknown) => {
      console.error('[PlaywrightRunner] Uncaught Exception:', err);
      void cleanup().finally(() => process.exit(1));
    };

    if (options.registerSignalHandlers) {
      process.once('SIGINT', sigintHandler);
      process.once('SIGTERM', sigtermHandler);
      process.once('uncaughtException', uncaughtHandler);
    }

    try {
      if (options.signal?.aborted) {
        throw new Error('Ejecución cancelada por AbortSignal.');
      }

      // 1. Adquirir lock con LockManager.acquireModuleLock()
      if (moduleName) {
        const lockManager = new LockManager({ rootDir: projectRoot });
        releaseLock = await lockManager.acquireModuleLock(moduleName);
      }

      // Si no hay casos que ejecutar, terminamos de forma honesta sin iniciar navegador
      const initialCaseIds = plan.cases ?? [];
      if (initialCaseIds.length === 0) {
        return {
          _version: '1',
          execution_id: `exec_${Date.now()}`,
          module: moduleName,
          env,
          started_at: startedAt,
          finished_at: new Date().toISOString(),
          result: 'failed',
          timed_out: false,
          summary: {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            not_run: 0,
          },
          cases: [],
        };
      }

      // 2. Resolver sesión autenticada con resolveModuleSession()
      type BrowserContextOptions = NonNullable<Parameters<Browser['newContext']>[0]>;
      let storageState: BrowserContextOptions['storageState'] = undefined;
      if (moduleName) {
        try {
          storageState = (await resolveModuleSession(projectRoot, moduleName)) as BrowserContextOptions['storageState'];
        } catch (error) {
          console.warn(`[PlaywrightRunner] No se pudo resolver la sesión autenticada para ${moduleName}:`, error);
        }
      }

      // 3. Inicializar navegador Chromium con aislamiento de errores de infraestructura
      let isInfrastructureError = false;
      let infrastructureErrorMessage: string | undefined;

      try {
        browser = await chromium.launch({
          headless: isHeadless,
          slowMo: options.slow_mo ?? 0,
        });
      } catch (launchErr: unknown) {
        isInfrastructureError = true;
        infrastructureErrorMessage = launchErr instanceof Error ? launchErr.message : String(launchErr);
        console.error('[PlaywrightRunner] Error de infraestructura al iniciar el navegador Chromium:', launchErr);
      }

      if (isInfrastructureError) {
        const notRunCases: ExecutedCase[] = initialCaseIds.map((caseId) => ({
          id: caseId,
          title: caseId,
          result: 'not_run',
          not_run_reason: `Fallo de infraestructura: no se pudo iniciar el navegador Chromium (${infrastructureErrorMessage})`,
          duration_ms: 0,
        }));

        return {
          _version: '1',
          execution_id: `exec_${Date.now()}`,
          module: moduleName,
          env,
          started_at: startedAt,
          finished_at: new Date().toISOString(),
          result: 'error',
          timed_out: false,
          summary: {
            total: notRunCases.length,
            passed: 0,
            failed: 0,
            skipped: 0,
            not_run: notRunCases.length,
          },
          cases: notRunCases,
        };
      }

      context = await browser!.newContext(storageState ? { storageState } : undefined);
      const page = await context.newPage();
      page.setDefaultTimeout(timeout);

      let caseIds = [...initialCaseIds];
      const loadedCasesMap = new Map<string, TCCase>();

      if (moduleName && caseIds.length > 0) {
        try {
          const loadedCases: Array<{ id: string; depends_on?: string[]; tc: TCCase }> = [];
          for (const cId of caseIds) {
            const tc = await loadCase(moduleName, cId);
            if (tc) {
              loadedCasesMap.set(cId, tc);
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

      const executedStatuses = new Map<string, CaseResult>();

      for (let i = 0; i < caseIds.length; i++) {
        const caseId = caseIds[i];

        if (options.signal?.aborted) {
          for (let j = i; j < caseIds.length; j++) {
            const unrunId = caseIds[j];
            totalNotRun++;
            casesResult.push({
              id: unrunId,
              title: unrunId,
              result: 'not_run',
              not_run_reason: 'Ejecución cancelada por AbortSignal',
              duration_ms: 0,
            });
          }
          break;
        }

        let testCase = loadedCasesMap.get(caseId);
        if (!testCase && moduleName) {
          testCase = await loadCase(moduleName, caseId);
          if (testCase) {
            loadedCasesMap.set(caseId, testCase);
          }
        }

        const caseTitle = testCase?.name || caseId;
        const dependsOn = Array.isArray(testCase?.depends_on) ? testCase.depends_on : [];

        // Comprobar si alguna dependencia no tuvo estado 'passed'
        let blockedByDependency: string | null = null;
        for (const depId of dependsOn) {
          if (!depId || typeof depId !== 'string') continue;
          const parentStatus = executedStatuses.get(depId.trim());
          if (!parentStatus || parentStatus !== 'passed') {
            blockedByDependency = depId.trim();
            break;
          }
        }

        if (blockedByDependency) {
          totalNotRun++;
          executedStatuses.set(caseId, 'not_run');
          casesResult.push({
            id: caseId,
            title: caseTitle,
            result: 'not_run',
            not_run_reason: `Omitido porque la dependencia '${blockedByDependency}' no tuvo estado 'passed'`,
            duration_ms: 0,
          });
          continue;
        }

        const caseStartMs = Date.now();
        const contextVariables: Record<string, string> = {};
        let caseResult: CaseResult = 'passed';
        let errorMessage: string | undefined;
        let failureType: FailureType = 'assertion_failed';
        let failureScreenshotPath: string | undefined;

        try {
          if (!moduleName) {
            throw new Error(`No se puede ejecutar el caso '${caseId}': el plan no especifica ningún módulo.`);
          }

          if (!testCase) {
            throw new Error(`No se encontró el caso '${caseId}' para el módulo '${moduleName}'.`);
          }

          const steps = testCase.steps || [];
          for (const rawStep of steps) {
            const step = interpolateStep(rawStep, contextVariables, flowVariables);
            await this.executeStep(page, step, screenshotsDir, contextVariables);
          }

          totalPassed++;
          executedStatuses.set(caseId, 'passed');
        } catch (err: unknown) {
          caseResult = 'failed';
          totalFailed++;
          executedStatuses.set(caseId, 'failed');
          errorMessage = err instanceof Error ? err.message : String(err);

          try {
            failureScreenshotPath = await executeScreenshot(
              page,
              { type: 'screenshot', filename: `failure_${caseId}_${Date.now()}.png` },
              screenshotsDir
            );
          } catch {
            // Ignorar fallos al tomar captura
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
              ...(errorMessage
                ? {
                    steps: [
                      {
                        action: 'execute',
                        status: 'failed',
                        message: errorMessage,
                        screenshot: failureScreenshotPath ?? null,
                      },
                    ],
                  }
                : {}),
            };
            casesResult.push(failFastCase);

            // Preservar casos restantes como not_run
            for (let j = i + 1; j < caseIds.length; j++) {
              const remainingId = caseIds[j];
              const remainingTc = loadedCasesMap.get(remainingId);
              totalNotRun++;
              casesResult.push({
                id: remainingId,
                title: remainingTc?.name || remainingId,
                result: 'not_run',
                not_run_reason: 'Detenido por fail-fast',
                duration_ms: 0,
              });
            }
            break;
          }
        }

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
                      screenshot: failureScreenshotPath ?? null,
                    },
                  ],
                }
              : {}),
          };

          casesResult.push(executedCase);
        }
      }
    } catch (err: unknown) {
      if (casesResult.length === 0) {
        totalFailed = Math.max(totalFailed, 1);
      }
      console.error('[PlaywrightRunner] Error crítico durante la ejecución:', err);
    } finally {
      if (options.registerSignalHandlers) {
        process.removeListener('SIGINT', sigintHandler);
        process.removeListener('SIGTERM', sigtermHandler);
        process.removeListener('uncaughtException', uncaughtHandler);
      }
      await cleanup();
    }

    const finishedAt = new Date().toISOString();
    const total = totalPassed + totalFailed + totalSkipped + totalNotRun;
    let overallResult: ExecutionStatus;
    if (total === 0 || totalPassed === 0) {
      overallResult = 'failed';
    } else if (totalPassed === total) {
      overallResult = 'passed';
    } else {
      overallResult = 'partial';
    }

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
      default: {
        const unknownType = (step as { type?: string })?.type ?? 'desconocido';
        throw new Error(`Acción o tipo de paso no soportado o desconocido: '${unknownType}'`);
      }
    }
  }
}