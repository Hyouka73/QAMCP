import { chromium, type Browser, type Page } from 'playwright-core';
import type { IDiscoverer } from '@qap/engine';
import type { ModuleSpec, Module } from '@qap/shared';

export interface PlaywrightAdapterOptions {
  /** Si el navegador corre sin interfaz visible. Por defecto true. */
  headless?: boolean;
  /** Si el navegador corre con interfaz visible. Alias complementario de headless. */
  headed?: boolean;
  /** URL base contra la cual se resuelven las rutas relativas de los modulos. */
  baseUrl?: string;
}

export interface LaunchBrowserOptions {
  /** Si es true, inicia el navegador con ventana visible. Por defecto false (headless). */
  headed?: boolean;
}

/**
 * Estrategia de lanzamiento de navegador en cascada multiplataforma.
 * 1. Intenta canal 'chrome' instalado en el sistema (Windows / macOS).
 * 2. Si falla: intenta canal 'msedge' instalado en el sistema.
 * 3. Si falla: intenta Chromium por defecto de Playwright.
 * 4. Si todos fallan por falta de binarios (Executable doesn't exist), captura el error
 *    y lanza una excepción clara indicando que no se encontró un navegador compatible en el sistema.
 */
export async function launchBrowser(options: LaunchBrowserOptions = {}): Promise<Browser> {
  const isHeadless = !options.headed;

  // 1. Intentar Chrome del sistema
  try {
    return await chromium.launch({ channel: 'chrome', headless: isHeadless });
  } catch (chromeErr) {
    // 2. Si falla: intentar Microsoft Edge del sistema
    try {
      return await chromium.launch({ channel: 'msedge', headless: isHeadless });
    } catch (edgeErr) {
      // 3. Si falla: intentar Chromium por defecto empaquetado por Playwright
      try {
        return await chromium.launch({ headless: isHeadless });
      } catch (defaultErr) {
        // 4. Si todos fallan por falta de binarios (Executable doesn't exist)
        const chromeMsg = chromeErr instanceof Error ? chromeErr.message : String(chromeErr);
        const edgeMsg = edgeErr instanceof Error ? edgeErr.message : String(edgeErr);
        const defaultMsg = defaultErr instanceof Error ? defaultErr.message : String(defaultErr);

        const isMissingBinary =
          /executable doesn't exist/i.test(chromeMsg) ||
          /executable doesn't exist/i.test(edgeMsg) ||
          /executable doesn't exist/i.test(defaultMsg);

        const detail = isMissingBinary
          ? "No se encontró un navegador compatible en el sistema (Google Chrome, Microsoft Edge ni Chromium de Playwright). Instala Google Chrome o ejecuta 'npx playwright install chromium'."
          : `No se pudo iniciar ningún navegador compatible en el sistema. Errores: Chrome (${chromeMsg}), Edge (${edgeMsg}), Chromium (${defaultMsg})`;

        throw new Error(detail);
      }
    }
  }
}

/**
 * Adaptador de descubrimiento Playwright con soporte para SPAs (React / Vite).
 * Implementa IDiscoverer navegando directamente con playwright-core,
 * esperando activamente a la hidratación del DOM y extrayendo rutas, botones y formularios.
 */
export class PlaywrightAdapter implements IDiscoverer {
  constructor(private options: PlaywrightAdapterOptions = {}) {}

