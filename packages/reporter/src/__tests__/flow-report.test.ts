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
import { QapReporter } from '../runner/qap-reporter.js';

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

  it('P1-B (5): blocked_missing_oracle conserva not_run, preserva el motivo original y persiste overallStatus = failed en SQLite y run.json', () => {
    const runtimeDir = path.join(testDir, '.qa', 'runtime');
    const telemetry = createFlowTelemetry({ runtimeDir, flowName: 'oracle-blocked-flow' });

    telemetry.onCaseEnd({
      flowName: 'oracle-blocked-flow',
      module: 'checkout',
      caseId: 'TC-BVA-001',
      status: 'not_run',
      durationMs: 0,
      error: 'blocked_missing_oracle: Caso generado sin oráculo de negocio acreditado.',
    });
    const run = telemetry.finish({ status: 'failed' });

    expect(run.overallStatus).toBe('failed');
    expect(run.steps).toHaveLength(1);
    expect(run.steps[0].status).toBe('not_run');
    expect(run.steps[0].error?.message).toContain('blocked_missing_oracle');

    const runJsonPath = path.join(runtimeDir, 'runs', run.runId, 'run.json');
    expect(fs.existsSync(runJsonPath)).toBe(true);
    const persistedJson = JSON.parse(fs.readFileSync(runJsonPath, 'utf-8'));
    expect(persistedJson.overallStatus).toBe('failed');
    expect(persistedJson.steps[0].status).toBe('not_run');
    expect(persistedJson.steps[0].error.message).toContain('blocked_missing_oracle');

    const db = new QapDatabase(runtimeDir);
    const row = db.getRunRow(run.runId);
    expect(row?.overall_status).toBe('failed');
    const reconstructed = db.getRun(run.runId);
    expect(reconstructed?.overallStatus).toBe('failed');
    expect(reconstructed?.steps[0].status).toBe('not_run');
    db.close();

    // Consistencia con normalizeFlowResult, JSON y HTML
    const normalized = normalizeFlowResult({
      flow_name: 'oracle-blocked-flow',
      status: 'failed',
      results: {
        checkout: {
          result: 'failed',
          cases: [
            {
              id: 'TC-BVA-001',
              result: 'not_run',
              not_run_reason: 'blocked_missing_oracle: Caso generado sin oráculo de negocio acreditado.',
            },
          ],
        },
      },
    });
    expect(normalized.status).toBe('failed');
    expect(normalized.terminalStatus).toBe('failed');
    expect(normalized.summary).toEqual({
      totalCases: 1,
      passed: 0,
      failed: 0,
      skipped: 0,
      notRun: 1,
    });
    expect(normalized.modules[0].status).toBe('failed');
    expect(normalized.modules[0].error).toContain('blocked_missing_oracle');
    expect(normalized.modules[0].cases).toEqual([
      {
        id: 'TC-BVA-001',
        status: 'not_run',
        durationMs: 0,
        reason: 'blocked_missing_oracle: Caso generado sin oráculo de negocio acreditado.',
      },
    ]);
    const reportPaths = writeFlowReports(normalized, testDir);
    const jsonText = fs.readFileSync(reportPaths.json, 'utf-8');
    const htmlText = fs.readFileSync(reportPaths.html, 'utf-8');
    expect(jsonText).toContain('TC-BVA-001');
    expect(jsonText).toContain('not_run');
    expect(jsonText).toContain('blocked_missing_oracle');
    expect(htmlText).toContain('TC-BVA-001');
    expect(htmlText).toContain('NOT_RUN');
    expect(htmlText).toContain('blocked_missing_oracle');
  });

  it('P1-B (6, 7, 8): agrega correctamente todos aprobados (passed), mixto fallido (overallStatus = failed + caseClassification = partial con not_run/skipped/failed distintos) y flujo sin casos (failed)', () => {
    const runtimeDir = path.join(testDir, '.qa', 'runtime');

    // 6. Todos aprobados -> passed
    const telPass = createFlowTelemetry({ runtimeDir, flowName: 'all-passed-flow' });
    telPass.onCaseEnd({ flowName: 'all-passed-flow', module: 'm1', caseId: 'TC-1', status: 'passed', durationMs: 50 });
    telPass.onCaseEnd({ flowName: 'all-passed-flow', module: 'm2', caseId: 'TC-2', status: 'passed', durationMs: 70 });
    const runPass = telPass.finish({ status: 'passed' });
    expect(runPass.overallStatus).toBe('passed');
    expect(runPass.terminalStatus).toBe('passed');
    expect(runPass.caseClassification).toBe('passed');
    expect(runPass.caseSummary).toEqual({
      totalCases: 2,
      passed: 2,
      failed: 0,
      skipped: 0,
      notRun: 0,
      blocked: 0,
    });

    // 7. Mezcla de aprobado y fallido/not_run/skipped -> terminal failed sin confundir contadores ni perder partial
    const telMixed = createFlowTelemetry({ runtimeDir, flowName: 'mixed-flow' });
    telMixed.onCaseEnd({ flowName: 'mixed-flow', module: 'm1', caseId: 'TC-PASS', status: 'passed', durationMs: 40 });
    telMixed.onCaseEnd({
      flowName: 'mixed-flow',
      module: 'm2',
      caseId: 'TC-NOT-RUN',
      status: 'not_run',
      durationMs: 0,
      error: 'blocked_missing_oracle',
    });
    telMixed.onCaseEnd({
      flowName: 'mixed-flow',
      module: 'm2',
      caseId: 'TC-FAIL',
      status: 'failed',
      durationMs: 15,
      error: 'assertion_failed',
    });
    telMixed.onCaseEnd({
      flowName: 'mixed-flow',
      module: 'm3',
      caseId: 'm3',
      status: 'skipped',
      durationMs: 0,
      error: 'flow_step_failed',
    });
    const runMixed = telMixed.finish({ status: 'failed' });
    expect(runMixed.overallStatus).toBe('failed');
    expect(runMixed.terminalStatus).toBe('failed');
    expect(runMixed.caseClassification).toBe('partial');
    expect(runMixed.caseSummary).toEqual({
      totalCases: 4,
      passed: 1,
      failed: 1,
      skipped: 1,
      notRun: 1,
      blocked: 0,
    });
    expect(runMixed.steps.map((s) => s.status)).toEqual(['passed', 'not_run', 'failed', 'skipped']);

    // Defensivo: una corrida Flow con pasos fallidos nunca se publica como passed aunque caller envíe status='passed'
    const telFalsePass = createFlowTelemetry({ runtimeDir, flowName: 'mixed-false-pass' });
    telFalsePass.onCaseEnd({ flowName: 'mixed-false-pass', module: 'm1', caseId: 'TC-PASS', status: 'passed', durationMs: 10 });
    telFalsePass.onCaseEnd({ flowName: 'mixed-false-pass', module: 'm2', caseId: 'TC-FAIL', status: 'failed', durationMs: 10, error: 'boom' });
    const runFalsePass = telFalsePass.finish({ status: 'passed' });
    expect(runFalsePass.overallStatus).toBe('failed');
    expect(runFalsePass.terminalStatus).toBe('failed');
    expect(runFalsePass.caseClassification).toBe('partial');

    // 8. Flujo sin resultados (con failed o incluso sin resumeNoOp) -> nunca passed (siempre failed)
    const telEmptyFail = createFlowTelemetry({ runtimeDir, flowName: 'empty-failed-flow' });
    const runEmptyFail = telEmptyFail.finish({ status: 'failed', error: 'flow_context_missing' });
    expect(runEmptyFail.overallStatus).toBe('failed');
    expect(runEmptyFail.terminalStatus).toBe('failed');
    expect(runEmptyFail.steps).toEqual([]);

    const telEmptyNoResume = createFlowTelemetry({ runtimeDir, flowName: 'empty-no-resume-flow' });
    const runEmptyNoResume = telEmptyNoResume.finish({ status: 'passed' });
    expect(runEmptyNoResume.overallStatus).toBe('failed');
    expect(runEmptyNoResume.terminalStatus).toBe('failed');
    expect(runEmptyNoResume.steps).toEqual([]);

    // 9. Resume no-op con checkpoint completo -> passed coherente sin inventar eventos PASS
    const telResumeNoOp = createFlowTelemetry({ runtimeDir, flowName: 'resume-noop-flow' });
    const runResumeNoOp = telResumeNoOp.finish({ status: 'passed', resumeNoOp: true });
    expect(runResumeNoOp.overallStatus).toBe('passed');
    expect(runResumeNoOp.terminalStatus).toBe('passed');
    expect(runResumeNoOp.resumeNoOp).toBe(true);
    expect(runResumeNoOp.steps).toEqual([]);

    const db = new QapDatabase(runtimeDir);
    expect(db.getRunRow(runPass.runId)?.overall_status).toBe('passed');
    expect(db.getRunRow(runMixed.runId)?.overall_status).toBe('failed');
    expect(db.getRunRow(runMixed.runId)?.terminal_status).toBe('failed');
    expect(db.getRunRow(runMixed.runId)?.case_classification).toBe('partial');
    expect(db.getRunRow(runFalsePass.runId)?.overall_status).toBe('failed');
    expect(db.getRunRow(runEmptyFail.runId)?.overall_status).toBe('failed');
    expect(db.getRunRow(runEmptyNoResume.runId)?.overall_status).toBe('failed');
    expect(db.getRunRow(runResumeNoOp.runId)?.overall_status).toBe('passed');
    expect(db.reindex()).toBeGreaterThanOrEqual(6);
    db.close();
  });

  it('conserva contrato tradicional de QapReporter fuera de Flow (mixto sin Flow -> partial) y detalle de casos en reporte mixto Flow', () => {
    const runtimeDir = path.join(testDir, '.qa', 'runtime-traditional');
    const trad = new QapReporter({ runtimeDir, capabilities: [] });
    trad.onTestEnd({ file: 'a.spec.ts', title: 'ok', status: 'passed', durationMs: 25 });
    trad.onTestEnd({ file: 'b.spec.ts', title: 'bad', status: 'failed', durationMs: 30, error: { message: 'boom' } });
    const tradRun = trad.finishRun();
    trad.close();

    expect(tradRun.overallStatus).toBe('partial');
    expect(tradRun.terminalStatus).toBeUndefined();

    // Reporte Flow HTML/JSON para flujo mixto conserva todos los casos, estados y motivos
    const normalizedMixed = normalizeFlowResult({
      flow_name: 'mixed-flow-report',
      status: 'failed',
      results: {
        m1: {
          result: 'partial',
          cases: [
            { id: 'TC-OK', title: 'Caso Aprobado', result: 'passed', duration_ms: 42 },
            { id: 'TC-BLK', title: 'Caso Bloqueado', result: 'not_run', duration_ms: 0, not_run_reason: 'blocked_missing_oracle: Sin oráculo' },
            { id: 'TC-BAD', title: 'Caso Fallido', result: 'failed', duration_ms: 19, failure_type: 'assertion_failed', steps: [{ status: 'failed', message: 'expected true got false' }] },
          ],
        },
        m2: {
          result: 'skipped',
          message: 'Omitido por fail_fast',
        },
      },
    });
    expect(normalizedMixed.status).toBe('failed');
    expect(normalizedMixed.terminalStatus).toBe('failed');
    expect(normalizedMixed.summary).toEqual({
      totalCases: 3,
      passed: 1,
      failed: 1,
      skipped: 0,
      notRun: 1,
    });
    expect(normalizedMixed.modules[0].cases?.map((c) => [c.id, c.status])).toEqual([
      ['TC-OK', 'passed'],
      ['TC-BLK', 'not_run'],
      ['TC-BAD', 'failed'],
    ]);

    const paths = writeFlowReports(normalizedMixed, testDir);
    const json = fs.readFileSync(paths.json, 'utf-8');
    const html = fs.readFileSync(paths.html, 'utf-8');
    expect(json).toContain('TC-OK');
    expect(json).toContain('TC-BLK');
    expect(json).toContain('TC-BAD');
    expect(json).toContain('blocked_missing_oracle: Sin oráculo');
    expect(json).toContain('expected true got false');
    expect(html).toContain('TC-OK');
    expect(html).toContain('TC-BLK');
    expect(html).toContain('TC-BAD');
    expect(html).toContain('blocked_missing_oracle: Sin oráculo');
    expect(html).toContain('expected true got false');
    expect(html).toContain('Resultado Terminal:');
  });
});