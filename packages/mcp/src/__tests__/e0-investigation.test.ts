import { describe, it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import YAML from 'yaml';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createMcpServer } from '../server.js';

describe('E0 Verificaciones e investigación', () => {
  async function callTool(server: any, name: string, args: Record<string, unknown> = {}) {
    const handler = (server as any)._requestHandlers.get(CallToolRequestSchema.shape.method.value);
    return await handler({ method: 'tools/call', params: { name, arguments: args } }, {});
  }

  it('E0a: fixture temporal y comportamiento del detector actual', async () => {
    const root = mkdtempSync(join(tmpdir(), 'qap-e0a-'));
    try {
      // raíz con PRD_diff.md
      writeFileSync(join(root, 'PRD_diff.md'), '# PRD Diff\nObjetivo: Sistema de gestión\n', 'utf-8');
      
      // subcarpetas front y back
      mkdirSync(join(root, 'front'), { recursive: true });
      writeFileSync(join(root, 'front', 'package.json'), JSON.stringify({ name: 'front', dependencies: { vite: '^5.0.0' } }), 'utf-8');
      writeFileSync(join(root, 'front', 'vite.config.ts'), 'export default {}', 'utf-8');
      
      mkdirSync(join(root, 'back'), { recursive: true });
      writeFileSync(join(root, 'back', 'index.js'), 'console.log("back")', 'utf-8');
      
      // docs con otro .md
      mkdirSync(join(root, 'docs'), { recursive: true });
      writeFileSync(join(root, 'docs', 'manual.md'), '# Manual del usuario\n', 'utf-8');

      // Variantes para probar
      mkdirSync(join(root, 'sub1'), { recursive: true });
      writeFileSync(join(root, 'sub1', 'PRD_diff.md'), '# PRD Sub1\n', 'utf-8');
      writeFileSync(join(root, 'PRD diff.md'), '# PRD con espacio\n', 'utf-8');
      writeFileSync(join(root, 'prd_diff.md'), '# prd minusculas\n', 'utf-8');
      writeFileSync(join(root, 'PRD.md'), '# PRD exacto\n', 'utf-8');

      const server = createMcpServer();

      // targetPath = root
      const resRoot = await callTool(server, 'qap_init', { targetPath: root, projectName: 'test-root' });
      const parsedRoot = JSON.parse(resRoot.content[0].text);
      console.log('--- E0a: hallazgos_workspace con targetPath = raíz ---');
      console.log(JSON.stringify(parsedRoot.hallazgos_workspace, null, 2));

      // targetPath = front/
      const resFront = await callTool(server, 'qap_init', { targetPath: join(root, 'front'), projectName: 'test-front' });
      const parsedFront = JSON.parse(resFront.content[0].text);
      console.log('--- E0a: hallazgos_workspace con targetPath = front/ ---');
      console.log(JSON.stringify(parsedFront.hallazgos_workspace, null, 2));


    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('E0b: qap_context_ingest sobre proyecto con source_of_truth declarada por usuario', async () => {
    const root = mkdtempSync(join(tmpdir(), 'qap-e0b-'));
    try {
      const server = createMcpServer();
      await callTool(server, 'qap_init', { targetPath: root, projectName: 'test-e0b' });

      // Creamos PRD.md
      writeFileSync(join(root, 'PRD.md'), '# PRD Sistema\nObjetivo: Automatizar pruebas E2E\nRoles: Admin, Tester\n', 'utf-8');

      // Declaramos source_of_truth con source: user
      const contextPath = join(root, '.qa', 'project', 'context.yaml');
      const ctx = YAML.parse(readFileSync(contextPath, 'utf-8'));
      ctx.source_of_truth = {
        type: 'prd',
        ref: 'PRD.md',
        declared: true,
        source: 'user',
        notes: 'Declarado por usuario en onboarding',
      };
      writeFileSync(contextPath, YAML.stringify(ctx), 'utf-8');

      // qap_status antes de ingest
      const statusBefore = await callTool(server, 'qap_status', { targetPath: root });
      const parsedStatusBefore = JSON.parse(statusBefore.content[0].text);
      console.log('--- E0b: qap_status ANTES de ingest ---');
      console.log('faltantes:', JSON.stringify(parsedStatusBefore.faltantes, null, 2));

      // Ingest
      const ingestRes = await callTool(server, 'qap_context_ingest', { targetPath: root, docPath: 'PRD.md' });
      const parsedIngest = JSON.parse(ingestRes.content[0].text);
      console.log('--- E0b: qap_context_ingest RESPUESTA ---');
      console.log('faltantes retornados por ingest:', JSON.stringify(parsedIngest.faltantes, null, 2));

      const ctxAfter = YAML.parse(readFileSync(contextPath, 'utf-8'));
      console.log('--- E0b: context.yaml source_of_truth DESPUÉS de ingest ---');
      console.log(JSON.stringify(ctxAfter.source_of_truth, null, 2));

      // qap_status después de ingest
      const statusAfter = await callTool(server, 'qap_status', { targetPath: root });
      const parsedStatusAfter = JSON.parse(statusAfter.content[0].text);
      console.log('--- E0b: qap_status DESPUÉS de ingest ---');
      console.log('faltantes:', JSON.stringify(parsedStatusAfter.faltantes, null, 2));

    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('E0c: cálculo de detectedService en workspace sin evidencia', async () => {
    const root = mkdtempSync(join(tmpdir(), 'qap-e0c-'));
    try {
      const server = createMcpServer();
      const statusRes = await callTool(server, 'qap_status', { targetPath: root });
      const parsed = JSON.parse(statusRes.content[0].text);
      console.log('--- E0c: detectedService sin evidencia ---');
      console.log(JSON.stringify(parsed.detectedService, null, 2));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
