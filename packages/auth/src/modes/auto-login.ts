import type { BrowserContext } from 'playwright-core';
import type { AuthProfile } from '@qap/shared';

import { restrictChromiumPage } from '../scoped-browser.js';
import type { AuthCredentials } from '../types.js';

const DEFAULT_TIMEOUT_MS = 15000;
const CHALLENGE = [
  'input[autocomplete="one-time-code"]', 'input[name="otp"]', 'input[name="totp"]',
  'iframe[src*="captcha" i]', 'iframe[title*="captcha" i]', '[data-sitekey]',
].join(', ');

export class InteractiveLoginRequired extends Error {
  constructor() { super('Interactive authentication required'); }
}

export function authBrowserDiagnosticsEnabled(): boolean {
  return Boolean(process.env.DEBUG || process.env.PWDEBUG || process.env.PWDEBUGIMPL);
}

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
      await page.locator(condition.value).waitFor({ state: 'visible', timeout: timeoutMs });
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
  browserContext: BrowserContext,
  options?: { origin: string; timeoutMs: number },
): Promise<Awaited<ReturnType<BrowserContext['storageState']>>> {
  if (!profile.login_route) {
    throw new Error(`El perfil '${profile.id}' no define login_route`);
  }

  if (authBrowserDiagnosticsEnabled()) throw new InteractiveLoginRequired();
  const origin = options?.origin ?? new URL(profile.login_route).origin;
  const timeout = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  if (new URL(profile.login_route).origin !== origin) throw new InteractiveLoginRequired();

  if (credentials.token) {
    if (!profile.token_exchange_route?.startsWith('/') || profile.token_exchange_route.startsWith('//')) {
      throw new InteractiveLoginRequired();
    }
    const endpoint = new URL(profile.token_exchange_route, origin);
    if (endpoint.origin !== origin || endpoint.username || endpoint.password) throw new InteractiveLoginRequired();
    const response = await browserContext.request.post(endpoint.href, {
      headers: { Authorization: 'Bearer ' + credentials.token }, maxRedirects: 0, timeout,
    });
    try {
      if (!response.ok()) throw new InteractiveLoginRequired();
      return await browserContext.storageState();
    } finally { await response.dispose(); }
  }

  const page = await browserContext.newPage();
  const challenge = page.locator(CHALLENGE + (profile.challenge_selector ? ', ' + profile.challenge_selector : ''))
    .filter({ visible: true }).first();
  try {
    if (!credentials.password) throw new InteractiveLoginRequired();
    await restrictChromiumPage(page, origin);
    await page.goto(profile.login_route, { waitUntil: 'domcontentloaded', timeout });
    if (new URL(page.url()).origin !== origin || await challenge.isVisible()) throw new InteractiveLoginRequired();

    const password = page.locator(profile.form_selectors?.password ?? PASSWORD_SELECTORS).first();
    await password.waitFor({ state: 'visible', timeout });
    const formOrigin = await password.evaluate((element: { type: string; form?: { action: string } }, base) =>
      element.type === 'password' ? new URL(element.form?.action || base, base).origin : null, page.url());
    if (formOrigin !== origin || await challenge.isVisible()) throw new InteractiveLoginRequired();

    const username = credentials.username ?? profile.username;
    if (username) {
      await page.locator(profile.form_selectors?.username ?? USERNAME_SELECTORS).first().fill(username, { timeout });
    }
    const submit = page.locator(profile.form_selectors?.submit ?? SUBMIT_SELECTORS).first();
    const submitAction = await submit.getAttribute('formaction', { timeout });
    const submitOrigin = new URL(submitAction || page.url(), page.url()).origin;
    if (submitOrigin !== origin || await challenge.isVisible()) throw new InteractiveLoginRequired();
    await password.fill(credentials.password, { timeout });
    await submit.click({ timeout });
    await Promise.race([
      waitForPostLoginCondition(page, profile, timeout),
      // The scoped caller performs the definitive probe on a separate protected route.
      ...(options ? [password.waitFor({ state: 'hidden', timeout })] : []),
      challenge.waitFor({ state: 'visible', timeout }).then(() => { throw new InteractiveLoginRequired(); }),
    ]);
    if (await challenge.isVisible()) throw new InteractiveLoginRequired();
    return await browserContext.storageState();
  } finally {
    await page.close().catch(() => {});
  }
}