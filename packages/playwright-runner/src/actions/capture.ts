import type { Page } from 'playwright-core';
import type { TCStep } from '@qap/shared';


interface CaptureOptions {
  caseId?: string;
  context_data?: Record<string, unknown> & {
    _capturedBuffer?: Record<string, Record<string, string>>;
  };
}

/**
 * Captura un valor dinámico de un elemento (texto o valor de input)
 * y lo registra tanto en el buffer en memoria como en las variables de contexto (S82-002).
 */
export async function executeCapture(
  page: Page,
  step: TCStep,
  contextVariables: Record<string, string> = {},
  options?: CaptureOptions
): Promise<string> {
  if (!step.capture_as) {
    throw new Error(`El paso 'capture' requiere definir la propiedad 'capture_as'.`);
  }

  const selector = step.selector || step.target;
  if (!selector) {
    throw new Error(`El paso 'capture' requiere definir la propiedad 'selector' o 'target'.`);
  }

  const locator = page.locator(selector);
  await locator.waitFor({ state: 'visible' });

  const tagName = await locator.evaluate((el) => el.tagName.toLowerCase());
  let value: string | null;

  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    value = await locator.inputValue();
  } else {
    value = await locator.textContent();
  }

  const result = (value ?? '').trim();

  // 1. Guardar en variables locales del contexto
  contextVariables[step.capture_as] = result;

  // 2. Guardar en el buffer en memoria si se proporciona caseId y context_data
    const ctxData = options?.context_data;
  if (ctxData) {
    const buffer = (ctxData._capturedBuffer ??= {});
    const cId = options?.caseId ?? 'default_case';
    const caseBuffer = (buffer[cId] ??= {});
    caseBuffer[step.capture_as] = result;
  }

  return result;
}