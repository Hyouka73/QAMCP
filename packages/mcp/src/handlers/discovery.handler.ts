import { realpathSync } from 'node:fs';

import { SessionStore, readProfile } from '@qap/auth';
import { FileSystemStorage } from '@qap/knowledge';
import { normalizeSlug, type AuthProfileRecord } from '@qap/shared';
import { BlackBoxCrawler, BlackBoxCrawlerError, type BlackBoxCrawlerInput, type CrawlerDependencies } from '@qap/playwright-adapter';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpToolError, type IMcpToolHandler, type McpInvocationContext } from '../dispatcher.js';
import {
  sanitizeDossierText,
  sanitizeTargetPathname,
  writeDiscoveryMarkdownFiles,
  type DiscoveryDossierCanonical,
  type DiscoveryDossierGap,
  type DiscoveryDossierRelation,
  type DiscoveryDossierRoute,
  type DiscoveryDossierSourceRef,
  type DiscoveryDossierView,
} from '../application/discovery-dossier.js';
import { resolveScopedBusinessRules } from '../application/scoped-rule-resolver.js';
import {
  type IDiscoveryAuthorizer,
  syncDiscoveryAuthorizationsFromDisk,
  atomicRecordDiscoveryAuthorization,
} from '../discovery-authorizer.js';
import type { InteractiveAccess } from '../interactive-access.js';

import { binding, definition, isObject, projectRoot, result, validateBase, type StateDependencies } from './state-services.js';
import { discoveryIntegration } from './legacy-discovery-contract.js';
import { ModuleObservationBridge, type AssociationReceipt } from './module-observation-bridge.js';

function buildDynamicDiscoveryLimits(
  existing?: BlackBoxCrawlerInput['limits'],
): NonNullable<BlackBoxCrawlerInput['limits']> {
  return {
    max_pages: existing?.max_pages ?? 10,
    max_depth: existing?.max_depth ?? 2,
    total_timeout_ms: existing?.total_timeout_ms ?? 60_000,
    navigation_timeout_ms: existing?.navigation_timeout_ms ?? 15_000,
    max_requests: existing?.max_requests ?? 50,
    max_bytes: Math.min(existing?.max_bytes ?? 1_048_576, 1_048_576),
    max_redirects: existing?.max_redirects ?? 5,
    max_elements: existing?.max_elements ?? 200,
  };
}

function mergeLoopbackAllowedIps(targetUrl: string, existing?: readonly string[]): string[] | undefined {
  const host = new URL(targetUrl).hostname.toLowerCase();
  if (host === '127.0.0.1' || host === 'localhost' || host === '::1' || host === '[::1]') {
    return Array.from(new Set([...(existing ?? []), '127.0.0.1', '::1']));
  }
  return existing ? [...existing] : undefined;
}

/** Trusted host configuration. GET consent acknowledges possible server-side effects. */
export interface DiscoveryAuthorization {
  readonly projectRoot: string;
  readonly applicationId: string;
  readonly environmentId: string;
  /** Pin the policy revision; a changed policy requires renewed host authorization. */
  readonly environmentRevision: number;
  readonly navigationOrigin?: string;
  readonly authorization: BlackBoxCrawlerInput['authorization'];
  readonly authorizedProfiles?: readonly string[];
  readonly limits?: BlackBoxCrawlerInput['limits'];
  readonly dependencies?: CrawlerDependencies;
}

