import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import type { DatabaseSync, SQLInputValue } from 'node:sqlite';

import { checkSqliteFts5Capability } from '@qap/knowledge';

import { assertSafeHostPath, ensurePrivateDir } from './safe-storage.js';

const require = createRequire(import.meta.url);
function openSqliteDatabase(dbPath: string): DatabaseSync {
  const sqlite = require('node:sqlite') as typeof import('node:sqlite');
  return new sqlite.DatabaseSync(dbPath);
}

export const APP_SERVICE_SCHEMA_VERSION = 3;

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS app_schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL,
  checksum TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
  project_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  canonical_root TEXT NOT NULL,
  root_hash TEXT NOT NULL,
  application_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK(status IN ('active','suspended','deleting','deleted')),
  objective TEXT,
  active_env_id TEXT,
  active_campaign_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_projects_root_hash_status ON projects(root_hash, status);

CREATE TABLE IF NOT EXISTS deletion_tombstones (
  project_id TEXT PRIMARY KEY,
  canonical_root TEXT NOT NULL,
  root_hash TEXT NOT NULL,
  deleted_at TEXT NOT NULL,
  reason TEXT NOT NULL,
  recovery_bundle_path TEXT NOT NULL,
  recovery_bundle_hash TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tombstones_root_hash ON deletion_tombstones(root_hash);

CREATE TABLE IF NOT EXISTS environments (
  env_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  is_production INTEGER NOT NULL DEFAULT 0,
  destructive_actions_allowed INTEGER NOT NULL DEFAULT 0,
  safe_domains_json TEXT NOT NULL,
  tenant_mode TEXT NOT NULL CHECK(tenant_mode IN ('single','multi_tenant')) DEFAULT 'single',
  default_tenant TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(project_id, name)
);

CREATE TABLE IF NOT EXISTS profiles (
  profile_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  env_id TEXT NOT NULL REFERENCES environments(env_id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  role_name TEXT,
  tenant_id TEXT,
  login_mode TEXT NOT NULL CHECK(login_mode IN ('auto','handoff','interactive_window')),
  credential_ref_key TEXT,
  session_artifact_id TEXT,
  status TEXT NOT NULL CHECK(status IN ('pending','verified','expired','revoked','failed')),
  verified_at TEXT,
  expires_at TEXT,
  revoked_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(project_id, env_id, label)
);

CREATE TABLE IF NOT EXISTS modules (
  module_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  title TEXT NOT NULL,
  route_hint TEXT,
  priority TEXT NOT NULL CHECK(priority IN ('high','medium','low')) DEFAULT 'medium',
  criticality TEXT NOT NULL CHECK(criticality IN ('low','medium','high','critical')) DEFAULT 'medium',
  status TEXT NOT NULL CHECK(status IN ('candidate','planned','observed','interviewing','consolidated','closed','waived')),
  knowledge_module_id TEXT,
  knowledge_revision INTEGER,
  waiver_reason TEXT,
  closed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(project_id, key)
);

CREATE TABLE IF NOT EXISTS campaigns (
  campaign_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  env_id TEXT NOT NULL,
  mode TEXT NOT NULL CHECK(mode IN ('investigate','investigate_and_test','investigate_bug','continue')),
  phase TEXT NOT NULL CHECK(phase IN ('ONBOARDING','SCOPING','WORKING','WRAP_UP')),
  status TEXT NOT NULL CHECK(status IN ('active','paused','draining','completed','aborted')),
  objective TEXT,
  target_module_ids_json TEXT NOT NULL DEFAULT '[]',
  reused_from_campaign_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  closed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_campaigns_project_status ON campaigns(project_id, status);

CREATE TABLE IF NOT EXISTS tasks (
  task_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
  module_id TEXT,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending','in_progress','blocked','waiting_decision','completed','cancelled','failed')),
  progress_current INTEGER NOT NULL DEFAULT 0,
  progress_total INTEGER NOT NULL DEFAULT 1,
  progress_unit TEXT NOT NULL DEFAULT 'steps',
  pending_decision_json TEXT,
  recovery_cursor_json TEXT,
  error_code TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_project_campaign ON tasks(project_id, campaign_id, updated_at);

CREATE TABLE IF NOT EXISTS permission_grants (
  grant_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  env_id TEXT,
  capability TEXT NOT NULL CHECK(capability IN ('access','login','observe','execute','accept')),
  scope_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('active','revoked','expired')),
  granted_by TEXT NOT NULL,
  policy_hash TEXT NOT NULL,
  granted_at TEXT NOT NULL,
  expires_at TEXT,
  revoked_at TEXT,
  revoked_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_grants_project_cap_status ON permission_grants(project_id, capability, status);

CREATE TABLE IF NOT EXISTS pending_delete_requests (
  token_hash TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  scope_hash TEXT NOT NULL,
  scope_preview_json TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  consumed_at TEXT
);

CREATE TABLE IF NOT EXISTS owned_artifacts (
  artifact_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  relative_path TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  bytes INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(project_id, relative_path)
);

CREATE TABLE IF NOT EXISTS import_manifests (
  import_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  importer_version INTEGER NOT NULL,
  source_root TEXT NOT NULL,
  source_manifest_hash TEXT NOT NULL,
  entities_imported_json TEXT NOT NULL,
  secrets_redacted INTEGER NOT NULL DEFAULT 0,
  imported_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_imports_project_root ON import_manifests(project_id, source_root, imported_at);

CREATE TABLE IF NOT EXISTS import_entries (
  import_id TEXT NOT NULL REFERENCES import_manifests(import_id) ON DELETE CASCADE,
  relative_path TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  bytes INTEGER NOT NULL,
  PRIMARY KEY (import_id, relative_path)
);

CREATE TABLE IF NOT EXISTS host_session_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

const SCHEMA_V2_SQL = `
CREATE TABLE IF NOT EXISTS ingested_documents (
  doc_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  source_ref TEXT NOT NULL,
  format TEXT NOT NULL CHECK(format IN ('md','markdown','txt','inline_text')),
  sha256 TEXT NOT NULL,
  byte_length INTEGER NOT NULL,
  analyzed_by TEXT NOT NULL CHECK(analyzed_by IN ('agent','heuristic')),
  extracted_json TEXT NOT NULL,
  ingested_at TEXT NOT NULL,
  UNIQUE(project_id, source_ref, sha256)
);

CREATE INDEX IF NOT EXISTS idx_ingested_docs_project ON ingested_documents(project_id, ingested_at DESC);

CREATE TABLE IF NOT EXISTS context_discrepancies (
  discrepancy_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  field TEXT NOT NULL,
  source_a TEXT NOT NULL,
  value_a TEXT NOT NULL,
  source_b TEXT NOT NULL,
  value_b TEXT NOT NULL,
  severity TEXT NOT NULL CHECK(severity IN ('warning','blocking')),
  resolution_status TEXT NOT NULL CHECK(resolution_status IN ('pending_user_decision','kept_source_a','kept_source_b','dismissed')),
  resolved_at TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_discrepancies_project_status ON context_discrepancies(project_id, resolution_status);

CREATE TABLE IF NOT EXISTS module_candidates (
  candidate_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  title TEXT NOT NULL,
  route_hint TEXT,
  provenance_source TEXT NOT NULL CHECK(provenance_source IN ('observed_dom','spa_dom','markdown_doc','route_scan','user')),
  evidence_refs_json TEXT NOT NULL,
  confidence TEXT NOT NULL CHECK(confidence IN ('low','medium','high')),
  status TEXT NOT NULL CHECK(status IN ('candidate','approved','rejected','promoted')),
  promoted_module_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(project_id, key)
);

CREATE INDEX IF NOT EXISTS idx_module_candidates_project ON module_candidates(project_id, status);

CREATE TABLE IF NOT EXISTS partial_inventories (
  inventory_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  execution_id TEXT NOT NULL,
  target_url TEXT NOT NULL,
  mode TEXT NOT NULL,
  routes_visited INTEGER NOT NULL,
  routes_candidate INTEGER NOT NULL,
  routes_blocked INTEGER NOT NULL,
  views_count INTEGER NOT NULL,
  controls_count INTEGER NOT NULL,
  forms_count INTEGER NOT NULL,
  candidate_keys_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_partial_inventories_project ON partial_inventories(project_id, created_at DESC);
`;

const SCHEMA_V3_SQL = `
CREATE TABLE IF NOT EXISTS service_requirements (
  requirement_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  module_id TEXT NOT NULL REFERENCES modules(module_id) ON DELETE CASCADE,
  module_key TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('functional','business_rule','security','ui','ux','regression','performance')),
  source TEXT NOT NULL CHECK(source IN ('user','ingested_doc','observed_dom','spa_dom','agent_inferred')),
  validation_status TEXT NOT NULL CHECK(validation_status IN ('inferred','pending_oracle','confirmed','rejected')),
  acceptance_criteria_json TEXT NOT NULL,
  risk_level TEXT NOT NULL CHECK(risk_level IN ('low','medium','high','critical')) DEFAULT 'medium',
  risk_decision TEXT NOT NULL CHECK(risk_decision IN ('not_required','pending','accepted_by_qa','rejected')) DEFAULT 'not_required',
  risk_note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(project_id, module_key, requirement_id)
);

CREATE INDEX IF NOT EXISTS idx_service_requirements_project_mod ON service_requirements(project_id, module_key);

CREATE TABLE IF NOT EXISTS service_test_cases (
  case_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  module_id TEXT NOT NULL REFERENCES modules(module_id) ON DELETE CASCADE,
  module_key TEXT NOT NULL,
  requirement_id TEXT,
  requirement_revision INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  observation_json TEXT NOT NULL,
  inference_json TEXT NOT NULL,
  expectation_json TEXT NOT NULL,
  oracle_status TEXT NOT NULL CHECK(oracle_status IN ('accredited','missing_oracle','confirmed_by_qa')),
  risk_level TEXT NOT NULL CHECK(risk_level IN ('low','medium','high','critical')) DEFAULT 'medium',
  risk_decision TEXT NOT NULL CHECK(risk_decision IN ('not_required','pending','accepted_by_qa','rejected')) DEFAULT 'not_required',
  steps_json TEXT NOT NULL,
  conformity_status TEXT NOT NULL CHECK(conformity_status IN ('pending_oracle','proposed','approved','rejected','pass','fail','not_run','technical_error','human_accepted')),
  confirmation_digest TEXT,
  confirmed_by TEXT,
  confirmed_at TEXT,
  campaign_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_service_cases_project_mod ON service_test_cases(project_id, module_key, version);

CREATE TABLE IF NOT EXISTS execution_attempts (
  attempt_id TEXT PRIMARY KEY,
  execution_id TEXT NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
  module_id TEXT NOT NULL REFERENCES modules(module_id) ON DELETE CASCADE,
  module_key TEXT NOT NULL,
  env_id TEXT NOT NULL,
  profile_id TEXT,
  status TEXT NOT NULL CHECK(status IN ('prepared','running','completed','partial','technical_error','blocked','aborted')),
  case_ids_json TEXT NOT NULL,
  case_versions_json TEXT NOT NULL,
  requirement_revisions_json TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  error_code TEXT,
  error_message TEXT,
  raw_execution_path TEXT,
  trace_path TEXT,
  result_digest TEXT
);

CREATE INDEX IF NOT EXISTS idx_exec_attempts_project_mod ON execution_attempts(project_id, module_key, started_at DESC);

CREATE TABLE IF NOT EXISTS execution_case_results (
  result_row_id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL REFERENCES execution_attempts(attempt_id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
  module_key TEXT NOT NULL,
  requirement_id TEXT,
  requirement_revision INTEGER NOT NULL DEFAULT 1,
  case_id TEXT NOT NULL,
  case_version INTEGER NOT NULL DEFAULT 1,
  verdict TEXT NOT NULL CHECK(verdict IN ('PASS','FAIL','not_run','technical_error','human_accepted')),
  human_acceptance_reason TEXT,
  human_accepted_by TEXT,
  human_accepted_at TEXT,
  step_results_json TEXT NOT NULL,
  evidence_refs_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_exec_case_results_attempt ON execution_case_results(attempt_id, case_id);

CREATE TABLE IF NOT EXISTS report_publications (
  publication_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  campaign_id TEXT,
  attempt_id TEXT,
  execution_id TEXT NOT NULL,
  module_key TEXT NOT NULL,
  requested_formats_json TEXT NOT NULL,
  published_formats_json TEXT NOT NULL,
  failed_format TEXT,
  status TEXT NOT NULL CHECK(status IN ('partial','completed')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_report_publications_project_exec ON report_publications(project_id, execution_id, updated_at DESC);
`;

export class AppServiceSqliteStore {
  readonly db: DatabaseSync;
  readonly dbPath: string;
  private closed = false;

  constructor(dbPath: string) {
    const preflight = checkSqliteFts5Capability();
    if (!preflight.supported) {
      throw new Error(preflight.error ?? 'SQLite FTS5 capability unavailable');
    }
    this.dbPath = assertSafeHostPath(dbPath);
    ensurePrivateDir(dirname(this.dbPath));
    this.db = openSqliteDatabase(this.dbPath);
    this.db.exec('PRAGMA journal_mode = WAL;');
    this.db.exec('PRAGMA synchronous = NORMAL;');
    this.db.exec('PRAGMA foreign_keys = ON;');
    this.db.exec('PRAGMA busy_timeout = 5000;');
    this.migrate();
  }

  private applySchemaStep(version: number, sql: string): void {
    const checksum = createHash('sha256').update(sql).digest('hex');
    this.db.exec(sql);
    const existing = this.db
      .prepare('SELECT version, checksum FROM app_schema_migrations WHERE version = ?')
      .get(version) as { version: number; checksum: string } | undefined;
    if (!existing) {
      this.db
        .prepare('INSERT INTO app_schema_migrations (version, applied_at, checksum) VALUES (?, ?, ?)')
        .run(version, new Date().toISOString(), checksum);
    } else if (existing.checksum !== checksum) {
      throw new Error(`Incompatible application service SQLite schema checksum (v${version})`);
    }
  }

  private migrate(): void {
    this.transaction('IMMEDIATE', () => {
      this.applySchemaStep(1, SCHEMA_SQL);
      this.applySchemaStep(2, SCHEMA_V2_SQL);
      this.applySchemaStep(3, SCHEMA_V3_SQL);
    });
  }

  transaction<T>(mode: 'DEFERRED' | 'IMMEDIATE', fn: () => T): T {
    if (this.closed) {
      throw new Error('Application service SQLite store is closed');
    }
    this.db.exec(`BEGIN ${mode}`);
    try {
      const result = fn();
      this.db.exec('COMMIT');
      return result;
    } catch (error) {
      try {
        this.db.exec('ROLLBACK');
      } catch {
        // Preserve original failure
      }
      throw error;
    }
  }

  run(sql: string, ...params: SQLInputValue[]): { changes: number | bigint; lastInsertRowid: number | bigint } {
    return this.db.prepare(sql).run(...params);
  }

  get<T = Record<string, unknown>>(sql: string, ...params: SQLInputValue[]): T | undefined {
    return this.db.prepare(sql).get(...params) as T | undefined;
  }

  all<T = Record<string, unknown>>(sql: string, ...params: SQLInputValue[]): T[] {
    return this.db.prepare(sql).all(...params) as T[];
  }

  integrityCheck(): boolean {
    if (!existsSync(this.dbPath)) return false;
    const row = this.db.prepare('PRAGMA integrity_check').get() as { integrity_check?: string } | undefined;
    const fk = this.db.prepare('PRAGMA foreign_key_check').all();
    return row?.integrity_check === 'ok' && fk.length === 0;
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    this.db.close();
  }
}
