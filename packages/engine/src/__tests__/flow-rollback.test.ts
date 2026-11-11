import * as fs from 'node:fs';
import * as path from 'node:path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FlowContextStore } from '@qap/knowledge';

import { FlowOrchestrator } from '../flow-orchestrator.js';


describe('S82-003: Rollback transaccional de sesiones y checkpoints', () => {
  const testDir = path.join(process.cwd(), '.qa_test_s82_003');
  const sessionsDir = path.join(testDir, '.qa', 'cache', 'sessions');
  const statesDir = path.join(testDir, '.qa', 'cache', 'flow_states');

  beforeEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
    fs.mkdirSync(sessionsDir, { recursive: true });
    fs.mkdirSync(statesDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('debe respaldar y restaurar bit a bit las sesiones cifradas ante fallo en módulo 2 de 3 manteniendo intacto .state.json', async () => {
    const sessionFile = path.join(sessionsDir, 'user_auth.json');
    const originalSessionContent = JSON.stringify({ token: 'encrypted_secret_123', expires: 99999 });
    fs.writeFileSync(sessionFile, originalSessionContent, 'utf-8');

    const mockStorage = {
      getTestPlan: async (moduleName: string) => ({
        name: moduleName,
        cases: [{ id: `tc_${moduleName}`, steps: [] }],
      }),
    };

    const mockRunner = {
      execute: async (plan: any) => {
        if (plan.name === 'mod_2') {
          fs.writeFileSync(sessionFile, JSON.stringify({ token: 'corrupted_token' }), 'utf-8');
          return { success: false, status: 'failed' };
        }
        return { success: true, status: 'passed' };
      },
    };

    const orchestrator = new FlowOrchestrator(mockStorage as any, mockRunner as any, undefined, testDir);

    const flowDefinition = {
      _version: '1.0',
      name: 'flow_with_rollback',
      modules: [
        { module: 'mod_1' },
        { module: 'mod_2' },
        { module: 'mod_3' },
      ],
      teardown: {
        on_failure: 'rollback_storage_state',
      },
      fail_fast: true,
    };

const result = (await orchestrator.executeFlow(flowDefinition, {})) as unknown as Record<string, unknown>;

    expect(result.status).toBe('failed');
    expect(result.completed_modules).toEqual(['mod_1']);

    const restoredSessionContent = fs.readFileSync(sessionFile, 'utf-8');
    expect(restoredSessionContent).toBe(originalSessionContent);

    const store = new FlowContextStore(testDir);
    const savedState = store.loadState('flow_with_rollback');
    expect(savedState).not.toBeNull();
    expect(savedState?.completed_modules).toEqual(['mod_1']);
  });
});