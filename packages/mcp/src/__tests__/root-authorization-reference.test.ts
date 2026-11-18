import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, expect, it, vi } from 'vitest';
import { QapApplicationService } from '../application/application-service.js';

const cleanup: (() => void)[] = [];
vi.setConfig({ testTimeout: 30000 });
afterEach(() => { for (const f of cleanup.splice(0).reverse()) f(); });
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'qap-reference-')); cleanup.push(() => rmSync(dir, { recursive: true, force: true }));
  const app = join(dir, 'app'), host = join(dir, 'host'), a = join(dir, 'a'), b = join(dir, 'b'), child = join(a, 'child');
  mkdirSync(host); mkdirSync(a); mkdirSync(b); mkdirSync(child);
  const service = new QapApplicationService({ hostRootDir: app, projectOperationDirectory: host }); cleanup.push(() => service.close());
  const db = new DatabaseSync(join(app, 'app-service.sqlite')); cleanup.push(() => db.close());
  const registry = join(host, 'authorized-roots.json'); writeFileSync(registry, JSON.stringify([b]));
  const registered = (root: string) => (JSON.parse(readFileSync(registry, 'utf8')) as string[]).includes(root);
  const helper = (root: string) => execFileSync(process.execPath, [resolve('../../scripts/qap-authorize-workspace.mjs'), root], {
    env: { ...process.env, QAP_MCP_APP_SERVICE_DIR: app, QAP_MCP_WORKSPACE_HOST_DIR: host }, windowsHide: true, stdio: 'pipe', timeout: 15000,
  });
  return { dir, app, host, a, b, child, service, db, registry, registered, helper };
}

it('pins the exact grant, preserves revocation, and does not infer from JSON', () => {
  const f = fixture();
  expect(f.service.getRootAuthorizationReference(f.b, f.registered)).toBeNull();
  f.helper(f.a); f.helper(f.b);
  const b = f.service.getRootAuthorizationReference(f.b, f.registered)!;
  const g1 = f.service.getRootAuthorizationReference(f.a, f.registered)!;
  expect(g1).toMatchObject({ canonical_root: f.a, coordination_domain: f.host });
  expect(f.service.validateRootAuthorizationReference(g1, f.registered)).toBe(true);
  expect(f.service.revokeRootAuthorizationGrant(f.a, g1.generation, g1.grant_id)).toBe(true);
  expect(() => f.service.publishRootAuthorization(f.a, g1.grant_id, () => {}, () => {})).toThrow();
  f.helper(f.a);
  const g2 = f.service.getRootAuthorizationReference(f.a, f.registered)!;
  expect(g2.grant_id).not.toBe(g1.grant_id);
  expect(f.service.validateRootAuthorizationReference(g1, f.registered)).toBe(false);
  expect(f.service.validateRootAuthorizationReference(g2, f.registered)).toBe(true);
  expect(f.service.validateRootAuthorizationReference({ ...g2, coordination_domain: f.app }, f.registered)).toBe(false);
  expect(f.service.validateRootAuthorizationReference(b, f.registered)).toBe(true);
  f.service.withProjectOperation(context => expect(f.service.validateRootAuthorizationReference(g2, f.registered, context)).toBe(true));
});

it('rejects a corrupt initial record even when the registry declares the root', () => {
  const f = fixture(); f.helper(f.a);
  f.db.prepare("UPDATE host_session_state SET value = '{}' WHERE key LIKE 'root_initial_authority:v1:%'").run();
  expect(() => f.service.getRootAuthorizationReference(f.a, f.registered)).toThrow();
});

it('rejects prior generations and incomplete or corrupt deletion history', async () => {
  const f = fixture(); const project = f.service.createProject({ name: 'A', canonicalRoot: f.a }).project;
  f.helper(f.a); const initial = f.service.getRootAuthorizationReference(f.a, f.registered)!;
  const remove = async () => { const p = f.service.previewDelete(project.project_id); await f.service.confirmDelete(project.project_id, p.confirmation_token, 'confirm_delete'); };
  await remove();
  expect(f.service.validateRootAuthorizationReference(initial, f.registered)).toBe(false);
  const first = f.service.getRootDeletionState(f.a)!; if (first.version !== 1) throw Error('missing generation');
  f.service.completeRootDeletionCleanup(f.a, first.generation); f.helper(f.a);
  const old = f.service.getRootAuthorizationReference(f.a, f.registered)!;
  f.service.recoverDeletedProject(project.project_id); await remove();
  expect(f.service.validateRootAuthorizationReference(old, f.registered)).toBe(false);
  const key = `root_deletion_generation:v1:${first.root_hash}`;
  f.db.prepare('DELETE FROM host_session_state WHERE key = ?').run(key);
  expect(f.service.getRootAuthorizationReference(f.a, f.registered)).toBeNull();
  f.db.prepare('INSERT INTO host_session_state VALUES (?, ?, ?)').run(key, '{}', new Date().toISOString());
  expect(() => f.service.getRootAuthorizationReference(f.a, f.registered)).toThrow();
});

it('rejects a descendant when its protected ancestor is revoked or absent from the registry', () => {
  const f = fixture(); f.helper(f.a); f.helper(f.child);
  const parent = f.service.getRootAuthorizationReference(f.a, f.registered)!;
  const child = f.service.getRootAuthorizationReference(f.child, f.registered)!;
  writeFileSync(f.registry, JSON.stringify([f.child, f.b]));
  expect(f.service.validateRootAuthorizationReference(child, f.registered)).toBe(false);
  writeFileSync(f.registry, JSON.stringify([f.a, f.child, f.b]));
  f.service.revokeRootAuthorizationGrant(f.a, parent.generation, parent.grant_id);
  expect(f.service.validateRootAuthorizationReference(child, f.registered)).toBe(false);
  f.helper(f.a);
  expect(f.service.validateRootAuthorizationReference(child, f.registered)).toBe(false);
  expect(f.service.getRootAuthorizationReference(f.child, f.registered)).not.toBeNull();
});

it('shares identity and revocation with another process', () => {
  const f = fixture(); f.helper(f.a);
  const ref = f.service.getRootAuthorizationReference(f.a, f.registered)!;
  const script = `import {QapApplicationService} from ${JSON.stringify(new URL('../../dist/index.js', import.meta.url).href)}; import {readFileSync} from 'node:fs'; const [app,host,root,registry,ref]=process.argv.slice(1); const s=new QapApplicationService({hostRootDir:app,projectOperationDirectory:host}); const registered=r=>JSON.parse(readFileSync(registry,'utf8')).includes(r); console.log(JSON.stringify([s.getRootAuthorizationReference(root,registered),s.validateRootAuthorizationReference(JSON.parse(ref),registered)])); s.close();`;
  const run = () => JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', script, f.app, f.host, f.a, f.registry, JSON.stringify(ref)], { encoding: 'utf8', windowsHide: true }).trim());
  expect(run()).toEqual([ref, true]);
  f.service.revokeRootAuthorizationGrant(f.a, ref.generation, ref.grant_id);
  expect(run()).toEqual([null, false]);
});
