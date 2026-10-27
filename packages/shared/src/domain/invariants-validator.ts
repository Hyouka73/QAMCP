/**
 * QAMCP vNext — Validador de Invariantes y Contratos de Dominio (D-007, D-011, D-012, D-014)
 * 
 * Implementa la verificación estricta de invariantes de negocio y reglas arquitectónicas
 * para garantizar que el modelo de conocimiento no acepte estados contradictorios,
 * promociones indebidas de certeza o fugas de secretos.
 */

import type {
  ExpectedRequirement,
  ApplicationObservation,
  AgentInference,
  ConformityAssessment,
} from './epistemic-planes.js';
import type {
  BrowserCleanupPolicy,
  RolePermissionScope,
  PrerequisiteDefinition,
} from './contextual-dimensions.js';
import type {
  DefectRecord,
  DomainModule,
  DomainView,
  ActionTarget,
} from './knowledge-entities.js';

export interface InvariantViolation {
  code: string;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface DomainValidationResult {
  valid: boolean;
  violations: InvariantViolation[];
}

/**
 * Valida un Requisito Esperado frente a las invariantes epistemológicas.
 * Invariante D-011: Una regla de negocio NO puede ser 'confirmed' por sondas activas o crawler.
 * Invariante D-012: 'legacy_manual_edit' no debe tener certeza absoluta (1.0).
 */
export function validateExpectedRequirement(req: ExpectedRequirement): DomainValidationResult {
  const violations: InvariantViolation[] = [];

  // Verificación de campos obligatorios
  if (!req.id || !req.application_id || !req.module_key || !req.title) {
    violations.push({
      code: 'REQUIRED_FIELD_MISSING',
      field: 'id | application_id | module_key | title',
      message: 'El requisito esperado debe contener id, application_id, module_key y title.',
      severity: 'error',
    });
  }

  // Invariante D-011: Prohibida la confirmación de requisitos esperados mediante sondas
  if (req.status === 'confirmed') {
    const invalidSources = ['active_probe', 'crawler', 'network_intercept'] as unknown as string[];
    if (invalidSources.includes(req.source)) {
      violations.push({
        code: 'EPISTEMIC_VIOLATION_PROBE_CANNOT_CONFIRM_REQUIREMENT',
        field: 'source',
        message: `Invariante D-011 violada: Una sonda de aplicación o crawler no puede promover un requisito a 'confirmed'. Origen: '${req.source}'. Se requiere confirmación del desarrollador o especificación autoritativa.`,
        severity: 'error',
      });
    }

    if (!req.verified_by) {
      violations.push({
        code: 'CONFIRMED_REQUIREMENT_MISSING_VERIFIER',
        field: 'verified_by',
        message: 'Un requisito confirmado debe indicar quién lo verificó (ej. developer, qa_lead).',
        severity: 'error',
      });
    }
  }

  // Invariante D-012: legacy_manual_edit no puede tener certeza absoluta (1.0)
  if (req.source === 'legacy_manual_edit') {
    if (req.confidence_score >= 1.0) {
      violations.push({
        code: 'LEGACY_MANUAL_EDIT_ABSOLUTE_CERTAINTY_FORBIDDEN',
        field: 'confidence_score',
        message: `Invariante D-012 violada: 'legacy_manual_edit' no puede tener certeza absoluta (confidence_score >= 1.0). Valor recibido: ${req.confidence_score}. Debe calibrarse (<= 0.95) y admitir revisión.`,
        severity: 'error',
      });
    }
  }

  // Rango de confianza
  if (req.confidence_score < 0 || req.confidence_score > 1.0) {
    violations.push({
      code: 'INVALID_CONFIDENCE_SCORE_RANGE',
      field: 'confidence_score',
      message: `El score de confianza debe estar entre 0.0 y 1.0. Recibido: ${req.confidence_score}`,
      severity: 'error',
    });
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

/**
 * Valida una Inferencia del Agente.
 */
export function validateAgentInference(inf: AgentInference): DomainValidationResult {
  const violations: InvariantViolation[] = [];

  if (!inf.id || !inf.application_id || !inf.hypothesis) {
    violations.push({
      code: 'REQUIRED_FIELD_MISSING',
      field: 'id | application_id | hypothesis',
      message: 'La inferencia debe contener id, application_id e hypothesis.',
      severity: 'error',
    });
  }

  if (inf.confidence_score < 0 || inf.confidence_score > 1.0) {
    violations.push({
      code: 'INVALID_CONFIDENCE_SCORE_RANGE',
      field: 'confidence_score',
      message: `El score de confianza de la inferencia debe estar entre 0.0 y 1.0. Recibido: ${inf.confidence_score}`,
      severity: 'error',
    });
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

/**
 * Valida una Observación de la Aplicación.
 */
export function validateApplicationObservation(obs: ApplicationObservation): DomainValidationResult {
  const violations: InvariantViolation[] = [];

  if (!obs.id || !obs.application_id || !obs.environment_id || !obs.kind) {
    violations.push({
      code: 'REQUIRED_FIELD_MISSING',
      field: 'id | application_id | environment_id | kind',
      message: 'La observación debe contener id, application_id, environment_id y kind.',
      severity: 'error',
    });
  }

  if (!obs.evidence || !obs.evidence.id) {
    violations.push({
      code: 'OBSERVATION_REQUIRES_EVIDENCE',
      field: 'evidence',
      message: 'Toda observación empírica debe estar vinculada a una referencia de evidencia multimodal.',
      severity: 'error',
    });
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

/**
 * Valida una Evaluación de Conformidad.
 */
export function validateConformityAssessment(assessment: ConformityAssessment): DomainValidationResult {
  const violations: InvariantViolation[] = [];

  if (!assessment.id || !assessment.requirement_id || !assessment.verdict) {
    violations.push({
      code: 'REQUIRED_FIELD_MISSING',
      field: 'id | requirement_id | verdict',
      message: 'La evaluación de conformidad debe contener id, requirement_id y verdict.',
      severity: 'error',
    });
  }

  // Invariante: Si el veredicto es 'indeterminate', DEBE especificar el motivo de indeterminación
  if (assessment.verdict === 'indeterminate' && !assessment.indeterminacy_reason) {
    violations.push({
      code: 'INDETERMINATE_VERDICT_REQUIRES_REASON',
      field: 'indeterminacy_reason',
      message: "Un veredicto 'indeterminate' debe especificar obligatoriamente 'indeterminacy_reason'.",
      severity: 'error',
    });
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

/**
 * Valida la Política de Limpieza del Navegador (D-007).
 * Invariante D-007: La memoria de QAP reside fuera del navegador y NUNCA se borra al limpiar caché web.
 */
export function validateBrowserCleanupPolicy(policy: BrowserCleanupPolicy): DomainValidationResult {
  const violations: InvariantViolation[] = [];

  // preserve_qap_knowledge DEBE ser true
  if (policy.preserve_qap_knowledge !== true) {
    violations.push({
      code: 'QAP_KNOWLEDGE_PRESERVATION_INVARIANT_VIOLATED',
      field: 'preserve_qap_knowledge',
      message: 'Invariante D-007 violada: preserve_qap_knowledge debe ser siempre true. Limpiar la caché o almacenamiento del navegador no debe borrar la memoria de QAP.',
      severity: 'error',
    });
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

/**
 * Valida el Alcance de Roles y Permisos (D-007).
 * Invariante D-007: Prohibido almacenar contraseñas en texto plano en la memoria de conocimiento.
 */
export function validateRolePermissionScope(scope: RolePermissionScope): DomainValidationResult {
  const violations: InvariantViolation[] = [];

  // Escanear por claves peligrosas tipo password, secret, token plano en el objeto
  const scopeObj = scope as unknown as Record<string, unknown>;
  const dangerousKeys = ['password', 'passwd', 'secret', 'api_key', 'raw_token', 'private_key'];

  for (const key of dangerousKeys) {
    if (key in scopeObj && scopeObj[key] !== undefined && scopeObj[key] !== null) {
      violations.push({
        code: 'CREDENTIAL_LEAK_IN_KNOWLEDGE_MEMORY',
        field: key,
        message: `Invariante D-007 violada: El campo '${key}' está prohibido en la memoria de conocimiento de QAP. Las credenciales deben residir en la bóveda de secretos y referenciarse únicamente por 'auth_profile_id'.`,
        severity: 'error',
      });
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

/**
 * Valida los Prerrequisitos de Prueba.
 */
export function validatePrerequisiteDefinition(prereq: PrerequisiteDefinition): DomainValidationResult {
  const violations: InvariantViolation[] = [];

  const prereqObj = prereq as unknown as Record<string, unknown>;
  const dangerousKeys = ['password', 'passwd', 'secret', 'raw_credentials'];

  for (const key of dangerousKeys) {
    if (key in prereqObj && prereqObj[key] !== undefined && prereqObj[key] !== null) {
      violations.push({
        code: 'CREDENTIAL_LEAK_IN_PREREQUISITE',
        field: key,
        message: `Invariante D-007 violada: No se permiten credenciales directas en prerrequisitos. Use 'required_role_id' o 'depends_on_flow_id'.`,
        severity: 'error',
      });
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

/**
 * Valida el Registro de Defecto (D-014).
 * Invariante D-014: Prohibido diagnosticar conclusivamente 'product_bug' basándose exclusivamente
 * en un código HTTP 500 sin comprobación de regla de negocio esperada.
 */
export function validateDefectRecord(defect: DefectRecord): DomainValidationResult {
  const violations: InvariantViolation[] = [];

  if (!defect.id || !defect.application_id || !defect.classification) {
    violations.push({
      code: 'REQUIRED_FIELD_MISSING',
      field: 'id | application_id | classification',
      message: 'El defecto debe contener id, application_id y classification.',
      severity: 'error',
    });
  }

  // Invariante D-014: HTTP 500 sin requisito esperado violado ni corroboración no puede ser concluyente product_bug
  if (
    defect.classification === 'product_bug' &&
    defect.http_status_code === 500 &&
    !defect.expected_requirement_id &&
    (!defect.observed_evidence || defect.observed_evidence.length === 0)
  ) {
    violations.push({
      code: 'CONCLUSIVE_DIAGNOSIS_FROM_HTTP_CODE_FORBIDDEN',
      field: 'classification',
      message: "Invariante D-014 violada: No se puede clasificar conclusivamente como 'product_bug' basándose únicamente en HTTP 500 sin requisito esperado violado ni evidencia técnica corroborada. Debe marcarse como 'indeterminate'.",
      severity: 'error',
    });
  }

  // Si es indeterminate, debe registrar indeterminacy_reason
  if (defect.classification === 'indeterminate' && !defect.indeterminacy_reason) {
    violations.push({
      code: 'INDETERMINATE_DEFECT_REQUIRES_REASON',
      field: 'indeterminacy_reason',
      message: "Un defecto clasificado como 'indeterminate' debe indicar obligatoriamente 'indeterminacy_reason'.",
      severity: 'error',
    });
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

/**
 * Valida un Módulo de Dominio.
 */
export function validateDomainModule(module: DomainModule): DomainValidationResult {
  const violations: InvariantViolation[] = [];

  if (!module.id || !module.application_id || !module.key || !module.title) {
    violations.push({
      code: 'REQUIRED_FIELD_MISSING',
      field: 'id | application_id | key | title',
      message: 'El módulo debe contener id, application_id, key y title.',
      severity: 'error',
    });
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

/**
 * Valida una Vista de Dominio.
 */
export function validateDomainView(view: DomainView): DomainValidationResult {
  const violations: InvariantViolation[] = [];

  if (!view.id || !view.module_id || !view.application_id || !view.route_pattern) {
    violations.push({
      code: 'REQUIRED_FIELD_MISSING',
      field: 'id | module_id | application_id | route_pattern',
      message: 'La vista debe contener id, module_id, application_id y route_pattern.',
      severity: 'error',
    });
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

/**
 * Valida un Selector / ActionTarget.
 */
export function validateActionTarget(target: ActionTarget): DomainValidationResult {
  const violations: InvariantViolation[] = [];

  if (!target.id || !target.view_id || !target.selector || !target.element_type) {
    violations.push({
      code: 'REQUIRED_FIELD_MISSING',
      field: 'id | view_id | selector | element_type',
      message: 'El ActionTarget debe contener id, view_id, selector y element_type.',
      severity: 'error',
    });
  }

  if (target.confidence_score < 0 || target.confidence_score > 1.0) {
    violations.push({
      code: 'INVALID_CONFIDENCE_SCORE_RANGE',
      field: 'confidence_score',
      message: `El score de confianza debe estar entre 0.0 y 1.0. Recibido: ${target.confidence_score}`,
      severity: 'error',
    });
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

/**
 * Valida que una actualización preserve la trazabilidad histórica de conocimiento (no borrado ciego).
 */
export function validateHistoricalPreservation<T extends { id: string; superseded_by?: string; is_active: boolean }>(
  previousEntity: T,
  updatedEntityId: string,
  isEntityInvalidated: boolean
): DomainValidationResult {
  const violations: InvariantViolation[] = [];

  if (isEntityInvalidated) {
    if (!previousEntity.superseded_by) {
      violations.push({
        code: 'INVALIDATED_KNOWLEDGE_MUST_RECORD_SUPERSEDED_BY',
        field: 'superseded_by',
        message: `El conocimiento invalidado (ID: ${previousEntity.id}) debe registrar 'superseded_by' apuntando a la nueva entidad (esperado: ${updatedEntityId}) para preservar el rastro de auditoría histórica.`,
        severity: 'error',
      });
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}
