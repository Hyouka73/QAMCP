import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { QapDatabase } from '../persistence/sqlite-client.js';
import type { RunRecord } from '../types.js';

describe('Capa SQLite WAL, Concurrencia y Persistencia Dual (QAP v3.0)', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qap-sqlite-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('soporta escrituras concurrentes en WAL mode sin corromper la base de datos (Checklist Gate)', async () => {
    const db1 = new QapDatabase(tempDir);
    const db2 = new QapDatabase(tempDir);

    const generateRun = (id: string): RunRecord => ({
      runId: id,
      flowId: 'auth-flow',
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      totalDurationMs: 1500,
      overallStatus: 'passed',
      environment: {
        gitCommit: 'abc1234',
        gitBranch: 'main',
        hostOs: process.platform,
        runnerFramework: 'vitest',
      },
      steps: [
        {
          stepIndex: 0,
          capabilityId: 'auth.login.submit',
          status: 'passed',
          durationMs: 500,
          timestamp: new Date().toISOString(),
          assertions: [],
        },
      ],
      artifacts: { totalDiskUsageBytes: 1024, screenshots: [] },
      lifecycle: { pinned: false, createdAt: new Date().toISOString() },
    });

    // Ejecutar escrituras simultáneas e intercaladas desde dos conexiones
    const tasks: Promise<void>[] = [];

    for (let i = 0; i < 20; i++) {
      const client = i % 2 === 0 ? db1 : db2;
      tasks.push(
        new Promise((resolve) => {
          setTimeout(() => {
            client.saveRun(generateRun(`run-concurrent-${i}`));
            resolve();
          }, Math.floor(Math.random() * 20));
        })
      );
    }

    await Promise.all(tasks);

    // Verificar que todas las 20 corridas se insertaron íntegras
    const allRuns = db1.listRuns();
    expect(allRuns).toHaveLength(20);

    db1.close();
    db2.close();
  });

  it('garantiza la persistencia dual en filesystem (run.json) y SQLite bajo transacción', () => {
    const db = new QapDatabase(tempDir);

    const testRun: RunRecord = {
      runId: 'dual-run-1',
      flowId: 'checkout-flow',
      startedAt: '2026-09-22T12:00:00Z',
      finishedAt: '2026-09-22T12:01:00Z',
      totalDurationMs: 60000,
      overallStatus: 'passed',
      environment: {
        gitCommit: 'commit-xyz',
        gitBranch: 'feature',
        hostOs: process.platform,
        runnerFramework: 'vitest',
      },
      steps: [
        {
          stepIndex: 0,
          capabilityId: 'checkout.cart.view',
          status: 'passed',
          durationMs: 250,
          timestamp: '2026-09-22T12:00:05Z',
          assertions: [],
        },
      ],
      artifacts: { totalDiskUsageBytes: 2048, screenshots: [] },
      lifecycle: { pinned: true, createdAt: '2026-09-22T12:00:00Z' },
    };

    db.saveRun(testRun);

    // 1. Archivo run.json en disco
    const jsonPath = path.join(tempDir, 'runs', 'dual-run-1', 'run.json');
    expect(fs.existsSync(jsonPath)).toBe(true);
    const jsonContent = JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) as RunRecord;
    expect(jsonContent.runId).toBe('dual-run-1');
    expect(jsonContent.lifecycle.pinned).toBe(true);

    // 2. Fila en SQLite
    const row = db.getRunRow('dual-run-1');
    expect(row).toBeDefined();
    expect(row?.pinned).toBe(1);
    expect(row?.flow_id).toBe('checkout-flow');

    db.close();
  });

  it('reconstruye íntegramente la base de datos qap.sqlite desde run.json (Regla 10: Reindex)', () => {
    const db = new QapDatabase(tempDir);

    const runA: RunRecord = {
      runId: 'reindex-run-a',
      startedAt: '2026-09-22T13:00:00Z',
      finishedAt: '2026-09-22T13:01:00Z',
      totalDurationMs: 60000,
      overallStatus: 'passed',
      environment: { gitCommit: 'c1', gitBranch: 'b1', hostOs: '', runnerFramework: '' },
      steps: [],
      artifacts: { totalDiskUsageBytes: 0, screenshots: [] },
      lifecycle: { pinned: false, createdAt: '2026-09-22T13:00:00Z' },
    };

    db.saveRun(runA);
    db.close();

    // Simular pérdida o corrupción borrando qap.sqlite y el WAL
    const sqlitePath = path.join(tempDir, 'qap.sqlite');
    if (fs.existsSync(sqlitePath)) fs.unlinkSync(sqlitePath);
    const walPath = path.join(tempDir, 'qap.sqlite-wal');
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);

    // Reabrir nueva conexión y ejecutar reindex
    const freshDb = new QapDatabase(tempDir);
    expect(freshDb.listRuns()).toHaveLength(0);

    const count = freshDb.reindex();
    expect(count).toBe(1);

    const recovered = freshDb.getRun('reindex-run-a');
    expect(recovered).not.toBeNull();
    expect(recovered?.runId).toBe('reindex-run-a');

    freshDb.close();
  });
});
