import { existsSync, mkdtempSync, readFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { FileSystemStorage } from '@qap/knowledge';
import type { ExecutionResult } from '@qap/shared';
import { afterEach, describe, expect, it } from 'vitest';

import { ReportHandler } from '../handlers/report.handler.js';

const roots: string[] = [];
function workspace(): string {
  const root = mkdtempSync(join(tmpdir(), 'qap-report-handler-'));
  mkdirSync(join(root, '.qa'), { recursive: true });
  roots.push(root);
  return root;
}
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

const context = () => ({ requestId: 'report-test', signal: new AbortController().signal });
function evidence(
  id: string,
  moduleName = 'checkout',
  timestamp = '2026-11-02T15:00:00.000Z',
  status: 'passed' | 'partial' = 'passed'
): ExecutionResult {
  const cases: ExecutionResult['cases'] = [
    { id: 'TC-001', title: 'Valid test', result: 'passed', duration_ms: 12 },
  ];
  if (status === 'partial') {
    cases.push({
      id: 'TC-002',
      title: 'Failed test',
      result: 'failed',
      failure_type: 'assertion_failed',
      duration_ms: 7,
    });
  }
  return {
    _version: '1',
    execution_id: id,
    module: moduleName,
    env: 'local',
    started_at: timestamp,
    finished_at: timestamp,
    result: status,
    timed_out: false,
    summary: {
      total: cases.length,
      passed: 1,
      failed: status === 'partial' ? 1 : 0,
      skipped: 0,
      not_run: 0,
    },
    cases,
  };
}
function parse(response: Awaited<ReturnType<ReportHandler['execute']>>) {
  return JSON.parse(response.content[0].text as string) as Record<string, unknown>;
}

describe('VNEXT-014-D declarative ReportHandler — persisted evidence only', () => {
  it('D-R01: blocks reporting when no physical execution record exists', async () => {
    const root = workspace();
    const handler = new ReportHandler({ projectRoots: [root] });
    const response = await handler.execute({ targetPath: root, format: 'json' }, context());
    expect(response.isError).toBe(true);
    expect(parse(response).code).toBe('no_recorded_executions');
    expect(existsSync(join(root, '.qa', 'executions'))).toBe(false);
  });

  it('D-R02: creates JSON from a persisted schema-valid execution unchanged', async () => {
    const root = workspace();
    const storage = new FileSystemStorage({ rootDir: root });
    const recorded = evidence('exec_report_001');
    await storage.saveExecutionResult(recorded.execution_id, recorded);
    const handler = new ReportHandler({ projectRoots: [root] });
    const response = await handler.execute({ targetPath: root, executionId: 'exec_report_001', format: 'json' }, context());
    const body = parse(response);
    expect(response.isError).toBeFalsy();
    expect(body.status).toBe('success');
    expect(body.executionId).toBe('exec_report_001');
    const file = join(root, '.qa', 'executions', 'exec_report_001.report.json');
    expect(JSON.parse(readFileSync(file, 'utf8'))).toEqual(recorded);
  });

  it('D-R03: refuses inconsistent totals and does not create a report', async () => {
    const root = workspace();
    const storage = new FileSystemStorage({ rootDir: root });
    const inconsistent = evidence('exec_bad_counts');
    inconsistent.summary.total = 7;
    await storage.saveExecutionResult(inconsistent.execution_id, inconsistent);
    const response = await new ReportHandler({ projectRoots: [root] }).execute(
      { targetPath: root, executionId: inconsistent.execution_id, format: 'json' }, context()
    );
    expect(response.isError).toBe(true);
    expect(parse(response).code).toBe('invalid_execution_evidence');
    expect(existsSync(join(root, '.qa', 'executions', 'exec_bad_counts.report.json'))).toBe(false);
  });

  it('D-R04: latest selection respects module filter and real finished timestamps', async () => {
    const root = workspace();
    const storage = new FileSystemStorage({ rootDir: root });
    await storage.saveExecutionResult('exec_older', evidence('exec_older', 'checkout', '2026-11-01T12:00:00.000Z'));
    await storage.saveExecutionResult('exec_newer', evidence('exec_newer', 'billing', '2026-11-02T12:00:00.000Z'));
    const handler = new ReportHandler({ projectRoots: [root] });
    const response = await handler.execute({ targetPath: root, module: 'checkout', format: 'json' }, context());
    expect(parse(response).executionId).toBe('exec_older');
  });

  it('D-R05: blocks cross-module requests and path traversal identifiers', async () => {
    const root = workspace();
    const storage = new FileSystemStorage({ rootDir: root });
    await storage.saveExecutionResult('exec_checkout', evidence('exec_checkout'));
    const handler = new ReportHandler({ projectRoots: [root] });
    const mismatched = await handler.execute(
      { targetPath: root, module: 'billing', executionId: 'exec_checkout', format: 'json' }, context()
    );
    expect(parse(mismatched).code).toBe('execution_module_mismatch');
    await expect(handler.execute(
      { targetPath: root, executionId: '../../secret', format: 'json' }, context()
    )).rejects.toThrow();
  });

  it('D-R06: blocks screenshots pointing outside the approved evidence directory', async () => {
    const root = workspace();
    const storage = new FileSystemStorage({ rootDir: root });
    const recorded = evidence('exec_unsafe_image');
    recorded.cases[0].steps = [
      { action: 'screenshot', status: 'passed', screenshot: '../../sensitive.txt' },
    ];
    await storage.saveExecutionResult(recorded.execution_id, recorded);
    const response = await new ReportHandler({ projectRoots: [root] }).execute(
      { targetPath: root, executionId: recorded.execution_id, format: 'html' }, context()
    );
    expect(response.isError).toBe(true);
    expect(parse(response).code).toBe('unsafe_artifact_reference');
  });

  it('D-R07: renders all four formats from one persisted partial execution', async () => {
    const root = workspace();
    const storage = new FileSystemStorage({ rootDir: root });
    await storage.saveExecutionResult('exec_partial', evidence('exec_partial', 'orders', undefined, 'partial'));
    const response = await new ReportHandler({ projectRoots: [root] }).execute(
      { targetPath: root, executionId: 'exec_partial', format: 'all' }, context()
    );
    expect(response.isError).toBeFalsy();
    expect(parse(response).result).toBe('partial');
    for (const extension of ['html', 'md', 'xml', 'json']) {
      expect(existsSync(join(root, '.qa', 'executions', 'exec_partial.report.' + extension))).toBe(true);
    }
  });

  it('D-R08: rejects false PASS from a zero-case execution', async () => {
    const root = workspace();
    const storage = new FileSystemStorage({ rootDir: root });
    const empty = evidence('exec_false_pass');
    empty.cases = [];
    empty.summary = { total: 0, passed: 0, failed: 0, skipped: 0, not_run: 0 };
    // A schema-valid JSON is not sufficient to claim that any case was actually executed.
    await storage.saveExecutionResult(empty.execution_id, empty);
    const response = await new ReportHandler({ projectRoots: [root] }).execute(
      { targetPath: root, executionId: empty.execution_id, format: 'json' }, context()
    );
    expect(response.isError).toBe(true);
    expect(parse(response).code).toBe('invalid_execution_evidence');
    expect(existsSync(join(root, '.qa', 'executions', 'exec_false_pass.report.json'))).toBe(false);
  });

  it('D-R09: rejects a contradictory partial status with no failed, skipped or blocked cases', async () => {
    const root = workspace();
    const storage = new FileSystemStorage({ rootDir: root });
    const contradicting = evidence('exec_bad_partial');
    contradicting.result = 'partial';
    await storage.saveExecutionResult(contradicting.execution_id, contradicting);
    const response = await new ReportHandler({ projectRoots: [root] }).execute(
      { targetPath: root, executionId: contradicting.execution_id, format: 'json' }, context()
    );
    expect(response.isError).toBe(true);
    expect(parse(response).code).toBe('invalid_execution_evidence');
  });

  it('D-R10: rejects duplicate test identifiers without promoting ambiguous coverage', async () => {
    const root = workspace();
    const storage = new FileSystemStorage({ rootDir: root });
    const duplicate = evidence('exec_duplicate_cases');
    duplicate.cases = [
      { id: 'TC-001', title: 'Original case', result: 'passed', duration_ms: 1 },
      { id: 'TC-001', title: 'Duplicated case', result: 'passed', duration_ms: 1 },
    ];
    duplicate.summary = { total: 2, passed: 2, failed: 0, skipped: 0, not_run: 0 };
    await storage.saveExecutionResult(duplicate.execution_id, duplicate);
    const response = await new ReportHandler({ projectRoots: [root] }).execute(
      { targetPath: root, executionId: duplicate.execution_id, format: 'json' }, context()
    );
    expect(response.isError).toBe(true);
    expect(parse(response).code).toBe('invalid_execution_evidence');
  });
});
