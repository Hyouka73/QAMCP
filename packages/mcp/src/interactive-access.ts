import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { join } from 'node:path';

import { AuthManager, authBrowserDiagnosticsEnabled, credentialState, EphemeralCredentialProvider, KeychainCredentialProvider,
  PortableCredentialVault, promptLocalSecret, readProfile, readProfiles, SessionStore, TieredCredentialVault,
  type StorageState } from '@qap/auth';
import { SchemaValidator } from '@qap/shared';
import type { AuthProfile } from '@qap/shared';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import type { IDiscoveryAuthorizer } from './discovery-authorizer.js';
import { binding, isObject, projectRoot, result, type StateDependencies } from './handlers/state-services.js';
import { captureVerifiedAuto, captureVerifiedHandoff, verifyStoredSession, type HandoffRequest } from './verified-handoff.js';

export interface InteractiveScope {
  projectRoot: string;
  applicationId: string;
  environmentId: string;
  environmentRevision: number;
  baseUrl: string;
  origin: string;
}

type Operation = 'login' | 'test' | 'discovery_profile';
type SealedSession = {
  iv: Buffer;
  tag: Buffer;
  data: Buffer;
  selector: string;
  verificationUrl: string;
  expires: number;
  profile: AuthProfile;
  configuration?: string;
};

type VerifiedSession = { selector: string; verificationUrl: string; state: StorageState };
type PersistentSession = StorageState & { expires: number };
const validator = new SchemaValidator();

function configuration(profile: AuthProfile): string {
  return createHash('sha256').update(JSON.stringify(profile)).digest('hex');
}

function isSelector(value: unknown): value is string {
  return typeof value === 'string' && !!value.trim() && value.length <= 500 && !/\p{C}/u.test(value);
}

async function configuredProfile(scope: InteractiveScope, id: string): Promise<AuthProfile | undefined> {
  const profile = await readProfile(id, scope.projectRoot);
  return profile && validConfiguration(scope, profile) ? profile : undefined;
}

function validConfiguration(scope: InteractiveScope, profile: AuthProfile): boolean {
  if (!validInteractiveProfile(profile?.id) || !validator.validateProfiles({ _version: '1', profiles: [profile] }).valid) return false;
  if (profile.application_id !== scope.applicationId || profile.env !== scope.environmentId ||
      profile.login_origin !== scope.origin || profile.login_mode !== 'auto' ||
      !profile.username.trim() || profile.username.length > 256 || /\p{C}/u.test(profile.username) ||
      !route(profile.credential_source === 'env' ? profile.token_exchange_route : profile.login_route, scope) ||
      !route(profile.verification_route, scope) || profile.post_login_condition?.type !== 'selector_present' ||
      !isSelector(profile.post_login_condition.value) ||
      (profile.form_selectors && !Object.values(profile.form_selectors).every(isSelector))) return false;
  const origin = new URL(scope.origin);
  return origin.protocol === 'https:' || ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname);
}

function persistentStore(scope: InteractiveScope): SessionStore<PersistentSession> | undefined {
  if (!/^[0-9a-fA-F]{64}$/.test(process.env.QAP_SESSION_KEY ?? '')) return;
  return new SessionStore<PersistentSession>(join(scope.projectRoot, '.qa', 'cache', 'verified-sessions'), scope.projectRoot);
}

function persistentId(scope: InteractiveScope, profile: AuthProfile): string {
  return createHash('sha256').update(sessionKey(scope, profile.id)).update(configuration(profile)).digest('hex');
}

const MAX_SESSIONS = 32;
const SESSION_TTL = 60 * 60_000;
export const validInteractiveProfile = (id: unknown): id is string =>
  typeof id === 'string' && /^[a-z0-9][a-z0-9_-]{0,63}$/i.test(id);

export async function interactiveScope(
  root: string, dependencies: StateDependencies, environment?: string
): Promise<InteractiveScope | undefined> {
  const bound = binding(root, dependencies);
  if (!bound || (environment !== undefined && environment !== bound.environmentId)) return;
  const { applicationId, environmentId, store } = bound;
  const current = await store.get(applicationId, 'environment', environmentId);
  if (!current || current.entity.application_id !== applicationId || current.entity.environment_id !== environmentId) return;
  const url = new URL(current.entity.base_url);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) return;
  return { projectRoot: root, applicationId, environmentId, environmentRevision: current.revision,
    baseUrl: url.href, origin: url.origin };
}

