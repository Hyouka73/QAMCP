// packages/engine/src/_tests_/flow-integration.test.ts
import * as fs from 'node:fs';
import * as path from 'node:path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { FlowOrchestrator } from '../flow-orchestrator.js';
import type { IFlowLockProvider, IFlowState, IFlowStateStore } from '../ports.js';

function createLocalStorage(rootDir: string) {
  const planPath = (moduleName: string) =>
    path.join(rootDir, '.qa', 'modules', moduleName, 'tests', 'plan.json');

  return {
    async saveTestPlan(moduleName: string, plan: unknown): Promise<void> {
      const target = planPath(moduleName);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, JSON.stringify(plan, null, 2), 'utf-8');
    },
    async getTestPlan(moduleName: string): Promise<any> {
      return JSON.parse(fs.readFileSync(planPath(moduleName), 'utf-8'));
    },
  };
}

function createLocalLockManager(): IFlowLockProvider {
  const heldLocks = new Set<string>();

  return {
    async withModulesLock<T>(moduleNames: string[], fn: () => Promise<T>): Promise<T> {
      const sorted = [...new Set(moduleNames)].sort();
      for (const mod of sorted) {
        if (heldLocks.has(mod)) {
          throw new Error(`Module lock busy: ${mod}`);
        }
      }
      for (const mod of sorted) {
        heldLocks.add(mod);
      }
      try {
        return await fn();
      } finally {
        for (const mod of sorted) {
          heldLocks.delete(mod);
        }
      }
    },
  };
}

