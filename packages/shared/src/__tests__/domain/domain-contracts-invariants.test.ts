/**
 * ============================================================================
 * NOTA DE ALCANCE Y DELIMITACIÓN DE DISEÑO — VNEXT-001
 * ============================================================================
 * Pruebas unitarias de validación formal de contratos e invariantes epistemológicas
 * y de seguridad del plano de dominio en memoria (@qap/shared).
 * 
 * CAPACIDADES NO IMPLEMENTADAS EN VNEXT-001 (Planificadas para VNEXT-002+):
 * - Persistencia física en SQLite y adaptadores de base de datos.
 * - Motor en vivo de crawler Playwright y navegación web real.
 * - Clasificador semántico / motor heurístico del QA Advisor en ejecución.
 * ============================================================================
 */

import { describe, it, expect } from 'vitest';
import type {
  ExpectedRequirement,
  ApplicationObservation,
  AgentInference,
  ConformityAssessment,
  RolePermissionScope,
  BrowserCleanupPolicy,
  DefectRecord,
  ActionTarget,
  DiagnosticEvidenceContract,
  DefectDiagnosisInput,
  DefectDiagnosisResult,
} from '../../domain/index.js';
import {
  validateExpectedRequirement,
  validateApplicationObservation,
  validateAgentInference,
  validateConformityAssessment,
  validateRolePermissionScope,
  validateBrowserCleanupPolicy,
  validateDefectRecord,
  validateActionTarget,
  validateConfidenceValue,
  validateObservationPayload,
  sanitizeHttpHeaders,
  SENSITIVE_HTTP_HEADERS,
  SENSITIVE_CREDENTIAL_KEYS,
} from '../../domain/index.js';

