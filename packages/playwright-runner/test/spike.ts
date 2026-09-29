import { chromium, Browser, BrowserContext, Page } from 'playwright-core';

export interface PrototypeResult {
  title: string;
  headerText: string;
  executionTimeMs: number;
}

export async function runChromiumPrototype(
  targetUrl: string = 'data:text/html,<html><head><title>Example Domain</title></head><body><h1>Example Domain</h1></body></html>'
): Promise<PrototypeResult> {
  const startTime = Date.now();
  let browser: Browser | null = null;
  let context: BrowserContext | null = null;
  let page: Page | null = null;

  try {
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext();
    page = await context.newPage();

    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 5000 });

    const title = await page.title();
    const headerText = await page.locator('h1').innerText();

    const executionTimeMs = Date.now() - startTime;
    return { title, headerText, executionTimeMs };
  } finally {
    if (page) await page.close().catch(() => {});
    if (context) await context.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
  }
}