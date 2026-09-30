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
      res.setHeader('Content-Type', 'text/html');

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
    expect(result.context?.buttons).toContain('Filtrar');
    expect(result.context?.forms).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'spa-filter-form',
          fields: ['search'],
        }),
      ])
    );
    expect(result.context?.playwright_used).toBe(true);
    expect(result.context?.playwright_error).toBeNull();
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