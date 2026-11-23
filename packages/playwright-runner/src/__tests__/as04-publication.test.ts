import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import type { EvidenceManifestV1 } from '@qap/shared';
import { expect, it } from 'vitest';

import { CapturePublicationStore } from '../capture/publication-store.js';

const storeUrl = new URL('../capture/publication-store.ts', import.meta.url).href;
const manifest: EvidenceManifestV1 = {
  _version: '1', project_id: 'p', attempt_id: 'attempt', visual_evidence_status: 'suppressed_by_policy',
  artifacts: [], segments: [], decisions: [],
  suppressions: [{ case_id: 'c', role_id: 'r', reason: 'surface_not_admitted', recorded_at: '2026-01-01T00:00:00Z' }],
};

function childSource(extra: string): string {
  return `
    import fs from 'node:fs';
    import { DatabaseSync } from 'node:sqlite';
    import { CapturePublicationStore } from ${JSON.stringify(storeUrl)};
    const db = new DatabaseSync(process.argv[1]);
    const store = new CapturePublicationStore(db, process.argv[2]);
    const record = JSON.parse(process.argv[3]);
    const barrier = () => {
      fs.writeSync(1, 'BARRIER\\n');
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0);
    };
    ${extra}
  `;
}

function childArgs(source: string, db: string, dest: string, record: EvidenceManifestV1, staging: string) {
  return ['--disable-warning=ExperimentalWarning', '--experimental-transform-types', '--input-type=module', '-e',
    source, db, dest, JSON.stringify(record), staging];
}

async function killAtBarrier(child: ChildProcess): Promise<void> {
  try {
    await new Promise<void>((resolve, reject) => {
      let errorOutput = '';
      let output = '';
      const timeout = setTimeout(() => reject(new Error(`Missing crash barrier: ${errorOutput}`)), 10_000);
      child.stderr!.on('data', (chunk: Buffer) => { errorOutput += chunk.toString(); });
      child.stdout!.on('data', (chunk: Buffer) => {
        output += chunk.toString();
        if (output.includes('BARRIER')) { clearTimeout(timeout); resolve(); }
      });
      child.once('exit', code => { clearTimeout(timeout); reject(new Error(`Child exited ${code}: ${errorOutput}`)); });
      child.once('error', err => { clearTimeout(timeout); reject(err); });
    });
  } finally {
    if (child.exitCode === null && child.signalCode === null && child.pid) {
      const exited = new Promise(resolve => child.once('exit', resolve));
      child.kill('SIGKILL');
      await exited;
    }
  }
}

async function recoverInChild(args: string[]): Promise<{ discarded: number; confirmed: number; degraded: number }> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    let errorOutput = '';
    child.stdout.on('data', (chunk: Buffer) => { output += chunk; });
    child.stderr.on('data', (chunk: Buffer) => { errorOutput += chunk; });
    child.on('error', reject);
    child.on('close', code => {
      if (code !== 0) { reject(new Error(errorOutput)); return; }
      try { resolve(JSON.parse(output) as { discarded: number; confirmed: number; degraded: number }); }
      catch (error) { reject(error); }
    });
  });
}

it('rolls back before commit and rolls forward after commit with two competing recovery processes', async () => {
  const root = await mkdtemp(join(tmpdir(), 'qap-as04-publish-'));
  const dest = join(root, 'dest');
  const staging = join(root, 'staging');
  const db = join(root, 'qap.sqlite');
  mkdirSync(dest);
  mkdirSync(staging);
  const run = new DatabaseSync(db);
  run.exec('PRAGMA journal_mode = WAL; CREATE TABLE runs (attempt_id TEXT PRIMARY KEY)');
  try {
    for (const [attempt, killPoint] of [['before', 'before'], ['after', 'after']] as const) {
      const source = childSource(`
        ${killPoint === 'after' ? 'store.reconcile = barrier;' : ''}
        store.publish(record, process.argv[4], () => true, activeDb => {
          activeDb.prepare('INSERT INTO runs (attempt_id) VALUES (?)').run(record.attempt_id);
          ${killPoint === 'before' ? 'barrier();' : ''}
        });
      `);
      const args = childArgs(source, db, dest, { ...manifest, attempt_id: attempt }, staging);
      await killAtBarrier(spawn(process.execPath, args, { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] }));
    }

    expect(run.prepare('SELECT attempt_id FROM runs').all()).toEqual([{ attempt_id: 'after' }]);
    expect((await readdir(dest)).sort()).toEqual(['capture-after', 'capture-before']);
    expect(await readdir(join(dest, 'capture-after'))).toEqual(['evidence-manifest.v1.json']);

    const args = childArgs(childSource('console.log(JSON.stringify(store.reconcile())); db.close();'),
      db, dest, manifest, staging);
    const results = await Promise.all([recoverInChild(args), recoverInChild(args)]);
    expect(results.sort((a, b) => b.confirmed - a.confirmed)).toEqual([
      { discarded: 1, confirmed: 1, degraded: 0 },
      { discarded: 0, confirmed: 0, degraded: 0 },
    ]);
    expect(await readdir(dest)).toEqual(['capture-after']);
    const receipt = await readFile(join(dest, 'capture-after', '.qap-committed'), 'utf8');
    expect(receipt).toMatch(/^[0-9a-f]{64}$/);
    expect(run.prepare('SELECT attempt_id, manifest_sha256, integrity_degraded FROM capture_publications').all())
      .toEqual([{ attempt_id: 'after', manifest_sha256: receipt, integrity_degraded: 0 }]);

    writeFileSync(join(dest, 'capture-after', 'evidence-manifest.v1.json'), '{}');
    const degraded = JSON.parse(execFileSync(process.execPath, args, { encoding: 'utf8' }));
    expect(degraded).toEqual({ discarded: 0, confirmed: 0, degraded: 1 });
    expect(run.prepare('SELECT attempt_id, integrity_degraded FROM capture_publications').all())
      .toEqual([{ attempt_id: 'after', integrity_degraded: 1 }]);
    expect(run.prepare('SELECT attempt_id FROM runs').all()).toEqual([{ attempt_id: 'after' }]);
  } finally {
    run.close();
    await rm(root, { recursive: true, force: true });
  }
}, 30_000);

it('rejects a revoked publication and a false captured verdict without committing', async () => {
  const root = await mkdtemp(join(tmpdir(), 'qap-as04-publish-denied-'));
  const dest = join(root, 'dest');
  mkdirSync(dest);
  const db = new DatabaseSync(':memory:');
  try {
    db.exec('CREATE TABLE runs (attempt_id TEXT PRIMARY KEY)');
    const store = new CapturePublicationStore(db, dest);
    const insertRun = () => { db.prepare('INSERT INTO runs (attempt_id) VALUES (?)').run('attempt'); };
    let allowed = true;
    expect(() => store.publish(manifest, root, () => allowed, () => {
      insertRun();
      allowed = false;
    })).toThrow(/revoked/);
    expect(db.prepare('SELECT * FROM runs').all()).toEqual([]);
    expect(store.reconcile()).toEqual({ discarded: 1, confirmed: 0, degraded: 0 });
    expect(() => store.publish({ ...manifest, visual_evidence_status: 'captured' }, root, () => true, insertRun))
      .toThrow(/Inconsistent visual evidence status/);
    expect(db.prepare('SELECT * FROM capture_publications').all()).toEqual([]);
  } finally {
    db.close();
    await rm(root, { recursive: true, force: true });
  }
});
