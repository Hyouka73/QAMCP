import { createHash } from 'node:crypto';
import type { IncomingHttpHeaders } from 'node:http';
import { checkServerIdentity, type TLSSocket } from 'node:tls';

import type { HttpFindings, ReconResource, TechnologyCandidate, TechnologySignal, TlsFindings } from './types.js';

const header = (headers: IncomingHttpHeaders, name: string): string => {
  const value = headers[name]; return typeof value === 'string' ? value : '';
};
export function httpMetadata(status: number, headers: IncomingHttpHeaders): HttpFindings {
  const type = header(headers, 'content-type').split(';')[0].trim().toLowerCase();
  const hsts = header(headers, 'strict-transport-security');
  const cookies = headers['set-cookie'] ?? [];
  const directives = ['default-src', 'script-src', 'style-src', 'img-src', 'connect-src', 'frame-ancestors',
    'base-uri', 'object-src', 'form-action', 'upgrade-insecure-requests'];
  const frame = header(headers, 'x-frame-options').trim().toLowerCase();
  const age = /(?:^|;)\s*max-age\s*=\s*(\d{1,10})(?:\s*;|\s*$)/i.exec(hsts);
  const result: HttpFindings = {
    status, content_type: !type ? 'absent' : type === 'text/html' ? 'html' : type === 'text/plain' ? 'text'
      : ['application/xml', 'text/xml'].includes(type) ? 'xml' : type === 'application/json' ? 'json' : 'other',
    security_headers: { hsts: !!hsts, csp: !!header(headers, 'content-security-policy'),
      frame_options: !!frame, content_type_options: !!header(headers, 'x-content-type-options'),
      referrer_policy: !!header(headers, 'referrer-policy'), permissions_policy: !!header(headers, 'permissions-policy') },
    csp_directives: header(headers, 'content-security-policy').split(';').map(value => value.trim().split(/\s/)[0])
      .filter((value, index, list) => directives.includes(value) && list.indexOf(value) === index),
    nosniff: header(headers, 'x-content-type-options').trim().toLowerCase() === 'nosniff',
    cors: !header(headers, 'access-control-allow-origin') ? 'absent'
      : header(headers, 'access-control-allow-origin') === '*' ? 'wildcard' : 'scoped',
    cors_credentials: header(headers, 'access-control-allow-credentials') === 'true',
    cookies: { count: cookies.length, secure: cookies.filter(value => /;\s*secure\s*(;|$)/i.test(value)).length,
      http_only: cookies.filter(value => /;\s*httponly\s*(;|$)/i.test(value)).length,
      same_site: cookies.filter(value => /;\s*samesite\s*=\s*(lax|strict|none)\s*(;|$)/i.test(value)).length },
  };
  if (frame) result.frame_options = frame === 'deny' ? 'deny' : frame === 'sameorigin' ? 'sameorigin' : 'other';
  if (hsts) result.hsts = { ...(age ? { max_age: Number(age[1]) } : {}),
    include_subdomains: /(?:^|;)\s*includesubdomains\s*(;|$)/i.test(hsts), preload: /(?:^|;)\s*preload\s*(;|$)/i.test(hsts) };
  return result;
}

export function tlsMetadata(socket: TLSSocket, host: string): TlsFindings {
  const cert = socket.getPeerCertificate();
  const match = !checkServerIdentity(host, cert);
  const digest = (value: unknown): string => createHash('sha256').update(JSON.stringify(value)).digest('hex');
  const normalize = (value: Record<string, string | string[] | undefined>): Array<[string, string | string[] | undefined]> =>
    Object.entries(value).sort(([a], [b]) => a.localeCompare(b));
  const result: TlsFindings = { validated: socket.authorized && match, hostname_matches: match };
  const protocol = socket.getProtocol();
  if (protocol && ['TLSv1', 'TLSv1.1', 'TLSv1.2', 'TLSv1.3'].includes(protocol)) result.protocol = protocol;
  if (cert.subject) result.subject_sha256 = digest(normalize(cert.subject));
  if (cert.issuer) result.issuer_sha256 = digest(normalize(cert.issuer));
  if (cert.fingerprint256 && /^[A-F0-9:]{95}$/i.test(cert.fingerprint256)) result.fingerprint_sha256 = cert.fingerprint256;
  if (Number.isFinite(Date.parse(cert.valid_from))) result.valid_from = new Date(cert.valid_from).toISOString();
  if (Number.isFinite(Date.parse(cert.valid_to))) result.valid_to = new Date(cert.valid_to).toISOString();
  return result;
}

