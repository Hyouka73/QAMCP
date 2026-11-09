import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';

import { KnowledgeStoreError, type IKnowledgeStore, type KnowledgeRecord, type KnowledgeWrite } from '@qap/engine';
import { FileSystemStorage } from '@qap/knowledge';

/** Privileged host declaration, never derived from a tool argument or a title match. */
export interface ModuleBinding {
  readonly plannedName: string;
  readonly moduleId: string;
  readonly moduleKey: string;
  readonly moduleRevision: number;
  readonly applicationRevision: number;
  readonly environmentRevision: number;
  readonly provenance: 'host_declared';
}
export interface BridgeContext {
  projectRoot: string; applicationId: string; environmentId: string;
  moduleBindings?: readonly ModuleBinding[];
}
export interface AssociationReceipt {
  version: 1; binding: string; execution: string;
  observations: string[];
}
export type AssociationStatus = 'not_attempted' | 'blocked' | 'confirmed' | 'incomplete' | 'conflict' | 'context_changed' | 'persistence_failed';
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(value);
const source = 'module_observation_bridge_v1';
const bindingHash = (context: BridgeContext, link: ModuleBinding, lifecycle: unknown) => hash([context.projectRoot, context.applicationId, context.environmentId,
  [link.plannedName, link.moduleId, link.moduleKey, link.moduleRevision, link.applicationRevision, link.environmentRevision, link.provenance], lifecycle]);
const relationId = (receipt: AssociationReceipt, id: string) => `bridge:${hash([receipt.binding, receipt.execution, id])}`;
const object = (value: unknown): Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
function validRelation(record: KnowledgeRecord<'relation'>, entity: KnowledgeRecord<'relation'>['entity'], receipt: AssociationReceipt,
  evidence: KnowledgeRecord<'evidence'>, context: BridgeContext, link: ModuleBinding): boolean {
  const expected = [{ kind: 'application', id: context.applicationId, revision: link.applicationRevision },
    { kind: 'environment', id: context.environmentId, revision: link.environmentRevision },
    { kind: 'evidence', id: evidence.id, revision: evidence.revision }, entity.source, entity.target];
  return record.application_id === context.applicationId && record.revision === 1 && isDeepStrictEqual(record.entity, entity) &&
    record.trace.source === source && record.trace.recorded_by === 'mcp_host' && record.trace.review === 'unreviewed' &&
    !record.trace.role_id && !record.trace.auth_profile_id && record.trace.reason === JSON.stringify(receipt) && record.trace.environment_id === context.environmentId &&
    isDeepStrictEqual(record.trace.evidence_refs, [{ kind: 'evidence', id: evidence.id, revision: evidence.revision }]) &&
    record.references.length === expected.length && expected.every(pin => record.references.some(r => r.kind === pin.kind && r.id === pin.id && r.revision === pin.revision));
}

/** Two independent transactions: acquisition belongs to the crawler; only edges are written here.
 * A receipt must be retained by the privileged host when all edge writes fail. No re-crawl.
 */
export class ModuleObservationBridge {
  private readonly context: BridgeContext;
  constructor(private readonly store: IKnowledgeStore, context: BridgeContext) {
    this.context = { projectRoot: context.projectRoot, applicationId: context.applicationId,
      environmentId: context.environmentId, moduleBindings: context.moduleBindings && structuredClone(context.moduleBindings) };
  }

