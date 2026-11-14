import type {
  ImpactModule, ImpactPath, ImpactRequest, ImpactResult, IKnowledgeStore,
  KnowledgeKind, KnowledgePage, KnowledgeQuery, KnowledgeRecord,
} from '@qap/engine';
import type { FlowScenario, PrerequisiteDefinition } from '@qap/shared';

import { analyzeImpact } from './impact-analyzer.js';
import {
  readKnowledgeImpact, type KnowledgeImpactReadOptions, type KnowledgeImpactReadResult,
} from './knowledge-impact-reader.js';

/** Only canonical fields used in impact; steps, DOM and titles cannot create edges. */
export type ImpactFlow = Readonly<Pick<FlowScenario, 'id' | 'application_id' | 'module_id' | 'is_active'> & {
  prerequisites: readonly Readonly<PrerequisiteDefinition>[];
}>;

export type FlowImpactDiagnostic =
  | { readonly code: 'INVALID_FLOW_INVENTORY' }
  | { readonly code: 'INVALID_FLOW'; readonly flow_id: string }
  | { readonly code: 'FLOW_APPLICATION_MISMATCH'; readonly flow_id: string }
  | { readonly code: 'DUPLICATE_FLOW_ID'; readonly flow_id: string }
  | { readonly code: 'UNKNOWN_FLOW_MODULE'; readonly flow_id: string; readonly module_id: string }
  | { readonly code: 'MISSING_FLOW_REFERENCE'; readonly flow_id: string; readonly reference: string }
  | { readonly code: 'FLOW_CYCLE'; readonly flow_ids: readonly string[] }
  | { readonly code: 'INACTIVE_FLOW'; readonly flow_id: string };

export interface FlowImpactPath {
  /** The source flow belongs to a module reached by the module analysis. */
  readonly source_flow_id: string;
  readonly module_path: ImpactPath;
  /** Inverse preceding_flow path. depth counts flow edges only. */
  readonly depth: number;
  readonly flow_ids: readonly string[];
}

export interface FlowImpactResult {
  readonly application_id: string;
  /** Relative to supplied inventories only; never claims they are exhaustive/current. */
  readonly completeness: ImpactResult['completeness'];
  readonly coherence: 'caller_supplied_not_verified';
  readonly module_analysis: ImpactResult;
  /** Minimum flow-edge distance, then ordinal ID; paths by source flow/module seed. */
  readonly affected_flows: readonly {
    readonly id: string;
    readonly module_id: string;
    readonly depth: number;
    readonly paths: readonly FlowImpactPath[];
  }[];
  readonly diagnostics: readonly FlowImpactDiagnostic[];
}

