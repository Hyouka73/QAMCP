import type { TCCase } from '@qap/shared';
import { describe, expect, it } from 'vitest';

import { caseExecutionBlockReason } from '../case-execution-policy.js';

const tc = (overrides: Partial<TCCase> = {}): TCCase => ({
  _version: '1', id: '550e8400-e29b-41d4-a716-446655440000', name: 'Fixture',
  steps: [{ type: 'assert', selector: '#protected-resource', assertion_type: 'visible' }], ...overrides,
});

describe('INT-01E: pre-execution capability gates', () => {
  it.each(['bva', 'rbac_negative'] as const)('blocks %s even if tags are removed or manual/verified labels are supplied', (category) => {
    expect(caseExecutionBlockReason(tc({ case_category: category, manually_edited: true, tags: ['verified'] }))).toContain('blocked_missing_oracle');
  });
  it('blocks an unverified candidate without reclassifying it as failed or passed', () => {
    expect(caseExecutionBlockReason(tc({ tags: ['blocked_missing_oracle'] }))).toContain('blocked_missing_oracle');
  });
  it('blocks network simulation before any step can install a route', () => {
    expect(caseExecutionBlockReason(tc({ steps: [{ type: 'intercept_network', target: '**/*' }] }))).toContain('blocked_intercept_contract');
  });
  it('blocks identity transitions before loading or mixing session state', () => {
    expect(caseExecutionBlockReason(tc({ steps: [{ type: 'switch_auth', auth_profile: 'legitimate-viewer' }] }))).toContain('blocked_session_transition');
  });
  it('permits an ordinary, explicit assertion to reach the runner; this is not a proof of authority', () => {
    const input = tc();
    const snapshot = structuredClone(input);
    expect(caseExecutionBlockReason(input)).toBeUndefined();
    expect(input).toEqual(snapshot);
  });
});
