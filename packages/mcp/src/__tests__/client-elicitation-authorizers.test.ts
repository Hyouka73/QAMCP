import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { CallToolResultSchema, ElicitRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createMcpServer } from '../server.js';
import { WorkspaceBootstrap } from '../workspace-bootstrap.js';

const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(path => rmSync(path, { recursive: true, force: true })));

async function prepareClient(elicitation: boolean) {
  const temp = mkdtempSync(join(tmpdir(), 'qap-client-elicitation-'));
  roots.push(temp);
  const root = join(temp, 'workspace');
  const host = join(temp, 'host');
  mkdirSync(root);
  const bootstrap = new WorkspaceBootstrap(host);
  const fallback = { requestAuthorization: vi.fn(async (request: { canonicalPath: string }) => ({ decision: 'approved' as const, root: request.canonicalPath })) };
  const server = createMcpServer({ workspaceBootstrap: bootstrap, projectRoots: [], workspaceAuthorizer: fallback });
  const client = new Client({ name: 'elicitation-test', version: '1.0.0' }, elicitation ? { capabilities: { elicitation: { form: {} } } } : undefined);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  return { root, bootstrap, server, client, fallback };
}

describe('MCP native elicitation authorization', () => {
  it('uses advertised client elicitation UI for explicit workspace consent', async () => {
    const f = await prepareClient(true);
    const requests: unknown[] = [];
    f.client.setRequestHandler(ElicitRequestSchema, async request => {
      requests.push(request.params);
      return { action: 'accept', content: { authorize: true } };
    });
    try {
      await f.client.request({ method: 'tools/call', params: { name: 'qap_status', arguments: { targetPath: f.root } } }, CallToolResultSchema);
      expect(requests).toHaveLength(1);
      expect((requests[0] as { message: string }).message).toContain(f.root);
      expect(f.fallback.requestAuthorization).not.toHaveBeenCalled();
    } finally {
      await f.client.close(); await f.server.close(); f.bootstrap.close();
    }
  }, 15000);

  it('keeps the configured host authorizer when the client does not advertise elicitation', async () => {
    const f = await prepareClient(false);
    try {
      await f.client.request({ method: 'tools/call', params: { name: 'qap_status', arguments: { targetPath: f.root } } }, CallToolResultSchema);
      expect(f.fallback.requestAuthorization).toHaveBeenCalledTimes(1);
    } finally {
      await f.client.close(); await f.server.close(); f.bootstrap.close();
    }
  }, 15000);
});
