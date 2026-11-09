import { createHash } from 'node:crypto';

import { KnowledgeStoreError, type IKnowledgeStore, type KnowledgeRecord, type KnowledgeWrite } from '@qap/engine';
import type { AgentInference } from '@qap/shared';

const object = (v: unknown): Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {};
const uuid = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const route = (v: unknown): v is string => typeof v === 'string' && /^urn:qap:route:[0-9a-f]{64}$/.test(v);
const endpoint = (v: unknown): v is string => typeof v === 'string' && /^urn:qap:network:[0-9a-f]{64}$/.test(v);
function boundedData(value: unknown): boolean {
  const pending: Array<[unknown, number]> = [[value, 0]];
  let nodes = 0;
  while (pending.length) {
    const [v, depth] = pending.pop()!;
    if (++nodes > 8192 || depth > 12 || (typeof v === 'string' && v.length > 16384)) return false;
    if (v && typeof v === 'object') {
      const values = Object.values(v);
      if (values.length > 512 || pending.length + values.length > 8192) return false;
      values.forEach(child => pending.push([child, depth + 1]));
    }
  }
  return true;
}
const digest = (v: unknown) => createHash('sha256').update(JSON.stringify(v)).digest('hex');
const list = (v: unknown): unknown[] => Array.isArray(v) && v.length <= 256 ? v as unknown[] : [];
type Observation = KnowledgeRecord<'observation'>;
export type InferenceDecision = 'insufficient_evidence' | 'contradictory_evidence' | 'uncorrelatable_identity' |
  'invalid_reference' | 'incompatible_context' | 'source_not_persisted' | 'insufficient_coverage' |
  'processing_limit' | 'unsupported_source' | 'invalid_cursor' | 'conflict' | 'store_unavailable';
export interface InferenceFactors {
  policy: 'heuristic-v1'; relevant_evidence: number; independent_sources: number; agreement: number;
  reproducibility: number; provenance: number; coverage: 'partial'; event_quality: number;
  contradictions: number; age_policy: 'no_decay'; acquisition_cap: number; score: number;
  band: 'low' | 'moderate' | 'strong';
}
/** Evidence strength, never a calibrated probability. Duplicates share an evidence unit. */
export function calculateInferenceConfidence(input: {
  evidence_units: number; independent_sources: number; contradictions: number; event_quality: number;
}): InferenceFactors {
  const count = (n: number, max: number) => Number.isFinite(n) ? Math.max(0, Math.min(max, Math.floor(n))) : 0;
  const relevant = count(input.evidence_units, 8);
  const independent = count(input.independent_sources, 3);
  const contradictions = count(input.contradictions, 8);
  const quality = Math.max(0, Math.min(1, Number.isFinite(input.event_quality) ? input.event_quality : 0));
  const agreement = Math.min(0.12, Math.max(0, relevant - 1) * 0.03);
  const reproducibility = Math.min(0.12, Math.max(0, independent - 1) * 0.06);
  const score = relevant === 0 ? 0 : Number(Math.max(0, Math.min(0.72,
    0.35 + 0.1 + agreement + reproducibility + quality * 0.1 - contradictions * 0.2)).toFixed(3));
  return { policy: 'heuristic-v1', relevant_evidence: relevant, independent_sources: independent, agreement,
    reproducibility, provenance: relevant ? 0.1 : 0, coverage: 'partial', event_quality: quality,
    contradictions, age_policy: 'no_decay', acquisition_cap: 0.72, score,
    band: score < 0.4 ? 'low' : score < 0.65 ? 'moderate' : 'strong' };
}
export interface InferenceEngineInput {
  application_id: string; environment_id: string;
  /** Optional selection is resolved from storage; missing IDs are never accepted as evidence. */
  observation_ids?: string[];
  limits?: { observations?: number; candidates?: number; timeout_ms?: number };
}
export interface InferenceEngineResult {
  status: 'completed' | 'abstained' | 'rejected'; processed: number;
  decisions: Array<{ code: InferenceDecision; count: number }>;
  hypotheses: Array<{ inference: AgentInference; factors: InferenceFactors; revision: number;
    change: 'created' | 'recalculated' | 'unchanged'; evidence_added: number; evidence_removed: number }>;
}
interface Fact { record: Observation; evidence: KnowledgeRecord<'evidence'>; payload: Record<string, unknown>; session: string }
interface Candidate { rule: string; target: AgentInference['target_type']; key: unknown; text: string; facts: Fact[]; quality: number; contradictions: number }

