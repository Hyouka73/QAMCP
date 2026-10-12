import { describe, it, expect, vi, afterEach } from 'vitest';

import { RunnerLifecycle } from '../src/lifecycle.js';

describe('RunnerLifecycle (S7-002)', () => {
  let lifecycle: RunnerLifecycle | null = null;

  afterEach(async () => {
    if (lifecycle) {
      await lifecycle.cleanup();
      lifecycle = null;
    }
    vi.restoreAllMocks();
  });

  it('inicializa el navegador y crea contextos aislados por caso', async () => {
    lifecycle = new RunnerLifecycle({ headless: true, registerSignalHandlers: false });
    await lifecycle.init();

    const contextA = await lifecycle.createContextForCase();
    const contextB = await lifecycle.createContextForCase();

    expect(contextA).not.toBe(contextB);

    await lifecycle.closeContext(contextA);
    await lifecycle.closeContext(contextB);
  }, 15000);

  it('aplica el viewport configurado', async () => {
    lifecycle = new RunnerLifecycle({
      headless: true,
      registerSignalHandlers: false,
      viewport: { width: 1024, height: 768 },
    });
    await lifecycle.init();

    const context = await lifecycle.createContextForCase();
    const page = await lifecycle.createPageForStep(context);

    expect(page.viewportSize()).toEqual({ width: 1024, height: 768 });

    await lifecycle.closeContext(context);
  }, 15000);

  it('crea una pagina aislada por paso dentro del mismo caso', async () => {
    lifecycle = new RunnerLifecycle({ headless: true, registerSignalHandlers: false });
    await lifecycle.init();

    const context = await lifecycle.createContextForCase();
    const pageStep1 = await lifecycle.createPageForStep(context);
    const pageStep2 = await lifecycle.createPageForStep(context);

    expect(pageStep1).not.toBe(pageStep2);

    await lifecycle.closeContext(context);
  }, 15000);

  it('cleanup() cierra el navegador y es seguro llamarlo varias veces', async () => {
    lifecycle = new RunnerLifecycle({ headless: true, registerSignalHandlers: false });
    await lifecycle.init();
    await lifecycle.createContextForCase();

    await lifecycle.cleanup();
    await expect(lifecycle.cleanup()).resolves.not.toThrow();
  }, 15000);

   it('ante SIGINT, invoca cleanup() y termina el proceso de forma segura', async () => {
    lifecycle = new RunnerLifecycle({ headless: true });

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
    const cleanupSpy = vi.spyOn(lifecycle, 'cleanup');

    await lifecycle.init();

    process.emit('SIGINT');

    // No asumimos un tiempo fijo: esperamos activamente a que cleanup()
    // (que cierra un navegador real) termine, en vez de un setTimeout rígido.
    await vi.waitFor(
      () => {
        expect(exitSpy).toHaveBeenCalled();
      },
      { timeout: 10000, interval: 50 }
    );

    expect(cleanupSpy).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalled();
  }, 15000);
});