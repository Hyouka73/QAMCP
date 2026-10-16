import { mkdirSync, mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import crypto from 'node:crypto';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { handleRollback } from '../commands/rollback.js';
import { DataError } from '../errors.js';

function calculateSha256(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

describe('qap rollback (S7-008 & S75-016)', () => {
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

  it('lanza DataError si no se especifica módulo o flag --to', async () => {
    await expect(handleRollback(undefined, {})).rejects.toThrow(DataError);
  });

  it('lanza DataError si no existen backups para el módulo', async () => {
    await expect(handleRollback('checkout', {})).rejects.toThrow(DataError);
  });

  it('restaura el context.yaml más reciente desde el backup por módulo', async () => {
    const backupDir = join(rootDir, '.qa', 'cache', 'backups', 'checkout', '2026-01-01T00-00-00-000Z');
    mkdirSync(backupDir, { recursive: true });
    writeFileSync(join(backupDir, 'context.yaml'), 'module: checkout\ndescription: version respaldada\n');

    mkdirSync(join(rootDir, '.qa', 'modules', 'checkout'), { recursive: true });
    writeFileSync(
      join(rootDir, '.qa', 'modules', 'checkout', 'context.yaml'),
      'module: checkout\ndescription: version actual rota\n'
    );

    await handleRollback('checkout', {});

    const restored = readFileSync(join(rootDir, '.qa', 'modules', 'checkout', 'context.yaml'), 'utf-8');
    expect(restored).toContain('version respaldada');
  });

  it('restaura limpiamente usando --to <id> con validación de integridad SHA-256 correcta', async () => {
    const backupId = 'backup-v1';
    const backupDir = join(rootDir, '.qa', 'cache', 'backups', 'checkout', backupId);
    mkdirSync(backupDir, { recursive: true });

    const fileContent = 'module: checkout\ndescription: version segura con hash\n';
    const fileHash = calculateSha256(fileContent);

    writeFileSync(join(backupDir, 'context.yaml'), fileContent);
    writeFileSync(
      join(backupDir, 'manifest.json'),
      JSON.stringify({
        files: {
          'context.yaml': fileHash,
        },
      })
    );

    await handleRollback(undefined, { to: backupId });

    const restored = readFileSync(join(rootDir, '.qa', 'modules', 'checkout', 'context.yaml'), 'utf-8');
    expect(restored).toContain('version segura con hash');
  });

  it('aborta con DataError y no aplica cambios si el hash SHA-256 no coincide (corrupto)', async () => {
    const backupId = 'backup-corrupto';
    const backupDir = join(rootDir, '.qa', 'cache', 'backups', 'checkout', backupId);
    mkdirSync(backupDir, { recursive: true });

    const fileContent = 'contenido alterado maliciosamente\n';
    writeFileSync(join(backupDir, 'context.yaml'), fileContent);
    writeFileSync(
      join(backupDir, 'manifest.json'),
      JSON.stringify({
        files: {
          'context.yaml': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', // Hash falso de SHA256 vacío
        },
      })
    );

    const targetFile = join(rootDir, '.qa', 'modules', 'checkout', 'context.yaml');
    mkdirSync(join(rootDir, '.qa', 'modules', 'checkout'), { recursive: true });
    writeFileSync(targetFile, 'contenido original intacto\n');

    await expect(handleRollback(undefined, { to: backupId })).rejects.toThrow(DataError);

    // Validar que el archivo original NO fue tocado debido al fallo de integridad
    const current = readFileSync(targetFile, 'utf-8');
    expect(current).toContain('contenido original intacto');
  });
  it('ciclo real: ModuleBackupManager genera manifest.json y rollback lo valida correctamente', async () => {
    const { ModuleBackupManager } = await import('@qap/knowledge');

    mkdirSync(join(rootDir, '.qa', 'modules', 'checkout', 'tests'), { recursive: true });
    writeFileSync(join(rootDir, '.qa', 'modules', 'checkout', 'context.yaml'), 'module: checkout\ndescription: v1\n');
    writeFileSync(join(rootDir, '.qa', 'modules', 'checkout', 'tests', 'plan.json'), '{"modules":["checkout"]}');

    const backupPath = ModuleBackupManager.backupModule(rootDir, 'checkout');
    expect(backupPath).not.toBeNull();

    // Simula que 'checkout' cambió después del backup.
    writeFileSync(join(rootDir, '.qa', 'modules', 'checkout', 'context.yaml'), 'module: checkout\ndescription: v2 rota\n');

    const backupId = backupPath!.split(/[\\/]/).pop()!;
    await handleRollback(undefined, { to: backupId });

    const restoredContext = readFileSync(join(rootDir, '.qa', 'modules', 'checkout', 'context.yaml'), 'utf-8');
    expect(restoredContext).toContain('v1');

    const restoredPlan = readFileSync(join(rootDir, '.qa', 'modules', 'checkout', 'tests', 'plan.json'), 'utf-8');
    expect(restoredPlan).toContain('checkout');
  });

    it('valida integridad también en el flujo sin --to (solo nombre de módulo)', async () => {
    const { ModuleBackupManager } = await import('@qap/knowledge');

    mkdirSync(join(rootDir, '.qa', 'modules', 'checkout'), { recursive: true });
    writeFileSync(join(rootDir, '.qa', 'modules', 'checkout', 'context.yaml'), 'module: checkout\ndescription: original\n');

    ModuleBackupManager.backupModule(rootDir, 'checkout');

    const backupsDir = join(rootDir, '.qa', 'cache', 'backups', 'checkout');
    const fs2 = await import('node:fs');
    const createdBackups = fs2.readdirSync(backupsDir);
    const manifestPath = join(backupsDir, createdBackups[0], 'manifest.json');
    const manifest = JSON.parse(fs2.readFileSync(manifestPath, 'utf-8')) as { files: Record<string, string> };
    manifest.files['context.yaml'] = 'hash-invalido-forzado';
    fs2.writeFileSync(manifestPath, JSON.stringify(manifest));

    await expect(handleRollback('checkout', {})).rejects.toThrow(DataError);
  });
});