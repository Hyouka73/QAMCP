/**
 * Archivo generado automaticamente a partir de rules.schema.json
 * No editar manualmente este archivo.
 */

/**
 * Schema for rules.yaml of a module - defines validation or business rules with manual edit tracking
 */
export interface Rules {
  /**
   * Schema version for evolution tracking
   */
  _version: string;
  /**
   * Indicates if this rules file has been manually edited by a human
   */
  manually_edited: boolean;
  /**
   * List of rules defined for this module
   */
  rules?: {
    /**
     * Unique identifier for the rule
     */
    id: string;
    /**
     * Human-readable description of the rule
     */
    description: string;
    /**
     * Condition expression for the rule
     */
    condition?: string;
    /**
     * Action to take when rule is triggered
     */
    action?: string;
    /**
     * Severity level of the rule
     */
    severity?: "low" | "medium" | "high" | "critical";
    /**
     * Tags associated with the rule
     */
    tags?: string[];
  }[];
}

export type Rule = NonNullable<Rules['rules']>[number];
