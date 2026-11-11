import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { afterEach, expect, it, vi } from 'vitest';

import type { DiscoveryAuthorizationRequest, DiscoveryAuthorizationResult } from '../discovery-authorizer.js';
import { InteractiveAccess, interactiveScope } from '../interactive-access.js';
import { createMcpServer } from '../server.js';
import { WorkspaceBootstrap } from '../workspace-bootstrap.js';

const cleanup: Array<() => void | Promise<void>> = [];
afterEach(async () => { for (const close of cleanup.splice(0).reverse()) await close(); });

const origin = 'https://fixture.example.invalid';
const args = { profile: 'qa-viewer', role: 'operador', env: 'local', method: 'handoff', verification_route: '/private',
  post_login_condition: { type: 'selector_present', value: '#signed-in' } };
const signal = () => new AbortController().signal;
const approved = (r: DiscoveryAuthorizationRequest): DiscoveryAuthorizationResult =>
  ({ decision: 'approved', root: r.projectRoot, targetUrl: r.targetUrl });
const capture = () => vi.fn(() => Promise.resolve({ state: { origins: [], cookies: [
  { name: 'session', value: 'fixture-secret', domain: 'fixture.example.invalid', path: '/',
    expires: -1, httpOnly: true, secure: true, sameSite: 'Lax' as const },
] } }));

async function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'qap-interactive-access-'));
  const root = join(dir, 'project');
  mkdirSync(root);
  const bootstrap = new WorkspaceBootstrap(join(dir, 'host'));
  cleanup.push(() => { bootstrap.close(); rmSync(dir, { recursive: true, force: true }); });
  const bound = (await bootstrap.prepare(root, origin))!;
  const deps = { projectRoots: [root], knowledgeBindings: [bound] };
  return { root, bootstrap, bound, deps };
}

it.each([
  [{ decision: 'rejected' }, 'authentication_authorization_rejected'],
  [{ decision: 'cancelled' }, 'authentication_authorization_cancelled'],
  [{ decision: 'cancelled', code: 'discovery_authorization_expired' }, 'authentication_authorization_expired'],
  [{ decision: 'unavailable', reason: 'fixture without desktop' }, 'authentication_gui_unavailable'],
] as const)('blocks handoff after a host decision of %j', async (decision, code) => {
  const { root, deps } = await fixture();
  const browser = capture();
  const access = new InteractiveAccess(deps, { requestAuthorization: () => Promise.resolve(decision) }, browser);
  const response = await access.login({ ...args, targetPath: root }, signal());
  expect(JSON.stringify(response)).toContain(code);
  expect(browser).not.toHaveBeenCalled();
  expect(await access.profiles(root)).toEqual([]);
  expect(existsSync(join(root, '.qa/cache/sessions'))).toBe(false);
});

it('seals only a verified capture for its project, environment revision, origin and profile', async () => {
  const { root, deps } = await fixture();
  const browser = capture();
  const requestAuthorization = vi.fn((request: DiscoveryAuthorizationRequest) => Promise.resolve(approved(request)));
  const access = new InteractiveAccess(deps, { requestAuthorization }, browser);
  const response = await access.login({ ...args, targetPath: root }, signal());
  expect(JSON.stringify(response)).toContain('verified');
  expect(JSON.stringify(response)).not.toContain('fixture-secret');
  expect(existsSync(join(root, '.qa/cache/sessions'))).toBe(false);
  expect(await access.profiles(root)).toMatchObject([{ id: args.profile, role: args.role, verified: true }]);
  expect(requestAuthorization.mock.calls[0][0].interactiveOperation).toMatchObject({ operation: 'login', profile: args.profile });

  const scope = (await interactiveScope(root, deps))!;
  expect(access.readSession(scope, args.profile)?.state.cookies).toHaveLength(1);
  expect(access.readSession({ ...scope, projectRoot: root + '-other' }, args.profile)).toBeUndefined();
  expect(access.readSession({ ...scope, environmentId: 'staging' }, args.profile)).toBeUndefined();
  expect(access.readSession({ ...scope, environmentRevision: scope.environmentRevision + 1 }, args.profile)).toBeUndefined();
  expect(access.readSession({ ...scope, origin: 'https://other.invalid' }, args.profile)).toBeUndefined();
  expect(access.readSession(scope, 'other-user')).toBeUndefined();
});

