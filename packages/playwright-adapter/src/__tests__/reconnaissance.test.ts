import { readFileSync } from 'node:fs';
import { createServer, type RequestListener, type Server } from 'node:http';
import { createServer as createHttpsServer } from 'node:https';
import { gzipSync } from 'node:zlib';

import { validateApplicationObservation } from '@qap/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SqliteKnowledgeAdapter } from '../../../knowledge/dist/index.js';
import { canonicalIp } from '../reconnaissance/network.js';
import { ReconnaissanceService } from '../reconnaissance/service.js';
import type { ReconnaissanceInput, ReconResolver } from '../reconnaissance/types.js';

const cert = readFileSync(new URL('../../test/fixtures/recon-tls/test-only.pem', import.meta.url), 'utf8');
const key = readFileSync(new URL('../../test/fixtures/recon-tls/test-only.key', import.meta.url), 'utf8');
const servers: Server[] = [];
const stores: SqliteKnowledgeAdapter[] = [];
const canary = 'CANARY_PRIVATE_4f76ae';
const timestamp = '2026-10-28T12:00:00.000Z';

afterEach(async () => {
  for (const server of servers.splice(0)) {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
  stores.splice(0).forEach(store => store.close());
});

async function fixture(handler: RequestListener = (_req, res) => res.end('ok'), secure = false) {
  let hits = 0;
  const paths: string[] = [];
  const server = secure ? createHttpsServer({ key, cert }, handler) : createServer(handler);
  server.on('request', req => { hits++; paths.push(req.url ?? ''); });
  servers.push(server);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as { port: number }).port;
  const origin = `${secure ? 'https://recon.test' : 'http://127.0.0.1'}:${port}`;
  const input: ReconnaissanceInput = { application_id: 'test-app',
    environment: { application_id: 'test-app', environment_id: 'local-test', name: 'test', base_url: origin,
      is_production: false, destructive_actions_allowed: false, safe_domains: [secure ? 'recon.test' : '127.0.0.1'] },
    target_url: `${origin}/`, authorization: { allowed_urls: [`${origin}/`, `${origin}/robots.txt`, `${origin}/sitemap.xml`],
      allowed_ips: ['127.0.0.1'] }, ...(secure ? { tls_ca: cert } : {}) };
  const store = new SqliteKnowledgeAdapter(':memory:'); stores.push(store);
  const trace = { source: 'test', recorded_by: 'test', recorded_at: timestamp, reason: 'Synthetic context',
    review: 'unreviewed' as const, evidence_refs: [] };
  await store.commit(input.application_id, [
    { kind: 'application', entity: { application_id: input.application_id, name: 'Synthetic', base_url: origin,
      created_at: timestamp }, expected_revision: 0, trace },
    { kind: 'environment', entity: input.environment, expected_revision: 0, trace },
  ]);
  const resolver: ReconResolver = async () => [{ address: '127.0.0.1', family: 4 }];
  return { server, store, input, origin, port, paths, hits: () => hits,
    service: new ReconnaissanceService(store, resolver) };
}

