import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, existsSync, symlinkSync, chmodSync, linkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthManager } from '../auth-manager.js';
import { CredentialError, type CredentialReference } from '../credential-provider.js';
import { PortableCredentialVault, VAULT_KDF } from '../portable-vault.js';
import { EphemeralCredentialProvider, KeychainCredentialProvider, TieredCredentialVault } from '../providers.js';
import { SessionStore } from '../session-store.js';
import * as files from '../secure-files.js';

vi.mock('node:fs', async (original) => ({ ...await original<typeof import('node:fs')>(), renameSync: vi.fn((await original<typeof import('node:fs')>()).renameSync) }));

const password = 'synthetic-master-passphrase-005';
const secret = 'synthetic-secret-never-log';
const ref: CredentialReference = { projectId: 'project-a', applicationId: 'app-a', environment: 'test', auth_profile_id: 'admin', account: 'tester' };
let root: string;
const opened: PortableCredentialVault[] = [];
function vault(file?: string): PortableCredentialVault {
  const result = new PortableCredentialVault(root, file);
  opened.push(result);
  return result;
}
function envelope(): Record<string, any> { return JSON.parse(readFileSync(join(root, '.qamcp/vault.enc'), 'utf8')); }
function writeEnvelope(value: unknown): void { writeFileSync(join(root, '.qamcp/vault.enc'), JSON.stringify(value), { mode: 0o600 }); }
function profiles(source = 'vault'): void {
  mkdirSync(join(root, '.qa/project/auth'), { recursive: true });
  writeFileSync(join(root, '.qa/project/auth/profiles.json'), JSON.stringify({ profiles: [{ id: 'admin', env: 'test', username: 'tester', credential_source: source, login_mode: 'auto' }] }));
}

beforeEach(() => { root = mkdtempSync(join(tmpdir(), 'qap-vault-')); });
afterEach(() => {
  for (const item of opened.splice(0)) item.close();
  vi.restoreAllMocks();
  rmSync(root, { recursive: true, force: true });
});

