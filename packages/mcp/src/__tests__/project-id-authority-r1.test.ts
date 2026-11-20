import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { pathToFileURL } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ListRootsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { afterEach, expect, it, vi } from 'vitest';
import { QapApplicationService } from '../application/application-service.js';
import { ProjectHandler } from '../handlers/project.handler.js';
import { WorkspaceBootstrap } from '../workspace-bootstrap.js';
import { workspaceStorageKey } from '../project-reset.js';

const cleanup: Array<() => void | Promise<void>> = [];
afterEach(async () => { for (const fn of cleanup.splice(0).reverse()) await fn(); });

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'qap-r1-'));
  cleanup.push(() => rmSync(dir, { recursive: true, force: true }));
  const host = join(dir, 'host'), app = join(dir, 'app'), a = join(dir, 'a'), b = join(dir, 'b');
  for (const path of [host, a, b]) mkdirSync(path);
  const service = new QapApplicationService({ hostRootDir: app, projectOperationDirectory: host });
  cleanup.push(() => service.close());
  const pa = service.createProject({ name: 'A', canonicalRoot: a }).project.project_id;
  const pb = service.createProject({ name: 'B', canonicalRoot: b }).project.project_id;
  const accessA = service.authority.grant({ project_id: pa, capability: 'access', scope: { root_path: a }, granted_by: 'host' });
  service.authority.grant({ project_id: pb, capability: 'access', scope: { root_path: b }, granted_by: 'host' });
  const helper = (root: string) => execFileSync(process.execPath, [resolve('../../scripts/qap-authorize-workspace.mjs'), root], {
    env: { ...process.env, QAP_MCP_APP_SERVICE_DIR: app, QAP_MCP_WORKSPACE_HOST_DIR: host }, timeout: 12000, windowsHide: true,
  });
  helper(a); helper(b);
  const registry = join(host, 'authorized-roots.json');
  const registered = (root: string) => (JSON.parse(readFileSync(registry, 'utf8')) as string[]).includes(root);
  const db = new DatabaseSync(join(app, 'app-service.sqlite')); cleanup.push(() => db.close());
  return { dir, host, app, a, b, pa, pb, accessA, service, helper, registered, db };
}

it('requires the exact persistent preparation grant before creating a project', async () => {
  const f = fixture();
  const root = join(f.dir, 'new-project');
  mkdirSync(root);
  const handler = new ProjectHandler({ applicationService: f.service, projectRoots: [root], isRegisteredProjectRoot: f.registered });
  const create = () => handler.execute({ action: 'create', canonical_root: root, name: 'New' });
  const before = f.service.listProjects({ includeDeleted: true });
  expect((await create()).isError).toBe(true);
  expect(f.service.listProjects({ includeDeleted: true })).toEqual(before);
  expect(readdirSync(root)).toEqual([]);
  f.helper(root);
  const original = f.service.getRootAuthorizationReference.bind(f.service);
  const spy = vi.spyOn(f.service, 'getRootAuthorizationReference').mockImplementation((path, registered, context) => {
    const ref = original(path, registered, context);
    spy.mockRestore();
    if (ref) { expect(f.service.revokeRootAuthorizationGrant(path, ref.generation, ref.grant_id)).toBe(true); f.helper(path); }
    return ref;
  });
  expect((await create()).isError).toBe(true);
  expect(f.service.listProjects({ includeDeleted: true })).toEqual(before);
  expect(readdirSync(root)).toEqual([]);
  const grant = vi.spyOn(f.service.authority, 'grant').mockImplementationOnce(() => {
    throw new Error('synthetic grant write failure');
  });
  try {
    expect((await create()).isError).toBe(true);
    expect(f.service.listProjects({ includeDeleted: true })).toEqual(before);
  } finally {
    grant.mockRestore();
  }
  expect((await create()).isError).toBe(false);
}, 30000);

it('rejects untrusted deletion and recovery without touching another project', async () => {
  const f = fixture();
  const handler = new ProjectHandler({ applicationService: f.service, projectRoots: [f.a], isRegisteredProjectRoot: f.registered });
  const before = f.service.listProjects({ includeDeleted: true });
  expect((await handler.execute({ action: 'delete_preview', project_id: f.pb })).isError).toBe(true);
  expect((await handler.execute({ action: 'delete_confirm', project_id: f.pb, confirmation_token: 'fake', decision: 'confirm_delete' })).isError).toBe(true);
  expect((await handler.execute({ action: 'recover', project_id: f.pb })).isError).toBe(true);
  expect(f.service.listProjects({ includeDeleted: true })).toEqual(before);
}, 30000);

it('enforces create and lifecycle restrictions on two compiled stdio servers', async () => {
  const f = fixture();
  const root = join(f.dir, 'stdio-new'); mkdirSync(root); f.helper(root);
  const beforeB = f.db.prepare('SELECT * FROM projects WHERE project_id = ?').get(f.pb);
  const clients: Client[] = [];
  for (let i = 0; i < 2; i++) {
    const client = new Client({ name: `r3-stdio-${i}`, version: '1' }, {});
    await client.connect(new StdioClientTransport({ command: process.execPath, args: [resolve('dist/server.js')], stderr: 'pipe',
      env: { ...process.env as Record<string, string>, QAP_MCP_WORKSPACE_HOST_DIR: f.host, QAP_MCP_APP_SERVICE_DIR: f.app,
        QAP_MCP_WORKSPACE_ROOT: root, QAP_DISABLE_INTERACTIVE_AUTH: '1', NODE_ENV: 'test' } }));
    clients.push(client); cleanup.push(() => client.close());
  }
  const call = async (client: Client, action: string, args: Record<string, unknown>) => {
    const response = await client.callTool({ name: 'qap_project', arguments: { action, ...args } }, undefined, { timeout: 10000 });
    return JSON.parse((response.content as Array<{ text: string }>)[0].text);
  };
  expect((await call(clients[0], 'create', { canonical_root: root, name: 'Stdio' })).status).toBe('success');
  expect((await call(clients[1], 'create', { canonical_root: f.b, name: 'Forbidden' })).status).toBe('blocked');
  expect((await call(clients[0], 'delete_confirm', { project_id: f.pb, confirmation_token: 'fake', decision: 'confirm_delete' })).code).toBe('project_not_found');
  expect((await call(clients[1], 'recover', { project_id: f.pb })).code).toBe('administrative_recovery_unavailable');
  expect(f.db.prepare('SELECT * FROM projects WHERE project_id = ?').get(f.pb)).toEqual(beforeB);
}, 45000);

