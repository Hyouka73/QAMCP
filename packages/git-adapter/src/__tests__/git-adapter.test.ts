import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FileSystemStorage } from '@qap/knowledge';

import { GitAdapter } from '../git-adapter.js';

function git(cwd: string, ...args: string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8' });
}

function createTestRepo(): string {
  const repoDir = mkdtempSync(join(tmpdir(), 'qap-git-adapter-test-'));

  git(repoDir, 'init', '-b', 'main');
  git(repoDir, 'config', 'user.email', 'test@qap.local');
  git(repoDir, 'config', 'user.name', 'QAP Test');

  mkdirSync(join(repoDir, 'src', 'checkout'), { recursive: true });
  writeFileSync(join(repoDir, 'src', 'checkout', 'cart.ts'), 'export const cart = 1;\n');
  mkdirSync(join(repoDir, 'src', 'auth'), { recursive: true });
  writeFileSync(join(repoDir, 'src', 'auth', 'login.ts'), 'export const login = 1;\n');

  git(repoDir, 'add', '.');
  git(repoDir, 'commit', '-m', 'base');

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

  it.each(['', '--staged', 'refs/tags/release', 'main~1', 'main..next', 'main@{1}', 'main|next', 'main;next', 'main\nnext', 'main\0next', 'main//other'])(
    'rechaza como referencia de rama %j',
    (baseBranch) => {
      const adapter = new GitAdapter({ cwd: repoDir, baseBranch });
      expect(() => adapter.getChangedFiles()).toThrow(expect.objectContaining({ code: 'invalid_base_ref' }));
    }
  );

  it('acepta ramas locales y remotas exactas, y preserva espacios y Unicode en paths', () => {
    git(repoDir, 'branch', 'release/qa');
    git(repoDir, 'update-ref', 'refs/remotes/origin/qa', 'HEAD');
    const filename = 'cambio ñ con espacios.ts';
    writeFileSync(join(repoDir, filename), 'export {};');
    git(repoDir, 'add', '--', filename);
    for (const baseBranch of ['release/qa', 'refs/heads/release/qa', 'origin/qa', 'refs/remotes/origin/qa']) {
      expect(new GitAdapter({ cwd: repoDir, baseBranch }).getChangedFiles()).toEqual([filename]);
    }
  });

  it('usa el primer padre solo cuando falta la rama main implícita', () => {
    git(repoDir, 'branch', '-m', 'develop');
    git(repoDir, 'tag', 'main');
    git(repoDir, 'branch', 'main/other');
    writeFileSync(join(repoDir, 'src', 'auth', 'login.ts'), 'export const login = 2;\n');
    git(repoDir, 'commit', '-am', 'second');
    expect(new GitAdapter({ cwd: repoDir }).getChangedFiles()).toEqual(['src/auth/login.ts']);
    for (const baseBranch of ['main', 'missing']) {
      expect(() => new GitAdapter({ cwd: repoDir, baseBranch }).getChangedFiles()).toThrow(
        expect.objectContaining({ code: 'missing_base_ref' })
      );
    }
  });

  it('informa ausencia de padre en una historia de un commit', () => {
    git(repoDir, 'branch', '-m', 'develop');
    expect(() => new GitAdapter({ cwd: repoDir }).getChangedFiles()).toThrow(
      expect.objectContaining({ code: 'missing_default_parent' })
    );
  });

  it('propaga un fallo real de diff aunque exista un primer padre', () => {
    git(repoDir, 'commit', '--allow-empty', '-m', 'second');
    writeFileSync(join(repoDir, '.git', 'index'), 'invalid index fixture');
    expect(() => new GitAdapter({ cwd: repoDir }).getChangedFiles()).toThrow(
      expect.objectContaining({ code: 'git_failed', message: expect.stringContaining('diff') })
    );
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
