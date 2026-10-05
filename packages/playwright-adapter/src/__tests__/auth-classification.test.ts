import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Module } from '@qap/shared';

import { PlaywrightAdapter } from '../adapter.js';
import {
  startAuthFixtureServer,
  TEST_CREDENTIALS,
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_EXPIRED_VALUE,
  type AuthFixtureServerInstance,
} from '../../test/fixtures/auth-fixture-server.js';

interface DiscoveredContext {
  page_kind?: string;
  redirected?: boolean;
  http_status?: number | null;
  requested_url?: string;
  final_url?: string;
  is_auth_view?: boolean;
  auth_selectors?: { username?: string; password?: string; submit?: string };
  inputs?: Array<{ type?: string; value?: unknown; placeholder?: unknown; label?: unknown; pattern?: unknown; autocomplete?: unknown }>;
  forms?: unknown[];
  buttons?: unknown[];
  session_saved?: boolean;
  storage_state_used?: boolean;
}

const getCtx = (mod: Module): DiscoveredContext =>
  (mod.context as unknown as DiscoveredContext) ?? {};

describe('B1 & B5: Clasificación de páginas y detección de AuthWall con Chromium real (10 casos)', { timeout: 25000 }, () => {
  let fixture: AuthFixtureServerInstance;
  let tempDir: string;

  beforeAll(async () => {
    fixture = await startAuthFixtureServer();
    tempDir = mkdtempSync(join(tmpdir(), 'qap-adapter-auth-'));
  });

  afterAll(async () => {
    await fixture.close();
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // Caso 1: Ruta pública
  it('1. ruta pública: clasifica como app y redirected false', async () => {
    const adapter = new PlaywrightAdapter({ baseUrl: fixture.baseUrl, headless: true });
    const module = await adapter.discover({ name: 'publico', path: '/public' });

    const ctx = getCtx(module);
    expect(ctx.page_kind).toBe('app');
    expect(ctx.redirected).toBe(false);
    expect(ctx.http_status).toBe(200);
    expect(ctx.requested_url).toBe(`${fixture.baseUrl}/public`);
    expect(ctx.final_url).toBe(`${fixture.baseUrl}/public`);
    expect(ctx.is_auth_view).toBe(false);
  });

  // Caso 2: /login pedido directamente
  it('2. /login pedido: clasifica como login (no auth_wall), sin values ni atributos sensibles del password', async () => {
    const adapter = new PlaywrightAdapter({ baseUrl: fixture.baseUrl, headless: true });
    const module = await adapter.discover({ name: 'acceso', path: '/login' });

    const ctx = getCtx(module);
    expect(ctx.page_kind).toBe('login');
    expect(ctx.redirected).toBe(false);
    expect(ctx.http_status).toBe(200);
    expect(ctx.is_auth_view).toBe(true);
    expect(ctx.auth_selectors).toBeDefined();
    expect(ctx.auth_selectors?.username).toBeDefined();
    expect(ctx.auth_selectors?.password).toBeDefined();
    expect(ctx.auth_selectors?.submit).toBeDefined();

    // Verificación estricta de no exposición en inputs
    const passInput = ctx.inputs?.find((inp) => inp.type === 'password');
    expect(passInput).toBeDefined();
    expect(passInput?.value).toBeUndefined();
    expect(passInput?.placeholder).toBeNull();
    expect(passInput?.label).toBeUndefined();
    expect(passInput?.pattern).toBeUndefined();
    expect(passInput?.autocomplete).toBeUndefined();
  });

  // Caso 3: Redirección HTTP 302 hacia /login
  it('3. redirección 302 sin cookie: clasifica como auth_wall con requested_url y final_url correctos', async () => {
    const adapter = new PlaywrightAdapter({ baseUrl: fixture.baseUrl, headless: true });
    const module = await adapter.discover({ name: 'protegido_302', path: '/protected-redirect' });

    const ctx = getCtx(module);
    expect(ctx.page_kind).toBe('auth_wall');
    expect(ctx.redirected).toBe(true);
    expect(ctx.requested_url).toBe(`${fixture.baseUrl}/protected-redirect`);
    expect(ctx.final_url).toBe(`${fixture.baseUrl}/login`);
    expect(ctx.is_auth_view).toBe(true);
  });

  // Caso 4: Guard del lado del cliente (SPA redirect tras 200ms)
  it('4. guard del lado del cliente (SPA script): clasifica como auth_wall tras estabilización', async () => {
    const adapter = new PlaywrightAdapter({ baseUrl: fixture.baseUrl, headless: true });
    const module = await adapter.discover({ name: 'protegido_guard', path: '/protected-client-guard' });

    const ctx = getCtx(module);
    expect(ctx.page_kind).toBe('auth_wall');
    expect(ctx.redirected).toBe(true);
    expect(ctx.requested_url).toBe(`${fixture.baseUrl}/protected-client-guard`);
    expect(ctx.final_url).toBe(`${fixture.baseUrl}/login`);
    expect(ctx.is_auth_view).toBe(true);
  });

  // Caso 5: Login embebido en el mismo pathname
  it('5. login embebido en ruta no de acceso: clasifica como login (el servidor lo tratará como auth_required)', async () => {
    const adapter = new PlaywrightAdapter({ baseUrl: fixture.baseUrl, headless: true });
    const module = await adapter.discover({ name: 'embebido', path: '/protected-embedded-login' });

    const ctx = getCtx(module);
    // En el adaptador, la ruta final tiene form de login y no hubo redirección de pathname -> page_kind es login
    expect(ctx.page_kind).toBe('login');
    expect(ctx.redirected).toBe(false);
    expect(ctx.requested_url).toBe(`${fixture.baseUrl}/protected-embedded-login`);
    expect(ctx.final_url).toBe(`${fixture.baseUrl}/protected-embedded-login`);
    expect(ctx.is_auth_view).toBe(true);
  });

  // Caso 6: Respuesta HTTP 401 Unauthorized
  it('6. ruta protegida 401: clasifica como auth_wall', async () => {
    const adapter = new PlaywrightAdapter({ baseUrl: fixture.baseUrl, headless: true });
    const module = await adapter.discover({ name: 'zona_401', path: '/protected-401' });

    const ctx = getCtx(module);
    expect(ctx.page_kind).toBe('auth_wall');
    expect(ctx.http_status).toBe(401);
    expect(ctx.requested_url).toBe(`${fixture.baseUrl}/protected-401`);
    expect(ctx.is_auth_view).toBe(true);
  });

  // Caso 7: Sesión válida obtenida mediante auto-login real contra el fixture
  it('7. storageState válido obtenido con auto-login real: accede a ruta protegida como app', async () => {
    const sessionFile = join(tempDir, 'valid-session.json');

    // Paso A: ejecutar login real contra el fixture
    const loginAdapter = new PlaywrightAdapter({
      baseUrl: fixture.baseUrl,
      headless: true,
      credentials: TEST_CREDENTIALS,
      sessionPath: sessionFile,
    });
    const loginResult = await loginAdapter.discover({ name: 'login_run', path: '/login' });
    expect(getCtx(loginResult).session_saved).toBe(true);
    expect(existsSync(sessionFile)).toBe(true);

    // Paso B: navegar a la ruta protegida cargando el storageState
    const authedAdapter = new PlaywrightAdapter({
      baseUrl: fixture.baseUrl,
      headless: true,
      sessionPath: sessionFile,
    });
    const protectedModule = await authedAdapter.discover({ name: 'protegido', path: '/protected-redirect' });

    const ctx = getCtx(protectedModule);
    expect(ctx.page_kind).toBe('app');
    expect(ctx.redirected).toBe(false);
    expect(ctx.storage_state_used).toBe(true);
    expect(ctx.final_url).toBe(`${fixture.baseUrl}/protected-redirect`);
    expect(ctx.is_auth_view).toBe(false);
  });

  // Caso 8: storageState expirado o inválido
  it('8. storageState expirado/inválido: redirige y clasifica como auth_wall (servidor responderá session_invalid)', async () => {
    const expiredSessionFile = join(tempDir, 'expired-session.json');
    const expiredState = {
      cookies: [
        {
          name: AUTH_COOKIE_NAME,
          value: AUTH_COOKIE_EXPIRED_VALUE,
          domain: '127.0.0.1',
          path: '/',
          expires: -1,
          httpOnly: true,
          secure: false,
          sameSite: 'Lax',
        },
      ],
      origins: [],
    };
    writeFileSync(expiredSessionFile, JSON.stringify(expiredState, null, 2), 'utf-8');

    const adapter = new PlaywrightAdapter({
      baseUrl: fixture.baseUrl,
      headless: true,
      sessionPath: expiredSessionFile,
    });
    const module = await adapter.discover({ name: 'protegido_expirado', path: '/protected-redirect' });

    const ctx = getCtx(module);
    expect(ctx.page_kind).toBe('auth_wall');
    expect(ctx.redirected).toBe(true);
    expect(ctx.final_url).toBe(`${fixture.baseUrl}/login`);
  });

  // Caso 9: Guard del lado del cliente con consulta asíncrona de sesión (~1200ms total, C3c)
  it('9. guard asíncrono lento (~1200ms con networkidle): clasifica como auth_wall con redirected true', async () => {
    const adapter = new PlaywrightAdapter({ baseUrl: fixture.baseUrl, headless: true });
    const module = await adapter.discover({ name: 'protegido_guard_lento', path: '/protected-delayed-client-guard' });

    const ctx = getCtx(module);
    expect(ctx.page_kind).toBe('auth_wall');
    expect(ctx.redirected).toBe(true);
    expect(ctx.requested_url).toBe(`${fixture.baseUrl}/protected-delayed-client-guard`);
    expect(ctx.final_url).toBe(`${fixture.baseUrl}/login`);
    expect(ctx.is_auth_view).toBe(true);
  });

  // Caso 10: Cambio de URL o redirección durante la extracción (C3b/c)
  it('10. cambio de URL durante extracción: descarta selectores y clasifica como auth_wall', async () => {
    const adapter = new PlaywrightAdapter({ baseUrl: fixture.baseUrl, headless: true });
    const module = await adapter.discover({ name: 'protegido_cambio_url', path: '/protected-redirect-during-extraction' });

    const ctx = getCtx(module);
    expect(ctx.page_kind).toBe('auth_wall');
    expect(ctx.redirected).toBe(true);
    expect(ctx.final_url).toBe(`${fixture.baseUrl}/login`);
    expect(ctx.is_auth_view).toBe(true);
    // Extractions descartadas
    expect(ctx.forms).toEqual([]);
    expect(ctx.inputs).toEqual([]);
    expect(ctx.buttons).toEqual([]);
  });
});

