/**
 * Environments Configuration Type
 * 
 * Corresponds to environments.schema.json
 * Schema for environments.yaml - map of environments with URL and browser mode settings
 */
export interface Environments {
  _version: string;
  environments: Record<string, EnvironmentConfig>;
  default: string;
}

export interface EnvironmentConfig {
  url: string;
  browser_mode?: 'auto' | 'headless' | 'headed';
}