describe('portable vault cryptography and lifecycle', () => {
  it('encrypts, reopens, replaces and revokes without plaintext in files', async () => {
    const first = vault();
    await first.unlock(password);
    await first.set(ref, { password: secret });
    expect(readFileSync(join(root, '.qamcp/vault.enc'), 'utf8')).not.toContain(secret);
    expect(readFileSync(join(root, '.qamcp/vault.enc'), 'utf8')).not.toContain(password);
    first.close();
    await expect(first.get(ref)).rejects.toMatchObject({ code: 'LOCKED' });
    const second = vault();
    await second.unlock(password);
    expect(await second.get(ref)).toEqual({ password: secret });
    await second.set(ref, { token: 'replacement' });
    expect(await second.get(ref)).toEqual({ token: 'replacement' });
    expect(await second.delete(ref)).toBe(true);
    expect(await second.delete(ref)).toBe(false);
    expect(await second.get(ref)).toBeNull();
    second.close();
    await second.unlock(password);
    expect(await second.get(ref)).toBeNull();
  });

  it('rejects wrong master password without altering ciphertext or exposing inputs', async () => {
    const first = vault(); await first.unlock(password); await first.set(ref, { password: secret }); first.close();
    const previous = readFileSync(join(root, '.qamcp/vault.enc'));
    await expect(first.unlock('wrong-passphrase-005')).rejects.toMatchObject({ code: 'INVALID_VAULT', message: 'Credential operation failed: INVALID_VAULT' });
    expect(readFileSync(join(root, '.qamcp/vault.enc'))).toEqual(previous);
    await expect(first.get(ref)).rejects.toMatchObject({ code: 'LOCKED' });
  });

  it.each(['data', 'tag', 'nonce', 'salt'])('detects tampering of %s', async (field) => {
    const item = vault(); await item.unlock(password); await item.set(ref, { password: secret }); item.close();
    const value = envelope(); value[field] = (value[field][0] === '0' ? '1' : '0') + value[field].slice(1); writeEnvelope(value);
    await expect(item.unlock(password)).rejects.toMatchObject({ code: 'INVALID_VAULT' });
  });

  it('rejects truncation and unknown versions without running attacker-selected KDFs', async () => {
    const item = vault(); await item.unlock(password); item.close();
    const value = envelope(); writeEnvelope({ ...value, version: 999 });
    await expect(item.unlock(password)).rejects.toMatchObject({ code: 'UNSUPPORTED_VERSION' });
    writeEnvelope({ ...value, kdf: { ...value.kdf, N: 2 ** 30 } });
    await expect(item.unlock(password)).rejects.toMatchObject({ code: 'INVALID_VAULT' });
    writeFileSync(join(root, '.qamcp/vault.enc'), '{');
    await expect(item.unlock(password)).rejects.toMatchObject({ code: 'INVALID_VAULT' });
  });

  it('uses random nonces on every mutation and distinct salts per vault', async () => {
    const item = vault(); await item.unlock(password); const first = envelope();
    await item.set(ref, { password: secret }); const second = envelope();
    await item.set(ref, { password: secret }); const third = envelope();
    expect(new Set([first.nonce, second.nonce, third.nonce]).size).toBe(3);
    expect(second.salt).toBe(first.salt);
    const other = vault('.qamcp/other.enc'); await other.unlock(password);
    const separate = JSON.parse(readFileSync(join(root, '.qamcp/other.enc'), 'utf8'));
    expect(separate.salt).not.toBe(first.salt);
    expect(first.kdf).toEqual({ name: 'scrypt', N: 131072, r: 8, p: 1, keyLength: 32 });
    expect(VAULT_KDF.N).toBe(2 ** 17);
  });

  it('preserves the previous vault when rename fails', async () => {
    const item = vault(); await item.unlock(password); await item.set(ref, { password: secret });
    const previous = readFileSync(join(root, '.qamcp/vault.enc'));
    // Exercise the actual atomic-write cleanup after creating/fsyncing a temporary file.
    const fs = await import('node:fs');
    const spy = vi.spyOn(fs, 'renameSync').mockImplementation(() => { throw new Error(secret); });
    await expect(item.set(ref, { token: 'changed' })).rejects.toMatchObject({ code: 'IO_ERROR' });
    spy.mockRestore();
    expect(readFileSync(join(root, '.qamcp/vault.enc'))).toEqual(previous);
    expect(await item.get(ref)).toEqual({ password: secret });
    expect(existsSync(join(root, '.qamcp/vault.enc.lock'))).toBe(false);
  });

  it('serializes independent handles by reloading and rejects occupied locks', async () => {
    const a = vault(); const b = vault(); await a.unlock(password); await b.unlock(password);
    await Promise.all([a.set(ref, { password: 'first' }), b.set({ ...ref, auth_profile_id: 'other' }, { token: 'second' })]);
    expect(await b.get(ref)).toEqual({ password: 'first' });
    expect(await a.get({ ...ref, auth_profile_id: 'other' })).toEqual({ token: 'second' });
    writeFileSync(join(root, '.qamcp/vault.enc.lock'), '');
    await expect(a.set(ref, { password: secret })).rejects.toMatchObject({ code: 'BUSY' });
    rmSync(join(root, '.qamcp/vault.enc.lock'));
  });

  it('close cancels a pending unlock and overlapping unlocks fail fast', async () => {
    const item = vault(); const pending = item.unlock(password);
    await expect(item.unlock(password)).rejects.toMatchObject({ code: 'BUSY' });
    item.close();
    await expect(pending).rejects.toMatchObject({ code: 'LOCKED' });
    await expect(item.get(ref)).rejects.toMatchObject({ code: 'LOCKED' });
  });

  it('rejects traversal', () => {
    expect(() => vault('../outside.enc')).toThrow(CredentialError);
    expect(() => vault(join(root, '..', 'outside.enc'))).toThrow(CredentialError);
    expect(() => vault('.qamcp/vault.enc:stream')).toThrow(CredentialError);
    expect(() => vault('.qamcp/CON')).toThrow(CredentialError);
  });

  it('rejects hardlinks when creation is permitted by the host', async (context) => {
    mkdirSync(join(root, '.qamcp'));
    writeFileSync(join(root, 'original'), '{}');
    try { linkSync(join(root, 'original'), join(root, '.qamcp/vault.enc')); }
    catch (error) {
      if (['EPERM', 'EACCES'].includes((error as NodeJS.ErrnoException).code ?? '')) { context.skip(); return; }
      throw error;
    }
    await expect(vault().unlock(password)).rejects.toMatchObject({ code: 'UNSAFE_PATH' });
  });

  it('isolates vault references across all scope dimensions', async () => {
    const item = vault(); await item.unlock(password); await item.set(ref, { token: secret });
    for (const field of ['projectId', 'applicationId', 'environment', 'auth_profile_id', 'account']) {
      expect(await item.get({ ...ref, [field]: 'different' })).toBeNull();
    }
  });

  it('rejects linked directories when creation is permitted by the host', async (context) => {
    const target = join(root, 'target'); mkdirSync(target);
    try { symlinkSync(target, join(root, '.qamcp'), process.platform === 'win32' ? 'junction' : 'dir'); }
    catch (error) {
      if (['EPERM', 'EACCES'].includes((error as NodeJS.ErrnoException).code ?? '')) { context.skip(); return; }
      throw error;
    }
    await expect(vault().unlock(password)).rejects.toMatchObject({ code: 'UNSAFE_PATH' });
  });

  it.skipIf(process.platform === 'win32')('rejects permissive POSIX vault permissions', async () => {
    const item = vault(); await item.unlock(password); item.close();
    chmodSync(join(root, '.qamcp/vault.enc'), 0o644);
    await expect(item.unlock(password)).rejects.toMatchObject({ code: 'UNSAFE_PATH' });
  });
});

