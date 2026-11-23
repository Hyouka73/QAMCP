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
const evidenceDir = join(repo, 'lab-r2', 'evidence', 'r2-1');
mkdirSync(evidenceDir, { recursive: true });

const sha256File = filePath => createHash('sha256').update(readFileSync(filePath)).digest('hex');
const sha256Text = text => createHash('sha256').update(text, 'utf8').digest('hex');

const recordBody = '{"synthetic":"mvp"}';
const markerValue = 'reservation-fixture';
const fixtureButton = 'html:nth-of-type(1) > body:nth-of-type(1) > main:nth-of-type(1) > button:nth-of-type(1)';

async function runArm(armName, rollbackMode) {
  const output = realpathSync(mkdtempSync(join(tmpdir(), `qap-r2-1-${armName}-`)));
  const workspace = join(output, 'workspace');
  const host = join(output, 'host');
  const dbPath = join(output, 'sut.sqlite');
  mkdirSync(workspace);
  mkdirSync(host);

  const db = new DatabaseSync(dbPath);
  db.exec('CREATE TABLE reservations (marker TEXT PRIMARY KEY)');

  const env = {
    ...process.env,
    NODE_ENV: 'test',
    QAP_MCP_WORKSPACE_ROOT: workspace,
    QAP_MCP_HOST_DATA_DIR: host,
    QAP_MCP_APP_SERVICE_DIR: join(host, 'application'),
    QAP_MCP_WORKSPACE_HOST_DIR: join(host, 'workspaces'),
  };
  delete env.QAP_MCP_HOST_CONFIG_PATH;

  const queryWitness = () => {
    const stdout = execFileSync(process.execPath, [witnessScript, dbPath, 'reservations'], {
      encoding: 'utf8',
      windowsHide: true,
    });
    return JSON.parse(stdout.trim());
  };

  const httpTrace = [];
  let witnessBeforeCleanup = null;
  let witnessAfterCleanup = null;

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
        witnessBeforeCleanup = queryWitness();
        db.exec('DELETE FROM reservations');
        witnessAfterCleanup = queryWitness();
        res.on('finish', () => {
          httpTrace.push({ method: 'POST', path: '/fixture-reset', status: res.statusCode });
        });
        res.writeHead(204).end();
        return;
      }
      res.writeHead(403).end();
      httpTrace.push({ method: 'POST', path: req.url, status: 403 });
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
  let elicitationCount = 0;

  try {
    client = new Client({ name: `qap-r2-1-${armName}`, version: '1.0.0' }, { capabilities: { elicitation: { form: {} } } });
    client.setRequestHandler(ElicitRequestSchema, async () => {
      elicitationCount++;
      return { action: 'cancel' };
    });
    const transport = new StdioClientTransport({ command: process.execPath, args: [serverPath], cwd: repo, env, stderr: 'pipe' });
    await client.connect(transport);

    const call = async (name, args = {}) => {
      const response = await client.callTool(
        {
          name,
          arguments: { targetPath: workspace, ...(conversation ? { conversation_id: conversation } : {}), ...args },
        },
        undefined,
        { timeout: 240_000 }
      );
      return JSON.parse(response.content[0].text);
    };

    const start = await call('qap_start');
    assert.equal(start.autonomy?.status, 'ready_for_design', JSON.stringify(start));
    conversation = start.conversation_id;
    const discoveryRevisionId = start.autonomy.discovery_revision_id;

    const mutationModule = 'fixture-write';
    const designed = await call('qap_plan', {
      module: mutationModule,
      discovery_revision_id: discoveryRevisionId,
      case_workflow: {
        action: 'generate',
        proposals: [
          {
            title: 'Alta sintética con limpieza',
            route: '/summary',
            selector: fixtureButton,
            fixture_write: 'save_fixture',
          },
        ],
      },
    });
    assert.equal(designed.status, 'materialized', JSON.stringify(designed));
    const caseId = designed.cases.find(item => item.status === 'eligible').case_id;

    const planned = await call('qap_plan', { module: mutationModule });
    assert.equal(planned.status, 'success', JSON.stringify(planned));

    const testResult = await call('qap_test', { module: mutationModule, case_ids: [caseId] });
    const reportResult = await call('qap_report', { executionId: testResult.execution_id, format: 'all' });
    assert.equal(reportResult.evidence_source, 'persisted_execution');
    assert.equal(reportResult.attempt_id, testResult.attempt_id);

    const reportJsonPath = reportResult.reports.json;
    const reportJsonRaw = readFileSync(reportJsonPath, 'utf8');
    const sanitizedReport = JSON.parse(
      reportJsonRaw.replaceAll(workspace, '<WORKSPACE>').replaceAll(host, '<HOST>').replaceAll(origin, 'http://127.0.0.1:<PORT>')
    );
    const outReportFile = join(evidenceDir, `legacy-report-${armName}.json`);
    writeFileSync(outReportFile, JSON.stringify(sanitizedReport, null, 2));

    return {
      arm: armName,
      transactionMode: rollbackMode ? 'ROLLBACK' : 'COMMIT',
      attempt_id: testResult.attempt_id,
      execution_id: testResult.execution_id,
      case_id: caseId,
      discovery_revision_id: discoveryRevisionId,
      runner_result: testResult.result,
      report_result: reportResult.result ?? sanitizedReport.summary?.status ?? sanitizedReport.status ?? testResult.result,
      http_trace: httpTrace,
      witness_before_cleanup: witnessBeforeCleanup,
      witness_after_cleanup: witnessAfterCleanup,
      elicitation_count: elicitationCount,
      server_js_sha256: sha256File(serverPath),
      legacy_report_file: `lab-r2/evidence/r2-1/legacy-report-${armName}.json`,
      legacy_report_sha256: sha256File(outReportFile),
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

assert.deepEqual(commitArm.witness_before_cleanup, { ok: true, count: 1, markers: [markerValue] });
assert.deepEqual(commitArm.witness_after_cleanup, { ok: true, count: 0, markers: [] });
assert.deepEqual(rollbackArm.witness_before_cleanup, { ok: true, count: 0, markers: [] });
assert.deepEqual(rollbackArm.witness_after_cleanup, { ok: true, count: 0, markers: [] });
assert.equal(commitArm.runner_result, 'passed');
assert.equal(rollbackArm.runner_result, 'passed', 'Expected legacy false PASS on ROLLBACK baseline');

const summary = {
  stage: 'R2.1',
  description: 'Differential reproduction of legacy false PASS on unmodified baseline a78322f',
  commit_arm: commitArm,
  rollback_arm: rollbackArm,
  false_pass_reproduced: rollbackArm.runner_result === 'passed' && rollbackArm.witness_before_cleanup.count === 0,
};

const summaryPath = join(evidenceDir, 'r2-1-summary.json');
writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

const manifest = {
  stage: 'R2.1',
  generatedAt: new Date().toISOString(),
  files: [
    'legacy-report-commit.json',
    'legacy-report-rollback.json',
    'r2-1-summary.json',
  ].map(name => ({
    file: `lab-r2/evidence/r2-1/${name}`,
    sha256: sha256File(join(evidenceDir, name)),
  })),
};
writeFileSync(join(evidenceDir, 'manifest.sha256.json'), JSON.stringify(manifest, null, 2));

console.log(JSON.stringify({
  false_pass_reproduced: summary.false_pass_reproduced,
  commit_attempt: commitArm.attempt_id,
  commit_witness_before: commitArm.witness_before_cleanup,
  rollback_attempt: rollbackArm.attempt_id,
  rollback_witness_before: rollbackArm.witness_before_cleanup,
  rollback_runner_result: rollbackArm.runner_result,
}, null, 2));
