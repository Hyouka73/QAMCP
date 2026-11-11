import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { join } from 'node:path';

import {
  AuthManager,
  authBrowserDiagnosticsEnabled,
  classifyEnvironmentPolicy,
  createProfile,
  CredentialError,
  credentialState,
  EphemeralCredentialProvider,
  findProfiles,
  isPrivilegedProfile,
  isValidUsernameIdentifier,
  KeychainCredentialProvider,
  PortableCredentialVault,
  promptLocalSecret,
  readProfile,
  readProfiles,
  selectProfile,
  SessionStore,
  TieredCredentialVault,
  updateProfile,
  type CredentialState,
  type EnvironmentPolicyTier,
  type ProfileQueryCriteria,
  type StorageState,
} from '@qap/auth';
import { SchemaValidator } from '@qap/shared';
import type { AuthProfile, PreviousAccountReference } from '@qap/shared';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import type { IDiscoveryAuthorizer } from './discovery-authorizer.js';
import { authorizationDiagnostic } from './authorization-diagnostics.js';
import { binding, isObject, projectRoot, result, validateBase, type StateDependencies } from './handlers/state-services.js';
import { captureVerifiedAuto, captureVerifiedHandoff, verifyStoredSession, type HandoffRequest } from './verified-handoff.js';

export interface InteractiveScope {
  projectRoot: string;
  applicationId: string;
  environmentId: string;
  environmentRevision: number;
  baseUrl: string;
  origin: string;
  isProduction?: boolean;
}

export interface InteractivePolicyRestrictions {
  readonly authorizedProfiles?: readonly string[];
  readonly authorizationTtlMs?: number;
  readonly sessionPersistenceKey?: string;
  readonly authorizationPersistencePath?: string;
}

export interface QaSessionAuthorizationGrant {
  readonly projectRoot: string;
  readonly applicationId: string;
  readonly environmentId: string;
  readonly environmentRevision: number;
  readonly baseUrl: string;
  readonly origin: string;
  readonly profile: string;
  readonly profileFingerprint: string;
  readonly operations: readonly Operation[];
  readonly grantedAt: number;
  readonly expiresAt: number;
}

export interface ProfileStatusSummary {
  id: string;
  env: string;
  code: string;
  verified: boolean;
  username?: string;
  application_id?: string;
  role?: string;
  alias?: string;
  aliases?: string[];
  scenario?: string;
  scenarios?: string[];
  login_origin?: string;
  login_route?: string;
  verification_route?: string;
  credential_source?: string;
  credential_state?: CredentialState;
  policy_tier?: EnvironmentPolicyTier;
  privileged?: boolean;
  previous_accounts?: PreviousAccountReference[];
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

async function configuredProfile(scope: InteractiveScope, idOrSelector: string): Promise<AuthProfile | undefined> {
  if (validInteractiveProfile(idOrSelector)) {
    const direct = await readProfile(idOrSelector, scope.projectRoot);
    if (direct && validConfiguration(scope, direct)) return direct;
  }
  const byAlias = selectProfile(
    { application_id: scope.applicationId, env: scope.environmentId, alias: idOrSelector },
    scope.projectRoot
  );
  if (byAlias.profile && validConfiguration(scope, byAlias.profile)) {
    return byAlias.profile;
  }
  return undefined;
}

function validConfiguration(scope: InteractiveScope, profile: AuthProfile): boolean {
  if (!validInteractiveProfile(profile?.id) || !validator.validateProfiles({ _version: '1', profiles: [profile] }).valid) return false;
  if (profile.application_id !== scope.applicationId || profile.env !== scope.environmentId ||
      profile.login_origin !== scope.origin || (profile.login_mode !== 'auto' && profile.login_mode !== 'handoff') ||
      !isValidUsernameIdentifier(profile.username) ||
      !route(profile.credential_source === 'env' ? profile.token_exchange_route : profile.login_route, scope) ||
      !route(profile.verification_route, scope) || profile.post_login_condition?.type !== 'selector_present' ||
      !isSelector(profile.post_login_condition.value) ||
      (profile.form_selectors && !Object.values(profile.form_selectors).every(isSelector))) return false;
  const origin = new URL(scope.origin);
  return origin.protocol === 'https:' || ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname);
}

function persistentStore(scope: InteractiveScope, explicitKeyHex?: string): SessionStore<PersistentSession> | undefined {
  const keyHex = process.env.QAP_SESSION_KEY ?? explicitKeyHex ?? '';
  if (!/^[0-9a-fA-F]{64}$/.test(keyHex)) return;
  return new SessionStore<PersistentSession>(join(scope.projectRoot, '.qa', 'cache', 'verified-sessions'), scope.projectRoot, keyHex);
}

function persistentId(scope: InteractiveScope, profile: AuthProfile): string {
  return createHash('sha256').update(sessionKey(scope, profile.id)).update(configuration(profile)).digest('hex');
}

const MAX_SESSIONS = 32;
const SESSION_TTL = 60 * 60_000;
const DEFAULT_QA_AUTH_TTL_MS = 4 * 60 * 60_000;
const MAX_QA_AUTH_TTL_MS = 30 * 24 * 60 * 60_000;
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
  return {
    projectRoot: root,
    applicationId,
    environmentId,
    environmentRevision: current.revision,
    baseUrl: url.href,
    origin: url.origin,
    isProduction: Boolean(current.entity.is_production),
  };
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
  credentials_not_configured: 'Aprovisiona el perfil en el host con qap_auth_provision y vuelve a solicitar auto con su identificador.',
  vault_locked: 'Desbloquea el Vault en el diálogo local al volver a solicitar auto.',
  credential_provider_unavailable: 'Revisa el proveedor de credenciales del host.',
  keychain_module_unavailable: 'Reinstala las dependencias del checkout de QAP con el lockfile y reinicia el MCP.',
  credential_dialog_desktop_unavailable: 'Abre QAP en el escritorio interactivo de Windows.',
  credential_dialog_start_failed: 'Verifica que Windows PowerShell pueda iniciar en el host.',
  credential_dialog_not_presented: 'Abre QAP en el escritorio activo y vuelve a solicitar la operación.',
  credential_dialog_failed: 'Revisa la ejecución local del diálogo de credenciales.',
  credential_dialog_response_timeout: 'Vuelve a solicitar la operación y responde en el diálogo local.',
  credential_dialog_cancelled: 'Vuelve a solicitar la operación cuando puedas confirmar en el escritorio.',
  session_expired: 'Solicita auto para renovar la sesión o handoff para iniciar sesión manualmente.',
  session_invalid: 'La ruta de verificación no protege el acceso o no devolvió una sesión autenticada válida; revisa verification_route y post_login_condition.',
  authentication_required: 'Verifica que el username y la credencial almacenada sean correctos o actualiza el perfil antes de reintentar.',
  credentials_rejected: 'Las credenciales fueron rechazadas por el formulario de login; verifica el usuario y aprovisiona la contraseña correcta.',
  login_form_not_found: 'No se encontró un formulario de inicio de sesión válido en login_route; revisa login_route y form_selectors.',
  submit_button_disabled: 'El botón de envío del formulario permaneció deshabilitado; revisa los campos requeridos o form_selectors.',
  login_navigation_failed: 'No se pudo cargar la ruta de login dentro del origen autorizado.',
  post_login_verification_failed: 'El inicio de sesión no alcanzó una ruta protegida con el selector esperado.',
  challenge_detected: 'Se detectó un reto interactivo (MFA o CAPTCHA) en el formulario; solicita handoff para intervención humana.',
  authentication_diagnostics_enabled: 'Desactiva la depuración de Playwright en el host y vuelve a conectar.',
  profile_already_exists: 'El perfil ya existe; usa action: "update" para actualizarlo o selecciona otro identificador/alias.',
  profile_not_found: 'No se encontró un perfil que coincida con los criterios; créalo con action: "create" o verifica qap_auth_list.',
  profile_selection_ambiguous: 'Existen múltiples perfiles para este criterio; especifica profile, alias, username, role o scenario.',
  privileged_profile_authorization_required: 'El perfil o entorno es privilegiado y requiere autorización explícita de la política del host.',
  invalid_username_identifier: 'Proporciona un identificador de usuario válido (no vacío y sin caracteres de control).',
};

