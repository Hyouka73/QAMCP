import { describe, it, expect } from 'vitest';

import type { LifecycleState } from '../types/lifecycle-state.type.js';
import { SchemaValidator } from '../validator/schema-validator.js';

describe('lifecycle-state.schema.json', () => {
  const validator = new SchemaValidator();

  const validState: LifecycleState = {
    _version: '1',
    phase: 'ONBOARDING',
    session: {
      id: 'session-1',
      started_at: '2026-09-30T12:00:00.000Z',
      plan: [
        {
          module: 'login',
          path: '/login',
          priority: 'high',
          status: 'planned',
        },
      ],
    },
    modules: {
      login: {
        state: 'planned',
        updated_at: '2026-09-30T12:00:00.000Z',
      },
    },
    history: [
      {
        from: 'NONE',
        to: 'ONBOARDING',
        at: '2026-09-30T12:00:00.000Z',
        reason: 'Project initialized',
      },
    ],
  };

  it('debe validar un estado de ciclo de vida completo y correcto', () => {
    const res = validator.validateLifecycleState(validState);
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('debe validar un estado con session.plan vacío', () => {
    const state = {
      ...validState,
      session: {
        id: '',
        started_at: '2026-09-30T12:00:00.000Z',
        plan: [],
      },
      modules: {},
    };
    const res = validator.validateLifecycleState(state);
    expect(res.valid).toBe(true);
  });

  it('debe rechazar propiedades adicionales debido a additionalProperties: false', () => {
    const invalid = {
      ...validState,
      extraProp: 'not-allowed',
    };
    const res = validator.validateLifecycleState(invalid);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.field.includes('extraProp') || e.rule === 'additionalProperties')).toBe(true);
  });

  it('debe rechazar fases desconocidas fuera de enum', () => {
    const invalid = {
      ...validState,
      phase: 'UNKNOWN_PHASE',
    };
    const res = validator.validateLifecycleState(invalid);
    expect(res.valid).toBe(false);
  });

  it('debe rechazar estados de módulo desconocidos fuera de enum', () => {
    const invalid = {
      ...validState,
      modules: {
        login: {
          state: 'invalid_module_state',
          updated_at: '2026-09-30T12:00:00.000Z',
        },
      },
    };
    const res = validator.validateLifecycleState(invalid);
    expect(res.valid).toBe(false);
  });

  it('debe permitir waived_reason en el módulo', () => {
    const waivedState: LifecycleState = {
      ...validState,
      modules: {
        legacy: {
          state: 'waived',
          waived_reason: 'Deprecated endpoint',
          updated_at: '2026-09-30T12:00:00.000Z',
        },
      },
    };
    const res = validator.validateLifecycleState(waivedState);
    expect(res.valid).toBe(true);
  });

  it('debe rechazar si faltan campos obligatorios', () => {
    const missing = {
      _version: '1',
      phase: 'ONBOARDING',
    };
    const res = validator.validateLifecycleState(missing);
    expect(res.valid).toBe(false);
    expect(res.errors.length).toBeGreaterThan(0);
  });
});
