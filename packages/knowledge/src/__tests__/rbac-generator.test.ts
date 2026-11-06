import { SchemaValidator } from '@qap/shared';
import type { AuthProfile, RuleEntry } from '@qap/shared';
import { describe, it, expect } from 'vitest';

import { generateRbacNegativeCases } from '../plan/rbac-generator.js';

function actorRule(id: string, overrides: Partial<RuleEntry> = {}): RuleEntry {
  return { id, description: 'Solo admin accede', category: 'actor', status: 'confirmed', ...overrides };
}

describe('RbacGenerator (S81-002)', () => {
  const roles = ['admin', 'viewer', 'guest'];

  it('genera un caso por cada rol NO autorizado y por cada regla actor confirmada, válido en SchemaValidator', () => {
    const cases = generateRbacNegativeCases('pagos', roles, { users: ['admin'] }, [actorRule('R-ACT-1')]);

    // viewer y guest no están autorizados; admin sí
    expect(cases.length).toBe(2);

    const validator = new SchemaValidator();
    for (const testCase of cases) {
      const validation = validator.validateTcCase(testCase);
      expect(validation.errors).toEqual([]);
      expect(validation.valid).toBe(true);
      expect(testCase.case_category).toBe('rbac_negative');
      expect(testCase.tags).toEqual(['rbac-negative', 'pagos']);
      expect(testCase.source_rule_id).toBe('R-ACT-1');
      expect(testCase.steps.map((step) => step.type)).toEqual(['switch_auth', 'navigate', 'assert']);
    }
  });

  it('acepta users como objetos { role } y { roles } de contextos antiguos', () => {
    const cases = generateRbacNegativeCases(
      'pagos',
      roles,
      { users: [{ role: 'admin' }, { roles: ['viewer'] }] },
      [actorRule('R1')]
    );

    expect(cases.length).toBe(1);
    expect(cases[0].steps[0].auth_profile).toBe('guest-local');
  });

  it('usa el fallback <rol>-local cuando no hay perfil', () => {
    const cases = generateRbacNegativeCases('pagos', ['viewer'], { users: [] }, [actorRule('R1')]);

    expect(cases[0].steps[0].auth_profile).toBe('viewer-local');
  });

  it('mapea el rol a su perfil por profile.role o por prefijo de profile.id', () => {
    const profiles = [
      { id: 'cuenta-visor', role: 'viewer', env: 'local', username: 'v' },
      { id: 'guest-staging', env: 'local', username: 'g' },
    ] as unknown as AuthProfile[];

    const cases = generateRbacNegativeCases('pagos', ['viewer', 'guest'], { users: [] }, [actorRule('R1')], profiles);
    const byRole = (needle: string) => cases.find((c) => c.name.includes(`'${needle}'`));

    expect(byRole('viewer')?.steps[0].auth_profile).toBe('cuenta-visor');
    expect(byRole('guest')?.steps[0].auth_profile).toBe('guest-staging');
  });

  it('navega a base_route del módulo, o a /<módulo> si no existe', () => {
    const withRoute = generateRbacNegativeCases('pagos', ['viewer'], { users: [], base_route: '/pagos' }, [actorRule('R1')]);
    const withoutRoute = generateRbacNegativeCases('Mi Módulo', ['viewer'], { users: [] }, [actorRule('R1')]);

    expect(withRoute[0].steps[1].url).toBe('/pagos');
    expect(withoutRoute[0].steps[1].url).toMatch(/^\/mi/);
  });

  it('ignora reglas actor no confirmadas o de otra categoría, y devuelve [] sin roles válidos', () => {
    const rules = [actorRule('R1', { status: 'inferred' }), actorRule('R2', { category: 'campo' })];

    expect(generateRbacNegativeCases('pagos', roles, { users: [] }, rules)).toEqual([]);
    expect(generateRbacNegativeCases('pagos', [], { users: [] }, [actorRule('R1')])).toEqual([]);
    expect(generateRbacNegativeCases('pagos', [42, null, ''], { users: [] }, [actorRule('R1')])).toEqual([]);
  });

  it('genera IDs UUID deterministas, distintos por rol y por regla', () => {
    const rules = [actorRule('R1'), actorRule('R2')];
    const first = generateRbacNegativeCases('pagos', roles, { users: ['admin'] }, rules);
    const again = generateRbacNegativeCases('pagos', roles, { users: ['admin'] }, rules);

    expect(first.map((c) => c.id)).toEqual(again.map((c) => c.id));
    expect(new Set(first.map((c) => c.id)).size).toBe(first.length);
    expect(first[0].id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-a[0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});