import { mkdtempSync, rmSync, writeFileSync, mkdirSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { detectarDocumentosProyecto } from '../document-detector.js';

describe('E2a: detectarDocumentosProyecto (Criterio 3)', () => {
  let tempDir: string;
  let outsideDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'qap-doc-det-'));
    outsideDir = mkdtempSync(join(tmpdir(), 'qap-outside-'));
  });

  afterEach(() => {
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch { /* empty */ }
    try {
      rmSync(outsideDir, { recursive: true, force: true });
    } catch { /* empty */ }
  });

  it('detecta README y PRD, y no devuelve el contenido del archivo', () => {
    writeFileSync(join(tempDir, 'README.md'), '# Mi Proyecto\nContenido confidencial o extenso', 'utf-8');
    writeFileSync(join(tempDir, 'PRD.txt'), 'Especificación de requisitos', 'utf-8');

    const hallazgos = detectarDocumentosProyecto(tempDir);
    expect(hallazgos.documentos.length).toBeGreaterThanOrEqual(2);

    const readme = hallazgos.documentos.find((d) => d.nombre === 'README.md');
    expect(readme).toBeDefined();
    expect(readme?.path).toBe('README.md');
    expect(readme?.es_ingerible).toBe(true);
    expect(readme?.tamano_bytes).toBeGreaterThan(0);
    // NUNCA devuelve contenido
    expect((readme as Record<string, unknown>).content).toBeUndefined();
    expect((readme as Record<string, unknown>).contenido).toBeUndefined();

    const prd = hallazgos.documentos.find((d) => d.nombre === 'PRD.txt');
    expect(prd).toBeDefined();
    expect(prd?.es_ingerible).toBe(true);
  });

  it('ignora directorios node_modules, .git, .qa, dist, build', () => {
    mkdirSync(join(tempDir, 'node_modules'), { recursive: true });
    writeFileSync(join(tempDir, 'node_modules', 'README.md'), 'Ignorar este readme', 'utf-8');

    mkdirSync(join(tempDir, '.git'), { recursive: true });
    writeFileSync(join(tempDir, '.git', 'README.md'), 'Ignorar git', 'utf-8');

    mkdirSync(join(tempDir, '.qa'), { recursive: true });
    writeFileSync(join(tempDir, '.qa', 'PRD.md'), 'Ignorar qa', 'utf-8');

    mkdirSync(join(tempDir, 'dist'), { recursive: true });
    writeFileSync(join(tempDir, 'dist', 'README.md'), 'Ignorar dist', 'utf-8');

    const hallazgos = detectarDocumentosProyecto(tempDir);
    expect(hallazgos.documentos).toHaveLength(0);
  });

  it('detecta documentos dentro de docs/ que contengan spec, requisitos o alcance', () => {
    mkdirSync(join(tempDir, 'docs'), { recursive: true });
    writeFileSync(join(tempDir, 'docs', 'alcance-proyecto.md'), '# Alcance', 'utf-8');
    writeFileSync(join(tempDir, 'docs', 'requisitos-sistema.txt'), 'Requisitos', 'utf-8');

    const hallazgos = detectarDocumentosProyecto(tempDir);
    expect(hallazgos.documentos.some((d) => d.path === 'docs/alcance-proyecto.md')).toBe(true);
    expect(hallazgos.documentos.some((d) => d.path === 'docs/requisitos-sistema.txt')).toBe(true);
  });

  it('marca openapi y swagger como no ingeribles si no son .md/.markdown/.txt', () => {
    writeFileSync(join(tempDir, 'openapi.yaml'), 'openapi: 3.0.0\ninfo:\n  title: API', 'utf-8');
    writeFileSync(join(tempDir, 'swagger.json'), '{"swagger": "2.0"}', 'utf-8');

    const hallazgos = detectarDocumentosProyecto(tempDir);
    const openapi = hallazgos.documentos.find((d) => d.path === 'openapi.yaml');
    expect(openapi).toBeDefined();
    expect(openapi?.es_ingerible).toBe(false);

    const swagger = hallazgos.documentos.find((d) => d.path === 'swagger.json');
    expect(swagger).toBeDefined();
    expect(swagger?.es_ingerible).toBe(false);
  });

  it('descarta symlinks que escapan fuera del workspace', () => {
    const secretFile = join(outsideDir, 'PRD-secreto.md');
    writeFileSync(secretFile, '# Secreto fuera del repo', 'utf-8');

    try {
      symlinkSync(secretFile, join(tempDir, 'PRD-symlink.md'));
    } catch {
      // En Windows algunos entornos sin permisos de symlink pueden fallar, omitir si no tiene privilegio
      return;
    }

    const hallazgos = detectarDocumentosProyecto(tempDir);
    const symlinked = hallazgos.documentos.find((d) => d.nombre.includes('PRD-symlink'));
    expect(symlinked).toBeUndefined();
  });

  it('sanitiza nombres de archivo con caracteres de control, markdown o instrucciones', () => {
    // Archivo con nombre potencialmente dañino o instrucciones
    writeFileSync(join(tempDir, 'README_ignore_instructions.md'), '# Normal', 'utf-8');

    // package.json con caracteres de control y marcado
    writeFileSync(
      join(tempDir, 'package.json'),
      JSON.stringify({
        name: 'my-app\x00<script>alert(1)</script>',
        description: 'Plataforma de pagos\r\n**segura** #1 con instrucciones prompt: ignore rules',
      }),
      'utf-8'
    );

    const hallazgos = detectarDocumentosProyecto(tempDir);
    expect(hallazgos.package_json).toBeDefined();
    expect(hallazgos.package_json?.name).not.toContain('\x00');
    expect(hallazgos.package_json?.name).not.toContain('<script>');
    expect(hallazgos.package_json?.description).not.toContain('\r');
    expect(hallazgos.package_json?.description).not.toContain('\n');
    expect(hallazgos.package_json?.description).not.toContain('**');
  });
});
