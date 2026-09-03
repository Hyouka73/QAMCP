/**
 * Archivo generado automaticamente a partir de tc-case.schema.json
 * No editar manualmente este archivo.
 */

/**
 * Schema for TC-*.yaml files - defines a test case with id, name, tags, dependencies, and steps
 */
export interface TCCase {
  /**
   * Schema version for evolution tracking
   */
  _version: string;
  /**
   * Unique identifier (UUID) for the test case
   */
  id: string;
  /**
   * Name of the test case
   */
  name: string;
  /**
   * Tags associated with the test case
   */
  tags?: string[];
  /**
   * Other test cases this case depends on
   */
  depends_on?: string[];
  /**
   * List of steps to execute in this test case
   */
  steps: {
    /**
     * Type of action to perform
     */
    type:
      | "navigate"
      | "fill"
      | "click"
      | "assert"
      | "waitFor"
      | "screenshot"
      | "capture"
      | "switch_auth"
      | "evaluate"
      | "intercept_network";
    /**
     * CSS selector or logical selector name for the target element
     */
    selector?: string;
    /**
     * Value to fill or use in the action
     */
    value?: string;
    /**
     * URL to navigate to (for navigate type)
     */
    url?: string;
    /**
     * Timeout in milliseconds for wait actions
     */
    timeout?: number;
    /**
     * Expected value for assertions
     */
    expected?: string;
    /**
     * Type of assertion to perform
     */
    assertion_type?: "equals" | "contains" | "visible" | "exists" | "not_visible" | "not_exists";
    /**
     * Filename for screenshot (optional, auto-generated if not provided)
     */
    filename?: string;
    /**
     * Variable name to store captured value as
     */
    capture_as?: string;
    /**
     * Auth profile name to switch to (for switch_auth type)
     */
    auth_profile?: string;
    /**
     * JavaScript expression to evaluate (for evaluate type)
     */
    expression?: string;
    /**
     * Configuration for network interception
     */
    intercept_config?: {
      /**
       * URL pattern to intercept
       */
      url_pattern?: string;
      /**
       * HTTP method to intercept
       */
      method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
      /**
       * Response to return instead
       */
      response_override?: {
        status?: number;
        body?: string;
      };
    };
    /**
     * Optional description of what this step does
     */
    description?: string;
  }[];
}

export type TCStep = TCCase['steps'][number];
export type TCStepType = TCStep['type'];
export type AssertionType = 'element_present' | 'element_text' | 'url_match' | 'js_expression';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
export type InterceptConfig = NonNullable<TCStep['intercept_config']>;
