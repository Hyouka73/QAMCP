import { chromium, type Browser, type BrowserContext } from 'playwright-core';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import type { AuthProfile } from '@qap/shared';

import { executeAutoLogin } from '../modes/auto-login.js';

import { startMockLoginServer, type MockLoginServer } from './mock-login-server.js';

describe('executeAutoLogin (S2-004)', () => {
  let mockServer: MockLoginServer;
  let browser: Browser;
  let context: BrowserContext;

  const TEST_USERNAME = 'usuario-test';
  const TEST_PASSWORD = 'clave-test-123';

  beforeAll(async () => {
    mockServer = await startMockLoginServer(TEST_USERNAME, TEST_PASSWORD);
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

  it('debe completar el login automatico y devolver un storageState con cookie de sesion', async () => {
    const profile: AuthProfile = {
      id: 'perfil-test',
      env: 'local',
      username: TEST_USERNAME,
      credential_source: 'env',
      login_mode: 'auto',
      login_route: `${mockServer.url}/login`,
      post_login_condition: {
        type: 'url_contains',
        value: '/dashboard',
      },
    };

    const storageState = await executeAutoLogin(
      profile,
      { username: TEST_USERNAME, password: TEST_PASSWORD },
      context
    );

    expect(storageState.cookies.length).toBeGreaterThan(0);

    const sessionCookie = storageState.cookies.find((c) => c.name === 'session');
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie?.value).toBe('mock-authenticated-token');
  }, 20000);

  it('debe lanzar un error si el perfil no tiene login_route', async () => {
    const profileSinRuta: AuthProfile = {
      id: 'perfil-sin-ruta',
      env: 'local',
      username: TEST_USERNAME,
      credential_source: 'env',
      login_mode: 'auto',
    };

    await expect(
      executeAutoLogin(profileSinRuta, { password: TEST_PASSWORD }, context)
    ).rejects.toThrow(/login_route/);
  });
});