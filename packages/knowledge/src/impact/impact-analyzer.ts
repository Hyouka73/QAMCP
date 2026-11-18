import type {
  AffectedModule, ImpactDiagnostic, ImpactModule, ImpactPath, ImpactRequest, ImpactResult, ImpactSeed,
} from '@qap/engine';

import { detectCycles } from '../graph/cycle-detector.js';

const compare = (a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0;
const uniqueSorted = (values: Iterable<string>): string[] => [...new Set(values)].sort(compare);

/** Pure inverse impact over a caller-supplied, single-application inventory.
 * Validates the entire inventory before calculating any impact. No store access,
 * flow inference, revision guarantees, successor substitution or execution.
 */
export function analyzeImpact(request: ImpactRequest, modules: readonly ImpactModule[]): ImpactResult {
  const diagnostics: ImpactDiagnostic[] = [];
  const byId = new Map<string, ImpactModule>();
  const byKey = new Map<string, string[]>();
  const seeds = new Set<string>();
  const affected = new Map<string, { module: ImpactModule; paths: ImpactPath[] }>();

  function result(completeness: ImpactResult['completeness']): ImpactResult {
    const diagnosticMap = new Map(diagnostics.map(d => [JSON.stringify(d), d]));
    const affectedModules: AffectedModule[] = [...affected.values()].map(({ module, paths }) => ({
      id: module.id, key: module.key,
      depth: Math.min(...paths.map(p => p.depth)),
      paths,
    }));
    affectedModules.sort((a, b) => a.depth - b.depth || compare(a.id, b.id));
    return {
      contract_version: 1, application_id: request.application_id, completeness,
      coherence: 'caller_supplied_not_verified', changed_module_ids: uniqueSorted(seeds),
      affected_modules: affectedModules,
      diagnostics: [...diagnosticMap.entries()].sort(([a], [b]) => compare(a, b)).map(([, d]) => d),
    };
  }

  if (request.contract_version !== 1 || !request.application_id ||
      (request.max_depth !== undefined && (!Number.isSafeInteger(request.max_depth) || request.max_depth < 0)) ||
      request.changed_modules.some(seed => !seed.value || (seed.kind !== 'id' && seed.kind !== 'key'))) {
    diagnostics.push({ code: 'INVALID_REQUEST' });
    return result('rejected');
  }

  // Sorted copies keep diagnostics and detectCycles independent of input order.
  const ordered = [...modules].sort((a, b) => compare(a.id, b.id) || compare(a.key, b.key));
  for (const module of ordered) {
    if (module.application_id !== request.application_id) {
      diagnostics.push({ code: 'APPLICATION_MISMATCH', module_id: module.id, application_id: module.application_id });
      continue;
    }
    if (byId.has(module.id)) diagnostics.push({ code: 'DUPLICATE_MODULE_ID', module_id: module.id });
    byId.set(module.id, module);
    byKey.set(module.key, [...(byKey.get(module.key) ?? []), module.id]);
    if (!module.is_active) diagnostics.push({ code: 'INACTIVE_MODULE', module_id: module.id });
  }
  for (const [key, ids] of byKey) {
    const moduleIds = uniqueSorted(ids);
    if (moduleIds.length > 1) diagnostics.push({ code: 'AMBIGUOUS_KEY', key, module_ids: moduleIds });
  }
  // Identity/scope errors cannot safely be resolved by taking the last record.
  if (diagnostics.some(d => d.code !== 'INACTIVE_MODULE')) return result('rejected');

  const adjacency = new Map<string, string[]>();
  const inverse = new Map<string, string[]>();
  for (const id of byId.keys()) inverse.set(id, []);
  for (const module of byId.values()) {
    const dependencies = new Set<string>();
    for (const reference of uniqueSorted(module.dependencies)) {
      const candidates = uniqueSorted([
        ...(byId.has(reference) ? [reference] : []), ...(byKey.get(reference) ?? []),
      ]);
      if (candidates.length === 0) {
        diagnostics.push({ code: 'MISSING_REFERENCE', module_id: module.id, reference });
      } else if (candidates.length > 1) {
        diagnostics.push({ code: 'AMBIGUOUS_REFERENCE', module_id: module.id, reference, module_ids: candidates });
      } else {
        dependencies.add(candidates[0]);
      }
    }
    adjacency.set(module.id, uniqueSorted(dependencies));
    for (const dependency of dependencies) inverse.get(dependency)?.push(module.id);
  }
  for (const [id, dependents] of inverse) inverse.set(id, uniqueSorted(dependents));
  for (const cycle of detectCycles(adjacency).cycles) diagnostics.push({ code: 'CYCLE', module_ids: cycle });

  for (const seed of request.changed_modules) {
    const ids = seed.kind === 'id' ? (byId.has(seed.value) ? [seed.value] : []) : (byKey.get(seed.value) ?? []);
    if (ids.length === 0) {
      const copy: ImpactSeed = { kind: seed.kind, value: seed.value };
      diagnostics.push({ code: 'UNKNOWN_MODULE', seed: copy });
    } else {
      const module = byId.get(ids[0]);
      if (module && !module.is_active) diagnostics.push({ code: 'INACTIVE_SEED', module_id: module.id });
      else seeds.add(ids[0]);
    }
  }
  if (diagnostics.some(d => d.code !== 'INACTIVE_MODULE')) return result('rejected');

  let truncated = false;
  for (const seedId of uniqueSorted(seeds)) {
    // BFS with sorted neighbors selects one lexicographically first shortest
    // causal path per seed/target without enumerating exponentially many paths.
    const queue: Array<{ id: string; path: string[] }> = [{ id: seedId, path: [seedId] }];
    const visited = new Set([seedId]);
    for (let index = 0; index < queue.length; index++) {
      const { id, path } = queue[index];
      const depth = path.length - 1;
      const module = byId.get(id);
      if (module?.is_active) {
        const entry = affected.get(id) ?? { module, paths: [] };
        entry.paths.push({ seed_id: seedId, depth, module_ids: [...path] });
        affected.set(id, entry);
      }
      for (const dependent of inverse.get(id) ?? []) {
        if (visited.has(dependent)) continue;
        if (request.max_depth !== undefined && depth >= request.max_depth) {
          truncated = true;
          continue;
        }
        visited.add(dependent);
        queue.push({ id: dependent, path: [...path, dependent] });
      }
    }
  }
  return result(truncated ? 'depth_limited' : 'complete');
}
