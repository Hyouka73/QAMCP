import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

import type { RunFilterOptions, RunRecord } from '../types.js';

export interface DatabaseStatement {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  run(...params: any[]): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(...params: any[]): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  all(...params: any[]): any[];
}

export interface DatabaseSyncInstance {
  exec(sql: string): void;
  prepare(sql: string): DatabaseStatement;
  close(): void;
}

export type DatabaseSyncConstructor = new (path: string, options?: { readOnly?: boolean }) => DatabaseSyncInstance;

interface NodeSqliteModule {
  DatabaseSync: DatabaseSyncConstructor;
}

const require = createRequire(import.meta.url);
const sqliteModule = require('node:sqlite') as unknown as NodeSqliteModule;
const DatabaseSync = sqliteModule.DatabaseSync;

export const SCHEMA_DDL = `
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS runs (
  run_id TEXT PRIMARY KEY,
  flow_id TEXT,
  started_at TEXT NOT NULL,
  finished_at TEXT NOT NULL,
  overall_status TEXT NOT NULL CHECK (overall_status IN ('passed','failed','partial')),
  total_duration_ms INTEGER NOT NULL,
  git_commit TEXT,
  git_branch TEXT,
  total_disk_usage_bytes INTEGER NOT NULL DEFAULT 0,
  pinned INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_runs_flow ON runs(flow_id);
CREATE INDEX IF NOT EXISTS idx_runs_status ON runs(overall_status);
CREATE INDEX IF NOT EXISTS idx_runs_started ON runs(started_at);

CREATE TABLE IF NOT EXISTS step_results (
  run_id TEXT NOT NULL REFERENCES runs(run_id) ON DELETE CASCADE,
  step_index INTEGER NOT NULL,
  capability_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('passed','failed','blocked','skipped')),
  duration_ms INTEGER NOT NULL,
  screenshot_file TEXT,
  PRIMARY KEY (run_id, step_index)
);

CREATE INDEX IF NOT EXISTS idx_steps_capability ON step_results(capability_id);
`;

const ALLOWED_RUN_KEYS = new Set([
  'runId',
  'flowId',
  'startedAt',
  'finishedAt',
  'totalDurationMs',
  'overallStatus',
  'environment',
  'steps',
  'artifacts',
  'lifecycle',
  'summary',
]);
const ALLOWED_ENV_KEYS = new Set(['gitCommit', 'gitBranch', 'hostOs', 'runnerFramework']);
const ALLOWED_LIFECYCLE_KEYS = new Set(['pinned', 'createdAt', 'expiresAt']);
const ALLOWED_ARTIFACTS_KEYS = new Set([
  'totalDiskUsageBytes',
  'screenshots',
  'video',
  'trace',
  'videoFile',
  'traceFile',
]);
const ALLOWED_STEP_KEYS = new Set([
  'stepIndex',
  'capabilityId',
  'status',
  'durationMs',
  'timestamp',
  'assertions',
  'error',
  'screenshotFile',
]);
const ALLOWED_SUMMARY_KEYS = new Set(['totalCases', 'passed', 'failed', 'skipped']);
const VALID_OVERALL_STATUS = new Set(['passed', 'failed', 'partial']);
const VALID_STEP_STATUS = new Set(['passed', 'failed', 'blocked', 'skipped']);
const SAFE_RUN_DIR_RE = /^[a-zA-Z0-9_-][a-zA-Z0-9._-]*$/;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasOnlyAllowedKeys(obj: Record<string, unknown>, allowed: ReadonlySet<string>): boolean {
  for (const key of Object.keys(obj)) {
    if (!allowed.has(key)) return false;
  }
  return true;
}

function isValidIsoDate(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && Number.isFinite(Date.parse(value));
}

function isNonNegativeSafeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function hasProvisionalRef(value: string): boolean {
  return value.includes('qap-provisional-');
}

