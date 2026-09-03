/**
 * Archivo generado automaticamente a partir de flow.schema.json
 * No editar manualmente este archivo.
 */

/**
 * Schema for flow.yaml - defines a multi-module flow with modules, context sharing, execution settings, and teardown configuration
 */
export interface Flow {
  /**
   * Schema version for evolution tracking
   */
  _version: string;
  /**
   * Name of the flow
   */
  name: string;
  /**
   * Description of the flow
   */
  description?: string;
  /**
   * List of modules in this flow
   */
  modules: {
    /**
     * Name or identifier of the module
     */
    module: string;
    /**
     * Tags associated with this module in the flow
     */
    tags?: string[];
    /**
     * Test cases to execute from this module
     */
    cases?: string[];
    /**
     * Other modules this module depends on within the flow
     */
    depends_on?: string[];
  }[];
  /**
   * Configuration for sharing context between modules
   */
  context_sharing?: {
    /**
     * What to capture (e.g., variable name, selector output)
     */
    capture: string;
    /**
     * Source module to capture from
     */
    from_module: string;
    /**
     * Source test case to capture from
     */
    from_case: string;
    /**
     * Alias or name to store the captured value as
     */
    as: string;
  }[];
  /**
   * Maximum execution time for the entire flow in milliseconds
   */
  execution_timeout_ms?: number;
  /**
   * If true, stop flow execution on first failure
   */
  fail_fast?: boolean;
  /**
   * Teardown configuration for cleanup actions
   */
  teardown?: {
    /**
     * Actions to execute when flow fails
     */
    on_failure?: {
      /**
       * Type of teardown action
       */
      type: string;
      /**
       * Specific action to perform
       */
      action?: string;
    }[];
  };
}

export type FlowModule = Flow['modules'][number];
export type ContextSharing = NonNullable<Flow['context_sharing']>[number];
export type FlowTeardown = NonNullable<Flow['teardown']>;
export type TeardownAction = NonNullable<NonNullable<Flow['teardown']>['on_failure']>[number];
