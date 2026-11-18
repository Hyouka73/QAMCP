import { execFile, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { afterEach, expect, it } from 'vitest';
import { QapApplicationService, WorkspaceBootstrap } from '../../dist/index.js';
import { workspaceStorageKey } from '../project-reset.js';

const cleanups = [];
afterEach(async () => { for (const cleanup of cleanups.splice(0).reverse()) await cleanup(); });
const exec = promisify(execFile);

// The inspector is local to this test. It stops the compiled server on an existing
// synchronous statement; neither the MCP interface nor production code gains hooks.
async function debuggerFor(port, bundle) {
  const info = await (await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(5000) })).json();
  const ws = new WebSocket(info[0].webSocketDebuggerUrl);
  await new Promise((ok, fail) => { ws.addEventListener('open', ok, { once: true }); ws.addEventListener('error', fail, { once: true }); });
  cleanups.push(() => ws.close());
  let seq = 0; const pending = new Map(); let onPause;
  ws.addEventListener('message', e => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { const [ok, fail] = pending.get(m.id); pending.delete(m.id); m.error ? fail(Error(m.error.message)) : ok(m.result); }
    if (m.method === 'Debugger.paused' && onPause) { const done = onPause; onPause = undefined; done(m.params); }
  });
  const command = (method, params = {}) => new Promise((ok, fail) => { const id = ++seq; pending.set(id, [ok, fail]); ws.send(JSON.stringify({ id, method, params })); });
  await command('Debugger.enable');
  const lines = readFileSync(bundle, 'utf8').split('\n');
  const line = lines.findIndex(s => s.includes('if (!ref || normalizePathKey(ref.canonical_root)'));
  if (line < 0) throw Error('compiled admission statement not found');
  const bp = await command('Debugger.setBreakpointByUrl', { url: pathToFileURL(bundle).href, lineNumber: line });
  expect(bp.locations.length).toBeGreaterThan(0);
  const paused = () => new Promise((ok, fail) => { const t = setTimeout(() => fail(Error('debugger barrier timed out')), 10000); onPause = x => { clearTimeout(t); ok(x); }; });
  return { command, paused, breakpointId: bp.breakpointId };
}

