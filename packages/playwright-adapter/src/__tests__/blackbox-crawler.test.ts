import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { createServer, type RequestListener, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { validateApplicationObservation } from '@qap/shared';
import { afterEach, describe, expect, it } from 'vitest';

import { SqliteKnowledgeAdapter } from '../../../knowledge/dist/index.js';
import { launchIsolated, startDenyProxy } from '../crawler/browser.js';
import { BlackBoxCrawler } from '../crawler/service.js';
import type { BlackBoxCrawlerInput } from '../crawler/types.js';

const servers: Server[] = [];
const stores: SqliteKnowledgeAdapter[] = [];
const directories: string[] = [];
const canary = 'CANARY_CRAWLER_d73b064_PRIVATE';
const timestamp = '2026-10-30T12:00:00.000Z';
const trace = { source: 'synthetic', recorded_by: 'test', recorded_at: timestamp,
  reason: 'Synthetic crawler fixture', review: 'unreviewed' as const, evidence_refs: [] };

afterEach(async () => {
  for (const server of servers.splice(0)) {
    server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve()));
  }
  stores.splice(0).forEach(store => store.close());
  directories.splice(0).forEach(path => rmSync(path, { recursive: true, force: true }));
});

async function fixture(handler?: RequestListener, physical = false) {
  const hits: Array<{ path: string; method: string; cookie?: string }> = [];
  const server = createServer((req, res) => {
    hits.push({ path: req.url ?? '', method: req.method ?? '', cookie: req.headers.cookie });
    expect(req.headers.authorization).toBeUndefined();
    res.setHeader('Content-Type', 'text/html');
    if (handler) handler(req, res);
    else {
      if (req.url === '/missing') { res.statusCode = 404; res.end('unavailable'); return; }
      res.end(`<html><body><h1>App</h1><nav><a href="/">Home</a><a href="/about">About</a>
        <a href="/contact">Contact</a><a href="/missing">Missing</a><a href="https://unauthorized.invalid/">External</a></nav>
        <form method="post" action="/write"><label>Email<input name="${canary}" type="email" value="${canary}" required></label>
        <input type="password" value="${canary}"><input type="hidden" value="${canary}">
        <select><option>${canary}</option></select><input type="checkbox"><input type="radio">
        <button>Send ${canary}</button><button type="button" disabled>Disabled</button></form>
        <div role="dialog">${canary}</div><div role="menu"><a href="/about">About</a></div>
        <input hidden><div role="${canary}"></div><div id="${canary}" data-testid="${canary}">${canary}</div>
        </body></html>`);
    }
  });
  servers.push(server);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  let directory: string | undefined;
  if (physical) { directory = mkdtempSync(join(tmpdir(), 'qap-crawler-')); directories.push(directory); }
  const path = directory ? join(directory, 'synthetic.sqlite') : ':memory:';
  const store = new SqliteKnowledgeAdapter(path); stores.push(store);
  const input: BlackBoxCrawlerInput = { application_id: 'crawler-a', environment: {
    application_id: 'crawler-a', environment_id: 'local', name: 'synthetic', base_url: origin,
    is_production: false, destructive_actions_allowed: false, safe_domains: ['127.0.0.1'] },
    target_url: `${origin}/`, authorization: { read_only_acknowledged: true,
      navigation_urls: ['/', '/about', '/contact', '/missing'].map(p => origin + p), allowed_ips: ['127.0.0.1'] } };
  await store.commit('crawler-a', [
    { kind: 'application', entity: { application_id: 'crawler-a', name: 'Synthetic', base_url: origin, created_at: timestamp }, expected_revision: 0, trace },
    { kind: 'environment', entity: input.environment, expected_revision: 0, trace },
  ]);
  return { input, store, server, origin, hits, directory, path, crawler: new BlackBoxCrawler(store, { browser: { channel: 'chrome' } }) };
}

