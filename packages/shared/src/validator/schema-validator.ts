import Ajv, { type ErrorObject, type ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';

import {
  projectInitSchema,
  environmentsSchema,
  authProfilesSchema,
  executionResultSchema,
  systemPromptSchema,
  moduleRepoMapSchema,
} from '../schemas/index.js';
import type { ExecutionResult } from '../types/execution-result.type.js';
import type { RepoMap } from '../types/repo-map.type.js';

export interface ValidationError {
  field: string;
  rule: string;
  message: string;
}

export interface ValidationResult<T = unknown> {
  valid: boolean;
  errors: ValidationError[];
  data?: T;
}

/**
 * Calcula la distancia de Levenshtein entre dos cadenas de texto.
 */
function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = [];
  for (let i = 0; i <= m; i++) {
    dp[i] = new Array<number>(n + 1).fill(0);
    dp[i][0] = i;
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1]?.toLowerCase() === b[j - 1]?.toLowerCase()) {
        dp[i][j] = dp[i - 1][j - 1]!;
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // deletion
          dp[i][j - 1],     // insertion
          dp[i - 1][j - 1]  // substitution
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * Encuentra el campo permitido más cercano por distancia de Levenshtein.
 */
function findClosestProperty(unknownProp: string, candidates: string[]): string | null {
  if (candidates.length === 0) return null;
  let bestCandidate: string | null = null;
  let minDistance = Infinity;

  for (const candidate of candidates) {
    const dist = levenshteinDistance(unknownProp, candidate);
    if (dist < minDistance) {
      minDistance = dist;
      bestCandidate = candidate;
    }
  }

  // Sugerir solo si la distancia es razonablemente cercana (<= 3 y menor al tamaño del candidato)
  if (bestCandidate && minDistance <= 3 && minDistance < bestCandidate.length + 2) {
    return bestCandidate;
  }
  return null;
}

/**
 * Extrae las propiedades permitidas según el schema y la ruta del error.
 */
function getAllowedProperties(schema: unknown, schemaPath?: string): string[] {
  if (!schema || typeof schema !== 'object') return [];
  if (!schemaPath) return [];

  // Extraer la ruta relativa tras '#' y eliminar sufijo '/additionalProperties'
  const hashIndex = schemaPath.indexOf('#');
  const pathAfterHash = hashIndex !== -1 ? schemaPath.substring(hashIndex + 1) : schemaPath;
  const cleanPath = pathAfterHash.replace(/\/additionalProperties$/, '').replace(/^\/?/, '');

  if (!cleanPath) {
    const rootProps = (schema as { properties?: Record<string, unknown> }).properties;
    return rootProps ? Object.keys(rootProps) : [];
  }

  const parts = cleanPath.split('/');
  let current: unknown = schema;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      break;
    }
  }

  if (current && typeof current === 'object' && 'properties' in current) {
    const props = (current as { properties?: Record<string, unknown> }).properties;
    return props ? Object.keys(props) : [];
  }

  return [];
}

/**
 * Traduce errores crudos de AJV a mensajes legibles,
 * indicando el campo exacto, la regla violada y sugerencias por Levenshtein.
 */
function translateErrors(
  errors: ErrorObject[] | null | undefined,
  schema?: unknown
): ValidationError[] {
  if (!errors) return [];

  return errors.map((err) => {
    const field = err.instancePath ? err.instancePath.replace(/^\//, '') : '(root)';
    const rule = err.keyword;

    let message: string;
    switch (err.keyword) {
      case 'additionalProperties': {
        const extra = (err.params as { additionalProperty?: string }).additionalProperty;
        const allowed = getAllowedProperties(schema, err.schemaPath);
        const suggestion = extra ? findClosestProperty(extra, allowed) : null;
        if (suggestion) {
          message = `Propiedad no permitida '${extra}' en '${field || '(root)'}'. ¿Quizás quisiste decir '${suggestion}'?`;
        } else {
          message = `Propiedad no permitida '${extra}' en '${field || '(root)'}'`;
        }
        break;
      }
      case 'required': {
        const missing = (err.params as { missingProperty?: string }).missingProperty;
        message = `Falta el campo requerido '${missing}'`;
        break;
      }
      case 'type': {
        const expectedType = (err.params as { type?: string }).type;
        message = `El campo '${field}' debe ser de tipo '${expectedType}'`;
        break;
      }
      default:
        message = `Campo '${field}': ${err.message ?? 'valor invalido'}`;
    }

    return { field: field || '(root)', rule, message };
  });
}

export class SchemaValidator {
  private ajv: Ajv;
  private validators: Map<string, ValidateFunction>;

  constructor() {
    this.ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(this.ajv);

    const envValidator = this.ajv.compile(environmentsSchema);
    const profileValidator = this.ajv.compile(authProfilesSchema);
    const repoMapValidator = this.ajv.compile(moduleRepoMapSchema);
    const executionResultValidator = this.ajv.compile(executionResultSchema);

    // Precompilación en memoria de los schemas fundamentales y aliases
    this.validators = new Map([
      ['project-init', this.ajv.compile(projectInitSchema)],
      ['environments', envValidator],
      ['project-environments', envValidator],
      ['profiles', profileValidator],
      ['auth-profiles', profileValidator],
      ['execution-result', executionResultValidator],
      ['system-prompt', this.ajv.compile(systemPromptSchema)],
      ['module-repo-map', repoMapValidator],
      ['repo-map', repoMapValidator],
    ]);
  }

  private runValidation<T = unknown>(schemaKey: string, data: unknown): ValidationResult<T> {
    const validateFn = this.validators.get(schemaKey);

    if (!validateFn) {
      return {
        valid: false,
        errors: [
          {
            field: '(root)',
            rule: 'schema-not-found',
            message: `No existe un schema precompilado para '${schemaKey}'`,
          },
        ],
      };
    }

    const valid = validateFn(data);

    return {
      valid: Boolean(valid),
      errors: valid ? [] : translateErrors(validateFn.errors, validateFn.schema),
      data: valid ? (data as T) : undefined,
    };
  }

  validateProjectInit(data: unknown): ValidationResult {
    return this.runValidation('project-init', data);
  }

  validateEnvironments(data: unknown): ValidationResult {
    return this.runValidation('project-environments', data);
  }

  validateProfiles(data: unknown): ValidationResult {
    return this.runValidation('profiles', data);
  }

  public validateExecutionResult(data: unknown): ValidationResult<ExecutionResult> {
    return this.runValidation<ExecutionResult>('execution-result', data);
  }

  validateSystemPrompt(data: unknown): ValidationResult {
    return this.runValidation('system-prompt', data);
  }

  validateRepoMap(data: unknown): ValidationResult<RepoMap> {
    return this.runValidation<RepoMap>('module-repo-map', data);
  }
}