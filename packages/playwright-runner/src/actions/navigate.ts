import type { Page } from 'playwright-core';
import type { TCStep } from '@qap/shared';

/**
 * Navega a la URL indicada en el paso y verifica que la carga haya
 * terminado por completo antes de devolver el control (S7-003).
 *
 * 'load' espera a que el navegador dispare el evento load (recursos,
 * imágenes, CSS incluidos), más estricto que 'domcontentloaded' que
 * solo espera el parseo del HTML.
 */
export async function executeNavigate(page: Page, step: TCStep): Promise<void> {
  if (!step.url) {
    throw new Error(`Paso 'navigate' sin campo 'url' definido.`);
  }

  await page.goto(step.url, { waitUntil: 'load' });
}