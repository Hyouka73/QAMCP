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

const repo = fileURLToPath(new URL('../', import.meta.url));
const witnessScript = join(repo, 'lab-r2', 'witness-sqlite.mjs');
const evidenceDir = join(repo, 'lab-r2', 'evidence', 'r2-2');
mkdirSync(evidenceDir, { recursive: true });

const sha256File = filePath => createHash('sha256').update(readFileSync(filePath)).digest('hex');
const sha256Text = text => createHash('sha256').update(text, 'utf8').digest('hex');

const recordBody = '{"synthetic":"mvp"}';
const markerValue = 'reservation-fixture';
const fixtureButton = 'html:nth-of-type(1) > body:nth-of-type(1) > main:nth-of-type(1) > button:nth-of-type(1)';

async function runArm(armName, rollbackMode) {
  const output = realpathSync(mkdtempSync(join(tmpdir(), `qap-r2-2-${armName}-`)));
  const workspace = join(output, 'workspace');
  const host = join(output, 'host');
  const dbPath = join(output, 'sut.sqlite');
  const expectationPath = join(output, 'expectation-source.json');
  mkdirSync(workspace);
  mkdirSync(host);

  const db = new DatabaseSync(dbPath);
  db.exec('CREATE TABLE reservations (marker TEXT PRIMARY KEY)');

  const expectationContent = JSON.stringify({
    id: 'R2-SYNTH-RESERVATION-01',
    revision: 'rev-r2-2026-11-23',
    rule: 'POST /fixture-write debe persistir exactamente 1 fila con marker=reservation-fixture antes de limpieza.',
    expected_key: markerValue,
    expected_cardinality: 1,
  }, null, 2);
  writeFileSync(expectationPath, expectationContent, 'utf8');
  const expectationSha = sha256Text(expectationContent);

  const env = {
    ...process.env,
    NODE_ENV: 'test',
    QAP_MCP_WORKSPACE_ROOT: workspace,
    QAP_MCP_HOST_DATA_DIR: host,
    QAP_MCP_APP_SERVICE_DIR: join(host, 'application'),
    QAP_MCP_WORKSPACE_HOST_DIR: join(host, 'workspaces'),
  };
  delete env.QAP_MCP_HOST_CONFIG_PATH;

  const httpTrace = [];
  const http = createServer(async (req, res) => {
    if (req.method === 'POST') {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = Buffer.concat(chunks).toString();
      if (body !== recordBody) {
        res.writeHead(400).end();
        httpTrace.push({ method: 'POST', path: req.url, status: 400 });
        return;
      }
      if (req.url === '/fixture-write') {
        db.exec('BEGIN');
        db.prepare('INSERT OR REPLACE INTO reservations (marker) VALUES (?)').run(markerValue);
        db.exec(rollbackMode ? 'ROLLBACK' : 'COMMIT');
        res.on('finish', () => {
          httpTrace.push({ method: 'POST', path: '/fixture-write', status: res.statusCode, mode: rollbackMode ? 'ROLLBACK' : 'COMMIT' });
        });
        res.writeHead(201).end();
        return;
      }
      if (req.url === '/fixture-reset') {
        db.exec('DELETE FROM reservations');
        res.on('finish', () => {
          httpTrace.push({ method: 'POST', path: '/fixture-reset', status: res.statusCode });
        });
        res.writeHead(204).end();
        return;
      }
      res.writeHead(403).end();
      return;
    }
    if (req.method !== 'GET') {
      res.writeHead(405).end();
      return;
    }
    const pages = {
      '/': '<main><h1>Fixture QAP</h1><nav><a id="dashboard" href="/dashboard">Panel</a><a href="/forbidden">Fuera de política</a></nav></main>',
      '/dashboard': '<main><h1>Panel</h1><button id="detail" type="button">Detalle</button><a href="/summary">Resumen</a></main>',
      '/summary': `<main><h1>Resumen</h1><button id="save" onclick="fetch('/fixture-write',{method:'POST',body:'${recordBody.replaceAll('"', '&quot;')}'})">Guardar dato sintético</button></main>`,
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
                independence: 'I2',
                dbPath,
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
    client = new Client({ name: `qap-r2-2-${armName}`, version: '1.0.0' }, { capabilities: { elicitation: { form: {} } } });
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
    assert.equal(start.autonomy?.status, 'ready_for_design', JSON.stringify(start));
    conversation = start.conversation_id;

    const mutationModule = 'fixture-write';
    const designed = await call('qap_plan', {
      module: mutationModule,
      discovery_revision_id: start.autonomy.discovery_revision_id,
      case_workflow: {
        action: 'generate',
        proposals: [
          { title: 'Alta sintética con testigo I2', route: '/summary', selector: fixtureButton, fixture_write: 'save_fixture' },
        ],
      },
    });
    assert.equal(designed.status, 'materialized', JSON.stringify(designed));
    const caseId = designed.cases.find(item => item.status === 'eligible').case_id;
    assert.equal((await call('qap_plan', { module: mutationModule })).status, 'success');

    const testResult = await call('qap_test', { module: mutationModule, case_ids: [caseId] });
    const reportResult = await call('qap_report', { executionId: testResult.execution_id, format: 'all' });
    assert.equal(reportResult.evidence_source, 'persisted_execution', JSON.stringify({ testResult, reportResult }));
    assert.equal(reportResult.attempt_id, testResult.attempt_id);

    const outFile = join(evidenceDir, `r2-2-report-${armName}.json`);
    const sanitized = JSON.parse(
      JSON.stringify(reportResult)
        .replaceAll(workspace, '<WORKSPACE>')
        .replaceAll(host, '<HOST>')
        .replaceAll(output, '<TMP>')
        .replaceAll(origin, 'http://127.0.0.1:<PORT>')
    );
    writeFileSync(outFile, JSON.stringify(sanitized, null, 2));

    return {
      arm: armName,
      transactionMode: rollbackMode ? 'ROLLBACK' : 'COMMIT',
      attempt_id: testResult.attempt_id,
      execution_id: testResult.execution_id,
      run_spec_digest: testResult.run_spec_digest,
      runner_result: testResult.result,
      report_result: reportResult.result,
      effect_verdict: reportResult.effect_evaluation?.verdict,
      effect_code: reportResult.effect_evaluation?.code,
      evidence_digest: reportResult.effect_evaluation?.evidence_digest,
      http_trace: httpTrace,
      report_sha256: sha256File(outFile),
    };
  } finally {
    await client?.close().catch(() => {});
    db.close();
    await new Promise(resolve => http.close(resolve));
    rmSync(output, { recursive: true, force: true });
  }
}

const commitArm = await runArm('commit', false);
const rollbackArm = await runArm('rollback', true);

assert.equal(commitArm.runner_result, 'passed');
assert.equal(commitArm.report_result, 'passed');
assert.equal(commitArm.effect_verdict, 'PASS');
assert.equal(commitArm.effect_code, 'effect_verified');

assert.equal(rollbackArm.runner_result, 'failed');
assert.equal(rollbackArm.report_result, 'failed');
assert.equal(rollbackArm.effect_verdict, 'FAIL');
assert.equal(rollbackArm.effect_code, 'effect_missing_after_write');

const summary = {
  stage: 'R2.2',
  description: 'Effect evaluator + RunSpec + I2 SQLite readOnly witness integrated before stageProvisionalMcpFinalization',
  commit_arm: commitArm,
  rollback_arm: rollbackArm,
};
writeFileSync(join(evidenceDir, 'r2-2-summary.json'), JSON.stringify(summary, null, 2));

const manifest = {
  stage: 'R2.2',
  generatedAt: new Date().toISOString(),
  files: ['r2-2-report-commit.json', 'r2-2-report-rollback.json', 'r2-2-summary.json'].map(name => ({
    file: `lab-r2/evidence/r2-2/${name}`,
    sha256: sha256File(join(evidenceDir, name)),
  })),
};
writeFileSync(join(evidenceDir, 'manifest.sha256.json'), JSON.stringify(manifest, null, 2));

console.log(JSON.stringify({
  commit_verdict: commitArm.effect_verdict,
  commit_report_result: commitArm.report_result,
  rollback_verdict: rollbackArm.effect_verdict,
  rollback_report_result: rollbackArm.report_result,
  rollback_code: rollbackArm.effect_code,
}, null, 2));
