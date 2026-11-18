import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { isDeepStrictEqual } from 'node:util';

import type { IKnowledgeStore, KnowledgeTrace, KnowledgeWrite } from '@qap/engine';
import type { ApplicationObservation, MultimodalEvidenceRef } from '@qap/shared';

import { candidates, discovery, httpMetadata, technologySignals } from './metadata.js';
import { limitsFor, parseUrl, ReconScope, safeUrl } from './network.js';
import { acquire } from './transport.js';
import { ReconnaissanceError, type ReconnaissanceInput, type ReconnaissanceResult,
  type ReconResource, type ReconResolver } from './types.js';

/** Black-box HTTP acquisition, composed over the existing storage-neutral port. */
export class ReconnaissanceService {
  constructor(private readonly store: IKnowledgeStore, private readonly resolver?: ReconResolver) {}

  async run(request: ReconnaissanceInput): Promise<ReconnaissanceResult> {
    let input: ReconnaissanceInput;
    try { input = structuredClone(request); } catch { throw new ReconnaissanceError('INVALID_INPUT'); }
    if (!input || !input.environment || !/^[a-zA-Z0-9_.:-]{1,128}$/.test(input.application_id) ||
      !/^[a-zA-Z0-9_.:-]{1,128}$/.test(input.environment.environment_id) ||
      input.environment.application_id !== input.application_id ||
      (input.tls_ca !== undefined && (typeof input.tls_ca !== 'string' || input.tls_ca.length > 65536)) ||
      (input.environment.rate_limit_ms !== undefined && (!Number.isSafeInteger(input.environment.rate_limit_ms) ||
        input.environment.rate_limit_ms < 0 || input.environment.rate_limit_ms > 60000))) {
      throw new ReconnaissanceError('INVALID_INPUT');
    }
    const limits = limitsFor(input);
    const target = parseUrl(input.target_url);
    const scope = new ReconScope(input, this.resolver);
    // Structural scope and context failures are contract errors, before any network traffic.
    scope.authorize(target);
    const context = await this.context(input);
    const started = Date.now();
    const signal = AbortSignal.timeout(limits.total_timeout_ms);
    const execution = randomUUID();
    const result: ReconnaissanceResult = { execution_id: execution, status: 'indeterminate',
      requested_url: safeUrl(target), effective_url: safeUrl(target), resources: [],
      technologies: { state: 'undetermined', candidates: [] }, observations: [], evidence: [],
      warnings: ['OBSERVATIONS_ARE_NOT_VULNERABILITY_VERDICTS', 'HTML_AND_ARBITRARY_VALUES_DISCARDED',
        'SITEMAP_COUNTS_ARE_APPROXIMATE'],
      budget: { requests: 0, received_bytes: 0, decoded_bytes: 0, retained_bytes: 0, elapsed_ms: 0, concurrency: 1, retries: 0 }, limits };
    const resources: Array<[ReconResource['resource'], URL]> = [['target', target],
      ['robots', new URL('/robots.txt', target.origin)], ['sitemap', new URL('/sitemap.xml', target.origin)]];
    for (const [kind, url] of resources) {
      const resource: ReconResource = { resource: kind, requested_url: safeUrl(url), effective_url: safeUrl(url),
        state: 'unavailable', redirects: [], signals: [] };
      let current = url;
      try {
        for (;;) {
          scope.authorize(current);
          if (signal.aborted) throw new ReconnaissanceError('TIMEOUT');
          if (result.budget.requests && input.environment.rate_limit_ms) {
            try { await delay(input.environment.rate_limit_ms, undefined, { signal }); }
            catch { throw new ReconnaissanceError('TIMEOUT'); }
          }
          const capture = await acquire(current, scope, input, limits, result.budget, signal);
          resource.effective_url = safeUrl(current);
          resource.http = httpMetadata(capture.status, capture.headers);
          if (capture.tls) resource.tls = capture.tls;
          else delete resource.tls;
          resource.signals = technologySignals(capture.headers,
            !capture.issue && resource.http.content_type === 'html' ? capture.body : '');
          if (capture.issue) throw new ReconnaissanceError(capture.issue);
          if ([301, 302, 303, 307, 308].includes(capture.status)) {
            if (resource.redirects.length >= limits.max_redirects) throw new ReconnaissanceError('REDIRECT_LIMIT');
            let next: URL;
            try {
              if (!capture.headers.location) throw new ReconnaissanceError('SCOPE_BLOCKED');
              next = parseUrl(new URL(capture.headers.location, current).href);
            }
            catch { throw new ReconnaissanceError('SCOPE_BLOCKED'); }
            // Only authorized destinations appear even in sanitized blocked redirect records.
            scope.authorize(next);
            resource.redirects.push({ from: safeUrl(current), to: safeUrl(next), status: capture.status });
            current = next;
            continue;
          }
          resource.state = capture.status === 404 || capture.status === 410 ? 'absent'
            : capture.status >= 200 && capture.status < 300 ? 'exists' : 'unavailable';
          if (kind !== 'target' && resource.state === 'exists') {
            resource.discovery = discovery(kind, capture.body, resource.http.content_type);
          }
          break;
        }
      } catch (error) {
        const code = error instanceof ReconnaissanceError ? error.code : 'NETWORK_FAILED';
        resource.reason = code;
        // current was explicitly authorized before connection; a rejected Location is never echoed.
        if (code !== 'SCOPE_BLOCKED') resource.failed_url = safeUrl(current);
        resource.state = ['SCOPE_BLOCKED', 'NETWORK_BLOCKED', 'PEER_MISMATCH'].includes(code) ? 'blocked'
          : ['BODY_LIMIT', 'REQUEST_LIMIT', 'REDIRECT_LIMIT', 'TIMEOUT'].includes(code) ? 'limited' : 'unavailable';
        if (code === 'TLS_FAILED') {
          resource.tls = { validated: false, hostname_matches: 'undetermined', error: 'TLS_FAILED' };
          result.warnings.push('INVALID_TLS_CERTIFICATE_DETAILS_UNAVAILABLE_NO_VALIDATION_BYPASS');
        }
      }
      result.resources.push(resource);
      // Only an actual HTTP response produces evidence; denial/timeout alone is not fabricated evidence.
      if (resource.http) this.observation(input, result, resource);
    }
    result.effective_url = result.resources[0].effective_url;
    const stack = candidates(result.resources);
    result.technologies = { state: stack.length ? 'candidates' : 'undetermined', candidates: stack };
    if (stack.length) result.warnings.push('TECHNOLOGY_CANDIDATES_REQUIRE_CONFIRMATION');
    result.status = !result.observations.length ? 'indeterminate'
      : result.resources.every(resource => ['exists', 'absent'].includes(resource.state)) ? 'completed' : 'partial';
    if (result.observations.length) {
      const latest = await this.context(input);
      if (context !== latest) throw new ReconnaissanceError('CONTEXT_CHANGED');
      const writes: KnowledgeWrite[] = [];
      for (const observation of result.observations) {
        const trace: KnowledgeTrace = { source: 'http_reconnaissance', recorded_by: 'recon',
          recorded_at: observation.observed_at, reason: 'Bounded authorized HTTP observation',
          review: 'unreviewed', environment_id: input.environment.environment_id,
          evidence_refs: [{ kind: 'evidence', id: observation.evidence.id, revision: 1 }] };
        writes.push({ kind: 'evidence', entity: observation.evidence, expected_revision: 0,
          trace: { ...trace, evidence_refs: [] } },
        { kind: 'observation', entity: observation, expected_revision: 0, trace });
      }
      try { await this.store.commit(input.application_id, writes); }
      catch { throw new ReconnaissanceError('PERSISTENCE_FAILED'); }
    }
    result.budget.elapsed_ms = Date.now() - started;
    return result;
  }

