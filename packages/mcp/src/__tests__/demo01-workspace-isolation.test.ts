import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, renameSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ListRootsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { afterEach, beforeEach, expect, it } from 'vitest';

import { QapApplicationService } from '../application/application-service.js';
import { workspaceStorageKey } from '../project-reset.js';

const executable = fileURLToPath(new URL('../../dist/server.js', import.meta.url));
const authorize = fileURLToPath(new URL('../../../../scripts/qap-authorize-workspace.mjs', import.meta.url));

let base: string, a: string, b: string, host: string, url: string, requests: number;
let site: ReturnType<typeof createServer>;
let service: QapApplicationService;
const clients = new Set<Client>();

beforeEach(async () => {
  base = realpathSync(mkdtempSync(join(tmpdir(), 'qap-demo01-isolation-')));
  a = join(base, 'A');
  b = join(base, 'B');
  host = join(base, 'host');
  for (const workspace of [a, b]) {
    mkdirSync(workspace);
    execFileSync(process.execPath, [authorize, workspace], {
      env: { ...process.env, QAP_MCP_HOST_DATA_DIR: host,
        QAP_MCP_APP_SERVICE_DIR: join(host, 'application'), QAP_MCP_WORKSPACE_HOST_DIR: join(host, 'workspaces') },
      windowsHide: true,
    });
  }
  service = new QapApplicationService({ hostRootDir: join(host, 'application'), projectOperationDirectory: join(host, 'workspaces') });
  requests = 0;
  site = createServer((_request, response) => {
    requests++;
    response.writeHead(200, { 'content-type': 'text/html' }).end('<!doctype html><title>Fixture</title><h1>Inventario sintético</h1><button>Consultar</button>');
  });
  await new Promise<void>(done => site.listen(0, '127.0.0.1', done));
  url = 'http://127.0.0.1:' + (site.address() as { port: number }).port + '/';
});

afterEach(async () => {
  await Promise.all([...clients].map(client => client.close()));
  clients.clear();
  service?.close();
  if (site?.listening) await new Promise<void>((done, reject) => site.close(error => error ? reject(error) : done()));
  rmSync(base, { recursive: true, force: true });
});

async function connect(options: { roots?: () => string[]; fixed?: string } = {}) {
  const { roots, fixed } = options;
  const client = new Client({ name: 'demo01-fixture', version: '1' }, roots ? { capabilities: { roots: {} } } : {});
  if (roots) client.setRequestHandler(ListRootsRequestSchema, () => ({ roots: roots().map(root => ({ uri: pathToFileURL(root).href })) }));
  clients.add(client);
  await client.connect(new StdioClientTransport({
    command: process.execPath, args: [executable], stderr: 'pipe',
    env: {
      PATH: process.env.PATH ?? '', NODE_ENV: 'test', QAP_MCP_HOST_DATA_DIR: host,
      ...(fixed ? { QAP_MCP_WORKSPACE_ROOT: fixed } : {}),
      ...(process.env.PLAYWRIGHT_BROWSERS_PATH ? { PLAYWRIGHT_BROWSERS_PATH: process.env.PLAYWRIGHT_BROWSERS_PATH } : {}),
    },
  }));
  return client;
}

async function call(client: Client, name: string, args: Record<string, unknown> = {}) {
  const response = await client.callTool({ name, arguments: args });
  const content = (response.content as { type: string; text?: string }[])[0];
  if (content.type !== 'text' || !content.text) throw new Error('Invalid MCP response');
  return JSON.parse(content.text) as {
    status?: string; code?: string; conversation_id?: string; conversation_log?: string;
    discovery_inicial?: { status?: string; code?: string; index_path?: string; doc_path?: string; revision_id?: string; reused?: boolean };
  };
}

function eventLog(root: string) {
  return readFileSync(join(root, '.qa', 'logs', 'qap-events.jsonl'), 'utf8');
}

