import { createHash, randomUUID } from 'node:crypto';

import type {
  CanonicalExecutionSummary,
  CaseExecutionVerdict,
  ExecutionAttemptRecord,
  ExecutionAttemptStatus,
  ExecutionCaseResultRecord,
  ExecutionResult,
  ExecutionStepResultRecord,
  OracleStatus,
  ReportFormatEntry,
  ReportPublicationRecord,
  RiskDecisionStatus,
  ServiceRequirementRecord,
  ServiceTestCaseRecord,
  TestCaseConformityStatus,
} from '@qap/shared';

import type { AppServiceSqliteStore } from './app-service-store.js';
import {
  LineagedCaseError,
  computeLineagedCaseDigest,
  computeLineagedExecutionKey,
  matchesLineagedReadScope,
  legacyBlockedError,
  normalizeLineagedReadScope,
  parseLineagedCaseRow,
  resolveLineagedListArguments,
  resolveLineagedReadArguments,
  rowBelongsToLineagedReadScope,
  stableStringify,
  type LineagedCaseDocument,
  type LineagedCaseReadScopeInput,
  type LineagedCaseRecord,
  type LineagedCaseScope,
  type LineagedCaseSelector,
  type LineagedCaseWriteResult,
  type NormalizedLineagedReadScope,
} from './lineaged-case.js';

const rowStr = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
};
const rowOptStr = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return null;
};

const UUID_CASE_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuidCaseId(value: string): boolean {
  return UUID_CASE_ID_RE.test(value.trim());
}

/**
 * Canonicaliza únicamente identificadores con formato UUID a minúsculas.
 * Los IDs legacy sintéticos (p. ej. TC-SYNTH-LEGIT, TC-001) conservan exactamente su caja y semántica.
 */
export function canonicalizeCaseId(rawId: string): string {
  const trimmed = rawId.trim();
  if (!trimmed) return '';
  return UUID_CASE_ID_RE.test(trimmed) ? trimmed.toLowerCase() : trimmed;
}

