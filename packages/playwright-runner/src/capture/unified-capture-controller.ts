import { randomUUID } from 'node:crypto';
import { join } from 'node:path';

import type { BrowserContext, Page } from 'playwright-core';
import type {
  CapturePolicyDecision, CaptureSegmentRecord, SuppressionReasonCode, SuppressionRecord,
} from '@qap/shared';

export interface CaptureSurface {
  readonly project_id: string;
  readonly env_id: string;
  readonly module_key: string;
  readonly case_id: string;
  readonly role_id: string;
  readonly origin: string;
}

/**
 * Host-owned lease. Admission must be established before any content is rendered,
 * and remain valid for the full segment, including asynchronous surface changes.
 * Browser events delivered after rendering do not satisfy this interface.
 */
export interface CaptureLease {
  readonly signal: AbortSignal;
  readDecision(): Promise<CapturePolicyDecision>;
  readonly nativeTraceAllowed: boolean;
}

export interface CaptureStaging {
  readonly verifiedDirectory: string;
  discard(files: readonly string[]): Promise<void>;
}

export interface StagedCaptureSegment extends CaptureSegmentRecord {
  readonly decision: CapturePolicyDecision;
  readonly video: string;
  readonly trace?: string;
  readonly screenshots: readonly string[];
}

/**
 * Owns the three browser capture channels for one execution page. Returned
 * artifacts are candidates for sealing only. No method publishes evidence.
 */
export class UnifiedCaptureController {
  private pending: Promise<unknown> = Promise.resolve();
  private active?: {
    artifactId: string;
    decision: CapturePolicyDecision;
    video: string;
    trace?: string;
    traceStarted: boolean;
    screenshots: string[];
    steps: { step_index: number; offset_ms: number }[];
    startedAt: number;
    monotonicStart: number;
    revoke: () => void;
  };
  private readonly suppressions: SuppressionRecord[] = [];
  private closed = false;

  constructor(
    private readonly page: Page,
    private readonly context: BrowserContext,
    private readonly surface: CaptureSurface,
    private readonly lease: CaptureLease,
    private readonly staging: CaptureStaging,
  ) {
    if (page.context() !== context || context.pages().length !== 1) {
      throw new Error('Capture requires a dedicated single-page execution context.');
    }
  }

  private serialize<T>(operation: () => Promise<T>): Promise<T> {
    const next = this.pending.then(operation);
    this.pending = next.catch(() => {});
    return next;
  }

  private suppress(reason: SuppressionReasonCode): void {
    this.suppressions.push({
      case_id: this.surface.case_id,
      role_id: this.surface.role_id,
      reason,
      recorded_at: new Date().toISOString(),
    });
  }

  getSuppressions(): readonly SuppressionRecord[] {
    return [...this.suppressions];
  }

  private async currentDecision(): Promise<CapturePolicyDecision> {
    const decision = await this.lease.readDecision();
    const issuer = decision.issuer;
    const scope = decision.scope;
    const guard = decision.technical_enforcements;
    if (this.lease.signal.aborted || (issuer?.expires_at && !(Date.parse(issuer.expires_at) > Date.now()))) {
      return { ...decision, mode: 'MANDATORY_SUPPRESSION', custody: 'none', suppression_reason: 'grant_missing_or_revoked' };
    }
    if (decision.mode === 'MANDATORY_SUPPRESSION') return decision;
    if (decision.mode === 'PRIVATE_AUTHORIZED') {
      return { ...decision, mode: 'MANDATORY_SUPPRESSION', custody: 'none', suppression_reason: 'private_capture_disabled' };
    }
    const owner = decision.owner_declared;
    if (!issuer || scope?.project_id !== this.surface.project_id || scope.env_id !== this.surface.env_id ||
        !scope.allowed_origins.includes(this.surface.origin) || !scope.allowed_roles.includes(this.surface.role_id) ||
        decision.custody !== 'standard_exportable' ||
        !(owner.environment_declared_synthetic || owner.backend_pre_render_exclusion_claimed) ||
        !guard.record_video_disabled || !guard.service_workers_blocked || !guard.cdp_fetch_hop_by_hop_active ||
        !guard.auth_context_physically_separated || !guard.popups_excluded_from_capture ||
        !guard.tracing_blocked_on_sensitive_inputs || !guard.staging_user_acl_verified) {
      return { ...decision, mode: 'MANDATORY_SUPPRESSION', custody: 'none', suppression_reason: 'surface_not_admitted' };
    }
    return decision;
  }

