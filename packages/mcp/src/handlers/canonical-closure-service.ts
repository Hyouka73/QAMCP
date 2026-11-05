import { createHash } from 'node:crypto';

import { transitionModule, type IKnowledgeStore } from '@qap/engine';
import { FileSystemStorage } from '@qap/knowledge';
import {
  validateCanonicalClosureCommand,
  type CanonicalClosureCommand,
  type CanonicalCoverageAssessment,
  type CategoryApplicabilityDecision,
  type CanonicalGap,
} from '@qap/shared';


import { ModuleObservationBridge, type BridgeContext } from './module-observation-bridge.js';
import { CanonicalCoverageService, type CoverageEvaluationOptions } from './canonical-coverage-service.js';
import { ClosureStoreError, withClosureCommitDeadline,
  type IModuleClosureStore, type ModuleClosureRecord, type ModuleClosureSnapshot } from './module-closure-store.js';
import type {
  IModuleClosureReviewGateway,
  ModuleClosureReviewRequest,
  ModuleClosureReviewDecision,
} from './module-closure-gateway.js';

const digest = (value: unknown): string =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');

export interface CanonicalClosureStatus {
  readonly state: 'working' | 'closed' | 'waived';
  readonly closure_verdict?: string;
  readonly coverage_status?: string;
  readonly confirmed_requirements_count?: number;
  readonly pending_requirements_count?: number;
  readonly unaddressed_gaps_count?: number;
  readonly accepted_gaps_count?: number;
  readonly ready_for_closure: boolean;
  readonly decision_id?: string;
}

/**
 * Servicio de Cierre Canónico de Módulos (R3 / R4).
 * Orquesta:
 * 1. Validación de comandos de cable (CanonicalClosureCommand).
 * 2. Pre-cómputo y evaluación de snapshot sin locks (lock-free).
 * 3. Consulta asíncrona al host review gateway (IModuleClosureReviewGateway) con cero locks SQLite.
 * 4. Commit atómico CAS en menos de 1 milisegundo a SqliteModuleClosureStore y recibo relation a IKnowledgeStore.
 * 5. Reconciliador de autorrecuperación para fallos de crash (Crash Scenario 2).
 */
export class CanonicalClosureService {
  private readonly bridge: ModuleObservationBridge;
  private readonly context: BridgeContext;
  private readonly coverageService: CanonicalCoverageService;

  constructor(
    private readonly store: IKnowledgeStore,
    context: BridgeContext,
    private readonly closureStore: IModuleClosureStore,
    private readonly gateway?: IModuleClosureReviewGateway
  ) {
    this.context = structuredClone(context);
    this.bridge = new ModuleObservationBridge(store, this.context);
    this.coverageService = new CanonicalCoverageService(store, this.context, closureStore);
  }

  /**
   * A terminal SQLite row is not authority by itself. Its host approval must
   * exist exactly once in the same encrypted durable snapshot and be bound to
   * the request digest. Validate before generating a receipt or projecting a
   * terminal lifecycle state, including on read/idempotent/recovery paths.
   */
  private isAuthorizedDurableClosure(
    plannedName: string,
    closure: ModuleClosureRecord,
    snapshot: ModuleClosureSnapshot
  ): boolean {
    if (
      closure.plannedName !== plannedName ||
      (closure.status !== 'closed' && closure.status !== 'waived') ||
      typeof closure.decisionId !== 'string' || closure.decisionId.trim().length === 0 ||
      typeof closure.requestDigest !== 'string' || closure.requestDigest.trim().length === 0
    ) return false;

    // Match the public canonical command invariant; whitespace-only padding
    // cannot turn a non-substantive waiver into an authorized exit.
    if (
      closure.status === 'waived' &&
      (typeof closure.waiverReason !== 'string' || closure.waiverReason.trim().length < 15)
    ) return false;

    const matches = snapshot.approvals.filter(pair => pair[0] === closure.decisionId);
    return matches.length === 1 && matches[0][1] === closure.requestDigest;
  }

