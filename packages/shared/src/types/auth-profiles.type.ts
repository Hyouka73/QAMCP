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
  credential_source: 'keychain' | 'env' | 'vault' | 'ephemeral';
  env_var?: string;
  application_id?: string;
  login_mode: 'auto' | 'handoff';
  login_origin?: string;
  verification_route?: string;
  token_exchange_route?: string;
  challenge_selector?: string;
  form_selectors?: {
    username: string;
    password: string;
    submit: string;
  };
  login_route?: string;
  handoff_timeout_ms?: number;
  handoff_message?: string;
  role?: string;
  alias?: string;
  aliases?: string[];
  scenario?: string;
  scenarios?: string[];
  privileged?: boolean;
  previous_accounts?: PreviousAccountReference[];
  verified?: boolean;
  verified_at?: string;
  verified_route?: string;
  session_cache?: {
    enabled?: boolean;
    ttl_ms?: number;
  };
  post_login_condition?: PostLoginCondition;
}

export interface PreviousAccountReference {
  username: string;
  changed_at: string;
  credential_handling: 'preserved' | 'revoked' | 'not_configured';
}

export interface PostLoginCondition {
  type: 'url_contains' | 'selector_present';
  value: string;
}