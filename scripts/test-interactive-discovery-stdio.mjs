import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import {
  atomicRecordAuthorizedRoot,
  atomicRecordDiscoveryAuthorization,
  loadDiscoveryAuthorizationsFromDisk,
} from '../packages/mcp/dist/index.js';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temp = mkdtempSync(join(tmpdir(), 'qap-interactive-discovery-stdio-'));
const hostDir = join(temp, 'host');
const wsA = join(temp, 'workspace-a');
const wsB = join(temp, 'workspace-b');

mkdirSync(hostDir);
mkdirSync(wsA);
mkdirSync(wsB);

const rootRegistryPath = join(hostDir, 'authorized-roots.json');
const discoveryRegistryPath = join(hostDir, 'discovery-authorizations.json');

// Pre-authorize workspaces so we can test discovery specifically
atomicRecordAuthorizedRoot(rootRegistryPath, wsA);
atomicRecordAuthorizedRoot(rootRegistryPath, wsB);

const openClient = async () => {
  const client = new Client({ name: 'interactive-discovery-stdio-tester', version: '1.0.0' }, {});
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
  if (!absolute.startsWith(parent + sep) || !absolute.slice(parent.length + 1).startsWith('qap-interactive-discovery-stdio-')) {
    throw new Error('Unsafe cleanup path');
  }
  rmSync(absolute, { recursive: true, force: true });
}

const evidence = {
  test_type: 'physical_stdio_transport_interactive_discovery_continuity',
  results: [],
  status: 'PENDING',
};

let client;
try {
  client = await openClient();

  // Test 1: Initialize Workspace A & register URL
  const initA = await call(client, 'qap_status', { targetPath: wsA });
  assert.equal(initA.data.initialized, true);
  await call(client, 'qap_context_set', { targetPath: wsA, base_url: 'https://staging.test.invalid/', source: 'user' });

  // Test 2: Un-authorized discovery blocked when interactive authorizer is disabled
  const disc1 = await call(client, 'qap_discover', {
    targetPath: wsA,
    name: 'inventario-provisional',
    path: 'https://staging.test.invalid/',
  });
  assert.equal(disc1.data.code, 'discovery_authorization_required');
  evidence.results.push('1. Un-authorized discovery blocked over Stdio without authorizer');

  // Test 3: Operator records discovery authorization on disk while MCP is RUNNING
  const keyA = createHash('sha256').update(process.platform === 'win32' ? wsA.toLowerCase() : wsA).digest('hex');
  const appIdA = 'workspace-' + keyA.slice(0, 32);
  const authRecord = {
    projectRoot: wsA,
    applicationId: appIdA,
    environmentId: 'local',
    environmentRevision: 1,
    authorization: {
      read_only_acknowledged: true,
      navigation_urls: ['https://staging.test.invalid/'],
      allow_public_network: true,
    },
    limits: { max_pages: 5, max_requests: 10, total_timeout_ms: 10000 },
  };
  atomicRecordDiscoveryAuthorization(discoveryRegistryPath, authRecord);

  // Test 4: WITHOUT RESTARTING THE MCP SERVER, same process calls qap_discover on Workspace A
  // The server syncs from disk and recognizes the authorization dynamically!
  const disc2 = await call(client, 'qap_discover', {
    targetPath: wsA,
    name: 'inventario-provisional',
    path: 'https://staging.test.invalid/',
  });
  // Should NOT be blocked with discovery_authorization_required anymore
  assert.notEqual(disc2.data.code, 'discovery_authorization_required');
  assert.notEqual(disc2.data.code, 'url_not_authorized');
  assert.notEqual(disc2.data.code, 'authorization_context_mismatch');
  evidence.results.push('2. Dynamic disk discovery authorization recognized without MCP restart');

  // Test 5: Workspace B remains strictly un-authorized for discovery
  const initB = await call(client, 'qap_status', { targetPath: wsB });
  assert.equal(initB.data.initialized, true);
  await call(client, 'qap_context_set', { targetPath: wsB, base_url: 'https://staging.test.invalid/', source: 'user' });

  const discB = await call(client, 'qap_discover', {
    targetPath: wsB,
    name: 'inventario-provisional',
    path: 'https://staging.test.invalid/',
  });
  assert.equal(discB.data.code, 'discovery_authorization_required');
  evidence.results.push('3. Workspace B is isolated and discovery remains strictly unauthorized');

  // Test 6: Verify disk persistence
  const records = loadDiscoveryAuthorizationsFromDisk(discoveryRegistryPath);
  assert.equal(records.length, 1);
  assert.equal(records[0].authorization.navigation_urls[0], 'https://staging.test.invalid/');
  evidence.results.push('4. Discovery authorization persisted durably on host disk outside project');

  evidence.status = 'PASS_STDIO_DISCOVERY_CONTINUITY';
  console.log(JSON.stringify(evidence, null, 2));
} finally {
  await client?.close();
  cleanup();
}
