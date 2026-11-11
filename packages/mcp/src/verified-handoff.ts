import { restrictChromiumPage, type StorageState } from '@qap/auth';
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright-core';

interface HandoffRequest {
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

async function isolatedPage(browser: Browser, origin: string, state?: StorageState) {
  const context = await browser.newContext({ serviceWorkers: 'block', storageState: state, acceptDownloads: false });
  try {
    const page = await context.newPage();
    await restrictChromiumPage(page, origin);
    return { context, page };
  } catch (error) {
    await context.close().catch(() => undefined);
    throw error;
  }
}

async function verify(browser: Browser, request: HandoffRequest, state?: StorageState): Promise<boolean> {
  const { context, page } = await isolatedPage(browser, request.origin, state);
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
    return page.url() === request.verificationUrl && !(await page.locator('input[type="password"]:visible').count());
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

export async function captureVerifiedHandoff(request: HandoffRequest, signal: AbortSignal): Promise<CaptureResult> {
  let browser: Browser | undefined;
  let deadline = Infinity;
  let handoffClosed = false;
  const abort = () => { void browser?.close().catch(() => undefined); };
  signal.addEventListener('abort', abort, { once: true });
  try {
    for (const channel of [undefined, 'chrome', 'msedge'] as const) {
      if (signal.aborted) return { code: 'authentication_authorization_cancelled' };
      try { browser = await chromium.launch({ channel, headless: false, timeout: 10_000 }); break; }
      catch { /* Try the next locally installed Chromium browser. */ }
    }
    if (!browser) return { code: 'browser_not_available' };
    if (signal.aborted) return { code: 'authentication_authorization_cancelled' };
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
