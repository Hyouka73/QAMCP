import fs from 'node:fs';
import path from 'node:path';

import { QapDatabase } from '@qap/reporter';

/**
 * Subcomando 'qap runtime reindex' (QAP v3.0 Regla 10 y Fase 3).
 *
 * Escanea .qa/runtime/runs/{runId}/run.json y reconstruye integramente
 * la base de datos qap.sqlite bajo transacciones atomicas.
 */
export async function handleRuntimeReindex(customDir?: string): Promise<number> {
  await Promise.resolve();
  const runtimeDir = customDir || path.resolve(process.cwd(), '.qa/runtime');

  if (!fs.existsSync(runtimeDir)) {
    process.stdout.write(`El directorio runtime no existe en: ${runtimeDir}. No hay nada para reindexar.\n`);
    return 0;
  }

  process.stdout.write(`Iniciando reindexación de telemetría desde: ${runtimeDir}...\n`);

  const db = new QapDatabase(runtimeDir);
  const count = db.reindex();
  db.close();

  process.stdout.write(
    `✔ Reindexación completada: ${count} corrida(s) restaurada(s) íntegramente en qap.sqlite desde run.json.\n`
  );

  return count;
}
