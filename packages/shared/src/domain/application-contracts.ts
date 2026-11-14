/**
 * QAMCP — Block 1 Application Service, Identity, Lifecycle & Authority Contracts
 *
 * Pure domain types for durable ownership of projects, environments/profiles,
 * modules, campaigns, tasks, capability-based permissions, typed progress,
 * pending decisions, recovery cursors, safe explicit deletion, and versioned
 * .qa imports.
 */

export const QAP_CAPABILITIES = [
  'access',
  'login',
  'observe',
  'execute',
  'accept',
] as const;

export type QapCapability = (typeof QAP_CAPABILITIES)[number];

export type CapabilityGrantStatus = 'active' | 'revoked' | 'expired';

export interface PermissionScope {
  readonly env_id?: string;
  readonly root_path?: string;
  readonly origin?: string;
  readonly profile_id?: string;
  readonly tenant_id?: string;
  readonly module_id?: string;
}

export interface PermissionGrantRecord {
  readonly grant_id: string;
  readonly project_id: string;
  readonly env_id?: string;
  readonly capability: QapCapability;
  readonly scope: PermissionScope;
  readonly status: CapabilityGrantStatus;
  readonly granted_by: string;
  readonly policy_hash: string;
  readonly granted_at: string;
  readonly expires_at: string | null;
  readonly revoked_at?: string | null;
  readonly revoked_reason?: string | null;
}

export interface PermissionGrantInput {
  readonly project_id: string;
  readonly capability: QapCapability;
  readonly scope?: PermissionScope;
  readonly granted_by: string;
  readonly policy_hash?: string;
  readonly expires_at?: string | null;
}

export type PermissionDenialReason =
  | 'missing_grant'
  | 'revoked'
  | 'expired'
  | 'scope_mismatch'
  | 'policy_drift'
  | 'project_unavailable';

export type PermissionCheckResult =
  | {
      readonly allowed: true;
      readonly capability: QapCapability;
      readonly grant: PermissionGrantRecord;
    }
  | {
      readonly allowed: false;
      readonly capability: QapCapability;
      readonly reason: PermissionDenialReason;
      readonly code: string;
      readonly grant?: PermissionGrantRecord;
      readonly recover_with: string;
    };

export type ProjectStatus = 'active' | 'suspended' | 'deleting' | 'deleted';

export interface ProjectRecord {
  readonly project_id: string;
  readonly name: string;
  readonly slug: string;
  readonly canonical_root: string;
  readonly root_hash: string;
  readonly application_id: string;
  readonly status: ProjectStatus;
  readonly objective?: string;
  readonly active_env_id?: string;
  readonly active_campaign_id?: string;
  readonly created_at: string;
  readonly updated_at: string;
  readonly deleted_at?: string | null;
}

export interface EnvironmentRecord {
  readonly env_id: string;
  readonly project_id: string;
  readonly name: string;
  readonly base_url: string;
  readonly is_production: boolean;
  readonly destructive_actions_allowed: boolean;
  readonly safe_domains: readonly string[];
  readonly tenant_mode: 'single' | 'multi_tenant';
  readonly default_tenant?: string;
  readonly created_at: string;
  readonly updated_at: string;
}

export type AuthProfileLifecycleStatus =
  | 'pending'
  | 'verified'
  | 'expired'
  | 'revoked'
  | 'failed';

