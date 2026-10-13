import { execSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FileSystemStorage } from '@qap/knowledge';

import { GitAdapter } from '../git-adapter.js';

function createTestRepo(): string {
  const repoDir = mkdtempSync(join(tmpdir(), 'qap-git-adapter-test-'));

  execSync('git init -b main', { cwd: repoDir });
  execSync('git config user.email "test@qap.local"', { cwd: repoDir });
  execSync('git config user.name "QAP Test"', { cwd: repoDir });

  mkdirSync(join(repoDir, 'src', 'checkout'), { recursive: true });
  writeFileSync(join(repoDir, 'src', 'checkout', 'cart.ts'), 'export const cart = 1;\n');
  mkdirSync(join(repoDir, 'src', 'auth'), { recursive: true });
  writeFileSync(join(repoDir, 'src', 'auth', 'login.ts'), 'export const login = 1;\n');

  execSync('git add .', { cwd: repoDir });
  execSync('git commit -m "base"', { cwd: repoDir });

  return repoDir;
}

describe('GitAdapter (S75-001)', () => {
  let repoDir: string;

  beforeEach(() => {
    repoDir = createTestRepo();
  });

  afterEach(() => {
    rmSync(repoDir, { recursive: true, force: true });
  });

  it('devuelve un arreglo vacío si no hay cambios sin commitear', () => {
    const adapter = new GitAdapter({ cwd: repoDir, baseBranch: 'main' });
    expect(adapter.getChangedFiles()).toEqual([]);
  });

  it('detecta un archivo modificado respecto a la rama base', () => {
    writeFileSync(join(repoDir, 'src', 'checkout', 'cart.ts'), 'export const cart = 2;\n');

    const adapter = new GitAdapter({ cwd: repoDir, baseBranch: 'main' });
    const files = adapter.getChangedFiles();

    expect(files).toContain('src/checkout/cart.ts');
  });

  it('normaliza las rutas a POSIX sin backslashes', () => {
    writeFileSync(join(repoDir, 'src', 'auth', 'login.ts'), 'export const login = 2;\n');

    const adapter = new GitAdapter({ cwd: repoDir, baseBranch: 'main' });
    const files = adapter.getChangedFiles();

    for (const file of files) {
      expect(file).not.toContain('\\');
    }
  });

  it('mapea un archivo modificado al módulo correcto vía repo-map.json', async () => {
    const storage = new FileSystemStorage({ rootDir: repoDir });
    await storage.mkdir('.qa/modules/checkout');
    await storage.saveRepoMap('checkout', {
      _version: '1',
      module: 'checkout',
      files: ['src/checkout/cart.ts'],
    });
    await storage.mkdir('.qa/modules/auth');
    await storage.saveRepoMap('auth', {
      _version: '1',
      module: 'auth',
      files: ['src/auth/login.ts'],
    });

    writeFileSync(join(repoDir, 'src', 'checkout', 'cart.ts'), 'export const cart = 2;\n');

    const adapter = new GitAdapter({ cwd: repoDir, baseBranch: 'main' });
    const affected = await adapter.getAffectedModules(storage);

    expect(affected).toEqual(['checkout']);
    expect(affected).not.toContain('auth');
  });

  it('devuelve un arreglo vacío si ningún módulo registra el archivo modificado', async () => {
    const storage = new FileSystemStorage({ rootDir: repoDir });
    await storage.mkdir('.qa/modules/checkout');
    await storage.saveRepoMap('checkout', {
      _version: '1',
      module: 'checkout',
      files: ['src/checkout/other-file.ts'],
    });

    writeFileSync(join(repoDir, 'src', 'checkout', 'cart.ts'), 'export const cart = 2;\n');

    const adapter = new GitAdapter({ cwd: repoDir, baseBranch: 'main' });
    const affected = await adapter.getAffectedModules(storage);

    expect(affected).toEqual([]);
  });
});