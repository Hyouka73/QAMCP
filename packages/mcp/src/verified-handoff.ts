import { authBrowserDiagnosticsEnabled, executeAutoLogin, fillLoginInput, InteractiveLoginRequired, restrictChromiumPage,
  type AutoLoginFailureReason, type AuthCredentials, type StorageState } from '@qap/auth';
import type { AuthProfile } from '@qap/shared';
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright-core';

export interface HandoffRequest {
  origin: string;
  loginUrl: string;
  verificationUrl: string;
  selector: string;
  timeoutMs: number;
  profile?: AuthProfile;
  credentials?: AuthCredentials;
}

export type CaptureResult =
  | { state: StorageState; code?: never; challengeDetected?: never; failureReason?: never }
  | { state?: never; code: string; challengeDetected?: boolean; failureReason?: AutoLoginFailureReason | string };

function sameOrigin(value: string, origin: string): boolean {
  try {
    const url = new URL(value);
    return url.origin === origin && ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password;
  } catch { return false; }
}

function normalizePath(urlStr: string): string {
  try {
    const pathname = new URL(urlStr).pathname.replace(/\/+$/, '');
    return pathname || '/';
  } catch {
    return urlStr;
  }
}

function isProtectedNonLoginRoute(currentUrl: string, request: HandoffRequest): boolean {
  if (!sameOrigin(currentUrl, request.origin)) return false;
  const currentPath = normalizePath(currentUrl);
  const loginPath = normalizePath(request.loginUrl);
  const verificationPath = normalizePath(request.verificationUrl);
  if (verificationPath !== loginPath && currentPath === loginPath) return false;
  return true;
}

async function isolatedPage(browser: Browser, origin: string, state?: StorageState, readOnly = false) {
  const context = await browser.newContext({ serviceWorkers: 'block', storageState: state, acceptDownloads: false });
  try {
    const page = await context.newPage();
    await restrictChromiumPage(page, origin, readOnly);
    return { context, page };
  } catch (error) {
    await context.close().catch(() => undefined);
    throw error;
  }
}

async function verify(browser: Browser, request: HandoffRequest, state?: StorageState): Promise<boolean> {
  const { context, page } = await isolatedPage(browser, request.origin, state, true);
  try {
    const response = await page.goto(request.verificationUrl, { waitUntil: 'domcontentloaded', timeout: 15_000 });
    if (!response?.ok() || !isProtectedNonLoginRoute(page.url(), request)) return false;
    const marker = page.locator(request.selector).first();
    if (!state) {
      try { await marker.waitFor({ state: 'visible', timeout: 3000 }); }
      catch (error) {
        if (!(error instanceof Error) || error.name !== 'TimeoutError') throw error;
        return false;
      }
      return !(await page.locator(
        'input[type="password"]:visible, input[autocomplete="one-time-code"]:visible, iframe[src*="captcha" i]:visible'
      ).count());
    }
    await marker.waitFor({ state: 'visible', timeout: 10_000 });
    return isProtectedNonLoginRoute(page.url(), request) && !(await page.locator(
      'input[type="password"]:visible, input[autocomplete="one-time-code"]:visible, iframe[src*="captcha" i]:visible'
    ).count());
  } finally { await context.close().catch(() => undefined); }
}

function scopedState(state: Awaited<ReturnType<BrowserContext['storageState']>>, origin: string): StorageState {
  const hostname = new URL(origin).hostname;
  return {
    cookies: state.cookies.filter(cookie => cookie.domain === hostname ||
      (cookie.domain.startsWith('.') && ('.' + hostname).endsWith(cookie.domain))),
    origins: state.origins.filter(item => item.origin === origin),
  };
}

const DEFAULT_USERNAME_SELECTORS = [
  'input[name="username"]', 'input[name="user"]', 'input[name="login"]', 'input[name="usuario"]',
  'input[name="identifier"]', 'input[name="identificador"]', 'input[name="email"]', 'input[type="email"]',
  'input[autocomplete="username"]', 'input[id*="user" i]', 'input[id*="login" i]', 'input[type="text"]',
].join(', ');
const DEFAULT_PASSWORD_SELECTORS = 'input[name="password"], input[type="password"], input[autocomplete="current-password"]';
const DEFAULT_SUBMIT_SELECTORS = 'button[type="submit"], input[type="submit"]';
const CHALLENGE_SELECTORS = [
  'input[autocomplete="one-time-code"]', 'input[name="otp"]', 'input[name="totp"]',
  'iframe[src*="captcha" i]', 'iframe[title*="captcha" i]', '[data-sitekey]',
].join(', ');

