/**
 * Archivo generado automaticamente a partir de environments.schema.json
 * No editar manualmente este archivo.
 */

/**
 * Schema for environments.yaml - map of environments with URL and browser mode settings
 */
export interface Environments {
  /**
   * Schema version for evolution tracking
   */
  _version: string;
  /**
   * Map of environment names to their configurations
   */
  environments: {
    [k: string]: {
      /**
       * Base URL for the environment
       */
      url: string;
      /**
       * Browser execution mode
       */
      browser_mode?: "auto" | "headless" | "headed";
    };
  };
  /**
   * Name of the default environment to use
   */
  default: string;
}

export interface EnvironmentConfig {
  url: string;
  browser_mode?: 'auto' | 'headless' | 'headed';
}
