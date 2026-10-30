import { realpathSync } from 'node:fs';

import { FileSystemStorage } from '@qap/knowledge';
import { BlackBoxCrawler, BlackBoxCrawlerError, type BlackBoxCrawlerInput, type CrawlerDependencies } from '@qap/playwright-adapter';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpToolError, type IMcpToolHandler, type McpInvocationContext } from '../dispatcher.js';

import { binding, definition, isObject, projectRoot, result, validateBase, type StateDependencies } from './state-services.js';

/** Trusted host configuration. GET consent acknowledges possible server-side effects. */
export interface DiscoveryAuthorization {
  readonly projectRoot: string;
  readonly applicationId: string;
  readonly environmentId: string;
  /** Pin the policy revision; a changed policy requires renewed host authorization. */
  readonly environmentRevision: number;
  readonly authorization: BlackBoxCrawlerInput['authorization'];
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
    if (absolute && url.href !== path) return;
    if (!absolute && (!path.startsWith('/') && path.includes(':'))) return;
    return url.href;
  } catch { return; }
}

export class DiscoveryHandler implements IMcpToolHandler {
  readonly definition = definition('qap_discover');
  private readonly authorizations: readonly DiscoveryAuthorization[];
  constructor(private readonly dependencies: StateDependencies, authorizations: readonly DiscoveryAuthorization[] = []) {
    // Preserve resolver callbacks, but snapshot all mutable host policy structures.
    this.authorizations = authorizations.map(a => ({ ...a, authorization: structuredClone(a.authorization),
      limits: a.limits && { ...a.limits }, dependencies: a.dependencies && {
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
    }, true);
    if (context.signal.aborted) return blocked('cancelled');
    if (['credentials', 'profile', 'profileId', 'storageState', 'cookies', 'session', 'auth'].some(k => Object.hasOwn(args, k))) {
      return blocked('authentication_not_supported');
    }
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
      const configurations = this.authorizations.filter(a => realpathSync(a.projectRoot) === root &&
        a.applicationId === bound.applicationId && a.environmentId === bound.environmentId);
      if (configurations.length !== 1) return blocked('discovery_authorization_required');
      const config = configurations[0];
      if (config.environmentRevision !== env.revision || config.authorization.read_only_acknowledged !== true) return blocked('authorization_context_mismatch');
      const target = resolveTarget(args.path as string, env.entity.base_url);
      if (!target || !config.authorization.navigation_urls.includes(target)) return blocked('url_not_authorized');
      const lifecycle = await new FileSystemStorage({ rootDir: root }).getLifecycleState();
      if (lifecycle.phase !== 'WORKING') return blocked('phase_restricted', lifecycle.phase === 'ONBOARDING' ? 'qap_context_set' : 'qap_session_plan');
      const module = lifecycle.modules && Object.hasOwn(lifecycle.modules, args.name as string)
        ? lifecycle.modules[args.name as string] : undefined;
      if (!module || ['closed', 'waived'].includes(module.state)) return blocked('module_restricted', 'qap_session_plan');
      if (lifecycle.session?.auth?.required) return blocked('authentication_not_supported');
      const currentEnvironment = await bound.store.get(bound.applicationId, 'environment', bound.environmentId);
      if (!currentEnvironment || currentEnvironment.revision !== env.revision) return blocked('authorization_context_mismatch');
      if (context.signal.aborted) return blocked('cancelled');
      const output = await new BlackBoxCrawler(bound.store, config.dependencies).run({
        application_id: bound.applicationId, environment: env.entity, target_url: target,
        authorization: config.authorization, limits: config.limits, signal: context.signal,
        isolation: 'fresh_anonymous_static',
      });
      // Positive selection: no DOM text, labels, selectors, URLs, payloads or arbitrary errors.
      return result({ status: output.status, application_id: bound.applicationId, environment_id: bound.environmentId,
        requested_module: args.name, execution_id: output.execution_id, mode: output.mode,
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
        next_safe_action: 'Revisar observaciones; no representan requisitos ni defectos confirmados.',
      }, output.status === 'blocked' || output.status === 'indeterminate');
    } catch (error: unknown) {
      const code = error instanceof BlackBoxCrawlerError ? error.code : 'DISCOVERY_UNAVAILABLE';
      return result({ status: 'indeterminate', code,
        persistence: code === 'PERSISTENCE_FAILED' ? 'failed' : 'not_attempted',
        next_safe_action: 'Revisar el binding, la política y la disponibilidad del navegador; sin reintento automático.' }, true);
    }
  }
}
