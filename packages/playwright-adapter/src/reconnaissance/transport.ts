import { request as httpRequest, type IncomingHttpHeaders } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { isIP } from 'node:net';
import type { TLSSocket } from 'node:tls';
import { brotliDecompressSync, gunzipSync, inflateSync } from 'node:zlib';

import { tlsMetadata } from './metadata.js';
import { canonicalIp, hostname, type ReconScope } from './network.js';
import { ReconnaissanceError, type ReconBudget, type ReconLimits, type ReconnaissanceInput, type TlsFindings } from './types.js';

export interface HttpCapture {
  status: number;
  headers: IncomingHttpHeaders;
  body: string;
  tls?: TlsFindings;
  issue?: ReconnaissanceError['code'];
}

function headerBytes(response: { rawHeaders: string[]; httpVersion: string; statusCode?: number; statusMessage?: string }): number {
  return Buffer.byteLength(response.rawHeaders.join('\r\n')) + 4 +
    Buffer.byteLength(`HTTP/${response.httpVersion} ${response.statusCode ?? 0} ${response.statusMessage ?? ''}\r\n`);
}

function untilAbort<T>(work: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const abort = () => reject(new ReconnaissanceError('TIMEOUT'));
    if (signal.aborted) { abort(); return; }
    signal.addEventListener('abort', abort, { once: true });
    work.then(resolve, error => reject(error instanceof ReconnaissanceError ? error : new ReconnaissanceError('DNS_FAILED')))
      .finally(() => signal.removeEventListener('abort', abort)).catch(() => undefined);
  });
}

