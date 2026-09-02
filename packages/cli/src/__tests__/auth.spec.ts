import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  handleAuthAdd,
  handleAuthList,
  handleAuthSetSecret,
  handleAuthRemove,
} from '../auth.js';

// vi.hoisted asegura que estas variables existan ANTES de que vi.mock se ejecute
const { mockSetSecret, mockGetCredentials, mockDeleteSecret } = vi.hoisted(() => {
  return {
    mockSetSecret: vi.fn(),
    mockGetCredentials: vi.fn(),
    mockDeleteSecret: vi.fn(),
  };
});

// Mock compatible con 'new AuthManager()' en Vitest
vi.mock('@qap/auth', () => {
  return {
    AuthManager: vi.fn().mockImplementation(function () {
      return {
        setSecret: mockSetSecret,
        getCredentials: mockGetCredentials,
        deleteSecret: mockDeleteSecret,
      };
    }),
  };
});

describe('Suite de Comandos CLI Auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Restauramos los valores/implementaciones por defecto después de limpiar
    mockSetSecret.mockResolvedValue(undefined);
    mockGetCredentials.mockImplementation(async (profile: string) => {
      if (profile === 'mi-perfil' || profile === 'default') {
        return { username: profile, password: 'mocked-secret' };
      }
      return null;
    });
    mockDeleteSecret.mockResolvedValue(true);
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

  it('debe informar cuando no existe el perfil a eliminar', async () => {
    mockDeleteSecret.mockResolvedValueOnce(false);

    const consoleSpy = vi.spyOn(console, 'log');
    await handleAuthRemove('perfil-inexistente');
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('No se encontró ningún secreto')
    );
  });
});