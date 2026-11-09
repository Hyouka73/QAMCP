import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { RunRow } from '../persistence/sqlite-client.js';
import { planQuotaArtifacts } from '../pruning/pruning-engine.js';

describe('INT-01E: shared non-mutating multimedia quota', () => {
  let root: string;
  beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), 'qap-quota-plan-')); });
  afterEach(() => {
    if (path.dirname(path.resolve(root)) !== path.resolve(os.tmpdir()) || !path.basename(root).startsWith('qap-quota-plan-')) throw new Error('Invalid fixture root');
    fs.rmSync(root, { recursive: true, force: true });
  });
  const row = (id: string, pinned = 0): RunRow => ({
    run_id: id, pinned, flow_id: null, started_at: '2026-11-09T00:00:00.000Z',
    finished_at: '2026-11-09T00:00:00.000Z', overall_status: 'passed', total_duration_ms: 1,
    git_commit: null, git_branch: null, total_disk_usage_bytes: 100, expires_at: null,
  });
  function seed(id: string, name: string): string {
    const file = path.join(root, 'runs', id, 'artifacts', name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, 'evidence');
    return file;
  }
  it('preserves pinned, unknown artifacts, screenshots and records even if quota is unattainable', () => {
    const video = seed('normal', 'trace.webm');
    const protectedFiles = [seed('pinned', 'trace.webm'), seed('normal', 'evidence.json'), seed('normal', 'screen.png')];
    const result = planQuotaArtifacts(root, [row('normal'), row('pinned', 1)], 0);
    expect(result).toEqual([{ path: video, bytes: 8 }]);
    expect([video, ...protectedFiles].every((file) => fs.existsSync(file))).toBe(true);
  });
  it('uses deterministic order and excludes already planned removals without counting them twice', () => {
    const a = seed('a', 'video.mp4');
    const b = seed('b', 'trace.zip');
    const rows = [row('b'), row('a')];
    const snapshot = structuredClone(rows);
    expect(planQuotaArtifacts(root, rows, 8)).toEqual([{ path: a, bytes: 8 }]);
    expect(planQuotaArtifacts(root, rows, 8, new Set([a]))).toEqual([]);
    expect(planQuotaArtifacts(root, rows, 0, new Set([path.join(root, 'runs', 'a')]))).toEqual([{ path: b, bytes: 8 }]);
    expect(rows).toEqual(snapshot);
  });
  it('rejects traversal IDs without selecting outside the managed tree', () => {
    expect(() => planQuotaArtifacts(root, [row('../outside')], 0)).toThrow('Invalid runtime run ID');
  });
});
