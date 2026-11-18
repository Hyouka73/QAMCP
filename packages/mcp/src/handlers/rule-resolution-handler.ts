import { createHash } from 'node:crypto';

import { normalizeSlug } from '@qap/shared';

import type { QapApplicationService } from '../application/application-service.js';
import type { RuleAssertType } from '../application/scoped-rule-resolver.js';
import { reviewDigest } from '../host-review.js';

import type { HumanReviewDecision, HumanReviewRequest } from './canonical-interview-service.js';
import { isObject } from './state-services.js';

export interface VerifiableRuleReviewGateway {
  isAvailable(): boolean;
  lastMechanism?(): 'client_elicitation' | 'host_gateway';
  review(request: Readonly<HumanReviewRequest>): Promise<HumanReviewDecision | null>;
}

const ALLOWED_TOP_KEYS = new Set(['targetPath', 'module', 'rule_resolution']);
const ALLOWED_RESOLUTION_KEYS = new Set([
  'action',
  'question_id',
  'question_text',
  'rule_key',
  'title',
  'expected_outcome',
  'requirement_id',
  'discovery_revision_id',
  'environment',
  'tenant_id',
  'role',
  'route_pathname',
  'scope_declaration',
  'evidence_refs',
  'assert_selector',
  'assert_type',
]);

const blocked = (code: string, extra: Record<string, unknown> = {}) => ({
  status: 'blocked',
  code,
  human_review_required: true,
  ...extra,
});

