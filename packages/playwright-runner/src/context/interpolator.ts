import type { TCStep } from '@qap/shared';

const INTERPOLATION_PATTERN = /\$\{(ctx|flow)\.([a-zA-Z_][a-zA-Z0-9_]*)\}/g;

/**
 * Motor de sustitución de variables de contexto y flujo (S75-006B).
 * Soporta ${ctx.variable} y${flow.variable}.
 */
export function interpolate(
  value: string,
  contextVariables: Record<string, string>,
  flowVariables: Record<string, string> = {}
): string {
  return value.replace(INTERPOLATION_PATTERN, (_match, prefix: string, variableName: string) => {
    const targetMap = prefix === 'flow' ? flowVariables : contextVariables;
    
    if (!(variableName in targetMap)) {
      throw new Error(
        `Variable de ${prefix} '${variableName}' no definida. Antes de usar \${${prefix}.${variableName}}, ` +
        `captúrala o asegúrate de que esté provista en options.context_data.`
      );
    }
    return targetMap[variableName];
  });
}

const INTERPOLATABLE_FIELDS = [
  'selector',
  'value',
  'url',
  'expected',
  'filename',
  'auth_profile',
  'attribute_name',
] as const satisfies readonly (keyof TCStep)[];

export function interpolateStep(
  step: TCStep,
  contextVariables: Record<string, string>,
  flowVariables: Record<string, string> = {}
): TCStep {
  const result: TCStep = { ...step };

  for (const field of INTERPOLATABLE_FIELDS) {
    const rawValue = result[field];
    if (typeof rawValue === 'string') {
      (result[field] as string) = interpolate(rawValue, contextVariables, flowVariables);
    }
  }

  return result;
}