import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';

import { QapDatabase } from '@qap/reporter';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { handlePrune } from '../commands/prune.js';

describe('INT-01E: quota and dry-run preservation', () => {
  let root: string;
  beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), 'qap-prune-safety-')); });
  afterEach(() => {
    if (path.dirname(path.resolve(root)) !== path.resolve(os.tmpdir()) || !path.basename(root).startsWith('qap-prune-safety-')) throw new Error('Invalid fixture root');
    fs.rmSync(root, { recursive: true, force: true });
  });
  const runtime = () => path.join(root, '.qa', 'runtime');
  const snapshot = (): Record<string, string> => {
    const entries: Record<string, string> = {};
    const walk = (dir: string): void => {
      for (const name of fs.readdirSync(dir).sort()) {
        const file = path.join(dir, name);
        const stat = fs.statSync(file);
        entries[path.relative(root, file)] = stat.isDirectory() ? 'directory' : `${stat.mtimeMs}:${createHash('sha256').update(fs.readFileSync(file)).digest('hex')}`;
        if (stat.isDirectory()) walk(file);
      }
    };
    walk(root);
    return entries;
  };
  function seed(): { video: string; pinned: string } {
    const db = new QapDatabase(runtime());
    try {
      for (const [id, pinned] of [['normal', false], ['pinned', true]] as const) {
        const now = new Date().toISOString();
        db.saveRun({
          runId: id, startedAt: now, finishedAt: now, totalDurationMs: 1, overallStatus: 'passed',
          environment: { gitCommit: '', gitBranch: '', hostOs: '', runnerFramework: '' }, steps: [],
          artifacts: { totalDiskUsageBytes: 100, screenshots: [] }, lifecycle: { pinned, createdAt: now },
        });
        fs.writeFileSync(path.join(runtime(), 'runs', id, 'artifacts', 'video.webm'), Buffer.alloc(100));
      }
    } finally { db.close(); }
    return { video: path.join(runtime(), 'runs', 'normal', 'artifacts', 'video.webm'), pinned: path.join(runtime(), 'runs', 'pinned', 'artifacts', 'video.webm') };
  }
  it('does not create runtime/SQLite when only legacy .qa exists', async () => {
    fs.mkdirSync(path.join(root, '.qa', 'executions'), { recursive: true });
    fs.writeFileSync(path.join(root, '.qa', 'executions', 'example.json'), '{}');
    const before = snapshot();
    await handlePrune({ rootDir: root, dryRun: true, maxBytes: 0 });
    expect(snapshot()).toEqual(before);
    expect(fs.existsSync(runtime())).toBe(false);
  });
  it('audits existing SQLite without changing original files, auxiliary files or artifacts', async () => {
    seed();
    const before = snapshot();
    const result = await handlePrune({ rootDir: root, dryRun: true, maxBytes: 0 });
    expect(result.candidateArtifactsCount).toBe(1);
    expect(result.quotaSatisfied).toBe(false);
    expect(snapshot()).toEqual(before);
  });
  it('applies the same quota in real mode, preserving records and pinned evidence', async () => {
    const files = seed();
    const audit = await handlePrune({ rootDir: root, dryRun: true, maxBytes: 0 });
    const actual = await handlePrune({ rootDir: root, maxBytes: 0 });
    expect(actual.candidateBytes).toBe(audit.candidateBytes);
    expect(actual.candidateRunsCount).toBe(0);
    expect(fs.existsSync(files.video)).toBe(false);
    expect(fs.existsSync(files.pinned)).toBe(true);
    expect(fs.existsSync(path.join(runtime(), 'runs', 'normal', 'run.json'))).toBe(true);
    const reopened = new QapDatabase(runtime());
    try { expect(reopened.listRuns()).toHaveLength(2); } finally { reopened.close(); }
  });
  it('reads a private WAL copy without opening or changing the source database/WAL/SHM', async () => {
    const writer = new QapDatabase(runtime());
    try {
      const old = new Date(Date.now() - 40 * 86400000).toISOString();
      writer.saveRun({
        runId: 'wal-only', startedAt: old, finishedAt: old, totalDurationMs: 1, overallStatus: 'passed',
        environment: { gitCommit: '', gitBranch: '', hostOs: '', runnerFramework: '' }, steps: [],
        artifacts: { totalDiskUsageBytes: 0, screenshots: [] }, lifecycle: { pinned: false, createdAt: old },
      });
      expect(fs.existsSync(path.join(runtime(), 'qap.sqlite-wal'))).toBe(true);
      const before = snapshot();
      const audit = await handlePrune({ rootDir: root, dryRun: true, olderThanDays: 30 });
      expect(audit.candidateRunsCount).toBe(1);
      expect(snapshot()).toEqual(before);
    } finally { writer.close(); }
  });
  it.each(['-1', 'NaN', '1.5', '', '9007199254740992'])('rejects invalid quota %s before creating runtime', async (maxBytes) => {
    await expect(handlePrune({ rootDir: root, maxBytes })).rejects.toThrow('--max-bytes');
    expect(fs.readdirSync(root)).toEqual([]);
  });
});
