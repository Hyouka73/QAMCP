import fs from 'node:fs';
import path from 'node:path';

import { validateDefinitions } from '@qap/knowledge';

import { DataError } from '../errors.js';

export interface ValidateOptions {
  path?: string;
}

/**
 * Subcomando `qap validate [path]`.
 *
 * Valida estáticamente en build-time:
 * 1. Conformidad con JSON Schema de módulos y flujos.
 * 2. Ausencia de referencias a capacidades inexistentes.
 * 3. Ausencia de ciclos directos e indirectos en el grafo de dependencias (DFS 3-color).
 */
export async function handleValidate(
  customPath?: string,
  options?: ValidateOptions
): Promise<void> {
  await Promise.resolve();
  const targetDir = customPath || options?.path || path.resolve(process.cwd(), '.qa/definitions');

  if (!fs.existsSync(targetDir)) {
    throw new DataError(
      `El directorio de definiciones no existe en: ${targetDir}. Asegúrate de inicializar .qa/definitions/.`
    );
  }

  process.stdout.write(`Validando definiciones estáticas en: ${targetDir}...\n`);

  const result = validateDefinitions(targetDir);

  if (!result.valid) {
    const errorDetails = result.errors.map((err) => `  ✖ ${err}`).join('\n');
    throw new DataError(
      `Validación de definiciones estáticas fallida (${result.errors.length} error(es) encontrado(s)):\n${errorDetails}`
    );
  }

  process.stdout.write(
    `✔ Definiciones válidas: ${result.modules.length} módulo(s), ${result.capabilities.length} capacidad(es), ${result.flows.length} flujo(s). Grafo de dependencias acíclico.\n`
  );
}
