import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  KnowledgeStoreError, type ImpactModule, type ImpactRequest, type KnowledgeEntities,
  type KnowledgeWrite,
} from '@qap/engine';
import type { FlowScenario, PrerequisiteDefinition } from '@qap/shared';
import { describe, expect, it, vi } from 'vitest';

import { analyzeFlowImpact, readKnowledgeFlowImpact, type FlowImpactResult } from '../src/impact/flow-impact.js';
import { analyzeImpact } from '../src/impact/impact-analyzer.js';
import { SqliteKnowledgeAdapter } from '../src/storage/sqlite-knowledge-adapter.js';

const timestamp = '2026-11-09T12:00:00.000Z';
function module(id: string, dependencies: string[] = [], extra: Partial<ImpactModule> = {}): ImpactModule {
  return { id, key: `key-${id}`, application_id: 'app', title: id, dependencies,
    certainty: 'observed', criticality: 'medium', created_at: timestamp, updated_at: timestamp,
    is_active: true, ...extra };
}
function preceding(id: string): PrerequisiteDefinition {
  return { id: `pre-${id}`, title: id, kind: 'preceding_flow', depends_on_flow_id: id };
}
function flow(id: string, module_id = 'A', dependencies: string[] = [], extra: Partial<FlowScenario> = {}): FlowScenario {
  return { id, application_id: 'app', module_id, title: id, prerequisites: dependencies.map(preceding),
    steps: [], risk_level: 'medium', recommended_test_types: [], created_at: timestamp, updated_at: timestamp,
    cleanup_policy: { cleanup_mode: 'fresh_context', clear_cookies: true, clear_local_storage: true,
      clear_session_storage: true, clear_browser_cache: true, isolate_network: true, preserve_qap_knowledge: true },
    is_active: true, ...extra };
}
function request(ids = ['A'], max_depth?: number): ImpactRequest {
  return { contract_version: 1, application_id: 'app', changed_modules: ids.map(value => ({ kind: 'id', value })),
    ...(max_depth === undefined ? {} : { max_depth }) };
}
const summary = (result: FlowImpactResult) => result.affected_flows.map(f => [f.id, f.depth]);
function frozen<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(frozen);
    Object.freeze(value);
  }
  return value;
}
const modules = [module('A'), module('B'), module('C'), module('D')];
const chain = [flow('a'), flow('b', 'B', ['a']), flow('c', 'C', ['b']), flow('d', 'D')];

