import type { ModuleSelectors } from '@qap/engine';
import { SchemaValidator } from '@qap/shared';
import type { RuleEntry } from '@qap/shared';
import { describe, it, expect } from 'vitest';

import { generateBvaCases } from '../plan/bva-generator.js';

// Forma real de selectors.json: { selectors: { campo: selector }, metadata }
const selectors = {
  selectors: { age: '#age-input', score: '[name="score"]' },
  metadata: { generated_at: '2026-01-01T00:00:00.000Z', source: 'test' },
} as unknown as ModuleSelectors;

function rule(overrides: Partial<RuleEntry> & { id: string }): RuleEntry {
  return {
    description: 'Regla de prueba',
    status: 'confirmed',
    category: 'campo',
    field: 'age',
    ...overrides,
  };
}

/** Valores que se llenan en el campo, en el orden de los 5 casos. */
function filledValues(cases: ReturnType<typeof generateBvaCases>): string[] {
  return cases.map((testCase) => testCase.steps.find((step) => step.type === 'fill')?.value ?? '');
}

describe('BvaGenerator (S81-001)', () => {
  it('extrae límites de Nivel 1 (evidence DOM) y Nivel 2 (texto libre) y genera 5 casos frontera válidos en SchemaValidator', () => {
    const rules: RuleEntry[] = [
      rule({ id: 'RULE-01', field: 'age', evidence: 'min="18" max="99"', description: 'Edad permitida' }),
      rule({ id: 'RULE-02', field: 'score', category: 'dato', description: 'Debe estar entre 1 y 10' }),
      rule({ id: 'RULE-03', field: 'unconfirmed_field', status: 'rejected', evidence: 'min="1" max="5"' }),
    ];

    const cases = generateBvaCases('test-mod', rules, selectors, '/form');

    // 5 casos para RULE-01 y 5 para RULE-02 (RULE-03 se ignora por status rejected)
    expect(cases.length).toBe(10);

    const validator = new SchemaValidator();
    for (const testCase of cases) {
      const validation = validator.validateTcCase(testCase);
      expect(validation.errors).toEqual([]);
      expect(validation.valid).toBe(true);
      expect(testCase.case_category).toBe('bva');
      expect(testCase.steps.length).toBe(4);
    }

    // Subtipos de frontera para RULE-01 (min=18, max=99)
    const ageCases = cases.filter((c) => c.source_rule_id === 'RULE-01');
    expect(ageCases.map((c) => c.name)).toEqual([
      'BVA_RULE-01_under_min',
      'BVA_RULE-01_min',
      'BVA_RULE-01_nominal',
      'BVA_RULE-01_max',
      'BVA_RULE-01_over_max',
    ]);
  });

  it('genera exactamente los 5 casos frontera con sus valores (min-1, min, nominal, max, max+1)', () => {
    const cases = generateBvaCases('mod', [rule({ id: 'R1', evidence: 'min="18" max="99"' })], selectors, '/form');

    expect(cases.map((c) => c.name)).toEqual([
      'BVA_R1_under_min',
      'BVA_R1_min',
      'BVA_R1_nominal',
      'BVA_R1_max',
      'BVA_R1_over_max',
    ]);
    expect(filledValues(cases)).toEqual(['17', '18', '58', '99', '100']);
  });

  it('marca los casos inválidos (min-1, max+1) con assert not_visible y los válidos con visible', () => {
    const cases = generateBvaCases('mod', [rule({ id: 'R1', evidence: 'min="1" max="5"' })], selectors);

    const assertions = cases.map((c) => c.steps.find((s) => s.type === 'assert')?.assertion_type);
    expect(assertions).toEqual(['not_visible', 'visible', 'visible', 'visible', 'not_visible']);
  });

  it('extrae minlength y maxlength desde rule.evidence', () => {
    const cases = generateBvaCases('mod', [rule({ id: 'R1', evidence: 'minlength="3" maxlength="20"' })], selectors);

    expect(filledValues(cases)).toEqual(['2', '3', '11', '20', '21']);
  });

  it('extrae mínimo y máximo desde texto libre (description / condition)', () => {
    const cases = generateBvaCases(
      'mod',
      [rule({ id: 'R1', description: 'El monto debe tener un mínimo de 10', condition: 'máximo de 50' })],
      selectors
    );

    expect(filledValues(cases)).toEqual(['9', '10', '30', '50', '51']);
  });

  it('combina las reglas por atributo de generateDomHypotheses (una regla min y otra max del mismo campo)', () => {
    const cases = generateBvaCases(
      'mod',
      [
        rule({ id: 'default.age.min', field: 'age', evidence: 'min="18"', description: 'valor mínimo 18' }),
        rule({ id: 'default.age.max', field: 'age', evidence: 'max="99"', description: 'valor máximo 99' }),
      ],
      selectors
    );

    // Un solo conjunto de 5 casos con el rango real 18-99, no dos conjuntos con límites inventados
    expect(cases.length).toBe(5);
    expect(filledValues(cases)).toEqual(['17', '18', '58', '99', '100']);
    expect(cases[0].source_rule_id).toBe('default.age.min');
  });

  it('acepta minlength y maxlength emitidos como reglas separadas por campo', () => {
    const cases = generateBvaCases(
      'mod',
      [
        rule({ id: 'default.name.minlength', field: 'name', evidence: 'minlength="3"' }),
        rule({ id: 'default.name.maxlength', field: 'name', evidence: 'maxlength="20"' }),
      ],
      selectors
    );

    expect(filledValues(cases)).toEqual(['2', '3', '11', '20', '21']);
  });

  it('ignora reglas sin límites extraíbles y reglas de categorías ajenas a BVA', () => {
    const cases = generateBvaCases(
      'mod',
      [
        rule({ id: 'R1', description: 'Sin números aquí' }),
        rule({ id: 'R2', category: 'actor', evidence: 'min="1" max="5"' }),
        rule({ id: 'R3', status: 'inferred', evidence: 'min="1" max="5"' }),
      ],
      selectors
    );

    expect(cases).toEqual([]);
  });

  it('acepta reglas legacy sin category', () => {
    const cases = generateBvaCases('mod', [rule({ id: 'R1', category: undefined, evidence: 'min="1" max="5"' })], selectors);

    expect(cases.length).toBe(5);
  });

  it('usa case_category bva, source_rule_id y un UUID determinista por módulo, regla y frontera', () => {
    const rules = [rule({ id: 'R1', evidence: 'min="1" max="5"' })];

    const first = generateBvaCases('mod-a', rules, selectors);
    const again = generateBvaCases('mod-a', rules, selectors);
    const otherModule = generateBvaCases('mod-b', rules, selectors);

    expect(first.map((c) => c.id)).toEqual(again.map((c) => c.id));
    expect(first[0].id).not.toBe(otherModule[0].id);
    expect(new Set(first.map((c) => c.id)).size).toBe(5);
    expect(first.every((c) => c.source_rule_id === 'R1' && c.case_category === 'bva')).toBe(true);
    expect(first[0].id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-a[0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('resuelve el selector desde selectors.json (forma real) y usa #campo si no existe', () => {
    const known = generateBvaCases('mod', [rule({ id: 'R1', field: 'age', evidence: 'min="1" max="5"' })], selectors);
    const other = generateBvaCases('mod', [rule({ id: 'R2', field: 'score', evidence: 'min="1" max="5"' })], selectors);
    const fallback = generateBvaCases('mod', [rule({ id: 'R3', field: 'otro', evidence: 'min="1" max="5"' })], selectors);

    expect(known[0].steps[1].selector).toBe('#age-input');
    expect(other[0].steps[1].selector).toBe('[name="score"]');
    expect(fallback[0].steps[1].selector).toBe('#otro');
  });
});