async function assistLoginWithVaultCredentials(page: Page, request: HandoffRequest): Promise<void> {
  const { profile, credentials } = request;
  if (!credentials?.password) return;
  try {
    const password = page.locator(profile?.form_selectors?.password ?? DEFAULT_PASSWORD_SELECTORS).first();
    if (!(await password.isVisible().catch(() => false))) {
      await password.waitFor({ state: 'visible', timeout: 4_000 }).catch(() => {});
    }
    if (!(await password.isVisible().catch(() => false))) return;

    const formOrigin = await password.evaluate((element: { type: string; form?: { action: string } }, base) =>
      element.type === 'password' ? new URL(element.form?.action || base, base).origin : null, page.url()).catch(() => null);
    if (formOrigin !== request.origin) return;

    const username = credentials.username ?? profile?.username;
    if (username) {
      const userLocator = page.locator(profile?.form_selectors?.username ?? DEFAULT_USERNAME_SELECTORS).first();
      await fillLoginInput(userLocator, username, 4_000).catch(() => {});
    }
    await fillLoginInput(password, credentials.password, 4_000).catch(() => {});

    // Only auto-submit in the visible browser if no interactive challenge is present
    const challengeSelector = CHALLENGE_SELECTORS + (profile?.challenge_selector ? ', ' + profile.challenge_selector : '');
    const challengeVisible = await page.locator(challengeSelector).filter({ visible: true }).first().isVisible().catch(() => false);
    if (challengeVisible) return;

    const submit = page.locator(profile?.form_selectors?.submit ?? DEFAULT_SUBMIT_SELECTORS).first();
    const waitEnableUntil = Date.now() + 2_500;
    while (Date.now() < waitEnableUntil) {
      if (!(await submit.isDisabled().catch(() => true))) break;
      await page.waitForTimeout(100);
    }
    if (!(await submit.isDisabled().catch(() => true))) {
      await submit.click({ timeout: 3_000 }).catch(() => {});
    }
  } catch {
    // Best-effort Vault assistance; human operator can still interact with the visible browser.
  }
}

async function waitForLogin(page: Page, request: HandoffRequest, deadline: number): Promise<boolean> {
  while (Date.now() < deadline && !page.isClosed()) {
    const url = page.url();
    if (sameOrigin(url, request.origin)) {
      const noPasswordVisible = !(await page.locator('input[type="password"]:visible').count().catch(() => 1));
      if (noPasswordVisible) {
        const markerVisible = await page.locator(request.selector).first().isVisible().catch(() => false);
        if (markerVisible) return true;
        // Also recognize when login redirected to a non-login same-origin route and set session cookies
        if (isProtectedNonLoginRoute(url, request)) {
          const cookies = await page.context().cookies(request.origin).catch(() => []);
          if (cookies.length > 0) return true;
        }
      }
    }
    await page.waitForTimeout(300);
  }
  return false;
}

async function openBrowser(headless: boolean, signal: AbortSignal): Promise<Browser | undefined> {
  for (const channel of [undefined, 'chrome', 'msedge'] as const) {
    if (signal.aborted) return;
    try { return await chromium.launch({ channel, headless, timeout: 10_000 }); }
    catch { /* Try the next locally installed Chromium browser. */ }
  }
  return undefined;
}

