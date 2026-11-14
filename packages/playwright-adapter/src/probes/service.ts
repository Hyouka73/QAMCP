import { randomUUID } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';

import type { IKnowledgeStore, KnowledgeTrace, KnowledgeWrite } from '@qap/engine';
import type { Page } from 'playwright-core';

import type { CrawlerDependencies } from '../crawler/types.js';
import { NetworkTrafficObserver } from '../network-observer/service.js';

import { executeEmptyProbe } from './dom.js';
import { ActiveProbeError, type ActiveProbeInput, type ActiveProbeLimits, type ActiveProbeResult, type ProbeTrial } from './types.js';

const defaults: ActiveProbeLimits = { trials: 2, total_timeout_ms: 40000, trial_timeout_ms: 15000,
  action_window_ms: 100, max_controls: 100, max_dom_nodes: 500, max_validation_events: 100, max_dom_changes: 500 };
const caps: ActiveProbeLimits = { trials: 3, total_timeout_ms: 60000, trial_timeout_ms: 20000,
  action_window_ms: 1000, max_controls: 200, max_dom_nodes: 1000, max_validation_events: 200, max_dom_changes: 1000 };

/** Internal single-use observer. The only additional operation is the closed probe catalog. */
class TrialObserver extends NetworkTrafficObserver {
  outcome?: Awaited<ReturnType<typeof executeEmptyProbe>>;
  protected override get nativeFormValidation(): boolean { return this.input.probe === 'protected_empty_submit'; }
  protected override get recordNetworkObservations(): boolean { return false; }
  constructor(store: IKnowledgeStore, dependencies: CrawlerDependencies, private readonly input: ActiveProbeInput,
    private readonly limits: ActiveProbeLimits, private readonly authorized: () => Promise<boolean>) { super(store, dependencies); }
  protected override async inspectSealedPage(page: Page, signal: AbortSignal) {
    if (signal.aborted || !await this.authorized() || signal.aborted) return;
    this.outcome = await executeEmptyProbe(page, this.input, this.limits);
  }
}

export class ActiveObservationProbe {
  constructor(private readonly store: IKnowledgeStore, private readonly dependencies: CrawlerDependencies = {}) {}

