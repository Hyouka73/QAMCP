import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { handleClean } from '../commands/clean.js';

describe('Suite de Comando CLI Clean / Reset', () => {
  let tempDir: string;
  let originalCwd: () => string;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'qap-clean-test-'));
    originalCwd = process.cwd;
    process.cwd = () => tempDir;

    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.cwd = originalCwd;
    rmSync(tempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('debe informar si el directorio .qa/ no existe', async () => {
    await handleClean({ force: true });

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Directorio .qa/ no existe')
    );
  });

  it('debe eliminar por completo el directorio .qa/ y locks con --force', async () => {
    const qaDir = join(tempDir, '.qa');
    const locksDir = join(qaDir, 'cache', 'locks');
    mkdirSync(locksDir, { recursive: true });
    writeFileSync(join(locksDir, 'execution.lock'), 'locked', 'utf-8');
    writeFileSync(join(qaDir, 'test.txt'), 'hello', 'utf-8');

    expect(existsSync(qaDir)).toBe(true);
    expect(existsSync(join(locksDir, 'execution.lock'))).toBe(true);

    await handleClean({ force: true });

    expect(existsSync(qaDir)).toBe(false);
    expect(logSpy).toHaveBeenCalledWith(
      '✔ Directorio .qa/ eliminado. Proyecto listo para inicialización limpia.'
    );
  });

  it('debe funcionar equivalentemente con la flag --yes (-y)', async () => {
    const qaDir = join(tempDir, '.qa');
    mkdirSync(join(qaDir, 'project'), { recursive: true });
    writeFileSync(join(qaDir, 'project', 'config.json'), '{}', 'utf-8');

    expect(existsSync(qaDir)).toBe(true);

    await handleClean({ yes: true });

    expect(existsSync(qaDir)).toBe(false);
    expect(logSpy).toHaveBeenCalledWith(
      '✔ Directorio .qa/ eliminado. Proyecto listo para inicialización limpia.'
    );
  });
});
