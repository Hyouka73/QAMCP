import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const repo = resolve(process.argv[2]);
const output = resolve(process.argv[3]);
const outputDirectory = output;
const load = p => import(pathToFileURL(join(repo, p)).href);
const { Client } = await load('packages/mcp/node_modules/@modelcontextprotocol/sdk/dist/esm/client/index.js');
const { StdioClientTransport } = await load('packages/mcp/node_modules/@modelcontextprotocol/sdk/dist/esm/client/stdio.js');
const { SqliteInterviewDraftStore, SqliteModuleClosureStore } = await load('packages/mcp/dist/index.js');
const { chromium } = await load('packages/mcp/node_modules/playwright-core/index.mjs');
const { default: YAML } = await load('packages/mcp/node_modules/yaml/dist/index.js');
const { SqliteKnowledgeAdapter } = await load('packages/knowledge/dist/index.js');
const { SessionStore } = await load('packages/auth/dist/index.js');

mkdirSync(output, { recursive: true });
const root = join(output, 'project');
mkdirSync(join(root, '.qa/private'), { recursive: true });
if (existsSync(join(output, 'transcript.json'))) throw new Error('Output must be fresh');
let protectedReads = 0, revoked = false;
const token = randomBytes(24).toString('hex');
const http = createServer((req, res) => {
  if (req.url === '/login' && req.method === 'POST') { res.writeHead(200, { 'Set-Cookie': 'fixture_session=' + token + '; HttpOnly; Path=/; SameSite=Strict' }); res.end('Signed in'); return; }
  if (revoked || req.url !== '/smoke' || !req.headers.cookie?.includes('fixture_session=' + token)) { res.writeHead(401, { 'Content-Type': 'text/html' }); res.end('<form><input type="password"></form>'); return; }
  protectedReads++; res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('<!doctype html><title>MVP02 protected fixture</title><main id="authenticated"><h1 id="title">Fixture ready</h1><button>Inspect</button></main>');
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
const reviewDir = join(output, 'host-reviews'); mkdirSync(reviewDir);
const scope = { projectRoot: root, applicationId: 'app-r5', environmentId: 'local' };
const keys = { QAP_MCP_REVIEW_KEY_HEX: randomBytes(32).toString('hex'), QAP_MCP_INTERVIEW_KEY_HEX: randomBytes(32).toString('hex'), QAP_MCP_CLOSURE_KEY_HEX: randomBytes(32).toString('hex'), QAP_SESSION_KEY: randomBytes(32).toString('hex') };
const protection = 'host_private_directory_and_managed_key';
const draftPath = join(output, 'drafts.sqlite'), closurePath = join(output, 'closures.sqlite');
new SqliteInterviewDraftStore({ ...scope, path: draftPath, key: Buffer.from(keys.QAP_MCP_INTERVIEW_KEY_HEX, 'hex'), initialize: true, protection }).close();
new SqliteModuleClosureStore({ ...scope, path: closurePath, key: Buffer.from(keys.QAP_MCP_CLOSURE_KEY_HEX, 'hex'), initialize: true, protection }).close();
// Explicit controlled operator fixture. Not a human decision or Lendus acceptance.
async function technicalDecision(data, decision) {
  assert(data.review_request_digest, JSON.stringify(data));
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [join(repo,'scripts/qap-host-review.mjs'),reviewDir,data.review_request_digest], { cwd: repo, env: { ...process.env, ...keys }, stdio: ['pipe','pipe','pipe'], windowsHide: true });
    let output = '', stage = 0;
    child.stdout.on('data', chunk => {
      output += chunk.toString();
      if (stage === 0 && output.includes('Identidad del revisor:')) { stage++; child.stdin.write('controlled-technical-operator-NOT-human-acceptance\n'); }
      else if (stage === 1 && output.includes('Decisión explícita')) { stage++; child.stdin.write(decision + '\n'); }
      else if (stage === 2 && output.includes('requestDigest completo presentado:')) { stage++; child.stdin.write(data.review_request_digest + '\n'); }
    });
    child.stderr.on('data', chunk => { output += chunk.toString(); });
    child.on('error', reject); child.on('exit', code => { writeFileSync(join(outputDirectory,'host-review-cli.log'), output, {flag:'a'}); code === 0 ? resolve() : reject(new Error('Host review CLI failed: ' + output)); });
  });
}
const manifestPath = join(output, 'host.json');
writeFileSync(manifestPath, JSON.stringify({ version: 1, projectRoot: root, applicationId: 'app-r5', environmentId: 'local', knowledgeDbPath: dbPath,
  moduleBindings: [{ plannedName: 'smoke', moduleId: 'mod-r5', moduleKey: 'smoke', moduleRevision: 1, applicationRevision: 1, environmentRevision: 1, provenance: 'host_declared' }],
  discoveryAuthorization: { environmentRevision: 1, read_only_acknowledged: true, navigation_urls: [origin + '/smoke'], authorizedProfiles: ['technical-profile'], allowed_ips: ['127.0.0.1'] },
  humanReview: { directory: reviewDir, keyEnv: 'QAP_MCP_REVIEW_KEY_HEX', protection },
  interviewDraft: { dbPath: draftPath, keyEnv: 'QAP_MCP_INTERVIEW_KEY_HEX', protection },
  moduleClosure: { dbPath: closurePath, keyEnv: 'QAP_MCP_CLOSURE_KEY_HEX', protection },
  testAuthorization: { allowedOrigins: [origin], authorizedProfiles: ['technical-profile'] } }));
