import { basename } from 'node:path';

import keytar from 'keytar';
import type { AuthProfile } from '@qap/shared';

import { readProfile } from './profiles-store.js';
import type { AuthCredentials } from './types.js';

export class AuthManager {
  private projectName: string;

  constructor(projectPath: string = process.cwd()) {
    // Supuesto: se deriva el nombre del proyecto de la carpeta raíz,
    // ya que projectName no se persiste en .qa/project/environments.yaml.
    this.projectName = basename(projectPath);
  }

  /**
   * Deriva el identificador seguro del keychain: qap.<proyecto>.<perfil_id>
   */
  private buildServiceName(profileId: string): string {
    return `qap.${this.projectName}.${profileId}`;
  }

  /**
   * Resuelve credenciales para un perfil según su credential_source.
   * - 'env': lee de process.env[profile.env_var]
   * - 'keychain': consulta keytar bajo qap.<proyecto>.<perfil_id>
   */
  async getCredentials(profileId: string): Promise<AuthCredentials | null> {
    const profile = await readProfile(profileId);
    if (!profile) return null;

    if (profile.credential_source === 'env') {
      // NOTA: 'env_var' aún no existe en el schema/tipo AuthProfile (pendiente S2-001).
      const envVarName = (profile as AuthProfile & { env_var?: string }).env_var;
      const value = envVarName ? process.env[envVarName] : undefined;
      return value ? { token: value } : null;
    }

    // credential_source === 'keychain'
    const serviceName = this.buildServiceName(profileId);
    const secret = await keytar.getPassword(serviceName, profile.username);
    return secret ? { password: secret } : null;
  }

  /**
   * Guarda un secreto en el keychain para el perfil indicado.
   * Solo aplica a perfiles con credential_source: 'keychain'.
   */
  async setSecret(profileId: string, password: string): Promise<void> {
    const profile = await readProfile(profileId);
    if (!profile) {
      throw new Error(`Perfil '${profileId}' no encontrado en profiles.json`);
    }
    const serviceName = this.buildServiceName(profileId);
    await keytar.setPassword(serviceName, profile.username, password);
  }

  /**
   * Verifica si existen credenciales válidas registradas para el perfil.
   */
  async hasValidCredentials(profileId: string): Promise<boolean> {
    const credentials = await this.getCredentials(profileId);
    return credentials !== null;
  }

  /**
   * Elimina el secreto del keychain asociado al perfil.
   */
  async deleteSecret(profileId: string): Promise<boolean> {
    const profile = await readProfile(profileId);
    if (!profile) return false;
    const serviceName = this.buildServiceName(profileId);
    return keytar.deletePassword(serviceName, profile.username);
  }
}