import { describe, it, expect, vi, beforeEach } from 'vitest';
import keytar from 'keytar';
import { AuthManager } from '../auth-manager.js';

// Mock de la librería keytar para no alterar el llavero real del sistema
vi.mock('keytar', () => ({
  default: {
    getPassword: vi.fn(),
    setPassword: vi.fn(),
  },
}));

describe('AuthManager', () => {
  let authManager: AuthManager;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.TEST_TOKEN_VAR;
    authManager = new AuthManager({ serviceName: 'qap-test' });
  });

  it('debe obtener credenciales desde variable de entorno si existe (Prioridad 1)', async () => {
    process.env.TEST_TOKEN_VAR = 'my-secret-env-token';

    const result = await authManager.getCredentials('user-test', 'TEST_TOKEN_VAR');

    expect(result).toEqual({ token: 'my-secret-env-token' });
    expect(keytar.getPassword).not.toHaveBeenCalled();
  });

  it('debe obtener credenciales desde keytar si no hay variable de entorno (Prioridad 2)', async () => {
    vi.mocked(keytar.getPassword).mockResolvedValue('keytar-stored-password');

    const result = await authManager.getCredentials('user-test', 'NON_EXISTENT_ENV_VAR');

    expect(keytar.getPassword).toHaveBeenCalledWith('qap-test', 'user-test');
    expect(result).toEqual({ password: 'keytar-stored-password' });
  });

  it('debe retornar null si no existe secreto en ENV ni en keytar', async () => {
    vi.mocked(keytar.getPassword).mockResolvedValue(null);

    const result = await authManager.getCredentials('user-test');

    expect(result).toBeNull();
  });

  it('debe guardar un secreto correctamente en keytar mediante setSecret', async () => {
    await authManager.setSecret('user-test', 'new-password-123');

    expect(keytar.setPassword).toHaveBeenCalledWith('qap-test', 'user-test', 'new-password-123');
  });
});