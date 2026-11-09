import Ajv from 'ajv';
import { describe, expect, it, vi } from 'vitest';

import { SchemaValidator } from '../validator/schema-validator.js';

const tc = () => ({
  _version: '1.0',
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Human-approved boundary',
  case_category: 'bva',
  source_rule_id: 'rule-1',
  steps: [{ type: 'assert', selector: '#error', assertion_type: 'visible' }],
});
const flow = () => ({
  _version: '1.0', name: 'checkout', modules: [{ module: 'cart', cases: ['TC-1'] }],
});

describe('INT-01E: develop TC/flow APIs with vNext compiled cache', () => {
  it('reuses compilation while isolating data and translated errors between families and instances', () => {
    const compile = vi.spyOn(Ajv.prototype, 'compile');
    try {
      const first = new SchemaValidator();
      const initialCalls = compile.mock.calls.length;
      expect(initialCalls).toBeGreaterThan(0);
      const invalid = Object.freeze({ ...tc(), id: 'not-a-uuid' });
      const rejected = first.validateTcCase(invalid);
      expect(rejected).toMatchObject({ valid: false, data: undefined });
      expect(rejected.errors).toEqual(expect.arrayContaining([expect.objectContaining({ rule: 'format' })]));
      const snapshot = structuredClone(rejected);
      const inputSnapshot = structuredClone(invalid);
      const second = new SchemaValidator();
      expect(second.validateFlow(flow()).valid).toBe(true);
      expect(second.validateProjectInit({ _version: '1.0', projectName: 'lab' }).valid).toBe(true);
      expect(second.validateTcCase(tc()).valid).toBe(true);
      expect(second.validateFlow({})).toMatchObject({ valid: false, data: undefined });
      expect(rejected).toEqual(snapshot);
      rejected.errors[0].message = 'Caller-owned error';
      expect(second.validateTcCase(invalid)).toEqual(snapshot);
      expect(invalid).toEqual(inputSnapshot);
      expect(compile).toHaveBeenCalledTimes(initialCalls);
    } finally {
      compile.mockRestore();
    }
  });

  it('accepts TC metadata and flow fields without modifying nested frozen inputs', () => {
    const validator = new SchemaValidator();
    const testCase = Object.freeze({ ...tc(), steps: Object.freeze([Object.freeze(tc().steps[0])]) });
    const testFlow = Object.freeze({ ...flow(), modules: Object.freeze([Object.freeze({ module: 'cart' })]) });
    const snapshot = structuredClone({ testCase, testFlow });
    expect(validator.validateTcCase(testCase)).toEqual({ valid: true, errors: [], data: testCase });
    expect(validator.validateFlow(testFlow)).toEqual({ valid: true, errors: [], data: testFlow });
    expect({ testCase, testFlow }).toEqual(snapshot);
  });

  it.each([
    { label: 'TC missing required name', kind: 'tc', value: { _version: '1.0', id: tc().id, steps: [] }, rule: 'required' },
    { label: 'TC unsupported step', kind: 'tc', value: { ...tc(), steps: [{ type: 'invented_action' }] }, rule: 'enum' },
    { label: 'TC invalid version type', kind: 'tc', value: { ...tc(), _version: 1 }, rule: 'type' },
    { label: 'TC extra field', kind: 'tc', value: { ...tc(), unexpected: true }, rule: 'additionalProperties' },
    { label: 'flow missing module identity', kind: 'flow', value: { ...flow(), modules: [{}] }, rule: 'required' },
    { label: 'flow invalid modules type', kind: 'flow', value: { ...flow(), modules: 'cart' }, rule: 'type' },
    { label: 'flow extra field', kind: 'flow', value: { ...flow(), unexpected: true }, rule: 'additionalProperties' },
  ])('rejects $label without leaking data', ({ kind, value, rule }) => {
    const validator = new SchemaValidator();
    const result = kind === 'tc' ? validator.validateTcCase(value) : validator.validateFlow(value);
    expect(result).toMatchObject({ valid: false, data: undefined });
    expect(result.errors).toEqual(expect.arrayContaining([expect.objectContaining({ rule })]));
    if (rule === 'required') expect(result.errors.some(error => error.message.startsWith('Falta el campo requerido'))).toBe(true);
  });

  it('keeps legacy flow.yaml distinct from canonical FlowScenario', () => {
    expect(new SchemaValidator().validateFlow({
      id: 'flow-1', module_id: 'cart', application_id: 'app-1', prerequisites: [],
    })).toMatchObject({ valid: false, data: undefined });
  });
});
