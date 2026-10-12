import type { Page } from 'playwright-core';
import type { TCStep } from '@qap/shared';

/**
 * Esperas explícitas por elemento, estado o tiempo (S7-004).
 */
export async function executeWaitFor(page: Page, step: TCStep): Promise<void> {
  const timeout = step.timeout ?? 5000;

  if (step.selector) {
    // Si hay selector, espera a que esté visible/presente
    await page.waitForSelector(step.selector, {
      state: 'visible',
      timeout,
    });
  } else if (step.timeout) {
    // Si solo hay timeout, realiza una espera fija en tiempo
    await page.waitForTimeout(step.timeout);
  } else {
    throw new Error(`Paso 'waitFor' requiere especificar 'selector' o 'timeout'.`);
  }
}