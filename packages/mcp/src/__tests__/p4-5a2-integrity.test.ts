import { existsSync, mkdtempSync, rmSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { canExitScoping, computeCoverage, computeSessionGapSummary, type Pregunta } from '@qap/engine';
import { filterValidRoles, isValidRoleName, type LifecycleState, type AuthProfile } from '@qap/shared';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import YAML from 'yaml';

import {
  startAuthFixtureServer,
  TEST_CREDENTIALS,
  type AuthFixtureServerInstance,
} from '../../../playwright-adapter/test/fixtures/auth-fixture-server.js';
import { getPhaseGuidance } from '../guidance.js';
import { createMcpServer } from '../server.js';

// In-memory keychain mock para pruebas sin dependencias externas
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

type CallToolHandler = (request: unknown, extra: unknown) => Promise<{ content: Array<{ text: string }> }>;

describe('P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10)', { timeout: 45000 }, () => {
  let fixtureServer: AuthFixtureServerInstance;
  let tempDir: string;
  let serverHandler: CallToolHandler;

  beforeAll(async () => {
    fixtureServer = await startAuthFixtureServer();
  });

  afterAll(async () => {
    await fixtureServer.close();
  });

  beforeEach(async () => {
    inMemoryKeychain.clear();
    tempDir = mkdtempSync(join(tmpdir(), 'qap-p45a2-test-'));

    // Host-authorized fixture root: passing targetPath alone is not permission.
    const server = createMcpServer({ projectRoots: [tempDir] });
    // @ts-expect-error accessing internal request handler for integration tests
    serverHandler = server._requestHandlers.get(CallToolRequestSchema.shape.method.value);

    // Inicializar proyecto canónico .qa/ en tempDir; fail at the boundary
    // instead of reporting unrelated downstream errors from absent fixtures.
    const initialization = await serverHandler(
      {
        method: 'tools/call',
        params: { name: 'qap_init', arguments: { targetPath: tempDir } },
      },
      {}
    );
    expect(JSON.parse(initialization.content[0].text).status).toBe('success');

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
  });

  afterEach(() => {
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  async function callTool(name: string, args: Record<string, unknown> = {}) {
    const res = await serverHandler(
      {
        method: 'tools/call',
        params: { name, arguments: { targetPath: tempDir, ...args } },
      },
      {}
    );
    const text = res.content?.[0]?.text ?? '';
    const parsed = JSON.parse(text);
    return { res, text, parsed };
  }

  async function setupProjectContext(roles: Array<{ name: string; description: string }>) {
    const updated = await callTool('qap_context_set', {
      framework: 'react',
      app_type: 'spa',
      objective: 'Plataforma empresarial agnóstica para verificación de integridad',
      critical_flows: [{ name: 'flujo_principal', description: 'Flujo principal del sistema' }],
      roles,
      source_of_truth: { type: 'prd', declared: true, ref: 'prd-inline' },
    });
    expect(updated.res.isError).not.toBe(true);
    expect(updated.parsed.status).toBe('success');
  }

  // ==========================================
  // C1: Honestidad de la clasificación y URLs
  // ==========================================
  describe('C1: Clasificación honesta con adaptador real', () => {
    it('C1-a: módulo de acceso pedido en login sin redirección NO se bloquea (page_kind login, success)', async () => {
      await setupProjectContext([{ name: 'admin', description: 'Administrador' }]);
      await callTool('qap_session_plan', {
        plan: [{ module: 'modulo_acceso', path: '/login', priority: 'high', acceso: true }],
        auth: { required: false },
      });

      const r = await callTool('qap_discover', { name: 'modulo_acceso', path: '/login' });
      expect(r.parsed.status).toBe('success');
      expect(r.parsed.page_kind).toBe('login');
      expect(r.parsed.observed).toBe(true);
      expect(r.parsed.redirected).toBe(false);
      expect(r.parsed.requested_url).toBe(`${fixtureServer.baseUrl}/login`);
      expect(r.parsed.final_url).toBe(`${fixtureServer.baseUrl}/login`);
    });

    it('C1-b: ruta protegida con redirección HTTP 302 a /login detecta auth_wall determinista y bloquea', async () => {
      await setupProjectContext([{ name: 'admin', description: 'Administrador' }]);
      await callTool('qap_session_plan', {
        plan: [{ module: 'panel_admin', path: '/protected', priority: 'high' }],
        auth: { required: false },
      });

      const r = await callTool('qap_discover', { name: 'panel_admin', path: '/protected' });
      expect(r.parsed.status).toBe('blocked');
      expect(r.parsed.razon).toBe('auth_required');
      expect(r.parsed.page_kind).toBe('auth_wall');
      expect(r.parsed.observed).toBe(true);
      expect(r.parsed.redirected).toBe(true);
      expect(r.parsed.requested_url).toBe(`${fixtureServer.baseUrl}/protected`);
      expect(r.parsed.final_url).toBe(`${fixtureServer.baseUrl}/login`);
    });

    it('C1-c: ruta protegida con guard del lado del cliente detecta auth_wall con redirección al login', async () => {
      await setupProjectContext([{ name: 'admin', description: 'Administrador' }]);
      await callTool('qap_session_plan', {
        plan: [{ module: 'modulo_cliente', path: '/protected-client-guard', priority: 'high' }],
        auth: { required: false },
      });

      const r = await callTool('qap_discover', { name: 'modulo_cliente', path: '/protected-client-guard' });
      expect(r.parsed.status).toBe('blocked');
      expect(r.parsed.razon).toBe('auth_required');
      expect(r.parsed.page_kind).toBe('auth_wall');
      expect(r.parsed.observed).toBe(true);
      expect(r.parsed.redirected).toBe(true);
      expect(r.parsed.requested_url).toBe(`${fixtureServer.baseUrl}/protected-client-guard`);
      expect(r.parsed.final_url).toBe(`${fixtureServer.baseUrl}/login`);
    });
  });

  // ==========================================
  // C2: Pregunta de roles estructurada
  // ==========================================
  describe('C2: Formatos de pregunta de roles según roles declarados', () => {
    it('C2-a: con 0 roles declarados genera formato abierta con ejemplo en el texto', () => {
      const guidance = getPhaseGuidance('SCOPING', {
        context: { roles: [] },
        lifecycle: {
          session: {
            auth: { required: true, method: 'credentials' },
            plan: [{ module: 'panel', path: '/panel', priority: 'high' }],
          },
        } as unknown as LifecycleState,
      });

      const q = guidance.siguiente_accion?.pregunta;
      expect(q).toBeDefined();
      expect(q?.id).toBe('scoping.roles_a_probar');
      expect(q?.formato).toBe('abierta');
      expect(q?.opciones).toHaveLength(0);
      expect(q?.permite_otra).toBe(true);
      expect(q?.texto).toContain('(por ejemplo: admin, operador)');
    });

    it('C2-b: con 1 rol declarado genera formato una_opcion con 2 opciones y seguimiento abierto', () => {
      const guidance = getPhaseGuidance('SCOPING', {
        context: { roles: [{ name: 'operador' }] },
        lifecycle: {
          session: {
            auth: { required: true, method: 'credentials' },
            plan: [{ module: 'panel', path: '/panel', priority: 'high' }],
          },
        } as unknown as LifecycleState,
      });

      const q = guidance.siguiente_accion?.pregunta;
      expect(q).toBeDefined();
      expect(q?.id).toBe('scoping.roles_a_probar');
      expect(q?.formato).toBe('una_opcion');
      expect(q?.opciones).toHaveLength(2);
      expect(q?.opciones[0].etiqueta).toBe("Probar con el rol 'operador'");
      expect(q?.opciones[1].etiqueta).toBe('Indicar otro rol');
      expect(q?.opciones[1].efecto?.abre_seguimiento).toBe(true);
      expect(q?.seguimiento).toBeDefined();
      expect(q?.seguimiento?.formato).toBe('abierta');
    });

    it('C2-c: con 3 roles declarados genera formato multiple sin ninguna opción recomendada', () => {
      const guidance = getPhaseGuidance('SCOPING', {
        context: {
          roles: [
            { name: 'admin' },
            { name: 'operador' },
            { name: 'auditor' },
          ],
        },
        lifecycle: {
          session: {
            auth: { required: true, method: 'credentials' },
            plan: [{ module: 'panel', path: '/panel', priority: 'high' }],
          },
        } as unknown as LifecycleState,
      });

      const q = guidance.siguiente_accion?.pregunta;
      expect(q).toBeDefined();
      expect(q?.id).toBe('scoping.roles_a_probar');
      expect(q?.formato).toBe('multiple');
      expect(q?.opciones).toHaveLength(3);
      for (const op of q?.opciones || []) {
        expect(op.recomendada).toBeUndefined();
      }
    });
  });

  // ==========================================
  // C3: Categoría de from_option y Cobertura
  // ==========================================
  describe('C3: Integridad de categoría en from_option y regla de cobertura completa', () => {




    it('C3-c: cobertura completa nunca es true mientras exista una categoría diferida (deferred no cubre)', () => {
      const cov = computeCoverage(
        ['proposito', 'actor'],
        [
          {
            id: 'R-001',
            category: 'proposito',
            description: 'Propósito confirmado del módulo de administración',
            source: 'user_confirmed',
            status: 'confirmed',
          },
          {
            id: 'R-002',
            category: 'actor',
            description: 'Categoría diferida: actor',
            source: 'user_confirmed',
            status: 'deferred',
          },
        ],
        [],
        'default'
      );

      expect(cov.categorias.proposito?.cubierta).toBe(true);
      expect(cov.categorias.actor?.cubierta).toBe(false);
      expect(cov.categorias.actor?.diferida).toBe(true);
      expect(cov.completa).toBe(false);
    });
  });

  // ==========================================
  // C4: Flujo de borrador y propuesta de enunciado
  // ==========================================
  describe('C6: Ciclo completo plan -> auth -> compuerta de SCOPING con adaptador real', () => {
    it('C6-a: plan bloqueado por perfil no verificado persiste, auth_add verifica y compuerta avanza a WORKING', async () => {
      await setupProjectContext([{ name: 'admin', description: 'Administrador del sistema' }]);

      // Paso 1: qap_session_plan con auth.required true, roles ['admin'] y módulo protegido
      const rPlan = await callTool('qap_session_plan', {
        plan: [{ module: 'panel_admin', path: '/protected', priority: 'high' }],
        auth: { required: true, method: 'credentials', roles: ['admin'] },
      });

      expect(rPlan.parsed.status).toBe('blocked');
      expect(rPlan.parsed.razon).toBe('auth_roles_required');
      expect(rPlan.parsed.fase).toBe('SCOPING');

      // Demostrar que el plan quedó persistido en lifecycle.json
      const lcFile = join(tempDir, '.qa', 'project', 'lifecycle.json');
      const lcData = JSON.parse(readFileSync(lcFile, 'utf-8'));
      expect(lcData.session?.auth?.required).toBe(true);
      expect(lcData.session?.auth?.roles).toEqual(['admin']);
      expect(lcData.session?.plan).toHaveLength(1);
      expect(lcData.session?.plan[0].module).toBe('panel_admin');

      // Paso 2: qap_auth_add con método credentials para admin verifica contra la ruta del módulo protegido
      const rAuth = await callTool('qap_auth_add', {
        profile: 'admin',
        env: 'local',
        username: TEST_CREDENTIALS.username,
        password: TEST_CREDENTIALS.password,
        role: 'admin',
        login_route: '/login',
      });

      expect(rAuth.parsed.status).toBe('success');
      expect(rAuth.parsed.profile.verified).toBe(true);

      // Paso 3: Compuerta de salida de SCOPING pasa y la fase avanza a WORKING
      const freshLc = JSON.parse(readFileSync(lcFile, 'utf-8')) as LifecycleState;
      const profilesPath = join(tempDir, '.qa', 'project', 'auth', 'profiles.json');
      const profilesData = JSON.parse(readFileSync(profilesPath, 'utf-8')) as { profiles: AuthProfile[] };
      const gate = canExitScoping(freshLc, profilesData.profiles);
      expect(gate.passed).toBe(true);
      expect(gate.faltantes).toHaveLength(0);

      // Siguiente llamada de estado o sesión refleja fase WORKING
      const rStatus = await callTool('qap_status', {});
      expect(rStatus.parsed.fase).toBe('WORKING');
    });
  });

  // ==========================================
  // C9: Roles limpios
  // ==========================================
  describe('C9: Validación y filtrado riguroso de roles limpios', () => {
    it('C9-a: qap_init y qap_context_ingest descartan entradas de tabla Markdown y reportan roles_descartados', async () => {
      const contaminatedDoc = `# PRD con tabla de roles
| Rol | Límite |
|---|---|
| admin | Total |
| operador | Parcial |
---
`;
      const docPath = join(tempDir, 'prd_test.md');
      writeFileSync(docPath, contaminatedDoc, 'utf-8');

      const rIngest = await callTool('qap_context_ingest', { docPath });
      expect(rIngest.parsed.status).toBe('success');

      // Comprobar que en roles_descartados aparecen las entradas de tabla
      const descartados = rIngest.parsed.roles_descartados || [];
      expect(descartados.length).toBeGreaterThan(0);

      // Comprobar que ningún rol descartado empieza o termina con barra o contiene solo guiones
      for (const d of descartados) {
        expect(isValidRoleName(d)).toBe(false);
      }
    });

    it('C9-b: los 4 lectores ignoran roles inválidos presentes en un context.yaml contaminado', async () => {
      // Inyectar roles contaminados directamente en context.yaml
      const ctxFile = join(tempDir, '.qa', 'project', 'context.yaml');
      const contaminatedCtx = {
        _version: '1',
        project_name: 'test-contaminado',
        description: 'Contexto de prueba con roles contaminados',
        framework: 'react',
        app_type: 'spa',
        objective: 'Verificar lectores limpios',
        critical_flows: [{ name: 'f1', description: 'Flujo' }],
        roles: [
          { name: 'admin', description: 'Rol legítimo' },
          { name: '| Rol | Límite |', description: 'Fila de tabla' },
          { name: '|---|---|', description: 'Separador de tabla' },
          { name: '---', description: 'Separador horizontal' },
          { name: 'operador', description: 'Otro rol legítimo' },
        ],
        source_of_truth: { type: 'prd', declared: true, ref: 'prd-inline' },
      };
      writeFileSync(ctxFile, YAML.stringify(contaminatedCtx), 'utf-8');

      // Lector 1: Pregunta de roles en guidance
      const guidance = getPhaseGuidance('SCOPING', {
        context: contaminatedCtx,
        lifecycle: {
          session: {
            auth: { required: true, method: 'credentials' },
            plan: [{ module: 'panel', path: '/panel', priority: 'high' }],
          },
        } as unknown as LifecycleState,
      });
      const qRoles = guidance.siguiente_accion?.pregunta;
      expect(qRoles?.opciones).toHaveLength(2); // Solo 'admin' y 'operador'
      expect(qRoles?.opciones.map((o: { etiqueta: string }) => o.etiqueta)).toEqual(['admin', 'operador']);

      // Lector 2: filterValidRoles directo
      const validos = filterValidRoles(contaminatedCtx.roles);
      expect(validos).toEqual(['admin', 'operador']);

      // Lector 3: Lector del reporte de brechas (roles_totales)
      const gapSummary = computeSessionGapSummary({
        plan: [],
        moduleRules: {},
        projectContext: contaminatedCtx,
        profiles: [],
      });
      expect(gapSummary.roles_totales).toBe(2);
    });

    it('C9-c: roles legítimos con espacios, tildes, guiones y números son aceptados siempre', () => {
      const rolesLegitimos = [
        'Administrador General',
        'operador-1',
        'auditor_tecnico',
        'Gestión y Finanzas',
        'Nivel 2',
      ];

      for (const r of rolesLegitimos) {
        expect(isValidRoleName(r)).toBe(true);
      }
    });
  });

  // ==========================================
  // C10: Extracción vacía visible
  // ==========================================
  describe('C3: Transliteración NFD de slugs y prevención de módulos fuera del plan', () => {
    it('C3-a: opciones de módulos en guidance usan normalizeSlug sin sustituir tildes por guiones bajos', () => {
      const guidance = getPhaseGuidance('SCOPING', {
        suggestedModules: [
          { module: 'Asignación de ejecutivo de campo por carga', path: '/asignacion' },
          { module: 'Operación básica', path: '/operacion' },
        ],
      });

      const q = guidance.siguiente_accion?.pregunta;
      expect(q).toBeDefined();
      expect(q?.opciones?.[0]?.id).toBe('modulo_asignacion_de_ejecutivo_de_campo_por_carga');
      expect(q?.opciones?.[0]?.id).not.toContain('asignaci_n');
    });

    it('C3-b: qap_session_plan limpia módulos planned huérfanos que ya no pertenezcan al plan', async () => {
      await setupProjectContext([{ name: 'admin', description: 'Administrador' }]);

      // Plan inicial con 2 módulos en SCOPING
      await callTool('qap_session_plan', {
        plan: [
          { module: 'modulo_persistente', path: '/uno', priority: 'high' },
          { module: 'modulo_fantasma', path: '/dos', priority: 'low' },
        ],
        auth: { required: true },
      });

      // Modificar plan en SCOPING dejando solo 1 módulo
      await callTool('qap_session_plan', {
        plan: [
          { module: 'modulo_persistente', path: '/uno', priority: 'high' },
        ],
        auth: { required: true },
      });

      const lcPath = join(tempDir, '.qa', 'project', 'lifecycle.json');
      const lc = JSON.parse(readFileSync(lcPath, 'utf-8'));

      expect(lc.session.plan.length).toBe(1);
      expect(lc.session.plan[0].module).toBe('modulo_persistente');
      expect(lc.modules['modulo_persistente']).toBeDefined();
      expect(lc.modules['modulo_fantasma']).toBeUndefined();
    });




  });
});

