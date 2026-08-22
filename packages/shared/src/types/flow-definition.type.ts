/**
 * Flow Definition Type
 * 
 * Defines a flow execution with modules and configuration.
 */
export interface FlowDefinition {
  name: string;
  description?: string;
  modules: FlowModuleRef[];
  context_sharing?: ContextSharingDef[];
  execution_timeout_ms?: number;
  fail_fast?: boolean;
}

export interface FlowModuleRef {
  module: string;
  tags?: string[];
  cases?: string[];
  depends_on?: string[];
}

export interface ContextSharingDef {
  capture: string;
  from_module: string;
  from_case: string;
  as: string;
}