export function sameInteractiveScope(a: InteractiveScope, b?: InteractiveScope): boolean {
  return Boolean(b && a.projectRoot === b.projectRoot && a.applicationId === b.applicationId &&
    a.environmentId === b.environmentId && a.environmentRevision === b.environmentRevision &&
    a.baseUrl === b.baseUrl && a.origin === b.origin);
}

function sessionKey(scope: InteractiveScope, profile: string): string {
  return JSON.stringify([scope.projectRoot, scope.applicationId, scope.environmentId,
    scope.environmentRevision, scope.baseUrl, scope.origin, profile]);
}

function route(value: unknown, scope: InteractiveScope): string | undefined {
  if (typeof value !== 'string' || value.length > 1024 || !value.startsWith('/') || value.startsWith('//') ||
      /[\\?#\s\p{C}]/u.test(value)) return;
  const url = new URL(value, scope.origin);
  return url.origin === scope.origin ? url.href : undefined;
}

const RECOVERY: Record<string, string> = {
  credentials_not_configured: 'Aprovisiona el perfil en el host y vuelve a solicitar auto con su identificador.',
  vault_locked: 'Desbloquea el Vault en el diálogo local al volver a solicitar auto.',
  credential_provider_unavailable: 'Revisa el proveedor de credenciales del host.',
  session_expired: 'Solicita auto para renovar la sesión o handoff para iniciar sesión manualmente.',
  authentication_required: 'Revisa el flujo y, si requiere intervención, solicita handoff.',
  authentication_diagnostics_enabled: 'Desactiva la depuración de Playwright en el host y vuelve a conectar.',
};

export function interactiveBlocked(code: string): CallToolResult {
  return result({ status: 'blocked', code, category: 'human_authorization',
    desbloquear_con: { mecanismo: 'local_host', descripcion: RECOVERY[code] ??
      'Revisa el contexto y solicita la operación desde una sesión interactiva del host.' } }, true);
}

/** One-shot consent and encrypted sessions owned by this MCP host process. */
export class InteractiveAccess {
  private readonly key = randomBytes(32);
  private readonly sessions = new Map<string, SealedSession>();
  private readonly logins = new Set<string>();
  private readonly ephemeral = new EphemeralCredentialProvider();

  constructor(
    private readonly dependencies: StateDependencies,
    private readonly authorizer?: IDiscoveryAuthorizer,
    private readonly capture = captureVerifiedHandoff,
    private readonly prompt = promptLocalSecret,
  ) {}

  close(): void {
    this.sessions.clear();
    this.ephemeral.close();
    this.key.fill(0);
  }

  async consent(operation: Operation, scope: InteractiveScope, profile: string | undefined,
    targetUrl: string, details: string, signal: AbortSignal): Promise<string | undefined> {
    const prefix = operation === 'login' ? 'authentication' : operation;
    if (signal.aborted) return prefix + '_authorization_cancelled';
    if (!this.authorizer) return prefix + '_authorization_required';
    const response = await this.authorizer.requestAuthorization({
      ...scope, targetUrl, interactiveOperation: { operation, profile, details: 'Origen: ' + scope.origin + '\n' + details },
    }, signal).catch(() => ({ decision: 'unavailable' as const }));
    if (signal.aborted) return prefix + '_authorization_cancelled';
    if (response.decision === 'cancelled') return prefix +
      (response.code === 'discovery_authorization_expired' ? '_authorization_expired' : '_authorization_cancelled');
    if (response.decision === 'rejected') return prefix + '_authorization_rejected';
    if (response.decision !== 'approved') return prefix + '_gui_unavailable';
    return response.root !== scope.projectRoot || response.targetUrl !== targetUrl ? 'authorization_context_mismatch' : undefined;
  }

  readSession(scope: InteractiveScope, profile: string): VerifiedSession | undefined {
    const id = sessionKey(scope, profile);
    const sealed = this.sessions.get(id);
    if (!sealed) return;
    if (sealed.expires <= Date.now()) { this.sessions.delete(id); return; }
    const decipher = createDecipheriv('aes-256-gcm', this.key, sealed.iv);
    decipher.setAAD(Buffer.from(id));
    decipher.setAuthTag(sealed.tag);
    const clear = Buffer.concat([decipher.update(sealed.data), decipher.final()]);
    try {
      const state = JSON.parse(clear.toString('utf8')) as StorageState;
      if (state.cookies.some(cookie => cookie.expires > 0 && cookie.expires * 1000 <= Date.now())) return;
      return { selector: sealed.selector, verificationUrl: sealed.verificationUrl, state };
    } finally { clear.fill(0); }
  }

  /** Resolve only a previously verified, scoped session. Callers authorize and probe before use. */
  async resolveSession(scope: InteractiveScope, id: string): Promise<VerifiedSession | undefined> {
    if (authBrowserDiagnosticsEnabled()) return undefined;
    try { return (await this.session(scope, id))?.session; }
    catch { return undefined; }
  }

  private async session(scope: InteractiveScope, id: string, profile?: AuthProfile): Promise<{
    session: VerifiedSession; expires: number; persistence: 'host_process' | 'encrypted_disk';
  } | undefined> {
    const sealed = this.sessions.get(sessionKey(scope, id));
    if (sealed && !sealed.configuration && !profile) {
      const session = this.readSession(scope, id);
      if (session) return { session, expires: sealed.expires, persistence: 'host_process' };
    }
    profile ??= await configuredProfile(scope, id);
    if (!profile) return;
    if (sealed?.configuration === configuration(profile)) {
      const session = this.readSession(scope, id);
      if (session) return { session, expires: sealed.expires, persistence: 'host_process' };
    }
    if (profile.session_cache?.enabled === false || profile.credential_source === 'ephemeral') return;
    const store = persistentStore(scope);
    if (!store) return;
    try {
      const cached = store.getValidSession(persistentId(scope, profile), true);
      if (cached && cached.expires > Date.now()) {
        const { expires, cookies, origins } = cached;
        return { expires, persistence: 'encrypted_disk', session: { state: { cookies, origins },
          selector: profile.post_login_condition!.value, verificationUrl: route(profile.verification_route, scope)! } };
      }
    } finally { store.close(); }
    return undefined;
  }

  async profiles(root: string): Promise<AuthProfile[]> {
    const scope = await interactiveScope(root, this.dependencies);
    if (!scope) return [];
    const profiles: AuthProfile[] = [];
    for (const [id, sealed] of this.sessions) {
      if (id === sessionKey(scope, sealed.profile.id) && await this.resolveSession(scope, sealed.profile.id)) {
        profiles.push({ ...sealed.profile, verified: true });
      }
    }
    return profiles;
  }

  async profileStatuses(root: string): Promise<Array<{ id: string; env: string; code: string; verified: boolean }>> {
    const scope = await interactiveScope(root, this.dependencies);
    if (!scope) return [];
    const statuses = new Map((await this.profiles(root)).map(profile => [profile.id, {
      id: profile.id, env: scope.environmentId, code: 'session_valid', verified: true,
    }]));
    for (const profile of readProfiles(root)) {
      if (validConfiguration(scope, profile) && !statuses.has(profile.id)) {
        statuses.set(profile.id, { id: profile.id, env: scope.environmentId, code: 'authentication_required', verified: false });
      }
    }
    return [...statuses.values()];
  }

  private remember(scope: InteractiveScope, profile: AuthProfile, session: VerifiedSession,
    expires: number, configured?: AuthProfile): void {
    const id = sessionKey(scope, profile.id);
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    cipher.setAAD(Buffer.from(id));
    const data = Buffer.concat([cipher.update(JSON.stringify(session.state), 'utf8'), cipher.final()]);
    this.sessions.delete(id);
    this.sessions.set(id, { iv, tag: cipher.getAuthTag(), data, selector: session.selector,
      verificationUrl: session.verificationUrl, expires, profile,
      configuration: configured && configuration(configured) });
    const oldest = this.sessions.keys().next();
    if (this.sessions.size > MAX_SESSIONS && !oldest.done) this.sessions.delete(oldest.value);
  }

  private async automatic(scope: InteractiveScope, profile: AuthProfile, request: HandoffRequest, signal: AbortSignal,
    stillAuthorized: () => Promise<boolean>): ReturnType<typeof captureVerifiedAuto> {
    const portable = profile.credential_source === 'vault' ? new PortableCredentialVault(scope.projectRoot) : undefined;
    const manager = new AuthManager(scope.projectRoot, { vault: new TieredCredentialVault({
      keychain: new KeychainCredentialProvider(), vault: portable, ephemeral: this.ephemeral,
    }) });
    const destination = [scope.projectRoot, scope.applicationId, scope.environmentId, profile.id, profile.username, scope.origin].join(' / ');
    try {
      if (portable) {
        const passphrase = await this.prompt('Desbloquear Vault de QAP para ' + destination, signal);
        if (!passphrase) return { code: 'vault_locked' };
        await portable.unlock(passphrase);
      }
      let credentials = await manager.getProfileCredentials(profile, true);
      if (!credentials && profile.credential_source === 'ephemeral') {
        const password = await this.prompt('Contraseña de pruebas para esta conexión de QAP: ' + destination, signal);
        if (password && !signal.aborted && await stillAuthorized()) {
          await manager.setProfileSecret(profile, password);
          credentials = await manager.getProfileCredentials(profile, true);
        }
      }
      if (!credentials) return { code: 'credentials_not_configured' };
      if (!await stillAuthorized()) return { code: 'authorization_context_mismatch' };
      return await captureVerifiedAuto(request, profile, credentials, signal);
    } catch (error) {
      const state = credentialState(error);
      return { code: portable && state !== 'unavailable' ? 'vault_locked'
        : state === 'invalid' ? 'invalid_auth_context' : 'credential_provider_unavailable' };
    } finally { portable?.close(); }
  }

  async login(args: Record<string, unknown>, signal: AbortSignal): Promise<CallToolResult> {
    if (Object.keys(args).some(key => !['targetPath', 'profile', 'env', 'method', 'login_mode', 'login_route',
      'verification_route', 'timeout_ms', 'post_login_condition', 'role'].includes(key))) {
      return interactiveBlocked('agent_auth_material_not_supported');
    }
    if (!this.authorizer) return interactiveBlocked('authentication_authorization_required');
    const profile = args.profile;
    if (!validInteractiveProfile(profile) || (args.env !== undefined && typeof args.env !== 'string')) {
      return interactiveBlocked('invalid_auth_context');
    }
    const method = args.method ?? args.login_mode ?? 'handoff';
    if ((method !== 'auto' && method !== 'handoff' && method !== 'reuse') ||
        (args.login_mode !== undefined && args.login_mode !== method)) return interactiveBlocked('invalid_auth_method');
    const timeoutMs = args.timeout_ms ?? 120_000;
    if (typeof timeoutMs !== 'number' || !Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 120_000) {
      return interactiveBlocked('invalid_handoff_timeout');
    }

    const root = projectRoot(args, this.dependencies, true);
    const scope = await interactiveScope(root, this.dependencies, args.env);
    if (!scope) return interactiveBlocked('auth_context_mismatch');
    const id = sessionKey(scope, profile);
    if (this.logins.has(id)) return interactiveBlocked('authentication_in_progress');
    this.logins.add(id);
    try {
      if (method !== 'handoff' && ['login_route', 'verification_route', 'post_login_condition', 'role'].some(key => key in args)) {
        return interactiveBlocked('use_local_auth_profile');
      }
      if (authBrowserDiagnosticsEnabled()) return interactiveBlocked('authentication_diagnostics_enabled');
      const configured = method === 'handoff' ? undefined : await configuredProfile(scope, profile);
      if (method === 'auto' && !configured) return interactiveBlocked('credentials_not_configured');
      const cached = method === 'handoff' ? undefined : await this.session(scope, profile, configured);
      if (method === 'reuse' && !cached) return interactiveBlocked('session_expired');

      const role = configured?.role ?? args.role;
      if (role !== undefined && (typeof role !== 'string' || !role.trim() || role.length > 128 || /\p{C}/u.test(role))) {
        return interactiveBlocked('invalid_auth_context');
      }
      const condition = configured?.post_login_condition ?? args.post_login_condition;
      if (method === 'handoff' && isObject(condition) && Object.keys(condition).some(key => key !== 'type' && key !== 'value')) {
        return interactiveBlocked('agent_auth_material_not_supported');
      }
      const selector = method === 'reuse' ? cached?.session.selector :
        isObject(condition) && condition.type === 'selector_present' ? condition.value : undefined;
      if (!isSelector(selector)) return interactiveBlocked('invalid_post_login_condition');
      const verificationUrl = method === 'reuse' ? cached?.session.verificationUrl :
        route(configured?.verification_route ?? args.verification_route, scope);
      const loginUrl = method === 'reuse' ? verificationUrl : route(configured?.credential_source === 'env'
        ? configured.token_exchange_route : configured?.login_route ?? args.login_route ?? '/login', scope);
      if (!loginUrl || !verificationUrl) return interactiveBlocked('invalid_auth_routes');

      const stillAuthorized = async () => sameInteractiveScope(scope, await interactiveScope(
        projectRoot(args, this.dependencies, true), this.dependencies, scope.environmentId)) &&
        (!configured || JSON.stringify(await configuredProfile(scope, profile)) === JSON.stringify(configured));
      const recheck = async (): Promise<string | undefined> => {
        if (signal.aborted) return 'authentication_authorization_cancelled';
        if (!await stillAuthorized()) return 'authorization_context_mismatch';
        return undefined;
      };
      const details = ['Método: ' + method, 'Ruta de verificación: ' + verificationUrl, 'Marcador visible: ' + selector,
        ...(configured ? ['Cuenta: ' + configured.username, 'Proveedor: ' + configured.credential_source,
          'Se intentará reutilizar la sesión antes de enviar la credencial.'] : []), ...(role ? ['Rol: ' + role] : [])];
      const blocked = await this.consent('login', scope, profile, loginUrl, details.join('\n'), signal) ?? await recheck();
      if (blocked) return interactiveBlocked(blocked);
      const request = { origin: scope.origin, loginUrl, verificationUrl, selector, timeoutMs };
      if (cached && (method === 'reuse' || cached.session.verificationUrl === verificationUrl && cached.session.selector === selector)) {
        const checked = await verifyStoredSession(request, cached.session.state, signal);
        const changed = await recheck();
        if (changed) return interactiveBlocked(changed);
        if (checked.state && cached.expires > Date.now()) {
          this.remember(scope, configured ?? this.sessions.get(id)!.profile, cached.session, cached.expires, configured);
          return result({ status: 'success', code: 'session_valid', profile, verified: true,
            environment: scope.environmentId, session_scope: cached.persistence });
        }
        if (checked.code && checked.code !== 'session_expired') return interactiveBlocked(checked.code);
        this.sessions.delete(id);
      }
      if (method === 'reuse') return interactiveBlocked('session_expired');

      const captured = configured
        ? await this.automatic(scope, configured, request, signal, stillAuthorized)
        : await this.capture(request, signal);
      const changed = await recheck();
      if (changed) return interactiveBlocked(changed);
      if (!captured.state) return interactiveBlocked(captured.code);

      const expires = Date.now() + Math.min(SESSION_TTL, configured?.session_cache?.ttl_ms ?? SESSION_TTL);
      this.remember(scope, configured ?? { id: profile, env: scope.environmentId, application_id: scope.applicationId,
        username: '', role, login_mode: 'handoff', credential_source: 'ephemeral' },
      { selector, verificationUrl, state: captured.state }, expires, configured);
      let persistence = 'host_process';
      if (configured && configured.credential_source !== 'ephemeral' && configured.session_cache?.enabled !== false && expires > Date.now()) {
        try {
          const store = persistentStore(scope);
          if (store) {
            try {
              store.saveSession(persistentId(scope, configured), { ...captured.state, expires });
              persistence = 'encrypted_disk';
            } finally { store.close(); }
          }
        } catch { /* A verified session is still usable in this host process. */ }
      }
      return result({ status: 'success', code: 'authentication_verified', profile, environment: scope.environmentId,
        verified: true, session_scope: persistence });
    } catch {
      return interactiveBlocked(signal.aborted ? 'authentication_authorization_cancelled' : 'authentication_failed');
    } finally { this.logins.delete(id); }
  }
}
