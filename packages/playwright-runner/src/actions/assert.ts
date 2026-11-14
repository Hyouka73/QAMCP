import type { Page } from 'playwright-core';
import type { TCStep } from '@qap/shared';

export interface AssertObservation {
  expected: string | null;
  observed: string | null;
}

function createAssertionError(
  message: string,
  expected: string | null,
  observed: string | null,
): Error & AssertObservation {
  const err = new Error(message) as Error & AssertObservation;
  err.expected = expected;
  err.observed = observed;
  return err;
}

/**
 * Ejecuta aserciones ricas sobre elementos de la página (S7-004).
 * Soporta: visible, not_visible, contains, equals, exists, not_exists, count, attribute.
 */
export async function executeAssert(page: Page, step: TCStep): Promise<AssertObservation> {
  const assertionType = step.assertion_type ?? 'visible';

  if (!step.selector && assertionType !== 'equals') {
    throw createAssertionError(
      `Paso 'assert' con tipo '${assertionType}' requiere un 'selector'.`,
      assertionType,
      'missing_selector',
    );
  }

  const locator = step.selector ? page.locator(step.selector) : null;
  const timeout = step.timeout ?? 5000;

  switch (assertionType) {
    case 'visible': {
      if (!locator) return { expected: 'visible', observed: 'visible' };
      try {
        await locator.waitFor({ state: 'visible', timeout });
        return { expected: 'visible', observed: 'visible' };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        throw createAssertionError(msg, 'visible', 'not_visible_or_missing');
      }
    }

    case 'not_visible': {
      if (!locator) return { expected: 'not_visible', observed: 'not_visible' };
      try {
        await locator.waitFor({ state: 'hidden', timeout });
        return { expected: 'not_visible', observed: 'not_visible' };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        throw createAssertionError(msg, 'not_visible', 'visible');
      }
    }

    case 'exists': {
      if (!locator) return { expected: 'exists', observed: 'exists' };
      try {
        await locator.waitFor({ state: 'attached', timeout });
        return { expected: 'exists', observed: 'exists' };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        throw createAssertionError(msg, 'exists', 'not_exists');
      }
    }

    case 'not_exists': {
      if (!locator) return { expected: 'not_exists', observed: 'not_exists' };
      try {
        await locator.waitFor({ state: 'detached', timeout });
        return { expected: 'not_exists', observed: 'not_exists' };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        throw createAssertionError(msg, 'not_exists', 'exists');
      }
    }

    case 'contains': {
      const expected = step.expected ?? '';
      if (!locator) return { expected, observed: expected };
      await locator.waitFor({ state: 'visible', timeout });
      const text = await locator.textContent();
      const observed = text?.trim() ?? '';
      if (!text || !text.includes(expected)) {
        throw createAssertionError(
          `Assertion failed: Se esperaba que '${step.selector}' contuviera '${expected}', pero se obtuvo '${observed}'.`,
          expected,
          observed,
        );
      }
      return { expected, observed };
    }

    case 'equals': {
      const expected = step.expected ?? '';
      if (locator) {
        await locator.waitFor({ state: 'visible', timeout });
        const text = await locator.textContent();
        const observed = text?.trim() ?? '';
        if (observed !== expected.trim()) {
          throw createAssertionError(
            `Assertion failed: Se esperaba que '${step.selector}' fuera igual a '${expected}', pero fue '${observed}'.`,
            expected,
            observed,
          );
        }
        return { expected, observed };
      } else {
        // Aserción general de valor o URL si no hay selector
        const currentUrl = page.url();
        if (step.expected && !currentUrl.includes(step.expected)) {
          throw createAssertionError(
            `Assertion failed: URL esperada conteniendo '${step.expected}', obtenida '${currentUrl}'.`,
            expected,
            currentUrl,
          );
        }
        return { expected, observed: currentUrl };
      }
    }

    case 'count': {
      const expectedCount = step.expected_count ?? 0;
      if (!step.selector) return { expected: String(expectedCount), observed: String(expectedCount) };
      const countLocator = page.locator(step.selector);

      let actualCount = await countLocator.count();
      const deadline = Date.now() + timeout;
      while (actualCount !== expectedCount && Date.now() < deadline) {
        await page.waitForTimeout(100);
        actualCount = await countLocator.count();
      }

      if (actualCount !== expectedCount) {
        throw createAssertionError(
          `Assertion failed: Se esperaban ${expectedCount} elementos para '${step.selector}', se encontraron ${actualCount}.`,
          String(expectedCount),
          String(actualCount),
        );
      }
      return { expected: String(expectedCount), observed: String(actualCount) };
    }

    case 'attribute': {
      const expectedValue = step.expected ?? '';
      if (!locator) return { expected: expectedValue, observed: expectedValue };
      if (!step.attribute_name) {
        throw createAssertionError(
          `Assertion 'attribute' requiere especificar 'attribute_name'.`,
          expectedValue,
          'missing_attribute_name',
        );
      }
      await locator.waitFor({ state: 'attached', timeout });

      const actualValue = await locator.getAttribute(step.attribute_name);

      if (actualValue !== expectedValue) {
        throw createAssertionError(
          `Assertion failed: Se esperaba que el atributo '${step.attribute_name}' de '${step.selector}' fuera '${expectedValue}', pero fue '${actualValue}'.`,
          expectedValue,
          actualValue ?? null,
        );
      }
      return { expected: expectedValue, observed: actualValue ?? '' };
    }

    default:
      throw createAssertionError(
        `Tipo de aserción '${String(assertionType)}' no soportado.`,
        String(assertionType),
        'unsupported_assertion_type',
      );
  }
}