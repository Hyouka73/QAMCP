import { describe, it, expect } from 'vitest';

import { canExitScoping } from '../lifecycle.js';

describe('canExitScoping - Compuerta de Autenticación y Verificación de Sesión (P4.4)', () => {
  const basePlan = [{ module: 'catalog', path: '/catalog', priority: 'high', status: 'planned' }];

  it('1. debe fallar si session.auth.required es true pero ningún perfil tiene verified true', () => {
    const unverifiedProfiles = [
      { id: 'admin', role: 'admin', env: 'local', username: 'admin', login_mode: 'auto', credential_source: 'keychain', verified: false },
      { id: 'tester', role: 'tester', env: 'local', username: 'tester', login_mode: 'auto', credential_source: 'keychain' },
    ];

    const res = canExitScoping(
      {
        id: 'session-1',
        started_at: '2026-10-05T10:00:00.000Z',
        plan: basePlan,
        auth: { required: true, profile: 'admin' },
      },
      unverifiedProfiles
    );

    expect(res.passed).toBe(false);
    expect(res.faltantes.some((f) => f.campo === 'session.auth.verified')).toBe(true);
  });

  it('2. debe aprobar cuando session.auth.required es true y existe al menos un perfil con verified true', () => {
    const verifiedProfiles = [
      { id: 'admin', role: 'admin', env: 'local', username: 'admin', login_mode: 'auto', credential_source: 'keychain', verified: true, verified_at: new Date().toISOString() },
    ];

    const res = canExitScoping(
      {
        id: 'session-1',
        started_at: '2026-10-05T10:00:00.000Z',
        plan: basePlan,
        auth: { required: true, profile: 'admin' },
      },
      verifiedProfiles
    );

    expect(res.passed).toBe(true);
    expect(res.faltantes).toHaveLength(0);
  });

  it('3. debe fallar si hay roles especificados en auth.roles y alguno carece de perfil registrado', () => {
    const profiles = [
      { id: 'admin-p', role: 'admin', env: 'local', username: 'admin', login_mode: 'auto', credential_source: 'keychain', verified: true },
    ];

    const res = canExitScoping(
      {
        id: 'session-1',
        started_at: '2026-10-05T10:00:00.000Z',
        plan: basePlan,
        auth: { required: true, roles: ['admin', 'supervisor'] },
      },
      profiles
    );

    expect(res.passed).toBe(false);
    expect(res.faltantes.some((f) => f.campo === 'session.auth.roles' && f.motivo.includes('supervisor'))).toBe(true);
  });

  it('4. debe aprobar cuando todos los roles especificados en auth.roles tienen perfil y al menos uno está verificado', () => {
    const profiles = [
      { id: 'admin-p', role: 'admin', env: 'local', username: 'admin', login_mode: 'auto', credential_source: 'keychain', verified: true },
      { id: 'sup-p', role: 'supervisor', env: 'local', username: 'sup', login_mode: 'auto', credential_source: 'keychain', verified: true },
    ];

    const res = canExitScoping(
      {
        id: 'session-1',
        started_at: '2026-10-05T10:00:00.000Z',
        plan: basePlan,
        auth: { required: true, roles: ['admin', 'supervisor'] },
      },
      profiles
    );

    expect(res.passed).toBe(true);
    expect(res.faltantes).toHaveLength(0);
  });

  it('5. debe aprobar cuando session.auth.required es false con source "user"', () => {
    const res = canExitScoping({
      id: 'session-1',
      started_at: '2026-10-05T10:00:00.000Z',
      plan: basePlan,
      auth: { required: false, source: 'user' },
    });

    expect(res.passed).toBe(true);
    expect(res.faltantes).toHaveLength(0);
  });

  it('6. debe fallar si session.auth.required es false pero source no es "user"', () => {
    const res = canExitScoping({
      id: 'session-1',
      started_at: '2026-10-05T10:00:00.000Z',
      plan: basePlan,
      auth: { required: false, source: 'inferred' as unknown as 'user' },
    });

    expect(res.passed).toBe(false);
    expect(res.faltantes.some((f) => f.campo === 'session.auth.source' && f.motivo.includes('source: user'))).toBe(true);
  });
});