describe('VNEXT-006 real HTTP acquisition without a browser', () => {
  it('selects safe HTTP fields, reads only standard resources, emits valid facts and heuristic candidates', async () => {
    const f = await fixture((req, res) => {
      if (req.url === '/robots.txt') {
        res.setHeader('Content-Type', 'text/plain');
        res.end(`User-agent: *\nDisallow: /${canary}\nAllow: /\nSitemap: https://external.invalid/${canary}`); return;
      }
      if (req.url === '/sitemap.xml') {
        res.setHeader('Content-Type', 'application/xml');
        res.end(`<sitemapindex><sitemap><loc>https://external.invalid/${canary}</loc></sitemap></sitemapindex>`); return;
      }
      expect(req.headers.authorization).toBeUndefined();
      expect(req.headers.cookie).toBeUndefined();
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
      res.setHeader('Content-Security-Policy', `default-src 'self'; script-src 'nonce-${canary}'`);
      res.setHeader('X-Frame-Options', 'DENY'); res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Referrer-Policy', 'no-referrer'); res.setHeader('Permissions-Policy', 'camera=()');
      res.setHeader('Access-Control-Allow-Origin', `https://${canary}.invalid`);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Set-Cookie', [`private=${canary}; Secure; HttpOnly; SameSite=Lax`, `other=${canary}`]);
      res.setHeader('X-Powered-By', 'Next.js'); res.setHeader('Server', `nginx/${canary}`);
      res.setHeader('X-Private', canary);
      res.end(`<html><script src="/_next/static/${canary}.js"></script><script id="__NEXT_DATA__">${canary}</script>${canary}</html>`);
    });
    const result = await f.service.run(f.input);
    expect(result.status).toBe('completed');
    expect(f.paths).toEqual(['/', '/robots.txt', '/sitemap.xml']);
    expect(result.resources[0].http).toMatchObject({ status: 200, cors: 'scoped',
      cookies: { count: 2, secure: 1, http_only: 1, same_site: 1 },
      hsts: { max_age: 31536000, include_subdomains: true, preload: true },
      csp_directives: ['default-src', 'script-src'], frame_options: 'deny', nosniff: true });
    expect(Object.values(result.resources[0].http!.security_headers).every(Boolean)).toBe(true);
    expect(result.resources[1].discovery).toEqual({ format: 'robots', allow_rules: 1, disallow_rules: 1, sitemap_hints: 1 });
    expect(result.resources[2].discovery).toEqual({ format: 'sitemap', locations: 1, nested_sitemaps: 1 });
    expect(result.technologies.candidates).toContainEqual({ name: 'Next.js', status: 'candidate',
      strength: 'strong', signal_ids: ['powered_next', 'resource_next', 'metadata_next'] });
    expect(result.observations.every(observation => validateApplicationObservation(observation).valid)).toBe(true);
    expect(JSON.stringify(result)).not.toContain(canary);
    expect((await f.store.query('test-app', 'observation')).items).toHaveLength(3);
    expect(result.budget).toMatchObject({ requests: 3, concurrency: 1, retries: 0 });
  });

  it.each([404, 500])('records HTTP %i without diagnosing a product or security defect', async status => {
    const f = await fixture((_req, res) => { res.writeHead(status); res.end('unknown'); });
    const result = await f.service.run(f.input);
    expect(result.resources[0].http?.status).toBe(status);
    expect(result.resources[0].state).toBe(status === 404 ? 'absent' : 'unavailable');
    expect(result.technologies.state).toBe('undetermined');
    expect(result.resources[0].http?.security_headers.hsts).toBe(false);
    expect(JSON.stringify(result)).not.toMatch(/product_bug|confirmed|vulnerable/);
  });

  it('validates every redirect and counts its GET against the run budget', async () => {
    const f = await fixture((req, res) => {
      if (req.url === '/') { res.writeHead(302, { Location: `/landing?private=${canary}` }); res.end(); }
      else res.end('ok');
    });
    f.input.authorization.allowed_urls.push(`${f.origin}/landing?private=${canary}`);
    const result = await f.service.run(f.input);
    expect(f.hits()).toBe(3);
    expect(f.paths).toEqual(['/', `/landing?private=${canary}`, '/robots.txt']);
    expect(result.resources[0].redirects).toHaveLength(1);
    expect(result.effective_url).toBe(`${f.origin}/[redacted]`);
    expect(result.resources[2].reason).toBe('REQUEST_LIMIT');
    expect(JSON.stringify(result)).not.toContain(canary);
  });

  it('blocks an external redirect before its destination receives a request', async () => {
    const destination = await fixture();
    const f = await fixture((_req, res) => { res.writeHead(302, { Location: `${destination.origin}/${canary}` }); res.end(); });
    const result = await f.service.run(f.input);
    expect(result.resources[0]).toMatchObject({ state: 'blocked', reason: 'SCOPE_BLOCKED' });
    expect(destination.hits()).toBe(0);
    expect(JSON.stringify(result)).not.toContain(canary);
  });

  it('enforces redirect limits and never uses robots as authorization for another path', async () => {
    const f = await fixture((_req, res) => { res.writeHead(302, { Location: '/' }); res.end(); });
    f.input.limits = { max_redirects: 0 };
    const result = await f.service.run(f.input);
    expect(result.resources.every(resource => resource.reason === 'REDIRECT_LIMIT')).toBe(true);
    expect(f.hits()).toBe(3);
  });

  it('does not query standard resources without their own exact authorization', async () => {
    const f = await fixture(); f.input.authorization.allowed_urls = [f.input.target_url];
    const result = await f.service.run(f.input);
    expect(f.hits()).toBe(1);
    expect(result.resources.slice(1).every(resource => resource.reason === 'SCOPE_BLOCKED')).toBe(true);
  });

  it('bounds slow responses and honors a total deadline across requests', async () => {
    const f = await fixture(() => undefined);
    f.input.limits = { request_timeout_ms: 80, total_timeout_ms: 130 };
    const result = await f.service.run(f.input);
    expect(result.status).toBe('indeterminate');
    expect(result.resources.every(resource => resource.reason === 'TIMEOUT')).toBe(true);
    expect(f.hits()).toBeLessThanOrEqual(2);
    expect(result.budget.elapsed_ms).toBeLessThan(1000);
  });

  it('bounds stalled DNS by the request deadline and does not connect after late resolution', async () => {
    const f = await fixture(undefined, true);
    f.input.limits = { request_timeout_ms: 20, total_timeout_ms: 40 };
    const resolver: ReconResolver = () => new Promise(resolve => setTimeout(() => resolve([{ address: '127.0.0.1', family: 4 }]), 100));
    const result = await new ReconnaissanceService(f.store, resolver).run(f.input);
    expect(result.resources[0].reason).toBe('TIMEOUT');
    expect(result.budget.requests).toBe(0);
    expect(f.hits()).toBe(0);
  });

  it.each(['wire', 'decoded', 'retained'])('bounds %s content and destroys the response', async budget => {
    const f = await fixture((_req, res) => {
      if (budget === 'decoded') { res.setHeader('Content-Encoding', 'gzip'); res.end(gzipSync('x'.repeat(100000))); }
      else res.end('x'.repeat(100000));
    });
    f.input.limits = budget === 'wire' ? { max_received_bytes: 512 }
      : budget === 'decoded' ? { max_decoded_bytes: 512 } : { max_retained_bytes: 512 };
    const result = await f.service.run(f.input);
    expect(result.resources[0]).toMatchObject({ state: 'limited', reason: 'BODY_LIMIT' });
    expect(JSON.stringify(result)).not.toContain('x'.repeat(100));
  });

  it('detects truncated HTTP bodies', async () => {
    const f = await fixture((_req, res) => {
      res.writeHead(200, { 'Content-Length': '1000' }); res.flushHeaders(); res.write('short');
      setTimeout(() => res.destroy(), 10);
    });
    const result = await f.service.run(f.input);
    expect(result.resources[0].reason).toBe('TRUNCATED');
  });

  it.each(['gzip', 'br', 'unknown'])('handles invalid %s encoding without retaining errors', async encoding => {
    const f = await fixture((_req, res) => { res.setHeader('Content-Encoding', encoding); res.end(canary); });
    const result = await f.service.run(f.input);
    expect(result.resources[0].reason).toBe('CONTENT_ENCODING');
    expect(JSON.stringify(result)).not.toContain(canary);
  });

  it('does not parse a JSON response as HTML or accept XML external entities', async () => {
    const f = await fixture((req, res) => {
      if (req.url === '/sitemap.xml') {
        res.setHeader('Content-Type', 'application/xml');
        res.end('<!DOCTYPE x SYSTEM "file:///private"><urlset><loc>&x;</loc></urlset>');
      } else { res.setHeader('Content-Type', 'application/json'); res.end('<script src="/_next/x"></script>'); }
    });
    const result = await f.service.run(f.input);
    expect(result.technologies.state).toBe('undetermined');
    expect(result.resources[1].discovery?.format).toBe('unexpected');
    expect(result.resources[2].discovery?.format).toBe('unexpected');
  });

  it('honors configured request pacing', async () => {
    const f = await fixture(); f.input.environment.rate_limit_ms = 30;
    const previous = await f.store.get('test-app', 'environment', 'local-test');
    await f.store.commit('test-app', [{ kind: 'environment', entity: f.input.environment,
      expected_revision: 1, trace: previous!.trace }]);
    const result = await f.service.run(f.input);
    expect(result.budget.elapsed_ms).toBeGreaterThanOrEqual(60);
  });

  it.each([
    ['React', '<div data-reactroot=""></div>'], ['Angular', '<app-root ng-version="20"></app-root>'],
    ['Vue', '<div data-v-abcdef12></div>'], ['WordPress', '<link href="/wp-content/style.css">'],
  ])('reports %s as a candidate with its observed signal', async (name, html) => {
    const f = await fixture((_req, res) => { res.setHeader('Content-Type', 'text/html'); res.end(html); });
    const result = await f.service.run(f.input);
    expect(result.technologies.candidates).toContainEqual({ name, status: 'candidate', strength: 'suggestive',
      signal_ids: [expect.any(String)] });
  });

  it('rejects oversized response headers with a controlled result', async () => {
    const f = await fixture((_req, res) => { res.setHeader('X-Large', canary.repeat(2000)); res.end('ok'); });
    const result = await f.service.run(f.input);
    expect(result.status).toBe('indeterminate');
    expect(result.resources[0].reason).toBe('NETWORK_FAILED');
    expect(JSON.stringify(result)).not.toContain(canary);
  });

  it('counts informational responses against the received byte budget', async () => {
    const f = await fixture((_req, res) => {
      res.writeEarlyHints({ link: `</${canary.repeat(100)}>; rel=preload` }); res.end('ok');
    });
    f.input.limits = { max_received_bytes: 512 };
    const result = await f.service.run(f.input);
    expect(result.resources[0].reason).toBe('BODY_LIMIT');
    expect(f.hits()).toBe(1);
    expect(JSON.stringify(result)).not.toContain(canary);
  });
});

