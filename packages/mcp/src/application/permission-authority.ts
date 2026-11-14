import { randomUUID } from 'node:crypto';

import {
  QAP_CAPABILITIES,
  type PermissionCheckResult,
  type PermissionGrantInput,
  type PermissionGrantRecord,
  type PermissionScope,
  type QapCapability,
} from '@qap/shared';

import type { AppServiceSqliteStore } from './app-service-store.js';
import { normalizePathKey } from './safe-storage.js';

interface GrantRow {
  grant_id: string;
  project_id: string;
  env_id: string | null;
  capability: QapCapability;
  scope_json: string;
  status: 'active' | 'revoked' | 'expired';
  granted_by: string;
  policy_hash: string;
  granted_at: string;
  expires_at: string | null;
  revoked_at: string | null;
  revoked_reason: string | null;
}

function rowToRecord(row: GrantRow): PermissionGrantRecord {
  return {
    grant_id: row.grant_id,
    project_id: row.project_id,
    ...(row.env_id ? { env_id: row.env_id } : {}),
    capability: row.capability,
    scope: JSON.parse(row.scope_json) as PermissionScope,
    status: row.status,
    granted_by: row.granted_by,
    policy_hash: row.policy_hash,
    granted_at: row.granted_at,
    expires_at: row.expires_at,
    revoked_at: row.revoked_at,
    revoked_reason: row.revoked_reason,
  };
}

function scopeMatches(grantScope: PermissionScope, requested?: PermissionScope): boolean {
  if (!requested) return true;
  if (grantScope.env_id && requested.env_id && grantScope.env_id !== requested.env_id) return false;
  if (grantScope.root_path && requested.root_path && normalizePathKey(grantScope.root_path) !== normalizePathKey(requested.root_path)) {
    return false;
  }
  if (grantScope.origin && requested.origin && grantScope.origin !== requested.origin) return false;
  if (grantScope.profile_id && requested.profile_id && grantScope.profile_id !== requested.profile_id) return false;
  if (grantScope.tenant_id && requested.tenant_id && grantScope.tenant_id !== requested.tenant_id) return false;
  if (grantScope.module_id && requested.module_id && grantScope.module_id !== requested.module_id) return false;

  // If the request pins an explicit constraint (origin/profile/tenant/module) and the grant was scoped to a different value or lacked required specificity:
  if (grantScope.profile_id && !requested.profile_id) return false;
  if (grantScope.tenant_id && !requested.tenant_id) return false;
  return true;
}

function recoveryHintFor(capability: QapCapability): string {
  switch (capability) {
    case 'access':
      return 'El operador del host debe autorizar o restaurar el acceso al proyecto.';
    case 'login':
      return 'Se requiere autorización vigente de login y sesión verificada para esta identidad.';
    case 'observe':
      return 'Se requiere autorización explícita del host para observar (Discovery) este origen o módulo.';
    case 'execute':
      return 'Se requiere autorización explícita de ejecución funcional para lanzar pruebas.';
    case 'accept':
      return 'Se requiere decisión humana independiente del gateway/usuario para aceptar requisitos, cierres o reportes.';
  }
}

/**
 * Common authority for permissions, expiration (vigencia), and revocation.
 * Enforces strict separation across access, login, observe, execute, and accept.
 */
export class PermissionAuthority {
  constructor(private readonly store: AppServiceSqliteStore) {}

  grant(input: PermissionGrantInput): PermissionGrantRecord {
    const projectRow = this.store.get<{ status: string }>(
      'SELECT status FROM projects WHERE project_id = ?',
      input.project_id,
    );
    if (!projectRow || projectRow.status === 'deleting' || projectRow.status === 'deleted') {
      throw new Error('Cannot grant permission to a missing, deleting, or deleted project');
    }
    if (!QAP_CAPABILITIES.includes(input.capability)) {
      throw new Error(`Unknown capability: ${String(input.capability)}`);
    }
    const grantId = randomUUID();
    const now = new Date().toISOString();
    const scope = input.scope ?? {};
    const policyHash = input.policy_hash ?? 'default-policy-v1';
    const expiresAt = input.expires_at ?? null;

    this.store.run(
      `INSERT INTO permission_grants
        (grant_id, project_id, env_id, capability, scope_json, status, granted_by, policy_hash, granted_at, expires_at)
       VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)`,
      grantId,
      input.project_id,
      scope.env_id ?? null,
      input.capability,
      JSON.stringify(scope),
      input.granted_by,
      policyHash,
      now,
      expiresAt,
    );

    return {
      grant_id: grantId,
      project_id: input.project_id,
      ...(scope.env_id ? { env_id: scope.env_id } : {}),
      capability: input.capability,
      scope,
      status: 'active',
      granted_by: input.granted_by,
      policy_hash: policyHash,
      granted_at: now,
      expires_at: expiresAt,
    };
  }

