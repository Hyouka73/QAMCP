import { createHash } from 'node:crypto';
import { FileSystemStorage } from '@qap/knowledge';
import { SchemaValidator, type ServiceTestCaseRecord, type TCCase } from '@qap/shared';

import type { QapApplicationService } from '../application/application-service.js';
import type { ProposeCaseInput } from '../application/block3-execution-repo.js';
import type { DiscoveryDossierScope, DiscoveryRevisionRecord } from '../application/discovery-dossier.js';
import { inspectedInitialView } from '../application/discovery-case-evidence.js';
import { stableStringify } from '../application/lineaged-case.js';
import { policyAllowsNavigation, type AutonomyPolicy, type FixtureWrite } from '../autonomy-policy.js';
import { reviewDigest } from '../host-review.js';
import { materializeReviewedCase } from './conversational-case-workflow.js';
import { binding, isObject, type StateDependencies } from './state-services.js';

type EffectiveScope = DiscoveryDossierScope & { readonly base_url: string; readonly profile_label?: string | null };
const expectation = 'El control identificado por Discovery está visible en la vista.';
const invalid = (code: string) => ({ allowed: false as const, code });

function exactScope(revision: DiscoveryRevisionRecord, scope: EffectiveScope) {
  return revision.project_id === scope.project_id && revision.application_id === scope.application_id &&
    revision.environment_id === scope.environment_id && revision.environment_name === scope.environment_name &&
    revision.tenant_id === scope.tenant_id && revision.profile_id === scope.profile_id && revision.role === scope.role &&
    revision.dossier.scope.inventory_environment_revision === scope.inventory_environment_revision &&
    revision.dossier.scope.inventory_policy_digest === scope.inventory_policy_digest;
}

function allowedScope(scope: EffectiveScope, policy: AutonomyPolicy) {
  return scope.tenant_id === policy.tenant && (scope.profile_id ?
    policy.profiles.includes(scope.profile_label ?? '') || policy.profiles.includes(scope.profile_id) : !policy.profiles.length);
}

function controlFor(revision: DiscoveryRevisionRecord, pathname: string, selector: string) {
  const view = inspectedInitialView(revision.dossier, pathname);
  const matching = view?.controls.filter(control => control.selector_candidates.includes(selector));
  return view && matching?.length === 1 && matching[0].visibility === 'visible' && !matching[0].disabled
    ? view : undefined;
}

function stepsFor(url: string, selector: string, write?: FixtureWrite): Record<string, unknown>[] {
  return [{ type: 'navigate', url }, { type: 'assert', assertion_type: 'visible', selector },
    ...(write ? [{ type: 'click', selector: write.selector }] : []), { type: 'screenshot' }];
}

export async function getAutonomousScope(deps: StateDependencies, root: string, module: string,
  requested: { environment?: string; profile?: string; tenantId?: string }) {
  const service = deps.applicationService;
  const project = service?.findActiveProjectByRoot(root);
  if (!service || !project) return;
  const env = service.resumeProject(project.project_id, { readOnly: true }).environment;
  if (!env || env.is_production) return;
  const policy = deps.autonomyPolicy?.(root, new URL(env.base_url).origin);
  if (!policy) return;
  const selected = service.resolveEffectiveScope({ projectId: project.project_id, moduleName: module,
    ...requested, tenantId: requested.tenantId ?? policy.tenant ?? undefined });
  const bound = binding(root, deps);
  const knownEnv = bound && await bound.store.get(bound.applicationId, 'environment', bound.environmentId);
  if (!selected.ok || selected.scope.environment_id !== env.env_id || !knownEnv || knownEnv.entity.is_production ||
      !allowedScope(selected.scope, policy)) return;
  const scope = { ...selected.scope, inventory_environment_revision: knownEnv.revision, inventory_policy_digest: policy.digest };
  return { service, project, scope, policy };
}

