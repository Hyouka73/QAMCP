/**
 * Authentication Profiles Configuration Type
 * 
 * Corresponds to auth-profiles.schema.json
 * Schema for profiles.json - array of authentication profiles with credentials and session management
 */
export interface AuthProfiles {
  _version: string;
  profiles: AuthProfile[];
}

export interface AuthProfile {
  id: string;
  env: string;
  username: string;
  credential_source: 'keychain' | 'env';
  login_mode: 'auto' | 'handoff';
  login_route?: string;
  session_cache?: {
    enabled?: boolean;
    ttl_ms?: number;
  };
  post_login_condition?: PostLoginCondition;
}

export interface PostLoginCondition {
  type: 'url_contains' | 'url_equals' | 'selector_visible' | 'selector_exists';
  value: string;
}
