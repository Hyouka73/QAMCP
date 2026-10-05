/**
 * Tipos TypeScript para el contexto de vista (.qa/modules/<name>/views/<view>/context.yaml) (E5b)
 */

export interface ModuleViewData {
  _version: string;
  view_name: string;
  description: string;
  path: string;
  current_url: string;
  tags: string[];
  is_auth_view: boolean;
  session_saved: boolean;
  storage_state_used: boolean;
  playwright_used: boolean;
  playwright_error: string | null;
  discovered_at: string;
  page_title: string;
  routes_found: string[];
}
