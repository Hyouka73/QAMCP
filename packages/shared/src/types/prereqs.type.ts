/**
 * Archivo generado automaticamente a partir de prereqs.schema.json
 * No editar manualmente este archivo.
 */

/**
 * Schema for prereqs.yaml - module prerequisites including auth requirements, state setup, timeouts, and teardown stubs
 */
export interface Prereqs {
  /**
   * Schema version for evolution tracking
   */
  _version: string;
  /**
   * Name or identifier of the module these prerequisites belong to
   */
  module: string;
  /**
   * Requirements for module execution
   */
  requires: {
    /**
     * Authentication requirements
     */
    auth: {
      /**
       * Primary authentication profile ID required
       */
      primary: string;
      /**
       * List of alternative authentication profile IDs available
       */
      available?: string[];
    };
    /**
     * List of state prerequisites that must be set up before execution
     */
    state?: {
      /**
       * Description of the required state
       */
      description: string;
      /**
       * Instructions or command to set up this state
       */
      setup: string;
    }[];
  };
  /**
   * Maximum execution time in milliseconds before timeout
   */
  execution_timeout_ms?: number;
  /**
   * Teardown stub configuration for cleanup after execution
   */
  teardown?: {
    /**
     * Actions to perform on successful completion
     */
    on_completion?: string[];
    /**
     * Actions to perform on execution failure
     */
    on_failure?: string[];
  };
}

export type Requirements = Prereqs['requires'];
export type AuthRequirements = Requirements['auth'];
export type StatePrerequisite = NonNullable<Requirements['state']>[number];
export type Teardown = NonNullable<Prereqs['teardown']>;