  start(): Promise<boolean> {
    return this.serialize(async () => {
      if (this.closed || this.active) throw new Error('Invalid capture lifecycle transition.');
      const decision = await this.currentDecision();
      if (decision.mode === 'MANDATORY_SUPPRESSION') {
        this.suppress(decision.suppression_reason ?? 'surface_not_admitted');
        return false;
      }
      const size = this.page.viewportSize();
      if (!size || this.lease.signal.aborted) {
        this.suppress(size ? 'grant_missing_or_revoked' : 'capture_guard_failed');
        return false;
      }
      const artifactId = randomUUID();
      const video = join(this.staging.verifiedDirectory, `${artifactId}.webm`);
      const trace = this.lease.nativeTraceAllowed && decision.scope?.allow_tracing_without_sensitive_inputs
        ? join(this.staging.verifiedDirectory, `${artifactId}.zip`)
        : undefined;
      const revoke = () => {
        void this.close('grant_missing_or_revoked').catch(() => {
          // The owner must await close before using the staging area.
        });
      };
      this.active = {
        artifactId, decision, video, trace, traceStarted: false, screenshots: [], steps: [],
        startedAt: Date.now(), monotonicStart: performance.now(), revoke,
      };
      this.lease.signal.addEventListener('abort', revoke, { once: true });
      try {
        await this.page.screencast.start({ path: video, size });
        if (trace && !this.lease.signal.aborted) {
          this.active.traceStarted = true;
          await this.context.tracing.start({ screenshots: true, snapshots: true, sources: false });
        }
        if (this.lease.signal.aborted) {
          await this.finish('grant_missing_or_revoked');
          return false;
        }
        return true;
      } catch (error) {
        if (this.active) await this.finish('capture_guard_failed');
        throw error;
      }
    });
  }

  private async authorizationStillValid(decision: CapturePolicyDecision): Promise<boolean> {
    const current = await this.currentDecision();
    return current.mode === 'VERIFIED_STRICT' &&
      current.scope?.grant_id === decision.scope?.grant_id &&
      current.issuer?.issuer_id === decision.issuer?.issuer_id &&
      current.issuer?.grant_generation === decision.issuer?.grant_generation;
  }

  screenshot(): Promise<string | undefined> {
    return this.serialize(async () => {
      const active = this.active;
      if (!active) return undefined;
      try {
        if (!(await this.authorizationStillValid(active.decision))) {
          await this.finish('grant_missing_or_revoked');
          return undefined;
        }
        const filename = join(this.staging.verifiedDirectory, `${randomUUID()}.png`);
        active.screenshots.push(filename);
        await this.page.screenshot({ path: filename, timeout: 5_000 });
        if (await this.authorizationStillValid(active.decision)) return filename;
        await this.finish('grant_missing_or_revoked');
        return undefined;
      } catch (error) {
        if (this.active) await this.finish('capture_guard_failed');
        throw error;
      }
    });
  }

  markStep(stepIndex: number): Promise<void> {
    return this.serialize(async () => {
      const active = this.active;
      if (active && Number.isSafeInteger(stepIndex) && stepIndex >= 0) {
        active.steps.push({ step_index: stepIndex, offset_ms: Math.round(performance.now() - active.monotonicStart) });
      }
    });
  }

  close(reason?: SuppressionReasonCode): Promise<StagedCaptureSegment | undefined> {
    return this.serialize(async () => {
      this.closed = true;
      if (!this.active) {
        if (reason && !this.suppressions.length) this.suppress(reason);
        return undefined;
      }
      return this.finish(reason);
    });
  }

  private async finish(reason?: SuppressionReasonCode): Promise<StagedCaptureSegment | undefined> {
    const active = this.active;
    if (!active) return undefined;
    this.active = undefined;
    this.lease.signal.removeEventListener('abort', active.revoke);
    const files = [active.video, ...active.screenshots, ...(active.trace ? [active.trace] : [])];
    try {
      try {
        if (active.traceStarted) {
          await this.context.tracing.stop(reason ? undefined : { path: active.trace });
        }
      } finally {
        await this.page.screencast.stop();
      }
      if (!reason && !(await this.authorizationStillValid(active.decision))) reason = 'grant_missing_or_revoked';
    } catch (error) {
      this.suppress(reason ?? 'capture_guard_failed');
      // A failed drain cannot leave browser writers running against deleted files.
      await this.context.close();
      await this.staging.discard(files);
      throw error;
    }

    if (reason) {
      this.suppress(reason);
      await this.staging.discard(files);
      return undefined;
    }
    return {
      artifact_id: active.artifactId,
      module_key: this.surface.module_key,
      case_id: this.surface.case_id,
      role_id: this.surface.role_id,
      origin: this.surface.origin,
      started_at_epoch_ms: active.startedAt,
      step_offsets_ms: active.steps,
      decision_id: active.decision.decision_id,
      decision: active.decision,
      video: active.video,
      trace: active.trace,
      screenshots: active.screenshots,
    };
  }
}
