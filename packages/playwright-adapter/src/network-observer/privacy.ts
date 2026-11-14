import { createHmac, randomBytes } from 'node:crypto';

import type { ObservedEndpoint, ObservedNetworkEvent } from './types.js';

const words = new Set(['api', 'v1', 'v2', 'v3', 'orders', 'items', 'users', 'products', 'data', 'list', 'status', 'search']);
export const queryVocabulary = new Set(['page', 'limit', 'offset', 'sort', 'order']);
export function privateReferences() {
  const key = randomBytes(32);
  return (value: string) => `urn:qap:network:${createHmac('sha256', key).update(value).digest('hex')}`;
}
export function queryMetadata(url: URL, allowed: readonly string[]) {
  const names: string[] = []; let omitted = 0;
  for (const name of url.searchParams.keys()) {
    if (queryVocabulary.has(name) && allowed.includes(name)) { if (!names.includes(name)) names.push(name); }
    else omitted++;
  }
  return { query_names: names.sort(), omitted_query_count: omitted };
}
/** Catalog static segments only; variable patterns need >=2 distinct successful paths.
 * Raw paths exist only in bounded, ephemeral acquisition memory. */
export function structuralPatterns(endpoints: ObservedEndpoint[], samples: Array<{ url: URL; event: ObservedNetworkEvent }>) {
  const candidates = new Map<string, Array<{ url: URL; event: ObservedNetworkEvent }>>();
  for (const sample of samples) {
    if (sample.event.outcome !== 'responded' || !['fetch', 'xhr'].includes(sample.event.request_type)) continue;
    const parts = sample.url.pathname.split('/').slice(1);
    if (parts.length > 8 || parts.some(p => !words.has(p) && !/^(?:\d{1,20}|[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12})$/i.test(p))) continue;
    const pattern = '/' + parts.map(p => words.has(p) ? p : '{id}').join('/');
    const key = `${sample.url.origin}|${sample.event.method}|${pattern}`;
    const group = candidates.get(key) ?? []; group.push(sample); candidates.set(key, group);
  }
  for (const [key, group] of candidates) {
    const pattern = key.slice(key.lastIndexOf('|') + 1);
    if (pattern.includes('{id}') && new Set(group.map(s => s.url.pathname)).size < 2) continue;
    for (const endpoint of endpoints.filter(e => group.some(s => s.event.endpoint_ref === e.reference))) {
      endpoint.structural_pattern = pattern;
      endpoint.pattern_event_ids = group.map(s => s.event.id);
    }
  }
}
