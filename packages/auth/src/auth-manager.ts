import { createHash } from 'node:crypto';
import { realpathSync } from 'node:fs';

import type { AuthProfile } from '@qap/shared';

import { CredentialError, credentialState, validateCredentials, type CredentialReference, type CredentialState } from './credential-provider.js';
import { readProfile } from './profiles-store.js';
import { TieredCredentialVault } from './providers.js';
import { safeProfileId } from './secure-files.js';
import type { AuthCredentials } from './types.js';

export interface AuthManagerOptions {
  vault?: TieredCredentialVault;
  /** Stable caller-managed namespace permits intentional relocation of a portable vault. */
  projectId?: string;
  applicationId?: string;
}

export class AuthManager {
  private readonly projectId: string;
  private readonly vault: TieredCredentialVault;
  constructor(private readonly projectPath: string = process.cwd(), private readonly options: AuthManagerOptions = {}) {
    this.projectId = options.projectId ?? createHash('sha256').update(realpathSync(projectPath)).digest('hex');
    this.vault = options.vault ?? new TieredCredentialVault();
  }

  private reference(profile: AuthProfile): CredentialReference {
    return { projectId: this.projectId, applicationId: profile.application_id ?? this.options.applicationId ?? 'default',
      environment: profile.env, auth_profile_id: profile.id, account: profile.username };
  }

  private async profile(id: string): Promise<AuthProfile | null> {
    safeProfileId(id);
    try { return await readProfile(id, this.projectPath); }
    catch (error) { if (error instanceof CredentialError) throw error; throw new CredentialError('INVALID_INPUT'); }
  }

  private async invoke<T>(operation: () => Promise<T>): Promise<T> {
    try { return await operation(); }
    catch (error) { if (error instanceof CredentialError) throw error; throw new CredentialError('UNAVAILABLE'); }
  }

  async getCredentials(profileId: string): Promise<AuthCredentials | null> {
    const profile = await this.profile(profileId);
    if (!profile) return null;
    if (profile.credential_source === 'env') {
      if (profile.env_var && !/^[A-Za-z_][A-Za-z0-9_]*$/.test(profile.env_var)) throw new CredentialError('INVALID_INPUT');
      const token = profile.env_var ? process.env[profile.env_var] : undefined;
      return token ? validateCredentials({ token }) : null;
    }
    if (!['keychain', 'vault', 'ephemeral'].includes(profile.credential_source)) throw new CredentialError('INVALID_INPUT');
    const result = await this.invoke(() => this.vault.provider(profile.credential_source as 'keychain' | 'vault' | 'ephemeral').get(this.reference(profile)));
    return result ? validateCredentials(result) : null;
  }

  async setSecret(profileId: string, password: string): Promise<void> {
    const profile = await this.profile(profileId);
    if (!profile || profile.credential_source === 'env') throw new CredentialError('INVALID_INPUT');
    await this.invoke(() => this.vault.provider(profile.credential_source as 'keychain' | 'vault' | 'ephemeral').set(this.reference(profile), { password }));
  }

  /** Presence only: remote expiry/validity cannot be inferred without an authorized login. */
  async hasValidCredentials(profileId: string): Promise<boolean> {
    return (await this.getCredentials(profileId)) !== null;
  }

  async getCredentialStatus(profileId: string): Promise<{ auth_profile_id: string; state: CredentialState }> {
    safeProfileId(profileId);
    try { return { auth_profile_id: profileId, state: await this.hasValidCredentials(profileId) ? 'available' : 'not_configured' }; }
    catch (error) { return { auth_profile_id: profileId, state: credentialState(error) }; }
  }

  async deleteSecret(profileId: string): Promise<boolean> {
    const profile = await this.profile(profileId);
    if (!profile) return false;
    if (profile.credential_source === 'env') throw new CredentialError('INVALID_INPUT');
    return this.invoke(() => this.vault.provider(profile.credential_source as 'keychain' | 'vault' | 'ephemeral').delete(this.reference(profile)));
  }
  close(): void { this.vault.close(); }
}