async function withHeadlessBrowser(request: HandoffRequest, signal: AbortSignal,
  operation: (browser: Browser) => Promise<CaptureResult>): Promise<CaptureResult> {
  if (authBrowserDiagnosticsEnabled()) return { code: 'authentication_diagnostics_enabled' };
  let browser: Browser | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const abort = () => { void browser?.close().catch(() => undefined); };
  signal.addEventListener('abort', abort, { once: true });
  try {
    browser = await openBrowser(true, signal);
    if (signal.aborted) return { code: 'authentication_authorization_cancelled' };
    if (!browser) return { code: 'browser_not_available' };
    timer = setTimeout(abort, request.timeoutMs);
    return await operation(browser);
  } catch (error) {
    if (signal.aborted) return { code: 'authentication_authorization_cancelled' };
    if (error instanceof InteractiveLoginRequired) {
      if (error.reason === 'challenge_detected') {
        return { code: 'authentication_required', challengeDetected: true, failureReason: 'challenge_detected' };
      }
      return { code: 'authentication_required', challengeDetected: false, failureReason: error.reason };
    }
    return { code: 'authentication_required', challengeDetected: false, failureReason: 'post_login_verification_failed' };
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', abort);
    await browser?.close().catch(() => undefined);
  }
}

export function verifyStoredSession(request: HandoffRequest, state: StorageState, signal: AbortSignal): Promise<CaptureResult> {
  return withHeadlessBrowser(request, signal, async browser => {
    try {
      return !(await verify(browser, request)) && await verify(browser, request, state)
        ? { state } : { code: 'session_expired' };
    } catch {
      return { code: 'session_expired' };
    }
  });
}

export function captureVerifiedAuto(request: HandoffRequest, profile: AuthProfile, credentials: AuthCredentials,
  signal: AbortSignal): Promise<CaptureResult> {
  return withHeadlessBrowser(request, signal, async browser => {
    if (await verify(browser, request)) return { code: 'session_invalid', failureReason: 'public_marker_on_verification_route' };
    const context = await browser.newContext({ serviceWorkers: 'block', acceptDownloads: false });
    const state = scopedState(await executeAutoLogin({ ...profile, login_route: request.loginUrl },
      credentials, context, { origin: request.origin, timeoutMs: request.timeoutMs }), request.origin);
    await context.close();
    if (!state.cookies.length && !state.origins.some(item => item.localStorage.length)) {
      return { code: 'authentication_required', challengeDetected: false, failureReason: 'session_storage_empty' };
    }
    if (!await verify(browser, request, state)) {
      return { code: 'authentication_required', challengeDetected: false, failureReason: 'post_login_verification_failed' };
    }
    return { state };
  });
}

export async function captureVerifiedHandoff(request: HandoffRequest, signal: AbortSignal): Promise<CaptureResult> {
  let browser: Browser | undefined;
  let deadline = Infinity;
  let handoffClosed = false;
  const abort = () => { void browser?.close().catch(() => undefined); };
  signal.addEventListener('abort', abort, { once: true });
  try {
    if (authBrowserDiagnosticsEnabled()) return { code: 'authentication_diagnostics_enabled' };
    browser = await openBrowser(false, signal);
    if (signal.aborted) return { code: 'authentication_authorization_cancelled' };
    if (!browser) return { code: 'browser_not_available' };
    deadline = Date.now() + request.timeoutMs;
    const timer = setTimeout(abort, request.timeoutMs);
    try {
      const { context, page } = await isolatedPage(browser, request.origin);
      const onClose = () => { handoffClosed = true; };
      page.once('close', onClose);
      await page.goto(request.loginUrl, { waitUntil: 'domcontentloaded', timeout: Math.min(15_000, request.timeoutMs) });
      if (request.credentials?.password) {
        await assistLoginWithVaultCredentials(page, request);
      }
      if (!await waitForLogin(page, request, deadline)) {
        return { code: Date.now() >= deadline ? 'handoff_timeout' : 'handoff_cancelled' };
      }
      const state = scopedState(await context.storageState(), request.origin);
      if (!state.cookies.length && !state.origins.some(item => item.localStorage.length)) return { code: 'session_invalid' };
      page.off('close', onClose);
      await context.close();
      if (await verify(browser, request) || !await verify(browser, request, state)) return { code: 'session_invalid' };
      return { state };
    } finally { clearTimeout(timer); }
  } catch {
    if (signal.aborted) return { code: 'authentication_authorization_cancelled' };
    if (Date.now() >= deadline) return { code: 'handoff_timeout' };
    return { code: handoffClosed ? 'handoff_cancelled' : 'session_invalid' };
  } finally {
    signal.removeEventListener('abort', abort);
    await browser?.close().catch(() => undefined);
  }
}
