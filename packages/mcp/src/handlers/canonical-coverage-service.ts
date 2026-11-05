import { createHash } from 'node:crypto';

import type { IKnowledgeStore, KnowledgeRecord } from '@qap/engine';
import {
  validateExpectedRequirement,
  validateCoverageAssessmentInvariants,
  type CanonicalCoverageAssessment,
  type CanonicalGap,
  type CategoryApplicabilityDecision,
  type CategorySpecificationStatus,
  type ExecutionCoverageSummary,
  type ExpectedRequirement,
  type RequirementCategory,
  type ReviewCoverage,
  type SpecificationCoverage,
  type CanonicalClosureVerdict,
} from '@qap/shared';

import { ModuleObservationBridge, type BridgeContext } from './module-observation-bridge.js';
import type { IModuleClosureStore } from './module-closure-store.js';

const FORMAL_CATEGORIES: readonly RequirementCategory[] = [
  'functional',
  'business_rule',
  'security',
  'ui',
  'ux',
  'regression',
  'performance',
] as const;

const digest = (value: unknown): string =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');

export interface CoverageEvaluationOptions {
  readonly applicabilityDecisions?: readonly CategoryApplicabilityDecision[];
  readonly acceptedGaps?: readonly { readonly gap_id: string; readonly reason: string }[];
  readonly isWaived?: boolean;
  readonly waiverReason?: string;
  readonly decisionId?: string;
}

export type CoverageEvaluationResult =
  | { readonly status: 'evaluated'; readonly assessment: CanonicalCoverageAssessment }
  | { readonly status: 'blocked'; readonly code: string; readonly razon: string };

/**
 * Servicio de Cobertura Canónica (R1 / R2).
 * Evalúa cobertura usando exclusivamente información legítima:
 * - Identidad canónica del módulo validada contra el estado canónico (ModuleObservationBridge).
 * - Requisitos confirmados vigentes que superen Invariante D-011 y R1 (validateExpectedRequirement).
 * - Criterios de aceptación y decisiones autoritativas de aplicabilidad.
 * - Cero cobertura acreditada por crawler, elementos DOM, códigos HTTP 200 o archivos YAML no validados.
 * - Cobertura de ejecución estrictamente 'not_executed' (cero ConformityAssessment.pass).
 */
export class CanonicalCoverageService {
  private readonly bridge: ModuleObservationBridge;
  private readonly context: BridgeContext;

  constructor(
    private readonly store: IKnowledgeStore,
    context: BridgeContext,
    private readonly closureStore?: IModuleClosureStore
  ) {
    this.context = structuredClone(context);
    this.bridge = new ModuleObservationBridge(store, this.context);
  }

