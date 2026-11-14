// packages/engine/src/_tests_/flow-integration.test.ts
import * as fs from 'node:fs';
import * as path from 'node:path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { FlowOrchestrator } from '../flow-orchestrator.js';

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