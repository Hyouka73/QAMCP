/**
 * Tipos TypeScript para la arquitectura granular de Knowledge (Sprint 5)
 */

export interface ModuleViewContext {
  _version: '1';
  view_name: string;
  description: string;
  path: string;
  tags: string[];
  playwright_used: boolean;
  playwright_error: string | null;
  discovered_at: string;
  page_title: string;
  routes_found: string[];
  invariants?: string[];
}

export interface ModuleViewSelectors {
  _version: '1';
  view: string;
  module: string;
  generated_at: string;
  selectors: {
    forms: Array<{ id: string; action?: string; fields: string[] }>;
    buttons: Array<{ label: string; selector: string; role?: string }>;
    inputs: Array<{ name: string; type: string; selector: string }>;
  };
}

export interface ModuleSummary {
  _version: '1';
  name: string;
  description: string;
  path: string;
  tags: string[];
  views: string[];
  last_updated: string;
}

export interface KnowledgeIndex {
  name: string;
  path: string;
  tags: string[];
  views: string[];
  last_updated: string;
}
