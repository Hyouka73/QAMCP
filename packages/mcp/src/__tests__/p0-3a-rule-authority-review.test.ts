import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { ElicitRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import type { CredentialProvider, CredentialReference } from '@qap/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { QapApplicationService } from '../application/application-service.js';
import type { IAuthAuthorizer } from '../auth-authorizer.js';
import type { IDiscoveryAuthorizer } from '../discovery-authorizer.js';
import type {
  HumanReviewDecision,
  HumanReviewRequest,
  IHumanReviewGateway,
} from '../handlers/canonical-interview-service.js';
import { createMcpServer, type McpServerOptions } from '../server.js';
import type { ITestAuthorizer } from '../test-authorizer.js';
import { WorkspaceBootstrap } from '../workspace-bootstrap.js';
import type { IWorkspaceAuthorizer } from '../workspace-authorizer.js';

import {
  startProtectedSpaStaging,
  type ProtectedSpaStagingController,
} from './fixtures/protected-spa-staging.js';

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

describe('P0.3a — Autoridad de reglas y revisión de solo lectura', () => {
  const disposables: Array<() => Promise<void> | void> = [];
  let staging: ProtectedSpaStagingController | undefined;

  afterEach(async () => {
    vi.restoreAllMocks();
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
    const tempBase = mkdtempSync(join(tmpdir(), 'qap-p03a-'));
    const hostRoot = join(tempBase, 'host');
    const workspaceRoot = join(tempBase, 'workspace-staging');
    mkdirSync(hostRoot, { recursive: true });
    mkdirSync(workspaceRoot, { recursive: true });

    const registryPath = join(hostRoot, 'authorized-workspaces.json');
    const discoveryRegistryPath = join(hostRoot, 'authorized-discoveries.json');
    const authRegistryPath = join(hostRoot, 'authorized-auth.json');
    const testRegistryPath = join(hostRoot, 'authorized-tests.json');

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
    const testAuthorizer: ITestAuthorizer = {
      requestAuthorization: vi.fn(async ({ origin, profileLabel }) => ({
        decision: 'approved' as const,
        allowedOrigins: [origin],
        ...(profileLabel ? { authorizedProfiles: [profileLabel] } : {}),
      })),
    };

    const activeStacks: Array<{ close: () => Promise<void> }> = [];

    const openStack = async (
      overrides: Partial<McpServerOptions> & { clientElicitation?: boolean } = {},
    ) => {
      const { clientElicitation, ...serverOverrides } = overrides;
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
        testAuthorizer,
        hostTestRegistryPath: testRegistryPath,
        allowSpaReadOnly: true,
        ...serverOverrides,
      });
      const [ct, st] = InMemoryTransport.createLinkedPair();
      await server.connect(st);
      const client = new Client(
        { name: 'p03a-test-client', version: '1.0.0' },
        clientElicitation ? { capabilities: { elicitation: { form: {} } } } : { capabilities: {} },
      );
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

    return { workspaceRoot, openStack, testAuthorizer };
  }

  async function setupStagingProject(client: Client, workspaceRoot: string, origin: string) {
    const createRes = await callJson(client, 'qap_project', {
      action: 'create',
      name: 'Portal Pedidos P0.3a',
      canonical_root: workspaceRoot,
      base_url: origin,
      env_name: 'staging',
      tenant_mode: 'multi_tenant',
      default_tenant: 'tenant-a',
      objective: 'Validar autoridad de reglas y revisión de solo lectura',
    });
    expect(createRes.isError, JSON.stringify(createRes.data)).toBe(false);

    const ctxRes = await callJson(client, 'qap_context_set', {
      targetPath: workspaceRoot,
      objective: 'Validar autoridad de reglas y revisión de solo lectura',
      base_url: origin,
      roles: [{ name: 'operador', source: 'user' }],
      critical_flows: [{ name: 'Consultar pedidos en /app', source: 'user' }],
      source_of_truth: { type: 'none', declared: true, source: 'user' },
    });
    expect(ctxRes.isError, JSON.stringify(ctxRes.data)).toBe(false);

    const authRes = await callJson(client, 'qap_auth_add', {
      targetPath: workspaceRoot,
      profile: 'op-a',
      environment: 'staging',
      tenant_id: 'tenant-a',
      role: 'operador',
      login_route: '/login',
      username: 'qa.tenant_a',
      password: 'TenantAPass#2026',
    });
    expect(authRes.isError, JSON.stringify(authRes.data)).toBe(false);

    const planRes = await callJson(client, 'qap_session_plan', {
      targetPath: workspaceRoot,
      tenant_id: 'tenant-a',
      modules: [{ module: 'pedidos', path: '/app', priority: 'high', flujos: ['Panel de pedidos'] }],
      auth: { required: true, method: 'credentials', roles: ['operador'], profile: 'op-a' },
    });
    expect(planRes.isError, JSON.stringify(planRes.data)).toBe(false);
  }

  it('review es de solo lectura sin efectos en estado ni YAML, y las expectativas inventadas, sin fuente o contradichas permanecen pendientes', async () => {
    staging = await startProtectedSpaStaging();
    staging.setRequireTenant(true, ['tenant-a']);
    const creds = new TestMemoryCredentialProvider();
    const { workspaceRoot, openStack } = createHarness(creds);
    const stack = await openStack();
    await setupStagingProject(stack.client, workspaceRoot, staging.origin);

    // 1. Ingestar dos documentos que se contradicen en cutoff_hour y una regla no acreditada
    expect((await ingestWorkspaceDoc(
      stack.client,
      workspaceRoot,
      'docs/politica-a.md',
      [
        'Scope: exact (environment=staging, tenant=tenant-a, role=operador)',
        'Module: pedidos',
        'Route: /app',
        'Status: accredited',
        '- [RULE key=cutoff_hour assert=contains:#spa-shell] Corte A: Corte a las 17:00',
      ].join('\n'),
    )).isError).toBe(false);

    expect((await ingestWorkspaceDoc(
      stack.client,
      workspaceRoot,
      'docs/politica-b.md',
      [
        'Scope: exact (environment=staging, tenant=tenant-a, role=operador)',
        'Module: pedidos',
        'Route: /app',
        'Status: accredited',
        '- [RULE key=cutoff_hour assert=contains:#spa-shell] Corte B: Corte a las 18:00',
      ].join('\n'),
    )).isError).toBe(false);

    // También ingestar una regla acreditada sin contradicción para validar ejecución rutinaria
    expect((await ingestWorkspaceDoc(
      stack.client,
      workspaceRoot,
      'docs/orden-visible.md',
      [
        'Scope: exact (environment=staging, tenant=tenant-a, role=operador)',
        'Module: pedidos',
        'Route: /app',
        'Status: accredited',
        '- [RULE key=order_row assert=contains:#spa-shell] Pedido visible: ORD-101',
      ].join('\n'),
    )).isError).toBe(false);

    const discRes = await callJson(stack.client, 'qap_discover', {
      targetPath: workspaceRoot,
      name: 'pedidos',
      path: '/app',
      environment: 'staging',
      tenant_id: 'tenant-a',
      profile: 'op-a',
      allow_spa: true,
    });
    expect(discRes.isError, JSON.stringify(discRes.data)).toBe(false);
    const rev1Id = String(discRes.data.discovery_revision_id);

    // 2. review ANTES de proponer casos no crea directorio .qa/modules/pedidos ni YAML ni muta SQLite
    const modDir = join(workspaceRoot, '.qa', 'modules', 'pedidos');
    const reviewEmpty = await callJson(stack.client, 'qap_plan', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      case_workflow: { action: 'review' },
    });
    expect(reviewEmpty.isError).toBe(false);
    expect(reviewEmpty.data.status).toBe('review');
    expect(reviewEmpty.data.read_only).toBe(true);
    expect(existsSync(modDir)).toBe(false);

    // 3. Propuestas directas con texto inventado atribuyendo oracle_source='user', sin fuente y contradicha
    const project = stack.appService.findActiveProjectByRoot(workspaceRoot)!;
    const reqsBefore = stack.appService.listServiceRequirements(project.project_id, 'pedidos').length;

    const proposeDirect = await callJson(stack.client, 'qap_plan', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      environment: 'staging',
      tenant_id: 'tenant-a',
      profile: 'op-a',
      discovery_revision_id: rev1Id,
      case_workflow: {
        action: 'propose_from_observations',
        proposals: [
          {
            title: 'Texto inventado por el agente',
            expected_outcome: 'El sistema siempre muestra un descuento del 90%',
            oracle_source: 'user',
            steps: [
              { type: 'navigate', url: `${staging.origin}/app` },
              { type: 'waitFor', selector: '#spa-shell' },
              { type: 'assert', selector: 'body', assertion_type: 'contains', expected: '90%' },
            ],
          },
          {
            title: 'Expectativa sin fuente',
            expected_outcome: null,
            oracle_source: 'missing',
            steps: [
              { type: 'navigate', url: `${staging.origin}/app` },
              { type: 'waitFor', selector: '#spa-shell' },
            ],
          },
          {
            title: 'Regla contradicha cutoff_hour',
            rule_id: 'cutoff_hour',
            expected_outcome: 'Corte a las 17:00',
            oracle_source: 'ingested_doc',
            steps: [
              { type: 'navigate', url: `${staging.origin}/app` },
              { type: 'waitFor', selector: '#spa-shell' },
              { type: 'assert', selector: '#spa-shell', assertion_type: 'contains', expected: 'Corte a las 17:00' },
            ],
          },
        ],
      },
    });
    expect(proposeDirect.isError, JSON.stringify(proposeDirect.data)).toBe(false);
    expect(proposeDirect.data.proposed_cases).toHaveLength(0);
    const pendingDirect = proposeDirect.data.pending_oracle_cases as Array<{
      title: string;
      conformity_status: string;
      expectation: { oracle_status: string; expected_outcome: string | null; source: string };
      steps: Array<{ type: string }>;
    }>;
    expect(pendingDirect).toHaveLength(3);
    for (const item of pendingDirect) {
      expect(item.conformity_status).toBe('pending_oracle');
      expect(item.expectation.oracle_status).toBe('missing');
      expect(item.expectation.source).toBe('missing');
      expect(item.expectation.expected_outcome).toBeNull();
      expect(item.steps.some((s) => s.type === 'assert')).toBe(false);
    }
    // No se creó ningún service_requirement confirmado implícitamente
    expect(stack.appService.listServiceRequirements(project.project_id, 'pedidos').length).toBe(reqsBefore);

    // 4. review después de proponer NO aprueba casos ni escribe context.yaml / TC-*.yaml
    const reviewAfterPropose = await callJson(stack.client, 'qap_plan', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      case_workflow: { action: 'review' },
    });
    expect(reviewAfterPropose.isError).toBe(false);
    expect(reviewAfterPropose.data.status).toBe('review');
    expect(reviewAfterPropose.data.read_only).toBe(true);
    expect(reviewAfterPropose.data.summary).toMatchObject({
      total_cases: 3,
      approved: 0,
      pending_oracle: 3,
    });
    expect(existsSync(join(modDir, 'context.yaml'))).toBe(false);
    expect(existsSync(join(modDir, 'tests'))).toBe(false);

    const casesAfterReview = stack.appService.listServiceCases(project.project_id, 'pedidos');
    expect(casesAfterReview.every((c) => c.conformity_status === 'pending_oracle' && c.confirmed_at === null)).toBe(true);
  }, 60_000);

  it('conecta confirmación humana verificable del host con pregunta, evidencia, ámbito y revisión al resolver de Discovery, persiste tras reinicio y mantiene ejecución rutinaria', async () => {
    staging = await startProtectedSpaStaging();
    const creds = new TestMemoryCredentialProvider();
    const { workspaceRoot, openStack, testAuthorizer } = createHarness(creds);

    // A) Sin gateway ni elicitation -> bloqueado
    const stackNoGateway = await openStack();
    await setupStagingProject(stackNoGateway.client, workspaceRoot, staging.origin);

    expect((await ingestWorkspaceDoc(
      stackNoGateway.client,
      workspaceRoot,
      'docs/corte-1.md',
      [
        'Scope: exact (environment=staging, tenant=tenant-a, role=operador)',
        'Module: pedidos',
        'Route: /app',
        'Status: accredited',
        '- [RULE key=cutoff_hour assert=contains:#spa-shell] Corte 1: Corte a las 17:00',
      ].join('\n'),
    )).isError).toBe(false);

    expect((await ingestWorkspaceDoc(
      stackNoGateway.client,
      workspaceRoot,
      'docs/corte-2.md',
      [
        'Scope: exact (environment=staging, tenant=tenant-a, role=operador)',
        'Module: pedidos',
        'Route: /app',
        'Status: accredited',
        '- [RULE key=cutoff_hour assert=contains:#spa-shell] Corte 2: Corte a las 18:00',
      ].join('\n'),
    )).isError).toBe(false);

    const disc1 = await callJson(stackNoGateway.client, 'qap_discover', {
      targetPath: workspaceRoot,
      name: 'pedidos',
      path: '/app',
      environment: 'staging',
      tenant_id: 'tenant-a',
      profile: 'op-a',
      allow_spa: true,
    });
    expect(disc1.isError).toBe(false);
    const rev1Id = String(disc1.data.discovery_revision_id);

    const dossier1 = await callJson(stackNoGateway.client, 'qap_project', {
      action: 'discovery_dossier',
      targetPath: workspaceRoot,
      module_key: 'pedidos',
      revision_id: rev1Id,
    });
    const rev1Ambiguities = (dossier1.data.selected_revision as {
      dossier: { rule_resolution: { ambiguities: Array<{ ambiguity_id: string; rule_key: string; question: string }> } };
    }).dossier.rule_resolution.ambiguities;
    const cutoffAmbiguity = rev1Ambiguities.find((a) => a.rule_key === 'cutoff_hour')!;
    expect(cutoffAmbiguity).toBeDefined();

    const blockedNoGateway = await callJson(stackNoGateway.client, 'qap_rules_set', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      rule_resolution: {
        action: 'confirm',
        question_id: cutoffAmbiguity.ambiguity_id,
        discovery_revision_id: rev1Id,
        rule_key: 'cutoff_hour',
        title: 'Hora de corte oficial',
        expected_outcome: 'ORD-A-101',
        environment: 'staging',
        tenant_id: 'tenant-a',
        role: 'operador',
        route_pathname: '/app',
      },
    });
    expect(blockedNoGateway.data.status).toBe('blocked');
    expect(blockedNoGateway.data.code).toBe('human_review_gateway_required');
    await stackNoGateway.close();

    // B) Con gateway verificable del host (rechazo -> no acredita; confirmación -> acredita rev 1; reconfirmación -> rev 2)
    let nextDecisionMode: 'reject' | 'confirm' = 'reject';
    const receivedRequests: HumanReviewRequest[] = [];
    const gateway: IHumanReviewGateway = {
      async review(request): Promise<HumanReviewDecision> {
        receivedRequests.push(request);
        const now = new Date();
        return {
          requestDigest: request.requestDigest,
          approvalId: randomUUID(),
          decision: nextDecisionMode,
          presentedStatementDigest: request.statementDigest,
          reviewer: 'qa-lead@staging.local',
          decidedAt: now.toISOString(),
          expiresAt: new Date(now.getTime() + 10 * 60_000).toISOString(),
        };
      },
    };

    const stack2 = await openStack({ humanReviewGateway: gateway });

    // Rechazo explícito no acredita la regla
    const rejectedRes = await callJson(stack2.client, 'qap_rules_set', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      rule_resolution: {
        action: 'confirm',
        question_id: cutoffAmbiguity.ambiguity_id,
        discovery_revision_id: rev1Id,
        rule_key: 'cutoff_hour',
        title: 'Hora de corte oficial',
        expected_outcome: 'ORD-A-101',
        environment: 'staging',
        tenant_id: 'tenant-a',
        role: 'operador',
        route_pathname: '/app',
      },
    });
    expect(rejectedRes.data.status).toBe('rejected');

    const project = stack2.appService.findActiveProjectByRoot(workspaceRoot)!;
    expect(stack2.appService.listScopedBusinessRules(project.project_id, {
      moduleKey: 'pedidos',
      sourceKind: 'confirmed_requirement',
    })).toHaveLength(0);

    // Confirmación genuina -> guarda decisión con pregunta, evidencia, ámbito y revisión 1
    nextDecisionMode = 'confirm';
    const confirmed1 = await callJson(stack2.client, 'qap_rules_set', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      rule_resolution: {
        action: 'confirm',
        question_id: cutoffAmbiguity.ambiguity_id,
        discovery_revision_id: rev1Id,
        rule_key: 'cutoff_hour',
        title: 'Hora de corte oficial',
        expected_outcome: 'ORD-A-101',
        environment: 'staging',
        tenant_id: 'tenant-a',
        role: 'operador',
        route_pathname: '/app',
        assert_selector: '#spa-shell',
        assert_type: 'contains',
      },
    });
    expect(confirmed1.isError, JSON.stringify(confirmed1.data)).toBe(false);
    expect(confirmed1.data).toMatchObject({
      status: 'confirmed',
      revision: 1,
      rule_key: 'cutoff_hour',
      question: {
        id: cutoffAmbiguity.ambiguity_id,
        text: cutoffAmbiguity.question,
      },
      scope: {
        environment_name: 'staging',
        tenant_id: 'tenant-a',
        role: 'operador',
        route_pathname: '/app',
        scope_declaration: 'exact',
      },
    });

    // Discovery rev2 conecta la decisión confirmada y resuelve la contradicción
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
    const rev2Id = String(disc2.data.discovery_revision_id);
    expect(rev2Id).not.toBe(rev1Id);

    const dossier2 = await callJson(stack2.client, 'qap_project', {
      action: 'discovery_dossier',
      targetPath: workspaceRoot,
      module_key: 'pedidos',
      revision_id: rev2Id,
    });
    const rr2 = (dossier2.data.selected_revision as {
      dossier: {
        gaps: Array<{ code: string }>;
        rule_resolution: {
          decisions: Array<{ rule_key: string; decision_status: string; source_kind?: string; expected_outcome?: string }>;
          ambiguities: Array<{ rule_key: string }>;
        };
      };
    }).dossier;
    expect(rr2.gaps.some((g) => g.code === 'rule_contradiction')).toBe(false);
    expect(rr2.rule_resolution.ambiguities.some((a) => a.rule_key === 'cutoff_hour')).toBe(false);
    expect(rr2.rule_resolution.decisions.find((d) => d.rule_key === 'cutoff_hour')).toMatchObject({
      decision_status: 'accredited',
      source_kind: 'confirmed_requirement',
      expected_outcome: 'ORD-A-101',
    });

    // Segunda confirmación genuina crea revisión 2
    const confirmed2 = await callJson(stack2.client, 'qap_rules_set', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      rule_resolution: {
        action: 'confirm',
        question_id: cutoffAmbiguity.ambiguity_id,
        discovery_revision_id: rev2Id,
        rule_key: 'cutoff_hour',
        title: 'Hora de corte oficial',
        expected_outcome: 'ORD-A-101',
        environment: 'staging',
        tenant_id: 'tenant-a',
        role: 'operador',
        route_pathname: '/app',
        assert_selector: '#spa-shell',
        assert_type: 'contains',
      },
    });
    expect(confirmed2.isError, JSON.stringify(confirmed2.data)).toBe(false);
    expect(confirmed2.data.revision).toBe(2);

    // Reinicio completo del servidor -> persistencia intacta y review sigue siendo de solo lectura
    await stack2.close();
    const stack3 = await openStack({ clientElicitation: true });

    const listedAfterRestart = await callJson(stack3.client, 'qap_rules_set', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      rule_resolution: {
        action: 'list',
        environment: 'staging',
        tenant_id: 'tenant-a',
        role: 'operador',
      },
    });
    expect(listedAfterRestart.isError).toBe(false);
    expect((listedAfterRestart.data.decisions as Array<{ revision: number }>).some((d) => d.revision === 2)).toBe(true);

    // Confirmación también funciona vía MCP client elicitation nativa tras reinicio
    stack3.client.setRequestHandler(ElicitRequestSchema, async () => ({
      action: 'accept',
      content: { decision: 'confirm' },
    }));
    const confirmedViaElicit = await callJson(stack3.client, 'qap_rules_set', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      rule_resolution: {
        action: 'confirm',
        question_id: 'q-elicit-1',
        question_text: '¿Confirmar visibilidad del panel de pedidos?',
        rule_key: 'panel_visible',
        title: 'Panel visible',
        expected_outcome: 'ORD-A-101',
        environment: 'staging',
        tenant_id: 'tenant-a',
        role: 'operador',
        route_pathname: '/app',
        assert_selector: '#spa-shell',
        assert_type: 'contains',
      },
    });
    expect(confirmedViaElicit.isError, JSON.stringify(confirmedViaElicit.data)).toBe(false);
    expect(confirmedViaElicit.data).toMatchObject({
      status: 'confirmed',
      revision: 1,
      evidence: { mechanism: 'client_elicitation' },
    });

    // Discovery rev3 recoge la nueva regla confirmada por elicitation y permite proponer, aprobar y ejecutar rutinariamente
    const disc3 = await callJson(stack3.client, 'qap_discover', {
      targetPath: workspaceRoot,
      name: 'pedidos',
      path: '/app',
      environment: 'staging',
      tenant_id: 'tenant-a',
      profile: 'op-a',
      allow_spa: true,
    });
    expect(disc3.isError).toBe(false);
    const rev3Id = String(disc3.data.discovery_revision_id);

    const proposeRes = await callJson(stack3.client, 'qap_plan', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      environment: 'staging',
      tenant_id: 'tenant-a',
      profile: 'op-a',
      discovery_revision_id: rev3Id,
      case_workflow: { action: 'propose_from_observations' },
    });
    expect(proposeRes.isError).toBe(false);
    expect((proposeRes.data.proposed_cases as Array<unknown>).length).toBeGreaterThanOrEqual(1);

    // review sigue siendo de solo lectura antes de approve_batch
    const modDir = join(workspaceRoot, '.qa', 'modules', 'pedidos');
    const reviewRes = await callJson(stack3.client, 'qap_plan', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      case_workflow: { action: 'review' },
    });
    expect(reviewRes.data.status).toBe('review');
    expect(reviewRes.data.read_only).toBe(true);
    expect(existsSync(join(modDir, 'context.yaml'))).toBe(false);

    const approveRes = await callJson(stack3.client, 'qap_plan', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      case_workflow: { action: 'approve_batch' },
    });
    expect(approveRes.data.status).toBe('approved');
    const approvedIds = (approveRes.data.cases as Array<{ case_id: string }>).map((c) => c.case_id);
    const firstYamlPath = join(modDir, 'tests', `TC-${approvedIds[0]}.yaml`);
    const yamlBeforeReview = readFileSync(firstYamlPath, 'utf8');

    // review después de approve_batch deja YAML intacto
    const reviewAfterApprove = await callJson(stack3.client, 'qap_plan', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      case_workflow: { action: 'review' },
    });
    expect(reviewAfterApprove.data.status).toBe('review');
    expect(readFileSync(firstYamlPath, 'utf8')).toBe(yamlBeforeReview);

    // Plan DAG + Ejecución rutinaria autorizada en Chromium sin diálogos repetidos por ruta
    const dagPlan = await callJson(stack3.client, 'qap_plan', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      environment: 'staging',
      tenant_id: 'tenant-a',
      profile: 'op-a',
      discovery_revision_id: rev3Id,
    });
    expect(dagPlan.data.status).toBe('success');

    const testRes = await callJson(stack3.client, 'qap_test', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      environment: 'staging',
      profile: 'op-a',
    });
    expect(testRes.isError, JSON.stringify(testRes.data)).toBe(false);
    expect(testRes.data.status, JSON.stringify(testRes.data)).toBe('success');
    expect(testRes.data.result, JSON.stringify(testRes.data)).toBe('passed');
    expect(testAuthorizer.requestAuthorization).toHaveBeenCalledTimes(1);
  }, 90_000);

  it('P0.3a-SEC: impide atribución indebida de autoridad humana en decide_oracles y approve_batch, preserva lote de 1 confirmación e invalida aprobación tras modificar un caso', async () => {
    staging = await startProtectedSpaStaging();
    const creds = new TestMemoryCredentialProvider();
    const { workspaceRoot, openStack } = createHarness(creds);

    // 1. Servidor SIN mecanismo humano (ni humanReviewGateway ni elicitation)
    const stackNoGateway = await openStack();
    await setupStagingProject(stackNoGateway.client, workspaceRoot, staging.origin);

    const project = stackNoGateway.appService.findActiveProjectByRoot(workspaceRoot)!;
    const modRecord = stackNoGateway.appService.upsertModule({
      projectId: project.project_id,
      key: 'pedidos',
      title: 'pedidos',
    });
    const confirmedReq1 = stackNoGateway.appService.upsertServiceRequirement({
      projectId: project.project_id,
      moduleId: modRecord.module_id,
      moduleKey: 'pedidos',
      title: 'Regla 1 acreditada previamente',
      description: 'ORD-101',
      source: 'user',
      validationStatus: 'confirmed',
      acceptanceCriteria: ['ORD-101'],
    });
    const confirmedReq2 = stackNoGateway.appService.upsertServiceRequirement({
      projectId: project.project_id,
      moduleId: modRecord.module_id,
      moduleKey: 'pedidos',
      title: 'Regla 2 acreditada previamente',
      description: 'Panel de Pedidos',
      source: 'user',
      validationStatus: 'confirmed',
      acceptanceCriteria: ['Panel de Pedidos'],
    });

    const caseReady1Id = randomUUID();
    const caseReady2Id = randomUUID();
    const casePendingId = randomUUID();

    const proposeRes = await callJson(stackNoGateway.client, 'qap_plan', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      case_workflow: {
        action: 'propose_from_observations',
        proposals: [
          {
            case_id: caseReady1Id,
            title: 'Caso listo 1',
            requirement_id: confirmedReq1.requirement_id,
            steps: [
              { type: 'navigate', url: `${staging.origin}/app` },
              { type: 'waitFor', selector: '#spa-shell' },
              { type: 'assert', selector: '#spa-shell', assertion_type: 'contains', expected: 'ORD-101' },
            ],
          },
          {
            case_id: caseReady2Id,
            title: 'Caso listo 2',
            requirement_id: confirmedReq2.requirement_id,
            steps: [
              { type: 'navigate', url: `${staging.origin}/app` },
              { type: 'waitFor', selector: '#spa-shell' },
              { type: 'assert', selector: '#spa-shell', assertion_type: 'contains', expected: 'Panel de Pedidos' },
            ],
          },
          {
            case_id: casePendingId,
            title: 'Caso sin oráculo pendiente',
            expected_outcome: 'Oráculo no autorizado por el agente',
            oracle_source: 'user',
            steps: [
              { type: 'navigate', url: `${staging.origin}/app` },
              { type: 'waitFor', selector: '#spa-shell' },
            ],
          },
        ],
      },
    });
    expect(proposeRes.isError).toBe(false);
    expect((proposeRes.data.proposed_cases as Array<unknown>).length).toBe(2);
    expect((proposeRes.data.pending_oracle_cases as Array<unknown>).length).toBe(1);

    const reqCountBefore = stackNoGateway.appService.listServiceRequirements(project.project_id, 'pedidos').length;

    // A) Intentos de inyección de user_confirmed: true / approved_by en decide_oracles y approve_batch son rechazados
    const spoofDecideArgs = await callJson(stackNoGateway.client, 'qap_plan', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      case_workflow: {
        action: 'decide_oracles',
        user_confirmed: true,
        decisions: [{ case_id: casePendingId, expected_outcome: 'ORD-101' }],
      },
    });
    expect(spoofDecideArgs.isError).toBe(true);
    expect(spoofDecideArgs.data.code).toBe('invalid_case_command');

    const spoofDecisionNested = await callJson(stackNoGateway.client, 'qap_plan', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      case_workflow: {
        action: 'decide_oracles',
        decisions: [{ case_id: casePendingId, expected_outcome: 'ORD-101', user_confirmed: true }],
      },
    });
    expect(spoofDecisionNested.isError).toBe(true);
    expect(spoofDecisionNested.data.code).toBe('invalid_oracle_decision');

    const spoofApproveArgs = await callJson(stackNoGateway.client, 'qap_plan', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      case_workflow: {
        action: 'approve_batch',
        user_confirmed: true,
        approved_by: 'qa_user',
      },
    });
    expect(spoofApproveArgs.isError).toBe(true);
    expect(spoofApproveArgs.data.code).toBe('invalid_case_command');

    // B) Sin gateway ni elicitation: decide_oracles y approve_batch bloquean con human_review_gateway_required sin mutar autoridad
    const decideNoGateway = await callJson(stackNoGateway.client, 'qap_plan', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      case_workflow: {
        action: 'decide_oracles',
        decisions: [{ case_id: casePendingId, expected_outcome: 'ORD-101', assert_type: 'contains' }],
      },
    });
    expect(decideNoGateway.isError).toBe(true);
    expect(decideNoGateway.data.status).toBe('blocked');
    expect(decideNoGateway.data.code).toBe('human_review_gateway_required');
    expect(stackNoGateway.appService.listServiceRequirements(project.project_id, 'pedidos').length).toBe(reqCountBefore);

    const approveNoGateway = await callJson(stackNoGateway.client, 'qap_plan', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      case_workflow: { action: 'approve_batch' },
    });
    expect(approveNoGateway.isError).toBe(true);
    expect(approveNoGateway.data.status).toBe('blocked');
    expect(approveNoGateway.data.code).toBe('human_review_gateway_required');

    const modDir = join(workspaceRoot, '.qa', 'modules', 'pedidos');
    expect(existsSync(join(modDir, 'tests', `TC-${caseReady1Id}.yaml`))).toBe(false);
    const casesAfterNoGateway = stackNoGateway.appService.listServiceCases(project.project_id, 'pedidos');
    expect(casesAfterNoGateway.find((c) => c.case_id === casePendingId)?.conformity_status).toBe('pending_oracle');
    expect(casesAfterNoGateway.find((c) => c.case_id === caseReady1Id)?.conformity_status).toBe('proposed');
    expect(casesAfterNoGateway.find((c) => c.case_id === caseReady1Id)?.confirmed_by).toBeNull();

    await stackNoGateway.close();

    // 2. Servidor CON gateway humano verificable: probar rechazo, diferimiento, error, digest alterado y reutilización de approvalId
    let gatewayBehavior: 'reject' | 'defer' | 'throw' | 'null' | 'tampered_digest' | 'fixed_approval_id' | 'confirm' = 'reject';
    const fixedReusedApprovalId = randomUUID();
    const reviewRequests: HumanReviewRequest[] = [];
    const gateway: IHumanReviewGateway = {
      review: vi.fn(async (req) => {
        reviewRequests.push(req);
        if (gatewayBehavior === 'throw') {
          throw new Error('gateway_failure');
        }
        if (gatewayBehavior === 'null') {
          return null;
        }
        const now = new Date();
        return {
          requestDigest: gatewayBehavior === 'tampered_digest' ? '0'.repeat(64) : req.requestDigest,
          approvalId: gatewayBehavior === 'fixed_approval_id' ? fixedReusedApprovalId : randomUUID(),
          decision: gatewayBehavior === 'reject' ? 'reject' : gatewayBehavior === 'defer' ? 'defer' : 'confirm',
          presentedStatementDigest: req.statementDigest,
          reviewer: 'qa-auditor@staging.local',
          decidedAt: now.toISOString(),
          expiresAt: new Date(now.getTime() + 10 * 60_000).toISOString(),
        };
      }),
    };

    const stackWithGateway = await openStack({ humanReviewGateway: gateway });

    // Rechazo en decide_oracles -> bloquea sin crear service_requirement ni promover caso
    gatewayBehavior = 'reject';
    const rejectedDecide = await callJson(stackWithGateway.client, 'qap_plan', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      case_workflow: {
        action: 'decide_oracles',
        decisions: [{ case_id: casePendingId, expected_outcome: 'ORD-101' }],
      },
    });
    expect(rejectedDecide.isError).toBe(true);
    expect(rejectedDecide.data.code).toBe('human_review_rejected');

    // Defer en approve_batch -> bloquea sin escribir YAML ni marcar approved
    gatewayBehavior = 'defer';
    const deferredApprove = await callJson(stackWithGateway.client, 'qap_plan', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      case_workflow: { action: 'approve_batch' },
    });
    expect(deferredApprove.isError).toBe(true);
    expect(deferredApprove.data.code).toBe('human_review_deferred');

    // Error en gateway -> human_review_unavailable
    gatewayBehavior = 'throw';
    const errorApprove = await callJson(stackWithGateway.client, 'qap_plan', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      case_workflow: { action: 'approve_batch' },
    });
    expect(errorApprove.isError).toBe(true);
    expect(errorApprove.data.code).toBe('human_review_unavailable');

    // Null (revocación/cancelación de sesión de revisión) -> human_review_not_authorized
    gatewayBehavior = 'null';
    const nullApprove = await callJson(stackWithGateway.client, 'qap_plan', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      case_workflow: { action: 'approve_batch' },
    });
    expect(nullApprove.isError).toBe(true);
    expect(nullApprove.data.code).toBe('human_review_not_authorized');

    // Digest alterado (intento de reutilizar respuesta de otro lote/alcance) -> human_review_invalid
    gatewayBehavior = 'tampered_digest';
    const tamperedApprove = await callJson(stackWithGateway.client, 'qap_plan', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      case_workflow: { action: 'approve_batch' },
    });
    expect(tamperedApprove.isError).toBe(true);
    expect(tamperedApprove.data.code).toBe('human_review_invalid');

    // Verificar que ninguna operación fallida mutó autoridad ni creó archivos YAML
    expect(stackWithGateway.appService.listServiceRequirements(project.project_id, 'pedidos').length).toBe(reqCountBefore);
    expect(existsSync(join(modDir, 'tests', `TC-${caseReady1Id}.yaml`))).toBe(false);

    // 3. Confirmación positiva de decide_oracles -> acredita requisito, regla y promueve caso a proposed
    gatewayBehavior = 'fixed_approval_id';
    const confirmedDecide = await callJson(stackWithGateway.client, 'qap_plan', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      case_workflow: {
        action: 'decide_oracles',
        decisions: [{ case_id: casePendingId, expected_outcome: 'ORD-101', assert_selector: '#spa-shell', assert_type: 'contains' }],
      },
    });
    expect(confirmedDecide.isError, JSON.stringify(confirmedDecide.data)).toBe(false);
    expect(confirmedDecide.data.status).toBe('updated');
    expect((confirmedDecide.data.updated_cases as Array<{ case_id: string; conformity_status: string }>)[0]).toMatchObject({
      case_id: casePendingId,
      conformity_status: 'proposed',
    });
    expect((confirmedDecide.data.human_confirmations as Array<{ reviewer: string }>)[0].reviewer).toBe('qa-auditor@staging.local');

    // Intentar reutilizar el mismo approvalId en approve_batch -> rechazado con human_review_invalid
    const replayedApprove = await callJson(stackWithGateway.client, 'qap_plan', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      case_workflow: { action: 'approve_batch' },
    });
    expect(replayedApprove.isError).toBe(true);
    expect(replayedApprove.data.code).toBe('human_review_invalid');

    // 4. Confirmación positiva por lote en approve_batch: 3 casos aprobados con UNA sola llamada al gateway
    const callsBeforeBatch = (gateway.review as ReturnType<typeof vi.fn>).mock.calls.length;
    gatewayBehavior = 'confirm';
    const confirmedBatch = await callJson(stackWithGateway.client, 'qap_plan', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      case_workflow: { action: 'approve_batch' },
    });
    expect(confirmedBatch.isError, JSON.stringify(confirmedBatch.data)).toBe(false);
    expect(confirmedBatch.data.status).toBe('approved');
    expect(confirmedBatch.data.idempotent).toBe(false);
    expect((confirmedBatch.data.cases as Array<unknown>).length).toBe(3);
    expect((gateway.review as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callsBeforeBatch + 1);

    const casesAfterBatch = stackWithGateway.appService.listServiceCases(project.project_id, 'pedidos');
    expect(casesAfterBatch.every((c) => c.conformity_status === 'approved' && c.confirmed_by === 'qa-auditor@staging.local')).toBe(true);

    // Segunda llamada idéntica a approve_batch es idempotente y NO vuelve a abrir diálogo
    const idempotentBatch = await callJson(stackWithGateway.client, 'qap_plan', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      case_workflow: { action: 'approve_batch' },
    });
    expect(idempotentBatch.isError).toBe(false);
    expect(idempotentBatch.data.idempotent).toBe(true);
    expect((gateway.review as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callsBeforeBatch + 1);

    // 5. Modificar un caso ya aprobado mediante propose_from_observations INVALIDA su aprobación anterior
    const modifiedPropose = await callJson(stackWithGateway.client, 'qap_plan', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      case_workflow: {
        action: 'propose_from_observations',
        proposals: [
          {
            case_id: caseReady1Id,
            title: 'Caso listo 1 modificado con paso adicional',
            requirement_id: confirmedReq1.requirement_id,
            steps: [
              { type: 'navigate', url: `${staging.origin}/app` },
              { type: 'waitFor', selector: '#spa-shell' },
              { type: 'waitFor', selector: 'body' },
              { type: 'assert', selector: '#spa-shell', assertion_type: 'contains', expected: 'ORD-101' },
            ],
          },
        ],
      },
    });
    expect(modifiedPropose.isError).toBe(false);
    const modifiedCase = stackWithGateway.appService
      .listServiceCases(project.project_id, 'pedidos')
      .find((c) => c.case_id === caseReady1Id)!;
    expect(modifiedCase.version).toBe(2);
    expect(modifiedCase.conformity_status).toBe('proposed');
    expect(modifiedCase.confirmed_by).toBeNull();
    expect(modifiedCase.confirmed_at).toBeNull();

    // Si el operador rechaza aprobar la versión 2 modificada, queda bloqueado y en estado proposed
    gatewayBehavior = 'reject';
    const rejectModifiedBatch = await callJson(stackWithGateway.client, 'qap_plan', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      case_workflow: { action: 'approve_batch', case_ids: [caseReady1Id] },
    });
    expect(rejectModifiedBatch.isError).toBe(true);
    expect(rejectModifiedBatch.data.code).toBe('human_review_rejected');
  }, 60_000);
});