function isValidRunRecordStructure(
  raw: unknown,
  expectedRunId: string,
  requireHistoricalProvenance: boolean,
): raw is RunRecord & { summary?: Record<string, unknown> } {
  if (!isPlainObject(raw) || !hasOnlyAllowedKeys(raw, ALLOWED_RUN_KEYS)) return false;
  if (raw.runId !== expectedRunId) return false;
  if (raw.flowId !== undefined && (typeof raw.flowId !== 'string' || raw.flowId.trim().length === 0)) return false;
  if (!isValidIsoDate(raw.startedAt) || !isValidIsoDate(raw.finishedAt)) return false;
  if (Date.parse(raw.finishedAt) < Date.parse(raw.startedAt)) return false;
  if (typeof raw.totalDurationMs !== 'number' || !Number.isFinite(raw.totalDurationMs) || raw.totalDurationMs < 0) {
    return false;
  }
  if (typeof raw.overallStatus !== 'string' || !VALID_OVERALL_STATUS.has(raw.overallStatus)) return false;

  if (!isPlainObject(raw.environment) || !hasOnlyAllowedKeys(raw.environment, ALLOWED_ENV_KEYS)) return false;
  for (const key of ALLOWED_ENV_KEYS) {
    if (typeof raw.environment[key] !== 'string') return false;
  }

  if (!isPlainObject(raw.lifecycle) || !hasOnlyAllowedKeys(raw.lifecycle, ALLOWED_LIFECYCLE_KEYS)) return false;
  if (typeof raw.lifecycle.pinned !== 'boolean') return false;
  if (!isValidIsoDate(raw.lifecycle.createdAt)) return false;
  if (raw.lifecycle.expiresAt !== undefined && !isValidIsoDate(raw.lifecycle.expiresAt)) return false;

  if (!isPlainObject(raw.artifacts) || !hasOnlyAllowedKeys(raw.artifacts, ALLOWED_ARTIFACTS_KEYS)) return false;
  if (
    typeof raw.artifacts.totalDiskUsageBytes !== 'number' ||
    !Number.isFinite(raw.artifacts.totalDiskUsageBytes) ||
    raw.artifacts.totalDiskUsageBytes < 0
  ) {
    return false;
  }
  if (!Array.isArray(raw.artifacts.screenshots)) return false;
  for (const shot of raw.artifacts.screenshots) {
    if (typeof shot === 'string') {
      if (shot.trim().length === 0 || (requireHistoricalProvenance && hasProvisionalRef(shot))) return false;
    } else if (isPlainObject(shot)) {
      if (
        !isNonNegativeSafeInteger(shot.stepIndex) ||
        typeof shot.filename !== 'string' ||
        shot.filename.trim().length === 0 ||
        (requireHistoricalProvenance && hasProvisionalRef(shot.filename)) ||
        typeof shot.sizeBytes !== 'number' ||
        !Number.isFinite(shot.sizeBytes) ||
        shot.sizeBytes < 0
      ) {
        return false;
      }
    } else {
      return false;
    }
  }
  if (raw.artifacts.videoFile !== undefined) {
    if (
      typeof raw.artifacts.videoFile !== 'string' ||
      raw.artifacts.videoFile.trim().length === 0 ||
      (requireHistoricalProvenance && hasProvisionalRef(raw.artifacts.videoFile))
    ) {
      return false;
    }
  }
  if (raw.artifacts.traceFile !== undefined) {
    if (
      typeof raw.artifacts.traceFile !== 'string' ||
      raw.artifacts.traceFile.trim().length === 0 ||
      (requireHistoricalProvenance && hasProvisionalRef(raw.artifacts.traceFile))
    ) {
      return false;
    }
  }
  if (raw.artifacts.video !== undefined) {
    if (
      !isPlainObject(raw.artifacts.video) ||
      typeof raw.artifacts.video.filename !== 'string' ||
      raw.artifacts.video.filename.trim().length === 0 ||
      (requireHistoricalProvenance && hasProvisionalRef(raw.artifacts.video.filename))
    ) {
      return false;
    }
  }
  if (raw.artifacts.trace !== undefined) {
    if (
      !isPlainObject(raw.artifacts.trace) ||
      typeof raw.artifacts.trace.filename !== 'string' ||
      raw.artifacts.trace.filename.trim().length === 0 ||
      (requireHistoricalProvenance && hasProvisionalRef(raw.artifacts.trace.filename))
    ) {
      return false;
    }
  }

  if (!Array.isArray(raw.steps)) return false;
  for (const step of raw.steps) {
    if (!isPlainObject(step) || !hasOnlyAllowedKeys(step, ALLOWED_STEP_KEYS)) return false;
    if (!isNonNegativeSafeInteger(step.stepIndex)) return false;
    if (typeof step.capabilityId !== 'string' || step.capabilityId.trim().length === 0) return false;
    if (typeof step.status !== 'string' || !VALID_STEP_STATUS.has(step.status)) return false;
    if (typeof step.durationMs !== 'number' || !Number.isFinite(step.durationMs) || step.durationMs < 0) return false;
    if (!isValidIsoDate(step.timestamp)) return false;
    if (!Array.isArray(step.assertions)) return false;
    if (step.screenshotFile !== undefined) {
      if (
        typeof step.screenshotFile !== 'string' ||
        step.screenshotFile.trim().length === 0 ||
        (requireHistoricalProvenance && hasProvisionalRef(step.screenshotFile))
      ) {
        return false;
      }
    }
  }

  if (raw.summary !== undefined) {
    if (!isPlainObject(raw.summary) || !hasOnlyAllowedKeys(raw.summary, ALLOWED_SUMMARY_KEYS)) return false;
    for (const key of ALLOWED_SUMMARY_KEYS) {
      if (!isNonNegativeSafeInteger(raw.summary[key])) return false;
    }
  }

  return true;
}

