import { describe, it, expect } from 'vitest';

import { obtenerSiguientePreguntaOnboarding } from '../onboarding-interview.js';
import { validarPregunta } from '../pregunta.js';

describe('E2c: obtenerSiguientePreguntaOnboarding (Criterio 2)', () => {
  it('respeta el orden canónico estricto: fuente_de_verdad -> objetivo -> roles -> flujos_criticos', () => {
    // 1. Proyecto vacío: debe pedir fuente_de_verdad
    const q1 = obtenerSiguientePreguntaOnboarding({}, null, { documentos: [] });
    expect(q1).not.toBeNull();
    expect(q1?.id).toBe('onboarding.fuente_de_verdad');
    expect(validarPregunta(q1!).valid).toBe(true);

    // 2. Con fuente de verdad resuelta pero sin objetivo: debe pedir objetivo
    const ctxConFuente = {
      source_of_truth: { type: 'none' as const, declared: true, source: 'user' as const },
    };
    const q2 = obtenerSiguientePreguntaOnboarding(ctxConFuente, null, {
      documentos: [],
      package_json: { description: 'Plataforma para procesar pagos y transferencias bancarias' },
    });
    expect(q2).not.toBeNull();
    expect(q2?.id).toBe('onboarding.objetivo');
    expect(validarPregunta(q2!).valid).toBe(true);
    // Con hipótesis de package.json
    expect(q2?.formato).toBe('una_opcion');
    expect(q2?.texto).toContain('Plataforma para procesar pagos y transferencias bancarias');

    // 3. Con objetivo resuelto pero sin roles: debe pedir roles
    const ctxConObjetivo = {
      ...ctxConFuente,
      objective: 'Plataforma para procesar pagos y transferencias bancarias en tiempo real',
      objective_source: 'user' as const,
    };
    const q3 = obtenerSiguientePreguntaOnboarding(ctxConObjetivo, null, { documentos: [] });
    expect(q3).not.toBeNull();
    expect(q3?.id).toBe('onboarding.roles');
    expect(validarPregunta(q3!).valid).toBe(true);
    expect(q3?.formato).toBe('multiple');

    // 4. Con roles resueltos pero sin flujos críticos: debe pedir flujos críticos
    const ctxConRoles = {
      ...ctxConObjetivo,
      roles: [{ name: 'cliente', source: 'user' as const }, { name: 'admin', source: 'user' as const }],
    };
    const q4 = obtenerSiguientePreguntaOnboarding(ctxConRoles, null, { documentos: [] });
    expect(q4).not.toBeNull();
    expect(q4?.id).toBe('onboarding.flujos_criticos');
    expect(validarPregunta(q4!).valid).toBe(true);

    // 5. Con flujos críticos resueltos y entorno presente: debe retornar null
    const ctxCompleto = {
      ...ctxConRoles,
      critical_flows: [{ name: 'pago', source: 'user' as const }, { name: 'login', source: 'user' as const }],
    };
    const q5 = obtenerSiguientePreguntaOnboarding(ctxCompleto, null, { documentos: [] });
    expect(q5).toBeNull();
  });

  it('no repite campos ya resueltos válidamente', () => {
    // Solo falta roles
    const ctx = {
      source_of_truth: { type: 'prd' as const, declared: true, ref: 'prd.md', source: 'user' as const },
      objective: 'Sistema de analítica y monitoreo para operaciones financieras',
      objective_source: 'user' as const,
      critical_flows: [{ name: 'auth', source: 'user' as const }],
    };
    const q = obtenerSiguientePreguntaOnboarding(ctx, null, null);
    expect(q?.id).toBe('onboarding.roles');
  });

  it('omite la URL del entorno si ya existe en environments', () => {
    const ctx = {
      source_of_truth: { type: 'none' as const, declared: true, source: 'user' as const },
      objective: 'Sistema de telemetría y calidad continua para aplicaciones web',
      objective_source: 'user' as const,
      roles: [{ name: 'tester', source: 'user' as const }],
      critical_flows: [{ name: 'checkout', source: 'user' as const }],
    };
    const envs = {
      environments: {
        staging: { url: 'https://staging.example.com' },
      },
    };
    const q = obtenerSiguientePreguntaOnboarding(ctx, null, null, envs);
    expect(q).toBeNull();
  });

  it('genera opciones con documentos detectados cuando existen hallazgos y alternativas estándar cuando no', () => {
    // Con hallazgos
    const hallazgosConDoc = {
      documentos: [
        { path: 'README.md', nombre: 'README.md', es_ingerible: true, tamano_bytes: 1200 },
        { path: 'docs/prd.md', nombre: 'prd.md', es_ingerible: true, tamano_bytes: 4000 },
      ],
    };
    const qCon = obtenerSiguientePreguntaOnboarding({}, null, hallazgosConDoc);
    expect(qCon?.id).toBe('onboarding.fuente_de_verdad');
    expect(qCon?.opciones.some((o) => o.id === 'README.md')).toBe(true);
    expect(qCon?.opciones.some((o) => o.id === 'docs/prd.md')).toBe(true);
    expect(qCon?.opciones.some((o) => o.id === 'none')).toBe(true);
    expect(validarPregunta(qCon!).valid).toBe(true);

    // Sin hallazgos
    const qSin = obtenerSiguientePreguntaOnboarding({}, null, { documentos: [] });
    expect(qSin?.opciones.some((o) => o.id === 'custom')).toBe(true);
    expect(qSin?.opciones.some((o) => o.id === 'none')).toBe(true);
    expect(validarPregunta(qSin!).valid).toBe(true);
  });

  it('formato de objetivo es abierta cuando no hay hipótesis de package.json ni contexto', () => {
    const ctx = {
      source_of_truth: { type: 'none' as const, declared: true, source: 'user' as const },
    };
    const q = obtenerSiguientePreguntaOnboarding(ctx, null, { documentos: [] });
    expect(q?.id).toBe('onboarding.objetivo');
    expect(q?.formato).toBe('abierta');
    expect(q?.opciones).toHaveLength(0);
    expect(validarPregunta(q!).valid).toBe(true);
  });

  it('P4.3: fuente_de_verdad usa efecto.accion en lugar de efecto.estado', () => {
    const hallazgos = {
      documentos: [
        { path: 'PRD_diff.md', nombre: 'PRD_diff.md', es_ingerible: true, tamano_bytes: 1024 },
      ],
    };
    const q = obtenerSiguientePreguntaOnboarding({}, null, hallazgos);
    expect(q?.id).toBe('onboarding.fuente_de_verdad');
    const docOpt = q?.opciones.find((o) => o.id === 'PRD_diff.md');
    expect(docOpt?.efecto?.accion).toBe('declarar_fuente');
    expect(docOpt?.efecto?.estado).toBeUndefined();

    const noneOpt = q?.opciones.find((o) => o.id === 'none');
    expect(noneOpt?.efecto?.accion).toBe('sin_documento');
    expect(noneOpt?.efecto?.estado).toBeUndefined();
  });

  it('P4.3: cita la extracción preliminar en la pregunta de fuente de verdad si está disponible', () => {
    const hallazgos = {
      documentos: [
        { path: 'PRD_diff.md', nombre: 'PRD_diff.md', es_ingerible: true, tamano_bytes: 1024 },
      ],
      preliminar: {
        docPath: 'PRD_diff.md',
        objetivo: 'Sistema integral de gestión de calidad',
      },
    };
    const q = obtenerSiguientePreguntaOnboarding({}, null, hallazgos);
    expect(q?.id).toBe('onboarding.fuente_de_verdad');
    expect(q?.texto).toContain("Encontré 'PRD_diff.md'");
    expect(q?.texto).toContain("entendí: objetivo 'Sistema integral de gestión de calidad'");
  });

  it('P4.3: emite confirmación única cuando objetivo, roles y flujos tienen propuesta', () => {
    const ctx = {
      source_of_truth: { type: 'prd' as const, declared: true, ref: 'PRD_diff.md', source: 'user' as const },
      objective: 'Plataforma para automatización de pruebas',
      objective_source: 'inferred' as const,
      roles: [{ name: 'Admin', source: 'inferred' as const }, { name: 'Operador', source: 'inferred' as const }],
      critical_flows: [{ name: 'Flujo E2E', source: 'inferred' as const }],
    };
    const q = obtenerSiguientePreguntaOnboarding(ctx, null, null);
    expect(q).not.toBeNull();
    expect(q?.id).toBe('onboarding.confirmar_resumen');
    expect(q?.formato).toBe('una_opcion');
    expect(q?.opciones).toHaveLength(2);
    expect(q?.opciones[0].id).toBe('confirmo_todo');
    expect(q?.opciones[0].efecto?.accion).toBe('confirmar_resumen');
    expect(q?.opciones[1].id).toBe('corregir');
    expect(q?.opciones[1].efecto?.accion).toBe('corregir');
    expect(q?.opciones[1].efecto?.abre_seguimiento).toBe(true);
    expect(q?.seguimiento).toBeDefined();
    expect(q?.seguimiento?.id).toBe('onboarding.campos_a_corregir');
    expect(validarPregunta(q!).valid).toBe(true);
  });

  it('P4.3: toda pregunta incluye render_texto no vacío y consistente con las opciones', () => {
    const hallazgos = {
      documentos: [
        { path: 'PRD_diff.md', nombre: 'PRD_diff.md', es_ingerible: true, tamano_bytes: 1024 },
        { path: 'README.md', nombre: 'README.md', es_ingerible: true, tamano_bytes: 500 },
      ],
    };
    const q = obtenerSiguientePreguntaOnboarding({}, null, hallazgos);
    expect(q?.render_texto).toBeDefined();
    expect(typeof q?.render_texto).toBe('string');
    expect(q?.render_texto).toContain('1. PRD_diff.md');
    expect(q?.render_texto).toContain('2. README.md');
    expect(q?.render_texto).toContain('(Responde con el número');
  });

  it('P4.3: cita documento analizado cuando faltan campos y no se encontraron propuestas', () => {
    const ctx = {
      source_of_truth: { type: 'prd' as const, declared: true, ref: 'PRD_diff.md', source: 'user' as const },
    };
    const q = obtenerSiguientePreguntaOnboarding(ctx, null, { docAnalizado: 'PRD_diff.md' });
    expect(q?.id).toBe('onboarding.objetivo');
    expect(q?.texto).toContain("No encontré objetivo en 'PRD_diff.md'");
  });
});

