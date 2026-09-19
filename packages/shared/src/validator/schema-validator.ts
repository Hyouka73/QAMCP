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
 * Traduce errores crudos de AJV a mensajes legibles,
 * indicando el campo exacto y la regla violada.
 */
function translateErrors(errors: ErrorObject[] | null | undefined): ValidationError[] {
  if (!errors) return [];

  return errors.map((err) => {
    const field = err.instancePath ? err.instancePath.replace(/^\//, '') : '(root)';
    const rule = err.keyword;

    let message: string;
    switch (err.keyword) {
      case 'additionalProperties': {
        const extra = (err.params as { additionalProperty?: string }).additionalProperty;
        message = `Propiedad no permitida '${extra}' en '${field || '(root)'}'`;
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

    // Precompilación en memoria de los schemas fundamentales y aliases
    this.validators = new Map([
      ['project-init', this.ajv.compile(projectInitSchema)],
      ['environments', envValidator],
      ['project-environments', envValidator],
      ['profiles', profileValidator],
      ['auth-profiles', profileValidator],
      ['execution-result', this.ajv.compile(executionResultSchema)],
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
      errors: valid ? [] : translateErrors(validateFn.errors),
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

  validateExecutionResult(data: unknown): ValidationResult {
    return this.runValidation('execution-result', data);
  }

  validateSystemPrompt(data: unknown): ValidationResult {
    return this.runValidation('system-prompt', data);
  }

  validateRepoMap(data: unknown): ValidationResult<RepoMap> {
    return this.runValidation<RepoMap>('module-repo-map', data);
  }
}