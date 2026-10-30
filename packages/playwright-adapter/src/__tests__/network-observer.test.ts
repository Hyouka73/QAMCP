import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { createSocket } from 'node:dgram';
import { createServer, type RequestListener, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { validateApplicationObservation } from '@qap/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SqliteKnowledgeAdapter } from '../../../knowledge/dist/index.js';
import { launchIsolated, startDenyProxy } from '../crawler/browser.js';
import { NetworkTrafficObserver } from '../network-observer/service.js';
import type { NetworkObserverInput } from '../network-observer/types.js';

const servers: Server[] = [], stores: SqliteKnowledgeAdapter[] = [], directories: string[] = [];
const canary = 'CANARY_NETWORK_d73b064_PRIVATE';
const timestamp = '2026-10-30T12:00:00.000Z';
const trace = { source: 'synthetic', recorded_by: 'test', recorded_at: timestamp,
  reason: 'Synthetic network fixture', review: 'unreviewed' as const, evidence_refs: [] };

afterEach(async () => {
  vi.restoreAllMocks();
  for (const server of servers.splice(0)) {
    server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve()));
  }
  stores.splice(0).forEach(store => store.close());
  directories.splice(0).forEach(path => rmSync(path, { recursive: true, force: true }));
});

async function fixture(script = `fetch('/api/data').then(r=>r.json()).then(()=>{
  document.querySelector('main').innerHTML='<button>Dynamic</button>'; });`, handler?: RequestListener) {
  const hits: Array<{ path: string; method: string; cookie?: string; auth?: string; origin?: string }> = [];
  const server = createServer((req, res) => {
    hits.push({ path: req.url ?? '', method: req.method ?? '', cookie: req.headers.cookie,
      auth: req.headers.authorization, origin: req.headers.origin });
    res.setHeader('Set-Cookie', `secret=${canary}`); res.setHeader('X-Private', canary);
    if (req.url === '/') {
      res.setHeader('Content-Type', 'text/html');
      res.end(`<main aria-busy="true">Skeleton ${canary}</main><script src="/app.js"></script>`);
    } else if (req.url === '/app.js') {
      res.setHeader('Content-Type', 'application/javascript'); res.end(script);
    } else if (handler) handler(req, res);
    else { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ data: canary })); }
  });
  servers.push(server); await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  const directory = mkdtempSync(join(tmpdir(), 'qap-network-')); directories.push(directory);
  const path = join(directory, 'synthetic.sqlite'); const store = new SqliteKnowledgeAdapter(path); stores.push(store);
  const input: NetworkObserverInput = { application_id: 'network-a', environment: {
    application_id: 'network-a', environment_id: 'local', name: 'synthetic', base_url: origin,
    is_production: false, destructive_actions_allowed: false, safe_domains: ['127.0.0.1'] },
    target_url: origin + '/', isolation: 'fresh_anonymous_dynamic_readonly', authorization: {
      read_only_acknowledged: true, navigation_urls: [origin + '/'], script_urls: [origin + '/app.js'],
      presentation_urls: [], api_read_urls: [origin + '/api/data'], allowed_ips: ['127.0.0.1'],
      query_names: ['page'], structural_paths_acknowledged: true }, limits: { settle_ms: 700 } };
  await store.commit('network-a', [
    { kind: 'application', entity: { application_id: 'network-a', name: 'Synthetic', base_url: origin, created_at: timestamp }, expected_revision: 0, trace },
    { kind: 'environment', entity: input.environment, expected_revision: 0, trace },
  ]);
  return { input, store, server, origin, hits, directory, path,
    observer: new NetworkTrafficObserver(store, { browser: { channel: 'chrome' } }) };
}

