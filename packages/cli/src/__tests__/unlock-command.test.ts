import { mkdirSync, mkdtempSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { handleUnlock } from '../commands/unlock.js';
import { DataError } from '../errors.js';

describe('qap unlock --force (S75-005A)', () => {
  let rootDir: string;
  let originalCwd: string;

  beforeEach(() => {
    rootDir = mkdtempSync(join(tmpdir(), 'qap-unlock-test-'));
    originalCwd = process.cwd();
    process.chdir(rootDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(rootDir, { recursive: true, force: true });
  });

  it('lanza DataError si no se especifica módulo', async () => {
    await expect(handleUnlock(undefined, { force: true })).rejects.toThrow(DataError);
  });

  it('lanza DataError si no se pasa --force', async () => {
    await expect(handleUnlock('checkout', {})).rejects.toThrow(DataError);
  });

  it('libera un lock existente con --force', async () => {
    const lockPath = join(rootDir, '.qa', 'modules', 'checkout', '.lock.json');
    mkdirSync(join(rootDir, '.qa', 'modules', 'checkout'), { recursive: true });
    writeFileSync(lockPath, JSON.stringify({ lockedAt: new Date().toISOString(), owner: 'otro-proceso' }));

    await handleUnlock('checkout', { force: true });

    expect(existsSync(lockPath)).toBe(false);
  });

  it('no falla si el módulo no tenía ningún lock activo', async () => {
    await expect(handleUnlock('checkout', { force: true })).resolves.not.toThrow();
  });
});