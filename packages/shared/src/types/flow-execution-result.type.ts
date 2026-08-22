/**
 * Flow Execution Result Type
 * 
 * Represents the result of a flow execution.
 */
export interface FlowExecutionResult {
  flow_name: string;
  status: 'success' | 'failure' | 'error' | 'timeout' | 'cancelled';
  modules: ModuleExecutionResult[];
  timestamps: {
    started_at: string;
    ended_at: string;
  };
  context_shared?: Record<string, unknown>;
  error?: string;
}

export interface ModuleExecutionResult {
  module: string;
  status: 'success' | 'failure' | 'error' | 'skipped' | 'pending';
  cases?: ExecutionResultSummary[];
  error?: string;
}

export interface ExecutionResultSummary {
  case_id: string;
  status: 'success' | 'failure' | 'error' | 'skipped';
  duration_ms?: number;
}