describe('VNEXT-015-04 canonical inverse flow impact', () => {
  it('maps module_id directly and preserves the module cause', () => {
    const result = analyzeFlowImpact(request(), modules, [flow('a'), flow('other', 'B')]);
    expect(summary(result)).toEqual([['a', 0]]);
    expect(result.affected_flows[0].paths).toEqual([{ source_flow_id: 'a', depth: 0, flow_ids: ['a'],
      module_path: { seed_id: 'A', depth: 0, module_ids: ['A'] } }]);
    expect(result.coherence).toBe('caller_supplied_not_verified');
  });

  it('propagates transitively across independent modules only in inverse direction', () => {
    expect(summary(analyzeFlowImpact(request(), modules, chain))).toEqual([['a', 0], ['b', 1], ['c', 2]]);
    expect(summary(analyzeFlowImpact(request(['B']), modules, chain))).toEqual([['b', 0], ['c', 1]]);
    expect(analyzeFlowImpact(request(), modules, chain).affected_flows[2].paths[0].flow_ids).toEqual(['a', 'b', 'c']);
  });

  it('reuses module inverse dependencies and ID/key resolution before flow traversal', () => {
    const inventory = [module('A'), module('B', ['key-A']), module('C')];
    const input = { ...request(), changed_modules: [{ kind: 'key' as const, value: 'key-A' }] };
    const result = analyzeFlowImpact(input, inventory, [flow('b', 'B'), flow('c', 'C', ['b'])]);
    expect(result.module_analysis).toEqual(analyzeImpact(input, inventory));
    expect(summary(result)).toEqual([['b', 0], ['c', 1]]);
    expect(result.affected_flows[1].paths[0].module_path.module_ids).toEqual(['A', 'B']);
  });

  it('deduplicates repeated formal edges and selects the ordinal shortest diamond path', () => {
    const flows = [flow('d', 'D', ['c', 'b', 'b']), flow('c', 'C', ['a']), flow('b', 'B', ['a']), flow('a')];
    const result = analyzeFlowImpact(request(), modules, flows);
    expect(summary(result)).toEqual([['a', 0], ['b', 1], ['c', 1], ['d', 2]]);
    expect(result.affected_flows[3].paths[0].flow_ids).toEqual(['a', 'b', 'd']);
  });

  it('retains every module seed cause and every direct source flow deterministically', () => {
    const inventory = [module('A'), module('B'), module('C', ['A', 'B']), module('D')];
    const result = analyzeFlowImpact(request(['B', 'A', 'A']), inventory,
      [flow('z', 'D', ['c2', 'c1']), flow('c2', 'C'), flow('c1', 'C')]);
    expect(result.affected_flows[2].paths.map(p => [p.source_flow_id, p.module_path.seed_id]))
      .toEqual([['c1', 'A'], ['c1', 'B'], ['c2', 'A'], ['c2', 'B']]);
  });

  it('does not infer edges from steps, names, roles, state assertions or non-flow prerequisites', () => {
    const other = flow('a-looking-name', 'B', [], {
      steps: [{ step_number: 1, action_target_id: 'a', action_kind: 'click' }],
      prerequisites: ['auth_session', 'data_fixture', 'navigation_state'].map(kind => ({
        id: kind, title: 'a', kind: kind as PrerequisiteDefinition['kind'], depends_on_flow_id: 'a',
        state_assertions: { flow_id: 'a' }, required_role_id: 'a',
      })),
    });
    expect(summary(analyzeFlowImpact(request(), modules, [flow('a'), other]))).toEqual([['a', 0]]);
  });

  it('rejects missing flow references, including unreachable ones', () => {
    const result = analyzeFlowImpact(request(), modules, [flow('a'), flow('b', 'B', ['absent'])]);
    expect(result.completeness).toBe('rejected');
    expect(result.affected_flows).toEqual([]);
    expect(result.diagnostics).toContainEqual({ code: 'MISSING_FLOW_REFERENCE', flow_id: 'b', reference: 'absent' });
  });

  it.each(['', 'key-A', 'missing'])('requires exact module IDs, rejects association %j', moduleId => {
    const result = analyzeFlowImpact(request(), modules, [flow('a', moduleId)]);
    expect(result.completeness).toBe('rejected');
    expect(result.affected_flows).toEqual([]);
  });

  it.each([undefined, '', ' '])('rejects preceding_flow without a valid reference (%s)', reference => {
    const invalid = flow('a', 'A', [], { prerequisites: [{ ...preceding('x'), depends_on_flow_id: reference }] });
    expect(analyzeFlowImpact(request(), modules, [invalid]).completeness).toBe('rejected');
  });

  it.each([
    [flow('a', 'A', ['a'])],
    [flow('a', 'A', ['b']), flow('b', 'B', ['a'])],
    [flow('a'), flow('b', 'B', ['c']), flow('c', 'C', ['b'])],
  ])('rejects cycles without returning partial positives', (...flows) => {
    const result = analyzeFlowImpact(request(), modules, flows);
    expect(result.completeness).toBe('rejected');
    expect(result.affected_flows).toEqual([]);
    expect(result.diagnostics.some(d => d.code === 'FLOW_CYCLE')).toBe(true);
  });

  it('rejects identical duplicate IDs and conflicting duplicates independent of order', () => {
    for (const duplicate of [flow('a'), flow('a', 'B')]) {
      const flows = [flow('a'), duplicate];
      const result = analyzeFlowImpact(request(), modules, flows);
      expect(result.affected_flows).toEqual([]);
      expect(result.diagnostics).toContainEqual({ code: 'DUPLICATE_FLOW_ID', flow_id: 'a' });
      expect(result).toEqual(analyzeFlowImpact(request(), modules, [...flows].reverse()));
    }
  });

  it('traverses inactive intermediates but excludes them from affected output', () => {
    const result = analyzeFlowImpact(request(), modules, [chain[0], { ...chain[1], is_active: false }, chain[2]]);
    expect(summary(result)).toEqual([['a', 0], ['c', 2]]);
    expect(result.affected_flows[1].paths[0].flow_ids).toEqual(['a', 'b', 'c']);
    expect(result.diagnostics).toContainEqual({ code: 'INACTIVE_FLOW', flow_id: 'b' });
  });

  it('allows inactive module-associated structural roots without reporting them affected', () => {
    const result = analyzeFlowImpact(request(), modules, [{ ...chain[0], is_active: false }, chain[1], chain[2]]);
    expect(summary(result)).toEqual([['b', 1], ['c', 2]]);
    expect(result.completeness).toBe('complete');
  });

  it('validates missing references on inactive flows too', () => {
    const result = analyzeFlowImpact(request(), modules, [flow('a'), flow('b', 'B', ['missing'], { is_active: false })]);
    expect(result.affected_flows).toEqual([]);
    expect(result.completeness).toBe('rejected');
  });

  it('does not expand all sibling flows of a flow-dependent module', () => {
    expect(summary(analyzeFlowImpact(request(), modules, [...chain, flow('b-sibling', 'B')])))
      .toEqual([['a', 0], ['b', 1], ['c', 2]]);
  });

  it('rejects foreign application flows even with a shared ID', () => {
    const result = analyzeFlowImpact(request(), modules, [flow('a', 'A', [], { application_id: 'other' })]);
    expect(result.completeness).toBe('rejected');
    expect(result.diagnostics).toContainEqual({ code: 'FLOW_APPLICATION_MISMATCH', flow_id: 'a' });
    expect(result.affected_flows).toEqual([]);
  });

  it('preserves depth-limited module completeness while retaining proven formal flow paths', () => {
    const inventory = [module('A'), module('B', ['A']), module('C', ['B'])];
    const result = analyzeFlowImpact(request(['A'], 0), inventory, chain.slice(0, 3));
    expect(result.completeness).toBe('depth_limited');
    expect(summary(result)).toEqual([['a', 0], ['b', 1], ['c', 2]]);
    expect(result.affected_flows.every(f => f.paths.every(p => p.module_path.depth === 0))).toBe(true);
  });

  it.each([
    [module('A', ['missing'])], [module('A', ['B']), module('B', ['A'])],
    [module('A', [], { is_active: false })], [module('A'), module('A')],
    [module('A', [], { application_id: 'other' })],
  ])('does not convert rejected module analysis to positive flow results', (...inventory) => {
    const result = analyzeFlowImpact(request(), inventory, [flow('a')]);
    expect(result.module_analysis.completeness).toBe('rejected');
    expect(result.completeness).toBe('rejected');
    expect(result.affected_flows).toEqual([]);
  });

  it('validates an empty seed inventory and returns no invented causes', () => {
    expect(summary(analyzeFlowImpact(request([]), modules, chain))).toEqual([]);
    expect(analyzeFlowImpact(request([]), [], []).completeness).toBe('complete');
    expect(analyzeFlowImpact(request(), modules, []).affected_flows).toEqual([]);
  });

  it('is deterministic under inventory/edge/seed reordering and never mutates inputs', () => {
    const input = frozen(request(['B', 'A']));
    const inventory = frozen(structuredClone(modules));
    const flows = frozen([flow('z', 'D', ['c', 'b']), ...chain.slice(0, 3)]);
    const before = JSON.stringify({ input, inventory, flows });
    const first = analyzeFlowImpact(input, inventory, flows);
    const second = analyzeFlowImpact({ ...input, changed_modules: [...input.changed_modules].reverse() },
      [...inventory].reverse(), [...flows].reverse().map(f => ({ ...f, prerequisites: [...f.prerequisites].reverse() })));
    expect(second).toEqual(first);
    expect(JSON.stringify({ input, inventory, flows })).toBe(before);
    expect(second.affected_flows[0].paths).not.toBe(first.affected_flows[0].paths);
  });

  it.each([null, [null], new Array(1)])('fails closed on malformed or sparse flow inventories (%j)', invalid => {
    const result = analyzeFlowImpact(request(), modules, invalid as unknown as FlowScenario[]);
    expect(result.completeness).toBe('rejected');
    expect(result.affected_flows).toEqual([]);
  });

  it('rejects sparse prerequisite arrays and unrecognized prerequisite kinds', () => {
    for (const prerequisites of [new Array<PrerequisiteDefinition>(1),
      [{ id: 'x', title: 'x', kind: 'unknown' } as unknown as PrerequisiteDefinition]]) {
      const result = analyzeFlowImpact(request(), modules, [flow('a', 'A', [], { prerequisites })]);
      expect(result.completeness).toBe('rejected');
      expect(result.affected_flows).toEqual([]);
    }
  });
});

