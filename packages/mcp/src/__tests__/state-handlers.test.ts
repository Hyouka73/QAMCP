import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync, rmSync, symlinkSync, renameSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { SqliteKnowledgeAdapter, FileSystemStorage } from '@qap/knowledge';
import type { KnowledgeWrite, KnowledgeEntities, KnowledgeKind } from '@qap/engine';
import { afterEach, describe, expect, it, vi } from 'vitest';
import YAML from 'yaml';

import { createMcpServer, type McpServerOptions } from '../server.js';
import { ContextFiles } from '../handlers/state-services.js';
import { StatusHandler } from '../handlers/status.handler.js';
import { CleanHandler } from '../handlers/clean.handler.js';
import { ContextHandler } from '../handlers/context.handler.js';
import { ToolDispatcher } from '../dispatcher.js';

vi.mock('node:fs', async importOriginal => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return { ...actual, renameSync: vi.fn(actual.renameSync) };
});

const directories: string[] = [];
const stores: SqliteKnowledgeAdapter[] = [];
const connections: Array<{ client: Client; server: ReturnType<typeof createMcpServer> }> = [];
const timestamp = '2026-10-30T12:00:00.000Z';
const canary = 'PRIVATE_VNEXT012_7c75';
const trace = { source: 'synthetic', recorded_by: 'fixture', recorded_at: timestamp, reason: 'Synthetic fixture', review: 'unreviewed' as const, evidence_refs: [] };
function write<K extends KnowledgeKind>(kind: K, entity: KnowledgeEntities[K], expected_revision = 0): KnowledgeWrite {
  return { kind, entity, expected_revision, trace } as KnowledgeWrite;
}
function directory() {
  const path = mkdtempSync(join(tmpdir(), 'qap-state-')); directories.push(path); return path;
}
function legacy(root = directory()) {
  mkdirSync(join(root, '.qa', 'project'), { recursive: true });
  writeFileSync(join(root, '.qa', 'project', 'context.yaml'), YAML.stringify({ _version: '1', project_name: 'Synthetic', objective: 'Synthetic objective for onboarding', objective_source: 'inferred' }));
  writeFileSync(join(root, '.qa', 'project', 'environments.yaml'), YAML.stringify({ default: 'local', environments: { local: { url: 'https://example.test' } } }));
  return root;
}
function open(path: string) { const store = new SqliteKnowledgeAdapter(path); stores.push(store); return store; }
async function fixture() {
  const root = legacy();
  const path = join(root, '.qa', 'memory.sqlite');
  const store = open(path);
  for (const app of ['a', 'b']) await store.commit(app, [
    write('application', { application_id: app, name: app, base_url: 'https://example.test', created_at: timestamp }),
    write('environment', { application_id: app, environment_id: 'local', name: 'local', base_url: 'https://example.test', is_production: false, destructive_actions_allowed: false, safe_domains: ['example.test'] }),
    write('module', { id: 'm', application_id: app, key: 'billing', title: 'Billing', certainty: 'observed', criticality: 'high', dependencies: [], created_at: timestamp, updated_at: timestamp, is_active: true }),
    write('evidence', { id: 'e', kind: 'dom_snippet', pii_masked: true, captured_at: timestamp, uri: 'evidence://synthetic' }),
  ]);
  const options: McpServerOptions = { projectRoots: [root], knowledgeBindings: [{ projectRoot: root, applicationId: 'a', environmentId: 'local', store }] };
  return { root, path, store, options };
}
async function connect(options: McpServerOptions = {}) {
  const server = createMcpServer(options);
  const client = new Client({ name: 'state-test', version: '1' });
  const [a, b] = InMemoryTransport.createLinkedPair();
  connections.push({ client, server });
  await server.connect(b); await client.connect(a);
  return client;
}
async function call(client: Client, name: string, args: Record<string, unknown>) {
  const response = await client.request({ method: 'tools/call', params: { name, arguments: args } }, CallToolResultSchema);
  const item = response.content[0];
  if (item.type !== 'text') throw new Error('Expected text');
  return { response, data: JSON.parse(item.text) as Record<string, any> };
}
function files(root: string): Record<string, string> {
  return Object.fromEntries(readdirSync(root, { recursive: true, withFileTypes: true }).filter(item => item.isFile()).map(item => {
    const path = join(item.parentPath, item.name); return [path, createHash('sha256').update(readFileSync(path)).digest('hex')];
  }));
}
afterEach(async () => {
  vi.restoreAllMocks();
  for (const { client, server } of connections.splice(0)) { await client.close(); await server.close(); }
  stores.splice(0).forEach(store => store.close());
  directories.splice(0).forEach(root => rmSync(root, { recursive: true, force: true }));
});

