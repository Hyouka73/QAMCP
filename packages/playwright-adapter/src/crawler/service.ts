import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { isDeepStrictEqual } from 'node:util';

import type { IKnowledgeStore, KnowledgeTrace, KnowledgeWrite } from '@qap/engine';
import type { ApplicationObservation, MultimodalEvidenceRef } from '@qap/shared';
import type { Browser, BrowserContext } from 'playwright-core';

import { parseUrl, ReconScope } from '../reconnaissance/network.js';
import { acquire } from '../reconnaissance/transport.js';
import { ReconnaissanceError, type ReconLimits, type ReconnaissanceInput } from '../reconnaissance/types.js';

import { launchIsolated, startDenyProxy } from './browser.js';
import { extractDom } from './dom.js';
import { BlackBoxCrawlerError, type BlackBoxCrawlerInput, type BlackBoxCrawlerResult,
  type CrawlerDependencies, type CrawlerLimits, type CrawlerRoute, type ObservedView } from './types.js';

const defaults: CrawlerLimits = { max_pages: 10, max_depth: 3, total_timeout_ms: 30000,
  navigation_timeout_ms: 5000, max_requests: 20, max_bytes: 524288, max_redirects: 3, max_elements: 250 };
const caps: CrawlerLimits = { max_pages: 32, max_depth: 10, total_timeout_ms: 120000,
  navigation_timeout_ms: 30000, max_requests: 128, max_bytes: 1048576, max_redirects: 5, max_elements: 500 };

function limitsFor(input: BlackBoxCrawlerInput): CrawlerLimits {
  if (input.limits !== undefined && (!input.limits || typeof input.limits !== 'object' || Array.isArray(input.limits) ||
    Object.keys(input.limits).some(key => !Object.hasOwn(defaults, key)))) throw new BlackBoxCrawlerError('INVALID_INPUT');
  const limits = { ...defaults, ...input.limits };
  for (const key of Object.keys(caps) as Array<keyof CrawlerLimits>) {
    if (!Number.isSafeInteger(limits[key]) || limits[key] < (['max_depth', 'max_redirects'].includes(key) ? 0 : 1) || limits[key] > caps[key]) {
      throw new BlackBoxCrawlerError('INVALID_INPUT');
    }
  }
  return limits;
}

/** Conservative denylist supplements explicit read-only consent; it cannot prove GET semantics. */
function safeNavigation(url: URL): boolean {
  let path = url.pathname;
  try { for (let i = 0; i < 4 && path.includes('%'); i++) path = decodeURIComponent(path); }
  catch { return false; }
  return !url.search && !path.includes('%') &&
    !/logout|logoff|signout|sign-out|delete|remove|revoke|reset|destroy|unsubscribe|purchase|checkout|submit|activate|deactivate|approve|reject|execute|truncate|cancel|confirm/i.test(path.normalize('NFKC'));
}

/** Static, anonymous observation only. Chromium never performs the application's HTTP transport. */
export class BlackBoxCrawler {
  constructor(private readonly store: IKnowledgeStore, private readonly dependencies: CrawlerDependencies = {}) {}

