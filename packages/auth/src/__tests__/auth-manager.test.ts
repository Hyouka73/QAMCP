import { describe, it, expect, vi, beforeEach } from 'vitest';
import keytar from 'keytar';
import { AuthManager } from '../auth-manager.js';
import * as profilesStore from '../profiles-store.js';

vi.mock('keytar', () => ({
  default: {
    getPassword: vi.fn(),
    setPassword: vi.fn(),
    deletePassword: vi.fn(),
  },
}));

vi.mock('../profiles-store.js', () => ({
  readProfile: vi.fn(),
}));

describe('AuthManager (S2-002)', () => {
  let authManager: AuthManager;

  beforeEach(() => {
    vi.clearAllMocks();
    authManager = new AuthManager();
  });

  it('debe obtener credenciales desde variable de entorno si credential_source es env', async () => {
    vi.spyOn(profilesStore, 'readProfile').mockResolvedValueOnce({
      id: 'dev-profile',
      env: 'dev',
      username: 'user1',
      login_mode: 'auto',
      login_route: '/login',
      session_cache: true,
      post_login_condition: { type: 'url_contains', value: '/dashboard' },
      handoff_timeout_ms: 30000,
      credential_source: 'env',
      env_var: 'TEST_SECRET_TOKEN',
    } as any);

    process.env.TEST_SECRET_TOKEN = 'secret-token-123';

    const credentials = await authManager.getCredentials('dev-profile');
    expect(credentials).toEqual({ token: 'secret-token-123' });
  });

  it('debe obtener credenciales desde keytar si credential_source es keychain', async () => {
    vi.spyOn(profilesStore, 'readProfile').mockResolvedValueOnce({
      id: 'prod-profile',
      env: 'prod',
      username: 'admin',
      login_mode: 'auto',
      login_route: '/login',
      session_cache: true,
      post_login_condition: { type: 'url_contains', value: '/dashboard' },
      handoff_timeout_ms: 30000,
      credential_source: 'keychain',
    } as any);

    vi.mocked(keytar.getPassword).mockResolvedValueOnce('my-keychain-pass');

    const credentials = await authManager.getCredentials('prod-profile');
    expect(credentials).toEqual({ password: 'my-keychain-pass' });
    expect(keytar.getPassword).toHaveBeenCalledWith(
      expect.stringMatching(/^qap\..+\.prod-profile$/),
      'admin'
    );
  });

  it('debe guardar un secreto correctamente en keytar con setSecret', async () => {
    vi.spyOn(profilesStore, 'readProfile').mockResolvedValueOnce({
      id: 'prod-profile',
      username: 'admin',
      credential_source: 'keychain',
    } as any);

    await authManager.setSecret('prod-profile', 'new-pass');
    expect(keytar.setPassword).toHaveBeenCalledWith(
      expect.stringMatching(/^qap\..+\.prod-profile$/),
      'admin',
      'new-pass'
    );
  });

  it('debe confirmar si existen credenciales válidas con hasValidCredentials', async () => {
    vi.spyOn(profilesStore, 'readProfile').mockResolvedValueOnce({
      id: 'dev-profile',
      credential_source: 'env',
      env_var: 'TEST_SECRET_TOKEN',
    } as any);

    process.env.TEST_SECRET_TOKEN = 'secret-token-123';

    const hasCreds = await authManager.hasValidCredentials('dev-profile');
    expect(hasCreds).toBe(true);
  });
});