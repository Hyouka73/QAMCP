import { existsSync, mkdirSync, writeFileSync, mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { ModuleBackupManager } from '../plan/module-backup-manager.js';

describe('ModuleBackupManager (S7-008)', () => {
  let rootDir: string;

  beforeEach(() => {
    rootDir = mkdtempSync(join(tmpdir(), 'qap-backup-test-'));
  });

  afterEach(() => {
    rmSync(rootDir, { recursive: true, force: true });
  });

  it('devuelve null si el módulo no tiene carpeta existente', () => {
    const result = ModuleBackupManager.backupModule(rootDir, 'inexistente');
    expect(result).toBeNull();
  });

  it('devuelve null si la carpeta del módulo existe pero no tiene archivos respaldables', () => {
    const moduleDir = join(rootDir, '.qa', 'modules', 'checkout');
    mkdirSync(moduleDir, { recursive: true });

    const result = ModuleBackupManager.backupModule(rootDir, 'checkout');
    expect(result).toBeNull();
  });

  it('copia context.yaml a .qa/cache/backups/<modulo>/<timestamp>/', () => {
    const moduleDir = join(rootDir, '.qa', 'modules', 'checkout');
    mkdirSync(moduleDir, { recursive: true });
    writeFileSync(join(moduleDir, 'context.yaml'), 'module: checkout\ndescription: original\n');

    const backupPath = ModuleBackupManager.backupModule(rootDir, 'checkout');

    expect(backupPath).not.toBeNull();
    expect(existsSync(join(backupPath!, 'context.yaml'))).toBe(true);
    expect(readFileSync(join(backupPath!, 'context.yaml'), 'utf-8')).toContain('original');
  });

  it('listBackups devuelve los backups más recientes primero', () => {
    const moduleDir = join(rootDir, '.qa', 'modules', 'checkout');
    mkdirSync(moduleDir, { recursive: true });
    writeFileSync(join(moduleDir, 'context.yaml'), 'module: checkout\n');

    const first = ModuleBackupManager.backupModule(rootDir, 'checkout');
    const second = ModuleBackupManager.backupModule(rootDir, 'checkout');

    const list = ModuleBackupManager.listBackups(rootDir, 'checkout');

    expect(list.length).toBe(2);
    // El más reciente (second) debe ir primero, por orden reverse() alfabético de timestamp ISO
    expect(join(rootDir, '.qa', 'cache', 'backups', 'checkout', list[0])).toBe(second);
    void first;
  });
});