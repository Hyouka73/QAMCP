import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { createServer, type Server as HttpServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { SqliteKnowledgeAdapter } from '@qap/knowledge';
import { SchemaValidator } from '@qap/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import YAML from 'yaml';

import { createMcpServer, type McpServerOptions } from '../server.js';
import { DiscoveryHandler, type DiscoveryAuthorization } from '../handlers/discovery.handler.js';
import { ToolDispatcher } from '../dispatcher.js';

const roots: string[] = [];
const stores: SqliteKnowledgeAdapter[] = [];
const servers: HttpServer[] = [];
const clients: Array<{ client: Client; server: ReturnType<typeof createMcpServer> }> = [];
const canary = 'PRIVATE_VNEXT013_76fb';
const time = '2026-10-30T12:00:00.000Z';
const trace = { source: 'synthetic', recorded_by: 'fixture', recorded_at: time, reason: 'Synthetic fixture', review: 'unreviewed' as const, evidence_refs: [] };

afterEach(async () => {
  vi.restoreAllMocks();
  for (const c of clients.splice(0)) { await c.client.close(); await c.server.close(); }
  for (const server of servers.splice(0)) { server.closeAllConnections(); await new Promise<void>(r => server.close(() => r())); }
  stores.splice(0).forEach(s => s.close());
  roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true }));
});

async function fixture(html?: string) {
  const hits: string[] = [];
  const server = createServer((req, res) => {
    hits.push(req.url ?? '');
    expect(req.headers.cookie).toBeUndefined(); expect(req.headers.authorization).toBeUndefined();
    res.setHeader('Content-Type', 'text/html');
    if (req.url === '/redirect') { res.writeHead(302, { location: '/forbidden' }); res.end(); return; }
    res.end(html ?? `<html><body><h1>${canary}</h1><a href="/about">${canary}</a><a href="/contact">Contact</a>
      <a href="/${canary}?token=${canary}">Secret</a><form><input value="${canary}" aria-label="${canary}" required><button>${canary}</button></form></body></html>`);
  });
  servers.push(server);
  await new Promise<void>(r => server.listen(0, '127.0.0.1', r));
  const origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  const root = mkdtempSync(join(tmpdir(), 'qap-discovery-')); roots.push(root);
  mkdirSync(join(root, '.qa', 'project'), { recursive: true });
  const lifecycle = { _version: '1', phase: 'WORKING', modules: { catalog: { state: 'planned', updated_at: time } }, session: { id: 's', started_at: time, plan: [{ module: 'catalog', path: '/' }], auth: { required: false } }, history: [] };
  const lifecyclePath = join(root, '.qa', 'project', 'lifecycle.json');
  writeFileSync(lifecyclePath, JSON.stringify(lifecycle));
  const path = join(root, '.qa', 'synthetic.sqlite');
  const store = new SqliteKnowledgeAdapter(path); stores.push(store);
  const environment = { application_id: 'a', environment_id: 'local', name: 'local', base_url: origin,
    is_production: false, destructive_actions_allowed: false, safe_domains: ['127.0.0.1'] };
  await store.commit('a', [
    { kind: 'application', entity: { application_id: 'a', name: 'Synthetic', base_url: origin, created_at: time }, expected_revision: 0, trace },
    { kind: 'environment', entity: environment, expected_revision: 0, trace },
  ]);
  const authorization: DiscoveryAuthorization = { projectRoot: root, applicationId: 'a', environmentId: 'local', environmentRevision: 1,
    authorization: { read_only_acknowledged: true, navigation_urls: ['/', '/about', '/contact', '/redirect'].map(p => origin + p), allowed_ips: ['127.0.0.1'] },
    dependencies: { browser: { channel: 'chrome' } } };
  const options: McpServerOptions = { projectRoots: [root], knowledgeBindings: [{ projectRoot: root, applicationId: 'a', environmentId: 'local', store }], discoveryAuthorizations: [authorization] };
  return { root, path, store, environment, authorization, options, origin, hits, lifecycle, lifecyclePath };
}
async function connect(options: McpServerOptions = {}) {
  const server = createMcpServer(options); const client = new Client({ name: 'discovery-test', version: '1' });
  const [a, b] = InMemoryTransport.createLinkedPair(); clients.push({ client, server });
  await server.connect(b); await client.connect(a); return client;
}
async function call(client: Client, root: string, args: Record<string, unknown> = {}) {
  const response = await client.request({ method: 'tools/call', params: { name: 'qap_discover', arguments: { targetPath: root, name: 'catalog', path: '/', ...args } } }, CallToolResultSchema);
  const item = response.content[0]; if (item.type !== 'text') throw new Error('Expected text');
  const data = JSON.parse(item.text) as Record<string, unknown>;
  expect(item.text).not.toContain(canary); return data;
}
async function invoke(client: Client, root: string, name: string, args: Record<string, unknown> = {}) {
  const response = await client.request({ method: 'tools/call', params: { name, arguments: { targetPath: root, ...args } } }, CallToolResultSchema);
  const item = response.content[0]; if (item.type !== 'text') throw new Error('Expected text');
  return JSON.parse(item.text) as Record<string, unknown>;
}

