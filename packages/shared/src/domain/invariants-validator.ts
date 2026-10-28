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
 * Valida de forma estricta y defensiva en tiempo de ejecución un valor numérico de confianza.
 * Rechaza tajantemente NaN, valores no numéricos (strings, objetos, arreglos, booleanos),
 * infinitos y números fuera del intervalo [0.0, 1.0].
 */
export function validateConfidenceValue(
  confidence: unknown,
  fieldName: string = 'confidence'
): DomainValidationResult & { error?: string } {
  const violations: InvariantViolation[] = [];
  if (
    typeof confidence !== 'number' ||
    Number.isNaN(confidence) ||
    !Number.isFinite(confidence) ||
    confidence < 0.0 ||
    confidence > 1.0
  ) {
    const receivedDesc =
      typeof confidence === 'number' && Number.isNaN(confidence)
        ? 'NaN'
        : typeof confidence === 'number' && !Number.isFinite(confidence)
        ? String(confidence)
        : typeof confidence === 'string'
        ? `"${confidence}"`
        : String(confidence);

    const message = `El valor de confianza debe ser un número finito entre 0.0 y 1.0. Recibido: ${receivedDesc}`;
    violations.push({
      code: 'INVALID_CONFIDENCE_SCORE_RANGE',
      field: fieldName,
      message,
      severity: 'error',
    });
    return {
      valid: false,
      violations,
      error: message,
    };
  }

  return {
    valid: true,
    violations: [],
  };
}

/** Encabezados HTTP sensibles sujetos a sanitización en tiempo de ejecución (VNEXT-001) */
export const SENSITIVE_HTTP_HEADERS = [
  'authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'proxy-authorization',
] as const;

/** Claves canónicas de credenciales sujetas a redacción en payloads (VNEXT-001) */
export const SENSITIVE_CREDENTIAL_KEYS = [
  'password',
  'passwd',
  'secret',
  'token',
  'raw_token',
  'api_key',
  'apikey',
  'private_key',
] as const;

/** Resultado de validación y sanitización superficial de payloads */
export interface ObservationValidationResult extends DomainValidationResult {
  sanitized_payload?: unknown;
  redacted_keys: string[];
}

/**
 * Sanitiza encabezados HTTP conocidos de forma no destructiva.
 */
export function sanitizeHttpHeaders(
  headers?: Record<string, string>
): Record<string, string> | undefined {
  if (!headers || typeof headers !== 'object') return headers;
  const sanitized: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_HTTP_HEADERS.includes(lowerKey as any)) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Valida y sanitiza superficialmente un payload u observación en el límite de contrato.
 * 
 * LÍMITES DE SEGURIDAD Y FRONTERA CONTRACTUAL (VNEXT-001):
 * Esta función ejecuta una redacción superficial (shallow redaction) de encabezados HTTP
 * sensibles conocidos ('authorization', 'cookie', 'set-cookie', 'x-api-key', 'proxy-authorization')
 * y claves canónicas de credenciales de primer nivel ('password', 'token', 'secret', 'apiKey').
 * 
 * No declara ni pretende ofrecer protección integral contra filtraciones en estructuras
 * profundamente anidadas, strings serializados o payloads binarios arbitrarios.
 * La desinfección profunda (deep payload sanitization) corresponde exclusivamente al
 * pipeline de ingesta (@qap/knowledge) y a los extractores de telemetría especializados.
 */
