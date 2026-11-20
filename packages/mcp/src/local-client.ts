import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { readFileSync, realpathSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

import { normalizePathKey } from './application/safe-storage.js';
import { loadHostComposition } from './host-composition.js';
import { createMcpServer } from './server.js';

export function isLocalQapWorkspace(root: string): boolean {
  const directory = process.env.QAP_MCP_WORKSPACE_HOST_DIR ?? join(process.env.QAP_MCP_HOST_DATA_DIR ?? join(homedir(), '.qap'), 'workspaces');
  try {
    const canonical = normalizePathKey(realpathSync(root));
    const roots: unknown = JSON.parse(readFileSync(join(directory, 'authorized-roots.json'), 'utf8'));
    return Array.isArray(roots) && roots.some(item => typeof item === 'string' && normalizePathKey(item) === canonical);
  } catch { return false; }
}

export async function callLocalQapTool(client: Client, name: string, args: Record<string, unknown>) {
  const response = await client.callTool({ name, arguments: args }, undefined, { timeout: 600_000 });
  const content = Array.isArray(response.content) ? response.content[0] : undefined;
  if (content?.type !== 'text') throw new Error('Respuesta de QAP no válida.');
  return { payload: JSON.parse(content.text), isError: Boolean(response.isError) };
}

/** The CLI consumes the same tool dispatch, workspace admission and runner as Stdio. */
export async function withLocalQapClient<T>(run: (client: Client) => Promise<T>): Promise<T> {
  const composition = await loadHostComposition();
  const server = createMcpServer(composition.options);
  const client = new Client({ name: 'qap-cli', version: '1.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  try {
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    return await run(client);
  } finally {
    try { await client.close(); }
    finally { try { await server.close(); } finally { composition.close(); } }
  }
}
