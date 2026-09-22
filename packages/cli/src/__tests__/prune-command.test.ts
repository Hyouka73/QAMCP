import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { QapDatabase } from '@qap/reporter';

import { handlePrune } from '../commands/prune.js';

describe('Comando qap prune (Checklist Gate Fase 3)', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qap-cli-prune-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('qap prune --dry-run reporta bytes sin eliminar archivos (Checklist Gate)', async () => {
    const db = new QapDatabase(tempDir);
    const fortyDaysAgo = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString();

    const oldRun = {
      runId: 'old-run-1',
      startedAt: fortyDaysAgo,
      finishedAt: fortyDaysAgo,
      totalDurationMs: 1000,
      overallStatus: 'passed' as const,
      environment: { gitCommit: '', gitBranch: '', hostOs: '', runnerFramework: '' },
      steps: [],
      artifacts: { totalDiskUsageBytes: 1024, screenshots: [] },
      lifecycle: { pinned: false, createdAt: fortyDaysAgo },
    };

    db.saveRun(oldRun);
    db.close();

    const runJsonPath = path.join(tempDir, 'runs', 'old-run-1', 'run.json');
    expect(fs.existsSync(runJsonPath)).toBe(true);

    // Ejecutar con dry-run activado
    const auditResult = await handlePrune({
      runtimeDir: tempDir,
      dryRun: true,
      olderThanDays: 30,
    });

    expect(auditResult.isDryRun).toBe(true);
    expect(auditResult.candidateRunsCount).toBe(1);
    expect(auditResult.candidateBytes).toBeGreaterThan(0);

    // CRÍTICO: Ningún archivo debe haberse borrado
    expect(fs.existsSync(runJsonPath)).toBe(true);
    const dbCheck = new QapDatabase(tempDir);
    expect(dbCheck.getRun('old-run-1')).not.toBeNull();
    dbCheck.close();
  });

  it('qap prune sin --dry-run elimina efectivamente los registros expirados', async () => {
    const db = new QapDatabase(tempDir);
    const fortyDaysAgo = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString();

    const oldRun = {
      runId: 'purge-run-1',
      startedAt: fortyDaysAgo,
      finishedAt: fortyDaysAgo,
      totalDurationMs: 1000,
      overallStatus: 'passed' as const,
      environment: { gitCommit: '', gitBranch: '', hostOs: '', runnerFramework: '' },
      steps: [],
      artifacts: { totalDiskUsageBytes: 1024, screenshots: [] },
      lifecycle: { pinned: false, createdAt: fortyDaysAgo },
    };

    db.saveRun(oldRun);
    db.close();

    const runJsonPath = path.join(tempDir, 'runs', 'purge-run-1', 'run.json');
    expect(fs.existsSync(runJsonPath)).toBe(true);

    // Ejecutar poda real
    const auditResult = await handlePrune({
      runtimeDir: tempDir,
      dryRun: false,
      olderThanDays: 30,
    });

    expect(auditResult.isDryRun).toBe(false);
    expect(auditResult.candidateRunsCount).toBe(1);
    expect(fs.existsSync(runJsonPath)).toBe(false);

    const dbCheck = new QapDatabase(tempDir);
    expect(dbCheck.getRun('purge-run-1')).toBeNull();
    dbCheck.close();
  });
});