export function validateObservationPayload(payload: unknown): ObservationValidationResult {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {
      valid: false,
      violations: [
        {
          code: 'INVALID_PAYLOAD_TYPE',
          field: 'payload',
          message: 'El payload de observación debe ser un objeto no nulo.',
          severity: 'error',
        },
      ],
      redacted_keys: [],
    };
  }

  const copy = { ...(payload as Record<string, unknown>) };
  const redacted_keys: string[] = [];

  for (const [key, value] of Object.entries(copy)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_CREDENTIAL_KEYS.includes(lowerKey as any)) {
      copy[key] = '[REDACTED]';
      redacted_keys.push(key);
    } else if (lowerKey === 'headers' && value && typeof value === 'object' && !Array.isArray(value)) {
      const sanitizedH: Record<string, unknown> = {};
      for (const [hKey, hVal] of Object.entries(value as Record<string, unknown>)) {
        if (SENSITIVE_HTTP_HEADERS.includes(hKey.toLowerCase() as any)) {
          sanitizedH[hKey] = '[REDACTED]';
          redacted_keys.push(`headers.${hKey}`);
        } else {
          sanitizedH[hKey] = hVal;
        }
      }
      copy[key] = sanitizedH;
    }
  }

  if (
    copy.network_event &&
    typeof copy.network_event === 'object' &&
    !Array.isArray(copy.network_event)
  ) {
    const netEvent = { ...(copy.network_event as Record<string, unknown>) };
    if (
      netEvent.request_headers &&
      typeof netEvent.request_headers === 'object' &&
      !Array.isArray(netEvent.request_headers)
    ) {
      const sanitizedReqH: Record<string, unknown> = {};
      for (const [hKey, hVal] of Object.entries(netEvent.request_headers as Record<string, unknown>)) {
        if (SENSITIVE_HTTP_HEADERS.includes(hKey.toLowerCase() as any)) {
          sanitizedReqH[hKey] = '[REDACTED]';
          redacted_keys.push(`network_event.request_headers.${hKey}`);
        } else {
          sanitizedReqH[hKey] = hVal;
        }
      }
      netEvent.request_headers = sanitizedReqH;
    }
    copy.network_event = netEvent;
  }

  return {
    valid: true,
    violations: [],
    sanitized_payload: copy,
    redacted_keys,
  };
}

