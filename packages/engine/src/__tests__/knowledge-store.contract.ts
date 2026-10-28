import { beforeEach, expect, it } from 'vitest';

import {
  type IKnowledgeStore, type KnowledgeWrite, type KnowledgeEntities,
  type KnowledgeKind, type KnowledgeTrace, KnowledgeStoreError,
} from '../knowledge-store.port.js';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const timestamp = '2026-10-28T12:00:00.000Z';
const trace: KnowledgeTrace = { source: 'contract_test', recorded_by: 'tester',
  recorded_at: timestamp, reason: 'Initial discovery', review: 'unreviewed', evidence_refs: [] };
const application = (app = 'a'): KnowledgeEntities['application'] => ({ application_id: app,
  name: app, base_url: 'https://example.test', created_at: timestamp });
const evidence: KnowledgeEntities['evidence'] = { id: 'e1', kind: 'dom_snippet',
  pii_masked: true, captured_at: timestamp, uri: 'evidence://e1' };
const observation: KnowledgeEntities['observation'] = { id: 'o1', application_id: 'a',
  environment_id: 'dev', kind: 'probe_result', observed_by: 'active_probe', observed_at: timestamp,
  evidence, probe_execution: { action: 'inspect', observed_output: 'required', reproducible: true, trials_count: 3 } };
const moduleEntity: KnowledgeEntities['module'] = { id: 'm1', application_id: 'a', key: 'billing',
  title: 'Billing', certainty: 'observed', criticality: 'high', dependencies: [],
  created_at: timestamp, updated_at: timestamp, is_active: true };
const requirement: KnowledgeEntities['requirement'] = { id: 'r1', application_id: 'a',
  module_key: 'billing', title: 'Business rule', description: 'A signed invoice is required',
  category: 'business_rule', validation_status: 'draft', provenance: 'developer_input',
  created_at: timestamp, confidence: 0.8, is_active: true };
const inference: KnowledgeEntities['inference'] = { id: 'i1', application_id: 'a',
  target_type: 'rule_hypothesis', hypothesis: 'Invoice required', confidence_score: 0.8,
  reasoning: 'Observed validation', status: 'inferred', supporting_observation_ids: ['o1'],
  created_at: timestamp, updated_at: timestamp, requires_human_confirmation: true };
function write<K extends KnowledgeKind>(kind: K, entity: KnowledgeEntities[K], expected_revision = 0): KnowledgeWrite {
  return { kind, entity, expected_revision, trace: clone(trace) } as KnowledgeWrite;
}

/** Reuse this suite with each future adapter factory, initialized on a fresh isolated DB.
 * Each invocation owns its lifecycle and runs the same expectations.
 */