function isValidHistoricalRunBackup(raw: unknown, expectedRunId: string, runDir: string): raw is RunRecord {
  if (!isValidRunRecordStructure(raw, expectedRunId, true)) return false;

  const artifactsDir = path.join(runDir, 'artifacts');
  if (!fs.existsSync(artifactsDir)) return false;
  const artifactsStat = fs.lstatSync(artifactsDir);
  if (artifactsStat.isSymbolicLink() || !artifactsStat.isDirectory()) return false;

  const timelinePath = path.join(artifactsDir, 'timeline.json');
  const hasTimeline = fs.existsSync(timelinePath);
  if (raw.summary !== undefined || hasTimeline) {
    if (!hasTimeline) return false;
    const timelineStat = fs.lstatSync(timelinePath);
    if (timelineStat.isSymbolicLink() || !timelineStat.isFile()) return false;
    let parsedTimeline: unknown;
    try {
      parsedTimeline = JSON.parse(fs.readFileSync(timelinePath, 'utf-8'));
    } catch {
      return false;
    }
    if (!isPlainObject(parsedTimeline)) return false;
    if (parsedTimeline._version !== '1') return false;
    if (parsedTimeline.run_id !== expectedRunId) return false;
    if (typeof raw.flowId !== 'string' || parsedTimeline.module !== raw.flowId) return false;
    if (!Array.isArray(parsedTimeline.steps) || parsedTimeline.steps.length !== raw.steps.length) return false;
  }

  return true;
}

export interface RunRow {
  run_id: string;
  flow_id: string | null;
  started_at: string;
  finished_at: string;
  overall_status: 'passed' | 'failed' | 'partial';
  total_duration_ms: number;
  git_commit: string | null;
  git_branch: string | null;
  total_disk_usage_bytes: number;
  pinned: number;
  expires_at: string | null;
}


export class QapDatabase {
  private db: DatabaseSyncInstance;
  private runtimeDir: string;
  private dbPath: string;
  private readonly auditReadOnly: boolean;

