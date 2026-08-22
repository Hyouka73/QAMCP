/**
 * Module Type
 * 
 * Represents a discovered module with its metadata and test cases.
 */
export interface Module {
  name: string;
  path: string;
  description?: string;
  tags?: string[];
  cases: string[];
  flows?: string[];
  context?: Record<string, unknown>;
}
