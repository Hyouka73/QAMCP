import keytar from 'keytar';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AuthProfile } from '@qap/shared';

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
    const mockProfile: AuthProfile = {
      id: 'dev-profile',
      env: 'dev',
      username: 'user1',
      login_mode: 'auto',
      login_route: '/login',
      session_cache: { enabled: true },
      post_login_condition: { type: 'url_contains', value: '/dashboard' },
      handoff_timeout_ms: 30000,
      credential_source: 'env',
      env_var: 'TEST_SECRET_TOKEN',
    };
    vi.spyOn(profilesStore, 'readProfile').mockResolvedValueOnce(mockProfile);

    process.env.TEST_SECRET_TOKEN = 'secret-token-123';

    const credentials = await authManager.getCredentials('dev-profile');
    expect(credentials).toEqual({ token: 'secret-token-123' });
  });

  it('debe obtener credenciales desde keytar si credential_source es keychain', async () => {
    const mockProfile: AuthProfile = {
      id: 'prod-profile',
      env: 'prod',
      username: 'admin',
      login_mode: 'auto',
      login_route: '/login',
      session_cache: { enabled: true },
      post_login_condition: { type: 'url_contains', value: '/dashboard' },
      handoff_timeout_ms: 30000,
      credential_source: 'keychain',
    };
    vi.spyOn(profilesStore, 'readProfile').mockResolvedValueOnce(mockProfile);

    vi.mocked(keytar.getPassword).mockResolvedValueOnce('my-keychain-pass');

    const credentials = await authManager.getCredentials('prod-profile');
    expect(credentials).toEqual({ password: 'my-keychain-pass' });
    expect(keytar.getPassword).toHaveBeenCalledWith(
      expect.stringMatching(/^qap\..+\.prod-profile$/),
      'admin'
    );
  });

  it('debe guardar un secreto correctamente en keytar con setSecret', async () => {
    const mockProfile: AuthProfile = {
      id: 'prod-profile',
      env: 'prod',
      username: 'admin',
      login_mode: 'auto',
      credential_source: 'keychain',
    };
    vi.spyOn(profilesStore, 'readProfile').mockResolvedValueOnce(mockProfile);

    await authManager.setSecret('prod-profile', 'new-pass');
    expect(keytar.setPassword).toHaveBeenCalledWith(
      expect.stringMatching(/^qap\..+\.prod-profile$/),
      'admin',
      'new-pass'
    );
  });

  it('debe confirmar si existen credenciales validas con hasValidCredentials', async () => {
    const mockProfile: AuthProfile = {
      id: 'dev-profile',
      env: 'dev',
      username: 'user1',
      login_mode: 'auto',
      credential_source: 'env',
      env_var: 'TEST_SECRET_TOKEN',
    };
    vi.spyOn(profilesStore, 'readProfile').mockResolvedValueOnce(mockProfile);

    process.env.TEST_SECRET_TOKEN = 'secret-token-123';

    const hasCreds = await authManager.hasValidCredentials('dev-profile');
    expect(hasCreds).toBe(true);
  });
});