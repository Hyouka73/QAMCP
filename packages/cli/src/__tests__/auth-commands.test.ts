import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { handleAuthAdd, handleAuthList, handleAuthSetSecret, handleAuthRemove } from '../commands/auth/index.js';

const TEST_DIR = join(process.cwd(), '.qa', 'project', 'auth');
const TEST_FILE = join(TEST_DIR, 'profiles.json');

const authMock = vi.hoisted(() => ({
  setSecret: vi.fn().mockResolvedValue(undefined),
  hasValidCredentials: vi.fn().mockResolvedValue(true),
  getCredentialStatus: vi.fn().mockResolvedValue({ auth_profile_id: 'test-profile', state: 'available' }),
  deleteSecret: vi.fn().mockResolvedValue(true),
}));
vi.mock('@qap/auth', () => ({ AuthManager: vi.fn().mockImplementation(function () { return authMock; }) }));

describe('Suite de Comandos CLI Auth (S2-003)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (existsSync(TEST_FILE)) rmSync(TEST_FILE, { force: true });
  });

  afterEach(() => {
    if (existsSync(TEST_FILE)) rmSync(TEST_FILE, { force: true });
  });

  it('debe registrar un perfil mediante handleAuthAdd', async () => {
    await handleAuthAdd('test-profile');
    expect(existsSync(TEST_FILE)).toBe(true);
  });

  it('debe guardar secreto con handleAuthSetSecret', async () => {
    const spy = vi.spyOn(console, 'log');
    await handleAuthSetSecret('test-profile', 'mi-pass-123');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Secreto guardado correctamente'));
  });

  it('debe listar perfiles con handleAuthList', async () => {
    await handleAuthAdd('test-profile');
    const spy = vi.spyOn(console, 'log');
    await handleAuthList();
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('test-profile'));
  });

  it('debe eliminar perfil con handleAuthRemove', async () => {
    await handleAuthAdd('test-profile');
    await handleAuthRemove('test-profile');
    const spy = vi.spyOn(console, 'log');
    await handleAuthList();
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('No se encontraron perfiles'));
  });

  it('revoca el secreto antes de eliminar su referencia', async () => {
    await handleAuthAdd('test-profile');
    const manager = authMock;
    manager.deleteSecret.mockImplementationOnce(async () => {
      expect(JSON.parse(readFileSync(TEST_FILE, 'utf8')).profiles[0].id).toBe('test-profile');
      return true;
    });
    await handleAuthRemove('test-profile');
    expect(JSON.parse(readFileSync(TEST_FILE, 'utf8')).profiles).toEqual([]);
  });

  it('conserva el perfil si el proveedor no permite revocar', async () => {
    await handleAuthAdd('test-profile');
    const manager = authMock;
    manager.deleteSecret.mockRejectedValueOnce(new Error('Synthetic unavailable backend'));
    const output = vi.spyOn(console, 'error').mockImplementation(() => {});
    await handleAuthRemove('test-profile');
    expect(JSON.parse(readFileSync(TEST_FILE, 'utf8')).profiles[0].id).toBe('test-profile');
    output.mockRestore();
  });
});
