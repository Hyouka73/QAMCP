import { realpathSync } from 'node:fs';

import { SessionStore, readProfile } from '@qap/auth';
import { FileSystemStorage } from '@qap/knowledge';
import { BlackBoxCrawler, BlackBoxCrawlerError, type BlackBoxCrawlerInput, type CrawlerDependencies } from '@qap/playwright-adapter';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpToolError, type IMcpToolHandler, type McpInvocationContext } from '../dispatcher.js';
import {
  type IDiscoveryAuthorizer,
  syncDiscoveryAuthorizationsFromDisk,
  atomicRecordDiscoveryAuthorization,
} from '../discovery-authorizer.js';

import { binding, definition, isObject, projectRoot, result, validateBase, type StateDependencies } from './state-services.js';
import { discoveryIntegration } from './legacy-discovery-contract.js';
import { ModuleObservationBridge, type AssociationReceipt } from './module-observation-bridge.js';

/** Trusted host configuration. GET consent acknowledges possible server-side effects. */
export interface DiscoveryAuthorization {
  readonly projectRoot: string;
  readonly applicationId: string;
  readonly environmentId: string;
  /** Pin the policy revision; a changed policy requires renewed host authorization. */
  readonly environmentRevision: number;
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
  private readonly authorizer?: IDiscoveryAuthorizer;
  private readonly hostDiscoveryRegistryPath?: string;