describe('VNEXT-012 real MCP and physical persistence', () => {
  it('registers all three declarative owners exactly once and never falls back after failure', async () => {
    const root = directory();
    const spy = vi.spyOn(CleanHandler.prototype, 'execute');
    const status = vi.spyOn(StatusHandler.prototype, 'execute');
    const context = vi.spyOn(ContextHandler.prototype, 'execute');
    const client = await connect({ projectRoots: [root] });
    const tools = (await client.listTools()).tools;
    expect(tools).toHaveLength(18);
    expect(new Set(tools.map(tool => tool.name)).size).toBe(18);
    await call(client, 'qap_status', { targetPath: root });
    await call(client, 'qap_clean', { targetPath: root, force: true });
    await call(client, 'qap_context_set', { targetPath: root });
    expect(spy).toHaveBeenCalledTimes(1); expect(status).toHaveBeenCalledTimes(1); expect(context).toHaveBeenCalledTimes(1);
    expect(existsSync(join(root, '.qa'))).toBe(false);
    expect(() => createMcpServer({ handlers: [new CleanHandler({})] })).toThrow();
  });

  it('status inspects uninitialized and legacy projects without creating memory or scan files', async () => {
    const root = directory(); const client = await connect();
    const empty = await call(client, 'qap_status', { targetPath: root });
    expect(empty.data).toMatchObject({ initialized: false, knowledge: { state: 'unbound' } });
    expect(readdirSync(root)).toEqual([]);
    legacy(root);
    const before = files(root);
    const initialized = await call(client, 'qap_status', { targetPath: root });
    expect(initialized.data).toMatchObject({ initialized: true, fase: 'ONBOARDING', provenance: { onboarding: 'legacy_files' } });
    expect(files(root)).toEqual(before);
  });

  it('preserves the browser installation directive without launching a browser', async () => {
    const root = directory();
    const view = vi.fn(); const browser = vi.fn(async () => ({ disponible: false }));
    const handler = new StatusHandler({ projectRoots: [root], browser, view });
    const response = await handler.execute({ targetPath: root });
    const text = response.content[0];
    if (text.type !== 'text') throw new Error('Expected text');
    expect(JSON.parse(text.text)).toMatchObject({ preflight: { navegador_qap: 'falta' }, siguiente_accion: { tipo: 'trabajo', comando: 'npx playwright install chromium' } });
    expect(browser).toHaveBeenCalledTimes(1); expect(view).not.toHaveBeenCalled();
    expect(readdirSync(root)).toEqual([]);
  });

  it('status reports actual isolated SQLite inventory and leaves revisions unchanged', async () => {
    const f = await fixture(); const client = await connect(f.options);
    const before = (await f.store.history('a', 'application', 'a')).items;
    const { data } = await call(client, 'qap_status', { targetPath: f.root });
    expect(data.knowledge).toMatchObject({ state: 'available', application_id: 'a', environment_id: 'local', counts: { module: { available: 1, complete: true }, evidence: { available: 1 }, observation: { available: 0 }, inference: { available: 0 } }, coverage: 'partial' });
    expect(await f.store.history('a', 'application', 'a')).toMatchObject({ items: before });
    expect(data.stats.executions).toBe(0);
  });

  it('reports unavailable/ambiguous bindings without reopening or adopting a database', async () => {
    const f = await fixture(); f.store.close();
    let client = await connect(f.options);
    expect((await call(client, 'qap_status', { targetPath: f.root })).data.knowledge.state).toBe('unavailable');
    expect((await call(client, 'qap_context_set', { targetPath: f.root, objective: canary })).data.status).toBe('blocked');
    client = await connect({ ...f.options, knowledgeBindings: [...f.options.knowledgeBindings!, ...f.options.knowledgeBindings!] });
    expect((await call(client, 'qap_status', { targetPath: f.root })).data.knowledge.state).toBe('unavailable');
  });

  it('reports incomplete inventory without turning an unavailable query into zero modules', async () => {
    const f = await fixture();
    const query = f.store.query.bind(f.store);
    vi.spyOn(f.store, 'query').mockImplementation((app, kind, request) => {
      if (kind === 'module') throw new Error(canary);
      return query(app, kind, request);
    });
    const client = await connect(f.options);
    const r = await call(client, 'qap_status', { targetPath: f.root });
    expect(r.data.knowledge).toMatchObject({ state: 'partial', counts: { module: { available: null, complete: false }, evidence: { available: 1 } } });
    expect(JSON.stringify(r)).not.toContain(canary);
  });

  it('isolates two projects explicitly bound to different applications in the same physical store', async () => {
    const f = await fixture(); const other = legacy();
    const options: McpServerOptions = { projectRoots: [f.root, other], knowledgeBindings: [
      ...f.options.knowledgeBindings!, { projectRoot: other, applicationId: 'b', environmentId: 'local', store: f.store },
    ] };
    const client = await connect(options);
    expect((await call(client, 'qap_status', { targetPath: other })).data.knowledge.application_id).toBe('b');
    await call(client, 'qap_context_set', { targetPath: other, objective: 'Other application context' });
    expect(readFileSync(join(f.root, '.qa', 'project', 'context.yaml'), 'utf8')).not.toContain('Other application context');
    expect((await f.store.history('a', 'application', 'a')).items).toHaveLength(1);
    expect((await f.store.history('b', 'application', 'b')).items).toHaveLength(1);
  });

  it.each([undefined, true, false])('clean blocks force=%s and physically preserves every protected resource', async force => {
    const f = await fixture();
    const protectedNames = ['cache/tmp/file.tmp', 'cache/locks/stale.lock', 'cache/locks/active.lock', 'cache/sessions/protected.json', 'project/auth/profiles.json', 'personal.txt', 'vault.enc'];
    for (const name of protectedNames) { const path = join(f.root, '.qa', name); mkdirSync(join(path, '..'), { recursive: true }); writeFileSync(path, canary); }
    // WAL/SHM are real files owned by the two open SQLite connections.
    const second = open(f.path);
    expect(existsSync(f.path + '-wal')).toBe(true); expect(existsSync(f.path + '-shm')).toBe(true);
    const before = files(f.root);
    const client = await connect(f.options);
    const { data } = await call(client, 'qap_clean', { targetPath: f.root, ...(force === undefined ? {} : { force }) });
    expect(data).toMatchObject({ status: 'blocked', removed: [] });
    expect(files(f.root)).toEqual(before);
    expect((await second.get('a', 'module', 'm'))?.revision).toBe(1);
    expect((await f.store.history('a', 'application', 'a')).items).toHaveLength(1);
  });

  it('blocks cleanup of uninitialized, external and junction projects without touching targets', async () => {
    const root = legacy(); const external = legacy();
    const client = await connect({ projectRoots: [root] });
    expect((await call(client, 'qap_clean', { targetPath: external, force: true })).data.code).toBe('invalid_arguments');
    const link = join(root, '.qa', 'external');
    symlinkSync(external, link, 'junction');
    const before = files(external);
    expect((await call(client, 'qap_clean', { targetPath: root })).response.isError).toBe(true);
    expect(files(external)).toEqual(before);
  });

  it('preserves incremental context, provenance, corrections and explicit confirmation without promoting canonical entities', async () => {
    const f = await fixture(); const client = await connect(f.options);
    let r = await call(client, 'qap_context_set', { targetPath: f.root, objective: 'User declared objective for the application', source: 'user', roles: [{ name: 'admin', source: 'inferred' }] });
    expect(r.data.context.objective_source).toBe('user');
    r = await call(client, 'qap_context_set', { targetPath: f.root, objective: 'Automatic downgrade must be ignored', source: 'inferred' });
    expect(r.data.ignored_downgrades).toHaveLength(1);
    expect(r.data.context.objective).toBe('User declared objective for the application');
    await call(client, 'qap_context_set', { targetPath: f.root, corregir: ['roles'] });
    r = await call(client, 'qap_context_set', { targetPath: f.root, roles: [{ name: 'tester' }], source: 'inferred' });
    expect(r.data.context.roles).toEqual([{ name: 'tester', source: 'user' }]);
    r = await call(client, 'qap_context_set', { targetPath: f.root, confirmar_resumen: 'confirmo_todo' });
    expect(r.data.context.objective_source).toBe('user');
    expect((await f.store.query('a', 'requirement')).items).toEqual([]);
    expect((await f.store.query('a', 'role')).items).toEqual([]);
    expect((await f.store.history('a', 'application', 'a')).items).toHaveLength(1);
    expect(readdirSync(join(f.root, '.qa', 'project', 'context-history')).filter(n => n.endsWith('.json')).length).toBeGreaterThan(1);
  });

  it('rejects environment discrepancies before YAML writes and never copies legacy secrets to SQLite', async () => {
    const f = await fixture(); const client = await connect(f.options); const before = readFileSync(join(f.root, '.qa', 'project', 'context.yaml'), 'utf8');
    const { data } = await call(client, 'qap_context_set', { targetPath: f.root, base_url: 'https://different.test' });
    expect(data.status).toBe('blocked'); expect(readFileSync(join(f.root, '.qa', 'project', 'context.yaml'), 'utf8')).toEqual(before);
    expect((await f.store.history('a', 'application', 'a')).items).toHaveLength(1);
    await call(client, 'qap_context_set', { targetPath: f.root, objective: canary });
    for (const name of ['memory.sqlite', 'memory.sqlite-wal', 'memory.sqlite-shm']) if (existsSync(join(f.root, '.qa', name))) expect(readFileSync(join(f.root, '.qa', name)).includes(Buffer.from(canary))).toBe(false);
  });

  it('validates nested inputs and sanitizes errors without logging canaries', async () => {
    const f = await fixture(); const client = await connect(f.options);
    const application = (await f.store.get('a', 'application', 'a'))!;
    await f.store.commit('a', [write('application', { ...application.entity, metadata: { synthetic_note: canary } }, 1)]);
    const log = vi.spyOn(console, 'error'); const info = vi.spyOn(console, 'log');
    for (const args of [{ force: canary }, { password: canary }, { targetPath: canary }]) {
      const response = await call(client, 'qap_clean', { targetPath: f.root, ...args });
      expect(response.data.code).toBe('invalid_arguments'); expect(JSON.stringify(response)).not.toContain(canary);
    }
    for (const args of [{ roles: [{ name: 'x', password: canary }] }, { base_url: `https://example.test?token=${canary}` }, { source_of_truth: `../${canary}` }, { roles: Array(101).fill('x') }, { objective: { token: canary } }]) {
      const response = await call(client, 'qap_context_set', { targetPath: f.root, ...args });
      expect(response.data.code).toBe('invalid_arguments'); expect(JSON.stringify(response)).not.toContain(canary);
    }
    const sensitiveRoot = join(directory(), canary); mkdirSync(sensitiveRoot); legacy(sensitiveRoot);
    const outside = await call(client, 'qap_clean', { targetPath: sensitiveRoot });
    expect(outside.response.isError).toBe(true); expect(JSON.stringify(outside)).not.toContain(canary);
    expect(JSON.stringify(await call(client, 'qap_status', { targetPath: f.root }))).not.toContain(canary);
    expect((await f.store.history('a', 'application', 'a')).items).toHaveLength(2);
    expect(log).not.toHaveBeenCalled(); expect(info).not.toHaveBeenCalled();
  });

  it('keeps corrupt YAML intact and reports sanitized errors', async () => {
    const root = legacy(); const path = join(root, '.qa', 'project', 'context.yaml');
    writeFileSync(path, `: [invalid ${canary}`);
    const client = await connect({ projectRoots: [root] });
    const r = await call(client, 'qap_context_set', { targetPath: root, objective: 'Replacement' });
    expect(r.response.isError).toBe(true); expect(JSON.stringify(r)).not.toContain(canary);
    expect(readFileSync(path, 'utf8')).toContain(canary);
    const status = await call(client, 'qap_status', { targetPath: root });
    expect(status.data.context_state).toBe('incompatible');
    expect(status.data.advertencias).toContain('legacy_context_unreadable_or_incompatible');
  });

  it('reports a real multi-file publication failure and blocks replay while its recovery journal is unresolved', async () => {
    const root = legacy(); const client = await connect({ projectRoots: [root] });
    const original = readFileSync(join(root, '.qa', 'project', 'context.yaml'), 'utf8');
    const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
    vi.mocked(renameSync).mockImplementationOnce(actual.renameSync).mockImplementationOnce(() => { throw Object.assign(new Error(canary), { code: 'EACCES' }); });
    const r = await call(client, 'qap_context_set', { targetPath: root, base_url: 'https://new.test', objective: 'New objective' });
    expect(r.data).toMatchObject({ status: 'partial', persistence: 'partial', code: 'legacy_publication_incomplete' });
    expect(JSON.stringify(r)).not.toContain(canary);
    expect(readFileSync(join(root, '.qa', 'project', 'context.yaml'), 'utf8')).toBe(original);
    expect(readFileSync(join(root, '.qa', 'project', 'environments.yaml'), 'utf8')).toContain('https://new.test');
    const history = join(root, '.qa', 'project', 'context-history');
    const journal = readdirSync(history).find(name => name.endsWith('.json'))!;
    const entries = JSON.parse(readFileSync(join(history, journal), 'utf8')).entries;
    expect(entries.some((entry: { before: string }) => entry.before === original)).toBe(true);
    expect(existsSync(join(history, journal + '.committed'))).toBe(false);
    expect((await call(client, 'qap_context_set', { targetPath: root, objective: 'Retry' })).response.isError).toBe(true);
  });

  it('reports lifecycle failure after YAML publication instead of claiming global success', async () => {
    const root = legacy(); const client = await connect({ projectRoots: [root] });
    vi.spyOn(FileSystemStorage.prototype, 'updateLifecycleState').mockRejectedValueOnce(new Error(canary));
    const r = await call(client, 'qap_context_set', { targetPath: root, objective: 'Committed context awaiting lifecycle recovery' });
    expect(r.data).toMatchObject({ status: 'partial', persistence: 'committed', code: 'legacy_lifecycle_incomplete' });
    expect(JSON.stringify(r)).not.toContain(canary);
    expect(readFileSync(join(root, '.qa', 'project', 'context.yaml'), 'utf8')).toContain('Committed context awaiting lifecycle recovery');
    expect((await call(client, 'qap_context_set', { targetPath: root })).data.status).toBe('success');
  });

  it('does not grow context history for an identical update and preserves it after reopening the server', async () => {
    const root = legacy(); const options = { projectRoots: [root] }; let client = await connect(options);
    const args = { targetPath: root, objective: 'Idempotent user objective', source: 'user' };
    expect((await call(client, 'qap_context_set', args)).data.status).toBe('success');
    const before = readdirSync(join(root, '.qa', 'project', 'context-history'));
    client = await connect(options);
    expect((await call(client, 'qap_context_set', args)).data.status).toBe('success');
    expect(readdirSync(join(root, '.qa', 'project', 'context-history'))).toEqual(before);
  });

  it('detects concurrent legacy changes, active locks, aborts and unresolved journals', () => {
    const root = legacy(); const path = join(root, '.qa', 'project', 'context.yaml');
    const controller = new AbortController();
    let staged = new ContextFiles(root, controller.signal);
    expect(() => new ContextFiles(root, controller.signal)).toThrow();
    staged.write(path, 'candidate', 'utf8'); writeFileSync(path, 'concurrent');
    expect(() => staged.flush()).toThrow(); expect(readFileSync(path, 'utf8')).toBe('concurrent'); staged.close();
    staged = new ContextFiles(root, controller.signal); staged.write(path, 'candidate', 'utf8'); controller.abort();
    expect(() => staged.flush()).toThrow(); staged.close();
    const history = join(root, '.qa', 'project', 'context-history'); mkdirSync(history); writeFileSync(join(history, 'pending.json'), '{}');
    expect(() => new ContextFiles(root, new AbortController().signal)).toThrow();
    expect(readFileSync(path, 'utf8')).toBe('concurrent');
  });

  it('rejects cancellation before execution and preserves the fixture', async () => {
    const root = legacy(); const dispatcher = new ToolDispatcher(); const handler = new CleanHandler({ projectRoots: [root] });
    const execute = vi.spyOn(handler, 'execute'); dispatcher.register(handler).seal();
    const controller = new AbortController(); controller.abort(); const before = files(root);
    const response = await dispatcher.dispatch({ name: 'qap_clean', arguments: { targetPath: root } }, { requestId: 1, signal: controller.signal });
    expect(response.isError).toBe(true); expect(execute).not.toHaveBeenCalled(); expect(files(root)).toEqual(before);
  });

  it('preserves physical CAS, history, reference pins, rollback and integrity across two connections and reopen', async () => {
    const f = await fixture(); const second = open(f.path);
    const original = (await f.store.get('a', 'module', 'm'))!;
    await second.commit('a', [write('module', { ...original.entity, title: 'New title' }, 1)]);
    await expect(f.store.commit('a', [write('module', { ...original.entity, title: 'Stale' }, 1)])).rejects.toMatchObject({ code: 'CONFLICT' });
    const db = new DatabaseSync(f.path);
    try {
      db.exec("CREATE TRIGGER synthetic_failure BEFORE INSERT ON knowledge_revisions WHEN NEW.id = 'failed' BEGIN SELECT RAISE(ABORT, 'PRIVATE_FAILURE'); END");
      await expect(second.commit('a', [write('module', { ...original.entity, title: 'Rolled back' }, 2), write('evidence', { id: 'failed', kind: 'dom_snippet', pii_masked: true, captured_at: timestamp, uri: 'evidence://synthetic' })])).rejects.toBeDefined();
      expect((await f.store.get('a', 'module', 'm'))?.revision).toBe(2);
      expect((await f.store.history('a', 'module', 'm')).items).toHaveLength(2);
      expect((await f.store.get('b', 'module', 'm'))?.entity.title).toBe('Billing');
      const relation = write('relation', { id: 'rel', source: { kind: 'module', id: 'm' }, target: { kind: 'evidence', id: 'e' }, predicate: 'supports' });
      await f.store.commit('a', [relation]);
      expect((await f.store.get('a', 'relation', 'rel'))?.references).toContainEqual({ kind: 'module', id: 'm', revision: 2 });
      const client = await connect(f.options); await call(client, 'qap_clean', { targetPath: f.root, force: true });
      expect(db.prepare('PRAGMA integrity_check').get()?.integrity_check).toBe('ok');
      expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
    } finally { db.exec('DROP TRIGGER IF EXISTS synthetic_failure'); db.close(); }
    f.store.close(); second.close(); const reopened = open(f.path);
    expect((await reopened.get('a', 'module', 'm', 1))?.entity.title).toBe('Billing');
    expect((await reopened.get('a', 'module', 'm'))?.entity.title).toBe('New title');
    expect(await reopened.get('a', 'evidence', 'failed')).toBeNull();
  });
});
