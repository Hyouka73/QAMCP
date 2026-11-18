import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { FileSystemStorage } from '../storage/file-storage.js';

/**
 * VNEXT-014 E01: on Windows, replacing a file that has an open handle fails
 * with EPERM. Lock-free readers in the same process must therefore not overlap
 * an atomic replacement performed by the official writers.
 */
describe('FileSystemStorage same-process reader/replacement coordination', () => {
  const roots: string[] = [];
  const activeRuns: Array<() => Promise<void>> = [];

  afterEach(async () => {
    for (const stopAndDrain of activeRuns.splice(0)) {
      await stopAndDrain();
    }
    for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
  });

  async function hammer(write: (storage: FileSystemStorage, i: number) => Promise<unknown>): Promise<number> {
    const root = mkdtempSync(join(tmpdir(), 'qap-replace-gate-'));
    roots.push(root);
    const storage = new FileSystemStorage({ rootDir: root });
    await storage.writeJson('.qa/project/lifecycle.json', { i: -1 });
    let stop = false;
    let reads = 0;
    const readers = [0, 1, 2].map(async () => {
      while (!stop) {
        const parsed = JSON.parse(await storage.read('.qa/project/lifecycle.json')) as { i: number };
        expect(typeof parsed.i).toBe('number');
        reads++;
      }
    });
    const writer = (async () => {
      for (let i = 0; i < 60 && !stop; i++) await write(storage, i);
    })();
    activeRuns.push(async () => {
      stop = true;
      await Promise.allSettled([writer, ...readers]);
    });
    try {
      await writer;
    } finally {
      stop = true;
      await Promise.all(readers);
    }
    return reads;
  }

  it('write() never fails with a concurrent same-process reader and never exposes partial content', async () => {
    const reads = await hammer((storage, i) => storage.writeJson('.qa/project/lifecycle.json', { i }));
    expect(reads).toBeGreaterThan(0);
  }, 15_000);

  it('updateLifecycleState() never fails with a concurrent same-process reader', async () => {
    const reads = await hammer((storage, i) => storage.updateLifecycleState(state => ({ ...state, history: [], session: { ...state.session, id: 'w' + i } })));
    expect(reads).toBeGreaterThan(0);
  }, 15_000);
});
