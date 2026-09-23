import fs from 'node:fs';
import path from 'node:path';

import YAML from 'yaml';

import { AjvCompiler } from '../validator/ajv-compiler.js';
import { validateDependencyGraph } from '../graph/cycle-detector.js';
import { loadGuardrails } from './guardrails-loader.js';
import type { CapabilityDefinition, FlowDefinition, ModuleDefinition, GuardrailDefinition } from '../types.js';

export interface DefinitionsValidationResult {
  valid: boolean;
  modules: ModuleDefinition[];
  flows: FlowDefinition[];
  capabilities: CapabilityDefinition[];
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
 * Carga y valida todas las definiciones estáticas (.qa/definitions/).
 *
 * Ejecuta en build-time:
 * 1. Validación de esquema JSON (Ajv) para módulos, flujos y guardrails.
 * 2. Comprobación de duplicados de `capabilityId` y `guardrailId`.
 * 3. Detección de ciclos por DFS de 3 colores con trazado exacto de ruta.
 * 4. Detección de referencias rotas hacia capacidades inexistentes.
 * 5. Validación de pasos de flujos referenciando capacidades válidas.
 * 6. Integridad referencial de Guardrails: `enforcedByCapabilities` deben existir en los módulos.
 */
export function validateDefinitions(definitionsDir: string): DefinitionsValidationResult {
  const errors: string[] = [];
  const modules: ModuleDefinition[] = [];
  const flows: FlowDefinition[] = [];
  const allCapabilities: CapabilityDefinition[] = [];
  const capabilityMap = new Map<string, string>(); // capabilityId -> filePath

  if (!fs.existsSync(definitionsDir)) {
    return {
      valid: false,
      modules: [],
      flows: [],
      capabilities: [],
      guardrails: [],
      errors: [`El directorio de definiciones no existe: ${definitionsDir}`],
    };
  }

  const compiler = new AjvCompiler();

  // 1. Cargar y validar Guardrails desde el subdirectorio guardrails/ si existe
  const guardrailsDir = path.join(definitionsDir, 'guardrails');
  const guardrailsResult = loadGuardrails(guardrailsDir, compiler);
  const guardrails = guardrailsResult.guardrails;
  if (!guardrailsResult.valid) {
    errors.push(...guardrailsResult.errors);
  }

  const filePaths = scanDirectoryFiles(definitionsDir);

  if (filePaths.length === 0 && guardrails.length === 0) {
    return {
      valid: true,
      modules: [],
      flows: [],
      capabilities: [],
      guardrails: [],
      errors: [],
    };
  }

  for (const filePath of filePaths) {
    const relativePath = path.relative(definitionsDir, filePath);

    // Omitir archivos bajo guardrails/ ya procesados por loadGuardrails
    const normalizedParts = path.normalize(relativePath).split(path.sep);
    if (normalizedParts[0] === 'guardrails') {
      continue;
    }

    let rawData: unknown;

    try {
      rawData = parseFileContent(filePath);
    } catch (parseError: unknown) {
      const msg = parseError instanceof Error ? parseError.message : String(parseError);
      errors.push(`Error al parsear el archivo '${relativePath}': ${msg}`);
      continue;
    }

    if (!rawData || typeof rawData !== 'object') {
      errors.push(`El archivo '${relativePath}' no contiene un objeto válido.`);
      continue;
    }

    const dataObj = rawData as Record<string, unknown>;

    // Identificar si es ModuleDefinition o FlowDefinition
    const isModule = Array.isArray(dataObj.capabilities) || relativePath.includes('modules');
    const isFlow = Array.isArray(dataObj.steps) || relativePath.includes('flows');

    if (isModule) {
      const validation = compiler.validate('module-definition', dataObj);
      if (!validation.valid) {
        for (const err of validation.errors) {
          errors.push(`[Schema][${relativePath}] ${err.field}: ${err.message}`);
        }
      } else {
        const mod = dataObj as unknown as ModuleDefinition;
        modules.push(mod);

        for (const cap of mod.capabilities) {
          if (capabilityMap.has(cap.id)) {
            const firstFile = capabilityMap.get(cap.id);
            errors.push(
              `Capacidad duplicada: '${cap.id}' ya fue declarada en '${firstFile}' y se repite en '${relativePath}'.`
            );
          } else {
            capabilityMap.set(cap.id, relativePath);
            allCapabilities.push(cap);
          }
        }
      }
    } else if (isFlow) {
      const validation = compiler.validate('flow-definition', dataObj);
      if (!validation.valid) {
        for (const err of validation.errors) {
          errors.push(`[Schema][${relativePath}] ${err.field}: ${err.message}`);
        }
      } else {
        const flow = dataObj as unknown as FlowDefinition;
        flows.push(flow);
      }
    } else {
      errors.push(
        `El archivo '${relativePath}' no corresponde a una definición reconocida de módulo o flujo.`
      );
    }
  }

  // Chequeo de ciclo de dependencias sobre las capacidades parseadas válidas
  const graphValidation = validateDependencyGraph(allCapabilities);
  if (!graphValidation.valid) {
    errors.push(...graphValidation.errors);
  }

  // Validar referencias de los pasos de flujos
  const knownCapIds = new Set(allCapabilities.map((c) => c.id));
  for (const flow of flows) {
    for (const step of flow.steps) {
      if (!knownCapIds.has(step.capabilityId)) {
        errors.push(
          `Flujo '${flow.id}', paso ${step.stepIndex}: referencia a capacidad inexistente '${step.capabilityId}'.`
        );
      }
    }
  }

  // Validar integridad referencial de los guardrails hacia capacidades
  for (const guardrail of guardrails) {
    for (const capId of guardrail.enforcedByCapabilities) {
      if (!knownCapIds.has(capId)) {
        errors.push(
          `Guardrail '${guardrail.id}': referencia a capacidad inexistente '${capId}' en enforcedByCapabilities.`
        );
      }
    }
  }

  // Validar si alguna capacidad referencia un guardrail inexistente
  const knownGuardrailIds = new Set(guardrails.map((g) => g.id));
  for (const cap of allCapabilities) {
    if (cap.guardrailIds && cap.guardrailIds.length > 0) {
      for (const gId of cap.guardrailIds) {
        if (!knownGuardrailIds.has(gId)) {
          errors.push(
            `Capacidad '${cap.id}': referencia a guardrail inexistente '${gId}' en guardrailIds.`
          );
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    modules,
    flows,
    capabilities: allCapabilities,
    guardrails,
    errors,
  };
}