  /**
   * Reconciliador de autorrecuperación (Enmienda 8 / Crash Scenario 2).
   * Detecta si SqliteModuleClosureStore registró una decisión confirmada pero el proceso se cayó
   * antes de persistir el recibo relation en IKnowledgeStore o actualizar lifecycle.json.
   * Repite de forma idempotente las escrituras faltantes sin solicitar una segunda aprobación humana.
   */
  async reconcile(plannedName: string): Promise<boolean> {
    const scope = {
      projectRoot: this.context.projectRoot,
      applicationId: this.context.applicationId,
      environmentId: this.context.environmentId,
    };

    let snapshot;
    try {
      snapshot = this.closureStore.read(scope);
    } catch {
      return false;
    }

    const closure = snapshot.closures[plannedName];
    if (!closure || !this.isAuthorizedDurableClosure(plannedName, closure, snapshot)) {
      // Fail closed before a receipt, lifecycle write, or a second host review.
      return false;
    }

    const receiptId = closure.status === 'waived' ? `waiver:${closure.decisionId}` : `closure:${closure.decisionId}`;
    const expectedTraceSource = closure.status === 'waived' ? 'canonical_module_waiver_v1' : 'canonical_module_closure_v1';
    const appRevision = this.context.moduleBindings?.find(b => b.plannedName === plannedName)?.applicationRevision ?? 1;
    let reconciled = false;

    // 1. Verificar recibo en IKnowledgeStore
    try {
      const existingReceipt = await this.store.get(this.context.applicationId, 'relation', receiptId);
      if (!existingReceipt) {
        await this.store.commit(this.context.applicationId, [
          {
            kind: 'relation',
            expected_revision: 0,
            entity: {
              id: receiptId,
              predicate: 'related_to',
              source: { kind: 'module', id: closure.moduleId, revision: closure.moduleRevision },
              target: { kind: 'application', id: this.context.applicationId, revision: appRevision },
            },
            trace: {
              source: expectedTraceSource,
              recorded_by: 'mcp_host',
              recorded_at: new Date().toISOString(),
              reason: closure.requestDigest,
              review: 'reviewed',
              evidence_refs: [],
            },
          },
        ]);
        reconciled = true;
      } else {
        const entity = existingReceipt.entity;
        const trace = existingReceipt.trace;
        if (
          entity.id !== receiptId ||
          entity.predicate !== 'related_to' ||
          entity.source.kind !== 'module' ||
          entity.source.id !== closure.moduleId ||
          entity.source.revision !== closure.moduleRevision ||
          entity.target.kind !== 'application' ||
          entity.target.id !== this.context.applicationId ||
          trace.source !== expectedTraceSource ||
          trace.reason !== closure.requestDigest ||
          trace.recorded_by !== 'mcp_host' ||
          trace.review !== 'reviewed'
        ) {
          throw new Error('closure_receipt_provenance_invalid');
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'closure_receipt_provenance_invalid') {
        throw err;
      }
      // Ignorar si ya existía en caso de carrera legítima
    }

    // 2. Reconstruct only lifecycle fields proven by the durable host decision.
    // A terminal module may already be waived but still lack its required reason
    // after an interrupted write. That partial state must also be repaired.
    try {
      if (await this.projectLifecycleClosure(plannedName, closure)) reconciled = true;
    } catch {
      // The durable decision remains authoritative; a later reconcile can retry
      // without asking for another human approval.
    }

    return reconciled;
  }

  /**
   * Materialize an already authorized durable closure into the legacy lifecycle.
   * Never synthesize a waiver reason, approval or transition from crawler evidence.
   * Replaying the same record is side-effect free once the projection is complete.
   */
  private async projectLifecycleClosure(plannedName: string, closure: ModuleClosureRecord): Promise<boolean> {
    const waivedReason = closure.status === 'waived' && typeof closure.waiverReason === 'string'
      && closure.waiverReason.trim().length > 0
      ? closure.waiverReason : undefined;
    if (closure.status === 'waived' && (!waivedReason || waivedReason.trim().length < 15)) return false;

    const fsStorage = new FileSystemStorage({ rootDir: this.context.projectRoot });
    const lifecycle = await fsStorage.getLifecycleState();
    const current = lifecycle.modules?.[plannedName];
    if (!current) return false;

    if (current.state === closure.status) {
      if (closure.status !== 'waived' || current.waived_reason === waivedReason) return false;
      // Recovery of metadata only: do not fabricate a second terminal
      // transition or retroactively invent a historical approval event.
      current.waived_reason = waivedReason;
      await fsStorage.saveLifecycleState(lifecycle);
      return true;
    }

    // No terminal-to-terminal rewrite, even if a caller supplied a valid
    // approval for another terminal state.
    if (current.state === 'waived' || current.state === 'closed') return false;

    if (closure.status === 'waived') {
      const transition = transitionModule(lifecycle, plannedName, 'waived', {
        waived_reason: waivedReason,
        reason: waivedReason,
      });
      if (!transition.success) return false;
      await fsStorage.saveLifecycleState(transition.state);
      return true;
    }

    // Closed is decided by canonical coverage + host review; legacy lifecycle
    // may still be in planned/observed rather than legacy consolidated.
    current.state = 'closed';
    await fsStorage.saveLifecycleState(lifecycle);
    return true;
  }

  /**
   * Consulta el estado proyectado de cobertura y cierre canónico para qap_status (R4 / F8).
   */
  async status(plannedName: string): Promise<CanonicalClosureStatus> {
    await this.reconcile(plannedName);

    const scope = {
      projectRoot: this.context.projectRoot,
      applicationId: this.context.applicationId,
      environmentId: this.context.environmentId,
    };

    let closure: ModuleClosureRecord | undefined;
    try {
      const snapshot = this.closureStore.read(scope);
      const candidate = snapshot.closures[plannedName];
      if (candidate && !this.isAuthorizedDurableClosure(plannedName, candidate, snapshot)) {
        return { state: 'working', ready_for_closure: false };
      }
      closure = candidate;
    } catch {
      // Almacén aún no inicializado
    }

    if (closure) {
      return {
        state: closure.status,
        ready_for_closure: true,
        decision_id: closure.decisionId,
      };
    }

    const evalRes = await this.coverageService.evaluate(plannedName);
    if (evalRes.status !== 'evaluated') {
      return {
        state: 'working',
        ready_for_closure: false,
      };
    }

    const a = evalRes.assessment;
    return {
      state: 'working',
      closure_verdict: a.closure_verdict,
      coverage_status: a.specification_coverage.status,
      confirmed_requirements_count: a.specification_coverage.confirmed_requirements_count,
      pending_requirements_count: a.specification_coverage.pending_requirements_count,
      unaddressed_gaps_count: a.specification_coverage.unaddressed_gaps_count,
      accepted_gaps_count: a.specification_coverage.accepted_gaps_count,
      ready_for_closure: a.closure_verdict === 'ready_for_closure',
    };
  }

  /**
   * Verifica si todos los módulos canónicos planificados están cerrados o renunciados.
   * Usado por qap_session_close para bloquear el paso a WRAP_UP si restan módulos sin cierre seguro.
   */
  async allModulesClosed(): Promise<{ readonly allClosed: boolean; readonly unclosed: readonly string[] }> {
    const unclosed: string[] = [];
    const bindings = this.context.moduleBindings ?? [];

    for (const b of bindings) {
      const s = await this.status(b.plannedName);
      if (s.state !== 'closed' && s.state !== 'waived') {
        unclosed.push(b.plannedName);
      }
    }

    return {
      allClosed: unclosed.length === 0,
      unclosed,
    };
  }

  /**
   * Ejecuta un comando de cierre canónico (CanonicalClosureCommand).
   */
  async execute(plannedName: string, command: unknown): Promise<Record<string, unknown>> {
    // 1. Validar comando de cable
    const cmdValidation = validateCanonicalClosureCommand(command);
    if (!cmdValidation.valid) {
      return {
        status: 'blocked',
        code: 'invalid_canonical_arguments',
        razon: `Argumentos de cierre canónico inválidos: ${cmdValidation.violations.map(v => v.message).join('; ')}`,
        violations: cmdValidation.violations,
      };
    }

    const typedCmd = command as CanonicalClosureCommand;

    // 2. Reconciliación de crash previa
    await this.reconcile(plannedName);

    const scope = {
      projectRoot: this.context.projectRoot,
      applicationId: this.context.applicationId,
      environmentId: this.context.environmentId,
    };

    // 3. Chequeo de idempotencia: Si ya está cerrado o renunciado
    let currentSnapshot;
    try {
      currentSnapshot = this.closureStore.read(scope);
    } catch {
      // Iniciar en primera transacción
    }

    const existingClosure = currentSnapshot?.closures[plannedName];
    if (existingClosure) {
      if (!currentSnapshot || !this.isAuthorizedDurableClosure(plannedName, existingClosure, currentSnapshot)) {
        return {
          status: 'blocked',
          code: 'invalid_durable_closure',
          razon: 'El cierre canónico persistido no tiene motivo sustantivo o aprobación correlacionada válida.',
        };
      }
      return {
        status: existingClosure.status,
        idempotent: true,
        decision_id: existingClosure.decisionId,
        request_digest: existingClosure.requestDigest,
        coverage_digest: existingClosure.coverageDigest,
      };
    }

    // 4. Acción: evaluate (solo lectura, sin gateway ni locks)
    if (typedCmd.action === 'evaluate') {
      const evalRes = await this.coverageService.evaluate(plannedName);
      if (evalRes.status !== 'evaluated') {
        return evalRes;
      }
      return {
        status: 'evaluated',
        assessment: evalRes.assessment,
      };
    }

    if (!this.gateway) {
      return {
        status: 'blocked',
        code: 'closure_review_gateway_required',
        razon: 'El host review gateway no está configurado. El cierre canónico requiere autorización del host.',
      };
    }

    // Validar resolución del módulo antes de interactuar con el gateway
    const resolution = await this.bridge.resolve(plannedName);

    if (resolution.status !== 'resolved') {
      return {
        status: 'blocked',
        code: resolution.status,
        razon: `El módulo '${plannedName}' no pudo resolverse canónicamente: ${resolution.status}`,
      };
    }

    const link = resolution.link;

    // 5. Acción: declare_non_applicable
    if (typedCmd.action === 'declare_non_applicable') {
      const decisions: CategoryApplicabilityDecision[] = typedCmd.decisions.map(d => ({
        category: d.category,
        applicable: false,
        reason: d.reason,
        decided_by: 'host_review_gateway',
        decision_id: `dec_${d.category}_${digest([plannedName, d.category, d.reason]).slice(0, 16)}`,
        decided_at: new Date().toISOString(),
      }));

      const evalRes = await this.coverageService.evaluate(plannedName, { applicabilityDecisions: decisions });
      if (evalRes.status !== 'evaluated') return evalRes;

      const reviewReq: ModuleClosureReviewRequest = {
        projectRoot: this.context.projectRoot,
        applicationId: this.context.applicationId,
        environmentId: this.context.environmentId,
        moduleId: link.moduleId,
        moduleKey: link.moduleKey,
        moduleRevision: link.moduleRevision,
        plannedName,
        action: 'declare_non_applicable',
        coverageDigest: evalRes.assessment.coverage_digest,
        confirmedRequirementsCount: evalRes.assessment.specification_coverage.confirmed_requirements_count,
        unaddressedGapsCount: evalRes.assessment.specification_coverage.unaddressed_gaps_count,
        acceptedGaps: [],
        nonApplicableCategories: typedCmd.decisions,
        requestDigest: digest([
          this.context.projectRoot,
          this.context.applicationId,
          this.context.environmentId,
          link.moduleId,
          link.moduleKey,
          link.moduleRevision,
          plannedName,
          'declare_non_applicable',
          evalRes.assessment.coverage_digest,
          typedCmd.decisions,
        ]),
      };

      const decision = await this.requestGatewayDecision(reviewReq);
      if ('status' in decision) return decision;

      // Persist only under a durable Knowledge fence; preserve host timestamp.
      const approvedDecisions = decisions.map(d => ({ ...d, decided_at: decision.decidedAt }));
      const persisted = await this.persistWithKnowledgeFence(plannedName, reviewReq, decision,
        { applicabilityDecisions: decisions }, (expectedSnapshot, contextFingerprint) =>
          this.closureStore.transaction(scope, async snapshot => {
            if (digest(snapshot) !== expectedSnapshot) throw new Error('closure_context_changed');
            const currentIdentity = await this.bridge.resolve(plannedName);
            if (currentIdentity.status !== 'resolved' ||
              currentIdentity.fingerprint !== contextFingerprint) throw new Error('closure_context_changed');
            if (snapshot.approvals.some(a => a[0] === decision.approvalId)) {
              throw new Error('closure_decision_reused');
            }
            if (Date.now() >= Date.parse(decision.expiresAt)) throw new Error('closure_review_expired');
            const existingDecs = snapshot.applicabilityDecisions[plannedName] ?? [];
            snapshot.applicabilityDecisions[plannedName] = [...existingDecs, ...approvedDecisions];
            snapshot.approvals.push([decision.approvalId, reviewReq.requestDigest]);
            return Promise.resolve(true);
          }));
      if (typeof persisted !== 'boolean') return persisted;

      const freshEval = await this.coverageService.evaluate(plannedName);
      return {
        status: 'declared_non_applicable',
        decisions: typedCmd.decisions,
        decision_id: decision.approvalId,
        assessment: freshEval.status === 'evaluated' ? freshEval.assessment : evalRes.assessment,
      };
    }

    // 6. Acción: accept_gaps
    if (typedCmd.action === 'accept_gaps') {
      // Propose only, without a synthetic approval receipt. Existing gaps and
      // their exact reasons become the request; authority is applied afterward.
      const evalRes = await this.coverageService.evaluate(plannedName);
      if (evalRes.status !== 'evaluated') return evalRes;
      const selected = new Set(typedCmd.accepted_gaps.map(g => g.gap_id));
      const gapInventory = new Map(evalRes.assessment.gaps.map(g => [g.id, g]));

      // A lost response must not consume another decision. Only a byte-for-byte
      // equivalent selection backed by the exact durable approval may replay.
      // No review gateway call is made on this read-only recovery path.
      const isExactAcceptedReplay = selected.size === typedCmd.accepted_gaps.length &&
        typedCmd.accepted_gaps.length > 0 &&
        typedCmd.accepted_gaps.every(g => {
          const prior = gapInventory.get(g.gap_id);
          return prior?.status === 'accepted' && prior.reason === g.reason;
        });
      if (isExactAcceptedReplay) {
        if (!this.store.withWriteFence) {
          return { status: 'blocked', code: 'closure_consistency_fence_required' };
        }
        try {
          const lifecycle = new FileSystemStorage({ rootDir: this.context.projectRoot });
          const recovered = await lifecycle.withLifecycleFence(() =>
            this.store.withWriteFence!(this.context.applicationId, async () => {
              const snapshot = this.closureStore.read(scope);
              const originalSnapshotDigest = digest(snapshot);
              const allStored = Object.values(snapshot.acceptedGaps).flat();
              const stored = snapshot.acceptedGaps[plannedName] ?? [];
              const pairs = typedCmd.accepted_gaps.map(g =>
                stored.filter(a => a.id === g.gap_id && a.status === 'accepted' &&
                  a.reason === g.reason && typeof a.acceptance_receipt === 'string'));
              if (!pairs.every(p => p.length === 1)) return undefined;
              const approvalId = pairs[0]?.[0]?.acceptance_receipt;
              if (!approvalId || !pairs.every(p => p[0].acceptance_receipt === approvalId) ||
                allStored.filter(g => g.acceptance_receipt === approvalId).length !== pairs.length ||
                Object.values(snapshot.closures).some(c => c.decisionId === approvalId)) return undefined;
              const approvals = snapshot.approvals.filter(a => a[0] === approvalId);
              if (approvals.length !== 1) return undefined;

              // Reconstruct the original review's base coverage. Any changed
              // requirement, context, applicability, or other gap changes the
              // hash and prevents replay of obsolete authority.
              const baseline = await this.coverageService.evaluate(plannedName, {
                excludeStoredAcceptedGapIds: [...selected],
              });
              if (baseline.status !== 'evaluated' ||
                !typedCmd.accepted_gaps.every(g => baseline.assessment.gaps.some(a =>
                  a.id === g.gap_id && a.status === 'unaddressed'))) return undefined;
              const requestDigest = digest([
                this.context.projectRoot, this.context.applicationId,
                this.context.environmentId, link.moduleId, link.moduleKey,
                link.moduleRevision, plannedName, 'accept_gaps',
                baseline.assessment.coverage_digest, typedCmd.accepted_gaps,
              ]);
              if (approvals[0][1] !== requestDigest) return undefined;
              const current = await this.coverageService.evaluate(plannedName);
              if (current.status !== 'evaluated' ||
                !typedCmd.accepted_gaps.every(g => current.assessment.gaps.some(a =>
                  a.id === g.gap_id && a.reason === g.reason &&
                  a.status === 'accepted' && a.acceptance_receipt === approvalId)) ||
                digest(this.closureStore.read(scope)) !== originalSnapshotDigest) return undefined;
              return {
                status: 'gaps_accepted', idempotent: true,
                accepted_gaps: typedCmd.accepted_gaps,
                decision_id: approvalId, assessment: current.assessment,
              };
            }));
          if (recovered) return recovered;
        } catch {
          return {
            status: 'blocked', code: 'closure_consistency_conflict',
            razon: 'No fue posible verificar la autoridad histórica de las brechas.',
          };
        }
      }
      if (selected.size === 0 || selected.size !== typedCmd.accepted_gaps.length ||
        typedCmd.accepted_gaps.some(g => !gapInventory.get(g.gap_id) ||
          gapInventory.get(g.gap_id)?.status !== 'unaddressed')) {
        return {
          status: 'blocked', code: 'closure_gap_selection_invalid',
          razon: 'Cada brecha debe existir, estar pendiente y aparecer una sola vez en la solicitud.',
        };
      }

      const reviewReq: ModuleClosureReviewRequest = {
        projectRoot: this.context.projectRoot,
        applicationId: this.context.applicationId,
        environmentId: this.context.environmentId,
        moduleId: link.moduleId,
        moduleKey: link.moduleKey,
        moduleRevision: link.moduleRevision,
        plannedName,
        action: 'accept_gaps',
        coverageDigest: evalRes.assessment.coverage_digest,
        confirmedRequirementsCount: evalRes.assessment.specification_coverage.confirmed_requirements_count,
        unaddressedGapsCount: evalRes.assessment.specification_coverage.unaddressed_gaps_count,
        acceptedGaps: typedCmd.accepted_gaps,
        nonApplicableCategories: [],
        requestDigest: digest([
          this.context.projectRoot,
          this.context.applicationId,
          this.context.environmentId,
          link.moduleId,
          link.moduleKey,
          link.moduleRevision,
          plannedName,
          'accept_gaps',
          evalRes.assessment.coverage_digest,
          typedCmd.accepted_gaps,
        ]),
      };

      const decision = await this.requestGatewayDecision(reviewReq);
      if ('status' in decision) return decision;

      const acceptedGapsList: CanonicalGap[] = typedCmd.accepted_gaps.map(ag => ({
        ...gapInventory.get(ag.gap_id)!,
        reason: ag.reason,
        absence_type: 'accepted_gap',
        status: 'accepted',
        acceptance_receipt: decision.approvalId,
      }));

      // Revalidate the BASELINE digest under both fences. Only now may the
      // real approvalId create an accepted_gap with mandatory receipt.
      const persisted = await this.persistWithKnowledgeFence(plannedName, reviewReq, decision,
        {}, async (expectedSnapshot, contextFingerprint) => {
          // Derive the authoritative accepted_gap shape BEFORE opening ClosureStore
          // transaction: CoverageService reads that store and cannot run while busy.
          const validAccepted = await this.coverageService.evaluate(plannedName, {
            acceptedGaps: typedCmd.accepted_gaps, decisionId: decision.approvalId,
          });
          if (validAccepted.status !== 'evaluated' ||
            !typedCmd.accepted_gaps.every(g => validAccepted.assessment.gaps.some(a =>
              a.id === g.gap_id && a.status === 'accepted' &&
              a.acceptance_receipt === decision.approvalId))) {
            throw new Error('closure_accepted_gaps_invalid');
          }
          return this.closureStore.transaction(scope, async snapshot => {
            if (digest(snapshot) !== expectedSnapshot) throw new Error('closure_context_changed');
            const currentIdentity = await this.bridge.resolve(plannedName);
            if (currentIdentity.status !== 'resolved' ||
              currentIdentity.fingerprint !== contextFingerprint) throw new Error('closure_context_changed');
            if (snapshot.approvals.some(a => a[0] === decision.approvalId)) {
              throw new Error('closure_decision_reused');
            }
            if (Date.now() >= Date.parse(decision.expiresAt)) throw new Error('closure_review_expired');
            const existingGaps = snapshot.acceptedGaps[plannedName] ?? [];
            snapshot.acceptedGaps[plannedName] = [...existingGaps, ...acceptedGapsList];
            snapshot.approvals.push([decision.approvalId, reviewReq.requestDigest]);
            return true;
          });
        });
      if (typeof persisted !== 'boolean') return persisted;

      const freshEval = await this.coverageService.evaluate(plannedName);
      return {
        status: 'gaps_accepted',
        accepted_gaps: typedCmd.accepted_gaps,
        decision_id: decision.approvalId,
        assessment: freshEval.status === 'evaluated' ? freshEval.assessment : evalRes.assessment,
      };
    }

    // 7. Acción: waive
    if (typedCmd.action === 'waive') {
      const evalRes = await this.coverageService.evaluate(plannedName, {
        isWaived: true,
        waiverReason: typedCmd.reason,
      });
      if (evalRes.status !== 'evaluated') return evalRes;

      const reviewReq: ModuleClosureReviewRequest = {
        projectRoot: this.context.projectRoot,
        applicationId: this.context.applicationId,
        environmentId: this.context.environmentId,
        moduleId: link.moduleId,
        moduleKey: link.moduleKey,
        moduleRevision: link.moduleRevision,
        plannedName,
        action: 'waive',
        coverageDigest: evalRes.assessment.coverage_digest,
        confirmedRequirementsCount: evalRes.assessment.specification_coverage.confirmed_requirements_count,
        unaddressedGapsCount: evalRes.assessment.specification_coverage.unaddressed_gaps_count,
        acceptedGaps: [],
        nonApplicableCategories: [],
        waiverReason: typedCmd.reason,
        requestDigest: digest([
          this.context.projectRoot,
          this.context.applicationId,
          this.context.environmentId,
          link.moduleId,
          link.moduleKey,
          link.moduleRevision,
          plannedName,
          'waive',
          evalRes.assessment.coverage_digest,
          typedCmd.reason,
        ]),
      };

      const decision = await this.requestGatewayDecision(reviewReq);
      if ('status' in decision) return decision;

      // Commit atómico CAS de renuncia
      return await this.commitFinalClosure(plannedName, link, reviewReq, decision, 'waived', typedCmd.reason, evalRes.assessment);
    }

    // 8. Acción: close
    if (typedCmd.action === 'close') {
      const evalRes = await this.coverageService.evaluate(plannedName);
      if (evalRes.status !== 'evaluated') return evalRes;

      if (evalRes.assessment.closure_verdict !== 'ready_for_closure') {
        return {
          status: 'blocked',
          code: 'closure_preconditions_not_met',
          verdict: evalRes.assessment.closure_verdict,
          blocker_reasons: evalRes.assessment.blocker_reasons,
          assessment: evalRes.assessment,
        };
      }

      const reviewReq: ModuleClosureReviewRequest = {
        projectRoot: this.context.projectRoot,
        applicationId: this.context.applicationId,
        environmentId: this.context.environmentId,
        moduleId: link.moduleId,
        moduleKey: link.moduleKey,
        moduleRevision: link.moduleRevision,
        plannedName,
        action: 'close',
        coverageDigest: evalRes.assessment.coverage_digest,
        confirmedRequirementsCount: evalRes.assessment.specification_coverage.confirmed_requirements_count,
        unaddressedGapsCount: evalRes.assessment.specification_coverage.unaddressed_gaps_count,
        acceptedGaps: [],
        nonApplicableCategories: [],
        requestDigest: digest([
          this.context.projectRoot,
          this.context.applicationId,
          this.context.environmentId,
          link.moduleId,
          link.moduleKey,
          link.moduleRevision,
          plannedName,
          'close',
          evalRes.assessment.coverage_digest,
        ]),
      };

      const decision = await this.requestGatewayDecision(reviewReq);
      if ('status' in decision) return decision;

      // Commit atómico CAS de cierre
      return await this.commitFinalClosure(plannedName, link, reviewReq, decision, 'closed', undefined, evalRes.assessment);
    }

    return {
      status: 'blocked',
      code: 'unsupported_action',
      razon: `Acción no soportada.`,
    };
  }

  /**
   * Consume host approval with a bounded Knowledge write fence held through
   * ClosureStore commit. Both current Knowledge and ClosureStore must match
   * the reviewed snapshot. Receipts remain a separate, recoverable step.
   */
  private async persistWithKnowledgeFence<T>(
    plannedName: string,
    request: ModuleClosureReviewRequest,
    decision: ModuleClosureReviewDecision,
    options: CoverageEvaluationOptions,
    write: (closureSnapshotDigest: string, contextFingerprint: string) => Promise<T>,
    requireReady = false
  ): Promise<T | { status: 'blocked'; code: string; razon: string }> {
    const blocked = (code: string, razon: string) => ({ status: 'blocked' as const, code, razon });
    if (!this.store.withWriteFence) {
      return blocked('closure_consistency_fence_required',
        'El almacén canónico no ofrece una frontera de consistencia hasta la persistencia.');
    }
    const scope = {
      projectRoot: this.context.projectRoot,
      applicationId: this.context.applicationId,
      environmentId: this.context.environmentId,
    };
    try {
      const lifecycle = new FileSystemStorage({ rootDir: this.context.projectRoot });
      return await lifecycle.withLifecycleFence(async () =>
        this.store.withWriteFence!(this.context.applicationId, async () => {
        const identity = await this.bridge.resolve(plannedName);
        if (identity.status !== 'resolved') {
          return blocked('closure_context_changed', 'La sesión o el módulo cambiaron antes del consentimiento.');
        }
        const before = digest(this.closureStore.read(scope));
        const current = await this.coverageService.evaluate(plannedName, options);
        const after = digest(this.closureStore.read(scope));
        if (before !== after || current.status !== 'evaluated' ||
          current.assessment.coverage_digest !== request.coverageDigest ||
          (requireReady && current.assessment.closure_verdict !== 'ready_for_closure')) {
          return blocked('closure_context_changed',
            'La cobertura, el contexto o las decisiones cambiaron antes del commit.');
        }
        const expiresAt = Date.parse(decision.expiresAt);
        if (!Number.isFinite(expiresAt) || Date.now() >= expiresAt) {
          return blocked('closure_review_expired', 'La autorización expiró antes de consumirse.');
        }
        return await withClosureCommitDeadline(expiresAt,
          () => write(after, identity.fingerprint));
      }));
    } catch (error) {
      if (error instanceof ClosureStoreError && error.code === 'authorization_expired') {
        return blocked('closure_review_expired',
          'La decisión expiró antes del commit durable en SQLite.');
      }
      return blocked('closure_consistency_conflict',
        'No fue posible garantizar el snapshot autorizado hasta el commit durable.');
    }
  }

  private async requestGatewayDecision(
    request: ModuleClosureReviewRequest
  ): Promise<ModuleClosureReviewDecision | { readonly status: 'blocked'; readonly code: string; readonly razon: string }> {
    if (!this.gateway) {
      return {
        status: 'blocked',
        code: 'closure_review_gateway_required',
        razon: 'El host review gateway no está configurado. El cierre canónico requiere autorización del host.',
      };
    }

    const decision = await this.gateway.reviewClosure(request);
    if (!decision) {
      return {
        status: 'blocked',
        code: 'closure_review_pending',
        razon: 'La revisión humana de cierre del host no ha emitido una autorización o está pendiente.',
      };
    }

    if (decision.requestDigest !== request.requestDigest) {
      return {
        status: 'blocked',
        code: 'closure_review_invalid',
        razon: 'La decisión del host no corresponde al digest exacto de la solicitud de cierre.',
      };
    }

    const decidedAt = Date.parse(decision.decidedAt);
    const parsedExp = Date.parse(decision.expiresAt);
    if (!Number.isFinite(decidedAt) || decidedAt > Date.now() ||
      !Number.isFinite(parsedExp) || parsedExp <= decidedAt ||
      Date.now() > parsedExp) {
      return {
        status: 'blocked',
        code: 'closure_review_expired',
        razon: 'La autorización de cierre del host ha expirado.',
      };
    }

    if (decision.decision !== 'approve') {
      return {
        status: 'blocked',
        code: 'closure_review_rejected',
        razon: `La solicitud de cierre fue rechazada por el revisor '${decision.reviewer}'.`,
      };
    }

    return decision;
  }

  private async commitFinalClosure(
    plannedName: string,
    link: { moduleId: string; moduleKey: string; moduleRevision: number; applicationRevision: number },
    request: ModuleClosureReviewRequest,
    decision: ModuleClosureReviewDecision,
    status: 'closed' | 'waived',
    waiverReason: string | undefined,
    assessment: CanonicalCoverageAssessment
  ): Promise<Record<string, unknown>> {
    const parsedExp = Date.parse(decision.expiresAt);
    if (!Number.isFinite(parsedExp) || Date.now() >= parsedExp) {
      return { status: 'blocked', code: 'closure_review_expired',
        razon: 'La autorización expiró antes de persistir el cierre.' };
    }

    const scope = {
      projectRoot: this.context.projectRoot,
      applicationId: this.context.applicationId,
      environmentId: this.context.environmentId,
    };

    const record: ModuleClosureRecord = {
      moduleKey: link.moduleKey,
      moduleId: link.moduleId,
      moduleRevision: link.moduleRevision,
      plannedName,
      status,
      decisionId: decision.approvalId,
      reviewer: decision.reviewer,
      decidedAt: decision.decidedAt,
      requestDigest: request.requestDigest,
      coverageDigest: assessment.coverage_digest,
      waiverReason,
      committedAt: new Date().toISOString(),
    };

    // 1. Transacción rápida CAS en SqliteModuleClosureStore con reintentos acotados ante contención
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const fenced = await this.persistWithKnowledgeFence(plannedName, request, decision,
          status === 'waived' ? { isWaived: true, waiverReason } : {},
          (expectedSnapshot, contextFingerprint) => this.closureStore.transaction(scope, async snapshot => {
          if (digest(snapshot) !== expectedSnapshot) throw new Error('closure_context_changed');
          if (Date.now() >= Date.parse(decision.expiresAt)) throw new Error('closure_review_expired');
          const existing = snapshot.closures[plannedName];
          if (existing) {
            if (!this.isAuthorizedDurableClosure(plannedName, existing, snapshot)) {
              throw new Error('invalid_durable_closure');
            }
            return { committed: false, record: existing };
          }
          if (snapshot.approvals.some(a => a[0] === decision.approvalId)) {
            throw new Error('closure_decision_reused');
          }

          // Re-verificar que el estado canónico no derivó
          const reCheck = await this.bridge.resolve(plannedName);
          if (reCheck.status !== 'resolved') {
            throw new Error('closure_context_changed');
          }
          if (reCheck.fingerprint !== contextFingerprint ||
            reCheck.link.moduleRevision !== link.moduleRevision) {
            throw new Error('closure_revision_conflict');
          }

          snapshot.closures[plannedName] = record;
          snapshot.approvals.push([decision.approvalId, request.requestDigest]);
          return { committed: true, record };
        }), status === 'closed');
        if ('status' in fenced) {
          // A competing caller may have committed an authorized terminal row
          // while we waited for the lifecycle/Knowledge fence. Re-read that
          // durable authority AFTER the fences are released, rather than
          // reporting a false context conflict or requesting a new approval.
          if (fenced.code === 'closure_context_changed' ||
            fenced.code === 'closure_consistency_conflict') {
            try {
              const latest = this.closureStore.read(scope);
              const winner = latest.closures[plannedName];
              if (winner) {
                if (!this.isAuthorizedDurableClosure(plannedName, winner, latest)) {
                  return {
                    status: 'blocked', code: 'invalid_durable_closure',
                    razon: 'El cierre concurrente no conserva autorización canónica válida.',
                  };
                }
                await this.reconcile(plannedName);
                return {
                  status: winner.status,
                  idempotent: true,
                  decision_id: winner.decisionId,
                  request_digest: winner.requestDigest,
                  coverage_digest: winner.coverageDigest,
                };
              }
            } catch {
              // Never turn an unavailable/tampered durable store into success.
            }
          }
          return fenced;
        }
        const txOutcome = fenced;

        if (!txOutcome.committed) {
          return {
            status: txOutcome.record.status,
            idempotent: true,
            decision_id: txOutcome.record.decisionId,
            request_digest: txOutcome.record.requestDigest,
            coverage_digest: txOutcome.record.coverageDigest,
          };
        }

        break;
      } catch (err: unknown) {
        const isConflict = err instanceof Error && (err.message.includes('conflict') || err.message.includes('busy'));
        // Si el módulo ya fue cerrado concurrentemente de forma idéntica, retornar idempotente
        try {
          const snap = this.closureStore.read(scope);
          if (snap.closures[plannedName]) {
            const c = snap.closures[plannedName];
            if (!this.isAuthorizedDurableClosure(plannedName, c, snap)) {
              throw new Error('invalid_durable_closure', { cause: err });
            }
            return {
              status: c.status,
              idempotent: true,
              decision_id: c.decisionId,
              request_digest: c.requestDigest,
              coverage_digest: c.coverageDigest,
            };
          }
        } catch { /* empty */ }

        if (isConflict && attempt < maxAttempts) {
          // Backoff entre 30ms y 60ms ante contención concurrente entre módulos distintos
          const backoff = 30 + Math.floor(Math.random() * 30);
          await new Promise(r => setTimeout(r, backoff));
          continue;
        }
        throw err;
      }
    }