function shaDigest(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

/** Columnas epistémicas legacy de un candidato con linaje: descriptivas y sin oráculo (01B acredita). */
function lineagedLegacyColumns(document: LineagedCaseDocument): [string, string, string] {
  return [
    JSON.stringify({
      source_kind: 'observed_dom',
      route: document.scope.route_pathname,
      observed_controls: [],
      observed_headings: [],
      evidence_refs: [...document.lineage.evidence_ids],
    }),
    JSON.stringify({
      rationale: 'Candidato con linaje verificado (P0.3b-01A); oráculo pendiente de acreditación.',
      proposed_flow: document.tc_case.name,
      step_count: 0,
      proposed_by: 'qap',
    }),
    JSON.stringify({ oracle_status: 'missing', expected_outcome: null, source: 'missing' }),
  ];
}

export interface ProposeCaseInput {
  readonly case_id?: string;
  readonly title: string;
  readonly requirement_id?: string;
  readonly expected_outcome?: string | null;
  readonly oracle_source?: 'user' | 'ingested_doc' | 'missing';
  readonly business_risk_question?: string;
  readonly expectation_metadata?: {
    readonly rule_id?: string;
    readonly decision_status?: string;
    readonly source_ref?: string;
    readonly source_version?: string;
    readonly scope_match?: string;
  };
  readonly risk_level?: 'low' | 'medium' | 'high' | 'critical';
  readonly risk_accepted?: boolean;
  readonly observation?: Partial<ServiceTestCaseRecord['observation']>;
  readonly inference?: Partial<ServiceTestCaseRecord['inference']>;
  readonly steps?: readonly Record<string, unknown>[];
}

export interface OracleDecisionInput {
  readonly case_id: string;
  readonly expected_outcome: string;
  readonly assert_selector?: string;
  readonly assert_type?: 'visible' | 'exists' | 'contains' | 'equals';
  readonly risk_accepted?: boolean;
  readonly risk_note?: string;
}

function mapRequirementRow(row: Record<string, unknown>): ServiceRequirementRecord {
  return {
    requirement_id: rowStr(row.requirement_id),
    project_id: rowStr(row.project_id),
    module_id: rowStr(row.module_id),
    module_key: rowStr(row.module_key),
    revision: Number(row.revision),
    title: rowStr(row.title),
    description: rowStr(row.description),
    category: rowStr(row.category) as ServiceRequirementRecord['category'],
    source: rowStr(row.source) as ServiceRequirementRecord['source'],
    validation_status: rowStr(row.validation_status) as ServiceRequirementRecord['validation_status'],
    acceptance_criteria: JSON.parse(rowStr(row.acceptance_criteria_json) || '[]') as string[],
    risk_level: rowStr(row.risk_level) as ServiceRequirementRecord['risk_level'],
    risk_decision: rowStr(row.risk_decision) as RiskDecisionStatus,
    risk_note: rowOptStr(row.risk_note),
    created_at: rowStr(row.created_at),
    updated_at: rowStr(row.updated_at),
  };
}

function mapCaseRow(row: Record<string, unknown>): ServiceTestCaseRecord {
  return {
    case_id: rowStr(row.case_id),
    project_id: rowStr(row.project_id),
    module_id: rowStr(row.module_id),
    module_key: rowStr(row.module_key),
    requirement_id: rowOptStr(row.requirement_id),
    requirement_revision: Number(row.requirement_revision),
    title: rowStr(row.title),
    version: Number(row.version),
    observation: JSON.parse(rowStr(row.observation_json)) as ServiceTestCaseRecord['observation'],
    inference: JSON.parse(rowStr(row.inference_json)) as ServiceTestCaseRecord['inference'],
    expectation: JSON.parse(rowStr(row.expectation_json)) as ServiceTestCaseRecord['expectation'],
    oracle_status: rowStr(row.oracle_status) as OracleStatus,
    risk_level: rowStr(row.risk_level) as ServiceTestCaseRecord['risk_level'],
    risk_decision: rowStr(row.risk_decision) as RiskDecisionStatus,
    steps: JSON.parse(rowStr(row.steps_json) || '[]') as Record<string, unknown>[],
    conformity_status: rowStr(row.conformity_status) as TestCaseConformityStatus,
    confirmation_digest: rowOptStr(row.confirmation_digest),
    confirmed_by: rowOptStr(row.confirmed_by),
    confirmed_at: rowOptStr(row.confirmed_at),
    campaign_id: rowOptStr(row.campaign_id),
    created_at: rowStr(row.created_at),
    updated_at: rowStr(row.updated_at),
  };
}

function mapAttemptRow(row: Record<string, unknown>): ExecutionAttemptRecord {
  return {
    attempt_id: rowStr(row.attempt_id),
    execution_id: rowStr(row.execution_id),
    project_id: rowStr(row.project_id),
    campaign_id: rowStr(row.campaign_id),
    module_id: rowStr(row.module_id),
    module_key: rowStr(row.module_key),
    env_id: rowStr(row.env_id),
    profile_id: rowOptStr(row.profile_id),
    status: rowStr(row.status) as ExecutionAttemptStatus,
    case_ids: JSON.parse(rowStr(row.case_ids_json) || '[]') as string[],
    case_versions: JSON.parse(rowStr(row.case_versions_json) || '{}') as Record<string, number>,
    requirement_revisions: JSON.parse(
      rowStr(row.requirement_revisions_json) || '[]',
    ) as ExecutionAttemptRecord['requirement_revisions'],
    started_at: rowStr(row.started_at),
    finished_at: rowOptStr(row.finished_at),
    error_code: rowOptStr(row.error_code),
    error_message: rowOptStr(row.error_message),
    raw_execution_path: rowOptStr(row.raw_execution_path),
    trace_path: rowOptStr(row.trace_path),
    result_digest: rowOptStr(row.result_digest),
  };
}

function mapCaseResultRow(row: Record<string, unknown>): ExecutionCaseResultRecord {
  return {
    result_row_id: rowStr(row.result_row_id),
    attempt_id: rowStr(row.attempt_id),
    project_id: rowStr(row.project_id),
    campaign_id: rowStr(row.campaign_id),
    module_key: rowStr(row.module_key),
    requirement_id: rowOptStr(row.requirement_id),
    requirement_revision: Number(row.requirement_revision),
    case_id: rowStr(row.case_id),
    case_version: Number(row.case_version),
    verdict: rowStr(row.verdict) as CaseExecutionVerdict,
    human_acceptance_reason: rowOptStr(row.human_acceptance_reason),
    human_accepted_by: rowOptStr(row.human_accepted_by),
    human_accepted_at: rowOptStr(row.human_accepted_at),
    step_results: JSON.parse(rowStr(row.step_results_json) || '[]') as ExecutionStepResultRecord[],
    evidence_refs: JSON.parse(rowStr(row.evidence_refs_json) || '[]') as string[],
    created_at: rowStr(row.created_at),
  };
}

function mapPublicationRow(row: Record<string, unknown>): ReportPublicationRecord {
  return {
    publication_id: rowStr(row.publication_id),
    project_id: rowStr(row.project_id),
    campaign_id: rowOptStr(row.campaign_id),
    attempt_id: rowOptStr(row.attempt_id),
    execution_id: rowStr(row.execution_id),
    module_key: rowStr(row.module_key),
    requested_formats: JSON.parse(rowStr(row.requested_formats_json) || '[]') as ReportPublicationRecord['requested_formats'],
    published_formats: JSON.parse(rowStr(row.published_formats_json) || '{}') as Record<string, ReportFormatEntry>,
    failed_format: rowOptStr(row.failed_format),
    status: rowStr(row.status) as 'partial' | 'completed',
    created_at: rowStr(row.created_at),
    updated_at: rowStr(row.updated_at),
  };
}

/**
 * Durable SQLite repository supporting Block 3 capabilities:
 * epistemic separation on test cases, oracle decisions, duplicate-confirmation protection,
 * pre-launch execution attempt tracking, human acceptance vs PASS/FAIL/not_run/technical_error,
 * and partial report publication recovery.
 */
export class Block3ExecutionRepo {
  readonly #store: AppServiceSqliteStore;
  constructor(store: AppServiceSqliteStore) { this.#store = store; }

  upsertRequirement(params: {
    projectId: string;
    moduleId: string;
    moduleKey: string;
    requirementId?: string;
    title: string;
    description: string;
    category?: ServiceRequirementRecord['category'];
    source: ServiceRequirementRecord['source'];
    validationStatus: ServiceRequirementRecord['validation_status'];
    acceptanceCriteria: readonly string[];
    riskLevel?: ServiceRequirementRecord['risk_level'];
    riskDecision?: RiskDecisionStatus;
    riskNote?: string | null;
  }): ServiceRequirementRecord {
    const now = new Date().toISOString();
    const reqId = params.requirementId?.trim() || `REQ-${params.moduleKey.toUpperCase()}-${randomUUID().slice(0, 6)}`;
    const existingRow = this.#store.get(
      'SELECT * FROM service_requirements WHERE project_id = ? AND module_key = ? AND requirement_id = ?',
      params.projectId,
      params.moduleKey,
      reqId,
    );
    const criteriaJson = JSON.stringify([...params.acceptanceCriteria]);

    if (existingRow) {
      const existing = mapRequirementRow(existingRow);
      const changed =
        existing.title !== params.title ||
        existing.description !== params.description ||
        JSON.stringify(existing.acceptance_criteria) !== criteriaJson ||
        existing.validation_status !== params.validationStatus;
      const nextRev = changed ? existing.revision + 1 : existing.revision;
      this.#store.run(
        `UPDATE service_requirements
         SET title = ?, description = ?, category = ?, source = ?, validation_status = ?,
             acceptance_criteria_json = ?, risk_level = ?, risk_decision = ?, risk_note = ?,
             revision = ?, updated_at = ?
         WHERE requirement_id = ?`,
        params.title,
        params.description,
        params.category ?? existing.category,
        params.source,
        params.validationStatus,
        criteriaJson,
        params.riskLevel ?? existing.risk_level,
        params.riskDecision ?? existing.risk_decision,
        params.riskNote ?? existing.risk_note ?? null,
        nextRev,
        now,
        existing.requirement_id,
      );
      return this.getRequirement(params.projectId, existing.requirement_id)!;
    }

    this.#store.run(
      `INSERT INTO service_requirements
       (requirement_id, project_id, module_id, module_key, revision, title, description, category, source,
        validation_status, acceptance_criteria_json, risk_level, risk_decision, risk_note, created_at, updated_at)
       VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      reqId,
      params.projectId,
      params.moduleId,
      params.moduleKey,
      params.title,
      params.description,
      params.category ?? 'functional',
      params.source,
      params.validationStatus,
      criteriaJson,
      params.riskLevel ?? 'medium',
      params.riskDecision ?? 'not_required',
      params.riskNote ?? null,
      now,
      now,
    );
    return this.getRequirement(params.projectId, reqId)!;
  }

  getRequirement(projectId: string, requirementId: string): ServiceRequirementRecord | null {
    const row = this.#store.get(
      'SELECT * FROM service_requirements WHERE project_id = ? AND requirement_id = ?',
      projectId,
      requirementId,
    );
    return row ? mapRequirementRow(row) : null;
  }

  listRequirements(projectId: string, moduleKey?: string): ServiceRequirementRecord[] {
    const rows = moduleKey
      ? this.#store.all(
          'SELECT * FROM service_requirements WHERE project_id = ? AND module_key = ? ORDER BY created_at ASC',
          projectId,
          moduleKey,
        )
      : this.#store.all('SELECT * FROM service_requirements WHERE project_id = ? ORDER BY created_at ASC', projectId);
    return rows.map(mapRequirementRow);
  }

  proposeCases(params: {
    projectId: string;
    moduleId: string;
    moduleKey: string;
    campaignId?: string | null;
    proposals: readonly ProposeCaseInput[];
  }): {
    readonly proposed: ServiceTestCaseRecord[];
    readonly pending_oracle: ServiceTestCaseRecord[];
    readonly all_cases: ServiceTestCaseRecord[];
  } {
    const now = new Date().toISOString();
    this.assertNoLineagedCaseIds(
      params.proposals.map((p) => p.case_id ?? ''),
      'propose_cases',
    );
    const proposed: ServiceTestCaseRecord[] = [];
    const pendingOracle: ServiceTestCaseRecord[] = [];

    this.#store.transaction('IMMEDIATE', () => {
      for (const item of params.proposals) {
        const req = item.requirement_id ? this.getRequirement(params.projectId, item.requirement_id) : null;
        const reqConfirmed = Boolean(req && req.validation_status === 'confirmed' && req.acceptance_criteria.length > 0);
        const accreditedByMetadata = item.expectation_metadata?.decision_status === 'accredited';
        const oracleFromReq = reqConfirmed ? req!.acceptance_criteria[0] : null;
        const expectedOutcome =
          reqConfirmed || accreditedByMetadata
            ? (item.expected_outcome?.trim() || oracleFromReq || null)
            : null;
        const oracleSource: 'user' | 'ingested_doc' | 'missing' = expectedOutcome
          ? reqConfirmed
            ? (req!.source === 'ingested_doc' ? 'ingested_doc' : 'user')
            : item.oracle_source === 'user' || item.oracle_source === 'ingested_doc'
              ? item.oracle_source
              : 'ingested_doc'
          : 'missing';

        const hasOracle = Boolean(expectedOutcome) && oracleSource !== 'missing';
        const steps = hasOracle
          ? [...(item.steps ?? [])]
          : [...(item.steps ?? [])].filter((s) => s.type !== 'assert');
        const oracleStatus: OracleStatus = hasOracle ? 'accredited' : 'missing_oracle';
        const riskLevel = item.risk_level ?? req?.risk_level ?? 'medium';
        const needsRiskDecision = riskLevel === 'high' || riskLevel === 'critical';
        const riskDecision: RiskDecisionStatus = needsRiskDecision
          ? item.risk_accepted
            ? 'accepted_by_qa'
            : 'pending'
          : 'not_required';

        const caseId = item.case_id ? canonicalizeCaseId(item.case_id) || randomUUID() : randomUUID();
        // Aislamiento: un ID con linaje solicitado explícitamente bloquea todo el lote (rollback), nunca se omite.
        this.assertNotLineaged(params.projectId, caseId, 'propose_cases');
        const ownerRow = this.#findServiceCaseRow(caseId);
        if (ownerRow && rowStr(ownerRow.project_id) !== params.projectId) {
          throw legacyBlockedError('propose_cases', caseId);
        }
        const existing = ownerRow ? mapCaseRow(ownerRow) : null;

        const observation: ServiceTestCaseRecord['observation'] = {
          source_kind: item.observation?.source_kind ?? 'observed_dom',
          route: item.observation?.route ?? '/',
          observed_controls: item.observation?.observed_controls ?? [],
          observed_headings: item.observation?.observed_headings ?? [],
          evidence_refs: item.observation?.evidence_refs ?? [],
        };
        const inference: ServiceTestCaseRecord['inference'] = {
          rationale: item.inference?.rationale ?? 'Propuesto por QAP a partir de observaciones acreditadas.',
          proposed_flow: item.inference?.proposed_flow ?? item.title,
          step_count: steps.length,
          proposed_by: item.inference?.proposed_by ?? 'qap',
        };
        const expectation: ServiceTestCaseRecord['expectation'] & {
          metadata?: ProposeCaseInput['expectation_metadata'];
        } = {
          oracle_status: hasOracle ? 'accredited' : 'missing',
          expected_outcome: expectedOutcome,
          source: oracleSource,
          business_risk_question: !hasOracle
            ? (item.business_risk_question ?? `¿Cuál es el resultado de negocio esperado para "${item.title}"?`)
            : needsRiskDecision && riskDecision === 'pending'
              ? `Caso de riesgo ${riskLevel}: ¿confirmas ejecutarlo en el entorno actual?`
              : undefined,
          ...(item.expectation_metadata ? { metadata: item.expectation_metadata } : {}),
        };

        const version = existing
          ? JSON.stringify(existing.steps) !== JSON.stringify(steps) ||
            existing.expectation.expected_outcome !== expectedOutcome
            ? existing.version + 1
            : existing.version
          : 1;
        const conformityStatus: TestCaseConformityStatus = hasOracle && riskDecision !== 'pending'
          ? 'proposed'
          : 'pending_oracle';
        const confirmationDigest = shaDigest({
          caseId,
          moduleKey: params.moduleKey,
          version,
          requirementId: req?.requirement_id ?? null,
          requirementRevision: req?.revision ?? 1,
          steps,
          expectation,
        });

        if (existing) {
          const modified =
            existing.title !== item.title ||
            (req?.requirement_id ?? existing.requirement_id) !== existing.requirement_id ||
            (req?.revision ?? existing.requirement_revision) !== existing.requirement_revision ||
            version !== existing.version ||
            conformityStatus === 'pending_oracle';
          const nextConformityStatus: TestCaseConformityStatus = modified
            ? conformityStatus
            : existing.conformity_status;
          const nextConfirmedBy = modified ? null : (existing.confirmed_by ?? null);
          const nextConfirmedAt = modified ? null : (existing.confirmed_at ?? null);

          this.#store.run(
            `UPDATE service_test_cases
             SET title = ?, requirement_id = ?, requirement_revision = ?, version = ?,
                 observation_json = ?, inference_json = ?, expectation_json = ?,
                 oracle_status = ?, risk_level = ?, risk_decision = ?, steps_json = ?,
                 conformity_status = ?, confirmation_digest = ?, confirmed_by = ?, confirmed_at = ?,
                 campaign_id = ?, updated_at = ?
             WHERE case_id = ? AND execution_key IS NULL`,
            item.title,
            req?.requirement_id ?? existing.requirement_id,
            req?.revision ?? existing.requirement_revision,
            version,
            JSON.stringify(observation),
            JSON.stringify(inference),
            JSON.stringify(expectation),
            oracleStatus,
            riskLevel,
            riskDecision,
            JSON.stringify(steps),
            nextConformityStatus,
            confirmationDigest,
            nextConfirmedBy,
            nextConfirmedAt,
            params.campaignId ?? existing.campaign_id ?? null,
            now,
            existing.case_id,
          );
        } else {
          this.#store.run(
            `INSERT INTO service_test_cases
             (case_id, project_id, module_id, module_key, requirement_id, requirement_revision, title, version,
              observation_json, inference_json, expectation_json, oracle_status, risk_level, risk_decision,
              steps_json, conformity_status, confirmation_digest, confirmed_by, confirmed_at, campaign_id, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?)`,
            caseId,
            params.projectId,
            params.moduleId,
            params.moduleKey,
            req?.requirement_id ?? null,
            req?.revision ?? 1,
            item.title,
            JSON.stringify(observation),
            JSON.stringify(inference),
            JSON.stringify(expectation),
            oracleStatus,
            riskLevel,
            riskDecision,
            JSON.stringify(steps),
            conformityStatus,
            confirmationDigest,
            params.campaignId ?? null,
            now,
            now,
          );
        }

        const saved = this.getCase(params.projectId, existing ? existing.case_id : caseId)!;
        if (saved.conformity_status === 'pending_oracle') {
          pendingOracle.push(saved);
        } else {
          proposed.push(saved);
        }
      }
    });

    return {
      proposed,
      pending_oracle: pendingOracle,
      all_cases: this.listCases(params.projectId, params.moduleKey),
    };
  }

  decideMissingOracles(params: {
    projectId: string;
    moduleId: string;
    moduleKey: string;
    decisions: readonly OracleDecisionInput[];
  }): { readonly updated: ServiceTestCaseRecord[]; readonly missing_cases: string[] } {
    const now = new Date().toISOString();
    this.assertNoLineagedCaseIds(
      params.decisions.map((d) => d.case_id),
      'decide_oracles',
    );
    const updated: ServiceTestCaseRecord[] = [];
    const missingCases: string[] = [];
    const prepared: Array<{ readonly current: ServiceTestCaseRecord; readonly decision: OracleDecisionInput }> = [];

    for (const decision of params.decisions) {
      const canonicalId = canonicalizeCaseId(decision.case_id);
      const current = canonicalId ? this.getCase(params.projectId, canonicalId, 'decide_oracles') : null;
      const trimmedOutcome = decision.expected_outcome.trim();
      if (!current || current.module_key !== params.moduleKey || trimmedOutcome.length < 3) {
        missingCases.push(canonicalId || decision.case_id.trim());
        continue;
      }
      prepared.push({ current, decision });
    }
    if (missingCases.length > 0) {
      return { updated, missing_cases: missingCases };
    }

    this.#store.transaction('IMMEDIATE', () => {
      for (const { current, decision } of prepared) {
        const trimmedOutcome = decision.expected_outcome.trim();
        const req = this.upsertRequirement({
          projectId: params.projectId,
          moduleId: params.moduleId,
          moduleKey: params.moduleKey,
          requirementId: current.requirement_id ?? undefined,
          title: current.title,
          description: trimmedOutcome,
          source: 'user',
          validationStatus: 'confirmed',
          acceptanceCriteria: [trimmedOutcome],
          riskLevel: current.risk_level,
          riskDecision: decision.risk_accepted ? 'accepted_by_qa' : current.risk_decision,
          riskNote: decision.risk_note ?? null,
        });

        const nextSteps = [...current.steps];
        if (!nextSteps.some((s) => s.type === 'assert')) {
          nextSteps.push({
            type: 'assert',
            selector: decision.assert_selector || 'body',
            assertion_type: decision.assert_type ?? 'contains',
            expected: trimmedOutcome,
          });
        }
        const nextExpectation: ServiceTestCaseRecord['expectation'] = {
          oracle_status: 'confirmed_by_qa',
          expected_outcome: trimmedOutcome,
          source: 'user',
        };
        const nextRiskDecision: RiskDecisionStatus =
          current.risk_level === 'high' || current.risk_level === 'critical'
            ? decision.risk_accepted
              ? 'accepted_by_qa'
              : 'pending'
            : current.risk_decision;
        const nextVersion = current.version + 1;
        const nextStatus: TestCaseConformityStatus =
          nextRiskDecision === 'pending' ? 'pending_oracle' : 'proposed';
        const confirmationDigest = shaDigest({
          caseId: current.case_id,
          moduleKey: current.module_key,
          version: nextVersion,
          requirementId: req.requirement_id,
          requirementRevision: req.revision,
          steps: nextSteps,
          expectation: nextExpectation,
        });

        this.#store.run(
          `UPDATE service_test_cases
           SET requirement_id = ?, requirement_revision = ?, version = ?,
               expectation_json = ?, oracle_status = 'confirmed_by_qa', risk_decision = ?,
               steps_json = ?, conformity_status = ?, confirmation_digest = ?,
               confirmed_by = NULL, confirmed_at = NULL, updated_at = ?
           WHERE case_id = ? AND execution_key IS NULL`,
          req.requirement_id,
          req.revision,
          nextVersion,
          JSON.stringify(nextExpectation),
          nextRiskDecision,
          JSON.stringify(nextSteps),
          nextStatus,
          confirmationDigest,
          now,
          current.case_id,
        );
        updated.push(this.getCase(params.projectId, current.case_id)!);
      }
    });

    return { updated, missing_cases: missingCases };
  }

  approveCaseBatch(params: {
    projectId: string;
    moduleKey: string;
    caseIds?: readonly string[];
    approvedBy: string;
  }): {
    readonly status: 'approved' | 'blocked';
    readonly idempotent: boolean;
    readonly duplicate_confirmation_prevented: boolean;
    readonly confirmation_digest: string | null;
    readonly approved_cases: ServiceTestCaseRecord[];
    readonly skipped_pending_oracle: ServiceTestCaseRecord[];
    readonly code?: string;
  } {
    // Aislamiento: IDs con linaje solicitados explícitamente se bloquean; no se omiten en silencio.
    this.assertNoLineagedCaseIds(params.caseIds ?? [], 'approve_cases');
    const allModuleCases = this.listCases(params.projectId, params.moduleKey);
    const canonicalRequestedIds = params.caseIds?.length
      ? new Set(params.caseIds.map((id) => canonicalizeCaseId(id)).filter(Boolean))
      : null;
    const requested = canonicalRequestedIds
      ? allModuleCases.filter((c) => canonicalRequestedIds.has(canonicalizeCaseId(c.case_id)))
      : allModuleCases;

    const skippedPending = requested.filter((c) => c.conformity_status === 'pending_oracle');
    const eligible = requested.filter(
      (c) =>
        c.conformity_status !== 'pending_oracle' &&
        c.conformity_status !== 'rejected' &&
        c.oracle_status !== 'missing_oracle' &&
        c.risk_decision !== 'pending' &&
        c.steps.length > 0,
    );

    if (eligible.length === 0) {
      return {
        status: 'blocked',
        code: skippedPending.length > 0 ? 'oracle_required' : 'no_eligible_cases',
        idempotent: false,
        duplicate_confirmation_prevented: false,
        confirmation_digest: null,
        approved_cases: [],
        skipped_pending_oracle: skippedPending,
      };
    }

    const batchDigest = shaDigest(
      eligible
        .map((c) => c.confirmation_digest ?? `${c.case_id}:${c.version}`)
        .sort(),
    );

    const alreadyConfirmed = eligible.every(
      (c) =>
        ['approved', 'pass', 'fail', 'not_run', 'technical_error', 'human_accepted'].includes(c.conformity_status) &&
        Boolean(c.confirmed_at),
    );
    if (alreadyConfirmed) {
      return {
        status: 'approved',
        idempotent: true,
        duplicate_confirmation_prevented: true,
        confirmation_digest: batchDigest,
        approved_cases: eligible,
        skipped_pending_oracle: skippedPending,
      };
    }

    const now = new Date().toISOString();
    this.#store.transaction('IMMEDIATE', () => {
      for (const tc of eligible) {
        if (['approved', 'pass', 'fail', 'not_run', 'technical_error', 'human_accepted'].includes(tc.conformity_status)) {
          continue;
        }
        this.#store.run(
          `UPDATE service_test_cases
           SET conformity_status = 'approved', confirmed_by = ?, confirmed_at = ?, updated_at = ?
           WHERE case_id = ? AND execution_key IS NULL`,
          params.approvedBy,
          now,
          now,
          tc.case_id,
        );
      }
    });

    const refreshed = eligible.map((c) => this.getCase(params.projectId, c.case_id)!);
    return {
      status: 'approved',
      idempotent: false,
      duplicate_confirmation_prevented: false,
      confirmation_digest: batchDigest,
      approved_cases: refreshed,
      skipped_pending_oracle: skippedPending,
    };
  }

  getCase(projectId: string, caseId: string, operation = 'get_case'): ServiceTestCaseRecord | null {
    // Aislamiento legacy: pedir explícitamente un ID con linaje se bloquea; nunca se devuelve ni se omite.
    const canonicalId = canonicalizeCaseId(caseId);
    if (!canonicalId) return null;
    this.checkLineagedIds([canonicalId], operation, projectId);
    const row = this.#findServiceCaseRow(canonicalId, { projectId, legacyOnly: true });
    return row ? mapCaseRow(row) : null;
  }

  listCases(projectId: string, moduleKey?: string): ServiceTestCaseRecord[] {
    // Los candidatos con linaje (execution_key no nulo) tienen sus propias operaciones de consulta.
    const rows = moduleKey
      ? this.#store.all(
          'SELECT * FROM service_test_cases WHERE project_id = ? AND module_key = ? AND execution_key IS NULL ORDER BY created_at ASC',
          projectId,
          moduleKey,
        )
      : this.#store.all(
          'SELECT * FROM service_test_cases WHERE project_id = ? AND execution_key IS NULL ORDER BY created_at ASC',
          projectId,
        );
    return rows.map(mapCaseRow);
  }

  #findServiceCaseRow(
    canonicalId: string,
    filters?: { readonly projectId?: string; readonly lineagedOnly?: boolean; readonly legacyOnly?: boolean },
  ): Record<string, unknown> | undefined {
    const clauses: string[] = [isUuidCaseId(canonicalId) ? 'lower(case_id) = ?' : 'case_id = ?'];
    const args: string[] = [canonicalId];
    if (filters?.projectId !== undefined) {
      clauses.push('project_id = ?');
      args.push(filters.projectId);
    }
    if (filters?.lineagedOnly) {
      clauses.push('execution_key IS NOT NULL');
    } else if (filters?.legacyOnly) {
      clauses.push('execution_key IS NULL');
    }
    return this.#store.get(`SELECT * FROM service_test_cases WHERE ${clauses.join(' AND ')} LIMIT 1`, ...args);
  }

  private checkLineagedIds(caseIds: readonly string[], operation: string, projectId?: string): void {
    const seen = new Set<string>();
    for (const rawId of caseIds) {
      const canonical = canonicalizeCaseId(rawId);
      if (!canonical || seen.has(canonical)) continue;
      seen.add(canonical);
      const row = this.#findServiceCaseRow(canonical, { projectId, lineagedOnly: true });
      if (row && row.execution_key !== null && row.execution_key !== undefined) {
        throw legacyBlockedError(operation, canonical);
      }
    }
  }

  /** Preflight sin efectos secundarios: bloquea si cualquiera de los IDs pertenece a un caso con linaje en cualquier proyecto. */
  assertNoLineagedCaseIds(caseIds: readonly string[], operation: string): void {
    this.checkLineagedIds(caseIds, operation);
  }

  /** Preflight sin efectos secundarios acotado a un proyecto: bloquea si cualquiera de los IDs pertenece a un caso con linaje de ese proyecto. */
  assertNoProjectLineagedCaseIds(projectId: string, caseIds: readonly string[], operation: string): void {
    this.checkLineagedIds(caseIds, operation, projectId);
  }

  /** Lanza si el ID corresponde a un caso con linaje en cualquier proyecto. Las rutas legacy nunca deben operar sobre ellos. */
  private assertNotLineaged(_projectId: string, caseId: string, operation: string): void {
    this.checkLineagedIds([caseId], operation);
  }

  // ---------------------------------------------------------------------------------------------
  // P0.3b-01A — casos con linaje (operaciones internas; sin handlers ni herramientas MCP)
  // ---------------------------------------------------------------------------------------------

  private assertCanonicalReadScopeInStore(scope: NormalizedLineagedReadScope): void {
    const envById = this.#store.get<{ env_id: string }>(
      'SELECT env_id FROM environments WHERE project_id = ? AND env_id = ?',
      scope.projectId,
      scope.environmentId,
    );
    if (!envById) {
      const envByName = this.#store.get<{ env_id: string }>(
        'SELECT env_id FROM environments WHERE project_id = ? AND lower(name) = lower(?) LIMIT 1',
        scope.projectId,
        scope.environmentId,
      );
      if (envByName) {
        throw new LineagedCaseError(
          'lineaged_case_ambiguous_alias',
          "'environmentId' debe ser el identificador canónico del entorno, no su nombre.",
          { field: 'environmentId' },
        );
      }
    }

    if (scope.profileId !== null) {
      const profById = this.#store.get<{ profile_id: string }>(
        'SELECT profile_id FROM profiles WHERE project_id = ? AND profile_id = ?',
        scope.projectId,
        scope.profileId,
      );
      if (!profById) {
        const profByLabel = this.#store.get<{ profile_id: string }>(
          'SELECT profile_id FROM profiles WHERE project_id = ? AND lower(label) = lower(?) LIMIT 1',
          scope.projectId,
          scope.profileId,
        );
        if (profByLabel) {
          throw new LineagedCaseError(
            'lineaged_case_ambiguous_alias',
            "'profileId' debe ser el identificador canónico del perfil, no su alias/label.",
            { field: 'profileId' },
          );
        }
      }
    }
  }

  getLineagedCase(
    scope: LineagedCaseReadScopeInput | LineagedCaseScope,
    selector: LineagedCaseSelector,
  ): LineagedCaseRecord | null;
  getLineagedCase(
    projectId: string,
    selector: LineagedCaseSelector & Partial<LineagedCaseReadScopeInput>,
    scope?: LineagedCaseReadScopeInput | LineagedCaseScope,
  ): LineagedCaseRecord | null;
  getLineagedCase(
    arg1: LineagedCaseReadScopeInput | LineagedCaseScope | string,
    arg2: unknown,
    arg3?: unknown,
  ): LineagedCaseRecord | null {
    const { scope, selector } = resolveLineagedReadArguments(arg1, arg2, arg3);
    this.assertCanonicalReadScopeInStore(scope);

    const row =
      selector.kind === 'caseId'
        ? this.#store.get(
            `SELECT * FROM service_test_cases
             WHERE project_id = ? AND module_key = ? AND case_id = ? AND execution_key IS NOT NULL
             LIMIT 1`,
            scope.projectId,
            scope.moduleKey,
            selector.caseId,
          )
        : this.#store.get(
            `SELECT * FROM service_test_cases
             WHERE project_id = ? AND module_key = ? AND execution_key = ?
             LIMIT 1`,
            scope.projectId,
            scope.moduleKey,
            selector.executionKey,
          );

    if (!row || !rowBelongsToLineagedReadScope(row, scope)) {
      return null;
    }
    return parseLineagedCaseRow(row, scope);
  }

  listLineagedCases(scope: LineagedCaseReadScopeInput | LineagedCaseScope): LineagedCaseRecord[];
  listLineagedCases(
    projectId: string,
    scope: Omit<LineagedCaseReadScopeInput, 'projectId'> & { readonly projectId?: string },
  ): LineagedCaseRecord[];
  listLineagedCases(
    arg1: LineagedCaseReadScopeInput | LineagedCaseScope | string,
    arg2?: unknown,
  ): LineagedCaseRecord[] {
    const scope = resolveLineagedListArguments(arg1, arg2);
    this.assertCanonicalReadScopeInStore(scope);

    const rows = this.#store.all(
      `SELECT * FROM service_test_cases
       WHERE project_id = ? AND module_key = ? AND execution_key IS NOT NULL
       ORDER BY created_at ASC, case_id ASC`,
      scope.projectId,
      scope.moduleKey,
    );
    return rows
      .filter((row) => rowBelongsToLineagedReadScope(row, scope))
      .map((row) => parseLineagedCaseRow(row, scope));
  }

  /**
   * Crea, repite (idempotente) o avanza un caso con linaje. DEBE ejecutarse dentro de una transacción
   * IMMEDIATE abierta por el llamador (las referencias se verifican en esa misma transacción).
   *
   * - Sin caso previo para la identidad lógica: se genera el UUID y se inserta la versión 1.
   * - Mismo dossier y misma revisión de regla: mismo contenido → devuelve el existente; distinto → conflicto.
   * - Linaje avanzado (otro dossier o revisión de regla mayor): exige `expectedVersion` (CAS), mantiene el ID,
   *   incrementa la versión e invalida cualquier aprobación previa.
   * - Revisión de regla inferior a la registrada: rechazada.
   * Todo caso queda pending_oracle / missing_oracle, sin aprobación ni elegibilidad de ejecución.
   */
  upsertLineagedCandidateInTransaction(params: {
    readonly projectId: string;
    readonly moduleKey: string;
    readonly scope?: LineagedCaseScope;
    readonly executionKey: string;
    readonly dossierRevisionId: string;
    readonly ruleRevision: number;
    readonly expectedVersion: number | undefined;
    /** Solo se invoca al crear: garantiza el módulo sin mutar nada en repeticiones ni conflictos. */
    readonly resolveModuleId: () => string;
    /** Construye el documento con el ID y la versión definitivos (el ID existente se resuelve antes). */
    readonly prepare: (caseId: string, version: number) => LineagedCaseDocument;
  }): LineagedCaseWriteResult {
    const inTransaction = (this.#store.db as unknown as { isTransaction?: boolean }).isTransaction;
    if (inTransaction === false) {
      throw new Error('upsertLineagedCandidateInTransaction requiere una transacción IMMEDIATE activa.');
    }

    const expectedScope = normalizeLineagedReadScope(params.scope, params.projectId);
    if (expectedScope.moduleKey !== params.moduleKey) {
      throw new LineagedCaseError('lineaged_case_scope_mismatch', 'El módulo no coincide con el ámbito.', { field: 'moduleKey' });
    }
    const existingRow = this.#store.get(
      'SELECT * FROM service_test_cases WHERE project_id = ? AND module_key = ? AND execution_key = ?',
      params.projectId,
      params.moduleKey,
      params.executionKey,
    );
    const now = new Date().toISOString();
    const prepare = (caseId: string, version: number): LineagedCaseDocument => {
      const document = params.prepare(caseId, version);
      if (!matchesLineagedReadScope(document.scope, expectedScope) ||
          document.identity.case_id !== caseId || document.identity.execution_key !== params.executionKey ||
          computeLineagedExecutionKey(document.scope, document.lineage.rule) !== params.executionKey) {
        throw new LineagedCaseError('lineaged_case_scope_mismatch', 'El documento contradice el ámbito o la identidad solicitados.', { field: 'scope' });
      }
      return document;
    };

    if (!existingRow) {
      if (params.expectedVersion !== undefined) {
        throw new LineagedCaseError(
          'lineaged_case_stale_version',
          `No existe un caso previo para esta identidad; 'expectedVersion' (${params.expectedVersion}) no aplica a una creación.`,
          { expected_version: params.expectedVersion, current_version: null },
        );
      }
      const caseId = randomUUID();
      const document = prepare(caseId, 1);
      const digest = computeLineagedCaseDigest(document, 1);
      const moduleId = params.resolveModuleId();
      this.#store.run(
        `INSERT INTO service_test_cases
         (case_id, project_id, module_id, module_key, requirement_id, requirement_revision, title, version,
          observation_json, inference_json, expectation_json, oracle_status, risk_level, risk_decision,
          steps_json, conformity_status, confirmation_digest, confirmed_by, confirmed_at, campaign_id,
          created_at, updated_at, execution_key, execution_lineage_json, execution_content_digest,
          execution_approval_id)
         VALUES (?, ?, ?, ?, NULL, 1, ?, 1, ?, ?, ?, 'missing_oracle', 'medium', 'not_required',
                 '[]', 'pending_oracle', NULL, NULL, NULL, NULL, ?, ?, ?, ?, ?, NULL)`,
        caseId,
        params.projectId,
        moduleId,
        params.moduleKey,
        document.tc_case.name,
        ...lineagedLegacyColumns(document),
        now,
        now,
        params.executionKey,
        stableStringify(document),
        digest,
      );
      return { outcome: 'created', case: this.requireLineagedCase(document.scope, caseId) };
    }

    if (!rowBelongsToLineagedReadScope(existingRow, expectedScope)) {
      throw new LineagedCaseError('lineaged_case_scope_mismatch', 'El candidato no pertenece al ámbito solicitado.', { field: 'scope' });
    }
    const existing = parseLineagedCaseRow(existingRow, expectedScope);
    const storedRevision = existing.lineage.rule.revision;
    if (params.ruleRevision < storedRevision) {
      throw new LineagedCaseError(
        'lineaged_case_rule_revision_regression',
        `La revisión de regla ${params.ruleRevision} es inferior a la registrada (${storedRevision}).`,
        { stored_revision: storedRevision, candidate_revision: params.ruleRevision },
      );
    }

    const sameLineage =
      params.ruleRevision === storedRevision && existing.lineage.dossier.revision_id === params.dossierRevisionId;
    if (sameLineage) {
      const document = prepare(existing.case_id, existing.version);
      const digest = computeLineagedCaseDigest(document, existing.version);
      if (digest === existing.execution_content_digest) {
        return { outcome: 'unchanged', case: this.requireLineagedCase(document.scope, existing.case_id) };
      }
      throw new LineagedCaseError(
        'lineaged_case_content_conflict',
        'Contenido distinto con el mismo dossier y la misma revisión de regla: el caso existente no se modifica.',
        { case_id: existing.case_id, version: existing.version },
      );
    }

    // Avance de linaje: compare-and-swap sobre la versión.
    if (params.expectedVersion === undefined) {
      throw new LineagedCaseError(
        'lineaged_case_expected_version_required',
        "Avanzar el linaje de un caso existente exige 'expectedVersion'.",
        { case_id: existing.case_id, current_version: existing.version },
      );
    }
    if (params.expectedVersion !== existing.version) {
      throw new LineagedCaseError(
        'lineaged_case_stale_version',
        `Versión obsoleta: se esperaba ${params.expectedVersion} y la vigente es ${existing.version}.`,
        { case_id: existing.case_id, expected_version: params.expectedVersion, current_version: existing.version },
      );
    }

    const nextVersion = existing.version + 1;
    const document = prepare(existing.case_id, nextVersion);
    const digest = computeLineagedCaseDigest(document, nextVersion);
    const [observationJson, inferenceJson, expectationJson] = lineagedLegacyColumns(document);
    const result = this.#store.run(
      `UPDATE service_test_cases
       SET title = ?, version = ?, observation_json = ?, inference_json = ?, expectation_json = ?,
           oracle_status = 'missing_oracle', risk_level = 'medium', risk_decision = 'not_required',
           steps_json = '[]', conformity_status = 'pending_oracle',
           confirmation_digest = NULL, confirmed_by = NULL, confirmed_at = NULL,
           execution_lineage_json = ?, execution_content_digest = ?, execution_approval_id = NULL,
           updated_at = ?
       WHERE project_id = ? AND case_id = ? AND execution_key = ? AND version = ?`,
      document.tc_case.name,
      nextVersion,
      observationJson,
      inferenceJson,
      expectationJson,
      stableStringify(document),
      digest,
      now,
      params.projectId,
      existing.case_id,
      params.executionKey,
      existing.version,
    );
    if (Number(result.changes) !== 1) {
      throw new LineagedCaseError(
        'lineaged_case_stale_version',
        'Versión obsoleta: el caso cambió durante la escritura.',
        { case_id: existing.case_id, expected_version: params.expectedVersion },
      );
    }
    return { outcome: 'advanced', case: this.requireLineagedCase(document.scope, existing.case_id) };
  }

  private requireLineagedCase(scope: LineagedCaseScope, caseId: string): LineagedCaseRecord {
    const record = this.getLineagedCase(scope, { caseId, routePathname: scope.route_pathname });
    if (!record) {
      throw new LineagedCaseError('lineaged_case_corrupt', `No se pudo releer el caso con linaje '${caseId}'.`, {
        case_id: caseId,
      });
    }
    return record;
  }

  createExecutionAttempt(params: {
    projectId: string;
    campaignId: string;
    moduleId: string;
    moduleKey: string;
    envId: string;
    profileId?: string | null;
    executionId?: string;
    attemptId?: string;
    cases: readonly {
      case_id: string;
      version?: number;
      requirement_id?: string | null;
      requirement_revision?: number;
      title?: string;
    }[];
  }): ExecutionAttemptRecord {
    const now = new Date().toISOString();
    const canonicalCases = params.cases.map((c) => ({
      ...c,
      case_id: canonicalizeCaseId(c.case_id) || c.case_id.trim(),
    }));
    this.assertNoLineagedCaseIds(
      canonicalCases.map((c) => c.case_id),
      'create_attempt',
    );
    const attemptId = params.attemptId ?? `att_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    if (params.attemptId) {
      const existing = this.getExecutionAttempt(attemptId);
      if (existing) {
        if (existing.project_id !== params.projectId) {
          throw new Error(`Execution attempt '${attemptId}' belongs to another project.`);
        }
        return existing;
      }
    }
    const executionId = params.executionId?.trim() || `exec_${Date.now()}_${randomUUID().slice(0, 6)}`;
    const caseIds = canonicalCases.map((c) => c.case_id);
    const caseVersions: Record<string, number> = {};
    const reqRevisions: ExecutionAttemptRecord['requirement_revisions'][number][] = [];

    for (const c of canonicalCases) {
      const existingCase = this.getCase(params.projectId, c.case_id, 'create_attempt');
      caseVersions[c.case_id] = c.version ?? existingCase?.version ?? 1;
      reqRevisions.push({
        requirement_id: c.requirement_id ?? existingCase?.requirement_id ?? null,
        revision: c.requirement_revision ?? existingCase?.requirement_revision ?? 1,
        title: c.title ?? existingCase?.title ?? c.case_id,
      });
    }

    this.#store.run(
      `INSERT INTO execution_attempts
       (attempt_id, execution_id, project_id, campaign_id, module_id, module_key, env_id, profile_id,
        status, case_ids_json, case_versions_json, requirement_revisions_json, started_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'prepared', ?, ?, ?, ?)`,
      attemptId,
      executionId,
      params.projectId,
      params.campaignId,
      params.moduleId,
      params.moduleKey,
      params.envId,
      params.profileId ?? null,
      JSON.stringify(caseIds),
      JSON.stringify(caseVersions),
      JSON.stringify(reqRevisions),
      now,
    );
    return this.getExecutionAttempt(attemptId)!;
  }

  markAttemptRunning(attemptId: string): ExecutionAttemptRecord | null {
    this.#store.run('UPDATE execution_attempts SET status = ? WHERE attempt_id = ? AND status = ?', 'running', attemptId, 'prepared');
    return this.getExecutionAttempt(attemptId);
  }

  discardUncommittedAttempt(attemptId: string): boolean {
    let removed = false;
    this.#store.transaction('IMMEDIATE', () => {
      const existing = this.getExecutionAttempt(attemptId);
      if (!existing || (existing.status !== 'prepared' && existing.status !== 'running')) {
        return;
      }
      this.#store.run('DELETE FROM execution_case_results WHERE attempt_id = ?', attemptId);
      this.#store.run('DELETE FROM host_session_state WHERE key = ?', `attempt_evidence:${attemptId}`);
      const res = this.#store.run(
        "DELETE FROM execution_attempts WHERE attempt_id = ? AND status IN ('prepared', 'running')",
        attemptId,
      );
      removed = Number(res.changes) > 0;
    });
    return removed;
  }

  markAttemptFinalizationPending(
    attemptId: string,
    executionId: string,
    message: string,
  ): ExecutionAttemptRecord | null {
    this.#store.run(
      `UPDATE execution_attempts
       SET execution_id = ?, status = 'running', error_code = 'execution_finalization_pending', error_message = ?
       WHERE attempt_id = ? AND status IN ('prepared', 'running')`,
      executionId,
      message,
      attemptId,
    );
    return this.getExecutionAttempt(attemptId);
  }

  finalizeExecutionAttempt(params: {
    attemptId: string;
    executionResult?: ExecutionResult;
    technicalError?: { code: string; message: string };
    blockedCode?: string;
    rawExecutionPath?: string | null;
    tracePath?: string | null;
  }): { readonly attempt: ExecutionAttemptRecord; readonly case_results: ExecutionCaseResultRecord[] } {
    const attempt = this.getExecutionAttempt(params.attemptId);
    if (!attempt) {
      throw new Error(`Execution attempt not found: ${params.attemptId}`);
    }
    this.assertNoLineagedCaseIds(
      [...attempt.case_ids, ...(params.executionResult?.cases.map((c) => c.id) ?? [])],
      'finalize_attempt',
    );
    const now = new Date().toISOString();
    const caseResults: ExecutionCaseResultRecord[] = [];
    let attemptStatus: ExecutionAttemptStatus;

    if (params.blockedCode) {
      attemptStatus = 'blocked';
    } else if (params.technicalError || params.executionResult?.result === 'error') {
      attemptStatus = 'technical_error';
    } else if (params.executionResult?.result === 'partial') {
      attemptStatus = 'partial';
    } else {
      attemptStatus = 'completed';
    }

    const resultDigest = params.executionResult ? shaDigest(params.executionResult) : null;
    const reqByIndex = attempt.requirement_revisions;

    this.#store.transaction('IMMEDIATE', () => {
      const existingCaseRows = this.#store.all<{ result_row_id: unknown }>(
        'SELECT result_row_id FROM execution_case_results WHERE attempt_id = ? ORDER BY created_at ASC',
        attempt.attempt_id,
      );
      if (
        attempt.status !== 'prepared' &&
        attempt.status !== 'running' &&
        existingCaseRows.length > 0
      ) {
        this.#store.run(
          `UPDATE execution_attempts
           SET raw_execution_path = COALESCE(?, raw_execution_path),
               trace_path = COALESCE(?, trace_path),
               result_digest = COALESCE(?, result_digest)
           WHERE attempt_id = ?`,
          params.rawExecutionPath ?? null,
          params.tracePath ?? null,
          resultDigest,
          attempt.attempt_id,
        );
        if (params.executionResult) {
          const artifactsMeta = {
            video_path: params.executionResult.artifacts?.video_path ?? null,
            trace_zip_path: params.executionResult.artifacts?.trace_zip_path ?? null,
            timeline_path: params.executionResult.artifacts?.timeline_path ?? null,
            screenshots: Array.from(
              new Set([
                ...(params.executionResult.artifacts?.screenshots ?? []),
                ...params.executionResult.cases.flatMap((item) => item.screenshots ?? []),
              ]),
            ),
            artifact_errors: params.executionResult.artifacts?.artifact_errors ?? [],
          };
          this.#store.run(
            `INSERT INTO host_session_state (key, value, updated_at)
             VALUES (?, ?, ?)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
            `attempt_evidence:${attempt.attempt_id}`,
            JSON.stringify(artifactsMeta),
            now,
          );
        }
        for (const r of existingCaseRows) {
          const loaded = this.getCaseResultRow(rowStr(r.result_row_id));
          if (loaded) caseResults.push(loaded);
        }
        return;
      }

      this.#store.run(
        `UPDATE execution_attempts
         SET execution_id = ?, status = ?, finished_at = ?, error_code = ?, error_message = ?,
             raw_execution_path = ?, trace_path = ?, result_digest = ?
         WHERE attempt_id = ?`,
        params.executionResult?.execution_id ?? attempt.execution_id,
        attemptStatus,
        now,
        params.blockedCode ?? params.technicalError?.code ?? null,
        params.technicalError?.message ?? null,
        params.rawExecutionPath ?? null,
        params.tracePath ?? null,
        resultDigest,
        attempt.attempt_id,
      );

      this.#store.run('DELETE FROM execution_case_results WHERE attempt_id = ?', attempt.attempt_id);

      if (params.executionResult) {
        for (const [idx, c] of params.executionResult.cases.entries()) {
          const canonicalCaseId = canonicalizeCaseId(c.id) || c.id;
          const svcCase = this.getCase(attempt.project_id, canonicalCaseId, 'finalize_attempt');
          const reqInfo = reqByIndex[idx];
          const verdict: CaseExecutionVerdict =
            c.result === 'passed'
              ? 'PASS'
              : c.result === 'failed'
                ? 'FAIL'
                : params.executionResult.result === 'error' && c.not_run_reason?.toLowerCase().includes('infraestructura')
                  ? 'technical_error'
                  : 'not_run';

          const stepResults: ExecutionStepResultRecord[] = (c.steps ?? []).map((st, sIdx) => ({
            step_index: st.step_index ?? sIdx,
            action: st.action,
            status:
              st.status === 'passed'
                ? 'PASS'
                : st.status === 'failed'
                  ? 'FAIL'
                  : 'not_run',
            duration_ms: st.duration_ms,
            ...(st.selector !== undefined ? { selector: st.selector } : {}),
            ...(st.expected !== undefined ? { expected: st.expected } : {}),
            ...(st.observed !== undefined ? { observed: st.observed } : {}),
            ...(st.started_at !== undefined ? { started_at: st.started_at } : {}),
            ...(st.finished_at !== undefined ? { finished_at: st.finished_at } : {}),
            ...(st.focused_screenshot !== undefined ? { focused_screenshot: st.focused_screenshot } : {}),
            ...(st.artifact_error !== undefined ? { artifact_error: st.artifact_error } : {}),
            ...(st.redacted_selectors_count !== undefined
              ? { redacted_selectors_count: st.redacted_selectors_count }
              : {}),
            message: st.message ?? undefined,
            evidence_paths: st.screenshot ? [st.screenshot] : [],
          }));
          const caseVideo = c.video_path ?? params.executionResult.artifacts?.video_path ?? null;
          const caseTraceZip = c.trace_zip_path ?? params.executionResult.artifacts?.trace_zip_path ?? null;
          const caseTimeline = c.timeline_path ?? params.executionResult.artifacts?.timeline_path ?? null;
          const evidenceRefs = Array.from(
            new Set([
              ...(c.screenshots ?? []),
              ...stepResults.flatMap((s) => s.evidence_paths),
              ...(caseVideo ? [caseVideo] : []),
              ...(caseTraceZip ? [caseTraceZip] : []),
              ...(caseTimeline ? [caseTimeline] : []),
              ...(params.rawExecutionPath ? [params.rawExecutionPath] : []),
              ...(params.tracePath ? [params.tracePath] : []),
            ]),
          );

          const rowId = `ecr_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
          this.#store.run(
            `INSERT INTO execution_case_results
             (result_row_id, attempt_id, project_id, campaign_id, module_key, requirement_id, requirement_revision,
              case_id, case_version, verdict, human_acceptance_reason, human_accepted_by, human_accepted_at,
              step_results_json, evidence_refs_json, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, ?, ?, ?)`,
            rowId,
            attempt.attempt_id,
            attempt.project_id,
            attempt.campaign_id,
            attempt.module_key,
            svcCase?.requirement_id ?? reqInfo?.requirement_id ?? null,
            svcCase?.requirement_revision ?? reqInfo?.revision ?? 1,
            canonicalCaseId,
            attempt.case_versions[canonicalCaseId] ?? attempt.case_versions[c.id] ?? svcCase?.version ?? 1,
            verdict,
            JSON.stringify(stepResults),
            JSON.stringify(evidenceRefs),
            now,
          );
          if (svcCase) {
            const nextConformity: TestCaseConformityStatus =
              verdict === 'PASS'
                ? 'pass'
                : verdict === 'FAIL'
                  ? 'fail'
                  : verdict === 'technical_error'
                    ? 'technical_error'
                    : 'not_run';
            this.#store.run(
              'UPDATE service_test_cases SET conformity_status = ?, updated_at = ? WHERE case_id = ? AND execution_key IS NULL',
              nextConformity,
              now,
              svcCase.case_id,
            );
          }
          caseResults.push(this.getCaseResultRow(rowId)!);
        }

        const artifactsMeta = {
          video_path: params.executionResult.artifacts?.video_path ?? null,
          trace_zip_path: params.executionResult.artifacts?.trace_zip_path ?? null,
          timeline_path: params.executionResult.artifacts?.timeline_path ?? null,
          screenshots: Array.from(
            new Set([
              ...(params.executionResult.artifacts?.screenshots ?? []),
              ...params.executionResult.cases.flatMap((item) => item.screenshots ?? []),
            ]),
          ),
          artifact_errors: params.executionResult.artifacts?.artifact_errors ?? [],
        };
        this.#store.run(
          `INSERT INTO host_session_state (key, value, updated_at)
           VALUES (?, ?, ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
          `attempt_evidence:${attempt.attempt_id}`,
          JSON.stringify(artifactsMeta),
          now,
        );
      } else if (params.technicalError) {
        for (const [idx, rawCaseId] of attempt.case_ids.entries()) {
          const caseId = canonicalizeCaseId(rawCaseId) || rawCaseId;
          const svcCase = this.getCase(attempt.project_id, caseId, 'finalize_attempt');
          const reqInfo = reqByIndex[idx];
          const rowId = `ecr_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
          this.#store.run(
            `INSERT INTO execution_case_results
             (result_row_id, attempt_id, project_id, campaign_id, module_key, requirement_id, requirement_revision,
              case_id, case_version, verdict, human_acceptance_reason, human_accepted_by, human_accepted_at,
              step_results_json, evidence_refs_json, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'technical_error', NULL, NULL, NULL, ?, '[]', ?)`,
            rowId,
            attempt.attempt_id,
            attempt.project_id,
            attempt.campaign_id,
            attempt.module_key,
            svcCase?.requirement_id ?? reqInfo?.requirement_id ?? null,
            svcCase?.requirement_revision ?? reqInfo?.revision ?? 1,
            caseId,
            attempt.case_versions[caseId] ?? attempt.case_versions[rawCaseId] ?? svcCase?.version ?? 1,
            JSON.stringify([
              {
                step_index: 0,
                action: 'runner_bootstrap',
                status: 'technical_error',
                message: params.technicalError.message,
                evidence_paths: [],
              },
            ]),
            now,
          );
          if (svcCase) {
            this.#store.run(
              'UPDATE service_test_cases SET conformity_status = ?, updated_at = ? WHERE case_id = ? AND execution_key IS NULL',
              'technical_error',
              now,
              svcCase.case_id,
            );
          }
          caseResults.push(this.getCaseResultRow(rowId)!);
        }
      }
    });

    return { attempt: this.getExecutionAttempt(attempt.attempt_id)!, case_results: caseResults };
  }

  recordHumanAcceptance(params: {
    projectId: string;
    caseId: string;
    moduleKey?: string;
    acceptedBy: string;
    reason: string;
  }): ExecutionCaseResultRecord | null {
    const trimmed = params.reason.trim();
    const canonicalCaseId = canonicalizeCaseId(params.caseId);
    if (!canonicalCaseId) return null;
    this.assertNotLineaged(params.projectId, canonicalCaseId, 'record_human_acceptance');
    if (trimmed.length < 15) {
      throw new Error('La aceptación humana requiere una justificación de al menos 15 caracteres.');
    }
    const caseFilter = isUuidCaseId(canonicalCaseId) ? 'lower(case_id) = ?' : 'case_id = ?';
    const row = params.moduleKey
      ? this.#store.get(
          `SELECT * FROM execution_case_results
           WHERE project_id = ? AND ${caseFilter} AND module_key = ?
           ORDER BY created_at DESC LIMIT 1`,
          params.projectId,
          canonicalCaseId,
          params.moduleKey,
        )
      : this.#store.get(
          `SELECT * FROM execution_case_results
           WHERE project_id = ? AND ${caseFilter}
           ORDER BY created_at DESC LIMIT 1`,
          params.projectId,
          canonicalCaseId,
        );
    if (!row) return null;

    const existing = mapCaseResultRow(row);
    const now = new Date().toISOString();
    this.#store.transaction('IMMEDIATE', () => {
      this.#store.run(
        `UPDATE execution_case_results
         SET verdict = 'human_accepted', human_acceptance_reason = ?, human_accepted_by = ?, human_accepted_at = ?
         WHERE result_row_id = ?`,
        trimmed,
        params.acceptedBy,
        now,
        existing.result_row_id,
      );
      this.#store.run(
        `UPDATE service_test_cases SET conformity_status = ?, updated_at = ? WHERE project_id = ? AND ${caseFilter} AND execution_key IS NULL`,
        'human_accepted',
        now,
        params.projectId,
        canonicalCaseId,
      );
    });
    return this.getCaseResultRow(existing.result_row_id);
  }

  private hydrateAttemptEvidence(record: ExecutionAttemptRecord): ExecutionAttemptRecord {
    const metaRow = this.#store.get<{ value?: string }>(
      'SELECT value FROM host_session_state WHERE key = ?',
      `attempt_evidence:${record.attempt_id}`,
    );
    if (!metaRow?.value) return record;
    try {
      const parsed = JSON.parse(metaRow.value) as {
        video_path?: string | null;
        trace_zip_path?: string | null;
        timeline_path?: string | null;
        screenshots?: string[];
        artifact_errors?: ExecutionAttemptRecord['artifact_errors'];
      };
      return {
        ...record,
        video_path: parsed.video_path ?? null,
        trace_zip_path: parsed.trace_zip_path ?? null,
        timeline_path: parsed.timeline_path ?? null,
        screenshots: parsed.screenshots ?? [],
        artifact_errors: parsed.artifact_errors ?? [],
      };
    } catch {
      return record;
    }
  }

  getExecutionAttempt(attemptId: string): ExecutionAttemptRecord | null {
    const row = this.#store.get('SELECT * FROM execution_attempts WHERE attempt_id = ?', attemptId);
    return row ? this.hydrateAttemptEvidence(mapAttemptRow(row)) : null;
  }

  listExecutionAttempts(projectId: string, moduleKey?: string): ExecutionAttemptRecord[] {
    const rows = moduleKey
      ? this.#store.all(
          'SELECT * FROM execution_attempts WHERE project_id = ? AND module_key = ? ORDER BY started_at DESC',
          projectId,
          moduleKey,
        )
      : this.#store.all(
          'SELECT * FROM execution_attempts WHERE project_id = ? ORDER BY started_at DESC',
          projectId,
        );
    return rows.map((r) => this.hydrateAttemptEvidence(mapAttemptRow(r)));
  }

  getCaseResultRow(resultRowId: string): ExecutionCaseResultRecord | null {
    const row = this.#store.get('SELECT * FROM execution_case_results WHERE result_row_id = ?', resultRowId);
    return row ? mapCaseResultRow(row) : null;
  }

  getExecutionSummary(projectId: string, moduleKey?: string): CanonicalExecutionSummary {
    const attempts = this.listExecutionAttempts(projectId, moduleKey);
    const rows = moduleKey
      ? this.#store.all(
          'SELECT * FROM execution_case_results WHERE project_id = ? AND module_key = ? ORDER BY created_at DESC',
          projectId,
          moduleKey,
        )
      : this.#store.all(
          'SELECT * FROM execution_case_results WHERE project_id = ? ORDER BY created_at DESC',
          projectId,
        );
    const allResults = rows.map(mapCaseResultRow);
    // Keep latest verdict per case_id
    const latestByCase = new Map<string, ExecutionCaseResultRecord>();
    for (const r of allResults) {
      if (!latestByCase.has(r.case_id)) {
        latestByCase.set(r.case_id, r);
      }
    }
    const latestVerdicts = Array.from(latestByCase.values());
    const counts = {
      pass: latestVerdicts.filter((v) => v.verdict === 'PASS').length,
      fail: latestVerdicts.filter((v) => v.verdict === 'FAIL').length,
      not_run: latestVerdicts.filter((v) => v.verdict === 'not_run').length,
      technical_error: latestVerdicts.filter((v) => v.verdict === 'technical_error').length,
      human_accepted: latestVerdicts.filter((v) => v.verdict === 'human_accepted').length,
    };

    const latestAttempt = attempts[0] ?? null;
    let status: CanonicalExecutionSummary['status'] = 'not_executed';
    if (latestVerdicts.length > 0) {
      if (counts.technical_error > 0 && counts.pass === 0 && counts.human_accepted === 0) {
        status = 'executed_error';
      } else if (counts.fail > 0 && counts.pass === 0 && counts.human_accepted === 0) {
        status = 'executed_failed';
      } else if (counts.pass + counts.human_accepted === latestVerdicts.length) {
        status = 'executed_passed';
      } else {
        status = 'executed_partial';
      }
    } else if (latestAttempt?.status === 'technical_error') {
      status = 'executed_error';
    }

    return {
      status,
      latest_attempt_id: latestAttempt?.attempt_id ?? null,
      latest_execution_id: latestAttempt?.execution_id ?? null,
      total_attempts: attempts.length,
      total_cases: latestVerdicts.length,
      counts,
      case_verdicts: latestVerdicts,
    };
  }

  beginReportPublication(params: {
    projectId: string;
    campaignId?: string | null;
    attemptId?: string | null;
    executionId: string;
    moduleKey: string;
    requestedFormats: readonly ('html' | 'markdown' | 'junit' | 'json')[];
  }): ReportPublicationRecord {
    const existingRow = this.#store.get(
      `SELECT * FROM report_publications
       WHERE project_id = ? AND execution_id = ? AND module_key = ?
       ORDER BY updated_at DESC LIMIT 1`,
      params.projectId,
      params.executionId,
      params.moduleKey,
    );
    if (existingRow) {
      const existing = mapPublicationRow(existingRow);
      if (existing.status === 'partial') {
        const mergedFormats = Array.from(new Set([...existing.requested_formats, ...params.requestedFormats]));
        const now = new Date().toISOString();
        this.#store.run(
          'UPDATE report_publications SET requested_formats_json = ?, updated_at = ? WHERE publication_id = ?',
          JSON.stringify(mergedFormats),
          now,
          existing.publication_id,
        );
        return this.getPublication(existing.publication_id)!;
      }
      return existing;
    }

    const now = new Date().toISOString();
    const pubId = `pub_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    this.#store.run(
      `INSERT INTO report_publications
       (publication_id, project_id, campaign_id, attempt_id, execution_id, module_key,
        requested_formats_json, published_formats_json, failed_format, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, '{}', NULL, 'partial', ?, ?)`,
      pubId,
      params.projectId,
      params.campaignId ?? null,
      params.attemptId ?? null,
      params.executionId,
      params.moduleKey,
      JSON.stringify(params.requestedFormats),
      now,
      now,
    );
    return this.getPublication(pubId)!;
  }

  recordPublishedFormat(params: {
    publicationId: string;
    format: ReportFormatEntry['format'];
    filePath: string;
    sha256: string;
    bytes: number;
  }): ReportPublicationRecord {
    const pub = this.getPublication(params.publicationId);
    if (!pub) throw new Error(`Report publication not found: ${params.publicationId}`);
    const now = new Date().toISOString();
    const updatedFormats: Record<string, ReportFormatEntry> = {
      ...pub.published_formats,
      [params.format]: {
        format: params.format,
        path: params.filePath,
        sha256: params.sha256,
        bytes: params.bytes,
        published_at: now,
      },
    };
    const allPublished = pub.requested_formats.every((f) => Boolean(updatedFormats[f]));
    this.#store.run(
      `UPDATE report_publications
       SET published_formats_json = ?, failed_format = ?, status = ?, updated_at = ?
       WHERE publication_id = ?`,
      JSON.stringify(updatedFormats),
      allPublished ? null : pub.failed_format ?? null,
      allPublished ? 'completed' : 'partial',
      now,
      params.publicationId,
    );
    return this.getPublication(params.publicationId)!;
  }

  failReportPublication(publicationId: string, failedFormat: string): ReportPublicationRecord | null {
    const now = new Date().toISOString();
    this.#store.run(
      `UPDATE report_publications SET failed_format = ?, status = 'partial', updated_at = ? WHERE publication_id = ?`,
      failedFormat,
      now,
      publicationId,
    );
    return this.getPublication(publicationId);
  }

  getPublication(publicationId: string): ReportPublicationRecord | null {
    const row = this.#store.get('SELECT * FROM report_publications WHERE publication_id = ?', publicationId);
    return row ? mapPublicationRow(row) : null;
  }

  listRecoverablePublications(projectId: string): ReportPublicationRecord[] {
    return this.#store
      .all(
        `SELECT * FROM report_publications WHERE project_id = ? AND status = 'partial' ORDER BY updated_at DESC`,
        projectId,
      )
      .map(mapPublicationRow);
  }

  getRecoverablePublication(projectId: string, executionId?: string): ReportPublicationRecord | null {
    const row = executionId
      ? this.#store.get(
          `SELECT * FROM report_publications WHERE project_id = ? AND execution_id = ? ORDER BY updated_at DESC LIMIT 1`,
          projectId,
          executionId,
        )
      : this.#store.get(
          `SELECT * FROM report_publications WHERE project_id = ? AND status = 'partial' ORDER BY updated_at DESC LIMIT 1`,
          projectId,
        );
    return row ? mapPublicationRow(row) : null;
  }
}
