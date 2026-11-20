import { OperationDomain } from './operation-domain.js';
import type { ProjectOperationContext } from '../project-reset.js';
import { createHash, randomUUID } from 'node:crypto';
import { appendFileSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, parse } from 'node:path';

import {
  EphemeralCredentialProvider,
  referenceKey,
  type CredentialReference,
  type ICredentialProvider,
} from '@qap/auth';
import { SqliteKnowledgeAdapter } from '@qap/knowledge';
import {
  hasCommittedRun,
  inspectRecoverableProvisionalPublications,
  recoverProvisionalPublications,
  type ProvisionalMcpFinalization,
} from '@qap/playwright-runner';
import {
  normalizeSlug,
  type AuthProfileLifecycleStatus,
  type AuthProfileRecord,
  type CampaignMode,
  type CampaignPhase,
  type CampaignRecord,
  type CampaignStatus,
  type ContextDiscrepancy,
  type DeleteExecutionReceipt,
  type DeleteScopePreview,
  type EnvironmentRecord,
  type IngestedDocumentRecord,
  type LegacyQaImportReceipt,
  type LegacyQaVerificationResult,
  type ModuleRecord,
  type PartialInventoryRecord,
  type PendingDecisionContract,
  type ProgressContract,
  type ProjectRecord,
  type ProjectStateSnapshot,
  type ProjectStatus,
  type CanonicalExecutionSummary,
  type ExecutionAttemptRecord,
  type ExecutionCaseResultRecord,
  type ExecutionResult,
  type RecoveryContract,
  type RecoveryRestoreReceipt,
  type ReportFormatEntry,
  type ReportPublicationRecord,
  type ScopeLimitsContract,
  type ServiceModuleCandidateRecord,
  type ServiceModuleCandidateStatus,
  type ServiceModuleStatus,
  type ServiceRequirementRecord,
  type ServiceTestCaseRecord,
  type TaskRecord,
  type TaskStatus,
} from '@qap/shared';

import { AppServiceSqliteStore } from './app-service-store.js';
import {
  Block3ExecutionRepo,
  type OracleDecisionInput,
  type ProposeCaseInput,
} from './block3-execution-repo.js';
import {
  buildDiscoveryRevisionId,
  computeDossierContentHash,
  computeScopeHash,
  sanitizeTargetPathname,
  type DiscoveryDossierCanonical,
  type DiscoveryDossierScope,
  type DiscoveryRevisionRecord,
} from './discovery-dossier.js';
import { LegacyQaImporter } from './legacy-qa-importer.js';
import {
  LINEAGED_CASE_SCHEMA,
  buildValidatedTcCase,
  normalizeLineagedCandidateInput,
  resolveLineagedListArguments,
  resolveLineagedReadArguments,
  resolveLineagedReferences,
  type LineagedCaseCandidateInput,
  type LineagedCaseReadScopeInput,
  type LineagedCaseRecord,
  type LineagedCaseScope,
  type LineagedCaseSelector,
  type LineagedCaseWriteResult,
  type LineagedReferenceReader,
} from './lineaged-case.js';
import { ManagedArtifactStore, type ManagedArtifactCategory, type StoredArtifactReceipt } from './managed-artifacts.js';
import { PermissionAuthority } from './permission-authority.js';
import {
  assertDisjointFromWorkspace,
  assertSafeHostPath,
  atomicWritePrivateFile,
  hashCanonicalRoot,
  isPathWithin,
  normalizePathKey,
  listSafeFiles,
  resolveContainedPath,
  safeDeleteOwnedPath,
} from './safe-storage.js';
import {
  normalizeRuleKey,
  normalizeRuleRoute,
  normalizeScopeToken,
  parseScopedRulesFromDocument,
  type RuleAssertType,
  type RuleAuthorityStatus,
  type RuleScopeDeclaration,
  type ScopedBusinessRuleRecord,
  type UpsertScopedBusinessRuleInput,
} from './scoped-rule-resolver.js';

export class ApplicationServiceError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApplicationServiceError';
  }
}

export interface RootAuthorizationGrant {
  readonly grant_id: string;
  readonly generation: string;
  readonly status: 'active' | 'revoked';
  readonly granted_at: string;
  readonly mechanism: 'local_operator_helper' | 'host_interactive_dialog';
  /** Present only after the helper has written the root registry. */
  readonly registry_published?: true;
}

/** A point-in-time identity, not a bearer credential or an application permission. */
export interface RootAuthorizationReference {
  readonly canonical_root: string;
  readonly coordination_domain: string;
  readonly generation: string;
  readonly grant_id: string;
  readonly protected_ancestors: readonly { readonly canonical_root: string; readonly generation: string; readonly grant_id: string }[];
}

export interface ImportReadReference {
  readonly version: 1;
  readonly purpose: 'import_read';
  readonly canonical_root: string;
  readonly coordination_domain: string;
  readonly grant_id: string;
  readonly generation: string;
  readonly status: 'active' | 'revoked';
}

interface InitialRootAuthority {
  readonly version: 1;
  readonly canonical_root: string;
  readonly root_hash: string;
  readonly generation: string;
  readonly authorization_grants: readonly RootAuthorizationGrant[];
}

const initialAuthorityKey = (hash: string): string => `root_initial_authority:v1:${hash}`;

/** Durable reconciliation epoch and optional, independently recorded grant history. */
export interface RootDeletionGeneration {
  readonly version: 1;
  readonly root_hash: string;
  readonly canonical_root: string;
  readonly project_id: string;
  readonly deleted_at: string;
  readonly generation: string;
  readonly cleanup_status: 'pending' | 'completed';
  readonly authorization_grants?: readonly RootAuthorizationGrant[];
}

export type RootDeletionState = RootDeletionGeneration | {
  readonly version: 0;
  readonly root_hash: string;
  readonly canonical_root: string;
  readonly project_id: string;
  readonly deleted_at: string;
  readonly cleanup_status: 'unknown';
};

function sameDeletionEpoch(a: RootDeletionState | null, b: RootDeletionState | null): boolean {
  if (!a || !b) return a === b;
  if (a.version !== b.version) return false;
  return a.version === 1 && b.version === 1
    ? a.generation === b.generation
    : a.project_id === b.project_id && a.deleted_at === b.deleted_at;
}

export type RootAuthorizationLookup =
  | { readonly kind: 'never_deleted' }
  | { readonly kind: 'historical_tombstone' }
  | { readonly kind: 'generation'; readonly generation: string; readonly cleanup_status: 'pending' | 'completed'; readonly grant: RootAuthorizationGrant | null };

/** Snapshot only: callers must coordinate this result with registry reads and use. */
export type RootAuthorizationSnapshot =
  | { readonly kind: 'no_retained_history' }
  | { readonly kind: 'historical_tombstone' }
  | { readonly kind: 'generation'; readonly generation: string; readonly cleanup_status: 'pending' | 'completed'; readonly published_active_grant: boolean };

const deletionStateKey = (rootHash: string): string => `root_deletion_generation:v1:${rootHash}`;
const isUuidV4 = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

function parseRootDeletionGeneration(value: string, rootHash: string): RootDeletionGeneration {
  let record: unknown;
  try { record = JSON.parse(value); } catch { throw new ApplicationServiceError('invalid_deletion_generation', 'Estado de generación de borrado inválido.'); }
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    throw new ApplicationServiceError('invalid_deletion_generation', 'Estado de generación de borrado inválido.');
  }
  const r = record as Record<string, unknown>;
  if (r.version !== 1 || r.root_hash !== rootHash || typeof r.canonical_root !== 'string' || !isAbsolute(r.canonical_root) ||
      hashCanonicalRoot(r.canonical_root) !== rootHash || typeof r.project_id !== 'string' || !r.project_id ||
      typeof r.deleted_at !== 'string' || !Number.isFinite(Date.parse(r.deleted_at)) ||
      !isUuidV4(r.generation) ||
      (r.cleanup_status !== 'pending' && r.cleanup_status !== 'completed')) {
    throw new ApplicationServiceError('invalid_deletion_generation', 'Estado de generación de borrado inválido.');
  }
  if (r.authorization_grants !== undefined) {
    if (!Array.isArray(r.authorization_grants)) throw new ApplicationServiceError('invalid_deletion_generation', 'Concesiones de raíz inválidas.');
    const ids = new Set<string>();
    for (const entry of r.authorization_grants as unknown[]) {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new ApplicationServiceError('invalid_deletion_generation', 'Concesión de raíz inválida.');
      const grant = entry as Record<string, unknown>;
      const grantKeys = Object.keys(grant).sort().join(',');
      if ((grantKeys !== 'generation,grant_id,granted_at,mechanism,status' &&
           grantKeys !== 'generation,grant_id,granted_at,mechanism,registry_published,status') ||
          (grant.registry_published !== undefined && grant.registry_published !== true) ||
          !isUuidV4(grant.grant_id) || grant.grant_id !== grant.grant_id.toLowerCase() || ids.has(grant.grant_id) || !isUuidV4(grant.generation) ||
          (grant.mechanism !== 'local_operator_helper' && grant.mechanism !== 'host_interactive_dialog') ||
          (grant.status !== 'active' && grant.status !== 'revoked') ||
          typeof grant.granted_at !== 'string' || !Number.isFinite(Date.parse(grant.granted_at)) ||
          (grant.status === 'active' && (grant.generation !== r.generation || r.cleanup_status !== 'completed'))) {
        throw new ApplicationServiceError('invalid_deletion_generation', 'Concesión de raíz inválida.');
      }
      ids.add(grant.grant_id);
    }
  }
  return r as unknown as RootDeletionGeneration;
}

export interface RuleConfirmationDecisionRecord {
  readonly decision_id: string;
  readonly project_id: string;
  readonly requirement_id: string;
  readonly rule_id: string;
  readonly rule_key: string;
  readonly module_key: string;
  readonly route_pathname: string;
  readonly environment_name: string;
  readonly tenant_id: string;
  readonly role: string;
  readonly scope_declaration: 'exact' | 'general_compatible';
  readonly revision: number;
  readonly question_id: string;
  readonly question_text: string;
  readonly expected_outcome: string;
  readonly title: string;
  readonly decision: 'confirm' | 'reject' | 'defer';
  readonly approval_id: string;
  readonly request_digest: string;
  readonly presented_statement_digest: string;
  readonly reviewer: string;
  readonly mechanism: string;
  readonly evidence_refs: readonly string[];
  readonly discovery_revision_id: string | null;
  readonly decided_at: string;
  readonly created_at: string;
}

export interface QapApplicationServiceOptions {
  readonly hostRootDir: string;
  readonly projectOperationDirectory?: string;
  readonly credentialProvider?: ICredentialProvider;
  readonly deleteTokenTtlMs?: number;
  readonly onProjectDeleted?: (projectId: string, canonicalRoot: string) => void;
}

export interface CreateProjectInput {
  readonly name: string;
  readonly canonicalRoot: string;
  readonly objective?: string;
  readonly baseUrl?: string;
  readonly envName?: string;
  readonly tenantMode?: 'single' | 'multi_tenant';
  readonly defaultTenant?: string;
  readonly mode?: CampaignMode;
  readonly allowRecreateDeleted?: boolean;
}

export interface UpsertEnvironmentInput {
  readonly projectId: string;
  readonly name: string;
  readonly baseUrl: string;
  readonly isProduction?: boolean;
  readonly destructiveActionsAllowed?: boolean;
  readonly safeDomains?: readonly string[];
  readonly tenantMode?: 'single' | 'multi_tenant';
  readonly defaultTenant?: string;
}

export interface UpsertProfileInput {
  readonly projectId: string;
  readonly envId: string;
  readonly label: string;
  readonly roleName?: string;
  readonly tenantId?: string;
  readonly loginMode?: 'auto' | 'handoff' | 'interactive_window';
  readonly credentialAccount?: string;
  readonly status?: AuthProfileLifecycleStatus;
}

export interface UpsertModuleInput {
  readonly projectId: string;
  readonly key: string;
  readonly title?: string;
  readonly routeHint?: string;
  readonly priority?: 'high' | 'medium' | 'low';
  readonly criticality?: 'low' | 'medium' | 'high' | 'critical';
  readonly status?: ServiceModuleStatus;
  readonly knowledgeModuleId?: string;
  readonly knowledgeRevision?: number;
  readonly waiverReason?: string;
}

export interface StartCampaignInput {
  readonly projectId: string;
  readonly envId?: string;
  readonly mode: CampaignMode;
  readonly phase?: CampaignPhase;
  readonly objective?: string;
  readonly targetModuleIds?: readonly string[];
  readonly reusedFromCampaignId?: string;
}

export interface UpsertTaskInput {
  readonly projectId: string;
  readonly campaignId: string;
  readonly taskId?: string;
  readonly moduleId?: string;
  readonly kind: string;
  readonly title: string;
  readonly status?: TaskStatus;
  readonly progressCurrent?: number;
  readonly progressTotal?: number;
  readonly progressUnit?: string;
  readonly pendingDecision?: PendingDecisionContract | null;
  readonly recoveryCursor?: RecoveryContract | null;
  readonly errorCode?: string | null;
}

interface ActiveTaskHandle {
  readonly projectId: string;
  readonly taskId: string;
  readonly controller: AbortController;
  readonly promise: Promise<unknown>;
}

interface RecoveryBundlePayload {
  readonly version: 1;
  readonly exported_at: string;
  readonly project: ProjectRecord;
  readonly environments: EnvironmentRecord[];
  readonly modules: ModuleRecord[];
  readonly profiles: AuthProfileRecord[];
  readonly campaigns: CampaignRecord[];
}

