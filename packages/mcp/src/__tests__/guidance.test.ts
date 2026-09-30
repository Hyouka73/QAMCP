import { describe, it, expect } from 'vitest';

import { getPhaseGuidance } from '../guidance.js';

describe('Módulo de Guía Conversacional por Fase (E6)', () => {
  it('ONBOARDING: debe generar tipo "entrevista" con preguntas en el orden exacto y opciones vacías', () => {
    const res = getPhaseGuidance('ONBOARDING');
    expect(res.fase).toBe('ONBOARDING');
    expect(res.siguiente_accion.tipo).toBe('entrevista');
    expect(res.siguiente_accion.tool).toBe('qap_context_set');
    expect(res.opciones).toHaveLength(0); // Preguntas abiertas: sin opciones de botón

    const preguntas = res.siguiente_accion.preguntas!;
    expect(preguntas.length).toBeLessThanOrEqual(5);
    expect(preguntas[0]).toContain('Fuente de verdad');
    expect(preguntas[1]).toContain('Objetivo del proyecto');
    expect(preguntas[2]).toContain('Roles de usuario');
    expect(preguntas[3]).toContain('Flujos críticos');
    expect(preguntas[4]).toContain('Entorno');
  });

  it('ONBOARDING: debe filtrar preguntas solo para los campos faltantes especificados respetando el orden', () => {
    const res = getPhaseGuidance('ONBOARDING', {
      faltantes: [
        { campo: 'critical_flows', motivo: 'falta flujo' },
        { campo: 'roles', motivo: 'falta rol' },
      ],
    });

    const preguntas = res.siguiente_accion.preguntas!;
    expect(preguntas).toHaveLength(2);
    // Debe respetar el orden canónico: roles antes que flujos críticos
    expect(preguntas[0]).toContain('Roles de usuario');
    expect(preguntas[1]).toContain('Flujos críticos');
  });

  it('SCOPING: debe generar tipo "decision" requiriendo qap_session_plan y proponiendo sugerencias', () => {
    const res = getPhaseGuidance('SCOPING', {
      suggestedModules: [
        { module: 'checkout', path: '/cart', priority: 'high' },
        { module: 'auth', path: '/login', priority: 'critical' },
      ],
    });

    expect(res.fase).toBe('SCOPING');
    expect(res.siguiente_accion.tipo).toBe('decision');
    expect(res.siguiente_accion.tool).toBe('qap_session_plan');
    expect(res.siguiente_accion.descripcion).toContain('checkout (/cart)');
    expect(res.opciones.some((o) => o.includes('checkout'))).toBe(true);
  });

  it('WORKING: debe indicar el siguiente módulo en estado planned con tool qap_discover', () => {
    const res = getPhaseGuidance('WORKING', {
      plan: [
        { module: 'auth', path: '/login', priority: 'high', status: 'observed' },
        { module: 'checkout', path: '/cart', priority: 'normal', status: 'planned' },
      ],
      modules: {
        auth: { state: 'observed' },
        checkout: { state: 'planned' },
      },
    });

    expect(res.fase).toBe('WORKING');
    expect(res.siguiente_accion.tipo).toBe('trabajo');
    expect(res.siguiente_accion.tool).toBe('qap_discover');
    expect(res.siguiente_accion.descripcion).toContain("'checkout' en ruta '/cart'");
    expect(res.opciones).toHaveLength(0);
  });

  it('WORKING: debe priorizar módulo en interviewing con tipo entrevista_vista y tool qap_rules_set', () => {
    const res = getPhaseGuidance('WORKING', {
      plan: [
        { module: 'auth', path: '/login', priority: 'high', status: 'interviewing' },
        { module: 'checkout', path: '/cart', priority: 'normal', status: 'planned' },
      ],
      modules: {
        auth: { state: 'interviewing' },
        checkout: { state: 'planned' },
      },
    });

    expect(res.fase).toBe('WORKING');
    expect(res.siguiente_accion.tipo).toBe('entrevista_vista');
    expect(res.siguiente_accion.tool).toBe('qap_rules_set');
    expect(res.siguiente_accion.descripcion).toContain("'auth'");
    expect(res.opciones.some((o) => o.includes('qap_rules_set'))).toBe(true);
  });

  it('WORKING: debe resumir pendientes si no hay módulos planned en la sesión', () => {
    const res = getPhaseGuidance('WORKING', {
      plan: [
        { module: 'auth', path: '/login', priority: 'high', status: 'observed' },
      ],
      modules: {
        auth: { state: 'observed' },
      },
    });

    expect(res.fase).toBe('WORKING');
    expect(res.siguiente_accion.tipo).toBe('decision');
    expect(res.siguiente_accion.tool).toBe('qap_report');
    expect(res.siguiente_accion.descripcion).toContain('cobertura completa');
  });

  it('WRAP_UP: debe indicar que la nueva sesión no está implementada aún', () => {
    const res = getPhaseGuidance('WRAP_UP');
    expect(res.fase).toBe('WRAP_UP');
    expect(res.siguiente_accion.tipo).toBe('decision');
    expect(res.siguiente_accion.descripcion).toContain('Nueva sesión aún no implementada');
  });
});
