/**
 * Archivo generado automaticamente a partir de system-prompt.schema.json
 * No editar manualmente este archivo.
 */

/**
 * Schema for .qa/project/system-prompt.yaml - defines AI QA agent role, objectives, constraints, and default workflows
 */
export interface SystemPrompt {
  /**
   * Schema version for evolution tracking
   */
  _version: string;
  /**
   * Role definition and purpose for the QA Agent
   */
  role: string;
  /**
   * List of core objectives for the QA Agent
   */
  objectives: string[];
  /**
   * Rules and constraints the agent must adhere to
   */
  constraints: string[];
  /**
   * Predefined workflows for common tasks (discovery, testing, etc.)
   */
  default_workflows?: {
    [k: string]: string;
  };
}

export type DefaultWorkflows = NonNullable<SystemPrompt['default_workflows']>;