describe('VNEXT-013 real MCP black-box acquisition', () => {
  it('R1: onboarding to anonymous discovery preserves planned state and explicitly blocks the legacy interview', async () => {
    const f = await fixture(); rmSync(f.lifecyclePath);
    const client = await connect(f.options);
    expect(await invoke(client, f.root, 'qap_init', { baseUrl: f.origin })).toMatchObject({ status: 'success' });
    expect(await invoke(client, f.root, 'qap_status')).toMatchObject({ fase: 'ONBOARDING' });
    expect(await invoke(client, f.root, 'qap_context_set', {
      objective: 'Validar el catálogo sintético de productos', roles: [{ name: 'visitante' }],
      critical_flows: [{ name: 'Consultar catálogo' }], source_of_truth: { type: 'none', declared: true },
    })).toMatchObject({ status: 'success' });
    expect(await invoke(client, f.root, 'qap_session_plan', {
      modules: [{ module: 'catalog', path: '/', priority: 'high' }], auth: { required: false },
    })).toMatchObject({ status: 'success' });
    const before = readFileSync(f.lifecyclePath, 'utf8');
    expect(await call(client, f.root)).toMatchObject({ persistence: 'committed' });
    const rules = await invoke(client, f.root, 'qap_rules_set', {
      module: 'catalog', rules: [{ category: 'proposito', description: 'El catálogo permite consultar productos disponibles', source: 'user', status: 'confirmed' }],
    });
    expect(rules).toMatchObject({ status: 'blocked', code: 'legacy_interview_unavailable', persistence: 'not_attempted', desbloquear_con: { tool: 'qap_status' } });
    expect(await invoke(client, f.root, 'qap_module_close', { module: 'catalog', action: 'close', user_confirmed: true, accept_gaps: true, accept_gaps_reason: 'Aceptación sintética explícita de brechas' }))
      .toMatchObject({ status: 'blocked', code: 'legacy_interview_unavailable' });
    expect(await invoke(client, f.root, 'qap_session_close')).toMatchObject({ status: 'blocked' });
    expect(await invoke(client, f.root, 'qap_status')).toMatchObject({ fase: 'WORKING', integration: { discovery_advances_lifecycle: false, canonical_interview: 'unavailable' } });
    expect(readFileSync(f.lifecyclePath, 'utf8')).toBe(before);
    expect(existsSync(join(f.root, '.qa', 'modules', 'catalog'))).toBe(false);
    expect((await f.store.query('a', 'observation', { limit: 100 })).items).toHaveLength(6);
    expect((await f.store.query('a', 'requirement', { limit: 100 })).items).toHaveLength(0);
  }, 30000);

  it.each(['observed', 'consolidated'])('R1: stale %s state cannot manufacture rules or close a module without view context', async state => {
    const f = await fixture();
    writeFileSync(f.lifecyclePath, JSON.stringify({ ...f.lifecycle, modules: { catalog: { state, updated_at: time } } }));
    const before = readFileSync(f.lifecyclePath, 'utf8'); const client = await connect(f.options);
    expect(await invoke(client, f.root, 'qap_status')).toMatchObject({
      siguiente_accion: { tipo: 'trabajo', tool: 'qap_status' },
      integration: { canonical_interview: 'unavailable' },
    });
    expect(await invoke(client, f.root, 'qap_rules_set', { module: 'catalog', rules: [] }))
      .toMatchObject({ status: 'blocked', code: 'legacy_interview_unavailable' });
    expect(await invoke(client, f.root, 'qap_module_close', { module: 'catalog', action: 'close', user_confirmed: true }))
      .toMatchObject({ status: 'blocked', code: 'legacy_interview_unavailable' });
    expect(readFileSync(f.lifecyclePath, 'utf8')).toBe(before);
    expect(existsSync(join(f.root, '.qa', 'modules', 'catalog'))).toBe(false);
  });

  it('R1: existing reviewed legacy context still accepts rules without promoting agent text or canonical observations', async () => {
    const f = await fixture(); const client = await connect(f.options);
    // Explicit pre-existing legacy fixture, never a projection of crawler output.
    const view = { _version: '1', view_name: 'default', description: 'Synthetic legacy catalog', path: '/',
      current_url: f.origin, tags: [], is_auth_view: false, session_saved: false, storage_state_used: false,
      playwright_used: false, playwright_error: null, discovered_at: time, page_title: 'Synthetic', routes_found: ['/'] };
    expect(new SchemaValidator().validateModuleView(view).valid).toBe(true);
    const viewDir = join(f.root, '.qa', 'modules', 'catalog', 'views', 'default'); mkdirSync(viewDir, { recursive: true });
    writeFileSync(join(viewDir, 'context.yaml'), YAML.stringify(view));
    writeFileSync(f.lifecyclePath, JSON.stringify({ ...f.lifecycle, modules: { catalog: { state: 'observed', updated_at: time } } }));
    expect(await invoke(client, f.root, 'qap_rules_set', { module: 'catalog', rules: [{
      category: 'proposito', description: 'El catálogo muestra productos disponibles para consulta', source: 'agent', status: 'confirmed',
    }] })).toMatchObject({ status: 'success' });
    const stored = YAML.parse(readFileSync(join(f.root, '.qa', 'modules', 'catalog', 'rules.yaml'), 'utf8')) as { rules: Array<{ source: string; status: string }> };
    expect(stored.rules).toHaveLength(1); expect(stored.rules[0]).toMatchObject({ source: 'agent', status: 'inferred' });
    expect((await f.store.query('a', 'requirement', { limit: 100 })).items).toHaveLength(0);
  });

  it('R1: explicit waiver remains an honest exit without claiming discovery or test coverage', async () => {
    const f = await fixture(); const client = await connect(f.options);
    expect(await invoke(client, f.root, 'qap_module_close', { module: 'catalog', action: 'waive', user_confirmed: true,
      reason: 'Se pospone la revisión funcional por decisión explícita del usuario' })).toMatchObject({ status: 'success' });
    const lifecycle = JSON.parse(readFileSync(f.lifecyclePath, 'utf8')) as { modules: { catalog: { state: string } } };
    expect(lifecycle.modules.catalog.state).toBe('waived');
    expect(existsSync(join(f.root, '.qa', 'modules', 'catalog'))).toBe(false);
    expect((await f.store.query('a', 'observation', { limit: 100 })).items).toHaveLength(0);
  });

  it('owns exactly one route, preserves order, rejects collisions, and never falls back', async () => {
    const f = await fixture(); const spy = vi.spyOn(DiscoveryHandler.prototype, 'execute');
    const client = await connect(f.options); const tools = (await client.listTools()).tools;
    expect(tools).toHaveLength(18); expect(tools.filter(t => t.name === 'qap_discover')).toHaveLength(1);
    expect(tools.findIndex(t => t.name === 'qap_discover')).toBe(8);
    expect(() => createMcpServer({ handlers: [new DiscoveryHandler({})] })).toThrow();
    spy.mockRejectedValueOnce(new Error(canary));
    expect(await call(client, f.root)).toMatchObject({ code: 'execution_failed' });
    expect(spy).toHaveBeenCalledTimes(1); expect(f.hits).toEqual([]);
    const other = await connect({ ...f.options, discoveryAuthorizations: [] });
    expect(await call(other, f.root)).toMatchObject({ code: 'discovery_authorization_required' });
    expect(f.hits).toEqual([]);
  });

  it('navigates a real MPA, returns actual counts, commits once and reopens physical SQLite', async () => {
    const f = await fixture(); const before = readFileSync(f.lifecyclePath, 'utf8');
    mkdirSync(join(f.root, '.qa', 'cache', 'sessions'), { recursive: true });
    writeFileSync(join(f.root, '.qa', 'cache', 'sessions', 'synthetic.json'), canary);
    const commit = vi.spyOn(f.store, 'commit'); const client = await connect(f.options);
    const data = await call(client, f.root);
    expect(data).toMatchObject({ status: 'partial', persistence: 'committed', observations: 6, evidence: 3,
      counts: { visited_routes: 3, views: 3, blocked_routes: 1, forms: 3 }, cleanup: { browser_closed: true, proxy_closed: true } });
    expect(f.hits).toEqual(['/', '/about', '/contact']); expect(commit).toHaveBeenCalledTimes(1);
    expect(readFileSync(f.lifecyclePath, 'utf8')).toBe(before); expect(existsSync(join(f.root, '.qa', 'modules'))).toBe(false);
    const observations = (await f.store.query('a', 'observation', { limit: 100 })).items;
    expect(observations).toHaveLength(6); expect((await f.store.query('a', 'evidence', { limit: 100 })).items).toHaveLength(3);
    expect((await f.store.query('b', 'observation', { limit: 100 })).items).toHaveLength(0);
    for (const o of observations) {
      expect((await f.store.history('a', 'observation', o.entity.id)).items).toHaveLength(1);
      expect(await f.store.get('a', 'evidence', o.entity.evidence.id)).toMatchObject({ revision: 1 });
    }
    f.store.close(); const reopened = new SqliteKnowledgeAdapter(f.path); stores.push(reopened);
    expect((await reopened.query('a', 'observation', { limit: 100 })).items).toHaveLength(6);
    const db = new DatabaseSync(f.path); expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([]); db.close();
    for (const file of readdirSync(join(f.root, '.qa')).filter(n => n.startsWith('synthetic.sqlite'))) {
      expect(readFileSync(join(f.root, '.qa', file)).includes(Buffer.from(canary))).toBe(false);
    }
  }, 30000);

  it('keeps project bindings and physical stores isolated between server instances', async () => {
    const first = await fixture(); const second = await fixture();
    const client = await connect(first.options);
    expect(await call(client, second.root)).toMatchObject({ status: 'indeterminate', persistence: 'not_attempted' });
    expect(first.hits).toEqual([]); expect(second.hits).toEqual([]);
    expect(await call(client, first.root)).toMatchObject({ persistence: 'committed' });
    expect((await second.store.query('a', 'observation', { limit: 100 })).items).toHaveLength(0);
    expect(second.hits).toEqual([]);
  }, 30000);

  it.each([false, true])('distinguishes static completion from a script dependent shell (%s)', async scripted => {
    const f = await fixture(`<main><button>Button</button>${scripted ? '<script>document.body.dataset.loaded = true</script>' : ''}</main>`);
    const client = await connect(f.options); const data = await call(client, f.root);
    expect(data).toMatchObject({ status: scripted ? 'partial' : 'completed', persistence: 'committed',
      counts: { views: 1, visited_routes: 1, controls: 1 }, mode: 'fresh_anonymous_static' });
    expect(data.limitations).toContain('STATIC_MODE_NO_APPLICATION_JAVASCRIPT');
  }, 30000);

  it.each(['credentials', 'profile', 'profileId', 'storageState', 'cookies', 'session', 'auth'])('blocks %s without navigation or credential reflection', async key => {
    const f = await fixture(); const client = await connect(f.options);
    expect(await call(client, f.root, { [key]: { password: canary } })).toMatchObject({ status: 'blocked', code: 'authentication_not_supported', persistence: 'not_attempted' });
    expect(f.hits).toEqual([]);
  });

  it.each(['/unknown', '//127.0.0.1/', '/a/../', '/%2e/', '/?token=secret', '/#fragment', 'http://user:secret@127.0.0.1/', '/a\\b', ' /'])('rejects ambiguous or unauthorized target %s', async path => {
    const f = await fixture(); const client = await connect(f.options);
    expect(await call(client, f.root, { path })).toMatchObject({ status: 'blocked', code: 'url_not_authorized' }); expect(f.hits).toEqual([]);
  });

  it.each(['ONBOARDING', 'SCOPING', 'WRAP_UP'])('retains phase gate %s without lifecycle writes', async phase => {
    const f = await fixture(); writeFileSync(f.lifecyclePath, JSON.stringify({ ...f.lifecycle, phase }));
    const client = await connect(f.options); expect(await call(client, f.root)).toMatchObject({ status: 'blocked', code: 'phase_restricted' }); expect(f.hits).toEqual([]);
  });

  it('blocks missing binding, stale authorization and incompatible environment', async () => {
    const f = await fixture();
    expect(await call(await connect({ ...f.options, knowledgeBindings: [] }), f.root)).toMatchObject({ code: 'knowledge_unbound' });
    await f.store.commit('a', [{ kind: 'environment', entity: { ...f.environment, rate_limit_ms: 1 }, expected_revision: 1, trace }]);
    expect(await call(await connect(f.options), f.root)).toMatchObject({ code: 'authorization_context_mismatch' });
    expect(await call(await connect({ ...f.options, knowledgeBindings: [{ ...f.options.knowledgeBindings![0], environmentId: 'other' }] }), f.root)).toMatchObject({ code: 'context_incompatible' });
    expect(f.hits).toEqual([]);
  });

  it('requires explicit read-only host acknowledgement and rejects authenticated plans/terminal modules', async () => {
    const f = await fixture(); f.authorization.authorization.read_only_acknowledged = false as true;
    expect(await call(await connect(f.options), f.root)).toMatchObject({ code: 'authorization_context_mismatch' });
    f.authorization.authorization.read_only_acknowledged = true;
    writeFileSync(f.lifecyclePath, JSON.stringify({ ...f.lifecycle, session: { ...f.lifecycle.session, auth: { required: true } } }));
    expect(await call(await connect(f.options), f.root)).toMatchObject({ code: 'authentication_not_supported' });
    writeFileSync(f.lifecyclePath, JSON.stringify({ ...f.lifecycle, modules: { catalog: { state: 'closed' } } }));
    expect(await call(await connect(f.options), f.root)).toMatchObject({ code: 'module_restricted' }); expect(f.hits).toEqual([]);
    expect(await call(await connect(f.options), f.root, { name: 'toString' })).toMatchObject({ code: 'module_restricted' });
    expect(await call(await connect(f.options), f.root, { name: '__proto__' })).toMatchObject({ code: 'module_restricted' });
    expect(f.hits).toEqual([]);
  });

  it('keeps host configuration isolated from later caller mutations', async () => {
    const f = await fixture(); const client = await connect(f.options);
    f.authorization.authorization.navigation_urls.length = 0;
    expect(await call(client, f.root, { path: '/about' })).toMatchObject({ persistence: 'committed' });
  }, 30000);

  it('rejects an already cancelled dispatcher invocation before crawler start', async () => {
    const f = await fixture(); const dispatcher = new ToolDispatcher().register(new DiscoveryHandler(f.options, [f.authorization])).seal();
    const response = await dispatcher.dispatch({ name: 'qap_discover', arguments: { targetPath: f.root, name: 'catalog', path: '/' } }, { requestId: 'c', signal: AbortSignal.abort() });
    expect(JSON.stringify(response)).toContain('cancelled'); expect(f.hits).toEqual([]);
  });

  it('propagates in-flight dispatcher cancellation to transport and waits for cleanup', async () => {
    const f = await fixture(); const abort = new AbortController();
    Object.assign(f.authorization, { dependencies: { browser: { channel: 'chrome' }, resolver: async () => {
      abort.abort(); return [{ address: '127.0.0.1', family: 4 }];
    } } });
    // Host resolver is trusted and deliberately aborts while the real crawler is running.
    const host = 'cancel.example.test', base = f.origin.replace('127.0.0.1', host);
    await f.store.commit('a', [{ kind: 'environment', entity: { ...f.environment, base_url: base, safe_domains: [host] }, expected_revision: 1, trace }]);
    Object.assign(f.authorization, { environmentRevision: 2, authorization: { ...f.authorization.authorization, navigation_urls: [base + '/'] } });
    const dispatcher = new ToolDispatcher().register(new DiscoveryHandler(f.options, [f.authorization])).seal();
    const response = await dispatcher.dispatch({ name: 'qap_discover', arguments: { targetPath: f.root, name: 'catalog', path: '/' } }, { requestId: 'active', signal: abort.signal });
    const item = response.content[0]; if (item.type !== 'text') throw new Error('Expected text');
    expect(JSON.parse(item.text)).toMatchObject({ status: 'indeterminate', persistence: 'not_attempted', cleanup: { browser_closed: true, proxy_closed: true } });
    expect(abort.signal.aborted).toBe(true); expect(f.hits).toEqual([]);
  }, 30000);

  it('sanitizes host failures and emits no secret-bearing console logs', async () => {
    const f = await fixture(); const log = vi.spyOn(console, 'log'); const warn = vi.spyOn(console, 'warn'); const error = vi.spyOn(console, 'error');
    vi.spyOn(f.store, 'get').mockRejectedValueOnce(new Error(canary));
    expect(await call(await connect(f.options), f.root)).toMatchObject({ status: 'indeterminate', code: 'DISCOVERY_UNAVAILABLE', persistence: 'not_attempted' });
    expect(JSON.stringify([log.mock.calls, warn.mock.calls, error.mock.calls])).not.toContain(canary); expect(f.hits).toEqual([]);
  });

  it.each(['page', 'bytes', 'browser', 'redirect', 'private', 'dns'])('delegates %s denial and budgets to the real crawler', async mode => {
    const f = await fixture();
    if (mode === 'page') Object.assign(f.authorization, { limits: { max_pages: 1 } });
    if (mode === 'bytes') Object.assign(f.authorization, { limits: { max_bytes: 1 } });
    if (mode === 'browser') Object.assign(f.authorization, { dependencies: { browser: { executable_path: join(f.root, 'missing-browser.exe') } } });
    if (mode === 'private') f.authorization.authorization.allowed_ips = [];
    if (mode === 'dns') {
      const host = 'rebind.example.test';
      const base = f.origin.replace('127.0.0.1', host);
      f.environment.base_url = base; f.environment.safe_domains = [host];
      await f.store.commit('a', [{ kind: 'environment', entity: f.environment, expected_revision: 1, trace }]);
      f.authorization = { ...f.authorization, environmentRevision: 2, authorization: { ...f.authorization.authorization, navigation_urls: [base + '/'] }, dependencies: { browser: { channel: 'chrome' }, resolver: async () => [{ address: '127.0.0.1', family: 4 }, { address: '10.0.0.1', family: 4 }] } };
      Object.assign(f.options, { discoveryAuthorizations: [f.authorization] });
    }
    const client = await connect(f.options); const data = await call(client, f.root, { path: mode === 'redirect' ? '/redirect' : '/' });
    expect(data.status).not.toBe('completed');
    expect(f.hits).not.toContain('/forbidden');
    if (['private', 'dns', 'browser'].includes(mode)) { expect(f.hits).toEqual([]); expect(data.persistence).toBe('not_attempted'); }
    if (mode === 'page') expect(data).toMatchObject({ counts: { visited_routes: 1, candidate_routes: 2 }, persistence: 'committed' });
  }, 30000);

  it('reports atomic persistence failure without fabricated persisted findings', async () => {
    const f = await fixture(); const db = new DatabaseSync(f.path);
    db.exec(`CREATE TRIGGER synthetic_fail BEFORE INSERT ON knowledge_revisions WHEN NEW.kind='observation' BEGIN SELECT RAISE(ABORT, '${canary}'); END`);
    db.close();
    const client = await connect(f.options); expect(await call(client, f.root)).toMatchObject({ status: 'indeterminate', code: 'PERSISTENCE_FAILED', persistence: 'failed' });
    expect((await f.store.query('a', 'observation', { limit: 100 })).items).toHaveLength(0);
    expect((await f.store.query('a', 'evidence', { limit: 100 })).items).toHaveLength(0);
  }, 30000);
});
