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
  RequirementCategory,
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
import type {
  GapAbsenceType,
  GapStatus,
} from './coverage-models.js';
import { GAP_ABSENCE_TYPES, GAP_STATUSES } from './coverage-models.js';



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

const VALID_REQUIREMENT_CATEGORIES: ReadonlySet<RequirementCategory> = new Set<RequirementCategory>([
  'functional',
  'business_rule',
  'security',
  'ui',
  'ux',
  'regression',
  'performance',
]);

const FORBIDDEN_WIRE_AUTHORIZATION_KEYS = [
  'approvalId',
  'approval_id',
  'signature',
  'decision_id',
  'decisionId',
  'decided_by',
  'decidedBy',
];

/**
 * Valida de forma estricta un comando de cierre canónico (CanonicalClosureCommand) en la frontera MCP (R3 / Enmienda 1).
 * Rechaza campos de autorización inyectados por el cliente, acciones desconocidas y justificaciones no sustantivas (< 15 chars).
 */
export function validateCanonicalClosureCommand(command: unknown): DomainValidationResult {
  const violations: InvariantViolation[] = [];

  if (!command || typeof command !== 'object' || Array.isArray(command)) {
    return {
      valid: false,
      violations: [
        {
          code: 'COMMAND_OBJECT_REQUIRED',
          field: 'command',
          message: 'CanonicalClosureCommand debe ser un objeto no nulo.',
          severity: 'error',
        },
      ],
    };
  }

  const rec = command as Record<string, unknown>;

  // Detectar inyección de autorización por el cliente
  for (const forbiddenKey of FORBIDDEN_WIRE_AUTHORIZATION_KEYS) {
    if (Object.hasOwn(rec, forbiddenKey)) {
      violations.push({
        code: 'CLIENT_AUTHORIZATION_INJECTION_FORBIDDEN',
        field: forbiddenKey,
        message: `El cliente MCP no puede inyectar campos de autorización '${forbiddenKey}'. La autoridad emana exclusivamente del host review gateway.`,
        severity: 'error',
      });
    }
  }

  const action = rec.action;
  const validActions = ['evaluate', 'close', 'waive', 'accept_gaps', 'declare_non_applicable'];
  if (typeof action !== 'string' || !validActions.includes(action)) {
    violations.push({
      code: 'INVALID_COMMAND_ACTION',
      field: 'action',
      message: `La acción del comando debe ser una de: ${validActions.join(', ')}. Recibido: ${String(action)}`,
      severity: 'error',
    });
    return { valid: false, violations };
  }

  const allowedKeysByAction: Record<string, readonly string[]> = {
    evaluate: ['action'],
    close: ['action'],
    waive: ['action', 'reason'],
    accept_gaps: ['action', 'accepted_gaps'],
    declare_non_applicable: ['action', 'decisions'],
  };

  const allowedKeys = allowedKeysByAction[action];
  for (const key of Object.keys(rec)) {
    if (!allowedKeys.includes(key) && !FORBIDDEN_WIRE_AUTHORIZATION_KEYS.includes(key)) {
      violations.push({
        code: 'UNEXPECTED_COMMAND_FIELD',
        field: key,
        message: `El campo '${key}' no está permitido para la acción '${action}'.`,
        severity: 'error',
      });
    }
  }

  if (action === 'waive') {
    const reason = rec.reason;
    if (typeof reason !== 'string' || reason.trim().length === 0) {
      violations.push({
        code: 'WAIVER_REASON_REQUIRED',
        field: 'reason',
        message: 'La acción waive requiere un motivo explicativo.',
        severity: 'error',
      });
    } else if (reason.trim().length < 15) {
      violations.push({
        code: 'SUBSTANTIVE_WAIVER_REASON_REQUIRED',
        field: 'reason',
        message: 'El motivo de renuncia debe ser sustantivo (mínimo 15 caracteres no vacíos).',
        severity: 'error',
      });
    }
  } else if (action === 'accept_gaps') {
    const acceptedGaps = rec.accepted_gaps;
    if (!Array.isArray(acceptedGaps) || acceptedGaps.length === 0) {
      violations.push({
        code: 'ACCEPTED_GAPS_LIST_REQUIRED',
        field: 'accepted_gaps',
        message: 'La acción accept_gaps requiere un arreglo no vacío de brechas aceptadas.',
        severity: 'error',
      });
    } else {
      acceptedGaps.forEach((item, idx) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          violations.push({
            code: 'INVALID_ACCEPTED_GAP_ENTRY',
            field: `accepted_gaps[${idx}]`,
            message: 'Cada entrada en accepted_gaps debe ser un objeto.',
            severity: 'error',
          });
          return;
        }
        const gapRec = item as Record<string, unknown>;
        if (typeof gapRec.gap_id !== 'string' || gapRec.gap_id.trim().length === 0) {
          violations.push({
            code: 'GAP_ID_REQUIRED',
            field: `accepted_gaps[${idx}].gap_id`,
            message: 'Cada brecha debe especificar un gap_id válido.',
            severity: 'error',
          });
        }
        const gapReason = gapRec.reason;
        if (typeof gapReason !== 'string' || gapReason.trim().length === 0) {
          violations.push({
            code: 'GAP_REASON_REQUIRED',
            field: `accepted_gaps[${idx}].reason`,
            message: 'Cada brecha aceptada debe especificar un motivo.',
            severity: 'error',
          });
        } else if (gapReason.trim().length < 15) {
          violations.push({
            code: 'SUBSTANTIVE_GAP_ACCEPTANCE_REASON_REQUIRED',
            field: `accepted_gaps[${idx}].reason`,
            message: 'El motivo de aceptación de brecha debe ser sustantivo (mínimo 15 caracteres no vacíos).',
            severity: 'error',
          });
        }
      });
    }
  } else if (action === 'declare_non_applicable') {
    const decisions = rec.decisions;
    if (!Array.isArray(decisions) || decisions.length === 0) {
      violations.push({
        code: 'APPLICABILITY_DECISIONS_REQUIRED',
        field: 'decisions',
        message: 'La acción declare_non_applicable requiere un arreglo no vacío de decisiones.',
        severity: 'error',
      });
    } else {
      decisions.forEach((item, idx) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          violations.push({
            code: 'INVALID_DECISION_ENTRY',
            field: `decisions[${idx}]`,
            message: 'Cada entrada en decisions debe ser un objeto.',
            severity: 'error',
          });
          return;
        }
        const decRec = item as Record<string, unknown>;
        if (typeof decRec.category !== 'string' || !VALID_REQUIREMENT_CATEGORIES.has(decRec.category as RequirementCategory)) {
          violations.push({
            code: 'INVALID_DECISION_CATEGORY',
            field: `decisions[${idx}].category`,
            message: `Categoría inválida: ${String(decRec.category)}. Debe ser una de las categorías formales.`,
            severity: 'error',
          });
        }
        const decReason = decRec.reason;
        if (typeof decReason !== 'string' || decReason.trim().length === 0) {
          violations.push({
            code: 'DECISION_REASON_REQUIRED',
            field: `decisions[${idx}].reason`,
            message: 'Cada declaración de no aplicabilidad debe especificar un motivo.',
            severity: 'error',
          });
        } else if (decReason.trim().length < 15) {
          violations.push({
            code: 'SUBSTANTIVE_APPLICABILITY_REASON_REQUIRED',
            field: `decisions[${idx}].reason`,
            message: 'El motivo de no aplicabilidad debe ser sustantivo (mínimo 15 caracteres no vacíos).',
            severity: 'error',
          });
        }
      });
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

