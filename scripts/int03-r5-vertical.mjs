import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const repo = resolve(process.argv[2]);
const output = resolve(process.argv[3]);
const load = p => import(pathToFileURL(join(repo, p)).href);
const { Client } = await load('packages/mcp/node_modules/@modelcontextprotocol/sdk/dist/esm/client/index.js');
const { StdioClientTransport } = await load('packages/mcp/node_modules/@modelcontextprotocol/sdk/dist/esm/client/stdio.js');
const { SqliteKnowledgeAdapter } = await load('packages/knowledge/dist/index.js');
const { default: YAML } = await load('packages/mcp/node_modules/yaml/dist/index.js');
mkdirSync(output, { recursive: true });
const root = join(output, 'project');
mkdirSync(join(root, '.qa/private'), { recursive: true });
const http = createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('<!doctype html><title>R5 technical fixture</title><main><h1 id="title">Fixture ready</h1><button>Inspect</button></main>');
});
await new Promise(r => http.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${http.address().port}`;
const dbPath = join(root, '.qa/private/knowledge.sqlite');
const store = new SqliteKnowledgeAdapter(dbPath);
const at = new Date().toISOString();
const trace = { source: 'synthetic', recorded_by: 'INT03-R5-fixture', recorded_at: at,
  reason: 'Authorized technical fixture, no Lendus acceptance', review: 'unreviewed', evidence_refs: [] };
await store.commit('app-r5', [
  { kind: 'application', expected_revision: 0, trace, entity: { application_id: 'app-r5', name: 'R5 fixture', base_url: origin, created_at: at } },
  { kind: 'environment', expected_revision: 0, trace, entity: { application_id: 'app-r5', environment_id: 'local', name: 'local', base_url: origin,
    safe_domains: ['127.0.0.1'], is_production: false, destructive_actions_allowed: false } },
  { kind: 'module', expected_revision: 0, trace, entity: { id: 'mod-r5', application_id: 'app-r5', key: 'smoke', title: 'Smoke', certainty: 'confirmed',
    criticality: 'medium', dependencies: [], created_at: at, updated_at: at, is_active: true } },
]);
store.close();
const manifestPath = join(output, 'host.json');
writeFileSync(manifestPath, JSON.stringify({ version: 1, projectRoot: root, applicationId: 'app-r5', environmentId: 'local', knowledgeDbPath: dbPath,
  moduleBindings: [{ plannedName: 'smoke', moduleId: 'mod-r5', moduleKey: 'smoke', moduleRevision: 1, applicationRevision: 1, environmentRevision: 1, provenance: 'host_declared' }],
  discoveryAuthorization: { environmentRevision: 1, read_only_acknowledged: true, navigation_urls: [origin + '/smoke'], allowed_ips: ['127.0.0.1'] },
  testAuthorization: { allowedOrigins: [origin] } }));
const transcript = [];
let client, transport;
async function connect() {
  transport = new StdioClientTransport({ command: process.execPath, args: [join(repo, 'packages/mcp/dist/server.js')], cwd: repo,
    env: { ...process.env, QAP_MCP_HOST_CONFIG_PATH: manifestPath }, stderr: 'pipe' });
  transport.stderr?.on('data', b => writeFileSync(join(output, 'server-stderr.log'), b, { flag: 'a' }));
  client = new Client({ name: 'INT03-R5-vertical', version: '1.0.0' });
  await client.connect(transport);
}
async function call(name, args = {}, allowBlocked = false) {
  const response = await client.callTool({ name, arguments: { targetPath: root, ...args } });
  const data = JSON.parse(response.content[0].text);
  transcript.push({ name, data, isError: response.isError });
  writeFileSync(join(output, 'transcript.json'), JSON.stringify(transcript, null, 2));
  if (!allowBlocked) assert.notEqual(data.status, 'blocked', JSON.stringify(data));
  if (!allowBlocked) assert.notEqual(response.isError, true, JSON.stringify(data));
  return data;
}
try {
  await connect();
  const catalog = await client.listTools();
  writeFileSync(join(output, 'catalog.json'), JSON.stringify(catalog, null, 2));
  assert(catalog.tools.some(t => t.name === 'qap_test'));
  await call('qap_init', { projectName: 'R5 technical fixture' });
  await call('qap_context_set', { objective: 'Verify authorized technical fixture execution and reports', objective_source: 'user', source: 'user',
    roles: [{ name: 'tester', source: 'user' }], critical_flows: [{ name: 'Smoke', path: '/smoke', source: 'user' }],
    source_of_truth: { type: 'notes', ref: 'fixture.md', declared: true, source: 'user' }, base_url: origin });
  await call('qap_context_set', { confirmar_resumen: 'confirmo_todo' });
  await call('qap_session_plan', { modules: [{ module: 'smoke', path: '/smoke', priority: 'high' }], auth: { required: false, source: 'user' } });
  const discovery = await call('qap_discover', { name: 'smoke', path: '/smoke' });
  assert.equal(discovery.acquisition_persistence, 'committed');
  const authenticatedDiscovery = await call('qap_discover', { name: 'smoke', path: '/smoke', profile: 'technical-profile' }, true);
  assert.equal(authenticatedDiscovery.code, 'authentication_not_supported');
  // Approved executable cases are technical fixtures; there is no MCP case-generation tool.
  const mod = join(root, '.qa/modules/smoke');
  mkdirSync(join(mod, 'tests'), { recursive: true });
  writeFileSync(join(mod, 'context.yaml'), YAML.stringify({ _version: '1', name: 'smoke', routes: ['/smoke'] }));
  for (const [id, expected] of [['TC-PASS', 'Fixture ready'], ['TC-FAIL', 'Deliberately wrong']]) {
    writeFileSync(join(mod, `tests/${id}.yaml`), YAML.stringify({ _version: '1', id, name: id, depends_on: [], steps: [
      { type: 'navigate', url: origin + '/smoke' }, { type: 'assert', selector: '#title', assertion_type: 'equals', expected, timeout: 1000 } ] }));
  }
  const plan = await call('qap_plan', { module: 'smoke', environment: 'local' });
  assert.equal(plan.total_cases, 2);
  const execution = await call('qap_test', { module: 'smoke', environment: 'local' });
  assert.equal(execution.summary.passed, 1);
  assert.equal(execution.summary.failed, 1);
  assert.equal(execution.summary.not_run, 0);
  const id = execution.execution_id;
  const evidence = JSON.parse(readFileSync(join(root, `.qa/executions/${id}.json`), 'utf8'));
  assert.equal(evidence.cases.length, 2);
  assert(evidence.cases.some(c => c.steps?.some(s => s.screenshot && existsSync(resolve(root, s.screenshot)))));
  const report = await call('qap_report', { executionId: id, format: 'all' });
  for (const path of Object.values(report.reports)) assert(existsSync(path));
  await client.close();
  await connect();
  const recovered = await call('qap_report', { executionId: id, format: 'all' });
  assert.equal(recovered.evidence_source, 'persisted_execution');
  await call('qap_status');
  const close = await call('qap_session_close', {}, true);
  assert.equal(close.status, 'blocked');
  writeFileSync(join(output, 'result.json'), JSON.stringify({ status: 'PASS', tools: catalog.tools.length, execution_id: id,
    summary: execution.summary, recovery: recovered.evidence_source, session_close: close.code ?? close.razon }, null, 2));
  console.log('PASS MCP Stdio -> discovery -> plan -> real Playwright -> persisted evidence -> 4 reports -> restart/recovery');
} finally {
  await client?.close();
  await new Promise(r => http.close(r));
}