describe('VNEXT-001 / Pruebas de Contratos e Invariantes de Dominio', () => {
  const baseAppId = 'app_core_test';

  describe('1. Casos Válidos', () => {
    it('debe validar un ExpectedRequirement confirmado por desarrollador', () => {
      const validReq: ExpectedRequirement = {
        id: 'req_valid_001',
        application_id: baseAppId,
        module_key: 'payments',
        title: 'Límite diario de transferencia bancaria',
        description: 'El monto máximo por transferencia diaria es de $10,000 USD.',
        category: 'business_rule',
        status: 'confirmed',
        source: 'developer_interview',
        confidence_score: 1.0,
        verified_by: 'lead_developer',
        created_at: new Date().toISOString(),
        is_active: true,
      };

      const result = validateExpectedRequirement(validReq);
      expect(result.valid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('debe validar un ExpectedRequirement migrado desde v2.1 en estado draft con score calibrado', () => {
      // Requisito migrado de histórico que permanece en draft (no confirmado automáticamente)
      const legacyReqDraft: ExpectedRequirement = {
        id: 'req_legacy_002',
        application_id: baseAppId,
        module_key: 'invoicing',
        title: 'RFC obligatorio en facturas en México',
        description: 'Migrado desde rules.yaml con manually_edited: true.',
        category: 'business_rule',
        status: 'draft',
        source: 'legacy_manual_edit',
        confidence_score: 0.90, // Calibrado correctamente < 1.0
        verified_by: 'legacy_migration',
        created_at: '2026-08-01T00:00:00Z',
        is_active: true,
      };

      const result = validateExpectedRequirement(legacyReqDraft);
      expect(result.valid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('debe validar un ExpectedRequirement migrado desde v2.1 confirmado cuando cuenta con verification_evidence autoritativa', () => {
      // Requisito migrado que SÍ cuenta con evidencia técnica autoritativa de verificación
      const legacyReqWithEvidence: ExpectedRequirement = {
        id: 'req_legacy_003',
        application_id: baseAppId,
        module_key: 'invoicing',
        title: 'RFC obligatorio en facturas en México',
        description: 'Migrado desde rules.yaml con validación autoritativa.',
        category: 'business_rule',
        validation_status: 'confirmed',
        provenance: 'legacy_manual_edit',
        confidence: 0.90,
        verified_by: 'lead_tax_consultant',
        verification_evidence: {
          mechanism: 'developer_signoff',
          evidence_ref: 'signoff_tax_2026_08',
          verified_at: '2026-08-01T00:00:00Z',
          statement: 'Validado conforme a la regla del SAT Anexo 20.',
        },
        created_at: '2026-08-01T00:00:00Z',
        is_active: true,
      };

      const result = validateExpectedRequirement(legacyReqWithEvidence);
      expect(result.valid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('debe validar una ConformityAssessment con veredicto pass', () => {
      const validAssessment: ConformityAssessment = {
        id: 'conf_pass_001',
        requirement_id: 'req_valid_001',
        observation_ids: ['obs_001', 'obs_002'],
        verdict: 'pass',
        assessed_at: new Date().toISOString(),
        assessed_by: 'qap_engine',
        evidence: [
          {
            id: 'ev_001',
            kind: 'dom_snippet',
            pii_masked: true,
            captured_at: new Date().toISOString(),
          },
        ],
      };

      const result = validateConformityAssessment(validAssessment);
      expect(result.valid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('debe validar un DefectRecord con veredicto indeterminate debidamente justificado', () => {
      const indeterminateDefect: DefectRecord = {
        id: 'def_indet_001',
        application_id: baseAppId,
        classification: 'indeterminate',
        http_status_code: 500,
        indeterminacy_reason: 'El endpoint /api/checkout devolvió HTTP 500 sin cuerpo de error. No es posible determinar si la base de datos se cayó o si falló una validación de negocio.',
        observed_evidence: [
          {
            id: 'ev_har_001',
            kind: 'network_har',
            pii_masked: true,
            captured_at: new Date().toISOString(),
          },
        ],
        steps_to_reproduce: ['Navegar a /checkout', 'Presionar Pagar'],
        detected_at: new Date().toISOString(),
      };

      const result = validateDefectRecord(indeterminateDefect);
      expect(result.valid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('debe validar un DefectRecord concluyente (product_bug) con evidencia observada corroborada', () => {
      const conclusiveDefect: DefectRecord = {
        id: 'def_conclusive_001',
        application_id: baseAppId,
        classification: 'product_bug',
        http_status_code: 500,
        expected_requirement_id: 'req_valid_001',
        observed_evidence: [
          {
            evidence_id: 'ev_diag_001',
            type: 'dom_snippet',
            timestamp: new Date().toISOString(),
            observed_behavior: 'Botón de submit lanza excepción no controlada en el cliente',
          },
        ],
        steps_to_reproduce: ['Navegar a /payments', 'Ingresar $15000', 'Click transferir'],
        detected_at: new Date().toISOString(),
      };

      const result = validateDefectRecord(conclusiveDefect);
      expect(result.valid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('debe sanitizar encabezados sensibles y credenciales con validateObservationPayload', () => {
      const rawPayload = {
        application_id: baseAppId,
        session_token: 'active_session',
        headers: {
          Authorization: 'Bearer eyJhbGciOi...',
          Cookie: 'session_id=12345; auth=true',
          'Set-Cookie': 'session=abc',
          'X-Api-Key': 'secret_key_value',
          'Proxy-Authorization': 'Basic dXNlcjpwYXNz',
          'Content-Type': 'application/json',
          'User-Agent': 'QAP-Crawler/3.0',
        },
        network_event: {
          url: 'https://app.example.com/api/login',
          method: 'POST',
          request_headers: {
            authorization: 'Bearer secret_request_token',
            Accept: 'application/json',
          },
        },
        password: 'raw_cleartext_password',
        secret: 'vault_root_secret',
        apiKey: 'api_live_token',
        public_data: 'safe_to_view',
      };

      const validationResult = validateObservationPayload(rawPayload);
      expect(validationResult.valid).toBe(true);
      expect(validationResult.sanitized_payload).toBeDefined();

      const sanitized = validationResult.sanitized_payload as typeof rawPayload;
      // Verificación de headers sanitizados
      expect(sanitized.headers.Authorization).toBe('[REDACTED]');
      expect(sanitized.headers.Cookie).toBe('[REDACTED]');
      expect(sanitized.headers['Set-Cookie']).toBe('[REDACTED]');
      expect(sanitized.headers['X-Api-Key']).toBe('[REDACTED]');
      expect(sanitized.headers['Proxy-Authorization']).toBe('[REDACTED]');
      expect(sanitized.headers['Content-Type']).toBe('application/json');
      expect(sanitized.headers['User-Agent']).toBe('QAP-Crawler/3.0');

      // Verificación de network_event request_headers sanitizados
      expect(sanitized.network_event.request_headers.authorization).toBe('[REDACTED]');
      expect(sanitized.network_event.request_headers.Accept).toBe('application/json');

      // Verificación de credenciales top-level redactadas
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.secret).toBe('[REDACTED]');
      expect(sanitized.apiKey).toBe('[REDACTED]');
      expect(sanitized.public_data).toBe('safe_to_view');

      // Claves redactadas registradas
      expect(validationResult.redacted_keys).toContain('password');
      expect(validationResult.redacted_keys).toContain('secret');
      expect(validationResult.redacted_keys).toContain('apiKey');
      expect(validationResult.redacted_keys).toContain('headers.Authorization');
      expect(validationResult.redacted_keys).toContain('network_event.request_headers.authorization');
    });

    it('debe sanitizar encabezados sensibles con sanitizeHttpHeaders', () => {
      const headers = {
        authorization: 'Bearer test',
        'x-api-key': 'abc1234',
        'content-type': 'application/json',
      };
      const sanitized = sanitizeHttpHeaders(headers);
      expect(sanitized?.authorization).toBe('[REDACTED]');
      expect(sanitized?.['x-api-key']).toBe('[REDACTED]');
      expect(sanitized?.['content-type']).toBe('application/json');
    });
  });

  describe('2. Casos Inválidos (Malformed / Missing Fields / Out of Range)', () => {
    it('debe rechazar una inferencia con score de confianza fuera de rango (> 1.0 o < 0.0)', () => {
      const invalidInf: AgentInference = {
        id: 'inf_bad_score',
        application_id: baseAppId,
        target_type: 'flow_hypothesis',
        hypothesis: 'Hipótesis con score inválido',
        confidence_score: 1.5, // Inválido: superior a 1.0
        reasoning: 'Test de límites',
        status: 'inferred',
        supporting_observation_ids: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        requires_human_confirmation: true,
      };

      const result = validateAgentInference(invalidInf);
      expect(result.valid).toBe(false);
      expect(result.violations.some((v) => v.code === 'INVALID_CONFIDENCE_SCORE_RANGE')).toBe(true);
    });

    it('debe rechazar estrictamente NaN, strings, booleanos, infinitos y valores fuera de [0.0, 1.0] en validateConfidenceValue', () => {
      // NaN
      const nanRes = validateConfidenceValue(NaN, 'confidence');
      expect(nanRes.valid).toBe(false);
      expect(nanRes.violations.some((v) => v.code === 'INVALID_CONFIDENCE_SCORE_RANGE')).toBe(true);

      // Strings
      expect(validateConfidenceValue('0.95' as unknown as number).valid).toBe(false);
      expect(validateConfidenceValue('high' as unknown as number).valid).toBe(false);

      // Booleanos / Objetos / Arrays / Null / Undefined
      expect(validateConfidenceValue(true as unknown as number).valid).toBe(false);
      expect(validateConfidenceValue({} as unknown as number).valid).toBe(false);
      expect(validateConfidenceValue([] as unknown as number).valid).toBe(false);
      expect(validateConfidenceValue(null as unknown as number).valid).toBe(false);
      expect(validateConfidenceValue(undefined as unknown as number).valid).toBe(false);

      // Infinitos
      expect(validateConfidenceValue(Infinity).valid).toBe(false);
      expect(validateConfidenceValue(-Infinity).valid).toBe(false);

      // Límites fuera de [0.0, 1.0]
      expect(validateConfidenceValue(-0.01).valid).toBe(false);
      expect(validateConfidenceValue(1.01).valid).toBe(false);

      // Valores límite válidos
      expect(validateConfidenceValue(0.0).valid).toBe(true);
      expect(validateConfidenceValue(0.5).valid).toBe(true);
      expect(validateConfidenceValue(1.0).valid).toBe(true);
    });

    it('debe rechazar un ExpectedRequirement cuando confidence_score es NaN', () => {
      const nanReq: ExpectedRequirement = {
        id: 'req_nan_001',
        application_id: baseAppId,
        module_key: 'auth',
        title: 'Requisito con score NaN',
        description: 'Prueba de rechazo de NaN',
        category: 'functional',
        status: 'draft',
        source: 'developer_input',
        confidence_score: NaN,
        created_at: new Date().toISOString(),
        is_active: true,
      };

      const result = validateExpectedRequirement(nanReq);
      expect(result.valid).toBe(false);
      expect(result.violations.some((v) => v.code === 'INVALID_CONFIDENCE_SCORE_RANGE')).toBe(true);
    });

    it('debe rechazar payloads de observación no válidos en validateObservationPayload', () => {
      expect(validateObservationPayload(null).valid).toBe(false);
      expect(validateObservationPayload(undefined).valid).toBe(false);
      expect(validateObservationPayload('cadena_invalida').valid).toBe(false);
      expect(validateObservationPayload([1, 2, 3]).valid).toBe(false);
    });

    it('debe rechazar una observación sin referencia a evidencia técnica multimodal', () => {
      const observationWithoutEvidence = {
        id: 'obs_no_ev',
        application_id: baseAppId,
        environment_id: 'env_dev',
        kind: 'dom_element',
        observed_at: new Date().toISOString(),
        observed_by: 'crawler',
      } as unknown as ApplicationObservation;

      const result = validateApplicationObservation(observationWithoutEvidence);
      expect(result.valid).toBe(false);
      expect(result.violations.some((v) => v.code === 'OBSERVATION_REQUIRES_EVIDENCE')).toBe(true);
    });

    it('debe rechazar un veredicto indeterminate sin justificativo (indeterminacy_reason)', () => {
      const invalidAssessment: ConformityAssessment = {
        id: 'conf_bad_indet',
        requirement_id: 'req_001',
        observation_ids: ['obs_001'],
        verdict: 'indeterminate', // Requiere indeterminacy_reason
        assessed_at: new Date().toISOString(),
        assessed_by: 'qap_engine',
        evidence: [],
      };

      const result = validateConformityAssessment(invalidAssessment);
      expect(result.valid).toBe(false);
      expect(result.violations.some((v) => v.code === 'INDETERMINATE_VERDICT_REQUIRES_REASON')).toBe(true);
    });

    it('debe rechazar un ActionTarget con score de confianza negativo o NaN', () => {
      const invalidTarget: ActionTarget = {
        id: 'tgt_neg_score',
        view_id: 'view_001',
        application_id: baseAppId,
        element_type: 'button',
        selector: '#btn-submit',
        certainty: 'inferred',
        confidence_score: -0.2, // Inválido
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
      };

      const result = validateActionTarget(invalidTarget);
      expect(result.valid).toBe(false);
      expect(result.violations.some((v) => v.code === 'INVALID_CONFIDENCE_SCORE_RANGE')).toBe(true);

      const nanTarget: ActionTarget = {
        ...invalidTarget,
        confidence_score: NaN,
      };
      expect(validateActionTarget(nanTarget).valid).toBe(false);
    });
  });

  describe('3. Casos Contradictorios (Violaciones de Invariantes Arquitectónicas)', () => {
    it('Invariante R1: debe rechazar confirmed para legacy_manual_edit con verified_by sintético sin verification_evidence', () => {
      const unverifiedLegacyReq: ExpectedRequirement = {
        id: 'req_legacy_unverified',
        application_id: baseAppId,
        module_key: 'invoicing',
        title: 'RFC obligatorio en facturas en México',
        description: 'Migrado desde rules.yaml con manually_edited: true.',
        category: 'business_rule',
        status: 'confirmed', // ¡Contradicción R1! No puede confirmarse sin evidencia autoritativa
        source: 'legacy_manual_edit',
        confidence_score: 0.90,
        verified_by: 'legacy_migration', // La sola presencia de este string NO justifica confirmed
        created_at: '2026-08-01T00:00:00Z',
        is_active: true,
      };

      const result = validateExpectedRequirement(unverifiedLegacyReq);
      expect(result.valid).toBe(false);
      expect(result.violations.some((v) => v.code === 'LEGACY_MIGRATION_CONFIRMATION_WITHOUT_EVIDENCE_FORBIDDEN')).toBe(true);
    });

    it('Invariante D-011: debe rechazar promover regla a confirmed basándose en sonda activa o telemetría empírica', () => {
      const contradictoryReq: ExpectedRequirement = {
        id: 'req_contra_probe',
        application_id: baseAppId,
        module_key: 'tax',
        title: 'Cálculo de retención del 10%',
        description: 'La sonda reprodujo retención del 10%.',
        category: 'business_rule',
        status: 'confirmed', // ¡Contradicción! Una sonda no puede confirmar reglas de negocio
        source: 'active_probe' as unknown as ExpectedRequirement['source'],
        confidence_score: 1.0,
        verified_by: 'ai_probe',
        created_at: new Date().toISOString(),
        is_active: true,
      };

      const result = validateExpectedRequirement(contradictoryReq);
      expect(result.valid).toBe(false);
      expect(result.violations.some((v) => v.code === 'EPISTEMIC_VIOLATION_PROBE_CANNOT_CONFIRM_REQUIREMENT')).toBe(true);
    });

    it('Invariante D-012: debe rechazar certeza absoluta (1.0) para legacy_manual_edit', () => {
      const dogmaticLegacyReq: ExpectedRequirement = {
        id: 'req_dogma_legacy',
        application_id: baseAppId,
        module_key: 'payroll',
        title: 'Descuento de seguridad social',
        description: 'Migrado desde v2.1.',
        category: 'business_rule',
        status: 'draft',
        source: 'legacy_manual_edit',
        confidence_score: 1.0, // ¡Contradicción! D-012 prohíbe certeza absoluta automática
        verified_by: 'legacy_import',
        created_at: new Date().toISOString(),
        is_active: true,
      };

      const result = validateExpectedRequirement(dogmaticLegacyReq);
      expect(result.valid).toBe(false);
      expect(result.violations.some((v) => v.code === 'LEGACY_MANUAL_EDIT_ABSOLUTE_CERTAINTY_FORBIDDEN')).toBe(true);
    });

    it('Invariante D-007: debe rechazar almacenamiento de contraseñas en RolePermissionScope', () => {
      const leakedScope = {
        role_id: 'role_admin',
        application_id: baseAppId,
        role_name: 'Super Admin',
        permissions: ['*'],
        is_authenticated: true,
        password: 'AdminPassword123!', // ¡Contradicción! Fuga de credencial en memoria de conocimiento
      } as unknown as RolePermissionScope;

      const result = validateRolePermissionScope(leakedScope);
      expect(result.valid).toBe(false);
      expect(result.violations.some((v) => v.code === 'CREDENTIAL_LEAK_IN_KNOWLEDGE_MEMORY')).toBe(true);
    });

    it('Invariante D-007: debe rechazar política que vulnere la preservación de memoria de QAP', () => {
      const dangerousPolicy = {
        cleanup_mode: 'fresh_context',
        clear_cookies: true,
        clear_local_storage: true,
        clear_session_storage: true,
        clear_browser_cache: true,
        isolate_network: true,
        preserve_qap_knowledge: false, // ¡Contradicción! Viola la persistencia independiente de QAP
      } as unknown as BrowserCleanupPolicy;

      const result = validateBrowserCleanupPolicy(dangerousPolicy);
      expect(result.valid).toBe(false);
      expect(result.violations.some((v) => v.code === 'QAP_KNOWLEDGE_PRESERVATION_INVARIANT_VIOLATED')).toBe(true);
    });

    it('Invariante D-014: debe rechazar diagnóstico concluyente product_bug basado únicamente en código HTTP 500 sin evidencia', () => {
      const hastyDiagnosis: DefectRecord = {
        id: 'def_hasty_001',
        application_id: baseAppId,
        classification: 'product_bug', // ¡Contradicción! Diagnóstico concluyente sin corroboración
        http_status_code: 500,
        observed_evidence: [],
        steps_to_reproduce: ['GET /service'],
        detected_at: new Date().toISOString(),
      };

      const result = validateDefectRecord(hastyDiagnosis);
      expect(result.valid).toBe(false);
      expect(result.violations.some((v) => v.code === 'CONCLUSIVE_DIAGNOSIS_FROM_HTTP_CODE_FORBIDDEN')).toBe(true);
      expect(result.violations.some((v) => v.code === 'CONCLUSIVE_DIAGNOSIS_REQUIRES_EVIDENCE')).toBe(true);
    });

    it('Invariante D-014: debe desacoplar validación de HTTP 500 y rechazar cualquier diagnóstico concluyente sin evidencia', () => {
      // Con HTTP 502 Bad Gateway
      const defect502: DefectRecord = {
        id: 'def_502_bad_gateway',
        application_id: baseAppId,
        classification: 'product_bug',
        http_status_code: 502,
        observed_evidence: [], // Vacío: sin evidencia diagnóstica
        steps_to_reproduce: ['GET /gateway'],
        detected_at: new Date().toISOString(),
      };
      const result502 = validateDefectRecord(defect502);
      expect(result502.valid).toBe(false);
      expect(result502.violations.some((v) => v.code === 'CONCLUSIVE_DIAGNOSIS_REQUIRES_EVIDENCE')).toBe(true);

      // Con environment_error sin evidencia
      const envDefect: DefectRecord = {
        id: 'def_env_no_ev',
        application_id: baseAppId,
        classification: 'environment_error',
        observed_evidence: [], // Vacío
        steps_to_reproduce: ['Ping DB'],
        detected_at: new Date().toISOString(),
      };
      const resultEnv = validateDefectRecord(envDefect);
      expect(resultEnv.valid).toBe(false);
      expect(resultEnv.violations.some((v) => v.code === 'CONCLUSIVE_DIAGNOSIS_REQUIRES_EVIDENCE')).toBe(true);

      // Si no tiene evidencia, DEBE permanecer en indeterminate
      const indetDefect: DefectRecord = {
        ...envDefect,
        classification: 'indeterminate',
        indeterminacy_reason: 'Evidencias insuficientes para aislar causa raíz de caída del servicio.',
      };
      expect(validateDefectRecord(indetDefect).valid).toBe(true);
    });
  });

  describe('4. Contratos de Diagnóstico para QA Advisor (VNEXT-001 / VNEXT-002)', () => {
    it('debe estructurar contratos de entrada y salida para el clasificador semántico', () => {
      const diagnosticEvidence: DiagnosticEvidenceContract = {
        evidence_id: 'diag_ev_001',
        type: 'network_har',
        uri: 'file:///evidence/har_dump.json',
        timestamp: new Date().toISOString(),
        observed_behavior: 'Respuesta 500 con cuerpo {"error": "Deadlock detected"}',
        expected_behavior: 'Respuesta 200 con transacción confirmada',
      };

      const diagnosisInput: DefectDiagnosisInput = {
        defect_id: 'defect_qa_001',
        application_id: baseAppId,
        http_status_code: 500,
        observed_evidence: [diagnosticEvidence],
        telemetry: {
          database_connections_active: 100,
        },
      };

      expect(diagnosisInput.observed_evidence).toHaveLength(1);
      expect(diagnosisInput.observed_evidence[0]?.type).toBe('network_har');

      const diagnosisResult: DefectDiagnosisResult = {
        classification: 'product_bug',
        confidence: 0.92,
        rationale: 'Se detectó deadlock en la base de datos por colisión de transacciones simultáneas.',
        is_conclusive: true,
        recommended_actions: ['Revisar aislamiento de transacción en repositorio de órdenes'],
      };

      expect(diagnosisResult.is_conclusive).toBe(true);
      expect(diagnosisResult.confidence).toBeGreaterThan(0.9);
      expect(diagnosisResult.classification).toBe('product_bug');
    });
  });
});
