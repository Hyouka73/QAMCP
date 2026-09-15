import { createServer } from 'node:http';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { PlaywrightAdapter } from '../adapter.js';

describe('PlaywrightAdapter (S4-001)', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    server = createServer((_req, res) => {
      res.setHeader('Content-Type', 'text/html');
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
  }, 20000);

  it('debe lanzar un error claro si el modulo no define una ruta', async () => {
    const adapter = new PlaywrightAdapter({ baseUrl });
    await expect(adapter.discover({ name: 'sin-ruta' })).rejects.toThrow(/no define una ruta/);
  });
});