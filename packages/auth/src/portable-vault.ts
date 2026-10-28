/* eslint-disable @typescript-eslint/require-await -- Async provider port also supports synchronous in-memory and file transactions. */
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'node:crypto';
import { dirname } from 'node:path';

import { CredentialError, referenceKey, validateCredentials, type CredentialReference, type ICredentialProvider } from './credential-provider.js';
import { atomicPrivateWrite, containedPath, readPrivateFile, safeDirectory, withFileLock } from './secure-files.js';
import type { AuthCredentials } from './types.js';

export const VAULT_KDF = Object.freeze({ name: 'scrypt', N: 131072, r: 8, p: 1, keyLength: 32 });
interface Envelope {
  version: 1;
  cipher: 'aes-256-gcm';
  kdf: typeof VAULT_KDF;
  salt: string;
  nonce: string;
  tag: string;
  data: string;
}
type Entries = Record<string, AuthCredentials>;
const hex = (value: unknown, bytes: number): value is string =>
  typeof value === 'string' && new RegExp(`^[0-9a-f]{${bytes * 2}}$`).test(value);

function parseEnvelope(raw: string): Envelope {
  let value: Envelope;
  try { value = JSON.parse(raw) as Envelope; } catch { throw new CredentialError('INVALID_VAULT'); }
  if (!value || typeof value !== 'object') throw new CredentialError('INVALID_VAULT');
  if (value.version !== 1) throw new CredentialError('UNSUPPORTED_VERSION');
  if (value.cipher !== 'aes-256-gcm' || !value.kdf ||
      Object.keys(VAULT_KDF).some((k) => value.kdf[k as keyof typeof VAULT_KDF] !== VAULT_KDF[k as keyof typeof VAULT_KDF]) ||
      Object.keys(value.kdf).length !== 5 || !hex(value.salt, 32) || !hex(value.nonce, 12) || !hex(value.tag, 16) ||
      typeof value.data !== 'string' || value.data.length > 4 * 1024 * 1024 || value.data.length % 2 !== 0 || !/^[0-9a-f]+$/.test(value.data)) {
    throw new CredentialError('INVALID_VAULT');
  }
  return value;
}

function aad(envelope: Pick<Envelope, 'salt' | 'nonce'>): Buffer {
  return Buffer.from(JSON.stringify({ version: 1, cipher: 'aes-256-gcm', kdf: VAULT_KDF, salt: envelope.salt, nonce: envelope.nonce }));
}

/** Password is accepted only by explicit unlock; no environment or public-data defaults. */
export class PortableCredentialVault implements ICredentialProvider {
  private key?: Buffer;
  private salt?: string;
  private opening = false;
  private generation = 0;
  private readonly path: string;
  constructor(authorizedRoot: string, file = '.qamcp/vault.enc') {
    const root = safeDirectory(authorizedRoot);
    this.path = containedPath(root, file);
  }

  async unlock(passphrase: string): Promise<void> {
    if (this.opening) throw new CredentialError('BUSY');
    this.close();
    const generation = this.generation;
    if (typeof passphrase !== 'string' || passphrase.length < 16 || passphrase.length > 1024) throw new CredentialError('INVALID_INPUT');
    this.opening = true;
    let key: Buffer | undefined;
    try {
      safeDirectory(dirname(this.path), true);
      const raw = readPrivateFile(this.path);
      const envelope = raw === null ? null : parseEnvelope(raw);
      const salt = envelope?.salt ?? randomBytes(32).toString('hex');
      const password = Buffer.from(passphrase);
      try {
        key = await new Promise<Buffer>((resolve, reject) => {
          scrypt(password, Buffer.from(salt, 'hex'), 32,
            { N: VAULT_KDF.N, r: VAULT_KDF.r, p: VAULT_KDF.p, maxmem: 256 * 1024 * 1024 },
            (error, result) => error ? reject(new CredentialError('UNAVAILABLE')) : resolve(result));
        });
      } finally { password.fill(0); }
      if (generation !== this.generation) throw new CredentialError('LOCKED');
      // Re-read under the lock after the asynchronous KDF: never overwrite another initializer.
      withFileLock(this.path, () => {
        const current = readPrivateFile(this.path);
        if (raw !== current) throw new CredentialError('BUSY');
        if (envelope) this.decrypt(envelope, key!);
        else atomicPrivateWrite(this.path, this.encrypt({}, key!, salt));
      });
      this.key = key;
      this.salt = salt;
      key = undefined;
    } catch (error) {
      if (error instanceof CredentialError) throw error;
      throw new CredentialError('IO_ERROR');
    } finally { key?.fill(0); this.opening = false; }
  }

