/**
 * Tipos TypeScript para el contrato de resultado de ejecución (S5-001)
 * Refleja estrictamente el esquema draft-07 execution-result.schema.json
 */

export type ExecutionStatus = 'passed' | 'failed' | 'partial' | 'error';

export type CaseResult = 'passed' | 'failed' | 'skipped' | 'not_run';

export type FailureType =
  | 'assertion_failed'
  | 'execution_timeout'
  | 'selector_not_found'
  | 'network_error'
  | 'navigation_error'
  | 'auth_failed'
  | (string & {});

export interface ExecutionSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  not_run: number;
}

export interface ExecutedStep {
  step_index?: number;
  action: string;
  selector?: string | null;
  expected?: string | null;
  observed?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  duration_ms?: number;
  status: string;
  message?: string | null;
  screenshot?: string | null;
  focused_screenshot?: boolean;
  artifact_error?: string | null;
  redacted_selectors_count?: number;
}

export interface ExecutionArtifactError {
  artifact: string;
  case_id?: string | null;
  step_index?: number | null;
  message: string;
}

export interface ExecutionArtifactsManifest {
  video_path?: string | null;
  trace_zip_path?: string | null;
  timeline_path?: string | null;
  screenshots?: string[];
  artifact_errors?: ExecutionArtifactError[];
}

export interface ExecutionTimelineStep {
  step_index: number;
  case_id: string;
  action: string;
  selector?: string | null;
  expected?: string | null;
  observed?: string | null;
  status: string;
  started_at: string;
  finished_at: string;
  duration_ms: number;
  message?: string | null;
  screenshot?: string | null;
  focused_screenshot?: boolean;
  redacted_selectors_count?: number;
  artifact_error?: string | null;
}

export interface ExecutedCase {
  id: string;
  title: string;
  result: CaseResult;
  failure_type?: FailureType | null;
  not_run_reason?: string | null;
  duration_ms?: number;
  attempt_id?: string | null;
  video_path?: string | null;
  trace_zip_path?: string | null;
  timeline_path?: string | null;
  artifact_errors?: string[];
  steps?: ExecutedStep[];
  screenshots?: string[];
}

export interface ExecutionResult {
  _version: '1';
  execution_id: string;
  module: string;
  env: string;
  started_at: string;
  finished_at: string;
  result: ExecutionStatus;
  timed_out: boolean;
  summary: ExecutionSummary;
  attempt_id?: string | null;
  artifacts?: ExecutionArtifactsManifest;
  timeline?: ExecutionTimelineStep[];
  cases: ExecutedCase[];
}

// Aliases para compatibilidad con código existente
export type ExecutionStep = ExecutedStep;
export type Timestamps = {
  started_at: string;
  finished_at?: string;
  ended_at?: string;
};
export type Screenshot = string;
