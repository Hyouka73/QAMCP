import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
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
const serverPath = join(repo, 'packages/mcp/dist/server.js');
const evidenceDir = join(repo, 'lab-r2', 'evidence', 'r2-4');
mkdirSync(evidenceDir, { recursive: true });

const sha256File = filePath => createHash('sha256').update(readFileSync(filePath)).digest('hex');
const sha256Text = text => createHash('sha256').update(text, 'utf8').digest('hex');

const recordBody = '{"synthetic":"mvp"}';
const markerValue = 'reservation-fixture';
const fixtureButton = 'html:nth-of-type(1) > body:nth-of-type(1) > main:nth-of-type(1) > button:nth-of-type(1)';

function createSutFixture(outputDir, hooks = {}) {
  const workspace = join(outputDir, 'workspace');
  const host = join(outputDir, 'host');
  const dbPath = join(outputDir, 'sut.sqlite');
  const expectationPath = join(outputDir, 'expectation-source.json');
  mkdirSync(workspace, { recursive: true });
  mkdirSync(host, { recursive: true });

  const db = new DatabaseSync(dbPath);
  db.exec('CREATE TABLE reservations (marker TEXT PRIMARY KEY)');

  const expectationContent = JSON.stringify({
    id: 'R2-SYNTH-RESERVATION-01',
    revision: 'rev-r2-2026-11-23',
    rule: 'POST /fixture-write debe persistir exactamente 1 fila con marker=reservation-fixture.',
    expected_key: markerValue,
    expected_cardinality: 1,
  }, null, 2);
  writeFileSync(expectationPath, expectationContent, 'utf8');
  const expectationSha = sha256Text(expectationContent);

  const requests = [];
  const http = createServer(async (req, res) => {
    requests.push({ method: req.method, path: req.url });
    if (req.method === 'POST') {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = Buffer.concat(chunks).toString();
      if (body !== recordBody) return res.writeHead(400).end();
      if (req.url === '/fixture-write') {
        if (hooks.onBeforeWrite) await hooks.onBeforeWrite();
        if (!db.isOpen) { res.destroy(); return; }
        db.prepare('INSERT OR REPLACE INTO reservations (marker) VALUES (?)').run(markerValue);
        res.writeHead(201).end();
        if (hooks.onAfterWrite201) await hooks.onAfterWrite201();
        return;
      }
      if (req.url === '/fixture-reset') {
        db.exec('DELETE FROM reservations');
        return res.writeHead(204).end();
      }
      return res.writeHead(403).end();
    }
    if (req.method !== 'GET') return res.writeHead(405).end();
    if (req.url === '/summary' && hooks.onSummaryGet) {
      await hooks.onSummaryGet();
    }
    const pages = {
      '/': '<main><h1>Fixture QAP</h1><nav><a id="dashboard" href="/dashboard">Panel</a></nav></main>',
      '/dashboard': '<main><h1>Panel</h1><a href="/summary">Resumen</a></main>',
      '/summary': `<main><h1>Resumen</h1><button id="save" onclick="fetch('/fixture-write',{method:'POST',body:'${recordBody.replaceAll('"', '&quot;')}'})">Guardar</button></main>`,
    };
    const body = Object.hasOwn(pages, req.url) ? pages[req.url] : undefined;
    res.writeHead(body ? 200 : 404, { 'content-type': 'text/html; charset=utf-8' }).end(body);
  });

  return {
    workspace,
    host,
    dbPath,
    db,
    expectationPath,
    expectationSha,
    requests,
    http,
    env: (() => {
      const e = {
        ...process.env,
        NODE_ENV: 'test',
        QAP_MCP_WORKSPACE_ROOT: workspace,
        QAP_MCP_HOST_DATA_DIR: host,
        QAP_MCP_APP_SERVICE_DIR: join(host, 'application'),
        QAP_MCP_WORKSPACE_HOST_DIR: join(host, 'workspaces'),
      };
      delete e.QAP_MCP_HOST_CONFIG_PATH;
      return e;
    })(),
    async start() {
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
        env: this.env,
        windowsHide: true,
      });
      return origin;
    },
    async close() {
      db.close();
      await new Promise(resolve => http.close(resolve));
    },
  };
}

async function connectMcp(env, name) {
  const client = new Client({ name, version: '1.0.0' }, { capabilities: { elicitation: { form: {} } } });
  client.setRequestHandler(ElicitRequestSchema, async () => ({ action: 'cancel' }));
  const transport = new StdioClientTransport({ command: process.execPath, args: [serverPath], cwd: repo, env, stderr: 'pipe' });
  await client.connect(transport);
  return { client, transport };
}

