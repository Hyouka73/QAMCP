import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { FileSystemStorage } from '@qap/knowledge';
import { normalizeSlug, SchemaValidator, type TCCase } from '@qap/shared';

import type {
  OracleDecisionInput,
  ProposeCaseInput,
} from '../application/block3-execution-repo.js';
import type { DiscoveryDossierScope } from '../application/discovery-dossier.js';
import {
  resolveScopedBusinessRules,
  type DiscoveryDossierRuleResolution,
  type DossierRuleAmbiguity,
} from '../application/scoped-rule-resolver.js';

import { binding, isObject, type StateDependencies } from './state-services.js';

const ALLOWED_ACTIONS = new Set([
  'propose_from_observations',
  'decide_oracles',
  'approve_batch',
  'accept_case_gap',
  'generate',
  'review',
]);
const ALLOWED_COMMAND_KEYS = new Set([
  'action',
  'proposals',
  'decisions',
  'case_ids',
  'acceptance',
]);

const blocked = (code: string, extra: Record<string, unknown> = {}) => ({
  status: 'blocked',
  code,
  ...extra,
});

function resolveAbsoluteRouteUrl(baseUrl: string, routeHint?: string | null): string {
  const safeBase = baseUrl || 'http://127.0.0.1';
  const cleanRoute = routeHint && routeHint.trim() ? routeHint.trim() : '/';
  try {
    return new URL(cleanRoute, safeBase).toString();
  } catch {
    return safeBase;
  }
}

function normalizeStepsForProposal(
  rawSteps: readonly Record<string, unknown>[] | undefined,
  routeUrl: string,
  expectedOutcome?: string | null,
  assertHint?: { readonly selector?: string | null; readonly assertion_type?: string | null },
): Record<string, unknown>[] {
  if (rawSteps && rawSteps.length > 0) {
    const out: Record<string, unknown>[] = [];
    for (const st of rawSteps) {
      if (st.type === 'navigate' && typeof st.url === 'string' && st.url.startsWith('/')) {
        out.push({ ...st, url: resolveAbsoluteRouteUrl(routeUrl, st.url) });
      } else {
        out.push({ ...st });
      }
    }
    return out;
  }
  const steps: Record<string, unknown>[] = [
    { type: 'navigate', url: routeUrl },
    { type: 'waitFor', selector: 'body' },
  ];
  if (expectedOutcome && expectedOutcome.trim().length > 0) {
    const allowedType =
      assertHint?.assertion_type === 'visible' ||
      assertHint?.assertion_type === 'exists' ||
      assertHint?.assertion_type === 'contains' ||
      assertHint?.assertion_type === 'equals'
        ? assertHint.assertion_type
        : 'contains';
    steps.push({
      type: 'assert',
      selector: assertHint?.selector?.trim() || 'body',
      assertion_type: allowedType,
      expected: expectedOutcome.trim(),
    });
  }
  return steps;
}

