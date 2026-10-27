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

    it('debe validar un ExpectedRequirement migrado desde v2.1 con score calibrado', () => {
      const legacyReq: ExpectedRequirement = {
        id: 'req_legacy_002',
        application_id: baseAppId,
        module_key: 'invoicing',
        title: 'RFC obligatorio en facturas en México',
        description: 'Migrado desde rules.yaml con manually_edited: true.',
        category: 'business_rule',
        status: 'confirmed',
        source: 'legacy_manual_edit',
        confidence_score: 0.90, // Calibrado correctamente < 1.0
        verified_by: 'legacy_migration',
        created_at: '2026-08-01T00:00:00Z',
        is_active: true,
      };

      const result = validateExpectedRequirement(legacyReq);
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

    it('debe rechazar un ActionTarget con score de confianza negativo', () => {
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
    });
  });

  describe('3. Casos Contradictorios (Violaciones de Invariantes Arquitectónicas)', () => {
    it('Invariante D-011: debe rechazar promover regla a confirmed basándose en sonda activa', () => {
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
        status: 'confirmed',
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

    it('Invariante D-014: debe rechazar diagnóstico concluyente product_bug basado únicamente en código HTTP 500', () => {
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
    });
  });
});
