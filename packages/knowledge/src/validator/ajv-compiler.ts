import Ajv, { type ErrorObject, type ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';

import { schemas } from '@qap/shared';

export interface ValidationError {
  field: string;
  rule: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

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

export class AjvCompiler {
  private ajv: Ajv;
  private validators: Map<string, ValidateFunction>;

  constructor() {
    this.ajv = new Ajv({ allErrors: true, strict: true, strictRequired: false });
    addFormats(this.ajv);

    this.validators = new Map();

    for (const [key, schema] of Object.entries(schemas)) {
      this.validators.set(key, this.ajv.compile(schema));
    }
  }

  listSchemas(): string[] {
    return Array.from(this.validators.keys());
  }

  validate(schemaKey: string, data: unknown): ValidationResult {
    const validateFn = this.validators.get(schemaKey);

    if (!validateFn) {
      return {
        valid: false,
        errors: [
          {
            field: '(root)',
            rule: 'schema-not-found',
            message: `No existe un schema compilado para '${schemaKey}'. Disponibles: ${this.listSchemas().join(', ')}`,
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
}
