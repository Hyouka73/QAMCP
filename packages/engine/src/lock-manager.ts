import type { IStorage } from './ports.js';

export interface LockOptions {
  staleTimeoutMs?: number; // Por defecto 10 minutos (600000 ms)
}

export interface LockInfo {
  lockedAt: string;
  owner: string;
}

export type LockStorage = Pick<IStorage, 'exists' | 'readJson' | 'writeJson' | 'delete'>;

export class LockManager {
  constructor(
    private readonly storage: LockStorage,
    private readonly options: LockOptions = {}
  ) {}

  private getLockPath(moduleName: string): string {
    return `.qa/modules/${moduleName}/.lock.json`;
  }

  async acquire(moduleName: string, owner: string = 'cli-process'): Promise<void> {
    const lockPath = this.getLockPath(moduleName);
    const staleTimeout = this.options.staleTimeoutMs ?? 10 * 60 * 1000;

    const exists = await this.storage.exists(lockPath);
    if (exists) {
      try {
        const lockData = await this.storage.readJson<LockInfo>(lockPath);
        const lockedTime = new Date(lockData.lockedAt).getTime();
        const now = Date.now();

        if (!isNaN(lockedTime) && now - lockedTime < staleTimeout) {
          throw new Error(
            `El módulo '${moduleName}' se encuentra bloqueado por '${lockData.owner}' desde ${lockData.lockedAt}.`
          );
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes('se encuentra bloqueado')) {
          throw err;
        }
      }
    }

    const lockInfo: LockInfo = {
      lockedAt: new Date().toISOString(),
      owner,
    };

    await this.storage.writeJson(lockPath, lockInfo);
  }

  async release(moduleName: string): Promise<boolean> {
    const lockPath = this.getLockPath(moduleName);
    const exists = await this.storage.exists(lockPath);
    if (exists) {
      await this.storage.delete(lockPath);
      return true;
    }
    return false;
  }

  async forceUnlock(moduleName: string): Promise<void> {
    await this.release(moduleName);
  }

  async isLocked(moduleName: string): Promise<boolean> {
    const lockPath = this.getLockPath(moduleName);
    const exists = await this.storage.exists(lockPath);
    if (!exists) return false;

    const staleTimeout = this.options.staleTimeoutMs ?? 10 * 60 * 1000;
    try {
      const lockData = await this.storage.readJson<LockInfo>(lockPath);
      const lockedTime = new Date(lockData.lockedAt).getTime();
      const now = Date.now();

      if (!isNaN(lockedTime) && now - lockedTime >= staleTimeout) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }
}