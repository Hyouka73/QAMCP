import { CallToolResultSchema, type CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { describe, expect, it, vi } from 'vitest';

import { McpToolError, ToolDispatcher, type IMcpToolHandler } from '../dispatcher.js';

const context = { requestId: 1, signal: new AbortController().signal };
const ok: CallToolResult = { content: [{ type: 'text', text: 'ok' }] };
function handler(name = 'test_tool'): IMcpToolHandler {
  return { definition: { name, description: 'Test tool', inputSchema: { type: 'object' } }, execute: vi.fn(() => ok) };
}

describe('ToolDispatcher registration', () => {
  it('preserves explicit insertion order and isolates instances', () => {
    const dispatcher = new ToolDispatcher().register(handler('b')).register(handler('a')).seal();
    expect(dispatcher.listTools().map(tool => tool.name)).toEqual(['b', 'a']);
    expect(new ToolDispatcher().listTools()).toEqual([]);
    expect(dispatcher.has('B')).toBe(false);
  });

  it.each(['', ' ', 'a b', '../path', 'a/b', 'a'.repeat(129)])('rejects invalid name %j', name => {
    expect(() => new ToolDispatcher().register(handler(name))).toThrow('registration failed');
  });

  it.each(['qap.status', 'qap-status', 'qap_status', 'A1'])('accepts valid name %s', name => {
    expect(new ToolDispatcher().register(handler(name)).seal().has(name)).toBe(true);
  });

  it('rejects duplicates and legacy collisions without executing handlers', async () => {
    const tool = handler();
    const dispatcher = new ToolDispatcher().register(tool);
    expect(() => dispatcher.register(tool)).toThrow();
    expect(() => dispatcher.seal()).toThrow();
    expect((await dispatcher.dispatch({ name: 'test_tool' }, context)).isError).toBe(true);
    expect(tool.execute).not.toHaveBeenCalled();
    expect(() => new ToolDispatcher(['test_tool']).register(tool)).toThrow();
  });

  it.each([
    null,
    {},
    { ...handler(), execute: null },
    { ...handler(), validateArguments: 'invalid' },
    { ...handler(), definition: { ...handler().definition, description: '' } },
    { ...handler(), definition: { ...handler().definition, inputSchema: { type: 'array' } } },
  ])('rejects malformed contracts', value => {
    expect(() => new ToolDispatcher().register(value as IMcpToolHandler)).toThrow('registration failed');
  });

  it('requires sealing and rejects registration during execution', async () => {
    const tool = handler();
    const dispatcher = new ToolDispatcher().register(tool);
    expect((await dispatcher.dispatch({ name: 'test_tool' }, context)).isError).toBe(true);
    expect(tool.execute).not.toHaveBeenCalled();
    dispatcher.seal();
    expect(() => dispatcher.register(handler('late'))).toThrow('sealed');
    expect(await dispatcher.dispatch({ name: 'test_tool' }, context)).toEqual(ok);
  });

  it('captures metadata and callbacks independently of caller mutation', async () => {
    const tool = handler();
    const dispatcher = new ToolDispatcher().register(tool).seal();
    tool.definition.name = 'replacement';
    tool.execute = () => { throw new Error('private'); };
    dispatcher.listTools()[0].inputSchema.type = 'object';
    dispatcher.listTools()[0].name = 'other';
    expect(dispatcher.listTools()[0].name).toBe('test_tool');
    expect(await dispatcher.dispatch({ name: 'test_tool' }, context)).toEqual(ok);
  });
});

describe('ToolDispatcher execution', () => {
  it('awaits async execution, passes context and isolates input mutation', async () => {
    const args = { nested: { value: 1 } };
    const tool: IMcpToolHandler = {
      ...handler(),
      execute: vi.fn(async (input, receivedContext) => {
        expect(input).toEqual(args);
        expect(receivedContext).toBe(context);
        (input as typeof args).nested.value = 2;
        await Promise.resolve();
        return ok;
      }),
    };
    const result = await new ToolDispatcher().register(tool).seal().dispatch({ name: 'test_tool', arguments: args }, context);
    expect(CallToolResultSchema.safeParse(result).success).toBe(true);
    expect(result).toEqual(ok);
    expect(args.nested.value).toBe(1);
  });

  it.each([null, [], {}, { name: 1 }, { name: 'test_tool', arguments: [] }, { name: 'test_tool', arguments: null }])(
    'rejects malformed invocations without execution', async invocation => {
      const tool = handler();
      const result = await new ToolDispatcher().register(tool).seal().dispatch(invocation, context);
      expect(result.isError).toBe(true);
      expect(tool.execute).not.toHaveBeenCalled();
    },
  );

  it('does exact lookup, including prototype-looking names', async () => {
    const dispatcher = new ToolDispatcher().register(handler()).seal();
    for (const name of ['TEST_TOOL', 'constructor', '__proto__', '../test_tool']) {
      expect(await dispatcher.dispatch({ name }, context)).toMatchObject({ isError: true });
    }
  });

  it('allows omitted arguments without inventing domain defaults', async () => {
    const tool = handler();
    await new ToolDispatcher().register(tool).seal().dispatch({ name: 'test_tool' }, context);
    expect(tool.execute).toHaveBeenCalledWith(undefined, context);
  });

  it('supports specific validators before execution', async () => {
    const tool = { ...handler(), validateArguments: () => false };
    const result = await new ToolDispatcher().register(tool).seal().dispatch({ name: 'test_tool' }, context);
    expect(result.content).toEqual([{ type: 'text', text: JSON.stringify({ code: 'invalid_arguments', message: 'Invalid tool arguments.' }) }]);
    expect(tool.execute).not.toHaveBeenCalled();
  });

  it('preserves intentional MCP error results', async () => {
    const result: CallToolResult = { isError: true, content: [{ type: 'text', text: 'Public domain error' }] };
    const tool = { ...handler(), execute: () => result };
    expect(await new ToolDispatcher().register(tool).seal().dispatch({ name: 'test_tool' }, context)).toEqual(result);
  });

  it.each([new Error('password=PRIVATE_CANARY'), 'token=PRIVATE_CANARY', { private: 'PRIVATE_CANARY' }])(
    'sanitizes thrown exceptions', async error => {
      const log = vi.spyOn(console, 'error');
      try {
        // Exercise untrusted implementations rejecting non-Error values as well as Errors.
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        const tool = { ...handler(), execute: () => Promise.reject(error) };
        const result = await new ToolDispatcher().register(tool).seal().dispatch({ name: 'test_tool' }, context);
        expect(result.isError).toBe(true);
        expect(JSON.stringify(result)).not.toContain('PRIVATE_CANARY');
        expect(log).not.toHaveBeenCalled();
      } finally { log.mockRestore(); }
    },
  );

  it('returns fixed structured errors even if exception message is modified', async () => {
    const error = new McpToolError('invalid_arguments');
    error.message = 'PRIVATE_CANARY';
    const tool = { ...handler(), execute: () => { throw error; } };
    const result = await new ToolDispatcher().register(tool).seal().dispatch({ name: 'test_tool' }, context);
    expect(JSON.stringify(result)).toContain('invalid_arguments');
    expect(JSON.stringify(result)).not.toContain('PRIVATE_CANARY');
  });

  it('sanitizes invalid results and validator exceptions', async () => {
    for (const tool of [
      { ...handler(), execute: () => ({ content: 'PRIVATE_CANARY' } as unknown as CallToolResult) },
      { ...handler(), validateArguments: () => { throw new Error('PRIVATE_CANARY'); } },
    ]) {
      const result = await new ToolDispatcher().register(tool).seal().dispatch({ name: 'test_tool' }, context);
      expect(result.isError).toBe(true);
      expect(JSON.stringify(result)).not.toContain('PRIVATE_CANARY');
    }
  });

  it('does not invoke handlers with an already cancelled context', async () => {
    const controller = new AbortController();
    controller.abort();
    const tool = handler();
    const result = await new ToolDispatcher().register(tool).seal().dispatch({ name: 'test_tool' }, { ...context, signal: controller.signal });
    expect(result.isError).toBe(true);
    expect(tool.execute).not.toHaveBeenCalled();
  });

  it('prevents registry mutation from inside an executing handler', async () => {
    const dispatcher = new ToolDispatcher();
    dispatcher.register({ ...handler(), execute: () => {
      dispatcher.register(handler('accidental'));
      return ok;
    } }).seal();
    expect((await dispatcher.dispatch({ name: 'test_tool' }, context)).isError).toBe(true);
    expect(dispatcher.has('accidental')).toBe(false);
  });
});