it('confirms a current preview once through compiled stdio and preserves the neighboring project', async () => {
  const f = fixture();
  const bootstrap = new WorkspaceBootstrap(f.host, f.service);
  for (const root of [f.a, f.b]) {
    const binding = await bootstrap.prepare(root, 'https://example.invalid');
    expect(binding).toBeDefined();
    expect((await binding!.store.get(binding!.applicationId, 'application', binding!.applicationId))?.revision).toBe(1);
    writeFileSync(join(root, 'protected.txt'), root);
  }
  bootstrap.close();
  const client = new Client({ name: 'delete-confirm-stdio', version: '1' }, { capabilities: { roots: {} } });
  client.setRequestHandler(ListRootsRequestSchema, () => ({ roots: [{ uri: pathToFileURL(f.a).href }] }));
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [resolve('dist/server.js')], stderr: 'pipe',
    env: { ...process.env as Record<string, string>, QAP_MCP_WORKSPACE_HOST_DIR: f.host, QAP_MCP_APP_SERVICE_DIR: f.app,
      QAP_DISABLE_INTERACTIVE_AUTH: '1', NODE_ENV: 'test' } }));
  cleanup.push(() => client.close());
  const call = async (action: string, args: Record<string, unknown>) => {
    const res = await client.callTool({ name: 'qap_project', arguments: { action, ...args } }, undefined, { timeout: 10000 });
    return JSON.parse((res.content as Array<{ text: string }>)[0].text);
  };
  const knowledgePath = join(f.host, workspaceStorageKey(f.b), 'knowledge.sqlite');
  const knowledge = () => {
    const db = new DatabaseSync(knowledgePath, { readOnly: true });
    try { return (db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as Array<{name: string}>)
      .map(({ name }) => [name, db.prepare(`SELECT * FROM "${name.replaceAll('"', '""')}"`).all()]); }
    finally { db.close(); }
  };
  const beforeB = { project: f.db.prepare('SELECT * FROM projects WHERE project_id = ?').get(f.pb),
    grants: f.db.prepare('SELECT * FROM permission_grants WHERE project_id = ?').all(f.pb), knowledge: knowledge(),
    file: readFileSync(join(f.b, 'protected.txt'), 'utf8') };
  const preview = () => call('delete_preview', { project_id: f.pa });
  const first = await preview();
  expect(first.status).toBe('confirmation_required');
  const token = first.preview.confirmation_token;
  expect((await call('delete_confirm', { project_id: f.pa, confirmation_token: token, decision: 'decline' })).code).toBe('delete_decision_not_confirmed');
  expect((await call('delete_confirm', { project_id: f.pb, confirmation_token: token, decision: 'confirm_delete' })).status).toBe('blocked');
  expect(f.db.prepare('SELECT status FROM projects WHERE project_id = ?').get(f.pa)).toMatchObject({ status: 'active' });
  f.service.authority.grant({ project_id: f.pa, capability: 'observe', granted_by: 'test' });
  expect((await call('delete_confirm', { project_id: f.pa, confirmation_token: token, decision: 'confirm_delete' })).code).toBe('delete_preview_stale');
  const beforeRevocation = await preview();
  f.service.authority.revokeGrant(f.pa, f.accessA.grant_id);
  f.service.authority.grant({ project_id: f.pa, capability: 'access', scope: { root_path: f.a }, granted_by: 'test' });
  expect((await call('delete_confirm', { project_id: f.pa, confirmation_token: beforeRevocation.preview.confirmation_token, decision: 'confirm_delete' })).code).toBe('delete_preview_stale');
  const fresh = await preview();
  const freshToken = fresh.preview.confirmation_token;
  expect((await call('delete_confirm', { project_id: f.pa, confirmation_token: freshToken, decision: 'confirm_delete', purge_workspace_qa: true })).code).toBe('delete_preview_stale');
  const deleted = await call('delete_confirm', { project_id: f.pa, confirmation_token: freshToken, decision: 'confirm_delete' });
  expect(deleted.status).toBe('deleted');
  expect(f.db.prepare('SELECT status FROM projects WHERE project_id = ?').get(f.pa)).toMatchObject({ status: 'deleted' });
  expect(f.db.prepare('SELECT * FROM deletion_tombstones WHERE project_id = ?').get(f.pa)).toBeDefined();
  expect(f.db.prepare('SELECT consumed_at FROM pending_delete_requests WHERE token_hash = ?').get(createHash('sha256').update(freshToken).digest('hex'))).toMatchObject({ consumed_at: expect.any(String) });
  expect((await call('delete_confirm', { project_id: f.pa, confirmation_token: freshToken, decision: 'confirm_delete' })).status).toBe('blocked');
  expect({ project: f.db.prepare('SELECT * FROM projects WHERE project_id = ?').get(f.pb),
    grants: f.db.prepare('SELECT * FROM permission_grants WHERE project_id = ?').all(f.pb), knowledge: knowledge(),
    file: readFileSync(join(f.b, 'protected.txt'), 'utf8') }).toEqual(beforeB);
}, 45000);

it.each([false, true])('finishes an interrupted deletion once across compiled server restart (purge .qa: %s)', async (purge) => {
  const f = fixture();
  const bootstrap = new WorkspaceBootstrap(f.host, f.service);
  for (const root of [f.a, f.b]) {
    const binding = await bootstrap.prepare(root, 'https://example.invalid');
    expect((await binding!.store.get(binding!.applicationId, 'application', binding!.applicationId))?.revision).toBe(1);
    writeFileSync(join(root, 'protected.txt'), root);
  }
  bootstrap.close();
  mkdirSync(join(f.a, '.qa'), { recursive: true });
  writeFileSync(join(f.a, '.qa', 'approved.txt'), 'approved');
  const bKnowledge = () => {
    const db = new DatabaseSync(join(f.host, workspaceStorageKey(f.b), 'knowledge.sqlite'), { readOnly: true });
    try { return (db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as Array<{name: string}>)
      .map(({ name }) => [name, db.prepare(`SELECT * FROM "${name.replaceAll('"', '""')}"`).all()]); }
    finally { db.close(); }
  };
  const snapshotB = () => ({ project: f.db.prepare('SELECT * FROM projects WHERE project_id = ?').get(f.pb),
    grants: f.db.prepare('SELECT * FROM permission_grants WHERE project_id = ?').all(f.pb),
    knowledge: bKnowledge(), file: readFileSync(join(f.b, 'protected.txt'), 'utf8') });
  const beforeB = snapshotB();
  const connect = async () => {
    const client = new Client({ name: 'delete-interruption-stdio', version: '1' }, {});
    await client.connect(new StdioClientTransport({ command: process.execPath, args: [resolve('dist/server.js')], stderr: 'pipe',
      env: { ...process.env as Record<string, string>, QAP_MCP_WORKSPACE_HOST_DIR: f.host, QAP_MCP_APP_SERVICE_DIR: f.app,
        QAP_MCP_WORKSPACE_ROOT: f.a, QAP_DISABLE_INTERACTIVE_AUTH: '1', NODE_ENV: 'test' } }));
    return client;
  };
  const call = async (client: Client, action: string, args: Record<string, unknown>) => {
    const res = await client.callTool({ name: 'qap_project', arguments: { action, ...args } }, undefined, { timeout: 10000 });
    return JSON.parse((res.content as Array<{ text: string }>)[0].text);
  };
  const first = await connect();
  try {
    const preview = await call(first, 'delete_preview', { project_id: f.pa, purge_workspace_qa: purge });
    const token = preview.preview.confirmation_token;
    f.db.exec("CREATE TRIGGER test_interrupted_delete BEFORE UPDATE OF status ON projects WHEN NEW.status = 'deleted' BEGIN SELECT RAISE(ABORT, 'injected interruption'); END");
    expect((await call(first, 'delete_confirm', { project_id: f.pa, confirmation_token: token, decision: 'confirm_delete', purge_workspace_qa: purge })).status).not.toBe('deleted');
    expect(f.db.prepare('SELECT status FROM projects WHERE project_id = ?').get(f.pa)).toMatchObject({ status: 'deleting' });
    expect(f.db.prepare('SELECT consumed_at FROM pending_delete_requests WHERE token_hash = ?').get(createHash('sha256').update(token).digest('hex'))).toMatchObject({ consumed_at: expect.any(String) });
    const persisted = f.db.prepare('SELECT scope_preview_json FROM pending_delete_requests WHERE token_hash = ?').get(createHash('sha256').update(token).digest('hex')) as { scope_preview_json: string };
    expect(JSON.parse(persisted.scope_preview_json).delete_operation).toMatchObject({
      version: 1, project_id: f.pa, canonical_root: f.a,
      generation: expect.any(String), started_at: expect.any(String),
      scope_hash: preview.preview.scope_hash, purge_workspace_qa: purge,
    });
    await first.close();
    const retry = await connect();
    expect(f.db.prepare('SELECT status FROM projects WHERE project_id = ?').get(f.pa)).toMatchObject({ status: 'deleting' });
    await retry.close();
    f.db.exec('DROP TRIGGER test_interrupted_delete');
    const [next, concurrent] = await Promise.all([connect(), connect()]);
    try {
      expect((await call(next, 'delete_confirm', { project_id: f.pa, confirmation_token: token, decision: 'confirm_delete' })).status).toBe('blocked');
      expect(f.db.prepare('SELECT status FROM projects WHERE project_id = ?').get(f.pa)).toMatchObject({ status: 'deleted' });
      expect(f.db.prepare('SELECT * FROM deletion_tombstones WHERE project_id = ?').get(f.pa)).toMatchObject({ project_id: f.pa, canonical_root: f.a });
      const state = f.db.prepare("SELECT value FROM host_session_state WHERE key LIKE 'root_deletion_generation:v1:%'").get() as { value: string };
      expect(JSON.parse(state.value).generation).toBe(JSON.parse(persisted.scope_preview_json).delete_operation.generation);
      expect(existsSync(join(f.a, '.qa'))).toBe(!purge);
      expect(snapshotB()).toEqual(beforeB);
      expect(f.db.prepare("SELECT COUNT(*) AS n FROM permission_grants WHERE project_id = ? AND status = 'active'").get(f.pa)).toMatchObject({ n: 0 });
      expect(await f.service.reconcilePendingDeletion()).toEqual([]);
    } finally { await next.close(); await concurrent.close(); }
  } finally { await first.close(); }
}, 45000);