describe('VNEXT-007 real Chromium static acquisition', () => {
  it('denies browser egress to loopback even with routing and offline emulation absent', async () => {
    const sink = await fixture(); let connections = 0;
    const proxy = await startDenyProxy(() => connections++);
    const browser = await launchIsolated(proxy.url, { channel: 'chrome' }, 5000);
    try {
      const context = await browser.newContext({ javaScriptEnabled: false, serviceWorkers: 'block' });
      const page = await context.newPage();
      await expect(page.goto(sink.origin, { timeout: 3000 })).rejects.toThrow();
      expect(connections).toBeGreaterThan(0); expect(sink.hits).toHaveLength(0);
    } finally { await browser.close(); await proxy.close(); }
  }, 15000);

  it('maps actual MPA visits, links, menus, forms and controls without reading values', async () => {
    const f = await fixture();
    const result = await f.crawler.run(f.input);
    expect(result.views).toHaveLength(3);
    expect(f.hits.map(h => h.path)).toEqual(['/', '/about', '/contact', '/missing']);
    expect(result.routes.filter(r => r.state === 'visited')).toHaveLength(3);
    expect(result.routes.find(r => r.authorized_index === 3)).toMatchObject({ state: 'unavailable', http_status: 404 });
    expect(result.routes.filter(r => r.state === 'blocked')).toHaveLength(1);
    const view = result.views[0];
    expect(view.menus).toBe(2); expect(view.forms).toHaveLength(1);
    expect(view.forms[0].submit_indices).toHaveLength(1);
    expect(view.controls.some(c => c.required_in_dom && c.input_type === 'email')).toBe(true);
    expect(view.controls.some(c => c.input_type === 'password')).toBe(true);
    expect(view.controls.some(c => c.role === 'dialog')).toBe(true);
    expect(view.controls.some(c => c.visibility === 'hidden')).toBe(true);
    expect(view.controls.some(c => c.disabled)).toBe(true);
    expect(view.links.filter(l => l.label === 'about')).toHaveLength(2);
    expect(result.status).toBe('partial');
    expect(result.observations.every(o => validateApplicationObservation(o).valid)).toBe(true);
    expect(result.observations.some(o => o.kind === 'dom_element')).toBe(true);
    expect(JSON.stringify(result)).not.toContain(canary);
    expect(result.cleanup).toEqual({ browser_closed: true, proxy_closed: true });
    expect(result.derived_entities_deferred).toBe(true);
  }, 30000);

  it('honestly records a client-side SPA shell and skeleton without claiming settled views', async () => {
    const f = await fixture((_req, res) => res.end(`<main><div id="skeleton" aria-busy="true">Loading</div>
      <a href="/items/42">Item</a><a href="/items/42">Duplicate</a><a href="/">Cycle</a>
      <script>history.pushState({}, '', '/client-only'); setTimeout(() => {
      document.querySelector('main').innerHTML = '<button>Async</button>'; }, 50);</script></main>`));
    f.input.authorization.navigation_urls = [f.origin + '/', f.origin + '/items/42'];
    const result = await f.crawler.run(f.input);
    expect(f.hits.map(h => h.path)).toEqual(['/', '/items/42']);
    expect(result.views).toHaveLength(2);
    expect(result.views.every(v => v.state === 'loading_or_script_dependent')).toBe(true);
    expect(result.views[0].controls.some(c => c.tag === 'button')).toBe(false);
    expect(result.status).toBe('partial'); expect(result.budget.retries).toBe(0);
    expect(result.warnings).toContain('STATIC_MODE_NO_APPLICATION_JAVASCRIPT');
  }, 30000);

  it('prevents script, iframe, popup, WebSocket, worker, mutation, internal and download traffic at the receiver', async () => {
    const sink = await fixture((_req, res) => res.end('forbidden'));
    const f = await fixture((_req, res) => {
      res.setHeader('Set-Cookie', `secret=${canary}`);
      res.end(`<html><head><link rel="dns-prefetch" href="${sink.origin}"><link rel="prefetch" href="${sink.origin}/prefetch">
        <meta http-equiv="refresh" content="0;url=${sink.origin}/refresh"></head><body>
        <iframe src="${sink.origin}/iframe"></iframe><iframe srcdoc="<img src='${sink.origin}/srcdoc'>"></iframe>
        <img src="${sink.origin}/image"><object data="${sink.origin}/object"></object>
        <a href="/file" download>Download</a><a href="/delete">Delete</a><form action="${sink.origin}/write" method="post"><button>Send</button></form>
        <script src="${sink.origin}/script"></script><script>
        fetch('${sink.origin}/post', {method:'POST'}); fetch('${sink.origin}/delete', {method:'DELETE'});
        fetch('http://169.254.169.254/latest/meta-data/'); new WebSocket('ws://127.0.0.1:${(sink.server.address() as { port: number }).port}/ws');
        navigator.serviceWorker.register('${sink.origin}/worker'); window.open('${sink.origin}/popup');
        location.href='${sink.origin}/external'; document.forms[0].submit();</script></body></html>`);
    });
    f.input.authorization.navigation_urls.push(f.origin + '/file', f.origin + '/delete');
    const first = await f.crawler.run(f.input);
    const second = await f.crawler.run(f.input);
    expect(sink.hits).toHaveLength(0);
    expect(f.hits.map(h => h.path)).toEqual(['/', '/']);
    expect(f.hits.every(h => h.method === 'GET' && !h.cookie)).toBe(true);
    expect(first.routes.filter(r => r.state === 'visited')).toHaveLength(1);
    expect(first.routes.filter(r => r.state === 'blocked')).toHaveLength(2);
    expect(first.cleanup).toEqual({ browser_closed: true, proxy_closed: true });
    expect(second.execution_id).not.toBe(first.execution_id);
    expect(JSON.stringify([first, second])).not.toContain(canary);
  }, 30000);

  it('manually validates redirects without ever passing a 3xx to Chromium', async () => {
    const sink = await fixture();
    const f = await fixture((req, res) => {
      if (req.url === '/') res.writeHead(302, { Location: '/about' }).end();
      else res.writeHead(302, { Location: sink.origin + '/' + canary }).end();
    });
    const result = await f.crawler.run(f.input);
    expect(sink.hits).toHaveLength(0);
    expect(f.hits.map(h => h.path)).toEqual(['/', '/about']);
    expect(result.views).toHaveLength(0);
    expect(result.relations).toHaveLength(1);
    expect(result.routes[0].state).toBe('redirected');
    expect(result.status).toBe('blocked');
    expect(JSON.stringify(result)).not.toContain(canary);
  }, 30000);

  it('renders an authorized redirect destination once and prevents redirect cycles', async () => {
    const f = await fixture((req, res) => {
      if (req.url === '/') res.writeHead(302, { Location: '/about' }).end();
      else res.end('<a href="/">Home</a><a href="/contact">Contact</a>');
    });
    const result = await f.crawler.run(f.input);
    expect(f.hits.map(h => h.path)).toEqual(['/', '/about', '/contact']);
    expect(result.views).toHaveLength(2);
    expect(result.relations.some(r => r.kind === 'http_redirect')).toBe(true);
    expect(result.status).toBe('completed');
    f.server.removeAllListeners('request');
    let requests = 0;
    f.server.on('request', (_req, res) => { requests++; res.writeHead(302, { Location: '/' }).end(); });
    const cycle = await f.crawler.run(f.input);
    expect(requests).toBe(1); expect(cycle.views).toHaveLength(0);
    expect(cycle.routes[0].reason).toBe('REDIRECT_LIMIT');
  }, 30000);

  it.each(['/logout', '/%64elete', '/%2572eset', '/safe?action=write'])('denies potentially state-changing GET %s even with exact scope', async path => {
    const f = await fixture(); f.input.target_url = f.origin + path;
    f.input.authorization.navigation_urls.push(f.input.target_url);
    const result = await f.crawler.run(f.input);
    expect(f.hits).toHaveLength(0); expect(result.status).toBe('blocked');
  }, 30000);

  it('blocks non-HTML and attachment downloads without browser download execution', async () => {
    const f = await fixture((_req, res) => { res.setHeader('Content-Disposition', `attachment; filename=${canary}`); res.end('data'); });
    const result = await f.crawler.run(f.input);
    expect(result.views).toHaveLength(0); expect(result.routes[0].reason).toBe('NON_HTML_OR_DOWNLOAD');
    expect(JSON.stringify(result)).not.toContain(canary);
  }, 30000);

  it('enforces the byte budget before retaining or rendering oversized HTML', async () => {
    const f = await fixture((_req, res) => res.end('<main>' + canary.repeat(100) + '</main>'));
    f.input.limits = { max_bytes: 200 };
    const result = await f.crawler.run(f.input);
    expect(result.routes[0].reason).toBe('BODY_LIMIT'); expect(result.views).toHaveLength(0);
    expect(result.budget.retained_bytes).toBe(0); expect(JSON.stringify(result)).not.toContain(canary);
    expect(result.cleanup.browser_closed).toBe(true);
  }, 30000);

  it('reports an unavailable browser honestly and closes its deny proxy', async () => {
    const f = await fixture();
    const crawler = new BlackBoxCrawler(f.store, { browser: { executable_path: join(tmpdir(), 'qap-no-such-browser.exe') } });
    const result = await crawler.run(f.input);
    expect(result.status).toBe('indeterminate'); expect(result.views).toHaveLength(0);
    expect(result.warnings).toContain('BROWSER_OR_PROXY_UNAVAILABLE'); expect(f.hits).toHaveLength(0);
    expect(result.cleanup).toEqual({ browser_closed: true, proxy_closed: true });
  });

  it('denies unauthorized loopback IP and mixed DNS before the target receives traffic', async () => {
    const f = await fixture(); f.input.authorization.allowed_ips = [];
    const result = await f.crawler.run(f.input);
    expect(result.status).toBe('blocked'); expect(f.hits).toHaveLength(0);
    f.input.authorization.allowed_ips = ['127.0.0.1'];
    f.input.environment.safe_domains = ['crawler.test'];
    f.input.target_url = f.input.target_url.replace('127.0.0.1', 'crawler.test');
    f.input.authorization.navigation_urls = [f.input.target_url];
    await f.store.commit('crawler-a', [{ kind: 'environment', entity: f.input.environment, expected_revision: 1, trace }]);
    const mixed = new BlackBoxCrawler(f.store, { browser: { channel: 'chrome' }, resolver: async () => [
      { address: '127.0.0.1', family: 4 }, { address: '169.254.169.254', family: 4 }] });
    expect((await mixed.run(f.input)).status).toBe('blocked'); expect(f.hits).toHaveLength(0);
  }, 30000);

  it('pins controlled hostname DNS per request and blocks a later rebinding answer before HTTP', async () => {
    const f = await fixture((_req, res) => res.end('<a href="/about">About</a>'));
    f.input.environment.safe_domains = ['crawler.test'];
    f.input.target_url = f.input.target_url.replace('127.0.0.1', 'crawler.test');
    f.input.authorization.navigation_urls = [f.input.target_url, f.input.target_url + 'about'];
    await f.store.commit('crawler-a', [{ kind: 'environment', entity: f.input.environment, expected_revision: 1, trace }]);
    let resolutions = 0;
    const crawler = new BlackBoxCrawler(f.store, { browser: { channel: 'chrome' }, resolver: async () => [
      { address: ++resolutions === 1 ? '127.0.0.1' : '169.254.169.254', family: 4 }] });
    const result = await crawler.run(f.input);
    expect(result.views).toHaveLength(1); expect(f.hits.map(h => h.path)).toEqual(['/']);
    expect(result.routes.find(r => r.authorized_index === 1)).toMatchObject({ state: 'blocked', reason: 'NETWORK_BLOCKED' });
    expect(resolutions).toBe(2);
  }, 30000);

  it('records forbidden schemes without persisting their payload', async () => {
    const f = await fixture((_req, res) => res.end(`<a href="javascript:alert('${canary}')">Action</a><a href="file:///secret">File</a>`));
    const result = await f.crawler.run(f.input);
    expect(result.routes.filter(r => r.reason === 'UNSAFE_OR_INVALID_URL')).toHaveLength(2);
    expect(result.views).toHaveLength(1); expect(JSON.stringify(result)).not.toContain(canary);
  }, 30000);

  it('commits a maximum 32-page run atomically within the unchanged v1 100-write limit', async () => {
    const f = await fixture((req, res) => {
      const index = Number(req.url?.slice(1) || '0');
      res.end(index < 31 ? `<a href="/${index + 1}">Next</a>` : '<button>End</button>');
    });
    f.input.authorization.navigation_urls = [f.origin + '/', ...Array.from({ length: 31 }, (_, i) => `${f.origin}/${i + 1}`)];
    f.input.limits = { max_pages: 32, max_depth: 10, max_requests: 32 };
    // A star topology keeps all pages at depth one, independently of URL ordering.
    f.server.removeAllListeners('request');
    f.server.on('request', (req, res) => {
      res.setHeader('Content-Type', 'text/html');
      res.end(req.url === '/' ? Array.from({ length: 31 }, (_, i) => `<a href="/${i + 1}">Next</a>`).join('') : '<button>End</button>');
    });
    const result = await f.crawler.run(f.input);
    expect(result.views).toHaveLength(32); expect(result.status).toBe('completed');
    expect((await f.store.query('crawler-a', 'evidence', { limit: 100 })).items).toHaveLength(32);
    expect((await f.store.query('crawler-a', 'observation', { limit: 100 })).items).toHaveLength(64);
  }, 30000);

  it.each([
    { max_pages: 1 }, { max_depth: 0 }, { max_requests: 1 }, { max_elements: 2 },
  ])('enforces bounded exploration %j', async limits => {
    const f = await fixture(); f.input.limits = limits;
    const result = await f.crawler.run(f.input);
    expect(result.status).toBe('partial');
    expect(result.budget.pages).toBeLessThanOrEqual(limits.max_pages ?? 10);
    expect(result.budget.requests).toBeLessThanOrEqual(limits.max_requests ?? 20);
    if (limits.max_depth === 0) expect(f.hits.map(h => h.path)).toEqual(['/']);
    if (limits.max_elements) expect(result.views[0].truncated).toBe(true);
    expect(result.cleanup).toEqual({ browser_closed: true, proxy_closed: true });
  }, 30000);

  it('bounds a stalled response by the route deadline without retry', async () => {
    const f = await fixture(() => undefined);
    f.input.limits = { navigation_timeout_ms: 1000, total_timeout_ms: 10000 };
    const result = await f.crawler.run(f.input);
    expect(result.routes[0].reason).toBe('TIMEOUT'); expect(f.hits).toHaveLength(1);
    expect(result.budget.elapsed_ms).toBeLessThan(10000); expect(result.budget.retries).toBe(0);
    expect(result.cleanup.browser_closed).toBe(true);
  }, 15000);

  it.each(['cancel', 'global'] as const)('interrupts active HTTP and closes resources: %s', async mode => {
    const controller = new AbortController();
    const f = await fixture(() => { if (mode === 'cancel') controller.abort(); });
    f.input.signal = controller.signal;
    f.input.limits = { total_timeout_ms: mode === 'global' ? 2000 : 10000, navigation_timeout_ms: 5000 };
    const result = await f.crawler.run(f.input);
    expect(result.warnings).toContain('CANCELLED_OR_DEADLINE');
    expect(result.budget.elapsed_ms).toBeLessThan(10000);
    expect(result.cleanup).toEqual({ browser_closed: true, proxy_closed: true });
    expect(f.hits.length).toBeLessThanOrEqual(1);
  }, 15000);

  it('handles pre-cancellation without starting HTTP or a browser', async () => {
    const f = await fixture(); const controller = new AbortController(); controller.abort();
    f.input.signal = controller.signal;
    const result = await f.crawler.run(f.input);
    expect(f.hits).toHaveLength(0); expect(result.status).toBe('indeterminate');
    expect(result.cleanup).toEqual({ browser_closed: true, proxy_closed: true });
  });

  it('redacts opaque paths and selectors, and does not confuse link presence with visitation', async () => {
    const f = await fixture((_req, res) => res.end(`<a href="/${canary}">${canary}</a>
      <${canary.toLowerCase()}><input name="${canary}" value="${canary}"></${canary.toLowerCase()}>
      <form action="/${canary}" id="${canary}"><input aria-label="${canary}"></form>`));
    f.input.authorization.navigation_urls.push(`${f.origin}/${canary}`);
    f.input.limits = { max_pages: 1 };
    const result = await f.crawler.run(f.input);
    expect(result.routes.find(r => r.authorized_index === 4)).toMatchObject({ state: 'candidate', reason: 'PAGE_LIMIT' });
    expect(result.views).toHaveLength(1); expect(JSON.stringify(result)).not.toContain(canary);
    expect(JSON.stringify(result).toLowerCase()).not.toContain(canary.toLowerCase());
    expect(result.routes[0].route).not.toBe(result.routes[1].route);
  }, 30000);

  it('round-trips physical SQLite, preserves history, pins evidence, isolates apps and excludes canaries', async () => {
    const f = await fixture(undefined, true); f.input.limits = { max_pages: 1 };
    await f.store.commit('crawler-b', [{ kind: 'application', entity: { application_id: 'crawler-b', name: 'Other',
      base_url: f.origin, created_at: timestamp }, expected_revision: 0, trace }]);
    const first = await f.crawler.run(f.input); const second = await f.crawler.run(f.input);
    const records = (await f.store.query('crawler-a', 'observation', { limit: 100 })).items;
    expect(records).toHaveLength(first.observations.length + second.observations.length);
    for (const record of records) {
      expect(validateApplicationObservation(record.entity).valid).toBe(true);
      expect(record.trace).toMatchObject({ source: 'blackbox_crawler', review: 'unreviewed', environment_id: 'local' });
      expect((await f.store.get('crawler-a', 'evidence', record.entity.evidence.id, 1))?.entity).toEqual(record.entity.evidence);
      expect(record.references).toContainEqual({ kind: 'evidence', id: record.entity.evidence.id, revision: 1 });
      expect((await f.store.history('crawler-a', 'observation', record.id)).items).toHaveLength(1);
      expect(await f.store.get('crawler-b', 'observation', record.id)).toBeNull();
    }
    for (const kind of ['inference', 'requirement', 'view', 'action_target'] as const) expect((await f.store.query('crawler-a', kind)).items).toHaveLength(0);
    f.store.close(); const reopened = new SqliteKnowledgeAdapter(f.path); stores.push(reopened);
    expect((await reopened.query('crawler-a', 'evidence')).items).toHaveLength(2);
    expect((await reopened.query('crawler-b', 'observation')).items).toHaveLength(0);
    for (const name of readdirSync(f.directory!)) expect(readFileSync(join(f.directory!, name)).includes(Buffer.from(canary))).toBe(false);
  }, 30000);

  it('rolls back evidence and observations atomically after an actual SQLite failure', async () => {
    const f = await fixture(undefined, true); f.input.limits = { max_pages: 1 };
    const db = new DatabaseSync(f.path);
    try {
      db.exec(`CREATE TRIGGER crawler_failure BEFORE INSERT ON knowledge_revisions
        WHEN NEW.kind = 'observation' BEGIN SELECT RAISE(ABORT, 'synthetic failure'); END`);
      await expect(f.crawler.run(f.input)).rejects.toMatchObject({ code: 'PERSISTENCE_FAILED' });
      expect((await f.store.query('crawler-a', 'evidence')).items).toHaveLength(0);
      expect((await f.store.query('crawler-a', 'observation')).items).toHaveLength(0);
      expect(db.prepare('PRAGMA integrity_check').get()?.integrity_check).toBe('ok');
      expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
      db.exec('DROP TRIGGER crawler_failure');
      expect((await f.crawler.run(f.input)).views).toHaveLength(1);
    } finally { db.close(); }
  }, 30000);

  it('rejects changed contextual revisions before persistence', async () => {
    const f = await fixture(); f.input.limits = { max_pages: 1 };
    let changed: Promise<unknown> | undefined;
    f.server.once('request', () => { changed = f.store.commit('crawler-a', [
      { kind: 'environment', entity: f.input.environment, expected_revision: 1, trace }]); });
    await expect(f.crawler.run(f.input)).rejects.toMatchObject({ code: 'CONTEXT_CHANGED' });
    await changed;
    expect((await f.store.query('crawler-a', 'evidence')).items).toHaveLength(0);
  }, 30000);

  it('rejects missing context and non-exact scope before network', async () => {
    const f = await fixture(); f.input.authorization.navigation_urls = [f.origin + '/*'];
    await expect(f.crawler.run(f.input)).rejects.toMatchObject({ code: 'INVALID_INPUT' });
    f.input.authorization.navigation_urls = [f.origin + '/']; f.input.environment.name = 'changed';
    await expect(f.crawler.run(f.input)).rejects.toMatchObject({ code: 'CONTEXT_REQUIRED' });
    expect(f.hits).toHaveLength(0);
  });
});
