import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { handleAuthAdd, handleAuthList, handleAuthSetSecret, handleAuthRemove } from '../commands/auth/index.js';

const TEST_DIR = join(process.cwd(), '.qa', 'project', 'auth');
const TEST_FILE = join(TEST_DIR, 'profiles.json');

const authMock = vi.hoisted(() => ({
  setProfileSecret: vi.fn().mockResolvedValue(undefined),
  close: vi.fn(),
  hasValidCredentials: vi.fn().mockResolvedValue(true),
  getCredentialStatus: vi.fn().mockResolvedValue({ auth_profile_id: 'test-profile', state: 'available' }),
  deleteSecret: vi.fn().mockResolvedValue(true),
}));
vi.mock('@qap/auth', async importOriginal => ({
  ...await importOriginal<typeof import('@qap/auth')>(),
  AuthManager: vi.fn().mockImplementation(function () { return authMock; }),
}));

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

  it('guarda la contraseña obtenida del diálogo local y sólo imprime el identificador', async () => {
    await handleAuthAdd({ id: 'test-profile', application_id: 'fixture', login_origin: 'https://fixture.invalid' });
    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const prompt = vi.fn().mockResolvedValue('synthetic-test-password');
    try {
      await handleAuthSetSecret('test-profile', prompt);
      expect(prompt).toHaveBeenCalledOnce();
      expect(authMock.setProfileSecret).toHaveBeenCalledWith(expect.objectContaining({ id: 'test-profile' }), 'synthetic-test-password');
      expect(spy).toHaveBeenCalledWith(expect.stringContaining('Secreto guardado correctamente'));
      expect(JSON.stringify(spy.mock.calls)).not.toContain('synthetic-test-password');
      expect(readFileSync(TEST_FILE, 'utf8')).not.toContain('synthetic-test-password');
    } finally { spy.mockRestore(); }
  });

  it('conserva el perfil sin credencial al cancelar el diálogo local', async () => {
    await handleAuthAdd({ id: 'test-profile', application_id: 'fixture', login_origin: 'https://fixture.invalid' });
    await handleAuthSetSecret('test-profile', () => Promise.resolve(undefined));
    expect(authMock.setProfileSecret).not.toHaveBeenCalled();
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
