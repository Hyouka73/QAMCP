import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionStore } from '@qap/auth';
import { resolveModuleSession } from '../src/session-resolver.js';

describe('session-resolver (S75-006A)', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qap-session-test-'));

    // Configurar estructura .qa/modules/checkout/prereqs.yaml
    const moduleDir = path.join(tempDir, '.qa', 'modules', 'checkout');
    fs.mkdirSync(moduleDir, { recursive: true });
    fs.writeFileSync(
      path.join(moduleDir, 'prereqs.yaml'),
      'requires:\n  auth:\n    primary: "admin-user"\n'
    );
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    vi.restoreAllMocks();
  });

  it('debe retornar null si el módulo no requiere autenticación', async () => {
    const session = await resolveModuleSession(tempDir, 'non-existing-module');
    expect(session).toBeNull();
  });

  it('debe recuperar y descifrar una sesión válida guardada en el SessionStore (AES-256-GCM)', async () => {
    const sessionStore = new SessionStore(undefined, tempDir);
    const mockState = {
      cookies: [{ name: 'auth_token', value: 'secret', domain: 'example.com', path: '/', expires: Date.now() / 1000 + 3600, httpOnly: true, secure: true, sameSite: 'Lax' as const }],
      origins: []
    };

    sessionStore.saveSession('admin-user', mockState);

    const session = await resolveModuleSession(tempDir, 'checkout');
    expect(session).not.toBeNull();
    expect(session?.cookies[0].value).toBe('secret');
  });

  it('debe detectar sesión expirada y descartarla', async () => {
    const sessionStore = new SessionStore(undefined, tempDir);
    const expiredState = {
      cookies: [{ name: 'auth_token', value: 'expired', domain: 'example.com', path: '/', expires: Date.now() / 1000 - 3600, httpOnly: true, secure: true, sameSite: 'Lax' as const }],
      origins: []
    };

    sessionStore.saveSession('admin-user', expiredState);

    // Como expiró y no hay credenciales/perfil real configurado para hacer re-login en el mock, se espera error de perfil
    await expect(resolveModuleSession(tempDir, 'checkout')).rejects.toThrow(/Perfil de autenticación 'admin-user' no encontrado/);
  });
    it('ante sesión expirada, ejecuta re-login automático (login_mode: auto) y guarda la nueva sesión', async () => {
    const authDir = path.join(tempDir, '.qa', 'project', 'auth');
    fs.mkdirSync(authDir, { recursive: true });
    fs.writeFileSync(
      path.join(authDir, 'profiles.json'),
      JSON.stringify({
        profiles: [
          {
            id: 'admin-user',
            env: 'staging',
            username: 'admin',
            credential_source: 'env',
            env_var: 'QAP_TEST_PASSWORD',
            login_mode: 'auto',
            login_route: '/login',
          },
        ],
      })
    );

    const sessionStore = new SessionStore(undefined, tempDir);
    const expiredState = {
      cookies: [
        {
          name: 'auth_token',
          value: 'expired',
          domain: 'example.com',
          path: '/',
          expires: Date.now() / 1000 - 3600,
          httpOnly: true,
          secure: true,
          sameSite: 'Lax' as const,
        },
      ],
      origins: [],
    };
    sessionStore.saveSession('admin-user', expiredState);

    const authModule = await import('@qap/auth');
    vi.spyOn(authModule.AuthManager.prototype, 'getCredentials').mockResolvedValue({
      username: 'admin',
      password: 'fake-password',
    });

    const freshState = {
      cookies: [
        {
          name: 'auth_token',
          value: 'fresh-token',
          domain: 'example.com',
          path: '/',
          expires: Date.now() / 1000 + 3600,
          httpOnly: true,
          secure: true,
          sameSite: 'Lax' as const,
        },
      ],
      origins: [],
    };
    vi.spyOn(authModule, 'executeAutoLogin').mockResolvedValue(freshState);

    const session = await resolveModuleSession(tempDir, 'checkout');

    expect(session).not.toBeNull();
    expect(session?.cookies[0].value).toBe('fresh-token');

    // Confirma que la nueva sesión se guardó para futuras llamadas (no solo se devolvió).
    const reloadedStore = new SessionStore(undefined, tempDir);
    const persisted = reloadedStore.getValidSession('admin-user');
    expect(persisted?.cookies[0].value).toBe('fresh-token');
  });
});