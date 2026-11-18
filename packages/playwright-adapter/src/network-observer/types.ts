import type { ApplicationObservation, EnvironmentPolicy, MultimodalEvidenceRef } from '@qap/shared';

import type { ReconBudget } from '../reconnaissance/types.js';

export interface NetworkObserverLimits {
  max_events: number;
  max_requests: number;
  max_bytes: number;
  total_timeout_ms: number;
  request_timeout_ms: number;
  settle_ms: number;
}
export interface NetworkObserverInput {
  application_id: string;
  environment: EnvironmentPolicy;
  target_url: string;
  /** Required even though this service is separate from the static crawler. */
  isolation: 'fresh_anonymous_dynamic_readonly';
  authorization: {
    read_only_acknowledged: true;
    navigation_urls: string[];
    script_urls: string[];
    presentation_urls: string[];
    api_read_urls: string[];
    allowed_ips?: string[];
    allow_public_network?: boolean;
    /** Subset of the fixed safe vocabulary: page, limit, offset, sort, order. */
    query_names?: string[];
    /** Explicit consent to retain catalog path words and derive multi-sample patterns. */
    structural_paths_acknowledged?: boolean;
  };
  limits?: Partial<NetworkObserverLimits>;
  tls_ca?: string;
  signal?: AbortSignal;
}
export interface ObservedNetworkEvent {
  id: string;
  execution_id: string;
  view_id: string;
  request_type: 'fetch' | 'xhr' | 'other';
  method: string;
  endpoint_ref: string;
  scope_status: 'authorized' | 'denied' | 'undetermined';
  outcome: 'responded' | 'blocked' | 'inconclusive';
  browser_outcome: 'finished' | 'failed' | 'blocked' | 'undetermined';
  http_status?: number;
  reason?: string;
  observed_at: string;
  duration_ms: number;
  query_names: string[];
  omitted_query_count: number;
  evidence_id: string;
}
export interface ObservedEndpoint {
  reference: string;
  method: string;
  event_ids: string[];
  view_ids: string[];
  states: Array<ObservedNetworkEvent['outcome']>;
  /** A derived structural observation, never an inferred requirement. */
  structural_pattern?: string;
  pattern_event_ids?: string[];
}
export interface NetworkObserverResult {
  execution_id: string;
  mode: 'fresh_anonymous_dynamic_readonly';
  status: 'partial' | 'indeterminate';
  inventory_complete: false;
  view: { id: string; route_ref: string; state: 'bounded_snapshot' | 'unsettled' | 'unavailable';
    dynamic_controls: number };
  events: ObservedNetworkEvent[];
  endpoints: ObservedEndpoint[];
  observations: ApplicationObservation[];
  evidence: MultimodalEvidenceRef[];
  batches: Array<{ index: number; event_ids: string[]; state: 'committed' | 'failed' | 'not_attempted' }>;
  warnings: string[];
  limits: NetworkObserverLimits;
  budget: ReconBudget & { denied_requests: number; dropped_events: number; deny_proxy_connections: number };
  cleanup: { browser_closed: boolean; proxy_closed: boolean };
}
export class NetworkObserverError extends Error {
  constructor(public readonly code: 'INVALID_INPUT' | 'CONTEXT_REQUIRED' | 'CONTEXT_CHANGED' | 'CLEANUP_FAILED') {
    super(`NetworkObserver: ${code}`);
    this.name = 'NetworkObserverError';
  }
}
