/**
 * Archivo generado automaticamente a partir de auth-profiles.schema.json
 * No editar manualmente este archivo.
 */

/**
 * Schema for profiles.json - array of authentication profiles with credentials and session management
 */
export interface AuthProfiles {
  /**
   * Schema version for evolution tracking
   */
  _version: string;
  /**
   * List of authentication profiles
   */
  profiles: {
    /**
     * Unique identifier for this profile
     */
    id: string;
    /**
     * Environment this profile applies to
     */
    env: string;
    /**
     * Username for authentication
     */
    username: string;
    /**
     * Source of credentials (keychain or environment variable)
     */
    credential_source: "keychain" | "env";
    /**
     * Login mode - auto for automated login, handoff for manual intervention
     */
    login_mode: "auto" | "handoff";
    /**
     * Route or path for the login page
     */
    login_route?: string;
    /**
     * Session caching configuration
     */
    session_cache?: {
      enabled?: boolean;
      /**
       * Time-to-live for cached session in milliseconds
       */
      ttl_ms?: number;
    };
    /**
     * Condition to verify successful login
     */
    post_login_condition?: {
      /**
       * Type of condition to check
       */
      type: "url_contains" | "url_equals" | "selector_visible" | "selector_exists";
      /**
       * Value to match against (URL pattern or selector)
       */
      value: string;
    };
  }[];
}

export type AuthProfile = AuthProfiles['profiles'][number];
export type PostLoginCondition = NonNullable<AuthProfile['post_login_condition']>;
