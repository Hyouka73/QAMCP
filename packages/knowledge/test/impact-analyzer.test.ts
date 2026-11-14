import type { ImpactModule, ImpactRequest, ImpactResult } from '@qap/engine';
import { describe, expect, it } from 'vitest';

import { analyzeImpact } from '../src/impact/impact-analyzer.js';

function module(id: string, dependencies: readonly string[] = [], extra: Partial<ImpactModule> = {}): ImpactModule {
  return { id, key: `key-${id}`, application_id: 'app', title: id, dependencies,
    certainty: 'confirmed', criticality: 'medium', created_at: '2026-11-05', updated_at: '2026-11-05',
    is_active: true, ...extra };
}
function request(ids: readonly string[], max_depth?: number): ImpactRequest {
  return { contract_version: 1, application_id: 'app',
    changed_modules: ids.map(value => ({ kind: 'id', value })), ...(max_depth === undefined ? {} : { max_depth }) };
}
const summary = (result: ImpactResult) => result.affected_modules.map(m => [m.id, m.depth]);
const codes = (result: ImpactResult) => result.diagnostics.map(d => d.code);

describe('VNEXT-015-02 pure inverse module impact', () => {
  it('accepts an empty graph and no seeds without asserting storage coherence', () => {
    expect(analyzeImpact(request([]), [])).toEqual({ contract_version: 1, application_id: 'app',
      completeness: 'complete', coherence: 'caller_supplied_not_verified', changed_module_ids: [],
      affected_modules: [], diagnostics: [] });
  });

  it('includes an isolated active seed at depth zero', () => {
    const result = analyzeImpact(request(['A']), [module('A')]);
    expect(summary(result)).toEqual([['A', 0]]);
    expect(result.affected_modules[0].paths).toEqual([{ seed_id: 'A', depth: 0, module_ids: ['A'] }]);
  });

  it('propagates a chain inversely without affecting prerequisites of the seed', () => {
    const modules = [module('A', ['B']), module('B', ['C']), module('C'), module('D')];
    expect(summary(analyzeImpact(request(['C']), modules))).toEqual([['C', 0], ['B', 1], ['A', 2]]);
    expect(summary(analyzeImpact(request(['B']), modules))).toEqual([['B', 0], ['A', 1]]);
    expect(analyzeImpact(request(['C']), modules).affected_modules[2].paths[0].module_ids).toEqual(['C', 'B', 'A']);
  });

  const diamond = [module('D', ['C', 'B', 'B']), module('C', ['A']), module('B', ['key-A']), module('A')];
  it('deduplicates a diamond and selects the ordinal first shortest causal path', () => {
    const result = analyzeImpact(request(['A']), diamond);
    expect(summary(result)).toEqual([['A', 0], ['B', 1], ['C', 1], ['D', 2]]);
    expect(result.affected_modules[3].paths).toEqual([{ seed_id: 'A', depth: 2, module_ids: ['A', 'B', 'D'] }]);
  });

  it('resolves ID/key dependency aliases to a single real node', () => {
    const result = analyzeImpact({ ...request([]), changed_modules: [{ kind: 'key', value: 'key-A' }] },
      [module('B', ['A', 'key-A']), module('A')]);
    expect(summary(result)).toEqual([['A', 0], ['B', 1]]);
    expect(result.changed_module_ids).toEqual(['A']);
  });

  it('deduplicates multiple seed aliases and retains one path per distinct seed', () => {
    const result = analyzeImpact({ ...request(['C', 'A', 'A']), changed_modules: [
      ...request(['C', 'A', 'A']).changed_modules, { kind: 'key', value: 'key-A' },
    ] }, diamond);
    expect(result.changed_module_ids).toEqual(['A', 'C']);
    expect(summary(result)).toEqual([['A', 0], ['C', 0], ['B', 1], ['D', 1]]);
    expect(result.affected_modules[3].paths).toEqual([
      { seed_id: 'A', depth: 2, module_ids: ['A', 'B', 'D'] },
      { seed_id: 'C', depth: 1, module_ids: ['C', 'D'] },
    ]);
  });

  it('supports independent roots with a shared dependent', () => {
    const result = analyzeImpact(request(['B', 'A']), [module('C', ['A', 'B']), module('B'), module('A')]);
    expect(summary(result)).toEqual([['A', 0], ['B', 0], ['C', 1]]);
    expect(result.affected_modules[2].paths.map(p => p.seed_id)).toEqual(['A', 'B']);
  });

  it.each([0, 1, 2])('applies max_depth=%i and reports actual truncation', depth => {
    const result = analyzeImpact(request(['A'], depth), diamond);
    expect(result.affected_modules.every(m => m.paths.every(p => p.depth <= depth))).toBe(true);
    expect(result.completeness).toBe(depth < 2 ? 'depth_limited' : 'complete');
    expect(result.affected_modules).toHaveLength([1, 3, 4][depth]);
  });

  it('does not mark a fully covered frontier as truncated', () => {
    const result = analyzeImpact(request(['A'], 1), [module('A'), module('B', ['A']), module('C', ['A', 'B'])]);
    expect(result.completeness).toBe('complete');
    expect(summary(result)).toEqual([['A', 0], ['B', 1], ['C', 1]]);
    expect(analyzeImpact(request(['A'], 0), [module('A')]).completeness).toBe('complete');
  });

  it.each([-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])('rejects invalid max_depth=%s', depth => {
    const result = analyzeImpact(request(['A'], depth), [module('A')]);
    expect(result.completeness).toBe('rejected');
    expect(codes(result)).toEqual(['INVALID_REQUEST']);
    expect(result.affected_modules).toEqual([]);
  });

  it('rejects invalid application, version and empty seed values', () => {
    for (const invalid of [{ ...request([]), application_id: '' },
      { ...request([]), contract_version: 2 } as unknown as ImpactRequest, request([''])]) {
      expect(codes(analyzeImpact(invalid, []))).toEqual(['INVALID_REQUEST']);
    }
  });

  it.each(['id', 'key'] as const)('rejects unknown %s seeds without fabricating nodes', kind => {
    const result = analyzeImpact({ ...request(['A']), changed_modules: [
      { kind: 'id', value: 'A' }, { kind, value: 'unknown' },
    ] }, [module('A')]);
    expect(result.completeness).toBe('rejected');
    expect(result.affected_modules).toEqual([]);
    expect(result.diagnostics).toContainEqual({ code: 'UNKNOWN_MODULE', seed: { kind, value: 'unknown' } });
  });

  it('distinguishes a missing dependency even in an unselected component', () => {
    const result = analyzeImpact(request(['A'], 0), [module('A'), module('B', ['missing'])]);
    expect(result.completeness).toBe('rejected');
    expect(result.diagnostics).toEqual([{ code: 'MISSING_REFERENCE', module_id: 'B', reference: 'missing' }]);
    expect(result.affected_modules).toEqual([]);
  });

  it('rejects duplicate keys even without seeds', () => {
    const result = analyzeImpact(request([]), [module('B', [], { key: 'same' }), module('A', [], { key: 'same' })]);
    expect(result.completeness).toBe('rejected');
    expect(result.diagnostics).toEqual([{ code: 'AMBIGUOUS_KEY', key: 'same', module_ids: ['A', 'B'] }]);
  });

  it('rejects ID/key collisions in untyped dependencies without preferring either', () => {
    const modules = [module('A'), module('B', [], { key: 'A' }), module('C', ['A'])];
    const result = analyzeImpact(request(['A']), modules);
    expect(result.diagnostics).toEqual([{ code: 'AMBIGUOUS_REFERENCE', module_id: 'C', reference: 'A', module_ids: ['A', 'B'] }]);
    expect(result.affected_modules).toEqual([]);
  });

  it('honors explicit seed namespaces in an otherwise valid ID/key collision', () => {
    const modules = [module('A'), module('B', [], { key: 'A' })];
    expect(summary(analyzeImpact(request(['A']), modules))).toEqual([['A', 0]]);
    expect(summary(analyzeImpact({ ...request([]), changed_modules: [{ kind: 'key', value: 'A' }] }, modules))).toEqual([['B', 0]]);
  });

  it('rejects duplicate IDs instead of overwriting an identity', () => {
    const result = analyzeImpact(request(['A']), [module('A'), module('A', [], { key: 'other' })]);
    expect(codes(result)).toEqual(['DUPLICATE_MODULE_ID']);
    expect(result.affected_modules).toEqual([]);
  });

  it('rejects foreign application modules instead of using their keys', () => {
    const result = analyzeImpact(request(['A']), [module('A', [], { application_id: 'other' })]);
    expect(result.completeness).toBe('rejected');
    expect(result.diagnostics).toEqual([{ code: 'APPLICATION_MISMATCH', module_id: 'A', application_id: 'other' }]);
  });

  it.each([
    [module('A', ['A'])],
    [module('B', ['C']), module('C', ['A']), module('A', ['B'])],
  ])('rejects cycles with a closed causal trace', (...modules) => {
    const result = analyzeImpact(request([]), modules);
    expect(result.completeness).toBe('rejected');
    expect(result.affected_modules).toEqual([]);
    const cycle = result.diagnostics.find(d => d.code === 'CYCLE');
    expect(cycle?.module_ids).toEqual(modules.length === 1 ? ['A', 'A'] : ['A', 'B', 'C', 'A']);
  });

  it('traverses inactive intermediates but excludes them from affected modules', () => {
    const result = analyzeImpact(request(['A']), [module('A'), module('B', ['A'], { is_active: false }), module('C', ['B'])]);
    expect(result.completeness).toBe('complete');
    expect(summary(result)).toEqual([['A', 0], ['C', 2]]);
    expect(result.affected_modules[1].paths[0].module_ids).toEqual(['A', 'B', 'C']);
    expect(result.diagnostics).toEqual([{ code: 'INACTIVE_MODULE', module_id: 'B' }]);
  });

  it('rejects inactive seeds and never substitutes their successor', () => {
    const result = analyzeImpact(request(['old']), [module('old', [], { is_active: false, superseded_by: 'new' }), module('new')]);
    expect(result.completeness).toBe('rejected');
    expect(result.changed_module_ids).toEqual([]);
    expect(result.affected_modules).toEqual([]);
    expect(codes(result)).toEqual(['INACTIVE_MODULE', 'INACTIVE_SEED']);
  });

  it('validates broken references and cycles of inactive modules', () => {
    const result = analyzeImpact(request(['A']), [module('A'), module('B', ['B', 'missing'], { is_active: false })]);
    expect(result.completeness).toBe('rejected');
    expect(codes(result)).toEqual(['CYCLE', 'INACTIVE_MODULE', 'MISSING_REFERENCE']);
  });

  it('is invariant under inventory, dependencies and seed ordering', () => {
    const input = request(['C', 'A']);
    const expected = analyzeImpact(input, diamond);
    const reversed = diamond.slice().reverse().map(m => ({ ...m, dependencies: [...m.dependencies].reverse() }));
    expect(analyzeImpact({ ...input, changed_modules: [...input.changed_modules].reverse() }, reversed)).toEqual(expected);
    const invalid = [module('A', ['missing', 'A']), module('B', [], { is_active: false })];
    expect(analyzeImpact(request(['unknown']), invalid.slice().reverse())).toEqual(analyzeImpact(request(['unknown']), invalid));
  });

  it('does not mutate frozen inputs and detaches returned paths and seed diagnostics', () => {
    const modules = Object.freeze(diamond.map(m => Object.freeze({ ...m, dependencies: Object.freeze([...m.dependencies]) })));
    const input = Object.freeze({ ...request(['A']), changed_modules: Object.freeze([Object.freeze({ kind: 'id' as const, value: 'A' })]) });
    const before = JSON.stringify([input, modules]);
    const first = analyzeImpact(input, modules);
    const expected = structuredClone(first);
    (first.affected_modules[3].paths[0].module_ids as string[]).push('mutated-output');
    expect(analyzeImpact(input, modules)).toEqual(expected);
    const unknown = Object.freeze({ kind: 'id' as const, value: 'missing' });
    const result = analyzeImpact({ ...input, changed_modules: [unknown] }, modules);
    const diagnostic = result.diagnostics.find(d => d.code === 'UNKNOWN_MODULE');
    expect(diagnostic?.seed).not.toBe(unknown);
    expect(JSON.stringify([input, modules])).toBe(before);
  });
});