it('leaves historical deletions with incomplete intent blocked without deleting files', async () => {
  const f = fixture();
  mkdirSync(join(f.a, '.qa'));
  writeFileSync(join(f.a, '.qa', 'preserve.txt'), 'keep');
  const preview = f.service.previewDelete(f.pa);
  f.db.prepare("UPDATE pending_delete_requests SET consumed_at = ? WHERE project_id = ?").run(new Date().toISOString(), f.pa);
  f.db.prepare("UPDATE projects SET status = 'deleting' WHERE project_id = ?").run(f.pa);
  expect(await f.service.reconcilePendingDeletion()).toEqual([{ project_id: f.pa, status: 'blocked', reason: 'deletion_intent_invalid' }]);
  expect(readFileSync(join(f.a, '.qa', 'preserve.txt'), 'utf8')).toBe('keep');
  expect(f.db.prepare('SELECT status FROM projects WHERE project_id = ?').get(f.pa)).toMatchObject({ status: 'deleting' });
  expect(f.db.prepare('SELECT * FROM deletion_tombstones WHERE project_id = ?').get(f.pa)).toBeUndefined();
  expect(preview.confirmation_token).toBeTruthy();
}, 30000);

it('reconciles after killing the compiled server at a deterministic post-confirmation barrier', async () => {
  const f = fixture();
  const hook = join(f.dir, 'barrier.cjs');
  writeFileSync(hook, `const fs = require('node:fs');
const original = fs.renameSync;
fs.renameSync = function(from, to) {
  const result = original.apply(this, arguments);
  if (String(to).endsWith('.latest.recovery.json')) {
    process.stderr.write('QAP_TEST_BARRIER\\n');
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0);
  }
  return result;
};
require('node:module').syncBuiltinESMExports();`);
  const env = { ...process.env as Record<string, string>, QAP_MCP_WORKSPACE_HOST_DIR: f.host,
    QAP_MCP_APP_SERVICE_DIR: f.app, QAP_MCP_WORKSPACE_ROOT: f.a, QAP_DISABLE_INTERACTIVE_AUTH: '1', NODE_ENV: 'test' };
  const transport = new StdioClientTransport({ command: process.execPath, args: ['--require', hook, resolve('dist/server.js')], stderr: 'pipe', env });
  const client = new Client({ name: 'kill-delete-server', version: '1' }, {});
  await client.connect(transport);
  const call = async (c: Client, action: string, args: Record<string, unknown>) => {
    const response = await c.callTool({ name: 'qap_project', arguments: { action, ...args } }, undefined, { timeout: 15000 });
    return JSON.parse((response.content as Array<{ text: string }>)[0].text);
  };
  try {
    const preview = await call(client, 'delete_preview', { project_id: f.pa });
    const barrier = new Promise<void>((resolveBarrier, reject) => {
      let received = '';
      const timer = setTimeout(() => reject(new Error('barrier timeout')), 12000);
      transport.stderr!.on('data', (chunk: Buffer) => {
        received += chunk.toString();
        if (received.includes('QAP_TEST_BARRIER')) { clearTimeout(timer); resolveBarrier(); }
      });
    });
    const deletion = call(client, 'delete_confirm', { project_id: f.pa, confirmation_token: preview.preview.confirmation_token, decision: 'confirm_delete' }).catch(() => undefined);
    await barrier;
    const persisted = f.db.prepare('SELECT scope_preview_json FROM pending_delete_requests WHERE project_id = ? AND consumed_at IS NOT NULL').get(f.pa) as { scope_preview_json: string };
    expect(f.db.prepare('SELECT status FROM projects WHERE project_id = ?').get(f.pa)).toMatchObject({ status: 'deleting' });
    expect(f.db.prepare('SELECT * FROM deletion_tombstones WHERE project_id = ?').get(f.pa)).toBeUndefined();
    process.kill(transport.pid!);
    await deletion;
    await client.close();
    const restart = new Client({ name: 'restart-delete-server', version: '1' }, {});
    await restart.connect(new StdioClientTransport({ command: process.execPath, args: [resolve('dist/server.js')], stderr: 'pipe', env }));
    try {
      expect(f.db.prepare('SELECT status FROM projects WHERE project_id = ?').get(f.pa)).toMatchObject({ status: 'deleted' });
      expect(f.db.prepare('SELECT * FROM deletion_tombstones WHERE project_id = ?').get(f.pa)).toBeDefined();
      const rootState = f.db.prepare("SELECT value FROM host_session_state WHERE key LIKE 'root_deletion_generation:v1:%'").get() as { value: string };
      expect(JSON.parse(rootState.value).generation).toBe(JSON.parse(persisted.scope_preview_json).delete_operation.generation);
      expect(f.db.prepare('SELECT status FROM projects WHERE project_id = ?').get(f.pb)).toMatchObject({ status: 'active' });
    } finally { await restart.close(); }
  } finally { await client.close(); }
}, 45000);

