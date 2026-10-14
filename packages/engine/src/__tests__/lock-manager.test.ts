import { describe, it, expect, beforeEach } from 'vitest';
import { LockManager } from '../lock-manager.js';
import type { IStorage } from '../ports.js';

class InMemoryStorage implements Partial<IStorage> {
  private files = new Map<string, string>();

  async read(path: string): Promise<string> {
    const content = this.files.get(path);
    if (!content) throw new Error(`File not found: ${path}`);
    return content;
  }

  async write(path: string, content: string): Promise<void> {
    this.files.set(path, content);
  }

  async exists(path: string): Promise<boolean> {
    return this.files.has(path);
  }

  async delete(path: string): Promise<void> {
    this.files.delete(path);
  }

  async readJson<T>(path: string): Promise<T> {
    const content = await this.read(path);
    return JSON.parse(content) as T;
  }

  async writeJson<T>(path: string, data: T): Promise<void> {
    await this.write(path, JSON.stringify(data));
  }
}

describe('LockManager (S75-005A)', () => {
  let storage: InMemoryStorage;
  let lockManager: LockManager;

  beforeEach(() => {
    storage = new InMemoryStorage();
    lockManager = new LockManager(storage);
  });

  it('debe adquirir un bloqueo exitosamente si el módulo está libre', async () => {
    const moduleName = 'checkout';
    await lockManager.acquire(moduleName, 'user-1');

    const isLocked = await lockManager.isLocked(moduleName);
    expect(isLocked).toBe(true);
  });

  it('debe impedir la concurrencia lanzando un error si ya está bloqueado y vigente', async () => {
    const moduleName = 'checkout';
    await lockManager.acquire(moduleName, 'user-1');

    await expect(lockManager.acquire(moduleName, 'user-2')).rejects.toThrow(
      /se encuentra bloqueado por/i
    );
  });

  it('debe liberar el bloqueo correctamente', async () => {
    const moduleName = 'checkout';
    await lockManager.acquire(moduleName, 'user-1');
    
    const released = await lockManager.release(moduleName);
    expect(released).toBe(true);

    const isLocked = await lockManager.isLocked(moduleName);
    expect(isLocked).toBe(false);
  });

  it('debe permitir la liberación forzada (--force-unlock)', async () => {
    const moduleName = 'checkout';
    await lockManager.acquire(moduleName, 'user-1');

    await lockManager.forceUnlock(moduleName);

    const isLocked = await lockManager.isLocked(moduleName);
    expect(isLocked).toBe(false);
  });

  it('debe detectar y sobrescribir bloqueos huérfanos (stale locks) expirados', async () => {
    const moduleName = 'checkout';
    const shortLockManager = new LockManager(storage, { staleTimeoutMs: 1 });

    await shortLockManager.acquire(moduleName, 'user-old');

    // Usando casting para evitar el problema de tipado de globalThis
    await new Promise((resolve) => (globalThis as any).setTimeout(resolve, 20));

    await expect(shortLockManager.acquire(moduleName, 'user-new')).resolves.not.toThrow();
    });
});