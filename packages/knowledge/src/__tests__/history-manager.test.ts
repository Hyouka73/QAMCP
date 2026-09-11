import { describe, it, expect, beforeEach } from 'vitest';
import type { IStorage } from '@qap/engine';

import { HistoryManager } from '../history/history-manager.js';

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

  async list(path: string): Promise<string[]> {
    const prefix = `${path}/`;
    return Array.from(this.memory.keys())
      .filter((key) => key.startsWith(prefix))
      .map((key) => key.slice(prefix.length));
  }
}

describe('HistoryManager (S3-007)', () => {
  let storage: MockStorage;
  let manager: HistoryManager;

  beforeEach(() => {
    storage = new MockStorage();
    manager = new HistoryManager(storage as unknown as IStorage, { maxEntries: 3 });
  });

  it('debe registrar una ejecucion y poder leerla despues', async () => {
    await manager.recordExecution('checkout', { event: 'run', status: 'success' });

    const history = await manager.getHistory('checkout');
    expect(history).toHaveLength(1);
    expect(history[0].event).toBe('run');
    expect(history[0].status).toBe('success');
    expect(history[0].timestamp).toBeDefined();
  });

  it('debe devolver un arreglo vacio si el modulo no tiene historial aun', async () => {
    const history = await manager.getHistory('modulo-nuevo');
    expect(history).toEqual([]);
  });

  it('debe acumular multiples entradas en orden', async () => {
    await manager.recordExecution('checkout', { event: 'run', status: 'success' });
    await manager.recordExecution('checkout', { event: 'run', status: 'failure' });

    const history = await manager.getHistory('checkout');
    expect(history).toHaveLength(2);
    expect(history[0].status).toBe('success');
    expect(history[1].status).toBe('failure');
  });

  it('debe podar automaticamente las entradas mas antiguas al superar max_entries', async () => {
    // maxEntries = 3, registramos 5
    for (let i = 1; i <= 5; i++) {
      await manager.recordExecution('checkout', { event: 'run', run: i });
    }

    const history = await manager.getHistory('checkout');
    expect(history).toHaveLength(3);

    // Deben quedar solo las 3 mas recientes (run 3, 4, 5)
    expect(history.map((h) => h.run)).toEqual([3, 4, 5]);
  });

  it('debe crear un backup en .qa/cache/backups/ antes de podar', async () => {
    for (let i = 1; i <= 4; i++) {
      await manager.recordExecution('checkout', { event: 'run', run: i });
    }

    const backups = await manager.listBackups('checkout');
    expect(backups.length).toBeGreaterThan(0);
  });

  it('el backup debe contener el historial completo previo a la poda (sin perder datos)', async () => {
    for (let i = 1; i <= 4; i++) {
      await manager.recordExecution('checkout', { event: 'run', run: i });
    }

    const backups = await manager.listBackups('checkout');
    const backupContent = await storage.read(`.qa/cache/backups/${backups[0]}`);
    const backupEntries = backupContent
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line) as { run: number });

    // El backup debe tener las 3 entradas que existian ANTES de la poda (run 1, 2, 3)
    expect(backupEntries.map((e) => e.run)).toEqual([1, 2, 3]);
  });

  it('no debe crear backup si nunca se supera max_entries', async () => {
    await manager.recordExecution('checkout', { event: 'run', run: 1 });
    await manager.recordExecution('checkout', { event: 'run', run: 2 });

    const backups = await manager.listBackups('checkout');
    expect(backups).toHaveLength(0);
  });

  it('debe exponer el max_entries configurado', () => {
    expect(manager.getMaxEntries()).toBe(3);
  });

  it('debe usar el valor por defecto de max_entries si no se especifica', () => {
    const defaultManager = new HistoryManager(storage as unknown as IStorage);
    expect(defaultManager.getMaxEntries()).toBe(100);
  });
});