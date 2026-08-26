/**
 * QAPEngine - Main Engine Class
 * 
 * The core engine that orchestrates module discovery, test execution,
 * flow running, and reporting. All dependencies are injected via constructor.
 */

import type {
  ModuleSpec,
  Module,
  TestPlan,
  TestOptions,
  ExecutionResult,
  ReportOptions,
  Report,
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
 * Status of the entire project
 */
export interface ProjectStatus {
  initialized: boolean;
  modules_discovered: number;
  last_execution?: {
    date: string;
    status: 'success' | 'failure' | 'error';
  };
  environment_configured: boolean;
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
    private storage: IStorage,
    private discoverer: IDiscoverer,
    private runner: IRunner,
    private flowRunner: IFlowRunner,
    private reporter: IReporter
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

  async report(moduleName: string, options: ReportOptions): Promise<Report> {
    const placeholderResult: ExecutionResult = {
      _version: '2.1.0',
      execution_id: `exec-${Date.now()}`,
      module: moduleName,
      status: 'success',
      timestamps: {
        started_at: new Date().toISOString(),
        ended_at: new Date().toISOString(),
      },
    };
    return this.reporter.generate(placeholderResult, options);
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
 * Module context type - matches the one from @qap/shared
 */
export type { ModuleContext } from '@qap/shared';
