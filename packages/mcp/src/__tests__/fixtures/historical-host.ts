import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { loadHostComposition } from '../../host-composition.js';
import { createMcpServer } from '../../server.js';

/** Exercise an explicitly embedded legacy host without changing the shipped Stdio configuration. */
export async function connectHistoricalHost(client: Client, env: NodeJS.ProcessEnv) {
  const composition = await loadHostComposition(env);
  const server = createMcpServer({ ...composition.options, autonomyPolicy: undefined });
  const [front, back] = InMemoryTransport.createLinkedPair();
  try {
    await server.connect(back);
    await client.connect(front);
    const close = client.close.bind(client);
    let closed = false;
    client.close = async () => {
      if (closed) return;
      closed = true;
      try { await close(); }
      finally { try { await server.close(); } finally { composition.close(); } }
    };
  } catch (error) {
    try { await server.close(); } finally { composition.close(); }
    throw error;
  }
}
