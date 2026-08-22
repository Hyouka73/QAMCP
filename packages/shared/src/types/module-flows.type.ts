/**
 * Module Flows Configuration Type
 * 
 * Corresponds to module-flows.schema.json
 * Schema for module-flows.yaml - defines flows within a module with manual edit tracking
 */
export interface ModuleFlows {
  _version: string;
  manually_edited: boolean;
  flows?: FlowItem[];
}

export interface FlowItem {
  name: string;
  description?: string;
  tags?: string[];
  cases?: string[];
  depends_on?: string[];
}