it('honors cancellation even when approval or browser capture resolves late', async () => {
  const { root, deps } = await fixture();
  for (const duringCapture of [false, true]) {
    const controller = new AbortController();
    const browser = capture();
    const access = new InteractiveAccess(deps, {
      requestAuthorization: request => {
        if (!duringCapture) controller.abort();
        return Promise.resolve(approved(request));
      },
    }, async () => {
      controller.abort();
      return browser();
    });
    const response = await access.login({ ...args, targetPath: root }, controller.signal);
    expect(JSON.stringify(response)).toContain('authentication_authorization_cancelled');
    expect(browser).toHaveBeenCalledTimes(duringCapture ? 1 : 0);
    expect(await access.profiles(root)).toEqual([]);
  }
});

it('rejects MCP attempts to self-authorize, inject session material or change scope', async () => {
  const { root, bootstrap, deps } = await fixture();
  const ask = vi.fn((request: DiscoveryAuthorizationRequest) => Promise.resolve(approved(request)));
  const server = createMcpServer({ ...deps, workspaceBootstrap: bootstrap, interactiveAccessAuthorizer: { requestAuthorization: ask } });
  const client = new Client({ name: 'interactive-auth-fixture', version: '1.0' });
  const [transport, host] = InMemoryTransport.createLinkedPair();
  await server.connect(host);
  await client.connect(transport);
  cleanup.push(async () => { await client.close(); await server.close(); });
  const catalog = await client.listTools();
  const login = catalog.tools.find(t => t.name === 'qap_auth_add')!;
  expect(login.inputSchema.required).toEqual(['profile']);
  expect(login.inputSchema.properties?.method).toMatchObject({ enum: ['auto', 'reuse', 'handoff'] });
  expect(login.inputSchema.properties).not.toHaveProperty('storageState');
  expect(login.inputSchema.properties).not.toHaveProperty('password');
  const call = (extra: Record<string, unknown>) =>
    client.callTool({ name: 'qap_auth_add', arguments: { ...args, targetPath: root, ...extra } });
  for (const attempt of [{ user_confirmed: true }, { storageState: {} }, { password: 'fixture-secret' }, { _handoff_mock: true }]) {
    const response = await call(attempt);
    expect(JSON.stringify(response)).toContain('agent_auth_material_not_supported');
    expect(JSON.stringify(response)).not.toContain('fixture-secret');
  }
  expect(JSON.stringify(await call({ env: 'staging' }))).toContain('auth_context_mismatch');
  expect(JSON.stringify(await call({ verification_route: '//other.example.invalid/' }))).toContain('invalid_auth_routes');
  expect(JSON.stringify(await call({ post_login_condition: { type: 'url_contains', value: '/private' } }))).toContain('invalid_post_login_condition');
  expect(ask).not.toHaveBeenCalled();
});

it('rejects authentication material and agent consent on a server without interactive access', async () => {
  const { root, deps } = await fixture();
  const server = createMcpServer(deps);
  const client = new Client({ name: 'non-interactive-auth-fixture', version: '1.0' });
  const [transport, host] = InMemoryTransport.createLinkedPair();
  await server.connect(host);
  await client.connect(transport);
  cleanup.push(async () => { await client.close(); await server.close(); });
  const call = (extra: Record<string, unknown>) => client.callTool({
    name: 'qap_auth_add', arguments: { targetPath: root, profile: args.profile, method: 'auto', ...extra },
  });
  for (const attempt of [{ token: 'fixture-secret' }, { cookies: [] }, { password: 'fixture-secret' }, { storageState: {} }]) {
    const response = JSON.stringify(await call(attempt));
    expect(response).toContain('agent_auth_material_not_supported');
    expect(response).not.toContain('fixture-secret');
  }
  expect(JSON.stringify(await call({}))).toContain('authentication_authorization_required');
  expect(existsSync(join(root, '.qa', 'project', 'auth', 'profiles.json'))).toBe(false);
});
