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

  it('recupera respaldos históricos legítimos formato 85e5d52 sin .qap-committed y rechaza publicaciones pendientes, cuarentenas y archivos ambiguos', () => {
    // 1. Respaldo histórico formato 85e5d52 (sin .qap-committed): creado por saveRun()
    const legacyDir = path.join(tempDir, 'runs', 'legacy-run-85e5d52');
    fs.mkdirSync(path.join(legacyDir, 'artifacts'), { recursive: true });
    const legacyRun: RunRecord = {
      runId: 'legacy-run-85e5d52',
      flowId: 'checkout-e2e',
      startedAt: '2026-10-01T10:00:00.000Z',
      finishedAt: '2026-10-01T10:00:05.000Z',
      totalDurationMs: 5000,
      overallStatus: 'passed',
      environment: {
        gitCommit: '85e5d52',
        gitBranch: 'feat/qap-vnext-architecture',
        hostOs: 'linux',
        runnerFramework: 'playwright-core',
      },
      steps: [
        {
          stepIndex: 0,
          capabilityId: 'TC-1:navigate:0',
          status: 'passed',
          durationMs: 120,
          timestamp: '2026-10-01T10:00:01.000Z',
          assertions: [],
        },
      ],
      artifacts: { totalDiskUsageBytes: 256, screenshots: [] },
      lifecycle: { pinned: false, createdAt: '2026-10-01T10:00:00.000Z' },
    };
    fs.writeFileSync(path.join(legacyDir, 'run.json'), JSON.stringify(legacyRun, null, 2), 'utf-8');

    // 2. Respaldo histórico formato 85e5d52 con summary y timeline.json (persistRuntimeEvidenceBundle)
    const legacyBundleDir = path.join(tempDir, 'runs', 'legacy-bundle-85e5d52');
    fs.mkdirSync(path.join(legacyBundleDir, 'artifacts'), { recursive: true });
    fs.writeFileSync(
      path.join(legacyBundleDir, 'artifacts', 'timeline.json'),
      JSON.stringify({
        _version: '1',
        run_id: 'legacy-bundle-85e5d52',
        module: 'orders',
        generated_at: '2026-10-01T11:00:02.000Z',
        steps: [
          {
            step_index: 0,
            case_id: 'TC-2',
            action: 'assert',
            status: 'passed',
            started_at: '2026-10-01T11:00:00.000Z',
            finished_at: '2026-10-01T11:00:01.000Z',
            duration_ms: 50,
            expected: 'OK',
            observed: 'OK',
          },
        ],
        artifact_errors: [],
      }),
      'utf-8',
    );
    fs.writeFileSync(
      path.join(legacyBundleDir, 'run.json'),
      JSON.stringify({
        ...legacyRun,
        runId: 'legacy-bundle-85e5d52',
        flowId: 'orders',
        steps: [
          {
            stepIndex: 0,
            capabilityId: 'TC-2:assert:0',
            status: 'passed',
            durationMs: 50,
            timestamp: '2026-10-01T11:00:00.000Z',
            assertions: [{ expected: 'OK', observed: 'OK', passed: true }],
          },
        ],
        summary: { totalCases: 1, passed: 1, failed: 0, skipped: 0 },
      }),
      'utf-8',
    );

    // 3. Publicación nueva pendiente o interrumpida (.qap-publication-pending)
    const pendingDir = path.join(tempDir, 'runs', 'pending-run');
    fs.mkdirSync(path.join(pendingDir, 'artifacts'), { recursive: true });
    fs.writeFileSync(path.join(pendingDir, '.qap-publication-pending'), JSON.stringify({ runId: 'pending-run', pid: 999999 }));
    fs.writeFileSync(path.join(pendingDir, 'run.json'), JSON.stringify({ ...legacyRun, runId: 'pending-run' }), 'utf-8');

    // 4. Cuarentena (.qap-recovery-*)
    const quarantineDir = path.join(tempDir, 'runs', '.qap-recovery-qap-provisional-abc');
    fs.mkdirSync(path.join(quarantineDir, 'artifacts'), { recursive: true });
    fs.writeFileSync(
      path.join(quarantineDir, 'run.json'),
      JSON.stringify({ ...legacyRun, runId: '.qap-recovery-qap-provisional-abc' }),
      'utf-8',
    );

    // 5. Archivos ambiguos o incompletos sin procedencia verificable
    const emptyJsonDir = path.join(tempDir, 'runs', 'ambiguous-empty');
    fs.mkdirSync(path.join(emptyJsonDir, 'artifacts'), { recursive: true });
    fs.writeFileSync(path.join(emptyJsonDir, 'run.json'), '{}', 'utf-8');

    const noArtifactsDir = path.join(tempDir, 'runs', 'no-artifacts');
    fs.mkdirSync(noArtifactsDir, { recursive: true });
    fs.writeFileSync(path.join(noArtifactsDir, 'run.json'), JSON.stringify({ ...legacyRun, runId: 'no-artifacts' }), 'utf-8');

    const mismatchedIdDir = path.join(tempDir, 'runs', 'mismatched-dir');
    fs.mkdirSync(path.join(mismatchedIdDir, 'artifacts'), { recursive: true });
    fs.writeFileSync(path.join(mismatchedIdDir, 'run.json'), JSON.stringify({ ...legacyRun, runId: 'different-id' }), 'utf-8');

    const missingTimelineDir = path.join(tempDir, 'runs', 'missing-timeline');
    fs.mkdirSync(path.join(missingTimelineDir, 'artifacts'), { recursive: true });
    fs.writeFileSync(
      path.join(missingTimelineDir, 'run.json'),
      JSON.stringify({ ...legacyRun, runId: 'missing-timeline', summary: { totalCases: 1, passed: 1, failed: 0, skipped: 0 } }),
      'utf-8',
    );

    const provisionalLeakDir = path.join(tempDir, 'runs', 'provisional-leak');
    fs.mkdirSync(path.join(provisionalLeakDir, 'artifacts'), { recursive: true });
    fs.writeFileSync(
      path.join(provisionalLeakDir, 'run.json'),
      JSON.stringify({
        ...legacyRun,
        runId: 'provisional-leak',
        artifacts: { totalDiskUsageBytes: 100, screenshots: ['.qa/reports/screenshots/qap-provisional-xyz/s.png'] },
      }),
      'utf-8',
    );

    const freshDb = new QapDatabase(tempDir);
    // Las consultas normales exigen una fila SQLite confirmada
    expect(freshDb.listRuns()).toHaveLength(0);
    expect(freshDb.getRun('legacy-run-85e5d52')).toBeNull();
    expect(freshDb.getRun('pending-run')).toBeNull();

    const count = freshDb.reindex();
    expect(count).toBe(2);

    const recoveredIds = freshDb.listRuns().map((r) => r.run_id).sort();
    expect(recoveredIds).toEqual(['legacy-bundle-85e5d52', 'legacy-run-85e5d52']);
    expect(freshDb.getRun('legacy-run-85e5d52')?.flowId).toBe('checkout-e2e');
    expect(freshDb.getRun('legacy-bundle-85e5d52')?.steps).toHaveLength(1);
    expect(freshDb.getRun('pending-run')).toBeNull();
    expect(freshDb.getRun('ambiguous-empty')).toBeNull();
    expect(freshDb.getRun('no-artifacts')).toBeNull();

    // Idempotencia al repetir reindex()
    expect(freshDb.reindex()).toBe(2);
    expect(freshDb.listRuns().map((r) => r.run_id).sort()).toEqual(['legacy-bundle-85e5d52', 'legacy-run-85e5d52']);
    freshDb.close();
  });

  it('saveRun identifica nuevas publicaciones con .qap-publication-pending antes de escribir run.json', () => {
    const db = new QapDatabase(tempDir);
    let sawPendingBeforeRunJson = false;
    const origWrite = fs.writeFileSync;
    const runsRoot = path.join(tempDir, 'runs', 'save-run-order');
    const spy = (...args: Parameters<typeof fs.writeFileSync>) => {
      const target = String(args[0]);
      if (target === path.join(runsRoot, 'run.json')) {
        sawPendingBeforeRunJson = fs.existsSync(path.join(runsRoot, '.qap-publication-pending'));
      }
      return origWrite(...args);
    };
    fs.writeFileSync = spy as typeof fs.writeFileSync;
    try {
      db.saveRun({
        runId: 'save-run-order',
        startedAt: '2026-10-01T12:00:00.000Z',
        finishedAt: '2026-10-01T12:00:01.000Z',
        totalDurationMs: 1000,
        overallStatus: 'passed',
        environment: { gitCommit: '', gitBranch: '', hostOs: '', runnerFramework: '' },
        steps: [],
        artifacts: { totalDiskUsageBytes: 0, screenshots: [] },
        lifecycle: { pinned: false, createdAt: '2026-10-01T12:00:00.000Z' },
      });
    } finally {
      fs.writeFileSync = origWrite;
    }
    expect(sawPendingBeforeRunJson).toBe(true);
    expect(fs.existsSync(path.join(runsRoot, '.qap-publication-pending'))).toBe(false);
    expect(fs.existsSync(path.join(runsRoot, '.qap-committed'))).toBe(true);
    db.close();
  });
});
