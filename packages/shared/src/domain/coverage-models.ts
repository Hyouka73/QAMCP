/**
/**
 * QAMCP vNext — Modelos de Cobertura Canónica, Brechas y Cierre de Módulo (VNEXT-013-R5)
 * 
 * Define los contratos canónicos para:
 * 1. Comandos de cierre (`CanonicalClosureCommand`) en la frontera MCP.
 * 2. Inventario reproducible de brechas (`CanonicalGap`) y tipología de ausencias.
 * 3. Decisiones de aplicabilidad por categoría (`CategoryApplicabilityDecision`).
 * 4. Cobertura tripartita desacoplada (Especificación, Revisión y Ejecución).
 * 5. Evaluación integral de cobertura (`CanonicalCoverageAssessment`).
 */

import type { RequirementCategory } from './epistemic-planes.js';

/**
 * Los 8 tipos formales de ausencia que caracterizan una brecha epistemológica.
 */
export type GapAbsenceType =
  | 'missing_specification'           // Categoría aplicable sin ninguna especificación
  | 'pending_requirement'             // Requisito en borrador o propuesto sin confirmar
  | 'pending_confirmation'            // Pregunta o propuesta pendiente de respuesta humana
  | 'unknown_applicability'           // Categoría cuya aplicabilidad no ha sido decidida
  | 'incomplete_acceptance_criterion' // Requisito confirmado pero con criterios incompletos
  | 'insufficient_evidence'           // Evidencia técnica insuficiente para sustentar la regla
  | 'revision_conflict'               // Conflicto de revisión o desincronización de versión
  | 'accepted_gap';                   // Brecha aceptada expresamente con justificación autorizada

export const GAP_ABSENCE_TYPES: readonly GapAbsenceType[] = [
  'missing_specification',
  'pending_requirement',
  'pending_confirmation',
  'unknown_applicability',
  'incomplete_acceptance_criterion',
  'insufficient_evidence',
  'revision_conflict',
  'accepted_gap',
] as const;

/**
 * Estado del ciclo de vida de una brecha identificada.
 */
export type GapStatus = 'unaddressed' | 'accepted' | 'deferred';

export const GAP_STATUSES: readonly GapStatus[] = ['unaddressed', 'accepted', 'deferred'] as const;

/**
 * Inventario reproducible de brecha canónica (R2).
 */
export interface CanonicalGap {
  readonly id: string;
  readonly module_key: string;
  readonly category: RequirementCategory;
  readonly absence_type: GapAbsenceType;
  readonly status: GapStatus;
  readonly reason: string;
  readonly related_requirement_ids: readonly string[];
  readonly evidence_refs?: readonly string[];
  readonly severity?: 'low' | 'medium' | 'high' | 'critical';
  readonly provenance: 'canonical_coverage_evaluator';
  readonly acceptance_receipt?: string; // ID de decisión del host si status === 'accepted'
  readonly created_at: string;
}

/**
 * Decisión formal y autoritativa de aplicabilidad de una categoría en un módulo (R1 / R2).
 */
export interface CategoryApplicabilityDecision {
  readonly category: RequirementCategory;
  readonly applicable: boolean;
  readonly reason: string;
  readonly decided_by: string; // Identidad autoritativa del host gateway / revisor
  readonly decision_id: string; // ID único de la decisión
  readonly decided_at: string;
}

/**
 * Estado de especificación de una categoría individual dentro de un módulo (R1).
 * Nota: Siguiendo la enmienda 6, las categorías NO se renuncian (is_waived = false eliminado).
 */
export interface CategorySpecificationStatus {
  readonly category: RequirementCategory;
  readonly applicability: 'applicable' | 'not_applicable' | 'unknown';
  readonly confirmed_count: number;
  readonly pending_count: number;
  readonly gap_ids: readonly string[];
  readonly status: 'satisfied' | 'gaps_present' | 'not_applicable' | 'unknown';
}

/**
 * 1. COBERTURA DE ESPECIFICACIÓN:
 * Mide el grado en que los comportamientos esperados aplicables están definidos y confirmados.
 */
export interface SpecificationCoverage {
  readonly status: 'complete' | 'incomplete' | 'not_evaluated';
  readonly applicable_categories_count: number;
  readonly satisfied_categories_count: number;
  readonly confirmed_requirements_count: number;
  readonly pending_requirements_count: number;
  readonly total_gaps_count: number;
  readonly unaddressed_gaps_count: number;
  readonly accepted_gaps_count: number;
  readonly category_statuses: readonly CategorySpecificationStatus[];
}

/**
 * 2. COBERTURA DE REVISIÓN:
 * Mide las preguntas, propuestas y decisiones evaluadas autoritativamente por el host.
 */
export interface ReviewCoverage {
  readonly status: 'reviewed' | 'pending_review';
  readonly reviewed_questions_count: number;
  readonly pending_questions_count: number;
  readonly decisions_count: number;
  readonly host_decisions: readonly string[];
}

/**
 * 3. RESUMEN DE COBERTURA DE EJECUCIÓN:
 * En VNEXT-013-R5 no hay ejecución de pruebas por runner (reservado para VNEXT-014).
 * Está estrictamente en 'not_executed' con 0 pases y sin emitir ConformityAssessment.pass.
 */
export interface ExecutionCoverageSummary {
  readonly status: 'not_executed';
  readonly executed_count: 0;
  readonly passed_count: 0;
  readonly failed_count: 0;
  readonly indeterminate_count: 0;
  readonly note: string;
}

/**
 * Dictamen formal de cierre canónico.
 */
export type CanonicalClosureVerdict =
  | 'ready_for_closure'
  | 'blocked_by_gaps'
  | 'blocked_by_unconfirmed'
  | 'blocked_by_unknown_applicability'
  | 'waived';

/**
 * Evaluación integral de cobertura canónica de un módulo (R1 / R2).
 */
export interface CanonicalCoverageAssessment {
  readonly module_key: string;
  readonly module_id: string;
  readonly module_revision: number;
  readonly application_id: string;
  readonly environment_id: string;
  readonly assessed_at: string;
  readonly assessed_by: 'canonical_coverage_service';
  readonly coverage_digest: string; // SHA-256 sobre snapshot inmutable de cobertura
  readonly specification_coverage: SpecificationCoverage;
  readonly review_coverage: ReviewCoverage;
  readonly execution_coverage: ExecutionCoverageSummary;
  readonly gaps: readonly CanonicalGap[];
  readonly applicability_decisions: readonly CategoryApplicabilityDecision[];
  readonly closure_verdict: CanonicalClosureVerdict;
  readonly blocker_reasons: readonly string[];
}

/**
 * Contrato de comando de cierre canónico sobre el cable MCP (Enmienda 1 de Critic & Challenger).
 * Recibido como argumento `canonical_closure` en `qap_module_close`.
 *
 * Los clientes MCP NUNCA pueden proveer un approvalId o auto-autorizarse;
 * la autorización emana exclusivamente de IModuleClosureReviewGateway en el host.
 */
export type CanonicalClosureCommand =
  | { readonly action: 'evaluate' }
  | { readonly action: 'close' }
  | { readonly action: 'waive'; readonly reason: string }
  | {
      readonly action: 'accept_gaps';
      readonly accepted_gaps: readonly {
        readonly gap_id: string;
        readonly reason: string;
      }[];
    }
  | {
      readonly action: 'declare_non_applicable';
      readonly decisions: readonly {
        readonly category: RequirementCategory;
        readonly reason: string;
      }[];
    };
