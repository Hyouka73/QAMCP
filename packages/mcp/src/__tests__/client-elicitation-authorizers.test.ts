import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
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

  it.each([
    { label: 'explicit decline', answer: { action: 'decline' as const }, reason: 'explicit_decline', code: 'workspace_authorization_rejected' },
    { label: 'cancel', answer: { action: 'cancel' as const }, reason: 'user_cancelled', code: 'workspace_authorization_cancelled' },
    { label: 'accepted negative answer', answer: { action: 'accept' as const, content: { authorize: false } }, reason: 'negative_answer', code: 'workspace_authorization_rejected' },
    { label: 'incomplete response', answer: { action: 'accept' as const }, reason: 'incomplete_response', code: 'workspace_dialog_start_failed' },
  ])('classifies native $label without granting authorization', async ({ answer, reason, code }) => {
    const f = await prepareClient(true);
    f.client.setRequestHandler(ElicitRequestSchema, async () => answer);
    try {
      const response = await f.client.request({ method: 'tools/call', params: { name: 'qap_status', arguments: { targetPath: f.root } } }, CallToolResultSchema);
      expect(JSON.stringify(response)).toContain(code);
      expect(f.fallback.requestAuthorization).not.toHaveBeenCalled();
      const events = readFileSync(join(f.bootstrap.directory, 'logs', 'qap-events.jsonl'), 'utf8')
        .trim().split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line) as Record<string, unknown>);
      const diagnostic = events.find(event => event.tool === 'native_authorization');
      expect(diagnostic).toBeDefined();
      expect(JSON.stringify(diagnostic)).toContain(`native_elicitation_${reason}`);
      expect(JSON.stringify(diagnostic)).not.toContain(f.root);
    } finally {
      await f.client.close(); await f.server.close(); f.bootstrap.close();
    }
  }, 15000);

  it('records native elicitation client errors as unavailable, never as rejection or approval', async () => {
    const f = await prepareClient(true);
    f.client.setRequestHandler(ElicitRequestSchema, async () => { throw new Error('sensitive client failure details'); });
    try {
      const response = await f.client.request({ method: 'tools/call', params: { name: 'qap_status', arguments: { targetPath: f.root } } }, CallToolResultSchema);
      expect(JSON.stringify(response)).toContain('workspace_dialog_start_failed');
      expect(JSON.stringify(response)).not.toContain('workspace_authorization_rejected');
      expect(f.fallback.requestAuthorization).not.toHaveBeenCalled();
      const log = readFileSync(join(f.bootstrap.directory, 'logs', 'qap-events.jsonl'), 'utf8');
      expect(log).toContain('native_elicitation_client_error');
      expect(log).toContain('client_error_name');
      expect(log).toContain('Error');
      expect(log).not.toContain('sensitive client failure details');
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
