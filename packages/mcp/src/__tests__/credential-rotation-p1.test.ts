import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { expect, it, vi } from 'vitest';
import type { CredentialReference, ICredentialProvider } from '@qap/auth';
import { QapApplicationService } from '../application/application-service.js';

const capture = vi.hoisted(() => vi.fn(async () => ({ state: { cookies: [], origins: [] }, verificationPath: '/home' })));
vi.mock('../verified-handoff.js', () => ({ captureVerifiedPassword: capture }));
import { authenticateScopedPassword } from '../scoped-password.js';

it('retries a failed rotation cleanup after reopening SQLite without deleting the current credential', async () => {
  const base = mkdtempSync(join(tmpdir(), 'qap-rotation-'));
  const root = join(base, 'workspace'); mkdirSync(root);
  const host = join(base, 'host');
  const secrets = new Map<string, string>();
  let failDelete = false;
  const provider: ICredentialProvider = {
    set: async (ref, value) => { secrets.set(ref.account, value.password!); },
    get: async ref => secrets.has(ref.account) ? { password: secrets.get(ref.account)! } : null,
    delete: async ref => { if (failDelete) throw Error('unavailable'); return secrets.delete(ref.account); },
    close: () => {},
  };
  let service = new QapApplicationService({ hostRootDir: host, credentialProvider: provider });
  try {
    const snapshot = service.createProject({ name: 'rotation', canonicalRoot: root, baseUrl: 'https://example.test' });
    const projectId = snapshot.project.project_id;
    const env = snapshot.environment!;
    service.authority.grant({ project_id: projectId, capability: 'access', scope: { root_path: root }, granted_by: 'test' });
    service.authority.grant({ project_id: projectId, capability: 'login', scope: { origin: 'https://example.test', profile_id: 'alice' }, granted_by: 'test' });
    const login = (password: string) => authenticateScopedPassword(service, projectId, env, root,
      { profile: 'alice', username: 'alice', password }, new AbortController().signal, () => true);
    failDelete = true;
    expect((await login('first')).status).toBe('success');
    expect([...secrets.values()]).toEqual(['first']);
    const initialDb = new DatabaseSync(join(host, 'app-service.sqlite'));
    expect(initialDb.prepare("SELECT count(*) AS n FROM host_session_state WHERE key LIKE 'credential_cleanup:v1:%'").get()).toMatchObject({ n: 0 });
    initialDb.close();
    expect((await login('second')).status).toBe('success');
    expect([...secrets.values()].sort()).toEqual(['first', 'second']);
    const db = new DatabaseSync(join(host, 'app-service.sqlite'));
    expect(db.prepare("SELECT count(*) AS n FROM host_session_state WHERE key LIKE 'credential_cleanup:v1:%'").get()).toMatchObject({ n: 1 });
    db.close();
    service.close();
    failDelete = false;
    service = new QapApplicationService({ hostRootDir: host, credentialProvider: provider });
    await service.reconcileReplacedCredentials();
    expect([...secrets.values()]).toEqual(['second']);
    const current = service.resolveProfileAlias(projectId, 'alice', env.env_id);
    if (current.status !== 'matched') throw Error('missing profile');
    expect((await service.readProfileSecret(projectId, current.profile.profile_id))?.password).toBe('second');
    const ref: CredentialReference = { projectId, applicationId: snapshot.project.application_id,
      environment: env.env_id, auth_profile_id: current.profile.profile_id, account: current.profile.credential_ref_key! };
    service.stageReplacedCredential(ref);
    await service.reconcileReplacedCredentials();
    expect([...secrets.values()]).toEqual(['second']);
    let release!: () => void;
    let entered!: () => void;
    const barrier = new Promise<void>(resolve => { release = resolve; });
    const both = new Promise<void>(resolve => { entered = resolve; });
    let count = 0;
    capture.mockImplementation(async () => { if (++count === 2) entered(); await barrier;
      return { state: { cookies: [], origins: [] }, verificationPath: '/home' }; });
    const concurrent = [login('third'), login('fourth')];
    await both; release();
    const outcomes = await Promise.all(concurrent);
    expect(outcomes.map(outcome => outcome.status).sort()).toEqual(['blocked', 'success']);
    expect(secrets.size).toBe(1);
    expect(['third', 'fourth']).toContain([...secrets.values()][0]);

    capture.mockResolvedValueOnce({ state: undefined, verificationPath: undefined } as unknown as { state: { cookies: never[]; origins: never[] }; verificationPath: string });
    failDelete = true;
    const failedOutcome = await login('orphan-candidate');
    expect(failedOutcome).toMatchObject({ status: 'blocked', code: 'credential_cleanup_failed' });
    expect(secrets.size).toBe(2);
    failDelete = false;
    await service.reconcileReplacedCredentials();
    expect(secrets.size).toBe(1);
    expect(['third', 'fourth']).toContain([...secrets.values()][0]);
  } finally { service.close(); rmSync(base, { recursive: true, force: true }); }
});
