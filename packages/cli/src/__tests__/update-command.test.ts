import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import YAML from 'yaml';

import { handleUpdate } from '../commands/update.js';
import { DataError } from '../errors.js';


describe('qap update (S7-008)', () => {
  let rootDir: string;
  let originalCwd: string;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    rootDir = mkdtempSync(join(tmpdir(), 'qap-update-test-'));
    originalCwd = process.cwd();
    process.chdir(rootDir);
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(rootDir, { recursive: true, force: true });
    logSpy.mockRestore();
    vi.restoreAllMocks();
  });

  function seedModule(): void {
    mkdirSync(join(rootDir, '.qa', 'modules', 'checkout'), { recursive: true });
    writeFileSync(
      join(rootDir, '.qa', 'modules', 'checkout', 'context.yaml'),
      YAML.stringify({ _version: '2', module: 'checkout', description: 'original', tags: ['old'] })
    );
  }

  function seedDiscoveredCache(overrides: Record<string, unknown> = {}): void {
    mkdirSync(join(rootDir, '.qa', 'cache', 'discover'), { recursive: true });
    writeFileSync(
      join(rootDir, '.qa', 'cache', 'discover', 'checkout.module.json'),
      JSON.stringify({
        name: 'checkout',
        path: '/checkout',
        description: 'nueva descripcion desde discover',
        tags: ['nuevo'],
        cases: [],
        ...overrides,
      })
    );
  }

  it('lanza DataError si no se especifica módulo', async () => {
    await expect(handleUpdate(undefined, {})).rejects.toThrow(DataError);
  });

  it('lanza DataError si el módulo no existe', async () => {
    await expect(handleUpdate('inexistente', {})).rejects.toThrow(DataError);
  });

  it('en modo --dry-run no modifica ningún archivo aunque haya diffs', async () => {
    seedModule();
    seedDiscoveredCache();

    await handleUpdate('checkout', { dryRun: true });

    const content = readFileSync(join(rootDir, '.qa', 'modules', 'checkout', 'context.yaml'), 'utf-8');
    expect(content).toContain('original');
    expect(content).not.toContain('nueva descripcion desde discover');
  });

  it('aplica los cambios y crea un backup cuando hay diffs reales (modo no interactivo)', async () => {
    seedModule();
    seedDiscoveredCache();

    await handleUpdate('checkout', {});

    const content = readFileSync(join(rootDir, '.qa', 'modules', 'checkout', 'context.yaml'), 'utf-8');
    expect(content).toContain('nueva descripcion desde discover');

    const backupsDir = join(rootDir, '.qa', 'cache', 'backups', 'checkout');
    expect(existsSync(backupsDir)).toBe(true);
  });

  it('respeta manually_edited: true y NO sobrescribe el módulo', async () => {
    mkdirSync(join(rootDir, '.qa', 'modules', 'checkout'), { recursive: true });
    writeFileSync(
      join(rootDir, '.qa', 'modules', 'checkout', 'context.yaml'),
      YAML.stringify({ _version: '2', module: 'checkout', description: 'editado a mano', manually_edited: true })
    );
    seedDiscoveredCache();

    await handleUpdate('checkout', {});

    const content = readFileSync(join(rootDir, '.qa', 'modules', 'checkout', 'context.yaml'), 'utf-8');
    expect(content).toContain('editado a mano');
    expect(content).not.toContain('nueva descripcion desde discover');
  });

  it('no crea backup ni escribe nada si no hay diffs (ya está sincronizado)', async () => {
    seedModule();
    seedDiscoveredCache({ description: 'original', tags: ['old'], path: undefined });

    await handleUpdate('checkout', {});

    const backupsDir = join(rootDir, '.qa', 'cache', 'backups', 'checkout');
    expect(existsSync(backupsDir)).toBe(false);
  });
  it('deriva y aplica selectores desde el Module cacheado por discover', async () => {
    seedModule ();
    mkdirSync(join(rootDir, '.qa', 'cache', 'discover'), { recursive: true });
    writeFileSync(
      join(rootDir, '.qa', 'cache', 'discover', 'checkout.module.json'),
      JSON.stringify({
        name: 'checkout',
        path: '/checkout',
        description: 'original',
        tags: ['old'],
        cases: [],
        context: {
          forms: [
            { inputs: [{ key: 'email', selector: '#email-input' }] },
          ],
          inputs : [{key: 'search', selector: 'input[name="q"]'}],
        },
      })
    );

    await handleUpdate('checkout', { diff: false });

    const selectorsPath = join(rootDir, '.qa', 'modules', 'checkout', 'selectors.json');
    const saved = JSON.parse(readFileSync(selectorsPath, 'utf-8')) as {
      selectors: Record<string, string>;
    };

    expect(saved.selectors.email).toBe('#email-input');
    expect(saved.selectors.search).toBe('input[name="q"]'); 
  });

  it('con --diff, cancela la operacion si el usuario no confirma', async () => {
    const { confirm } = await import('@inquirer/prompts');
    vi.spyOn({ confirm}, 'confirm');
    seedModule();
    seedDiscoveredCache();

    vi.doMock('@inquirer/prompts', () => ({ confirm: vi.fn().mockResolvedValue(false) }));
  })
});