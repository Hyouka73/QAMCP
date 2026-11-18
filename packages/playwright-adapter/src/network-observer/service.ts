import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { isDeepStrictEqual } from 'node:util';

import type { IKnowledgeStore, KnowledgeTrace, KnowledgeWrite } from '@qap/engine';
import type { Browser, BrowserContext, Page, Request, Route } from 'playwright-core';

import { launchIsolated, startDenyProxy } from '../crawler/browser.js';
import type { CrawlerDependencies } from '../crawler/types.js';
import { parseUrl, ReconScope } from '../reconnaissance/network.js';
import { acquire } from '../reconnaissance/transport.js';
import { ReconnaissanceError, type ReconLimits, type ReconnaissanceInput } from '../reconnaissance/types.js';

import { privateReferences, queryMetadata, queryVocabulary, structuralPatterns } from './privacy.js';
import { NetworkObserverError, type NetworkObserverInput, type NetworkObserverLimits,
  type NetworkObserverResult, type ObservedNetworkEvent } from './types.js';

const defaults: NetworkObserverLimits = { max_events: 100, max_requests: 32, max_bytes: 524288,
  total_timeout_ms: 15000, request_timeout_ms: 3000, settle_ms: 500 };
const caps: NetworkObserverLimits = { max_events: 128, max_requests: 128, max_bytes: 1048576,
  total_timeout_ms: 60000, request_timeout_ms: 10000, settle_ms: 3000 };