  async discover(spec: ModuleSpec): Promise<Module> {
    if (!spec.path) {
      throw new Error(`El modulo '${spec.name}' no define una ruta (path) para explorar`);
    }

    const headed =
      this.options.headed ??
      (this.options.headless !== undefined ? !this.options.headless : false);

    let browser: Browser | null = null;

    try {
      browser = await launchBrowser({ headed });
    } catch (err) {
      const playwrightError = err instanceof Error ? err.message : String(err);
      return {
        name: spec.name,
        path: spec.path,
        description: spec.name,
        tags: spec.tags ?? [],
        cases: [],
        context: {
          discovered_routes: [],
          discovered_at: new Date().toISOString(),
          forms: [],
          buttons: [],
          playwright_used: false,
          playwright_error: playwrightError,
        },
      };
    }

    try {
      const page = await browser.newPage();
      const targetUrl = this.resolveUrl(spec.path);

      await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
      // Esperar a que React monte componentes en el root
      await page.waitForSelector('#root > *, main, form, input, button, a[href]', { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(1000); // margen para renderizado y transiciones

      const title = await page.title();
      const description = title && title.trim() ? title.trim() : spec.name;

      const discoveredRoutes = await this.extractRoutes(page);
      const forms = await this.extractForms(page);
      const buttons = await this.extractButtons(page);

      return {
        name: spec.name,
        path: spec.path,
        description,
        tags: spec.tags ?? [],
        cases: [],
        context: {
          discovered_routes: discoveredRoutes,
          discovered_at: new Date().toISOString(),
          forms,
          buttons,
          playwright_used: true,
          playwright_error: null,
        },
      };
    } catch (err) {
      const playwrightError = err instanceof Error ? err.message : String(err);
      return {
        name: spec.name,
        path: spec.path,
        description: spec.name,
        tags: spec.tags ?? [],
        cases: [],
        context: {
          discovered_routes: [],
          discovered_at: new Date().toISOString(),
          forms: [],
          buttons: [],
          playwright_used: false,
          playwright_error: playwrightError,
        },
      };
    } finally {
      if (browser) {
        await browser.close().catch(() => {});
      }
    }
  }

  private resolveUrl(path: string): string {
    if (/^https?:\/\//.test(path)) return path;
    if (!this.options.baseUrl) return path;
    return new URL(path, this.options.baseUrl).toString();
  }

  /**
   * Extrae rutas de enlaces (a[href]) encontrados en el DOM.
   */
  private async extractRoutes(page: Page): Promise<string[]> {
    try {
      return await page.$$eval('a[href]', (anchors) => {
        const routes: string[] = [];
        for (const a of anchors) {
          const href = a.getAttribute('href');
          if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
            routes.push(href);
          }
        }
        return Array.from(new Set(routes));
      });
    } catch {
      return [];
    }
  }

  /**
   * Extrae formularios e inputs presentes en el DOM hidratado.
   */
  private async extractForms(page: Page): Promise<Array<{ id: string; fields: string[] }>> {
    try {
      const forms = await page.$$eval('form', (formList) => {
        return formList.map((form, idx) => {
          const id = form.getAttribute('id') || form.getAttribute('name') || `form-${idx + 1}`;
          const inputs = Array.from(form.querySelectorAll('input, select, textarea'));
          const fields = inputs
            .map((input) => input.getAttribute('name') || input.getAttribute('id') || input.getAttribute('placeholder') || '')
            .filter((field) => field.length > 0);
          return { id, fields: Array.from(new Set(fields)) };
        });
      });

      if (forms.length > 0) return forms;

      // Soporte para SPAs donde los inputs están dentro de divs/containers sin tag <form>
      const standaloneInputs = await page.$$eval('input, select, textarea', (inputs) => {
        return inputs
          .map((input) => input.getAttribute('name') || input.getAttribute('id') || input.getAttribute('placeholder') || '')
          .filter((field) => field.length > 0);
      });

      if (standaloneInputs.length > 0) {
        return [{ id: 'form-default', fields: Array.from(new Set(standaloneInputs)) }];
      }

      return [];
    } catch {
      return [];
    }
  }

  /**
   * Extrae botones interactivos presentes en el DOM hidratado.
   */
  private async extractButtons(page: Page): Promise<string[]> {
    try {
      return await page.$$eval(
        'button, input[type="button"], input[type="submit"], [role="button"]',
        (elements) => {
          const list: string[] = [];
          for (const el of elements) {
            const text = (
              el.textContent ||
              (el as HTMLInputElement).value ||
              el.getAttribute('aria-label') ||
              ''
            ).trim();
            if (text && !list.includes(text)) {
              list.push(text);
            }
          }
          return list;
        }
      );
    } catch {
      return [];
    }
  }
}