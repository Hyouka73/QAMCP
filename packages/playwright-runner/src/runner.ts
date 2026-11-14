import { randomUUID } from 'node:crypto';
import path from 'node:path';

import { restrictChromiumPage, type StorageState } from '@qap/auth';
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
import type { Browser, BrowserContext, Page } from 'playwright-core';

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
import { caseExecutionBlockReason } from './case-execution-policy.js';
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

export function isUrlAllowedByPolicy(urlStr: string, allowedOrigins: string[]): boolean {
  if (!allowedOrigins || allowedOrigins.length === 0) return false;
  if (urlStr === 'about:blank' || urlStr.startsWith('data:')) return true;
  let parsed: URL;
  try {
    parsed = new URL(urlStr);
  } catch {
    return false;
  }
  const origin = parsed.origin;
  const fullUrl = parsed.href;
  for (const pattern of allowedOrigins) {
    if (pattern === '*' || pattern === origin || pattern === fullUrl) {
      return true;
    }
    const regexPattern = '^' + pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*') + '$';
    const regex = new RegExp(regexPattern);
    if (regex.test(origin) || regex.test(fullUrl)) {
      return true;
    }
  }
  return false;
}

export interface PlaywrightRunnerOptions extends TestOptions {
  fail_fast?: boolean;
  /** Override opcional para pruebas: si se pasa, se usa en vez de cargar vía FileSystemStorage. */
  storageResolver?: (moduleName: string, caseId: string) => Promise<TCCase>;
  screenshotsDir?: string;
  storageStatePath?: string;
  storageState?: NonNullable<Parameters<Browser['newContext']>[0]>['storageState'];
  extraHTTPHeaders?: Record<string, string>;
  /** Raíz del proyecto para FileSystemStorage: por defecto process.cwd().*/
  projectRoot?: string;
  registerSignalHandlers?: boolean;
  signal?: AbortSignal;
  allowImplicitAuth?: boolean;
  profile?: string;
  allowedOrigins?: string[];
  /** Trusted MCP host options for a single-origin, read-only execution. */
  interactiveReadOnly?: boolean;
  verifiedSession?: { state: StorageState; verificationUrl: string; selector: string };
  contextSetup?: (context: BrowserContext) => Promise<void> | void;
}

