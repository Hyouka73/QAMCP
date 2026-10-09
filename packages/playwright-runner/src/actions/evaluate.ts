import type { Page } from 'playwright-core';
import type { TCStep } from '@qap/shared';

/***
 * Ejecuta una expresion JavaScript sandboxed en el contexto de la página.
 */
export async function executeEvaluate(
    page: Page,
    step: TCStep,
    contextVariables?: Record<string, string>
): Promise<unknown> {
    if (!step.expression) {
        throw new Error(`El paso 'evaluate' requiere definir la propiedad 'expression'.`);
    }

    const result = await page.evaluate(
    ({ expr, vars }) => {
      const fn = new Function('ctx', `return (${expr});`);
      return fn(vars || {});
    },
    { expr: step.expression, vars: contextVariables }
  );

  if (step.capture_as && contextVariables) {
    contextVariables[step.capture_as] = String(result ?? '');
  }

  return result;
}