it('blocks changed deletion scope and resumes the original operation after it is restored', async () => {
  const f = fixture();
  mkdirSync(join(f.a, '.qa'));
  writeFileSync(join(f.a, '.qa', 'approved.txt'), 'approved');
  const preview = f.service.previewDelete(f.pa);
  f.db.exec("CREATE TRIGGER test_early_interrupt BEFORE UPDATE OF status ON permission_grants WHEN NEW.status = 'revoked' BEGIN SELECT RAISE(ABORT, 'early interruption'); END");
  await expect(f.service.confirmDelete(f.pa, preview.confirmation_token, 'confirm_delete', { purgeWorkspaceQa: true })).rejects.toThrow('early interruption');
  f.db.exec('DROP TRIGGER test_early_interrupt');
  writeFileSync(join(f.a, '.qa', 'new.txt'), 'new data');
  expect(await f.service.reconcilePendingDeletion()).toEqual([{ project_id: f.pa, status: 'blocked', reason: 'deletion_scope_changed' }]);
  expect(readFileSync(join(f.a, '.qa', 'new.txt'), 'utf8')).toBe('new data');
  expect(f.db.prepare('SELECT * FROM deletion_tombstones WHERE project_id = ?').get(f.pa)).toBeUndefined();
  rmSync(join(f.a, '.qa', 'new.txt'));
  expect(await f.service.reconcilePendingDeletion()).toEqual([{ project_id: f.pa, status: 'deleted' }]);
  expect(f.db.prepare('SELECT * FROM deletion_tombstones WHERE project_id = ?').get(f.pa)).toBeDefined();
}, 30000);

it.each(['contender', 'kill'] as const)('resumes physically interrupted cleanup across processes (%s)', async (mode) => {
  const f = fixture();
  const bootstrap = new WorkspaceBootstrap(f.host, f.service);
  for (const root of [f.a, f.b]) {
    const binding = await bootstrap.prepare(root, 'https://example.invalid');
    expect((await binding!.store.get(binding!.applicationId, 'application', binding!.applicationId))?.revision).toBe(1);
    writeFileSync(join(root, 'protected.txt'), root);
  }
  bootstrap.close();
  mkdirSync(join(f.a, '.qa'), { recursive: true });
  const target = join(f.a, '.qa', 'approved.txt'); writeFileSync(target, 'approved');
  const snapshotB = () => {
    const db = new DatabaseSync(join(f.host, workspaceStorageKey(f.b), 'knowledge.sqlite'), { readOnly: true });
    try {
      const tables = (db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as Array<{ name: string }>).map(({ name }) => [name, db.prepare(`SELECT * FROM "${name.replaceAll('"', '""')}"`).all()]);
      const files = (dir: string): unknown[] => readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).map(entry => {
        const path = join(dir, entry.name);
        return entry.isDirectory() ? [entry.name, files(path)] : [entry.name, readFileSync(path).toString('base64')];
      });
      const appTables = (f.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as Array<{ name: string }>).flatMap(({ name }) => {
        const quoted = name.replaceAll('"', '""');
        const columns = f.db.prepare(`PRAGMA table_info("${quoted}")`).all() as Array<{ name: string }>;
        return columns.some(column => column.name === 'project_id') ? [[name, f.db.prepare(`SELECT * FROM "${quoted}" WHERE project_id = ?`).all(f.pb)]] : [];
      });
      return { tables, appTables, files: files(f.b) };
    } finally { db.close(); }
  };
  const beforeB = snapshotB();
  const preview = f.service.previewDelete(f.pa);
  f.db.exec("CREATE TRIGGER test_reconcile_gate BEFORE UPDATE OF status ON permission_grants WHEN NEW.status = 'revoked' BEGIN SELECT RAISE(ABORT, 'prepare pending'); END");
  await expect(f.service.confirmDelete(f.pa, preview.confirmation_token, 'confirm_delete', { purgeWorkspaceQa: true })).rejects.toThrow('prepare pending');
  f.db.exec('DROP TRIGGER test_reconcile_gate');
  const tokenHash = createHash('sha256').update(preview.confirmation_token).digest('hex');
  const pending = f.db.prepare('SELECT scope_preview_json, consumed_at FROM pending_delete_requests WHERE token_hash = ?').get(tokenHash) as { scope_preview_json: string; consumed_at: string };
  const intent = JSON.parse(pending.scope_preview_json).delete_operation;
  expect(pending.consumed_at).toBeTruthy();
  const release = join(f.dir, 'release'), hook = join(f.dir, 'cleanup-barrier.cjs');
  writeFileSync(hook, `const fs = require('node:fs');
const original = fs.rmSync;
fs.rmSync = function(path) {
  const result = original.apply(this, arguments);
  if (String(path) === ${JSON.stringify(target)}) {
    process.stderr.write('QAP_CLEANUP_BARRIER\\n');
    while (!fs.existsSync(${JSON.stringify(release)})) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20);
  }
  return result;
};
require('node:module').syncBuiltinESMExports();`);
  const env = { ...process.env as Record<string, string>, QAP_MCP_WORKSPACE_HOST_DIR: f.host, QAP_MCP_APP_SERVICE_DIR: f.app, QAP_MCP_WORKSPACE_ROOT: f.a, QAP_DISABLE_INTERACTIVE_AUTH: '1', NODE_ENV: 'test' };
  const transport = new StdioClientTransport({ command: process.execPath, args: ['--require', hook, resolve('dist/server.js')], stderr: 'pipe', env });
  const first = new Client({ name: 'reconcile-holder', version: '1' }, {});
  let output = '';
  const reached = new Promise<void>((done, reject) => {
    const timeout = setTimeout(() => reject(new Error(`cleanup barrier timeout: ${output}`)), 15000);
    transport.stderr!.on('data', (chunk: Buffer) => { output += chunk.toString(); if (output.includes('QAP_CLEANUP_BARRIER')) { clearTimeout(timeout); done(); } });
  });
  const connecting = first.connect(transport).catch(() => undefined);
  try {
    await reached;
    expect(existsSync(target)).toBe(false);
    expect(f.db.prepare('SELECT status FROM projects WHERE project_id = ?').get(f.pa)).toMatchObject({ status: 'deleting' });
    expect(f.db.prepare('SELECT * FROM deletion_tombstones WHERE project_id = ?').get(f.pa)).toBeUndefined();
    expect(f.db.prepare("SELECT COUNT(*) AS n FROM permission_grants WHERE project_id = ? AND status = 'active'").get(f.pa)).toMatchObject({ n: 0 });
    expect(snapshotB()).toEqual(beforeB);
    if (mode === 'contender') {
      const otherTransport = new StdioClientTransport({ command: process.execPath, args: [resolve('dist/server.js')], stderr: 'pipe', env });
      const other = new Client({ name: 'reconcile-contender', version: '1' }, {});
      let otherOutput = ''; otherTransport.stderr!.on('data', (chunk: Buffer) => { otherOutput += chunk.toString(); });
      try {
        await other.connect(otherTransport).catch(() => undefined);
        expect(otherOutput).toContain(`QAP deletion reconciliation blocked for ${f.pa}: project_storage_busy`);
        expect(f.db.prepare('SELECT * FROM deletion_tombstones WHERE project_id = ?').get(f.pa)).toBeUndefined();
        expect(snapshotB()).toEqual(beforeB);
      } finally { await other.close(); }
      writeFileSync(release, 'release');
    } else process.kill(transport.pid!);
    await connecting; await first.close();
    const restart = new Client({ name: 'reconcile-restart', version: '1' }, {});
    await restart.connect(new StdioClientTransport({ command: process.execPath, args: [resolve('dist/server.js')], stderr: 'pipe', env }));
    try {
      expect(f.db.prepare('SELECT status FROM projects WHERE project_id = ?').get(f.pa)).toMatchObject({ status: 'deleted' });
      expect(f.db.prepare('SELECT * FROM deletion_tombstones WHERE project_id = ?').all(f.pa)).toEqual([expect.objectContaining({ project_id: f.pa, canonical_root: f.a })]);
      const state = f.db.prepare("SELECT value FROM host_session_state WHERE key LIKE 'root_deletion_generation:v1:%'").get() as { value: string };
      expect(JSON.parse(state.value).generation).toBe(intent.generation);
      expect(intent.scope_hash).toBe(preview.scope_hash);
      expect(f.db.prepare('SELECT consumed_at FROM pending_delete_requests WHERE token_hash = ?').get(tokenHash)).toMatchObject({ consumed_at: pending.consumed_at });
      expect(f.db.prepare("SELECT COUNT(*) AS n FROM permission_grants WHERE project_id = ? AND status = 'active'").get(f.pa)).toMatchObject({ n: 0 });
      expect(existsSync(join(f.a, '.qa'))).toBe(false);
      expect(snapshotB()).toEqual(beforeB);
      expect(await f.service.reconcilePendingDeletion()).toEqual([]);
    } finally { await restart.close(); }
  } finally { if (transport.pid) { try { process.kill(transport.pid); } catch {} } await first.close(); }
}, 60000);

