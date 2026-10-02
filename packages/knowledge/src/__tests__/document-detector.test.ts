import { mkdtempSync, rmSync, writeFileSync, mkdirSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import {
  detectarDocumentosProyecto,
  resolverDocumento,
  generarScan,
} from '../document-detector.js';

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

  describe('P4.3 / Criterio 2: Suite completa del detector y escaneo', () => {
    it('fixture del escenario real: PRD_diff.md en raíz, front/, back/, docs/', () => {
      // 1. PRD_diff.md en raíz
      writeFileSync(join(tempDir, 'PRD_diff.md'), '# PRD Diff\nObjetivo: Sistema de gestión\n', 'utf-8');

      // 2. front con package.json (vite) y vite.config.ts
      mkdirSync(join(tempDir, 'front'), { recursive: true });
      writeFileSync(
        join(tempDir, 'front', 'package.json'),
        JSON.stringify({ name: 'frontend-app', dependencies: { vite: '^5.0.0' } }),
        'utf-8'
      );
      writeFileSync(
        join(tempDir, 'front', 'vite.config.ts'),
        'export default { server: { port: 5173 } };',
        'utf-8'
      );

      // 3. back con package.json (express)
      mkdirSync(join(tempDir, 'back'), { recursive: true });
      writeFileSync(
        join(tempDir, 'back', 'package.json'),
        JSON.stringify({ name: 'backend-api', dependencies: { express: '^4.18.0' } }),
        'utf-8'
      );

      // 4. docs con otro .md
      mkdirSync(join(tempDir, 'docs'), { recursive: true });
      writeFileSync(join(tempDir, 'docs', 'arquitectura.md'), '# Arquitectura de la solución\n', 'utf-8');

      const hallazgos = detectarDocumentosProyecto(tempDir);

      // Documentos: PRD_diff.md debe estar presente y ser el ranking #0
      expect(hallazgos.documentos.length).toBeGreaterThanOrEqual(1);
      const prd = hallazgos.documentos[0];
      expect(prd.path).toBe('PRD_diff.md');
      expect(prd.nombre).toBe('PRD_diff.md');
      expect(prd.es_ingerible).toBe(true);

      // Subproyectos: front (vite) y back (express)
      expect(hallazgos.subproyectos).toBeDefined();
      expect(hallazgos.subproyectos?.some((s) => s.path === 'front' && s.framework === 'vite')).toBe(true);
      expect(hallazgos.subproyectos?.some((s) => s.path === 'back' && s.framework === 'express')).toBe(true);

      // Servicios: http://localhost:5173 con evidencia de front/vite.config.ts
      expect(hallazgos.servicios).toBeDefined();
      expect(hallazgos.servicios?.some((s) => s.url === 'http://localhost:5173' && s.evidencia.includes('front/vite.config.ts'))).toBe(true);
    });

    it('ranking determinista: prd > spec > requisit > alcance > funcional > readme > diff y raíz > docs > subproyecto', () => {
      mkdirSync(join(tempDir, 'docs'), { recursive: true });
      mkdirSync(join(tempDir, 'sub'), { recursive: true });

      writeFileSync(join(tempDir, 'README.md'), '# Readme raíz', 'utf-8');
      writeFileSync(join(tempDir, 'PRD_diff.md'), '# PRD raíz', 'utf-8');
      writeFileSync(join(tempDir, 'docs', 'spec.md'), '# Especificación en docs', 'utf-8');
      writeFileSync(join(tempDir, 'sub', 'README.md'), '# Readme subproyecto', 'utf-8');

      const hallazgos = detectarDocumentosProyecto(tempDir);
      const paths = hallazgos.documentos.map((d) => d.path);

      // PRD_diff.md (score prd=0, raíz=0) precede a spec.md (score spec=1, docs=1), que precede a README.md (score readme=5, raíz=0)
      expect(paths[0]).toBe('PRD_diff.md');
      expect(paths[1]).toBe('docs/spec.md');
      expect(paths[2]).toBe('README.md');
      expect(paths[3]).toBe('sub/README.md');
    });

    it('excluye CHANGELOG, LICENSE, CONTRIBUTING, CODE_OF_CONDUCT y carpeta coverage', () => {
      writeFileSync(join(tempDir, 'CHANGELOG.md'), '# Changelog', 'utf-8');
      writeFileSync(join(tempDir, 'LICENSE'), 'MIT License', 'utf-8');
      writeFileSync(join(tempDir, 'LICENSE.md'), 'MIT License', 'utf-8');
      writeFileSync(join(tempDir, 'CONTRIBUTING.md'), '# Contributing', 'utf-8');
      writeFileSync(join(tempDir, 'CODE_OF_CONDUCT.md'), '# Code of conduct', 'utf-8');

      mkdirSync(join(tempDir, 'coverage'), { recursive: true });
      writeFileSync(join(tempDir, 'coverage', 'PRD.md'), '# In coverage', 'utf-8');

      const hallazgos = detectarDocumentosProyecto(tempDir);
      expect(hallazgos.documentos).toHaveLength(0);
    });

    it('resolverDocumento: resuelve nombre exacto, sin extensión, libre, inexistente y fuera de workspace', () => {
      writeFileSync(join(tempDir, 'PRD_diff.md'), '# Especificación PRD', 'utf-8');
      writeFileSync(join(tempDir, 'README.md'), '# Documentación', 'utf-8');

      // 1. Nombre exacto
      const r1 = resolverDocumento(tempDir, 'PRD_diff.md');
      expect(r1).not.toBeNull();
      expect(r1?.path).toBe('PRD_diff.md');
      expect(r1?.es_ingerible).toBe(true);

      // 2. Nombre sin extensión
      const r2 = resolverDocumento(tempDir, 'PRD_diff');
      expect(r2).not.toBeNull();
      expect(r2?.path).toBe('PRD_diff.md');

      // 3. Texto libre en lenguaje natural
      const r3 = resolverDocumento(tempDir, 'el prd');
      expect(r3).not.toBeNull();
      expect(r3?.path).toBe('PRD_diff.md');

      const r3b = resolverDocumento(tempDir, 'el archivo PRD_diff.md');
      expect(r3b).not.toBeNull();
      expect(r3b?.path).toBe('PRD_diff.md');

      // 4. Inexistente
      const r4 = resolverDocumento(tempDir, 'no_existe_archivo.md');
      expect(r4).toBeNull();

      // 5. Fuera del workspace (escape)
      const outsideFile = join(outsideDir, 'secret.md');
      writeFileSync(outsideFile, 'Secret outside', 'utf-8');
      const r5 = resolverDocumento(tempDir, '../' + outsideFile);
      expect(r5).toBeNull();

      // 6. Entradas inválidas nunca lanzan
      expect(resolverDocumento(tempDir, '')).toBeNull();
      // @ts-expect-error probando valor nulo defensivo
      expect(resolverDocumento(tempDir, null)).toBeNull();
    });

    it('ausencia de puerto por defecto cuando no hay evidencia de servicios', () => {
      // Workspace completamente vacío de configs
      const hallazgos = detectarDocumentosProyecto(tempDir);
      expect(hallazgos.servicios).toHaveLength(0);
    });

    it('detecta URLs con evidencia en .env.example y docker-compose', () => {
      writeFileSync(join(tempDir, '.env.example'), 'PORT=8085\nAPP_URL=http://localhost:8085\n', 'utf-8');
      writeFileSync(
        join(tempDir, 'docker-compose.yml'),
        'version: "3"\nservices:\n  web:\n    ports:\n      - "4200:80"\n',
        'utf-8'
      );

      const hallazgos = detectarDocumentosProyecto(tempDir);
      expect(hallazgos.servicios).toBeDefined();
      expect(hallazgos.servicios?.some((s) => s.url === 'http://localhost:8085')).toBe(true);
      expect(hallazgos.servicios?.some((s) => s.url === 'http://localhost:4200')).toBe(true);
    });

    it('generarScan produce un ProjectScan válido', () => {
      writeFileSync(join(tempDir, 'PRD_diff.md'), '# PRD Diff\n', 'utf-8');
      const scan = generarScan(tempDir);
      expect(scan._version).toBe('1');
      expect(scan.documentos).toHaveLength(1);
      expect(scan.documentos[0].path).toBe('PRD_diff.md');
      expect(scan.subproyectos).toBeDefined();
      expect(scan.servicios).toBeDefined();
    });
  });
});

