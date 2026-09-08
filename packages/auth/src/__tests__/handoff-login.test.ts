import { chromium, type Browser, type BrowserContext } from 'playwright-core';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';

import type { AuthProfile } from '@qap/shared';

import { executeHandoffLogin } from '../modes/handoff-login.js';
import { startMockLoginServer, type MockLoginServer } from './mock-login-server.js';

describe('executeHandoffLogin (S2-005)', () => {
  let mockServer: MockLoginServer;
  let browser: Browser;
  let context: BrowserContext;

  beforeAll(async () => {
    mockServer = await startMockLoginServer('usuario-test', 'clave-test-123');
    browser = await chromium.launch({ headless: true });
  });

  afterAll(async () => {
    await browser.close().catch(() => {});
    await mockServer.close();
  });

  beforeEach(async () => {
    context = await browser.newContext();
  });

  afterEach(async () => {
    await context.close().catch(() => {});
  });

  it('debe reanudar automaticamente en cuanto la pagina alcanza la url destino, sin intervencion de teclado', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const profile: AuthProfile = {
      id: 'perfil-handoff',
      env: 'local',
      username: 'usuario-test',
      credential_source: 'env',
      login_mode: 'handoff',
      login_route: `${mockServer.url}/login`,
      handoff_timeout_ms: 10000,
      handoff_message: 'Completa el login manualmente (2FA/SSO simulado)',
      post_login_condition: {
        type: 'url_contains',
        value: '/dashboard',
      },
    };

    // Escucha cuando executeHandoffLogin crea la ventana y simula la redirección tras 300ms
    context.once('page', (page) => {
      setTimeout(() => {
        void page.goto(`${mockServer.url}/dashboard`);
      }, 300);
    });

    const storageState = await executeHandoffLogin(profile, context);

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('2FA/SSO simulado'));
    expect(storageState).toBeDefined();
  }, 20000);

  it('debe lanzar timeout si la post_login_condition nunca se cumple', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});

    const profile: AuthProfile = {
      id: 'perfil-handoff-timeout',
      env: 'local',
      username: 'usuario-test',
      credential_source: 'env',
      login_mode: 'handoff',
      login_route: `${mockServer.url}/login`,
      handoff_timeout_ms: 1000,
      post_login_condition: {
        type: 'url_contains',
        value: '/nunca-llega',
      },
    };

    await expect(executeHandoffLogin(profile, context)).rejects.toThrow(/Timeout de handoff/);
  }, 10000);
});