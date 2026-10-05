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
import { getPhaseGuidance } from '../guidance.js';
import { createMcpServer } from '../server.js';

// In-memory keychain mock para pruebas deterministas sin dependencias del llavero del SO
const inMemoryKeychain = new Map<string, string>();
vi.mock('keytar', () => ({
  default: {
    getPassword: vi.fn(async (service: string, account: string) => inMemoryKeychain.get(`${service}:${account}`) ?? null),
    setPassword: vi.fn(async (service: string, account: string, secret: string) => {
      inMemoryKeychain.set(`${service}:${account}`, secret);
    }),
    deletePassword: vi.fn(async (service: string, account: string) => {
      return inMemoryKeychain.delete(`${service}:${account}`);
    }),
  },
}));

interface ToolResponseData {
  status?: string;
  razon?: string;
  page_kind?: string;
  redirected?: boolean;
  final_url?: string;
  desbloquear_con?: { tool?: string; descripcion?: string };
  siguiente_accion?: { tipo?: string; pregunta?: Pregunta };
  profile?: { verified?: boolean; verified_route?: string; login_mode?: string };
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

  afterEach(() => {
    if (tempDir && existsSync(tempDir)) {
      try {
        rmSync(tempDir, { recursive: true, force: true });
      } catch { /* empty */ }
    }
    delete (globalThis as Record<string, unknown>).__QAP_HANDOFF_TEST_HOOK__;
  });

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
    // Definir plan con módulo de acceso y módulo protegido
    await callTool('qap_session_plan', {
      modules: [
        { module: 'auth', path: '/login', priority: 'high' },
        { module: 'dashboard', path: '/protected', priority: 'high' },
      ],
      auth: { required: true, method: 'credentials', roles: ['admin'] },
    });

    // Poner en WORKING para probar la compuerta de discover protegido sin perfil verificado
    const lc1Path = join(tempDir, '.qa', 'project', 'lifecycle.json');
    const lc1 = JSON.parse(readFileSync(lc1Path, 'utf-8'));
    lc1.phase = 'WORKING';
    writeFileSync(lc1Path, JSON.stringify(lc1, null, 2), 'utf-8');

    // Intentar discover sobre /protected sin perfil verificado
    const { parsed } = await callTool('qap_discover', {
      name: 'dashboard',
      path: '/protected',
    });

    expect(parsed.status).toBe('blocked');
    expect(parsed.razon).toBe('auth_required');
    expect(parsed.page_kind).toBe('auth_wall');
    expect(parsed.desbloquear_con.tool).toBe('qap_auth_add');
    expect(parsed.siguiente_accion.tipo).toBe('decision');

    // Demostrar CERO escrituras bajo .qa/modules/
    const moduleDir = join(tempDir, '.qa', 'modules', 'dashboard');
    expect(existsSync(moduleDir)).toBe(false);
    expect(existsSync(join(tempDir, '.qa', 'modules', 'index.json'))).toBe(false);

