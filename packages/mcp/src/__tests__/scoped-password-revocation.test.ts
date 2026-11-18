import { describe, expect, it, vi } from 'vitest';
import type { QapApplicationService } from '../application/application-service.js';
import type { EnvironmentRecord } from '@qap/shared';

const capture = vi.hoisted(() => vi.fn());
vi.mock('../verified-handoff.js', () => ({ captureVerifiedPassword: capture }));
vi.mock('@qap/auth', async original => ({ ...(await original<typeof import('@qap/auth')>()), readProfiles: () => [] }));
vi.mock('../application/safe-storage.js', () => ({ resolveContainedPath: () => 'profiles.json', atomicWritePrivateFile: vi.fn() }));
import { authenticateScopedPassword } from '../scoped-password.js';

describe('scoped password publication fence', () => {
  for (const revoke of [false, true]) it(revoke ? 'does not publish a captured session after revocation' : 'publishes a captured session while authority remains valid', async () => {
    let resume!: (value: unknown) => void;
    let entered!: () => void;
    const started = new Promise<void>(resolve => { entered = resolve; });
    capture.mockImplementation(() => { entered(); return new Promise(resolve => { resume = resolve; }); });
    const save = vi.fn();
    const service = {
      withProjectOperation: (fn: () => unknown) => fn(),
      resolveProfileAlias: () => ({ status: 'missing' }),
      validateTenantScope: () => ({ ok: true }),
      authority: { check: () => ({ allowed: true }) },
      upsertProfile: () => ({ profile_id: 'profile-1' }),
      storeProfileSecret: async () => undefined,
      saveProfileSession: save,
    } as unknown as QapApplicationService;
    let allowed = true;
    const operation = authenticateScopedPassword(service, 'project-1', { name: 'qa', base_url: 'https://example.test', env_id: 'env-1', is_production: false } as EnvironmentRecord,
      'root', { profile: 'alice', username: 'alice', password: 'test-password' }, new AbortController().signal, () => allowed);
    await started;
    if (revoke) allowed = false;
    resume({ state: { cookies: [], origins: [] }, verificationPath: '/home' });
    const result = await operation;
    expect(result.code).toBe(revoke ? 'capability_access_revoked' : 'authentication_verified');
    expect(save).toHaveBeenCalledTimes(revoke ? 0 : 1);
  });
});
