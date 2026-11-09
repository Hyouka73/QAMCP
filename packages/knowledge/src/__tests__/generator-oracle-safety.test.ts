import type { ModuleSelectors } from '@qap/engine';
import type { AuthProfile, RuleEntry } from '@qap/shared';
import { describe, expect, it } from 'vitest';

import { generateBvaCases } from '../plan/bva-generator.js';
import { generateRbacNegativeCases } from '../plan/rbac-generator.js';

const selectors = { selectors: { age: '#age', submit: '#submit', success: '#success', error: '#error' } } as unknown as ModuleSelectors;
const rule = (evidence: string): RuleEntry => ({
  id: 'age-bounds', description: 'Observed bounds', category: 'campo', field: 'age',
  status: 'confirmed', source: 'dom', evidence,
});
const profile: AuthProfile = {
  id: 'legitimate-viewer', role: 'viewer', env: 'test', username: 'test-actor',
  credential_source: 'ephemeral', login_mode: 'handoff',
};
const actor: RuleEntry = { id: 'access', description: 'Access proposal', status: 'confirmed', category: 'actor' };

describe('INT-01E: generated candidates never constitute verified oracles', () => {
  it('rejects DOM evidence marked confirmed and keeps grounded proposals blocked', () => {
    const input = Object.freeze(rule('min="18" max="99"'));
    const before = structuredClone(input);
    expect(generateBvaCases('people', [input], selectors, '/people')).toEqual([]);
    const cases = generateBvaCases('people', [{ ...input, source: 'user_confirmed' }], selectors, '/people');
    expect(cases).toHaveLength(5);
    expect(cases.map((tc) => tc.steps[1].value)).toEqual(['17', '18', '58', '99', '100']);
    expect(cases.every((tc) => tc.tags?.includes('blocked_missing_oracle'))).toBe(true);
    expect(cases.every((tc) => tc.steps[3].assertion_type === 'visible')).toBe(true);
    expect(cases[0].steps[3].selector).toContain('error');
    expect(input).toEqual(before);
  });

  it.each(['min="1"', 'max="10"', 'min="1.5" max="10.5"', 'min="1,5" max="10,5"',
    'minlength="3" maxlength="10"', 'min="10" max="1"', 'min="1" max="9007199254740991"'])('does not promote untrusted DOM bounds into cases: %s', (bounds) => {
    expect(generateBvaCases('people', [rule(bounds)], selectors)).toEqual([]);
  });

  it('retains INT-03 representable-frontier protection for trusted rules', () => {
    for (const evidence of ['min="1" max="9007199254740991"', 'min="9007199254740992" max="9007199254740992"']) {
      expect(generateBvaCases('people', [{ ...rule(evidence), source: 'user_confirmed' }], selectors)).toEqual([]);
    }
    expect(generateBvaCases('people', [{ ...rule('min=20,max=20'), source: 'user_confirmed' }], selectors)).toHaveLength(5);
  });

  it('does not infer a denial from missing users, route or exact profile', () => {
    expect(generateRbacNegativeCases('people', ['viewer'], {}, [actor], [profile])).toEqual([]);
    expect(generateRbacNegativeCases('people', ['viewer'], { users: ['admin'] }, [actor], [profile])).toEqual([]);
    expect(generateRbacNegativeCases('people', ['viewer'], { users: ['admin'], base_route: '/people' }, [actor])).toEqual([]);
    expect(generateRbacNegativeCases('people', ['view'], { users: ['admin'], base_route: '/people' }, [actor], [profile])).toEqual([]);
  });

  it('requires a grounded rule and positive denial oracle, retaining the blocked proposal', () => {
    expect(generateRbacNegativeCases('people', ['admin', 'viewer'], { users: ['admin'], base_route: '/people' }, [actor], [profile])).toEqual([]);
    const groundedActor: RuleEntry = { ...actor, source: 'user_confirmed', description: 'Solo admin accede' };
    const context = { base_route: '/people', denial_selector: '#denied' };
    const cases = generateRbacNegativeCases('people', ['admin', 'viewer'], context, [groundedActor], [profile]);
    expect(cases).toHaveLength(1);
    expect(cases[0].steps[0].auth_profile).toBe(profile.id);
    expect(cases[0].tags).toContain('blocked_missing_oracle');
    expect(cases[0].steps[2]).toMatchObject({ type: 'assert', selector: '#denied', assertion_type: 'visible' });
    expect(cases[0].steps.some((step) => step.selector === 'body')).toBe(false);
    expect(generateRbacNegativeCases('people', ['viewer'], context, [groundedActor], [profile, { ...profile, id: 'ambiguous' }])).toEqual([]);
  });
});