function sha256Text(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function credentialRefFor(
  project: Pick<ProjectRecord, 'project_id' | 'application_id'>,
  profile: AuthProfileRecord,
): CredentialReference {
  return {
    projectId: project.project_id,
    applicationId: project.application_id,
    environment: profile.env_id,
    auth_profile_id: profile.profile_id,
    account: profile.credential_ref_key ?? profile.label,
  };
}

function rowStr(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  return '';
}

function rowOptStr(value: unknown): string | undefined {
  const s = rowStr(value);
  return s.length > 0 ? s : undefined;
}

function parseProjectRow(row: Record<string, unknown>): ProjectRecord {
  return {
    project_id: rowStr(row.project_id),
    name: rowStr(row.name),
    slug: rowStr(row.slug),
    canonical_root: rowStr(row.canonical_root),
    root_hash: rowStr(row.root_hash),
    application_id: rowStr(row.application_id),
    status: row.status as ProjectStatus,
    ...(rowOptStr(row.objective) ? { objective: rowOptStr(row.objective) } : {}),
    ...(rowOptStr(row.active_env_id) ? { active_env_id: rowOptStr(row.active_env_id) } : {}),
    ...(rowOptStr(row.active_campaign_id) ? { active_campaign_id: rowOptStr(row.active_campaign_id) } : {}),
    created_at: rowStr(row.created_at),
    updated_at: rowStr(row.updated_at),
    deleted_at: rowOptStr(row.deleted_at) ?? null,
  };
}

function parseEnvironmentRow(row: Record<string, unknown>): EnvironmentRecord {
  return {
    env_id: rowStr(row.env_id),
    project_id: rowStr(row.project_id),
    name: rowStr(row.name),
    base_url: rowStr(row.base_url),
    is_production: Boolean(row.is_production),
    destructive_actions_allowed: Boolean(row.destructive_actions_allowed),
    safe_domains: JSON.parse(rowStr(row.safe_domains_json) || '[]') as string[],
    tenant_mode: row.tenant_mode as 'single' | 'multi_tenant',
    ...(rowOptStr(row.default_tenant) ? { default_tenant: rowOptStr(row.default_tenant) } : {}),
    created_at: rowStr(row.created_at),
    updated_at: rowStr(row.updated_at),
  };
}

function parseProfileRow(row: Record<string, unknown>): AuthProfileRecord {
  return {
    profile_id: rowStr(row.profile_id),
    project_id: rowStr(row.project_id),
    env_id: rowStr(row.env_id),
    label: rowStr(row.label),
    ...(rowOptStr(row.role_name) ? { role_name: rowOptStr(row.role_name) } : {}),
    ...(rowOptStr(row.tenant_id) ? { tenant_id: rowOptStr(row.tenant_id) } : {}),
    login_mode: row.login_mode as AuthProfileRecord['login_mode'],
    ...(rowOptStr(row.credential_ref_key) ? { credential_ref_key: rowOptStr(row.credential_ref_key) } : {}),
    ...(rowOptStr(row.session_artifact_id) ? { session_artifact_id: rowOptStr(row.session_artifact_id) } : {}),
    status: row.status as AuthProfileLifecycleStatus,
    verified_at: rowOptStr(row.verified_at) ?? null,
    expires_at: rowOptStr(row.expires_at) ?? null,
    revoked_at: rowOptStr(row.revoked_at) ?? null,
    created_at: rowStr(row.created_at),
    updated_at: rowStr(row.updated_at),
  };
}

function parseModuleRow(row: Record<string, unknown>): ModuleRecord {
  return {
    module_id: rowStr(row.module_id),
    project_id: rowStr(row.project_id),
    key: rowStr(row.key),
    title: rowStr(row.title),
    ...(rowOptStr(row.route_hint) ? { route_hint: rowOptStr(row.route_hint) } : {}),
    priority: row.priority as ModuleRecord['priority'],
    criticality: row.criticality as ModuleRecord['criticality'],
    status: row.status as ServiceModuleStatus,
    ...(rowOptStr(row.knowledge_module_id) ? { knowledge_module_id: rowOptStr(row.knowledge_module_id) } : {}),
    ...(row.knowledge_revision !== null && row.knowledge_revision !== undefined
      ? { knowledge_revision: Number(row.knowledge_revision) }
      : {}),
    ...(rowOptStr(row.waiver_reason) ? { waiver_reason: rowOptStr(row.waiver_reason) } : {}),
    closed_at: rowOptStr(row.closed_at) ?? null,
    created_at: rowStr(row.created_at),
    updated_at: rowStr(row.updated_at),
  };
}

function parseCampaignRow(row: Record<string, unknown>): CampaignRecord {
  return {
    campaign_id: rowStr(row.campaign_id),
    project_id: rowStr(row.project_id),
    env_id: rowStr(row.env_id),
    mode: row.mode as CampaignMode,
    phase: row.phase as CampaignPhase,
    status: row.status as CampaignStatus,
    ...(rowOptStr(row.objective) ? { objective: rowOptStr(row.objective) } : {}),
    target_module_ids: JSON.parse(rowStr(row.target_module_ids_json) || '[]') as string[],
    ...(rowOptStr(row.reused_from_campaign_id) ? { reused_from_campaign_id: rowOptStr(row.reused_from_campaign_id) } : {}),
    created_at: rowStr(row.created_at),
    updated_at: rowStr(row.updated_at),
    closed_at: rowOptStr(row.closed_at) ?? null,
  };
}

function parseTaskRow(row: Record<string, unknown>): TaskRecord {
  const pendingDecision = rowOptStr(row.pending_decision_json);
  const recoveryCursor = rowOptStr(row.recovery_cursor_json);
  return {
    task_id: rowStr(row.task_id),
    project_id: rowStr(row.project_id),
    campaign_id: rowStr(row.campaign_id),
    ...(rowOptStr(row.module_id) ? { module_id: rowOptStr(row.module_id) } : {}),
    kind: rowStr(row.kind),
    title: rowStr(row.title),
    status: row.status as TaskStatus,
    progress_current: Number(row.progress_current),
    progress_total: Number(row.progress_total),
    progress_unit: rowStr(row.progress_unit),
    pending_decision: pendingDecision
      ? (JSON.parse(pendingDecision) as PendingDecisionContract)
      : null,
    recovery_cursor: recoveryCursor
      ? (JSON.parse(recoveryCursor) as RecoveryContract)
      : null,
    error_code: rowOptStr(row.error_code) ?? null,
    created_at: rowStr(row.created_at),
    updated_at: rowStr(row.updated_at),
  };
}

/**
 * Durable QAP Application Service.
 * Sole operational owner of projects, environments, auth profile metadata,
 * modules, campaigns, tasks, capability permissions, and safe isolated lifecycle.
 */
export class QapApplicationService {
  readonly #store: AppServiceSqliteStore;
  readonly #operations: OperationDomain;
  readonly authority: PermissionAuthority;
  readonly artifacts: ManagedArtifactStore;
  readonly importer: LegacyQaImporter;
  readonly block3: Block3ExecutionRepo;
  readonly credentialProvider: ICredentialProvider;
  readonly #knowledgeStores = new Map<string, SqliteKnowledgeAdapter>();
  private readonly activeWork = new Map<string, Set<ActiveTaskHandle>>();
  private readonly deleteTokenTtlMs: number;
  private readonly onProjectDeleted?: (projectId: string, canonicalRoot: string) => void;

  constructor(options: QapApplicationServiceOptions) {
    const safeHost = assertSafeHostPath(options.hostRootDir);
    this.artifacts = new ManagedArtifactStore(safeHost);
    this.#store = new AppServiceSqliteStore(join(this.artifacts.rootDir, 'app-service.sqlite'));
    this.#operations = new OperationDomain(this.#store, options.projectOperationDirectory);
    this.authority = new PermissionAuthority(this.#store, this.#operations);
    this.importer = new LegacyQaImporter(this.#store);
    this.block3 = new Block3ExecutionRepo(this.#store);
    this.credentialProvider = options.credentialProvider ?? new EphemeralCredentialProvider();
    this.deleteTokenTtlMs = options.deleteTokenTtlMs ?? 10 * 60_000;
    this.onProjectDeleted = options.onProjectDeleted;
  }

  get projectOperationDirectory(): string { return this.#operations.directory; }

  bindProjectOperationDirectory(directory: string): void { this.#operations.bind(directory); }

  withProjectOperation<T>(action: (context: ProjectOperationContext) => T, context?: ProjectOperationContext): T {
    return this.#operations.run(action, context);
  }

  private assertActiveProject(projectId: string): ProjectRecord {
    const row = this.#store.get<Record<string, unknown>>('SELECT * FROM projects WHERE project_id = ?', projectId);
    if (!row) {
      throw new ApplicationServiceError('project_not_found', `Proyecto no encontrado: ${projectId}`);
    }
    const project = parseProjectRow(row);
    if (project.status !== 'active') {
      throw new ApplicationServiceError(
        'project_not_active',
        `El proyecto '${projectId}' está en estado '${project.status}'.`,
        { status: project.status },
      );
    }
    return project;
  }

  getTombstoneByRoot(canonicalRoot: string): {
    project_id: string;
    deleted_at: string;
    recovery_bundle_path: string;
  } | null {
    const rootHash = hashCanonicalRoot(assertSafeHostPath(canonicalRoot));
    const row = this.#store.get<{ project_id: string; deleted_at: string; recovery_bundle_path: string }>(
      `SELECT project_id, deleted_at, recovery_bundle_path
       FROM deletion_tombstones
       WHERE root_hash = ?
       ORDER BY deleted_at DESC LIMIT 1`,
      rootHash,
    );
    return row ?? null;
  }

  /** Root retained by a completed deletion, for removing host workspace bindings. */
  getDeletedProjectRoot(projectId: string): string | null {
    return this.#store.get<{ canonical_root: string }>(
      'SELECT canonical_root FROM deletion_tombstones WHERE project_id = ?', projectId,
    )?.canonical_root ?? null;
  }

  isTombstonedRoot(canonicalRoot: string): boolean {
    return this.getTombstoneByRoot(canonicalRoot) !== null;
  }

  /** Legacy tombstones have unknown cleanup state and are never silently upgraded. */
  getRootDeletionState(canonicalRoot: string): RootDeletionState | null {
    const rootHash = hashCanonicalRoot(assertSafeHostPath(canonicalRoot));
    const row = this.#store.get<{ value: string }>('SELECT value FROM host_session_state WHERE key = ?', deletionStateKey(rootHash));
    const state = row ? parseRootDeletionGeneration(row.value, rootHash) : null;
    const tombstone = this.#store.get<{ project_id: string; canonical_root: string; deleted_at: string }>(
      'SELECT project_id, canonical_root, deleted_at FROM deletion_tombstones WHERE root_hash = ? ORDER BY deleted_at DESC LIMIT 1', rootHash,
    );
    if (tombstone && (!state || state.project_id !== tombstone.project_id || state.deleted_at !== tombstone.deleted_at || state.canonical_root !== tombstone.canonical_root)) {
      return { version: 0, root_hash: rootHash, ...tombstone, cleanup_status: 'unknown' };
    }
    return state;
  }

  /** A stale cleanup cannot complete a different deletion epoch. */
  completeRootDeletionCleanup(canonicalRoot: string, generation: string): boolean {
    return this.#operations.run(() => {
      return this.#store.transaction('IMMEDIATE', () => {
        const state = this.getRootDeletionState(canonicalRoot);
        if (!state || state.version !== 1 || state.generation !== generation) return false;
        if (state.cleanup_status === 'completed') return true;
        this.#store.run('UPDATE host_session_state SET value = ?, updated_at = ? WHERE key = ?',
          JSON.stringify({ ...state, cleanup_status: 'completed' }), new Date().toISOString(), deletionStateKey(state.root_hash));
        return true;
      });
    });
  }

  /** Reads a single grant; missing/legacy deletion state never implies authorization. */
  getRootAuthorizationGrant(canonicalRoot: string, grantId: string): RootAuthorizationLookup {
    return this.#store.transaction('DEFERRED', () => {
      const state = this.getRootDeletionState(canonicalRoot);
      if (!state) return { kind: 'never_deleted' };
      if (state.version === 0) return { kind: 'historical_tombstone' };
      const grant = state.authorization_grants?.find(item => item.grant_id === grantId && item.generation === state.generation) ?? null;
      return { kind: 'generation', generation: state.generation, cleanup_status: state.cleanup_status, grant };
    });
  }

  /** Read the durable half of root authority without exposing storage details. */
  getRootAuthorizationSnapshot(canonicalRoot: string): RootAuthorizationSnapshot {
    return this.#store.transaction('DEFERRED', () => {
      const state = this.getRootDeletionState(canonicalRoot);
      if (!state) return { kind: 'no_retained_history' };
      if (state.version === 0) return { kind: 'historical_tombstone' };
      return {
        kind: 'generation', generation: state.generation, cleanup_status: state.cleanup_status,
        published_active_grant: state.cleanup_status === 'completed' && (state.authorization_grants ?? []).some(
          grant => grant.generation === state.generation && grant.status === 'active' && grant.registry_published === true,
        ),
      };
    });
  }

  #initialRootAuthority(root: string): InitialRootAuthority | null {
    const hash = hashCanonicalRoot(root);
    const row = this.#store.get<{ value: string }>('SELECT value FROM host_session_state WHERE key = ?', initialAuthorityKey(hash));
    if (!row) return null;
    let value: InitialRootAuthority;
    try { value = JSON.parse(row.value) as InitialRootAuthority; } catch {
      throw new ApplicationServiceError('invalid_initial_root_authority', 'Autoridad inicial inválida.');
    }
    if (!value || typeof value !== 'object' || Array.isArray(value) ||
        Object.keys(value).sort().join(',') !== 'authorization_grants,canonical_root,generation,root_hash,version' ||
        value.version !== 1 || value.root_hash !== hash || typeof value.canonical_root !== 'string' ||
        normalizePathKey(value.canonical_root) !== normalizePathKey(root) || !isUuidV4(value.generation) ||
        !Array.isArray(value.authorization_grants)) {
      throw new ApplicationServiceError('invalid_initial_root_authority', 'Autoridad inicial inválida.');
    }
    // Reuse the strict grant-history parser; the synthetic deletion fields are not persisted.
    parseRootDeletionGeneration(JSON.stringify({ ...value, project_id: 'initial',
      deleted_at: '2000-01-01T00:00:00.000Z', cleanup_status: 'completed' }), hash);
    return value;
  }

  /** Historic protected ancestors must still have a published, active grant. */
  #protectedAncestorsAllow(root: string, isRegistered?: (root: string) => boolean): boolean {
    for (let parent = dirname(root); parent !== parse(parent).root; parent = dirname(parent)) {
      const state = this.getRootDeletionState(parent);
      if (state && (state.version !== 1 || state.cleanup_status !== 'completed' ||
          !(state.authorization_grants ?? []).some(g => g.generation === state.generation && g.status === 'active' && g.registry_published === true))) return false;
      const initial = state ? null : this.#initialRootAuthority(parent);
      if (initial && !initial.authorization_grants.some(g => g.generation === initial.generation && g.status === 'active' && g.registry_published === true)) return false;
      if ((state || initial) && isRegistered && isRegistered(parent) !== true) return false;
      const deleting = this.#store.get<{ project_id: string }>(
        "SELECT project_id FROM projects WHERE root_hash = ? AND status = 'deleting' LIMIT 1", hashCanonicalRoot(parent));
      if (deleting) return false;
    }
    return true;
  }

  #ancestorReferences(root: string, isRegistered: (root: string) => boolean,
    expected?: RootAuthorizationReference['protected_ancestors']): RootAuthorizationReference['protected_ancestors'] | null {
    const result: Array<{ canonical_root: string; generation: string; grant_id: string }> = [];
    for (let parent = dirname(root); parent !== parse(parent).root; parent = dirname(parent)) {
      const state = this.getRootDeletionState(parent);
      if (state?.version === 0 || (state?.version === 1 && state.cleanup_status !== 'completed')) return null;
      if (this.#store.get("SELECT project_id FROM projects WHERE root_hash = ? AND status = 'deleting' LIMIT 1", hashCanonicalRoot(parent))) return null;
      const authority = state ?? this.#initialRootAuthority(parent);
      if (!authority) continue;
      if (isRegistered(parent) !== true) return null;
      const prior = expected?.[result.length];
      if (expected && (!prior || typeof prior.canonical_root !== 'string' || normalizePathKey(prior.canonical_root) !== normalizePathKey(parent) || prior.generation !== authority.generation)) return null;
      const grant = (authority.authorization_grants ?? []).find(g => g.generation === authority.generation && g.status === 'active' &&
        g.registry_published === true && (!expected || g.grant_id === prior!.grant_id));
      if (!grant) return null;
      result.push({ canonical_root: parent, generation: authority.generation, grant_id: grant.grant_id });
    }
    return expected && expected.length !== result.length ? null : result;
  }

  /** Select one specific published grant under the host coordinator. */
  getRootAuthorizationReference(canonicalRoot: string, isRegistered: (root: string) => boolean, context?: ProjectOperationContext): RootAuthorizationReference | null {
    return this.#operations.run(() => {
      this.#operations.assertBound();
      const root = assertSafeHostPath(canonicalRoot);
      const state = this.getRootDeletionState(root);
      if (typeof isRegistered !== 'function' || isRegistered(root) !== true) return null;
      const ancestors = this.#ancestorReferences(root, isRegistered);
      if (!ancestors) return null;
      if (this.#store.get("SELECT project_id FROM projects WHERE root_hash = ? AND status = 'deleting' LIMIT 1", hashCanonicalRoot(root))) return null;
      if (state?.version === 0 || (state?.version === 1 && state.cleanup_status !== 'completed')) return null;
      const authority = state ?? this.#initialRootAuthority(root);
      if (!authority) return null;
      const grant = (authority.authorization_grants ?? []).find(g => g.generation === authority.generation && g.status === 'active' && g.registry_published === true);
      return grant ? { canonical_root: root, coordination_domain: this.#operations.directory, generation: authority.generation, grant_id: grant.grant_id, protected_ancestors: ancestors } : null;
    }, context);
  }

  /** Validate the original identity; never substitute another live grant. */
  validateRootAuthorizationReference(reference: RootAuthorizationReference, isRegistered: (root: string) => boolean, context?: ProjectOperationContext): boolean {
    return this.#operations.run(() => {
      this.#operations.assertBound();
      if (!reference || typeof reference.canonical_root !== 'string' || typeof reference.coordination_domain !== 'string' ||
          !isUuidV4(reference.generation) || !isUuidV4(reference.grant_id) ||
          normalizePathKey(reference.coordination_domain) !== normalizePathKey(this.#operations.directory)) return false;
      const root = assertSafeHostPath(reference.canonical_root);
      if (root !== reference.canonical_root || typeof isRegistered !== 'function' || !Array.isArray(reference.protected_ancestors) || isRegistered(root) !== true ||
          !this.#ancestorReferences(root, isRegistered, reference.protected_ancestors)) return false;
      if (this.#store.get("SELECT project_id FROM projects WHERE root_hash = ? AND status = 'deleting' LIMIT 1", hashCanonicalRoot(root))) return false;
      const state = this.getRootDeletionState(root);
      if (state?.version === 0 || (state?.version === 1 && state.cleanup_status !== 'completed')) return false;
      const authority = state ?? this.#initialRootAuthority(root);
      return !!authority && authority.generation === reference.generation && (authority.authorization_grants ?? []).some(g =>
        g.generation === reference.generation && g.grant_id === reference.grant_id && g.status === 'active' && g.registry_published === true);
    }, context);
  }

  /** Trusted host integration only: this records a decision, it does not solicit or verify one. */
  recordRootAuthorizationGrant(input: {
    canonicalRoot: string;
    generation: string;
    grantId: string;
    mechanism: 'local_operator_helper';
    registryPublished?: true;
  }): RootAuthorizationGrant {
    if (input.mechanism !== 'local_operator_helper') {
      throw new ApplicationServiceError('invalid_root_authorization_grant', 'Identidad o mecanismo de concesión inválido.');
    }
    return this.#operations.run(() => {
      return this.#store.transaction('IMMEDIATE', () => this.#recordRootAuthorizationGrantInTransaction(input));
    });
  }

  #recordRootAuthorizationGrantInTransaction(input: {
    canonicalRoot: string;
    generation: string;
    grantId: string;
    mechanism: RootAuthorizationGrant['mechanism'];
    registryPublished?: true;
  }): RootAuthorizationGrant {
    if (!isUuidV4(input.grantId) || input.grantId !== input.grantId.toLowerCase() ||
        (input.mechanism !== 'local_operator_helper' && input.mechanism !== 'host_interactive_dialog') ||
        (input.registryPublished !== undefined && input.registryPublished !== true)) {
      throw new ApplicationServiceError('invalid_root_authorization_grant', 'Identidad o mecanismo de concesión inválido.');
    }
    const deleting = this.#store.get<{ project_id: string }>(
      "SELECT project_id FROM projects WHERE root_hash = ? AND status = 'deleting' LIMIT 1",
      hashCanonicalRoot(assertSafeHostPath(input.canonicalRoot)),
    );
    if (deleting) throw new ApplicationServiceError('root_authorization_deletion_in_progress', 'El borrado de la raíz está en curso.');
    const state = this.getRootDeletionState(input.canonicalRoot);
    if (!state || state.version !== 1 || state.generation !== input.generation || state.cleanup_status !== 'completed') {
      throw new ApplicationServiceError('root_authorization_generation_unavailable', 'La generación no está disponible o su limpieza no ha terminado.');
    }
    const grants = state.authorization_grants ?? [];
    const existing = grants.find(grant => grant.grant_id === input.grantId);
    if (existing) {
      if (existing.generation !== input.generation || existing.mechanism !== input.mechanism || existing.registry_published !== input.registryPublished) {
        throw new ApplicationServiceError('root_authorization_grant_conflict', 'La identidad de concesión pertenece a otra operación.');
      }
      return existing;
    }
    const grant: RootAuthorizationGrant = {
      grant_id: input.grantId, generation: state.generation, status: 'active',
      granted_at: new Date().toISOString(), mechanism: input.mechanism,
      ...(input.registryPublished ? { registry_published: true as const } : {}),
    };
    this.#store.run('UPDATE host_session_state SET value = ?, updated_at = ? WHERE key = ?',
      JSON.stringify({ ...state, authorization_grants: [...grants, grant] }), new Date().toISOString(), deletionStateKey(state.root_hash));
    return grant;
  }

  /** Trusted host only. Bind the registry's host domain before opaque synchronous registry I/O. */
  publishRootAuthorization(
    canonicalRoot: string,
    grantId: string,
    publishRegistry: () => void,
    rollbackRegistry: () => void,
    context?: ProjectOperationContext,
    mechanism: RootAuthorizationGrant['mechanism'] = 'local_operator_helper',
  ): void {
    return this.#operations.run(() => {
      this.#operations.assertBound();
      if (mechanism !== 'local_operator_helper' && mechanism !== 'host_interactive_dialog') {
        throw new ApplicationServiceError('invalid_root_authorization_grant', 'Identidad o mecanismo de concesión inválido.');
      }
      this.#store.transaction('IMMEDIATE', () => {
        const root = assertSafeHostPath(canonicalRoot);
        const rootHash = hashCanonicalRoot(root);
        const deleting = this.#store.get<{ project_id: string }>(
          "SELECT project_id FROM projects WHERE root_hash = ? AND status = 'deleting' LIMIT 1", rootHash,
        );
        if (deleting) throw new ApplicationServiceError('root_authorization_deletion_in_progress', 'El borrado de la raíz está en curso.');
        const state = this.getRootDeletionState(root);
        if (state && (state.version !== 1 || state.cleanup_status !== 'completed')) {
          throw new ApplicationServiceError('root_authorization_generation_unavailable', 'La generación no está disponible o su limpieza no ha terminado.');
        }
        if (!this.#protectedAncestorsAllow(root)) throw new ApplicationServiceError('root_authorization_ancestor_blocked', 'Un ancestro protegido no está autorizado.');
        const initial = state ? null : this.#initialRootAuthority(root);
        if (!isUuidV4(grantId) || grantId !== grantId.toLowerCase()) throw new ApplicationServiceError('invalid_root_authorization_grant', 'Identidad de concesión inválida.');
        if (initial?.authorization_grants.some(g => g.grant_id === grantId)) throw new ApplicationServiceError('root_authorization_grant_conflict', 'La identidad de concesión ya existe.');
        const result: unknown = publishRegistry();
        if (result && typeof (result as { then?: unknown }).then === 'function') {
          throw new TypeError('Registry publication must be synchronous');
        }
        if (state) this.#recordRootAuthorizationGrantInTransaction({
          canonicalRoot: root, generation: state.generation,
          grantId, mechanism, registryPublished: true,
        });
        else {
          const authority: InitialRootAuthority = initial ?? { version: 1, canonical_root: root, root_hash: rootHash, generation: randomUUID(), authorization_grants: [] };
          const grant: RootAuthorizationGrant = { grant_id: grantId, generation: authority.generation, status: 'active',
            granted_at: new Date().toISOString(), mechanism, registry_published: true };
          this.#store.run(`INSERT INTO host_session_state (key, value, updated_at) VALUES (?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
            initialAuthorityKey(rootHash), JSON.stringify({ ...authority, authorization_grants: [...authority.authorization_grants, grant] }), new Date().toISOString());
        }
      }, rollbackRegistry);
    }, context);
  }

  /** Revocation is scoped to one exact generation and is idempotent. */
  revokeRootAuthorizationGrant(canonicalRoot: string, generation: string, grantId: string): boolean {
    return this.#operations.run(() => {
      return this.#store.transaction('IMMEDIATE', () => {
        const state = this.getRootDeletionState(canonicalRoot);
        if (!state) {
          const root = assertSafeHostPath(canonicalRoot);
          const initial = this.#initialRootAuthority(root);
          if (!initial || initial.generation !== generation) return false;
          const grant = initial.authorization_grants.find(item => item.grant_id === grantId && item.generation === generation);
          if (!grant) return false;
          if (grant.status === 'revoked') return true;
          this.#store.run('UPDATE host_session_state SET value = ?, updated_at = ? WHERE key = ?',
            JSON.stringify({ ...initial, authorization_grants: initial.authorization_grants.map(item => item.grant_id === grantId ? { ...item, status: 'revoked' } : item) }),
            new Date().toISOString(), initialAuthorityKey(initial.root_hash));
          return true;
        }
        if (state.version !== 1 || state.generation !== generation) return false;
        const grants = state.authorization_grants ?? [];
        const grant = grants.find(item => item.grant_id === grantId && item.generation === generation);
        if (!grant) return false;
        if (grant.status === 'revoked') return true;
        this.#store.run('UPDATE host_session_state SET value = ?, updated_at = ? WHERE key = ?',
          JSON.stringify({ ...state, authorization_grants: grants.map(item => item.grant_id === grantId ? { ...item, status: 'revoked' } : item) }),
          new Date().toISOString(), deletionStateKey(state.root_hash));
        return true;
      });
    });
  }

  /** Clears a root tombstone after an explicit host-confirmed qap_project_reset so qap_init can reinitialize. */
  clearResetTombstone(canonicalRoot: string, expected: { projectId: string; deletedAt: string; generation: string }): void {
    return this.#operations.run(() => {
      const rootHash = hashCanonicalRoot(assertSafeHostPath(canonicalRoot));
      this.#store.transaction('IMMEDIATE', () => {
        const state = this.getRootDeletionState(canonicalRoot);
        if (!state || state.version !== 1 || state.generation !== expected.generation) {
          throw new ApplicationServiceError('project_deletion_state_changed', 'El estado de borrado cambió; no se elimina la lápida.');
        }
        const result = this.#store.run('DELETE FROM deletion_tombstones WHERE root_hash = ? AND project_id = ? AND deleted_at = ?',
          rootHash, expected.projectId, expected.deletedAt);
        if (Number(result.changes) !== 1) {
          throw new ApplicationServiceError('project_deletion_state_changed', 'El estado de borrado cambió; no se elimina la lápida.');
        }
      });
    });
  }

  isRootDeletionInProgress(canonicalRoot: string): boolean {
    return Boolean(this.#store.get("SELECT project_id FROM projects WHERE root_hash = ? AND status = 'deleting' LIMIT 1",
      hashCanonicalRoot(assertSafeHostPath(canonicalRoot))));
  }

  findActiveProjectByRoot(canonicalRoot: string): ProjectRecord | null {
    const rootHash = hashCanonicalRoot(assertSafeHostPath(canonicalRoot));
    const row = this.#store.get<Record<string, unknown>>(
      `SELECT * FROM projects WHERE root_hash = ? AND status IN ('active', 'suspended') LIMIT 1`,
      rootHash,
    );
    return row ? parseProjectRow(row) : null;
  }

  createProject(
    input: CreateProjectInput,
    hostAccess?: {
      readonly reference: RootAuthorizationReference;
      readonly isRegistered: (root: string) => boolean;
    },
  ): ProjectStateSnapshot {
    return this.#operations.run(context => {
      const safeRoot = assertSafeHostPath(input.canonicalRoot);
      if (hostAccess && (normalizePathKey(hostAccess.reference.canonical_root) !== normalizePathKey(safeRoot) ||
          !this.validateRootAuthorizationReference(hostAccess.reference, hostAccess.isRegistered, context))) {
        throw new ApplicationServiceError('workspace_persistent_authority_required', 'La autorización del workspace ya no está vigente.');
      }
      if (this.isRootDeletionInProgress(safeRoot)) throw new ApplicationServiceError('root_authorization_deletion_in_progress', 'El borrado de la raíz está en curso.');
      assertDisjointFromWorkspace(this.artifacts.rootDir, safeRoot);
      if (!existsSync(safeRoot)) {
        mkdirSync(safeRoot, { recursive: true });
      }
      const rootHash = hashCanonicalRoot(safeRoot);

      const existing = this.findActiveProjectByRoot(safeRoot);
      if (existing) {
        throw new ApplicationServiceError(
          'project_already_exists_for_root',
          `Ya existe un proyecto activo (${existing.project_id}) para este workspace.`,
          { existing_project_id: existing.project_id },
        );
      }

      const tombstone = this.getTombstoneByRoot(safeRoot);
      const deletionEpoch = this.getRootDeletionState(safeRoot);
      if (tombstone && !input.allowRecreateDeleted) {
        throw new ApplicationServiceError(
          'project_deleted_tombstone',
          `El workspace tiene un borrado previo (${tombstone.project_id}). Usa recuperación o recreación explícita.`,
          { deleted_project_id: tombstone.project_id, recovery_available: true },
        );
      }

      const projectId = `proj-${randomUUID().slice(0, 12)}`;
      const applicationId = `app-${projectId}`;
      const slug = normalizeSlug(input.name || 'proyecto') || projectId;
      const now = new Date().toISOString();
      const envId = `env-${randomUUID().slice(0, 8)}`;
      const campaignId = `camp-${randomUUID().slice(0, 8)}`;

      let safeDomains: string[] = [];
      const envBaseUrl = input.baseUrl ?? 'http://localhost';
      try {
        const parsed = new URL(envBaseUrl);
        if (parsed.hostname) safeDomains = [parsed.hostname];
      } catch {
        throw new ApplicationServiceError('invalid_base_url', 'URL base de entorno inválida.');
      }

      this.artifacts.ensureProjectWorkspace(projectId);

      this.#store.transaction('IMMEDIATE', () => {
        const currentTombstone = this.getTombstoneByRoot(safeRoot);
        if (currentTombstone?.project_id !== tombstone?.project_id || currentTombstone?.deleted_at !== tombstone?.deleted_at ||
          !sameDeletionEpoch(deletionEpoch, this.getRootDeletionState(safeRoot))) {
          throw new ApplicationServiceError('project_deletion_state_changed', 'El estado de borrado cambió; solicita una nueva operación.');
        }
        if (tombstone && input.allowRecreateDeleted) {
          this.#store.run('DELETE FROM deletion_tombstones WHERE root_hash = ?', rootHash);
        }

        this.#store.run(
          `INSERT INTO projects
            (project_id, name, slug, canonical_root, root_hash, application_id, status, objective, active_env_id, active_campaign_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?)`,
          projectId,
          input.name.trim() || slug,
          slug,
          safeRoot,
          rootHash,
          applicationId,
          input.objective?.trim() || null,
          envId,
          campaignId,
          now,
          now,
        );

        this.#store.run(
          `INSERT INTO environments
            (env_id, project_id, name, base_url, is_production, destructive_actions_allowed, safe_domains_json, tenant_mode, default_tenant, created_at, updated_at)
           VALUES (?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?)`,
          envId,
          projectId,
          input.envName?.trim() || 'local',
          envBaseUrl,
          JSON.stringify(safeDomains),
          input.tenantMode ?? 'single',
          input.defaultTenant ?? null,
          now,
          now,
        );

        this.#store.run(
          `INSERT INTO campaigns
            (campaign_id, project_id, env_id, mode, phase, status, objective, target_module_ids_json, created_at, updated_at)
           VALUES (?, ?, ?, ?, 'ONBOARDING', 'active', ?, '[]', ?, ?)`,
          campaignId,
          projectId,
          envId,
          input.mode ?? 'investigate_and_test',
          input.objective?.trim() || null,
          now,
          now,
        );

        if (hostAccess) {
          this.authority.grant({
            project_id: projectId,
            capability: 'access',
            scope: { root_path: safeRoot, env_id: envId },
            granted_by: 'host_operator',
          });
        }
        this.#store.run(
          `INSERT INTO host_session_state (key, value, updated_at)
           VALUES ('active_project_id', ?, ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
          projectId,
          now,
        );
      });

      return this.resumeProject(projectId);
    });
  }

  listProjects(options: { includeDeleted?: boolean } = {}): {
    active_project_id: string | null;
    projects: ProjectRecord[];
    tombstones?: Array<{ project_id: string; canonical_root: string; deleted_at: string; recovery_bundle_path: string }>;
  } {
    const activeRow = this.#store.get<{ value: string }>(
      "SELECT value FROM host_session_state WHERE key = 'active_project_id'",
    );
    const sql = options.includeDeleted
      ? 'SELECT * FROM projects ORDER BY updated_at DESC'
      : "SELECT * FROM projects WHERE status != 'deleted' ORDER BY updated_at DESC";
    const projects = this.#store.all<Record<string, unknown>>(sql).map(parseProjectRow);
    const activeId = activeRow?.value && projects.some((p) => p.project_id === activeRow.value && p.status === 'active')
      ? activeRow.value
      : null;

    if (!options.includeDeleted) {
      return { active_project_id: activeId, projects };
    }
    const tombstones = this.#store.all<{
      project_id: string;
      canonical_root: string;
      deleted_at: string;
      recovery_bundle_path: string;
    }>('SELECT project_id, canonical_root, deleted_at, recovery_bundle_path FROM deletion_tombstones ORDER BY deleted_at DESC');
    return { active_project_id: activeId, projects, tombstones };
  }

  getActiveProjectId(): string | null {
    const row = this.#store.get<{ value: string }>(
      "SELECT value FROM host_session_state WHERE key = 'active_project_id'",
    );
    if (!row?.value) return null;
    const project = this.#store.get<{ status: string }>('SELECT status FROM projects WHERE project_id = ?', row.value);
    return project?.status === 'active' ? row.value : null;
  }

  selectProject(projectId: string, options: { readOnly?: boolean } = {}): ProjectStateSnapshot {
    this.assertActiveProject(projectId);
    const now = new Date().toISOString();
    this.#store.run(
      `INSERT INTO host_session_state (key, value, updated_at)
       VALUES ('active_project_id', ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      projectId,
      now,
    );
    return this.resumeProject(projectId, options);
  }

  updateProjectObjective(projectId: string, objective: string): ProjectRecord {
    this.assertActiveProject(projectId);
    const now = new Date().toISOString();
    this.#store.run(
      'UPDATE projects SET objective = ?, updated_at = ? WHERE project_id = ?',
      objective,
      now,
      projectId,
    );
    return parseProjectRow(this.#store.get<Record<string, unknown>>('SELECT * FROM projects WHERE project_id = ?', projectId)!);
  }

  resumeProject(projectId: string, options: { readOnly?: boolean } = {}): ProjectStateSnapshot {
    const project = this.assertActiveProject(projectId);
    const env = project.active_env_id
      ? this.#store.get<Record<string, unknown>>('SELECT * FROM environments WHERE env_id = ? AND project_id = ?', project.active_env_id, projectId)
      : this.#store.get<Record<string, unknown>>('SELECT * FROM environments WHERE project_id = ? ORDER BY created_at ASC LIMIT 1', projectId);
    const environment = env ? parseEnvironmentRow(env) : null;

    const campRow = project.active_campaign_id
      ? this.#store.get<Record<string, unknown>>('SELECT * FROM campaigns WHERE campaign_id = ? AND project_id = ?', project.active_campaign_id, projectId)
      : this.#store.get<Record<string, unknown>>(
          "SELECT * FROM campaigns WHERE project_id = ? AND status IN ('active', 'paused') ORDER BY updated_at DESC LIMIT 1",
          projectId,
        );
    const campaign = campRow ? parseCampaignRow(campRow) : null;

    const modules = this.#store
      .all<Record<string, unknown>>('SELECT * FROM modules WHERE project_id = ? ORDER BY created_at ASC, rowid ASC', projectId)
      .map(parseModuleRow);
    const profiles = this.#store
      .all<Record<string, unknown>>('SELECT * FROM profiles WHERE project_id = ? ORDER BY created_at ASC, rowid ASC', projectId)
      .map(parseProfileRow);
    const tasks = this.#store
      .all<Record<string, unknown>>('SELECT * FROM tasks WHERE project_id = ? ORDER BY updated_at DESC, rowid DESC', projectId)
      .map(parseTaskRow);

    const capabilities = this.authority.evaluateAll(projectId, {
      root_path: project.canonical_root,
      ...(environment ? { env_id: environment.env_id, origin: environment.base_url } : {}),
    }, !options.readOnly);

    const activeTask = tasks.find((t) =>
      t.status === 'waiting_decision' || t.status === 'blocked' || t.status === 'in_progress' || t.status === 'pending',
    ) ?? tasks[0];

    const completedModules = modules.filter((m) => m.status === 'closed' || m.status === 'waived').length;
    const totalModules = modules.length;
    const progressCurrent = activeTask ? activeTask.progress_current : completedModules;
    const progressTotal = activeTask ? Math.max(1, activeTask.progress_total) : Math.max(1, totalModules || 1);
    const progressUnit = activeTask ? activeTask.progress_unit : (totalModules > 0 ? 'modules' : 'steps');
    const percent = Math.min(100, Math.round((progressCurrent / progressTotal) * 100));

    const phase = campaign?.phase ?? 'ONBOARDING';
    const progress: ProgressContract = {
      phase,
      stage: activeTask?.kind ?? (campaign ? `phase_${phase.toLowerCase()}` : 'idle'),
      completed: progressCurrent,
      total: progressTotal,
      unit: progressUnit,
      percent,
      ...(activeTask ? { active_task_id: activeTask.task_id } : {}),
      ...(activeTask?.module_id ? { active_module_key: modules.find((m) => m.module_id === activeTask.module_id)?.key } : {}),
      summary: activeTask?.title ?? `Proyecto '${project.name}' en fase ${phase}`,
    };

    const pendingDecision = tasks.find((t) => t.pending_decision &&
      !(phase === 'WORKING' && t.kind === 'discovery_inventory' && t.pending_decision.kind === 'human_review'))?.pending_decision ?? null;

    const recoveryBundleAvailable = this.artifacts.readLatestRecoveryBundle(projectId) !== null;
    const tombstoneBlocked = this.isTombstonedRoot(project.canonical_root);
    const recovery: RecoveryContract = activeTask?.recovery_cursor ?? {
      recoverable: true,
      project_id: projectId,
      ...(campaign ? { campaign_id: campaign.campaign_id } : {}),
      resume_token: `${projectId}:${campaign?.campaign_id ?? 'none'}:${campaign?.updated_at ?? project.updated_at}`,
      ...(activeTask ? { interrupted_task_id: activeTask.task_id } : {}),
      last_completed_step: tasks.find((t) => t.status === 'completed')?.kind ?? 'project_initialized',
      checkpoint_at: activeTask?.updated_at ?? campaign?.updated_at ?? project.updated_at,
      recovery_bundle_available: recoveryBundleAvailable,
      tombstone_blocked: tombstoneBlocked,
    };

    const ingestedDocuments = this.listIngestedDocuments(projectId);
    const discrepancies = this.listDiscrepancies(projectId);
    const moduleCandidates = this.listModuleCandidates(projectId);
    const partialInventories = this.listPartialInventories(projectId);
    const scopeLimits = this.getDeclaredScopeLimits(projectId);

    return {
      project,
      environment,
      campaign,
      modules,
      profiles,
      tasks,
      capabilities,
      progress,
      pending_decision: pendingDecision,
      recovery,
      ingested_documents: ingestedDocuments,
      discrepancies,
      module_candidates: moduleCandidates,
      partial_inventories: partialInventories,
      scope_limits: scopeLimits,
    };
  }

  openKnowledgeStore(projectId: string): SqliteKnowledgeAdapter {
    const existing = this.#knowledgeStores.get(projectId);
    if (existing) return existing;
    this.assertActiveProject(projectId);
    const layout = this.artifacts.ensureProjectWorkspace(projectId);
    const store = new SqliteKnowledgeAdapter(layout.knowledgeDbPath);
    this.#knowledgeStores.set(projectId, store);
    return store;
  }

  closeKnowledgeStore(projectId: string): void {
    const existing = this.#knowledgeStores.get(projectId);
    if (existing) {
      existing.close();
      this.#knowledgeStores.delete(projectId);
    }
  }

  upsertEnvironment(input: UpsertEnvironmentInput): EnvironmentRecord {
    this.assertActiveProject(input.projectId);
    const existing = this.#store.get<Record<string, unknown>>(
      'SELECT * FROM environments WHERE project_id = ? AND name = ?',
      input.projectId,
      input.name,
    );
    const now = new Date().toISOString();
    let safeDomains = input.safeDomains ? [...input.safeDomains] : [];
    if (safeDomains.length === 0) {
      try {
        const parsed = new URL(input.baseUrl);
        if (parsed.hostname) safeDomains = [parsed.hostname];
      } catch {
        throw new ApplicationServiceError('invalid_base_url', 'URL base inválida para el entorno.');
      }
    }

    const envId = existing ? String(existing.env_id) : `env-${randomUUID().slice(0, 8)}`;
    this.#store.transaction('IMMEDIATE', () => {
      if (existing) {
        this.#store.run(
          `UPDATE environments
           SET base_url = ?, is_production = ?, destructive_actions_allowed = ?, safe_domains_json = ?, tenant_mode = ?, default_tenant = ?, updated_at = ?
           WHERE env_id = ?`,
          input.baseUrl,
          input.isProduction ? 1 : 0,
          input.destructiveActionsAllowed ? 1 : 0,
          JSON.stringify(safeDomains),
          input.tenantMode ?? 'single',
          input.defaultTenant ?? null,
          now,
          envId,
        );
      } else {
        this.#store.run(
          `INSERT INTO environments
            (env_id, project_id, name, base_url, is_production, destructive_actions_allowed, safe_domains_json, tenant_mode, default_tenant, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          envId,
          input.projectId,
          input.name,
          input.baseUrl,
          input.isProduction ? 1 : 0,
          input.destructiveActionsAllowed ? 1 : 0,
          JSON.stringify(safeDomains),
          input.tenantMode ?? 'single',
          input.defaultTenant ?? null,
          now,
          now,
        );
      }
      this.#store.run(
        'UPDATE projects SET active_env_id = COALESCE(active_env_id, ?), updated_at = ? WHERE project_id = ?',
        envId,
        now,
        input.projectId,
      );
    });

    return parseEnvironmentRow(this.#store.get<Record<string, unknown>>('SELECT * FROM environments WHERE env_id = ?', envId)!);
  }

  upsertProfile(input: UpsertProfileInput): AuthProfileRecord {
    return this.#operations.run(() => {
      this.assertActiveProject(input.projectId);
      const existing = this.#store.get<Record<string, unknown>>(
        'SELECT * FROM profiles WHERE project_id = ? AND env_id = ? AND label = ?',
        input.projectId,
        input.envId,
        input.label,
      );
      const now = new Date().toISOString();
      const profileId = rowStr(existing?.profile_id) || `prof-${randomUUID().slice(0, 8)}`;
      const status = input.status ?? (existing ? (existing.status as AuthProfileLifecycleStatus) : 'pending');
      const credentialRefKey = input.credentialAccount ?? rowOptStr(existing?.credential_ref_key) ?? input.label;

      if (existing) {
        this.#store.run(
          `UPDATE profiles
         SET role_name = COALESCE(?, role_name), tenant_id = COALESCE(?, tenant_id),
             login_mode = ?, credential_ref_key = ?, status = ?, updated_at = ?
         WHERE profile_id = ?`,
          input.roleName ?? null,
          input.tenantId ?? null,
          input.loginMode ?? String(existing.login_mode),
          credentialRefKey,
          status,
          now,
          profileId,
        );
      } else {
        this.#store.run(
          `INSERT INTO profiles
          (profile_id, project_id, env_id, label, role_name, tenant_id, login_mode, credential_ref_key, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          profileId,
          input.projectId,
          input.envId,
          input.label,
          input.roleName ?? null,
          input.tenantId ?? null,
          input.loginMode ?? 'auto',
          credentialRefKey,
          status,
          now,
          now,
        );
      }
      return parseProfileRow(this.#store.get<Record<string, unknown>>('SELECT * FROM profiles WHERE profile_id = ?', profileId)!);
    });
  }

  /** Record only the replaced credential reference, before publishing its replacement. */
  stageReplacedCredential(reference: CredentialReference): void {
    const key = `credential_cleanup:v1:${randomUUID()}`;
    this.#store.run('INSERT INTO host_session_state (key,value,updated_at) VALUES (?,?,?)',
      key, JSON.stringify(reference), new Date().toISOString());
  }

  /** Retry interrupted rotations without ever deleting a profile's current reference. */
  async reconcileReplacedCredentials(provider: ICredentialProvider = this.credentialProvider): Promise<void> {
    const keys = this.#store.all<{ key: string }>(
      "SELECT key FROM host_session_state WHERE key LIKE 'credential_cleanup:v1:%' ORDER BY key");
    for (const { key } of keys) {
      try {
        const ref = this.withProjectOperation(() => {
          const record = this.#store.get<{ value: string }>('SELECT value FROM host_session_state WHERE key = ?', key);
          if (!record) return null;
          const parsed = JSON.parse(record.value) as CredentialReference;
          const profile = this.#store.get<{ credential_ref_key: string | null }>(
            'SELECT credential_ref_key FROM profiles WHERE project_id = ? AND env_id = ? AND profile_id = ?',
            parsed.projectId, parsed.environment, parsed.auth_profile_id);
          if (profile?.credential_ref_key === parsed.account) {
            this.#store.run('DELETE FROM host_session_state WHERE key = ?', key);
            return null;
          }
          return parsed;
        });
        if (!ref) continue;
        await provider.delete(ref);
        this.withProjectOperation(() => {
          this.#store.run('DELETE FROM host_session_state WHERE key = ?', key);
        });
      } catch { /* Keep the reference for the next administrative start or rotation. */ }
    }
  }

  async storeProfileSecret(
    projectId: string,
    profileId: string,
    credentials: { username?: string; password?: string; token?: string },
  ): Promise<void> {
    const project = this.assertActiveProject(projectId);
    const row = this.#store.get<Record<string, unknown>>(
      'SELECT * FROM profiles WHERE profile_id = ? AND project_id = ?',
      profileId,
      projectId,
    );
    if (!row) {
      throw new ApplicationServiceError('profile_not_found', `Perfil no encontrado: ${profileId}`);
    }
    const profile = parseProfileRow(row);
    const ref = credentialRefFor(project, profile);
    await this.credentialProvider.set(ref, credentials);
  }

  async readProfileSecret(
    projectId: string,
    profileId: string,
  ): Promise<{ username?: string; password?: string; token?: string } | null> {
    const project = this.assertActiveProject(projectId);
    const row = this.#store.get<Record<string, unknown>>(
      'SELECT * FROM profiles WHERE profile_id = ? AND project_id = ?',
      profileId,
      projectId,
    );
    if (!row) return null;
    const profile = parseProfileRow(row);
    if (profile.status === 'revoked') return null;
    return this.credentialProvider.get(credentialRefFor(project, profile));
  }

  upsertModule(input: UpsertModuleInput): ModuleRecord {
    this.assertActiveProject(input.projectId);
    const key = normalizeSlug(input.key) || input.key.trim().toLowerCase();
    const existing = this.#store.get<Record<string, unknown>>(
      'SELECT * FROM modules WHERE project_id = ? AND key = ?',
      input.projectId,
      key,
    );
    const now = new Date().toISOString();
    const moduleId = existing ? String(existing.module_id) : `mod-${randomUUID().slice(0, 8)}`;

    if (existing) {
      this.#store.run(
        `UPDATE modules
         SET title = COALESCE(?, title), route_hint = COALESCE(?, route_hint),
             priority = COALESCE(?, priority), criticality = COALESCE(?, criticality),
             status = COALESCE(?, status), knowledge_module_id = COALESCE(?, knowledge_module_id),
             knowledge_revision = COALESCE(?, knowledge_revision),
             waiver_reason = COALESCE(?, waiver_reason),
             closed_at = CASE WHEN ? IN ('closed', 'waived') THEN COALESCE(closed_at, ?) ELSE closed_at END,
             updated_at = ?
         WHERE module_id = ?`,
        input.title ?? null,
        input.routeHint ?? null,
        input.priority ?? null,
        input.criticality ?? null,
        input.status ?? null,
        input.knowledgeModuleId ?? null,
        input.knowledgeRevision ?? null,
        input.waiverReason ?? null,
        input.status ?? String(existing.status),
        now,
        now,
        moduleId,
      );
    } else {
      this.#store.run(
        `INSERT INTO modules
          (module_id, project_id, key, title, route_hint, priority, criticality, status, knowledge_module_id, knowledge_revision, waiver_reason, closed_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        moduleId,
        input.projectId,
        key,
        input.title ?? key,
        input.routeHint ?? null,
        input.priority ?? 'medium',
        input.criticality ?? 'medium',
        input.status ?? 'candidate',
        input.knowledgeModuleId ?? null,
        input.knowledgeRevision ?? null,
        input.waiverReason ?? null,
        input.status === 'closed' || input.status === 'waived' ? now : null,
        now,
        now,
      );
    }
    return parseModuleRow(this.#store.get<Record<string, unknown>>('SELECT * FROM modules WHERE module_id = ?', moduleId)!);
  }

  startCampaign(input: StartCampaignInput): CampaignRecord {
    const project = this.assertActiveProject(input.projectId);
    const envId = input.envId ?? project.active_env_id;
    if (!envId) {
      throw new ApplicationServiceError('environment_required', 'El proyecto no tiene entorno activo para iniciar campaña.');
    }
    const campaignId = `camp-${randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    this.#store.transaction('IMMEDIATE', () => {
      this.#store.run(
        `UPDATE campaigns SET status = 'paused', updated_at = ? WHERE project_id = ? AND status = 'active'`,
        now,
        input.projectId,
      );
      this.#store.run(
        `INSERT INTO campaigns
          (campaign_id, project_id, env_id, mode, phase, status, objective, target_module_ids_json, reused_from_campaign_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?)`,
        campaignId,
        input.projectId,
        envId,
        input.mode,
        input.phase ?? 'ONBOARDING',
        input.objective ?? null,
        JSON.stringify(input.targetModuleIds ?? []),
        input.reusedFromCampaignId ?? null,
        now,
        now,
      );
      this.#store.run(
        'UPDATE projects SET active_campaign_id = ?, updated_at = ? WHERE project_id = ?',
        campaignId,
        now,
        input.projectId,
      );
    });
    return parseCampaignRow(this.#store.get<Record<string, unknown>>('SELECT * FROM campaigns WHERE campaign_id = ?', campaignId)!);
  }

  updateCampaignPhase(campaignId: string, phase: CampaignPhase, status?: CampaignStatus): CampaignRecord {
    const row = this.#store.get<Record<string, unknown>>('SELECT * FROM campaigns WHERE campaign_id = ?', campaignId);
    if (!row) {
      throw new ApplicationServiceError('campaign_not_found', `Campaña no encontrada: ${campaignId}`);
    }
    const now = new Date().toISOString();
    const nextStatus = status ?? (row.status as CampaignStatus);
    this.#store.run(
      `UPDATE campaigns
       SET phase = ?, status = ?, closed_at = CASE WHEN ? IN ('completed', 'aborted') THEN COALESCE(closed_at, ?) ELSE closed_at END, updated_at = ?
       WHERE campaign_id = ?`,
      phase,
      nextStatus,
      nextStatus,
      now,
      now,
      campaignId,
    );
    return parseCampaignRow(this.#store.get<Record<string, unknown>>('SELECT * FROM campaigns WHERE campaign_id = ?', campaignId)!);
  }

  upsertTask(input: UpsertTaskInput): TaskRecord {
    this.assertActiveProject(input.projectId);
    const now = new Date().toISOString();
    const existing = input.taskId
      ? this.#store.get<Record<string, unknown>>('SELECT * FROM tasks WHERE task_id = ? AND project_id = ?', input.taskId, input.projectId)
      : undefined;
    const taskId = existing ? String(existing.task_id) : (input.taskId ?? `task-${randomUUID().slice(0, 8)}`);

    if (existing) {
      this.#store.run(
        `UPDATE tasks
         SET title = ?, status = ?, progress_current = ?, progress_total = ?, progress_unit = ?,
             pending_decision_json = ?, recovery_cursor_json = ?, error_code = ?, updated_at = ?
         WHERE task_id = ?`,
        input.title,
        input.status ?? String(existing.status),
        input.progressCurrent ?? Number(existing.progress_current),
        input.progressTotal ?? Number(existing.progress_total),
        input.progressUnit ?? String(existing.progress_unit),
        input.pendingDecision !== undefined ? (input.pendingDecision ? JSON.stringify(input.pendingDecision) : null) : existing.pending_decision_json as string | null,
        input.recoveryCursor !== undefined ? (input.recoveryCursor ? JSON.stringify(input.recoveryCursor) : null) : existing.recovery_cursor_json as string | null,
        input.errorCode !== undefined ? input.errorCode : existing.error_code as string | null,
        now,
        taskId,
      );
    } else {
      this.#store.run(
        `INSERT INTO tasks
          (task_id, project_id, campaign_id, module_id, kind, title, status, progress_current, progress_total, progress_unit, pending_decision_json, recovery_cursor_json, error_code, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        taskId,
        input.projectId,
        input.campaignId,
        input.moduleId ?? null,
        input.kind,
        input.title,
        input.status ?? 'pending',
        input.progressCurrent ?? 0,
        input.progressTotal ?? 1,
        input.progressUnit ?? 'steps',
        input.pendingDecision ? JSON.stringify(input.pendingDecision) : null,
        input.recoveryCursor ? JSON.stringify(input.recoveryCursor) : null,
        input.errorCode ?? null,
        now,
        now,
      );
    }
    return parseTaskRow(this.#store.get<Record<string, unknown>>('SELECT * FROM tasks WHERE task_id = ?', taskId)!);
  }

  saveManagedArtifact(
    projectId: string,
    category: ManagedArtifactCategory,
    relativeName: string,
    content: string | Buffer,
  ): StoredArtifactReceipt {
    this.assertActiveProject(projectId);
    const receipt = this.artifacts.writeProjectArtifact(projectId, category, relativeName, content);
    this.#store.run(
      `INSERT INTO owned_artifacts (artifact_id, project_id, category, relative_path, sha256, bytes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(project_id, relative_path) DO UPDATE SET
         artifact_id = excluded.artifact_id,
         sha256 = excluded.sha256,
         bytes = excluded.bytes,
         created_at = excluded.created_at`,
      receipt.artifact_id,
      projectId,
      receipt.category,
      receipt.relative_path,
      receipt.sha256,
      receipt.bytes,
      receipt.created_at,
    );
    return receipt;
  }

  registerActiveWork(
    projectId: string,
    taskId: string,
    controller: AbortController,
    promise: Promise<unknown>,
  ): () => void {
    const handle: ActiveTaskHandle = { projectId, taskId, controller, promise };
    let bucket = this.activeWork.get(projectId);
    if (!bucket) {
      bucket = new Set();
      this.activeWork.set(projectId, bucket);
    }
    bucket.add(handle);
    const cleanup = () => {
      bucket?.delete(handle);
      if (bucket && bucket.size === 0) {
        this.activeWork.delete(projectId);
      }
    };
    void promise.finally(cleanup);
    return cleanup;
  }

  /** Local host administration; never exposed as an MCP operation. */
  issueImportReadGrant(candidate: string): ImportReadReference {
    return this.#operations.run(() => {
      this.#operations.assertBound();
      const root = assertSafeHostPath(candidate);
      if (!existsSync(root) || !lstatSync(root).isDirectory()) throw new Error('invalid_import_read_root');
      const ref: ImportReadReference = { version: 1, purpose: 'import_read', canonical_root: root,
        coordination_domain: this.#operations.directory, grant_id: randomUUID(), generation: randomUUID(), status: 'active' };
      this.#store.run('INSERT INTO host_session_state (key,value,updated_at) VALUES (?,?,?)',
        `import_read:v1:${hashCanonicalRoot(root)}:${ref.grant_id}`, JSON.stringify(ref), new Date().toISOString());
      return ref;
    });
  }

  revokeImportReadGrant(candidate: string, grantId: string): boolean {
    return this.#operations.run(() => {
      this.#operations.assertBound();
      const root = assertSafeHostPath(candidate);
      const ref = this.getImportReadReference(root, grantId);
      if (!ref) return false;
      this.#store.run('UPDATE host_session_state SET value = ?, updated_at = ? WHERE key = ?',
        JSON.stringify({ ...ref, status: 'revoked' }), new Date().toISOString(),
        `import_read:v1:${hashCanonicalRoot(root)}:${grantId}`);
      return true;
    });
  }

  getImportReadReference(candidate: string, grantId?: string): ImportReadReference | null {
    return this.#operations.run(() => {
      this.#operations.assertBound();
      const root = assertSafeHostPath(candidate);
      if (!existsSync(root) || !lstatSync(root).isDirectory()) return null;
      const prefix = `import_read:v1:${hashCanonicalRoot(root)}:`;
      const rows = grantId ? this.#store.all<{ key: string; value: string }>('SELECT key,value FROM host_session_state WHERE key = ?', prefix + grantId)
        : this.#store.all<{ key: string; value: string }>('SELECT key,value FROM host_session_state WHERE key LIKE ? ORDER BY key', prefix + '%');
      for (const row of rows) {
        try {
          const r = JSON.parse(row.value) as ImportReadReference;
          if (Object.keys(r).sort().join(',') !== 'canonical_root,coordination_domain,generation,grant_id,purpose,status,version' ||
              r.version !== 1 || r.purpose !== 'import_read' || r.status !== 'active' || !isUuidV4(r.generation) || !isUuidV4(r.grant_id) ||
              row.key !== prefix + r.grant_id || normalizePathKey(r.canonical_root) !== normalizePathKey(root) ||
              normalizePathKey(r.coordination_domain) !== normalizePathKey(this.#operations.directory)) continue;
          return r;
        } catch { return null; }
      }
      return null;
    });
  }

  validateImportReadReference(ref: ImportReadReference): boolean {
    try {
      if (!ref || Object.keys(ref).sort().join(',') !== 'canonical_root,coordination_domain,generation,grant_id,purpose,status,version' ||
          ref.version !== 1 || ref.purpose !== 'import_read' || ref.status !== 'active' ||
          !isUuidV4(ref.grant_id) || !isUuidV4(ref.generation)) return false;
      const current = this.getImportReadReference(ref.canonical_root, ref.grant_id);
      return !!current && current.generation === ref.generation && current.coordination_domain === ref.coordination_domain &&
        current.canonical_root === ref.canonical_root;
    } catch { return false; }
  }

  getImportReadBinding(importId: string): ImportReadReference | null {
    const row = this.#store.get<{ value: string }>('SELECT value FROM host_session_state WHERE key = ?', `import_read_binding:v1:${importId}`);
    try { return row ? JSON.parse(row.value) as ImportReadReference : null; } catch { return null; }
  }

  importLegacyQa(projectId: string, sourceRoot?: string, sourceReference?: ImportReadReference): LegacyQaImportReceipt {
    const project = this.assertActiveProject(projectId);
    return this.importer.importWorkspace(projectId, sourceRoot ?? project.canonical_root, sourceReference ? importId => {
      this.#store.run('INSERT INTO host_session_state (key,value,updated_at) VALUES (?,?,?)',
        `import_read_binding:v1:${importId}`, JSON.stringify(sourceReference), new Date().toISOString());
    } : undefined);
  }

  getLegacyImportIdentity(importId: string): { project_id: string; source_root: string } | null {
    return this.#store.get<{ project_id: string; source_root: string }>(
      'SELECT project_id, source_root FROM import_manifests WHERE import_id = ?', importId,
    ) ?? null;
  }

  verifyLegacyImport(importId: string, sourceRoot?: string): LegacyQaVerificationResult {
    return this.importer.verifyImport(importId, sourceRoot);
  }

  previewDelete(projectId: string, options: { binding?: unknown; persist?: boolean } = {}): DeleteScopePreview {
    const project = this.assertActiveProject(projectId);
    const countOf = (table: string): number =>
      Number((this.#store.get<{ c: number }>(`SELECT COUNT(*) AS c FROM ${table} WHERE project_id = ?`, projectId))?.c ?? 0);

    const hostPaths = this.artifacts.listOwnedProjectPaths(projectId);
    const profiles = this.#store
      .all<Record<string, unknown>>('SELECT * FROM profiles WHERE project_id = ?', projectId)
      .map(parseProfileRow);
    const credentialRefs = profiles
      .map((p) => referenceKey(credentialRefFor(project, p)))
      .sort();
    const sessionArtifacts = profiles
      .filter((p) => Boolean(p.session_artifact_id))
      .map((p) => String(p.session_artifact_id))
      .sort();
    const activeGrants = Number(
      this.#store.get<{ c: number }>(
        "SELECT COUNT(*) AS c FROM permission_grants WHERE project_id = ? AND status = 'active'",
        projectId,
      )?.c ?? 0,
    );
    const activeTasks = Number(
      this.#store.get<{ c: number }>(
        "SELECT COUNT(*) AS c FROM tasks WHERE project_id = ? AND status IN ('pending', 'in_progress', 'blocked', 'waiting_decision')",
        projectId,
      )?.c ?? 0,
    ) + (this.activeWork.get(projectId)?.size ?? 0);

    const qaDir = join(project.canonical_root, '.qa');
    const workspaceQaFiles = existsSync(qaDir) ? listSafeFiles(qaDir) : [];

    const sqliteRecords = {
      projects: 1,
      environments: countOf('environments'),
      profiles: countOf('profiles'),
      modules: countOf('modules'),
      campaigns: countOf('campaigns'),
      tasks: countOf('tasks'),
      permission_grants: countOf('permission_grants'),
      owned_artifacts: countOf('owned_artifacts'),
      import_manifests: countOf('import_manifests'),
    };

    // Counts alone miss replacement or modification of records between preview
    // and confirmation. Keep their digest private while binding the preview.
    const sqliteContent = Object.keys(sqliteRecords).map(table => [table,
      this.#store.all<Record<string, unknown>>(`SELECT * FROM ${table} WHERE project_id = ? ORDER BY rowid`, projectId),
    ]);

    const scopeMaterial = {
      project_id: projectId,
      sqliteRecords,
      sqliteContent,
      hostPaths,
      credentialRefs,
      sessionArtifacts,
      activeGrants,
      activeTasks,
      workspaceQaFiles,
    };
    const scopeHash = sha256Text(JSON.stringify(scopeMaterial));
    const token = `del_${randomUUID().replace(/-/g, '')}`;
    const tokenHash = sha256Text(token);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.deleteTokenTtlMs).toISOString();

    const preview: DeleteScopePreview = {
      project_id: projectId,
      project_name: project.name,
      canonical_root: project.canonical_root,
      confirmation_token: token,
      expires_at: expiresAt,
      scope_hash: scopeHash,
      owned_resources: {
        sqlite_records: sqliteRecords,
        host_paths: hostPaths,
        managed_artifacts: sqliteRecords.owned_artifacts,
        credential_refs: credentialRefs,
        session_artifacts: sessionArtifacts,
        active_grants: activeGrants,
        active_tasks_to_drain: activeTasks,
        workspace_qa_files: workspaceQaFiles,
      },
      source_files_untouched: true,
      neighboring_projects_untouched: true,
    };

    if (options.persist !== false) this.#store.run(
      `INSERT INTO pending_delete_requests
        (token_hash, project_id, scope_hash, scope_preview_json, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      tokenHash,
      projectId,
      scopeHash,
      JSON.stringify({ ...preview, delete_binding: options.binding }),
      expiresAt,
      now.toISOString(),
    );

    return preview;
  }

  /** Resume only a consumed, fully identified deletion. Incomplete legacy rows stay blocked. */
  async reconcilePendingDeletion(): Promise<Array<{ project_id: string; status: 'deleted' | 'blocked'; reason?: string }>> {
    const projects = this.#store.all<{ project_id: string }>("SELECT project_id FROM projects WHERE status = 'deleting' ORDER BY project_id");
    const results: Array<{ project_id: string; status: 'deleted' | 'blocked'; reason?: string }> = [];
    for (const { project_id: projectId } of projects) {
      try {
        await this.#operations.run(async () => {
          const row = this.#store.get<Record<string, unknown>>('SELECT * FROM projects WHERE project_id = ?', projectId);
          if (!row || row.status === 'deleted') return;
          if (row.status !== 'deleting') throw new Error('project_deletion_state_changed');
          const project = parseProjectRow(row);
          const requests = this.#store.all<{ scope_hash: string; scope_preview_json: string; consumed_at: string }>(
            'SELECT scope_hash, scope_preview_json, consumed_at FROM pending_delete_requests WHERE project_id = ? AND consumed_at IS NOT NULL', projectId);
          if (requests.length !== 1) throw new Error('deletion_intent_missing_or_ambiguous');
          const request = requests[0]!;
          const preview = JSON.parse(request.scope_preview_json) as DeleteScopePreview & { delete_operation?: Record<string, unknown> };
          const intent = preview.delete_operation;
          if (!intent || intent.version !== 1 || intent.project_id !== projectId ||
              intent.canonical_root !== project.canonical_root || intent.root_hash !== project.root_hash ||
              hashCanonicalRoot(project.canonical_root) !== project.root_hash ||
              intent.scope_hash !== request.scope_hash || preview.scope_hash !== request.scope_hash ||
              preview.project_id !== projectId || preview.canonical_root !== project.canonical_root ||
              typeof intent.generation !== 'string' || !/^[0-9a-f-]{36}$/i.test(intent.generation) ||
              intent.started_at !== request.consumed_at || typeof intent.purge_workspace_qa !== 'boolean' ||
              !preview.owned_resources || !Array.isArray(preview.owned_resources.host_paths) ||
              !Array.isArray(preview.owned_resources.workspace_qa_files) || !Array.isArray(intent.file_identities) ||
              !Array.isArray(intent.directory_identities)) {
            throw new Error('deletion_intent_invalid');
          }
          assertSafeHostPath(project.canonical_root);
          if (!existsSync(project.canonical_root)) throw new Error('deletion_root_missing');
          // A partial deletion may remove entries, but it must never acquire new ones.
          const identities = intent.file_identities as Array<{ path: string; dev: number; ino: number; birthtimeMs: number }>;
          const directories = intent.directory_identities as Array<{ path: string; dev: number; ino: number; birthtimeMs: number }>;
          const checkTree = (directory: string, approved: readonly string[]) => {
            if (!approved.every(path => typeof path === 'string' && isPathWithin(directory, path))) throw new Error('deletion_scope_invalid');
            if (!approved.every(path => identities.some(item => item && item.path === path &&
              typeof item.dev === 'number' && typeof item.ino === 'number' && typeof item.birthtimeMs === 'number'))) throw new Error('deletion_file_identity_missing');
            if (!existsSync(directory)) return;
            const visit = (dir: string): void => {
              assertSafeHostPath(dir);
              const expected = directories.find(item => item && normalizePathKey(item.path) === normalizePathKey(dir));
              const current = lstatSync(dir);
              if (!expected || current.dev !== expected.dev || current.ino !== expected.ino || current.birthtimeMs !== expected.birthtimeMs) throw new Error('deletion_directory_changed');
              for (const entry of readdirSync(dir, { withFileTypes: true })) {
                const path = join(dir, entry.name);
                if (entry.isSymbolicLink()) throw new Error('deletion_scope_link');
                assertSafeHostPath(path);
                if (entry.isDirectory()) visit(path);
                else {
                  const identity = identities.find(item => item && normalizePathKey(item.path) === normalizePathKey(path));
                  if (!entry.isFile() || !approved.some(item => normalizePathKey(item) === normalizePathKey(path)) || !identity) throw new Error('deletion_scope_changed');
                  const stat = lstatSync(path);
                  if (stat.dev !== identity.dev || stat.ino !== identity.ino || stat.birthtimeMs !== identity.birthtimeMs) throw new Error('deletion_file_replaced');
                }
              }
            };
            visit(directory);
          };
          const hostPaths = preview.owned_resources.host_paths;
          const projectDirectory = this.artifacts.projectDir(projectId);
          const validateScope = () => {
            assertSafeHostPath(project.canonical_root);
            checkTree(projectDirectory, hostPaths);
            if (intent.purge_workspace_qa) checkTree(join(project.canonical_root, '.qa'), preview.owned_resources.workspace_qa_files);
          };
          validateScope();
          await this.finishDeletion(project, intent.started_at as string, intent.generation as string,
            { purgeWorkspaceQa: intent.purge_workspace_qa, validateScope });
        });
        results.push({ project_id: projectId, status: 'deleted' });
      } catch (error) {
        results.push({ project_id: projectId, status: 'blocked', reason: error instanceof Error ? error.message : String(error) });
      }
    }
    return results;
  }

  async confirmDelete(
    projectId: string,
    confirmationToken: string,
    decision: string,
    options: { purgeWorkspaceQa?: boolean; onDeletionGeneration?: (generation: string) => void; binding?: unknown; context?: ProjectOperationContext } = {},
  ): Promise<DeleteExecutionReceipt> {
    return this.#operations.run(() => this.finishConfirmedDelete(projectId, confirmationToken, decision, options), options.context);
  }

  private async finishConfirmedDelete(
    projectId: string,
    confirmationToken: string,
    decision: string,
    options: { purgeWorkspaceQa?: boolean; onDeletionGeneration?: (generation: string) => void; binding?: unknown; context?: ProjectOperationContext },
  ): Promise<DeleteExecutionReceipt> {
    const { project, now, deletionGeneration } = this.#operations.run(() => {
      if (decision !== 'confirm_delete') {
        throw new ApplicationServiceError(
          'delete_decision_not_confirmed',
          'El borrado requiere decision explícita "confirm_delete".',
        );
      }
      const project = this.assertActiveProject(projectId);
      const tokenHash = sha256Text(confirmationToken);
      const reqRow = this.#store.get<{
        token_hash: string;
        project_id: string;
        scope_hash: string;
        expires_at: string;
        consumed_at: string | null;
        scope_preview_json: string;
      }>(
        'SELECT token_hash, project_id, scope_hash, expires_at, consumed_at, scope_preview_json FROM pending_delete_requests WHERE token_hash = ? AND project_id = ?',
        tokenHash,
        projectId,
      );

      if (!reqRow) {
        throw new ApplicationServiceError('delete_token_invalid', 'Token de confirmación de borrado inválido o desconocido.');
      }
      if (reqRow.consumed_at) {
        throw new ApplicationServiceError('delete_token_already_used', 'El token de confirmación de borrado ya fue utilizado.');
      }
      if (!Number.isFinite(Date.parse(reqRow.expires_at)) || Date.parse(reqRow.expires_at) <= Date.now()) {
        throw new ApplicationServiceError('delete_token_expired', 'El token de confirmación de borrado ha expirado; solicita una nueva vista previa.');
      }

      if (options.binding !== undefined) {
        let binding: unknown;
        try { binding = (JSON.parse(reqRow.scope_preview_json) as { delete_binding?: unknown }).delete_binding; } catch { /* fail closed */ }
        if (JSON.stringify(binding) !== JSON.stringify(options.binding)) {
          throw new ApplicationServiceError('delete_preview_stale', 'La autorización o la operación cambió; solicita una nueva vista previa.');
        }
      }
      if (this.previewDelete(projectId, { persist: false }).scope_hash !== reqRow.scope_hash) {
        throw new ApplicationServiceError('delete_preview_stale', 'El alcance cambió; solicita una nueva vista previa.');
      }

      const now = new Date().toISOString();

      // 1. Mark deleting & consume confirmation token atomically
      const deletionGeneration = randomUUID();
      // Keep the original operation identity and requested cleanup with the
      // consumed preview. A process restart must never invent a generation or
      // infer whether workspace cleanup was approved.
      const startedPreview = JSON.parse(reqRow.scope_preview_json) as Record<string, unknown>;
      const resources = (startedPreview as unknown as DeleteScopePreview).owned_resources;
      const fileIdentities = [...resources.host_paths, ...(options.purgeWorkspaceQa ? resources.workspace_qa_files : [])].map(path => {
        const stat = lstatSync(assertSafeHostPath(path));
        if (!stat.isFile()) throw new ApplicationServiceError('delete_preview_stale', 'El alcance cambió; solicita una nueva vista previa.');
        return { path, dev: stat.dev, ino: stat.ino, birthtimeMs: stat.birthtimeMs };
      });
      const directoryIdentities: Array<{ path: string; dev: number; ino: number; birthtimeMs: number }> = [];
      const recordDirectories = (path: string): void => {
        if (!existsSync(path)) return;
        const stat = lstatSync(assertSafeHostPath(path));
        if (!stat.isDirectory()) throw new ApplicationServiceError('delete_preview_stale', 'El alcance cambió; solicita una nueva vista previa.');
        directoryIdentities.push({ path, dev: stat.dev, ino: stat.ino, birthtimeMs: stat.birthtimeMs });
        for (const entry of readdirSync(path, { withFileTypes: true })) {
          if (entry.isSymbolicLink()) throw new ApplicationServiceError('delete_preview_stale', 'El alcance contiene un enlace no permitido.');
          if (entry.isDirectory()) recordDirectories(join(path, entry.name));
        }
      };
      recordDirectories(this.artifacts.projectDir(projectId));
      if (options.purgeWorkspaceQa) recordDirectories(join(project.canonical_root, '.qa'));
      startedPreview.delete_operation = {
        version: 1,
        project_id: projectId,
        canonical_root: project.canonical_root,
        root_hash: project.root_hash,
        generation: deletionGeneration,
        started_at: now,
        scope_hash: reqRow.scope_hash,
        purge_workspace_qa: options.purgeWorkspaceQa === true,
        file_identities: fileIdentities,
        directory_identities: directoryIdentities,
      };
      this.#store.transaction('IMMEDIATE', () => {
        const consumed = this.#store.run(
          'UPDATE pending_delete_requests SET consumed_at = ?, scope_preview_json = ? WHERE token_hash = ? AND consumed_at IS NULL',
          now,
          JSON.stringify(startedPreview),
          tokenHash,
        );
        if (Number(consumed.changes) !== 1) {
          throw new ApplicationServiceError('delete_token_already_used', 'El token de confirmación de borrado ya fue utilizado.');
        }
        const started = this.#store.run(
          `UPDATE projects SET status = 'deleting', updated_at = ? WHERE project_id = ? AND status = 'active'`,
          now,
          projectId,
        );
        if (Number(started.changes) !== 1) {
          throw new ApplicationServiceError('project_deletion_state_changed', 'El estado del proyecto cambió antes del borrado.');
        }
      });

      return { project, now, deletionGeneration };
    }, options.context);

    return this.finishDeletion(project, now, deletionGeneration, options);
  }

  private async finishDeletion(
    project: ProjectRecord,
    now: string,
    deletionGeneration: string,
    options: { purgeWorkspaceQa?: boolean; onDeletionGeneration?: (generation: string) => void; validateScope?: () => void },
  ): Promise<DeleteExecutionReceipt> {
    const projectId = project.project_id;
    // 2. Drain live registered in-flight tasks
    const liveHandles = [...(this.activeWork.get(projectId) ?? [])];
    for (const handle of liveHandles) {
      handle.controller.abort();
    }
    if (liveHandles.length > 0) {
      await Promise.allSettled(liveHandles.map((h) => h.promise));
    }

    const { recoveryPayload, recoveryBundle, revokedGrants } = this.#operations.run(() => {
      // 3. Snapshot non-secret recovery bundle BEFORE purging owned storage
      const recoveryPayload: RecoveryBundlePayload = {
        version: 1,
        exported_at: now,
        project,
        environments: this.#store.all<Record<string, unknown>>('SELECT * FROM environments WHERE project_id = ? ORDER BY created_at ASC, rowid ASC', projectId).map(parseEnvironmentRow),
        modules: this.#store.all<Record<string, unknown>>('SELECT * FROM modules WHERE project_id = ? ORDER BY created_at ASC, rowid ASC', projectId).map(parseModuleRow),
        profiles: this.#store.all<Record<string, unknown>>('SELECT * FROM profiles WHERE project_id = ? ORDER BY created_at ASC, rowid ASC', projectId).map(parseProfileRow),
        campaigns: this.#store.all<Record<string, unknown>>('SELECT * FROM campaigns WHERE project_id = ?', projectId).map(parseCampaignRow),
      };
      // Preserve a bundle written before an interrupted attempt.
      const existingBundle = this.artifacts.readLatestRecoveryBundle<RecoveryBundlePayload>(projectId);
      const recoveryBundle = existingBundle && existingBundle.data.exported_at === now &&
        existingBundle.data.project.project_id === projectId && existingBundle.data.project.root_hash === project.root_hash
        ? { bundle_path: existingBundle.path, sha256: existingBundle.sha256 }
        : this.artifacts.writeRecoveryBundle(projectId, recoveryPayload);

      // 4. Close any open Knowledge SQLite handle for this project BEFORE directory purge
      this.closeKnowledgeStore(projectId);

      // 5. Revoke all permissions & delete vault credentials for this project ONLY
      const revokedGrants = this.authority.revokeProjectAccess(projectId, 'project_deleted');
      return { recoveryPayload, recoveryBundle, revokedGrants };
    });
    // Vault I/O is external; the deleting status prevents new local publications.
    let deletedCredentials = 0;
    for (const profile of recoveryPayload.profiles) {
      try {
        const deleted = await this.credentialProvider.delete(credentialRefFor(project, profile));
        if (deleted) deletedCredentials += 1;
      } catch {
        // Best-effort vault cleanup; permission authority already revoked profile/project
      }
    }

    return this.#operations.run(() => {
      options.validateScope?.();
      // 6. Remove ONLY host-owned storage for this projectId
      const removedHostPaths = this.artifacts.purgeProjectDirectory(projectId);

      // 7. Optionally remove QAP-owned .qa directory inside workspace ONLY (never touching user/source files)
      const removedWorkspaceQaPaths: string[] = [];
      if (options.purgeWorkspaceQa) {
        const qaDir = join(project.canonical_root, '.qa');
        if (existsSync(qaDir) && isPathWithin(project.canonical_root, qaDir)) {
          const qaFiles = listSafeFiles(qaDir);
          safeDeleteOwnedPath(qaDir, project.canonical_root);
          removedWorkspaceQaPaths.push(qaDir, ...qaFiles);
        }
      }

      // 8. Notify host authorizer registry cleanup (strictly isolated to this project/root)
      if (this.onProjectDeleted) {
        // Registry cleanup shares the SQLite writer fence with helper publication.
        this.#store.transaction('IMMEDIATE', () => this.onProjectDeleted!(projectId, project.canonical_root));
      }

      // 9. Drain DB tasks/campaigns, record deletion tombstone, remove owned project rows except tombstone + revoked grants audit
      let drainedDbTasks = 0;
      let abortedCampaigns = 0;

      this.#store.transaction('IMMEDIATE', () => {
        const taskRes = this.#store.run(
          `UPDATE tasks
           SET status = 'cancelled', updated_at = ?
           WHERE project_id = ? AND status IN ('pending', 'in_progress', 'blocked', 'waiting_decision')`,
          now,
          projectId,
        );
        drainedDbTasks = Number(taskRes.changes);

        const campRes = this.#store.run(
          `UPDATE campaigns
           SET status = 'aborted', closed_at = COALESCE(closed_at, ?), updated_at = ?
           WHERE project_id = ? AND status IN ('active', 'paused', 'draining')`,
          now,
          now,
          projectId,
        );
        abortedCampaigns = Number(campRes.changes);

        this.#store.run(
          `INSERT OR REPLACE INTO deletion_tombstones
            (project_id, canonical_root, root_hash, deleted_at, reason, recovery_bundle_path, recovery_bundle_hash)
           VALUES (?, ?, ?, ?, 'explicit_user_delete', ?, ?)`,
          projectId,
          project.canonical_root,
          project.root_hash,
          now,
          recoveryBundle.bundle_path,
          recoveryBundle.sha256,
        );

        const previousState = this.#store.get<{ value: string }>(
          'SELECT value FROM host_session_state WHERE key = ?', deletionStateKey(project.root_hash),
        );
        const previous = previousState ? parseRootDeletionGeneration(previousState.value, project.root_hash) : null;
        const deletionState: RootDeletionGeneration = {
          version: 1, root_hash: project.root_hash, canonical_root: project.canonical_root,
          project_id: projectId, deleted_at: now, generation: deletionGeneration, cleanup_status: 'pending',
          ...(previous?.authorization_grants ? {
            authorization_grants: previous.authorization_grants.map(grant => ({ ...grant, status: 'revoked' as const })),
          } : {}),
        };
        this.#store.run(
          `INSERT INTO host_session_state (key, value, updated_at) VALUES (?, ?, ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
          deletionStateKey(project.root_hash), JSON.stringify(deletionState), now,
        );

        this.#store.run('DELETE FROM owned_artifacts WHERE project_id = ?', projectId);
        this.#store.run(
          `UPDATE profiles SET status = 'revoked', revoked_at = ?, session_artifact_id = NULL, updated_at = ? WHERE project_id = ?`,
          now,
          now,
          projectId,
        );
        this.#store.run(
          `UPDATE projects SET status = 'deleted', deleted_at = ?, active_campaign_id = NULL, updated_at = ? WHERE project_id = ?`,
          now,
          now,
          projectId,
        );

        const activeRow = this.#store.get<{ value: string }>(
          "SELECT value FROM host_session_state WHERE key = 'active_project_id'",
        );
        if (activeRow?.value === projectId) {
          this.#store.run("DELETE FROM host_session_state WHERE key = 'active_project_id'");
        }
      });

      options.onDeletionGeneration?.(deletionGeneration);
      return {
        status: 'deleted',
        project_id: projectId,
        drained_tasks: drainedDbTasks + liveHandles.length,
        aborted_campaigns: abortedCampaigns,
        revoked_grants: revokedGrants,
        deleted_credentials: deletedCredentials,
        removed_host_paths: removedHostPaths,
        removed_workspace_qa_paths: removedWorkspaceQaPaths,
        recovery_bundle_path: recoveryBundle.bundle_path,
        recovery_bundle_hash: recoveryBundle.sha256,
        auto_recreation_blocked: true,
        deleted_at: now,
      };
    });
  }

  recoverDeletedProject(projectId: string, options: { expectedDeletionGeneration?: string } = {}): RecoveryRestoreReceipt {
    return this.#operations.run(() => {
      const tombstone = this.#store.get<{
        project_id: string;
        canonical_root: string;
        root_hash: string;
        deleted_at: string;
        recovery_bundle_path: string;
        recovery_bundle_hash: string;
      }>('SELECT * FROM deletion_tombstones WHERE project_id = ?', projectId);

      if (!tombstone) {
        throw new ApplicationServiceError('recovery_not_available', `No existe registro de borrado recuperable para '${projectId}'.`);
      }
      const deletionEpoch = this.getRootDeletionState(tombstone.canonical_root);
      if (options.expectedDeletionGeneration !== undefined &&
          (!deletionEpoch || deletionEpoch.version !== 1 || deletionEpoch.project_id !== projectId ||
           deletionEpoch.generation !== options.expectedDeletionGeneration || deletionEpoch.cleanup_status !== 'completed')) {
        throw new ApplicationServiceError('project_deletion_state_changed', 'La generación de borrado no está disponible o cambió.');
      }
      const activeConflict = this.findActiveProjectByRoot(tombstone.canonical_root);
      if (activeConflict) {
        throw new ApplicationServiceError(
          'recovery_root_conflict',
          `El workspace ya está asignado al proyecto activo '${activeConflict.project_id}'.`,
        );
      }

      const bundle = this.artifacts.readLatestRecoveryBundle<RecoveryBundlePayload>(projectId);
      if (!bundle || bundle.sha256 !== tombstone.recovery_bundle_hash) {
        throw new ApplicationServiceError(
          'recovery_bundle_corrupt_or_missing',
          'El paquete de recuperación falta o falló la verificación de integridad SHA-256.',
        );
      }

      const now = new Date().toISOString();
      const { project, environments, modules, profiles, campaigns } = bundle.data;
      this.artifacts.ensureProjectWorkspace(projectId);

      this.#store.transaction('IMMEDIATE', () => {
        if (!sameDeletionEpoch(deletionEpoch, this.getRootDeletionState(tombstone.canonical_root))) {
          throw new ApplicationServiceError('project_deletion_state_changed', 'El estado de borrado cambió; solicita una nueva recuperación.');
        }
        const consumed = this.#store.run(
          'DELETE FROM deletion_tombstones WHERE project_id = ? AND root_hash = ? AND deleted_at = ? AND recovery_bundle_hash = ?',
          projectId, tombstone.root_hash, tombstone.deleted_at, tombstone.recovery_bundle_hash,
        );
        if (Number(consumed.changes) !== 1) {
          throw new ApplicationServiceError('project_deletion_state_changed', 'El estado de borrado cambió; solicita una nueva recuperación.');
        }
        this.#store.run(
          `UPDATE projects
           SET status = 'active', deleted_at = NULL, active_env_id = ?, updated_at = ?
           WHERE project_id = ?`,
          project.active_env_id ?? environments[0]?.env_id ?? null,
          now,
          projectId,
        );
        for (const env of environments) {
          this.#store.run(
            `INSERT OR IGNORE INTO environments
              (env_id, project_id, name, base_url, is_production, destructive_actions_allowed, safe_domains_json, tenant_mode, default_tenant, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            env.env_id,
            projectId,
            env.name,
            env.base_url,
            env.is_production ? 1 : 0,
            env.destructive_actions_allowed ? 1 : 0,
            JSON.stringify(env.safe_domains),
            env.tenant_mode,
            env.default_tenant ?? null,
            env.created_at,
            now,
          );
        }
        for (const mod of modules) {
          this.#store.run(
            `INSERT OR IGNORE INTO modules
              (module_id, project_id, key, title, route_hint, priority, criticality, status, knowledge_module_id, knowledge_revision, waiver_reason, closed_at, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            mod.module_id,
            projectId,
            mod.key,
            mod.title,
            mod.route_hint ?? null,
            mod.priority,
            mod.criticality,
            mod.status,
            mod.knowledge_module_id ?? null,
            mod.knowledge_revision ?? null,
            mod.waiver_reason ?? null,
            mod.closed_at ?? null,
            mod.created_at,
            now,
          );
        }
        for (const prof of profiles) {
          this.#store.run(
            `UPDATE profiles SET status = 'pending', revoked_at = NULL, updated_at = ? WHERE profile_id = ?`,
            now,
            prof.profile_id,
          );
        }
        if (campaigns.length > 0) {
          const latestCamp = campaigns[campaigns.length - 1];
          this.#store.run(
            `UPDATE campaigns SET status = 'paused', closed_at = NULL, updated_at = ? WHERE campaign_id = ?`,
            now,
            latestCamp.campaign_id,
          );
          this.#store.run(
            `UPDATE projects SET active_campaign_id = ?, updated_at = ? WHERE project_id = ?`,
            latestCamp.campaign_id,
            now,
            projectId,
          );
        }
      });

      const restoredRow = this.#store.get<Record<string, unknown>>('SELECT * FROM projects WHERE project_id = ?', projectId)!;
      return {
        status: 'recovered',
        project_id: projectId,
        restored_from: bundle.path,
        project: parseProjectRow(restoredRow),
        restored_entities: {
          environments: environments.length,
          modules: modules.length,
          profiles: profiles.length,
          campaigns: campaigns.length,
        },
        capabilities_reset_to_revoked: true,
        recovered_at: now,
      };
    });
  }

  getDeclaredScopeLimits(projectId: string): ScopeLimitsContract {
    const project = this.assertActiveProject(projectId);
    const env = project.active_env_id
      ? this.#store.get<Record<string, unknown>>('SELECT * FROM environments WHERE env_id = ? AND project_id = ?', project.active_env_id, projectId)
      : this.#store.get<Record<string, unknown>>('SELECT * FROM environments WHERE project_id = ? ORDER BY created_at ASC LIMIT 1', projectId);
    const parsedEnv = env ? parseEnvironmentRow(env) : null;
    return {
      supported_doc_formats: ['.md', '.markdown', '.txt'],
      max_doc_bytes: 512 * 1024,
      supported_technologies: ['html_mpa', 'spa_readonly_same_origin'],
      readonly_discovery_only: true,
      tenant_mode: parsedEnv?.tenant_mode ?? 'single',
      ...(parsedEnv?.default_tenant ? { default_tenant: parsedEnv.default_tenant } : {}),
      multi_tenant_requires_explicit_tenant: true,
    };
  }

  resolveProfileAlias(
    projectId: string,
    profileRef: string,
    envId?: string,
  ):
    | { readonly status: 'matched'; readonly profile: AuthProfileRecord }
    | { readonly status: 'ambiguous'; readonly candidates: AuthProfileRecord[] }
    | { readonly status: 'not_found' } {
    this.assertActiveProject(projectId);
    const trimmed = profileRef.trim();
    if (!trimmed) return { status: 'not_found' };
    const allProfiles = this.#store
      .all<Record<string, unknown>>('SELECT * FROM profiles WHERE project_id = ? ORDER BY created_at ASC, rowid ASC', projectId)
      .map(parseProfileRow);
    const scoped = envId ? allProfiles.filter((p) => p.env_id === envId) : allProfiles;
    const pool = envId ? scoped : allProfiles;

    const byId = pool.find((p) => p.profile_id === trimmed);
    if (byId) return { status: 'matched', profile: byId };

    const byExactLabel = pool.filter((p) => p.label === trimmed);
    if (byExactLabel.length === 1) return { status: 'matched', profile: byExactLabel[0] };
    if (byExactLabel.length > 1) return { status: 'ambiguous', candidates: byExactLabel };

    const lower = trimmed.toLowerCase();
    const byCaseLabel = pool.filter((p) => p.label.toLowerCase() === lower);
    if (byCaseLabel.length === 1) return { status: 'matched', profile: byCaseLabel[0] };
    if (byCaseLabel.length > 1) return { status: 'ambiguous', candidates: byCaseLabel };

    const slug = normalizeSlug(trimmed);
    if (slug) {
      const bySlug = pool.filter((p) => normalizeSlug(p.label) === slug);
      if (bySlug.length === 1) return { status: 'matched', profile: bySlug[0] };
      if (bySlug.length > 1) return { status: 'ambiguous', candidates: bySlug };
    }
    return { status: 'not_found' };
  }

  validateTenantScope(
    projectId: string,
    requestedTenant?: string,
    profileId?: string,
    envId?: string,
  ): { ok: true; tenant_id?: string } | { ok: false; code: 'ambiguous_tenant_scope' | 'tenant_mismatch'; reason: string } {
    const project = this.assertActiveProject(projectId);
    const targetEnvRef = envId?.trim() || project.active_env_id || undefined;
    const envRow = targetEnvRef
      ? this.#store.get<Record<string, unknown>>(
          'SELECT * FROM environments WHERE project_id = ? AND (env_id = ? OR name = ?) LIMIT 1',
          projectId,
          targetEnvRef,
          targetEnvRef,
        )
      : this.#store.get<Record<string, unknown>>('SELECT * FROM environments WHERE project_id = ? ORDER BY created_at ASC, rowid ASC LIMIT 1', projectId);
    const env = envRow ? parseEnvironmentRow(envRow) : null;
    const allProfiles = this.#store
      .all<Record<string, unknown>>('SELECT * FROM profiles WHERE project_id = ? ORDER BY created_at ASC, rowid ASC', projectId)
      .map(parseProfileRow);
    const profiles = env ? allProfiles.filter((p) => p.env_id === env.env_id) : allProfiles;
    const activeProfiles = profiles.filter((p) => p.status !== 'revoked');
    const resolvedAlias = profileId ? this.resolveProfileAlias(projectId, profileId, env?.env_id) : null;
    const selectedProfile = resolvedAlias?.status === 'matched' ? resolvedAlias.profile : undefined;
    const distinctProfileTenants = [...new Set(activeProfiles.map((p) => p.tenant_id).filter((t): t is string => Boolean(t)))];
    const reqTenant = requestedTenant?.trim() || undefined;

    if (reqTenant && selectedProfile?.tenant_id && reqTenant !== selectedProfile.tenant_id) {
      return {
        ok: false,
        code: 'tenant_mismatch',
        reason: `El tenant solicitado '${reqTenant}' no coincide con el perfil seleccionado '${selectedProfile.tenant_id}'.`,
      };
    }

    if (env?.tenant_mode === 'multi_tenant') {
      if (!reqTenant && !selectedProfile && distinctProfileTenants.length > 1) {
        return {
          ok: false,
          code: 'ambiguous_tenant_scope',
          reason: 'Existen múltiples tenants asociados a perfiles activos; indica explícitamente qué perfil o tenant utilizar.',
        };
      }
      const effectiveTenant = reqTenant ?? selectedProfile?.tenant_id ?? env.default_tenant;
      if (!effectiveTenant) {
        return {
          ok: false,
          code: 'ambiguous_tenant_scope',
          reason: 'El entorno es multi-tenant y no se ha indicado ni seleccionado un tenant explícito.',
        };
      }
      return { ok: true, tenant_id: effectiveTenant };
    }

    if (reqTenant && env?.default_tenant && reqTenant !== env.default_tenant) {
      return {
        ok: false,
        code: 'tenant_mismatch',
        reason: `El entorno está configurado en modo single-tenant ('${env.default_tenant}') y no admite el tenant '${reqTenant}'.`,
      };
    }
    if (!reqTenant && distinctProfileTenants.length > 1 && !selectedProfile) {
      return {
        ok: false,
        code: 'ambiguous_tenant_scope',
        reason: 'Existen múltiples tenants asociados a perfiles activos; indica explícitamente qué perfil o tenant utilizar.',
      };
    }
    return { ok: true, tenant_id: reqTenant ?? selectedProfile?.tenant_id ?? env?.default_tenant };
  }

  resolveEffectiveScope(input: {
    readonly projectId: string;
    readonly moduleName: string;
    readonly environment?: string;
    readonly tenantId?: string;
    readonly profile?: string;
  }):
    | {
        readonly ok: true;
        readonly scope: {
          readonly project_id: string;
          readonly application_id: string;
          readonly environment_id: string;
          readonly environment_name: string;
          readonly tenant_mode: 'single' | 'multi_tenant';
          readonly tenant_id: string | null;
          readonly profile_id: string | null;
          readonly profile_label: string | null;
          readonly role: string | null;
          readonly module_key: string;
          readonly module_title: string;
          readonly base_url: string;
        };
      }
    | {
        readonly ok: false;
        readonly code:
          | 'environment_out_of_scope'
          | 'ambiguous_environment_scope'
          | 'profile_not_found'
          | 'auth_session_revoked'
          | 'ambiguous_auth_profile'
          | 'ambiguous_tenant_scope'
          | 'tenant_mismatch';
        readonly reason: string;
        readonly question: string;
        readonly field: 'environment' | 'tenant_id' | 'profile';
        readonly options?: readonly string[];
      } {
    const project = this.assertActiveProject(input.projectId);
    const envs = this.#store
      .all<Record<string, unknown>>('SELECT * FROM environments WHERE project_id = ? ORDER BY created_at ASC, rowid ASC', input.projectId)
      .map(parseEnvironmentRow);
    const modules = this.#store
      .all<Record<string, unknown>>('SELECT * FROM modules WHERE project_id = ? ORDER BY created_at ASC, rowid ASC', input.projectId)
      .map(parseModuleRow);
    const allProfiles = this.#store
      .all<Record<string, unknown>>('SELECT * FROM profiles WHERE project_id = ? ORDER BY created_at ASC, rowid ASC', input.projectId)
      .map(parseProfileRow);

    const requestedEnv = input.environment?.trim() || undefined;
    let effectiveEnv: EnvironmentRecord | null = null;
    if (requestedEnv) {
      effectiveEnv = envs.find((e) => e.name === requestedEnv || e.env_id === requestedEnv) ?? null;
      if (!effectiveEnv) {
        const availableEnvs = envs.map((e) => e.name);
        return {
          ok: false,
          code: 'environment_out_of_scope',
          reason: `El entorno '${requestedEnv}' no está registrado en este proyecto.`,
          question: availableEnvs.length > 0
            ? `¿En qué entorno registrado deseas planificar (${availableEnvs.join(', ')})?`
            : 'Registra el entorno destino en el proyecto antes de planificar.',
          field: 'environment',
          ...(availableEnvs.length > 0 ? { options: availableEnvs } : {}),
        };
      }
    } else if (envs.length === 1) {
      effectiveEnv = envs[0];
    } else if (envs.length > 1) {
      effectiveEnv = (project.active_env_id ? envs.find((e) => e.env_id === project.active_env_id) : undefined) ?? null;
      if (!effectiveEnv) {
        const availableEnvs = envs.map((e) => e.name);
        return {
          ok: false,
          code: 'ambiguous_environment_scope',
          reason: 'Existen múltiples entornos registrados y ninguno está fijado como activo.',
          question: `¿Para qué entorno deseas planificar (${availableEnvs.join(', ')})?`,
          field: 'environment',
          options: availableEnvs,
        };
      }
    }

    const envId = effectiveEnv?.env_id ?? 'local';
    const envName = effectiveEnv?.name ?? 'local';
    const tenantMode = effectiveEnv?.tenant_mode ?? 'single';
    const baseUrl = effectiveEnv?.base_url ?? 'http://127.0.0.1';

    const rawMod = input.moduleName.trim();
    const matchedMod =
      modules.find((m) => m.key === rawMod) ??
      modules.find((m) => m.title.toLowerCase() === rawMod.toLowerCase()) ??
      modules.find((m) => m.key === normalizeSlug(rawMod));
    const moduleKey = matchedMod ? matchedMod.key : normalizeSlug(rawMod);
    const moduleTitle = matchedMod ? matchedMod.title : rawMod;

    const envProfiles = effectiveEnv ? allProfiles.filter((p) => p.env_id === effectiveEnv.env_id) : allProfiles;
    const activeEnvProfiles = envProfiles.filter((p) => p.status !== 'revoked');
    const requestedProfile = input.profile?.trim() || undefined;
    const requestedTenant = input.tenantId?.trim() || undefined;

    let selectedProfile: AuthProfileRecord | null = null;
    if (requestedProfile) {
      const aliasRes = this.resolveProfileAlias(input.projectId, requestedProfile, effectiveEnv?.env_id);
      if (aliasRes.status === 'ambiguous') {
        const opts = aliasRes.candidates.map((c) => c.label);
        return {
          ok: false,
          code: 'ambiguous_auth_profile',
          reason: `El alias '${requestedProfile}' coincide con múltiples perfiles.`,
          question: `¿Cuál de estos perfiles deseas usar (${opts.join(', ')})?`,
          field: 'profile',
          options: opts,
        };
      }
      if (aliasRes.status === 'not_found') {
        const opts = activeEnvProfiles.map((p) => p.label);
        return {
          ok: false,
          code: 'profile_not_found',
          reason: `El perfil '${requestedProfile}' no pertenece al alcance del entorno '${envName}'.`,
          question: opts.length > 0
            ? `¿Qué perfil registrado deseas utilizar (${opts.join(', ')})?`
            : 'No hay perfiles registrados para este entorno; agrega uno o omite el perfil si la vista es pública.',
          field: 'profile',
          ...(opts.length > 0 ? { options: opts } : {}),
        };
      }
      if (aliasRes.profile.status === 'revoked') {
        return {
          ok: false,
          code: 'auth_session_revoked',
          reason: `El perfil '${aliasRes.profile.label}' fue revocado y no puede utilizarse.`,
          question: '¿Deseas autorizar un nuevo perfil vigente con qap_auth_add?',
          field: 'profile',
        };
      }
      selectedProfile = aliasRes.profile;
    }

    if (requestedTenant && tenantMode === 'single' && effectiveEnv?.default_tenant && requestedTenant !== effectiveEnv.default_tenant) {
      return {
        ok: false,
        code: 'tenant_mismatch',
        reason: `El entorno está configurado en modo single-tenant ('${effectiveEnv.default_tenant}') y no admite el tenant '${requestedTenant}'.`,
        question: `Confirma si deseas operar en el tenant '${effectiveEnv.default_tenant}'.`,
        field: 'tenant_id',
        options: [effectiveEnv.default_tenant],
      };
    }

    let effectiveTenant: string | null = null;
    if (selectedProfile) {
      if (requestedTenant && selectedProfile.tenant_id && requestedTenant !== selectedProfile.tenant_id) {
        return {
          ok: false,
          code: 'tenant_mismatch',
          reason: `El tenant solicitado '${requestedTenant}' no coincide con el tenant '${selectedProfile.tenant_id}' del perfil '${selectedProfile.label}'.`,
          question: `¿Deseas usar el tenant '${selectedProfile.tenant_id}' del perfil '${selectedProfile.label}' u otro perfil?`,
          field: 'tenant_id',
          options: [selectedProfile.tenant_id],
        };
      }
      if (requestedTenant) {
        effectiveTenant = requestedTenant;
      } else if (selectedProfile.tenant_id) {
        effectiveTenant = selectedProfile.tenant_id;
      } else if (tenantMode === 'multi_tenant') {
        if (effectiveEnv?.default_tenant) {
          effectiveTenant = effectiveEnv.default_tenant;
        } else {
          return {
            ok: false,
            code: 'ambiguous_tenant_scope',
            reason: `El entorno '${envName}' es multi-tenant y el perfil '${selectedProfile.label}' no tiene tenant asignado.`,
            question: '¿Para qué tenant deseas continuar?',
            field: 'tenant_id',
          };
        }
      } else {
        effectiveTenant = effectiveEnv?.default_tenant ?? null;
      }
    } else if (requestedTenant) {
      effectiveTenant = requestedTenant;
      if (activeEnvProfiles.length > 0) {
        const compatible = tenantMode === 'multi_tenant'
          ? activeEnvProfiles.filter((p) => p.tenant_id === requestedTenant)
          : activeEnvProfiles.filter((p) => !p.tenant_id || p.tenant_id === requestedTenant);
        if (compatible.length === 1) {
          selectedProfile = compatible[0];
        } else if (compatible.length > 1) {
          const opts = compatible.map((p) => p.label);
          return {
            ok: false,
            code: 'ambiguous_auth_profile',
            reason: `Existen múltiples perfiles activos para el tenant '${requestedTenant}'.`,
            question: `¿Con qué perfil de '${requestedTenant}' deseas continuar (${opts.join(', ')})?`,
            field: 'profile',
            options: opts,
          };
        } else {
          const availableTenants = [...new Set(activeEnvProfiles.map((p) => p.tenant_id).filter((t): t is string => Boolean(t)))];
          return {
            ok: false,
            code: 'tenant_mismatch',
            reason: `No hay ningún perfil activo compatible con el tenant '${requestedTenant}' en el entorno '${envName}'.`,
            question: availableTenants.length > 0
              ? `¿Para qué tenant con perfil activo deseas continuar (${availableTenants.join(', ')})?`
              : `Registra o autoriza un perfil para el tenant '${requestedTenant}' con qap_auth_add.`,
            field: 'tenant_id',
            ...(availableTenants.length > 0 ? { options: availableTenants } : {}),
          };
        }
      } else if (envProfiles.some((p) => p.status === 'revoked')) {
        return {
          ok: false,
          code: 'auth_session_revoked',
          reason: 'Todos los perfiles del entorno están revocados; vuelve a autorizar una sesión.',
          question: 'Autoriza un perfil vigente con qap_auth_add antes de continuar.',
          field: 'profile',
        };
      }
    } else {
      // Neither profile nor tenant_id was supplied: derive ONLY if unambiguous.
      if (activeEnvProfiles.length === 0) {
        if (envProfiles.some((p) => p.status === 'revoked')) {
          return {
            ok: false,
            code: 'auth_session_revoked',
            reason: 'Todos los perfiles del entorno están revocados; vuelve a autorizar una sesión.',
            question: 'Autoriza un perfil vigente con qap_auth_add antes de continuar.',
            field: 'profile',
          };
        }
        if (tenantMode === 'multi_tenant') {
          if (effectiveEnv?.default_tenant) {
            effectiveTenant = effectiveEnv.default_tenant;
          } else {
            return {
              ok: false,
              code: 'ambiguous_tenant_scope',
              reason: `El entorno '${envName}' es multi-tenant y no se indicó tenant ni perfil.`,
              question: '¿Para qué tenant deseas continuar?',
              field: 'tenant_id',
            };
          }
        } else {
          effectiveTenant = effectiveEnv?.default_tenant ?? null;
        }
      } else if (activeEnvProfiles.length === 1) {
        const sole = activeEnvProfiles[0];
        if (tenantMode === 'multi_tenant' && !sole.tenant_id && !effectiveEnv?.default_tenant) {
          return {
            ok: false,
            code: 'ambiguous_tenant_scope',
            reason: `El entorno '${envName}' es multi-tenant y el único perfil '${sole.label}' no fija tenant.`,
            question: '¿Para qué tenant deseas continuar?',
            field: 'tenant_id',
          };
        }
        selectedProfile = sole;
        effectiveTenant = sole.tenant_id ?? effectiveEnv?.default_tenant ?? null;
      } else {
        const distinctTenants = [...new Set(activeEnvProfiles.map((p) => p.tenant_id).filter((t): t is string => Boolean(t)))];
        if (distinctTenants.length > 1) {
          return {
            ok: false,
            code: 'ambiguous_tenant_scope',
            reason: 'Existen múltiples tenants y perfiles activos; no puede seleccionarse un alcance implícito.',
            question: `¿Para qué tenant deseas continuar (${distinctTenants.join(', ')})?`,
            field: 'tenant_id',
            options: distinctTenants,
          };
        }
        const opts = activeEnvProfiles.map((p) => p.label);
        return {
          ok: false,
          code: 'ambiguous_auth_profile',
          reason: 'Existen múltiples perfiles activos en el entorno; selecciona uno explícitamente.',
          question: `¿Qué perfil deseas utilizar (${opts.join(', ')})?`,
          field: 'profile',
          options: opts,
        };
      }
    }

    return {
      ok: true,
      scope: {
        project_id: project.project_id,
        application_id: project.application_id,
        environment_id: envId,
        environment_name: envName,
        tenant_mode: tenantMode,
        tenant_id: effectiveTenant,
        profile_id: selectedProfile ? selectedProfile.profile_id : null,
        profile_label: selectedProfile ? selectedProfile.label : null,
        role: selectedProfile?.role_name ?? null,
        module_key: moduleKey,
        module_title: moduleTitle,
        base_url: baseUrl,
      },
    };
  }

  saveProfileSession(
    projectId: string,
    profileId: string,
    sessionState: { cookies: unknown[]; origins?: unknown[] },
    options?: { ttlMs?: number; verifiedAt?: string },
  ): AuthProfileRecord {
    return this.#operations.run(() => {
      this.assertActiveProject(projectId);
      const profileRow = this.#store.get<Record<string, unknown>>(
        'SELECT * FROM profiles WHERE project_id = ? AND (profile_id = ? OR label = ?)',
        projectId,
        profileId,
        profileId,
      );
      if (!profileRow) {
        throw new ApplicationServiceError('profile_not_found', `Perfil '${profileId}' no encontrado en el proyecto.`);
      }
      const parsedProfile = parseProfileRow(profileRow);
      const relName = `${parsedProfile.profile_id}.session.json`;
      const receipt = this.artifacts.writeProjectArtifact(
        projectId,
        'sessions',
        relName,
        JSON.stringify(sessionState, null, 2),
      );
      const now = options?.verifiedAt ?? new Date().toISOString();
      const expiresAt = options?.ttlMs ? new Date(Date.parse(now) + options.ttlMs).toISOString() : null;
      this.#store.run(
        `INSERT INTO owned_artifacts (artifact_id, project_id, category, relative_path, sha256, bytes, created_at)
       VALUES (?, ?, 'sessions', ?, ?, ?, ?)
       ON CONFLICT(project_id, relative_path) DO UPDATE SET artifact_id = excluded.artifact_id, sha256 = excluded.sha256, bytes = excluded.bytes, created_at = excluded.created_at`,
        receipt.artifact_id,
        projectId,
        receipt.relative_path,
        receipt.sha256,
        receipt.bytes,
        now,
      );
      this.#store.run(
        `UPDATE profiles
       SET status = 'verified', session_artifact_id = ?, verified_at = ?, expires_at = ?, revoked_at = NULL, updated_at = ?
       WHERE profile_id = ? AND project_id = ?`,
        receipt.artifact_id,
        now,
        expiresAt,
        now,
        parsedProfile.profile_id,
        projectId,
      );
      const updated = this.#store.get<Record<string, unknown>>(
        'SELECT * FROM profiles WHERE profile_id = ? AND project_id = ?',
        parsedProfile.profile_id,
        projectId,
      )!;
      return parseProfileRow(updated);
    });
  }

  readProfileSession<T = { cookies: unknown[]; origins?: unknown[] }>(
    projectId: string,
    profileIdOrLabel: string,
  ): {
    profile: AuthProfileRecord;
    session: T | null;
    expired: boolean;
    revoked: boolean;
  } | null {
    this.assertActiveProject(projectId);
    const row = this.#store.get<Record<string, unknown>>(
      'SELECT * FROM profiles WHERE project_id = ? AND (profile_id = ? OR label = ?)',
      projectId,
      profileIdOrLabel,
      profileIdOrLabel,
    );
    if (!row) return null;
    let profile = parseProfileRow(row);
    const nowMs = Date.now();
    const isRevoked = profile.status === 'revoked' || Boolean(profile.revoked_at);
    const isExpiredByTime = Boolean(profile.expires_at && Date.parse(profile.expires_at) <= nowMs);
    if (isExpiredByTime && profile.status === 'verified') {
      profile = this.expireProfileSession(projectId, profile.profile_id);
    }
    const expired = profile.status === 'expired' || isExpiredByTime;
    if (isRevoked || expired) {
      return { profile, session: null, expired, revoked: isRevoked };
    }
    const relName = `${profile.profile_id}.session.json`;
    const session = this.artifacts.readProjectArtifactJson<T>(projectId, 'sessions', relName);
    return { profile, session, expired: false, revoked: false };
  }

  expireProfileSession(projectId: string, profileIdOrLabel: string): AuthProfileRecord {
    return this.#operations.run(() => {
      this.assertActiveProject(projectId);
      const row = this.#store.get<Record<string, unknown>>(
        'SELECT * FROM profiles WHERE project_id = ? AND (profile_id = ? OR label = ?)',
        projectId,
        profileIdOrLabel,
        profileIdOrLabel,
      );
      if (!row) {
        throw new ApplicationServiceError('profile_not_found', `Perfil '${profileIdOrLabel}' no encontrado.`);
      }
      const now = new Date().toISOString();
      const profile = parseProfileRow(row);
      this.#store.run(
        `UPDATE profiles SET status = 'expired', updated_at = ? WHERE profile_id = ? AND project_id = ?`,
        now,
        profile.profile_id,
        projectId,
      );
      const updated = this.#store.get<Record<string, unknown>>(
        'SELECT * FROM profiles WHERE profile_id = ? AND project_id = ?',
        profile.profile_id,
        projectId,
      )!;
      return parseProfileRow(updated);
    });
  }

  saveIngestedDocument(input: {
    readonly projectId: string;
    readonly sourceRef: string;
    readonly format: 'md' | 'markdown' | 'txt' | 'inline_text';
    readonly rawContent: string;
    readonly analyzedBy: 'agent' | 'heuristic';
    readonly extracted: IngestedDocumentRecord['extracted'];
    readonly discrepancies?: ReadonlyArray<Omit<ContextDiscrepancy, 'discrepancy_id'>>;
    readonly docVersion?: string;
    readonly defaultScope?: {
      readonly environment?: string;
      readonly tenant_id?: string;
      readonly role?: string;
      readonly module_key?: string;
      readonly route_pathname?: string;
    };
    readonly businessRules?: ReadonlyArray<{
      readonly rule_id?: string;
      readonly rule_key?: string;
      readonly title?: string;
      readonly expected_outcome: string;
      readonly route_pathname?: string;
      readonly module_key?: string;
      readonly environment?: string;
      readonly tenant_id?: string;
      readonly role?: string;
      readonly version?: string;
      readonly authority_status?: RuleAuthorityStatus;
      readonly assert_selector?: string;
      readonly assert_type?: RuleAssertType;
    }>;
  }): IngestedDocumentRecord {
    this.assertActiveProject(input.projectId);
    const now = new Date().toISOString();
    const candidateDocId = `doc-${randomUUID().slice(0, 8)}`;
    const sha256 = createHash('sha256').update(input.rawContent, 'utf8').digest('hex');
    const byteLength = Buffer.byteLength(input.rawContent, 'utf8');
    let persistedDocId = candidateDocId;

    const parsedDocRules = parseScopedRulesFromDocument({
      rawContent: input.rawContent,
      sourceRef: input.sourceRef,
      ...(input.docVersion ? { docVersion: input.docVersion } : {}),
      ...(input.defaultScope ? { defaultScope: input.defaultScope } : {}),
      ...(input.businessRules ? { explicitRules: input.businessRules } : {}),
    });

    const storedDiscrepancies: ContextDiscrepancy[] = [];
    this.#store.transaction('IMMEDIATE', () => {
      const existing = this.#store.get<{ doc_id: string }>(
        'SELECT doc_id FROM ingested_documents WHERE project_id = ? AND source_ref = ? AND sha256 = ?',
        input.projectId,
        input.sourceRef,
        sha256,
      );
      if (existing) {
        persistedDocId = existing.doc_id;
      } else {
        this.#store.run(
          `INSERT INTO ingested_documents
            (doc_id, project_id, source_ref, format, sha256, byte_length, analyzed_by, extracted_json, ingested_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          persistedDocId,
          input.projectId,
          input.sourceRef,
          input.format,
          sha256,
          byteLength,
          input.analyzedBy,
          JSON.stringify(input.extracted),
          now,
        );
      }

      const existingRuleCountRow = this.#store.get<{ cnt: number }>(
        "SELECT COUNT(*) AS cnt FROM scoped_business_rules WHERE project_id = ? AND source_kind = 'ingested_doc' AND source_id = ?",
        input.projectId,
        persistedDocId,
      );
      if ((existingRuleCountRow?.cnt ?? 0) === 0 || (input.businessRules?.length ?? 0) > 0) {
        for (let idx = 0; idx < parsedDocRules.rules.length; idx += 1) {
          const parsedRule = parsedDocRules.rules[idx]!;
          const deterministicRuleId =
            parsedRule.ruleId ??
            `srule-${createHash('sha256')
              .update(`${persistedDocId}|${idx}|${parsedRule.ruleKey}|${parsedRule.routePathname ?? '*'}|${parsedRule.environmentName ?? ''}|${parsedRule.tenantId ?? ''}|${parsedRule.role ?? ''}`)
              .digest('hex')
              .slice(0, 12)}`;
          this.writeScopedBusinessRuleRow({
            ...parsedRule,
            ruleId: deterministicRuleId,
            projectId: input.projectId,
            sourceKind: 'ingested_doc',
            sourceId: persistedDocId,
            sourceRef: input.sourceRef,
            sourceDigest: sha256,
          }, now);
        }
      }

      for (const d of input.discrepancies ?? []) {
        const existingPending = this.#store.get<{ discrepancy_id: string }>(
          `SELECT discrepancy_id FROM context_discrepancies
           WHERE project_id = ? AND field = ? AND value_a = ? AND value_b = ? AND resolution_status = 'pending_user_decision'`,
          input.projectId,
          d.field,
          d.value_a,
          d.value_b,
        );
        const discrepancyId = existingPending?.discrepancy_id ?? `disc-${randomUUID().slice(0, 8)}`;
        if (!existingPending) {
          this.#store.run(
            `INSERT INTO context_discrepancies
              (discrepancy_id, project_id, field, source_a, value_a, source_b, value_b, severity, resolution_status, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            discrepancyId,
            input.projectId,
            d.field,
            d.source_a,
            d.value_a,
            d.source_b,
            d.value_b,
            d.severity,
            d.resolution_status ?? 'pending_user_decision',
            now,
          );
        }
        storedDiscrepancies.push({ discrepancy_id: discrepancyId, ...d });
      }
    });

    return {
      doc_id: persistedDocId,
      project_id: input.projectId,
      source_ref: input.sourceRef,
      format: input.format,
      sha256,
      byte_length: byteLength,
      analyzed_by: input.analyzedBy,
      extracted: input.extracted,
      discrepancies: storedDiscrepancies,
      ingested_at: now,
    };
  }

  listIngestedDocuments(projectId: string): IngestedDocumentRecord[] {
    const docs = this.#store.all<Record<string, unknown>>(
      'SELECT * FROM ingested_documents WHERE project_id = ? ORDER BY ingested_at DESC',
      projectId,
    );
    const allDiscrepancies = this.listDiscrepancies(projectId);
    return docs.map((row) => {
      const sourceRef = rowStr(row.source_ref);
      return {
        doc_id: rowStr(row.doc_id),
        project_id: rowStr(row.project_id),
        source_ref: sourceRef,
        format: row.format as IngestedDocumentRecord['format'],
        sha256: rowStr(row.sha256),
        byte_length: Number(row.byte_length),
        analyzed_by: row.analyzed_by as 'agent' | 'heuristic',
        extracted: JSON.parse(rowStr(row.extracted_json) || '{}') as IngestedDocumentRecord['extracted'],
        discrepancies: allDiscrepancies.filter((d) => d.source_b === sourceRef || d.source_a === sourceRef),
        ingested_at: rowStr(row.ingested_at),
      };
    });
  }

  listDiscrepancies(projectId: string, pendingOnly = false): ContextDiscrepancy[] {
    const sql = pendingOnly
      ? "SELECT * FROM context_discrepancies WHERE project_id = ? AND resolution_status = 'pending_user_decision' ORDER BY created_at DESC"
      : 'SELECT * FROM context_discrepancies WHERE project_id = ? ORDER BY created_at DESC';
    return this.#store.all<Record<string, unknown>>(sql, projectId).map((row) => ({
      discrepancy_id: rowStr(row.discrepancy_id),
      field: row.field as ContextDiscrepancy['field'],
      source_a: rowStr(row.source_a),
      value_a: rowStr(row.value_a),
      source_b: rowStr(row.source_b),
      value_b: rowStr(row.value_b),
      severity: row.severity as ContextDiscrepancy['severity'],
      resolution_status: row.resolution_status as ContextDiscrepancy['resolution_status'],
      ...(rowOptStr(row.resolved_at) ? { resolved_at: rowOptStr(row.resolved_at) } : {}),
    }));
  }

  resolveDiscrepancy(
    projectId: string,
    discrepancyId: string,
    choice: 'kept_source_a' | 'kept_source_b' | 'dismissed',
  ): ContextDiscrepancy {
    this.assertActiveProject(projectId);
    const now = new Date().toISOString();
    const res = this.#store.run(
      'UPDATE context_discrepancies SET resolution_status = ?, resolved_at = ? WHERE project_id = ? AND discrepancy_id = ?',
      choice,
      now,
      projectId,
      discrepancyId,
    );
    if (Number(res.changes) === 0) {
      throw new ApplicationServiceError('discrepancy_not_found', `No existe la discrepancia '${discrepancyId}'.`);
    }
    const updated = this.listDiscrepancies(projectId).find((d) => d.discrepancy_id === discrepancyId)!;
    return updated;
  }

  upsertModuleCandidate(input: {
    readonly projectId: string;
    readonly key: string;
    readonly title: string;
    readonly routeHint?: string;
    readonly provenanceSource: ServiceModuleCandidateRecord['provenance_source'];
    readonly evidenceRefs?: readonly string[];
    readonly confidence?: ServiceModuleCandidateRecord['confidence'];
  }): ServiceModuleCandidateRecord {
    this.assertActiveProject(input.projectId);
    const now = new Date().toISOString();
    const normKey = normalizeSlug(input.key) || 'modulo';
    const existing = this.#store.get<Record<string, unknown>>(
      'SELECT * FROM module_candidates WHERE project_id = ? AND key = ?',
      input.projectId,
      normKey,
    );
    const candidateId = rowStr(existing?.candidate_id) || `cand-${randomUUID().slice(0, 8)}`;
    const prevEvidence = existing ? (JSON.parse(rowStr(existing.evidence_refs_json) || '[]') as string[]) : [];
    const mergedEvidence = [...new Set([...prevEvidence, ...(input.evidenceRefs ?? [])])];

    if (existing) {
      this.#store.run(
        `UPDATE module_candidates
         SET title = ?, route_hint = COALESCE(?, route_hint), evidence_refs_json = ?, confidence = ?, updated_at = ?
         WHERE candidate_id = ?`,
        input.title,
        input.routeHint ?? null,
        JSON.stringify(mergedEvidence),
        input.confidence ?? rowStr(existing.confidence),
        now,
        candidateId,
      );
    } else {
      this.#store.run(
        `INSERT INTO module_candidates
          (candidate_id, project_id, key, title, route_hint, provenance_source, evidence_refs_json, confidence, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'candidate', ?, ?)`,
        candidateId,
        input.projectId,
        normKey,
        input.title,
        input.routeHint ?? null,
        input.provenanceSource,
        JSON.stringify(mergedEvidence),
        input.confidence ?? 'medium',
        now,
        now,
      );
    }
    return this.listModuleCandidates(input.projectId).find((c) => c.candidate_id === candidateId)!;
  }

  listModuleCandidates(projectId: string): ServiceModuleCandidateRecord[] {
    return this.#store
      .all<Record<string, unknown>>('SELECT * FROM module_candidates WHERE project_id = ? ORDER BY created_at ASC', projectId)
      .map((row) => ({
        candidate_id: rowStr(row.candidate_id),
        project_id: rowStr(row.project_id),
        key: rowStr(row.key),
        title: rowStr(row.title),
        ...(rowOptStr(row.route_hint) ? { route_hint: rowOptStr(row.route_hint) } : {}),
        provenance_source: row.provenance_source as ServiceModuleCandidateRecord['provenance_source'],
        evidence_refs: JSON.parse(rowStr(row.evidence_refs_json) || '[]') as string[],
        confidence: row.confidence as ServiceModuleCandidateRecord['confidence'],
        status: row.status as ServiceModuleCandidateStatus,
        ...(rowOptStr(row.promoted_module_id) ? { promoted_module_id: rowOptStr(row.promoted_module_id) } : {}),
        created_at: rowStr(row.created_at),
        updated_at: rowStr(row.updated_at),
      }));
  }

  reviewModuleCandidate(projectId: string, candidateIdOrKey: string, decision: 'approved' | 'rejected'): ServiceModuleCandidateRecord {
    this.assertActiveProject(projectId);
    const now = new Date().toISOString();
    const row = this.#store.get<Record<string, unknown>>(
      'SELECT * FROM module_candidates WHERE project_id = ? AND (candidate_id = ? OR key = ?)',
      projectId,
      candidateIdOrKey,
      normalizeSlug(candidateIdOrKey),
    );
    if (!row) {
      throw new ApplicationServiceError('candidate_not_found', `No existe el candidato '${candidateIdOrKey}'.`);
    }
    const candidateId = rowStr(row.candidate_id);
    this.#store.run(
      'UPDATE module_candidates SET status = ?, updated_at = ? WHERE candidate_id = ?',
      decision,
      now,
      candidateId,
    );
    return this.listModuleCandidates(projectId).find((c) => c.candidate_id === candidateId)!;
  }

  promoteCandidatesToModules(
    projectId: string,
    selections: ReadonlyArray<{
      readonly candidateKeyOrId: string;
      readonly title?: string;
      readonly routeHint?: string;
      readonly priority?: 'high' | 'medium' | 'low';
    }>,
  ): ModuleRecord[] {
    this.assertActiveProject(projectId);
    const now = new Date().toISOString();
    const candidates = this.listModuleCandidates(projectId);
    const promoted: ModuleRecord[] = [];
    for (const sel of selections) {
      const candidate = candidates.find(
        (c) => c.candidate_id === sel.candidateKeyOrId || c.key === normalizeSlug(sel.candidateKeyOrId) || c.key === sel.candidateKeyOrId,
      );
      if (!candidate) {
        throw new ApplicationServiceError('candidate_not_found', `Candidato '${sel.candidateKeyOrId}' no encontrado para promoción.`);
      }
      if (candidate.status === 'rejected') {
        throw new ApplicationServiceError('candidate_rejected', `El candidato '${candidate.key}' fue rechazado previamente.`);
      }
      const mod = this.upsertModule({
        projectId,
        key: candidate.key,
        title: sel.title ?? candidate.title,
        routeHint: sel.routeHint ?? candidate.route_hint,
        priority: sel.priority ?? 'medium',
        criticality: sel.priority ?? 'medium',
        status: 'planned',
      });
      this.#store.run(
        "UPDATE module_candidates SET status = 'promoted', promoted_module_id = ?, updated_at = ? WHERE candidate_id = ?",
        mod.module_id,
        now,
        candidate.candidate_id,
      );
      promoted.push(mod);
    }
    return promoted;
  }

  savePartialInventory(input: {
    readonly projectId: string;
    readonly executionId: string;
    readonly targetUrl: string;
    readonly mode: string;
    readonly routesVisited: number;
    readonly routesCandidate: number;
    readonly routesBlocked: number;
    readonly viewsCount: number;
    readonly controlsCount: number;
    readonly formsCount: number;
    readonly candidateKeys: readonly string[];
  }): PartialInventoryRecord {
    this.assertActiveProject(input.projectId);
    const now = new Date().toISOString();
    const inventoryId = `inv-${randomUUID().slice(0, 8)}`;
    this.#store.run(
      `INSERT INTO partial_inventories
        (inventory_id, project_id, execution_id, target_url, mode, routes_visited, routes_candidate, routes_blocked, views_count, controls_count, forms_count, candidate_keys_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      inventoryId,
      input.projectId,
      input.executionId,
      input.targetUrl,
      input.mode,
      input.routesVisited,
      input.routesCandidate,
      input.routesBlocked,
      input.viewsCount,
      input.controlsCount,
      input.formsCount,
      JSON.stringify(input.candidateKeys),
      now,
    );
    return {
      inventory_id: inventoryId,
      project_id: input.projectId,
      execution_id: input.executionId,
      target_url: input.targetUrl,
      mode: input.mode,
      routes_visited: input.routesVisited,
      routes_candidate: input.routesCandidate,
      routes_blocked: input.routesBlocked,
      views_count: input.viewsCount,
      controls_count: input.controlsCount,
      forms_count: input.formsCount,
      candidate_keys: input.candidateKeys,
      created_at: now,
    };
  }

  listPartialInventories(projectId: string): PartialInventoryRecord[] {
    return this.#store
      .all<Record<string, unknown>>('SELECT * FROM partial_inventories WHERE project_id = ? ORDER BY created_at DESC LIMIT 25', projectId)
      .map((row) => ({
        inventory_id: rowStr(row.inventory_id),
        project_id: rowStr(row.project_id),
        execution_id: rowStr(row.execution_id),
        target_url: rowStr(row.target_url),
        mode: rowStr(row.mode),
        routes_visited: Number(row.routes_visited),
        routes_candidate: Number(row.routes_candidate),
        routes_blocked: Number(row.routes_blocked),
        views_count: Number(row.views_count),
        controls_count: Number(row.controls_count),
        forms_count: Number(row.forms_count),
        candidate_keys: JSON.parse(rowStr(row.candidate_keys_json) || '[]') as string[],
        created_at: rowStr(row.created_at),
      }));
  }

  private writeScopedBusinessRuleRow(input: UpsertScopedBusinessRuleInput, now = new Date().toISOString()): ScopedBusinessRuleRecord {
    const envName = normalizeScopeToken(input.environmentName);
    const tenantId = normalizeScopeToken(input.tenantId);
    const role = normalizeScopeToken(input.role);
    const scopeDeclaration: RuleScopeDeclaration =
      input.scopeDeclaration ??
      (envName && tenantId && role
        ? envName === '*' || tenantId === '*' || role === '*'
          ? 'general_compatible'
          : 'exact'
        : 'unscoped_legacy');
    const ruleId =
      input.ruleId?.trim() ||
      `srule-${createHash('sha256')
        .update(`${input.projectId}|${input.sourceKind}|${input.sourceId}|${normalizeRuleKey(input.ruleKey ?? input.title)}|${normalizeRuleRoute(input.routePathname)}|${envName ?? ''}|${tenantId ?? ''}|${role ?? ''}`)
        .digest('hex')
        .slice(0, 12)}`;
    const moduleKey = normalizeScopeToken(input.moduleKey) ?? '*';
    const routePathname = normalizeRuleRoute(input.routePathname);
    const ruleKey = normalizeRuleKey(input.ruleKey ?? input.title);

    this.#store.run(
      `INSERT INTO scoped_business_rules (
        rule_id, project_id, source_kind, source_id, source_ref, source_version, source_digest,
        module_key, route_pathname, environment_name, tenant_id, role,
        scope_declaration, authority_status, rule_key, title, expected_outcome,
        assert_selector, assert_type, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(rule_id) DO UPDATE SET
        source_ref = excluded.source_ref,
        source_version = excluded.source_version,
        source_digest = excluded.source_digest,
        module_key = excluded.module_key,
        route_pathname = excluded.route_pathname,
        environment_name = excluded.environment_name,
        tenant_id = excluded.tenant_id,
        role = excluded.role,
        scope_declaration = excluded.scope_declaration,
        authority_status = excluded.authority_status,
        rule_key = excluded.rule_key,
        title = excluded.title,
        expected_outcome = excluded.expected_outcome,
        assert_selector = excluded.assert_selector,
        assert_type = excluded.assert_type,
        updated_at = excluded.updated_at`,
      ruleId,
      input.projectId,
      input.sourceKind,
      input.sourceId,
      input.sourceRef,
      input.sourceVersion,
      input.sourceDigest ?? null,
      moduleKey,
      routePathname,
      envName,
      tenantId,
      role,
      scopeDeclaration,
      input.authorityStatus,
      ruleKey,
      input.title.trim(),
      input.expectedOutcome.trim(),
      input.assertSelector ?? null,
      input.assertType ?? null,
      now,
      now,
    );
    const saved = this.#store.get<Record<string, unknown>>(
      'SELECT * FROM scoped_business_rules WHERE rule_id = ?',
      ruleId,
    )!;
    return this.mapScopedBusinessRuleRow(saved);
  }

  private mapScopedBusinessRuleRow(row: Record<string, unknown>): ScopedBusinessRuleRecord {
    return {
      rule_id: rowStr(row.rule_id),
      project_id: rowStr(row.project_id),
      source_kind: row.source_kind as ScopedBusinessRuleRecord['source_kind'],
      source_id: rowStr(row.source_id),
      source_ref: rowStr(row.source_ref),
      source_version: rowStr(row.source_version),
      source_digest: rowOptStr(row.source_digest) ?? null,
      module_key: rowStr(row.module_key),
      route_pathname: rowStr(row.route_pathname),
      environment_name: rowOptStr(row.environment_name) ?? null,
      tenant_id: rowOptStr(row.tenant_id) ?? null,
      role: rowOptStr(row.role) ?? null,
      scope_declaration: row.scope_declaration as ScopedBusinessRuleRecord['scope_declaration'],
      authority_status: row.authority_status as ScopedBusinessRuleRecord['authority_status'],
      rule_key: rowStr(row.rule_key),
      title: rowStr(row.title),
      expected_outcome: rowStr(row.expected_outcome),
      assert_selector: rowOptStr(row.assert_selector) ?? null,
      assert_type: (rowOptStr(row.assert_type) as RuleAssertType | null) ?? null,
      created_at: rowStr(row.created_at),
      updated_at: rowStr(row.updated_at),
    };
  }

  upsertScopedBusinessRule(input: UpsertScopedBusinessRuleInput): ScopedBusinessRuleRecord {
    this.assertActiveProject(input.projectId);
    return this.#store.transaction('IMMEDIATE', () => this.writeScopedBusinessRuleRow(input));
  }

  listScopedBusinessRules(
    projectId: string,
    filters?: { readonly moduleKey?: string; readonly sourceKind?: 'confirmed_requirement' | 'ingested_doc'; readonly sourceId?: string },
  ): ScopedBusinessRuleRecord[] {
    this.assertActiveProject(projectId);
    const clauses = ['project_id = ?'];
    const params: Array<string> = [projectId];
    if (filters?.moduleKey) {
      clauses.push('(module_key = ? OR module_key = ?)');
      params.push(filters.moduleKey, '*');
    }
    if (filters?.sourceKind) {
      clauses.push('source_kind = ?');
      params.push(filters.sourceKind);
    }
    if (filters?.sourceId) {
      clauses.push('source_id = ?');
      params.push(filters.sourceId);
    }
    const rows = this.#store.all<Record<string, unknown>>(
      `SELECT * FROM scoped_business_rules WHERE ${clauses.join(' AND ')} ORDER BY updated_at DESC, rule_id ASC`,
      ...params,
    );
    return rows.map((row) => this.mapScopedBusinessRuleRow(row));
  }

  upsertServiceRequirement(
    params: Parameters<Block3ExecutionRepo['upsertRequirement']>[0] & {
      readonly scope?: {
        readonly environment_name?: string | null;
        readonly tenant_id?: string | null;
        readonly role?: string | null;
        readonly route_pathname?: string | null;
        readonly scope_declaration?: RuleScopeDeclaration;
      };
      readonly provenance?: {
        readonly source_ref?: string;
        readonly source_version?: string;
        readonly rule_key?: string;
        readonly authority_status?: RuleAuthorityStatus;
        readonly assert_selector?: string | null;
        readonly assert_type?: RuleAssertType | null;
      };
    },
  ): ServiceRequirementRecord {
    this.assertActiveProject(params.projectId);
    const req = this.block3.upsertRequirement(params);
    const envName = normalizeScopeToken(params.scope?.environment_name);
    const tenantId = normalizeScopeToken(params.scope?.tenant_id);
    const role = normalizeScopeToken(params.scope?.role);
    if (envName && tenantId && role) {
      const outcome = req.acceptance_criteria[0]?.trim() || req.description.trim();
      if (outcome) {
        this.upsertScopedBusinessRule({
          ruleId: `sreq-${req.requirement_id}`,
          projectId: params.projectId,
          sourceKind: 'confirmed_requirement',
          sourceId: req.requirement_id,
          sourceRef: params.provenance?.source_ref ?? `requirement:${req.requirement_id}`,
          sourceVersion: params.provenance?.source_version ?? `rev:${req.revision}`,
          moduleKey: req.module_key,
          routePathname: normalizeRuleRoute(params.scope?.route_pathname ?? '*'),
          environmentName: envName,
          tenantId,
          role,
          ...(params.scope?.scope_declaration ? { scopeDeclaration: params.scope.scope_declaration } : {}),
          authorityStatus:
            params.provenance?.authority_status ??
            (req.validation_status === 'confirmed' ? 'accredited' : 'unaccredited'),
          ruleKey: params.provenance?.rule_key ?? normalizeRuleKey(req.title),
          title: req.title,
          expectedOutcome: outcome,
          assertSelector: params.provenance?.assert_selector ?? null,
          assertType: params.provenance?.assert_type ?? null,
        });
      }
    }
    return req;
  }

  listServiceRequirements(projectId: string, moduleKey?: string): ServiceRequirementRecord[] {
    this.assertActiveProject(projectId);
    return this.block3.listRequirements(projectId, moduleKey);
  }

  hasUsedRuleApprovalId(projectId: string, approvalId: string): boolean {
    this.assertActiveProject(projectId);
    const row = this.#store.get<{ decision_id: string }>(
      'SELECT decision_id FROM rule_confirmation_decisions WHERE project_id = ? AND approval_id = ?',
      projectId,
      approvalId,
    );
    if (row) return true;
    const batchKey = `human_approval:${projectId}:${approvalId}`;
    const batchRow = this.#store.get<{ key: string }>(
      'SELECT key FROM host_session_state WHERE key = ?',
      batchKey,
    );
    return Boolean(batchRow);
  }

  recordHumanApprovalReceipt(params: {
    readonly projectId: string;
    readonly approvalId: string;
    readonly requestDigest: string;
    readonly presentedStatementDigest: string;
    readonly reviewer: string;
    readonly mechanism: string;
    readonly decidedAt: string;
    readonly kind: 'approve_batch' | 'decide_oracles';
  }): void {
    this.assertActiveProject(params.projectId);
    if (this.hasUsedRuleApprovalId(params.projectId, params.approvalId)) {
      throw new Error('human_review_reused');
    }
    const batchKey = `human_approval:${params.projectId}:${params.approvalId}`;
    const now = new Date().toISOString();
    this.#store.run(
      `INSERT INTO host_session_state (key, value, updated_at) VALUES (?, ?, ?)`,
      batchKey,
      JSON.stringify({
        project_id: params.projectId,
        approval_id: params.approvalId,
        request_digest: params.requestDigest,
        presented_statement_digest: params.presentedStatementDigest,
        reviewer: params.reviewer,
        mechanism: params.mechanism,
        decided_at: params.decidedAt,
        kind: params.kind,
      }),
      now,
    );
  }

  recordRuleConfirmationDecision(params: {
    readonly projectId: string;
    readonly moduleKey: string;
    readonly requirementId?: string;
    readonly ruleKey: string;
    readonly title: string;
    readonly expectedOutcome: string;
    readonly questionId: string;
    readonly questionText: string;
    readonly decision: 'confirm' | 'reject' | 'defer';
    readonly approvalId: string;
    readonly requestDigest: string;
    readonly presentedStatementDigest: string;
    readonly reviewer: string;
    readonly mechanism: string;
    readonly decidedAt: string;
    readonly evidenceRefs?: readonly string[];
    readonly discoveryRevisionId?: string | null;
    readonly scope: {
      readonly environment_name: string;
      readonly tenant_id: string;
      readonly role: string;
      readonly route_pathname: string;
      readonly scope_declaration?: 'exact' | 'general_compatible';
    };
    readonly assertSelector?: string | null;
    readonly assertType?: RuleAssertType | null;
  }): {
    readonly decision: RuleConfirmationDecisionRecord;
    readonly requirement: ServiceRequirementRecord | null;
    readonly rule: ScopedBusinessRuleRecord | null;
  } {
    this.assertActiveProject(params.projectId);
    const modKey = normalizeSlug(params.moduleKey);
    const envName = normalizeScopeToken(params.scope.environment_name) || 'default';
    const tenantId = normalizeScopeToken(params.scope.tenant_id) || 'default';
    const role = normalizeScopeToken(params.scope.role) || 'default';
    const routePath = normalizeRuleRoute(params.scope.route_pathname || '*');
    const scopeDeclaration: 'exact' | 'general_compatible' =
      params.scope.scope_declaration === 'general_compatible' ? 'general_compatible' : 'exact';
    const ruleKey = normalizeRuleKey(params.ruleKey || params.title);
    const deterministicReqId =
      params.requirementId?.trim() ||
      `REQ-${modKey.toUpperCase()}-${createHash('sha256')
        .update(JSON.stringify([params.projectId, modKey, envName, tenantId, role, routePath, ruleKey]))
        .digest('hex')
        .slice(0, 10)}`;
    const ruleId = `sreq-${deterministicReqId}`;
    const evidenceRefs = [...new Set((params.evidenceRefs ?? []).map((e) => e.trim()).filter(Boolean))];
    const now = new Date().toISOString();

    return this.#store.transaction('IMMEDIATE', () => {
      const existingApproval = this.#store.get<{ decision_id: string }>(
        'SELECT decision_id FROM rule_confirmation_decisions WHERE approval_id = ?',
        params.approvalId,
      );
      if (existingApproval) {
        throw new Error('human_review_reused');
      }

      const mod = this.upsertModule({
        projectId: params.projectId,
        key: modKey,
        title: params.moduleKey,
      });

      let req: ServiceRequirementRecord | null = null;
      let rule: ScopedBusinessRuleRecord | null = null;
      let revision = 0;

      if (params.decision === 'confirm') {
        const priorReq = this.block3.getRequirement(params.projectId, deterministicReqId);
        req = this.block3.upsertRequirement({
          projectId: params.projectId,
          moduleId: mod.module_id,
          moduleKey: mod.key,
          requirementId: deterministicReqId,
          title: params.title.trim(),
          description: params.expectedOutcome.trim(),
          category: 'business_rule',
          source: 'user',
          validationStatus: 'confirmed',
          acceptanceCriteria: [params.expectedOutcome.trim()],
        });
        if (priorReq && req.revision === priorReq.revision) {
          this.#store.run(
            'UPDATE service_requirements SET revision = ?, updated_at = ? WHERE requirement_id = ?',
            priorReq.revision + 1,
            now,
            req.requirement_id,
          );
          req = this.block3.getRequirement(params.projectId, req.requirement_id)!;
        }
        revision = req.revision;
        rule = this.writeScopedBusinessRuleRow({
          ruleId,
          projectId: params.projectId,
          sourceKind: 'confirmed_requirement',
          sourceId: req.requirement_id,
          sourceRef: `qa-confirmacion:${params.approvalId}`,
          sourceVersion: `rev:${req.revision}`,
          sourceDigest: params.requestDigest,
          moduleKey: mod.key,
          routePathname: routePath,
          environmentName: envName,
          tenantId,
          role,
          scopeDeclaration,
          authorityStatus: 'accredited',
          ruleKey,
          title: params.title.trim(),
          expectedOutcome: params.expectedOutcome.trim(),
          assertSelector: params.assertSelector ?? null,
          assertType: params.assertType ?? null,
        });
      }

      const decisionId = `rcd-${randomUUID()}`;
      this.#store.run(
        `INSERT INTO rule_confirmation_decisions
         (decision_id, project_id, requirement_id, rule_id, rule_key, module_key, route_pathname,
          environment_name, tenant_id, role, scope_declaration, revision, question_id, question_text,
          expected_outcome, title, decision, approval_id, request_digest, presented_statement_digest,
          reviewer, mechanism, evidence_refs_json, discovery_revision_id, decided_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        decisionId,
        params.projectId,
        deterministicReqId,
        ruleId,
        ruleKey,
        mod.key,
        routePath,
        envName,
        tenantId,
        role,
        scopeDeclaration,
        revision,
        params.questionId.trim(),
        params.questionText.trim(),
        params.expectedOutcome.trim(),
        params.title.trim(),
        params.decision,
        params.approvalId,
        params.requestDigest,
        params.presentedStatementDigest,
        params.reviewer,
        params.mechanism,
        JSON.stringify(evidenceRefs),
        params.discoveryRevisionId ?? null,
        params.decidedAt,
        now,
      );

      const saved = this.listRuleConfirmationDecisions(params.projectId, {
        moduleKey: mod.key,
      }).find((d) => d.decision_id === decisionId)!;

      return { decision: saved, requirement: req, rule };
    });
  }

  listRuleConfirmationDecisions(
    projectId: string,
    filters?: {
      readonly moduleKey?: string;
      readonly environmentName?: string;
      readonly tenantId?: string;
      readonly role?: string;
    },
  ): RuleConfirmationDecisionRecord[] {
    this.assertActiveProject(projectId);
    const clauses = ['project_id = ?'];
    const params: Array<string> = [projectId];
    if (filters?.moduleKey) {
      clauses.push('module_key = ?');
      params.push(normalizeSlug(filters.moduleKey));
    }
    if (filters?.environmentName) {
      const envToken = normalizeScopeToken(filters.environmentName);
      if (envToken) {
        clauses.push('environment_name = ?');
        params.push(envToken);
      }
    }
    if (filters?.tenantId) {
      const tenantToken = normalizeScopeToken(filters.tenantId);
      if (tenantToken) {
        clauses.push('tenant_id = ?');
        params.push(tenantToken);
      }
    }
    if (filters?.role) {
      const roleToken = normalizeScopeToken(filters.role);
      if (roleToken) {
        clauses.push('role = ?');
        params.push(roleToken);
      }
    }
    const rows = this.#store.all<Record<string, unknown>>(
      `SELECT * FROM rule_confirmation_decisions WHERE ${clauses.join(' AND ')} ORDER BY created_at DESC, decision_id ASC`,
      ...params,
    );
    return rows.map((row) => ({
      decision_id: rowStr(row.decision_id),
      project_id: rowStr(row.project_id),
      requirement_id: rowStr(row.requirement_id),
      rule_id: rowStr(row.rule_id),
      rule_key: rowStr(row.rule_key),
      module_key: rowStr(row.module_key),
      route_pathname: rowStr(row.route_pathname),
      environment_name: rowStr(row.environment_name),
      tenant_id: rowStr(row.tenant_id),
      role: rowStr(row.role),
      scope_declaration: rowStr(row.scope_declaration) === 'general_compatible' ? 'general_compatible' : 'exact',
      revision: Number(row.revision ?? 0),
      question_id: rowStr(row.question_id),
      question_text: rowStr(row.question_text),
      expected_outcome: rowStr(row.expected_outcome),
      title: rowStr(row.title),
      decision: rowStr(row.decision) as 'confirm' | 'reject' | 'defer',
      approval_id: rowStr(row.approval_id),
      request_digest: rowStr(row.request_digest),
      presented_statement_digest: rowStr(row.presented_statement_digest),
      reviewer: rowStr(row.reviewer),
      mechanism: rowStr(row.mechanism),
      evidence_refs: (() => {
        try {
          const parsed: unknown = JSON.parse(rowStr(row.evidence_refs_json) || '[]');
          return Array.isArray(parsed) ? parsed.map(String) : [];
        } catch {
          return [];
        }
      })(),
      discovery_revision_id: row.discovery_revision_id == null ? null : rowStr(row.discovery_revision_id),
      decided_at: rowStr(row.decided_at),
      created_at: rowStr(row.created_at),
    }));
  }

  proposeModuleCases(params: {
    projectId: string;
    moduleKey: string;
    campaignId?: string | null;
    proposals: readonly ProposeCaseInput[];
  }) {
    const project = this.assertActiveProject(params.projectId);
    this.block3.assertNoLineagedCaseIds(
      params.proposals.map((p) => p.case_id ?? ''),
      'propose_cases',
    );
    const mod = this.upsertModule({
      projectId: params.projectId,
      key: params.moduleKey,
    });
    return this.block3.proposeCases({
      projectId: params.projectId,
      moduleId: mod.module_id,
      moduleKey: mod.key,
      campaignId: params.campaignId ?? project.active_campaign_id ?? null,
      proposals: params.proposals,
    });
  }

  decideCaseOracles(params: {
    projectId: string;
    moduleKey: string;
    decisions: readonly OracleDecisionInput[];
  }) {
    this.assertActiveProject(params.projectId);
    this.block3.assertNoLineagedCaseIds(
      params.decisions.map((d) => d.case_id),
      'decide_oracles',
    );
    const mod = this.upsertModule({
      projectId: params.projectId,
      key: params.moduleKey,
      title: params.moduleKey,
    });
    return this.block3.decideMissingOracles({
      projectId: params.projectId,
      moduleId: mod.module_id,
      moduleKey: mod.key,
      decisions: params.decisions,
    });
  }

  approveCaseBatch(params: {
    projectId: string;
    moduleKey: string;
    caseIds?: readonly string[];
    approvedBy: string;
  }) {
    this.assertActiveProject(params.projectId);
    return this.block3.approveCaseBatch(params);
  }

  listServiceCases(projectId: string, moduleKey?: string): ServiceTestCaseRecord[] {
    this.assertActiveProject(projectId);
    return this.block3.listCases(projectId, moduleKey);
  }

  /** Preflight sin efectos secundarios para rutas legacy antes de crear módulos, campañas o pedir revisión humana. */
  assertNoLineagedCaseIds(caseIds: readonly string[], operation: string): void {
    this.block3.assertNoLineagedCaseIds(caseIds, operation);
  }

  /** Preflight sin efectos secundarios acotado al proyecto actual (evita filtrar existencia entre proyectos en flujos conversacionales). */
  assertNoProjectLineagedCaseIds(projectId: string, caseIds: readonly string[], operation: string): void {
    this.block3.assertNoProjectLineagedCaseIds(projectId, caseIds, operation);
  }

  // ---------------------------------------------------------------------------------------------
  // P0.3b-01A — casos con linaje (operaciones internas; sin handlers, herramientas MCP ni planes)
  // ---------------------------------------------------------------------------------------------

  /**
   * Crea, repite o avanza un candidato con linaje. Verifica las referencias (dossier, vista, controles,
   * evidencias, decisión, regla fuente y confirmación) y escribe en la misma transacción IMMEDIATE.
   * El resultado siempre es pending_oracle / missing_oracle, sin aprobación ni elegibilidad de ejecución.
   * Lanza `LineagedCaseError` ante entradas inválidas, cruces de ámbito, conflictos o versiones obsoletas.
   */
  upsertLineagedCaseCandidate(input: LineagedCaseCandidateInput): LineagedCaseWriteResult {
    const normalized = normalizeLineagedCandidateInput(input);
    const project = this.assertActiveProject(normalized.projectId);
    return this.#store.transaction('IMMEDIATE', () => {
      const refs = resolveLineagedReferences(this.lineagedReferenceReader(), project, normalized);
      return this.block3.upsertLineagedCandidateInTransaction({
        projectId: normalized.projectId,
        moduleKey: normalized.moduleKey,
        scope: refs.scope,
        executionKey: refs.executionKey,
        dossierRevisionId: refs.lineage.dossier.revision_id,
        ruleRevision: refs.ruleRevision,
        expectedVersion: normalized.expectedVersion,
        resolveModuleId: () => this.resolveModuleIdForLineagedCase(normalized.projectId, normalized.moduleKey),
        prepare: (caseId) => ({
          schema: LINEAGED_CASE_SCHEMA,
          identity: {
            case_id: caseId,
            execution_key: refs.executionKey,
            rule_id: refs.ruleId,
            rule_key: refs.ruleKey,
          },
          scope: refs.scope,
          lineage: refs.lineage,
          tc_case: buildValidatedTcCase(normalized.tcCase, caseId, refs.ruleId),
        }),
      });
    });
  }

  private isProjectActiveForLineagedRead(projectId: string): boolean {
    const row = this.#store.get<Record<string, unknown>>('SELECT * FROM projects WHERE project_id = ?', projectId);
    if (!row) return false;
    const project = parseProjectRow(row);
    if (project.status !== 'active') {
      throw new ApplicationServiceError(
        'project_not_active',
        `El proyecto '${projectId}' está en estado '${project.status}'.`,
        { status: project.status },
      );
    }
    return true;
  }

  getLineagedCase(
    scope: LineagedCaseReadScopeInput | LineagedCaseScope,
    selector: LineagedCaseSelector,
  ): LineagedCaseRecord | null;
  getLineagedCase(
    projectId: string,
    selector: LineagedCaseSelector & Partial<LineagedCaseReadScopeInput>,
    scope?: LineagedCaseReadScopeInput | LineagedCaseScope,
  ): LineagedCaseRecord | null;
  getLineagedCase(
    arg1: LineagedCaseReadScopeInput | LineagedCaseScope | string,
    arg2: unknown,
    arg3?: unknown,
  ): LineagedCaseRecord | null {
    const { scope, selector } = resolveLineagedReadArguments(arg1, arg2, arg3);
    if (!this.isProjectActiveForLineagedRead(scope.projectId)) {
      return null;
    }
    return this.block3.getLineagedCase(scope, selector);
  }

  listLineagedCases(scope: LineagedCaseReadScopeInput | LineagedCaseScope): LineagedCaseRecord[];
  listLineagedCases(
    projectId: string,
    scope: Omit<LineagedCaseReadScopeInput, 'projectId'> & { readonly projectId?: string },
  ): LineagedCaseRecord[];
  listLineagedCases(
    arg1: LineagedCaseReadScopeInput | LineagedCaseScope | string,
    arg2?: unknown,
  ): LineagedCaseRecord[] {
    const scope = resolveLineagedListArguments(arg1, arg2);
    if (!this.isProjectActiveForLineagedRead(scope.projectId)) {
      return [];
    }
    return this.block3.listLineagedCases(scope);
  }

  /** Reutiliza el módulo existente sin tocarlo; solo crea la fila si no existe (camino de creación). */
  private resolveModuleIdForLineagedCase(projectId: string, moduleKey: string): string {
    const existing = this.#store.get<{ module_id: string }>(
      'SELECT module_id FROM modules WHERE project_id = ? AND key = ?',
      projectId,
      moduleKey,
    );
    if (existing) return existing.module_id;
    return this.upsertModule({ projectId, key: moduleKey, title: moduleKey }).module_id;
  }

  private lineagedReferenceReader(): LineagedReferenceReader {
    return {
      getEnvironment: (projectId, environmentId) => {
        const row = this.#store.get<Record<string, unknown>>(
          'SELECT env_id, name FROM environments WHERE project_id = ? AND env_id = ?',
          projectId,
          environmentId,
        );
        return row ? { env_id: rowStr(row.env_id), name: rowStr(row.name) } : null;
      },
      isEnvironmentNameAlias: (projectId, token) => {
        const row = this.#store.get<Record<string, unknown>>(
          'SELECT env_id FROM environments WHERE project_id = ? AND lower(name) = lower(?) LIMIT 1',
          projectId,
          token,
        );
        return Boolean(row);
      },
      getProfile: (projectId, profileId) => {
        const row = this.#store.get<Record<string, unknown>>(
          'SELECT profile_id, env_id, role_name, tenant_id FROM profiles WHERE project_id = ? AND profile_id = ?',
          projectId,
          profileId,
        );
        return row
          ? {
              profile_id: rowStr(row.profile_id),
              env_id: rowStr(row.env_id),
              role_name: rowOptStr(row.role_name) ?? null,
              tenant_id: rowOptStr(row.tenant_id) ?? null,
            }
          : null;
      },
      isProfileLabelAlias: (projectId, token) => {
        const row = this.#store.get<Record<string, unknown>>(
          'SELECT profile_id FROM profiles WHERE project_id = ? AND lower(label) = lower(?) LIMIT 1',
          projectId,
          token,
        );
        return Boolean(row);
      },
      getDiscoveryRevision: (revisionId) => this.getDiscoveryRevision(revisionId),
      getScopedRule: (projectId, ruleId) => {
        const row = this.#store.get<Record<string, unknown>>(
          'SELECT * FROM scoped_business_rules WHERE project_id = ? AND rule_id = ?',
          projectId,
          ruleId,
        );
        return row ? this.mapScopedBusinessRuleRow(row) : null;
      },
      getRuleConfirmation: (projectId, decisionId) => {
        const row = this.#store.get<Record<string, unknown>>(
          'SELECT * FROM rule_confirmation_decisions WHERE project_id = ? AND decision_id = ?',
          projectId,
          decisionId,
        );
        return row
          ? {
              decision_id: rowStr(row.decision_id),
              project_id: rowStr(row.project_id),
              requirement_id: rowStr(row.requirement_id),
              rule_id: rowStr(row.rule_id),
              rule_key: rowStr(row.rule_key),
              module_key: rowStr(row.module_key),
              route_pathname: rowStr(row.route_pathname),
              environment_name: rowStr(row.environment_name),
              tenant_id: rowStr(row.tenant_id),
              role: rowStr(row.role),
              scope_declaration: rowStr(row.scope_declaration) === 'general_compatible' ? 'general_compatible' : 'exact',
              revision: Number(row.revision ?? 0),
              decision: rowStr(row.decision) as 'confirm' | 'reject' | 'defer',
              request_digest: rowStr(row.request_digest),
            }
          : null;
      },
    };
  }

  createExecutionAttempt(params: {
    projectId: string;
    campaignId?: string;
    moduleKey: string;
    envId?: string;
    profileId?: string | null;
    executionId?: string;
    attemptId?: string;
    cases: readonly {
      case_id: string;
      version?: number;
      requirement_id?: string | null;
      requirement_revision?: number;
      title?: string;
    }[];
  }): ExecutionAttemptRecord {
    const project = this.assertActiveProject(params.projectId);
    this.block3.assertNoLineagedCaseIds(
      params.cases.map((c) => c.case_id),
      'create_attempt',
    );
    const mod = this.upsertModule({
      projectId: params.projectId,
      key: params.moduleKey,
      title: params.moduleKey,
    });
    let campaignId = params.campaignId ?? project.active_campaign_id;
    if (!campaignId) {
      campaignId = this.startCampaign({
        projectId: params.projectId,
        mode: 'investigate_and_test',
        phase: 'WORKING',
        targetModuleIds: [mod.module_id],
      }).campaign_id;
    }
    const envId = params.envId ?? project.active_env_id ?? 'env-default';
    return this.block3.createExecutionAttempt({
      projectId: params.projectId,
      campaignId,
      moduleId: mod.module_id,
      moduleKey: mod.key,
      envId,
      profileId: params.profileId ?? null,
      executionId: params.executionId,
      attemptId: params.attemptId,
      cases: params.cases,
    });
  }

  markAttemptRunning(attemptId: string): ExecutionAttemptRecord | null {
    return this.block3.markAttemptRunning(attemptId);
  }

  discardUncommittedAttempt(attemptId: string): boolean {
    return this.block3.discardUncommittedAttempt(attemptId);
  }

  markAttemptFinalizationPending(
    attemptId: string,
    executionId: string,
    message: string,
  ): ExecutionAttemptRecord | null {
    return this.block3.markAttemptFinalizationPending(attemptId, executionId, message);
  }

  private hasCommittedRuntimeRun(canonicalRoot: string, runId: string): boolean {
    if (!runId) return false;
    try {
      return hasCommittedRun(canonicalRoot, runId);
    } catch {
      return false;
    }
  }

  private ensureCommittedRuntimeReceipts(canonicalRoot: string, runId: string): void {
    if (!runId || !/^[a-zA-Z0-9_-][a-zA-Z0-9._-]*$/.test(runId) || runId === '..') return;
    try {
      const runDir = resolveContainedPath(canonicalRoot, join('.qa', 'runtime', 'runs', runId));
      if (!existsSync(runDir) || lstatSync(runDir).isSymbolicLink() || !lstatSync(runDir).isDirectory()) return;
      const receiptPath = join(runDir, '.qap-committed');
      if (!existsSync(receiptPath)) {
        writeFileSync(receiptPath, '1', { mode: 0o600 });
      }
    } catch {
      // Best-effort receipt repair
    }
  }

  private ensureExecutionArtifactsOnDisk(
    canonicalRoot: string,
    executionResult: ExecutionResult,
    traceMeta?: ProvisionalMcpFinalization['trace'],
  ): { rawExecutionPath: string | null; tracePath: string | null } {
    const executionId = executionResult.execution_id;
    if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(executionId)) {
      return { rawExecutionPath: null, tracePath: null };
    }
    const execDir = resolveContainedPath(canonicalRoot, join('.qa', 'executions'));
    if (!existsSync(execDir)) {
      mkdirSync(execDir, { recursive: true, mode: 0o700 });
    }
    const rawExecutionPath = `.qa/executions/${executionId}.json`;
    const rawAbs = resolveContainedPath(canonicalRoot, rawExecutionPath);
    if (!existsSync(rawAbs)) {
      atomicWritePrivateFile(rawAbs, JSON.stringify(executionResult, null, 2));
    }

    let tracePath: string | null = null;
    const candidateTracePath = `.qa/executions/${executionId}.trace.json`;
    const traceAbs = resolveContainedPath(canonicalRoot, candidateTracePath);
    if (!existsSync(traceAbs) && traceMeta) {
      atomicWritePrivateFile(
        traceAbs,
        JSON.stringify(
          {
            execution_id: executionId,
            ...(executionResult.attempt_id ? { attempt_id: executionResult.attempt_id } : {}),
            ...traceMeta,
            ...(executionResult.artifacts ? { artifacts: executionResult.artifacts } : {}),
            ...(executionResult.timeline ? { timeline: executionResult.timeline } : {}),
          },
          null,
          2,
        ),
      );
    }
    if (existsSync(traceAbs)) {
      tracePath = candidateTracePath;
    }

    const moduleName = executionResult.module;
    if (
      moduleName &&
      typeof moduleName === 'string' &&
      moduleName.trim().length > 0 &&
      !/[\\/:]/.test(moduleName) &&
      moduleName !== '.' &&
      moduleName !== '..'
    ) {
      const historyDir = resolveContainedPath(canonicalRoot, join('.qa', 'cache', 'history'));
      if (!existsSync(historyDir)) {
        mkdirSync(historyDir, { recursive: true, mode: 0o700 });
      }
      const historyAbs = resolveContainedPath(canonicalRoot, join('.qa', 'cache', 'history', `${moduleName}.jsonl`));
      let alreadyRecorded = false;
      if (existsSync(historyAbs)) {
        try {
          for (const line of readFileSync(historyAbs, 'utf8').split(/\r?\n/)) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const parsed = JSON.parse(trimmed) as { execution_id?: unknown };
              if (parsed.execution_id === executionId) {
                alreadyRecorded = true;
                break;
              }
            } catch {
              // Ignore malformed line
            }
          }
        } catch {
          // Ignore unreadable history
        }
      }
      if (!alreadyRecorded) {
        appendFileSync(
          historyAbs,
          `${JSON.stringify({
            execution_id: executionId,
            timestamp: executionResult.finished_at,
            result: executionResult.result,
            summary: executionResult.summary,
          })}\n`,
          'utf8',
        );
      }
    }

    return { rawExecutionPath, tracePath };
  }

  reconcileCommittedProjectExecutions(
    projectId: string,
    canonicalRoot: string,
  ): { removed: number; confirmed: number; finalizedAttempts: number } {
    const project = this.assertActiveProject(projectId);
    if (normalizePathKey(project.canonical_root) !== normalizePathKey(canonicalRoot)) {
      throw new ApplicationServiceError(
        'project_root_mismatch',
        `La raíz '${canonicalRoot}' no coincide con el proyecto '${projectId}'.`,
      );
    }

    const inspectable = inspectRecoverableProvisionalPublications(canonicalRoot);
    for (const item of inspectable) {
      if (!item.committed && item.attemptId) {
        this.block3.discardUncommittedAttempt(item.attemptId);
      }
    }

    const recovered = recoverProvisionalPublications(canonicalRoot);
    let finalizedAttempts = 0;
    const processedAttempts = new Set<string>();

    const reconcileAttempt = (params: {
      attemptId: string;
      executionId: string;
      executionResult: ExecutionResult;
      mcp?: ProvisionalMcpFinalization;
      allowCreateFromResult?: boolean;
    }): void => {
      if (processedAttempts.has(params.attemptId)) return;
      const runtimeRunId = this.hasCommittedRuntimeRun(canonicalRoot, params.attemptId)
        ? params.attemptId
        : this.hasCommittedRuntimeRun(canonicalRoot, params.executionId)
          ? params.executionId
          : null;
      if (!runtimeRunId) return;

      let attempt = this.block3.getExecutionAttempt(params.attemptId);
      if (!attempt && !params.mcp && !params.allowCreateFromResult) {
        return;
      }
      if (attempt && attempt.project_id !== projectId) {
        return;
      }

      this.ensureCommittedRuntimeReceipts(canonicalRoot, runtimeRunId);

      const execResult: ExecutionResult =
        params.attemptId && params.executionResult.attempt_id !== params.attemptId
          ? { ...params.executionResult, attempt_id: params.attemptId }
          : params.executionResult;

      const { rawExecutionPath, tracePath } = this.ensureExecutionArtifactsOnDisk(
        canonicalRoot,
        execResult,
        params.mcp?.trace,
      );

      if (!attempt && (params.mcp || params.allowCreateFromResult)) {
        attempt = this.createExecutionAttempt({
          projectId,
          moduleKey: params.mcp?.moduleName || execResult.module,
          envId: params.mcp?.envId ?? project.active_env_id ?? execResult.env,
          profileId: params.mcp?.profileId ?? null,
          attemptId: params.attemptId,
          executionId: params.executionId,
          cases:
            params.mcp?.cases ??
            execResult.cases.map((c) => ({ case_id: c.id, title: c.title })),
        });
        attempt = this.markAttemptRunning(attempt.attempt_id) ?? attempt;
      }
      if (!attempt) return;

      const needsFinalize =
        attempt.status === 'prepared' ||
        attempt.status === 'running' ||
        !attempt.raw_execution_path ||
        (Boolean(tracePath) && !attempt.trace_path);

      if (needsFinalize) {
        this.finalizeExecutionAttempt({
          attemptId: attempt.attempt_id,
          executionResult: execResult,
          rawExecutionPath,
          tracePath,
        });
        finalizedAttempts++;
      }
      processedAttempts.add(attempt.attempt_id);
    };

    for (const item of inspectable) {
      if (!item.committed || !item.result || !item.executionId) continue;
      const attemptId = item.attemptId ?? item.mcp?.attemptId ?? item.result.attempt_id;
      if (!attemptId) continue;
      reconcileAttempt({
        attemptId,
        executionId: item.executionId,
        executionResult: item.result,
        mcp: item.mcp,
        allowCreateFromResult: Boolean(item.mcp || item.attemptId),
      });
    }

    for (const attempt of this.block3.listExecutionAttempts(projectId)) {
      if (processedAttempts.has(attempt.attempt_id)) continue;
      if (attempt.status !== 'prepared' && attempt.status !== 'running') continue;
      if (!this.hasCommittedRuntimeRun(canonicalRoot, attempt.attempt_id)) continue;
      if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(attempt.execution_id)) continue;
      const rawAbs = resolveContainedPath(canonicalRoot, join('.qa', 'executions', `${attempt.execution_id}.json`));
      if (!existsSync(rawAbs)) continue;
      try {
        const parsed = JSON.parse(readFileSync(rawAbs, 'utf8')) as ExecutionResult;
        if (parsed.execution_id !== attempt.execution_id) continue;
        reconcileAttempt({
          attemptId: attempt.attempt_id,
          executionId: attempt.execution_id,
          executionResult: parsed,
        });
      } catch {
        // Ignore unreadable execution JSON
      }
    }

    return {
      removed: recovered.removed,
      confirmed: recovered.confirmed,
      finalizedAttempts,
    };
  }

  finalizeExecutionAttempt(params: {
    attemptId: string;
    executionResult?: ExecutionResult;
    technicalError?: { code: string; message: string };
    blockedCode?: string;
    rawExecutionPath?: string | null;
    tracePath?: string | null;
  }): { readonly attempt: ExecutionAttemptRecord; readonly case_results: ExecutionCaseResultRecord[] } {
    return this.block3.finalizeExecutionAttempt(params);
  }

  recordCaseHumanAcceptance(params: {
    projectId: string;
    caseId: string;
    moduleKey?: string;
    acceptedBy: string;
    reason: string;
  }): ExecutionCaseResultRecord | null {
    this.assertActiveProject(params.projectId);
    return this.block3.recordHumanAcceptance(params);
  }

  getExecutionSummary(projectId: string, moduleKey?: string, attemptId?: string): CanonicalExecutionSummary {
    this.assertActiveProject(projectId);
    return this.block3.getExecutionSummary(projectId, moduleKey, attemptId);
  }

  listExecutionAttempts(projectId: string, moduleKey?: string): ExecutionAttemptRecord[] {
    this.assertActiveProject(projectId);
    return this.block3.listExecutionAttempts(projectId, moduleKey);
  }

  beginReportPublication(params: {
    projectId: string;
    campaignId?: string | null;
    attemptId?: string | null;
    executionId: string;
    moduleKey: string;
    requestedFormats: readonly ('html' | 'markdown' | 'junit' | 'json')[];
  }): ReportPublicationRecord {
    this.assertActiveProject(params.projectId);
    return this.block3.beginReportPublication(params);
  }

  recordPublishedReportFormat(params: {
    publicationId: string;
    format: ReportFormatEntry['format'];
    filePath: string;
    sha256: string;
    bytes: number;
  }): ReportPublicationRecord {
    return this.block3.recordPublishedFormat(params);
  }

  failReportPublication(publicationId: string, failedFormat: string): ReportPublicationRecord | null {
    return this.block3.failReportPublication(publicationId, failedFormat);
  }

  getRecoverablePublication(projectId: string, executionId?: string): ReportPublicationRecord | null {
    this.assertActiveProject(projectId);
    return this.block3.getRecoverablePublication(projectId, executionId);
  }

  listRecoverablePublications(projectId: string): ReportPublicationRecord[] {
    this.assertActiveProject(projectId);
    return this.block3.listRecoverablePublications(projectId);
  }

  closeServiceModule(projectId: string, moduleKey: string, action: 'close' | 'waive', waiverReason?: string): ModuleRecord {
    this.assertActiveProject(projectId);
    const mod = this.upsertModule({
      projectId,
      key: moduleKey,
      title: moduleKey,
      status: action === 'close' ? 'closed' : 'waived',
      waiverReason: action === 'waive' ? waiverReason : undefined,
    });
    const now = new Date().toISOString();
    if (action === 'close') {
      this.#store.run(
        `UPDATE modules SET status = 'closed', closed_at = COALESCE(closed_at, ?), updated_at = ? WHERE module_id = ?`,
        now,
        now,
        mod.module_id,
      );
    } else {
      this.#store.run(
        `UPDATE modules SET status = 'waived', waiver_reason = ?, closed_at = COALESCE(closed_at, ?), updated_at = ? WHERE module_id = ?`,
        waiverReason ?? null,
        now,
        now,
        mod.module_id,
      );
    }
    const row = this.#store.get<Record<string, unknown>>('SELECT * FROM modules WHERE module_id = ?', mod.module_id);
    return parseModuleRow(row!);
  }

  startCampaignReusingModules(params: {
    projectId: string;
    moduleKeys: readonly string[];
    mode?: CampaignMode;
    objective?: string;
    reusedFromCampaignId?: string;
  }): { readonly campaign: CampaignRecord; readonly reused_modules: ModuleRecord[]; readonly newly_planned: ModuleRecord[] } {
    const project = this.assertActiveProject(params.projectId);
    const previousCampaign =
      params.reusedFromCampaignId ??
      project.active_campaign_id ??
      rowOptStr(
        this.#store.get<Record<string, unknown>>(
          'SELECT campaign_id FROM campaigns WHERE project_id = ? ORDER BY created_at DESC LIMIT 1',
          params.projectId,
        )?.campaign_id,
      ) ??
      undefined;

    const existingModules = this.#store
      .all<Record<string, unknown>>('SELECT * FROM modules WHERE project_id = ?', params.projectId)
      .map(parseModuleRow);

    const reused: ModuleRecord[] = [];
    const newlyPlanned: ModuleRecord[] = [];
    const targetIds: string[] = [];

    for (const rawKey of params.moduleKeys) {
      const normalized = normalizeSlug(rawKey) || rawKey.trim().toLowerCase();
      const found = existingModules.find((m) => m.key === normalized || m.key === rawKey.trim());
      if (found && (found.status === 'closed' || found.status === 'waived')) {
        reused.push(found);
        targetIds.push(found.module_id);
      } else {
        const created = this.upsertModule({
          projectId: params.projectId,
          key: normalized,
          title: found?.title ?? rawKey.trim(),
          routeHint: found?.route_hint ?? undefined,
          priority: found?.priority ?? 'medium',
          criticality: found?.criticality ?? 'medium',
        });
        newlyPlanned.push(created);
        targetIds.push(created.module_id);
      }
    }

    const campaign = this.startCampaign({
      projectId: params.projectId,
      mode: params.mode ?? 'investigate_and_test',
      phase: 'WORKING',
      objective: params.objective,
      targetModuleIds: targetIds,
      reusedFromCampaignId: previousCampaign,
    });

    return { campaign, reused_modules: reused, newly_planned: newlyPlanned };
  }

  completeActiveCampaign(projectId: string): CampaignRecord | null {
    const project = this.assertActiveProject(projectId);
    const campaignId = project.active_campaign_id;
    if (!campaignId) return null;
    return this.updateCampaignPhase(campaignId, 'WRAP_UP', 'completed');
  }

  private parseDiscoveryRevisionRow(row: Record<string, unknown>): DiscoveryRevisionRecord {
    return {
      revision_id: rowStr(row.revision_id),
      project_id: rowStr(row.project_id),
      application_id: rowStr(row.application_id),
      environment_id: rowStr(row.environment_id),
      environment_name: rowStr(row.environment_name),
      tenant_id: row.tenant_id == null ? null : rowStr(row.tenant_id),
      profile_id: row.profile_id == null ? null : rowStr(row.profile_id),
      role: row.role == null ? null : rowStr(row.role),
      module_key: rowStr(row.module_key),
      module_title: rowStr(row.module_title),
      target_url: rowStr(row.target_url),
      execution_id: rowStr(row.execution_id),
      inventory_id: row.inventory_id == null ? null : rowStr(row.inventory_id),
      content_hash: rowStr(row.content_hash),
      scope_hash: rowStr(row.scope_hash),
      dossier: JSON.parse(rowStr(row.dossier_json)) as DiscoveryDossierCanonical,
      created_at: rowStr(row.created_at),
    };
  }

  saveDiscoveryRevision(input: {
    readonly dossier: DiscoveryDossierCanonical;
    readonly targetUrl: string;
    readonly executionId: string;
    readonly inventoryId?: string | null;
  }): { readonly revision: DiscoveryRevisionRecord; readonly reused: boolean } {
    const { scope } = input.dossier;
    this.assertActiveProject(scope.project_id);
    const moduleKey = normalizeSlug(scope.module_key);
    const scopeHash = computeScopeHash(scope);
    const contentHash = computeDossierContentHash(input.dossier);
    const now = new Date().toISOString();

    return this.#store.transaction('IMMEDIATE', () => {
      const existing = this.#store.get<Record<string, unknown>>(
        `SELECT * FROM discovery_revisions
         WHERE project_id = ? AND module_key = ? AND scope_hash = ? AND content_hash = ?`,
        scope.project_id,
        moduleKey,
        scopeHash,
        contentHash,
      );

      let revision: DiscoveryRevisionRecord;
      let reused = false;

      if (existing) {
        revision = this.parseDiscoveryRevisionRow(existing);
        reused = true;
      } else {
        const revisionId = buildDiscoveryRevisionId(scopeHash, contentHash);
        this.#store.run(
          `INSERT INTO discovery_revisions (
            revision_id, project_id, application_id, environment_id, environment_name,
            tenant_id, profile_id, role, module_key, module_title,
            target_url, execution_id, inventory_id, content_hash, scope_hash, dossier_json, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          revisionId,
          scope.project_id,
          scope.application_id,
          scope.environment_id,
          scope.environment_name,
          scope.tenant_id,
          scope.profile_id,
          scope.role,
          moduleKey,
          scope.module_title,
          sanitizeTargetPathname(input.targetUrl),
          input.executionId,
          input.inventoryId ?? null,
          contentHash,
          scopeHash,
          JSON.stringify(input.dossier),
          now,
        );
        const inserted = this.#store.get<Record<string, unknown>>(
          'SELECT * FROM discovery_revisions WHERE revision_id = ?',
          revisionId,
        );
        if (!inserted) {
          throw new ApplicationServiceError('discovery_revision_persist_failed', 'No se pudo persistir la revisión del expediente.');
        }
        revision = this.parseDiscoveryRevisionRow(inserted);
      }

      this.#store.run(
        `INSERT INTO discovery_scope_heads (project_id, scope_hash, module_key, active_revision_id, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(project_id, scope_hash) DO UPDATE SET
           module_key = excluded.module_key,
           active_revision_id = excluded.active_revision_id,
           updated_at = excluded.updated_at`,
        scope.project_id,
        scopeHash,
        moduleKey,
        revision.revision_id,
        now,
      );

      return { revision, reused };
    });
  }

  getDiscoveryRevision(revisionId: string): DiscoveryRevisionRecord | null {
    const row = this.#store.get<Record<string, unknown>>(
      'SELECT * FROM discovery_revisions WHERE revision_id = ?',
      revisionId,
    );
    return row ? this.parseDiscoveryRevisionRow(row) : null;
  }

  listDiscoveryRevisions(projectId: string, moduleKey?: string): DiscoveryRevisionRecord[] {
    this.assertActiveProject(projectId);
    const rows = moduleKey
      ? this.#store.all<Record<string, unknown>>(
          `SELECT * FROM discovery_revisions
           WHERE project_id = ? AND module_key = ?
           ORDER BY created_at DESC, rowid DESC LIMIT 200`,
          projectId,
          normalizeSlug(moduleKey),
        )
      : this.#store.all<Record<string, unknown>>(
          `SELECT * FROM discovery_revisions
           WHERE project_id = ?
           ORDER BY created_at DESC, rowid DESC LIMIT 200`,
          projectId,
        );
    return rows.map((r) => this.parseDiscoveryRevisionRow(r));
  }

  listLatestDiscoveryRevisionsByScope(projectId: string): DiscoveryRevisionRecord[] {
    this.assertActiveProject(projectId);
    const headRows = this.#store.all<Record<string, unknown>>(
      `SELECT dr.*
       FROM discovery_scope_heads dsh
       JOIN discovery_revisions dr ON dr.revision_id = dsh.active_revision_id
       WHERE dsh.project_id = ?
       ORDER BY dsh.updated_at DESC, dsh.rowid DESC`,
      projectId,
    );
    const seen = new Set<string>();
    const latest: DiscoveryRevisionRecord[] = [];
    for (const row of headRows) {
      const rev = this.parseDiscoveryRevisionRow(row);
      if (seen.has(rev.scope_hash)) continue;
      seen.add(rev.scope_hash);
      latest.push(rev);
    }

    const fallbackRows = this.#store.all<Record<string, unknown>>(
      `SELECT * FROM discovery_revisions
       WHERE project_id = ?
       ORDER BY created_at DESC, rowid DESC`,
      projectId,
    );
    for (const row of fallbackRows) {
      const rev = this.parseDiscoveryRevisionRow(row);
      if (seen.has(rev.scope_hash)) continue;
      seen.add(rev.scope_hash);
      latest.push(rev);
    }
    return latest;
  }

  listLatestDiscoveryRevisionsByModule(projectId: string): DiscoveryRevisionRecord[] {
    const all = this.listLatestDiscoveryRevisionsByScope(projectId);
    const seen = new Set<string>();
    const latest: DiscoveryRevisionRecord[] = [];
    for (const rev of all) {
      if (seen.has(rev.module_key)) continue;
      seen.add(rev.module_key);
      latest.push(rev);
    }
    return latest;
  }

  findLatestDiscoveryRevisionForScope(scope: DiscoveryDossierScope): DiscoveryRevisionRecord | null {
    this.assertActiveProject(scope.project_id);
    const moduleKey = normalizeSlug(scope.module_key);
    const scopeHash = computeScopeHash(scope);
    const headRow = this.#store.get<Record<string, unknown>>(
      `SELECT dr.*
       FROM discovery_scope_heads dsh
       JOIN discovery_revisions dr ON dr.revision_id = dsh.active_revision_id
       WHERE dsh.project_id = ? AND dsh.module_key = ? AND dsh.scope_hash = ?
       LIMIT 1`,
      scope.project_id,
      moduleKey,
      scopeHash,
    );
    if (headRow) {
      return this.parseDiscoveryRevisionRow(headRow);
    }

    const fallbackRow = this.#store.get<Record<string, unknown>>(
      `SELECT * FROM discovery_revisions
       WHERE project_id = ? AND module_key = ? AND scope_hash = ?
       ORDER BY created_at DESC, rowid DESC LIMIT 1`,
      scope.project_id,
      moduleKey,
      scopeHash,
    );
    return fallbackRow ? this.parseDiscoveryRevisionRow(fallbackRow) : null;
  }

  validateDiscoveryRevisionScope(
    revisionId: string,
    expected: {
      readonly projectId: string;
      readonly applicationId?: string;
      readonly moduleKey?: string;
      readonly environmentId?: string;
      readonly environmentName?: string;
      readonly tenantId?: string | null;
      readonly checkTenant?: boolean;
      readonly profileId?: string | null;
      readonly checkProfile?: boolean;
      readonly role?: string | null;
      readonly checkRole?: boolean;
    },
  ):
    | { readonly ok: true; readonly revision: DiscoveryRevisionRecord }
    | { readonly ok: false; readonly code: 'discovery_revision_not_found' | 'discovery_revision_out_of_scope'; readonly reason: string } {
    const revision = this.getDiscoveryRevision(revisionId);
    if (!revision) {
      return {
        ok: false,
        code: 'discovery_revision_not_found',
        reason: `No existe la revisión de Discovery '${revisionId}'.`,
      };
    }
    if (revision.project_id !== expected.projectId) {
      return {
        ok: false,
        code: 'discovery_revision_out_of_scope',
        reason: `La revisión '${revisionId}' pertenece a otro proyecto y no puede usarse en este alcance.`,
      };
    }
    if (expected.applicationId && revision.application_id !== expected.applicationId) {
      return {
        ok: false,
        code: 'discovery_revision_out_of_scope',
        reason: `La revisión '${revisionId}' pertenece a la aplicación '${revision.application_id}', distinta de '${expected.applicationId}'.`,
      };
    }
    if (expected.moduleKey && normalizeSlug(revision.module_key) !== normalizeSlug(expected.moduleKey)) {
      return {
        ok: false,
        code: 'discovery_revision_out_of_scope',
        reason: `La revisión '${revisionId}' pertenece al módulo '${revision.module_key}', no a '${expected.moduleKey}'.`,
      };
    }
    if (expected.environmentId && revision.environment_id !== expected.environmentId) {
      return {
        ok: false,
        code: 'discovery_revision_out_of_scope',
        reason: `La revisión '${revisionId}' pertenece al entorno '${revision.environment_name}' y no al entorno activo.`,
      };
    }
    if (
      expected.environmentName &&
      revision.environment_name !== expected.environmentName &&
      revision.environment_id !== expected.environmentName
    ) {
      return {
        ok: false,
        code: 'discovery_revision_out_of_scope',
        reason: `La revisión '${revisionId}' pertenece al entorno '${revision.environment_name}', no a '${expected.environmentName}'.`,
      };
    }
    if ((expected.checkTenant || expected.tenantId !== undefined) && (revision.tenant_id ?? null) !== (expected.tenantId ?? null)) {
      return {
        ok: false,
        code: 'discovery_revision_out_of_scope',
        reason: `La revisión '${revisionId}' corresponde al tenant '${revision.tenant_id ?? 'ninguno'}', distinto del alcance actual '${expected.tenantId ?? 'ninguno'}'.`,
      };
    }
    if (expected.checkProfile || expected.profileId !== undefined) {
      let resolvedExpectedProfile: string | null = null;
      if (typeof expected.profileId === 'string' && expected.profileId.trim()) {
        const aliasRes = this.resolveProfileAlias(expected.projectId, expected.profileId, expected.environmentId);
        resolvedExpectedProfile =
          aliasRes.status === 'matched' ? aliasRes.profile.profile_id : expected.profileId.trim();
      }
      if ((revision.profile_id ?? null) !== resolvedExpectedProfile) {
        return {
          ok: false,
          code: 'discovery_revision_out_of_scope',
          reason: `La revisión '${revisionId}' corresponde al perfil '${revision.profile_id ?? 'anónimo'}', distinto de '${resolvedExpectedProfile ?? 'anónimo'}'.`,
        };
      }
    }
    if ((expected.checkRole || expected.role !== undefined) && (revision.role ?? null) !== (expected.role ?? null)) {
      return {
        ok: false,
        code: 'discovery_revision_out_of_scope',
        reason: `La revisión '${revisionId}' corresponde al rol '${revision.role ?? 'ninguno'}', distinto de '${expected.role ?? 'ninguno'}'.`,
      };
    }
    return { ok: true, revision };
  }

  close(): void {
    for (const store of this.#knowledgeStores.values()) {
      try {
        store.close();
      } catch {
        // Best-effort close
      }
    }
    this.#knowledgeStores.clear();
    this.#store.close();
  }
}
