import { spawn, type ChildProcess } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, expect, it, vi } from 'vitest';
import { QapApplicationService } from '../application/application-service.js';
import { acquireProjectOperation, withProjectOperation } from '../project-reset.js';
import { WorkspaceBootstrap } from '../workspace-bootstrap.js';
import { ContextHandler } from '../handlers/context.handler.js';
import { ReportHandler } from '../handlers/report.handler.js';
import { FileSystemStorage } from '@qap/knowledge';

vi.setConfig({ testTimeout: 20000 });

const cleanups: (() => void | Promise<void>)[] = [];
afterEach(async () => { for (const cleanup of cleanups.splice(0).reverse()) await cleanup(); });
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'qap-coordinator-'));
  cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
  const host = join(dir, 'host'), app = join(dir, 'application'), a = join(dir, 'a'), b = join(dir, 'b');
  mkdirSync(a); mkdirSync(b);
  const service = new QapApplicationService({ hostRootDir: app, projectOperationDirectory: host });
  cleanups.push(() => service.close());
  // Explicit trusted setup: JSON alone no longer supplies root authority.
  const registered: string[] = [];
  for (const root of [a, b]) service.publishRootAuthorization(root, randomUUID(), () => {
    registered.push(root); writeFileSync(join(host, 'authorized-roots.json'), JSON.stringify(registered));
  }, () => {});
  const projectA = service.createProject({ name: 'A', canonicalRoot: a }).project;
  const projectB = service.createProject({ name: 'B', canonicalRoot: b }).project;
  const grantA = service.authority.grant({ project_id: projectA.project_id, capability: 'access', granted_by: 'test' });
  const grantB = service.authority.grant({ project_id: projectB.project_id, capability: 'access', granted_by: 'test' });
  return { dir, host, app, a, b, service, projectA, projectB, grantA, grantB };
}
type Message = { event: string; code?: string; result?: unknown };
function next(child: ChildProcess): Promise<Message> {
  return new Promise((accept, reject) => {
    const timeout = setTimeout(() => finish(new Error('IPC barrier timed out')), 10000);
    const onMessage = (message: Message) => { clearTimeout(timeout); child.off('exit', onExit); accept(message); };
    const onExit = () => finish(new Error('Child exited before IPC barrier'));
    function finish(error: Error) { clearTimeout(timeout); child.off('message', onMessage); child.off('exit', onExit); reject(error); }
    child.once('message', onMessage); child.once('exit', onExit);
  });
}
async function worker(f: ReturnType<typeof fixture>) {
  const child = spawn(process.execPath, [fileURLToPath(new URL('./fixtures/project-operation-worker.mjs', import.meta.url))], {
    env: { ...process.env, OPERATION_TEST_MODULE: resolve('dist/index.js'), OPERATION_TEST_APP: f.app, OPERATION_TEST_HOST: f.host },
    stdio: ['ignore', 'ignore', 'pipe', 'ipc'], windowsHide: true,
  });
  cleanups.push(async () => {
    if (child.exitCode !== null || child.signalCode !== null) return;
    const exited = new Promise<void>(done => child.once('exit', () => done()));
    child.kill(); await exited;
  });
  expect(await next(child)).toEqual({ event: 'ready' });
  return child;
}
async function command(child: ChildProcess, message: object | string) {
  const response = next(child); child.send(message); return response;
}

