/* eslint-disable @typescript-eslint/require-await -- Async provider port also supports synchronous in-memory and file transactions. */
import { createHash } from 'node:crypto';

import { CredentialError, referenceKey, validateCredentials, type CredentialReference, type ICredentialProvider } from './credential-provider.js';
import type { AuthCredentials } from './types.js';

export class EphemeralCredentialProvider implements ICredentialProvider {
  private readonly entries = new Map<string, AuthCredentials>();
  async get(ref: CredentialReference): Promise<AuthCredentials | null> {
    const value = this.entries.get(referenceKey(ref));
    return value ? { ...value } : null;
  }
  async set(ref: CredentialReference, credentials: AuthCredentials): Promise<void> {
    this.entries.set(referenceKey(ref), validateCredentials(credentials));
  }
  async delete(ref: CredentialReference): Promise<boolean> { return this.entries.delete(referenceKey(ref)); }
  close(): void { this.entries.clear(); }
}

export interface KeychainBackend {
  getPassword(service: string, account: string): Promise<string | null>;
  setPassword(service: string, account: string, password: string): Promise<void>;
  deletePassword(service: string, account: string): Promise<boolean>;
}

/** Deferred optional native addon: importing @qap/auth never requires keytar. */
export class KeychainCredentialProvider implements ICredentialProvider {
  constructor(private readonly load: () => Promise<KeychainBackend> = async () => {
    const module = await import('keytar');
    return module.default;
  }) {}

  private service(ref: CredentialReference): string {
    const digest = createHash('sha256').update(referenceKey(ref)).digest('hex');
    return `qap.vnext.${digest}.${ref.auth_profile_id}`;
  }

  async get(ref: CredentialReference): Promise<AuthCredentials | null> {
    const service = this.service(ref);
    try {
      const value = await (await this.load()).getPassword(service, ref.account);
      // The old password-only representation is retained for existing consumers.
      return value ? { password: value } : null;
    } catch { throw new CredentialError('UNAVAILABLE'); }
  }
  async set(ref: CredentialReference, value: AuthCredentials): Promise<void> {
    const service = this.service(ref);
    const credentials = validateCredentials(value);
    // Keychain's legacy API stores a password only; tokens belong to another provider.
    if (!credentials.password || credentials.token || credentials.username) throw new CredentialError('INVALID_INPUT');
    try { await (await this.load()).setPassword(service, ref.account, credentials.password); }
    catch { throw new CredentialError('UNAVAILABLE'); }
  }
  async delete(ref: CredentialReference): Promise<boolean> {
    const service = this.service(ref);
    try { return await (await this.load()).deletePassword(service, ref.account); }
    catch { throw new CredentialError('UNAVAILABLE'); }
  }
  close(): void { /* Native keychain owns its lifecycle. */ }
}

/** Explicit selection; failure never changes the persistence backend. */
export class TieredCredentialVault {
  constructor(private readonly providers: Partial<Record<'keychain' | 'vault' | 'ephemeral', ICredentialProvider>> = {
    keychain: new KeychainCredentialProvider(), ephemeral: new EphemeralCredentialProvider(),
  }) {}
  provider(source: 'keychain' | 'vault' | 'ephemeral'): ICredentialProvider {
    const provider = Object.hasOwn(this.providers, source) ? this.providers[source] : undefined;
    if (!provider) throw new CredentialError(source === 'vault' ? 'LOCKED' : 'UNAVAILABLE');
    return provider;
  }
  close(): void { for (const provider of new Set(Object.values(this.providers))) provider?.close(); }
}