it('fences a revoked G1 even after G2 is published before selection', async () => {
  const f = fixture();
  const handler = new ProjectHandler({ applicationService: f.service, projectRoots: [f.a], isRegisteredProjectRoot: f.registered });
  const original = f.service.getRootAuthorizationReference.bind(f.service);
  const spy = vi.spyOn(f.service, 'getRootAuthorizationReference').mockImplementation((root, registered, context) => {
    const ref = original(root, registered, context);
    spy.mockRestore();
    if (ref) { expect(f.service.revokeRootAuthorizationGrant(root, ref.generation, ref.grant_id)).toBe(true); f.helper(root); }
    return ref;
  });
  const active = f.service.getActiveProjectId();
  const response = await handler.execute({ action: 'select', project_id: f.pa });
  expect(response.isError).toBe(true);
  expect(f.service.getActiveProjectId()).toBe(active);
  expect((await handler.execute({ action: 'select', project_id: f.pa })).isError).toBe(false);
}, 30000);

it('does not replace a revoked project access grant during admission', async () => {
  const f = fixture();
  const handler = new ProjectHandler({ applicationService: f.service, projectRoots: [f.a], isRegisteredProjectRoot: f.registered });
  const original = f.service.authority.check.bind(f.service.authority);
  const spy = vi.spyOn(f.service.authority, 'check').mockImplementation((...args) => {
    const result = original(...args);
    spy.mockRestore();
    f.service.authority.revokeGrant(f.pa, f.accessA.grant_id);
    f.service.authority.grant({ project_id: f.pa, capability: 'access', scope: { root_path: f.a }, granted_by: 'host' });
    return result;
  });
  const active = f.service.getActiveProjectId();
  expect((await handler.execute({ action: 'select', project_id: f.pa })).isError).toBe(true);
  expect(f.service.getActiveProjectId()).toBe(active);
  expect((await handler.execute({ action: 'select', project_id: f.pa })).isError).toBe(false);
}, 30000);

it('isolates project IDs and revocation through the compiled stdio server', async () => {
  const f = fixture();
  const grantA = f.service.authority.grant({ project_id: f.pa, capability: 'observe', granted_by: 'host' });
  const grantB = f.service.authority.grant({ project_id: f.pb, capability: 'observe', granted_by: 'host' });
  const expired = f.service.authority.grant({ project_id: f.pa, capability: 'login', granted_by: 'host', expires_at: '2000-01-01T00:00:00.000Z' });
  const rows = () => Object.fromEntries(['projects', 'environments', 'campaigns', 'permission_grants'].map(table =>
    [table, f.db.prepare(`SELECT * FROM ${table} WHERE project_id = ? ORDER BY rowid`).all(f.pb)]));
  const beforeB = rows();
  const client = new Client({ name: 'r1-stdio', version: '1' }, {});
  const transport = new StdioClientTransport({ command: process.execPath, args: [resolve('dist/server.js')], stderr: 'pipe',
    env: { ...process.env as Record<string, string>, QAP_MCP_WORKSPACE_HOST_DIR: f.host, QAP_MCP_APP_SERVICE_DIR: f.app,
      QAP_MCP_WORKSPACE_ROOT: f.a, QAP_DISABLE_INTERACTIVE_AUTH: '1', NODE_ENV: 'test' } });
  await client.connect(transport); cleanup.push(() => client.close());
  const call = async (action: string, args: Record<string, unknown> = {}) => {
    const response = await client.callTool({ name: 'qap_project', arguments: { action, ...args } }, undefined, { timeout: 10000 });
    return JSON.parse((response.content as Array<{ text: string }>)[0].text);
  };
  expect((await call('select', { project_id: f.pa })).status).toBe('success');
  expect((await call('resume', { project_id: f.pa })).status).toBe('success');
  expect(f.db.prepare('SELECT status FROM permission_grants WHERE grant_id = ?').get(expired.grant_id)).toMatchObject({ status: 'active' });
  const denied = await call('select', { project_id: f.pb });
  expect(denied).toEqual(await call('select', { project_id: 'missing' }));
  expect((await call('resume', { project_id: f.pb })).code).toBe('project_not_found');
  for (const [action, extra] of [
    ['permissions', {}], ['candidates', {}], ['discrepancies', {}], ['discovery_dossier', {}],
    ['review_candidate', { candidate_id: 'missing', candidate_decision: 'approved' }],
    ['promote_candidates', { selected_candidates: ['missing'] }],
    ['resolve_discrepancy', { discrepancy_id: 'missing', discrepancy_choice: 'dismissed' }],
  ] as Array<[string, Record<string, unknown>]>) {
    expect((await call(action, { project_id: f.pb, targetPath: f.a, ...extra })).code).toBe('project_not_found');
  }
  const names = (await client.listTools()).tools.map(tool => tool.name);
  const exported = new Client({ name: 'exported-stdio', version: '1' }, {});
  const exportedTransport = new StdioClientTransport({ command: process.execPath,
    args: ['--input-type=module', '-e', "import { startMcpServer } from './dist/index.js'; await startMcpServer();"], stderr: 'pipe',
    env: { ...process.env as Record<string, string>, QAP_MCP_WORKSPACE_HOST_DIR: f.host, QAP_MCP_APP_SERVICE_DIR: f.app,
      QAP_MCP_WORKSPACE_ROOT: f.a, QAP_DISABLE_INTERACTIVE_AUTH: '1', NODE_ENV: 'test' } });
  await exported.connect(exportedTransport); cleanup.push(() => exported.close());
  expect((await exported.listTools()).tools.map(tool => tool.name).sort()).toEqual([...names].sort());
  for (const name of ['qap_server', 'qap_flow_run', 'qap_validate']) {
    const response = await exported.callTool({ name, arguments: { targetPath: f.a } });
    expect(JSON.parse((response.content as Array<{ text: string }>)[0].text).code).toBe('operation_disabled');
  }
  console.log('Stdio inventory:', names.join(', '));
  expect(names).not.toContain('qap_server');
  expect(names).not.toContain('qap_flow_run');
  expect(names).not.toContain('qap_validate');
  for (const name of ['qap_server', 'qap_flow_run', 'qap_validate']) {
    const response = await client.callTool({ name, arguments: { targetPath: f.a } });
    expect(JSON.parse((response.content as Array<{ text: string }>)[0].text).code).toBe('operation_disabled');
  }
  for (const [name, args] of [
    ['qap_auth_add', { targetPath: f.a, secret: 'injected' }],
    ['qap_validate', { targetPath: f.a, path: f.b }],
  ] as Array<[string, Record<string, unknown>]>) {
    const response = await client.callTool({ name, arguments: args });
    expect(response.isError).toBe(true);
  }
  const legacyAuth = await client.callTool({ name: 'qap_auth_add', arguments: {
    targetPath: f.a, profile: 'legacy', method: 'handoff',
  } });
  expect(JSON.parse((legacyAuth.content as Array<{ text: string }>)[0].text).code).toBe('auth_profile_outside_policy');
  expect(f.db.prepare('SELECT * FROM profiles WHERE project_id = ?').all(f.pa)).toEqual([]);
  expect((await call('permissions', { project_id: f.pa })).status).toBe('success');
  expect((await call('candidates', { project_id: f.pa })).status).toBe('success');
  expect((await call('discrepancies', { project_id: f.pa })).status).toBe('success');
  expect((await call('discovery_dossier', { project_id: f.pa })).status).toBe('success');
  expect((await call('discovery_dossier_regenerate', { project_id: f.pa })).code).toBe('operation_disabled');

  expect((await call('resume', { project_id: f.pb, targetPath: f.a })).code).toBe('project_not_found');
  expect((await call('resume', { project_id: 'missing', targetPath: f.a })).code).toBe('project_not_found');
  expect(f.service.getActiveProjectId()).toBe(f.pa);
  expect((await call('revoke_permission', { project_id: f.pb, grant_id: grantB.grant_id })).code).toBe('project_not_found');
  expect((await call('revoke_permission', { project_id: f.pa, grant_id: grantB.grant_id })).code).toBe('grant_not_found');
  const listing = await call('list', { include_deleted: true });
  expect(listing.projects.map((p: { project_id: string }) => p.project_id)).toEqual([f.pa]);
  expect(JSON.stringify(listing)).not.toContain(f.pb);
  const scoped = new Client({ name: 'r1-roots', version: '1' }, { capabilities: { roots: { listChanged: false } } });
  scoped.setRequestHandler(ListRootsRequestSchema, async () => ({ roots: [{ uri: pathToFileURL(f.a).href }] }));
  const scopedTransport = new StdioClientTransport({ command: process.execPath, args: [resolve('dist/server.js')], stderr: 'pipe',
    env: { ...process.env as Record<string, string>, QAP_MCP_WORKSPACE_HOST_DIR: f.host, QAP_MCP_APP_SERVICE_DIR: f.app,
      QAP_DISABLE_INTERACTIVE_AUTH: '1', NODE_ENV: 'test' } });
  await scoped.connect(scopedTransport); cleanup.push(() => scoped.close());
  const scopedResponse = await scoped.callTool({ name: 'qap_project', arguments: { action: 'list' } }, undefined, { timeout: 10000 });
  const scopedList = JSON.parse((scopedResponse.content as Array<{ text: string }>)[0].text);
  expect(scopedList.projects.map((p: { project_id: string }) => p.project_id)).toEqual([f.pa]);
  expect((await call('revoke_permission', { project_id: f.pa, grant_id: grantA.grant_id })).revoked_grant.status).toBe('revoked');
  expect(rows()).toEqual(beforeB);
  expect((await call('revoke_permission', { project_id: f.pa, grant_id: f.accessA.grant_id })).revoked_grant.status).toBe('revoked');
  expect((await call('resume', { project_id: f.pa })).code).toBe('project_not_found');
  f.service.authority.grant({ project_id: f.pa, capability: 'access', scope: { root_path: f.a }, granted_by: 'host' });
  expect((await call('resume', { project_id: f.pa })).status).toBe('success');
  const ref = f.service.getRootAuthorizationReference(f.a, f.registered)!;
  expect(f.service.revokeRootAuthorizationGrant(f.a, ref.generation, ref.grant_id)).toBe(true);
  expect((await call('resume', { project_id: f.pa })).code).toBe('project_not_found');
  expect(rows()).toEqual(beforeB);
}, 45000);

