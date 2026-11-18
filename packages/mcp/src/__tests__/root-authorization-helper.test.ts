import { randomUUID } from 'node:crypto';
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, expect, it, vi } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { QapApplicationService } from '../application/application-service.js';
import { createMcpServer } from '../server.js';

vi.setConfig({ testTimeout: 20000 });

const dirs: string[] = [];
const services: QapApplicationService[] = [];
const dbs: DatabaseSync[] = [];
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'qap-helper-')); dirs.push(dir);
  const host = join(dir, 'application'), workspaceHost = join(dir, 'host'), a = join(dir, 'a'), b = join(dir, 'b');
  mkdirSync(a); mkdirSync(b); mkdirSync(workspaceHost);
  const service = new QapApplicationService({ hostRootDir: host }); services.push(service);
  const db = new DatabaseSync(join(host, 'app-service.sqlite')); dbs.push(db);
  const projectA = service.createProject({ name: 'A', canonicalRoot: a }).project;
  const projectB = service.createProject({ name: 'B', canonicalRoot: b }).project;
  const registry = join(workspaceHost, 'authorized-roots.json');
  writeFileSync(registry, JSON.stringify([b]));
  const env = { ...process.env, QAP_MCP_APP_SERVICE_DIR: host, QAP_MCP_WORKSPACE_HOST_DIR: workspaceHost };
  return { dir, host, workspaceHost, registry, a, b, service, db, projectA, projectB, env };
}
async function remove(service: QapApplicationService, id: string) {
  const preview = service.previewDelete(id); await service.confirmDelete(id, preview.confirmation_token, 'confirm_delete');
}
function state(service: QapApplicationService, root: string) {
  const value = service.getRootDeletionState(root);
  if (!value || value.version !== 1) throw new Error('expected deletion generation');
  return value;
}
const sourceHelper = resolve('../../scripts/qap-authorize-workspace.mjs');
const bundledHelper = resolve('dist/assets/scripts/qap-authorize-workspace.mjs');
const nodeExecutable = process.execPath;
const delay = (ms: number) => new Promise(resolvePromise => setTimeout(resolvePromise, ms));
function runHelper(path: string, root: string, env: NodeJS.ProcessEnv) {
  return execFileSync(nodeExecutable, [path, root], { env, encoding: 'utf8', stdio: 'pipe', windowsHide: true, timeout: 15000 });
}
const roots = (path: string): string[] => existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : [];