/** Purely local inference orchestration over the v1 port. No browser, credentials or network. */
export class KnowledgeInferenceEngine {
  constructor(private readonly store: IKnowledgeStore) {}

  async run(input: InferenceEngineInput): Promise<InferenceEngineResult> {
    const result: InferenceEngineResult = { status: 'abstained', processed: 0, decisions: [], hypotheses: [] };
    const decision = (code: InferenceDecision) => {
      const prior = result.decisions.find(d => d.code === code);
      if (prior) prior.count++; else result.decisions.push({ code, count: 1 });
    };
    const bounded = (v: number | undefined, fallback: number, max: number) => v === undefined ? fallback :
      Number.isSafeInteger(v) && v > 0 && v <= max ? v : 0;
    const max = bounded(input?.limits?.observations, 500, 1000);
    const candidateMax = bounded(input?.limits?.candidates, 24, 32);
    const timeout = bounded(input?.limits?.timeout_ms, 5000, 30000);
    const identity = (v: unknown): v is string => typeof v === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(v);
    if (!input || !identity(input.application_id) || !identity(input.environment_id) || !max || !candidateMax || !timeout ||
      (input.observation_ids !== undefined && (!Array.isArray(input.observation_ids) || input.observation_ids.length > max || !input.observation_ids.every(uuid)))) {
      decision('invalid_reference'); result.status = 'rejected'; return result;
    }
    const app = input.application_id; const env = input.environment_id;
    const deadline = performance.now() + timeout;
    const checkTime = () => { if (performance.now() > deadline) throw new KnowledgeStoreError('UNAVAILABLE', 'Inference budget'); };
    try {
      const context = async () => {
        const a = await this.store.get(app, 'application', app);
        const e = await this.store.get(app, 'environment', env);
        if (!a || !e || a.application_id !== app || e.entity.application_id !== app) return null;
        return `${a.revision}:${e.revision}`;
      };
      const original = await context();
      if (!original) { decision('incompatible_context'); result.status = 'rejected'; return result; }
      const records: Observation[] = [];
      if (input.observation_ids) {
        for (const id of [...new Set(input.observation_ids)].sort()) {
          checkTime();
          const record = await this.store.get(app, 'observation', id);
          if (!record) decision('source_not_persisted'); else records.push(record);
        }
      } else {
        let cursor: string | undefined;
        do {
          checkTime();
          const page = await this.store.query(app, 'observation', { limit: Math.min(100, max - records.length), ...(cursor ? { cursor } : {}) });
          records.push(...page.items); cursor = page.next_cursor;
          if (records.length >= max && cursor) { decision('processing_limit'); return result; }
        } while (cursor);
      }
      const facts: Fact[] = [];
      for (const record of records) {
        checkTime(); result.processed++;
        if (!boundedData(record)) { decision('processing_limit'); continue; }
        const o = record.entity;
        if (!uuid(record.id) || record.revision !== 1 || o.id !== record.id || record.application_id !== app || o.application_id !== app ||
          o.environment_id !== env || record.trace.environment_id !== env || record.trace.role_id || record.trace.auth_profile_id) {
          decision('incompatible_context'); continue;
        }
        if (!uuid(o.session_id) || !uuid(o.evidence.id) || !Number.isFinite(Date.parse(o.observed_at))) { decision('invalid_reference'); continue; }
        const pin = record.references.find(r => r.kind === 'evidence' && r.id === o.evidence.id);
        const environmentPin = record.references.find(r => r.kind === 'environment' && r.id === env);
        const appPin = record.references.find(r => r.kind === 'application' && r.id === app);
        if (!pin?.revision || !environmentPin?.revision || !appPin?.revision) { decision('invalid_reference'); continue; }
        const evidence = await this.store.get(app, 'evidence', pin.id, pin.revision);
        const historical = await this.store.get(app, 'observation', record.id, record.revision);
        const historicalEnvironment = await this.store.get(app, 'environment', env, environmentPin.revision);
        if (!evidence || !historical || !historicalEnvironment || !boundedData(evidence) || digest(historical) !== digest(record) ||
          evidence.entity.pii_masked !== true || evidence.entity.session_id !== o.session_id ||
          evidence.application_id !== app || evidence.trace.source !== record.trace.source || evidence.trace.recorded_by !== record.trace.recorded_by ||
          evidence.trace.environment_id !== env || digest(evidence.entity) !== digest(o.evidence)) { decision('invalid_reference'); continue; }
        if (`${appPin.revision}:${environmentPin.revision}` !== original) { decision('incompatible_context'); continue; }
        const source = record.trace.source;
        const metadata = object(evidence.entity.metadata);
        if (!((source === 'blackbox_crawler' && o.observed_by === 'crawler' && record.trace.recorded_by === 'crawler' && metadata.source === 'static_dom_structure' && evidence.entity.kind === 'dom_snippet') ||
          (source === 'network_traffic_observer' && o.observed_by === 'crawler' && record.trace.recorded_by === 'crawler' && metadata.source === 'browser_network_gateway' && evidence.entity.kind === 'http_recon_metadata') ||
          (source === 'http_reconnaissance' && o.observed_by === 'recon' && record.trace.recorded_by === 'recon' && metadata.source === 'bounded_http_get' && evidence.entity.kind === 'http_recon_metadata'))) {
          decision('unsupported_source'); continue;
        }
        if (source === 'blackbox_crawler') {
          const p = object(o.raw_payload); const view = object(metadata.view);
          if (!uuid(p.view_id) || p.view_id !== view.id || !route(view.route) ||
            !['static_snapshot', 'loading_or_script_dependent'].includes(String(view.state)) ||
            (o.kind === 'navigation_route' && (p.route !== view.route || p.state !== view.state)) ||
            (o.kind === 'dom_element' && (digest(p.controls) !== digest(view.controls) || digest(p.forms) !== digest(view.forms)))) {
            decision('invalid_reference'); continue;
          }
        }
        facts.push({ record, evidence, payload: object(o.raw_payload), session: o.session_id });
      }
      const candidates: Candidate[] = [];
      const add = (rule: string, target: Candidate['target'], key: unknown, text: string, support: Fact[], quality = 1, contradictions = 0) => {
        if (support.length > 16 || candidates.length >= candidateMax) { decision('processing_limit'); return; }
        candidates.push({ rule, target, key, text, facts: support, quality, contradictions });
      };
      for (const fact of facts) {
        checkTime();
        const { record, payload: p, session } = fact;
        if (record.trace.source === 'network_traffic_observer') {
          if (record.entity.kind !== 'network_traffic' || p.execution_id !== session || !uuid(p.view_id) || !uuid(p.id) || p.evidence_id !== fact.evidence.id ||
            !['fetch', 'xhr', 'other'].includes(String(p.request_type)) || !endpoint(p.endpoint_ref) ||
            !['responded', 'blocked', 'inconclusive'].includes(String(p.outcome)) ||
            !['authorized', 'denied', 'undetermined'].includes(String(p.scope_status)) ||
            (p.outcome !== 'responded' && p.http_status !== undefined) ||
            digest(object(fact.evidence.entity.metadata).event) !== digest(p)) { decision('invalid_reference'); continue; }
          const key = [session, p.view_id, p.endpoint_ref, ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].includes(String(p.method)) ? p.method : 'other'];
          // No successful-service claim is inferred, even from a 200 response.
          if (p.outcome === 'responded' && p.scope_status === 'authorized' && Number.isInteger(p.http_status) && Number(p.http_status) >= 100 && Number(p.http_status) <= 599) {
            if (p.http_status === 503) add('remote-503', 'risk_assessment', key, 'A remote HTTP 503 was observed; its cause is unknown and no product defect is established.', [fact]);
          } else if (p.outcome === 'blocked' && p.http_status === undefined) {
            add('gateway-block', 'risk_assessment', key, 'Acquisition was blocked before a remote response; server rejection is not established.', [fact], 0.5);
          } else { decision('insufficient_evidence'); }
          add('partial-network', 'risk_assessment', [session, p.view_id], 'The passive network window provides partial coverage; endpoint absence and inventory completeness cannot be established.', [fact], 0.5);
          decision('uncorrelatable_identity');
        } else if (record.trace.source === 'http_reconnaissance') {
          const resource = object(p.resource); const http = object(resource.http);
          if (record.entity.kind === 'network_traffic' && http.status === 503 && resource.state === 'unavailable' && digest(resource) === digest(object(fact.evidence.entity.metadata).resource))
            add('recon-503', 'risk_assessment', [session, ['target', 'robots', 'sitemap'].includes(String(resource.resource)) ? resource.resource : 'other'],
              'A remote HTTP 503 was observed during reconnaissance; its cause is unknown.', [fact]);
          else decision('insufficient_evidence');
        } else if (record.entity.kind === 'navigation_route') {
          const view = object(object(fact.evidence.entity.metadata).view);
          if (!uuid(p.view_id) || view.id !== p.view_id || view.route !== p.route || !route(p.route) || view.state !== p.state ||
            !['static_snapshot', 'loading_or_script_dependent'].includes(String(p.state))) { decision('invalid_reference'); continue; }
          if (p.state === 'loading_or_script_dependent') add('script-dependent', 'risk_assessment', [session, p.view_id],
            'The static snapshot may depend on JavaScript; dynamic behavior remains unobserved.', [fact], 0.5);
          for (const raw of list(view.links)) {
            checkTime();
            const link = object(raw);
            if (!route(link.target) || !Number.isInteger(link.control_index) || typeof link.authorized !== 'boolean') { decision('invalid_reference'); continue; }
            const target = facts.find(f => f.session === session && f.record.entity.kind === 'navigation_route' && f.payload.route === link.target && f.record.trace.source === 'blackbox_crawler');
            add('link', 'view_topology', [session, p.view_id, link.target], link.authorized === false ?
              'A link target was outside acquisition authorization; remote accessibility and traversal remain unknown.' : target ?
              'A link points to a separately captured view; traversal of this link was not observed.' :
              'A link suggests a potential view relation; the target was not captured in the selected evidence.', target && link.authorized ? [fact, target] : [fact], 0.7);
            if (!target) decision('insufficient_coverage');
          }
        } else if (record.entity.kind === 'dom_element') {
          const view = object(object(fact.evidence.entity.metadata).view);
          if (!uuid(p.view_id) || view.id !== p.view_id || digest(p.controls) !== digest(view.controls)) { decision('invalid_reference'); continue; }
          for (const raw of list(p.controls)) {
            checkTime();
            const control = object(raw);
            if (!Number.isInteger(control.index) || Number(control.index) < 0 || Number(control.index) > 255 ||
              !['input', 'select', 'button', 'a', 'textarea', 'form'].includes(String(control.tag)) ||
              typeof control.required_in_dom !== 'boolean' || typeof control.disabled !== 'boolean') continue;
            const contradictory = facts.some(other => other !== fact && other.session === session && other.record.entity.kind === 'dom_element' &&
              other.payload.view_id === p.view_id && list(other.payload.controls).some(rawOther => {
                const otherControl = object(rawOther);
                return otherControl.index === control.index && otherControl.tag === control.tag &&
                  (otherControl.required_in_dom !== control.required_in_dom || otherControl.disabled !== control.disabled);
              }));
            if (contradictory) { decision('contradictory_evidence'); continue; }
            add('control', 'interactive_target', [session, p.view_id, control.index],
              'A structural control may be an interaction target; DOM attributes do not establish business requirements or successful interaction.', [fact], 0.7);
          }
        }
      }
      const links = candidates.filter(c => c.rule === 'link');
      // A reciprocal pair plus form structure is a local cluster hypothesis, not a confirmed module.
      for (const first of links) {
        const from = first.facts[0]; const to = first.facts[1];
        if (!to || from.record.id >= to.record.id) continue;
        const reciprocal = links.some(c => c.facts[0] === to && c.facts[1] === from);
        const structured = [from, to].every(f => list(object(object(f.evidence.entity.metadata).view).forms).length > 0);
        if (reciprocal && structured) add('local-cluster', 'module_boundary', [from.session, ...[from.payload.view_id, to.payload.view_id].sort()],
          'Reciprocal links and form structures suggest a local functional cluster; module ownership and boundaries remain unconfirmed.', [from, to], 0.5);
      }
      // Link chains use captured views only, never invented or executed steps.
      for (const first of links) {
        const from = first.facts[0]; const middle = first.facts[1];
        if (!middle) continue;
        const second = links.find(c => c.facts[0] === middle && c.facts[1] && c.facts[1] !== from);
        if (second) add('link-chain', 'flow_hypothesis', [from.session, from.payload.view_id, middle.payload.view_id, second.facts[1].payload.view_id],
          'Two compatible links suggest a potential sequence across captured views; no steps or form completion were executed.',
          [from, middle, second.facts[1]], 0.5);
      }
      decision('insufficient_evidence'); // No authoritative business-rule evidence; no automatic promotion.
      // Merge repeated events before scoring, preserving all selected support revision pins.
      const merged = new Map<string, Candidate>();
      for (const c of candidates) {
        const id = `inference-${digest(['v1', app, env, c.rule, c.key])}`;
        const previous = merged.get(id);
        const support = [...new Map([...(previous?.facts ?? []), ...c.facts].map(f => [f.record.id, f])).values()];
        if (support.length > 16) decision('processing_limit');
        if (previous) previous.facts = support.slice(0, 16);
        else merged.set(id, { ...c, facts: support.slice(0, 16) });
      }
      const writes: KnowledgeWrite[] = [];
      for (const [id, c] of merged) {
        checkTime();
        // Same-window repeats share one event unit. Distinct captured views are relevant,
        // but never independent repetitions of a browser experiment.
        const units = new Set(c.facts.map(f => f.record.trace.source === 'network_traffic_observer' ?
          digest([f.session, f.payload.endpoint_ref, f.payload.method, f.payload.outcome, f.payload.http_status ?? null]) : digest([f.session, f.payload.view_id ?? f.evidence.id])));
        const factors = calculateInferenceConfidence({ evidence_units: units.size, independent_sources: 1, contradictions: c.contradictions, event_quality: c.quality });
        const existing = await this.store.get(app, 'inference', id);
        if (existing && (existing.trace.source !== 'knowledge_inference_v1' || existing.trace.environment_id !== env || existing.entity.status === 'refuted' || existing.trace.review === 'reviewed')) {
          decision('conflict'); continue;
        }
        const ids = c.facts.map(f => f.record.id).sort();
        const previousIds = existing?.entity.supporting_observation_ids ?? [];
        // Never replace a larger support set with a partial selection.
        if (previousIds.some(old => !ids.includes(old))) { decision('insufficient_coverage'); continue; }
        const now = new Date().toISOString();
        const reasoning = JSON.stringify({ rule: c.rule, factors, evidence_added: ids.filter(i => !previousIds.includes(i)).length, evidence_removed: 0 });
        const inference: AgentInference = { id, application_id: app, target_type: c.target, hypothesis: c.text,
          confidence: factors.score, confidence_score: factors.score, reasoning, status: 'inferred',
          supporting_observation_ids: ids, created_at: existing?.entity.created_at ?? now, updated_at: now, requires_human_confirmation: true };
        const unchanged = existing && digest([previousIds, existing.entity.confidence_score, existing.entity.hypothesis]) === digest([ids, factors.score, c.text]);
        result.hypotheses.push({ inference: unchanged ? existing.entity : inference, factors, revision: unchanged ? existing.revision : (existing?.revision ?? 0) + 1,
          change: unchanged ? 'unchanged' : existing ? 'recalculated' : 'created', evidence_added: ids.filter(i => !previousIds.includes(i)).length, evidence_removed: 0 });
        if (!unchanged) writes.push({ kind: 'inference', entity: inference, expected_revision: existing?.revision ?? 0,
          trace: { source: 'knowledge_inference_v1', recorded_by: 'deterministic_engine', recorded_at: now,
            reason: reasoning, review: 'unreviewed', environment_id: env,
            evidence_refs: [...new Map(c.facts.map(f => [f.evidence.id, { kind: 'evidence' as const, id: f.evidence.id, revision: f.evidence.revision }])).values()] } });
      }
      checkTime();
      if (await context() !== original) { result.hypotheses = []; decision('incompatible_context'); result.status = 'rejected'; return result; }
      if (writes.length) await this.store.commit(app, writes);
      result.status = result.hypotheses.length ? 'completed' : 'abstained';
      return result;
    } catch (error) {
      result.hypotheses = []; result.status = 'rejected';
      decision(performance.now() > deadline ? 'processing_limit' : error instanceof KnowledgeStoreError && error.code === 'INVALID_CURSOR' ? 'invalid_cursor' :
        error instanceof KnowledgeStoreError && error.code === 'CONFLICT' ? 'conflict' : 'store_unavailable');
      return result;
    }
  }
}
