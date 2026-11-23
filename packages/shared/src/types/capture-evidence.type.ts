export type CapturePolicyMode =
  | 'VERIFIED_STRICT'
  | 'PRIVATE_AUTHORIZED'
  | 'MANDATORY_SUPPRESSION';

export type CustodyClass =
  | 'standard_exportable'
  | 'private_encrypted_local_only'
  | 'none';

export interface IssuerAuthority {
  readonly issuer_kind: 'workspace_owner_host' | 'ci_policy_authority' | 'controlled_fixture_signer';
  readonly issuer_id: string;
  readonly grant_generation: number;
  readonly issued_at: string;
  readonly expires_at: string | null;
  readonly signature_or_digest: string;
}

export interface CaptureAuthorizationScope {
  readonly grant_id: string;
  readonly project_id: string;
  readonly env_id: string;
  readonly allowed_origins: readonly string[];
  readonly allowed_roles: readonly string[]; // vacío = ningún rol autorizado
  readonly allowed_route_patterns: readonly string[];
  readonly allowed_iframe_origins: readonly string[];
  readonly denied_route_patterns: readonly string[]; // siempre incluye auth/MFA/secretos
  readonly allow_tracing_without_sensitive_inputs: boolean;
}

export interface TechnicalEnforcementsSnapshot {
  readonly record_video_disabled: true;
  readonly service_workers_blocked: boolean;
  readonly cdp_fetch_hop_by_hop_active: boolean;
  readonly auth_context_physically_separated: boolean;
  readonly popups_excluded_from_capture: boolean;
  readonly tracing_blocked_on_sensitive_inputs: boolean;
  readonly staging_user_acl_verified: boolean;
  readonly rest_encryption_applied: boolean;
}

export interface OwnerDeclaredAssumptions {
  readonly environment_declared_synthetic: boolean;
  readonly backend_pre_render_exclusion_claimed: boolean;
  readonly residual_risk_acknowledged_by_owner: boolean;
  readonly declaration_note: string;
}

export type UnverifiableRiskCode =
  | 'dynamic_navigation_unexpected_payload'
  | 'unseen_http_response_or_unknown_secrets'
  | 'raster_images_and_canvas_pixels'
  | 'closed_shadow_dom_content'
  | 'cross_origin_iframe_internal_state'
  | 'server_side_role_privilege_drift'
  | 'cleartext_staging_window_during_path_encoding'
  | 'physical_media_wear_leveling_and_snapshots';

export interface CapturePolicyDecision {
  readonly decision_id: string;
  readonly mode: CapturePolicyMode;
  readonly custody: CustodyClass;
  readonly issuer: IssuerAuthority | null;
  readonly scope: CaptureAuthorizationScope | null;
  readonly technical_enforcements: TechnicalEnforcementsSnapshot;
  readonly owner_declared: OwnerDeclaredAssumptions;
  readonly unverifiable_risks: readonly UnverifiableRiskCode[];
  readonly suppression_reason?: SuppressionReasonCode;
}

export interface ArtifactCustodyMetadata {
  readonly custody: CustodyClass;
  readonly encrypted_at_rest: boolean;
  readonly cipher?: 'aes-256-gcm';
  readonly key_ref?: string; // referencia opaca en host vault, nunca clave cruda
  readonly aad?: string; // "${project_id}:${attempt_id}:${artifact_id}"
  readonly plaintext_sha256: string;
  readonly stored_sha256: string;
  readonly export_permitted_by_default: boolean;
}

export type PublicationLifecycleState =
  | 'STAGING_ACTIVE'
  | 'STAGING_SEALED'
  | 'COPYING_TO_FINAL'
  | 'SQLITE_COMMITTED'
  | 'FINALIZED'
  | 'ABORTED_DISCARDED';


export type SuppressionReasonCode =
  | 'authentication_boundary'
  | 'role_switch_boundary'
  | 'grant_missing_or_revoked'
  | 'private_capture_disabled'
  | 'protected_volume_unverified'
  | 'surface_not_admitted'
  | 'capture_guard_failed'
  | 'attempt_cancelled_or_aborted';

export type VisualEvidenceStatus =
  | 'captured'
  | 'partial'
  | 'suppressed_by_policy'
  | 'capture_failed'
  | 'integrity_degraded';

export interface SuppressionRecord {
  readonly case_id: string;
  readonly role_id: string;
  readonly reason: SuppressionReasonCode;
  readonly recorded_at: string;
}

export interface CaptureSegmentRecord {
  readonly artifact_id: string;
  readonly module_key: string;
  readonly case_id: string;
  readonly role_id: string;
  readonly origin: string;
  readonly started_at_epoch_ms: number;
  readonly step_offsets_ms: readonly { step_index: number; offset_ms: number }[];
  readonly decision_id: string;
}

export interface SealedCaptureArtifact {
  readonly artifact_id: string;
  readonly filename: string;
  readonly kind: 'webm' | 'png' | 'trace';
  readonly size_bytes: number;
  readonly custody: ArtifactCustodyMetadata;
}

export interface EvidenceManifestV1 {
  readonly _version: '1';
  readonly project_id: string;
  readonly attempt_id: string;
  readonly visual_evidence_status: VisualEvidenceStatus;
  readonly decisions: readonly CapturePolicyDecision[];
  readonly segments: readonly (CaptureSegmentRecord & { duration_ms: number })[];
  readonly artifacts: readonly SealedCaptureArtifact[];
  readonly suppressions: readonly SuppressionRecord[];
}
