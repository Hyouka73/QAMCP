/**
 * Module Specification Type
 * 
 * Defines the specification for a module to be discovered.
 * Includes module identification and discovery parameters.
 */
export interface ModuleSpec {
  name: string;
  path?: string;
  tags?: string[];
  options?: Record<string, unknown>;
}