it('authorizes import destination and persisted source through compiled stdio', async () => {
  const f = fixture();
  for (const root of [f.a, f.b]) {
    mkdirSync(join(root, '.qa', 'project'), { recursive: true });
    writeFileSync(join(root, '.qa', 'project', 'context.yaml'), `project_name: ${root === f.a ? 'A' : 'B'}\n`);
  }
  const manifestB = f.service.importLegacyQa(f.pb);
  const snapshot = () => ({
    tables: Object.fromEntries(['projects', 'environments', 'campaigns', 'permission_grants', 'import_manifests'].map(table =>
      [table, f.db.prepare(`SELECT * FROM ${table} WHERE project_id = ? ORDER BY rowid`).all(f.pb)])),
    entries: f.db.prepare('SELECT * FROM import_entries WHERE import_id = ? ORDER BY rowid').all(manifestB.import_id),
    file: readFileSync(join(f.b, '.qa', 'project', 'context.yaml'), 'utf8'),
  });
  const before = snapshot();
  const client = new Client({ name: 'r2-stdio', version: '1' }, {});
  const transport = new StdioClientTransport({ command: process.execPath, args: [resolve('dist/server.js')], stderr: 'pipe',
    env: { ...process.env as Record<string, string>, QAP_MCP_WORKSPACE_HOST_DIR: f.host, QAP_MCP_APP_SERVICE_DIR: f.app,
      QAP_MCP_WORKSPACE_ROOT: f.a, QAP_DISABLE_INTERACTIVE_AUTH: '1', NODE_ENV: 'test' } });
  await client.connect(transport); cleanup.push(() => client.close());
  const call = async (action: string, args: Record<string, unknown>) => {
    const response = await client.callTool({ name: 'qap_project', arguments: { action, ...args } }, undefined, { timeout: 10000 });
    return JSON.parse((response.content as Array<{ text: string }>)[0].text);
  };
  const allApplicationRows = () => Object.fromEntries(
    (f.db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as Array<{ name: string }>)
      .map(({ name }) => [name, f.db.prepare(`SELECT * FROM "${name.replaceAll('"', '""')}"`).all()]));
  const beforeRejections = allApplicationRows();
  const deniedB = await call('import_qa', { project_id: f.pb });
  expect(deniedB).toEqual(await call('import_qa', { project_id: 'missing' }));
  expect(snapshot()).toEqual(before);
  expect((await call('import_qa', { project_id: f.pa, source_root: f.b })).code).toBe('project_not_found');
  expect(snapshot()).toEqual(before);
  expect((await call('import_qa', { project_id: f.pa, source_root: f.dir })).code).toBe('project_not_found');
  expect(snapshot()).toEqual(before);
  expect((await call('import_qa', { project_id: f.pb, targetPath: f.a })).code).toBe('project_not_found');
  expect(snapshot()).toEqual(before);
  expect(await call('verify_import', { import_id: manifestB.import_id })).toEqual(await call('verify_import', { import_id: 'missing' }));
  expect(snapshot()).toEqual(before);
  expect(allApplicationRows()).toEqual(beforeRejections);
  const imported = await call('import_qa', { project_id: f.pa });
  expect(imported.receipt.status).toBe('imported');
  expect((await call('import_qa', { project_id: f.pa })).receipt.status).toBe('already_imported');
  expect((await call('verify_import', { import_id: imported.receipt.import_id })).verification.valid).toBe(true);
  const afterImport = allApplicationRows();
  expect((await call('verify_import', { import_id: imported.receipt.import_id, source_root: f.b })).code).toBe('project_not_found');
  expect((await call('verify_import', { import_id: imported.receipt.import_id, project_id: f.pb })).code).toBe('project_not_found');
  expect(snapshot()).toEqual(before);
  expect(allApplicationRows()).toEqual(afterImport);
}, 45000);

