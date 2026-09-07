// packages/auth/src/modes/auto-login.ts
// packages/auth/src/modes/auto-login.ts
import type { BrowserContext } from 'playwright-core';
import type { AuthProfile } from '@qap/shared';

import type { AuthCredentials } from '../types.js';

const DEFAULT_TIMEOUT_MS = 15000;

// Selectores estandar para inputs de login. La mayoria de formularios
// de autenticacion usan estos atributos comunes (name/type/autocomplete).
const USERNAME_SELECTORS = [
  'input[name="username"]',
  'input[name="email"]',
  'input[type="email"]',
  'input[autocomplete="username"]',
].join(', ');

const PASSWORD_SELECTORS = [
  'input[name="password"]',
  'input[type="password"]',
  'input[autocomplete="current-password"]',
].join(', ');

const SUBMIT_SELECTORS = [
  'button[type="submit"]',
  'input[type="submit"]',
].join(', ');

/**
 * Espera a que se cumpla la post_login_condition del perfil.
 */
async function waitForPostLoginCondition(
  page: import('playwright-core').Page,
  profile: AuthProfile,
  timeoutMs: number
): Promise<void> {
  const condition = profile.post_login_condition;
  if (!condition) return;

  switch (condition.type) {
    case 'url_contains':
      await page.waitForURL((url) => url.toString().includes(condition.value), {
        timeout: timeoutMs,
      });
      return;
    case 'selector_present':
      await page.locator(condition.value).waitFor({ state: 'attached', timeout: timeoutMs });
      return;
    default:
      throw new Error(`Tipo de post_login_condition no soportado: ${String((condition as { type: string }).type)}`);
  }
}

/**
 * Ejecuta un login automatico (sin intervencion del usuario) navegando
 * a profile.login_route, completando credenciales con selectores estandar,
 * y esperando la post_login_condition configurada.
 *
 * Devuelve el storageState (cookies + localStorage) de la sesion autenticada.
 */
export async function executeAutoLogin(
  profile: AuthProfile,
  credentials: AuthCredentials,
  browserContext: BrowserContext
): Promise<Awaited<ReturnType<BrowserContext['storageState']>>> {
  if (!profile.login_route) {
    throw new Error(`El perfil '${profile.id}' no define login_route`);
  }

  const page = await browserContext.newPage();

  try {
    await page.goto(profile.login_route, { waitUntil: 'domcontentloaded' });

    const usernameValue = credentials.username ?? profile.username;
    if (usernameValue) {
      await page.locator(USERNAME_SELECTORS).first().fill(usernameValue);
    }

    const passwordValue = credentials.password ?? credentials.token;
    if (!passwordValue) {
      throw new Error(`No hay password/token disponible para el perfil '${profile.id}'`);
    }
    await page.locator(PASSWORD_SELECTORS).first().fill(passwordValue);

    await page.locator(SUBMIT_SELECTORS).first().click();

    await waitForPostLoginCondition(page, profile, DEFAULT_TIMEOUT_MS);

    return await browserContext.storageState();
  } finally {
    await page.close().catch(() => {});
  }
}