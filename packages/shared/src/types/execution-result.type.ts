/**
 * Execution Result Configuration Type
 * 
 * Corresponds to execution-result.schema.json
 * Schema for structured test execution results including execution ID, module, status, steps, timestamps, and screenshots
 */
export interface ExecutionResult {
  _version: string;
  execution_id: string;
  module: string;
  status: 'success' | 'failure' | 'error' | 'timeout' | 'skipped' | 'cancelled';
  steps?: ExecutionStep[];
  timestamps: Timestamps;
  screenshots?: Screenshot[];
  metadata?: Record<string, unknown>;
}

export interface ExecutionStep {
  name: string;
  status: 'success' | 'failure' | 'error' | 'skipped';
  duration_ms?: number;
  message?: string;
  screenshot?: string;
}

export interface Timestamps {
  started_at: string;
  ended_at?: string;
}

export interface Screenshot {
  path: string;
  timestamp?: string;
  context?: string;
}
