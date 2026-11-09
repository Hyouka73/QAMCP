import { SchemaValidator } from '@qap/shared';
import type { AuthProfile, RuleEntry, TCCase } from '@qap/shared';
import { describe, expect, it } from 'vitest';

import {
  DEFAULT_DENIAL_SELECTOR,
  generateRbacNegativeCases,
} from '../plan/rbac-generator.js';

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function makeActorRule(id: string, overrides: Partial<RuleEntry> = {}): RuleEntry {
  return {
    id,
    description: 'Acceso exclusivo para rol admin',
    category: 'actor',
    status: 'confirmed',
    ...overrides,
  };
}

describe('Adversarial Challenger Suite: RBAC Generator Stress & Exploit Testing', () => {
  const validator = new SchemaValidator();

  function validateCase(tcCase: TCCase) {
    const res = validator.validateTcCase(tcCase);
    expect(res.valid).toBe(true);
    expect(res.errors).toEqual([]);
    expect(tcCase.id).toMatch(UUID_V4_REGEX);
    expect(tcCase._version).toBe('1');
    expect(tcCase.case_category).toBe('rbac_negative');
  }

  // =========================================================================
  // 1. IDENTITY FABRICATION & PROFILES EXPLOITS
  // =========================================================================
  describe('Exploit Attempt: Trick generator into emitting fabricated or synthetic identities', () => {
    it('CANNOT trick generator into emitting ${role}-local when profiles is undefined', () => {
      const cases = generateRbacNegativeCases(
        'security',
        ['admin', 'guest', 'viewer'],
        { base_route: '/sec', denial_selector: '#denied' },
        [makeActorRule('R1')],
        undefined
      );
      expect(cases).toEqual([]);
      for (const c of cases) {
        for (const step of c.steps) {
          if (step.type === 'switch_auth') {
            expect(step.auth_profile).not.toContain('local');
          }
        }
      }
    });

    it('CANNOT trick generator into emitting ${role}-local when profiles is empty array []', () => {
      const cases = generateRbacNegativeCases(
        'security',
        ['admin', 'guest'],
        { base_route: '/sec', denial_selector: '#denied' },
        [makeActorRule('R1')],
        []
      );
      expect(cases).toEqual([]);
    });

    it('CANNOT trick generator when role itself is named "local" or "admin-local"', () => {
      // Adversarial role name: trying to mimic the legacy pattern
      const trickyRoles = ['admin-local', 'local', 'guest-local'];
      const accreditedProfiles: AuthProfile[] = [
        { id: 'real-profile-1', role: 'admin', env: 'local', username: 'a' } as unknown as AuthProfile,
      ];

      const cases = generateRbacNegativeCases(
        'security',
        trickyRoles,
        { users: ['admin'], denial_selector: '#denied' },
        [makeActorRule('R1')],
        accreditedProfiles
      );

      // None of trickyRoles has an accredited profile, so zero cases should be generated
      expect(cases).toEqual([]);
    });

    it('strictly omits unaccredited roles when only 1 out of 10 roles is accredited', () => {
      const allRoles = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8', 'r9', 'r10'];
      const onlyOneAccredited: AuthProfile[] = [
        { id: 'profile-r5', role: 'r5', env: 'local', username: 'u5' } as unknown as AuthProfile,
      ];

      const rule = makeActorRule('R-STRICT', { description: 'Solo r1 accede' });
      const cases = generateRbacNegativeCases(
        'mod',
        allRoles,
        { denial_selector: '#denied' },
        [rule],
        onlyOneAccredited
      );

      // Only r5 is unassigned AND accredited
      expect(cases.length).toBe(1);
      expect(cases[0].steps[0].auth_profile).toBe('profile-r5');
      expect(cases[0].name).toContain("'r5'");
      validateCase(cases[0]);
    });

    it('handles malformed profile objects gracefully (role null, id missing/empty, non-object) without throwing TypeError', () => {
      const malformedProfiles = [
        { role: 'other' }, // missing id and role does not match
        null as any,
        undefined as any,
        { id: '', role: 'viewer' },
        { id: null, role: 'viewer' },
        { id: undefined, role: 'viewer' },
      ] as unknown as AuthProfile[];

      expect(() => {
        const cases = generateRbacNegativeCases(
          'mod',
          ['admin', 'viewer'],
          { users: ['admin'], denial_selector: '#denied' },
          [makeActorRule('R1')],
          malformedProfiles
        );
        expect(cases).toEqual([]);
      }).not.toThrow();
    });

    it('handles valid AuthProfile objects with empty role or non-matching role safely', () => {
      const edgeProfiles = [
        { id: 'some-empty-role', role: '', env: 'local', username: 'u' },
        { id: 'valid-viewer-id', role: 'viewer', env: 'local', username: 'v' },
      ] as unknown as AuthProfile[];

      const cases = generateRbacNegativeCases(
        'mod',
        ['admin', 'viewer'],
        { users: ['admin'], denial_selector: '#denied' },
        [makeActorRule('R1')],
        edgeProfiles
      );

      expect(cases.length).toBe(1);
      expect(cases[0].steps[0].auth_profile).toBe('valid-viewer-id');
      validateCase(cases[0]);
    });

    it('prevents pure symbol roles that normalize to empty string from hijacking profiles', () => {
      const profiles = [{ id: 'admin-profile', role: 'admin' }] as unknown as AuthProfile[];
      // Rule has only tags, no description
      const cases = generateRbacNegativeCases(
        'test_mod',
        ['###'],
        { denial_selector: '#denied' },
        [makeActorRule('R1', { tags: ['role:admin'], description: '' })],
        profiles
      );

      // Empty normalized slug is filtered out, so no bogus case is emitted
      expect(cases).toEqual([]);
    });

    it('prevents cross-role profile hijacking when profile has explicit conflicting role or non-boundary prefix (H06)', () => {
      // Profile is explicitly for 'admin' with id 'admin-root' or 'viewer-admin'
      const profiles: AuthProfile[] = [
        { id: 'admin-root', role: 'admin', env: 'local', username: 'adm' } as unknown as AuthProfile,
        { id: 'viewer-admin', role: 'admin', env: 'local', username: 'adm2' } as unknown as AuthProfile,
      ];

      // Neither 'adm' (partial prefix of 'admin-root') nor 'viewer' (prefix of 'viewer-admin' whose role is 'admin')
      // may hijack an 'admin' profile!
      const rule = makeActorRule('R-ADM', { description: 'Solo auditor accede' });
      const cases = generateRbacNegativeCases(
        'mod',
        ['auditor', 'adm', 'viewer'],
        { denial_selector: '#denied' },
        [rule],
        profiles
      );

      expect(cases).toEqual([]);
    });
  });

  // =========================================================================
  // 2. ASSERTION ORACLE EXPLOITS (NEVER BODY EXISTS, NEVER UNVERIFIED FALLBACK)
  // =========================================================================
  describe('Exploit Attempt: Trick generator into emitting selector: body, assertion_type: exists', () => {
    it('under observable_denial: true configuration, denial step is DEFAULT_DENIAL_SELECTOR and visible', () => {
      const profiles: AuthProfile[] = [
        { id: 'p-guest', role: 'guest', env: 'local', username: 'g' } as unknown as AuthProfile,
      ];
      const cases = generateRbacNegativeCases(
        'm',
        ['admin', 'guest'],
        { observable_denial: true },
        [makeActorRule('R1')],
        profiles
      );

      expect(cases.length).toBe(1);
      const assertStep = cases[0].steps[2];
      expect(assertStep.selector).toBe(DEFAULT_DENIAL_SELECTOR);
      expect(assertStep.assertion_type).toBe('visible');
      expect(assertStep.selector).not.toBe('body');
      expect(assertStep.assertion_type).not.toBe('exists');
      validateCase(cases[0]);
    });

    it('when denial_selector is explicitly injected as "body", assertion_type is visible, NOT exists', () => {
      // Even if an adversarial context passes denial_selector: 'body'
      const profiles: AuthProfile[] = [
        { id: 'p-guest', role: 'guest', env: 'local', username: 'g' } as unknown as AuthProfile,
      ];
      const cases = generateRbacNegativeCases(
        'm',
        ['admin', 'guest'],
        { denial_selector: 'body' },
        [makeActorRule('R1')],
        profiles
      );

      expect(cases.length).toBe(1);
      const assertStep = cases[0].steps[2];
      expect(assertStep.selector).toBe('body');
      expect(assertStep.assertion_type).toBe('visible'); // NOT exists!
      expect(assertStep.assertion_type).not.toBe('exists');
    });

    it('when privileged_selector is used alongside a positive denial oracle, emits visible on denial followed by not_exists on privileged_selector (H01)', () => {
      const profiles: AuthProfile[] = [
        { id: 'p-guest', role: 'guest', env: 'local', username: 'g' } as unknown as AuthProfile,
      ];
      // Without positive denial oracle -> fail-closed (never emit isolated not_exists that passes on HTTP 500)
      const isolated = generateRbacNegativeCases(
        'm',
        ['admin', 'guest'],
        { privileged_selector: '#secret-admin-btn' },
        [makeActorRule('R1')],
        profiles
      );
      expect(isolated).toEqual([]);

      // With positive denial_selector -> emits both visible and not_exists
      const cases = generateRbacNegativeCases(
        'm',
        ['admin', 'guest'],
        { denial_selector: '#denied', privileged_selector: '#secret-admin-btn' },
        [makeActorRule('R1')],
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
        selector: '#secret-admin-btn',
        assertion_type: 'not_exists',
      });
      validateCase(cases[0]);
    });

    it('fails closed when observable_denial is false', () => {
      const profiles: AuthProfile[] = [
        { id: 'p-guest', role: 'guest', env: 'local', username: 'g' } as unknown as AuthProfile,
      ];
      const cases = generateRbacNegativeCases(
        'm',
        ['admin', 'guest'],
        { observable_denial: false },
        [makeActorRule('R1')],
        profiles
      );
      expect(cases).toEqual([]);
    });

    it('fails closed when denial_oracle is false', () => {
      const profiles: AuthProfile[] = [
        { id: 'p-guest', role: 'guest', env: 'local', username: 'g' } as unknown as AuthProfile,
      ];
      const cases = generateRbacNegativeCases(
        'm',
        ['admin', 'guest'],
        { denial_oracle: false },
        [makeActorRule('R1')],
        profiles
      );
      expect(cases).toEqual([]);
    });
  });

  // =========================================================================
  // 3. EXTREME ROLE NAMING & INJECTION ATTACKS
  // =========================================================================
  describe('Adversarial Inputs: Extreme role naming, SQLi, XSS, ReDoS and Unicode', () => {
    it('handles SQL injection patterns in role names safely', () => {
      const sqliRoles = [
        "' OR 1=1 --",
        "'; DROP TABLE users; --",
        "admin' UNION SELECT * FROM auth --",
      ];
      const profiles: AuthProfile[] = [
        { id: 'p-sqli', role: 'or_1_1', env: 'local', username: 'u' } as unknown as AuthProfile,
      ];

      const cases = generateRbacNegativeCases(
        'vuln_mod',
        sqliRoles,
        { users: ['admin'], denial_selector: '#denied' },
        [makeActorRule('R-SQLI', { description: 'Solo admin accede' })],
        profiles
      );

      // All generated cases must be strictly schema valid, no uncaught exceptions
      for (const c of cases) {
        validateCase(c);
      }
    });

    it('handles XSS and HTML payloads in role names safely', () => {
      const xssRoles = [
        "<script>alert('xss')</script>",
        "<img src=x onerror=alert(1)>",
      ];
      const profiles: AuthProfile[] = [
        { id: 'p-xss', role: 'script_alert_xss_script', env: 'local', username: 'u' } as unknown as AuthProfile,
      ];

      const cases = generateRbacNegativeCases(
        'xss_mod',
        xssRoles,
        { users: ['admin'], denial_selector: '#denied' },
        [makeActorRule('R-XSS', { description: 'Solo admin accede' })],
        profiles
      );

      for (const c of cases) {
        validateCase(c);
      }
    });

    it('handles Regex special characters in role names without ReDoS or regex errors', () => {
      const regexRoles = [
        'role.*',
        'role(a+)+',
        'role[0-9]+',
        'role\\d+',
        'role?name',
        'role^start$end',
      ];
      const profiles: AuthProfile[] = [
        { id: 'p-reg', role: 'role_a', env: 'local', username: 'u' } as unknown as AuthProfile,
      ];

      expect(() => {
        const cases = generateRbacNegativeCases(
          'reg_mod',
          regexRoles,
          { users: ['admin'], denial_selector: '#denied' },
          [makeActorRule('R-REGEX', { description: 'Solo admin accede' })],
          profiles
        );
        for (const c of cases) {
          validateCase(c);
        }
      }).not.toThrow();
    });

    it('handles Unicode, non-Latin and emoji role names', () => {
      const unicodeRoles = [
        'administrador',
        'super-usuário',
        'gerente_técnico',
        'ユーザー', // Japanese
        '管理员', // Chinese
        '👑king', // Emoji
      ];

      const profiles: AuthProfile[] = [
        { id: 'p-gerente', role: 'gerente_tecnico', env: 'local', username: 'g' } as unknown as AuthProfile,
        { id: 'p-usuario', role: 'super_usuario', env: 'local', username: 'u' } as unknown as AuthProfile,
      ];

      const cases = generateRbacNegativeCases(
        'i18n_mod',
        unicodeRoles,
        { users: ['admin'], denial_selector: '#denied' },
        [makeActorRule('R-I18N', { description: 'Solo admin accede' })],
        profiles
      );

      for (const c of cases) {
        validateCase(c);
      }
    });

    it('handles role names that normalize to empty strings (e.g. purely special chars)', () => {
      const emptyRoles = ['###', '***', '---', ':::'];
      const profiles: AuthProfile[] = [
        { id: 'p-guest', role: 'guest', env: 'local', username: 'g' } as unknown as AuthProfile,
      ];

      const cases = generateRbacNegativeCases(
        'mod',
        emptyRoles,
        { users: ['admin'], denial_selector: '#denied' },
        [makeActorRule('R1', { description: 'Solo admin accede' })],
        profiles
      );

      // Pure symbol roles should normalize to empty strings and NOT hijack profiles
      expect(cases).toEqual([]);
    });

    it('handles case-insensitivity and diacritics normalization cleanly', () => {
      const profiles: AuthProfile[] = [
        { id: 'profile-audit', role: 'auditor', env: 'local', username: 'aud' } as unknown as AuthProfile,
      ];

      // Role in uppercase with accents
      const casesUpper = generateRbacNegativeCases(
        'mod',
        ['ADMIN', 'AUDITÓR'],
        { users: ['admin'], denial_selector: '#denied' },
        [makeActorRule('R1', { description: 'Solo admin accede' })],
        profiles
      );

      expect(casesUpper.length).toBe(1);
      expect(casesUpper[0].steps[0].auth_profile).toBe('profile-audit');
      validateCase(casesUpper[0]);
    });
  });

  // =========================================================================
  // 4. RULE GROUNDING & BUSINESS LOGIC ADVERSARIAL CASES
  // =========================================================================
  describe('Rule Grounding: Ensure non-restricting rules and ungrounded rules do not trigger unauthorized tests', () => {
    const profiles: AuthProfile[] = [
      { id: 'p-guest', role: 'guest', env: 'local', username: 'g' } as unknown as AuthProfile,
      { id: 'p-user', role: 'user', env: 'local', username: 'u' } as unknown as AuthProfile,
    ];

    it('rules that do not restrict access to specific roles do NOT emit negative cases even if context has users (H05)', () => {
      const publicRule = makeActorRule('R-PUBLIC', {
        description: 'Cualquier usuario puede ver la pagina de inicio sin restricciones',
      });

      const cases = generateRbacNegativeCases(
        'landing',
        ['guest', 'user'],
        { users: ['admin'], denial_selector: '#denied' },
        [publicRule],
        profiles
      );

      // Fail-closed: ungrounded rule does not emit blind negative tests nor infer from users
      expect(cases).toEqual([]);
    });

    it('ignores non-actor rules even if they contain role words in text', () => {
      const campoRule = makeActorRule('R-CAMPO', {
        category: 'campo',
        description: 'Solo admin puede editar el campo saldo',
      });
      const layoutRule = makeActorRule('R-LAYOUT', {
        category: 'layout' as any,
        description: 'Exclusivo para rol supervisor',
      });

      const cases = generateRbacNegativeCases(
        'mod',
        ['admin', 'guest'],
        { denial_selector: '#denied' },
        [campoRule, layoutRule],
        profiles
      );

      expect(cases).toEqual([]);
    });

    it('ignores rules whose status is NOT confirmed (e.g. inferred, draft, rejected)', () => {
      const inferredRule = makeActorRule('R-INF', {
        status: 'inferred',
        description: 'Solo admin accede',
      });
      const draftRule = makeActorRule('R-DRAFT', {
        status: 'draft' as any,
        description: 'Solo admin accede',
      });
      const rejectedRule = makeActorRule('R-REJ', {
        status: 'rejected',
        description: 'Solo admin accede',
      });

      const cases = generateRbacNegativeCases(
        'mod',
        ['admin', 'guest'],
        { denial_selector: '#denied' },
        [inferredRule, draftRule, rejectedRule],
        profiles
      );

      expect(cases).toEqual([]);
    });

    it('correctly handles rule with explicit participle prohibition ("Prohibido acceso al rol guest")', () => {
      const prohibitionRule = makeActorRule('R-NO-GUEST', {
        description: 'Prohibido acceso al rol guest en este modulo',
      });

      const cases = generateRbacNegativeCases(
        'mod',
        ['admin', 'user', 'guest'],
        { denial_selector: '#denied' },
        [prohibitionRule],
        profiles
      );

      // Only guest is explicitly forbidden
      expect(cases.length).toBe(1);
      expect(cases[0].steps[0].auth_profile).toBe('p-guest');
      expect(cases[0].name).toContain("'guest'");
      validateCase(cases[0]);
    });

    it('correctly handles rule with active Spanish verb forms ("prohíbe", "prohibe", "deniega", "bloquea", "restringe")', () => {
      const activeVerbRule = makeActorRule('R-ACTIVE-VERB', {
        description: 'El sistema prohíbe acceso al rol guest en este modulo',
      });

      const cases = generateRbacNegativeCases(
        'mod',
        ['admin', 'user', 'guest'],
        { denial_selector: '#denied' },
        [activeVerbRule],
        profiles
      );

      // guest is explicitly forbidden, user and admin are not targeted
      expect(cases.length).toBe(1);
      expect(cases[0].steps[0].auth_profile).toBe('p-guest');
      expect(cases[0].name).toContain("'guest'");
      validateCase(cases[0]);
    });

    it('extracts role from explicit role tags ("role:supervisor", "actor:admin") while ignoring thematic tags (H04)', () => {
      const profilesSuper: AuthProfile[] = [
        { id: 'p-guest', role: 'guest', env: 'local', username: 'g' } as unknown as AuthProfile,
        { id: 'p-admin', role: 'admin', env: 'local', username: 'a' } as unknown as AuthProfile,
      ];

      const taggedRule = makeActorRule('R-TAGGED', {
        description: 'Acceso al modulo de autorizaciones',
        tags: ['role:supervisor', 'seguridad'],
      });

      const cases = generateRbacNegativeCases(
        'autorizaciones',
        ['supervisor', 'admin', 'guest'],
        { denial_selector: '#denied' },
        [taggedRule],
        profilesSuper
      );

      // supervisor is authorized via tag; admin and guest are unauthorized
      expect(cases.length).toBe(2);
      expect(cases.find((c) => c.name.includes("'supervisor'"))).toBeUndefined();
      expect(cases.find((c) => c.name.includes("'admin'"))).toBeDefined();
      expect(cases.find((c) => c.name.includes("'guest'"))).toBeDefined();
    });
  });

  // =========================================================================
  // 5. STRESS & SCALE HARNESS
  // =========================================================================
  describe('Scale & Stress Execution: High volume of rules, roles and profiles', () => {
    it('processes 20 roles across 50 rules with 20 profiles deterministically without ID collisions or leaks', () => {
      const roleList: string[] = [];
      const profileList: AuthProfile[] = [];
      for (let i = 1; i <= 20; i++) {
        const r = `role_${i}`;
        roleList.push(r);
        profileList.push({
          id: `profile-${r}`,
          role: r,
          env: 'local',
          username: `user_${i}`,
        } as unknown as AuthProfile);
      }

      const ruleList: RuleEntry[] = [];
      for (let j = 1; j <= 50; j++) {
        // Each rule authorizes role_1 and role_2
        ruleList.push(
          makeActorRule(`R-STRESS-${j}`, {
            description: `Acceso solo permitido a role_1 y role_2 para operacion ${j}`,
            tags: ['role:role_1', 'role:role_2'],
          })
        );
      }

      const startTime = performance.now();
      const cases = generateRbacNegativeCases(
        'stress_module',
        roleList,
        { denial_selector: '#denied' },
        ruleList,
        profileList
      );
      const elapsed = performance.now() - startTime;

      // 50 rules * 18 unauthorized roles = 900 test cases
      expect(cases.length).toBe(50 * 18);
      expect(elapsed).toBeLessThan(1000); // Must be under 1 second

      // Check UUID uniqueness (no collisions)
      const idSet = new Set(cases.map((c) => c.id));
      expect(idSet.size).toBe(cases.length);

      // Check deterministic repeatability
      const secondRun = generateRbacNegativeCases(
        'stress_module',
        roleList,
        { denial_selector: '#denied' },
        ruleList,
        profileList
      );
      expect(cases.map((c) => c.id)).toEqual(secondRun.map((c) => c.id));

      // Validate sample of generated cases
      validateCase(cases[0]);
      validateCase(cases[cases.length - 1]);
      validateCase(cases[Math.floor(cases.length / 2)]);
    });
  });
});
