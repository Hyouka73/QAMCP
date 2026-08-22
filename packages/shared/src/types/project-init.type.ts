/**
 * ProjectInit Configuration Type
 * 
 * Corresponds to project-init.schema.json
 * Schema for non-interactive qap init configuration (project name, environments, flags)
 */
export interface ProjectInit {
  _version: string;
  projectName: string;
  environments?: string[];
  flags?: {
    skipGit?: boolean;
    skipInstall?: boolean;
    template?: string;
  };
}