describe('VNEXT-006 explicit scope and SSRF prevention', () => {
  it.each(['ftp://127.0.0.1/', 'http://user:pass@127.0.0.1/', 'http://127.0.0.1:1/',
    'http://127.0.0.1.evil.test/', 'http://evil.test/', 'file:///private'])('rejects %s before connecting', async url => {
    const f = await fixture(); f.input.target_url = url;
    await expect(f.service.run(f.input)).rejects.toMatchObject({ code: 'SCOPE_BLOCKED' });
    expect(f.hits()).toBe(0);
  });

  it('requires a matching persisted application and environment before networking', async () => {
    const f = await fixture(); f.input.environment.is_production = true;
    await expect(f.service.run(f.input)).rejects.toMatchObject({ code: 'CONTEXT_REQUIRED' });
    expect(f.hits()).toBe(0);
  });

  it('rejects absent context and sanitizes driver messages', async () => {
    const f = await fixture();
    vi.spyOn(f.store, 'get').mockRejectedValue(new Error(canary));
    const error = await f.service.run(f.input).catch((error: unknown) => error);
    expect(error).toMatchObject({ code: 'CONTEXT_REQUIRED' });
    expect(String(error)).not.toContain(canary);
    expect(f.hits()).toBe(0);
  });

  it('rejects invalid budgets before sending requests', async () => {
    const f = await fixture(); f.input.limits = { max_requests: 100000 };
    await expect(f.service.run(f.input)).rejects.toMatchObject({ code: 'INVALID_INPUT' });
    f.input.limits = { max_requests: 1, arbitrary: canary } as any;
    const error = await f.service.run(f.input).catch((error: unknown) => error);
    expect(error).toMatchObject({ code: 'INVALID_INPUT' });
    expect(String(error)).not.toContain(canary);
    expect(f.hits()).toBe(0);
  });

  it('does not treat allowed host names as permission for private IPs', async () => {
    const f = await fixture(); delete f.input.authorization.allowed_ips;
    f.input.authorization.allow_public_network = true;
    const result = await f.service.run(f.input);
    expect(result.resources.every(resource => resource.reason === 'NETWORK_BLOCKED')).toBe(true);
    expect(f.hits()).toBe(0);
  });

  it.each(['10.0.0.1', '172.16.0.1', '192.168.1.1', '169.254.169.254', '100.100.100.200',
    '::1', '::ffff:127.0.0.1', 'fe80::1', 'fc00::1', '64:ff9b::a9fe:a9fe', '2002:7f00:1::'])(
    'rejects DNS resolution to %s without a permitted connection', async address => {
    const f = await fixture(undefined, true); f.input.authorization.allowed_ips = [];
    f.input.authorization.allow_public_network = true;
    const resolver: ReconResolver = async () => [{ address, family: address.includes(':') ? 6 : 4 }];
    const result = await new ReconnaissanceService(f.store, resolver).run(f.input);
    expect(result.resources.every(resource => resource.reason === 'NETWORK_BLOCKED')).toBe(true);
    expect(f.hits()).toBe(0);
  });

  it('hard-denies metadata/link-local addresses even when explicitly listed', async () => {
    const f = await fixture(undefined, true);
    f.input.authorization.allowed_ips = ['169.254.169.254'];
    const result = await new ReconnaissanceService(f.store, async () => [{ address: '169.254.169.254', family: 4 }]).run(f.input);
    expect(result.resources[0].reason).toBe('NETWORK_BLOCKED'); expect(f.hits()).toBe(0);
  });

  it('rejects mixed DNS answers rather than selecting a safe address', async () => {
    const f = await fixture(undefined, true);
    const result = await new ReconnaissanceService(f.store, async () => [
      { address: '127.0.0.1', family: 4 }, { address: '169.254.169.254', family: 4 },
    ]).run(f.input);
    expect(result.resources[0].reason).toBe('NETWORK_BLOCKED'); expect(f.hits()).toBe(0);
  });

  it('pins DNS through connection and revalidates on every subsequent GET', async () => {
    const f = await fixture(undefined, true);
    let resolves = 0;
    const resolver: ReconResolver = async () => [{ address: ++resolves === 1 ? '127.0.0.1' : '169.254.169.254', family: 4 }];
    const result = await new ReconnaissanceService(f.store, resolver).run(f.input);
    expect(result.resources[0].http?.status).toBe(200);
    expect(result.resources[1].reason).toBe('NETWORK_BLOCKED');
    expect(f.hits()).toBe(1); expect(resolves).toBe(3);
  });

  it('normalizes equivalent IPv4 and mapped IPv6 representations', () => {
    expect(canonicalIp('::ffff:7f00:1')).toBe('127.0.0.1');
    expect(canonicalIp('::ffff:127.0.0.1')).toBe('127.0.0.1');
    expect(canonicalIp('0:0:0:0:0:0:0:1')).toBe('::1');
    expect(new URL('http://2130706433').hostname).toBe('127.0.0.1');
    expect(new URL('http://0x7f000001').hostname).toBe('127.0.0.1');
  });

  it('allows actual IPv6 loopback only through explicit exact network authorization', async () => {
    let hits = 0;
    const server = createServer((_req, res) => { hits++; res.end('ipv6'); }); servers.push(server);
    await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(0, '::1', resolve); });
    const f = await fixture();
    const origin = `http://[::1]:${(server.address() as { port: number }).port}`;
    f.input.target_url = `${origin}/`; f.input.environment.base_url = origin;
    f.input.environment.safe_domains = ['[::1]'];
    f.input.authorization = { allowed_urls: [`${origin}/`], allowed_ips: ['0:0:0:0:0:0:0:1'] };
    const env = await f.store.get('test-app', 'environment', 'local-test');
    await f.store.commit('test-app', [{ kind: 'environment', entity: f.input.environment, expected_revision: 1, trace: env!.trace }]);
    expect((await f.service.run(f.input)).resources[0].http?.status).toBe(200);
    expect(hits).toBe(1);
    f.input.authorization.allowed_ips = [];
    expect((await f.service.run(f.input)).resources[0].reason).toBe('NETWORK_BLOCKED');
    expect(hits).toBe(1);
  });

  it('returns safe DNS failure reasons', async () => {
    const f = await fixture(undefined, true);
    const result = await new ReconnaissanceService(f.store, async () => { throw new Error(canary); }).run(f.input);
    expect(result.resources[0].reason).toBe('DNS_FAILED');
    expect(JSON.stringify(result)).not.toContain(canary); expect(f.hits()).toBe(0);
  });
});

