import { randomUUID } from 'node:crypto';
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, expect, it, vi } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
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
function runHelper(path: string, root: string, env: NodeJS.ProcessEnv) {
  return execFileSync(process.execPath, [path, root], { env, encoding: 'utf8', stdio: 'pipe', windowsHide: true });
}
const roots = (path: string): string[] => existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : [];
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
    const child = spawn(process.execPath, [sourceHelper, f.a], { env: f.env, windowsHide: true, stdio: 'ignore' });
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

it('fences a helper paused after JSON when a newer deletion commits and a second helper competes', async () => {
  const f = fixture(); await remove(f.service, f.projectA.project_id);
  const gen = state(f.service, f.a).generation; f.service.completeRootDeletionCleanup(f.a, gen);
  const ready = join(f.dir, 'ready'), resume = join(f.dir, 'resume'), preload = join(f.dir, 'pause.cjs');
  writeFileSync(preload, `const fs = require('node:fs'); const {syncBuiltinESMExports} = require('node:module'); const rename = fs.renameSync; fs.renameSync = function(a,b) { const result = rename.apply(this, arguments); if (String(b).endsWith('authorized-roots.json')) { fs.writeFileSync(process.env.QAP_TEST_READY, '1'); const wait = new Int32Array(new SharedArrayBuffer(4)); while (!fs.existsSync(process.env.QAP_TEST_RESUME)) Atomics.wait(wait, 0, 0, 20); } return result; }; syncBuiltinESMExports();`);
  const child = spawn(process.execPath, [sourceHelper, f.a], { env: { ...f.env, NODE_OPTIONS: `--require="${preload.replaceAll('\\', '/')}"`, QAP_TEST_READY: ready, QAP_TEST_RESUME: resume }, windowsHide: true, stdio: 'ignore' });
  const exited = new Promise<number | null>((resolvePromise, reject) => { child.on('error', reject); child.on('exit', resolvePromise); });
  try {
    const deadline = Date.now() + 15000;
    while (!existsSync(ready) && Date.now() < deadline) await new Promise(resolvePromise => setTimeout(resolvePromise, 25));
    expect(existsSync(ready)).toBe(true);
    f.service.recoverDeletedProject(f.projectA.project_id); await remove(f.service, f.projectA.project_id);
    const newer = state(f.service, f.a); expect(newer.generation).not.toBe(gen);
    expect(() => runHelper(sourceHelper, f.a, f.env)).toThrow();
    writeFileSync(resume, '1');
    expect(await exited).not.toBe(0);
    expect(state(f.service, f.a)).toEqual(newer);
    expect(roots(f.registry)).not.toContain(f.a);
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
