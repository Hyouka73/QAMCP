import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ListRootsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temp = mkdtempSync(join(tmpdir(), 'qap-onboarding-protocol-'));
const workspace = join(temp, 'empty-project'), host = join(temp, 'host');
mkdirSync(workspace); mkdirSync(host);
const open = async roots => {
  const client = new Client({ name: 'QAP-synthetic-stdio-regression', version: '1' }, { capabilities: roots ? { roots: { listChanged: true } } : {} });
  if (roots) client.setRequestHandler(ListRootsRequestSchema, () => ({ roots: [{ uri: pathToFileURL(workspace).href }] }));
  const transport = new StdioClientTransport({ command: process.execPath, args: [join(repo, 'packages/mcp/dist/server.js')], cwd: repo,
    env: { ...process.env, QAP_MCP_HOST_CONFIG_PATH: undefined, QAP_MCP_WORKSPACE_HOST_DIR: host }, stderr: 'pipe' });
  transport.stderr?.on('data', () => {});
  await client.connect(transport);
  return client;
};
const call = async (client, name, args = {}) => {
  const response = await client.callTool({ name, arguments: { targetPath: workspace, ...args } });
  assert(!response.isError, JSON.stringify(response));
  return JSON.parse(response.content[0].text);
};
const evidence = { test_type: 'synthetic_protocol_not_Codex_acceptance', actual_Codex_client: false, results: [] };
function removeTechnicalTemporaryDirectory() {
  const absolute = realpathSync(temp), parent = realpathSync(tmpdir());
  if (!absolute.startsWith(parent + sep) || !absolute.slice(parent.length + 1).startsWith('qap-onboarding-protocol-')) throw new Error('Unsafe cleanup target');
  rmSync(absolute, { recursive: true, force: true });
}
let client;
try {
  client = await open(false);
  const denied = await call(client, 'qap_status');
  assert.equal(denied.code, 'workspace_authorization_required');
  assert(!existsSync(join(workspace, '.qa')));
  evidence.results.push('No roots: targetPath cannot authorize writes');
  await client.close();
  client = await open(true);
  const first = await call(client, 'qap_status');
  assert.equal(first.initialized, true);
  assert.equal(first.knowledge.state, 'prepared');
  assert.equal(first.siguiente_accion.pregunta.id, 'onboarding.system_location');
  const original = readFileSync(join(workspace, '.qa/project/context.yaml'), 'utf8');
  await call(client, 'qap_status');
  assert.equal(readFileSync(join(workspace, '.qa/project/context.yaml'), 'utf8'), original);
  const registered = await call(client, 'qap_context_set', { base_url: 'https://example.invalid', source: 'user' });
  assert.equal(registered.status, 'success');
  assert.equal((await call(client, 'qap_status')).knowledge.state, 'available');
  evidence.results.push('Client roots: empty workspace prepared, one question, idempotent initialization, URL registered');
  await client.close();
  // Exercise the concrete local operator fallback, separate from all MCP args.
  execFileSync(process.execPath, [join(repo, 'scripts/qap-authorize-workspace.mjs'), workspace], { env: { ...process.env, QAP_MCP_WORKSPACE_HOST_DIR: host }, windowsHide: true });
  client = await open(false);
  const recovered = await call(client, 'qap_status');
  assert.equal(recovered.knowledge.state, 'available');
  assert.notEqual(recovered.siguiente_accion.pregunta?.id, 'onboarding.system_location');
  assert.equal(recovered.stats.modules, 0);
  evidence.results.push('Local authorization + reconnection: Knowledge recovered, no repeated URL, no modules fabricated');
  evidence.status = 'PASS_PROTOCOL';
  if (process.argv[2]) writeFileSync(resolve(process.argv[2]), JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence, null, 2));
} finally {
  await client?.close();
  removeTechnicalTemporaryDirectory();
}
