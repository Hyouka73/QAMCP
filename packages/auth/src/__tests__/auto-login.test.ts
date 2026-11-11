import { chromium, type Browser, type BrowserContext } from 'playwright-core';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import type { AuthProfile } from '@qap/shared';

import { executeAutoLogin, InteractiveLoginRequired } from '../modes/auto-login.js';

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

  it('debe completar el login automatico verificando selector_present', async () => {
    const profile: AuthProfile = {
      id: 'perfil-test-selector',
      env: 'local',
      username: TEST_USERNAME,
      credential_source: 'env',
      login_mode: 'auto',
      login_route: `${mockServer.url}/login`,
      post_login_condition: {
        type: 'selector_present',
        value: 'h1',
      },
    };

    const storageState = await executeAutoLogin(
      profile,
      { username: TEST_USERNAME, password: TEST_PASSWORD },
      context
    );

    expect(storageState.cookies.length).toBeGreaterThan(0);
    const sessionCookie = storageState.cookies.find((c) => c.name === 'session');
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

  it('no debe atribuir fallo de credenciales incorrectas a CAPTCHA sin evidencia de reto interactivo visible', async () => {
    const profile: AuthProfile = {
      id: 'perfil-cred-invalida',
      env: 'local',
      username: 'usuario-inexistente',
      credential_source: 'keychain',
      login_mode: 'auto',
      login_route: `${mockServer.url}/login`,
      post_login_condition: {
        type: 'url_contains',
        value: '/dashboard',
      },
    };

    try {
      await executeAutoLogin(
        profile,
        { username: 'usuario-inexistente', password: 'wrong-password' },
        context,
        { timeoutMs: 3000 }
      );
      expect.unreachable('Debió fallar el login con credenciales incorrectas');
    } catch (err) {
      expect(err).toBeInstanceOf(InteractiveLoginRequired);
      if (err instanceof InteractiveLoginRequired) {
        expect(err.reason).toBe('credentials_rejected');
        expect(err.reason).not.toBe('challenge_detected');
      }
    }
  }, 15000);

  it('debe completar auto-login en formularios con input readonly y boton habilitado por blur/change (patron Lendus CORE)', async () => {
    const profile: AuthProfile = {
      id: 'perfil-lendus-readonly',
      env: 'local',
      username: TEST_USERNAME,
      credential_source: 'keychain',
      login_mode: 'auto',
      login_route: `${mockServer.url}/login-lendus`,
      post_login_condition: {
        type: 'selector_present',
        value: '#sidebar-menu',
      },
      form_selectors: {
        username: '#username',
        password: '#password',
        submit: '#btn-login',
      },
    };

    const storageState = await executeAutoLogin(
      profile,
      { username: TEST_USERNAME, password: TEST_PASSWORD },
      context
    );

    expect(storageState.cookies.length).toBeGreaterThan(0);
    const sessionCookie = storageState.cookies.find((c) => c.name === 'session');
    expect(sessionCookie?.value).toBe('mock-authenticated-token');
  }, 20000);

  it('debe diferenciar submit_button_disabled, login_form_not_found y challenge_detected', async () => {
    // 1. submit_button_disabled
    await expect(
      executeAutoLogin(
        {
          id: 'perfil-disabled',
          env: 'local',
          username: TEST_USERNAME,
          credential_source: 'keychain',
          login_mode: 'auto',
          login_route: `${mockServer.url}/login-disabled`,
          post_login_condition: { type: 'selector_present', value: 'h1' },
        },
        { username: TEST_USERNAME, password: TEST_PASSWORD },
        context,
        { timeoutMs: 3000 }
      )
    ).rejects.toMatchObject({ reason: 'submit_button_disabled' });

    // 2. login_form_not_found
    const ctx2 = await browser.newContext();
    try {
      await expect(
        executeAutoLogin(
          {
            id: 'perfil-no-form',
            env: 'local',
            username: TEST_USERNAME,
            credential_source: 'keychain',
            login_mode: 'auto',
            login_route: `${mockServer.url}/dashboard`,
            post_login_condition: { type: 'selector_present', value: 'h1' },
          },
          { username: TEST_USERNAME, password: TEST_PASSWORD },
          ctx2,
          { timeoutMs: 3000 }
        )
      ).rejects.toMatchObject({ reason: 'login_form_not_found' });
    } finally {
      await ctx2.close().catch(() => {});
    }

    // 3. challenge_detected
    const ctx3 = await browser.newContext();
    try {
      await expect(
        executeAutoLogin(
          {
            id: 'perfil-challenge',
            env: 'local',
            username: TEST_USERNAME,
            credential_source: 'keychain',
            login_mode: 'auto',
            login_route: `${mockServer.url}/login-challenge`,
            post_login_condition: { type: 'selector_present', value: 'h1' },
          },
          { username: TEST_USERNAME, password: TEST_PASSWORD },
          ctx3,
          { timeoutMs: 3000 }
        )
      ).rejects.toMatchObject({ reason: 'challenge_detected' });
    } finally {
      await ctx3.close().catch(() => {});
    }
  }, 25000);
});