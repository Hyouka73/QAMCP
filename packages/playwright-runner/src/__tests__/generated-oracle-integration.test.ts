import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { generateBvaCases, generateRbacNegativeCases } from '@qap/knowledge';
import type { AuthProfile, RuleEntry } from '@qap/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';

// A generated proposal must be rejected before importing a driver or resolving identity.
vi.mock('playwright-core', () => { throw new Error('Generated proposals must not initialize a browser'); });
vi.mock('../session-resolver.js', () => ({ resolveModuleSession: vi.fn(() => { throw new Error('Must not resolve a session'); }) }));

import { PlaywrightRunner } from '../runner.js';
import { resolveModuleSession } from '../session-resolver.js';

const roots: string[] = [];
afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

const rule: RuleEntry = {
  id: 'equal-20', description: 'Importe confirmado', field: 'amount', category: 'campo',
  status: 'confirmed', source: 'user_confirmed', evidence: 'min=20,max=20',
};
const profile: AuthProfile = {
  id: 'legitimate-viewer', role: 'viewer', env: 'test', username: 'test-actor',
  credential_source: 'ephemeral', login_mode: 'handoff',
};

describe('INT-03 + R4: real generator output remains blocked by the real Runner', () => {
  it.each(['bva', 'rbac'] as const)('does not execute generated %s even when blocking tags are removed', async (kind: 'bva' | 'rbac') => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'qap-int03-r4-'));
    roots.push(projectRoot);
    const cases = kind === 'bva'
      ? generateBvaCases('billing', [rule], { selectors: { amount: '#amount', submit: '#submit', success: '#success', error: '#error' } })
      : generateRbacNegativeCases('billing', ['admin', 'viewer'], { base_route: '/billing', denial_selector: '#denied' },
        [{ ...rule, category: 'actor', description: 'Solo admin accede' }], [profile]);
    expect(cases).toHaveLength(kind === 'bva' ? 5 : 1);
    expect(cases.every((entry) => entry.tags?.includes('blocked_missing_oracle'))).toBe(true);
    const untagged = cases.map((entry) => ({ ...entry, tags: [] }));
    const result = await new PlaywrightRunner().execute({ modules: ['billing'], cases: untagged.map((entry) => entry.id) }, {
      projectRoot, storageResolver: async (_module, id) => untagged.find((entry) => entry.id === id)!, registerSignalHandlers: false,
    });
    expect(result.summary).toEqual({ total: cases.length, passed: 0, failed: 0, skipped: 0, not_run: cases.length });
    expect(result.cases.every((entry) => entry.result === 'not_run' && entry.not_run_reason?.includes('blocked_missing_oracle'))).toBe(true);
    expect(resolveModuleSession).not.toHaveBeenCalled();
  });
});
