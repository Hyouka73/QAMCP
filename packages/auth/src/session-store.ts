import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join, basename } from 'node:path';

import { machineIdSync } from 'node-machine-id';
import type { Cookie } from 'playwright-core';

export interface StorageState {
  cookies: Cookie[];
  origins: Array<{
    origin: string;
    localStorage: Array<{ name: string; value: string }>;
  }>;
}

export interface EncryptedSessionPayload {
  iv: string;
  authTag: string;
  data: string;
  createdAt: number;
}

export class SessionStore {
  private cacheDir: string;
  private secretKey: Buffer;

  constructor(customCacheDir?: string, projectPath: string = process.cwd()) {
    this.cacheDir = customCacheDir ?? join(process.cwd(), '.qa', 'cache', 'sessions');
    if (!existsSync(this.cacheDir)) {
      mkdirSync(this.cacheDir, { recursive: true });
    }

    // Prioridad 1: QAP_SESSION_KEY (variable de entorno explicita)
    // Prioridad 2: derivada de machine-id + hash del proyecto
    const keySeed = process.env.QAP_SESSION_KEY ?? this.deriveDefaultKeySeed(projectPath);
    this.secretKey = createHash('sha256').update(keySeed).digest();
  }

  private deriveDefaultKeySeed(projectPath: string): string {
    const machineId = machineIdSync(true);
    const projectHash = createHash('sha256').update(basename(projectPath)).digest('hex');
    return `${machineId}:${projectHash}`;
  }

  private getFilePath(profileId: string): string {
    return join(this.cacheDir, `${profileId}.json`);
  }

  public saveSession(profileId: string, state: StorageState): void {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.secretKey, iv);
    const jsonString = JSON.stringify(state);
    let encrypted = cipher.update(jsonString, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    const payload: EncryptedSessionPayload = {
      iv: iv.toString('hex'),
      authTag,
      data: encrypted,
      createdAt: Date.now(),
    };

    writeFileSync(this.getFilePath(profileId), JSON.stringify(payload, null, 2), 'utf8');
  }

  public getValidSession(profileId: string): StorageState | null {
    const filePath = this.getFilePath(profileId);
    if (!existsSync(filePath)) return null;

    try {
      const rawContent = readFileSync(filePath, 'utf8');
      const payload = JSON.parse(rawContent) as EncryptedSessionPayload;

      const decipher = createDecipheriv(
        'aes-256-gcm',
        this.secretKey,
        Buffer.from(payload.iv, 'hex')
      );
      decipher.setAuthTag(Buffer.from(payload.authTag, 'hex'));

      let decrypted = decipher.update(payload.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      const state = JSON.parse(decrypted) as StorageState;

      if (this.isExpired(state)) {
        this.clearSession(profileId);
        return null;
      }

      return state;
    } catch {
      this.clearSession(profileId);
      return null;
    }
  }

  public isExpired(state: StorageState): boolean {
    const nowSeconds = Date.now() / 1000;
    for (const cookie of state.cookies) {
      if (cookie.expires !== undefined && cookie.expires !== -1 && cookie.expires < nowSeconds) {
        return true;
      }
    }
    return false;
  }

  public clearSession(profileId: string): void {
    const filePath = this.getFilePath(profileId);
    if (existsSync(filePath)) {
      try {
        unlinkSync(filePath);
      } catch {
        // Ignorar: el archivo pudo haber sido eliminado por otro proceso.
      }
    }
  }
}