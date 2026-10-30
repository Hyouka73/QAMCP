import { createHash } from 'node:crypto';

import { KnowledgeStoreError, type IKnowledgeStore, type KnowledgeRef } from '@qap/engine';
import { isSubstantiveRuleText, validateExpectedRequirement, type ExpectedRequirement, type RequirementCategory } from '@qap/shared';

import { ModuleObservationBridge, type BridgeContext } from './module-observation-bridge.js';

const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const categories = ['functional', 'business_rule', 'security', 'ui', 'ux', 'regression', 'performance'] as const;
type Category = 'proposito' | 'actor' | 'campo' | 'accion' | 'error' | 'dato' | 'sensibilidad';
/** Suggestions only. The proposal and host review must explicitly select a formal category. */
export const INTERVIEW_CATEGORY_MAPPING: Record<Category, readonly RequirementCategory[]> = {
  proposito: ['functional'], actor: ['functional', 'security'], campo: ['business_rule', 'ui'],
  accion: ['functional', 'business_rule'], error: ['business_rule', 'ux'], dato: ['functional', 'business_rule'],
  sensibilidad: ['security', 'ui'],
};
const templates: Record<Category, string> = {
  proposito: '¿Qué resultado de negocio debe ofrecer este módulo?',
  actor: '¿Quién debe poder usar este módulo y con qué restricciones?',
  campo: '¿Qué validaciones de datos exige el negocio? No se dispone de identidades de campos.',
  accion: '¿Qué comportamiento debe tener una acción de este módulo? No se dispone de acciones identificadas.',
  error: '¿Cómo debe responder el módulo ante datos inválidos?',
  dato: '¿Qué información debe conservar o transmitir este módulo?',
  sensibilidad: '¿Existen requisitos de tratamiento de información sensible? No se ha inferido sensibilidad.',
};
type ReviewState = 'proposal' | 'pending_review' | 'corrected' | 'deferred' | 'rejected' | 'confirmed';
export interface RequirementProposal {
  title: string; description: string; category?: RequirementCategory; acceptance_criteria?: string[];
}
export interface HumanReviewRequest {
  projectRoot: string; applicationId: string; environmentId: string; moduleId: string; moduleKey: string;
  questionId: string; context: string; statementVersion: number; statementDigest: string;
  requirementId: string; expectedRevision: number; proposal: RequirementProposal;
  question: { category: Category; text: string; evidenceRefs: KnowledgeRef[] };
  /** Binds every field above, including the exact text, category and acceptance criteria. */
  requestDigest: string;
}
export interface HumanReviewDecision {
  requestDigest: string;
  approvalId: string;
  decision: 'confirm' | 'reject' | 'defer';
  /** Host declares that it presented this exact statement and received this explicit decision. */
  presentedStatementDigest: string;
  reviewer: string;
  decidedAt: string;
  expiresAt: string;
}
/** Privileged host adapter. Must return null for unavailable/revoked decisions.
 * It must obtain a human response independently of MCP arguments. This is a host
 * attestation, not cryptographic authentication. No default approving adapter exists.
 */
export interface IHumanReviewGateway {
  review(request: Readonly<HumanReviewRequest>): Promise<HumanReviewDecision | null>;
}
interface Question {
  id: string; module: string; category: Category; context: string; issuedAt: string;
  evidence: KnowledgeRef[]; observational: boolean; state: ReviewState; version: number;
  proposal?: RequirementProposal; expectedRevision: number; requirementId: string;
}
export type InterviewCommand =
  | { action: 'next' }
  | { action: 'propose' | 'correct'; question_id: string; version: number; expected_revision: number; proposal: RequirementProposal }
  | { action: 'review' | 'defer' | 'resume'; question_id: string; version: number };
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const cleanText = (v: unknown, max: number): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= max &&
  ![...v].some(c => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127);