/** SQLite provenance and projection integrity are checked before a YAML case can enter a plan or runner. */
export function caseEligibility(service: QapApplicationService, source: ServiceTestCaseRecord | undefined,
  scope: EffectiveScope, policy: AutonomyPolicy, materialized?: TCCase) {
  if (!source || source.project_id !== scope.project_id || source.module_key !== scope.module_key) return invalid('case_provenance_required');
  if (source.expectation.metadata?.policy_denied) return invalid('SKIPPED_BY_POLICY');
  if (source.oracle_status === 'missing_oracle') return invalid('INDETERMINATE');
  const canonical = materializeReviewedCase(source, scope.module_key);
  if (materialized && stableStringify(materialized) !== stableStringify(canonical)) return invalid('case_content_mismatch');
  if (!new SchemaValidator().validateTcCase(canonical).valid) return invalid('invalid_test_case');
  if (source.risk_decision === 'rejected' || source.conformity_status === 'rejected') return invalid('SKIPPED_BY_POLICY');
  const origin = new URL(scope.base_url).origin;
  const url = new URL(source.observation.route, origin).href;
  if (!policyAllowsNavigation(policy, url)) return invalid('SKIPPED_BY_POLICY');

  const meta = source.expectation.metadata;
  const revision = meta?.discovery_revision_id && service.getDiscoveryRevision(meta.discovery_revision_id);
  if (!revision || !exactScope(revision, scope) || source.expectation.source !== 'observed' ||
      source.expectation.expected_outcome !== expectation) return invalid('oracle_provenance_required');
  const selector = canonical.steps[1]?.selector;
  if (!selector) return invalid('oracle_provenance_required');
  const view = controlFor(revision, source.observation.route, selector);
  if (!view || !source.observation.evidence_refs.includes(view.evidence_id)) return invalid('oracle_provenance_required');
  const write = meta?.fixture_write_id ? policy.writes.find(item => item.id === meta.fixture_write_id &&
    item.view === source.observation.route && controlFor(revision, item.view, item.selector)) : undefined;
  if (meta?.fixture_write_id && !write) return invalid('SKIPPED_BY_POLICY');
  if (stableStringify(source.steps) !== stableStringify(stepsFor(url, selector, write))) return invalid('case_steps_outside_policy');
  return { allowed: true as const, canonical, write, digest: reviewDigest({ policy: policy.digest, revision: revision.revision_id,
    version: source.version, canonical, evidence: view.evidence_id }), requirements: [] };
}