function cleanText(v: unknown, max: number): v is string {
  return (
    typeof v === 'string' &&
    v.trim().length > 0 &&
    v.length <= max &&
    ![...v].some((c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127)
  );
}

export async function handleScopedRuleResolution(params: {
  readonly rootDir: string;
  readonly moduleName: string;
  readonly rawArgs: Record<string, unknown>;
  readonly appService: QapApplicationService | undefined;
  readonly reviewGateway: VerifiableRuleReviewGateway;
}): Promise<Record<string, unknown>> {
  const { rootDir, moduleName, rawArgs, appService, reviewGateway } = params;

  if (
    Object.keys(rawArgs).some((k) => !ALLOWED_TOP_KEYS.has(k)) ||
    !cleanText(moduleName, 120) ||
    !isObject(rawArgs.rule_resolution) ||
    Object.keys(rawArgs.rule_resolution).some((k) => !ALLOWED_RESOLUTION_KEYS.has(k))
  ) {
    return blocked('invalid_rule_resolution_arguments');
  }

  if (!appService) {
    return blocked('application_service_unavailable');
  }

  const project = appService.findActiveProjectByRoot(rootDir);
  if (!project) {
    return blocked('project_not_found');
  }

  const cmd = rawArgs.rule_resolution;
  const action = typeof cmd.action === 'string' ? cmd.action : '';
  if (action !== 'list' && action !== 'confirm') {
    return blocked('invalid_rule_resolution_arguments');
  }

  const snapshot = appService.resumeProject(project.project_id);
  const modKey = normalizeSlug(moduleName);
  const envName = cleanText(cmd.environment, 120)
    ? cmd.environment.trim()
    : (snapshot.environment?.name ?? 'default');
  const tenantId = cleanText(cmd.tenant_id, 120)
    ? cmd.tenant_id.trim()
    : (snapshot.environment?.default_tenant ?? 'default');
  const role = cleanText(cmd.role, 120) ? cmd.role.trim() : 'default';
  const routePathname = cleanText(cmd.route_pathname, 300) ? cmd.route_pathname.trim() : '*';
  const scopeDeclaration: 'exact' | 'general_compatible' =
    cmd.scope_declaration === 'general_compatible' ? 'general_compatible' : 'exact';

  if (action === 'list') {
    const decisions = appService.listRuleConfirmationDecisions(project.project_id, {
      moduleKey: modKey,
      ...(cleanText(cmd.environment, 120) ? { environmentName: envName } : {}),
      ...(cleanText(cmd.tenant_id, 120) ? { tenantId } : {}),
      ...(cleanText(cmd.role, 120) ? { role } : {}),
    });
    const scopedRules = appService.listScopedBusinessRules(project.project_id, {
      moduleKey: modKey,
    });
    return {
      status: 'listed',
      read_only: true,
      module: moduleName,
      decisions,
      scoped_rules: scopedRules,
    };
  }

  const discoveryRevisionId = cleanText(cmd.discovery_revision_id, 120)
    ? cmd.discovery_revision_id.trim()
    : null;
  const revision = discoveryRevisionId
    ? appService.getDiscoveryRevision(discoveryRevisionId)
    : appService.findLatestDiscoveryRevisionForScope({
        project_id: project.project_id,
        environment_name: envName,
        tenant_id: tenantId,
        role,
        module_key: modKey,
      });

  const requestedQuestionId = cleanText(cmd.question_id, 160) ? cmd.question_id.trim() : '';
  const requestedRuleKey = cleanText(cmd.rule_key, 120) ? cmd.rule_key.trim() : '';
  const matchingAmbiguity = revision?.dossier.rule_resolution?.ambiguities.find(
    (a) =>
      (requestedQuestionId && a.ambiguity_id === requestedQuestionId) ||
      (requestedRuleKey && a.rule_key === requestedRuleKey),
  );
  const priorDecisionForQuestion =
    !matchingAmbiguity && (requestedQuestionId || requestedRuleKey)
      ? appService
          .listRuleConfirmationDecisions(project.project_id, {
            moduleKey: modKey,
            environmentName: envName,
            tenantId,
            role,
          })
          .find(
            (d) =>
              (requestedQuestionId && d.question_id === requestedQuestionId) ||
              (requestedRuleKey && d.rule_key === requestedRuleKey),
          )
      : undefined;

  const questionId = requestedQuestionId || matchingAmbiguity?.ambiguity_id || priorDecisionForQuestion?.question_id || '';
  const questionText = cleanText(cmd.question_text, 1000)
    ? cmd.question_text.trim()
    : (matchingAmbiguity?.question ?? priorDecisionForQuestion?.question_text ?? '');
  const ruleKey = requestedRuleKey || matchingAmbiguity?.rule_key || priorDecisionForQuestion?.rule_key || '';
  const title = cleanText(cmd.title, 200) ? cmd.title.trim() : '';
  const expectedOutcome = cleanText(cmd.expected_outcome, 2000) ? cmd.expected_outcome.trim() : '';

  if (!questionId || !questionText || !title || expectedOutcome.length < 3) {
    return blocked('invalid_rule_resolution_payload', {
      razon: 'Se requieren question_id, question_text (o ambigüedad en Discovery), title y expected_outcome sustantivo.',
    });
  }

  const rawEvidenceRefs = Array.isArray(cmd.evidence_refs)
    ? cmd.evidence_refs.filter((e): e is string => cleanText(e, 200)).map((e) => e.trim())
    : [];
  const ambiguityEvidenceRefs = matchingAmbiguity
    ? matchingAmbiguity.candidates.map((c) => c.source_id).filter(Boolean)
    : [];
  const evidenceRefs = [
    ...new Set([
      ...rawEvidenceRefs,
      ...ambiguityEvidenceRefs,
      ...(revision ? [revision.revision_id] : []),
    ]),
  ];

  const effectiveRuleKey = ruleKey || normalizeSlug(title).replace(/-/g, '_');
  const requirementId = cleanText(cmd.requirement_id, 120)
    ? cmd.requirement_id.trim()
    : `REQ-${modKey.toUpperCase()}-${createHash('sha256')
        .update(JSON.stringify([project.project_id, modKey, envName, tenantId, role, routePathname, effectiveRuleKey]))
        .digest('hex')
        .slice(0, 10)}`;

  const existingReq = appService
    .listServiceRequirements(project.project_id, modKey)
    .find((r) => r.requirement_id === requirementId);
  const existingRevision = existingReq?.revision ?? 0;

  const mod = snapshot.modules.find((m) => m.key === modKey);
  const scopeContext = {
    environment_name: envName,
    tenant_id: tenantId,
    role,
    route_pathname: routePathname,
    scope_declaration: scopeDeclaration,
    ...(revision ? { discovery_revision_id: revision.revision_id } : {}),
  };

  const proposal = {
    title,
    description: expectedOutcome,
    category: 'business_rule' as const,
    acceptance_criteria: [expectedOutcome],
  };

  const statementDigest = reviewDigest({
    moduleKey: modKey,
    ruleKey: effectiveRuleKey,
    questionId,
    questionText,
    proposal,
    scope: scopeContext,
    evidenceRefs,
  });

  const body = {
    projectRoot: rootDir,
    applicationId: project.project_id,
    environmentId: snapshot.environment?.env_id ?? envName,
    moduleId: mod?.module_id ?? modKey,
    moduleKey: modKey,
    questionId,
    context: JSON.stringify(scopeContext),
    statementVersion: existingRevision + 1,
    statementDigest,
    requirementId,
    expectedRevision: existingRevision,
    proposal,
    question: {
      category: 'accion' as const,
      text: questionText,
      evidenceRefs: evidenceRefs.map((id) => ({ kind: 'evidence' as const, id, revision: 1 })),
    },
  };
  const request: HumanReviewRequest = {
    ...body,
    requestDigest: reviewDigest(body),
  };

  if (!reviewGateway.isAvailable()) {
    return blocked('human_review_gateway_required', {
      review_request_digest: request.requestDigest,
    });
  }

  let decision: HumanReviewDecision | null;
  try {
    decision = await reviewGateway.review(structuredClone(request));
  } catch {
    return blocked('human_review_unavailable', {
      review_request_digest: request.requestDigest,
    });
  }

  if (!decision) {
    return blocked('human_review_not_authorized', {
      review_request_digest: request.requestDigest,
    });
  }

  const now = Date.now();
  const at = Date.parse(decision.decidedAt);
  const expiry = Date.parse(decision.expiresAt);
  if (
    decision.requestDigest !== request.requestDigest ||
    decision.presentedStatementDigest !== request.statementDigest ||
    !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(decision.approvalId) ||
    !cleanText(decision.reviewer, 200) ||
    !Number.isFinite(at) ||
    !Number.isFinite(expiry) ||
    at > now ||
    expiry <= now ||
    expiry <= at ||
    expiry - at > 15 * 60_000 ||
    !['confirm', 'reject', 'defer'].includes(decision.decision) ||
    appService.hasUsedRuleApprovalId(project.project_id, decision.approvalId)
  ) {
    return blocked('human_review_invalid', {
      review_request_digest: request.requestDigest,
    });
  }

  const assertSelector = cleanText(cmd.assert_selector, 300) ? cmd.assert_selector.trim() : null;
  const assertType: RuleAssertType | null =
    cmd.assert_type === 'visible' ||
    cmd.assert_type === 'exists' ||
    cmd.assert_type === 'contains' ||
    cmd.assert_type === 'equals'
      ? cmd.assert_type
      : null;

  const mechanism = reviewGateway.lastMechanism?.() ?? 'host_gateway';

  const recorded = appService.recordRuleConfirmationDecision({
    projectId: project.project_id,
    moduleKey: modKey,
    requirementId,
    ruleKey: effectiveRuleKey,
    title,
    expectedOutcome,
    questionId,
    questionText,
    decision: decision.decision,
    approvalId: decision.approvalId,
    requestDigest: request.requestDigest,
    presentedStatementDigest: decision.presentedStatementDigest,
    reviewer: decision.reviewer,
    mechanism,
    decidedAt: decision.decidedAt,
    evidenceRefs,
    discoveryRevisionId: revision?.revision_id ?? discoveryRevisionId,
    scope: {
      environment_name: envName,
      tenant_id: tenantId,
      role,
      route_pathname: routePathname,
      scope_declaration: scopeDeclaration,
    },
    assertSelector,
    assertType,
  });

  if (decision.decision !== 'confirm') {
    return {
      status: decision.decision === 'reject' ? 'rejected' : 'deferred',
      decision_id: recorded.decision.decision_id,
      module: moduleName,
      rule_key: effectiveRuleKey,
      question: { id: questionId, text: questionText },
      scope: {
        environment_name: envName,
        tenant_id: tenantId,
        role,
        route_pathname: routePathname,
        scope_declaration: scopeDeclaration,
      },
      evidence: {
        approval_id: decision.approvalId,
        request_digest: request.requestDigest,
        reviewer: decision.reviewer,
        decided_at: decision.decidedAt,
        mechanism,
        evidence_refs: evidenceRefs,
      },
    };
  }

  return {
    status: 'confirmed',
    decision_id: recorded.decision.decision_id,
    requirement_id: recorded.requirement!.requirement_id,
    revision: recorded.requirement!.revision,
    rule_id: recorded.rule!.rule_id,
    rule_key: recorded.rule!.rule_key,
    module: moduleName,
    question: { id: questionId, text: questionText },
    scope: {
      environment_name: envName,
      tenant_id: tenantId,
      role,
      route_pathname: routePathname,
      scope_declaration: scopeDeclaration,
    },
    evidence: {
      approval_id: decision.approvalId,
      request_digest: request.requestDigest,
      reviewer: decision.reviewer,
      decided_at: decision.decidedAt,
      mechanism,
      evidence_refs: evidenceRefs,
    },
    siguiente_accion: {
      tipo: 'trabajo',
      tool: 'qap_discover',
      descripcion:
        'Regla confirmada y acreditada con procedencia verificable. Ejecuta qap_discover para generar una nueva revisión del dossier con la regla resuelta.',
    },
  };
}