  constructor(runtimeDir: string, memoryOnly = false, options: { readOnly?: boolean } = {}) {
    this.runtimeDir = runtimeDir;
    this.auditReadOnly = Boolean(options.readOnly);
    if (options.readOnly) {
      if (memoryOnly) throw new Error('A read-only database cannot be memory-only.');
      this.dbPath = path.join(runtimeDir, 'qap.sqlite');
      // No mkdir, DDL, migration or journal-mode PRAGMA in audit mode.
      this.db = new DatabaseSync(this.dbPath, { readOnly: true });
      return;
    }
    if (memoryOnly) {
      this.dbPath = ':memory:';
      this.db = new DatabaseSync(':memory:');
    } else {
      if (!fs.existsSync(runtimeDir)) {
        fs.mkdirSync(runtimeDir, { recursive: true });
      }
      this.dbPath = path.join(runtimeDir, 'qap.sqlite');
      this.db = new DatabaseSync(this.dbPath);
    }

    this.init();
  }

  private init(): void {
    this.db.exec('PRAGMA foreign_keys = ON;');
    this.db.exec(SCHEMA_DDL);
  }

  getDbPath(): string {
    return this.dbPath;
  }

  /**
   * Persistencia dual: guarda primero en run.json y luego en SQLite bajo transacción.
   */
  saveRun(run: RunRecord): void {
    this.assertWritable();
    // 1. Escritura en filesystem si no es solo memoria
    let pendingPath: string | null = null;
    let receiptPath: string | null = null;
    let createdPending = false;
    if (this.dbPath !== ':memory:') {
      const runDir = path.join(this.runtimeDir, 'runs', run.runId);
      const artifactsDir = path.join(runDir, 'artifacts');
      if (!fs.existsSync(artifactsDir)) {
        fs.mkdirSync(artifactsDir, { recursive: true });
      }
      receiptPath = path.join(runDir, '.qap-committed');
      pendingPath = path.join(runDir, '.qap-publication-pending');
      if (!this.getRunRow(run.runId) && !fs.existsSync(receiptPath) && !fs.existsSync(pendingPath)) {
        try {
          const pid = (globalThis as unknown as { process?: { pid?: number } }).process?.pid ?? 0;
          fs.writeFileSync(
            pendingPath,
            JSON.stringify({ runId: run.runId, pid }),
            { flag: 'wx', mode: 0o600, flush: true },
          );
          createdPending = true;
        } catch (err) {
          if ((err as { code?: string } | null)?.code !== 'EEXIST') throw err;
        }
      }
      const jsonPath = path.join(runDir, 'run.json');
      fs.writeFileSync(jsonPath, JSON.stringify(run, null, 2), 'utf-8');
    }

    // 2. Transacción SQLite atómica
    this.db.exec('BEGIN IMMEDIATE TRANSACTION;');
    try {
      const insertRunStmt = this.db.prepare(`
        INSERT INTO runs (
          run_id, flow_id, started_at, finished_at, overall_status,
          total_duration_ms, git_commit, git_branch,
          total_disk_usage_bytes, pinned, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(run_id) DO UPDATE SET
          flow_id = excluded.flow_id,
          started_at = excluded.started_at,
          finished_at = excluded.finished_at,
          overall_status = excluded.overall_status,
          total_duration_ms = excluded.total_duration_ms,
          git_commit = excluded.git_commit,
          git_branch = excluded.git_branch,
          total_disk_usage_bytes = excluded.total_disk_usage_bytes,
          pinned = excluded.pinned,
          expires_at = excluded.expires_at;
      `);

      insertRunStmt.run(
        run.runId,
        run.flowId ?? null,
        run.startedAt,
        run.finishedAt,
        run.overallStatus,
        run.totalDurationMs,
        run.environment.gitCommit ?? null,
        run.environment.gitBranch ?? null,
        run.artifacts.totalDiskUsageBytes ?? 0,
        run.lifecycle.pinned ? 1 : 0,
        run.lifecycle.expiresAt ?? null
      );

      // Eliminar pasos anteriores si ya existían para re-inserción limpia
      const deleteStepsStmt = this.db.prepare('DELETE FROM step_results WHERE run_id = ?;');
      deleteStepsStmt.run(run.runId);

      const insertStepStmt = this.db.prepare(`
        INSERT INTO step_results (run_id, step_index, capability_id, status, duration_ms, screenshot_file)
        VALUES (?, ?, ?, ?, ?, ?);
      `);

      for (const step of run.steps) {
        insertStepStmt.run(
          run.runId,
          step.stepIndex,
          step.capabilityId,
          step.status,
          step.durationMs,
          step.screenshotFile ?? null
        );
      }

      this.db.exec('COMMIT;');
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
    if (this.dbPath !== ':memory:') {
      try {
        if (receiptPath) {
          fs.writeFileSync(receiptPath, '1', { mode: 0o600 });
        }
      } catch {
        // Best-effort post-commit receipt; SQLite transaction is already committed.
      }
      if (createdPending && pendingPath) {
        try {
          fs.rmSync(pendingPath, { force: true });
        } catch {
          // Best-effort cleanup
        }
      }
    }
  }

  getRunRow(runId: string): RunRow | undefined {
    const stmt = this.db.prepare('SELECT * FROM runs WHERE run_id = ?;');
    return stmt.get(runId) as RunRow | undefined;
  }

  getRun(runId: string): RunRecord | null {
    const row = this.getRunRow(runId);
    if (!row) return null;
    // JSON enriches a committed SQLite row; it is never proof of publication.
    if (this.dbPath !== ':memory:') {
      const jsonPath = path.join(this.runtimeDir, 'runs', runId, 'run.json');
      if (fs.existsSync(jsonPath)) {
        try {
          return JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) as RunRecord;
        } catch {
          // Si hubo error al leer JSON, caemos a reconstrucción desde DB
        }
      }
    }

    const stepsStmt = this.db.prepare(
      'SELECT * FROM step_results WHERE run_id = ? ORDER BY step_index ASC;'
    );
    const stepRows = stepsStmt.all(runId) as Array<{
      step_index: number;
      capability_id: string;
      status: 'passed' | 'failed' | 'blocked' | 'skipped';
      duration_ms: number;
      screenshot_file: string | null;
    }>;

    return {
      runId: row.run_id,
      flowId: row.flow_id ?? undefined,
      startedAt: row.started_at,
      finishedAt: row.finished_at,
      totalDurationMs: row.total_duration_ms,
      overallStatus: row.overall_status,
      environment: {
        gitCommit: row.git_commit ?? '',
        gitBranch: row.git_branch ?? '',
        hostOs: '',
        runnerFramework: '',
      },
      steps: stepRows.map((s) => ({
        stepIndex: s.step_index,
        capabilityId: s.capability_id,
        status: s.status,
        durationMs: s.duration_ms,
        timestamp: row.started_at,
        assertions: [],
        screenshotFile: s.screenshot_file ?? undefined,
      })),
      artifacts: {
        totalDiskUsageBytes: row.total_disk_usage_bytes,
        screenshots: [],
      },
      lifecycle: {
        pinned: row.pinned === 1,
        createdAt: row.started_at,
        expiresAt: row.expires_at ?? undefined,
      },
    };
  }

