import { spawnSync } from 'node:child_process';

import type { IStorage } from '@qap/engine';

export interface GitAdapterOptions {
  cwd?: string;
  /** Short branch name or a fully qualified refs/heads/ or refs/remotes/ name. */
  baseBranch?: string;
}

export class GitDiffError extends Error {
  constructor(
    public readonly code: 'invalid_base_ref' | 'missing_base_ref' | 'missing_default_parent' | 'git_failed',
    message: string,
  ) {
    super(message);
    this.name = 'GitDiffError';
  }
}

export class GitAdapter {
  private readonly cwd: string;
  private readonly baseBranch?: string;

  constructor(options: GitAdapterOptions = {}) {
    this.cwd = options.cwd || process.cwd();
    this.baseBranch = options.baseBranch;
  }

  private runGit(args: string[], permittedExitCodes = [0]) {
    const result = spawnSync('git', ['-c', 'core.fsmonitor=false', ...args], {
      cwd: this.cwd,
      encoding: 'utf8',
      windowsHide: true,
      shell: false,
      maxBuffer: 16 * 1024 * 1024,
    });
    if (result.error || result.status === null || !permittedExitCodes.includes(result.status)) {
      throw new GitDiffError('git_failed', `Git no pudo completar ${args[0]} para obtener el diff.`);
    }
    return result;
  }

  private resolveBase(): string {
    const branch = this.baseBranch ?? 'main';
    if (!branch || branch.startsWith('-') || /[^\p{L}\p{M}\p{N}._/-]/u.test(branch)) {
      throw new GitDiffError('invalid_base_ref', 'La referencia base Git no es un nombre de rama admitido.');
    }
    const isQualifiedBranch = branch.startsWith('refs/heads/') || branch.startsWith('refs/remotes/');
    if (branch.startsWith('refs/') && !isQualifiedBranch) {
      throw new GitDiffError('invalid_base_ref', 'La referencia base Git debe identificar una rama local o remota.');
    }
    const refs = isQualifiedBranch ? [branch] : [`refs/heads/${branch}`];
    if (!isQualifiedBranch && branch.includes('/')) refs.push(`refs/remotes/${branch}`);
    const check = this.runGit(['check-ref-format', refs[0]], [0, 1]);
    if (check.status !== 0) {
      throw new GitDiffError('invalid_base_ref', 'La referencia base Git no es un nombre de rama válido.');
    }

    const listed = this.runGit(['for-each-ref', '--format=%(refname)', '--', ...refs]);
    // Git can report broken refs on stderr while successfully listing the rest.
    if (listed.stderr.trim()) {
      throw new GitDiffError('git_failed', 'Git no pudo enumerar las ramas base de forma fiable.');
    }
    const refNames = listed.stdout.split(/\r?\n/);
    const matchingRef = refs.find((ref) => refNames.includes(ref));
    if (matchingRef) {
      return this.runGit(['rev-parse', '--verify', '--end-of-options', `${matchingRef}^{commit}`]).stdout.trim();
    }
    if (this.baseBranch !== undefined) {
      throw new GitDiffError('missing_base_ref', 'La rama base Git indicada no existe.');
    }

    // Only an absent implicit local main can select the fixed first parent.
    this.runGit(['rev-parse', '--verify', '--end-of-options', 'HEAD^{commit}']);
    const parent = this.runGit(['rev-parse', '--verify', '--quiet', '--end-of-options', 'HEAD~1^{commit}'], [0, 1]);
    if (parent.stderr.trim()) {
      throw new GitDiffError('git_failed', 'Git no pudo verificar el primer padre de HEAD.');
    }
    if (parent.status !== 0) {
      throw new GitDiffError('missing_default_parent', 'No existe la rama main local ni se puede resolver el primer padre de HEAD.');
    }
    return parent.stdout.trim();
  }

  /** Git provides POSIX paths; NUL delimiters preserve whitespace and filenames verbatim. */
  public getChangedFiles(): string[] {
    const baseCommit = this.resolveBase();
    if (!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(baseCommit)) {
      throw new GitDiffError('git_failed', 'Git devolvió un identificador de commit inesperado.');
    }
    const { stdout } = this.runGit(['diff', '--no-ext-diff', '--no-textconv', '--name-only', '-z', baseCommit, '--']);
    return stdout.split('\0').filter(Boolean);
  }

  /**
   * Mapea los archivos modificados a los módulos QAP afectados, cruzando
   * la lista de getChangedFiles() contra el repo-map.json de cada módulo
   * (S4-005/S6-002). Un módulo se considera afectado si alguno de sus
   * archivos registrados coincide exactamente, o es prefijo de directorio,
   * con alguno de los archivos modificados (S75-001).
   */
  public async getAffectedModules(storage: IStorage): Promise<string[]> {
    const changedFiles = this.getChangedFiles();
    if (changedFiles.length === 0) {
      return [];
    }

    const moduleNames = await storage.listModules();
    const affected: string[] = [];

    for (const moduleName of moduleNames) {
      const repoMap = await storage.getRepoMap(moduleName);
      if (!repoMap || !repoMap.files || repoMap.files.length === 0) {
        continue;
      }

      const isAffected = repoMap.files.some((moduleFile) =>
        changedFiles.some(
          (changedFile) => changedFile === moduleFile || changedFile.startsWith(`${moduleFile}/`)
        )
      );

      if (isAffected) {
        affected.push(moduleName);
      }
    }

    return affected;
  }
}