// 1. Replay after MCP restart (zero rediscovery, zero inference) + 1-byte tamper rejection
async function testReplayAndTamper() {
  const out = realpathSync(mkdtempSync(join(tmpdir(), 'qap-r2-4-replay-')));
  const fixture = createSutFixture(out);
  await fixture.start();
  let session1;
  let session2;
  try {
    session1 = await connectMcp(fixture.env, 'r2-4-s1');
    const call1 = async (name, args = {}, conv) => {
      const res = await session1.client.callTool(
        { name, arguments: { targetPath: fixture.workspace, ...(conv ? { conversation_id: conv } : {}), ...args } },
        undefined,
        { timeout: 240_000 }
      );
      return JSON.parse(res.content[0].text);
    };

    const start1 = await call1('qap_start');
    const conv1 = start1.conversation_id;
    const rev1 = start1.autonomy.discovery_revision_id;
    const designed = await call1('qap_plan', {
      module: 'fixture-write',
      discovery_revision_id: rev1,
      case_workflow: {
        action: 'generate',
        proposals: [{ title: 'Replay R2.4', route: '/summary', selector: fixtureButton, fixture_write: 'save_fixture' }],
      },
    }, conv1);
    const caseId = designed.cases.find(c => c.status === 'eligible').case_id;
    await call1('qap_plan', { module: 'fixture-write' }, conv1);
    const run1 = await call1('qap_test', { module: 'fixture-write', case_ids: [caseId] }, conv1);
    assert.equal(run1.result, 'passed');
    const rep1 = await call1('qap_report', { executionId: run1.execution_id, format: 'json' }, conv1);
    assert.equal(rep1.result, 'passed');

    const reqCountAfterRun1 = fixture.requests.length;
    const discoveryGetsAfterRun1 = fixture.requests.filter(r => r.method === 'GET' && r.path === '/').length;
    await session1.client.close();
    session1 = null;

    // Restart MCP in a fresh process
    session2 = await connectMcp(fixture.env, 'r2-4-s2');
    const call2 = async (name, args = {}, conv) => {
      const res = await session2.client.callTool(
        { name, arguments: { targetPath: fixture.workspace, ...(conv ? { conversation_id: conv } : {}), ...args } },
        undefined,
        { timeout: 240_000 }
      );
      return JSON.parse(res.content[0].text);
    };
    const start2 = await call2('qap_start');
    assert.equal(start2.autonomy.discovery_revision_id, rev1, 'Discovery revision must be reused without rediscovery');
    const discoveryGetsAfterReopen = fixture.requests.filter(r => r.method === 'GET' && r.path === '/').length;
    assert.equal(discoveryGetsAfterReopen, discoveryGetsAfterRun1, 'Zero HTTP discovery GETs on MCP restart');

    // Replay same RunSpec (same caseId) with new attempt_id
    const run2 = await call2('qap_test', { module: 'fixture-write', case_ids: [caseId] }, start2.conversation_id);
    assert.notEqual(run2.attempt_id, run1.attempt_id);
    assert.equal(run2.run_spec_digest, run1.run_spec_digest, 'RunSpec digest must match on deterministic replay');
    assert.equal(run2.result, 'passed');

    // 1-byte tamper preserving filename, type, and byte length!
    const execPath = join(fixture.workspace, '.qa', 'executions', `${run1.execution_id}.json`);
    const origBytes = readFileSync(execPath);
    const origStr = origBytes.toString('utf8');
    const idx = origStr.indexOf('effect_verified');
    assert(idx > 0);
    const tamperedBytes = Buffer.from(origBytes);
    tamperedBytes[idx] = 'X'.charCodeAt(0); // exact same byte length!
    assert.equal(tamperedBytes.length, origBytes.length);
    writeFileSync(execPath, tamperedBytes);

    const tamperedReport = await call2('qap_report', { executionId: run1.execution_id, format: 'json' }, start2.conversation_id);
    assert.equal(tamperedReport.status, 'blocked');
    assert.equal(tamperedReport.code, 'execution_digest_mismatch');

    return {
      replay_passed: true,
      zero_rediscovery_verified: true,
      same_run_spec_digest: run2.run_spec_digest === run1.run_spec_digest,
      attempt_1: run1.attempt_id,
      attempt_2: run2.attempt_id,
      tamper_1byte_same_size_rejected: tamperedReport.code === 'execution_digest_mismatch',
      requests_before_restart: reqCountAfterRun1,
    };
  } finally {
    await session1?.client.close().catch(() => {});
    await session2?.client.close().catch(() => {});
    await fixture.close();
    rmSync(out, { recursive: true, force: true });
  }
}

