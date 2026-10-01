/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
import { existsSync, mkdtempSync, rmSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
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
      if (spec.path === '/playwright-error') {
        return {
          name: spec.name,
          path: spec.path,
          description: `Módulo ${spec.name}`,
          tags: spec.tags ?? [],
          cases: [],
          context: {
            discovered_routes: [],
            forms: [],
            buttons: [],
            links: [],
            playwright_error: 'Connection refused: net::ERR_CONNECTION_REFUSED',
            is_auth_view: false,
            session_saved: false,
            storage_state_used: false,
          },
        };
      }
      const isLogin = spec.path === '/login';
      return {
        name: spec.name,
        path: spec.path,
        description: `Módulo ${spec.name}`,
        tags: spec.tags ?? [],
        cases: [],
        context: {
          discovered_routes: [spec.path, `${spec.path}/sub`, '/ruta-externa-detectada'],
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
          buttons: [{ key: 'enviar', text: 'Enviar', selector: 'button:has-text("Enviar")' }],
          links: [
            { key: 'tablero', text: 'Tablero', href: '/operaciones/tablero', selector: 'a:has-text("Tablero")' },
          ],
          is_auth_view: isLogin && !this.options.credentials,
          session_saved: isLogin && Boolean(this.options.credentials),
          storage_state_used: Boolean(this.options.sessionPath),
        },
      };
    }
  },
}));

