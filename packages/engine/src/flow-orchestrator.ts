import type {
  ExecutionResult,
  FlowDefinition,
  FlowExecutionResult,
  FlowOptions,
  TestOptions,
  TestPlan,
} from '@qap/shared';

import type { IFlowLockProvider, IFlowRunner, IFlowStateStore, IRunner, IStorage } from './ports.js';

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
    private readonly flowStore?: IFlowStateStore
  ) {}

  async executeFlow(flow: FlowDefinition, options: FlowOptions = {}): Promise<FlowExecutionResult> {
    const extFlow: FlowWithOptionalExtensions = flow;
    const flowName = extFlow.name || 'unknown-flow';
    const rawSteps: FlowStepRef[] = extFlow.steps ?? extFlow.modules ?? [];
    const modulesToLock = rawSteps.map((step) => step.module);
    const failFast = extFlow.fail_fast !== false;
    const shouldRollback = isRollbackOnFailure(extFlow.teardown?.on_failure);

    const extOptions: FlowOptionsWithContext = options;
    const baseContextData = extOptions.context_data ?? {};

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
          const modulePlan: TestPlan = {
            ...testPlan,
            modules: testPlan.modules && testPlan.modules.length > 0 ? testPlan.modules : [moduleName],
            ...(rawStep.cases && rawStep.cases.length > 0 ? { cases: rawStep.cases } : {}),
            ...(rawStep.tags && rawStep.tags.length > 0 ? { tags: rawStep.tags } : {}),
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
              break;
            }
          }
        }

        return {
          flow_name: flowName,
          status: completedModules.length === rawSteps.length ? 'passed' : 'failed',
          started_at: startedAt,
          completed_modules: completedModules,
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
          error: msg,
          results: moduleResults,
        } as unknown as FlowExecutionResult;
      }
    };

    if (this.lockProvider && modulesToLock.length > 0) {
      return await this.lockProvider.withModulesLock(modulesToLock, executionLogic);
    }

    return await executionLogic();
  }
}
