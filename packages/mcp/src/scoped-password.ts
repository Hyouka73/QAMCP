import { createHash } from 'node:crypto';

import { AuthManager, isValidUsernameIdentifier, readProfiles, type StorageState } from '@qap/auth';
import { isAuthPath, type AuthProfile, type EnvironmentRecord } from '@qap/shared';

import type { QapApplicationService } from './application/application-service.js';
import { atomicWritePrivateFile, resolveContainedPath } from './application/safe-storage.js';
import { captureVerifiedPassword } from './verified-handoff.js';

export function scopedRoute(route: unknown, origin: string): string | undefined {
  if (typeof route !== 'string' || !route.startsWith('/') || /[\\?#;\u0000-\u0020]/.test(route) ||
      route.startsWith('//') || route.length > 2048) return;
  const url = new URL(route, origin);
  return url.origin === origin ? url.pathname : undefined;
}

export async function authenticateScopedPassword(
  service: QapApplicationService, projectId: string, environment: EnvironmentRecord, root: string,
  args: Record<string, unknown>, signal: AbortSignal,
): Promise<Record<string, unknown>> {
  const blocked = (code: string, extra?: Record<string, unknown>) => ({ status: 'blocked', code, ...extra });
  const id = args.profile;
  if (typeof id !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/.test(id)) return blocked('invalid_auth_arguments');
  const origin = new URL(environment.base_url).origin;
  if (environment.is_production || (args.env !== undefined && args.env !== environment.name) ||
      (args.login_origin !== undefined && args.login_origin !== origin)) return blocked('login_outside_configured_qa_environment');

  const profilesPath = resolveContainedPath(root, '.qa/project/auth/profiles.json');
  const profiles = readProfiles(root);
  const previous = profiles.find(profile => profile.id === id && profile.env === environment.name);
  const match = service.resolveProfileAlias(projectId, id, environment.env_id);
  if (match.status === 'ambiguous' || (match.status === 'matched' && match.profile.label !== id)) return blocked('ambiguous_auth_profile');
  const existing = match.status === 'matched' ? match.profile : undefined;
  if (existing?.status === 'revoked' || existing?.revoked_at) return blocked('auth_session_revoked');
  const tenant = service.validateTenantScope(projectId, typeof args.tenant_id === 'string' ? args.tenant_id : undefined,
    id, environment.env_id);
  if (!tenant.ok) return blocked(tenant.code);
  const scope = { origin, profile_id: id, ...(tenant.tenant_id ? { tenant_id: tenant.tenant_id } : {}) };
  const access = service.authority.check(projectId, 'access', { root_path: root });
  const login = service.authority.check(projectId, 'login', scope);
  if (!access.allowed || (!login.allowed && ['revoked', 'expired'].includes(login.reason))) return blocked('login_permission_unavailable');

  const suppliedPassword = typeof args.password === 'string' ? args.password : undefined;
  if (!suppliedPassword && previous?.login_mode === 'handoff') return blocked('handoff_required');
  if (!suppliedPassword && (!previous || (previous.login_origin && previous.login_origin !== origin))) {
    return blocked('credentials_not_saved');
  }
  const username = args.username ?? previous?.username;
  if (!isValidUsernameIdentifier(username) || (!suppliedPassword && username !== previous?.username)) return blocked('invalid_auth_arguments');
  const loginPath = scopedRoute(args.login_route ?? previous?.login_route ?? '/login', origin);
  const requestedVerification = args.verification_route ?? previous?.verification_route;
  const verificationPath = scopedRoute(requestedVerification, origin);
  if (!loginPath || (requestedVerification !== undefined && (!verificationPath || verificationPath === loginPath ||
      isAuthPath(verificationPath)))) return blocked('login_outside_configured_qa_environment');

  const condition = (args.post_login_condition ?? previous?.post_login_condition) as AuthProfile['post_login_condition'];
  if (args.post_login_condition !== undefined && (condition?.type !== 'selector_present' ||
      typeof condition.value !== 'string' || !condition.value.trim() || condition.value.length > 500)) return blocked('invalid_post_login_condition');
  const selectors = (args.form_selectors ?? previous?.form_selectors) as AuthProfile['form_selectors'];
  if (args.form_selectors !== undefined && (!selectors || Object.keys(selectors).length !== 3 ||
      ![selectors.username, selectors.password, selectors.submit].every(value =>
        typeof value === 'string' && value.trim() && value.length <= 500))) return blocked('invalid_auth_arguments');

  // Include the origin and account in the reference even if the active environment's URL changes in place.
  const account = createHash('sha256').update(JSON.stringify([origin, username])).digest('hex');
  let password = suppliedPassword;
  if (!password) {
    try {
      if (existing?.credential_ref_key === account) password = (await service.readProfileSecret(projectId, existing.profile_id))?.password;
      if (!password && previous?.credential_source === 'keychain' && login.allowed &&
          (!previous.login_origin || previous.login_origin === origin)) {
        const manager = new AuthManager(root);
        try { password = (await manager.getProfileCredentials(previous, true))?.password; }
        finally { manager.close(); }
      }
    } catch { return blocked('keychain_unavailable'); }
    if (!password) return blocked('credentials_not_saved');
  }

  const profile: AuthProfile = {
    ...previous, id, env: environment.name, username, login_mode: 'auto', login_origin: origin,
    login_route: loginPath, ...(verificationPath ? { verification_route: verificationPath } : {}),
    ...(selectors ? { form_selectors: selectors } : {}),
    // The old default /dashboard was a guess. The actual landing page can be probed independently.
    post_login_condition: condition?.type === 'selector_present' ? condition : undefined,
    role: typeof args.role === 'string' ? args.role : previous?.role,
    credential_source: 'keychain', session_cache: { enabled: true }, verified: false,
    verified_at: undefined, verified_route: undefined,
  };
  const persist = () => atomicWritePrivateFile(profilesPath, JSON.stringify({
    _version: '1', profiles: [...profiles.filter(item => item.id !== id || item.env !== environment.name), profile],
  }, null, 2));
  const row = service.upsertProfile({ projectId, envId: environment.env_id, label: id, roleName: profile.role,
    tenantId: tenant.tenant_id, loginMode: 'auto', credentialAccount: account, status: 'pending' });
  try { await service.storeProfileSecret(projectId, row.profile_id, { password }); }
  catch {
    if (existing) service.upsertProfile({ projectId, envId: environment.env_id, label: id, loginMode: existing.login_mode,
      credentialAccount: existing.credential_ref_key, status: existing.status });
    return blocked('keychain_unavailable');
  }
  if (!login.allowed) service.authority.grant({ project_id: projectId, env_id: environment.env_id,
    capability: 'login', scope, granted_by: 'host_bound_scope' });
  persist();
  const timeout = typeof args.timeout_ms === 'number' && Number.isFinite(args.timeout_ms) ? args.timeout_ms : 30_000;
  const captured = await captureVerifiedPassword({
    origin, loginUrl: new URL(loginPath, origin).href, timeoutMs: Math.min(45_000, Math.max(5_000, timeout)),
    ...(verificationPath ? { verificationUrl: new URL(verificationPath, origin).href } : {}),
    selector: profile.post_login_condition?.value,
  }, profile, { username, password }, signal);
  if (!captured.state || !captured.verificationPath) {
    service.expireProfileSession(projectId, row.profile_id);
    return blocked(captured.code ?? 'authentication_required', {
      ...(captured.failureReason ? { login_result: captured.failureReason } : {}),
      perfil: id, secretSaved: true, downgraded_to_anonymous: false,
    });
  }
  profile.verified = true;
  profile.verified_at = new Date().toISOString();
  profile.verified_route = captured.verificationPath;
  service.saveProfileSession(projectId, row.profile_id, captured.state, { verifiedAt: profile.verified_at });
  persist();
  return { status: 'success', code: 'authentication_verified', secretSaved: true, profile: {
    id, env: environment.name, role: profile.role, verified: true, verified_at: profile.verified_at, verified_route: profile.verified_route,
  } };
}

export function usableScopedSession(
  service: QapApplicationService, projectId: string, profileId: string, profile: AuthProfile | undefined, origin: string,
): boolean {
  if (!profile || (profile.login_origin && profile.login_origin !== origin)) return false;
  const data = service.readProfileSession<StorageState>(projectId, profileId);
  return Boolean(data?.profile.status === 'verified' && data.session && !data.revoked && !data.expired);
}
