import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { ElicitRequestSchema, ListRootsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { afterEach, describe, expect, it } from 'vitest';
import YAML from 'yaml';

import { QapApplicationService } from '../application/application-service.js';
import { loadHostComposition } from '../host-composition.js';
import { createMcpServer } from '../server.js';

import { startProtectedSpaStaging, type ProtectedSpaStagingController } from './fixtures/protected-spa-staging.js';

const REPO_MCP_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SERVER_DIST_PATH = join(REPO_MCP_ROOT, 'dist', 'server.js');

function authorizeWorkspace(root: string, hostDir: string): void {
  execFileSync(process.execPath, [resolve(REPO_MCP_ROOT, '../../scripts/qap-authorize-workspace.mjs'), root], {
    env: { ...process.env, QAP_MCP_HOST_DATA_DIR: hostDir,
      QAP_MCP_WORKSPACE_HOST_DIR: join(hostDir, 'workspaces'), QAP_MCP_APP_SERVICE_DIR: join(hostDir, 'application') },
    windowsHide: true,
  });
}

describe('Regresión: composición real Stdio/host sin diálogos QAP en flujo local vinculado', () => {
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

  async function callJson(client: Client, name: string, args: Record<string, unknown>) {
    const res = await client.callTool({ name, arguments: args });
    const text = (res.content as Array<{ text?: string }>)[0]?.text ?? '{}';
    return { isError: Boolean(res.isError), data: JSON.parse(text) as Record<string, unknown> };
  }

  it('Stdio real con roots/list: migra entrada histórica sin navigationOrigin conservando límites, recupera el caso y publica un PASS canónico de Chromium con autorización explícita, y rechaza otra raíz, otro origen y perfil revocado', async () => {
    expect(existsSync(SERVER_DIST_PATH)).toBe(true);
    staging = await startProtectedSpaStaging();

    const tempBase = mkdtempSync(join(tmpdir(), 'qap-stdio-silent-'));
    const hostDataDir = join(tempBase, 'qap-home');
    const workspaceHostDir = join(hostDataDir, 'workspaces');
    const appServiceDir = join(hostDataDir, 'application');
    const boundRoot = join(tempBase, 'bound-project');
    const unboundRoot = join(tempBase, 'unbound-project');

    mkdirSync(workspaceHostDir, { recursive: true });
    mkdirSync(appServiceDir, { recursive: true });
    mkdirSync(boundRoot, { recursive: true });
    mkdirSync(unboundRoot, { recursive: true });
    writeFileSync(join(boundRoot, 'README.md'), '# Proyecto Local Vinculado\n', 'utf8');

    // Simular entrada histórica local en discovery-authorizations.json:
    // 4 navigationUrls exactas SIN navigationOrigin, con límites explícitos.
    const rootKey = createHash('sha256')
      .update(process.platform === 'win32' ? boundRoot.toLowerCase() : boundRoot)
      .digest('hex');
    const historicalAppId = `workspace-${rootKey.slice(0, 32)}`;
    writeFileSync(
      join(workspaceHostDir, 'discovery-authorizations.json'),
      JSON.stringify(
        [
          {
            projectRoot: boundRoot,
            applicationId: historicalAppId,
            environmentId: 'local',
            environmentRevision: 1,
            navigationUrls: [
              `${staging.origin}/legacy-1`,
              `${staging.origin}/legacy-2`,
              `${staging.origin}/legacy-3`,
              `${staging.origin}/legacy-4`,
            ],
            limits: { max_pages: 7, max_depth: 2 },
            authorizedAt: new Date().toISOString(),
          },
        ],
        null,
        2,
      ),
      'utf8',
    );

    disposables.push(() => rmSync(tempBase, { recursive: true, force: true }));
    const connect = async () => {
      const transport = new StdioClientTransport({
        command: process.execPath,
        args: [SERVER_DIST_PATH],
        cwd: REPO_MCP_ROOT,
        env: {
          ...process.env,
          NODE_ENV: 'production',
          QAP_DISABLE_INTERACTIVE_AUTH: '1',
          QAP_MCP_HOST_DATA_DIR: hostDataDir,
          QAP_MCP_WORKSPACE_HOST_DIR: workspaceHostDir,
          QAP_MCP_APP_SERVICE_DIR: appServiceDir,
        },
        stderr: 'pipe',
      });

      const client = new Client(
        { name: 'stdio-host-client', version: '1.0.0' },
        { capabilities: { roots: {}, elicitation: { form: {} } } },
      );
      client.setRequestHandler(ListRootsRequestSchema, async () => ({
        roots: [{ uri: pathToFileURL(boundRoot).href, name: 'bound-project' }],
      }));
      client.setRequestHandler(ElicitRequestSchema, async () => ({
        action: 'accept',
        content: { decision: 'confirm' },
      }));

      await client.connect(transport);
      disposables.push(() => client.close());
      return client;
    };
    authorizeWorkspace(boundRoot, hostDataDir);
    const client = await connect();

    // 1. Raíz vinculada por el host vía roots/list: inicializa sin diálogo
    const statusRes = await callJson(client, 'qap_status', { targetPath: boundRoot });
    expect(statusRes.data.initialized).toBe(true);
    expect(statusRes.data.directorio_objetivo).toBe(boundRoot);

    // 2. Otra raíz fuera del vínculo del host: rechazada sin usar targetPath como autoridad
    const otherRootRes = await callJson(client, 'qap_status', { targetPath: unboundRoot });
    expect(otherRootRes.data.status).toBe('blocked');
    expect(otherRootRes.data.code).toBe('workspace_outside_configured_root');
    expect(existsSync(join(unboundRoot, '.qa'))).toBe(false);

    // 3. Configurar entorno local del proyecto vinculado
    const ctxRes = await callJson(client, 'qap_context_set', {
      targetPath: boundRoot,
      base_url: staging.origin,
      source: 'user',
      project_name: 'SPA Local Stdio',
      objective: 'Verificar flujo QA funcional completo por Stdio sin diálogos',
      roles: [{ name: 'operador', source: 'user' }],
      critical_flows: [{ name: 'Consultar pedidos', source: 'user' }],
      source_of_truth: { type: 'none', declared: true, source: 'user' },
    });
    expect(ctxRes.data.status).toBe('success');

    // 4. Discovery de solo lectura en ruta nueva (/login) con la entrada histórica de 4 URLs sin navigationOrigin
    const discPublic = await callJson(client, 'qap_discover', {
      targetPath: boundRoot,
      name: 'inventario-provisional',
      path: '/login',
    });
    expect(discPublic.isError, JSON.stringify(discPublic.data)).toBe(false);
    expect(discPublic.data.persistence).toBe('committed');
    expect(Number(discPublic.data.observations)).toBeGreaterThan(0);

    // 5. Otro origen distinto al del entorno vinculado: rechazado
    const offOriginDisc = await callJson(client, 'qap_discover', {
      targetPath: boundRoot,
      name: 'inventario-provisional',
      path: 'https://otro-origen.example.invalid/',
    });
    expect(offOriginDisc.isError).toBe(true);
    expect(offOriginDisc.data.status).toBe('blocked');
    expect(offOriginDisc.data.code).toBe('url_not_authorized');

    // 6. Login solicitado con credenciales disponibles: cero diálogos
    const authRes = await callJson(client, 'qap_auth_add', {
      targetPath: boundRoot,
      profile: 'qa_local',
      username: 'qa.operator',
      password: 'StagingPass#2026',
      role: 'operador',
      login_route: '/login',
    });
    expect(authRes.data.status).toBe('success');
    expect((authRes.data.profile as { verified?: boolean })?.verified).toBe(true);

    // 7. Discovery autenticado en otra ruta nueva (/app): cero diálogos
    const discProtected = await callJson(client, 'qap_discover', {
      targetPath: boundRoot,
      name: 'portal-pedidos',
      path: '/app',
      profile: 'qa_local',
      allow_spa: true,
    });
    expect(discProtected.isError, JSON.stringify(discProtected.data)).toBe(false);
    expect(discProtected.data.mode).toBe('fresh_authenticated_spa_readonly');

    // 8. Planificar módulo, aprobar caso y ejecutar QA funcional con Chromium real -> veredicto PASS
    const planRes = await callJson(client, 'qap_session_plan', {
      targetPath: boundRoot,
      plan: [{ module: 'portal-pedidos', path: '/app', priority: 'high' }],
      auth: { required: true, method: 'credentials', roles: ['operador'], profile: 'qa_local' },
    });
    expect(planRes.data.status).toBe('success');

    const proposeRes = await callJson(client, 'qap_plan', {
      targetPath: boundRoot,
      module: 'portal-pedidos',
      case_workflow: {
        action: 'propose_from_observations',
        proposals: [
          {
            title: 'Verificar panel protegido en flujo Stdio silencioso',
            expected_outcome: 'ORD-101',
            oracle_source: 'user',
            steps: [
              { type: 'navigate', url: `${staging.origin}/app?qap_read_only_probe=1` },
              { type: 'waitFor', selector: '#spa-shell' },
              { type: 'assert', selector: 'body', assertion_type: 'contains', expected: 'ORD-101' },
            ],
          },
        ],
      },
    });
    expect(proposeRes.isError, JSON.stringify(proposeRes.data)).toBe(false);
    const pendingCaseId = String((proposeRes.data.pending_oracle_cases as Array<Record<string, unknown>>)[0].case_id);
    const testArgs = { targetPath: boundRoot, module: 'portal-pedidos', environment: 'local', profile: 'qa_local' };
    const trafficBeforePreflight = staging.visitedRequests.length;
    const missingOracle = await callJson(client, 'qap_test', { ...testArgs, case_ids: [pendingCaseId] });
    expect(missingOracle.data).toMatchObject({
      status: 'blocked', code: 'executable_oracle_required', siguiente_accion: { tool: 'qap_plan' },
    });
    expect(staging.visitedRequests).toHaveLength(trafficBeforePreflight);
    const decideRes = await callJson(client, 'qap_plan', {
      targetPath: boundRoot,
      module: 'portal-pedidos',
      case_workflow: {
        action: 'decide_oracles',
        decisions: [
          {
            case_id: pendingCaseId,
            expected_outcome: 'ORD-101',
            assert_selector: 'body',
            assert_type: 'contains',
          },
        ],
      },
    });
    expect(decideRes.isError, JSON.stringify(decideRes.data)).toBe(false);
    const caseId = pendingCaseId;

    const approveRes = await callJson(client, 'qap_plan', {
      targetPath: boundRoot,
      module: 'portal-pedidos',
      case_workflow: { action: 'approve_batch', case_ids: [caseId] },
    });
    expect(approveRes.isError, JSON.stringify(approveRes.data)).toBe(false);

    const testPlanRes = await callJson(client, 'qap_plan', {
      targetPath: boundRoot,
      module: 'portal-pedidos',
    });
    expect(testPlanRes.isError, JSON.stringify(testPlanRes.data)).toBe(false);

    const withoutGrant = await callJson(client, 'qap_test', testArgs);
    expect(withoutGrant.data).toMatchObject({
      status: 'blocked', code: 'execution_authorization_required', siguiente_accion: { tool: 'qap_test' },
    });
    expect(staging.visitedRequests).toHaveLength(trafficBeforePreflight);
    const authorize = new QapApplicationService({ hostRootDir: appServiceDir, projectOperationDirectory: workspaceHostDir });
    try {
      const project = authorize.findActiveProjectByRoot(boundRoot)!;
      expect(authorize.listExecutionAttempts(project.project_id)).toHaveLength(0);
      authorize.authority.grant({
        project_id: project.project_id,
        capability: 'execute',
        scope: { root_path: boundRoot, origin: staging.origin, env_id: project.active_env_id! },
        granted_by: 'synthetic_host_operator',
      });
    } finally {
      authorize.close();
    }

    await client.close();
    const resumedClient = await connect();
    const reviewed = await callJson(resumedClient, 'qap_plan', {
      ...testArgs, case_workflow: { action: 'review', case_ids: [caseId] },
    });
    expect(reviewed.data).toMatchObject({ status: 'review', cases: [{
      case_id: caseId, conformity_status: 'approved', expectation: { expected_outcome: 'ORD-101' },
      steps: expect.arrayContaining([{ type: 'assert', selector: 'body', assertion_type: 'contains', expected: 'ORD-101' }]),
    }] });

    const testRes = await callJson(resumedClient, 'qap_test', testArgs);
    expect(testRes.isError, JSON.stringify(testRes.data)).toBe(false);
    expect(testRes.data).toMatchObject({
      result: 'passed', summary: { passed: 1, failed: 0 },
      attempt_id: expect.any(String), execution_id: expect.any(String),
      siguiente_accion: { tool: 'qap_report' },
    });
    expect(staging.visitedRequests.some(request => request.url === '/app?qap_read_only_probe=1')).toBe(true);
    expect(staging.mutatingRequests).toHaveLength(0);
    const executionId = String(testRes.data.execution_id);
    const attemptId = String(testRes.data.attempt_id);
    const reportArgs = { targetPath: boundRoot, module: testArgs.module, executionId };
    const rawPath = join(boundRoot, '.qa', 'executions', executionId + '.json');
    const execution = JSON.parse(readFileSync(rawPath, 'utf8'));
    const tracePath = join(boundRoot, execution.artifacts.trace_zip_path);
    expect(readFileSync(tracePath).byteLength).toBeGreaterThan(0);
    expect(execution).toMatchObject({ execution_id: executionId, attempt_id: attemptId,
      timeline: expect.arrayContaining([expect.objectContaining({
        case_id: caseId, action: 'assert', status: 'passed', expected: 'ORD-101', observed: expect.stringContaining('ORD-101'),
      })]),
    });

    // Un archivo estructuralmente válido no puede sustituir el resultado del intento.
    writeFileSync(rawPath, JSON.stringify({ ...execution, timed_out: !execution.timed_out }));
    const tampered = await callJson(resumedClient, 'qap_report', { ...reportArgs, format: 'json' });
    expect(tampered.data).toMatchObject({ status: 'blocked', code: 'execution_digest_mismatch' });
    writeFileSync(rawPath, JSON.stringify(execution));

    const report = await callJson(resumedClient, 'qap_report', { ...reportArgs, format: 'all' });
    expect(report.isError, JSON.stringify(report.data)).toBe(false);
    expect(report.data).toMatchObject({
      status: 'success', executionId, attempt_id: attemptId, summary: { passed: 1 },
      traceability_file: expect.any(String),
      canonical_execution_summary: { case_verdicts: [{ case_id: caseId, attempt_id: attemptId, verdict: 'PASS',
        evidence_refs: expect.arrayContaining([execution.artifacts.trace_zip_path]) }] },
    });
    const reports = report.data.reports as Record<string, string>;
    expect(Object.keys(reports).sort()).toEqual(['html', 'json', 'junit', 'markdown']);
    expect(JSON.parse(readFileSync(reports.json, 'utf8'))).toEqual(execution);
    expect(Object.values(reports).every(path => existsSync(path))).toBe(true);
    rmSync(tracePath);
    const missingEvidence = await callJson(resumedClient, 'qap_report', { ...reportArgs, format: 'json' });
    expect(missingEvidence.data).toMatchObject({
      status: 'blocked', code: 'execution_evidence_missing', artifact_reference_state: 'incomplete',
    });
    expect(missingEvidence.data).not.toHaveProperty('summary');

    // 9. Revocar permiso de login del perfil y verificar rechazo en login, discovery y test
    const listProjects = await callJson(resumedClient, 'qap_project', { action: 'list' });
    const projects = listProjects.data.projects as Array<{ project_id: string; canonical_root: string }>;
    const activeProject = projects.find((p) => p.canonical_root === boundRoot);
    expect(activeProject).toBeDefined();

    const revokeRes = await callJson(resumedClient, 'qap_project', {
      action: 'revoke_permission',
      project_id: activeProject!.project_id,
      capabilities: ['login'],
      reason: 'revoked_in_stdio_regression_test',
    });
    expect(revokeRes.data.status).toBe('success');

    const hitsAtRevocation = staging.visitedRequests.length;
    const authAfterRevoke = await callJson(resumedClient, 'qap_auth_add', {
      targetPath: boundRoot,
      profile: 'qa_local',
      username: 'qa.operator',
      password: 'StagingPass#2026',
      login_route: '/login',
    });
    expect(authAfterRevoke.isError).toBe(true);
    expect(authAfterRevoke.data.code).toBe('login_permission_unavailable');
    expect(staging.visitedRequests).toHaveLength(hitsAtRevocation);

    const discAfterRevoke = await callJson(resumedClient, 'qap_discover', {
      targetPath: boundRoot,
      name: 'portal-pedidos',
      path: '/app',
      profile: 'qa_local',
    });
    expect(discAfterRevoke.isError).toBe(true);
    expect(discAfterRevoke.data.code).toBe('auth_session_revoked');

    const testAfterRevoke = await callJson(resumedClient, 'qap_test', {
      targetPath: boundRoot,
      module: 'portal-pedidos',
      environment: 'local',
      profile: 'qa_local',
    });
    expect(testAfterRevoke.isError).toBe(true);
    expect(testAfterRevoke.data.code).toBe('auth_session_revoked');
  }, 60_000);

  it('preserva una única autoridad de entorno: no concede login ni execute silenciosos si YAML discrepa o es producción', async () => {
    staging = await startProtectedSpaStaging();
    const tempBase = mkdtempSync(join(tmpdir(), 'qap-single-auth-'));
    const hostDataDir = join(tempBase, 'qap-home');
    const workspaceHostDir = join(hostDataDir, 'workspaces');
    const appServiceDir = join(hostDataDir, 'application');
    const boundRoot = join(tempBase, 'bound-project');
    mkdirSync(boundRoot, { recursive: true });
    authorizeWorkspace(boundRoot, hostDataDir);

    const composition = await loadHostComposition({
      QAP_MCP_HOST_DATA_DIR: hostDataDir,
      QAP_MCP_WORKSPACE_HOST_DIR: workspaceHostDir,
      QAP_MCP_APP_SERVICE_DIR: appServiceDir,
    });
    disposables.push(() => {
      composition.close();
      rmSync(tempBase, { recursive: true, force: true });
    });

    const server = createMcpServer(composition.options);
    const client = new Client(
      { name: 'single-env-auth-client', version: '1.0.0' },
      { capabilities: { roots: {} } },
    );
    client.setRequestHandler(ListRootsRequestSchema, async () => ({
      roots: [{ uri: pathToFileURL(boundRoot).href, name: 'bound-project' }],
    }));

    const [t1, t2] = InMemoryTransport.createLinkedPair();
    await Promise.all([server.connect(t1), client.connect(t2)]);
    disposables.push(async () => {
      await client.close();
      await server.close();
    });

    await callJson(client, 'qap_status', { targetPath: boundRoot });
    await callJson(client, 'qap_context_set', {
      targetPath: boundRoot,
      base_url: staging.origin,
      source: 'user',
    });

    // Inyectar URL discrepante en .qa/project/environments.yaml
    const envsYamlPath = join(boundRoot, '.qa', 'project', 'environments.yaml');
    const existingYaml = existsSync(envsYamlPath)
      ? (YAML.parse(readFileSync(envsYamlPath, 'utf8')) as Record<string, unknown>)
      : {};
    writeFileSync(
      envsYamlPath,
      YAML.stringify({
        ...existingYaml,
        default: 'local',
        environments: {
          local: { url: 'http://127.0.0.1:59999' },
          production: { url: 'https://prod.example.invalid', is_production: true },
        },
      }),
      'utf8',
    );

    // La ruta heredada de login sigue cerrada y el login explícito exige el entorno activo.
    const requestCount = staging.visitedRequests.length;
    const discrepantAuth = await callJson(client, 'qap_auth_add', {
      targetPath: boundRoot,
      profile: 'qa_discrepant',
      login_route: '/login',
    });
    expect(discrepantAuth.data).toMatchObject({ status: 'blocked', code: 'legacy_auth_operation_disabled' });

    const prodAuth = await callJson(client, 'qap_auth_add', {
      targetPath: boundRoot,
      env: 'production',
      profile: 'qa_prod',
      username: 'qa.operator',
      password: 'StagingPass#2026',
      login_route: '/login',
    });
    expect(prodAuth.data).toMatchObject({ status: 'blocked', code: 'login_outside_configured_qa_environment' });

    mkdirSync(join(boundRoot, '.qa', 'modules', 'pedidos', 'tests'), { recursive: true });
    for (const environment of ['local', 'production']) {
      const test = await callJson(client, 'qap_test', { targetPath: boundRoot, module: 'pedidos', environment });
      expect(test.data).toMatchObject({ status: 'blocked', code: 'execution_environment_not_allowed' });
    }
    expect(staging.visitedRequests).toHaveLength(requestCount);
  }, 30_000);

  it('bloquea con error exacto cuando la composición real carece de raíz vinculada por el host', async () => {
    const tempBase = mkdtempSync(join(tmpdir(), 'qap-host-noroot-'));
    const hostDataDir = join(tempBase, 'qap-home');
    const arbitraryRoot = join(tempBase, 'arbitrary-root');
    mkdirSync(arbitraryRoot, { recursive: true });

    const composition = await loadHostComposition({
      QAP_MCP_HOST_DATA_DIR: hostDataDir,
      QAP_MCP_WORKSPACE_HOST_DIR: join(hostDataDir, 'workspaces'),
      QAP_MCP_APP_SERVICE_DIR: join(hostDataDir, 'application'),
    });
    disposables.push(() => {
      composition.close();
      rmSync(tempBase, { recursive: true, force: true });
    });

    const server = createMcpServer(composition.options);
    const client = new Client({ name: 'no-roots-client', version: '1.0.0' }, {});
    const [t1, t2] = InMemoryTransport.createLinkedPair();
    await Promise.all([server.connect(t1), client.connect(t2)]);
    disposables.push(async () => {
      await client.close();
      await server.close();
    });

    const blockedRes = await callJson(client, 'qap_status', { targetPath: arbitraryRoot });
    expect(blockedRes.data.status).toBe('blocked');
    expect(blockedRes.data.code).toBe('workspace_not_bound');
    expect(existsSync(join(arbitraryRoot, '.qa'))).toBe(false);
  });
});
