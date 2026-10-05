import type { LifecycleState, ProjectPhase, ModuleLifecycleState } from '@qap/shared';
import { describe, it, expect } from 'vitest';

import {
  transition,
  validateProjectTransition,
  validateModuleTransition,
  transitionProject,
  transitionModule,
  canExitOnboarding,
  canExitScoping,
  canExitWorking,
  canExitWrapUp,
  assertLifecycleStateInvariants,
  PROJECT_TRANSITIONS,
  MODULE_TRANSITIONS,
} from '../lifecycle.js';

describe('Lifecycle Transitions (E2 & Criterio 1)', () => {
  const initialLifecycleState: LifecycleState = {
    _version: '1',
    phase: 'ONBOARDING',
    session: {
      id: 'session-init',
      started_at: '2026-09-30T12:00:00.000Z',
      plan: [],
    },
    modules: {},
    history: [],
  };

  describe('Transiciones de proyecto válidas', () => {
    it('debe permitir ONBOARDING -> SCOPING', () => {
      const res = validateProjectTransition('ONBOARDING', 'SCOPING');
      expect(res.success).toBe(true);
      expect(res.ok).toBe(true);
      expect(res.state).toBe('SCOPING');
    });

    it('debe permitir SCOPING -> WORKING', () => {
      const res = validateProjectTransition('SCOPING', 'WORKING');
      expect(res.success).toBe(true);
      expect(res.state).toBe('WORKING');
    });

    it('debe permitir WORKING -> WRAP_UP', () => {
      const res = validateProjectTransition('WORKING', 'WRAP_UP');
      expect(res.success).toBe(true);
      expect(res.state).toBe('WRAP_UP');
    });

    it('debe permitir WRAP_UP -> SCOPING (nueva sesión)', () => {
      const res = validateProjectTransition('WRAP_UP', 'SCOPING');
      expect(res.success).toBe(true);
      expect(res.state).toBe('SCOPING');
    });

    it('debe ejecutar transición polimórfica en cadena sobre LifecycleState', () => {
      let state = initialLifecycleState;

      // ONBOARDING -> SCOPING
      const step1 = transition(state, 'SCOPING');
      expect(step1.success).toBe(true);
      expect(step1.state.phase).toBe('SCOPING');
      expect(step1.state.history).toHaveLength(1);
      expect(step1.state.history[0]?.from).toBe('ONBOARDING');
      expect(step1.state.history[0]?.to).toBe('SCOPING');
      state = step1.state;

      // SCOPING -> WORKING
      const step2 = transition(state, 'WORKING');
      expect(step2.success).toBe(true);
      expect(step2.state.phase).toBe('WORKING');
      state = step2.state;

      // WORKING -> WRAP_UP
      const step3 = transition(state, 'WRAP_UP');
      expect(step3.success).toBe(true);
      expect(step3.state.phase).toBe('WRAP_UP');
      state = step3.state;

      // WRAP_UP -> SCOPING (nueva sesión)
      const step4 = transition(state, 'SCOPING');
      expect(step4.success).toBe(true);
      expect(step4.state.phase).toBe('SCOPING');
      expect(step4.state.history).toHaveLength(4);
    });
  });

  describe('Transiciones de proyecto inválidas', () => {
    const invalidTransitions: Array<[ProjectPhase, ProjectPhase]> = [
      ['ONBOARDING', 'WORKING'],
      ['ONBOARDING', 'WRAP_UP'],
      ['ONBOARDING', 'ONBOARDING'],
      ['SCOPING', 'ONBOARDING'],
      ['SCOPING', 'WRAP_UP'],
      ['SCOPING', 'SCOPING'],
      ['WORKING', 'ONBOARDING'],
      ['WORKING', 'SCOPING'],
      ['WORKING', 'WORKING'],
      ['WRAP_UP', 'ONBOARDING'],
      ['WRAP_UP', 'WORKING'],
      ['WRAP_UP', 'WRAP_UP'],
    ];

    for (const [from, to] of invalidTransitions) {
      it(`debe rechazar ${from} -> ${to} con error tipificado`, () => {
        const res = validateProjectTransition(from, to);
        expect(res.success).toBe(false);
        expect(res.ok).toBe(false);
        expect(res.error).toBeDefined();
        expect(res.error?.estado_actual).toBe(from);
        expect(res.error?.transiciones_permitidas).toEqual(PROJECT_TRANSITIONS[from]);
        expect(res.error?.razon).toContain(`no se permite pasar de '${from}' a '${to}'`);
      });
    }
  });

  describe('Transiciones de módulo válidas', () => {
    it('debe permitir planned -> observed', () => {
      const res = validateModuleTransition('planned', 'observed');
      expect(res.success).toBe(true);
      expect(res.state).toBe('observed');
    });

    it('debe permitir observed -> interviewing', () => {
      const res = validateModuleTransition('observed', 'interviewing');
      expect(res.success).toBe(true);
      expect(res.state).toBe('interviewing');
    });

    it('debe permitir interviewing -> consolidated', () => {
      const res = validateModuleTransition('interviewing', 'consolidated');
      expect(res.success).toBe(true);
      expect(res.state).toBe('consolidated');
    });

    it('debe permitir consolidated -> closed', () => {
      const res = validateModuleTransition('consolidated', 'closed');
      expect(res.success).toBe(true);
      expect(res.state).toBe('closed');
    });

    it('debe permitir re-observación: interviewing -> observed', () => {
      const res = validateModuleTransition('interviewing', 'observed');
      expect(res.success).toBe(true);
      expect(res.state).toBe('observed');
    });

    const nonTerminalStates: ModuleLifecycleState[] = ['planned', 'observed', 'interviewing', 'consolidated'];
    for (const st of nonTerminalStates) {
      it(`debe permitir ${st} -> waived cuando se suministra waived_reason`, () => {
        const res = validateModuleTransition(st, 'waived', 'Módulo fuera de alcance de release');
        expect(res.success).toBe(true);
        expect(res.state).toBe('waived');
      });
    }

    it('debe actualizar el módulo e historial en transitionModule', () => {
      const state = initialLifecycleState;
      const res = transitionModule(state, 'checkout', 'observed');
      expect(res.success).toBe(true);
      expect(res.state.modules['checkout']?.state).toBe('observed');
      expect(res.state.history).toHaveLength(1);
      expect(res.state.history[0]?.from).toBe('checkout:planned');
      expect(res.state.history[0]?.to).toBe('checkout:observed');
    });
  });

  describe('Transiciones de módulo inválidas', () => {
    const nonTerminalStates: ModuleLifecycleState[] = ['planned', 'observed', 'interviewing', 'consolidated'];

    for (const st of nonTerminalStates) {
      it(`debe rechazar ${st} -> waived sin waived_reason`, () => {
        const res = validateModuleTransition(st, 'waived');
        expect(res.success).toBe(false);
        expect(res.error?.estado_actual).toBe(st);
        expect(res.error?.transiciones_permitidas).toEqual(MODULE_TRANSITIONS[st]);
        expect(res.error?.razon).toContain('waived_reason');
      });

      it(`debe rechazar ${st} -> waived con waived_reason vacío o de solo espacios`, () => {
        const res = validateModuleTransition(st, 'waived', '   ');
        expect(res.success).toBe(false);
        expect(res.error?.razon).toContain('waived_reason');
      });
    }

    const terminalStates: ModuleLifecycleState[] = ['closed', 'waived'];
    for (const term of terminalStates) {
      for (const target of ['planned', 'observed', 'interviewing', 'consolidated', 'closed', 'waived'] as ModuleLifecycleState[]) {
        it(`debe rechazar transiciones desde estado terminal ${term} -> ${target}`, () => {
          const res = validateModuleTransition(term, target, 'Cualquier razón');
          expect(res.success).toBe(false);
          expect(res.error?.estado_actual).toBe(term);
          expect(res.error?.transiciones_permitidas).toEqual([]);
          expect(res.error?.razon).toContain('es terminal');
        });
      }
    }

    it('debe rechazar saltos ilegales de secuencia (ej: planned -> closed)', () => {
      const res = validateModuleTransition('planned', 'closed');
      expect(res.success).toBe(false);
      expect(res.error?.estado_actual).toBe('planned');
      expect(res.error?.transiciones_permitidas).toEqual(['observed', 'waived']);
    });
  });

  describe('Historial acotado a máx 50 entradas (FIFO)', () => {
    it('debe descartar las entradas más antiguas si supera 50', () => {
      let state = initialLifecycleState;
      // Realizamos 55 transiciones alternadas
      for (let i = 1; i <= 55; i++) {
        const targetPhase: ProjectPhase = i % 2 === 1 ? 'SCOPING' : 'WORKING';
        state = {
          ...state,
          phase: i % 2 === 1 ? 'WRAP_UP' : 'SCOPING',
        };
        const res = transitionProject(state, targetPhase, `Paso ${i}`);
        expect(res.success).toBe(true);
        state = res.state;
      }

      expect(state.history.length).toBe(50);
      expect(state.history[0]?.reason).toBe('Paso 6');
      expect(state.history[49]?.reason).toBe('Paso 55');
    });
  });

  describe('Compuertas de salida por fase (Gate Predicates) (E3)', () => {
    const validEnv = {
      environments: {
        local: { url: 'http://localhost:3000' },
      },
    };

    const validContext = {
      project_name: 'mi-app',
      objective: 'Plataforma B2B para gestión de envíos logísticos en tiempo real',
      objective_source: 'user' as const,
      roles: [
        { name: 'operador_logistico', source: 'user' as const },
      ],
      critical_flows: [
        { name: 'despacho_urgente', source: 'prd' as const },
      ],
      source_of_truth: {
        type: 'prd' as const,
        ref: 'docs/prd.md',
        declared: true,
        source: 'user' as const,
      },
    };

    it('canExitOnboarding debe fallar si context no existe o está vacío', () => {
      expect(canExitOnboarding(null).passed).toBe(false);
      expect(canExitOnboarding(undefined).passed).toBe(false);
      expect(canExitOnboarding({}).passed).toBe(false);
    });

    it('canExitOnboarding debe fallar si falta el entorno o no tiene URL', () => {
      const resWithoutEnv = canExitOnboarding(validContext, null);
      expect(resWithoutEnv.passed).toBe(false);
      expect(resWithoutEnv.faltantes.some((f) => f.campo === 'environments')).toBe(true);

      const resWithEmptyEnv = canExitOnboarding(validContext, { environments: {} });
      expect(resWithEmptyEnv.passed).toBe(false);
      expect(resWithEmptyEnv.faltantes.some((f) => f.campo === 'environments')).toBe(true);
    });

    it('canExitOnboarding debe fallar si el objetivo tiene menos de 20 caracteres', () => {
      const shortObjectiveContext = {
        ...validContext,
        objective: 'Objetivo corto',
      };
      const res = canExitOnboarding(shortObjectiveContext, validEnv);
      expect(res.passed).toBe(false);
      expect(res.faltantes.some((f) => f.campo === 'objective' && f.motivo.includes('20 caracteres'))).toBe(true);
    });

    it('canExitOnboarding debe fallar si el objetivo es la descripción genérica de qap_init', () => {
      const genericContext = {
        ...validContext,
        project_name: 'mi-app',
        objective: 'Configuración base de QA para mi-app',
      };
      const res = canExitOnboarding(genericContext, validEnv);
      expect(res.passed).toBe(false);
      expect(res.faltantes.some((f) => f.campo === 'objective' && f.motivo.includes('qap_init'))).toBe(true);
    });

    it('canExitOnboarding debe marcar como faltantes los campos con source "inferred" con motivo "sin confirmar"', () => {
      const inferredContext = {
        ...validContext,
        objective_source: 'inferred' as const,
        roles: [{ name: 'inferred_role', source: 'inferred' as const }],
        critical_flows: [{ name: 'inferred_flow', source: 'inferred' as const }],
        source_of_truth: { type: 'prd' as const, ref: 'prd.md', declared: true, source: 'inferred' as const },
      };
      const res = canExitOnboarding(inferredContext, validEnv);
      expect(res.passed).toBe(false);
      expect(res.faltantes.some((f) => f.campo === 'objective' && f.motivo === 'sin confirmar')).toBe(true);
      expect(res.faltantes.some((f) => f.campo === 'roles' && f.motivo === 'sin confirmar')).toBe(true);
      expect(res.faltantes.some((f) => f.campo === 'critical_flows' && f.motivo === 'sin confirmar')).toBe(true);
      expect(res.faltantes.some((f) => f.campo === 'source_of_truth' && f.motivo === 'sin confirmar')).toBe(true);
    });

    it('canExitOnboarding debe fallar si source_of_truth es "none" pero declared no es true', () => {
      const noneUndeclared = {
        ...validContext,
        source_of_truth: { type: 'none' as const, declared: false, source: 'user' as const },
      };
      const res = canExitOnboarding(noneUndeclared, validEnv);
      expect(res.passed).toBe(false);
      expect(res.faltantes.some((f) => f.campo === 'source_of_truth')).toBe(true);
    });

    it('canExitOnboarding debe aprobar cuando source_of_truth es "none" con declared true', () => {
      const noneDeclared = {
        ...validContext,
        source_of_truth: { type: 'none' as const, declared: true, source: 'user' as const },
      };
      const res = canExitOnboarding(noneDeclared, validEnv);
      expect(res.passed).toBe(true);
      expect(res.faltantes).toHaveLength(0);
    });

    it('canExitOnboarding debe fallar si type es prd pero no tiene ref ni notas', () => {
      const prdWithoutRef = {
        ...validContext,
        source_of_truth: { type: 'prd' as const, declared: true, source: 'user' as const },
      };
      const res = canExitOnboarding(prdWithoutRef, validEnv);
      expect(res.passed).toBe(false);
      expect(res.faltantes.some((f) => f.campo === 'source_of_truth' && f.motivo.includes('ref o notas'))).toBe(true);
    });

    it('canExitOnboarding debe aprobar el caso válido completo', () => {
      const res = canExitOnboarding(validContext, validEnv);
      expect(res.passed).toBe(true);
      expect(res.faltantes).toHaveLength(0);
    });

    describe('canExitScoping', () => {
      it('debe fallar si session.plan está vacío', () => {
        const res = canExitScoping({ id: 's', started_at: '', plan: [], auth: { required: false } });
        expect(res.passed).toBe(false);
        expect(res.faltantes.some((f) => f.campo === 'session.plan')).toBe(true);
      });

      it('debe fallar si una ruta del plan no inicia con "/"', () => {
        const res = canExitScoping({
          id: 's',
          started_at: '',
          plan: [{ module: 'cart', path: 'cart', priority: 'high', status: 'planned' }],
          auth: { required: false },
        });
        expect(res.passed).toBe(false);
        expect(res.faltantes.some((f) => f.campo === 'session.plan' && f.motivo.includes('/'))).toBe(true);
      });

      it('debe fallar si session.auth no está definido', () => {
        const res = canExitScoping({
          id: 's',
          started_at: '',
          plan: [{ module: 'cart', path: '/cart', priority: 'high', status: 'planned' }],
        });
        expect(res.passed).toBe(false);
        expect(res.faltantes.some((f) => f.campo === 'session.auth')).toBe(true);
      });

      it('debe fallar si auth.required es true pero el perfil no existe en los perfiles registrados', () => {
        const res = canExitScoping(
          {
            id: 's',
            started_at: '',
            plan: [{ module: 'cart', path: '/cart', priority: 'high', status: 'planned' }],
            auth: { required: true, profile: 'admin' },
          },
          ['tester', 'guest']
        );
        expect(res.passed).toBe(false);
        expect(res.faltantes.some((f) => f.campo === 'session.auth.profile')).toBe(true);
      });

      it('debe aprobar cuando el plan tiene módulos válidos y auth requerida coincide con perfil registrado', () => {
        const res = canExitScoping(
          {
            id: 's',
            started_at: '',
            plan: [{ module: 'cart', path: '/cart', priority: 'high', status: 'planned' }],
            auth: { required: true, profile: 'admin' },
          },
          ['admin', 'tester']
        );
        expect(res.passed).toBe(true);
        expect(res.faltantes).toHaveLength(0);
      });

      it('debe aprobar cuando auth.required es false y hay al menos un módulo válido', () => {
        const res = canExitScoping({
          id: 's',
          started_at: '',
          plan: [{ module: 'public_home', path: '/home', priority: 'normal', status: 'planned' }],
          auth: { required: false },
        });
        expect(res.passed).toBe(true);
        expect(res.faltantes).toHaveLength(0);
      });
    });

    describe('assertLifecycleStateInvariants (E2)', () => {
      it('debe validar cuando todos los módulos del plan existen en modules', () => {
        const state: LifecycleState = {
          _version: '1',
          phase: 'WORKING',
          session: {
            id: 's1',
            started_at: '',
            plan: [
              { module: 'auth', path: '/login', priority: 'high', status: 'planned' },
              { module: 'cart', path: '/cart', priority: 'normal', status: 'planned' },
            ],
          },
          modules: {
            auth: { state: 'planned', updated_at: '' },
            cart: { state: 'planned', updated_at: '' },
            legacy_module: { state: 'observed', updated_at: '' }, // modules puede tener más módulos que el plan
          },
          history: [],
        };
        const res = assertLifecycleStateInvariants(state);
        expect(res.valid).toBe(true);
      });

      it('debe fallar si un módulo del plan no existe en modules', () => {
        const state: LifecycleState = {
          _version: '1',
          phase: 'WORKING',
          session: {
            id: 's1',
            started_at: '',
            plan: [{ module: 'unregistered', path: '/unreg', priority: 'high', status: 'planned' }],
          },
          modules: {},
          history: [],
        };
        const res = assertLifecycleStateInvariants(state);
        expect(res.valid).toBe(false);
        expect(res.reason).toContain("el módulo 'unregistered' de session.plan no existe en modules");
      });
    });

    it('canExitWorking debe fallar con plan vacío y canExitWrapUp debe permitir pasar', () => {
      const working = canExitWorking();
      expect(working.passed).toBe(false);
      expect(working.reason).toContain('plan de sesión está vacío');

      const wrapUp = canExitWrapUp();
      expect(wrapUp.passed).toBe(true);
    });

    it('transitionProject debe evaluar compuertas cuando checkGates es true', () => {
      const state: LifecycleState = { ...initialLifecycleState, phase: 'ONBOARDING' };

      // Con contexto incompleto -> compuerta bloquea la transición
      const blocked = transitionProject(state, 'SCOPING', 'Avanzar a scoping', {
        checkGates: true,
        context: {
          project_name: 'demo',
          objective: 'Objetivo corto',
        },
        environments: validEnv,
      });
      expect(blocked.success).toBe(false);
      expect(blocked.error?.razon).toContain('superar ONBOARDING');

      // Con contexto válido y entorno -> compuerta permite avanzar
      const passed = transitionProject(state, 'SCOPING', 'Avanzar a scoping', {
        checkGates: true,
        context: validContext,
        environments: validEnv,
      });
      expect(passed.success).toBe(true);
      expect(passed.state.phase).toBe('SCOPING');
    });
  });
});