/**
 * Valida de forma estricta una brecha canónica (CanonicalGap) (R2 / Enmienda 5).
 * Enforce: gap.absence_type === 'accepted_gap' ==> gap.status === 'accepted' && !!gap.acceptance_receipt.
 */
export function validateCanonicalGap(gap: unknown): DomainValidationResult {
  const violations: InvariantViolation[] = [];

  if (!gap || typeof gap !== 'object' || Array.isArray(gap)) {
    return {
      valid: false,
      violations: [
        {
          code: 'GAP_OBJECT_REQUIRED',
          field: 'gap',
          message: 'CanonicalGap debe ser un objeto no nulo.',
          severity: 'error',
        },
      ],
    };
  }

  const g = gap as Record<string, unknown>;

  if (typeof g.id !== 'string' || g.id.trim().length === 0) {
    violations.push({
      code: 'GAP_ID_REQUIRED',
      field: 'id',
      message: 'CanonicalGap requiere un ID estable no vacío.',
      severity: 'error',
    });
  }

  if (typeof g.module_key !== 'string' || g.module_key.trim().length === 0) {
    violations.push({
      code: 'GAP_MODULE_KEY_REQUIRED',
      field: 'module_key',
      message: 'CanonicalGap requiere un module_key no vacío.',
      severity: 'error',
    });
  }

  if (typeof g.category !== 'string' || !VALID_REQUIREMENT_CATEGORIES.has(g.category as RequirementCategory)) {
    violations.push({
      code: 'INVALID_GAP_CATEGORY',
      field: 'category',
      message: `Categoría de brecha inválida: ${String(g.category)}.`,
      severity: 'error',
    });
  }

  if (typeof g.absence_type !== 'string' || !GAP_ABSENCE_TYPES.includes(g.absence_type as GapAbsenceType)) {
    violations.push({
      code: 'INVALID_GAP_ABSENCE_TYPE',
      field: 'absence_type',
      message: `Tipo de ausencia inválido: ${String(g.absence_type)}. Debe ser uno de los 8 tipos formales.`,
      severity: 'error',
    });
  }

  if (typeof g.status !== 'string' || !GAP_STATUSES.includes(g.status as GapStatus)) {
    violations.push({
      code: 'INVALID_GAP_STATUS',
      field: 'status',
      message: `Estado de brecha inválido: ${String(g.status)}. Debe ser 'unaddressed', 'accepted' o 'deferred'.`,
      severity: 'error',
    });
  }

  if (typeof g.reason !== 'string' || g.reason.trim().length === 0) {
    violations.push({
      code: 'GAP_REASON_REQUIRED',
      field: 'reason',
      message: 'CanonicalGap requiere un motivo explícito.',
      severity: 'error',
    });
  }

  if (!Array.isArray(g.related_requirement_ids)) {
    violations.push({
      code: 'GAP_RELATED_REQUIREMENTS_REQUIRED',
      field: 'related_requirement_ids',
      message: 'related_requirement_ids debe ser un arreglo.',
      severity: 'error',
    });
  }

  if (g.provenance !== 'canonical_coverage_evaluator') {
    violations.push({
      code: 'INVALID_GAP_PROVENANCE',
      field: 'provenance',
      message: "La procedencia de CanonicalGap debe ser 'canonical_coverage_evaluator'.",
      severity: 'error',
    });
  }

  if (typeof g.created_at !== 'string' || Number.isNaN(Date.parse(g.created_at))) {
    violations.push({
      code: 'INVALID_GAP_CREATED_AT',
      field: 'created_at',
      message: 'created_at debe ser una fecha ISO-8601 válida.',
      severity: 'error',
    });
  }

  // Enmienda 5: Enforce ausencia/estado coherente y recibo de aceptación
  if (g.absence_type === 'accepted_gap') {
    if (g.status !== 'accepted') {
      violations.push({
        code: 'ACCEPTED_GAP_STATUS_MISMATCH',
        field: 'status',
        message: "Una brecha con absence_type 'accepted_gap' debe tener status 'accepted'.",
        severity: 'error',
      });
    }
    if (typeof g.acceptance_receipt !== 'string' || g.acceptance_receipt.trim().length === 0) {
      violations.push({
        code: 'ACCEPTED_GAP_RECEIPT_REQUIRED',
        field: 'acceptance_receipt',
        message: "Una brecha con absence_type 'accepted_gap' debe incluir un acceptance_receipt no vacío.",
        severity: 'error',
      });
    }
  }

  if (g.status === 'accepted') {
    if (typeof g.acceptance_receipt !== 'string' || g.acceptance_receipt.trim().length === 0) {
      violations.push({
        code: 'ACCEPTED_GAP_RECEIPT_REQUIRED',
        field: 'acceptance_receipt',
        message: "Una brecha con status 'accepted' debe incluir un acceptance_receipt no vacío.",
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
 * Valida una decisión autoritativa de aplicabilidad de categoría (R1 / R2).
 */
export function validateCategoryApplicabilityDecision(decision: unknown): DomainValidationResult {
  const violations: InvariantViolation[] = [];

  if (!decision || typeof decision !== 'object' || Array.isArray(decision)) {
    return {
      valid: false,
      violations: [
        {
          code: 'DECISION_OBJECT_REQUIRED',
          field: 'decision',
          message: 'CategoryApplicabilityDecision debe ser un objeto no nulo.',
          severity: 'error',
        },
      ],
    };
  }

  const d = decision as Record<string, unknown>;

  if (typeof d.category !== 'string' || !VALID_REQUIREMENT_CATEGORIES.has(d.category as RequirementCategory)) {
    violations.push({
      code: 'INVALID_DECISION_CATEGORY',
      field: 'category',
      message: `Categoría inválida: ${String(d.category)}.`,
      severity: 'error',
    });
  }

  if (typeof d.applicable !== 'boolean') {
    violations.push({
      code: 'DECISION_APPLICABLE_BOOLEAN_REQUIRED',
      field: 'applicable',
      message: 'applicable debe ser un valor booleano.',
      severity: 'error',
    });
  }

  if (typeof d.reason !== 'string' || d.reason.trim().length === 0) {
    violations.push({
      code: 'DECISION_REASON_REQUIRED',
      field: 'reason',
      message: 'La decisión requiere un motivo explícito.',
      severity: 'error',
    });
  } else if (d.reason.trim().length < 15) {
    violations.push({
      code: 'SUBSTANTIVE_APPLICABILITY_REASON_REQUIRED',
      field: 'reason',
      message: 'El motivo de aplicabilidad debe ser sustantivo (mínimo 15 caracteres no vacíos).',
      severity: 'error',
    });
  }

  if (typeof d.decided_by !== 'string' || d.decided_by.trim().length === 0) {
    violations.push({
      code: 'DECISION_DECIDED_BY_REQUIRED',
      field: 'decided_by',
      message: 'decided_by debe indicar la identidad autoritativa del host.',
      severity: 'error',
    });
  }

  if (typeof d.decision_id !== 'string' || d.decision_id.trim().length === 0) {
    violations.push({
      code: 'DECISION_ID_REQUIRED',
      field: 'decision_id',
      message: 'decision_id debe ser un identificador único no vacío.',
      severity: 'error',
    });
  }

  if (typeof d.decided_at !== 'string' || Number.isNaN(Date.parse(d.decided_at))) {
    violations.push({
      code: 'INVALID_DECISION_DATE',
      field: 'decided_at',
      message: 'decided_at debe ser una fecha ISO-8601 válida.',
      severity: 'error',
    });
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

/**
 * Valida de forma estricta los invariantes de CanonicalCoverageAssessment (R1 / R2 / Enmienda 6 / Mandato de Integridad).
 * Enforces:
 * - Zero execution coverage certification (strictly 'not_executed', 0 passed).
 * - Tripartite coverage separation.
 * - Closure verdict invariants (cannot be ready_for_closure with unaddressed gaps or pending requirements).
 * - Category specification statuses have no is_waived.
 */
export function validateCoverageAssessmentInvariants(assessment: unknown): DomainValidationResult {
  const violations: InvariantViolation[] = [];

  if (!assessment || typeof assessment !== 'object' || Array.isArray(assessment)) {
    return {
      valid: false,
      violations: [
        {
          code: 'ASSESSMENT_OBJECT_REQUIRED',
          field: 'assessment',
          message: 'CanonicalCoverageAssessment debe ser un objeto no nulo.',
          severity: 'error',
        },
      ],
    };
  }

  const a = assessment as Record<string, unknown>;

  if (typeof a.module_key !== 'string' || a.module_key.trim().length === 0) {
    violations.push({ code: 'MODULE_KEY_REQUIRED', field: 'module_key', message: 'module_key requerido.', severity: 'error' });
  }

  if (typeof a.module_id !== 'string' || a.module_id.trim().length === 0) {
    violations.push({ code: 'MODULE_ID_REQUIRED', field: 'module_id', message: 'module_id requerido.', severity: 'error' });
  }

  if (typeof a.module_revision !== 'number' || !Number.isInteger(a.module_revision) || a.module_revision <= 0) {
    violations.push({ code: 'INVALID_MODULE_REVISION', field: 'module_revision', message: 'module_revision debe ser entero positivo.', severity: 'error' });
  }

  if (typeof a.application_id !== 'string' || a.application_id.trim().length === 0) {
    violations.push({ code: 'APPLICATION_ID_REQUIRED', field: 'application_id', message: 'application_id requerido.', severity: 'error' });
  }

  if (typeof a.environment_id !== 'string' || a.environment_id.trim().length === 0) {
    violations.push({ code: 'ENVIRONMENT_ID_REQUIRED', field: 'environment_id', message: 'environment_id requerido.', severity: 'error' });
  }

  if (a.assessed_by !== 'canonical_coverage_service') {
    violations.push({ code: 'INVALID_ASSESSED_BY', field: 'assessed_by', message: "assessed_by debe ser 'canonical_coverage_service'.", severity: 'error' });
  }

  if (typeof a.coverage_digest !== 'string' || !/^[0-9a-f]{64}$/i.test(a.coverage_digest)) {
    violations.push({
      code: 'INVALID_COVERAGE_DIGEST',
      field: 'coverage_digest',
      message: 'coverage_digest debe ser un hash SHA-256 en formato hexadecimal de 64 caracteres.',
      severity: 'error',
    });
  }

  // 1. INVARIANTE MANDATORIO DE EJECUCIÓN CERO (R1 / Mandato de Integridad)
  const exec = a.execution_coverage as Record<string, unknown> | undefined;
  if (!exec || typeof exec !== 'object') {
    violations.push({
      code: 'EXECUTION_COVERAGE_REQUIRED',
      field: 'execution_coverage',
      message: 'execution_coverage debe estar presente en el assessment.',
      severity: 'error',
    });
  } else {
    if (exec.status !== 'not_executed') {
      violations.push({
        code: 'EXECUTION_COVERAGE_UNVERIFIED_FORBIDDEN',
        field: 'execution_coverage.status',
        message: "En VNEXT-013-R5 la cobertura de ejecución debe ser estrictamente 'not_executed'. Certificar ejecución sin runner es una violación grave de integridad.",
        severity: 'error',
      });
    }
    if (exec.executed_count !== 0 || exec.passed_count !== 0 || exec.failed_count !== 0 || exec.indeterminate_count !== 0) {
      violations.push({
        code: 'EXECUTION_VERDICTS_FORBIDDEN',
        field: 'execution_coverage',
        message: 'No se permiten conteos de ejecución distintos de cero en R5.',
        severity: 'error',
      });
    }
  }

  // 2. INVARIANTES DE COBERTURA DE ESPECIFICACIÓN
  const spec = a.specification_coverage as Record<string, unknown> | undefined;
  if (!spec || typeof spec !== 'object') {
    violations.push({
      code: 'SPECIFICATION_COVERAGE_REQUIRED',
      field: 'specification_coverage',
      message: 'specification_coverage debe ser un objeto.',
      severity: 'error',
    });
  } else {
    const totalGaps = spec.total_gaps_count as number;
    const unaddressedGaps = spec.unaddressed_gaps_count as number;
    const acceptedGaps = spec.accepted_gaps_count as number;
    if (typeof totalGaps === 'number' && typeof unaddressedGaps === 'number' && typeof acceptedGaps === 'number') {
      if (totalGaps !== unaddressedGaps + acceptedGaps) {
        violations.push({
          code: 'GAP_COUNT_INCONSISTENCY',
          field: 'specification_coverage.total_gaps_count',
          message: `total_gaps_count (${totalGaps}) debe ser igual a la suma de unaddressed (${unaddressedGaps}) + accepted (${acceptedGaps}).`,
          severity: 'error',
        });
      }
    }

    // Enmienda 6: Verificar que ningún category_status contenga is_waived
    const catStatuses = spec.category_statuses;
    if (Array.isArray(catStatuses)) {
      catStatuses.forEach((cs, idx) => {
        if (cs && typeof cs === 'object' && Object.hasOwn(cs, 'is_waived')) {
          const isWaived = (cs as Record<string, unknown>).is_waived;
          if (isWaived !== false) {
            violations.push({
              code: 'CATEGORY_WAIVER_FORBIDDEN',
              field: `specification_coverage.category_statuses[${idx}].is_waived`,
              message: 'Las categorías individuales no admiten renuncia (is_waived). Solo el módulo completo puede ser renunciado.',
              severity: 'error',
            });
          }
        }
      });
    }

    // Invariantes de veredicto de cierre
    const verdict = a.closure_verdict;
    if (verdict === 'ready_for_closure') {
      if (unaddressedGaps > 0) {
        violations.push({
          code: 'READY_FOR_CLOSURE_WITH_UNADDRESSED_GAPS_FORBIDDEN',
          field: 'closure_verdict',
          message: `No se puede dictaminar 'ready_for_closure' con ${unaddressedGaps} brechas no abordadas.`,
          severity: 'error',
        });
      }
      const pendingReqs = spec.pending_requirements_count as number;
      if (pendingReqs > 0) {
        violations.push({
          code: 'READY_FOR_CLOSURE_WITH_PENDING_REQUIREMENTS_FORBIDDEN',
          field: 'closure_verdict',
          message: `No se puede dictaminar 'ready_for_closure' con ${pendingReqs} requisitos pendientes.`,
          severity: 'error',
        });
      }
      if (spec.status !== 'complete') {
        violations.push({
          code: 'READY_FOR_CLOSURE_INCOMPLETE_SPECIFICATION',
          field: 'closure_verdict',
          message: "ready_for_closure requiere que specification_coverage.status sea 'complete'.",
          severity: 'error',
        });
      }
    } else if (verdict === 'blocked_by_gaps') {
      if (unaddressedGaps === 0) {
        violations.push({
          code: 'BLOCKED_BY_GAPS_WITHOUT_GAPS',
          field: 'closure_verdict',
          message: "blocked_by_gaps requiere al menos una brecha no abordada.",
          severity: 'error',
        });
      }
    }
  }

  // 3. VALIDAR BRECHAS
  if (Array.isArray(a.gaps)) {
    a.gaps.forEach((gap, idx) => {
      const res = validateCanonicalGap(gap);
      if (!res.valid) {
        res.violations.forEach(v => {
          violations.push({
            code: `GAP_${idx}_${v.code}`,
            field: `gaps[${idx}].${v.field}`,
            message: v.message,
            severity: v.severity,
          });
        });
      }
    });
  }

  // 4. VALIDAR DECISIONES DE APLICABILIDAD
  if (Array.isArray(a.applicability_decisions)) {
    a.applicability_decisions.forEach((dec, idx) => {
      const res = validateCategoryApplicabilityDecision(dec);
      if (!res.valid) {
        res.violations.forEach(v => {
          violations.push({
            code: `DECISION_${idx}_${v.code}`,
            field: `applicability_decisions[${idx}].${v.field}`,
            message: v.message,
            severity: v.severity,
          });
        });
      }
    });
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

