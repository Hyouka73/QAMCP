import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CredentialProvider, CredentialReference } from '@qap/shared';

import { QapApplicationService } from '../application/application-service.js';
import { computeDossierContentHash, type DiscoveryDossierCanonical } from '../application/discovery-dossier.js';
import { createMcpServer, type McpServerOptions } from '../server.js';
import { WorkspaceBootstrap } from '../workspace-bootstrap.js';
import type { IWorkspaceAuthorizer } from '../workspace-authorizer.js';
import type { IDiscoveryAuthorizer } from '../discovery-authorizer.js';
import type { IAuthAuthorizer } from '../auth-authorizer.js';

import { startProtectedSpaStaging, type ProtectedSpaStagingController } from './fixtures/protected-spa-staging.js';

class TestMemoryCredentialProvider implements CredentialProvider {
  readonly entries = new Map<string, string>();

  private key(ref: CredentialReference): string {
    return `${ref.project_id}:${ref.profile_id}:${ref.account}`;
  }

  async set(ref: CredentialReference, secret: { username?: string; password?: string; token?: string }): Promise<void> {
    this.entries.set(this.key(ref), JSON.stringify(secret));
  }

  async get(ref: CredentialReference): Promise<{ username?: string; password?: string; token?: string } | null> {
    const raw = this.entries.get(this.key(ref));
    return raw ? (JSON.parse(raw) as { username?: string; password?: string; token?: string }) : null;
  }

  async delete(ref: CredentialReference): Promise<boolean> {
    return this.entries.delete(this.key(ref));
  }
}