it('does not publish context after access is revoked by another process during a real continuation', async () => {
  const f = fixture();
  const bootstrap = new WorkspaceBootstrap(f.host, f.service);
  cleanups.push(() => bootstrap.close());
  const bound = (await bootstrap.prepare(f.a, 'https://example.invalid/'))!;
  const original = bound.store;
  let resume!: () => void;
  let entered!: () => void;
  const held = new Promise<void>(done => { entered = done; });
  const gate = new Promise<void>(done => { resume = done; });
  let first = true;
  const store = new Proxy(original, { get(target, property) {
    const value = Reflect.get(target, property, target);
    if (property === 'get') return async (...args: Parameters<typeof original.get>) => {
      if (first) { first = false; entered(); await gate; }
      return original.get(...args);
    };
    return typeof value === 'function' ? value.bind(target) : value;
  } });
  const admitted = { ...bound, store };
  const contextPath = join(f.a, '.qa', 'project', 'context.yaml');
  const before = readFileSync(contextPath, 'utf8');
  const beforeProject = f.service.resumeProject(f.projectA.project_id);
  const handler = new ContextHandler({ projectRoots: [f.a], applicationService: f.service, knowledgeBindings: [admitted], validateKnowledgeBinding: b => bootstrap.validateBinding(b) });
  const pending = handler.execute({ targetPath: f.a, objective: 'A revocation must prevent this objective' }, { requestId: 'barrier', signal: new AbortController().signal });
  await held;
  const child = await worker(f);
  expect((await command(child, { action: 'revoke', project: f.projectA.project_id, grant: f.grantA.grant_id })).event).toBe('done');
  f.service.authority.grant({ project_id: f.projectA.project_id, capability: 'access', granted_by: 'replacement' });
  resume();
  expect((await pending).isError).toBe(true);
  expect(readFileSync(contextPath, 'utf8')).toBe(before);
  expect(f.service.resumeProject(f.projectA.project_id).project).toEqual(beforeProject.project);
});

it('publishes context with the original authority still active', async () => {
  const f = fixture();
  const bootstrap = new WorkspaceBootstrap(f.host, f.service);
  cleanups.push(() => bootstrap.close());
  const admitted = (await bootstrap.prepare(f.a, 'https://example.invalid/'))!;
  const handler = new ContextHandler({ projectRoots: [f.a], applicationService: f.service, knowledgeBindings: [admitted], validateKnowledgeBinding: b => bootstrap.validateBinding(b) });
  const response = await handler.execute({ targetPath: f.a, objective: 'An authorized persistent objective for context' }, { requestId: 'positive', signal: new AbortController().signal });
  expect(response.isError).not.toBe(true);
  expect(readFileSync(join(f.a, '.qa', 'project', 'context.yaml'), 'utf8')).toContain('An authorized persistent objective for context');
});

it('does not publish a report after another process revokes access during evidence reading', async () => {
  const f = fixture();
  const bootstrap = new WorkspaceBootstrap(f.host, f.service);
  cleanups.push(() => { vi.restoreAllMocks(); bootstrap.close(); });
  const admitted = (await bootstrap.prepare(f.a, 'https://example.invalid/'))!;
  const storage = new FileSystemStorage({ rootDir: f.a });
  const execution = { _version: '1' as const, execution_id: 'exec_barrier', module: 'checkout', env: 'local',
    started_at: '2026-11-02T15:00:00.000Z', finished_at: '2026-11-02T15:00:00.000Z', result: 'passed' as const,
    timed_out: false, summary: { total: 1, passed: 1, failed: 0, skipped: 0, not_run: 0 },
    cases: [{ id: 'TC-001', title: 'Valid test', result: 'passed' as const, duration_ms: 12 }] };
  await storage.saveExecutionResult(execution.execution_id, execution);
  const original = FileSystemStorage.prototype.getExecutionResult;
  let resume!: () => void;
  let entered!: () => void;
  const held = new Promise<void>(done => { entered = done; });
  const gate = new Promise<void>(done => { resume = done; });
  vi.spyOn(FileSystemStorage.prototype, 'getExecutionResult').mockImplementation(async function (this: FileSystemStorage, id) {
    const value = await original.call(this, id); entered(); await gate; return value;
  });
  const handler = new ReportHandler({ projectRoots: [f.a], applicationService: f.service, knowledgeBindings: [admitted], validateKnowledgeBinding: b => bootstrap.validateBinding(b) });
  const pending = handler.execute({ targetPath: f.a, executionId: execution.execution_id, format: 'json' }, { requestId: 'report-barrier', signal: new AbortController().signal });
  await held;
  const child = await worker(f);
  expect((await command(child, { action: 'revoke', project: f.projectA.project_id, grant: f.grantA.grant_id })).event).toBe('done');
  resume();
  expect((await pending).isError).toBe(true);
  expect(existsSync(join(f.a, '.qa', 'executions', 'exec_barrier.report.json'))).toBe(false);
  expect(f.service.listRecoverablePublications(f.projectA.project_id)).toHaveLength(0);
});

