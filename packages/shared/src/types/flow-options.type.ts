/**
 * Flow Options Type
 * 
 * Configuration options for flow execution.
 */
export interface FlowOptions {
  environment?: string;
  headless?: boolean;
  timeout_ms?: number;
  screenshot_on_failure?: boolean;
  video_on_failure?: boolean;
  trace?: 'on' | 'off' | 'on-first-retry';
  retries?: number;
}
