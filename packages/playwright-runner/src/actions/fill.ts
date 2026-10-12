import type { Page } from 'playwright-core';
import type { TCStep } from '@qap/shared';

/**
 * Llena un input de texto, esperando a que sea visible y limpiando su
 * contenido previo antes de escribir (S7-003).
 */
export async function executeFill(page: Page, step: TCStep): Promise<void> {
  if (!step.selector) {
    throw new Error(`Paso 'fill' sin campo 'selector' definido.`);
  }
  if (typeof step.value !== 'string') {
    throw new Error(`Paso 'fill' sin campo 'value' definido.`);
  }

  const locator = page.locator(step.selector);
  await locator.waitFor({ state: 'visible' });
  await locator.fill(step.value);
}