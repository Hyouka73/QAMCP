/**
 * QAMCP vNext — Planos Epistemológicos de Conocimiento (D-011)
 * 
 * Separa formalmente:
 * 1. Observaciones de la aplicación (lo que la app hace empíricamente en runtime).
 * 2. Inferencias del agente (hipótesis o deducciones con puntaje de confianza).
 * 3. Requisitos esperados (especificaciones autoritativas del negocio / desarrollador).
 * 4. Verificaciones de conformidad (comparación formal de observación vs requisito).
 */

import type { MultimodalEvidenceRef } from './contextual-dimensions.js';

/** Planos epistemológicos formales del sistema */
export type EpistemicPlane =
  | 'observation'
  | 'inference'
  | 'expected_requirement'
  | 'conformity_assessment';

/** Estado de certeza de una entidad */
export type CertaintyState =
  | 'observed'        // Extraído directamente de una lectura empírica de la aplicación
  | 'inferred'        // Generado por reglas heurísticas o modelos del agente
  | 'confirmed'       // Validado explícitamente por el desarrollador o especificación autoritativa
  | 'pending_review'; // Estuvo confirmado o inferido, pero ocurrió un cambio estructural (drift)

/** Categoría de requisito o regla de negocio */
export type RequirementCategory =
  | 'functional'
  | 'business_rule'
  | 'security'
  | 'ui'
  | 'ux'
  | 'regression'
  | 'performance';

/** Origen autoritativo de un requisito de negocio */
export type RequirementSource =
  | 'developer_interview'     // Confirmado directamente por el desarrollador en entrevista interactiva
  | 'authoritative_doc'       // Importado de documentación formal aprobada
  | 'formal_specification'    // Especificación OpenAPI, contrato de interfaz o PRD aprobado
  | 'legacy_manual_edit'      // Migrado desde v2.1 con flag manually_edited: true (precedencia alta, no infalible)
  | 'developer_input';        // Provisto directamente por el desarrollador en el prompt/comando

/**
 * 1. PLANO DE OBSERVACIÓN: Lo que la aplicación hace empíricamente.
 */
export interface ApplicationObservation {
  id: string;
  application_id: string;
  environment_id: string;
  kind: 'dom_element' | 'network_traffic' | 'console_log' | 'navigation_route' | 'probe_result' | 'visual_capture';
  raw_payload?: unknown;
  selector?: string;
  dom_snapshot?: {
    tag: string;
    attributes: Record<string, string>;
    inner_text?: string;
    is_visible: boolean;
  };
  network_event?: {
    url: string;
    method: string;
    status: number;
    request_headers?: Record<string, string>;
    response_snippet?: string;
    duration_ms?: number;
  };
  probe_execution?: {
    action: string;
    target_selector?: string;
    payload?: unknown;
    observed_output: unknown;
    reproducible: boolean;
    trials_count: number;
  };
  evidence: MultimodalEvidenceRef;
  observed_at: string; // ISO-8601
  observed_by: 'crawler' | 'active_probe' | 'recon' | 'runner';
  session_id?: string;
}

/**
 * 2. PLANO DE INFERENCIA: Deducciones, hipótesis y conjeturas del agente.
 */
export interface AgentInference {
  id: string;
  application_id: string;
  target_type:
    | 'module_boundary'
    | 'view_topology'
    | 'interactive_target'
    | 'flow_hypothesis'
    | 'rule_hypothesis'
    | 'risk_assessment';
  hypothesis: string;
  confidence_score: number; // 0.00 a 1.00
  reasoning: string;
  status: 'inferred' | 'pending_review' | 'refuted';
  supporting_observation_ids: string[];
  created_at: string;
  updated_at: string;
  requires_human_confirmation: boolean;
}

/**
 * 3. PLANO DE REQUISITO ESPERADO: Lo que el negocio o desarrollador estipula que DEBE ocurrir.
 */
export interface ExpectedRequirement {
  id: string;
  application_id: string;
  module_key: string;
  title: string;
  description: string;
  category: RequirementCategory;
  status: 'confirmed' | 'pending_specification' | 'deprecated' | 'waived';
  source: RequirementSource;
  confidence_score: number; // 1.0 para desarrollador; calibrado (0.85-0.90) para legacy_manual_edit
  verified_by?: string;     // 'developer', 'qa_lead', 'spec_import'
  created_at: string;
  superseded_by?: string;   // Si fue modificado/invalidado por un cambio posterior, apunta al nuevo ID
  is_active: boolean;
  acceptance_criteria?: string[];
}

/**
 * 4. PLANO DE VERIFICACIÓN DE CONFORMIDAD: Comparación entre Observación y Requisito Esperado.
 */
export interface ConformityAssessment {
  id: string;
  requirement_id: string;
  observation_ids: string[];
  verdict: 'pass' | 'fail' | 'indeterminate' | 'contradiction';
  indeterminacy_reason?: string; // Obligatorio cuando verdict === 'indeterminate'
  contradiction_detail?: {
    expected_behavior: string;
    observed_behavior: string;
  };
  assessed_at: string;
  assessed_by: string; // 'qap_engine' | 'test_runner' | 'manual_review'
  evidence: MultimodalEvidenceRef[];
}