  async resolve(plannedName: string) {
    const matches = this.context.moduleBindings?.filter(b => b.plannedName === plannedName) ?? [];
    if (matches.length !== 1) return { status: matches.length ? 'ambiguous' : 'unbound' } as const;
    const link = matches[0];
    const lifecycle = await new FileSystemStorage({ rootDir: this.context.projectRoot }).getLifecycleState();
    const planned = lifecycle.session?.plan?.filter(p => p.module === plannedName) ?? [];
    const state = lifecycle.modules && Object.hasOwn(lifecycle.modules, plannedName) ? lifecycle.modules[plannedName].state : undefined;
    if (lifecycle.phase !== 'WORKING' || planned.length !== 1 || !state || ['closed', 'waived'].includes(state) || lifecycle.session?.auth?.required) return { status: 'context_changed' } as const;
    if (link.provenance !== 'host_declared' || ![link.moduleRevision, link.applicationRevision, link.environmentRevision].every(n => Number.isSafeInteger(n) && n > 0)) return { status: 'invalid_binding' } as const;
    const app = this.context.applicationId;
    const module = await this.store.get(app, 'module', link.moduleId);
    const application = await this.store.get(app, 'application', app);
    const environment = await this.store.get(app, 'environment', this.context.environmentId);
    if (!module || module.entity.id !== link.moduleId || module.entity.application_id !== app || module.entity.key !== link.moduleKey || !module.entity.is_active || module.entity.superseded_by) return { status: 'invalid_module' } as const;
    // Check both namespaces, including ID/key collisions; never use a fuzzy name lookup.
    let cursor: string | undefined;
    let inspected = 0;
    do {
      const page = await this.store.query(app, 'module', { limit: 100, ...(cursor ? { cursor } : {}) });
      if (page.items.some(m => m.id !== module.id && (m.entity.key === link.moduleKey || m.id === link.moduleKey || m.entity.key === link.moduleId))) return { status: 'ambiguous' } as const;
      inspected += page.items.length; cursor = page.next_cursor;
      if (cursor && inspected >= 1000) return { status: 'inventory_limit' } as const;
    } while (cursor);
    if (!application || !environment || environment.entity.application_id !== app || environment.entity.environment_id !== this.context.environmentId ||
      application.revision !== link.applicationRevision || environment.revision !== link.environmentRevision || module.revision !== link.moduleRevision) return { status: 'context_changed' } as const;
    return { status: 'resolved', link, module, fingerprint: bindingHash(this.context, link, { phase: lifecycle.phase, session: lifecycle.session, state }) } as const;
  }

  async receipt(plannedName: string, execution: string, observations: string[]): Promise<AssociationReceipt | undefined> {
    const identity = await this.resolve(plannedName);
    if (identity.status !== 'resolved' || !uuid(execution) || !observations.length || observations.length > 64 || !observations.every(uuid) || new Set(observations).size !== observations.length) return;
    return { version: 1, binding: identity.fingerprint, execution, observations: [...observations].sort() };
  }

  private async facts(receipt: AssociationReceipt, link: ModuleBinding) {
    const app = this.context.applicationId, env = this.context.environmentId;
    // A shortened receipt must not turn a subset into a completed execution.
    const runIds: string[] = [];
    let cursor: string | undefined, scanned = 0;
    do {
      const page = await this.store.query(app, 'observation', { references: { kind: 'environment', id: env, revision: link.environmentRevision }, limit: 100, ...(cursor ? { cursor } : {}) });
      for (const record of page.items) if (record.entity.session_id === receipt.execution) runIds.push(record.id);
      scanned += page.items.length; cursor = page.next_cursor;
      if (cursor && scanned >= 1000) throw new Error('invalid_fact');
    } while (cursor);
    if (!isDeepStrictEqual(runIds.sort(), receipt.observations)) throw new Error('invalid_fact');
    const facts: Array<{ observation: KnowledgeRecord<'observation'>; evidence: KnowledgeRecord<'evidence'> }> = [];
    for (const id of receipt.observations) {
      const observation = await this.store.get(app, 'observation', id, 1);
      if (!observation || observation.revision !== 1 || observation.id !== id || observation.application_id !== app) throw new Error('invalid_fact');
      const o = observation.entity;
      const pin = observation.references.find(r => r.kind === 'evidence' && r.id === o.evidence.id);
      const evidence = pin?.revision ? await this.store.get(app, 'evidence', pin.id, pin.revision) : null;
      const contextPin = (kind: 'application' | 'environment', identity: string, revision: number) => observation.references.some(r => r.kind === kind && r.id === identity && r.revision === revision);
      if (o.id !== id || o.application_id !== app || o.environment_id !== env || o.session_id !== receipt.execution || o.observed_by !== 'crawler' ||
        !['navigation_route', 'dom_element'].includes(o.kind) || observation.trace.source !== 'blackbox_crawler' || observation.trace.recorded_by !== 'crawler' ||
        observation.trace.environment_id !== env || observation.trace.role_id || observation.trace.auth_profile_id ||
        !contextPin('application', app, link.applicationRevision) || !contextPin('environment', env, link.environmentRevision) ||
        !evidence || !uuid(evidence.id) || evidence.entity.id !== evidence.id || evidence.application_id !== app || evidence.revision !== 1 || evidence.entity.session_id !== receipt.execution || evidence.entity.kind !== 'dom_snippet' ||
        evidence.trace.source !== 'blackbox_crawler' || evidence.trace.recorded_by !== 'crawler' || evidence.trace.environment_id !== env || evidence.trace.role_id || evidence.trace.auth_profile_id ||
        evidence.entity.pii_masked !== true || !isDeepStrictEqual(evidence.entity, o.evidence) ||
        !evidence.references.some(r => r.kind === 'application' && r.id === app && r.revision === link.applicationRevision) ||
        !evidence.references.some(r => r.kind === 'environment' && r.id === env && r.revision === link.environmentRevision) ||
        !observation.trace.evidence_refs.some(r => r.kind === 'evidence' && r.id === evidence.id && r.revision === evidence.revision) ||
        object(evidence.entity.metadata).source !== 'static_dom_structure') throw new Error('invalid_fact');
      const view = object(object(evidence.entity.metadata).view), payload = object(o.raw_payload);
      if (!uuid(view.id) || payload.view_id !== view.id || typeof view.route !== 'string' || !/^urn:qap:route:[a-f0-9]{64}$/.test(view.route) ||
        !Array.isArray(view.controls) || view.controls.length > 500 || !Array.isArray(view.forms) || view.forms.length > 500 || !Array.isArray(view.links) || view.links.length > 500 ||
        (o.kind === 'navigation_route' && (payload.route !== view.route || payload.state !== view.state)) ||
        (o.kind === 'dom_element' && (!isDeepStrictEqual(payload.controls, view.controls) || !isDeepStrictEqual(payload.forms, view.forms)))) throw new Error('invalid_fact');
      facts.push({ observation, evidence });
    }
    return facts;
  }