  private encrypt(entries: Entries, key: Buffer, salt: string): string {
    const nonce = randomBytes(12).toString('hex');
    const cipher = createCipheriv('aes-256-gcm', key, Buffer.from(nonce, 'hex'), { authTagLength: 16 });
    cipher.setAAD(aad({ salt, nonce }));
    const plaintext = Buffer.from(JSON.stringify(entries));
    try {
      const data = Buffer.concat([cipher.update(plaintext), cipher.final()]).toString('hex');
      if (data.length > 3 * 1024 * 1024) throw new CredentialError('INVALID_INPUT');
      return JSON.stringify({ version: 1, cipher: 'aes-256-gcm', kdf: VAULT_KDF, salt, nonce, tag: cipher.getAuthTag().toString('hex'), data });
    } finally { plaintext.fill(0); }
  }

  private decrypt(envelope: Envelope, key: Buffer): Entries {
    let plaintext: Buffer | undefined;
    try {
      const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(envelope.nonce, 'hex'), { authTagLength: 16 });
      decipher.setAAD(aad(envelope));
      decipher.setAuthTag(Buffer.from(envelope.tag, 'hex'));
      plaintext = Buffer.concat([decipher.update(Buffer.from(envelope.data, 'hex')), decipher.final()]);
      const entries = JSON.parse(plaintext.toString('utf8')) as Entries;
      if (!entries || typeof entries !== 'object' || Array.isArray(entries)) throw new Error();
      for (const [id, credentials] of Object.entries(entries)) {
        const parts = JSON.parse(id) as string[];
        if (!Array.isArray(parts) || parts.length !== 5 || referenceKey({ projectId: parts[0], applicationId: parts[1], environment: parts[2], auth_profile_id: parts[3], account: parts[4] }) !== id) throw new Error();
        validateCredentials(credentials);
      }
      return entries;
    } catch { throw new CredentialError('INVALID_VAULT'); }
    finally { plaintext?.fill(0); }
  }

  private transaction<T>(operation: (entries: Entries) => { result: T; write: boolean }): T {
    if (!this.key || !this.salt) throw new CredentialError('LOCKED');
    try {
      return withFileLock(this.path, () => {
        const raw = readPrivateFile(this.path);
        if (raw === null) throw new CredentialError('INVALID_VAULT');
        const envelope = parseEnvelope(raw);
        if (envelope.salt !== this.salt) throw new CredentialError('LOCKED');
        const entries = this.decrypt(envelope, this.key!);
        const { result, write } = operation(entries);
        if (write) atomicPrivateWrite(this.path, this.encrypt(entries, this.key!, this.salt));
        return result;
      });
    } catch (error) {
      if (error instanceof CredentialError) throw error;
      throw new CredentialError('IO_ERROR');
    }
  }

  async get(ref: CredentialReference): Promise<AuthCredentials | null> {
    const id = referenceKey(ref);
    return this.transaction((entries) => ({ result: entries[id] ? { ...entries[id] } : null, write: false }));
  }
  async set(ref: CredentialReference, value: AuthCredentials): Promise<void> {
    const id = referenceKey(ref);
    const credentials = validateCredentials(value);
    this.transaction((entries) => { entries[id] = credentials; return { result: undefined, write: true }; });
  }
  async delete(ref: CredentialReference): Promise<boolean> {
    const id = referenceKey(ref);
    return this.transaction((entries) => {
      const found = Object.hasOwn(entries, id);
      delete entries[id];
      return { result: found, write: found };
    });
  }
  close(): void { this.generation++; this.key?.fill(0); this.key = undefined; this.salt = undefined; }
}
