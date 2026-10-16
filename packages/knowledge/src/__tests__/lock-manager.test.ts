import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LockManager } from '../storage/lock-manager.js';


describe('LockManager (S75-005A)', () => {
  let tempDir: string;
  let lockManager: LockManager;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qap-lock-test-'));
    lockManager = new LockManager({ rootDir: tempDir });
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('debe adquirir y liberar un lock de módulo exitosamente', async () => {
    const release = await lockManager.acquireModuleLock('checkout');
    expect(typeof release).toBe('function');
    await release();
  });

  it('debe lanzar error "lock_timeout" si se intenta bloquear concurrentemente el mismo módulo', async () => {
    const release1 = await lockManager.acquireModuleLock('checkout');

    await expect(lockManager.acquireModuleLock('checkout')).rejects.toThrowError(/lock_timeout/);

    await release1();
  });

  it('debe permitir forceUnlock para limpiar locks forzadamente', async () => {
    await lockManager.acquireModuleLock('checkout');

    // Forzar liberación
    await lockManager.forceUnlock('checkout');

    // Ahora debería poder adquirirse de nuevo sin lanzar lock_timeout
    const release2 = await lockManager.acquireModuleLock('checkout');
    expect(typeof release2).toBe('function');
    await release2();
  });
  it('forceUnlock () sin argumento  debe liberar todos los locks activos', async() => {
    await lockManager.acquireModuleLock('checkout');
    await lockManager.acquireModuleLock('auth');

    await lockManager.forceUnlock();

    const releaseCheckout = await lockManager.acquireModuleLock('checkout');
    const releaseAuth = await lockManager.acquireModuleLock('auth');
    expect(typeof releaseCheckout).toBe ('function');
    expect(typeof releaseAuth).toBe('function');

    await releaseCheckout();
    await releaseAuth();
  });
});