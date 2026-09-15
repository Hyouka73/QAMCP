import type { Page } from 'playwright-core';
import type { ModuleContext } from '@qap/shared';

export interface ScreenshotOptions {
  /** Ruta donde guardar el archivo. Si se omite, solo se devuelve el buffer en memoria. */
  path?: string;
  /** Si la captura debe cubrir toda la pagina (con scroll) o solo el viewport. Por defecto false. */
  fullPage?: boolean;
  /** Selectores CSS de elementos sensibles (PII) que deben quedar cubiertos en la captura. */
  sensitiveSelectors?: string[];
  /** Color solido usado para cubrir los elementos enmascarados. Por defecto magenta. */
  maskColor?: string;
}

/**
 * Extrae los selectores sensibles definidos en el context.yaml de un modulo.
 * Devuelve un arreglo vacio si el modulo no declaro ninguno.
 */
export function getSensitiveSelectors(context: ModuleContext): string[] {
  return context.sensitive_selectors ?? [];
}

/**
 * Captura una screenshot de la pagina actual, cubriendo con un rectangulo
 * solido cualquier elemento que coincida con los selectores sensibles
 * (PII: contraseñas, tarjetas, datos personales, etc.) antes de guardarla.
 *
 * Usa el soporte nativo de mascaras de playwright-core (opcion `mask`),
 * que dibuja un rectangulo solido sobre cada Locator indicado, sin alterar
 * el DOM real de la pagina.
 */
export async function captureScreenshot(
  page: Page,
  options: ScreenshotOptions = {}
): Promise<Buffer> {
  const selectors = options.sensitiveSelectors ?? [];
  const maskLocators = selectors.map((selector) => page.locator(selector));

  return page.screenshot({
    path: options.path,
    fullPage: options.fullPage ?? false,
    mask: maskLocators.length > 0 ? maskLocators : undefined,
    maskColor: options.maskColor ?? '#FF00FF',
  });
}