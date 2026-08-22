/**
 * Test Case Definition Type
 * 
 * Corresponds to tc-case.schema.json
 * Schema for TC-*.yaml files - defines a test case with id, name, tags, dependencies, and steps
 */
export interface TCCase {
  _version: string;
  id: string; // UUID format
  name: string;
  tags?: string[];
  depends_on?: string[] | null;
  steps: TCStep[];
}

export type TCStepType = 
  | 'navigate'
  | 'fill'
  | 'click'
  | 'assert'
  | 'waitFor'
  | 'screenshot'
  | 'capture'
  | 'switch_auth'
  | 'evaluate'
  | 'intercept_network';

export type AssertionType = 
  | 'equals'
  | 'contains'
  | 'visible'
  | 'exists'
  | 'not_visible'
  | 'not_exists';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface TCStep {
  type: TCStepType;
  selector?: string;
  value?: string;
  url?: string;
  timeout?: number;
  expected?: string;
  assertion_type?: AssertionType;
  filename?: string;
  capture_as?: string;
  auth_profile?: string;
  expression?: string;
  intercept_config?: InterceptConfig;
  description?: string;
}

export interface InterceptConfig {
  url_pattern?: string;
  method?: HttpMethod;
  response_override?: {
    status?: number;
    body?: string;
  };
}
