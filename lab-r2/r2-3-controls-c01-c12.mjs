import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ElicitRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { computeRunSpecDigest, evaluateEffect } from '../packages/playwright-runner/dist/index.js';

const repo = fileURLToPath(new URL('../', import.meta.url));
const witnessScript = join(repo, 'lab-r2', 'witness-sqlite.mjs');
const evidenceDir = join(repo, 'lab-r2', 'evidence', 'r2-3');
mkdirSync(evidenceDir, { recursive: true });

const sha256File = filePath => createHash('sha256').update(readFileSync(filePath)).digest('hex');
const sha256Text = text => createHash('sha256').update(text, 'utf8').digest('hex');

const recordBody = '{"synthetic":"mvp"}';
const markerValue = 'reservation-fixture';
const fixtureButton = 'html:nth-of-type(1) > body:nth-of-type(1) > main:nth-of-type(1) > button:nth-of-type(1)';

async function runMcpControl(controlId, options) {
  const output = realpathSync(mkdtempSync(join(tmpdir(), `qap-r2-3-${controlId}-`)));
  const workspace = join(output, 'workspace');
  const host = join(output, 'host');
  const dbPath = join(output, 'sut.sqlite');
  const expectationPath = join(output, 'expectation-source.json');
  mkdirSync(workspace);
  mkdirSync(host);

  const db = new DatabaseSync(dbPath);
  db.exec('CREATE TABLE reservations (marker TEXT PRIMARY KEY)');
  if (options.preseedRow) {
    db.prepare('INSERT INTO reservations (marker) VALUES (?)').run(markerValue);
  }

  const expectationContent = JSON.stringify({
    id: 'R2-SYNTH-RESERVATION-01',
    revision: 'rev-r2-2026-11-23',
    rule: 'POST /fixture-write debe persistir exactamente 1 fila con marker=reservation-fixture.',
    expected_key: markerValue,
    expected_cardinality: 1,
  }, null, 2);

  if (!options.missingExpectationFile) {
    writeFileSync(expectationPath, expectationContent, 'utf8');
  }
  const expectationSha = options.wrongExpectationSha
    ? '0'.repeat(64)
    : sha256Text(expectationContent);

  const env = {
    ...process.env,
    NODE_ENV: 'test',
    QAP_MCP_WORKSPACE_ROOT: workspace,
    QAP_MCP_HOST_DATA_DIR: host,
    QAP_MCP_APP_SERVICE_DIR: join(host, 'application'),
    QAP_MCP_WORKSPACE_HOST_DIR: join(host, 'workspaces'),
  };
  delete env.QAP_MCP_HOST_CONFIG_PATH;

  const http = createServer(async (req, res) => {
    if (req.method === 'POST') {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = Buffer.concat(chunks).toString();
      if (body !== recordBody) return res.writeHead(400).end();
      if (req.url === '/fixture-write') {
        if (options.writeBehavior === 'rollback') {
          db.exec('BEGIN');
          db.prepare('INSERT OR REPLACE INTO reservations (marker) VALUES (?)').run(markerValue);
          db.exec('ROLLBACK');
        } else if (options.writeBehavior === 'wrong_key') {
          db.prepare('INSERT OR REPLACE INTO reservations (marker) VALUES (?)').run('other-reservation-key');
        } else if (options.writeBehavior === 'duplicate') {
          db.prepare('INSERT OR REPLACE INTO reservations (marker) VALUES (?)').run(markerValue);
          db.prepare('INSERT OR REPLACE INTO reservations (marker) VALUES (?)').run(`${markerValue}-dup`);
        } else {
          db.prepare('INSERT OR REPLACE INTO reservations (marker) VALUES (?)').run(markerValue);
        }
        return res.writeHead(201).end();
      }
      if (req.url === '/fixture-reset') {
        if (!options.leaveRowOnCleanup) {
          db.exec('DELETE FROM reservations');
        }
        return res.writeHead(204).end();
      }
      return res.writeHead(403).end();
    }
    if (req.method !== 'GET') return res.writeHead(405).end();
    const pages = {
      '/': '<main><h1>Fixture QAP</h1><nav><a id="dashboard" href="/dashboard">Panel</a></nav></main>',
      '/dashboard': '<main><h1>Panel</h1><a href="/summary">Resumen</a></main>',
      '/summary': `<main><h1>Resumen</h1><button id="save" onclick="fetch('/fixture-write',{method:'POST',body:'${recordBody.replaceAll('"', '&quot;')}'})">Guardar</button></main>`,
    };
    const body = Object.hasOwn(pages, req.url) ? pages[req.url] : undefined;
    res.writeHead(body ? 200 : 404, { 'content-type': 'text/html; charset=utf-8' }).end(body);
  });

  await new Promise((resolve, reject) => {
    http.once('error', reject);
    http.listen(0, '127.0.0.1', resolve);
  });
  const origin = `http://127.0.0.1:${http.address().port}`;

  writeFileSync(
    join(host, 'qa-autonomy-policy.json'),
    JSON.stringify({
      version: 1,
      targets: [
        {
          workspace,
          origin,
          entry: '/',
          environment: 'test',
          isolatedFixture: true,
          batchPages: 1,
          paths: ['/', '/dashboard', '/summary'],
          fixtureWrites: [
            {
              id: 'save_fixture',
              view: '/summary',
              selector: fixtureButton,
              path: '/fixture-write',
              cleanup: '/fixture-reset',
              body: recordBody,
              effectWitness: {
                type: 'sqlite_readonly_process',
                independence: options.independence ?? 'I2',
                dbPath: options.badDbPath ? join(output, 'missing.sqlite') : dbPath,
                table: 'reservations',
                expectedKey: markerValue,
                expectedCardinality: 1,
                witnessScriptPath: witnessScript,
                expectationSourcePath: expectationPath,
                expectationSourceRevision: 'rev-r2-2026-11-23',
                expectationSourceSha256: expectationSha,
                expectationSourceRule: 'R2-SYNTH-RESERVATION-01',
              },
            },
          ],
        },
      ],
    }, null, 2)
  );

  execFileSync(process.execPath, [join(repo, 'scripts/qap-authorize-workspace.mjs'), workspace], {
    env,
    windowsHide: true,
  });

  const serverPath = join(repo, 'packages/mcp/dist/server.js');
  let client;
  let conversation;
  try {
    client = new Client({ name: `qap-r2-3-${controlId}`, version: '1.0.0' }, { capabilities: { elicitation: { form: {} } } });
    client.setRequestHandler(ElicitRequestSchema, async () => ({ action: 'cancel' }));
    const transport = new StdioClientTransport({ command: process.execPath, args: [serverPath], cwd: repo, env, stderr: 'pipe' });
    await client.connect(transport);

    const call = async (name, args = {}) => {
      const response = await client.callTool(
        { name, arguments: { targetPath: workspace, ...(conversation ? { conversation_id: conversation } : {}), ...args } },
        undefined,
        { timeout: 240_000 }
      );
      return JSON.parse(response.content[0].text);
    };

    const start = await call('qap_start');
    conversation = start.conversation_id;
    const designed = await call('qap_plan', {
      module: 'fixture-write',
      discovery_revision_id: start.autonomy.discovery_revision_id,
      case_workflow: {
        action: 'generate',
        proposals: [{ title: `Control ${controlId}`, route: '/summary', selector: fixtureButton, fixture_write: 'save_fixture' }],
      },
    });
    const caseId = designed.cases.find(item => item.status === 'eligible').case_id;
    await call('qap_plan', { module: 'fixture-write' });

    const testResult = await call('qap_test', { module: 'fixture-write', case_ids: [caseId] });

    if (options.tamperExecutionFile) {
      const execFile = join(workspace, '.qa', 'executions', `${testResult.execution_id}.json`);
      const original = readFileSync(execFile, 'utf8');
      // Alter a byte in place while keeping JSON valid
      const mutated = original.replace('effect_verified', 'effect_tampered');
      writeFileSync(execFile, mutated, 'utf8');
    }

    const reportResult = await call('qap_report', { executionId: testResult.execution_id, format: 'json' });
    return {
      control: controlId,
      mode: 'real_mcp_e2e',
      test_result: testResult.result,
      effect_verdict: testResult.effect_evaluation?.verdict ?? null,
      effect_code: testResult.effect_evaluation?.code ?? null,
      report_status: reportResult.status,
      report_code: reportResult.code ?? null,
      report_result: reportResult.result ?? null,
      false_pass: options.tamperExecutionFile
        ? reportResult.result === 'passed'
        : testResult.result === 'passed' || reportResult.result === 'passed',
    };
  } finally {
    await client?.close().catch(() => {});
    db.close();
    await new Promise(resolve => http.close(resolve));
    rmSync(output, { recursive: true, force: true });
  }
}

