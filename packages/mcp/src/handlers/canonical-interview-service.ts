import { createHash } from 'node:crypto';

import { KnowledgeStoreError, type IKnowledgeStore, type KnowledgeRef } from '@qap/engine';
import { isSubstantiveRuleText, validateExpectedRequirement, type ExpectedRequirement, type RequirementCategory } from '@qap/shared';

import { ModuleObservationBridge, type BridgeContext, type ModuleBinding } from './module-observation-bridge.js';
import { InterviewDraftError, type IInterviewDraftStore, type InterviewDraftSnapshot } from './interview-draft-store.js';

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
export interface InterviewQuestion {
  id: string; module: string; category: Category; context: string; issuedAt: string;
  evidence: KnowledgeRef[]; observational: boolean; state: ReviewState; version: number;
  proposal?: RequirementProposal; expectedRevision: number; requirementId: string;
  modifiedAt?: string; proposalDigest?: string;
  text?: string; reason?: string; binding?: ModuleBinding;
  recoveredConfirmation?: boolean;
}
type Question = InterviewQuestion;
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

/** Drafts remain non-authoritative. Optional host-owned durable storage never grants approval. */
export class CanonicalInterviewService {
  private readonly bridge: ModuleObservationBridge;
  private readonly context: BridgeContext;
  private readonly questions = new Map<string, Question>();
  private readonly usedApprovals = new Map<string, string>();
  private tail: Promise<unknown> = Promise.resolve();
  constructor(private readonly store: IKnowledgeStore, context: BridgeContext, private readonly gateway?: IHumanReviewGateway,
    private readonly drafts?: IInterviewDraftStore) {
    this.context = structuredClone(context);
    this.bridge = new ModuleObservationBridge(store, this.context);
  }

