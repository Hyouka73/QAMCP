import type { ApplicationObservation, EnvironmentPolicy, MultimodalEvidenceRef } from '@qap/shared';

import type { ReconBudget, ReconResolver } from '../reconnaissance/types.js';

export interface CrawlerLimits {
  max_pages: number;
  max_depth: number;
  total_timeout_ms: number;
  navigation_timeout_ms: number;
  max_requests: number;
  max_bytes: number;
  max_redirects: number;
  max_elements: number;
}
export interface BlackBoxCrawlerInput {
  application_id: string;
  environment: EnvironmentPolicy;
  target_url: string;
  authorization: {
    /** Privileged caller attests enumerated GETs are intended to be observational. */
    read_only_acknowledged: true;
    /** Exact GET navigation consent, including path/query. Never a domain-wide pattern. */
    navigation_urls: string[];
    allowed_ips?: string[];
    allow_public_network?: boolean;
  };
  /** Only this isolated, anonymous, non-scripted mode is supported. */
  isolation?: 'fresh_anonymous_static';
  limits?: Partial<CrawlerLimits>;
  tls_ca?: string;
  signal?: AbortSignal;
}
export interface CrawlerDependencies {
  resolver?: ReconResolver;
  /** Trusted executable selection only; no arbitrary launch arguments or user profiles. */
  browser?: { channel?: 'chrome' | 'msedge'; executable_path?: string };
}
export interface ObservedControl {
  index: number;
  tag: string;
  role?: string;
  input_type?: string;
  visibility: 'visible' | 'hidden' | 'not_evaluable';
  disabled: boolean;
  required_in_dom: boolean;
  selector_candidates: string[];
  selector_stability: 'unverified';
  form_index?: number;
  label?: string;
}
export interface CrawlerRoute {
  /** Per-execution keyed opaque reference: raw paths, queries and fragments are discarded. */
  route: string;
  depth: number;
  state: 'visited' | 'candidate' | 'blocked' | 'unavailable' | 'inconclusive' | 'redirected';
  authorized_index?: number;
  reason?: string;
  http_status?: number;
  view_id?: string;
}
export interface ObservedView {
  id: string;
  route: string;
  state: 'static_snapshot' | 'loading_or_script_dependent';
  evidence_id: string;
  controls: ObservedControl[];
  links: Array<{ target: string; control_index: number; authorized: boolean; label?: string }>;
  menus: number;
  headings: number;
  forms: Array<{ index: number; field_indices: number[]; submit_indices: number[]; method: 'get' | 'post' | 'other' }>;
  truncated: boolean;
}
export interface BlackBoxCrawlerResult {
  execution_id: string;
  status: 'completed' | 'partial' | 'blocked' | 'indeterminate';
  mode: 'fresh_anonymous_static';
  routes: CrawlerRoute[];
  views: ObservedView[];
  relations: Array<{ from: string; to: string; kind: 'link_candidate' | 'http_redirect' }>;
  observations: ApplicationObservation[];
  evidence: MultimodalEvidenceRef[];
  warnings: string[];
  derived_entities_deferred: true;
  budget: ReconBudget & { pages: number; blocked_browser_requests: number; deny_proxy_connections: number };
  limits: CrawlerLimits;
  cleanup: { browser_closed: boolean; proxy_closed: boolean };
}
export class BlackBoxCrawlerError extends Error {
  constructor(public readonly code: 'INVALID_INPUT' | 'CONTEXT_REQUIRED' | 'CONTEXT_CHANGED' | 'PERSISTENCE_FAILED' | 'CLEANUP_FAILED') {
    super(`BlackBoxCrawler: ${code}`);
    this.name = 'BlackBoxCrawlerError';
  }
}
