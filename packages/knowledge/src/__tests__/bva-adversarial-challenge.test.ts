import type { ModuleSelectors } from '@qap/engine';
import { SchemaValidator } from '@qap/shared';
import type { RuleEntry, TCCase } from '@qap/shared';
import { describe, expect, it } from 'vitest';

import { generateBvaCases } from '../plan/bva-generator.js';

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const fullSelectors = {
  selectors: {
    age: '#age-input',
    score: '[name="score"]',
    balance: '#balance-input',
    quantity: '#qty-input',
    username: '#username-input',
    notes: '#notes-textarea',
    submit: '#submit-btn',
    error: '.error-banner',
    success: '.success-banner',
  },
  metadata: { generated_at: '2026-11-09T00:00:00.000Z', source: 'challenger' },
} as unknown as ModuleSelectors;

function createConfirmedRule(id: string, field: string, overrides: Partial<RuleEntry> = {}): RuleEntry {
  return {
    id,
    description: `Regla de prueba para ${field}`,
    status: 'confirmed',
    category: 'campo',
    field,
    ...overrides,
  };
}

describe('Empirical Challenger: BVA Generator Adversarial Stress Suite', () => {
  const validator = new SchemaValidator();

  function verifyTcCaseIntegrity(tcCase: TCCase, expectedCategory = 'bva'): void {
    const res = validator.validateTcCase(tcCase);
    expect(res.valid, `SchemaValidator failed: ${JSON.stringify(res.errors)}`).toBe(true);
    expect(res.errors).toEqual([]);
    expect(tcCase.id).toMatch(UUID_V4_REGEX);
    expect(tcCase._version).toBe('1');
    expect(tcCase.case_category).toBe(expectedCategory);
    expect(tcCase.steps.length).toBe(4);

    // Sequence check: navigate -> fill -> click -> assert
    expect(tcCase.steps[0].type).toBe('navigate');
    expect(tcCase.steps[1].type).toBe('fill');
    expect(tcCase.steps[2].type).toBe('click');
    expect(tcCase.steps[3].type).toBe('assert');

    // Assertion oracle check: MUST NEVER be not_visible
    expect(tcCase.steps[3].assertion_type).toBe('visible');
    expect(tcCase.steps[3].assertion_type).not.toBe('not_visible');
  }

  // =========================================================================
  // Challenge 1: Artificial Boundary Emission Attacks
  // =========================================================================
  describe('Challenge 1: Artificial Boundary Emission Attacks', () => {
    it('ATTACK 1.1: Tricking unilateral min with large values (min=1000) does not synthesize max=1010', () => {
      const rule = createConfirmedRule('R-LARGE-MIN', 'quantity', { evidence: 'min="1000"' });
      const cases = generateBvaCases('mod', [rule], fullSelectors);

      expect(cases.length).toBe(3);
      const values = cases.map((c) => c.steps[1].value);
      expect(values).toEqual(['999', '1000', '1001']);

      // Absolutely no artificial max bounds (e.g. 1010, 1011)
      expect(values).not.toContain('1010');
      expect(values).not.toContain('1011');
      cases.forEach((c) => verifyTcCaseIntegrity(c));
    });

    it('ATTACK 1.2: Tricking unilateral max with small values (max=5) does not synthesize min=-5 or 0', () => {
      const rule = createConfirmedRule('R-SMALL-MAX', 'quantity', { evidence: 'max="5"' });
      const cases = generateBvaCases('mod', [rule], fullSelectors);

      expect(cases.length).toBe(3);
      const values = cases.map((c) => c.steps[1].value);
      expect(values).toEqual(['4', '5', '6']);

      // Under no circumstances should lower boundaries like -5 or -6 be synthesized
      expect(values).not.toContain('-5');
      expect(values).not.toContain('-6');
      cases.forEach((c) => verifyTcCaseIntegrity(c));
    });

    it('ATTACK 1.3: Text containing distractor numbers does not trick boundary extractor', () => {
      // Text with version numbers, dates, port numbers, but clear Spanish limit
      const rule = createConfirmedRule('R-DISTRACTOR', 'score', {
        description: 'V2.1 del 2026 en puerto 8080: el puntaje debe tener un mínimo de 15 puntos para aprobar el examen 3',
      });
      const cases = generateBvaCases('mod', [rule], fullSelectors);

      expect(cases.length).toBe(3);
      const values = cases.map((c) => c.steps[1].value);
      // Must extract min=15: under_min=14, min=15, nominal=16
      expect(values).toEqual(['14', '15', '16']);
      cases.forEach((c) => verifyTcCaseIntegrity(c));
    });

    it('ATTACK 1.4: Word boundary protection prevents false matches on words containing "min" or "max"', () => {
      const distractorRules: RuleEntry[] = [
        createConfirmedRule('R-ADMIN', 'score', {
          description: 'El administrador debe configurar el puerto',
          evidence: 'admin="1" max_users="50" min_retries="3"',
        }),
      ];
      // min_retries or max_users should not match plain \bmin\b without boundary
      // Let's verify fail-closed or proper behavior
      const cases = generateBvaCases('mod', distractorRules, fullSelectors);
      // 'score' has no clean min/max in evidence -> should not emit cases
      expect(cases).toEqual([]);
    });
  });

  // =========================================================================
  // Challenge 2: Extreme Boundary Cases
  // =========================================================================
  describe('Challenge 2: Extreme Boundary Cases', () => {
    it('ATTACK 2.1: Zero-width boundary [min=0, max=0]', () => {
      const rule = createConfirmedRule('R-ZERO-ZERO', 'score', { evidence: 'min="0" max="0"' });
      const cases = generateBvaCases('mod', [rule], fullSelectors);

      expect(cases.length).toBe(5);
      const values = cases.map((c) => c.steps[1].value);
      // Under min: -1, min: 0, nominal: 0, max: 0, over_max: 1
      expect(values).toEqual(['-1', '0', '0', '0', '1']);

      // Ensure all 5 generated test cases have unique IDs despite overlapping nominal/min/max
      const ids = cases.map((c) => c.id);
      expect(new Set(ids).size).toBe(5);

      // Verify oracle assignments
      expect(cases[0].steps[3].selector).toBe('.error-banner'); // under_min: -1
      expect(cases[1].steps[3].selector).toBe('.success-banner'); // min: 0
      expect(cases[2].steps[3].selector).toBe('.success-banner'); // nominal: 0
      expect(cases[3].steps[3].selector).toBe('.success-banner'); // max: 0
      expect(cases[4].steps[3].selector).toBe('.error-banner'); // over_max: 1

      cases.forEach((c) => verifyTcCaseIntegrity(c));
    });

    it('ATTACK 2.2: Unilateral min=0 boundary', () => {
      const rule = createConfirmedRule('R-MIN-ZERO', 'score', { evidence: 'min="0"' });
      const cases = generateBvaCases('mod', [rule], fullSelectors);

      expect(cases.length).toBe(3);
      const values = cases.map((c) => c.steps[1].value);
      expect(values).toEqual(['-1', '0', '1']);

      expect(cases[0].steps[3].selector).toBe('.error-banner');
      expect(cases[1].steps[3].selector).toBe('.success-banner');
      expect(cases[2].steps[3].selector).toBe('.success-banner');

      cases.forEach((c) => verifyTcCaseIntegrity(c));
    });

    it('ATTACK 2.3: Unilateral max=0 boundary', () => {
      const rule = createConfirmedRule('R-MAX-ZERO', 'balance', { evidence: 'max="0"' });
      const cases = generateBvaCases('mod', [rule], fullSelectors);

      expect(cases.length).toBe(3);
      const values = cases.map((c) => c.steps[1].value);
      expect(values).toEqual(['-1', '0', '1']);

      expect(cases[0].steps[3].selector).toBe('.success-banner'); // nominal (-1) <= 0 -> valid
      expect(cases[1].steps[3].selector).toBe('.success-banner'); // max (0) <= 0 -> valid
      expect(cases[2].steps[3].selector).toBe('.error-banner'); // over_max (1) > 0 -> invalid

      cases.forEach((c) => verifyTcCaseIntegrity(c));
    });

    it('ATTACK 2.4: Negative limit range [min=-10, max=-1]', () => {
      const rule = createConfirmedRule('R-NEG-RANGE', 'balance', { evidence: 'min="-10" max="-1"' });
      const cases = generateBvaCases('mod', [rule], fullSelectors);

      expect(cases.length).toBe(5);
      const values = cases.map((c) => c.steps[1].value);
      // under_min: -11, min: -10, nominal: Math.floor((-10 + -1)/2) = -6, max: -1, over_max: 0
      expect(values).toEqual(['-11', '-10', '-6', '-1', '0']);

      expect(cases[0].steps[3].selector).toBe('.error-banner'); // -11 < -10
      expect(cases[1].steps[3].selector).toBe('.success-banner'); // -10
      expect(cases[2].steps[3].selector).toBe('.success-banner'); // -6
      expect(cases[3].steps[3].selector).toBe('.success-banner'); // -1
      expect(cases[4].steps[3].selector).toBe('.error-banner'); // 0 > -1

      cases.forEach((c) => verifyTcCaseIntegrity(c));
    });

    it('ATTACK 2.5: Extreme large numbers (min=1000000)', () => {
      const rule = createConfirmedRule('R-MILLION', 'balance', { evidence: 'min="1000000"' });
      const cases = generateBvaCases('mod', [rule], fullSelectors);

      expect(cases.length).toBe(3);
      const values = cases.map((c) => c.steps[1].value);
      expect(values).toEqual(['999999', '1000000', '1000001']);
      cases.forEach((c) => verifyTcCaseIntegrity(c));
    });

    it('ATTACK 2.6: Floating points and decimals in evidence (min="0.5") preserves exact decimal boundary', () => {
      // Input has floating point attribute: HTML type="number" step="0.1" min="0.5"
      const rule = createConfirmedRule('R-FLOAT', 'score', { evidence: 'min="0.5"' });
      const cases = generateBvaCases('mod', [rule], fullSelectors);

      // Must preserve decimal 0.5 with step 0.1 (under_min=0.4, min=0.5, nominal=0.6)
      expect(cases.length).toBe(3);
      const values = cases.map((c) => c.steps[1].value);
      expect(values).toEqual(['0.4', '0.5', '0.6']);
      expect(cases[0].steps[3].selector).toBe('.error-banner');
      expect(cases[1].steps[3].selector).toBe('.success-banner');
      expect(cases[2].steps[3].selector).toBe('.success-banner');
      cases.forEach((c) => verifyTcCaseIntegrity(c));
    });

    it('ATTACK 2.7: String length minlength="0" omits impossible under_min (< 0) and avoids contradictory empty string oracles', () => {
      const rule = createConfirmedRule('R-STR-ZERO', 'notes', { evidence: 'minlength="0"' });
      const cases = generateBvaCases('mod', [rule], fullSelectors);

      // Length < 0 does not exist: only min (0 -> '') and nominal (1 -> 'a') are emitted, both valid
      expect(cases.length).toBe(2);
      expect(cases.some((c) => c.name.endsWith('_under_min'))).toBe(false);
      const values = cases.map((c) => c.steps[1].value);
      expect(values).toEqual(['', 'a']);
      expect(cases.every((c) => c.steps[3].selector === '.success-banner')).toBe(true);

      // SchemaValidator accepts empty string in step value
      cases.forEach((c) => verifyTcCaseIntegrity(c));
    });
  });

  // =========================================================================
  // Challenge 3: Contradictory Boundaries & Fail-Closed Robustness
  // =========================================================================
  describe('Challenge 3: Contradictory Boundaries & Fail-Closed Robustness', () => {
    it('ATTACK 3.1: Inverted range min > max in single rule fails closed with 0 cases', () => {
      const rule = createConfirmedRule('R-INVERTED-1', 'age', { evidence: 'min="50" max="20"' });
      const cases = generateBvaCases('mod', [rule], fullSelectors);
      expect(cases).toEqual([]);
    });

    it('ATTACK 3.2: Inverted range min > max across two rules for same field fails closed', () => {
      const rule1 = createConfirmedRule('R-MIN-60', 'age', { evidence: 'min="60"' });
      const rule2 = createConfirmedRule('R-MAX-40', 'age', { evidence: 'max="40"' });
      const cases = generateBvaCases('mod', [rule1, rule2], fullSelectors);
      expect(cases).toEqual([]);
    });

    it('ATTACK 3.3: Multiple conflicting min rules for same field fails closed', () => {
      const rule1 = createConfirmedRule('R-MIN-18', 'age', { evidence: 'min="18"' });
      const rule2 = createConfirmedRule('R-MIN-21', 'age', { evidence: 'min="21"' });
      const rule3 = createConfirmedRule('R-MIN-25', 'age', { evidence: 'min="25"' });
      const cases = generateBvaCases('mod', [rule1, rule2, rule3], fullSelectors);
      expect(cases).toEqual([]);
    });

    it('ATTACK 3.4: Conflicting string length vs numeric limit on same field fails closed', () => {
      const numRule = createConfirmedRule('R-NUM', 'score', { evidence: 'min="1" max="10"' });
      const strRule = createConfirmedRule('R-STR', 'score', { evidence: 'minlength="1" maxlength="10"' });
      const cases = generateBvaCases('mod', [numRule, strRule], fullSelectors);
      expect(cases).toEqual([]);
    });

    it('ATTACK 3.5: Contradiction in Field A does NOT leak or invalidate valid Field B', () => {
      const conflictingFieldRules = [
        createConfirmedRule('R-AGE-1', 'age', { evidence: 'min="50"' }),
        createConfirmedRule('R-AGE-2', 'age', { evidence: 'min="20"' }),
      ];
      const validFieldRule = createConfirmedRule('R-SCORE-VALID', 'score', { evidence: 'min="1" max="5"' });

      const cases = generateBvaCases('mod', [...conflictingFieldRules, validFieldRule], fullSelectors);

      // 'age' should be skipped fail-closed (0 cases)
      // 'score' should generate exactly 5 valid cases
      expect(cases.length).toBe(5);
      expect(cases.every((c) => c.tags?.includes('score'))).toBe(true);
      expect(cases.some((c) => c.tags?.includes('age'))).toBe(false);

      cases.forEach((c) => verifyTcCaseIntegrity(c));
    });
  });

  // =========================================================================
  // Challenge 4: Missing Selectors, Empty Rules, Undefined Options
  // =========================================================================
  describe('Challenge 4: Missing Selectors, Empty Rules, Undefined Options', () => {
    it('ATTACK 4.1: Empty rules array returns empty array without throwing', () => {
      expect(generateBvaCases('mod', [], fullSelectors)).toEqual([]);
    });

    it('ATTACK 4.2: Rules with empty or missing field property are skipped safely', () => {
      const emptyFieldRule = {
        id: 'R-NO-FIELD',
        description: 'Regla sin campo',
        status: 'confirmed',
        category: 'campo',
        field: '',
        evidence: 'min="1" max="5"',
      } as unknown as RuleEntry;

      const undefinedFieldRule = {
        id: 'R-UNDEF-FIELD',
        description: 'Regla campo undefined',
        status: 'confirmed',
        category: 'campo',
        field: undefined,
        evidence: 'min="1" max="5"',
      } as unknown as RuleEntry;

      const cases = generateBvaCases('mod', [emptyFieldRule, undefinedFieldRule], fullSelectors);
      expect(cases).toEqual([]);
    });

    it('ATTACK 4.3: Missing submit button selector fails closed with 0 cases', () => {
      const selectorsNoSubmit = {
        selectors: {
          age: '#age-input',
          error: '.error-banner',
          success: '.success-banner',
        },
      } as unknown as ModuleSelectors;

      const rule = createConfirmedRule('R-AGE', 'age', { evidence: 'min="18" max="65"' });
      expect(generateBvaCases('mod', [rule], selectorsNoSubmit)).toEqual([]);
    });

    it('ATTACK 4.4: Missing field selector in selectors.json fails closed (no #field fallback)', () => {
      const rule = createConfirmedRule('R-UNKNOWN', 'non_existent_field', { evidence: 'min="1" max="5"' });
      expect(generateBvaCases('mod', [rule], fullSelectors)).toEqual([]);
    });

    it('ATTACK 4.5: Partial oracles: missing error selector emits ONLY valid cases', () => {
      const selectorsNoErr = {
        selectors: {
          age: '#age-input',
          submit: '#submit-btn',
          success: '.success-banner',
        },
      } as unknown as ModuleSelectors;

      const rule = createConfirmedRule('R-AGE', 'age', { evidence: 'min="18" max="65"' });
      const cases = generateBvaCases('mod', [rule], selectorsNoErr);

      // Only min (18), nominal (41), max (65) are emitted (3 cases)
      expect(cases.length).toBe(3);
      expect(cases.map((c) => c.name)).toEqual(['BVA_R-AGE_min', 'BVA_R-AGE_nominal', 'BVA_R-AGE_max']);
      expect(cases.every((c) => c.steps[3].selector === '.success-banner')).toBe(true);
      cases.forEach((c) => verifyTcCaseIntegrity(c));
    });

    it('ATTACK 4.6: Partial oracles: missing success selector emits ONLY invalid cases', () => {
      const selectorsNoSuccess = {
        selectors: {
          age: '#age-input',
          submit: '#submit-btn',
          error: '.error-banner',
        },
      } as unknown as ModuleSelectors;

      const rule = createConfirmedRule('R-AGE', 'age', { evidence: 'min="18" max="65"' });
      const cases = generateBvaCases('mod', [rule], selectorsNoSuccess);

      // Only under_min (17), over_max (66) are emitted (2 cases)
      expect(cases.length).toBe(2);
      expect(cases.map((c) => c.name)).toEqual(['BVA_R-AGE_under_min', 'BVA_R-AGE_over_max']);
      expect(cases.every((c) => c.steps[3].selector === '.error-banner')).toBe(true);
      cases.forEach((c) => verifyTcCaseIntegrity(c));
    });

    it('ATTACK 4.7: Neither success nor error selector accredited fails closed with 0 cases', () => {
      const selectorsNoOracles = {
        selectors: {
          age: '#age-input',
          submit: '#submit-btn',
        },
      } as unknown as ModuleSelectors;

      const rule = createConfirmedRule('R-AGE', 'age', { evidence: 'min="18" max="65"' });
      expect(generateBvaCases('mod', [rule], selectorsNoOracles)).toEqual([]);
    });

    it('ATTACK 4.8: Supports nested object selectors format: { selectors: { age: { selector: "#age-id" } } }', () => {
      const nestedSelectors = {
        selectors: {
          age: { selector: '#nested-age' },
          submit: { selector: '#nested-submit' },
          error: { selector: '#nested-error' },
          success: { selector: '#nested-success' },
        },
      } as unknown as ModuleSelectors;

      const rule = createConfirmedRule('R-AGE', 'age', { evidence: 'min="18" max="65"' });
      const cases = generateBvaCases('mod', [rule], nestedSelectors);

      expect(cases.length).toBe(5);
      expect(cases[0].steps[1].selector).toBe('#nested-age');
      expect(cases[0].steps[2].selector).toBe('#nested-submit');
      expect(cases[0].steps[3].selector).toBe('#nested-error');
      expect(cases[1].steps[3].selector).toBe('#nested-success');
      cases.forEach((c) => verifyTcCaseIntegrity(c));
    });

    it('ATTACK 4.9: Whitespace-only or empty string selectors are treated as missing (fail closed)', () => {
      const whitespaceSelectors = {
        selectors: {
          age: '   ',
          submit: '  ',
          error: '',
          success: '\t\n',
        },
      } as unknown as ModuleSelectors;

      const rule = createConfirmedRule('R-AGE', 'age', { evidence: 'min="18" max="65"' });
      const cases = generateBvaCases('mod', [rule], whitespaceSelectors);
      expect(cases).toEqual([]);
    });

    it('ATTACK 4.10: Prototype pollution resistance on field names (__proto__, constructor, toString)', () => {
      const dangerousFields = ['__proto__', 'constructor', 'toString', 'valueOf'];
      for (const field of dangerousFields) {
        const rule = createConfirmedRule(`R-${field}`, field, { evidence: 'min="1" max="10"' });
        const cases = generateBvaCases('mod', [rule], fullSelectors);
        expect(cases).toEqual([]);
      }
    });

    it('ATTACK 4.11: Non-numeric strings in min/max attributes (min="abc", min="", min="--")', () => {
      const malformedRules = [
        createConfirmedRule('R-M1', 'age', { evidence: 'min="abc" max="def"' }),
        createConfirmedRule('R-M2', 'age', { evidence: 'min="" max=""' }),
        createConfirmedRule('R-M3', 'age', { evidence: 'min="--"' }),
      ];

      for (const rule of malformedRules) {
        const cases = generateBvaCases('mod', [rule], fullSelectors);
        expect(cases).toEqual([]);
      }
    });

    it('ATTACK 4.12: Strict category enforcement rejects non-BVA categories even when confirmed with bounds', () => {
      const nonBvaCategories: RuleEntry['category'][] = ['actor', 'proposito', 'accion', 'sensibilidad'];
      for (const cat of nonBvaCategories) {
        const rule = createConfirmedRule(`R-${cat}`, 'age', {
          category: cat,
          evidence: 'min="18" max="65"',
        });
        const cases = generateBvaCases('mod', [rule], fullSelectors);
        expect(cases).toEqual([]);
      }
    });

    it('ATTACK 4.13: Multiple rules where rule 1 & 2 match, but rule 3 contradicts, triggers fail-closed', () => {
      const rule1 = createConfirmedRule('R-1', 'age', { evidence: 'min="18"' });
      const rule2 = createConfirmedRule('R-2', 'age', { evidence: 'min="18"' });
      const rule3 = createConfirmedRule('R-3', 'age', { evidence: 'min="21"' });

      const cases = generateBvaCases('mod', [rule1, rule2, rule3], fullSelectors);
      expect(cases).toEqual([]);
    });
  });

  // =========================================================================
  // Challenge 5: Invariant Oracle Verification: NEVER assert not_visible
  // =========================================================================
  describe('Challenge 5: Invariant Oracle Verification: NEVER assert not_visible', () => {
    it('CRITICAL: Exhaustively checks that no generated step across any scenario ever asserts "not_visible"', () => {
      const testScenarios: RuleEntry[][] = [
        [createConfirmedRule('R-1', 'age', { evidence: 'min="18" max="65"' })],
        [createConfirmedRule('R-2', 'age', { evidence: 'min="18"' })],
        [createConfirmedRule('R-3', 'age', { evidence: 'max="65"' })],
        [createConfirmedRule('R-4', 'username', { evidence: 'minlength="3" maxlength="15"' })],
        [createConfirmedRule('R-5', 'username', { evidence: 'minlength="3"' })],
        [createConfirmedRule('R-6', 'username', { evidence: 'maxlength="15"' })],
        [createConfirmedRule('R-7', 'score', { description: 'El puntaje debe estar entre 0 y 100' })],
        [createConfirmedRule('R-8', 'score', { description: 'mínimo de 10 caracteres', category: 'campo' })],
      ];

      for (const rules of testScenarios) {
        const cases = generateBvaCases('mod-invariants', rules, fullSelectors);
        for (const tcCase of cases) {
          for (const step of tcCase.steps) {
            expect(step.assertion_type).not.toBe('not_visible');
            if (step.type === 'assert') {
              expect(step.assertion_type).toBe('visible');
            }
          }
        }
      }
    });
  });

  // =========================================================================
  // Challenge 6: Stress & Fuzzing Generator
  // =========================================================================
  describe('Challenge 6: Stress & Fuzzing Generator (200 Randomized Runs)', () => {
    it('runs 200 fuzz iterations with random bounds, conflicting configs, and verifies schema + invariants', () => {
      const statuses: RuleEntry['status'][] = ['confirmed', 'inferred', 'rejected', 'deferred', undefined];
      const categories: RuleEntry['category'][] = ['campo', 'dato', 'error', 'actor', 'accion', undefined];

      let totalCasesEmitted = 0;

      for (let i = 0; i < 200; i++) {
        // Generate random min and max (-100 to 200)
        const minVal = Math.floor(Math.random() * 300) - 100;
        const maxVal = Math.floor(Math.random() * 300) - 100;
        const isString = Math.random() > 0.5;
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const category = categories[Math.floor(Math.random() * categories.length)];

        const evidenceAttr = isString
          ? `minlength="${minVal}" maxlength="${maxVal}"`
          : `min="${minVal}" max="${maxVal}"`;

        const rule: RuleEntry = {
          id: `FUZZ-RULE-${i}`,
          description: `Fuzz test ${i}`,
          field: 'age',
          status,
          category,
          evidence: evidenceAttr,
        };

        const cases = generateBvaCases(`fuzz-mod-${i}`, [rule], fullSelectors);

        if (status !== 'confirmed' || (category !== 'campo' && category !== 'dato' && category !== 'error' && category !== undefined)) {
          // Must NEVER emit cases if not confirmed or category not in BVA_CATEGORIES
          expect(cases.length).toBe(0);
        } else if (minVal > maxVal || (isString && (minVal < 0 || maxVal < 0))) {
          // Inverted range or negative string length must NEVER emit cases
          expect(cases.length).toBe(0);
        } else if (isString && minVal === 0 && maxVal === 0) {
          // String length [0, 0]: under_min (<0) omitted, min(0)='', nominal(0)='', max(0)='', over_max(1)='a'
          expect(cases.length).toBe(4);
          totalCasesEmitted += cases.length;
          for (const c of cases) {
            verifyTcCaseIntegrity(c);
          }
        } else if (isString && minVal === 0) {
          // String length [0, maxVal]: under_min (<0) omitted -> 4 valid/invalid boundary cases
          expect(cases.length).toBe(4);
          totalCasesEmitted += cases.length;
          for (const c of cases) {
            verifyTcCaseIntegrity(c);
          }
        } else {
          // Valid confirmed case
          expect(cases.length).toBe(5);
          totalCasesEmitted += cases.length;
          for (const c of cases) {
            verifyTcCaseIntegrity(c);
          }
        }
      }

      // Confirm that the fuzz generator executed and produced cases on valid configurations
      expect(totalCasesEmitted).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // Challenge 7: DEV-MVP-01-R3 Parser & Step Grid Hardening
  // =========================================================================
  describe('Challenge 7: DEV-MVP-01-R3 Parser & Step Grid Hardening', () => {
    it('ATTACK 7.1: Scientific notation (min="1e2" max="2e2" and min="1e-2" max="3e-2") is parsed in full without mantissa truncation', () => {
      const expRule = createConfirmedRule('R-EXP-INT', 'quantity', { evidence: 'min="1e2" max="2e2"' });
      const expCases = generateBvaCases('mod', [expRule], fullSelectors);
      expect(expCases.map((c) => c.steps[1].value)).toEqual(['99', '100', '150', '200', '201']);
      expCases.forEach((c) => verifyTcCaseIntegrity(c));

      const smallExpRule = createConfirmedRule('R-EXP-DEC', 'score', { evidence: 'min="1e-2" max="3e-2"' });
      const smallExpCases = generateBvaCases('mod', [smallExpRule], fullSelectors);
      expect(smallExpCases.map((c) => c.steps[1].value)).toEqual(['0', '0.01', '0.02', '0.03', '0.04']);
      smallExpCases.forEach((c) => verifyTcCaseIntegrity(c));
    });

    it('ATTACK 7.2: Step-aligned nominal value (min="0" max="6" step="2" and min="1" max="7" step="2") never emits stepMismatch', () => {
      const evenStepRule = createConfirmedRule('R-EVEN-STEP', 'quantity', { evidence: 'min="0" max="6" step="2"' });
      const evenCases = generateBvaCases('mod', [evenStepRule], fullSelectors);
      expect(evenCases.map((c) => c.steps[1].value)).toEqual(['-2', '0', '2', '6', '8']);
      evenCases.forEach((c) => verifyTcCaseIntegrity(c));

      const oddOriginRule = createConfirmedRule('R-ODD-STEP', 'quantity', { evidence: 'min="1" max="7" step="2"' });
      const oddCases = generateBvaCases('mod', [oddOriginRule], fullSelectors);
      expect(oddCases.map((c) => c.steps[1].value)).toEqual(['-1', '1', '3', '7', '9']);
      oddCases.forEach((c) => verifyTcCaseIntegrity(c));
    });

    it('ATTACK 7.3: Multi-digit text length rules ("Longitud mínimo de 18 caracteres", "entre 10 y 25 caracteres") do not backtrack into numeric conflicts', () => {
      const minLenRule = createConfirmedRule('R-TXT-18', 'username', {
        description: 'Longitud mínimo de 18 caracteres',
      });
      const minLenCases = generateBvaCases('mod', [minLenRule], fullSelectors);
      expect(minLenCases.map((c) => c.steps[1].value?.length)).toEqual([17, 18, 19]);
      minLenCases.forEach((c) => verifyTcCaseIntegrity(c));

      const rangeLenRule = createConfirmedRule('R-TXT-RANGE', 'username', {
        description: 'El nombre debe tener entre 10 y 25 caracteres',
      });
      const rangeLenCases = generateBvaCases('mod', [rangeLenRule], fullSelectors);
      expect(rangeLenCases.map((c) => c.steps[1].value?.length)).toEqual([9, 10, 17, 25, 26]);
      rangeLenCases.forEach((c) => verifyTcCaseIntegrity(c));
    });

    it('ATTACK 7.4: Intra-level contradictions (duplicate min in evidence, or description vs condition) fail closed', () => {
      const dupAttr = createConfirmedRule('R-DUP-ATTR', 'age', { evidence: 'min="10" min="18"' });
      expect(generateBvaCases('mod', [dupAttr], fullSelectors)).toEqual([]);

      const splitText = createConfirmedRule('R-SPLIT-TXT', 'age', {
        description: 'Importe mínimo de 10',
        condition: 'Importe mínimo de 18',
      });
      expect(generateBvaCases('mod', [splitText], fullSelectors)).toEqual([]);
    });
  });
});
