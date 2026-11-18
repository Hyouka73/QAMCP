import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, expect, it } from 'vitest';
import { QapApplicationService } from '../application/application-service.js';

const dirs: string[] = [];
const services: QapApplicationService[] = [];
const dbs: DatabaseSync[] = [];
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'qap-root-grant-')); dirs.push(dir);
  const host = join(dir, 'host'), a = join(dir, 'a'), b = join(dir, 'b');
  mkdirSync(a); mkdirSync(b);
  const service = new QapApplicationService({ hostRootDir: host }); services.push(service);
  const db = new DatabaseSync(join(host, 'app-service.sqlite')); dbs.push(db);
  const projectA = service.createProject({ name: 'A', canonicalRoot: a }).project;
  const projectB = service.createProject({ name: 'B', canonicalRoot: b }).project;
  return { host, a, b, service, db, projectA, projectB };
}
async function remove(service: QapApplicationService, projectId: string) {
  const preview = service.previewDelete(projectId);
  await service.confirmDelete(projectId, preview.confirmation_token, 'confirm_delete');
}
function generation(service: QapApplicationService, root: string): string {
  const state = service.getRootDeletionState(root);
  if (!state || state.version !== 1) throw new Error('expected deletion generation');
  return state.generation;
}
const grant = (service: QapApplicationService, canonicalRoot: string, generation: string, grantId: string) =>
  service.recordRootAuthorizationGrant({ canonicalRoot, generation, grantId, mechanism: 'local_operator_helper' });
