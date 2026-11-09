import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { createMcpServer } from '../server.js';

vi.mock('playwright-core', () => ({
  chromium: {
    launch: vi.fn().mockImplementation(async () => ({
      newPage: vi.fn().mockResolvedValue({
        goto: vi.fn().mockResolvedValue(null),
        title: vi.fn().mockResolvedValue('Mocked Title'),
      }),
      close: vi.fn().mockResolvedValue(undefined),
    })),
  },
}));

vi.mock('@qap/playwright-adapter', () => ({
  PlaywrightAdapter: class {
    constructor(public options: { storageState?: unknown } = {}) {}
    async discover(spec: { name: string; path: string }) {
      if (spec.path === '/category-test') {
        return {
          name: spec.name,
          path: spec.path,
          description: `Módulo ${spec.name}`,
          cases: [],
          context: {
            discovered_routes: [spec.path],
            forms: [{ id: 'category-form', selector: '#category-form', fields: [{ key: 'nombre' }] }],
            buttons: [{ key: 'btn-save', text: 'Guardar' }],
            links: [{ href: '/help', text: 'Ayuda' }],
            is_auth_view: false,
            session_saved: false,
          },
        };
      }
      if (spec.path === '/login') {
        return {
          name: spec.name,
          path: spec.path,
          description: `Módulo ${spec.name}`,
          cases: [],
          context: {
            discovered_routes: ['http://localhost:3000/login'],
            requested_url: 'http://localhost:3000/login',
            final_url: 'http://localhost:3000/login',
            page_kind: 'login',
            redirected: false,
            forms: [{ id: 'login-form', selector: '#login-form', fields: [{ key: 'user' }, { key: 'pass' }] }],
            buttons: [{ key: 'btn-login', text: 'Entrar' }],
            links: [],
            is_auth_view: true,
            session_saved: false,
          },
        };
      }
      if (spec.path === '/protegido') {
        return {
          name: spec.name,
          path: spec.path,
          description: `Módulo ${spec.name}`,
          cases: [],
          context: {
            discovered_routes: ['http://localhost:3000/login'],
            requested_url: 'http://localhost:3000/protegido',
            final_url: 'http://localhost:3000/login',
            page_kind: 'auth_wall',
            redirected: true,
            forms: [{ id: 'login-form', selector: '#login-form', fields: [{ key: 'user' }, { key: 'pass' }] }],
            buttons: [{ key: 'btn-login', text: 'Entrar' }],
            links: [],
            is_auth_view: true,
            session_saved: false,
          },
        };
      }
      return {
        name: spec.name,
        path: spec.path,
        description: `Módulo ${spec.name}`,
        cases: [],
        context: {
          discovered_routes: [spec.path],
          forms: [{ id: 'item-form', selector: '#item-form', fields: [{ key: 'title' }, { key: 'password' }] }],
          buttons: [{ key: 'btn-save', text: 'Guardar' }],
          links: [],
          is_auth_view: false,
          session_saved: false,
        },
      };
    }
  },
  normalizeUrlForComparison: (url: string, base: string) => new URL(url, base),
}));