it('rejects an import when its captured G1 is revoked and G2 issued before admission', async () => {
  const f = fixture();
  mkdirSync(join(f.a, '.qa'), { recursive: true });
  writeFileSync(join(f.a, '.qa', 'context.yaml'), 'project_name: A\n');
  const handler = new ProjectHandler({ applicationService: f.service, projectRoots: [f.a], isRegisteredProjectRoot: f.registered });
  const original = f.service.getRootAuthorizationReference.bind(f.service);
  const spy = vi.spyOn(f.service, 'getRootAuthorizationReference').mockImplementation((root, registered, context) => {
    const reference = original(root, registered, context);
    spy.mockRestore();
    if (reference) { expect(f.service.revokeRootAuthorizationGrant(root, reference.generation, reference.grant_id)).toBe(true); f.helper(root); }
    return reference;
  });
  expect((await handler.execute({ action: 'import_qa', project_id: f.pa })).isError).toBe(true);
  expect(f.db.prepare('SELECT * FROM import_manifests').all()).toEqual([]);
  expect((await handler.execute({ action: 'import_qa', project_id: f.pa })).isError).toBe(false);
}, 30000);

it('requires independent authority for an authorized cross-project source', async () => {
  const f = fixture();
  mkdirSync(join(f.b, '.qa'), { recursive: true });
  writeFileSync(join(f.b, '.qa', 'context.yaml'), 'project_name: source\n');
  const handler = new ProjectHandler({ applicationService: f.service, projectRoots: [f.a, f.b], isRegisteredProjectRoot: f.registered });
  const call = (action: string, args: Record<string, unknown>) => handler.execute({ action, ...args });
  const imported = await call('import_qa', { project_id: f.pa, source_root: f.b });
  expect(imported.isError).toBe(false);
  const receipt = JSON.parse((imported.content[0] as { text: string }).text).receipt;
  expect((await call('verify_import', { import_id: receipt.import_id })).isError).toBe(false);
  const ref = f.service.getRootAuthorizationReference(f.b, f.registered)!;
  expect(f.service.revokeRootAuthorizationGrant(f.b, ref.generation, ref.grant_id)).toBe(true);
  const before = f.db.prepare('SELECT * FROM import_manifests ORDER BY rowid').all();
  expect((await call('import_qa', { project_id: f.pa, source_root: f.b })).isError).toBe(true);
  expect((await call('verify_import', { import_id: receipt.import_id })).isError).toBe(true);
  expect(f.db.prepare('SELECT * FROM import_manifests ORDER BY rowid').all()).toEqual(before);
}, 30000);

it('fences verification when the captured access grant is replaced', async () => {
  const f = fixture();
  mkdirSync(join(f.a, '.qa'), { recursive: true });
  writeFileSync(join(f.a, '.qa', 'context.yaml'), 'project_name: A\n');
  const manifest = f.service.importLegacyQa(f.pa);
  const handler = new ProjectHandler({ applicationService: f.service, projectRoots: [f.a], isRegisteredProjectRoot: f.registered });
  const original = f.service.authority.check.bind(f.service.authority);
  const spy = vi.spyOn(f.service.authority, 'check').mockImplementation((...args) => {
    const checked = original(...args);
    spy.mockRestore();
    f.service.authority.revokeGrant(f.pa, f.accessA.grant_id);
    f.service.authority.grant({ project_id: f.pa, capability: 'access', scope: { root_path: f.a }, granted_by: 'host' });
    return checked;
  });
  expect((await handler.execute({ action: 'verify_import', import_id: manifest.import_id })).isError).toBe(true);
  expect((await handler.execute({ action: 'verify_import', import_id: manifest.import_id })).isError).toBe(false);
}, 30000);

