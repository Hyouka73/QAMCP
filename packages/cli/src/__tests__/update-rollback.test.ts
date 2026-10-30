import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { FileSystemStorage } from '@qap/knowledge';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import YAML from 'yaml';

import { handleRollback } from '../commands/rollback.js';
import { handleUpdate } from '../commands/update.js';
import { DataError } from '../errors.js';
import { computeModuleSemanticHash } from '../lib/module-semantic-hash.js';

const sha256 = (filePath: string): string => createHash('sha256').update(readFileSync(filePath)).digest('hex');

describe('qap update + qap rollback (S75-015 / S75-016)', () => {
  let rootDir: string;
  let originalCwd: string;
  let logSpy: ReturnType<typeof vi.spyOn>;

  const moduleDir = (): string => join(rootDir, '.qa', 'modules', 'checkout');
  const backupsDir = (): string => join(rootDir, '.qa', 'cache', 'backups', 'checkout');
  const logged = (): string => logSpy.mock.calls.map((call: unknown[]) => call.join(' ')).join('\n');

  beforeEach(() => {
    rootDir = mkdtempSync(join(tmpdir(), 'qap-update-rollback-'));
    originalCwd = process.cwd();
    process.chdir(rootDir);
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(rootDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  async function seedOriginalModule(): Promise<void> {
    mkdirSync(moduleDir(), { recursive: true });
    writeFileSync(
      join(moduleDir(), 'context.yaml'),
      YAML.stringify({
        _version: '2',
        module: 'checkout',
        description: 'original',
        tags: ['old'],
        base_route: '/checkout-viejo',
      })
    );
    await new FileSystemStorage({ rootDir }).saveModuleSelectors('checkout', {
      selectors: { email: '#old-email' },
      metadata: { generated_at: new Date().toISOString(), source: 'test' },
    });

    mkdirSync(join(rootDir, '.qa', 'cache', 'discover'), { recursive: true });
    writeFileSync(
      join(rootDir, '.qa', 'cache', 'discover', 'checkout.module.json'),
      JSON.stringify({
        name: 'checkout',
        path: '/checkout',
        description: 'nueva descripcion desde discover',
        tags: ['nuevo'],
        cases: [],
        context: { inputs: [{ key: 'email', selector: '#new-email' }] },
      })
    );
  }

  it('update seguido de rollback devuelve el módulo al estado previo con el mismo SHA-256', async () => {
    await seedOriginalModule();
    const contextPath = join(moduleDir(), 'context.yaml');
    const selectorsPath = join(moduleDir(), 'selectors.json');
    const contextShaBefore = sha256(contextPath);
    const selectorsShaBefore = sha256(selectorsPath);
    const semanticHashBefore = computeModuleSemanticHash(moduleDir()).hash;

    await handleUpdate('checkout', { yes: true });

    // El update realmente cambió el módulo y dejó un respaldo con su hash semántico
    expect(sha256(contextPath)).not.toBe(contextShaBefore);
    expect(sha256(selectorsPath)).not.toBe(selectorsShaBefore);
    const snapshotId = readdirSync(backupsDir())[0];
    expect(existsSync(join(backupsDir(), snapshotId, 'semantic-hash.json'))).toBe(true);

    await handleRollback('checkout', { yes: true });

    // Coincidencia SHA-256 con el estado previo al update
    expect(sha256(contextPath)).toBe(contextShaBefore);
    expect(sha256(selectorsPath)).toBe(selectorsShaBefore);
    const restoredHash = await new FileSystemStorage({ rootDir }).getSemanticHash('checkout');
    expect(restoredHash?.hash).toBe(semanticHashBefore);
  });

  it('rollback aborta y no toca el módulo si el hash semántico del respaldo fue alterado', async () => {
    await seedOriginalModule();
    await handleUpdate('checkout', { yes: true });

    const snapshotId = readdirSync(backupsDir())[0];
    writeFileSync(
      join(backupsDir(), snapshotId, 'semantic-hash.json'),
      JSON.stringify({ hash: 'hash-alterado', timestamp: 'x', computed_from: [] })
    );

    await expect(handleRollback('checkout', { yes: true })).rejects.toThrow(DataError);
    expect(readFileSync(join(moduleDir(), 'context.yaml'), 'utf-8')).toContain('nueva descripcion desde discover');
  });

  it('rollback con --to inexistente para el módulo lanza DataError', async () => {
    await seedOriginalModule();
    await handleUpdate('checkout', { yes: true });

    await expect(handleRollback('checkout', { to: 'no-existe', yes: true })).rejects.toThrow(DataError);
  });

  it('rollback lista los respaldos disponibles y marca el seleccionado', async () => {
    await seedOriginalModule();
    await handleUpdate('checkout', { yes: true });
    const snapshotId = readdirSync(backupsDir())[0];

    await handleRollback('checkout', { yes: true });

    expect(logged()).toContain(snapshotId);
    expect(logged()).toContain('(seleccionado)');
  });
});