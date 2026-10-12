import { chromium, type Browser, type Page } from 'playwright-core';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { executeNavigate, executeClick, executeFill } from '../src/actions/index.js';

describe('Acciones base del runner (S7-003)', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
  }, 15000);

  afterAll(async () => {
    await browser.close();
  });

  const buildPageWithOffscreenButton = (): string => `data:text/html,
    <html><body>
      <div style="height: 2000px;"></div>
      <button id="target" onclick="document.title='clicked'">Click me</button>
    </body></html>`;

  beforeAll(async () => {
    const context = await browser.newContext();
    page = await context.newPage();
  }, 15000);

  it('navigate espera a que la carga de la página termine', async () => {
    await executeNavigate(page, {
      type: 'navigate',
      url: 'data:text/html,<html><body><h1 id="done">Listo</h1></body></html>',
    });

    expect(await page.locator('#done').isVisible()).toBe(true);
  }, 15000);

  it('navigate lanza un error claro si falta la url', async () => {
    await expect(executeNavigate(page, { type: 'navigate' })).rejects.toThrow(/url/i);
  });

  it('click hace scroll automático hasta un elemento fuera del viewport', async () => {
    await page.goto(buildPageWithOffscreenButton());

    const button = page.locator('#target');
    const beforeBox = await button.boundingBox();

    await executeClick(page, { type: 'click', selector: '#target' });

    expect(await page.title()).toBe('clicked');
    // Si el elemento estaba fuera del viewport (y > 720, el alto de viewport por defecto),
    // el scroll debió moverlo dentro del área visible antes del clic.
    expect(beforeBox?.y).toBeGreaterThan(720);
  }, 15000);

  it('click lanza un error claro si falta el selector', async () => {
    await expect(executeClick(page, { type: 'click' })).rejects.toThrow(/selector/i);
  });

  it('fill espera visibilidad y escribe el valor en el input', async () => {
    await page.goto('data:text/html,<html><body><input id="name" /></body></html>');

    await executeFill(page, { type: 'fill', selector: '#name', value: 'Diego' });

      expect(await page.locator('#name').inputValue()).toBe('Diego');
  }, 15000);

  it('fill reemplaza el valor previo en vez de concatenarlo', async () => {
    await page.goto('data:text/html,<html><body><input id="name" value="texto viejo" /></body></html>');

    await executeFill(page, { type: 'fill', selector: '#name', value: 'nuevo' });

      expect(await page.locator('#name').inputValue()).toBe('nuevo');
  }, 15000);

  it('fill lanza un error claro si falta el value', async () => {
    await page.goto('data:text/html,<html><body><input id="name" /></body></html>');
    await expect(executeFill(page, { type: 'fill', selector: '#name' })).rejects.toThrow(/value/i);
  });
});