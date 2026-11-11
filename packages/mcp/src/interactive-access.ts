import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

import type { StorageState } from '@qap/auth';
import type { AuthProfile } from '@qap/shared';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import type { IDiscoveryAuthorizer } from './discovery-authorizer.js';
import { binding, isObject, projectRoot, result, type StateDependencies } from './handlers/state-services.js';
import { captureVerifiedHandoff } from './verified-handoff.js';

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
};

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

export function interactiveBlocked(code: string): CallToolResult {
  return result({ status: 'blocked', code, category: 'human_authorization',
    desbloquear_con: { mecanismo: 'local_host', descripcion: 'Revisa el contexto y solicita la operación desde una sesión interactiva del host.' } }, true);
}

/** One-shot consent and encrypted sessions owned by this MCP host process. */
export class InteractiveAccess {
  private readonly key = randomBytes(32);
  private readonly sessions = new Map<string, SealedSession>();
  private readonly handoffs = new Set<string>();

  constructor(
    private readonly dependencies: StateDependencies,
    private readonly authorizer?: IDiscoveryAuthorizer,
    private readonly capture = captureVerifiedHandoff,
  ) {}

  close(): void {
    this.sessions.clear();
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

  readSession(scope: InteractiveScope, profile: string): { selector: string; verificationUrl: string; state: StorageState } | undefined {
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

  async profiles(root: string): Promise<AuthProfile[]> {
    const scope = await interactiveScope(root, this.dependencies);
    if (!scope) return [];
    return [...this.sessions.entries()].flatMap(([id, sealed]) =>
      id === sessionKey(scope, sealed.profile.id) && this.readSession(scope, sealed.profile.id)
        ? [{ ...sealed.profile }] : []);
  }

  async login(args: Record<string, unknown>, signal: AbortSignal): Promise<CallToolResult> {
    if (!this.authorizer) return interactiveBlocked('authentication_authorization_required');
    if (Object.keys(args).some(key => !['targetPath', 'profile', 'env', 'method', 'login_mode', 'login_route',
      'verification_route', 'timeout_ms', 'post_login_condition', 'role'].includes(key)) ||
      (args.method !== undefined && args.method !== 'handoff') ||
      (args.login_mode !== undefined && args.login_mode !== 'handoff')) {
      return interactiveBlocked('interactive_handoff_only');
    }
    const profile = args.profile;
    if (!validInteractiveProfile(profile) || (args.env !== undefined && typeof args.env !== 'string')) {
      return interactiveBlocked('invalid_auth_context');
    }
    const role = args.role;
    if (role !== undefined && (typeof role !== 'string' || !role.trim() || role.length > 128 || /\p{C}/u.test(role))) {
      return interactiveBlocked('invalid_auth_context');
    }
    const condition = args.post_login_condition;
    if (!isObject(condition) || condition.type !== 'selector_present' || typeof condition.value !== 'string' ||
        !condition.value.trim() || condition.value.length > 500 || /\p{C}/u.test(condition.value)) {
      return interactiveBlocked('invalid_post_login_condition');
    }
    const selector = condition.value;
    const timeoutMs = args.timeout_ms ?? 120_000;
    if (typeof timeoutMs !== 'number' || !Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 120_000) {
      return interactiveBlocked('invalid_handoff_timeout');
    }
    const root = projectRoot(args, this.dependencies, true);
    const scope = await interactiveScope(root, this.dependencies, args.env);
    if (!scope) return interactiveBlocked('auth_context_mismatch');
    const loginUrl = route(args.login_route ?? '/login', scope);
    const verificationUrl = route(args.verification_route, scope);
    if (!loginUrl || !verificationUrl) return interactiveBlocked('invalid_auth_routes');

    const id = sessionKey(scope, profile);
    if (this.handoffs.has(id)) return interactiveBlocked('authentication_in_progress');
    this.handoffs.add(id);
    const currentScope = () => interactiveScope(projectRoot(args, this.dependencies, true), this.dependencies, scope.environmentId);
    try {
      const blocked = await this.consent('login', scope, profile, loginUrl,
        'Ruta de verificación: ' + verificationUrl + '\nMarcador visible: ' + selector + (role ? '\nRol: ' + role : ''), signal);
      if (blocked) return interactiveBlocked(blocked);
      if (!sameInteractiveScope(scope, await currentScope())) return interactiveBlocked('authorization_context_mismatch');
      if (signal.aborted) return interactiveBlocked('authentication_authorization_cancelled');
      const captured = await this.capture({ origin: scope.origin, loginUrl, verificationUrl, selector, timeoutMs }, signal);
      if (!sameInteractiveScope(scope, await currentScope())) return interactiveBlocked('authorization_context_mismatch');
      if (signal.aborted) return interactiveBlocked('authentication_authorization_cancelled');
      if (!captured.state) return interactiveBlocked(captured.code);

      const iv = randomBytes(12);
      const cipher = createCipheriv('aes-256-gcm', this.key, iv);
      cipher.setAAD(Buffer.from(id));
      const data = Buffer.concat([cipher.update(JSON.stringify(captured.state), 'utf8'), cipher.final()]);
      this.sessions.delete(id);
      this.sessions.set(id, { iv, tag: cipher.getAuthTag(), data, selector, verificationUrl, expires: Date.now() + SESSION_TTL,
        profile: { id: profile, role, env: scope.environmentId, application_id: scope.applicationId, username: '',
          login_mode: 'handoff', credential_source: 'ephemeral', verified: true } });
      const oldest = this.sessions.keys().next();
      if (this.sessions.size > MAX_SESSIONS && !oldest.done) this.sessions.delete(oldest.value);
      return result({ status: 'success', profile, environment: scope.environmentId, verified: true, session_scope: 'host_process' });
    } catch {
      return interactiveBlocked(signal.aborted ? 'authentication_authorization_cancelled' : 'authentication_failed');
    } finally { this.handoffs.delete(id); }
  }
}
