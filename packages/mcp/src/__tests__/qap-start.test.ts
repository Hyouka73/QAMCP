import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
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
  let siteRequests = 0;
  const requestedMethods: string[] = [];
  const site = createServer((request, response) => {
    siteRequests++;
    requestedMethods.push(request.method ?? '');
    if (request.url === '/') {
      response.writeHead(302, { location: '/login;jsessionid=DO_NOT_LOG_THE_SESSION_ID' }).end();
    } else if (request.url === '/login') {
      response.writeHead(200, { 'content-type': 'text/html' }).end(
        '<h1>Portal de prueba</h1><form method="post"><label>Usuario<input name="user"></label>' +
        '<label>Contraseña<input type="password"></label><button>Entrar</button></form><a href="/help">Ayuda</a>',
      );
    } else {
      response.writeHead(404).end();
    }
  });
  await new Promise<void>(done => site.listen(0, '127.0.0.1', done));
  const address = site.address() as { port: number };
  let client: Client | undefined;
  async function connect() {
    client = new Client({ name: 'qap-test-without-roots', version: '1.0.0' });
    await client.connect(new StdioClientTransport({
      command: process.execPath,
      args: [serverPath],
      env: { PATH: process.env.PATH ?? '', NODE_ENV: 'test',
        ...(process.env.PLAYWRIGHT_BROWSERS_PATH ? { PLAYWRIGHT_BROWSERS_PATH: process.env.PLAYWRIGHT_BROWSERS_PATH } : {}),
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
    const start = await call('qap_start', { base_url: 'http://127.0.0.1:' + address.port });
    expect(start).toMatchObject({ status: 'success', initialized: true, fase: 'ONBOARDING',
      conversation_id: expect.any(String), discovery_inicial: {
        status: 'partial', code: 'auth_required', notes_path: '.qa/discovery/INICIO.md',
        counts: { views: 1, forms: 1 }, routes: expect.arrayContaining([
          { path: '/login', state: 'visited', reason: 'AUTH_REQUIRED' },
          { path: '/help', state: 'candidate', reason: 'OBSERVED_LINK_NOT_VISITED' },
        ]),
      } });
    const first = start.discovery_inicial as { doc_path: string; revision_id: string };
    const markdown = readFileSync(join(workspace, first.doc_path), 'utf8');
    expect(markdown).toContain('/login');
    expect(markdown).toContain('Formularios:** 1');
    expect(markdown).not.toContain('DO_NOT_LOG_THE_SESSION_ID');
    expect(requestedMethods.every(method => method === 'GET')).toBe(true);
    expect(siteRequests).toBe(2);
    expect(readFileSync(join(workspace, '.qa/discovery/INICIO.md'), 'utf8')).toContain('Expediente de la vista');
    const path = String(start.conversation_log);
    expect(path).toBe(join(workspace, '.qa', 'logs', 'conversations', String(start.conversation_id) + '.jsonl'));
    expect(readFileSync(path, 'utf8')).toContain('qap_start');
    await client!.close();
    const previousRequests = siteRequests;
    mkdirSync(join(workspace, 'pages'));
    writeFileSync(join(workspace, 'pages', 'report.tsx'), 'export default function Report() { return null; }');
    writeFileSync(join(workspace, 'manual.md'), '# Manual de operaciones\n\nConsulta de reportes por oficina y fecha.');
    rmSync(join(workspace, first.doc_path));
    await connect();
    expect(await call('qap_status', { targetPath: workspace, conversation_id: start.conversation_id })).toMatchObject({ initialized: true });
    const second = await call('qap_start', { targetPath: workspace });
    expect(second.conversation_id).not.toBe(start.conversation_id);
    expect(second.discovery_inicial).toMatchObject({ revision_id: first.revision_id, reused: true });
    expect(siteRequests).toBe(previousRequests);
    expect(existsSync(join(workspace, first.doc_path))).toBe(true);
    const resumeNotes = readFileSync(join(workspace, '.qa/discovery/INICIO.md'), 'utf8');
    expect(resumeNotes).toContain('manual.md');
    expect(resumeNotes).toContain('/report');
    expect(readFileSync(path, 'utf8').trim().split(/\r?\n/).map(line =>
      (JSON.parse(line) as { tool: string }).tool)).toEqual(['qap_discover', 'qap_start', 'qap_status']);
    expect(readFileSync(String(second.conversation_log), 'utf8').trim().split(/\r?\n/)).toHaveLength(1);
  } finally {
    await client?.close();
    await new Promise<void>((done, reject) => site.close(error => error ? reject(error) : done()));
    rmSync(base, { recursive: true, force: true });
  }
}, 45_000);
