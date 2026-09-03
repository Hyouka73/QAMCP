import { chromium, Browser, BrowserContext, Page } from 'playwright-core';

export interface PrototypeResult {
  title: string;
  headerText: string;
  executionTimeMs: number;
}

export async function runChromiumPrototype(
  targetUrl: string = 'https://example.com'
): Promise<PrototypeResult> {
  const startTime = Date.now();
  let browser: Browser | null = null;
  let context: BrowserContext | null = null;
  let page: Page | null = null;

  try {
    browser = await chromium.launch({ headless: true });
    console.log('Chromium Headless lanzado correctamente');

    context = await browser.newContext();
    page = await context.newPage();
    console.log('BrowserContext y Page creados correctamente');

    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    console.log(`Navegacion completada: ${targetUrl}`);

    const title = await page.title();
    const headerText = await page.locator('h1').innerText();
    console.log('Selector h1 resuelto correctamente');

    const executionTimeMs = Date.now() - startTime;
    return { title, headerText, executionTimeMs };
  } finally {
    if (page) await page.close().catch(() => {});
    if (context) await context.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
  }
}