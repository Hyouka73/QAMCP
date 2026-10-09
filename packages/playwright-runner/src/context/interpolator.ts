import type { TCStep } from '@qap/shared';

const INTERPOLATION_PATTERN = /\$\{ctx\.([a-zA-Z_][a-zA-Z0-9_]*)\}/g;

/**
 * Motor de sustitución de variables de contexto (S7-006).
 *
 * Reemplaza toda ocurrencia de ${ctx.variable} dentro de un string por su
 * valor real en contextVariables. Si la variable referenciada no existe,
 * falla con un mensaje claro en vez de inyectar "undefined" como texto
 * literal (sanitización: ningún placeholder sin resolver llega a Playwright).
 */
export function interpolate(value: string, contextVariables: Record<string, string>): string {
  return value.replace(INTERPOLATION_PATTERN, (_match, variableName: string) => {
    if (!(variableName in contextVariables)) {
      throw new Error(
        `Variable de contexto '${variableName}' no definida. Antes de usar \${ctx.${variableName}}, ` +
          `captúrala con un paso 'capture' o 'evaluate' usando capture_as: '${variableName}'.`
      );
    }
    return contextVariables[variableName];
  });
}

/**
 * Campos de un TCStep sobre los que aplica la interpolación ${ctx.*}.
 *
 * 'expression' (usado por el paso 'evaluate') queda fuera a propósito:
 * ya recibe el objeto de variables como 'ctx' directamente en su función
 * sandboxed (ver actions/evaluate.ts), lo cual es más seguro que una
 * sustitución de texto plano dentro de código JavaScript.
 */
const INTERPOLATABLE_FIELDS = [
  'selector',
  'value',
  'url',
  'expected',
  'filename',
  'auth_profile',
  'attribute_name',
] as const satisfies readonly (keyof TCStep)[];

/**
 * Devuelve una copia del step con sus campos de texto interpolados contra
 * contextVariables. No modifica el step original.
 */
export function interpolateStep(step: TCStep, contextVariables: Record<string, string>): TCStep {
  const result: TCStep = { ...step };

  for (const field of INTERPOLATABLE_FIELDS) {
    const rawValue = result[field];
    if (typeof rawValue === 'string') {
      (result[field] as string) = interpolate(rawValue, contextVariables);
    }
  }

  return result;
}