export class PlaywrightRunner implements IRunner {
  public async execute(
    plan: TestPlan,
    options: PlaywrightRunnerOptions = {}
  ): Promise<ExecutionResult> {
    const startedAt = new Date().toISOString();
    // One stable collision-resistant identifier for every exit path of this run.
    const executionId = `exec_${Date.now()}_${randomUUID().replace(/-/g, '')}`;
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
    const loadedCasesMap = new Map<string, TCCase>();

    let browser: Browser | null = null;
    let context: BrowserContext | null = null;
    let releaseLock: (() => Promise<void>) | null = null;

    let totalPassed = 0;
    let totalFailed = 0;
    const totalSkipped = 0;
    let totalNotRun = 0;
    const casesResult: ExecutedCase[] = [];
    let timedOut = false;
    let unexpectedlyInterrupted = false;
    const plannedCaseIds = plan.cases ?? [];

    // Cancellation interrupts browser work, but ownership of the module lock
    // lasts until execute has drained. A launch/context acquired after abort
    // is closed by the final pass, never leaked by an early cleanup snapshot.
    let closeTail = Promise.resolve();
    const closeResources = () => {
      closeTail = closeTail.then(async () => {
        if (context) await context.close().catch(() => {});
        if (browser) await browser.close().catch(() => {});
      });
      return closeTail;
    };
    const cleanup = async () => {
      await closeResources();
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

    const abortListener = () => {
      void closeResources();
    };
    const checkCancellation = () => {
      if (options.signal?.aborted) throw new Error('Ejecución cancelada por AbortSignal.');
    };
    if (options.signal) {
      options.signal.addEventListener('abort', abortListener, { once: true });
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
      checkCancellation();

      // Si no hay casos que ejecutar, terminamos de forma honesta sin iniciar navegador
      const initialCaseIds = plannedCaseIds;
      if (initialCaseIds.length === 0) {
        return {
          _version: '1',
          execution_id: executionId,
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

      // Inspect capability blocks before resolving any session or launching a browser.
      for (const caseId of initialCaseIds) {
        const testCase = await loadCase(moduleName, caseId);
        if (testCase) loadedCasesMap.set(caseId, testCase);
      }
      if (initialCaseIds.every((id) => {
        const testCase = loadedCasesMap.get(id);
        return testCase && caseExecutionBlockReason(testCase);
      })) {
        return {
          _version: '1', execution_id: executionId, module: moduleName, env,
          started_at: startedAt, finished_at: new Date().toISOString(), result: 'failed', timed_out: false,
          summary: { total: initialCaseIds.length, passed: 0, failed: 0, skipped: 0, not_run: initialCaseIds.length },
          cases: initialCaseIds.map((id) => ({
            id, title: loadedCasesMap.get(id)!.name, result: 'not_run', duration_ms: 0,
            not_run_reason: caseExecutionBlockReason(loadedCasesMap.get(id)!),
          })),
        };
      }

      // 2. Resolver sesión autenticada con resolveModuleSession() o storageState inyectado por el host
      type BrowserContextOptions = NonNullable<Parameters<Browser['newContext']>[0]>;
      let storageState: BrowserContextOptions['storageState'] = options.verifiedSession?.state ?? options.storageState;
      const shouldResolveSession = !options.interactiveReadOnly &&
        !storageState && (options.profile !== undefined || (Boolean(moduleName) && options.allowImplicitAuth !== false));
      if (shouldResolveSession && moduleName) {
        try {
          storageState = (await resolveModuleSession(
            projectRoot,
            moduleName,
            options.profile,
            { allowImplicitAuth: options.allowImplicitAuth }
          )) as BrowserContextOptions['storageState'];
        } catch (error) {
          if (options.profile !== undefined) {
            throw new Error('No se pudo preservar la identidad solicitada; se bloquea la ejecución.', { cause: error });
          }
          console.warn(`[PlaywrightRunner] No se pudo resolver la sesión autenticada para ${moduleName}:`, error);
        }
        if (options.profile !== undefined && !storageState) {
          throw new Error('No existe sesión válida para la identidad solicitada; no se ejecutará como anónimo.');
        }
      }

      if (options.interactiveReadOnly && options.profile && !options.verifiedSession) {
        throw new Error('Falta una sesión verificada por el host.');
      }
      checkCancellation();
      // 3. Inicializar navegador Chromium con aislamiento de errores de infraestructura
      let isInfrastructureError = false;
      let infrastructureErrorMessage: string | undefined;

      try {
        const { chromium } = await import('playwright-core');
        checkCancellation();
        const channels = options.interactiveReadOnly ? [undefined, 'chrome', 'msedge'] : [undefined];
        for (const channel of channels) {
          checkCancellation();
          try {
            browser = await chromium.launch({ channel, headless: isHeadless, slowMo: options.slow_mo ?? 0 });
            break;
          } catch (error) {
            if (channel === channels.at(-1)) throw error;
          }
        }
      } catch (launchErr: unknown) {
        isInfrastructureError = true;
        infrastructureErrorMessage = launchErr instanceof Error ? launchErr.message : String(launchErr);
        console.error('[PlaywrightRunner] Error de infraestructura al iniciar el navegador Chromium:', launchErr);
      }

      checkCancellation();
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
          execution_id: executionId,
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

      const newContextOpts: BrowserContextOptions = {
        ...(storageState ? { storageState } : {}),
        ...(options.extraHTTPHeaders ? { extraHTTPHeaders: options.extraHTTPHeaders } : {}),
        ...(options.interactiveReadOnly ? { serviceWorkers: 'block', acceptDownloads: false } : {}),
      };
      context = await browser!.newContext(Object.keys(newContextOpts).length > 0 ? newContextOpts : undefined);
      checkCancellation();

      if (options.contextSetup) {
        await options.contextSetup(context);
      }
      checkCancellation();

      if (!options.interactiveReadOnly && options.allowedOrigins && options.allowedOrigins.length > 0) {
        const allowedPatterns = options.allowedOrigins;
        await context.route('**/*', async (route) => {
          const reqUrl = route.request().url();
          if (!isUrlAllowedByPolicy(reqUrl, allowedPatterns)) {
            await route.abort('blockedbyclient');
            return;
          }

          if (reqUrl === 'about:blank' || reqUrl.startsWith('data:')) {
            await route.continue();
            return;
          }

          try {
            let currentUrl = reqUrl;
            const maxRedirects = 10;
            for (let hop = 0; hop <= maxRedirects; hop++) {
              const response = await route.fetch({ url: currentUrl, maxRedirects: 0 });
              const status = response.status();
              if (status >= 300 && status < 400) {
                const headers = response.headers();
                const location = headers['location'] ?? headers['Location'];
                if (!location) {
                  await route.fulfill({ response });
                  return;
                }
                const targetUrl = new URL(location, currentUrl).toString();
                if (!isUrlAllowedByPolicy(targetUrl, allowedPatterns)) {
                  await route.abort('blockedbyclient');
                  return;
                }
                currentUrl = targetUrl;
                continue;
              }
              await route.fulfill({ response });
              return;
            }
            await route.abort('blockedbyclient');
          } catch {
            await route.abort('failed');
          }
        });
      }

      const page = await context.newPage();
      page.setDefaultTimeout(timeout);
      if (options.interactiveReadOnly) {
        const [origin] = options.allowedOrigins ?? [];
        if (!origin || options.allowedOrigins?.length !== 1) throw new Error('Falta el origen autorizado.');
        await restrictChromiumPage(page, origin, true);
        if (options.verifiedSession) {
          const { verificationUrl, selector } = options.verifiedSession;
          if (new URL(verificationUrl).origin !== origin) throw new Error('Origen de sesión incompatible.');
          const response = await page.goto(verificationUrl, { waitUntil: 'domcontentloaded' });
          if (!response?.ok() || new URL(page.url()).origin !== origin) throw new Error('Sesión no válida.');
          await page.locator(selector).first().waitFor({ state: 'visible' });
          if (new URL(page.url()).origin !== origin || await page.locator('input[type="password"]:visible').count()) {
            throw new Error('Sesión no válida.');
          }
        }
      }

      let caseIds = [...initialCaseIds];

      if (moduleName && caseIds.length > 0) {
        try {
          const loadedCases: Array<{ id: string; depends_on?: string[]; tc: TCCase }> = [];
          for (const cId of caseIds) {
            const tc = loadedCasesMap.get(cId);
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
        // Generated suggestions cannot certify business rules or authorization.
        // This marker is a blocking signal, never a receipt of human authority.
        const blockReason = testCase ? caseExecutionBlockReason(testCase) : undefined;
        if (blockReason) {
          totalNotRun++;
          executedStatuses.set(caseId, 'not_run');
          casesResult.push({
            id: caseId,
            title: caseTitle,
            result: 'not_run',
            not_run_reason: blockReason,
            duration_ms: 0,
          });
          continue;
        }
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
        const stepTrace: NonNullable<ExecutedCase['steps']> = [];
        let activeStepType = 'execute';

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
            activeStepType = step.type;
            const stepStarted = Date.now();
            await this.executeStep(page, step, screenshotsDir, contextVariables);
            stepTrace.push({
              action: step.type,
              status: 'passed',
              duration_ms: Date.now() - stepStarted,
            });
          }

          totalPassed++;
          executedStatuses.set(caseId, 'passed');
        } catch (err: unknown) {
          caseResult = 'failed';
          totalFailed++;
          executedStatuses.set(caseId, 'failed');
          errorMessage = options.interactiveReadOnly ? 'El paso no se completó.' : err instanceof Error ? err.message : String(err);

          try {
            if (!options.interactiveReadOnly) {
              const absShot = await executeScreenshot(
                page,
                { type: 'screenshot', filename: `failure_${caseId}_${Date.now()}.png` },
                screenshotsDir
              );
              failureScreenshotPath = absShot ? path.relative(projectRoot, absShot).replace(/\\/g, '/') : undefined;
            }
          } catch {
            // Ignorar fallos al tomar captura
          }
          stepTrace.push({
            action: activeStepType,
            status: 'failed',
            message: errorMessage,
            screenshot: failureScreenshotPath ?? null,
          });

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
              ...(stepTrace.length > 0 ? { steps: stepTrace } : {}),
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
            ...(errorMessage ? { failure_type: failureType } : {}),
            ...(stepTrace.length > 0 ? { steps: stepTrace } : {}),
          };

          casesResult.push(executedCase);
        }
      }
    } catch (err: unknown) {
      unexpectedlyInterrupted = true;
      if (!options.interactiveReadOnly) console.error('[PlaywrightRunner] Error crítico durante la ejecución:', err);
      // Preserve all planned cases, even if browser context creation or case
      // loading failed outside the individual step handlers. Never fabricate a
      // failing assertion or silently omit the unexecuted cases.
      const accountedFor = new Set(casesResult.map(item => item.id));
      for (const caseId of plannedCaseIds) {
        if (accountedFor.has(caseId)) continue;
        casesResult.push({
          id: caseId,
          title: caseId,
          result: 'not_run',
          not_run_reason: 'Interrupción crítica de la ejecución antes de completar el caso',
          duration_ms: 0,
        });
        accountedFor.add(caseId);
      }
      totalPassed = casesResult.filter(item => item.result === 'passed').length;
      totalFailed = casesResult.filter(item => item.result === 'failed').length;
      totalNotRun = casesResult.filter(item => item.result === 'not_run').length;
    } finally {
      if (options.signal) {
        options.signal.removeEventListener('abort', abortListener);
      }
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
    if (unexpectedlyInterrupted) {
      overallResult = 'error';
    } else if (total === 0 || totalPassed === 0) {
      overallResult = 'failed';
    } else if (totalPassed === total) {
      overallResult = 'passed';
    } else {
      overallResult = 'partial';
    }

    return {
      _version: '1',
      execution_id: executionId,
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
