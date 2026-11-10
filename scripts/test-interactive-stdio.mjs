import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { atomicRecordAuthorizedRoot } from '../packages/mcp/dist/index.js';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temp = mkdtempSync(join(tmpdir(), 'qap-interactive-stdio-'));
const hostDir = join(temp, 'host');
const wsA = join(temp, 'workspace-a');
const wsB = join(temp, 'workspace-b');
const wsC = join(temp, 'workspace-c');

mkdirSync(hostDir);
mkdirSync(wsA);
mkdirSync(wsB);
mkdirSync(wsC);

const registryPath = join(hostDir, 'authorized-roots.json');

const openClient = async () => {
  const client = new Client({ name: 'interactive-stdio-tester', version: '1.0.0' }, {});
  // Use QAP_DISABLE_INTERACTIVE_AUTH=1 for Stdio child so we test the programmatic approval/disk sync
  // and explicit authorizer paths cleanly over real Stdio transport.
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [join(repo, 'packages/mcp/dist/server.js')],
    cwd: repo,
    env: {
      ...process.env,
      QAP_MCP_HOST_CONFIG_PATH: undefined,
      QAP_MCP_WORKSPACE_HOST_DIR: hostDir,
      QAP_DISABLE_INTERACTIVE_AUTH: '1',
    },
    stderr: 'pipe',
  });
  transport.stderr?.on('data', () => {});
  await client.connect(transport);
  return client;
};

const call = async (client, name, args = {}) => {
  const res = await client.callTool({ name, arguments: args });
  return {
    isError: Boolean(res.isError),
    data: JSON.parse(res.content[0].text),
  };
};

function cleanup() {
  const absolute = realpathSync(temp);
  const parent = realpathSync(tmpdir());
  if (!absolute.startsWith(parent + sep) || !absolute.slice(parent.length + 1).startsWith('qap-interactive-stdio-')) {
    throw new Error('Unsafe cleanup path');
  }
  rmSync(absolute, { recursive: true, force: true });
}

const evidence = {
  test_type: 'physical_stdio_transport_interactive_continuity',
  results: [],
  status: 'PENDING',
};

let client;
try {
  client = await openClient();

  // Test 1: Workspace A is not authorized initially
  const call1 = await call(client, 'qap_status', { targetPath: wsA });
  assert.equal(call1.data.code, 'workspace_authorization_required');
  assert.equal(existsSync(join(wsA, '.qa')), false);
  evidence.results.push('1. Un-authorized workspace blocked over Stdio');

  // Test 2: Operator authorizes Workspace A on disk while MCP is RUNNING
  atomicRecordAuthorizedRoot(registryPath, wsA);

  // Test 3: WITHOUT RESTARTING THE MCP SERVER, same process calls qap_status on Workspace A
  const call2 = await call(client, 'qap_status', { targetPath: wsA });
  assert.equal(call2.isError, false);
  assert.equal(call2.data.initialized, true);
  assert.equal(call2.data.knowledge.state, 'prepared');
  assert.ok(call2.data.siguiente_accion.pregunta.texto.includes('¿Dónde está el sistema que quieres probar?'));
  assert.equal(existsSync(join(wsA, '.qa', 'project', 'context.yaml')), true);
  evidence.results.push('2. Dynamic disk authorization recognized without MCP restart');

  // Test 4: Continuity in same process — register URL and verify transition
  const call3 = await call(client, 'qap_context_set', { targetPath: wsA, base_url: 'https://app-a.invalid', source: 'user' });
  assert.equal(call3.data.status, 'success');

  const call4 = await call(client, 'qap_status', { targetPath: wsA });
  assert.equal(call4.data.knowledge.state, 'available');
  evidence.results.push('3. In-flight continuity: state persists across multiple tool calls without restart');

  // Test 5: Workspace B remains strictly un-authorized
  const callB1 = await call(client, 'qap_status', { targetPath: wsB });
  assert.equal(callB1.data.code, 'workspace_authorization_required');
  assert.equal(existsSync(join(wsB, '.qa')), false);
  evidence.results.push('4. Workspace B is isolated and un-authorized');

  // Test 6: Authorize Workspace B dynamically in same running process
  atomicRecordAuthorizedRoot(registryPath, wsB);
  const callB2 = await call(client, 'qap_status', { targetPath: wsB });
  assert.equal(callB2.data.initialized, true);
  await call(client, 'qap_context_set', { targetPath: wsB, base_url: 'https://app-b.invalid', source: 'user' });

  // Test 7: Verify two independent SQLite databases in host directory
  const dbDirs = readdirSync(hostDir).filter(p => p !== 'authorized-roots.json');
  assert.equal(dbDirs.length, 2, 'Must have exactly two separate project database directories');
  evidence.results.push('5. Two independent workspaces isolated in host storage and state');

  evidence.status = 'PASS_STDIO_CONTINUITY';
  console.log(JSON.stringify(evidence, null, 2));
} finally {
  await client?.close();
  cleanup();
}
