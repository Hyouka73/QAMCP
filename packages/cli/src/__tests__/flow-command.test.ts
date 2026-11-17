import * as fs from 'node:fs';
import * as path from 'node:path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FlowOrchestrator } from '@qap/engine';
import { FlowContextStore } from '@qap/knowledge';

describe('S82-004: CLI Flow Subcommands y Reanudación desde Checkpoint', () => {
  const testDir = path.join(process.cwd(), '.qa_test_cli_flow');
  const statesDir = path.join(testDir, '.qa', 'cache', 'flow_states');
  const definitionsDir = path.join(testDir, '.qa', 'definitions', 'flows');

  beforeEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
    fs.mkdirSync(statesDir, { recursive: true });
    fs.mkdirSync(definitionsDir, { recursive: true });
  });

  afterEach(() => {
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

    const orchestrator = new FlowOrchestrator(mockStorage as any, mockRunner as any, undefined, testDir);
    const result = (await orchestrator.executeFlow(flowDefinition, {})) as unknown as Record<string, unknown>;

    expect(result.status).toBe('passed');
    // mod_1 debió omitirse por estar en completed_modules, solo debieron correr mod_2 y mod_3
    expect(executedModules).toEqual(['mod_2', 'mod_3']);
    expect(result.completed_modules).toEqual(['mod_1', 'mod_2', 'mod_3']);
  });
});