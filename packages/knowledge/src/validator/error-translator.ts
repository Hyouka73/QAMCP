import type { ErrorObject } from 'ajv';

export interface ValidationError {
  field: string;
  rule: string;
  message: string;
}

/**
 * ErrorTranslator: traduce errores crudos de AJV a mensajes legibles
 * orientados a QA, indicando el campo exacto, la regla violada y una
 * explicacion en espanol clara del problema encontrado.
 */
export class ErrorTranslator {
  /**
   * Traduce una lista de errores de AJV (ErrorObject[]) a mensajes
   * legibles para un ingeniero de QA que este revisando un archivo
   * de configuracion (ej. profiles.json, environments.yaml, etc).
   */
  translate(errors: ErrorObject[] | null | undefined): ValidationError[] {
    if (!errors) return [];

    return errors.map((err) => this.translateOne(err));
  }

  private translateOne(err: ErrorObject): ValidationError {
    const field = err.instancePath ? err.instancePath.replace(/^\//, '') : '(root)';
    const rule = err.keyword;

    let message: string;
    switch (err.keyword) {
      case 'additionalProperties': {
        const extra = (err.params as { additionalProperty?: string }).additionalProperty;
        message = `Propiedad no permitida '${extra}' en '${field || '(root)'}'. Revisa el schema para ver los campos validos.`;
        break;
      }
      case 'required': {
        const missing = (err.params as { missingProperty?: string }).missingProperty;
        message = `Falta el campo requerido '${missing}' en '${field || '(root)'}'.`;
        break;
      }
      case 'type': {
        const expectedType = (err.params as { type?: string }).type;
        message = `El campo '${field}' debe ser de tipo '${expectedType}'.`;
        break;
      }
      case 'enum': {
        const allowed = (err.params as { allowedValues?: unknown[] }).allowedValues ?? [];
        message = `El campo '${field}' tiene un valor no permitido. Valores validos: ${allowed.join(', ')}.`;
        break;
      }
      case 'const': {
        const allowed = (err.params as { allowedValue?: unknown }).allowedValue;
        message = `El campo '${field}' debe ser exactamente '${String(allowed)}'.`;
        break;
      }
      case 'minimum': {
        const limit = (err.params as { limit?: number }).limit;
        message = `El campo '${field}' debe ser mayor o igual a ${limit}.`;
        break;
      }
      case 'minLength': {
        const limit = (err.params as { limit?: number }).limit;
        message = `El campo '${field}' no puede estar vacio (minimo ${limit} caracter${limit === 1 ? '' : 'es'}).`;
        break;
      }
      default:
        message = `Campo '${field}': ${err.message ?? 'valor invalido'}.`;
    }

    return { field: field || '(root)', rule, message };
  }
}
