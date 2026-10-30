import type { ApplicationObservation, MultimodalEvidenceRef } from '@qap/shared';

import type { NetworkObserverInput } from '../network-observer/types.js';

export type ObservationProbeKind = 'native_empty_validation' | 'protected_empty_submit';
export interface ActiveProbeLimits {
  trials: number;
  total_timeout_ms: number;
  trial_timeout_ms: number;
  action_window_ms: number;
  max_controls: number;
  max_dom_nodes: number;
  max_validation_events: number;
  max_dom_changes: number;
}
export interface ActiveProbeInput extends Omit<NetworkObserverInput, 'isolation' | 'limits' | 'authorization'> {
  isolation: 'fresh_anonymous_disposable';
  probe: ObservationProbeKind;
  authorization: NetworkObserverInput['authorization'] & {
    nonproduction_disposable_acknowledged: true;
    empty_validation_only: true;
    /** Explicit structural CSS, never automatically imported from crawler history.
     * Only tag > tag:nth-of-type(N) paths ending in form are accepted. */
    form_selector: string;
  };
  acquisition_limits?: NetworkObserverInput['limits'];
  limits?: Partial<ActiveProbeLimits>;
}
export interface ProbeStructure {
  visible: boolean;
  form_aria_invalid: boolean;
  valid: boolean;
  invalid_controls: number;
  controls: Array<{ tag: 'input' | 'select' | 'textarea' | 'button'; required: boolean;
    disabled: boolean; will_validate: boolean; valid: boolean; aria_invalid: boolean;
    constraints: string[]; invalid_categories: string[]; input_type?: string }>;
  nodes: number;
  error_indicators: number;
  no_validate: boolean;
  truncated: boolean;
}
export interface ProbeOutput {
  before: ProbeStructure;
  after: ProbeStructure;
  validation_events: number;
  submit_events: number;
  dom_changes: number;
  truncated: boolean;
  native_return?: boolean;
}
export interface ProbeTrial {
  session_id: string;
  status: 'executed' | 'blocked' | 'indeterminate';
  reason?: string;
  observed_at?: string;
  output?: ProbeOutput;
  acquisition_requests: number;
  denied_requests: number;
}
export interface ActiveProbeResult {
  execution_id: string;
  status: 'consistent' | 'inconsistent' | 'indeterminate' | 'blocked';
  trials: ProbeTrial[];
  observations: ApplicationObservation[];
  evidence: MultimodalEvidenceRef[];
  persistence: 'committed' | 'failed' | 'not_attempted';
  warnings: string[];
  limits: ActiveProbeLimits;
}
export class ActiveProbeError extends Error {
  constructor(public readonly code: 'INVALID_INPUT' | 'CONTEXT_REQUIRED' | 'CLEANUP_FAILED') {
    super(`ActiveProbe: ${code}`);
    this.name = 'ActiveProbeError';
  }
}
