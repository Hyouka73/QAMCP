import type { AuthCredentials } from './types.js';

export type CredentialState = 'available' | 'not_configured' | 'unlock_required' | 'unavailable' | 'invalid';
export type CredentialErrorCode = 'INVALID_INPUT' | 'UNAVAILABLE' | 'LOCKED' | 'INVALID_VAULT' | 'UNSUPPORTED_VERSION' | 'UNSAFE_PATH' | 'BUSY' | 'IO_ERROR';

/** Errors deliberately contain neither backend errors nor user-controlled data. */
export class CredentialError extends Error {
  constructor(public readonly code: CredentialErrorCode) {
    super(`Credential operation failed: ${code}`);
    this.name = 'CredentialError';
  }
}

export interface CredentialReference {
  projectId: string;
  applicationId: string;
  environment: string;
  auth_profile_id: string;
  account: string;
}

/** Privileged port: only the operational state/reference may enter agent knowledge. */
export interface ICredentialProvider {
  get(reference: CredentialReference): Promise<AuthCredentials | null>;
  set(reference: CredentialReference, credentials: AuthCredentials): Promise<void>;
  delete(reference: CredentialReference): Promise<boolean>;
  close(): void;
}

export function referenceKey(ref: CredentialReference): string {
  const values = [ref.projectId, ref.applicationId, ref.environment, ref.auth_profile_id, ref.account];
  if (values.some((v) => typeof v !== 'string' || !v.length || v.length > 256 || Array.from(v).some((character) => character.charCodeAt(0) < 32))) {
    throw new CredentialError('INVALID_INPUT');
  }
  return JSON.stringify(values);
}

export function validateCredentials(value: AuthCredentials): AuthCredentials {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(value) as object | null) ||
      Object.keys(value).some((k) => !['username', 'password', 'token'].includes(k)) ||
      Object.values(value).some((v) => typeof v !== 'string' || v.length > 65536) ||
      (!value.password && !value.token)) throw new CredentialError('INVALID_INPUT');
  return { ...value };
}

export function credentialState(error: unknown): CredentialState {
  if (error instanceof CredentialError) {
    if (error.code === 'LOCKED') return 'unlock_required';
    if (['INVALID_VAULT', 'UNSUPPORTED_VERSION', 'INVALID_INPUT', 'UNSAFE_PATH'].includes(error.code)) return 'invalid';
  }
  return 'unavailable';
}
