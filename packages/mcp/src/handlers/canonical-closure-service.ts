import { createHash } from 'node:crypto';

import type { IKnowledgeStore } from '@qap/engine';
import { FileSystemStorage } from '@qap/knowledge';
import {
  validateCanonicalClosureCommand,
  type CanonicalClosureCommand,
  type CanonicalCoverageAssessment,
  type CategoryApplicabilityDecision,
  type CanonicalGap,
} from '@qap/shared';


import { ModuleObservationBridge, type BridgeContext } from './module-observation-bridge.js';
import { CanonicalCoverageService } from './canonical-coverage-service.js';
import type { IModuleClosureStore, ModuleClosureRecord } from './module-closure-store.js';
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
    if (!closure) return false;

    const receiptId = closure.status === 'waived' ? `waiver:${closure.decisionId}` : `closure:${closure.decisionId}`;
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
              target: { kind: 'application', id: this.context.applicationId, revision: 1 },
            },
            trace: {
              source: closure.status === 'waived' ? 'canonical_module_waiver_v1' : 'canonical_module_closure_v1',
              recorded_by: 'mcp_host',
              recorded_at: new Date().toISOString(),
              reason: closure.requestDigest,
              review: 'reviewed',
              evidence_refs: [],
            },
          },
        ]);
        reconciled = true;
      }
    } catch {
      // Ignorar si ya existía en caso de carrera
    }

    // 2. Verificar estado en FileSystemStorage lifecycle.json
    try {
      const fsStorage = new FileSystemStorage({ rootDir: this.context.projectRoot });
      const lifecycle = await fsStorage.getLifecycleState();
      if (lifecycle.modules && lifecycle.modules[plannedName]) {
        if (lifecycle.modules[plannedName].state !== closure.status) {
          lifecycle.modules[plannedName].state = closure.status;
          await fsStorage.saveLifecycleState(lifecycle);
          reconciled = true;
        }
      }
    } catch {
      // Error no fatal durante reconciliación
    }

    return reconciled;
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
      closure = snapshot.closures[plannedName];
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

      // Commit atómico rápido
      await this.closureStore.transaction(scope, snapshot => {
        if (snapshot.approvals.some(a => a[0] === decision.approvalId)) {
          throw new Error('closure_decision_reused');
        }
        const existingDecs = snapshot.applicabilityDecisions[plannedName] ?? [];
        snapshot.applicabilityDecisions[plannedName] = [...existingDecs, ...decisions];
        snapshot.approvals.push([decision.approvalId, reviewReq.requestDigest]);
        return Promise.resolve();
      });

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
      const evalRes = await this.coverageService.evaluate(plannedName, { acceptedGaps: typedCmd.accepted_gaps });
      if (evalRes.status !== 'evaluated') return evalRes;

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

      // Commit atómico rápido
      const acceptedGapsList: CanonicalGap[] = evalRes.assessment.gaps
        .filter(g => typedCmd.accepted_gaps.some(ag => ag.gap_id === g.id))
        .map(g => ({
          ...g,
          absence_type: 'accepted_gap',
          status: 'accepted',
          acceptance_receipt: decision.approvalId,
        }));

      await this.closureStore.transaction(scope, snapshot => {
        if (snapshot.approvals.some(a => a[0] === decision.approvalId)) {
          throw new Error('closure_decision_reused');
        }
        const existingGaps = snapshot.acceptedGaps[plannedName] ?? [];
        snapshot.acceptedGaps[plannedName] = [...existingGaps, ...acceptedGapsList];
        snapshot.approvals.push([decision.approvalId, reviewReq.requestDigest]);
        return Promise.resolve();
      });

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

    const parsedExp = Date.parse(decision.expiresAt);
    if (!Number.isFinite(parsedExp) || Date.now() > parsedExp) {
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
    if (!Number.isFinite(parsedExp) || Date.now() > parsedExp) {
      throw new Error('closure_review_expired');
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
        await this.closureStore.transaction(scope, async snapshot => {
          if (snapshot.closures[plannedName]) {
            return;
          }
          if (snapshot.approvals.some(a => a[0] === decision.approvalId)) {
            throw new Error('closure_decision_reused');
          }

          // Re-verificar que el estado canónico no derivó
          const reCheck = await this.bridge.resolve(plannedName);
          if (reCheck.status !== 'resolved') {
            throw new Error('closure_context_changed');
          }
          if (reCheck.link.moduleRevision !== link.moduleRevision) {
            throw new Error('closure_revision_conflict');
          }

          snapshot.closures[plannedName] = record;
          snapshot.approvals.push([decision.approvalId, request.requestDigest]);
        });
        break;
      } catch (err: unknown) {
        const isConflict = err instanceof Error && (err.message.includes('conflict') || err.message.includes('busy'));
        // Si el módulo ya fue cerrado concurrentemente de forma idéntica, retornar idempotente
        try {
          const snap = this.closureStore.read(scope);
          if (snap.closures[plannedName]) {
            const c = snap.closures[plannedName];
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
            source: status === 'waived' ? 'canonical_module_waiver_v1' : 'canonical_module_closure_v1',
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
    }


    // 3. Actualizar FileSystemStorage lifecycle.json
    try {
      const fsStorage = new FileSystemStorage({ rootDir: this.context.projectRoot });
      const lifecycle = await fsStorage.getLifecycleState();
      if (lifecycle.modules && lifecycle.modules[plannedName]) {
        lifecycle.modules[plannedName].state = status;
        await fsStorage.saveLifecycleState(lifecycle);
      }
    } catch {
      // Ignorar error de FS si se está ejecutando en fixture puramente en memoria
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
