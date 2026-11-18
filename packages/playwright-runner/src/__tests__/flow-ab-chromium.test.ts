import * as fs from 'node:fs';
import * as http from 'node:http';
import * as os from 'node:os';
import * as path from 'node:path';

import { FlowOrchestrator } from '@qap/engine';
import { FileSystemStorage, FlowContextStore, LockManager } from '@qap/knowledge';
import type { FlowDefinition, TCCase, TestPlan } from '@qap/shared';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { PlaywrightRunner, type PlaywrightRunnerOptions } from '../runner.js';

describe('P0.1 · Transferencia A→B con Chromium real', () => {
  let server: http.Server;
  let baseUrl: string;
  let createdIds: Set<string>;
  let seq = 0;
  let tempDir: string;

  beforeAll(async () => {
    createdIds = new Set<string>();
    server = http.createServer((req, res) => {
      const reqUrl = new URL(req.url ?? '/', 'http://127.0.0.1');

      if (reqUrl.pathname === '/module-a') {
        seq += 1;
        const syntheticId = `SYNTH-${seq}-A9F2`;
        createdIds.add(syntheticId);
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<!doctype html>
<html>
  <body>
    <h1>Módulo A · Registro Sintético</h1>
    <span id="created-record-id">${syntheticId}</span>
  </body>
</html>`);
        return;
      }

      if (reqUrl.pathname === '/module-b') {
        const id = reqUrl.searchParams.get('id') ?? '';
        const found = id.length > 0 && createdIds.has(id);
        res.writeHead(found ? 200 : 404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<!doctype html>
<html>
  <body>
    <h1>Módulo B · Verificación</h1>
    <div id="record-status">${found ? `VERIFIED:${id}` : 'NOT_FOUND'}</div>
  </body>
</html>`);
        return;
      }

      res.writeHead(404);
      res.end('Not Found');
    });

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve());
    });
    const addr = server.address();
    if (!addr || typeof addr === 'string') {
      throw new Error('No se pudo obtener el puerto del servidor loopback.');
    }
    baseUrl = `http://127.0.0.1:${addr.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  beforeEach(() => {
    createdIds.clear();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qap-p01-flow-ab-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('el módulo A captura un ID sintético en Chromium y el módulo B lo consume para verificar el registro', async () => {
    const storage = new FileSystemStorage({ rootDir: tempDir });
    const lockManager = new LockManager({ rootDir: tempDir });
    const flowStore = new FlowContextStore(tempDir);
    const runner = new PlaywrightRunner({ projectRoot: tempDir });
    const orchestrator = new FlowOrchestrator(storage, runner, lockManager, flowStore);

    const caseA: TCCase = {
      id: 'TC-A-001',
      name: 'Capturar ID sintético en módulo A',
      steps: [
        { type: 'navigate', url: `${baseUrl}/module-a` },
        { type: 'capture', selector: '#created-record-id', capture_as: 'SYNTH_RECORD_ID' },
      ],
    };

    const caseB: TCCase = {
      id: 'TC-B-001',
      name: 'Verificar registro en módulo B con ID de A',
      steps: [
        { type: 'navigate', url: `${baseUrl}/module-b?id=\${flow.SYNTH_RECORD_ID}` },
        {
          type: 'assert',
          selector: '#record-status',
          assertion_type: 'equals',
          expected: 'VERIFIED:${flow.SYNTH_RECORD_ID}',
        },
      ],
    };

    await storage.saveTestPlan('mod_a', { modules: ['mod_a'], cases: ['TC-A-001'] });
    await storage.saveTestCase('mod_a', caseA);
    await storage.saveTestPlan('mod_b', { modules: ['mod_b'], cases: ['TC-B-001'] });
    await storage.saveTestCase('mod_b', caseB);

    const flowDef: FlowDefinition = {
      name: 'flow_ab_real',
      modules: [{ module: 'mod_a' }, { module: 'mod_b' }],
      fail_fast: true,
    };

    const result = (await orchestrator.executeFlow(flowDef, {
      headless: true,
      timeout_ms: 15000,
    })) as unknown as {
      flow_name: string;
      status: string;
      completed_modules: string[];
      results: Record<string, { result: string; cases: Array<{ id: string; result: string }> }>;
    };

    expect(result.status).toBe('passed');
    expect(result.completed_modules).toEqual(['mod_a', 'mod_b']);
    expect(result.results.mod_a?.result).toBe('passed');
    expect(result.results.mod_b?.result).toBe('passed');

    const persistedState = flowStore.loadState('flow_ab_real');
    expect(persistedState).not.toBeNull();
    expect(persistedState?.completed_modules).toEqual(['mod_a', 'mod_b']);
    const capturedId = persistedState?.shared_variables.SYNTH_RECORD_ID;
    expect(capturedId).toMatch(/^SYNTH-\d+-A9F2$/);
    expect(createdIds.has(capturedId!)).toBe(true);
  }, 60000);

  it('falla con diagnóstico verificable cuando falta la captura requerida por el módulo B', async () => {
    const storage = new FileSystemStorage({ rootDir: tempDir });
    const lockManager = new LockManager({ rootDir: tempDir });
    const flowStore = new FlowContextStore(tempDir);
    const runner = new PlaywrightRunner({ projectRoot: tempDir });
    const orchestrator = new FlowOrchestrator(storage, runner, lockManager, flowStore);

    const caseA: TCCase = {
      id: 'TC-A-NOCAP',
      name: 'Módulo A sin capturar la variable esperada',
      steps: [{ type: 'navigate', url: `${baseUrl}/module-a` }],
    };

    const caseB: TCCase = {
      id: 'TC-B-NEEDS-CAP',
      name: 'Módulo B requiere variable de flujo faltante',
      steps: [
        { type: 'navigate', url: `${baseUrl}/module-b?id=\${flow.MISSING_SYNTH_ID}` },
      ],
    };

    await storage.saveTestPlan('mod_a', { modules: ['mod_a'], cases: ['TC-A-NOCAP'] });
    await storage.saveTestCase('mod_a', caseA);
    await storage.saveTestPlan('mod_b', { modules: ['mod_b'], cases: ['TC-B-NEEDS-CAP'] });
    await storage.saveTestCase('mod_b', caseB);

    const flowDef: FlowDefinition = {
      name: 'flow_ab_missing_capture',
      modules: [{ module: 'mod_a' }, { module: 'mod_b' }],
      fail_fast: true,
    };

    const result = (await orchestrator.executeFlow(flowDef, {
      headless: true,
      timeout_ms: 15000,
    })) as unknown as {
      status: string;
      completed_modules: string[];
      results: Record<
        string,
        {
          result: string;
          cases: Array<{
            id: string;
            result: string;
            steps?: Array<{ action: string; status: string; message?: string }>;
          }>;
        }
      >;
    };

    expect(result.status).toBe('failed');
    expect(result.completed_modules).toEqual(['mod_a']);
    expect(result.results.mod_b?.result).toBe('failed');
    const failedCaseB = result.results.mod_b?.cases.find((c) => c.id === 'TC-B-NEEDS-CAP');
    expect(failedCaseB?.result).toBe('failed');
    const failedStep = failedCaseB?.steps?.find((s) => s.status === 'failed');
    expect(failedStep?.action).toBe('navigate');
    expect(failedStep?.message).toMatch(/MISSING_SYNTH_ID.*no definida/i);
  }, 60000);

  it('P1-A & P1-B: FlowOrchestrator + PlaywrightRunner filtra IDs por tags, evita lanzar Chromium sin coincidencias y preserva blocked_missing_oracle como not_run', async () => {
    const storage = new FileSystemStorage({ rootDir: tempDir });
    const lockManager = new LockManager({ rootDir: tempDir });
    const flowStore = new FlowContextStore(tempDir);
    const runner = new PlaywrightRunner({ projectRoot: tempDir });

    const smokeCase: TCCase = {
      _version: '1',
      id: 'TC-SMOKE',
      name: 'Smoke Test',
      tags: ['smoke'],
      steps: [{ type: 'navigate', url: `${baseUrl}/module-a` }],
    };

    const regressionCase: TCCase = {
      _version: '1',
      id: 'TC-REGRESSION',
      name: 'Regression Test',
      tags: ['regression'],
      steps: [{ type: 'navigate', url: `${baseUrl}/module-a` }],
    };

    await storage.saveTestPlan('mod_a', { modules: ['mod_a'], cases: ['TC-SMOKE', 'TC-REGRESSION'] });
    await storage.saveTestCase('mod_a', smokeCase);
    await storage.saveTestCase('mod_a', regressionCase);

    const receivedPlans: TestPlan[] = [];
    const execSpy = vi.spyOn(runner, 'execute').mockImplementation(async (plan: TestPlan, opts?: PlaywrightRunnerOptions) => {
      receivedPlans.push(plan);
      return runner.executeInternal(plan, opts);
    });

    const flowDef: FlowDefinition = {
      name: 'flow_tagged_runner',
      modules: [{ module: 'mod_a' }],
      fail_fast: true,
    };

    // 1. Con filtro smoke: PlaywrightRunner recibe únicamente ['TC-SMOKE']
    const smokeRes = (await new FlowOrchestrator(storage, runner, lockManager, flowStore).executeFlow(flowDef, {
      headless: true,
      tags: ['smoke'],
      timeout_ms: 15000,
    })) as unknown as {
      status: string;
      results: Record<string, { result: string; cases: Array<{ id: string; result: string }> }>;
    };

    expect(smokeRes.status).toBe('passed');
    expect(receivedPlans).toHaveLength(1);
    expect(receivedPlans[0]?.cases).toEqual(['TC-SMOKE']);
    expect(smokeRes.results.mod_a?.cases.map((c) => c.id)).toEqual(['TC-SMOKE']);

    // 2. Sin coincidencias: no se inicia Chromium ni se invoca runner.execute ni se genera PASS
    execSpy.mockClear();
    const { chromium } = await import('playwright-core');
    const launchSpy = vi.spyOn(chromium, 'launch');
    const noMatchRes = (await new FlowOrchestrator(storage, runner, lockManager, flowStore).executeFlow(
      { name: 'flow_no_match_runner', modules: [{ module: 'mod_a' }] },
      { headless: true, tags: ['nonexistent'] }
    )) as unknown as { status: string; completed_modules: string[] };

    expect(noMatchRes.status).toBe('failed');
    expect(noMatchRes.completed_modules).toEqual([]);
    expect(execSpy).not.toHaveBeenCalled();
    expect(launchSpy).not.toHaveBeenCalled();

    // 3. Caso bloqueado por blocked_missing_oracle: not_run sin iniciar Chromium y flujo failed
    const blockedCase: TCCase = {
      _version: '1',
      id: 'TC-BLOCKED-ORACLE',
      name: 'Blocked Oracle Candidate',
      tags: ['bva', 'blocked_missing_oracle'],
      steps: [{ type: 'assert', selector: '#error', assertion_type: 'not_visible' }],
    };
    await storage.saveTestPlan('mod_blocked', { modules: ['mod_blocked'], cases: ['TC-BLOCKED-ORACLE'] });
    await storage.saveTestCase('mod_blocked', blockedCase);

    const telemetryEvents: Array<Record<string, unknown>> = [];
    const telemetryFinishes: unknown[] = [];
    const blockedRes = (await new FlowOrchestrator(storage, runner, lockManager, flowStore, {
      onCaseEnd: (e) => telemetryEvents.push(e as unknown as Record<string, unknown>),
      finish: (o) => telemetryFinishes.push(o),
    }).executeFlow(
      { name: 'flow_oracle_blocked_runner', modules: [{ module: 'mod_blocked' }] },
      { headless: true, tags: ['bva'] }
    )) as unknown as {
      status: string;
      results: Record<string, { result: string; cases: Array<{ id: string; result: string; not_run_reason?: string }> }>;
    };

    expect(launchSpy).not.toHaveBeenCalled();
    expect(blockedRes.status).toBe('failed');
    expect(blockedRes.results.mod_blocked?.cases[0]).toMatchObject({
      id: 'TC-BLOCKED-ORACLE',
      result: 'not_run',
      not_run_reason: expect.stringContaining('blocked_missing_oracle'),
    });
    expect(telemetryEvents).toEqual([
      expect.objectContaining({
        caseId: 'TC-BLOCKED-ORACLE',
        status: 'not_run',
        error: expect.stringContaining('blocked_missing_oracle'),
      }),
    ]);
    expect(telemetryFinishes).toEqual([expect.objectContaining({ status: 'failed' })]);
    launchSpy.mockRestore();
    execSpy.mockRestore();
  }, 60000);

  it('Fallo A & Fallo B: IDs explícitos + tags, casos inline en Chromium real, sin filtro, cero coincidencias y resume intacto', async () => {
    const storage = new FileSystemStorage({ rootDir: tempDir });
    const lockManager = new LockManager({ rootDir: tempDir });
    const flowStore = new FlowContextStore(tempDir);
    const runner = new PlaywrightRunner({ projectRoot: tempDir });

    const smokeCase: TCCase = {
      _version: '1',
      id: 'TC-SMOKE',
      name: 'Smoke ID Case',
      tags: ['smoke'],
      steps: [{ type: 'navigate', url: `${baseUrl}/module-a` }],
    };
    const regressionCase: TCCase = {
      _version: '1',
      id: 'TC-REGRESSION',
      name: 'Regression ID Case',
      tags: ['regression'],
      steps: [{ type: 'navigate', url: `${baseUrl}/module-a` }],
    };

    await storage.saveTestPlan('mod_ids', { modules: ['mod_ids'], cases: ['TC-SMOKE', 'TC-REGRESSION'] });
    await storage.saveTestCase('mod_ids', smokeCase);
    await storage.saveTestCase('mod_ids', regressionCase);

    const inlinePlans: Record<string, unknown> = {
      mod_inline: {
        modules: ['mod_inline'],
        cases: [
          {
            id: 'tc_inline_smoke',
            name: 'Inline Smoke Case',
            tags: ['smoke'],
            steps: [
              { type: 'navigate', url: `${baseUrl}/module-a` },
              { type: 'capture', selector: '#created-record-id', capture_as: 'INLINE_ID' },
            ],
          },
          {
            id: 'tc_inline_reg',
            name: 'Inline Regression Case',
            tags: ['regression'],
            steps: [{ type: 'navigate', url: `${baseUrl}/module-a` }],
          },
        ],
      },
      mod_inline_consume: {
        modules: ['mod_inline_consume'],
        cases: [
          {
            id: 'tc_inline_use',
            tags: ['smoke'],
            steps: [
              { type: 'navigate', url: `${baseUrl}/module-b?id=\${flow.INLINE_ID}` },
              {
                type: 'assert',
                selector: '#record-status',
                assertion_type: 'equals',
                expected: 'VERIFIED:${flow.INLINE_ID}',
              },
            ],
          },
        ],
      },
    };

    const hybridStorage = {
      getTestPlan: async (mod: string) =>
        (inlinePlans[mod] as TestPlan | undefined) ?? storage.getTestPlan(mod),
      getTestCase: (mod: string, id: string) => storage.getTestCase(mod, id),
      listTestCases: (mod: string) => storage.listTestCases(mod),
    };

    const receivedPlans: TestPlan[] = [];
    const execSpy = vi
      .spyOn(runner, 'execute')
      .mockImplementation(async (plan: TestPlan, opts?: PlaywrightRunnerOptions) => {
        receivedPlans.push(plan);
        return runner.executeInternal(plan, opts);
      });

    // 1. IDs explícitos (rawStep.cases = ['TC-SMOKE', 'TC-REGRESSION']) + --tags smoke => solo ['TC-SMOKE']
    const explicitSmokeRes = (await new FlowOrchestrator(
      hybridStorage as unknown as FileSystemStorage,
      runner,
      lockManager,
      flowStore
    ).executeFlow(
      {
        name: 'flow_explicit_smoke',
        modules: [{ module: 'mod_ids', cases: ['TC-SMOKE', 'TC-REGRESSION'] }],
      },
      { headless: true, tags: ['smoke'], timeout_ms: 15000 }
    )) as unknown as {
      status: string;
      results: Record<string, { result: string; cases: Array<{ id: string; result: string }> }>;
    };

    expect(explicitSmokeRes.status).toBe('passed');
    expect(receivedPlans).toHaveLength(1);
    expect(receivedPlans[0]?.cases).toEqual(['TC-SMOKE']);
    expect(explicitSmokeRes.results.mod_ids?.cases.map((c) => c.id)).toEqual(['TC-SMOKE']);

    // 2. Caso inline válido + captura en Chromium real + inline + etiquetas => únicamente los casos seleccionados, IDs string en Runner
    receivedPlans.length = 0;
    const inlineFlowRes = (await new FlowOrchestrator(
      hybridStorage as unknown as FileSystemStorage,
      runner,
      lockManager,
      flowStore
    ).executeFlow(
      {
        name: 'flow_inline_chromium',
        modules: [{ module: 'mod_inline' }, { module: 'mod_inline_consume' }],
      },
      { headless: true, tags: ['smoke'], timeout_ms: 15000 }
    )) as unknown as {
      status: string;
      completed_modules: string[];
      results: Record<string, { result: string; cases: Array<{ id: string; result: string }> }>;
    };

    expect(inlineFlowRes.status).toBe('passed');
    expect(inlineFlowRes.completed_modules).toEqual(['mod_inline', 'mod_inline_consume']);
    expect(receivedPlans.map((p) => p.cases)).toEqual([['tc_inline_smoke'], ['tc_inline_use']]);
    expect(
      receivedPlans.every((p) => (p.cases ?? []).every((id) => typeof id === 'string'))
    ).toBe(true);
    expect(inlineFlowRes.results.mod_inline?.cases.map((c) => c.id)).toEqual(['tc_inline_smoke']);
    expect(inlineFlowRes.results.mod_inline_consume?.cases.map((c) => c.id)).toEqual(['tc_inline_use']);

    // 3. Sin filtro: comportamiento previo (recibe ambos IDs en mod_ids y ambos inline IDs en mod_inline)
    receivedPlans.length = 0;
    const unfilteredRes = (await new FlowOrchestrator(
      hybridStorage as unknown as FileSystemStorage,
      runner,
      lockManager,
      flowStore
    ).executeFlow(
      {
        name: 'flow_unfiltered_both',
        modules: [{ module: 'mod_ids' }, { module: 'mod_inline' }],
      },
      { headless: true, timeout_ms: 15000 }
    )) as unknown as { status: string };

    expect(unfilteredRes.status).toBe('passed');
    expect(receivedPlans.map((p) => p.cases)).toEqual([
      ['TC-SMOKE', 'TC-REGRESSION'],
      ['tc_inline_smoke', 'tc_inline_reg'],
    ]);

    // 4. Cero coincidencias en intersección explícita + tags: sin Chromium ni PASS y sin dañar checkpoint previo
    const { chromium } = await import('playwright-core');
    const launchSpy = vi.spyOn(chromium, 'launch');
    execSpy.mockClear();

    flowStore.backupSessions('flow_resume_selection');
    flowStore.saveState({
      flow_name: 'flow_resume_selection',
      started_at: '2026-11-18T12:00:00.000Z',
      completed_modules: ['mod_inline'],
      shared_variables: { INLINE_ID: 'SYNTH-RESUME-1' },
    });

    const disjointResumeRes = (await new FlowOrchestrator(
      hybridStorage as unknown as FileSystemStorage,
      runner,
      lockManager,
      flowStore
    ).executeFlow(
      {
        name: 'flow_resume_selection',
        modules: [
          { module: 'mod_inline' },
          { module: 'mod_ids', cases: ['TC-REGRESSION'] },
        ],
      },
      { headless: true, tags: ['smoke'], timeout_ms: 15000 }
    )) as unknown as { status: string; completed_modules: string[] };

    expect(disjointResumeRes.status).toBe('failed');
    expect(disjointResumeRes.completed_modules).toEqual(['mod_inline']);
    expect(execSpy).not.toHaveBeenCalled();
    expect(launchSpy).not.toHaveBeenCalled();
    expect(flowStore.loadState('flow_resume_selection')?.completed_modules).toEqual(['mod_inline']);
    expect(flowStore.loadState('flow_resume_selection')?.shared_variables).toEqual({
      INLINE_ID: 'SYNTH-RESUME-1',
    });

    // 5. Resume exitoso tras selección: mod_inline se omite y mod_ids ejecuta únicamente ['TC-SMOKE']
    receivedPlans.length = 0;
    const resumePassRes = (await new FlowOrchestrator(
      hybridStorage as unknown as FileSystemStorage,
      runner,
      lockManager,
      flowStore
    ).executeFlow(
      {
        name: 'flow_resume_selection',
        modules: [
          { module: 'mod_inline' },
          { module: 'mod_ids', cases: ['TC-SMOKE', 'TC-REGRESSION'] },
        ],
      },
      { headless: true, tags: ['smoke'], timeout_ms: 15000 }
    )) as unknown as { status: string; completed_modules: string[] };

    expect(resumePassRes.status).toBe('passed');
    expect(resumePassRes.completed_modules).toEqual(['mod_inline', 'mod_ids']);
    expect(receivedPlans.map((p) => p.cases)).toEqual([['TC-SMOKE']]);
    expect(flowStore.loadState('flow_resume_selection')?.completed_modules).toEqual([
      'mod_inline',
      'mod_ids',
    ]);

    // 6. Llamada directa a PlaywrightRunner con objeto fuera de contrato en plan.cases falla explícitamente
    await expect(
      runner.execute(
        { modules: ['mod_ids'], cases: [{ id: 'obj', steps: [] }] as unknown as string[] },
        { headless: true }
      )
    ).rejects.toThrow(/Contrato inválido en TestPlan\.cases/);

    launchSpy.mockRestore();
    execSpy.mockRestore();
  }, 60000);
});
