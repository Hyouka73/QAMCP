import assert from 'node:assert/strict';
import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ElicitRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const repo = fileURLToPath(new URL('../', import.meta.url));
const output = realpathSync(mkdtempSync(join(tmpdir(), 'qap-autonomous-mvp-')));
const workspace = join(output, 'workspace');
const host = join(output, 'host');
const env = { ...process.env, NODE_ENV: 'test', QAP_MCP_WORKSPACE_ROOT: workspace,
  QAP_MCP_HOST_DATA_DIR: host, QAP_MCP_APP_SERVICE_DIR: join(host, 'application'),
  QAP_MCP_WORKSPACE_HOST_DIR: join(host, 'workspaces') };
delete env.QAP_MCP_HOST_CONFIG_PATH;
mkdirSync(workspace);
mkdirSync(host);
const writeJson = (name, value) => writeFileSync(join(output, name), JSON.stringify(value, null, 2));
const sha = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const requests = [];
const recordBody = '{"synthetic":"mvp"}';
const fixtureButton = 'html:nth-of-type(1) > body:nth-of-type(1) > main:nth-of-type(1) > button:nth-of-type(1)';
let fixtureRecord = false;
const http = createServer(async (req, res) => {
  requests.push({ method: req.method, path: req.url, agent: req.headers['user-agent'] });
  writeJson('requests.json', requests);
  if (req.method === 'POST') {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    if (Buffer.concat(chunks).toString() !== recordBody) return res.writeHead(400).end();
    if (req.url === '/fixture-write' && !fixtureRecord) { fixtureRecord = true; return res.writeHead(201).end(); }
    if (req.url === '/fixture-reset') { fixtureRecord = false; return res.writeHead(204).end(); }
    return res.writeHead(403).end();
  }
  if (req.method !== 'GET') return res.writeHead(405).end();
  const pages = {
    '/': '<main><h1>Fixture QAP</h1><nav><a id="dashboard" href="/dashboard">Panel</a><a href="/forbidden">Fuera de política</a></nav></main>',
    '/dashboard': '<main><h1>Panel</h1><button id="detail" type="button">Detalle</button><a href="/summary">Resumen</a></main>',
    '/summary': `<main><h1>Resumen</h1><button id="save" onclick="fetch('/fixture-write',{method:'POST',body:'${recordBody.replaceAll('"','&quot;')}'})">Guardar dato sintético</button></main>`,
  };
  const body = Object.hasOwn(pages, req.url) ? pages[req.url] : undefined;
  res.writeHead(body ? 200 : 404, { 'content-type': 'text/html; charset=utf-8' }).end(body);
});
await new Promise((resolve, reject) => {
  http.once('error', reject);
  http.listen(0, '127.0.0.1', resolve);
});
const origin = `http://127.0.0.1:${http.address().port}`;
writeJson(join('host', 'qa-autonomy-policy.json'), { version: 1, targets: [{ workspace, origin, entry: '/',
  environment: 'test', isolatedFixture: true, batchPages: 1, paths: ['/', '/dashboard', '/summary'],
  fixtureWrites: [{ id: 'save_fixture', view: '/summary', selector: fixtureButton, path: '/fixture-write', cleanup: '/fixture-reset', body: recordBody }] }] });
execFileSync(process.execPath, [join(repo, 'scripts/qap-authorize-workspace.mjs'), workspace], { env, windowsHide: true });
const server = join(repo, 'packages/mcp/dist/server.js');
const serverConfig = { command: process.execPath, args: [server], env: Object.fromEntries(Object.entries(env)
  .filter(([key]) => key.startsWith('QAP_MCP_') || key === 'NODE_ENV')) };
writeJson('fixture.json', { workspace, origin, host, serverConfig, bundle_entry_sha256: sha(server) });
console.log('Evidencia del fixture:', output);
if (process.argv.includes('--serve')) {
  console.log('Fixture listo para Antigravity:', origin);
  console.log('Workspace autorizado:', workspace);
} else {
  await verify().finally(() => new Promise(resolve => http.close(resolve)));
}

