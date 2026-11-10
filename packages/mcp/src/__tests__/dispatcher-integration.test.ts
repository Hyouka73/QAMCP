import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { CallToolResultSchema, type CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { LockManager } from '@qap/knowledge';
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
  it('E01: close aborts and drains in-flight work before the host can remove its locked root', async () => {
    const root = mkdtempSync(join(tmpdir(), 'qap-close-drain-'));
    let entered!: () => void, cancelled!: () => void, finish!: () => void;
    const started = new Promise<void>(resolve => { entered = resolve; });
    const aborted = new Promise<void>(resolve => { cancelled = resolve; });
    const barrier = new Promise<void>(resolve => { finish = resolve; });
    const handler: IMcpToolHandler = { ...synthetic(), execute: async (_args, context) => {
      const release = await new LockManager({ rootDir: root }).acquireModuleLock('catalog');
      try {
        context.signal.addEventListener('abort', cancelled, { once: true });
        entered();
        await barrier;
        // Represents a runner's final persistence while it still owns the lock.
        writeFileSync(join(root, 'drained.txt'), 'complete');
        return { content: [{ type: 'text', text: 'drained' }] };
      } finally { await release(); }
    } };
    const client = await connect({ handlers: [handler] });
    const server = connections.at(-1)!.server;
    const invocation = client.callTool({ name: 'test_synthetic' }).then(() => undefined, () => undefined);
    try {
      await started;
      let closed = false;
      const closing = server.close().then(() => { closed = true; });
      expect(server.close()).toBe(server.close()); // Concurrent callers share ownership.
      await aborted;
      expect(closed).toBe(false);
      expect(existsSync(join(root, '.qa/cache/locks/catalog.lock'))).toBe(true);
      expect((await client.callTool({ name: 'test_synthetic' })).isError).toBe(true);
      finish(); await closing; await invocation;
      expect(readFileSync(join(root, 'drained.txt'), 'utf8')).toBe('complete');
      expect(existsSync(join(root, '.qa/cache/locks/catalog.lock'))).toBe(false);
    } finally {
      finish(); await server.close(); await invocation;
      rmSync(root, { recursive: true, force: true });
    }
  });

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

  it('preserves 16 definitions, order, prompts and legacy rules schema; adds explicit canonical interview operations', async () => {
    const baseline = JSON.parse(readFileSync(new URL('./fixtures/mcp-catalog-vnext010.json', import.meta.url), 'utf8'));
    const client = await connect();
    const tools = (await client.listTools()).tools;
    const oldTools = baseline.tools as Array<{ name: string; description: string }>;
    const changed = tools.find(tool => tool.name === 'qap_discover')!;
    expect(changed.description).not.toBe(oldTools.find(tool => tool.name === 'qap_discover')!.description);
    // qap_report was intentionally extended in VNEXT-014-D. Assert its
    // new contract first; strip only this known additive property when
    // comparing the remaining vNext-010 legacy surface with its frozen fixture.
    const report = tools.find(tool => tool.name === 'qap_report')!;
    expect(report.inputSchema.properties?.module).toMatchObject({ type: 'string' });
    expect(report.inputSchema.required ?? []).not.toContain('module');
    const rules = tools.find(tool => tool.name === 'qap_rules_set')!;
    expect(rules.inputSchema.properties?.canonical_interview).toMatchObject({ type: 'object', additionalProperties: false,
      properties: { action: { enum: ['next', 'propose', 'correct', 'review', 'defer', 'resume'] } }, required: ['action'] });
    expect(tools.find(t => t.name === 'qap_plan')!.inputSchema.properties?.case_workflow).toMatchObject({
      type: 'object', additionalProperties: false, properties: { action: { enum: ['generate', 'review'] } } });
    expect(tools.find(t => t.name === 'qap_auth_add')!.inputSchema.properties?.post_login_condition).toMatchObject({
      type: 'object', required: ['type','value'], properties: { type: { enum: ['selector_present'] } } });
    expect({ tools: tools.map(tool => {
      if (tool.name === 'qap_discover') {
        const prior = oldTools.find(t => t.name === tool.name)!;
        return { ...tool, description: prior.description, inputSchema: { ...tool.inputSchema,
          properties: { ...tool.inputSchema.properties, profile: prior.inputSchema.properties?.profile } } };
      }
      if (tool.name === 'qap_plan' || tool.name === 'qap_auth_add') {
        const properties = { ...tool.inputSchema.properties }; delete properties.case_workflow; delete properties.post_login_condition;
        return { ...tool, description: oldTools.find(t => t.name === tool.name)!.description, inputSchema: { ...tool.inputSchema, properties } };
      }
      if (tool.name === 'qap_module_close') {
        const properties = { ...tool.inputSchema.properties }; delete properties.canonical_closure;
        return { ...tool, description: oldTools.find(t => t.name === tool.name)!.description,
          inputSchema: { ...tool.inputSchema, properties } };
      }
      if (tool.name === 'qap_report') {
        const properties = { ...tool.inputSchema.properties };
        delete properties.module;
        return { ...tool, inputSchema: { ...tool.inputSchema, properties } };
      }
      if (tool.name !== 'qap_rules_set') return tool;
      const properties = { ...tool.inputSchema.properties }; delete properties.canonical_interview;
      return { ...tool, description: oldTools.find(t => t.name === tool.name)!.description,
        inputSchema: { ...tool.inputSchema, properties } };
    }), prompts: (await client.listPrompts()).prompts }).toEqual(baseline);

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
