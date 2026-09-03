/**
 * Archivo generado automaticamente a partir de module-context.schema.json
 * No editar manualmente este archivo.
 */

/**
 * Schema for context.yaml of a module - objective, users, routes, risks, notes, sensitive selectors, and PRD source
 */
export interface ModuleContext {
  /**
   * Schema version for evolution tracking
   */
  _version: string;
  /**
   * Primary objective or goal of this module
   */
  objective: string;
  /**
   * List of user types or roles involved in this module
   */
  users?: string[];
  /**
   * List of routes or paths covered by this module
   */
  routes?: string[];
  /**
   * List of identified risks for this module
   */
  risks?: string[];
  /**
   * Additional notes or context for this module
   */
  notes?: string;
  /**
   * List of CSS selectors that target sensitive data (passwords, PII, etc.)
   */
  sensitive_selectors?: string[];
  /**
   * Indicates if this context file has been manually edited by a human
   */
  manually_edited: boolean;
  /**
   * Optional reference to the Product Requirements Document source
   */
  prd_source?: string;
}
