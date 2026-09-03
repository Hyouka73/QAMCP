/**
 * Archivo generado automaticamente a partir de execution-result.schema.json
 * No editar manualmente este archivo.
 */

/**
 * Schema for structured test execution results including execution ID, module, status, steps, timestamps, and screenshots
 */
export interface ExecutionResult {
  /**
   * Schema version for evolution tracking
   */
  _version: string;
  /**
   * Unique identifier for this execution run
   */
  execution_id: string;
  /**
   * Name or identifier of the executed module
   */
  module: string;
  /**
   * Overall status of the execution
   */
  status: "success" | "failure" | "error" | "timeout" | "skipped" | "cancelled";
  /**
   * List of execution steps with their individual results
   */
  steps?: {
    /**
     * Name or description of the step
     */
    name: string;
    /**
     * Status of this specific step
     */
    status: "success" | "failure" | "error" | "skipped";
    /**
     * Duration of this step in milliseconds
     */
    duration_ms?: number;
    /**
     * Optional message or error details for this step
     */
    message?: string;
    /**
     * Path or reference to screenshot taken during this step
     */
    screenshot?: string;
  }[];
  /**
   * Timestamps for key execution events
   */
  timestamps: {
    /**
     * ISO 8601 timestamp when execution started
     */
    started_at: string;
    /**
     * ISO 8601 timestamp when execution ended
     */
    ended_at?: string;
  };
  /**
   * List of screenshots captured during execution
   */
  screenshots?: {
    /**
     * File path or URL to the screenshot
     */
    path: string;
    /**
     * ISO 8601 timestamp when screenshot was captured
     */
    timestamp?: string;
    /**
     * Context or reason for capturing this screenshot
     */
    context?: string;
  }[];
  /**
   * Additional metadata about the execution
   */
  metadata?: {};
}

export type ExecutionStep = NonNullable<ExecutionResult['steps']>[number];
export type Timestamps = ExecutionResult['timestamps'];
export type Screenshot = NonNullable<ExecutionResult['screenshots']>[number];