it('preserves connected Knowledge, application tables and files for rejected compiled imports', async () => {
  const f = fixture();
  const bootstrap = new WorkspaceBootstrap(f.host, f.service);
  cleanup.push(() => bootstrap.close());
  for (const [root, label] of [[f.a, 'a'], [f.b, 'b']] as const) {
    const binding = await bootstrap.prepare(root, `https://${label}.example.invalid`);
    expect(binding).toBeDefined();
    const record = await binding!.store.get(binding!.applicationId, 'application', binding!.applicationId);
    const environment = await binding!.store.get(binding!.applicationId, 'environment', binding!.environmentId);
    expect(record?.revision).toBe(1);
    expect(environment?.revision).toBe(1);
    expect(record?.entity.name).toBe(label);
    writeFileSync(join(root, 'protected.txt'), `protected-${label}`);
  }
  bootstrap.close();
  const foreignManifest = f.service.importLegacyQa(f.pb);
  const external = join(f.dir, 'external');
  mkdirSync(join(external, '.qa'), { recursive: true });
  writeFileSync(join(external, '.qa', 'context.yaml'), 'project_name: external\n');
  const unregisteredExternal = join(f.dir, 'unregistered-external');
  mkdirSync(join(unregisteredExternal, '.qa'), { recursive: true });
  writeFileSync(join(unregisteredExternal, '.qa', 'context.yaml'), 'project_name: unregistered\n');
  const nestedB = join(f.b, 'nested-source');
  mkdirSync(join(nestedB, '.qa'), { recursive: true });
  writeFileSync(join(nestedB, '.qa', 'context.yaml'), 'project_name: nested-b\n');
  f.helper(external);
  expect(f.service.findActiveProjectByRoot(external)).toBeNull();

  const openClient = async (root: string, roots?: string[]) => {
    const client = new Client({ name: 'r2-knowledge-stdio', version: '1' }, roots ? { capabilities: { roots: { listChanged: false } } } : {});
    if (roots) client.setRequestHandler(ListRootsRequestSchema, async () => ({ roots: roots.map(path => ({ uri: pathToFileURL(path).href })) }));
    const transport = new StdioClientTransport({ command: process.execPath, args: [resolve('dist/server.js')], stderr: 'pipe',
      env: { ...process.env as Record<string, string>, QAP_MCP_WORKSPACE_HOST_DIR: f.host, QAP_MCP_APP_SERVICE_DIR: f.app,
        QAP_MCP_WORKSPACE_ROOT: root, QAP_DISABLE_INTERACTIVE_AUTH: '1', NODE_ENV: 'test' } });
    await client.connect(transport); cleanup.push(() => client.close());
    const invoke = async (name: string, args: Record<string, unknown>) => {
      const response = await client.callTool({ name, arguments: args }, undefined, { timeout: 10000 });
      return JSON.parse((response.content as Array<{ text: string }>)[0].text);
    };
    const status = await invoke('qap_status', { targetPath: root });
    expect(status.knowledge.state).toBe('available');
    expect(status.knowledge.application_revision).toBe(1);
    return invoke;
  };
  const callA = await openClient(f.a);
  await openClient(f.b);
  const callExternal = await openClient(f.a, [f.a, external]);
  const rows = (path: string) => {
    const db = new DatabaseSync(path, { readOnly: true });
    try {
      return Object.fromEntries((db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as Array<{ name: string }>)
        .map(({ name }) => [name, db.prepare(`SELECT * FROM "${name.replaceAll('"', '""')}"`).all().map(row => JSON.stringify(row)).sort()]));
    } finally { db.close(); }
  };
  const files = (root: string, relative = ''): Array<[string, string]> => readdirSync(join(root, relative), { withFileTypes: true })
    .flatMap(entry => {
      const path = join(relative, entry.name);
      return entry.isDirectory() ? files(root, path) : [[path, createHash('sha256').update(readFileSync(join(root, path))).digest('hex')] as [string, string]];
    }).sort(([a], [b]) => a.localeCompare(b));
  const snapshot = () => ({ application: rows(join(f.app, 'app-service.sqlite')),
    a: { knowledge: rows(join(f.host, workspaceStorageKey(f.a), 'knowledge.sqlite')), files: files(f.a) },
    b: { knowledge: rows(join(f.host, workspaceStorageKey(f.b), 'knowledge.sqlite')), files: files(f.b) } });
  const baseline = snapshot();
  const counts = (tables: Record<string, string[]>) => Object.fromEntries(Object.entries(tables).map(([name, values]) => [name, values.length]));
  console.info('R2-VAL baseline', JSON.stringify({ application: counts(baseline.application),
    knowledgeA: counts(baseline.a.knowledge), knowledgeB: counts(baseline.b.knowledge),
    filesA: baseline.a.files.length, filesB: baseline.b.files.length, applicationRevision: 1, environmentRevision: 1 }));
  const project = (action: string, args: Record<string, unknown>) => callA('qap_project', { action, ...args });
  const rejected = async (action: string, args: Record<string, unknown>) => {
    const response = await project(action, args);
    expect(response.code).toBe('project_not_found');
    expect(snapshot()).toEqual(baseline);
    return response;
  };
  expect(await rejected('import_qa', { project_id: f.pb })).toEqual(await rejected('import_qa', { project_id: 'missing' }));
  await rejected('import_qa', { project_id: f.pa, source_root: f.b });
  await rejected('import_qa', { project_id: f.pa, source_root: nestedB });
  await rejected('import_qa', { project_id: f.pa, source_root: join(external, '..', 'b') });
  await rejected('import_qa', { project_id: f.pa, source_root: unregisteredExternal });
  await rejected('import_qa', { project_id: f.pb, targetPath: f.a });
  expect(await rejected('verify_import', { import_id: foreignManifest.import_id })).toEqual(await rejected('verify_import', { import_id: 'missing' }));
  expect((await callExternal('qap_project', { action: 'import_qa', project_id: f.pa, source_root: external })).code).toBe('project_not_found');
  expect(snapshot()).toEqual(baseline);
  const imported = await project('import_qa', { project_id: f.pa });
  expect(imported.receipt.status).toBe('imported');
  expect((await project('verify_import', { import_id: imported.receipt.import_id })).verification.valid).toBe(true);
  expect(snapshot().a).toEqual(baseline.a);
  expect(snapshot().b).toEqual(baseline.b);
  expect(f.service.authority.revokeGrant(f.pa, f.accessA.grant_id)).toBeDefined();
  const revoked = snapshot();
  expect((await project('import_qa', { project_id: f.pa })).code).toBe('project_not_found');
  expect(snapshot()).toEqual(revoked);
  expect((await project('verify_import', { import_id: imported.receipt.import_id })).code).toBe('project_not_found');
  expect(snapshot()).toEqual(revoked);
  f.service.authority.grant({ project_id: f.pa, capability: 'access', scope: { root_path: f.a }, granted_by: 'host' });
  const admin = (...args: string[]) => execFileSync(process.execPath, [resolve('../../scripts/qap-authorize-workspace.mjs'), ...args], {
    env: { ...process.env, QAP_MCP_APP_SERVICE_DIR: f.app, QAP_MCP_WORKSPACE_HOST_DIR: f.host }, timeout: 12000, windowsHide: true,
  }).toString();
  const sourceBefore = files(external);
  const grant = JSON.parse(admin('import-read-grant', external));
  admin('import-read-grant', f.b);
  const beforeForeignAttempt = snapshot();
  expect((await project('import_qa', { project_id: f.pa, source_root: f.b })).code).toBe('project_not_found');
  expect(snapshot()).toEqual(beforeForeignAttempt);
  const externalImport = await project('import_qa', { project_id: f.pa, source_root: external });
  expect(externalImport.receipt.status).toBe('imported');
  expect((await project('verify_import', { import_id: externalImport.receipt.import_id })).verification.valid).toBe(true);
  expect(files(external)).toEqual(sourceBefore);
  expect(snapshot().a).toEqual(baseline.a);
  expect(snapshot().b).toEqual(baseline.b);
  admin('import-read-revoke', external, grant.grant_id);
  const afterRevoke = snapshot();
  expect((await project('verify_import', { import_id: externalImport.receipt.import_id })).code).toBe('project_not_found');
  expect((await project('import_qa', { project_id: f.pa, source_root: external })).code).toBe('project_not_found');
  expect(snapshot()).toEqual(afterRevoke);
  const replacement = JSON.parse(admin('import-read-grant', external));
  const afterReplacement = snapshot();
  expect((await project('verify_import', { import_id: externalImport.receipt.import_id })).code).toBe('project_not_found');
  expect((await project('import_qa', { project_id: f.pa, source_root: external })).code).toBe('project_not_found');
  expect(snapshot()).toEqual(afterReplacement);
  const grantRow = f.db.prepare('SELECT key,value FROM host_session_state WHERE key LIKE ?').all(`%${replacement.grant_id}`) as Array<{ key: string; value: string }>;
  expect(grantRow).toHaveLength(1);
  f.db.prepare('UPDATE host_session_state SET value = ? WHERE key = ?').run('{"purpose":"import_read"}', grantRow[0].key);
  const afterCorruption = snapshot();
  expect((await project('import_qa', { project_id: f.pa, source_root: external })).code).toBe('project_not_found');
  expect(snapshot()).toEqual(afterCorruption);
  expect(files(external)).toEqual(sourceBefore);
  const beforeUnsupportedAction = snapshot();
  expect((await project('import_read_grant', { source_root: unregisteredExternal })).status).not.toBe('success');
  const afterUnsupportedAction = snapshot();
  expect(afterUnsupportedAction.application).toEqual(beforeUnsupportedAction.application);
  expect(afterUnsupportedAction.a.knowledge).toEqual(beforeUnsupportedAction.a.knowledge);
  expect(afterUnsupportedAction.b).toEqual(beforeUnsupportedAction.b);
}, 60000);

it('fences an external grant replaced between capture and protected read', async () => {
  const f = fixture();
  const external = join(f.dir, 'external');
  mkdirSync(join(external, '.qa'), { recursive: true });
  writeFileSync(join(external, '.qa', 'context.yaml'), 'project_name: external\n');
  const grant = f.service.issueImportReadGrant(external);
  const handler = new ProjectHandler({ applicationService: f.service, projectRoots: [f.a], isRegisteredProjectRoot: f.registered });
  const original = f.service.getImportReadReference.bind(f.service);
  const spy = vi.spyOn(f.service, 'getImportReadReference').mockImplementation((root, grantId) => {
    const ref = original(root, grantId);
    if (!grantId && ref) {
      spy.mockRestore();
      expect(f.service.revokeImportReadGrant(external, grant.grant_id)).toBe(true);
      f.service.issueImportReadGrant(external);
    }
    return ref;
  });
  expect((await handler.execute({ action: 'import_qa', project_id: f.pa, source_root: external })).isError).toBe(true);
  expect(f.db.prepare('SELECT * FROM import_manifests').all()).toEqual([]);
}, 30000);
