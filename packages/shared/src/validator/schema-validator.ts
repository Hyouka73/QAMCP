import Ajv, { type ErrorObject, type ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';

import {
  projectInitSchema,
  environmentsSchema,
  authProfilesSchema,
  executionResultSchema,
} from '../schemas/index.js';

export interface ValidationError {
  field: string;
  rule: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
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

    // Precompilación en memoria de los schemas fundamentales
    this.validators = new Map([
      ['project-init', this.ajv.compile(projectInitSchema)],
      ['project-environments', this.ajv.compile(environmentsSchema)],
      ['profiles', this.ajv.compile(authProfilesSchema)],
      ['execution-result', this.ajv.compile(executionResultSchema)],
    ]);
  }

  private runValidation(schemaKey: string, data: unknown): ValidationResult {
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
}