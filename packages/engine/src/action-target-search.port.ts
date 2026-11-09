import type { KnowledgeRecord } from './knowledge-store.port.js';

/** Bounded lexical retrieval, not semantic inference. Errors use KnowledgeStoreError. */
export interface ActionTargetSearchRequest {
  application_id: string;
  /** Literal Unicode words; max 2048 UTF-16 units and 64 words. */
  query: string;
  view_id?: string;
  /** Resolved through the target's pinned view revision, not an invented target field. */
  module_id?: string;
  environment_id?: string;
  role_id?: string;
  /** Current target revision only, active by default. Never searches history. */
  include_inactive?: boolean;
  /** Integer 1..100, default 20. */
  limit?: number;
}

export interface ActionTargetSearchHit {
  /** Includes identity, selectors, label, certainty/confidence, validity and provenance. */
  target: KnowledgeRecord<'action_target'>;
  /** BM25, lower is better; corpus-dependent, not confidence or probability. */
  score: number;
}

/** Consumer-owned optional capability; IKnowledgeStore v1 remains unchanged. */
export interface IActionTargetSearch {
  searchActionTargets(request: ActionTargetSearchRequest): Promise<ActionTargetSearchHit[]>;
}
