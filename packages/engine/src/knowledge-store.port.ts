import type {
  ApplicationContext, EnvironmentPolicy, RolePermissionScope, ApplicationObservation,
  AgentInference, ExpectedRequirement, ConformityAssessment, DomainModule, DomainView,
  ActionTarget, FlowScenario, MultimodalEvidenceRef,
} from '@qap/shared';

/** VNEXT-002: storage-neutral types; no driver, filesystem or adapter dependencies. */
export interface KnowledgeEntities {
  application: ApplicationContext;
  environment: EnvironmentPolicy;
  role: RolePermissionScope;
  observation: ApplicationObservation;
  inference: AgentInference;
  requirement: ExpectedRequirement;
  assessment: ConformityAssessment;
  module: DomainModule;
  view: DomainView;
  action_target: ActionTarget;
  flow: FlowScenario;
  evidence: MultimodalEvidenceRef;
  relation: KnowledgeRelation;
}

export type KnowledgeKind = keyof KnowledgeEntities;

/** All references are resolved inside the explicitly supplied application scope. */
export interface KnowledgeRef {
  kind: KnowledgeKind;
  id: string;
  /** Omit for current revision; supply to pin an immutable historical revision. */
  revision?: number;
}

/** No canonical generic edge exists in VNEXT-001. Domain dependencies remain canonical. */
export interface KnowledgeRelation {
  id: string;
  source: KnowledgeRef;
  target: KnowledgeRef;
  predicate: 'depends_on' | 'supports' | 'contradicts' | 'navigates_to' | 'related_to';
}

/** Supplements entities that lack common provenance/context/review fields in VNEXT-001.
 * Review here never confirms a requirement; its canonical validation fields govern D-011.
 * Only external profile/session identifiers are permitted, never credential material.
 */
export interface KnowledgeTrace {
  source: string;
  recorded_by: string;
  recorded_at: string;
  reason: string;
  review: 'unreviewed' | 'reviewed' | 'pending_review';
  environment_id?: string;
  role_id?: string;
  auth_profile_id?: string;
  evidence_refs: KnowledgeRef[];
}

export interface KnowledgeRecord<K extends KnowledgeKind = KnowledgeKind> {
  application_id: string;
  kind: K;
  id: string;
  revision: number;
  entity: KnowledgeEntities[K];
  trace: KnowledgeTrace;
  /** Complete outgoing links, resolved and pinned at commit time. Historical assessments
   * must keep referring to the requirement revision they actually assessed.
   */
  references: KnowledgeRef[];
}

export type KnowledgeWrite = {
  [K in KnowledgeKind]: {
    kind: K;
    entity: KnowledgeEntities[K];
    /** 0 creates only; subsequent writes require the exact current revision (CAS). */
    expected_revision: number;
    trace: KnowledgeTrace;
  }
}[KnowledgeKind];

export interface KnowledgePageRequest {
  /** Default 50; integer 1..100. */
  limit?: number;
  /** Opaque, bound to application, query and committed scope version. */
  cursor?: string;
}

export interface KnowledgePage<T> {
  items: T[];
  next_cursor?: string;
}

export interface KnowledgeQuery extends KnowledgePageRequest {
  /** Match outgoing references, including canonical links (e.g. supporting observations).
   * Missing revision matches any revision; explicit revision matches pinned links only.
   */
  references?: KnowledgeRef;
}

export type KnowledgeStoreErrorCode =
  | 'INVALID_DATA' | 'CONFLICT' | 'REFERENCE_NOT_FOUND' | 'INVALID_CURSOR'
  | 'SCHEMA_MISMATCH' | 'UNAVAILABLE';

/** Adapters reject with this error; messages/details must never echo secret payloads. */
export class KnowledgeStoreError extends Error {
  constructor(public readonly code: KnowledgeStoreErrorCode, message: string) {
    super(message);
    this.name = 'KnowledgeStoreError';
  }
}

/**
 * Operational VNEXT-002 port. Application ID is the project isolation boundary; callers
 * choose a different ID for each project. This is data isolation, not authentication/RBAC.
 *
 * Each call is consistent; commit is a serializable all-or-nothing transaction (1..100
 * writes, one per kind/id). Validate canonical invariants and all explicit/implicit links
 * against the final transaction state, including same-scope parent and evidence links.
 * Persist resolved revision pins in record.references; do not recompute old links on read.
 * Module dependencies resolve by ID or unique key and must be acyclic. Flows' preceding
 * flow prerequisites and explicit depends_on relations must also be acyclic.
 *
 * Never upsert blindly, hard-delete, mutate a previous revision, or change a record's
 * identity. Append a revision with provenance/reason even for review/retirement changes.
 * Observations and assessments are append-only facts: corrections use new IDs/relations.
 * Historical revisions remain retrievable. A superseded_by link must resolve locally;
 * inactive entities carrying that field require a successor. No automatic epistemic
 * promotion, including from reproducible observations or trace.review = reviewed.
 *
 * Require JSON-safe, sanitized input. Reject known credential keys and sensitive HTTP
 * headers at any depth; preserve profile/session references. Free text, URLs, binaries and
 * encoded payloads require upstream redaction; this port is not a general secret detector.
 * Embedded evidence must be masked and is a reference, never binary evidence storage.
 *
 * Pages sort by ID (history by ascending revision). Cursors are opaque and query-bound;
 * intervening commits in that application invalidate them with INVALID_CURSOR. Returned
 * values must be detached from storage and caller-owned inputs.
 *
 * Driver lifecycle/migrations belong to adapter setup, not Engine. Incompatible physical
 * schema must fail with SCHEMA_MISMATCH before use; adapters must not silently migrate
 * or discard data. FTS, telemetry, import/export snapshots and distributed sync are future
 * capabilities, not pretend methods on this port. JSON entities/history and no SQL types
 * keep the contract portable; they do not implement backup/export.
 */
export interface IKnowledgeStore {
  readonly contract_version: 1;
  get<K extends KnowledgeKind>(applicationId: string, kind: K, id: string,
    revision?: number): Promise<KnowledgeRecord<K> | null>;
  query<K extends KnowledgeKind>(applicationId: string, kind: K,
    query?: KnowledgeQuery): Promise<KnowledgePage<KnowledgeRecord<K>>>;
  history<K extends KnowledgeKind>(applicationId: string, kind: K, id: string,
    page?: KnowledgePageRequest): Promise<KnowledgePage<KnowledgeRecord<K>>>;
  commit(applicationId: string, writes: readonly KnowledgeWrite[]): Promise<KnowledgeRecord[]>;
}
