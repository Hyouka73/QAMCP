import { spawnSync } from 'node:child_process';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { acquireProjectOperation, workspaceStorageKey, type ResetAuthorizer, type ResetPreview } from '../project-reset.js';
import { createMcpServer } from '../server.js';
import { WorkspaceBootstrap } from '../workspace-bootstrap.js';

const fault = vi.hoisted(() => ({ failRmdir: false }));
vi.mock('node:fs', async importOriginal => {
  const fs = await importOriginal<typeof import('node:fs')>();
  return { ...fs, rmdirSync: (path: string) => {
    if (fault.failRmdir) throw Object.assign(new Error('PRIVATE_CANARY'), { code: 'EPERM' });
    fs.rmdirSync(path);
  } };
});

const key = randomBytes(32);
const scopes = (root: string) => [{ projectRoot: root, fixture: 'PRIVATE_CANARY' }];
function encode(grants: unknown) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from('qap-qa-authorizations-v1'));
  const data = Buffer.concat([cipher.update(JSON.stringify(grants)), cipher.final()]);
  return { iv: iv.toString('hex'), tag: cipher.getAuthTag().toString('hex'), data: data.toString('hex') };
}
function readGrants(path: string): unknown {
  const env = JSON.parse(readFileSync(path, 'utf8')) as Record<string, string>;
  const cipher = createDecipheriv('aes-256-gcm', key, Buffer.from(env.iv, 'hex'));
  cipher.setAAD(Buffer.from('qap-qa-authorizations-v1'));
  cipher.setAuthTag(Buffer.from(env.tag, 'hex'));
  return JSON.parse(Buffer.concat([cipher.update(Buffer.from(env.data, 'hex')), cipher.final()]).toString('utf8')) as unknown;
}

let parent: string, root: string, other: string, host: string;
let rootsPath: string, discoveryPath: string, grantsPath: string, dbPath: string, otherDb: string;
let connections: Array<{ client: Client; server: ReturnType<typeof createMcpServer> }>;
const json = (path: string, payload: unknown) => writeFileSync(path, JSON.stringify(payload));
const read = (path: string): unknown => JSON.parse(readFileSync(path, 'utf8')) as unknown;
beforeEach(async () => {
  connections = [];
  parent = realpathSync(mkdtempSync(join(tmpdir(), 'qap-reset-')));
  [root, other, host] = ['target', 'neighbor', 'host'].map(name => join(parent, name));
  for (const dir of [root, other, host]) mkdirSync(dir);
  const bootstrap = new WorkspaceBootstrap(host);
  try {
    await bootstrap.prepare(root, 'https://previous.example/');
    await bootstrap.prepare(other, 'https://neighbor.example/');
  } finally { bootstrap.close(); }
  dbPath = join(host, workspaceStorageKey(root), 'knowledge.sqlite');
  otherDb = join(host, workspaceStorageKey(other), 'knowledge.sqlite');
  rootsPath = join(host, 'authorized-roots.json');
  discoveryPath = join(host, 'discovery-authorizations.json');
  grantsPath = join(host, 'qa-session-authorizations.enc');
  json(rootsPath, [root, other]);
  json(discoveryPath, [...scopes(root), ...scopes(other)]);
  json(grantsPath, encode([...scopes(root), ...scopes(other)]));
  writeFileSync(join(host, 'host-session.key'), 'HOST_KEY_CANARY');
  writeFileSync(join(root, 'README.md'), 'retain this source file');
  mkdirSync(join(root, '.qa', 'logs'));
  writeFileSync(join(root, '.qa', 'logs', 'qap-events.jsonl'), 'PRIVATE_CANARY\n');
});
afterEach(async () => {
  fault.failRmdir = false;
  vi.useRealTimers();
  for (const { client, server } of connections) { await client.close(); await server.close(); }
  rmSync(parent, { recursive: true, force: true });
});
async function connect(authorizer?: ResetAuthorizer) {
  const server = createMcpServer({ projectRoots: [], workspaceBootstrap: new WorkspaceBootstrap(host), hostRegistryPath: rootsPath,
    hostDiscoveryRegistryPath: discoveryPath, authorizationPersistencePath: grantsPath, sessionPersistenceKey: key.toString('hex'),
    ...(authorizer ? { projectResetAuthorizer: authorizer } : {}) });
  const client = new Client({ name: 'project-reset-fixture', version: '1' }, { capabilities: { elicitation: { form: {} } } });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await server.connect(a);
  await client.connect(b);
  connections.push({ client, server });
  return { client, server };
}
async function call<T = Record<string, unknown>>(client: Client, name: string, args: Record<string, unknown> = {}): Promise<T> {
  const response = await client.callTool({ name, arguments: { targetPath: root, ...args } });
  const content = (response.content as Array<{ text: string }>)[0];
  return JSON.parse(content.text) as T;
}
const preview = (client: Client) => call<ResetPreview & { status: string }>(client, 'qap_project_reset', { phase: 'preview' });
const confirm = (client: Client, id: string) => call(client, 'qap_project_reset', { phase: 'confirm', reset_id: id });
const approved: ResetAuthorizer = async () => 'approved';

