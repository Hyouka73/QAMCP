import { describe, it, expect } from 'vitest';
import type { IStorage } from '@qap/engine';

import { buildKnowledgeGraph, type KnowledgeGraphPayload } from '../graph/graph-builder.js';

describe('GraphBuilder (S5-006)', () => {
  it('debe extraer nodos a partir de módulos simulados en memoria/mock con métricas correctas', async () => {
    const mockStorage: Partial<IStorage> = {
      getProjectRoot: () => '/mock/workspace/my-app',
      getProjectContext: async () => ({
        _version: '1',
        project_name: 'E-Commerce Platform',
      }),
      listModules: async () => ['auth', 'simulation', 'catalog'],
      getModuleContext: async (moduleName: string) => {
        if (moduleName === 'auth') {
          return {
            _version: '1',
            objective: 'Gestión de identidad y sesión de usuarios',
            routes: ['/login', '/logout'],
            sensitive_selectors: ['input[type="password"]', '#token'],
            risks: [],
            manually_edited: false,
          };
        }
        if (moduleName === 'simulation') {
          return {
            _version: '1',
            objective: 'Simulación de cálculo financiero',
            routes: ['/simulation/calc'],
            sensitive_selectors: [],
            risks: ['Riesgo de desbordamiento en memoria'],
            manually_edited: true,
            prd_source: 'https://wiki.corp/prd/simulation.md',
          };
        }
        return {
          _version: '1',
          objective: 'Catálogo de productos',
          routes: ['/products'],
          sensitive_selectors: [],
          risks: [],
          manually_edited: false,
        };
      },
      getRepoMap: async (moduleName: string) => {
        if (moduleName === 'auth') {
          return {
            _version: '1',
            module: 'auth',
            files: ['src/auth/login.ts', 'src/auth/session.ts', 'src/auth/token.ts'],
          };
        }
        if (moduleName === 'simulation') {
          return {
            _version: '1',
            module: 'simulation',
            files: ['src/sim/calc.ts'],
          };
        }
        return {
          _version: '1',
          module: 'catalog',
          files: [],
        };
      },
      listTestCases: async (moduleName: string) => {
        if (moduleName === 'auth') return ['TC-AUTH-001', 'TC-AUTH-002'];
        return [];
      },
      getModulePrereqs: async () => null,
      listFlows: async () => [],
      exists: async () => false,
      list: async () => [],
    };

    const payload: KnowledgeGraphPayload = await buildKnowledgeGraph(mockStorage as unknown as IStorage);

    expect(payload.projectName).toBe('E-Commerce Platform');
    expect(payload.generatedAt).toBeDefined();
    expect(payload.nodes).toHaveLength(3);

    const authNode = payload.nodes.find((n) => n.id === 'auth');
    expect(authNode).toBeDefined();
    expect(authNode?.label).toBe('auth');
    expect(authNode?.type).toBe('module');
    expect(authNode?.hasTests).toBe(true);
    expect(authNode?.routes).toEqual(['/login', '/logout']);
    expect(authNode?.sensitiveSelectorsCount).toBe(2);
    expect(authNode?.filesCount).toBe(3);
    expect(authNode?.risksCount).toBe(0);
    expect(authNode?.manuallyEdited).toBe(false);

    const simNode = payload.nodes.find((n) => n.id === 'simulation');
    expect(simNode).toBeDefined();
    expect(simNode?.hasTests).toBe(false);
    expect(simNode?.risksCount).toBe(1);
    expect(simNode?.prdSource).toBe('https://wiki.corp/prd/simulation.md');
    expect(simNode?.manuallyEdited).toBe(true);
    expect(simNode?.filesCount).toBe(1);

    expect(payload.modulesDetail['auth']).toBeDefined();
    expect(payload.modulesDetail['simulation']).toBeDefined();
  });

  it('debe crear aristas de prerrequisitos a partir de prereqs.yaml (auth -> simulation)', async () => {
    const mockStorage: Partial<IStorage> = {
      getProjectRoot: () => '/mock/workspace/test',
      listModules: async () => ['auth', 'simulation'],
      getModuleContext: async (mod: string) => ({
        _version: '1',
        objective: `Module ${mod}`,
        manually_edited: false,
      }),
      getRepoMap: async () => null,
      listTestCases: async () => [],
      getModulePrereqs: async (moduleName: string) => {
        if (moduleName === 'simulation') {
          return {
            _version: '1',
            module: 'simulation',
            requires: {
              auth: {
                primary: 'auth',
              },
            },
          };
        }
        return null;
      },
      listFlows: async () => [],
      exists: async () => false,
      list: async () => [],
    };

    const payload = await buildKnowledgeGraph(mockStorage as unknown as IStorage);

    expect(payload.edges).toHaveLength(1);
    expect(payload.edges[0]).toEqual({
      from: 'auth',
      to: 'simulation',
      label: 'prereq',
      type: 'prereq',
    });
  });

  it('debe crear aristas secuenciales a partir de flows/*.yaml', async () => {
    const mockStorage: Partial<IStorage> = {
      getProjectRoot: () => '/mock/workspace/test',
      listModules: async () => ['auth', 'simulation', 'checkout'],
      getModuleContext: async (mod: string) => ({
        _version: '1',
        objective: `Module ${mod}`,
        manually_edited: false,
      }),
      getRepoMap: async () => null,
      listTestCases: async () => [],
      getModulePrereqs: async () => null,
      listFlows: async () => ['onboarding'],
      getFlow: async (flowName: string) => {
        if (flowName === 'onboarding') {
          return {
            _version: '1',
            name: 'User Onboarding',
            modules: [
              { module: 'auth' },
              { module: 'simulation' },
              { module: 'checkout' },
            ],
          };
        }
        throw new Error('Flow not found');
      },
      exists: async () => false,
      list: async () => [],
    };

    const payload = await buildKnowledgeGraph(mockStorage as unknown as IStorage);

    expect(payload.edges).toHaveLength(2);
    expect(payload.edges[0]).toEqual({
      from: 'auth',
      to: 'simulation',
      label: 'User Onboarding',
      type: 'flow',
    });
    expect(payload.edges[1]).toEqual({
      from: 'simulation',
      to: 'checkout',
      label: 'User Onboarding',
      type: 'flow',
    });
  });

  it('debe extraer capturas y ejecuciones recientes de .qa/executions', async () => {
    const mockStorage: Partial<IStorage> = {
      getProjectRoot: () => '/mock/workspace/test',
      listModules: async () => ['auth'],
      getModuleContext: async () => ({
        _version: '1',
        objective: 'Auth',
        manually_edited: false,
      }),
      getRepoMap: async () => null,
      listTestCases: async () => [],
      getModulePrereqs: async () => null,
      listFlows: async () => [],
      exists: async (path: string) => path === '.qa/executions',
      list: async (path: string) => {
        if (path === '.qa/executions') return ['exec-101.json'];
        return [];
      },
      readJson: async <T>(path: string): Promise<T> => {
        if (path === '.qa/executions/exec-101.json') {
          return {
            id: 'exec-101',
            module: 'auth',
            status: 'success',
            timestamps: {
              started_at: '2026-09-19T14:30:00Z',
            },
            screenshots: [
              { path: '.qa/executions/exec-101/login-before.png' },
              { path: '.qa/executions/exec-101/login-after.png' },
            ],
          } as unknown as T;
        }
        throw new Error('Not found');
      },
    };

    const payload = await buildKnowledgeGraph(mockStorage as unknown as IStorage);

    expect(payload.recentExecutions).toHaveLength(1);
    expect(payload.recentExecutions[0].id).toBe('exec-101');
    expect(payload.recentExecutions[0].module).toBe('auth');
    expect(payload.recentExecutions[0].result).toBe('success');
    expect(payload.recentExecutions[0].screenshots).toEqual([
      '/artifacts/exec-101/login-before.png',
      '/artifacts/exec-101/login-after.png',
    ]);
  });
});