describe('P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a)', () => {
  let tempDir: string;
  let server: ReturnType<typeof createMcpServer>;
  let handler: (req: unknown, extra: unknown) => Promise<{ content: Array<{ text: string }> }>;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'qap-p45a-'));
    // Explicit authorization belongs to the host fixture, not targetPath.
    server = createMcpServer({ projectRoots: [tempDir] });
    // @ts-expect-error accessing internal handler
    handler = server._requestHandlers.get(CallToolRequestSchema.shape.method.value);
  });

  afterEach(() => {
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  async function callTool(name: string, args: Record<string, unknown> = {}) {
    const finalArgs = name === 'qap_init' && !args.baseUrl ? { baseUrl: 'http://localhost:3000', ...args } : args;
    const res = await handler({ method: 'tools/call', params: { name, arguments: { targetPath: tempDir, ...finalArgs } } }, {});
    const text = res.content?.[0]?.text ?? '';
    const parsed = JSON.parse(text);
    return { res, text, parsed };
  }

  it('C7: compuerta de roles exige auth.roles no vacío y perfil verificado por cada rol para salir de SCOPING', async () => {
    await callTool('qap_init', { projectName: 'roles-gate-test' });
    await callTool('qap_context_set', {
      framework: 'react',
      app_type: 'spa',
      objective: 'Plataforma segura con múltiples roles y permisos estrictos',
      critical_flows: [{ name: 'login', description: 'Flujo de login seguro' }],
      roles: [{ name: 'admin', description: 'Administrador' }, { name: 'editor', description: 'Editor de contenidos' }],
      source_of_truth: { type: 'prd', declared: true, ref: 'prd-inline' },
    });

    // 1. auth.required true sin roles: bloquea
    const rNoRoles = await callTool('qap_session_plan', {
      plan: [{ module: 'admin_panel', path: '/admin', priority: 'high' }],
      auth: { required: true, roles: [] },
    });
    expect(rNoRoles.parsed.status).toBe('blocked');
    expect(rNoRoles.parsed.razon).toBe('auth_roles_required');

    // 2. auth.required true con roles pero sin perfiles verificados: bloquea en SCOPING
    const rNoProfiles = await callTool('qap_session_plan', {
      plan: [{ module: 'admin_panel', path: '/admin', priority: 'high' }],
      auth: { required: true, roles: ['admin', 'editor'] },
    });
    expect(rNoProfiles.parsed.status).toBe('blocked');
    expect(rNoProfiles.parsed.razon).toBe('auth_roles_required');
    expect(rNoProfiles.parsed.fase).toBe('SCOPING');

    // 3. Crear perfiles verificados para ambos roles -> transiciona a WORKING
    const authDir = join(tempDir, '.qa', 'project', 'auth');
    mkdirSync(authDir, { recursive: true });
    const profilesPath = join(authDir, 'profiles.json');
    writeFileSync(profilesPath, JSON.stringify({
      profiles: [
        { id: 'admin_prof', role: 'admin', verified: true, method: 'credentials', created_at: new Date().toISOString() },
        { id: 'editor_prof', role: 'editor', verified: true, method: 'credentials', created_at: new Date().toISOString() },
      ],
    }), 'utf-8');

    const rWithVerified = await callTool('qap_session_plan', {
      plan: [{ module: 'admin_panel', path: '/admin', priority: 'high' }],
      auth: { required: true, roles: ['admin', 'editor'] },
    });
    expect(rWithVerified.parsed.status).toBe('success');
    expect(rWithVerified.parsed.fase).toBe('WORKING');
  });

  it('C8: tras "corregir", emite primero campos_a_corregir y luego pregunta abierta secuencial por campo', async () => {
    await callTool('qap_init', { projectName: 'correction-test' });
    await callTool('qap_context_set', {
      framework: 'react',
      app_type: 'spa',
      objective: 'Plataforma de prueba inicial para compras y catálogo',
      critical_flows: [{ name: 'compra', description: 'Flujo de compra' }],
      roles: [{ name: 'cliente', description: 'Cliente comprador' }],
      source_of_truth: { type: 'prd', declared: true, ref: 'prd-inline' },
    });

    // 1. Elegir "corregir" en la tarjeta de resumen -> emite selección múltiple de campos
    const rCorregir = await callTool('qap_context_set', { confirmar_resumen: 'corregir' });
    expect(rCorregir.parsed.status).toBe('success');
    const pCampos = rCorregir.parsed.siguiente_accion?.pregunta;
    expect(pCampos).toBeDefined();
    expect(pCampos.id).toBe('onboarding.campos_a_corregir');
    expect(pCampos.formato).toBe('multiple');

    // 2. Elegir campos 'objective' y 'roles' -> emite pregunta abierta para el primer campo (objective)
    const rCamposSelected = await callTool('qap_context_set', { campos: ['objective', 'roles'] });
    expect(rCamposSelected.parsed.status).toBe('success');
    const pObj = rCamposSelected.parsed.siguiente_accion?.pregunta;
    expect(pObj).toBeDefined();
    expect(pObj.id).toBe('onboarding.corregir.objective');
    expect(pObj.formato).toBe('abierta');

    // 3. Responder objetivo -> emite pregunta abierta para el segundo campo (roles)
    const rObjAnswered = await callTool('qap_context_set', { objective: 'Plataforma corregida de comercio electrónico B2B' });
    expect(rObjAnswered.parsed.status).toBe('success');
    const pRoles = rObjAnswered.parsed.siguiente_accion?.pregunta;
    expect(pRoles).toBeDefined();
    expect(pRoles.id).toBe('onboarding.corregir.roles');
    expect(pRoles.formato).toBe('abierta');

    // 4. Responder roles -> completa las correcciones pendientes y avanza la fase
    const rRolesAnswered = await callTool('qap_context_set', { roles: 'administrador, comprador_vip' });
    expect(rRolesAnswered.parsed.status).toBe('success');
    expect(rRolesAnswered.parsed.fase).toBe('SCOPING');
    const pNext = rRolesAnswered.parsed.siguiente_accion?.pregunta;
    expect(pNext).toBeDefined();
    expect(pNext.id).toBe('scoping.modulos_a_probar');
  });

  it('C4-d: plan con auth.required true sin roles queda bloqueado con pregunta de roles y bloquea discover (V4)', async () => {
    await callTool('qap_init', { projectName: 'auth-roles-gate' });
    await callTool('qap_context_set', {
      framework: 'react',
      app_type: 'spa',
      objective: 'Evaluación de compuerta auth.required sin roles',
      critical_flows: [{ name: 'f1', description: 'Flujo' }],
      roles: [{ name: 'operador', description: 'Operador del sistema' }],
      source_of_truth: { type: 'prd', declared: true, ref: 'prd-inline' },
    });

    // 1. Session plan con auth.required: true y method definido pero sin roles (en fase SCOPING)
    const rNoRoles = await callTool('qap_session_plan', {
      plan: [{ module: 'panel', path: '/panel', priority: 'high' }],
      auth: { required: true, method: 'handoff' },
    });
    expect(rNoRoles.parsed.status).toBe('blocked');
    expect(rNoRoles.parsed.razon).toBe('auth_roles_required');
    expect(rNoRoles.parsed.siguiente_accion?.pregunta?.id).toBe('scoping.roles_a_probar');

    // 2. Intento de ejecutar qap_discover en SCOPING debe ser bloqueado
    const rDiscoverBlocked = await callTool('qap_discover', { name: 'panel', path: '/panel' });
    expect(rDiscoverBlocked.parsed.status).toBe('blocked');
    expect(rDiscoverBlocked.parsed.razon).toMatch(/No se puede ejecutar qap_discover en la fase SCOPING/);
  });


});