function runEvaluatorControl(controlId, mutate) {
  const expectationContent = JSON.stringify({
    id: 'R2-SYNTH-RESERVATION-01',
    revision: 'rev-1',
    rule: 'Exact 1 row with marker=reservation-fixture',
  });
  const baseSpec = {
    schema_version: 1,
    case_id: 'case-r2-3',
    case_revision: '1',
    plan_hash: 'plan-sha',
    discovery_revision_id: 'disc-1',
    project_id: 'proj-1',
    attempt_id: 'att-expected-01',
    execution_id: 'exec-01',
    scope: { origin: 'http://127.0.0.1:1234', environment: 'test', tenant: 'tenant-a', principal: 'user-a' },
    policy_digest: 'policy-sha',
    expectation_source: {
      id: 'R2-SYNTH-RESERVATION-01',
      revision: 'rev-1',
      sha256: sha256Text(expectationContent),
      rule: 'R2-SYNTH-RESERVATION-01',
    },
    witness_spec: {
      type: 'sqlite_readonly_process',
      independence: 'I2',
      revision: 'rev-1',
      expected_key: markerValue,
      expected_cardinality: 1,
    },
  };
  const baseInput = {
    runSpec: baseSpec,
    expectationSourceContent: expectationContent,
    precondition: { phase: 'precondition', ok: true, observed_at: '2026-11-23T10:00:00.000Z', count: 0, records: [] },
    postWrite: {
      phase: 'post_write',
      ok: true,
      observed_at: '2026-11-23T10:00:01.000Z',
      window_closed_at: '2026-11-23T10:00:05.000Z',
      attempt_id: 'att-expected-01',
      revision: '1',
      scope: { environment: 'test', tenant: 'tenant-a', principal: 'user-a' },
      count: 1,
      records: [{ key: markerValue }],
    },
    postCleanup: { phase: 'post_cleanup', ok: true, observed_at: '2026-11-23T10:00:02.000Z', count: 0, records: [] },
    artifactIntegrityOk: true,
    now: '2026-11-23T10:00:03.000Z',
  };
  const input = mutate(baseInput);
  const res = evaluateEffect(input);
  return {
    control: controlId,
    mode: 'evaluator_with_runspec',
    run_spec_digest: computeRunSpecDigest(input.runSpec),
    effect_verdict: res.verdict,
    effect_code: res.code,
    reason: res.reason,
    false_pass: res.verdict === 'PASS',
  };
}

