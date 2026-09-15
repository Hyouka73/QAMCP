import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { chromium } from 'playwright-core';
import type { Browser, BrowserContext, Page } from 'playwright-core';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { captureScreenshot, getSensitiveSelectors } from '../screenshots.js';

function hashBuffer(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

describe('captureScreenshot (S4-002)', () => {
  let server: Server;
  let baseUrl: string;
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;

  beforeAll(async () => {
    server = createServer((_req, res) => {
      res.setHeader('Content-Type', 'text/html');
      res.end(`
        <html>
          <body style="margin:0">
            <div id="normal" style="width:200px;height:100px;background:blue;">Publico</div>
            <div id="ssn" style="width:200px;height:100px;background:red;">123-45-6789</div>
          </body>
        </html>
      `);
    });

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;

    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ viewport: { width: 400, height: 200 } });
    page = await context.newPage();
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  });

  afterAll(async () => {
    await page.close().catch(() => {});
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('debe producir una captura distinta cuando se enmascara un selector sensible', async () => {
    const withoutMask = await captureScreenshot(page, {});
    const withMask = await captureScreenshot(page, { sensitiveSelectors: ['#ssn'] });

    expect(hashBuffer(withoutMask)).not.toBe(hashBuffer(withMask));
  });

  it('debe devolver un buffer PNG valido', async () => {
    const screenshot = await captureScreenshot(page, { sensitiveSelectors: ['#ssn'] });
    // Firma PNG: 0x89 0x50 0x4E 0x47
    expect(screenshot.subarray(0, 4).toString('hex')).toBe('89504e47');
  });

  it('debe funcionar sin selectores sensibles (captura normal)', async () => {
    const screenshot = await captureScreenshot(page, {});
    expect(screenshot.length).toBeGreaterThan(0);
  });

  it('getSensitiveSelectors debe extraer sensitive_selectors del ModuleContext', () => {
    const context = {
      _version: '1',
      objective: 'Checkout',
      manually_edited: false,
      sensitive_selectors: ['#card-number', '#cvv'],
    };

    expect(getSensitiveSelectors(context)).toEqual(['#card-number', '#cvv']);
  });

  it('getSensitiveSelectors debe devolver arreglo vacio si el modulo no declaro selectores', () => {
    const context = {
      _version: '1',
      objective: 'Checkout',
      manually_edited: false,
    };

    expect(getSensitiveSelectors(context)).toEqual([]);
  });
});