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
  action: string;
  selector?: string | null;
  duration_ms?: number;
  status: string;
  message?: string | null;
  screenshot?: string | null;
}

export interface ExecutedCase {
  id: string;
  title: string;
  result: CaseResult;
  failure_type?: FailureType | null;
  not_run_reason?: string | null;
  duration_ms?: number;
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