/** One GET, no agent/pool/proxy/cookie jar, no automatic redirects and no retry. */
export async function acquire(url: URL, scope: ReconScope, input: ReconnaissanceInput,
  limits: ReconLimits, budget: ReconBudget, globalSignal: AbortSignal, origin?: string): Promise<HttpCapture> {
  // Only a canonical origin may be supplied by the browser gateway, never arbitrary headers.
  if (origin !== undefined && parseOrigin(origin) !== origin) throw new ReconnaissanceError('SCOPE_BLOCKED');
  const signal = AbortSignal.any([globalSignal, AbortSignal.timeout(limits.request_timeout_ms)]);
  scope.authorize(url);
  if (budget.requests >= limits.max_requests) throw new ReconnaissanceError('REQUEST_LIMIT');
  if (budget.received_bytes >= limits.max_received_bytes || budget.decoded_bytes >= limits.max_decoded_bytes ||
    budget.retained_bytes >= limits.max_retained_bytes) throw new ReconnaissanceError('BODY_LIMIT');
  const pinned = await untilAbort(scope.resolve(url), signal);
  if (signal.aborted) throw new ReconnaissanceError('TIMEOUT');
  return new Promise((resolve, reject) => {
    const secure = url.protocol === 'https:';
    let finished = false;
    let capture: HttpCapture | undefined;
    let tls: TlsFindings | undefined;
    const req = (secure ? httpsRequest : httpRequest)({
      protocol: url.protocol, hostname: hostname(url), port: url.port || (secure ? 443 : 80),
      path: `${url.pathname}${url.search}`, method: 'GET', agent: false, maxHeaderSize: 16384, family: pinned.family,
      headers: { Accept: 'text/html, text/plain, application/xml;q=0.9, */*;q=0.1',
        'Accept-Encoding': 'identity', 'User-Agent': 'QAP-Recon/1', ...(origin ? { Origin: origin } : {}) },
      // Pin the checked DNS answer. Never resolve again between validation and connect.
      lookup: (_host, _options, callback) => callback(null, pinned.address, pinned.family),
      ...(secure ? { rejectUnauthorized: true, ...(input.tls_ca ? { ca: input.tls_ca } : {}),
        ...(isIP(hostname(url)) ? {} : { servername: hostname(url) }) } : {}),
    });
    budget.requests++;
    const done = (issue?: ReconnaissanceError['code']) => {
      if (finished) return;
      finished = true;
      signal.removeEventListener('abort', abort);
      req.destroy();
      if (capture) resolve({ ...capture, ...(tls ? { tls } : {}), ...(issue ? { issue } : {}) });
      else reject(new ReconnaissanceError(issue ?? 'NETWORK_FAILED'));
    };
    const abort = () => done('TIMEOUT');
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) { abort(); return; }
    req.once('socket', socket => {
      socket.once(secure ? 'secureConnect' : 'connect', () => {
        if (finished) return;
        try {
          if (!socket.remoteAddress || canonicalIp(socket.remoteAddress) !== pinned.address ||
            socket.remotePort !== Number(url.port || (secure ? 443 : 80))) { done('PEER_MISMATCH'); return; }
          if (secure) {
            tls = tlsMetadata(socket as TLSSocket, hostname(url));
            if (!tls.validated) { done('TLS_FAILED'); return; }
          }
          if (!finished) req.end(); // No HTTP bytes before the peer and TLS checks.
        } catch { done(secure ? 'TLS_FAILED' : 'PEER_MISMATCH'); }
      });
    });
    req.once('error', () => done(secure ? 'TLS_FAILED' : 'NETWORK_FAILED'));
    req.on('information', information => {
      if (finished) return;
      budget.received_bytes += headerBytes(information);
      if (budget.received_bytes > limits.max_received_bytes) done('BODY_LIMIT');
    });
    req.once('response', res => {
      if (finished) { res.destroy(); return; }
      capture = { status: res.statusCode ?? 0, headers: res.headers, body: '' };
      // Account for bounded headers too, without exposing their contents.
      budget.received_bytes += headerBytes(res);
      if (budget.received_bytes > limits.max_received_bytes) { done('BODY_LIMIT'); return; }
      if ([301, 302, 303, 307, 308].includes(capture.status)) { done(); return; }
      const encoding = res.headers['content-encoding']?.trim().toLowerCase() ?? 'identity';
      if (!['identity', 'gzip', 'deflate', 'br'].includes(encoding)) { done('CONTENT_ENCODING'); return; }
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => {
        if (finished) return;
        budget.received_bytes += chunk.length;
        if (budget.received_bytes > limits.max_received_bytes) { done('BODY_LIMIT'); return; }
        chunks.push(chunk);
      });
      res.once('aborted', () => done('TRUNCATED'));
      res.once('error', () => done('TRUNCATED'));
      res.once('end', () => {
        if (finished || !capture) return;
        if (!res.complete) { done('TRUNCATED'); return; }
        try {
          const raw = Buffer.concat(chunks);
          const remaining = limits.max_decoded_bytes - budget.decoded_bytes;
          const decode = encoding === 'gzip' ? gunzipSync : encoding === 'deflate' ? inflateSync : brotliDecompressSync;
          const decoded = encoding === 'identity' ? raw : decode(raw, { maxOutputLength: remaining });
          if (decoded.length > remaining) { budget.decoded_bytes += remaining; done('BODY_LIMIT'); return; }
          budget.decoded_bytes += decoded.length;
          const retained = decoded.subarray(0, limits.max_retained_bytes - budget.retained_bytes);
          budget.retained_bytes += retained.length;
          if (retained.length !== decoded.length) { done('BODY_LIMIT'); return; }
          capture.body = retained.toString('utf8');
          done();
        } catch (error) {
          const sizeError = (error as NodeJS.ErrnoException).code === 'ERR_BUFFER_TOO_LARGE';
          if (sizeError) budget.decoded_bytes = limits.max_decoded_bytes;
          done(sizeError ? 'BODY_LIMIT' : 'CONTENT_ENCODING');
        }
      });
    });
  });
}

function parseOrigin(value: string): string | undefined {
  try { const parsed = new URL(value); return ['http:', 'https:'].includes(parsed.protocol) ? parsed.origin : undefined; }
  catch { return undefined; }
}
