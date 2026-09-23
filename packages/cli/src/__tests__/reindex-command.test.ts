import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { QapDatabase } from '@qap/reporter';

import { handleRuntimeReindex } from '../commands/reindex.js';

describe('Comando qap runtime reindex (Checklist Gate Fase 3)', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qap-cli-reindex-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('qap runtime reindex restaura la base de datos idéntica tras borrar qap.sqlite (Checklist Gate)', async () => {
    const db = new QapDatabase(tempDir);

    const run1 = {
      runId: 'reindex-cli-1',
      flowId: 'auth-e2e',
      startedAt: '2026-09-22T10:00:00Z',
      finishedAt: '2026-09-22T10:01:00Z',
      totalDurationMs: 60000,
      overallStatus: 'passed' as const,
      environment: { gitCommit: 'abc', gitBranch: 'main', hostOs: '', runnerFramework: '' },
      steps: [
        {
          stepIndex: 0,
          capabilityId: 'auth.login.submit',
          status: 'passed' as const,
          durationMs: 300,
          timestamp: '2026-09-22T10:00:05Z',
          assertions: [],
        },
      ],
      artifacts: { totalDiskUsageBytes: 2048, screenshots: [] },
      lifecycle: { pinned: true, createdAt: '2026-09-22T10:00:00Z' },
    };

    const run2 = {
      runId: 'reindex-cli-2',
      flowId: 'payments-e2e',
      startedAt: '2026-09-22T11:00:00Z',
      finishedAt: '2026-09-22T11:02:00Z',
      totalDurationMs: 120000,
      overallStatus: 'failed' as const,
      environment: { gitCommit: 'xyz', gitBranch: 'feature', hostOs: '', runnerFramework: '' },
      steps: [],
      artifacts: { totalDiskUsageBytes: 4096, screenshots: [] },
      lifecycle: { pinned: false, createdAt: '2026-09-22T11:00:00Z' },
    };

    db.saveRun(run1);
    db.saveRun(run2);
    db.close();

    // Borrar la base de datos qap.sqlite y sus archivos auxiliares (WAL/SHM)
    const sqlitePath = path.join(tempDir, 'qap.sqlite');
    if (fs.existsSync(sqlitePath)) fs.unlinkSync(sqlitePath);
    const walPath = path.join(tempDir, 'qap.sqlite-wal');
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);

    // Confirmar que qap.sqlite fue eliminada
    expect(fs.existsSync(sqlitePath)).toBe(false);

    // Ejecutar el subcomando qap runtime reindex
    const count = await handleRuntimeReindex(tempDir);
    expect(count).toBe(2);

    // Verificar que qap.sqlite fue regenerada con datos idénticos
    const freshDb = new QapDatabase(tempDir);
    const runsList = freshDb.listRuns();
    expect(runsList).toHaveLength(2);

    const recovered1 = freshDb.getRun('reindex-cli-1');
    expect(recovered1).not.toBeNull();
    expect(recovered1?.runId).toBe('reindex-cli-1');
    expect(recovered1?.flowId).toBe('auth-e2e');
    expect(recovered1?.lifecycle.pinned).toBe(true);
    expect(recovered1?.steps).toHaveLength(1);
    expect(recovered1?.steps[0].capabilityId).toBe('auth.login.submit');

    const recovered2 = freshDb.getRun('reindex-cli-2');
    expect(recovered2).not.toBeNull();
    expect(recovered2?.overallStatus).toBe('failed');

    freshDb.close();
  });
});
