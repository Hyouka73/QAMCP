import { describe, it, expect, beforeEach } from 'vitest';
import type { IStorage } from '@qap/engine';

import { IndexManager } from '../index/index-manager.js';

class MockStorage implements Partial<IStorage> {
  private memory = new Map<string, string>();

  async read(path: string): Promise<string> {
    const data = this.memory.get(path);
    if (data === undefined) throw new Error(`File not found: ${path}`);
    return data;
  }

  async write(path: string, content: string): Promise<void> {
    this.memory.set(path, content);
  }

  async exists(path: string): Promise<boolean> {
    return this.memory.has(path);
  }

  async readJson<T>(path: string): Promise<T> {
    const content = await this.read(path);
    return JSON.parse(content) as T;
  }

  async writeJson<T>(path: string, data: T): Promise<void> {
    await this.write(path, JSON.stringify(data, null, 2));
  }
}

describe('IndexManager (S3-005)', () => {
  let storage: MockStorage;
  let manager: IndexManager;

  beforeEach(() => {
    storage = new MockStorage();
    manager = new IndexManager(storage as unknown as IStorage);
  });

  it('debe registrar y resolver módulos en O(1) por ID y Nombre', () => {
    manager.registerModule({
      id: 'mod-1',
      name: 'AuthModule',
      path: 'src/auth',
      tags: ['security', 'core']
    });

    expect(manager.getModule('mod-1')?.path).toBe('src/auth');
    expect(manager.getModule('AuthModule')?.id).toBe('mod-1');
  });

  it('debe resolver módulos por Tag en O(1)', () => {
    manager.registerModule({
      id: 'mod-1',
      name: 'AuthModule',
      path: 'src/auth',
      tags: ['security']
    });

    const modules = manager.getModulesByTag('security');
    expect(modules).toHaveLength(1);
    expect(modules[0].name).toBe('AuthModule');
  });

  it('debe gestionar alias de rutas correctamente', () => {
    manager.setAlias('@auth', 'src/packages/auth');
    expect(manager.resolveAlias('@auth')).toBe('src/packages/auth');
  });

  it('debe persistir y recuperar index.json y aliases.json mediante IStorage', async () => {
    manager.registerModule({
      id: 'mod-2',
      name: 'UserModule',
      path: 'src/user',
      tags: ['user']
    });
    manager.setAlias('@user', 'src/user');

    await manager.save();

    const newManager = new IndexManager(storage as unknown as IStorage);
    await newManager.load();

    expect(newManager.getModule('UserModule')?.id).toBe('mod-2');
    expect(newManager.resolveAlias('@user')).toBe('src/user');
  });
});