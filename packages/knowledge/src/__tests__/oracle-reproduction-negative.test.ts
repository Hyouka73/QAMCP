import type { ModuleSelectors } from '@qap/engine';
import { SchemaValidator } from '@qap/shared';
import type { AuthProfile, RuleEntry, TCCase } from '@qap/shared';
import { describe, expect, it } from 'vitest';

import { generateBvaCases } from '../plan/bva-generator.js';
import {
  DEFAULT_DENIAL_SELECTOR,
  generateRbacNegativeCases,
} from '../plan/rbac-generator.js';

/**
 * UUID v4 standard RFC 4122 pattern:
 * 8-4-4-4-12 hex chars with version 4 and variant 1 [89ab].
 */
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function createBvaRule(id: string, overrides: Partial<RuleEntry> = {}): RuleEntry {
  return {
    id,
    description: 'Regla de negocio BVA',
    status: 'confirmed',
    category: 'campo',
    field: 'age',
    ...overrides,
  };
}

function createActorRule(id: string, overrides: Partial<RuleEntry> = {}): RuleEntry {
  return {
    id,
    description: 'Regla de negocio RBAC',
    status: 'confirmed',
    category: 'actor',
    ...overrides,
  };
}

const standardSelectors = {
  selectors: {
    age: '#age-input',
    username: '#username-input',
    score: '#score-input',
    submit: '#submit-btn',
    error: '.error-message',
    success: '.success-message',
  },
  metadata: { generated_at: '2026-11-09T00:00:00.000Z', source: 'test' },
} as unknown as ModuleSelectors;

