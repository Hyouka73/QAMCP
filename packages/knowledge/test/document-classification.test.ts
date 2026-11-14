import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import {
  detectarDocumentosProyecto,
  resolverDocumento,
  clasificarDocumento,
  isPlaceholderContent,
} from '../src/document-detector.js';

describe('Milestone M2 — Clasificación y endurecimiento de detección de documentos (F7/F8/F11)', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'qap-m2-doc-test-'));
  });

  afterEach(() => {
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      /* empty */
    }
  });

  it('F7 / Escenario 1: PRD.md vacío (0 bytes) queda por debajo de README.md sustantivo y es_ingerible es false', () => {
    // 0-byte PRD.md (idéntico a la situación real de EXATO Center)
    writeFileSync(join(tempDir, 'PRD.md'), '', 'utf-8');

    // README.md no vacío con descripción funcional
    const readmeContent = `# EXATO Center Monorepo
Sistema integral de gestión para procesos de reclutamiento, estudios socioeconómicos
y generación de expedientes documentales con módulos m0, m1, m2 y portal cliente.`;
    writeFileSync(join(tempDir, 'README.md'), readmeContent, 'utf-8');

    const hallazgos = detectarDocumentosProyecto(tempDir);
    expect(hallazgos.documentos.length).toBeGreaterThanOrEqual(2);

    // El documento en la primera posición DEBE ser README.md, no el PRD vacío
    expect(hallazgos.documentos[0].path).toBe('README.md');
    expect(hallazgos.documentos[0].es_ingerible).toBe(true);
    expect(hallazgos.documentos[0].categoria).toBe('documento_funcional');

    // El PRD vacío debe ser penalizado y marcado como NO ingerible
    const prd = hallazgos.documentos.find((d) => d.path === 'PRD.md');
    expect(prd).toBeDefined();
    expect(prd?.es_ingerible).toBe(false);
    expect(prd?.tamano_bytes).toBe(0);
    expect(prd?.categoria).toBe('placeholder');
    expect(prd?.advertencia).toContain('Archivo vacío (0 bytes); no puede utilizarse como fuente de verdad.');
    expect(prd?.ranking).toBeGreaterThan(0);
  });

  it('F8 / Escenario 2: Taxonomía de 6 clases y penalización estricta de bitácoras de QA', () => {
    // 1. Bitácora de QA / auditoría previa
    const auditContent = `# Auditoría Fix Motor Finalización
Reporte técnico de incidencias encontradas, verificación de fixes y pruebas ejecutadas.`;
    writeFileSync(join(tempDir, 'auditoria-fix-motor.md'), auditContent, 'utf-8');

    // 2. Runbook de instalación
    const installContent = `# Iniciar Servicios Locales
Guía paso a paso: requisitos previos, pnpm install, npm run dev y configuración de puertos locales.`;
    writeFileSync(join(tempDir, 'INICIAR_SERVICIOS.md'), installContent, 'utf-8');

    // 3. Backlog funcional del producto
    const backlogContent = `# EXATO Center - Backlog Maestro Consolidado
Objetivo del sistema, alcance funcional, reglas de negocio, roles de usuario y flujos críticos de la plataforma.`;
    writeFileSync(join(tempDir, 'Backlog Maestro Consolidado.md'), backlogContent, 'utf-8');

    const hallazgos = detectarDocumentosProyecto(tempDir);
    expect(hallazgos.documentos.length).toBe(3);

    // 1. Backlog Maestro Consolidado debe ser el #0 (documento_funcional)
    expect(hallazgos.documentos[0].path).toBe('Backlog Maestro Consolidado.md');
    expect(hallazgos.documentos[0].categoria).toBe('documento_funcional');
    expect(hallazgos.documentos[0].es_ingerible).toBe(true);

    // 2. INICIAR_SERVICIOS debe ser el #1 (readme_instalacion)
    expect(hallazgos.documentos[1].path).toBe('INICIAR_SERVICIOS.md');
    expect(hallazgos.documentos[1].categoria).toBe('readme_instalacion');
    expect(hallazgos.documentos[1].es_ingerible).toBe(true);

    // 3. auditoria-fix-motor debe quedar de último (bitacora_qa con penalización +10)
    expect(hallazgos.documentos[2].path).toBe('auditoria-fix-motor.md');
    expect(hallazgos.documentos[2].categoria).toBe('bitacora_qa');
    expect(hallazgos.documentos[2].factores?.categoriaScore).toBe(14);
  });

  it('F8 / Escenario 3: Archivo con plantilla o stub (< 30 caracteres sustantivos) es clasificado como placeholder', () => {
    writeFileSync(join(tempDir, 'PRD_stub.md'), '# PRD\nTODO\n<!-- pendiente -->\n', 'utf-8');
    writeFileSync(
      join(tempDir, 'README.md'),
      '# Especificación Completa\nAlcance, reglas de negocio y flujos del sistema de pagos.',
      'utf-8'
    );

    const hallazgos = detectarDocumentosProyecto(tempDir);
    const stub = hallazgos.documentos.find((d) => d.path === 'PRD_stub.md');
    expect(stub).toBeDefined();
    expect(stub?.categoria).toBe('placeholder');
    expect(stub?.es_ingerible).toBe(false);
    expect(stub?.advertencia).toContain('Contenido insuficiente o plantilla vacía');

    // README debe rankear primero
    expect(hallazgos.documentos[0].path).toBe('README.md');
  });

  it('F8 / Escenario 4: Content sniffing acotado clasifica documentación técnica vs funcional', () => {
    const techContent = `# Arquitectura del Sistema
Diagrama DDL, schema de base de datos PostgreSQL, migraciones y endpoints REST para la API.`;
    writeFileSync(join(tempDir, 'arquitectura.md'), techContent, 'utf-8');

    const funcContent = `# Especificación Funcional
Objetivo principal del producto, casos de uso, roles de cliente y flujos críticos de usuario.`;
    writeFileSync(join(tempDir, 'especificacion.md'), funcContent, 'utf-8');

    const hallazgos = detectarDocumentosProyecto(tempDir);
    const techDoc = hallazgos.documentos.find((d) => d.path === 'arquitectura.md');
    const funcDoc = hallazgos.documentos.find((d) => d.path === 'especificacion.md');

    expect(techDoc?.categoria).toBe('documento_tecnico');
    expect(funcDoc?.categoria).toBe('documento_funcional');

    // Documento funcional (score 0) debe preceder a técnico (score 2)
    expect(hallazgos.documentos[0].path).toBe('especificacion.md');
    expect(hallazgos.documentos[1].path).toBe('arquitectura.md');
  });

  it('F7: resolverDocumento devuelve es_ingerible: false y advertencia para archivos vacíos', () => {
    writeFileSync(join(tempDir, 'PRD.md'), '', 'utf-8');

    const resolved = resolverDocumento(tempDir, 'PRD.md');
    expect(resolved).not.toBeNull();
    expect(resolved?.path).toBe('PRD.md');
    expect(resolved?.es_ingerible).toBe(false);
    expect(resolved?.tamano_bytes).toBe(0);
    expect(resolved?.categoria).toBe('placeholder');
    expect(resolved?.advertencia).toContain('Archivo vacío (0 bytes)');
  });

  it('isPlaceholderContent detecta correctamente plantillas y stubs', () => {
    expect(isPlaceholderContent('')).toBe(true);
    expect(isPlaceholderContent('   \n\t  ')).toBe(true);
    expect(isPlaceholderContent('# PRD\nTODO\nTBD')).toBe(true);
    expect(isPlaceholderContent('# Titulo\n<!-- Comentario -->')).toBe(true);
    expect(isPlaceholderContent('Texto muy corto')).toBe(true);

    const substantive = '# Objetivo del Proyecto\nEste sistema permite gestionar procesos de reclutamiento de personal.';
    expect(isPlaceholderContent(substantive)).toBe(false);
  });

  it('clasificarDocumento detecta artefactos de QA', () => {
    const c1 = clasificarDocumento('test-results.json', 'test-results.json', 100);
    expect(c1.categoria).toBe('qa_artifact');
    expect(c1.es_ingerible).toBe(false);

    const c2 = clasificarDocumento('report-summary.json', 'report-summary.json', 100);
    expect(c2.categoria).toBe('qa_artifact');
    expect(c2.es_ingerible).toBe(false);
  });
});
