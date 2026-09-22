/**
 * Fixture de enriquecimiento opcional para sub-pasos (QAP v3.0 Decisión Canónica 3).
 *
 * Permite instrumentar bloques de prueba con anotaciones estructuradas
 * { type: 'qap:capabilityId', description: id } para trazabilidad granular.
 */

export interface StepAnnotation {
  type: 'qap:capabilityId';
  description: string;
  durationMs: number;
}

declare global {
  var __QAP_STEP_ANNOTATIONS__: StepAnnotation[] | undefined;
}

export async function qapStep<T>(
  capabilityId: string,
  fn: () => Promise<T> | T
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await fn();
    const durationMs = Date.now() - startTime;

    if (!globalThis.__QAP_STEP_ANNOTATIONS__) {
      globalThis.__QAP_STEP_ANNOTATIONS__ = [];
    }
    globalThis.__QAP_STEP_ANNOTATIONS__.push({
      type: 'qap:capabilityId',
      description: capabilityId,
      durationMs,
    });

    return result;
  } catch (error) {
    const durationMs = Date.now() - startTime;
    if (!globalThis.__QAP_STEP_ANNOTATIONS__) {
      globalThis.__QAP_STEP_ANNOTATIONS__ = [];
    }
    globalThis.__QAP_STEP_ANNOTATIONS__.push({
      type: 'qap:capabilityId',
      description: capabilityId,
      durationMs,
    });
    throw error;
  }
}