function deterministicCaseId(input: unknown): string {
  const hash = createHash('sha256').update(stableStringify(input)).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-5${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

export function observedScenarios(revision: DiscoveryRevisionRecord, policy: AutonomyPolicy) {
  return policy.paths.flatMap(path => {
    const view = inspectedInitialView(revision.dossier, path);
    if (!view) return [];
    return [{ path, evidence_id: view.evidence_id, headings: view.headings, forms: view.forms,
      links: view.links?.filter(link => link.authorized).flatMap(link => {
        const target = revision.dossier.routes[link.target_route_index]?.authorized_pathname;
        return target && policy.paths.includes(target) ? [{ path: target, label: link.label }] : [];
      }), controls: view.controls.flatMap(control => {
      const selector = control.selector_candidates.find(candidate => controlFor(revision, path, candidate));
      return selector ? [{ selector, tag: control.tag, role: control.role, input_type: control.input_type, label: control.label }] : [];
    }).slice(0, 12) }];
  });
}

export async function autonomousCaseWorkflow(root: string, module: string, command: unknown, deps: StateDependencies,
  requested: { environment?: string; profile?: string; tenantId?: string; revisionId?: string }) {
  const admission = await getAutonomousScope(deps, root, module, requested);
  if (!admission) return { status: 'blocked', code: 'autonomy_policy_required' };
  if (!isObject(command)) return { status: 'blocked', code: 'invalid_case_command' };
  const { service, project, scope, policy } = admission;
  const existing = service.listServiceCases(project.project_id, scope.module_key);
  const status = (tc: ServiceTestCaseRecord) => {
    const check = caseEligibility(service, tc, scope, policy);
    return { case_id: tc.case_id, version: tc.version, title: tc.title,
      status: check.allowed ? 'eligible' : check.code, reason: tc.expectation.business_risk_question };
  };
  if (command.action === 'review') return { status: 'success', cases: existing.map(status) };
  if (!['generate', 'propose_from_observations'].includes(String(command.action))) {
    return { status: 'blocked', code: 'autonomous_case_workflow_required', siguiente_accion: {
      tipo: 'trabajo', tool: 'qap_plan', description: 'Usa generate o propose_from_observations con evidencia de Discovery.' } };
  }
  const revisions = service.listLatestDiscoveryRevisionsByScope(project.project_id);
  const revision = requested.revisionId ? service.getDiscoveryRevision(requested.revisionId) :
    revisions.find(item => item.dossier.inventory && exactScope(item, scope));
  if (!revision?.dossier.inventory || !exactScope(revision, scope) ||
      revision.dossier.routes.some(route => route.state === 'candidate' && route.resumable)) {
    return { status: 'blocked', code: 'discovery_checkpoint_required' };
  }
  const observations = observedScenarios(revision, policy);
  if (command.proposals !== undefined && (!Array.isArray(command.proposals) || command.proposals.length > 64))
    return { status: 'blocked', code: 'invalid_case_proposals' };
  const defaults = observations.flatMap(view => view.controls.slice(0, 1).map(control => ({
    route: view.path, selector: control.selector, title: `Verificar control visible en ${view.path}`,
  })));
  const suggested = command.proposals ?? defaults;
  if (!Array.isArray(suggested) || !suggested.every(item => isObject(item) && typeof item.title === 'string' &&
      item.title.trim() && item.title.length <= 160 && !/[\u0000-\u001f\u007f]/.test(item.title) && typeof item.route === 'string' &&
      Object.keys(item).every(key => ['title', 'route', 'selector', 'fixture_write', 'oracle'].includes(key)) &&
      (item.selector === undefined || (typeof item.selector === 'string' && item.selector.length <= 200)) &&
      (item.fixture_write === undefined || typeof item.fixture_write === 'string') &&
      (item.oracle === undefined || ['visible', 'indeterminate'].includes(String(item.oracle))))) {
    return { status: 'blocked', code: 'invalid_case_proposals' };
  }
  const proposals = new Map<string, ProposeCaseInput>();
  const excluded: { case_id: string; title: string; status: string; reason: string }[] = [];
  for (const item of suggested) {
    const title = item.title as string;
    const route = item.route as string;
    const selector = typeof item.selector === 'string' ? item.selector : undefined;
    const id = deterministicCaseId([project.project_id, scope.module_key, revision.revision_id, route,
      selector ?? title, item.fixture_write ?? null, item.oracle ?? 'visible']);
    const write = item.fixture_write ? policy.writes.find(write => write.id === item.fixture_write && write.view === route &&
      controlFor(revision, route, write.selector)) : undefined;
    const permitted = policy.paths.includes(route) && (!item.fixture_write || Boolean(write));
    const view = permitted && selector && item.oracle !== 'indeterminate' ? controlFor(revision, route, selector) : undefined;
    const reason = permitted ? 'La expectativa carece de un control visible acreditado por esta revisión.' : 'Ruta u operación fuera de la política del entorno.';
    if (!permitted) excluded.push({ case_id: id, title, status: 'SKIPPED_BY_POLICY', reason });
    if (!existing.some(tc => tc.case_id === id)) proposals.set(id, {
      case_id: id, title, risk_level: 'low', observation: { route: permitted ? route : '/', evidence_refs: view ? [view.evidence_id] : [] },
      inference: { proposed_by: command.proposals ? 'assistant' : 'qap' },
      ...(view && selector ? { expected_outcome: expectation, oracle_source: 'observed' as const,
        steps: stepsFor(new URL(route, policy.origin).href, selector, write) } : { business_risk_question: reason }),
      expectation_metadata: { discovery_revision_id: revision.revision_id, ...(write ? { fixture_write_id: write.id } : {}),
        ...(!permitted ? { policy_denied: true as const } : {}),
        ...(view ? { decision_status: 'accredited' } : {}) },
    });
  }
  const inserted = proposals.size ? service.proposeModuleCases({ projectId: project.project_id, moduleKey: scope.module_key,
    proposals: [...proposals.values()] }).all_cases : [];
  const cases = [...existing, ...inserted];
  const storage = new FileSystemStorage({ rootDir: root });
  for (const tc of cases) {
    const check = caseEligibility(service, tc, scope, policy);
    if (!check.allowed) continue;
    const file = `TC-${tc.case_id}`;
    const previous = await storage.getTestCase(module, file).catch(() => null);
    if (previous) {
      if (!caseEligibility(service, tc, scope, policy, previous).allowed)
        excluded.push({ case_id: tc.case_id, title: tc.title, status: 'case_content_mismatch', reason: 'Se conserva el archivo alterado.' });
      continue;
    }
    if (await storage.exists(`.qa/modules/${module}/tests/${file}.yaml`)) continue;
    await storage.saveTestCase(module, check.canonical, file);
  }
  return { status: 'materialized', discovery_revision_id: revision.revision_id, cases: cases.map(status), excluded,
    siguiente_accion: { tipo: 'trabajo', tool: 'qap_plan', parametros: { targetPath: root, module, environment: scope.environment_name,
      ...(requested.profile ? { profile: requested.profile } : {}) }, descripcion: 'Construye el plan con los casos elegibles.' } };
}
