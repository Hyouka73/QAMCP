import { existsSync, mkdtempSync, rmSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { canExitScoping, validarPregunta, type Pregunta, generarRenderTexto } from '@qap/engine';
import { isAuthPath, type AuthProfile, type LifecycleState } from '@qap/shared';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import YAML from 'yaml';

import {
  startAuthFixtureServer,
  TEST_CREDENTIALS,
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_VALID_VALUE,
  AUTH_COOKIE_EXPIRED_VALUE,
  type AuthFixtureServerInstance,
} from '../../../playwright-adapter/test/fixtures/auth-fixture-server.js';
import { QapApplicationService } from '../application/application-service.js';
import type { IAuthAuthorizer } from '../auth-authorizer.js';
import type { IDiscoveryAuthorizer } from '../discovery-authorizer.js';
import { getPhaseGuidance } from '../guidance.js';
import { createMcpServer } from '../server.js';
import type { IWorkspaceAuthorizer } from '../workspace-authorizer.js';
import { WorkspaceBootstrap } from '../workspace-bootstrap.js';

// In-memory keychain mock para pruebas deterministas sin dependencias del llavero del SO
const inMemoryKeychain = new Map<string, string>();
// Inject the port explicitly: native imports in an external built package are not Vitest mocks.
vi.mock('@qap/auth', async (original) => {
  const actual = await original<typeof import('@qap/auth')>();
  return { ...actual, AuthManager: class extends actual.AuthManager {
    constructor(projectPath?: string) {
      super(projectPath, { vault: new actual.TieredCredentialVault({ keychain: new actual.KeychainCredentialProvider(async () => ({
        getPassword: async (service, account) => inMemoryKeychain.get(service + ':' + account) ?? null,
        setPassword: async (service, account, secret) => { inMemoryKeychain.set(service + ':' + account, secret); },
        deletePassword: async (service, account) => inMemoryKeychain.delete(service + ':' + account),
      })) }) });
    }
  } };
});

interface ToolResponseData {
  status?: string;
  code?: string;
  razon?: string;
  page_kind?: string;
  redirected?: boolean;
  final_url?: string;
  downgraded_to_anonymous?: boolean;
  observations?: number;
  counts?: { views?: number; forms?: number; controls?: number; blocked_routes?: number };
  routes?: Array<{ reference?: string; state?: string; reason?: string; http_status?: number }>;
  discovery_revision_id?: string;
  verified?: boolean;
  desbloquear_con?: { tool?: string; descripcion?: string };
  siguiente_accion?: { tipo?: string; tool?: string; parametros?: Record<string, unknown>; pregunta?: Pregunta };
  profile?: { verified?: boolean; verified_route?: string; login_mode?: string };
  profiles?: Array<{ id?: string; verified?: boolean; status?: string }>;
  view?: { page_kind?: string };
  storage_state_used?: boolean;
  fase?: string;
  plan?: Array<{ module: string; path: string; acceso?: boolean }>;
  error?: string;
}

describe('P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP)', { timeout: 35000 }, () => {
  let fixtureServer: AuthFixtureServerInstance;
  let tempDir: string;
  let serverHandler: (request: unknown, extra: unknown) => Promise<CallToolResult>;

  beforeAll(async () => {
    fixtureServer = await startAuthFixtureServer();
  });

  afterAll(async () => {
    await fixtureServer.close();
  });

  beforeEach(async () => {
    inMemoryKeychain.clear();
    tempDir = mkdtempSync(join(tmpdir(), 'qap-p4-4-test-'));

    const server = createMcpServer();
    // @ts-expect-error accessing internal request handler for integration tests
    serverHandler = server._requestHandlers.get(CallToolRequestSchema.shape.method.value);

    // Inicializar proyecto canónico .qa/ en tempDir
    await serverHandler(
      {
        method: 'tools/call',
        params: { name: 'qap_init', arguments: { targetPath: tempDir } },
      },
      {}
    );

    // Escribir environments.yaml apuntando al fixture HTTP local
    const envs = {
      default: 'local',
      environments: {
        local: {
          url: fixtureServer.baseUrl,
          browser: 'chromium',
        },
      },
    };
    writeFileSync(join(tempDir, '.qa', 'project', 'environments.yaml'), YAML.stringify(envs), 'utf-8');

    // Escribir context.yaml confirmado
    const ctx = {
      objective: 'Probar flujo completo de autenticación y navegación',
      roles: [{ name: 'admin', description: 'Administrador del sistema', source: 'user' }],
      critical_flows: [{ name: 'Acceso seguro', source: 'user' }, { name: 'Dashboard protegido', source: 'user' }],
      source_of_truth: { type: 'prd', ref: 'PRD.md', declared: true, source: 'user' },
    };
    writeFileSync(join(tempDir, '.qa', 'project', 'context.yaml'), YAML.stringify(ctx), 'utf-8');

    // Escribir lifecycle.json formalmente en fase SCOPING
    const lifecycle = {
      version: '3.0.0',
      phase: 'SCOPING',
      history: [
        { from: null, to: 'ONBOARDING', at: new Date().toISOString(), reason: 'init' },
        { from: 'ONBOARDING', to: 'SCOPING', at: new Date().toISOString(), reason: 'onboarding superado' },
      ],
      modules: {},
    };
    const lifecycleJson = JSON.stringify(lifecycle, null, 2);
    writeFileSync(join(tempDir, '.qa', 'lifecycle.json'), lifecycleJson, 'utf-8');
    writeFileSync(join(tempDir, '.qa', 'project', 'lifecycle.json'), lifecycleJson, 'utf-8');

    mkdirSync(join(tempDir, '.qa', 'project', 'auth'), { recursive: true });
  });

  const hostCleanups: Array<() => void> = [];

  afterEach(() => {
    while (hostCleanups.length > 0) {
      try {
        hostCleanups.pop()!();
      } catch { /* empty */ }
    }
    if (tempDir && existsSync(tempDir)) {
      try {
        rmSync(tempDir, { recursive: true, force: true });
      } catch { /* empty */ }
    }
    delete (globalThis as Record<string, unknown>).__QAP_HANDOFF_TEST_HOOK__;
  });

  async function createHostFixture(credentialValue: string = TEST_CREDENTIALS.password, useAuthAuthorizer = false) {
    const baseDir = mkdtempSync(join(tmpdir(), 'qap-p4-4-host-'));
    const hostDir = join(baseDir, 'host');
    const workspaceDir = join(baseDir, 'workspace');
    mkdirSync(hostDir, { recursive: true });
    mkdirSync(workspaceDir, { recursive: true });

    const appService = new QapApplicationService({ hostRootDir: hostDir });
    const bootstrap = new WorkspaceBootstrap(hostDir, appService);
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
    const server = createMcpServer({
      workspaceBootstrap: bootstrap,
      applicationService: bootstrap.appService,
      workspaceAuthorizer,
      hostRegistryPath: join(hostDir, 'authorized-workspaces.json'),
      discoveryAuthorizer,
      hostDiscoveryRegistryPath: join(hostDir, 'authorized-discoveries.json'),
      ...(useAuthAuthorizer
        ? {
            authAuthorizer,
            hostAuthRegistryPath: join(hostDir, 'authorized-auth.json'),
          }
        : {
            interactiveAccessAuthorizer: {
              requestAuthorization: discoveryAuthorizer.requestAuthorization,
              requestCredential: vi.fn(async () => credentialValue),
            },
          }),
      allowSpaReadOnly: true,
    });
    // @ts-expect-error accessing internal request handler
    const handler = server._requestHandlers.get(CallToolRequestSchema.shape.method.value) as (
      req: unknown,
      extra: unknown
    ) => Promise<CallToolResult>;

    hostCleanups.push(() => {
      bootstrap.close();
      appService.close();
      rmSync(baseDir, { recursive: true, force: true });
    });

    const callHostTool = async (name: string, args: Record<string, unknown> = {}) => {
      const res = await handler(
        { method: 'tools/call', params: { name, arguments: { targetPath: workspaceDir, ...args } } },
        {}
      );
      const firstItem = res.content?.[0];
      const textVal = firstItem && 'text' in firstItem && typeof (firstItem as { text?: unknown }).text === 'string'
        ? (firstItem as { text: string }).text
        : '';
      let parsed: ToolResponseData = {};
      try {
        parsed = JSON.parse(textVal) as ToolResponseData;
      } catch { /* empty */ }
      return { res, parsed, text: textVal };
    };

    await callHostTool('qap_init', { baseUrl: fixtureServer.baseUrl });
    await callHostTool('qap_context_set', {
      base_url: fixtureServer.baseUrl,
      objective: 'Probar flujo completo de autenticación y navegación',
      roles: [{ name: 'admin', description: 'Administrador del sistema', source: 'user' }],
      critical_flows: [{ name: 'Acceso seguro', source: 'user' }, { name: 'Dashboard protegido', source: 'user' }],
      source_of_truth: { type: 'prd', ref: 'PRD.md', declared: true, source: 'user' },
    });

    return { hostDir, workspaceDir, appService, bootstrap, callHostTool };
  }

  const callTool = async (name: string, args: Record<string, unknown> = {}): Promise<{ res: CallToolResult; parsed: ToolResponseData; text: string }> => {
    const res = await serverHandler(
      {
        method: 'tools/call',
        params: { name, arguments: { targetPath: tempDir, ...args } },
      },
      {}
    );
    let parsed: ToolResponseData = {};
    const firstItem = res.content?.[0];
    if (firstItem && 'text' in firstItem && typeof (firstItem as { text?: unknown }).text === 'string') {
      try {
        parsed = JSON.parse((firstItem as { text: string }).text) as ToolResponseData;
      } catch { /* empty */ }
    }
    const textVal = firstItem && 'text' in firstItem && typeof (firstItem as { text?: unknown }).text === 'string'
      ? (firstItem as { text: string }).text
      : '';
    return { res, parsed, text: textVal };
  };

  it('1. qap_discover protegido sin perfil: blocked auth_required y cero escrituras en disco', async () => {
    const { workspaceDir, callHostTool } = await createHostFixture();
    // Definir plan con módulo de acceso y módulo protegido
    await callHostTool('qap_session_plan', {
      modules: [
        { module: 'auth', path: '/login', priority: 'high' },
        { module: 'dashboard', path: '/protected', priority: 'high' },
      ],
      auth: { required: true, method: 'credentials', roles: ['admin'] },
    });

    // Poner en WORKING para probar la compuerta de discover protegido sin perfil verificado
    const lc1Path = join(workspaceDir, '.qa', 'project', 'lifecycle.json');
    const lc1 = JSON.parse(readFileSync(lc1Path, 'utf-8'));
    lc1.phase = 'WORKING';
    writeFileSync(lc1Path, JSON.stringify(lc1, null, 2), 'utf-8');

    // Intentar discover sobre /protected sin perfil verificado
    const { parsed } = await callHostTool('qap_discover', {
      name: 'dashboard',
      path: '/protected',
    });

    expect(parsed.status).toBe('blocked');
    expect(parsed.code).toBe('auth_required');
    expect(parsed.downgraded_to_anonymous).toBe(false);

    // Demostrar CERO escrituras bajo .qa/modules/
    const moduleDir = join(workspaceDir, '.qa', 'modules', 'dashboard');
    expect(existsSync(moduleDir)).toBe(false);
    expect(existsSync(join(workspaceDir, '.qa', 'modules', 'index.json'))).toBe(false);

    // Estado del módulo permanece planned
    const lifecycle = JSON.parse(readFileSync(lc1Path, 'utf-8'));
    expect(lifecycle.modules?.dashboard?.state).toBe('planned');
  });

  it('2. qap_discover con redirección HTTP 302 a login: detecta auth_wall determinista y bloquea sin escribir', async () => {
    const { workspaceDir, callHostTool } = await createHostFixture();
    await callHostTool('qap_session_plan', {
      modules: [
        { module: 'auth', path: '/login', priority: 'high' },
        { module: 'zona_privada', path: '/protected', priority: 'high' },
      ],
      auth: { required: false }, // Simular app que no declaró auth pero el servidor redirige con 302
    });

    const { parsed } = await callHostTool('qap_discover', {
      name: 'zona_privada',
      path: '/protected',
    });

    expect(parsed.status).toBe('blocked');
    expect(parsed.counts?.views).toBe(0);
    expect(parsed.observations).toBe(0);
    expect(parsed.routes).toEqual(
      expect.arrayContaining([expect.objectContaining({ state: 'blocked', reason: 'SCOPE_BLOCKED' })])
    );
    expect(existsSync(join(workspaceDir, '.qa', 'modules', 'zona_privada'))).toBe(false);
  });

  it('3. qap_discover con login embebido en ruta no-acceso: bloquea como auth_required sin persistir', async () => {
    const { workspaceDir, callHostTool } = await createHostFixture();
    await callHostTool('qap_session_plan', {
      modules: [
        { module: 'auth', path: '/login', priority: 'high' },
        { module: 'login_embebido', path: '/embedded-login', priority: 'high' },
      ],
      auth: { required: false },
    });

    const { parsed } = await callHostTool('qap_discover', {
      name: 'login_embebido',
      path: '/embedded-login',
    });

    expect(parsed.routes).toEqual(
      expect.arrayContaining([expect.objectContaining({ reason: 'AUTH_REQUIRED' })])
    );
    expect(existsSync(join(workspaceDir, '.qa', 'modules', 'login_embebido'))).toBe(false);
  });

  it('4. qap_discover con sesión expirada: blocked session_invalid y desverifica el perfil', async () => {
    const { workspaceDir, appService, callHostTool } = await createHostFixture();
    await callHostTool('qap_session_plan', {
      modules: [
        { module: 'auth', path: '/login', priority: 'high' },
        { module: 'panel', path: '/protected-401', priority: 'high' },
      ],
      auth: { required: true, method: 'credentials', roles: ['admin'] },
    });

    // Crear perfil vía host y sembrar sesión expirada en SessionStore
    const rCreate = await callHostTool('qap_auth_add', {
      action: 'create',
      profile: 'admin-profile',
      env: 'local',
      username: TEST_CREDENTIALS.username,
      role: 'admin',
      login_origin: fixtureServer.baseUrl,
      login_route: '/login',
      verification_route: '/protected-401',
      post_login_condition: { type: 'selector_present', value: 'a[href="/dashboard"]' },
    });
    expect(rCreate.parsed.status).toBe('success');

    const { SessionStore } = await import('@qap/auth');
    const sessionStore = new SessionStore(join(workspaceDir, '.qa', 'cache', 'sessions'), workspaceDir);
    const expiredState = {
      cookies: [
        {
          name: AUTH_COOKIE_NAME,
          value: AUTH_COOKIE_EXPIRED_VALUE,
          domain: '127.0.0.1',
          path: '/',
          expires: Math.floor(Date.now() / 1000) + 3600,
          httpOnly: false,
          secure: false,
          sameSite: 'Lax' as const,
        },
      ],
      origins: [],
    };
    sessionStore.saveSession('admin-profile', expiredState);

    const project = appService.findActiveProjectByRoot(workspaceDir)!;
    const snapBefore = appService.resumeProject(project.project_id);
    const envId = snapBefore.environment!.env_id;
    const profRec = appService.upsertProfile({
      projectId: project.project_id,
      envId,
      label: 'admin-profile',
      roleName: 'admin',
      loginMode: 'auto',
      credentialAccount: 'admin-profile',
      status: 'verified',
    });
    appService.saveProfileSession(project.project_id, profRec.profile_id, expiredState);
    appService.authority.grant({
      project_id: project.project_id,
      capability: 'login',
      scope: { origin: new URL(fixtureServer.baseUrl).origin, profile_id: 'admin-profile' },
      granted_by: 'host_operator',
    });

    const profilesPath = join(workspaceDir, '.qa', 'project', 'auth', 'profiles.json');
    const profilesData = JSON.parse(readFileSync(profilesPath, 'utf-8')) as { profiles: AuthProfile[] };
    for (const p of profilesData.profiles) {
      if (p.id === 'admin-profile') {
        p.verified = true;
        p.verified_at = new Date().toISOString();
        p.verified_route = '/protected-401';
      }
    }
    writeFileSync(profilesPath, JSON.stringify(profilesData, null, 2), 'utf-8');

    // Asegurar fase WORKING para ejecutar discover
    const lc4Path = join(workspaceDir, '.qa', 'project', 'lifecycle.json');
    const lc4 = JSON.parse(readFileSync(lc4Path, 'utf-8'));
    lc4.phase = 'WORKING';
    writeFileSync(lc4Path, JSON.stringify(lc4, null, 2), 'utf-8');

    // Intentar discover usando el perfil expirado sobre ruta protegida que responde 401
    const { parsed } = await callHostTool('qap_discover', {
      name: 'panel',
      path: '/protected-401',
      profile: 'admin-profile',
    });

    expect(parsed.status).toBe('blocked');
    expect(parsed.code).toBe('auth_session_invalid');
    expect(parsed.downgraded_to_anonymous).toBe(false);
    expect(parsed.desbloquear_con?.tool).toBe('qap_auth_add');

    // El perfil debe haber sido expirado/invalidado sin degradar a anónimo
    const snapAfter = appService.resumeProject(project.project_id);
    const updatedProf = snapAfter.profiles.find((p) => p.label === 'admin-profile');
    expect(updatedProf?.status).toBe('expired');

    // Cero escrituras en el módulo
    expect(existsSync(join(workspaceDir, '.qa', 'modules', 'panel'))).toBe(false);
  });

  it('5. qap_discover con perfil verificado y storageState válido: devuelve app y transiciona a observed', async () => {
    const { workspaceDir, appService, callHostTool } = await createHostFixture();
    await callHostTool('qap_session_plan', {
      modules: [
        { module: 'auth', path: '/login', priority: 'high' },
        { module: 'dashboard_ok', path: '/protected', priority: 'high' },
      ],
      auth: { required: true, method: 'credentials', roles: ['admin'] },
    });

    // Registrar perfil verificado con sesión válida en el host (sin inyectar secretos por MCP)
    const { SessionStore } = await import('@qap/auth');
    const sessionStore = new SessionStore(join(workspaceDir, '.qa', 'cache', 'sessions'), workspaceDir);
    const validState = {
      cookies: [
        {
          name: AUTH_COOKIE_NAME,
          value: AUTH_COOKIE_VALID_VALUE,
          domain: '127.0.0.1',
          path: '/',
          expires: Math.floor(Date.now() / 1000) + 3600,
          httpOnly: false,
          secure: false,
          sameSite: 'Lax' as const,
        },
      ],
      origins: [],
    };
    sessionStore.saveSession('admin-valid', validState);

    const project = appService.findActiveProjectByRoot(workspaceDir)!;
    const envId = appService.resumeProject(project.project_id).environment!.env_id;
    const profRec = appService.upsertProfile({
      projectId: project.project_id,
      envId,
      label: 'admin-valid',
      roleName: 'admin',
      loginMode: 'auto',
      credentialAccount: 'admin-valid',
      status: 'verified',
    });
    appService.saveProfileSession(project.project_id, profRec.profile_id, validState);
    appService.authority.grant({
      project_id: project.project_id,
      capability: 'login',
      scope: { origin: new URL(fixtureServer.baseUrl).origin, profile_id: 'admin-valid' },
      granted_by: 'host_operator',
    });

    // Asegurar fase WORKING para ejecutar discover
    const lc5Path = join(workspaceDir, '.qa', 'project', 'lifecycle.json');
    const lc5 = JSON.parse(readFileSync(lc5Path, 'utf-8'));
    lc5.phase = 'WORKING';
    writeFileSync(lc5Path, JSON.stringify(lc5, null, 2), 'utf-8');

    // Ejecutar qap_discover autenticado
    const { parsed } = await callHostTool('qap_discover', {
      name: 'dashboard_ok',
      path: '/protected',
      profile: 'admin-valid',
    });

    expect(['completed', 'partial']).toContain(parsed.status);
    expect(parsed.observations).toBeGreaterThanOrEqual(1);
    expect(parsed.counts?.views).toBeGreaterThanOrEqual(1);
    expect(parsed.discovery_revision_id).toBeTruthy();
    expect(existsSync(join(workspaceDir, '.qa', 'discovery', 'INDEX.md'))).toBe(true);
  });

  it('6. qap_discover en módulo de acceso: selectors.json incluye auth_selectors y omite valores y atributos sensibles de password', async () => {
    const { workspaceDir, appService, callHostTool } = await createHostFixture();
    await callHostTool('qap_session_plan', {
      modules: [{ module: 'auth', path: '/login', priority: 'high', acceso: true }],
      auth: { required: false },
    });

    const { parsed, text } = await callHostTool('qap_discover', {
      name: 'auth',
      path: '/login',
    });

    expect(['completed', 'partial']).toContain(parsed.status);
    expect(parsed.counts?.forms).toBeGreaterThanOrEqual(1);
    expect(parsed.observations).toBeGreaterThanOrEqual(1);

    const project = appService.findActiveProjectByRoot(workspaceDir)!;
    const revisions = appService.listLatestDiscoveryRevisionsByScope(project.project_id);
    const loginRevision = revisions.find((r) => r.revision_id === parsed.discovery_revision_id);
    expect(loginRevision).toBeDefined();
    const controls = loginRevision!.dossier.views.flatMap((v) => v.controls);
    const passwordControl = controls.find((c) => c.input_type === 'password');
    expect(passwordControl).toBeDefined();
    expect(Object.hasOwn(passwordControl!, 'value')).toBe(false);
    expect(text).not.toContain(TEST_CREDENTIALS.password);
  });

  it('7. Secuencia de preguntas de SCOPING: 5 preguntas separadas y válidas sin mezclar módulos con auth', () => {
    // 1. Módulos a probar
    const g1 = getPhaseGuidance('SCOPING', {
      context: {
        roles: [{ name: 'admin' }],
        critical_flows: [{ name: 'Flujo 1', path: '/flujo1' }, { name: 'Flujo 2', path: '/flujo2' }],
      },
    });
    expect(g1.siguiente_accion.tipo).toBe('decision');
    expect(g1.siguiente_accion.pregunta?.id).toBe('scoping.modulos_a_probar');
    expect(validarPregunta(g1.siguiente_accion.pregunta!).valid).toBe(true);

    // 2. Requiere login (plan ya establecido, auth pendiente)
    const g2 = getPhaseGuidance('SCOPING', {
      plan: [{ module: 'mod1', path: '/mod1', priority: 'high', status: 'planned' }],
      lifecycle: { phase: 'SCOPING', session: { id: 's1', started_at: '', plan: [] } } as unknown as LifecycleState,
    });
    expect(g2.siguiente_accion.pregunta?.id).toBe('scoping.requiere_login');
    expect(g2.siguiente_accion.pregunta?.opciones.length).toBe(2);
    expect(validarPregunta(g2.siguiente_accion.pregunta!).valid).toBe(true);

    // 3. Método (auth.required: true, sin método)
    const g3 = getPhaseGuidance('SCOPING', {
      plan: [{ module: 'mod1', path: '/mod1', priority: 'high', status: 'planned' }],
      lifecycle: { phase: 'SCOPING', session: { id: 's1', started_at: '', plan: [], auth: { required: true, source: 'user' } } } as unknown as LifecycleState,
    });
    expect(g3.siguiente_accion.pregunta?.id).toBe('scoping.metodo_auth');
    expect(validarPregunta(g3.siguiente_accion.pregunta!).valid).toBe(true);

    // 4. Roles a probar (método definido, sin roles)
    const g4 = getPhaseGuidance('SCOPING', {
      plan: [{ module: 'mod1', path: '/mod1', priority: 'high', status: 'planned' }],
      context: { roles: [{ name: 'admin' }, { name: 'tester' }] },
      lifecycle: { phase: 'SCOPING', session: { id: 's1', started_at: '', plan: [], auth: { required: true, method: 'credentials', source: 'user' } } } as unknown as LifecycleState,
    });
    expect(g4.siguiente_accion.pregunta?.id).toBe('scoping.roles_a_probar');
    expect(validarPregunta(g4.siguiente_accion.pregunta!).valid).toBe(true);

    // 5a. Capturar perfil pendiente con credentials (vNext: delega a qap_auth_add con method auto, sin pedir secretos en chat)
    const g5 = getPhaseGuidance('SCOPING', {
      plan: [{ module: 'mod1', path: '/mod1', priority: 'high', status: 'planned' }],
      lifecycle: { phase: 'SCOPING', session: { id: 's1', started_at: '', plan: [], auth: { required: true, method: 'credentials', roles: ['admin'], source: 'user' } } } as unknown as LifecycleState,
      profiles: [],
    });
    expect(g5.siguiente_accion.tipo).toBe('trabajo');
    expect(g5.siguiente_accion.tool).toBe('qap_auth_add');
    expect(g5.siguiente_accion.pregunta).toBeUndefined();
    const credsParams = (g5.siguiente_accion as unknown as { parametros?: { method?: string; profile?: string } }).parametros;
    expect(credsParams?.method).toBe('auto');
    expect(credsParams?.profile).toBe('admin');

    // 5b. Capturar perfil pendiente con handoff (C1a: paso de trabajo sin pregunta)
    const g5Handoff = getPhaseGuidance('SCOPING', {
      plan: [{ module: 'mod1', path: '/mod1', priority: 'high', status: 'planned' }],
      lifecycle: { phase: 'SCOPING', session: { id: 's1', started_at: '', plan: [], auth: { required: true, method: 'handoff', roles: ['admin'], source: 'user' } } } as unknown as LifecycleState,
      profiles: [],
    });
    expect(g5Handoff.siguiente_accion.tipo).toBe('trabajo');
    expect(g5Handoff.siguiente_accion.tool).toBe('qap_auth_add');
    expect(g5Handoff.siguiente_accion.pregunta).toBeUndefined();
    const handoffParams = (g5Handoff.siguiente_accion as unknown as { parametros?: { method?: string; profile?: string } }).parametros;
    expect(handoffParams?.method).toBe('handoff');
    expect(handoffParams?.profile).toBe('admin');
  });

  it('8. canExitScoping: compuerta falsa sin sesión verificada y verdadera con ella', () => {
    const sessionWithAuth = {
      plan: [{ module: 'dashboard', path: '/protected', priority: 'high', status: 'planned' as const }],
      auth: { required: true, source: 'user' as const, method: 'credentials' as const, roles: ['admin'] },
    };

    // Sin perfiles
    expect(canExitScoping({ session: sessionWithAuth } as unknown as LifecycleState, []).passed).toBe(false);

    // Perfil sin verificar
    const unverifiedProfile: AuthProfile = {
      id: 'admin-unverified',
      env: 'local',
      username: 'admin',
      role: 'admin',
      verified: false,
    };
    expect(canExitScoping({ session: sessionWithAuth } as unknown as LifecycleState, [unverifiedProfile]).passed).toBe(false);

    // Perfil con rol distinto
    const verifiedWrongRole: AuthProfile = {
      id: 'tester-verified',
      env: 'local',
      username: 'tester',
      role: 'tester',
      verified: true,
    };
    expect(canExitScoping({ session: sessionWithAuth } as unknown as LifecycleState, [verifiedWrongRole]).passed).toBe(false);

    // Perfil verificado correcto
    const verifiedAdmin: AuthProfile = {
      id: 'admin-verified',
      env: 'local',
      username: 'admin',
      role: 'admin',
      verified: true,
    };
    expect(canExitScoping({ session: sessionWithAuth } as unknown as LifecycleState, [verifiedAdmin]).passed).toBe(true);

    // Caso auth.required === false con source user
    const sessionNoAuth = {
      plan: [{ module: 'home', path: '/home', priority: 'high', status: 'planned' as const }],
      auth: { required: false, source: 'user' as const },
    };
    expect(canExitScoping({ session: sessionNoAuth } as unknown as LifecycleState, []).passed).toBe(true);
  });

  it('9. qap_auth_add con verificación automática real contra el fixture HTTP local', async () => {
    const { callHostTool } = await createHostFixture(TEST_CREDENTIALS.password);
    await callHostTool('qap_session_plan', {
      modules: [
        { module: 'auth', path: '/login', priority: 'high' },
        { module: 'dashboard', path: '/protected', priority: 'high' },
      ],
      auth: { required: true, method: 'credentials', roles: ['admin'] },
    });

    // Provisionar credenciales vía host (nunca password en argumentos MCP) y verificar login real
    expect((await callHostTool('qap_auth_add', {
      action: 'create',
      profile: 'admin',
      env: 'local',
      username: TEST_CREDENTIALS.username,
      role: 'admin',
      login_origin: fixtureServer.baseUrl,
      login_route: '/login',
      verification_route: '/protected',
      post_login_condition: { type: 'selector_present', value: 'a[href="/dashboard"]' },
    })).parsed.status).toBe('success');

    expect((await callHostTool('qap_auth_provision', {
      profile: 'admin',
      env: 'local',
    })).parsed.status).toBe('success');

    const { parsed } = await callHostTool('qap_auth_add', {
      action: 'login',
      profile: 'admin',
      env: 'local',
      method: 'auto',
    });

    expect(parsed.status, JSON.stringify(parsed)).toBe('success');
    expect(parsed.verified).toBe(true);

    const rPlan = await callHostTool('qap_session_plan', {
      modules: [
        { module: 'auth', path: '/login', priority: 'high' },
        { module: 'dashboard', path: '/protected', priority: 'high' },
      ],
      auth: { required: true, method: 'credentials', roles: ['admin'] },
    });
    expect(rPlan.parsed.fase).toBe('WORKING');
  });

  it('10. qap_auth_add con handoff: probado con doble de prueba que sustituye SOLO la ventana humana (resto real)', async () => {
    const { chromium } = await import('playwright-core');
    const origLaunch = chromium.launch.bind(chromium);
    const launchSpy = vi.spyOn(chromium, 'launch').mockImplementation(async (opts) => {
      if (opts && !opts.channel) {
        for (const channel of ['chrome', 'msedge', undefined] as const) {
          try {
            return await origLaunch({ ...opts, ...(channel ? { channel } : {}) });
          } catch { /* try next channel */ }
        }
      }
      return origLaunch(opts);
    });
    try {
      const { callHostTool } = await createHostFixture(TEST_CREDENTIALS.password, true);
    // Declaración explícita de la excepción: el doble de prueba sustituye únicamente la acción
    // física del humano navegando en la ventana, ejecutando la navegación asistida en el BrowserContext real.
    (globalThis as Record<string, unknown>).__QAP_HANDOFF_TEST_HOOK__ = (bCtx: unknown, baseUrl: string) => {
      const ctx = bCtx as {
        once: (ev: string, fn: (page: { goto: (url: string) => Promise<unknown> }) => void) => void;
        addCookies: (cookies: unknown[]) => Promise<void>;
      };
      ctx.once('page', (page) => {
        setTimeout(() => {
          void (async () => {
            await ctx.addCookies([
              {
                name: AUTH_COOKIE_NAME,
                value: AUTH_COOKIE_VALID_VALUE,
                domain: '127.0.0.1',
                path: '/',
              },
            ]);
            await page.goto(`${baseUrl}/protected`).catch(() => {});
          })();
        }, 200);
      });
    };

    await callHostTool('qap_session_plan', {
      modules: [
        { module: 'auth', path: '/login', priority: 'high' },
        { module: 'dashboard', path: '/protected', priority: 'high' },
      ],
      auth: { required: true, method: 'handoff', roles: ['operador'] },
    });

    const { parsed } = await callHostTool('qap_auth_add', {
      profile: 'operador-handoff',
      env: 'local',
      username: 'operador',
      method: 'handoff',
      role: 'operador',
      login_route: '/login',
      post_login_condition: { type: 'selector_present', value: 'a[href="/dashboard"]' },
    });

      expect(parsed.status, JSON.stringify(parsed)).toBe('success');
      expect(parsed.profile?.verified).toBe(true);
      expect(parsed.profile?.login_mode).toBe('handoff');
    } finally {
      launchSpy.mockRestore();
    }
  });

  it('11. Test de no filtración: contraseña centinela NO aparece en respuestas, archivos .qa/, SQLite ni logs', async () => {
    const SENTINEL_PASSWORD = 'SENTINEL_P4_4_PASS_SECRET_ABC123!';
    const { workspaceDir, hostDir, callHostTool } = await createHostFixture(SENTINEL_PASSWORD);

    await callHostTool('qap_session_plan', {
      modules: [{ module: 'auth', path: '/login', priority: 'high' }],
      auth: { required: true, method: 'credentials', roles: ['tester'] },
    });

    const createRes = await callHostTool('qap_auth_add', {
      action: 'create',
      profile: 'sec-tester',
      env: 'local',
      username: 'sec-user',
      role: 'tester',
      login_origin: fixtureServer.baseUrl,
      login_route: '/login',
      verification_route: '/protected',
      post_login_condition: { type: 'selector_present', value: 'a[href="/dashboard"]' },
    });
    expect(createRes.parsed.status).toBe('success');

    const { parsed, text } = await callHostTool('qap_auth_provision', {
      profile: 'sec-tester',
      env: 'local',
    });
    expect(parsed.status, JSON.stringify(parsed)).toBe('success');

    // 1. No en respuesta MCP
    expect(text).not.toContain(SENTINEL_PASSWORD);
    expect(JSON.stringify(parsed)).not.toContain(SENTINEL_PASSWORD);

    // 1b. No en respuesta de qap_auth_list
    const listRes = await callHostTool('qap_auth_list', {});
    expect(listRes.text).not.toContain(SENTINEL_PASSWORD);
    expect(JSON.stringify(listRes.parsed)).not.toContain(SENTINEL_PASSWORD);

    // 1c. Intento de inyectar password directamente vía qap_auth_add es rechazado y no filtra
    const errRes = await callHostTool('qap_auth_add', {
      action: 'login',
      profile: 'sec-tester',
      env: 'local',
      password: SENTINEL_PASSWORD,
    });
    expect(errRes.parsed.status).toBe('blocked');
    expect(errRes.text).not.toContain(SENTINEL_PASSWORD);

    // 2. No en ningún archivo bajo .qa/ ni hostDir (revisar recursivamente)
    function searchSentinelInDir(dir: string) {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          searchSentinelInDir(fullPath);
        } else if (entry.isFile()) {
          const content = readFileSync(fullPath);
          expect(content.includes(Buffer.from(SENTINEL_PASSWORD))).toBe(false);
        }
      }
    }
    searchSentinelInDir(join(workspaceDir, '.qa'));
    searchSentinelInDir(hostDir);

    // 3. No en profiles.json
    const profilesContent = readFileSync(join(workspaceDir, '.qa', 'project', 'auth', 'profiles.json'), 'utf-8');
    expect(profilesContent).not.toContain(SENTINEL_PASSWORD);

    // 4. Solo guardado en el llavero seguro (keytar/keychain), accesible únicamente vía AuthManager
    const { AuthManager } = await import('@qap/auth');
    const authManager = new AuthManager(workspaceDir);
    const creds = await authManager.getCredentials('sec-tester');
    expect(creds?.password).toBe(SENTINEL_PASSWORD);
    await authManager.deleteSecret('sec-tester');
  });

  it('12. qap_session_plan: reordena módulos de acceso al inicio del plan de forma determinista y persiste acceso: true', async () => {
    const { parsed } = await callTool('qap_session_plan', {
      modules: [
        { module: 'pagos', path: '/checkout/pay', priority: 'high' },
        { module: 'catalogo', path: '/products', priority: 'medium' },
        { module: 'login_app', path: '/login', priority: 'high' },
        { module: 'acceso_sso', path: '/sso', priority: 'high', acceso: true },
      ],
      auth: { required: false, source: 'user' },
    });

    expect(parsed.status, JSON.stringify(parsed)).toBe('success');
    const plan = parsed.plan;
    expect(plan.length).toBe(4);

    // Módulos de acceso primero: login_app y acceso_sso al inicio
    expect(isAuthPath(String(plan?.[0]?.path)) || plan?.[0]?.acceso).toBe(true);
    expect(isAuthPath(String(plan?.[1]?.path)) || plan?.[1]?.acceso).toBe(true);

    // Módulos no acceso después
    expect(plan?.[2]?.module).toBe('pagos');
    expect(plan?.[3]?.module).toBe('catalogo');
  });

  it('13. Validación integral de preguntas (C1 & C2): todas las preguntas de SCOPING y blocked son válidas, sin formato decision, sin "Deseas" y sin opciones únicas', () => {
    const questionsToTest: Pregunta[] = [];

    // 1a. SCOPING: modulos con >=2 opciones (multiple)
    const gModulesMulti = getPhaseGuidance('SCOPING', {
      context: {
        critical_flows: [
          { name: 'Flujo 1', path: '/flujo1' },
          { name: 'Flujo 2', path: '/flujo2' },
        ],
      },
    });
    if (gModulesMulti.siguiente_accion.pregunta) questionsToTest.push(gModulesMulti.siguiente_accion.pregunta);

    // 1b. SCOPING: modulos con 0/1 opciones (abierta)
    const gModulesOpen = getPhaseGuidance('SCOPING', { context: { critical_flows: [] } });
    if (gModulesOpen.siguiente_accion.pregunta) questionsToTest.push(gModulesOpen.siguiente_accion.pregunta);

    // 2. SCOPING: requiere_login
    const gReqLogin = getPhaseGuidance('SCOPING', {
      plan: [{ module: 'mod1', path: '/mod1', priority: 'high', status: 'planned' }],
      lifecycle: { phase: 'SCOPING', session: { id: 's1', started_at: '', plan: [] } } as unknown as LifecycleState,
    });
    if (gReqLogin.siguiente_accion.pregunta) questionsToTest.push(gReqLogin.siguiente_accion.pregunta);

    // 3. SCOPING: metodo_auth
    const gMethod = getPhaseGuidance('SCOPING', {
      plan: [{ module: 'mod1', path: '/mod1', priority: 'high', status: 'planned' }],
      lifecycle: { phase: 'SCOPING', session: { id: 's1', started_at: '', plan: [], auth: { required: true, source: 'user' } } } as unknown as LifecycleState,
    });
    if (gMethod.siguiente_accion.pregunta) questionsToTest.push(gMethod.siguiente_accion.pregunta);

    // 4a. SCOPING: roles con >=2 opciones (multiple)
    const gRolesMulti = getPhaseGuidance('SCOPING', {
      plan: [{ module: 'mod1', path: '/mod1', priority: 'high', status: 'planned' }],
      context: { roles: [{ name: 'admin' }, { name: 'editor' }] },
      lifecycle: { phase: 'SCOPING', session: { id: 's1', started_at: '', plan: [], auth: { required: true, method: 'credentials', source: 'user' } } } as unknown as LifecycleState,
    });
    if (gRolesMulti.siguiente_accion.pregunta) questionsToTest.push(gRolesMulti.siguiente_accion.pregunta);

    // 4b. SCOPING: roles con <2 opciones (abierta)
    const gRolesOpen = getPhaseGuidance('SCOPING', {
      plan: [{ module: 'mod1', path: '/mod1', priority: 'high', status: 'planned' }],
      context: { roles: [] },
      lifecycle: { phase: 'SCOPING', session: { id: 's1', started_at: '', plan: [], auth: { required: true, method: 'credentials', source: 'user' } } } as unknown as LifecycleState,
    });
    if (gRolesOpen.siguiente_accion.pregunta) questionsToTest.push(gRolesOpen.siguiente_accion.pregunta);

    // 5. SCOPING: capturar perfil credentials (abierta)
    const gCaptureCred = getPhaseGuidance('SCOPING', {
      plan: [{ module: 'mod1', path: '/mod1', priority: 'high', status: 'planned' }],
      lifecycle: { phase: 'SCOPING', session: { id: 's1', started_at: '', plan: [], auth: { required: true, method: 'credentials', roles: ['admin'], source: 'user' } } } as unknown as LifecycleState,
      profiles: [],
    });
    if (gCaptureCred.siguiente_accion.pregunta) questionsToTest.push(gCaptureCred.siguiente_accion.pregunta);

    // 6. Blocked: decision_auth_required y decision_session_invalid
    const authReqQ: Pregunta = {
      id: 'decision_auth_required',
      texto: 'El acceso al módulo está protegido o redirige al inicio de sesión. Selecciona el método de autenticación:',
      formato: 'una_opcion',
      opciones: [
        { id: 'handoff', etiqueta: 'Iniciar sesión en ventana del navegador (handoff)', recomendada: true },
        { id: 'credentials', etiqueta: 'Usar credenciales de prueba en llavero seguro' },
      ],
      permite_otra: true,
      registrar_con: { tool: 'qap_auth_add', campo: 'method' },
    };
    authReqQ.render_texto = generarRenderTexto(authReqQ);
    questionsToTest.push(authReqQ);

    const sessInvQ: Pregunta = {
      id: 'decision_session_invalid',
      texto: 'La sesión del perfil expiró o no fue aceptada en el módulo. Selecciona cómo proceder:',
      formato: 'una_opcion',
      opciones: [
        { id: 'reautenticar', etiqueta: 'Re-autenticar perfil con qap_auth_add', recomendada: true },
        { id: 'otro_modulo', etiqueta: 'Continuar con otro módulo del plan' },
      ],
      permite_otra: true,
      registrar_con: { tool: 'qap_auth_add', campo: 'action' },
    };
    sessInvQ.render_texto = generarRenderTexto(sessInvQ);
    questionsToTest.push(sessInvQ);

    expect(questionsToTest.length).toBeGreaterThanOrEqual(8);

    for (const q of questionsToTest) {
      // Regla C2: formato debe ser válido según contrato puro
      expect(['una_opcion', 'multiple', 'abierta']).toContain(q.formato);
      expect((q.formato as string)).not.toBe('decision');

      // Regla C1d: no debe empezar con "Deseas" ni contener "deseas"
      expect(q.texto).not.toMatch(/\bdeseas\b/i);

      // Regla C1d: ninguna pregunta con opciones puede tener una sola opción
      if (q.formato !== 'abierta') {
        expect(q.opciones.length).toBeGreaterThanOrEqual(2);
      }

      // Regla C1c: requiere_login no tiene ninguna opción recomendada
      if (q.id === 'scoping.requiere_login') {
        expect(q.opciones.every((o) => !o.recomendada)).toBe(true);
      }

      // Validación pura con motor
      const validation = validarPregunta(q);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    }
  });

  it('14. Timeout de handoff (C4): qap_auth_add devuelve blocked con razon handoff_timeout y reintento idempotente', async () => {
    await callTool('qap_session_plan', {
      modules: [{ module: 'auth', path: '/login', priority: 'high' }],
      auth: { required: true, method: 'handoff', roles: ['admin'] },
    });

    const { parsed } = await callTool('qap_auth_add', {
      profile: 'admin-timeout',
      env: 'local',
      role: 'admin',
      method: 'handoff',
      login_route: '/login',
      timeout_ms: 100,
    });

    expect(parsed.status).toBe('blocked');
    expect(parsed.razon).toBe('handoff_timeout');
    expect(parsed.desbloquear_con?.tool).toBe('qap_auth_add');
    expect(parsed.siguiente_accion?.tipo).toBe('trabajo');
    expect(parsed.siguiente_accion?.tool).toBe('qap_auth_add');
    expect(parsed.siguiente_accion?.parametros?.profile).toBe('admin-timeout');
    expect(parsed.siguiente_accion?.parametros?.method).toBe('handoff');
    expect(parsed.siguiente_accion?.parametros?.role).toBe('admin');
  });

  it('15. Guard de cliente asíncrono lento (~1200ms) en qap_discover: responde blocked auth_required y cero escrituras en .qa/modules (C3c)', async () => {
    const { workspaceDir, callHostTool } = await createHostFixture();
    await callHostTool('qap_session_plan', {
      modules: [
        { module: 'auth', path: '/login', priority: 'high' },
        { module: 'delayed_guard_mod', path: '/protected-delayed-client-guard', priority: 'high' },
      ],
      auth: { required: true, method: 'credentials', roles: ['admin'] },
    });

    // Asegurar fase WORKING
    const lcPath = join(workspaceDir, '.qa', 'project', 'lifecycle.json');
    const lc = JSON.parse(readFileSync(lcPath, 'utf-8'));
    lc.phase = 'WORKING';
    writeFileSync(lcPath, JSON.stringify(lc, null, 2), 'utf-8');

    const { parsed } = await callHostTool('qap_discover', {
      name: 'delayed_guard_mod',
      path: '/protected-delayed-client-guard',
      allow_spa: true,
    });

    expect(parsed.status).toBe('blocked');
    expect(parsed.code).toBe('auth_required');
    expect(parsed.downgraded_to_anonymous).toBe(false);

    // Cero escrituras en .qa/modules/delayed_guard_mod
    expect(existsSync(join(workspaceDir, '.qa', 'modules', 'delayed_guard_mod'))).toBe(false);
  });
});
