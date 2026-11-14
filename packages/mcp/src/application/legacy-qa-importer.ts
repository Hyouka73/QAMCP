import { createHash, randomUUID } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import type { LegacyQaImportReceipt, LegacyQaVerificationResult } from '@qap/shared';
import YAML from 'yaml';

import type { AppServiceSqliteStore } from './app-service-store.js';
import { assertSafeHostPath, listSafeFiles, normalizePathKey } from './safe-storage.js';

export const LEGACY_QA_IMPORTER_VERSION = 1;

const SECRET_KEYS = new Set([
  'password',
  'pass',
  'passwd',
  'token',
  'secret',
  'cookie',
  'cookies',
  'authorization',
  'storagestate',
  'storage_state',
  'session_token',
  'api_key',
  'apikey',
]);

interface ScannedLegacyFile {
  readonly relativePath: string;
  readonly absolutePath: string;
  readonly sha256: string;
  readonly bytes: number;
  readonly raw: Buffer;
}

interface RedactionStats {
  count: number;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function redactSecrets(value: unknown, stats: RedactionStats): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactSecrets(item, stats));
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SECRET_KEYS.has(k.toLowerCase())) {
        if (v !== undefined && v !== null && v !== '') {
          stats.count += 1;
        }
        continue;
      }
      out[k] = redactSecrets(v, stats);
    }
    return out;
  }
  return value;
}

