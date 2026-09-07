/**
 * Authentication Profiles Configuration Type
 * 
 * Corresponds to auth-profiles.schema.json
 * Schema for profiles.json - array of authentication profiles with credentials and session management
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