function createLocalFlowStore(rootDir: string): IFlowStateStore {
  const cacheDir = path.join(rootDir, '.qa', 'cache', 'flow_states');
  const sessionsDir = path.join(rootDir, '.qa', 'cache', 'sessions');
  const statePath = (flowName: string) => path.join(cacheDir, `${flowName}.state.json`);
  const backupPath = (flowName: string) => path.join(cacheDir, `${flowName}.sessions.bak.json`);

  return {
    saveState(state: IFlowState): void {
      const filePath = statePath(state.flow_name);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      const tmpPath = `${filePath}.${process.pid}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(state, null, 2), 'utf-8');
      fs.renameSync(tmpPath, filePath);
    },
    loadState(flowName: string): IFlowState | null {
      const filePath = statePath(flowName);
      if (!fs.existsSync(filePath)) return null;
      return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as IFlowState;
    },
    hasSessionBackup(flowName: string): boolean {
      return fs.existsSync(backupPath(flowName));
    },
    backupSessions(flowName: string): void {
      fs.mkdirSync(cacheDir, { recursive: true });
      const sessionsBackup: Record<string, string> = {};
      if (fs.existsSync(sessionsDir)) {
        for (const file of fs.readdirSync(sessionsDir)) {
          if (file.endsWith('.json')) {
            sessionsBackup[file] = fs.readFileSync(path.join(sessionsDir, file), 'utf-8');
          }
        }
      }
      fs.writeFileSync(backupPath(flowName), JSON.stringify(sessionsBackup, null, 2), 'utf-8');
    },
    restoreSessions(flowName: string): boolean {
      const bakPath = backupPath(flowName);
      if (!fs.existsSync(bakPath)) return false;
      const sessionsBackup = JSON.parse(fs.readFileSync(bakPath, 'utf-8')) as Record<string, string>;
      fs.mkdirSync(sessionsDir, { recursive: true });
      for (const file of fs.readdirSync(sessionsDir)) {
        if (file.endsWith('.json') && !(file in sessionsBackup)) {
          fs.unlinkSync(path.join(sessionsDir, file));
        }
      }
      for (const [filename, fileContent] of Object.entries(sessionsBackup)) {
        fs.writeFileSync(path.join(sessionsDir, filename), fileContent, 'utf-8');
      }
      return true;
    },
  };
}

describe('S82-002: Integración de Flujo A -> B (Captura e Interpolación)', () => {
  const testDir = path.join(process.cwd(), '.qa_test_flow_ab');

  beforeEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
    fs.mkdirSync(path.join(testDir, '.qa', 'cache', 'flow_states'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('el Módulo A captura un ID dinámico y el Módulo B lo interpola exitosamente', async () => {
    const mockStorage = {
      getTestPlan: async (moduleName: string) => {
        if (moduleName === 'mod_a') {
          return {
            name: 'mod_a',
            cases: [
              {
                id: 'tc_capture',
                steps: [{ type: 'capture', selector: '#user-id', capture_as: 'USER_ID' }],
              },
            ],
          };
        }
        return {
          name: 'mod_b',
          cases: [
            {
              id: 'tc_use',
              steps: [{ type: 'navigate', url: '/users/${flow.USER_ID}' }],
            },
          ],
        };
      },
    };

    const mockRunner = {
      execute: async (plan: any, options: any) => {
        if (plan.name === 'mod_a') {
          // Simula que el runner llena el buffer de captura
          if (options.context_data?._capturedBuffer) {
            options.context_data._capturedBuffer['tc_capture'] = { USER_ID: 'USR-999' };
          }
          return { status: 'success', success: true };
        }
        // Verifica que el Módulo B recibió la variable interpolada en su contexto
        expect(options.context_data.flow.USER_ID).toBe('USR-999');
        return { status: 'success', success: true };
      },
    };

    const orchestrator = new FlowOrchestrator(mockStorage as any, mockRunner as any);

    const flowDefinition = {
      _version: '1.0',
      name: 'flow_ab',
      modules: [{ module: 'mod_a' }, { module: 'mod_b' }],
      context_sharing: [
        { capture: 'USER_ID', from_module: 'mod_a', from_case: 'tc_capture', as: 'USER_ID' },
      ],
    };

    const result = (await orchestrator.executeFlow(flowDefinition, {})) as unknown as Record<string, unknown>;

    expect(result.status).toBe('passed');
    expect(result.completed_modules).toEqual(['mod_a', 'mod_b']);
  });

  it('mantiene TestPlan.cases como IDs, delega lock_owned_by_caller y ejecuta estado/backup/checkpoint bajo el lock', async () => {
    const events: string[] = [];

    const mockStorage = {
      getTestPlan: async (moduleName: string) => ({
        modules: [moduleName],
        cases: [`TC-${moduleName}-1`],
      }),
    };

    const receivedPlans: Array<{ cases?: unknown; lock_owned_by_caller?: boolean }> = [];
    const mockRunner = {
      execute: async (plan: any, options: any) => {
        events.push(`runner:${plan.modules[0]}`);
        receivedPlans.push({
          cases: plan.cases,
          lock_owned_by_caller: options.lock_owned_by_caller,
        });
        if (plan.modules[0] === 'mod_a') {
          options.context_data._capturedBuffer['TC-mod_a-1'] = { RAW_ID: 'SYNTH-42' };
        }
        return { result: 'passed' };
      },
    };

    const mockLockProvider = {
      withModulesLock: async <T>(modules: string[], fn: () => Promise<T>): Promise<T> => {
        events.push(`lock_enter:${modules.join(',')}`);
        const res = await fn();
        events.push('lock_exit');
        return res;
      },
    };

    const mockFlowStore = {
      loadState: () => {
        events.push('loadState');
        return null;
      },
      hasSessionBackup: () => {
        events.push('hasSessionBackup');
        return false;
      },
      backupSessions: () => {
        events.push('backupSessions');
      },
      saveState: (state: any) => {
        events.push(`saveState:${state.completed_modules.join(',')}`);
      },
      restoreSessions: () => true,
    };

    const orchestrator = new FlowOrchestrator(
      mockStorage as any,
      mockRunner as any,
      mockLockProvider,
      mockFlowStore
    );

    const result = (await orchestrator.executeFlow(
      {
        name: 'flow_lock_order',
        modules: [{ module: 'mod_a' }, { module: 'mod_b' }],
        context_sharing: [
          { capture: 'RAW_ID', from_module: 'mod_a', from_case: 'TC-mod_a-1', as: 'ALIASED_ID' },
        ],
      },
      {}
    )) as unknown as Record<string, unknown>;

    expect(result.status).toBe('passed');
    expect(receivedPlans).toEqual([
      { cases: ['TC-mod_a-1'], lock_owned_by_caller: true },
      { cases: ['TC-mod_b-1'], lock_owned_by_caller: true },
    ]);
    expect(events).toEqual([
      'lock_enter:mod_a,mod_b',
      'loadState',
      'backupSessions',
      'runner:mod_a',
      'saveState:mod_a',
      'runner:mod_b',
      'saveState:mod_a,mod_b',
      'lock_exit',
    ]);
  });
});

describe('S8-004: Integración End-to-End de FlowOrchestrator + FileSystemStorage + LockManager + FlowContextStore', () => {
  const testDir = path.join(process.cwd(), '.qa_test_s8-004');
  let storage: ReturnType<typeof createLocalStorage>;
  let lockManager: IFlowLockProvider;
  let contextStore: IFlowStateStore;

  beforeEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
    fs.mkdirSync(path.join(testDir, '.qa', 'cache', 'flow_states'), { recursive: true });
    fs.mkdirSync(path.join(testDir, '.qa', 'cache', 'locks'), { recursive: true });
    fs.mkdirSync(path.join(testDir, '.qa', 'cache', 'sessions'), { recursive: true });

    storage = createLocalStorage(testDir);
    lockManager = createLocalLockManager();
    contextStore = createLocalFlowStore(testDir);
  });

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('a) Flujo lineal exitoso: Los 3 módulos pasan y transfieren ${flow.USER_ID} y ${flow.LOAN_ID}', async () => {
    await storage.saveTestPlan('registro', {
      name: 'registro',
      cases: [{ id: 'tc_reg', steps: [{ type: 'capture', selector: '#uid', capture_as: 'USER_ID' }] }],
    });

    await storage.saveTestPlan('simulacion', {
      name: 'simulacion',
      cases: [{ id: 'tc_sim', steps: [{ type: 'capture', selector: '#lid', capture_as: 'LOAN_ID' }] }],
    });

    await storage.saveTestPlan('dashboard', {
      name: 'dashboard',
      cases: [{ id: 'tc_dash', steps: [{ type: 'navigate', url: '/dash?user=${flow.USER_ID}&loan=${flow.LOAN_ID}' }] }],
    });

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
      },
    };

    const orchestrator = new FlowOrchestrator(storage as any, mockRunner as any, lockManager, contextStore);

    const flowDefinition = {
      _version: '1.0',
      name: 'lineal_flow',
      modules: [{ module: 'registro' }, { module: 'simulacion' }, { module: 'dashboard' }],
      context_sharing: [
        { capture: 'USER_ID', from_module: 'registro', from_case: 'tc_reg', as: 'USER_ID' },
        { capture: 'LOAN_ID', from_module: 'simulacion', from_case: 'tc_sim', as: 'LOAN_ID' },
      ],
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

    await storage.saveTestPlan('registro', { name: 'registro', cases: [] });
    await storage.saveTestPlan('simulacion', { name: 'simulacion', cases: [] });
    await storage.saveTestPlan('dashboard', { name: 'dashboard', cases: [] });

    const mockRunner = {
      execute: async (plan: any) => {
        if (plan.name === 'simulacion') {
          fs.writeFileSync(sessionFile, JSON.stringify({ token: 'corrupted' }), 'utf-8');
          return { status: 'failed', success: false, result: 'failed' };
        }
        return { status: 'success', success: true, result: 'passed' };
      },
    };

    const orchestrator = new FlowOrchestrator(storage as any, mockRunner as any, lockManager, contextStore);

    const flowDefinition = {
      _version: '1.0',
      name: 'failfast_flow',
      fail_fast: true,
      teardown: { on_failure: 'rollback_storage_state' },
      modules: [{ module: 'registro' }, { module: 'simulacion' }, { module: 'dashboard' }],
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
      shared_variables: { USER_ID: 'USR-PREV' },
    });

    await storage.saveTestPlan('registro', { name: 'registro', cases: [] });
    await storage.saveTestPlan('simulacion', { name: 'simulacion', cases: [] });
    await storage.saveTestPlan('dashboard', { name: 'dashboard', cases: [] });

    const executedModules: string[] = [];
    let receivedFlowVars: Record<string, string> | undefined;
    const mockRunner = {
      execute: async (plan: any, options: any) => {
        executedModules.push(plan.name);
        if (plan.name === 'simulacion') {
          receivedFlowVars = { ...(options?.context_data?.flow ?? {}) };
        }
        return { status: 'success', success: true };
      },
    };

    const orchestrator = new FlowOrchestrator(storage as any, mockRunner as any, lockManager, contextStore);

    const flowDefinition = {
      _version: '1.0',
      name: 'resume_flow',
      modules: [{ module: 'registro' }, { module: 'simulacion' }, { module: 'dashboard' }],
    };

    const result = (await orchestrator.executeFlow(flowDefinition, {})) as unknown as Record<string, unknown>;

    expect(result.status).toBe('passed');
    expect(executedModules).not.toContain('registro');
    expect(executedModules).toEqual(['simulacion', 'dashboard']);
    expect(receivedFlowVars).toEqual({ USER_ID: 'USR-PREV' });
    expect(result.completed_modules).toEqual(['registro', 'simulacion', 'dashboard']);
  });

  it('d) Variable ${flow.*} no capturada -> Falla con flow_context_missing y sin locks huérfanos', async () => {
    await storage.saveTestPlan('registro', { name: 'registro', cases: [] });
    await storage.saveTestPlan('simulacion', {
      name: 'simulacion',
      cases: [{ id: 'tc_missing', steps: [{ type: 'navigate', url: '/url/${flow.MISSING_VAR}' }] }],
    });

    const mockRunner = {
      execute: async () => ({ status: 'success', success: true }),
    };

    const orchestrator = new FlowOrchestrator(storage as any, mockRunner as any, lockManager, contextStore);

    const flowDefinition = {
      _version: '1.0',
      name: 'missing_context_flow',
      modules: [{ module: 'registro' }, { module: 'simulacion' }],
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

describe('P1-A & P1-B: Selección efectiva de casos referenciados por ID y propagación de telemetría', () => {
  const testCasesById: Record<string, { id: string; name: string; tags: string[]; steps: unknown[] }> = {
    'TC-SMOKE': {
      id: 'TC-SMOKE',
      name: 'Smoke Case',
      tags: ['smoke'],
      steps: [{ type: 'navigate', url: 'https://example.test/smoke' }],
    },
    'TC-REGRESSION': {
      id: 'TC-REGRESSION',
      name: 'Regression Case',
      tags: ['regression'],
      steps: [{ type: 'navigate', url: 'https://example.test/regression' }],
    },
  };

  function createTaggedStorage() {
    return {
      getTestPlan: async (moduleName: string) => ({
        modules: [moduleName],
        cases: ['TC-SMOKE', 'TC-REGRESSION'],
      }),
      getTestCase: async (_moduleName: string, caseId: string) => testCasesById[caseId] ?? null,
    };
  }

  it('1) Filtro smoke: resuelve metadatos de casos referenciados por ID y envía únicamente ["TC-SMOKE"] al Runner', async () => {
    const receivedCases: unknown[] = [];
    const mockRunner = {
      execute: async (plan: { cases?: unknown[] }) => {
        receivedCases.push(plan.cases);
        return {
          result: 'passed',
          cases: [{ id: 'TC-SMOKE', result: 'passed', duration_ms: 15 }],
        };
      },
    };

    const orchestrator = new FlowOrchestrator(createTaggedStorage() as any, mockRunner as any);
    const result = (await orchestrator.executeFlow(
      { _version: '1.0', name: 'flow_smoke_only', modules: [{ module: 'auth' }] } as any,
      { tags: ['smoke'] }
    )) as unknown as Record<string, unknown>;

    expect(result.status).toBe('passed');
    expect(receivedCases).toEqual([['TC-SMOKE']]);
    expect((receivedCases[0] as unknown[]).every((id) => typeof id === 'string')).toBe(true);
  });

  it('2) Sin etiquetas: envía ambos IDs ["TC-SMOKE", "TC-REGRESSION"] al Runner', async () => {
    const receivedCases: unknown[] = [];
    const mockRunner = {
      execute: async (plan: { cases?: unknown[] }) => {
        receivedCases.push(plan.cases);
        return {
          result: 'passed',
          cases: [
            { id: 'TC-SMOKE', result: 'passed', duration_ms: 10 },
            { id: 'TC-REGRESSION', result: 'passed', duration_ms: 20 },
          ],
        };
      },
    };

    const orchestrator = new FlowOrchestrator(createTaggedStorage() as any, mockRunner as any);
    const result = (await orchestrator.executeFlow(
      { _version: '1.0', name: 'flow_unfiltered', modules: [{ module: 'auth' }] } as any,
      {}
    )) as unknown as Record<string, unknown>;

    expect(result.status).toBe('passed');
    expect(receivedCases).toEqual([['TC-SMOKE', 'TC-REGRESSION']]);
  });

  it('3) Selección explícita por módulo: intersecta rawStep.cases con etiquetas efectivas y respeta tags explícitos', async () => {
    const receivedByModule: Record<string, unknown> = {};
    const mockRunner = {
      execute: async (plan: { modules: string[]; cases?: unknown[] }) => {
        receivedByModule[plan.modules[0]] = plan.cases;
        return { result: 'passed' };
      },
    };

    const orchestrator = new FlowOrchestrator(createTaggedStorage() as any, mockRunner as any);
    const result = (await orchestrator.executeFlow(
      {
        _version: '1.0',
        name: 'flow_explicit_module_selection',
        modules: [
          { module: 'mod_explicit_cases', cases: ['TC-SMOKE', 'TC-REGRESSION'] },
          { module: 'mod_explicit_tags', tags: ['regression'] },
        ],
      } as any,
      { tags: ['smoke'] }
    )) as unknown as Record<string, unknown>;

    expect(result.status).toBe('passed');
    expect(receivedByModule['mod_explicit_cases']).toEqual(['TC-SMOKE']);
    expect(receivedByModule['mod_explicit_tags']).toEqual(['TC-REGRESSION']);

    const disjointRes = (await orchestrator.executeFlow(
      {
        _version: '1.0',
        name: 'flow_explicit_disjoint',
        modules: [{ module: 'mod_disjoint', cases: ['TC-REGRESSION'] }],
      } as any,
      { tags: ['smoke'] }
    )) as unknown as Record<string, unknown>;

    expect(disjointRes.status).toBe('failed');
    expect(receivedByModule['mod_disjoint']).toBeUndefined();

    const unfilteredRes = (await orchestrator.executeFlow(
      {
        _version: '1.0',
        name: 'flow_explicit_unfiltered',
        modules: [{ module: 'mod_explicit_only', cases: ['TC-REGRESSION'] }],
      } as any,
      {}
    )) as unknown as Record<string, unknown>;

    expect(unfilteredRes.status).toBe('passed');
    expect(receivedByModule['mod_explicit_only']).toEqual(['TC-REGRESSION']);
  });

  it('3b) Fallo A: casos inline pasan IDs string en TestPlan.cases + storageResolver y rechazan entradas fuera de contrato', async () => {
    const receivedPlans: Array<{ cases?: unknown[] }> = [];
    const resolvedCases: unknown[] = [];

    const inlineStorage = {
      getTestPlan: async (moduleName: string) => ({
        modules: [moduleName],
        cases: [
          {
            id: 'tc_inline_smoke',
            name: 'Inline Smoke',
            tags: ['smoke'],
            steps: [{ type: 'navigate', url: 'https://example.test/smoke' }],
          },
          {
            id: 'tc_inline_reg',
            name: 'Inline Regression',
            tags: ['regression'],
            steps: [{ type: 'navigate', url: 'https://example.test/reg' }],
          },
        ],
      }),
    };

    const mockRunner = {
      execute: async (plan: { modules: string[]; cases?: unknown[] }, opts: { storageResolver?: (m: string, id: string) => Promise<unknown> }) => {
        receivedPlans.push({ cases: plan.cases });
        expect(plan.cases?.every((id) => typeof id === 'string')).toBe(true);
        for (const id of (plan.cases ?? []) as string[]) {
          resolvedCases.push(await opts.storageResolver?.(plan.modules[0], id));
        }
        return { result: 'passed' };
      },
    };

    const orchestrator = new FlowOrchestrator(inlineStorage as any, mockRunner as any);
    const taggedResult = (await orchestrator.executeFlow(
      {
        _version: '1.0',
        name: 'flow_inline_tagged',
        modules: [{ module: 'mod_inline' }],
      } as any,
      { tags: ['smoke'] }
    )) as unknown as Record<string, unknown>;

    expect(taggedResult.status).toBe('passed');
    expect(receivedPlans).toEqual([{ cases: ['tc_inline_smoke'] }]);
    expect(resolvedCases).toEqual([
      expect.objectContaining({ id: 'tc_inline_smoke', name: 'Inline Smoke' }),
    ]);

    // Representaciones históricas o malformadas fuera de contrato no se ejecutan silenciosamente
    const badInputs = [
      [{ name: 'sin-id', steps: [] }],
      [{ case_id: 'legacy-id', steps: [{ type: 'navigate', url: '/' }] }],
      [{ id: 'tc-no-steps' }],
      [{ id: 'tc-legacy-action', steps: [{ action: 'navigate', target: '/' }] }],
      [123],
    ];

    for (const badCases of badInputs) {
      let runnerCalled = 0;
      const badOrchestrator = new FlowOrchestrator(
        {
          getTestPlan: async (moduleName: string) => ({ modules: [moduleName], cases: badCases }),
        } as any,
        {
          execute: async () => {
            runnerCalled += 1;
            return { result: 'passed' };
          },
        } as any
      );
      const badRes = (await badOrchestrator.executeFlow(
        { _version: '1.0', name: 'flow_bad_inline', modules: [{ module: 'mod_bad' }] } as any,
        {}
      )) as unknown as Record<string, unknown>;
      expect(badRes.status).toBe('error');
      expect(runnerCalled).toBe(0);
    }

    // Objetos dentro de rawStep.cases también se rechazan sin llegar al Runner
    let explicitBadRunnerCalls = 0;
    const explicitBadOrch = new FlowOrchestrator(
      { getTestPlan: async (m: string) => ({ modules: [m], cases: [] }) } as any,
      {
        execute: async () => {
          explicitBadRunnerCalls += 1;
          return { result: 'passed' };
        },
      } as any
    );
    const explicitBadRes = (await explicitBadOrch.executeFlow(
      {
        _version: '1.0',
        name: 'flow_bad_step_cases',
        modules: [{ module: 'mod_a', cases: [{ id: 'tc_obj', steps: [] }] }],
      } as any,
      {}
    )) as unknown as Record<string, unknown>;
    expect(explicitBadRes.status).toBe('error');
    expect(String(explicitBadRes.error)).toContain('Contrato inválido');
    expect(explicitBadRunnerCalls).toBe(0);
  });

  it('4) Ningún caso coincidente: no invoca al Runner ni genera PASS ficticio', async () => {
    let runnerCalls = 0;
    const mockRunner = {
      execute: async () => {
        runnerCalls += 1;
        return { result: 'passed' };
      },
    };

    const telemetryEvents: unknown[] = [];
    const finishCalls: unknown[] = [];
    const mockTelemetry = {
      onCaseEnd: (ev: unknown) => telemetryEvents.push(ev),
      finish: (opts?: unknown) => finishCalls.push(opts),
    };

    const orchestrator = new FlowOrchestrator(
      createTaggedStorage() as any,
      mockRunner as any,
      undefined,
      undefined,
      mockTelemetry as any
    );

    const result = (await orchestrator.executeFlow(
      { _version: '1.0', name: 'flow_no_match', modules: [{ module: 'auth' }] } as any,
      { tags: ['nonexistent-tag'] }
    )) as unknown as Record<string, unknown>;

    expect(runnerCalls).toBe(0);
    expect(result.status).toBe('failed');
    expect(result.completed_modules).toEqual([]);
    expect((result.results as Record<string, { result: string }>).auth.result).toBe('failed');
    expect(telemetryEvents).toEqual([]);
    expect(finishCalls).toEqual([expect.objectContaining({ status: 'failed' })]);
  });

  it('5) P1-B en FlowOrchestrator: conserva not_run, skipped y failed con motivo original de bloqueo y propaga estado terminal', async () => {
    const mockStorage = {
      getTestPlan: async (moduleName: string) => ({
        modules: [moduleName],
        cases: ['TC-ORACLE-BLOCKED'],
      }),
      getTestCase: async () => ({
        id: 'TC-ORACLE-BLOCKED',
        name: 'Blocked BVA Case',
        tags: ['smoke', 'blocked_missing_oracle'],
        steps: [],
      }),
    };

    const mockRunner = {
      execute: async () => ({
        result: 'failed',
        summary: { total: 1, passed: 0, failed: 0, skipped: 0, not_run: 1 },
        cases: [
          {
            id: 'TC-ORACLE-BLOCKED',
            title: 'Blocked BVA Case',
            result: 'not_run',
            not_run_reason: 'blocked_missing_oracle: Caso generado sin oráculo de negocio acreditado.',
            duration_ms: 0,
          },
        ],
      }),
    };

    const telemetryEvents: Array<Record<string, unknown>> = [];
    const finishCalls: unknown[] = [];
    const mockTelemetry = {
      onCaseEnd: (ev: Record<string, unknown>) => telemetryEvents.push(ev),
      finish: (opts?: unknown) => finishCalls.push(opts),
    };

    const orchestrator = new FlowOrchestrator(
      mockStorage as any,
      mockRunner as any,
      undefined,
      undefined,
      mockTelemetry as any
    );

    const result = (await orchestrator.executeFlow(
      {
        _version: '1.0',
        name: 'flow_blocked_oracle',
        fail_fast: true,
        modules: [{ module: 'mod_blocked' }, { module: 'mod_downstream' }],
      } as any,
      { tags: ['smoke'] }
    )) as unknown as Record<string, unknown>;

    expect(result.status).toBe('failed');
    expect(telemetryEvents).toHaveLength(1);
    expect(telemetryEvents[0]).toMatchObject({
      flowName: 'flow_blocked_oracle',
      module: 'mod_blocked',
      caseId: 'TC-ORACLE-BLOCKED',
      status: 'not_run',
      error: expect.stringContaining('blocked_missing_oracle'),
    });
    expect((result.results as Record<string, any>).mod_downstream).toMatchObject({
      result: 'skipped',
      failure_type: 'flow_step_failed',
      message: expect.stringContaining('fail_fast'),
    });
    expect(finishCalls).toEqual([expect.objectContaining({ status: 'failed' })]);
  });

  it('6) Resume con checkpoint completo emite finish({ status: passed, resumeNoOp: true }) sin eventos PASS ficticios; flujo vacío emite failed sin resumeNoOp', async () => {
    const flowDef = {
      _version: '1.0',
      name: 'auditflow',
      modules: [{ module: 'auth' }],
    };

    const existingState = {
      flow_name: 'auditflow',
      started_at: '2026-11-18T10:00:00.000Z',
      completed_modules: ['auth'],
      shared_variables: { TOKEN: 'keep-me' },
    };

    let runnerCalls = 0;
    const savedStates: unknown[] = [];
    const telemetryEvents: unknown[] = [];
    const finishCalls: unknown[] = [];

    const orchestrator = new FlowOrchestrator(
      { getTestPlan: async () => ({ modules: ['auth'], cases: ['TC-SMOKE'] }) } as any,
      {
        execute: async () => {
          runnerCalls++;
          return { result: 'passed' };
        },
      } as any,
      undefined,
      {
        loadState: () => existingState,
        saveState: (s: unknown) => savedStates.push(s),
        hasSessionBackup: () => true,
        backupSessions: () => {},
        restoreSessions: () => false,
      },
      {
        onCaseEnd: (ev: unknown) => telemetryEvents.push(ev),
        finish: (opts?: unknown) => finishCalls.push(opts),
      } as any
    );

    const resumeRes = (await orchestrator.executeFlow(flowDef as any, { tags: ['smoke'] })) as unknown as Record<
      string,
      unknown
    >;
    expect(resumeRes.status).toBe('passed');
    expect(runnerCalls).toBe(0);
    expect(savedStates).toEqual([]);
    expect(telemetryEvents).toEqual([]);
    expect(finishCalls).toEqual([{ status: 'passed', resumeNoOp: true }]);

    // Flujo sin módulos (sin casos ejecutados y sin checkpoint completo) -> failed, sin resumeNoOp
    const emptyFinishCalls: unknown[] = [];
    const emptyOrch = new FlowOrchestrator(
      {} as any,
      {} as any,
      undefined,
      undefined,
      {
        onCaseEnd: () => {},
        finish: (opts?: unknown) => emptyFinishCalls.push(opts),
      } as any
    );
    const emptyRes = (await emptyOrch.executeFlow({ _version: '1.0', name: 'empty_flow', modules: [] } as any, {})) as unknown as Record<string, unknown>;
    expect(emptyRes.status).toBe('failed');
    expect(emptyFinishCalls).toEqual([{ status: 'failed' }]);
  });

  it('7) Regresión R3: cases: [] por selección vacía no fabrica caso ficticio en telemetría, mientras fallo sin campo cases conserva evento de módulo', async () => {
    let runnerCalls = 0;
    const telemetryEvents: unknown[] = [];
    const finishCalls: unknown[] = [];

    const orchestrator = new FlowOrchestrator(
      createTaggedStorage() as any,
      {
        execute: async () => {
          runnerCalls += 1;
          return { result: 'passed', cases: [] };
        },
      } as any,
      undefined,
      undefined,
      {
        onCaseEnd: (ev: unknown) => telemetryEvents.push(ev),
        finish: (opts?: unknown) => finishCalls.push(opts),
      } as any
    );

    const emptyFilterRes = (await orchestrator.executeFlow(
      { _version: '1.0', name: 'auditflow', modules: [{ module: 'audit_mod' }] } as any,
      { tags: ['absent'] }
    )) as unknown as Record<string, unknown>;

    expect(runnerCalls).toBe(0);
    expect(emptyFilterRes.status).toBe('failed');
    expect(telemetryEvents).toEqual([]);
    expect(finishCalls).toEqual([{ status: 'failed' }]);

    // Negativo: fallo de módulo sin campo `cases` continúa siendo failed y conserva su evento de módulo
    const modErrEvents: unknown[] = [];
    const modErrFinishes: unknown[] = [];
    const errOrchestrator = new FlowOrchestrator(
      createTaggedStorage() as any,
      {
        execute: async () => ({
          result: 'failed',
          error: 'Module initialization crashed',
        }),
      } as any,
      undefined,
      undefined,
      {
        onCaseEnd: (ev: unknown) => modErrEvents.push(ev),
        finish: (opts?: unknown) => modErrFinishes.push(opts),
      } as any
    );

    const modErrRes = (await errOrchestrator.executeFlow(
      { _version: '1.0', name: 'auditflow', modules: [{ module: 'audit_mod' }] } as any,
      {}
    )) as unknown as Record<string, unknown>;

    expect(modErrRes.status).toBe('failed');
    expect(modErrEvents).toEqual([
      expect.objectContaining({
        flowName: 'auditflow',
        module: 'audit_mod',
        caseId: 'audit_mod',
        status: 'failed',
        error: 'Module initialization crashed',
      }),
    ]);
    expect(modErrFinishes).toEqual([{ status: 'failed' }]);
  });

  it('7) P2-1: Flow multimódulo con fail_fast y selección vacía no emite casos ficticios para módulos omitidos', async () => {
    const telemetryEvents: unknown[] = [];
    const finishCalls: unknown[] = [];
    const storage = {
      ...createTaggedStorage(),
      getTestCases: async () => [
        {
          id: 'TC-SMOKE-1',
          module: 'mod_a',
          title: 'Smoke case',
          tags: ['smoke'],
          steps: [],
        },
      ],
    };

    const orchestrator = new FlowOrchestrator(
      storage as any,
      {
        execute: async () => {
          throw new Error('No debería ejecutar runner cuando la selección está vacía');
        },
      } as any,
      undefined,
      undefined,
      {
        onCaseEnd: (ev: unknown) => telemetryEvents.push(ev),
        finish: (opts?: unknown) => finishCalls.push(opts),
      } as any
    );

    const result = (await orchestrator.executeFlow(
      {
        _version: '1.0',
        name: 'flow_empty_fail_fast',
        fail_fast: true,
        modules: [{ module: 'mod_a' }, { module: 'mod_b' }],
      } as any,
      { tags: ['does-not-exist'] }
    )) as unknown as Record<string, unknown>;

    expect(result.status).toBe('failed');
    expect(telemetryEvents).toHaveLength(0);
    expect((result.results as Record<string, any>).mod_a).toMatchObject({
      result: 'failed',
      cases: [],
    });
    expect((result.results as Record<string, any>).mod_b).toMatchObject({
      result: 'skipped',
      failure_type: 'flow_step_failed',
      cases: [],
    });
    expect(finishCalls).toEqual([expect.objectContaining({ status: 'failed' })]);
  });
});
