import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

import { chromium, type Browser, type BrowserContext, type Page } from 'playwright-core';
import type { IDiscoverer } from '@qap/engine';
import type { ModuleSpec, Module } from '@qap/shared';

export interface AuthCredentials {
  username: string;
  password: string;
}

export interface PlaywrightAdapterOptions {
  /** Si el navegador corre sin interfaz visible. Por defecto true. */
  headless?: boolean;
  /** Si el navegador corre con interfaz visible. Alias complementario de headless. */
  headed?: boolean;
  /** URL base contra la cual se resuelven las rutas relativas de los modulos. */
  baseUrl?: string;
  /** Ruta al archivo storageState para restaurar o guardar sesiones persistentes */
  sessionPath?: string;
  /** Credenciales explícitas para autenticarse si la pantalla es de login */
  credentials?: AuthCredentials;
}

export interface LaunchBrowserOptions {
  /** Si es true, inicia el navegador con ventana visible. Por defecto false (headless). */
  headed?: boolean;
}

export interface DiscoveredInput {
  key: string;
  selector: string;
  /** Tipo HTML: text, password, email, tel, number, date, etc. */
  type: string;
  /** Placeholder sanitizado (truncado, sin valores de password). DATO NO CONFIABLE. */
  placeholder: string | null;
  /** Atributo name del input */
  name?: string;
  /** Atributo id del input */
  id?: string;
  /** Etiqueta sanitizada: label / aria-label / placeholder (truncada a 60 chars). DATO NO CONFIABLE. */
  label?: string;
  /** Valor del atributo autocomplete */
  autocomplete?: string;
  /** Si el campo es requerido en el DOM */
  required?: boolean;
  /** Longitud mínima (minlength) */
  minlength?: number;
  /** Longitud máxima (maxlength) */
  maxlength?: number;
  /** Patrón de validación HTML (truncado a 120 chars) */
  pattern?: string;
  /** Mínimo numérico o de fecha */
  min?: string;
  /** Máximo numérico o de fecha */
  max?: string;
  /** Si el campo es hidden */
  hidden?: boolean;
  /** Si el campo es disabled */
  disabled?: boolean;
  /** ID del formulario al que pertenece */
  formId?: string;
}

export interface DiscoveredButton {
  key: string;
  text: string;
  selector: string;
}

export interface DiscoveredLink {
  key: string;
  text: string;
  href: string;
  selector: string;
}

export interface DiscoveredForm {
  id: string;
  selector: string;
  inputs: DiscoveredInput[];
  fields: string[];
  /** Selector del botón de envío del formulario */
  submitSelector?: string;
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

        throw new Error(detail, { cause: defaultErr });
      }
    }
  }
}