export function interactiveBlocked(code: string, extra?: Record<string, unknown>): CallToolResult {
  return result({
    status: 'blocked',
    code,
    category: 'human_authorization',
    ...(extra ?? {}),
    desbloquear_con: {
      mecanismo: 'local_host',
      descripcion: RECOVERY[code] ?? 'Revisa el contexto y solicita la operación desde una sesión interactiva del host.',
    },
  }, true);
}

const ALLOWED_LOGIN_ARGS = new Set([
  'targetPath',
  'profile',
  'action',
  'env',
  'username',
  'application_id',
  'login_origin',
  'alias',
  'aliases',
  'scenario',
  'scenarios',
  'credential_source',
  'form_selectors',
  'revoke_previous_credential',
  'method',
  'login_mode',
  'login_route',
  'verification_route',
  'timeout_ms',
  'post_login_condition',
  'role',
]);

/** One-shot consent and encrypted sessions owned by this MCP host process. */
export class InteractiveAccess {
  private readonly key = randomBytes(32);
  private readonly sessions = new Map<string, SealedSession>();
  private readonly authorizations = new Map<string, QaSessionAuthorizationGrant>();
  private authorizationsLoaded = false;
  private readonly logins = new Set<string>();
  private provisioning = false;
  private readonly ephemeral = new EphemeralCredentialProvider();

  constructor(
    private readonly dependencies: StateDependencies,
    private readonly authorizer?: IDiscoveryAuthorizer,
    private readonly capture = captureVerifiedHandoff,
    private readonly prompt = promptLocalSecret,
    private readonly policyRestrictions?: InteractivePolicyRestrictions,
  ) {}

  close(): void {
    this.sessions.clear();
    this.authorizations.clear();
    this.ephemeral.close();
    this.key.fill(0);
  }

  private getAuthorizationTtlMs(): number {
    const envRaw = process.env.QAP_SESSION_AUTH_TTL_MS;
    if (envRaw) {
      const parsed = Number(envRaw);
      if (Number.isInteger(parsed) && parsed > 0 && parsed <= MAX_QA_AUTH_TTL_MS) return parsed;
    }
    const configured = this.policyRestrictions?.authorizationTtlMs;
    if (typeof configured === 'number' && Number.isInteger(configured) && configured > 0 && configured <= MAX_QA_AUTH_TTL_MS) {
      return configured;
    }
    return DEFAULT_QA_AUTH_TTL_MS;
  }

  private getSessionPersistenceKey(): string | undefined {
    return this.policyRestrictions?.sessionPersistenceKey;
  }

  private authorizationKey(): Buffer | undefined {
    const value = this.getSessionPersistenceKey();
    return value && /^[0-9a-fA-F]{64}$/.test(value) ? Buffer.from(value, 'hex') : undefined;
  }

  private authorizationPath(): string | undefined {
    return this.policyRestrictions?.authorizationPersistencePath;
  }