  async evaluate(
    plannedName: string,
    options?: CoverageEvaluationOptions
  ): Promise<CoverageEvaluationResult> {
    const resolution = await this.bridge.resolve(plannedName);
    if (resolution.status !== 'resolved') {
      return {
        status: 'blocked',
        code: resolution.status,
        razon: `El módulo '${plannedName}' no pudo resolverse canónicamente: ${resolution.status}`,
      };
    }

    const app = this.context.applicationId;
    const link = resolution.link;

    // 1. Cargar conocimiento histórico de cierre desde closureStore si está disponible
    const closureSnapshot = this.closureStore?.read({
      projectRoot: this.context.projectRoot,
      applicationId: app,
      environmentId: this.context.environmentId,
    });

    const storedDecisions = closureSnapshot?.applicabilityDecisions[plannedName] ?? [];
    const storedGaps = closureSnapshot?.acceptedGaps[plannedName] ?? [];

    // Combinar decisiones de aplicabilidad (opciones en tiempo de ejecución tienen precedencia sobre persistidas)
    const applicabilityMap = new Map<RequirementCategory, CategoryApplicabilityDecision>();
    for (const d of storedDecisions) {
      applicabilityMap.set(d.category, d);
    }
    if (options?.applicabilityDecisions) {
      for (const d of options.applicabilityDecisions) {
        applicabilityMap.set(d.category, d);
      }
    }

    // Combinar brechas aceptadas
    const acceptedGapsMap = new Map<string, { reason: string; receipt?: string }>();
    for (const g of storedGaps) {
      if (g.status === 'accepted') {
        acceptedGapsMap.set(g.id, { reason: g.reason, receipt: g.acceptance_receipt });
      }
    }
    if (options?.acceptedGaps) {
      for (const ag of options.acceptedGaps) {
        acceptedGapsMap.set(ag.gap_id, { reason: ag.reason, receipt: options.decisionId });
      }
    }

    // 2. Consultar requisitos canónicos del módulo en IKnowledgeStore
    const confirmedRequirements: KnowledgeRecord<'requirement'>[] = [];
    const pendingRequirements: KnowledgeRecord<'requirement'>[] = [];

    let cursor: string | undefined;
    let scanned = 0;
    do {
      const page = await this.store.query(app, 'requirement', {
        limit: 100,
        ...(cursor ? { cursor } : {}),
      });

      for (const req of page.items) {
        const ent = req.entity as ExpectedRequirement;
        if (
          ent.module_key === link.moduleKey &&
          ent.is_active === true &&
          !ent.superseded_by
        ) {
          // Filtrado riguroso de Invariantes D-011 y R1
          const status = ent.validation_status ?? ent.status;
          if (status === 'confirmed') {
            const validation = validateExpectedRequirement(ent);
            if (validation.valid) {
              // Validar que la procedencia no sea de observador/crawler/telemetría (D-011)
              const provenance = ent.provenance ?? ent.source;
              const isObservational =
                provenance === 'observed_telemetry' ||
                provenance === ('crawler' as unknown) ||
                provenance === ('active_probe' as unknown);

              if (!isObservational) {
                confirmedRequirements.push(req);
                continue;
              }
            }
          }
          pendingRequirements.push(req);
        }
      }

      scanned += page.items.length;
      cursor = page.next_cursor;
      if (cursor && scanned >= 1000) {
        return {
          status: 'blocked',
          code: 'inventory_limit',
          razon: `Límite de inventario excedido al consultar requisitos para el módulo '${plannedName}'.`,
        };
      }
    } while (cursor);

    // 3. Evaluar aplicabilidad y brechas por categoría
    const gaps: CanonicalGap[] = [];
    const categoryStatuses: CategorySpecificationStatus[] = [];
    const nowIso = new Date().toISOString();

    for (const cat of FORMAL_CATEGORIES) {
      const decision = applicabilityMap.get(cat);
      const catConfirmed = confirmedRequirements.filter(
        r => (r.entity as ExpectedRequirement).category === cat
      );
      const catPending = pendingRequirements.filter(
        r => (r.entity as ExpectedRequirement).category === cat
      );

      let applicability: 'applicable' | 'not_applicable' | 'unknown';
      if (decision) {
        applicability = decision.applicable ? 'applicable' : 'not_applicable';
      } else {
        applicability = catConfirmed.length > 0 ? 'applicable' : 'unknown';
      }

      const catGapIds: string[] = [];

      if (applicability === 'unknown') {
        const gapId = `gap:${link.moduleKey}:${cat}:unknown_applicability`;
        catGapIds.push(gapId);
        const acceptedInfo = acceptedGapsMap.get(gapId);
        gaps.push({
          id: gapId,
          module_key: link.moduleKey,
          category: cat,
          absence_type: acceptedInfo ? 'accepted_gap' : 'unknown_applicability',
          status: acceptedInfo ? 'accepted' : 'unaddressed',
          acceptance_receipt: acceptedInfo?.receipt,
          reason: acceptedInfo?.reason ?? `La aplicabilidad de la categoría '${cat}' no ha sido declarada autoritativamente.`,
          related_requirement_ids: [],
          provenance: 'canonical_coverage_evaluator',
          created_at: nowIso,
        });
      } else if (applicability === 'applicable') {
        if (catConfirmed.length === 0) {
          const gapId = `gap:${link.moduleKey}:${cat}:missing_specification`;
          catGapIds.push(gapId);
          const acceptedInfo = acceptedGapsMap.get(gapId);
          gaps.push({
            id: gapId,
            module_key: link.moduleKey,
            category: cat,
            absence_type: acceptedInfo ? 'accepted_gap' : 'missing_specification',
            status: acceptedInfo ? 'accepted' : 'unaddressed',
            acceptance_receipt: acceptedInfo?.receipt,
            reason: acceptedInfo?.reason ?? `La categoría '${cat}' es aplicable pero carece de requisitos confirmados vigentes.`,
            related_requirement_ids: [],
            provenance: 'canonical_coverage_evaluator',
            created_at: nowIso,
          });
        } else {
          // Requisitos confirmados pero con criterios incompletos
          for (const req of catConfirmed) {
            const ent = req.entity as ExpectedRequirement;
            if (!ent.acceptance_criteria || ent.acceptance_criteria.length === 0) {
              const gapId = `gap:${link.moduleKey}:${req.id}:incomplete_criteria`;
              catGapIds.push(gapId);
              const acceptedInfo = acceptedGapsMap.get(gapId);
              gaps.push({
                id: gapId,
                module_key: link.moduleKey,
                category: cat,
                absence_type: acceptedInfo ? 'accepted_gap' : 'incomplete_acceptance_criterion',
                status: acceptedInfo ? 'accepted' : 'unaddressed',
                acceptance_receipt: acceptedInfo?.receipt,
                reason: acceptedInfo?.reason ?? `El requisito confirmado '${ent.title}' carece de criterios de aceptación verificables.`,
                related_requirement_ids: [req.id],
                provenance: 'canonical_coverage_evaluator',
                created_at: nowIso,
              });
            }
          }
        }

        // Brechas por requisitos pendientes
        for (const req of catPending) {
          const ent = req.entity as ExpectedRequirement;
          const gapId = `gap:${link.moduleKey}:${req.id}:pending_requirement`;
          catGapIds.push(gapId);
          const acceptedInfo = acceptedGapsMap.get(gapId);
          gaps.push({
            id: gapId,
            module_key: link.moduleKey,
            category: cat,
            absence_type: acceptedInfo ? 'accepted_gap' : 'pending_requirement',
            status: acceptedInfo ? 'accepted' : 'unaddressed',
            acceptance_receipt: acceptedInfo?.receipt,
            reason: acceptedInfo?.reason ?? `El requisito '${ent.title}' está pendiente de confirmación autoritativa.`,
            related_requirement_ids: [req.id],
            provenance: 'canonical_coverage_evaluator',
            created_at: nowIso,
          });
        }
      }

      // Estado de la categoría
      let catStatus: 'satisfied' | 'gaps_present' | 'not_applicable' | 'unknown';
      if (applicability === 'not_applicable') {
        catStatus = 'not_applicable';
      } else if (applicability === 'unknown') {
        catStatus = 'unknown';
      } else {
        const catGaps = gaps.filter(g => catGapIds.includes(g.id));
        const hasUnaddressed = catGaps.some(g => g.status === 'unaddressed');
        if (!hasUnaddressed && catConfirmed.length > 0) {
          catStatus = 'satisfied';
        } else {
          catStatus = 'gaps_present';
        }
      }

      categoryStatuses.push({
        category: cat,
        applicability,
        confirmed_count: catConfirmed.length,
        pending_count: catPending.length,
        gap_ids: catGapIds,
        status: catStatus,
      });
    }

    // 4. Cobertura de Especificación
    const applicableCategories = categoryStatuses.filter(cs => cs.applicability === 'applicable');
    const satisfiedCategories = categoryStatuses.filter(cs => cs.status === 'satisfied');
    const unaddressedGaps = gaps.filter(g => g.status === 'unaddressed');
    const acceptedGapsList = gaps.filter(g => g.status === 'accepted');

    const isComplete =
      categoryStatuses.every(cs => cs.status === 'satisfied' || cs.status === 'not_applicable') &&
      unaddressedGaps.length === 0 &&
      pendingRequirements.length === 0;

    const specificationCoverage: SpecificationCoverage = {
      status: isComplete ? 'complete' : 'incomplete',
      applicable_categories_count: applicableCategories.length,
      satisfied_categories_count: satisfiedCategories.length,
      confirmed_requirements_count: confirmedRequirements.length,
      pending_requirements_count: pendingRequirements.length,
      total_gaps_count: gaps.length,
      unaddressed_gaps_count: unaddressedGaps.length,
      accepted_gaps_count: acceptedGapsList.length,
      category_statuses: categoryStatuses,
    };

    // 5. Cobertura de Revisión
    const reviewCoverage: ReviewCoverage = {
      status: applicabilityMap.size > 0 || acceptedGapsList.length > 0 ? 'reviewed' : 'pending_review',
      reviewed_questions_count: confirmedRequirements.length,
      pending_questions_count: pendingRequirements.length,
      decisions_count: applicabilityMap.size + acceptedGapsList.length,
      host_decisions: [
        ...Array.from(applicabilityMap.values()).map(d => d.decision_id),
        ...acceptedGapsList.map(g => g.acceptance_receipt).filter((r): r is string => Boolean(r)),
      ],
    };

    // 6. Cobertura de Ejecución (Estrictamente no ejecutada en R5)
    const executionCoverage: ExecutionCoverageSummary = {
      status: 'not_executed',
      executed_count: 0,
      passed_count: 0,
      failed_count: 0,
      indeterminate_count: 0,
      note: 'La cobertura de ejecución requiere ejecución con test runner (VNEXT-014). Cero certificación de ejecución en R5.',
    };

    // 7. Dictamen de Cierre y Bloqueadores
    const blockerReasons: string[] = [];
    let closureVerdict: CanonicalClosureVerdict;

    if (options?.isWaived) {
      closureVerdict = 'waived';
    } else if (categoryStatuses.some(cs => cs.applicability === 'unknown')) {
      closureVerdict = 'blocked_by_unknown_applicability';
      blockerReasons.push('Existen categorías cuya aplicabilidad no ha sido determinada autoritativamente.');
    } else if (unaddressedGaps.length > 0) {
      closureVerdict = 'blocked_by_gaps';
      blockerReasons.push(`Existen ${unaddressedGaps.length} brechas de cobertura no abordadas.`);
    } else if (pendingRequirements.length > 0) {
      closureVerdict = 'blocked_by_unconfirmed';
      blockerReasons.push(`Existen ${pendingRequirements.length} requisitos pendientes de confirmación.`);
    } else if (isComplete) {
      closureVerdict = 'ready_for_closure';
    } else {
      closureVerdict = 'blocked_by_gaps';
      blockerReasons.push('La especificación del módulo no está completa.');
    }

    // 8. Digest determinista inmutable
    const coverageDigest = digest([
      link.moduleId,
      link.moduleKey,
      link.moduleRevision,
      resolution.fingerprint,
      confirmedRequirements.map(r => [r.id, r.revision]).sort(),
      // Pending and rejected observational revisions must also invalidate a
      // previously reviewed snapshot, even in a non-applicable category.
      pendingRequirements.map(r => [r.id, r.revision]).sort(),
      categoryStatuses,
      gaps.map(g => [g.id, g.status, g.absence_type, g.acceptance_receipt]).sort(),
      // A retryable host review must be bound to the actual applicability
      // decision, not the transient clock time when the request was built.
      // Preserve decided_at in the assessment/store for audit, but do not
      // let a fresh timestamp invalidate an otherwise identical pending
      // request. Category, applicability, reason, reviewer and decision ID
      // remain part of the digest; requirement revisions and context are
      // independently bound above.
      Array.from(applicabilityMap.entries())
        .map(([category, decision]) => [category, decision.applicable, decision.reason,
          decision.decided_by, decision.decision_id])
        .sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
    ]);

    const assessment: CanonicalCoverageAssessment = {
      module_key: link.moduleKey,
      module_id: link.moduleId,
      module_revision: link.moduleRevision,
      application_id: app,
      environment_id: this.context.environmentId,
      assessed_at: nowIso,
      assessed_by: 'canonical_coverage_service',
      coverage_digest: coverageDigest,
      specification_coverage: specificationCoverage,
      review_coverage: reviewCoverage,
      execution_coverage: executionCoverage,
      gaps,
      applicability_decisions: Array.from(applicabilityMap.values()),
      closure_verdict: closureVerdict,
      blocker_reasons: blockerReasons,
    };

    // Validar invariantes
    const validation = validateCoverageAssessmentInvariants(assessment);
    if (!validation.valid) {
      return {
        status: 'blocked',
        code: 'coverage_invariants_violated',
        razon: `Invariantes de cobertura violados: ${validation.violations.map(v => v.message).join('; ')}`,
      };
    }

    return {
      status: 'evaluated',
      assessment,
    };
  }
}
