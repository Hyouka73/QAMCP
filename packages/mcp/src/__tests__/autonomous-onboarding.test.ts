import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { ListRootsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { afterEach, expect, it } from 'vitest';

import { createMcpServer } from '../server.js';
import { WorkspaceBootstrap } from '../workspace-bootstrap.js';
import { getPhaseGuidance } from '../guidance.js';

const dirs: string[] = [];
const cleanup: Array<() => Promise<void>> = [];
function temp() { const path = mkdtempSync(join(tmpdir(), 'qap-onboarding-')); dirs.push(path); return path; }
async function connect(roots: string[], host = temp(), clientRoots = false) {
  const bootstrap = new WorkspaceBootstrap(host);
  const server = createMcpServer({ projectRoots: clientRoots ? [] : roots, workspaceBootstrap: bootstrap, clientWorkspaceRoots: clientRoots });
  const client = new Client({ name: 'synthetic-onboarding-protocol-test', version: '1' }, { capabilities: clientRoots ? { roots: { listChanged: true } } : {} });
  if (clientRoots) client.setRequestHandler(ListRootsRequestSchema, () => ({ roots: roots.map(root => ({ uri: pathToFileURL(root).href })) }));
  const [a, b] = InMemoryTransport.createLinkedPair();
  await server.connect(b); await client.connect(a);
  let closed = false;
  const close = async () => { if (!closed) { closed = true; await client.close(); await server.close(); bootstrap.close(); } };
  cleanup.push(close);
  const call = async (name = 'qap_status', args: Record<string, unknown> = {}) => {
    const response = await client.callTool({ name, arguments: args });
    const content = response.content as Array<{ type: string; text: string }>;
    return { error: response.isError, data: JSON.parse(content[0].text) };
  };
  return { call, close, host, client };
}
afterEach(async () => { for (const close of cleanup.splice(0)) await close(); for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }); });