/**
 * Valida un Requisito Esperado frente a las invariantes epistemológicas.
 * Invariante D-011: Una regla de negocio NO puede ser 'confirmed' por sondas activas o crawler.
 * Invariante D-012: 'legacy_manual_edit' no debe tener certeza absoluta (1.0).
 * Invariante R1: La mera presencia de verified_by (ej. 'legacy_migration') NO justifica confirmed
 * sin evidencia autoritativa de verificación.
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

  const status = req.validation_status ?? req.status;
  if (!status) {
    violations.push({
      code: 'REQUIRED_FIELD_MISSING',
      field: 'validation_status | status',
      message: 'El requisito esperado debe contener validation_status o status.',
      severity: 'error',
    });
  }

  const provenance = req.provenance ?? req.source;
  if (!provenance) {
    violations.push({
      code: 'REQUIRED_FIELD_MISSING',
      field: 'provenance | source',
      message: 'El requisito esperado debe contener provenance o source.',
      severity: 'error',
    });
  }

  // Invariante D-011: Prohibida la confirmación de requisitos esperados mediante sondas o telemetría empírica
  if (status === 'confirmed') {
    const invalidSources = ['active_probe', 'crawler', 'network_intercept', 'observed_telemetry'] as unknown as string[];
    if (provenance && invalidSources.includes(provenance)) {
      violations.push({
        code: 'EPISTEMIC_VIOLATION_PROBE_CANNOT_CONFIRM_REQUIREMENT',
        field: req.provenance ? 'provenance' : 'source',
        message: `Invariante D-011 violada: Una sonda de aplicación, crawler o telemetría empírica no puede promover un requisito a 'confirmed'. Origen: '${provenance}'. Se requiere confirmación del desarrollador o especificación autoritativa.`,
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

    // Invariante R1: Requisitos migrados desde legacy_manual_edit no pueden confirmarse
    // automáticamente por la sola presencia de un identificador en verified_by
    if (provenance === 'legacy_manual_edit') {
      const hasEvidence = Array.isArray(req.verification_evidence)
        ? req.verification_evidence.length > 0
        : !!req.verification_evidence;

      if (!hasEvidence) {
        violations.push({
          code: 'LEGACY_MIGRATION_CONFIRMATION_WITHOUT_EVIDENCE_FORBIDDEN',
          field: 'verification_evidence',
          message: `Invariante R1 violada: Un requisito con procedencia 'legacy_manual_edit' no puede pasar a 'confirmed' únicamente por la presencia de verified_by ('${req.verified_by ?? ''}') sin evidencia autoritativa de verificación ('verification_evidence'). Debe permanecer en 'draft' o adjuntar evidencia formal.`,
          severity: 'error',
        });
      }
    }
  }

  // Invariante D-012: legacy_manual_edit no puede tener certeza absoluta (1.0)
  const confidence = req.confidence !== undefined ? req.confidence : req.confidence_score;
  if (provenance === 'legacy_manual_edit' && typeof confidence === 'number' && !Number.isNaN(confidence)) {
    if (confidence >= 1.0) {
      violations.push({
        code: 'LEGACY_MANUAL_EDIT_ABSOLUTE_CERTAINTY_FORBIDDEN',
        field: req.confidence !== undefined ? 'confidence' : 'confidence_score',
        message: `Invariante D-012 violada: 'legacy_manual_edit' no puede tener certeza absoluta (confidence_score >= 1.0). Valor recibido: ${confidence}. Debe calibrarse (<= 0.95) y admitir revisión.`,
        severity: 'error',
      });
    }
  }

  // Validación estricta y defensiva en runtime del valor de confianza
  if (confidence !== undefined) {
    const confRes = validateConfidenceValue(
      confidence,
      req.confidence !== undefined ? 'confidence' : 'confidence_score'
    );
    if (!confRes.valid) {
      violations.push(...confRes.violations);
    }
  } else {
    violations.push({
      code: 'REQUIRED_FIELD_MISSING',
      field: 'confidence | confidence_score',
      message: 'El requisito esperado debe definir confidence o confidence_score.',
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

  const conf = inf.confidence !== undefined ? inf.confidence : inf.confidence_score;
  const confRes = validateConfidenceValue(
    conf,
    inf.confidence !== undefined ? 'confidence' : 'confidence_score'
  );
  if (!confRes.valid) {
    violations.push(...confRes.violations);
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
 * Valida el Registro de Defecto (D-014 / R2).
 * Invariante D-014: Prohibido diagnosticar conclusivamente cualquier defecto
 * sin evidencia técnica observada que respalde el diagnóstico.
 * Si la evidencia es insuficiente, vacía o ambigua, debe permanecer en 'indeterminate'.
 * Desacoplado de códigos HTTP específicos (no asume causalidad por simple HTTP 500).
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

  // Invariante D-014 / R2: Cualquier clasificación concluyente (product_bug, environment_error, etc.)
  // requiere estructuralmente evidencia observada válida y no vacía.
  if (defect.classification && defect.classification !== 'indeterminate') {
    if (!defect.observed_evidence || defect.observed_evidence.length === 0) {
      violations.push({
        code: 'CONCLUSIVE_DIAGNOSIS_REQUIRES_EVIDENCE',
        field: 'observed_evidence',
        message: `Invariante D-014 violada: No se puede emitir una clasificación concluyente ('${defect.classification}') sin evidencia técnica observada válida. Si las evidencias son insuficientes o vacías, el defecto debe permanecer en 'indeterminate'.`,
        severity: 'error',
      });

      // Preservar código histórico D-014 cuando coincida con HTTP 500 para compatibilidad hacia atrás
      if (defect.http_status_code === 500) {
        violations.push({
          code: 'CONCLUSIVE_DIAGNOSIS_FROM_HTTP_CODE_FORBIDDEN',
          field: 'classification',
          message: "Invariante D-014 violada: No se puede clasificar conclusivamente como 'product_bug' basándose únicamente en HTTP 500 sin requisito esperado violado ni evidencia técnica corroborada. Debe marcarse como 'indeterminate'.",
          severity: 'error',
        });
      }
    }
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

  const conf = target.confidence !== undefined ? target.confidence : target.confidence_score;
  const confRes = validateConfidenceValue(
    conf,
    target.confidence !== undefined ? 'confidence' : 'confidence_score'
  );
  if (!confRes.valid) {
    violations.push(...confRes.violations);
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
