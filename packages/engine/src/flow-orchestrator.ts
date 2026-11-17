import { FlowContextStore } from '@qap/knowledge';
import type { FlowDefinition, FlowOptions, FlowExecutionResult, TestPlan } from '@qap/shared';

import type { IStorage, IRunner, IFlowLockProvider, IFlowRunner, IFlowTelemetry } from './ports.js';

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

export class FlowOrchestrator implements IFlowRunner {
  private flowStore: FlowContextStore;

  constructor(
    private storage: IStorage,
    private runner: IRunner,
    private lockProvider?: IFlowLockProvider,
    rootDir?: string,
    private telemetry?: IFlowTelemetry
  ) {
    this.flowStore = new FlowContextStore(rootDir);
  }

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
      v === 'passed' ? 'passed' : v === 'skipped' || v === 'not_run' ? 'skipped' : 'failed';
    const text = (v: unknown, fallback: string): string =>
      typeof v === 'string' || typeof v === 'number' ? String(v) : fallback;
    const num = (v: unknown): number => (typeof v === 'number' ? v : 0);

    const cases = Array.isArray(rec.cases) ? (rec.cases as Array<Record<string, unknown>>) : [];
    if (cases.length === 0) {
      this.telemetry.onCaseEnd({
        flowName,
        module: moduleName,
        caseId: moduleName,
        status: toStatus(rec.result),
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

  async executeFlow(flow: FlowDefinition, options: FlowOptions): Promise<FlowExecutionResult> {
    const flowRecord = flow as unknown as Record<string, unknown>;
    const flowName = (flowRecord.name as string) ?? 'unknown-flow';
    const rawSteps = (flowRecord.steps ?? flowRecord.modules ?? []) as Array<{
      module: string;
      [key: string]: unknown;
    }>;
    const modulesToLock = rawSteps.map((step) => step.module);
    const failFast = flowRecord.fail_fast !== false;

    const optsRecord = options as unknown as Record<string, unknown>;
    const baseContextData = (optsRecord.context_data as Record<string, unknown>) ?? {};
    const requestedTags = (optsRecord.tags as string[] | undefined) ?? [];

    const existingState = this.flowStore.loadState(flowName);

    // Respaldo de sesiones antes del primer módulo (no se pisa al reanudar)
    if (!existingState || !this.flowStore.hasSessionBackup(flowName)) {
      this.flowStore.backupSessions(flowName);
    }

    const sharedVariables: Record<string, string> = existingState?.shared_variables ?? {};
    const completedModules: string[] = existingState?.completed_modules ?? [];

    const executionLogic = async (): Promise<FlowExecutionResult> => {
      const startedAt = existingState?.started_at ?? new Date().toISOString();
      const moduleResults: Record<string, unknown> = {};

      try {
        for (const rawStep of rawSteps) {
          const moduleName = rawStep.module;

          if (completedModules.includes(moduleName)) {
            continue;
          }

          const testPlan = await this.storage.getTestPlan(moduleName);
          const testPlanRecord = testPlan as unknown as Record<string, unknown>;

          const planCases = ((testPlanRecord.cases ?? []) as Array<Record<string, unknown>>).filter((tc) => {
            if (requestedTags.length === 0) return true;
            const caseTags = (tc.tags ?? []) as string[];
            return requestedTags.some((tag) => caseTags.includes(tag));
          });

          const interpolatedCases = planCases.map((tc) => {
            const tcSteps = (tc.steps ?? []) as Array<Record<string, unknown>>;
            return {
              ...tc,
              steps: tcSteps.map((s) => this.interpolateStep(s, sharedVariables)),
            };
          });

          const interpolatedTestPlan = {
            ...testPlanRecord,
            cases: interpolatedCases,
          };

          const stepContextData: Record<string, unknown> = {
            ...baseContextData,
            flow: sharedVariables,
            _capturedBuffer: {},
          };

          const res = await this.runner.execute(interpolatedTestPlan as unknown as TestPlan, {
            ...optsRecord,
            context_data: stepContextData,
          } as unknown as FlowOptions);

          moduleResults[moduleName] = res;
          this.emitTelemetry(flowName, moduleName, res);

          const resRecord = res as unknown as Record<string, unknown>;
          const isPassed =
            resRecord.success === true ||
            resRecord.result === 'passed' ||
            resRecord.status === 'success' ||
            resRecord.status === 'passed';

          if (isPassed) {
            completedModules.push(moduleName);

            const capturedBuffer =
              (stepContextData._capturedBuffer as Record<string, Record<string, string>>) || {};
            for (const caseCaptures of Object.values(capturedBuffer)) {
              for (const [key, val] of Object.entries(caseCaptures)) {
                sharedVariables[key] = val;
              }
            }

            // Checkpoint atómico en .state.json
            this.flowStore.saveState({
              flow_name: flowName,
              started_at: startedAt,
              completed_modules: completedModules,
              shared_variables: sharedVariables,
            });
          } else {
            const teardown = flowRecord.teardown as { on_failure?: unknown } | undefined;
            if (isRollbackOnFailure(teardown?.on_failure)) {
              this.flowStore.restoreSessions(flowName);
            }

            if (failFast) {
              const failedIdx = rawSteps.findIndex((s) => s.module === moduleName);
              for (const pending of rawSteps.slice(failedIdx + 1)) {
                if (!completedModules.includes(pending.module)) {
                  moduleResults[pending.module] = {
                    result: 'skipped',
                    failure_type: 'flow_step_failed',
                    message: `Omitido: el módulo '${moduleName}' falló y fail_fast está activo.`,
                  };
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

        const teardown = flowRecord.teardown as { on_failure?: unknown } | undefined;
        if (isRollbackOnFailure(teardown?.on_failure)) {
          this.flowStore.restoreSessions(flowName);
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