describe('providers, references and AuthManager compatibility', () => {
  it('isolates every dimension and defensively copies ephemeral credentials', async () => {
    const item = new EphemeralCredentialProvider(); const value = { password: secret };
    await item.set(ref, value); value.password = 'changed';
    for (const field of ['projectId', 'applicationId', 'environment', 'auth_profile_id', 'account']) expect(await item.get({ ...ref, [field]: 'different' })).toBeNull();
    const retrieved = await item.get(ref); retrieved!.password = 'changed';
    expect(await item.get(ref)).toEqual({ password: secret });
    expect(existsSync(join(root, '.qamcp'))).toBe(false);
    item.close(); expect(await item.get(ref)).toBeNull();
  });

  it('keychain loader absence/failure is sanitized and never falls back', async () => {
    const load = vi.fn(async () => { throw new Error(secret); });
    const keychain = new KeychainCredentialProvider(load);
    await expect(keychain.get(ref)).rejects.toMatchObject({ code: 'UNAVAILABLE', message: 'Credential operation failed: UNAVAILABLE' });
    await expect(keychain.set(ref, { password: secret })).rejects.toMatchObject({ code: 'UNAVAILABLE' });
    await expect(keychain.delete(ref)).rejects.toMatchObject({ code: 'UNAVAILABLE' });
    profiles('keychain');
    const manager = new AuthManager(root, { vault: new TieredCredentialVault({ keychain }) });
    expect(await manager.getCredentialStatus('admin')).toEqual({ auth_profile_id: 'admin', state: 'unavailable' });
    expect(existsSync(join(root, '.qamcp'))).toBe(false);
  });

  it('resolves profiles through the portable provider using the existing public methods', async () => {
    profiles(); const item = vault(); await item.unlock(password);
    const manager = new AuthManager(root, { vault: new TieredCredentialVault({ vault: item }) });
    expect(await manager.getCredentials('missing')).toBeNull();
    expect(await manager.hasValidCredentials('admin')).toBe(false);
    await manager.setSecret('admin', secret);
    expect(await manager.getCredentials('admin')).toEqual({ password: secret });
    expect(await manager.getCredentialStatus('admin')).toEqual({ auth_profile_id: 'admin', state: 'available' });
    expect(await manager.deleteSecret('admin')).toBe(true);
    expect(await manager.deleteSecret('admin')).toBe(false);
    manager.close();
    expect((await manager.getCredentialStatus('admin')).state).toBe('unlock_required');
  });

  it('headless locked vault exposes a recoverable state without creating a vault', async () => {
    profiles(); const manager = new AuthManager(root);
    expect((await manager.getCredentialStatus('admin')).state).toBe('unlock_required');
    await expect(manager.setSecret('admin', secret)).rejects.toMatchObject({ code: 'LOCKED' });
    expect(existsSync(join(root, '.qamcp'))).toBe(false);
  });

  it('isolates projects with identical directory basenames in keychain', async () => {
    const services: string[] = [];
    const provider = new KeychainCredentialProvider(async () => ({
      getPassword: async (service) => { services.push(service); return null; },
      setPassword: vi.fn(), deletePassword: vi.fn(),
    }));
    for (const parent of ['one', 'two']) {
      const dir = join(root, parent, 'same'); mkdirSync(join(dir, '.qa/project/auth'), { recursive: true });
      profiles('keychain');
      writeFileSync(join(dir, '.qa/project/auth/profiles.json'), readFileSync(join(root, '.qa/project/auth/profiles.json')));
      await new AuthManager(dir, { vault: new TieredCredentialVault({ keychain: provider }) }).getCredentials('admin');
    }
    expect(services[0]).not.toBe(services[1]);
  });

  it('never logs secrets or raw parsing/backend errors', async () => {
    const log = vi.spyOn(console, 'log'); const error = vi.spyOn(console, 'error'); const warn = vi.spyOn(console, 'warn');
    profiles(); writeFileSync(join(root, '.qa/project/auth/profiles.json'), secret);
    const manager = new AuthManager(root);
    await expect(manager.getCredentials('admin')).rejects.toMatchObject({ message: 'Credential operation failed: INVALID_INPUT' });
    expect(log).not.toHaveBeenCalled(); expect(error).not.toHaveBeenCalled(); expect(warn).not.toHaveBeenCalled();
  });

  it('sanitizes errors from external providers at the manager boundary', async () => {
    profiles('ephemeral');
    const provider = { get: async () => { throw new Error(secret); }, set: async () => { throw new Error(secret); }, delete: async () => { throw new Error(secret); }, close: () => {} };
    const manager = new AuthManager(root, { vault: new TieredCredentialVault({ ephemeral: provider }) });
    await expect(manager.getCredentials('admin')).rejects.toMatchObject({ message: 'Credential operation failed: UNAVAILABLE' });
    await expect(manager.setSecret('admin', secret)).rejects.toMatchObject({ message: 'Credential operation failed: UNAVAILABLE' });
    await expect(manager.deleteSecret('admin')).rejects.toMatchObject({ message: 'Credential operation failed: UNAVAILABLE' });
  });

  it('rejects malformed credentials and path-bearing profile references', async () => {
    const item = new EphemeralCredentialProvider();
    await expect(item.set(ref, {})).rejects.toMatchObject({ code: 'INVALID_INPUT' });
    await expect(item.set(ref, { password: secret, extra: secret } as any)).rejects.toMatchObject({ code: 'INVALID_INPUT' });
    await expect(new AuthManager(root).getCredentials('../private')).rejects.toMatchObject({ code: 'INVALID_INPUT' });
    expect(() => files.safeProfileId('C:\\private')).toThrow(CredentialError);
  });

  it('loads built auth without resolving native keytar', () => {
    const built = resolve('dist/index.js');
    const loader = join(root, 'deny-keytar.mjs');
    writeFileSync(loader, `export function resolve(specifier, context, next) { if (specifier === 'keytar') throw new Error('keytar deliberately absent'); return next(specifier, context); }`);
    const child = spawnSync(process.execPath, ['--loader', pathToFileURL(loader).href, '--input-type=module', '-e', `const {AuthManager}=await import(${JSON.stringify(pathToFileURL(built).href)}); new AuthManager();`], { encoding: 'utf8' });
    expect(child.status, child.stderr).toBe(0);
  });
});

