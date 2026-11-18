import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { expect, it } from 'vitest';
import { PlaywrightRunner, publishProvisionalExecution, discardProvisionalExecution } from '../index.js';

it('survives a physically killed publisher and recovers without exposing or deleting committed runs', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'qap-crash-recovery-'));
  const runnerUrl = pathToFileURL(path.resolve('dist/index.js')).href;
  const reporterUrl = pathToFileURL(path.resolve('../reporter/dist/index.js')).href;
  const { QapDatabase, startViewerServer } = await import(reporterUrl);
  const viewer = await startViewerServer({ storage: { getProjectRoot: () => root }, port: 0, host: '127.0.0.1', silent: true });
  const runner = new PlaywrightRunner({ projectRoot: root });
  const plan = { modules: ['demo'], cases: ['TC-1'], environment: 'local' };
  const tc = { _version: '1', id: 'TC-1', name: 'Evidence', steps: [
    { type: 'navigate', url: 'data:text/html,<h1 id="ok">OK</h1>' },
    { type: 'assert', selector: '#ok', assertion_type: 'equals', expected: 'OK' },
    { type: 'screenshot', filename: 'ok.png' },
  ] } as any;
  const options = { storageResolver: async () => tc, allowImplicitAuth: false, lock_owned_by_caller: true };
  let pending: Awaited<ReturnType<typeof runner.prepare>> | undefined;
  try {
    const first = await runner.prepare(plan, { ...options, attemptId: 'already-committed' });
    expect(first.result.result).toBe('passed');
    const published = publishProvisionalExecution(first);
    const previous = fs.readFileSync(path.join(root, published.artifacts!.video_path!));
    pending = await runner.prepare(plan, { ...options, attemptId: 'interrupted' });
    expect(pending.result.result).toBe('passed');
    const childCode = `
      import fs from 'node:fs';
      const original = fs.writeFileSync;
      fs.writeFileSync = function(p, ...args) {
        const result = original.call(this, p, ...args);
        if (typeof p === 'string' && p.endsWith('run.json')) {
          fs.writeSync(1, 'BARRIER\\n');
          Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0);
        }
        return result;
      };
      const { loadProvisionalExecution, publishProvisionalExecution } = await import(process.argv[1]);
      publishProvisionalExecution(loadProvisionalExecution(process.argv[2]));
    `;
    const child = spawn(process.execPath, ['--input-type=module', '-e', childCode, runnerUrl, pending.operationId], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    let stderr = '';
    child.stderr.setEncoding('utf8'); child.stderr.on('data', chunk => { stderr += chunk; });
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`barrier timeout: ${stderr}`)), 30000);
      child.stdout.setEncoding('utf8');
      child.stdout.on('data', chunk => { if (chunk.includes('BARRIER')) { clearTimeout(timeout); resolve(); } });
      child.once('exit', code => { clearTimeout(timeout); reject(new Error(`publisher exited ${code}: ${stderr}`)); });
    });
    const runDir = path.join(root, '.qa/runtime/runs/interrupted');
    expect(fs.existsSync(path.join(runDir, 'run.json'))).toBe(true);
    expect(fs.existsSync(path.join(runDir, '.qap-publication-pending'))).toBe(true);
    expect(() => publishProvisionalExecution(pending!)).toThrow();
    expect(fs.existsSync(path.join(runDir, 'run.json'))).toBe(true);
    const runUrl = `${viewer.url}/artifacts/runtime/runs/interrupted/run.json`;
    const screenshotUrl = `${viewer.url}/artifacts/${pending.result.artifacts!.screenshots![0].replace(/^\.qa\//, '')}`;
    expect((await fetch(runUrl)).status).toBe(404);
    expect((await fetch(screenshotUrl)).status).toBe(404);
    expect((await fetch(`${viewer.url}/artifacts/runtime/runs/already-committed/run.json`)).status).toBe(200);
    const dbPath = path.join(root, '.qa/runtime/qap.sqlite');
    const db = new DatabaseSync(dbPath, { readOnly: true });
    expect(db.prepare('SELECT run_id FROM runs ORDER BY run_id').all()).toEqual([{ run_id: 'already-committed' }]); db.close();
    const report = new QapDatabase(path.join(root, '.qa/runtime'));
    expect(report.getRun('interrupted')).toBeNull();
    expect(report.reindex()).toBe(1);
    expect(report.listRuns().map((r: any) => r.run_id)).toEqual(['already-committed']);
    report.close();
    const recoverCode = `const m = await import(process.argv[1]); console.log(JSON.stringify(m.recoverProvisionalPublications(process.argv[2])));`;
    const recover = () => {
      const result = spawnSync(process.execPath, ['--input-type=module', '-e', recoverCode, runnerUrl, root], { encoding: 'utf8', windowsHide: true });
      expect(result.status, result.stderr).toBe(0);
      return JSON.parse(result.stdout.trim());
    };
    expect(recover()).toEqual({ removed: 0, confirmed: 0 }); // publisher still owns its marker
    const exited = new Promise(resolve => child.once('exit', resolve));
    child.kill('SIGKILL'); await exited;
    expect(recover()).toEqual({ removed: 1, confirmed: 0 });
    expect(recover()).toEqual({ removed: 0, confirmed: 0 });
    // A crash after COMMIT but before receipt must preserve and finish the run.
    const committedDir = path.join(root, '.qa/runtime/runs/already-committed');
    fs.rmSync(path.join(committedDir, '.qap-committed'));
    fs.writeFileSync(path.join(committedDir, '.qap-publication-pending'), JSON.stringify({ operationId: first.operationId, runId: 'already-committed', pid: child.pid }));
    expect(recover()).toEqual({ removed: 0, confirmed: 1 });
    expect(recover()).toEqual({ removed: 0, confirmed: 0 });
    expect(fs.existsSync(path.join(committedDir, '.qap-committed'))).toBe(true);
    expect(fs.existsSync(runDir)).toBe(false);
    expect(fs.existsSync(path.join(root, '.qa/reports/screenshots', pending.operationId))).toBe(false);
    expect(fs.readFileSync(path.join(root, published.artifacts!.video_path!))).toEqual(previous);
    const after = new QapDatabase(path.join(root, '.qa/runtime'));
    expect(after.getRun('interrupted')).toBeNull();
    expect(after.reindex()).toBe(1);
    expect(after.getRun('already-committed')?.runId).toBe('already-committed');
    after.close();
    // Retrying the same prepared operation after cleanup publishes exactly one run.
    expect(publishProvisionalExecution(pending).result).toBe('passed');
    expect((await fetch(runUrl)).status).toBe(200);
    expect((await fetch(screenshotUrl)).status).toBe(200);
    const finalDb = new QapDatabase(path.join(root, '.qa/runtime'));
    expect(finalDb.listRuns().map((r: any) => r.run_id).sort()).toEqual(['already-committed', 'interrupted']);
    finalDb.close();
    expect(() => publishProvisionalExecution(pending!)).toThrow();
    const receiptFailure = await runner.prepare(plan, { ...options, attemptId: 'receipt-failure' });
    const failReceiptCode = `
      import fs from 'node:fs';
      const original = fs.writeFileSync;
      fs.writeFileSync = function(p, ...args) {
        if (typeof p === 'string' && p.includes('screenshots') && p.endsWith('.qap-committed')) throw Error('receipt write failed');
        return original.call(this, p, ...args);
      };
      const m = await import(process.argv[1]);
      m.publishProvisionalExecution(m.loadProvisionalExecution(process.argv[2]));
    `;
    const failedReceipt = spawnSync(process.execPath, ['--input-type=module', '-e', failReceiptCode, runnerUrl, receiptFailure.operationId], { encoding: 'utf8', windowsHide: true });
    expect(failedReceipt.status).not.toBe(0);
    expect(failedReceipt.stderr).toContain('receipt write failed');
    expect(recover()).toEqual({ removed: 0, confirmed: 1 });
    expect(recover()).toEqual({ removed: 0, confirmed: 0 });
    const afterReceiptFailure = new QapDatabase(path.join(root, '.qa/runtime'));
    expect(afterReceiptFailure.getRun('receipt-failure')?.runId).toBe('receipt-failure');
    afterReceiptFailure.close();
    discardProvisionalExecution(receiptFailure);

    // Run-level .qap-committed receipt failure after SQLite COMMIT classifies as post_commit, preserves run, and recovers cleanly.
    const runReceiptFailure = await runner.prepare(plan, { ...options, attemptId: 'run-receipt-failure' });
    const failRunReceiptCode = `
      import fs from 'node:fs';
      const original = fs.writeFileSync;
      fs.writeFileSync = function(p, ...args) {
        if (typeof p === 'string' && p.includes('run-receipt-failure') && p.endsWith('.qap-committed')) throw Error('run receipt write failed');
        return original.call(this, p, ...args);
      };
      const m = await import(process.argv[1]);
      try {
        m.publishProvisionalExecution(m.loadProvisionalExecution(process.argv[2]));
        process.exit(2);
      } catch (err) {
        if (!m.isPostCommitPublicationError(err)) process.exit(3);
        console.log(JSON.stringify({ committed: err.committed, phase: err.phase, runId: err.runId, message: err.message }));
      }
    `;
    const nodeExec = (globalThis as unknown as { process: { execPath: string } }).process.execPath;
    const failedRunReceipt = spawnSync(nodeExec, ['--input-type=module', '-e', failRunReceiptCode, runnerUrl, runReceiptFailure.operationId], { encoding: 'utf8', windowsHide: true });
    expect(failedRunReceipt.status, failedRunReceipt.stderr).toBe(0);
    expect(JSON.parse(failedRunReceipt.stdout.trim())).toMatchObject({
      committed: true,
      phase: 'post_commit',
      runId: 'run-receipt-failure',
    });
    expect(recover()).toEqual({ removed: 0, confirmed: 1 });
    expect(recover()).toEqual({ removed: 0, confirmed: 0 });
    expect(fs.existsSync(path.join(root, '.qa/runtime/runs/run-receipt-failure/.qap-committed'))).toBe(true);
    const afterRunReceiptFailure = new QapDatabase(path.join(root, '.qa/runtime'));
    expect(afterRunReceiptFailure.getRun('run-receipt-failure')?.runId).toBe('run-receipt-failure');
    afterRunReceiptFailure.close();
    discardProvisionalExecution(runReceiptFailure);
  } finally {
    await viewer.close();
    if (pending && fs.existsSync(pending.provisionalRoot)) discardProvisionalExecution(pending);
    fs.rmSync(root, { recursive: true, force: true });
  }
}, 90000);