  constructor(
    private readonly dependencies: StateDependencies,
    authorizations: readonly DiscoveryAuthorization[] = [],
    authorizer?: IDiscoveryAuthorizer,
    hostDiscoveryRegistryPath?: string,
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
      'credentials', 'profile', 'profileId', 'storageState', 'cookies', 'session', 'auth'])) return false;
    if (typeof args.name !== 'string' || !args.name.trim() || args.name.length > 128 || [...args.name].some(c => c.charCodeAt(0) < 32) ||
      typeof args.path !== 'string' || !args.path || args.path.length > 2048) return false;
    if (args.description !== undefined && (typeof args.description !== 'string' || args.description.length > 4000)) return false;
    if (args.tags !== undefined && (!Array.isArray(args.tags) || args.tags.length > 100 ||
      args.tags.some((tag: unknown) => typeof tag !== 'string' || tag.length > 100))) return false;
    return args.headed === undefined || typeof args.headed === 'boolean';
  }

  async execute(args: unknown, context: McpInvocationContext): Promise<CallToolResult> {
    if (!this.validateArguments(args) || !isObject(args)) throw new McpToolError('invalid_arguments');
    const blocked = (code: string, next = 'Revisar la configuración explícita del host.') => result({
      status: 'blocked', code, persistence: 'not_attempted', next_safe_action: next,
      acquisition_status: 'blocked', acquisition_persistence: 'not_attempted', association_status: 'not_attempted', module_identity_status: 'not_resolved', coverage: 'partial',
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

      const configurations = this.authorizations.filter(a => {
        try {
          return realpathSync(a.projectRoot) === root &&
            a.applicationId === bound.applicationId &&
            a.environmentId === bound.environmentId;
        } catch {
          return false;
        }
      });

      let config: DiscoveryAuthorization | undefined;

      if (configurations.length === 1) {
        config = configurations[0];
        if (config.environmentRevision !== env.revision || config.authorization.read_only_acknowledged !== true) {
          return blocked('authorization_context_mismatch');
        }
        if (!target) return blocked('url_not_authorized');
        if (!config.authorization.navigation_urls.includes(target)) {
          if (!this.authorizer) {
            return blocked('url_not_authorized');
          }
          // Dynamic prompt for new URL within existing authorized context
          const defaultLimits: NonNullable<BlackBoxCrawlerInput['limits']> = {
            max_pages: config.limits?.max_pages ?? 10,
            max_depth: config.limits?.max_depth ?? 2,
            total_timeout_ms: config.limits?.total_timeout_ms ?? 60_000,
            navigation_timeout_ms: config.limits?.navigation_timeout_ms ?? 15_000,
            max_requests: config.limits?.max_requests ?? 50,
            max_bytes: config.limits?.max_bytes ?? 10_485_760,
            max_redirects: config.limits?.max_redirects ?? 5,
            max_elements: config.limits?.max_elements ?? 200,
          };
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
            if (!config.authorization.navigation_urls.includes(target)) {
              (config.authorization.navigation_urls as string[]).push(target);
            }
            if (this.hostDiscoveryRegistryPath) {
              atomicRecordDiscoveryAuthorization(this.hostDiscoveryRegistryPath, config);
            }
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
      } else {
        if (!target) return blocked('url_not_authorized');
        if (this.authorizer) {
          const defaultLimits: NonNullable<BlackBoxCrawlerInput['limits']> = {
            max_pages: 10,
            max_depth: 2,
            total_timeout_ms: 60_000,
            navigation_timeout_ms: 15_000,
            max_requests: 50,
            max_bytes: 10_485_760,
            max_redirects: 5,
            max_elements: 200,
          };
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
            const newAuth: DiscoveryAuthorization = {
              projectRoot: root,
              applicationId: bound.applicationId,
              environmentId: bound.environmentId,
              environmentRevision: env.revision,
              authorization: {
                read_only_acknowledged: true,
                navigation_urls: [target],
                allow_public_network: true,
              },
              limits: defaultLimits,
            };
            this.authorizations.push(newAuth);
            config = newAuth;
            if (this.hostDiscoveryRegistryPath) {
              atomicRecordDiscoveryAuthorization(this.hostDiscoveryRegistryPath, newAuth);
            }
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
        } else {
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
        }
      }

      if (!config) {
        return result({
          status: 'blocked',
          category: 'human_authorization',
          code: 'discovery_authorization_required',
          acquisition_status: 'blocked',
          acquisition_persistence: 'not_attempted',
          association_status: 'not_attempted',
          persistence: 'not_attempted',
        }, true);
      }
      const lifecycle = await new FileSystemStorage({ rootDir: root }).getLifecycleState();
      const provisional = this.dependencies.provisionalInventory && !bound.moduleBindings?.length &&
        ['ONBOARDING', 'SCOPING'].includes(lifecycle.phase) && args.name === 'inventario-provisional';
      if (lifecycle.phase !== 'WORKING' && !provisional) return blocked('phase_restricted', lifecycle.phase === 'ONBOARDING' ? 'qap_context_set' : 'qap_session_plan');
      const module = lifecycle.modules && Object.hasOwn(lifecycle.modules, args.name as string)
        ? lifecycle.modules[args.name as string] : undefined;
      if (!provisional && (!module || ['closed', 'waived'].includes(module.state))) return blocked('module_restricted', 'qap_session_plan');
      let authenticated_session: BlackBoxCrawlerInput['authenticated_session'];
      if (args.profile !== undefined || lifecycle.session?.auth?.required) {
        if (typeof args.profile !== 'string' || !config.authorizedProfiles?.includes(args.profile)) return blocked('unauthorized_profile');
        const profile = await readProfile(args.profile, root);
        if (!profile || profile.application_id !== bound.applicationId || profile.env !== bound.environmentId || !profile.verified ||
          profile.post_login_condition?.type !== 'selector_present') return blocked('verified_cookie_profile_required');
        const session = new SessionStore(undefined, root).getValidSession(args.profile);
        if (!session) return blocked('auth_session_expired', 'Renovar la sesión mediante qap_auth_add, con autorización humana.');
        if (session.origins.some(o => o.localStorage.length)) return blocked('script_session_not_supported', 'Este modo conserva solo cookies; se requiere una sesión compatible con captura estática.');
        authenticated_session = { profile_id: args.profile, origin: new URL(env.entity.base_url).origin,
          cookies: session.cookies, validation_selector: profile.post_login_condition.value };
      }
      const bridge = new ModuleObservationBridge(bound.store, { ...bound, projectRoot: root });
      const planned = lifecycle.session?.plan?.filter(p => p.module === args.name) ?? [];
      const identity = planned.length === 1 ? await bridge.resolve(args.name as string) : { status: 'plan_ambiguous_or_missing' };
      const currentEnvironment = await bound.store.get(bound.applicationId, 'environment', bound.environmentId);
      if (!currentEnvironment || currentEnvironment.revision !== env.revision) return blocked('authorization_context_mismatch');
      if (context.signal.aborted) return blocked('cancelled');
      const output = await new BlackBoxCrawler(bound.store, config.dependencies).run({
        application_id: bound.applicationId, environment: env.entity, target_url: target,
        authorization: config.authorization, limits: config.limits, signal: context.signal,
        isolation: authenticated_session ? 'fresh_authenticated_static' : 'fresh_anonymous_static', authenticated_session,
      });
      if (authenticated_session && !output.observations.length && (output.warnings.includes('AUTH_SESSION_INVALID') ||
        output.routes.some(route => route.http_status === 401 || route.http_status === 403))) {
        return result({ status: 'blocked', code: 'auth_session_invalid', acquisition_status: 'blocked', acquisition_persistence: 'not_attempted',
          association_status: 'not_attempted', execution_id: output.execution_id, cleanup: output.cleanup,
          next_safe_action: 'Revisar permisos y renovar la sesión aprobada mediante qap_auth_add; sin reintento automático.',
          desbloquear_con: { tool: 'qap_auth_add', descripcion: 'El QA debe revisar permisos o completar de nuevo el acceso autorizado.' } }, true);
      }
      const receipt: AssociationReceipt | undefined = identity.status === 'resolved' && 'fingerprint' in identity && output.observations.length
        ? { version: 1, binding: identity.fingerprint, execution: output.execution_id, observations: output.observations.map(o => o.id).sort() } : undefined;
      const association = receipt ? await bridge.associate(args.name as string, receipt) : {
        association_status: output.observations.length ? 'blocked' : 'not_attempted',
        code: identity.status === 'resolved' ? 'context_changed_or_no_observations' : identity.status,
        associated_observations: 0, confirmed_relations: 0, coverage: 'partial',
      };
      // Positive selection: no DOM text, labels, selectors, URLs, payloads or arbitrary errors.
      return result({ status: output.status, application_id: bound.applicationId, environment_id: bound.environmentId,
        status_scope: 'acquisition',
        requested_module: args.name, execution_id: output.execution_id, mode: output.mode,
        acquisition_status: output.status, acquisition_persistence: output.observations.length ? 'committed' : 'not_attempted',
        module_identity_status: identity.status, ...association, association_receipt: receipt,
        association_next_safe_action: association.association_status === 'confirmed'
          ? 'Revisión humana de observaciones; cobertura parcial.'
          : receipt ? 'El host debe conservar y reintentar el mismo recibo solo con el contexto autorizado vigente.'
            : 'El host debe aportar una vinculación inequívoca a un módulo canónico activo y revisiones vigentes; no se crean identidades.',
        counts: { candidate_routes: output.routes.filter(r => r.state === 'candidate').length,
          visited_routes: output.routes.filter(r => r.state === 'visited').length,
          blocked_routes: output.routes.filter(r => r.state === 'blocked').length, views: output.views.length,
          controls: output.views.reduce((n, v) => n + v.controls.length, 0),
          forms: output.views.reduce((n, v) => n + v.forms.length, 0), relations: output.relations.length },
        routes: output.routes.map(r => ({ reference: r.route, state: r.state, depth: r.depth, http_status: r.http_status })),
        views: output.views.map(v => ({ reference: v.id, route: v.route, state: v.state,
          controls: v.controls.length, forms: v.forms.length, truncated: v.truncated })),
        relations: output.relations.map(r => ({ from: r.from, to: r.to, kind: r.kind })),
        limitations: [...output.warnings], budgets: { ...output.budget }, limits: { ...output.limits },
        cleanup: { ...output.cleanup }, persistence: output.observations.length ? 'committed' : 'not_attempted',
        observations: output.observations.length, evidence: output.evidence.length,
        integration: { ...discoveryIntegration, module_association: association.association_status },
        next_safe_action: 'qap_rules_set con canonical_interview.action=next para revisar preguntas canónicas; las observaciones siguen sin confirmar reglas.',
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
