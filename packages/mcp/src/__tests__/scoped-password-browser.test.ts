import { it, expect, vi } from 'vitest';
import { createServer } from 'node:http';
import type { QapApplicationService } from '../application/application-service.js';
import type { EnvironmentRecord } from '@qap/shared';
vi.mock('@qap/auth', async original => ({ ...(await original<typeof import('@qap/auth')>()), readProfiles: () => [] }));
vi.mock('../application/safe-storage.js', () => ({ resolveContainedPath: () => 'profiles.json', atomicWritePrivateFile: vi.fn() }));
import { authenticateScopedPassword } from '../scoped-password.js';

it('authenticates a real local form with Chromium and stores the verified session', async () => {
  const server = createServer((req, res) => {
    if (req.url === '/login' && req.method === 'GET') return res.writeHead(200, { 'content-type': 'text/html' }).end('<form method="post" action="/login"><input type="text" name="username"><input name="password" type="password"><button type="submit">Login</button></form>');
    if (req.url === '/login' && req.method === 'POST') {
      const chunks: Buffer[] = [];
      req.on('data', chunk => chunks.push(Buffer.from(chunk)));
      req.on('end', () => {
        const fields = new URLSearchParams(Buffer.concat(chunks).toString());
        if (fields.get('username') !== 'alice' || fields.get('password') !== 'test-password') return res.writeHead(403).end();
        return res.writeHead(302, { location: '/home', 'set-cookie': 'qap-test=ok; Path=/' }).end();
      });
      return;
    }
    if (req.url === '/home' && req.headers.cookie === 'qap-test=ok') return res.writeHead(200, { 'content-type': 'text/html' }).end('<h1>Welcome</h1>');
    return res.writeHead(302, { location: '/login' }).end();
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const url = 'http://127.0.0.1:' + (server.address() as { port: number }).port;
    let row: any;
    const secrets = new Map<string, unknown>();
    const save = vi.fn();
    const service = {
      withProjectOperation: (fn: () => unknown) => fn(), resolveProfileAlias: () => row ? { status: 'matched', profile: row } : { status: 'missing' },
      validateTenantScope: () => ({ ok: true }), authority: { check: () => ({ allowed: true, grant: { grant_id: 'grant-1' } }) },
      upsertProfile: (input: { credentialAccount: string, status: string }) => row = { profile_id: 'profile-1', credential_ref_key: input.credentialAccount, status: input.status },
      resumeProject: () => ({ project: { application_id: 'app-1' } }),
      credentialProvider: { set: async (ref: { account: string }, value: unknown) => { secrets.set(ref.account, value); }, delete: async (ref: { account: string }) => secrets.delete(ref.account) },
      stageReplacedCredential: vi.fn(), reconcileReplacedCredentials: vi.fn(),
      saveProfileSession: save,
    } as unknown as QapApplicationService;
    const result = await authenticateScopedPassword(service, 'project-1', { name: 'qa', base_url: url, env_id: 'env-1', is_production: false } as EnvironmentRecord,
      'root', { profile: 'alice', username: 'alice', password: 'test-password' }, new AbortController().signal, () => true);
    expect(result.login_result).toBeUndefined();
    expect(result.code).toBe('authentication_verified');
    expect(save).toHaveBeenCalledTimes(1);
    expect(secrets.size).toBe(1);
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
}, 60000);




