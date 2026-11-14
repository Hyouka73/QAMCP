import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CredentialProvider, CredentialReference } from '@qap/shared';

import { QapApplicationService } from '../application/application-service.js';
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

describe('Bloque 2 — Entrada conversacional, autenticación duradera, ingesta con procedencia y Discovery SPA protegido', () => {
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
    const tempBase = mkdtempSync(join(tmpdir(), 'qap-block2-'));
    const hostRoot = join(tempBase, 'host');
    const workspaceRoot = join(tempBase, 'workspace-staging');
    mkdirSync(hostRoot, { recursive: true });
    mkdirSync(workspaceRoot, { recursive: true });

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
      const client = new Client({ name: 'block2-test-client', version: '1.0.0' });
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
      appService,
      bootstrap,
      workspaceAuthorizer,
      discoveryAuthorizer,
      authAuthorizer,
      connectServer,
    };
  }

  it('Completes conversational onboarding, protected login, SPA read-only discovery, resume after restart, and candidate promotion without seeded bindings or technical leaks', async () => {
    staging = await startProtectedSpaStaging();
    const creds = new TestMemoryCredentialProvider();
    const env = makeHostEnv(creds);

    // 1. Conversation start: "Quiero probar un sistema" -> qap_status authorizes workspace via Windows host authorizer
    const session1 = await env.connectServer();
    const initStatus = await session1.call('qap_status');
    expect(initStatus.isError).toBe(false);
    expect(initStatus.data.initialized).toBe(true);
    expect(initStatus.data.fase).toBe('ONBOARDING');
    expect(initStatus.data.project_id).toBeTruthy();
    expect(env.workspaceAuthorizer.requestAuthorization).toHaveBeenCalledTimes(1);
    // Conversational output must not expose CLI, manifests, cookies, or CSS selectors
    expect(initStatus.rawText).not.toMatch(/profiles\.json|qap-provision-host|document\.cookie|input\[type=/i);

    // 2. QA sets staging destination & objective -> transitions to SCOPING
    const ctxRes = await session1.call('qap_context_set', {
      base_url: staging.origin,
      objective: 'Verificar pedidos y reportes en el portal SPA de staging.',
      roles: [{ name: 'operador', source: 'user' }],
      critical_flows: [{ name: 'Consultar pedidos', source: 'user' }],
      source_of_truth: { type: 'none', declared: true, source: 'user' },
    });
    expect(ctxRes.isError).toBe(false);
    expect(ctxRes.data.fase).toBe('SCOPING');

    // 3. Interrupt and simulate process restart: reopen fresh MCP client & server on same hostRoot
    await session1.client.close();
    await session1.server.close();

    const session2 = await env.connectServer();
    const resumedStatus = await session2.call('qap_status');
    expect(resumedStatus.isError).toBe(false);
    expect(resumedStatus.data.project_id).toBe(initStatus.data.project_id);
    expect(resumedStatus.data.fase).toBe('SCOPING');
    expect(env.workspaceAuthorizer.requestAuthorization).toHaveBeenCalledTimes(1);

    // 4. Protected authentication via interactive auth authorizer & safe credential provider
    const authRes = await session2.call('qap_auth_add', {
      profile: 'operador-staging',
      username: 'qa.operator',
      password: 'StagingPass#2026',
      role: 'operador',
      login_route: '/login',
    });
    expect(authRes.isError).toBe(false);
    expect(authRes.data.status).toBe('success');
    expect(authRes.data.profile.verified).toBe(true);
    expect(authRes.data.message).not.toContain('profiles.json');
    expect(env.authAuthorizer.requestAuthorization).toHaveBeenCalledTimes(1);
    // Credentials stored in host CredentialProvider, NOT plaintext on profiles.json
    expect(creds.entries.size).toBe(1);
    const profilesOnDisk = readFileSync(join(env.workspaceRoot, '.qa', 'project', 'auth', 'profiles.json'), 'utf8');
    expect(profilesOnDisk).not.toContain('StagingPass#2026');

    // 5. Discovery on protected SPA view (/app) in strict GET-only SPA mode
    const discRes = await session2.call('qap_discover', {
      name: 'portal-pedidos',
      description: 'Portal SPA Protegido de Pedidos',
      path: '/app',
      profile: 'operador-staging',
      allow_spa: true,
    });
    expect(discRes.isError, discRes.rawText).toBe(false);
    expect(['completed', 'partial']).toContain(discRes.data.status);
    expect(discRes.data.acquisition_persistence).toBe('committed');
    expect(discRes.data.mode).toBe('fresh_authenticated_spa_readonly');
    expect(discRes.data.module_identity_status).toBe('candidate_persisted');
    expect(discRes.data.partial_inventory_id).toBeTruthy();
    expect(Array.isArray(discRes.data.reviewable_candidates)).toBe(true);
    expect(discRes.data.reviewable_candidates.length).toBeGreaterThanOrEqual(1);
    // SPA rendered dynamic controls (order search input + filter button) and triggered zero mutations
    expect(discRes.data.observations).toBeGreaterThanOrEqual(1);
    expect(staging.mutatingRequests).toHaveLength(0);

    // 6. Restart again and verify recovered profile + partial inventory + reviewable candidates persist
    await session2.client.close();
    await session2.server.close();

    const session3 = await env.connectServer();
    const listProfiles = await session3.call('qap_auth_list');
    expect(listProfiles.data.count).toBe(1);
    expect(listProfiles.data.profiles[0]).toMatchObject({
      id: 'operador-staging',
      status: 'verified',
      needs_revalidation: false,
    });

    const candidatesRes = await session3.call('qap_project', {
      action: 'candidates',
      project_id: initStatus.data.project_id,
    });
    expect(candidatesRes.isError).toBe(false);
    expect(candidatesRes.data.candidates.length).toBeGreaterThanOrEqual(1);
    const cand = candidatesRes.data.candidates[0];

    // 7. Review candidate & promote via conversational qap_session_plan WITHOUT seeded moduleBindings
    const reviewRes = await session3.call('qap_project', {
      action: 'review_candidate',
      project_id: initStatus.data.project_id,
      candidate_id: cand.candidate_id,
      candidate_decision: 'approved',
    });
    expect(reviewRes.data.candidate.status).toBe('approved');

    const planRes = await session3.call('qap_session_plan', {
      desde_candidatos: [cand.candidate_id],
      adicionales: [{ module: 'pedidos', path: '/app/orders', priority: 'medium' }],
      auth: {
        required: true,
        source: 'user',
        method: 'credentials',
        roles: ['operador'],
        profile: 'operador-staging',
      },
    });
    expect(planRes.isError).toBe(false);
    expect(planRes.data.fase).toBe('WORKING');
    expect(planRes.data.modules_registered.length).toBeGreaterThanOrEqual(1);
    expect(planRes.data.modules_registered[0].key).toBe(cand.key);

    const nextRoute = await session3.call('qap_status');
    expect(nextRoute.data.siguiente_accion).toMatchObject({
      tipo: 'trabajo', tool: 'qap_discover', parametros: { name: 'pedidos', path: '/app/orders' },
    });
    const nextDiscovery = await session3.call('qap_discover', nextRoute.data.siguiente_accion.parametros);
    expect(nextDiscovery.data.acquisition_persistence, nextDiscovery.rawText).toBe('committed');
    expect(nextDiscovery.data.reviewable_candidates).toEqual([]);
    expect(env.discoveryAuthorizer.requestAuthorization).toHaveBeenCalledTimes(1);
    expect(staging.mutatingRequests).toHaveLength(0);

    const nextPlan = await session3.call('qap_status');
    expect(nextPlan.data.pending_decision).toBeNull();
    expect(nextPlan.data.siguiente_accion).toMatchObject({
      tipo: 'trabajo', tool: 'qap_plan', parametros: { module: cand.title, case_workflow: { action: 'propose_from_observations' } },
    });
    const proposed = await session3.call('qap_plan', nextPlan.data.siguiente_accion.parametros);
    expect(proposed.data.status, proposed.rawText).toBe('proposed');
    expect(proposed.data.pending_oracle_cases[0].observation.evidence_refs).toEqual(cand.evidence_refs);
    expect((await session3.call('qap_status')).data.siguiente_accion).toMatchObject({
      tipo: 'trabajo', tool: 'qap_plan', parametros: { module: 'pedidos' },
    });
  }, 45_000);

  it('Never downgrades a protected session to anonymous on expiry and forces revalidation cleanly', async () => {
    staging = await startProtectedSpaStaging();
    const creds = new TestMemoryCredentialProvider();
    const env = makeHostEnv(creds);
    const { call } = await env.connectServer();

    const st = await call('qap_status');
    const projectId = st.data.project_id as string;
    await call('qap_context_set', {
      base_url: staging.origin,
      objective: 'Probar vistas protegidas sin degradar sesión.',
      roles: [{ name: 'operador', source: 'user' }],
      critical_flows: [{ name: 'Ver pedidos', source: 'user' }],
      source_of_truth: { type: 'none', declared: true, source: 'user' },
    });

    const authOk = await call('qap_auth_add', {
      profile: 'operador-staging',
      username: 'qa.operator',
      password: 'StagingPass#2026',
      role: 'operador',
      login_route: '/login',
    });
    expect(authOk.data.profile.verified).toBe(true);

    // Expire session server-side & in service
    staging.setSessionExpired(true);

    // Attempting protected discovery MUST fail closed and MUST NOT degrade to anonymous!
    const discBlocked = await call('qap_discover', {
      name: 'portal-pedidos',
      path: '/app',
      profile: 'operador-staging',
      allow_spa: true,
    });
    expect(discBlocked.data.status, discBlocked.rawText).toBe('blocked');
    expect(discBlocked.data.downgraded_to_anonymous).toBe(false);

    // Auth list and status both report revalidation needed cleanly
    const authListAfter = await call('qap_auth_list');
    expect(authListAfter.data.profiles[0]).toMatchObject({
      id: 'operador-staging',
      status: 'expired',
      needs_revalidation: true,
    });

    const statusAfter = await call('qap_status');
    expect(statusAfter.data.auth_revalidation_needed).toBe(true);
    expect(statusAfter.data.recovered_profiles[0].downgraded_to_anonymous).toBe(false);

    // Re-authenticate cleanly and resume protected SPA discovery
    staging.setSessionExpired(false);
    const reAuth = await call('qap_auth_add', {
      profile: 'operador-staging',
      username: 'qa.operator',
      password: 'StagingPass#2026',
      role: 'operador',
      login_route: '/login',
    });
    expect(reAuth.data.profile.verified).toBe(true);

    const discRecovered = await call('qap_discover', {
      name: 'portal-pedidos',
      path: '/app',
      profile: 'operador-staging',
      allow_spa: true,
    });
    expect(discRecovered.isError, discRecovered.rawText).toBe(false);
    expect(['completed', 'partial']).toContain(discRecovered.data.status);
    expect(discRecovered.data.acquisition_persistence).toBe('committed');
    expect(discRecovered.data.mode).toBe('fresh_authenticated_spa_readonly');
    expect(projectId).toBeTruthy();
  }, 45_000);

  it('Tracks text/Markdown provenance and discrepancies, enforces format limits, and blocks ambiguous multi-tenant scopes', async () => {
    staging = await startProtectedSpaStaging();
    staging.setRequireTenant(true, ['tenant-acme', 'tenant-beta']);
    const creds = new TestMemoryCredentialProvider();
    const env = makeHostEnv(creds);
    const { call } = await env.connectServer();
    const { workspaceRoot } = env;

    const st = await call('qap_status');
    const projectId = st.data.project_id as string;

    await call('qap_context_set', {
      base_url: staging.origin,
      objective: 'Validar facturación del tenant Acme.',
      roles: [{ name: 'operador', source: 'user' }],
      critical_flows: [{ name: 'Emitir factura', source: 'user' }],
      source_of_truth: { type: 'none', declared: true, source: 'user' },
    });

    // Reject unsupported formats (.pdf) with explicit format_limits
    writeFileSync(join(workspaceRoot, 'spec.pdf'), '%PDF-1.4 fake binary', 'utf8');
    const pdfReject = await call('qap_context_ingest', { docPath: 'spec.pdf' });
    expect(pdfReject.isError).toBe(true);
    expect(pdfReject.data.code).toBe('unsupported_document_format');
    expect(pdfReject.data.format_limits.supported_doc_formats).toContain('.md');
    expect(pdfReject.data.format_limits.supported_doc_formats).toContain('.txt');

    // Ingest Markdown containing conflicting base_url, conflicting objective, and multi-tenant mention
    writeFileSync(
      join(workspaceRoot, 'alcance.md'),
      [
        '# Objetivo',
        'Administrar catálogo público de ecommerce en otro entorno.',
        '',
        'Entorno alternativo: http://otro-staging.local:9000',
        'Arquitectura multi-tenant con aislamiento por empresa.',
        '',
        '## Rutas',
        '- /app/orders',
      ].join('\n'),
      'utf8',
    );
    const ingestRes = await call('qap_context_ingest', { docPath: 'alcance.md' });
    expect(ingestRes.isError).toBe(false);
    expect(ingestRes.data.provenance).toMatchObject({
      source_ref: 'alcance.md',
      format: 'md',
    });
    expect(ingestRes.data.provenance.sha256).toHaveLength(64);
    expect(ingestRes.data.discrepancies.length).toBeGreaterThanOrEqual(2);
    expect(ingestRes.data.discrepancies.some((d: { field: string }) => d.field === 'base_url')).toBe(true);
    expect(ingestRes.data.discrepancies.some((d: { field: string }) => d.field === 'objective')).toBe(true);

    // User-declared objective was NOT silently overwritten
    const resumeStatus = await call('qap_status');
    expect(resumeStatus.data.discrepancies.length).toBeGreaterThanOrEqual(2);

    // Resolve first discrepancy via qap_project
    const firstDisc = resumeStatus.data.discrepancies[0];
    const resolved = await call('qap_project', {
      action: 'resolve_discrepancy',
      project_id: projectId,
      discrepancy_id: firstDisc.discrepancy_id,
      discrepancy_choice: 'kept_source_a',
    });
    expect(resolved.data.discrepancy.resolution_status).toBe('kept_source_a');

    // Switch project environment to multi_tenant with NO default tenant -> ambiguous scope must block!
    env.appService.upsertEnvironment({
      projectId,
      name: 'local',
      baseUrl: staging.origin,
      tenantMode: 'multi_tenant',
    });

    const ambiguousPlan = await call('qap_session_plan', {
      modules: [{ module: 'orders', path: '/app/orders', priority: 'high' }],
    });
    expect(ambiguousPlan.isError).toBe(true);
    expect(ambiguousPlan.data.code).toBe('ambiguous_tenant_scope');

    const ambiguousAuth = await call('qap_auth_add', {
      profile: 'operador-staging',
      username: 'qa.operator',
      password: 'StagingPass#2026',
      role: 'operador',
      login_route: '/login',
    });
    expect(ambiguousAuth.isError).toBe(true);
    expect(ambiguousAuth.data.code).toBe('ambiguous_tenant_scope');

    // Supplying explicit tenant_id resolves ambiguity cleanly
    const explicitAuth = await call('qap_auth_add', {
      profile: 'operador-staging',
      username: 'qa.operator',
      password: 'StagingPass#2026',
      role: 'operador',
      tenant_id: 'tenant-acme',
      login_route: '/login',
    });
    expect(explicitAuth.isError).toBe(false);
    expect(explicitAuth.data.profile.tenant_id).toBe('tenant-acme');

    const explicitPlan = await call('qap_session_plan', {
      tenant_id: 'tenant-acme',
      modules: [{ module: 'orders', path: '/app/orders', priority: 'high' }],
    });
    expect(explicitPlan.isError).toBe(false);
    expect(explicitPlan.data.tenant_id).toBe('tenant-acme');
  }, 45_000);
});
