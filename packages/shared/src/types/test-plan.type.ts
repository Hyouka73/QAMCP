/**
 * Test Plan Type
 * 
 * Defines a plan for test execution, including modules, cases, and execution settings.
 */
export interface TestPlan {
  modules: string[];
  cases?: string[];
  tags?: string[];
  environment?: string;
  parallel?: boolean;
  max_workers?: number;
  timeout_ms?: number;
  fail_fast?: boolean;
}
