import { describe, it, expect } from 'vitest';
import type { IStorage } from '@qap/engine';

import { buildKnowledgeGraph, type KnowledgeGraphPayload } from '../graph/graph-builder.js';

describe('GraphBuilder (S5-006 / QAP v2.1 Universal Architecture)', () => {
  it('debe extraer nodos con el modelo universal de arquitectura (ModuleArchitectureNode, views y surfaces)', async () => {
    const mockStorage: Partial<IStorage> = {
      getProjectRoot: () => '/mock/workspace/digital-banking',
      getProjectContext: async () => ({
        _version: '1',
        project_name: 'QAP Banco Digital',
      }),
      listModules: async () => ['auth', 'simulation', 'checkout'],
      getModuleContext: async (moduleName: string) => {
        if (moduleName === 'auth') {
          return {
            _version: '1',
            module: 'auth',
            description: 'Autenticación, control de acceso y gestión de sesiones',
            base_route: '/auth',
            views: [
              {
                id: 'login-view',
                name: 'Inicio de Sesión',
                path: '/auth/login',
                surfaces: [
                  { id: 'form-credentials', name: 'Formulario de Acceso', type: 'section' },
                  { id: 'modal-mfa', name: 'Verificación en Dos Pasos (TOTP)', type: 'modal' },
                ],
              },
              {
                id: 'recovery-view',
                name: 'Recuperación de Contraseña',
                path: '/auth/recover',
              },
            ],
            sensitive_selectors: ['#password', '#totp-token'],
          };
        }
        if (moduleName === 'simulation') {
          return {
            _version: '1',
            module: 'simulation',
            description: 'Motor interactivo de cotización y escenarios',
            base_route: '/simulation',
            views: [
              {
                id: 'calculator-view',
                name: 'Calculadora de Escenarios',
                path: '/simulation/calculator',
                surfaces: [
                  { id: 'tab-parameters', name: 'Parámetros Generales', type: 'tab' },
                  { id: 'tab-schedule', name: 'Tabla de Amortización', type: 'tab' },
                  { id: 'tab-fees', name: 'Comisiones y Gastos', type: 'tab' },
                ],
              },
            ],
            sensitive_selectors: ['#client-income', '#rfc-tax-id'],
          };
        }
        return {
          _version: '1',
          module: 'checkout',
          description: 'Formalización, firma electrónica y confirmación',
          base_route: '/checkout',
          views: [
            {
              id: 'summary-view',
              name: 'Resumen de Contratación',
              path: '/checkout/review',
            },
            {
              id: 'signature-view',
              name: 'Firma Digital',
              path: '/checkout/sign',
              surfaces: [
                { id: 'panel-signature', name: 'Lienzo de Firma Biométrica', type: 'section' },
                { id: 'modal-terms', name: 'Términos y Condiciones', type: 'modal' },
              ],
            },
          ],
          sensitive_selectors: ['#bank-account-clabe'],
        };
      },
      getRepoMap: async (moduleName: string) => {
        if (moduleName === 'auth') {
          return {
            _version: '1',
            module: 'auth',
            files: ['src/modules/auth/login-form.tsx', 'src/modules/auth/mfa-challenge.tsx'],
          };
        }
        if (moduleName === 'simulation') {
          return {
            _version: '1',
            module: 'simulation',
            files: ['src/modules/simulation/credit-calc.ts'],
          };
        }
        return {
          _version: '1',
          module: 'checkout',
          files: ['src/modules/checkout/contract-sign.tsx', 'src/modules/checkout/disbursement.ts'],
        };
      },
      listTestCases: async (moduleName: string) => {
        if (moduleName === 'auth') return ['TC-001', 'TC-002'];
        return [];
      },
      getModulePrereqs: async () => null,
      listFlows: async () => [],
      exists: async () => false,
      list: async () => [],
    };

    const payload: KnowledgeGraphPayload = await buildKnowledgeGraph(mockStorage as unknown as IStorage);

    expect(payload.projectName).toBe('QAP Banco Digital');
    expect(payload.generatedAt).toBeDefined();
    expect(payload.nodes).toHaveLength(3);

    // Auth Module Node
    const authNode = payload.nodes.find((n) => n.id === 'auth');
    expect(authNode).toBeDefined();
    expect(authNode?.label).toBe('auth');
    expect(authNode?.baseRoute).toBe('/auth');
    expect(authNode?.description).toBe('Autenticación, control de acceso y gestión de sesiones');
    expect(authNode?.filesCount).toBe(2);
    expect(authNode?.sensitiveSelectors).toEqual(['#password', '#totp-token']);
    expect(authNode?.hasTests).toBe(true);
    expect(authNode?.testsCount).toBe(2);
    expect(authNode?.views).toHaveLength(2);
    expect(authNode?.views[0].id).toBe('login-view');
    expect(authNode?.views[0].path).toBe('/auth/login');
    expect(authNode?.views[0].surfaces).toHaveLength(2);
    expect(authNode?.views[0].surfaces[0]).toEqual({
      id: 'form-credentials',
      name: 'Formulario de Acceso',
      type: 'section',
    });
    expect(authNode?.views[0].surfaces[1]).toEqual({
      id: 'modal-mfa',
      name: 'Verificación en Dos Pasos (TOTP)',
      type: 'modal',
    });

    // Simulation Module Node
    const simNode = payload.nodes.find((n) => n.id === 'simulation');
    expect(simNode).toBeDefined();
    expect(simNode?.baseRoute).toBe('/simulation');
    expect(simNode?.filesCount).toBe(1);
    expect(simNode?.sensitiveSelectors).toEqual(['#client-income', '#rfc-tax-id']);
    expect(simNode?.views).toHaveLength(1);
    expect(simNode?.views[0].surfaces).toHaveLength(3);
    expect(simNode?.views[0].surfaces.map((s) => s.type)).toEqual(['tab', 'tab', 'tab']);

    // Checkout Module Node
    const chkNode = payload.nodes.find((n) => n.id === 'checkout');
    expect(chkNode).toBeDefined();
    expect(chkNode?.baseRoute).toBe('/checkout');
    expect(chkNode?.filesCount).toBe(2);
    expect(chkNode?.views).toHaveLength(2);
    expect(chkNode?.views[1].surfaces).toHaveLength(2);
    expect(chkNode?.views[1].surfaces[0].type).toBe('section');
    expect(chkNode?.views[1].surfaces[1].type).toBe('modal');
  });

  it('debe crear aristas de prerrequisitos a partir de prereqs.yaml (auth -> simulation)', async () => {
    const mockStorage: Partial<IStorage> = {
      getProjectRoot: () => '/mock/workspace/test',
      listModules: async () => ['auth', 'simulation'],
      getModuleContext: async (mod: string) => ({
        _version: '1',
        module: mod,
        description: `Module ${mod}`,
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
      weight: 2,
    });
  });

  it('debe crear aristas secuenciales a partir de flows/*.yaml', async () => {
    const mockStorage: Partial<IStorage> = {
      getProjectRoot: () => '/mock/workspace/test',
      listModules: async () => ['auth', 'simulation', 'checkout'],
      getModuleContext: async (mod: string) => ({
        _version: '1',
        module: mod,
        description: `Module ${mod}`,
      }),
      getRepoMap: async () => null,
      listTestCases: async () => [],
      getModulePrereqs: async () => null,
      listFlows: async () => ['prestamo-completo'],
      getFlow: async (flowName: string) => {
        if (flowName === 'prestamo-completo') {
          return {
            _version: '1',
            name: 'Préstamo Completo Digital',
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
      label: 'Préstamo Completo Digital',
      type: 'flow',
      weight: 3,
    });
    expect(payload.edges[1]).toEqual({
      from: 'simulation',
      to: 'checkout',
      label: 'Préstamo Completo Digital',
      type: 'flow',
      weight: 3,
    });
  });

  it('debe extraer capturas y ejecuciones recientes de .qa/executions normalizando URLs', async () => {
    const mockStorage: Partial<IStorage> = {
      getProjectRoot: () => '/mock/workspace/test',
      listModules: async () => ['auth'],
      getModuleContext: async () => ({
        _version: '1',
        module: 'auth',
        description: 'Auth',
      }),
      getRepoMap: async () => null,
      listTestCases: async () => [],
      getModulePrereqs: async () => null,
      listFlows: async () => [],
      exists: async (path: string) => path === '.qa/executions',
      list: async (path: string) => {
        if (path === '.qa/executions') return ['2026-09-19_auth_e2e.json'];
        return [];
      },
      readJson: async <T>(path: string): Promise<T> => {
        if (path === '.qa/executions/2026-09-19_auth_e2e.json') {
          return {
            execution_id: '2026-09-19_auth_e2e',
            module: 'auth',
            status: 'success',
            timestamps: {
              started_at: '2026-09-19T19:02:00Z',
              ended_at: '2026-09-19T19:02:11Z',
            },
            steps: [
              {
                name: 'Ingresar credenciales corporativas',
                status: 'success',
                duration_ms: 140,
                screenshot: '.qa/executions/2026-09-19_auth_e2e/01-login-form.png',
              },
            ],
            metadata: {
              environment: 'staging',
              pii_masked_count: 2,
              assertions_passed: 5,
              total_duration_ms: 1060,
            },
            screenshots: [
              { path: '.qa/executions/2026-09-19_auth_e2e/01-login-form.png' },
            ],
          } as unknown as T;
        }
        throw new Error('Not found');
      },
    };

    const payload = await buildKnowledgeGraph(mockStorage as unknown as IStorage);

    expect(payload.recentExecutions).toHaveLength(1);
    const exec = payload.recentExecutions[0];
    expect(exec.id).toBe('2026-09-19_auth_e2e');
    expect(exec.module).toBe('auth');
    expect(exec.result).toBe('success');
    expect(exec.environment).toBe('staging');
    expect(exec.piiMaskedCount).toBe(2);
    expect(exec.screenshots).toEqual(['/artifacts/2026-09-19_auth_e2e/01-login-form.png']);
    expect(exec.steps[0].screenshot).toBe('/artifacts/2026-09-19_auth_e2e/01-login-form.png');

    // Comprobar que el nodo auth hereda cobertura de test por ejecución
    const authNode = payload.nodes.find((n) => n.id === 'auth');
    expect(authNode?.hasTests).toBe(true);
    expect(authNode?.testsCount).toBe(1);
  });
});