/** Reject normalization aliases rather than silently broadening exact host consent. */
function resolveTarget(path: string, base: string): string | undefined {
  if (/[\\%?#\s]/u.test(path) || path.startsWith('//') || path.split('/').some(p => p === '.' || p === '..')) return;
  try {
    const absolute = /^[a-z][a-z\d+.-]*:/i.test(path);
    const url = new URL(path, base);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) return;
    if (absolute && url.href !== path && url.href !== path + '/') return;
    if (!absolute && (!path.startsWith('/') && path.includes(':'))) return;
    return url.href;
  } catch { return; }
}

export class DiscoveryHandler implements IMcpToolHandler {
  readonly definition = definition('qap_discover');
  private readonly authorizations: DiscoveryAuthorization[];

  forgetProject(root: string): void {
    for (let i = this.authorizations.length - 1; i >= 0; i--) {
      if (this.authorizations[i].projectRoot === root) this.authorizations.splice(i, 1);
    }
  }
  private readonly authorizer?: IDiscoveryAuthorizer;
  private readonly hostDiscoveryRegistryPath?: string;

  constructor(
    private readonly dependencies: StateDependencies,
    authorizations: readonly DiscoveryAuthorization[] = [],
    authorizer?: IDiscoveryAuthorizer,
    hostDiscoveryRegistryPath?: string,
    _interactiveAccess?: InteractiveAccess,
  ) {
    this.authorizer = authorizer;
    this.hostDiscoveryRegistryPath = hostDiscoveryRegistryPath;
    // Preserve resolver callbacks, but snapshot all mutable host policy structures.
    this.authorizations = authorizations.map(a => ({ ...a, authorization: structuredClone(a.authorization),
      authorizedProfiles: a.authorizedProfiles && [...a.authorizedProfiles], limits: a.limits && { ...a.limits }, dependencies: a.dependencies && {
        resolver: a.dependencies.resolver, browser: a.dependencies.browser && { ...a.dependencies.browser } } }));
  }

  validateArguments(args: unknown): boolean {
    if (!isObject(args) || !validateBase(args, ['targetPath', 'name', 'path', 'description', 'tags', 'headed',
      'credentials', 'profile', 'profileId', 'storageState', 'cookies', 'session', 'auth', 'allow_spa', 'tenant_id', 'environment'])) return false;
    if (typeof args.name !== 'string' || !args.name.trim() || args.name.length > 128 || [...args.name].some(c => c.charCodeAt(0) < 32) ||
      typeof args.path !== 'string' || !args.path || args.path.length > 2048) return false;
    if (args.description !== undefined && (typeof args.description !== 'string' || args.description.length > 4000)) return false;
    if (args.tags !== undefined && (!Array.isArray(args.tags) || args.tags.length > 100 ||
      args.tags.some((tag: unknown) => typeof tag !== 'string' || tag.length > 100))) return false;
    if (args.allow_spa !== undefined && typeof args.allow_spa !== 'boolean') return false;
    if (args.tenant_id !== undefined && (typeof args.tenant_id !== 'string' || !args.tenant_id.trim() || args.tenant_id.length > 128)) return false;
    if (args.environment !== undefined && (typeof args.environment !== 'string' || !args.environment.trim() || args.environment.length > 128)) return false;
    return args.headed === undefined || typeof args.headed === 'boolean';
  }

  async execute(args: unknown, context: McpInvocationContext): Promise<CallToolResult> {
    if (!this.validateArguments(args) || !isObject(args)) throw new McpToolError('invalid_arguments');
    const blocked = (code: string, next = 'Revisar el alcance o continuar desde el estado actual.', extra: Record<string, unknown> = {}) => result({
      status: 'blocked', code, persistence: 'not_attempted', next_safe_action: next,
      acquisition_status: 'blocked', acquisition_persistence: 'not_attempted', association_status: 'not_attempted', module_identity_status: 'not_resolved', coverage: 'partial',
      ...extra,
    }, true);
    if (context.signal.aborted) return blocked('cancelled');
    if (['credentials', 'profileId', 'storageState', 'cookies', 'session', 'auth'].some(k => Object.hasOwn(args, k))) {
      return blocked('authentication_not_supported');
    }
    if (args.profile !== undefined && typeof args.profile !== 'string') return blocked('authentication_not_supported');
    if (args.headed === true) return blocked('headed_not_supported');
    try {
      const root = projectRoot(args, this.dependencies, true);
      const bound = binding(root, this.dependencies);
      if (!bound) return blocked('knowledge_unbound');
      if (bound.store.contract_version !== 1) return blocked('knowledge_incompatible');
      const app = await bound.store.get(bound.applicationId, 'application', bound.applicationId);
      const env = await bound.store.get(bound.applicationId, 'environment', bound.environmentId);
      if (!app || !env || app.entity.application_id !== bound.applicationId || env.entity.application_id !== bound.applicationId ||
        env.entity.environment_id !== bound.environmentId) return blocked('context_incompatible');
      const target = resolveTarget(args.path as string, env.entity.base_url);
      if (this.hostDiscoveryRegistryPath) {
        syncDiscoveryAuthorizationsFromDisk(this.hostDiscoveryRegistryPath, this.authorizations);
      }

      if (!target) return blocked('url_not_authorized');
      const baseOrigin = new URL(env.entity.base_url).origin;
      const targetOrigin = new URL(target).origin;
      const configurations = this.authorizations.filter(a => {
        try {
          return realpathSync(a.projectRoot) === root &&
            a.applicationId === bound.applicationId &&
            a.environmentId === bound.environmentId;
        } catch {
          return false;
        }
      });
      const current = configurations.filter(a => a.environmentRevision === env.revision);
      if (configurations.length > 0 && (current.length !== 1 || current[0].authorization.read_only_acknowledged !== true)) {
        return blocked('authorization_context_mismatch');
      }

      let config: DiscoveryAuthorization | undefined = current[0];
      const appService = this.dependencies.applicationService;
      const appProject = appService ? appService.findActiveProjectByRoot(root) : null;
      const requestedTenant = typeof args.tenant_id === 'string' && args.tenant_id.trim() ? args.tenant_id.trim() : undefined;
      const requestedProfileRaw = typeof args.profile === 'string' && args.profile.trim() ? args.profile.trim() : undefined;
      const requestedEnvironment = typeof args.environment === 'string' && args.environment.trim() ? args.environment.trim() : undefined;
      const initialProjectSnap = appService && appProject ? appService.resumeProject(appProject.project_id) : null;
      const effectiveActiveEnv = initialProjectSnap?.environment ?? null;
      const effectiveActiveEnvId = effectiveActiveEnv?.env_id ?? appProject?.active_env_id ?? undefined;
      if (requestedEnvironment) {
        const activeEnvName = effectiveActiveEnv?.name ?? env.entity.name;
        const activeEnvKey = effectiveActiveEnv?.env_id ?? env.entity.environment_id;
        if (requestedEnvironment !== activeEnvName && requestedEnvironment !== activeEnvKey) {
          return blocked(
            'discovery_environment_not_active',
            `Discovery solo puede operar sobre el entorno activo ('${activeEnvName}'). Cambia el entorno activo o selecciona '${activeEnvName}' antes de explorar '${requestedEnvironment}'.`,
            {
              requested_environment: requestedEnvironment,
              active_environment: activeEnvName,
              question: `Discovery solo opera sobre el entorno activo '${activeEnvName}'. ¿Deseas explorar '${activeEnvName}' o cambiar primero el entorno activo a '${requestedEnvironment}'?`,
              field: 'environment',
              options: [activeEnvName, requestedEnvironment],
              downgraded_to_anonymous: false,
              desbloquear_con: {
                tool: 'qap_context_set',
                descripcion: `Activa el entorno '${requestedEnvironment}' antes de ejecutar Discovery sobre él.`,
              },
            },
          );
        }
      }
      let resolvedTenantId: string | undefined;
      if (appService && appProject) {
        let initialProfileRef = requestedProfileRaw;
        if (requestedProfileRaw) {
          const aliasCheck = appService.resolveProfileAlias(
            appProject.project_id,
            requestedProfileRaw,
            effectiveActiveEnvId,
          );
          if (aliasCheck.status === 'ambiguous') {
            return blocked(
              'ambiguous_auth_profile',
              `El alias '${requestedProfileRaw}' coincide con múltiples perfiles; indica el perfil exacto.`,
              { downgraded_to_anonymous: false },
            );
          }
          if (aliasCheck.status === 'matched') {
            initialProfileRef = aliasCheck.profile.profile_id;
          }
        }
        const tenantCheck = appService.validateTenantScope(
          appProject.project_id,
          requestedTenant,
          initialProfileRef,
          effectiveActiveEnvId,
        );
        if (!tenantCheck.ok) return blocked(tenantCheck.code, tenantCheck.reason, { downgraded_to_anonymous: false });
        resolvedTenantId = tenantCheck.tenant_id;
        const observeScope = { origin: baseOrigin, ...(effectiveActiveEnvId ? { env_id: effectiveActiveEnvId } : {}) };
        const activeObserve = appService.authority.check(appProject.project_id, 'observe', observeScope);
        const revokedObserve = appService.authority.listGrants(appProject.project_id, true)
          .some(g => g.capability === 'observe' && g.status === 'revoked');
        if (revokedObserve && !activeObserve.allowed) {
          return blocked('observe_permission_revoked', 'El permiso de observación fue revocado; vuelve a autorizar el alcance.', { downgraded_to_anonymous: false });
        }
      }
      const exactUrlAllowed = config?.authorization.navigation_urls.includes(target);
      const originAllowed = config?.navigationOrigin === baseOrigin && targetOrigin === baseOrigin;
      if (!exactUrlAllowed && !originAllowed) {
        const canSilentlyResolve = Boolean(!this.authorizer && this.dependencies.silentBoundScope && env.entity.is_production !== true);
        if (targetOrigin !== baseOrigin || (config && !this.authorizer && !canSilentlyResolve)) return blocked('url_not_authorized');
        if (canSilentlyResolve) {
          const defaultLimits = buildDynamicDiscoveryLimits(config?.limits);
          const allowedIps = mergeLoopbackAllowedIps(target, config?.authorization.allowed_ips);
          const existingUrls = config?.authorization.navigation_urls ?? [];
          const resolved: DiscoveryAuthorization = {
            ...config,
            projectRoot: root,
            applicationId: bound.applicationId,
            environmentId: bound.environmentId,
            environmentRevision: env.revision,
            navigationOrigin: baseOrigin,
            authorization: {
              ...config?.authorization,
              read_only_acknowledged: true,
              navigation_urls: Array.from(new Set([...existingUrls, target])),
              allow_public_network: config?.authorization.allow_public_network ?? true,
              ...(allowedIps ? { allowed_ips: allowedIps } : {}),
            },
            limits: defaultLimits,
          };
          if (config) this.authorizations[this.authorizations.indexOf(config)] = resolved;
          else this.authorizations.push(resolved);
          config = resolved;
        } else if (!this.authorizer) {
          return result({
            status: 'blocked',
            category: 'human_authorization',
            code: 'discovery_authorization_required',
            acquisition_status: 'blocked',
            acquisition_persistence: 'not_attempted',
            association_status: 'not_attempted',
            persistence: 'not_attempted',
            desbloquear_con: {
              mecanismo: 'local_host',
              script: 'scripts/qap-provision-host.mjs',
              descripcion: 'El operador local debe provisionar el host con la aplicación y URL ya registradas, modules: [], y una discoveryAuthorization explícita para esas URLs. No requiere testAuthorization. El script genera client-config.json privado; aplica esa configuración al cliente y reconecta. Nunca uses argumentos MCP como aprobación administrativa.',
            },
          }, true);
        } else {

        const defaultLimits = buildDynamicDiscoveryLimits(config?.limits);
        const authResult = await this.authorizer.requestAuthorization({
          projectRoot: root,
          applicationId: bound.applicationId,
          environmentId: bound.environmentId,
          environmentRevision: env.revision,
          baseUrl: env.entity.base_url,
          targetUrl: target,
          limits: defaultLimits,
        }, context.signal).catch(() => ({ decision: 'unavailable' as const, code: 'discovery_dialog_start_failed' as const, reason: 'Dialog launch failed.' }));

        if (authResult.decision === 'approved') {
          if (context.signal.aborted) return blocked('cancelled');
          if (authResult.root !== root || authResult.targetUrl !== target ||
            (authResult.navigationOrigin !== undefined && authResult.navigationOrigin !== baseOrigin)) {
            return blocked('authorization_context_mismatch');
          }
          const allowedIps = mergeLoopbackAllowedIps(target, config?.authorization.allowed_ips);
          const existingUrls = config?.authorization.navigation_urls ?? [];
          const approved: DiscoveryAuthorization = {
            ...config,
            projectRoot: root,
            applicationId: bound.applicationId,
            environmentId: bound.environmentId,
            environmentRevision: env.revision,
            ...(authResult.navigationOrigin ? { navigationOrigin: authResult.navigationOrigin } : {}),
            authorization: {
              ...config?.authorization,
              read_only_acknowledged: true,
              navigation_urls: Array.from(new Set([...existingUrls, target])),
              allow_public_network: config?.authorization.allow_public_network ?? true,
              ...(allowedIps ? { allowed_ips: allowedIps } : {}),
            },
            limits: defaultLimits,
          };
          if (this.hostDiscoveryRegistryPath) {
            atomicRecordDiscoveryAuthorization(this.hostDiscoveryRegistryPath, approved);
          }
          if (config) this.authorizations[this.authorizations.indexOf(config)] = approved;
          else this.authorizations.push(approved);
          config = approved;
        } else if (authResult.decision === 'rejected') {
          return result({
            status: 'blocked',
            category: 'human_authorization',
            code: 'discovery_authorization_rejected',
            acquisition_status: 'blocked',
            acquisition_persistence: 'not_attempted',
            association_status: 'not_attempted',
            persistence: 'not_attempted',
            mensaje: 'La autorización de navegación exploratoria fue rechazada por el operador local.',
            next_safe_action: 'Continuar con investigación documental offline cuando sea posible; la navegación externa permanece bloqueada.',
            desbloquear_con: {
              mecanismo: 'local_host',
              descripcion: 'El operador local rechazó la autorización para navegar en este origen. Continúa con investigación offline o solicita autorización cuando el operador lo determine.',
            },
          }, true);
        } else if (authResult.decision === 'cancelled') {
          return result({
            status: 'blocked',
            category: 'human_authorization',
            code: authResult.code ?? 'discovery_authorization_cancelled',
            acquisition_status: 'blocked',
            acquisition_persistence: 'not_attempted',
            association_status: 'not_attempted',
            persistence: 'not_attempted',
            mensaje: authResult.code === 'discovery_authorization_expired'
              ? 'La solicitud de autorización de navegación exploratoria expiró tras 120 segundos sin respuesta.'
              : 'La solicitud de autorización de navegación exploratoria fue cancelada o cerrada por el operador.',
            next_safe_action: 'Reintentar qap_discover cuando el operador esté listo para responder en la interfaz del host.',
            desbloquear_con: {
              mecanismo: 'local_host',
              descripcion: 'La solicitud se canceló o expiró. Reintenta qap_discover cuando el operador esté presente para autorizar la navegación.',
            },
          }, true);
        } else {
          return result({
            status: 'blocked',
            category: 'human_authorization',
            code: authResult.code ?? 'discovery_gui_unavailable',
            acquisition_status: 'blocked',
            acquisition_persistence: 'not_attempted',
            association_status: 'not_attempted',
            persistence: 'not_attempted',
            next_safe_action: 'Revisar la sesión de escritorio interactiva y los diagnósticos locales del host.',
            desbloquear_con: {
              mecanismo: 'local_host',
              descripcion: 'El host no pudo mostrar el diálogo de autorización interactivo. Revisa la sesión de escritorio interactiva.',
            },
          }, true);
        }
        }
      }

      if (!config) return blocked('discovery_authorization_required');
      const navigationAuthorization = config.navigationOrigin === baseOrigin && targetOrigin === baseOrigin
        ? {
            ...config.authorization,
            // Admit the requested route. The crawler still enforces its exact per-call GET scope.
            navigation_urls: [target, ...config.authorization.navigation_urls.filter(url =>
              url !== target && resolveTarget(url, baseOrigin) && new URL(url).origin === baseOrigin)].slice(0, 32),
            allowed_ips: mergeLoopbackAllowedIps(target, config.authorization.allowed_ips),
          }
        : config.authorization;

      if (appService && appProject) {
        const observeScope = { origin: baseOrigin, ...(appProject.active_env_id ? { env_id: appProject.active_env_id } : {}) };
        const activeObserve = appService.authority.check(appProject.project_id, 'observe', observeScope);
        if (!activeObserve.allowed) {
          appService.authority.grant({
            project_id: appProject.project_id,
            capability: 'observe',
            scope: observeScope,
            granted_by: 'host_operator',
          });
        }
      }

      const lifecycle = await new FileSystemStorage({ rootDir: root }).getLifecycleState();
      const provisional = this.dependencies.provisionalInventory && !bound.moduleBindings?.length && (
        (['ONBOARDING', 'SCOPING'].includes(lifecycle.phase) && args.name === 'inventario-provisional') ||
        (lifecycle.phase === 'SCOPING' && Boolean(appProject))
      );
      if (lifecycle.phase !== 'WORKING' && !provisional) return blocked('phase_restricted', lifecycle.phase === 'ONBOARDING' ? 'qap_context_set' : 'qap_session_plan');
      const module = lifecycle.modules && Object.hasOwn(lifecycle.modules, args.name as string)
        ? lifecycle.modules[args.name as string] : undefined;
      const appServiceMod = appService && appProject
        ? appService.resumeProject(appProject.project_id).modules.find((m) => m.key === normalizeSlug(args.name as string))
        : undefined;
      if (!provisional && (!module && !appServiceMod || ['closed', 'waived'].includes(String(module?.state ?? appServiceMod?.status)))) {
        return blocked('module_restricted', 'qap_session_plan');
      }

      let authenticated_session: BlackBoxCrawlerInput['authenticated_session'];
      let resolvedProfileName: string | undefined = requestedProfileRaw;
      let resolvedProfileRecord: AuthProfileRecord | undefined;
      let sessionHasOrigins = false;
      const projectSnapForAuth = initialProjectSnap ?? (appService && appProject ? appService.resumeProject(appProject.project_id) : null);
      const projectProfiles = projectSnapForAuth ? projectSnapForAuth.profiles : [];
      const activeEnvId = effectiveActiveEnvId ?? projectSnapForAuth?.environment?.env_id ?? appProject?.active_env_id ?? undefined;
      const envScopedProfiles = activeEnvId
        ? projectProfiles.filter((p) => p.env_id === activeEnvId)
        : projectProfiles;
      const effectiveProfilesPool = activeEnvId ? envScopedProfiles : projectProfiles;
      const protectedProjectHasProfiles = Boolean(
        appService && appProject && effectiveProfilesPool.some((p) => p.status === 'verified' || p.status === 'expired' || p.status === 'revoked'),
      );
      const authRequired = requestedProfileRaw !== undefined || Boolean(lifecycle.session?.auth?.required) || protectedProjectHasProfiles;

      if (authRequired) {
        if (appService && appProject) {
          if (resolvedProfileName) {
            const aliasRes = appService.resolveProfileAlias(appProject.project_id, resolvedProfileName, activeEnvId);
            if (aliasRes.status === 'ambiguous') {
              return blocked(
                'ambiguous_auth_profile',
                `El alias '${resolvedProfileName}' coincide con múltiples perfiles; indica cuál deseas usar.`,
                { downgraded_to_anonymous: false },
              );
            }
            if (aliasRes.status === 'matched') {
              resolvedProfileRecord = aliasRes.profile;
              resolvedProfileName = aliasRes.profile.label;
            } else {
              const belongsToAnotherEnv = Boolean(
                activeEnvId && appService.resolveProfileAlias(appProject.project_id, resolvedProfileName).status !== 'not_found',
              );
              if (belongsToAnotherEnv || effectiveProfilesPool.length > 0) {
                return blocked(
                  'profile_not_found',
                  `El perfil '${resolvedProfileName}' no pertenece al alcance del entorno activo.`,
                  { downgraded_to_anonymous: false },
                );
              }
            }
          } else {
            let candidates = effectiveProfilesPool.filter((p) => p.status !== 'revoked');
            if (candidates.length === 0) {
              return blocked('auth_required', 'Se requiere iniciar sesión antes de explorar vistas protegidas.', { downgraded_to_anonymous: false });
            }
            if (requestedTenant) {
              const tenantMode = projectSnapForAuth?.environment?.tenant_mode ?? 'single';
              candidates = candidates.filter((p) =>
                tenantMode === 'multi_tenant'
                  ? p.tenant_id === requestedTenant
                  : (!p.tenant_id || p.tenant_id === requestedTenant),
              );
              if (candidates.length === 0) {
                return blocked(
                  'tenant_mismatch',
                  `El tenant '${requestedTenant}' no es compatible con ningún perfil activo disponible.`,
                  { downgraded_to_anonymous: false },
                );
              }
            }
            if (candidates.length > 1) {
              return blocked('ambiguous_auth_profile', 'Existen múltiples perfiles disponibles; selecciona explícitamente cuál utilizar.', { downgraded_to_anonymous: false });
            }
            resolvedProfileRecord = candidates[0];
            resolvedProfileName = candidates[0].label;
          }
        }
        if (!resolvedProfileName) {
          return blocked('unauthorized_profile', 'Indica el perfil autorizado para explorar vistas protegidas.', { downgraded_to_anonymous: false });
        }

        if (appService && appProject) {
          const postTenantCheck = appService.validateTenantScope(
            appProject.project_id,
            requestedTenant,
            resolvedProfileRecord?.profile_id ?? resolvedProfileName,
            activeEnvId,
          );
          if (!postTenantCheck.ok) {
            return blocked(postTenantCheck.code, postTenantCheck.reason, { downgraded_to_anonymous: false });
          }
          resolvedTenantId = postTenantCheck.tenant_id;

          const hostProfile = appService.readProfileSession<{ cookies: BlackBoxCrawlerInput['authenticated_session'] extends infer T ? T extends { cookies: infer C } ? C : never : never; origins?: Array<{ origin: string; localStorage: Array<{ name: string; value: string }> }> }>(
            appProject.project_id,
            resolvedProfileRecord?.profile_id ?? resolvedProfileName,
          );
          const loginCap = appService.authority.check(appProject.project_id, 'login', { origin: new URL(env.entity.base_url).origin });
          if (hostProfile) {
            resolvedProfileRecord = hostProfile.profile;
            resolvedProfileName = hostProfile.profile.label;
            if (hostProfile.revoked || (!loginCap.allowed && (loginCap.reason === 'revoked' || hostProfile.profile.status !== 'verified'))) {
              return blocked('auth_session_revoked', 'El acceso autenticado fue revocado; vuelve a iniciar sesión con autorización.', { downgraded_to_anonymous: false });
            }
            if (hostProfile.expired || (!loginCap.allowed && loginCap.reason === 'expired') || !hostProfile.session) {
              return blocked('auth_session_expired', 'La sesión expiró o dejó de ser válida; renueva el acceso sin degradar a modo anónimo.', { downgraded_to_anonymous: false });
            }
            if (
              config.authorizedProfiles &&
              !config.authorizedProfiles.includes(hostProfile.profile.label) &&
              !config.authorizedProfiles.includes(hostProfile.profile.profile_id)
            ) {
              return blocked('unauthorized_profile', 'Perfil no autorizado en la configuración del host.', { downgraded_to_anonymous: false });
            }
            sessionHasOrigins = Boolean(hostProfile.session.origins?.some((o) => o.localStorage?.length));
            authenticated_session = {
              profile_id: hostProfile.profile.label,
              origin: new URL(env.entity.base_url).origin,
              cookies: hostProfile.session.cookies ?? [],
              ...(hostProfile.session.origins ? { origins: hostProfile.session.origins } : {}),
            };
          }
        }

        if (!authenticated_session) {
          if (config.authorizedProfiles && !config.authorizedProfiles.includes(resolvedProfileName)) {
            return blocked('unauthorized_profile', 'Perfil no autorizado en la configuración actual.', { downgraded_to_anonymous: false });
          }
          if (!config.authorizedProfiles && !appProject) {
            return blocked('unauthorized_profile', 'Perfil no autorizado en la configuración actual.', { downgraded_to_anonymous: false });
          }
          const profile = await readProfile(resolvedProfileName, root);
          if (!profile || profile.application_id !== bound.applicationId || profile.env !== bound.environmentId || !profile.verified ||
            (profile.post_login_condition?.type !== 'selector_present' && !this.dependencies.allowSpaReadOnly && args.allow_spa !== true)) {
            return blocked('verified_cookie_profile_required', 'Se requiere una sesión verificada antes de continuar.', { downgraded_to_anonymous: false });
          }
          const session = new SessionStore(undefined, root).getValidSession(resolvedProfileName);
          if (!session) return blocked('auth_session_expired', 'La sesión expiró; renueva el acceso en una ventana segura.', { downgraded_to_anonymous: false });
          sessionHasOrigins = Boolean(session.origins.some((o) => o.localStorage.length));
          const allowSpaForLegacy = args.allow_spa === true || this.dependencies.allowSpaReadOnly === true;
          if (sessionHasOrigins && !allowSpaForLegacy) {
            return blocked('script_session_not_supported', 'Este modo conserva solo cookies; habilita observación SPA de solo lectura para usar sesiones con estado local.', { downgraded_to_anonymous: false });
          }
          authenticated_session = {
            profile_id: resolvedProfileName,
            origin: new URL(env.entity.base_url).origin,
            cookies: session.cookies,
            ...(sessionHasOrigins ? { origins: session.origins } : {}),
            ...(profile.post_login_condition?.type === 'selector_present' ? { validation_selector: profile.post_login_condition.value } : {}),
          };
        }
      }

      const useSpaMode = Boolean(
        args.allow_spa === true ||
        (this.dependencies.allowSpaReadOnly === true && args.allow_spa !== false && (sessionHasOrigins || Boolean(appProject))),
      );
      const isolation: BlackBoxCrawlerInput['isolation'] = useSpaMode
        ? (authenticated_session ? 'fresh_authenticated_spa_readonly' : 'fresh_anonymous_spa_readonly')
        : (authenticated_session ? 'fresh_authenticated_static' : 'fresh_anonymous_static');

      const bridge = new ModuleObservationBridge(bound.store, { ...bound, projectRoot: root });
      const planned = lifecycle.session?.plan?.filter(p => p.module === args.name) ?? [];
      const isPlannedModule = planned.length === 1 || Boolean(appServiceMod);
      const identity = planned.length === 1 ? await bridge.resolve(args.name as string) : { status: 'plan_ambiguous_or_missing' };
      const currentEnvironment = await bound.store.get(bound.applicationId, 'environment', bound.environmentId);
      if (!currentEnvironment || currentEnvironment.revision !== env.revision) return blocked('authorization_context_mismatch');
      if (context.signal.aborted) return blocked('cancelled');
      const bootstrap = Boolean(this.dependencies.prepareWorkspace);
      const limits = bootstrap && config.limits?.max_bytes
        ? { ...config.limits, max_bytes: Math.min(config.limits.max_bytes, 1_048_576) } : config.limits;
      const output = await new BlackBoxCrawler(bound.store, { ...config.dependencies, allowCanonicalOrigin: bootstrap }).run({
        application_id: bound.applicationId, environment: env.entity, target_url: target,
        authorization: navigationAuthorization, limits, signal: context.signal,
        isolation, authenticated_session,
      });
      if (authenticated_session && !output.observations.length && (output.warnings.includes('AUTH_SESSION_INVALID') ||
        output.routes.some(route => route.http_status === 401 || route.http_status === 403))) {
        if (appService && appProject && resolvedProfileName) {
          try { appService.expireProfileSession(appProject.project_id, resolvedProfileName); } catch { /* Best effort */ }
        }
        return result({ status: 'blocked', code: 'auth_session_invalid', acquisition_status: 'blocked', acquisition_persistence: 'not_attempted',
          association_status: 'not_attempted', downgraded_to_anonymous: false, execution_id: output.execution_id, cleanup: output.cleanup,
          next_safe_action: 'La sesión guardada ya no es válida. Inicia sesión de nuevo en una ventana segura sin degradar a acceso anónimo.',
          desbloquear_con: { tool: 'qap_auth_add', descripcion: 'Inicia sesión de nuevo con un perfil autorizado para continuar con las vistas protegidas.' } }, true);
      }
      if (!authenticated_session && (output.warnings.includes('AUTH_REQUIRED') || output.routes.some(route => route.http_status === 401 || route.http_status === 403))) {
        return result({ status: 'blocked', code: 'auth_required', acquisition_status: 'blocked', acquisition_persistence: 'not_attempted',
          association_status: 'not_attempted', downgraded_to_anonymous: false, execution_id: output.execution_id, cleanup: output.cleanup,
          next_safe_action: 'Esta ruta requiere iniciar sesión en una ventana segura antes de continuar.',
          desbloquear_con: { tool: 'qap_auth_add', descripcion: 'Autoriza y completa el inicio de sesión para acceder a las vistas protegidas.' } }, true);
      }
      const receipt: AssociationReceipt | undefined = identity.status === 'resolved' && 'fingerprint' in identity && output.observations.length
        ? { version: 1, binding: identity.fingerprint, execution: output.execution_id, observations: output.observations.map(o => o.id).sort() } : undefined;
      const associationResult = receipt ? await bridge.associate(args.name as string, receipt) : {
        association_status: output.observations.length ? 'blocked' : 'not_attempted',
        code: identity.status === 'resolved' ? 'context_changed_or_no_observations' : identity.status,
        associated_observations: 0, confirmed_relations: 0, coverage: 'partial',
      };
      const { code: association_code, ...association } = associationResult;
      const persistedCandidates: unknown[] = [];
      let persistedInventoryId: string | undefined;
      let discoveryRevisionId: string | undefined;
      let discoveryReused: boolean | undefined;
      let discoveryDossierSummary: Record<string, unknown> | undefined;
      if (appService && appProject && (output.observations.length > 0 || output.routes.length > 0)) {
        const evidenceIds = output.evidence.map((e) => e.id);
        const routePath = (() => {
          try { return new URL(target).pathname || '/'; } catch { return '/'; }
        })();
        const candidateKeys: string[] = [];
        if (output.observations.length > 0) {
          const safeName = typeof args.name === 'string' ? args.name : 'inventario';
          const baseKey = safeName === 'inventario-provisional'
            ? (routePath.replace(/^\/+|\/+$/g, '').split('/')[0] || 'inicio')
            : safeName;
          const candTitle = typeof args.description === 'string' && args.description.trim()
            ? args.description.trim()
            : (typeof args.name === 'string' && args.name.trim() ? args.name.trim() : baseKey);
          const cand = appService.upsertModuleCandidate({
            projectId: appProject.project_id,
            key: baseKey,
            title: candTitle,
            routeHint: routePath,
            provenanceSource: useSpaMode ? 'spa_dom' : 'observed_dom',
            evidenceRefs: evidenceIds,
            confidence: output.views.length > 0 ? 'high' : 'medium',
          });
          candidateKeys.push(cand.key);
          if (!isPlannedModule) persistedCandidates.push(cand);
        }
        const inv = appService.savePartialInventory({
          projectId: appProject.project_id,
          executionId: output.execution_id,
          targetUrl: target,
          mode: output.mode,
          routesVisited: output.routes.filter((r) => r.state === 'visited').length,
          routesCandidate: output.routes.filter((r) => r.state === 'candidate').length,
          routesBlocked: output.routes.filter((r) => r.state === 'blocked').length,
          viewsCount: output.views.length,
          controlsCount: output.views.reduce((n, v) => n + v.controls.length, 0),
          formsCount: output.views.reduce((n, v) => n + v.forms.length, 0),
          candidateKeys,
        });
        persistedInventoryId = inv.inventory_id;

        const safeName = typeof args.name === 'string' ? args.name : 'inventario';
        const dossierBaseKey = safeName === 'inventario-provisional'
          ? (routePath.replace(/^\/+|\/+$/g, '').split('/')[0] || 'inicio')
          : safeName;
        const dossierModuleKey = normalizeSlug(appServiceMod?.key ?? dossierBaseKey);
        const dossierModuleTitle = appServiceMod?.title ??
          (typeof args.description === 'string' && args.description.trim()
            ? args.description.trim()
            : (typeof args.name === 'string' && args.name.trim() ? args.name.trim() : dossierModuleKey));
        const projectSnap = appService.resumeProject(appProject.project_id);
        const activeProfile = resolvedProfileRecord ?? (resolvedProfileName
          ? projectProfiles.find((p) => p.label === resolvedProfileName || p.profile_id === resolvedProfileName)
          : undefined);
        const resolvedDurableProfileId = activeProfile?.profile_id ?? (resolvedProfileName && projectProfiles.length === 0 ? resolvedProfileName : null);

        const routeIndexMap = new Map<string, number>();
        output.routes.forEach((r, idx) => {
          routeIndexMap.set(r.route, idx);
        });

        const dossierRoutes: DiscoveryDossierRoute[] = output.routes.map((r) => {
          const authorizedUrl = r.authorized_index !== undefined
            ? navigationAuthorization.navigation_urls[r.authorized_index]
            : undefined;
          const sanitizedPath = authorizedUrl ? sanitizeTargetPathname(authorizedUrl) : undefined;
          return {
            reference: r.route,
            state: r.state,
            depth: r.depth,
            ...(r.http_status !== undefined ? { http_status: r.http_status } : {}),
            ...(sanitizeDossierText(r.reason, 120) ? { reason: sanitizeDossierText(r.reason, 120) } : {}),
            ...(r.view_id ? { view_id: r.view_id } : {}),
            ...(sanitizedPath ? { authorized_pathname: sanitizedPath } : {}),
          };
        });

        const dossierRelations: DiscoveryDossierRelation[] = output.relations
          .map((rel) => {
            const fromIdx = routeIndexMap.get(rel.from) ?? -1;
            const toIdx = routeIndexMap.get(rel.to) ?? -1;
            return {
              from_route_index: fromIdx,
              to_route_index: toIdx,
              kind: rel.kind,
            };
          })
          .filter((rel) => rel.from_route_index >= 0 && rel.to_route_index >= 0);

        const dossierViews: DiscoveryDossierView[] = [];
        for (const v of output.views) {
          let headings: string[] = [];
          try {
            const evRecord = await bound.store.get(bound.applicationId, 'evidence', v.evidence_id);
            const rawHeadings = (evRecord?.entity.metadata as { view?: { headings?: unknown[] } } | undefined)?.view?.headings;
            if (Array.isArray(rawHeadings)) {
              headings = rawHeadings
                .map((h) => sanitizeDossierText(h, 120))
                .filter((h): h is string => Boolean(h));
            }
          } catch {
            // Best-effort heading enrichment from Knowledge evidence
          }
          const viewRouteIndex = routeIndexMap.get(v.route);
          dossierViews.push({
            view_id: v.id,
            route: v.route,
            ...(viewRouteIndex !== undefined ? { route_index: viewRouteIndex } : {}),
            state: v.state,
            evidence_id: v.evidence_id,
            headings,
            controls: v.controls.map((c) => ({
              tag: c.tag,
              ...(c.role ? { role: c.role } : {}),
              ...(c.input_type ? { input_type: c.input_type } : {}),
              ...(sanitizeDossierText(c.label, 120) ? { label: sanitizeDossierText(c.label, 120) } : {}),
              visibility: c.visibility,
              disabled: c.disabled,
              required_in_dom: c.required_in_dom,
              selector_candidates: c.selector_candidates
                .map((s) => sanitizeDossierText(s, 120))
                .filter((s): s is string => Boolean(s))
                .slice(0, 5),
              selector_stability: c.selector_stability,
            })),
            menus: v.menus,
            forms: v.forms.map((f) => ({
              action_kind: f.submit_indices.length > 0 ? 'submit' : 'fields_only',
              method: f.method,
              field_count: f.field_indices.length,
            })),
            links: v.links.map((l) => ({
              target_route_index: routeIndexMap.get(l.target) ?? -1,
              control_index: l.control_index,
              authorized: l.authorized,
              ...(sanitizeDossierText(l.label, 120) ? { label: sanitizeDossierText(l.label, 120) } : {}),
            })),
            forms_count: v.forms.length,
            links_count: v.links.length,
            truncated: v.truncated,
          });
        }

        const ingestedDocs = appService
          .listIngestedDocuments(appProject.project_id)
          .sort((a, b) => a.doc_id.localeCompare(b.doc_id));
        const dossierScope = {
          project_id: appProject.project_id,
          application_id: appProject.application_id,
          environment_id: projectSnap.environment?.env_id ?? bound.environmentId,
          environment_name: projectSnap.environment?.name ?? env.entity.name,
          tenant_id: resolvedTenantId ?? null,
          profile_id: resolvedDurableProfileId,
          role: activeProfile?.role_name ?? null,
          module_key: dossierModuleKey,
          module_title: dossierModuleTitle,
        };
        const targetPathname = sanitizeTargetPathname(target);
        const confirmedReqs = appService
          .listServiceRequirements(appProject.project_id, dossierModuleKey)
          .filter((r) => r.validation_status === 'confirmed');
        const allScopedRules = appService.listScopedBusinessRules(appProject.project_id);
        const ruleResolution = resolveScopedBusinessRules({
          scope: dossierScope,
          targetPathname,
          discoveredRoutes: dossierRoutes
            .map((r) => r.authorized_pathname)
            .filter((p): p is string => Boolean(p))
            .map((pathname) => ({ pathname })),
          views: dossierViews,
          scopedRules: allScopedRules,
          ingestedDocs,
          legacyRequirements: confirmedReqs,
        });

        const accreditedReqRefs: DiscoveryDossierSourceRef[] = ruleResolution.decisions
          .filter((d) => d.decision_status === 'accredited' && d.source_kind === 'confirmed_requirement' && d.source_id)
          .map((d) => ({
            kind: 'confirmed_requirement' as const,
            ref_id: d.source_id!,
            label: sanitizeDossierText(`${d.source_ref} (${d.source_version ?? 'rev:1'})`, 120),
          }))
          .sort((a, b) => a.ref_id.localeCompare(b.ref_id));

        const sourceRefs: DiscoveryDossierSourceRef[] = [
          ...[...output.evidence]
            .sort((a, b) => a.id.localeCompare(b.id))
            .map((e) => ({ kind: 'knowledge_evidence' as const, ref_id: e.id })),
          ...[...output.observations]
            .sort((a, b) => a.id.localeCompare(b.id))
            .map((o) => ({ kind: 'knowledge_observation' as const, ref_id: o.id })),
          ...ingestedDocs
            .map((d) => ({ kind: 'ingested_doc' as const, ref_id: d.doc_id, label: sanitizeDossierText(d.source_ref, 120) })),
          ...accreditedReqRefs,
        ];

        const visitedCount = output.routes.filter((r) => r.state === 'visited').length;
        const candidateCount = output.routes.filter((r) => r.state === 'candidate').length;
        const blockedCount = output.routes.filter((r) => r.state === 'blocked').length;
        const pendingDiscrepancies = appService.listDiscrepancies(appProject.project_id, true);

        const gaps: DiscoveryDossierGap[] = [];
        if (ruleResolution.summary.accredited_count === 0) {
          gaps.push({
            code: 'missing_business_rules',
            description: 'No hay reglas de negocio acreditadas para este módulo y alcance; las observaciones DOM no acreditan comportamiento esperado.',
            severity: 'warning',
          });
        }
        if (ruleResolution.summary.pending_contradiction_count > 0) {
          gaps.push({
            code: 'rule_contradiction',
            description: `${ruleResolution.summary.pending_contradiction_count} contradicción(es) de igual autoridad pendiente(s) de aclaración; no se generan oráculos ejecutables para esas reglas.`,
            severity: 'blocking',
          });
        }
        if (ruleResolution.summary.unaccredited_pending_count > 0) {
          gaps.push({
            code: 'unaccredited_expectations',
            description: `${ruleResolution.summary.unaccredited_pending_count} expectativa(s) sin acreditar permanecen pendientes sin oráculo.`,
            severity: 'warning',
          });
        }
        if (ruleResolution.summary.legacy_pending_count > 0) {
          gaps.push({
            code: 'legacy_unscoped_requirements',
            description: `${ruleResolution.summary.legacy_pending_count} requisito(s) histórico(s) sin alcance explícito no promovido(s) automáticamente.`,
            severity: 'warning',
          });
        }
        if (blockedCount > 0) {
          gaps.push({
            code: 'blocked_routes_present',
            description: `${blockedCount} ruta(s) bloqueada(s) durante el recorrido.`,
            severity: 'warning',
          });
        }
        if (candidateCount > 0) {
          gaps.push({
            code: 'candidate_routes_unexplored',
            description: `${candidateCount} ruta(s) candidata(s) detectada(s) sin explorar en este recorrido.`,
            severity: 'info',
          });
        }
        if (output.views.length === 0) {
          gaps.push({
            code: 'no_views_observed',
            description: 'No se observaron vistas renderizadas en este recorrido.',
            severity: 'warning',
          });
        }
        if (output.status === 'partial' || dossierViews.some((v) => v.truncated)) {
          gaps.push({
            code: 'partial_coverage',
            description: 'Cobertura parcial: algunas vistas o enlaces excedieron los límites del recorrido.',
            severity: 'info',
          });
        }
        if (pendingDiscrepancies.length > 0) {
          gaps.push({
            code: 'pending_context_discrepancies',
            description: `${pendingDiscrepancies.length} discrepancia(s) de contexto pendiente(s) de decisión.`,
            severity: 'warning',
          });
        }

        const sanitizedLimitations = output.warnings
          .map((w) => sanitizeDossierText(w, 160))
          .filter((w): w is string => Boolean(w))
          .sort();

        const canonicalDossier: DiscoveryDossierCanonical = {
          schema_version: '1',
          scope: dossierScope,
          target_pathname: targetPathname,
          mode: output.mode,
          acquisition_status: output.status,
          routes: dossierRoutes,
          relations: dossierRelations,
          route_counts: {
            visited: visitedCount,
            candidate: candidateCount,
            blocked: blockedCount,
          },
          views: dossierViews,
          source_refs: sourceRefs,
          gaps,
          limitations: sanitizedLimitations,
          rule_resolution: ruleResolution,
        };

        const savedRevision = appService.saveDiscoveryRevision({
          dossier: canonicalDossier,
          targetUrl: sanitizeTargetPathname(target),
          executionId: output.execution_id,
          inventoryId: inv.inventory_id,
        });
        discoveryRevisionId = savedRevision.revision.revision_id;
        discoveryReused = savedRevision.reused;
        const latestByScope = appService.listLatestDiscoveryRevisionsByScope(appProject.project_id);
        const mdFiles = writeDiscoveryMarkdownFiles(
          root,
          appProject.project_id,
          latestByScope,
          { updatedPublishedRevision: savedRevision.revision },
        );
        discoveryDossierSummary = {
          revision_id: savedRevision.revision.revision_id,
          reused: savedRevision.reused,
          module_key: dossierModuleKey,
          index_path: mdFiles.index_path,
          module_doc_path: mdFiles.module_doc_path,
          scope: canonicalDossier.scope,
          gaps_count: gaps.length,
          rule_summary: ruleResolution.summary,
        };

        const firstBlockingAmbiguity = ruleResolution.ambiguities.find((a) => a.severity === 'blocking');
        const activeCamp = appService.resumeProject(appProject.project_id).campaign;
        if (activeCamp) {
          const taskId = `task-disc-${inv.inventory_id}`;
          const safeLabel = typeof args.name === 'string' && args.name.trim() ? args.name.trim() : 'inventario';
          appService.upsertTask({
            projectId: appProject.project_id,
            campaignId: activeCamp.campaign_id,
            taskId,
            kind: 'discovery_inventory',
            title: `Inventario exploratorio (${safeLabel})`,
            status: output.status === 'completed' ? 'completed' : 'waiting_decision',
            progressCurrent: Math.max(1, output.views.length),
            progressTotal: Math.max(1, output.routes.length || output.views.length || 1),
            progressUnit: 'vistas',
            ...(persistedCandidates.length > 0 ? {
              pendingDecision: {
                decision_id: `review-cand-${inv.inventory_id}`,
                kind: 'human_review',
                prompt: 'Revisa los módulos candidatos detectados y selecciona cuáles deseas aprobar para el alcance.',
                blocking: true,
              },
            } : firstBlockingAmbiguity ? {
              pendingDecision: {
                decision_id: firstBlockingAmbiguity.ambiguity_id,
                kind: 'human_review',
                prompt: firstBlockingAmbiguity.question,
                options: firstBlockingAmbiguity.options,
                blocking: true,
              },
            } : {}),
            recoveryCursor: {
              recoverable: true,
              project_id: appProject.project_id,
              campaign_id: activeCamp.campaign_id,
              resume_token: `${appProject.project_id}:${inv.inventory_id}`,
              interrupted_task_id: taskId,
              last_completed_step: 'partial_inventory_saved',
              checkpoint_at: new Date().toISOString(),
              recovery_bundle_available: true,
              tombstone_blocked: false,
            },
          });
        }
      }

      // Positive selection: no DOM text, labels, selectors, URLs, payloads or arbitrary errors.
      return result({ status: output.status, application_id: bound.applicationId, environment_id: bound.environmentId,
        status_scope: 'acquisition',
        requested_module: args.name, execution_id: output.execution_id, mode: output.mode,
        acquisition_status: output.status, acquisition_persistence: output.observations.length ? 'committed' : 'not_attempted',
        module_identity_status: persistedCandidates.length > 0 && identity.status === 'plan_ambiguous_or_missing'
          ? 'candidate_persisted'
          : identity.status,
        ...association, association_code, association_receipt: receipt,
        ...(persistedInventoryId ? { partial_inventory_id: persistedInventoryId, reviewable_candidates: persistedCandidates } : {}),
        ...(discoveryRevisionId ? { discovery_revision_id: discoveryRevisionId, discovery_reused: discoveryReused, discovery_dossier: discoveryDossierSummary } : {}),
        ...(appServiceMod ? { service_module: { module_id: appServiceMod.module_id, key: appServiceMod.key, status: appServiceMod.status } } : {}),
        association_next_safe_action: isPlannedModule
          ? 'El módulo ya está en el alcance. Consulta qap_status para continuar en el orden del plan.'
          : association.association_status === 'confirmed'
          ? 'Revisión humana de observaciones; cobertura parcial.'
          : persistedCandidates.length > 0
            ? 'Revisa los módulos candidatos detectados y confirma cuáles incluir en las pruebas.'
            : receipt ? 'Reintenta conservar el mismo progreso dentro del alcance vigente.'
              : 'Revisa los candidatos detectados o selecciona los módulos a cubrir antes de definir reglas.',
        counts: { candidate_routes: output.routes.filter(r => r.state === 'candidate').length,
          visited_routes: output.routes.filter(r => r.state === 'visited').length,
          blocked_routes: output.routes.filter(r => r.state === 'blocked').length, views: output.views.length,
          controls: output.views.reduce((n, v) => n + v.controls.length, 0),
          forms: output.views.reduce((n, v) => n + v.forms.length, 0), relations: output.relations.length },
        routes: output.routes.map(r => ({ reference: r.route, state: r.state, depth: r.depth, http_status: r.http_status,
          ...(r.reason ? { reason: r.reason } : {}) })),
        views: output.views.map(v => ({ reference: v.id, route: v.route, state: v.state,
          controls: v.controls.length, forms: v.forms.length, truncated: v.truncated })),
        relations: output.relations.map(r => ({ from: r.from, to: r.to, kind: r.kind })),
        limitations: [...output.warnings], budgets: { ...output.budget }, limits: { ...output.limits },
        cleanup: { ...output.cleanup }, persistence: output.observations.length ? 'committed' : 'not_attempted',
        observations: output.observations.length, evidence: output.evidence.length,
        integration: { ...discoveryIntegration, module_association: association.association_status },
        ...(isPlannedModule && output.observations.length > 0 ? { siguiente_accion: {
          tipo: 'trabajo', tool: 'qap_status',
          descripcion: 'Continúa con los módulos del plan vigente en su orden de prioridad.',
          parametros: { targetPath: root },
        } } : {}),
        next_safe_action: isPlannedModule
          ? 'Consulta qap_status para continuar con el plan vigente.'
          : persistedCandidates.length > 0
          ? 'Revisa los módulos candidatos detectados con qap_project(action="promote_candidates") o qap_session_plan para crear módulos confirmables.'
          : 'Continúa revisando preguntas y expectativas sobre los módulos del alcance.',
      }, output.status === 'blocked' || output.status === 'indeterminate');
    } catch (error: unknown) {
      // Root/symlink/host-scope rejection is not a crawler outage. Preserve a
      // fixed, non-sensitive diagnostic without disclosing forbidden paths.
      if (error instanceof McpToolError && error.code === 'invalid_arguments') {
        return blocked('invalid_project_scope');
      }
      const code = error instanceof BlackBoxCrawlerError ? error.code : 'DISCOVERY_UNAVAILABLE';
      return result({ status: 'indeterminate', code,
        acquisition_status: 'indeterminate', acquisition_persistence: code === 'PERSISTENCE_FAILED' ? 'failed' : 'not_attempted',
        association_status: 'not_attempted', module_identity_status: 'not_resolved', coverage: 'partial',
        persistence: code === 'PERSISTENCE_FAILED' ? 'failed' : 'not_attempted',
        next_safe_action: 'Revisar el binding, la política y la disponibilidad del navegador; sin reintento automático.' }, true);
    }
  }
}
