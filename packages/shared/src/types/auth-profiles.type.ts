/**
 * Archivo generado automaticamente a partir de auth-profiles.schema.json
 * No editar manualmente este archivo.
 */

export interface AuthProfiles {
  _version: '1';
  profiles: AuthProfile[];
}

export interface AuthProfile {
  id: string;
  env: string;
  username: string;
  credential_source: 'keychain' | 'env';
  env_var?: string;
  login_mode: 'auto' | 'handoff';
  login_route?: string;
  handoff_timeout_ms?: number;
  session_cache?: {
    enabled?: boolean;
    ttl_ms?: number;
  };
  post_login_condition?: PostLoginCondition;
}

export interface PostLoginCondition {
  type: 'url_contains' | 'selector_present';
  value: string;
}