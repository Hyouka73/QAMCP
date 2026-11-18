import type {
  ExecutionResult,
  FlowDefinition,
  FlowExecutionResult,
  FlowOptions,
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

  private emitTelemetry(flowName: string, moduleName: string, res: unknown): void {
    if (!this.telemetry) return;
    const rec = (res ?? {}) as Record<string, unknown>;
    const toStatus = (v: unknown): 'passed' | 'failed' | 'skipped' =>
      v === 'passed' || v === 'success' ? 'passed' : v === 'skipped' || v === 'not_run' ? 'skipped' : 'failed';
    const text = (v: unknown, fallback: string): string =>
      typeof v === 'string' || typeof v === 'number' ? String(v) : fallback;
    const num = (v: unknown): number => (typeof v === 'number' ? v : 0);

    const cases = Array.isArray(rec.cases) ? (rec.cases as Array<Record<string, unknown>>) : [];
    if (cases.length === 0) {
      const topStatus = rec.result ?? (rec.success === true ? 'passed' : rec.status);
      this.telemetry.onCaseEnd({
        flowName,
        module: moduleName,
        caseId: moduleName,
        status: toStatus(topStatus),
        durationMs: 0,
      });
      return;
    }
    for (const c of cases) {
      this.telemetry.onCaseEnd({
        flowName,
        module: moduleName,
        caseId: text(c.case_id ?? c.id, moduleName),
        status: toStatus(c.result ?? c.status),
        durationMs: num(c.duration_ms ?? c.durationMs),
      });
    }
  }

  async executeFlow(flow: FlowDefinition, options: FlowOptions = {}): Promise<FlowExecutionResult> {
    const extFlow: FlowWithOptionalExtensions = flow;
    const flowName = extFlow.name || 'unknown-flow';
    const rawSteps: FlowStepRef[] = extFlow.steps ?? extFlow.modules ?? [];
    const modulesToLock = rawSteps.map((step) => step.module);
    const failFast = extFlow.fail_fast !== false;
    const shouldRollback = isRollbackOnFailure(extFlow.teardown?.on_failure);

    const extOptions: FlowOptionsWithContext = options;
    const baseContextData = extOptions.context_data ?? {};
    const requestedTags = extOptions.tags ?? [];

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

      try {
        for (const rawStep of rawSteps) {
          const moduleName = rawStep.module;

          if (completedModules.includes(moduleName)) {
            continue;
          }

          const testPlan = await this.storage.getTestPlan(moduleName);
          const testPlanRecord = testPlan as unknown as Record<string, unknown>;
          const rawCases = Array.isArray(testPlanRecord.cases) ? testPlanRecord.cases : [];
          const hasInlineCases = rawCases.some((tc) => typeof tc === 'object' && tc !== null);
          const effectiveTags = rawStep.tags && rawStep.tags.length > 0 ? rawStep.tags : requestedTags;

          let preparedCases: unknown[] | undefined = Array.isArray(testPlanRecord.cases) ? rawCases : undefined;
          if (rawStep.cases && rawStep.cases.length > 0) {
            preparedCases = rawStep.cases;
          } else if (hasInlineCases) {
            const filteredCases = (rawCases as Array<Record<string, unknown>>).filter((tc) => {
              if (effectiveTags.length === 0) return true;
              const caseTags = (tc.tags ?? []) as string[];
              return effectiveTags.some((tag) => caseTags.includes(tag));
            });

            preparedCases = filteredCases.map((tc) => {
              const tcSteps = Array.isArray(tc.steps) ? (tc.steps as Array<Record<string, unknown>>) : [];
              return {
                ...tc,
                steps: tcSteps.map((s) => this.interpolateStep(s, sharedVariables)),
              };
            });
          }

          const modulePlan: TestPlan = {
            ...testPlan,
            modules: testPlan.modules && testPlan.modules.length > 0 ? testPlan.modules : [moduleName],
            ...(preparedCases !== undefined ? { cases: preparedCases as TestPlan['cases'] } : {}),
            ...(rawStep.tags && rawStep.tags.length > 0
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
          };

          const res = await this.runner.execute(modulePlan, runnerOptions);
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
                  moduleResults[pending.module] = {
                    result: 'skipped',
                    failure_type: 'flow_step_failed',
                    message: `Omitido: el módulo '${moduleName}' falló y fail_fast está activo.`,
                  } as unknown as ExecutionResult;
                }
              }
              break;
            }
          }
        }

        return {
          flow_name: flowName,
          status: completedModules.length === rawSteps.length ? 'passed' : 'failed',
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

    try {
      if (this.lockProvider && modulesToLock.length > 0) {
        return await this.lockProvider.withModulesLock(modulesToLock, executionLogic);
      }

      return await executionLogic();
    } finally {
      try {
        this.telemetry?.finish();
      } catch {
        // La telemetría nunca debe romper la ejecución del flujo
      }
    }
  }
}

function escapeCssManual(str: string): string {
  return str.replace(/([ !"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, '\\$1');
}
