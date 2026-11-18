import type { DomainModule } from '@qap/shared';

/** VNEXT-015-01 v1: caller-loaded module inventory; no storage or execution port. */
export type ImpactModule = Readonly<Omit<DomainModule, 'dependencies'> & {
  dependencies: readonly string[];
}>;

/** Explicit seed namespaces avoid silently preferring an ID over another module's key. */
export type ImpactSeed =
  | { readonly kind: 'id'; readonly value: string }
  | { readonly kind: 'key'; readonly value: string };

export interface ImpactRequest {
  readonly contract_version: 1;
  readonly application_id: string;
  readonly changed_modules: readonly ImpactSeed[];
  /** Nonnegative safe integer. Omit for unbounded traversal; seeds have depth 0. */
  readonly max_depth?: number;
}

export interface ImpactPath {
  readonly seed_id: string;
  readonly depth: number;
  /** Seed -> dependent -> ... -> affected module (inverse dependency direction).
   * One shortest path per seed/target, ties by ordinal lexicographic ID sequence.
   * Paths may contain inactive modules, which remain traversable.
   */
  readonly module_ids: readonly string[];
}

export interface AffectedModule {
  readonly id: string;
  readonly key: string;
  /** Minimum distance from any resolved seed; includes active seeds at depth 0. */
  readonly depth: number;
  readonly paths: readonly ImpactPath[];
}

export type ImpactDiagnostic =
  | { readonly code: 'INVALID_REQUEST' }
  | { readonly code: 'APPLICATION_MISMATCH'; readonly module_id: string; readonly application_id: string }
  | { readonly code: 'DUPLICATE_MODULE_ID'; readonly module_id: string }
  | { readonly code: 'AMBIGUOUS_KEY'; readonly key: string; readonly module_ids: readonly string[] }
  | { readonly code: 'UNKNOWN_MODULE'; readonly seed: ImpactSeed }
  | { readonly code: 'MISSING_REFERENCE'; readonly module_id: string; readonly reference: string }
  | { readonly code: 'AMBIGUOUS_REFERENCE'; readonly module_id: string; readonly reference: string; readonly module_ids: readonly string[] }
  | { readonly code: 'CYCLE'; readonly module_ids: readonly string[] }
  | { readonly code: 'INACTIVE_MODULE'; readonly module_id: string }
  | { readonly code: 'INACTIVE_SEED'; readonly module_id: string };

export interface ImpactResult {
  readonly contract_version: 1;
  readonly application_id: string;
  /** Completeness only of the supplied inventory and the active-module projection.
   * Rejected analyses always return affected_modules: []. depth_limited means an
   * actual reachable node was omitted for at least one seed due to max_depth.
   */
  readonly completeness: 'complete' | 'depth_limited' | 'rejected';
  /** No atomic snapshot, revision consistency or inventory exhaustiveness is asserted. */
  readonly coherence: 'caller_supplied_not_verified';
  readonly changed_module_ids: readonly string[];
  /** Sorted by minimum depth, then ordinal ID; paths sorted by seed ID. */
  readonly affected_modules: readonly AffectedModule[];
  /** Deterministically sorted and deduplicated; INACTIVE_MODULE is informational.
   * Inactive modules are validated/traversed but excluded from affected_modules;
   * inactive seeds reject the request. superseded_by is never followed.
   */
  readonly diagnostics: readonly ImpactDiagnostic[];
}

/** Example: { contract_version: 1, application_id: 'app',
 * changed_modules: [{ kind: 'key', value: 'billing' }], max_depth: 2 }.
 * Implementations perform no I/O and never mutate caller-owned values.
 */
export type ImpactAnalysis = (request: ImpactRequest, modules: readonly ImpactModule[]) => ImpactResult;
