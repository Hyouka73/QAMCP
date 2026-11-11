import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { afterEach, expect, it, vi } from 'vitest';
import { AuthManager, CredentialError, KeychainCredentialProvider } from '@qap/auth';

import type { DiscoveryAuthorizationRequest, DiscoveryAuthorizationResult } from '../discovery-authorizer.js';
import { InteractiveAccess, interactiveScope } from '../interactive-access.js';
import { createMcpServer } from '../server.js';
import { WorkspaceBootstrap } from '../workspace-bootstrap.js';

const cleanup: Array<() => void | Promise<void>> = [];
afterEach(async () => {
  for (const close of cleanup.splice(0).reverse()) await close();
  vi.restoreAllMocks();
});

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

it('provisions through MCP using scoped local consent, without creating a login or overwriting a stored secret', async () => {
  const { root, bootstrap, bound, deps } = await fixture();
  const profile = { id: 'synthetic', env: bound.environmentId, application_id: bound.applicationId,
    username: 'fixture-operator', credential_source: 'keychain', login_mode: 'auto', login_origin: origin,
    login_route: '/login', verification_route: '/private', post_login_condition: { type: 'selector_present', value: '#ok' } };
  const directory = join(root, '.qa', 'project', 'auth');
  const file = join(directory, 'profiles.json');
  mkdirSync(directory, { recursive: true });
  const configure = (overrides = {}) => writeFileSync(file, JSON.stringify({ _version: '1', profiles: [{ ...profile, ...overrides }] }));
  configure();
  const entries = new Map<string, string>();
  const read = vi.spyOn(KeychainCredentialProvider.prototype, 'get').mockImplementation(async ref => {
    const password = entries.get(JSON.stringify(ref));
    return password ? { password } : null;
  });
  const save = vi.spyOn(KeychainCredentialProvider.prototype, 'set').mockImplementation(async (ref, credentials) => {
    entries.set(JSON.stringify(ref), credentials.password!);
  });
  vi.spyOn(KeychainCredentialProvider.prototype, 'delete').mockImplementation(async ref => entries.delete(JSON.stringify(ref)));
  const requestAuthorization = vi.fn((request: DiscoveryAuthorizationRequest) => Promise.resolve(approved(request)));
  const requestCredential = vi.fn(async (_request: DiscoveryAuthorizationRequest, _id: string, _details: string) =>
    undefined as string | undefined);
  const workspaceAuthorizer = { requestAuthorization: vi.fn() };
  const server = createMcpServer({ ...deps, workspaceBootstrap: bootstrap, workspaceAuthorizer,
    interactiveAccessAuthorizer: { requestAuthorization, requestCredential } });
  const client = new Client({ name: 'credential-provision-fixture', version: '1.0' });
  const [transport, host] = InMemoryTransport.createLinkedPair();
  await server.connect(host);
  await client.connect(transport);
  cleanup.push(async () => { await client.close(); await server.close(); });
  const input = { targetPath: root, profile: profile.id, env: profile.env };
  const call = async (extra: Record<string, unknown> = {}) => JSON.stringify(await client.callTool({
    name: 'qap_auth_provision', arguments: { ...input, ...extra },
  }));
  const password = 'synthetic-pipe-only';
  expect(await call({ password })).not.toContain(password);
  expect(await call({ user_confirmed: true })).toContain('invalid_provision_arguments');
  expect(await call({ targetPath: join(root, '..') })).toContain('workspace_authorization_required');
  expect(await call({ env: 'wrong' })).toContain('auth_context_mismatch');
  configure({ login_origin: 'https://other.invalid' });
  expect(await call()).toContain('invalid_auth_context');
  configure({ credential_source: 'ephemeral' });
  expect(await call()).toContain('credential_provision_provider_unsupported');
  configure();
  expect(requestCredential).not.toHaveBeenCalled();
  expect(workspaceAuthorizer.requestAuthorization).not.toHaveBeenCalled();

  requestCredential.mockRejectedValueOnce(new CredentialError('DIALOG_DESKTOP_UNAVAILABLE'));
  expect(await call()).toContain('credential_dialog_desktop_unavailable');
  expect(await call()).toContain('credential_provision_cancelled');
  requestCredential.mockImplementationOnce(async () => { configure({ username: 'changed' }); return password; });
  expect(await call()).toContain('authorization_context_mismatch');
  expect(save).not.toHaveBeenCalled();
  configure();

  requestCredential.mockResolvedValueOnce(password);
  const response = await call();
  expect(response).toContain('credential_saved');
  expect(response).toContain('available');
  expect(response).not.toContain(password);
  expect(requestCredential.mock.calls.at(-1)?.[2]).toContain('fixture-operator');
  expect(read.mock.calls.at(-1)?.[0]).toMatchObject({ auth_profile_id: profile.id, account: profile.username });
  expect(await call()).toContain('credential_already_configured');
  expect(requestCredential).toHaveBeenCalledTimes(4);
  expect(save).toHaveBeenCalledOnce();
  expect(requestAuthorization).not.toHaveBeenCalled();
  const manager = new AuthManager(root);
  expect(await manager.getCredentialStatus(profile.id)).toMatchObject({ state: 'available' });
  expect((await manager.getCredentials(profile.id))?.password === password).toBe(true);
  expect(await manager.deleteSecret(profile.id)).toBe(true);
  expect(await manager.getCredentialStatus(profile.id)).toMatchObject({ state: 'not_configured' });
  manager.close();
});

