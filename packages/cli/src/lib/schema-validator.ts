import AjvModule from 'ajv';
import type { ErrorObject } from 'ajv';
import addFormatsModule from 'ajv-formats';
import { schemas } from '@qap/shared';

// Interop fix: algunas configuraciones de módulo ESM/CJS
// resuelven el default export como propiedad anidada.
const Ajv = (AjvModule as any).default ?? AjvModule;
const addFormats = (addFormatsModule as any).default ?? addFormatsModule;

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

export class SchemaValidator {
  private ajv: InstanceType<typeof Ajv>;

  constructor() {
    this.ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(this.ajv);
  }

  validate(schemaFileName: string, data: unknown): ValidationResult {
    const key = schemaFileName.replace(/\.schema\.json$/, '');
    const schema = (schemas as Record<string, unknown>)[key];

    if (!schema) {
      return {
        valid: false,
        errors: [`No se encontró el schema registrado para: '${schemaFileName}'`],
      };
    }

    const validateFn = this.ajv.compile(schema as object);
    const valid = validateFn(data);

    if (valid) {
      return { valid: true };
    }

    return {
      valid: false,
      errors: (validateFn.errors ?? []).map((err: ErrorObject) =>
        `${err.instancePath || '(root)'} ${err.message}`
      ),
    };
  }
}