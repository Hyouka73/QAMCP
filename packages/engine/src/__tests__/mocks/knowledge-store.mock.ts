import {
  SENSITIVE_CREDENTIAL_KEYS, SENSITIVE_HTTP_HEADERS,
  validateExpectedRequirement, validateAgentInference, validateConformityAssessment,
  validateDomainModule, validateDomainView, validateActionTarget, validateBrowserCleanupPolicy,
} from '@qap/shared';

import {
  KnowledgeStoreError,
  type IKnowledgeStore, type KnowledgeKind, type KnowledgeEntities, type KnowledgeRecord,
  type KnowledgeRef, type KnowledgeWrite, type KnowledgeQuery, type KnowledgePageRequest,
  type KnowledgePage,
} from '../../knowledge-store.port.js';

type Records = Map<string, KnowledgeRecord[]>;
export const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const key = (kind: KnowledgeKind, id: string) => JSON.stringify([kind, id]);
const fail = (code: KnowledgeStoreError['code'] = 'INVALID_DATA'): never => {
  throw new KnowledgeStoreError(code, `Knowledge contract: ${code}`);
};

/** Test double only. No physical persistence, migration, encryption or driver claims. */
export class MemoryKnowledgeStore implements IKnowledgeStore {
  readonly contract_version = 1 as const;
  private scopes = new Map<string, Records>();
  private versions = new Map<string, number>();

  async get<K extends KnowledgeKind>(app: string, kind: K, id: string, revision?: number)
    : Promise<KnowledgeRecord<K> | null> {
    this.identity(app, id);
    if (revision !== undefined && (!Number.isInteger(revision) || revision < 1)) fail();
    const revisions = this.scopes.get(app)?.get(key(kind, id));
    const record = revision === undefined ? revisions?.at(-1) : revisions?.[revision - 1];
    return clone(record ?? null) as KnowledgeRecord<K> | null;
  }

  async query<K extends KnowledgeKind>(app: string, kind: K, query: KnowledgeQuery = {})
    : Promise<KnowledgePage<KnowledgeRecord<K>>> {
    this.identity(app, kind);
    const records = [...(this.scopes.get(app)?.values() ?? [])].map(r => r.at(-1)!)
      .filter(r => r.kind === kind && (!query.references || r.references.some(ref =>
        ref.kind === query.references!.kind && ref.id === query.references!.id &&
        (query.references!.revision === undefined || ref.revision === query.references!.revision))))
      .sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
    return this.page(app, JSON.stringify(['query', kind, query.references ?? null]), records, query) as KnowledgePage<KnowledgeRecord<K>>;
  }

  async history<K extends KnowledgeKind>(app: string, kind: K, id: string, page: KnowledgePageRequest = {})
    : Promise<KnowledgePage<KnowledgeRecord<K>>> {
    this.identity(app, id);
    return this.page(app, JSON.stringify(['history', kind, id]),
      this.scopes.get(app)?.get(key(kind, id)) ?? [], page) as KnowledgePage<KnowledgeRecord<K>>;
  }

  async commit(app: string, writes: readonly KnowledgeWrite[]): Promise<KnowledgeRecord[]> {
    this.identity(app, app);
    if (writes.length < 1 || writes.length > 100) fail();
    // No awaits: this double serializes commits on the JS event loop. Real adapters need
    // a database transaction/lock; clone-and-swap alone is not a database strategy.
    const staged: Records = new Map([...(this.scopes.get(app) ?? new Map<string, KnowledgeRecord[]>())]
      .map(([id, revisions]) => [id, clone(revisions)]));
    const changed = new Set<string>();
    const results: KnowledgeRecord[] = [];
    for (const input of writes) {
      this.jsonSafe(input);
      const write = clone(input);
      this.validate(write);
      const entity = write.entity;
      const id = write.kind === 'application' ? (entity as KnowledgeEntities['application']).application_id
        : write.kind === 'environment' ? (entity as KnowledgeEntities['environment']).environment_id
        : write.kind === 'role' ? (entity as KnowledgeEntities['role']).role_id
        : (entity as { id: string }).id;
      this.identity(app, id);
      if ('application_id' in entity && entity.application_id !== app) fail();
      const recordKey = key(write.kind, id);
      if (changed.has(recordKey)) fail();
      changed.add(recordKey);
      const history = staged.get(recordKey) ?? [];
      if (!Number.isInteger(write.expected_revision) || write.expected_revision < 0) fail();
      if (write.expected_revision !== history.length) fail('CONFLICT');
      if (history.length && (write.kind === 'observation' || write.kind === 'assessment')) fail('CONFLICT');
      const record: KnowledgeRecord = { application_id: app, kind: write.kind, id,
        revision: history.length + 1, entity, trace: write.trace, references: [] };
      staged.set(recordKey, [...history, record]);
      results.push(record);
    }
    for (const record of results) {
      record.references = this.references(record, staged).map(ref => {
        this.identity(app, ref.id);
        const revisions = staged.get(key(ref.kind, ref.id));
        if (ref.revision !== undefined && (!Number.isInteger(ref.revision) || ref.revision < 1)) fail();
        if (!(ref.revision === undefined ? revisions?.at(-1) : revisions?.[ref.revision - 1])) {
          fail('REFERENCE_NOT_FOUND');
        }
        return { ...ref, revision: ref.revision ?? revisions!.length };
      });
    }
    this.checkGraphs(staged);
    this.scopes.set(app, staged);
    this.versions.set(app, (this.versions.get(app) ?? 0) + 1);
    return clone(results);
  }