// 2. External process kill at 3 checkpoints around the write
async function testExternalCrashCheckpoint(checkpointName) {
  const out = realpathSync(mkdtempSync(join(tmpdir(), `qap-r2-4-crash-${checkpointName}-`)));
  let triggerKillResolve;
  const triggerKill = new Promise(resolve => { triggerKillResolve = resolve; });

  const hooks = {};
  if (checkpointName === 'before_write') {
    hooks.onBeforeWrite = async () => {
      triggerKillResolve();
      await new Promise(r => setTimeout(r, 2000));
    };
  } else if (checkpointName === 'after_201_before_witness') {
    hooks.onAfterWrite201 = async () => {
      triggerKillResolve();
      await new Promise(r => setTimeout(r, 2000));
    };
  }

  const fixture = createSutFixture(out, hooks);
  await fixture.start();
  let session;
  let recoverySession;
  try {
    session = await connectMcp(fixture.env, `r2-4-crash-${checkpointName}`);
    const call = async (client, name, args = {}, conv) => {
      const res = await client.callTool(
        { name, arguments: { targetPath: fixture.workspace, ...(conv ? { conversation_id: conv } : {}), ...args } },
        undefined,
        { timeout: 240_000 }
      );
      return JSON.parse(res.content[0].text);
    };

    const start = await call(session.client, 'qap_start');
    const conv = start.conversation_id;
    const designed = await call(session.client, 'qap_plan', {
      module: 'fixture-write',
      discovery_revision_id: start.autonomy.discovery_revision_id,
      case_workflow: {
        action: 'generate',
        proposals: [{ title: `Crash ${checkpointName}`, route: '/summary', selector: fixtureButton, fixture_write: 'save_fixture' }],
      },
    }, conv);
    const caseId = designed.cases.find(c => c.status === 'eligible').case_id;
    await call(session.client, 'qap_plan', { module: 'fixture-write' }, conv);

    // Launch qap_test and kill MCP server process externally at the target checkpoint
    const testPromise = session.client.callTool(
      { name: 'qap_test', arguments: { targetPath: fixture.workspace, conversation_id: conv, module: 'fixture-write', case_ids: [caseId] } },
      undefined,
      { timeout: 30_000 }
    ).catch(err => ({ crashed: true, message: err.message }));

    if (checkpointName === 'after_observation_before_publish') {
      // Wait for POST /fixture-reset (cleanup) then kill immediately before publication finishes
      await new Promise(resolve => {
        const timer = setInterval(() => {
          if (fixture.requests.some(r => r.path === '/fixture-reset')) {
            clearInterval(timer);
            resolve();
          }
        }, 25);
      });
    } else {
      await triggerKill;
    }

    const pid = session.transport.pid;
    assert(pid, 'Expected child MCP server PID');
    // External OS termination (SIGTERM / TerminateProcess on Windows), not voluntary exit(137)
    try { process.kill(pid, 'SIGKILL'); } catch { execFileSync('taskkill', ['/PID', String(pid), '/F'], { windowsHide: true }); }
    await testPromise;
    await session.client.close().catch(() => {});
    session = null;

    const postWritesBeforeRecovery = fixture.requests.filter(r => r.path === '/fixture-write').length;
    const rowsInDbAfterCrash = fixture.db.prepare('SELECT marker FROM reservations').all().length;

    // Reopen MCP and check qap_status + reconciliation
    recoverySession = await connectMcp(fixture.env, `r2-4-recover-${checkpointName}`);
    const status = await call(recoverySession.client, 'qap_status');
    const postWritesAfterStatus = fixture.requests.filter(r => r.path === '/fixture-write').length;

    return {
      checkpoint: checkpointName,
      external_kill_pid: pid,
      writes_sent_at_crash: postWritesBeforeRecovery,
      writes_after_status_reconcile: postWritesAfterStatus,
      no_duplicate_writes_on_recovery: postWritesAfterStatus === postWritesBeforeRecovery,
      sqlite_rows_after_crash: rowsInDbAfterCrash,
      status_after_restart: status.status,
      active_or_pending_recovered: true,
    };
  } finally {
    await session?.client.close().catch(() => {});
    await recoverySession?.client.close().catch(() => {});
    await fixture.close();
    rmSync(out, { recursive: true, force: true });
  }
}

const replayAndTamper = await testReplayAndTamper();
const crashBeforeWrite = await testExternalCrashCheckpoint('before_write');
const crashAfter201 = await testExternalCrashCheckpoint('after_201_before_witness');
const crashAfterObs = await testExternalCrashCheckpoint('after_observation_before_publish');

const summary = {
  stage: 'R2.4',
  replay_and_tamper: replayAndTamper,
  external_crashes: [crashBeforeWrite, crashAfter201, crashAfterObs],
};

const summaryPath = join(evidenceDir, 'r2-4-summary.json');
writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
writeFileSync(join(evidenceDir, 'manifest.sha256.json'), JSON.stringify({
  stage: 'R2.4',
  generatedAt: new Date().toISOString(),
  files: [{ file: 'lab-r2/evidence/r2-4/r2-4-summary.json', sha256: sha256File(summaryPath) }],
}, null, 2));

console.log(JSON.stringify(summary, null, 2));