export function validateInterviewCommand(v: unknown): v is InterviewCommand {
  if (!object(v)) return false;
  if (v.action === 'next') return Object.keys(v).length === 1;
  if (!['propose', 'correct', 'review', 'defer', 'resume'].includes(String(v.action)) ||
    !cleanText(v.question_id, 80) || !Number.isSafeInteger(v.version) || Number(v.version) < 0) return false;
  if (['review', 'defer', 'resume'].includes(String(v.action))) return Object.keys(v).sort().join(',') === 'action,question_id,version';
  if (Object.keys(v).sort().join(',') !== 'action,expected_revision,proposal,question_id,version' ||
    !Number.isSafeInteger(v.expected_revision) || Number(v.expected_revision) < 0 || !object(v.proposal)) return false;
  const p = v.proposal;
  return Object.keys(p).every(k => ['title', 'description', 'category', 'acceptance_criteria'].includes(k)) &&
    cleanText(p.title, 200) && cleanText(p.description, 4000) && (p.category === undefined || categories.includes(p.category as RequirementCategory)) &&
    (p.acceptance_criteria === undefined || (Array.isArray(p.acceptance_criteria) && p.acceptance_criteria.length <= 20 && p.acceptance_criteria.every(s => cleanText(s, 1000))));
}

/** Non-authoritative pending state lives only in this host instance. Canonical records
 * live exclusively in IKnowledgeStore. A restart requires re-presenting pending text.
 */
export class CanonicalInterviewService {
  private readonly bridge: ModuleObservationBridge;
  private readonly context: BridgeContext;
  private readonly questions = new Map<string, Question>();
  private readonly usedApprovals = new Map<string, string>();
  private tail: Promise<unknown> = Promise.resolve();
  constructor(private readonly store: IKnowledgeStore, context: BridgeContext, private readonly gateway?: IHumanReviewGateway) {
    this.context = structuredClone(context);
    this.bridge = new ModuleObservationBridge(store, this.context);
  }

  private publicQuestion(q: Question) {
    return { id: q.id, module: q.module, category: q.category, text: templates[q.category],
      reason: q.observational ? 'associated_structural_observations' : 'business_specification_gap',
      source: q.observational ? 'observation_motivates_question_only' : 'business_question',
      evidence_refs: q.evidence, state: q.state, version: q.version, issued_at: q.issuedAt, context: q.context,
      options: [{ id: 'propose', label: 'Responder con texto libre' }, { id: 'correct', label: 'Corregir el enunciado' },
        { id: 'defer', label: 'Aplazar sin omitir la pregunta' }, { id: 'review', label: 'Solicitar revisión independiente del host' }], allows_free_text: true,
      registrar_con: { tool: 'qap_rules_set', campo: 'canonical_interview' },
      formal_category_suggestions: INTERVIEW_CATEGORY_MAPPING[q.category],
      statement_digest: q.proposal ? digest(q.proposal) : undefined,
      classification: q.proposal?.category ? 'explicit_proposal_requires_review' : 'pending_classification',
      detail: 'aggregate_only_no_field_action_or_url_identity', human_review_required: true };
  }

  async status(module: string) {
    const identity = await this.bridge.resolve(module);
    if (identity.status !== 'resolved') return { availability: 'blocked', code: identity.status, coverage: 'not_certified' };
    const projection = await this.bridge.project(module);
    const qs = [...this.questions.values()].filter(q => q.module === module && q.context === identity.fingerprint);
    const records = await this.store.query(this.context.applicationId, 'requirement', { references: { kind: 'module', id: identity.module.id }, limit: 100 });
    return { availability: 'general_questions_available', association_status: projection.association_status,
      association_completeness: projection.truncated || projection.executions?.some(e => e.association_status !== 'confirmed') ? 'incomplete' : 'execution_scope_only',
      pending_questions: qs.filter(q => !['confirmed', 'rejected'].includes(q.state)).length,
      reviewed_answers: qs.filter(q => ['confirmed', 'rejected'].includes(q.state)).length,
      pending_proposals: qs.filter(q => q.proposal && !['confirmed', 'rejected'].includes(q.state)).length,
      draft_requirements: records.items.filter(r => r.entity.validation_status === 'draft').length,
      confirmed_requirements: records.items.filter(r => r.entity.validation_status === 'confirmed').length,
      rejected_proposals: qs.filter(q => q.state === 'rejected').length,
      revisions: records.items.map(r => ({ id: r.id, revision: r.revision })),
      conflicts: 'reported_per_operation', truncated: !!records.next_cursor,
      gateway: this.gateway ? 'host_injected' : 'absent', pending_storage: 'host_memory_until_restart',
      human_review_required: true, coverage: 'not_certified' };
  }

