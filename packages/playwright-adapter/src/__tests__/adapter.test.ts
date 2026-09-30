import { createServer } from 'node:http';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { chromium } from 'playwright-core';

import { PlaywrightAdapter, launchBrowser } from '../adapter.js';

describe('PlaywrightAdapter (S4-001 & Sprint 5)', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    server = createServer((req, res) => {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');

      if (req.url === '/spa') {
        // Simula una Single Page Application (React / Vite) como EXATO Center
        // El HTML inicial solo contiene <div id="root"></div> y se hidrata después
        res.end(`
          <!DOCTYPE html>
          <html>
            <head><title>EXATO Center SPA</title></head>
            <body>
              <div id="root"></div>
              <script>
                setTimeout(() => {
                  const root = document.getElementById('root');
                  root.innerHTML = \`
                    <main>
                      <h1>Dashboard SPA</h1>
                      <a href="/spa/users">Usuarios</a>
                      <a href="/spa/settings">Configuración</a>
                      <form id="spa-filter-form">
                        <input name="search" type="text" placeholder="Buscar..." />
                      </form>
                      <button type="submit">Filtrar</button>
                    </main>
                  \`;
                }, 200);
              </script>
            </body>
          </html>
        `);
        return;
      }

      if (req.url === '/selectors-priority') {
        res.end(`
          <!DOCTYPE html>
          <html>
            <head><title>Selector Priority Test</title></head>
            <body>
              <form id="priority-form">
                <!-- 1. id -->
                <input id="input-by-id" name="name-ignored" data-testid="test-ignored" type="text" placeholder="By ID" />
                <!-- 2. name -->
                <input name="input-by-name" data-testid="test-ignored-2" type="email" placeholder="By Name" />
                <!-- 3. data-testid -->
                <input data-testid="input-by-testid" type="tel" placeholder="By TestId" />
                <!-- 4. type -->
                <input type="password" placeholder="••••••••" value="supersecret" />
              </form>

              <!-- Botones con prioridades -->
              <button id="btn-id" data-testid="btn-test">Boton Con ID</button>
              <button data-testid="btn-testid">Boton Con TestID</button>
              <button type="submit">Iniciar Sesión</button>
              <button type="submit"></button>

              <!-- Enlaces -->
              <a href="/recovery">¿Olvidaste tu contraseña?</a>
              <a href="/terms"></a>
            </body>
          </html>
        `);
        return;
      }

      res.end(`
        <html>
          <head><title>Modulo Checkout</title></head>
          <body>
            <h1>Checkout</h1>
            <a href="/checkout/cart">Carrito</a>
            <a href="/checkout/payment">Pago</a>
          </body>
        </html>
      `);
    });

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('debe navegar a la ruta del modulo y extraer conocimiento basico', async () => {
    const adapter = new PlaywrightAdapter({ baseUrl });

    const result = await adapter.discover({
      name: 'checkout',
      path: '/',
      tags: ['ecommerce'],
    });

    expect(result.name).toBe('checkout');
    expect(result.description).toBe('Modulo Checkout');
    expect(result.tags).toEqual(['ecommerce']);
    expect(result.context?.discovered_routes).toEqual(
      expect.arrayContaining(['/checkout/cart', '/checkout/payment'])
    );
  }, 30000);

  it('debe esperar activamente la hidratación SPA en React/Vite (#root) y extraer selectores', async () => {
    const adapter = new PlaywrightAdapter({ baseUrl });

    const result = await adapter.discover({
      name: 'exato-spa',
      path: '/spa',
      tags: ['spa', 'react'],
    });

    expect(result.name).toBe('exato-spa');
    expect(result.description).toBe('EXATO Center SPA');
    expect(result.context?.discovered_routes).toEqual(
      expect.arrayContaining(['/spa/users', '/spa/settings'])
    );
    expect(result.context?.buttons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'filtrar',
          text: 'Filtrar',
          selector: 'button:has-text("Filtrar")',
        }),
      ])
    );
    expect(result.context?.forms).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'spa-filter-form',
          fields: ['input[name="search"]'],
          inputs: [
            expect.objectContaining({
              key: 'search',
              selector: 'input[name="search"]',
              type: 'text',
              placeholder: 'Buscar...',
            }),
          ],
        }),
      ])
    );
    expect(result.context?.playwright_used).toBe(true);
    expect(result.context?.playwright_error).toBeNull();
  }, 30000);

  it('debe extraer selectores reales respetando prioridades de inputs, botones y enlaces sin exponer contraseñas', async () => {
    const adapter = new PlaywrightAdapter({ baseUrl });

    const result = await adapter.discover({
      name: 'prioridades',
      path: '/selectors-priority',
      tags: ['auth', 'security'],
    });

    const ctx = result.context!;
    expect(ctx.playwright_used).toBe(true);

    // 1. Validar prioridades en inputs
    const inputs = (ctx.inputs as Array<{ key: string; selector: string; type: string; placeholder: string | null }>);
    expect(inputs).toBeDefined();

    // Prioridad 1: id (#id)
    const byId = inputs.find((i) => i.key === 'name-ignored' || i.key === 'input-by-id');
    expect(byId).toBeDefined();
    expect(byId?.selector).toBe('#input-by-id');

    // Prioridad 2: name (input[name="..."])
    const byName = inputs.find((i) => i.key === 'input-by-name');
    expect(byName).toBeDefined();
    expect(byName?.selector).toBe('input[name="input-by-name"]');

    // Prioridad 3: data-testid ([data-testid="..."])
    const byTestId = inputs.find((i) => i.key === 'input-by-testid');
    expect(byTestId).toBeDefined();
    expect(byTestId?.selector).toBe('[data-testid="input-by-testid"]');

    // Prioridad 4: type (input[type="..."]) y PROHIBICIÓN de el.value y "••••••••"
    const byType = inputs.find((i) => i.type === 'password');
    expect(byType).toBeDefined();
    expect(byType?.selector).toBe('input[type="password"]');
    expect(byType?.placeholder).toBeNull(); // Se descartan valores enmascarados como "••••••••"
    expect(JSON.stringify(inputs)).not.toContain('supersecret'); // Prohibido guardar el.value

    // 2. Validar prioridades en botones
    const buttons = (ctx.buttons as Array<{ key: string; text: string; selector: string }>);
    expect(buttons).toBeDefined();

    // Prioridad 1: id
    const btnId = buttons.find((b) => b.text === 'Boton Con ID');
    expect(btnId?.selector).toBe('#btn-id');

    // Prioridad 2: data-testid
    const btnTestId = buttons.find((b) => b.text === 'Boton Con TestID');
    expect(btnTestId?.selector).toBe('[data-testid="btn-testid"]');

    // Prioridad 3: button:has-text("${texto}")
    const btnText = buttons.find((b) => b.text === 'Iniciar Sesión');
    expect(btnText?.selector).toBe('button:has-text("Iniciar Sesión")');

    // Prioridad 4: button[type="submit"]
    const btnSubmit = buttons.find((b) => b.text === '' && b.selector === 'button[type="submit"]');
    expect(btnSubmit).toBeDefined();

    // 3. Validar enlaces: a:has-text("${texto}") o a[href="${href}"]
    const links = (ctx.links as Array<{ key: string; text: string; href: string; selector: string }>);
    expect(links).toBeDefined();

    const linkWithText = links.find((l) => l.href === '/recovery');
    expect(linkWithText?.selector).toBe('a:has-text("¿Olvidaste tu contraseña?")');

    const linkWithoutText = links.find((l) => l.href === '/terms');
    expect(linkWithoutText?.selector).toBe('a[href="/terms"]');
  }, 30000);

  it('debe lanzar un error claro si el modulo no define una ruta', async () => {
    const adapter = new PlaywrightAdapter({ baseUrl });
    await expect(adapter.discover({ name: 'sin-ruta' })).rejects.toThrow(/no define una ruta/);
  });
});

