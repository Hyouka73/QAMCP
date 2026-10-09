import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium, type Browser, type Page } from 'playwright-core';
import { executeAssert, executeWaitFor } from '../actions/index.js';

describe('Acciones S7-004 (assert, waitFor)', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    page = await context.newPage();
    await page.setContent(`
      <html>
        <body>
          <h1 id="title">Hola QAP</h1>
          <button id="btn" style="display:none;">Oculto</button>
        </body>
      </html>
    `);
  });

  afterAll(async () => {
    await browser?.close();
  });

  it('debe validar aserción visible y contains correctamente', async () => {
    await expect(
      executeAssert(page, { type: 'assert', selector: '#title', assertion_type: 'visible' })
    ).resolves.not.toThrow();

    await expect(
      executeAssert(page, { type: 'assert', selector: '#title', assertion_type: 'contains', expected: 'Hola' })
    ).resolves.not.toThrow();
  });

  it('debe fallar si la aserción no se cumple', async () => {
    await expect(
      executeAssert(page, { type: 'assert', selector: '#title', assertion_type: 'contains', expected: 'Inexistente' })
    ).rejects.toThrow('Assertion failed');
  });

  it('debe esperar correctamente con waitFor', async () => {
    await expect(
      executeWaitFor(page, { type: 'waitFor', timeout: 100 })
    ).resolves.not.toThrow();
  });
});