function buildProposalsFromResolution(params: {
  readonly resolution: DiscoveryDossierRuleResolution;
  readonly baseUrl: string;
  readonly fallbackRouteHint: string;
  readonly sourceKind: 'observed_dom' | 'spa_dom';
  readonly observedControls: readonly string[];
  readonly observedHeadings: readonly string[];
  readonly evidenceRefs: readonly string[];
}): ProposeCaseInput[] {
  const out: ProposeCaseInput[] = [];
  for (const dec of params.resolution.decisions) {
    const decRoute = dec.route_pathname === '*' ? params.fallbackRouteHint : dec.route_pathname;
    const decUrl = resolveAbsoluteRouteUrl(params.baseUrl, decRoute);
    if (dec.decision_status === 'accredited' && dec.expected_outcome) {
      out.push({
        title: `Verificar ${dec.title}`,
        ...(dec.source_kind === 'confirmed_requirement' && dec.source_id ? { requirement_id: dec.source_id } : {}),
        expected_outcome: dec.expected_outcome,
        oracle_source: dec.source_kind === 'confirmed_requirement' ? 'user' : 'ingested_doc',
        expectation_metadata: {
          rule_id: dec.decision_id,
          decision_status: dec.decision_status,
          ...(dec.source_ref ? { source_ref: dec.source_ref } : {}),
          ...(dec.source_version ? { source_version: dec.source_version } : {}),
          ...(dec.scope_match ? { scope_match: dec.scope_match } : {}),
        },
        observation: {
          source_kind: params.sourceKind,
          route: decRoute,
          observed_controls: params.observedControls.slice(0, 10),
          observed_headings: params.observedHeadings.slice(0, 10),
          evidence_refs: params.evidenceRefs.slice(0, 5),
        },
        inference: {
          rationale: dec.decision_reason,
          proposed_flow: `Navegar a ${decRoute} y validar '${dec.expected_outcome}' (${dec.source_ref ?? dec.source_kind ?? 'regla'} v${dec.source_version ?? '1'}).`,
          proposed_by: 'qap',
        },
        steps: normalizeStepsForProposal(undefined, decUrl, dec.expected_outcome, {
          selector: dec.assert_selector,
          assertion_type: dec.assert_type,
        }),
      });
      continue;
    }

    const matchingAmbiguity = params.resolution.ambiguities.find(
      (a) => a.rule_key === dec.rule_key && a.route_pathname === dec.route_pathname,
    );
    const firstCand = dec.candidates[0];
    out.push({
      title: `Aclarar ${dec.title} (${dec.decision_status})`,
      expected_outcome: null,
      oracle_source: 'missing',
      business_risk_question: matchingAmbiguity?.question ?? dec.decision_reason,
      expectation_metadata: {
        rule_id: dec.decision_id,
        decision_status: dec.decision_status,
        ...(firstCand?.source_ref ? { source_ref: firstCand.source_ref } : {}),
        ...(firstCand?.source_version ? { source_version: firstCand.source_version } : {}),
      },
      observation: {
        source_kind: params.sourceKind,
        route: decRoute,
        observed_controls: params.observedControls.slice(0, 10),
        observed_headings: params.observedHeadings.slice(0, 10),
        evidence_refs: params.evidenceRefs.slice(0, 5),
      },
      inference: {
        rationale: dec.decision_reason,
        proposed_flow: `Pendiente de resolución en ${decRoute} antes de emitir oráculo ejecutable.`,
        proposed_by: 'qap',
      },
      // Strictly NO assert step for contradictions, unaccredited expectations, or legacy unscoped entries
      steps: normalizeStepsForProposal(undefined, decUrl, null),
    });
  }
  return out;
}