const results = [];

// Positive control (healthy COMMIT)
const positive = await runMcpControl('POS', { writeBehavior: 'commit' });
assert.equal(positive.effect_verdict, 'PASS');
assert.equal(positive.report_result, 'passed');
results.push({ ...positive, expected: 'PASS', passed_control: true });

// C01: 201 with rolled-back transaction -> FAIL
const c01 = await runMcpControl('C01', { writeBehavior: 'rollback' });
assert.equal(c01.effect_verdict, 'FAIL');
assert.equal(c01.effect_code, 'effect_missing_after_write');
assert.equal(c01.false_pass, false);
results.push({ ...c01, expected: 'FAIL', passed_control: true });

// C02: 201 with pre-existing row -> BLOCKED (precondition_not_clean), zero PASS
const c02 = await runMcpControl('C02', { preseedRow: true });
assert.equal(c02.effect_verdict, 'BLOCKED');
assert.equal(c02.effect_code, 'precondition_not_clean');
assert.equal(c02.false_pass, false);
results.push({ ...c02, expected: 'BLOCKED', passed_control: true });

// C03: 201 and write to another key -> FAIL
const c03 = await runMcpControl('C03', { writeBehavior: 'wrong_key' });
assert.equal(c03.effect_verdict, 'FAIL');
assert.equal(c03.effect_code, 'effect_key_or_value_mismatch');
assert.equal(c03.false_pass, false);
results.push({ ...c03, expected: 'FAIL', passed_control: true });

// C04: 201 and duplicate write -> FAIL (cardinality)
const c04 = await runMcpControl('C04', { writeBehavior: 'duplicate' });
assert.equal(c04.effect_verdict, 'FAIL');
assert.equal(c04.effect_code, 'effect_cardinality_mismatch');
assert.equal(c04.false_pass, false);
results.push({ ...c04, expected: 'FAIL', passed_control: true });

// C05: Witness lacks I2 independence -> INDETERMINATE
const c05 = runEvaluatorControl('C05', base => ({
  ...base,
  runSpec: { ...base.runSpec, witness_spec: { ...base.runSpec.witness_spec, independence: 'I1' } },
}));
assert.equal(c05.effect_verdict, 'INDETERMINATE');
assert.equal(c05.effect_code, 'witness_not_independent');
assert.equal(c05.false_pass, false);
results.push({ ...c05, expected: 'INDETERMINATE', passed_control: true });