async function verify() {
  const transcript = [];
  let client;
  let elicitation = 0;
  let conversation;
  async function connect() {
    await client?.close();
    client = new Client({ name: 'qap-autonomy-smoke', version: '1.0.0' }, { capabilities: { elicitation: { form: {} } } });
    client.setRequestHandler(ElicitRequestSchema, async () => {
      elicitation++;
      return { action: 'cancel' };
    });
    const transport = new StdioClientTransport({ command: process.execPath, args: [server], cwd: repo, env, stderr: 'pipe' });
    transport.stderr?.on('data', chunk => writeFileSync(join(output, 'server.log'), chunk, { flag: 'a' }));
    await client.connect(transport);
    transcript.push({ method: 'initialize', version: client.getServerVersion(), tools: (await client.listTools()).tools.map(tool => tool.name) });
  }
  async function call(name, args = {}) {
    const response = await client.callTool({ name, arguments: { targetPath: workspace,
      ...(conversation ? { conversation_id: conversation } : {}), ...args } }, undefined, { timeout: 240_000 });
    const data = JSON.parse(response.content[0].text);
    transcript.push({ name, args, data, isError: response.isError ?? false });
    writeJson('transcript.json', transcript);
    console.log(name, data.status, data.code ?? '');
    return data;
  }
  const module = 'qa-autonomo';
  const verifyReport = async execution => {
    const report = await call('qap_report', { executionId: execution.execution_id, format: 'all' });
    assert.equal(report.evidence_source, 'persisted_execution', JSON.stringify(report));
    assert.equal(report.attempt_id, execution.attempt_id);
    const reports = Object.values(report.reports);
    assert(reports.length >= 3);
    for (const path of reports) assert(statSync(path).size > 0);
    return report;
  };
  try {
    await connect();
    assert.equal((await call('qap_start', { base_url: 'https://outside-policy.invalid/' })).code, 'autonomy_policy_required');
    assert.equal((await call('qap_start', { base_url: origin, credentials: { username: 'fixture-only', password: 'synthetic' } })).code, 'invalid_arguments');
    const start = await call('qap_start');
    assert.equal(start.autonomy?.status, 'ready_for_design', JSON.stringify(start));
    conversation = start.conversation_id;
    assert.equal(start.onboarding_inventory.inspected_routes, 3);
    assert.equal(start.onboarding_inventory.resumable_routes, 0);
    assert(!requests.some(request => request.path === '/forbidden'));
    const reviewRevision = start.autonomy.discovery_revision_id;
    const panel = start.autonomy.views.find(view => view.path === '/dashboard');
    const selector = panel.controls.find(control => control.tag === 'button').selector;
    const designed = await call('qap_plan', { module, discovery_revision_id: reviewRevision,
      case_workflow: { action: 'generate', proposals: [
        { title: 'Control de detalle visible', route: '/dashboard', selector },
        { title: 'Regla de negocio sin fuente', route: '/dashboard', oracle: 'indeterminate' },
        { title: 'Operación fuera de política', route: '/forbidden', fixture_write: 'not_permitted', selector },
      ] } });
    assert.equal(designed.status, 'materialized', JSON.stringify(designed));
    const caseId = designed.cases.find(item => item.status === 'eligible').case_id;
    assert(designed.cases.some(item => item.status === 'INDETERMINATE'));
    assert(designed.excluded.some(item => item.status === 'SKIPPED_BY_POLICY'));
    const caseFile = join(workspace, '.qa', 'modules', module, 'tests', 'TC-' + caseId + '.yaml');
    const caseHash = sha(caseFile);
    const forged = '12345678-1234-4000-8000-123456789012';
    writeFileSync(join(workspace, '.qa', 'modules', module, 'tests', 'TC-' + forged + '.yaml'),
      readFileSync(caseFile, 'utf8').replace(caseId, forged));
    const planned = await call('qap_plan', { module });
    assert.equal(planned.status, 'success', JSON.stringify(planned));
    assert.deepEqual(planned.cases, [caseId]);
    assert(planned.excluded_cases.some(item => item.case_id === forged));
    const forbidden = await call('qap_discover', { name: 'inventario-provisional', path: origin + '/forbidden' });
    assert.equal(forbidden.code, 'SKIPPED_BY_POLICY');
    assert.equal((await call('qap_test', { module, case_ids: [forged] })).code, 'unknown_case_in_batch');
    const run = async (m, id) => {
      const execution = await call('qap_test', { module: m, case_ids: [id] });
      assert.equal(execution.status, 'success', JSON.stringify(execution));
      assert.equal(execution.result, 'passed');
      assert.equal(execution.cases[0].id, id);
      assert(execution.attempt_id);
      const traceZip = join(workspace, execution.artifacts.trace_zip_path);
      assert.equal(readFileSync(traceZip, 'hex').slice(0, 8), '504b0304');
      assert(execution.artifacts.screenshots.some(path => readFileSync(join(workspace, path), 'hex').startsWith('89504e470d0a1a0a')));
      return execution;
    };
    const first = await run(module, caseId);
    const traceFor = execution => JSON.parse(readFileSync(join(workspace, '.qa', 'executions', execution.execution_id + '.trace.json'), 'utf8'));
    const firstTrace = traceFor(first);
    assert(firstTrace.case_eligibility_digest);
    assert(!firstTrace.case_approval_digest);
    const externalId = 'exec_external_fixture';
    const raw = JSON.parse(readFileSync(join(workspace, '.qa', 'executions', first.execution_id + '.json'), 'utf8'));
    writeJson(join('workspace', '.qa', 'executions', externalId + '.json'), { ...raw, execution_id: externalId });
    assert.equal((await call('qap_report', { executionId: externalId })).code, 'execution_not_canonical');
    await connect();
    const report = await verifyReport(first);
    assert.deepEqual(new Set(report.design_gaps.map(item => item.status)), new Set(['INDETERMINATE', 'SKIPPED_BY_POLICY']));
    const repeated = await run(module, caseId);
    assert.notEqual(first.attempt_id, repeated.attempt_id);
    assert.equal(sha(caseFile), caseHash);
    assert.equal(traceFor(repeated).case_eligibility_digest, firstTrace.case_eligibility_digest);
    await verifyReport(repeated);
    const reopened = await call('qap_start');
    assert.equal(reopened.autonomy?.discovery_revision_id, reviewRevision);
    assert.equal((await verifyReport(first)).publication.generated_formats.length, 0);

    const mutationModule = 'fixture-write';
    const mutation = await call('qap_plan', { module: mutationModule, discovery_revision_id: reviewRevision,
      case_workflow: { action: 'generate', proposals: [{ title: 'Alta sintética con limpieza', route: '/summary', selector: fixtureButton,
        fixture_write: 'save_fixture' }] } });
    assert.equal(mutation.status, 'materialized', JSON.stringify(mutation));
    const writeId = mutation.cases.find(item => item.status === 'eligible').case_id;
    assert.equal((await call('qap_plan', { module: mutationModule })).status, 'success');
    await verifyReport(await run(mutationModule, writeId));
    assert.deepEqual(requests.filter(request => request.method === 'POST').map(request => request.path),
      ['/fixture-write', '/fixture-reset']);
    assert.equal(fixtureRecord, false);
    assert.equal(elicitation, 0);
    assert(!requests.some(request => request.path === '/forbidden'));
    assert(existsSync(join(workspace, '.qa', 'executions', first.execution_id + '.json')));
    if (process.argv.includes('--verify-cli')) {
      await client.close();
      client = undefined;
      const cli = join(repo, 'packages/cli/dist/entrypoint.js');
      const runCli = async args => (await promisify(execFile)(process.execPath, [cli, ...args], { cwd: workspace, env, encoding: 'utf8', windowsHide: true })).stdout;
      const cliPlan = await runCli(['plan', module]);
      const cliTest = await runCli(['test', module, '--case', caseId]);
      const cliReport = await runCli(['report', first.execution_id, '--format', 'json']);
      assert.match(cliPlan, /1 caso\(s\) elegible/);
      assert.match(cliTest, /Total: 1\/1 casos ok/);
      assert.match(cliReport, /\.report\.json/);
      writeJson('cli.json', { plan: cliPlan, test: cliTest, report: cliReport });
    }
    writeJson('result.json', { status: 'passed', elicitation, case_id: caseId, case_sha256: caseHash,
      discovery_revision_id: reviewRevision, attempts: [first.attempt_id, repeated.attempt_id], report: report.reports });
  } finally { await client?.close(); }
}