describe('Negative Reproduction & Regression Test Suite: BVA & RBAC Oracle Hardening (DEV-MVP-01)', () => {
  const validator = new SchemaValidator();

  function assertValidTcCase(tcCase: TCCase): void {
    const validation = validator.validateTcCase(tcCase);
    expect(validation.errors).toEqual([]);
    expect(validation.valid).toBe(true);
    expect(tcCase.id).toMatch(UUID_V4_REGEX);
    expect(tcCase._version).toBe('1');
    expect(Array.isArray(tcCase.steps)).toBe(true);
    expect(tcCase.steps.length).toBeGreaterThan(0);
  }

  // =========================================================================
  // 1. BVA-1: Rejection of Artificial ±10 Boundaries
  // =========================================================================
  describe('BVA-1: Rejection of Artificial ±10 Boundaries', () => {
    it('demonstrates legacy flaw: single-sided min=18 previously fabricated max=28 and marked 29 as invalid', () => {
      // Legacy code logic:
      // const effectiveMin = min ?? (max !== undefined ? max - 10 : 0);
      // const effectiveMax = max ?? effectiveMin + 10;
      // When min = 18 and max is undefined:
      const legacyEffectiveMin = 18;
      const legacyEffectiveMax = legacyEffectiveMin + 10; // 28
      const legacyOverMax = legacyEffectiveMax + 1; // 29
      // In business reality, "mínimo 18 años" allows age 29, 45, etc.
      // The legacy logic falsely classified 29 as invalid ('over_max').
      expect(legacyEffectiveMax).toBe(28);
      expect(legacyOverMax).toBe(29);
    });

    it('remediated behavior: single-sided lower limit (min only) generates exactly 3 cases without fabricating an upper limit', () => {
      const rule = createBvaRule('R-AGE-MIN-ONLY', {
        field: 'age',
        condition: 'edad mínima 18',
        evidence: 'min="18"',
      });

      const cases = generateBvaCases('registro', [rule], standardSelectors);

      // Must generate exactly 3 unilateral cases: under_min (17), min (18), nominal (19)
      expect(cases.length).toBe(3);

      const fillSteps = cases.map((c) => c.steps.find((s) => s.type === 'fill'));
      const filledValues = fillSteps.map((s) => s?.value);
      expect(filledValues).toEqual(['17', '18', '19']);

      // Assert ABSOLUTELY NO fabricated upper bounds (28 or 29) exist
      expect(filledValues).not.toContain('28');
      expect(filledValues).not.toContain('29');

      const caseNames = cases.map((c) => c.name);
      expect(caseNames).toEqual([
        'BVA_R-AGE-MIN-ONLY_under_min',
        'BVA_R-AGE-MIN-ONLY_min',
        'BVA_R-AGE-MIN-ONLY_nominal',
      ]);
      expect(caseNames.some((n) => n.includes('max') || n.includes('over_max'))).toBe(false);

      for (const tcCase of cases) {
        assertValidTcCase(tcCase);
      }
    });

    it('demonstrates legacy flaw: single-sided max=50 previously fabricated min=40 and marked 39 as invalid', () => {
      // Legacy code logic:
      // const effectiveMin = min ?? (max !== undefined ? max - 10 : 0);
      // When max = 50 and min is undefined:
      const legacyEffectiveMin = 50 - 10; // 40
      const legacyUnderMin = legacyEffectiveMin - 1; // 39
      // In business reality, "máximo 50" allows 39, 25, 10, etc.
      // The legacy logic falsely classified 39 as invalid ('under_min').
      expect(legacyEffectiveMin).toBe(40);
      expect(legacyUnderMin).toBe(39);
    });

    it('remediated behavior: single-sided upper limit (max only) generates exactly 3 cases without fabricating a lower limit', () => {
      const rule = createBvaRule('R-SCORE-MAX-ONLY', {
        field: 'score',
        condition: 'puntaje máximo 50',
        evidence: 'max="50"',
      });

      const cases = generateBvaCases('evaluacion', [rule], standardSelectors);

      // Must generate exactly 3 unilateral cases: nominal (49), max (50), over_max (51)
      expect(cases.length).toBe(3);

      const fillSteps = cases.map((c) => c.steps.find((s) => s.type === 'fill'));
      const filledValues = fillSteps.map((s) => s?.value);
      expect(filledValues).toEqual(['49', '50', '51']);

      // Assert ABSOLUTELY NO fabricated lower bounds (40 or 39) exist
      expect(filledValues).not.toContain('40');
      expect(filledValues).not.toContain('39');

      const caseNames = cases.map((c) => c.name);
      expect(caseNames).toEqual([
        'BVA_R-SCORE-MAX-ONLY_nominal',
        'BVA_R-SCORE-MAX-ONLY_max',
        'BVA_R-SCORE-MAX-ONLY_over_max',
      ]);
      expect(caseNames.some((n) => n.includes('under_min'))).toBe(false);

      for (const tcCase of cases) {
        assertValidTcCase(tcCase);
      }
    });
  });

  // =========================================================================
  // 2. BVA-2: Rejection of Numeric String Fills for String Length Boundaries
  // =========================================================================
  describe('BVA-2: Rejection of Numeric String Fills for String Length Boundaries', () => {
    it('demonstrates legacy flaw: minlength=3 previously filled "2" (length 1) instead of a 2-character string', () => {
      // Legacy code logic:
      // const ATTR_MIN = /(?:^|[\s,;.])(?:min|minlength)\s*[=:]\s*["']?(-?\d+)["']?/i;
      // ... { type: 'fill', selector, value: String(boundary.value) }
      // For minlength="3", under_min boundary has value 2.
      // String(2) produces "2" which has length 1.
      const legacyFillValue = String(2);
      expect(legacyFillValue).toBe('2');
      expect(legacyFillValue.length).toBe(1); // Fails to test string length 2!
      expect(legacyFillValue.length).not.toBe(2);
    });

    it('remediated behavior: string length rules generate filled values with exact character repetitions', () => {
      const rule = createBvaRule('R-USER-LEN', {
        field: 'username',
        description: 'Nombre de usuario debe tener longitud válida',
        evidence: 'minlength="3" maxlength="10"',
      });

      const cases = generateBvaCases('usuarios', [rule], standardSelectors);
      expect(cases.length).toBe(5);

      const fillSteps = cases.map((c) => c.steps.find((s) => s.type === 'fill')!);

      // Boundaries for [3, 10]: under_min=2, min=3, nominal=6, max=10, over_max=11
      const expectedLengths = [2, 3, 6, 10, 11];
      for (let i = 0; i < fillSteps.length; i++) {
        const step = fillSteps[i];
        const expectedLen = expectedLengths[i];
        expect(step.value.length).toBe(expectedLen);
        expect(step.value).toBe('a'.repeat(expectedLen));
        // Verify it is NOT the string representation of the number
        expect(step.value).not.toBe(String(expectedLen));
      }

      for (const tcCase of cases) {
        assertValidTcCase(tcCase);
      }
    });

    it('remediated behavior: rejects unconfirmed heuristic string length rules (fail-closed)', () => {
      const rule = createBvaRule('R-HEURISTIC-LEN', {
        field: 'username',
        description: 'Nombre entre 3 y 10 caracteres',
        status: 'inferred', // Unconfirmed heuristic
      });

      const cases = generateBvaCases('usuarios', [rule], standardSelectors);
      // Unconfirmed rules must NEVER produce executable test cases
      expect(cases).toEqual([]);
    });
  });

  // =========================================================================
  // 3. BVA-3: Rejection of Blind #${field} and Generic Fallbacks
  // =========================================================================
  describe('BVA-3: Rejection of Blind #${field} and Generic Fallbacks', () => {
    it('demonstrates legacy flaw: missing field selector in selectors.json silently defaulted to #${field}', () => {
      // Legacy code logic:
      // return readSelector(nestedMap?.[field]) ?? readSelector(raw?.[field]) ?? `#${field}`;
      const missingField = 'unmapped_phone';
      const legacySelector = `#${missingField}`;
      expect(legacySelector).toBe('#unmapped_phone');
    });

    it('remediated behavior: omits test generation when field selector is absent from ModuleSelectors (fail-closed)', () => {
      const rule = createBvaRule('R-PHONE-BOUNDS', {
        field: 'unmapped_phone',
        evidence: 'min="10000000" max="99999999"',
      });

      // standardSelectors does not contain 'unmapped_phone'
      const cases = generateBvaCases('contacto', [rule], standardSelectors);
      expect(cases).toEqual([]);
    });

    it('demonstrates legacy flaw: missing submit button hardcoded generic button[type="submit"], #submit', () => {
      // Legacy code logic:
      // { type: 'click', selector: 'button[type="submit"], #submit, [data-testid="submit"]' }
      const legacySubmit = 'button[type="submit"], #submit, [data-testid="submit"]';
      expect(legacySubmit).toContain('#submit');
    });

    it('remediated behavior: omits test generation when submit button is absent from ModuleSelectors (fail-closed)', () => {
      const selectorsWithoutSubmit = {
        selectors: {
          age: '#age-input',
          error: '.error-message',
          success: '.success-message',
          // submit is missing!
        },
        metadata: { generated_at: '2026-11-09T00:00:00.000Z', source: 'test' },
      } as unknown as ModuleSelectors;

      const rule = createBvaRule('R-AGE', {
        field: 'age',
        evidence: 'min="18" max="65"',
      });

      const cases = generateBvaCases('registro', [rule], selectorsWithoutSubmit);
      expect(cases).toEqual([]);
    });
  });

  // =========================================================================
  // 4. BVA-4: Rejection of Inverted not_visible Assertions for Invalid Inputs
  // =========================================================================
  describe('BVA-4: Rejection of Inverted not_visible Assertions for Invalid Inputs', () => {
    it('demonstrates legacy flaw: asserting not_visible on error selector yields false PASS on missing element in Playwright', () => {
      // In Playwright runner (assert.ts:25-28):
      // case 'not_visible': await locator.waitFor({ state: 'hidden', timeout });
      // In Playwright, state: 'hidden' resolves true if the element is NOT in the DOM at all (detached).
      // If a buggy app completely ignores invalid input and displays no error, locator('.error').waitFor('hidden') PASSES.
      // If a correct app displays the error banner, locator('.error').waitFor('hidden') FAILS.
      // The legacy code inverted the oracle:
      // assertion_type: boundary.valid ? 'visible' : 'not_visible'
      const legacyInvalidAssertion = 'not_visible';
      expect(legacyInvalidAssertion).toBe('not_visible');
    });

    it('remediated behavior: asserts visible on error selector for all invalid boundaries (under_min, over_max)', () => {
      const rule = createBvaRule('R-AGE-BILATERAL', {
        field: 'age',
        evidence: 'min="18" max="65"',
      });

      const cases = generateBvaCases('registro', [rule], standardSelectors);
      expect(cases.length).toBe(5);

      const invalidCases = cases.filter((c) =>
        c.name.endsWith('under_min') || c.name.endsWith('over_max')
      );
      expect(invalidCases.length).toBe(2);

      for (const tcCase of invalidCases) {
        const assertStep = tcCase.steps.find((s) => s.type === 'assert')!;
        expect(assertStep).toBeDefined();
        // Mandatory positive verification: the error indicator MUST be visible
        expect(assertStep.assertion_type).toBe('visible');
        expect(assertStep.assertion_type).not.toBe('not_visible');
        expect(assertStep.selector).toBe('.error-message');
        assertValidTcCase(tcCase);
      }
    });

    it('remediated behavior: asserts visible on success selector for all valid boundaries (min, nominal, max)', () => {
      const rule = createBvaRule('R-AGE-BILATERAL', {
        field: 'age',
        evidence: 'min="18" max="65"',
      });

      const cases = generateBvaCases('registro', [rule], standardSelectors);
      const validCases = cases.filter((c) =>
        (c.name.endsWith('_min') && !c.name.endsWith('_under_min')) ||
        c.name.endsWith('_nominal') ||
        (c.name.endsWith('_max') && !c.name.endsWith('_over_max'))
      );
      expect(validCases.length).toBe(3);

      for (const tcCase of validCases) {
        const assertStep = tcCase.steps.find((s) => s.type === 'assert')!;
        expect(assertStep).toBeDefined();
        expect(assertStep.assertion_type).toBe('visible');
        expect(assertStep.selector).toBe('.success-message');
        assertValidTcCase(tcCase);
      }
    });
  });

  // =========================================================================
  // 5. BVA-5: Rejection and Fail-Closed Handling of Conflicting Rules
  // =========================================================================
  describe('BVA-5: Rejection and Fail-Closed Handling of Conflicting Rules', () => {
    it('demonstrates legacy flaw: nullish coalescing ?? silently swallowed secondary contradictory rules', () => {
      // Legacy code logic:
      // group.bounds.min = group.bounds.min ?? min;
      // If rule 1 has min: 18 and rule 2 has min: 21:
      let min: number | undefined = 18;
      const secondMin = 21;
      min = min ?? secondMin;
      // min remains 18; 21 was silently lost without conflict warning or fail-closed abort
      expect(min).toBe(18);
    });

    it('remediated behavior: detects contradictory min boundaries and aborts case generation (fail-closed)', () => {
      const rule1 = createBvaRule('R-AGE-MIN-1', { field: 'age', evidence: 'min="18"' });
      const rule2 = createBvaRule('R-AGE-MIN-2', { field: 'age', evidence: 'min="21"' });

      const cases = generateBvaCases('registro', [rule1, rule2], standardSelectors);
      expect(cases).toEqual([]);
    });

    it('remediated behavior: detects contradictory max boundaries and aborts case generation (fail-closed)', () => {
      const rule1 = createBvaRule('R-AGE-MAX-1', { field: 'age', evidence: 'max="65"' });
      const rule2 = createBvaRule('R-AGE-MAX-2', { field: 'age', evidence: 'max="70"' });

      const cases = generateBvaCases('registro', [rule1, rule2], standardSelectors);
      expect(cases).toEqual([]);
    });

    it('remediated behavior: detects inverted range (min > max) and aborts case generation (fail-closed)', () => {
      const invertedRule = createBvaRule('R-INVERTED', {
        field: 'age',
        condition: 'edad entre 65 y 18', // Inverted! min=65, max=18
      });

      const cases = generateBvaCases('registro', [invertedRule], standardSelectors);
      expect(cases).toEqual([]);
    });

    it('remediated behavior: detects conflicting value types (number vs string length) on same field and aborts (fail-closed)', () => {
      const numRule = createBvaRule('R-NUM', { field: 'score', evidence: 'min="10"' });
      const strRule = createBvaRule('R-STR', { field: 'score', evidence: 'minlength="5"' });

      const cases = generateBvaCases('evaluacion', [numRule, strRule], standardSelectors);
      expect(cases).toEqual([]);
    });
  });

  // =========================================================================
  // 6. BVA-6: Rejection and Fail-Closed Handling of Cases Without Confirmed Oracles
  // =========================================================================
  describe('BVA-6: Rejection and Fail-Closed Handling of Cases Without Confirmed Oracles', () => {
    it('remediated behavior: rejects unconfirmed rules (status: inferred, rejected, deferred)', () => {
      const inferredRule = createBvaRule('R-INF', { status: 'inferred', evidence: 'min="18"' });
      const rejectedRule = createBvaRule('R-REJ', { status: 'rejected', evidence: 'min="18"' });
      const deferredRule = createBvaRule('R-DEF', { status: 'deferred', evidence: 'min="18"' });

      expect(generateBvaCases('m', [inferredRule], standardSelectors)).toEqual([]);
      expect(generateBvaCases('m', [rejectedRule], standardSelectors)).toEqual([]);
      expect(generateBvaCases('m', [deferredRule], standardSelectors)).toEqual([]);
    });

    it('remediated behavior: when error selector is absent, omits invalid boundary cases without oracle', () => {
      const selectorsNoErr = {
        selectors: {
          age: '#age-input',
          submit: '#submit-btn',
          success: '.success-message',
          // error selector is missing
        },
        metadata: { generated_at: '2026-11-09T00:00:00.000Z', source: 'test' },
      } as unknown as ModuleSelectors;

      const rule = createBvaRule('R-AGE', { evidence: 'min="18" max="65"' });
      const cases = generateBvaCases('m', [rule], selectorsNoErr);

      // Only valid cases with accredited success oracle are emitted (min, nominal, max = 3 cases)
      expect(cases.length).toBe(3);
      expect(cases.some((c) => c.name.includes('under_min') || c.name.includes('over_max'))).toBe(false);
      for (const tcCase of cases) {
        assertValidTcCase(tcCase);
      }
    });

    it('remediated behavior: when success selector is absent, omits valid boundary cases without oracle', () => {
      const selectorsNoSuccess = {
        selectors: {
          age: '#age-input',
          submit: '#submit-btn',
          error: '.error-message',
          // success selector is missing
        },
        metadata: { generated_at: '2026-11-09T00:00:00.000Z', source: 'test' },
      } as unknown as ModuleSelectors;

      const rule = createBvaRule('R-AGE', { evidence: 'min="18" max="65"' });
      const cases = generateBvaCases('m', [rule], selectorsNoSuccess);

      // Only invalid cases with accredited error oracle are emitted (under_min, over_max = 2 cases)
      expect(cases.length).toBe(2);
      expect(cases.some((c) => c.name.includes('_nominal'))).toBe(false);
      for (const tcCase of cases) {
        assertValidTcCase(tcCase);
      }
    });

    it('remediated behavior: when neither success nor error selector is present, returns empty cases (fail-closed)', () => {
      const selectorsNoOracles = {
        selectors: {
          age: '#age-input',
          submit: '#submit-btn',
        },
        metadata: { generated_at: '2026-11-09T00:00:00.000Z', source: 'test' },
      } as unknown as ModuleSelectors;

      const rule = createBvaRule('R-AGE', { evidence: 'min="18" max="65"' });
      const cases = generateBvaCases('m', [rule], selectorsNoOracles);
      expect(cases).toEqual([]);
    });
  });

  // =========================================================================
  // 7. RBAC-1: Rejection of Invented ${role}-local Fallback
  // =========================================================================
  describe('RBAC-1: Rejection of Invented ${role}-local Fallback', () => {
    it('demonstrates legacy flaw: missing profile fabricated "${role}-local" which crashes the runner with auth_failed', () => {
      // Legacy code logic:
      // function resolveProfileId(role: string, profiles?: AuthProfile[]): string {
      //   const matched = profiles?.find(...);
      //   return matched?.id ?? `${role}-local`;
      // }
      // When executed by runner (session-resolver.ts:38):
      // readProfile('auditor-local') -> null -> throws Error("Perfil de autenticación 'auditor-local' no encontrado.")
      const legacyFabricatedProfile = 'auditor-local';
      expect(legacyFabricatedProfile).toBe('auditor-local');
    });

    it('remediated behavior: unaccredited roles without matching AuthProfile are omitted without fabricating synthetic identities (fail-closed)', () => {
      const projectRoles = ['admin', 'auditor', 'guest'];
      const accreditedProfiles: AuthProfile[] = [
        { id: 'profile-admin', role: 'admin', env: 'local', username: 'admin_user' } as unknown as AuthProfile,
      ];

      const rule = createActorRule('R-ADMIN-ONLY', {
        description: 'Acceso exclusivo para rol admin',
        tags: ['role:admin'],
      });

      // Neither 'auditor' nor 'guest' has an accredited profile in profiles.json
      const cases = generateRbacNegativeCases(
        'configuracion',
        projectRoles,
        { base_route: '/config', denial_selector: '#denied' },
        [rule],
        accreditedProfiles
      );

      // Must NOT fabricate 'auditor-local' or 'guest-local'; must return []
      expect(cases).toEqual([]);
    });

    it('remediated behavior: only emits negative cases for unassigned roles that possess accredited AuthProfile credentials', () => {
      const projectRoles = ['admin', 'auditor', 'guest'];
      const accreditedProfiles: AuthProfile[] = [
        { id: 'profile-admin', role: 'admin', env: 'local', username: 'admin_user' } as unknown as AuthProfile,
        { id: 'profile-auditor', role: 'auditor', env: 'local', username: 'auditor_user' } as unknown as AuthProfile,
        // 'guest' has NO profile
      ];

      const rule = createActorRule('R-ADMIN-ONLY', {
        description: 'Solo admin puede acceder a configuracion',
        tags: ['role:admin'],
      });

      const cases = generateRbacNegativeCases(
        'configuracion',
        projectRoles,
        { base_route: '/config', denial_selector: '#denied' },
        [rule],
        accreditedProfiles
      );

      // Exactly 1 case for 'auditor' who has accredited profile; 0 cases for unaccredited 'guest'
      expect(cases.length).toBe(1);
      const rbacCase = cases[0];
      expect(rbacCase.name).toBe("RBAC Negativo: Rol 'auditor' no autorizado en R-ADMIN-ONLY");

      const switchAuthStep = rbacCase.steps.find((s) => s.type === 'switch_auth')!;
      expect(switchAuthStep.auth_profile).toBe('profile-auditor');
      expect(switchAuthStep.auth_profile).not.toBe('auditor-local');

      assertValidTcCase(rbacCase);
    });
  });

  // =========================================================================
  // 8. RBAC-2: Rejection of Presumptions Based Solely on moduleContext.users
  // =========================================================================
  describe('RBAC-2: Rejection of Presumptions Based Solely on moduleContext.users', () => {
    it('demonstrates legacy flaw: moduleContext.users=["admin"] caused authorized roles in business rules to be erroneously targeted as unauthorized', () => {
      // Legacy code logic:
      // function collectAuthorizedRoles(moduleContext: RbacModuleContext): Set<string> {
      //   const authorized = new Set<string>();
      //   for (const user of moduleContext.users ?? []) { authorized.add(user); }
      //   return authorized;
      // }
      // If moduleContext.users was ['admin'], legacy assumed ANY other role (e.g. 'supervisor') was unauthorized,
      // even if the business rule explicitly said "Acceso permitido a supervisor".
      const contextUsers = ['admin'];
      const isSupervisorAuthorizedLegacy = contextUsers.includes('supervisor');
      expect(isSupervisorAuthorizedLegacy).toBe(false); // Legacy false presumption!
    });

    it('remediated behavior: explicit rule authorization takes precedence over moduleContext.users', () => {
      const projectRoles = ['admin', 'supervisor', 'guest'];
      const accreditedProfiles: AuthProfile[] = [
        { id: 'profile-admin', role: 'admin', env: 'local', username: 'a' } as unknown as AuthProfile,
        { id: 'profile-supervisor', role: 'supervisor', env: 'local', username: 's' } as unknown as AuthProfile,
        { id: 'profile-guest', role: 'guest', env: 'local', username: 'g' } as unknown as AuthProfile,
      ];

      // Business rule explicitly authorizes 'supervisor'
      const rule = createActorRule('R-SUPERVISOR-ACCESS', {
        description: 'Permite acceso a supervisor para aprobar solicitudes',
        tags: ['role:supervisor'],
      });

      // moduleContext.users contains crawler reconnaissance string 'admin'
      const cases = generateRbacNegativeCases(
        'aprobaciones',
        projectRoles,
        { users: ['admin'], base_route: '/aprobaciones', denial_selector: '#denied' },
        [rule],
        accreditedProfiles
      );

      // Remediated generator recognizes 'supervisor' is authorized by the substantive rule.
      // Negative tests must NOT target 'supervisor'!
      const targetedRoles = cases.map((c) => {
        const switchStep = c.steps.find((s) => s.type === 'switch_auth');
        return switchStep?.auth_profile;
      });

      expect(targetedRoles).not.toContain('profile-supervisor');
      // 'guest' is unauthorized and receives negative test
      expect(targetedRoles).toContain('profile-guest');

      for (const tcCase of cases) {
        assertValidTcCase(tcCase);
      }
    });

    it('remediated behavior: ungrounded actor rules without role tags, text mentions, or context users fail closed (no cases emitted)', () => {
      const projectRoles = ['admin', 'guest'];
      const accreditedProfiles: AuthProfile[] = [
        { id: 'profile-guest', role: 'guest', env: 'local', username: 'g' } as unknown as AuthProfile,
      ];

      // Generic rule without role mentions
      const ungroundedRule = createActorRule('R-GENERIC-ACTION', {
        description: 'El usuario ejecuta la operacion general',
      });

      const cases = generateRbacNegativeCases(
        'general',
        projectRoles,
        { users: [], denial_selector: '#denied' }, // No context users either
        [ungroundedRule],
        accreditedProfiles
      );

      // Fail-closed: does not perform blind guessing
      expect(cases).toEqual([]);
    });
  });

  // =========================================================================
  // 9. RBAC-3: Rejection of Vacuous body exists Assertions
  // =========================================================================
  describe('RBAC-3: Rejection of Vacuous body exists Assertions', () => {
    it('demonstrates legacy flaw: assertion { selector: "body", assertion_type: "exists" } passes unconditionally on any HTTP response', () => {
      // In Playwright runner (assert.ts:31-34):
      // case 'exists': await locator.waitFor({ state: 'attached', timeout });
      // When selector is 'body', document.body is attached on ANY page:
      // 200 OK (unauthorized access permitted!), 401 Unauthorized, 403 Forbidden, 500 Error.
      // The test passed unconditionally even if the authorization breach succeeded!
      const legacySelector = 'body';
      const legacyAssertion = 'exists';
      expect(legacySelector).toBe('body');
      expect(legacyAssertion).toBe('exists');
    });

    it('remediated behavior: every negative RBAC case asserts an authentic observable denial outcome, never body exists', () => {
      const projectRoles = ['admin', 'guest'];
      const accreditedProfiles: AuthProfile[] = [
        { id: 'profile-guest', role: 'guest', env: 'local', username: 'g' } as unknown as AuthProfile,
      ];

      const rule = createActorRule('R-ADMIN-SECRET', {
        description: 'Exclusivo para rol admin',
        tags: ['role:admin'],
      });

      const cases = generateRbacNegativeCases(
        'secretos',
        projectRoles,
        { base_route: '/secretos', observable_denial: true },
        [rule],
        accreditedProfiles
      );

      expect(cases.length).toBe(1);
      const assertStep = cases[0].steps.find((s) => s.type === 'assert')!;
      expect(assertStep).toBeDefined();

      // Assert ABSOLUTELY NEVER body exists
      expect(assertStep.selector).not.toBe('body');
      expect(assertStep.selector).toBe(DEFAULT_DENIAL_SELECTOR);
      expect(assertStep.assertion_type).toBe('visible');

      assertValidTcCase(cases[0]);
    });
  });

  // =========================================================================
  // 10. RBAC-4: Prevention of Blind Cartesian Products
  // =========================================================================
  describe('RBAC-4: Prevention of Blind Cartesian Products', () => {
    it('demonstrates legacy flaw: indiscriminate loop across all roles x all actor rules produced N x M explosion without grounding', () => {
      // Legacy code logic:
      // for (const role of validRoles) {
      //   for (const rule of actorRules) { ... emit case ... }
      // }
      // If 5 actor rules and 4 unauthorized roles, legacy emitted 20 cases without verifying rule applicability.
      const rolesCount = 4;
      const rulesCount = 5;
      const legacyCartesianProductSize = rolesCount * rulesCount;
      expect(legacyCartesianProductSize).toBe(20);
    });

    it('remediated behavior: rules with explicit prohibitions target ONLY prohibited roles, avoiding blind Cartesian expansion', () => {
      const projectRoles = ['admin', 'operator', 'auditor', 'guest'];
      const accreditedProfiles: AuthProfile[] = [
        { id: 'profile-admin', role: 'admin', env: 'local', username: 'adm' } as unknown as AuthProfile,
        { id: 'profile-operator', role: 'operator', env: 'local', username: 'op' } as unknown as AuthProfile,
        { id: 'profile-auditor', role: 'auditor', env: 'local', username: 'aud' } as unknown as AuthProfile,
        { id: 'profile-guest', role: 'guest', env: 'local', username: 'gst' } as unknown as AuthProfile,
      ];

      // Rule explicitly forbids only 'auditor'
      const rule = createActorRule('R-RESTRICTED', {
        description: 'Prohibido acceso a auditor a operaciones criticas',
      });

      const cases = generateRbacNegativeCases(
        'operaciones',
        projectRoles,
        { base_route: '/operaciones', denial_selector: '#denied' },
        [rule],
        accreditedProfiles
      );

      // Exactly 1 targeted case for 'auditor', NOT an indiscriminate Cartesian product of 3 unassigned roles
      expect(cases.length).toBe(1);
      expect(cases[0].name).toContain("Rol 'auditor' no autorizado");

      assertValidTcCase(cases[0]);
    });

    it('remediated behavior: rules without grounded roles do not generate Cartesian cases', () => {
      const projectRoles = ['admin', 'operator', 'guest'];
      const accreditedProfiles: AuthProfile[] = [
        { id: 'profile-operator', role: 'operator', env: 'local', username: 'op' } as unknown as AuthProfile,
        { id: 'profile-guest', role: 'guest', env: 'local', username: 'gst' } as unknown as AuthProfile,
      ];

      const rules = [
        createActorRule('R-1', { description: 'Flujo general 1' }),
        createActorRule('R-2', { description: 'Flujo general 2' }),
      ];

      const cases = generateRbacNegativeCases(
        'general',
        projectRoles,
        { users: [], denial_selector: '#denied' },
        rules,
        accreditedProfiles
      );

      expect(cases).toEqual([]);
    });
  });

  // =========================================================================
  // 11. RBAC-5: Obligation of Observable Denial Outcomes
  // =========================================================================
  describe('RBAC-5: Obligation of Observable Denial Outcomes', () => {
    const projectRoles = ['admin', 'guest'];
    const accreditedProfiles: AuthProfile[] = [
      { id: 'profile-guest', role: 'guest', env: 'local', username: 'g' } as unknown as AuthProfile,
    ];
    const rule = createActorRule('R-ADMIN', {
      description: 'Acceso solo admin',
      tags: ['role:admin'],
    });

    it('remediated behavior: supports custom denial_selector with assertion_type: visible', () => {
      const cases = generateRbacNegativeCases(
        'reportes',
        projectRoles,
        {
          base_route: '/reportes',
          denial_selector: '.custom-access-denied-banner',
        },
        [rule],
        accreditedProfiles
      );

      expect(cases.length).toBe(1);
      const assertStep = cases[0].steps.find((s) => s.type === 'assert')!;
      expect(assertStep.selector).toBe('.custom-access-denied-banner');
      expect(assertStep.assertion_type).toBe('visible');

      assertValidTcCase(cases[0]);
    });

    it('remediated behavior: requires positive denial oracle and appends privileged_selector with assertion_type: not_exists (never isolated not_exists)', () => {
      // Isolated privileged_selector without positive denial oracle must fail closed (H01)
      const isolatedCases = generateRbacNegativeCases(
        'admin-panel',
        projectRoles,
        {
          base_route: '/admin',
          privileged_selector: '#privileged-delete-action-button',
        },
        [rule],
        accreditedProfiles
      );
      expect(isolatedCases).toEqual([]);

      // Combined with positive denial_selector, emits both positive visible assertion and not_exists check
      const cases = generateRbacNegativeCases(
        'admin-panel',
        projectRoles,
        {
          base_route: '/admin',
          denial_selector: '.access-denied-banner',
          privileged_selector: '#privileged-delete-action-button',
        },
        [rule],
        accreditedProfiles
      );

      expect(cases.length).toBe(1);
      expect(cases[0].steps[2]).toEqual({
        type: 'assert',
        selector: '.access-denied-banner',
        assertion_type: 'visible',
      });
      expect(cases[0].steps[3]).toEqual({
        type: 'assert',
        selector: '#privileged-delete-action-button',
        assertion_type: 'not_exists',
      });

      assertValidTcCase(cases[0]);
    });

    it('remediated behavior: fails closed when observable_denial is explicitly false (no unverified test cases)', () => {
      const cases = generateRbacNegativeCases(
        'reportes',
        projectRoles,
        {
          base_route: '/reportes',
          observable_denial: false, // Cannot observe denial!
        },
        [rule],
        accreditedProfiles
      );

      expect(cases).toEqual([]);
    });

    it('remediated behavior: fails closed when denial_oracle is false (no unverified test cases)', () => {
      const cases = generateRbacNegativeCases(
        'reportes',
        projectRoles,
        {
          base_route: '/reportes',
          denial_oracle: false, // Denial oracle unverified!
        },
        [rule],
        accreditedProfiles
      );

      expect(cases).toEqual([]);
    });
  });

  // =========================================================================
  // 12. Contract Integrity, Schema Conformity & Determinism
  // =========================================================================
  describe('Contract Integrity, Schema Conformity & Determinism', () => {
    it('guarantees deterministic IDs across repeated runs with identical inputs', () => {
      const bvaRule = createBvaRule('R-DET-BVA', { evidence: 'min="10" max="20"' });
      const bvaRun1 = generateBvaCases('mod', [bvaRule], standardSelectors);
      const bvaRun2 = generateBvaCases('mod', [bvaRule], standardSelectors);

      expect(bvaRun1.map((c) => c.id)).toEqual(bvaRun2.map((c) => c.id));

      const rbacRule = createActorRule('R-DET-RBAC', { tags: ['role:admin'] });
      const profiles = [{ id: 'profile-viewer', role: 'viewer', env: 'local', username: 'v' }] as unknown as AuthProfile[];
      const rbacRun1 = generateRbacNegativeCases('mod', ['admin', 'viewer'], { denial_selector: '#denied' }, [rbacRule], profiles);
      const rbacRun2 = generateRbacNegativeCases('mod', ['admin', 'viewer'], { denial_selector: '#denied' }, [rbacRule], profiles);

      expect(rbacRun1.map((c) => c.id)).toEqual(rbacRun2.map((c) => c.id));
    });

    it('every step in generated BVA and RBAC cases complies strictly with Playwright runner executeStep mechanics', () => {
      const bvaRule = createBvaRule('R-PLAYWRIGHT-BVA', { evidence: 'min="1" max="100"' });
      const bvaCases = generateBvaCases('mod', [bvaRule], standardSelectors);

      const rbacRule = createActorRule('R-PLAYWRIGHT-RBAC', { tags: ['role:admin'] });
      const profiles = [{ id: 'profile-guest', role: 'guest', env: 'local', username: 'g' }] as unknown as AuthProfile[];
      const rbacCases = generateRbacNegativeCases('mod', ['admin', 'guest'], { denial_selector: '#denied' }, [rbacRule], profiles);

      const allCases = [...bvaCases, ...rbacCases];
      expect(allCases.length).toBeGreaterThan(0);

      const allowedActionTypes = new Set(['navigate', 'fill', 'click', 'assert', 'switch_auth']);
      const allowedAssertionTypes = new Set(['visible', 'not_visible', 'exists', 'not_exists', 'contains', 'equals', 'count', 'attribute']);

      for (const tcCase of allCases) {
        assertValidTcCase(tcCase);

        for (const step of tcCase.steps) {
          expect(allowedActionTypes.has(step.type)).toBe(true);

          if (step.type === 'navigate') {
            expect(typeof step.url).toBe('string');
            expect(step.url!.length).toBeGreaterThan(0);
          }
          if (step.type === 'fill') {
            expect(typeof step.selector).toBe('string');
            expect(typeof step.value).toBe('string');
          }
          if (step.type === 'click') {
            expect(typeof step.selector).toBe('string');
          }
          if (step.type === 'switch_auth') {
            expect(typeof step.auth_profile).toBe('string');
          }
          if (step.type === 'assert') {
            expect(typeof step.selector).toBe('string');
            expect(step.selector!.length).toBeGreaterThan(0);
            expect(allowedAssertionTypes.has(step.assertion_type!)).toBe(true);
            // Neither BVA nor RBAC should ever assert 'body exists'
            expect(step.selector === 'body' && step.assertion_type === 'exists').toBe(false);
          }
        }
      }
    });
  });

  // =========================================================================
  // 13. DEV-MVP-01-R2: Regresiones para los 6 P1 y 3 P2 de Auditoría Codex
  // =========================================================================
  describe('DEV-MVP-01-R2: Regresiones para los 6 P1 y 3 P2 de Auditoría Codex', () => {
    it('P1-1 (H01): HTTP 500 o página de error jamás se acredita como denegación correcta mediante not_exists aislado', () => {
      const profiles = [
        { id: 'viewer-profile', role: 'viewer', env: 'local', username: 'viewer' } as unknown as AuthProfile,
      ];
      const rule = createActorRule('R-ACTOR', { description: 'Solo admin accede' });

      // Si se proveen ambos (privileged_selector y denial_selector), la aserción primaria DEBE ser visible sobre denial_selector
      const cases = generateRbacNegativeCases(
        'mod',
        ['admin', 'viewer'],
        { base_route: '/mod', privileged_selector: '#delete', denial_selector: '#denied' },
        [rule],
        profiles
      );

      expect(cases.length).toBe(1);
      expect(cases[0].steps[2]).toEqual({
        type: 'assert',
        selector: '#denied',
        assertion_type: 'visible',
      });
      expect(cases[0].steps[3]).toEqual({
        type: 'assert',
        selector: '#delete',
        assertion_type: 'not_exists',
      });
      assertValidTcCase(cases[0]);
    });

    it('P1-2 (H02): BVA preserva límites decimales exactos incluyendo min=0.5 y max=2.5', () => {
      const rule = createBvaRule('R-BVA', {
        field: 'age',
        evidence: 'min="0.5" max="2.5"',
      });
      const cases = generateBvaCases('mod', [rule], standardSelectors);

      expect(cases.length).toBe(5);
      const minCase = cases.find((c) => c.name === 'BVA_R-BVA_min')!;
      expect(minCase).toBeDefined();
      expect(minCase.steps[1].value).toBe('0.5');
      expect(minCase.steps[1].value).not.toBe('0');

      const values = cases.map((c) => c.steps[1].value);
      expect(values).toEqual(['0.4', '0.5', '1.5', '2.5', '2.6']);
      cases.forEach(assertValidTcCase);
    });

    it('P1-3 (H03): BVA resuelve contradicciones con minlength=0 y cadena vacía (no emite under_min imposible)', () => {
      const rule = createBvaRule('R-BVA', {
        field: 'username',
        evidence: 'minlength="0"',
      });
      const cases = generateBvaCases('mod', [rule], standardSelectors);

      expect(cases.some((c) => c.name.endsWith('_under_min'))).toBe(false);
      expect(cases.length).toBe(2);
      expect(cases.map((c) => ({ value: c.steps[1].value, oracle: c.steps[3].selector }))).toEqual([
        { value: '', oracle: '.success-message' },
        { value: 'a', oracle: '.success-message' },
      ]);
      cases.forEach(assertValidTcCase);
    });

    it('P1-4 (H04): RBAC no interpreta etiquetas temáticas (ej. tags: ["seguridad"]) como roles autorizados', () => {
      const profiles = [
        { id: 'admin-profile', role: 'admin', env: 'local', username: 'admin' } as unknown as AuthProfile,
        { id: 'viewer-profile', role: 'viewer', env: 'local', username: 'viewer' } as unknown as AuthProfile,
      ];
      const rule = createActorRule('R-ACTOR', {
        description: 'Aplicar controles de acceso',
        tags: ['seguridad'],
      });

      const cases = generateRbacNegativeCases(
        'mod',
        ['admin', 'viewer'],
        { denial_selector: '#denied' },
        [rule],
        profiles
      );

      expect(cases).toEqual([]);
    });

    it('P1-5 (H05): RBAC elimina definitivamente la inferencia de permisos desde moduleContext.users', () => {
      const profiles = [
        { id: 'viewer-profile', role: 'viewer', env: 'local', username: 'viewer' } as unknown as AuthProfile,
      ];
      const genericRule = createActorRule('R-ACTOR', {
        description: 'Aplicar controles de acceso a esta vista',
      });

      const cases = generateRbacNegativeCases(
        'mod',
        ['admin', 'viewer'],
        { users: ['admin'], denial_selector: '#denied' },
        [genericRule],
        profiles
      );

      expect(cases).toEqual([]);
    });

    it('P1-6 (H06): RBAC impide asignar perfiles con roles incompatibles (ej. role: "admin" con id: "viewer-admin" para prueba viewer)', () => {
      const profiles = [
        { id: 'viewer-admin', role: 'admin', env: 'local', username: 'admin' } as unknown as AuthProfile,
      ];
      const rule = createActorRule('R-ACTOR', { description: 'Solo admin accede' });

      const cases = generateRbacNegativeCases(
        'mod',
        ['admin', 'viewer'],
        { denial_selector: '#denied' },
        [rule],
        profiles
      );

      expect(cases).toEqual([]);
    });

    it('P2-1 (H07): RBAC omite casos cuando no existe oráculo de denegación acreditado en el contexto', () => {
      const profiles = [
        { id: 'viewer-profile', role: 'viewer', env: 'local', username: 'viewer' } as unknown as AuthProfile,
      ];
      const rule = createActorRule('R-ACTOR', { description: 'Solo admin accede' });

      const cases = generateRbacNegativeCases(
        'mod',
        ['admin', 'viewer'],
        { base_route: '/mod' },
        [rule],
        profiles
      );

      expect(cases).toEqual([]);
    });

    it('P2-2 (H08): BVA rechaza límites contradictorios dentro de una misma regla (descripción vs evidencia DOM)', () => {
      const rule = createBvaRule('R-BVA', {
        field: 'age',
        description: 'El importe tiene un mínimo de 18',
        evidence: 'min="10"',
      });

      const cases = generateBvaCases('mod', [rule], standardSelectors);
      expect(cases).toEqual([]);
    });

    it('P2-3 (H09): BVA y RBAC respetan el filtro de procedencia acreditada (rechazan source: "agent" o "dom")', () => {
      const untrustedBva = createBvaRule('R-BVA', {
        field: 'age',
        source: 'agent',
        evidence: 'min="10"',
      });
      expect(generateBvaCases('mod', [untrustedBva], standardSelectors)).toEqual([]);

      const untrustedRbac = createActorRule('R-ACTOR', {
        source: 'agent',
        description: 'Solo admin accede',
      });
      const profiles = [
        { id: 'viewer-profile', role: 'viewer', env: 'local', username: 'viewer' } as unknown as AuthProfile,
      ];
      expect(
        generateRbacNegativeCases('mod', ['admin', 'viewer'], { denial_selector: '#denied' }, [untrustedRbac], profiles)
      ).toEqual([]);
    });

    it('R2-01 (H02): BVA no trunca notación exponencial (min="1e2" max="2e2") a la mantisa', () => {
      const rule = createBvaRule('R-EXP', {
        field: 'age',
        evidence: 'min="1e2" max="2e2"',
      });
      const cases = generateBvaCases('mod', [rule], standardSelectors);

      expect(cases.length).toBe(5);
      expect(cases.map((c) => c.steps[1].value)).toEqual(['99', '100', '150', '200', '201']);
      expect(cases.find((c) => c.name === 'BVA_R-EXP_min')?.steps[1].value).toBe('100');
      cases.forEach(assertValidTcCase);
    });

    it('R2-02 (H02): BVA alinea el valor nominal con step=2 desde min=0 y nunca emite un nominal inválido como éxito', () => {
      const rule = createBvaRule('R-STEP', {
        field: 'age',
        evidence: 'min="0" max="6" step="2"',
      });
      const cases = generateBvaCases('mod', [rule], standardSelectors);

      expect(cases.length).toBe(5);
      expect(cases.map((c) => c.steps[1].value)).toEqual(['-2', '0', '2', '6', '8']);
      const validCases = cases.filter((c) => c.steps[3].selector === '.success-message');
      expect(validCases.every((c) => Number(c.steps[1].value) % 2 === 0)).toBe(true);
      cases.forEach(assertValidTcCase);
    });

    it('R2-03 (H04): RBAC no fabrica matriz de denegación para etiquetas con prefijo de roles inexistentes (role:seguridad, actor:superadmin)', () => {
      const profiles = [
        { id: 'admin-profile', role: 'admin', env: 'local', username: 'admin' } as unknown as AuthProfile,
        { id: 'viewer-profile', role: 'viewer', env: 'local', username: 'viewer' } as unknown as AuthProfile,
      ];

      for (const tag of ['role:seguridad', 'actor:superadmin', 'role:typo_admin']) {
        const rule = createActorRule('R-ACTOR', {
          description: 'Aplicar controles de acceso',
          tags: [tag],
        });
        const cases = generateRbacNegativeCases(
          'mod',
          ['admin', 'viewer'],
          { denial_selector: '#denied' },
          [rule],
          profiles
        );
        expect(cases).toEqual([]);
      }
    });

    it('R2-04 (H08): BVA rechaza contradicciones internas dentro del mismo nivel (evidence duplicado o description vs condition)', () => {
      const dupEvidenceRule = createBvaRule('R-BVA-DUP', {
        field: 'age',
        evidence: 'min="10" min="18"',
      });
      expect(generateBvaCases('mod', [dupEvidenceRule], standardSelectors)).toEqual([]);

      const descCondRule = createBvaRule('R-BVA-DC', {
        field: 'age',
        description: 'Importe mínimo de 10',
        condition: 'Importe mínimo de 18',
      });
      expect(generateBvaCases('mod', [descCondRule], standardSelectors)).toEqual([]);
    });

    it('R2-05 (Regresión): BVA procesa longitudes textuales de varios dígitos sin falso conflicto con el parser numérico', () => {
      const rule = createBvaRule('R-LEN-18', {
        field: 'username',
        description: 'Longitud mínimo de 18 caracteres',
      });
      const cases = generateBvaCases('mod', [rule], standardSelectors);

      expect(cases.length).toBe(3);
      expect(cases.find((c) => c.name === 'BVA_R-LEN-18_min')?.steps[1].value?.length).toBe(18);
      expect(cases.map((c) => c.steps[1].value?.length)).toEqual([17, 18, 19]);
      cases.forEach(assertValidTcCase);
    });
  });
});
