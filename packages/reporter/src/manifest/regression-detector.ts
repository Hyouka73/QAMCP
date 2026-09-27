import type { IStorage } from '@qap/engine';
import type { ExecutionResult, ExecutedCase } from '@qap/shared';

const MANIFEST_PATH = '.qa/cache/manifest.json';

export interface ManifestEntry {
  execution_id: string;
  recorded_at: string;
}

export type RegressionManifest = Record<string, ManifestEntry>;

export interface RegressionComparison {
  /** Casos que antes pasaban y ahora fallan. */
  newFailures: ExecutedCase[];
  /** Casos que antes fallaban y ahora pasan. */
  fixedFailures: ExecutedCase[];
  /** execution_id de la ejecución usada como línea base, si existía. */
  baselineExecutionId: string | null;
}

async function readManifest(storage: IStorage): Promise<RegressionManifest> {
  const exists = await storage.exists(MANIFEST_PATH);
  if (!exists) return {};
  try {
    return await storage.readJson<RegressionManifest>(MANIFEST_PATH);
  } catch {
    return {};
  }
}

async function writeManifest(storage: IStorage, manifest: RegressionManifest): Promise<void> {
  await storage.writeJson(MANIFEST_PATH, manifest);
}

function indexCasesById(cases: ExecutedCase[]): Map<string, ExecutedCase> {
  return new Map(cases.map((c) => [c.id, c]));
}

/**
 * Determina si una ejecución "cuenta" como línea base válida para el manifest.
 *
 * IMPORTANTE (decisión de diseño, S5-005): "exitosa" aquí significa que la
 * ejecución CORRIÓ Y TERMINÓ (el harness completó su trabajo), no que todos
 * los casos hayan pasado. Una ejecución con casos en 'failed' o 'partial'
 * sigue siendo una línea base válida.
 *
 * Se excluyen como línea base:
 * - result === 'error'   → la ejecución no llegó a completarse (crash de infraestructura)
 * - timed_out === true   → la ejecución se cortó por timeout, datos incompletos
 *
 * Esta definición es necesaria para que 'fixedFailures' pueda detectarse alguna
 * vez: si la línea base solo se aceptara con 0 fallas, ningún caso previamente
 * fallido podría existir en ella, y "falla corregida" nunca se dispararía.
 */
function isValidBaseline(result: ExecutionResult): boolean {
  return result.result !== 'error' && result.timed_out !== true;
}

/**
 * Compara el ExecutionResult actual contra la última ejecución completada
 * registrada en el manifest para el mismo módulo (S5-005).
 *
 * Si no existe línea base previa para el módulo, no hay comparación posible
 * (baselineExecutionId será null y ambos arreglos estarán vacíos).
 */
export async function detectRegressions(
  storage: IStorage,
  current: ExecutionResult,
): Promise<RegressionComparison> {
  const manifest = await readManifest(storage);
  const entry = manifest[current.module];

  if (!entry) {
    return { newFailures: [], fixedFailures: [], baselineExecutionId: null };
  }

  const baseline = await storage.getExecutionResult(entry.execution_id);
  if (!baseline) {
    return { newFailures: [], fixedFailures: [], baselineExecutionId: null };
  }

  const baselineCases = indexCasesById(baseline.cases);
  const newFailures: ExecutedCase[] = [];
  const fixedFailures: ExecutedCase[] = [];

  for (const currentCase of current.cases) {
    const previousCase = baselineCases.get(currentCase.id);
    if (!previousCase) continue; // caso nuevo: no cuenta como regresión ni fix

    const wasPassed = previousCase.result === 'passed';
    const wasFailed = previousCase.result === 'failed';
    const isPassed = currentCase.result === 'passed';
    const isFailed = currentCase.result === 'failed';

    if (wasPassed && isFailed) {
      newFailures.push(currentCase);
    } else if (wasFailed && isPassed) {
      fixedFailures.push(currentCase);
    }
  }

  return { newFailures, fixedFailures, baselineExecutionId: entry.execution_id };
}

/**
 * Si la ejecución actual es una línea base válida (ver isValidBaseline), la
 * registra en el manifest como la nueva referencia para ese módulo. Se
 * actualiza siempre que la ejecución haya completado, sin importar si tuvo
 * casos fallidos — así la próxima comparación puede detectar tanto fallas
 * nuevas como fallas corregidas respecto a este punto (S5-005).
 */
export async function updateManifestIfCompleted(
  storage: IStorage,
  result: ExecutionResult,
): Promise<void> {
  if (!isValidBaseline(result)) return;

  const manifest = await readManifest(storage);
  manifest[result.module] = {
    execution_id: result.execution_id,
    recorded_at: new Date().toISOString(),
  };
  await writeManifest(storage, manifest);
}