it('ESC-01/02/03/07: host-selected B stays separate with the same URL and publishes real discovery artifacts', async () => {
  const one = await connect({ fixed: a });
  const first = await call(one, 'qap_start', { base_url: url });
  expect(first).toMatchObject({ status: 'success' });
  const old = eventLog(a);
  const two = await connect({ roots: () => [b] });
  const catalog = (await two.listTools()).tools.map(tool => tool.name);
  expect(catalog).toHaveLength(19);
  for (const tool of ['qap_flow_run', 'qap_server', 'qap_validate']) {
    expect(catalog).not.toContain(tool);
    expect(await call(two, tool)).toMatchObject({ status: 'blocked', code: 'operation_disabled' });
  }
  const observed = requests;
  expect(await call(two, 'qap_rules_set', { targetPath: a, module: 'fixture', canonical_interview: { action: 'next' } }))
    .toMatchObject({ status: 'blocked', code: 'workspace_outside_configured_root' });
  expect(requests).toBe(observed);
  expect(existsSync(join(b, '.qa'))).toBe(false);

  expect(await call(two, 'qap_start')).toMatchObject({ status: 'success', directorio_objetivo: b,
    onboarding: { application_registered: false } });
  const second = await call(two, 'qap_start', { base_url: url });
  expect(second).toMatchObject({ status: 'success', directorio_objetivo: b, discovery_inicial: {
    index_path: '.qa/discovery/INDEX.md', doc_path: expect.stringMatching(/^\.qa\/discovery\/modules\//), revision_id: expect.any(String),
  } });
  const pa = service.findActiveProjectByRoot(a)!;
  const pb = service.findActiveProjectByRoot(b)!;
  expect(pa.project_id).not.toBe(pb.project_id);
  expect(pa.application_id).not.toBe(pb.application_id);
  const snapshot = service.resumeProject(pb.project_id, { readOnly: true });
  expect(snapshot.environment?.base_url).toBe(url);
  expect(snapshot.environment?.env_id).not.toBe(service.resumeProject(pa.project_id, { readOnly: true }).environment?.env_id);
  const discovery = second.discovery_inicial!;
  expect(service.listLatestDiscoveryRevisionsByScope(pb.project_id).map(row => row.revision_id)).toContain(discovery.revision_id);
  expect(service.listLatestDiscoveryRevisionsByScope(pa.project_id).map(row => row.revision_id)).not.toContain(discovery.revision_id);
  expect(readFileSync(join(b, discovery.index_path!), 'utf8')).toContain(pb.project_id);
  const doc = readFileSync(join(b, discovery.doc_path!), 'utf8');
  expect(doc).toContain(pb.project_id);
  expect(doc).toContain(discovery.revision_id);
  expect(existsSync(join(host, 'workspaces', workspaceStorageKey(b), 'knowledge.sqlite'))).toBe(true);
  expect(eventLog(b)).toContain('qap_discover');
  expect(existsSync(join(b, '.qa', 'logs', 'QAP_PRUEBA_USUARIO.md'))).toBe(true);
  expect(readFileSync(second.conversation_log!, 'utf8')).toContain('qap_start');
  expect(eventLog(a)).toBe(old);
}, 60_000);

it('ESC-07: reports partial discovery without artifact links when Markdown cannot be published', async () => {
  const two = await connect({ fixed: b });
  expect(await call(two, 'qap_status')).toMatchObject({ status: 'success', directorio_objetivo: b });
  mkdirSync(join(b, '.qa', 'discovery', 'INDEX.md'), { recursive: true });
  const result = await call(two, 'qap_start', { base_url: url });
  expect(result).toMatchObject({ status: 'partial', discovery_inicial: { status: 'indeterminate', code: 'PERSISTENCE_FAILED' } });
  expect(result.discovery_inicial).not.toHaveProperty('index_path');
  expect(result.discovery_inicial).not.toHaveProperty('doc_path');
  const dossier = await call(two, 'qap_project', { action: 'discovery_dossier' });
  expect(dossier).toMatchObject({ status: 'success', read_only: true, selected_revision: expect.any(Object) });
  expect(dossier).not.toHaveProperty('index_path');
  expect(existsSync(join(a, '.qa'))).toBe(false);
}, 60_000);

it('ESC-04: missing registered A cannot be recreated and the registry cannot select a workspace', async () => {
  const original = await connect({ fixed: a });
  expect(await call(original, 'qap_status')).toMatchObject({ status: 'success', directorio_objetivo: a });
  await original.close();
  renameSync(a, join(base, 'offline-A'));
  const unbound = await connect();
  expect(await call(unbound, 'qap_status', { targetPath: b })).toMatchObject({ code: 'workspace_not_bound' });
  const ambiguous = await connect({ roots: () => [b, join(base, 'offline-A')] });
  expect(await call(ambiguous, 'qap_status', { targetPath: b })).toMatchObject({ code: 'workspace_not_bound' });
  const rooted = await connect({ roots: () => [b] });
  expect(await call(rooted, 'qap_status', { targetPath: a })).toMatchObject({ code: 'workspace_outside_configured_root' });
  expect(await call(rooted, 'qap_status')).toMatchObject({ status: 'success', directorio_objetivo: b });
  expect(existsSync(a)).toBe(false);
}, 30_000);

it('ESC-05/06/08/09: explicit resume keeps the campaign and contradictory or revoked calls have no side effects', async () => {
  const one = await connect({ fixed: a });
  const two = await connect({ fixed: b });
  const originalA = await call(one, 'qap_start', { base_url: url });
  const originalB = await call(two, 'qap_start', { base_url: url });
  const pa = service.findActiveProjectByRoot(a)!;
  const pb = service.findActiveProjectByRoot(b)!;
  const snapshot = service.resumeProject(pb.project_id, { readOnly: true });
  const before = [eventLog(a), eventLog(b), requests];
  const aRevisions = service.listLatestDiscoveryRevisionsByScope(pa.project_id);
  const bRevisions = service.listLatestDiscoveryRevisionsByScope(pb.project_id);
  expect(await call(two, 'qap_project', { action: 'resume', project_id: pa.project_id, targetPath: b }))
    .toMatchObject({ status: 'blocked', code: 'project_not_found' });
  expect(await call(two, 'qap_start', { base_url: 'https://different.invalid/' }))
    .toMatchObject({ status: 'blocked', code: 'project_environment_mismatch' });
  expect(await call(two, 'qap_status', { conversation_id: originalA.conversation_id }))
    .toMatchObject({ status: 'blocked', code: 'conversation_not_in_workspace' });
  expect([eventLog(a), eventLog(b), requests]).toEqual(before);
  expect(service.listLatestDiscoveryRevisionsByScope(pa.project_id)).toEqual(aRevisions);
  expect(service.listLatestDiscoveryRevisionsByScope(pb.project_id)).toEqual(bRevisions);

  await two.close();
  const reopened = await connect({ fixed: b });
  expect(await call(reopened, 'qap_project', { action: 'resume', project_id: pb.project_id }))
    .toMatchObject({ project: { project_id: pb.project_id }, campaign: { campaign_id: snapshot.campaign?.campaign_id } });
  expect(await call(reopened, 'qap_status', { conversation_id: originalB.conversation_id }))
    .toMatchObject({ directorio_objetivo: b });
  const fresh = await call(reopened, 'qap_start');
  expect(fresh.conversation_id).not.toBe(originalB.conversation_id);
  expect(fresh.discovery_inicial).toMatchObject({ revision_id: originalB.discovery_inicial?.revision_id, reused: true });
  expect(eventLog(a)).toBe(before[0]);
  expect(requests).toBe(before[2]);
  const afterResume = eventLog(b);
  const access = service.authority.check(pb.project_id, 'access', { root_path: b }, undefined, Date.now(), false).grant!;
  service.authority.revokeGrant(pb.project_id, access.grant_id);
  expect(await call(reopened, 'qap_start', { refresh_discovery: true }))
    .toMatchObject({ status: 'blocked', code: 'capability_access_revoked' });
  expect(eventLog(b)).toBe(afterResume);
  expect(eventLog(a)).toBe(before[0]);
  expect(requests).toBe(before[2]);
  expect(service.authority.check(pa.project_id, 'access', { root_path: a }).allowed).toBe(true);
}, 60_000);

it('ESC-10: simultaneous sessions retain independent project, profile, and artifact scopes', async () => {
  let hostSelection = b;
  const [one, two] = await Promise.all([connect({ fixed: a }), connect({ roots: () => [hostSelection] })]);
  const [first, second] = await Promise.all([
    call(one, 'qap_start', { base_url: url }), call(two, 'qap_start', { base_url: url }),
  ]);
  expect(first, JSON.stringify(first)).toMatchObject({ status: 'success', directorio_objetivo: a });
  expect(second, JSON.stringify(second)).toMatchObject({ status: 'success', directorio_objetivo: b });
  expect(first.discovery_inicial?.revision_id).toBeDefined();
  expect(second.discovery_inicial?.revision_id).not.toBe(first.discovery_inicial?.revision_id);
  expect(eventLog(a)).not.toContain(second.conversation_id);
  expect(eventLog(b)).not.toContain(first.conversation_id);
  const pa = service.findActiveProjectByRoot(a)!;
  const pb = service.findActiveProjectByRoot(b)!;
  for (const [project, label] of [[pa, 'profile-a'], [pb, 'profile-b']] as const) {
    service.upsertProfile({ projectId: project.project_id, envId: project.active_env_id!, label });
  }
  const [resumeA, resumeB] = await Promise.all([
    call(one, 'qap_project', { action: 'resume', project_id: pa.project_id }),
    call(two, 'qap_project', { action: 'resume', project_id: pb.project_id }),
  ]);
  expect(resumeA).toMatchObject({ profiles: [expect.objectContaining({ label: 'profile-a' })] });
  expect(resumeB).toMatchObject({ profiles: [expect.objectContaining({ label: 'profile-b' })] });
  hostSelection = a;
  expect(await call(two, 'qap_status', { targetPath: a })).toMatchObject({ code: 'workspace_host_root_changed' });
  const conflict = await connect({ fixed: a, roots: () => [b] });
  expect(await call(conflict, 'qap_status')).toMatchObject({ code: 'workspace_host_root_mismatch' });
}, 60_000);