afterEach(() => {
  for (const db of dbs.splice(0)) db.close();
  for (const service of services.splice(0)) service.close();
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

it('reports only a current published active grant in a durable snapshot', async () => {
  const { host, a, b, service, projectA } = fixture();
  expect(service.getRootAuthorizationSnapshot(a)).toEqual({ kind: 'no_retained_history' });
  await remove(service, projectA.project_id);
  const gen = generation(service, a);
  expect(service.getRootAuthorizationSnapshot(a)).toMatchObject({ kind: 'generation', cleanup_status: 'pending', published_active_grant: false });
  service.completeRootDeletionCleanup(a, gen);
  const unpublished = randomUUID();
  grant(service, a, gen, unpublished);
  expect(service.getRootAuthorizationSnapshot(a)).toMatchObject({ published_active_grant: false });
  const id = randomUUID();
  service.recordRootAuthorizationGrant({ canonicalRoot: a, generation: gen, grantId: id, mechanism: 'local_operator_helper', registryPublished: true });
  const other = new QapApplicationService({ hostRootDir: host }); services.push(other);
  expect(other.getRootAuthorizationSnapshot(a)).toMatchObject({ generation: gen, published_active_grant: true });
  other.revokeRootAuthorizationGrant(a, gen, id);
  expect(service.getRootAuthorizationSnapshot(a)).toMatchObject({ published_active_grant: false });
  expect(other.getRootAuthorizationSnapshot(b)).toEqual({ kind: 'no_retained_history' });
});

it('enforces completed cleanup, persists and revokes without replay reactivation', async () => {
  const { host, a, b, service, db, projectA, projectB } = fixture();
  const neighbor = db.prepare('SELECT * FROM projects WHERE project_id = ?').get(projectB.project_id);
  const id = randomUUID();
  expect(service.getRootAuthorizationGrant(a, id)).toEqual({ kind: 'never_deleted' });
  await remove(service, projectA.project_id);
  const gen = generation(service, a);
  expect(() => grant(service, a, gen, id)).toThrowError(expect.objectContaining({ code: 'root_authorization_generation_unavailable' }));
  expect(service.completeRootDeletionCleanup(a, gen)).toBe(true);
  const first = grant(service, a, gen, id);
  expect(first).toMatchObject({ grant_id: id, generation: gen, status: 'active', mechanism: 'local_operator_helper' });
  expect(first.granted_at).toBeTruthy();
  expect(first).not.toHaveProperty('expires_at');
  const second = new QapApplicationService({ hostRootDir: host }); services.push(second);
  expect(second.getRootAuthorizationGrant(a, id)).toMatchObject({ kind: 'generation', grant: first });
  expect(grant(second, a, gen, id)).toEqual(first);
  expect(second.revokeRootAuthorizationGrant(a, gen, id)).toBe(true);
  expect(service.revokeRootAuthorizationGrant(a, gen, id)).toBe(true);
  expect(grant(service, a, gen, id)).toMatchObject({ status: 'revoked', granted_at: first.granted_at });
  expect(second.getRootAuthorizationGrant(a, id)).toMatchObject({ grant: { status: 'revoked' } });
  expect(service.getRootAuthorizationGrant(b, id)).toEqual({ kind: 'never_deleted' });
  expect(db.prepare('SELECT * FROM projects WHERE project_id = ?').get(projectB.project_id)).toEqual(neighbor);
});

it('invalidates old grants on a second deletion and rejects old generations and reused identities', async () => {
  const { a, service, projectA } = fixture();
  await remove(service, projectA.project_id);
  const first = generation(service, a), id = randomUUID();
  service.completeRootDeletionCleanup(a, first);
  grant(service, a, first, id);
  service.recoverDeletedProject(projectA.project_id);
  await remove(service, projectA.project_id);
  const next = generation(service, a);
  expect(next).not.toBe(first);
  expect(service.getRootAuthorizationGrant(a, id)).toMatchObject({ generation: next, cleanup_status: 'pending', grant: null });
  expect(service.getRootDeletionState(a)).toMatchObject({ authorization_grants: [{ grant_id: id, status: 'revoked', generation: first }] });
  expect(() => grant(service, a, first, randomUUID())).toThrowError(expect.objectContaining({ code: 'root_authorization_generation_unavailable' }));
  expect(service.revokeRootAuthorizationGrant(a, first, id)).toBe(false);
  service.completeRootDeletionCleanup(a, next);
  expect(() => grant(service, a, next, id)).toThrowError(expect.objectContaining({ code: 'root_authorization_grant_conflict' }));
  expect(grant(service, a, next, randomUUID()).status).toBe('active');
});

it('distinguishes historical and corrupt state, and rejects unsupported input without changing history', async () => {
  const { a, service, db, projectA } = fixture();
  await remove(service, projectA.project_id);
  const gen = generation(service, a), id = randomUUID();
  const before = db.prepare('SELECT * FROM deletion_tombstones WHERE project_id = ?').get(projectA.project_id);
  db.prepare("DELETE FROM host_session_state WHERE key LIKE 'root_deletion_generation:v1:%'").run();
  expect(service.getRootAuthorizationGrant(a, id)).toEqual({ kind: 'historical_tombstone' });
  expect(service.getRootAuthorizationSnapshot(a)).toEqual({ kind: 'historical_tombstone' });
  expect(() => grant(service, a, gen, id)).toThrowError(expect.objectContaining({ code: 'root_authorization_generation_unavailable' }));
  expect(db.prepare('SELECT * FROM deletion_tombstones WHERE project_id = ?').get(projectA.project_id)).toEqual(before);
  expect(() => service.recordRootAuthorizationGrant({ canonicalRoot: a, generation: gen, grantId: 'bad', mechanism: 'local_operator_helper' })).toThrow();
  db.prepare("INSERT INTO host_session_state VALUES (?, ?, ?)").run(`root_deletion_generation:v1:${projectA.root_hash}`, '{}', new Date().toISOString());
  expect(() => service.getRootAuthorizationGrant(a, id)).toThrowError(expect.objectContaining({ code: 'invalid_deletion_generation' }));
  expect(() => service.getRootAuthorizationSnapshot(a)).toThrowError(expect.objectContaining({ code: 'invalid_deletion_generation' }));
  expect(() => grant(service, a, gen, id)).toThrowError(expect.objectContaining({ code: 'invalid_deletion_generation' }));
});

it('fails closed on corrupt grant history and rolls back a failed grant write', async () => {
  const { a, service, db, projectA } = fixture();
  await remove(service, projectA.project_id);
  const gen = generation(service, a), id = randomUUID();
  service.completeRootDeletionCleanup(a, gen);
  db.exec("CREATE TRIGGER fail_grant BEFORE UPDATE ON host_session_state WHEN NEW.key LIKE 'root_deletion_generation:v1:%' BEGIN SELECT RAISE(ABORT, 'injected failure'); END");
  expect(() => grant(service, a, gen, id)).toThrow('injected failure');
  expect(service.getRootAuthorizationGrant(a, id)).toMatchObject({ grant: null });
  db.exec('DROP TRIGGER fail_grant');
  grant(service, a, gen, id);
  const row = db.prepare("SELECT key, value FROM host_session_state WHERE key LIKE 'root_deletion_generation:v1:%'").get() as { key: string; value: string };
  const state = JSON.parse(row.value); state.authorization_grants[0].secret = 'must-not-be-accepted';
  db.prepare('UPDATE host_session_state SET value = ? WHERE key = ?').run(JSON.stringify(state), row.key);
  expect(() => service.getRootAuthorizationGrant(a, id)).toThrowError(expect.objectContaining({ code: 'invalid_deletion_generation' }));
});

it('serializes independent process grants without lost updates', async () => {
  const { host, a, service, projectA } = fixture();
  await remove(service, projectA.project_id);
  const gen = generation(service, a);
  service.completeRootDeletionCleanup(a, gen);
  const ids = [randomUUID(), randomUUID()];
  const moduleUrl = pathToFileURL(resolve('dist/index.js')).href;
  const script = `import { QapApplicationService } from ${JSON.stringify(moduleUrl)}; const [host, root, generation, grantId] = process.argv.slice(1); const s = new QapApplicationService({hostRootDir:host}); try { s.recordRootAuthorizationGrant({canonicalRoot:root,generation,grantId,mechanism:'local_operator_helper'}); } finally { s.close(); }`;
  const run = (id: string) => new Promise<void>((resolvePromise, reject) => {
    const child = spawn(process.execPath, ['--input-type=module', '-e', script, host, a, gen, id], { windowsHide: true, timeout: 15000 });
    let stderr = ''; child.stderr.setEncoding('utf8'); child.stderr.on('data', data => { stderr += data; });
    child.on('error', reject); child.on('exit', code => code === 0 ? resolvePromise() : reject(new Error(stderr)));
  });
  await Promise.all(ids.map(run));
  for (const id of ids) expect(service.getRootAuthorizationGrant(a, id)).toMatchObject({ grant: { grant_id: id, status: 'active' } });
});

it('rejects a delayed writer after a newer generation commits under the SQLite lock', async () => {
  const { host, a, service, db, projectA } = fixture();
  await remove(service, projectA.project_id);
  const oldGeneration = generation(service, a), newGeneration = randomUUID(), id = randomUUID();
  service.completeRootDeletionCleanup(a, oldGeneration);
  const moduleUrl = pathToFileURL(resolve('dist/index.js')).href;
  const script = `import { QapApplicationService } from ${JSON.stringify(moduleUrl)}; const [host, root, generation, grantId] = process.argv.slice(1); const s = new QapApplicationService({hostRootDir:host}); console.log('ready'); process.stdin.once('data', () => { try { s.recordRootAuthorizationGrant({canonicalRoot:root,generation,grantId,mechanism:'local_operator_helper'}); console.log('unexpected success'); } catch (e) { console.log(e.code); } finally { s.close(); } });`;
  const child = spawn(process.execPath, ['--input-type=module', '-e', script, host, a, oldGeneration, id], { windowsHide: true, timeout: 15000 });
  let output = '', errors = '';
  child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8');
  child.stderr.on('data', data => { errors += data; });
  const exited = new Promise<void>((resolvePromise, reject) => {
    child.on('error', reject); child.on('exit', code => code === 0 ? resolvePromise() : reject(new Error(errors)));
  });
  await new Promise<void>((resolvePromise, reject) => {
    child.stdout.on('data', data => { output += data; if (output.includes('ready')) resolvePromise(); });
    child.on('error', reject); child.on('exit', () => { if (!output.includes('ready')) reject(new Error(errors)); });
  });
  const row = db.prepare("SELECT key, value FROM host_session_state WHERE key LIKE 'root_deletion_generation:v1:%'").get() as { key: string; value: string };
  const newState = { ...JSON.parse(row.value), generation: newGeneration, cleanup_status: 'pending' };
  db.exec('BEGIN IMMEDIATE');
  try {
    db.prepare('UPDATE host_session_state SET value = ? WHERE key = ?').run(JSON.stringify(newState), row.key);
    child.stdin.end('go');
    await new Promise(resolvePromise => setTimeout(resolvePromise, 200));
    expect(output).not.toContain('unexpected success');
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); child.kill(); throw error; }
  await exited;
  expect(output).toContain('root_authorization_generation_unavailable');
  expect(service.getRootAuthorizationGrant(a, id)).toMatchObject({ generation: newGeneration, cleanup_status: 'pending', grant: null });
});
