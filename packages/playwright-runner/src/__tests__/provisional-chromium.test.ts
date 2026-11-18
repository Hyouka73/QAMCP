import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterAll, describe, expect, it } from 'vitest';
import type { TCCase, TestPlan } from '@qap/shared';
import { PlaywrightRunner, discardProvisionalExecution, loadProvisionalExecution, publishProvisionalExecution } from '../index.js';

describe('provisional evidence with real Chromium', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'qap-provisional-test-'));
  const runner = new PlaywrightRunner({ projectRoot: root });
  const plan: TestPlan = { modules: ['demo'], cases: ['TC-1'], environment: 'local' };
  const tc: TCCase = { _version: '1', id: 'TC-1', name: 'Evidence', steps: [
    { type: 'navigate', url: 'data:text/html,<h1 id="hello">Hello</h1>' },
    { type: 'assert', selector: '#hello', assertion_type: 'equals', expected: 'Hello' },
    { type: 'screenshot', filename: '../../escape.png' },
  ] };
  const options = { storageResolver: async () => tc, allowImplicitAuth: false, lock_owned_by_caller: true };
  const dbPath = path.join(root, '.qa/runtime/qap.sqlite');
  const rows = () => {
    if (!fs.existsSync(dbPath)) return [];
    const db = new DatabaseSync(dbPath, { readOnly: true });
    try { return db.prepare('SELECT run_id FROM runs ORDER BY run_id').all().map(row => row.run_id); } finally { db.close(); }
  };
  afterAll(() => fs.rmSync(root, { recursive: true, force: true }));

  it('prepares, publishes, discards, and preserves traditional behavior', async () => {
    const first = await runner.prepare(plan, { ...options, attemptId: 'provisional-a' });
    expect(first.result.result).toBe('passed');
    expect(fs.existsSync(path.join(first.provisionalRoot, first.result.artifacts!.video_path!))).toBe(true);
    expect(fs.existsSync(path.join(first.provisionalRoot, first.result.artifacts!.trace_zip_path!))).toBe(true);
    expect(first.result.artifacts!.screenshots!.length).toBeGreaterThan(0);
    for (const shot of first.result.artifacts!.screenshots!) expect(fs.existsSync(path.join(first.provisionalRoot, shot))).toBe(true);
    expect(fs.existsSync(path.join(root, '.qa/runtime/runs/provisional-a'))).toBe(false);
    expect(fs.existsSync(path.join(root, '.qa/reports/screenshots'))).toBe(false);
    expect(rows()).toEqual([]);
    const published = publishProvisionalExecution(loadProvisionalExecution(first.operationId));
    expect(fs.existsSync(first.provisionalRoot)).toBe(false);
    for (const rel of [published.artifacts!.video_path!, published.artifacts!.trace_zip_path!, published.artifacts!.timeline_path!, ...published.artifacts!.screenshots!]) {
      expect(fs.existsSync(path.join(root, rel))).toBe(true);
    }
    expect(fs.existsSync(path.join(root, '.qa/runtime/runs/provisional-a/run.json'))).toBe(true);
    expect(rows()).toEqual(['provisional-a']);

    const second = await runner.prepare(plan, { ...options, attemptId: 'provisional-b' });
    expect(second.result.result).toBe('passed');
    expect(rows()).toEqual(['provisional-a']);
    discardProvisionalExecution(second);
    expect(fs.existsSync(second.provisionalRoot)).toBe(false);
    expect(fs.existsSync(path.join(root, '.qa/runtime/runs/provisional-b'))).toBe(false);
    expect(fs.existsSync(path.join(root, published.artifacts!.video_path!))).toBe(true);
    expect(rows()).toEqual(['provisional-a']);

    const traditionalCase = { ...tc, steps: tc.steps.slice(0, 2) };
    const traditional = await runner.execute(plan, { ...options, attemptId: 'traditional', storageResolver: async () => traditionalCase });
    expect(traditional.result).toBe('passed');
    expect(fs.existsSync(path.join(root, traditional.artifacts!.video_path!))).toBe(true);
    expect(fs.existsSync(path.join(root, traditional.artifacts!.timeline_path!))).toBe(true);
    expect(rows()).toEqual(['provisional-a', 'traditional']);

    const failing = await runner.prepare(plan, { ...options, attemptId: 'publication-failure' });
    const db = new DatabaseSync(dbPath);
    db.exec("CREATE TRIGGER reject_test BEFORE INSERT ON runs WHEN NEW.run_id = 'publication-failure' BEGIN SELECT RAISE(ABORT, 'injected failure'); END");
    db.close();
    expect(() => publishProvisionalExecution(failing)).toThrow('injected failure');
    expect(rows()).toEqual(['provisional-a', 'traditional']);
    expect(fs.existsSync(path.join(root, '.qa/runtime/runs/publication-failure'))).toBe(false);
    expect(fs.existsSync(path.join(root, '.qa/reports/screenshots', failing.operationId))).toBe(false);
    expect(fs.existsSync(failing.provisionalRoot)).toBe(true);
    discardProvisionalExecution(loadProvisionalExecution(failing.operationId));
  }, 60000);
});
