import type {
  ExecutionResult,
  FlowDefinition,
  FlowExecutionResult,
  FlowOptions,
  TCCase,
  TestOptions,
  TestPlan,
} from '@qap/shared';

import type {
  IFlowLockProvider,
  IFlowRunner,
  IFlowStateStore,
  IFlowTelemetry,
  IRunner,
  IStorage,
} from './ports.js';

interface FlowStepRef {
  module: string;
  cases?: string[];
  tags?: string[];
}

interface FlowWithOptionalExtensions extends FlowDefinition {
  steps?: FlowStepRef[];
  teardown?: {
    on_failure?: unknown;
  };
}

interface FlowOptionsWithContext extends FlowOptions {
  context_data?: Record<string, unknown>;
}

function isRollbackOnFailure(onFailure: unknown): boolean {
  if (onFailure === 'rollback_storage_state') return true;
  if (!Array.isArray(onFailure)) return false;
  return onFailure.some((item: unknown) => {
    if (item === 'rollback_storage_state') return true;
    if (typeof item === 'object' && item !== null) {
      const r = item as { type?: unknown; action?: unknown };
      return r.type === 'rollback_storage_state' || r.action === 'rollback_storage_state';
    }
    return false;
  });
}

function isRunnerPassed(res: ExecutionResult): boolean {
  if (res.result === 'passed') return true;
  const legacy = res as unknown as { status?: unknown; success?: unknown };
  return legacy.success === true || legacy.status === 'success' || legacy.status === 'passed';
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function matchesAnyTag(caseTags: readonly string[], tagsToMatch: readonly string[]): boolean {
  if (tagsToMatch.length === 0) return true;
  return tagsToMatch.some((tag) => caseTags.includes(tag));
}

type ParsedPlanCaseEntry =
  | { kind: 'id'; id: string }
  | { kind: 'inline'; id: string; raw: Record<string, unknown> };

interface ParsedPlanCases {
  hasCasesField: boolean;
  entries: ParsedPlanCaseEntry[];
  inlineById: Map<string, Record<string, unknown>>;
}

function validateFlowStepSelection(rawStep: FlowStepRef, moduleName: string): void {
  if (rawStep.cases !== undefined) {
    if (!Array.isArray(rawStep.cases) || rawStep.cases.some((id) => !isNonEmptyString(id))) {
      throw new Error(
        `Contrato inválido en flow.modules['${moduleName}'].cases: se esperan IDs string no vacíos.`
      );
    }
  }
  if (rawStep.tags !== undefined && !isStringArray(rawStep.tags)) {
    throw new Error(
      `Contrato inválido en flow.modules['${moduleName}'].tags: se esperan etiquetas string.`
    );
  }
}

/**
 * Validates and classifies TestPlan.cases entries into canonical ID references
 * vs supported inline case definitions, rejecting malformed or historical
 * out-of-contract representations instead of running them silently.
 */
function parsePlanCases(rawCasesField: unknown, moduleName: string): ParsedPlanCases {
  if (rawCasesField === undefined) {
    return { hasCasesField: false, entries: [], inlineById: new Map() };
  }
  if (!Array.isArray(rawCasesField)) {
    throw new Error(
      `Contrato inválido en TestPlan.cases para el módulo '${moduleName}': debe ser un arreglo.`
    );
  }

  const entries: ParsedPlanCaseEntry[] = [];
  const inlineById = new Map<string, Record<string, unknown>>();

  for (const entry of rawCasesField) {
    if (typeof entry === 'string') {
      if (!isNonEmptyString(entry)) {
        throw new Error(
          `Contrato inválido en TestPlan.cases para el módulo '${moduleName}': ID de caso vacío.`
        );
      }
      entries.push({ kind: 'id', id: entry });
      continue;
    }

    if (!isPlainObject(entry)) {
      throw new Error(
        `Contrato inválido en TestPlan.cases para el módulo '${moduleName}': cada caso debe ser un ID string o un objeto inline válido.`
      );
    }

    if (!isNonEmptyString(entry.id)) {
      throw new Error(
        `Contrato inválido en caso inline del módulo '${moduleName}': falta 'id' string no vacío.`
      );
    }
    if (!Array.isArray(entry.steps)) {
      throw new Error(
        `Contrato inválido en caso inline '${entry.id}' del módulo '${moduleName}': falta arreglo 'steps'.`
      );
    }
    for (const step of entry.steps) {
      if (!isPlainObject(step) || !isNonEmptyString(step.type)) {
        throw new Error(
          `Contrato inválido en caso inline '${entry.id}' del módulo '${moduleName}': cada paso debe ser un objeto con 'type' string no vacío.`
        );
      }
    }
    if (entry.tags !== undefined && !isStringArray(entry.tags)) {
      throw new Error(
        `Contrato inválido en caso inline '${entry.id}' del módulo '${moduleName}': 'tags' debe ser un arreglo de strings.`
      );
    }
    if (entry.depends_on !== undefined && !isStringArray(entry.depends_on)) {
      throw new Error(
        `Contrato inválido en caso inline '${entry.id}' del módulo '${moduleName}': 'depends_on' debe ser un arreglo de strings.`
      );
    }
    if (
      (entry.name !== undefined && typeof entry.name !== 'string') ||
      (entry.title !== undefined && typeof entry.title !== 'string') ||
      (entry._version !== undefined && typeof entry._version !== 'string')
    ) {
      throw new Error(
        `Contrato inválido en caso inline '${entry.id}' del módulo '${moduleName}': metadatos de texto inválidos.`
      );
    }
    if (inlineById.has(entry.id)) {
      throw new Error(
        `Contrato inválido en TestPlan.cases para el módulo '${moduleName}': caso inline duplicado '${entry.id}'.`
      );
    }

    inlineById.set(entry.id, entry);
    entries.push({ kind: 'inline', id: entry.id, raw: entry });
  }

  return { hasCasesField: true, entries, inlineById };
}

function collectCapturedVariables(
  moduleName: string,
  capturedBuffer: unknown,
  contextSharing: FlowDefinition['context_sharing'],
  target: Record<string, string>
): void {
  if (typeof capturedBuffer !== 'object' || capturedBuffer === null || Array.isArray(capturedBuffer)) {
    return;
  }

  const bufferByCase = capturedBuffer as Record<string, Record<string, string>>;

  for (const caseCaptures of Object.values(bufferByCase)) {
    if (typeof caseCaptures !== 'object' || caseCaptures === null) continue;
    for (const [key, val] of Object.entries(caseCaptures)) {
      if (typeof val === 'string') {
        target[key] = val;
      }
    }
  }

  if (Array.isArray(contextSharing)) {
    for (const rule of contextSharing) {
      if (rule.from_module !== moduleName) continue;
      const val = bufferByCase[rule.from_case]?.[rule.capture];
      if (typeof val === 'string') {
        target[rule.as] = val;
      }
    }
  }
}

export class FlowOrchestrator implements IFlowRunner {
  constructor(
    private readonly storage: IStorage,
    private readonly runner: IRunner,
    private readonly lockProvider?: IFlowLockProvider,
    private readonly flowStore?: IFlowStateStore,
    private readonly telemetry?: IFlowTelemetry
  ) {}

  private interpolateValue(
    value: unknown,
    sharedVars: Record<string, string>,
    contextType: 'text' | 'selector' | 'url'
  ): unknown {
    if (typeof value !== 'string') return value;

    return value.replace(/\$\{flow\.([a-zA-Z0-9_.-]+)\}/g, (_, varName: string) => {
      const val = sharedVars[varName];
      if (val === undefined) {
        throw new Error(`flow_context_missing: Variable de flujo '${varName}' no encontrada en el contexto.`);
      }

      if (contextType === 'selector') {
        const globalCSS = (globalThis as Record<string, unknown>).CSS as
          | { escape?: (s: string) => string }
          | undefined;
        return globalCSS?.escape ? globalCSS.escape(val) : escapeCssManual(val);
      }
      if (contextType === 'url') {
        return encodeURIComponent(val);
      }
      return val;
    });
  }

  private interpolateStep(
    step: Record<string, unknown>,
    sharedVars: Record<string, string>
  ): Record<string, unknown> {
    const interpolated: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(step)) {
      if (typeof val === 'string') {
        const cType = key === 'selector' || key === 'target' ? 'selector' : key === 'url' ? 'url' : 'text';
        interpolated[key] = this.interpolateValue(val, sharedVars, cType);
      } else if (val && typeof val === 'object') {
        interpolated[key] = JSON.parse(
          JSON.stringify(val, (_: string, subVal: unknown): unknown =>
            typeof subVal === 'string' ? this.interpolateValue(subVal, sharedVars, 'text') : subVal
          )
        );
      } else {
        interpolated[key] = val;
      }
    }
    return interpolated;
  }

  private prepareInlineCase(
    rawTc: Record<string, unknown>,
    sharedVars: Record<string, string>
  ): TCCase {
    const tcSteps = rawTc.steps as Array<Record<string, unknown>>;
    const interpolatedSteps = tcSteps.map((s) => this.interpolateStep(s, sharedVars));
    const caseId = rawTc.id as string;
    const rawName =
      typeof rawTc.name === 'string' && rawTc.name.trim().length > 0
        ? rawTc.name
        : typeof rawTc.title === 'string' && rawTc.title.trim().length > 0
          ? rawTc.title
          : caseId;

    return {
      ...(rawTc as unknown as TCCase),
      _version: typeof rawTc._version === 'string' && rawTc._version.trim().length > 0 ? rawTc._version : '1',
      id: caseId,
      name: rawName,
      steps: interpolatedSteps as TCCase['steps'],
    };
  }

  private emitTelemetry(flowName: string, moduleName: string, res: unknown): void {
    if (!this.telemetry) return;
    const rec = (res ?? {}) as Record<string, unknown>;
    const toStatus = (v: unknown): 'passed' | 'failed' | 'skipped' | 'not_run' =>
      v === 'passed' || v === 'success'
        ? 'passed'
        : v === 'not_run'
          ? 'not_run'
          : v === 'skipped'
            ? 'skipped'
            : 'failed';
    const text = (v: unknown, fallback: string): string =>
      typeof v === 'string' || typeof v === 'number' ? String(v) : fallback;
    const num = (v: unknown): number => (typeof v === 'number' ? v : 0);
    const extractReason = (item: Record<string, unknown>): string | undefined => {
      if (typeof item.not_run_reason === 'string' && item.not_run_reason.trim().length > 0) {
        return item.not_run_reason;
      }
      if (typeof item.error === 'string' && item.error.trim().length > 0) {
        return item.error;
      }
      if (typeof item.error === 'object' && item.error !== null) {
        const errMsg = (item.error as { message?: unknown }).message;
        if (typeof errMsg === 'string' && errMsg.trim().length > 0) {
          return errMsg;
        }
      }
      if (typeof item.message === 'string' && item.message.trim().length > 0) {
        return item.message;
      }
      if (Array.isArray(item.steps)) {
        for (const s of item.steps as Array<Record<string, unknown>>) {
          if (s && s.status === 'failed' && typeof s.message === 'string' && s.message.trim().length > 0) {
            return s.message;
          }
        }
      }
      if (typeof item.failure_type === 'string' && item.failure_type.trim().length > 0) {
        return item.failure_type;
      }
      return undefined;
    };

    const hasCasesArray = Array.isArray(rec.cases);
    const cases = hasCasesArray ? (rec.cases as Array<Record<string, unknown>>) : [];
    if (hasCasesArray && cases.length === 0) {
      return;
    }
    if (!hasCasesArray) {
      const topStatus = rec.result ?? (rec.success === true ? 'passed' : rec.status);
      const topReason = extractReason(rec);
      this.telemetry.onCaseEnd({
        flowName,
        module: moduleName,
        caseId: moduleName,
        status: toStatus(topStatus),
        durationMs: num(rec.duration_ms ?? rec.durationMs),
        ...(topReason ? { error: topReason } : {}),
      });
      return;
    }
    for (const c of cases) {
      const reason = extractReason(c);
      this.telemetry.onCaseEnd({
        flowName,
        module: moduleName,
        caseId: text(c.case_id ?? c.id, moduleName),
        status: toStatus(c.result ?? c.status),
        durationMs: num(c.duration_ms ?? c.durationMs),
        ...(reason ? { error: reason } : {}),
      });
    }
  }

  async executeFlow(flow: FlowDefinition, options: FlowOptions = {}): Promise<FlowExecutionResult> {
    const extFlow: FlowWithOptionalExtensions = flow;
    const flowName = extFlow.name || 'unknown-flow';
    const rawSteps: FlowStepRef[] = extFlow.steps ?? extFlow.modules ?? [];
    for (const rawStep of rawSteps) {
      if (!isPlainObject(rawStep) || !isNonEmptyString(rawStep.module)) {
        throw new Error('Contrato inválido en definición de flujo: cada paso debe especificar un módulo string no vacío.');
      }
    }
    const modulesToLock = rawSteps.map((step) => step.module);
    const failFast = extFlow.fail_fast !== false;
    const shouldRollback = isRollbackOnFailure(extFlow.teardown?.on_failure);

    const extOptions: FlowOptionsWithContext = options;
    const baseContextData = extOptions.context_data ?? {};
    const requestedTags = extOptions.tags ?? [];

    let isResumeCompleteNoOp = false;

    const executionLogic = async (): Promise<FlowExecutionResult> => {
      // Lectura de estado y respaldo de sesiones cifradas bajo el lock del flujo
      const existingState = this.flowStore?.loadState(flowName) ?? null;

      if (this.flowStore && (!existingState || !this.flowStore.hasSessionBackup(flowName))) {
        this.flowStore.backupSessions(flowName);
      }

      const startedAt = existingState?.started_at ?? new Date().toISOString();
      const sharedVariables: Record<string, string> = { ...(existingState?.shared_variables ?? {}) };
      const completedModules: string[] = [...(existingState?.completed_modules ?? [])];
      const moduleResults: Record<string, ExecutionResult> = {};
      let executedModulesThisRun = 0;

      try {
        for (const rawStep of rawSteps) {
          const moduleName = rawStep.module;

          if (completedModules.includes(moduleName)) {
            continue;
          }
          executedModulesThisRun++;

          validateFlowStepSelection(rawStep, moduleName);

          const testPlan = await this.storage.getTestPlan(moduleName);
          const testPlanRecord = testPlan as unknown as Record<string, unknown>;
          const parsedPlan = parsePlanCases(testPlanRecord.cases, moduleName);
          const hasInlineCases = parsedPlan.inlineById.size > 0;
          const hasExplicitModuleCases = Array.isArray(rawStep.cases) && rawStep.cases.length > 0;
          const hasExplicitModuleTags = Array.isArray(rawStep.tags) && rawStep.tags.length > 0;
          const effectiveTags = hasExplicitModuleTags ? rawStep.tags! : requestedTags;

          const matchesStorageCaseTags = async (
            caseId: string,
            tagsToMatch: readonly string[]
          ): Promise<boolean> => {
            if (tagsToMatch.length === 0) return true;
            const tc =
              typeof this.storage.getTestCase === 'function'
                ? await this.storage.getTestCase(moduleName, caseId)
                : null;
            const caseTags = Array.isArray(tc?.tags) ? tc.tags : [];
            return matchesAnyTag(caseTags, tagsToMatch);
          };

          const selectedInlineCases = new Map<string, TCCase>();
          let preparedCaseIds: string[] | undefined;
          let wasFilteredToEmpty = false;

          if (hasExplicitModuleCases) {
            const matchedIds: string[] = [];
            for (const caseId of rawStep.cases!) {
              const inlineTc = parsedPlan.inlineById.get(caseId);
              if (inlineTc) {
                const inlineTags = Array.isArray(inlineTc.tags) ? (inlineTc.tags as string[]) : [];
                if (matchesAnyTag(inlineTags, effectiveTags)) {
                  matchedIds.push(caseId);
                  selectedInlineCases.set(caseId, this.prepareInlineCase(inlineTc, sharedVariables));
                }
                continue;
              }
              if (await matchesStorageCaseTags(caseId, effectiveTags)) {
                matchedIds.push(caseId);
              }
            }
            preparedCaseIds = matchedIds;
            wasFilteredToEmpty = matchedIds.length === 0;
          } else if (hasInlineCases) {
            const matchedIds: string[] = [];
            for (const entry of parsedPlan.entries) {
              if (entry.kind === 'inline') {
                const inlineTags = Array.isArray(entry.raw.tags) ? (entry.raw.tags as string[]) : [];
                if (matchesAnyTag(inlineTags, effectiveTags)) {
                  matchedIds.push(entry.id);
                  selectedInlineCases.set(entry.id, this.prepareInlineCase(entry.raw, sharedVariables));
                }
              } else if (await matchesStorageCaseTags(entry.id, effectiveTags)) {
                matchedIds.push(entry.id);
              }
            }
            preparedCaseIds = matchedIds;
            wasFilteredToEmpty =
              (effectiveTags.length > 0 || parsedPlan.entries.length > 0) && matchedIds.length === 0;
          } else if (effectiveTags.length > 0) {
            const candidateCaseIds = parsedPlan.hasCasesField
              ? parsedPlan.entries.map((entry) => entry.id)
              : typeof this.storage.listTestCases === 'function'
                ? await this.storage.listTestCases(moduleName)
                : [];
            const matchedIds: string[] = [];
            for (const caseId of candidateCaseIds) {
              if (await matchesStorageCaseTags(caseId, effectiveTags)) {
                matchedIds.push(caseId);
              }
            }
            preparedCaseIds = matchedIds;
            wasFilteredToEmpty = matchedIds.length === 0;
          } else if (parsedPlan.hasCasesField) {
            preparedCaseIds = parsedPlan.entries.map((entry) => entry.id);
          }

          const modulePlan: TestPlan = {
            ...testPlan,
            modules: testPlan.modules && testPlan.modules.length > 0 ? testPlan.modules : [moduleName],
            ...(preparedCaseIds !== undefined ? { cases: preparedCaseIds } : {}),
            ...(hasExplicitModuleTags
              ? { tags: rawStep.tags }
              : !hasInlineCases && requestedTags.length > 0
                ? { tags: requestedTags }
                : {}),
          };

          const stepContextData: Record<string, unknown> = {
            ...baseContextData,
            flow: { ...sharedVariables },
            _capturedBuffer: {},
          };

          const runnerOptions: TestOptions = {
            ...extOptions,
            context_data: stepContextData,
            ...(this.lockProvider && modulesToLock.length > 0 ? { lock_owned_by_caller: true } : {}),
            ...(selectedInlineCases.size > 0
              ? {
                  storageResolver: async (mod: string, caseId: string): Promise<TCCase> => {
                    if (mod === moduleName) {
                      const inlineCase = selectedInlineCases.get(caseId);
                      if (inlineCase) {
                        return inlineCase;
                      }
                    }
                    if (typeof this.storage.getTestCase === 'function') {
                      return this.storage.getTestCase(mod, caseId);
                    }
                    throw new Error(`No se encontró el caso '${caseId}' para el módulo '${mod}'.`);
                  },
                }
              : {}),
          };

          const emptyNow = new Date().toISOString();
          const res: ExecutionResult = wasFilteredToEmpty
            ? {
                _version: '1',
                execution_id: `exec_${Date.now()}_${moduleName}_no_matching_cases`,
                module: moduleName,
                env: extOptions.environment ?? testPlan.environment ?? 'local',
                started_at: emptyNow,
                finished_at: emptyNow,
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
              }
            : await this.runner.execute(modulePlan, runnerOptions);
          moduleResults[moduleName] = res;
          this.emitTelemetry(flowName, moduleName, res);

          if (isRunnerPassed(res)) {
            completedModules.push(moduleName);

            collectCapturedVariables(
              moduleName,
              stepContextData._capturedBuffer,
              extFlow.context_sharing,
              sharedVariables
            );

            // Actualizar atómicamente el checkpoint en .state.json bajo el lock
            this.flowStore?.saveState({
              flow_name: flowName,
              started_at: startedAt,
              completed_modules: [...completedModules],
              shared_variables: { ...sharedVariables },
            });
          } else {
            if (shouldRollback) {
              this.flowStore?.restoreSessions(flowName);
            }

            if (failFast) {
              const failedIdx = rawSteps.findIndex((s) => s.module === moduleName);
              for (const pending of rawSteps.slice(failedIdx + 1)) {
                if (!completedModules.includes(pending.module)) {
                  const skippedRes = {
                    result: 'skipped',
                    failure_type: 'flow_step_failed',
                    message: `Omitido: el módulo '${moduleName}' falló y fail_fast está activo.`,
                  } as unknown as ExecutionResult;
                  moduleResults[pending.module] = skippedRes;
                  this.emitTelemetry(flowName, pending.module, skippedRes);
                }
              }
              break;
            }
          }
        }

        const allModulesCompleted =
          rawSteps.length > 0 && rawSteps.every((step) => completedModules.includes(step.module));
        isResumeCompleteNoOp =
          existingState !== null && executedModulesThisRun === 0 && allModulesCompleted;
        return {
          flow_name: flowName,
          status: allModulesCompleted ? 'passed' : 'failed',
          started_at: startedAt,
          completed_modules: completedModules,
          shared_variables: sharedVariables,
          results: moduleResults,
        } as unknown as FlowExecutionResult;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);

        if (shouldRollback) {
          this.flowStore?.restoreSessions(flowName);
        }

        return {
          flow_name: flowName,
          status: 'error',
          started_at: startedAt,
          completed_modules: completedModules,
          shared_variables: sharedVariables,
          error: msg,
          results: moduleResults,
        } as unknown as FlowExecutionResult;
      }
    };

    let flowResult: FlowExecutionResult | undefined;
    try {
      if (this.lockProvider && modulesToLock.length > 0) {
        flowResult = await this.lockProvider.withModulesLock(modulesToLock, executionLogic);
      } else {
        flowResult = await executionLogic();
      }
      return flowResult;
    } finally {
      try {
        const terminalStatus = (flowResult as unknown as { status?: string } | undefined)?.status ?? 'failed';
        const terminalError = (flowResult as unknown as { error?: string } | undefined)?.error;
        this.telemetry?.finish({
          status: terminalStatus,
          ...(isResumeCompleteNoOp ? { resumeNoOp: true } : {}),
          ...(typeof terminalError === 'string' && terminalError.length > 0 ? { error: terminalError } : {}),
        });
      } catch {
        // La telemetría nunca debe romper la ejecución del flujo
      }
    }
  }
}

function escapeCssManual(str: string): string {
  return str.replace(/([ !"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, '\\$1');
}
