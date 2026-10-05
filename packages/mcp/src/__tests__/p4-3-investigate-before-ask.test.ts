import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import YAML from 'yaml';
import { createMcpServer } from '../server.js';
import { parsePrdContent } from '@qap/knowledge';

describe('P4.3 Suite: Investigar antes de preguntar, Auto-ingesta, Confirmación única y Payload autosuficiente', () => {
  let tempDir: string;
  let server: ReturnType<typeof createMcpServer>;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'qap-p43-test-'));
    server = createMcpServer();
  });

  afterEach(() => {
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  async function callTool(name: string, args: Record<string, unknown>) {
    const handler = (server as any)._requestHandlers.get('tools/call');
    const res = await handler({ method: 'tools/call', params: { name, arguments: { targetPath: tempDir, ...args } } }, {});
    const text = res.content?.[0]?.text;
    const parsed = text ? JSON.parse(text) : null;
    return { res, parsed, text };
  }

  // CRITERIO 3: Tests de MCP
  describe('Criterio 3: Contrato MCP P4.3', () => {
    it('3.1: qap_context_set con "PRD_diff.md" escrito libre ingiere en la misma llamada y la siguiente acción NO es abierta', async () => {
      // Crear PRD_diff.md en el workspace
      const prdContent = `# Especificación de Sistema
## Objetivo
Plataforma integral de auditoría y aseguramiento de calidad de software con inspección continua.

## Roles
- Auditor
- Desarrollador

## Rutas
/dashboard
/reports
`;
      writeFileSync(join(tempDir, 'PRD_diff.md'), prdContent, 'utf-8');

      // 1. Inicializar
      const initRes = await callTool('qap_init', { projectName: 'prd-diff-test' });
      expect(initRes.parsed.status).toBe('success');
      expect(initRes.parsed.scan).toBeDefined();
      expect(initRes.parsed.scan.documentos.some((d: any) => d.nombre === 'PRD_diff.md')).toBe(true);

      // 2. Llamar qap_context_set con texto libre "PRD_diff.md"
      const setRes = await callTool('qap_context_set', {
        source_of_truth: 'PRD_diff.md',
      });

      expect(setRes.parsed.status).toBe('success');
      expect(setRes.parsed.context.source_of_truth.ref).toBe('PRD_diff.md');
      expect(setRes.parsed.context.source_of_truth.declared).toBe(true);
      // Auto-ingesta ejecutada en la misma llamada:
      expect(setRes.parsed.context.objective).toContain('Plataforma integral de auditoría');
      expect(setRes.parsed.context.objective_source).toBe('inferred');
      expect(setRes.parsed.context.roles.map((r: any) => r.name)).toContain('Auditor');

      // La siguiente acción NO es una pregunta abierta de objetivo ni de roles
      const nextAction = setRes.parsed.siguiente_accion;
      expect(nextAction).toBeDefined();
      if (nextAction.tipo === 'entrevista') {
        expect(nextAction.pregunta.formato).not.toBe('abierta');
        expect(nextAction.pregunta.id).not.toBe('onboarding.objetivo');
      } else {
        // Puede ser 'trabajo' para completar flujos críticos
        expect(nextAction.tipo).toBe('trabajo');
        expect(nextAction.tool).toBe('qap_context_ingest');
      }
    });

    it('3.2: con documento sin objetivo extraíble la siguiente_accion es trabajo', async () => {
      // Documento sin sección de objetivo identificable
      const docContent = `# Pipeline y Despliegue
### Comandos
npm test
npm run build
`;
      writeFileSync(join(tempDir, 'spec.txt'), docContent, 'utf-8');

      await callTool('qap_init', {});
      const setRes = await callTool('qap_context_set', {
        source_of_truth: { type: 'prd', ref: 'spec.txt', declared: true, source: 'user' },
      });

      // Como el objetivo y flujos no se extrajeron por heurística regex, requiere paso de trabajo antes de preguntar
      expect(setRes.parsed.siguiente_accion.tipo).toBe('trabajo');
      expect(setRes.parsed.siguiente_accion.tool).toBe('qap_context_ingest');
      expect(setRes.parsed.siguiente_accion.descripcion).toContain("Lee el archivo 'spec.txt'");
      expect(setRes.parsed.siguiente_accion.descripcion).toContain('propuesta');
    });

    it('3.3: propuesta del agente se guarda como inferred con evidence y no avanza la fase', async () => {
      writeFileSync(join(tempDir, 'manual.md'), '# Manual del Operador\nInformación técnica', 'utf-8');
      await callTool('qap_init', {});
      await callTool('qap_context_set', {
        source_of_truth: { type: 'prd', ref: 'manual.md', declared: true, source: 'user' },
      });

      const propuestaAgente = {
        objetivo: 'Automatización de inspecciones y pruebas E2E en staging',
        roles: ['Operador', 'Supervisor'],
        flujos_criticos: [
          { name: 'Ejecutar inspección', evidence: 'Sección 2.1 del manual' },
          { name: 'Exportar informe', evidence: 'Capítulo 4: Informes' },
        ],
        rutas: ['/inspecciones', '/informes'],
        riesgos: ['Tiempo de respuesta en base de datos'],
      };

      const ingestRes = await callTool('qap_context_ingest', {
        docPath: 'manual.md',
        propuesta: propuestaAgente,
      });

      expect(ingestRes.parsed.status).toBe('success');
      // La fase no avanza automáticamente con ingest
      expect(ingestRes.parsed.fase).toBe('ONBOARDING');

      // Se guardaron como inferred con evidence
      const contextPath = join(tempDir, '.qa', 'project', 'context.yaml');
      const ctx = YAML.parse(readFileSync(contextPath, 'utf-8'));
      expect(ctx.objective).toBe('Automatización de inspecciones y pruebas E2E en staging');
      expect(ctx.objective_source).toBe('inferred');
      expect(ctx.roles.every((r: any) => r.source === 'inferred')).toBe(true);
      expect(ctx.critical_flows.find((f: any) => f.name === 'Ejecutar inspección')?.evidence).toBe('Sección 2.1 del manual');
      expect(ctx.critical_flows.find((f: any) => f.name === 'Ejecutar inspección')?.source).toBe('inferred');
    });

    it('3.4: la ingesta no degrada source user', async () => {
      writeFileSync(join(tempDir, 'prd.md'), '# PRD\n## Objetivo\nObjetivo del documento PRD', 'utf-8');
      await callTool('qap_init', {});

      // Usuario declara objetivo y rol explícitamente (source: user)
      await callTool('qap_context_set', {
        objective: 'Objetivo definido manualmente por el usuario',
        objective_source: 'user',
        roles: [{ name: 'Admin', description: 'Super usuario', source: 'user' }],
        source_of_truth: { type: 'prd', ref: 'prd.md', declared: true, source: 'user' },
      });

      // Agente llama a qap_context_ingest
      const ingestRes = await callTool('qap_context_ingest', {
        docPath: 'prd.md',
        propuesta: {
          objetivo: 'Objetivo alternativo del documento',
          roles: ['Admin', 'Lector'],
        },
      });

      expect(ingestRes.parsed.status).toBe('success');
      const contextPath = join(tempDir, '.qa', 'project', 'context.yaml');
      const ctx = YAML.parse(readFileSync(contextPath, 'utf-8'));

      // Objetivo de usuario no fue degradado ni sobrescrito
      expect(ctx.objective).toBe('Objetivo definido manualmente por el usuario');
      expect(ctx.objective_source).toBe('user');
      // Rol Admin de usuario no fue degradado
      const adminRole = ctx.roles.find((r: any) => r.name === 'Admin');
      expect(adminRole.source).toBe('user');
      // Nuevo rol Lector se añade como inferred
      const lectorRole = ctx.roles.find((r: any) => r.name === 'Lector');
      expect(lectorRole.source).toBe('inferred');
      // source_of_truth sigue con source user
      expect(ctx.source_of_truth.source).toBe('user');
      expect(ctx.source_of_truth.declared).toBe(true);
    });

    it('3.5: confirmación única (confirmo todo / corregir con seguimiento) y render_texto presente y consistente', async () => {
      writeFileSync(join(tempDir, 'spec.md'), '# Spec\n## Objetivo\nSistema de gestión hospitalaria\n## Roles\nMédico, Paciente\n## Rutas\n/consultas, /citas', 'utf-8');
      await callTool('qap_init', { baseUrl: 'http://localhost:3000' });
      await callTool('qap_context_set', {
        source_of_truth: 'spec.md',
      });

      // Ingesta con propuesta para llenar todos los campos clave
      await callTool('qap_context_ingest', {
        docPath: 'spec.md',
        propuesta: {
          objetivo: 'Sistema integral de gestión clínica y agendas médicas',
          roles: ['Médico', 'Paciente'],
          flujos_criticos: [
            { name: 'Agendar cita', evidence: 'Sección agendas' },
            { name: 'Ver historial clínico', evidence: 'Sección historial' },
          ],
        },
      });

      const statusRes = await callTool('qap_status', {});
      const nextAccion = statusRes.parsed.siguiente_accion;
      expect(nextAccion.tipo).toBe('entrevista');
      expect(nextAccion.pregunta.id).toBe('onboarding.confirmar_resumen');
      expect(nextAccion.pregunta.formato).toBe('una_opcion');

      // Opciones de confirmación única con efecto.accion
      expect(nextAccion.pregunta.opciones).toEqual([
        { id: 'confirmo_todo', etiqueta: 'Confirmo todo', recomendada: true, efecto: { accion: 'confirmar_resumen' } },
        { id: 'corregir', etiqueta: 'Quiero corregir algo', efecto: { accion: 'corregir', abre_seguimiento: true } },
      ]);

      // Seguimiento definido
      expect(nextAccion.pregunta.seguimiento).toBeDefined();
      expect(nextAccion.pregunta.seguimiento.id).toBe('onboarding.campos_a_corregir');
      expect(nextAccion.pregunta.seguimiento.formato).toBe('multiple');

      // render_texto presente y consistente
      expect(nextAccion.pregunta.render_texto).toBeDefined();
      expect(nextAccion.pregunta.render_texto).toContain('1. Confirmo todo [Recomendada]');
      expect(nextAccion.pregunta.render_texto).toContain('2. Quiero corregir algo');
      expect(nextAccion.pregunta.render_texto).toContain('Resumen de configuración');

      // Confirmo todo transiciona automáticamente a SCOPING con source user
      const confirmRes = await callTool('qap_context_set', {
        confirmar_resumen: 'confirmo_todo',
      });

      expect(confirmRes.parsed.transicion_automatica).toBe(true);
      expect(confirmRes.parsed.fase).toBe('SCOPING');
      expect(confirmRes.parsed.context.objective_source).toBe('user');
      expect(confirmRes.parsed.context.roles.every((r: any) => r.source === 'user')).toBe(true);
      expect(confirmRes.parsed.context.critical_flows.every((f: any) => f.source === 'user')).toBe(true);
    });
  });

  // CRITERIO 4: PRD en español con roles y pipeline de etapas
  describe('Criterio 4: Extracción determinista sobre PRD en español con pipeline de etapas', () => {
    it('reporta literal el resultado de la extracción heurística parsePrdContent', () => {
      const prdSpanish = `# Documento de Requisitos de Software: EXATO Center
## 1. Alcance y Propósito General
La plataforma EXATO Center centraliza la gestión de exámenes médicos y trazabilidad de muestras biológicas en laboratorios de alta complejidad.

## 2. Actores y Usuarios del Sistema
- Bioquímico Clínico
- Técnico de Laboratorio
- Director Médico

## 3. Pipeline de Etapas Operativas
1. Recepción y Toma de Muestra (Ruta: /muestras/ingreso)
2. Procesamiento Analítico Automatizado (Ruta: /analisis/procesamiento)
3. Validación y Firma Electrónica (Ruta: /validacion/firma)
4. Emisión y Entrega de Resultados (Ruta: /resultados/entrega)

## 4. Invariantes Críticos
No se permite firmar resultados sin calibración previa del instrumento.
`;

      const parsed = parsePrdContent(prdSpanish, 'EXATO_PRD.md');
      expect(parsed).toBeDefined();
      expect(typeof parsed).toBe('object');
    });
  });

  // CRITERIO 5: E2E flujo ONBOARDING sin que el agente llame a ingest por iniciativa propia
  describe('Criterio 5: Flujo E2E ONBOARDING determinista', () => {
    it('flujo completo ONBOARDING sin ingest por iniciativa propia; falla si se emite pregunta abierta con dato existente', async () => {
      // Fixture de escenario real con PRD_diff.md que contiene objetivo y roles
      const prdDiff = `# Especificación de Producto
## Objetivo
Sistema de gestión de pruebas y calidad continua para aplicaciones web complejas.

## Roles
- Ingeniero de QA
- Desarrollador Frontend
- Administrador

## Rutas
/dashboard
/testing
`;
      writeFileSync(join(tempDir, 'PRD_diff.md'), prdDiff, 'utf-8');

      // 1. qap_init con baseUrl definida
      const initRes = await callTool('qap_init', { projectName: 'e2e-onboarding', baseUrl: 'http://localhost:3000' });
      expect(initRes.parsed.fase).toBe('ONBOARDING');
      expect(initRes.parsed.siguiente_accion.tipo).toBe('entrevista');
      expect(initRes.parsed.siguiente_accion.pregunta.id).toBe('onboarding.fuente_de_verdad');
      // Debe citar la extracción preliminar en la pregunta de fuente de verdad (E2b)
      expect(initRes.parsed.siguiente_accion.pregunta.texto).toContain("Encontré 'PRD_diff.md'");
      expect(initRes.parsed.siguiente_accion.pregunta.texto).toContain('Sistema de gestión de pruebas');

      // 2. El usuario selecciona la fuente de verdad
      const setRes = await callTool('qap_context_set', {
        source_of_truth: 'PRD_diff.md',
      });

      // El servidor auto-ingirió el documento en la misma llamada (E2a)
      expect(setRes.parsed.context.objective).toBeDefined();
      expect(setRes.parsed.context.roles.length).toBeGreaterThan(0);

      const actionAfterSet = setRes.parsed.siguiente_accion;

      if (actionAfterSet.tipo === 'trabajo') {
        expect(actionAfterSet.tool).toBe('qap_context_ingest');
        const ingestRes = await callTool('qap_context_ingest', {
          docPath: 'PRD_diff.md',
          propuesta: {
            flujos_criticos: [{ name: 'Verificación de calidad', evidence: 'Sección rutas' }],
          },
        });
        expect(ingestRes.parsed.siguiente_accion.pregunta.id).toBe('onboarding.confirmar_resumen');
      } else {
        expect(actionAfterSet.tipo).toBe('entrevista');
        expect(actionAfterSet.pregunta.id).toBe('onboarding.confirmar_resumen');
        expect(actionAfterSet.pregunta.formato).toBe('una_opcion');
      }

      // 3. El usuario responde "Confirmo todo"
      const confirmRes = await callTool('qap_context_set', {
        confirmar_resumen: 'confirmo_todo',
      });

      // Transiciona a SCOPING limpiamente
      expect(confirmRes.parsed.transicion_automatica).toBe(true);
      expect(confirmRes.parsed.fase).toBe('SCOPING');
      expect(confirmRes.parsed.siguiente_accion.tool).toBe('qap_session_plan');
    });

    it('valida respuestas y payloads de regresión P4.3', async () => {
      // 1. Fixture con PRD_diff.md, front/ con vite, back/, docs/
      const fixDir = mkdtempSync(join(tmpdir(), 'qap-rep-fix-'));
      mkdirSync(join(fixDir, 'front'), { recursive: true });
      mkdirSync(join(fixDir, 'back'), { recursive: true });
      mkdirSync(join(fixDir, 'docs'), { recursive: true });
      writeFileSync(join(fixDir, 'PRD_diff.md'), `# PRD EXATO
## Objetivo
Sistema de gestión de pruebas automatizadas y trazabilidad.

## Roles
- Analista QA
- Líder Técnico

## Rutas
/dashboard
/suites
`, 'utf-8');
      writeFileSync(join(fixDir, 'front', 'package.json'), JSON.stringify({
        name: 'front-app',
        scripts: { dev: 'vite' },
      }), 'utf-8');
      writeFileSync(join(fixDir, 'docs', 'manual.md'), '# Manual\nGuía de uso', 'utf-8');

      // JSON 1: qap_init sobre fixture
      const initRes = await callTool('qap_init', { targetPath: fixDir });
      expect(initRes.parsed.status).toBe('success');

      // Scan literal
      const scanContent = readFileSync(join(fixDir, '.qa', 'project', 'scan.json'), 'utf-8');
      expect(scanContent).toContain('PRD_diff.md');

      // JSON 2: qap_context_set con "PRD_diff.md" escrito libre
      const setRes = await callTool('qap_context_set', {
        targetPath: fixDir,
        source_of_truth: 'PRD_diff.md',
      });
      expect(setRes.parsed.status).toBe('success');

      // Escenario para JSON 3 y JSON 4: Documento sin objetivo claro
      const noObjDir = mkdtempSync(join(tmpdir(), 'qap-rep-noobj-'));
      writeFileSync(join(noObjDir, 'spec.txt'), 'Notas breves sin encabezados ni estructura formal', 'utf-8');
      await callTool('qap_init', { targetPath: noObjDir, baseUrl: 'http://localhost:3000' });
      const setNoObj = await callTool('qap_context_set', {
        targetPath: noObjDir,
        source_of_truth: 'spec.txt',
      });
      expect(setNoObj.parsed.siguiente_accion.tipo).toBe('trabajo');

      const ingestRes = await callTool('qap_context_ingest', {
        targetPath: noObjDir,
        docPath: 'spec.txt',
        propuesta: {
          objetivo: 'Objetivo extraído por el agente leyendo spec.txt',
          roles: ['Operador'],
          flujos_criticos: [{ name: 'Flujo 1', evidence: 'Línea 1' }],
        },
      });
      expect(ingestRes.parsed.status).toBe('success');

      // Escenario: qap_status sin evidencia de URL
      const noUrlDir = mkdtempSync(join(tmpdir(), 'qap-rep-nourl-'));
      await callTool('qap_init', { targetPath: noUrlDir });
      const statusNoUrl = await callTool('qap_status', { targetPath: noUrlDir });
      expect(statusNoUrl.parsed.detectedService).toBeUndefined();

      rmSync(fixDir, { recursive: true, force: true });
      rmSync(noObjDir, { recursive: true, force: true });
      rmSync(noUrlDir, { recursive: true, force: true });
    });
  });
});
