import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { restrictChromiumPage, type StorageState } from '@qap/auth';
import type { IRunner } from '@qap/engine';
import { FileSystemStorage, LockManager, DependencyGraphResolver } from '@qap/knowledge';
import type {
  TestPlan,
  TestOptions,
  ExecutionResult,
  ExecutionStatus,
  ExecutionArtifactError,
  ExecutionTimelineStep,
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
  executeScreenshotWithMetadata,
  executeCapture,
  executeSwitchAuth,
  executeEvaluate,
} from './actions/index.js';
import { interpolateStep } from './context/interpolator.js';
import { caseExecutionBlockReason } from './case-execution-policy.js';
import {
  ensureConfinedDir,
  extractSecretsFromStorageState,
  installEvidenceDomSanitizer,
  isSensitiveSelectorOrField,
  maskSensitiveDomBeforeCapture,
  persistRuntimeEvidenceBundle,
  resolveConfinedArtifactPath,
  sanitizeEvidenceText,
  sanitizePlaywrightTraceZip,
} from './evidence-artifacts.js';
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
  /** Identificador del intento para vincular artefactos físicos (P0.4). */
  attemptId?: string;
  recordVideo?: boolean;
  recordTrace?: boolean;
  captureFocusedOnAssert?: boolean;
  redactSecrets?: string[];
  artifactFaultInjection?: {
    failVideo?: boolean;
    failTrace?: boolean;
    failScreenshot?: boolean;
    failTimeline?: boolean;
  };
}

export function extractFlowVariables(contextData?: Record<string, unknown>): Record<string, string> {
  if (!contextData) return {};
  const result: Record<string, string> = {};
  for (const [key, val] of Object.entries(contextData)) {
    if (key === 'flow' || key === '_capturedBuffer') continue;
    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
      result[key] = String(val);
    }
  }
  const flowObj = contextData.flow;
  if (typeof flowObj === 'object' && flowObj !== null && !Array.isArray(flowObj)) {
    for (const [key, val] of Object.entries(flowObj as Record<string, unknown>)) {
      if (val !== undefined && val !== null) {
        result[key] = String(val);
      }
    }
  }
  return result;
}

export class PlaywrightRunner implements IRunner {
  constructor(private readonly defaults?: { projectRoot?: string }) {}

