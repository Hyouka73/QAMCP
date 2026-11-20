import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { ListRootsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { QapApplicationService } from '../application/application-service.js';
import { workspaceStorageKey } from '../project-reset.js';
import { createMcpServer } from '../server.js';
import type { IWorkspaceAuthorizer, WorkspaceAuthorizationRequest } from '../workspace-authorizer.js';
import { WorkspaceBootstrap } from '../workspace-bootstrap.js';

import { connectHistoricalHost } from './fixtures/historical-host.js';

const executable = fileURLToPath(new URL('../../dist/server.js', import.meta.url));
const authorize = fileURLToPath(new URL('../../../../scripts/qap-authorize-workspace.mjs', import.meta.url));

let base: string;
let a: string;
let b: string;
let untrusted: string;
let host: string;
let url: string;
let requests: number;
let site: ReturnType<typeof createServer>;
let service: QapApplicationService;
const clients = new Set<Client>();
const cleanups = new Set<() => Promise<void>>();

function authorizeWorkspace(workspace: string, hostDir = host): void {
  execFileSync(process.execPath, [authorize, workspace], {
    env: {
      ...process.env,
      QAP_MCP_HOST_DATA_DIR: hostDir,
      QAP_MCP_APP_SERVICE_DIR: join(hostDir, 'application'),
      QAP_MCP_WORKSPACE_HOST_DIR: join(hostDir, 'workspaces'),
    },
    windowsHide: true,
  });
  const policyPath = join(hostDir, 'qa-autonomy-policy.json');
  const policy = existsSync(policyPath) ? JSON.parse(readFileSync(policyPath, 'utf8')) : { version: 1, targets: [] };
  if (!policy.targets.some((target: { workspace: string }) => target.workspace === workspace)) {
    policy.targets.push({ workspace, origin: new URL(url).origin, environment: 'test', entry: '/', paths: ['/', '/orders'] });
    writeFileSync(policyPath, JSON.stringify(policy));
  }
}

async function connectStdio(options: {
  roots?: () => string[];
  listChanged?: boolean;
  fixed?: string;
  hostDir?: string;
} = {}): Promise<Client> {
  const { roots, listChanged = false, fixed, hostDir = host } = options;
  const client = new Client(
    { name: 'multiproject-acceptance-client', version: '1.0.0' },
    roots ? { capabilities: { roots: { listChanged } } } : {},
  );
  if (roots) {
    client.setRequestHandler(ListRootsRequestSchema, () => ({
      roots: roots().map((root) => ({ uri: pathToFileURL(root).href })),
    }));
  }
  clients.add(client);
  await client.connect(
    new StdioClientTransport({
      command: process.execPath,
      args: [executable],
      stderr: 'pipe',
      env: {
        PATH: process.env.PATH ?? '',
        NODE_ENV: 'test',
        QAP_DISABLE_INTERACTIVE_AUTH: '1',
        QAP_MCP_HOST_DATA_DIR: hostDir,
        ...(fixed ? { QAP_MCP_WORKSPACE_ROOT: fixed } : {}),
        ...(process.env.PLAYWRIGHT_BROWSERS_PATH ? { PLAYWRIGHT_BROWSERS_PATH: process.env.PLAYWRIGHT_BROWSERS_PATH } : {}),
      },
    }),
  );
  return client;
}

async function call(client: Client, name: string, args: Record<string, unknown> = {}) {
  const response = await client.callTool({ name, arguments: args });
  const content = (response.content as Array<{ type: string; text?: string }>)[0];
  if (content?.type !== 'text' || !content.text) {
    throw new Error(`Invalid MCP response for ${name}`);
  }
  return JSON.parse(content.text) as Record<string, any>;
}

function eventLog(root: string): string {
  return readFileSync(join(root, '.qa', 'logs', 'qap-events.jsonl'), 'utf8');
}

beforeEach(async () => {
  base = realpathSync(mkdtempSync(join(tmpdir(), 'qap-multiproject-acceptance-')));
  a = join(base, 'workspace-A');
  b = join(base, 'workspace-B');
  untrusted = join(base, 'untrusted');
  host = join(base, 'host');
  mkdirSync(a);
  mkdirSync(b);
  mkdirSync(untrusted);
  service = new QapApplicationService({
    hostRootDir: join(host, 'application'),
    projectOperationDirectory: join(host, 'workspaces'),
  });
  requests = 0;
  site = createServer((_request, response) => {
    requests += 1;
    response
      .writeHead(200, { 'content-type': 'text/html' })
      .end('<!doctype html><title>MultiProject App</title><h1>Panel principal</h1><button>Ejecutar</button>');
  });
  await new Promise<void>((done) => site.listen(0, '127.0.0.1', done));
  url = 'http://127.0.0.1:' + (site.address() as { port: number }).port + '/';
});

afterEach(async () => {
  await Promise.all([...clients].map((client) => client.close().catch(() => undefined)));
  clients.clear();
  for (const cleanup of [...cleanups]) {
    await cleanup().catch(() => undefined);
  }
  cleanups.clear();
  service?.close();
  if (site?.listening) {
    await new Promise<void>((done, reject) => site.close((error) => (error ? reject(error) : done())));
  }
  rmSync(base, { recursive: true, force: true });
});

it('crea acceso local para el proyecto autorizado sin ampliar otras capacidades', async () => {
  authorizeWorkspace(a);
  const client = await connectStdio({ fixed: a });
  const created = await call(client, 'qap_project', {
    action: 'create',
    targetPath: a,
    name: 'Fixture de revisión sintético',
    base_url: 'http://127.0.0.1:1',
    env_name: 'local',
  });
  expect(created.status).toBe('success');
  const projectId = created.project.project_id as string;
  const grants = service.authority.listGrants(projectId);
  expect(grants).toMatchObject([{
    capability: 'access',
    scope: { root_path: a, env_id: created.project.active_env_id },
    status: 'active',
    granted_by: 'host_operator',
  }]);

  const proposal = {
    targetPath: a,
    module: 'pedidos',
    case_workflow: {
      action: 'propose_from_observations',
      proposals: [{
        title: 'Panel sintético',
        steps: [
          { type: 'navigate', url: 'http://127.0.0.1:1/app' },
          { type: 'waitFor', selector: '#panel' },
        ],
      }],
    },
  };
  // The local project is allowed, but its port differs from the autonomous policy origin.
  expect(await call(client, 'qap_plan', proposal)).toMatchObject({ status: 'blocked', code: 'autonomy_policy_required' });
  await client.close();

  const historical = new Client({ name: 'multiproject-historical-host', version: '1' });
  clients.add(historical);
  await connectHistoricalHost(historical, {
    QAP_MCP_HOST_DATA_DIR: host,
    QAP_MCP_WORKSPACE_ROOT: a,
    QAP_DISABLE_INTERACTIVE_AUTH: '1',
  });
  const review = () => call(historical, 'qap_plan', {
    targetPath: a, module: 'pedidos', case_workflow: { action: 'review' },
  });
  const proposed = await call(historical, 'qap_plan', proposal);
  expect(proposed).toMatchObject({ status: 'proposed', summary: { pending_oracle: 1 } });
  expect(await review()).toMatchObject({ status: 'review', read_only: true, summary: { pending_oracle: 1 } });
  service.authority.revokeGrant(projectId, grants[0].grant_id);
  expect(await review()).toMatchObject({ status: 'blocked', code: 'capability_access_revoked' });
  expect(requests).toBe(0);
}, 30000);


it('A/B/C/P: inicia globalmente sin proyectos ni QAP_MCP_WORKSPACE_ROOT, sobrevive raíces borradas y prepara A desde cero', async () => {
  // A: Inicio global sin proyectos ni QAP_MCP_WORKSPACE_ROOT.
  const freshClient = await connectStdio();
  const tools = (await freshClient.listTools()).tools;
  expect(tools).toHaveLength(16);
  expect(tools.map(tool => tool.name)).not.toContain('qap_module_close');
  const planTool = tools.find(tool => tool.name === 'qap_plan');
  expect(planTool?.description).toContain('casos elegibles');
  expect(planTool?.description).not.toContain('aprobación por lotes');
  const workflow = planTool?.inputSchema.properties?.case_workflow;
  expect(workflow).toMatchObject({ properties: { proposals: { items: {
    additionalProperties: false, required: ['title', 'route'],
  } } } });
  const testTool = tools.find(tool => tool.name === 'qap_test');
  expect(testTool?.inputSchema).toMatchObject({ required: ['module'], properties: {
    case_ids: { description: expect.stringContaining('elegibles') },
  } });
  const startTool = tools.find((tool) => tool.name === 'qap_start');
  expect(startTool?.inputSchema?.properties).toHaveProperty('conversation_id');
  expect(startTool?.inputSchema?.properties).not.toHaveProperty('credentials');

  expect(await call(freshClient, 'qap_project', { action: 'list' })).toMatchObject({
    status: 'success',
    projects: [],
    active_project_id: null,
    active_workspace: null,
  });
  expect(await call(freshClient, 'qap_start')).toMatchObject({
    status: 'blocked',
    code: 'workspace_selection_required',
  });
  await freshClient.close();

  // B1: Proyecto histórico eliminado en disco -> el MCP global sigue iniciando para otros proyectos.
  const obsolete = join(base, 'obsolete-project');
  mkdirSync(obsolete);
  authorizeWorkspace(obsolete);
  authorizeWorkspace(a);
  const setupClient = await connectStdio();
  expect(await call(setupClient, 'qap_start', { targetPath: obsolete, base_url: url })).toMatchObject({
    status: 'success',
    directorio_objetivo: obsolete,
  });
  await setupClient.close();
  rmSync(obsolete, { recursive: true, force: true });

  const afterDeletionClient = await connectStdio();
  const listAfterDeletion = await call(afterDeletionClient, 'qap_project', { action: 'list' });
  expect(listAfterDeletion.status).toBe('success');

  // C: Seleccionar explícitamente A genera .qa/ y Knowledge solo en A.
  const startedA = await call(afterDeletionClient, 'qap_start', { targetPath: a, base_url: url });
  expect(startedA).toMatchObject({
    status: 'success',
    directorio_objetivo: a,
    conversation_id: expect.any(String),
    discovery_inicial: { index_path: '.qa/discovery/INDEX.md' },
  });
  expect(existsSync(join(a, '.qa', 'project'))).toBe(true);
  expect(existsSync(join(a, '.qa', 'discovery', 'INDEX.md'))).toBe(true);
  expect(existsSync(join(a, '.qa', 'logs', 'qap-events.jsonl'))).toBe(true);
  expect(existsSync(startedA.conversation_log)).toBe(true);
  expect(existsSync(join(host, 'workspaces', workspaceStorageKey(a), 'knowledge.sqlite'))).toBe(true);
  expect(existsSync(join(b, '.qa'))).toBe(false);
  await afterDeletionClient.close();

  // B2: QAP_MCP_WORKSPACE_ROOT apuntando a ruta eliminada no impide arrancar el proceso (fail-closed sin crash).
  const brokenFixedClient = await connectStdio({ fixed: obsolete });
  expect(await call(brokenFixedClient, 'qap_status')).toMatchObject({
    status: 'blocked',
    code: 'workspace_root_unavailable',
  });
  await brokenFixedClient.close();

  // P: Modo restringido opcional sigue bloqueando fuera de la raíz fija y desajustes con el host.
  authorizeWorkspace(b);
  const restrictedClient = await connectStdio({ fixed: a });
  expect(await call(restrictedClient, 'qap_status', { targetPath: b })).toMatchObject({
    status: 'blocked',
    code: 'workspace_outside_configured_root',
  });
  await restrictedClient.close();
  const mismatchClient = await connectStdio({ fixed: a, roots: () => [b] });
  expect(await call(mismatchClient, 'qap_status')).toMatchObject({
    status: 'blocked',
    code: 'workspace_host_root_mismatch',
  });
}, 60_000);

it('D/E/F/G/H/L/O: en UNA instancia viva alterna A -> B -> A, separa URL compartida, conversaciones y reanuda campaña', async () => {
  authorizeWorkspace(a);
  authorizeWorkspace(b);

  // Subcaso 1: Host sin roots/list (modo Antigravity) con cambio en caliente A -> B -> A en una sola conexión.
  const liveClient = await connectStdio();

  const resA1 = await call(liveClient, 'qap_start', { targetPath: a, base_url: url });
  expect(resA1).toMatchObject({ status: 'success', directorio_objetivo: a });
  const convA = String(resA1.conversation_id);
  const pa = service.findActiveProjectByRoot(a)!;

  // Cambio explícito en caliente a B (sin reiniciar ni editar config).
  const resB1 = await call(liveClient, 'qap_start', { targetPath: b, base_url: url });
  expect(resB1).toMatchObject({ status: 'success', directorio_objetivo: b });
  const convB = String(resB1.conversation_id);
  const pb = service.findActiveProjectByRoot(b)!;

  // E & L: Misma URL pero proyectos, apps, entornos, revisiones, .qa/ y Knowledge totalmente distintos.
  expect(pa.project_id).not.toBe(pb.project_id);
  expect(pa.application_id).not.toBe(pb.application_id);
  const snapA = service.resumeProject(pa.project_id, { readOnly: true });
  const snapB = service.resumeProject(pb.project_id, { readOnly: true });
  expect(snapA.environment?.base_url).toBe(url);
  expect(snapB.environment?.base_url).toBe(url);
  expect(snapA.environment?.env_id).not.toBe(snapB.environment?.env_id);
  expect(resA1.discovery_inicial.revision_id).not.toBe(resB1.discovery_inicial.revision_id);
  expect(existsSync(join(host, 'workspaces', workspaceStorageKey(a), 'knowledge.sqlite'))).toBe(true);
  expect(existsSync(join(host, 'workspaces', workspaceStorageKey(b), 'knowledge.sqlite'))).toBe(true);
  expect(readFileSync(join(a, resA1.discovery_inicial.index_path), 'utf8')).toContain(pa.project_id);
  expect(readFileSync(join(b, resB1.discovery_inicial.index_path), 'utf8')).toContain(pb.project_id);

  // F: Intentar operar sobre A mientras B es activo -> BLOCKED sin efectos secundarios.
  const requestsBeforeBlock = requests;
  const logABefore = eventLog(a);
  const logBBefore = eventLog(b);
  expect(await call(liveClient, 'qap_status', { targetPath: a })).toMatchObject({
    status: 'blocked',
    code: 'workspace_outside_configured_root',
  });
  expect(await call(liveClient, 'qap_rules_set', { targetPath: a, module: 'auth', canonical_interview: { action: 'next' } }))
    .toMatchObject({ status: 'blocked', code: 'workspace_outside_configured_root' });
  expect(await call(liveClient, 'qap_project', { action: 'discovery_dossier', targetPath: a }))
    .toMatchObject({ status: 'blocked', code: 'workspace_outside_configured_root' });
  expect(requests).toBe(requestsBeforeBlock);
  expect(eventLog(a)).toBe(logABefore);
  expect(eventLog(b)).toBe(logBBefore);

  // G: Conversación cruzada rechazada + llamadas concurrentes por conversation_id en la misma conexión.
  expect(await call(liveClient, 'qap_status', { conversation_id: convA, targetPath: b })).toMatchObject({
    status: 'blocked',
    code: 'conversation_not_in_workspace',
  });
  expect(await call(liveClient, 'qap_status', { conversation_id: convB, targetPath: a })).toMatchObject({
    status: 'blocked',
    code: 'conversation_not_in_workspace',
  });
  const [statusConvA, statusConvB] = await Promise.all([
    call(liveClient, 'qap_status', { conversation_id: convA }),
    call(liveClient, 'qap_status', { conversation_id: convB }),
  ]);
  expect(statusConvA).toMatchObject({ status: 'success', directorio_objetivo: a });
  expect(statusConvB).toMatchObject({ status: 'success', directorio_objetivo: b });
  expect(await call(liveClient, 'qap_status')).toMatchObject({ status: 'success', directorio_objetivo: b });
  expect(eventLog(a)).not.toContain(convB);
  expect(eventLog(b)).not.toContain(convA);

  // Cambio explícito de regreso B -> A dentro de la misma conexión via qap_project(select).
  const switchedBack = await call(liveClient, 'qap_project', { action: 'select', project_id: pa.project_id });
  expect(switchedBack).toMatchObject({
    status: 'success',
    project: { project_id: pa.project_id, canonical_root: a },
  });
  expect(await call(liveClient, 'qap_status')).toMatchObject({ status: 'success', directorio_objetivo: a });
  const listedMid = await call(liveClient, 'qap_project', { action: 'list' });
  expect(listedMid).toMatchObject({
    status: 'success',
    active_project_id: pa.project_id,
    active_workspace: a,
  });
  await liveClient.close();

  // H: Reanudar campaña en una conexión nueva conserva project_id/campaign_id y reutiliza discovery.
  const resumedClient = await connectStdio();
  const resumed = await call(resumedClient, 'qap_project', { action: 'resume', project_id: pb.project_id });
  expect(resumed).toMatchObject({
    status: 'success',
    project: { project_id: pb.project_id, canonical_root: b },
    campaign: { campaign_id: snapB.campaign?.campaign_id },
  });
  const freshStartB = await call(resumedClient, 'qap_start', { targetPath: b });
  expect(freshStartB.conversation_id).not.toBe(convB);
  expect(freshStartB.discovery_inicial).toMatchObject({
    revision_id: resB1.discovery_inicial.revision_id,
    reused: true,
  });
  await resumedClient.close();

  // Subcaso 2 (D/O con roots/list dinámicas + notifications/roots/list_changed): A -> B -> A en una sola conexión.
  let dynamicRoots = [a];
  const dynamicClient = await connectStdio({ roots: () => dynamicRoots, listChanged: true });
  expect(await call(dynamicClient, 'qap_status')).toMatchObject({ status: 'success', directorio_objetivo: a });

  dynamicRoots = [b];
  await dynamicClient.sendRootsListChanged();
  expect(await call(dynamicClient, 'qap_status')).toMatchObject({
    status: 'blocked',
    code: 'workspace_host_root_changed',
  });
  expect(await call(dynamicClient, 'qap_start', { targetPath: b })).toMatchObject({
    status: 'success',
    directorio_objetivo: b,
  });
  expect(await call(dynamicClient, 'qap_status')).toMatchObject({ status: 'success', directorio_objetivo: b });

  dynamicRoots = [a];
  await dynamicClient.sendRootsListChanged();
  expect(await call(dynamicClient, 'qap_project', { action: 'select', project_id: pa.project_id })).toMatchObject({
    status: 'success',
    project: { project_id: pa.project_id, canonical_root: a },
  });
  expect(await call(dynamicClient, 'qap_status')).toMatchObject({ status: 'success', directorio_objetivo: a });
}, 90_000);

it('recovers the approved plan and scopes diagnostics to its conversation after switching projects', async () => {
  authorizeWorkspace(a);
  authorizeWorkspace(b);
  const client = await connectStdio();
  const first = await call(client, 'qap_start', { targetPath: a, base_url: url });
  const second = await call(client, 'qap_start', { targetPath: b, base_url: url });
  const conversation = { conversation_id: first.conversation_id };
  expect(first).toMatchObject({ status: 'success', directorio_objetivo: a });
  expect(second).toMatchObject({ status: 'success', directorio_objetivo: b });

  const lifeA = join(a, '.qa', 'project', 'lifecycle.json');
  const lifeB = join(b, '.qa', 'project', 'lifecycle.json');
  const beforeB = readFileSync(lifeB, 'utf8');
  const logB = eventLog(b);
  const seed = JSON.parse(readFileSync(lifeA, 'utf8'));
  seed.phase = 'WORKING';
  seed.session = { id: 'current-campaign', started_at: new Date().toISOString(), plan: [] };
  writeFileSync(lifeA, JSON.stringify(seed));
  const sessions = join(a, '.qa', 'project', 'sessions');
  mkdirSync(sessions, { recursive: true });
  writeFileSync(join(sessions, 'previous-campaign.report.md'), '# Previous campaign');

  const module = { module: 'orders', path: '/orders', priority: 'low', flujos: ['Consultar', 'Confirmar'] };
  const approved = [{ ...module, status: 'planned', provenance: { source: 'modules' } }];
  const plan = await call(client, 'qap_session_plan', { ...conversation, modules: [module] });
  expect(plan).toMatchObject({ status: 'success', fase: 'WORKING', plan: approved });
  const saved = JSON.parse(readFileSync(lifeA, 'utf8'));
  expect(saved.session.plan).toEqual(approved);
  expect(saved.plan_revisions.at(-1)).toMatchObject({ id: plan.plan_revision_id, plan: approved });

  expect(await call(client, 'qap_status', conversation)).toMatchObject({
    fase: 'WORKING', closure_state: 'incomplete', session_plan: approved, plan_revision_id: plan.plan_revision_id,
  });
  expect(await call(client, 'qap_session_plan', { ...conversation, modules: [{ ...module, priority: 'high' }] }))
    .toMatchObject({ status: 'blocked', code: 'working_plan_conflict', fase: 'WORKING' });
  expect(eventLog(a).trim().split(/\r?\n/).map(line => JSON.parse(line))).toContainEqual(expect.objectContaining({
    conversation_id: first.conversation_id,
    tool: 'qap_session_plan',
    phase: 'WORKING',
    operation: 'persist_plan',
    error: { code: 'working_plan_conflict' },
    evidence_refs: [],
  }));
  expect(readFileSync(lifeB, 'utf8')).toBe(beforeB);
  expect(eventLog(b)).toBe(logB);
}, 60_000);

it('I: flujo interactivo sin roots del host solicita selección explícita y aplica rechazo/aprobación del diálogo', async () => {
  const freshRaw = join(base, 'fresh-interactive');
  mkdirSync(freshRaw, { recursive: true });
  const freshDir = realpathSync(freshRaw);
  // Ensure freshDir has no prior authorization.
  expect(existsSync(join(freshDir, '.qa'))).toBe(false);

  let nextDecision: 'approved' | 'rejected' = 'rejected';
  const requestAuthorization = vi.fn(async (req: WorkspaceAuthorizationRequest) => {
    if (nextDecision === 'rejected') {
      return { decision: 'rejected' as const, root: req.canonicalPath, reason: 'Operador rechazó la carpeta.' };
    }
    return { decision: 'approved' as const, root: req.canonicalPath };
  });
  const authorizer: IWorkspaceAuthorizer = { requestAuthorization };

  const workspacesDir = join(host, 'workspaces');
  const registryPath = join(workspacesDir, 'authorized-roots.json');
  const bootstrap = new WorkspaceBootstrap(workspacesDir, service);
  const server = createMcpServer({
    multiProjectRuntime: true,
    silentBoundScope: true,
    preferHostWorkspaceAuthorizer: true,
    workspaceBootstrap: bootstrap,
    applicationService: service,
    workspaceAuthorizer: authorizer,
    hostRegistryPath: registryPath,
    projectRoots: [],
  });
  const client = new Client({ name: 'interactive-multiproject-client', version: '1.0.0' }, {});
  const [transportA, transportB] = InMemoryTransport.createLinkedPair();
  await server.connect(transportB);
  await client.connect(transportA);
  cleanups.add(async () => {
    await client.close();
    await server.close();
    bootstrap.close();
  });

  // Sin targetPath -> no adivina y nunca dispara el diálogo todavía.
  expect(await call(client, 'qap_start')).toMatchObject({
    status: 'blocked',
    code: 'workspace_selection_required',
  });
  expect(requestAuthorization).not.toHaveBeenCalled();

  // Con targetPath rechazado -> bloqueo fail-closed sin escrituras.
  expect(await call(client, 'qap_start', { targetPath: freshDir })).toMatchObject({
    status: 'blocked',
    code: 'workspace_authorization_rejected',
  });
  expect(requestAuthorization).toHaveBeenCalledTimes(1);
  expect(existsSync(join(freshDir, '.qa'))).toBe(false);
  expect(service.findActiveProjectByRoot(freshDir)).toBeNull();

  // Con targetPath aprobado -> persiste grant host_interactive_dialog + registry y prepara A.
  nextDecision = 'approved';
  const approvedStart = await call(client, 'qap_start', { targetPath: freshDir, base_url: url });
  expect(approvedStart).toMatchObject({
    status: 'success',
    directorio_objetivo: freshDir,
  });
  expect(requestAuthorization).toHaveBeenCalledTimes(2);
  expect(existsSync(join(freshDir, '.qa', 'discovery', 'INDEX.md'))).toBe(true);
  const registeredRoots = JSON.parse(readFileSync(registryPath, 'utf8')) as string[];
  expect(registeredRoots.map((item) => item.toLowerCase())).toContain(freshDir.toLowerCase());
  const isRegistered = (candidate: string) =>
    registeredRoots.some((entry) => entry.toLowerCase() === candidate.toLowerCase());
  const authRef = service.getRootAuthorizationReference(freshDir, isRegistered);
  expect(authRef).toMatchObject({
    canonical_root: freshDir,
    grant_id: expect.any(String),
    generation: expect.any(String),
    protected_ancestors: [],
  });
  expect(service.findActiveProjectByRoot(freshDir)).not.toBeNull();
}, 60_000);

it('J/K/M/N/Q: multi-root sin adivinar, expulsión por carpeta borrada, aislamiento de perfiles/permisos, traversal y superficie deshabilitada', async () => {
  authorizeWorkspace(a);
  authorizeWorkspace(b);

  // J: Host multi-root [A, B] no adivina al omitir targetPath y lista opciones.
  const multiRootClient = await connectStdio({ roots: () => [a, b] });
  const multiPrompt = await call(multiRootClient, 'qap_start');
  expect(multiPrompt).toMatchObject({
    status: 'blocked',
    code: 'workspace_selection_required',
    available_workspaces: expect.arrayContaining([
      expect.objectContaining({ root: a }),
      expect.objectContaining({ root: b }),
    ]),
  });
  expect(await call(multiRootClient, 'qap_status')).toMatchObject({
    status: 'blocked',
    code: 'workspace_not_bound',
  });
  const selectedB = await call(multiRootClient, 'qap_start', { targetPath: b, base_url: url });
  expect(selectedB).toMatchObject({ status: 'success', directorio_objetivo: b });
  const pbMulti = service.findActiveProjectByRoot(b)!;
  expect(await call(multiRootClient, 'qap_start', { targetPath: a, base_url: url })).toMatchObject({
    status: 'success',
    directorio_objetivo: a,
  });
  expect(await call(multiRootClient, 'qap_project', { action: 'select', project_id: pbMulti.project_id })).toMatchObject({
    status: 'success',
    project: { project_id: pbMulti.project_id, canonical_root: b },
  });
  await multiRootClient.close();

  // K & M: Borrar A en caliente invalida A sin botar MCP y permite pasar a B; perfiles/permisos quedan aislados.
  const liveClient = await connectStdio();
  const startedA = await call(liveClient, 'qap_start', { targetPath: a, base_url: url });
  expect(startedA.status).toBe('success');
  const pa = service.findActiveProjectByRoot(a)!;
  const startedB = await call(liveClient, 'qap_start', { targetPath: b, base_url: url });
  const pb = service.findActiveProjectByRoot(b)!;
  service.upsertProfile({ projectId: pa.project_id, envId: pa.active_env_id!, label: 'perfil-exclusivo-a' });
  service.upsertProfile({ projectId: pb.project_id, envId: pb.active_env_id!, label: 'perfil-exclusivo-b' });

  const resumedB = await call(liveClient, 'qap_project', { action: 'resume', project_id: pb.project_id });
  expect(resumedB.profiles).toEqual([expect.objectContaining({ label: 'perfil-exclusivo-b' })]);

  // Revocar acceso a A bloquea A sin afectar B.
  const grantA = service.authority.check(pa.project_id, 'access', { root_path: a }, undefined, Date.now(), false).grant!;
  service.authority.revokeGrant(pa.project_id, grantA.grant_id);
  expect(await call(liveClient, 'qap_start', { targetPath: a })).toMatchObject({ status: 'blocked' });
  expect(await call(liveClient, 'qap_status', { conversation_id: startedB.conversation_id })).toMatchObject({
    status: 'success',
    directorio_objetivo: b,
  });

  // Reactivar selección hacia una tercera carpeta para probar borrado físico mid-session (K).
  const tempWs = join(base, 'temp-ephemeral');
  mkdirSync(tempWs);
  authorizeWorkspace(tempWs);
  const startedTemp = await call(liveClient, 'qap_start', { targetPath: tempWs, base_url: url });
  expect(startedTemp.status).toBe('success');
  rmSync(tempWs, { recursive: true, force: true });
  expect(await call(liveClient, 'qap_status')).toMatchObject({
    status: 'blocked',
    code: 'workspace_root_unavailable',
  });
  expect(await call(liveClient, 'qap_status', { conversation_id: startedTemp.conversation_id })).toMatchObject({
    status: 'blocked',
    code: 'workspace_not_bound',
  });

  // Confirmar también expulsión inmediata cuando llega una llamada directa con conversation_id tras borrar la carpeta.
  const tempWs2 = join(base, 'temp-ephemeral-2');
  mkdirSync(tempWs2);
  authorizeWorkspace(tempWs2);
  const startedTemp2 = await call(liveClient, 'qap_start', { targetPath: tempWs2, base_url: url });
  expect(startedTemp2.status).toBe('success');
  rmSync(tempWs2, { recursive: true, force: true });
  expect(await call(liveClient, 'qap_status', { conversation_id: startedTemp2.conversation_id })).toMatchObject({
    status: 'blocked',
    code: 'workspace_root_unavailable',
  });

  // El servidor sigue sano y permite continuar en B sobre la misma conexión.
  expect(await call(liveClient, 'qap_start', { targetPath: b })).toMatchObject({
    status: 'success',
    directorio_objetivo: b,
  });

  // N: Ruta no autorizada, traversal o dentro del directorio interno del host -> BLOCKED sin escrituras.
  expect(await call(liveClient, 'qap_start', { targetPath: untrusted })).toMatchObject({
    status: 'blocked',
    code: 'workspace_persistent_authority_required',
  });
  expect(existsSync(join(untrusted, '.qa'))).toBe(false);
  expect(await call(liveClient, 'qap_start', { targetPath: join(b, '..', 'untrusted') })).toMatchObject({
    status: 'blocked',
    code: 'workspace_persistent_authority_required',
  });
  expect(await call(liveClient, 'qap_start', { targetPath: join(host, 'application') })).toMatchObject({
    status: 'blocked',
    code: 'workspace_persistent_authority_required',
  });
  expect(await call(liveClient, 'qap_start', { targetPath: join(host, 'workspaces') })).toMatchObject({
    status: 'blocked',
    code: 'workspace_path_invalid',
  });
  expect(await call(liveClient, 'qap_start', { targetPath: join(base, 'does-not-exist') })).toMatchObject({
    status: 'blocked',
    code: 'workspace_path_invalid',
  });

  // Q: Superficies administrativas / deshabilitadas siguen bloqueadas.
  for (const disabledTool of ['qap_flow_run', 'qap_server', 'qap_validate']) {
    expect(await call(liveClient, disabledTool)).toMatchObject({ status: 'blocked', code: 'operation_disabled' });
  }
  expect(await call(liveClient, 'qap_project', { action: 'recover', project_id: pb.project_id })).toMatchObject({
    status: 'blocked',
    code: 'administrative_recovery_unavailable',
  });
  expect(await call(liveClient, 'qap_project', { action: 'discovery_dossier_regenerate', targetPath: b })).toMatchObject({
    status: 'blocked',
    code: 'operation_disabled',
  });
  writeFileSync(join(b, 'spec.md'), '# Spec', 'utf8');
  expect(await call(liveClient, 'qap_context_ingest', { targetPath: b, docPath: join(b, 'spec.md') })).toMatchObject({
    status: 'error',
    code: 'direct_document_path_unavailable',
  });
  expect(await call(liveClient, 'qap_context_set', {
    targetPath: b,
    source_of_truth: { ref: join(b, 'spec.md') },
  })).toMatchObject({
    status: 'error',
    code: 'direct_document_path_unavailable',
  });
}, 90_000);
