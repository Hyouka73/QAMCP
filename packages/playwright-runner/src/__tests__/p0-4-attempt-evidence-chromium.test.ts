import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SessionStore } from '@qap/auth';
import { SchemaValidator, type TCCase, type TestPlan } from '@qap/shared';

import {
  PlaywrightRunner,
  inspectZipArchive,
  resolveConfinedArtifactPath,
} from '../index.js';

function readPngDimensions(pngBuffer: Buffer): { width: number; height: number } {
  // PNG magic: 89 50 4E 47 0D 0A 1A 0A, followed by IHDR chunk length (4), 'IHDR' (4), width (4 BE), height (4 BE)
  const pngMagic = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  expect(pngBuffer.subarray(0, 8).equals(pngMagic)).toBe(true);
  const width = pngBuffer.readUInt32BE(16);
  const height = pngBuffer.readUInt32BE(20);
  return { width, height };
}

describe('P0.4 — Evidencia Playwright por intento en Chromium real', () => {
  let server: http.Server;
  let baseUrl = '';
  const tempDirs: string[] = [];

  function makeWorkspace(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'qap-p04-runner-'));
    tempDirs.push(dir);
    return dir;
  }

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      const reqUrl = new URL(req.url ?? '/', 'http://127.0.0.1');
      const cookieHeader = req.headers.cookie ?? '';

      if (reqUrl.pathname === '/orders/ORD-901') {
        const isAuthenticated = cookieHeader.includes('auth_token=synth-session-secret-token-998877');
        if (!isAuthenticated) {
          res.writeHead(401, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end('<html><body><h1 id="unauth">No autorizado</h1></body></html>');
          return;
        }
        const statusText = reqUrl.searchParams.get('state') ?? 'CONFIRMADO-SINTETICO';
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Set-Cookie': 'session_refresh=synth-refresh-cookie-554433; Path=/; HttpOnly',
        });
        res.end(`<!DOCTYPE html>
<html>
  <head>
    <style>
      body { margin: 0; padding: 40px; font-family: sans-serif; width: 1200px; height: 900px; }
      #order-card { width: 260px; padding: 16px; border: 2px solid #0f766e; border-radius: 8px; }
      #order-status { display: inline-block; width: 220px; height: 42px; line-height: 42px; text-align: center; background: #d1fae5; color: #065f46; font-weight: bold; }
    </style>
  </head>
  <body>
    <h1>Expediente de Pedido Sintético</h1>
    <div id="order-card">
      <div id="order-id">ORD-901</div>
      <div id="order-status">${statusText}</div>
    </div>
    <form id="secret-form" style="margin-top: 24px;">
      <input id="api-password" name="password" type="password" value="" />
      <div id="sensitive-token" data-qap-redact="true">tok_live_dom_secret_887766</div>
    </form>
  </body>
</html>`);
        return;
      }

      res.writeHead(404);
      res.end('Not found');
    });

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve());
    });
    const addr = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${addr.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    for (const dir of tempDirs) {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    }
  });

  it('inicia con sesión preparada, genera WebM, captura enfocada, timeline y trace.zip abribles y sanea secretos', async () => {
    const projectRoot = makeWorkspace();
    const moduleDir = path.join(projectRoot, '.qa', 'modules', 'orders');
    fs.mkdirSync(moduleDir, { recursive: true });
    fs.writeFileSync(
      path.join(moduleDir, 'prereqs.yaml'),
      'requires:\n  auth:\n    primary: "p04-synthetic-operator"\n',
      'utf8',
    );

    // Preparar sesión cifrada antes de iniciar el intento (sin teclear login en el intento)
    const sessionStore = new SessionStore(undefined, projectRoot);
    sessionStore.saveSession('p04-synthetic-operator', {
      cookies: [
        {
          name: 'auth_token',
          value: 'synth-session-secret-token-998877',
          domain: '127.0.0.1',
          path: '/',
          expires: Math.floor(Date.now() / 1000) + 3600,
          httpOnly: true,
          secure: false,
          sameSite: 'Lax',
        },
      ],
      origins: [],
    });

    const tcPass: TCCase = {
      _version: '1',
      id: 'TC-ORD-001',
      name: 'Verificar pedido autenticado con evidencia por intento',
      steps: [
        {
          type: 'navigate',
          url: `${baseUrl}/orders/ORD-901?api_key=sk_live_synthetic_999999`,
        },
        {
          type: 'fill',
          selector: '#api-password',
          value: 'SuperSecretSynthPass!2026',
        },
        {
          type: 'assert',
          selector: '#order-status',
          assertion_type: 'equals',
          expected: 'CONFIRMADO-SINTETICO',
        },
      ],
    };

    const plan: TestPlan = {
      modules: ['orders'],
      cases: ['TC-ORD-001'],
      environment: 'local',
    };

    const runner = new PlaywrightRunner({ projectRoot });
    const attemptId = 'att_p04_chromium_01';
    const result = await runner.execute(plan, {
      projectRoot,
      attemptId,
      profile: 'p04-synthetic-operator',
      allowedOrigins: [baseUrl],
      extraHTTPHeaders: {
        'X-Api-Key': 'synth-header-key-12345',
      },
      storageResolver: async () => tcPass,
    });

    // 1. Esquema canónico válido y resultado aprobado
    const validator = new SchemaValidator();
    const schemaCheck = validator.validateExecutionResult(result);
    expect(schemaCheck.valid).toBe(true);
    expect(result.result).toBe('passed');
    expect(result.attempt_id).toBe(attemptId);
    expect(result.artifacts).toBeDefined();

    // 2. Video WebM finalizado antes de retornar y con cabecera EBML válida
    const videoRel = result.artifacts!.video_path!;
    expect(videoRel).toBe(`.qa/runtime/runs/${attemptId}/artifacts/attempt.webm`);
    const videoAbs = path.join(projectRoot, videoRel);
    expect(fs.existsSync(videoAbs)).toBe(true);
    const videoBuf = fs.readFileSync(videoAbs);
    expect(videoBuf.byteLength).toBeGreaterThan(256);
    // EBML magic header: 1A 45 DF A3
    expect(videoBuf.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))).toBe(true);

    // 3. trace.zip abrible tras reinicio y saneado contra fugas de secretos
    const traceRel = result.artifacts!.trace_zip_path!;
    expect(traceRel).toBe(`.qa/runtime/runs/${attemptId}/artifacts/trace.zip`);
    const traceAbs = path.join(projectRoot, traceRel);
    expect(fs.existsSync(traceAbs)).toBe(true);
    const zipInspection = inspectZipArchive(traceAbs);
    expect(zipInspection.valid).toBe(true);
    expect(zipInspection.entries.some((e) => e.name.endsWith('.trace'))).toBe(true);

    const combinedTraceText = zipInspection.entries
      .map((e) => e.textContent ?? '')
      .join('\n');
    expect(combinedTraceText).not.toContain('SuperSecretSynthPass!2026');
    expect(combinedTraceText).not.toContain('sk_live_synthetic_999999');
    expect(combinedTraceText).not.toContain('synth-header-key-12345');
    expect(combinedTraceText).not.toContain('synth-session-secret-token-998877');
    expect(combinedTraceText).not.toContain('synth-refresh-cookie-554433');

    // 4. Captura enfocada asociada al paso exacto (#order-status)
    const caseSteps = result.cases[0].steps!;
    expect(caseSteps).toHaveLength(3);
    const assertStep = caseSteps[2];
    expect(assertStep.step_index).toBe(2);
    expect(assertStep.action).toBe('assert');
    expect(assertStep.expected).toBe('CONFIRMADO-SINTETICO');
    expect(assertStep.observed).toBe('CONFIRMADO-SINTETICO');
    expect(assertStep.focused_screenshot).toBe(true);
    expect(assertStep.screenshot).toBeTruthy();

    const focusedPngAbs = path.join(projectRoot, assertStep.screenshot!);
    expect(fs.existsSync(focusedPngAbs)).toBe(true);
    const pngDims = readPngDimensions(fs.readFileSync(focusedPngAbs));
    // El elemento #order-status mide ~220x42, mucho menor que el viewport 1280x720
    expect(pngDims.width).toBeLessThan(600);
    expect(pngDims.height).toBeLessThan(200);

    // 5. Timeline de pasos persistido y saneado
    const timelineRel = result.artifacts!.timeline_path!;
    expect(timelineRel).toBe(`.qa/runtime/runs/${attemptId}/artifacts/timeline.json`);
    const timelineAbs = path.join(projectRoot, timelineRel);
    expect(fs.existsSync(timelineAbs)).toBe(true);
    const timelineRaw = fs.readFileSync(timelineAbs, 'utf8');
    expect(timelineRaw).not.toContain('SuperSecretSynthPass!2026');
    expect(timelineRaw).not.toContain('sk_live_synthetic_999999');

    const timelineJson = JSON.parse(timelineRaw);
    expect(timelineJson.steps).toHaveLength(3);
    expect(timelineJson.steps[0]).toMatchObject({
      step_index: 0,
      case_id: 'TC-ORD-001',
      action: 'navigate',
      status: 'passed',
    });
    expect(timelineJson.steps[0].expected).toContain('api_key=[REDACTED]');
    expect(timelineJson.steps[1]).toMatchObject({
      step_index: 1,
      case_id: 'TC-ORD-001',
      action: 'fill',
      expected: '[REDACTED]',
      observed: '[REDACTED]',
      redacted_selectors_count: 1,
    });
    expect(timelineJson.steps[2]).toMatchObject({
      step_index: 2,
      case_id: 'TC-ORD-001',
      action: 'assert',
      expected: 'CONFIRMADO-SINTETICO',
      observed: 'CONFIRMADO-SINTETICO',
      focused_screenshot: true,
    });
  }, 30000);

  it('localiza paso, esperado y observado en fallo funcional y conserva el resultado si falla la captura de artefactos', async () => {
    const projectRoot = makeWorkspace();
    const sessionStore = new SessionStore(undefined, projectRoot);
    const storageState = {
      cookies: [
        {
          name: 'auth_token',
          value: 'synth-session-secret-token-998877',
          domain: '127.0.0.1',
          path: '/',
          expires: Math.floor(Date.now() / 1000) + 3600,
          httpOnly: true,
          secure: false,
          sameSite: 'Lax' as const,
        },
      ],
      origins: [],
    };
    sessionStore.saveSession('p04-op', storageState);

    const tcFail: TCCase = {
      _version: '1',
      id: 'TC-ORD-FAIL',
      name: 'Detectar discrepancia entre esperado y observado',
      steps: [
        {
          type: 'navigate',
          url: `${baseUrl}/orders/ORD-901?state=PENDIENTE-REVISION`,
        },
        {
          type: 'assert',
          selector: '#order-status',
          assertion_type: 'equals',
          expected: 'ENTREGADO-FINAL',
        },
      ],
    };

    const runner = new PlaywrightRunner({ projectRoot });

    // Caso 1: Fallo funcional con captura enfocada real sobre el paso fallido
    const resWithArtifacts = await runner.execute(
      { modules: ['orders'], cases: ['TC-ORD-FAIL'], environment: 'local' },
      {
        projectRoot,
        attemptId: 'att_p04_fail_real',
        storageState,
        allowedOrigins: [baseUrl],
        storageResolver: async () => tcFail,
      },
    );

    expect(resWithArtifacts.result).toBe('failed');
    const failedStep = resWithArtifacts.cases[0].steps![1];
    expect(failedStep.step_index).toBe(1);
    expect(failedStep.action).toBe('assert');
    expect(failedStep.status).toBe('failed');
    expect(failedStep.expected).toBe('ENTREGADO-FINAL');
    expect(failedStep.observed).toBe('PENDIENTE-REVISION');
    expect(failedStep.focused_screenshot).toBe(true);
    expect(failedStep.screenshot).toBeTruthy();
    expect(fs.existsSync(path.join(projectRoot, failedStep.screenshot!))).toBe(true);

    // Caso 2: Si fallan las capturas de artefactos (screenshot, video, trace.zip), se conserva el veredicto y se registra la causa
    const resArtifactFault = await runner.execute(
      { modules: ['orders'], cases: ['TC-ORD-FAIL'], environment: 'local' },
      {
        projectRoot,
        attemptId: 'att_p04_fail_fault',
        storageState,
        allowedOrigins: [baseUrl],
        storageResolver: async () => tcFail,
        artifactFaultInjection: {
          failScreenshot: true,
          failVideo: true,
          failTrace: true,
        },
      },
    );

    const validator = new SchemaValidator();
    expect(validator.validateExecutionResult(resArtifactFault).valid).toBe(true);
    expect(resArtifactFault.result).toBe('failed');
    expect(resArtifactFault.summary.failed).toBe(1);
    expect(resArtifactFault.cases[0].result).toBe('failed');
    expect(resArtifactFault.cases[0].steps![1].expected).toBe('ENTREGADO-FINAL');
    expect(resArtifactFault.cases[0].steps![1].observed).toBe('PENDIENTE-REVISION');
    expect(resArtifactFault.cases[0].steps![1].artifact_error).toContain('Fallo inyectado');
    expect(resArtifactFault.artifacts?.artifact_errors?.map((e) => e.artifact)).toEqual(
      expect.arrayContaining(['video', 'trace.zip', 'screenshot']),
    );

    // Verificar confinamiento de rutas
    expect(() => resolveConfinedArtifactPath(projectRoot, '../escape.webm')).toThrow();
    expect(() => resolveConfinedArtifactPath(projectRoot, 'outside/file.png')).toThrow();
  }, 30000);
});