  async run(request: ActiveProbeInput): Promise<ActiveProbeResult> {
    let input: ActiveProbeInput, limits: ActiveProbeLimits;
    try {
      input = structuredClone({ ...request, signal: undefined });
      limits = { ...defaults, ...input.limits };
      if (input.isolation !== 'fresh_anonymous_disposable' || input.environment.is_production !== false ||
        input.environment.headers !== undefined || input.application_id !== input.environment.application_id ||
        input.authorization.nonproduction_disposable_acknowledged !== true || input.authorization.empty_validation_only !== true ||
        input.authorization.read_only_acknowledged !== true ||
        !['native_empty_validation', 'protected_empty_submit'].includes(input.probe) ||
        !/^[\w.:-]{1,128}$/.test(input.application_id) || !/^[\w.:-]{1,128}$/.test(input.environment.environment_id)) throw new ActiveProbeError('INVALID_INPUT');
      const selector = input.authorization.form_selector;
      if (typeof selector !== 'string' || selector.length > 512 || !/^(?:(?:html|body|main|div|section|article|form)(?::nth-of-type\([1-9][0-9]{0,2}\))? > )*form(?::nth-of-type\([1-9][0-9]{0,2}\))?$/.test(selector)) throw new ActiveProbeError('INVALID_INPUT');
      if (input.limits && Object.keys(input.limits).some(k => !Object.hasOwn(defaults, k))) throw new ActiveProbeError('INVALID_INPUT');
      for (const key of Object.keys(caps) as Array<keyof ActiveProbeLimits>) {
        if (!Number.isSafeInteger(limits[key]) || limits[key] < 1 || limits[key] > caps[key]) throw new ActiveProbeError('INVALID_INPUT');
      }
      // No acquisition API calls: only explicitly enumerated document/scripts/CSS.
      if (input.authorization.api_read_urls.length || input.authorization.navigation_urls.length !== 1 ||
        input.authorization.navigation_urls[0] !== input.target_url) throw new ActiveProbeError('INVALID_INPUT');
    } catch { throw new ActiveProbeError('INVALID_INPUT'); }
    const original = await this.context(input);
    const result: ActiveProbeResult = { execution_id: randomUUID(), status: 'blocked', trials: [], observations: [],
      evidence: [], persistence: 'not_attempted', limits, warnings: ['OBSERVATIONAL_CONSISTENCY_ONLY',
        'NO_OS_MEMORY_OR_PROCESS_SANDBOX_CERTIFICATION', 'ACQUISITION_GET_SEMANTICS_REQUIRE_EXPLICIT_CONSENT'] };
    const signal = AbortSignal.any([AbortSignal.timeout(limits.total_timeout_ms), ...(request.signal ? [request.signal] : [])]);
    for (let index = 0; index < limits.trials; index++) {
      if (signal.aborted) { result.warnings.push('CANCELLED_OR_DEADLINE'); break; }
      if (!await this.unchanged(input, original)) { result.warnings.push('CONTEXT_CHANGED'); break; }
      if (signal.aborted) { result.warnings.push('CANCELLED_OR_DEADLINE'); break; }
      const observer = new TrialObserver(this.store, this.dependencies, input, limits,
        async () => await this.unchanged(input, original));
      try {
        const acquired = await observer.run({ application_id: input.application_id, environment: input.environment,
          target_url: input.target_url, isolation: 'fresh_anonymous_dynamic_readonly',
          authorization: { read_only_acknowledged: true, navigation_urls: input.authorization.navigation_urls,
            script_urls: input.authorization.script_urls, presentation_urls: input.authorization.presentation_urls,
            api_read_urls: [], allowed_ips: input.authorization.allowed_ips,
            allow_public_network: input.authorization.allow_public_network },
          limits: { ...input.acquisition_limits, total_timeout_ms: Math.min(limits.trial_timeout_ms,
            input.acquisition_limits?.total_timeout_ms ?? limits.trial_timeout_ms) }, tls_ca: input.tls_ca, signal });
        const outcome = observer.outcome;
        const trial: ProbeTrial = { session_id: acquired.execution_id, status: outcome?.status ?? 'indeterminate',
          acquisition_requests: acquired.budget.requests, denied_requests: acquired.budget.denied_requests,
          ...(outcome?.status === 'executed' ? { output: outcome.output, observed_at: new Date().toISOString() }
            : { reason: outcome?.reason ?? 'ACQUISITION_OR_ACTION_INCOMPLETE' }) };
        result.trials.push(trial);
        if (trial.status !== 'executed' || signal.aborted) break;
      } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'CLEANUP_FAILED') throw new ActiveProbeError('CLEANUP_FAILED');
        result.warnings.push('TRIAL_FAILED'); break;
      }
    }
    const executed = result.trials.filter(t => t.status === 'executed');
    const comparable = executed.length === limits.trials && executed.length >= 2 &&
      executed.every(t => !t.output!.truncated);
    result.status = comparable ? (executed.every(t => isDeepStrictEqual(t.output, executed[0].output))
      ? 'consistent' : 'inconsistent') : executed.length || result.trials.some(t => t.status === 'indeterminate')
      ? 'indeterminate' : 'blocked';
    for (const trial of executed) {
      const evidence = { id: randomUUID(), kind: 'dom_snippet' as const, pii_masked: true,
        uri: `urn:qap:probe:${result.execution_id}:${trial.session_id}`, captured_at: trial.observed_at!,
        session_id: trial.session_id, metadata: { source: 'active_empty_form_probe', operation: input.probe,
          structure: structuredClone(trial.output!) } };
      result.evidence.push(evidence);
      result.observations.push({ id: randomUUID(), application_id: input.application_id,
        environment_id: input.environment.environment_id, kind: 'probe_result', observed_by: 'active_probe',
        observed_at: trial.observed_at!, session_id: trial.session_id, evidence,
        probe_execution: { action: input.probe, target_selector: input.authorization.form_selector,
          observed_output: { comparison: result.status, structure: structuredClone(trial.output!) },
          reproducible: result.status === 'consistent', trials_count: executed.length } });
    }
    if (executed.length) {
      try {
        if (!await this.unchanged(input, original)) { result.warnings.push('CONTEXT_CHANGED'); return result; }
        const trace: KnowledgeTrace = { source: 'active_observation_probe', recorded_by: 'active_probe',
          recorded_at: new Date().toISOString(), reason: 'Executed empty form observation; no business correctness assertion',
          review: 'unreviewed', environment_id: input.environment.environment_id, evidence_refs: [] };
        const writes: KnowledgeWrite[] = result.observations.flatMap(o => [
          { kind: 'evidence', entity: o.evidence, expected_revision: 0, trace },
          { kind: 'observation', entity: o, expected_revision: 0,
            trace: { ...trace, evidence_refs: [{ kind: 'evidence', id: o.evidence.id, revision: 1 }] } },
        ]);
        await this.store.commit(input.application_id, writes); result.persistence = 'committed';
      } catch { result.persistence = 'failed'; result.warnings.push('PERSISTENCE_FAILED'); }
    }
    return result;
  }

  private async unchanged(input: ActiveProbeInput, original: string): Promise<boolean> {
    try { return await this.context(input) === original; } catch { return false; }
  }

  private async context(input: ActiveProbeInput): Promise<string> {
    try {
      const app = await this.store.get(input.application_id, 'application', input.application_id);
      const env = await this.store.get(input.application_id, 'environment', input.environment.environment_id);
      if (!app || !env || !isDeepStrictEqual(env.entity, input.environment)) throw new ActiveProbeError('INVALID_INPUT');
      return `${app.revision}:${env.revision}`;
    } catch { throw new ActiveProbeError('CONTEXT_REQUIRED'); }
  }
}
