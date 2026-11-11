import { authBrowserDiagnosticsEnabled, executeAutoLogin, restrictChromiumPage, type AuthCredentials,
  type StorageState } from '@qap/auth';
import type { AuthProfile } from '@qap/shared';
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright-core';

export interface HandoffRequest {
  origin: string;
  loginUrl: string;
  verificationUrl: string;
  selector: string;
  timeoutMs: number;
}

type CaptureResult = { state: StorageState; code?: never } | { state?: never; code: string };

function sameOrigin(value: string, origin: string): boolean {
  try {
    const url = new URL(value);
    return url.origin === origin && ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password;
  } catch { return false; }
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
    if (!response?.ok() || page.url() !== request.verificationUrl) return false;
    const marker = page.locator(request.selector).first();
    if (!state) {
      try { await marker.waitFor({ state: 'visible', timeout: 3000 }); }
      catch (error) {
        if (!(error instanceof Error) || error.name !== 'TimeoutError') throw error;
        return false;
      }
      return true;
    }
    await marker.waitFor({ state: 'visible', timeout: 10_000 });
    return page.url() === request.verificationUrl && !(await page.locator(
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

async function waitForLogin(page: Page, request: HandoffRequest, deadline: number): Promise<boolean> {
  while (Date.now() < deadline && !page.isClosed()) {
    if (sameOrigin(page.url(), request.origin) &&
        await page.locator(request.selector).first().isVisible().catch(() => false) &&
        !(await page.locator('input[type="password"]:visible').count())) return true;
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
  } catch {
    return { code: signal.aborted ? 'authentication_authorization_cancelled' : 'authentication_required' };
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
    if (await verify(browser, request)) return { code: 'session_invalid' };
    const context = await browser.newContext({ serviceWorkers: 'block', acceptDownloads: false });
    const state = scopedState(await executeAutoLogin({ ...profile, login_route: request.loginUrl },
      credentials, context, { origin: request.origin, timeoutMs: request.timeoutMs }), request.origin);
    await context.close();
    if ((!state.cookies.length && !state.origins.some(item => item.localStorage.length)) ||
        !await verify(browser, request, state)) return { code: 'authentication_required' };
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
