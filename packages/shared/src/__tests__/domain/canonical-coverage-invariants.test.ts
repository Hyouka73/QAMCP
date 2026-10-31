import { describe, it, expect } from 'vitest';
import {
  validateCanonicalClosureCommand,
  validateCanonicalGap,
  validateCategoryApplicabilityDecision,
  validateCoverageAssessmentInvariants,
} from '../../domain/index.js';
import type {
  CanonicalClosureCommand,
  CanonicalGap,
  CategoryApplicabilityDecision,
  CanonicalCoverageAssessment,
} from '../../domain/index.js';

describe('VNEXT-013-R5 / Canonical Coverage & Closure Domain Invariants', () => {
  describe('validateCanonicalClosureCommand', () => {
    it('accepts valid evaluate and close commands', () => {
      expect(validateCanonicalClosureCommand({ action: 'evaluate' }).valid).toBe(true);
      expect(validateCanonicalClosureCommand({ action: 'close' }).valid).toBe(true);
    });

    it('accepts valid waive command with substantive reason', () => {
      const cmd: CanonicalClosureCommand = {
        action: 'waive',
        reason: 'El módulo no será implementado en esta versión debido a cambio de alcance.',
      };
      const res = validateCanonicalClosureCommand(cmd);
      expect(res.valid).toBe(true);
    });

    it('rejects waive command with short reason (< 15 chars)', () => {
      const res = validateCanonicalClosureCommand({
        action: 'waive',
        reason: 'muy corto',
      });
      expect(res.valid).toBe(false);
      expect(res.violations.some(v => v.code === 'SUBSTANTIVE_WAIVER_REASON_REQUIRED')).toBe(true);
    });

    it('rejects client-injected authorization fields (approvalId / signature)', () => {
      const res = validateCanonicalClosureCommand({
        action: 'close',
        approvalId: 'forged_host_approval_123',
      });
      expect(res.valid).toBe(false);
      expect(res.violations.some(v => v.code === 'CLIENT_AUTHORIZATION_INJECTION_FORBIDDEN')).toBe(true);
    });

    it('accepts valid accept_gaps command with substantive reasons', () => {
      const cmd: CanonicalClosureCommand = {
        action: 'accept_gaps',
        accepted_gaps: [
          {
            gap_id: 'gap_auth_01',
            reason: 'El módulo utiliza SSO externo documentado y validado formalmente.',
          },
        ],
      };
      const res = validateCanonicalClosureCommand(cmd);
      expect(res.valid).toBe(true);
    });

    it('rejects accept_gaps with empty gaps array or short reasons', () => {
      expect(validateCanonicalClosureCommand({ action: 'accept_gaps', accepted_gaps: [] }).valid).toBe(false);
      const shortRes = validateCanonicalClosureCommand({
        action: 'accept_gaps',
        accepted_gaps: [{ gap_id: 'g1', reason: 'corto' }],
      });
      expect(shortRes.valid).toBe(false);
      expect(shortRes.violations.some(v => v.code === 'SUBSTANTIVE_GAP_ACCEPTANCE_REASON_REQUIRED')).toBe(true);
    });

    it('accepts valid declare_non_applicable command', () => {
      const cmd: CanonicalClosureCommand = {
        action: 'declare_non_applicable',
        decisions: [
          {
            category: 'performance',
            reason: 'Módulo puramente estático de solo lectura sin SLA de rendimiento estricto.',
          },
        ],
      };
      const res = validateCanonicalClosureCommand(cmd);
      expect(res.valid).toBe(true);
    });
  });

  describe('validateCanonicalGap', () => {
    it('accepts a valid unaddressed gap', () => {
      const gap: CanonicalGap = {
        id: 'gap:payments:missing_security',
        module_key: 'payments',
        category: 'security',
        absence_type: 'missing_specification',
        status: 'unaddressed',
        reason: 'No se encontraron reglas de seguridad confirmadas para procesamiento de tarjetas.',
        related_requirement_ids: [],
        provenance: 'canonical_coverage_evaluator',
        created_at: new Date().toISOString(),
      };
      expect(validateCanonicalGap(gap).valid).toBe(true);
    });

    it('enforces Amendment 5: accepted_gap absence_type must have status accepted and acceptance_receipt', () => {
      const invalidGap: CanonicalGap = {
        id: 'gap:payments:accepted_01',
        module_key: 'payments',
        category: 'security',
        absence_type: 'accepted_gap',
        status: 'unaddressed', // Mismatch!
        reason: 'Brecha aceptada sin recibo de aprobación del host.',
        related_requirement_ids: [],
        provenance: 'canonical_coverage_evaluator',
        created_at: new Date().toISOString(),
      };
      const res = validateCanonicalGap(invalidGap);
      expect(res.valid).toBe(false);
      expect(res.violations.some(v => v.code === 'ACCEPTED_GAP_STATUS_MISMATCH')).toBe(true);
      expect(res.violations.some(v => v.code === 'ACCEPTED_GAP_RECEIPT_REQUIRED')).toBe(true);
    });

    it('accepts an accepted gap with valid receipt and status', () => {
      const validAcceptedGap: CanonicalGap = {
        id: 'gap:payments:accepted_01',
        module_key: 'payments',
        category: 'security',
        absence_type: 'accepted_gap',
        status: 'accepted',
        acceptance_receipt: 'decision_host_appr_998',
        reason: 'Riesgo residual aceptado por el responsable de seguridad para este release.',
        related_requirement_ids: [],
        provenance: 'canonical_coverage_evaluator',
        created_at: new Date().toISOString(),
      };
      expect(validateCanonicalGap(validAcceptedGap).valid).toBe(true);
    });
  });

  describe('validateCategoryApplicabilityDecision', () => {
    it('accepts a valid applicability decision', () => {
      const dec: CategoryApplicabilityDecision = {
        category: 'regression',
        applicable: false,
        reason: 'Nuevo módulo sin versiones previas contra las cuales comparar regresiones.',
        decided_by: 'lead_architect',
        decision_id: 'dec_appr_882',
        decided_at: new Date().toISOString(),
      };
      expect(validateCategoryApplicabilityDecision(dec).valid).toBe(true);
    });

    it('rejects short reasons (< 15 chars)', () => {
      const res = validateCategoryApplicabilityDecision({
        category: 'regression',
        applicable: false,
        reason: 'no aplica',
        decided_by: 'host',
        decision_id: 'dec_1',
        decided_at: new Date().toISOString(),
      });
      expect(res.valid).toBe(false);
      expect(res.violations.some(v => v.code === 'SUBSTANTIVE_APPLICABILITY_REASON_REQUIRED')).toBe(true);
    });
  });

  describe('validateCoverageAssessmentInvariants', () => {
    const baseAssessment: CanonicalCoverageAssessment = {
      module_key: 'checkout',
      module_id: 'mod_checkout_01',
      module_revision: 1,
      application_id: 'app_main',
      environment_id: 'env_staging',
      assessed_at: new Date().toISOString(),
      assessed_by: 'canonical_coverage_service',
      coverage_digest: 'a'.repeat(64),
      specification_coverage: {
        status: 'complete',
        applicable_categories_count: 2,
        satisfied_categories_count: 2,
        confirmed_requirements_count: 5,
        pending_requirements_count: 0,
        total_gaps_count: 1,
        unaddressed_gaps_count: 0,
        accepted_gaps_count: 1,
        category_statuses: [
          {
            category: 'functional',
            applicability: 'applicable',
            confirmed_count: 5,
            pending_count: 0,
            gap_ids: [],
            status: 'satisfied',
          },
          {
            category: 'security',
            applicability: 'applicable',
            confirmed_count: 0,
            pending_count: 0,
            gap_ids: ['gap_sec_accepted'],
            status: 'satisfied',
          },
        ],
      },
      review_coverage: {
        status: 'reviewed',
        reviewed_questions_count: 4,
        pending_questions_count: 0,
        decisions_count: 1,
        host_decisions: ['dec_host_1'],
      },
      execution_coverage: {
        status: 'not_executed',
        executed_count: 0,
        passed_count: 0,
        failed_count: 0,
        indeterminate_count: 0,
        note: 'Execution coverage requires test runner execution (VNEXT-014).',
      },
      gaps: [
        {
          id: 'gap_sec_accepted',
          module_key: 'checkout',
          category: 'security',
          absence_type: 'accepted_gap',
          status: 'accepted',
          acceptance_receipt: 'dec_host_1',
          reason: 'Brecha aceptada formalmente con mitigación en capa perimetral WAF.',
          related_requirement_ids: [],
          provenance: 'canonical_coverage_evaluator',
          created_at: new Date().toISOString(),
        },
      ],
      applicability_decisions: [],
      closure_verdict: 'ready_for_closure',
      blocker_reasons: [],
    };

    it('accepts a valid CanonicalCoverageAssessment ready for closure', () => {
      const res = validateCoverageAssessmentInvariants(baseAssessment);
      expect(res.valid).toBe(true);
    });

    it('strictly prohibits fake execution coverage or pass verdicts (Mandato de Integridad)', () => {
      const fakedExec = {
        ...baseAssessment,
        execution_coverage: {
          status: 'complete',
          executed_count: 5,
          passed_count: 5,
          failed_count: 0,
          indeterminate_count: 0,
          note: 'all tests passed',
        },
      };
      const res = validateCoverageAssessmentInvariants(fakedExec);
      expect(res.valid).toBe(false);
      expect(res.violations.some(v => v.code === 'EXECUTION_COVERAGE_UNVERIFIED_FORBIDDEN')).toBe(true);
      expect(res.violations.some(v => v.code === 'EXECUTION_VERDICTS_FORBIDDEN')).toBe(true);
    });

    it('prohibits ready_for_closure when unaddressed gaps exist', () => {
      const assessmentWithGaps: CanonicalCoverageAssessment = {
        ...baseAssessment,
        specification_coverage: {
          ...baseAssessment.specification_coverage,
          unaddressed_gaps_count: 1,
          total_gaps_count: 2,
        },
        closure_verdict: 'ready_for_closure',
      };
      const res = validateCoverageAssessmentInvariants(assessmentWithGaps);
      expect(res.valid).toBe(false);
      expect(res.violations.some(v => v.code === 'READY_FOR_CLOSURE_WITH_UNADDRESSED_GAPS_FORBIDDEN')).toBe(true);
    });

    it('prohibits category waivers (Amendment 6)', () => {
      const waivedCategoryAssessment = {
        ...baseAssessment,
        specification_coverage: {
          ...baseAssessment.specification_coverage,
          category_statuses: [
            {
              category: 'functional',
              applicability: 'applicable',
              confirmed_count: 5,
              pending_count: 0,
              gap_ids: [],
              status: 'satisfied',
              is_waived: true, // Forbidden!
            },
          ],
        },
      };
      const res = validateCoverageAssessmentInvariants(waivedCategoryAssessment);
      expect(res.valid).toBe(false);
      expect(res.violations.some(v => v.code === 'CATEGORY_WAIVER_FORBIDDEN')).toBe(true);
    });
  });
});