export function technologySignals(headers: IncomingHttpHeaders, html: string): TechnologySignal[] {
  const signals: TechnologySignal[] = [];
  const add = (id: string, source: TechnologySignal['source']) => {
    if (!signals.some(signal => signal.id === id)) signals.push({ id, source });
  };
  // Values never leave this function. Fixed labels describe the actual matched signal.
  if (/^nginx(?:\/|$)/i.test(header(headers, 'server'))) add('server_nginx', 'http_header');
  if (/^Apache(?:\/|$)/i.test(header(headers, 'server'))) add('server_apache', 'http_header');
  if (/^Express$/i.test(header(headers, 'x-powered-by'))) add('powered_express', 'http_header');
  if (/^Next\.js$/i.test(header(headers, 'x-powered-by'))) add('powered_next', 'http_header');
  // Bound heuristic work as well as download size; inspect at most 1024 short tags.
  let offset = 0;
  for (let count = 0; count < 1024; count++) {
    const start = html.indexOf('<', offset);
    if (start < 0) break;
    const end = html.indexOf('>', start + 1);
    if (end < 0) break;
    offset = end + 1;
    if (end - start > 4096) continue;
    const tag = html.slice(start, end + 1);
    if (/^<script\b[^>]*\bsrc\s*=\s*["'][^"']*\/_next\//i.test(tag)) add('resource_next', 'html_resource');
    if (/^<script\b[^>]*\bid\s*=\s*["']__NEXT_DATA__["']/i.test(tag)) add('metadata_next', 'html_metadata');
    if (/^<[a-z][^>]*\bdata-reactroot\s*=/i.test(tag)) add('metadata_react', 'html_metadata');
    if (/^<[a-z][^>]*\bng-version\s*=/i.test(tag)) add('metadata_angular', 'html_metadata');
    if (/^<[a-z][^>]*\bdata-v-[a-f0-9]{6,}\b/i.test(tag)) add('metadata_vue', 'html_metadata');
    if (/^<(?:script|link)\b[^>]*(?:src|href)\s*=\s*["'][^"']*\/wp-content\//i.test(tag)) add('resource_wordpress', 'html_resource');
  }
  return signals;
}

export function candidates(resources: ReconResource[]): TechnologyCandidate[] {
  const rules: Array<[TechnologyCandidate['name'], string[]]> = [
    ['Next.js', ['powered_next', 'resource_next', 'metadata_next']], ['React', ['metadata_react']],
    ['Angular', ['metadata_angular']], ['Vue', ['metadata_vue']], ['WordPress', ['resource_wordpress']],
    ['Express', ['powered_express']], ['nginx', ['server_nginx']], ['Apache', ['server_apache']],
  ];
  const observed = new Set(resources.flatMap(resource => resource.signals.map(signal => signal.id)));
  return rules.flatMap(([name, ids]) => {
    const matches = ids.filter(id => observed.has(id));
    return matches.length ? [{ name, status: 'candidate' as const,
      strength: matches.length > 1 ? 'strong' as const : 'suggestive' as const, signal_ids: matches }] : [];
  });
}

export function discovery(resource: 'robots' | 'sitemap', body: string, type: HttpFindings['content_type']): ReconResource['discovery'] {
  if (resource === 'robots') {
    if (type !== 'text' || /<html/i.test(body)) return { format: 'unexpected' };
    const count = (directive: string) => (body.match(new RegExp(`^[ \\t]*${directive}[ \\t]*:`, 'gim')) ?? []).length;
    return { format: 'robots', allow_rules: count('allow'), disallow_rules: count('disallow'), sitemap_hints: count('sitemap') };
  }
  // No XML entity resolution, external fetches or recursion. Counts are explicitly approximate.
  if (type !== 'xml' || !/<(?:urlset|sitemapindex)(?:\s|>)/i.test(body) || /<!DOCTYPE|<!ENTITY/i.test(body)) {
    return { format: 'unexpected' };
  }
  return { format: 'sitemap', locations: (body.match(/<loc(?:\s|>)/gi) ?? []).length,
    nested_sitemaps: (body.match(/<sitemap(?:\s|>)/gi) ?? []).length };
}
