import { spawnSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { KnowledgeStoreError } from '@qap/engine';
import { checkSqliteFts5Capability, SqliteKnowledgeAdapter } from '@qap/knowledge';
import { afterEach, describe, expect, it } from 'vitest';

import { logTechnicalDiagnostic } from '../technical-diagnostics.js';
import { WorkspaceBootstrap } from '../workspace-bootstrap.js';

const REPO_ROOT = resolve(__dirname, '../../../..');

describe('Milestone M1 Adversarial Challenger: SQLite Preflight, Corruption & Recovery', () => {
  const tempDirs: string[] = [];
  const closers: Array<() => void | Promise<void>> = [];

  const createTemp = (prefix: string): string => {
    const dir = mkdtempSync(join(tmpdir(), `qap-challenger-${prefix}-`));
    tempDirs.push(dir);
    return dir;
  };

  afterEach(async () => {
    for (const close of closers.splice(0).reverse()) {
      try { await close(); } catch { /* ignore */ }
    }
    for (const dir of tempDirs.splice(0)) {
      try { rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ }
    }
  });

  // =========================================================================
  // 1. FTS5 Preflight and Environment Simulation
  // =========================================================================
  describe('1. FTS5 Preflight & Environment Simulation', () => {
    it('1.1 verifies native runtime FTS5 capability check runs purely in-memory', () => {
      const res = checkSqliteFts5Capability();
      expect(res.supported).toBe(true);
      expect(res.nodeVersion).toBe(process.version);
      expect(typeof res.nodeExecutable).toBe('string');
      expect(res.nodeExecutable.length).toBeGreaterThan(0);
      expect(res.error).toBeUndefined();
    });

    it('1.2 simulates missing FTS5 runtime: confirms UNAVAILABLE error and ZERO files created on disk', () => {
      const simScript = `
        const Module = require('node:module');
        const orig = Module.prototype.require;
        Module.prototype.require = function(id) {
          if (id === 'node:sqlite' || id === 'sqlite') {
            const real = orig.call(this, id);
            class MockDb extends real.DatabaseSync {
              constructor(p, opts) {
                if (opts !== undefined) super(p, opts);
                else super(p);
              }
              prepare(sql) {
                if (sql.includes('ENABLE_FTS5')) {
                  return { get: () => ({ enabled: 0 }) };
                }
                return super.prepare(sql);
              }
            }
            return { ...real, DatabaseSync: MockDb };
          }
          return orig.call(this, id);
        };

        const fs = require('node:fs');
        const path = require('node:path');
        const os = require('node:os');
        const { checkSqliteFts5Capability, SqliteKnowledgeAdapter } = require('./packages/knowledge/dist/index.js');

        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qap-fts5-sim-'));
        const dbPath = path.join(tmpDir, 'never_created.sqlite');

        try {
          const preflight = checkSqliteFts5Capability();
          if (preflight.supported !== false) {
            process.exit(10);
          }
          if (!preflight.error || !preflight.error.includes('lacks SQLite ENABLE_FTS5 support')) {
            process.exit(11);
          }

          let threw = false;
          try {
            new SqliteKnowledgeAdapter(dbPath);
          } catch (err) {
            threw = true;
            if (err.name !== 'KnowledgeStoreError' || err.code !== 'UNAVAILABLE') {
              process.exit(12);
            }
          }

          if (!threw) process.exit(13);

          // Assert NO file was created on disk
          if (fs.existsSync(dbPath)) process.exit(14);
          if (fs.existsSync(dbPath + '-wal')) process.exit(15);
          if (fs.existsSync(dbPath + '-shm')) process.exit(16);

          process.stdout.write(JSON.stringify({ success: true }));
          process.exit(0);
        } finally {
          fs.rmSync(tmpDir, { recursive: true, force: true });
        }
      `;

      const child = spawnSync(process.execPath, ['-e', simScript], {
        cwd: REPO_ROOT,
        encoding: 'utf8',
      });
      if (child.status !== 0) {
        console.error('Child 1.2 failed stderr:', child.stderr, 'stdout:', child.stdout);
      }
      expect(child.status).toBe(0);
      expect(child.stdout).toContain('"success":true');
    });

    it('1.3 simulates native node:sqlite initialization crash: handles gracefully without leaking', () => {
      const crashScript = `
        const Module = require('node:module');
        const orig = Module.prototype.require;
        Module.prototype.require = function(id) {
          if (id === 'node:sqlite' || id === 'sqlite') {
            const real = orig.call(this, id);
            class BrokenDb {
              constructor() {
                throw new Error('Fatal native sqlite3_open library load crash');
              }
            }
            return { ...real, DatabaseSync: BrokenDb };
          }
          return orig.call(this, id);
        };

        const fs = require('node:fs');
        const path = require('node:path');
        const os = require('node:os');
        const { checkSqliteFts5Capability, SqliteKnowledgeAdapter } = require('./packages/knowledge/dist/index.js');

        const preflight = checkSqliteFts5Capability();
        if (preflight.supported !== false) process.exit(20);
        if (!preflight.error.includes('Fatal native sqlite3_open library load crash')) process.exit(21);

        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qap-crash-sim-'));
        const testPath = path.join(tmpDir, 'unallocated.sqlite');

        let threw = false;
        try {
          new SqliteKnowledgeAdapter(testPath);
        } catch (err) {
          threw = true;
          if (err.code !== 'UNAVAILABLE') process.exit(22);
        }

        if (!threw) process.exit(23);
        if (fs.existsSync(testPath)) process.exit(24);

        fs.rmSync(tmpDir, { recursive: true, force: true });
        process.stdout.write(JSON.stringify({ success: true }));
        process.exit(0);
      `;

      const child = spawnSync(process.execPath, ['-e', crashScript], {
        cwd: REPO_ROOT,
        encoding: 'utf8',
      });
      if (child.status !== 0) {
        console.error('Child 1.3 failed stderr:', child.stderr, 'stdout:', child.stdout);
      }
      expect(child.status).toBe(0);
      expect(child.stdout).toContain('"success":true');
    });
  });

  // =========================================================================
  // 2. Corrupt and 0-Byte SQLite Database Scenarios
  // =========================================================================
  describe('2. Corrupt and 0-Byte SQLite Database Scenarios', () => {
    it('2.1 auto-recovers abandoned 0-byte database file and sidecars in SqliteKnowledgeAdapter', async () => {
      const dir = createTemp('0byte-adapter');
      const dbPath = join(dir, 'abandoned.sqlite');

      // Seed 0-byte file and 0-byte sidecars
      writeFileSync(dbPath, Buffer.alloc(0));
      writeFileSync(dbPath + '-wal', Buffer.alloc(0));
      writeFileSync(dbPath + '-shm', Buffer.alloc(0));
      expect(existsSync(dbPath)).toBe(true);
      expect(statSync(dbPath).size).toBe(0);

      // Instantiating adapter must clean 0-byte file and create healthy schema v2
      const adapter = new SqliteKnowledgeAdapter(dbPath);
      closers.push(() => adapter.close());

      expect(adapter.schema_version).toBe(2);
      const newSize = statSync(dbPath).size;
      expect(newSize).toBeGreaterThan(0);

      // Verify full read/write operational capability on recovered DB
      const appId = 'app-recovered-0byte';
      const trace = {
        source: 'test_recovery',
        recorded_by: 'challenger',
        recorded_at: new Date().toISOString(),
        reason: 'Empirical verification of 0-byte recovery',
        review: 'unreviewed' as const,
        evidence_refs: [],
      };
      await adapter.commit(appId, [
        {
          kind: 'application',
          expected_revision: 0,
          trace,
          entity: {
            application_id: appId,
            name: 'RecoveredApp',
            base_url: 'http://localhost:3000',
            created_at: new Date().toISOString(),
          },
        },
      ]);

      const record = await adapter.get(appId, 'application', appId);
      expect(record).toBeDefined();
      expect(record?.entity.name).toBe('RecoveredApp');
    });

    it('2.2 auto-recovers abandoned 0-byte database in WorkspaceBootstrap.prepare()', async () => {
      const hostDir = createTemp('0byte-host');
      const projDir = createTemp('0byte-proj');

      const key = createHash('sha256').update(process.platform === 'win32' ? projDir.toLowerCase() : projDir).digest('hex');
      const targetHost = join(hostDir, key);
      mkdirSync(targetHost, { recursive: true });
      const dbFile = join(targetHost, 'knowledge.sqlite');
      writeFileSync(dbFile, Buffer.alloc(0));
      writeFileSync(dbFile + '-wal', Buffer.alloc(0));
      expect(statSync(dbFile).size).toBe(0);

      const bootstrap = new WorkspaceBootstrap(hostDir);
      closers.push(() => bootstrap.close());

      const binding = await bootstrap.prepare(projDir, 'http://localhost:3000');
      expect(binding).toBeDefined();
      expect(binding?.store).toBeDefined();
      expect(statSync(dbFile).size).toBeGreaterThan(0);
    });

    it('2.3 throws structured UNAVAILABLE/SCHEMA_MISMATCH on corrupted header and permits clean recovery upon file replacement', () => {
      const dir = createTemp('corrupt-header');
      const dbPath = join(dir, 'corrupt.sqlite');

      // Seed 512 bytes of binary garbage
      writeFileSync(dbPath, Buffer.from('INVALID_SQLITE_HEADER_GARBAGE_PAYLOAD_'.repeat(16)));
      expect(statSync(dbPath).size).toBeGreaterThan(0);

      let threw = false;
      try {
        new SqliteKnowledgeAdapter(dbPath);
      } catch (err) {
        threw = true;
        expect(err).toBeInstanceOf(KnowledgeStoreError);
        // SQLite fails to open non-sqlite header with UNAVAILABLE or SCHEMA_MISMATCH
        expect(['UNAVAILABLE', 'SCHEMA_MISMATCH']).toContain((err as KnowledgeStoreError).code);
      }
      expect(threw).toBe(true);

      // Clean recovery: delete corrupt file, re-instantiate -> clean schema v2
      unlinkSync(dbPath);
      const recovered = new SqliteKnowledgeAdapter(dbPath);
      closers.push(() => recovered.close());
      expect(recovered.schema_version).toBe(2);
      expect(statSync(dbPath).size).toBeGreaterThan(0);
    });

    it('2.4 handles corrupted header in WorkspaceBootstrap.prepare() with structured rejection without poisoning cache', async () => {
      const hostDir = createTemp('corrupt-host');
      const projDir = createTemp('corrupt-proj');

      const key = createHash('sha256').update(process.platform === 'win32' ? projDir.toLowerCase() : projDir).digest('hex');
      const targetHost = join(hostDir, key);
      mkdirSync(targetHost, { recursive: true });
      const dbFile = join(targetHost, 'knowledge.sqlite');
      writeFileSync(dbFile, Buffer.from('NOT_A_VALID_SQLITE_DATABASE_DATA'));

      const bootstrap = new WorkspaceBootstrap(hostDir);
      closers.push(() => bootstrap.close());

      // Attempt 1: must reject cleanly with KnowledgeStoreError
      await expect(bootstrap.prepare(projDir, 'http://localhost:3000')).rejects.toThrow(KnowledgeStoreError);

      // Ensure cache was not poisoned: remove corrupt file, prepare again
      unlinkSync(dbFile);
      const binding = await bootstrap.prepare(projDir, 'http://localhost:3000');
      expect(binding).toBeDefined();
      expect(binding?.store).toBeDefined();
      expect(statSync(dbFile).size).toBeGreaterThan(0);
    });

    it('2.5 handles truncated SQLite header with structured error', () => {
      const dir = createTemp('truncated-header');
      const dbPath = join(dir, 'truncated.sqlite');

      // SQLite magic is "SQLite format 3\0" (16 bytes). Write magic followed by only 10 bytes (valid header is 100 bytes).
      const truncated = Buffer.concat([Buffer.from('SQLite format 3\0'), Buffer.alloc(10, 0x55)]);
      writeFileSync(dbPath, truncated);

      expect(() => new SqliteKnowledgeAdapter(dbPath)).toThrow(KnowledgeStoreError);
    });

    it('2.6 handles locked database cleanly under busy contention and recovers once unlocked', () => {
      const dir = createTemp('locked-db');
      const dbPath = join(dir, 'contended.sqlite');

      // Initialize healthy DB first
      const initial = new SqliteKnowledgeAdapter(dbPath);
      initial.close();

      // Acquire exclusive lock using raw connection
      const locker = new DatabaseSync(dbPath);
      locker.exec('BEGIN EXCLUSIVE');

      // Attempt to open with bounded busy timeout (50ms)
      expect(() => new SqliteKnowledgeAdapter(dbPath, { busy_timeout_ms: 50 })).toThrow(KnowledgeStoreError);

      // Release lock
      locker.exec('ROLLBACK');
      locker.close();

      // Opening now succeeds immediately
      const recovered = new SqliteKnowledgeAdapter(dbPath);
      closers.push(() => recovered.close());
      expect(recovered.schema_version).toBe(2);
    });
  });

  // =========================================================================
  // 3. Physical Workspace Preparation with Repeated Calls
  // =========================================================================
  describe('3. Physical Workspace Preparation Repeated Calls', () => {
    it('3.1 executes 50 sequential prepare() calls: verifies idempotency and exact store instance caching', async () => {
      const hostDir = createTemp('repeat-host');
      const projDir = createTemp('repeat-proj');

      const bootstrap = new WorkspaceBootstrap(hostDir);
      closers.push(() => bootstrap.close());

      const firstBinding = await bootstrap.prepare(projDir, 'http://localhost:3000');
      expect(firstBinding).toBeDefined();

      for (let i = 1; i <= 50; i++) {
        const nextBinding = await bootstrap.prepare(projDir, 'http://localhost:3000');
        expect(nextBinding).toBeDefined();
        // Exact object identity check: store must be reused from cache, not re-allocated
        expect(nextBinding?.store).toBe(firstBinding?.store);
      }

      // Verify store can still commit mutations after 50 calls
      const app = firstBinding!.applicationId;
      const trace = {
        source: 'stress_test',
        recorded_by: 'challenger',
        recorded_at: new Date().toISOString(),
        reason: '50-iteration idempotency verification',
        review: 'unreviewed' as const,
        evidence_refs: [],
      };
      await firstBinding!.store.commit(app, [
        {
          kind: 'environment',
          expected_revision: 1,
          trace,
          entity: {
            application_id: app,
            environment_id: 'local',
            name: 'local',
            base_url: 'http://localhost:3000',
            safe_domains: [],
            is_production: false,
            destructive_actions_allowed: false,
          },
        },
      ]);

      const env = await firstBinding!.store.get(app, 'environment', 'local');
      expect(env?.entity.name).toBe('local');
    });

    it('3.2 executes 20 concurrent prepare() calls on an existing prepared workspace cleanly without conflict', async () => {
      const hostDir = createTemp('concurrent-host');
      const projDir = createTemp('concurrent-proj');

      const bootstrap = new WorkspaceBootstrap(hostDir);
      closers.push(() => bootstrap.close());

      // Pre-initialize workspace with initial prepare call
      const initial = await bootstrap.prepare(projDir, 'http://localhost:3000');
      expect(initial).toBeDefined();

      // Now fire 20 concurrent calls on the established workspace
      const promises = Array.from({ length: 20 }, () => bootstrap.prepare(projDir, 'http://localhost:3000'));
      const results = await Promise.all(promises);

      expect(results).toHaveLength(20);
      const firstStore = results[0]?.store;
      expect(firstStore).toBeDefined();
      expect(results.every(r => r?.store === firstStore)).toBe(true);
    });

    it('3.3 executes parallel prepare() across 5 distinct workspace roots with full isolation', async () => {
      const hostDir = createTemp('multi-host');
      const projDirs = Array.from({ length: 5 }, (_, i) => createTemp(`multi-proj-${i}`));

      const bootstrap = new WorkspaceBootstrap(hostDir);
      closers.push(() => bootstrap.close());

      const bindings = await Promise.all(
        projDirs.map((p, idx) => bootstrap.prepare(p, `http://localhost:${3000 + idx}`))
      );

      expect(bindings).toHaveLength(5);
      const distinctStores = new Set(bindings.map(b => b?.store));
      expect(distinctStores.size).toBe(5);

      const distinctApps = new Set(bindings.map(b => b?.applicationId));
      expect(distinctApps.size).toBe(5);
    });

    it('3.4 preserves customized .qa configuration across repeated prepare calls (wx exclusive write)', async () => {
      const hostDir = createTemp('scaffold-host');
      const projDir = createTemp('scaffold-proj');

      const bootstrap = new WorkspaceBootstrap(hostDir);
      closers.push(() => bootstrap.close());

      // Prepare initial workspace
      await bootstrap.prepare(projDir, 'http://localhost:3000');

      // Modify context.yaml with custom property
      const contextPath = join(projDir, '.qa', 'project', 'context.yaml');
      expect(existsSync(contextPath)).toBe(true);
      const customContent = '_version: "1"\nproject_name: CustomProjectName\ncustom_field: preserved_value\n';
      writeFileSync(contextPath, customContent, 'utf8');

      // Call prepare again
      await bootstrap.prepare(projDir, 'http://localhost:3000');

      // Confirm custom content was preserved and NOT overwritten
      const readBack = readFileSync(contextPath, 'utf8');
      expect(readBack).toBe(customContent);
    });

    it('3.5 documents concurrent prepare() on uninitialized workspace: 1 wins, others receive CONFLICT, DB remains valid', async () => {
      const hostDir = createTemp('uninit-concurrent-host');
      const projDir = createTemp('uninit-concurrent-proj');

      const bootstrap = new WorkspaceBootstrap(hostDir);
      closers.push(() => bootstrap.close());

      // Fire 10 concurrent prepare calls on a FRESH, uninitialized workspace with url
      const promises = Array.from({ length: 10 }, () => bootstrap.prepare(projDir, 'http://localhost:3000'));
      const settled = await Promise.allSettled(promises);

      const fulfilled = settled.filter(s => s.status === 'fulfilled');
      const rejected = settled.filter(s => s.status === 'rejected');

      // Exactly 1 winner successfully initialized revision 0 -> 1
      expect(fulfilled).toHaveLength(1);
      // The other 9 callers received CONFLICT due to optimistic concurrency
      expect(rejected).toHaveLength(9);
      for (const rej of rejected) {
        expect((rej as PromiseRejectedResult).reason).toBeInstanceOf(KnowledgeStoreError);
        expect(((rej as PromiseRejectedResult).reason as KnowledgeStoreError).code).toBe('CONFLICT');
      }

      // Subsequent prepare call on the now-initialized workspace succeeds cleanly
      const postInitBinding = await bootstrap.prepare(projDir, 'http://localhost:3000');
      expect(postInitBinding).toBeDefined();
      expect(postInitBinding?.store).toBeDefined();
    });
  });

  // =========================================================================
  // 4. Technical Diagnostics Logging Pipeline
  // =========================================================================
  describe('4. Technical Diagnostics Logging Pipeline', () => {
    it('4.1 logs structured technical error to ~/.qap/diagnostics/technical_errors.log and project .qa/logs/', () => {
      const projDir = createTemp('diag-proj');
      const diagId = randomUUID();

      const diagLogPath = join(homedir(), '.qap', 'diagnostics', 'technical_errors.log');
      const sizeBefore = existsSync(diagLogPath) ? statSync(diagLogPath).size : 0;

      logTechnicalDiagnostic(
        {
          event: 'workspace_preparation_failed',
          diagnostic_id: diagId,
          tool: 'qap_status',
          targetPath: projDir,
          error: {
            name: 'KnowledgeStoreError',
            message: 'Knowledge store: SCHEMA_MISMATCH (empirical challenger injection)',
            stack: 'Error: injected stack\n  at challenger.test.ts',
          },
        },
        projDir
      );

      // Verify global log updated
      expect(existsSync(diagLogPath)).toBe(true);
      const sizeAfter = statSync(diagLogPath).size;
      expect(sizeAfter).toBeGreaterThan(sizeBefore);

      const logText = readFileSync(diagLogPath, 'utf8');
      expect(logText).toContain(diagId);
      expect(logText).toContain('Knowledge store: SCHEMA_MISMATCH (empirical challenger injection)');

      // Verify local project .qa/logs updated
      const projectLogPath = join(projDir, '.qa', 'logs', 'technical_errors.log');
      expect(existsSync(projectLogPath)).toBe(true);
      const projectLogText = readFileSync(projectLogPath, 'utf8');
      expect(projectLogText).toContain(diagId);
    });
  });
});
