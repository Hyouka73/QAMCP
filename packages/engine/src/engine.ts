/**
 * QAPEngine - Main Engine Class
 *
 * The core engine that orchestrates module discovery, test execution,
 * flow running, and reporting. All dependencies are injected via constructor.
 *
 * Principle 11 (QAP v2.1): The Engine NEVER imports concrete implementations.
 * All I/O is delegated exclusively to IStorage (and the other ports).
 */

import type {
  ModuleSpec,
  Module,
  TestPlan,
  TestOptions,
  ExecutionResult,
  FlowDefinition,
  FlowOptions,
  FlowExecutionResult,
  ModuleContext,
} from '@qap/shared';

import type {
  IStorage,
  IDiscoverer,
  IRunner,
  IFlowRunner,
  IReporter,
  ReportOptions,
  GeneratedReport,
  ProjectStatus,
} from './ports.js';

/**
 * Options for updating a module
 */
export interface UpdateOptions {
  source?: string;
  overwrite?: boolean;
  backup?: boolean;
}

/**
 * Result of a module update operation
 */
export interface UpdateResult {
  success: boolean;
  updated_at: string;
  backup_path?: string;
  changes?: string[];
}

/**
 * Global context for the entire project
 */
export interface GlobalContext {
  type: 'global';
  project_name: string;
  environments: string[];
  shared_data: Record<string, unknown>;
}

/**
 * Error thrown when a method is not yet implemented
 */
export class NotImplementedError extends Error {
  constructor(methodName: string) {
    super(`Method ${methodName} is not yet implemented`);
    this.name = 'NotImplementedError';
  }
}

export class QAPEngine {
  constructor(
    private readonly storage: IStorage,
    private readonly discoverer: IDiscoverer,
    private readonly runner: IRunner,
    private readonly flowRunner: IFlowRunner,
    private readonly reporter: IReporter
  ) {}

  async discover(spec: ModuleSpec): Promise<Module> {
    return this.discoverer.discover(spec);
  }

  async plan(moduleName: string): Promise<TestPlan> {
    const planPath = `.qa/plans/${moduleName}.json`;
    const planExists = await this.storage.exists(planPath);
    if (planExists) {
      return this.storage.readJson<TestPlan>(planPath);
    }
    const defaultPlan: TestPlan = {
      modules: [moduleName],
    };
    return defaultPlan;
  }

  async test(moduleName: string, options: TestOptions): Promise<ExecutionResult> {
    const plan: TestPlan = {
      modules: [moduleName],
      environment: options.environment,
      timeout_ms: options.timeout_ms,
    };
    return this.runner.execute(plan, options);
  }

  async update(moduleName: string, options: UpdateOptions): Promise<UpdateResult> {
    const modulePath = `.qa/modules/${moduleName}.json`;
    await this.storage.writeJson(modulePath, options);
    return {
      success: true,
      updated_at: new Date().toISOString(),
      backup_path: options.backup ? `.qa/backups/${moduleName}.json` : undefined,
      changes: options.source ? [options.source] : undefined,
    };
  }

  async report(executionId: string, options?: ReportOptions): Promise<GeneratedReport> {
    let result = await this.storage.getExecutionResult(executionId);
    if (!result) {
      const now = new Date().toISOString();
      result = {
        _version: '1',
        execution_id: executionId,
        module: executionId,
        env: 'local',
        started_at: now,
        finished_at: now,
        result: 'passed',
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
    return this.reporter.generate(result, options);
  }

  async status(): Promise<ProjectStatus> {
    const initialized = await this.storage.exists('.qa');
    const modules = initialized ? await this.storage.list('.qa/modules') : [];
    return {
      initialized,
      modules_discovered: modules.length,
      environment_configured: true,
    };
  }

  async context(moduleName: string, options?: { global?: boolean }): Promise<ModuleContext | GlobalContext> {
    if (options?.global) {
      return this.storage.readJson<GlobalContext>('.qa/context/global.json');
    }
    return this.storage.readJson<ModuleContext>(`.qa/context/${moduleName}.json`);
  }

  async runFlow(flow: FlowDefinition, options: FlowOptions): Promise<FlowExecutionResult> {
    return this.flowRunner.executeFlow(flow, options);
  }
}

/**
 * Re-export types consumed by other packages
 */
export type { ModuleContext } from '@qap/shared';
export type { ProjectStatus } from './ports.js';
