/**
 * Module Context Configuration Type
 * 
 * Corresponds to module-context.schema.json
 * Schema for context.yaml of a module - objective, users, routes, risks, notes, sensitive selectors, and PRD source
 */
export interface ModuleContext {
  _version: string;
  objective: string;
  users?: string[];
  routes?: string[];
  risks?: string[];
  notes?: string;
  sensitive_selectors?: string[];
  manually_edited: boolean;
  prd_source?: string;
}