function collectLegacyFiles(sourceRoot: string): ScannedLegacyFile[] {
  const safeRoot = assertSafeHostPath(sourceRoot);
  const qaDir = join(safeRoot, '.qa');
  if (!existsSync(qaDir)) return [];
  assertSafeHostPath(qaDir);
  const files = listSafeFiles(qaDir);
  const collected: ScannedLegacyFile[] = [];
  for (const filePath of files) {
    const rel = relative(safeRoot, filePath).replaceAll('\\', '/');
    // Only import declarative/metadata files — never raw session cookies, vault, cache, or logs.
    if (
      rel.startsWith('.qa/cache/') ||
      rel.startsWith('.qa/private/') ||
      rel.startsWith('.qa/logs/') ||
      rel.endsWith('.sqlite') ||
      rel.endsWith('.sqlite-wal') ||
      rel.endsWith('.sqlite-shm') ||
      rel.endsWith('.enc')
    ) {
      continue;
    }
    const raw = readFileSync(filePath);
    const stat = statSync(filePath);
    collected.push({
      relativePath: rel,
      absolutePath: filePath,
      sha256: createHash('sha256').update(raw).digest('hex'),
      bytes: stat.size,
      raw,
    });
  }
  return collected.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

function computeManifestHash(files: readonly ScannedLegacyFile[]): string {
  const hash = createHash('sha256');
  hash.update(`importer_v${LEGACY_QA_IMPORTER_VERSION}\n`);
  for (const file of files) {
    hash.update(`${file.relativePath}:${file.sha256}:${file.bytes}\n`);
  }
  return hash.digest('hex');
}

function safeParseYamlOrJson(file: ScannedLegacyFile): Record<string, unknown> | unknown[] | null {
  try {
    const text = file.raw.toString('utf8');
    if (file.relativePath.endsWith('.json')) {
      return JSON.parse(text) as Record<string, unknown> | unknown[];
    }
    if (file.relativePath.endsWith('.yaml') || file.relativePath.endsWith('.yml')) {
      return YAML.parse(text) as Record<string, unknown> | unknown[];
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Explicit, versioned, idempotent, and checksum-verifiable .qa importer.
 * Never scans global machine paths automatically; operates strictly on a selected workspace.
 */
export class LegacyQaImporter {
  constructor(private readonly store: AppServiceSqliteStore) {}

  importWorkspace(projectId: string, sourceRoot: string): LegacyQaImportReceipt {
    const project = this.store.get<{ project_id: string; status: string; active_env_id: string | null }>(
      'SELECT project_id, status, active_env_id FROM projects WHERE project_id = ?',
      projectId,
    );
    if (!project || project.status !== 'active') {
      throw new Error('Target project must exist and be active for .qa import');
    }
    const safeSource = assertSafeHostPath(sourceRoot);
    const normalizedSource = normalizePathKey(safeSource);
    const scanned = collectLegacyFiles(safeSource);
    const manifestHash = computeManifestHash(scanned);

    const existing = this.store.get<{
      import_id: string;
      source_manifest_hash: string;
      entities_imported_json: string;
      secrets_redacted: number;
      imported_at: string;
    }>(
      `SELECT import_id, source_manifest_hash, entities_imported_json, secrets_redacted, imported_at
       FROM import_manifests
       WHERE project_id = ? AND source_root = ? AND importer_version = ?
       ORDER BY imported_at DESC, rowid DESC LIMIT 1`,
      projectId,
      normalizedSource,
      LEGACY_QA_IMPORTER_VERSION,
    );

    if (existing && existing.source_manifest_hash === manifestHash) {
      return {
        import_id: existing.import_id,
        project_id: projectId,
        importer_version: LEGACY_QA_IMPORTER_VERSION,
        status: 'already_imported',
        source_root: safeSource,
        source_manifest_hash: manifestHash,
        files_verified: scanned.length,
        entities_imported: JSON.parse(existing.entities_imported_json) as Record<string, number>,
        secrets_redacted: existing.secrets_redacted,
        imported_at: existing.imported_at,
      };
    }

    const redaction: RedactionStats = { count: 0 };
    const counts: Record<string, number> = {
      environments: 0,
      profiles: 0,
      modules: 0,
      campaigns: 0,
      executions: 0,
    };
    const now = new Date().toISOString();
    const importId = randomUUID();

    this.store.transaction('IMMEDIATE', () => {
      let defaultEnvId = project.active_env_id;
      const byPath = new Map(scanned.map((f) => [f.relativePath, f]));

      // 1. Environments
      const envFile = byPath.get('.qa/project/environments.yaml');
      if (envFile) {
        const parsed = asRecord(redactSecrets(safeParseYamlOrJson(envFile), redaction));
        const envsObj = asRecord(parsed?.environments);
        if (parsed && envsObj) {
          const defName = typeof parsed.default === 'string' ? parsed.default : 'local';
          for (const [envName, rawCfg] of Object.entries(envsObj)) {
            if (!rawCfg || typeof rawCfg !== 'object') continue;
            const cfg = rawCfg as Record<string, unknown>;
            const url = typeof cfg.url === 'string' && cfg.url.trim() ? cfg.url.trim() : 'http://localhost';
            let domain: string[] = [];
            try {
              const parsedUrl = new URL(url);
              if (parsedUrl.hostname) domain = [parsedUrl.hostname];
            } catch {
              domain = [];
            }
            const existingEnv = this.store.get<{ env_id: string }>(
              'SELECT env_id FROM environments WHERE project_id = ? AND name = ?',
              projectId,
              envName,
            );
            const envId = existingEnv?.env_id ?? randomUUID();
            if (!existingEnv) {
              this.store.run(
                `INSERT INTO environments
                  (env_id, project_id, name, base_url, is_production, destructive_actions_allowed, safe_domains_json, tenant_mode, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, 0, ?, 'single', ?, ?)`,
                envId,
                projectId,
                envName,
                url,
                envName.toLowerCase().includes('prod') ? 1 : 0,
                JSON.stringify(domain),
                now,
                now,
              );
              counts.environments += 1;
            }
            if (envName === defName || !defaultEnvId) {
              defaultEnvId = envId;
            }
          }
        }
      }

      // 2. Context
      const ctxFile = byPath.get('.qa/project/context.yaml');
      if (ctxFile) {
        const parsed = asRecord(redactSecrets(safeParseYamlOrJson(ctxFile), redaction));
        if (parsed) {
          const obj = typeof parsed.objective === 'string' && parsed.objective.trim() ? parsed.objective.trim() : undefined;
          const projName = typeof parsed.project_name === 'string' && parsed.project_name.trim() ? parsed.project_name.trim() : undefined;
          if (obj || projName || defaultEnvId) {
            this.store.run(
              `UPDATE projects
               SET objective = COALESCE(objective, ?),
                   name = CASE WHEN name = '' THEN COALESCE(?, name) ELSE name END,
                   active_env_id = COALESCE(active_env_id, ?),
                   updated_at = ?
               WHERE project_id = ?`,
              obj ?? null,
              projName ?? null,
              defaultEnvId ?? null,
              now,
              projectId,
            );
          }
        }
      } else if (defaultEnvId) {
        this.store.run(
          'UPDATE projects SET active_env_id = COALESCE(active_env_id, ?), updated_at = ? WHERE project_id = ?',
          defaultEnvId,
          now,
          projectId,
        );
      }

      // Ensure an env_id exists for profiles/campaigns
      if (!defaultEnvId) {
        defaultEnvId = randomUUID();
        this.store.run(
          `INSERT INTO environments
            (env_id, project_id, name, base_url, is_production, destructive_actions_allowed, safe_domains_json, tenant_mode, created_at, updated_at)
           VALUES (?, ?, 'local', 'http://localhost', 0, 0, '["localhost"]', 'single', ?, ?)`,
          defaultEnvId,
          projectId,
          now,
          now,
        );
        this.store.run('UPDATE projects SET active_env_id = ?, updated_at = ? WHERE project_id = ?', defaultEnvId, now, projectId);
        counts.environments += 1;
      }

      // 3. Profiles (metadata only — never marks an unverified/imported profile as active without host revalidation)
      const profFile = byPath.get('.qa/project/auth/profiles.json');
      if (profFile) {
        const parsed = redactSecrets(safeParseYamlOrJson(profFile), redaction);
        let list: unknown[] = [];
        if (Array.isArray(parsed)) {
          list = parsed;
        } else if (parsed && typeof parsed === 'object') {
          const maybeProfiles = (parsed as Record<string, unknown>).profiles;
          if (Array.isArray(maybeProfiles)) {
            list = maybeProfiles;
          }
        }
        for (const item of list) {
          if (!item || typeof item !== 'object') continue;
          const p = item as Record<string, unknown>;
          const label = typeof p.id === 'string' ? p.id : (typeof p.name === 'string' ? p.name : undefined);
          if (!label) continue;
          const envName = typeof p.env === 'string' ? p.env : 'local';
          const envRow = this.store.get<{ env_id: string }>(
            'SELECT env_id FROM environments WHERE project_id = ? AND name = ?',
            projectId,
            envName,
          );
          const targetEnvId = envRow?.env_id ?? defaultEnvId;
          const existingProfile = this.store.get<{ profile_id: string }>(
            'SELECT profile_id FROM profiles WHERE project_id = ? AND env_id = ? AND label = ?',
            projectId,
            targetEnvId,
            label,
          );
          if (!existingProfile) {
            const loginMode = p.login_mode === 'handoff' ? 'handoff' : 'auto';
            // Legacy verified flag is NOT blindly trusted for protected auth: require pending/revalidation until Block 2 checks session.
            this.store.run(
              `INSERT INTO profiles
                (profile_id, project_id, env_id, label, role_name, login_mode, credential_ref_key, status, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
              randomUUID(),
              projectId,
              targetEnvId,
              label,
              typeof p.role === 'string' ? p.role : null,
              loginMode,
              `imported:${projectId}:${label}`,
              now,
              now,
            );
            counts.profiles += 1;
          }
        }
      }

      // 4. Lifecycle + Modules
      const lifecycleFile = byPath.get('.qa/project/lifecycle.json');
      let lifecycleMods: Record<string, Record<string, unknown>> = {};
      if (lifecycleFile) {
        const parsed = asRecord(redactSecrets(safeParseYamlOrJson(lifecycleFile), redaction));
        if (parsed) {
          const rawModules = asRecord(parsed.modules);
          if (rawModules) {
            lifecycleMods = rawModules as Record<string, Record<string, unknown>>;
          }
          const rawPhase = typeof parsed.phase === 'string' ? parsed.phase : '';
          const phase = ['ONBOARDING', 'SCOPING', 'WORKING', 'WRAP_UP'].includes(rawPhase)
            ? rawPhase
            : 'ONBOARDING';
          const sessionObj = asRecord(parsed.session);
          const campaignKey = typeof sessionObj?.id === 'string' && sessionObj.id ? sessionObj.id : randomUUID();
          const existingCampaign = this.store.get<{ campaign_id: string }>(
            'SELECT campaign_id FROM campaigns WHERE project_id = ? AND campaign_id = ?',
            projectId,
            campaignKey,
          );
          if (!existingCampaign) {
            this.store.run(
              `INSERT INTO campaigns
                (campaign_id, project_id, env_id, mode, phase, status, objective, target_module_ids_json, created_at, updated_at)
               VALUES (?, ?, ?, 'continue', ?, 'paused', ?, '[]', ?, ?)`,
              campaignKey,
              projectId,
              defaultEnvId,
              phase,
              typeof sessionObj?.objective === 'string' ? sessionObj.objective : null,
              now,
              now,
            );
            this.store.run(
              'UPDATE projects SET active_campaign_id = COALESCE(active_campaign_id, ?), updated_at = ? WHERE project_id = ?',
              campaignKey,
              now,
              projectId,
            );
            counts.campaigns += 1;
          }
        }
      }

      // Merge modules from lifecycle.modules + .qa/modules/<key>/
      const moduleKeys = new Set<string>(Object.keys(lifecycleMods));
      for (const file of scanned) {
        const match = file.relativePath.match(/^\.qa\/modules\/([^/]+)\//);
        if (match) moduleKeys.add(match[1]);
      }

      const validModuleStates = new Set([
        'candidate',
        'planned',
        'observed',
        'interviewing',
        'consolidated',
        'closed',
        'waived',
      ]);

      for (const modKey of moduleKeys) {
        const existingMod = this.store.get<{ module_id: string }>(
          'SELECT module_id FROM modules WHERE project_id = ? AND key = ?',
          projectId,
          modKey,
        );
        if (existingMod) continue;
        const lcState = lifecycleMods[modKey];
        const rawStatus = typeof lcState?.state === 'string' ? lcState.state : 'candidate';
        const status = validModuleStates.has(rawStatus) ? rawStatus : 'candidate';
        const modContextFile = byPath.get(`.qa/modules/${modKey}/context.yaml`);
        const modSummaryFile = byPath.get(`.qa/modules/${modKey}/summary.json`);
        const modMeta = modContextFile
          ? redactSecrets(safeParseYamlOrJson(modContextFile), redaction)
          : (modSummaryFile ? redactSecrets(safeParseYamlOrJson(modSummaryFile), redaction) : null);
        const modMetaObj = asRecord(modMeta);
        const rawRoutes = Array.isArray(modMetaObj?.routes) ? (modMetaObj.routes as unknown[]) : undefined;
        const firstRoute = rawRoutes && typeof rawRoutes[0] === 'string' ? rawRoutes[0] : null;
        const routeHint = typeof modMetaObj?.path === 'string' ? modMetaObj.path : firstRoute;

        this.store.run(
          `INSERT INTO modules
            (module_id, project_id, key, title, route_hint, priority, criticality, status, waiver_reason, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 'medium', 'medium', ?, ?, ?, ?)`,
          randomUUID(),
          projectId,
          modKey,
          typeof modMetaObj?.title === 'string' ? modMetaObj.title : modKey,
          routeHint,
          status,
          typeof lcState?.waiver_reason === 'string' ? lcState.waiver_reason : null,
          now,
          now,
        );
        counts.modules += 1;
      }

      // Count legacy execution records present in manifest (provenance only)
      for (const file of scanned) {
        if (/^\.qa\/executions\/[^/]+\.json$/.test(file.relativePath)) {
          counts.executions += 1;
        }
      }

      this.store.run(
        `INSERT INTO import_manifests
          (import_id, project_id, importer_version, source_root, source_manifest_hash, entities_imported_json, secrets_redacted, imported_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        importId,
        projectId,
        LEGACY_QA_IMPORTER_VERSION,
        normalizedSource,
        manifestHash,
        JSON.stringify(counts),
        redaction.count,
        now,
      );

      for (const file of scanned) {
        this.store.run(
          `INSERT INTO import_entries (import_id, relative_path, sha256, bytes) VALUES (?, ?, ?, ?)`,
          importId,
          file.relativePath,
          file.sha256,
          file.bytes,
        );
      }
    });

    return {
      import_id: importId,
      project_id: projectId,
      importer_version: LEGACY_QA_IMPORTER_VERSION,
      status: existing ? 'updated' : 'imported',
      source_root: safeSource,
      source_manifest_hash: manifestHash,
      files_verified: scanned.length,
      entities_imported: counts,
      secrets_redacted: redaction.count,
      imported_at: now,
    };
  }

  verifyImport(importId: string, sourceRoot?: string): LegacyQaVerificationResult {
    const manifest = this.store.get<{
      import_id: string;
      project_id: string;
      importer_version: number;
      source_root: string;
      source_manifest_hash: string;
    }>('SELECT * FROM import_manifests WHERE import_id = ?', importId);
    if (!manifest) {
      throw new Error(`Unknown import_id: ${importId}`);
    }
    const entries = this.store.all<{ relative_path: string; sha256: string; bytes: number }>(
      'SELECT relative_path, sha256, bytes FROM import_entries WHERE import_id = ? ORDER BY relative_path ASC',
      importId,
    );
    const rootToCheck = sourceRoot ? assertSafeHostPath(sourceRoot) : manifest.source_root;
    const scanned = existsSync(rootToCheck) ? collectLegacyFiles(rootToCheck) : [];
    const currentHash = scanned.length > 0 || existsSync(join(rootToCheck, '.qa')) ? computeManifestHash(scanned) : null;
    const currentByPath = new Map(scanned.map((f) => [f.relativePath, f]));
    const mismatches: string[] = [];

    for (const entry of entries) {
      const current = currentByPath.get(entry.relative_path);
      if (!current) {
        mismatches.push(`missing:${entry.relative_path}`);
      } else if (current.sha256 !== entry.sha256) {
        mismatches.push(`modified:${entry.relative_path}`);
      }
    }
    for (const file of scanned) {
      if (!entries.some((e) => e.relative_path === file.relativePath)) {
        mismatches.push(`added:${file.relativePath}`);
      }
    }

    return {
      valid: mismatches.length === 0 && currentHash === manifest.source_manifest_hash,
      import_id: manifest.import_id,
      project_id: manifest.project_id,
      importer_version: manifest.importer_version,
      recorded_manifest_hash: manifest.source_manifest_hash,
      current_manifest_hash: currentHash,
      checked_files: entries.length,
      mismatches,
    };
  }
}