const compare = (a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0;
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

interface FlowNode {
  id: string;
  application_id: string;
  module_id: string;
  is_active: boolean;
  dependencies: string[];
}

/** Copies the consumed fields synchronously, including before any store await. */
function copyFlows(flows: readonly ImpactFlow[]): { nodes: FlowNode[]; diagnostics: FlowImpactDiagnostic[] } {
  const diagnostics: FlowImpactDiagnostic[] = [];
  const nodes: FlowNode[] = [];
  if (!Array.isArray(flows)) return { nodes, diagnostics: [{ code: 'INVALID_FLOW_INVENTORY' }] };
  for (const flow of flows) {
    if (!flow || !text(flow.id)) {
      diagnostics.push({ code: 'INVALID_FLOW_INVENTORY' });
      continue;
    }
    if (!text(flow.application_id) || !text(flow.module_id) || typeof flow.is_active !== 'boolean' ||
        !Array.isArray(flow.prerequisites)) {
      diagnostics.push({ code: 'INVALID_FLOW', flow_id: flow.id });
      continue;
    }
    const dependencies: string[] = [];
    for (const prerequisite of flow.prerequisites) {
      if (!prerequisite || !['preceding_flow', 'auth_session', 'data_fixture', 'navigation_state'].includes(prerequisite.kind) ||
          (prerequisite.kind === 'preceding_flow' && !text(prerequisite.depends_on_flow_id))) {
        diagnostics.push({ code: 'INVALID_FLOW', flow_id: flow.id });
      } else if (prerequisite.kind === 'preceding_flow') {
        dependencies.push(prerequisite.depends_on_flow_id!);
      }
    }
    nodes.push({ id: flow.id, application_id: flow.application_id, module_id: flow.module_id,
      is_active: flow.is_active, dependencies });
  }
  return { nodes, diagnostics };
}

function projectFlows(
  moduleAnalysis: ImpactResult, moduleIds: ReadonlySet<string>, copied: ReturnType<typeof copyFlows>,
): FlowImpactResult {
  const { nodes, diagnostics } = copied;
  const byId = new Map<string, FlowNode>();
  const ordered = [...nodes].sort((a, b) => compare(a.id, b.id));
  for (const flow of ordered) {
    if (flow.application_id !== moduleAnalysis.application_id) {
      diagnostics.push({ code: 'FLOW_APPLICATION_MISMATCH', flow_id: flow.id });
    }
    if (byId.has(flow.id)) diagnostics.push({ code: 'DUPLICATE_FLOW_ID', flow_id: flow.id });
    byId.set(flow.id, flow);
    if (!moduleIds.has(flow.module_id)) {
      diagnostics.push({ code: 'UNKNOWN_FLOW_MODULE', flow_id: flow.id, module_id: flow.module_id });
    }
    if (!flow.is_active) diagnostics.push({ code: 'INACTIVE_FLOW', flow_id: flow.id });
  }
  const finish = (
    completeness: FlowImpactResult['completeness'], affected_flows: FlowImpactResult['affected_flows'] = [],
  ): FlowImpactResult => ({
    application_id: moduleAnalysis.application_id, completeness, coherence: 'caller_supplied_not_verified',
    module_analysis: moduleAnalysis, affected_flows,
    diagnostics: [...new Map(diagnostics.map(d => [JSON.stringify(d), d])).entries()]
      .sort(([a], [b]) => compare(a, b)).map(([, d]) => d),
  });
  if (moduleAnalysis.completeness === 'rejected' || diagnostics.some(d => d.code !== 'INACTIVE_FLOW')) {
    return finish('rejected');
  }

  const affectedModules = new Map(moduleAnalysis.affected_modules.map(module => [module.id, module]));
  // An internal ID-only projection reuses all graph algorithms in analyzeImpact.
  // key === id prevents interpreting flow references as aliases. No entities are persisted.
  // Inactive flows are structural nodes, including module-associated roots; filter only output.
  const projection: ImpactModule[] = ordered.map(flow => ({
    id: flow.id, key: flow.id, application_id: flow.application_id, title: flow.id,
    dependencies: flow.dependencies, is_active: true, certainty: 'confirmed', criticality: 'low',
    created_at: '', updated_at: '',
  }));
  const graph = analyzeImpact({ contract_version: 1, application_id: moduleAnalysis.application_id,
    changed_modules: ordered.filter(flow => affectedModules.has(flow.module_id))
      .map(flow => ({ kind: 'id', value: flow.id })),
  }, projection);
  for (const diagnostic of graph.diagnostics) {
    if (diagnostic.code === 'MISSING_REFERENCE') diagnostics.push({ code: 'MISSING_FLOW_REFERENCE',
      flow_id: diagnostic.module_id, reference: diagnostic.reference });
    if (diagnostic.code === 'CYCLE') diagnostics.push({ code: 'FLOW_CYCLE', flow_ids: [...diagnostic.module_ids] });
  }
  if (graph.completeness === 'rejected') return finish('rejected');
  return finish(moduleAnalysis.completeness, graph.affected_modules.filter(node => byId.get(node.id)!.is_active)
    .map(node => ({ id: node.id, module_id: byId.get(node.id)!.module_id, depth: node.depth,
      paths: node.paths.flatMap(path => affectedModules.get(byId.get(path.seed_id)!.module_id)!.paths
        .map(modulePath => ({ source_flow_id: path.seed_id,
          module_path: { ...modulePath, module_ids: [...modulePath.module_ids] },
          depth: path.depth, flow_ids: [...path.module_ids] }))),
    })));
}

/** Pure composition. max_depth limits module traversal; formal flow traversal is unbounded.
 * Invalid relations anywhere reject all flow output. Inactive flows remain traversable
 * and can be module-associated roots, but never appear in affected_flows.
 */
export function analyzeFlowImpact(
  request: ImpactRequest, modules: readonly ImpactModule[], flows: readonly ImpactFlow[],
): FlowImpactResult {
  return projectFlows(analyzeImpact(request, modules), new Set(modules.map(module => module.id)), copyFlows(flows));
}

export interface KnowledgeFlowImpactResult {
  readonly module_read: KnowledgeImpactReadResult;
  /** Null on module read failure; rejected flow analyses contain no affected flows. */
  readonly analysis: FlowImpactResult | null;
}

/** Reuses 015-03 pagination/validation/retries without changing its public contract.
 * Flows are caller-supplied, copied before I/O, NOT a verified multi-kind snapshot.
 * The query observer retains IDs for validating module_id, resets with each attempt,
 * and is used only after the reader accepts its entire module inventory.
 * No flow query, writes, fences, history, get, execution or inference.
 */
export async function readKnowledgeFlowImpact(
  store: IKnowledgeStore, applicationId: string, request: ImpactRequest, flows: readonly ImpactFlow[],
  options: KnowledgeImpactReadOptions = {},
): Promise<KnowledgeFlowImpactResult> {
  const copied = copyFlows(flows);
  const moduleIds = new Set<string>();
  const query = async <K extends KnowledgeKind>(
    app: string, kind: K, input?: KnowledgeQuery,
  ): Promise<KnowledgePage<KnowledgeRecord<K>>> => {
    if (input?.cursor === undefined) moduleIds.clear();
    const page = await store.query(app, kind, input);
    if (Array.isArray(page?.items)) {
      for (const record of page.items) {
        const entity = record?.entity as KnowledgeRecord<'module'>['entity'] | undefined;
        if (entity && text(entity.id)) moduleIds.add(entity.id);
      }
    }
    return page;
  };
  // Preserve the original port's identity/capabilities; only query is observed.
  const observed = store && new Proxy(store, {
    get(target, property, receiver): unknown {
      const value: unknown = property === 'query' ? query : Reflect.get(target, property, receiver);
      return value;
    },
  });
  const moduleRead = await readKnowledgeImpact(observed, applicationId, request, options);
  return { module_read: moduleRead, analysis: moduleRead.analysis === null ? null
    : projectFlows(moduleRead.analysis, moduleIds, copied) };
}
