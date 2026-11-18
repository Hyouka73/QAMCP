import type { ApplicationObservation, EnvironmentPolicy, MultimodalEvidenceRef } from '@qap/shared';

export type ReconErrorCode = 'INVALID_INPUT' | 'CONTEXT_REQUIRED' | 'CONTEXT_CHANGED' | 'PERSISTENCE_FAILED'
  | 'SCOPE_BLOCKED' | 'NETWORK_BLOCKED' | 'DNS_FAILED' | 'PEER_MISMATCH' | 'REQUEST_LIMIT'
  | 'REDIRECT_LIMIT' | 'TIMEOUT' | 'BODY_LIMIT' | 'TRUNCATED' | 'CONTENT_ENCODING'
  | 'NETWORK_FAILED' | 'TLS_FAILED';

/** Never includes URLs, response values, driver messages or an unsafe cause. */
export class ReconnaissanceError extends Error {
  constructor(public readonly code: ReconErrorCode) {
    super(`Reconnaissance: ${code}`);
    this.name = 'ReconnaissanceError';
  }
}

export interface ReconLimits {
  max_requests: number;
  request_timeout_ms: number;
  total_timeout_ms: number;
  max_received_bytes: number;
  max_decoded_bytes: number;
  max_retained_bytes: number;
  max_redirects: number;
}

export interface ReconnaissanceInput {
  application_id: string;
  environment: EnvironmentPolicy;
  target_url: string;
  authorization: {
    /** Exact URLs, including path/query. GET consent per resource, also for redirects. */
    allowed_urls: string[];
    /** Exact addresses for local/private networks. No implicit localhost permission. */
    allowed_ips?: string[];
    allow_public_network?: boolean;
  };
  limits?: Partial<ReconLimits>;
  /** Custom trust anchor; validation and hostname checks remain mandatory. */
  tls_ca?: string;
}

export interface ReconBudget {
  requests: number;
  received_bytes: number;
  decoded_bytes: number;
  retained_bytes: number;
  elapsed_ms: number;
  concurrency: 1;
  retries: 0;
}

export interface TlsFindings {
  validated: boolean;
  hostname_matches: boolean | 'undetermined';
  protocol?: string;
  /** Identity attributes are normalized and hashed to avoid arbitrary certificate text. */
  subject_sha256?: string;
  issuer_sha256?: string;
  fingerprint_sha256?: string;
  valid_from?: string;
  valid_to?: string;
  error?: 'TLS_FAILED';
}

export interface HttpFindings {
  status: number;
  content_type: 'html' | 'text' | 'xml' | 'json' | 'other' | 'absent';
  security_headers: {
    hsts: boolean; csp: boolean; frame_options: boolean; content_type_options: boolean;
    referrer_policy: boolean; permissions_policy: boolean;
  };
  hsts?: { max_age?: number; include_subdomains: boolean; preload: boolean };
  csp_directives: string[];
  frame_options?: 'deny' | 'sameorigin' | 'other';
  nosniff: boolean;
  cors: 'absent' | 'wildcard' | 'scoped';
  cors_credentials: boolean;
  cookies: { count: number; secure: number; http_only: number; same_site: number };
}

export interface TechnologySignal {
  id: string;
  source: 'http_header' | 'html_metadata' | 'html_resource';
}
export interface TechnologyCandidate {
  name: 'Next.js' | 'React' | 'Angular' | 'Vue' | 'WordPress' | 'Express' | 'nginx' | 'Apache';
  status: 'candidate';
  strength: 'suggestive' | 'strong';
  signal_ids: string[];
}

export interface ReconResource {
  resource: 'target' | 'robots' | 'sitemap';
  requested_url: string;
  effective_url: string;
  state: 'exists' | 'absent' | 'blocked' | 'unavailable' | 'limited';
  reason?: ReconErrorCode;
  failed_url?: string;
  redirects: Array<{ from: string; to: string; status: number }>;
  http?: HttpFindings;
  tls?: TlsFindings;
  /** Counts only: never retain discovered paths, user agent values or locations. */
  discovery?: { allow_rules?: number; disallow_rules?: number; sitemap_hints?: number;
    locations?: number; nested_sitemaps?: number; format: 'robots' | 'sitemap' | 'unexpected' };
  signals: TechnologySignal[];
}

export interface ReconnaissanceResult {
  execution_id: string;
  status: 'completed' | 'partial' | 'indeterminate';
  requested_url: string;
  effective_url: string;
  resources: ReconResource[];
  technologies: { state: 'candidates' | 'undetermined'; candidates: TechnologyCandidate[] };
  observations: ApplicationObservation[];
  evidence: MultimodalEvidenceRef[];
  warnings: string[];
  budget: ReconBudget;
  limits: ReconLimits;
}

/** DNS is the sole network injection boundary; transport and peer checks stay real. */
export type ReconResolver = (hostname: string) => Promise<Array<{ address: string; family: number }>>;