function write<K extends 'application' | 'module' | 'flow'>(
  kind: K, entity: KnowledgeEntities[K], expected_revision = 0,
): KnowledgeWrite {
  return { kind, entity, expected_revision, trace: { source: 'physical_test', recorded_by: 'Codex',
    recorded_at: timestamp, reason: 'Verify canonical flow impact', review: 'unreviewed', evidence_refs: [] } } as KnowledgeWrite;
}

/** Prepared physical fixtures. These tests have NOT run until a coordinated window is granted. */
describe('VNEXT-015-04 composition with 015-03 and physical Knowledge', () => {
  async function fixture(run: (store: SqliteKnowledgeAdapter) => Promise<void>) {
    const directory = mkdtempSync(join(tmpdir(), 'qap-flow-impact-'));
    const store = new SqliteKnowledgeAdapter(join(directory, 'knowledge.sqlite'));
    try {
      await store.commit('app', [write('application', { application_id: 'app', name: 'App',
        base_url: 'https://example.test', created_at: timestamp })]);
      await store.commit('app', modules.map(m => write('module', { ...m, dependencies: [...m.dependencies] })));
      await store.commit('app', chain.map(f => write('flow', f)));
      await run(store);
    } finally {
      store.close();
      rmSync(directory, { recursive: true, force: true });
    }
  }

  it('reuses paginated module reads, matches pure analysis and performs no writes or extra reads', async () => {
    await fixture(async store => {
      const flows = frozen((await store.query('app', 'flow')).items.map(record => record.entity));
      const query = vi.spyOn(store, 'query');
      const commit = vi.spyOn(store, 'commit');
      const get = vi.spyOn(store, 'get');
      const history = vi.spyOn(store, 'history');
      const fence = vi.spyOn(store, 'withWriteFence');
      const result = await readKnowledgeFlowImpact(store, 'app', request(), flows, { page_size: 1 });
      expect(result.analysis).toEqual(analyzeFlowImpact(request(), modules, flows));
      expect(result.module_read.reading).toMatchObject({ status: 'exhausted', query_count: 4,
        module_count: 4, snapshot_consistency: 'not_verified' });
      expect(query.mock.calls.every(([app, kind]) => app === 'app' && kind === 'module')).toBe(true);
      for (const spy of [commit, get, history, fence]) expect(spy).not.toHaveBeenCalled();
    });
  });

  it('returns null analysis on an incomplete paginated module read', async () => {
    await fixture(async store => {
      const result = await readKnowledgeFlowImpact(store, 'app', request(), chain, { page_size: 1, max_pages: 1 });
      expect(result.module_read.reading.status).toBe('interrupted');
      expect(result.module_read.analysis).toBeNull();
      expect(result.analysis).toBeNull();
    });
  });

  it('returns null on invalidated reads without exposing store error payloads', async () => {
    await fixture(async store => {
      vi.spyOn(store, 'query').mockRejectedValue(new KnowledgeStoreError('INVALID_CURSOR', 'sensitive-canary'));
      const result = await readKnowledgeFlowImpact(store, 'app', request(), chain, { max_attempts: 2 });
      expect(result.analysis).toBeNull();
      expect(result.module_read.reading).toMatchObject({ status: 'invalidated', attempts: 2, query_count: 2 });
      expect(JSON.stringify(result)).not.toContain('sensitive-canary');
    });
  });

  it('resets observed module IDs on a retry and copies flow fields before awaiting I/O', async () => {
    await fixture(async store => {
      const originalQuery = store.query.bind(store);
      let calls = 0;
      const flows = structuredClone(chain);
      vi.spyOn(store, 'query').mockImplementation(async (app, kind, input) => {
        calls++;
        if (calls === 1) return originalQuery(app, kind, input);
        if (calls === 2) {
          flows[1].prerequisites.length = 0;
          flows[0].module_id = 'D';
          throw new KnowledgeStoreError('INVALID_CURSOR', 'retry');
        }
        return originalQuery(app, kind, input);
      });
      const result = await readKnowledgeFlowImpact(store, 'app', request(), flows, { page_size: 1 });
      expect(result.module_read.reading).toMatchObject({ attempts: 2, invalid_cursor_count: 1, module_count: 4 });
      expect(result.analysis).toEqual(analyzeFlowImpact(request(), modules, chain));
    });
  });

  it('does not retain a module identity seen only in a discarded attempt', async () => {
    await fixture(async store => {
      const originalQuery = store.query.bind(store);
      let calls = 0;
      vi.spyOn(store, 'query').mockImplementation(async (app, kind, input) => {
        calls++;
        if (calls === 2) throw new KnowledgeStoreError('INVALID_CURSOR', 'retry');
        const page = await originalQuery(app, kind, input);
        if (calls === 1) {
          const record = page.items[0];
          record.id = 'ghost';
          (record.entity as KnowledgeEntities['module']).id = 'ghost';
        }
        return page;
      });
      const result = await readKnowledgeFlowImpact(store, 'app', request(), [flow('ghost-flow', 'ghost')], { page_size: 1 });
      expect(result.module_read.reading).toMatchObject({ status: 'exhausted', attempts: 2, invalid_cursor_count: 1 });
      expect(result.analysis?.completeness).toBe('rejected');
      expect(result.analysis?.diagnostics).toContainEqual({ code: 'UNKNOWN_FLOW_MODULE', flow_id: 'ghost-flow', module_id: 'ghost' });
      expect(result.analysis?.affected_flows).toEqual([]);
    });
  });

  it('fails closed on a scope mismatch before querying and on an unknown flow module', async () => {
    await fixture(async store => {
      const query = vi.spyOn(store, 'query');
      expect((await readKnowledgeFlowImpact(store, 'other', request(), chain)).analysis).toBeNull();
      expect(query).not.toHaveBeenCalled();
      const result = await readKnowledgeFlowImpact(store, 'app', request(), [flow('bad', 'key-A')]);
      expect(result.analysis?.completeness).toBe('rejected');
      expect(result.analysis?.affected_flows).toEqual([]);
    });
  });
});