it('revocation first rejects subsequent bootstrap before publishing local effects; B remains usable', async () => {
  const f = fixture(), revoke = await worker(f), publish = await worker(f);
  expect((await command(revoke, { action: 'revoke', project: f.projectA.project_id, grant: f.grantA.grant_id })).event).toBe('done');
  expect(await command(publish, { action: 'prepare', root: f.a })).toMatchObject({ event: 'error', code: 'capability_access_revoked' });
  expect(existsSync(join(f.a, '.qa'))).toBe(false);
  expect((await command(publish, { action: 'prepare', root: f.b })).event).toBe('done');
  expect(f.service.authority.check(f.projectB.project_id, 'access').allowed).toBe(true);
});

it('bootstrap first keeps direct ApplicationService revocation outside the publication barrier', async () => {
  const f = fixture(), publish = await worker(f), revoke = await worker(f);
  expect(await command(publish, { action: 'publish', root: f.a })).toEqual({ event: 'publication-held' });
  expect(await command(revoke, { action: 'revoke', project: f.projectA.project_id, grant: f.grantA.grant_id }))
    .toMatchObject({ event: 'error', code: 'project_storage_busy' });
  expect(await command(revoke, { action: 'grant', project: f.projectA.project_id }))
    .toMatchObject({ event: 'error', code: 'project_storage_busy' });
  expect(f.service.authority.listGrants(f.projectA.project_id)[0].status).toBe('active');
  expect(await command(publish, 'release')).toMatchObject({ event: 'done', result: true });
  expect((await command(revoke, { action: 'revoke', project: f.projectA.project_id, grant: f.grantA.grant_id })).event).toBe('done');
});

it('holds root grant revocation outside the protected bootstrap publication in another process', async () => {
  const f = fixture(), publish = await worker(f), revoke = await worker(f);
  const ref = f.service.getRootAuthorizationReference(f.a, () => true)!;
  expect(await command(publish, { action: 'publish', root: f.a })).toEqual({ event: 'publication-held' });
  expect(await command(revoke, { action: 'revoke-root', root: f.a, generation: ref.generation, grant: ref.grant_id }))
    .toMatchObject({ event: 'error', code: 'project_storage_busy' });
  expect(await command(publish, 'release')).toMatchObject({ event: 'done', result: true });
  expect(existsSync(join(f.a, '.qa', 'project', 'context.yaml'))).toBe(true);
  expect((await command(revoke, { action: 'revoke-root', root: f.a, generation: ref.generation, grant: ref.grant_id })).result).toBe(true);
  expect(f.service.validateRootAuthorizationReference(ref, () => true)).toBe(false);
});

it('process termination releases the gate and project B stays operational', async () => {
  const f = fixture(), owner = await worker(f), other = await worker(f);
  expect(await command(owner, { action: 'hold' })).toEqual({ event: 'held' });
  expect(await command(other, { action: 'revoke', project: f.projectA.project_id, grant: f.grantA.grant_id }))
    .toMatchObject({ code: 'project_storage_busy' });
  const exited = new Promise(resolveExit => owner.once('exit', resolveExit)); owner.kill(); await exited;
  expect((await command(other, { action: 'revoke', project: f.projectA.project_id, grant: f.grantA.grant_id })).event).toBe('done');
  expect((await command(other, { action: 'prepare', root: f.b })).event).toBe('done');
});

