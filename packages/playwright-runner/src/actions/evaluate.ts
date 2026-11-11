import type { Page, Route } from 'playwright-core';
import type { TCStep } from '@qap/shared';

export interface EvaluateOptions {
  sandbox?: boolean;
  args?: Record<string, unknown>;
}

/**
 * Ejecuta una expresión JavaScript en el contexto de la página con sandbox de red y paso de args (S82-002).
 */
export async function executeEvaluate(
  page: Page,
  step: TCStep,
  contextVariables: Record<string, string> = {},
  options: EvaluateOptions = { sandbox: true }
): Promise<unknown> {
  const stepRecord = step as unknown as Record<string, unknown>;
  const stepArgs = stepRecord.args as Record<string, string> | undefined;
  
  const expression = (stepRecord.expression as string) || stepArgs?.expression;
  if (!expression) {
    throw new Error(`El paso 'evaluate' requiere definir la propiedad 'expression'.`);
  }

  const isSandbox = options.sandbox !== false;
  let routeHandler: ((route: Route) => void) | undefined;

  if (isSandbox) {
    routeHandler = (route: Route) => { void route.abort(); };
    await page.route('**/*', routeHandler);
  }

  try {
    const combinedVars = {
      ...contextVariables,
      ...(options.args || {}),
      ...(stepArgs || {}),
    };

       const result: unknown = await page.evaluate(
      ({ expr, vars }) => {
        // Se ejecuta dentro del navegador (page.evaluate), no en Node.
        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        const fn = new Function('ctx', `return (${expr});`) as (
          ctx: Record<string, unknown>
        ) => unknown;
        return fn(vars || {});
      },
      { expr: expression, vars: combinedVars }
    );

    if (stepRecord.capture_as) {
    contextVariables[stepRecord.capture_as as string] =
      typeof result === 'string'
        ? result
        : result === undefined || result === null
          ? ''
          : JSON.stringify(result);
    }

    return result;
  } finally {
    if (isSandbox && routeHandler) {
      await page.unroute('**/*', routeHandler);
    }
  }
}