import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { inspectZipArchive } from '@qap/playwright-runner';
import { PruningEngine, QapDatabase } from '@qap/reporter';
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

async function callJson(client: Client, name: string, args: Record<string, unknown>) {
  const res = await client.callTool({ name, arguments: args });
  const text = (res.content as Array<{ type: string; text?: string }>)[0]?.text ?? '{}';
  return {
    isError: Boolean(res.isError),
    data: JSON.parse(text) as Record<string, unknown>,
  };
}

describe('P0.4 — Evidencia Playwright por intento vinculada a intento, reporte y retención tras reinicio', () => {
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

  it('vincula WebM, captura enfocada, timeline y trace.zip al intento y reporte, sobrevive reinicio y aplica retención/confinamiento', async () => {
    staging = await startProtectedSpaStaging();

    const tempBase = mkdtempSync(join(tmpdir(), 'qap-p04-mcp-'));
    const hostRoot = join(tempBase, 'host');
    const workspaceRoot = join(tempBase, 'workspace-p04');
    mkdirSync(hostRoot, { recursive: true });
    mkdirSync(workspaceRoot, { recursive: true });
    disposables.push(() => {
      rmSync(tempBase, { recursive: true, force: true });
    });

    const credentialProvider = new TestMemoryCredentialProvider();
    let appService = new QapApplicationService({
      hostRootDir: hostRoot,
      credentialProvider,
    });
    let bootstrap = new WorkspaceBootstrap(hostRoot, appService);
    disposables.push(() => {
      bootstrap.close();
      appService.close();
    });

    const hostRegistryPath = join(hostRoot, 'authorized-workspaces.json');
    const hostDiscoveryRegistryPath = join(hostRoot, 'authorized-discoveries.json');
    const hostAuthRegistryPath = join(hostRoot, 'authorized-auth.json');
    const hostTestRegistryPath = join(hostRoot, 'authorized-tests.json');

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
    const testAuthorizer: ITestAuthorizer = {
      requestAuthorization: vi.fn(async ({ origin, profileLabel }) => ({
        decision: 'approved' as const,
        allowedOrigins: [origin],
        ...(profileLabel ? { authorizedProfiles: [profileLabel] } : {}),
      })),
    };

    const makeServerOptions = (): McpServerOptions => ({
      workspaceBootstrap: bootstrap,
      applicationService: appService,
      clientWorkspaceRoots: true,
      workspaceAuthorizer,
      discoveryAuthorizer,
      authAuthorizer,
      testAuthorizer,
      hostRegistryPath,
      hostDiscoveryRegistryPath,
      hostAuthRegistryPath,
      hostTestRegistryPath,
      allowSpaReadOnly: true,
    });

    const connectClient = async () => {
      const server = createMcpServer(makeServerOptions());
      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      const client = new Client({ name: 'p04-client', version: '1.0.0' }, { capabilities: {} });
      await server.connect(serverTransport);
      await client.connect(clientTransport);
      disposables.push(async () => {
        await client.close();
        await server.close();
      });
      return client;
    };

    const client1 = await connectClient();

    // 1. Inicializar proyecto, sesión autenticada y casos con oráculo acreditado
    const initRes = await callJson(client1, 'qap_status', {
      targetPath: workspaceRoot,
    });
    expect(initRes.data.initialized).toBe(true);
    const projectId = String(initRes.data.project_id);

    const ctxRes = await callJson(client1, 'qap_context_set', {
      targetPath: workspaceRoot,
      base_url: staging.origin,
      objective: 'Validar módulo de pedidos autenticado con evidencia P0.4',
      roles: [{ name: 'operador', source: 'user' }],
      critical_flows: [{ name: 'Consultar tabla de pedidos en /app', source: 'user' }],
      source_of_truth: { type: 'none', declared: true, source: 'user' },
    });
    expect(ctxRes.data.status).toBe('success');

    const authRes = await callJson(client1, 'qap_auth_add', {
      targetPath: workspaceRoot,
      profile: 'qa-spa',
      username: 'qa.operator',
      password: 'StagingPass#2026',
      role: 'operador',
      login_route: '/login',
    });
    expect(authRes.data.status).toBe('success');

    const discoverRes = await callJson(client1, 'qap_discover', {
      targetPath: workspaceRoot,
      name: 'pedidos',
      description: 'Portal SPA Protegido de Pedidos',
      path: '/app',
      profile: 'qa-spa',
      allow_spa: true,
    });
    expect(['completed', 'partial']).toContain(discoverRes.data.status);

    const sessionPlanRes = await callJson(client1, 'qap_session_plan', {
      targetPath: workspaceRoot,
      modules: [{ module: 'pedidos', path: '/app', priority: 'high', flujos: ['Consultar pedidos'] }],
      auth: { required: true, method: 'credentials', roles: ['operador'], profile: 'qa-spa' },
    });
    expect(sessionPlanRes.data.status).toBe('success');

    const proposeRes = await callJson(client1, 'qap_plan', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      case_workflow: {
        action: 'propose_from_observations',
        proposals: [
          {
            title: 'TC P0.4 PASS — Verificar ORD-101',
            expected_outcome: 'ORD-101',
            oracle_source: 'user',
            steps: [
              { type: 'navigate', url: `${staging.origin}/app` },
              { type: 'waitFor', selector: '#spa-shell' },
              {
                type: 'assert',
                selector: '#spa-shell',
                assertion_type: 'contains',
                expected: 'ORD-101',
              },
            ],
          },
          {
            title: 'TC P0.4 FAIL — Discrepancia esperada vs observada',
            expected_outcome: 'ORD-999-INEXISTENTE',
            oracle_source: 'user',
            steps: [
              { type: 'navigate', url: `${staging.origin}/app` },
              { type: 'waitFor', selector: '#spa-shell' },
              {
                type: 'assert',
                selector: '#spa-shell',
                assertion_type: 'contains',
                expected: 'ORD-999-INEXISTENTE',
              },
            ],
          },
        ],
      },
    });
    expect(proposeRes.isError, JSON.stringify(proposeRes.data)).toBe(false);
    const proposedReady = proposeRes.data.proposed_cases as Array<Record<string, unknown>>;
    const readyIds = proposedReady.map((c) => String(c.case_id));

    const approveRes = await callJson(client1, 'qap_plan', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      case_workflow: { action: 'approve_batch' },
    });
    expect(approveRes.data.status).toBe('approved');

    const planRes = await callJson(client1, 'qap_plan', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      environment: 'local',
    });
    expect(planRes.data.status).toBe('success');

    // 2. Ejecutar intento con Chromium real (sesión preparada ya aprovisionada)
    const testRes = await callJson(client1, 'qap_test', {
      targetPath: workspaceRoot,
      module: 'pedidos',
      environment: 'local',
      profile: 'qa-spa',
      case_ids: readyIds,
    });
    expect(testRes.isError).toBe(false);
    expect(testRes.data.result).toBe('partial');

    const attemptId = String(testRes.data.attempt_id);
    const executionId = String(testRes.data.execution_id);
    const artifacts = testRes.data.artifacts as {
      video_path: string;
      trace_zip_path: string;
      timeline_path: string;
      screenshots: string[];
    };
    expect(artifacts.video_path).toBe(`.qa/runtime/runs/${attemptId}/artifacts/attempt.webm`);
    expect(artifacts.trace_zip_path).toBe(`.qa/runtime/runs/${attemptId}/artifacts/trace.zip`);
    expect(artifacts.timeline_path).toBe(`.qa/runtime/runs/${attemptId}/artifacts/timeline.json`);
    expect(artifacts.screenshots.length).toBeGreaterThanOrEqual(2);

    // 3. Reiniciar QapApplicationService y servidor MCP para verificar persistencia y apertura tras reinicio
    bootstrap.close();
    appService.close();

    appService = new QapApplicationService({
      hostRootDir: hostRoot,
      credentialProvider,
    });
    bootstrap = new WorkspaceBootstrap(hostRoot, appService);
    const client2 = await connectClient();

    // Verificar que el intento recuperado de SQLite tras reinicio conserva todos los enlaces a artefactos
    const attemptsAfterRestart = appService.listExecutionAttempts(projectId, 'pedidos');
    expect(attemptsAfterRestart).toHaveLength(1);
    expect(attemptsAfterRestart[0].attempt_id).toBe(attemptId);
    expect(attemptsAfterRestart[0].video_path).toBe(artifacts.video_path);
    expect(attemptsAfterRestart[0].trace_zip_path).toBe(artifacts.trace_zip_path);
    expect(attemptsAfterRestart[0].timeline_path).toBe(artifacts.timeline_path);
    expect(attemptsAfterRestart[0].screenshots?.length).toBeGreaterThanOrEqual(2);

    // Verificar que los resultados por caso y paso tras reinicio conservan step_index, expected, observed y focused_screenshot
    const summaryAfterRestart = appService.getExecutionSummary(projectId, 'pedidos');
    const failVerdict = summaryAfterRestart.case_verdicts.find((v) => v.verdict === 'FAIL')!;
    expect(failVerdict).toBeDefined();
    expect(failVerdict.evidence_refs).toEqual(
      expect.arrayContaining([artifacts.video_path, artifacts.trace_zip_path, artifacts.timeline_path]),
    );
    const failedStepRecord = failVerdict.step_results.find((s) => s.status === 'FAIL')!;
    expect(failedStepRecord.step_index).toBe(2);
    expect(failedStepRecord.expected).toBe('ORD-999-INEXISTENTE');
    expect(failedStepRecord.observed).toContain('ORD-101');
    expect(failedStepRecord.focused_screenshot).toBe(true);

    // Verificar que los artefactos físicos son abribles tras el reinicio
    const videoBuf = readFileSync(join(workspaceRoot, artifacts.video_path));
    expect(videoBuf.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))).toBe(true);
    const zipAfterRestart = inspectZipArchive(join(workspaceRoot, artifacts.trace_zip_path));
    expect(zipAfterRestart.valid).toBe(true);
    const timelineAfterRestart = JSON.parse(readFileSync(join(workspaceRoot, artifacts.timeline_path), 'utf8'));
    expect(timelineAfterRestart.steps.length).toBe(6);

    // 4. Generar reporte tras reinicio y verificar vínculos en HTML, Markdown y respuesta MCP
    const reportRes = await callJson(client2, 'qap_report', {
      targetPath: workspaceRoot,
      executionId,
      module: 'pedidos',
      format: 'all',
    });
    expect(reportRes.isError, JSON.stringify(reportRes.data)).toBe(false);
    expect(reportRes.data.attempt_id).toBe(attemptId);
    expect(reportRes.data.artifacts).toMatchObject({
      video_path: artifacts.video_path,
      trace_zip_path: artifacts.trace_zip_path,
      timeline_path: artifacts.timeline_path,
    });

    const reportPaths = reportRes.data.reports as Record<string, string>;
    const htmlContent = readFileSync(reportPaths.html, 'utf8');
    const mdContent = readFileSync(reportPaths.markdown, 'utf8');
    expect(htmlContent).toContain(artifacts.video_path);
    expect(htmlContent).toContain(artifacts.trace_zip_path);
    expect(htmlContent).toContain(artifacts.timeline_path);
    expect(htmlContent).toContain('ORD-999-INEXISTENTE');
    expect(mdContent).toContain(artifacts.video_path);
    expect(mdContent).toContain(artifacts.trace_zip_path);
    expect(mdContent).toContain(artifacts.timeline_path);
    expect(mdContent).toContain('ORD-999-INEXISTENTE');

    // 5. Verificar reutilización de la política de retención (PruningEngine: 7d video, 14d trace.zip) sobre la ejecución generada
    const runtimeDir = join(workspaceRoot, '.qa', 'runtime');
    const runtimeDbPath = join(runtimeDir, 'qap.sqlite');
    expect(existsSync(runtimeDbPath)).toBe(true);

    const qapDb = new QapDatabase(runtimeDir);
    try {
      const registeredRuns = qapDb.listRuns();
      expect(registeredRuns.some((r) => r.run_id === attemptId)).toBe(true);

      // Simular evaluación de retención 8 días en el futuro (> 7d TTL de video, < 14d TTL de trace.zip)
      const eightDaysInFuture = Date.now() + 8 * 24 * 60 * 60 * 1000;
      const pruner = new PruningEngine(qapDb, runtimeDir);
      const pruneReport = pruner.prune({}, eightDaysInFuture);
      expect(pruneReport.purgedArtifactsCount).toBe(1);
      expect(existsSync(join(workspaceRoot, artifacts.video_path))).toBe(false);
      expect(existsSync(join(workspaceRoot, artifacts.trace_zip_path))).toBe(true);
      expect(existsSync(join(workspaceRoot, artifacts.timeline_path))).toBe(true);
    } finally {
      qapDb.close();
    }

    // 6. Verificar política de confinamiento en ReportHandler ante ruta fuera de .qa/
    const execJsonPath = join(workspaceRoot, '.qa', 'executions', `${executionId}.json`);
    const tamperedExec = JSON.parse(readFileSync(execJsonPath, 'utf8'));
    tamperedExec.artifacts.video_path = '../../outside-secret.webm';
    writeFileSync(execJsonPath, JSON.stringify(tamperedExec, null, 2), 'utf8');

    const unsafeReportRes = await callJson(client2, 'qap_report', {
      targetPath: workspaceRoot,
      executionId,
      module: 'pedidos',
      format: 'html',
    });
    expect(unsafeReportRes.isError).toBe(true);
    expect(unsafeReportRes.data.code).toBe('unsafe_artifact_reference');
  }, 45000);
});
