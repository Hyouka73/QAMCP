import type { Page } from 'playwright-core';
import type { TCStep } from '@qap/shared';

/**
 * Hace clic en el selector indicado, con auto-scroll previo al elemento
 * (S7-003). Playwright hace scroll automáticamente antes de accionar,
 * pero lo forzamos explícitamente para dar un error más claro si el
 * elemento nunca llega a estar en el viewport.
 */
export async function executeClick(page: Page, step: TCStep): Promise<void> {
  if (!step.selector) {
    throw new Error(`Paso 'click' sin campo 'selector' definido.`);
  }

  const locator = page.locator(step.selector);
  await locator.scrollIntoViewIfNeeded();
  await locator.click();
}