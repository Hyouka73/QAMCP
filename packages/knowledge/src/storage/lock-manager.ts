import { existsSync, mkdirSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import lockfile from 'proper-lockfile';

export interface LockManagerOptions {
  rootDir?: string;
}

export class LockManager {
  private rootDir: string;
  private locksDir: string;

  constructor(options: LockManagerOptions = {}) {
    this.rootDir = options.rootDir ?? process.cwd();
    this.locksDir = join(this.rootDir, '.qa', 'cache', 'locks');
  }

  private getPaths(moduleName: string): { targetPath: string; lockfilePath: string } {
    const targetPath = join(this.locksDir, `${moduleName}.target`);
    const lockfilePath = join(this.locksDir, `${moduleName}.lock`);
    return { targetPath, lockfilePath };
  }

  /**
   * Bloquea por módulo creando un archivo centinela .target y fijando lockfilePath en .qa/cache/locks/
   */
  async acquireModuleLock(moduleName: string): Promise<() => Promise<void>> {
    if (!existsSync(this.locksDir)) {
      mkdirSync(this.locksDir, { recursive: true });
    }

    const { targetPath, lockfilePath } = this.getPaths(moduleName);

    if (!existsSync(targetPath)) {
      mkdirSync(dirname(targetPath), { recursive: true });
      writeFileSync(targetPath, '', 'utf-8');
    }

    try {
      const release = await lockfile.lock(targetPath, {
        retries: 0,
        stale: 30000,
        update: 5000,
        lockfilePath,
      });

      return async () => {
        try {
          await release();
        } catch {
          // Ignorar si ya fue liberado
        }
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`lock_timeout: El módulo '${moduleName}' se encuentra bloqueado por otro proceso (${msg}).`);
    }
  }

  /**
   * Implementa forceUnlock(moduleName?) eliminando los .lock y archivos asociados en .qa/cache/locks/
   */
    async forceUnlock(moduleName?: string): Promise<void> {
    if (moduleName) {
      this.removeLockFiles(moduleName);
      return;
    }

    // Sin moduleName: libera todos los locks activos en .qa/cache/locks/.
    if (!existsSync(this.locksDir)) {
      return;
    }

    const lockFiles = readdirSync(this.locksDir).filter((f) => f.endsWith('.target'));
    for (const file of lockFiles) {
      const name = file.slice(0, -'.target'.length);
      this.removeLockFiles(name);
    }
  }

  private removeLockFiles(moduleName: string): void {
    const { targetPath, lockfilePath } = this.getPaths(moduleName);
    try {
      if (existsSync(lockfilePath)) {
        rmSync(lockfilePath, { recursive: true, force: true });
      }
      if (existsSync(targetPath)) {
        rmSync(targetPath, { force: true });
      }
    } catch {
      // Ignorar errores de limpieza forzada
    }
  }
}