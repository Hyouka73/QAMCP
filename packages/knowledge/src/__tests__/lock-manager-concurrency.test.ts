import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { LockManager } from '../storage/lock-manager.js';

describe('LockManager Concurrency & Deadlock Prevention (S82-001)', () => {
  const rootDir = join(process.cwd(), '.qa_test_locks');
  let lockManager: LockManager;

  beforeEach(() => {
    if (existsSync(rootDir)) {
      rmSync(rootDir, { recursive: true, force: true });
    }
    lockManager = new LockManager({ rootDir });
  });

  afterEach(async () => {
    await lockManager.forceUnlock();
    if (existsSync(rootDir)) {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });

  it('adquiere los locks en orden alfabético ["auth", "pagos"] sin importar el orden pedido', async () => {
    const acquisitionOrder: string[] = [];
    const original = lockManager.acquireModuleLock.bind(lockManager);
    
    // Interceptamos temporalmente para auditar el orden real de llamada
    lockManager.acquireModuleLock = async (moduleName: string) => {
      acquisitionOrder.push(moduleName);
      return original(moduleName);
    };

    await lockManager.withModulesLock(['pagos', 'auth'], async () => 'a');
    const orderForReversedRequest = [...acquisitionOrder];
    
    acquisitionOrder.length = 0;
    await lockManager.withModulesLock(['auth', 'pagos'], async () => 'b');
    const orderForAlphabeticalRequest = [...acquisitionOrder];

    expect(orderForReversedRequest).toEqual(['auth', 'pagos']);
    expect(orderForAlphabeticalRequest).toEqual(['auth', 'pagos']);
  });

  it('dos flujos concurrentes con módulos en orden inverso terminan sin deadlock', async () => {
    const executionSequence: string[] = [];

    const flowA = lockManager.withModulesLock(['pagos', 'auth'], async () => {
      executionSequence.push('flowA_started');
      await new Promise((resolve) => setTimeout(resolve, 50));
      executionSequence.push('flowA_finished');
      return 'flowA_done';
    });

    const flowB = lockManager.withModulesLock(['auth', 'pagos'], async () => {
      executionSequence.push('flowB_started');
      await new Promise((resolve) => setTimeout(resolve, 50));
      executionSequence.push('flowB_finished');
      return 'flowB_done';
    });

    const [resA, resB] = await Promise.all([flowA, flowB]);

    expect(resA).toBe('flowA_done');
    expect(resB).toBe('flowB_done');
    expect(executionSequence).toHaveLength(4);

    // Exclusión mutua: el primer flujo en empezar también es el primero en terminar.
    const firstFlow = executionSequence[0].split('_')[0];
    expect(executionSequence[1]).toBe(`${firstFlow}_finished`);
  });
});