/** Metadata only — secrets are strictly isolated in @qap/auth providers. */
export interface AuthProfileRecord {
  readonly profile_id: string;
  readonly project_id: string;
  readonly env_id: string;
  readonly label: string;
  readonly role_name?: string;
  readonly tenant_id?: string;
  readonly login_mode: 'auto' | 'handoff' | 'interactive_window';
  readonly credential_ref_key?: string;
  readonly session_artifact_id?: string;
  readonly status: AuthProfileLifecycleStatus;
  readonly verified_at?: string | null;
  readonly expires_at?: string | null;
  readonly revoked_at?: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

export type ServiceModuleStatus =
  | 'candidate'
  | 'planned'
  | 'observed'
  | 'interviewing'
  | 'consolidated'
  | 'closed'
  | 'waived';

export interface ModuleRecord {
  readonly module_id: string;
  readonly project_id: string;
  readonly key: string;
  readonly title: string;
  readonly route_hint?: string;
  readonly priority: 'high' | 'medium' | 'low';
  readonly criticality: 'low' | 'medium' | 'high' | 'critical';
  readonly status: ServiceModuleStatus;
  readonly knowledge_module_id?: string;
  readonly knowledge_revision?: number;
  readonly waiver_reason?: string;
  readonly closed_at?: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

export type CampaignMode =
  | 'investigate'
  | 'investigate_and_test'
  | 'investigate_bug'
  | 'continue';

export type CampaignPhase = 'ONBOARDING' | 'SCOPING' | 'WORKING' | 'WRAP_UP';

export type CampaignStatus = 'active' | 'paused' | 'draining' | 'completed' | 'aborted';

export interface CampaignRecord {
  readonly campaign_id: string;
  readonly project_id: string;
  readonly env_id: string;
  readonly mode: CampaignMode;
  readonly phase: CampaignPhase;
  readonly status: CampaignStatus;
  readonly objective?: string;
  readonly target_module_ids: readonly string[];
  readonly reused_from_campaign_id?: string;
  readonly created_at: string;
  readonly updated_at: string;
  readonly closed_at?: string | null;
}

export type TaskStatus =
  | 'pending'
  | 'in_progress'
  | 'blocked'
  | 'waiting_decision'
  | 'completed'
  | 'cancelled'
  | 'failed';

export type PendingDecisionKind =
  | 'input'
  | 'authorization'
  | 'human_review'
  | 'oracle'
  | 'delete_confirmation'
  | 'closure_confirmation';

export interface PendingDecisionContract {
  readonly decision_id: string;
  readonly kind: PendingDecisionKind;
  readonly capability_required?: QapCapability;
  readonly prompt: string;
  readonly options?: ReadonlyArray<{ readonly id: string; readonly label: string; readonly effect?: string }>;
  readonly target_entity?: { readonly kind: string; readonly id: string };
  readonly blocking: boolean;
  readonly expires_at?: string;
}

export interface ProgressContract {
  readonly phase: CampaignPhase;
  readonly stage: string;
  readonly completed: number;
  readonly total: number;
  readonly unit: string;
  readonly percent: number;
  readonly active_task_id?: string;
  readonly active_module_key?: string;
  readonly summary: string;
}

export interface RecoveryContract {
  readonly recoverable: boolean;
  readonly project_id: string;
  readonly campaign_id?: string;
  readonly resume_token: string;
  readonly last_completed_step?: string;
  readonly interrupted_task_id?: string;
  readonly checkpoint_at: string;
  readonly recovery_bundle_available: boolean;
  readonly tombstone_blocked: boolean;
}

export interface TaskRecord {
  readonly task_id: string;
  readonly project_id: string;
  readonly campaign_id: string;
  readonly module_id?: string;
  readonly kind: string;
  readonly title: string;
  readonly status: TaskStatus;
  readonly progress_current: number;
  readonly progress_total: number;
  readonly progress_unit: string;
  readonly pending_decision?: PendingDecisionContract | null;
  readonly recovery_cursor?: RecoveryContract | null;
  readonly error_code?: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface ContextDiscrepancy {
  readonly discrepancy_id: string;
  readonly field: 'base_url' | 'objective' | 'role' | 'route' | 'tenant_mode';
  readonly source_a: string;
  readonly value_a: string;
  readonly source_b: string;
  readonly value_b: string;
  readonly severity: 'warning' | 'blocking';
  readonly resolution_status: 'pending_user_decision' | 'kept_source_a' | 'kept_source_b' | 'dismissed';
  readonly resolved_at?: string;
}

export interface IngestedDocumentRecord {
  readonly doc_id: string;
  readonly project_id: string;
  readonly source_ref: string;
  readonly format: 'md' | 'markdown' | 'txt' | 'inline_text';
  readonly sha256: string;
  readonly byte_length: number;
  readonly analyzed_by: 'agent' | 'heuristic';
  readonly extracted: {
    readonly objective?: string;
    readonly roles: readonly string[];
    readonly routes: readonly string[];
    readonly critical_flows: readonly string[];
    readonly tenant_hints?: readonly string[];
  };
  readonly discrepancies: readonly ContextDiscrepancy[];
  readonly ingested_at: string;
}

export type ServiceModuleCandidateStatus = 'candidate' | 'approved' | 'rejected' | 'promoted';

export interface ServiceModuleCandidateRecord {
  readonly candidate_id: string;
  readonly project_id: string;
  readonly key: string;
  readonly title: string;
  readonly route_hint?: string;
  readonly provenance_source: 'observed_dom' | 'spa_dom' | 'markdown_doc' | 'route_scan' | 'user';
  readonly evidence_refs: readonly string[];
  readonly confidence: 'low' | 'medium' | 'high';
  readonly status: ServiceModuleCandidateStatus;
  readonly promoted_module_id?: string;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface PartialInventoryRecord {
  readonly inventory_id: string;
  readonly project_id: string;
  readonly execution_id: string;
  readonly target_url: string;
  readonly mode: string;
  readonly routes_visited: number;
  readonly routes_candidate: number;
  readonly routes_blocked: number;
  readonly views_count: number;
  readonly controls_count: number;
  readonly forms_count: number;
  readonly candidate_keys: readonly string[];
  readonly created_at: string;
}

export interface ScopeLimitsContract {
  readonly supported_doc_formats: readonly ['.md', '.markdown', '.txt'];
  readonly max_doc_bytes: number;
  readonly supported_technologies: readonly ['html_mpa', 'spa_readonly_same_origin'];
  readonly readonly_discovery_only: true;
  readonly tenant_mode: 'single' | 'multi_tenant';
  readonly default_tenant?: string;
  readonly multi_tenant_requires_explicit_tenant: true;
}

export interface ProjectStateSnapshot {
  readonly project: ProjectRecord;
  readonly environment: EnvironmentRecord | null;
  readonly campaign: CampaignRecord | null;
  readonly modules: readonly ModuleRecord[];
  readonly profiles: readonly AuthProfileRecord[];
  readonly tasks: readonly TaskRecord[];
  readonly capabilities: Record<QapCapability, PermissionCheckResult>;
  readonly progress: ProgressContract;
  readonly pending_decision: PendingDecisionContract | null;
  readonly recovery: RecoveryContract;
  readonly ingested_documents?: readonly IngestedDocumentRecord[];
  readonly discrepancies?: readonly ContextDiscrepancy[];
  readonly module_candidates?: readonly ServiceModuleCandidateRecord[];
  readonly partial_inventories?: readonly PartialInventoryRecord[];
  readonly scope_limits?: ScopeLimitsContract;
}

export interface DeleteScopePreview {
  readonly project_id: string;
  readonly project_name: string;
  readonly canonical_root: string;
  readonly confirmation_token: string;
  readonly expires_at: string;
  readonly scope_hash: string;
  readonly owned_resources: {
    readonly sqlite_records: Record<string, number>;
    readonly host_paths: readonly string[];
    readonly managed_artifacts: number;
    readonly credential_refs: readonly string[];
    readonly session_artifacts: readonly string[];
    readonly active_grants: number;
    readonly active_tasks_to_drain: number;
    readonly workspace_qa_files: readonly string[];
  };
  readonly source_files_untouched: true;
  readonly neighboring_projects_untouched: true;
}

export interface DeleteExecutionReceipt {
  readonly status: 'deleted';
  readonly project_id: string;
  readonly drained_tasks: number;
  readonly aborted_campaigns: number;
  readonly revoked_grants: number;
  readonly deleted_credentials: number;
  readonly removed_host_paths: readonly string[];
  readonly removed_workspace_qa_paths: readonly string[];
  readonly recovery_bundle_path: string;
  readonly recovery_bundle_hash: string;
  readonly auto_recreation_blocked: true;
  readonly deleted_at: string;
}

export interface RecoveryRestoreReceipt {
  readonly status: 'recovered';
  readonly project_id: string;
  readonly restored_from: string;
  readonly project: ProjectRecord;
  readonly restored_entities: Record<string, number>;
  readonly capabilities_reset_to_revoked: true;
  readonly recovered_at: string;
}

export interface LegacyQaImportReceipt {
  readonly import_id: string;
  readonly project_id: string;
  readonly importer_version: number;
  readonly status: 'imported' | 'already_imported' | 'updated';
  readonly source_root: string;
  readonly source_manifest_hash: string;
  readonly files_verified: number;
  readonly entities_imported: Record<string, number>;
  readonly secrets_redacted: number;
  readonly imported_at: string;
}

export interface LegacyQaVerificationResult {
  readonly valid: boolean;
  readonly import_id: string;
  readonly project_id: string;
  readonly importer_version: number;
  readonly recorded_manifest_hash: string;
  readonly current_manifest_hash: string | null;
  readonly checked_files: number;
  readonly mismatches: readonly string[];
}

export type OracleStatus = 'accredited' | 'missing_oracle' | 'confirmed_by_qa';

export type RiskDecisionStatus = 'not_required' | 'pending' | 'accepted_by_qa' | 'rejected';

export type TestCaseConformityStatus =
  | 'pending_oracle'
  | 'proposed'
  | 'approved'
  | 'rejected'
  | 'pass'
  | 'fail'
  | 'not_run'
  | 'technical_error'
  | 'human_accepted';

export interface EpistemicObservationSummary {
  readonly source_kind: 'observed_dom' | 'spa_dom' | 'ingested_doc' | 'user';
  readonly route: string;
  readonly observed_controls: readonly string[];
  readonly observed_headings: readonly string[];
  readonly evidence_refs: readonly string[];
}

export interface EpistemicInferenceSummary {
  readonly rationale: string;
  readonly proposed_flow: string;
  readonly step_count: number;
  readonly proposed_by: 'qap' | 'assistant';
}

export interface EpistemicExpectationSummary {
  readonly oracle_status: 'accredited' | 'missing' | 'confirmed_by_qa';
  readonly expected_outcome: string | null;
  readonly source: 'user' | 'ingested_doc' | 'missing';
  readonly business_risk_question?: string;
}

export interface ServiceRequirementRecord {
  readonly requirement_id: string;
  readonly project_id: string;
  readonly module_id: string;
  readonly module_key: string;
  readonly revision: number;
  readonly title: string;
  readonly description: string;
  readonly category: 'functional' | 'business_rule' | 'security' | 'ui' | 'ux' | 'regression' | 'performance';
  readonly source: 'user' | 'ingested_doc' | 'observed_dom' | 'spa_dom' | 'agent_inferred';
  readonly validation_status: 'inferred' | 'pending_oracle' | 'confirmed' | 'rejected';
  readonly acceptance_criteria: readonly string[];
  readonly risk_level: 'low' | 'medium' | 'high' | 'critical';
  readonly risk_decision: RiskDecisionStatus;
  readonly risk_note?: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface ServiceTestCaseRecord {
  readonly case_id: string;
  readonly project_id: string;
  readonly module_id: string;
  readonly module_key: string;
  readonly requirement_id: string | null;
  readonly requirement_revision: number;
  readonly title: string;
  readonly version: number;
  readonly observation: EpistemicObservationSummary;
  readonly inference: EpistemicInferenceSummary;
  readonly expectation: EpistemicExpectationSummary;
  readonly oracle_status: OracleStatus;
  readonly risk_level: 'low' | 'medium' | 'high' | 'critical';
  readonly risk_decision: RiskDecisionStatus;
  readonly steps: readonly Record<string, unknown>[];
  readonly conformity_status: TestCaseConformityStatus;
  readonly confirmation_digest?: string | null;
  readonly confirmed_by?: string | null;
  readonly confirmed_at?: string | null;
  readonly campaign_id?: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

export type StepExecutionVerdict = 'PASS' | 'FAIL' | 'not_run' | 'technical_error';

export type CaseExecutionVerdict = 'PASS' | 'FAIL' | 'not_run' | 'technical_error' | 'human_accepted';

export interface ExecutionStepResultRecord {
  readonly step_index: number;
  readonly action: string;
  readonly status: StepExecutionVerdict;
  readonly duration_ms?: number;
  readonly selector?: string | null;
  readonly expected?: string | null;
  readonly observed?: string | null;
  readonly started_at?: string | null;
  readonly finished_at?: string | null;
  readonly focused_screenshot?: boolean;
  readonly artifact_error?: string | null;
  readonly redacted_selectors_count?: number;
  readonly message?: string;
  readonly evidence_paths: readonly string[];
}

export type ExecutionAttemptStatus =
  | 'prepared'
  | 'running'
  | 'completed'
  | 'partial'
  | 'technical_error'
  | 'blocked'
  | 'aborted';

export interface ExecutionAttemptRecord {
  readonly attempt_id: string;
  readonly execution_id: string;
  readonly project_id: string;
  readonly campaign_id: string;
  readonly module_id: string;
  readonly module_key: string;
  readonly env_id: string;
  readonly profile_id?: string | null;
  readonly status: ExecutionAttemptStatus;
  readonly case_ids: readonly string[];
  readonly case_versions: Readonly<Record<string, number>>;
  readonly requirement_revisions: readonly {
    readonly requirement_id: string | null;
    readonly revision: number;
    readonly title?: string;
  }[];
  readonly started_at: string;
  readonly finished_at?: string | null;
  readonly error_code?: string | null;
  readonly error_message?: string | null;
  readonly raw_execution_path?: string | null;
  readonly trace_path?: string | null;
  readonly result_digest?: string | null;
  readonly video_path?: string | null;
  readonly trace_zip_path?: string | null;
  readonly timeline_path?: string | null;
  readonly screenshots?: readonly string[];
  readonly artifact_errors?: readonly {
    readonly artifact: string;
    readonly case_id?: string | null;
    readonly step_index?: number | null;
    readonly message: string;
  }[];
}

export interface ExecutionCaseResultRecord {
  readonly result_row_id: string;
  readonly attempt_id: string;
  readonly project_id: string;
  readonly campaign_id: string;
  readonly module_key: string;
  readonly requirement_id: string | null;
  readonly requirement_revision: number;
  readonly case_id: string;
  readonly case_version: number;
  readonly verdict: CaseExecutionVerdict;
  readonly human_acceptance_reason?: string | null;
  readonly human_accepted_by?: string | null;
  readonly human_accepted_at?: string | null;
  readonly step_results: readonly ExecutionStepResultRecord[];
  readonly evidence_refs: readonly string[];
  readonly created_at: string;
}

export interface ReportFormatEntry {
  readonly format: 'html' | 'markdown' | 'junit' | 'json';
  readonly path: string;
  readonly sha256: string;
  readonly bytes: number;
  readonly published_at: string;
}

export interface ReportPublicationRecord {
  readonly publication_id: string;
  readonly project_id: string;
  readonly campaign_id?: string | null;
  readonly attempt_id?: string | null;
  readonly execution_id: string;
  readonly module_key: string;
  readonly requested_formats: readonly ('html' | 'markdown' | 'junit' | 'json')[];
  readonly published_formats: Readonly<Record<string, ReportFormatEntry>>;
  readonly failed_format?: string | null;
  readonly status: 'partial' | 'completed';
  readonly created_at: string;
  readonly updated_at: string;
}

export interface CanonicalExecutionSummary {
  readonly status: 'not_executed' | 'executed_passed' | 'executed_failed' | 'executed_partial' | 'executed_error';
  readonly latest_attempt_id: string | null;
  readonly latest_execution_id: string | null;
  readonly total_attempts: number;
  readonly total_cases: number;
  readonly counts: {
    readonly pass: number;
    readonly fail: number;
    readonly not_run: number;
    readonly technical_error: number;
    readonly human_accepted: number;
  };
  readonly case_verdicts: readonly ExecutionCaseResultRecord[];
}
