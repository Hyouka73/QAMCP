import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { EphemeralCredentialProvider } from '@qap/auth';
import { QAP_CAPABILITIES } from '@qap/shared';
import { afterEach, describe, expect, it } from 'vitest';
import YAML from 'yaml';

import { QapApplicationService } from '../application/application-service.js';
import { WorkspaceBootstrap } from '../workspace-bootstrap.js';
import { createMcpServer } from '../server.js';

const tempDirs: string[] = [];
const cleanups: Array<() => Promise<void> | void> = [];

function mkTemp(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

async function openMcpClient(options: {
  service: QapApplicationService;
  projectRoots: string[];
  bootstrap?: WorkspaceBootstrap;
}) {
  const server = createMcpServer({
    projectRoots: options.projectRoots,
    applicationService: options.service,
    workspaceBootstrap: options.bootstrap,
  });
  const client = new Client({ name: 'block1-test-client', version: '1.0.0' }, {});
  const [t1, t2] = InMemoryTransport.createLinkedPair();
  await server.connect(t2);
  await client.connect(t1);
  let closed = false;
  const close = async () => {
    if (!closed) {
      closed = true;
      await client.close();
      await server.close();
    }
  };
  cleanups.push(close);
  const call = async (name: string, args: Record<string, unknown> = {}) => {
    const res = await client.callTool({ name, arguments: args });
    const text = (res.content[0] as { text: string }).text;
    let parsed: Record<string, any> = { message: text };
    try {
      parsed = JSON.parse(text) as Record<string, any>;
    } catch {
      // Unregistered tool fallback returns plain text ("Tool no reconocida: ...")
    }
    return {
      isError: Boolean(res.isError),
      rawText: text,
      data: parsed,
    };
  };
  const listTools = async () => (await client.listTools()).tools.map((t) => t.name);
  return { call, listTools, close };
}

afterEach(async () => {
  for (const fn of cleanups.splice(0).reverse()) {
    await fn();
  }
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('Bloque 1 — Identidad, estado duradero, aislamiento, autoridad y borrado seguro', () => {
  it('replaces contradictory qap_clean with qap_project in published catalog and rejects legacy qap_clean calls', async () => {
    const hostDir = mkTemp('qap-b1-host-');
    const ws = mkTemp('qap-b1-ws-');
    const service = new QapApplicationService({ hostRootDir: hostDir });
    cleanups.push(() => service.close());

    const mcp = await openMcpClient({ service, projectRoots: [ws] });
    const toolNames = await mcp.listTools();
    expect(toolNames).toContain('qap_project');
    expect(toolNames).not.toContain('qap_clean');
    expect(toolNames).toHaveLength(20);

    const legacyClean = await mcp.call('qap_clean', { targetPath: ws, force: true });
    expect(legacyClean.isError).toBe(true);
    expect(legacyClean.rawText).toContain('Tool no reconocida');
    expect(legacyClean.rawText).toContain('qap_clean');
  });

  it('owns project, environment, profile metadata, module, campaign, task, typed progress/decision/recovery across reopen', async () => {
    const hostDir = mkTemp('qap-b1-host-');
    const ws = mkTemp('qap-b1-ws-');
    const credProvider = new EphemeralCredentialProvider();

    const service1 = new QapApplicationService({ hostRootDir: hostDir, credentialProvider: credProvider });
    const created = service1.createProject({
      name: 'Portal Ventas',
      canonicalRoot: ws,
      objective: 'Verificar cobros y sesiones autenticadas',
      baseUrl: 'http://localhost:4100',
      mode: 'investigate_and_test',
    });

    const projectId = created.project.project_id;
    const envId = created.environment!.env_id;
    const campaignId = created.campaign!.campaign_id;

    const profile = service1.upsertProfile({
      projectId,
      envId,
      label: 'qa-admin',
      roleName: 'Administrador',
      loginMode: 'interactive_window',
      status: 'verified',
    });
    const secretSentinel = 'SUPER_SECRET_PASSWORD_BLOCK1_987';
    await service1.storeProfileSecret(projectId, profile.profile_id, {
      username: 'admin@example.test',
      password: secretSentinel,
    });

    const mod = service1.upsertModule({
      projectId,
      key: 'facturacion',
      title: 'Facturación',
      routeHint: '/billing',
      priority: 'high',
      status: 'observed',
    });

    const task = service1.upsertTask({
      projectId,
      campaignId,
      moduleId: mod.module_id,
      kind: 'clarify_business_rule',
      title: 'Confirmar regla de factura vencida',
      status: 'waiting_decision',
      progressCurrent: 1,
      progressTotal: 3,
      progressUnit: 'modules',
      pendingDecision: {
        decision_id: 'dec-1',
        kind: 'oracle',
        capability_required: 'accept',
        prompt: '¿Una factura vencida bloquea nuevas compras?',
        options: [
          { id: 'yes', label: 'Sí, bloquea compras' },
          { id: 'no', label: 'No, solo muestra alerta' },
        ],
        target_entity: { kind: 'module', id: mod.module_id },
        blocking: true,
      },
      recoveryCursor: {
        recoverable: true,
        project_id: projectId,
        campaign_id: campaignId,
        resume_token: 'resume-step-2',
        last_completed_step: 'discover_facturacion',
        interrupted_task_id: 'task-custom-1',
        checkpoint_at: new Date().toISOString(),
        recovery_bundle_available: false,
        tombstone_blocked: false,
      },
    });
    expect(task.status).toBe('waiting_decision');

    // Secret never stored in operational SQLite
    const rawSqlite = readFileSync(join(hostDir, 'app-service.sqlite'));
    expect(rawSqlite.includes(Buffer.from(secretSentinel))).toBe(false);
    expect(await service1.readProfileSecret(projectId, profile.profile_id)).toMatchObject({
      username: 'admin@example.test',
      password: secretSentinel,
    });

    service1.close();

    // Reopen durable SQLite service & check typed contracts via MCP qap_project and qap_status
    const service2 = new QapApplicationService({ hostRootDir: hostDir, credentialProvider: credProvider });
    cleanups.push(() => service2.close());
    const mcp = await openMcpClient({ service: service2, projectRoots: [ws] });

    const resumed = await mcp.call('qap_project', { action: 'resume', project_id: projectId });
    expect(resumed.isError).toBe(false);
    expect(resumed.data.project.project_id).toBe(projectId);
    expect(resumed.data.campaign.campaign_id).toBe(campaignId);
    expect(resumed.data.modules).toHaveLength(1);
    expect(resumed.data.progress).toMatchObject({
      phase: 'ONBOARDING',
      stage: 'clarify_business_rule',
      completed: 1,
      total: 3,
      percent: 33,
    });
    expect(resumed.data.pending_decision).toMatchObject({
      decision_id: 'dec-1',
      kind: 'oracle',
      capability_required: 'accept',
      blocking: true,
    });
    expect(resumed.data.recovery).toMatchObject({
      recoverable: true,
      project_id: projectId,
      resume_token: 'resume-step-2',
      last_completed_step: 'discover_facturacion',
    });

    const status = await mcp.call('qap_status', { targetPath: ws });
    expect(status.isError).toBe(false);
    expect(status.data.application).toMatchObject({
      project_id: projectId,
      campaign_id: campaignId,
      progress: { stage: 'clarify_business_rule', completed: 1, total: 3 },
      pending_decision: { decision_id: 'dec-1' },
      recovery: { resume_token: 'resume-step-2' },
    });
  });

  it('enforces distinct capability permissions (access/login/observe/execute/accept), expiry, and explicit revocation without MCP self-escalation', async () => {
    const hostDir = mkTemp('qap-b1-auth-');
    const ws = mkTemp('qap-b1-ws-');
    const service = new QapApplicationService({ hostRootDir: hostDir });
    cleanups.push(() => service.close());

    const snap = service.createProject({ name: 'Permisos', canonicalRoot: ws, baseUrl: 'http://localhost:5000' });
    const pid = snap.project.project_id;
    const envId = snap.environment!.env_id;

    // Grant access & observe only -> login, execute, accept MUST stay denied
    service.authority.grant({
      project_id: pid,
      capability: 'access',
      scope: { root_path: ws, env_id: envId },
      granted_by: 'host_operator',
    });
    service.authority.grant({
      project_id: pid,
      capability: 'observe',
      scope: { origin: 'http://localhost:5000', env_id: envId },
      granted_by: 'host_operator',
    });

    expect(service.authority.check(pid, 'access', { root_path: ws, env_id: envId }).allowed).toBe(true);
    expect(service.authority.check(pid, 'observe', { origin: 'http://localhost:5000', env_id: envId }).allowed).toBe(true);
    expect(service.authority.check(pid, 'login').allowed).toBe(false);
    expect(service.authority.check(pid, 'execute').allowed).toBe(false);
    expect(service.authority.check(pid, 'accept').allowed).toBe(false);

    // Expiring grant transitions automatically to expired
    const past = new Date(Date.now() - 10_000).toISOString();
    service.authority.grant({
      project_id: pid,
      capability: 'execute',
      scope: { origin: 'http://localhost:5000' },
      granted_by: 'human_gateway',
      expires_at: past,
    });
    const expCheck = service.authority.check(pid, 'execute', { origin: 'http://localhost:5000' });
    expect(expCheck.allowed).toBe(false);
    if (!expCheck.allowed) expect(expCheck.reason).toBe('expired');

    // Non-escalation: MCP qap_project cannot grant capabilities
    const mcp = await openMcpClient({ service, projectRoots: [ws] });
    const badGrant = await mcp.call('qap_project', { action: 'grant', project_id: pid, capabilities: QAP_CAPABILITIES });
    expect(badGrant.isError).toBe(true);
    expect(badGrant.data.code).toBe('invalid_arguments');

    // Explicit MCP revocation invalidates 'observe' while preserving 'access'
    const revokeRes = await mcp.call('qap_project', {
      action: 'revoke_permission',
      project_id: pid,
      capabilities: ['observe'],
      reason: 'Operador retiró observación',
    });
    expect(revokeRes.isError).toBe(false);
    expect(revokeRes.data.revoked_count).toBe(1);
    expect(service.authority.check(pid, 'observe', { origin: 'http://localhost:5000' }).allowed).toBe(false);
    expect(service.authority.check(pid, 'access', { root_path: ws }).allowed).toBe(true);
  });

  it('integrates existing .qa files via versioned, idempotent, secret-redacting, checksum-verifiable import', async () => {
    const hostDir = mkTemp('qap-b1-imp-host-');
    const ws = mkTemp('qap-b1-imp-ws-');
    mkdirSync(join(ws, '.qa', 'project', 'auth'), { recursive: true });
    mkdirSync(join(ws, '.qa', 'modules', 'pagos'), { recursive: true });
    writeFileSync(join(ws, '.qa', 'project', 'context.yaml'), YAML.stringify({
      _version: '1',
      project_name: 'Legacy Imported',
      objective: 'Objetivo legacy verificable',
    }));
    writeFileSync(join(ws, '.qa', 'project', 'environments.yaml'), YAML.stringify({
      _version: '1',
      default: 'staging',
      environments: { staging: { url: 'http://localhost:8085' } },
    }));
    writeFileSync(join(ws, '.qa', 'project', 'lifecycle.json'), JSON.stringify({
      _version: '1',
      phase: 'WORKING',
      session: { id: 'sess-legacy-1', started_at: '2026-10-01T00:00:00Z' },
      modules: { pagos: { state: 'observed' } },
    }));
    writeFileSync(join(ws, '.qa', 'project', 'auth', 'profiles.json'), JSON.stringify({
      profiles: [{ id: 'legacy-admin', env: 'staging', role: 'admin', login_mode: 'auto', password: 'LEAKED_LEGACY_SECRET' }],
    }));
    writeFileSync(join(ws, '.qa', 'modules', 'pagos', 'context.yaml'), YAML.stringify({
      name: 'pagos',
      path: '/pagos',
    }));

    const service = new QapApplicationService({ hostRootDir: hostDir });
    cleanups.push(() => service.close());
    const snap = service.createProject({ name: 'Import Target', canonicalRoot: ws });
    const mcp = await openMcpClient({ service, projectRoots: [ws] });

    const first = await mcp.call('qap_project', { action: 'import_qa', project_id: snap.project.project_id });
    expect(first.isError).toBe(false);
    expect(first.data.receipt.status).toBe('imported');
    expect(first.data.receipt.secrets_redacted).toBeGreaterThanOrEqual(1);
    expect(first.data.receipt.entities_imported.modules).toBe(1);
    expect(first.data.receipt.entities_imported.profiles).toBe(1);

    // Secrets from .qa never enter SQLite
    expect(readFileSync(join(hostDir, 'app-service.sqlite')).includes(Buffer.from('LEAKED_LEGACY_SECRET'))).toBe(false);

    // Idempotent second import
    const second = await mcp.call('qap_project', { action: 'import_qa', project_id: snap.project.project_id });
    expect(second.data.receipt.status).toBe('already_imported');
    expect(second.data.receipt.import_id).toBe(first.data.receipt.import_id);

    // Verify clean checksum integrity
    const verified = await mcp.call('qap_project', { action: 'verify_import', import_id: first.data.receipt.import_id });
    expect(verified.data.verification.valid).toBe(true);
    expect(verified.data.verification.mismatches).toEqual([]);

    // Tamper .qa file -> verification detects mismatch, new import versions cleanly
    writeFileSync(join(ws, '.qa', 'modules', 'pagos', 'context.yaml'), YAML.stringify({ name: 'pagos', path: '/pagos/v2' }));
    const tampered = await mcp.call('qap_project', { action: 'verify_import', import_id: first.data.receipt.import_id });
    expect(tampered.data.verification.valid).toBe(false);
    expect(tampered.data.verification.mismatches[0]).toContain('modified:.qa/modules/pagos/context.yaml');

    const updated = await mcp.call('qap_project', { action: 'import_qa', project_id: snap.project.project_id });
    expect(updated.data.receipt.status).toBe('updated');
  });

  it('isolates two projects A and B: explicit delete of A drains work, revokes access, removes owned files only, preserves A source and B intact, blocks auto-recreation, and supports recovery', async () => {
    const hostDir = mkTemp('qap-b1-iso-host-');
    const bootstrapDir = mkTemp('qap-b1-iso-boot-');
    const wsA = mkTemp('qap-b1-wsA-');
    const wsB = mkTemp('qap-b1-wsB-');

    // Source files & .qa artifacts in workspaces
    mkdirSync(join(wsA, 'src'), { recursive: true });
    mkdirSync(join(wsB, 'src'), { recursive: true });
    writeFileSync(join(wsA, 'src', 'app.ts'), 'export const appA = true;\n');
    writeFileSync(join(wsB, 'src', 'app.ts'), 'export const appB = true;\n');

    const credProvider = new EphemeralCredentialProvider();
    const deletedRoots: string[] = [];
    const service = new QapApplicationService({
      hostRootDir: hostDir,
      credentialProvider: credProvider,
      onProjectDeleted: (_id, root) => deletedRoots.push(root),
    });
    cleanups.push(() => service.close());

    const bootstrap = new WorkspaceBootstrap(bootstrapDir, service);
    cleanups.push(() => bootstrap.close());

    const snapA = service.createProject({ name: 'Proyecto A', canonicalRoot: wsA, baseUrl: 'http://localhost:3001' });
    const snapB = service.createProject({ name: 'Proyecto B', canonicalRoot: wsB, baseUrl: 'http://localhost:3002' });
    const idA = snapA.project.project_id;
    const idB = snapB.project.project_id;

    // Seed knowledge stores, artifacts, credentials, permissions, and live task on A
    const kA = service.openKnowledgeStore(idA);
    const kB = service.openKnowledgeStore(idB);
    expect(kA).not.toBe(kB);

    service.saveManagedArtifact(idA, 'screenshots', 'a-home.png', Buffer.from('PNG_A'));
    service.saveManagedArtifact(idB, 'screenshots', 'b-home.png', Buffer.from('PNG_B'));

    const profA = service.upsertProfile({ projectId: idA, envId: snapA.environment!.env_id, label: 'userA' });
    const profB = service.upsertProfile({ projectId: idB, envId: snapB.environment!.env_id, label: 'userB' });
    await service.storeProfileSecret(idA, profA.profile_id, { username: 'a', password: 'secretA' });
    await service.storeProfileSecret(idB, profB.profile_id, { username: 'b', password: 'secretB' });

    service.authority.grant({ project_id: idA, capability: 'access', scope: { root_path: wsA }, granted_by: 'host' });
    service.authority.grant({ project_id: idA, capability: 'observe', scope: { origin: 'http://localhost:3001' }, granted_by: 'host' });
    service.authority.grant({ project_id: idB, capability: 'access', scope: { root_path: wsB }, granted_by: 'host' });
    service.authority.grant({ project_id: idB, capability: 'execute', scope: { origin: 'http://localhost:3002' }, granted_by: 'host' });

    let abortedA = false;
    const liveController = new AbortController();
    liveController.signal.addEventListener('abort', () => { abortedA = true; });
    service.registerActiveWork(
      idA,
      'live-task-a',
      liveController,
      new Promise((resolvePromise) => {
        liveController.signal.addEventListener('abort', () => resolvePromise('drained'));
      }),
    );

    const mcp = await openMcpClient({ service, projectRoots: [wsA, wsB], bootstrap });

    // Select & list
    const listed = await mcp.call('qap_project', { action: 'list' });
    expect(listed.data.projects.map((p: { project_id: string }) => p.project_id).sort()).toEqual([idA, idB].sort());
    await mcp.call('qap_project', { action: 'select', project_id: idB });

    // Delete preview on A
    const previewRes = await mcp.call('qap_project', { action: 'delete_preview', project_id: idA });
    expect(previewRes.isError).toBe(false);
    expect(previewRes.data.preview.owned_resources.active_grants).toBe(2);
    expect(previewRes.data.preview.owned_resources.managed_artifacts).toBe(1);
    expect(previewRes.data.preview.owned_resources.active_tasks_to_drain).toBeGreaterThanOrEqual(1);
    const token = previewRes.data.preview.confirmation_token as string;

    // Ambiguous / invalid confirmation rejected without deleting
    const wrongConfirm = await mcp.call('qap_project', {
      action: 'delete_confirm',
      project_id: idA,
      confirmation_token: token,
      decision: 'cancel',
    });
    expect(wrongConfirm.isError).toBe(true);
    expect(existsSync(join(hostDir, 'projects', idA))).toBe(true);

    // Explicit delete confirmation succeeds
    const deleted = await mcp.call('qap_project', {
      action: 'delete_confirm',
      project_id: idA,
      confirmation_token: token,
      decision: 'confirm_delete',
    });
    expect(deleted.isError).toBe(false);
    expect(deleted.data).toMatchObject({
      status: 'deleted',
      project_id: idA,
      revoked_grants: 2,
      deleted_credentials: 1,
      auto_recreation_blocked: true,
    });

    // Replay with same single-use token is rejected
    const replay = await mcp.call('qap_project', {
      action: 'delete_confirm',
      project_id: idA,
      confirmation_token: token,
      decision: 'confirm_delete',
    });
    expect(replay.isError).toBe(true);

    // Live work drained, host artifacts purged, permissions & secrets purged, root revoked
    expect(abortedA).toBe(true);
    expect(existsSync(join(hostDir, 'projects', idA))).toBe(false);
    expect(deletedRoots).toEqual([wsA]);
    expect(service.authority.check(idA, 'access', { root_path: wsA }).allowed).toBe(false);
    expect(await credProvider.get({
      projectId: snapA.project.project_id,
      applicationId: snapA.project.application_id,
      environment: snapA.environment!.env_id,
      auth_profile_id: profA.profile_id,
      account: 'userA',
    })).toBeNull();

    // Source files of A intact; Neighbor B completely untouched!
    expect(readFileSync(join(wsA, 'src', 'app.ts'), 'utf8')).toBe('export const appA = true;\n');
    expect(readFileSync(join(wsB, 'src', 'app.ts'), 'utf8')).toBe('export const appB = true;\n');
    expect(existsSync(join(hostDir, 'projects', idB, 'artifacts', 'screenshots', 'b-home.png'))).toBe(true);
    expect(service.authority.check(idB, 'execute', { origin: 'http://localhost:3002' }).allowed).toBe(true);
    expect(await service.readProfileSecret(idB, profB.profile_id)).toMatchObject({ password: 'secretB' });

    // Auto-recreation prevention on A's root via WorkspaceBootstrap & MCP
    await expect(bootstrap.prepare(wsA)).rejects.toMatchObject({ code: 'project_deleted_tombstone' });
    const statusAfterDelete = await mcp.call('qap_status', { targetPath: wsA });
    expect(statusAfterDelete.isError).toBe(true);
    expect(statusAfterDelete.data.code).toBe('project_deleted_tombstone');
    expect(existsSync(join(wsA, '.qa'))).toBe(false);

    // Neighbor B still works cleanly
    const statusB = await mcp.call('qap_status', { targetPath: wsB });
    expect(statusB.isError).toBe(false);
    expect(statusB.data.application.project_id).toBe(idB);

    // Recover A from verified recovery bundle; permissions start revoked cleanly
    const recovered = await mcp.call('qap_project', { action: 'recover', project_id: idA });
    expect(recovered.isError).toBe(false);
    expect(recovered.data).toMatchObject({
      status: 'recovered',
      project_id: idA,
      capabilities_reset_to_revoked: true,
    });
    expect(service.authority.check(idA, 'access', { root_path: wsA }).allowed).toBe(false);
    expect(service.findActiveProjectByRoot(wsA)?.project_id).toBe(idA);
  });
});
