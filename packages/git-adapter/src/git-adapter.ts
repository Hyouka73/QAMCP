import { execSync } from 'node:child_process';
import * as path from 'node:path';

import type { IStorage } from '@qap/engine';

export interface GitAdapterOptions {
  cwd?: string;
  baseBranch?: string;
}

export class GitAdapter {
  private cwd: string;
  private baseBranch: string;

  constructor(options: GitAdapterOptions = {}) {
    this.cwd = options.cwd || process.cwd();
    this.baseBranch = options.baseBranch || 'main';
  }

  /**
   * Obtiene la lista de archivos modificados respecto a la rama base,
   * normalizando las rutas a formato POSIX (barras diagonales).
   */
  public getChangedFiles(): string[] {
    try {
      let output = '';
      try {
        output = execSync(`git diff --name-only ${this.baseBranch}`, {
          cwd: this.cwd,
          encoding: 'utf-8',
        });
      } catch {
        output = execSync('git diff --name-only HEAD~1', {
          cwd: this.cwd,
          encoding: 'utf-8',
        });
      }

      const files = output
        .split('\n')
        .map((file) => file.trim())
        .filter(Boolean);

      return files.map((file) => file.split(path.sep).join('/'));
    } catch {
      return [];
    }
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