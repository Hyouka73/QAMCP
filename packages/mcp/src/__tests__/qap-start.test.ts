import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { expect, it } from 'vitest';

const serverPath = resolve(dirname(fileURLToPath(import.meta.url)), '../../dist/server.js');

it('starts from a client without roots or elicitation and persists separate MCP logs across reconnects', async () => {
  const base = realpathSync(mkdtempSync(join(tmpdir(), 'qap-start-')));
  const workspace = join(base, 'workspace');
  const outside = join(base, 'outside');
  mkdirSync(workspace);
  mkdirSync(outside);
  let client: Client | undefined;
  async function connect() {
    client = new Client({ name: 'qap-test-without-roots', version: '1.0.0' });
    await client.connect(new StdioClientTransport({
      command: process.execPath,
      args: [serverPath],
      env: { PATH: process.env.PATH ?? '', NODE_ENV: 'test',
        QAP_MCP_HOST_DATA_DIR: join(base, 'host'), QAP_MCP_WORKSPACE_ROOT: workspace },
      stderr: 'pipe',
    }));
  }
  async function call(name: string, args: Record<string, unknown>) {
    const response = await client!.callTool({ name, arguments: args });
    const output = response.content as Array<{ text: string }>;
    return JSON.parse(output[0].text) as Record<string, unknown>;
  }
  try {
    await connect();
    expect(await client!.getPrompt({ name: 'qap_start' })).toMatchObject({ messages: [
      { content: { text: expect.stringContaining('Invoca qap_start') } },
    ] });
    expect((await client!.listTools()).tools.find(tool => tool.name === 'qap_start')).toBeDefined();
    expect(await call('qap_start', { targetPath: outside })).toMatchObject({ code: 'workspace_outside_configured_root' });
    expect(existsSync(join(outside, '.qa'))).toBe(false);
    expect(await call('qap_start', { base_url: 'https://fixture:private@example.test/' })).toMatchObject({ code: 'invalid_arguments' });
    const start = await call('qap_start', { base_url: 'https://example.test/' });
    expect(start).toMatchObject({ status: 'success', initialized: true, conversation_id: expect.any(String) });
    const path = String(start.conversation_log);
    expect(path).toBe(join(workspace, '.qa', 'logs', 'conversations', String(start.conversation_id) + '.jsonl'));
    expect(readFileSync(path, 'utf8')).toContain('qap_start');
    await client!.close();
    await connect();
    expect(await call('qap_status', { targetPath: workspace, conversation_id: start.conversation_id })).toMatchObject({ initialized: true });
    const second = await call('qap_start', { targetPath: workspace });
    expect(second.conversation_id).not.toBe(start.conversation_id);
    expect(readFileSync(path, 'utf8').trim().split(/\r?\n/).map(line =>
      (JSON.parse(line) as { tool: string }).tool)).toEqual(['qap_start', 'qap_status']);
    expect(readFileSync(String(second.conversation_log), 'utf8').trim().split(/\r?\n/)).toHaveLength(1);
  } finally {
    await client?.close();
    rmSync(base, { recursive: true, force: true });
  }
});
