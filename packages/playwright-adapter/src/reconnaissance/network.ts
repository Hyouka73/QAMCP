import { lookup } from 'node:dns/promises';
import { BlockList, isIP } from 'node:net';

import { ReconnaissanceError, type ReconLimits, type ReconnaissanceInput, type ReconResolver } from './types.js';

export const defaults: ReconLimits = {
  max_requests: 3, request_timeout_ms: 5000, total_timeout_ms: 15000,
  max_received_bytes: 262144, max_decoded_bytes: 262144, max_retained_bytes: 262144, max_redirects: 2,
};
export function limitsFor(input: ReconnaissanceInput): ReconLimits {
  if (input.limits !== undefined && (!input.limits || typeof input.limits !== 'object' || Array.isArray(input.limits) ||
    Object.keys(input.limits).some(key => !Object.hasOwn(defaults, key)))) throw new ReconnaissanceError('INVALID_INPUT');
  const limits = { ...defaults, ...input.limits };
  const caps: ReconLimits = { max_requests: 12, request_timeout_ms: 30000, total_timeout_ms: 60000,
    max_received_bytes: 1048576, max_decoded_bytes: 1048576, max_retained_bytes: 1048576, max_redirects: 5 };
  for (const key of Object.keys(caps) as Array<keyof ReconLimits>) {
    if (!Number.isSafeInteger(limits[key]) || limits[key] < (key === 'max_redirects' ? 0 : 1) || limits[key] > caps[key]) {
      throw new ReconnaissanceError('INVALID_INPUT');
    }
  }
  return limits;
}

export function parseUrl(value: string): URL {
  try {
    if (typeof value !== 'string' || value.length > 8192 || [...value].some(char => char.charCodeAt(0) <= 32 || char === '\\')) {
      throw new ReconnaissanceError('SCOPE_BLOCKED');
    }
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.hash || !url.hostname || url.port === '0') {
      throw new ReconnaissanceError('SCOPE_BLOCKED');
    }
    // One canonical spelling for trailing DNS dots; do not let authorization differ from SNI.
    if (url.hostname.endsWith('.')) url.hostname = url.hostname.slice(0, -1);
    return url;
  } catch { throw new ReconnaissanceError('SCOPE_BLOCKED'); }
}
export const hostname = (url: URL): string => url.hostname.replace(/^\[|\]$/g, '');

/** Drops every arbitrary path, query and fragment, rather than guessing secret key names. */
export function safeUrl(url: URL): string {
  const path = ['/', '/robots.txt', '/sitemap.xml'].includes(url.pathname) ? url.pathname : '/[redacted]';
  return `${url.origin}${path}`;
}

export function canonicalIp(value: string): string {
  const ip = value.replace(/^\[|\]$/g, '');
  if (!isIP(ip) || ip.includes('%')) throw new ReconnaissanceError('NETWORK_BLOCKED');
  if (isIP(ip) === 4) return ip;
  const normalized = new URL(`http://[${ip}]/`).hostname.slice(1, -1);
  // Node returns mapped peers for dual-stack sockets; treat them identically to IPv4.
  const mapped = /^::ffff:([0-9a-f]+):([0-9a-f]+)$/.exec(normalized);
  if (mapped) {
    const high = parseInt(mapped[1], 16), low = parseInt(mapped[2], 16);
    return `${high >>> 8}.${high & 255}.${low >>> 8}.${low & 255}`;
  }
  return normalized;
}

const restricted = new BlockList();
for (const [ip, prefix] of [['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
  ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24], ['192.168.0.0', 16],
  ['198.18.0.0', 15], ['198.51.100.0', 24], ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4]] as const) {
  restricted.addSubnet(ip, prefix, 'ipv4');
}
const globalV6 = new BlockList(); globalV6.addSubnet('2000::', 3, 'ipv6');
for (const [ip, prefix] of [['2001::', 23], ['2001:db8::', 32], ['2002::', 16], ['3fff::', 20]] as const) {
  restricted.addSubnet(ip, prefix, 'ipv6');
}
const forbidden = new BlockList();
for (const [ip, prefix] of [['0.0.0.0', 8], ['169.254.0.0', 16], ['224.0.0.0', 4], ['240.0.0.0', 4]] as const) {
  forbidden.addSubnet(ip, prefix, 'ipv4');
}
for (const [ip, prefix] of [['::', 128], ['fe80::', 10], ['ff00::', 8], ['64:ff9b::', 96],
  ['64:ff9b:1::', 48], ['2002::', 16]] as const) forbidden.addSubnet(ip, prefix, 'ipv6');
forbidden.addAddress('100.100.100.200', 'ipv4');
forbidden.addAddress('168.63.129.16', 'ipv4');

export class ReconScope {
  private readonly urls: Set<string>;
  private readonly ips: Set<string>;
  private readonly domains: Set<string>;
  constructor(private readonly input: ReconnaissanceInput, private readonly resolver: ReconResolver =
    host => lookup(host, { all: true, verbatim: true })) {
    try {
      if (!input.authorization || !Array.isArray(input.authorization.allowed_urls) ||
        input.authorization.allowed_urls.length < 1 || input.authorization.allowed_urls.length > 32 ||
        !Array.isArray(input.environment.safe_domains) || input.environment.safe_domains.length > 32 ||
        (input.authorization.allowed_ips?.length ?? 0) > 64 ||
        (input.authorization.allow_public_network !== undefined && typeof input.authorization.allow_public_network !== 'boolean')) {
        throw new ReconnaissanceError('INVALID_INPUT');
      }
      this.urls = new Set(input.authorization.allowed_urls.map(value => parseUrl(value).href));
      this.ips = new Set((input.authorization.allowed_ips ?? []).map(canonicalIp));
      this.domains = new Set(input.environment.safe_domains.map(domain => {
        const parsed = parseUrl(`http://${domain}/`);
        if (parsed.port || parsed.pathname !== '/' || parsed.search) throw new ReconnaissanceError('INVALID_INPUT');
        return parsed.hostname;
      }));
    } catch { throw new ReconnaissanceError('INVALID_INPUT'); }
  }
  authorize(url: URL): void {
    if (!this.urls.has(url.href) || !this.domains.has(url.hostname)) throw new ReconnaissanceError('SCOPE_BLOCKED');
  }
  private addressAllowed(value: string): string {
    const ip = canonicalIp(value), family = isIP(ip) === 4 ? 'ipv4' : 'ipv6';
    const privateAddress = restricted.check(ip, family) || (family === 'ipv6' && !globalV6.check(ip, family));
    if (forbidden.check(ip, family) || (!this.ips.has(ip) &&
      (privateAddress || this.input.authorization.allow_public_network !== true))) throw new ReconnaissanceError('NETWORK_BLOCKED');
    return ip;
  }
  async resolve(url: URL): Promise<{ address: string; family: 4 | 6 }> {
    this.authorize(url);
    let addresses: Array<{ address: string; family: number }>;
    try {
      const host = hostname(url);
      addresses = isIP(host) ? [{ address: host, family: isIP(host) }] : await this.resolver(host);
    } catch { throw new ReconnaissanceError('DNS_FAILED'); }
    if (!addresses.length || addresses.length > 64) throw new ReconnaissanceError('DNS_FAILED');
    // Reject mixed answers too; never select just the apparently safe result.
    const validated = addresses.map(entry => this.addressAllowed(entry.address));
    return { address: validated[0], family: isIP(validated[0]) as 4 | 6 };
  }
}