it('nested local APIs reuse ownership; forged, wrong-domain and released contexts fail', async () => {
  const f = fixture(), bootstrap = new WorkspaceBootstrap(f.host, f.service);
  cleanups.push(() => bootstrap.close());
  await f.service.withProjectOperation(async () => {
    await bootstrap.prepare(f.a, 'https://example.invalid/');
    expect(f.service.authority.revokeGrant(f.projectA.project_id, f.grantB.grant_id)).toBeNull();
    expect(f.service.authority.check(f.projectB.project_id, 'access').allowed).toBe(true);
  });
  const release = acquireProjectOperation(f.host), context = release.context;
  expect(() => withProjectOperation(f.host, () => {}, {} as typeof context)).toThrow('project_operation_context_invalid');
  expect(() => withProjectOperation(f.app, () => {}, context)).toThrow('project_operation_context_invalid');
  release();
  expect(() => withProjectOperation(f.host, () => {}, context)).toThrow('project_operation_context_invalid');
  await expect(withProjectOperation(f.host, async () => { throw Error('injected publication failure'); })).rejects.toThrow('injected');
  withProjectOperation(f.host, () => {});
});

it('direct root revocation coordinates; stale generation is rejected in another process', async () => {
  const f = fixture();
  const preview = f.service.previewDelete(f.projectA.project_id);
  await f.service.confirmDelete(f.projectA.project_id, preview.confirmation_token, 'confirm_delete');
  const epoch = f.service.getRootDeletionState(f.a);
  if (!epoch || epoch.version !== 1) throw Error('missing generation');
  f.service.completeRootDeletionCleanup(f.a, epoch.generation);
  const grant = randomUUID();
  f.service.recordRootAuthorizationGrant({ canonicalRoot: f.a, generation: epoch.generation, grantId: grant, mechanism: 'local_operator_helper' });
  const child = await worker(f), release = acquireProjectOperation(f.host);
  try {
    expect(await command(child, { action: 'revoke-root', root: f.a, generation: epoch.generation, grant }))
      .toMatchObject({ code: 'project_storage_busy' });
  } finally { release(); }
  expect(await command(child, { action: 'record-root', root: f.a, generation: randomUUID(), grant: randomUUID() }))
    .toMatchObject({ code: 'root_authorization_generation_unavailable' });
  expect((await command(child, { action: 'revoke-root', root: f.a, generation: epoch.generation, grant })).event).toBe('done');
});

it('pins one persistent host domain and rejects contradictory attachments', () => {
  const f = fixture();
  expect(() => new WorkspaceBootstrap(join(f.dir, 'other-host'), f.service)).toThrow('project_operation_domain_mismatch');
  const second = new QapApplicationService({ hostRootDir: f.app });
  try { expect(second.projectOperationDirectory).toBe(f.service.projectOperationDirectory); }
  finally { second.close(); }
});

it('root revocation first blocks bootstrap after recovery without recreating local effects', async () => {
  const f = fixture(), preview = f.service.previewDelete(f.projectA.project_id);
  await f.service.confirmDelete(f.projectA.project_id, preview.confirmation_token, 'confirm_delete');
  const epoch = f.service.getRootDeletionState(f.a);
  if (!epoch || epoch.version !== 1) throw Error('missing generation');
  f.service.completeRootDeletionCleanup(f.a, epoch.generation);
  const grant = randomUUID();
  f.service.publishRootAuthorization(f.a, grant,
    () => writeFileSync(join(f.host, 'authorized-roots.json'), JSON.stringify([f.a, f.b])), () => {});
  f.service.recoverDeletedProject(f.projectA.project_id);
  f.service.authority.grant({ project_id: f.projectA.project_id, capability: 'access', granted_by: 'test' });
  const revoke = await worker(f), publish = await worker(f);
  expect((await command(revoke, { action: 'revoke-root', root: f.a, generation: epoch.generation, grant })).event).toBe('done');
  expect(await command(publish, { action: 'prepare', root: f.a }))
    .toMatchObject({ event: 'error', code: 'workspace_persistent_authority_required' });
  expect(existsSync(join(f.a, '.qa'))).toBe(false);
  expect((await command(publish, { action: 'prepare', root: f.b })).event).toBe('done');
});
