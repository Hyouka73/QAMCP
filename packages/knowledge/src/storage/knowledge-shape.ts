import Ajv from 'ajv';

// Runtime boundary complements (does not replace) shared epistemic validators.
const text = { type: 'string', minLength: 1, pattern: '\\S' };
const bool = { type: 'boolean' };
const number = { type: 'number' };
const integer = { type: 'integer', minimum: 0 };
const strings = { type: 'array', items: text };
const one = (...values: string[]) => ({ enum: values });
const object = (properties: Record<string, unknown>, required = Object.keys(properties), extra = false) =>
  ({ type: 'object', properties, required, additionalProperties: extra });
const array = (items: unknown) => ({ type: 'array', items });
export const knowledgeKinds = ['application', 'environment', 'role', 'observation', 'inference',
  'requirement', 'assessment', 'module', 'view', 'action_target', 'flow', 'evidence', 'relation'] as const;
const ref = object({ kind: one(...knowledgeKinds), id: text, revision: { type: 'integer', minimum: 1 } }, ['kind', 'id']);
const evidence = object({ id: text, kind: one('screenshot', 'network_har', 'http_recon_metadata', 'dom_snippet', 'console_log'),
  pii_masked: { const: true }, captured_at: text, storage_path: text, uri: text, session_id: text,
  metadata: { type: 'object' } }, ['id', 'kind', 'pii_masked', 'captured_at']);
const certainty = one('observed', 'inferred', 'confirmed', 'pending_review');
const risk = one('low', 'medium', 'high', 'critical');
const category = one('functional', 'business_rule', 'security', 'ui', 'ux', 'regression', 'performance');
const status = one('draft', 'confirmed', 'contested', 'archived', 'pending_specification', 'deprecated', 'waived');
const source = one('developer_interview', 'authoritative_doc', 'formal_specification', 'legacy_manual_edit', 'developer_input', 'observed_telemetry');
const base = { id: text, application_id: text, created_at: text, updated_at: text, is_active: bool, superseded_by: text };
const verification = object({ mechanism: one('oracle', 'formal_test', 'developer_signoff', 'human_review', 'specification_assertion'),
  verified_at: text, evidence_ref: text, statement: text }, ['mechanism', 'verified_at']);
const cleanup = object({ cleanup_mode: one('clear_cache_only', 'fresh_context', 'retain_session', 'isolated_storage'),
  clear_cookies: bool, clear_local_storage: bool, clear_session_storage: bool, clear_browser_cache: bool,
  isolate_network: bool, preserve_qap_knowledge: { const: true } });
