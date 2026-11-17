import * as fs from 'node:fs';
import * as path from 'node:path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import {
  generateFlowHtmlReport,
  generateFlowJsonReport,
  normalizeFlowResult,
  writeFlowReports,
} from '../generators/flow-report.js';
import { QapDatabase } from '../persistence/sqlite-client.js';
import { createFlowTelemetry } from '../runner/flow-telemetry.js';

describe('S82-005: Flow Reporting & Telemetry Persistence', () => {
  const testDir = path.join(process.cwd(), '.qa-test-runtime');

  beforeEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  const mockResult = {
    flowName: 'checkout-flow',
    status: 'passed' as const,
    durationMs: 1250,
    modules: [
      { module: 'auth', status: 'passed' as const, durationMs: 500, reportPath: 'auth-report.html' },
      { module: 'cart', status: 'passed' as const, durationMs: 750, reportPath: 'cart-report.html' },
    ],
    sharedVariables: { userId: 'usr_123', total: 99.99 },
  };

  it('genera HTML con timeline, estados, variables ${flow.*} y enlaces', () => {
    const html = generateFlowHtmlReport(mockResult);
    expect(html).toContain('Reporte del Flujo: checkout-flow');
    expect(html).toContain('#1 - auth');
    expect(html).toContain('PASSED');
    expect(html).toContain('${flow.userId}');
    expect(html).toContain('href="auth-report.html"');
    expect(generateFlowJsonReport(mockResult)).toContain('usr_123');
  });

  it('escapa HTML en valores no confiables', () => {
    const html = generateFlowHtmlReport({
      ...mockResult,
      modules: [{ module: '<script>x</script>', status: 'failed', error: '<b>boom</b>' }],
    });
    expect(html).not.toContain('<script>x</script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('normaliza el resultado real del orquestador', () => {
    const normalized = normalizeFlowResult({
      flow_name: 'f1',
      status: 'failed',
      results: {
        a: { result: 'passed' },
        b: { result: 'failed' },
        c: { result: 'skipped', failure_type: 'flow_step_failed', message: 'omitido' },
      },
      shared_variables: { ID: '7' },
    });
    expect(normalized.flowName).toBe('f1');
    expect(normalized.modules.map((m) => m.status)).toEqual(['passed', 'failed', 'skipped']);
    expect(normalized.sharedVariables).toEqual({ ID: '7' });
  });

  it('escribe .qa/reports/flow-<nombre>-<timestamp>.html y .json', () => {
    const paths = writeFlowReports(mockResult, testDir);
    expect(fs.existsSync(paths.html)).toBe(true);
    expect(fs.existsSync(paths.json)).toBe(true);
    expect(path.basename(paths.html)).toMatch(/^flow-checkout-flow-.+\.html$/);
    expect(path.dirname(paths.html)).toBe(path.join(testDir, '.qa', 'reports'));
  });

  it('la telemetría persiste la corrida en qap.sqlite y run.json, visible en listRuns()', () => {
    const runtimeDir = path.join(testDir, '.qa', 'runtime');
    const telemetry = createFlowTelemetry({ runtimeDir, flowName: 'checkout-flow' });

    telemetry.onCaseEnd({ flowName: 'checkout-flow', module: 'auth', caseId: 'tc1', status: 'passed', durationMs: 100 });
    telemetry.onCaseEnd({ flowName: 'checkout-flow', module: 'cart', caseId: 'tc2', status: 'passed', durationMs: 200 });
    const run = telemetry.finish();

    expect(fs.existsSync(path.join(runtimeDir, 'qap.sqlite'))).toBe(true);
    expect(fs.existsSync(path.join(runtimeDir, 'runs', run.runId, 'run.json'))).toBe(true);

    const db = new QapDatabase(runtimeDir);
    const runs = db.listRuns();
    expect(runs.map((r) => r.run_id)).toContain(run.runId);
    db.close();
  });
});