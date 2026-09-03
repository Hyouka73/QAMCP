import keytar from 'keytar';

import type { AuthCredentials, AuthOptions } from './types.js';

export class AuthManager {
  private serviceName: string;

  constructor(options: AuthOptions = {}) {
    this.serviceName = options.serviceName || 'qap-cli';
  }

  /**
   * Obtiene credenciales. Prioriza variables de entorno sobre el llavero del SO.
   */
  async getCredentials(account: string, envVarName?: string): Promise<AuthCredentials | null> {
    // 1. Prioridad: Variable de entorno
    if (envVarName && process.env[envVarName]) {
      return { token: process.env[envVarName] };
    }

    // 2. Consulta al llavero seguro del SO (keytar)
    const secret = await keytar.getPassword(this.serviceName, account);
    if (secret) {
      return { password: secret };
    }

    return null;
  }

  /**
   * Guarda un secreto de forma segura en el llavero del SO.
   */
  async setSecret(account: string, secret: string): Promise<void> {
    await keytar.setPassword(this.serviceName, account, secret);
  }

  /**
   * Elimina un secreto del llavero del SO. Devuelve true si existia y se elimino,
   * false si no habia ningun secreto para esa cuenta.
   */
  async deleteSecret(account: string): Promise<boolean> {
    return keytar.deletePassword(this.serviceName, account);
  }
}