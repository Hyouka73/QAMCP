/**
 * Archivo generado automaticamente a partir de module-flows.schema.json
 * No editar manualmente este archivo.
 */

/**
 * Schema for module-flows.yaml - defines flows within a module with manual edit tracking
 */
export interface ModuleFlows {
  /**
   * Schema version for evolution tracking
   */
  _version: string;
  /**
   * Indicates if this module-flows file has been manually edited by a human
   */
  manually_edited: boolean;
  /**
   * List of flows defined within this module
   */
  flows?: {
    /**
     * Name of the flow
     */
    name: string;
    /**
     * Description of the flow
     */
    description?: string;
    /**
     * Tags associated with the flow
     */
    tags?: string[];
    /**
     * Test cases included in this flow
     */
    cases?: string[];
    /**
     * Other flows this flow depends on
     */
    depends_on?: string[];
  }[];
}

export type FlowItem = NonNullable<ModuleFlows['flows']>[number];