  async associate(plannedName: string, input: AssociationReceipt) {
    let confirmed = 0;
    const outcome = (status: AssociationStatus, code: string) => ({ association_status: status, code, associated_observations: confirmed, confirmed_relations: confirmed, coverage: 'partial' as const });
    try {
      let receipt = structuredClone(input);
      if (!receipt || Object.keys(receipt).sort().join(',') !== 'binding,execution,observations,version' || receipt.version !== 1 || !uuid(receipt.execution) || !/^[a-f0-9]{64}$/.test(receipt.binding) || !Array.isArray(receipt.observations) || !receipt.observations.length || receipt.observations.length > 64 ||
        !receipt.observations.every(uuid) || new Set(receipt.observations).size !== receipt.observations.length || !isDeepStrictEqual([...receipt.observations].sort(), receipt.observations)) return outcome('blocked', 'invalid_receipt');
      receipt = { version: 1, binding: receipt.binding, execution: receipt.execution, observations: receipt.observations };
      const identity = await this.resolve(plannedName);
      if (identity.status !== 'resolved') return outcome(identity.status === 'context_changed' ? 'context_changed' : 'blocked', identity.status);
      if (receipt.binding !== identity.fingerprint) return outcome('context_changed', 'binding_changed');
      const facts = await this.facts(receipt, identity.link);
      const writes: Extract<KnowledgeWrite, { kind: 'relation' }>[] = [];
      for (const { observation, evidence } of facts) {
        const entity = { id: relationId(receipt, observation.id), predicate: 'related_to' as const,
          source: { kind: 'module' as const, id: identity.module.id, revision: identity.module.revision },
          target: { kind: 'observation' as const, id: observation.id, revision: observation.revision } };
        const prior = await this.store.get(this.context.applicationId, 'relation', entity.id);
        if (prior) {
          if (!validRelation(prior, entity, receipt, evidence, this.context, identity.link)) return outcome('conflict', 'existing_relation_mismatch');
          confirmed++; continue;
        }
        writes.push({ kind: 'relation', entity, expected_revision: 0, trace: { source, recorded_by: 'mcp_host', recorded_at: new Date().toISOString(),
          reason: JSON.stringify(receipt), review: 'unreviewed', environment_id: this.context.environmentId,
          evidence_refs: [{ kind: 'evidence', id: evidence.id, revision: evidence.revision }] } });
      }
      const current = await this.resolve(plannedName);
      if (current.status !== 'resolved' || current.fingerprint !== receipt.binding) return outcome('context_changed', 'context_changed');
      if (writes.length) await this.store.commit(this.context.applicationId, writes);
      const committedContext = await this.resolve(plannedName);
      if (committedContext.status !== 'resolved' || committedContext.fingerprint !== receipt.binding) return outcome('context_changed', 'context_changed_after_commit');
      // Read back physically committed rows. Never count intended writes as confirmed.
      for (const write of writes) {
        const record = await this.store.get(this.context.applicationId, 'relation', write.entity.id);
        const fact = facts.find(f => f.observation.id === write.entity.target.id)!;
        if (!record || !validRelation(record, write.entity, receipt, fact.evidence, this.context, identity.link)) return outcome('incomplete', 'readback_incomplete');
        confirmed++;
      }
      const after = await this.resolve(plannedName);
      if (after.status !== 'resolved' || after.fingerprint !== receipt.binding) return outcome('context_changed', 'context_changed_after_commit');
      return outcome(confirmed === facts.length ? 'confirmed' : 'incomplete', 'execution_scope_only');
    } catch (error: unknown) {
      if (error instanceof KnowledgeStoreError && error.code === 'CONFLICT') return outcome('conflict', 'cas_conflict_retry_same_receipt');
      if (error instanceof Error && error.message === 'invalid_fact') return outcome('blocked', 'persisted_fact_incompatible');
      return outcome(confirmed ? 'incomplete' : 'persistence_failed', 'association_unavailable_retry_same_receipt');
    }
  }