export function knowledgeStoreContract(factory: () => Promise<IKnowledgeStore>): void {
  let store: IKnowledgeStore;
  beforeEach(async () => {
    store = await factory();
    await store.commit('a', [write('application', application()), write('environment', {
      environment_id: 'dev', application_id: 'a', name: 'dev', base_url: 'https://example.test',
      is_production: false, destructive_actions_allowed: false, safe_domains: ['example.test'],
    }), write('evidence', evidence), write('module', moduleEntity)]);
  });

  it('exports the versioned Engine port and typed errors', () => {
    expect(store.contract_version).toBe(1);
    expect(new KnowledgeStoreError('CONFLICT', 'Conflict')).toBeInstanceOf(Error);
  });
  it('registers and retrieves a reproducible observation with evidence and provenance', async () => {
    await store.commit('a', [write('observation', observation)]);
    expect(await store.get('a', 'observation', 'o1')).toMatchObject({ revision: 1, entity: observation, trace });
    expect((await store.query('a', 'observation', { references: { kind: 'evidence', id: 'e1' } })).items).toHaveLength(1);
  });
  it('retrieves inferences linked to observations without promoting them', async () => {
    await store.commit('a', [write('inference', inference), write('observation', observation)]);
    const page = await store.query('a', 'inference', { references: { kind: 'observation', id: 'o1' } });
    expect(page.items[0].entity.status).toBe('inferred');
    expect(await store.get('a', 'requirement', 'i1')).toBeNull();
  });
  it('queries expected requirements independently of observed behavior', async () => {
    await store.commit('a', [write('observation', observation), write('requirement', requirement)]);
    expect((await store.query('a', 'requirement')).items.map(r => r.entity)).toEqual([requirement]);
    expect((await store.get('a', 'requirement', 'r1'))?.entity.validation_status).toBe('draft');
  });
  it('rejects empirical confirmation even when envelope review says reviewed', async () => {
    const invalid = write('requirement', { ...requirement, validation_status: 'confirmed',
      provenance: 'observed_telemetry', verified_by: 'active_probe' });
    invalid.trace.review = 'reviewed';
    await expect(store.commit('a', [invalid])).rejects.toMatchObject({ code: 'INVALID_DATA' });
    expect(await store.get('a', 'requirement', 'r1')).toBeNull();
  });
  it('isolates same IDs in separate applications for reads, queries and history', async () => {
    await store.commit('b', [write('application', application('b')),
      write('module', { ...moduleEntity, application_id: 'b', title: 'Private B' })]);
    expect((await store.get('a', 'module', 'm1'))?.entity.title).toBe('Billing');
    expect((await store.get('b', 'module', 'm1'))?.entity.title).toBe('Private B');
    expect((await store.query('missing', 'module')).items).toEqual([]);
    expect((await store.history('missing', 'module', 'm1')).items).toEqual([]);
  });
  it('rejects cross-application entity writes and references', async () => {
    await expect(store.commit('b', [write('observation', observation)])).rejects.toMatchObject({ code: 'INVALID_DATA' });
    await store.commit('b', [write('application', application('b'))]);
    await expect(store.commit('b', [write('inference', { ...inference, application_id: 'b' })]))
      .rejects.toMatchObject({ code: 'REFERENCE_NOT_FOUND' });
  });
  it('retrieves explicit relations and pinned references', async () => {
    await store.commit('a', [write('observation', observation), write('requirement', requirement),
      write('relation', { id: 'link', source: { kind: 'observation', id: 'o1', revision: 1 },
        target: { kind: 'requirement', id: 'r1', revision: 1 }, predicate: 'related_to' })]);
    expect((await store.query('a', 'relation', { references: { kind: 'observation', id: 'o1', revision: 1 } })).items).toHaveLength(1);
    expect((await store.query('a', 'relation', { references: { kind: 'observation', id: 'o1', revision: 2 } })).items).toHaveLength(0);
  });
  it('records conformity without changing a requirement or observation', async () => {
    await store.commit('a', [write('requirement', requirement), write('observation', observation),
      write('assessment', { id: 'c1', requirement_id: 'r1', observation_ids: ['o1'], verdict: 'indeterminate',
        indeterminacy_reason: 'No signed fixture', assessed_at: timestamp, assessed_by: 'tester', evidence: [evidence] })]);
    expect((await store.query('a', 'assessment', { references: { kind: 'requirement', id: 'r1' } })).items).toHaveLength(1);
    expect((await store.get('a', 'requirement', 'r1'))?.revision).toBe(1);
    await store.commit('a', [write('requirement', { ...requirement, description: 'Changed expectation' }, 1)]);
    const assessment = await store.get('a', 'assessment', 'c1');
    expect(assessment?.references).toContainEqual({ kind: 'requirement', id: 'r1', revision: 1 });
    const ref = assessment!.references.find(r => r.kind === 'requirement')!;
    expect((await store.get('a', 'requirement', ref.id, ref.revision))?.entity.description).toBe(requirement.description);
    await expect(store.commit('a', [write('assessment', assessment!.entity, 1)]))
      .rejects.toMatchObject({ code: 'CONFLICT' });
  });
  it('rejects invalid confidence and indeterminate assessments missing a reason', async () => {
    await expect(store.commit('a', [write('inference', { ...inference, confidence_score: 1.1 })]))
      .rejects.toMatchObject({ code: 'INVALID_DATA' });
    await expect(store.commit('a', [write('assessment', { id: 'c1', requirement_id: 'r1', observation_ids: [],
      verdict: 'indeterminate', assessed_at: timestamp, assessed_by: 'tester', evidence: [] })]))
      .rejects.toMatchObject({ code: 'INVALID_DATA' });
  });
  it('rejects missing parents and rolls back an entire batch', async () => {
    await expect(store.commit('a', [write('requirement', requirement), write('inference', inference)]))
      .rejects.toMatchObject({ code: 'REFERENCE_NOT_FOUND' });
    expect(await store.get('a', 'requirement', 'r1')).toBeNull();
  });
  it('preserves historical revisions and provenance through updates', async () => {
    await store.commit('a', [write('requirement', requirement)]);
    const update = write('requirement', { ...requirement, validation_status: 'contested' }, 1);
    update.trace.reason = 'Contradictory new evidence'; update.trace.review = 'pending_review';
    await store.commit('a', [update]);
    expect((await store.get('a', 'requirement', 'r1', 1))?.entity.validation_status).toBe('draft');
    expect((await store.get('a', 'requirement', 'r1'))?.trace.reason).toBe(update.trace.reason);
    expect((await store.history('a', 'requirement', 'r1')).items.map(r => r.revision)).toEqual([1, 2]);
  });
  it('allows one concurrent CAS writer and rejects stale/create conflicts', async () => {
    const attempts = await Promise.allSettled([1, 2].map(n => store.commit('a', [
      write('module', { ...moduleEntity, title: `Writer ${n}` }, 1),
    ])));
    expect(attempts.filter(r => r.status === 'fulfilled')).toHaveLength(1);
    expect(attempts.filter(r => r.status === 'rejected')).toMatchObject([{ reason: { code: 'CONFLICT' } }]);
    await expect(store.commit('a', [write('module', moduleEntity)])).rejects.toMatchObject({ code: 'CONFLICT' });
    expect((await store.history('a', 'module', 'm1')).items).toHaveLength(2);
  });
  it('prevents overwriting observations and assessments', async () => {
    await store.commit('a', [write('observation', observation)]);
    await expect(store.commit('a', [write('observation', { ...observation, selector: 'changed' }, 1)]))
      .rejects.toMatchObject({ code: 'CONFLICT' });
  });
  it('requires local successors when retiring historical entities', async () => {
    await store.commit('a', [write('requirement', requirement)]);
    await expect(store.commit('a', [write('requirement', { ...requirement, is_active: false, superseded_by: 'r2' }, 1)]))
      .rejects.toMatchObject({ code: 'REFERENCE_NOT_FOUND' });
    await store.commit('a', [write('requirement', { ...requirement, id: 'r2' }),
      write('requirement', { ...requirement, is_active: false, superseded_by: 'r2' }, 1)]);
    expect((await store.get('a', 'requirement', 'r1', 1))?.entity.is_active).toBe(true);
  });
  it('rejects nested credential/header material and preserves external profile pointers', async () => {
    for (const payload of [{ nested: { password: 'secret' } }, { network_event: { request_headers: { Authorization: 'Bearer secret' } } }]) {
      await expect(store.commit('a', [write('observation', { ...observation, raw_payload: payload })]))
        .rejects.toMatchObject({ code: 'INVALID_DATA' });
    }
    const safe = write('observation', { ...observation, session_id: 'session-ref' });
    safe.trace.auth_profile_id = 'vault-profile-ref';
    await store.commit('a', [safe]);
    expect((await store.get('a', 'observation', 'o1'))?.trace.auth_profile_id).toBe('vault-profile-ref');
    expect((await store.history('a', 'observation', 'o1')).items).toHaveLength(1);
  });
  it('rejects unmasked evidence and non-JSON values', async () => {
    await expect(store.commit('a', [write('evidence', { ...evidence, id: 'e2', pii_masked: false })]))
      .rejects.toMatchObject({ code: 'INVALID_DATA' });
    await expect(store.commit('a', [write('observation', { ...observation, raw_payload: { invalid: NaN } })]))
      .rejects.toMatchObject({ code: 'INVALID_DATA' });
  });
  it('returns detached values and does not retain mutable inputs', async () => {
    const request = write('observation', clone(observation));
    const result = await store.commit('a', [request]);
    request.trace.reason = 'mutated input'; result[0].trace.reason = 'mutated result';
    const record = await store.get('a', 'observation', 'o1');
    record!.trace.reason = 'mutated read';
    expect((await store.get('a', 'observation', 'o1'))?.trace.reason).toBe(trace.reason);
  });
  it('paginates queries/history and rejects cross-query, stale and malformed cursors', async () => {
    await store.commit('a', [write('module', { ...moduleEntity, id: 'm2', key: 'second' })]);
    const first = await store.query('a', 'module', { limit: 1 });
    expect(first.items[0].id).toBe('m1'); expect(first.next_cursor).toBeDefined();
    expect((await store.query('a', 'module', { limit: 1, cursor: first.next_cursor })).items[0].id).toBe('m2');
    await expect(store.query('b', 'module', { cursor: first.next_cursor })).rejects.toMatchObject({ code: 'INVALID_CURSOR' });
    await expect(store.query('a', 'view', { cursor: first.next_cursor })).rejects.toMatchObject({ code: 'INVALID_CURSOR' });
    await expect(store.query('a', 'module', { cursor: 'bad' })).rejects.toMatchObject({ code: 'INVALID_CURSOR' });
    await store.commit('a', [write('module', { ...moduleEntity, title: 'Updated' }, 1)]);
    await expect(store.query('a', 'module', { cursor: first.next_cursor })).rejects.toMatchObject({ code: 'INVALID_CURSOR' });
    const history = await store.history('a', 'module', 'm1', { limit: 1 });
    expect((await store.history('a', 'module', 'm1', { cursor: history.next_cursor })).items[0].revision).toBe(2);
    await expect(store.query('a', 'module', { limit: 0 })).rejects.toMatchObject({ code: 'INVALID_DATA' });
  });
  it('rejects duplicate writes and cyclic module or explicit dependencies atomically', async () => {
    await expect(store.commit('a', [write('requirement', requirement), write('requirement', requirement)]))
      .rejects.toMatchObject({ code: 'INVALID_DATA' });
    await expect(store.commit('a', [write('module', { ...moduleEntity, dependencies: ['second'] }, 1),
      write('module', { ...moduleEntity, id: 'm2', key: 'second', dependencies: ['billing'] })]))
      .rejects.toMatchObject({ code: 'INVALID_DATA' });
    await expect(store.commit('a', [write('relation', { id: 'loop', source: { kind: 'module', id: 'm1' },
      target: { kind: 'module', id: 'm1' }, predicate: 'depends_on' })]))
      .rejects.toMatchObject({ code: 'INVALID_DATA' });
    expect((await store.get('a', 'module', 'm1'))?.revision).toBe(1);
  });
  it('stores roles, views, interaction targets and flows with canonical links', async () => {
    const flow: KnowledgeEntities['flow'] = { id: 'f1', application_id: 'a', module_id: 'm1',
      title: 'Invoice', required_role_id: 'admin', cleanup_policy: { cleanup_mode: 'fresh_context',
        clear_cookies: true, clear_local_storage: true, clear_session_storage: true,
        clear_browser_cache: true, isolate_network: true, preserve_qap_knowledge: true },
      prerequisites: [], steps: [{ step_number: 1, action_kind: 'click', action_target_id: 'button' }],
      risk_level: 'high', recommended_test_types: ['business_rule'], created_at: timestamp,
      updated_at: timestamp, is_active: true };
    await store.commit('a', [write('flow', flow), write('role', { role_id: 'admin', application_id: 'a',
      role_name: 'Administrator', permissions: ['invoice:create'], is_authenticated: true, auth_profile_id: 'vault-ref' }),
    write('view', { id: 'v1', module_id: 'm1', application_id: 'a', route_pattern: '/invoices',
      certainty: 'observed', interactive_elements_count: 1, forms_count: 0, created_at: timestamp,
      updated_at: timestamp, is_active: true }),
    write('action_target', { id: 'button', view_id: 'v1', application_id: 'a', element_type: 'button',
      selector: '#invoice', confidence_score: 0.9, certainty: 'observed', created_at: timestamp,
      updated_at: timestamp, is_active: true })]);
    expect((await store.query('a', 'flow', { references: { kind: 'action_target', id: 'button' } })).items[0].entity).toEqual(flow);
    expect((await store.query('a', 'view', { references: { kind: 'module', id: 'm1' } })).items).toHaveLength(1);
    expect((await store.query('a', 'role')).items[0].entity.auth_profile_id).toBe('vault-ref');
    await expect(store.commit('a', [write('flow', { ...flow,
      prerequisites: [{ id: 'pre1', title: 'Self dependency', kind: 'preceding_flow', depends_on_flow_id: 'f1' }] }, 1)]))
      .rejects.toMatchObject({ code: 'INVALID_DATA' });
  });
  it('queries canonical module dependencies and rejects missing module keys', async () => {
    await store.commit('a', [write('module', { ...moduleEntity, id: 'm2', key: 'second', dependencies: ['billing'] })]);
    expect((await store.query('a', 'module', { references: { kind: 'module', id: 'm1' } })).items[0].id).toBe('m2');
    await expect(store.commit('a', [write('requirement', { ...requirement, module_key: 'absent' })]))
      .rejects.toMatchObject({ code: 'REFERENCE_NOT_FOUND' });
  });
  it('keeps legacy manual edits reviewable rather than infallible', async () => {
    await expect(store.commit('a', [write('requirement', { ...requirement, provenance: 'legacy_manual_edit',
      validation_status: 'confirmed', verified_by: 'migration', confidence: 1 })]))
      .rejects.toMatchObject({ code: 'INVALID_DATA' });
    await store.commit('a', [write('requirement', { ...requirement, provenance: 'legacy_manual_edit' })]);
    expect((await store.get('a', 'requirement', 'r1'))?.entity.validation_status).toBe('draft');
  });
  it('rejects cyclic payloads and invalid batch sizes without changing history', async () => {
    const cyclic: Record<string, unknown> = {}; cyclic.self = cyclic;
    await expect(store.commit('a', [write('observation', { ...observation, raw_payload: cyclic })]))
      .rejects.toMatchObject({ code: 'INVALID_DATA' });
    await expect(store.commit('a', [])).rejects.toMatchObject({ code: 'INVALID_DATA' });
    await expect(store.commit('a', Array.from({ length: 101 }, () => write('observation', observation))))
      .rejects.toMatchObject({ code: 'INVALID_DATA' });
    expect((await store.history('a', 'observation', 'o1')).items).toHaveLength(0);
  });
}
