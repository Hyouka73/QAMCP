import type { ExecutionResult } from '@qap/shared';

/**
 * Generador de reporte JSON para consumo programático (S5-004).
 *
 * El PDF pide "consumo programático" — la forma más directa y sin ambigüedad
 * es entregar el ExecutionResult ya validado por el schema (S5-001) tal cual,
 * serializado con indentación legible. No se inventa un formato nuevo.
 */
export function generateJsonReport(result: ExecutionResult): string {
  return JSON.stringify(result, null, 2);
}