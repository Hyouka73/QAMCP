import { describe, it, expect, beforeEach } from 'vitest';
import type { IStorage } from '@qap/engine';
import type { ExecutionResult } from '@qap/shared';

import { detectRegressions, updateManifestIfCompleted } from '../manifest/regression-detector.js';

/**
 * Mock mínimo de IStorage en memoria, suficiente para lo que usa
 * regression-detector.ts: exists, readJson, writeJson, getExecutionResult.
 */
function createMockStorage(): IStorage & { __seedExecution: (id: string, result: ExecutionResult) => void } {
  const files = new Map<string, unknown>();
  const executions = new Map<string, ExecutionResult>();

  return {
    async exists(path: string) {
      return files.has(path);
    },
    async readJson<T>(path: string) {
      return files.get(path) as T;
    },
    async writeJson<T>(path: string, data: T) {
      files.set(path, data);
    },
    async getExecutionResult(executionId: string) {
      return executions.get(executionId) ?? null;
    },
    // Método auxiliar solo para pruebas: no forma parte de IStorage real,
    // pero nos permite "sembrar" ejecuciones previas en el mock.
    __seedExecution(id: string, result: ExecutionResult) {
      executions.set(id, result);
    },
  } as unknown as IStorage & { __seedExecution: (id: string, result: ExecutionResult) => void };
}

function buildResult(overrides: Partial<ExecutionResult> = {}): ExecutionResult {
  return {
    _version: '1',
    execution_id: 'exec-default',
    module: 'checkout',
    env: 'staging',
    started_at: '2026-09-25T10:00:00Z',
    finished_at: '2026-09-25T10:01:00Z',
    result: 'passed',
    timed_out: false,
    summary: { total: 1, passed: 1, failed: 0, skipped: 0, not_run: 0 },
    cases: [],
    ...overrides,
  };
}

describe('detectRegressions (S5-005)', () => {
let storage: IStorage & { __seedExecution: (id: string, result: ExecutionResult) => void };
  beforeEach(() => {
    storage = createMockStorage();
  });

  it('devuelve baselineExecutionId null cuando no hay manifest previo para el módulo', async () => {
    const current = buildResult({ execution_id: 'exec-1' });

    const comparison = await detectRegressions(storage, current);

    expect(comparison.baselineExecutionId).toBeNull();
    expect(comparison.newFailures).toEqual([]);
    expect(comparison.fixedFailures).toEqual([]);
  });

  it('no reporta cambios cuando los casos mantienen el mismo resultado que la línea base', async () => {
    const baseline = buildResult({
      execution_id: 'exec-baseline',
      cases: [{ id: 'case-1', title: 'Login', result: 'passed' }],
    });
    storage.__seedExecution('exec-baseline', baseline);
    await updateManifestIfCompleted(storage, baseline);

    const current = buildResult({
      execution_id: 'exec-2',
      cases: [{ id: 'case-1', title: 'Login', result: 'passed' }],
    });

    const comparison = await detectRegressions(storage, current);

    expect(comparison.baselineExecutionId).toBe('exec-baseline');
    expect(comparison.newFailures).toEqual([]);
    expect(comparison.fixedFailures).toEqual([]);
  });

  it('detecta una falla nueva: un caso que antes pasaba y ahora falla', async () => {
    const baseline = buildResult({
      execution_id: 'exec-baseline',
      cases: [{ id: 'case-1', title: 'Login', result: 'passed' }],
    });
        storage.__seedExecution('exec-baseline', baseline);
    await updateManifestIfCompleted(storage, baseline);

    const current = buildResult({
      execution_id: 'exec-2',
      result: 'failed',
      cases: [{ id: 'case-1', title: 'Login', result: 'failed', failure_type: 'assertion_failed' }],
    });

    const comparison = await detectRegressions(storage, current);

    expect(comparison.baselineExecutionId).toBe('exec-baseline');
    expect(comparison.newFailures).toHaveLength(1);
    expect(comparison.newFailures[0].id).toBe('case-1');
    expect(comparison.fixedFailures).toEqual([]);
  });

  it('detecta una falla corregida: un caso que antes fallaba y ahora pasa', async () => {
    // Línea base con un caso fallido (aceptado como línea base válida:
    // "exitosa" = la ejecución completó, no que todos los casos pasaran).
    const baseline = buildResult({
      execution_id: 'exec-baseline',
      result: 'failed',
      cases: [{ id: 'case-1', title: 'Login', result: 'failed', failure_type: 'assertion_failed' }],
    });
        storage.__seedExecution('exec-baseline', baseline);
    await updateManifestIfCompleted(storage, baseline);

    const current = buildResult({
      execution_id: 'exec-2',
      cases: [{ id: 'case-1', title: 'Login', result: 'passed' }],
    });

    const comparison = await detectRegressions(storage, current);

    expect(comparison.baselineExecutionId).toBe('exec-baseline');
    expect(comparison.fixedFailures).toHaveLength(1);
    expect(comparison.fixedFailures[0].id).toBe('case-1');
    expect(comparison.newFailures).toEqual([]);
  });

  it('ignora casos nuevos que no existían en la línea base (no cuentan como regresión ni fix)', async () => {
    const baseline = buildResult({
      execution_id: 'exec-baseline',
      cases: [{ id: 'case-1', title: 'Login', result: 'passed' }],
    });
       storage.__seedExecution('exec-baseline', baseline);
    await updateManifestIfCompleted(storage, baseline);

    const current = buildResult({
      execution_id: 'exec-2',
      cases: [
        { id: 'case-1', title: 'Login', result: 'passed' },
        { id: 'case-2', title: 'Nuevo caso', result: 'failed', failure_type: 'assertion_failed' },
      ],
    });

    const comparison = await detectRegressions(storage, current);

    expect(comparison.newFailures).toEqual([]);
    expect(comparison.fixedFailures).toEqual([]);
  });
});

describe('updateManifestIfCompleted (S5-005)', () => {
  let storage: IStorage & { __seedExecution: (id: string, result: ExecutionResult) => void };

  beforeEach(() => {
    storage = createMockStorage();
  });

  it('registra en el manifest una ejecución con result "failed" (línea base amplia, decisión de diseño)', async () => {
    const result = buildResult({ execution_id: 'exec-1', result: 'failed' });

    await updateManifestIfCompleted(storage, result);

    const manifest = await storage.readJson<Record<string, { execution_id: string }>>(
      '.qa/cache/manifest.json',
    );
    expect(manifest.checkout.execution_id).toBe('exec-1');
  });

  it('NO registra en el manifest una ejecución con result "error"', async () => {
    const result = buildResult({ execution_id: 'exec-1', result: 'error' });

    await updateManifestIfCompleted(storage, result);

    const exists = await storage.exists('.qa/cache/manifest.json');
    expect(exists).toBe(false);
  });

  it('NO registra en el manifest una ejecución con timed_out: true', async () => {
    const result = buildResult({ execution_id: 'exec-1', timed_out: true });

    await updateManifestIfCompleted(storage, result);

    const exists = await storage.exists('.qa/cache/manifest.json');
    expect(exists).toBe(false);
  });

  it('sobrescribe la entrada del manifest con la ejecución más reciente del mismo módulo', async () => {
    const first = buildResult({ execution_id: 'exec-1' });
    await updateManifestIfCompleted(storage, first);

    const second = buildResult({ execution_id: 'exec-2' });
    await updateManifestIfCompleted(storage, second);

    const manifest = await storage.readJson<Record<string, { execution_id: string }>>(
      '.qa/cache/manifest.json',
    );
    expect(manifest.checkout.execution_id).toBe('exec-2');
  });
});