  public async execute(
    plan: TestPlan,
    options: PlaywrightRunnerOptions = {}
  ): Promise<ExecutionResult> {
    const startedAt = new Date().toISOString();
    // One stable collision-resistant identifier for every exit path of this run.
    const executionId = `exec_${Date.now()}_${randomUUID().replace(/-/g, '')}`;
    const rawProjectRoot = options.projectRoot ?? this.defaults?.projectRoot;
    const projectRoot = rawProjectRoot ? path.resolve(rawProjectRoot) : process.cwd();
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

    const flowVariables = extractFlowVariables(options.context_data);

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

      // 1. Adquirir lock con LockManager.acquireModuleLock() si el caller no es ya dueño del lock
      if (moduleName && !options.lock_owned_by_caller) {
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

      const attemptId = options.attemptId ?? null;
      const runArtifactId = (attemptId ?? executionId).replace(/[^a-zA-Z0-9._-]/g, '_');
      const runtimeRunDirRel = `.qa/runtime/runs/${runArtifactId}`;
      const runtimeArtifactsDirRel = `${runtimeRunDirRel}/artifacts`;
      const rawVideoDirRel = `${runtimeRunDirRel}/video-tmp`;

      const isRealBrowser =
        typeof (browser as unknown as { version?: unknown })?.version === 'function';
      const shouldRecordPhysicalArtifacts =
        !options.interactiveReadOnly &&
        ((isRealBrowser && Boolean(rawProjectRoot)) ||
          options.attemptId !== undefined ||
          options.recordVideo !== undefined ||
          options.recordTrace !== undefined ||
          options.artifactFaultInjection !== undefined);

      const collectedSecrets: string[] = [
        ...(options.redactSecrets ?? []),
        ...extractSecretsFromStorageState(storageState),
      ];
      if (options.extraHTTPHeaders) {
        for (const [hdrName, hdrVal] of Object.entries(options.extraHTTPHeaders)) {
          if (isSensitiveSelectorOrField(hdrName, hdrVal) && typeof hdrVal === 'string' && hdrVal.trim().length >= 4) {
            collectedSecrets.push(hdrVal.trim());
          }
        }
      }

      const artifactErrors: ExecutionArtifactError[] = [];
      const attemptTimeline: ExecutionTimelineStep[] = [];
      const allScreenshots: string[] = [];
      let videoRelativePath: string | null = null;
      let traceZipRelativePath: string | null = null;
      let timelineRelativePath: string | null = null;

      let rawVideoDirAbs: string | null = null;
      if (shouldRecordPhysicalArtifacts && options.recordVideo !== false) {
        if (options.artifactFaultInjection?.failVideo) {
          artifactErrors.push({
            artifact: 'video',
            message: 'Fallo de captura de video WebM (inyección de fallo o directorio no disponible).',
          });
        } else if (isRealBrowser) {
          try {
            rawVideoDirAbs = ensureConfinedDir(projectRoot, rawVideoDirRel);
          } catch (videoDirErr: unknown) {
            const msg = videoDirErr instanceof Error ? videoDirErr.message : String(videoDirErr);
            artifactErrors.push({
              artifact: 'video',
              message: sanitizeEvidenceText(msg, collectedSecrets),
            });
          }
        }
      }

      const newContextOpts: BrowserContextOptions = {
        ...(storageState ? { storageState } : {}),
        ...(options.extraHTTPHeaders ? { extraHTTPHeaders: options.extraHTTPHeaders } : {}),
        ...(options.interactiveReadOnly ? { serviceWorkers: 'block', acceptDownloads: false } : {}),
        ...(rawVideoDirAbs ? { recordVideo: { dir: rawVideoDirAbs, size: { width: 1280, height: 720 } } } : {}),
      };
      context = await browser!.newContext(Object.keys(newContextOpts).length > 0 ? newContextOpts : undefined);
      checkCancellation();

      if (options.contextSetup) {
        await options.contextSetup(context);
      }
      checkCancellation();

      let tracingStarted = false;
      if (shouldRecordPhysicalArtifacts && options.recordTrace !== false) {
        if (options.artifactFaultInjection?.failTrace) {
          artifactErrors.push({
            artifact: 'trace.zip',
            message: 'Fallo al iniciar o guardar trace.zip del intento.',
          });
        } else {
          const ctxTracing = (context as unknown as {
            tracing?: { start?: (opts: Record<string, unknown>) => Promise<void> };
          })?.tracing;
          if (ctxTracing && typeof ctxTracing.start === 'function') {
            try {
              await ctxTracing.start({ screenshots: true, snapshots: true, sources: false });
              tracingStarted = true;
            } catch (traceStartErr: unknown) {
              const msg = traceStartErr instanceof Error ? traceStartErr.message : String(traceStartErr);
              artifactErrors.push({
                artifact: 'trace.zip',
                message: sanitizeEvidenceText(msg, collectedSecrets),
              });
            }
          }
        }
      }

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
      if (shouldRecordPhysicalArtifacts) {
        await installEvidenceDomSanitizer(context, page);
      }
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
        const caseScreenshots: string[] = [];
        const caseArtifactErrors: string[] = [];
        let activeStepIndex = 0;
        let activeStepType = 'execute';
        let activeStepSelector: string | null = null;
        let activeStepExpected: string | null = null;
        let activeStepStartedAt = new Date().toISOString();
        let activeStepStartMs = Date.now();
        let activeStepRedactedCount = 0;

        try {
          if (!moduleName) {
            throw new Error(`No se puede ejecutar el caso '${caseId}': el plan no especifica ningún módulo.`);
          }

          if (!testCase) {
            throw new Error(`No se encontró el caso '${caseId}' para el módulo '${moduleName}'.`);
          }

          const steps = testCase.steps || [];
          for (const [sIdx, rawStep] of steps.entries()) {
            activeStepIndex = sIdx;
            activeStepType = rawStep.type;
            const step = interpolateStep(rawStep, contextVariables, flowVariables);
            const isSensitive = isSensitiveSelectorOrField(step.selector, step.value);
            if (isSensitive && typeof step.value === 'string' && step.value.trim().length >= 4) {
              collectedSecrets.push(step.value.trim());
            }
            activeStepSelector = step.selector ? sanitizeEvidenceText(step.selector, collectedSecrets) : null;
            activeStepRedactedCount = isSensitive ? 1 : 0;
            activeStepExpected = this.deriveStepExpected(step, isSensitive, collectedSecrets);
            activeStepStartedAt = new Date().toISOString();
            activeStepStartMs = Date.now();

            const stepRes = await this.executeStep(page, step, screenshotsDir, contextVariables, {
              caseId,
              stepIndex: sIdx,
              projectRoot,
              shouldRecordPhysicalArtifacts,
              captureFocusedOnAssert: options.captureFocusedOnAssert !== false,
              failScreenshot: Boolean(options.artifactFaultInjection?.failScreenshot),
              collectedSecrets,
              context_data: options.context_data,
            });

            if (shouldRecordPhysicalArtifacts && (step.type === 'navigate' || step.type === 'fill')) {
              await installEvidenceDomSanitizer(context, page);
              await maskSensitiveDomBeforeCapture(page);
            }

            const stepFinishedAt = new Date().toISOString();
            const stepDurationMs = Date.now() - activeStepStartMs;
            const sanitizedMsg = stepRes?.message
              ? sanitizeEvidenceText(stepRes.message, collectedSecrets)
              : undefined;
            const stepExpected =
              stepRes?.expected !== undefined
                ? sanitizeEvidenceText(stepRes.expected, collectedSecrets)
                : activeStepExpected;
            const stepObserved =
              stepRes?.observed !== undefined
                ? sanitizeEvidenceText(stepRes.observed, collectedSecrets)
                : this.deriveStepObserved(page, step, isSensitive, sanitizedMsg, collectedSecrets);

            if (stepRes?.screenshot) {
              caseScreenshots.push(stepRes.screenshot);
              allScreenshots.push(stepRes.screenshot);
            }
            if (stepRes?.artifact_error) {
              caseArtifactErrors.push(stepRes.artifact_error);
              artifactErrors.push({
                artifact: 'screenshot',
                case_id: caseId,
                step_index: sIdx,
                message: stepRes.artifact_error,
              });
            }

            const executedStepEntry: NonNullable<ExecutedCase['steps']>[number] = {
              step_index: sIdx,
              action: stepRes?.action ?? step.type,
              ...(activeStepSelector ? { selector: activeStepSelector } : {}),
              ...(stepExpected !== null && stepExpected !== undefined ? { expected: stepExpected } : {}),
              ...(stepObserved !== null && stepObserved !== undefined ? { observed: stepObserved } : {}),
              started_at: activeStepStartedAt,
              finished_at: stepFinishedAt,
              status: stepRes?.status ?? 'passed',
              duration_ms: stepDurationMs,
              ...(sanitizedMsg ? { message: sanitizedMsg } : {}),
              ...(stepRes?.screenshot ? { screenshot: stepRes.screenshot } : {}),
              ...(stepRes?.focused_screenshot !== undefined
                ? { focused_screenshot: stepRes.focused_screenshot }
                : {}),
              ...(stepRes?.artifact_error ? { artifact_error: stepRes.artifact_error } : {}),
              ...(activeStepRedactedCount > 0
                ? { redacted_selectors_count: activeStepRedactedCount }
                : {}),
            };
            stepTrace.push(executedStepEntry);
            attemptTimeline.push({
              step_index: sIdx,
              case_id: caseId,
              action: executedStepEntry.action,
              selector: activeStepSelector ?? null,
              expected: stepExpected ?? null,
              observed: stepObserved ?? null,
              status: executedStepEntry.status,
              started_at: activeStepStartedAt,
              finished_at: stepFinishedAt,
              duration_ms: stepDurationMs,
              message: sanitizedMsg ?? null,
              screenshot: stepRes?.screenshot ?? null,
              ...(stepRes?.focused_screenshot !== undefined
                ? { focused_screenshot: stepRes.focused_screenshot }
                : {}),
              ...(activeStepRedactedCount > 0
                ? { redacted_selectors_count: activeStepRedactedCount }
                : {}),
              ...(stepRes?.artifact_error ? { artifact_error: stepRes.artifact_error } : {}),
            });
          }
          totalPassed++;
          executedStatuses.set(caseId, 'passed');
        } catch (err: unknown) {
          caseResult = 'failed';
          totalFailed++;
          executedStatuses.set(caseId, 'failed');
          const rawErrMessage = options.interactiveReadOnly
            ? 'El paso no se completó.'
            : err instanceof Error
              ? err.message
              : String(err);
          errorMessage = sanitizeEvidenceText(rawErrMessage, collectedSecrets);

          const errWithObs = err as { expected?: string | null; observed?: string | null } | null;
          const failedExpected =
            errWithObs?.expected !== undefined && errWithObs?.expected !== null
              ? sanitizeEvidenceText(errWithObs.expected, collectedSecrets)
              : activeStepExpected;
          const failedObserved =
            errWithObs?.observed !== undefined && errWithObs?.observed !== null
              ? sanitizeEvidenceText(errWithObs.observed, collectedSecrets)
              : errorMessage;

          let failureFocusedScreenshot = false;
          let failureArtifactError: string | null = null;
          try {
            if (!options.interactiveReadOnly) {
              if (options.artifactFaultInjection?.failScreenshot) {
                throw new Error('Fallo inyectado al capturar screenshot del paso fallido.');
              }
              const shotMeta = await executeScreenshotWithMetadata(
                page,
                {
                  type: 'screenshot',
                  selector: activeStepSelector ?? undefined,
                  filename: `failure_${caseId}_step_${activeStepIndex}_${Date.now()}.png`,
                  timeout: 2000,
                },
                screenshotsDir,
              );
              failureScreenshotPath = shotMeta.targetPath
                ? path.relative(projectRoot, shotMeta.targetPath).replace(/\\/g, '/')
                : undefined;
              failureFocusedScreenshot = shotMeta.focused;
              if (failureScreenshotPath) {
                caseScreenshots.push(failureScreenshotPath);
                allScreenshots.push(failureScreenshotPath);
              }
            }
          } catch (shotErr: unknown) {
            const rawShotMsg = shotErr instanceof Error ? shotErr.message : String(shotErr);
            failureArtifactError = sanitizeEvidenceText(rawShotMsg, collectedSecrets);
            caseArtifactErrors.push(failureArtifactError);
            artifactErrors.push({
              artifact: 'screenshot',
              case_id: caseId,
              step_index: activeStepIndex,
              message: failureArtifactError,
            });
          }

          const stepFinishedAt = new Date().toISOString();
          const stepDurationMs = Math.max(0, Date.now() - activeStepStartMs);
          stepTrace.push({
            step_index: activeStepIndex,
            action: activeStepType,
            ...(activeStepSelector ? { selector: activeStepSelector } : {}),
            ...(failedExpected !== null && failedExpected !== undefined ? { expected: failedExpected } : {}),
            ...(failedObserved !== null && failedObserved !== undefined ? { observed: failedObserved } : {}),
            started_at: activeStepStartedAt,
            finished_at: stepFinishedAt,
            duration_ms: stepDurationMs,
            status: 'failed',
            message: errorMessage,
            screenshot: failureScreenshotPath ?? null,
            focused_screenshot: failureFocusedScreenshot,
            ...(failureArtifactError ? { artifact_error: failureArtifactError } : {}),
            ...(activeStepRedactedCount > 0
              ? { redacted_selectors_count: activeStepRedactedCount }
              : {}),
          });
          attemptTimeline.push({
            step_index: activeStepIndex,
            case_id: caseId,
            action: activeStepType,
            selector: activeStepSelector ?? null,
            expected: failedExpected ?? null,
            observed: failedObserved ?? null,
            status: 'failed',
            started_at: activeStepStartedAt,
            finished_at: stepFinishedAt,
            duration_ms: stepDurationMs,
            message: errorMessage ?? null,
            screenshot: failureScreenshotPath ?? null,
            focused_screenshot: failureFocusedScreenshot,
            ...(activeStepRedactedCount > 0
              ? { redacted_selectors_count: activeStepRedactedCount }
              : {}),
            ...(failureArtifactError ? { artifact_error: failureArtifactError } : {}),
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
              ...(caseScreenshots.length > 0 ? { screenshots: Array.from(new Set(caseScreenshots)) } : {}),
              ...(caseArtifactErrors.length > 0 ? { artifact_errors: caseArtifactErrors } : {}),
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
            ...(caseScreenshots.length > 0 ? { screenshots: Array.from(new Set(caseScreenshots)) } : {}),
            ...(caseArtifactErrors.length > 0 ? { artifact_errors: caseArtifactErrors } : {}),
          };

          casesResult.push(executedCase);
        }
      }

      // 4. Finalizar artefactos físicos de evidencia (trace.zip, WebM, timeline.json) ANTES de retornar/publicar
      if (shouldRecordPhysicalArtifacts) {
        await maskSensitiveDomBeforeCapture(page);

        const pageVideo =
          !options.interactiveReadOnly &&
          typeof (page as unknown as { video?: () => { path?: () => Promise<string>; saveAs?: (p: string) => Promise<void> } | null }).video === 'function'
            ? (page as unknown as { video: () => { path?: () => Promise<string>; saveAs?: (p: string) => Promise<void> } | null }).video()
            : null;

        // 4a. Finalizar y sanear trace.zip antes de cerrar el contexto
        if (context && typeof (context as unknown as { cookies?: () => Promise<Array<{ value?: string }>> }).cookies === 'function') {
          try {
            const liveCookies = await context.cookies();
            for (const ck of liveCookies) {
              if (typeof ck?.value === 'string' && ck.value.trim().length >= 4) {
                collectedSecrets.push(ck.value.trim());
              }
            }
          } catch {
            // Ignore if context cookies cannot be read
          }
        }
        if (options.recordTrace !== false && tracingStarted && !options.artifactFaultInjection?.failTrace) {
          const ctxTracing = (context as unknown as {
            tracing?: { stop?: (opts: { path: string }) => Promise<void> };
          })?.tracing;
          if (ctxTracing && typeof ctxTracing.stop === 'function') {
            try {
              ensureConfinedDir(projectRoot, runtimeArtifactsDirRel);
              const traceRel = `${runtimeArtifactsDirRel}/trace.zip`;
              const traceAbs = resolveConfinedArtifactPath(projectRoot, traceRel);
              await ctxTracing.stop({ path: traceAbs });
              sanitizePlaywrightTraceZip(traceAbs, collectedSecrets);
              traceZipRelativePath = traceRel;
            } catch (traceStopErr: unknown) {
              const msg = traceStopErr instanceof Error ? traceStopErr.message : String(traceStopErr);
              artifactErrors.push({
                artifact: 'trace.zip',
                message: sanitizeEvidenceText(msg, collectedSecrets),
              });
            }
          }
        }

        // 4b. Cerrar página y contexto para que Playwright vuelque y cierre el archivo WebM en disco
        const closingContext = context;
        context = null;
        await (page as unknown as { close?: () => Promise<void> }).close?.().catch(() => {});
        if (closingContext) {
          await closingContext.close().catch(() => {});
        }

        if (options.recordVideo !== false && !options.artifactFaultInjection?.failVideo && pageVideo) {
          try {
            ensureConfinedDir(projectRoot, runtimeArtifactsDirRel);
            const videoRel = `${runtimeArtifactsDirRel}/attempt.webm`;
            const videoAbs = resolveConfinedArtifactPath(projectRoot, videoRel);
            if (typeof pageVideo.saveAs === 'function') {
              await pageVideo.saveAs(videoAbs);
            } else if (typeof pageVideo.path === 'function') {
              const rawVideoFile = await pageVideo.path();
              if (rawVideoFile && fs.existsSync(rawVideoFile)) {
                fs.copyFileSync(rawVideoFile, videoAbs);
              }
            }
            if (rawVideoDirAbs && fs.existsSync(rawVideoDirAbs)) {
              fs.rmSync(rawVideoDirAbs, { recursive: true, force: true });
            }
            if (fs.existsSync(videoAbs) && fs.statSync(videoAbs).size > 0) {
              videoRelativePath = videoRel;
            } else {
              artifactErrors.push({
                artifact: 'video',
                message: 'El archivo WebM del intento quedó vacío o no se materializó tras cerrar el contexto.',
              });
            }
          } catch (videoErr: unknown) {
            const msg = videoErr instanceof Error ? videoErr.message : String(videoErr);
            artifactErrors.push({
              artifact: 'video',
              message: sanitizeEvidenceText(msg, collectedSecrets),
            });
          } finally {
            if (rawVideoDirAbs && fs.existsSync(rawVideoDirAbs)) {
              try {
                fs.rmSync(rawVideoDirAbs, { recursive: true, force: true });
              } catch {
                // Ignore temp video cleanup error
              }
            }
          }
        }

        // 4c. Persistir timeline.json, run.json y registro de retención en .qa/runtime/qap.sqlite
        if (options.artifactFaultInjection?.failTimeline) {
          artifactErrors.push({
            artifact: 'timeline',
            message: 'Fallo inyectado al persistir timeline.json del intento.',
          });
        } else {
          const totalDurationSoFar = Math.max(0, Date.now() - new Date(startedAt).getTime());
          const runtimeStatus =
            unexpectedlyInterrupted
              ? 'error'
              : totalFailed > 0 && totalPassed === 0
                ? 'failed'
                : totalFailed === 0 && totalPassed > 0
                  ? 'passed'
                  : 'partial';
          const bundleRes = persistRuntimeEvidenceBundle({
            projectRoot,
            runId: runArtifactId,
            moduleKey: moduleName || 'default',
            status: runtimeStatus,
            timestamp: startedAt,
            durationMs: totalDurationSoFar,
            totalCases: totalPassed + totalFailed + totalSkipped + totalNotRun,
            passed: totalPassed,
            failed: totalFailed,
            skipped: totalSkipped + totalNotRun,
            videoRelativePath,
            traceRelativePath: traceZipRelativePath,
            timelineRelativePath: `${runtimeArtifactsDirRel}/timeline.json`,
            timeline: attemptTimeline,
            artifactErrors,
          });
          if (bundleRes.timelineRelativePath) {
            timelineRelativePath = bundleRes.timelineRelativePath;
          }
          if (bundleRes.error) {
            artifactErrors.push({
              artifact: 'timeline',
              message: bundleRes.error,
            });
          }
        }

        // Enlazar artefactos en cada caso ejecutado del intento
        const errMessages = artifactErrors.map((e) => `${e.artifact}: ${e.message}`);
        for (const c of casesResult) {
          if (attemptId) c.attempt_id = attemptId;
          if (videoRelativePath) c.video_path = videoRelativePath;
          if (traceZipRelativePath) c.trace_zip_path = traceZipRelativePath;
          if (timelineRelativePath) c.timeline_path = timelineRelativePath;
          if (errMessages.length > 0) {
            c.artifact_errors = Array.from(new Set([...(c.artifact_errors ?? []), ...errMessages]));
          }
        }

        return {
          _version: '1',
          execution_id: executionId,
          module: moduleName,
          env,
          started_at: startedAt,
          finished_at: new Date().toISOString(),
          result:
            unexpectedlyInterrupted
              ? 'error'
              : totalPassed + totalFailed + totalSkipped + totalNotRun === 0 || totalPassed === 0
                ? 'failed'
                : totalPassed === totalPassed + totalFailed + totalSkipped + totalNotRun
                  ? 'passed'
                  : 'partial',
          timed_out: timedOut,
          summary: {
            total: totalPassed + totalFailed + totalSkipped + totalNotRun,
            passed: totalPassed,
            failed: totalFailed,
            skipped: totalSkipped,
            not_run: totalNotRun,
          },
          ...(attemptId ? { attempt_id: attemptId } : {}),
          artifacts: {
            video_path: videoRelativePath,
            trace_zip_path: traceZipRelativePath,
            timeline_path: timelineRelativePath,
            screenshots: Array.from(new Set(allScreenshots)),
            ...(artifactErrors.length > 0 ? { artifact_errors: artifactErrors } : {}),
          },
          timeline: attemptTimeline,
          cases: casesResult,
        };
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

  private deriveStepExpected(
    step: TCStep,
    isSensitive: boolean,
    extraSecrets: readonly string[],
  ): string | null {
    if (isSensitive && step.type === 'fill') {
      return '[REDACTED]';
    }
    switch (step.type) {
      case 'navigate':
        return step.url ? sanitizeEvidenceText(step.url, extraSecrets) : null;
      case 'fill':
        return step.value !== undefined ? sanitizeEvidenceText(String(step.value), extraSecrets) : null;
      case 'assert':
        if (step.expected !== undefined) return sanitizeEvidenceText(String(step.expected), extraSecrets);
        if (step.expected_count !== undefined) return String(step.expected_count);
        return step.assertion_type ?? 'visible';
      case 'capture':
        return step.capture_as ? `capture:${step.capture_as}` : (step.selector ?? 'capture');
      case 'click':
      case 'waitFor':
      case 'screenshot':
        return step.selector ? sanitizeEvidenceText(step.selector, extraSecrets) : step.type;
      default:
        return step.selector ? sanitizeEvidenceText(step.selector, extraSecrets) : step.type;
    }
  }

  private deriveStepObserved(
    page: Page,
    step: TCStep,
    isSensitive: boolean,
    stepMsg: string | undefined,
    extraSecrets: readonly string[],
  ): string | null {
    if (isSensitive && step.type === 'fill') {
      return '[REDACTED]';
    }
    switch (step.type) {
      case 'navigate': {
        const currentUrl =
          typeof (page as unknown as { url?: () => string }).url === 'function'
            ? page.url()
            : step.url;
        return currentUrl ? sanitizeEvidenceText(currentUrl, extraSecrets) : 'navigated';
      }
      case 'fill':
        return 'filled';
      case 'click':
        return 'clicked';
      case 'waitFor':
        return 'ready';
      case 'capture':
        return stepMsg ? sanitizeEvidenceText(stepMsg, extraSecrets) : 'captured';
      default:
        return stepMsg ? sanitizeEvidenceText(stepMsg, extraSecrets) : 'passed';
    }
  }

  private async executeStep(
    page: Page,
    step: TCStep,
    screenshotsDir: string = '.qa/reports/screenshots',
    contextVariables: Record<string, string> = {},
    captureContext?: {
      caseId?: string;
      stepIndex?: number;
      projectRoot?: string;
      shouldRecordPhysicalArtifacts?: boolean;
      captureFocusedOnAssert?: boolean;
      failScreenshot?: boolean;
      collectedSecrets?: readonly string[];
      context_data?: Record<string, unknown>;
    }
  ): Promise<{
    action: string;
    status: string;
    message?: string;
    expected?: string | null;
    observed?: string | null;
    screenshot?: string | null;
    focused_screenshot?: boolean;
    artifact_error?: string | null;
  }> {
    let stepMsg: string | undefined;
    let stepExpected: string | null | undefined;
    let stepObserved: string | null | undefined;
    let stepScreenshot: string | null | undefined;
    let stepFocusedScreenshot: boolean | undefined;
    let stepArtifactError: string | null | undefined;
    const projectRoot = captureContext?.projectRoot ?? process.cwd();
    const secrets = captureContext?.collectedSecrets ?? [];

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
      case 'assert': {
        const assertObs = await executeAssert(page, step);
        stepExpected = assertObs.expected;
        stepObserved = assertObs.observed;
        if (
          captureContext?.shouldRecordPhysicalArtifacts &&
          captureContext?.captureFocusedOnAssert !== false &&
          step.selector
        ) {
          try {
            if (captureContext.failScreenshot) {
              throw new Error('Fallo inyectado al capturar captura enfocada en paso assert.');
            }
            const shotMeta = await executeScreenshotWithMetadata(
              page,
              {
                type: 'screenshot',
                selector: step.selector,
                filename: `assert_${captureContext.caseId ?? 'case'}_step_${captureContext.stepIndex ?? 0}_${Date.now()}.png`,
                timeout: 2000,
              },
              screenshotsDir,
            );
            stepScreenshot = shotMeta.targetPath
              ? path.relative(projectRoot, shotMeta.targetPath).replace(/\\/g, '/')
              : null;
            stepFocusedScreenshot = shotMeta.focused;
          } catch (shotErr: unknown) {
            const rawMsg = shotErr instanceof Error ? shotErr.message : String(shotErr);
            stepArtifactError = sanitizeEvidenceText(rawMsg, secrets);
          }
        }
        break;
      }
      case 'waitFor':
        await executeWaitFor(page, step);
        break;
      case 'screenshot': {
        try {
          if (captureContext?.failScreenshot) {
            throw new Error('Fallo inyectado al ejecutar paso screenshot.');
          }
          const shotMeta = await executeScreenshotWithMetadata(page, step, screenshotsDir);
          stepScreenshot = shotMeta.targetPath
            ? path.relative(projectRoot, shotMeta.targetPath).replace(/\\/g, '/')
            : null;
          stepFocusedScreenshot = shotMeta.focused;
          stepObserved = stepScreenshot ?? 'captured';
        } catch (shotErr: unknown) {
          const rawMsg = shotErr instanceof Error ? shotErr.message : String(shotErr);
          stepArtifactError = sanitizeEvidenceText(rawMsg, secrets);
          stepObserved = 'screenshot_capture_failed';
        }
        break;
      }
      case 'capture': {
        const capturedVal = await executeCapture(page, step, contextVariables, {
          caseId: captureContext?.caseId,
          context_data: captureContext?.context_data,
        });
        const isSensitiveCapture = isSensitiveSelectorOrField(step.selector, capturedVal) ||
          isSensitiveSelectorOrField(step.capture_as, capturedVal);
        stepObserved = isSensitiveCapture ? '[REDACTED]' : sanitizeEvidenceText(capturedVal, secrets);
        stepMsg = JSON.stringify({
          captured_as: step.capture_as,
          value: isSensitiveCapture ? '[REDACTED]' : sanitizeEvidenceText(capturedVal, secrets),
        });
        break;
      }
      case 'switch_auth':
        await executeSwitchAuth(page, step);
        break;
      case 'evaluate': {
        const stepExt = step as unknown as {
          sandbox?: boolean;
          args?: Record<string, unknown>;
        };
        await executeEvaluate(page, step, contextVariables, {
          sandbox: stepExt.sandbox !== false,
          args: stepExt.args,
        });
        break;
      }
      default: {
        const unknownType = (step as { type?: string })?.type ?? 'desconocido';
        throw new Error(`Acción o tipo de paso no soportado o desconocido: '${unknownType}'`);
      }
    }

    return {
      action: step.type,
      status: 'passed',
      ...(stepMsg ? { message: stepMsg } : {}),
      ...(stepExpected !== undefined ? { expected: stepExpected } : {}),
      ...(stepObserved !== undefined ? { observed: stepObserved } : {}),
      ...(stepScreenshot !== undefined ? { screenshot: stepScreenshot } : {}),
      ...(stepFocusedScreenshot !== undefined ? { focused_screenshot: stepFocusedScreenshot } : {}),
      ...(stepArtifactError !== undefined ? { artifact_error: stepArtifactError } : {}),
    };
  }
}