  check(
    projectId: string,
    capability: QapCapability,
    requestedScope?: PermissionScope,
    expectedPolicyHash?: string,
    nowMs = Date.now(),
  ): PermissionCheckResult {
    const project = this.store.get<{ status: string }>(
      'SELECT status FROM projects WHERE project_id = ?',
      projectId,
    );
    if (!project || project.status !== 'active') {
      return {
        allowed: false,
        capability,
        reason: 'project_unavailable',
        code: `capability_${capability}_project_unavailable`,
        recover_with: recoveryHintFor(capability),
      };
    }

    const rows = this.store.all<GrantRow>(
      `SELECT * FROM permission_grants
       WHERE project_id = ? AND capability = ?
       ORDER BY granted_at DESC, rowid DESC`,
      projectId,
      capability,
    );

    if (rows.length === 0) {
      return {
        allowed: false,
        capability,
        reason: 'missing_grant',
        code: `capability_${capability}_missing`,
        recover_with: recoveryHintFor(capability),
      };
    }

    let latestMismatch: PermissionGrantRecord | undefined;
    let latestExpired: PermissionGrantRecord | undefined;
    let latestRevoked: PermissionGrantRecord | undefined;
    let latestPolicyDrift: PermissionGrantRecord | undefined;

    for (const row of rows) {
      const record = rowToRecord(row);
      if (record.status === 'active' && record.expires_at) {
        const expMs = Date.parse(record.expires_at);
        if (!Number.isFinite(expMs) || expMs <= nowMs) {
          this.store.run(
            `UPDATE permission_grants SET status = 'expired' WHERE grant_id = ? AND status = 'active'`,
            record.grant_id,
          );
          latestExpired ??= { ...record, status: 'expired' };
          continue;
        }
      }
      if (record.status === 'expired') {
        latestExpired ??= record;
        continue;
      }
      if (record.status === 'revoked') {
        latestRevoked ??= record;
        continue;
      }
      if (expectedPolicyHash && record.policy_hash !== expectedPolicyHash) {
        latestPolicyDrift ??= record;
        continue;
      }
      if (!scopeMatches(record.scope, requestedScope)) {
        latestMismatch ??= record;
        continue;
      }
      return { allowed: true, capability, grant: record };
    }

    if (latestMismatch) {
      return {
        allowed: false,
        capability,
        reason: 'scope_mismatch',
        code: `capability_${capability}_scope_mismatch`,
        grant: latestMismatch,
        recover_with: recoveryHintFor(capability),
      };
    }
    if (latestPolicyDrift) {
      return {
        allowed: false,
        capability,
        reason: 'policy_drift',
        code: `capability_${capability}_policy_drift`,
        grant: latestPolicyDrift,
        recover_with: recoveryHintFor(capability),
      };
    }
    if (latestExpired) {
      return {
        allowed: false,
        capability,
        reason: 'expired',
        code: `capability_${capability}_expired`,
        grant: latestExpired,
        recover_with: recoveryHintFor(capability),
      };
    }
    return {
      allowed: false,
      capability,
      reason: 'revoked',
      code: `capability_${capability}_revoked`,
      grant: latestRevoked,
      recover_with: recoveryHintFor(capability),
    };
  }

  evaluateAll(projectId: string, scope?: PermissionScope): Record<QapCapability, PermissionCheckResult> {
    const result = {} as Record<QapCapability, PermissionCheckResult>;
    for (const capability of QAP_CAPABILITIES) {
      result[capability] = this.check(projectId, capability, scope);
    }
    return result;
  }

  listGrants(projectId: string, includeInactive = true): PermissionGrantRecord[] {
    const sql = includeInactive
      ? 'SELECT * FROM permission_grants WHERE project_id = ? ORDER BY granted_at DESC, rowid DESC'
      : "SELECT * FROM permission_grants WHERE project_id = ? AND status = 'active' ORDER BY granted_at DESC, rowid DESC";
    return this.store.all<GrantRow>(sql, projectId).map(rowToRecord);
  }

  revokeGrant(grantId: string, reason = 'explicit_revocation'): PermissionGrantRecord | null {
    const existing = this.store.get<GrantRow>('SELECT * FROM permission_grants WHERE grant_id = ?', grantId);
    if (!existing) return null;
    if (existing.status === 'active') {
      const now = new Date().toISOString();
      this.store.run(
        `UPDATE permission_grants SET status = 'revoked', revoked_at = ?, revoked_reason = ? WHERE grant_id = ?`,
        now,
        reason,
        grantId,
      );
    }
    return rowToRecord(this.store.get<GrantRow>('SELECT * FROM permission_grants WHERE grant_id = ?', grantId)!);
  }

  revokeProjectAccess(
    projectId: string,
    reason = 'project_revocation',
    capabilities?: readonly QapCapability[],
  ): number {
    const now = new Date().toISOString();
    if (capabilities && capabilities.length > 0) {
      const placeholders = capabilities.map(() => '?').join(',');
      const res = this.store.run(
        `UPDATE permission_grants
         SET status = 'revoked', revoked_at = ?, revoked_reason = ?
         WHERE project_id = ? AND status = 'active' AND capability IN (${placeholders})`,
        now,
        reason,
        projectId,
        ...capabilities,
      );
      return Number(res.changes);
    }
    const res = this.store.run(
      `UPDATE permission_grants
       SET status = 'revoked', revoked_at = ?, revoked_reason = ?
       WHERE project_id = ? AND status = 'active'`,
      now,
      reason,
      projectId,
    );
    return Number(res.changes);
  }
}
