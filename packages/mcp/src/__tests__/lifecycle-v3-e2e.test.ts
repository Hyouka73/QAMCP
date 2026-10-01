/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
import { existsSync, mkdtempSync, rmSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { SchemaValidator } from '@qap/shared';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import YAML from 'yaml';

import { createMcpServer } from '../server.js';

vi.mock('playwright-core', () => ({
  chromium: {
    launch: vi.fn().mockImplementation(async () => ({
      newPage: vi.fn().mockResolvedValue({
        goto: vi.fn().mockResolvedValue(null),
        title: vi.fn().mockResolvedValue('Mocked Page Title'),
      }),
      close: vi.fn().mockResolvedValue(undefined),
    })),
  },
}));

vi.mock('@qap/playwright-adapter', () => ({
  PlaywrightAdapter: class {
    constructor(public options: any = {}) {}
    async discover(spec: { name: string; path: string; tags?: string[] }) {
      const isLogin = spec.path === '/login';
      return {
        name: spec.name,
        path: spec.path,
        description: `Módulo ${spec.name}`,
        tags: spec.tags ?? [],
        cases: [],
        context: {
          discovered_routes: [spec.path, `${spec.path}/sub`],
          forms: [
            {
              id: `${spec.name}-form`,
              selector: `#${spec.name}-form`,
              fields: [
                { key: 'user', name: 'user', id: 'user', type: 'text', required: true, label: 'Usuario' },
                { key: 'pass', name: 'pass', id: 'pass', type: 'password', required: true, label: 'Contraseña' },
              ],
            },
          ],
          buttons: [{ key: 'enviar', text: 'Iniciar sesión', selector: 'button:has-text("Iniciar sesión")' }],
          links: [{ key: 'home', text: 'Inicio', href: '/', selector: 'a:has-text("Inicio")' }],
          is_auth_view: isLogin && !this.options.credentials,
          session_saved: isLogin && Boolean(this.options.credentials),
          storage_state_used: Boolean(this.options.sessionPath),
        },
      };
    }
  },
}));

describe('Lifecycle V3 E2E & Verification Suite (E0 - E3)', () => {
  let tempDir: string;
  let originalCwd: () => string;
  let server: any;
  let handler: any;
  const validator = new SchemaValidator();

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'qap-v3-e2e-'));
    originalCwd = process.cwd;
    process.cwd = () => tempDir;

    server = createMcpServer();
    // @ts-expect-error accessing internal handler
    handler = server._requestHandlers.get(CallToolRequestSchema.shape.method.value);
  });

  afterEach(() => {
    process.cwd = originalCwd;
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  async function callTool(name: string, args: Record<string, unknown> = {}) {
    const res = await handler({ method: 'tools/call', params: { name, arguments: args } }, {});
    const text = res.content?.[0]?.text ?? '';
    let parsed: any = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      // no-op
    }
    return { res, text, parsed };
  }

  function validateLifecycleState() {
    const statePath = join(tempDir, '.qa', 'project', 'lifecycle.json');
    if (!existsSync(statePath)) return;
    const raw = readFileSync(statePath, 'utf-8');
    const json = JSON.parse(raw);
    const res = validator.validateLifecycleState(json);
    if (!res.valid) {
      throw new Error(`lifecycle.json no valida contra lifecycle-state.schema.json: ${JSON.stringify(res.errors)}`);
    }
  }

  async function advanceToWorking(plan: Array<{ module: string; path: string; priority?: string }> = [{ module: 'auth', path: '/login', priority: 'high' }]) {
    await callTool('qap_init', { targetPath: tempDir });
    validateLifecycleState();

    await callTool('qap_context_set', {
      targetPath: tempDir,
      framework: 'react',
      app_type: 'spa',
      objective: 'Validar flujo de compras y autenticación',
      critical_flows: [{ name: 'login', description: 'Flujo de login' }, { name: 'checkout', description: 'Flujo de checkout' }],
      roles: [{ name: 'admin', description: 'Administrador' }, { name: 'customer', description: 'Cliente' }],
      source_of_truth: { type: 'prd', declared: true, ref: 'prd-inline' },
    });
    validateLifecycleState();

    await callTool('qap_session_plan', {
      targetPath: tempDir,
      plan,
      auth: { required: false },
    });
    validateLifecycleState();
  }

  // Criterio 1: E0a
  it('E0a: qap_status en WORKING para módulo con cobertura incompleta devuelve module, view y preguntas no vacías idénticas a qap_rules_set', async () => {
    await advanceToWorking([{ module: 'auth', path: '/login', priority: 'high' }]);
    const discRes = await callTool('qap_discover', { name: 'auth', path: '/login' });
    validateLifecycleState();

    // Estado observed con hipótesis pendientes
    const statusObs = await callTool('qap_status', {});
    expect(statusObs.parsed.siguiente_accion.tipo).toBe('entrevista_vista');
    expect(statusObs.parsed.siguiente_accion.module).toBe('auth');
    expect(statusObs.parsed.siguiente_accion.view).toBe('default');
    expect(statusObs.parsed.siguiente_accion.preguntas).toBeDefined();
    expect(statusObs.parsed.siguiente_accion.preguntas.length).toBeGreaterThan(0);
    expect(statusObs.parsed.siguiente_accion.cobertura).toBeDefined();

    // Transicionar a interviewing con una regla parcial
    const rulesPartial = await callTool('qap_rules_set', {
      module: 'auth',
      view: 'default',
      rules: [{ category: 'proposito', description: 'Módulo de autenticación', source: 'user', status: 'confirmed' }],
    });
    validateLifecycleState();

    expect(rulesPartial.parsed.status).toBe('success');
    expect(rulesPartial.parsed.siguiente_accion.tipo).toBe('entrevista_vista');
    expect(rulesPartial.parsed.siguiente_accion.module).toBe('auth');
    expect(rulesPartial.parsed.siguiente_accion.view).toBe('default');
    expect(rulesPartial.parsed.siguiente_accion.preguntas.length).toBeGreaterThan(0);

    // Llamar a qap_status: debe devolver EXACTAMENTE la misma siguiente_accion que qap_rules_set
    const statusInterviewing = await callTool('qap_status', {});
    expect(statusInterviewing.parsed.siguiente_accion.tipo).toBe('entrevista_vista');
    expect(statusInterviewing.parsed.siguiente_accion.module).toBe('auth');
    expect(statusInterviewing.parsed.siguiente_accion.view).toBe('default');
    expect(statusInterviewing.parsed.siguiente_accion.preguntas).toEqual(rulesPartial.parsed.siguiente_accion.preguntas);
    expect(statusInterviewing.parsed.siguiente_accion.cobertura).toEqual(rulesPartial.parsed.siguiente_accion.cobertura);
  });

  // Criterio 2: E0b
  it('E0b: contrato estricto de opciones y preguntas en todo el flujo', async () => {
    const responses: any[] = [];

    responses.push(await callTool('qap_init', {}));
    responses.push(await callTool('qap_status', {}));
    responses.push(await callTool('qap_context_set', {
      framework: 'react',
      app_type: 'spa',
      objective: 'Verificación estricta de contratos',
    }));
    responses.push(await callTool('qap_session_plan', {
      plan: [{ module: 'auth', path: '/login', priority: 'high' }],
      auth: { auth_required: false },
    }));
    responses.push(await callTool('qap_status', {}));
    responses.push(await callTool('qap_discover', { name: 'auth', path: '/login' }));
    responses.push(await callTool('qap_status', {}));
    responses.push(await callTool('qap_rules_set', {
      module: 'auth',
      view: 'default',
      rules: [{ category: 'proposito', description: 'Módulo de autenticación', source: 'user', status: 'confirmed' }],
    }));
    responses.push(await callTool('qap_status', {}));

    for (const r of responses) {
      if (!r.parsed) continue;
      const sa = r.parsed.siguiente_accion;
      if (!sa) continue;

      // Si tipo es trabajo o entrevista_vista
      if (sa.tipo === 'trabajo' || sa.tipo === 'entrevista_vista') {
        if (r.parsed.pregunta) {
          expect(r.parsed.pregunta).not.toContain('¿Deseas');
          expect(r.parsed.pregunta).not.toContain('¿Quieres');
        }
        expect(r.parsed.opciones).toEqual([]);
      }

      // En toda respuesta, opciones NUNCA puede tener longitud 1
      if (Array.isArray(r.parsed.opciones)) {
        expect(r.parsed.opciones.length).not.toBe(1);
      }

      // Solo si tipo es decision puede llevar opciones, y con >= 2
      if (sa.tipo === 'decision') {
        expect(Array.isArray(r.parsed.opciones)).toBe(true);
        expect(r.parsed.opciones.length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  // Criterio 3: E0c
  it('E0c: qap_report sin ejecuciones responde blocked y no escribe archivos; ninguna siguiente_accion recomienda qap_report sin ejecuciones', async () => {
    await callTool('qap_init', {});
    const reportRes = await callTool('qap_report', { format: 'all' });
    expect(reportRes.parsed.status).toBe('blocked');
    expect(reportRes.parsed.razon).toContain('ejecuciones');

    // No debe haber generado archivos en .qa/executions
    const execDir = join(tempDir, '.qa', 'executions');
    if (existsSync(execDir)) {
      const files = readdirSync(execDir);
      expect(files.filter((f: string) => f.endsWith('.report.html') || f.endsWith('.report.json'))).toHaveLength(0);
    }

    // Ninguna siguiente_accion recomienda qap_report sin ejecuciones
    expect(reportRes.parsed.siguiente_accion.tool).not.toBe('qap_report');
    const statusRes = await callTool('qap_status', {});
    expect(statusRes.parsed.siguiente_accion.tool).not.toBe('qap_report');
  });

  // Criterio 6: E1
  it('E1: regresión consolidated -> interviewing tras re-discover y política de waivers', async () => {
    await advanceToWorking([{ module: 'auth', path: '/login', priority: 'high' }]);
    await callTool('qap_discover', { name: 'auth', path: '/login' });
    validateLifecycleState();

    // 1. Rechazo de waiver con categoría 'proposito'
    const resPropWaiver = await callTool('qap_rules_set', {
      module: 'auth',
      view: 'default',
      category_waivers: [{ category: 'proposito', reason: 'Razón suficientemente larga de waiver' }],
    });
    expect(resPropWaiver.res.isError).toBe(true);
    expect(resPropWaiver.text).toContain("La categoría 'proposito' no se puede renunciar");

    // 2. Rechazo de waiver con reason < 15 caracteres
    const resShortReason = await callTool('qap_rules_set', {
      module: 'auth',
      view: 'default',
      category_waivers: [{ category: 'sensibilidad', reason: 'Muy corta' }],
    });
    expect(resShortReason.res.isError).toBe(true);
    expect(resShortReason.text).toContain('al menos 15 caracteres');

    // 3. Completar cobertura para alcanzar 'consolidated'
    const doc = YAML.parse(readFileSync(join(tempDir, '.qa', 'modules', 'auth', 'rules.yaml'), 'utf-8'));
    const inferred = doc.rules.map((r: any) => ({ ...r, status: 'confirmed', source: 'user' }));
    const completeRules = await callTool('qap_rules_set', {
      module: 'auth',
      view: 'default',
      rules: [
        ...inferred,
        { category: 'proposito', description: 'Módulo de autenticación de usuarios', source: 'user', status: 'confirmed' },
      ],
      category_waivers: [
        { category: 'actor', reason: 'Módulo disponible para todos los actores' },
        { category: 'accion', reason: 'Acciones estándar cubiertas por DOM' },
        { category: 'error', reason: 'Errores no aplican en esta vista específica' },
        { category: 'dato', reason: 'No hay datos adicionales requeridos' },
        { category: 'sensibilidad', reason: 'No hay campos sensibles adicionales' },
      ],
    });
    validateLifecycleState();
    expect(completeRules.parsed.status).toBe('success');
    expect(completeRules.parsed.modulo_estado).toBe('consolidated');
    expect(completeRules.parsed.resumen_cierre).toBeDefined();

    // 4. Regresión: re-discover introduce una nueva hipótesis inferida -> cobertura incompleta -> vuelve a interviewing
    // Simulamos agregando una nueva regla inferred en rules.yaml y llamando re-discover
    const rulesPath = join(tempDir, '.qa', 'modules', 'auth', 'rules.yaml');
    const currRules = YAML.parse(readFileSync(rulesPath, 'utf-8'));
    currRules.rules.push({
      id: 'default.extra_field.required',
      view: 'default',
      category: 'campo',
      description: 'Campo extra requerido',
      status: 'inferred',
      source: 'dom',
    });
    writeFileSync(rulesPath, YAML.stringify(currRules), 'utf-8');

    // Al llamar qap_discover para refrescar
    await callTool('qap_discover', { name: 'auth', path: '/login' });
    validateLifecycleState();

    const statePostRediscover = JSON.parse(readFileSync(join(tempDir, '.qa', 'project', 'lifecycle.json'), 'utf-8'));
    expect(statePostRediscover.modules.auth.state).toBe('interviewing');

    // History contiene el nombre del módulo en la transición de regresión
    const lastHistory = statePostRediscover.history[statePostRediscover.history.length - 1];
    expect(lastHistory.module).toBe('auth');
    expect(lastHistory.from).toBe('auth:consolidated');
    expect(lastHistory.to).toBe('auth:interviewing');

    // qap_status reanuda la entrevista
    const statusAfterReg = await callTool('qap_status', {});
    expect(statusAfterReg.parsed.siguiente_accion.tipo).toBe('entrevista_vista');
    expect(statusAfterReg.parsed.siguiente_accion.module).toBe('auth');
  });

  // Criterio 7: E2
  it('E2: qap_module_close validaciones, compuertas y transiciones', async () => {
    await advanceToWorking([
      { module: 'auth', path: '/login', priority: 'high' },
      { module: 'pagos', path: '/pay', priority: 'medium' },
    ]);

    // 1. Bloqueo: módulo no registrado
    const rNoReg = await callTool('qap_module_close', { module: 'no_existe', action: 'close', user_confirmed: true });
    expect(rNoReg.parsed.status).toBe('blocked');
    expect(rNoReg.parsed.razon).toContain('no está registrado');

    // 2. Bloqueo: sin user_confirmed
    const rNoConf = await callTool('qap_module_close', { module: 'auth', action: 'close', user_confirmed: false });
    expect(rNoConf.parsed.status).toBe('blocked');
    expect(rNoConf.parsed.razon).toContain('confirmación explícita');

    // 3. Bloqueo: acción close en módulo no consolidated (auth está en planned)
    const rNotConsolidated = await callTool('qap_module_close', { module: 'auth', action: 'close', user_confirmed: true });
    expect(rNotConsolidated.parsed.status).toBe('blocked');
    expect(rNotConsolidated.parsed.razon).toContain('consolidated');

    // Descubrir auth y completarlo
    await callTool('qap_discover', { name: 'auth', path: '/login' });
    const doc = YAML.parse(readFileSync(join(tempDir, '.qa', 'modules', 'auth', 'rules.yaml'), 'utf-8'));
    const inferred = doc.rules.map((r: any) => ({ ...r, status: 'confirmed', source: 'user' }));
    await callTool('qap_rules_set', {
      module: 'auth',
      view: 'default',
      rules: [
        ...inferred,
        { category: 'proposito', description: 'Propósito confirmado', source: 'user', status: 'confirmed' },
      ],
      category_waivers: [
        { category: 'actor', reason: 'Categoría no aplicable para este módulo' },
        { category: 'accion', reason: 'Categoría no aplicable para este módulo' },
        { category: 'error', reason: 'Categoría no aplicable para este módulo' },
        { category: 'dato', reason: 'Categoría no aplicable para este módulo' },
        { category: 'sensibilidad', reason: 'Categoría no aplicable para este módulo' },
      ],
    });
    validateLifecycleState();

    // 4. Cierre exitoso de auth
    const rClose = await callTool('qap_module_close', { module: 'auth', action: 'close', user_confirmed: true });
    validateLifecycleState();
    expect(rClose.parsed.status).toBe('success');
    expect(rClose.parsed.estado).toBe('closed');
    expect(rClose.parsed.resumen).toBeDefined();
    expect(rClose.parsed.siguiente_accion.tool).toBe('qap_discover'); // Siguiente módulo del plan: pagos

    // 5. Bloqueo: módulo ya terminal (closed)
    const rAlreadyClosed = await callTool('qap_module_close', { module: 'auth', action: 'close', user_confirmed: true });
    expect(rAlreadyClosed.parsed.status).toBe('blocked');
    expect(rAlreadyClosed.parsed.razon).toContain('terminal');

    // 6. Waive de pagos sin razón suficiente -> blocked
    const rWaiveShort = await callTool('qap_module_close', { module: 'pagos', action: 'waive', user_confirmed: true, reason: 'corta' });
    expect(rWaiveShort.parsed.status).toBe('blocked');
    expect(rWaiveShort.parsed.razon).toContain('15 caracteres');

    // 7. Waive de pagos con razón válida -> waived
    const rWaive = await callTool('qap_module_close', {
      module: 'pagos',
      action: 'waive',
      user_confirmed: true,
      reason: 'El módulo de pagos queda diferido para un sprint futuro',
    });
    validateLifecycleState();
    expect(rWaive.parsed.status).toBe('success');
    expect(rWaive.parsed.estado).toBe('waived');
    expect(rWaive.parsed.siguiente_accion.tool).toBe('qap_session_close'); // No quedan módulos pendientes
  });

  // Criterio 8: E3
  it('E3: canExitWorking, qap_session_close, reporte de brechas y nueva sesión desde WRAP_UP', async () => {
    await advanceToWorking([
      { module: 'auth', path: '/login', priority: 'high' },
      { module: 'checkout', path: '/cart', priority: 'medium' },
    ]);

    // 1. qap_session_close bloqueada mientras haya módulos sin cerrar
    const rCloseBlocked = await callTool('qap_session_close', {});
    expect(rCloseBlocked.parsed.status).toBe('blocked');
    expect(rCloseBlocked.parsed.faltantes.length).toBeGreaterThan(0);

    // Completar y cerrar auth
    await callTool('qap_discover', { name: 'auth', path: '/login' });
    const doc = YAML.parse(readFileSync(join(tempDir, '.qa', 'modules', 'auth', 'rules.yaml'), 'utf-8'));
    const inferred = doc.rules.map((r: any) => ({ ...r, status: 'confirmed', source: 'user' }));
    await callTool('qap_rules_set', {
      module: 'auth',
      view: 'default',
      rules: [
        ...inferred,
        { category: 'proposito', description: 'Propósito confirmado de auth', source: 'user', status: 'confirmed' },
      ],
      category_waivers: [
        { category: 'actor', reason: 'Categoría no aplicable para este módulo' },
        { category: 'accion', reason: 'Categoría no aplicable para este módulo' },
        { category: 'error', reason: 'Categoría no aplicable para este módulo' },
        { category: 'dato', reason: 'Categoría no aplicable para este módulo' },
        { category: 'sensibilidad', reason: 'Categoría no aplicable para este módulo' },
      ],
    });
    await callTool('qap_module_close', { module: 'auth', action: 'close', user_confirmed: true });

    // Renunciar a checkout
    await callTool('qap_module_close', {
      module: 'checkout',
      action: 'waive',
      user_confirmed: true,
      reason: 'El módulo checkout fue despriorizado por el equipo de producto',
    });
    validateLifecycleState();

    // 2. qap_session_close exitosa
    const rCloseSuccess = await callTool('qap_session_close', {});
    validateLifecycleState();
    expect(rCloseSuccess.parsed.status).toBe('success');
    expect(rCloseSuccess.parsed.fase).toBe('WRAP_UP');
    expect(rCloseSuccess.parsed.reporte_brechas_path).toBeDefined();

    // Verificar reporte .md generado
    const reportMdPath = rCloseSuccess.parsed.reporte_brechas_path;
    expect(existsSync(reportMdPath)).toBe(true);
    const reportContent = readFileSync(reportMdPath, 'utf-8');
    expect(reportContent).toContain('# Reporte de Brechas de Calidad');
    expect(reportContent).toContain('**Objetivo**');
    expect(reportContent).toContain('## Resumen por Módulo');
    expect(reportContent).toContain('## Brechas');
    expect(reportContent).toContain('checkout');
    // Sin afirmación de cobertura por flujo crítico
    expect(reportContent).not.toContain('cobertura por flujo crítico');

    // 3. qap_status en WRAP_UP
    const statusWrapUp = await callTool('qap_status', {});
    expect(statusWrapUp.parsed.fase).toBe('WRAP_UP');
    expect(statusWrapUp.parsed.siguiente_accion.tipo).toBe('decision');
    expect(statusWrapUp.parsed.opciones.length).toBeGreaterThanOrEqual(2);
    expect(statusWrapUp.parsed.siguiente_accion.descripcion).toContain(reportMdPath);

    // 4. qap_discover y qap_rules_set bloqueadas en WRAP_UP
    const rDiscBlocked = await callTool('qap_discover', { name: 'otro', path: '/otro' });
    expect(rDiscBlocked.parsed.status).toBe('blocked');
    expect(rDiscBlocked.parsed.desbloquear_con.tool).toBe('qap_session_plan');

    const rRulesBlocked = await callTool('qap_rules_set', { module: 'auth', rules: [] });
    expect(rRulesBlocked.parsed.status).toBe('blocked');
    expect(rRulesBlocked.parsed.desbloquear_con.tool).toBe('qap_session_plan');

    // 5. Nueva sesión desde WRAP_UP con qap_session_plan
    // Intento con módulo ya cerrado (auth) -> rechazado
    const rPlanClosed = await callTool('qap_session_plan', {
      plan: [{ module: 'auth', path: '/login', priority: 'high' }],
    });
    expect(rPlanClosed.res.isError).toBe(true);
    expect(rPlanClosed.parsed.error).toContain("ya se encuentra cerrado formalmente (closed)");

    // Plan válido con nuevo módulo
    const rNewSession = await callTool('qap_session_plan', {
      plan: [{ module: 'dashboard', path: '/admin', priority: 'high' }],
    });
    validateLifecycleState();
    expect(rNewSession.parsed.status).toBe('success');
    expect(rNewSession.parsed.fase).toBe('WORKING');

    const stateNewSession = JSON.parse(readFileSync(join(tempDir, '.qa', 'project', 'lifecycle.json'), 'utf-8'));
    // Modules mapa conservado
    expect(stateNewSession.modules.auth).toBeDefined();
    expect(stateNewSession.modules.checkout).toBeDefined();
    expect(stateNewSession.modules.dashboard).toBeDefined();

    // Historial con doble transición (WRAP_UP -> SCOPING -> WORKING)
    const history = stateNewSession.history;
    const toScoping = history.find((h: any) => h.to === 'SCOPING');
    const toWorking = history.find((h: any) => h.to === 'WORKING');
    expect(toScoping).toBeDefined();
    expect(toWorking).toBeDefined();
  });

  // Criterio 9: E2E Completo en @qap/mcp con validación de schema en cada mutación
  it('Criterio 9: E2E completo: init -> onboarding -> scoping -> working -> discover A -> rules_set parcial -> status (reanuda) -> rules_set completa -> module_close A -> discover B -> module_close waive B -> session_close -> status WRAP_UP -> session_plan nueva sesión', async () => {
    // 1. init
    const r1 = await callTool('qap_init', {});
    validateLifecycleState();
    expect(r1.parsed.status).toBe('success');
    expect(r1.parsed.fase).toBe('ONBOARDING');

    // 2. onboarding -> scoping (context_set)
    const r2 = await callTool('qap_context_set', {
      targetPath: tempDir,
      framework: 'nextjs',
      app_type: 'ssr',
      objective: 'Validar catálogo y órdenes',
      critical_flows: [{ name: 'catalogo', description: 'Catálogo de productos' }, { name: 'ordenes', description: 'Órdenes' }],
      roles: [{ name: 'comprador', description: 'Comprador' }, { name: 'vendedor', description: 'Vendedor' }],
      source_of_truth: { type: 'prd', declared: true, ref: 'prd-inline' },
    });
    validateLifecycleState();
    expect(r2.parsed.fase).toBe('SCOPING');

    // 3. scoping -> working (session_plan)
    const r3 = await callTool('qap_session_plan', {
      targetPath: tempDir,
      plan: [
        { module: 'moduloA', path: '/catalogo', priority: 'high' },
        { module: 'moduloB', path: '/ordenes', priority: 'medium' },
      ],
      auth: { required: false },
    });
    validateLifecycleState();
    expect(r3.parsed.fase).toBe('WORKING');

    // 4. discover A
    const r4 = await callTool('qap_discover', { name: 'moduloA', path: '/catalogo' });
    validateLifecycleState();
    expect(r4.parsed.status).toBe('success');
    expect(r4.parsed.siguiente_accion.tipo).toBe('entrevista_vista');

    // 5. rules_set parcial
    const r5 = await callTool('qap_rules_set', {
      module: 'moduloA',
      view: 'default',
      rules: [{ category: 'proposito', description: 'Catálogo de productos', source: 'user', status: 'confirmed' }],
    });
    validateLifecycleState();
    expect(r5.parsed.status).toBe('success');
    expect(r5.parsed.modulo_estado).toBe('interviewing');

    // 6. status (reanuda con preguntas)
    const r6 = await callTool('qap_status', {});
    expect(r6.parsed.siguiente_accion.tipo).toBe('entrevista_vista');
    expect(r6.parsed.siguiente_accion.module).toBe('moduloA');
    expect(r6.parsed.siguiente_accion.preguntas.length).toBeGreaterThan(0);

    // 7. rules_set que completa (consolidated + resumen)
    const docA = YAML.parse(readFileSync(join(tempDir, '.qa', 'modules', 'moduloA', 'rules.yaml'), 'utf-8'));
    const inferredA = docA.rules.map((r: any) => ({ ...r, status: 'confirmed', source: 'user' }));
    const r7 = await callTool('qap_rules_set', {
      module: 'moduloA',
      view: 'default',
      rules: inferredA,
      category_waivers: [
        { category: 'actor', reason: 'Categoría no aplicable para este módulo' },
        { category: 'campo', reason: 'Categoría no aplicable para este módulo' },
        { category: 'accion', reason: 'Categoría no aplicable para este módulo' },
        { category: 'error', reason: 'Categoría no aplicable para este módulo' },
        { category: 'dato', reason: 'Categoría no aplicable para este módulo' },
        { category: 'sensibilidad', reason: 'Categoría no aplicable para este módulo' },
      ],
    });
    validateLifecycleState();
    expect(r7.parsed.status).toBe('success');
    expect(r7.parsed.modulo_estado).toBe('consolidated');
    expect(r7.parsed.resumen_cierre).toBeDefined();

    // 8. module_close A
    const r8 = await callTool('qap_module_close', { module: 'moduloA', action: 'close', user_confirmed: true });
    validateLifecycleState();
    expect(r8.parsed.status).toBe('success');
    expect(r8.parsed.estado).toBe('closed');
    expect(r8.parsed.siguiente_accion.tool).toBe('qap_discover'); // Proponer moduloB

    // 9. discover B
    const r9 = await callTool('qap_discover', { name: 'moduloB', path: '/ordenes' });
    validateLifecycleState();
    expect(r9.parsed.status).toBe('success');

    // 10. module_close waive B
    const r10 = await callTool('qap_module_close', {
      module: 'moduloB',
      action: 'waive',
      user_confirmed: true,
      reason: 'El módulo ordenes no cuenta con backend listo en este entorno',
    });
    validateLifecycleState();
    expect(r10.parsed.status).toBe('success');
    expect(r10.parsed.estado).toBe('waived');
    expect(r10.parsed.siguiente_accion.tool).toBe('qap_session_close');

    // 11. session_close -> WRAP_UP
    const r11 = await callTool('qap_session_close', {});
    validateLifecycleState();
    expect(r11.parsed.status).toBe('success');
    expect(r11.parsed.fase).toBe('WRAP_UP');

    // 12. status WRAP_UP
    const r12 = await callTool('qap_status', {});
    expect(r12.parsed.fase).toBe('WRAP_UP');
    expect(r12.parsed.siguiente_accion.tipo).toBe('decision');
    expect(r12.parsed.opciones.length).toBeGreaterThanOrEqual(2);

    // 13. session_plan nueva sesión
    const r13 = await callTool('qap_session_plan', {
      plan: [{ module: 'moduloC', path: '/facturas', priority: 'high' }],
    });
    validateLifecycleState();
    expect(r13.parsed.status).toBe('success');
    expect(r13.parsed.fase).toBe('WORKING');
  });
});
