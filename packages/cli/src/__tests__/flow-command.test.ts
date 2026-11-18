import * as fs from 'node:fs';
import * as path from 'node:path';

import { Command } from 'commander';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FlowOrchestrator } from '@qap/engine';
import { FileSystemStorage, FlowContextStore } from '@qap/knowledge';

import { registerCommands } from '../commands.js';
import { handleFlowCommand } from '../commands/flow.js';

describe('S82-004: CLI Flow Subcommands y Reanudación desde Checkpoint', () => {
  const testDir = path.join(process.cwd(), '.qa_test_cli_flow');
  const statesDir = path.join(testDir, '.qa', 'cache', 'flow_states');
  const definitionsDir = path.join(testDir, '.qa', 'definitions', 'flows');

  beforeEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
    fs.mkdirSync(statesDir, { recursive: true });
    fs.mkdirSync(definitionsDir, { recursive: true });
    process.exitCode = undefined;
  });

  afterEach(() => {
    process.exitCode = undefined;
    vi.restoreAllMocks();
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('debe reanudar un flujo a partir de un checkpoint omitiendo los módulos ya completados', async () => {
    const flowName = 'sample_flow';
    const flowDefPath = path.join(definitionsDir, `${flowName}.json`);

    const flowDefinition = {
      _version: '1.0',
      name: flowName,
      modules: [
        { module: 'mod_1' },
        { module: 'mod_2' },
        { module: 'mod_3' },
      ],
    };
    fs.writeFileSync(flowDefPath, JSON.stringify(flowDefinition, null, 2), 'utf-8');

    // Simular que mod_1 ya fue completado previamente en el checkpoint
    const store = new FlowContextStore(testDir);
    store.saveState({
      flow_name: flowName,
      started_at: new Date().toISOString(),
      completed_modules: ['mod_1'],
      shared_variables: { session_token: 'token_abc' },
    });

    const executedModules: string[] = [];
    const mockStorage = {
      getTestPlan: async (moduleName: string) => {
        executedModules.push(moduleName);
        return {
          name: moduleName,
          cases: [],
        };
      },
    };

    const mockRunner = {
      execute: async () => ({ result: 'passed' }),
    };

    const orchestrator = new FlowOrchestrator(mockStorage as any, mockRunner as any, undefined, store);
    const result = (await orchestrator.executeFlow(flowDefinition, {})) as unknown as Record<string, unknown>;

    expect(result.status).toBe('passed');
    // mod_1 debió omitirse por estar en completed_modules, solo debieron correr mod_2 y mod_3
    expect(executedModules).toEqual(['mod_2', 'mod_3']);
    expect(result.completed_modules).toEqual(['mod_1', 'mod_2', 'mod_3']);
  });

  it('registra los 5 subcomandos flow en Commander (run, resume, list, validate, debug)', () => {
    const program = new Command();
    registerCommands(program);
    const flowCmd = program.commands.find((c) => c.name() === 'flow');
    expect(flowCmd).toBeDefined();
    expect(flowCmd!.commands.map((c) => c.name())).toEqual(['run', 'resume', 'list', 'validate', 'debug']);
  });

  it('ejecuta handleFlowCommand para list, validate y debug contra .qa/flows y FlowContextStore', async () => {
    const storage = new FileSystemStorage({ rootDir: testDir });
    const flowDef = {
      _version: '1.0',
      name: 'checkout-e2e',
      modules: [{ module: 'auth' }, { module: 'checkout' }],
    };
    await storage.saveFlow('checkout-e2e', flowDef as Parameters<typeof storage.saveFlow>[1]);

    const store = new FlowContextStore(testDir);
    store.backupSessions('checkout-e2e');
    store.saveState({
      flow_name: 'checkout-e2e',
      started_at: '2026-11-18T10:00:00.000Z',
      completed_modules: ['auth'],
      shared_variables: { TOKEN: 'tok_123' },
    });

    const logs: string[] = [];
    const errors: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    });
    vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      errors.push(args.map(String).join(' '));
    });

    await handleFlowCommand('list', undefined, { projectRoot: testDir });
    expect(logs.join('\n')).toContain('checkout-e2e');

    await handleFlowCommand('validate', 'checkout-e2e', { projectRoot: testDir });
    expect(logs.join('\n')).toContain('checkout-e2e: válido');
    expect(process.exitCode).toBeUndefined();

    await handleFlowCommand('validate', undefined, { all: true, projectRoot: testDir });
    expect(process.exitCode).toBeUndefined();

    await handleFlowCommand('debug', 'checkout-e2e', { projectRoot: testDir });
    const debugOut = logs.join('\n');
    expect(debugOut).toContain('TOKEN');
    expect(debugOut).toContain('Respaldo de sesiones: existe');

    // Verificar detección de flujo corrupto
    fs.writeFileSync(path.join(testDir, '.qa', 'flows', 'broken.yaml'), 'modules: 123\n', 'utf-8');
    await handleFlowCommand('validate', 'broken', { projectRoot: testDir });
    expect(errors.join('\n')).toContain('broken');
    expect(process.exitCode).toBe(1);
  });
});
