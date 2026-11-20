import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ElicitRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { QapApplicationService } from '../packages/mcp/dist/index.js';

const unattended = process.argv.includes('--without-approval');
const repo = fileURLToPath(new URL('../', import.meta.url));
const output = realpathSync(mkdtempSync(join(tmpdir(), 'qap-knowledge-smoke-')));
const workspace = join(output, 'workspace');
const host = join(output, 'host');
const appServiceDir = join(host, 'application');
const workspaceHostDir = join(host, 'workspaces');
const env = { ...process.env, NODE_ENV: 'test', QAP_MCP_WORKSPACE_ROOT: workspace,
  QAP_MCP_HOST_DATA_DIR: host, QAP_MCP_APP_SERVICE_DIR: appServiceDir, QAP_MCP_WORKSPACE_HOST_DIR: workspaceHostDir };
delete env.QAP_MCP_HOST_CONFIG_PATH;
mkdirSync(workspace);
execFileSync(process.execPath, [join(repo, 'scripts/qap-authorize-workspace.mjs'), workspace], { env, windowsHide: true });

const requests = [];
const http = createServer((req, res) => {
  requests.push({ method: req.method, path: req.url, userAgent: req.headers['user-agent'] });
  if (req.method !== 'GET') return res.writeHead(405).end();
  const pages = {
    '/': '<main><nav><a href="/workspace">Inicio</a></nav></main>',
    '/workspace': '<main><h1>Panel del fixture</h1><button type="button" onclick="fetch(&quot;/write&quot;,{method:&quot;POST&quot;})">Ver detalle</button></main>',
  };
  const body = Object.hasOwn(pages, req.url) ? pages[req.url] : undefined;
  res.writeHead(body ? 200 : 404, { 'content-type': 'text/html; charset=utf-8' }).end(body);
});
await new Promise(resolve => http.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${http.address().port}`;
console.log('Evidencia del fixture:', output);

let client;
let terminal;
const results = [];
const writeJson = (name, value) => writeFileSync(join(output, name), JSON.stringify(value, null, 2));
const readJson = path => JSON.parse(readFileSync(path, 'utf8'));
const sha = path => createHash('sha256').update(readFileSync(path)).digest('hex');

async function connect(humanReview = false) {
  await client?.close();
  client = new Client({ name: 'qap-knowledge-smoke', version: '1.0.0' },
    humanReview ? { capabilities: { elicitation: { form: {} } } } : {});
  if (humanReview) {
    client.setRequestHandler(ElicitRequestSchema, async ({ params }) => {
      assert(params.requestedSchema.properties.decision);
      console.log('\n' + params.message);
      const decision = (await terminal.question('Decisión humana MCP (confirm / reject / defer): ')).trim();
      return ['confirm', 'reject', 'defer'].includes(decision)
        ? { action: 'accept', content: { decision } } : { action: 'cancel' };
    });
  }
  const transport = new StdioClientTransport({ command: process.execPath,
    args: [join(repo, 'packages/mcp/dist/server.js')], cwd: repo, env, stderr: 'pipe' });
  transport.stderr?.on('data', chunk => writeFileSync(join(output, 'server.log'), chunk, { flag: 'a' }));
  await client.connect(transport);
}

async function call(name, args = {}) {
  const response = await client.callTool({ name, arguments: { targetPath: workspace, ...args } }, undefined, { timeout: 240_000 });
  const data = JSON.parse(response.content[0].text);
  results.push({ name, args, data, isError: response.isError ?? false });
  writeJson('transcript.json', results);
  console.log(name, data.status, data.code ?? '');
  return data;
}

async function verifyExecution(execution, caseId, headed) {
  assert.equal(execution.status, 'success', JSON.stringify(execution));
  assert.equal(execution.result, 'passed');
  assert.equal(execution.browser_mode, headed ? 'headed' : 'headless');
  assert.equal(execution.summary.passed, 1);
  assert.equal(execution.cases[0].id, caseId);
  assert(execution.attempt_id);
  const raw = join(workspace, '.qa', 'executions', execution.execution_id + '.json');
  const trace = join(workspace, '.qa', 'executions', execution.execution_id + '.trace.json');
  assert.equal(readJson(raw).result, 'passed');
  const traceBody = readJson(trace);
  assert.equal(traceBody.attempt_id, execution.attempt_id);
  assert.equal(traceBody.browser_mode, execution.browser_mode);
  assert(traceBody.case_approval_digest);
  const chromiumTrace = join(workspace, execution.artifacts.trace_zip_path);
  const screenshots = [...new Set([...(execution.artifacts.screenshots ?? []), ...(execution.cases[0].screenshots ?? [])])];
  assert(screenshots.length > 0);
  assert.equal(readFileSync(chromiumTrace, 'hex').slice(0, 8), '504b0304');
  for (const screenshot of screenshots) {
    assert.equal(readFileSync(join(workspace, screenshot), 'hex').slice(0, 16), '89504e470d0a1a0a');
  }
  const report = await call('qap_report', { executionId: execution.execution_id, format: 'all' });
  assert.equal(report.evidence_source, 'persisted_execution');
  assert.equal(report.attempt_id, execution.attempt_id);
  assert.equal(report.result, 'passed');
  const reports = Object.values(report.reports);
  assert(reports.length >= 3);
  for (const path of reports) assert(statSync(path).size > 0);
  return { execution_id: execution.execution_id, attempt_id: execution.attempt_id, mode: execution.browser_mode,
    case_approval_digest: traceBody.case_approval_digest, raw, trace, chromium_trace: chromiumTrace,
    screenshots: screenshots.map(path => join(workspace, path)), reports };
}

try {
  await connect();
  const start = await call('qap_start', { base_url: origin });
  assert.equal(start.onboarding_inventory.state, 'READY');
  const context = await call('qap_context_set', { source: 'user', objective: 'Consultar el panel sintético', roles: [{ name: 'lector' }],
    critical_flows: [{ name: 'Abrir panel', path: '/workspace' }], source_of_truth: { type: 'none', declared: true } });
  assert.equal(context.fase, 'SCOPING');
  const module = 'workspace';
  const scope = { module, environment: 'local' };
  const session = await call('qap_session_plan', { plan: [{ module, path: '/workspace', priority: 'high' }] });
  assert.equal(session.status, 'success');
  const wrongScope = await call('qap_plan', { module: 'other', discovery_revision_id: start.onboarding_inventory.revision_id,
    case_workflow: { action: 'propose_from_observations' } });
  assert.equal(wrongScope.status, 'blocked');
  const proposal = await call('qap_plan', { ...scope, case_workflow: { action: 'propose_from_observations' } });
  assert.equal(proposal.discovery_revision_id, start.onboarding_inventory.revision_id);
  assert.equal(proposal.summary.pending_oracle, 1);
  assert.equal(proposal.suggested_oracle.status, 'inferred');
  const candidate = proposal.pending_oracle_cases[0];
  assert.equal(candidate.expectation.expected_outcome, null);
  assert(candidate.observation.evidence_refs.length > 0);
  assert(!candidate.steps.some(step => step.type === 'assert'));
  const caseId = candidate.case_id;
  const caseFile = join(workspace, '.qa', 'modules', module, 'tests', 'TC-' + caseId + '.yaml');
  const { expected_outcome, assert_selector, assert_type } = proposal.suggested_oracle;
  const oracle = { case_id: caseId, expected_outcome, assert_selector, assert_type };
  const reviewScope = { ...scope, discovery_revision_id: proposal.discovery_revision_id };
  const oracleCommand = { ...reviewScope, case_workflow: { action: 'decide_oracles', decisions: [oracle] } };
  const approveCommand = { ...reviewScope, case_workflow: { action: 'approve_batch', case_ids: [caseId] } };
  const executionArgs = { ...scope, case_ids: [caseId] };
  const deniedOracle = await call('qap_plan', oracleCommand);
  assert.match(deniedOracle.code, /^human_review_(gateway_required|not_authorized|unavailable)$/);
  assert.equal((await call('qap_plan', approveCommand)).status, 'blocked');
  assert.equal((await call('qap_test', executionArgs)).code, 'executable_oracle_required');
  assert.equal(existsSync(caseFile), false);
  assert(requests.every(request => request.method === 'GET' && request.path !== '/write'));
  if (unattended) {
    writeJson('result.json', { status: 'awaiting_human_review', case_id: caseId,
      discovery_revision_id: proposal.discovery_revision_id, execution_count: 0 });
  } else {
    terminal = createInterface({ input: process.stdin, output: process.stdout });
    await connect(true);
    const confirmed = await call('qap_plan', oracleCommand);
    if (confirmed.status !== 'updated') {
      writeJson('result.json', { status: 'awaiting_human_review', case_id: caseId, blocked_by: confirmed.code, execution_count: 0 });
      throw new Error('La revisión del oráculo terminó con ' + confirmed.code);
    }
    assert.equal(confirmed.human_confirmations.length, 1);
    const approved = await call('qap_plan', approveCommand);
    if (approved.status !== 'approved') {
      writeJson('result.json', { status: 'awaiting_case_approval', case_id: caseId, blocked_by: approved.code, execution_count: 0 });
      throw new Error('La revisión del caso terminó con ' + approved.code);
    }
    assert.equal(approved.evidence.mechanism, 'client_elicitation');
    assert.equal(approved.cases[0].case_id, caseId);
    assert(existsSync(caseFile));
    const caseHash = sha(caseFile);
    assert.equal((await call('qap_plan', scope)).status, 'success');
    assert.equal((await call('qap_test', executionArgs)).code, 'execution_authorization_required');
    console.log(`Autorizar dos ejecuciones de lectura de ${caseId} contra ${origin}/workspace, una en cada modo.`);
    assert.equal((await terminal.question('Escribe autorizar para conceder ejecución en este fixture: ')).trim(), 'autorizar');
    const service = new QapApplicationService({ hostRootDir: appServiceDir, projectOperationDirectory: workspaceHostDir });
    try {
      const project = service.findActiveProjectByRoot(workspace);
      assert.equal(service.listExecutionAttempts(project.project_id).length, 0);
      service.authority.grant({ project_id: project.project_id, capability: 'execute',
        scope: { root_path: workspace, origin, env_id: project.active_env_id }, granted_by: 'host_operator' });
    } finally { service.close(); }
    await connect();
    const afterPlan = results.length;
    const runs = [];
    for (const headed of [false, true]) {
      const requestStart = requests.length;
      const execution = await call('qap_test', { ...executionArgs, headed });
      const traffic = requests.slice(requestStart).find(request => request.path === '/workspace');
      assert(traffic);
      assert.equal(traffic.userAgent.includes('HeadlessChrome'), !headed);
      runs.push(await verifyExecution(execution, caseId, headed));
    }
    assert.notEqual(runs[0].attempt_id, runs[1].attempt_id);
    assert.notEqual(runs[0].execution_id, runs[1].execution_id);
    assert.equal(runs[0].case_approval_digest, runs[1].case_approval_digest);
    assert.equal(sha(caseFile), caseHash);
    assert.deepEqual(results.slice(afterPlan).map(item => item.name), ['qap_test', 'qap_report', 'qap_test', 'qap_report']);
    assert(requests.every(request => request.method === 'GET' && request.path !== '/write'));
    writeJson('result.json', { status: 'passed', case_id: caseId, case_version: approved.cases[0].version,
      case_sha256: caseHash, discovery_revision_id: proposal.discovery_revision_id, runs });
  }
} finally {
  terminal?.close();
  await client?.close();
  await new Promise(resolve => http.close(resolve));
  writeJson('requests.json', requests);
}
