import { randomUUID } from 'node:crypto';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { KnowledgeStoreError, type IKnowledgeStore, type KnowledgeWrite } from '@qap/engine';
import { validateAgentInference, type ApplicationObservation, type MultimodalEvidenceRef } from '@qap/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ObservedView, ObservedNetworkEvent, ObservedControl } from '../../playwright-adapter/dist/index.js';
import { calculateInferenceConfidence, KnowledgeInferenceEngine } from '../src/inference/knowledge-inference-engine.js';
import { SqliteKnowledgeAdapter } from '../src/storage/sqlite-knowledge-adapter.js';

const time = '2026-10-30T10:00:00.000Z';
const baseTrace = { source: 'synthetic', recorded_by: 'test', recorded_at: time, reason: 'Synthetic fixture', review: 'unreviewed' as const, evidence_refs: [] };
const dirs: string[] = []; const stores: SqliteKnowledgeAdapter[] = [];
afterEach(() => { vi.restoreAllMocks(); stores.splice(0).forEach(s => s.close()); dirs.splice(0).forEach(d => rmSync(d, { recursive: true, force: true })); });
async function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'qap-inference-')); dirs.push(dir);
  const path = join(dir, 'knowledge.sqlite');
  const store = new SqliteKnowledgeAdapter(path); stores.push(store);
  for (const app of ['a', 'b']) await store.commit(app, [
    { kind: 'application', entity: { application_id: app, name: 'Synthetic', base_url: 'https://fixture.invalid', created_at: time }, trace: baseTrace, expected_revision: 0 },
    { kind: 'environment', entity: { application_id: app, environment_id: 'test', name: 'test', base_url: 'https://fixture.invalid', safe_domains: ['fixture.invalid'], is_production: false, destructive_actions_allowed: false }, trace: baseTrace, expected_revision: 0 },
  ]);
  return { store, path, dir, engine: new KnowledgeInferenceEngine(store), input: { application_id: 'a', environment_id: 'test' } };
}
const ref = (n: number) => `urn:qap:route:${n.toString(16).padStart(64, '0')}`;
const networkRef = (n: number) => ref(n).replace(':route:', ':network:');
function view(session: string, n: number, targets: number[] = [], state: ObservedView['state'] = 'static_snapshot', id = randomUUID()) {
  const evidence: MultimodalEvidenceRef = { id: randomUUID(), kind: 'dom_snippet', pii_masked: true, captured_at: time, uri: 'urn:synthetic', session_id: session };
  const controls: ObservedControl[] = [{ index: 0, tag: 'input', visibility: 'visible', disabled: false, required_in_dom: true, selector_candidates: ['input:nth-of-type(1)'], selector_stability: 'unverified' }];
  const forms: ObservedView['forms'] = [{ index: 0, field_indices: [0], submit_indices: [], method: 'get' }];
  const captured: ObservedView = { id, route: ref(n), state, evidence_id: evidence.id, controls, forms,
    links: targets.map(t => ({ target: ref(t), control_index: 0, authorized: true })), menus: 0, headings: 0, truncated: false };
  evidence.metadata = { source: 'static_dom_structure', view: captured };
  const base = { application_id: 'a', environment_id: 'test', observed_by: 'crawler' as const, observed_at: time, session_id: session, evidence };
  const observations: ApplicationObservation[] = [
    { ...base, id: randomUUID(), kind: 'navigation_route', raw_payload: { route: ref(n), view_id: id, state } },
    { ...base, id: randomUUID(), kind: 'dom_element', raw_payload: { view_id: id, controls, forms, menus: 0, headings: 0, truncated: false } },
  ];
  return { evidence, observations };
}
function event(session: string, outcome: 'responded' | 'blocked' | 'inconclusive', status?: number, endpoint = 1, viewId = randomUUID()) {
  const evidence: MultimodalEvidenceRef = { id: randomUUID(), kind: 'http_recon_metadata', pii_masked: true, uri: 'urn:synthetic', captured_at: time, session_id: session };
  const payload: ObservedNetworkEvent = { id: randomUUID(), execution_id: session, view_id: viewId, request_type: status === 503 ? 'xhr' : 'fetch', method: 'GET', endpoint_ref: networkRef(endpoint),
    scope_status: outcome === 'blocked' ? 'denied' : 'authorized', outcome, browser_outcome: outcome === 'responded' ? 'finished' : outcome === 'blocked' ? 'blocked' : 'undetermined',
    ...(status ? { http_status: status } : {}), observed_at: time, duration_ms: 2, query_names: [], omitted_query_count: 0, evidence_id: evidence.id };
  evidence.metadata = { source: 'browser_network_gateway', event: payload,
    endpoint: { reference: networkRef(endpoint), method: 'GET', event_ids: [payload.id], view_ids: [viewId], states: [outcome], structural_pattern: '/api/items/:id' } };
  return { evidence, observations: [{ id: randomUUID(), application_id: 'a', environment_id: 'test', kind: 'network_traffic' as const, observed_by: 'crawler' as const,
    observed_at: time, session_id: session, evidence, raw_payload: payload }] };
}
async function persist(store: IKnowledgeStore, data: ReturnType<typeof view>, source = 'blackbox_crawler') {
  const trace = { ...baseTrace, source, recorded_by: source === 'http_reconnaissance' ? 'recon' : 'crawler', environment_id: 'test' };
  const writes: KnowledgeWrite[] = [{ kind: 'evidence', entity: data.evidence, expected_revision: 0, trace },
    ...data.observations.map(entity => ({ kind: 'observation' as const, entity, expected_revision: 0,
      trace: { ...trace, evidence_refs: [{ kind: 'evidence' as const, id: entity.evidence.id, revision: 1 }] } }))];
  await store.commit('a', writes);
}