  async run(request: BlackBoxCrawlerInput): Promise<BlackBoxCrawlerResult> {
    let input: BlackBoxCrawlerInput;
    try {
      input = structuredClone({ ...request, signal: undefined });
    } catch { throw new BlackBoxCrawlerError('INVALID_INPUT'); }
    if (!input?.environment || input.application_id !== input.environment.application_id ||
      !/^[a-zA-Z0-9_.:-]{1,128}$/.test(input.application_id) ||
      !/^[a-zA-Z0-9_.:-]{1,128}$/.test(input.environment.environment_id) ||
      input.authorization?.read_only_acknowledged !== true ||
      (input.isolation !== undefined && input.isolation !== 'fresh_anonymous_static') ||
      (input.tls_ca !== undefined && (typeof input.tls_ca !== 'string' || input.tls_ca.length > 65536)) ||
      (input.environment.rate_limit_ms !== undefined && (!Number.isSafeInteger(input.environment.rate_limit_ms) ||
        input.environment.rate_limit_ms < 0 || input.environment.rate_limit_ms > 60000))) throw new BlackBoxCrawlerError('INVALID_INPUT');
    const limits = limitsFor(input);
    const recon: ReconnaissanceInput = { application_id: input.application_id, environment: input.environment,
      target_url: input.target_url, authorization: { ...input.authorization, allowed_urls: input.authorization.navigation_urls },
      tls_ca: input.tls_ca };
    let scope: ReconScope, target: URL, allowed: string[];
    try {
      scope = new ReconScope(recon, this.dependencies.resolver);
      target = parseUrl(input.target_url); scope.authorize(target);
      allowed = input.authorization.navigation_urls.map(value => parseUrl(value).href);
    } catch { throw new BlackBoxCrawlerError('INVALID_INPUT'); }
    const originalContext = await this.context(input);
    const started = Date.now();
    const signal = AbortSignal.any([AbortSignal.timeout(limits.total_timeout_ms), ...(request.signal ? [request.signal] : [])]);
    const result: BlackBoxCrawlerResult = { execution_id: randomUUID(), status: 'indeterminate',
      mode: 'fresh_anonymous_static', routes: [], views: [], relations: [], observations: [], evidence: [],
      derived_entities_deferred: true,
      warnings: ['STATIC_MODE_NO_APPLICATION_JAVASCRIPT', 'NO_GENERAL_BROWSER_SSRF_CERTIFICATION',
        'EXTERNAL_RESOURCES_FRAMES_DOWNLOADS_BLOCKED', 'ROUTE_REFERENCES_ARE_OPAQUE_PER_EXECUTION',
        'GET_SAFETY_REQUIRES_CALLER_CONSENT', 'DOMAIN_IDENTITIES_DEFERRED'],
      limits, budget: { pages: 0, requests: 0, received_bytes: 0, decoded_bytes: 0, retained_bytes: 0,
        elapsed_ms: 0, concurrency: 1, retries: 0, blocked_browser_requests: 0, deny_proxy_connections: 0 },
      cleanup: { browser_closed: true, proxy_closed: true } };
    const salt = randomBytes(32);
    const reference = (value: string) => `urn:qap:route:${createHmac('sha256', salt).update(value).digest('hex')}`;
    const records = new Map<string, CrawlerRoute>();
    const record = (url: string, depth: number): CrawlerRoute => {
      let found = records.get(url);
      if (!found) {
        const index = allowed.indexOf(url);
        found = { route: reference(url), depth, state: 'candidate', ...(index >= 0 ? { authorized_index: index } : {}) };
        records.set(url, found); result.routes.push(found);
      }
      return found;
    };
    const authorize = (url: URL) => { scope.authorize(url); if (!safeNavigation(url)) throw new ReconnaissanceError('SCOPE_BLOCKED'); };
    const queue = [{ url: target.href, depth: 0 }];
    const enqueued = new Set([target.href]);
    const attempted = new Set<string>();
    const transportLimits: ReconLimits = { max_requests: limits.max_requests, max_received_bytes: limits.max_bytes,
      max_decoded_bytes: limits.max_bytes, max_retained_bytes: limits.max_bytes, max_redirects: limits.max_redirects,
      request_timeout_ms: limits.navigation_timeout_ms, total_timeout_ms: limits.total_timeout_ms };
    let browser: Browser | undefined;
    let context: BrowserContext | undefined;
    let proxy: Awaited<ReturnType<typeof startDenyProxy>> | undefined;
    const pending = new Set<Promise<void>>();
    const closeOnAbort = () => { if (context) void context.close().catch(() => undefined); };
    record(target.href, 0);
    try {
      if (signal.aborted) throw new Error('CANCELLED_OR_DEADLINE');
      proxy = await startDenyProxy(() => result.budget.deny_proxy_connections++);
      result.cleanup.proxy_closed = false;
      browser = await launchIsolated(proxy.url, this.dependencies.browser, Math.min(limits.navigation_timeout_ms, limits.total_timeout_ms));
      result.cleanup.browser_closed = false;
      context = await browser.newContext({ javaScriptEnabled: false, offline: true, serviceWorkers: 'block',
        acceptDownloads: false, permissions: [], ignoreHTTPSErrors: false });
      signal.addEventListener('abort', closeOnAbort, { once: true });
      if (signal.aborted) closeOnAbort();
      await context.routeWebSocket('**/*', socket => socket.close());
      let document: { url: string; body: string; status: number } | undefined;
      const page = await context.newPage();
      context.on('page', extra => { if (extra !== page) void extra.close().catch(() => undefined); });
      page.on('download', download => { void download.cancel().catch(() => undefined); });
      await context.route('**/*', route => {
        const task = (async () => {
          const req = route.request();
          if (document && req.method() === 'GET' && req.isNavigationRequest() && req.frame() === page.mainFrame() && req.url() === document.url) {
            const response = document; document = undefined; // One-use document; meta refresh cannot repeat it.
            await route.fulfill({ status: response.status, body: response.body,
              headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store',
                'content-security-policy': "sandbox allow-same-origin; default-src 'none'; style-src 'unsafe-inline'; form-action 'none'; frame-src 'none'; connect-src 'none'; base-uri 'none'" } });
          } else { result.budget.blocked_browser_requests++; await route.abort('blockedbyclient'); }
        })().catch(() => undefined);
        pending.add(task); void task.finally(() => pending.delete(task));
        return task;
      });
      while (queue.length && !signal.aborted) {
        const item = queue.shift()!;
        let current = parseUrl(item.url);
        let route = record(current.href, item.depth);
        if (attempted.has(current.href)) continue;
        if (result.budget.pages >= limits.max_pages) { route.reason = 'PAGE_LIMIT'; break; }
        if (item.depth > limits.max_depth) { route.reason = 'DEPTH_LIMIT'; continue; }
        attempted.add(current.href);
        const navigationSignal = AbortSignal.any([signal, AbortSignal.timeout(limits.navigation_timeout_ms)]);
        const stopNavigation = () => { void page.close().catch(() => undefined); };
        try {
          let redirects = 0;
          let capture: Awaited<ReturnType<typeof acquire>>;
          for (;;) {
            authorize(current);
            if (navigationSignal.aborted) throw new ReconnaissanceError('TIMEOUT');
            if (result.budget.requests && input.environment.rate_limit_ms) await delay(input.environment.rate_limit_ms, undefined, { signal: navigationSignal });
            capture = await acquire(current, scope, recon, transportLimits, result.budget, navigationSignal);
            route.http_status = capture.status;
            if (capture.issue) throw new ReconnaissanceError(capture.issue);
            if (![301, 302, 303, 307, 308].includes(capture.status)) break;
            if (redirects++ >= limits.max_redirects) throw new ReconnaissanceError('REDIRECT_LIMIT');
            if (!capture.headers.location) throw new ReconnaissanceError('SCOPE_BLOCKED');
            const next = parseUrl(new URL(capture.headers.location, current).href);
            const destination = record(next.href, item.depth);
            try { authorize(next); } catch { destination.state = 'blocked'; destination.reason = 'SCOPE_BLOCKED'; throw new ReconnaissanceError('SCOPE_BLOCKED'); }
            result.relations.push({ from: route.route, to: destination.route, kind: 'http_redirect' });
            route.state = 'redirected';
            if (attempted.has(next.href)) throw new ReconnaissanceError('REDIRECT_LIMIT');
            attempted.add(next.href); current = next; route = destination;
          }
          if (capture.status < 200 || capture.status >= 300) { route.state = 'unavailable'; route.reason = 'HTTP_UNAVAILABLE'; continue; }
          if (capture.headers['content-disposition'] || !/^text\/html(?:\s*;|$)/i.test(capture.headers['content-type'] ?? '')) {
            route.state = 'blocked'; route.reason = 'NON_HTML_OR_DOWNLOAD'; continue;
          }
          document = { url: current.href, body: capture.body, status: capture.status };
          result.budget.pages++;
          navigationSignal.addEventListener('abort', stopNavigation, { once: true });
          await page.goto(current.href, { waitUntil: 'domcontentloaded', timeout: limits.navigation_timeout_ms });
          if (navigationSignal.aborted || page.url() !== current.href) throw new ReconnaissanceError('TIMEOUT');
          const dom = await extractDom(page, limits.max_elements);
          if (navigationSignal.aborted) throw new ReconnaissanceError('TIMEOUT');
          const evidenceId = randomUUID();
          const view: ObservedView = { id: randomUUID(), route: route.route,
            state: dom.script_dependent ? 'loading_or_script_dependent' : 'static_snapshot',
            evidence_id: evidenceId, controls: dom.controls, links: [], menus: dom.menus,
            headings: dom.headings, forms: dom.forms, truncated: dom.truncated };
          route.state = 'visited'; route.view_id = view.id; result.views.push(view);
          const candidates: string[] = [];
          for (const link of dom.links) {
            let linked: URL;
            try { linked = new URL(link.href); linked.hash = ''; linked = parseUrl(linked.href); }
            catch {
              const denied = record(link.href, item.depth + 1);
              denied.state = 'blocked'; denied.reason = 'UNSAFE_OR_INVALID_URL';
              view.links.push({ target: denied.route, control_index: link.control_index, authorized: false });
              result.relations.push({ from: route.route, to: denied.route, kind: 'link_candidate' });
              continue;
            }
            const candidate = record(linked.href, item.depth + 1);
            let permitted = true;
            try { authorize(linked); if (link.download) throw new ReconnaissanceError('SCOPE_BLOCKED'); }
            catch { permitted = false; if (candidate.state === 'candidate') { candidate.state = 'blocked'; candidate.reason = 'SCOPE_OR_UNSAFE_LINK'; } }
            view.links.push({ target: candidate.route, control_index: link.control_index, authorized: permitted,
              ...(link.label ? { label: link.label } : {}) });
            if (!result.relations.some(r => r.from === route.route && r.to === candidate.route && r.kind === 'link_candidate')) {
              result.relations.push({ from: route.route, to: candidate.route, kind: 'link_candidate' });
            }
            if (permitted && !enqueued.has(linked.href)) candidates.push(linked.href);
          }
          for (const value of [...new Set(candidates)].sort()) {
            enqueued.add(value);
            const candidate = record(value, item.depth + 1);
            if (item.depth + 1 > limits.max_depth) candidate.reason = 'DEPTH_LIMIT';
            else queue.push({ url: value, depth: item.depth + 1 });
          }
          this.observe(input, result, view, evidenceId);
        } catch (error) {
          route.state = 'inconclusive';
          route.reason = error instanceof ReconnaissanceError ? error.code : navigationSignal.aborted ? 'TIMEOUT' : 'NAVIGATION_FAILED';
          if (['SCOPE_BLOCKED', 'NETWORK_BLOCKED', 'PEER_MISMATCH'].includes(route.reason)) route.state = 'blocked';
          if (page.isClosed()) break;
        } finally {
          document = undefined;
          navigationSignal.removeEventListener('abort', stopNavigation);
        }
      }
      if (signal.aborted) result.warnings.push('CANCELLED_OR_DEADLINE');
      for (const route of result.routes) if (route.state === 'candidate' && !route.reason) {
        route.reason = signal.aborted ? 'CANCELLED_OR_DEADLINE' : 'PAGE_LIMIT';
      }
    } catch {
      result.warnings.push(signal.aborted ? 'CANCELLED_OR_DEADLINE' : 'BROWSER_OR_PROXY_UNAVAILABLE');
    } finally {
      signal.removeEventListener('abort', closeOnAbort);
      try { if (context) await context.close(); } catch { /* Browser close below is authoritative. */ }
      try { if (browser) await browser.close(); result.cleanup.browser_closed = true; }
      catch { result.cleanup.browser_closed = false; }
      await Promise.allSettled([...pending]);
      try { if (proxy) await proxy.close(); result.cleanup.proxy_closed = true; }
      catch { result.cleanup.proxy_closed = false; }
      result.budget.elapsed_ms = Date.now() - started;
    }
    if (!result.cleanup.browser_closed || !result.cleanup.proxy_closed) throw new BlackBoxCrawlerError('CLEANUP_FAILED');
    for (const route of result.routes) if (route.state === 'candidate' && !route.reason) {
      route.reason = signal.aborted ? 'CANCELLED_OR_DEADLINE' : 'BROWSER_OR_PROXY_UNAVAILABLE';
    }
    result.status = result.views.length ? (result.routes.some(r => !['visited', 'redirected'].includes(r.state)) ||
      result.views.some(v => v.state !== 'static_snapshot' || v.truncated) || signal.aborted ? 'partial' : 'completed')
      : result.routes.some(r => r.state === 'blocked') ? 'blocked' : 'indeterminate';
    if (result.observations.length) await this.persist(input, result, originalContext);
    result.budget.elapsed_ms = Date.now() - started;
    return result;
  }

  private async context(input: BlackBoxCrawlerInput): Promise<string> {
    try {
      const app = await this.store.get(input.application_id, 'application', input.application_id);
      const env = await this.store.get(input.application_id, 'environment', input.environment.environment_id);
      if (!app || !env || !isDeepStrictEqual(env.entity, input.environment)) throw new Error('CONTEXT_REQUIRED');
      return `${app.revision}:${env.revision}`;
    } catch { throw new BlackBoxCrawlerError('CONTEXT_REQUIRED'); }
  }

  private observe(input: BlackBoxCrawlerInput, result: BlackBoxCrawlerResult, view: ObservedView, evidenceId: string): void {
    const now = new Date().toISOString();
    const evidence: MultimodalEvidenceRef = { id: evidenceId, kind: 'dom_snippet',
      uri: `urn:qap:crawler:${result.execution_id}:${evidenceId}`, pii_masked: true, captured_at: now,
      session_id: result.execution_id, metadata: { source: 'static_dom_structure', view: structuredClone(view) } };
    result.evidence.push(evidence);
    const base = { application_id: input.application_id, environment_id: input.environment.environment_id,
      observed_by: 'crawler' as const, observed_at: now, session_id: result.execution_id, evidence };
    result.observations.push({ ...base, id: randomUUID(), kind: 'navigation_route',
      raw_payload: { route: view.route, view_id: view.id, state: view.state } });
    // Port v1 accepts at most 100 writes. Two facts + one evidence per page => <=96,
    // keeping the entire run atomic even at the 32-page cap without changing the port.
    const structure: ApplicationObservation = { ...base, id: randomUUID(), kind: 'dom_element', selector: 'body',
      raw_payload: { view_id: view.id, controls: structuredClone(view.controls), forms: structuredClone(view.forms),
        menus: view.menus, headings: view.headings, truncated: view.truncated } };
    result.observations.push(structure);
  }

  private async persist(input: BlackBoxCrawlerInput, result: BlackBoxCrawlerResult, context: string): Promise<void> {
    if (await this.context(input) !== context) throw new BlackBoxCrawlerError('CONTEXT_CHANGED');
    const trace: KnowledgeTrace = { source: 'blackbox_crawler', recorded_by: 'crawler',
      recorded_at: new Date().toISOString(), reason: 'Authorized static DOM observation', review: 'unreviewed',
      environment_id: input.environment.environment_id, evidence_refs: [] };
    const writes: KnowledgeWrite[] = result.evidence.map(entity => ({ kind: 'evidence', entity, expected_revision: 0, trace }));
    for (const entity of result.observations) writes.push({ kind: 'observation', entity, expected_revision: 0,
      trace: { ...trace, evidence_refs: [{ kind: 'evidence', id: entity.evidence.id, revision: 1 }] } });
    try { await this.store.commit(input.application_id, writes); }
    catch { throw new BlackBoxCrawlerError('PERSISTENCE_FAILED'); }
  }
}
