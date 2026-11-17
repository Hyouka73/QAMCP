import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, expect, it } from 'vitest';
import { QapApplicationService } from '../application/application-service.js';

const dirs: string[] = [];
const services: QapApplicationService[] = [];
const dbs: DatabaseSync[] = [];
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'qap-generation-'));
  dirs.push(dir);
  const host = join(dir, 'host');
  const a = join(dir, 'a');
  const b = join(dir, 'b');
  mkdirSync(a); mkdirSync(b);
  const service = new QapApplicationService({ hostRootDir: host });
  services.push(service);
  const db = new DatabaseSync(join(host, 'app-service.sqlite'));
  dbs.push(db);
  const projectA = service.createProject({ name: 'A', canonicalRoot: a }).project;
  const projectB = service.createProject({ name: 'B', canonicalRoot: b }).project;
  return { host, a, b, service, db, projectA, projectB };
}
async function remove(service: QapApplicationService, projectId: string) {
  const preview = service.previewDelete(projectId);
  return service.confirmDelete(projectId, preview.confirmation_token, 'confirm_delete');
}
afterEach(() => {
  for (const db of dbs.splice(0)) db.close();
  for (const service of services.splice(0)) service.close();
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

it('persists generations atomically, completes idempotently across instances and fences old cleanup', async () => {
  const { host, a, b, service, db, projectA, projectB } = fixture();
  const migrations = db.prepare('SELECT * FROM app_schema_migrations ORDER BY version').all();
  const neighbor = db.prepare('SELECT * FROM projects WHERE project_id = ?').get(projectB.project_id);
  await remove(service, projectA.project_id);
  const first = service.getRootDeletionState(a);
  expect(first).toMatchObject({ version: 1, project_id: projectA.project_id, canonical_root: a, cleanup_status: 'pending' });
  if (!first || first.version !== 1) throw new Error('expected generation');
  expect(db.prepare('SELECT root_hash FROM deletion_tombstones WHERE project_id = ?').get(projectA.project_id)).toEqual({ root_hash: first.root_hash });
  const other = new QapApplicationService({ hostRootDir: host });
  services.push(other);
  expect(other.getRootDeletionState(a)).toEqual(first);
  expect(other.completeRootDeletionCleanup(a, first.generation)).toBe(true);
  expect(service.completeRootDeletionCleanup(a, first.generation)).toBe(true);
  expect(service.getRootDeletionState(a)).toMatchObject({ cleanup_status: 'completed' });
  service.recoverDeletedProject(projectA.project_id);
  expect(other.getRootDeletionState(a)).toMatchObject({ generation: first.generation, cleanup_status: 'completed' });
  await remove(service, projectA.project_id);
  const second = other.getRootDeletionState(a);
  expect(second).toMatchObject({ version: 1, cleanup_status: 'pending' });
  if (!second || second.version !== 1) throw new Error('expected second generation');
  expect(second.generation).not.toBe(first.generation);
  expect(service.completeRootDeletionCleanup(a, first.generation)).toBe(false);
  expect(other.getRootDeletionState(a)).toEqual(second);
  expect(service.getRootDeletionState(b)).toBeNull();
  expect(db.prepare('SELECT * FROM projects WHERE project_id = ?').get(projectB.project_id)).toEqual(neighbor);
  expect(db.prepare('SELECT * FROM app_schema_migrations ORDER BY version').all()).toEqual(migrations);
  expect(migrations.map(row => row.version)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
});

it('rolls back both tombstone and generation when the generation insert fails', async () => {
  const { a, service, db, projectA, projectB } = fixture();
  db.exec("CREATE TRIGGER fail_generation BEFORE INSERT ON host_session_state WHEN NEW.key LIKE 'root_deletion_generation:v1:%' BEGIN SELECT RAISE(ABORT, 'injected failure'); END");
  await expect(remove(service, projectA.project_id)).rejects.toThrow('injected failure');
  expect(db.prepare('SELECT * FROM deletion_tombstones WHERE project_id = ?').get(projectA.project_id)).toBeUndefined();
  expect(service.getRootDeletionState(a)).toBeNull();
  expect(db.prepare('SELECT status FROM projects WHERE project_id = ?').get(projectB.project_id)).toEqual({ status: 'active' });
});

it('rolls back both writes even if a later operation fails', async () => {
  const { a, service, db, projectA } = fixture();
  db.exec("CREATE TRIGGER fail_after_generation BEFORE UPDATE OF status ON projects WHEN NEW.status = 'deleted' BEGIN SELECT RAISE(ABORT, 'injected late failure'); END");
  await expect(remove(service, projectA.project_id)).rejects.toThrow('injected late failure');
  expect(db.prepare('SELECT * FROM deletion_tombstones WHERE project_id = ?').get(projectA.project_id)).toBeUndefined();
  expect(service.getRootDeletionState(a)).toBeNull();
});

it('reports historical tombstones as unknown without modifying them or completing cleanup', async () => {
  const { a, service, db, projectA } = fixture();
  await remove(service, projectA.project_id);
  const tombstone = db.prepare('SELECT * FROM deletion_tombstones WHERE project_id = ?').get(projectA.project_id);
  const state = service.getRootDeletionState(a);
  if (!state || state.version !== 1) throw new Error('expected generation');
  db.prepare('DELETE FROM host_session_state WHERE key = ?').run(`root_deletion_generation:v1:${state.root_hash}`);
  expect(service.getRootDeletionState(a)).toMatchObject({ version: 0, cleanup_status: 'unknown', project_id: projectA.project_id });
  expect(service.completeRootDeletionCleanup(a, state.generation)).toBe(false);
  expect(db.prepare('SELECT * FROM deletion_tombstones WHERE project_id = ?').get(projectA.project_id)).toEqual(tombstone);
  expect(db.prepare("SELECT key FROM host_session_state WHERE key LIKE 'root_deletion_generation:v1:%'").all()).toHaveLength(0);
});

it('does not apply a retained older generation to a different historical tombstone', async () => {
  const { a, service, db, projectA } = fixture();
  await remove(service, projectA.project_id);
  const state = service.getRootDeletionState(a);
  if (!state || state.version !== 1) throw new Error('expected generation');
  db.prepare('UPDATE deletion_tombstones SET deleted_at = ? WHERE project_id = ?').run('2001-01-01T00:00:00.000Z', projectA.project_id);
  expect(service.getRootDeletionState(a)).toMatchObject({ version: 0, cleanup_status: 'unknown' });
  expect(service.completeRootDeletionCleanup(a, state.generation)).toBe(false);
});

it('rejects malformed stored generations instead of treating them as completed', async () => {
  const { a, service, db, projectA } = fixture();
  await remove(service, projectA.project_id);
  db.prepare("UPDATE host_session_state SET value = '{}' WHERE key LIKE 'root_deletion_generation:v1:%'").run();
  expect(() => service.getRootDeletionState(a)).toThrowError(expect.objectContaining({ code: 'invalid_deletion_generation' }));
  expect(() => service.completeRootDeletionCleanup(a, 'anything')).toThrowError(expect.objectContaining({ code: 'invalid_deletion_generation' }));
});
