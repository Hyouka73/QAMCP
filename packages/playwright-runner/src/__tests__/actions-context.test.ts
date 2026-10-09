import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium, type Browser, type Page } from 'playwright-core';
import { executeCapture, executeEvaluate, executeSwitchAuth } from '../actions/index.js';

describe('Acciones S7-005 (capture, evaluate, switch_auth)', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    page = await context.newPage();
  }, 15000);

  afterAll(async () => {
    await browser?.close();
  });

  it('captura el texto de un elemento y lo guarda en las variables de contexto', async () => {
    await page.setContent('<html><body><span id="price">$199</span></body></html>');
    const contextVariables: Record<string, string> = {};

    const result = await executeCapture(
      page,
      { type: 'capture', selector: '#price', capture_as: 'price' },
      contextVariables
    );

    expect(result).toBe('$199');
    expect(contextVariables.price).toBe('$199');
  });

  it('captura el value de un input, no su textContent', async () => {
    await page.setContent('<html><body><input id="qty" value="5" /></body></html>');
    const contextVariables: Record<string, string> = {};

    const result = await executeCapture(
      page,
      { type: 'capture', selector: '#qty', capture_as: 'qty' },
      contextVariables
    );

    expect(result).toBe('5');
  });

  it('evaluate puede leer una variable capturada previamente vía ctx', async () => {
    const contextVariables: Record<string, string> = { price: '199' };

    const result = await executeEvaluate(
      page,
      { type: 'evaluate', expression: 'Number(ctx.price) * 2' },
      contextVariables
    );

    expect(result).toBe(398);
  });

    it('evaluate lee el DOM real de la página y guarda el resultado en capture_as', async () => {
    await page.setContent(`
      <html><body>
        <ul>
          <li class="item">Producto A</li>
          <li class="item">Producto B</li>
          <li class="item">Producto C</li>
        </ul>
      </body></html>
    `);
    const contextVariables: Record<string, string> = {};

    const result = await executeEvaluate(
      page,
      {
        type: 'evaluate',
        expression: `document.querySelectorAll('.item').length`,
        capture_as: 'totalItems',
      },
      contextVariables
    );

    // Este valor NO podría obtenerse sin ejecutar dentro del contexto del navegador:
    // document no existe en el proceso de Node, solo dentro de la página.
    expect(result).toBe(3);
    expect(contextVariables.totalItems).toBe('3');
  });

  it('switch_auth lanza un error claro si no se definió auth_profile', async () => {
    await expect(
      executeSwitchAuth(page, { type: 'switch_auth' })
    ).rejects.toThrow(/auth_profile/i);
  });

  it('switch_auth lanza un error claro si no existe sesión válida para el perfil', async () => {
    await expect(
      executeSwitchAuth(page, { type: 'switch_auth', auth_profile: 'perfil-inexistente-xyz' }, '.qa/cache/sessions')
    ).rejects.toThrow(/No existe una sesión válida/);
  });
});