it.each(['rejected', 'cancelled', 'unavailable'] as const)('does not delete on %s; attempts are single use', async decision => {
  const { client } = await connect(async () => decision);
  const p = await preview(client);
  expect(p.status).toBe('preview');
  expect(await confirm(client, p.reset_id)).toMatchObject({ status: 'blocked', code: 'reset_authorization_' + decision });
  expect(await confirm(client, p.reset_id)).toMatchObject({ code: 'reset_preview_required' });
  expect(existsSync(dbPath)).toBe(true);
  expect(read(rootsPath)).toEqual([root, other]);
  expect(readGrants(grantsPath)).toEqual([...scopes(root), ...scopes(other)]);
  expect(existsSync(join(root, '.qa', 'logs', 'qap-events.jsonl'))).toBe(true);
});
it('cannot use form capabilities, legacy force, or a synthetic approval as authorization', async () => {
  const { client } = await connect();
  expect(await call(client, 'qap_project_reset', { phase: 'confirm', reset_id: 'invented', force: true })).toMatchObject({ code: 'invalid_reset_arguments' });
  const cleanAttempt = await client.callTool({ name: 'qap_clean', arguments: { targetPath: root, force: true } });
  expect(cleanAttempt.isError).toBe(true);
  expect((cleanAttempt.content as Array<{ text: string }>)[0].text).toContain('qap_clean');
  const p = await preview(client);
  expect(await confirm(client, p.reset_id)).toMatchObject({ code: 'reset_authorization_unavailable' });
  expect(existsSync(dbPath)).toBe(true);
  expect(existsSync(join(root, '.qa'))).toBe(true);
});
it('binds consent to the exact inventory and expires old previews', async () => {
  const authorize = vi.fn<ResetAuthorizer>(async () => 'approved');
  const { client } = await connect(authorize);
  const p = await preview(client);
  writeFileSync(join(root, '.qa', 'changed.txt'), 'changed since preview');
  expect(await confirm(client, p.reset_id)).toMatchObject({ code: 'inventory_changed' });
  expect(authorize.mock.calls[0][0].inventory_digest).toBe(p.inventory_digest);
  const old = await preview(client);
  const clock = vi.spyOn(Date, 'now').mockReturnValue(Date.parse(old.expires_at) + 1);
  try { expect(await confirm(client, old.reset_id)).toMatchObject({ code: 'reset_preview_expired' }); }
  finally { clock.mockRestore(); }
  expect(authorize).toHaveBeenCalledTimes(1);
  expect(existsSync(dbPath)).toBe(true);
});
it('removes real SQL and scoped records, preserves another workspace, and starts fresh across MCP restart', async () => {
  const { client, server } = await connect(approved);
  const neighborBefore = readFileSync(otherDb);
  const p = await preview(client);
  expect(p.inventory).toEqual(expect.arrayContaining([
    expect.objectContaining({ resource: 'host/knowledge.sqlite', classification: 'exclusive', count: 1 }),
    expect.objectContaining({ resource: 'autorizaciones QA cifradas', classification: 'shared', count: 1 }),
  ]));
  const result = await confirm(client, p.reset_id);
  expect(result).toMatchObject({ status: 'success', code: 'project_reset_complete' });
  expect(existsSync(join(root, '.qa'))).toBe(false);
  expect(existsSync(join(host, workspaceStorageKey(root)))).toBe(false);
  expect(readFileSync(otherDb)).toEqual(neighborBefore);
  expect(existsSync(join(other, '.qa'))).toBe(true);
  expect(read(rootsPath)).toEqual([other]);
  expect(read(discoveryPath)).toEqual(scopes(other));
  expect(readGrants(grantsPath)).toEqual(scopes(other));
  expect(readFileSync(join(host, 'host-session.key'), 'utf8')).toBe('HOST_KEY_CANARY');
  expect(existsSync(join(root, 'README.md'))).toBe(true);
  const receipt = readFileSync(join(host, 'project-resets', p.reset_id + '.receipt.json'), 'utf8');
  expect(JSON.parse(receipt)).toMatchObject({ status: 'complete', pending: [], failures: [] });
  expect(receipt).not.toContain('PRIVATE_CANARY');
  await client.close();
  await server.close();
  const restarted = await connect(approved);
  expect(await call(restarted.client, 'qap_status')).toMatchObject({ initialized: false });
  expect(await confirm(restarted.client, p.reset_id)).toMatchObject({ code: 'workspace_authorization_required' });
  expect(existsSync(join(root, '.qa'))).toBe(false);
  json(rootsPath, [root, other]); // New root authorization, independent of the previous project.
  expect((await call(restarted.client, 'qap_init')).status).not.toBe('error');
  const db = new DatabaseSync(dbPath, { readOnly: true });
  try { expect(db.prepare('SELECT * FROM knowledge_scopes').all()).toEqual([]); } finally { db.close(); }
});
it('rejects active SQLite writers and the cross-process QAP gate without removing files', async () => {
  const { client } = await connect(approved);
  const db = new DatabaseSync(dbPath);
  try {
    db.exec('PRAGMA journal_mode=DELETE');
    db.exec('BEGIN IMMEDIATE');
    const p = await preview(client);
    expect(p.status).toBe('preview');
    expect(await confirm(client, p.reset_id)).toMatchObject({ status: 'blocked', code: expect.stringMatching(/^sqlite_busy/) });
    expect(existsSync(dbPath)).toBe(true);
    expect(existsSync(join(root, '.qa'))).toBe(true);
  } finally { db.close(); }
  const p = await preview(client);
  const release = acquireProjectOperation(host);
  try { expect(await confirm(client, p.reset_id)).toMatchObject({ code: 'project_storage_busy' }); }
  finally { release(); }
});
it('inventories and removes real WAL and SHM files left by an exited writer', async () => {
  const child = spawnSync(process.execPath, ['--input-type=commonjs', '-e',
    'const db = new (require("node:sqlite").DatabaseSync)(process.argv[1]); db.exec("PRAGMA journal_mode=WAL; UPDATE knowledge_scopes SET version = version + 1"); process.exit(0);',
    dbPath], { encoding: 'utf8' });
  expect(child.status).toBe(0);
  expect(existsSync(dbPath + '-wal')).toBe(true);
  expect(existsSync(dbPath + '-shm')).toBe(true);
  const { client } = await connect(approved);
  const p = await preview(client);
  expect(p.inventory).toEqual(expect.arrayContaining([
    expect.objectContaining({ resource: 'host/knowledge.sqlite-wal', count: 1 }),
    expect.objectContaining({ resource: 'host/knowledge.sqlite-shm', count: 1 }),
  ]));
  expect(await confirm(client, p.reset_id)).toMatchObject({ status: 'success' });
  expect([dbPath, dbPath + '-wal', dbPath + '-shm'].some(path => existsSync(path))).toBe(false);
});
it('refuses a Knowledge database that contains a different application scope', async () => {
  const db = new DatabaseSync(dbPath);
  try { db.prepare('INSERT INTO knowledge_scopes VALUES (?, 0)').run('another-application'); }
  finally { db.close(); }
  const { client } = await connect(approved);
  const p = await preview(client);
  expect(await confirm(client, p.reset_id)).toMatchObject({ status: 'blocked', code: 'sqlite_ownership_ambiguous' });
  expect(existsSync(dbPath)).toBe(true);
  expect(existsSync(join(root, '.qa'))).toBe(true);
});
it('blocks reset when an interrupted shared registry update might still contain project data', async () => {
  const staging = join(host, 'qa-session-authorizations.enc.123abc.tmp');
  json(staging, encode([...scopes(root), ...scopes(other)]));
  const authorizer = vi.fn(approved);
  const { client } = await connect(authorizer);
  expect(await preview(client)).toMatchObject({ status: 'blocked', code: 'authorization_registry_staging_present' });
  expect(existsSync(dbPath)).toBe(true);
  expect(existsSync(staging)).toBe(true);
  expect(authorizer).not.toHaveBeenCalled();
});
it('records a partial error, keeps the project frozen, and requires another preview and consent to retry', async () => {
  const { client } = await connect(approved);
  const p = await preview(client);
  fault.failRmdir = true;
  const partial = await confirm(client, p.reset_id);
  expect(partial).toMatchObject({ status: 'partial', code: 'project_reset_incomplete', receipt_id: p.reset_id,
    failures: [expect.objectContaining({ code: 'storage_error' })] });
  const receipt = readFileSync(join(host, 'project-resets', p.reset_id + '.receipt.json'), 'utf8');
  expect(JSON.parse(receipt)).toMatchObject({ status: 'partial', pending: expect.arrayContaining([expect.objectContaining({ resource: 'directorio Knowledge del proyecto' })]) });
  expect(receipt).not.toContain('PRIVATE_CANARY');
  expect(await call(client, 'qap_status')).toMatchObject({ code: 'project_reset_incomplete' });
  expect(await call(client, 'qap_init')).toMatchObject({ code: 'project_reset_incomplete' });
  expect(existsSync(join(root, '.qa'))).toBe(false);
  fault.failRmdir = false;
  const next = await preview(client);
  expect(await confirm(client, next.reset_id)).toMatchObject({ status: 'success' });
});