  private publicQuestion(q: Question) {
    return { id: q.id, module: q.module, category: q.category, text: q.text ?? templates[q.category],
      reason: q.reason ?? (q.observational ? 'associated_structural_observations' : 'business_specification_gap'),
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

  status(module: string) {
    const run = this.tail.then(() => this.readStatus(module));
    this.tail = run.catch(() => undefined);
    return run;
  }

  private async readStatus(module: string) {
    if (this.drafts) {
      try { this.restore(this.drafts.read(this.context)); }
      catch (error) { return { availability: 'unavailable', pending_questions: 'unknown', pending_proposals: 'unknown',
        pending_storage: error instanceof InterviewDraftError ? error.code : 'unavailable', coverage: 'not_certified' }; }
    }
    const identity = await this.bridge.resolve(module);
    if (identity.status !== 'resolved') return { availability: 'blocked', code: identity.status, context: 'obsolete_or_unavailable',
      pending_storage: this.drafts ? 'compatible' : 'not_configured', pending_questions: 'unknown', coverage: 'not_certified' };
    const projection = await this.bridge.project(module);
    const all = [...this.questions.values()].filter(q => q.module === module);
    const evidence = projection.executions?.filter(e => e.association_status === 'confirmed').flatMap(e => e.evidence_refs) ?? [];
    const qs = all.filter(q => q.context === identity.fingerprint && (!q.observational || q.evidence.every(pin =>
      evidence.some(e => e.id === pin.id && e.revision === pin.revision))));
    await this.reconcile(qs, identity.link.moduleKey);
    const records = await this.store.query(this.context.applicationId, 'requirement', { references: { kind: 'module', id: identity.module.id }, limit: 100 });
    return { availability: 'general_questions_available', association_status: projection.association_status,
      association_completeness: projection.truncated || projection.executions?.some(e => e.association_status !== 'confirmed') ? 'incomplete' : 'execution_scope_only',
      pending_questions: qs.filter(q => !['confirmed', 'rejected'].includes(q.state)).length,
      reviewed_answers: qs.filter(q => ['confirmed', 'rejected'].includes(q.state)).length,
      pending_proposals: qs.filter(q => q.proposal && !['confirmed', 'rejected'].includes(q.state)).length,
      draft_requirements: records.items.filter(r => r.entity.validation_status === 'draft').length,
      confirmed_requirements: records.items.filter(r => r.entity.validation_status === 'confirmed').length,
      rejected_proposals: qs.filter(q => q.state === 'rejected').length,
      active_questions: qs.filter(q => !['confirmed', 'rejected', 'deferred'].includes(q.state)).length,
      deferred_questions: qs.filter(q => q.state === 'deferred').length,
      corrected_proposals: qs.filter(q => q.state === 'corrected').length,
      confirmed_with_pending_correction: qs.filter(q => !['confirmed', 'rejected'].includes(q.state) && q.expectedRevision > 0).length,
      stale_questions: all.length - qs.length, context: all.length === qs.length ? 'current' : 'stale_present',
      stale: all.filter(q => !qs.includes(q)).slice(0, 100).map(q => ({ id: q.id, version: q.version,
        code: q.context !== identity.fingerprint ? 'context_changed' : 'association_context_changed' })),
      recovery: this.drafts ? 'restored_from_store' : 'process_memory',
      reconciled_confirmations: qs.filter(q => q.recoveredConfirmation).length,
      revisions: records.items.map(r => ({ id: r.id, revision: r.revision })),
      canonical_requirements: records.items.length,
      conflicts: 'reported_per_operation', truncated: !!records.next_cursor || !!projection.truncated || all.length - qs.length > 100,
      gateway: this.gateway ? 'host_injected' : 'absent', pending_storage: this.drafts ? 'compatible' : 'not_configured_host_memory_until_restart',
      human_review_required: true, coverage: 'not_certified' };
  }

  execute(module: string, input: unknown): Promise<Record<string, unknown>> {
    // Serialize this host's pending versions; SQLite CAS handles other hosts/connections.
    const run = this.tail.then(() => this.drafts ? this.drafts.transaction(this.context, async snapshot => {
      this.restore(snapshot);
      const before = new Map(snapshot.questions.map(q => [q.id, JSON.stringify(q)]));
      const result = await this.run(module, input);
      for (const q of this.questions.values()) {
        if (JSON.stringify(q) !== before.get(q.id)) q.modifiedAt = new Date().toISOString();
      }
      snapshot.questions = [...this.questions.values()]; snapshot.approvals = [...this.usedApprovals];
      return result;
    }) : this.run(module, input)).catch((error: unknown) => ({ status: 'blocked',
      code: error instanceof InterviewDraftError ? `draft_${error.code}` : 'interview_unavailable' }));
    this.tail = run;
    return run;
  }

  private restore(snapshot: InterviewDraftSnapshot): void {
    this.questions.clear(); this.usedApprovals.clear();
    for (const q of snapshot.questions) this.questions.set(q.id, structuredClone(q));
    for (const [id, request] of snapshot.approvals) this.usedApprovals.set(id, request);
  }

  private request(q: Question, moduleId: string, moduleKey: string): HumanReviewRequest {
    const proposal = structuredClone(q.proposal!);
    const body = { projectRoot: this.context.projectRoot, applicationId: this.context.applicationId,
      environmentId: this.context.environmentId, moduleId, moduleKey,
      questionId: q.id, context: q.context, statementVersion: q.version, statementDigest: digest(proposal),
      requirementId: q.requirementId, expectedRevision: q.expectedRevision, proposal,
      question: { category: q.category, text: q.text ?? templates[q.category], evidenceRefs: structuredClone(q.evidence) } };
    return { ...body, requestDigest: digest(body) };
  }

  /** Canonical commit may precede draft commit. Authenticate BOTH original receipt and
   * request before recognizing physical confirmation; never replay a gateway decision. */
  private async reconcile(questions: Question[], moduleKey: string): Promise<void> {
    const link = this.context.moduleBindings?.find(b => b.moduleKey === moduleKey);
    if (!link) return;
    for (const q of questions) {
      if (!q.proposal || q.state === 'confirmed') continue;
      const request = this.request(q, link.moduleId, moduleKey);
      const prior = await this.store.get(this.context.applicationId, 'requirement', q.requirementId);
      const verification = prior?.entity.verification_evidence;
      if (!verification || Array.isArray(verification) || verification.mechanism !== 'human_review') continue;
      const approval = verification.evidence_ref?.replace('urn:qap:human-review:', 'human-review:');
      const receipt = approval ? await this.store.get(this.context.applicationId, 'relation', approval) : null;
      if (prior?.trace.source === 'canonical_interview_v1' && prior.trace.reason === request.requestDigest &&
        prior.revision === q.expectedRevision + 1 && prior.entity.validation_status === 'confirmed' &&
        prior.entity.module_key === moduleKey && receipt?.trace.source === 'human_review_authorization_v1' &&
        receipt.trace.reason === request.requestDigest && receipt.entity.target.id === prior.id &&
        receipt.entity.target.revision === prior.revision) { q.state = 'confirmed'; q.recoveredConfirmation = true; }
    }
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
    await this.reconcile(current, identity.link.moduleKey);
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
          text: templates[category], reason: observational ? 'associated_structural_observations' : 'business_specification_gap', binding: structuredClone(identity.link),
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
      if (q?.observational && q.evidence.some(pin => !evidence.some(e => e.id === pin.id && e.revision === pin.revision))) return blocked('association_context_changed');
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
    if (active && active.id !== q.id && !(['confirmed', 'rejected'].includes(q.state) && ['review', 'correct'].includes(command.action))) return blocked('another_question_active');
    if (command.action === 'resume') {
      if (this.drafts && ['proposal', 'pending_review', 'corrected'].includes(q.state)) {
        return { status: q.state, question: this.publicQuestion(q), coverage: 'not_certified' };
      }
      if (q.state !== 'deferred') return blocked('question_not_deferred');
      q.state = q.proposal ? 'pending_review' : 'proposal';
      if (this.drafts) q.version++;
    } else if (command.action === 'defer') {
      if (['confirmed', 'rejected'].includes(q.state)) return blocked('review_already_final');
      q.state = 'deferred';
      if (this.drafts) q.version++;
    } else if (command.action === 'propose' || command.action === 'correct') {
      if (command.action === 'propose' && ['confirmed', 'rejected'].includes(q.state)) return blocked('explicit_correction_required');
      const prior = await this.store.get(this.context.applicationId, 'requirement', q.requirementId);
      if (prior && command.action !== 'correct') return blocked('explicit_correction_required');
      if ((prior?.revision ?? 0) !== command.expected_revision) return blocked('requirement_revision_conflict');
      const p = command.proposal;
      // Fixed field order makes digests independent of MCP property ordering.
      const proposal: RequirementProposal = { title: p.title, description: p.description,
        ...(p.category ? { category: p.category } : {}), ...(p.acceptance_criteria ? { acceptance_criteria: [...p.acceptance_criteria] } : {}) };
      if (q.proposal && !['rejected', 'confirmed', 'deferred'].includes(q.state) && digest(q.proposal) === digest(proposal) && q.expectedRevision === command.expected_revision) {
        return { status: 'pending_review', question: this.publicQuestion(q) };
      }
      q.proposal = proposal; q.version++; q.expectedRevision = command.expected_revision;
      q.proposalDigest = digest(proposal);
      q.state = command.action === 'correct' ? 'corrected' : 'pending_review';
    } else if (command.action === 'review') {
      if (!q.proposal?.category) return blocked('classification_required');
      if (!isSubstantiveRuleText(q.proposal.title) || !isSubstantiveRuleText(q.proposal.description)) return blocked('substantive_statement_required');
      if (q.state === 'deferred' || q.state === 'rejected') return blocked('question_not_pending');
      const p = structuredClone(q.proposal);
      const request = this.request(q, identity.module.id, identity.link.moduleKey);
      const prior = await this.store.get(this.context.applicationId, 'requirement', q.requirementId);
      if (q.state === 'confirmed' && prior?.trace.source === 'canonical_interview_v1' && prior.trace.reason === request.requestDigest &&
        prior.revision === q.expectedRevision + 1 && prior.entity.validation_status === 'confirmed') {
        q.state = 'confirmed'; return { status: 'confirmed', requirement_id: prior.id, revision: prior.revision, idempotent: true,
          recovered_confirmation: !!q.recoveredConfirmation, physical_commit: 'confirmed', previous_response_delivery: 'unknown' };
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
        if (this.drafts) q.version++;
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
