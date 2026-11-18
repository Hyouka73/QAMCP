import Ajv from 'ajv';
import { describe, expect, it, vi } from 'vitest';

import { SchemaValidator } from '../validator/schema-validator.js';

describe('SchemaValidator reusable compiled schemas', () => {
  it('compiles once across instances while validating every payload without mutating input', () => {
    const compile = vi.spyOn(Ajv.prototype, 'compile');
    try {
      const first = new SchemaValidator();
      const initialCompilations = compile.mock.calls.length;
      expect(initialCompilations).toBeGreaterThan(0);
      const invalid = Object.freeze({ _version: '1.0', projectName: 42, unexpected: true });
      const rejected = first.validateProjectInit(invalid);
      expect(rejected.valid).toBe(false);
      expect(rejected.errors.map(error => error.rule)).toEqual(expect.arrayContaining(['type', 'additionalProperties']));
      const snapshot = structuredClone(rejected);
      for (let i = 0; i < 20; i++) {
        const next = new SchemaValidator();
        const valid = Object.freeze({ _version: '1.0', projectName: 'isolated-project' });
        expect(next.validateProjectInit(valid)).toMatchObject({ valid: true, errors: [], data: valid });
        expect(next.validateProjectInit({})).toMatchObject({ valid: false, data: undefined });
        expect(next.validateProjectInit(invalid)).toEqual(snapshot);
      }
      expect(rejected).toEqual(snapshot); // Later calls cannot overwrite prior errors.
      rejected.errors[0].message = 'Caller-owned result';
      expect(first.validateProjectInit(invalid)).toEqual(snapshot);
      expect(compile).toHaveBeenCalledTimes(initialCompilations);
    } finally { compile.mockRestore(); }
  });
});