async function synthesizeProposalsFromProjectState(
  root: string,
  moduleKey: string,
  baseUrl: string,
  routeHint: string | null,
  deps: StateDependencies,
  options?: { discoveryRevisionId?: string; effectiveScope?: DiscoveryDossierScope & { readonly base_url?: string } },
): Promise<{
  proposals: ProposeCaseInput[];
  discoveryRevisionId?: string;
  ruleResolutionSummary?: DiscoveryDossierRuleResolution['summary'];
  ruleAmbiguities?: readonly DossierRuleAmbiguity[];
}> {
  const appService = deps.applicationService!;
  const project = appService.findActiveProjectByRoot(root)!;
  const bound = binding(root, deps);
  const effectiveScope = options?.effectiveScope;
  const revision = options?.discoveryRevisionId
    ? appService.getDiscoveryRevision(options.discoveryRevisionId)
    : effectiveScope
      ? appService.findLatestDiscoveryRevisionForScope(effectiveScope)
      : null;
  const effectiveRouteHint = revision?.dossier.target_pathname ?? routeHint ?? '/';
  const targetUrl = resolveAbsoluteRouteUrl(baseUrl, effectiveRouteHint);

  const inventories = appService.listPartialInventories(project.project_id);
  const latestInv = inventories.find(inventory => inventory.target_url === targetUrl &&
    inventory.views_count > 0 && inventory.candidate_keys.includes(moduleKey));

  const observedControls: string[] = [];
  const observedHeadings: string[] = [];
  const evidenceRefs: string[] = [];

  if (revision) {
    for (const v of revision.dossier.views) {
      if (v.evidence_id) evidenceRefs.push(v.evidence_id);
      for (const h of v.headings) {
        if (typeof h === 'string' && h.trim()) observedHeadings.push(h.trim());
      }
      for (const c of v.controls) {
        if (typeof c.label === 'string' && c.label.trim()) observedControls.push(c.label.trim());
      }
    }
  } else if (bound && latestInv && appService.listDiscoveryRevisions(project.project_id, moduleKey).length === 0) {
    try {
      const candidate = appService.listModuleCandidates(project.project_id).find(c => c.key === moduleKey);
      const observations = await Promise.all((candidate?.evidence_refs ?? [])
        .map(id => bound.store.get(bound.applicationId, 'evidence', id)));
      for (const record of observations) {
        if (!record || record.entity.session_id !== latestInv.execution_id) continue;
        evidenceRefs.push(record.id);
        const view = (record.entity.metadata as { view?: { controls?: Array<{ text?: string }>; headings?: string[] } } | undefined)?.view;
        if (view?.headings) {
          for (const h of view.headings) {
            if (typeof h === 'string' && h.trim()) observedHeadings.push(h.trim());
          }
        }
        if (view?.controls) {
          for (const c of view.controls) {
            if (typeof c.text === 'string' && c.text.trim()) observedControls.push(c.text.trim());
          }
        }
      }
    } catch {
      // Observations optional if candidate came from doc ingest
    }
  }

  const sourceKind = revision
    ? (revision.dossier.mode.includes('spa') ? 'spa_dom' : 'observed_dom')
    : (latestInv?.mode?.includes('spa') ? 'spa_dom' : 'observed_dom');

  let activeResolution: DiscoveryDossierRuleResolution | undefined;
  if (revision) {
    // Frozen snapshot semantics: plan consumes ONLY the selected revision's persisted
    // rule resolutions, never mixing newer or unscoped live service_requirements.
    activeResolution = revision.dossier.rule_resolution;
  } else if (effectiveScope) {
    const confirmedReqs = appService
      .listServiceRequirements(project.project_id, moduleKey)
      .filter((r) => r.validation_status === 'confirmed');
    activeResolution = resolveScopedBusinessRules({
      scope: {
        environment_name: effectiveScope.environment_name,
        tenant_id: effectiveScope.tenant_id ?? 'default',
        role: effectiveScope.role,
        module_key: moduleKey,
      },
      targetPathname: effectiveRouteHint,
      discoveredRoutes: [{ pathname: effectiveRouteHint }],
      views: [],
      scopedRules: appService.listScopedBusinessRules(project.project_id),
      ingestedDocs: appService.listIngestedDocuments(project.project_id),
      legacyRequirements: confirmedReqs,
    });
  }

  const proposals: ProposeCaseInput[] = activeResolution
    ? buildProposalsFromResolution({
        resolution: activeResolution,
        baseUrl,
        fallbackRouteHint: effectiveRouteHint,
        sourceKind,
        observedControls,
        observedHeadings,
        evidenceRefs,
      })
    : [];

  if (proposals.length === 0) {
    const primaryLabel = observedControls[0] ?? observedHeadings[0] ?? moduleKey;
    proposals.push({
      title: `Comportamiento de ${primaryLabel}`,
      expected_outcome: null,
      oracle_source: 'missing',
      observation: {
        source_kind: sourceKind,
        route: effectiveRouteHint,
        observed_controls: observedControls.slice(0, 10),
        observed_headings: observedHeadings.slice(0, 10),
        evidence_refs: evidenceRefs.slice(0, 5),
      },
      inference: {
        rationale: 'Falta un criterio de negocio acreditado para este alcance; las observaciones DOM son solo descriptivas.',
        proposed_flow: `Verificar el comportamiento esperado en ${effectiveRouteHint}.`,
        proposed_by: 'qap',
      },
      steps: normalizeStepsForProposal(undefined, targetUrl, null),
    });
  }

  return {
    proposals,
    ...(revision ? { discoveryRevisionId: revision.revision_id } : {}),
    ...(activeResolution ? {
      ruleResolutionSummary: activeResolution.summary,
      ruleAmbiguities: activeResolution.ambiguities,
    } : {}),
  };
}