describe('launchBrowser (Cascada Multiplataforma)', () => {
  it('debe intentar chrome, luego msedge y luego chromium por defecto', async () => {
    const launchSpy = vi.spyOn(chromium, 'launch');
    const attempts: Array<Record<string, unknown>> = [];

    launchSpy.mockImplementation(async (opts?: any) => {
      attempts.push(opts);
      if (opts?.channel === 'chrome') {
        throw new Error("Executable doesn't exist at chrome path");
      }
      if (opts?.channel === 'msedge') {
        throw new Error("Executable doesn't exist at msedge path");
      }
      // Simular éxito en el default
      return { close: vi.fn() } as any;
    });

    const browser = await launchBrowser({ headed: true });
    expect(browser).toBeDefined();

    expect(attempts).toHaveLength(3);
    expect(attempts[0]).toEqual({ channel: 'chrome', headless: false });
    expect(attempts[1]).toEqual({ channel: 'msedge', headless: false });
    expect(attempts[2]).toEqual({ headless: false });

    launchSpy.mockRestore();
  });

  it('si todos fallan por falta de binarios, lanza un error descriptivo', async () => {
    const launchSpy = vi.spyOn(chromium, 'launch');

    launchSpy.mockImplementation(async () => {
      throw new Error("browserType.launch: Executable doesn't exist");
    });

    await expect(launchBrowser({ headed: false })).rejects.toThrow(
      /No se encontró un navegador compatible en el sistema/
    );

    launchSpy.mockRestore();
  });

  it('si launchBrowser falla durante discover(), PlaywrightAdapter devuelve playwright_error en context', async () => {
    const launchSpy = vi.spyOn(chromium, 'launch');

    launchSpy.mockImplementation(async () => {
      throw new Error("browserType.launch: Executable doesn't exist");
    });

    const adapter = new PlaywrightAdapter();
    const result = await adapter.discover({
      name: 'modulo-sin-navegador',
      path: 'http://localhost:9999/test',
    });

    expect(result.context?.playwright_used).toBe(false);
    expect(result.context?.playwright_error).toMatch(/No se encontró un navegador compatible en el sistema/);

    launchSpy.mockRestore();
  });
});