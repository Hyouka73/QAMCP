import type { ModuleSelectors } from '@qap/engine';
import { SchemaValidator } from '@qap/shared';
import type { RuleEntry } from '@qap/shared';
import { describe, it, expect } from 'vitest';

import { generateBvaCases } from '../plan/bva-generator.js';

// Forma real de selectors.json: { selectors: { campo: selector, submit, error, success }, metadata }
const selectors = {
  selectors: {
    age: '#age-input',
    score: '[name="score"]',
    name: '#name-input',
    submit: '#submit-btn',
    error: '.error-message',
    success: '.success-message',
  },
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

/** Valores que se llenan en el campo, en el orden de los casos. */
function filledValues(cases: ReturnType<typeof generateBvaCases>): string[] {
  return cases.map((testCase) => testCase.steps.find((step) => step.type === 'fill')?.value ?? '');
}

describe('BvaGenerator (S81-001 / DEV-MVP-01 / DEV-MVP-01-R2)', () => {
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

  it('genera exactamente los 5 casos frontera con sus valores numéricos (min-1, min, nominal, max, max+1)', () => {
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

  it('marca los casos inválidos (min-1, max+1) con assert visible en selector de error y los válidos con visible en selector de éxito (NUNCA not_visible)', () => {
    const cases = generateBvaCases('mod', [rule({ id: 'R1', evidence: 'min="1" max="5"' })], selectors);

    expect(cases.length).toBe(5);
    const assertions = cases.map((c) => c.steps.find((s) => s.type === 'assert')?.assertion_type);
    expect(assertions).toEqual(['visible', 'visible', 'visible', 'visible', 'visible']);

    // under_min (inválido) debe apuntar al selector de error y ser visible
    expect(cases[0].steps[3].selector).toBe('.error-message');
    expect(cases[0].steps[3].assertion_type).toBe('visible');

    // min, nominal, max (válidos) deben apuntar al selector de éxito y ser visible
    expect(cases[1].steps[3].selector).toBe('.success-message');
    expect(cases[1].steps[3].assertion_type).toBe('visible');
    expect(cases[2].steps[3].selector).toBe('.success-message');
    expect(cases[2].steps[3].assertion_type).toBe('visible');
    expect(cases[3].steps[3].selector).toBe('.success-message');
    expect(cases[3].steps[3].assertion_type).toBe('visible');

    // over_max (inválido) debe apuntar al selector de error y ser visible
    expect(cases[4].steps[3].selector).toBe('.error-message');
    expect(cases[4].steps[3].assertion_type).toBe('visible');

    // Ningún paso debe usar la aserción invertida not_visible
    const notVisibleCount = cases.filter((c) => c.steps.some((s) => s.assertion_type === 'not_visible')).length;
    expect(notVisibleCount).toBe(0);
  });

  it('distingue límites de longitud (minlength/maxlength) y genera cadenas con longitud exacta ("a".repeat(length))', () => {
    const cases = generateBvaCases('mod', [rule({ id: 'R1', field: 'name', evidence: 'minlength="3" maxlength="20"' })], selectors);

    expect(cases.length).toBe(5);
    // Longitudes esperadas: 2 (under_min), 3 (min), 11 (nominal), 20 (max), 21 (over_max)
    expect(filledValues(cases)).toEqual([
      'aa',
      'aaa',
      'aaaaaaaaaaa',
      'a'.repeat(20),
      'a'.repeat(21),
    ]);
    expect(cases.map((c) => c.steps[1].value?.length)).toEqual([2, 3, 11, 20, 21]);
  });

  it('extrae mínimo y máximo numérico desde texto libre (description / condition)', () => {
    const cases = generateBvaCases(
      'mod',
      [rule({ id: 'R1', description: 'El monto debe tener un mínimo de 10', condition: 'máximo de 50' })],
      selectors
    );

    expect(cases.length).toBe(5);
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

  it('acepta minlength y maxlength emitidos como reglas separadas por campo y genera cadenas', () => {
    const cases = generateBvaCases(
      'mod',
      [
        rule({ id: 'default.name.minlength', field: 'name', evidence: 'minlength="3"' }),
        rule({ id: 'default.name.maxlength', field: 'name', evidence: 'maxlength="20"' }),
      ],
      selectors
    );

    expect(cases.length).toBe(5);
    expect(filledValues(cases)).toEqual([
      'aa',
      'aaa',
      'aaaaaaaaaaa',
      'a'.repeat(20),
      'a'.repeat(21),
    ]);
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

  it('resuelve el selector estrictamente desde selectors.json y omite casos si el selector no existe (sin fallback #campo)', () => {
    const known = generateBvaCases('mod', [rule({ id: 'R1', field: 'age', evidence: 'min="1" max="5"' })], selectors);
    const other = generateBvaCases('mod', [rule({ id: 'R2', field: 'score', evidence: 'min="1" max="5"' })], selectors);
    const fallback = generateBvaCases('mod', [rule({ id: 'R3', field: 'otro_inexistente', evidence: 'min="1" max="5"' })], selectors);

    expect(known[0].steps[1].selector).toBe('#age-input');
    expect(other[0].steps[1].selector).toBe('[name="score"]');
    // Para campo no registrado en selectors.json, se omite el caso ejecutable (fail-closed, sin fallback '#otro_inexistente')
    expect(fallback).toEqual([]);
  });

  describe('BVA 1: Límites unilaterales (sin padding artificial +/-10)', () => {
    it('genera exactamente 3 casos para límite inferior unilateral (min-1 [invalid], min [valid], min+1 [valid]) sin inventar max', () => {
      const cases = generateBvaCases('mod', [rule({ id: 'R_MIN', field: 'age', evidence: 'min="18"' })], selectors);

      expect(cases.length).toBe(3);
      expect(cases.map((c) => c.name)).toEqual([
        'BVA_R_MIN_under_min',
        'BVA_R_MIN_min',
        'BVA_R_MIN_nominal',
      ]);
      expect(filledValues(cases)).toEqual(['17', '18', '19']);

      // under_min inválido con selector de error visible
      expect(cases[0].steps[3].selector).toBe('.error-message');
      expect(cases[0].steps[3].assertion_type).toBe('visible');

      // min y nominal válidos con selector de éxito visible
      expect(cases[1].steps[3].selector).toBe('.success-message');
      expect(cases[1].steps[3].assertion_type).toBe('visible');
      expect(cases[2].steps[3].selector).toBe('.success-message');
      expect(cases[2].steps[3].assertion_type).toBe('visible');

      // No se genera ningún caso con límite superior artificial (como 28 o 29)
      expect(filledValues(cases)).not.toContain('28');
      expect(filledValues(cases)).not.toContain('29');
    });

    it('genera exactamente 3 casos para límite superior unilateral (max-1 [valid], max [valid], max+1 [invalid]) sin inventar min', () => {
      const cases = generateBvaCases('mod', [rule({ id: 'R_MAX', field: 'age', evidence: 'max="50"' })], selectors);

      expect(cases.length).toBe(3);
      expect(cases.map((c) => c.name)).toEqual([
        'BVA_R_MAX_nominal',
        'BVA_R_MAX_max',
        'BVA_R_MAX_over_max',
      ]);
      expect(filledValues(cases)).toEqual(['49', '50', '51']);

      // nominal y max válidos con selector de éxito visible
      expect(cases[0].steps[3].selector).toBe('.success-message');
      expect(cases[0].steps[3].assertion_type).toBe('visible');
      expect(cases[1].steps[3].selector).toBe('.success-message');
      expect(cases[1].steps[3].assertion_type).toBe('visible');

      // over_max inválido con selector de error visible
      expect(cases[2].steps[3].selector).toBe('.error-message');
      expect(cases[2].steps[3].assertion_type).toBe('visible');

      // No se genera ningún caso con límite inferior artificial (como 40 o 39)
      expect(filledValues(cases)).not.toContain('40');
      expect(filledValues(cases)).not.toContain('39');
    });

    it('genera casos unilaterales de longitud para minlength únicamente', () => {
      const cases = generateBvaCases('mod', [rule({ id: 'R_LEN', field: 'name', evidence: 'minlength="4"' })], selectors);

      expect(cases.length).toBe(3);
      expect(filledValues(cases)).toEqual(['aaa', 'aaaa', 'aaaaa']);
      expect(cases.map((c) => c.steps[1].value?.length)).toEqual([3, 4, 5]);
    });

    it('genera casos unilaterales de longitud para maxlength únicamente', () => {
      const cases = generateBvaCases('mod', [rule({ id: 'R_LEN_MAX', field: 'name', evidence: 'maxlength="6"' })], selectors);

      expect(cases.length).toBe(3);
      expect(filledValues(cases)).toEqual(['aaaaa', 'aaaaaa', 'aaaaaaa']);
      expect(cases.map((c) => c.steps[1].value?.length)).toEqual([5, 6, 7]);
    });
  });

  describe('BVA 5: Detección y rechazo fail-closed de reglas contradictorias', () => {
    it('falla fail-closed si dos reglas para el mismo campo tienen valores min contradictorios', () => {
      const conflictingRules: RuleEntry[] = [
        rule({ id: 'R1', field: 'age', evidence: 'min="18"' }),
        rule({ id: 'R2', field: 'age', evidence: 'min="21"' }),
      ];

      const cases = generateBvaCases('mod', conflictingRules, selectors);
      expect(cases).toEqual([]);
    });

    it('falla fail-closed si dos reglas para el mismo campo tienen valores max contradictorios', () => {
      const conflictingRules: RuleEntry[] = [
        rule({ id: 'R1', field: 'age', evidence: 'max="50"' }),
        rule({ id: 'R2', field: 'age', evidence: 'max="65"' }),
      ];

      const cases = generateBvaCases('mod', conflictingRules, selectors);
      expect(cases).toEqual([]);
    });

    it('falla fail-closed si min > max para el mismo campo (rango invertido)', () => {
      const invertedRules: RuleEntry[] = [
        rule({ id: 'R1', field: 'age', evidence: 'min="100"' }),
        rule({ id: 'R2', field: 'age', evidence: 'max="50"' }),
      ];

      const cases = generateBvaCases('mod', invertedRules, selectors);
      expect(cases).toEqual([]);
    });

    it('falla fail-closed si se mezclan tipos incompatibles (numérico vs longitud) en el mismo campo', () => {
      const mixedTypeRules: RuleEntry[] = [
        rule({ id: 'R1', field: 'age', evidence: 'min="18"' }),
        rule({ id: 'R2', field: 'age', evidence: 'minlength="3"' }),
      ];

      const cases = generateBvaCases('mod', mixedTypeRules, selectors);
      expect(cases).toEqual([]);
    });

    it('acepta reglas redundantes que declaran exactamente el mismo límite sin conflicto', () => {
      const consistentRules: RuleEntry[] = [
        rule({ id: 'R1', field: 'age', evidence: 'min="18"' }),
        rule({ id: 'R2', field: 'age', evidence: 'min="18"' }),
      ];

      const cases = generateBvaCases('mod', consistentRules, selectors);
      expect(cases.length).toBe(3);
      expect(filledValues(cases)).toEqual(['17', '18', '19']);
    });
  });

  describe('BVA 3 & BVA 6: Acreditación estricta de selectores y oráculos', () => {
    it('no emite casos si selectors no incluye el botón de submit', () => {
      const selectorsWithoutSubmit = {
        selectors: { age: '#age-input', error: '.error-message', success: '.success-message' },
      } as unknown as ModuleSelectors;

      const cases = generateBvaCases('mod', [rule({ id: 'R1', evidence: 'min="1" max="5"' })], selectorsWithoutSubmit);
      expect(cases).toEqual([]);
    });

    it('no emite casos para límites válidos si selectors no incluye oráculo de éxito', () => {
      const selectorsWithoutSuccess = {
        selectors: { age: '#age-input', submit: '#submit', error: '.error-message' },
      } as unknown as ModuleSelectors;

      const cases = generateBvaCases('mod', [rule({ id: 'R1', evidence: 'min="1" max="5"' })], selectorsWithoutSuccess);
      // Solo se emiten los 2 casos inválidos (under_min, over_max) porque solo el oráculo de error está acreditado
      expect(cases.length).toBe(2);
      expect(cases.map((c) => c.name)).toEqual(['BVA_R1_under_min', 'BVA_R1_over_max']);
      expect(cases.every((c) => c.steps[3].selector === '.error-message')).toBe(true);
    });

    it('no emite casos para límites inválidos si selectors no incluye oráculo de error', () => {
      const selectorsWithoutError = {
        selectors: { age: '#age-input', submit: '#submit', success: '.success-message' },
      } as unknown as ModuleSelectors;

      const cases = generateBvaCases('mod', [rule({ id: 'R1', evidence: 'min="1" max="5"' })], selectorsWithoutError);
      // Solo se emiten los 3 casos válidos (min, nominal, max) porque solo el oráculo de éxito está acreditado
      expect(cases.length).toBe(3);
      expect(cases.map((c) => c.name)).toEqual(['BVA_R1_min', 'BVA_R1_nominal', 'BVA_R1_max']);
      expect(cases.every((c) => c.steps[3].selector === '.success-message')).toBe(true);
    });

    it('retorna vacío si selectors no tiene selectores configurados', () => {
      const emptySelectors = { selectors: {} } as unknown as ModuleSelectors;
      const cases = generateBvaCases('mod', [rule({ id: 'R1', evidence: 'min="1" max="5"' })], emptySelectors);
      expect(cases).toEqual([]);
    });
  });

  describe('Validación estricta de SchemaValidator para todos los casos generados', () => {
    it('todos los casos bilaterales, unilaterales y de longitud pasan SchemaValidator sin errores', () => {
      const mixedRules: RuleEntry[] = [
        rule({ id: 'R_TWO', field: 'age', evidence: 'min="18" max="99"' }),
        rule({ id: 'R_MIN', field: 'age', evidence: 'min="21"' }), // Este field tiene conflicto con R_TWO -> fail-closed
        rule({ id: 'R_SCORE', field: 'score', evidence: 'max="10"' }),
        rule({ id: 'R_NAME', field: 'name', evidence: 'minlength="3" maxlength="20"' }),
      ];

      const cases = generateBvaCases('mod', mixedRules, selectors);
      // R_TWO + R_MIN = conflicto en 'age' -> 0 casos de age
      // R_SCORE = 3 casos unilaterales max
      // R_NAME = 5 casos de longitud
      expect(cases.length).toBe(8);

      const validator = new SchemaValidator();
      for (const tc of cases) {
        const res = validator.validateTcCase(tc);
        expect(res.valid).toBe(true);
        expect(res.errors).toEqual([]);
      }
    });
  });

  describe('DEV-MVP-01-R2: Regresiones P1/P2 (decimales, minlength=0, contradicción interna y procedencia)', () => {
    it('H02: preserva límites decimales exactos (ej. min="0.5" max="2.5") sin truncarlos con parseInt', () => {
      const cases = generateBvaCases(
        'mod',
        [rule({ id: 'R-DEC', field: 'age', evidence: 'min="0.5" max="2.5"' })],
        selectors
      );

      expect(cases.length).toBe(5);
      expect(filledValues(cases)).toEqual(['0.4', '0.5', '1.5', '2.5', '2.6']);

      const minCase = cases.find((c) => c.name === 'BVA_R-DEC_min');
      expect(minCase?.steps[1].value).toBe('0.5');
      expect(minCase?.steps[3].selector).toBe('.success-message');

      const underMinCase = cases.find((c) => c.name === 'BVA_R-DEC_under_min');
      expect(underMinCase?.steps[1].value).toBe('0.4');
      expect(underMinCase?.steps[3].selector).toBe('.error-message');
    });

    it('H03: no emite under_min imposible ni oráculos opuestos para cadena vacía cuando minlength="0"', () => {
      const cases = generateBvaCases(
        'mod',
        [rule({ id: 'R-ZERO-LEN', field: 'name', evidence: 'minlength="0"' })],
        selectors
      );

      expect(cases.some((c) => c.name.endsWith('_under_min'))).toBe(false);
      expect(cases.map((c) => c.name)).toEqual(['BVA_R-ZERO-LEN_min', 'BVA_R-ZERO-LEN_nominal']);
      expect(filledValues(cases)).toEqual(['', 'a']);
      expect(cases.every((c) => c.steps[3].selector === '.success-message')).toBe(true);
    });

    it('H08: rechaza fail-closed contradicciones internas entre evidencia DOM y descripción textual de la misma regla', () => {
      const conflictingInternalRule = rule({
        id: 'R-INT-CONFLICT',
        field: 'age',
        description: 'El importe tiene un mínimo de 18',
        evidence: 'min="10"',
      });

      const cases = generateBvaCases('mod', [conflictingInternalRule], selectors);
      expect(cases).toEqual([]);
    });

    it('H09: filtra reglas cuya procedencia (source) no está acreditada (ej. source: "agent" o "dom")', () => {
      const agentRule = rule({
        id: 'R-AGENT',
        field: 'age',
        source: 'agent',
        status: 'confirmed',
        evidence: 'min="10" max="20"',
      });
      const domRule = rule({
        id: 'R-DOM',
        field: 'age',
        source: 'dom',
        status: 'confirmed',
        evidence: 'min="10" max="20"',
      });
      const userConfirmedRule = rule({
        id: 'R-USER',
        field: 'age',
        source: 'user_confirmed',
        status: 'confirmed',
        evidence: 'min="10" max="20"',
      });

      expect(generateBvaCases('mod', [agentRule], selectors)).toEqual([]);
      expect(generateBvaCases('mod', [domRule], selectors)).toEqual([]);
      expect(generateBvaCases('mod', [userConfirmedRule], selectors).length).toBe(5);
    });
  });

  describe('DEV-MVP-01-R3: Cierre de hallazgos R2-01, R2-02, R2-04 y R2-05', () => {
    it('R2-01 (H02): soporta notación exponencial completa (ej. min="1e2" max="2e2") sin truncar a la mantisa', () => {
      const cases = generateBvaCases(
        'mod',
        [rule({ id: 'R-EXP', field: 'age', evidence: 'min="1e2" max="2e2"' })],
        selectors
      );

      expect(cases.length).toBe(5);
      expect(filledValues(cases)).toEqual(['99', '100', '150', '200', '201']);
      expect(cases.find((c) => c.name === 'BVA_R-EXP_min')?.steps[1].value).toBe('100');
      expect(cases.find((c) => c.name === 'BVA_R-EXP_max')?.steps[1].value).toBe('200');
    });

    it('R2-01 (H02): rechaza fail-closed tokens numéricos malformados o con sufijos inválidos sin reinterpretar su prefijo', () => {
      const malformedEvidence = [
        'min="10px" max="20px"',
        'min="1.2.3" max="5"',
        'min="1e2abc" max="200"',
        'min="1,000" max="2,000"',
      ];

      for (const evidence of malformedEvidence) {
        const cases = generateBvaCases('mod', [rule({ id: 'R-MAL', field: 'age', evidence })], selectors);
        expect(cases).toEqual([]);
      }
    });

    it('R2-02 (H02): alinea el valor nominal a la retícula válida de step desde min y rechaza rangos incompatibles con step', () => {
      const stepCases = generateBvaCases(
        'mod',
        [rule({ id: 'R-STEP', field: 'age', evidence: 'min="0" max="6" step="2"' })],
        selectors
      );

      expect(stepCases.length).toBe(5);
      expect(filledValues(stepCases)).toEqual(['-2', '0', '2', '6', '8']);
      const validStepCases = stepCases.filter((c) => c.steps[3].selector === '.success-message');
      expect(validStepCases.every((c) => Number(c.steps[1].value) % 2 === 0)).toBe(true);

      // max=5 no es alcanzable desde min=0 con step=2 -> fail-closed
      const misaligned = generateBvaCases(
        'mod',
        [rule({ id: 'R-MISALIGNED', field: 'age', evidence: 'min="0" max="5" step="2"' })],
        selectors
      );
      expect(misaligned).toEqual([]);
    });

    it('R2-04 (H08): rechaza fail-closed contradicciones dentro del mismo nivel (múltiples atributos en evidence o description vs condition)', () => {
      const duplicateEvidence = generateBvaCases(
        'mod',
        [rule({ id: 'R-DUP-EV', field: 'age', evidence: 'min="10" min="18"' })],
        selectors
      );
      expect(duplicateEvidence).toEqual([]);

      const descVsCond = generateBvaCases(
        'mod',
        [
          rule({
            id: 'R-DESC-COND',
            field: 'age',
            description: 'Importe mínimo de 10',
            condition: 'Importe mínimo de 18',
          }),
        ],
        selectors
      );
      expect(descVsCond).toEqual([]);
    });

    it('R2-05 (Regresión): genera límites de longitud para reglas textuales de uno y varios dígitos sin falso conflicto string/number', () => {
      const multiDigitLen = generateBvaCases(
        'mod',
        [rule({ id: 'R-LEN-18', field: 'name', description: 'Longitud mínimo de 18 caracteres' })],
        selectors
      );

      expect(multiDigitLen.length).toBe(3);
      expect(multiDigitLen.map((c) => c.steps[1].value?.length)).toEqual([17, 18, 19]);
      expect(multiDigitLen.find((c) => c.name === 'BVA_R-LEN-18_min')?.steps[1].value).toBe('a'.repeat(18));

      const singleDigitLen = generateBvaCases(
        'mod',
        [rule({ id: 'R-LEN-5', field: 'name', description: 'Longitud mínima de 5 caracteres y máxima de 12 caracteres' })],
        selectors
      );
      expect(singleDigitLen.length).toBe(5);
      expect(singleDigitLen.map((c) => c.steps[1].value?.length)).toEqual([4, 5, 8, 12, 13]);

      // Longitud textual decimal se rechaza fail-closed
      const decimalLen = generateBvaCases(
        'mod',
        [rule({ id: 'R-LEN-DEC', field: 'name', description: 'Longitud mínimo de 1.5 caracteres' })],
        selectors
      );
      expect(decimalLen).toEqual([]);
    });
  });
});