// C06: Evidence from another attempt -> BLOCKED (correlation_mismatch)
const c06 = runEvaluatorControl('C06', base => ({
  ...base,
  postWrite: { ...base.postWrite, attempt_id: 'att-other-attempt' },
}));
assert.equal(c06.effect_verdict, 'BLOCKED');
assert.equal(c06.effect_code, 'correlation_mismatch');
assert.equal(c06.false_pass, false);
results.push({ ...c06, expected: 'BLOCKED', passed_control: true });

// C07: Witness from another tenant/environment -> BLOCKED (scope_mismatch)
const c07 = runEvaluatorControl('C07', base => ({
  ...base,
  postWrite: { ...base.postWrite, scope: { environment: 'test', tenant: 'tenant-other', principal: 'user-a' } },
}));
assert.equal(c07.effect_verdict, 'BLOCKED');
assert.equal(c07.effect_code, 'scope_mismatch');
assert.equal(c07.false_pass, false);
results.push({ ...c07, expected: 'BLOCKED', passed_control: true });

// C08: Witness connection down / missing SQLite DB -> TECHNICAL_ERROR
const c08 = await runMcpControl('C08', { badDbPath: true });
assert.equal(c08.effect_verdict, 'TECHNICAL_ERROR');
assert.equal(c08.effect_code, 'witness_connection_error');
assert.equal(c08.false_pass, false);
results.push({ ...c08, expected: 'TECHNICAL_ERROR', passed_control: true });

// C09: Expectation source missing -> INDETERMINATE
const c09 = await runMcpControl('C09', { missingExpectationFile: true });
assert.equal(c09.effect_verdict, 'INDETERMINATE');
assert.equal(c09.effect_code, 'expectation_source_missing');
assert.equal(c09.false_pass, false);
results.push({ ...c09, expected: 'INDETERMINATE', passed_control: true });

// C10: Artifact altered after capture -> rejected before publication (execution_digest_mismatch)
const c10 = await runMcpControl('C10', { writeBehavior: 'commit', tamperExecutionFile: true });
assert.equal(c10.report_status, 'blocked');
assert.equal(c10.report_code, 'execution_digest_mismatch');
assert.equal(c10.report_result, null);
results.push({ ...c10, expected: 'execution_digest_mismatch', passed_control: true });

// C11: Cleanup 204 leaves row -> TECHNICAL_ERROR (cleanup_failed), zero terminal PASS
const c11 = await runMcpControl('C11', { writeBehavior: 'commit', leaveRowOnCleanup: true });
assert.equal(c11.effect_verdict, 'TECHNICAL_ERROR');
assert.equal(c11.effect_code, 'cleanup_failed');
assert.equal(c11.false_pass, false);
results.push({ ...c11, expected: 'TECHNICAL_ERROR', passed_control: true });

// C12: Effect appears outside observation window -> INDETERMINATE
const c12 = runEvaluatorControl('C12', base => ({
  ...base,
  postWrite: { ...base.postWrite, observed_at: '2026-11-23T10:00:09.000Z', window_closed_at: '2026-11-23T10:00:05.000Z' },
}));
assert.equal(c12.effect_verdict, 'INDETERMINATE');
assert.equal(c12.effect_code, 'effect_outside_observation_window');
assert.equal(c12.false_pass, false);
results.push({ ...c12, expected: 'INDETERMINATE', passed_control: true });

const summaryPath = join(evidenceDir, 'r2-3-controls-summary.json');
writeFileSync(summaryPath, JSON.stringify({
  stage: 'R2.3',
  total_controls: 12,
  positive_controls: 1,
  false_passes: results.filter(r => r.control !== 'POS' && r.false_pass).length,
  results,
}, null, 2));

writeFileSync(join(evidenceDir, 'manifest.sha256.json'), JSON.stringify({
  stage: 'R2.3',
  generatedAt: new Date().toISOString(),
  files: [{ file: 'lab-r2/evidence/r2-3/r2-3-controls-summary.json', sha256: sha256File(summaryPath) }],
}, null, 2));

console.log(JSON.stringify({
  controls_passed: results.filter(r => r.passed_control).length,
  total: results.length,
  false_passes: results.filter(r => r.control !== 'POS' && r.false_pass).length,
}, null, 2));
