import { existsSync, mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { LifecycleState } from '@qap/shared';

import { FileSystemStorage } from '../storage/file-storage.js';

describe('FileSystemStorage - Ciclo de vida y retrocompatibilidad (E3, E4, Criterio 2)', () => {
  let tempDir: string;
  let storage: FileSystemStorage;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'qap-lifecycle-storage-test-'));
    storage = new FileSystemStorage({ rootDir: tempDir });
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('debe derivar retrocompatiblemente phase ONBOARDING cuando lifecycle.json no existe y no hay módulos (E4)', async () => {
    const lifecyclePath = join(tempDir, '.qa', 'project', 'lifecycle.json');
    expect(existsSync(lifecyclePath)).toBe(false);

    // Lectura perezosa
    const state = await storage.getLifecycleState();

    expect(state.phase).toBe('ONBOARDING');
    expect(state._version).toBe('1');
    expect(state.modules).toEqual({});
    expect(state.history).toEqual([]);
    expect(state.session.plan).toEqual([]);

    // Verificar que NO se escribió en disco
    expect(existsSync(lifecyclePath)).toBe(false);
  });

  it('debe derivar retrocompatiblemente phase WORKING con cada módulo en observed cuando no existe lifecycle.json pero hay módulos (E4)', async () => {
    // Creamos módulos existentes en el árbol .qa/modules
    await storage.write('.qa/modules/auth/summary.json', JSON.stringify({ name: 'auth' }));
    await storage.write('.qa/modules/checkout/summary.json', JSON.stringify({ name: 'checkout' }));

    const lifecyclePath = join(tempDir, '.qa', 'project', 'lifecycle.json');
    expect(existsSync(lifecyclePath)).toBe(false);

    // Lectura perezosa
    const state = await storage.getLifecycleState();

    expect(state.phase).toBe('WORKING');
    expect(state._version).toBe('1');
    expect(state.modules['auth']?.state).toBe('observed');
    expect(state.modules['checkout']?.state).toBe('observed');
    expect(state.modules['auth']?.updated_at).toBeDefined();
    expect(state.modules['checkout']?.updated_at).toBeDefined();

    // Verificar que NO se escribió en disco (perezoso sin I/O hasta primera transición real)
    expect(existsSync(lifecyclePath)).toBe(false);
  });

  it('debe escribir atómicamente y persistir el estado con saveLifecycleState (E3)', async () => {
    const lifecyclePath = join(tempDir, '.qa', 'project', 'lifecycle.json');
    const newState: LifecycleState = {
      _version: '1',
      phase: 'SCOPING',
      session: {
        id: 'sess-100',
        started_at: '2026-09-30T10:00:00.000Z',
        plan: [
          { module: 'auth', path: '/login', priority: 'high', status: 'observed' },
        ],
      },
      modules: {
        auth: {
          state: 'observed',
          updated_at: '2026-09-30T10:00:00.000Z',
        },
      },
      history: [
        {
          from: 'ONBOARDING',
          to: 'SCOPING',
          at: '2026-09-30T10:00:00.000Z',
          reason: 'Objetivo de proyecto configurado',
        },
      ],
    };

    await storage.saveLifecycleState(newState);

    // Debe existir en disco tras guardado explícito
    expect(existsSync(lifecyclePath)).toBe(true);

    const onDiskRaw = readFileSync(lifecyclePath, 'utf-8');
    const onDisk = JSON.parse(onDiskRaw);
    expect(onDisk.phase).toBe('SCOPING');
    expect(onDisk.modules.auth.state).toBe('observed');

    // Debe leerse idénticamente con getLifecycleState
    const readBack = await storage.getLifecycleState();
    expect(readBack).toEqual(newState);
  });

  it('debe soportar escrituras concurrentes atómicas con locking sin corrupción', async () => {
    const baseState: LifecycleState = {
      _version: '1',
      phase: 'WORKING',
      session: { id: 's', started_at: '', plan: [] },
      modules: {},
      history: [],
    };

    // Lanzar 5 escrituras concurrentes
    await Promise.all([
      storage.saveLifecycleState({ ...baseState, phase: 'WORKING' }),
      storage.saveLifecycleState({ ...baseState, phase: 'SCOPING' }),
      storage.saveLifecycleState({ ...baseState, phase: 'WRAP_UP' }),
      storage.saveLifecycleState({ ...baseState, phase: 'WORKING' }),
      storage.saveLifecycleState({ ...baseState, phase: 'WRAP_UP' }),
    ]);

    const finalState = await storage.getLifecycleState();
    expect(['WORKING', 'SCOPING', 'WRAP_UP']).toContain(finalState.phase);
    expect(finalState._version).toBe('1');
  });

  it('updateLifecycleState debe ejecutar lectura-modificación-escritura atómica bajo lock sin perder actualizaciones concurrentes (E2)', async () => {
    // Inicializar estado base
    await storage.saveLifecycleState({
      _version: '1',
      phase: 'SCOPING',
      session: { id: 'sess-init', started_at: '2026-09-30T10:00:00Z', plan: [] },
      modules: {},
      history: [],
    });

    // 5 llamadas concurrentes agregando módulos diferentes
    const moduleNames = ['mod-a', 'mod-b', 'mod-c', 'mod-d', 'mod-e'];
    await Promise.all(
      moduleNames.map((name) =>
        storage.updateLifecycleState((state) => ({
          ...state,
          modules: {
            ...state.modules,
            [name]: { state: 'planned', updated_at: '2026-09-30T11:00:00Z' },
          },
        }))
      )
    );

    const finalState = await storage.getLifecycleState();
    // Ningún módulo debió perderse
    for (const name of moduleNames) {
      expect(finalState.modules[name]).toBeDefined();
      expect(finalState.modules[name]?.state).toBe('planned');
    }
    expect(Object.keys(finalState.modules)).toHaveLength(5);
  });
});

