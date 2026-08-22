/**
 * Multi-Module Flow Definition Type
 * 
 * Corresponds to flow.schema.json
 * Schema for flow.yaml - defines a multi-module flow with modules, context sharing, execution settings, and teardown configuration
 */
export interface Flow {
  _version: string;
  name: string;
  description?: string;
  modules: FlowModule[];
  context_sharing?: ContextSharing[];
  execution_timeout_ms?: number;
  fail_fast?: boolean;
  teardown?: FlowTeardown | null;
}

export interface FlowModule {
  module: string;
  tags?: string[];
  cases?: string[];
  depends_on?: string[];
}

export interface ContextSharing {
  capture: string;
  from_module: string;
  from_case: string;
  as: string;
}

export interface FlowTeardown {
  on_failure?: TeardownAction[];
}

export interface TeardownAction {
  type: string;
  action?: string;
}
