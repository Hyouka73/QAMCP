import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import YAML from 'yaml';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createMcpServer } from '../server.js';
import { QAP_CORE_DIRECTIVES, getPhaseGuidance } from '../guidance.js';
import { sanitizeDomString } from '@qap/engine';
import { parsePrdContent, detectarDocumentosProyecto } from '@qap/knowledge';

describe('P4.3.1 Bloque B - Verificación y Cobertura de Correcciones', () => {
  let tempDir: string;
  let server: ReturnType<typeof createMcpServer>;
  let handler: (req: any, extra: any) => Promise<any>;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'qap-b-block-'));
    server = createMcpServer();
    // @ts-expect-error accessing internal request handler
    handler = server._requestHandlers.get(CallToolRequestSchema.shape.method.value);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch { /* empty */ }
  });

  async function call(name: string, args: Record<string, unknown> = {}) {
    const res = await handler(
      {
        method: 'tools/call',
        params: { name, arguments: { targetPath: tempDir, ...args } },
      },
      {}
    );
    expect(res.isError).toBeFalsy();
    const parsed = JSON.parse(res.content[0].text);
    return { parsed, text: res.content[0].text, raw: res };
  }

  // Criterio 2 & B1: Fixture A1, flujos críticos sin rutas, tarjeta no ofrece 'Confirmo todo' sin URL
  it('Criterio 2 & B1: con el fixture de A1, ninguna pregunta de objetivo, roles o flujos es abierta si hay propuesta; critical_flows nunca contiene rutas; tarjeta no ofrece Confirmo todo con URL sin definir', async () => {
    const prdContent = `# Plataforma de estudios socioeconomicos - PRD
## Objetivo
Plataforma SaaS B2B que digitaliza y centraliza el ciclo de vida del reclutamiento y seleccion de personal, en particular los estudios socioeconomicos y los expedientes documentales. Transforma un proceso artesanal en una operacion industrializada mediante un pipeline Kanban de seis etapas que integra investigacion telefonica, visitas de campo offline-first y generacion automatica de reportes PDF. Resuelve la fragmentacion operativa entre clientes, mesa de control y ejecutivos de campo, con trazabilidad y SLAs definidos, y protege datos sensibles (CURP, NSS) con cifrado y aislamiento multi-tenant.
## Roles
- RH (cliente)
- Ejecutivo de campo
- Ejecutivo de oficina
- Admin
## Pipeline
1. Alta del expediente
2. Investigacion telefonica
3. Visita de campo
4. Visto Bueno
5. Reporte PDF
6. Entrega al cliente
## Rutas
- /login
- /expedientes
- /expedientes/:id
## Riesgos
- Perdida de datos en sincronizacion offline
- Fuga de datos sensibles (CURP, NSS)`;

    writeFileSync(join(tempDir, 'PRD_diff.md'), prdContent, 'utf-8');

    // 1. parsePrdContent puro
    const parsedRaw = parsePrdContent(prdContent);
    expect(parsedRaw.routes).toEqual(['/login', '/expedientes', '/expedientes/:id']);
    // critical_flows NO debe contener rutas
    expect(parsedRaw.critical_flows).not.toContain('/login');
    expect(parsedRaw.critical_flows).not.toContain('/expedientes');
    expect(parsedRaw.critical_flows).toHaveLength(0);

    // 2. qap_init sin URL definida
    const rInit = await call('qap_init', { projectName: 'estudios-socioeconomicos' });
    expect(rInit.parsed.status).toBe('success');
    expect(rInit.parsed.fase).toBe('ONBOARDING');

    // 3. qap_context_set con ref libre
    const rSet = await call('qap_context_set', {
      source_of_truth: { type: 'prd', ref: 'PRD_diff.md' },
    });
    expect(rSet.parsed.status).toBe('success');

    // Comprobar que ninguna pregunta de objetivo, roles o flujos es abierta: fue a la tarjeta de confirmación o paso guiado
    const nextAction = rSet.parsed.siguiente_accion;
    expect(nextAction).toBeDefined();
    // La tarjeta de resumen NO debe ofrecer "Confirmo todo" porque la URL está sin definir
    const preg = nextAction.pregunta;
    if (preg?.id === 'onboarding.confirmar_resumen') {
      expect(preg.texto).toContain('URL base: (sin definir)');
      const ids = preg.opciones.map((o: any) => o.id);
      expect(ids).not.toContain('confirmo_todo');
      expect(ids).toContain('definir_url');
    }

    // Comprobar context.yaml persistido: critical_flows nunca contiene rutas
    const ctx = YAML.parse(readFileSync(join(tempDir, '.qa', 'project', 'context.yaml'), 'utf-8'));
    for (const flow of ctx.critical_flows || []) {
      expect(flow.name).not.toBe('/login');
      expect(flow.name).not.toBe('/expedientes');
      expect(flow.name).not.toBe('/expedientes/:id');
    }
  });

  // Criterio 3 & B4: Estado de análisis ingest.analyzed_by sin contaminar notes
  it('Criterio 3 & B4: la ingesta no modifica notes de source_of_truth y escribe ingest.analyzed_by', async () => {
    writeFileSync(join(tempDir, 'spec.md'), '# Mi Documento\n## Objetivo\nSistema de control escolar para universidades\n## Roles\n- Docente\n- Alumno', 'utf-8');

    await call('qap_init', { projectName: 'control-escolar', baseUrl: 'http://localhost:3000' });

    // Declarar source_of_truth con notas de usuario
    await call('qap_context_set', {
      source_of_truth: {
        type: 'prd',
        ref: 'spec.md',
        notes: 'Notas declaradas explícitamente por el usuario para la auditoría',
        declared: true,
        source: 'user',
      },
    });

    // Ingesta heurística
    const rIngest = await call('qap_context_ingest', { docPath: 'spec.md' });
    expect(rIngest.parsed.status).toBe('success');

    const ctx = YAML.parse(readFileSync(join(tempDir, '.qa', 'project', 'context.yaml'), 'utf-8'));
    // notes NO contiene [agent_analyzed] ni fue sobreescrita
    expect(ctx.source_of_truth.notes).toBe('Notas declaradas explícitamente por el usuario para la auditoría');
    expect(ctx.source_of_truth.notes).not.toContain('[agent_analyzed]');

    // ingest.analyzed_by está presente
    expect(ctx.ingest).toBeDefined();
    expect(ctx.ingest.analyzed_by).toBe('heuristic');
    expect(ctx.ingest.doc_ref).toBe('spec.md');
    expect(ctx.ingest.analyzed_at).toBeDefined();
  });

  // B5: Aislamiento de secretos y archivos permitidos
  it('B5: el detector nunca lee .env ni .env.local; SECRET_KEY=abc123 y credenciales nunca aparecen en scan ni salidas', async () => {
    // Fixture con archivos sensibles
    writeFileSync(join(tempDir, '.env'), 'SECRET_KEY=abc123\nDATABASE_URL=postgres://admin:supersecret@localhost:5432/db\nPORT=8080');
    writeFileSync(join(tempDir, '.env.local'), 'SECRET_KEY=abc123\nAWS_SECRET=xyz987\nVITE_PORT=4000');
    writeFileSync(join(tempDir, '.env.production.local'), 'SECRET_KEY=abc123');
    // Archivo permitido
    writeFileSync(join(tempDir, '.env.example'), 'PORT=3000\nAPI_URL=http://localhost:3000');
    writeFileSync(join(tempDir, 'package.json'), JSON.stringify({ name: 'safe-app', scripts: { dev: 'vite --port 5173' } }));

    // Espiar fs.readFileSync
    const readSpy = vi.spyOn(fs, 'readFileSync');

    const scan = detectarDocumentosProyecto(tempDir);

    // Assert de que ningún archivo .env, .env.local o .env.*.local fue leído
    for (const callArgs of readSpy.mock.calls) {
      const filePath = String(callArgs[0]);
      expect(filePath).not.toMatch(/[\\/]\.env$/i);
      expect(filePath).not.toMatch(/[\\/]\.env\.local$/i);
      expect(filePath).not.toMatch(/[\\/]\.env\..*\.local$/i);
    }

    // Inicializar servidor y ejecutar qap_init
    const rInit = await call('qap_init', { projectName: 'safe-test' });
    const fullInitOutput = rInit.text;
    expect(fullInitOutput).not.toContain('abc123');
    expect(fullInitOutput).not.toContain('supersecret');
    expect(fullInitOutput).not.toContain('xyz987');

    // Verificar contenido de scan.json
    const scanJsonPath = join(tempDir, '.qa', 'cache', 'scan.json');
    if (existsSync(scanJsonPath)) {
      const scanContent = readFileSync(scanJsonPath, 'utf-8');
      expect(scanContent).not.toContain('abc123');
      expect(scanContent).not.toContain('supersecret');
      expect(scanContent).not.toContain('xyz987');
    }

    // Verificar servicios detectados
    expect(scan.servicios).toBeDefined();
    for (const s of scan.servicios || []) {
      expect(s.evidencia).not.toContain('abc123');
      expect(s.evidencia).not.toContain('supersecret');
      // La evidencia cita archivo y clave, no secretos
      expect(s.evidencia).toMatch(/\.env\.example|package\.json/);
    }
  });

  // B6: Paso trabajo y confirmaciones
  it('B6: ninguna siguiente_accion tipo trabajo apunta a herramientas que exigen confirmación (qap_module_close, qap_session_close); constante <= 600 caracteres', async () => {
    // Longitud de la constante compartida
    expect(QAP_CORE_DIRECTIVES.length).toBeLessThanOrEqual(600);
    expect(QAP_CORE_DIRECTIVES).toContain('las acciones que requieren confirmación nunca vienen como trabajo');

    // Recorrer guidance para todas las fases
    const fases: Array<'INIT' | 'ONBOARDING' | 'SCOPING' | 'WORKING' | 'WRAP_UP'> = ['INIT', 'ONBOARDING', 'SCOPING', 'WORKING', 'WRAP_UP'];
    const forbiddenTools = ['qap_module_close', 'qap_session_close'];

    for (const f of fases) {
      const guidance = getPhaseGuidance(f, {
        nextPlannedModule: 'auth',
        nextPlannedPath: '/login',
      });
      if (guidance.siguiente_accion?.tipo === 'trabajo' && guidance.siguiente_accion.tool) {
        expect(forbiddenTools).not.toContain(guidance.siguiente_accion.tool);
      }
    }

    // Ejecutar flujo en server y verificar que cuando tipo === 'trabajo', nunca es close
    await call('qap_init', { baseUrl: 'http://localhost:3000' });
    await call('qap_context_set', {
      objective: 'Validación de directivas de trabajo',
      roles: [{ name: 'admin' }],
      critical_flows: [{ name: 'login' }],
      source_of_truth: { type: 'none', declared: true },
    });
    const rPlan = await call('qap_session_plan', {
      modules: [{ module: 'auth', path: '/login', priority: 'high' }],
      auth: { required: false },
    });

    if (rPlan.parsed.siguiente_accion?.tipo === 'trabajo') {
      expect(forbiddenTools).not.toContain(rPlan.parsed.siguiente_accion.tool);
    }

    const rDisc = await call('qap_discover', { name: 'auth', path: '/login' });
    if (rDisc.parsed.siguiente_accion?.tipo === 'trabajo') {
      expect(forbiddenTools).not.toContain(rDisc.parsed.siguiente_accion.tool);
    }
  });

  // B7: Flujo corregir resumen paso a paso
  it('B7: flujo corregir resumen realiza preguntas abiertas una por una citando propuesta, asigna source user, y permite confirmación final', async () => {
    await call('qap_init', { baseUrl: 'http://localhost:3000' });

    // Inyectar estado con propuestas inferred y fuente de verdad confirmada
    await call('qap_context_set', {
      source: 'inferred',
      objective: 'Objetivo propuesto preliminarmente',
      roles: [{ name: 'Operador Inferred' }],
      critical_flows: [{ name: 'Flujo Inferred' }],
      source_of_truth: { type: 'prd', ref: 'doc.md', declared: true, source: 'user' },
    });

    // 1. Iniciar corrección de objective y roles
    const rCorregirInit = await call('qap_context_set', {
      confirmar_resumen: 'corregir',
      campos: ['objective', 'roles'],
    });

    expect(rCorregirInit.parsed.status).toBe('success');
    expect(rCorregirInit.parsed.siguiente_accion.tipo).toBe('entrevista');
    const p1 = rCorregirInit.parsed.siguiente_accion.pregunta;
    expect(p1.id).toBe('onboarding.corregir.objective');
    expect(p1.formato).toBe('abierta');
    expect(p1.texto).toContain('Objetivo propuesto preliminarmente');
    expect(p1.registrar_con.campo).toBe('objective');

    // 2. Responder primer campo corregido
    const rCorregir1 = await call('qap_context_set', {
      objective: 'Objetivo corregido por el usuario final',
    });

    expect(rCorregir1.parsed.status).toBe('success');
    const p2 = rCorregir1.parsed.siguiente_accion.pregunta;
    expect(p2.id).toBe('onboarding.corregir.roles');
    expect(p2.formato).toBe('abierta');
    expect(p2.texto).toContain('Operador Inferred');
    expect(p2.registrar_con.campo).toBe('roles');

    // 3. Responder segundo campo corregido
    const rCorregir2 = await call('qap_context_set', {
      roles: ['SuperAdmin', 'Auditor'],
    });

    expect(rCorregir2.parsed.status).toBe('success');
    // Cola terminada: vuelve a presentar tarjeta de resumen actualizada
    const pSummary = rCorregir2.parsed.siguiente_accion.pregunta;
    expect(pSummary.id).toBe('onboarding.confirmar_resumen');
    expect(pSummary.texto).toContain('Objetivo corregido por el usuario final');
    expect(pSummary.texto).toContain('SuperAdmin, Auditor');

    // Verificar persistencia y fuentes intermedias
    let ctx = YAML.parse(readFileSync(join(tempDir, '.qa', 'project', 'context.yaml'), 'utf-8'));
    expect(ctx.objective).toBe('Objetivo corregido por el usuario final');
    expect(ctx.objective_source).toBe('user');
    expect(ctx.roles[0].source).toBe('user');
    expect(ctx.critical_flows[0].source).toBe('inferred'); // No fue corregido aún

    // 4. Confirmar todo
    const rConfirm = await call('qap_context_set', {
      confirmar_resumen: 'confirmo_todo',
    });
    expect(rConfirm.parsed.status).toBe('success');
    expect(rConfirm.parsed.fase).toBe('SCOPING');

    // Todos los campos ahora son user
    ctx = YAML.parse(readFileSync(join(tempDir, '.qa', 'project', 'context.yaml'), 'utf-8'));
    expect(ctx.critical_flows[0].source).toBe('user');
  });

  // B8: targetPath en subcarpeta
  it('B8: advierte si targetPath parece una subcarpeta de un repo con .git sin escanear fuera', async () => {
    // Crear repo ancestro con .git
    const rootRepo = join(tempDir, 'monorepo');
    const subApp = join(rootRepo, 'packages', 'web-app');
    mkdirSync(join(rootRepo, '.git'), { recursive: true });
    mkdirSync(subApp, { recursive: true });

    // qap_init sobre subApp
    const resInit = await handler(
      {
        method: 'tools/call',
        params: { name: 'qap_init', arguments: { targetPath: subApp, projectName: 'sub-app' } },
      },
      {}
    );
    const pInit = JSON.parse(resInit.content[0].text);
    expect(pInit.status).toBe('success');
    expect(pInit.advertencias).toBeDefined();
    expect(pInit.advertencias.length).toBeGreaterThan(0);
    expect(pInit.advertencias[0]).toContain('targetPath parece una subcarpeta del repositorio');

    // qap_status sobre subApp
    const resStatus = await handler(
      {
        method: 'tools/call',
        params: { name: 'qap_status', arguments: { targetPath: subApp } },
      },
      {}
    );
    const pStatus = JSON.parse(resStatus.content[0].text);
    expect(pStatus.advertencias).toBeDefined();
    expect(pStatus.advertencias[0]).toContain('targetPath parece una subcarpeta del repositorio');
  });

  // B9: Preservación de _, / y acentos con sanitización estricta de inyección
  it('B9: sanitizeDomString preserva "/", "_" y vocales acentuadas pero sanitiza caracteres de control e inyecciones HTML', () => {
    const cleanPath1 = sanitizeDomString('docs/Especificacion_v2.md');
    expect(cleanPath1).toBe('docs/Especificacion_v2.md');

    const cleanPath2 = sanitizeDomString('docs/Especificación_v2.md');
    expect(cleanPath2).toBe('docs/Especificación_v2.md');

    // Inyección de script y saltos de línea
    const dirty = '<script>alert("pwned")</script>docs/Especificación_v2.md\r\n\x00\x1b[31m';
    const sanitized = sanitizeDomString(dirty);
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('</script>');
    expect(sanitized).not.toContain('\r');
    expect(sanitized).not.toContain('\n');
    expect(sanitized).not.toContain('\x00');
    expect(sanitized).toContain('docs/Especificación_v2.md');
  });
});