  private identity(app: string, id: string): void {
    if (typeof app !== 'string' || !app.trim() || typeof id !== 'string' || !id.trim()) fail();
  }

  private page(app: string, query: string, records: KnowledgeRecord[], page: KnowledgePageRequest)
    : KnowledgePage<KnowledgeRecord> {
    const limit = page.limit ?? 50;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) fail();
    const version = this.versions.get(app) ?? 0;
    let offset = 0;
    if (page.cursor !== undefined) {
      try {
        const decoded = JSON.parse(page.cursor) as [string, string, number, number];
        if (!Array.isArray(decoded) || decoded.length !== 4 || decoded[0] !== app ||
          decoded[1] !== query || decoded[2] !== version || !Number.isInteger(decoded[3]) ||
          decoded[3] < 0 || decoded[3] > records.length) fail('INVALID_CURSOR');
        offset = decoded[3];
      } catch { fail('INVALID_CURSOR'); }
    }
    const end = offset + limit;
    return clone({ items: records.slice(offset, end),
      ...(end < records.length ? { next_cursor: JSON.stringify([app, query, version, end]) } : {}) });
  }

  private jsonSafe(value: unknown, ancestors = new Set<object>()): void {
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
    if (typeof value === 'number' && Number.isFinite(value)) return;
    if (!value || typeof value !== 'object' ||
      (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype)) return fail();
    if (ancestors.has(value)) return fail();
    ancestors.add(value);
    for (const [name, child] of Object.entries(value)) {
      if ([...SENSITIVE_CREDENTIAL_KEYS, ...SENSITIVE_HTTP_HEADERS].some(k => k === name.toLowerCase())) fail();
      this.jsonSafe(child, ancestors);
    }
    ancestors.delete(value);
  }

  private validate(write: KnowledgeWrite): void {
    const trace = write.trace;
    if (!trace || !trace.source?.trim() || !trace.recorded_by?.trim() || !trace.reason?.trim() ||
      !Number.isFinite(Date.parse(trace.recorded_at)) ||
      !['unreviewed', 'reviewed', 'pending_review'].includes(trace.review) || !Array.isArray(trace.evidence_refs) ||
      trace.evidence_refs.some(ref => ref.kind !== 'evidence')) fail();
    let valid = true;
    switch (write.kind) {
      case 'application': valid = !!(write.entity.name && write.entity.base_url && write.entity.created_at); break;
      case 'environment': valid = !!(write.entity.name && write.entity.base_url &&
        Array.isArray(write.entity.safe_domains) && typeof write.entity.is_production === 'boolean' &&
        typeof write.entity.destructive_actions_allowed === 'boolean'); break;
      case 'role': valid = !!(write.entity.role_name && Array.isArray(write.entity.permissions) &&
        typeof write.entity.is_authenticated === 'boolean'); break;
      case 'observation': valid = !!(write.entity.environment_id && write.entity.observed_at &&
        ['dom_element', 'network_traffic', 'console_log', 'navigation_route', 'probe_result', 'visual_capture'].includes(write.entity.kind) &&
        ['crawler', 'active_probe', 'recon', 'runner'].includes(write.entity.observed_by) && write.entity.evidence?.pii_masked); break;
      case 'inference': valid = validateAgentInference(write.entity).valid; break;
      case 'requirement': valid = validateExpectedRequirement(write.entity).valid; break;
      case 'assessment': valid = validateConformityAssessment(write.entity).valid; break;
      case 'module': valid = validateDomainModule(write.entity).valid; break;
      case 'view': valid = validateDomainView(write.entity).valid; break;
      case 'action_target': valid = validateActionTarget(write.entity).valid; break;
      case 'flow': valid = !!(write.entity.title && Array.isArray(write.entity.steps) &&
        Array.isArray(write.entity.prerequisites) && validateBrowserCleanupPolicy(write.entity.cleanup_policy).valid); break;
      case 'evidence': valid = !!(write.entity.pii_masked && write.entity.captured_at &&
        ['screenshot', 'network_har', 'dom_snippet', 'console_log'].includes(write.entity.kind) &&
        (write.entity.storage_path || write.entity.uri)); break;
      case 'relation': valid = !!(write.entity.source && write.entity.target &&
        ['depends_on', 'supports', 'contradicts', 'navigates_to', 'related_to'].includes(write.entity.predicate)); break;
      default: fail();
    }
    if (!valid) fail();
    const entity = write.entity;
    if ('is_active' in entity && !entity.is_active && 'superseded_by' in entity && !entity.superseded_by) fail();
    if ('evidence' in entity) {
      const evidence = Array.isArray(entity.evidence) ? entity.evidence : [entity.evidence];
      if (evidence.some(e => !e.pii_masked)) fail();
    }
  }

  private references(record: KnowledgeRecord, records: Records): KnowledgeRef[] {
    // Discriminating a mapped union here keeps the canonical entity types intact.
    const r = record as { [K in KnowledgeKind]: KnowledgeRecord<K> }[KnowledgeKind];
    const refs: KnowledgeRef[] = r.kind === 'application' ? [] : [{ kind: 'application', id: r.application_id }];
    const add = (kind: KnowledgeKind, id?: string) => { if (id) refs.push({ kind, id }); };
    refs.push(...r.trace.evidence_refs);
    add('environment', r.trace.environment_id);
    add('role', r.trace.role_id);
    const modules = [...records.values()].map(h => h.at(-1)!)
      .filter(m => m.kind === 'module') as KnowledgeRecord<'module'>[];
    const moduleRef = (idOrKey: string, keyOnly = false) => {
      const matches = modules.filter(m => m.entity.key === idOrKey || (!keyOnly && m.id === idOrKey));
      if (matches.length !== 1) return fail('REFERENCE_NOT_FOUND');
      add('module', matches[0].id);
    };
    switch (r.kind) {
      case 'observation': add('environment', r.entity.environment_id); add('evidence', r.entity.evidence.id); break;
      case 'inference': r.entity.supporting_observation_ids.forEach(id => add('observation', id)); break;
      case 'requirement': moduleRef(r.entity.module_key, true); break;
      case 'module': r.entity.dependencies.forEach(id => moduleRef(id)); break;
      case 'assessment': add('requirement', r.entity.requirement_id);
        r.entity.observation_ids.forEach(id => add('observation', id));
        r.entity.evidence.forEach(e => add('evidence', e.id)); break;
      case 'view': add('module', r.entity.module_id); break;
      case 'action_target': add('view', r.entity.view_id); break;
      case 'flow': add('module', r.entity.module_id); add('role', r.entity.required_role_id);
        r.entity.steps.forEach(step => add('action_target', step.action_target_id));
        r.entity.prerequisites.forEach(p => { add('role', p.required_role_id); add('flow', p.depends_on_flow_id); }); break;
      case 'relation': refs.push(r.entity.source, r.entity.target); break;
    }
    if ('superseded_by' in r.entity) add(r.kind, r.entity.superseded_by);
    return refs;
  }

  private checkGraphs(records: Records): void {
    const latest = [...records.values()].map(h => h.at(-1)!);
    const modules = latest.filter(r => r.kind === 'module') as KnowledgeRecord<'module'>[];
    const moduleByKey = new Map<string, string>();
    for (const m of modules) {
      if (moduleByKey.has(m.entity.key)) fail();
      moduleByKey.set(m.entity.key, m.id);
    }
    const edges = new Map<string, string[]>();
    const edge = (from: string, to: string) => edges.set(from, [...(edges.get(from) ?? []), to]);
    for (const record of latest) {
      if (record.kind === 'requirement') {
        const req = record.entity as KnowledgeEntities['requirement'];
        if (!moduleByKey.has(req.module_key)) fail('REFERENCE_NOT_FOUND');
      }
      if (record.kind === 'module') {
        const m = record.entity as KnowledgeEntities['module'];
        for (const dependency of m.dependencies) {
          const byId = modules.find(other => other.id === dependency)?.id;
          const byKey = moduleByKey.get(dependency);
          if (byId && byKey && byId !== byKey) fail();
          const id = byId ?? byKey;
          if (!id) return fail('REFERENCE_NOT_FOUND');
          edge(key('module', record.id), key('module', id));
        }
      }
      if (record.kind === 'flow') {
        const f = record.entity as KnowledgeEntities['flow'];
        f.prerequisites.forEach(p => { if (p.depends_on_flow_id) edge(key('flow', record.id), key('flow', p.depends_on_flow_id)); });
      }
      if (record.kind === 'relation') {
        const rel = record.entity as KnowledgeEntities['relation'];
        if (rel.predicate === 'depends_on') edge(key(rel.source.kind, rel.source.id), key(rel.target.kind, rel.target.id));
      }
    }
    const done = new Set<string>();
    const active = new Set<string>();
    const visit = (id: string): void => {
      if (active.has(id)) fail();
      if (done.has(id)) return;
      active.add(id);
      (edges.get(id) ?? []).forEach(visit);
      active.delete(id);
      done.add(id);
    };
    edges.forEach((_, id) => visit(id));
  }
}