export async function runConversationalCaseWorkflow(
  root: string,
  moduleName: string,
  command: Record<string, unknown>,
  deps: StateDependencies,
  options?: { discoveryRevisionId?: string; effectiveScope?: DiscoveryDossierScope & { readonly base_url?: string } },
): Promise<Record<string, unknown>> {
  const action = typeof command.action === 'string' ? command.action : '';
  if (!ALLOWED_ACTIONS.has(action) || Object.keys(command).some((k) => !ALLOWED_COMMAND_KEYS.has(k))) {
    return blocked('invalid_case_command');
  }

  const appService = deps.applicationService;
  if (!appService) {
    return blocked('application_service_unavailable');
  }
  const project = appService.findActiveProjectByRoot(root);
  if (!project) {
    return blocked('project_not_found');
  }
  const snapshot = appService.resumeProject(project.project_id);
  const existingMod =
    snapshot.modules.find((m) => m.title.toLowerCase() === moduleName.toLowerCase()) ??
    snapshot.modules.find((m) => m.key === normalizeSlug(moduleName));

  if (action === 'review') {
    const caseIds = Array.isArray(command.case_ids)
      ? command.case_ids.map((id) => String(id).trim()).filter(Boolean)
      : undefined;
    const modKey = existingMod?.key ?? normalizeSlug(moduleName);
    const allCases = appService.listServiceCases(project.project_id, modKey);
    const filteredCases = caseIds?.length
      ? allCases.filter((c) => caseIds.includes(c.case_id))
      : allCases;

    const readyForApproval = filteredCases.filter(
      (c) =>
        c.conformity_status === 'proposed' &&
        c.oracle_status !== 'missing_oracle' &&
        c.risk_decision !== 'pending' &&
        c.steps.length > 0,
    );
    const approvedCases = filteredCases.filter((c) =>
      ['approved', 'pass', 'fail', 'not_run', 'technical_error', 'human_accepted'].includes(c.conformity_status),
    );
    const pendingOracle = filteredCases.filter(
      (c) =>
        c.conformity_status === 'pending_oracle' ||
        c.oracle_status === 'missing_oracle' ||
        c.risk_decision === 'pending',
    );
    const rejectedCases = filteredCases.filter((c) => c.conformity_status === 'rejected');

    return {
      status: 'review',
      read_only: true,
      module: moduleName,
      cases: filteredCases.map((c) => ({
        case_id: c.case_id,
        title: c.title,
        version: c.version,
        requirement_id: c.requirement_id,
        requirement_revision: c.requirement_revision,
        conformity_status: c.conformity_status,
        oracle_status: c.oracle_status,
        expectation: c.expectation,
        observation: c.observation,
        inference: c.inference,
        steps: c.steps,
        confirmed_by: c.confirmed_by,
        confirmed_at: c.confirmed_at,
        confirmation_digest: c.confirmation_digest,
      })),
      ready_for_approval: readyForApproval.map((c) => ({
        case_id: c.case_id,
        title: c.title,
        version: c.version,
        requirement_id: c.requirement_id,
        requirement_revision: c.requirement_revision,
        oracle_source: c.expectation.source,
      })),
      approved_cases: approvedCases.map((c) => ({
        case_id: c.case_id,
        title: c.title,
        version: c.version,
        conformity_status: c.conformity_status,
        confirmed_by: c.confirmed_by,
        confirmed_at: c.confirmed_at,
      })),
      pending_oracle: pendingOracle.map((c) => ({
        case_id: c.case_id,
        title: c.title,
        oracle_status: c.oracle_status,
        question: c.expectation.business_risk_question ?? null,
      })),
      summary: {
        total_cases: filteredCases.length,
        ready_for_approval: readyForApproval.length,
        approved: approvedCases.length,
        pending_oracle: pendingOracle.length,
        rejected: rejectedCases.length,
      },
      siguiente_accion: {
        tipo: readyForApproval.length > 0 ? 'decision' : pendingOracle.length > 0 ? 'entrevista' : 'trabajo',
        tool: readyForApproval.length > 0 || approvedCases.length > 0 ? 'qap_plan' : 'qap_rules_set',
        descripcion:
          readyForApproval.length > 0
            ? `Revisión de solo lectura: ${readyForApproval.length} caso(s) listo(s) para aprobar con action=approve_batch y ${pendingOracle.length} pendiente(s) de oráculo.`
            : pendingOracle.length > 0
              ? `Revisión de solo lectura: ${pendingOracle.length} caso(s) pendiente(s) de oráculo acreditado o confirmación humana.`
              : approvedCases.length > 0
                ? `Revisión de solo lectura: ${approvedCases.length} caso(s) aprobado(s) listo(s) para plan DAG.`
                : 'No hay casos propuestos para este módulo. Usa action=propose_from_observations.',
      },
    };
  }

  const serviceMod =
    existingMod ??
    appService.upsertModule({ projectId: project.project_id, key: moduleName, title: moduleName });

  const baseUrl = options?.effectiveScope?.base_url ?? snapshot.environment?.base_url ?? 'http://127.0.0.1';
  const routeUrl = resolveAbsoluteRouteUrl(baseUrl, serviceMod.route_hint ?? '/');
  const storage = new FileSystemStorage({ rootDir: root });
  const modDir = join(root, '.qa', 'modules', moduleName);
  mkdirSync(modDir, { recursive: true });

  if (action === 'propose_from_observations' || action === 'generate') {
    let inputs: ProposeCaseInput[];
    let usedDiscoveryRevisionId: string | undefined;
    let ruleResolutionSummary: DiscoveryDossierRuleResolution['summary'] | undefined;
    let ruleAmbiguities: readonly DossierRuleAmbiguity[] | undefined;
    if (Array.isArray(command.proposals)) {
      const confirmedReqs = appService
        .listServiceRequirements(project.project_id, serviceMod.key)
        .filter((r) => r.validation_status === 'confirmed' && r.acceptance_criteria.length > 0);
      const revision = options?.discoveryRevisionId
        ? appService.getDiscoveryRevision(options.discoveryRevisionId)
        : options?.effectiveScope
          ? appService.findLatestDiscoveryRevisionForScope(options.effectiveScope)
          : null;
      const activeResolution = revision?.dossier.rule_resolution;

      inputs = [];
      for (const rawItem of command.proposals) {
        if (!isObject(rawItem) || typeof rawItem.title !== 'string' || !rawItem.title.trim()) {
          return blocked('invalid_case_proposal');
        }
        const rawSteps = Array.isArray(rawItem.steps)
          ? rawItem.steps.filter((s): s is Record<string, unknown> => isObject(s))
          : undefined;
        const proposedExpected =
          typeof rawItem.expected_outcome === 'string' && rawItem.expected_outcome.trim()
            ? rawItem.expected_outcome.trim()
            : null;
        const rawReqId = typeof rawItem.requirement_id === 'string' ? rawItem.requirement_id.trim() : undefined;
        const rawRuleId =
          typeof rawItem.rule_id === 'string'
            ? rawItem.rule_id.trim()
            : isObject(rawItem.expectation_metadata) && typeof rawItem.expectation_metadata.rule_id === 'string'
              ? rawItem.expectation_metadata.rule_id.trim()
              : undefined;

        const matchingDecision = activeResolution?.decisions.find(
          (d) =>
            (rawRuleId && (d.decision_id === rawRuleId || d.rule_key === rawRuleId)) ||
            (rawReqId && d.source_id === rawReqId),
        );
        const isContradictedOrPendingInResolution = Boolean(
          matchingDecision && matchingDecision.decision_status !== 'accredited',
        ) || Boolean(
          rawReqId &&
            activeResolution?.ambiguities.some((a) =>
              a.candidates.some((c) => c.source_id === rawReqId),
            ),
        );

        const verifiedReq =
          rawReqId && !isContradictedOrPendingInResolution
            ? confirmedReqs.find((r) => r.requirement_id === rawReqId)
            : undefined;
        const verifiedDecision =
          matchingDecision && matchingDecision.decision_status === 'accredited' && matchingDecision.expected_outcome
            ? matchingDecision
            : undefined;

        const isAccredited = Boolean(verifiedReq || verifiedDecision);
        const accreditedExpected = verifiedDecision?.expected_outcome ?? verifiedReq?.acceptance_criteria[0] ?? null;
        const accreditedSource: 'user' | 'ingested_doc' | 'missing' = !isAccredited
          ? 'missing'
          : verifiedDecision
            ? verifiedDecision.source_kind === 'confirmed_requirement'
              ? 'user'
              : 'ingested_doc'
            : verifiedReq!.source === 'ingested_doc'
              ? 'ingested_doc'
              : 'user';

        const safeSteps = isAccredited
          ? normalizeStepsForProposal(rawSteps, routeUrl, accreditedExpected)
          : normalizeStepsForProposal(
              rawSteps?.filter((s) => s.type !== 'assert'),
              routeUrl,
              null,
            );

        const pendingReason = isContradictedOrPendingInResolution
          ? `La regla '${rawItem.title.trim()}' tiene contradicción o estado '${matchingDecision?.decision_status ?? 'pending'}' y requiere confirmación humana antes de emitir oráculo.`
          : proposedExpected
            ? `La expectativa propuesta ('${proposedExpected}') no cuenta con una fuente acreditada ni confirmación humana verificable.`
            : `¿Cuál es el resultado de negocio esperado para "${rawItem.title.trim()}"?`;

        inputs.push({
          case_id: typeof rawItem.case_id === 'string' ? rawItem.case_id : undefined,
          title: rawItem.title.trim(),
          ...(verifiedReq ? { requirement_id: verifiedReq.requirement_id } : {}),
          expected_outcome: isAccredited ? accreditedExpected : null,
          oracle_source: accreditedSource,
          ...(!isAccredited ? { business_risk_question: pendingReason } : {}),
          ...(verifiedDecision
            ? {
                expectation_metadata: {
                  rule_id: verifiedDecision.decision_id,
                  decision_status: verifiedDecision.decision_status,
                  ...(verifiedDecision.source_ref ? { source_ref: verifiedDecision.source_ref } : {}),
                  ...(verifiedDecision.source_version ? { source_version: verifiedDecision.source_version } : {}),
                  ...(verifiedDecision.scope_match ? { scope_match: verifiedDecision.scope_match } : {}),
                },
              }
            : {}),
          risk_level:
            rawItem.risk_level === 'high' || rawItem.risk_level === 'critical' || rawItem.risk_level === 'low'
              ? rawItem.risk_level
              : 'medium',
          risk_accepted: rawItem.risk_accepted === true,
          observation: isObject(rawItem.observation)
            ? rawItem.observation
            : { route: serviceMod.route_hint ?? '/' },
          inference: isObject(rawItem.inference)
            ? rawItem.inference
            : !isAccredited && proposedExpected
              ? {
                  rationale: pendingReason,
                  proposed_flow: `Pendiente de confirmación humana o fuente acreditada en ${serviceMod.route_hint ?? '/'}.`,
                  proposed_by: 'qap',
                }
              : undefined,
          steps: safeSteps,
        });
      }
    } else {
      const synthesized = await synthesizeProposalsFromProjectState(
        root,
        options?.effectiveScope?.module_key ?? serviceMod.key,
        baseUrl,
        serviceMod.route_hint ?? '/',
        deps,
        options,
      );
      inputs = synthesized.proposals;
      usedDiscoveryRevisionId = synthesized.discoveryRevisionId;
      ruleResolutionSummary = synthesized.ruleResolutionSummary;
      ruleAmbiguities = synthesized.ruleAmbiguities;
    }

    const proposalRes = appService.proposeModuleCases({
      projectId: project.project_id,
      moduleKey: serviceMod.key,
      campaignId: snapshot.campaign?.campaign_id ?? null,
      proposals: inputs,
    });

    appService.upsertTask({
      projectId: project.project_id,
      campaignId: snapshot.campaign?.campaign_id ?? '',
      moduleId: serviceMod.module_id,
      kind: 'case_proposal',
      title: `Casos propuestos para '${moduleName}'`,
      status: proposalRes.pending_oracle.length > 0 ? 'waiting_decision' : 'completed',
      progressCurrent: proposalRes.proposed.length,
      progressTotal: Math.max(1, proposalRes.all_cases.length),
      pendingDecision:
        proposalRes.pending_oracle.length > 0
          ? {
              kind: 'oracle_decision',
              prompt: `Falta oráculo de negocio en ${proposalRes.pending_oracle.length} caso(s); los casos válidos ya pueden aprobarse por lote sin bloqueo.`,
              options: ['decide_oracles', 'approve_batch'],
              blocking: false,
            }
          : null,
    });

    return {
      status: 'proposed',
      epistemic_separation: true,
      module: moduleName,
      ...(usedDiscoveryRevisionId ? { discovery_revision_id: usedDiscoveryRevisionId } : {}),
      ...(ruleResolutionSummary ? { rule_resolution_summary: ruleResolutionSummary } : {}),
      ...(ruleAmbiguities && ruleAmbiguities.length > 0 ? { rule_ambiguities: ruleAmbiguities } : {}),
      proposed_cases: proposalRes.proposed,
      pending_oracle_cases: proposalRes.pending_oracle,
      non_blocking_pending_oracles: proposalRes.pending_oracle.length > 0,
      summary: {
        proposed_ready: proposalRes.proposed.length,
        pending_oracle: proposalRes.pending_oracle.length,
        total_cases: proposalRes.all_cases.length,
      },
      siguiente_accion: {
        tipo: proposalRes.proposed.length > 0 ? 'decision' : 'entrevista',
        tool: 'qap_plan',
        descripcion:
          proposalRes.proposed.length > 0
            ? 'Aprueba el lote de casos válidos (approve_batch) o resuelve los oráculos pendientes (decide_oracles).'
            : 'Define el resultado esperado de negocio para el caso pendiente (decide_oracles).',
      },
    };
  }

  if (action === 'decide_oracles') {
    if (!Array.isArray(command.decisions) || command.decisions.length === 0) {
      return blocked('invalid_oracle_decisions');
    }
    const decisions: OracleDecisionInput[] = [];
    for (const d of command.decisions) {
      if (
        !isObject(d) ||
        typeof d.case_id !== 'string' ||
        typeof d.expected_outcome !== 'string' ||
        d.expected_outcome.trim().length < 3
      ) {
        return blocked('invalid_oracle_decision');
      }
      decisions.push({
        case_id: d.case_id.trim(),
        expected_outcome: d.expected_outcome.trim(),
        assert_selector: typeof d.assert_selector === 'string' ? d.assert_selector.trim() : undefined,
        assert_type:
          d.assert_type === 'visible' ||
          d.assert_type === 'exists' ||
          d.assert_type === 'contains' ||
          d.assert_type === 'equals'
            ? d.assert_type
            : 'contains',
        risk_accepted: d.risk_accepted === true,
        risk_note: typeof d.risk_note === 'string' ? d.risk_note.trim() : undefined,
      });
    }

    const res = appService.decideCaseOracles({
      projectId: project.project_id,
      moduleKey: moduleName,
      decisions,
    });
    if (res.missing_cases.length > 0 && res.updated.length === 0) {
      return blocked('oracle_case_not_found', { missing_cases: res.missing_cases });
    }
    return {
      status: 'updated',
      module: moduleName,
      updated_cases: res.updated,
      missing_cases: res.missing_cases,
      siguiente_accion: {
        tipo: 'decision',
        tool: 'qap_plan',
        descripcion: 'Oráculos acreditados. Confirma el lote de casos listos con action=approve_batch.',
      },
    };
  }

  if (action === 'approve_batch') {
    const caseIds = Array.isArray(command.case_ids)
      ? command.case_ids.map((id) => String(id).trim()).filter(Boolean)
      : undefined;

    const approval = appService.approveCaseBatch({
      projectId: project.project_id,
      moduleKey: moduleName,
      caseIds,
      approvedBy: 'qa_user',
    });
    if (approval.status === 'blocked') {
      return blocked(approval.code ?? 'case_approval_blocked', {
        skipped_pending_oracle: approval.skipped_pending_oracle.map((c) => c.case_id),
      });
    }

    if (!existsSync(join(modDir, 'context.yaml'))) {
      await storage.saveModuleContext(moduleName, {
        _version: '2',
        module: moduleName,
        routes: [serviceMod.route_hint ?? '/'],
      });
    }

    const validator = new SchemaValidator();
    for (const tc of approval.approved_cases) {
      const normalizedSteps = normalizeStepsForProposal(
        tc.steps,
        routeUrl,
        tc.expectation.expected_outcome,
      ).map((s) => {
        if (s.type === 'waitFor' && s.selector && s.timeout !== undefined) {
          const copy = { ...s };
          delete copy.timeout;
          return copy;
        }
        return s;
      }) as TCCase['steps'];
      const normalizedTc: TCCase = {
        _version: '1.0.0',
        id: tc.case_id,
        name: tc.title,
        tags: [moduleName],
        case_category: 'happy_path',
        ...(tc.requirement_id ? { source_rule_id: tc.requirement_id } : {}),
        steps: normalizedSteps,
      };
      const tcValidation = validator.validateTcCase(normalizedTc);
      if (!tcValidation.valid) {
        return blocked('invalid_test_case', { case_id: tc.case_id, errors: tcValidation.errors });
      }
      await storage.saveTestCase(moduleName, normalizedTc, `TC-${tc.case_id}`);
    }

    return {
      status: 'approved',
      idempotent: approval.idempotent,
      duplicate_confirmation_prevented: approval.duplicate_confirmation_prevented,
      confirmation_digest: approval.confirmation_digest,
      module: moduleName,
      cases: approval.approved_cases.map((c) => ({
        case_id: c.case_id,
        version: c.version,
        requirement_id: c.requirement_id,
        requirement_revision: c.requirement_revision,
        conformity_status: c.conformity_status,
      })),
      skipped_pending_oracle: approval.skipped_pending_oracle.map((c) => ({
        case_id: c.case_id,
        title: c.title,
        question: c.expectation.business_risk_question,
      })),
      siguiente_accion: {
        tipo: 'trabajo',
        tool: 'qap_plan',
        descripcion: `Lote aprobado (${approval.approved_cases.length} caso(s)). Genera el plan DAG con qap_plan antes de ejecutar qap_test.`,
      },
    };
  }

  if (action === 'accept_case_gap') {
    const acceptance = command.acceptance;
    if (
      !isObject(acceptance) ||
      typeof acceptance.case_id !== 'string' ||
      typeof acceptance.reason !== 'string' ||
      acceptance.reason.trim().length < 15
    ) {
      return blocked('invalid_human_acceptance', {
        razon: 'La aceptación humana requiere case_id y reason de al menos 15 caracteres.',
      });
    }
    const recorded = appService.recordCaseHumanAcceptance({
      projectId: project.project_id,
      caseId: acceptance.case_id.trim(),
      moduleKey: moduleName,
      acceptedBy: 'qa_user',
      reason: acceptance.reason.trim(),
    });
    if (!recorded) {
      return blocked('case_result_not_found');
    }
    return {
      status: 'human_accepted',
      module: moduleName,
      case_result: recorded,
    };
  }

  return blocked('invalid_case_command');
}
