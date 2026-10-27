import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { FileSystemStorage } from '@qap/knowledge';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import YAML from 'yaml';

import { handleUpdate } from '../commands/update.js';
import { DataError } from '../errors.js';

const { confirmMock } = vi.hoisted(() => ({ confirmMock: vi.fn() }));
vi.mock('@inquirer/prompts', () => ({ confirm: confirmMock }));

describe('qap update (S75-015)', () => {
  let rootDir: string;
  let originalCwd: string;
  let logSpy: ReturnType<typeof vi.spyOn>;

  const moduleDir = (): string => join(rootDir, '.qa', 'modules', 'checkout');
  const backupsDir = (): string => join(rootDir, '.qa', 'cache', 'backups', 'checkout');
  const logged = (): string => logSpy.mock.calls.map((call: unknown[]) => call.join(' ')).join('\n');
  const readContext = (): string => readFileSync(join(moduleDir(), 'context.yaml'), 'utf-8');

  beforeEach(() => {
    rootDir = mkdtempSync(join(tmpdir(), 'qap-update-test-'));
    originalCwd = process.cwd();
    process.chdir(rootDir);
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    confirmMock.mockReset();
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(rootDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  function seedModule(extra: Record<string, unknown> = {}): void {
    mkdirSync(moduleDir(), { recursive: true });
    writeFileSync(
      join(moduleDir(), 'context.yaml'),
      YAML.stringify({ _version: '2', module: 'checkout', description: 'original', tags: ['old'], ...extra })
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

  it('--dry-run no pregunta, no respalda y no modifica ningún archivo', async () => {
    seedModule();
    seedDiscoveredCache();

    await handleUpdate('checkout', { dryRun: true });

    expect(readContext()).toContain('original');
    expect(readContext()).not.toContain('nueva descripcion desde discover');
    expect(confirmMock).not.toHaveBeenCalled();
    expect(existsSync(backupsDir())).toBe(false);
  });

  it('muestra en consola el diff de selectores (antes y nuevo)', async () => {
    seedModule();
    seedDiscoveredCache({ context: { inputs: [{ key: 'email', selector: '#email-input' }] } });

    await handleUpdate('checkout', { dryRun: true });

    expect(logged()).toContain('selectors.email');
    expect(logged()).toContain('#email-input');
  });

  it('sin --yes pide confirmación y, si se rechaza, no modifica ni respalda', async () => {
    confirmMock.mockResolvedValue(false);
    seedModule();
    seedDiscoveredCache();

    await handleUpdate('checkout', {});

    expect(confirmMock).toHaveBeenCalledTimes(1);
    expect(readContext()).toContain('original');
    expect(existsSync(backupsDir())).toBe(false);
  });

  it('sin --yes pide confirmación y, si se acepta, aplica los cambios', async () => {
    confirmMock.mockResolvedValue(true);
    seedModule();
    seedDiscoveredCache();

    await handleUpdate('checkout', {});

    expect(confirmMock).toHaveBeenCalledTimes(1);
    expect(readContext()).toContain('nueva descripcion desde discover');
  });

  it('con --yes aplica sin preguntar, crea backup previo y recalcula el hash semántico', async () => {
    seedModule();
    seedDiscoveredCache({ context: { inputs: [{ key: 'search', selector: 'input[name="q"]' }] } });

    await handleUpdate('checkout', { yes: true });

    expect(confirmMock).not.toHaveBeenCalled();
    expect(readContext()).toContain('nueva descripcion desde discover');

    // El backup conserva el contenido previo a la actualización
    expect(existsSync(backupsDir())).toBe(true);
    const snapshot = readdirSync(backupsDir())[0];
    expect(readFileSync(join(backupsDir(), snapshot, 'context.yaml'), 'utf-8')).toContain('original');

    // El hash semántico quedó recalculado
    const storage = new FileSystemStorage({ rootDir });
    const semanticHash = await storage.getSemanticHash('checkout');
    expect(semanticHash?.hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('deriva y aplica selectores desde el Module cacheado por discover', async () => {
    seedModule();
    seedDiscoveredCache({
      description: 'original',
      tags: ['old'],
      context: {
        forms: [{ inputs: [{ key: 'email', selector: '#email-input' }] }],
        inputs: [{ key: 'search', selector: 'input[name="q"]' }],
      },
    });

    await handleUpdate('checkout', { yes: true });

    const saved = JSON.parse(readFileSync(join(moduleDir(), 'selectors.json'), 'utf-8')) as {
      selectors: Record<string, string>;
    };
    expect(saved.selectors.email).toBe('#email-input');
    expect(saved.selectors.search).toBe('input[name="q"]');
  });

  it('omite context.yaml con manually_edited: true y lo informa', async () => {
    seedModule({ description: 'editado a mano', manually_edited: true });
    seedDiscoveredCache();

    await handleUpdate('checkout', { yes: true });

    expect(readContext()).toContain('editado a mano');
    expect(readContext()).not.toContain('nueva descripcion desde discover');
    expect(logged()).toContain('context.yaml');
  });

  it('con context.yaml protegido igual aplica los cambios de selectores', async () => {
    seedModule({ description: 'editado a mano', manually_edited: true });
    seedDiscoveredCache({ context: { inputs: [{ key: 'search', selector: 'input[name="q"]' }] } });

    await handleUpdate('checkout', { yes: true });

    expect(readContext()).toContain('editado a mano');
    const saved = JSON.parse(readFileSync(join(moduleDir(), 'selectors.json'), 'utf-8')) as {
      selectors: Record<string, string>;
    };
    expect(saved.selectors.search).toBe('input[name="q"]');
  });

  it('omite rules.yaml y cada TC-*.yaml con manually_edited: true, y los deja intactos', async () => {
    seedModule();
    writeFileSync(join(moduleDir(), 'rules.yaml'), YAML.stringify({ manually_edited: true, rules: [] }));
    mkdirSync(join(moduleDir(), 'tests'), { recursive: true });
    writeFileSync(join(moduleDir(), 'tests', 'TC-abc.yaml'), YAML.stringify({ manually_edited: true }));
    writeFileSync(join(moduleDir(), 'tests', 'TC-def.yaml'), YAML.stringify({ id: 'def' }));
    seedDiscoveredCache();

    await handleUpdate('checkout', { yes: true });

    expect(logged()).toContain('rules.yaml');
    expect(logged()).toContain('TC-abc.yaml');
    expect(logged()).not.toContain('TC-def.yaml');
    expect(readFileSync(join(moduleDir(), 'rules.yaml'), 'utf-8')).toContain('manually_edited: true');
    expect(readFileSync(join(moduleDir(), 'tests', 'TC-abc.yaml'), 'utf-8')).toContain('manually_edited: true');
  });

  it('con --force ignora manually_edited y sobrescribe context.yaml', async () => {
    seedModule({ description: 'editado a mano', manually_edited: true });
    seedDiscoveredCache();

    await handleUpdate('checkout', { yes: true, force: true });

    expect(readContext()).toContain('nueva descripcion desde discover');
  });

  it('no crea backup ni escribe nada si no hay diffs (ya está sincronizado)', async () => {
    seedModule();
    seedDiscoveredCache({ description: 'original', tags: ['old'], path: undefined });

    await handleUpdate('checkout', { yes: true });

    expect(existsSync(backupsDir())).toBe(false);
  });
});