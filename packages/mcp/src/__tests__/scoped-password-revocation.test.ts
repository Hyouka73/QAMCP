import { describe, expect, it, vi } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { QapApplicationService } from '../application/application-service.js';
import type { EnvironmentRecord } from '@qap/shared';

const capture = vi.hoisted(() => vi.fn());
vi.mock('../verified-handoff.js', () => ({ captureVerifiedPassword: capture }));
vi.mock('@qap/auth', async original => ({ ...(await original<typeof import('@qap/auth')>()), readProfiles: () => [] }));
vi.mock('../application/safe-storage.js', () => ({ resolveContainedPath: () => 'profiles.json', atomicWritePrivateFile: vi.fn() }));
import { authenticateScopedPassword } from '../scoped-password.js';

describe('scoped password publication fence', () => {
  for (const revoke of [false, true]) it(revoke ? 'cleans its secret when G1 is replaced during provider write' : 'persists an authorized password and verified session', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'qap-secret-test-'));
    try {
      let release!: () => void;
      let entered!: () => void;
      const barrier = new Promise<void>(resolve => { release = resolve; });
      const started = new Promise<void>(resolve => { entered = resolve; });
      let grant = 'G1';
      let row: any;
      const save = vi.fn();
      const pathFor = (ref: { account: string }) => join(dir, ref.account.replace(':', '-'));
      const otherSecret = join(dir, 'other-operation');
      writeFileSync(otherSecret, 'retained');
      const provider = {
        set: async (ref: { account: string }, value: unknown) => { entered(); await barrier; writeFileSync(pathFor(ref), JSON.stringify(value)); },
        delete: async (ref: { account: string }) => { const path = pathFor(ref); if (existsSync(path)) unlinkSync(path); return true; },
      };
      const service = {
        withProjectOperation: (fn: () => unknown) => fn(),
        resolveProfileAlias: () => row ? { status: 'matched', profile: row } : { status: 'missing' },
        validateTenantScope: () => ({ ok: true }),
        authority: { check: (_p: string, capability: string) => ({ allowed: true, grant: { grant_id: capability === 'access' ? grant : 'login-1' } }) },
        upsertProfile: (input: { credentialAccount: string, status: string }) => row = { profile_id: 'profile-1', credential_ref_key: input.credentialAccount, status: input.status },
        resumeProject: () => ({ project: { application_id: 'app-1' } }),
        credentialProvider: provider,
        stageReplacedCredential: vi.fn(),
        reconcileReplacedCredentials: vi.fn(),
        saveProfileSession: save,
      } as unknown as QapApplicationService;
      capture.mockResolvedValue({ state: { cookies: [], origins: [] }, verificationPath: '/home' });
      const operation = authenticateScopedPassword(service, 'project-1', { name: 'qa', base_url: 'https://example.test', env_id: 'env-1', is_production: false } as EnvironmentRecord,
        'root', { profile: 'alice', username: 'alice', password: 'test-password' }, new AbortController().signal, () => true);
      await started;
      if (revoke) grant = 'G2';
      release();
      const result = await operation;
      expect(result.code).toBe(revoke ? 'capability_access_revoked' : 'authentication_verified');
      expect(save).toHaveBeenCalledTimes(revoke ? 0 : 1);
      const files = (await import('node:fs')).readdirSync(dir);
      expect(readFileSync(otherSecret, 'utf8')).toBe('retained');
      expect(files).toHaveLength(revoke ? 1 : 2);
      if (!revoke) expect(JSON.parse(readFileSync(join(dir, files.find(file => file !== 'other-operation')!), 'utf8'))).toEqual({ password: 'test-password' });
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
});
