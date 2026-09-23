import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { TelemetryServer } from '../api/telemetry-server.js';
import type { RunRecord } from '../types.js';

describe('API Local de Telemetría (Checklist Gate)', () => {
  let tempDir: string;
  let server: TelemetryServer;
  let baseUrl: string;

  beforeEach(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qap-api-test-'));
    server = new TelemetryServer({ runtimeDir: tempDir });
    const port = await server.listen(0);
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterEach(async () => {
    await server.close();
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('DELETE /api/runs/:id de un run inexistente retorna HTTP 404 (no 500) (Checklist Gate)', async () => {
    const res = await fetch(`${baseUrl}/api/runs/non-existent-run-123`, {
      method: 'DELETE',
    });

    expect(res.status).toBe(404);
    const body = (await res.json()) as { success: boolean; error: string };
    expect(body.success).toBe(false);
    expect(body.error).toContain('Run no encontrado');
  });

  it('permite listar corridas, consultar detalle, marcar pin y eliminar existosamente', async () => {
    const db = server.getDatabase();

    const sampleRun: RunRecord = {
      runId: 'api-run-abc',
      flowId: 'login-flow',
      startedAt: '2026-09-22T14:00:00Z',
      finishedAt: '2026-09-22T14:00:10Z',
      totalDurationMs: 10000,
      overallStatus: 'passed',
      environment: { gitCommit: 'abc', gitBranch: 'main', hostOs: '', runnerFramework: '' },
      steps: [],
      artifacts: { totalDiskUsageBytes: 0, screenshots: [] },
      lifecycle: { pinned: false, createdAt: '2026-09-22T14:00:00Z' },
    };

    db.saveRun(sampleRun);

    // 1. GET /api/runs
    const listRes = await fetch(`${baseUrl}/api/runs`);
    expect(listRes.status).toBe(200);
    const listBody = (await listRes.json()) as { success: boolean; count: number; runs: unknown[] };
    expect(listBody.success).toBe(true);
    expect(listBody.count).toBe(1);

    // 2. GET /api/runs/:runId
    const getRes = await fetch(`${baseUrl}/api/runs/api-run-abc`);
    expect(getRes.status).toBe(200);
    const getBody = (await getRes.json()) as { success: boolean; run: RunRecord };
    expect(getBody.run.runId).toBe('api-run-abc');

    // 3. PATCH /api/runs/:runId/pin
    const pinRes = await fetch(`${baseUrl}/api/runs/api-run-abc/pin`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinned: true }),
    });
    expect(pinRes.status).toBe(200);
    const pinBody = (await pinRes.json()) as { success: boolean; pinned: boolean };
    expect(pinBody.pinned).toBe(true);

    // 4. DELETE /api/runs/:runId (existente)
    const delRes = await fetch(`${baseUrl}/api/runs/api-run-abc`, {
      method: 'DELETE',
    });
    expect(delRes.status).toBe(200);
    const delBody = (await delRes.json()) as { success: boolean; deleted: boolean };
    expect(delBody.deleted).toBe(true);

    // Verificar que ya no existe
    const getAfterDel = await fetch(`${baseUrl}/api/runs/api-run-abc`);
    expect(getAfterDel.status).toBe(404);
  });
});
