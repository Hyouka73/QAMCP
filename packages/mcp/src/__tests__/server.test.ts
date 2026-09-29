import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMcpServer } from '../server.js';
import { ListToolsRequestSchema, CallToolRequestSchema, ListPromptsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

describe('Suite MCP Server QAP v2.1 / v2.1.2', () => {
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

  it('debe registrar y exponer la suite completa de 12 tools y prompts', async () => {
    const server = createMcpServer();
    // @ts-expect-error accessing internal request handler
    const handler = server._requestHandlers.get(ListToolsRequestSchema.shape.method.value);
    expect(handler).toBeDefined();

    const response = await handler({ method: 'tools/list' }, {});
    const toolNames = response.tools.map((t: { name: string }) => t.name);

    expect(toolNames).toContain('qap_init');
    expect(toolNames).toContain('qap_clean');
    expect(toolNames).toContain('qap_auth_add');
    expect(toolNames).toContain('qap_auth_list');
    expect(toolNames).toContain('qap_status');
    expect(toolNames).toContain('qap_discover');
    expect(toolNames).toContain('qap_plan');
    expect(toolNames).toContain('qap_validate');
    expect(toolNames).toContain('qap_test');
    expect(toolNames).toContain('qap_report');
    expect(toolNames).toContain('qap_server');
    expect(toolNames).toContain('qap_prune');
    expect(toolNames.length).toBe(12);

    // @ts-expect-error accessing internal request handler
    const promptHandler = server._requestHandlers.get(ListPromptsRequestSchema.shape.method.value);
    expect(promptHandler).toBeDefined();
    const promptResponse = await promptHandler({ method: 'prompts/list' }, {});
    expect(promptResponse.prompts.length).toBeGreaterThan(0);
    expect(promptResponse.prompts[0].name).toBe('qap_start');
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
    expect(parsed._guidance_for_assistant).toBeDefined();
  });

  it('debe validar y mostrar estado con directivas UX en qap_status', async () => {
    const server = createMcpServer();
    // @ts-expect-error accessing internal request handler
    const handler = server._requestHandlers.get(CallToolRequestSchema.shape.method.value);

    // Antes de inicializar
    const statusBefore = await handler({ method: 'tools/call', params: { name: 'qap_status', arguments: {} } }, {});
    const parsedBefore = JSON.parse(statusBefore.content[0].text);
    expect(parsedBefore.initialized).toBe(false);
    expect(parsedBefore._guidance_for_assistant).toContain('NO expliques listas de pasos futuros');

    // Inicializar
    await handler({ method: 'tools/call', params: { name: 'qap_init', arguments: { projectName: 'status-demo' } } }, {});

    // Después de inicializar
    const statusAfter = await handler({ method: 'tools/call', params: { name: 'qap_status', arguments: {} } }, {});
    const parsedAfter = JSON.parse(statusAfter.content[0].text);
    expect(parsedAfter.initialized).toBe(true);
    expect(parsedAfter.projectName).toBe('status-demo');
    expect(parsedAfter._guidance_for_assistant).toContain('qap_discover');
  });

  it('debe descubrir modulos y generar planes con qap_discover y qap_plan', async () => {
    const server = createMcpServer();
    // @ts-expect-error accessing internal request handler
    const handler = server._requestHandlers.get(CallToolRequestSchema.shape.method.value);

    await handler({ method: 'tools/call', params: { name: 'qap_init', arguments: {} } }, {});

    // Descubrir módulo auth
    const discoverResult = await handler(
      {
        method: 'tools/call',
        params: {
          name: 'qap_discover',
          arguments: {
            name: 'auth',
            path: '/login',
            tags: ['critical', 'auth'],
          },
        },
      },
      {}
    );
    expect(discoverResult.isError).toBeFalsy();
    expect(existsSync(join(tempDir, '.qa', 'modules', 'auth.yaml'))).toBe(true);

    // Generar plan
    const planResult = await handler(
      {
        method: 'tools/call',
        params: {
          name: 'qap_plan',
          arguments: {
            module: 'auth',
          },
        },
      },
      {}
    );
    expect(planResult.isError).toBeFalsy();
    expect(existsSync(join(tempDir, '.qa', 'plans', 'auth.json'))).toBe(true);

    // Ejecutar prueba
    const testResult = await handler(
      {
        method: 'tools/call',
        params: {
          name: 'qap_test',
          arguments: {
            module: 'auth',
          },
        },
      },
      {}
    );
    expect(testResult.isError).toBeFalsy();
    const parsedTest = JSON.parse(testResult.content[0].text);
    expect(parsedTest.status).toBe('success');
    expect(parsedTest.result).toBe('passed');
  });

  it('debe registrar un perfil de autenticacion con qap_auth_add y listar con qap_auth_list', async () => {
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

    // Listar
    const listResult = await handler({ method: 'tools/call', params: { name: 'qap_auth_list', arguments: {} } }, {});
    const parsedList = JSON.parse(listResult.content[0].text);
    expect(parsedList.count).toBe(1);
    expect(parsedList.profiles[0].id).toBe('admin-user');
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
    expect(parsedReport.reports.html).toBeDefined();

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