it('serializes compiled import against administrative revocation across processes', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'qap-r2-interleave-'));
  cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
  const host = join(dir, 'host'), app = join(dir, 'app'), a = join(dir, 'a'), b = join(dir, 'b'), source = join(dir, 'external');
  for (const p of [host, a, b, join(source, '.qa')]) mkdirSync(p, { recursive: true });
  writeFileSync(join(source, '.qa', 'context.yaml'), 'project_name: initial\n');
  const service = new QapApplicationService({ hostRootDir: app, projectOperationDirectory: host });
  cleanups.push(() => service.close());
  const pa = service.createProject({ name: 'A', canonicalRoot: a }).project.project_id;
  const pb = service.createProject({ name: 'B', canonicalRoot: b }).project.project_id;
  for (const [id, root] of [[pa, a], [pb, b]]) service.authority.grant({ project_id: id, capability: 'access', scope: { root_path: root }, granted_by: 'host' });
  const env = { ...process.env, QAP_MCP_APP_SERVICE_DIR: app, QAP_MCP_WORKSPACE_HOST_DIR: host, QAP_DISABLE_INTERACTIVE_AUTH: '1', NODE_ENV: 'test' };
  const helper = resolve('../../scripts/qap-authorize-workspace.mjs');
  const admin = (...args) => execFileSync(process.execPath, [helper, ...args], { env, timeout: 12000, windowsHide: true }).toString();
  admin(a); admin(b);
  const bootstrap = new WorkspaceBootstrap(host, service);
  for (const [root, name] of [[a, 'a'], [b, 'b']]) {
    const binding = await bootstrap.prepare(root, `https://${name}.example.invalid`);
    expect((await binding.store.get(binding.applicationId, 'application', binding.applicationId)).revision).toBe(1);
  }
  bootstrap.close();
  const grant = JSON.parse(admin('import-read-grant', source));
  const listener = createServer();
  await new Promise(ok => listener.listen(0, '127.0.0.1', ok));
  const port = listener.address().port;
  await new Promise(ok => listener.close(ok));
  async function client(root, debug = false) {
    const c = new Client({ name: 'r2-concurrency', version: '1' }, {});
    const transport = new StdioClientTransport({ command: process.execPath, args: [resolve('dist/server.js')], stderr: 'pipe',
      env: { ...env, QAP_MCP_WORKSPACE_ROOT: root, ...(debug ? { NODE_OPTIONS: `--inspect=127.0.0.1:${port}` } : {}) } });
    await c.connect(transport); cleanups.push(() => c.close());
    return async (action, args) => {
      const response = await c.callTool({ name: 'qap_project', arguments: { action, ...args } }, undefined, { timeout: 15000 });
      return JSON.parse(response.content[0].text);
    };
  }
  const call = await client(a, true);
  const other = await client(b);
  expect((await other('resume', { project_id: pb })).status).toBe('success');
  const bundle = resolve('dist', readdirSync('dist').find(x => /^chunk-.*\.js$/.test(x)));
  const inspector = await debuggerFor(port, bundle);
  const rows = path => { const db = new DatabaseSync(path, { readOnly: true }); try {
    return Object.fromEntries(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all()
      .map(({ name }) => [name, db.prepare(`SELECT * FROM "${name.replaceAll('"', '""')}"`).all().map(x => JSON.stringify(x)).sort()]));
  } finally { db.close(); } };
  const files = (root, rel = '') => readdirSync(join(root, rel), { withFileTypes: true }).flatMap(e => {
    const p = join(rel, e.name); return e.isDirectory() ? files(root, p) : [[p, createHash('sha256').update(readFileSync(join(root, p))).digest('hex')]];
  }).sort(([x], [y]) => x.localeCompare(y));
  const snapshot = () => ({ application: rows(join(app, 'app-service.sqlite')),
    a: { knowledge: rows(join(host, workspaceStorageKey(a), 'knowledge.sqlite')), files: files(a) },
    b: { knowledge: rows(join(host, workspaceStorageKey(b), 'knowledge.sqlite')), files: files(b) }, source: files(source) });
  const before = snapshot();
  const barrier = inspector.paused();
  const importing = call('import_qa', { project_id: pa, source_root: source });
  await barrier; // G1 captured, destination coordinator held, protected scan has not begun.
  let blocked;
  try { await exec(process.execPath, [helper, 'import-read-revoke', source, grant.grant_id], { env, timeout: 12000, windowsHide: true }); }
  catch (error) { blocked = String(error.stderr); }
  expect(blocked).toContain('project_storage_busy');
  expect(snapshot()).toEqual(before);
  await inspector.command('Debugger.removeBreakpoint', { breakpointId: inspector.breakpointId });
  await inspector.command('Debugger.resume');
  const imported = await importing;
  expect(imported.receipt.status).toBe('imported');
  const afterImport = snapshot();
  expect(afterImport.a).toEqual(before.a); expect(afterImport.b).toEqual(before.b); expect(afterImport.source).toEqual(before.source);
  admin('import-read-revoke', source, grant.grant_id);
  const revoked = snapshot();
  expect(revoked.a).toEqual(afterImport.a); expect(revoked.b).toEqual(afterImport.b); expect(revoked.source).toEqual(afterImport.source);
  for (const table of Object.keys(revoked.application).filter(name => name !== 'host_session_state'))
    expect(revoked.application[table]).toEqual(afterImport.application[table]);
  const changed = revoked.application.host_session_state.filter(row => !afterImport.application.host_session_state.includes(row));
  const removed = afterImport.application.host_session_state.filter(row => !revoked.application.host_session_state.includes(row));
  expect(changed).toHaveLength(1);
  expect(removed).toHaveLength(1);
  expect(JSON.parse(JSON.parse(removed[0]).value)).toMatchObject({ grant_id: grant.grant_id, status: 'active' });
  expect(JSON.parse(JSON.parse(changed[0]).value)).toMatchObject({ grant_id: grant.grant_id, status: 'revoked' });
  expect((await call('verify_import', { import_id: imported.receipt.import_id })).code).toBe('project_not_found');
  expect(snapshot()).toEqual(revoked);
  const g2 = JSON.parse(admin('import-read-grant', source));
  expect(g2.grant_id).not.toBe(grant.grant_id);
  const replaced = snapshot();
  expect((await call('verify_import', { import_id: imported.receipt.import_id })).code).toBe('project_not_found');
  expect(snapshot()).toEqual(replaced);
  writeFileSync(join(source, '.qa', 'context.yaml'), 'project_name: new-identity\n');
  const next = await call('import_qa', { project_id: pa, source_root: source });
  expect(next.receipt.status).toBe('updated');
  expect(next.receipt.import_id).not.toBe(imported.receipt.import_id);
  const beforeVerify = snapshot();
  expect(beforeVerify.a).toEqual(before.a);
  expect(beforeVerify.b).toEqual(before.b);
  const verifyInspector = await debuggerFor(port, bundle);
  const verificationBarrier = verifyInspector.paused();
  const verifying = call('verify_import', { import_id: next.receipt.import_id });
  await verificationBarrier;
  let verifyBlocked;
  try { await exec(process.execPath, [helper, 'import-read-revoke', source, g2.grant_id], { env, timeout: 12000, windowsHide: true }); }
  catch (error) { verifyBlocked = String(error.stderr); }
  expect(verifyBlocked).toContain('project_storage_busy');
  expect(snapshot()).toEqual(beforeVerify);
  await verifyInspector.command('Debugger.removeBreakpoint', { breakpointId: verifyInspector.breakpointId });
  await verifyInspector.command('Debugger.resume');
  expect((await verifying).verification.valid).toBe(true);
  expect(snapshot()).toEqual(beforeVerify);
  admin('import-read-revoke', source, g2.grant_id);
  const afterG2Revocation = snapshot();
  expect((await call('verify_import', { import_id: next.receipt.import_id })).code).toBe('project_not_found');
  expect(snapshot()).toEqual(afterG2Revocation);
  expect((await call('verify_import', { import_id: imported.receipt.import_id })).code).toBe('project_not_found');
  expect(snapshot().b).toEqual(before.b);
  const counts = tables => Object.fromEntries(Object.entries(tables).map(([name, records]) => [name, records.length]));
  console.info('R2 concurrency snapshots', JSON.stringify({ before: { application: counts(before.application), knowledgeA: counts(before.a.knowledge),
    knowledgeB: counts(before.b.knowledge), filesA: before.a.files.length, filesB: before.b.files.length },
    afterImport: { application: counts(afterImport.application) }, revokedGrantRowsChanged: changed.length,
    afterG2Revocation: { application: counts(afterG2Revocation.application), knowledgeA: counts(afterG2Revocation.a.knowledge),
      knowledgeB: counts(afterG2Revocation.b.knowledge), filesA: afterG2Revocation.a.files.length, filesB: afterG2Revocation.b.files.length } }));
}, 90000);
