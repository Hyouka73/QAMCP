import * as fs from 'node:fs';
import * as http from 'node:http';
import * as os from 'node:os';
import * as path from 'node:path';

import { FlowOrchestrator } from '@qap/engine';
import { FileSystemStorage, FlowContextStore, LockManager } from '@qap/knowledge';
import type { FlowDefinition, TCCase } from '@qap/shared';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { PlaywrightRunner } from '../runner.js';

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
});
