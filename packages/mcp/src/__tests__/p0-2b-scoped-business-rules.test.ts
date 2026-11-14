import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { tmpdir } from 'node:os';
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

async function callJson(client: Client, name: string, args: Record<string, unknown>) {
  const res = await client.callTool({ name, arguments: args });
  const text = (res.content as Array<{ type: string; text?: string }>)[0]?.text ?? '{}';
  return {
    isError: Boolean(res.isError),
    data: JSON.parse(text) as Record<string, unknown>,
  };
}

async function ingestWorkspaceDoc(
  client: Client,
  workspaceRoot: string,
  relPath: string,
  content: string,
) {
  const absPath = join(workspaceRoot, relPath);
  mkdirSync(dirname(absPath), { recursive: true });
  writeFileSync(absPath, content, 'utf8');
  return callJson(client, 'qap_context_ingest', {
    targetPath: workspaceRoot,
    docPath: relPath,
  });
}

describe('P0.2b — Fuentes de reglas de negocio por alcance en Discovery', () => {
  const disposables: Array<() => Promise<void> | void> = [];
  let staging: ProtectedSpaStagingController | undefined;

  afterEach(async () => {
    if (staging) {
      await staging.close();
      staging = undefined;
    }
    while (disposables.length > 0) {
      const fn = disposables.pop()!;
      await fn();
    }
  }, 30_000);

  function createHarness(credentialProvider: CredentialProvider) {
    const tempBase = mkdtempSync(join(tmpdir(), 'qap-p02b-'));
    const hostRoot = join(tempBase, 'host');
    const workspaceRoot = join(tempBase, 'workspace-staging');
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

    const activeStacks: Array<{ close: () => Promise<void> }> = [];

    const openStack = async (overrides: Partial<McpServerOptions> = {}) => {
      const appService = new QapApplicationService({ hostRootDir: hostRoot, credentialProvider });
      const bootstrap = new WorkspaceBootstrap(hostRoot, appService);
      const server = createMcpServer({
        applicationService: bootstrap.appService,
        workspaceBootstrap: bootstrap,
        workspaceAuthorizer,
        hostRegistryPath: registryPath,
        discoveryAuthorizer,
        hostDiscoveryRegistryPath: discoveryRegistryPath,
        authAuthorizer,
        hostAuthRegistryPath: authRegistryPath,
        allowSpaReadOnly: true,
        ...overrides,
      });
      const [ct, st] = InMemoryTransport.createLinkedPair();
      await server.connect(st);
      const client = new Client({ name: 'p02b-test-client', version: '1.0.0' }, { capabilities: {} });
      await client.connect(ct);
      let closed = false;
      const handle = {
        appService,
        client,
        close: async () => {
          if (closed) return;
          closed = true;
          try { await client.close(); } catch { /* ignore */ }
          try { await server.close(); } catch { /* ignore */ }
          bootstrap.close();
          appService.close();
        },
      };
      activeStacks.push(handle);
      return handle;
    };

    disposables.push(async () => {
      for (const s of activeStacks) {
        await s.close();
      }
      rmSync(tempBase, { recursive: true, force: true });
    });

    return { workspaceRoot, openStack };
  }

  async function setupMultiTenantProject(
    client: Client,
    workspaceRoot: string,
    origin: string,
  ) {
    const createRes = await callJson(client, 'qap_project', {
      action: 'create',
      name: 'Portal Pedidos P0.2b',
      canonical_root: workspaceRoot,
      base_url: origin,
      env_name: 'staging',
      tenant_mode: 'multi_tenant',
      default_tenant: 'tenant-a',
      objective: 'Validar reglas de negocio por alcance multi-tenant y rol en staging',
    });
    expect(createRes.isError, JSON.stringify(createRes.data)).toBe(false);

    const ctxRes = await callJson(client, 'qap_context_set', {
      targetPath: workspaceRoot,
      objective: 'Validar reglas de negocio por alcance multi-tenant y rol en staging',
      base_url: origin,
      roles: [
        { name: 'operador', source: 'user' },
        { name: 'auditor', source: 'user' },
      ],
      critical_flows: [{ name: 'Consultar pedidos', source: 'user' }],
      source_of_truth: { type: 'none', declared: true, source: 'user' },
    });
    expect(ctxRes.isError, JSON.stringify(ctxRes.data)).toBe(false);

    const authA = await callJson(client, 'qap_auth_add', {
      targetPath: workspaceRoot,
      environment: 'staging',
      tenant_id: 'tenant-a',
      profile: 'op-a',
      role: 'operador',
      username: 'qa.tenant_a',
      password: 'TenantAPass#2026',
      login_route: '/login',
    });
    expect(authA.isError, JSON.stringify(authA.data)).toBe(false);

    const authB = await callJson(client, 'qap_auth_add', {
      targetPath: workspaceRoot,
      environment: 'staging',
      tenant_id: 'tenant-b',
      profile: 'aud-b',
      role: 'auditor',
      username: 'qa.tenant_b',
      password: 'TenantBPass#2026',
      login_route: '/login',
    });
    expect(authB.isError, JSON.stringify(authB.data)).toBe(false);

    const planRes = await callJson(client, 'qap_session_plan', {
      targetPath: workspaceRoot,
      tenant_id: 'tenant-a',
      modules: [{ module: 'pedidos', path: '/app', priority: 'high', flujos: ['Panel de pedidos'] }],
      auth: { required: true, method: 'credentials', roles: ['operador', 'auditor'], profile: 'op-a' },
    });
    expect(planRes.isError, JSON.stringify(planRes.data)).toBe(false);
  }

  it('aisla reglas acreditadas por (tenant, rol) en la misma ruta, aplica general compatible, excluye general sin alcance y separa DOM descriptivo', async () => {
    staging = await startProtectedSpaStaging({ secondaryOrdersPage: true });
    staging.setRequireTenant(true, ['tenant-a', 'tenant-b']);
    const creds = new TestMemoryCredentialProvider();
    const { workspaceRoot, openStack } = createHarness(creds);
    const stack = await openStack();
    disposables.push(() => stack.close());

    await setupMultiTenantProject(stack.client, workspaceRoot, staging.origin);

    // 1. Versioned scoped doc for tenant-a / operador
    const docTenantA = [
      'Version: 2.1.0',
      'Scope: environment=staging, tenant=tenant-a, role=operador',
      'Module: pedidos',
      'Status: accredited',
      '',
      '### Rule: Limite de reembolso Operador A',
      'Rule-Key: refund_limit',
      'Route: /app',
      'Expected: Límite máximo de reembolso Operador A: USD 5000',
      'Selector: #spa-shell',
      'Assert: contains',
    ].join('\n');
    const ingA = await ingestWorkspaceDoc(stack.client, workspaceRoot, 'docs/reglas-tenant-a.md', docTenantA);
    expect(ingA.isError, JSON.stringify(ingA.data)).toBe(false);
    expect((ingA.data.provenance as { scoped_rules_count: number }).scoped_rules_count).toBe(1);

    // 2. Versioned scoped doc for tenant-b / auditor (same route /app, different value)
    const docTenantB = [
      'Version: 1.4.0',
      'Scope: environment=staging, tenant=tenant-b, role=auditor',
      'Module: pedidos',
      'Status: accredited',
      '',
      '### Rule: Limite de reembolso Auditor B',
      'Rule-Key: refund_limit',
      'Route: /app',
      'Expected: Límite máximo Auditor B: USD 25000',
      'Selector: #spa-shell',
      'Assert: contains',
    ].join('\n');
    const ingB = await ingestWorkspaceDoc(stack.client, workspaceRoot, 'docs/reglas-tenant-b.md', docTenantB);
    expect(ingB.isError, JSON.stringify(ingB.data)).toBe(false);

    // 3. Compatible general doc (declares staging, tenant=*, role=*)
    const docGeneralCompatible = [
      'Version: 3.0.0',
      'Scope: general compatible (environment=staging, tenant=*, role=*)',
      'Module: pedidos',
      'Route: /app',
      'Status: accredited',
      '',
      '- [RULE key=audit_banner] Aviso auditoría staging: Toda consulta queda registrada en auditoría',
    ].join('\n');
    expect((await ingestWorkspaceDoc(stack.client, workspaceRoot, 'docs/general-compatible.md', docGeneralCompatible)).isError).toBe(false);

    // 4. Unscoped general doc (NO compatible scope declared -> must NOT apply silently)
    const docGeneralUnscoped = [
      '# Política general sin alcance',
      'Objetivo: Portal de pedidos',
      'Cualquier usuario puede aprobar devoluciones ilimitadas.',
    ].join('\n');
    expect((await ingestWorkspaceDoc(stack.client, workspaceRoot, 'docs/general-sin-scope.md', docGeneralUnscoped)).isError).toBe(false);

    // Discovery for tenant-a / operador
    const discA = await callJson(stack.client, 'qap_discover', {
      targetPath: workspaceRoot,
      name: 'pedidos',
      path: '/app',
      environment: 'staging',
      tenant_id: 'tenant-a',
      profile: 'op-a',
      allow_spa: true,
    });
    expect(discA.isError, JSON.stringify(discA.data)).toBe(false);
    const revA = String(discA.data.discovery_revision_id);
    const dossierResA = await callJson(stack.client, 'qap_project', {
      action: 'discovery_dossier',
      targetPath: workspaceRoot,
      module_key: 'pedidos',
      revision_id: revA,
    });
    expect(dossierResA.isError, JSON.stringify(dossierResA.data)).toBe(false);
    const revRecordA = dossierResA.data.selected_revision as {
      dossier: {
        rule_resolution: {
          decisions: Array<{ rule_key: string; decision_status: string; expected_outcome?: string; source_ref?: string; source_version?: string; scope_match?: string }>;
          excluded_sources: Array<{ source_ref: string; reason: string }>;
          observed_evidence_notes: Array<{ authority: string }>;
          summary: { accredited_count: number };
        };
      };
    };
    const rrA = revRecordA.dossier.rule_resolution;
    expect(rrA.summary.accredited_count).toBe(2);
    const refundA = rrA.decisions.find((d) => d.rule_key === 'refund_limit');
    expect(refundA).toMatchObject({
      decision_status: 'accredited',
      expected_outcome: 'Límite máximo de reembolso Operador A: USD 5000',
      source_ref: 'docs/reglas-tenant-a.md',
      source_version: '2.1.0',
      scope_match: 'exact',
    });
    const generalA = rrA.decisions.find((d) => d.rule_key === 'audit_banner');
    expect(generalA).toMatchObject({
      decision_status: 'accredited',
      source_ref: 'docs/general-compatible.md',
      source_version: '3.0.0',
      scope_match: 'general_compatible',
    });
    expect(rrA.excluded_sources.some((e) => e.source_ref === 'docs/reglas-tenant-b.md' && e.reason === 'out_of_scope_tenant')).toBe(true);
    expect(rrA.excluded_sources.some((e) => e.source_ref === 'docs/general-sin-scope.md' && e.reason === 'unscoped_general_doc')).toBe(true);
    expect(rrA.observed_evidence_notes.length).toBeGreaterThanOrEqual(1);
    expect(rrA.observed_evidence_notes.every((n) => n.authority === 'observed_only')).toBe(true);

    // Markdown checks for tenant-a
    const mdA = readFileSync(join(workspaceRoot, String(dossierResA.data.module_doc_path)), 'utf8');
    expect(mdA).toContain('## Reglas de negocio por alcance, decisiones y ambigüedades');
    expect(mdA).toContain('docs/reglas-tenant-a.md');
    expect(mdA).toContain('2.1.0');
    expect(mdA).toContain('observed_only');
    expect(mdA).toContain('out_of_scope_tenant');

    // Discovery for tenant-b / auditor on SAME route /app
    const discB = await callJson(stack.client, 'qap_discover', {
      targetPath: workspaceRoot,
      name: 'pedidos',
      path: '/app',
      environment: 'staging',
      tenant_id: 'tenant-b',
      profile: 'aud-b',
      allow_spa: true,
    });
    expect(discB.isError, JSON.stringify(discB.data)).toBe(false);
    const revB = String(discB.data.discovery_revision_id);
    expect(revB).not.toBe(revA);

    // Plan for tenant-a must produce ONLY tenant-a's values + compatible general, never tenant-b's
    const planA = await callJson(stack.client, 'qap_plan', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      environment: 'staging',
      tenant_id: 'tenant-a',
      profile: 'op-a',
      discovery_revision_id: revA,
      case_workflow: { action: 'propose_from_observations' },
    });
    expect(planA.isError).toBe(false);
    const proposedA = planA.data.proposed_cases as Array<{ expectation: { expected_outcome: string; source: string } }>;
    expect(proposedA.map((c) => c.expectation.expected_outcome)).toContain('Límite máximo de reembolso Operador A: USD 5000');
    expect(proposedA.map((c) => c.expectation.expected_outcome)).not.toContain('Límite máximo Auditor B: USD 25000');
    expect(proposedA.every((c) => c.expectation.source === 'ingested_doc')).toBe(true);

    // Plan for tenant-b must produce tenant-b's value USD 25000, never USD 5000
    const planB = await callJson(stack.client, 'qap_plan', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      environment: 'staging',
      tenant_id: 'tenant-b',
      profile: 'aud-b',
      discovery_revision_id: revB,
      case_workflow: { action: 'propose_from_observations' },
    });
    expect(planB.isError).toBe(false);
    const proposedB = planB.data.proposed_cases as Array<{ expectation: { expected_outcome: string } }>;
    expect(proposedB.map((c) => c.expectation.expected_outcome)).toContain('Límite máximo Auditor B: USD 25000');
    expect(proposedB.map((c) => c.expectation.expected_outcome)).not.toContain('Límite máximo de reembolso Operador A: USD 5000');
  }, 60_000);

  it('mantiene pendientes las contradicciones de igual autoridad, expectativas sin acreditar y requisitos legacy sin scope sin generar oráculos, aplicando precedencia explícita', async () => {
    staging = await startProtectedSpaStaging();
    staging.setRequireTenant(true, ['tenant-a']);
    const creds = new TestMemoryCredentialProvider();
    const { workspaceRoot, openStack } = createHarness(creds);
    const stack = await openStack();
    disposables.push(() => stack.close());

    await setupMultiTenantProject(stack.client, workspaceRoot, staging.origin);
    const project = stack.appService.findActiveProjectByRoot(workspaceRoot)!;

    // Contradiction of equal authority: two accredited ingested docs on same scope & rule_key
    expect((await ingestWorkspaceDoc(
      stack.client,
      workspaceRoot,
      'docs/finanzas-cutoff.md',
      [
        'Version: 1.0.0',
        'Scope: environment=staging, tenant=tenant-a, role=operador',
        'Module: pedidos',
        'Route: /app',
        'Status: accredited',
        '- [RULE key=cutoff_hour] Horario de corte: Cierre diario a las 17:00 UTC',
      ].join('\n'),
    )).isError).toBe(false);
    expect((await ingestWorkspaceDoc(
      stack.client,
      workspaceRoot,
      'docs/operaciones-cutoff.md',
      [
        'Version: 1.0.0',
        'Scope: environment=staging, tenant=tenant-a, role=operador',
        'Module: pedidos',
        'Route: /app',
        'Status: accredited',
        '- [RULE key=cutoff_hour] Horario de corte: Cierre diario a las 19:00 UTC',
      ].join('\n'),
    )).isError).toBe(false);

    // Unaccredited claim
    expect((await ingestWorkspaceDoc(
      stack.client,
      workspaceRoot,
      'docs/borrador-archivo.md',
      [
        'Version: 0.1.0-draft',
        'Scope: environment=staging, tenant=tenant-a, role=operador',
        'Module: pedidos',
        'Route: /app',
        'Status: unaccredited',
        '- [RULE key=auto_archive] Archivado automático: Archivar pedidos tras 7 días',
      ].join('\n'),
    )).isError).toBe(false);

    // Lower-precedence general compatible doc for sla_badge
    expect((await ingestWorkspaceDoc(
      stack.client,
      workspaceRoot,
      'docs/general-sla.md',
      [
        'Version: 1.0.0',
        'Scope: general compatible (environment=staging, tenant=*, role=*)',
        'Module: pedidos',
        'Route: /app',
        'Status: accredited',
        '- [RULE key=sla_badge] Etiqueta SLA: SLA estándar 48h',
      ].join('\n'),
    )).isError).toBe(false);

    // Higher-precedence exact confirmed_requirement overriding general-sla for sla_badge
    const mod = stack.appService.upsertModule({ projectId: project.project_id, key: 'pedidos', title: 'Pedidos' });
    stack.appService.upsertServiceRequirement({
      projectId: project.project_id,
      moduleId: mod.module_id,
      moduleKey: 'pedidos',
      title: 'Etiqueta SLA Tenant A',
      description: 'Confirmado por QA para Tenant A Operador',
      source: 'user',
      validationStatus: 'confirmed',
      acceptanceCriteria: ['ORD-101'],
      scope: {
        environment_name: 'staging',
        tenant_id: 'tenant-a',
        role: 'operador',
        route_pathname: '/app',
      },
      provenance: {
        source_ref: 'qa-confirmacion:acta-01',
        source_version: 'rev:1',
        rule_key: 'sla_badge',
        assert_selector: '#spa-shell',
        assert_type: 'contains',
      },
    });

    // Legacy unscoped confirmed requirement (NO scope declared -> must remain pending_legacy_scope)
    stack.appService.upsertServiceRequirement({
      projectId: project.project_id,
      moduleId: mod.module_id,
      moduleKey: 'pedidos',
      title: 'Requisito histórico sin scope',
      description: 'Legacy unscoped claim',
      source: 'user',
      validationStatus: 'confirmed',
      acceptanceCriteria: ['Valor legado sin alcance'],
    });

    const disc = await callJson(stack.client, 'qap_discover', {
      targetPath: workspaceRoot,
      name: 'pedidos',
      path: '/app',
      environment: 'staging',
      tenant_id: 'tenant-a',
      profile: 'op-a',
      allow_spa: true,
    });
    expect(disc.isError, JSON.stringify(disc.data)).toBe(false);
    const revId = String(disc.data.discovery_revision_id);

    const dossierRes = await callJson(stack.client, 'qap_project', {
      action: 'discovery_dossier',
      targetPath: workspaceRoot,
      module_key: 'pedidos',
      revision_id: revId,
    });
    expect(dossierRes.isError, JSON.stringify(dossierRes.data)).toBe(false);
    const rev = dossierRes.data.selected_revision as {
      dossier: {
        gaps: Array<{ code: string; severity: string }>;
        rule_resolution: {
          decisions: Array<{ rule_key: string; decision_status: string; expected_outcome?: string; source_ref?: string }>;
          ambiguities: Array<{ code: string; rule_key: string; question: string }>;
          excluded_sources: Array<{ source_ref: string; reason: string }>;
        };
      };
    };
    const rr = rev.dossier.rule_resolution;
    expect(rev.dossier.gaps.some((g) => g.code === 'rule_contradiction' && g.severity === 'blocking')).toBe(true);
    expect(rr.decisions.find((d) => d.rule_key === 'cutoff_hour')?.decision_status).toBe('pending_contradiction');
    expect(rr.decisions.find((d) => d.rule_key === 'auto_archive')?.decision_status).toBe('unaccredited_pending');
    expect(rr.decisions.find((d) => d.rule_key === 'sla_badge')).toMatchObject({
      decision_status: 'accredited',
      expected_outcome: 'ORD-101',
      source_ref: 'qa-confirmacion:acta-01',
    });
    expect(rr.excluded_sources.some((e) => e.source_ref === 'docs/general-sla.md' && e.reason === 'overridden_by_higher_precedence')).toBe(true);
    expect(rr.ambiguities.some((a) => a.code === 'equal_authority_contradiction' && a.rule_key === 'cutoff_hour')).toBe(true);
    expect(rr.ambiguities.some((a) => a.code === 'unaccredited_expectation' && a.rule_key === 'auto_archive')).toBe(true);
    expect(rr.ambiguities.some((a) => a.code === 'legacy_unscoped_requirement')).toBe(true);

    // Plan must convert ONLY sla_badge into proposed case; all contradictions / unaccredited / legacy stay pending_oracle WITHOUT assertions
    const planRes = await callJson(stack.client, 'qap_plan', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      environment: 'staging',
      tenant_id: 'tenant-a',
      profile: 'op-a',
      discovery_revision_id: revId,
      case_workflow: { action: 'propose_from_observations' },
    });
    expect(planRes.isError).toBe(false);
    const proposed = planRes.data.proposed_cases as Array<{ title: string; expectation: { expected_outcome: string } }>;
    const pending = planRes.data.pending_oracle_cases as Array<{
      title: string;
      expectation: { oracle_status: string; business_risk_question?: string };
      steps: Array<{ type: string }>;
    }>;
    expect(proposed.length).toBe(1);
    expect(proposed[0]!.expectation.expected_outcome).toBe('ORD-101');
    expect(pending.length).toBe(3);
    for (const p of pending) {
      expect(p.expectation.oracle_status).toBe('missing');
      expect(p.steps.some((s) => s.type === 'assert')).toBe(false);
      expect(p.expectation.business_risk_question).toBeTruthy();
    }
  }, 60_000);

  it('tras reiniciar el servicio y agregar reglas nuevas o sin scope, el plan lee la revisión histórica congelada sin heredarlas', async () => {
    staging = await startProtectedSpaStaging();
    staging.setRequireTenant(true, ['tenant-a', 'tenant-b']);
    const creds = new TestMemoryCredentialProvider();
    const { workspaceRoot, openStack } = createHarness(creds);

    // Session 1: ingest v1 and run Discovery rev1
    const stack1 = await openStack();
    await setupMultiTenantProject(stack1.client, workspaceRoot, staging.origin);
    expect((await ingestWorkspaceDoc(
      stack1.client,
      workspaceRoot,
      'docs/politica-pedidos.md',
      [
        'Version: 1.0.0',
        'Scope: environment=staging, tenant=tenant-a, role=operador',
        'Module: pedidos',
        'Route: /app',
        'Status: accredited',
        '- [RULE key=view_mode] Modo vista pedidos: Solo lectura v1',
      ].join('\n'),
    )).isError).toBe(false);
    const disc1 = await callJson(stack1.client, 'qap_discover', {
      targetPath: workspaceRoot,
      name: 'pedidos',
      path: '/app',
      environment: 'staging',
      tenant_id: 'tenant-a',
      profile: 'op-a',
      allow_spa: true,
    });
    expect(disc1.isError, JSON.stringify(disc1.data)).toBe(false);
    const rev1 = String(disc1.data.discovery_revision_id);
    await stack1.close();

    // Session 2 (full MCP + SQLite restart): mutate state with v2 doc, foreign tenant rule, and legacy unscoped requirement
    const stack2 = await openStack();
    disposables.push(() => stack2.close());

    expect((await ingestWorkspaceDoc(
      stack2.client,
      workspaceRoot,
      'docs/politica-pedidos.md',
      [
        'Version: 2.0.0',
        'Scope: environment=staging, tenant=tenant-a, role=operador',
        'Module: pedidos',
        'Route: /app',
        'Status: accredited',
        '- [RULE key=view_mode] Modo vista pedidos: Edición avanzada v2',
        '- [RULE key=export_pdf] Exportar PDF: Exportación PDF habilitada v2',
      ].join('\n'),
    )).isError).toBe(false);

    const project2 = stack2.appService.findActiveProjectByRoot(workspaceRoot)!;
    const mod2 = stack2.appService.upsertModule({ projectId: project2.project_id, key: 'pedidos', title: 'Pedidos' });
    stack2.appService.upsertServiceRequirement({
      projectId: project2.project_id,
      moduleId: mod2.module_id,
      moduleKey: 'pedidos',
      title: 'Requisito ajeno Tenant B',
      description: 'Solo tenant-b',
      source: 'user',
      validationStatus: 'confirmed',
      acceptanceCriteria: ['Regla ajena tenant-b'],
      scope: { environment_name: 'staging', tenant_id: 'tenant-b', role: 'auditor', route_pathname: '/app' },
    });
    stack2.appService.upsertServiceRequirement({
      projectId: project2.project_id,
      moduleId: mod2.module_id,
      moduleKey: 'pedidos',
      title: 'Requisito posterior sin scope',
      description: 'Sin alcance',
      source: 'user',
      validationStatus: 'confirmed',
      acceptanceCriteria: ['Regla posterior sin scope'],
    });

    // Planning against historical rev1 must strictly read rev1's frozen resolution (Solo lectura v1)
    const historicalPlan = await callJson(stack2.client, 'qap_plan', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      environment: 'staging',
      tenant_id: 'tenant-a',
      profile: 'op-a',
      discovery_revision_id: rev1,
      case_workflow: { action: 'propose_from_observations' },
    });
    expect(historicalPlan.isError, JSON.stringify(historicalPlan.data)).toBe(false);
    expect(historicalPlan.data.discovery_revision_id).toBe(rev1);
    const histCases = historicalPlan.data.proposed_cases as Array<{ expectation: { expected_outcome: string } }>;
    const histOutcomes = histCases.map((c) => c.expectation.expected_outcome);
    expect(histOutcomes).toEqual(['Solo lectura v1']);
    expect(histOutcomes).not.toContain('Edición avanzada v2');
    expect(histOutcomes).not.toContain('Exportación PDF habilitada v2');
    expect(histOutcomes).not.toContain('Regla ajena tenant-b');
    expect(histOutcomes).not.toContain('Regla posterior sin scope');

    // A new Discovery run picks up v2 without mutating frozen rev1
    const disc2 = await callJson(stack2.client, 'qap_discover', {
      targetPath: workspaceRoot,
      name: 'pedidos',
      path: '/app',
      environment: 'staging',
      tenant_id: 'tenant-a',
      profile: 'op-a',
      allow_spa: true,
    });
    expect(disc2.isError).toBe(false);
    const rev2 = String(disc2.data.discovery_revision_id);
    expect(rev2).not.toBe(rev1);

    const frozenRev1 = stack2.appService.getDiscoveryRevision(rev1)!;
    expect(frozenRev1.dossier.rule_resolution?.decisions.map((d) => d.expected_outcome)).toEqual(['Solo lectura v1']);
    const indexMd = readFileSync(join(workspaceRoot, '.qa', 'discovery', 'INDEX.md'), 'utf8');
    expect(existsSync(join(workspaceRoot, '.qa', 'discovery', 'INDEX.md'))).toBe(true);
    expect(indexMd).toContain(rev2);
  }, 60_000);
});
