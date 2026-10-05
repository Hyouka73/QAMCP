import { describe, it, expect } from 'vitest';

import { isAuthPath, normalizePathname, DEFAULT_AUTH_PATH_PATTERNS } from '../constants/auth-patterns.js';
import { SchemaValidator } from '../validator/schema-validator.js';

describe('Constantes de patrones de acceso y normalización (P4.4)', () => {
  it('debe identificar rutas de acceso canónicas y rechazar rutas comunes de app', () => {
    // Rutas de acceso
    expect(DEFAULT_AUTH_PATH_PATTERNS).toContain('/login');
    expect(isAuthPath('/login')).toBe(true);
    expect(isAuthPath('/login/')).toBe(true);
    expect(isAuthPath('/LOGIN?redirect=%2Fapp')).toBe(true);
    expect(isAuthPath('/signin')).toBe(true);
    expect(isAuthPath('/sign-in')).toBe(true);
    expect(isAuthPath('/auth')).toBe(true);
    expect(isAuthPath('/auth/callback')).toBe(true);
    expect(isAuthPath('/acceso')).toBe(true);
    expect(isAuthPath('/ingresar')).toBe(true);
    expect(isAuthPath('/sso')).toBe(true);
    expect(isAuthPath('http://localhost:3000/login')).toBe(true);

    // Rutas que no son de acceso
    expect(isAuthPath('/dashboard')).toBe(false);
    expect(isAuthPath('/catalog')).toBe(false);
    expect(isAuthPath('/checkout')).toBe(false);
    expect(isAuthPath('/orders/123')).toBe(false);
    expect(isAuthPath('/')).toBe(false);
  });

  it('debe normalizar rutas eliminando query, hash, mayúsculas y trailing slashes', () => {
    expect(normalizePathname('/Catalog/Items/?filter=all#top')).toBe('/catalog/items');
    expect(normalizePathname('/LOGIN/')).toBe('/login');
    expect(normalizePathname('/')).toBe('/');
    expect(normalizePathname('')).toBe('');
  });

  it('debe validar lifecycle-state con campo acceso en plan y metadatos de auth extendidos', () => {
    const validator = new SchemaValidator();
    const validLifecycle = {
      _version: '1',
      phase: 'SCOPING',
      session: {
        id: 'session-123',
        started_at: '2026-10-05T10:00:00.000Z',
        plan: [
          { module: 'auth', path: '/login', priority: 'high', status: 'planned', acceso: true },
          { module: 'dashboard', path: '/dashboard', priority: 'medium', status: 'planned', acceso: false },
        ],
        auth: {
          required: true,
          source: 'user',
          method: 'handoff',
          roles: ['admin', 'operator'],
          profile: 'admin-profile',
        },
      },
      modules: {
        auth: { state: 'planned', updated_at: '2026-10-05T10:00:00.000Z' },
        dashboard: { state: 'planned', updated_at: '2026-10-05T10:00:00.000Z' },
      },
      history: [],
    };

    const res = validator.validateLifecycleState(validLifecycle);
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });
});
