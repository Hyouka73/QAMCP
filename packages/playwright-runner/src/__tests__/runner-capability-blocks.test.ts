import type { TCCase } from '@qap/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// These tests exercise the real execute() result/dispatch path with no driver or sessions.
vi.mock('playwright-core', () => { throw new Error('Blocked plans must not initialize a driver'); });
vi.mock('../session-resolver.js', () => ({ resolveModuleSession: vi.fn(() => { throw new Error('Must not resolve a session'); }) }));
vi.mock('@qap/knowledge', () => ({
  FileSystemStorage: class {},
  LockManager: class { async acquireModuleLock() { return async () => {}; } },
  DependencyGraphResolver: class {},
}));

import { PlaywrightRunner } from '../runner.js';
import { resolveModuleSession } from '../session-resolver.js';

describe('INT-01E: blocked runner plans do not execute or authenticate', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it.each([
    ['bva', { case_category: 'bva', steps: [{ type: 'assert', selector: '#error', assertion_type: 'not_visible' }] }, 'blocked_missing_oracle'],
    ['rbac', { case_category: 'rbac_negative', steps: [{ type: 'assert', selector: 'body', assertion_type: 'exists' }] }, 'blocked_missing_oracle'],
    ['intercept', { steps: [{ type: 'intercept_network' }] }, 'blocked_intercept_contract'],
    ['switch', { steps: [{ type: 'switch_auth', auth_profile: 'legitimate-fixture-only' }] }, 'blocked_session_transition'],
  ] as const)('reports %s as not_run with zero passes before browser/session initialization', async (_name, details, reason) => {
    const testCase = { _version: '1', id: '550e8400-e29b-41d4-a716-446655440000', name: 'Blocked fixture', ...details } as unknown as TCCase;
    const result = await new PlaywrightRunner().execute({ modules: ['fixture'], cases: [testCase.id] }, {
      storageResolver: async () => testCase, registerSignalHandlers: false,
    });
    expect(result.result).toBe('failed'); // aggregate enum has no blocked value
    expect(result.summary).toEqual({ total: 1, passed: 0, failed: 0, skipped: 0, not_run: 1 });
    expect(result.cases[0]).toMatchObject({ result: 'not_run', not_run_reason: expect.stringContaining(reason) });
    expect(resolveModuleSession).not.toHaveBeenCalled();
  });
  it('does not fall back to an anonymous actor when an explicitly requested session is absent', async () => {
    vi.mocked(resolveModuleSession).mockResolvedValueOnce(null);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const testCase: TCCase = {
        _version: '1', id: '550e8400-e29b-41d4-a716-446655440000', name: 'Explicit actor',
        steps: [{ type: 'assert', selector: '#protected-resource', assertion_type: 'visible' }],
      };
      const result = await new PlaywrightRunner().execute({ modules: ['fixture'], cases: [testCase.id] }, {
        profile: 'legitimate-fixture-only', allowImplicitAuth: false,
        storageResolver: async () => testCase, registerSignalHandlers: false,
      });
      expect(resolveModuleSession).toHaveBeenCalledWith(expect.any(String), 'fixture', 'legitimate-fixture-only', { allowImplicitAuth: false });
      expect(result.result).toBe('error');
      expect(result.summary).toMatchObject({ passed: 0, failed: 0, not_run: 1 });
      expect(result.cases[0].result).toBe('not_run');
      expect(errors).toHaveBeenCalledWith('[PlaywrightRunner] Error crítico durante la ejecución:',
        expect.objectContaining({ message: expect.stringContaining('identidad solicitada') }));
    } finally { errors.mockRestore(); }
  });
});