const entities: Record<string, unknown> = {
  application: object({ application_id: text, name: text, base_url: text, created_at: text, subsystems: strings, metadata: { type: 'object' } },
    ['application_id', 'name', 'base_url', 'created_at']),
  environment: object({ environment_id: text, application_id: text, name: text, base_url: text, is_production: bool,
    destructive_actions_allowed: bool, safe_domains: strings, rate_limit_ms: integer,
    headers: { type: 'object', additionalProperties: { type: 'string' } } },
  ['environment_id', 'application_id', 'name', 'base_url', 'is_production', 'destructive_actions_allowed', 'safe_domains']),
  role: object({ role_id: text, application_id: text, role_name: text, permissions: strings, is_authenticated: bool,
    auth_profile_id: text, description: text }, ['role_id', 'application_id', 'role_name', 'permissions', 'is_authenticated']),
  evidence,
  observation: object({ id: text, application_id: text, environment_id: text,
    kind: one('dom_element', 'network_traffic', 'console_log', 'navigation_route', 'probe_result', 'visual_capture'),
    observed_by: one('crawler', 'active_probe', 'recon', 'runner'), observed_at: text, evidence,
    raw_payload: {}, selector: text, session_id: text,
    dom_snapshot: object({ tag: text, attributes: { type: 'object', additionalProperties: { type: 'string' } }, inner_text: { type: 'string' }, is_visible: bool }, ['tag', 'attributes', 'is_visible']),
    network_event: object({ url: text, method: text, status: integer, request_headers: { type: 'object', additionalProperties: { type: 'string' } }, response_snippet: { type: 'string' }, duration_ms: number }, ['url', 'method', 'status']),
    probe_execution: object({ action: text, target_selector: text, payload: {}, observed_output: {}, reproducible: bool, trials_count: integer }, ['action', 'observed_output', 'reproducible', 'trials_count']),
  }, ['id', 'application_id', 'environment_id', 'kind', 'observed_by', 'observed_at', 'evidence']),
  inference: object({ ...base, target_type: one('module_boundary', 'view_topology', 'interactive_target', 'flow_hypothesis', 'rule_hypothesis', 'risk_assessment'),
    hypothesis: text, confidence: number, confidence_score: number, reasoning: text, status: one('inferred', 'pending_review', 'refuted'),
    supporting_observation_ids: strings, requires_human_confirmation: bool },
  ['id', 'application_id', 'created_at', 'updated_at', 'target_type', 'hypothesis', 'confidence_score', 'reasoning', 'status', 'supporting_observation_ids', 'requires_human_confirmation']),
  requirement: object({ ...base, module_key: text, title: text, description: { type: 'string' }, category,
    validation_status: one('draft', 'confirmed', 'contested', 'archived'), status, provenance: source, source, confidence: number, confidence_score: number,
    verified_by: text, verification_evidence: { anyOf: [verification, array(verification)] }, acceptance_criteria: strings },
  ['id', 'application_id', 'module_key', 'title', 'description', 'category', 'created_at', 'is_active']),
  assessment: object({ id: text, requirement_id: text, observation_ids: strings,
    verdict: one('pass', 'fail', 'indeterminate', 'contradiction'), indeterminacy_reason: text,
    contradiction_detail: object({ expected_behavior: text, observed_behavior: text }), assessed_at: text, assessed_by: text, evidence: array(evidence) },
  ['id', 'requirement_id', 'observation_ids', 'verdict', 'assessed_at', 'assessed_by', 'evidence']),
  module: object({ ...base, key: text, title: text, description: text, certainty, criticality: risk, dependencies: strings },
    ['id', 'application_id', 'key', 'title', 'certainty', 'criticality', 'dependencies', 'created_at', 'updated_at', 'is_active']),
  view: object({ ...base, module_id: text, route_pattern: text, title: text, certainty, interactive_elements_count: integer,
    forms_count: integer, semantic_hash: text }, ['id', 'application_id', 'module_id', 'route_pattern', 'certainty', 'interactive_elements_count', 'forms_count', 'created_at', 'updated_at', 'is_active']),
  action_target: object({ ...base, view_id: text, element_type: one('button', 'input', 'select', 'link', 'form', 'modal', 'table'), selector: text,
    fallback_selectors: strings, accessibility_label: text, is_required: bool, certainty, confidence: number, confidence_score: number },
  ['id', 'application_id', 'view_id', 'element_type', 'selector', 'certainty', 'confidence_score', 'created_at', 'updated_at', 'is_active']),
  flow: object({ ...base, module_id: text, title: text, description: text, required_role_id: text, cleanup_policy: cleanup,
    steps: array(object({ step_number: { type: 'integer', minimum: 1 }, action_kind: one('click', 'fill', 'select', 'assert_visible', 'assert_text', 'wait_for_response'),
      action_target_id: text, input_value_template: text, expected_outcome: text }, ['step_number', 'action_kind'])),
    prerequisites: array(object({ id: text, title: text, kind: one('auth_session', 'data_fixture', 'navigation_state', 'preceding_flow'),
      required_role_id: text, depends_on_flow_id: text, state_assertions: { type: 'object' }, teardown_required: bool }, ['id', 'title', 'kind'])),
    risk_level: risk, recommended_test_types: array(category) },
  ['id', 'application_id', 'module_id', 'title', 'cleanup_policy', 'steps', 'prerequisites', 'risk_level', 'recommended_test_types', 'created_at', 'updated_at', 'is_active']),
  relation: object({ id: text, source: ref, target: ref, predicate: one('depends_on', 'supports', 'contradicts', 'navigates_to', 'related_to') }),
};
const trace = object({ source: text, recorded_by: text, recorded_at: text, reason: text,
  review: one('unreviewed', 'reviewed', 'pending_review'), environment_id: text, role_id: text,
  auth_profile_id: text, evidence_refs: array(ref) }, ['source', 'recorded_by', 'recorded_at', 'reason', 'review', 'evidence_refs']);
const ajv = new Ajv({ strict: true });
export const validateWriteShape = ajv.compile({ oneOf: knowledgeKinds.map(kind => object({
  kind: { const: kind }, entity: entities[kind], expected_revision: integer, trace,
})) });
