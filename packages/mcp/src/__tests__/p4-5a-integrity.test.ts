import { mkdtempSync, rmSync, writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import YAML from 'yaml';

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
      if (spec.path === '/login' || spec.path === '/protegido') {
        return {
          name: spec.name,
          path: spec.path,
          description: `Módulo ${spec.name}`,
          cases: [],
          context: {
            discovered_routes: [spec.path],
            page_kind: 'auth_wall',
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
    server = createMcpServer();
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

  async function initAndAdvanceToWorking() {
    await callTool('qap_init', { projectName: 'integrity-test' });
    await callTool('qap_context_set', {
      framework: 'react',
      app_type: 'spa',
      objective: 'Plataforma empresarial para gestión de auditorías de calidad',
      critical_flows: [{ name: 'auditoria', description: 'Flujo de auditoría completa' }],
      roles: [
        { name: 'auditor', description: 'Auditor certificado' },
        { name: 'admin', description: 'Administrador del sistema' },
      ],
      source_of_truth: { type: 'prd', declared: true, ref: 'prd-inline' },
    });
    await callTool('qap_session_plan', {
      plan: [{ module: 'auditorias', path: '/auditorias', priority: 'high' }],
      auth: { required: false },
    });
    await callTool('qap_discover', { name: 'auditorias', path: '/auditorias' });
  }

  it('Criterio 2: regla redactada por agente sin user_text ni from_option se guarda como inferred/agent y no cuenta en cobertura', async () => {
    await initAndAdvanceToWorking();

    // El agente intenta enviar una regla confirmada redactada por él mismo
    const res = await callTool('qap_rules_set', {
      module: 'auditorias',
      view: 'default',
      rules: [
        {
          category: 'proposito',
          description: 'El agente redactó esta descripción sin texto del usuario',
          status: 'confirmed',
          source: 'agent',
        },
      ],
    });

    expect(res.parsed.status).toBe('success');
    expect(res.parsed.desbloquear_con).toBeDefined();
    expect(res.parsed.desbloquear_con.tool).toBe('qap_rules_set');
    expect(res.parsed.desbloquear_con.descripcion).toContain('agente');

    // La regla debe haberse guardado como status inferred y source agent
    const rulesFile = join(tempDir, '.qa', 'modules', 'auditorias', 'rules.yaml');
    const doc = YAML.parse(readFileSync(rulesFile, 'utf-8'));
    const savedRule = doc.rules.find((r: { category: string }) => r.category === 'proposito');
    expect(savedRule).toBeDefined();
    expect(savedRule.status).toBe('inferred');
    expect(savedRule.source).toBe('agent');

    // No debe contar como cubierta ni sustantiva
    expect(res.parsed.cobertura.categorias.proposito.cubierta).toBe(false);
    expect(res.parsed.cobertura.categorias.proposito.sustantiva).toBe(false);
    expect(res.parsed.cobertura.sustantivas).toBe(0);
  });

  it('Criterio 3: una etiqueta de opción predefinida del motor NO cubre una categoría', async () => {
    await initAndAdvanceToWorking();

    // Intentar cubrir con una etiqueta tautológica generada por el motor
    const res = await callTool('qap_rules_set', {
      module: 'auditorias',
      view: 'default',
      rules: [
        {
          category: 'proposito',
          description: 'Confirmar propósito y comportamiento esperado',
          user_text: 'Confirmar propósito y comportamiento esperado',
        },
      ],
    });

    expect(res.parsed.status).toBe('success');
    // La regla tautológica es degradada a agent/inferred
    expect(res.parsed.cobertura.categorias.proposito.cubierta).toBe(false);
    expect(res.parsed.cobertura.categorias.proposito.sustantiva).toBe(false);
    expect(res.parsed.cobertura.sustantivas).toBe(0);
  });

  it('Criterio 4: un módulo con 2 reglas de 7 categorías no cierra sin accept_gaps, y cierra con él dejando registro', async () => {
    await initAndAdvanceToWorking();

    // Añadir 2 reglas sustantivas (cobertura 2 de 7 < 50%)
    await callTool('qap_rules_set', {
      module: 'auditorias',
      view: 'default',
      rules: [
        {
          category: 'proposito',
          user_text: 'Gestionar auditorías y registrar evidencias de calidad en el sistema',
        },
        {
          category: 'actor',
          user_text: 'Acceso restringido a usuarios con perfil de auditor certificado',
        },
      ],
    });

    // 1. Intento de cierre sin accept_gaps: debe responder blocked con razon cobertura_insuficiente
    const rBlocked = await callTool('qap_module_close', {
      module: 'auditorias',
      action: 'close',
      user_confirmed: true,
      accept_gaps: false,
    });

    expect(rBlocked.parsed.status).toBe('blocked');
    expect(rBlocked.parsed.razon).toBe('cobertura_insuficiente');
    expect(rBlocked.parsed.cobertura.sustantivas).toBe(2);

    // 2. Cierre con accept_gaps y justificación >= 15 caracteres
    const rSuccess = await callTool('qap_module_close', {
      module: 'auditorias',
      action: 'close',
      user_confirmed: true,
      accept_gaps: true,
      accept_gaps_reason: 'Módulo evaluado parcialmente para sprint preliminar',
    });

    expect(rSuccess.parsed.status).toBe('success');
    expect(rSuccess.parsed.estado).toBe('closed');

    // Verificar que el registro de cierre guarda las brechas aceptadas
    const lifecycleFile = join(tempDir, '.qa', 'project', 'lifecycle.json');
    const lifecycle = JSON.parse(readFileSync(lifecycleFile, 'utf-8'));
    const modClosed = lifecycle.modules.auditorias;
    expect(modClosed.state).toBe('closed');
    expect(modClosed.accepted_gaps).toBeDefined();
    expect(modClosed.accepted_gaps.reason).toBe('Módulo evaluado parcialmente para sprint preliminar');
    expect(modClosed.accepted_gaps.sustantivas).toBe(2);
  });

  it('C9a: blocked de qap_discover con auth_required incluye razon auth_required y directorio_objetivo, con claves alineadas a session_invalid', async () => {
    await callTool('qap_init', { projectName: 'auth-keys-test' });
    await callTool('qap_context_set', {
      framework: 'react',
      app_type: 'spa',
      objective: 'Plataforma para gestión de pagos empresariales con autenticación',
      critical_flows: [{ name: 'login', description: 'Flujo de login' }],
      roles: [{ name: 'admin', description: 'Administrador' }],
      source_of_truth: { type: 'prd', declared: true, ref: 'prd-inline' },
    });
    // Plan con auth.required: true y ruta protegida
    await callTool('qap_session_plan', {
      plan: [{ module: 'protegido', path: '/protegido', priority: 'high' }],
      auth: { required: true, roles: ['admin'] },
    });

    // Poner en WORKING para evaluar discover protegido (igual que en p4-4-auth-lifecycle)
    const lcPath = join(tempDir, '.qa', 'project', 'lifecycle.json');
    const lc = JSON.parse(readFileSync(lcPath, 'utf-8'));
    lc.phase = 'WORKING';
    writeFileSync(lcPath, JSON.stringify(lc, null, 2), 'utf-8');

    // 1. Descubrir ruta protegida sin perfil verificado -> auth_required
    const resAuthReq = await callTool('qap_discover', { name: 'protegido', path: '/protegido' });
    expect(resAuthReq.parsed.status).toBe('blocked');
    expect(resAuthReq.parsed.razon).toBe('auth_required');
    expect(resAuthReq.parsed.directorio_objetivo).toBeDefined();

    // 2. Simular perfil verificado pero sesión invalidada/expirada -> session_invalid
    const authDir = join(tempDir, '.qa', 'project', 'auth');
    mkdirSync(authDir, { recursive: true });
    writeFileSync(
      join(authDir, 'profiles.json'),
      JSON.stringify({
        profiles: [{ id: 'admin_prof', role: 'admin', verified: true, method: 'credentials', created_at: new Date().toISOString() }],
      }),
      'utf-8'
    );
    const resSessionInv = await callTool('qap_discover', { name: 'protegido', path: '/protegido' });
    expect(resSessionInv.parsed.status).toBe('blocked');
    expect(resSessionInv.parsed.razon).toBe('session_invalid');
    expect(resSessionInv.parsed.directorio_objetivo).toBeDefined();

    // Validar conjunto exacto de claves idéntico en ambas respuestas
    const keysAuthReq = Object.keys(resAuthReq.parsed as Record<string, unknown>).sort();
    const keysSessionInv = Object.keys(resSessionInv.parsed as Record<string, unknown>).sort();
    expect(keysAuthReq).toEqual(keysSessionInv);
    expect(keysAuthReq).toEqual([
      'desbloquear_con',
      'directorio_objetivo',
      'final_url',
      'http_status',
      'modulo',
      'page_kind',
      'razon',
      'redirected',
      'requested_url',
      'ruta',
      'siguiente_accion',
      'status',
    ]);
  });

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
});
