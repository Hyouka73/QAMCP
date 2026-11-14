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
});