describe('VNEXT-006 real HTTPS verification', () => {
  it('captures validated synthetic certificate metadata with SNI and hostname checks', async () => {
    const f = await fixture(undefined, true);
    const result = await f.service.run(f.input);
    expect(result.resources[0].tls).toMatchObject({ validated: true, hostname_matches: true,
      protocol: expect.stringMatching(/^TLSv1\.[23]$/), fingerprint_sha256: expect.any(String),
      subject_sha256: expect.stringMatching(/^[a-f0-9]{64}$/), issuer_sha256: expect.any(String),
      valid_from: expect.any(String), valid_to: expect.any(String) });
    expect(result.status).toBe('completed'); expect(f.hits()).toBe(3);
  });

  it('rejects an untrusted certificate without sending HTTP or inventing observations', async () => {
    const f = await fixture(undefined, true); delete f.input.tls_ca;
    const result = await f.service.run(f.input);
    expect(result.resources[0].tls).toMatchObject({ validated: false, error: 'TLS_FAILED' });
    expect(result.observations).toHaveLength(0); expect(f.hits()).toBe(0);
    expect(result.status).toBe('indeterminate');
  });

  it('rejects a trusted certificate whose hostname does not match', async () => {
    const f = await fixture(undefined, true);
    const origin = `https://127.0.0.1:${f.port}`;
    f.input.environment.base_url = origin; f.input.environment.safe_domains = ['127.0.0.1'];
    f.input.target_url = `${origin}/`;
    f.input.authorization.allowed_urls = [f.input.target_url];
    const env = await f.store.get('test-app', 'environment', 'local-test');
    await f.store.commit('test-app', [{ kind: 'environment', entity: f.input.environment, expected_revision: 1, trace: env!.trace }]);
    const result = await f.service.run(f.input);
    expect(result.resources[0].reason).toBe('TLS_FAILED'); expect(f.hits()).toBe(0);
  });

  it('handles a failed TLS handshake against a plaintext endpoint', async () => {
    const f = await fixture();
    const origin = `https://127.0.0.1:${f.port}`;
    f.input.environment.base_url = origin; f.input.target_url = `${origin}/`;
    f.input.authorization.allowed_urls = [f.input.target_url];
    const env = await f.store.get('test-app', 'environment', 'local-test');
    await f.store.commit('test-app', [{ kind: 'environment', entity: f.input.environment, expected_revision: 1, trace: env!.trace }]);
    const result = await f.service.run(f.input);
    expect(result.resources[0].reason).toBe('TLS_FAILED'); expect(f.hits()).toBe(0);
  });
});
