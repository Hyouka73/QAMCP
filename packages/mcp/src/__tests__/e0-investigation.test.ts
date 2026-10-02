import { describe, it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import YAML from 'yaml';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { truncarTexto } from '@qap/engine';
import { createMcpServer } from '../server.js';

describe('E0 / B10 Pruebas de regresión sin impresión', () => {
  async function callTool(server: any, name: string, args: Record<string, unknown> = {}) {
    const handler = (server as any)._requestHandlers.get(CallToolRequestSchema.shape.method.value);
    return await handler({ method: 'tools/call', params: { name, arguments: args } }, {});
  }

  it('E0a: escaneo respeta targetPath y emite advertencia de subcarpeta si no hay docs', async () => {
    const root = mkdtempSync(join(tmpdir(), 'qap-e0a-'));
    try {
      writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'root-repo', workspaces: ['front'] }), 'utf-8');
      writeFileSync(join(root, 'PRD_diff.md'), '# PRD Diff\n## Objetivo\nSistema de gestión de pruebas\n', 'utf-8');

      mkdirSync(join(root, 'front'), { recursive: true });
      writeFileSync(join(root, 'front', 'package.json'), JSON.stringify({ name: 'front' }), 'utf-8');

      const server = createMcpServer();

      // targetPath = root
      const resRoot = await callTool(server, 'qap_init', { targetPath: root, projectName: 'test-root' });
      const parsedRoot = JSON.parse(resRoot.content[0].text);
      expect(parsedRoot.status).toBe('success');
      expect(parsedRoot.scan.documentos.length).toBeGreaterThan(0);
      expect(parsedRoot.advertencias).toHaveLength(0);

      // targetPath = front/ (sin documentos en front, pero ancestro con workspaces)
      const resFront = await callTool(server, 'qap_init', { targetPath: join(root, 'front'), projectName: 'test-front' });
      const parsedFront = JSON.parse(resFront.content[0].text);
      expect(parsedFront.status).toBe('success');
      expect(parsedFront.scan.documentos).toHaveLength(0);
      expect(parsedFront.advertencias.length).toBeGreaterThan(0);
      expect(parsedFront.advertencias[0]).toContain('targetPath parece una subcarpeta del repositorio');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('E0b: qap_context_ingest no degrada source_of_truth ni contamina notes, registra ingest.analyzed_by', async () => {
    const root = mkdtempSync(join(tmpdir(), 'qap-e0b-'));
    try {
      const server = createMcpServer();
      await callTool(server, 'qap_init', { targetPath: root, projectName: 'test-e0b', baseUrl: 'http://localhost:3000' });

      writeFileSync(join(root, 'PRD.md'), '# PRD Sistema\n## Objetivo\nAutomatizar pruebas E2E para laboratorio clínico\n## Roles\n- Admin\n- Tester\n', 'utf-8');

      const contextPath = join(root, '.qa', 'project', 'context.yaml');
      const ctx = YAML.parse(readFileSync(contextPath, 'utf-8'));
      ctx.source_of_truth = {
        type: 'prd',
        ref: 'PRD.md',
        declared: true,
        source: 'user',
        notes: 'Notas originales del usuario',
      };
      writeFileSync(contextPath, YAML.stringify(ctx), 'utf-8');

      const ingestRes = await callTool(server, 'qap_context_ingest', { targetPath: root, docPath: 'PRD.md' });
      const parsedIngest = JSON.parse(ingestRes.content[0].text);
      expect(parsedIngest.status).toBe('success');
      expect(parsedIngest.solicitud_confirmacion).toBeUndefined();

      const ctxAfter = YAML.parse(readFileSync(contextPath, 'utf-8'));
      expect(ctxAfter.source_of_truth.source).toBe('user');
      expect(ctxAfter.source_of_truth.notes).toBe('Notas originales del usuario');
      expect(ctxAfter.source_of_truth.notes).not.toContain('[agent_analyzed]');
      expect(ctxAfter.ingest).toBeDefined();
      expect(ctxAfter.ingest.analyzed_by).toBe('heuristic');
      expect(ctxAfter.ingest.doc_ref).toBe('PRD.md');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('E0c: sin evidencia detectedService es undefined y baseUrl no se inventa', async () => {
    const root = mkdtempSync(join(tmpdir(), 'qap-e0c-'));
    try {
      const server = createMcpServer();
      const statusRes = await callTool(server, 'qap_status', { targetPath: root });
      const parsed = JSON.parse(statusRes.content[0].text);
      expect(parsed.detectedService).toBeUndefined();

      const initRes = await callTool(server, 'qap_init', { targetPath: root });
      const parsedInit = JSON.parse(initRes.content[0].text);
      expect(parsedInit.detectedService).toBeUndefined();

      const envsPath = join(root, '.qa', 'project', 'environments.yaml');
      const envsYaml = YAML.parse(readFileSync(envsPath, 'utf-8'));
      expect(Object.keys(envsYaml.environments || {})).toHaveLength(0);

      const ctxPath = join(root, '.qa', 'project', 'context.yaml');
      const ctxYaml = YAML.parse(readFileSync(ctxPath, 'utf-8'));
      expect(ctxYaml.base_url).toBeUndefined();
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('E0d / B10: objetivo largo se trunca a máx 280 con elipsis sin cortar palabras en preguntas, pero se guarda completo en context', async () => {
    const root = mkdtempSync(join(tmpdir(), 'qap-e0d-'));
    try {
      const server = createMcpServer();
      const longObjective = 'Plataforma SaaS B2B que digitaliza y centraliza el ciclo de vida del reclutamiento y seleccion de personal, en particular los estudios socioeconomicos y los expedientes documentales. Transforma un proceso artesanal en una operacion industrializada mediante un pipeline Kanban de seis etapas que integra investigacion telefonica, visitas de campo offline-first y generacion automatica de reportes PDF. Resuelve la fragmentacion operativa entre clientes, mesa de control y ejecutivos de campo, con trazabilidad y SLAs definidos, y protege datos sensibles con cifrado y aislamiento multi-tenant.';
      expect(longObjective.length).toBeGreaterThan(300);

      const prdContent = `# PRD Largo\n## Objetivo\n${longObjective}\n## Roles\n- Reclutador\n- Evaluador\n`;
      writeFileSync(join(root, 'PRD.md'), prdContent, 'utf-8');

      await callTool(server, 'qap_init', { targetPath: root, baseUrl: 'http://localhost:3000' });
      await callTool(server, 'qap_context_set', { targetPath: root, source_of_truth: 'PRD.md' });

      // Verificar truncarTexto función pura
      const truncado = truncarTexto(longObjective, 280);
      expect(truncado.length).toBeLessThanOrEqual(280);
      expect(truncado.endsWith('…')).toBe(true);
      expect(truncado).not.toContain('  ');

      // Verificar que en context.yaml el objetivo esté completo (no cortado a 280)
      const contextPath = join(root, '.qa', 'project', 'context.yaml');
      const ctx = YAML.parse(readFileSync(contextPath, 'utf-8'));
      expect(ctx.objective.length).toBeGreaterThan(300);
      expect(ctx.objective).toContain('aislamiento multi-tenant');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
