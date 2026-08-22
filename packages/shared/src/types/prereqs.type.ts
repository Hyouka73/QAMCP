/**
 * Prerequisites Configuration Type
 * 
 * Corresponds to prereqs.schema.json
 * Schema for prereqs.yaml - module prerequisites including auth requirements, state setup, timeouts, and teardown stubs
 */
export interface Prereqs {
  _version: string;
  module: string;
  requires: Requirements;
  execution_timeout_ms?: number;
  teardown?: Teardown;
}

export interface Requirements {
  auth: AuthRequirements;
  state?: StatePrerequisite[];
}

export interface AuthRequirements {
  primary: string;
  available?: string[];
}

export interface StatePrerequisite {
  description: string;
  setup: string;
}

export interface Teardown {
  on_completion?: string[];
  on_failure?: string[];
}
