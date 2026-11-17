import { describe, it, expect } from 'vitest';

import { SchemaValidator } from '../validator/schema-validator.js';

const base = { _version: '1.0', name: 'f', modules: [{ module: 'a' }] };

describe('S8-001: flow.schema.json', () => {
  const v = new SchemaValidator();

  it('acepta teardown.on_failure como texto rollback_storage_state', () => {
    expect(v.validateFlow({ ...base, teardown: { on_failure: 'rollback_storage_state' } }).valid).toBe(true);
  });

  it('acepta teardown.on_failure como arreglo de acciones', () => {
    expect(v.validateFlow({ ...base, teardown: { on_failure: [{ type: 'rollback_storage_state' }] } }).valid).toBe(true);
  });

  it('rechaza teardown.on_failure con otro texto', () => {
    expect(v.validateFlow({ ...base, teardown: { on_failure: 'borrar_todo' } }).valid).toBe(false);
  });

  it('acepta depends_on con formato modulo y modulo:case_id', () => {
    const flow = { ...base, modules: [{ module: 'b', depends_on: ['a', 'a:TC-001'] }] };
    expect(v.validateFlow(flow).valid).toBe(true);
  });

  it('rechaza depends_on con más de un separador o con espacios', () => {
    for (const bad of ['a:b:c', 'a b', ':x', 'a:']) {
      const flow = { ...base, modules: [{ module: 'b', depends_on: [bad] }] };
      expect(v.validateFlow(flow).valid, bad).toBe(false);
    }
  });

  it('rechaza un flujo sin modules', () => {
    expect(v.validateFlow({ _version: '1.0', name: 'f' }).valid).toBe(false);
  });
});