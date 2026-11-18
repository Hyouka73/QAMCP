import {
  CallToolRequestSchema,
  CallToolResultSchema,
  ToolSchema,
  type CallToolResult,
  type RequestId,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';

export interface McpInvocationContext {
  readonly requestId: RequestId;
  readonly signal: AbortSignal;
}

/** Arguments remain untrusted until the handler's own domain validation. */
export interface IMcpToolHandler {
  readonly definition: Tool & { description: string };
  readonly validateArguments?: (args: unknown) => boolean;
  execute(args: unknown, context: McpInvocationContext): CallToolResult | Promise<CallToolResult>;
}

const ERROR_MESSAGES = {
  invalid_invocation: 'Invalid tool invocation.',
  unknown_tool: 'Unknown tool.',
  invalid_arguments: 'Invalid tool arguments.',
  execution_failed: 'Tool execution failed.',
  invalid_result: 'Invalid tool result.',
  cancelled: 'Tool invocation cancelled.',
} as const;

/** Only fixed public codes cross the error boundary; exception messages never do. */
export class McpToolError extends Error {
  constructor(readonly code: keyof typeof ERROR_MESSAGES) {
    super(ERROR_MESSAGES[code]);
    this.name = 'McpToolError';
  }
}

function failure(code: keyof typeof ERROR_MESSAGES): CallToolResult {
  return {
    isError: true,
    content: [{ type: 'text', text: JSON.stringify({ code, message: ERROR_MESSAGES[code] }) }],
  };
}

/** Explicit registration, insertion order, and a sealed registry before execution. */
export class ToolDispatcher {
  private readonly handlers = new Map<string, IMcpToolHandler>();
  private readonly reservedNames: Set<string>;
  private sealed = false;
  private invalid = false;

  constructor(reservedNames: readonly string[] = []) {
    this.reservedNames = new Set(reservedNames);
  }

  register(handler: IMcpToolHandler): this {
    if (this.sealed) throw new Error('Tool registry is sealed.');
    try {
      const parsed = ToolSchema.safeParse(handler.definition);
      if (!parsed.success || typeof parsed.data.description !== 'string' ||
          !parsed.data.description.trim() || !/^[A-Za-z0-9_.-]{1,128}$/.test(parsed.data.name) ||
          typeof handler.execute !== 'function' ||
          (handler.validateArguments !== undefined && typeof handler.validateArguments !== 'function')) {
        throw new Error('Invalid tool handler contract.');
      }
      const name = parsed.data.name;
      if (this.reservedNames.has(name) || this.handlers.has(name)) {
        throw new Error('Duplicate or reserved tool name.');
      }
      // Capture callbacks and clone metadata so caller mutation cannot replace a route.
      this.handlers.set(name, {
        definition: structuredClone({ ...parsed.data, description: parsed.data.description }),
        execute: handler.execute.bind(handler),
        validateArguments: handler.validateArguments?.bind(handler),
      });
      return this;
    } catch {
      this.invalid = true;
      throw new Error('Tool registration failed.');
    }
  }

  seal(): this {
    if (this.invalid) throw new Error('Tool registry contains registration errors.');
    this.sealed = true;
    return this;
  }

  has(name: string): boolean {
    return this.handlers.has(name);
  }

  listTools(): Tool[] {
    return [...this.handlers.values()].map(handler => structuredClone(handler.definition));
  }

  async dispatch(invocation: unknown, context: McpInvocationContext): Promise<CallToolResult> {
    if (!this.sealed || this.invalid) return failure('execution_failed');
    try {
      const parsed = CallToolRequestSchema.safeParse({ method: 'tools/call', params: invocation });
      if (!parsed.success) return failure('invalid_invocation');
      const handler = this.handlers.get(parsed.data.params.name);
      if (!handler) return failure('unknown_tool');
      if (context.signal.aborted) return failure('cancelled');
      const args: unknown = structuredClone(parsed.data.params.arguments);
      if (handler.validateArguments && !handler.validateArguments(args)) return failure('invalid_arguments');
      const result = CallToolResultSchema.safeParse(await handler.execute(args, context));
      return result.success ? result.data : failure('invalid_result');
    } catch (error: unknown) {
      return failure(error instanceof McpToolError && Object.hasOwn(ERROR_MESSAGES, error.code)
        ? error.code : 'execution_failed');
    }
  }
}
