import { SchemaValidator } from '@qap/shared';
import type { AuthProfile, RuleEntry } from '@qap/shared';
import { describe, it, expect } from 'vitest';

import { DEFAULT_DENIAL_SELECTOR, generateRbacNegativeCases } from '../plan/rbac-generator.js';

function actorRule(id: string, overrides: Partial<RuleEntry> = {}): RuleEntry {
  return { id, description: 'Solo admin accede', category: 'actor', status: 'confirmed', ...overrides };
}

describe('RbacGenerator (DEV-MVP-01 / S81-002)', () => {
  const roles = ['admin', 'viewer', 'guest'];
  const accreditedProfiles = [
    { id: 'profile-viewer', role: 'viewer', env: 'local', username: 'v' },
    { id: 'profile-guest', role: 'guest', env: 'local', username: 'g' },
  ] as unknown as AuthProfile[];

  it('genera un caso por cada rol NO autorizado acreditado, con aserción observable de denegación, válido en SchemaValidator', () => {
    const cases = generateRbacNegativeCases(
      'pagos',
      roles,
      { users: ['admin'] },
      [actorRule('R-ACT-1')],
      accreditedProfiles
    );

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

      // Verificación de oráculo de denegación observable (NO vacua como 'body exists')
      const assertStep = testCase.steps[2];
      expect(assertStep.selector).toBe(DEFAULT_DENIAL_SELECTOR);
      expect(assertStep.assertion_type).toBe('visible');
      expect(assertStep.selector).not.toBe('body');
    }
  });

  it('acepta users como objetos { role } y { roles } de contextos antiguos', () => {
    const guestProfile = [
      { id: 'guest-profile', role: 'guest', env: 'local', username: 'g' },
    ] as unknown as AuthProfile[];

    const cases = generateRbacNegativeCases(
      'pagos',
      roles,
      { users: [{ role: 'admin' }, { roles: ['viewer'] }] },
      [actorRule('R1', { description: 'Permite acceso a admin y viewer' })],
      guestProfile
    );

    expect(cases.length).toBe(1);
    expect(cases[0].steps[0].auth_profile).toBe('guest-profile');
  });

  it('omite roles sin perfil acreditado (elimina fallback <rol>-local, fail-closed, RBAC-1)', () => {
    // Sin perfiles acreditados proporcionados: no debe inventar <rol>-local ni emitir casos no ejecutables
    const cases = generateRbacNegativeCases('pagos', ['viewer'], { users: [] }, [actorRule('R1')]);

    expect(cases).toEqual([]);
  });

  it('solo emite casos para roles con perfil acreditado y omite los no acreditados', () => {
    const onlyViewerProfile = [
      { id: 'profile-viewer', role: 'viewer', env: 'local', username: 'v' },
    ] as unknown as AuthProfile[];

    // viewer y guest no autorizados, pero solo viewer tiene perfil acreditado en profiles
    const cases = generateRbacNegativeCases(
      'pagos',
      ['admin', 'viewer', 'guest'],
      { users: ['admin'] },
      [actorRule('R1')],
      onlyViewerProfile
    );

    expect(cases.length).toBe(1);
    expect(cases[0].steps[0].auth_profile).toBe('profile-viewer');
    expect(cases.find((c) => c.name.includes('guest'))).toBeUndefined();
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
    const viewerProfile = [
      { id: 'viewer-p', role: 'viewer', env: 'local', username: 'v' },
    ] as unknown as AuthProfile[];

    const withRoute = generateRbacNegativeCases(
      'pagos',
      ['viewer'],
      { users: [], base_route: '/pagos' },
      [actorRule('R1')],
      viewerProfile
    );
    const withoutRoute = generateRbacNegativeCases(
      'Mi Módulo',
      ['viewer'],
      { users: [] },
      [actorRule('R1')],
      viewerProfile
    );

    expect(withRoute[0].steps[1].url).toBe('/pagos');
    expect(withoutRoute[0].steps[1].url).toMatch(/^\/mi/);
  });

  it('ignora reglas actor no confirmadas o de otra categoría, y devuelve [] sin roles válidos', () => {
    const rules = [actorRule('R1', { status: 'inferred' }), actorRule('R2', { category: 'campo' })];

    expect(generateRbacNegativeCases('pagos', roles, { users: [] }, rules, accreditedProfiles)).toEqual([]);
    expect(generateRbacNegativeCases('pagos', [], { users: [] }, [actorRule('R1')], accreditedProfiles)).toEqual([]);
    expect(generateRbacNegativeCases('pagos', [42, null, ''], { users: [] }, [actorRule('R1')], accreditedProfiles)).toEqual([]);
  });

  it('genera IDs UUID deterministas, distintos por rol y por regla', () => {
    const rules = [actorRule('R1'), actorRule('R2')];
    const first = generateRbacNegativeCases('pagos', roles, { users: ['admin'] }, rules, accreditedProfiles);
    const again = generateRbacNegativeCases('pagos', roles, { users: ['admin'] }, rules, accreditedProfiles);

    expect(first.map((c) => c.id)).toEqual(again.map((c) => c.id));
    expect(new Set(first.map((c) => c.id)).size).toBe(first.length);
    expect(first[0].id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-a[0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('usa selector de denegación personalizado si está configurado en moduleContext (RBAC-3 & RBAC-5)', () => {
    const cases = generateRbacNegativeCases(
      'pagos',
      roles,
      { users: ['admin'], denial_selector: '[data-testid="forbidden-banner"]' },
      [actorRule('R-ACT-1')],
      accreditedProfiles
    );

    expect(cases.length).toBe(2);
    expect(cases[0].steps[2]).toEqual({
      type: 'assert',
      selector: '[data-testid="forbidden-banner"]',
      assertion_type: 'visible',
    });
  });

  it('usa comprobación not_exists sobre selector privilegiado si está definido en moduleContext', () => {
    const cases = generateRbacNegativeCases(
      'admin-panel',
      roles,
      { users: ['admin'], privileged_selector: '#sensitive-admin-controls' },
      [actorRule('R-ACT-1')],
      accreditedProfiles
    );

    expect(cases.length).toBe(2);
    expect(cases[0].steps[2]).toEqual({
      type: 'assert',
      selector: '#sensitive-admin-controls',
      assertion_type: 'not_exists',
    });
  });

  it('no emite casos si se declara explícitamente que no hay oráculo observable de denegación (fail-closed)', () => {
    const cases = generateRbacNegativeCases(
      'pagos',
      roles,
      { users: ['admin'], observable_denial: false },
      [actorRule('R-ACT-1')],
      accreditedProfiles
    );

    expect(cases).toEqual([]);
  });

  it('fundamenta la autorización en la regla de actor confirmada y no únicamente en moduleContext.users (RBAC-2)', () => {
    const allProfiles = [
      { id: 'admin-p', role: 'admin', env: 'local', username: 'a' },
      { id: 'supervisor-p', role: 'supervisor', env: 'local', username: 's' },
      { id: 'viewer-p', role: 'viewer', env: 'local', username: 'v' },
    ] as unknown as AuthProfile[];

    // La regla actor indica explícitamente "Solo supervisor accede", aunque users liste admin
    const rule = actorRule('R-SUP-1', { description: 'Solo supervisor accede' });
    const cases = generateRbacNegativeCases(
      'auditoria',
      ['admin', 'supervisor', 'viewer'],
      { users: ['admin'] },
      [rule],
      allProfiles
    );

    // supervisor está autorizado por la regla (no genera caso negativo)
    // admin y viewer NO están autorizados por la regla (generan casos negativos)
    expect(cases.length).toBe(2);
    const byRole = (needle: string) => cases.find((c) => c.name.includes(`'${needle}'`));
    expect(byRole('supervisor')).toBeUndefined();
    expect(byRole('admin')?.steps[0].auth_profile).toBe('admin-p');
    expect(byRole('viewer')?.steps[0].auth_profile).toBe('viewer-p');
  });

  it('aplica restricciones a roles explícitamente prohibidos en la regla actor', () => {
    const profiles = [
      { id: 'guest-p', role: 'guest', env: 'local', username: 'g' },
      { id: 'viewer-p', role: 'viewer', env: 'local', username: 'v' },
    ] as unknown as AuthProfile[];

    const rule = actorRule('R-FORBID-1', { description: 'Prohibido acceso al rol guest' });
    const cases = generateRbacNegativeCases(
      'pagos',
      ['admin', 'viewer', 'guest'],
      {},
      [rule],
      profiles
    );

    // Solo guest fue explícitamente prohibido
    expect(cases.length).toBe(1);
    expect(cases[0].steps[0].auth_profile).toBe('guest-p');
    expect(cases[0].name).toContain("'guest'");
  });

  it('evita producto cartesiano ciego si la regla actor no fundamenta roles ni hay usuarios en contexto (RBAC-4)', () => {
    const rule = actorRule('R-GENERIC', { description: 'Regla sin roles especificados' });
    const cases = generateRbacNegativeCases(
      'pagos',
      roles,
      { users: [] },
      [rule],
      accreditedProfiles
    );

    expect(cases).toEqual([]);
  });

  it('maneja objetos de perfil malformados (sin id, id nulo, id vacío) sin lanzar TypeError', () => {
    const malformed = [
      { role: 'viewer' }, // sin id
      { id: '', role: 'viewer' },
      { id: null, role: 'viewer' },
      null as any,
      undefined as any,
      'not-an-object' as any,
    ] as unknown as AuthProfile[];

    expect(() => {
      const cases = generateRbacNegativeCases(
        'pagos',
        ['admin', 'viewer'],
        { users: ['admin'] },
        [actorRule('R1')],
        malformed
      );
      expect(cases).toEqual([]);
    }).not.toThrow();
  });

  it('reconoce verbos activos en español para prohibiciones (prohíbe, prohibe, deniega, bloquea, restringe)', () => {
    const profiles = [
      { id: 'p-guest', role: 'guest', env: 'local', username: 'g' },
      { id: 'p-user', role: 'user', env: 'local', username: 'u' },
    ] as unknown as AuthProfile[];

    const testPhrases = [
      'El sistema prohíbe el acceso al rol guest',
      'El sistema prohibe acceso al rol guest',
      'El backend deniega acceso al rol guest',
      'El portal bloquea acceso al rol guest',
      'El módulo restringe acceso al rol guest',
      'guest tiene prohibido el acceso',
    ];

    for (const phrase of testPhrases) {
      const rule = actorRule('R-VERB', { description: phrase });
      const cases = generateRbacNegativeCases(
        'pagos',
        ['admin', 'user', 'guest'],
        {},
        [rule],
        profiles
      );

      // Solo guest debe ser identificado como no autorizado
      expect(cases.length).toBe(1);
      expect(cases[0].steps[0].auth_profile).toBe('p-guest');
      expect(cases[0].name).toContain("'guest'");
    }
  });

  it('descarta roles cuyos slugs normalizados quedan vacíos tras eliminar caracteres especiales', () => {
    const profiles = [{ id: 'admin-p', role: 'admin' }] as unknown as AuthProfile[];
    const rule = actorRule('R-TAGS', { tags: ['role:admin'], description: '' });

    // Roles que normalizan a cadena vacía
    const cases = generateRbacNegativeCases(
      'pagos',
      ['###', '---', '   ', '@@@'],
      {},
      [rule],
      profiles
    );

    expect(cases).toEqual([]);
  });
});