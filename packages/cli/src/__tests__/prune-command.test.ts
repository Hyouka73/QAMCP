import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { QapDatabase } from '@qap/reporter';

import { handlePrune } from '../commands/prune.js';

describe('Comando qap prune (S75-017)', () => {
  let tempDir: string;
  let rootDir: string;

  const historyFile = (moduleName: string): string =>
    path.join(rootDir, '.qa', 'cache', 'history', `${moduleName}.jsonl`);

  const readHistory = (moduleName: string): Array<Record<string, unknown>> =>
    fs
      .readFileSync(historyFile(moduleName), 'utf-8')
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line) as Record<string, unknown>);

  /** Crea una ejecución (<id>.json + <id>.report.json) con su antigüedad en días. */
  function seedExecution(id: string, ageDays: number): void {
    const executionsDir = path.join(rootDir, '.qa', 'executions');
    fs.mkdirSync(executionsDir, { recursive: true });
    const when = new Date(Date.now() - ageDays * 24 * 60 * 60 * 1000);
    for (const name of [`${id}.json`, `${id}.report.json`]) {
      const filePath = path.join(executionsDir, name);
      fs.writeFileSync(filePath, '{}');
      fs.utimesSync(filePath, when, when);
    }
  }

  function seedHistory(moduleName: string, executionIds: string[]): void {
    fs.mkdirSync(path.dirname(historyFile(moduleName)), { recursive: true });
    const lines = executionIds.map((id) =>
      JSON.stringify({ timestamp: new Date().toISOString(), event: 'test', execution_id: id })
    );
    fs.writeFileSync(historyFile(moduleName), lines.join('\n') + '\n');
  }

  /** Registra una corrida del runtime con su antigüedad en días. */
  function seedRun(db: QapDatabase, runId: string, ageDays: number): void {
    const startedAt = new Date(Date.now() - ageDays * 24 * 60 * 60 * 1000).toISOString();
    db.saveRun({
      runId,
      startedAt,
      finishedAt: startedAt,
      totalDurationMs: 1000,
      overallStatus: 'passed' as const,
      environment: { gitCommit: '', gitBranch: '', hostOs: '', runnerFramework: '' },
      steps: [],
      artifacts: { totalDiskUsageBytes: 1024, screenshots: [] },
      lifecycle: { pinned: false, createdAt: startedAt },
    });
  }

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qap-cli-prune-'));
    rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qap-cli-root-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    if (fs.existsSync(rootDir)) {
      fs.rmSync(rootDir, { recursive: true, force: true });
    }
  });

  // ---- Tests originales (sin cambios) ----

  it('qap prune --dry-run reporta bytes sin eliminar archivos', async () => {
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

    const auditResult = await handlePrune({
      runtimeDir: tempDir,
      rootDir,
      dryRun: true,
      olderThanDays: 30,
    });

    expect(auditResult.isDryRun).toBe(true);
    expect(auditResult.candidateRunsCount).toBe(1);
    expect(fs.existsSync(runJsonPath)).toBe(true);
  });

  it('qap prune soporta --include-hashes y --max-entries correctamente', async () => {
    const hashesDir = path.join(rootDir, '.qa', 'cache', 'hashes');
    fs.mkdirSync(hashesDir, { recursive: true });
    const oldHashFile = path.join(hashesDir, 'old.hash');
    fs.writeFileSync(oldHashFile, 'some-hash-content');

    // Modificar mtime a 2 días atrás
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    fs.utimesSync(oldHashFile, twoDaysAgo, twoDaysAgo);

    const result = await handlePrune({
      runtimeDir: tempDir,
      rootDir,
      dryRun: false,
      includeHashes: true,
      maxEntries: 1,
    });

    expect(result.candidateHashesCount).toBe(1);
    expect(fs.existsSync(oldHashFile)).toBe(false);
  });

  // ---- Tests nuevos de S75-017 ----

  it('--include-hashes con --dry-run no elimina nada', async () => {
    const hashesDir = path.join(rootDir, '.qa', 'cache', 'hashes');
    fs.mkdirSync(hashesDir, { recursive: true });
    const oldHash = path.join(hashesDir, 'old.hash');
    const freshHash = path.join(hashesDir, 'fresh.hash');
    fs.writeFileSync(oldHash, 'viejo');
    fs.writeFileSync(freshHash, 'reciente');
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    fs.utimesSync(oldHash, twoDaysAgo, twoDaysAgo);

    const result = await handlePrune({ runtimeDir: tempDir, rootDir, includeHashes: true, dryRun: true });

    expect(result.candidateHashesCount).toBe(1);
    expect(fs.existsSync(oldHash)).toBe(true);
    expect(fs.existsSync(freshHash)).toBe(true);
  });

  it('--max-entries elimina las ejecuciones más antiguas y marca execution_exists: false en history', async () => {
    seedExecution('exec-viejo', 10);
    seedExecution('exec-medio', 5);
    seedExecution('exec-nuevo', 1);
    seedHistory('checkout', ['exec-viejo', 'exec-medio', 'exec-nuevo']);

    const result = await handlePrune({ runtimeDir: tempDir, rootDir, maxEntries: 2 });

    const executionsDir = path.join(rootDir, '.qa', 'executions');
    expect(result.candidateExecutionsCount).toBe(1);
    expect(fs.existsSync(path.join(executionsDir, 'exec-viejo.json'))).toBe(false);
    expect(fs.existsSync(path.join(executionsDir, 'exec-viejo.report.json'))).toBe(false);
    expect(fs.existsSync(path.join(executionsDir, 'exec-medio.json'))).toBe(true);
    expect(fs.existsSync(path.join(executionsDir, 'exec-nuevo.json'))).toBe(true);

    const history = readHistory('checkout');
    expect(history[0].execution_exists).toBe(false);
    expect(history[1].execution_exists).toBeUndefined();
    expect(history[2].execution_exists).toBeUndefined();
    expect(result.markedHistoryEntriesCount).toBe(1);
  });

  it('--older-than-days elimina las ejecuciones antiguas y marca su historial', async () => {
    seedExecution('exec-antiguo', 40);
    seedExecution('exec-reciente', 2);
    seedHistory('checkout', ['exec-antiguo', 'exec-reciente']);

    await handlePrune({ runtimeDir: tempDir, rootDir, olderThanDays: 30 });

    const executionsDir = path.join(rootDir, '.qa', 'executions');
    expect(fs.existsSync(path.join(executionsDir, 'exec-antiguo.json'))).toBe(false);
    expect(fs.existsSync(path.join(executionsDir, 'exec-reciente.json'))).toBe(true);
    expect(readHistory('checkout')[0].execution_exists).toBe(false);
  });

  it('--dry-run no elimina ejecuciones ni modifica el historial', async () => {
    seedExecution('exec-viejo', 10);
    seedExecution('exec-nuevo', 1);
    seedHistory('checkout', ['exec-viejo', 'exec-nuevo']);
    const historyBefore = fs.readFileSync(historyFile('checkout'), 'utf-8');

    const result = await handlePrune({ runtimeDir: tempDir, rootDir, maxEntries: 1, dryRun: true });

    expect(result.candidateExecutionsCount).toBe(1);
    expect(fs.existsSync(path.join(rootDir, '.qa', 'executions', 'exec-viejo.json'))).toBe(true);
    expect(fs.readFileSync(historyFile('checkout'), 'utf-8')).toBe(historyBefore);
  });

  it('con pocas ejecuciones y sin flags no elimina ninguna (default max-entries 50)', async () => {
    seedExecution('exec-viejo', 400);
    seedHistory('checkout', ['exec-viejo']);

    const result = await handlePrune({ runtimeDir: tempDir, rootDir });

    expect(result.candidateExecutionsCount).toBe(0);
    expect(fs.existsSync(path.join(rootDir, '.qa', 'executions', 'exec-viejo.json'))).toBe(true);
    expect(readHistory('checkout')[0].execution_exists).toBeUndefined();
  });

  it('--max-entries también limita las corridas del runtime (comportamiento previo)', async () => {
    const db = new QapDatabase(tempDir);
    seedRun(db, 'run-viejo', 3);
    seedRun(db, 'run-medio', 2);
    seedRun(db, 'run-nuevo', 1);
    db.close();

    const result = await handlePrune({ runtimeDir: tempDir, rootDir, maxEntries: 2, dryRun: true });

    expect(result.candidateRunsCount).toBe(1);
    expect(fs.existsSync(path.join(tempDir, 'runs', 'run-viejo', 'run.json'))).toBe(true);
  });
});