  private loadAuthorizations(): void {
    if (this.authorizationsLoaded) return;
    this.authorizationsLoaded = true;
    const path = this.authorizationPath();
    const key = this.authorizationKey();
    if (!path || !key || !existsSync(path)) { key?.fill(0); return; }
    try {
      const encoded = readFileSync(path, 'utf8');
      if (encoded.length > 1_000_000) return;
      const envelope = JSON.parse(encoded) as { iv?: string; tag?: string; data?: string };
      if (![envelope.iv, envelope.tag, envelope.data].every(value => typeof value === 'string' && /^[0-9a-f]+$/i.test(value))) return;
      const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(envelope.iv!, 'hex'));
      decipher.setAAD(Buffer.from('qap-qa-authorizations-v1'));
      decipher.setAuthTag(Buffer.from(envelope.tag!, 'hex'));
      const clear = Buffer.concat([decipher.update(Buffer.from(envelope.data!, 'hex')), decipher.final()]);
      try {
        const grants: unknown = JSON.parse(clear.toString('utf8'));
        if (!Array.isArray(grants)) return;
        for (const value of grants) {
          if (!value || typeof value !== 'object') continue;
          const grant = value as QaSessionAuthorizationGrant;
          if (typeof grant.projectRoot !== 'string' || typeof grant.applicationId !== 'string' ||
              typeof grant.environmentId !== 'string' || !Number.isSafeInteger(grant.environmentRevision) ||
              typeof grant.baseUrl !== 'string' || typeof grant.origin !== 'string' ||
              typeof grant.profile !== 'string' || typeof grant.profileFingerprint !== 'string' ||
              !Array.isArray(grant.operations) || grant.operations.some(op => op !== 'login' && op !== 'discovery_profile') ||
              !Number.isFinite(grant.expiresAt) || grant.expiresAt <= Date.now()) continue;
          this.authorizations.set(sessionKey({ ...grant, isProduction: false }, grant.profile), grant);
        }
      } finally { clear.fill(0); }
    } catch { /* Corrupt or unauthenticated grants fail closed. */ }
    finally { key.fill(0); }
  }

  private persistAuthorizations(): boolean {
    const path = this.authorizationPath();
    const key = this.authorizationKey();
    if (!path || !key) return false;
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    cipher.setAAD(Buffer.from('qap-qa-authorizations-v1'));
    const clear = Buffer.from(JSON.stringify([...this.authorizations.values()]));
    try {
      const data = Buffer.concat([cipher.update(clear), cipher.final()]);
      const dir = dirname(path);
      mkdirSync(dir, { recursive: true, mode: 0o700 });
      const staging = `${path}.${randomBytes(8).toString('hex')}.tmp`;
      writeFileSync(staging, JSON.stringify({ iv: iv.toString('hex'), tag: cipher.getAuthTag().toString('hex'), data: data.toString('hex') }), { flag: 'wx', mode: 0o600 });
      renameSync(staging, path);
      data.fill(0);
      return true;
    } catch { /* Persistence failure is fail closed on next process start. */ }
    finally { clear.fill(0); key.fill(0); }
    authorizationDiagnostic('qa_session_authorization_persist_failed');
    return false;
  }

  hasValidSessionAuthorization(
    scope: InteractiveScope,
    profile: string | undefined,
    operation: Operation
  ): boolean {
    this.loadAuthorizations();
    if (!profile) return false;
    const key = sessionKey(scope, profile);
    const grant = this.authorizations.get(key);
    if (!grant) return false;
    if (grant.expiresAt <= Date.now()) {
      this.authorizations.delete(key);
      this.persistAuthorizations();
      return false;
    }
    if (
      grant.projectRoot !== scope.projectRoot ||
      grant.applicationId !== scope.applicationId ||
      grant.environmentId !== scope.environmentId ||
      grant.environmentRevision !== scope.environmentRevision ||
      grant.baseUrl !== scope.baseUrl ||
      grant.origin !== scope.origin ||
      grant.profile !== profile
    ) {
      this.authorizations.delete(key);
      this.persistAuthorizations();
      return false;
    }
    return grant.operations.includes(operation);
  }

  getSessionAuthorization(
    scope: InteractiveScope,
    profile: string | undefined
  ): QaSessionAuthorizationGrant | undefined {
    this.loadAuthorizations();
    if (!profile) return undefined;
    const key = sessionKey(scope, profile);
    const grant = this.authorizations.get(key);
    if (!grant) return undefined;
    if (grant.expiresAt <= Date.now()) {
      this.authorizations.delete(key);
      this.persistAuthorizations();
      return undefined;
    }
    return grant;
  }

  revokeAuthorization(scope: InteractiveScope, profile?: string): number {
    this.loadAuthorizations();
    let revoked = 0;
    if (profile) {
      const key = sessionKey(scope, profile);
      if (this.authorizations.delete(key)) revoked++;
      this.sessions.delete(key);
      if (revoked) this.persistAuthorizations();
      return revoked;
    }
    for (const [key, grant] of this.authorizations.entries()) {
      if (
        grant.projectRoot === scope.projectRoot &&
        grant.applicationId === scope.applicationId &&
        grant.environmentId === scope.environmentId
      ) {
        this.authorizations.delete(key);
        this.sessions.delete(key);
        revoked++;
      }
    }
    if (revoked) this.persistAuthorizations();
    return revoked;
  }

  private isHostAuthorizedForPrivileged(_scope: InteractiveScope, profileId: string): boolean {
    const allowed = this.policyRestrictions?.authorizedProfiles;
    if (allowed && allowed.includes(profileId)) return true;
    return false;
  }

  private invalidateProfileSessions(scope: InteractiveScope, profile: AuthProfile): void {
    this.loadAuthorizations();
    this.authorizations.delete(sessionKey(scope, profile.id));
    this.persistAuthorizations();
    this.sessions.delete(sessionKey(scope, profile.id));
    try {
      const store = persistentStore(scope, this.getSessionPersistenceKey());
      if (store) {
        try {
          store.clearSession(persistentId(scope, profile));
        } finally {
          store.close();
        }
      }
    } catch {
      /* Ignore cache cleanup errors when session file is absent. */
    }
    try {
      const legacyStore = new SessionStore(undefined, scope.projectRoot);
      try {
        legacyStore.clearSession(profile.id);
      } finally {
        legacyStore.close();
      }
    } catch {
      /* Ignore legacy cache cleanup errors. */
    }
  }

  async provision(args: Record<string, unknown>, signal: AbortSignal): Promise<CallToolResult> {
    const { profile: id, env, targetPath } = args;
    if (!validateBase(args, ['targetPath', 'env', 'profile']) || !targetPath ||
      !validInteractiveProfile(id) || typeof env !== 'string' || !/^[A-Za-z0-9_.:-]{1,128}$/.test(env)) {
      return result({ status: 'blocked', code: 'invalid_provision_arguments' }, true);
    }
    const respond = (status: 'success' | 'cancelled' | 'blocked', code: string, available = false) =>
      result({ status, code, profile: id, ...(available ? { credential_state: 'available', provider: 'keychain' } : {}) },
        status === 'blocked');
    const authorizeRoot = () => {
      try { return projectRoot(args, this.dependencies, true); }
      catch { return undefined; }
    };
    const root = authorizeRoot();
    if (!root) return respond('blocked', 'workspace_authorization_required');
    if (!this.authorizer?.requestCredential) return respond('blocked', 'credential_dialog_host_unavailable');
    if (this.provisioning) return respond('blocked', 'credential_provision_in_progress');
    this.provisioning = true;
    let manager: AuthManager | undefined;
    let saved = false;
    try {
      const scope = await interactiveScope(root, this.dependencies, env);
      if (!scope) return respond('blocked', 'auth_context_mismatch');
      const profile = await configuredProfile(scope, id);
      if (!profile) return respond('blocked', 'invalid_auth_context');
      if (profile.credential_source !== 'keychain') return respond('blocked', 'credential_provision_provider_unsupported');
      const stillAuthorized = async () => authorizeRoot() === root &&
        sameInteractiveScope(scope, await interactiveScope(root, this.dependencies, env)) &&
        JSON.stringify(await configuredProfile(scope, id)) === JSON.stringify(profile);
      manager = new AuthManager(root);
      if (await manager.getProfileCredentials(profile, true)) return respond('success', 'credential_already_configured', true);
      if (!await stillAuthorized()) return respond('blocked', 'authorization_context_mismatch');
      if (signal.aborted) return respond('cancelled', 'credential_provision_cancelled');

      const password = await this.authorizer.requestCredential({ ...scope, targetUrl: scope.origin },
        profile.id, ['Origen: ' + scope.origin, 'Cuenta: ' + profile.username, 'Proveedor: Windows Credential Manager (keychain)'].join('\n'),
        signal);
      if (password === undefined || signal.aborted) return respond('cancelled', 'credential_provision_cancelled');
      if (!await stillAuthorized()) return respond('blocked', 'authorization_context_mismatch');
      if (await manager.getProfileCredentials(profile, true)) return respond('success', 'credential_already_configured', true);
      if (!await stillAuthorized()) return respond('blocked', 'authorization_context_mismatch');
      if (signal.aborted) return respond('cancelled', 'credential_provision_cancelled');
      await manager.setProfileSecret(profile, password);
      saved = true;
      authorizationDiagnostic('credential_provision_saved', { profile: profile.id });
      if ((await manager.getProfileCredentials(profile, true))?.password !== password) {
        return respond('blocked', 'credential_saved_unverified');
      }
      authorizationDiagnostic('credential_provision_readback_verified', { profile: profile.id });
      return respond('success', 'credential_saved', true);
    } catch (error) {
      if (saved) return respond('blocked', 'credential_saved_unverified');
      if (error instanceof CredentialError) {
        if (error.code.startsWith('DIALOG_')) return respond('blocked', 'credential_' + error.code.toLowerCase());
        if (error.code === 'KEYCHAIN_MODULE_UNAVAILABLE') return respond('blocked', 'keychain_module_unavailable');
        if (error.code === 'UNAVAILABLE') return respond('blocked', 'credential_provider_unavailable');
      }
      return respond('blocked', 'credential_provision_failed');
    } finally {
      manager?.close();
      this.provisioning = false;
    }
  }

  async consent(operation: Operation, scope: InteractiveScope, profile: string | undefined,
    targetUrl: string, details: string, signal: AbortSignal,
    options?: { requireIndependentApproval?: boolean }): Promise<string | undefined> {
    const prefix = operation === 'login' ? 'authentication' : operation;
    this.loadAuthorizations();
    if (signal.aborted) return prefix + '_authorization_cancelled';
    if (!this.authorizer) return prefix + '_authorization_required';

    const targetOriginMatches = (() => {
      try { return new URL(targetUrl).origin === scope.origin; }
      catch { return false; }
    })();

    const currentProfile = profile ? await configuredProfile(scope, profile) : undefined;
    const currentFingerprint = currentProfile ? configuration(currentProfile) : undefined;
    if (!options?.requireIndependentApproval && profile && targetOriginMatches) {
      const grant = this.getSessionAuthorization(scope, profile);
      if (grant && grant.profileFingerprint !== currentFingerprint) {
        this.authorizations.delete(sessionKey(scope, profile));
        this.persistAuthorizations();
      }
      if (grant?.profileFingerprint === currentFingerprint && this.hasValidSessionAuthorization(scope, profile, operation)) {
        authorizationDiagnostic('qa_session_authorization_reused', {
          operation,
          profile,
          origin: scope.origin,
          environment: scope.environmentId,
        });
        return undefined;
      }
    }

    const response = await this.authorizer.requestAuthorization({
      ...scope, targetUrl, interactiveOperation: { operation, profile, details: 'Origen: ' + scope.origin + '\n' + details },
    }, signal).catch(() => ({ decision: 'unavailable' as const }));
    if (signal.aborted) return prefix + '_authorization_cancelled';
    if (response.decision === 'cancelled') return prefix +
      (response.code === 'discovery_authorization_expired' ? '_authorization_expired' : '_authorization_cancelled');
    if (response.decision === 'rejected') return prefix + '_authorization_rejected';
    if (response.decision !== 'approved') return prefix + '_gui_unavailable';
    if (response.root !== scope.projectRoot || response.targetUrl !== targetUrl) {
      return 'authorization_context_mismatch';
    }

    if (!options?.requireIndependentApproval && profile && targetOriginMatches && !scope.isProduction &&
        (operation === 'login' || operation === 'discovery_profile') && currentFingerprint) {
      const ttlMs = this.getAuthorizationTtlMs();
      const now = Date.now();
      const grantKey = sessionKey(scope, profile);
      const existingGrant = this.authorizations.get(grantKey);
      const retainedOperations = existingGrant && existingGrant.expiresAt > now &&
        existingGrant.profileFingerprint === currentFingerprint
        ? existingGrant.operations.filter((item): item is 'login' | 'discovery_profile' =>
          item === 'login' || item === 'discovery_profile') : [];
      const grant: QaSessionAuthorizationGrant = {
        projectRoot: scope.projectRoot,
        applicationId: scope.applicationId,
        environmentId: scope.environmentId,
        environmentRevision: scope.environmentRevision,
        baseUrl: scope.baseUrl,
        origin: scope.origin,
        profile,
        profileFingerprint: currentFingerprint,
        operations: Array.from(new Set([...retainedOperations, operation])),
        grantedAt: now,
        expiresAt: now + ttlMs,
      };
      this.authorizations.set(grantKey, grant);
      const persisted = this.persistAuthorizations();
      authorizationDiagnostic('qa_session_authorization_granted', {
        operation,
        profile,
        origin: scope.origin,
        environment: scope.environmentId,
        ttlMs,
        persistence: persisted ? 'host_config_encrypted' : 'process_only',
      });
    }
    return undefined;
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
    const targetSealed = this.sessions.get(sessionKey(scope, profile.id));
    if (targetSealed?.configuration === configuration(profile)) {
      const session = this.readSession(scope, profile.id);
      if (session) return { session, expires: targetSealed.expires, persistence: 'host_process' };
    }
    if (profile.session_cache?.enabled === false || profile.credential_source === 'ephemeral') return;
    const store = persistentStore(scope, this.getSessionPersistenceKey());
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
    const byId = new Map<string, AuthProfile>();
    for (const [id, sealed] of this.sessions) {
      if (id === sessionKey(scope, sealed.profile.id) && await this.resolveSession(scope, sealed.profile.id)) {
        byId.set(sealed.profile.id, { ...sealed.profile, verified: true });
      }
    }
    try {
      for (const stored of readProfiles(root)) {
        if (byId.has(stored.id) || !validConfiguration(scope, stored)) continue;
        if (await this.resolveSession(scope, stored.id)) {
          byId.set(stored.id, { ...stored, verified: true });
        }
      }
    } catch {
      /* Ignore when profiles.json does not exist yet */
    }
    return [...byId.values()];
  }

  async profileStatuses(root: string, filterArgs?: Record<string, unknown>): Promise<ProfileStatusSummary[]> {
    const scope = await interactiveScope(root, this.dependencies, typeof filterArgs?.env === 'string' ? filterArgs.env : undefined);
    if (!scope) return [];
    const verifiedMap = new Map((await this.profiles(root)).map(profile => [profile.id, profile]));
    const criteria: ProfileQueryCriteria = {
      application_id: typeof filterArgs?.application_id === 'string' ? filterArgs.application_id : scope.applicationId,
      env: typeof filterArgs?.env === 'string' ? filterArgs.env : scope.environmentId,
      ...(typeof filterArgs?.profile === 'string' ? { id: filterArgs.profile } : {}),
      ...(typeof filterArgs?.alias === 'string' ? { alias: filterArgs.alias } : {}),
      ...(typeof filterArgs?.username === 'string' ? { username: filterArgs.username } : {}),
      ...(typeof filterArgs?.role === 'string' ? { role: filterArgs.role } : {}),
      ...(typeof filterArgs?.scenario === 'string' ? { scenario: filterArgs.scenario } : {}),
    };

    const statuses = new Map<string, ProfileStatusSummary>();
    const hasExplicitFilter = Boolean(filterArgs?.profile || filterArgs?.alias || filterArgs?.username || filterArgs?.role || filterArgs?.scenario);

    if (!hasExplicitFilter) {
      for (const [id, verifiedProfile] of verifiedMap) {
        statuses.set(id, {
          id,
          env: scope.environmentId,
          code: 'session_valid',
          verified: true,
          ...(verifiedProfile.username ? { username: verifiedProfile.username } : {}),
          ...(verifiedProfile.application_id ? { application_id: verifiedProfile.application_id } : {}),
          ...(verifiedProfile.role ? { role: verifiedProfile.role } : {}),
          ...(verifiedProfile.alias ? { alias: verifiedProfile.alias } : {}),
          ...(verifiedProfile.aliases ? { aliases: verifiedProfile.aliases } : {}),
          ...(verifiedProfile.scenario ? { scenario: verifiedProfile.scenario } : {}),
          ...(verifiedProfile.scenarios ? { scenarios: verifiedProfile.scenarios } : {}),
          ...(verifiedProfile.login_origin ? { login_origin: verifiedProfile.login_origin } : {}),
          ...(verifiedProfile.credential_source ? { credential_source: verifiedProfile.credential_source } : {}),
        });
      }
    }

    let storedProfiles: AuthProfile[] = [];
    try {
      storedProfiles = hasExplicitFilter ? findProfiles(criteria, root) : readProfiles(root);
    } catch {
      storedProfiles = [];
    }

    const manager = new AuthManager(root, {
      vault: new TieredCredentialVault({
        keychain: new KeychainCredentialProvider(),
        ephemeral: this.ephemeral,
      }),
    });

    try {
      for (const profile of storedProfiles) {
        if (!validConfiguration(scope, profile)) continue;
        const cachedSession = await this.session(scope, profile.id, profile);
        const isSessionValid = Boolean(cachedSession || verifiedMap.has(profile.id));
        const credStatus = await manager.getProfileCredentialStatus(profile, true);
        const policyTier = classifyEnvironmentPolicy(profile.env, scope.isProduction);
        const privileged = isPrivilegedProfile(profile, scope.isProduction);

        let code = 'authentication_required';
        if (isSessionValid) {
          code = 'session_valid';
        } else if (credStatus.state === 'not_configured') {
          code = 'credentials_not_configured';
        } else if (credStatus.state === 'unlock_required') {
          code = 'vault_locked';
        }

        // Preserve backward compatibility with existing tests expecting 'authentication_required' when unverified in list
        const listCode = isSessionValid ? 'session_valid' : 'authentication_required';

        statuses.set(profile.id, {
          id: profile.id,
          env: scope.environmentId,
          code: listCode,
          verified: isSessionValid,
          username: profile.username,
          application_id: profile.application_id,
          ...(profile.role ? { role: profile.role } : {}),
          ...(profile.alias ? { alias: profile.alias } : {}),
          ...(profile.aliases ? { aliases: profile.aliases } : {}),
          ...(profile.scenario ? { scenario: profile.scenario } : {}),
          ...(profile.scenarios ? { scenarios: profile.scenarios } : {}),
          ...(profile.login_origin ? { login_origin: profile.login_origin } : {}),
          ...(profile.login_route ? { login_route: profile.login_route } : {}),
          ...(profile.verification_route ? { verification_route: profile.verification_route } : {}),
          credential_source: profile.credential_source,
          credential_state: credStatus.state,
          policy_tier: policyTier,
          privileged,
          ...(profile.previous_accounts?.length ? { previous_accounts: profile.previous_accounts } : {}),
          ...(code !== listCode ? { resolution_state: code } : {}),
        } as ProfileStatusSummary);
      }
    } finally {
      manager.close();
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
        if (!passphrase) return { code: 'credential_dialog_cancelled' };
        await portable.unlock(passphrase);
      }
      let credentials = await manager.getProfileCredentials(profile, true);
      if (!credentials && profile.credential_source === 'ephemeral') {
        const password = await this.prompt('Contraseña de pruebas para esta conexión de QAP: ' + destination, signal);
        if (!password) return { code: 'credential_dialog_cancelled' };
        if (!signal.aborted && await stillAuthorized()) {
          await manager.setProfileSecret(profile, password);
          credentials = await manager.getProfileCredentials(profile, true);
        }
      }
      if (!credentials) return { code: 'credentials_not_configured' };
      if (!await stillAuthorized()) return { code: 'authorization_context_mismatch' };
      return await captureVerifiedAuto(request, profile, credentials, signal);
    } catch (error) {
      if (error instanceof CredentialError) {
        if (error.code.startsWith('DIALOG_')) return { code: 'credential_' + error.code.toLowerCase() };
        if (error.code === 'KEYCHAIN_MODULE_UNAVAILABLE') return { code: 'keychain_module_unavailable' };
      }
      const state = credentialState(error);
      return { code: portable && state !== 'unavailable' ? 'vault_locked'
        : state === 'invalid' ? 'invalid_auth_context' : 'credential_provider_unavailable' };
    } finally { portable?.close(); }
  }

  private async checkPrivilegedActionAuthorization(
    scope: InteractiveScope,
    targetProfile: Partial<AuthProfile> & { id: string },
    operationDescription: string,
    signal: AbortSignal
  ): Promise<string | undefined> {
    if (!isPrivilegedProfile(targetProfile, scope.isProduction)) {
      return undefined;
    }
    if (this.isHostAuthorizedForPrivileged(scope, targetProfile.id)) {
      return undefined;
    }
    if (!this.authorizer) {
      return 'privileged_profile_authorization_required';
    }
    const consentResult = await this.consent(
      'login',
      scope,
      targetProfile.id,
      scope.origin,
      `Control de perfil privilegiado (${classifyEnvironmentPolicy(scope.environmentId, scope.isProduction)})\n${operationDescription}`,
      signal,
      { requireIndependentApproval: true }
    );
    return consentResult ? 'privileged_profile_authorization_required' : undefined;
  }

  private async handleCreateProfile(
    scope: InteractiveScope,
    args: Record<string, unknown>,
    signal: AbortSignal
  ): Promise<CallToolResult> {
    const id = String(args.profile);
    if (!validInteractiveProfile(id)) return interactiveBlocked('invalid_auth_context');
    if (!isValidUsernameIdentifier(args.username)) {
      return interactiveBlocked('invalid_username_identifier');
    }
    const appId = typeof args.application_id === 'string' ? args.application_id : scope.applicationId;
    const envId = typeof args.env === 'string' ? args.env : scope.environmentId;
    const loginOrigin = typeof args.login_origin === 'string' ? args.login_origin : scope.origin;
    if (appId !== scope.applicationId || envId !== scope.environmentId || loginOrigin !== scope.origin) {
      return interactiveBlocked('auth_context_mismatch');
    }

    const role = args.role !== undefined ? String(args.role).trim() : undefined;
    if (role !== undefined && (!role || role.length > 128 || /\p{C}/u.test(role))) {
      return interactiveBlocked('invalid_auth_context');
    }
    const alias = typeof args.alias === 'string' && args.alias.trim() ? args.alias.trim() : undefined;
    const aliases = Array.isArray(args.aliases)
      ? args.aliases.filter((a): a is string => typeof a === 'string' && a.trim().length > 0).map((a) => a.trim())
      : alias ? [alias] : undefined;
    const scenario = typeof args.scenario === 'string' && args.scenario.trim() ? args.scenario.trim() : undefined;
    const scenarios = Array.isArray(args.scenarios)
      ? args.scenarios.filter((s): s is string => typeof s === 'string' && s.trim().length > 0).map((s) => s.trim())
      : scenario ? [scenario] : undefined;

    const credSource = (typeof args.credential_source === 'string' ? args.credential_source : 'keychain') as AuthProfile['credential_source'];
    if (!['keychain', 'env', 'vault', 'ephemeral'].includes(credSource)) {
      return interactiveBlocked('invalid_auth_context');
    }

    const loginRouteRaw = typeof args.login_route === 'string' ? args.login_route : '/login';
    const verificationRouteRaw = typeof args.verification_route === 'string' ? args.verification_route : '/dashboard';
    if (!route(loginRouteRaw, scope) || !route(verificationRouteRaw, scope)) {
      return interactiveBlocked('invalid_auth_routes');
    }

    const condition = isObject(args.post_login_condition)
      ? (args.post_login_condition as { type: 'selector_present'; value: string })
      : { type: 'selector_present' as const, value: 'body' };
    if (condition.type !== 'selector_present' || !isSelector(condition.value)) {
      return interactiveBlocked('invalid_post_login_condition');
    }

    let formSelectors: AuthProfile['form_selectors'];
    if (isObject(args.form_selectors)) {
      const fs = args.form_selectors as Record<string, unknown>;
      if (!isSelector(fs.username) || !isSelector(fs.password) || !isSelector(fs.submit)) {
        return interactiveBlocked('invalid_auth_context');
      }
      formSelectors = { username: fs.username, password: fs.password, submit: fs.submit };
    }

    const newProfile: AuthProfile = {
      id,
      application_id: appId,
      env: envId,
      username: args.username,
      credential_source: credSource,
      login_mode: 'auto',
      login_origin: loginOrigin,
      login_route: loginRouteRaw,
      verification_route: verificationRouteRaw,
      post_login_condition: condition,
      session_cache: { enabled: true, ttl_ms: SESSION_TTL },
      ...(role ? { role } : {}),
      ...(alias ? { alias } : {}),
      ...(aliases?.length ? { aliases } : {}),
      ...(scenario ? { scenario } : {}),
      ...(scenarios?.length ? { scenarios } : {}),
      ...(formSelectors ? { form_selectors: formSelectors } : {}),
    };

    const privDenied = await this.checkPrivilegedActionAuthorization(
      scope,
      newProfile,
      `Crear perfil '${id}' para usuario '${newProfile.username}' (rol: ${role ?? 'N/A'})`,
      signal
    );
    if (privDenied) return interactiveBlocked(privDenied);

    try {
      const created = createProfile(newProfile, {
        basePath: scope.projectRoot,
        allowPrivileged: true,
      });
      return result({
        status: 'success',
        code: 'profile_created',
        profile: created.id,
        username: created.username,
        application_id: created.application_id,
        environment: created.env,
        role: created.role,
        alias: created.alias,
        scenario: created.scenario,
        login_origin: created.login_origin,
        credential_source: created.credential_source,
        credential_state: 'not_configured',
        policy_tier: classifyEnvironmentPolicy(created.env, scope.isProduction),
        next_action: created.credential_source === 'keychain' ? 'qap_auth_provision' : 'qap_auth_add',
      });
    } catch (error) {
      if (error instanceof CredentialError && error.code === 'PROFILE_ALREADY_EXISTS') {
        return interactiveBlocked('profile_already_exists');
      }
      return interactiveBlocked('invalid_auth_context');
    }
  }

  private async handleUpdateProfile(
    scope: InteractiveScope,
    args: Record<string, unknown>,
    signal: AbortSignal
  ): Promise<CallToolResult> {
    const id = String(args.profile);
    if (!validInteractiveProfile(id)) return interactiveBlocked('invalid_auth_context');
    const existing = await readProfile(id, scope.projectRoot);
    if (!existing) return interactiveBlocked('profile_not_found');
    if (existing.application_id && existing.application_id !== scope.applicationId) {
      return interactiveBlocked('auth_context_mismatch');
    }
    if (existing.env !== scope.environmentId) {
      return interactiveBlocked('auth_context_mismatch');
    }
    if (args.application_id !== undefined && args.application_id !== scope.applicationId) {
      return interactiveBlocked('auth_context_mismatch');
    }
    if (args.env !== undefined && args.env !== scope.environmentId) {
      return interactiveBlocked('auth_context_mismatch');
    }
    if (args.login_origin !== undefined && args.login_origin !== scope.origin) {
      return interactiveBlocked('auth_context_mismatch');
    }
    if (args.username !== undefined && !isValidUsernameIdentifier(args.username)) {
      return interactiveBlocked('invalid_username_identifier');
    }

    const patch: Partial<AuthProfile> = {};
    if (typeof args.username === 'string') patch.username = args.username;
    if (typeof args.role === 'string') {
      const r = args.role.trim();
      if (!r || r.length > 128 || /\p{C}/u.test(r)) return interactiveBlocked('invalid_auth_context');
      patch.role = r;
    }
    if (typeof args.alias === 'string' && args.alias.trim()) {
      patch.alias = args.alias.trim();
      patch.aliases = Array.from(new Set([...(existing.aliases ?? []), patch.alias]));
    }
    if (Array.isArray(args.aliases)) {
      patch.aliases = args.aliases.filter((a): a is string => typeof a === 'string' && a.trim().length > 0).map((a) => a.trim());
    }
    if (typeof args.scenario === 'string' && args.scenario.trim()) {
      patch.scenario = args.scenario.trim();
      patch.scenarios = Array.from(new Set([...(existing.scenarios ?? []), patch.scenario]));
    }
    if (Array.isArray(args.scenarios)) {
      patch.scenarios = args.scenarios.filter((s): s is string => typeof s === 'string' && s.trim().length > 0).map((s) => s.trim());
    }
    if (typeof args.login_route === 'string') {
      if (!route(args.login_route, scope)) return interactiveBlocked('invalid_auth_routes');
      patch.login_route = args.login_route;
    }
    if (typeof args.verification_route === 'string') {
      if (!route(args.verification_route, scope)) return interactiveBlocked('invalid_auth_routes');
      patch.verification_route = args.verification_route;
    }
    if (isObject(args.post_login_condition)) {
      const cond = args.post_login_condition as { type: 'selector_present'; value: string };
      if (cond.type !== 'selector_present' || !isSelector(cond.value)) return interactiveBlocked('invalid_post_login_condition');
      patch.post_login_condition = cond;
    }
    if (isObject(args.form_selectors)) {
      const fs = args.form_selectors as Record<string, unknown>;
      if (!isSelector(fs.username) || !isSelector(fs.password) || !isSelector(fs.submit)) return interactiveBlocked('invalid_auth_context');
      patch.form_selectors = { username: fs.username, password: fs.password, submit: fs.submit };
    }
    if (typeof args.credential_source === 'string') {
      if (!['keychain', 'env', 'vault', 'ephemeral'].includes(args.credential_source)) return interactiveBlocked('invalid_auth_context');
      patch.credential_source = args.credential_source as AuthProfile['credential_source'];
    }

    const usernameChanging = patch.username !== undefined && patch.username !== existing.username;
    const isSensitiveOrPrivileged =
      classifyEnvironmentPolicy(scope.environmentId, scope.isProduction) === 'sensitive' ||
      isPrivilegedProfile(existing, scope.isProduction) ||
      isPrivilegedProfile({ ...existing, ...patch }, scope.isProduction);

    if (isSensitiveOrPrivileged) {
      const privDenied = await this.checkPrivilegedActionAuthorization(
        scope,
        { ...existing, ...patch, id },
        `Actualizar perfil privilegiado '${id}' (usuario: '${existing.username}' -> '${patch.username ?? existing.username}')`,
        signal
      );
      if (privDenied) return interactiveBlocked(privDenied);
    }

    const manager = new AuthManager(scope.projectRoot, {
      vault: new TieredCredentialVault({
        keychain: new KeychainCredentialProvider(),
        ephemeral: this.ephemeral,
      }),
    });

    try {
      let credentialHandling: 'preserved' | 'revoked' | 'not_configured' = 'not_configured';
      if (usernameChanging) {
        const oldCredStatus = await manager.getProfileCredentialStatus(existing, true);
        const hadOldSecret = oldCredStatus.state === 'available';

        if (args.revoke_previous_credential === true && hadOldSecret) {
          if (this.authorizer) {
            const revokeConsent = await this.consent(
              'login',
              scope,
              id,
              scope.origin,
              `Revocar credencial anterior de '${existing.username}' al actualizar el perfil '${id}' a '${patch.username}'.`,
              signal,
              { requireIndependentApproval: true }
            );
            if (revokeConsent) return interactiveBlocked(revokeConsent);
          }
          await manager.deleteProfileSecret(existing);
          credentialHandling = 'revoked';
        } else if (hadOldSecret) {
          credentialHandling = 'preserved';
        } else {
          credentialHandling = 'not_configured';
        }

        // Invalidar sesiones activas y en caché asociadas al perfil
        this.invalidateProfileSessions(scope, existing);
      }

      const updatedResult = updateProfile(id, patch, {
        basePath: scope.projectRoot,
        allowPrivileged: true,
        credentialHandlingOnUsernameChange: credentialHandling,
      });

      const newCredStatus = await manager.getProfileCredentialStatus(updatedResult.profile, true);

      return result({
        status: 'success',
        code: 'profile_updated',
        profile: updatedResult.profile.id,
        username: updatedResult.profile.username,
        previous_username: updatedResult.previousUsername,
        username_changed: updatedResult.usernameChanged,
        previous_credential_handling: updatedResult.usernameChanged ? credentialHandling : undefined,
        session_invalidated: updatedResult.usernameChanged,
        application_id: updatedResult.profile.application_id,
        environment: updatedResult.profile.env,
        role: updatedResult.profile.role,
        alias: updatedResult.profile.alias,
        scenario: updatedResult.profile.scenario,
        credential_source: updatedResult.profile.credential_source,
        credential_state: newCredStatus.state,
        next_action: newCredStatus.state === 'not_configured' ? 'qap_auth_provision' : 'qap_auth_add',
      });
    } finally {
      manager.close();
    }
  }

  private async handleSelectOrResolveProfile(
    scope: InteractiveScope,
    args: Record<string, unknown>,
    mode: 'select' | 'resolve'
  ): Promise<CallToolResult> {
    const rawProfile = typeof args.profile === 'string' ? args.profile.trim() : undefined;
    const criteria: ProfileQueryCriteria = {
      application_id: typeof args.application_id === 'string' ? args.application_id : scope.applicationId,
      env: typeof args.env === 'string' ? args.env : scope.environmentId,
      ...(typeof args.alias === 'string' ? { alias: args.alias } : {}),
      ...(typeof args.username === 'string' ? { username: args.username } : {}),
      ...(typeof args.role === 'string' ? { role: args.role } : {}),
      ...(typeof args.scenario === 'string' ? { scenario: args.scenario } : {}),
    };

    let selected: AuthProfile | null = null;
    if (rawProfile && rawProfile !== '*' && !args.alias && !args.username && !args.role && !args.scenario) {
      selected = await readProfile(rawProfile, scope.projectRoot);
      if (!selected) {
        const byAlias = selectProfile({ ...criteria, alias: rawProfile }, scope.projectRoot);
        if (byAlias.ambiguous) {
          return interactiveBlocked('profile_selection_ambiguous', {
            candidates: byAlias.candidates.map((c) => ({ id: c.id, username: c.username, role: c.role, alias: c.alias, scenario: c.scenario })),
          });
        }
        selected = byAlias.profile;
      }
      if (!selected) {
        const byRole = selectProfile({ ...criteria, role: rawProfile }, scope.projectRoot);
        if (byRole.ambiguous) {
          return interactiveBlocked('profile_selection_ambiguous', {
            candidates: byRole.candidates.map((c) => ({ id: c.id, username: c.username, role: c.role, alias: c.alias, scenario: c.scenario })),
          });
        }
        selected = byRole.profile;
      }
    } else {
      if (rawProfile && rawProfile !== '*') criteria.id = rawProfile;
      const resolution = selectProfile(criteria, scope.projectRoot);
      if (resolution.ambiguous) {
        return interactiveBlocked('profile_selection_ambiguous', {
          candidates: resolution.candidates.map((c) => ({ id: c.id, username: c.username, role: c.role, alias: c.alias, scenario: c.scenario })),
        });
      }
      selected = resolution.profile;
    }

    if (!selected || !validConfiguration(scope, selected)) {
      return interactiveBlocked('profile_not_found');
    }

    const cached = await this.session(scope, selected.id, selected);
    const manager = new AuthManager(scope.projectRoot, {
      vault: new TieredCredentialVault({
        keychain: new KeychainCredentialProvider(),
        ephemeral: this.ephemeral,
      }),
    });

    try {
      const credStatus = await manager.getProfileCredentialStatus(selected, true);
      let resolutionCode: 'session_valid' | 'ready_for_auto_login' | 'credentials_not_configured' | 'vault_locked' = 'credentials_not_configured';
      let recommendedNextTool: 'none' | 'qap_auth_add' | 'qap_auth_provision' = 'qap_auth_provision';
      let recommendedMethod: 'reuse' | 'auto' | undefined;

      if (cached && cached.expires > Date.now()) {
        resolutionCode = 'session_valid';
        recommendedNextTool = 'none';
        recommendedMethod = 'reuse';
      } else if (credStatus.state === 'available') {
        resolutionCode = 'ready_for_auto_login';
        recommendedNextTool = 'qap_auth_add';
        recommendedMethod = 'auto';
      } else if (credStatus.state === 'unlock_required') {
        resolutionCode = 'vault_locked';
        recommendedNextTool = 'qap_auth_add';
        recommendedMethod = 'auto';
      }

      return result({
        status: 'success',
        code: mode === 'select' ? 'profile_selected' : resolutionCode,
        resolution: resolutionCode,
        profile: selected.id,
        username: selected.username,
        application_id: selected.application_id,
        environment: selected.env,
        role: selected.role,
        alias: selected.alias,
        aliases: selected.aliases,
        scenario: selected.scenario,
        scenarios: selected.scenarios,
        login_origin: selected.login_origin,
        credential_source: selected.credential_source,
        credential_state: credStatus.state,
        session_valid: Boolean(cached && cached.expires > Date.now()),
        session_scope: cached?.persistence,
        policy_tier: classifyEnvironmentPolicy(selected.env, scope.isProduction),
        privileged: isPrivilegedProfile(selected, scope.isProduction),
        recommended_action: {
          tool: recommendedNextTool,
          ...(recommendedMethod ? { method: recommendedMethod } : {}),
          profile: selected.id,
          env: selected.env,
        },
      });
    } finally {
      manager.close();
    }
  }

  private async handoffWithOptionalVault(
    scope: InteractiveScope,
    configured: AuthProfile | undefined,
    request: HandoffRequest,
    signal: AbortSignal
  ): ReturnType<typeof captureVerifiedHandoff> {
    if (!configured || configured.credential_source !== 'keychain') {
      return await this.capture(request, signal);
    }
    let credentials;
    const manager = new AuthManager(scope.projectRoot);
    try {
      credentials = await manager.getProfileCredentials(configured, true).catch(() => null);
    } finally {
      manager.close();
    }
    if (!credentials?.password) {
      return await this.capture({ ...request, profile: configured }, signal);
    }
    return await this.capture(
      {
        ...request,
        profile: configured,
        credentials: {
          username: credentials.username ?? configured.username,
          password: credentials.password,
        },
      },
      signal
    );
  }

  async login(args: Record<string, unknown>, signal: AbortSignal): Promise<CallToolResult> {
    if (Object.keys(args).some(key => !ALLOWED_LOGIN_ARGS.has(key))) {
      return interactiveBlocked('agent_auth_material_not_supported');
    }
    const action = args.action !== undefined ? String(args.action) : 'login';
    if (!['create', 'update', 'select', 'resolve', 'revoke', 'login'].includes(action)) {
      return interactiveBlocked('invalid_auth_method');
    }

    if (action === 'login' && !this.authorizer) {
      return interactiveBlocked('authentication_authorization_required');
    }

    const profileArg = args.profile;
    if ((action !== 'select' && action !== 'resolve' && action !== 'revoke' && !validInteractiveProfile(profileArg)) ||
        (typeof profileArg !== 'string' || !profileArg.trim()) ||
        (args.env !== undefined && typeof args.env !== 'string')) {
      return interactiveBlocked('invalid_auth_context');
    }

    let root: string;
    try {
      root = projectRoot(args, this.dependencies, action !== 'select' && action !== 'resolve' && action !== 'revoke');
    } catch {
      return interactiveBlocked('workspace_authorization_required');
    }
    const scope = await interactiveScope(root, this.dependencies, args.env);
    if (!scope) return interactiveBlocked('auth_context_mismatch');

    if (action === 'create') {
      return await this.handleCreateProfile(scope, args, signal);
    }
    if (action === 'update') {
      return await this.handleUpdateProfile(scope, args, signal);
    }
    if (action === 'select' || action === 'resolve') {
      return await this.handleSelectOrResolveProfile(scope, args, action);
    }
    if (action === 'revoke') {
      const targetProfile = profileArg === '*' ? undefined : String(profileArg).trim();
      if (targetProfile) {
        const existing = await configuredProfile(scope, targetProfile);
        if (existing) {
          this.invalidateProfileSessions(scope, existing);
        } else {
          this.revokeAuthorization(scope, targetProfile);
        }
      } else {
        this.revokeAuthorization(scope);
      }
      return result({
        status: 'success',
        code: 'authorization_revoked',
        profile: targetProfile ?? '*',
        environment: scope.environmentId,
        origin: scope.origin,
        session_invalidated: true,
      });
    }

    const method = args.method ?? args.login_mode ?? 'handoff';
    if ((method !== 'auto' && method !== 'handoff' && method !== 'reuse') ||
        (args.login_mode !== undefined && args.login_mode !== method)) return interactiveBlocked('invalid_auth_method');
    const timeoutMs = args.timeout_ms ?? 120_000;
    if (typeof timeoutMs !== 'number' || !Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 120_000) {
      return interactiveBlocked('invalid_handoff_timeout');
    }

    // Permitir selección por alias, usuario, rol o escenario antes del login cuando se indica o coincide con un perfil registrado
    let resolvedProfileId = profileArg;
    const direct = await configuredProfile(scope, profileArg);
    if (direct) {
      resolvedProfileId = direct.id;
    } else if (args.alias || args.username || args.role || args.scenario) {
      const sel = selectProfile(
        {
          application_id: scope.applicationId,
          env: scope.environmentId,
          ...(typeof args.alias === 'string' ? { alias: args.alias } : {}),
          ...(typeof args.username === 'string' ? { username: args.username } : {}),
          ...(typeof args.role === 'string' ? { role: args.role } : {}),
          ...(typeof args.scenario === 'string' ? { scenario: args.scenario } : {}),
        },
        root
      );
      if (sel.ambiguous) return interactiveBlocked('profile_selection_ambiguous');
      if (sel.profile) resolvedProfileId = sel.profile.id;
    }

    const id = sessionKey(scope, resolvedProfileId);
    if (this.logins.has(id)) return interactiveBlocked('authentication_in_progress');
    this.logins.add(id);
    try {
      if (method !== 'handoff' && ['login_route', 'verification_route', 'post_login_condition', 'role',
        'username', 'application_id', 'login_origin', 'form_selectors', 'credential_source'].some(key => key in args)) {
        return interactiveBlocked('use_local_auth_profile');
      }
      if (authBrowserDiagnosticsEnabled()) return interactiveBlocked('authentication_diagnostics_enabled');
      const configured = await configuredProfile(scope, resolvedProfileId);
      if (method === 'auto' && !configured) return interactiveBlocked('credentials_not_configured');
      const cached = await this.session(scope, resolvedProfileId, configured);
      if (method === 'reuse' && !cached) return interactiveBlocked('session_expired');

      // Antes de pedir consentimiento o lanzar el navegador en auto, verificar si la credencial está ausente para solicitar aprovisionamiento seguro sin reintentos ciegos
      if (method === 'auto' && configured && !cached && configured.credential_source === 'keychain') {
        const preflightManager = new AuthManager(scope.projectRoot);
        try {
          const preflightStatus = await preflightManager.getProfileCredentialStatus(configured, true);
          if (preflightStatus.state === 'not_configured') {
            return interactiveBlocked('credentials_not_configured', {
              profile: configured.id,
              username: configured.username,
              credential_state: 'not_configured',
              recommended_tool: 'qap_auth_provision',
            });
          }
        } finally {
          preflightManager.close();
        }
      }

      const role = args.role ?? configured?.role;
      if (role !== undefined && (typeof role !== 'string' || !role.trim() || role.length > 128 || /\p{C}/u.test(role))) {
        return interactiveBlocked('invalid_auth_context');
      }
      const condition = args.post_login_condition ?? configured?.post_login_condition;
      if (method === 'handoff' && isObject(condition) && Object.keys(condition).some(key => key !== 'type' && key !== 'value')) {
        return interactiveBlocked('agent_auth_material_not_supported');
      }
      const selector = method === 'reuse' ? cached?.session.selector :
        isObject(condition) && condition.type === 'selector_present' ? condition.value : undefined;
      if (!isSelector(selector)) return interactiveBlocked('invalid_post_login_condition');
      const verificationUrl = method === 'reuse' ? cached?.session.verificationUrl :
        route(args.verification_route ?? configured?.verification_route, scope);
      const loginUrl = method === 'reuse' ? verificationUrl : route(configured?.credential_source === 'env'
        ? configured.token_exchange_route : args.login_route ?? configured?.login_route ?? '/login', scope);
      if (!loginUrl || !verificationUrl) return interactiveBlocked('invalid_auth_routes');

      const stillAuthorized = async () => sameInteractiveScope(scope, await interactiveScope(
        projectRoot(args, this.dependencies, true), this.dependencies, scope.environmentId)) &&
        (!configured || JSON.stringify(await configuredProfile(scope, resolvedProfileId)) === JSON.stringify(configured));
      const recheck = async (): Promise<string | undefined> => {
        if (signal.aborted) return 'authentication_authorization_cancelled';
        if (!await stillAuthorized()) return 'authorization_context_mismatch';
        return undefined;
      };
      const details = ['Método: ' + method, 'Ruta de verificación: ' + verificationUrl, 'Marcador visible: ' + selector,
        ...(configured ? ['Cuenta: ' + configured.username, 'Proveedor: ' + configured.credential_source,
          'Se intentará reutilizar la sesión antes de enviar la credencial.'] : []), ...(role ? ['Rol: ' + role] : [])];
      const blocked = await this.consent('login', scope, resolvedProfileId, loginUrl, details.join('\n'), signal) ?? await recheck();
      if (blocked) return interactiveBlocked(blocked);
      const request = { origin: scope.origin, loginUrl, verificationUrl, selector, timeoutMs };
      if (cached && (method === 'reuse' || cached.session.verificationUrl === verificationUrl && cached.session.selector === selector)) {
        const checked = await verifyStoredSession(request, cached.session.state, signal);
        const changed = await recheck();
        if (changed) return interactiveBlocked(changed);
        if (checked.state && cached.expires > Date.now()) {
          this.remember(scope, configured ?? this.sessions.get(id)!.profile, cached.session, cached.expires, configured);
          return result({ status: 'success', code: 'session_valid', profile: resolvedProfileId, verified: true,
            environment: scope.environmentId, session_scope: cached.persistence });
        }
        if (checked.code && checked.code !== 'session_expired') return interactiveBlocked(checked.code);
        this.sessions.delete(id);
      }
      if (method === 'reuse') return interactiveBlocked('session_expired');

      const captured = method === 'auto' && configured
        ? await this.automatic(scope, configured, request, signal, stillAuthorized)
        : await this.handoffWithOptionalVault(scope, configured, request, signal);
      const changed = await recheck();
      if (changed) return interactiveBlocked(changed);
      if (!captured.state) {
        const effectiveCode = captured.failureReason && [
          'challenge_detected',
          'credentials_rejected',
          'login_form_not_found',
          'submit_button_disabled',
          'login_navigation_failed',
          'post_login_verification_failed',
        ].includes(String(captured.failureReason))
          ? String(captured.failureReason)
          : captured.code;
        return interactiveBlocked(effectiveCode, {
          ...(captured.failureReason !== undefined ? { failure_reason: captured.failureReason } : {}),
          ...(captured.challengeDetected !== undefined ? { challenge_detected: captured.challengeDetected } : {}),
          ...(captured.challengeDetected === true ? { intervention_reason: 'mfa_or_captcha_detected' } : {}),
        });
      }

      const expires = Date.now() + Math.min(SESSION_TTL, configured?.session_cache?.ttl_ms ?? SESSION_TTL);
      const effectiveProfile: AuthProfile = configured ?? {
        id: resolvedProfileId,
        env: scope.environmentId,
        application_id: scope.applicationId,
        username: '',
        role,
        login_mode: 'handoff',
        credential_source: 'ephemeral',
      };
      this.remember(scope, effectiveProfile, { selector, verificationUrl, state: captured.state }, expires, configured);
      let persistence = 'host_process';
      if (configured && configured.credential_source !== 'ephemeral' && configured.session_cache?.enabled !== false && expires > Date.now()) {
        try {
          const store = persistentStore(scope, this.getSessionPersistenceKey());
          if (store) {
            try {
              store.saveSession(persistentId(scope, configured), { ...captured.state, expires });
              persistence = 'encrypted_disk';
            } finally { store.close(); }
          }
        } catch { /* A verified session is still usable in this host process. */ }
      }
      return result({ status: 'success', code: 'authentication_verified', profile: resolvedProfileId, environment: scope.environmentId,
        verified: true, session_scope: persistence });
    } catch {
      return interactiveBlocked(signal.aborted ? 'authentication_authorization_cancelled' : 'authentication_failed');
    } finally { this.logins.delete(id); }
  }
}