  listRuns(filters: RunFilterOptions = {}): RunRow[] {
    let sql = 'SELECT * FROM runs WHERE 1=1';
    const params: (string | number | bigint | null | Uint8Array)[] = [];

    if (filters.flowId) {
      sql += ' AND flow_id = ?';
      params.push(filters.flowId);
    }

    if (filters.status) {
      sql += ' AND overall_status = ?';
      params.push(filters.status);
    }

    sql += ' ORDER BY started_at DESC';

    if (typeof filters.limit === 'number') {
      sql += ' LIMIT ?';
      params.push(filters.limit);
      if (typeof filters.offset === 'number') {
        sql += ' OFFSET ?';
        params.push(filters.offset);
      }
    }

    const stmt = this.db.prepare(sql);
    return stmt.all(...params) as RunRow[];
  }

  deleteRun(runId: string): boolean {
    this.assertWritable();
    const row = this.getRunRow(runId);
    const runDir = path.join(this.runtimeDir, 'runs', runId);
    const dirExists = this.dbPath !== ':memory:' && fs.existsSync(runDir);

    if (!row && !dirExists) {
      return false;
    }

    this.db.exec('BEGIN IMMEDIATE TRANSACTION;');
    try {
      this.db.prepare('DELETE FROM runs WHERE run_id = ?;').run(runId);
      this.db.exec('COMMIT;');
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }

    if (dirExists) {
      fs.rmSync(runDir, { recursive: true, force: true });
    }

    return true;
  }

