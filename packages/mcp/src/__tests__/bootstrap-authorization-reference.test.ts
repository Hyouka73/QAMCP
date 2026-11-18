import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, expect, it, vi } from 'vitest';
import { QapApplicationService } from '../application/application-service.js';
import { WorkspaceBootstrap } from '../workspace-bootstrap.js';

vi.setConfig({ testTimeout: 30000 });
const cleanup: (() => void)[] = [];
afterEach(() => { for (const f of cleanup.splice(0).reverse()) f(); });
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'qap-bootstrap-reference-'));
  cleanup.push(() => rmSync(dir, { recursive: true, force: true }));
  const app = join(dir, 'app'), host = join(dir, 'host'), a = join(dir, 'a'), b = join(dir, 'b');
  mkdirSync(a); mkdirSync(b);
  const service = new QapApplicationService({ hostRootDir: app, projectOperationDirectory: host });
  cleanup.push(() => service.close());
  const bootstrap = new WorkspaceBootstrap(host, service); cleanup.push(() => bootstrap.close());
  const helper = (root: string) => execFileSync(process.execPath, [resolve('../../scripts/qap-authorize-workspace.mjs'), root], {
    env: { ...process.env, QAP_MCP_APP_SERVICE_DIR: app, QAP_MCP_WORKSPACE_HOST_DIR: host }, windowsHide: true, stdio: 'pipe', timeout: 15000,
  });
  return { a, b, host, service, bootstrap, helper };
}

it('binds the explicit initial grant and rejects G1 after revocation even with G2', async () => {
  const f = fixture(); f.helper(f.a); f.helper(f.b);
  const a = (await f.bootstrap.prepare(f.a, 'https://example.invalid/'))!;
  const b = (await f.bootstrap.prepare(f.b, 'https://example.invalid/'))!;
  expect(a.rootAuthorization).toMatchObject({ canonical_root: f.a, coordination_domain: f.host });
  expect(f.bootstrap.validateBinding(a)).toBe(true);
  expect(f.bootstrap.validateBinding({ ...a, rootAuthorization: undefined })).toBe(false);
  const g1 = a.rootAuthorization!;
  f.service.revokeRootAuthorizationGrant(f.a, g1.generation, g1.grant_id);
  f.helper(f.a);
  expect(f.bootstrap.validateBinding(a)).toBe(false);
  expect(f.bootstrap.validateBinding(b)).toBe(true);
  expect(existsSync(join(f.a, '.qa', 'project', 'context.yaml'))).toBe(true);
  expect(existsSync(join(f.b, '.qa', 'project', 'context.yaml'))).toBe(true);
  expect(a.store).not.toBe(b.store);
  expect(await a.store.get(a.applicationId, 'application', a.applicationId)).toBeTruthy();
  expect(await b.store.get(b.applicationId, 'application', b.applicationId)).toBeTruthy();
});

it('rejects a queued admission revoked before its first effect despite a replacement grant', async () => {
  const f = fixture(); f.helper(f.a);
  const pending = f.bootstrap.prepare(f.a, 'https://example.invalid/');
  const ref = f.service.getRootAuthorizationReference(f.a, () => true)!;
  f.service.revokeRootAuthorizationGrant(f.a, ref.generation, ref.grant_id);
  f.helper(f.a);
  await expect(pending).rejects.toMatchObject({ code: 'workspace_persistent_authority_required' });
  expect(existsSync(join(f.a, '.qa'))).toBe(false);
  expect(f.bootstrap.hasKnowledge(f.a)).toBe(false);
});

it('does not create Knowledge or files from JSON alone', async () => {
  const f = fixture(); writeFileSync(join(f.host, 'authorized-roots.json'), JSON.stringify([f.a]));
  await expect(f.bootstrap.prepare(f.a, 'https://example.invalid/')).rejects.toMatchObject({ code: 'workspace_persistent_authority_required' });
  expect(existsSync(join(f.a, '.qa'))).toBe(false);
  expect(f.bootstrap.hasKnowledge(f.a)).toBe(false);
});

it('invalidates a binding after a deletion advances the root generation', async () => {
  const f = fixture(); f.helper(f.a);
  const binding = (await f.bootstrap.prepare(f.a, 'https://example.invalid/'))!;
  const project = f.service.findActiveProjectByRoot(f.a)!;
  const preview = f.service.previewDelete(project.project_id);
  await f.service.confirmDelete(project.project_id, preview.confirmation_token, 'confirm_delete');
  const state = f.service.getRootDeletionState(f.a)!;
  if (state.version !== 1) throw Error('missing deletion generation');
  f.service.completeRootDeletionCleanup(f.a, state.generation);
  f.helper(f.a);
  expect(f.bootstrap.validateBinding(binding)).toBe(false);
});

it('does not regrant revoked application access on preparation', async () => {
  const f = fixture(); f.helper(f.a);
  await f.bootstrap.prepare(f.a, 'https://example.invalid/');
  const project = f.service.findActiveProjectByRoot(f.a)!;
  const grant = f.service.authority.listGrants(project.project_id).find(g => g.capability === 'access')!;
  f.service.authority.revokeGrant(project.project_id, grant.grant_id);
  await expect(f.bootstrap.prepare(f.a, 'https://example.invalid/')).rejects.toMatchObject({ code: 'capability_access_revoked' });
  expect(f.service.authority.listGrants(project.project_id).filter(g => g.capability === 'access')).toHaveLength(1);
});

it('recovers abandoned publications only when the authorized project is reopened', async () => {
  const f = fixture(); f.helper(f.a); f.helper(f.b);
  await f.bootstrap.prepare(f.a, 'https://example.invalid/');
  await f.bootstrap.prepare(f.b, 'https://example.invalid/');
  const dead = spawnSync(process.execPath, ['-e', '']);
  expect(dead.status).toBe(0);
  const seed = (root: string) => {
    const run = join(root, '.qa', 'runtime', 'runs', 'interrupted');
    mkdirSync(run, { recursive: true });
    writeFileSync(join(run, '.qap-publication-pending'), JSON.stringify({ operationId: 'qap-provisional-test123', runId: 'interrupted', pid: dead.pid }));
    writeFileSync(join(run, 'run.json'), '{}');
    return run;
  };
  const aRun = seed(f.a), bRun = seed(f.b);
  const restarted = new WorkspaceBootstrap(f.host, f.service);
  try {
    await restarted.prepare(f.a);
    expect(existsSync(aRun)).toBe(false);
    expect(existsSync(bRun)).toBe(true);
    await restarted.prepare(f.a);
    expect(existsSync(aRun)).toBe(false);
    expect(existsSync(bRun)).toBe(true);
  } finally { restarted.close(); }
});
