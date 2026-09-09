import { describe, it, expect } from 'vitest';
import { AjvCompiler } from '../validator/ajv-compiler.js';

describe('AjvCompiler', () => {
  const compiler = new AjvCompiler();

  it('debe compilar todos los schemas de @qap/shared sin lanzar error', () => {
    const schemaKeys = compiler.listSchemas();
    expect(schemaKeys.length).toBeGreaterThan(0);
    expect(schemaKeys).toContain('auth-profiles');
    expect(schemaKeys).toContain('environments');
  });

  it('debe aceptar un archivo auth-profiles.json bien formado', () => {
    const validData = {
      _version: '1',
      profiles: [
        {
          id: 'profile-dev-01',
          env: 'dev',
          username: 'qa.automation',
          credential_source: 'env',
          login_mode: 'auto',
        },
      ],
    };

    const result = compiler.validate('auth-profiles', validData);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('debe RECHAZAR un archivo auth-profiles.json malformado (campo extra no permitido)', () => {
    const malformedData = {
      _version: '1',
      profiles: [
        {
          id: 'profile-x',
          env: 'prod',
          username: 'user1',
          credential_source: 'env',
          login_mode: 'auto',
          campo_inventado: 'esto no deberia existir',
        },
      ],
    };

    const result = compiler.validate('auth-profiles', malformedData);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].rule).toBe('additionalProperties');
  });

  it('debe RECHAZAR un archivo malformado por valor fuera del enum permitido', () => {
    const malformedData = {
      _version: '1',
      profiles: [
        {
          id: 'profile-y',
          env: 'prod',
          username: 'user2',
          credential_source: 'env',
          login_mode: 'modo-invalido',
        },
      ],
    };

    const result = compiler.validate('auth-profiles', malformedData);
    expect(result.valid).toBe(false);
  });

  it('debe RECHAZAR datos que no cumplen el _version requerido', () => {
    const malformedData = {
      profiles: [],
    };

    const result = compiler.validate('auth-profiles', malformedData);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.rule === 'required')).toBe(true);
  });

  it('debe devolver un error controlado si se pide un schema inexistente', () => {
    const result = compiler.validate('schema-que-no-existe', {});
    expect(result.valid).toBe(false);
    expect(result.errors[0].rule).toBe('schema-not-found');
  });
});