it('supports creating, querying, selecting and updating multi-role QA profiles with non-email usernames, isolated secrets, session invalidation, privileged profile protection and Lendus CORE recovery', async () => {
  const { root, bootstrap, bound, deps } = await fixture();
  const entries = new Map<string, string>();
  vi.spyOn(KeychainCredentialProvider.prototype, 'get').mockImplementation(async ref => {
    const password = entries.get(JSON.stringify(ref));
    return password ? { password } : null;
  });
  vi.spyOn(KeychainCredentialProvider.prototype, 'set').mockImplementation(async (ref, credentials) => {
    entries.set(JSON.stringify(ref), credentials.password!);
  });
  vi.spyOn(KeychainCredentialProvider.prototype, 'delete').mockImplementation(async ref => entries.delete(JSON.stringify(ref)));

  let allowConsent = true;
  let nextSecret: string | undefined;
  const requestAuthorization = vi.fn((request: DiscoveryAuthorizationRequest) =>
    Promise.resolve(allowConsent ? approved(request) : { decision: 'rejected' as const }));
  const requestCredential = vi.fn(async () => nextSecret);

  const server = createMcpServer({
    ...deps,
    workspaceBootstrap: bootstrap,
    interactiveAccessAuthorizer: { requestAuthorization, requestCredential },
  });
  const client = new Client({ name: 'identity-mgmt-mcp-fixture', version: '1.0' });
  const [transport, host] = InMemoryTransport.createLinkedPair();
  await server.connect(host);
  await client.connect(transport);
  cleanup.push(async () => { await client.close(); await server.close(); });

  const callTool = async (name: string, toolArgs: Record<string, unknown>) => {
    const res = await client.callTool({ name, arguments: { targetPath: root, ...toolArgs } });
    return JSON.parse((res.content as Array<{ text: string }>)[0].text) as Record<string, unknown>;
  };

  // 1. Crear perfil con username no email (Lendus CORE / QA ágil) y un segundo perfil con rol distinto en el mismo entorno
  const createdPromotor = await callTool('qap_auth_add', {
    action: 'create',
    profile: 'lendus-promotor',
    username: 'PROM_NORTE_01',
    application_id: bound.applicationId,
    env: bound.environmentId,
    role: 'Promotor / Asesor de crédito',
    alias: 'promotor-1',
    scenario: 'originacion-credito',
    login_origin: origin,
    login_route: '/login',
    verification_route: '/solicitudes',
    post_login_condition: { type: 'selector_present', value: '#sidebar-menu' },
  });
  expect(createdPromotor).toMatchObject({
    status: 'success',
    code: 'profile_created',
    profile: 'lendus-promotor',
    username: 'PROM_NORTE_01',
    role: 'Promotor / Asesor de crédito',
    credential_state: 'not_configured',
    next_action: 'qap_auth_provision',
  });

  // Crear el perfil lendus-qa inicialmente con el username incorrecto reportado en Lendus CORE
  const createdLendusQa = await callTool('qap_auth_add', {
    action: 'create',
    profile: 'lendus-qa',
    username: 'qa.lendus@gmail.com',
    application_id: bound.applicationId,
    env: bound.environmentId,
    role: 'Administrador',
    alias: 'admin-qa',
    scenario: 'mesa-control',
    login_origin: origin,
    login_route: '/login',
    verification_route: '/clients',
    post_login_condition: { type: 'selector_present', value: '#sidebar-menu' },
  });
  expect(createdLendusQa).toMatchObject({
    status: 'success',
    code: 'profile_created',
    profile: 'lendus-qa',
    username: 'qa.lendus@gmail.com',
  });

  // No sobrescribir perfiles existentes al intentar crear uno con el mismo id o alias
  expect(await callTool('qap_auth_add', {
    action: 'create',
    profile: 'lendus-qa',
    username: 'otro_id',
  })).toMatchObject({
    status: 'blocked',
    code: 'profile_already_exists',
  });

  // 2. Consultar y seleccionar entre múltiples perfiles por rol, alias, usuario o escenario
  const listAll = await callTool('qap_auth_list', { env: bound.environmentId });
  expect(listAll).toMatchObject({ count: 2 });

  const listByRole = await callTool('qap_auth_list', { env: bound.environmentId, role: 'Promotor / Asesor de crédito' });
  expect(listByRole).toMatchObject({
    count: 1,
    profiles: [expect.objectContaining({ id: 'lendus-promotor', username: 'PROM_NORTE_01' })],
  });

  const selectedByScenario = await callTool('qap_auth_add', {
    action: 'select',
    profile: '*',
    scenario: 'originacion-credito',
  });
  expect(selectedByScenario).toMatchObject({
    status: 'success',
    code: 'profile_selected',
    profile: 'lendus-promotor',
    username: 'PROM_NORTE_01',
    resolution: 'credentials_not_configured',
  });

  // 3. Resolución pre-login: cuando la credencial está ausente, recomienda aprovisionamiento y auto no abre navegador ni reintenta a ciegas
  const resolvedBeforeProvision = await callTool('qap_auth_add', {
    action: 'resolve',
    profile: 'lendus-promotor',
  });
  expect(resolvedBeforeProvision).toMatchObject({
    status: 'success',
    code: 'credentials_not_configured',
    recommended_action: { tool: 'qap_auth_provision', profile: 'lendus-promotor' },
  });

  const autoWithoutCreds = await callTool('qap_auth_add', {
    profile: 'lendus-promotor',
    method: 'auto',
  });
  expect(autoWithoutCreds).toMatchObject({
    status: 'blocked',
    code: 'credentials_not_configured',
    recommended_tool: 'qap_auth_provision',
  });

  // 4. Aprovisionar credenciales aisladas para ambas cuentas
  nextSecret = 'PromotorSecret!2026';
  expect(await callTool('qap_auth_provision', { profile: 'lendus-promotor', env: bound.environmentId })).toMatchObject({
    status: 'success',
    code: 'credential_saved',
  });

  nextSecret = 'WrongIdentityOldPass!1';
  expect(await callTool('qap_auth_provision', { profile: 'lendus-qa', env: bound.environmentId })).toMatchObject({
    status: 'success',
    code: 'credential_saved',
  });

  // Ahora la resolución pre-login de lendus-promotor detecta credencial almacenada lista para auto login
  expect(await callTool('qap_auth_add', {
    action: 'resolve',
    profile: 'lendus-promotor',
  })).toMatchObject({
    status: 'success',
    code: 'ready_for_auto_login',
    credential_state: 'available',
    recommended_action: { tool: 'qap_auth_add', method: 'auto', profile: 'lendus-promotor' },
  });

  // 5. Caso Lendus CORE: actualizar el username incorrecto de lendus-qa recibido por chat sin exponer ni reasociar la contraseña anterior
  const updatedLendusQa = await callTool('qap_auth_add', {
    action: 'update',
    profile: 'lendus-qa',
    username: 'operador.core.lendus',
    revoke_previous_credential: true,
  });
  expect(updatedLendusQa).toMatchObject({
    status: 'success',
    code: 'profile_updated',
    profile: 'lendus-qa',
    username: 'operador.core.lendus',
    previous_username: 'qa.lendus@gmail.com',
    username_changed: true,
    previous_credential_handling: 'revoked',
    session_invalidated: true,
    credential_state: 'not_configured',
    next_action: 'qap_auth_provision',
  });

  // La credencial del promotor sigue intacta y aislada, mientras que la nueva identidad de lendus-qa requiere aprovisionamiento propio
  const manager = new AuthManager(root);
  try {
    expect(await manager.getCredentialStatus('lendus-promotor')).toMatchObject({ state: 'available' });
    expect(await manager.getCredentialStatus('lendus-qa')).toMatchObject({ state: 'not_configured' });
  } finally {
    manager.close();
  }

  // Aprovisionar la nueva identidad correcta de lendus-qa
  nextSecret = 'NuevaClaveLendusCore#99';
  const reProvisioned = await callTool('qap_auth_provision', { profile: 'lendus-qa', env: bound.environmentId });
  expect(reProvisioned).toMatchObject({
    status: 'success',
    code: 'credential_saved',
    credential_state: 'available',
  });
  expect(JSON.stringify(reProvisioned)).not.toContain('NuevaClaveLendusCore#99');

  // 6. Rechazo de cambios no autorizados en perfiles privilegiados (admin-user / superadmin)
  allowConsent = false;
  const unauthorizedPrivileged = await callTool('qap_auth_add', {
    action: 'create',
    profile: 'admin-user',
    username: 'root_system',
    role: 'superadmin',
  });
  expect(unauthorizedPrivileged).toMatchObject({
    status: 'blocked',
    code: 'privileged_profile_authorization_required',
  });
});