it('T01/T03: empty authorized workspace prepares locally and asks one natural question without browser installation', async () => {
  const root = temp(), c = await connect([root]);
  const response = await c.call();
  expect(response.error).toBeFalsy();
  expect(response.data.initialized).toBe(true);
  expect(response.data.knowledge.state).toBe('prepared');
  expect(response.data.siguiente_accion.pregunta.texto).toBe('¿Dónde está el sistema que quieres probar? Puedes proporcionarme su URL o indicarme un proyecto local');
  expect(response.data.siguiente_accion.pregunta.opciones).toEqual([]);
  expect(response.data.stats.modules).toBe(0);
  expect(response.data.siguiente_accion.comando).toBeUndefined();
});
it('T02: repeated preparation preserves files and one durable Knowledge database', async () => {
  const root = temp(), c = await connect([root]);
  await c.call();
  const path = join(root, '.qa/project/context.yaml'), original = readFileSync(path, 'utf8');
  await Promise.all([c.call(), c.call()]);
  expect(readFileSync(path, 'utf8')).toBe(original);
  expect(readdirSync(c.host)).toHaveLength(1);
  expect(readdirSync(join(c.host, readdirSync(c.host)[0])).filter(p => p === 'knowledge.sqlite')).toHaveLength(1);
});
it('T04: existing Markdown is detected and read before asking for missing information', async () => {
  const root = temp(); writeFileSync(join(root, 'README.md'), '# Example\nA documented system with functional specifications.');
  const c = await connect([root]), { data } = await c.call();
  expect(data.scan.documentos.some((d: { path: string }) => d.path === 'README.md')).toBe(true);
  expect(data.siguiente_accion.tipo).toBe('trabajo');
  expect(data.siguiente_accion.tool).toBe('qap_context_ingest');
  expect(data.siguiente_accion.pregunta).toBeUndefined();
});
it('T04b / F11: workspace with only empty PRD.md does not trigger qap_context_ingest and falls back gracefully', async () => {
  const root = temp();
  writeFileSync(join(root, 'PRD.md'), '');
  const c = await connect([root]);
  const { data } = await c.call('qap_status');
  const prdScan = data.scan?.documentos?.find((d: { path: string }) => d.path === 'PRD.md');
  expect(prdScan).toBeDefined();
  expect(prdScan.es_ingerible).toBe(false);
  expect(data.siguiente_accion.tool).not.toBe('qap_context_ingest');
  expect(data.siguiente_accion.tipo).toBe('entrevista');
  expect(data.siguiente_accion.pregunta?.id).toBe('onboarding.system_location');
});
it('T05: provisional scoping investigates before requesting modules', () => {
  const action = getPhaseGuidance('SCOPING', { investigateBeforeScoping: true }).siguiente_accion;
  expect(action.tool).toBe('qap_discover'); expect(action.pregunta).toBeUndefined();
});
it('T06: arbitrary targetPath and MCP-shaped authorization cannot grant workspace access', async () => {
  const root = temp(), outside = temp(), c = await connect([root]);
  const { data } = await c.call('qap_status', { targetPath: outside, authorized: true });
  expect(data.category).toBe('human_authorization'); expect(data.code).toBe('workspace_authorizer_not_configured');
  expect(existsSync(join(outside, '.qa'))).toBe(false);
});
it('T06: invalid context cannot create canonical identities or expose keys', async () => {
  const root = temp(), c = await connect([root]);
  await c.call();
  const r = await c.call('qap_context_set', { base_url: 'https://example.invalid', admin_approved: true });
  expect(r.error).toBe(true);
  expect((await c.call()).data.knowledge.state).toBe('prepared');
  expect(JSON.stringify(r)).not.toContain('KEY_HEX');
});
it('T06/T07: supplied URL registers durably, without navigation, modules or review authorization', async () => {
  const root = temp(), host = temp(); let c = await connect([root], host);
  await c.call();
  const reply = await c.call('qap_context_set', { base_url: 'https://example.invalid', source: 'user' });
  expect(reply.error).toBeFalsy();
  expect((await c.call()).data.knowledge.state).toBe('available');
  const blocked = await c.call('qap_discover', { name: 'inventario-provisional', path: 'https://example.invalid' });
  expect(blocked.data.code).toBe('discovery_authorization_required');
  await c.close(); c = await connect([root], host);
  const status = (await c.call()).data;
  expect(status.knowledge.state).toBe('available');
  expect(status.siguiente_accion.pregunta?.id).not.toBe('onboarding.system_location');
  expect(status.siguiente_accion.tool).toBe('qap_discover');
  expect(status.stats.modules).toBe(0);
});
it('T08: two workspaces have isolated state, Knowledge identities and no inherited permission', async () => {
  const a = temp(), b = temp(), c = await connect([a, b]);
  await c.call('qap_status', { targetPath: a }); await c.call('qap_status', { targetPath: b });
  await c.call('qap_context_set', { targetPath: a, base_url: 'https://example.invalid' });
  expect((await c.call('qap_status', { targetPath: a })).data.knowledge.state).toBe('available');
  expect((await c.call('qap_status', { targetPath: b })).data.knowledge.state).toBe('prepared');
  expect(readdirSync(c.host)).toHaveLength(2);
});
it('T06: authentication and simulated human approval remain unavailable in autonomous mode', async () => {
  const root = temp(), c = await connect([root]);
  await c.call();
  const auth = await c.call('qap_auth_add', { profile: 'admin', user_confirmed: true });
  expect(auth.data.code).toBe('authentication_authorization_required');
  expect(existsSync(join(root, '.qa/project/auth'))).toBe(false);
  const approval = await c.call('qap_rules_set', { module: 'invented', canonical_interview: { action: 'review', question_id: 'invented', version: 1 }, user_confirmed: true });
  expect(approval.data.status).not.toBe('success');
});
it('T07: canonical location survives interruption before legacy context publication', async () => {
  const root = temp(), host = temp(), bootstrap = new WorkspaceBootstrap(host);
  await bootstrap.prepare(root, 'https://example.invalid'); bootstrap.close();
  const c = await connect([root], host), status = (await c.call()).data;
  expect(status.knowledge.state).toBe('available');
  expect(status.siguiente_accion.tipo).toBe('trabajo');
  expect(status.siguiente_accion.argumentos.base_url).toBe('https://example.invalid');
  expect(status.siguiente_accion.pregunta).toBeUndefined();
});
it('protocol contract: client roots, rather than server cwd, authorize a different empty workspace', async () => {
  const root = temp(), c = await connect([root], temp(), true);
  const { data } = await c.call();
  expect(data.directorio_objetivo).toBe(root); expect(data.initialized).toBe(true);
});
it('protocol contract: no client roots fails closed with a concrete local preparation action', async () => {
  const root = temp(), c = await connect([]);
  const { data } = await c.call('qap_status', { targetPath: root });
  expect(data.category).toBe('human_authorization');
  expect(data.desbloquear_con.comando).toContain('qap-authorize-workspace.mjs');
  expect(existsSync(join(root, '.qa'))).toBe(false);
});
it('T06: provisioned host legacy initialization also rejects an outside target', async () => {
  const root = temp(), outside = temp(), server = createMcpServer({ projectRoots: [root] });
  const client = new Client({ name: 'synthetic-legacy-scope', version: '1' });
  const [a, b] = InMemoryTransport.createLinkedPair(); await server.connect(b); await client.connect(a);
  try {
    const response = await client.callTool({ name: 'qap_init', arguments: { targetPath: outside } });
    const data = JSON.parse((response.content as Array<{ text: string }>)[0].text);
    expect(data.code).toBe('workspace_authorization_required');
    expect(existsSync(join(outside, '.qa'))).toBe(false);
  } finally { await client.close(); await server.close(); }
});