it('checks persistent authority in two compiled Stdio servers', async () => {
  const f = fixture();
  const clients = [0, 1].map(() => new Client({ name: 'persistent-authority-test', version: '1' }, {}));
  try {
    for (const client of clients) await client.connect(new StdioClientTransport({
      command: nodeExecutable, args: [resolve('dist/server.js')],
      env: { ...f.env, QAP_DISABLE_INTERACTIVE_AUTH: '1', NODE_ENV: 'test' } as Record<string, string>,
      stderr: 'pipe',
    }));
    const status = async (index: number, root: string) => {
      const response = await clients[index].callTool({ name: 'qap_status', arguments: { targetPath: root } });
      return JSON.parse((response.content as Array<{ text: string }>)[0].text) as { code?: string };
    };
    expect((await status(0, f.b)).code).not.toBe('workspace_persistent_authority_required');
    await remove(f.service, f.projectA.project_id);
    const generation = state(f.service, f.a).generation;
    f.service.recoverDeletedProject(f.projectA.project_id);
    writeFileSync(f.registry, JSON.stringify([f.b, f.a]));
    expect((await status(0, f.a)).code).toBe('workspace_persistent_authority_required');
    f.service.completeRootDeletionCleanup(f.a, generation);
    expect((await status(1, f.a)).code).toBe('workspace_persistent_authority_required');
    runHelper(sourceHelper, f.a, f.env);
    const grant = state(f.service, f.a).authorization_grants!.at(-1)!;
    writeFileSync(f.registry, JSON.stringify([f.b]));
    expect((await status(0, f.a)).code).toBe('workspace_persistent_authority_required');
    writeFileSync(f.registry, JSON.stringify([f.b, f.a]));
    expect((await status(1, f.a)).code).not.toBe('workspace_persistent_authority_required');
    f.service.revokeRootAuthorizationGrant(f.a, generation, grant.grant_id);
    expect((await status(0, f.a)).code).toBe('workspace_persistent_authority_required');
    expect(roots(f.registry)).toContain(f.b);
    expect((await status(1, f.b)).code).not.toBe('workspace_persistent_authority_required');
  } finally { await Promise.all(clients.map(client => client.close())); }
}, 30000);
afterEach(() => {
  for (const db of dbs.splice(0)) db.close();
  for (const service of services.splice(0)) service.close();
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

it.each([['source', sourceHelper], ['distributed', bundledHelper]])('%s helper authorizes legacy roots and publishes a completed generation', async (_label, helper) => {
  const f = fixture();
  runHelper(helper, f.a, f.env);
  expect(roots(f.registry)).toEqual([f.b, f.a]);
  expect(f.service.getRootDeletionState(f.a)).toBeNull();
  writeFileSync(f.registry, JSON.stringify([f.b]));
  await remove(f.service, f.projectA.project_id);
  expect(() => runHelper(helper, f.a, f.env)).toThrow();
  expect(roots(f.registry)).toEqual([f.b]);
  const gen = state(f.service, f.a).generation;
  f.service.completeRootDeletionCleanup(f.a, gen);
  runHelper(helper, f.a, f.env);
  const newGrant = state(f.service, f.a).authorization_grants?.at(-1);
  expect(newGrant).toMatchObject({ generation: gen, status: 'active', mechanism: 'local_operator_helper', registry_published: true });
  const other = new QapApplicationService({ hostRootDir: f.host }); services.push(other);
  expect(other.getRootAuthorizationGrant(f.a, newGrant!.grant_id)).toMatchObject({ grant: newGrant });
  expect(roots(f.registry)).toEqual([f.b, f.a]);
  expect(f.service.getRootDeletionState(f.b)).toBeNull();
});

it('preserves revocation, invalidates old generations, and isolates B grants', async () => {
  const f = fixture();
  await remove(f.service, f.projectB.project_id);
  const bGen = state(f.service, f.b).generation;
  f.service.completeRootDeletionCleanup(f.b, bGen);
  runHelper(sourceHelper, f.b, f.env);
  const bBefore = state(f.service, f.b);
  await remove(f.service, f.projectA.project_id);
  const gen = state(f.service, f.a).generation;
  f.service.completeRootDeletionCleanup(f.a, gen);
  runHelper(sourceHelper, f.a, f.env);
  const first = state(f.service, f.a).authorization_grants!.at(-1)!;
  f.service.revokeRootAuthorizationGrant(f.a, gen, first.grant_id);
  expect(f.service.recordRootAuthorizationGrant({ canonicalRoot: f.a, generation: gen, grantId: first.grant_id, mechanism: 'local_operator_helper', registryPublished: true }).status).toBe('revoked');
  runHelper(sourceHelper, f.a, f.env);
  const next = state(f.service, f.a).authorization_grants!.at(-1)!;
  expect(next.grant_id).not.toBe(first.grant_id);
  f.service.recoverDeletedProject(f.projectA.project_id);
  await remove(f.service, f.projectA.project_id);
  const secondGen = state(f.service, f.a).generation;
  expect(secondGen).not.toBe(gen);
  expect(state(f.service, f.a).authorization_grants!.every(g => g.status === 'revoked')).toBe(true);
  expect(() => runHelper(sourceHelper, f.a, f.env)).toThrow();
  expect(() => f.service.recordRootAuthorizationGrant({ canonicalRoot: f.a, generation: gen, grantId: randomUUID(), mechanism: 'local_operator_helper', registryPublished: true })).toThrow();
  expect(state(f.service, f.b)).toEqual(bBefore);
}, 20000);

it('rejects historical and corrupt states before modifying the registry', async () => {
  const f = fixture(); await remove(f.service, f.projectA.project_id);
  const current = state(f.service, f.a);
  const key = `root_deletion_generation:v1:${current.root_hash}`;
  f.db.prepare('DELETE FROM host_session_state WHERE key = ?').run(key);
  expect(() => runHelper(sourceHelper, f.a, f.env)).toThrow();
  expect(roots(f.registry)).toEqual([f.b]);
  f.db.prepare('INSERT INTO host_session_state VALUES (?, ?, ?)').run(key, '{}', new Date().toISOString());
  expect(() => runHelper(sourceHelper, f.a, f.env)).toThrow();
  expect(roots(f.registry)).toEqual([f.b]);
});

it('does not mistake an earlier R4-C1 grant for a helper publication after an interrupted JSON write', async () => {
  const f = fixture(); await remove(f.service, f.projectA.project_id);
  const gen = state(f.service, f.a).generation; f.service.completeRootDeletionCleanup(f.a, gen);
  f.service.recordRootAuthorizationGrant({ canonicalRoot: f.a, generation: gen, grantId: randomUUID(), mechanism: 'local_operator_helper' });
  const preload = join(f.dir, 'fault.cjs'); writeFileSync(preload, faultScript);
  try {
    runHelper(sourceHelper, f.a, { ...f.env, NODE_OPTIONS: `--require="${preload.replaceAll('\\', '/')}"`, QAP_TEST_FAULT: 'after_json' });
    throw new Error('fault did not interrupt helper');
  } catch (error) { expect((error as { status?: number }).status).toBe(86); }
  expect(roots(f.registry)).toContain(f.a);
  expect(state(f.service, f.a).authorization_grants).toHaveLength(1);
  expect(state(f.service, f.a).authorization_grants!.some(g => g.status === 'active' && g.registry_published === true)).toBe(false);
}, 20000);

const faultScript = `
const fs = require('node:fs'); const sqlite = require('node:sqlite');
const { syncBuiltinESMExports } = require('node:module'); const mode = process.env.QAP_TEST_FAULT;
const oldRename = fs.renameSync; fs.renameSync = function(a,b) {
  if (String(b).endsWith('authorized-roots.json')) {
    if (mode === 'throw_json') throw Error('injected JSON failure');
    if (mode === 'before_json') process.exit(86);
    const result = oldRename.apply(this, arguments);
    if (mode === 'after_json') process.exit(86);
    return result;
  } return oldRename.apply(this, arguments);
}; syncBuiltinESMExports();
const tracked = new WeakSet(); let dirty = false;
const oldPrepare = sqlite.DatabaseSync.prototype.prepare;
sqlite.DatabaseSync.prototype.prepare = function(sql) { const s = oldPrepare.call(this, sql); if (String(sql).startsWith('UPDATE host_session_state SET value = ?')) tracked.add(s); return s; };
const oldRun = sqlite.StatementSync.prototype.run;
sqlite.StatementSync.prototype.run = function(...args) {
  if (tracked.has(this)) {
    if (mode === 'throw_sql') throw Error('injected SQLite failure');
    if (mode === 'before_sql') process.exit(86);
    const result = oldRun.apply(this, args); dirty = true;
    if (mode === 'after_sql_write') process.exit(86);
    return result;
  } return oldRun.apply(this, args);
};
const oldExec = sqlite.DatabaseSync.prototype.exec;
sqlite.DatabaseSync.prototype.exec = function(sql) { const result = oldExec.call(this, sql); if (dirty && sql === 'COMMIT' && mode === 'after_sql_commit') process.exit(86); return result; };
`;

it.each([
  ['throw_json', false, false], ['before_json', false, false], ['after_json', true, false],
  ['throw_sql', false, false], ['before_sql', true, false], ['after_sql_write', true, false], ['after_sql_commit', true, true],
])('controls interruption at %s (JSON %s, published grant %s)', async (fault, hasRoot, hasGrant) => {
  const f = fixture(); await remove(f.service, f.projectA.project_id);
  const gen = state(f.service, f.a).generation; f.service.completeRootDeletionCleanup(f.a, gen);
  const preload = join(f.dir, 'fault.cjs'); writeFileSync(preload, faultScript);
  try {
    runHelper(sourceHelper, f.a, { ...f.env, NODE_OPTIONS: `--require="${preload.replaceAll('\\', '/')}"`, QAP_TEST_FAULT: fault });
    throw new Error('fault did not interrupt helper');
  } catch (error) {
    const failure = error as { status?: number; stderr?: Buffer | string };
    if (fault.startsWith('throw_')) expect(String(failure.stderr)).toContain(fault === 'throw_json' ? 'injected JSON failure' : 'injected SQLite failure');
    else expect(failure.status, String(failure.stderr)).toBe(86);
  }
  expect(roots(f.registry).includes(f.a)).toBe(hasRoot);
  expect(roots(f.registry).includes(f.b)).toBe(true);
  expect((state(f.service, f.a).authorization_grants ?? []).some(g => g.generation === gen && g.status === 'active' && g.registry_published === true)).toBe(hasGrant);
  if (!hasGrant) {
    runHelper(sourceHelper, f.a, f.env);
    expect(roots(f.registry)).toContain(f.a);
    expect(state(f.service, f.a).authorization_grants?.at(-1)).toMatchObject({ status: 'active', generation: gen, registry_published: true });
  }
}, 20000);

it('serializes competing helper processes and rejects both against a newer pending generation', async () => {
  const f = fixture(); await remove(f.service, f.projectA.project_id);
  const gen = state(f.service, f.a).generation; f.service.completeRootDeletionCleanup(f.a, gen);
  const run = () => new Promise<number | null>((resolvePromise, reject) => {
    const child = spawn(process.execPath, [sourceHelper, f.a], { env: f.env, windowsHide: true, stdio: 'ignore', timeout: 15000 });
    child.on('error', reject); child.on('exit', resolvePromise);
  });
  expect((await Promise.all([run(), run()])).some(code => code === 0)).toBe(true);
  expect(state(f.service, f.a).authorization_grants?.some(g => g.status === 'active' && g.registry_published)).toBe(true);
  f.service.recoverDeletedProject(f.projectA.project_id); await remove(f.service, f.projectA.project_id);
  const newState = state(f.service, f.a);
  expect(newState.generation).not.toBe(gen);
  expect((await Promise.all([run(), run()])).every(code => code !== 0)).toBe(true);
  expect(state(f.service, f.a)).toEqual(newState);
});

it('rejects helper publication after deletion has started and preserves the neighboring registry entry', async () => {
  const f = fixture();
  let finish!: () => void;
  const draining = new Promise<void>(resolvePromise => { finish = resolvePromise; });
  const controller = { abort: vi.fn() } as unknown as Parameters<QapApplicationService['registerActiveWork']>[2];
  f.service.registerActiveWork(f.projectA.project_id, 'held', controller, draining);
  const preview = f.service.previewDelete(f.projectA.project_id);
  const competingPreview = f.service.previewDelete(f.projectA.project_id);
  const other = new QapApplicationService({ hostRootDir: f.host }); services.push(other);
  const deletion = f.service.confirmDelete(f.projectA.project_id, preview.confirmation_token, 'confirm_delete');
  try {
    await expect(other.confirmDelete(f.projectA.project_id, competingPreview.confirmation_token, 'confirm_delete')).rejects.toThrow();
    expect(() => runHelper(sourceHelper, f.a, f.env)).toThrow(/root_authorization_deletion_in_progress|borrado de la raíz/i);
    expect(roots(f.registry)).toEqual([f.b]);
  } finally { finish(); await deletion; }
  expect(state(f.service, f.a).cleanup_status).toBe('pending');
  expect(f.service.findActiveProjectByRoot(f.b)?.project_id).toBe(f.projectB.project_id);
});

it('serializes deletion cleanup of A with publication of neighboring B', async () => {
  const f = fixture(); writeFileSync(f.registry, JSON.stringify([f.a]));
  const deleting = new QapApplicationService({ hostRootDir: f.host, onProjectDeleted: (_id, root) => {
    writeFileSync(f.registry, JSON.stringify(roots(f.registry).filter(item => item !== root)));
  } }); services.push(deleting);
  let finish!: () => void;
  const draining = new Promise<void>(resolvePromise => { finish = resolvePromise; });
  deleting.registerActiveWork(f.projectA.project_id, 'held',
    { abort: vi.fn() } as unknown as Parameters<QapApplicationService['registerActiveWork']>[2], draining);
  const preview = deleting.previewDelete(f.projectA.project_id);
  const deletion = deleting.confirmDelete(f.projectA.project_id, preview.confirmation_token, 'confirm_delete');
  const ready = join(f.dir, 'neighbor-ready'), resume = join(f.dir, 'neighbor-resume'), preload = join(f.dir, 'neighbor-pause.cjs');
  writeFileSync(preload, `const fs = require('node:fs'); const {syncBuiltinESMExports} = require('node:module'); const rename = fs.renameSync; fs.renameSync = function(a,b) { const result = rename.apply(this, arguments); if (String(b).endsWith('authorized-roots.json')) { fs.writeFileSync(process.env.QAP_TEST_READY, '1'); const wait = new Int32Array(new SharedArrayBuffer(4)); while (!fs.existsSync(process.env.QAP_TEST_RESUME)) Atomics.wait(wait, 0, 0, 20); } return result; }; syncBuiltinESMExports();`);
  const child = spawn(nodeExecutable, [sourceHelper, f.b], { env: { ...f.env, NODE_OPTIONS: `--require="${preload.replaceAll('\\', '/')}"`, QAP_TEST_READY: ready, QAP_TEST_RESUME: resume }, windowsHide: true, stdio: 'ignore', timeout: 15000 });
  const exited = new Promise<number | null>((resolvePromise, reject) => { child.on('error', reject); child.on('exit', resolvePromise); });
  let releaser: ReturnType<typeof spawn> | undefined;
  try {
    const deadline = Date.now() + 10000;
    while (!existsSync(ready) && Date.now() < deadline) await delay(25);
    expect(existsSync(ready)).toBe(true);
    releaser = spawn(nodeExecutable, ['-e', "setTimeout(() => require('node:fs').writeFileSync(process.argv[1], '1'), 1000)", resume], { windowsHide: true, stdio: 'ignore', timeout: 5000 });
    finish();
    await deletion;
    expect(await exited).toBe(0);
    expect(roots(f.registry)).toEqual([f.b]);
    expect(f.service.findActiveProjectByRoot(f.b)?.project_id).toBe(f.projectB.project_id);
  } finally {
    finish();
    if (!existsSync(resume)) writeFileSync(resume, '1');
    child.kill(); releaser?.kill();
    await exited.catch(() => undefined);
    await deletion.catch(() => undefined);
  }
}, 30000);

it('serializes a paused publication with recovery, deletion and a competing helper', async () => {
  const f = fixture(); await remove(f.service, f.projectA.project_id);
  const gen = state(f.service, f.a).generation; f.service.completeRootDeletionCleanup(f.a, gen);
  const oldGrant = randomUUID();
  f.service.recordRootAuthorizationGrant({ canonicalRoot: f.a, generation: gen, grantId: oldGrant,
    mechanism: 'local_operator_helper', registryPublished: true });
  const ready = join(f.dir, 'ready'), resume = join(f.dir, 'resume'), preload = join(f.dir, 'pause.cjs');
  writeFileSync(preload, `const fs = require('node:fs'); const {syncBuiltinESMExports} = require('node:module'); const rename = fs.renameSync; fs.renameSync = function(a,b) { const result = rename.apply(this, arguments); if (String(b).endsWith('authorized-roots.json')) { fs.writeFileSync(process.env.QAP_TEST_READY, '1'); const wait = new Int32Array(new SharedArrayBuffer(4)); while (!fs.existsSync(process.env.QAP_TEST_RESUME)) Atomics.wait(wait, 0, 0, 20); } return result; }; syncBuiltinESMExports();`);
  const child = spawn(process.execPath, [sourceHelper, f.a], { env: { ...f.env, NODE_OPTIONS: `--require="${preload.replaceAll('\\', '/')}"`, QAP_TEST_READY: ready, QAP_TEST_RESUME: resume }, windowsHide: true, stdio: 'ignore', timeout: 25000 });
  const exited = new Promise<number | null>((resolvePromise, reject) => { child.on('error', reject); child.on('exit', resolvePromise); });
  try {
    const deadline = Date.now() + 15000;
    while (!existsSync(ready) && Date.now() < deadline) await delay(25);
    expect(existsSync(ready)).toBe(true);
    expect(() => f.service.recoverDeletedProject(f.projectA.project_id)).toThrow();
    expect(() => f.service.revokeRootAuthorizationGrant(f.a, gen, oldGrant)).toThrow();
    expect(() => runHelper(sourceHelper, f.a, f.env)).toThrow();
    writeFileSync(resume, '1');
    expect(await exited).toBe(0);
    expect(state(f.service, f.a).authorization_grants?.at(-1)).toMatchObject({ generation: gen, status: 'active', registry_published: true });
    expect(f.service.revokeRootAuthorizationGrant(f.a, gen, oldGrant)).toBe(true);
    expect(f.service.recordRootAuthorizationGrant({ canonicalRoot: f.a, generation: gen, grantId: oldGrant,
      mechanism: 'local_operator_helper', registryPublished: true }).status).toBe('revoked');
    f.service.recoverDeletedProject(f.projectA.project_id); await remove(f.service, f.projectA.project_id);
    const newer = state(f.service, f.a); expect(newer.generation).not.toBe(gen);
    expect(newer.authorization_grants?.at(-1)).toMatchObject({ generation: gen, status: 'revoked' });
    expect(state(f.service, f.a)).toEqual(newer);
    expect(roots(f.registry)).toContain(f.a);
    expect(roots(f.registry)).toContain(f.b);
  } finally { if (!existsSync(resume)) writeFileSync(resume, '1'); child.kill(); }
}, 30000);

it('does not expose grant or cleanup operations through MCP', async () => {
  const f = fixture(); await remove(f.service, f.projectA.project_id);
  const before = state(f.service, f.a);
  const server = createMcpServer({ applicationService: f.service, projectRoots: [f.a] });
  const client = new Client({ name: 'authority-boundary-test', version: '1' }, {});
  const [one, two] = InMemoryTransport.createLinkedPair(); await server.connect(two); await client.connect(one);
  try {
    const tools = (await client.listTools()).tools;
    expect(tools.some(t => /recordRootAuthorizationGrant|completeRootDeletionCleanup/i.test(t.name))).toBe(false);
    const project = tools.find(t => t.name === 'qap_project')!;
    const schema = project.inputSchema as { properties: Record<string, { enum?: string[] }> };
    expect(schema.properties.action.enum).not.toContain('recordRootAuthorizationGrant');
    expect(schema.properties.action.enum).not.toContain('completeRootDeletionCleanup');
    expect(schema.properties).not.toHaveProperty('registryPublished');
    for (const action of ['recordRootAuthorizationGrant', 'completeRootDeletionCleanup']) {
      const response = await client.callTool({ name: 'qap_project', arguments: { action, project_id: f.projectA.project_id, generation: before.generation, grantId: randomUUID(), registryPublished: true } });
      expect(response.isError).toBe(true);
    }
    expect(state(f.service, f.a)).toEqual(before);
  } finally { await client.close(); await server.close(); }
});
