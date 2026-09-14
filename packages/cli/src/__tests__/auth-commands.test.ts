import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { handleAuthAdd, handleAuthList, handleAuthSetSecret, handleAuthRemove } from '../commands/auth/index.js';

const TEST_DIR = join(process.cwd(), '.qa', 'project', 'auth');
const TEST_FILE = join(TEST_DIR, 'profiles.json');

vi.mock('@qap/auth', () => {
  return {
    AuthManager: vi.fn().mockImplementation(function () {
      return {
        setSecret: vi.fn().mockResolvedValue(undefined),
        hasValidCredentials: vi.fn().mockResolvedValue(true),
        deleteSecret: vi.fn().mockResolvedValue(true),
      };
    }),
  };
});

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
});