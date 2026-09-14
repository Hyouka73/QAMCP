import { describe, it, expect } from 'vitest';
import type { ErrorObject } from 'ajv';
import { ErrorTranslator } from '../validator/error-translator.js';

describe('ErrorTranslator', () => {
  const translator = new ErrorTranslator();

  it('debe devolver arreglo vacio si no hay errores', () => {
    expect(translator.translate(null)).toEqual([]);
    expect(translator.translate(undefined)).toEqual([]);
    expect(translator.translate([])).toEqual([]);
  });

  it('debe traducir error de tipo "additionalProperties" a mensaje legible', () => {
    const errors: ErrorObject[] = [
      {
        instancePath: '/profiles/0',
        schemaPath: '#/additionalProperties',
        keyword: 'additionalProperties',
        params: { additionalProperty: 'campo_extra' },
        message: 'must NOT have additional properties',
      } as ErrorObject,
    ];

    const result = translator.translate(errors);
    expect(result).toHaveLength(1);
    expect(result[0].rule).toBe('additionalProperties');
    expect(result[0].field).toBe('profiles/0');
    expect(result[0].message).toContain('campo_extra');
    expect(result[0].message).not.toContain('must NOT have'); // ya no debe verse el mensaje crudo de AJV
  });

  it('debe traducir error de tipo "required" a mensaje legible', () => {
    const errors: ErrorObject[] = [
      {
        instancePath: '',
        schemaPath: '#/required',
        keyword: 'required',
        params: { missingProperty: '_version' },
        message: "must have required property '_version'",
      } as ErrorObject,
    ];

    const result = translator.translate(errors);
    expect(result[0].rule).toBe('required');
    expect(result[0].message).toContain('_version');
    expect(result[0].message.toLowerCase()).toContain('falta');
  });

  it('debe traducir error de tipo "type" a mensaje legible', () => {
    const errors: ErrorObject[] = [
      {
        instancePath: '/env',
        schemaPath: '#/properties/env/type',
        keyword: 'type',
        params: { type: 'string' },
        message: 'must be string',
      } as ErrorObject,
    ];

    const result = translator.translate(errors);
    expect(result[0].message).toContain('env');
    expect(result[0].message).toContain('string');
  });

  it('debe traducir error de tipo "enum" listando los valores permitidos', () => {
    const errors: ErrorObject[] = [
      {
        instancePath: '/login_mode',
        schemaPath: '#/properties/login_mode/enum',
        keyword: 'enum',
        params: { allowedValues: ['auto', 'handoff'] },
        message: 'must be equal to one of the allowed values',
      } as ErrorObject,
    ];

    const result = translator.translate(errors);
    expect(result[0].message).toContain('auto');
    expect(result[0].message).toContain('handoff');
  });

  it('debe traducir error de tipo "const" a mensaje legible', () => {
    const errors: ErrorObject[] = [
      {
        instancePath: '/_version',
        schemaPath: '#/properties/_version/const',
        keyword: 'const',
        params: { allowedValue: '1' },
        message: 'must be equal to constant',
      } as ErrorObject,
    ];

    const result = translator.translate(errors);
    expect(result[0].message).toContain('1');
  });

  it('debe traducir error de tipo "minimum" a mensaje legible', () => {
    const errors: ErrorObject[] = [
      {
        instancePath: '/handoff_timeout_ms',
        schemaPath: '#/properties/handoff_timeout_ms/minimum',
        keyword: 'minimum',
        params: { limit: 0 },
        message: 'must be >= 0',
      } as ErrorObject,
    ];

    const result = translator.translate(errors);
    expect(result[0].message).toContain('0');
  });

  it('debe manejar un error desconocido usando el mensaje generico de AJV', () => {
    const errors: ErrorObject[] = [
      {
        instancePath: '/campo',
        schemaPath: '#/properties/campo/pattern',
        keyword: 'pattern',
        params: { pattern: '^[a-z]+$' },
        message: 'must match pattern',
      } as ErrorObject,
    ];

    const result = translator.translate(errors);
    expect(result[0].rule).toBe('pattern');
    expect(result[0].message).toContain('campo');
  });

  it('debe usar "(root)" como campo cuando instancePath esta vacio', () => {
    const errors: ErrorObject[] = [
      {
        instancePath: '',
        schemaPath: '#/required',
        keyword: 'required',
        params: { missingProperty: 'profiles' },
        message: "must have required property 'profiles'",
      } as ErrorObject,
    ];

    const result = translator.translate(errors);
    expect(result[0].field).toBe('(root)');
  });

  it('debe traducir multiples errores en un solo llamado, manteniendo el orden', () => {
    const errors: ErrorObject[] = [
      {
        instancePath: '/a',
        schemaPath: '#/properties/a/type',
        keyword: 'type',
        params: { type: 'string' },
        message: 'must be string',
      } as ErrorObject,
      {
        instancePath: '/b',
        schemaPath: '#/properties/b/type',
        keyword: 'type',
        params: { type: 'number' },
        message: 'must be number',
      } as ErrorObject,
    ];

    const result = translator.translate(errors);
    expect(result).toHaveLength(2);
    expect(result[0].field).toBe('a');
    expect(result[1].field).toBe('b');
  });
});
