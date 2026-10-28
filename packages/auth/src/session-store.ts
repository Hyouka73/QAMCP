import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto';
import { unlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';

import type { Cookie } from 'playwright-core';

import { CredentialError } from './credential-provider.js';
import { atomicPrivateWrite, readPrivateFile, safeDirectory, safeProfileId, withFileLock } from './secure-files.js';

const processSessionKey = randomBytes(32);

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
    this.cacheDir = safeDirectory(customCacheDir ?? join(projectPath, '.qa', 'cache', 'sessions'), true);
    const configured = process.env.QAP_SESSION_KEY;
    if (configured !== undefined && !/^[0-9a-fA-F]{64}$/.test(configured)) throw new CredentialError('INVALID_INPUT');
    const seed = configured ? Buffer.from(configured, 'hex') : processSessionKey;
    this.secretKey = createHash('sha256').update(seed).update(resolve(this.cacheDir)).digest();
  }

  private getFilePath(profileId: string): string {
    safeProfileId(profileId);
    return join(this.cacheDir, `${profileId}.json`);
  }

  public saveSession(profileId: string, state: StorageState): void {
    this.getFilePath(profileId);
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.secretKey, iv);
    cipher.setAAD(Buffer.from(profileId));
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

    withFileLock(this.getFilePath(profileId), () => atomicPrivateWrite(this.getFilePath(profileId), JSON.stringify(payload)));
  }

  public getValidSession(profileId: string): StorageState | null {
    const filePath = this.getFilePath(profileId);
    try {
      return withFileLock(filePath, () => {
        try {
          const rawContent = readPrivateFile(filePath);
          if (rawContent === null) return null;
          const payload = JSON.parse(rawContent) as EncryptedSessionPayload;
          const decipher = createDecipheriv('aes-256-gcm', this.secretKey,
            Buffer.from(payload.iv, 'hex'), { authTagLength: 16 });
          decipher.setAAD(Buffer.from(profileId));
          decipher.setAuthTag(Buffer.from(payload.authTag, 'hex'));
          const plaintext = Buffer.concat([decipher.update(Buffer.from(payload.data, 'hex')), decipher.final()]);
          try {
            const state = JSON.parse(plaintext.toString('utf8')) as StorageState;
            if (this.isExpired(state)) { unlinkSync(filePath); return null; }
            return state;
          } finally { plaintext.fill(0); }
        } catch {
          // Wrong keys or tampering do not destroy another process's cached state.
          return null;
        }
      });
    } catch { return null; }
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
    withFileLock(filePath, () => {
      if (readPrivateFile(filePath) !== null) unlinkSync(filePath);
    });
  }
}
