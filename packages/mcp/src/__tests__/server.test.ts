import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMcpServer } from '../server.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

describe('Suite MCP Server QAP v2.1', () => {
  let tempDir: string;
  let originalCwd: () => string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'qap-mcp-test-'));
    originalCwd = process.cwd;
    process.cwd = () => tempDir;
  });

  afterEach(() => {
    process.cwd = originalCwd;
    rmSync(tempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('debe registrar y exponer las 6 tools del ciclo de vida requeridas', async () => {
    const server = createMcpServer();
    // @ts-expect-error accessing internal request handler
    const handler = server._requestHandlers.get(ListToolsRequestSchema.shape.method.value);
    expect(handler).toBeDefined();

    const response = await handler({ method: 'tools/list' }, {});
    const toolNames = response.tools.map((t: { name: string }) => t.name);

    expect(toolNames).toContain('qap_init');
    expect(toolNames).toContain('qap_clean');
    expect(toolNames).toContain('qap_auth_add');
    expect(toolNames).toContain('qap_status');
    expect(toolNames).toContain('qap_report');
    expect(toolNames).toContain('qap_server');
    expect(toolNames.length).toBe(6);
  });

  it('debe ejecutar qap_init y crear el arbol .qa/', async () => {
    const server = createMcpServer();
    // @ts-expect-error accessing internal request handler
    const handler = server._requestHandlers.get(CallToolRequestSchema.shape.method.value);

    const callResult = await handler(
      {
        method: 'tools/call',
        params: {
          name: 'qap_init',
          arguments: {
            projectName: 'demo-mcp',
            environments: ['local', 'staging'],
            baseUrl: 'http://localhost:3000',
          },
        },
      },
      {}
    );

    expect(callResult.isError).toBeFalsy();
    const parsed = JSON.parse(callResult.content[0].text);
    expect(parsed.status).toBe('success');
    expect(parsed.projectName).toBe('demo-mcp');
    expect(existsSync(join(tempDir, '.qa', 'project', 'environments.yaml'))).toBe(true);
    expect(existsSync(join(tempDir, '.qa', 'project', 'context.yaml'))).toBe(true);
  });

  it('debe validar y mostrar estado con qap_status', async () => {
    const server = createMcpServer();
    // @ts-expect-error accessing internal request handler
    const handler = server._requestHandlers.get(CallToolRequestSchema.shape.method.value);

    // Antes de inicializar
    const statusBefore = await handler({ method: 'tools/call', params: { name: 'qap_status', arguments: {} } }, {});
    const parsedBefore = JSON.parse(statusBefore.content[0].text);
    expect(parsedBefore.initialized).toBe(false);

    // Inicializar
    await handler({ method: 'tools/call', params: { name: 'qap_init', arguments: { projectName: 'status-demo' } } }, {});

    // Después de inicializar
    const statusAfter = await handler({ method: 'tools/call', params: { name: 'qap_status', arguments: {} } }, {});
    const parsedAfter = JSON.parse(statusAfter.content[0].text);
    expect(parsedAfter.initialized).toBe(true);
    expect(parsedAfter.projectName).toBe('status-demo');
  });

  it('debe registrar un perfil de autenticacion con qap_auth_add', async () => {
    const server = createMcpServer();
    // @ts-expect-error accessing internal request handler
    const handler = server._requestHandlers.get(CallToolRequestSchema.shape.method.value);

    await handler({ method: 'tools/call', params: { name: 'qap_init', arguments: {} } }, {});

    const authResult = await handler(
      {
        method: 'tools/call',
        params: {
          name: 'qap_auth_add',
          arguments: {
            profile: 'admin-user',
            env: 'staging',
            username: 'admin',
            login_mode: 'auto',
          },
        },
      },
      {}
    );

    expect(authResult.isError).toBeFalsy();
    const parsed = JSON.parse(authResult.content[0].text);
    expect(parsed.status).toBe('success');
    expect(parsed.profile.id).toBe('admin-user');
    expect(existsSync(join(tempDir, '.qa', 'project', 'auth', 'profiles.json'))).toBe(true);
  });

  it('debe generar reportes con qap_report y limpiar con qap_clean', async () => {
    const server = createMcpServer();
    // @ts-expect-error accessing internal request handler
    const handler = server._requestHandlers.get(CallToolRequestSchema.shape.method.value);

    await handler({ method: 'tools/call', params: { name: 'qap_init', arguments: {} } }, {});

    // Generar reporte
    const reportResult = await handler(
      {
        method: 'tools/call',
        params: {
          name: 'qap_report',
          arguments: { format: 'all' },
        },
      },
      {}
    );
    expect(reportResult.isError).toBeFalsy();
    const parsedReport = JSON.parse(reportResult.content[0].text);
    expect(parsedReport.status).toBe('success');
    expect(parsedReport.generatedReports.html).toBeDefined();

    // Resetear con clean
    const cleanResult = await handler(
      {
        method: 'tools/call',
        params: {
          name: 'qap_clean',
          arguments: { force: true },
        },
      },
      {}
    );
    expect(cleanResult.isError).toBeFalsy();
    expect(existsSync(join(tempDir, '.qa'))).toBe(false);
  });
});
