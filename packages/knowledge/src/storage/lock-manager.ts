import { existsSync, mkdirSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';

import type { IFlowLockProvider } from '@qap/engine';
import lockfile from 'proper-lockfile';

export interface LockManagerOptions {
  rootDir?: string;
}

export class LockManager implements IFlowLockProvider {
  private static readonly activeReleases = new Map<string, () => Promise<void>>();
  private rootDir: string;
  private locksDir: string;

  constructor(options: LockManagerOptions = {}) {
    this.rootDir = options.rootDir ?? process.cwd();
    this.locksDir = join(this.rootDir, '.qa', 'cache', 'locks');
  }

  private static normalizeLockKey(lockfilePath: string): string {
    const resolved = resolve(lockfilePath);
    return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
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
      // AQUÍ SE REEMPLAZÓ `retries: 0` POR LA CONFIGURACIÓN DE REINTENTOS:
      const release = await lockfile.lock(targetPath, {
        retries: {
          retries: 5,
          minTimeout: 100,
          maxTimeout: 1000,
        },
        stale: 30000,
        update: 5000,
        lockfilePath,
      });

      const lockKey = LockManager.normalizeLockKey(lockfilePath);
      LockManager.activeReleases.set(lockKey, release);

      return async () => {
        if (LockManager.activeReleases.get(lockKey) === release) {
          LockManager.activeReleases.delete(lockKey);
        }
        try {
          await release();
        } catch {
          // Ignorar si ya fue liberado
        }
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`lock_timeout: El módulo '${moduleName}' se encuentra bloqueado por otro proceso (${msg}).`, { cause: err });
    }
  }

  /**
   * Implementa forceUnlock(moduleName?) eliminando los .lock y archivos asociados en .qa/cache/locks/
   */
  async forceUnlock(moduleName?: string): Promise<void> {
    await this.releaseActiveLocks(moduleName);
    this.removeModuleLocks(moduleName);
  }

  private async releaseActiveLocks(moduleName?: string): Promise<void> {
    if (moduleName) {
      const { lockfilePath } = this.getPaths(moduleName);
      const lockKey = LockManager.normalizeLockKey(lockfilePath);
      const release = LockManager.activeReleases.get(lockKey);
      if (release) {
        LockManager.activeReleases.delete(lockKey);
        try {
          await release();
        } catch {
          // Ignorar si ya fue liberado o eliminado
        }
      }
      return;
    }

    const locksDirPrefix = `${LockManager.normalizeLockKey(this.locksDir)}${sep}`;
    const matchingKeys: string[] = [];
    for (const key of LockManager.activeReleases.keys()) {
      if (key.startsWith(locksDirPrefix)) {
        matchingKeys.push(key);
      }
    }

    for (const key of matchingKeys) {
      const release = LockManager.activeReleases.get(key);
      LockManager.activeReleases.delete(key);
      if (release) {
        try {
          await release();
        } catch {
          // Ignorar si ya fue liberado o eliminado
        }
      }
    }
  }

  private removeModuleLocks(moduleName?: string): void {
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
  
  /**
   * Adquiere locks para múltiples módulos en orden alfabético ascendente y los libera en orden inverso (S82-001).
   */
  async withModulesLock<T>(moduleNames: string[], fn: () => Promise<T>): Promise<T> {
    const uniqueModules = Array.from(new Set(moduleNames)).sort((a, b) => a.localeCompare(b));
    const releaseFunctions: Array<() => Promise<void>> = [];

    try {
      for (const moduleName of uniqueModules) {
        const release = await this.acquireModuleLock(moduleName);
        releaseFunctions.push(release);
      }
      return await fn();
    } finally {
      for (let i = releaseFunctions.length - 1; i >= 0; i--) {
        try {
          await releaseFunctions[i]();
        } catch {
          // Ignorar errores al liberar en bloque
        }
      }
    }
  }
}