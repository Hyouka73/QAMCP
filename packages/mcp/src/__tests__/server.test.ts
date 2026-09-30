import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMcpServer } from '../server.js';
import { ListToolsRequestSchema, CallToolRequestSchema, ListPromptsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

vi.mock('playwright-core', () => ({
  chromium: {
    launch: vi.fn().mockImplementation(async (opts?: { headless?: boolean }) => ({
      newPage: vi.fn().mockResolvedValue({
        goto: vi.fn().mockResolvedValue(null),
        title: vi.fn().mockResolvedValue('Mocked Page Title'),
      }),
      close: vi.fn().mockResolvedValue(undefined),
    })),
  },
}));

vi.mock('@qap/playwright-adapter', () => ({
  PlaywrightAdapter: class {
    constructor(public options: any = {}) {}
    async discover(spec: { name: string; path: string; tags?: string[] }) {
      const isLogin = spec.path === '/login';
      return {
        name: spec.name,
        path: spec.path,
        description: `Módulo ${spec.name}`,
        tags: spec.tags ?? [],
        cases: [],
        context: {
          discovered_routes: [spec.path, `${spec.path}/sub`],
          forms: [{ id: `${spec.name}-form`, fields: ['user', 'pass'] }],
          buttons: [{ key: 'enviar', text: 'Enviar', selector: 'button:has-text("Enviar")' }],
          links: [
            { key: 'tablero', text: 'Tablero', href: '/operaciones/tablero', selector: 'a:has-text("Tablero")' },
          ],
          is_auth_view: isLogin && !this.options.credentials,
          session_saved: isLogin && Boolean(this.options.credentials),
          storage_state_used: Boolean(this.options.sessionPath),
        },
      };
    }
  },
}));

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

  it('debe descubrir modulos y responder en desarrollo para qap_plan y qap_test', async () => {
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
            headed: true,
          },
        },
      },
      {}
    );
    expect(discoverResult.isError).toBeFalsy();
    const parsedDiscover = JSON.parse(discoverResult.content[0].text);
    expect(parsedDiscover.status).toBe('success');
    expect(parsedDiscover.playwright_status).toBe('explorando');
    expect(parsedDiscover.pregunta).toBeDefined();
    expect(parsedDiscover.pregunta_doc).toBeDefined();

    // Validar estructura granular en disco
    expect(existsSync(join(tempDir, '.qa', 'modules', 'auth', 'summary.json'))).toBe(true);
    expect(existsSync(join(tempDir, '.qa', 'modules', 'auth', 'views', 'default', 'context.yaml'))).toBe(true);
    expect(existsSync(join(tempDir, '.qa', 'modules', 'auth', 'views', 'default', 'selectors.json'))).toBe(true);
    expect(existsSync(join(tempDir, '.qa', 'modules', 'index.json'))).toBe(true);

    // Generar/consultar plan (en_desarrollo Sprint 6)
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
    const parsedPlan = JSON.parse(planResult.content[0].text);
    expect(parsedPlan.estado).toBe('en_desarrollo');
    expect(parsedPlan.sprint_disponible).toBe(6);

    // Ejecutar prueba (en_desarrollo Sprint 7)
    const testResult = await handler(
      {
        method: 'tools/call',
        params: {
          name: 'qap_test',
          arguments: {
            module: 'auth',
            headed: true,
          },
        },
      },
      {}
    );
    expect(testResult.isError).toBeFalsy();
    const parsedTest = JSON.parse(testResult.content[0].text);
    expect(parsedTest.estado).toBe('en_desarrollo');
    expect(parsedTest.sprint_disponible).toBe(7);
    expect(parsedTest.nota).toContain('PROHIBIDO asumir resultado PASSED');
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
    expect(parsed.directorio_objetivo).toBe(tempDir);
    expect(existsSync(join(tempDir, '.qa', 'project', 'auth', 'profiles.json'))).toBe(true);

    // Listar
    const listResult = await handler({ method: 'tools/call', params: { name: 'qap_auth_list', arguments: {} } }, {});
    const parsedList = JSON.parse(listResult.content[0].text);
    expect(parsedList.count).toBe(1);
    expect(parsedList.profiles[0].id).toBe('admin-user');
    expect(parsedList.directorio_objetivo).toBe(tempDir);
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
    expect(parsedReport.directorio_objetivo).toBe(tempDir);
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
    const parsedClean = JSON.parse(cleanResult.content[0].text);
    expect(parsedClean.directorio_objetivo).toBe(tempDir);
    expect(existsSync(join(tempDir, '.qa'))).toBe(false);
  });

  it('debe operar sobre targetPath independiente de cwd y validar qap_server', async () => {
    const customTargetDir = mkdtempSync(join(tmpdir(), 'qap-custom-target-'));
    try {
      const server = createMcpServer();
      // @ts-expect-error accessing internal request handler
      const handler = server._requestHandlers.get(CallToolRequestSchema.shape.method.value);

      // 1. qap_server debe fallar si .qa/ no existe en targetPath
      const serverFail = await handler(
        {
          method: 'tools/call',
          params: {
            name: 'qap_server',
            arguments: { targetPath: customTargetDir },
          },
        },
        {}
      );
      expect(serverFail.isError).toBe(true);
      const parsedServerFail = JSON.parse(serverFail.content[0].text);
      expect(parsedServerFail.directorio_objetivo).toBe(customTargetDir);
      expect(parsedServerFail.error).toContain('No existe la carpeta de base de conocimiento .qa/');

      // 2. Inicializar en targetPath
      const initResult = await handler(
        {
          method: 'tools/call',
          params: {
            name: 'qap_init',
            arguments: { targetPath: customTargetDir, projectName: 'custom-proj' },
          },
        },
        {}
      );
      const parsedInit = JSON.parse(initResult.content[0].text);
      expect(parsedInit.directorio_objetivo).toBe(customTargetDir);
      expect(existsSync(join(customTargetDir, '.qa', 'project', 'context.yaml'))).toBe(true);

      // 3. Status en targetPath
      const statusResult = await handler(
        {
          method: 'tools/call',
          params: {
            name: 'qap_status',
            arguments: { targetPath: customTargetDir },
          },
        },
        {}
      );
      const parsedStatus = JSON.parse(statusResult.content[0].text);
      expect(parsedStatus.initialized).toBe(true);
      expect(parsedStatus.directorio_objetivo).toBe(customTargetDir);
      expect(parsedStatus.projectName).toBe('custom-proj');

      // 4. qap_server con targetPath válido
      const serverResult = await handler(
        {
          method: 'tools/call',
          params: {
            name: 'qap_server',
            arguments: { targetPath: customTargetDir, port: 9555 },
          },
        },
        {}
      );
      const parsedServer = JSON.parse(serverResult.content[0].text);
      expect(parsedServer.directorio_objetivo).toBe(customTargetDir);
      expect(parsedServer.base_conocimiento).toBe(join(customTargetDir, '.qa'));
      expect(parsedServer.url).toBeDefined();
    } finally {
      rmSync(customTargetDir, { recursive: true, force: true });
    }
  });
});