describe('VNEXT-009 deterministic confidence', () => {
  it('is bounded, corroboration increases strength and contradictions reduce it', () => {
    const calc = (e: number, i = 1, c = 0) => calculateInferenceConfidence({ evidence_units: e, independent_sources: i, contradictions: c, event_quality: 1 });
    expect(calc(2).score).toBeGreaterThan(calc(1).score);
    expect(calc(2, 2).score).toBeGreaterThan(calc(2).score);
    expect(calc(2, 2, 1).score).toBeLessThan(calc(2, 2).score);
    expect(calc(1000, 1000).score).toBeLessThanOrEqual(0.72);
    expect(calc(0).score).toBe(0); expect(calc(NaN).score).toBe(0);
    expect(calc(1)).toEqual(calc(1)); expect(calc(1).age_policy).toBe('no_decay');
  });
});

describe('VNEXT-009 physical SQLite and persisted acquisition schemas', () => {
  it('generates canonical topology, controls, flow and a multi-signal module hypothesis with pinned history and isolation', async () => {
    const f = await fixture(); const session = randomUUID();
    for (const v of [view(session, 1, [2]), view(session, 2, [1, 3]), view(session, 3)]) await persist(f.store, v);
    const result = await f.engine.run(f.input);
    expect(result.status).toBe('completed');
    for (const category of ['view_topology', 'interactive_target', 'flow_hypothesis', 'module_boundary']) expect(result.hypotheses.some(h => h.inference.target_type === category)).toBe(true);
    for (const h of result.hypotheses) {
      expect(validateAgentInference(h.inference).valid).toBe(true); expect(h.inference.requires_human_confirmation).toBe(true);
      const record = (await f.store.get('a', 'inference', h.inference.id))!;
      for (const id of h.inference.supporting_observation_ids) {
        expect(record.references).toContainEqual({ kind: 'observation', id, revision: 1 });
        expect(await f.store.get('a', 'observation', id, 1)).not.toBeNull();
      }
      expect(await f.store.get('b', 'inference', h.inference.id)).toBeNull();
    }
    f.store.close(); const reopened = new SqliteKnowledgeAdapter(f.path); stores.push(reopened);
    expect((await reopened.query('a', 'inference')).items.length).toBe(result.hypotheses.length);
    expect((await reopened.query('a', 'requirement')).items).toHaveLength(0);
  });
  it('deduplicates reruns and recalculates comparable newly captured targets with CAS history', async () => {
    const f = await fixture(); const s = randomUUID(); const a = view(s, 1, [2]); await persist(f.store, a);
    const first = await f.engine.run(f.input); const h1 = first.hypotheses.find(h => h.inference.target_type === 'view_topology')!;
    const duplicate = await f.engine.run(f.input);
    expect(duplicate.hypotheses.every(h => h.change === 'unchanged')).toBe(true);
    await persist(f.store, view(s, 2));
    const next = await f.engine.run(f.input); const h2 = next.hypotheses.find(h => h.inference.id === h1.inference.id)!;
    expect(h2.change).toBe('recalculated'); expect(h2.revision).toBe(2); expect(h2.evidence_added).toBe(1);
    expect(h2.inference.confidence_score).toBeGreaterThan(h1.inference.confidence_score);
    expect((await f.store.history('a', 'inference', h1.inference.id)).items.map(r => r.revision)).toEqual([1, 2]);
    expect((await f.store.get('a', 'inference', h1.inference.id, 1))?.entity).toEqual(h1.inference);
  });
  it('does not inflate confidence for repeated requests in one window and keeps opaque runs separate', async () => {
    const f = await fixture(); const s = randomUUID(); const v = randomUUID();
    await persist(f.store, event(s, 'responded', 503, 1, v), 'network_traffic_observer');
    const first = await f.engine.run(f.input);
    await persist(f.store, event(s, 'responded', 503, 1, v), 'network_traffic_observer');
    const second = await f.engine.run(f.input);
    expect(second.hypotheses.map(h => h.inference.confidence_score)).toEqual(first.hypotheses.map(h => h.inference.confidence_score));
    await persist(f.store, event(randomUUID(), 'responded', 503, 1, v), 'network_traffic_observer');
    const next = await f.engine.run(f.input);
    expect(next.hypotheses.filter(h => h.inference.hypothesis.includes('503'))).toHaveLength(2);
    expect(next.decisions.some(d => d.code === 'uncorrelatable_identity')).toBe(true);
  });
  it('abstains from contradictory comparable DOM control attributes without treating absence as refutation', async () => {
    const f = await fixture(); const s = randomUUID(); const id = randomUUID(); const a = view(s, 1, [], 'static_snapshot', id); const b = view(s, 1, [], 'static_snapshot', id);
    (b.observations[1].raw_payload as any).controls[0].required_in_dom = false;
    await persist(f.store, a); await persist(f.store, b);
    const r = await f.engine.run(f.input);
    expect(r.decisions.some(d => d.code === 'contradictory_evidence')).toBe(true);
    expect(r.hypotheses.filter(h => h.inference.target_type === 'interactive_target')).toHaveLength(0);
    expect((await f.store.query('a', 'inference')).items).toHaveLength(0);
  });
  it('respects partial coverage, script dependencies and unauthorized links', async () => {
    const f = await fixture(); const a = view(randomUUID(), 1, [2], 'loading_or_script_dependent');
    (a.evidence.metadata as any).view.links[0].authorized = false;
    await persist(f.store, a); const r = await f.engine.run(f.input);
    expect(r.hypotheses.some(h => h.inference.hypothesis.includes('outside acquisition authorization'))).toBe(true);
    expect(r.hypotheses.some(h => h.inference.hypothesis.includes('JavaScript'))).toBe(true);
    expect(r.hypotheses.some(h => ['flow_hypothesis', 'rule_hypothesis', 'module_boundary'].includes(h.inference.target_type))).toBe(false);
    expect(r.hypotheses.every(h => h.factors.coverage === 'partial')).toBe(true);
  });
  it('distinguishes Fetch 200, XHR 503, gateway blocks, inconclusive requests and safe endpoint patterns', async () => {
    const f = await fixture(); const s = randomUUID();
    for (const e of [event(s, 'responded', 200), event(s, 'responded', 503), event(s, 'blocked'), event(s, 'inconclusive')]) await persist(f.store, e, 'network_traffic_observer');
    const r = await f.engine.run(f.input); const text = JSON.stringify(r);
    expect(text).toContain('cause is unknown'); expect(text).toContain('server rejection is not established'); expect(text).toContain('partial coverage');
    expect(text).not.toContain('/api/items'); expect(r.hypotheses.every(h => h.inference.target_type === 'risk_assessment')).toBe(true);
    expect(r.decisions.some(d => d.code === 'insufficient_evidence')).toBe(true);
  });
  it('consumes the reconnaissance schema without promoting technology signals', async () => {
    const f = await fixture(); const e = event(randomUUID(), 'responded', 503);
    e.evidence.metadata = { source: 'bounded_http_get', resource: { resource: 'target', state: 'unavailable', http: { status: 503 }, signals: [{ id: 'react' }] } };
    e.observations[0].observed_by = 'recon' as any;
    (e.observations[0] as ApplicationObservation).raw_payload = { resource: (e.evidence.metadata as any).resource };
    await persist(f.store, e, 'http_reconnaissance'); const r = await f.engine.run(f.input);
    expect(r.hypotheses).toHaveLength(1); expect(r.hypotheses[0].inference.hypothesis).toContain('reconnaissance');
  });
  it('never consumes unpersisted input, mismatched provenance or another environment', async () => {
    const f = await fixture(); const missing = await f.engine.run({ ...f.input, observation_ids: [randomUUID()] });
    expect(missing.hypotheses).toHaveLength(0); expect(missing.decisions).toContainEqual({ code: 'source_not_persisted', count: 1 });
    const a = view(randomUUID(), 1); await persist(f.store, a, 'hostile-source');
    expect((await f.engine.run(f.input)).decisions.some(d => d.code === 'unsupported_source')).toBe(true);
    expect((await f.engine.run({ ...f.input, environment_id: 'missing' })).status).toBe('rejected');
  });
  it('rejects invalid historical evidence references supplied by a broken port', async () => {
    const f = await fixture(); await persist(f.store, view(randomUUID(), 1));
    const get = f.store.get.bind(f.store);
    vi.spyOn(f.store, 'get').mockImplementation((app, kind, id, rev) => kind === 'evidence' ? Promise.resolve(null) : get(app, kind, id, rev));
    const r = await f.engine.run(f.input); expect(r.hypotheses).toHaveLength(0); expect(r.decisions.some(d => d.code === 'invalid_reference')).toBe(true);
  });
  it('rejects an invalidated page without committing a mixed snapshot', async () => {
    const f = await fixture(); const s = randomUUID();
    for (let i = 0; i < 51; i++) await persist(f.store, view(s, i));
    const query = f.store.query.bind(f.store); let calls = 0;
    vi.spyOn(f.store, 'query').mockImplementation(async (app, kind, q) => {
      if (++calls === 2) throw new KnowledgeStoreError('INVALID_CURSOR', 'unsafe-canary');
      return query(app, kind, q);
    });
    const r = await f.engine.run(f.input); expect(r.status).toBe('rejected'); expect(r.decisions.some(d => d.code === 'invalid_cursor')).toBe(true);
    expect((await query('a', 'inference')).items).toHaveLength(0); expect(JSON.stringify(r)).not.toContain('unsafe-canary');
  });
  it('enforces observation, candidate and complexity limits', async () => {
    const f = await fixture(); await persist(f.store, view(randomUUID(), 1, [2, 3, 4]));
    const r = await f.engine.run({ ...f.input, limits: { observations: 1 } });
    expect(r.hypotheses).toHaveLength(0); expect(r.decisions.some(d => d.code === 'processing_limit')).toBe(true);
    const small = await f.engine.run({ ...f.input, limits: { candidates: 1 } }); expect(small.hypotheses.length).toBeLessThanOrEqual(1);
    expect(small.decisions.some(d => d.code === 'processing_limit')).toBe(true);
    expect((await f.engine.run({ ...f.input, limits: { candidates: 1000 } })).status).toBe('rejected');
  });
  it('rolls back the entire inference batch on SQLite failure and leaves no orphan links', async () => {
    const f = await fixture(); await persist(f.store, view(randomUUID(), 1, [2]));
    const db = new DatabaseSync(f.path);
    db.exec("CREATE TRIGGER reject_inference BEFORE INSERT ON knowledge_revisions WHEN NEW.kind = 'inference' BEGIN SELECT RAISE(ABORT, 'synthetic'); END"); db.close();
    const r = await f.engine.run(f.input); expect(r.status).toBe('rejected'); expect(r.hypotheses).toHaveLength(0);
    expect((await f.store.query('a', 'inference')).items).toHaveLength(0);
    const inspect = new DatabaseSync(f.path);
    expect(inspect.prepare('PRAGMA foreign_key_check').all()).toHaveLength(0); inspect.close();
  });
  it('does not overwrite concurrent creation from a second physical SQLite connection', async () => {
    const f = await fixture(); await persist(f.store, view(randomUUID(), 1));
    const second = new SqliteKnowledgeAdapter(f.path); stores.push(second);
    const commit = f.store.commit.bind(f.store);
    vi.spyOn(f.store, 'commit').mockImplementation(async (app, writes) => { await second.commit(app, writes); return commit(app, writes); });
    const r = await f.engine.run(f.input); expect(r.status).toBe('rejected'); expect(r.decisions.some(d => d.code === 'conflict')).toBe(true);
    const records = (await second.query('a', 'inference')).items; expect(records).toHaveLength(1); expect(records[0].revision).toBe(1);
  });
  it('rejects context changes before commit', async () => {
    const f = await fixture(); await persist(f.store, view(randomUUID(), 1)); const get = f.store.get.bind(f.store); let calls = 0;
    vi.spyOn(f.store, 'get').mockImplementation(async (app, kind, id, rev) => {
      if (kind === 'application' && ++calls === 2) {
        const a = (await get(app, kind, id))!; await f.store.commit(app, [{ kind: 'application', entity: a.entity, expected_revision: a.revision, trace: baseTrace }]);
      }
      return get(app, kind, id, rev);
    });
    const r = await f.engine.run(f.input); expect(r.status).toBe('rejected'); expect(r.decisions.some(d => d.code === 'incompatible_context')).toBe(true);
    expect((await f.store.query('a', 'inference')).items).toHaveLength(0);
  });
  it('never copies hostile payloads into inference results or output SQLite/WAL/SHM or logs', async () => {
    const f = await fixture(); const canary = 'PRIVATE_CANARY_INFERENCE_9b20'; const a = view(randomUUID(), 1);
    // Unsafe upstream persisted facts already contain the canary. Output is checked in a separate physical store
    // with the same canonical context/observation/evidence IDs, but without arbitrary upstream fields.
    (a.observations[1] as any).dom_snapshot = { tag: 'input', attributes: { placeholder: canary }, inner_text: canary, is_visible: true };
    (a.observations[1].raw_payload as any).hostile_reasoning = canary;
    a.observations[1].network_event = { url: `https://private.invalid/${canary}`, method: 'GET', status: 200, response_snippet: canary };
    (a.evidence.metadata as any).hostile = canary;
    await persist(f.store, a);
    const log = vi.spyOn(console, 'log').mockImplementation(() => {}); const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const outDir = mkdtempSync(join(tmpdir(), 'qap-inference-output-')); dirs.push(outDir);
    const out = new SqliteKnowledgeAdapter(join(outDir, 'output.sqlite')); stores.push(out);
    const originalCommit = out.commit.bind(out);
    for (const kind of ['application', 'environment', 'evidence', 'observation'] as const) {
      const records = (await f.store.query('a', kind)).items;
      for (const record of records) {
        const clean = JSON.parse(JSON.stringify(record).replaceAll(canary, 'redacted'));
        await originalCommit('a', [{ kind, entity: clean.entity, trace: clean.trace, expected_revision: 0 }]);
      }
    }
    // Read hostile originals, commit the actual engine writes unchanged to physical output SQLite.
    const outputPort: IKnowledgeStore = { contract_version: 1, get: f.store.get.bind(f.store), query: f.store.query.bind(f.store),
      history: f.store.history.bind(f.store), commit: out.commit.bind(out) };
    const r = await new KnowledgeInferenceEngine(outputPort).run(f.input);
    expect(r.status).toBe('completed'); expect(r.hypotheses.length).toBeGreaterThan(0);
    expect(JSON.stringify(r)).not.toContain(canary);
    expect(JSON.stringify([log.mock.calls, error.mock.calls])).not.toContain(canary);
    expect((await out.query('a', 'inference')).items).toHaveLength(r.hypotheses.length);
    for (const record of (await out.query('a', 'inference')).items) expect(JSON.stringify(record)).not.toContain(canary);
    for (const name of readdirSync(outDir)) if (/sqlite|wal|shm/.test(name)) expect(readFileSync(join(outDir, name)).includes(Buffer.from(canary))).toBe(false);
    expect((await f.store.query('a', 'requirement')).items).toHaveLength(0);
  });
  it('preserves historical evidence revisions after evidence metadata evolves', async () => {
    const f = await fixture(); const a = view(randomUUID(), 1); await persist(f.store, a);
    const initial = await f.engine.run(f.input); expect(initial.status).toBe('completed');
    const e = (await f.store.get('a', 'evidence', a.evidence.id))!;
    await f.store.commit('a', [{ kind: 'evidence', entity: { ...e.entity, metadata: { source: 'replacement' } }, expected_revision: 1, trace: e.trace }]);
    const r = await f.engine.run(f.input); expect(r.status).toBe('completed'); expect(r.hypotheses[0].change).toBe('unchanged');
    const inference = (await f.store.get('a', 'inference', r.hypotheses[0].inference.id))!;
    expect(inference.trace.evidence_refs).toContainEqual({ kind: 'evidence', id: a.evidence.id, revision: 1 });
    expect((await f.store.get('a', 'evidence', a.evidence.id))?.revision).toBe(2);
  });
  it('does not shrink existing support when processing a partial selection', async () => {
    const f = await fixture(); const s = randomUUID(); const a = view(s, 1, [2]); const b = view(s, 2);
    await persist(f.store, a); await persist(f.store, b); const first = await f.engine.run(f.input);
    const link = first.hypotheses.find(h => h.inference.target_type === 'view_topology')!;
    const r = await f.engine.run({ ...f.input, observation_ids: a.observations.map(o => o.id) });
    expect(r.decisions.some(d => d.code === 'insufficient_coverage')).toBe(true);
    expect((await f.store.get('a', 'inference', link.inference.id))?.revision).toBe(1);
  });
  it('abstains cleanly for an empty store and skips excessive hostile nesting', async () => {
    const f = await fixture(); expect((await f.engine.run(f.input)).status).toBe('abstained');
    const a = view(randomUUID(), 1); let deep: unknown = 'synthetic';
    for (let i = 0; i < 20; i++) deep = { nested: deep };
    a.observations.forEach(o => { (o.raw_payload as any).extra = deep; }); await persist(f.store, a);
    const r = await f.engine.run(f.input); expect(r.hypotheses).toHaveLength(0);
    expect(r.decisions.some(d => d.code === 'processing_limit')).toBe(true);
  });
  it('rejects mixed blocked/HTTP-response events instead of assigning remote semantics', async () => {
    const f = await fixture(); const e = event(randomUUID(), 'blocked', 503);
    await persist(f.store, e, 'network_traffic_observer'); const r = await f.engine.run(f.input);
    expect(r.hypotheses).toHaveLength(0); expect(r.decisions.some(d => d.code === 'invalid_reference')).toBe(true);
  });
});