describe('session state stays private and separate', () => {
  it('rejects traversal and uses projectPath rather than the current working directory', () => {
    const store = new SessionStore(undefined, root);
    store.saveSession('admin', { cookies: [], origins: [] });
    expect(existsSync(join(root, '.qa/cache/sessions/admin.json'))).toBe(true);
    expect(() => store.saveSession('../private', { cookies: [], origins: [] })).toThrow(CredentialError);
  });

  it('authenticates profile binding and preserves ciphertext on invalid keys', () => {
    const store = new SessionStore(undefined, root);
    store.saveSession('admin', { cookies: [], origins: [] });
    const path = join(root, '.qa/cache/sessions/admin.json');
    writeFileSync(join(root, '.qa/cache/sessions/other.json'), readFileSync(path), { mode: 0o600 });
    expect(store.getValidSession('other')).toBeNull();
    const previous = process.env.QAP_SESSION_KEY;
    try {
      process.env.QAP_SESSION_KEY = 'a'.repeat(64);
      expect(new SessionStore(undefined, root).getValidSession('admin')).toBeNull();
      expect(existsSync(path)).toBe(true);
    } finally { if (previous === undefined) delete process.env.QAP_SESSION_KEY; else process.env.QAP_SESSION_KEY = previous; }
  });
});
