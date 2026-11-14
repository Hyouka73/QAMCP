/**
 * Test Options Type
 * 
 * Configuration options for test execution.
 */
export interface TestOptions {
  environment?: string;
  headless?: boolean;
  slow_mo?: number;
  timeout_ms?: number;
  screenshot_on_failure?: boolean;
  video_on_failure?: boolean;
  trace?: 'on' | 'off' | 'on-first-retry';
  retries?: number;
  context_data?: Record<string, unknown>;
  /**
   * True when the caller (e.g. FlowOrchestrator) already holds the module lock(s),
   * so the runner must not re-acquire the module lock internally.
   */
  lock_owned_by_caller?: boolean;
}