    // Estado del módulo permanece planned
    const lifecycle = JSON.parse(readFileSync(lc1Path, 'utf-8'));
    expect(lifecycle.modules?.dashboard?.state).toBe('planned');
  });

  it('2. qap_discover con redirección HTTP 302 a login: detecta auth_wall determinista y bloquea sin escribir', async () => {
    await callTool('qap_session_plan', {
      modules: [
        { module: 'auth', path: '/login', priority: 'high' },
        { module: 'zona_privada', path: '/protected', priority: 'high' },
      ],
      auth: { required: false }, // Simular app que no declaró auth pero el servidor redirige con 302
    });

    const { parsed } = await callTool('qap_discover', {
      name: 'zona_privada',
      path: '/protected',
    });

    expect(parsed.status).toBe('blocked');
    expect(parsed.razon).toBe('auth_required');
    expect(parsed.page_kind).toBe('auth_wall');
    expect(parsed.redirected).toBe(true);
    expect(parsed.final_url).toContain('/login');
    expect(existsSync(join(tempDir, '.qa', 'modules', 'zona_privada'))).toBe(false);
  });

  it('3. qap_discover con login embebido en ruta no-acceso: bloquea como auth_required sin persistir', async () => {
    await callTool('qap_session_plan', {
      modules: [
        { module: 'auth', path: '/login', priority: 'high' },
        { module: 'login_embebido', path: '/embedded-login', priority: 'high' },
      ],
      auth: { required: false },
    });

    const { parsed } = await callTool('qap_discover', {
      name: 'login_embebido',
      path: '/embedded-login',
    });

    expect(parsed.status).toBe('blocked');
    expect(parsed.razon).toBe('auth_required');
    expect(parsed.page_kind).toBe('login');
    expect(existsSync(join(tempDir, '.qa', 'modules', 'login_embebido'))).toBe(false);
  });

  it('4. qap_discover con sesión expirada: blocked session_invalid y desverifica el perfil', async () => {
    // Definir plan
    await callTool('qap_session_plan', {
      modules: [
        { module: 'auth', path: '/login', priority: 'high' },
        { module: 'panel', path: '/protected', priority: 'high' },
      ],
      auth: { required: true, method: 'credentials', roles: ['admin'] },
    });

    // Inyectar perfil previamente verificado pero con sesión expirada
    const { SessionStore } = await import('@qap/auth');
    const sessionStore = new SessionStore(join(tempDir, '.qa', 'cache', 'sessions'), tempDir);
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

    const profilesData = {
      profiles: [
        {
          id: 'admin-profile',
          env: 'local',
          username: TEST_CREDENTIALS.username,
          login_mode: 'auto',
          login_route: '/login',
          role: 'admin',
          verified: true,
          verified_at: new Date().toISOString(),
          verified_route: '/protected',
        },
      ],
    };
    writeFileSync(join(tempDir, '.qa', 'project', 'auth', 'profiles.json'), JSON.stringify(profilesData, null, 2), 'utf-8');

    // Asegurar fase WORKING para ejecutar discover
    const lc4Path = join(tempDir, '.qa', 'project', 'lifecycle.json');
    const lc4 = JSON.parse(readFileSync(lc4Path, 'utf-8'));
    lc4.phase = 'WORKING';
    writeFileSync(lc4Path, JSON.stringify(lc4, null, 2), 'utf-8');

    // Intentar discover usando el perfil expirado
    const { parsed } = await callTool('qap_discover', {
      name: 'panel',
      path: '/protected',
      profile: 'admin-profile',
    });

    expect(parsed.status).toBe('blocked');
    expect(parsed.razon).toBe('session_invalid');
    expect(parsed.desbloquear_con.tool).toBe('qap_auth_add');

    // El perfil debe haber sido marcado como no verificado en profiles.json
    const updatedProfiles = JSON.parse(readFileSync(join(tempDir, '.qa', 'project', 'auth', 'profiles.json'), 'utf-8'));
    const p = (updatedProfiles.profiles as AuthProfile[]).find((x) => x.id === 'admin-profile');
    expect(p?.verified).toBe(false);

    // Cero escrituras en el módulo
    expect(existsSync(join(tempDir, '.qa', 'modules', 'panel'))).toBe(false);
  });

  it('5. qap_discover con perfil verificado y storageState válido: devuelve app y transiciona a observed', async () => {
    // Definir plan
    await callTool('qap_session_plan', {
      modules: [
        { module: 'auth', path: '/login', priority: 'high' },
        { module: 'dashboard_ok', path: '/protected', priority: 'high' },
      ],
      auth: { required: true, method: 'credentials', roles: ['admin'] },
    });

    // Inyectar perfil verificado con cookie de sesión válida
    const { SessionStore } = await import('@qap/auth');
    const sessionStore = new SessionStore(join(tempDir, '.qa', 'cache', 'sessions'), tempDir);
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

    const profilesData = {
      profiles: [
        {
          id: 'admin-valid',
          env: 'local',
          username: TEST_CREDENTIALS.username,
          login_mode: 'auto',
          login_route: '/login',
          role: 'admin',
          verified: true,
          verified_at: new Date().toISOString(),
          verified_route: '/protected',
        },
      ],
    };
    writeFileSync(join(tempDir, '.qa', 'project', 'auth', 'profiles.json'), JSON.stringify(profilesData, null, 2), 'utf-8');

    // Asegurar fase WORKING para ejecutar discover
    const lc5Path = join(tempDir, '.qa', 'project', 'lifecycle.json');
    const lc5 = JSON.parse(readFileSync(lc5Path, 'utf-8'));
    lc5.phase = 'WORKING';
    writeFileSync(lc5Path, JSON.stringify(lc5, null, 2), 'utf-8');

    // Ejecutar qap_discover
    const { parsed } = await callTool('qap_discover', {
      name: 'dashboard_ok',
      path: '/protected',
      profile: 'admin-valid',
    });

    expect(parsed.status).toBe('success');
    expect(parsed.view.page_kind).toBe('app');
    expect(parsed.storage_state_used).toBe(true);

    // Verifica archivos persistidos
    const modDir = join(tempDir, '.qa', 'modules', 'dashboard_ok');
    expect(existsSync(join(modDir, 'views', 'default', 'context.yaml'))).toBe(true);
    expect(existsSync(join(modDir, 'views', 'default', 'selectors.json'))).toBe(true);
    expect(existsSync(join(modDir, 'summary.json'))).toBe(true);

    // Estado en lifecycle avanza a observed
    const lifecycle = JSON.parse(readFileSync(join(tempDir, '.qa', 'project', 'lifecycle.json'), 'utf-8'));
    expect(lifecycle.modules?.dashboard_ok?.state).toBe('observed');
  });

  it('6. qap_discover en módulo de acceso: selectors.json incluye auth_selectors y omite valores y atributos sensibles de password', async () => {
    await callTool('qap_session_plan', {
      modules: [{ module: 'auth', path: '/login', priority: 'high', acceso: true }],
      auth: { required: false },
    });

    const { parsed } = await callTool('qap_discover', {
      name: 'auth',
      path: '/login',
    });

    expect(parsed.status).toBe('success');
    expect(parsed.view.page_kind).toBe('login');

    const selectorsFile = JSON.parse(
      readFileSync(join(tempDir, '.qa', 'modules', 'auth', 'views', 'default', 'selectors.json'), 'utf-8')
    );
    expect(selectorsFile.page_kind).toBe('login');
    expect(selectorsFile.auth_selectors).toBeDefined();
    expect(selectorsFile.auth_selectors.username).toBeDefined();
    expect(selectorsFile.auth_selectors.password).toBeDefined();
    expect(selectorsFile.auth_selectors.submit).toBeDefined();

    // Verificación de sanitización estricta de password
    const allInputs = (selectorsFile.selectors.inputs || []) as Array<{ type?: string; value?: unknown; placeholder?: unknown; label?: unknown; pattern?: unknown }>;
    const passwordInput = allInputs.find((i) => i.type === 'password');
    expect(passwordInput).toBeDefined();
    expect(passwordInput.value).toBeUndefined();
    expect(passwordInput.placeholder).toBeNull();
    expect(passwordInput.label).toBeUndefined();
    expect(passwordInput.pattern).toBeUndefined();
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

    // 5a. Capturar perfil pendiente con credentials (C1b: pregunta abierta sin Deseas con ejemplo)
    const g5 = getPhaseGuidance('SCOPING', {
      plan: [{ module: 'mod1', path: '/mod1', priority: 'high', status: 'planned' }],
      lifecycle: { phase: 'SCOPING', session: { id: 's1', started_at: '', plan: [], auth: { required: true, method: 'credentials', roles: ['admin'], source: 'user' } } } as unknown as LifecycleState,
      profiles: [],
    });
    expect(g5.siguiente_accion.pregunta?.id).toContain('scoping.capturar_perfil');
    expect(g5.siguiente_accion.pregunta?.id).toContain('admin');
    expect(g5.siguiente_accion.pregunta?.formato).toBe('abierta');
    expect(g5.siguiente_accion.pregunta?.texto).not.toMatch(/\bdeseas\b/i);
    expect(validarPregunta(g5.siguiente_accion.pregunta!).valid).toBe(true);

    // 5b. Capturar perfil pendiente con handoff (C1a: paso de trabajo sin pregunta)
    const g5Handoff = getPhaseGuidance('SCOPING', {
      plan: [{ module: 'mod1', path: '/mod1', priority: 'high', status: 'planned' }],
      lifecycle: { phase: 'SCOPING', session: { id: 's1', started_at: '', plan: [], auth: { required: true, method: 'handoff', roles: ['admin'], source: 'user' } } } as unknown as LifecycleState,
      profiles: [],
    });
    expect(g5Handoff.siguiente_accion.tipo).toBe('trabajo');
    expect(g5Handoff.siguiente_accion.tool).toBe('qap_auth_add');
    expect(g5Handoff.siguiente_accion.pregunta).toBeUndefined();
    const handoffParams = (g5Handoff.siguiente_accion as unknown as { parametros?: { method?: string; role?: string } }).parametros;
    expect(handoffParams?.method).toBe('handoff');
    expect(handoffParams?.role).toBe('admin');
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
    await callTool('qap_session_plan', {
      modules: [
        { module: 'auth', path: '/login', priority: 'high' },
        { module: 'dashboard', path: '/protected', priority: 'high' },
      ],
      auth: { required: true, method: 'credentials', roles: ['admin'] },
    });

    // Registrar perfil con credenciales válidas
    const { parsed } = await callTool('qap_auth_add', {
      profile: 'admin',
      env: 'local',
      username: TEST_CREDENTIALS.username,
      password: TEST_CREDENTIALS.password,
      role: 'admin',
      login_route: '/login',
    });

    expect(parsed.status).toBe('success');
    expect(parsed.profile.verified).toBe(true);
    expect(parsed.profile.verified_route).toBe('/protected');
    expect(parsed.fase).toBe('WORKING'); // Compuerta de salida de SCOPING superada

    // Verificar que storageState fue guardado
    const sessionStorePath = join(tempDir, '.qa', 'cache', 'sessions', 'admin.json');
    expect(existsSync(sessionStorePath)).toBe(true);
  });

  it('10. qap_auth_add con handoff: probado con doble de prueba que sustituye SOLO la ventana humana (resto real)', async () => {
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

    await callTool('qap_session_plan', {
      modules: [
        { module: 'auth', path: '/login', priority: 'high' },
        { module: 'dashboard', path: '/protected', priority: 'high' },
      ],
      auth: { required: true, method: 'handoff', roles: ['operador'] },
    });

    const { parsed } = await callTool('qap_auth_add', {
      profile: 'operador-handoff',
      env: 'local',
      username: 'operador',
      method: 'handoff',
      role: 'operador',
      login_route: '/login',
    });

    expect(parsed.status).toBe('success');
    expect(parsed.profile.verified).toBe(true);
    expect(parsed.profile.login_mode).toBe('handoff');
  });

  it('11. Test de no filtración: contraseña centinela NO aparece en respuestas, archivos .qa/, SQLite ni logs', async () => {
    const SENTINEL_PASSWORD = 'SENTINEL_P4_4_PASS_SECRET_ABC123!';

    await callTool('qap_session_plan', {
      modules: [{ module: 'auth', path: '/login', priority: 'high' }],
      auth: { required: true, method: 'credentials', roles: ['tester'] },
    });

    const { parsed, text } = await callTool('qap_auth_add', {
      profile: 'sec-tester',
      env: 'local',
      username: 'sec-user',
      password: SENTINEL_PASSWORD,
      role: 'tester',
      login_route: '/login',
    });

    // 1. No en respuesta MCP
    expect(text).not.toContain(SENTINEL_PASSWORD);
    expect(JSON.stringify(parsed)).not.toContain(SENTINEL_PASSWORD);

    // 1b. No en respuesta de qap_auth_list
    const listRes = await callTool('qap_auth_list', {});
    expect(listRes.text).not.toContain(SENTINEL_PASSWORD);
    expect(JSON.stringify(listRes.parsed)).not.toContain(SENTINEL_PASSWORD);

    // 1c. No en respuestas de error de tools
    const errRes = await callTool('qap_auth_add', {
      profile: 'sec-tester',
      env: 'local',
      username: 'sec-user',
      password: SENTINEL_PASSWORD,
      role: 'tester',
      login_route: '/login',
    });
    expect(errRes.text).not.toContain(SENTINEL_PASSWORD);

    // 2. No en ningún archivo bajo .qa/ (revisar recursivamente)
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
    searchSentinelInDir(join(tempDir, '.qa'));

    // 2b. Verificación explícita de SQLite en .qa/reports/ si existe
    const sqlitePath = join(tempDir, '.qa', 'reports', 'qap.sqlite');
    if (existsSync(sqlitePath)) {
      const sqliteBuf = readFileSync(sqlitePath);
      expect(sqliteBuf.includes(Buffer.from(SENTINEL_PASSWORD))).toBe(false);
    }

    // 3. No en profiles.json
    const profilesContent = readFileSync(join(tempDir, '.qa', 'project', 'auth', 'profiles.json'), 'utf-8');
    expect(profilesContent).not.toContain(SENTINEL_PASSWORD);

    // 4. Solo guardado en el llavero seguro (keytar/keychain), accesible únicamente vía AuthManager
    const { AuthManager } = await import('@qap/auth');
    const authManager = new AuthManager(tempDir);
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

    expect(parsed.status).toBe('success');
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
    await callTool('qap_session_plan', {
      modules: [
        { module: 'auth', path: '/login', priority: 'high' },
        { module: 'delayed_guard_mod', path: '/protected-delayed-client-guard', priority: 'high' },
      ],
      auth: { required: true, method: 'credentials', roles: ['admin'] },
    });

    // Asegurar fase WORKING
    const lcPath = join(tempDir, '.qa', 'project', 'lifecycle.json');
    const lc = JSON.parse(readFileSync(lcPath, 'utf-8'));
    lc.phase = 'WORKING';
    writeFileSync(lcPath, JSON.stringify(lc, null, 2), 'utf-8');

    const { parsed } = await callTool('qap_discover', {
      name: 'delayed_guard_mod',
      path: '/protected-delayed-client-guard',
    });

    expect(parsed.status).toBe('blocked');
    expect(parsed.razon).toBe('auth_required');
    expect(parsed.desbloquear_con?.tool).toBe('qap_auth_add');

    // Cero escrituras en .qa/modules/delayed_guard_mod
    expect(existsSync(join(tempDir, '.qa', 'modules', 'delayed_guard_mod'))).toBe(false);
  });
});
