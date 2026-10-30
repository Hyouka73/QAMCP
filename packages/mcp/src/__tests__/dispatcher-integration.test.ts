import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { CallToolResultSchema, type CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { type IMcpToolHandler } from '../dispatcher.js';
import { createMcpServer, type McpServerOptions } from '../server.js';

const connections: Array<{ client: Client; server: ReturnType<typeof createMcpServer> }> = [];
async function connect(options?: McpServerOptions): Promise<Client> {
  const server = createMcpServer(options);
  const client = new Client({ name: 'dispatcher-test', version: '1.0.0' });
  connections.push({ client, server });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  return client;
}

function synthetic(): IMcpToolHandler {
  return {
    definition: {
      name: 'test_synthetic', description: 'Injected only in tests',
      inputSchema: { type: 'object', properties: { value: { type: 'string' } }, required: ['value'] },
    },
    execute: vi.fn((args: unknown, context): CallToolResult => ({
      content: [{ type: 'text', text: JSON.stringify({ args, hasSignal: context.signal instanceof AbortSignal }) }],
    })),
  };
}

afterEach(async () => {
  for (const { client, server } of connections.splice(0)) {
    await client.close();
    await server.close();
  }
});

describe('real MCP client/server via linked transports', () => {
  it('lists and invokes an injected declarative tool exactly once', async () => {
    const handler = synthetic();
    const client = await connect({ handlers: [handler] });
    const catalog = await client.listTools();
    expect(catalog.tools).toHaveLength(19);
    expect(new Set(catalog.tools.map(tool => tool.name)).size).toBe(19);
    expect(catalog.tools.at(-1)).toEqual(handler.definition);
    const result = await client.callTool({ name: 'test_synthetic', arguments: { value: 'hello' } });
    expect(result.content).toEqual([{ type: 'text', text: JSON.stringify({ args: { value: 'hello' }, hasSignal: true }) }]);
    expect(handler.execute).toHaveBeenCalledTimes(1);
  });

  it('isolates registries and preserves unknown-tool legacy errors', async () => {
    const extended = await connect({ handlers: [synthetic()] });
    const production = await connect();
    expect((await extended.listTools()).tools).toHaveLength(19);
    expect((await production.listTools()).tools).toHaveLength(18);
    expect(await production.callTool({ name: 'test_synthetic' })).toEqual({
      isError: true, content: [{ type: 'text', text: 'Tool no reconocida: test_synthetic' }],
    });
  });

  it('rejects legacy collisions and duplicate injected names at startup', () => {
    const handler = synthetic();
    expect(() => createMcpServer({ handlers: [handler, handler] })).toThrow();
    handler.definition.name = 'qap_status';
    expect(() => createMcpServer({ handlers: [handler] })).toThrow();
  });

  it('preserves 17 definitions, discover schema/order and prompts; revises only its description', async () => {
    const baseline = JSON.parse(readFileSync(new URL('./fixtures/mcp-catalog-vnext010.json', import.meta.url), 'utf8'));
    const client = await connect();
    const tools = (await client.listTools()).tools;
    const oldTools = baseline.tools as Array<{ name: string; description: string }>;
    const changed = tools.find(tool => tool.name === 'qap_discover')!;
    expect(changed.description).not.toBe(oldTools.find(tool => tool.name === 'qap_discover')!.description);
    expect({ tools: tools.map(tool => tool.name === 'qap_discover' ? { ...tool, description: oldTools.find(t => t.name === tool.name)!.description } : tool), prompts: (await client.listPrompts()).prompts }).toEqual(baseline);
    expect(await client.getPrompt({ name: 'qap_start' })).toEqual({
      description: 'Onboarding paso a paso para QAP',
      messages: [{ role: 'user', content: { type: 'text', text: 'Inicia revisando el estado de QAP con qap_status y guíame paso a paso sin muros de texto.' } }],
    });
  });

  it('runs informative legacy status on an empty disposable fixture', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'qap-dispatcher-'));
    try {
      const client = await connect();
      const result = await client.callTool({ name: 'qap_status', arguments: { targetPath: directory } });
      expect(result.isError).toBeFalsy();
      expect(result.content).toEqual(expect.arrayContaining([expect.objectContaining({ type: 'text', text: expect.stringContaining('"initialized": false') })]));
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });

  it('sanitizes declarative exceptions through the real SDK', async () => {
    const handler = { ...synthetic(), execute: () => { throw new Error('PRIVATE_CANARY'); } };
    const client = await connect({ handlers: [handler] });
    const result = await client.callTool({ name: 'test_synthetic' });
    expect(result.isError).toBe(true);
    expect(JSON.stringify(result)).not.toContain('PRIVATE_CANARY');
  });

  it('demonstrates that low-level SDK does not validate inputSchema', async () => {
    const handler = synthetic();
    const client = await connect({ handlers: [handler] });
    // request() avoids client-side helpers: this is a valid MCP envelope but violates inputSchema.
    const result = await client.request({ method: 'tools/call', params: { name: 'test_synthetic', arguments: { value: 42 } } }, CallToolResultSchema);
    expect(result.isError).toBeFalsy();
    expect(handler.execute).toHaveBeenCalledTimes(1);
  });

  it('applies a handler validator through MCP before execution', async () => {
    const handler = { ...synthetic(), validateArguments: () => false };
    const client = await connect({ handlers: [handler] });
    expect((await client.callTool({ name: 'test_synthetic', arguments: { value: 42 } })).isError).toBe(true);
    expect(handler.execute).not.toHaveBeenCalled();
  });
});