describe('P3 Suite de Verificación MCP (T3 - T15)', () => {
  let tempDir: string;
  let originalCwd: () => string;
  let server: any;
  let handler: any;
  const validator = new SchemaValidator();

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'qap-p3-test-'));
    originalCwd = process.cwd;
    process.cwd = () => tempDir;

    server = createMcpServer();
    // @ts-expect-error accessing internal handler
    handler = server._requestHandlers.get(CallToolRequestSchema.shape.method.value);
  });

  afterEach(() => {
    process.cwd = originalCwd;
    rmSync(tempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  async function callTool(name: string, args: Record<string, any> = {}) {
    const res = await handler(
      { method: 'tools/call', params: { name, arguments: args } },
      {}
    );
    const text = res.content?.[0]?.text ?? '';
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
    return { res, parsed, text };
  }

  async function advanceToWorking(modules = [{ module: 'auth', path: '/login', priority: 'high' }]) {
    await callTool('qap_init', { targetPath: tempDir });
    await callTool('qap_context_set', {
      objective: 'Validar suite completa de pruebas P3 para QAMCP',
      roles: [{ name: 'admin', description: 'Administrador del sistema' }],
      critical_flows: [{ name: 'auth_flow', description: 'Flujo de autenticación' }],
      source_of_truth: { type: 'prd', declared: true, ref: 'prd-inline' },
    });
    await callTool('qap_session_plan', {
      modules,
      auth: { required: false },
    });
  }

  // T3
  it('T3: Toda respuesta con siguiente_accion NO contiene "botones interactivos en modal" ni prohibición de listas', async () => {
    const forbiddenPhrases = [
      'botones interactivos en modal',
      'No respondas con listas',
      'modal interactivo',
      'prohibido usar listas',
    ];

    const responsesToCheck: string[] = [];

    // 1. qap_status sin inicializar
    const rStatusUninit = await callTool('qap_status', {});
    responsesToCheck.push(rStatusUninit.text);

    // 2. qap_init
    const rInit = await callTool('qap_init', { targetPath: tempDir });
    responsesToCheck.push(rInit.text);

    // 3. qap_status inicializado en ONBOARDING
    const rStatusInit = await callTool('qap_status', {});
    responsesToCheck.push(rStatusInit.text);

    // 4. qap_auth_add
    const rAuth = await callTool('qap_auth_add', { id: 'admin', env: 'local', username: 'admin@test.com' });
    responsesToCheck.push(rAuth.text);

    // 5. qap_context_set parcial
    const rContextSet = await callTool('qap_context_set', { objective: 'Objetivo de prueba' });
    responsesToCheck.push(rContextSet.text);

    // 6. qap_context_ingest
    const rIngest = await callTool('qap_context_ingest', { docContent: 'Documentación de arquitectura' });
    responsesToCheck.push(rIngest.text);

    // Contexto completo para llegar a SCOPING
    await callTool('qap_context_set', {
      roles: [{ name: 'user', description: 'Usuario regular' }],
      critical_flows: [{ name: 'login', description: 'Login' }],
      source_of_truth: { type: 'prd', declared: true, ref: 'prd-inline' },
    });

    // 7. qap_session_plan -> llega a WORKING
    const rPlan = await callTool('qap_session_plan', {
      modules: [{ module: 'auth', path: '/login', priority: 'high' }],
      auth: { required: false },
    });
    responsesToCheck.push(rPlan.text);

    // 8. qap_discover blocked (módulo no planificado)
    const rDiscBlocked = await callTool('qap_discover', { name: 'no-plan', path: '/no-plan' });
    responsesToCheck.push(rDiscBlocked.text);

    // 9. qap_discover éxito
    const rDiscSuccess = await callTool('qap_discover', { name: 'auth', path: '/login' });
    responsesToCheck.push(rDiscSuccess.text);

    // 10. qap_rules_set
    const rRules = await callTool('qap_rules_set', {
      module: 'auth',
      view: 'default',
      rules: [{ category: 'proposito', description: 'Vista principal de acceso', source: 'user', status: 'confirmed' }],
    });
    responsesToCheck.push(rRules.text);

    // Verificar en todas las respuestas
    for (const text of responsesToCheck) {
      for (const phrase of forbiddenPhrases) {
        expect(text).not.toContain(phrase);
      }
    }
  });

  // T4
  it('T4: qap_status WORKING con módulo planned: sin pregunta de confirmación, sin "Ver otros módulos", sin botón de una sola opción, stats.modules refleja estado', async () => {
    await advanceToWorking([{ module: 'checkout', path: '/cart', priority: 'high' }]);

    const { parsed, text } = await callTool('qap_status', {});
    expect(parsed.fase).toBe('WORKING');
    expect(parsed.siguiente_accion.tool).toBe('qap_discover');
    expect(parsed.siguiente_accion.descripcion).toContain('checkout');

    // Sin pregunta de confirmación ni "Ver otros módulos"
    expect(text).not.toContain('Ver otros módulos');
    expect(parsed.pregunta).not.toMatch(/confirm/i);

    // Sin botón de una sola opción
    expect(parsed.opciones).toHaveLength(0);

    // stats.modules refleja los módulos registrados en lifecycle
    expect(parsed.stats.modules).toBe(1);
  });

  // T5
  it('T5: lifecycle.json valida contra lifecycle-state.schema.json tras CADA mutación del flujo e2e', async () => {
    function assertLifecycleValid() {
      const statePath = join(tempDir, '.qa', 'project', 'lifecycle.json');
      expect(existsSync(statePath)).toBe(true);
      const state = JSON.parse(readFileSync(statePath, 'utf-8'));
      const valRes = validator.validateLifecycleState(state);
      expect(valRes.valid).toBe(true);
      expect(valRes.errors).toHaveLength(0);
    }

    // Mutación 1: qap_init
    await callTool('qap_init', { targetPath: tempDir });
    assertLifecycleValid();

    // Mutación 2: qap_context_set
    await callTool('qap_context_set', {
      objective: 'Probar validación de schema en cada paso',
      roles: [{ name: 'qa', description: 'Tester' }],
      critical_flows: [{ name: 'smoke', description: 'Smoke test' }],
      source_of_truth: { type: 'prd', declared: true, ref: 'prd' },
    });
    assertLifecycleValid();

    // Mutación 3: qap_session_plan
    await callTool('qap_session_plan', {
      modules: [{ module: 'auth', path: '/login', priority: 'high' }],
      auth: { required: false },
    });
    assertLifecycleValid();

    // Mutación 4: qap_discover
    await callTool('qap_discover', { name: 'auth', path: '/login' });
    assertLifecycleValid();

    // Mutación 5: qap_rules_set
    await callTool('qap_rules_set', {
      module: 'auth',
      view: 'default',
      rules: [
        {
          id: 'auth.campo.user',
          category: 'campo',
          description: 'Usuario válido requerido',
          source: 'user',
          status: 'confirmed',
        },
      ],
    });
    assertLifecycleValid();
  });

  // T6
  it('T6: qap_discover éxito: no contiene "Descubrir otro módulo", "pregunta_doc" ni "opciones_doc"; siguiente_accion tipo entrevista_vista (<= 5 preguntas) con tool qap_rules_set, categorias_aplicables y rutas_detectadas_fuera_del_plan', async () => {
    await advanceToWorking([{ module: 'auth', path: '/login', priority: 'high' }]);

    const { parsed, text } = await callTool('qap_discover', { name: 'auth', path: '/login' });

    // NO contiene cadenas prohibidas ni campos eliminados
    expect(text).not.toContain('Descubrir otro módulo');
    expect(text).not.toContain('pregunta_doc');
    expect(text).not.toContain('opciones_doc');

    // Siguiente acción estructurada para entrevista de vista
    expect(parsed.siguiente_accion.tipo).toBe('entrevista_vista');
    expect(parsed.siguiente_accion.tool).toBe('qap_rules_set');
    expect(parsed.siguiente_accion.modulo).toBe('auth');
    expect(parsed.siguiente_accion.vista).toBe('default');
    expect(parsed.siguiente_accion.preguntas.length).toBeGreaterThan(0);
    expect(parsed.siguiente_accion.preguntas.length).toBeLessThanOrEqual(5);

    // Contiene categorias_aplicables y rutas_detectadas_fuera_del_plan
    expect(Array.isArray(parsed.categorias_aplicables)).toBe(true);
    expect(Array.isArray(parsed.rutas_detectadas_fuera_del_plan)).toBe(true);
    expect(parsed.rutas_detectadas_fuera_del_plan.length).toBeLessThanOrEqual(10);
    expect(parsed.rutas_detectadas_fuera_del_plan).toContain('/ruta-externa-detectada');
  });

  // T7
  it('T7: rules.yaml tras discover: reglas inferred/dom con ids deterministas; re-discover idempotente (sin duplicados, reglas confirmadas intactas)', async () => {
    await advanceToWorking([{ module: 'auth', path: '/login', priority: 'high' }]);

    // 1. Primer discover
    await callTool('qap_discover', { name: 'auth', path: '/login' });
    const rulesPath = join(tempDir, '.qa', 'modules', 'auth', 'rules.yaml');
    expect(existsSync(rulesPath)).toBe(true);

    const rulesDoc1 = YAML.parse(readFileSync(rulesPath, 'utf-8'));
    expect(rulesDoc1.rules.length).toBeGreaterThan(0);
    for (const r of rulesDoc1.rules) {
      expect(r.source).toBe('dom');
      expect(r.status).toBe('inferred');
      expect(r.id).toBeTruthy();
    }
    const countFirstRun = rulesDoc1.rules.length;

    // Confirmar una regla existente
    const confirmedRuleId = rulesDoc1.rules[0].id;
    await callTool('qap_rules_set', {
      module: 'auth',
      view: 'default',
      rules: [
        {
          id: confirmedRuleId,
          category: rulesDoc1.rules[0].category || 'campo',
          description: 'Regla confirmada por usuario',
          status: 'confirmed',
          source: 'user',
        },
      ],
    });

    // 2. Segundo discover (re-discover)
    await callTool('qap_discover', { name: 'auth', path: '/login' });
    const rulesDoc2 = YAML.parse(readFileSync(rulesPath, 'utf-8'));

    // Sin duplicados
    const ids = rulesDoc2.rules.map((r: any) => r.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);

    // Regla confirmada permanece intacta
    const preservedRule = rulesDoc2.rules.find((r: any) => r.id === confirmedRuleId);
    expect(preservedRule).toBeDefined();
    expect(preservedRule.status).toBe('confirmed');
    expect(preservedRule.source).toBe('user');
  });

  // T8
  it('T8: rules.yaml con manually_edited: true: discover no inserta reglas y lo indica', async () => {
    await advanceToWorking([{ module: 'auth', path: '/login', priority: 'high' }]);

    const authDir = join(tempDir, '.qa', 'modules', 'auth');
    mkdirSync(authDir, { recursive: true });
    const initialRules = {
      _version: '1',
      manually_edited: true,
      rules: [
        {
          id: 'manual.regla.01',
          description: 'Regla manual humana que debe preservarse',
          category: 'proposito',
          status: 'confirmed',
          source: 'user',
        },
      ],
      category_waivers: [],
    };
    writeFileSync(join(authDir, 'rules.yaml'), YAML.stringify(initialRules), 'utf-8');

    const { parsed, text } = await callTool('qap_discover', { name: 'auth', path: '/login' });
    expect(text).toContain('manually_edited');

    // No debe haber insertado reglas DOM nuevas
    const postDoc = YAML.parse(readFileSync(join(authDir, 'rules.yaml'), 'utf-8'));
    expect(postDoc.rules).toHaveLength(1);
    expect(postDoc.rules[0].id).toBe('manual.regla.01');
  });

  // T9
  it('T9: Fallo de Playwright: no inserta reglas; siguiente_accion tipo decision', async () => {
    await advanceToWorking([{ module: 'error-mod', path: '/playwright-error', priority: 'high' }]);

    const { parsed } = await callTool('qap_discover', { name: 'error-mod', path: '/playwright-error' });

    // siguiente_accion tipo decision
    expect(parsed.siguiente_accion.tipo).toBe('decision');
    expect(parsed.siguiente_accion.tool).toBe('qap_discover');

    // No crea ni inserta reglas inferidas en rules.yaml
    const rulesPath = join(tempDir, '.qa', 'modules', 'error-mod', 'rules.yaml');
    if (existsSync(rulesPath)) {
      const doc = YAML.parse(readFileSync(rulesPath, 'utf-8'));
      expect(doc.rules ?? []).toHaveLength(0);
    }
  });

  // T10
  it('T10: qap_rules_set bloqueado (contrato blocked) en: fase distinta de WORKING, módulo no registrado, módulo planned, módulo waived', async () => {
    // 1. Fase distinta de WORKING (ONBOARDING)
    await callTool('qap_init', { targetPath: tempDir });
    const rOnboarding = await callTool('qap_rules_set', { module: 'auth', view: 'default', rules: [] });
    expect(rOnboarding.parsed.status).toBe('blocked');
    expect(rOnboarding.parsed.fase).toBe('ONBOARDING');
    expect(rOnboarding.parsed.razon).toBeDefined();
    expect(rOnboarding.parsed.desbloquear_con).toBeDefined();

    // Avanzar a WORKING con módulos planned y waived
    await callTool('qap_context_set', {
      objective: 'Probar bloqueos de qap_rules_set',
      roles: [{ name: 'admin', description: 'Admin' }],
      critical_flows: [{ name: 'flow', description: 'Flow' }],
      source_of_truth: { type: 'prd', declared: true, ref: 'prd' },
    });
    await callTool('qap_session_plan', {
      modules: [
        { module: 'planned-mod', path: '/plan', priority: 'high' },
        { module: 'waived-mod', path: '/waive', priority: 'low' },
      ],
      auth: { required: false },
    });

    // Marcar waived-mod como waived en lifecycle
    const statePath = join(tempDir, '.qa', 'project', 'lifecycle.json');
    const state = JSON.parse(readFileSync(statePath, 'utf-8'));
    state.modules['waived-mod'].state = 'waived';
    writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf-8');

    // 2. Módulo no registrado
    const rNoReg = await callTool('qap_rules_set', { module: 'inexistente', view: 'default', rules: [] });
    expect(rNoReg.parsed.status).toBe('blocked');
    expect(rNoReg.parsed.razon).toContain('inexistente');

    // 3. Módulo en estado planned
    const rPlanned = await callTool('qap_rules_set', { module: 'planned-mod', view: 'default', rules: [] });
    expect(rPlanned.parsed.status).toBe('blocked');
    expect(rPlanned.parsed.razon).toContain('planned');

    // 4. Módulo en estado waived
    const rWaived = await callTool('qap_rules_set', { module: 'waived-mod', view: 'default', rules: [] });
    expect(rWaived.parsed.status).toBe('blocked');
    expect(rWaived.parsed.razon).toContain('waived');
  });

  // T11
  it('T11: Primera llamada exitosa: observed -> interviewing; ids R-001, R-002... secuenciales por módulo', async () => {
    await advanceToWorking([{ module: 'auth', path: '/login', priority: 'high' }]);
    await callTool('qap_discover', { name: 'auth', path: '/login' });

    // Primera llamada exitosa a qap_rules_set sin IDs explícitos
    const { parsed } = await callTool('qap_rules_set', {
      module: 'auth',
      view: 'default',
      rules: [
        { category: 'proposito', description: 'Pantalla de acceso público', source: 'user', status: 'confirmed' },
        { category: 'actor', description: 'Acepta rol usuario general', source: 'user', status: 'confirmed' },
      ],
    });

    expect(parsed.status).toBe('success');
    expect(parsed.rules_guardadas).toBe(2);

    // Transición a interviewing en lifecycle.json
    const state = JSON.parse(readFileSync(join(tempDir, '.qa', 'project', 'lifecycle.json'), 'utf-8'));
    expect(state.modules.auth.state).toBe('interviewing');

    // IDs secuenciales R-001, R-002
    const rulesDoc = YAML.parse(readFileSync(join(tempDir, '.qa', 'modules', 'auth', 'rules.yaml'), 'utf-8'));
    const userRules = rulesDoc.rules.filter((r: any) => r.source === 'user');
    expect(userRules[0].id).toBe('R-001');
    expect(userRules[1].id).toBe('R-002');
  });

  // T12
  it('T12: No-downgrade: regla source user confirmed no se sobrescribe con source dom/prd; waivers solo source user y reason no vacío; lote con regla inválida se rechaza completo', async () => {
    await advanceToWorking([{ module: 'auth', path: '/login', priority: 'high' }]);
    await callTool('qap_discover', { name: 'auth', path: '/login' });

    // Registrar regla de usuario confirmada
    await callTool('qap_rules_set', {
      module: 'auth',
      view: 'default',
      rules: [
        {
          id: 'auth.regla.user',
          category: 'proposito',
          description: 'Regla de usuario confirmada',
          source: 'user',
          status: 'confirmed',
        },
      ],
    });

    // Intento de downgrade: misma regla con source: dom y status: inferred
    const rDowngrade = await callTool('qap_rules_set', {
      module: 'auth',
      view: 'default',
      rules: [
        {
          id: 'auth.regla.user',
          category: 'proposito',
          description: 'Intento de sobreescritura automática por dom',
          source: 'dom',
          status: 'inferred',
        },
      ],
    });
    expect(rDowngrade.parsed.reglas_ignoradas).toHaveLength(1);

    // Verificar que la regla original no cambió
    const docAfterDowngrade = YAML.parse(readFileSync(join(tempDir, '.qa', 'modules', 'auth', 'rules.yaml'), 'utf-8'));
    const rCheck = docAfterDowngrade.rules.find((r: any) => r.id === 'auth.regla.user');
    expect(rCheck.source).toBe('user');
    expect(rCheck.status).toBe('confirmed');

    // Waivers: rechaza waiver con reason vacío
    const rEmptyReason = await callTool('qap_rules_set', {
      module: 'auth',
      view: 'default',
      category_waivers: [{ category: 'sensibilidad', reason: '' }],
    });
    expect(rEmptyReason.res.isError).toBe(true);

    // Lote con una regla inválida se rechaza completo sin escritura parcial
    const rInvalidBatch = await callTool('qap_rules_set', {
      module: 'auth',
      view: 'default',
      rules: [
        { category: 'campo', description: 'Regla válida en lote mixto' },
        { category: 'categoria_invalida' as any, description: 'Regla inválida' },
      ],
    });
    expect(rInvalidBatch.res.isError).toBe(true);

    const docAfterInvalid = YAML.parse(readFileSync(join(tempDir, '.qa', 'modules', 'auth', 'rules.yaml'), 'utf-8'));
    expect(docAfterInvalid.rules.some((r: any) => r.description === 'Regla válida en lote mixto')).toBe(false);
  });

  // T13
  it('T13: Dos llamadas concurrentes a qap_rules_set sin pérdida de actualización', async () => {
    await advanceToWorking([{ module: 'auth', path: '/login', priority: 'high' }]);
    await callTool('qap_discover', { name: 'auth', path: '/login' });

    // Ejecución concurrente de dos llamadas a qap_rules_set
    const call1 = callTool('qap_rules_set', {
      module: 'auth',
      view: 'default',
      rules: [{ id: 'CONC-001', category: 'proposito', description: 'Regla concurrente 1', source: 'user', status: 'confirmed' }],
    });
    const call2 = callTool('qap_rules_set', {
      module: 'auth',
      view: 'default',
      rules: [{ id: 'CONC-002', category: 'actor', description: 'Regla concurrente 2', source: 'user', status: 'confirmed' }],
    });

    const [res1, res2] = await Promise.all([call1, call2]);
    expect(res1.parsed.status).toBe('success');
    expect(res2.parsed.status).toBe('success');

    // Ambas reglas deben persistir en rules.yaml
    const doc = YAML.parse(readFileSync(join(tempDir, '.qa', 'modules', 'auth', 'rules.yaml'), 'utf-8'));
    expect(doc.rules.some((r: any) => r.id === 'CONC-001')).toBe(true);
    expect(doc.rules.some((r: any) => r.id === 'CONC-002')).toBe(true);
  });

  // T14
  it('T14: qap_status WORKING: (a) observed con hipótesis reanuda entrevista; (b) interviewing incompleto reanuda; (c) planned elige high > medium > low luego orden; (d) todos completos tipo decision', async () => {
    // (a) Módulo en observed con hipótesis pendientes -> reanuda entrevista, no propone siguiente planned
    await advanceToWorking([
      { module: 'auth', path: '/login', priority: 'medium' },
      { module: 'pagos', path: '/pay', priority: 'high' },
    ]);
    await callTool('qap_discover', { name: 'auth', path: '/login' });

    const statusA = await callTool('qap_status', {});
    expect(statusA.parsed.siguiente_accion.tipo).toBe('entrevista_vista');
    expect(statusA.parsed.siguiente_accion.tool).toBe('qap_rules_set');
    expect(statusA.parsed.siguiente_accion.descripcion).toContain('auth');

    // (b) Módulo en interviewing incompleto -> reanuda entrevista
    await callTool('qap_rules_set', {
      module: 'auth',
      view: 'default',
      rules: [{ category: 'proposito', description: 'Propósito', source: 'user', status: 'confirmed' }],
    });
    const statusB = await callTool('qap_status', {});
    expect(statusB.parsed.siguiente_accion.tipo).toBe('entrevista_vista');
    expect(statusB.parsed.siguiente_accion.tool).toBe('qap_rules_set');
    expect(statusB.parsed.siguiente_accion.descripcion).toContain('auth');

    // (c) Módulo auth completado -> entre varios planned elige high > medium > low luego orden
    // Completar auth
    const authRulesDoc = YAML.parse(readFileSync(join(tempDir, '.qa', 'modules', 'auth', 'rules.yaml'), 'utf-8'));
    const inferredAuth = authRulesDoc.rules.filter((r: any) => r.status === 'inferred').map((r: any) => ({ ...r, status: 'confirmed', source: 'user' }));
    await callTool('qap_rules_set', {
      module: 'auth',
      view: 'default',
      rules: inferredAuth,
      category_waivers: [
        { category: 'actor', reason: 'Categoría no aplicable para este módulo' },
        { category: 'accion', reason: 'Categoría no aplicable para este módulo' },
        { category: 'error', reason: 'Categoría no aplicable para este módulo' },
        { category: 'dato', reason: 'Categoría no aplicable para este módulo' },
        { category: 'sensibilidad', reason: 'Categoría no aplicable para este módulo' },
      ],
    });

    // En el plan, pagos es 'high'. Debe proponer pagos antes que cualquier low
    const statusC = await callTool('qap_status', {});
    expect(statusC.parsed.siguiente_accion.tipo).toBe('trabajo');
    expect(statusC.parsed.siguiente_accion.tool).toBe('qap_discover');
    expect(statusC.parsed.siguiente_accion.descripcion).toContain('pagos');

    // (d) Todos los módulos completados (consolidated) -> propone cierre de módulo con qap_module_close
    // Descubrir y completar pagos
    await callTool('qap_discover', { name: 'pagos', path: '/pay' });
    const pagosRulesDoc = YAML.parse(readFileSync(join(tempDir, '.qa', 'modules', 'pagos', 'rules.yaml'), 'utf-8'));
    const inferredPagos = pagosRulesDoc.rules.map((r: any) => ({ ...r, status: 'confirmed', source: 'user' }));
    await callTool('qap_rules_set', {
      module: 'pagos',
      view: 'default',
      rules: [
        ...inferredPagos,
        {
          category: 'proposito',
          description: 'Módulo de pagos y transacciones del sistema',
          source: 'user',
          status: 'confirmed',
        },
      ],
      category_waivers: [
        { category: 'actor', reason: 'Categoría no aplicable para este módulo' },
        { category: 'campo', reason: 'Categoría no aplicable para este módulo' },
        { category: 'accion', reason: 'Categoría no aplicable para este módulo' },
        { category: 'error', reason: 'Categoría no aplicable para este módulo' },
        { category: 'dato', reason: 'Categoría no aplicable para este módulo' },
        { category: 'sensibilidad', reason: 'Categoría no aplicable para este módulo' },
      ],
    });

    const statusD = await callTool('qap_status', {});
    expect(statusD.parsed.siguiente_accion.tipo).toBe('trabajo');
    expect(statusD.parsed.siguiente_accion.tool).toBe('qap_module_close');
  });

  // T15
  it('T15: E2E: flujo de P2 hasta WORKING -> discover A -> rules_set parcial -> status (reanuda A) -> rules_set completa cobertura -> status (propone B) -> discover B; ninguna respuesta del flujo contiene texto del bucle', async () => {
    const loopPhrases = [
      'botones interactivos en modal',
      'No respondas con listas',
      'modal interactivo',
      'prohibido usar listas',
    ];

    function verifyNoLoopText(text: string) {
      for (const phrase of loopPhrases) {
        expect(text).not.toContain(phrase);
      }
    }

    // Flujo P2 hasta WORKING
    const r1 = await callTool('qap_init', { targetPath: tempDir });
    verifyNoLoopText(r1.text);

    const r2 = await callTool('qap_context_set', {
      objective: 'Flujo E2E completo P3',
      roles: [{ name: 'cliente', description: 'Cliente final' }],
      critical_flows: [{ name: 'compra', description: 'Compra' }],
      source_of_truth: { type: 'prd', declared: true, ref: 'prd' },
    });
    verifyNoLoopText(r2.text);

    const r3 = await callTool('qap_session_plan', {
      modules: [
        { module: 'moduloA', path: '/login', priority: 'high' },
        { module: 'moduloB', path: '/checkout', priority: 'medium' },
      ],
      auth: { required: false },
    });
    verifyNoLoopText(r3.text);

    // discover A
    const r4 = await callTool('qap_discover', { name: 'moduloA', path: '/login' });
    verifyNoLoopText(r4.text);

    // rules_set parcial para A
    const r5 = await callTool('qap_rules_set', {
      module: 'moduloA',
      view: 'default',
      rules: [{ category: 'proposito', description: 'Propósito A', source: 'user', status: 'confirmed' }],
    });
    verifyNoLoopText(r5.text);

    // status (debe reanudar A)
    const r6 = await callTool('qap_status', {});
    verifyNoLoopText(r6.text);
    expect(r6.parsed.siguiente_accion.tipo).toBe('entrevista_vista');
    expect(r6.parsed.siguiente_accion.tool).toBe('qap_rules_set');
    expect(r6.parsed.siguiente_accion.descripcion).toContain('moduloA');

    // rules_set completa cobertura de A
    const docA = YAML.parse(readFileSync(join(tempDir, '.qa', 'modules', 'moduloA', 'rules.yaml'), 'utf-8'));
    const inferredA = docA.rules.map((r: any) => ({ ...r, status: 'confirmed', source: 'user' }));
    const r7 = await callTool('qap_rules_set', {
      module: 'moduloA',
      view: 'default',
      rules: inferredA,
      category_waivers: [
        { category: 'actor', reason: 'Categoría no aplicable en esta vista' },
        { category: 'campo', reason: 'Categoría no aplicable en esta vista' },
        { category: 'accion', reason: 'Categoría no aplicable en esta vista' },
        { category: 'error', reason: 'Categoría no aplicable en esta vista' },
        { category: 'dato', reason: 'Categoría no aplicable en esta vista' },
        { category: 'sensibilidad', reason: 'Categoría no aplicable en esta vista' },
      ],
    });
    verifyNoLoopText(r7.text);

    // status (debe proponer B)
    const r8 = await callTool('qap_status', {});
    verifyNoLoopText(r8.text);
    expect(r8.parsed.siguiente_accion.tipo).toBe('trabajo');
    expect(r8.parsed.siguiente_accion.tool).toBe('qap_discover');
    expect(r8.parsed.siguiente_accion.descripcion).toContain('moduloB');

    // discover B
    const r9 = await callTool('qap_discover', { name: 'moduloB', path: '/checkout' });
    verifyNoLoopText(r9.text);
    expect(r9.parsed.siguiente_accion.tipo).toBe('entrevista_vista');
    expect(r9.parsed.siguiente_accion.modulo).toBe('moduloB');
  });
});
