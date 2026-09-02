import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  handleAuthAdd,
  handleAuthList,
  handleAuthSetSecret,
  handleAuthRemove,
} from '../auth.js';

// Mock compatible con 'new AuthManager()' en Vitest
vi.mock('@qap/auth', () => {
  return {
    AuthManager: vi.fn().mockImplementation(function () {
      return {
        setSecret: vi.fn().mockResolvedValue(undefined),
        getCredentials: vi.fn().mockImplementation(async (profile: string) => {
          if (profile === 'mi-perfil' || profile === 'default') {
            return { username: profile, password: 'mocked-secret' };
          }
          return null;
        }),
      };
    }),
  };
});

describe('Suite de Comandos CLI Auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe ejecutar handleAuthAdd correctamente', async () => {
    const consoleSpy = vi.spyOn(console, 'log');
    await handleAuthAdd('test-profile');
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Perfil 'test-profile' registrado con éxito")
    );
  });

  it('debe ejecutar handleAuthSetSecret con un secreto válido', async () => {
    const consoleSpy = vi.spyOn(console, 'log');
    await handleAuthSetSecret('test-profile', 'mi-secret-key');
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Secreto guardado correctamente para el perfil 'test-profile'")
    );
  });

  it('debe listar los perfiles en handleAuthList sin exponer los secretos', async () => {
    const consoleSpy = vi.spyOn(console, 'log');
    await handleAuthList();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('• default: [Configurado] ****')
    );
  });

  it('debe ejecutar handleAuthRemove sin errores', async () => {
    const consoleSpy = vi.spyOn(console, 'log');
    await handleAuthRemove('test-profile');
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Credenciales del perfil 'test-profile' eliminadas")
    );
  });
});