describe('P0.2a — Expediente de Discovery reutilizable por revisión y alcance', () => {
  const disposables: Array<() => Promise<void> | void> = [];
  let staging: ProtectedSpaStagingController | undefined;

  afterEach(async () => {
    while (disposables.length > 0) {
      const fn = disposables.pop()!;
      await fn();
    }
    if (staging) {
      await staging.close();
      staging = undefined;
    }
  });

  function makeHostEnv(credentialProvider: CredentialProvider) {
    const tempBase = mkdtempSync(join(tmpdir(), 'qap-p02a-'));
    const hostRoot = join(tempBase, 'host');
    const workspaceRoot = join(tempBase, 'workspace-staging');
    const otherWorkspaceRoot = join(tempBase, 'workspace-other');
    mkdirSync(hostRoot, { recursive: true });
    mkdirSync(workspaceRoot, { recursive: true });
    mkdirSync(otherWorkspaceRoot, { recursive: true });

    const appService = new QapApplicationService({ hostRootDir: hostRoot, credentialProvider });
    const bootstrap = new WorkspaceBootstrap(hostRoot, appService);
    const registryPath = join(hostRoot, 'authorized-workspaces.json');
    const discoveryRegistryPath = join(hostRoot, 'authorized-discoveries.json');
    const authRegistryPath = join(hostRoot, 'authorized-auth.json');

    disposables.push(async () => {
      bootstrap.close();
      appService.close();
      rmSync(tempBase, { recursive: true, force: true });
    });

    const workspaceAuthorizer: IWorkspaceAuthorizer = {
      requestAuthorization: vi.fn(async ({ canonicalPath }) => ({
        decision: 'approved' as const,
        root: canonicalPath,
      })),
    };
    const discoveryAuthorizer: IDiscoveryAuthorizer = {
      requestAuthorization: vi.fn(async ({ projectRoot, baseUrl, targetUrl, limits }) => ({
        decision: 'approved' as const,
        root: projectRoot,
        navigationOrigin: new URL(baseUrl).origin,
        targetUrl,
        limits,
      })),
    };
    const authAuthorizer: IAuthAuthorizer = {
      requestAuthorization: vi.fn(async ({ origin, profileLabel }) => ({
        decision: 'approved' as const,
        origin,
        profileLabel,
      })),
    };

    const connectServer = async (overrides: Partial<McpServerOptions> = {}) => {
      const server = createMcpServer({
        workspaceBootstrap: bootstrap,
        applicationService: bootstrap.appService,
        workspaceAuthorizer,
        hostRegistryPath: registryPath,
        discoveryAuthorizer,
        hostDiscoveryRegistryPath: discoveryRegistryPath,
        authAuthorizer,
        hostAuthRegistryPath: authRegistryPath,
        allowSpaReadOnly: true,
        ...overrides,
      });
      const client = new Client({ name: 'p02a-test-client', version: '1.0.0' });
      const [t1, t2] = InMemoryTransport.createLinkedPair();
      await Promise.all([server.connect(t1), client.connect(t2)]);
      disposables.push(async () => {
        await client.close();
        await server.close();
      });

      const call = async (name: string, args: Record<string, unknown> = {}) => {
        const res = await client.callTool({
          name,
          arguments: { targetPath: workspaceRoot, ...args },
        });
        const text = (res.content[0] as { type: string; text: string })?.text ?? '{}';
        return {
          isError: Boolean(res.isError),
          rawText: text,
          data: JSON.parse(text) as Record<string, any>,
        };
      };

      return { server, client, call };
    };

    return {
      hostRoot,
      workspaceRoot,
      otherWorkspaceRoot,
      appService,
      bootstrap,
      workspaceAuthorizer,
      discoveryAuthorizer,
      authAuthorizer,
      connectServer,
    };
  }

  it('persists reusable discovery revision, generates sanitized Markdown, recovers after restart, plans without re-crawling, and rejects out-of-scope revisions', async () => {
    staging = await startProtectedSpaStaging();
    const creds = new TestMemoryCredentialProvider();
    const env = makeHostEnv(creds);

    // 1. Setup project context & authenticated profile
    const session1 = await env.connectServer();
    const createRes = await session1.call('qap_project', {
      action: 'create',
      name: 'Portal Pedidos Staging',
      canonical_root: env.workspaceRoot,
      base_url: staging.origin,
      env_name: 'staging',
      tenant_mode: 'multi_tenant',
      default_tenant: 'tenant-a',
      objective: 'Documentar y planificar el portal SPA de pedidos.',
    });
    expect(createRes.isError, createRes.rawText).toBe(false);
    const projectId = createRes.data.project.project_id as string;

    const ctxRes = await session1.call('qap_context_set', {
      base_url: staging.origin,
      objective: 'Documentar y planificar el portal SPA de pedidos.',
      roles: [{ name: 'operador', source: 'user' }],
      critical_flows: [{ name: 'Consultar pedidos', source: 'user' }],
      source_of_truth: { type: 'none', declared: true, source: 'user' },
    });
    expect(ctxRes.isError, ctxRes.rawText).toBe(false);

    const authRes = await session1.call('qap_auth_add', {
      profile: 'operador-staging',
      username: 'qa.operator',
      password: 'StagingPass#2026',
      role: 'operador',
      tenant_id: 'tenant-a',
      login_route: '/login',
    });
    expect(authRes.isError, authRes.rawText).toBe(false);
    expect(authRes.data.status).toBe('success');
    const resumeProj = await session1.call('qap_project', { action: 'resume', project_id: projectId });
    const durableProfileId = (resumeProj.data.profiles as Array<{ label: string; profile_id: string }>)
      .find((p) => p.label === 'operador-staging')?.profile_id as string;
    expect(durableProfileId).toMatch(/^prof-[a-f0-9]{8}$/);

    // 2. Run real loopback SPA Discovery
    const disc1 = await session1.call('qap_discover', {
      name: 'portal-pedidos',
      description: 'Portal SPA Protegido de Pedidos',
      path: '/app',
      profile: 'operador-staging',
      tenant_id: 'tenant-a',
      allow_spa: true,
    });
    expect(disc1.isError, disc1.rawText).toBe(false);
    expect(['completed', 'partial']).toContain(disc1.data.status);
    expect(disc1.data.discovery_revision_id).toMatch(/^drev-[a-f0-9]{12}$/);
    expect(disc1.data.discovery_reused).toBe(false);
    expect(disc1.data.discovery_dossier).toMatchObject({
      revision_id: disc1.data.discovery_revision_id,
      module_key: 'portal-pedidos',
      index_path: '.qa/discovery/INDEX.md',
      module_doc_path: expect.stringMatching(/^\.qa\/discovery\/modules\/portal-pedidos--[a-f0-9]{8}\.md$/),
      scope: {
        project_id: projectId,
        environment_name: 'staging',
        tenant_id: 'tenant-a',
        profile_id: durableProfileId,
        role: 'operador',
        module_key: 'portal-pedidos',
      },
    });
    expect(staging.mutatingRequests).toHaveLength(0);
    expect(env.discoveryAuthorizer.requestAuthorization).toHaveBeenCalledTimes(1);

    const rev1 = disc1.data.discovery_revision_id as string;
    const moduleDocRel = disc1.data.discovery_dossier.module_doc_path as string;

    // Verify Markdown files on disk and absence of sensitive session/credential data
    const indexMdPath = join(env.workspaceRoot, '.qa', 'discovery', 'INDEX.md');
    const moduleMdPath = join(env.workspaceRoot, ...moduleDocRel.split('/'));
    expect(existsSync(indexMdPath)).toBe(true);
    expect(existsSync(moduleMdPath)).toBe(true);
    const indexMdDisk = readFileSync(indexMdPath, 'utf8');
    const moduleMdDisk = readFileSync(moduleMdPath, 'utf8');
    expect(indexMdDisk).toContain(rev1);
    expect(indexMdDisk).toContain('portal-pedidos');
    expect(moduleMdDisk).toContain(rev1);
    expect(moduleMdDisk).toContain('tenant-a');
    expect(moduleMdDisk).toContain(durableProfileId);
    expect(moduleMdDisk).toContain('missing_business_rules');
    for (const sensitive of ['StagingPass#2026', 'localStorage', 'Cookie:', 'Set-Cookie']) {
      expect(indexMdDisk).not.toContain(sensitive);
      expect(moduleMdDisk).not.toContain(sensitive);
    }

    // 3. Re-running qap_discover on the exact same unchanged route reuses the stable revision without per-route confirmation
    const discSame = await session1.call('qap_discover', {
      name: 'portal-pedidos',
      description: 'Portal SPA Protegido de Pedidos',
      path: '/app',
      profile: 'operador-staging',
      tenant_id: 'tenant-a',
      allow_spa: true,
    });
    expect(discSame.isError, discSame.rawText).toBe(false);
    expect(discSame.data.discovery_revision_id).toBe(rev1);
    expect(discSame.data.discovery_reused).toBe(true);
    expect(env.discoveryAuthorizer.requestAuthorization).toHaveBeenCalledTimes(1);

    // 4. New observation on another route creates a new revision while preserving access to rev1
    const discNew = await session1.call('qap_discover', {
      name: 'portal-pedidos',
      description: 'Portal SPA Protegido de Pedidos',
      path: '/app/orders',
      profile: 'operador-staging',
      tenant_id: 'tenant-a',
      allow_spa: true,
    });
    expect(discNew.isError, discNew.rawText).toBe(false);
    const rev2 = discNew.data.discovery_revision_id as string;
    expect(rev2).toMatch(/^drev-[a-f0-9]{12}$/);
    expect(rev2).not.toBe(rev1);
    expect(discNew.data.discovery_reused).toBe(false);
    // Still zero extra discovery authorization prompts for same origin
    expect(env.discoveryAuthorizer.requestAuthorization).toHaveBeenCalledTimes(1);

    // 5. Simulate MCP restart: close session1, delete Markdown on disk, reopen fresh MCP session
    await session1.client.close();
    await session1.server.close();
    unlinkSync(indexMdPath);
    unlinkSync(moduleMdPath);

    const session2 = await env.connectServer();

    // Read-only consultation inspects rev1 without overwriting disk; INDEX keeps pointing to published rev2
    const dossierRes = await session2.call('qap_project', {
      action: 'discovery_dossier',
      project_id: projectId,
      module_key: 'portal-pedidos',
      revision_id: rev1,
    });
    expect(dossierRes.isError, dossierRes.rawText).toBe(false);
    expect(dossierRes.data.read_only).toBe(true);
    expect(dossierRes.data.selected_revision.revision_id).toBe(rev1);
    expect(dossierRes.data.revisions.length).toBeGreaterThanOrEqual(2);
    expect(dossierRes.data.revisions.map((r: { revision_id: string }) => r.revision_id)).toEqual(
      expect.arrayContaining([rev1, rev2]),
    );
    expect(dossierRes.data.index_markdown).toContain('portal-pedidos');
    expect(dossierRes.data.index_markdown).toContain(rev2);
    expect(dossierRes.data.module_markdown).toContain(rev1);
    expect(dossierRes.data.module_markdown).toContain('/app');
    expect(existsSync(indexMdPath)).toBe(false);
    expect(existsSync(moduleMdPath)).toBe(false);

    // Explicit regeneration restores INDEX.md and published scope pages from SQLite
    const regenRes = await session2.call('qap_project', {
      action: 'discovery_dossier_regenerate',
      project_id: projectId,
    });
    expect(regenRes.isError, regenRes.rawText).toBe(false);
    expect(regenRes.data.regenerated).toBe(true);
    expect(existsSync(indexMdPath)).toBe(true);
    expect(existsSync(moduleMdPath)).toBe(true);
    expect(readFileSync(indexMdPath, 'utf8')).toContain(rev2);

    // 6. Plan using rev1 after restart WITHOUT launching another crawler; DOM observations never confirm business rules
    const appRequestsBeforePlan = staging.visitedRequests.filter((r) => r.url.startsWith('/app')).length;
    const planFromRev1 = await session2.call('qap_plan', {
      module: 'portal-pedidos',
      environment: 'staging',
      tenant_id: 'tenant-a',
      profile: 'operador-staging',
      discovery_revision_id: rev1,
      case_workflow: { action: 'propose_from_observations' },
    });
    expect(planFromRev1.isError, planFromRev1.rawText).toBe(false);
    expect(planFromRev1.data.status).toBe('proposed');
    expect(planFromRev1.data.discovery_revision_id).toBe(rev1);
    expect(planFromRev1.data.proposed_cases).toEqual([]);
    expect(planFromRev1.data.pending_oracle_cases.length).toBeGreaterThanOrEqual(1);
    expect(planFromRev1.data.pending_oracle_cases[0].observation.route).toBe('/app');
    expect(planFromRev1.data.pending_oracle_cases[0].observation.evidence_refs.length).toBeGreaterThanOrEqual(1);
    // No crawler requests were issued during qap_plan
    const appRequestsAfterPlan = staging.visitedRequests.filter((r) => r.url.startsWith('/app')).length;
    expect(appRequestsAfterPlan).toBe(appRequestsBeforePlan);

    // 7. Out-of-scope negative checks
    const wrongEnv = await session2.call('qap_plan', {
      module: 'portal-pedidos',
      environment: 'production',
      tenant_id: 'tenant-a',
      profile: 'operador-staging',
      discovery_revision_id: rev1,
      case_workflow: { action: 'propose_from_observations' },
    });
    expect(wrongEnv.isError).toBe(true);
    expect(wrongEnv.data.status).toBe('blocked');
    expect(['environment_out_of_scope', 'discovery_revision_out_of_scope']).toContain(wrongEnv.data.code);

    const wrongTenant = await session2.call('qap_plan', {
      module: 'portal-pedidos',
      environment: 'staging',
      tenant_id: 'tenant-b',
      profile: 'operador-staging',
      discovery_revision_id: rev1,
      case_workflow: { action: 'propose_from_observations' },
    });
    expect(wrongTenant.isError).toBe(true);
    expect(wrongTenant.data.status).toBe('blocked');
    expect(['tenant_mismatch', 'discovery_revision_out_of_scope']).toContain(wrongTenant.data.code);

    const wrongModule = await session2.call('qap_plan', {
      module: 'otro-modulo',
      environment: 'staging',
      tenant_id: 'tenant-a',
      profile: 'operador-staging',
      discovery_revision_id: rev1,
      case_workflow: { action: 'propose_from_observations' },
    });
    expect(wrongModule.isError).toBe(true);
    expect(wrongModule.data.status).toBe('blocked');
    expect(wrongModule.data.code).toBe('discovery_revision_out_of_scope');

    const wrongProfile = await session2.call('qap_plan', {
      module: 'portal-pedidos',
      environment: 'staging',
      tenant_id: 'tenant-a',
      profile: 'otro-perfil',
      discovery_revision_id: rev1,
      case_workflow: { action: 'propose_from_observations' },
    });
    expect(wrongProfile.isError).toBe(true);
    expect(wrongProfile.data.status).toBe('blocked');
    expect(['profile_not_found', 'discovery_revision_out_of_scope']).toContain(wrongProfile.data.code);

    const missingRev = await session2.call('qap_plan', {
      module: 'portal-pedidos',
      environment: 'staging',
      tenant_id: 'tenant-a',
      discovery_revision_id: 'drev-000000000000',
      case_workflow: { action: 'propose_from_observations' },
    });
    expect(missingRev.isError).toBe(true);
    expect(missingRev.data.status).toBe('blocked');
    expect(missingRev.data.code).toBe('discovery_revision_not_found');

    // Different project scope rejection
    const otherStatus = await session2.call('qap_status', { targetPath: env.otherWorkspaceRoot });
    expect(otherStatus.isError).toBe(false);
    const otherProjPlan = await session2.call('qap_plan', {
      targetPath: env.otherWorkspaceRoot,
      module: 'portal-pedidos',
      discovery_revision_id: rev1,
      case_workflow: { action: 'propose_from_observations' },
    });
    expect(otherProjPlan.isError).toBe(true);
    expect(otherProjPlan.data.status).toBe('blocked');
    expect(otherProjPlan.data.code).toBe('discovery_revision_out_of_scope');
  }, 45_000);

  it('aisla dos tenants/perfiles en el mismo módulo, detecta cambio en ruta secundaria, reutiliza tras reabrir SQLite, protege INDEX/opacos y separa ramas no consumidoras', async () => {
    staging = await startProtectedSpaStaging({
      includeExternalLink: true,
      secondaryOrdersPage: true,
    });
    const creds = new TestMemoryCredentialProvider();
    const tempBase = mkdtempSync(join(tmpdir(), 'qap-p02a-mt-'));
    const hostRoot = join(tempBase, 'host');
    const workspaceRoot = join(tempBase, 'workspace-mt');
    const otherWorkspaceRoot = join(tempBase, 'workspace-other');
    mkdirSync(hostRoot, { recursive: true });
    mkdirSync(workspaceRoot, { recursive: true });
    mkdirSync(otherWorkspaceRoot, { recursive: true });

    const registryPath = join(hostRoot, 'authorized-workspaces.json');
    const discoveryRegistryPath = join(hostRoot, 'authorized-discoveries.json');
    const authRegistryPath = join(hostRoot, 'authorized-auth.json');
    const workspaceAuthorizer: IWorkspaceAuthorizer = {
      requestAuthorization: vi.fn(async ({ canonicalPath }) => ({
        decision: 'approved' as const,
        root: canonicalPath,
      })),
    };
    const discoveryAuthorizer: IDiscoveryAuthorizer = {
      requestAuthorization: vi.fn(async ({ projectRoot, baseUrl, targetUrl, limits }) => ({
        decision: 'approved' as const,
        root: projectRoot,
        navigationOrigin: new URL(baseUrl).origin,
        targetUrl,
        limits,
      })),
    };
    const authAuthorizer: IAuthAuthorizer = {
      requestAuthorization: vi.fn(async ({ origin, profileLabel }) => ({
        decision: 'approved' as const,
        origin,
        profileLabel,
      })),
    };

    const activeClosers: Array<() => Promise<void> | void> = [];
    disposables.push(async () => {
      while (activeClosers.length > 0) {
        await activeClosers.pop()!();
      }
      rmSync(tempBase, { recursive: true, force: true });
    });

    const openIsolatedSession = async () => {
      const appService = new QapApplicationService({ hostRootDir: hostRoot, credentialProvider: creds });
      const bootstrap = new WorkspaceBootstrap(hostRoot, appService);
      const server = createMcpServer({
        workspaceBootstrap: bootstrap,
        applicationService: bootstrap.appService,
        workspaceAuthorizer,
        hostRegistryPath: registryPath,
        discoveryAuthorizer,
        hostDiscoveryRegistryPath: discoveryRegistryPath,
        authAuthorizer,
        hostAuthRegistryPath: authRegistryPath,
        allowSpaReadOnly: true,
      });
      const client = new Client({ name: 'p02a-mt-client', version: '1.0.0' });
      const [t1, t2] = InMemoryTransport.createLinkedPair();
      await Promise.all([server.connect(t1), client.connect(t2)]);

      const closeAll = async () => {
        await client.close();
        await server.close();
        bootstrap.close();
        appService.close();
      };
      activeClosers.push(closeAll);

      const call = async (name: string, args: Record<string, unknown> = {}) => {
        const res = await client.callTool({
          name,
          arguments: { targetPath: workspaceRoot, ...args },
        });
        const text = (res.content[0] as { type: string; text: string })?.text ?? '{}';
        return {
          isError: Boolean(res.isError),
          rawText: text,
          data: JSON.parse(text) as Record<string, any>,
        };
      };

      return { appService, call, closeAll };
    };

    const s1 = await openIsolatedSession();
    const createRes = await s1.call('qap_project', {
      action: 'create',
      name: 'Portal Multi-Tenant',
      canonical_root: workspaceRoot,
      base_url: staging.origin,
      env_name: 'staging',
      tenant_mode: 'multi_tenant',
      objective: 'Verificar aislamiento multi-tenant del expediente de Discovery.',
    });
    expect(createRes.isError, createRes.rawText).toBe(false);
    const projectId = createRes.data.project.project_id as string;

    await s1.call('qap_context_set', {
      base_url: staging.origin,
      objective: 'Aislamiento por tenant y perfil.',
      roles: [{ name: 'operador', source: 'user' }, { name: 'auditor', source: 'user' }],
      critical_flows: [{ name: 'Gestión pedidos', source: 'user' }],
      source_of_truth: { type: 'none', declared: true, source: 'user' },
    });

    const authA = await s1.call('qap_auth_add', {
      profile: 'operador-a',
      username: 'qa.tenant_a',
      password: 'TenantAPass#2026',
      role: 'operador',
      tenant_id: 'tenant-a',
      login_route: '/login',
    });
    expect(authA.isError, authA.rawText).toBe(false);
    expect(authA.data.status).toBe('success');

    // Before adding second profile, verify qap_discover validates tenant_id against autodetected profile!
    const autoDetectMismatch = await s1.call('qap_discover', {
      name: 'portal-pedidos',
      path: '/app',
      tenant_id: 'tenant-b',
      allow_spa: true,
    });
    expect(autoDetectMismatch.isError).toBe(true);
    expect(autoDetectMismatch.data.status).toBe('blocked');
    expect(autoDetectMismatch.data.code).toBe('tenant_mismatch');

    const authB = await s1.call('qap_auth_add', {
      profile: 'auditor-b',
      username: 'qa.tenant_b',
      password: 'TenantBPass#2026',
      role: 'auditor',
      tenant_id: 'tenant-b',
      login_route: '/login',
    });
    expect(authB.isError, authB.rawText).toBe(false);
    expect(authB.data.status).toBe('success');

    const resumedProfiles = await s1.call('qap_project', { action: 'resume', project_id: projectId });
    const profList = resumedProfiles.data.profiles as Array<{ label: string; profile_id: string }>;
    const profAId = profList.find((p) => p.label === 'operador-a')?.profile_id as string;
    const profBId = profList.find((p) => p.label === 'auditor-b')?.profile_id as string;
    expect(profAId).toMatch(/^prof-[a-f0-9]{8}$/);
    expect(profBId).toMatch(/^prof-[a-f0-9]{8}$/);

    // Crossed profile vs tenant_id on qap_discover must block
    const crossDisc = await s1.call('qap_discover', {
      name: 'portal-pedidos',
      path: '/app',
      profile: 'operador-a',
      tenant_id: 'tenant-b',
      allow_spa: true,
    });
    expect(crossDisc.isError).toBe(true);
    expect(crossDisc.data.code).toBe('tenant_mismatch');

    // Run primary (/app) then /app/orders (v1 -> visits secondary /app at depth 1)
    const discABase = await s1.call('qap_discover', {
      name: 'portal-pedidos',
      description: 'Portal Pedidos',
      path: '/app',
      profile: 'OPERADOR-A',
      allow_spa: true,
    });
    expect(discABase.isError, discABase.rawText).toBe(false);

    const discA1 = await s1.call('qap_discover', {
      name: 'portal-pedidos',
      description: 'Portal Pedidos',
      path: '/app/orders',
      profile: 'OPERADOR-A',
      allow_spa: true,
    });
    expect(discA1.isError, discA1.rawText).toBe(false);
    const revA1 = discA1.data.discovery_revision_id as string;
    const docRelA = discA1.data.discovery_dossier.module_doc_path as string;

    const discB1 = await s1.call('qap_discover', {
      name: 'portal-pedidos',
      description: 'Portal Pedidos',
      path: '/app',
      profile: profBId,
      allow_spa: true,
    });
    expect(discB1.isError, discB1.rawText).toBe(false);
    const revB1 = discB1.data.discovery_revision_id as string;
    const docRelB = discB1.data.discovery_dossier.module_doc_path as string;

    expect(revB1).not.toBe(revA1);
    expect(docRelA).not.toBe(docRelB);
    expect(discA1.data.discovery_dossier.scope.profile_id).toBe(profAId);
    expect(discB1.data.discovery_dossier.scope.profile_id).toBe(profBId);
    expect(discA1.data.discovery_dossier.scope.tenant_id).toBe('tenant-a');
    expect(discB1.data.discovery_dossier.scope.tenant_id).toBe('tenant-b');

    // Verify secondary route (/app) was also visited, opaque route refs preserved for blocked external link, and zero URL/secret leaks
    const savedA1 = s1.appService.getDiscoveryRevision(revA1)!;
    expect(savedA1.dossier.views.length).toBeGreaterThanOrEqual(2);
    const blockedRoutesA1 = savedA1.dossier.routes.filter((r) => r.state === 'blocked');
    expect(blockedRoutesA1.length).toBeGreaterThanOrEqual(1);
    for (const br of blockedRoutesA1) {
      expect(br.reference).toMatch(/^urn:qap:route:/);
      expect(br.authorized_pathname).toBeUndefined();
    }
    const serializedA1 = JSON.stringify(savedA1);
    for (const forbidden of [
      staging.origin,
      'external-forbidden.invalid',
      'secret-123',
      'TenantAPass#2026',
      'TenantBPass#2026',
    ]) {
      expect(serializedA1).not.toContain(forbidden);
    }

    // Verify content hash sensitivity strictly on secondary view changes (without changing primary view)
    const secondaryChanged: DiscoveryDossierCanonical = {
      ...savedA1.dossier,
      views: savedA1.dossier.views.map((v, idx) =>
        idx === 1 ? { ...v, headings: [...v.headings, 'Nuevo encabezado secundario'] } : v,
      ),
    };
    expect(computeDossierContentHash(secondaryChanged)).not.toBe(savedA1.content_hash);

    // Mutate /app/orders (v2) and rediscover -> produces a brand-new revision revA2
    staging.setOrdersVariant('v2');
    const discA2 = await s1.call('qap_discover', {
      name: 'portal-pedidos',
      description: 'Portal Pedidos',
      path: '/app/orders',
      profile: 'operador-a',
      tenant_id: 'tenant-a',
      allow_spa: true,
    });
    expect(discA2.isError, discA2.rawText).toBe(false);
    const revA2 = discA2.data.discovery_revision_id as string;
    expect(revA2).not.toBe(revA1);
    expect(discA2.data.discovery_reused).toBe(false);

    // Close BOTH MCP server AND QapApplicationService/SQLite, then reopen fresh instances from disk
    await s1.closeAll();
    const s2 = await openIsolatedSession();

    // Equivalent run after full SQLite + service reopen reuses revA2 (normalizing alias -> profAId)
    const discReused = await s2.call('qap_discover', {
      name: 'portal-pedidos',
      description: 'Portal Pedidos',
      path: '/app/orders',
      profile: 'operador-a',
      allow_spa: true,
    });
    expect(discReused.isError, discReused.rawText).toBe(false);
    expect(discReused.data.discovery_revision_id).toBe(revA2);
    expect(discReused.data.discovery_reused).toBe(true);

    // Consult historical revision revA1 -> INDEX.md & disk STILL publish latest per scope (revA2 + revB1)
    const indexPath = join(workspaceRoot, '.qa', 'discovery', 'INDEX.md');
    const docAPath = join(workspaceRoot, ...docRelA.split('/'));
    const docBPath = join(workspaceRoot, ...docRelB.split('/'));
    const histRead = await s2.call('qap_project', {
      action: 'discovery_dossier',
      project_id: projectId,
      revision_id: revA1,
    });
    expect(histRead.isError, histRead.rawText).toBe(false);
    expect(histRead.data.read_only).toBe(true);
    expect(histRead.data.selected_revision.revision_id).toBe(revA1);
    expect(histRead.data.index_markdown).toContain(revA2);
    expect(histRead.data.index_markdown).toContain(revB1);
    expect(histRead.data.index_markdown).not.toContain(revA1);
    expect(readFileSync(indexPath, 'utf8')).toContain(revA2);
    expect(readFileSync(docAPath, 'utf8')).toContain(revA2);
    expect(readFileSync(docBPath, 'utf8')).toContain(revB1);

    // Delete entire .qa/discovery directory and regenerate all published scope pages from SQLite
    rmSync(join(workspaceRoot, '.qa', 'discovery'), { recursive: true, force: true });
    expect(existsSync(indexPath)).toBe(false);
    const regenAll = await s2.call('qap_project', {
      action: 'discovery_dossier_regenerate',
      project_id: projectId,
    });
    expect(regenAll.isError, regenAll.rawText).toBe(false);
    expect(regenAll.data.published_count).toBe(2);
    expect(existsSync(indexPath)).toBe(true);
    expect(existsSync(docAPath)).toBe(true);
    expect(existsSync(docBPath)).toBe(true);
    expect(readFileSync(indexPath, 'utf8')).toContain(revA2);
    expect(readFileSync(indexPath, 'utf8')).toContain(revB1);

    // Reject targetPath vs project_id disagreement on both read and regenerate
    const createOther = await s2.call('qap_project', {
      action: 'create',
      targetPath: otherWorkspaceRoot,
      canonical_root: otherWorkspaceRoot,
      name: 'Otro Proyecto',
      base_url: staging.origin,
      env_name: 'staging',
    });
    expect(createOther.isError, createOther.rawText).toBe(false);
    const readMismatch = await s2.call('qap_project', {
      action: 'discovery_dossier',
      targetPath: otherWorkspaceRoot,
      project_id: projectId,
    });
    expect(readMismatch.isError).toBe(true);
    expect(readMismatch.data.code).toBe('project_root_mismatch');
    const regenMismatch = await s2.call('qap_project', {
      action: 'discovery_dossier_regenerate',
      targetPath: otherWorkspaceRoot,
      project_id: projectId,
    });
    expect(regenMismatch.isError).toBe(true);
    expect(regenMismatch.data.code).toBe('project_root_mismatch');

    // Reselect primary project so active context matches workspaceRoot
    await s2.call('qap_project', { action: 'select', project_id: projectId });

    // Omitting both tenant_id and profile blocks with minimal actionable question
    const appRequestsBeforePlan = staging.visitedRequests.length;
    const ambiguousPlan = await s2.call('qap_plan', {
      module: 'portal-pedidos',
      environment: 'staging',
      case_workflow: { action: 'propose_from_observations' },
    });
    expect(ambiguousPlan.isError).toBe(true);
    expect(ambiguousPlan.data.status).toBe('blocked');
    expect(ambiguousPlan.data.code).toBe('ambiguous_tenant_scope');
    expect(typeof ambiguousPlan.data.question).toBe('string');

    // Implicit selection by tenant_id='tenant-b' -> picks revB1 & tenant B structural DOM evidence, keeps pending_oracle
    const planImplicitB = await s2.call('qap_plan', {
      module: 'portal-pedidos',
      tenant_id: 'tenant-b',
      case_workflow: { action: 'propose_from_observations' },
    });
    expect(planImplicitB.isError, planImplicitB.rawText).toBe(false);
    expect(planImplicitB.data.discovery_revision_id).toBe(revB1);
    expect(planImplicitB.data.proposed_cases).toEqual([]);
    expect(planImplicitB.data.pending_oracle_cases.length).toBeGreaterThanOrEqual(1);
    expect(planImplicitB.data.pending_oracle_cases[0].observation.observed_controls).toContain('contact');
    expect(planImplicitB.data.pending_oracle_cases[0].observation.observed_controls).not.toContain('help');

    // Implicit selection by durable profile ID (tenant_id omitted) -> derives tenant-a & picks revA2
    const planImplicitA = await s2.call('qap_plan', {
      module: 'portal-pedidos',
      profile: profAId,
      case_workflow: { action: 'propose_from_observations' },
    });
    expect(planImplicitA.isError, planImplicitA.rawText).toBe(false);
    expect(planImplicitA.data.discovery_revision_id).toBe(revA2);
    expect(planImplicitA.data.proposed_cases).toEqual([]);
    expect(planImplicitA.data.pending_oracle_cases.length).toBeGreaterThanOrEqual(1);
    expect(planImplicitA.data.pending_oracle_cases[0].observation.observed_controls).toContain('help');
    expect(planImplicitA.data.pending_oracle_cases[0].observation.observed_controls).toContain('buscar');
    expect(planImplicitA.data.pending_oracle_cases[0].observation.observed_controls).not.toContain('contact');

    // Cross-selection blocked identically for tenant or profile vs explicit discovery_revision_id
    const crossPlanProfile = await s2.call('qap_plan', {
      module: 'portal-pedidos',
      profile: 'operador-a',
      discovery_revision_id: revB1,
      case_workflow: { action: 'propose_from_observations' },
    });
    expect(crossPlanProfile.isError).toBe(true);
    expect(crossPlanProfile.data.code).toBe('discovery_revision_out_of_scope');

    // Non-consuming branches never claim discovery_revision_id
    const manualProposalsPlan = await s2.call('qap_plan', {
      module: 'portal-pedidos',
      profile: 'operador-a',
      discovery_revision_id: revA2,
      case_workflow: {
        action: 'propose_from_observations',
        proposals: [
          {
            title: 'Caso manual sin expediente',
            expected_outcome: 'El usuario visualiza su resumen',
            oracle_source: 'user',
          },
        ],
      },
    });
    expect(manualProposalsPlan.isError, manualProposalsPlan.rawText).toBe(false);
    expect(manualProposalsPlan.data.discovery_revision_id).toBeUndefined();

    // Planning preserved evidence without re-crawling
    expect(staging.visitedRequests.length).toBe(appRequestsBeforePlan);
  }, 60_000);

  it('aisla perfiles entre entornos (staging vs sandbox), bloquea Discovery en otro entorno y construye URLs del entorno efectivo en qap_plan', async () => {
    staging = await startProtectedSpaStaging();
    const sandboxStaging = await startProtectedSpaStaging();
    disposables.push(async () => {
      await sandboxStaging.close();
    });
    expect(sandboxStaging.origin).not.toBe(staging.origin);

    const creds = new TestMemoryCredentialProvider();
    const env = makeHostEnv(creds);
    const s1 = await env.connectServer();

    const createRes = await s1.call('qap_project', {
      action: 'create',
      name: 'Multi Env Isolation',
      canonical_root: env.workspaceRoot,
      base_url: staging.origin,
      env_name: 'staging',
      tenant_mode: 'single',
      objective: 'Verificar aislamiento entre staging y sandbox con orígenes loopback distintos.',
    });
    expect(createRes.isError, createRes.rawText).toBe(false);
    const projectId = createRes.data.project.project_id as string;

    await s1.call('qap_context_set', {
      base_url: staging.origin,
      objective: 'Probar pedidos en múltiples entornos.',
      roles: [{ name: 'operador', source: 'user' }],
      critical_flows: [{ name: 'Ver pedidos', source: 'user' }],
      source_of_truth: { type: 'none', declared: true, source: 'user' },
    });

    const authStaging = await s1.call('qap_auth_add', {
      profile: 'operador-staging',
      username: 'qa.operator',
      password: 'StagingPass#2026',
      role: 'operador',
      login_route: '/login',
    });
    expect(authStaging.isError, authStaging.rawText).toBe(false);
    expect(authStaging.data.status).toBe('success');

    const resumeRes = await s1.call('qap_project', { action: 'resume', project_id: projectId });
    const profStagingId = (resumeRes.data.profiles as Array<{ label: string; profile_id: string }>)
      .find((p) => p.label === 'operador-staging')?.profile_id as string;
    expect(profStagingId).toMatch(/^prof-[a-f0-9]{8}$/);

    // Register second environment 'sandbox' WITHOUT any profiles and pointing to a distinct loopback origin
    const sandboxEnv = env.appService.upsertEnvironment({
      projectId,
      name: 'sandbox',
      baseUrl: sandboxStaging.origin,
      tenantMode: 'single',
    });

    // Repro 1: resolveProfileAlias & resolveEffectiveScope MUST NOT leak staging's durable profile into sandbox
    expect(env.appService.resolveProfileAlias(projectId, profStagingId, sandboxEnv.env_id)).toEqual({
      status: 'not_found',
    });
    const crossScopeRes = env.appService.resolveEffectiveScope({
      projectId,
      moduleName: 'portal-pedidos',
      environment: 'sandbox',
      profile: profStagingId,
    });
    expect(crossScopeRes.ok).toBe(false);
    if (!crossScopeRes.ok) {
      expect(crossScopeRes.code).toBe('profile_not_found');
    }

    // Discovery explicitly targeting non-active 'sandbox' must return actionable block without crawling
    const discWrongEnv = await s1.call('qap_discover', {
      name: 'portal-pedidos',
      path: '/app',
      environment: 'sandbox',
      profile: profStagingId,
      allow_spa: true,
    });
    expect(discWrongEnv.isError).toBe(true);
    expect(discWrongEnv.data.status).toBe('blocked');
    expect(discWrongEnv.data.code).toBe('discovery_environment_not_active');
    expect(discWrongEnv.data.active_environment).toBe('staging');
    expect(discWrongEnv.data.requested_environment).toBe('sandbox');
    expect(typeof discWrongEnv.data.question).toBe('string');
    expect(sandboxStaging.visitedRequests.length).toBe(0);

    // Discovery succeeds on active 'staging' with its exclusive profile
    const discStaging = await s1.call('qap_discover', {
      name: 'portal-pedidos',
      path: '/app',
      profile: profStagingId,
      allow_spa: true,
    });
    expect(discStaging.isError, discStaging.rawText).toBe(false);
    const revStaging = discStaging.data.discovery_revision_id as string;
    expect(revStaging).toMatch(/^drev-[a-f0-9]{12}$/);

    // qap_plan on 'sandbox' rejects staging's exclusive durable profile AND staging's discovery revision
    const planSandboxCrossProfile = await s1.call('qap_plan', {
      module: 'portal-pedidos',
      environment: 'sandbox',
      profile: profStagingId,
      case_workflow: { action: 'propose_from_observations' },
    });
    expect(planSandboxCrossProfile.isError).toBe(true);
    expect(planSandboxCrossProfile.data.status).toBe('blocked');
    expect(planSandboxCrossProfile.data.code).toBe('profile_not_found');

    const planSandboxCrossRev = await s1.call('qap_plan', {
      module: 'portal-pedidos',
      environment: 'sandbox',
      discovery_revision_id: revStaging,
      case_workflow: { action: 'propose_from_observations' },
    });
    expect(planSandboxCrossRev.isError).toBe(true);
    expect(planSandboxCrossRev.data.status).toBe('blocked');
    expect(planSandboxCrossRev.data.code).toBe('discovery_revision_out_of_scope');

    // qap_plan on 'sandbox' (no profile, no sandbox dossier) uses sandbox's base_url for navigate steps, NOT staging's base_url
    const planSandboxAuto = await s1.call('qap_plan', {
      module: 'portal-pedidos',
      environment: 'sandbox',
      case_workflow: { action: 'propose_from_observations' },
    });
    expect(planSandboxAuto.isError, planSandboxAuto.rawText).toBe(false);
    expect(planSandboxAuto.data.discovery_revision_id).toBeUndefined();
    expect(planSandboxAuto.data.pending_oracle_cases.length).toBeGreaterThanOrEqual(1);
    const autoSteps = JSON.stringify(planSandboxAuto.data.pending_oracle_cases[0].steps);
    expect(autoSteps).toContain(sandboxStaging.origin);
    expect(autoSteps).not.toContain(staging.origin);

    // Manual proposal with relative URL on 'sandbox' also resolves steps against sandboxStaging.origin
    const planSandboxManual = await s1.call('qap_plan', {
      module: 'portal-pedidos',
      environment: 'sandbox',
      case_workflow: {
        action: 'propose_from_observations',
        proposals: [
          {
            title: 'Consultar pedidos en sandbox',
            expected_outcome: 'La vista responde en sandbox',
            oracle_source: 'user',
            steps: [{ type: 'navigate', url: '/app/orders' }],
          },
        ],
      },
    });
    expect(planSandboxManual.isError, planSandboxManual.rawText).toBe(false);
    expect(planSandboxManual.data.discovery_revision_id).toBeUndefined();
    const manualSteps = JSON.stringify(planSandboxManual.data.pending_oracle_cases[0].steps);
    expect(manualSteps).toContain(`${sandboxStaging.origin}/app/orders`);
    expect(manualSteps).not.toContain(staging.origin);
  }, 45_000);

  it('mantiene vigencia A->B->A en el mismo alcance tras reabrir SQLite sin alterar revisiones inmutables', async () => {
    staging = await startProtectedSpaStaging({ secondaryOrdersPage: true });
    const creds = new TestMemoryCredentialProvider();
    const tempBase = mkdtempSync(join(tmpdir(), 'qap-p02a-aba-'));
    const hostRoot = join(tempBase, 'host');
    const workspaceRoot = join(tempBase, 'workspace-aba');
    mkdirSync(hostRoot, { recursive: true });
    mkdirSync(workspaceRoot, { recursive: true });

    const registryPath = join(hostRoot, 'authorized-workspaces.json');
    const discoveryRegistryPath = join(hostRoot, 'authorized-discoveries.json');
    const authRegistryPath = join(hostRoot, 'authorized-auth.json');
    const workspaceAuthorizer: IWorkspaceAuthorizer = {
      requestAuthorization: vi.fn(async ({ canonicalPath }) => ({
        decision: 'approved' as const,
        root: canonicalPath,
      })),
    };
    const discoveryAuthorizer: IDiscoveryAuthorizer = {
      requestAuthorization: vi.fn(async ({ projectRoot, baseUrl, targetUrl, limits }) => ({
        decision: 'approved' as const,
        root: projectRoot,
        navigationOrigin: new URL(baseUrl).origin,
        targetUrl,
        limits,
      })),
    };
    const authAuthorizer: IAuthAuthorizer = {
      requestAuthorization: vi.fn(async ({ origin, profileLabel }) => ({
        decision: 'approved' as const,
        origin,
        profileLabel,
      })),
    };

    const closers: Array<() => Promise<void> | void> = [];
    disposables.push(async () => {
      while (closers.length > 0) {
        await closers.pop()!();
      }
      rmSync(tempBase, { recursive: true, force: true });
    });

    const openSession = async () => {
      const appService = new QapApplicationService({ hostRootDir: hostRoot, credentialProvider: creds });
      const bootstrap = new WorkspaceBootstrap(hostRoot, appService);
      const server = createMcpServer({
        workspaceBootstrap: bootstrap,
        applicationService: bootstrap.appService,
        workspaceAuthorizer,
        hostRegistryPath: registryPath,
        discoveryAuthorizer,
        hostDiscoveryRegistryPath: discoveryRegistryPath,
        authAuthorizer,
        hostAuthRegistryPath: authRegistryPath,
        allowSpaReadOnly: true,
      });
      const client = new Client({ name: 'p02a-aba-client', version: '1.0.0' });
      const [t1, t2] = InMemoryTransport.createLinkedPair();
      await Promise.all([server.connect(t1), client.connect(t2)]);

      const closeAll = async () => {
        await client.close();
        await server.close();
        bootstrap.close();
        appService.close();
      };
      closers.push(closeAll);

      const call = async (name: string, args: Record<string, unknown> = {}) => {
        const res = await client.callTool({
          name,
          arguments: { targetPath: workspaceRoot, ...args },
        });
        const text = (res.content[0] as { type: string; text: string })?.text ?? '{}';
        return {
          isError: Boolean(res.isError),
          rawText: text,
          data: JSON.parse(text) as Record<string, any>,
        };
      };

      return { appService, call, closeAll };
    };

    const s1 = await openSession();
    const createRes = await s1.call('qap_project', {
      action: 'create',
      name: 'Vigencia ABA',
      canonical_root: workspaceRoot,
      base_url: staging.origin,
      env_name: 'staging',
      tenant_mode: 'single',
      objective: 'Comprobar vigencia A->B->A en el expediente.',
    });
    expect(createRes.isError, createRes.rawText).toBe(false);
    const projectId = createRes.data.project.project_id as string;

    await s1.call('qap_context_set', {
      base_url: staging.origin,
      objective: 'Validar transiciones de vigencia en /app/orders.',
      roles: [{ name: 'operador', source: 'user' }],
      critical_flows: [{ name: 'Ordenes', source: 'user' }],
      source_of_truth: { type: 'none', declared: true, source: 'user' },
    });

    const authRes = await s1.call('qap_auth_add', {
      profile: 'operador-staging',
      username: 'qa.operator',
      password: 'StagingPass#2026',
      role: 'operador',
      login_route: '/login',
    });
    expect(authRes.isError, authRes.rawText).toBe(false);

    // 1. Observe state A (v1) -> revA
    staging.setOrdersVariant('v1');
    const discA1 = await s1.call('qap_discover', {
      name: 'portal-pedidos',
      description: 'Ordenes SPA',
      path: '/app/orders',
      profile: 'operador-staging',
      allow_spa: true,
    });
    expect(discA1.isError, discA1.rawText).toBe(false);
    const revA = discA1.data.discovery_revision_id as string;
    const docRel = discA1.data.discovery_dossier.module_doc_path as string;
    const originalCreatedAtA = s1.appService.getDiscoveryRevision(revA)!.created_at;

    // 2. Observe state B (v2) -> revB (distinct)
    staging.setOrdersVariant('v2');
    const discB = await s1.call('qap_discover', {
      name: 'portal-pedidos',
      description: 'Ordenes SPA',
      path: '/app/orders',
      profile: 'operador-staging',
      allow_spa: true,
    });
    expect(discB.isError, discB.rawText).toBe(false);
    const revB = discB.data.discovery_revision_id as string;
    expect(revB).not.toBe(revA);
    expect(discB.data.discovery_reused).toBe(false);

    // 3. Revert to state A (v1) and observe again -> reuses revA AND sets active head back to revA
    staging.setOrdersVariant('v1');
    const discA2 = await s1.call('qap_discover', {
      name: 'portal-pedidos',
      description: 'Ordenes SPA',
      path: '/app/orders',
      profile: 'operador-staging',
      allow_spa: true,
    });
    expect(discA2.isError, discA2.rawText).toBe(false);
    expect(discA2.data.discovery_revision_id).toBe(revA);
    expect(discA2.data.discovery_reused).toBe(true);

    // Close BOTH MCP server and SQLite/ApplicationService, delete Markdown on disk, and reopen fresh
    await s1.closeAll();
    const indexPath = join(workspaceRoot, '.qa', 'discovery', 'INDEX.md');
    const docPath = join(workspaceRoot, ...docRel.split('/'));
    expect(readFileSync(indexPath, 'utf8')).toContain(revA);
    expect(readFileSync(indexPath, 'utf8')).not.toContain(revB);
    rmSync(join(workspaceRoot, '.qa', 'discovery'), { recursive: true, force: true });

    const s2 = await openSession();

    // Immutable created_at of revA was NOT mutated; revB remains in history
    expect(s2.appService.getDiscoveryRevision(revA)!.created_at).toBe(originalCreatedAtA);

    // Read-only consultation of historical revB keeps INDEX pointing to published revA without touching disk
    const histB = await s2.call('qap_project', {
      action: 'discovery_dossier',
      project_id: projectId,
      module_key: 'portal-pedidos',
      revision_id: revB,
    });
    expect(histB.isError, histB.rawText).toBe(false);
    expect(histB.data.read_only).toBe(true);
    expect(histB.data.selected_revision.revision_id).toBe(revB);
    expect(histB.data.revisions.map((r: { revision_id: string }) => r.revision_id)).toEqual(
      expect.arrayContaining([revA, revB]),
    );
    expect(histB.data.index_markdown).toContain(revA);
    expect(histB.data.index_markdown).not.toContain(revB);
    expect(histB.data.published_revisions[0].revision_id).toBe(revA);
    expect(existsSync(indexPath)).toBe(false);

    // Regeneration restores INDEX.md and scope page pointing to active head revA
    const regen = await s2.call('qap_project', {
      action: 'discovery_dossier_regenerate',
      project_id: projectId,
    });
    expect(regen.isError, regen.rawText).toBe(false);
    expect(existsSync(indexPath)).toBe(true);
    expect(existsSync(docPath)).toBe(true);
    expect(readFileSync(indexPath, 'utf8')).toContain(revA);
    expect(readFileSync(docPath, 'utf8')).toContain(revA);

    // Implicit planning selects active revA (v1, without v2 'buscar' control), NOT revB
    const planImplicitAfterABA = await s2.call('qap_plan', {
      module: 'portal-pedidos',
      profile: 'operador-staging',
      case_workflow: { action: 'propose_from_observations' },
    });
    expect(planImplicitAfterABA.isError, planImplicitAfterABA.rawText).toBe(false);
    expect(planImplicitAfterABA.data.discovery_revision_id).toBe(revA);
    expect(planImplicitAfterABA.data.pending_oracle_cases[0].observation.observed_controls).not.toContain('buscar');
  }, 60_000);
});
