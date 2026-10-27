import { describe, it, expect } from 'vitest';
import type {
  ApplicationContext,
  EnvironmentPolicy,
  DomainModule,
  DomainView,
  ActionTarget,
  ApplicationObservation,
  AgentInference,
  ExpectedRequirement,
} from '../../domain/index.js';
import {
  validateApplicationObservation,
  validateAgentInference,
  validateExpectedRequirement,
} from '../../domain/index.js';

describe('VNEXT-001 / Escenario A — Aplicación Desconocida (Black-Box Discovery)', () => {
  // 1. QAP recibe únicamente una URL base
  const unknownAppUrl = 'https://app.example.com';
  const appContext: ApplicationContext = {
    application_id: 'app_crm_unknown',
    name: 'Discovered CRM Application',
    base_url: unknownAppUrl,
    created_at: new Date().toISOString(),
  };

  const envPolicy: EnvironmentPolicy = {
    environment_id: 'env_staging',
    application_id: appContext.application_id,
    name: 'staging',
    base_url: unknownAppUrl,
    is_production: false,
    destructive_actions_allowed: false,
    safe_domains: ['app.example.com'],
  };

  it('debe registrar módulos, vistas y elementos observados en el plano empírico de observación', () => {
    // Observación de red pasiva inicial
    const initialNavObservation: ApplicationObservation = {
      id: 'obs_nav_001',
      application_id: appContext.application_id,
      environment_id: envPolicy.environment_id,
      kind: 'navigation_route',
      network_event: {
        url: `${unknownAppUrl}/login`,
        method: 'GET',
        status: 200,
        response_snippet: '<!DOCTYPE html><html><form id="login-form">...',
        duration_ms: 120,
      },
      evidence: {
        id: 'ev_screenshot_login',
        kind: 'screenshot',
        uri: 'file:///evidence/login_initial.png',
        pii_masked: true,
        captured_at: new Date().toISOString(),
      },
      observed_at: new Date().toISOString(),
      observed_by: 'crawler',
    };

    const navValidation = validateApplicationObservation(initialNavObservation);
    expect(navValidation.valid).toBe(true);

    // Módulo y Vista descubiertos empíricamente
    const discoveredModule: DomainModule = {
      id: 'mod_auth_disc',
      application_id: appContext.application_id,
      key: 'authentication',
      title: 'Módulo de Autenticación',
      certainty: 'observed',
      criticality: 'high',
      dependencies: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true,
    };

    const discoveredView: DomainView = {
      id: 'view_login_disc',
      module_id: discoveredModule.id,
      application_id: appContext.application_id,
      route_pattern: '/login',
      title: 'Iniciar Sesión',
      certainty: 'observed',
      interactive_elements_count: 3,
      forms_count: 1,
      semantic_hash: 'hash_sha256_login_v1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true,
    };

    // Elementos interactivos del formulario
    const submitBtn: ActionTarget = {
      id: 'target_submit_btn',
      view_id: discoveredView.id,
      application_id: appContext.application_id,
      element_type: 'button',
      selector: 'button#btn-login',
      fallback_selectors: ['button[type="submit"]', 'text="Ingresar"'],
      accessibility_label: 'Iniciar sesión en CRM',
      certainty: 'observed',
      confidence_score: 0.95,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true,
    };

    expect(discoveredModule.certainty).toBe('observed');
    expect(discoveredView.certainty).toBe('observed');
    expect(submitBtn.element_type).toBe('button');
  });

  it('debe distinguir formalmente las inferencias del agente con su índice de confianza', () => {
    // Inferencia de que el campo email es obligatorio por asterisco visible en el label
    const emailFieldInference: AgentInference = {
      id: 'inf_email_required',
      application_id: appContext.application_id,
      target_type: 'interactive_target',
      hypothesis: 'El campo de correo electrónico parece ser requerido en el formulario de login.',
      confidence_score: 0.70, // Inferencia heurística preliminar
      reasoning: 'La etiqueta HTML contiene un asterisco rojo (*) y el atributo aria-required="true".',
      status: 'inferred',
      supporting_observation_ids: ['obs_nav_001'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      requires_human_confirmation: true,
    };

    const infValidation = validateAgentInference(emailFieldInference);
    expect(infValidation.valid).toBe(true);
    expect(emailFieldInference.status).toBe('inferred');
    expect(emailFieldInference.confidence_score).toBe(0.70);
  });

  it('debe mantener reglas de negocio cuyo comportamiento esperado se desconoce como pending_specification', () => {
    // Regla de negocio cuyo comportamiento de validación y límites todavía no ha sido confirmado
    const unknownBusinessRule: ExpectedRequirement = {
      id: 'req_auth_lockout_policy',
      application_id: appContext.application_id,
      module_key: 'authentication',
      title: 'Política de bloqueo de cuenta ante intentos fallidos',
      description: 'Se desconoce el número máximo de intentos fallidos antes de bloquear la cuenta (¿3 o 5?).',
      category: 'business_rule',
      status: 'pending_specification', // No se asume comportamiento; requiere entrevista o documento
      source: 'developer_interview',
      confidence_score: 0.0,
      created_at: new Date().toISOString(),
      is_active: true,
    };

    const reqValidation = validateExpectedRequirement(unknownBusinessRule);
    expect(reqValidation.valid).toBe(true);
    expect(unknownBusinessRule.status).toBe('pending_specification');
  });

  it('invariante crítica: una sonda activa que reproduce el comportamiento de la app NO promueve la regla a confirmed', () => {
    // 1. Se ejecuta una sonda activa no destructiva: presionar submit vacío
    const probeObservation: ApplicationObservation = {
      id: 'obs_probe_empty_submit',
      application_id: appContext.application_id,
      environment_id: envPolicy.environment_id,
      kind: 'probe_result',
      probe_execution: {
        action: 'click_empty_submit',
        target_selector: 'button#btn-login',
        observed_output: {
          banner_text: 'Debe ingresar un correo y una contraseña',
          css_class: 'error-banner',
          status_code: 422,
        },
        reproducible: true,
        trials_count: 3,
      },
      evidence: {
        id: 'ev_probe_screenshot',
        kind: 'screenshot',
        uri: 'file:///evidence/empty_submit_probe.png',
        pii_masked: true,
        captured_at: new Date().toISOString(),
      },
      observed_at: new Date().toISOString(),
      observed_by: 'active_probe',
    };

    const probeValidation = validateApplicationObservation(probeObservation);
    expect(probeValidation.valid).toBe(true);
    expect(probeObservation.probe_execution?.reproducible).toBe(true);

    // 2. Intentar promover una regla de negocio a 'confirmed' usando la sonda como fuente autoritativa debe ser RECHAZADO por el validador
    const invalidlyPromotedRule: ExpectedRequirement = {
      id: 'req_auth_validation_banner',
      application_id: appContext.application_id,
      module_key: 'authentication',
      title: 'Mensaje de error ante formulario vacío',
      description: 'El sistema debe mostrar banner de error 422',
      category: 'business_rule',
      status: 'confirmed', // ¡Intento inválido de marcar como confirmado!
      source: 'active_probe' as unknown as ExpectedRequirement['source'], // Fuente inválida para confirmar regla de negocio
      confidence_score: 0.95,
      verified_by: 'ai_probe',
      created_at: new Date().toISOString(),
      is_active: true,
    };

    const invalidResult = validateExpectedRequirement(invalidlyPromotedRule);
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.violations.some((v) => v.code === 'EPISTEMIC_VIOLATION_PROBE_CANNOT_CONFIRM_REQUIREMENT')).toBe(true);
  });
});
