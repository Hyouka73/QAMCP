import { describe, it, expect, vi, beforeEach } from 'vitest';
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

import { QAPEngine } from '../engine.js';
import type {
  IStorage,
  IDiscoverer,
  IRunner,
  IFlowRunner,
  IReporter,
  ReportOptions,
  GeneratedReport,
} from '../ports.js';

import { createStorageMock } from './mocks/storage.mock.js';
import type { StorageMock } from './mocks/storage.mock.js';

describe('QAPEngine', () => {
  let mockStorage: StorageMock;
  let mockDiscoverer: { [K in keyof IDiscoverer]: ReturnType<typeof vi.fn> };
  let mockRunner: { [K in keyof IRunner]: ReturnType<typeof vi.fn> };
  let mockFlowRunner: { [K in keyof IFlowRunner]: ReturnType<typeof vi.fn> };
  let mockReporter: { [K in keyof IReporter]: ReturnType<typeof vi.fn> };
  let engine: QAPEngine;

  beforeEach(() => {
    mockStorage = createStorageMock();

    mockDiscoverer = {
      discover: vi.fn(),
    };

    mockRunner = {
      execute: vi.fn(),
    };

    mockFlowRunner = {
      executeFlow: vi.fn(),
    };

    mockReporter = {
      generate: vi.fn(),
    };

    engine = new QAPEngine(
      mockStorage as unknown as IStorage,
      mockDiscoverer as unknown as IDiscoverer,
      mockRunner as unknown as IRunner,
      mockFlowRunner as unknown as IFlowRunner,
      mockReporter as unknown as IReporter
    );
  });

  it('delegates discover() to IDiscoverer', async () => {
    const spec: ModuleSpec = {
      name: 'auth-module',
      path: 'src/modules/auth',
      tags: ['auth', 'login'],
    };

    const mockModule: Module = {
      name: 'auth-module',
      path: 'src/modules/auth',
      cases: ['TC-01', 'TC-02'],
    };

    mockDiscoverer.discover.mockResolvedValueOnce(mockModule);

    const result = await engine.discover(spec);

    expect(mockDiscoverer.discover).toHaveBeenCalledTimes(1);
    expect(mockDiscoverer.discover).toHaveBeenCalledWith(spec);
    expect(result).toEqual(mockModule);
  });

  it('delegates plan() to IStorage to read plan if exists or create default', async () => {
    const customPlan: TestPlan = {
      modules: ['auth-module'],
      cases: ['TC-01'],
      environment: 'staging',
    };

    // When plan file exists
    mockStorage.exists.mockResolvedValueOnce(true);
    mockStorage.readJson.mockResolvedValueOnce(customPlan);

    const result = await engine.plan('auth-module');

    expect(mockStorage.exists).toHaveBeenCalledWith('.qa/plans/auth-module.json');
    expect(mockStorage.readJson).toHaveBeenCalledWith('.qa/plans/auth-module.json');
    expect(result).toEqual(customPlan);

    // When plan file does not exist, returns default plan
    mockStorage.exists.mockResolvedValueOnce(false);
    const defaultResult = await engine.plan('payments-module');

    expect(mockStorage.exists).toHaveBeenCalledWith('.qa/plans/payments-module.json');
    expect(defaultResult).toEqual({
      modules: ['payments-module'],
    });
  });

  it('delegates test() to IRunner', async () => {
    const options: TestOptions = {
      environment: 'staging',
      headless: true,
      timeout_ms: 5000,
    };

    const mockExecutionResult: ExecutionResult = {
      _version: '1',
      execution_id: 'exec-123',
      module: 'auth-module',
      env: 'staging',
      started_at: '2026-08-26T10:00:00.000Z',
      finished_at: '2026-08-26T10:00:05.000Z',
      result: 'passed',
      timed_out: false,
      summary: {
        total: 2,
        passed: 2,
        failed: 0,
        skipped: 0,
        not_run: 0,
      },
      cases: [],
    };

    mockRunner.execute.mockResolvedValueOnce(mockExecutionResult);

    const result = await engine.test('auth-module', options);

    expect(mockRunner.execute).toHaveBeenCalledTimes(1);
    expect(mockRunner.execute).toHaveBeenCalledWith(
      {
        modules: ['auth-module'],
        environment: 'staging',
        timeout_ms: 5000,
      },
      options
    );
    expect(result).toEqual(mockExecutionResult);
  });

  it('delegates update() to IStorage', async () => {
    const options = {
      source: 'specs/auth.spec.ts',
      overwrite: true,
      backup: true,
    };

    mockStorage.writeJson.mockResolvedValueOnce(undefined);

    const result = await engine.update('auth-module', options);

    expect(mockStorage.writeJson).toHaveBeenCalledTimes(1);
    expect(mockStorage.writeJson).toHaveBeenCalledWith('.qa/modules/auth-module.json', options);
    expect(result.success).toBe(true);
    expect(result.backup_path).toBe('.qa/backups/auth-module.json');
    expect(result.changes).toEqual(['specs/auth.spec.ts']);
  });

  it('delegates report() to IReporter reading from IStorage if available', async () => {
    const options: ReportOptions = {
      formats: ['html'],
      outputDir: './reports',
    };

    const mockExecutionResult: ExecutionResult = {
      _version: '1',
      execution_id: 'exec-123',
      module: 'auth-module',
      env: 'local',
      started_at: '2026-08-26T10:00:00.000Z',
      finished_at: '2026-08-26T10:00:05.000Z',
      result: 'passed',
      timed_out: false,
      summary: {
        total: 5,
        passed: 5,
        failed: 0,
        skipped: 0,
        not_run: 0,
      },
      cases: [],
    };

    const mockReport: GeneratedReport = {
      executionId: 'exec-123',
      generatedAt: '2026-08-26T10:00:00.000Z',
      formats: { html: './reports/auth.html' },
      summary: {
        total: 5,
        passed: 5,
        failed: 0,
        skipped: 0,
        not_run: 0,
      },
    };

    mockStorage.getExecutionResult.mockResolvedValueOnce(mockExecutionResult);
    mockReporter.generate.mockResolvedValueOnce(mockReport);

    const result = await engine.report('exec-123', options);

    expect(mockStorage.getExecutionResult).toHaveBeenCalledWith('exec-123');
    expect(mockReporter.generate).toHaveBeenCalledTimes(1);
    expect(mockReporter.generate).toHaveBeenCalledWith(mockExecutionResult, options);
    expect(result).toEqual(mockReport);
  });

  it('delegates status() to IStorage', async () => {
    mockStorage.exists.mockResolvedValueOnce(true);
    mockStorage.list.mockResolvedValueOnce(['auth.json', 'users.json']);

    const result = await engine.status();

    expect(mockStorage.exists).toHaveBeenCalledWith('.qa');
    expect(mockStorage.list).toHaveBeenCalledWith('.qa/modules');
    expect(result).toEqual({
      initialized: true,
      modules_discovered: 2,
      environment_configured: true,
    });
  });

  it('delegates context() to IStorage for module and global contexts', async () => {
    const mockModuleContext: ModuleContext = {
      _version: '2.1.0',
      objective: 'Verify user authentication',
      manually_edited: false,
      routes: ['/login', '/register'],
    };

    mockStorage.readJson.mockResolvedValueOnce(mockModuleContext);

    const moduleContextResult = await engine.context('auth-module');

    expect(mockStorage.readJson).toHaveBeenCalledWith('.qa/context/auth-module.json');
    expect(moduleContextResult).toEqual(mockModuleContext);

    const mockGlobalContext = {
      type: 'global' as const,
      project_name: 'QAP Monorepo',
      environments: ['dev', 'staging', 'prod'],
      shared_data: { apiKey: 'test' },
    };

    mockStorage.readJson.mockResolvedValueOnce(mockGlobalContext);

    const globalContextResult = await engine.context('auth-module', { global: true });

    expect(mockStorage.readJson).toHaveBeenCalledWith('.qa/context/global.json');
    expect(globalContextResult).toEqual(mockGlobalContext);
  });

  it('delegates runFlow() to IFlowRunner', async () => {
    const flowDef: FlowDefinition = {
      name: 'login-and-checkout',
      modules: [{ module: 'auth' }, { module: 'checkout' }],
    };

    const flowOptions: FlowOptions = {
      environment: 'staging',
    };

    const mockFlowResult: FlowExecutionResult = {
      flow_name: 'login-and-checkout',
      status: 'success',
      modules: [],
      timestamps: {
        started_at: '2026-09-14T10:00:00Z',
        ended_at: '2026-09-14T10:00:02Z',
      },
    };

    mockFlowRunner.executeFlow.mockResolvedValueOnce(mockFlowResult);

    const result = await engine.runFlow(flowDef, flowOptions);

    expect(mockFlowRunner.executeFlow).toHaveBeenCalledTimes(1);
    expect(mockFlowRunner.executeFlow).toHaveBeenCalledWith(flowDef, flowOptions);
    expect(result).toEqual(mockFlowResult);
  });
});