/**
 * Adaptador de descubrimiento Playwright con soporte para SPAs (React / Vite).
 * Implementa IDiscoverer navegando directamente con playwright-core,
 * gestionando persistencia de sesión con storageState, detección de login,
 * ejecución de login automático y extracción de selectores CSS reales.
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

    let browser: Browser;
    let context: BrowserContext | null = null;

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
          inputs: [],
          buttons: [],
          links: [],
          is_auth_view: false,
          session_saved: false,
          storage_state_used: false,
          playwright_used: false,
          playwright_error: playwrightError,
        },
      };
    }

    try {
      // 1. Inicializar contexto con storageState si existe sesión previa
      const contextOptions: { storageState?: string } = {};
      if (this.options.sessionPath && existsSync(this.options.sessionPath)) {
        contextOptions.storageState = this.options.sessionPath;
      }
      context = await browser.newContext(contextOptions);
      const page = await context.newPage();
      const targetUrl = this.resolveUrl(spec.path);

      await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
      // Esperar a que React monte componentes en el root o DOM
      await page.waitForSelector('#root > *, main, form, input, button, a[href]', { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(1000); // margen para renderizado y transiciones

      // 2. Detección de vista de autenticación/login
      const currentUrl = page.url();
      const hasPasswordField = (await page.$('input[type="password"]')) !== null;
      const initialIsAuthView = Boolean(
        spec.path.toLowerCase().includes('/login') ||
        currentUrl.toLowerCase().includes('/login') ||
        hasPasswordField
      );

      // 3. Acción de login y guardado de sesión si se proveen credenciales
      let sessionSaved = false;
      if (initialIsAuthView && this.options.credentials) {
        const { username, password } = this.options.credentials;
        const usernameInput = await page.$(
          'input[type="email"], input[name*="user" i], input[name*="email" i], input[name*="login" i], input[id*="user" i], input[id*="email" i], input:not([type="password"]):not([type="submit"]):not([type="hidden"]):not([type="checkbox"])'
        );
        const passwordInput = await page.$('input[type="password"]');

        if (usernameInput && passwordInput) {
          await usernameInput.fill(username);
          await passwordInput.fill(password);

          const submitButton = await page.$(
            'button[type="submit"], input[type="submit"], form button, button:has-text("Iniciar"), button:has-text("Login"), button:has-text("Entrar"), button:has-text("Acceder"), [role="button"]:has-text("Iniciar")'
          );

          const navPromise = page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
          if (submitButton) {
            await submitButton.click();
          } else {
            await passwordInput.press('Enter');
          }
          await navPromise;
          await page.waitForTimeout(1500);

          // Guardar storageState en disco
          if (this.options.sessionPath) {
            const sessionDir = dirname(this.options.sessionPath);
            if (!existsSync(sessionDir)) {
              mkdirSync(sessionDir, { recursive: true });
            }
            await context.storageState({ path: this.options.sessionPath });
            sessionSaved = true;
          }
        }
      }

      const finalUrl = page.url();
      const finalHasPasswordField = (await page.$('input[type="password"]')) !== null;
      const finalIsAuthView = sessionSaved
        ? Boolean(finalUrl.toLowerCase().includes('/login') || finalHasPasswordField)
        : initialIsAuthView;

      const title = await page.title();
      const description = title && title.trim() ? title.trim() : spec.name;

      const links = await this.extractLinks(page);
      const discoveredRoutes = Array.from(new Set(links.map((l) => l.href)));
      const forms = await this.extractForms(page);
      const inputs = forms.flatMap((f) => f.inputs);
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
          inputs,
          buttons,
          links,
          is_auth_view: finalIsAuthView,
          session_saved: sessionSaved,
          storage_state_used: Boolean(contextOptions.storageState),
          current_url: finalUrl,
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
          inputs: [],
          buttons: [],
          links: [],
          is_auth_view: false,
          session_saved: false,
          storage_state_used: false,
          playwright_used: false,
          playwright_error: playwrightError,
        },
      };
    } finally {
      if (context) {
        await context.close().catch(() => {});
      }
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
   * Extrae enlaces (a[href]) y determina su selector CSS real:
   * a:has-text("${texto}") o a[href="${href}"]
   */
  private async extractLinks(page: Page): Promise<DiscoveredLink[]> {
    try {
      return await page.$$eval('a[href]', (anchors) => {
        const list: Array<{ key: string; text: string; href: string; selector: string }> = [];
        const seen = new Set<string>();

        anchors.forEach((a, idx) => {
          const href = a.getAttribute('href') || '';
          if (!href || href.startsWith('#') || href.startsWith('javascript:')) {
            return;
          }

          const rawText = (a.textContent || a.getAttribute('aria-label') || '').trim();
          const text = rawText.replace(/\s+/g, ' ');

          // Prioridad de selector: a:has-text("${texto}") o a[href="${href}"]
          let selector: string;
          if (text) {
            selector = `a:has-text("${text.replace(/"/g, '\\"')}")`;
          } else {
            selector = `a[href="${href.replace(/"/g, '\\"')}"]`;
          }

          let key = text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9_-]+/gi, '_')
            .replace(/^_+|_+$/g, '');

          if (!key) {
            key = href.replace(/[^a-z0-9_-]+/gi, '_').replace(/^_+|_+$/g, '') || `link-${idx + 1}`;
          }

          if (!seen.has(selector)) {
            seen.add(selector);
            list.push({ key, text, href, selector });
          }
        });

        return list;
      });
    } catch {
      return [];
    }
  }

  /**
   * Extrae formularios e inputs con selectores CSS robustos.
   * Prioridad de selector para inputs:
   * 1. Si tiene id: #${el.id}
   * 2. Si tiene name: ${tag}[name="${el.name}"]
   * 3. Si tiene data-testid: [data-testid="${el.dataset.testid}"]
   * 4. Si tiene type: input[type="${el.type}"]
   * PROHIBIDO: Guardar el.value o valores enmascarados de password (••••••••).
   */
  private async extractForms(page: Page): Promise<DiscoveredForm[]> {
    try {
      const forms = await page.$$eval('form', (formList) => {
        /** Sanitiza cadenas del DOM: sin ctrl, sin html, truncado a 60 chars. DATO NO CONFIABLE */
        function sanitizeDom(raw: string | null | undefined): string | undefined {
          if (!raw) return undefined;
          // eslint-disable-next-line no-control-regex
          const s = raw.replace(/[\r\n\t\x00-\x1F\x7F]/g, ' ').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 60);
          return s || undefined;
        }

        return formList.map((form, formIdx) => {
          const formId = form.getAttribute('id') || form.getAttribute('name') || `form-${formIdx + 1}`;
          const formSelector = form.id
            ? `#${form.id}`
            : form.getAttribute('name')
            ? `form[name="${form.getAttribute('name')}"]`
            : `form:nth-of-type(${formIdx + 1})`;

          // Selector del botón de envío del formulario
          const submitBtn = form.querySelector('button[type="submit"], input[type="submit"], button:not([type])');
          let submitSelector: string | undefined;
          if (submitBtn) {
            const sbId = (submitBtn as HTMLElement).id;
            const sbText = sanitizeDom(submitBtn.textContent);
            if (sbId) submitSelector = `#${sbId}`;
            else if (sbText) submitSelector = `button:has-text("${sbText.replace(/"/g, '\\"')}")`;
            else submitSelector = 'button[type="submit"]';
          }

          const rawInputs = Array.from(form.querySelectorAll('input, select, textarea'));
          const inputs = rawInputs.map((el, idx) => {
            const tag = el.tagName.toLowerCase();
            const elId = el.id ? el.id.trim() : '';
            const elName = el.getAttribute('name') ? el.getAttribute('name')!.trim() : '';
            const testId = (el.getAttribute('data-testid') || (el as HTMLElement).dataset?.testid || '').trim();
            const rawType = (
              el.getAttribute('type') ||
              (tag === 'textarea' ? 'textarea' : tag === 'select' ? 'select' : 'text')
            ).trim().toLowerCase();

            // PROHIBIDO: extraer el.value o contenido de password
            const isPasswordType = rawType === 'password';

            // Selector por prioridad: id -> name -> data-testid -> type
            let selector: string;
            if (elId) selector = `#${elId}`;
            else if (elName) selector = `${tag}[name="${elName}"]`;
            else if (testId) selector = `[data-testid="${testId}"]`;
            else if (rawType && tag === 'input') selector = `input[type="${rawType}"]`;
            else selector = tag;

            // Placeholder sanitizado — NUNCA para passwords
            const rawPlaceholder = el.getAttribute('placeholder');
            let placeholder: string | null = null;
            if (rawPlaceholder && !isPasswordType) {
              const trimmed = rawPlaceholder.trim();
              const isMasked = /^[\u2022\u25cf*.\s]+$/.test(trimmed) || trimmed.includes('•');
              if (!isMasked && trimmed.length > 0) {
                placeholder = trimmed.replace(/[\r\n\t]/g, ' ').slice(0, 60);
              }
            }

            // Etiqueta: aria-label -> label[for=id] -> placeholder (no para passwords)
            let label: string | undefined;
            if (!isPasswordType) {
              const ariaLabel = sanitizeDom(el.getAttribute('aria-label'));
              let associatedLabel: string | undefined;
              if (elId) {
                const labelEl = form.querySelector(`label[for="${elId}"]`);
                if (labelEl) associatedLabel = sanitizeDom(labelEl.textContent);
              }
              label = ariaLabel || associatedLabel || (placeholder ? sanitizeDom(placeholder) : undefined);
            }

            // Atributos de validación
            const required = el.hasAttribute('required');
            const minlengthRaw = el.getAttribute('minlength');
            const maxlengthRaw = el.getAttribute('maxlength');
            const minlength = minlengthRaw !== null ? parseInt(minlengthRaw, 10) : undefined;
            const maxlength = maxlengthRaw !== null ? parseInt(maxlengthRaw, 10) : undefined;
            const pattern = !isPasswordType ? (el.getAttribute('pattern')?.slice(0, 120) || undefined) : undefined;
            const minVal = el.getAttribute('min') || undefined;
            const maxVal = el.getAttribute('max') || undefined;
            const autocomplete = !isPasswordType ? (el.getAttribute('autocomplete') || undefined) : undefined;
            const hidden = rawType === 'hidden';
            const disabled = (el as HTMLInputElement).disabled;

            // Key lógica
            let key = elName || elId || testId;
            if (!key && placeholder) {
              key = placeholder.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9_-]+/gi, '_').replace(/^_+|_+$/g, '');
            }
            if (!key) key = rawType ? `${rawType}-${idx + 1}` : `${tag}-${idx + 1}`;

            return {
              key, selector, type: rawType, placeholder,
              name: elName || undefined,
              id: elId || undefined,
              label,
              autocomplete,
              required: required || undefined,
              minlength: (minlength !== undefined && !isNaN(minlength)) ? minlength : undefined,
              maxlength: (maxlength !== undefined && !isNaN(maxlength)) ? maxlength : undefined,
              pattern,
              min: minVal,
              max: maxVal,
              hidden: hidden || undefined,
              disabled: disabled || undefined,
              formId,
            };
          });

          return {
            id: formId,
            selector: formSelector,
            inputs,
            fields: inputs.map((inp) => inp.selector),
            submitSelector,
          };
        });
      });



      // Extraer inputs huérfanos fuera de tags <form> (comunes en React / SPAs)
      const standaloneInputs = await page.$$eval(
        'input:not(form input), select:not(form select), textarea:not(form textarea)',
        (elements) => {
          function sanitizeDom(raw: string | null | undefined): string | undefined {
            if (!raw) return undefined;
            // eslint-disable-next-line no-control-regex
            const s = raw.replace(/[\r\n\t\x00-\x1F\x7F]/g, ' ').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 60);
            return s || undefined;
          }

          return elements.map((el, idx) => {
            const tag = el.tagName.toLowerCase();
            const elId = el.id ? el.id.trim() : '';
            const elName = el.getAttribute('name') ? el.getAttribute('name')!.trim() : '';
            const testId = (el.getAttribute('data-testid') || (el as HTMLElement).dataset?.testid || '').trim();
            const rawType = (
              el.getAttribute('type') ||
              (tag === 'textarea' ? 'textarea' : tag === 'select' ? 'select' : 'text')
            ).trim().toLowerCase();

            // PROHIBIDO: extraer el.value o contenido de password
            const isPasswordType = rawType === 'password';

            let selector: string;
            if (elId) selector = `#${elId}`;
            else if (elName) selector = `${tag}[name="${elName}"]`;
            else if (testId) selector = `[data-testid="${testId}"]`;
            else if (rawType && tag === 'input') selector = `input[type="${rawType}"]`;
            else selector = tag;

            const rawPlaceholder = el.getAttribute('placeholder');
            let placeholder: string | null = null;
            if (rawPlaceholder && !isPasswordType) {
              const trimmed = rawPlaceholder.trim();
              const isMasked = /^[\u2022\u25cf*.\s]+$/.test(trimmed) || trimmed.includes('•');
              if (!isMasked && trimmed.length > 0) {
                placeholder = trimmed.replace(/[\r\n\t]/g, ' ').slice(0, 60);
              }
            }

            let label: string | undefined;
            if (!isPasswordType) {
              const ariaLabel = sanitizeDom(el.getAttribute('aria-label'));
              let associatedLabel: string | undefined;
              if (elId) {
                const labelEl = document.querySelector(`label[for="${elId}"]`);
                if (labelEl) associatedLabel = sanitizeDom(labelEl.textContent);
              }
              label = ariaLabel || associatedLabel || (placeholder ? sanitizeDom(placeholder) : undefined);
            }

            const required = el.hasAttribute('required');
            const minlengthRaw = el.getAttribute('minlength');
            const maxlengthRaw = el.getAttribute('maxlength');
            const minlength = minlengthRaw !== null ? parseInt(minlengthRaw, 10) : undefined;
            const maxlength = maxlengthRaw !== null ? parseInt(maxlengthRaw, 10) : undefined;
            const pattern = !isPasswordType ? (el.getAttribute('pattern')?.slice(0, 120) || undefined) : undefined;
            const minVal = el.getAttribute('min') || undefined;
            const maxVal = el.getAttribute('max') || undefined;
            const autocomplete = !isPasswordType ? (el.getAttribute('autocomplete') || undefined) : undefined;
            const hidden = rawType === 'hidden';
            const disabled = (el as HTMLInputElement).disabled;

            let key = elName || elId || testId;
            if (!key && placeholder) {
              key = placeholder.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9_-]+/gi, '_').replace(/^_+|_+$/g, '');
            }
            if (!key) key = rawType ? `${rawType}-${idx + 1}` : `${tag}-${idx + 1}`;

            return {
              key,
              selector,
              type: rawType,
              placeholder,
              name: elName || undefined,
              id: elId || undefined,
              label,
              autocomplete,
              required: required || undefined,
              minlength: (minlength !== undefined && !isNaN(minlength)) ? minlength : undefined,
              maxlength: (maxlength !== undefined && !isNaN(maxlength)) ? maxlength : undefined,
              pattern,
              min: minVal,
              max: maxVal,
              hidden: hidden || undefined,
              disabled: disabled || undefined,
              formId: 'standalone',
            };
          });
        }
      );

      if (standaloneInputs.length > 0) {
        forms.push({
          id: forms.length === 0 ? 'form-default' : 'form-standalone',
          selector: 'body',
          inputs: standaloneInputs,
          fields: standaloneInputs.map((inp) => inp.selector),
          submitSelector: undefined,
        });
      }

      return forms;
    } catch {
      return [];
    }
  }

  /**
   * Extrae botones interactivos generando selectores CSS reales.
   * Prioridad de selector:
   * id → data-testid → button:has-text("${texto}") → button[type="submit"]
   */
  private async extractButtons(page: Page): Promise<DiscoveredButton[]> {
    try {
      return await page.$$eval(
        'button, input[type="button"], input[type="submit"], [role="button"]',
        (elements) => {
          const list: Array<{ key: string; text: string; selector: string }> = [];
          const seen = new Set<string>();

          elements.forEach((el, idx) => {
            const tag = el.tagName.toLowerCase();
            const id = el.id ? el.id.trim() : '';
            const testId = (el.getAttribute('data-testid') || (el as HTMLElement).dataset?.testid || '').trim();
            const type = (el.getAttribute('type') || '').trim().toLowerCase();

            let text: string;
            if (tag === 'input') {
              text = ((el as HTMLInputElement).value || el.getAttribute('aria-label') || '').trim();
            } else {
              text = (el.textContent || el.getAttribute('aria-label') || '').trim();
            }
            text = text.replace(/\s+/g, ' ');

            // Prioridad: id → data-testid → button:has-text("${texto}") → button[type="submit"]
            let selector: string;
            if (id) {
              selector = `#${id}`;
            } else if (testId) {
              selector = `[data-testid="${testId}"]`;
            } else if (text) {
              const escapedText = text.replace(/"/g, '\\"');
              if (tag === 'button') {
                selector = `button:has-text("${escapedText}")`;
              } else if (tag === 'input') {
                selector = `input[type="${type || 'submit'}"]`;
              } else {
                selector = `[role="button"]:has-text("${escapedText}")`;
              }
            } else if (type === 'submit') {
              selector = tag === 'input' ? 'input[type="submit"]' : 'button[type="submit"]';
            } else {
              selector = tag === 'button' ? 'button' : `[role="button"]`;
            }

            let key = id || testId || (el.getAttribute('name') ? el.getAttribute('name')!.trim() : '');
            if (!key && text) {
              key = text
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9_-]+/gi, '_')
                .replace(/^_+|_+$/g, '');
            }
            if (!key) {
              key = type === 'submit' ? 'submit' : `button-${idx + 1}`;
            }

            if (!seen.has(selector)) {
              seen.add(selector);
              list.push({ key, text, selector });
            }
          });

          return list;
        }
      );
    } catch {
      return [];
    }
  }
}