const methods = new Set(['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'CONNECT', 'TRACE']);

/** Passive single-view observer. Only Node's pinned transport acquires application bytes. */
export class NetworkTrafficObserver {
  constructor(private readonly store: IKnowledgeStore, private readonly dependencies: CrawlerDependencies = {}) {}

  /** Extension point only after acquisition is quiescent and permanently revoked.
   * The deny proxy remains in place; offline mode adds a second browser barrier.
   * No in-flight Node transport may overlap this phase. */
  protected inspectSealedPage(_page: Page, _signal: AbortSignal): Promise<void> { void _page; void _signal; return Promise.resolve(); }

  /** Native requestSubmit needs this sandbox capability. form-action remains 'none'. */
  protected get nativeFormValidation(): boolean { return false; }

  /** Active probes persist their own canonical provenance in a single atomic batch. */
  protected get recordNetworkObservations(): boolean { return true; }

  async run(request: NetworkObserverInput): Promise<NetworkObserverResult> {
    let input: NetworkObserverInput, target: URL, scope: ReconScope, recon: ReconnaissanceInput;
    let navigation: Set<string>, scripts: Set<string>, presentation: Set<string>, api: Set<string>;
    let limits: NetworkObserverLimits;
    try {
      input = structuredClone({ ...request, signal: undefined });
      if (input.isolation !== 'fresh_anonymous_dynamic_readonly' || input.authorization.read_only_acknowledged !== true ||
        input.application_id !== input.environment.application_id ||
        !/^[\w.:-]{1,128}$/.test(input.application_id) || !/^[\w.:-]{1,128}$/.test(input.environment.environment_id) ||
        (input.tls_ca !== undefined && (typeof input.tls_ca !== 'string' || input.tls_ca.length > 65536))) throw new NetworkObserverError('INVALID_INPUT');
      if (input.limits && Object.keys(input.limits).some(k => !Object.hasOwn(defaults, k))) throw new NetworkObserverError('INVALID_INPUT');
      limits = { ...defaults, ...input.limits };
      for (const key of Object.keys(caps) as Array<keyof NetworkObserverLimits>) {
        if (!Number.isSafeInteger(limits[key]) || limits[key] < 1 || limits[key] > caps[key]) throw new NetworkObserverError('INVALID_INPUT');
      }
      const pacing = input.environment.rate_limit_ms ?? 0;
      if (!Number.isSafeInteger(pacing) || pacing < 0 || pacing > 60000) throw new NetworkObserverError('INVALID_INPUT');
      if ((input.authorization.query_names?.length ?? 0) > 5 ||
        input.authorization.query_names?.some(n => !queryVocabulary.has(n))) throw new NetworkObserverError('INVALID_INPUT');
      target = parseUrl(input.target_url);
      const category = (values: string[]) => {
        if (!Array.isArray(values) || values.length > 32) throw new NetworkObserverError('INVALID_INPUT');
        return new Set(values.map(value => parseUrl(value).href));
      };
      navigation = category(input.authorization.navigation_urls); scripts = category(input.authorization.script_urls);
      presentation = category(input.authorization.presentation_urls); api = category(input.authorization.api_read_urls);
      const urls = [...new Set([...navigation, ...scripts, ...presentation, ...api])];
      if (urls.length > 32 || !navigation.has(target.href) ||
        [...navigation, ...scripts, ...presentation].some(u => parseUrl(u).origin !== target.origin)) throw new NetworkObserverError('INVALID_INPUT');
      recon = { application_id: input.application_id, environment: input.environment, target_url: target.href,
        authorization: { allowed_urls: urls, allowed_ips: input.authorization.allowed_ips,
          allow_public_network: input.authorization.allow_public_network }, tls_ca: input.tls_ca };
      scope = new ReconScope(recon, this.dependencies.resolver);
      for (const value of urls) scope.authorize(parseUrl(value));
    } catch { throw new NetworkObserverError('INVALID_INPUT'); }
    const originalContext = await this.context(input);
    const started = Date.now(), reference = privateReferences();
    const signal = AbortSignal.any([AbortSignal.timeout(limits.total_timeout_ms), ...(request.signal ? [request.signal] : [])]);
    const result: NetworkObserverResult = { execution_id: randomUUID(), mode: input.isolation, status: 'indeterminate',
      inventory_complete: false, view: { id: randomUUID(), route_ref: reference(target.href), state: 'unavailable', dynamic_controls: 0 },
      events: [], endpoints: [], observations: [], evidence: [], batches: [], limits,
      warnings: ['BOUNDED_PASSIVE_WINDOW_NOT_EXHAUSTIVE', 'NO_OS_PROCESS_SANDBOX_CERTIFICATION',
        'OPAQUE_REFERENCES_PER_EXECUTION', 'ENGINE_PRENETWORK_DENIALS_MAY_HAVE_NO_REQUEST_EVENT'],
      budget: { requests: 0, received_bytes: 0, decoded_bytes: 0, retained_bytes: 0, elapsed_ms: 0,
        concurrency: 1, retries: 0, denied_requests: 0, dropped_events: 0, deny_proxy_connections: 0 },
      cleanup: { browser_closed: true, proxy_closed: true } };
    const transportLimits: ReconLimits = { max_requests: limits.max_requests, max_received_bytes: limits.max_bytes,
      max_decoded_bytes: limits.max_bytes, max_retained_bytes: limits.max_bytes, max_redirects: 0,
      request_timeout_ms: limits.request_timeout_ms, total_timeout_ms: limits.total_timeout_ms };
    const events = new Map<Request, ObservedNetworkEvent>();
    const samples: Array<{ url: URL; event: ObservedNetworkEvent }> = [];
    const pending = new Set<Promise<void>>();
    let browser: Browser | undefined, context: BrowserContext | undefined;
    let proxy: Awaited<ReturnType<typeof startDenyProxy>> | undefined;
    let queue = Promise.resolve(), closed = false, initialUsed = false;
    const abort = () => { closed = true; if (context) void context.close().catch(() => undefined); };
    const warn = (value: string) => { if (!result.warnings.includes(value)) result.warnings.push(value); };
    const capture = (req: Request): ObservedNetworkEvent | undefined => {
      const existing = events.get(req); if (existing) return existing;
      if (result.events.length >= limits.max_events) { result.budget.dropped_events++; warn('EVENT_LIMIT'); return; }
      let url: URL | undefined; try { url = parseUrl(req.url()); } catch { /* opaque invalid destination */ }
      const type = req.resourceType();
      const event: ObservedNetworkEvent = { id: randomUUID(), execution_id: result.execution_id, view_id: result.view.id,
        request_type: type === 'fetch' || type === 'xhr' ? type : 'other',
        method: methods.has(req.method()) ? req.method() : 'OTHER',
        endpoint_ref: reference(`${req.method()}|${url ? url.origin + url.pathname : req.url()}`),
        scope_status: 'undetermined', outcome: 'inconclusive', browser_outcome: 'undetermined',
        observed_at: new Date().toISOString(), duration_ms: 0, evidence_id: randomUUID(),
        ...(url ? queryMetadata(url, input.authorization.query_names ?? []) : { query_names: [], omitted_query_count: 0 }) };
      result.events.push(event); events.set(req, event);
      if (url) samples.push({ url, event });
      return event;
    };
    try {
      if (signal.aborted) throw new NetworkObserverError('INVALID_INPUT');
      proxy = await startDenyProxy(() => result.budget.deny_proxy_connections++); result.cleanup.proxy_closed = false;
      browser = await launchIsolated(proxy.url, this.dependencies.browser, Math.min(5000, limits.total_timeout_ms));
      result.cleanup.browser_closed = false;
      context = await browser.newContext({ javaScriptEnabled: true, serviceWorkers: 'block', acceptDownloads: false,
        permissions: [], ignoreHTTPSErrors: false });
      signal.addEventListener('abort', abort, { once: true }); if (signal.aborted) throw new NetworkObserverError('INVALID_INPUT');
      await context.routeWebSocket('**/*', socket => { result.budget.denied_requests++; warn('WEBSOCKET_BLOCKED'); void socket.close(); });
      const page = await context.newPage();
      context.on('page', extra => { if (extra !== page) { warn('POPUP_BLOCKED'); void extra.close().catch(() => undefined); } });
      page.on('download', download => { warn('DOWNLOAD_BLOCKED'); void download.cancel().catch(() => undefined); });
      page.on('request', capture);
      page.on('requestfinished', req => { const e = events.get(req); if (e) e.browser_outcome = 'finished'; });
      page.on('requestfailed', req => { const e = capture(req); if (e && e.browser_outcome !== 'blocked') e.browser_outcome = 'failed'; });
      const gateway = async (route: Route, event: ObservedNetworkEvent) => {
        const req = route.request(), began = Date.now();
        const deny = async (reason: string) => {
          event.reason = reason; event.outcome = event.http_status === undefined ? 'blocked' : 'responded';
          event.browser_outcome = 'blocked'; result.budget.denied_requests++;
          await route.abort('blockedbyclient').catch(() => undefined);
        };
        try {
          if (closed || signal.aborted) { await deny('DEADLINE_OR_CLOSED'); return; }
          const url = parseUrl(req.url());
          if (req.method() !== 'GET') { event.scope_status = 'denied'; await deny('METHOD_BLOCKED'); return; }
          if ([...url.searchParams.keys()].some(k => /token|secret|password|auth|cookie|key|session|credential/i.test(k))) {
            event.scope_status = 'denied'; await deny('SENSITIVE_URL_BLOCKED'); return;
          }
          scope.authorize(url);
          if (req.frame() !== page.mainFrame()) { event.scope_status = 'denied'; await deny('FRAME_BLOCKED'); return; }
          const type = req.resourceType();
          const isDocument = type === 'document' && req.isNavigationRequest() && req.frame() === page.mainFrame() &&
            !initialUsed && url.href === target.href && navigation.has(url.href);
          const allowed = isDocument || (type === 'script' && scripts.has(url.href)) ||
            (type === 'stylesheet' && presentation.has(url.href)) || (['fetch', 'xhr'].includes(type) && api.has(url.href));
          if (!allowed) { event.scope_status = 'denied'; await deny('RESOURCE_CATEGORY_BLOCKED'); return; }
          if (isDocument) initialUsed = true;
          event.scope_status = 'authorized';
          if (result.budget.requests && input.environment.rate_limit_ms) await delay(input.environment.rate_limit_ms, undefined, { signal });
          const before = result.budget.requests;
          let response;
          try { response = await acquire(url, scope, recon, transportLimits, result.budget, signal,
            url.origin === target.origin ? undefined : target.origin); }
          catch (error) {
            const reason = error instanceof ReconnaissanceError ? error.code : 'NETWORK_FAILED';
            if (result.budget.requests === before) { await deny(reason); return; }
            event.reason = reason; event.outcome = 'inconclusive';
            await route.abort('failed').catch(() => undefined); return;
          }
          event.http_status = response.status; event.outcome = 'responded';
          if (response.issue) { await deny(response.issue); return; }
          // No browser redirects, cookies, credentials, encodings, lengths or arbitrary headers.
          if (response.status >= 300 && response.status < 400) { await deny('REDIRECT_NOT_FOLLOWED'); return; }
          if (response.headers['content-disposition']) { await deny('DOWNLOAD_BLOCKED'); return; }
          const mime = response.headers['content-type'] ?? '';
          const expected = isDocument ? /^text\/html(?:;|$)/i : type === 'script' ? /^(?:text|application)\/javascript(?:;|$)/i
            : type === 'stylesheet' ? /^text\/css(?:;|$)/i : /^(?:application\/(?:json|[\w.+-]+\+json)|text\/plain)(?:;|$)/i;
          if (!expected.test(mime)) { await deny('MIME_BLOCKED'); return; }
          const headers: Record<string, string> = { 'content-type': mime, 'cache-control': 'no-store',
            'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer' };
          const cors = response.headers['access-control-allow-origin'];
          // Playwright otherwise invents ACAO + credentials for cross-origin fulfill.
          // An explicit nonmatching value preserves denial; never forward credential permission.
          headers['access-control-allow-origin'] = cors === '*' || cors === target.origin ? cors : 'null';
          if (isDocument) {
            const csp = `sandbox allow-scripts allow-same-origin${this.nativeFormValidation ? ' allow-forms' : ''}; default-src 'none'; script-src ${[...scripts].join(' ') || "'none'"}; ` +
              `style-src ${[...presentation].join(' ') || "'none'"}; connect-src http: https: ws: wss:; ` +
              "worker-src 'none'; frame-src 'none'; object-src 'none'; form-action 'none'; base-uri 'none'";
            const originalCsp = response.headers['content-security-policy'];
            headers['content-security-policy'] = originalCsp ?
              `${Array.isArray(originalCsp) ? originalCsp.join(', ') : originalCsp}, ${csp}` : csp;
            headers['permissions-policy'] = 'camera=(), microphone=(), geolocation=(), payment=(), usb=()';
          }
          await route.fulfill({ status: response.status, body: response.body, headers });
        } catch (error) {
          event.scope_status = event.scope_status === 'authorized' ? 'authorized' : 'denied';
          await deny(error instanceof ReconnaissanceError ? error.code : 'GATEWAY_FAILED');
        } finally { event.duration_ms = Date.now() - began; }
      };
      await context.route('**/*', route => {
        const event = capture(route.request());
        if (!event || closed || signal.aborted) {
          result.budget.denied_requests++;
          if (event) { event.reason = 'GATEWAY_SEALED_OR_CANCELLED'; event.outcome = 'blocked'; event.browser_outcome = 'blocked'; }
          return route.abort('blockedbyclient').catch(() => undefined);
        }
        // Bounded FIFO: every accepted request consumes an event slot; only one transport at a time.
        const task = queue.then(() => gateway(route, event));
        queue = task.catch(() => undefined); pending.add(task); void task.finally(() => pending.delete(task)).catch(() => undefined);
        return task;
      });
      await page.goto(target.href, { waitUntil: 'domcontentloaded', timeout: limits.request_timeout_ms });
      await delay(limits.settle_ms, undefined, { signal });
      result.view.state = pending.size ? 'unsettled' : 'bounded_snapshot';
      if (pending.size) warn('UNSETTLED_AT_WINDOW_END');
      // Structural count only: no HTML, values, IDs, text, errors or screenshots leave the page.
      result.view.dynamic_controls = Math.min(500, await page.locator('button,input,select,textarea').count());
      closed = true;
      await context.setOffline(true);
      if (!pending.size && result.view.state === 'bounded_snapshot' && !signal.aborted) {
        await this.inspectSealedPage(page, signal);
      }
    } catch { warn(signal.aborted ? 'DEADLINE_OR_CANCELLED' : 'NAVIGATION_OR_BROWSER_FAILED'); }
    finally {
      closed = true; signal.removeEventListener('abort', abort);
      try { if (context) await context.close(); } catch { /* browser close below */ }
      try { if (browser) await browser.close(); result.cleanup.browser_closed = true; } catch { result.cleanup.browser_closed = false; }
      await Promise.allSettled([...pending]);
      try { if (proxy) await proxy.close(); result.cleanup.proxy_closed = true; } catch { result.cleanup.proxy_closed = false; }
    }
    if (!result.cleanup.browser_closed || !result.cleanup.proxy_closed) throw new NetworkObserverError('CLEANUP_FAILED');
    for (const event of result.events) {
      let endpoint = result.endpoints.find(e => e.reference === event.endpoint_ref);
      if (!endpoint) { endpoint = { reference: event.endpoint_ref, method: event.method, event_ids: [], view_ids: [event.view_id], states: [] }; result.endpoints.push(endpoint); }
      endpoint.event_ids.push(event.id); if (!endpoint.states.includes(event.outcome)) endpoint.states.push(event.outcome);
    }
    if (input.authorization.structural_paths_acknowledged === true) structuralPatterns(result.endpoints, samples);
    if (this.recordNetworkObservations) {
      this.observations(input, result);
      await this.persist(input, result, originalContext);
    }
    result.status = result.events.length ? 'partial' : 'indeterminate'; result.budget.elapsed_ms = Date.now() - started;
    return result;
  }

  private async context(input: NetworkObserverInput): Promise<string> {
    try {
      const app = await this.store.get(input.application_id, 'application', input.application_id);
      const env = await this.store.get(input.application_id, 'environment', input.environment.environment_id);
      if (!app || !env || !isDeepStrictEqual(env.entity, input.environment)) throw new NetworkObserverError('INVALID_INPUT');
      return `${app.revision}:${env.revision}`;
    } catch { throw new NetworkObserverError('CONTEXT_REQUIRED'); }
  }

  private observations(input: NetworkObserverInput, result: NetworkObserverResult) {
    for (const event of result.events) {
      const endpoint = result.endpoints.find(e => e.reference === event.endpoint_ref)!;
      const evidence = { id: event.evidence_id, kind: 'http_recon_metadata' as const, pii_masked: true,
        uri: `urn:qap:network-event:${result.execution_id}:${event.id}`, captured_at: event.observed_at,
        session_id: result.execution_id, metadata: { source: 'browser_network_gateway', event: structuredClone(event),
          endpoint: structuredClone(endpoint) } };
      result.evidence.push(evidence);
      result.observations.push({ id: randomUUID(), application_id: input.application_id, environment_id: input.environment.environment_id,
        kind: 'network_traffic', observed_by: 'crawler', observed_at: event.observed_at, session_id: result.execution_id,
        evidence, raw_payload: structuredClone(event) });
    }
  }

  private async persist(input: NetworkObserverInput, result: NetworkObserverResult, original: string) {
    // 50 event/evidence pairs = 100 writes. Earlier batches survive a later failure.
    for (let start = 0; start < result.events.length; start += 50) {
      const group = result.events.slice(start, start + 50);
      result.batches.push({ index: result.batches.length, event_ids: group.map(e => e.id), state: 'not_attempted' });
    }
    for (const batch of result.batches) {
      try {
        if (await this.context(input) !== original) { result.warnings.push('CONTEXT_CHANGED'); break; }
        const trace: KnowledgeTrace = { source: 'network_traffic_observer', recorded_by: 'crawler',
          recorded_at: new Date().toISOString(), reason: 'Passive authorized browser traffic metadata', review: 'unreviewed',
          environment_id: input.environment.environment_id, evidence_refs: [] };
        const writes: KnowledgeWrite[] = [];
        for (const id of batch.event_ids) {
          const event = result.events.find(e => e.id === id)!;
          const evidence = result.evidence.find(e => e.id === event.evidence_id)!;
          const observation = result.observations.find(o => o.evidence.id === evidence.id)!;
          writes.push({ kind: 'evidence', entity: evidence, expected_revision: 0, trace },
            { kind: 'observation', entity: observation, expected_revision: 0,
              trace: { ...trace, evidence_refs: [{ kind: 'evidence', id: evidence.id, revision: 1 }] } });
        }
        await this.store.commit(input.application_id, writes); batch.state = 'committed';
      } catch { batch.state = 'failed'; result.warnings.push('PERSISTENCE_BATCH_FAILED'); break; }
    }
  }
}