  execute(module: string, input: unknown): Promise<Record<string, unknown>> {
    // Serialize this host's pending versions; SQLite CAS handles other hosts/connections.
    const run = this.tail.then(() => this.run(module, input)).catch(() => ({ status: 'blocked', code: 'interview_unavailable' }));
    this.tail = run;
    return run;
  }

  private async run(module: string, input: unknown): Promise<Record<string, unknown>> {
    const blocked = (code: string) => ({ status: 'blocked', code, human_review_required: true, coverage: 'not_certified' });
    if (!validateInterviewCommand(input)) return blocked('invalid_canonical_arguments');
    const command = structuredClone(input);
    const identity = await this.bridge.resolve(module);
    if (identity.status !== 'resolved') return blocked(identity.status);
    const projection = await this.bridge.project(module);
    const complete = projection.executions?.filter(e => e.association_status === 'confirmed') ?? [];
    const evidence: KnowledgeRef[] = [...new Map(complete.flatMap(e => e.evidence_refs).map(e => [e.id, { kind: 'evidence' as const, ...e }])).values()];
    const current = [...this.questions.values()].filter(q => q.context === identity.fingerprint && q.module === module);
    if (command.action === 'next') {
      // A stable category order, one active question, and no automatic skipping.
      const pertinent: Category[] = ['proposito', 'actor', 'dato', 'sensibilidad'];
      if (complete.some(e => e.controls > 0)) pertinent.push('campo');
      if (complete.some(e => e.forms > 0 || e.navigation_candidates > 0)) pertinent.push('accion');
      if (complete.some(e => e.forms > 0)) pertinent.push('error');
      for (const category of pertinent) {
        if (current.some(q => q.category === category)) continue;
        if (this.questions.size >= 1024) return blocked('pending_inventory_limit');
        const id = `interview:${digest([identity.fingerprint, category])}`;
        const observational = ['campo', 'accion', 'error'].includes(category);
        const q: Question = { id, module, category, context: identity.fingerprint, issuedAt: new Date().toISOString(),
          evidence: observational ? evidence : [], observational, state: 'proposal', version: 0,
          expectedRevision: 0, requirementId: `requirement:${digest(id)}` };
        const persisted = await this.store.get(this.context.applicationId, 'requirement', q.requirementId);
        if (persisted) {
          if (persisted.trace.source !== 'canonical_interview_v1' || persisted.entity.module_key !== identity.link.moduleKey) return blocked('requirement_identity_conflict');
          if (persisted.entity.validation_status === 'confirmed') q.state = 'confirmed';
          q.expectedRevision = persisted.revision;
        }
        this.questions.set(id, q); current.push(q);
      }
      const q = current.find(item => !['confirmed', 'rejected'].includes(item.state));
      return { status: q ? 'interviewing' : 'reviewed_questions_only', question: q && this.publicQuestion(q),
        association_status: projection.association_status, evidence_scope: 'partial', coverage: 'not_certified',
        association_completeness: projection.truncated || projection.executions?.some(e => e.association_status !== 'confirmed') ? 'incomplete' : 'execution_scope_only',
        next_safe_action: 'Responder o reanudar la pregunta; no cerrar el módulo.' };
    }
    const q = this.questions.get(command.question_id);
    if (!q || q.module !== module) return blocked('unknown_question');
    if (q.context !== identity.fingerprint) return blocked('context_changed');
    if (q.observational && q.evidence.some(pin => !evidence.some(e => e.id === pin.id && e.revision === pin.revision))) return blocked('association_context_changed');
    if (command.version !== q.version) return blocked('proposal_version_conflict');
    const active = current.find(item => !['confirmed', 'rejected'].includes(item.state));
    if (active && active.id !== q.id && !(q.state === 'confirmed' && ['review', 'correct'].includes(command.action))) return blocked('another_question_active');
    if (command.action === 'resume') {
      if (q.state !== 'deferred') return blocked('question_not_deferred');
      q.state = q.proposal ? 'pending_review' : 'proposal';
    } else if (command.action === 'defer') {
      if (['confirmed', 'rejected'].includes(q.state)) return blocked('review_already_final');
      q.state = 'deferred';
    } else if (command.action === 'propose' || command.action === 'correct') {
      if (command.action === 'propose' && ['confirmed', 'rejected'].includes(q.state)) return blocked('explicit_correction_required');
      const prior = await this.store.get(this.context.applicationId, 'requirement', q.requirementId);
      if (prior && command.action !== 'correct') return blocked('explicit_correction_required');
      if ((prior?.revision ?? 0) !== command.expected_revision) return blocked('requirement_revision_conflict');
      const p = command.proposal;
      // Fixed field order makes digests independent of MCP property ordering.
      const proposal: RequirementProposal = { title: p.title, description: p.description,
        ...(p.category ? { category: p.category } : {}), ...(p.acceptance_criteria ? { acceptance_criteria: [...p.acceptance_criteria] } : {}) };
      if (q.proposal && digest(q.proposal) === digest(proposal) && q.expectedRevision === command.expected_revision) {
        return { status: 'pending_review', question: this.publicQuestion(q) };
      }
      q.proposal = proposal; q.version++; q.expectedRevision = command.expected_revision;
      q.state = command.action === 'correct' ? 'corrected' : 'pending_review';
    } else if (command.action === 'review') {
      if (!q.proposal?.category) return blocked('classification_required');
      if (!isSubstantiveRuleText(q.proposal.title) || !isSubstantiveRuleText(q.proposal.description)) return blocked('substantive_statement_required');
      if (q.state === 'deferred' || q.state === 'rejected') return blocked('question_not_pending');
      const p = structuredClone(q.proposal);
      const body = { projectRoot: this.context.projectRoot, applicationId: this.context.applicationId,
        environmentId: this.context.environmentId, moduleId: identity.module.id, moduleKey: identity.link.moduleKey,
        questionId: q.id, context: q.context, statementVersion: q.version, statementDigest: digest(p),
        requirementId: q.requirementId, expectedRevision: q.expectedRevision, proposal: p,
        question: { category: q.category, text: templates[q.category], evidenceRefs: structuredClone(q.evidence) } };
      const request: HumanReviewRequest = { ...body, requestDigest: digest(body) };
      const prior = await this.store.get(this.context.applicationId, 'requirement', q.requirementId);
      if (prior?.trace.source === 'canonical_interview_v1' && prior.trace.reason === request.requestDigest &&
        prior.revision === q.expectedRevision + 1 && prior.entity.validation_status === 'confirmed') {
        q.state = 'confirmed'; return { status: 'confirmed', requirement_id: prior.id, revision: prior.revision, idempotent: true };
      }
      if ((prior?.revision ?? 0) !== q.expectedRevision) return blocked('requirement_revision_conflict');
      if (!this.gateway) return blocked('human_review_gateway_required');
      let decision: HumanReviewDecision | null;
      try { decision = await this.gateway.review(structuredClone(request)); } catch { return blocked('human_review_unavailable'); }
      if (!decision) return blocked('human_review_not_authorized');
      decision = structuredClone(decision);
      const now = Date.now(), at = Date.parse(decision.decidedAt), expiry = Date.parse(decision.expiresAt);
      if (decision.requestDigest !== request.requestDigest || decision.presentedStatementDigest !== request.statementDigest ||
        !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(decision.approvalId) ||
        !cleanText(decision.reviewer, 200) || !Number.isFinite(at) || !Number.isFinite(expiry) ||
        at > now || expiry <= now || expiry <= at || expiry - at > 15 * 60_000 ||
        !['confirm', 'reject', 'defer'].includes(decision.decision) ||
        (this.usedApprovals.has(decision.approvalId) && this.usedApprovals.get(decision.approvalId) !== request.requestDigest)) return blocked('human_review_invalid');
      // Revalidate after awaiting host UI; approval never applies to a new context.
      const after = await this.bridge.resolve(module);
      if (after.status !== 'resolved' || after.fingerprint !== q.context) return blocked('context_changed');
      if (q.observational) {
        const refreshed = await this.bridge.project(module);
        const validEvidence = refreshed.executions?.filter(e => e.association_status === 'confirmed').flatMap(e => e.evidence_refs) ?? [];
        if (q.evidence.some(pin => !validEvidence.some(e => e.id === pin.id && e.revision === pin.revision))) return blocked('association_context_changed');
      }
      this.usedApprovals.set(decision.approvalId, request.requestDigest);
      if (decision.decision !== 'confirm') {
        q.state = decision.decision === 'reject' ? 'rejected' : 'deferred';
        return { status: q.state, question: this.publicQuestion(q) };
      }
      // Durable single-use receipt in the same transaction, using an existing
      // related_to relation (never supports). No schema or port extension.
      const approvalRelationId = `human-review:${decision.approvalId}`;
      const existingApproval = await this.store.get(this.context.applicationId, 'relation', approvalRelationId);
      if (existingApproval) {
        const saved = await this.store.get(this.context.applicationId, 'requirement', q.requirementId);
        if (existingApproval.trace.source === 'human_review_authorization_v1' && existingApproval.trace.reason === request.requestDigest &&
          saved?.trace.reason === request.requestDigest && saved.revision === q.expectedRevision + 1) {
          q.state = 'confirmed'; return { status: 'confirmed', requirement_id: saved.id, revision: saved.revision, idempotent: true };
        }
        return blocked('human_review_reused');
      }
      const entity: ExpectedRequirement = { id: q.requirementId, application_id: this.context.applicationId,
        module_key: identity.link.moduleKey, title: p.title, description: p.description, category: p.category!,
        validation_status: 'confirmed', provenance: 'developer_interview', confidence: 0.8,
        verified_by: decision.reviewer, verification_evidence: { mechanism: 'human_review',
          evidence_ref: `urn:qap:human-review:${decision.approvalId}`, verified_at: decision.decidedAt,
          statement: request.requestDigest }, created_at: prior?.entity.created_at ?? decision.decidedAt,
        is_active: true, ...(p.acceptance_criteria ? { acceptance_criteria: p.acceptance_criteria } : {}) };
      if (!validateExpectedRequirement(entity).valid) return blocked('invalid_requirement');
      try {
        await this.store.commit(this.context.applicationId, [{ kind: 'requirement', entity, expected_revision: q.expectedRevision,
          trace: { source: 'canonical_interview_v1', recorded_by: 'mcp_host', recorded_at: new Date().toISOString(),
            reason: request.requestDigest, review: 'reviewed', environment_id: this.context.environmentId,
            // These references motivated the question; they do not authorize the statement.
            evidence_refs: q.evidence } }, { kind: 'relation', expected_revision: 0,
          entity: { id: approvalRelationId, predicate: 'related_to',
            source: { kind: 'module', id: identity.module.id, revision: identity.module.revision },
            target: { kind: 'requirement', id: q.requirementId, revision: q.expectedRevision + 1 } },
          trace: { source: 'human_review_authorization_v1', recorded_by: 'mcp_host', recorded_at: new Date().toISOString(),
            reason: request.requestDigest, review: 'reviewed', environment_id: this.context.environmentId, evidence_refs: [] } }]);
      } catch (error: unknown) {
        return blocked(error instanceof KnowledgeStoreError && error.code === 'CONFLICT' ? 'requirement_revision_conflict' : 'requirement_persistence_failed');
      }
      const final = await this.bridge.resolve(module);
      if (final.status !== 'resolved' || final.fingerprint !== q.context) return blocked('context_changed_after_commit');
      const committed = await this.store.get(this.context.applicationId, 'requirement', q.requirementId);
      if (!committed || committed.revision !== q.expectedRevision + 1 || committed.trace.reason !== request.requestDigest) return blocked('requirement_readback_conflict');
      q.state = 'confirmed';
      return { status: 'confirmed', requirement_id: q.requirementId, revision: q.expectedRevision + 1, coverage: 'not_certified' };
    }
    return { status: q.state, question: this.publicQuestion(q), coverage: 'not_certified' };
  }
}