  /** Bounded read projection; no payload text, selector, field value, hypothesis or requirement. */
  async project(plannedName: string) {
    const identity = await this.resolve(plannedName);
    if (identity.status !== 'resolved') return { module_identity_status: identity.status, association_status: 'unknown', coverage: 'unknown', human_review_required: true };
    const page = await this.store.query(this.context.applicationId, 'relation', { references: { kind: 'module', id: identity.module.id, revision: identity.module.revision }, limit: 100 });
    const receipts = new Map<string, AssociationReceipt>();
    for (const r of page.items) {
      if (r.trace.source !== source || r.trace.environment_id !== this.context.environmentId) continue;
      try {
        const receipt = JSON.parse(r.trace.reason) as AssociationReceipt;
        if (receipt.version === 1 && Object.keys(receipt).sort().join(',') === 'binding,execution,observations,version' && receipt.binding === identity.fingerprint && uuid(receipt.execution) && Array.isArray(receipt.observations) && receipt.observations.length > 0 && receipt.observations.length <= 64 && receipt.observations.every(uuid) && r.id === relationId(receipt, r.entity.target.id)) receipts.set(receipt.execution, receipt);
      } catch { /* Unrecognized provenance is never projected. */ }
    }
    const executions = [];
    for (const receipt of [...receipts.values()].slice(0, 16)) {
      const facts = await this.facts(receipt, identity.link);
      let associated = 0, forms = 0, controls = 0, required = 0, navigation = 0;
      const types = { navigation_route: 0, dom_element: 0 };
      for (const fact of facts) {
        const relation = await this.store.get(this.context.applicationId, 'relation', relationId(receipt, fact.observation.id));
        const entity = { id: relationId(receipt, fact.observation.id), predicate: 'related_to' as const,
          source: { kind: 'module' as const, id: identity.module.id, revision: identity.module.revision },
          target: { kind: 'observation' as const, id: fact.observation.id, revision: 1 } };
        if (!relation || !validRelation(relation, entity, receipt, fact.evidence, this.context, identity.link)) continue;
        associated++;
        const o = fact.observation.entity;
        if (o.kind === 'navigation_route') types.navigation_route++;
        if (o.kind === 'dom_element') {
          types.dom_element++;
          const view = object(object(fact.evidence.entity.metadata).view);
          const c = Array.isArray(view.controls) ? view.controls as unknown[] : [];
          forms += Array.isArray(view.forms) ? view.forms.length : 0; controls += c.length;
          required += c.filter(item => object(item).required_in_dom === true).length;
          navigation += Array.isArray(view.links) ? view.links.length : 0;
        }
      }
      executions.push({ execution_id: receipt.execution, association_status: associated === receipt.observations.length ? 'confirmed' : 'incomplete', associated_observations: associated,
        expected_observations: receipt.observations.length, observation_types: types, candidate_views: types.navigation_route, forms, controls, html_required_controls: required,
        navigation_candidates: navigation, evidence_available: true, evidence_refs: facts.map(f => ({ id: f.evidence.id, revision: f.evidence.revision })),
        context_revision: { application: identity.link.applicationRevision, environment: identity.link.environmentRevision, module: identity.link.moduleRevision }, coverage: 'partial',
        limitations: ['static_anonymous_only', 'functional_membership_unconfirmed', 'selectors_unverified'], human_review_required: true });
    }
    return { module_identity_status: 'resolved', module_reference: hash([identity.module.id, identity.module.revision]), association_status: executions.length ? 'available' : 'absent',
      absence_does_not_imply_no_observations: true, truncated: !!page.next_cursor || receipts.size > 16, executions, coverage: 'partial', human_review_required: true };
  }
}
