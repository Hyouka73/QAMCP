import type { ServiceTestCaseRecord } from '@qap/shared';

import type { QapApplicationService } from './application-service.js';
import type { DiscoveryDossierCanonical } from './discovery-dossier.js';

export const inventoryVisibilityExpectation = 'El control observado debe estar visible al abrir la vista.';

/** Inventory revisions add this optional marker. Legacy module dossiers keep their existing semantics. */
export function isInitialInventory(dossier?: DiscoveryDossierCanonical): boolean {
  return Boolean(dossier && 'inventory' in dossier && dossier.inventory);
}

export function inspectedInitialView(dossier: DiscoveryDossierCanonical, pathname: string) {
  if (!isInitialInventory(dossier) || dossier.gaps.some(gap => gap.code === 'auth_required')) return;
  const route = dossier.routes.find(item => item.authorized_pathname === pathname && item.state === 'visited');
  if (!route?.view_id) return;
  return dossier.views.find(view => view.view_id === route.view_id && view.evidence_id &&
    view.state !== 'loading_or_script_dependent');
}

export function visibleInventoryControl(dossier: DiscoveryDossierCanonical, pathname: string, selector?: string) {
  const view = inspectedInitialView(dossier, pathname);
  const control = view?.controls.find(control => control.tag === 'button' && control.visibility === 'visible' &&
    !control.disabled && (selector ? control.selector_candidates.includes(selector) : control.selector_candidates.length > 0));
  return view && control ? { control, view } : undefined;
}

/** A structural smoke assertion requires the exact reviewed selector, acquisition evidence and read-only steps. */
export function hasReviewedInventoryVisibility(service: QapApplicationService, testCase: ServiceTestCaseRecord): boolean {
  if (testCase.expectation.expected_outcome !== inventoryVisibilityExpectation ||
      testCase.oracle_status !== 'confirmed_by_qa' || testCase.steps.length !== 3) return false;
  const [navigation, screenshot, assertion] = testCase.steps;
  if (navigation.type !== 'navigate' || typeof navigation.url !== 'string' || screenshot.type !== 'screenshot' ||
      assertion.type !== 'assert' || assertion.assertion_type !== 'visible' || typeof assertion.selector !== 'string' ||
      assertion.expected !== inventoryVisibilityExpectation) return false;

  const route = testCase.observation.route;
  const projectId = testCase.project_id;
  const moduleKey = testCase.module_key;
  const decision = service.listRuleConfirmationDecisions(projectId, { moduleKey }).find(record => record.decision === 'confirm' &&
    record.question_id === `oracle:${testCase.case_id}:v${testCase.version - 1}` &&
    record.route_pathname === route && record.expected_outcome === inventoryVisibilityExpectation);
  if (!decision?.discovery_revision_id) return false;
  const revision = service.getDiscoveryRevision(decision.discovery_revision_id);
  const environment = service.resumeProject(projectId, { readOnly: true }).environment;
  if (!revision || !environment || revision.project_id !== projectId || revision.environment_id !== environment.env_id ||
      new URL(route, environment.base_url).href !== navigation.url) return false;
  const observed = visibleInventoryControl(revision.dossier, route, assertion.selector);
  if (!observed || !decision.evidence_refs.includes(observed.view.evidence_id) ||
      !testCase.observation.evidence_refs.includes(observed.view.evidence_id)) return false;
  return service.listScopedBusinessRules(projectId, { moduleKey, sourceId: decision.requirement_id }).some(rule =>
    rule.rule_id === decision.rule_id && rule.source_digest === decision.request_digest &&
    rule.authority_status === 'accredited' && rule.assert_type === 'visible' && rule.assert_selector === assertion.selector);
}
