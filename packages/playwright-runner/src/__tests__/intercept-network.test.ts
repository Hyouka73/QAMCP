import type { TCStep } from '@qap/shared';
import type { Page } from 'playwright-core';
import { describe, it, expect, vi } from 'vitest';

import { executeInterceptNetwork } from '../actions/intercept-network.js';

interface FakeRoute {
  request: () => { method: () => string };
  fulfill: ReturnType<typeof vi.fn>;
  continue: ReturnType<typeof vi.fn>;
}

function setup(method = 'GET') {
  let handler: (route: FakeRoute) => Promise<void> = () => Promise.resolve();
  const route = vi.fn((_pattern: string, fn: (route: FakeRoute) => Promise<void>) => {
    handler = fn;
    return Promise.resolve();
  });
  const fakeRoute: FakeRoute = {
    request: () => ({ method: () => method }),
    fulfill: vi.fn(),
    continue: vi.fn(),
  };
  return { page: { route } as unknown as Page, route, fakeRoute, run: () => handler(fakeRoute) };
}

describe('executeInterceptNetwork (S81-002)', () => {
  it('simula HTTP 403 por defecto en todas las peticiones', async () => {
    const { page, route, fakeRoute, run } = setup();

    await executeInterceptNetwork(page, { type: 'intercept_network' });
    await run();

    expect(route).toHaveBeenCalledWith('**/*', expect.any(Function));
    expect(fakeRoute.fulfill).toHaveBeenCalledWith(expect.objectContaining({ status: 403 }));
  });

  it('simula HTTP 401 con intercept_config.response_override', async () => {
    const { page, route, fakeRoute, run } = setup();
    const step: TCStep = {
      type: 'intercept_network',
      intercept_config: { url_pattern: '**/api/**', response_override: { status: 401, body: '{"error":"no"}' } },
    };

    await executeInterceptNetwork(page, step);
    await run();

    expect(route).toHaveBeenCalledWith('**/api/**', expect.any(Function));
    expect(fakeRoute.fulfill).toHaveBeenCalledWith(expect.objectContaining({ status: 401, body: '{"error":"no"}' }));
  });

  it('mantiene los alias target y expected_status', async () => {
    const { page, route, fakeRoute, run } = setup();

    await executeInterceptNetwork(page, { type: 'intercept_network', target: '**/old/**', expected_status: 401 });
    await run();

    expect(route).toHaveBeenCalledWith('**/old/**', expect.any(Function));
    expect(fakeRoute.fulfill).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });

  it('deja pasar las peticiones cuyo método no coincide con intercept_config.method', async () => {
    const { page, fakeRoute, run } = setup('GET');

    await executeInterceptNetwork(page, { type: 'intercept_network', intercept_config: { method: 'POST' } });
    await run();

    expect(fakeRoute.continue).toHaveBeenCalled();
    expect(fakeRoute.fulfill).not.toHaveBeenCalled();
  });
});