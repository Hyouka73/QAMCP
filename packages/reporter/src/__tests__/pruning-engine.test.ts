import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { QapDatabase } from '../persistence/sqlite-client.js';
import { PruningEngine } from '../pruning/pruning-engine.js';
import type { RunRecord } from '../types.js';

describe('Motor de Poda y Recolección de Basura (Checklist Gate)', () => {
  let tempDir: string;
  let db: QapDatabase;
  let engine: PruningEngine;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qap-prune-test-'));
    db = new QapDatabase(tempDir);
    engine = new PruningEngine(db, tempDir);
  });

  afterEach(() => {
    try {
      db.close();
    } catch {
      // Continuar
    }
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  const createRun = (
    runId: string,
    startedAt: string,
    pinned: boolean,
    videoFileSize = 0
  ): RunRecord => {
    const run: RunRecord = {
      runId,
      startedAt,
      finishedAt: startedAt,
      totalDurationMs: 1000,
      overallStatus: 'passed',
      environment: { gitCommit: '', gitBranch: '', hostOs: '', runnerFramework: '' },
      steps: [],
      artifacts: {
        totalDiskUsageBytes: videoFileSize,
        screenshots: [],
      },
      lifecycle: { pinned, createdAt: startedAt },
    };

    db.saveRun(run);

    if (videoFileSize > 0) {
      const artDir = path.join(tempDir, 'runs', runId, 'artifacts');
      fs.mkdirSync(artDir, { recursive: true });
      fs.writeFileSync(path.join(artDir, 'trace.mp4'), Buffer.alloc(videoFileSize));
    }

    return run;
  };

  it('un run marcado como pinned: true sobrevive a podas por cuota y por TTL (Checklist Gate)', () => {
    const baseNow = Date.now();
    const fortyDaysAgo = new Date(baseNow - 40 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Run antiguo PINNED (40 días)
    createRun('pinned-ancient-run', fortyDaysAgo, true, 5000);

    // 2. Run antiguo UNPINNED (40 días)
    createRun('unpinned-ancient-run', fortyDaysAgo, false, 5000);

    // Ejecutar poda con cuota pequeña
    const pruneResult = engine.prune(
      {
        recordTtlMs: 30 * 24 * 60 * 60 * 1000, // 30 días
        maxDiskUsageBytes: 1000, // Cuota muy restrictiva
      },
      baseNow
    );

    expect(pruneResult.deletedRunsCount).toBe(1);

    // El unpinned debe haberse eliminado
    expect(db.getRun('unpinned-ancient-run')).toBeNull();

    // El pinned DEBE sobrevivir intacto tanto en DB como sus artefactos
    const pinnedRun = db.getRun('pinned-ancient-run');
    expect(pinnedRun).not.toBeNull();
    expect(pinnedRun?.lifecycle.pinned).toBe(true);
    expect(
      fs.existsSync(path.join(tempDir, 'runs', 'pinned-ancient-run', 'artifacts', 'trace.mp4'))
    ).toBe(true);
  });

  it('purga videos de más de 7 días pero mantiene el registro de base de datos intacto', () => {
    const baseNow = Date.now();
    const tenDaysAgo = new Date(baseNow - 10 * 24 * 60 * 60 * 1000).toISOString();

    createRun('run-with-old-video', tenDaysAgo, false, 3000);

    const videoPath = path.join(tempDir, 'runs', 'run-with-old-video', 'artifacts', 'trace.mp4');
    expect(fs.existsSync(videoPath)).toBe(true);

    engine.prune({}, baseNow);

    // Video purgado por superar TTL de 7 días
    expect(fs.existsSync(videoPath)).toBe(false);

    // Registro de base de datos y run.json preservados (TTL de registro es 30 días)
    const run = db.getRun('run-with-old-video');
    expect(run).not.toBeNull();
    expect(run?.runId).toBe('run-with-old-video');
  });
});
