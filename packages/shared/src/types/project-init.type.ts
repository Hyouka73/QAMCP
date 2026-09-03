/**
 * Archivo generado automaticamente a partir de project-init.schema.json
 * No editar manualmente este archivo.
 */

/**
 * Schema for non-interactive qap init configuration (project name, environments, flags)
 */
export interface ProjectInit {
  /**
   * Schema version for evolution tracking
   */
  _version: string;
  /**
   * Name of the QAP project
   */
  projectName: string;
  /**
   * List of environment names to initialize
   */
  environments?: string[];
  /**
   * Initialization flags
   */
  flags?: {
    /**
     * Skip Git repository initialization
     */
    skipGit?: boolean;
    /**
     * Skip dependency installation
     */
    skipInstall?: boolean;
    /**
     * Template to use for project initialization
     */
    template?: string;
  };
}
