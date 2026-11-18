import { mkdtempSync, rmSync, writeFileSync, openSync, closeSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import {
  detectarDocumentosProyecto,
  resolverDocumento,
  clasificarDocumento,
  isPlaceholderContent,
  sniffFileContent,
} from '../src/document-detector.js';

describe('Empirical Adversarial Stress Harness — Document Detection & Classification', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'qap-adversarial-test-'));
  });

  afterEach(() => {
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      /* empty */
    }
  });

  describe('Suite 1: Empty and Whitespace Files', () => {
    it('rejects 0-byte PRD.md with es_ingerible: false and ranks below substantive backlog.txt', () => {
      writeFileSync(join(tempDir, 'PRD.md'), '', 'utf-8');
      writeFileSync(
        join(tempDir, 'backlog.txt'),
        'Backlog de Producto EXATO Center:\nObjetivo: Sistema de evaluación y expedientes documentales.\nRoles: Admin, Analista, Candidato.\nFlujos: Registro, Validación, Reportes.',
        'utf-8'
      );

      const hallazgos = detectarDocumentosProyecto(tempDir);
      expect(hallazgos.documentos).toHaveLength(2);

      // backlog.txt must be index 0
      expect(hallazgos.documentos[0].path).toBe('backlog.txt');
      expect(hallazgos.documentos[0].es_ingerible).toBe(true);

      // PRD.md must be index 1, non-ingestible, placeholder
      expect(hallazgos.documentos[1].path).toBe('PRD.md');
      expect(hallazgos.documentos[1].es_ingerible).toBe(false);
      expect(hallazgos.documentos[1].tamano_bytes).toBe(0);
      expect(hallazgos.documentos[1].categoria).toBe('placeholder');
      expect(hallazgos.documentos[1].advertencia).toContain('Archivo vacío (0 bytes)');
    });

    it('rejects whitespace-only files (spaces, tabs, newlines, CRLF)', () => {
      const whitespaceVariants = [
        ' ',
        '   \t   ',
        '\n\n\n\n\n\n\n\n\n\n',
        ' \t \r\n \t \r\n  \r\n',
        '\r\n\r\n',
      ];

      for (let i = 0; i < whitespaceVariants.length; i++) {
        const filePath = join(tempDir, `whitespace_${i}.md`);
        writeFileSync(filePath, whitespaceVariants[i], 'utf-8');

        const resolved = resolverDocumento(tempDir, `whitespace_${i}.md`);
        expect(resolved).not.toBeNull();
        expect(resolved?.es_ingerible).toBe(false);
        expect(resolved?.categoria).toBe('placeholder');
      }
    });

    it('rejects files containing only markdown marker symbols with no substantive text', () => {
      const markerOnlyVariants = [
        '#\n##\n###\n####',
        '---\n***\n___\n',
        '>\n>>\n>>>\n',
        '```\n```\n',
        '| | |\n|---|---|',
      ];

      for (let i = 0; i < markerOnlyVariants.length; i++) {
        const filePath = join(tempDir, `marker_${i}.md`);
        writeFileSync(filePath, markerOnlyVariants[i], 'utf-8');

        const resolved = resolverDocumento(tempDir, `marker_${i}.md`);
        expect(resolved).not.toBeNull();
        expect(resolved?.es_ingerible).toBe(false);
        expect(resolved?.categoria).toBe('placeholder');
      }
    });
  });

  describe('Suite 2: Heading-Only, Comments-Only and Stub Files', () => {
    it('disqualifies files with only markdown headings even if long (> 30 chars)', () => {
      const headingsOnly = [
        '# Especificación General del Sistema de Pagos',
        '## Arquitectura y Componentes del Software',
        '### Módulos Funcionales y Casos de Uso',
        '#### Criterios de Aceptación y Pruebas',
      ].join('\n');

      writeFileSync(join(tempDir, 'headings.md'), headingsOnly, 'utf-8');
      const resolved = resolverDocumento(tempDir, 'headings.md');

      expect(resolved?.es_ingerible).toBe(false);
      expect(resolved?.categoria).toBe('placeholder');
    });

    it('disqualifies files with single-line HTML comments even if long (> 30 chars)', () => {
      const commentsOnly = '<!-- TODO: redactar los requerimientos funcionales y reglas de negocio del sistema -->';
      writeFileSync(join(tempDir, 'comments.md'), commentsOnly, 'utf-8');

      const resolved = resolverDocumento(tempDir, 'comments.md');
      expect(resolved?.es_ingerible).toBe(false);
      expect(resolved?.categoria).toBe('placeholder');
    });

    it('disqualifies files with combination of headings, comments, TODO and TBD', () => {
      const stubCombo = [
        '# Requisitos del Sistema',
        '<!-- comentario de desarrollo -->',
        'TODO: agregar flujos de usuario',
        'TBD: definir arquitectura de base de datos',
      ].join('\n');

      writeFileSync(join(tempDir, 'stub_combo.md'), stubCombo, 'utf-8');
      const resolved = resolverDocumento(tempDir, 'stub_combo.md');

      expect(resolved?.es_ingerible).toBe(false);
      expect(resolved?.categoria).toBe('placeholder');
    });

    it('disqualifies multiline HTML comments in isPlaceholderContent and marks as placeholder', () => {
      const multilineComment = [
        '<!--',
        'Comentario multilínea de desarrollo con más de treinta caracteres para probar el extractor.',
        '-->',
      ].join('\n');

      const isPlaceholder = isPlaceholderContent(multilineComment);
      expect(isPlaceholder).toBe(true);

      const clasificacion = clasificarDocumento('PRD.md', 'PRD.md', 100, multilineComment);
      expect(clasificacion.categoria).toBe('placeholder');
      expect(clasificacion.es_ingerible).toBe(false);
      expect(clasificacion.categoriaScore).toBe(100);
    });

    it('prioritizes ingestible README.md over oversized PRD.md (>512KB) in ranking with warning', () => {
      const largePrdPath = join(tempDir, 'PRD.md');
      const richPrefix = '# Requisitos Funcionales y Especificación de EXATO Center\nObjetivo: Sistema de calidad.\n';
      const padding = 'X'.repeat(600 * 1024);
      writeFileSync(largePrdPath, richPrefix + padding, 'utf-8');

      writeFileSync(
        join(tempDir, 'README.md'),
        '# EXATO Center Monorepo\nSistema integral de gestión para procesos de reclutamiento.\nReglas de negocio y flujos.',
        'utf-8'
      );

      const hallazgos = detectarDocumentosProyecto(tempDir);

      expect(hallazgos.documentos[0].path).toBe('README.md');
      expect(hallazgos.documentos[0].es_ingerible).toBe(true);
      expect(hallazgos.documentos[0].ranking).toBe(0);

      expect(hallazgos.documentos[1].path).toBe('PRD.md');
      expect(hallazgos.documentos[1].es_ingerible).toBe(false);
      expect(hallazgos.documentos[1].ranking).toBe(1);
      expect(hallazgos.documentos[1].advertencia).toContain('El archivo excede el tamaño máximo permitido (512 KB)');
    });

    it('disqualifies files with under 30 substantive characters', () => {
      // 29 characters exactly:
      // "12345678901234567890123456789" (29 chars)
      const text29 = '# Doc\n123456789012345678901234';
      // Substantive chars: 'Doc' (3) + 24 digits = 27 chars (< 30)
      expect(isPlaceholderContent(text29)).toBe(true);

      // Substantive chars >= 30:
      const text30 = '# Doc\n123456789012345678901234567';
      // 'Doc' (3) + 27 digits = 30 chars
      expect(isPlaceholderContent(text30)).toBe(false);
    });
  });

  describe('Suite 3: Massive Files and Bounded Content Sniffing', () => {
    it('sniffs at most 4096 bytes and completes in < 50ms for a 10MB file', () => {
      const massivePath = join(tempDir, 'massive_doc.md');

      // Create a 10 MB file
      const chunk = 'A'.repeat(1024 * 1024); // 1 MB chunk
      const fd = openSync(massivePath, 'w');
      for (let i = 0; i < 10; i++) {
        writeFileSync(fd, chunk);
      }
      closeSync(fd);

      const startTime = performance.now();
      const snippet = sniffFileContent(massivePath, 4096);
      const duration = performance.now() - startTime;

      expect(Buffer.byteLength(snippet, 'utf-8')).toBeLessThanOrEqual(4096);
      expect(duration).toBeLessThan(500); // Fast, bounded content sniffing
    });

    it('strictly rejects files exceeding 512KB with es_ingerible: false', () => {
      // 600 KB file (> 512 KB MAX_FILE_SIZE_BYTES)
      const largePath = join(tempDir, 'large_spec.md');
      const richContentPrefix = '# Requisitos Funcionales y Casos de Uso del Sistema\n'.repeat(20);
      const padding = 'X'.repeat(600 * 1024);
      writeFileSync(largePath, richContentPrefix + padding, 'utf-8');

      const resolved = resolverDocumento(tempDir, 'large_spec.md');
      expect(resolved).not.toBeNull();
      expect(resolved?.es_ingerible).toBe(false);
      expect(resolved?.tamano_bytes).toBeGreaterThan(512 * 1024);
    });

    it('accepts files under 512KB with substantive content', () => {
      // 100 KB file (< 512 KB)
      const validPath = join(tempDir, 'valid_spec.md');
      const richContent = '# Requisitos Funcionales del Sistema\nObjetivo: Gestionar pagos.\nRoles: Admin, User.\n' + 'Detalle de reglas de negocio y flujos.\n'.repeat(1000);
      writeFileSync(validPath, richContent, 'utf-8');

      const resolved = resolverDocumento(tempDir, 'valid_spec.md');
      expect(resolved).not.toBeNull();
      expect(resolved?.es_ingerible).toBe(true);
      expect(resolved?.categoria).toBe('documento_funcional');
    });
  });

  describe('Suite 4: Deceptive Filenames & Adversarial Disguises', () => {
    it('penalizes qa-audit.md pretending to be a functional specification', () => {
      const deceptiveQaContent = `# Auditoria de QA y Verificación
Objetivo: Validar los requisitos funcionales, roles de usuario y flujos críticos.
Incidencias encontradas y matriz de pruebas ejecutadas.`;

      writeFileSync(join(tempDir, 'qa-audit.md'), deceptiveQaContent, 'utf-8');
      writeFileSync(
        join(tempDir, 'README.md'),
        '# EXATO Center\nPlataforma de reclutamiento y selección con guias y configuraciones generales.',
        'utf-8'
      );

      const hallazgos = detectarDocumentosProyecto(tempDir);
      expect(hallazgos.documentos).toHaveLength(2);

      // README.md should be ranked ahead of qa-audit.md
      expect(hallazgos.documentos[0].path).toBe('README.md');
      expect(hallazgos.documentos[0].categoria).toBe('readme_instalacion');

      // qa-audit.md should be categorized as bitacora_qa with penalty 14
      expect(hallazgos.documentos[1].path).toBe('qa-audit.md');
      expect(hallazgos.documentos[1].categoria).toBe('bitacora_qa');
      expect(hallazgos.documentos[1].factores?.categoriaScore).toBe(14);
    });

    it('ranks clean spec ahead of spec with penalty token (diff, old, draft)', () => {
      const content = '# Especificación de Requisitos\nObjetivo: Sistema de pagos y transferencias bancarias.';
      writeFileSync(join(tempDir, 'spec_diff.md'), content, 'utf-8');
      writeFileSync(join(tempDir, 'spec.md'), content, 'utf-8');

      const hallazgos = detectarDocumentosProyecto(tempDir);
      expect(hallazgos.documentos[0].path).toBe('spec.md');
      expect(hallazgos.documentos[1].path).toBe('spec_diff.md');
      expect(hallazgos.documentos[1].factores?.tiene_penalizacion).toBe(true);
    });

    it('prioritizes substantive docs in subfolder over empty PRD.md in root', () => {
      writeFileSync(join(tempDir, 'PRD.md'), '', 'utf-8');
      const docsDir = join(tempDir, 'docs');
      mkdirSync(docsDir, { recursive: true });
      writeFileSync(
        join(docsDir, 'manual.md'),
        '# Manual Funcional del Sistema\nDescripción completa de los procesos y módulos.',
        'utf-8'
      );

      const hallazgos = detectarDocumentosProyecto(tempDir);
      expect(hallazgos.documentos[0].path).toBe('docs/manual.md');
      expect(hallazgos.documentos[0].es_ingerible).toBe(true);

      const prd = hallazgos.documentos.find((d) => d.path === 'PRD.md');
      expect(prd?.es_ingerible).toBe(false);
      expect(prd?.ranking).toBeGreaterThan(0);
    });
  });
});