  pinRun(runId: string, pinned: boolean): boolean {
    this.assertWritable();
    const row = this.getRunRow(runId);
    if (!row) {
      return false;
    }

    const stmt = this.db.prepare('UPDATE runs SET pinned = ? WHERE run_id = ?;');
    stmt.run(pinned ? 1 : 0, runId);

    // Actualizar también en run.json para mantener persistencia dual sincronizada
    if (this.dbPath !== ':memory:') {
      const jsonPath = path.join(this.runtimeDir, 'runs', runId, 'run.json');
      if (fs.existsSync(jsonPath)) {
        try {
          const run = JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) as RunRecord;
          run.lifecycle.pinned = pinned;
          fs.writeFileSync(jsonPath, JSON.stringify(run, null, 2), 'utf-8');
        } catch {
          // Continuar
        }
      }
    }

    return true;
  }

  /**
   * Reconstruye íntegramente la base de datos qap.sqlite escaneando los archivos run.json.
   * Regla 10: run.json como respaldo reconstruible.
   */
  reindex(): number {
    this.assertWritable();
    if (this.dbPath === ':memory:') {
      return 0;
    }

    const runsBaseDir = path.join(this.runtimeDir, 'runs');
    if (!fs.existsSync(runsBaseDir)) {
      return 0;
    }

    const runDirs = fs.readdirSync(runsBaseDir, { withFileTypes: true });
    let count = 0;

    for (const entry of runDirs) {
      if (
        !entry.isDirectory() ||
        entry.isSymbolicLink() ||
        entry.name.startsWith('.') ||
        entry.name === '..' ||
        !SAFE_RUN_DIR_RE.test(entry.name)
      ) {
        continue;
      }

      const runDir = path.join(runsBaseDir, entry.name);
      try {
        if (fs.lstatSync(runDir).isSymbolicLink()) continue;
        const pendingPath = path.join(runDir, '.qap-publication-pending');
        const videoTmpPath = path.join(runDir, 'video-tmp');
        if (fs.existsSync(pendingPath) || fs.existsSync(videoTmpPath)) continue;

        const jsonPath = path.join(runDir, 'run.json');
        if (!fs.existsSync(jsonPath)) continue;
        const jsonStat = fs.lstatSync(jsonPath);
        if (jsonStat.isSymbolicLink() || !jsonStat.isFile()) continue;

        const receiptPath = path.join(runDir, '.qap-committed');
        const hasReceipt = fs.existsSync(receiptPath) && !fs.lstatSync(receiptPath).isSymbolicLink();
        const hasSqlRow = Boolean(this.getRunRow(entry.name));

        const parsed: unknown = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        if (hasReceipt || hasSqlRow) {
          if (!isValidRunRecordStructure(parsed, entry.name, false)) continue;
        } else {
          if (!isValidHistoricalRunBackup(parsed, entry.name, runDir)) continue;
        }

        this.saveRun(parsed);
        count++;
      } catch {
        // Ignorar archivos corruptos individuales o ambiguos
      }
    }

    return count;
  }

  private assertWritable(): void {
    if (this.auditReadOnly) throw new Error('Read-only audit database cannot be modified.');
  }

  close(): void {
    this.db.close();
  }
}
