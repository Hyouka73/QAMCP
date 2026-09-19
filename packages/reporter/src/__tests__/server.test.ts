import { createServer } from 'node:http';

import { describe, it, expect, afterEach } from 'vitest';
import type { IStorage } from '@qap/engine';

import { startViewerServer, type ViewerServerInstance } from '../server/server.js';

describe('ViewerServer (S5-006)', () => {
  let serverInstance: ViewerServerInstance | null = null;
  let dummyServer: ReturnType<typeof createServer> | null = null;

  afterEach(async () => {
    if (serverInstance) {
      await serverInstance.close();
      serverInstance = null;
    }
    if (dummyServer) {
      await new Promise<void>((resolve) => dummyServer!.close(() => resolve()));
      dummyServer = null;
    }
  });

  const createMockStorage = (): IStorage => {
    return {
      getProjectRoot: () => '/mock/workspace/test',
      getProjectContext: async () => ({
        _version: '1',
        project_name: 'Test Project',
      }),
      listModules: async () => ['auth', 'simulation'],
      getModuleContext: async (m: string) => ({
        _version: '1',
        objective: `Module ${m}`,
        routes: [`/${m}`],
        manually_edited: false,
      }),
      getRepoMap: async () => null,
      listTestCases: async () => [],
      getModulePrereqs: async () => null,
      listFlows: async () => [],
      exists: async () => false,
      list: async () => [],
    } as unknown as IStorage;
  };

  it('debe responder HTTP 200 en / con la plantilla HTML', async () => {
    const storage = createMockStorage();
    serverInstance = await startViewerServer({
      storage,
      port: 9380,
      host: '127.0.0.1',
      silent: true,
    });

    expect(serverInstance.url).toBe('http://127.0.0.1:9380');

    const res = await fetch(`${serverInstance.url}/`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');

    const body = await res.text();
    expect(body).toContain('QAP v2.1');
    expect(body).toContain('Knowledge Graph');
  });

  it('debe responder HTTP 200 en /api/graph con el JSON del payload', async () => {
    const storage = createMockStorage();
    serverInstance = await startViewerServer({
      storage,
      port: 9382,
      host: '127.0.0.1',
      silent: true,
    });

    const res = await fetch(`${serverInstance.url}/api/graph`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');

    const json = (await res.json()) as {
      projectName: string;
      nodes: Array<{ id: string }>;
      edges: unknown[];
    };
    expect(json.projectName).toBe('Test Project');
    expect(json.nodes).toHaveLength(2);
    expect(json.nodes.map((n) => n.id)).toEqual(['auth', 'simulation']);
  });

  it('debe reintentar en el puerto siguiente si el puerto preferido esta ocupado (EADDRINUSE)', async () => {
    // 1. Ocupar el puerto 9384 con un servidor dummy
    dummyServer = createServer((_req, res) => {
      res.end('occupied');
    });
    await new Promise<void>((resolve) => {
      dummyServer!.listen(9384, '127.0.0.1', () => resolve());
    });

    // 2. Intentar levantar startViewerServer en el puerto 9384
    const storage = createMockStorage();
    serverInstance = await startViewerServer({
      storage,
      port: 9384,
      host: '127.0.0.1',
      silent: true,
    });

    // Debe haber hecho fallback al puerto 9385
    expect(serverInstance.port).toBe(9385);
    expect(serverInstance.url).toBe('http://127.0.0.1:9385');

    const res = await fetch(`${serverInstance.url}/api/graph`);
    expect(res.status).toBe(200);
  });
});
