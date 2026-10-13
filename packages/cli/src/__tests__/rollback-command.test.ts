import { mkdirSync, mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { handleRollback } from '../commands/rollback.js';
import { DataError } from '../errors.js';

describe('qap rollback (S7-008)', () => {
  let rootDir: string;
  let originalCwd: string;

  beforeEach(() => {
    rootDir = mkdtempSync(join(tmpdir(), 'qap-rollback-test-'));
    originalCwd = process.cwd();
    process.chdir(rootDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(rootDir, { recursive: true, force: true });
  });

  it('lanza DataError si no se especifica módulo', async () => {
    await expect(handleRollback(undefined)).rejects.toThrow(DataError);
  });

  it('lanza DataError si no existen backups para el módulo', async () => {
    await expect(handleRollback('checkout')).rejects.toThrow(DataError);
  });

  it('restaura el context.yaml más reciente desde el backup', async () => {
    const backupDir = join(rootDir, '.qa', 'cache', 'backups', 'checkout', '2026-01-01T00-00-00-000Z');
    mkdirSync(backupDir, { recursive: true });
    writeFileSync(join(backupDir, 'context.yaml'), 'module: checkout\ndescription: version respaldada\n');

    mkdirSync(join(rootDir, '.qa', 'modules', 'checkout'), { recursive: true });
    writeFileSync(
      join(rootDir, '.qa', 'modules', 'checkout', 'context.yaml'),
      'module: checkout\ndescription: version actual rota\n'
    );

    await handleRollback('checkout');

    const restored = readFileSync(join(rootDir, '.qa', 'modules', 'checkout', 'context.yaml'), 'utf-8');
    expect(restored).toContain('version respaldada');
  });
});
