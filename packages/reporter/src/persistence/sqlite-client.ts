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

export type DatabaseSyncConstructor = new (path: string) => DatabaseSyncInstance;

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

  constructor(runtimeDir: string, memoryOnly = false) {
    this.runtimeDir = runtimeDir;
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
    // 1. Escritura en filesystem si no es solo memoria
    if (this.dbPath !== ':memory:') {
      const runDir = path.join(this.runtimeDir, 'runs', run.runId);
      const artifactsDir = path.join(runDir, 'artifacts');
      if (!fs.existsSync(artifactsDir)) {
        fs.mkdirSync(artifactsDir, { recursive: true });
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
  }

  getRunRow(runId: string): RunRow | undefined {
    const stmt = this.db.prepare('SELECT * FROM runs WHERE run_id = ?;');
    return stmt.get(runId) as RunRow | undefined;
  }

  getRun(runId: string): RunRecord | null {
    // Si existe en disco, priorizamos run.json para datos completos con aserciones
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

    const row = this.getRunRow(runId);
    if (!row) {
      return null;
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
      if (entry.isDirectory()) {
        const jsonPath = path.join(runsBaseDir, entry.name, 'run.json');
        if (fs.existsSync(jsonPath)) {
          try {
            const run = JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) as RunRecord;
            this.saveRun(run);
            count++;
          } catch {
            // Ignorar archivos corruptos individuales
          }
        }
      }
    }

    return count;
  }

  close(): void {
    this.db.close();
  }
}
