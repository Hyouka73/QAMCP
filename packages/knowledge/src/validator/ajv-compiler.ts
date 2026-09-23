import Ajv, { type ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import { schemas } from '@qap/shared';

import { ErrorTranslator, type ValidationError } from './error-translator.js';

export type { ValidationError };

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export class AjvCompiler {
  private ajv: Ajv;
  private validators: Map<string, ValidateFunction>;
  private errorTranslator: ErrorTranslator;

  constructor() {
    this.ajv = new Ajv({ allErrors: true, strict: true, strictRequired: false });
    addFormats(this.ajv);

    this.errorTranslator = new ErrorTranslator();
    this.validators = new Map();

    // Registrar schemas por su $id para permitir resolución de $ref cruzadas
    for (const schema of Object.values(schemas)) {
      const s = schema as { $id?: string };
      if (s?.$id && !this.ajv.getSchema(s.$id)) {
        this.ajv.addSchema(schema, s.$id);
      }
    }

    for (const [key, schema] of Object.entries(schemas)) {
      const s = schema as { $id?: string };
      if (s?.$id && this.ajv.getSchema(s.$id)) {
        this.validators.set(key, this.ajv.getSchema(s.$id)!);
      } else {
        this.validators.set(key, this.ajv.compile(schema));
      }
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
      errors: valid ? [] : this.errorTranslator.translate(validateFn.errors),
    };
  }
}
