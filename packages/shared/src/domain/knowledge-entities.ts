/**
 * QAMCP vNext — Entidades de Dominio de Conocimiento
 * 
 * Modela las entidades de conocimiento con soporte para evolución histórica,
 * grafo DAG de dependencias, resolución de selectores y clasificación rigurosa de defectos.
 */

import type { CertaintyState, RequirementCategory } from './epistemic-planes.js';
import type { BrowserCleanupPolicy, MultimodalEvidenceRef, PrerequisiteDefinition } from './contextual-dimensions.js';

/** Nivel de criticidad funcional o de negocio */
export type CriticalityLevel = 'low' | 'medium' | 'high' | 'critical';

/** Módulo funcional o subsistema lógico */
export interface DomainModule {
  id: string;
  application_id: string;
  key: string;               // Ej: 'billing', 'auth', 'subscriptions'
  title: string;
  description?: string;
  certainty: CertaintyState;
  criticality: CriticalityLevel;
  dependencies: string[];    // Claves o IDs de otros módulos requeridos (DAG)
  created_at: string;
  updated_at: string;
  superseded_by?: string;    // Puntero histórico en caso de refactorización/reemplazo
  is_active: boolean;
}

/** Vista, página o pantalla interactiva */
export interface DomainView {
  id: string;
  module_id: string;
  application_id: string;
  route_pattern: string;     // Ej: '/invoices/create', '/checkout/:id'
  title?: string;
  certainty: CertaintyState;
  interactive_elements_count: number;
  forms_count: number;
  semantic_hash?: string;    // SHA-256 para detección de drift estructural
  created_at: string;
  updated_at: string;
  superseded_by?: string;    // Puntero a nueva versión de la vista si cambia la UI
  is_active: boolean;
}

/** Tipo de elemento interactivo en la UI */
export type TargetElementType =
  | 'button'
  | 'input'
  | 'select'
  | 'link'
  | 'form'
  | 'modal'
  | 'table';

/** Selector o elemento interactivo objetivo para automatización Playwright */
export interface ActionTarget {
  id: string;
  view_id: string;
  application_id: string;
  element_type: TargetElementType;
  selector: string;
  fallback_selectors?: string[];
  accessibility_label?: string;
  is_required?: boolean;
  certainty: CertaintyState;
  confidence_score: number;  // 0.00 a 1.00
  created_at: string;
  updated_at: string;
  superseded_by?: string;    // Puntero a nuevo selector si el elemento fue modificado
  is_active: boolean;
}

/** Paso atómico dentro de un flujo de prueba */
export interface FlowStep {
  step_number: number;
  action_target_id?: string;
  action_kind: 'click' | 'fill' | 'select' | 'assert_visible' | 'assert_text' | 'wait_for_response';
  input_value_template?: string; // Plantilla de datos (ej. '{{user_email}}')
  expected_outcome?: string;
}

/** Escenario o flujo de navegación entre vistas */
export interface FlowScenario {
  id: string;
  application_id: string;
  module_id: string;
  title: string;
  description?: string;
  required_role_id?: string;
  cleanup_policy: BrowserCleanupPolicy;
  prerequisites: PrerequisiteDefinition[];
  steps: FlowStep[];
  risk_level: CriticalityLevel;
  recommended_test_types: RequirementCategory[];
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

/** Clasificación formal de anomalías y defectos (D-014) */
export type DefectClassification =
  | 'product_bug'            // Falla de código o violación de requisito esperado comprobada
  | 'environment_error'      // Falla de infraestructura, conectividad o servicio caído
  | 'automation_flakiness'    // Problema de timing o sincronización resuelto en reintento
  | 'blocked_flow'           // Fallo de un prerrequisito anterior en el grafo DAG
  | 'indeterminate';         // Evidencia ambigua o insuficiente para determinar causa raíz

/** Registro formal de defecto o anomalía detectada */
export interface DefectRecord {
  id: string;
  application_id: string;
  module_id?: string;
  flow_id?: string;
  classification: DefectClassification;
  http_status_code?: number;
  indeterminacy_reason?: string; // Obligatorio cuando classification === 'indeterminate'
  observed_evidence: MultimodalEvidenceRef[];
  expected_requirement_id?: string;
  steps_to_reproduce: string[];
  detected_at: string;
  resolution_notes?: string;
}

/** Pregunta interactiva para entrevista de clarificación (QA Advisor / Human-in-the-Loop) */
export interface ClarificationQuestion {
  id: string;
  module_key: string;
  question: string;
  rationale: string;
  options: Array<{
    id: string;
    text: string;
    recommended?: boolean;
  }>;
  selected_option_id?: string;
  status: 'pending' | 'answered' | 'skipped';
}

/** Recomendación estructurada emitida por el QA Advisor */
export interface TestRecommendation {
  category: RequirementCategory;
  priority: CriticalityLevel;
  reason: string;
  scope_description: string;
  applicable_flows: string[];
}
