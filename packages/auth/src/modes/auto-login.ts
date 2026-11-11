import type { BrowserContext } from 'playwright-core';
import type { AuthProfile } from '@qap/shared';

import { restrictChromiumPage } from '../scoped-browser.js';
import type { AuthCredentials } from '../types.js';

const DEFAULT_TIMEOUT_MS = 15000;
const CHALLENGE = [
  'input[autocomplete="one-time-code"]', 'input[name="otp"]', 'input[name="totp"]',
  'iframe[src*="captcha" i]', 'iframe[title*="captcha" i]', '[data-sitekey]',
].join(', ');
const LOGIN_ERROR_SELECTORS = [
  '#Error',
  '.alert-danger',
  '.alert-error',
  '[role="alert"]',
  '.invalid-feedback',
  '.error-message',
  '.login-error',
].join(', ');

export type AutoLoginFailureReason =
  | 'challenge_detected'
  | 'interactive_required'
  | 'login_navigation_failed'
  | 'login_form_not_found'
  | 'submit_button_disabled'
  | 'credentials_rejected'
  | 'post_login_verification_failed';

export class InteractiveLoginRequired extends Error {
  constructor(
    public readonly reason: AutoLoginFailureReason = 'interactive_required',
    public readonly detail?: string
  ) {
    super(
      reason === 'challenge_detected'
        ? 'Challenge detected during authentication'
        : detail ?? `Interactive authentication required (${reason})`
    );
  }
}

export function authBrowserDiagnosticsEnabled(): boolean {
  return Boolean(process.env.DEBUG || process.env.PWDEBUG || process.env.PWDEBUGIMPL);
}