    // 2. Persistir recibo relation en IKnowledgeStore (Enmienda 3: expected_revision: 0, ZERO module.revision mutation)
    const receiptId = status === 'waived' ? `waiver:${decision.approvalId}` : `closure:${decision.approvalId}`;
    const expectedTraceSource = status === 'waived' ? 'canonical_module_waiver_v1' : 'canonical_module_closure_v1';
    try {
      await this.store.commit(this.context.applicationId, [
        {
          kind: 'relation',
          expected_revision: 0,
          entity: {
            id: receiptId,
            predicate: 'related_to',
            source: { kind: 'module', id: link.moduleId, revision: link.moduleRevision },
            target: { kind: 'application', id: this.context.applicationId, revision: link.applicationRevision },
          },
          trace: {
            source: expectedTraceSource,
            recorded_by: 'mcp_host',
            recorded_at: new Date().toISOString(),
            reason: request.requestDigest,
            review: 'reviewed',
            evidence_refs: [],
          },
        },
      ]);
    } catch (err: unknown) {
      const existing = await this.store.get(this.context.applicationId, 'relation', receiptId);
      if (!existing) throw err;

      // Cryptographic provenance & content validation
      const entity = existing.entity;
      const trace = existing.trace;
      if (
        entity.id !== receiptId ||
        entity.predicate !== 'related_to' ||
        entity.source.kind !== 'module' ||
        entity.source.id !== link.moduleId ||
        entity.source.revision !== link.moduleRevision ||
        entity.target.kind !== 'application' ||
        entity.target.id !== this.context.applicationId ||
        entity.target.revision !== link.applicationRevision ||
        trace.source !== expectedTraceSource ||
        trace.reason !== request.requestDigest ||
        trace.recorded_by !== 'mcp_host' ||
        trace.review !== 'reviewed'
      ) {
        throw new Error('closure_receipt_provenance_invalid', { cause: err });
      }
    }


    // 3. Project the exact durable host decision (including waiver reason).
    // A failed FS write is recoverable via reconcile(), and does not turn a
    // recorded waiver into an invented success at the session-close gate.
    try {
      await this.projectLifecycleClosure(plannedName, record);
    } catch {
      // A later reconciliation will retry the projection.
    }

    return {
      status,
      decision_id: decision.approvalId,
      request_digest: request.requestDigest,
      coverage_digest: assessment.coverage_digest,
      assessment,
    };
  }
}
