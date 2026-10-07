import { chromium, type Browser, type BrowserContext, type Page } from 'playwright-core';

export interface ViewportSize {
  width: number;
  height: number;
}

export interface LifecycleOptions {
  headless?: boolean;
  slowMo?: number;
  viewport?: ViewportSize;
  timeout_ms?: number;
  /** Desactivar solo en pruebas que no necesitan registrar SIGINT/SIGTERM. */
  registerSignalHandlers?: boolean;
}

const DEFAULT_VIEWPORT: ViewportSize = { width: 1280, height: 720 };
const DEFAULT_TIMEOUT_MS = 30000;

/**
 * RunnerLifecycle (S7-002)
 *
 * Centraliza la inicialización y limpieza del navegador Playwright:
 * - Lanza un único Browser por ejecución.
 * - Crea un BrowserContext AISLADO por cada caso de prueba (cookies,
 *   storage y sesión no se comparten entre casos).
 * - Crea una Page aislada por cada paso dentro de un caso.
 * - Expone cleanup() para cerrar todo de forma segura, incluso si el
 *   proceso recibe SIGINT/SIGTERM, evitando procesos "zombie" de Chromium.
 */
export class RunnerLifecycle {
  private browser: Browser | null = null;
  private readonly openContexts: Set<BrowserContext> = new Set();
  private readonly options: Required<
    Pick<LifecycleOptions, 'headless' | 'slowMo' | 'viewport' | 'timeout_ms' | 'registerSignalHandlers'>
  >;
  private signalHandlersRegistered = false;
  private cleanupPromise: Promise<void> | null = null;

  constructor(options: LifecycleOptions = {}) {
    this.options = {
      headless: options.headless ?? true,
      slowMo: options.slowMo ?? 0,
      viewport: options.viewport ?? DEFAULT_VIEWPORT,
      timeout_ms: options.timeout_ms ?? DEFAULT_TIMEOUT_MS,
      registerSignalHandlers: options.registerSignalHandlers ?? true,
    };
  }

  /** Lanza el navegador (una sola vez por instancia). */
  public async init(): Promise<Browser> {
    if (this.browser) {
      return this.browser;
    }

    this.browser = await chromium.launch({
      headless: this.options.headless,
      slowMo: this.options.slowMo,
    });

    if (this.options.registerSignalHandlers) {
      this.registerSignalHandlers();
    }

    return this.browser;
  }

  /** Crea un contexto de navegador AISLADO para un caso de prueba. */
  public async createContextForCase(): Promise<BrowserContext> {
    if (!this.browser) {
      throw new Error('RunnerLifecycle.init() debe llamarse antes de createContextForCase().');
    }

    const context = await this.browser.newContext({
      viewport: this.options.viewport,
    });

    context.setDefaultTimeout(this.options.timeout_ms);
    this.openContexts.add(context);

    return context;
  }

  /** Crea una página AISLADA para un paso dentro de un caso. */
  public async createPageForStep(context: BrowserContext): Promise<Page> {
    const page = await context.newPage();
    page.setDefaultTimeout(this.options.timeout_ms);
    return page;
  }

  /** Cierra un contexto de caso específico (y todas sus páginas). */
  public async closeContext(context: BrowserContext): Promise<void> {
    this.openContexts.delete(context);
    await context.close().catch(() => {});
  }

  /**
   * Limpieza total: cierra todos los contextos abiertos y el navegador.
   * Segura para invocar varias veces (idempotente) y ante SIGINT/SIGTERM.
   */
  public async cleanup(): Promise<void> {
    if (this.cleanupPromise) {
      return this.cleanupPromise;
    }
    this.cleanupPromise = this.doCleanup();
    return this.cleanupPromise;
  }

  private async doCleanup(): Promise<void> {
    for (const context of this.openContexts) {
      await context.close().catch(() => {});
    }
    this.openContexts.clear();

    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null;
    }
  }

  private registerSignalHandlers(): void {
    if (this.signalHandlersRegistered) return;
    this.signalHandlersRegistered = true;

    const handleSignal = (): void => {
      void this.cleanup().finally(() => {
        process.exit(0);
      });
    };

    process.once('SIGINT', handleSignal);
    process.once('SIGTERM', handleSignal);
  }
}