// Selectores estandar para inputs de login. Soportan tanto correos como
// identificadores de usuario no email (username, user, login, identificador, text).
const USERNAME_SELECTORS = [
  'input[name="username"]',
  'input[name="user"]',
  'input[name="login"]',
  'input[name="usuario"]',
  'input[name="identifier"]',
  'input[name="identificador"]',
  'input[name="email"]',
  'input[type="email"]',
  'input[autocomplete="username"]',
  'input[id*="user" i]',
  'input[id*="login" i]',
  'input[type="text"]',
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
 * Completa un campo de formulario manejando atributos `readonly` (anti-autofill)
 * y disparando eventos `focus`, `input`, `change` y `blur` para habilitar botones
 * de envío reactivos en formularios como Lendus CORE.
 */
export async function fillLoginInput(
  locator: import('playwright-core').Locator,
  value: string,
  timeoutMs: number
): Promise<void> {
  await locator.waitFor({ state: 'visible', timeout: timeoutMs });
  await locator.focus({ timeout: timeoutMs }).catch(() => {});
  await locator
    .evaluate((el) => {
      if (el && typeof (el as { removeAttribute?: (name: string) => void }).removeAttribute === 'function') {
        (el as { removeAttribute: (name: string) => void }).removeAttribute('readonly');
      }
    })
    .catch(() => {});
  await locator.fill(value, { timeout: timeoutMs });
  await locator.dispatchEvent('input').catch(() => {});
  await locator.dispatchEvent('change').catch(() => {});
  await locator.blur({ timeout: timeoutMs }).catch(() => {});
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
  if (new URL(profile.login_route).origin !== origin) throw new InteractiveLoginRequired('login_navigation_failed');

  if (credentials.token) {
    if (!profile.token_exchange_route?.startsWith('/') || profile.token_exchange_route.startsWith('//')) {
      throw new InteractiveLoginRequired('login_navigation_failed');
    }
    const endpoint = new URL(profile.token_exchange_route, origin);
    if (endpoint.origin !== origin || endpoint.username || endpoint.password) {
      throw new InteractiveLoginRequired('login_navigation_failed');
    }
    const response = await browserContext.request.post(endpoint.href, {
      headers: { Authorization: 'Bearer ' + credentials.token }, maxRedirects: 0, timeout,
    });
    try {
      if (!response.ok()) {
        throw new InteractiveLoginRequired(
          response.status() === 401 || response.status() === 403 ? 'credentials_rejected' : 'login_navigation_failed'
        );
      }
      return await browserContext.storageState();
    } finally { await response.dispose(); }
  }

  const page = await browserContext.newPage();
  const challenge = page.locator(CHALLENGE + (profile.challenge_selector ? ', ' + profile.challenge_selector : ''))
    .filter({ visible: true }).first();
  const errorAlert = page.locator(LOGIN_ERROR_SELECTORS).filter({ visible: true }).first();
  try {
    if (!credentials.password) throw new InteractiveLoginRequired('credentials_rejected');
    await restrictChromiumPage(page, origin);
    try {
      await page.goto(profile.login_route, { waitUntil: 'domcontentloaded', timeout });
    } catch {
      throw new InteractiveLoginRequired('login_navigation_failed', 'No se pudo cargar la ruta de login.');
    }
    if (new URL(page.url()).origin !== origin) throw new InteractiveLoginRequired('login_navigation_failed');
    if (await challenge.isVisible()) throw new InteractiveLoginRequired('challenge_detected');

    const password = page.locator(profile.form_selectors?.password ?? PASSWORD_SELECTORS).first();
    try {
      await password.waitFor({ state: 'visible', timeout: Math.min(timeout, 10_000) });
    } catch {
      if (await challenge.isVisible()) throw new InteractiveLoginRequired('challenge_detected');
      throw new InteractiveLoginRequired('login_form_not_found', 'No se encontró el campo de contraseña visible.');
    }
    const formOrigin = await password.evaluate((element: { type: string; form?: { action: string } }, base) =>
      element.type === 'password' ? new URL(element.form?.action || base, base).origin : null, page.url());
    if (formOrigin !== origin) throw new InteractiveLoginRequired('login_navigation_failed');
    if (await challenge.isVisible()) throw new InteractiveLoginRequired('challenge_detected');

    const username = credentials.username ?? profile.username;
    if (username) {
      const userInput = page.locator(profile.form_selectors?.username ?? USERNAME_SELECTORS).first();
      try {
        await fillLoginInput(userInput, username, Math.min(timeout, 10_000));
      } catch {
        if (await challenge.isVisible()) throw new InteractiveLoginRequired('challenge_detected');
        throw new InteractiveLoginRequired('login_form_not_found', 'No se encontró o no se pudo completar el campo de usuario.');
      }
    }
    const submit = page.locator(profile.form_selectors?.submit ?? SUBMIT_SELECTORS).first();
    try {
      await submit.waitFor({ state: 'visible', timeout: Math.min(timeout, 10_000) });
    } catch {
      if (await challenge.isVisible()) throw new InteractiveLoginRequired('challenge_detected');
      throw new InteractiveLoginRequired('login_form_not_found', 'No se encontró el botón de envío del formulario.');
    }
    const submitAction = await submit.getAttribute('formaction', { timeout });
    const submitOrigin = new URL(submitAction || page.url(), page.url()).origin;
    if (submitOrigin !== origin) throw new InteractiveLoginRequired('login_navigation_failed');
    if (await challenge.isVisible()) throw new InteractiveLoginRequired('challenge_detected');

    await fillLoginInput(password, credentials.password, Math.min(timeout, 10_000));

    // Wait briefly if submit button is disabled while asynchronous form validation runs (e.g. Lendus CORE validtForm)
    const enableDeadline = Date.now() + Math.min(5_000, timeout);
    while (Date.now() < enableDeadline) {
      const disabled = await submit.isDisabled().catch(() => false);
      if (!disabled) break;
      await page.waitForTimeout(100);
    }
    if (await submit.isDisabled().catch(() => false)) {
      if (await challenge.isVisible()) throw new InteractiveLoginRequired('challenge_detected');
      throw new InteractiveLoginRequired('submit_button_disabled', 'El botón de inicio de sesión permaneció deshabilitado tras completar el formulario.');
    }

    await submit.click({ timeout: Math.min(timeout, 10_000) });
    try {
      await Promise.race([
        waitForPostLoginCondition(page, profile, timeout),
        // The scoped caller performs the definitive probe on a separate protected route.
        ...(options ? [password.waitFor({ state: 'hidden', timeout })] : []),
        challenge.waitFor({ state: 'visible', timeout }).then(() => { throw new InteractiveLoginRequired('challenge_detected'); }),
        errorAlert.waitFor({ state: 'visible', timeout }).then(async () => {
          // Give a brief grace window in case error container is transient before navigation
          await page.waitForTimeout(250);
          if (await challenge.isVisible()) throw new InteractiveLoginRequired('challenge_detected');
          if (await password.isVisible().catch(() => false)) {
            throw new InteractiveLoginRequired('credentials_rejected', 'El formulario mostró una alerta de error de autenticación.');
          }
        }),
      ]);
    } catch (err) {
      if (err instanceof InteractiveLoginRequired) throw err;
      if (await challenge.isVisible()) throw new InteractiveLoginRequired('challenge_detected');
      if (await errorAlert.isVisible().catch(() => false) || await password.isVisible().catch(() => false)) {
        throw new InteractiveLoginRequired('credentials_rejected', 'Las credenciales fueron rechazadas o el formulario permaneció en login.');
      }
      throw new InteractiveLoginRequired('post_login_verification_failed', 'No se alcanzó la condición post-login tras enviar el formulario.');
    }
    if (await challenge.isVisible()) throw new InteractiveLoginRequired('challenge_detected');
    return await browserContext.storageState();
  } finally {
    await page.close().catch(() => {});
  }
}