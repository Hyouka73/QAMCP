import type { CanExitOnboardingContext } from '@qap/engine';
import { describe, it, expect } from 'vitest';

import { getPhaseGuidance } from '../guidance.js';

describe('Módulo de Guía Conversacional por Fase (E6 - P4.2)', () => {
  it('ONBOARDING: debe generar tipo "entrevista" con UNA pregunta estructurada pendiente y sin opciones top-level', () => {
    const res = getPhaseGuidance('ONBOARDING');
    expect(res.fase).toBe('ONBOARDING');
    expect(res.siguiente_accion.tipo).toBe('entrevista');
    expect(res.siguiente_accion.pregunta).toBeDefined();
    expect(res.siguiente_accion.pregunta?.id).toBe('onboarding.fuente_de_verdad');
    // En P4.2 no existen preguntas ni opciones top-level
    expect((res as Record<string, unknown>).opciones).toBeUndefined();
    expect(res.siguiente_accion.preguntas).toBeUndefined();
  });

  it('ONBOARDING: debe entregar la siguiente pregunta pendiente en orden canónico', () => {
    // Si ya existe fuente_de_verdad pero falta objetivo
    const res = getPhaseGuidance('ONBOARDING', {
      context: {
        source_of_truth: { type: 'prd', ref: 'README.md', declared: true, source: 'user' },
      } as unknown as CanExitOnboardingContext,
    });

    expect(res.fase).toBe('ONBOARDING');
    expect(res.siguiente_accion.pregunta?.id).toBe('onboarding.objetivo');
  });

  it('SCOPING: debe generar tipo "decision" requiriendo qap_session_plan y proponiendo sugerencias en pregunta.opciones', () => {
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
    expect(res.siguiente_accion.pregunta?.opciones.some((o) => o.etiqueta.includes('checkout'))).toBe(true);
    expect((res as Record<string, unknown>).opciones).toBeUndefined();
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
    expect((res as Record<string, unknown>).opciones).toBeUndefined();
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
    expect(res.siguiente_accion.pregunta).toBeDefined();
    expect((res as Record<string, unknown>).opciones).toBeUndefined();
  });

  it('WORKING: debe dirigir a qap_session_close con tipo decision si todos los módulos están listos', () => {
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
    expect(res.siguiente_accion.tool).toBe('qap_session_close');
    expect(res.siguiente_accion.descripcion).toContain('qap_session_close');
    expect(res.siguiente_accion.pregunta).toBeDefined();
  });

  it('WRAP_UP: debe ofrecer decisión con opciones de Knowledge Graph y nueva sesión', () => {
    const res = getPhaseGuidance('WRAP_UP');
    expect(res.fase).toBe('WRAP_UP');
    expect(res.siguiente_accion.tipo).toBe('decision');
    expect(res.siguiente_accion.descripcion).toContain('qap_session_plan');
    expect(res.siguiente_accion.pregunta?.opciones.length).toBeGreaterThanOrEqual(2);
    expect((res as Record<string, unknown>).opciones).toBeUndefined();
  });
});
