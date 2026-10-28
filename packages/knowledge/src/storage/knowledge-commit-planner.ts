import {
  SENSITIVE_CREDENTIAL_KEYS, SENSITIVE_HTTP_HEADERS,
  validateExpectedRequirement, validateAgentInference, validateConformityAssessment,
  validateDomainModule, validateDomainView, validateActionTarget, validateBrowserCleanupPolicy,
} from '@qap/shared';
import {
  KnowledgeStoreError,
  type KnowledgeKind, type KnowledgeEntities, type KnowledgeRecord,
  type KnowledgeRef, type KnowledgeWrite,
} from '@qap/engine';

import { validateWriteShape } from './knowledge-shape.js';

type Records = Map<string, KnowledgeRecord>;
export const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const key = (kind: KnowledgeKind, id: string) => JSON.stringify([kind, id]);
const fail = (code: KnowledgeStoreError['code'] = 'INVALID_DATA'): never => {
  throw new KnowledgeStoreError(code, `Knowledge contract: ${code}`);
};

/** Pure transaction validation. Storage/locking remain the adapter responsibility. */
export class KnowledgeCommitPlanner {
  prepare(writes: readonly KnowledgeWrite[]): KnowledgeWrite[] {
    if (!Array.isArray(writes) || writes.length < 1 || writes.length > 100) fail();
    this.jsonSafe(writes);
    return writes.map(input => {
      const write = clone(input);
      if (!validateWriteShape(write)) fail();
      this.validate(write);
      return write;
    });
  }

  plan(app: string, writes: readonly KnowledgeWrite[], staged: Records, revisionExists: (ref: KnowledgeRef) => boolean): KnowledgeRecord[] {
    this.identity(app, app);
    if (!Array.isArray(writes) || writes.length < 1 || writes.length > 100) fail();
    const changed = new Set<string>();
    const results: KnowledgeRecord[] = [];
    for (const write of writes) {
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
      const previous = staged.get(recordKey);
      const currentRevision = previous?.revision ?? 0;
      if (!Number.isInteger(write.expected_revision) || write.expected_revision < 0) fail();
      if (write.expected_revision !== currentRevision) fail('CONFLICT');
      if (currentRevision && (write.kind === 'observation' || write.kind === 'assessment')) fail('CONFLICT');
      const record: KnowledgeRecord = { application_id: app, kind: write.kind, id,
        revision: currentRevision + 1, entity, trace: write.trace, references: [] };
      staged.set(recordKey, record);
      results.push(record);
    }
    for (const record of results) {
      record.references = this.references(record, staged).map(ref => {
        this.identity(app, ref.id);
        const current = staged.get(key(ref.kind, ref.id));
        if (ref.revision !== undefined && (!Number.isInteger(ref.revision) || ref.revision < 1)) fail();
        if (!current || (ref.revision !== undefined && ref.revision !== current.revision && !revisionExists(ref))) {
          fail('REFERENCE_NOT_FOUND');
        }
        return { ...ref, revision: ref.revision ?? current!.revision };
      });
    }
    this.checkGraphs(staged);
    return results;
  }

  private identity(app: string, id: string): void {
    if (typeof app !== 'string' || !app.trim() || typeof id !== 'string' || !id.trim()) fail();
  }

  jsonSafe(value: unknown, ancestors = new Set<object>()): void {
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
    const modules = [...records.values()]
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
    const latest = [...records.values()];
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
