import * as fs from 'node:fs';
import * as path from 'node:path';

import { FlowContextStore, FileSystemStorage, LockManager } from '@qap/knowledge';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { FlowOrchestrator } from '../flow-orchestrator.js';

describe('S8-004: Integración End-to-End de FlowOrchestrator + FileSystemStorage + LockManager + FlowContextStore', () => {
  const testDir = path.join(process.cwd(), '.qa_test_s8-004');
  let storage: FileSystemStorage;
  let lockManager: LockManager;
  let contextStore: FlowContextStore;

  beforeEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
    fs.mkdirSync(path.join(testDir, '.qa', 'cache', 'flow_states'), { recursive: true });
    fs.mkdirSync(path.join(testDir, '.qa', 'cache', 'locks'), { recursive: true });
    fs.mkdirSync(path.join(testDir, '.qa', 'cache', 'sessions'), { recursive: true });

    storage = new FileSystemStorage({ rootDir: testDir });
    lockManager = new LockManager({ rootDir: testDir });
    contextStore = new FlowContextStore(testDir);
  });

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('a) Flujo lineal exitoso: Los 3 módulos pasan y transfieren ${flow.USER_ID} y ${flow.LOAN_ID}', async () => {
    await storage.saveTestPlan('registro', {
      name: 'registro',
      cases: [{ id: 'tc_reg', steps: [{ type: 'capture', selector: '#uid', capture_as: 'USER_ID' }] }]
    } as any);

    await storage.saveTestPlan('simulacion', {
      name: 'simulacion',
      cases: [{ id: 'tc_sim', steps: [{ type: 'capture', selector: '#lid', capture_as: 'LOAN_ID' }] }]
    } as any);

    await storage.saveTestPlan('dashboard', {
      name: 'dashboard',
      cases: [{ id: 'tc_dash', steps: [{ type: 'navigate', url: '/dash?user=${flow.USER_ID}&loan=${flow.LOAN_ID}' }] }]
    } as any);

    const seen: Record<string, Record<string, string>> = {};
    const mockRunner = {
      execute: async (plan: any, options: any) => {
        const captured = options?.context_data?._capturedBuffer || {};
        seen[plan.name] = { ...(options?.context_data?.flow ?? {}) };
        if (plan.name === 'registro') {
          captured['tc_reg'] = { USER_ID: 'USR-777' };
        }
        if (plan.name === 'simulacion') {
          captured['tc_sim'] = { LOAN_ID: 'LOAN-888' };
        }
        return { status: 'success', success: true };
      }
    };

    const orchestrator = new FlowOrchestrator(storage, mockRunner as any, lockManager, testDir);

    const flowDefinition = {
      _version: '1.0',
      name: 'lineal_flow',
      modules: [{ module: 'registro' }, { module: 'simulacion' }, { module: 'dashboard' }],
      context_sharing: [
        { capture: 'USER_ID', from_module: 'registro', from_case: 'tc_reg', as: 'USER_ID' },
        { capture: 'LOAN_ID', from_module: 'simulacion', from_case: 'tc_sim', as: 'LOAN_ID' }
      ]
    };

    const result = (await orchestrator.executeFlow(flowDefinition, {})) as unknown as Record<string, unknown>;

    expect(result.status).toBe('passed');
    expect(result.completed_modules).toEqual(['registro', 'simulacion', 'dashboard']);
    expect(result.shared_variables).toEqual({ USER_ID: 'USR-777', LOAN_ID: 'LOAN-888' });

    // Las asserts van aquí (fuera del runner) para que un fallo no quede oculto
    expect(seen['simulacion']?.USER_ID).toBe('USR-777');
    expect(seen['dashboard']?.USER_ID).toBe('USR-777');
    expect(seen['dashboard']?.LOAN_ID).toBe('LOAN-888');

    const saved = contextStore.loadState('lineal_flow');
    expect(saved?.completed_modules).toEqual(['registro', 'simulacion', 'dashboard']);
    expect(saved?.shared_variables).toEqual({ USER_ID: 'USR-777', LOAN_ID: 'LOAN-888' });
  });

  it('b) fail_fast: true, falla el módulo 2 -> El módulo 3 queda skipped y se hace rollback de storageState', async () => {
    const sessionFile = path.join(testDir, '.qa', 'cache', 'sessions', 'auth.json');
    const originalSessionContent = JSON.stringify({ token: 'secure_token_original' });
    fs.writeFileSync(sessionFile, originalSessionContent, 'utf-8');

    await storage.saveTestPlan('registro', { name: 'registro', cases: [] } as any);
    await storage.saveTestPlan('simulacion', { name: 'simulacion', cases: [] } as any);
    await storage.saveTestPlan('dashboard', { name: 'dashboard', cases: [] } as any);

    const mockRunner = {
      execute: async (plan: any) => {
        if (plan.name === 'simulacion') {
          fs.writeFileSync(sessionFile, JSON.stringify({ token: 'corrupted' }), 'utf-8');
          return { status: 'failed', success: false, result: 'failed' };
        }
        return { status: 'success', success: true, result: 'passed' };
      }
    };

    const orchestrator = new FlowOrchestrator(storage, mockRunner as any, lockManager, testDir);

    const flowDefinition = {
      _version: '1.0',
      name: 'failfast_flow',
      fail_fast: true,
      teardown: { on_failure: 'rollback_storage_state' },
      modules: [{ module: 'registro' }, { module: 'simulacion' }, { module: 'dashboard' }]
    };

    const result = (await orchestrator.executeFlow(flowDefinition, {})) as unknown as Record<string, unknown>;

    expect(result.status).toBe('failed');
    expect(result.completed_modules).toEqual(['registro']);

    const resultsMap = result.results as Record<string, Record<string, unknown>>;
    expect(resultsMap['dashboard']).toMatchObject({ result: 'skipped', failure_type: 'flow_step_failed' });

    const restored = fs.readFileSync(sessionFile, 'utf-8');
    expect(restored).toBe(originalSessionContent);
  });

  it('c) Reanudación desde el módulo 2 con checkpoint (resume)', async () => {
    contextStore.backupSessions('resume_flow');
    contextStore.saveState({
      flow_name: 'resume_flow',
      started_at: new Date().toISOString(),
      completed_modules: ['registro'],
      shared_variables: { USER_ID: 'USR-PREV' }
    });

    await storage.saveTestPlan('registro', { name: 'registro', cases: [] } as any);
    await storage.saveTestPlan('simulacion', { name: 'simulacion', cases: [] } as any);
    await storage.saveTestPlan('dashboard', { name: 'dashboard', cases: [] } as any);

    const executedModules: string[] = [];
    let receivedFlowVars: Record<string, string> | undefined;
    const mockRunner = {
      execute: async (plan: any, options: any) => {
        executedModules.push(plan.name);
        if (plan.name === 'simulacion') {
          receivedFlowVars = { ...(options?.context_data?.flow ?? {}) };
        }
        return { status: 'success', success: true };
      }
    };

    const orchestrator = new FlowOrchestrator(storage, mockRunner as any, lockManager, testDir);

    const flowDefinition = {
      _version: '1.0',
      name: 'resume_flow',
      modules: [{ module: 'registro' }, { module: 'simulacion' }, { module: 'dashboard' }]
    };

    const result = (await orchestrator.executeFlow(flowDefinition, {})) as unknown as Record<string, unknown>;

    expect(result.status).toBe('passed');
    expect(executedModules).not.toContain('registro');
    expect(executedModules).toEqual(['simulacion', 'dashboard']);
    expect(receivedFlowVars).toEqual({ USER_ID: 'USR-PREV' });
    expect(result.completed_modules).toEqual(['registro', 'simulacion', 'dashboard']);
  });

  it('d) Variable ${flow.*} no capturada -> Falla con flow_context_missing y sin locks huérfanos', async () => {
    await storage.saveTestPlan('registro', { name: 'registro', cases: [] } as any);
    await storage.saveTestPlan('simulacion', {
      name: 'simulacion',
      cases: [{ id: 'tc_missing', steps: [{ type: 'navigate', url: '/url/${flow.MISSING_VAR}' }] }]
    } as any);

    const mockRunner = {
      execute: async () => ({ status: 'success', success: true })
    };

    const orchestrator = new FlowOrchestrator(storage, mockRunner as any, lockManager, testDir);

    const flowDefinition = {
      _version: '1.0',
      name: 'missing_context_flow',
      modules: [{ module: 'registro' }, { module: 'simulacion' }]
    };

    const result = (await orchestrator.executeFlow(flowDefinition, {})) as unknown as Record<string, unknown>;

    // Taxonomía flow_context_missing
    expect(result.status).toBe('error');
    expect(String(result.error)).toContain('flow_context_missing');
    expect(String(result.error)).toContain('MISSING_VAR');

    // El módulo previo quedó en el checkpoint
    expect(result.completed_modules).toEqual(['registro']);

    // Sin locks huérfanos: los mismos módulos se pueden volver a bloquear de inmediato
    const reacquired = await lockManager.withModulesLock(['registro', 'simulacion'], async () => 'ok');
    expect(reacquired).toBe('ok');
  });
});