const transcript = [];
let client, transport;
async function connect() {
  transport = new StdioClientTransport({ command: process.execPath, args: [join(repo, 'packages/mcp/dist/server.js')], cwd: repo,
    env: { ...process.env, ...keys, QAP_MCP_HOST_CONFIG_PATH: manifestPath }, stderr: 'pipe' });
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
  await call('qap_session_plan', { modules: [{ module: 'smoke', path: '/smoke', priority: 'high' }], auth: { required: true, source: 'user', roles: ['tester'], profile: 'technical-profile' } }, true);
  // Obtain actual server-issued session cookies through a real Playwright context.
  let browser;
  for (const channel of ['chrome', 'msedge', undefined]) { try { browser = await chromium.launch({ headless: true, ...(channel ? { channel } : {}) }); break; } catch { /* Try the next supported local Chromium installation. */ } }
  assert(browser);
  let storageState;
  try {
    const ctx = await browser.newContext();
    const login = await ctx.request.post(origin + '/login');
    assert.equal(login.status(), 200);
    const page = await ctx.newPage();
    assert((await page.goto(origin + '/smoke')).ok());
    assert(await page.locator('#authenticated').isVisible());
    storageState = await ctx.storageState();
  } finally { await browser.close(); }
  // Seed the explicit host's test fixture locally. MCP calls cannot submit session material.
  const sessionKey = process.env.QAP_SESSION_KEY;
  try {
    process.env.QAP_SESSION_KEY = keys.QAP_SESSION_KEY;
    new SessionStore(undefined, root).saveSession('technical-profile', storageState);
  } finally {
    if (sessionKey === undefined) delete process.env.QAP_SESSION_KEY;
    else process.env.QAP_SESSION_KEY = sessionKey;
  }
  const authDirectory = join(root, '.qa/project/auth');
  mkdirSync(authDirectory, { recursive: true });
  writeFileSync(join(authDirectory, 'profiles.json'), JSON.stringify({ profiles: [{
    id: 'technical-profile', env: 'local', application_id: 'app-r5', role: 'tester', username: 'fixture',
    credential_source: 'ephemeral', login_mode: 'handoff', verified: true,
    post_login_condition: { type: 'selector_present', value: '#authenticated' },
  }] }));
  await call('qap_session_plan', { modules: [{ module: 'smoke', path: '/smoke', priority: 'high' }] });
  const forbidden = await call('qap_discover', { name: 'smoke', path: '/smoke', profile: 'unauthorized' }, true);
  assert.equal(forbidden.code, 'unauthorized_profile');
  const discovery = await call('qap_discover', { name: 'smoke', path: '/smoke', profile: 'technical-profile' });
  assert.equal(discovery.mode, 'fresh_authenticated_static');
  assert.equal(discovery.acquisition_persistence, 'committed');
  assert.equal(discovery.association_status, 'confirmed');
  const question = (await call('qap_rules_set', { module: 'smoke', canonical_interview: { action: 'next' } })).question;
  const proposed = await call('qap_rules_set', { module: 'smoke', canonical_interview: { action: 'propose', question_id: question.id, version: question.version, expected_revision: 0,
    proposal: { title: 'El módulo muestra su estado al usuario autenticado', description: 'Un usuario de pruebas autenticado debe visualizar el estado Fixture ready dentro del módulo smoke.', category: 'functional', acceptance_criteria: ['El encabezado #title muestra exactamente Fixture ready.'] } } });
  const reviewCommand = { module: 'smoke', canonical_interview: { action: 'review', question_id: question.id, version: proposed.question.version } };
  const pending = await call('qap_rules_set', reviewCommand, true);
  assert.equal(pending.code, 'human_review_not_authorized'); await technicalDecision(pending, 'confirm');
  const confirmed = await call('qap_rules_set', reviewCommand);
  assert.equal(confirmed.status, 'confirmed');
  const noOracle = await call('qap_plan', { module: 'smoke', case_workflow: { action: 'generate' } });
  assert.equal(noOracle.blocked_cases.length, 1);
  const proposals = [
    { requirement_id: confirmed.requirement_id, expected_revision: confirmed.revision, name: 'Estado autenticado correcto', steps: [
      { type: 'navigate', url: origin + '/smoke' }, { type: 'assert', selector: '#title', assertion_type: 'equals', expected: 'Fixture ready', timeout: 1000 }, { type: 'screenshot' } ] },
    { requirement_id: confirmed.requirement_id, expected_revision: confirmed.revision, name: 'Control negativo deliberado', steps: [
      { type: 'navigate', url: origin + '/smoke' }, { type: 'assert', selector: '#title', assertion_type: 'equals', expected: 'Deliberately wrong', timeout: 1000 } ] },
  ];
  const generated = await call('qap_plan', { module: 'smoke', case_workflow: { action: 'generate', proposals } });
  assert.equal(generated.cases.length, 2);
  const idempotent = await call('qap_plan', { module: 'smoke', case_workflow: { action: 'generate', proposals } });
  assert.deepEqual(idempotent.cases.map(c => c.id), generated.cases.map(c => c.id));
  const plan = await call('qap_plan', { module: 'smoke', environment: 'local' });
  assert.equal(plan.total_cases, 2);
  const unapproved = await call('qap_test', { module: 'smoke', environment: 'local', profile: 'technical-profile' }, true);
  assert.equal(unapproved.code, 'case_approval_required');
  const approvalPending = await call('qap_plan', { module: 'smoke', case_workflow: { action: 'review' } }, true);
  assert.equal(approvalPending.code, 'case_review_pending'); await technicalDecision(approvalPending, 'approve');
  const approved = await call('qap_plan', { module: 'smoke', case_workflow: { action: 'review' } }); assert.equal(approved.status, 'approved');
  const firstPath = join(root, '.qa/modules/smoke/tests/TC-' + generated.cases[0].id + '.yaml');
  const originalCase = readFileSync(firstPath, 'utf8'); const editedCase = YAML.parse(originalCase); editedCase.name += ' - edited';
  writeFileSync(firstPath, YAML.stringify(editedCase));
  const protectedEdit = await call('qap_plan', { module: 'smoke', case_workflow: { action: 'generate', proposals } }, true); assert.equal(protectedEdit.code, 'case_edit_preserved');
  await call('qap_plan', { module: 'smoke' });
  const editBlocked = await call('qap_test', { module: 'smoke', profile: 'technical-profile' }, true); assert.equal(editBlocked.code, 'case_approval_required');
  writeFileSync(firstPath, originalCase); await call('qap_plan', { module: 'smoke' });
  await client.close(); await connect();
  const execution = await call('qap_test', { module: 'smoke', environment: 'local', profile: 'technical-profile' });
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
  revoked = true;
  const expired = await call('qap_discover', { name: 'smoke', path: '/smoke', profile: 'technical-profile' }, true);
  assert.equal(expired.code, 'auth_session_invalid'); assert.equal(expired.desbloquear_con.tool, 'qap_auth_add');
  revoked = false;
  const closingBlocked = await call('qap_session_close', {}, true); assert.equal(closingBlocked.status, 'blocked');
  const closeArgs = canonical_closure => ({ module: 'smoke', action: 'close', user_confirmed: true, canonical_closure });
  const evaluate = await call('qap_module_close', closeArgs({ action: 'evaluate' }));
  assert.notEqual(evaluate.assessment.closure_verdict, 'ready_for_closure');
  const nonApplicable = closeArgs({ action: 'declare_non_applicable', decisions: ['business_rule','security','ui','ux','regression','performance'].map(category => ({ category, reason: 'Fuera del alcance explícito del fixture técnico de transporte, no es aceptación de producto.' })) });
  const naPending = await call('qap_module_close', nonApplicable, true); await technicalDecision(naPending, 'approve');
  await call('qap_module_close', nonApplicable);
  const closeCommand = closeArgs({ action: 'close' });
  const closePending = await call('qap_module_close', closeCommand, true); assert.equal(closePending.code, 'closure_review_pending'); await technicalDecision(closePending, 'approve');
  const closed = await call('qap_module_close', closeCommand); assert.equal(closed.status, 'closed');
  const session = await call('qap_session_close');
  await client.close(); await connect();
  const finalReport = await call('qap_report', { executionId: id, format: 'all' }); assert.equal(finalReport.evidence_source, 'persisted_execution');
  const finalStatus = await call('qap_status');
  const trace = JSON.parse(readFileSync(join(root, '.qa/executions/' + id + '.trace.json'), 'utf8')); assert.equal(trace.cases.length, 2);
  assert(protectedReads >= 3);
  writeFileSync(join(output, 'result.json'), JSON.stringify({ status: 'PASS_TECHNICAL', human_acceptance: 'NOT_PERFORMED', tools: catalog.tools.length, execution_id: id,
    summary: execution.summary, recovery: finalReport.evidence_source, module_close: closed.status, session_close: session.status, phase: finalStatus.fase, protected_reads: protectedReads,
    case_approval_digest: trace.case_approval_digest }, null, 2));
  console.log('PASS MCP Stdio -> discovery -> plan -> real Playwright -> persisted evidence -> 4 reports -> restart/recovery');
} finally {
  await client?.close();
  await new Promise(r => http.close(r));
}
