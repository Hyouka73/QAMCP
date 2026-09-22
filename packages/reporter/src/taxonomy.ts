export type ErrorCategory =
  | 'selector_not_found'
  | 'assertion_failed'
  | 'execution_timeout'
  | 'navigation_error'
  | 'network_error';
  

export interface ClassifiedError {
  category: ErrorCategory;
  message: string;
  originalError?: unknown;
}

/**
 * Clasifica un error o mensaje según la taxonomía formal definida para QAP.
 *
 * IMPORTANTE: el orden de las validaciones (if) es significativo.
 * Algunos mensajes de error pueden coincidir con más de una categoría
 * (ej: un error de navegación puede mencionar "failed"). El orden actual
 * prioriza: selector > navegación > red > timeout > aserción.
 * No reordenar sin revisar que los tests en taxonomy.test.ts sigan pasando.
 */

export function classifyError(error: unknown): ClassifiedError {
  const message = error instanceof Error ? error.message: typeof error === 'string' ? error: JSON.stringify(error ?? '');
  
  // 1. Errores de Selectores
  if (/selector|element not found|locate/i.test(message)) {
    return { category: 'selector_not_found', message, originalError: error };
  }

  // 2. Errores de Navegación
  if (/navig|net::ERR|goto/i.test(message)) {
    return { category: 'navigation_error', message, originalError: error };
  }

  // 3. Errores de Red / HTTP
  if (/network|fetch|http|500|404/i.test(message)) {
    return { category: 'network_error', message, originalError: error };
  }

  // 4. Errores de Timeout (regla exacta para evitar falsos positivos con 'expect')
  if (/timeout|exceeded|timed out/i.test(message)) {
    return { category: 'execution_timeout', message, originalError: error };
  }

  // 5. Errores de Aserción
  // Fallback: si ningún patrón coincide, se clasifica como assertion_failed
  // por decisión de diseño (la taxonomía del PDF no define una categoría "unknown").
  if (/assert|expect|match|failed|received/i.test(message)) {
    return { category: 'assertion_failed', message, originalError: error };
  }

  return { category: 'assertion_failed', message, originalError: error };
}