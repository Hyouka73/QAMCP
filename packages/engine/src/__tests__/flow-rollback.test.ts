import * as fs from 'node:fs';
import * as path from 'node:path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { FlowOrchestrator } from '../flow-orchestrator.js';
import type { IFlowState, IFlowStateStore } from '../ports.js';

function createTestFlowStore(rootDir: string): IFlowStateStore {
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

    const sessionFile2 = path.join(sessionsDir, 'admin_auth.json');
    const original2 = Buffer.from(JSON.stringify({ token: 'admin_secret', expires: 12345 }), 'utf-8');
    fs.writeFileSync(sessionFile2, original2);
    const originalBuf1 = fs.readFileSync(sessionFile);

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
          fs.writeFileSync(sessionFile2, 'basura', 'utf-8');
          fs.writeFileSync(path.join(sessionsDir, 'nueva.json'), '{}', 'utf-8');
          return { result: 'failed' };
        }
        return { result: 'passed' };
      },
    };

    const store = createTestFlowStore(testDir);
    const orchestrator = new FlowOrchestrator(mockStorage as any, mockRunner as any, undefined, store);

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

    const savedState = store.loadState('flow_with_rollback');
    expect(savedState).not.toBeNull();
    expect(savedState?.completed_modules).toEqual(['mod_1']);
        // Restauración bit a bit
    expect(fs.readFileSync(sessionFile).equals(originalBuf1)).toBe(true);
    expect(fs.readFileSync(sessionFile2).equals(original2)).toBe(true);

    // La sesión creada durante el flujo se eliminó
    expect(fs.existsSync(path.join(sessionsDir, 'nueva.json'))).toBe(false);

    // Existe el backup y el checkpoint quedó intacto
    expect(fs.existsSync(path.join(statesDir, 'flow_with_rollback.sessions.bak.json'))).toBe(true);
    expect(savedState?.shared_variables).toEqual({});

    // El módulo 3 no corrió
    expect(result.completed_modules).not.toContain('mod_3');
  });

    it('no sobrescribe el backup original al reanudar un flujo', async () => {
    const sessionFile = path.join(sessionsDir, 'user_auth.json');
    const original = JSON.stringify({ token: 'original' });
    fs.writeFileSync(sessionFile, original, 'utf-8');

    const store = createTestFlowStore(testDir);
    store.backupSessions('flow_resume');
    store.saveState({
      flow_name: 'flow_resume',
      started_at: new Date().toISOString(),
      completed_modules: ['mod_1'],
      shared_variables: {},
    });

    // Las sesiones cambian durante el flujo (después del backup)
    fs.writeFileSync(sessionFile, JSON.stringify({ token: 'modificado' }), 'utf-8');

    const mockStorage = {
      getTestPlan: async (m: string) => ({ name: m, cases: [] }),
    };
    const mockRunner = { execute: async () => ({ result: 'passed' }) };
    const orchestrator = new FlowOrchestrator(mockStorage as any, mockRunner as any, undefined, store);

    await orchestrator.executeFlow(
      { _version: '1.0', name: 'flow_resume', modules: [{ module: 'mod_1' }, { module: 'mod_2' }] } as any,
      {}
    );

    const bak = JSON.parse(
      fs.readFileSync(path.join(statesDir, 'flow_resume.sessions.bak.json'), 'utf-8')
    ) as Record<string, string>;
    expect(bak['user_auth.json']).toBe(original);
  });
});