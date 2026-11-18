import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { EphemeralCredentialProvider } from '@qap/auth';
import { QAP_CAPABILITIES } from '@qap/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';

const registryFault = vi.hoisted(() => ({ path: '' }));
vi.mock('../application/safe-storage.js', async importOriginal => {
  const original = await importOriginal<typeof import('../application/safe-storage.js')>();
  return { ...original, atomicWritePrivateFile: (...args: Parameters<typeof original.atomicWritePrivateFile>) => {
    if (args[0] === registryFault.path) throw new Error('injected registry write failure');
    return original.atomicWritePrivateFile(...args);
  } };
});
import YAML from 'yaml';

import { QapApplicationService } from '../application/application-service.js';
import { WorkspaceBootstrap } from '../workspace-bootstrap.js';
import { createMcpServer, type McpServerOptions } from '../server.js';

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
  knowledgeBindings?: McpServerOptions['knowledgeBindings'];
  hostRegistryPath?: string;
}) {
  const server = createMcpServer({
    projectRoots: options.projectRoots,
    applicationService: options.service,
    workspaceBootstrap: options.bootstrap,
    knowledgeBindings: options.knowledgeBindings,
    hostRegistryPath: options.hostRegistryPath,
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
  it('scopes individual MCP revocation to the requested project and preserves persisted rows on retries', async () => {
    const hostDir = mkTemp('qap-revoke-host-');
    const rootA = mkTemp('qap-revoke-a-');
    const rootB = mkTemp('qap-revoke-b-');
    const operationDir = join(hostDir, 'operations');
    mkdirSync(operationDir);
    const service = new QapApplicationService({ hostRootDir: hostDir, projectOperationDirectory: operationDir });
    cleanups.push(() => service.close());
    const a = service.createProject({ name: 'A', canonicalRoot: rootA }).project.project_id;
    const b = service.createProject({ name: 'B', canonicalRoot: rootB }).project.project_id;
    for (const root of [rootA, rootB]) execFileSync(process.execPath,
      [join(process.cwd(), '..', '..', 'scripts', 'qap-authorize-workspace.mjs'), root],
      { env: { ...process.env, QAP_MCP_WORKSPACE_HOST_DIR: operationDir, QAP_MCP_APP_SERVICE_DIR: hostDir }, timeout: 12000, windowsHide: true });
    service.authority.grant({ project_id: a, capability: 'access', scope: { root_path: rootA }, granted_by: 'host' });
    service.authority.grant({ project_id: b, capability: 'access', scope: { root_path: rootB }, granted_by: 'host' });
    const grantA = service.authority.grant({ project_id: a, capability: 'observe', granted_by: 'host' });
    const grantB = service.authority.grant({ project_id: b, capability: 'observe', granted_by: 'host' });
    const db = new DatabaseSync(join(service.artifacts.rootDir, 'app-service.sqlite'));
    cleanups.push(() => db.close());
    const row = (id: string) => db.prepare('SELECT * FROM permission_grants WHERE grant_id = ?').get(id);
    const beforeA = row(grantA.grant_id);
    const beforeB = row(grantB.grant_id);
    const mcp = await openMcpClient({ service, projectRoots: [rootA, rootB], hostRegistryPath: join(operationDir, 'authorized-roots.json') });
    const revoke = (grantId: string, reason = 'first') => mcp.call('qap_project', {
      action: 'revoke_permission', project_id: a, grant_id: grantId, reason,
    });

    const foreign = await revoke(grantB.grant_id);
    const missing = await revoke('missing-grant');
    expect(foreign.data.code).toBe('grant_not_found');
    expect(missing.data.code).toBe('grant_not_found');
    expect(foreign.data).toEqual(missing.data);
    expect(row(grantB.grant_id)).toEqual(beforeB);
    expect(row(grantA.grant_id)).toEqual(beforeA);

    const own = await revoke(grantA.grant_id);
    expect(own.data.status).toBe('success');
    expect(own.data.revoked_grant.status).toBe('revoked');
    const after = row(grantA.grant_id);
    expect(after).toMatchObject({ status: 'revoked', revoked_reason: 'first' });
    const retry = await revoke(grantA.grant_id, 'retry');
    expect(retry.data.status).toBe('success');
    expect(row(grantA.grant_id)).toEqual(after);
    expect(row(grantB.grant_id)).toEqual(beforeB);

    const concurrent = service.authority.grant({ project_id: a, capability: 'execute', granted_by: 'host' });
    const beforeConcurrent = row(concurrent.grant_id);
    expect(beforeConcurrent).toMatchObject({ status: 'active', revoked_at: null, revoked_reason: null });
    const attempts = await Promise.all([
      revoke(concurrent.grant_id, 'concurrent-one'),
      revoke(concurrent.grant_id, 'concurrent-two'),
    ]);
    const afterConcurrent = row(concurrent.grant_id);
    expect(afterConcurrent).toMatchObject({ status: 'revoked' });
    expect(['concurrent-one', 'concurrent-two']).toContain(afterConcurrent?.revoked_reason);
    for (const attempt of attempts) {
      expect(attempt.data.status).toBe('success');
      expect(attempt.data.revoked_grant.revoked_reason).toBe(afterConcurrent?.revoked_reason);
      expect(attempt.data.revoked_grant.revoked_at).toBe(afterConcurrent?.revoked_at);
    }
    expect(row(grantB.grant_id)).toEqual(beforeB);
  }, 20000);
  it('replaces contradictory qap_clean with qap_project in published catalog and rejects legacy qap_clean calls', async () => {
    const hostDir = mkTemp('qap-b1-host-');
    const ws = mkTemp('qap-b1-ws-');
    const service = new QapApplicationService({ hostRootDir: hostDir });
    cleanups.push(() => service.close());

    const mcp = await openMcpClient({ service, projectRoots: [ws] });
    const toolNames = await mcp.listTools();
    expect(toolNames).toContain('qap_project');
    expect(toolNames).not.toContain('qap_clean');
    expect(toolNames).toHaveLength(21);

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
    const operationDir = join(hostDir, 'operations');
    mkdirSync(operationDir);
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

    const service = new QapApplicationService({ hostRootDir: hostDir, projectOperationDirectory: operationDir });
    cleanups.push(() => service.close());
    const snap = service.createProject({ name: 'Import Target', canonicalRoot: ws });
    execFileSync(process.execPath, [join(process.cwd(), '..', '..', 'scripts', 'qap-authorize-workspace.mjs'), ws],
      { env: { ...process.env, QAP_MCP_WORKSPACE_HOST_DIR: operationDir, QAP_MCP_APP_SERVICE_DIR: hostDir }, timeout: 12000, windowsHide: true });
    service.authority.grant({ project_id: snap.project.project_id, capability: 'access', scope: { root_path: ws }, granted_by: 'host' });
    const mcp = await openMcpClient({ service, projectRoots: [ws], hostRegistryPath: join(operationDir, 'authorized-roots.json') });

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
  }, 20000);

  it('rejects adversarial capability methods and isolates revocations', () => {
    const service = new QapApplicationService({ hostRootDir: mkTemp('qap-enc-authority-') });
    cleanups.push(() => service.close());
    const a = service.createProject({ name: 'A', canonicalRoot: mkTemp('qap-enc-a-') });
    const b = service.createProject({ name: 'B', canonicalRoot: mkTemp('qap-enc-b-') });
    for (const project of [a, b]) service.authority.grant({ project_id: project.project.project_id, capability: 'execute', granted_by: 'test', policy_hash: 'test' });
    const caps = ['execute'] as any;
    caps.map = () => ({ join: () => '?) OR 1=1 --' });
    expect(service.authority.revokeProjectAccess(a.project.project_id, 'test', caps)).toBe(1);
    expect(service.authority.listGrants(a.project.project_id).filter(g => g.capability === 'execute')[0].status).toBe('revoked');
    expect(service.authority.listGrants(b.project.project_id).filter(g => g.capability === 'execute')[0].status).toBe('active');
  });

  it('removes deleted roots from the persistent registry across subsequent calls', async () => {
    const host = mkTemp('qap-enc-reg-host-'), rootA = mkTemp('qap-enc-reg-a-'), rootB = mkTemp('qap-enc-reg-b-');
    const registry = join(host, 'roots.json');
    writeFileSync(registry, JSON.stringify([rootA, rootB]));
    const service = new QapApplicationService({ hostRootDir: host });
    cleanups.push(() => service.close());
    const a = service.createProject({ name: 'A', canonicalRoot: rootA });
    service.createProject({ name: 'B', canonicalRoot: rootB });
    const mcp = await openMcpClient({ service, projectRoots: [], hostRegistryPath: registry });
    const preview = await mcp.call('qap_project', { action: 'delete_preview', project_id: a.project.project_id, targetPath: rootA });
    const deleted = await mcp.call('qap_project', { action: 'delete_confirm', project_id: a.project.project_id, targetPath: rootA,
      confirmation_token: preview.data.preview.confirmation_token, decision: 'confirm_delete' });
    expect(deleted.data.status).toBe('deleted');
    expect(JSON.parse(readFileSync(registry, 'utf8'))).toEqual([rootB]);
    expect((await mcp.call('qap_status', { targetPath: rootA })).isError).toBe(true);
    expect((await mcp.call('qap_status', { targetPath: rootB })).isError).toBe(false);
  });

  it('reconciles a failed registry write while keeping A blocked and B intact', async () => {
    const host = mkTemp('qap-reconcile-host-'), rootA = mkTemp('qap-reconcile-a-'), rootB = mkTemp('qap-reconcile-b-');
    const registry = join(host, 'roots.json');
    writeFileSync(registry, JSON.stringify([rootA, rootB]));
    const service = new QapApplicationService({ hostRootDir: host });
    cleanups.push(() => service.close());
    const a = service.createProject({ name: 'A', canonicalRoot: rootA });
    const b = service.createProject({ name: 'B', canonicalRoot: rootB });
    const mcp = await openMcpClient({ service, projectRoots: [rootA, rootB], hostRegistryPath: registry,
      knowledgeBindings: [
        { projectRoot: rootA, applicationId: a.project.application_id, environmentId: a.environment!.env_id, store: service.openKnowledgeStore(a.project.project_id) },
        { projectRoot: rootB, applicationId: b.project.application_id, environmentId: b.environment!.env_id, store: service.openKnowledgeStore(b.project.project_id) },
      ] });
    const preview = await mcp.call('qap_project', { action: 'delete_preview', project_id: a.project.project_id });
    const args = { action: 'delete_confirm', project_id: a.project.project_id, confirmation_token: preview.data.preview.confirmation_token, decision: 'confirm_delete' };
    registryFault.path = registry;
    try {
      expect((await mcp.call('qap_project', args)).data.code).toBe('project_delete_registry_cleanup_failed');
      expect(service.getDeletedProjectRoot(a.project.project_id)).toBe(rootA);
      expect((await mcp.call('qap_status', { targetPath: rootA })).isError).toBe(true);
      expect((await mcp.call('qap_project', { action: 'recover', project_id: a.project.project_id })).data.status).toBe('blocked');
      expect((await mcp.call('qap_project', { ...args, confirmation_token: 'invalid' })).data.status).toBe('blocked');
      expect((await mcp.call('qap_status', { targetPath: rootB })).data.knowledge.state).toBe('incompatible');
    } finally { registryFault.path = ''; }
    // A later request reconciles the durable tombstone after the registry is repaired.
    expect((await mcp.call('qap_status', { targetPath: rootA })).isError).toBe(true);
    expect(JSON.parse(readFileSync(registry, 'utf8'))).toEqual([rootB]);
    expect((await mcp.call('qap_project', { action: 'recover', project_id: a.project.project_id })).data.status).toBe('recovered');
    writeFileSync(registry, JSON.stringify([rootA, rootB]));
    expect((await mcp.call('qap_status', { targetPath: rootA })).data.knowledge.state).toBe('unbound');
    expect((await mcp.call('qap_status', { targetPath: rootB })).data.knowledge.state).toBe('incompatible');
  });

  it.each(['before-binding-removal', 'registry-still-present', 'registry-already-updated'])(
    'reconciles tombstones and bindings across independent server instances: %s', async stage => {
      const host = mkTemp('qap-restart-host-'), rootA = mkTemp('qap-restart-a-'), rootB = mkTemp('qap-restart-b-');
      const registry = join(host, 'roots.json');
      writeFileSync(registry, JSON.stringify([rootA, rootB]));
      let service = new QapApplicationService({ hostRootDir: host });
      const a = service.createProject({ name: 'A', canonicalRoot: rootA });
      const b = service.createProject({ name: 'B', canonicalRoot: rootB });
      const bindings = (current: QapApplicationService) => [
        { projectRoot: rootA, applicationId: a.project.application_id, environmentId: a.environment!.env_id, store: current.openKnowledgeStore(a.project.project_id) },
        { projectRoot: rootB, applicationId: b.project.application_id, environmentId: b.environment!.env_id, store: current.openKnowledgeStore(b.project.project_id) },
      ];
      const first = await openMcpClient({ service, projectRoots: [rootA, rootB], hostRegistryPath: registry, knowledgeBindings: bindings(service) });
      const preview = await first.call('qap_project', { action: 'delete_preview', project_id: a.project.project_id });
      const args = { action: 'delete_confirm', project_id: a.project.project_id, confirmation_token: preview.data.preview.confirmation_token, decision: 'confirm_delete' };
      const lookupFault = stage === 'before-binding-removal'
        ? vi.spyOn(service, 'getDeletedProjectRoot').mockImplementationOnce(() => { throw new Error('injected interruption'); })
        : undefined;
      if (!lookupFault) registryFault.path = registry;
      try {
        expect((await first.call('qap_project', args)).data.code).toBe('project_delete_registry_cleanup_failed');
      } finally { registryFault.path = ''; lookupFault?.mockRestore(); }
      expect(service.getDeletedProjectRoot(a.project.project_id)).toBe(rootA);
      await first.close(); service.close();
      if (stage === 'registry-already-updated') writeFileSync(registry, JSON.stringify([rootB]));
      service = new QapApplicationService({ hostRootDir: host });
      cleanups.push(() => service.close());
      // The host can reconstruct stale bindings even when the previous process removed them.
      const staleStore = { } as any;
      const next = await openMcpClient({ service, projectRoots: [rootA, rootB], hostRegistryPath: registry,
        knowledgeBindings: [
          { projectRoot: rootA, applicationId: a.project.application_id, environmentId: a.environment!.env_id, store: staleStore },
          { projectRoot: rootB, applicationId: b.project.application_id, environmentId: b.environment!.env_id, store: service.openKnowledgeStore(b.project.project_id) },
        ] });
      if (stage === 'registry-still-present') registryFault.path = registry;
      try {
        const blocked = await next.call('qap_status', { targetPath: rootA });
        expect(blocked.isError).toBe(true);
        if (stage === 'registry-still-present') {
          expect(blocked.data.code).toBe('project_delete_registry_cleanup_failed');
          expect((await next.call('qap_project', { action: 'recover', project_id: a.project.project_id })).data.code).toBe('project_delete_registry_cleanup_failed');
          expect(service.getDeletedProjectRoot(a.project.project_id)).toBe(rootA);
        }
        expect((await next.call('qap_status', { targetPath: rootB })).data.knowledge.state).toBe('incompatible');
      } finally { registryFault.path = ''; }
      expect((await next.call('qap_status', { targetPath: rootA })).isError).toBe(true);
      expect(JSON.parse(readFileSync(registry, 'utf8'))).toEqual([rootB]);
      expect((await next.call('qap_status', { targetPath: rootA })).isError).toBe(true);
      expect(JSON.parse(readFileSync(registry, 'utf8'))).toEqual([rootB]);
      expect((await next.call('qap_project', { action: 'recover', project_id: a.project.project_id })).data.status).toBe('recovered');
      const afterRecovery = await next.call('qap_status', { targetPath: rootA });
      expect(afterRecovery.data.status).toBe('blocked');
      writeFileSync(registry, JSON.stringify([rootA, rootB]));
      expect((await next.call('qap_status', { targetPath: rootA })).data.knowledge.state).toBe('unbound');
      expect((await next.call('qap_status', { targetPath: rootB })).data.knowledge.state).toBe('incompatible');
    });

  it('reconciles a tombstone across two Stdio server processes', async () => {
    const host = mkTemp('qap-restart-stdio-host-'), rootA = mkTemp('qap-restart-stdio-a-'), rootB = mkTemp('qap-restart-stdio-b-');
    const workspaceHost = join(host, 'workspaces'), appHost = join(host, 'application');
    mkdirSync(workspaceHost);
    const registry = join(workspaceHost, 'authorized-roots.json');
    writeFileSync(registry, JSON.stringify([rootA, rootB]));
    let service = new QapApplicationService({ hostRootDir: appHost });
    const a = service.createProject({ name: 'A', canonicalRoot: rootA });
    service.createProject({ name: 'B', canonicalRoot: rootB });
    service.close();
    const connect = async () => {
      const client = new Client({ name: 'restart-stdio-test', version: '1' }, {});
      const transport = new StdioClientTransport({ command: process.execPath, args: [join(process.cwd(), 'dist', 'server.js')],
        env: { ...process.env as Record<string, string>, QAP_MCP_WORKSPACE_HOST_DIR: workspaceHost, QAP_MCP_APP_SERVICE_DIR: appHost,
          QAP_DISABLE_INTERACTIVE_AUTH: '1', NODE_ENV: 'test' }, stderr: 'pipe' });
      await client.connect(transport);
      const call = async (name: string, args: Record<string, unknown>) => {
        const response = await client.callTool({ name, arguments: args });
        return JSON.parse((response.content as Array<{ text: string }>)[0].text);
      };
      return { client, call };
    };
    const first = await connect();
    try {
      const preview = await first.call('qap_project', { action: 'delete_preview', project_id: a.project.project_id });
      writeFileSync(registry, '{');
      expect((await first.call('qap_project', { action: 'delete_confirm', project_id: a.project.project_id,
        confirmation_token: preview.preview.confirmation_token, decision: 'confirm_delete' })).code).toBe('project_delete_registry_cleanup_failed');
    } catch (error) { await first.client.close(); throw error; }
    service = new QapApplicationService({ hostRootDir: appHost });
    expect(service.getDeletedProjectRoot(a.project.project_id)).toBe(rootA);
    service.close();
    writeFileSync(registry, JSON.stringify([rootA, rootB]));
    expect((await first.call('qap_status', { targetPath: rootA })).code).toBe('project_deleted_tombstone');
    const second = await connect();
    try {
      expect((await second.call('qap_status', { targetPath: rootA })).code).toBe('project_deleted_tombstone');
      expect(JSON.parse(readFileSync(registry, 'utf8'))).toEqual([rootB]);
      expect((await second.call('qap_status', { targetPath: rootA })).code).toBe('project_deleted_tombstone');
      expect((await second.call('qap_status', { targetPath: rootB })).status).not.toBe('blocked');
      expect((await second.call('qap_project', { action: 'recover', project_id: a.project.project_id })).status).toBe('recovered');
      expect((await second.call('qap_status', { targetPath: rootA })).status).toBe('blocked');
      const cleanupService = new QapApplicationService({ hostRootDir: appHost });
      try {
        const state = cleanupService.getRootDeletionState(rootA);
        if (!state || state.version !== 1) throw new Error('expected deletion generation');
        expect(cleanupService.completeRootDeletionCleanup(rootA, state.generation)).toBe(true);
      } finally { cleanupService.close(); }
      execFileSync(process.execPath, [join(process.cwd(), '..', '..', 'scripts', 'qap-authorize-workspace.mjs'), rootA],
        { env: { ...process.env, QAP_MCP_WORKSPACE_HOST_DIR: workspaceHost, QAP_MCP_APP_SERVICE_DIR: appHost } });
      expect((await second.call('qap_status', { targetPath: rootA })).status).not.toBe('blocked');
      expect((await first.call('qap_status', { targetPath: rootA })).status).not.toBe('blocked');
      expect(JSON.parse(readFileSync(registry, 'utf8'))).toEqual([rootB, rootA]);
      expect((await first.call('qap_status', { targetPath: rootB })).status).not.toBe('blocked');
    } finally { await second.client.close(); await first.client.close(); }
  }, 30000);

  it('removes a deleted root through the default Stdio host', async () => {
    const host = mkTemp('qap-stdio-host-'), aRoot = mkTemp('qap-stdio-a-'), bRoot = mkTemp('qap-stdio-b-');
    const workspaceHost = join(host, 'workspaces'), appHost = join(host, 'application');
    mkdirSync(workspaceHost);
    const registry = join(workspaceHost, 'authorized-roots.json');
    writeFileSync(registry, JSON.stringify([aRoot, bRoot]));
    const service = new QapApplicationService({ hostRootDir: appHost });
    const a = service.createProject({ name: 'A', canonicalRoot: aRoot });
    service.createProject({ name: 'B', canonicalRoot: bRoot });
    service.close();
    const client = new Client({ name: 'stdio-delete-test', version: '1' }, {});
    const transport = new StdioClientTransport({ command: process.execPath, args: [join(process.cwd(), 'dist', 'server.js')],
      env: { ...process.env as Record<string, string>, QAP_MCP_WORKSPACE_HOST_DIR: workspaceHost, QAP_MCP_APP_SERVICE_DIR: appHost,
        QAP_DISABLE_INTERACTIVE_AUTH: '1', NODE_ENV: 'test' }, stderr: 'pipe' });
    await client.connect(transport);
    try {
      const call = async (name: string, args: Record<string, unknown>) => {
        const response = await client.callTool({ name, arguments: args });
        return { isError: Boolean(response.isError), data: JSON.parse((response.content as Array<{text: string}>)[0].text) };
      };
      const preview = await call('qap_project', { action: 'delete_preview', project_id: a.project.project_id, targetPath: aRoot });
      const deleted = await call('qap_project', { action: 'delete_confirm', project_id: a.project.project_id, targetPath: aRoot,
        confirmation_token: preview.data.preview.confirmation_token, decision: 'confirm_delete' });
      expect(deleted.data.status).toBe('deleted');
      expect(JSON.parse(readFileSync(registry, 'utf8'))).toEqual([bRoot]);
      expect((await call('qap_status', { targetPath: aRoot })).isError).toBe(true);
      expect((await call('qap_status', { targetPath: bRoot })).isError).toBe(false);
      expect((await call('qap_project', { action: 'recover', project_id: a.project.project_id })).data.status).toBe('recovered');
      expect((await call('qap_status', { targetPath: aRoot })).data.status).toBe('blocked');
      writeFileSync(registry, JSON.stringify([aRoot, bRoot]));
      expect((await call('qap_status', { targetPath: aRoot })).data.status).not.toBe('blocked');
      expect((await call('qap_status', { targetPath: bRoot })).data.status).not.toBe('blocked');
    } finally { await client.close(); }
  }, 20000);

  it('removes the deleted root and its knowledge binding while retaining a neighboring binding', async () => {
    const host = mkTemp('qap-enc-bind-host-');
    const rootA = mkTemp('qap-enc-bind-a-');
    const rootB = mkTemp('qap-enc-bind-b-');
    const registry = join(mkTemp('qap-enc-reg-'), 'roots.json');
    writeFileSync(registry, '[]');
    const service = new QapApplicationService({ hostRootDir: host });
    cleanups.push(() => service.close());
    const a = service.createProject({ name: 'A', canonicalRoot: rootA });
    const b = service.createProject({ name: 'B', canonicalRoot: rootB });
    const mcp = await openMcpClient({ service, projectRoots: [rootA, rootB], hostRegistryPath: registry,
      knowledgeBindings: [
        { projectRoot: rootA, applicationId: a.project.application_id, environmentId: a.environment!.env_id, store: service.openKnowledgeStore(a.project.project_id) },
        { projectRoot: rootB, applicationId: b.project.application_id, environmentId: b.environment!.env_id, store: service.openKnowledgeStore(b.project.project_id) },
      ] });
    expect((await mcp.call('qap_status', { targetPath: rootA })).data.knowledge.state).toBe('incompatible');
    expect((await mcp.call('qap_status', { targetPath: rootB })).data.knowledge.state).toBe('incompatible');
    const preview = await mcp.call('qap_project', { action: 'delete_preview', project_id: a.project.project_id });
    const deleted = await mcp.call('qap_project', { action: 'delete_confirm', project_id: a.project.project_id,
      confirmation_token: preview.data.preview.confirmation_token, decision: 'confirm_delete' });
    expect(deleted.data.status).toBe('deleted');
    expect(service.getDeletedProjectRoot(a.project.project_id)).toBe(rootA);
    expect((await mcp.call('qap_status', { targetPath: rootA })).isError).toBe(true);
    expect((await mcp.call('qap_status', { targetPath: rootB })).data.knowledge.state).toBe('incompatible');
    expect((await mcp.call('qap_project', { action: 'recover', project_id: a.project.project_id })).data.status).toBe('recovered');
    // The host explicitly authorizes the recovered root again. Its old binding must not return.
    writeFileSync(registry, JSON.stringify([rootA]));
    expect((await mcp.call('qap_status', { targetPath: rootA })).data.knowledge.state).toBe('unbound');
    expect((await mcp.call('qap_status', { targetPath: rootB })).data.knowledge.state).toBe('incompatible');
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
    expect(service.getDeletedProjectRoot(idA)).toBe(wsA);
    expect(service.getDeletedProjectRoot(idB)).toBeNull();
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
  }, 15000);
});