  private async context(input: ReconnaissanceInput): Promise<string> {
    try {
      const app = await this.store.get(input.application_id, 'application', input.application_id);
      const env = await this.store.get(input.application_id, 'environment', input.environment.environment_id);
      if (!app || !env || !isDeepStrictEqual(env.entity, input.environment)) throw new ReconnaissanceError('CONTEXT_REQUIRED');
      return `${app.revision}:${env.revision}`;
    } catch { throw new ReconnaissanceError('CONTEXT_REQUIRED'); }
  }

  private observation(input: ReconnaissanceInput, result: ReconnaissanceResult, resource: ReconResource): void {
    const timestamp = new Date().toISOString();
    const evidenceId = randomUUID();
    const evidence: MultimodalEvidenceRef = { id: evidenceId, kind: 'http_recon_metadata',
      uri: `urn:qap:recon:${result.execution_id}:${evidenceId}`, pii_masked: true, captured_at: timestamp,
      session_id: result.execution_id, metadata: { source: 'bounded_http_get', resource: structuredClone(resource) } };
    const observation: ApplicationObservation = { id: randomUUID(), application_id: input.application_id,
      environment_id: input.environment.environment_id, kind: 'network_traffic', observed_by: 'recon',
      observed_at: timestamp, session_id: result.execution_id, evidence,
      network_event: { url: resource.effective_url, method: 'GET', status: resource.http!.status },
      raw_payload: { resource: structuredClone(resource) } };
    result.evidence.push(evidence);
    result.observations.push(observation);
  }
}
