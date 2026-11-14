import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { FileSystemStorage } from '@qap/knowledge';
import type { CredentialProvider, CredentialReference } from '@qap/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { QapApplicationService } from '../application/application-service.js';
import type { IAuthAuthorizer } from '../auth-authorizer.js';
import type { IDiscoveryAuthorizer } from '../discovery-authorizer.js';
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

describe('Bloque 3 — Casos epistémicos, intentos de ejecución, recuperación de reportes y campaña 2', () => {
  const disposables: Array<() => Promise<void> | void> = [];
  let staging: ProtectedSpaStagingController | undefined;

  afterEach(async () => {
    vi.restoreAllMocks();
    while (disposables.length > 0) {
      const fn = disposables.pop()!;
      await fn();
    }
    if (staging) {
      await staging.close();
      staging = undefined;
    }
  });

  function createHostSetup(options?: { testDecision?: 'approved' | 'rejected' }) {
    const tempBase = mkdtempSync(join(tmpdir(), 'qap-block3-'));
    const hostRoot = join(tempBase, 'host');
    const workspaceRoot = join(tempBase, 'workspace-spa');
    mkdirSync(hostRoot, { recursive: true });
    mkdirSync(workspaceRoot, { recursive: true });

    const appService = new QapApplicationService({
      hostRootDir: hostRoot,
      credentialProvider: new TestMemoryCredentialProvider(),
    });
    const bootstrap = new WorkspaceBootstrap(hostRoot, appService);
    const hostRegistryPath = join(hostRoot, 'authorized-workspaces.json');
    const hostDiscoveryRegistryPath = join(hostRoot, 'authorized-discoveries.json');
    const hostAuthRegistryPath = join(hostRoot, 'authorized-auth.json');
    const hostTestRegistryPath = join(hostRoot, 'authorized-tests.json');

    disposables.push(() => {
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
      requestAuthorization: vi.fn(async ({ projectRoot, targetUrl, limits }) => ({
        decision: 'approved' as const,
        root: projectRoot,
        targetUrl,
        limits,
      })),
    };
    const authAuthorizer: IAuthAuthorizer = {
      requestAuthorization: vi.fn(async () => ({
        decision: 'approved' as const,
        username: 'qa.spa@staging.local',
        password: 'spa-secret-password',
      })),
    };
    const testDecision = options?.testDecision ?? 'approved';
    const testAuthorizer: ITestAuthorizer = {
      requestAuthorization: vi.fn(async ({ origin, profileLabel }) =>
        testDecision === 'rejected'
          ? { decision: 'rejected' as const, reason: 'QA rechazó lanzar ejecución.' }
          : {
              decision: 'approved' as const,
              allowedOrigins: [origin],
              ...(profileLabel ? { authorizedProfiles: [profileLabel] } : {}),
            },
      ),
    };

    const connectClient = async (extraOpts?: Partial<McpServerOptions>) => {
      const server = createMcpServer({
        workspaceBootstrap: bootstrap,
        applicationService: appService,
        clientWorkspaceRoots: true,
        workspaceAuthorizer,
        hostRegistryPath,
        discoveryAuthorizer,
        hostDiscoveryRegistryPath,
        authAuthorizer,
        hostAuthRegistryPath,
        testAuthorizer,
        hostTestRegistryPath,
        allowSpaReadOnly: true,
        ...extraOpts,
      });
      const client = new Client({ name: 'block3-test-client', version: '1.0.0' });
      const [ct, st] = InMemoryTransport.createLinkedPair();
      await server.connect(st);
      await client.connect(ct);
      disposables.push(async () => {
        await client.close();
        await server.close();
      });
      return client;
    };

    return {
      tempBase,
      workspaceRoot,
      appService,
      testAuthorizer,
      connectClient,
    };
  }

  async function callJson(client: Client, name: string, args: Record<string, unknown>) {
    const res = await client.callTool({ name, arguments: args });
    const textItem = res.content.find((c) => c.type === 'text');
    return {
      isError: Boolean(res.isError),
      data: textItem && textItem.type === 'text' ? (JSON.parse(textItem.text) as Record<string, unknown>) : {},
    };
  }

  it('cubre propuesta epistémica, oráculo faltante no bloqueante, lote idempotente, PASS/FAIL real con Chromium, recuperación parcial de reporte sin reejecución, aceptación humana, cierre sin not_executed y Campaña 2', async () => {
    staging = await startProtectedSpaStaging();
    const { workspaceRoot, appService, testAuthorizer, connectClient } = createHostSetup();
    const client = await connectClient();

    // 1. Entrada, contexto, auth real contra SPA protegida y discovery de lectura
    const initRes = await callJson(client, 'qap_status', {
      targetPath: workspaceRoot,
    });
    expect(initRes.data.initialized).toBe(true);
    const projectId = String(initRes.data.project_id);

    const ctxRes = await callJson(client, 'qap_context_set', {
      targetPath: workspaceRoot,
      base_url: staging.origin,
      objective: 'Validar módulo de pedidos autenticado',
      roles: [{ name: 'operador', source: 'user' }],
      critical_flows: [{ name: 'Consultar tabla de pedidos en /app', source: 'user' }],
      source_of_truth: { type: 'none', declared: true, source: 'user' },
    });
    expect(ctxRes.data.status).toBe('success');

    const authRes = await callJson(client, 'qap_auth_add', {
      targetPath: workspaceRoot,
      profile: 'qa-spa',
      username: 'qa.operator',
      password: 'StagingPass#2026',
      role: 'operador',
      login_route: '/login',
    });
    expect(authRes.data.status).toBe('success');

    const discoverRes = await callJson(client, 'qap_discover', {
      targetPath: workspaceRoot,
      name: 'pedidos',
      description: 'Portal SPA Protegido de Pedidos',
      path: '/app',
      profile: 'qa-spa',
      allow_spa: true,
    });
    expect(['completed', 'partial']).toContain(discoverRes.data.status);

    const sessionPlanRes = await callJson(client, 'qap_session_plan', {
      targetPath: workspaceRoot,
      modules: [{ module: 'pedidos', path: '/app', priority: 'high', flujos: ['Consultar pedidos'] }],
      auth: { required: true, method: 'credentials', roles: ['operador'], profile: 'qa-spa' },
    });
    expect(sessionPlanRes.data.status).toBe('success');
    expect(sessionPlanRes.data.fase).toBe('WORKING');

    // 2. Propuesta epistémica separando observación, inferencia, expectativa y conformidad
    // Incluye: 1 PASS real, 1 FAIL deliberado, 1 caso sin oráculo (no bloqueante) y 1 riesgo alto pendiente
    const modRecord = appService.upsertModule({ projectId, key: 'pedidos', title: 'pedidos' });
    const reqPass = appService.upsertServiceRequirement({
      projectId,
      moduleId: modRecord.module_id,
      moduleKey: 'pedidos',
      title: 'Mostrar pedido ORD-101 en panel SPA',
      description: 'ORD-101',
      source: 'user',
      validationStatus: 'confirmed',
      acceptanceCriteria: ['ORD-101'],
    });
    const reqFail = appService.upsertServiceRequirement({
      projectId,
      moduleId: modRecord.module_id,
      moduleKey: 'pedidos',
      title: 'Detectar marcador inexistente (FAIL deliberado)',
      description: 'ESTADO_INEXISTENTE_DELIBERADO',
      source: 'user',
      validationStatus: 'confirmed',
      acceptanceCriteria: ['ESTADO_INEXISTENTE_DELIBERADO'],
    });
    const reqHigh = appService.upsertServiceRequirement({
      projectId,
      moduleId: modRecord.module_id,
      moduleKey: 'pedidos',
      title: 'Operación sensible de riesgo alto',
      description: 'Panel de Pedidos',
      source: 'user',
      validationStatus: 'confirmed',
      acceptanceCriteria: ['Panel de Pedidos'],
      riskLevel: 'high',
      riskDecision: 'pending',
    });

    const proposeRes = await callJson(client, 'qap_plan', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      case_workflow: {
        action: 'propose_from_observations',
        proposals: [
          {
            title: 'Mostrar pedido ORD-101 en panel SPA',
            requirement_id: reqPass.requirement_id,
            expected_outcome: 'ORD-101',
            oracle_source: 'user',
            steps: [
              { type: 'navigate', url: `${staging.origin}/app` },
              { type: 'waitFor', selector: '#spa-shell' },
              { type: 'assert', selector: 'body', assertion_type: 'contains', expected: 'ORD-101' },
            ],
          },
          {
            title: 'Detectar marcador inexistente (FAIL deliberado)',
            requirement_id: reqFail.requirement_id,
            expected_outcome: 'ESTADO_INEXISTENTE_DELIBERADO',
            oracle_source: 'user',
            steps: [
              { type: 'navigate', url: `${staging.origin}/app` },
              { type: 'waitFor', selector: '#spa-shell' },
              { type: 'assert', selector: 'body', assertion_type: 'contains', expected: 'ESTADO_INEXISTENTE_DELIBERADO' },
            ],
          },
          {
            title: 'Botón exportar sin expectativa definida',
            expected_outcome: null,
            oracle_source: 'missing',
            steps: [
              { type: 'navigate', url: `${staging.origin}/app` },
              { type: 'waitFor', selector: '#spa-shell' },
            ],
          },
          {
            title: 'Operación sensible de riesgo alto',
            requirement_id: reqHigh.requirement_id,
            expected_outcome: 'Panel de Pedidos',
            oracle_source: 'user',
            risk_level: 'high',
            risk_accepted: false,
            steps: [
              { type: 'navigate', url: `${staging.origin}/app` },
              { type: 'waitFor', selector: '#spa-shell' },
              { type: 'assert', selector: 'body', assertion_type: 'contains', expected: 'Panel de Pedidos' },
            ],
          },
        ],
      },
    });
    expect(proposeRes.isError).toBe(false);
    expect(proposeRes.data.status).toBe('proposed');
    expect(proposeRes.data.epistemic_separation).toBe(true);
    expect(proposeRes.data.non_blocking_pending_oracles).toBe(true);

    const proposedReady = proposeRes.data.proposed_cases as Array<Record<string, unknown>>;
    const pendingOracle = proposeRes.data.pending_oracle_cases as Array<Record<string, unknown>>;
    expect(proposedReady).toHaveLength(2);
    expect(pendingOracle).toHaveLength(2);
    expect(proposedReady[0]).toHaveProperty('observation');
    expect(proposedReady[0]).toHaveProperty('inference');
    expect(proposedReady[0]).toHaveProperty('expectation');
    expect(proposedReady[0].conformity_status).toBe('proposed');
    expect(pendingOracle[0].conformity_status).toBe('pending_oracle');

    const readyIds = proposedReady.map((c) => String(c.case_id));
    const passCaseId = String(proposedReady.find((c) => String(c.title).includes('ORD-101'))!.case_id);
    const failCaseId = String(proposedReady.find((c) => String(c.title).includes('FAIL deliberado'))!.case_id);
    const pendingMissingId = String(pendingOracle.find((c) => String(c.title).includes('sin expectativa'))!.case_id);
    const pendingHighRiskId = String(pendingOracle.find((c) => String(c.title).includes('riesgo alto'))!.case_id);

    // 3. Aprobación por lote + prevención idempotente de confirmaciones duplicadas
    const approve1 = await callJson(client, 'qap_plan', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      case_workflow: {
        action: 'approve_batch',
      },
    });
    expect(approve1.data.status, JSON.stringify(approve1.data)).toBe('approved');
    expect(approve1.data.idempotent).toBe(false);
    expect((approve1.data.skipped_pending_oracle as Array<unknown>).length).toBe(2);

    const approveDup = await callJson(client, 'qap_plan', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      case_workflow: {
        action: 'approve_batch',
        case_ids: readyIds,
      },
    });
    expect(approveDup.data.status).toBe('approved');
    expect(approveDup.data.idempotent).toBe(true);
    expect(approveDup.data.duplicate_confirmation_prevented).toBe(true);
    expect(approveDup.data.confirmation_digest).toBe(approve1.data.confirmation_digest);

    // Resolver oráculo y aceptar riesgo alto en el caso pendiente sin bloquear antes
    const decideRes = await callJson(client, 'qap_plan', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      case_workflow: {
        action: 'decide_oracles',
        decisions: [
          { case_id: pendingMissingId, expected_outcome: 'Panel de Pedidos', assert_type: 'contains' },
          { case_id: pendingHighRiskId, expected_outcome: 'Panel de Pedidos', risk_accepted: true, risk_note: 'Aprobado lectura controlada' },
        ],
      },
    });
    expect(decideRes.data.status).toBe('updated');
    expect((decideRes.data.updated_cases as Array<unknown>).length).toBe(2);

    // 4. Plan DAG + Ejecución real en Playwright con lote selectivo [TC-pass, TC-fail]
    const dagPlan = await callJson(client, 'qap_plan', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      environment: 'local',
    });
    expect(dagPlan.data.status).toBe('success');
    expect(dagPlan.data.cases).toEqual(expect.arrayContaining(readyIds));

    const testRes = await callJson(client, 'qap_test', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      environment: 'local',
      profile: 'qa-spa',
      case_ids: [passCaseId, failCaseId],
    });
    expect(testAuthorizer.requestAuthorization).toHaveBeenCalledTimes(1);
    expect(testRes.isError).toBe(false);
    expect(testRes.data.result).toBe('partial');
    expect(typeof testRes.data.attempt_id).toBe('string');
    const executionId = String(testRes.data.execution_id);

    const attempts = appService.listExecutionAttempts(projectId, 'pedidos');
    expect(attempts).toHaveLength(1);
    expect(attempts[0].attempt_id).toBe(testRes.data.attempt_id);
    expect(attempts[0].execution_id).toBe(executionId);
    expect(attempts[0].case_versions[passCaseId]).toBe(1);
    expect(attempts[0].requirement_revisions.length).toBeGreaterThanOrEqual(2);

    const execSummaryAfterRun = appService.getExecutionSummary(projectId, 'pedidos');
    expect(execSummaryAfterRun.counts.pass).toBe(1);
    expect(execSummaryAfterRun.counts.fail).toBe(1);
    const passVerdict = execSummaryAfterRun.case_verdicts.find((v) => v.case_id === passCaseId)!;
    const failVerdict = execSummaryAfterRun.case_verdicts.find((v) => v.case_id === failCaseId)!;
    expect(passVerdict.verdict).toBe('PASS');
    expect(passVerdict.step_results.length).toBeGreaterThanOrEqual(3);
    expect(failVerdict.verdict).toBe('FAIL');
    expect(failVerdict.evidence_refs.some((r) => r.includes('screenshots/'))).toBe(true);

    // 5. Falla parcial al publicar reportes -> recuperación SIN reejecutar navegador
    const originalWrite = FileSystemStorage.prototype.write;
    vi.spyOn(FileSystemStorage.prototype, 'write').mockImplementation(async function (
      this: FileSystemStorage,
      relPath: string,
      content: string,
    ) {
      if (relPath.endsWith('.report.xml')) {
        throw new Error('simulated_junit_disk_error');
      }
      return originalWrite.call(this, relPath, content);
    });

    const partialReport = await callJson(client, 'qap_report', {
      targetPath: workspaceRoot,
      executionId,
      module: 'pedidos',
      format: 'all',
    });
    expect(partialReport.isError).toBe(true);
    expect(partialReport.data.status).toBe('partial');
    expect(partialReport.data.code).toBe('report_generation_or_persistence_failed');
    expect(partialReport.data.failed_format).toBe('junit');
    const partialPaths = partialReport.data.reports as Record<string, string>;
    expect(existsSync(partialPaths.html)).toBe(true);
    expect(existsSync(partialPaths.markdown)).toBe(true);

    const statusWithPendingPub = await callJson(client, 'qap_status', { targetPath: workspaceRoot });
    expect((statusWithPendingPub.data.pending_report_recovery as Array<unknown>).length).toBe(1);
    expect((statusWithPendingPub.data.siguiente_accion as { tool: string }).tool).toBe('qap_report');

    vi.restoreAllMocks();
    const hitsBeforeRecovery = staging.visitedRequests.length;
    const recoveredReport = await callJson(client, 'qap_report', {
      targetPath: workspaceRoot,
      recover_pending: true,
      format: 'all',
    });
    expect(recoveredReport.isError).toBe(false);
    expect(recoveredReport.data.status).toBe('success');
    const pubInfo = recoveredReport.data.publication as {
      status: string;
      reused_formats: string[];
      generated_formats: string[];
    };
    expect(pubInfo.status).toBe('completed');
    expect(pubInfo.reused_formats).toEqual(expect.arrayContaining(['html', 'markdown']));
    expect(pubInfo.generated_formats).toEqual(expect.arrayContaining(['junit', 'json']));
    // Staging HTTP hit count MUST remain unchanged — zero browser re-execution!
    expect(staging.visitedRequests.length).toBe(hitsBeforeRecovery);

    // 6. Aceptación humana explícita del gap deliberado + cierre sin falsos 'not_executed'
    const acceptRes = await callJson(client, 'qap_plan', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      case_workflow: {
        action: 'accept_case_gap',
        acceptance: {
          case_id: failCaseId,
          reason: 'Defecto deliberado de marcador verificado y aceptado para cierre de Campaña 1.',
        },
      },
    });
    expect(acceptRes.data.status).toBe('human_accepted');

    const modCloseRes = await callJson(client, 'qap_module_close', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      action: 'close',
      user_confirmed: true,
    });
    expect(modCloseRes.isError).toBe(false);
    expect(modCloseRes.data.status).toBe('success');
    expect(modCloseRes.data.state).toBe('closed');

    const sessCloseRes = await callJson(client, 'qap_session_close', {
      targetPath: workspaceRoot,
      confirmar: true,
    });
    expect(sessCloseRes.isError).toBe(false);
    expect(sessCloseRes.data.status).toBe('success');
    expect(sessCloseRes.data.fase).toBe('WRAP_UP');
    expect(sessCloseRes.data.execution_status).toBe('executed_passed');

    const reportMd = readFileSync(String(sessCloseRes.data.report_path), 'utf8');
    expect(reportMd).toContain('Resumen de Ejecución Física Verificada');
    expect(reportMd).toContain('PASS=1');
    expect(reportMd).toContain('human_accepted=1');
    expect(reportMd).not.toContain('Estado de ejecución: **not_executed**');

    // 7. Segunda campaña reutilizando el módulo ya cerrado
    const campaign2Plan = await callJson(client, 'qap_session_plan', {
      targetPath: workspaceRoot,
      reuse_modules: true,
      auth: { required: true, method: 'credentials', roles: ['operador'], profile: 'qa-spa' },
    });
    expect(campaign2Plan.isError, JSON.stringify(campaign2Plan.data)).toBe(false);
    expect(campaign2Plan.data.status).toBe('success');
    expect(campaign2Plan.data.fase).toBe('WORKING');
    expect(campaign2Plan.data.reused_modules).toContain('pedidos');
    expect(typeof campaign2Plan.data.reused_from_campaign_id).toBe('string');
  }, 60000);

  it('bloquea con cierre seguro ante rechazo de autorización, revocación de execute y sesión caducada sin degradar a anónimo', async () => {
    staging = await startProtectedSpaStaging();
    const { workspaceRoot, appService, connectClient } = createHostSetup({ testDecision: 'rejected' });
    const client = await connectClient({ allowSpaReadOnly: true });

    await callJson(client, 'qap_status', { targetPath: workspaceRoot });
    await callJson(client, 'qap_context_set', {
      targetPath: workspaceRoot,
      base_url: staging.origin,
      objective: 'Validar guardas',
      roles: [{ name: 'operador', source: 'user' }],
      critical_flows: [{ name: 'Ver panel', source: 'user' }],
      source_of_truth: { type: 'none', declared: true, source: 'user' },
    });
    const authRes = await callJson(client, 'qap_auth_add', {
      targetPath: workspaceRoot,
      profile: 'qa-guard',
      username: 'qa.operator',
      password: 'StagingPass#2026',
      role: 'operador',
      login_route: '/login',
    });
    expect(authRes.data.status).toBe('success');

    await callJson(client, 'qap_session_plan', {
      targetPath: workspaceRoot,
      modules: [{ module: 'pedidos', path: '/app', priority: 'high', flujos: ['Ver panel'] }],
      auth: { required: true, method: 'credentials', roles: ['operador'], profile: 'qa-guard' },
    });

    const activeProject = appService.findActiveProjectByRoot(workspaceRoot)!;
    const modGuard = appService.upsertModule({ projectId: activeProject.project_id, key: 'pedidos', title: 'pedidos' });
    const reqGuard = appService.upsertServiceRequirement({
      projectId: activeProject.project_id,
      moduleId: modGuard.module_id,
      moduleKey: 'pedidos',
      title: 'Verificar panel protegido',
      description: 'ORD-101',
      source: 'user',
      validationStatus: 'confirmed',
      acceptanceCriteria: ['ORD-101'],
    });

    const proposeRes = await callJson(client, 'qap_plan', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      case_workflow: {
        action: 'propose_from_observations',
        proposals: [
          {
            title: 'Verificar panel protegido',
            requirement_id: reqGuard.requirement_id,
            expected_outcome: 'ORD-101',
            oracle_source: 'user',
            steps: [
              { type: 'navigate', url: `${staging.origin}/app` },
              { type: 'waitFor', selector: '#spa-shell' },
              { type: 'assert', selector: 'body', assertion_type: 'contains', expected: 'ORD-101' },
            ],
          },
        ],
      },
    });
    const caseId = String((proposeRes.data.proposed_cases as Array<Record<string, unknown>>)[0].case_id);
    await callJson(client, 'qap_plan', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      case_workflow: { action: 'approve_batch', case_ids: [caseId] },
    });
    await callJson(client, 'qap_plan', {
      targetPath: workspaceRoot,
      module: 'pedidos',
    });

    // A) Rechazo explícito en el diálogo de ejecución
    const rejectedTest = await callJson(client, 'qap_test', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      profile: 'qa-guard',
    });
    expect(rejectedTest.isError).toBe(true);
    expect(rejectedTest.data.status).toBe('blocked');
    expect(rejectedTest.data.code).toBe('test_authorization_rejected');

    // B) Revocación explícita de capacidad 'execute'
    const project = appService.findActiveProjectByRoot(workspaceRoot)!;
    appService.authority.grant({
      project_id: project.project_id,
      capability: 'execute',
      scope: { root_path: workspaceRoot, origin: staging.origin },
      granted_by: 'test_harness',
      policy_hash: 'hash-test',
    });
    appService.authority.revokeProjectAccess(project.project_id, 'revoked_by_qa', ['execute']);

    const revokedTest = await callJson(client, 'qap_test', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      profile: 'qa-guard',
    });
    expect(revokedTest.isError).toBe(true);
    expect(revokedTest.data.code).toBe('capability_execute_revoked');

    // C) Sesión expirada nunca se degrada a anónimo
    appService.authority.grant({
      project_id: project.project_id,
      capability: 'execute',
      scope: { root_path: workspaceRoot, origin: staging.origin },
      granted_by: 'test_harness',
      policy_hash: 'hash-test-2',
    });
    appService.expireProfileSession(project.project_id, 'qa-guard');

    const hitsBeforeExpired = staging.visitedRequests.length;
    const expiredTest = await callJson(client, 'qap_test', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      profile: 'qa-guard',
    });
    expect(expiredTest.isError).toBe(true);
    expect(expiredTest.data.status).toBe('blocked');
    expect(expiredTest.data.code).toBe('auth_session_expired');
    expect(staging.visitedRequests.length).toBe(hitsBeforeExpired);
  }, 45000);
});
