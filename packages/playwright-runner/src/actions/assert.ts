import type { Page } from 'playwright-core';
import type { TCStep } from '@qap/shared';

/**
 * Ejecuta aserciones ricas sobre elementos de la página (S7-004).
 * Soporta: visible, not_visible, contains, equals, exists, not_exists, count, attribute.
 */
export async function executeAssert(page: Page, step: TCStep): Promise<void> {
  const assertionType = step.assertion_type ?? 'visible';

  if (!step.selector && assertionType !== 'equals') {
    throw new Error(`Paso 'assert' con tipo '${assertionType}' requiere un 'selector'.`);
  }

  const locator = step.selector ? page.locator(step.selector) : null;
  const timeout = step.timeout ?? 5000;

  switch (assertionType) {
    case 'visible': {
      if (!locator) break;
      await locator.waitFor({ state: 'visible', timeout });
      break;
    }

    case 'not_visible': {
      if (!locator) break;
      await locator.waitFor({ state: 'hidden', timeout });
      break;
    }

    case 'exists': {
      if (!locator) break;
      await locator.waitFor({ state: 'attached', timeout });
      break;
    }

    case 'not_exists': {
      if (!locator) break;
      await locator.waitFor({ state: 'detached', timeout });
      break;
    }

    case 'contains': {
      if (!locator) break;
      await locator.waitFor({ state: 'visible', timeout });
      const text = await locator.textContent();
      const expected = step.expected ?? '';
      if (!text || !text.includes(expected)) {
        throw new Error(
          `Assertion failed: Se esperaba que '${step.selector}' contuviera '${expected}', pero se obtuvo '${text?.trim()}'.`
        );
      }
      break;
    }

    case 'equals': {
      if (locator) {
        await locator.waitFor({ state: 'visible', timeout });
        const text = await locator.textContent();
        const expected = step.expected ?? '';
        if (text?.trim() !== expected.trim()) {
          throw new Error(
            `Assertion failed: Se esperaba que '${step.selector}' fuera igual a '${expected}', pero fue '${text?.trim()}'.`
          );
        }
      } else {
        // Aserción general de valor o URL si no hay selector
        const currentUrl = page.url();
        if (step.expected && !currentUrl.includes(step.expected)) {
          throw new Error(
            `Assertion failed: URL esperada conteniendo '${step.expected}', obtenida '${currentUrl}'.`
          );
        }
      }
      break;
    }

    case 'count': {
      if (!step.selector) break;
      const countLocator = page.locator(step.selector);
      const expectedCount = step.expected_count ?? 0;

      let actualCount = await countLocator.count();
      const deadline = Date.now() + timeout;
      while (actualCount !== expectedCount && Date.now() < deadline) {
        await page.waitForTimeout(100);
        actualCount = await countLocator.count();
      }

      if (actualCount !== expectedCount) {
        throw new Error(
          `Assertion failed: Se esperaban ${expectedCount} elementos para '${step.selector}', se encontraron ${actualCount}.`
        );
      }
      break;
    }

    case 'attribute': {
      if (!locator) break;
      if (!step.attribute_name) {
        throw new Error(`Assertion 'attribute' requiere especificar 'attribute_name'.`);
      }
      await locator.waitFor({ state: 'attached', timeout });

      const actualValue = await locator.getAttribute(step.attribute_name);
      const expectedValue = step.expected ?? '';

      if (actualValue !== expectedValue) {
        throw new Error(
          `Assertion failed: Se esperaba que el atributo '${step.attribute_name}' de '${step.selector}' fuera '${expectedValue}', pero fue '${actualValue}'.`
        );
      }
      break;
    }

        default:
      throw new Error(`Tipo de aserción '${String(assertionType)}' no soportado.`);
  }
}