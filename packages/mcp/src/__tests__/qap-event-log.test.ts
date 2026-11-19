import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, expect, it } from 'vitest';

import { classifyQapFailure, QapEventLog } from '../qap-event-log.js';

const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });

it('persists MCP events and a readable summary while redacting secret and conversation fields', () => {
  const workspace = mkdtempSync(join(tmpdir(), 'qap-event-log-'));
  roots.push(workspace);
  const sentinel = 'DO_NOT_LOG_THIS_PASSWORD_83915';
  const logger = new QapEventLog();
  logger.record({ workspace, requestId: '7', tool: 'qap_auth_add', durationMs: 19,
    args: { targetPath: workspace, profile: 'qa-user', username: 'test-account', password: sentinel, comment: sentinel },
    result: { content: [{ type: 'text', text: JSON.stringify({ status: 'success', code: 'authentication_verified', fase: 'WORKING', verified: true }) }] },
  });
  const summaryPath = join(workspace, '.qa', 'logs', 'QAP_PRUEBA_USUARIO.md');
  writeFileSync(summaryPath, 'Existing acceptance notes stay intact.');
  logger.record({ workspace, requestId: '8', tool: 'qap_status', durationMs: 4,
    args: { targetPath: workspace },
    result: { content: [{ type: 'text', text: JSON.stringify({ status: 'success', fase: 'DISCOVERY' }) }] },
  });

  const logPath = join(workspace, '.qa', 'logs', 'qap-events.jsonl');
  const log = readFileSync(logPath, 'utf8');
  const summary = readFileSync(join(workspace, '.qa', 'logs', 'QAP_PRUEBA_USUARIO.generated.md'), 'utf8');
  expect(log.split(/\r?\n/).filter(Boolean)).toHaveLength(2);
  expect(log).not.toContain(sentinel);
  expect(log).toContain('authentication_verified');
  expect(log).toContain('phase_change');
  expect(summary).toContain('qap_auth_add');
  expect(summary).toContain('qap_status');
  expect(summary).not.toContain(sentinel);
  expect(readFileSync(summaryPath, 'utf8')).toBe('Existing acceptance notes stay intact.');
});

it('preserves the returned code, operation, phase and safe causes without logging exception text or values', () => {
  const workspace = mkdtempSync(join(tmpdir(), 'qap-event-errors-'));
  roots.push(workspace);
  const logger = new QapEventLog();
  const secret = 'private-value-48271';
  const failure = new TypeError(secret, { cause: Object.assign(new Error(secret), { code: 'EACCES', path: secret }) });
  expect(logger.record({ workspace, requestId: secret, tool: 'qap_session_plan', operation: 'persist_plan',
    phase: 'WORKING', durationMs: 2, cause: classifyQapFailure(failure),
    args: { route: '/' + secret, flujos: [secret], module: secret, [secret]: secret },
    result: { isError: true, content: [{ type: 'text', text: JSON.stringify({
      status: 'blocked', code: 'working_plan_conflict', razon: secret, plan_revision_id: secret,
    }) }] },
  })).toBe(true);
  const log = readFileSync(join(workspace, '.qa', 'logs', 'qap-events.jsonl'), 'utf8');
  expect(log).not.toContain(secret);
  expect(JSON.parse(log)).toMatchObject({
    tool: 'qap_session_plan', operation: 'persist_plan', phase: 'WORKING',
    result: { status: 'blocked', code: 'working_plan_conflict' },
    error: { code: 'working_plan_conflict', cause: { kind: 'type_error', cause: { kind: 'error', system_code: 'EACCES' } } },
    references: { plan_revision_id: expect.stringMatching(/^sha256:/) },
  });
});
