import type { Page } from 'playwright-core';
import type { TCStep } from '@qap/shared';

/**
 * Captura un valor dinamico de un elemento (texto o valor de input)
 * y lo guarda en el objeto de variables de contexto
 */
export async function executeCapture(
    page: Page,
    step: TCStep,
    contextVariables: Record<string, string>
): Promise<string> {
    if (!step.capture_as) {
        throw new Error(`El paso 'capture' requiere definir la propiedad 'capture_as'.`);
    }

    if (!step.selector) {
        throw new Error(`El paso 'capture' requiere definir la propiedad 'selector'.`);
    }

    const locator = page.locator(step.selector);
    await  locator.waitFor({ state: 'visible'});

    const tagName = await locator.evaluate((el) => el.tagName.toLowerCase());
    let value: string | null = null; 

    if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
        value = await locator.inputValue();
    }else {
        value = await locator.textContent();
    }

    const result = (value ?? '').trim();
    contextVariables[step.capture_as] = result;

    return result;
}