describe('VNEXT-008 real Chromium and physical SQLite', () => {
  it('executes an authorized script, Fetch and a skeleton SPA DOM update; persists the actual 200', async () => {
    const f = await fixture(); const result = await f.observer.run(f.input);
    expect(f.hits.map(h => h.path)).toEqual(['/', '/app.js', '/api/data']);
    expect(f.hits.every(h => h.method === 'GET' && !h.auth && !h.cookie)).toBe(true);
    expect(result.view).toMatchObject({ dynamic_controls: 1, state: 'bounded_snapshot' });
    const event = result.events.find(e => e.request_type === 'fetch')!;
    expect(event).toMatchObject({ method: 'GET', http_status: 200, scope_status: 'authorized', outcome: 'responded', browser_outcome: 'finished' });
    expect(result.endpoints.find(e => e.reference === event.endpoint_ref)?.structural_pattern).toBe('/api/data');
    expect(result.batches.map(b => b.state)).toEqual(['committed']);
    const saved = await f.store.get('network-a', 'evidence', event.evidence_id, 1);
    expect(saved?.entity.metadata?.event).toEqual(event);
    expect(result.observations.every(o => validateApplicationObservation(o).valid)).toBe(true);
    expect(result.cleanup).toEqual({ browser_closed: true, proxy_closed: true });
    expect(result.inventory_complete).toBe(false);
  }, 20000);

  it('identifies real XMLHttpRequest and a non-200 response without diagnosing a defect', async () => {
    const f = await fixture(`const xhr=new XMLHttpRequest();xhr.open('GET','/api/data');xhr.send();`, (_req, res) => {
      res.writeHead(503, { 'Content-Type': 'application/json' }).end('{}');
    });
    const result = await f.observer.run(f.input);
    expect(f.hits.filter(h => h.path === '/api/data')).toHaveLength(1);
    expect(result.events.find(e => e.request_type === 'xhr')).toMatchObject({ method: 'GET', http_status: 503, outcome: 'responded' });
    expect(result.events.filter(e => e.request_type === 'fetch')).toHaveLength(0);
  }, 20000);

  it('blocks real automatic POST, DELETE, external/private Fetch, iframe, popup, worker, WebSocket and script egress', async () => {
    const sink = await fixture();
    let upgrades = 0; sink.server.on('upgrade', (_req, socket) => { upgrades++; socket.destroy(); });
    const f = await fixture(`
      fetch('/api/data',{method:'POST',body:'${canary}'}).catch(()=>{});
      fetch('/api/data',{method:'DELETE'}).catch(()=>{});
      fetch('${sink.origin}/forbidden').catch(()=>{});
      fetch('http://10.0.0.7/private').catch(()=>{});
      fetch('https://external.invalid/private').catch(()=>{});
      const iframe=document.createElement('iframe');iframe.src='${sink.origin}/iframe';document.body.append(iframe);
      const script=document.createElement('script');script.src='${sink.origin}/evil.js';document.body.append(script);
      navigator.serviceWorker.register('/worker.js').catch(()=>{});
      try {new Worker('/worker.js');}catch{}
      window.open('${sink.origin}/popup');
      new WebSocket('${sink.origin.replace('http:', 'ws:')}/ws');
      const a=document.createElement('a');a.href='${sink.origin}/download';a.download='file';a.click();
      const form=document.createElement('form');form.method='POST';form.action='${sink.origin}/form';document.body.append(form);form.submit();
      fetch('/api/data').then(()=>document.querySelector('main').innerHTML='<button>Executed</button>');`);
    const result = await f.observer.run(f.input);
    expect(result.view.dynamic_controls).toBe(1);
    expect(sink.hits).toHaveLength(0); expect(upgrades).toBe(0);
    expect(f.hits.map(h => h.path)).toEqual(['/', '/app.js', '/api/data']);
    for (const method of ['POST', 'DELETE']) {
      expect(result.events.find(e => e.method === method)).toMatchObject({ outcome: 'blocked', scope_status: 'denied', reason: 'METHOD_BLOCKED' });
    }
    expect(result.events.filter(e => e.outcome === 'blocked').every(e => e.http_status === undefined)).toBe(true);
    expect(result.warnings).toContain('WEBSOCKET_BLOCKED');
    expect(JSON.stringify(result)).not.toContain(canary);
  }, 20000);

  it('checks the deny proxy with real JavaScript and no request routing or offline mode', async () => {
    const sink = await fixture(); let connections = 0;
    const udp = createSocket('udp4'); let datagrams = 0;
    udp.on('message', () => datagrams++);
    await new Promise<void>(resolve => udp.bind(0, '127.0.0.1', resolve));
    const udpPort = udp.address().port;
    const proxy = await startDenyProxy(() => connections++);
    const browser = await launchIsolated(proxy.url, { channel: 'chrome' }, 5000);
    try {
      const context = await browser.newContext({ javaScriptEnabled: true, serviceWorkers: 'block' });
      const page = await context.newPage();
      await page.setContent(`<script>window.executed=true;
        window.done=fetch('${sink.origin}/escape').then(()=>false,()=>true);
        new WebSocket('${sink.origin.replace('http:', 'ws:')}/ws');
        window.peer=new RTCPeerConnection({iceServers:[{urls:'stun:127.0.0.1:${udpPort}'}]});
        window.peer.createDataChannel('egress');
        window.iceReady=window.peer.createOffer().then(o=>window.peer.setLocalDescription(o)).then(()=>true);</script>`);
      expect(await page.evaluate('window.executed')).toBe(true);
      expect(await page.evaluate('window.done')).toBe(true);
      expect(await page.evaluate('window.iceReady')).toBe(true);
      await page.waitForTimeout(600);
      await expect(page.goto(sink.origin, { timeout: 2000 })).rejects.toThrow();
      expect(connections).toBeGreaterThan(0); expect(sink.hits).toHaveLength(0);
      expect(datagrams).toBe(0);
    } finally { await browser.close(); await proxy.close(); udp.close(); }
  }, 15000);

  it('does not follow an out-of-scope redirect or deliver it to Chromium', async () => {
    const sink = await fixture();
    const f = await fixture(undefined, (_req, res) => res.writeHead(302, { Location: sink.origin + '/' + canary }).end());
    const result = await f.observer.run(f.input);
    expect(sink.hits).toHaveLength(0);
    expect(result.events.find(e => e.request_type === 'fetch')).toMatchObject({ http_status: 302, outcome: 'responded', reason: 'REDIRECT_NOT_FOLLOWED', browser_outcome: 'blocked' });
    expect(JSON.stringify(result)).not.toContain(canary);
  }, 20000);

  it('pins validated DNS per resource and blocks a later rebinding answer before contacting its target', async () => {
    const f = await fixture(); let resolutions = 0;
    const host = f.origin.replace('127.0.0.1', 'network.test');
    f.input.target_url = host + '/'; f.input.environment.safe_domains = ['network.test'];
    f.input.authorization.navigation_urls = [host + '/']; f.input.authorization.script_urls = [host + '/app.js'];
    f.input.authorization.api_read_urls = [host + '/api/data'];
    await f.store.commit('network-a', [{ kind: 'environment', entity: f.input.environment, expected_revision: 1, trace }]);
    const observer = new NetworkTrafficObserver(f.store, { browser: { channel: 'chrome' }, resolver: async () =>
      [{ address: ++resolutions <= 2 ? '127.0.0.1' : '169.254.169.254', family: 4 }] });
    const result = await observer.run(f.input);
    expect(f.hits.map(h => h.path)).toEqual(['/', '/app.js']); expect(resolutions).toBe(3);
    expect(result.events.find(e => e.request_type === 'fetch')).toMatchObject({ outcome: 'blocked', reason: 'NETWORK_BLOCKED' });
  }, 20000);

  it('preserves safe CORS semantics and does not forge credentials or allow-origin', async () => {
    const sink = await fixture(undefined, (_req, res) => res.writeHead(200,
      { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }).end('{}'));
    const f = await fixture(`fetch('${sink.origin}/cors').then(r=>r.json()).then(()=>{
      document.querySelector('main').innerHTML='<button>CORS</button>';});`);
    f.input.authorization.api_read_urls = [sink.origin + '/cors'];
    const result = await f.observer.run(f.input);
    expect(sink.hits.map(h => h.path)).toEqual(['/cors']); expect(result.view.dynamic_controls).toBe(1);
    expect(result.events.find(e => e.request_type === 'fetch')?.browser_outcome).toBe('finished');
  }, 20000);

  it('respects absent CORS permission despite an actual HTTP response', async () => {
    const sink = await fixture();
    const f = await fixture(`fetch('${sink.origin}/cors').then(()=>{
      document.querySelector('main').innerHTML='<button>Must not render</button>';}).catch(()=>{});`);
    f.input.authorization.api_read_urls = [sink.origin + '/cors'];
    const result = await f.observer.run(f.input);
    expect(sink.hits).toHaveLength(1); expect(result.view.dynamic_controls).toBe(0);
    expect(result.events.find(e => e.request_type === 'fetch')).toMatchObject({ http_status: 200, outcome: 'responded', browser_outcome: 'failed' });
  }, 20000);

  it('retains only allowed query names and multi-sample structural patterns; no canaries in DB/WAL/SHM or logs', async () => {
    const f = await fixture(`document.cookie='secret=${canary}';
      fetch('/api/orders/123?page=${canary}&private=${canary}',{headers:{'X-Private':'${canary}'}});
      fetch('/api/orders/456?page=${canary}');fetch('/api/items/789');
      fetch('/${canary}?${canary}=${canary}');fetch('/api/data?token=${canary}').catch(()=>{});
      console.log('${canary}'); setTimeout(()=>{throw new Error('${canary}');},10);`);
    f.input.authorization.api_read_urls = ['/api/orders/123?page=' + canary + '&private=' + canary,
      '/api/orders/456?page=' + canary, '/api/items/789', '/' + canary + '?' + canary + '=' + canary,
      '/api/data?token=' + canary].map(p => f.origin + p);
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const result = await f.observer.run(f.input);
    expect(result.endpoints.filter(e => e.structural_pattern === '/api/orders/{id}')).toHaveLength(2);
    expect(result.endpoints.some(e => e.structural_pattern === '/api/items/{id}')).toBe(false);
    expect(result.events.some(e => e.query_names.includes('page') && e.omitted_query_count === 1)).toBe(true);
    expect(f.hits.some(h => h.path.includes('token='))).toBe(false);
    expect(JSON.stringify(result)).not.toContain(canary);
    expect(JSON.stringify([log.mock.calls, error.mock.calls])).not.toContain(canary);
    for (const name of readdirSync(f.directory)) expect(readFileSync(join(f.directory, name)).includes(Buffer.from(canary))).toBe(false);
    expect(f.hits.every(h => !h.cookie && !h.auth)).toBe(true);
  }, 20000);

  it.each([{ max_requests: 2 }, { max_events: 2 }, { max_bytes: 100 }])('enforces cumulative budgets %j', async limits => {
    const f = await fixture(); f.input.limits = { ...f.input.limits, ...limits };
    const result = await f.observer.run(f.input);
    expect(result.budget.requests).toBeLessThanOrEqual(limits.max_requests ?? 32);
    expect(result.events.length).toBeLessThanOrEqual(limits.max_events ?? 100);
    expect(f.hits.some(h => h.path === '/api/data')).toBe(false);
    expect(result.budget.retries).toBe(0); expect(result.cleanup.browser_closed).toBe(true);
  }, 20000);

  it('records an attempted GET with no HTTP response as inconclusive and never retries it', async () => {
    const f = await fixture(undefined, req => req.socket.destroy());
    const result = await f.observer.run(f.input);
    expect(f.hits.filter(h => h.path === '/api/data')).toHaveLength(1);
    expect(result.events.find(e => e.request_type === 'fetch')).toMatchObject({ outcome: 'inconclusive', reason: 'NETWORK_FAILED' });
    expect(result.events.find(e => e.request_type === 'fetch')?.http_status).toBeUndefined();
  }, 20000);

  it('records an unsettled view and times out a stalled request without an invented status', async () => {
    const f = await fixture(undefined, () => undefined);
    f.input.limits = { settle_ms: 50, request_timeout_ms: 700, total_timeout_ms: 5000 };
    const result = await f.observer.run(f.input);
    expect(result.view.state).toBe('unsettled'); expect(result.warnings).toContain('UNSETTLED_AT_WINDOW_END');
    expect(result.events.find(e => e.request_type === 'fetch')).toMatchObject({ outcome: 'inconclusive', reason: 'TIMEOUT' });
    expect(result.budget.elapsed_ms).toBeLessThan(5000);
  }, 10000);

  it('reopens SQLite, preserves append-only history, pins evidence and isolates applications', async () => {
    const f = await fixture(); const first = await f.observer.run(f.input); const second = await f.observer.run(f.input);
    const records = (await f.store.query('network-a', 'observation', { limit: 100 })).items;
    expect(records).toHaveLength(first.events.length + second.events.length);
    expect(first.execution_id).not.toBe(second.execution_id);
    expect(first.events[0].endpoint_ref).not.toBe(second.events[0].endpoint_ref);
    for (const record of records) {
      expect(record.references).toContainEqual({ kind: 'evidence', id: record.entity.evidence.id, revision: 1 });
      expect((await f.store.history('network-a', 'observation', record.id)).items).toHaveLength(1);
      expect(await f.store.get('network-b', 'observation', record.id)).toBeNull();
      expect(record.trace.review).toBe('unreviewed');
    }
    for (const kind of ['inference', 'requirement', 'assessment'] as const) expect((await f.store.query('network-a', kind)).items).toHaveLength(0);
    f.store.close(); const reopened = new SqliteKnowledgeAdapter(f.path); stores.push(reopened);
    expect((await reopened.query('network-a', 'observation')).items).toHaveLength(records.length);
  }, 20000);

  it.each([false, true])('uses bounded 100-write batches and real rollback; fail second batch=%s', async fail => {
    const f = await fixture(`for(let i=0;i<110;i++)fetch('/api/data',{method:'POST'}).catch(()=>{});`);
    f.input.limits = { max_events: 128, settle_ms: 1000 };
    const db = new DatabaseSync(f.path);
    try {
      if (fail) db.exec(`CREATE TRIGGER network_failure BEFORE INSERT ON knowledge_revisions
        WHEN NEW.kind='observation' AND (SELECT count(*) FROM knowledge_revisions WHERE kind='observation')>=50
        BEGIN SELECT RAISE(ABORT,'${canary}'); END`);
      const result = await f.observer.run(f.input);
      expect(result.events).toHaveLength(112); expect(f.hits.map(h => h.path)).toEqual(['/', '/app.js']);
      expect(result.batches.map(b => b.event_ids.length)).toEqual([50, 50, 12]);
      expect(result.batches.map(b => b.state)).toEqual(fail ? ['committed', 'failed', 'not_attempted'] : ['committed', 'committed', 'committed']);
      const count = Number(db.prepare("SELECT count(*) AS n FROM knowledge_revisions WHERE kind='observation'").get()?.n);
      const evidenceCount = Number(db.prepare("SELECT count(*) AS n FROM knowledge_revisions WHERE kind='evidence'").get()?.n);
      expect(count).toBe(fail ? 50 : 112); expect(evidenceCount).toBe(count);
      expect(db.prepare('PRAGMA integrity_check').get()?.integrity_check).toBe('ok');
      expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
      expect(JSON.stringify(result)).not.toContain(canary);
    } finally { db.close(); }
  }, 20000);

  it('rejects contextual changes before committing the acquired events', async () => {
    const f = await fixture(); let changed: Promise<unknown> | undefined;
    f.server.once('request', () => { changed = f.store.commit('network-a', [
      { kind: 'environment', entity: f.input.environment, expected_revision: 1, trace }]); });
    const result = await f.observer.run(f.input); await changed;
    expect(result.warnings).toContain('CONTEXT_CHANGED'); expect(result.batches[0].state).toBe('not_attempted');
    expect((await f.store.query('network-a', 'evidence')).items).toHaveLength(0);
  }, 20000);

  it('requires explicit dynamic mode, categories, exact scope and unchanged context before network', async () => {
    const f = await fixture();
    await expect(f.observer.run({ ...f.input, isolation: undefined } as unknown as NetworkObserverInput)).rejects.toMatchObject({ code: 'INVALID_INPUT' });
    f.input.authorization.navigation_urls = [f.origin + '/*'];
    await expect(f.observer.run(f.input)).rejects.toMatchObject({ code: 'INVALID_INPUT' });
    f.input.authorization.navigation_urls = [f.origin + '/']; f.input.environment.name = 'changed';
    await expect(f.observer.run(f.input)).rejects.toMatchObject({ code: 'CONTEXT_REQUIRED' });
    expect(f.hits).toHaveLength(0);
  });

  it('does not treat same-origin permission as script or API path consent', async () => {
    const f = await fixture(`fetch('/api/unlisted').catch(()=>{});fetch('/api/data');`);
    const result = await f.observer.run(f.input);
    expect(f.hits.map(h => h.path)).toEqual(['/', '/app.js', '/api/data']);
    expect(result.events.some(e => e.reason === 'SCOPE_BLOCKED')).toBe(true);
    f.hits.splice(0); f.input.authorization.script_urls = [];
    const noScript = await f.observer.run(f.input);
    expect(f.hits.map(h => h.path)).toEqual(['/']); expect(noScript.view.dynamic_controls).toBe(0);
    expect(noScript.events.some(e => e.request_type === 'fetch')).toBe(false);
  }, 20000);

  it('does not grant credentialed CORS access from an anonymous wildcard response', async () => {
    const sink = await fixture(undefined, (_req, res) => res.writeHead(200,
      { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Credentials': 'true' }).end('{}'));
    const f = await fixture(`fetch('${sink.origin}/cors',{credentials:'include'}).then(()=>{
      document.querySelector('main').innerHTML='<button>Must not render</button>';}).catch(()=>{});`);
    f.input.authorization.api_read_urls = [sink.origin + '/cors'];
    const result = await f.observer.run(f.input);
    expect(sink.hits).toHaveLength(1); expect(sink.hits[0].origin).toBe(f.origin);
    expect(result.view.dynamic_controls).toBe(0);
    expect(result.events.find(e => e.request_type === 'fetch')?.browser_outcome).toBe('failed');
  }, 20000);

  it.each(['download', 'mime'] as const)('rejects unsafe response delivery: %s', async mode => {
    const f = await fixture(undefined, (_req, res) => {
      if (mode === 'download') res.setHeader('Content-Disposition', `attachment; filename="${canary}"`);
      res.writeHead(200, { 'Content-Type': mode === 'mime' ? 'text/html' : 'application/json' }).end('{}');
    });
    const result = await f.observer.run(f.input);
    expect(f.hits).toHaveLength(3);
    expect(result.events.find(e => e.request_type === 'fetch')).toMatchObject({ http_status: 200, outcome: 'responded',
      browser_outcome: 'blocked', reason: mode === 'download' ? 'DOWNLOAD_BLOCKED' : 'MIME_BLOCKED' });
    expect(result.view.dynamic_controls).toBe(0); expect(JSON.stringify(result)).not.toContain(canary);
  }, 20000);

  it('serializes real concurrent application requests and groups repeated endpoints', async () => {
    let active = 0, maximum = 0;
    const f = await fixture(`Promise.all(Array.from({length:5},()=>fetch('/api/data')));`, (_req, res) => {
      active++; maximum = Math.max(maximum, active);
      setTimeout(() => { active--; res.writeHead(200, { 'Content-Type': 'application/json' }).end('{}'); }, 30);
    });
    const result = await f.observer.run(f.input);
    expect(maximum).toBe(1); expect(f.hits.filter(h => h.path === '/api/data')).toHaveLength(5);
    const api = result.events.filter(e => e.request_type === 'fetch'); expect(api).toHaveLength(5);
    expect(new Set(api.map(e => e.endpoint_ref)).size).toBe(1);
    expect(result.endpoints.find(e => e.reference === api[0].endpoint_ref)?.event_ids).toHaveLength(5);
  }, 20000);

  it('rolls back the first batch completely on a physical SQLite error', async () => {
    const f = await fixture(); const db = new DatabaseSync(f.path);
    try {
      db.exec(`CREATE TRIGGER network_failure BEFORE INSERT ON knowledge_revisions WHEN NEW.kind='observation'
        BEGIN SELECT RAISE(ABORT,'${canary}'); END`);
      const result = await f.observer.run(f.input); expect(result.batches[0].state).toBe('failed');
      expect((await f.store.query('network-a', 'evidence')).items).toHaveLength(0);
      expect((await f.store.query('network-a', 'observation')).items).toHaveLength(0);
      expect(JSON.stringify(result)).not.toContain(canary);
      db.exec('DROP TRIGGER network_failure');
      expect((await f.observer.run(f.input)).batches[0].state).toBe('committed');
    } finally { db.close(); }
  }, 20000);

  it.each(['pre', 'active', 'deadline'] as const)('closes resources on cancellation/deadline: %s', async mode => {
    const f = await fixture(undefined, () => undefined); const controller = new AbortController();
    f.input.signal = controller.signal; f.input.limits = { total_timeout_ms: 2000, settle_ms: 3000 };
    if (mode === 'pre') controller.abort();
    if (mode === 'active') f.server.once('request', () => controller.abort());
    const result = await f.observer.run(f.input);
    expect(result.warnings).toContain('DEADLINE_OR_CANCELLED');
    expect(result.cleanup).toEqual({ browser_closed: true, proxy_closed: true });
    expect(result.budget.elapsed_ms).toBeLessThan(6000);
    if (mode === 'pre') expect(f.hits).toHaveLength(0);
  }, 10000);
});
