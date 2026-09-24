import fs from 'node:fs';
import path from 'node:path';

import YAML from 'yaml';
import type { GuardrailDefinition } from '@qap/shared';

import { AjvCompiler } from '../validator/ajv-compiler.js';

export interface GuardrailsLoadResult {
  valid: boolean;
  guardrails: GuardrailDefinition[];
  errors: string[];
}

/**
 * Encuentra de forma recursiva todos los archivos .yaml, .yml y .json en un directorio.
 */
function scanDirectoryFiles(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const results: string[] = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...scanDirectoryFiles(fullPath));
    } else if (
      entry.isFile() &&
      (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml') || entry.name.endsWith('.json'))
    ) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * Parsea el contenido de un archivo YAML o JSON.
 */
function parseFileContent(filePath: string): unknown {
  const content = fs.readFileSync(filePath, 'utf-8');
  if (filePath.endsWith('.json')) {
    return JSON.parse(content);
  }
  return YAML.parse(content);
}

/**
 * Carga y valida archivos de definición de Guardrails (.qa/definitions/guardrails/).
 *
 * Soporta:
 * - Archivos colecciones YAML con `guardrails: [...]` y opcional `_version`.
 * - Archivos con array de guardrails en la raíz `[...]`.
 * - Archivos individuales con un solo objeto guardrail en la raíz.
 */
export function loadGuardrails(guardrailsDir: string, compiler?: AjvCompiler): GuardrailsLoadResult {
  const errors: string[] = [];
  const guardrails: GuardrailDefinition[] = [];
  const guardrailMap = new Map<string, string>(); // guardrailId -> relativePath

  if (!fs.existsSync(guardrailsDir)) {
    return {
      valid: true,
      guardrails: [],
      errors: [],
    };
  }

  const ajvCompiler = compiler ?? new AjvCompiler();
  const filePaths = scanDirectoryFiles(guardrailsDir);

  for (const filePath of filePaths) {
    const relativePath = path.relative(guardrailsDir, filePath);
    let rawData: unknown;

    try {
      rawData = parseFileContent(filePath);
    } catch (parseError: unknown) {
      const msg = parseError instanceof Error ? parseError.message : String(parseError);
      errors.push(`Error al parsear el archivo de guardrails '${relativePath}': ${msg}`);
      continue;
    }

    if (!rawData || typeof rawData !== 'object') {
      errors.push(`El archivo '${relativePath}' no contiene un objeto o lista de guardrails válida.`);
      continue;
    }

    let itemsToValidate: unknown[];

    if (Array.isArray(rawData)) {
      itemsToValidate = rawData;
    } else {
      const dataObj = rawData as Record<string, unknown>;
      if (Array.isArray(dataObj.guardrails)) {
        itemsToValidate = dataObj.guardrails;
      } else if (typeof dataObj.id === 'string' && Array.isArray(dataObj.enforcedByCapabilities)) {
        itemsToValidate = [dataObj];
      } else {
        errors.push(
          `El archivo '${relativePath}' no contiene una estructura reconocida de guardrails (se esperaba campo 'guardrails' o guardrail individual).`
        );
        continue;
      }
    }

    for (let i = 0; i < itemsToValidate.length; i++) {
      const item = itemsToValidate[i];
      const validation = ajvCompiler.validate('guardrail-definition', item);
      const itemContext = itemsToValidate.length > 1 ? `[índice ${i}]` : '';

      if (!validation.valid) {
        for (const err of validation.errors) {
          errors.push(`[Schema][${relativePath}]${itemContext} ${err.field}: ${err.message}`);
        }
      } else {
        const guardrail = item as GuardrailDefinition;

        if (guardrailMap.has(guardrail.id)) {
          const firstDeclared = guardrailMap.get(guardrail.id);
          errors.push(
            `Guardrail duplicado: '${guardrail.id}' ya fue declarado en '${firstDeclared}' y se repite en '${relativePath}'.`
          );
        } else {
          guardrailMap.set(guardrail.id, relativePath);
          guardrails.push(guardrail);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    guardrails,
    errors,
  };
}
