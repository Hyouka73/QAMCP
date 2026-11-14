import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { FileSystemStorage } from '@qap/knowledge';
import { normalizeSlug, SchemaValidator, type TCCase } from '@qap/shared';

import type {
  OracleDecisionInput,
  ProposeCaseInput,
} from '../application/block3-execution-repo.js';

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
    steps.push({
      type: 'assert',
      selector: 'body',
      assertion_type: 'contains',
      expected: expectedOutcome.trim(),
    });
  }
  return steps;
}

async function synthesizeProposalsFromProjectState(
  root: string,
  moduleKey: string,
  baseUrl: string,
  routeHint: string | null,
  deps: StateDependencies,
): Promise<ProposeCaseInput[]> {
  const appService = deps.applicationService!;
  const project = appService.findActiveProjectByRoot(root)!;
  const bound = binding(root, deps);
  const targetUrl = resolveAbsoluteRouteUrl(baseUrl, routeHint);

  const reqs = appService.listServiceRequirements(project.project_id, moduleKey);
  const inventories = appService.listPartialInventories(project.project_id);
  const latestInv = inventories.find(inventory => inventory.target_url === targetUrl &&
    inventory.views_count > 0 && inventory.candidate_keys.includes(moduleKey));

  const observedControls: string[] = [];
  const observedHeadings: string[] = [];
  const evidenceRefs: string[] = [];

  if (bound && latestInv) {
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

  const proposals: ProposeCaseInput[] = [];
  const confirmedReqs = reqs.filter((r) => r.validation_status === 'confirmed' && r.acceptance_criteria.length > 0);
  for (const r of confirmedReqs) {
    const criterion = r.acceptance_criteria[0];
    proposals.push({
      title: `Verificar ${r.title}`,
      requirement_id: r.requirement_id,
      expected_outcome: criterion,
      oracle_source: r.source === 'ingested_doc' ? 'ingested_doc' : 'user',
      risk_level: r.risk_level,
      risk_accepted: r.risk_decision === 'accepted_by_qa',
      observation: {
        source_kind: latestInv?.mode?.includes('spa') ? 'spa_dom' : 'observed_dom',
        route: routeHint ?? '/',
        observed_controls: observedControls.slice(0, 10),
        observed_headings: observedHeadings.slice(0, 10),
        evidence_refs: evidenceRefs.slice(0, 5),
      },
      inference: {
        rationale: 'Propuesta derivada de requisito acreditado y observaciones capturadas.',
        proposed_flow: `Navegar a ${routeHint ?? '/'} y validar expectativa de negocio.`,
        proposed_by: 'qap',
      },
      steps: normalizeStepsForProposal(undefined, targetUrl, criterion),
    });
  }

  if (proposals.length === 0) {
    const primaryLabel = observedControls[0] ?? observedHeadings[0] ?? moduleKey;
    proposals.push({
      title: `Comportamiento de ${primaryLabel}`,
      expected_outcome: null,
      oracle_source: 'missing',
      observation: {
        source_kind: latestInv?.mode?.includes('spa') ? 'spa_dom' : 'observed_dom',
        route: routeHint ?? '/',
        observed_controls: observedControls.slice(0, 10),
        observed_headings: observedHeadings.slice(0, 10),
        evidence_refs: evidenceRefs.slice(0, 5),
      },
      inference: {
        rationale: 'Falta un criterio de negocio verificable para este módulo.',
        proposed_flow: `Verificar el comportamiento esperado en ${routeHint ?? '/'}.`,
        proposed_by: 'qap',
      },
      steps: normalizeStepsForProposal(undefined, targetUrl, null),
    });
  }

  return proposals;
}

export async function runConversationalCaseWorkflow(
  root: string,
  moduleName: string,
  command: Record<string, unknown>,
  deps: StateDependencies,
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
  const serviceMod =
    snapshot.modules.find((m) => m.title.toLowerCase() === moduleName.toLowerCase()) ??
    snapshot.modules.find((m) => m.key === normalizeSlug(moduleName)) ??
    appService.upsertModule({ projectId: project.project_id, key: moduleName, title: moduleName });

  const baseUrl = snapshot.environment?.base_url ?? 'http://127.0.0.1';
  const routeUrl = resolveAbsoluteRouteUrl(baseUrl, serviceMod.route_hint ?? '/');
  const storage = new FileSystemStorage({ rootDir: root });
  const modDir = join(root, '.qa', 'modules', moduleName);
  mkdirSync(modDir, { recursive: true });

  if (action === 'propose_from_observations' || action === 'generate') {
    let inputs: ProposeCaseInput[];
    if (Array.isArray(command.proposals)) {
      inputs = [];
      for (const rawItem of command.proposals) {
        if (!isObject(rawItem) || typeof rawItem.title !== 'string' || !rawItem.title.trim()) {
          return blocked('invalid_case_proposal');
        }
        const rawSteps = Array.isArray(rawItem.steps)
          ? rawItem.steps.filter((s): s is Record<string, unknown> => isObject(s))
          : undefined;
        const expected =
          typeof rawItem.expected_outcome === 'string' && rawItem.expected_outcome.trim()
            ? rawItem.expected_outcome.trim()
            : null;
        let reqId = typeof rawItem.requirement_id === 'string' ? rawItem.requirement_id : undefined;
        if (!reqId && expected) {
          const createdReq = appService.upsertServiceRequirement({
            projectId: project.project_id,
            moduleId: serviceMod.module_id,
            moduleKey: moduleName,
            title: rawItem.title.trim(),
            description: expected,
            source: rawItem.oracle_source === 'ingested_doc' ? 'ingested_doc' : 'user',
            validationStatus: 'confirmed',
            acceptanceCriteria: [expected],
            riskLevel:
              rawItem.risk_level === 'high' || rawItem.risk_level === 'critical' || rawItem.risk_level === 'low'
                ? rawItem.risk_level
                : 'medium',
            riskDecision: rawItem.risk_accepted === true ? 'accepted_by_qa' : 'not_required',
          });
          reqId = createdReq.requirement_id;
        }
        inputs.push({
          case_id: typeof rawItem.case_id === 'string' ? rawItem.case_id : undefined,
          title: rawItem.title.trim(),
          requirement_id: reqId,
          expected_outcome: expected,
          oracle_source:
            rawItem.oracle_source === 'ingested_doc' || rawItem.oracle_source === 'user'
              ? rawItem.oracle_source
              : expected
                ? 'user'
                : 'missing',
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
            : undefined,
          steps: normalizeStepsForProposal(rawSteps, routeUrl, expected),
        });
      }
    } else {
      inputs = await synthesizeProposalsFromProjectState(
        root,
        serviceMod.key,
        baseUrl,
        serviceMod.route_hint ?? '/',
        deps,
      );
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

  if (action === 'approve_batch' || action === 'review') {
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
