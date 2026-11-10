import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createMcpServer } from '../server.js';
import { WorkspaceBootstrap } from '../workspace-bootstrap.js';
import {
  type IWorkspaceAuthorizer,
  type WorkspaceAuthorizationRequest,
  type WorkspaceAuthorizationResult,
  validateCandidateWorkspace,
  atomicRecordAuthorizedRoot,
} from '../workspace-authorizer.js';

const tempDirs: string[] = [];
const cleanupFns: Array<() => Promise<void>> = [];

function makeTemp(prefix = 'qap-auth-test-'): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

async function createTestHarness(options: {
  initialRoots?: string[];
  authorizer?: IWorkspaceAuthorizer;
  hostDir?: string;
  hostRegistryPath?: string;
}) {
  const hostDir = options.hostDir ?? makeTemp('qap-host-');
  const bootstrap = new WorkspaceBootstrap(hostDir);
  const registryPath = options.hostRegistryPath ?? join(hostDir, 'authorized-roots.json');

  const server = createMcpServer({
    projectRoots: options.initialRoots ?? [],
    workspaceBootstrap: bootstrap,
    clientWorkspaceRoots: false,
    workspaceAuthorizer: options.authorizer,
    hostRegistryPath: registryPath,
  });

  const client = new Client({ name: 'interactive-auth-test-client', version: '1.0.0' }, {});
  const [transportA, transportB] = InMemoryTransport.createLinkedPair();

  await server.connect(transportB);
  await client.connect(transportA);

  let isClosed = false;
  const close = async () => {
    if (!isClosed) {
      isClosed = true;
      await client.close();
      await server.close();
      bootstrap.close();
    }
  };
  cleanupFns.push(close);

  const call = async (name = 'qap_status', args: Record<string, unknown> = {}) => {
    const res = await client.callTool({ name, arguments: args });
    const content = res.content as Array<{ type: string; text: string }>;
    return {
      isError: Boolean(res.isError),
      data: JSON.parse(content[0].text),
    };
  };

  return { call, close, hostDir, registryPath };
}

afterEach(async () => {
  for (const fn of cleanupFns.splice(0)) await fn();
  for (const dir of tempDirs.splice(0)) {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors on test directories
    }
  }
});

describe('Interactive Workspace Authorization & Continuity', () => {
  it('Prueba de aprobación: un workspace vacío no autorizado es aprobado por el operador e inicializado en la misma llamada', async () => {
    const workspace = makeTemp('empty-ws-');
    const mockAuthorizer: IWorkspaceAuthorizer = {
      requestAuthorization: vi.fn(async (req: WorkspaceAuthorizationRequest): Promise<WorkspaceAuthorizationResult> => {
        return { decision: 'approved', root: req.canonicalPath };
      }),
    };

    const harness = await createTestHarness({ authorizer: mockAuthorizer });
    const res = await harness.call('qap_status', { targetPath: workspace });

    expect(mockAuthorizer.requestAuthorization).toHaveBeenCalledTimes(1);
    expect(res.isError).toBe(false);
    expect(res.data.status).not.toBe('blocked');
    expect(res.data.initialized).toBe(true);
    expect(res.data.knowledge.state).toBe('prepared');
    expect(res.data.siguiente_accion.pregunta.texto).toContain('¿Dónde está el sistema que quieres probar?');
    expect(existsSync(join(workspace, '.qa', 'project', 'context.yaml'))).toBe(true);

    // Verificación de persistencia en authorized-roots.json
    expect(existsSync(harness.registryPath)).toBe(true);
    const registryContent = JSON.parse(readFileSync(harness.registryPath, 'utf8'));
    expect(registryContent).toContain(workspace);
  });

  it('Prueba de rechazo: si el operador local rechaza, se bloquea con workspace_authorization_rejected y cero escrituras', async () => {
    const workspace = makeTemp('rejected-ws-');
    const mockAuthorizer: IWorkspaceAuthorizer = {
      requestAuthorization: vi.fn(async (req: WorkspaceAuthorizationRequest): Promise<WorkspaceAuthorizationResult> => {
        return { decision: 'rejected', root: req.canonicalPath, reason: 'Operator rejected' };
      }),
    };

    const harness = await createTestHarness({ authorizer: mockAuthorizer });
    const res = await harness.call('qap_status', { targetPath: workspace });

    expect(mockAuthorizer.requestAuthorization).toHaveBeenCalledTimes(1);
    expect(res.data.status).toBe('blocked');
    expect(res.data.category).toBe('human_authorization');
    expect(res.data.code).toBe('workspace_authorization_rejected');
    expect(existsSync(join(workspace, '.qa'))).toBe(false);

    // Registro no debe contener el workspace rechazado
    if (existsSync(harness.registryPath)) {
      const registryContent = JSON.parse(readFileSync(harness.registryPath, 'utf8'));
      expect(registryContent).not.toContain(workspace);
    }
  });

  it('Prueba de cancelación/timeout: devuelve workspace_authorization_required con comando de desbloqueo', async () => {
    const workspace = makeTemp('cancelled-ws-');
    const mockAuthorizer: IWorkspaceAuthorizer = {
      requestAuthorization: vi.fn(async (): Promise<WorkspaceAuthorizationResult> => {
        return { decision: 'cancelled', reason: 'Dialog closed without decision' };
      }),
    };

    const harness = await createTestHarness({ authorizer: mockAuthorizer });
    const res = await harness.call('qap_status', { targetPath: workspace });

    expect(mockAuthorizer.requestAuthorization).toHaveBeenCalledTimes(1);
    expect(res.data.status).toBe('blocked');
    expect(res.data.category).toBe('human_authorization');
    expect(res.data.code).toBe('workspace_authorization_required');
    expect(res.data.desbloquear_con.mecanismo).toBe('local_host');
    expect(existsSync(join(workspace, '.qa'))).toBe(false);
  });

  it('Prueba de continuidad sin reinicio del MCP: llamadas subsecuentes no vuelven a pedir autorización', async () => {
    const workspace = makeTemp('continuity-ws-');
    const mockAuthorizer: IWorkspaceAuthorizer = {
      requestAuthorization: vi.fn(async (req: WorkspaceAuthorizationRequest): Promise<WorkspaceAuthorizationResult> => {
        return { decision: 'approved', root: req.canonicalPath };
      }),
    };

    const harness = await createTestHarness({ authorizer: mockAuthorizer });

    // Llamada 1: autorización interactiva + scaffolding
    const res1 = await harness.call('qap_status', { targetPath: workspace });
    expect(res1.data.initialized).toBe(true);
    expect(mockAuthorizer.requestAuthorization).toHaveBeenCalledTimes(1);

    // Llamada 2: qap_context_set en el mismo proceso MCP en ejecución
    const res2 = await harness.call('qap_context_set', {
      targetPath: workspace,
      base_url: 'https://example.invalid',
      source: 'user',
    });
    expect(res2.isError).toBe(false);
    expect(mockAuthorizer.requestAuthorization).toHaveBeenCalledTimes(1); // NO vuelve a pedir autorización

    // Llamada 3: qap_status subsecuente
    const res3 = await harness.call('qap_status', { targetPath: workspace });
    expect(res3.data.knowledge.state).toBe('available');
    expect(mockAuthorizer.requestAuthorization).toHaveBeenCalledTimes(1); // Sigue sin pedir autorización
  });

  it('Prueba de continuidad ante autorización externa por script: el proceso en ejecución detecta la nueva raíz sin reinicio', async () => {
    const workspace = makeTemp('external-script-ws-');
    // Sin authorizer interactivo (emula entorno donde se usa el script)
    const harness = await createTestHarness({});

    // Llamada 1: no autorizada
    const res1 = await harness.call('qap_status', { targetPath: workspace });
    expect(res1.data.code).toBe('workspace_authorization_required');

    // Simular que el operador ejecuta el script localmente y escribe en el registro
    atomicRecordAuthorizedRoot(harness.registryPath, workspace);

    // Llamada 2: en el mismo proceso MCP (sin reiniciar), debe detectar la nueva raíz de disco
    const res2 = await harness.call('qap_status', { targetPath: workspace });
    expect(res2.data.initialized).toBe(true);
    expect(res2.data.knowledge.state).toBe('prepared');
  });

  it('Prueba de dos proyectos independientes: aislamiento estricto de autorización, Knowledge y estado', async () => {
    const projA = makeTemp('project-a-');
    const projB = makeTemp('project-b-');

    const authorized = new Set<string>();
    const mockAuthorizer: IWorkspaceAuthorizer = {
      requestAuthorization: vi.fn(async (req: WorkspaceAuthorizationRequest): Promise<WorkspaceAuthorizationResult> => {
        authorized.add(req.canonicalPath);
        return { decision: 'approved', root: req.canonicalPath };
      }),
    };

    const harness = await createTestHarness({ authorizer: mockAuthorizer });

    // 1. Autorizar proyecto A
    const resA1 = await harness.call('qap_status', { targetPath: projA });
    expect(resA1.data.initialized).toBe(true);
    await harness.call('qap_context_set', { targetPath: projA, base_url: 'https://app-a.invalid', source: 'user' });

    // 2. Proyecto B se autoriza de forma independiente
    const resB1 = await harness.call('qap_status', { targetPath: projB });
    expect(resB1.data.initialized).toBe(true);
    await harness.call('qap_context_set', { targetPath: projB, base_url: 'https://app-b.invalid', source: 'user' });

    // 3. Verificar estado independiente en cada proyecto
    const statusA = (await harness.call('qap_status', { targetPath: projA })).data;
    const statusB = (await harness.call('qap_status', { targetPath: projB })).data;

    expect(statusA.knowledge.application_id).not.toBe(statusB.knowledge.application_id);
    expect(readdirSync(harness.hostDir).filter(p => p !== 'authorized-roots.json')).toHaveLength(2);
  });

  describe('Pruebas negativas de seguridad y validación canónica', () => {
    it('Rechaza symlink hacia un workspace sin llamar al autorizador', async () => {
      const realDir = makeTemp('real-dir-');
      const linkDir = join(makeTemp('link-parent-'), 'symlink-target');
      try {
        symlinkSync(realDir, linkDir, 'junction');
      } catch {
        // En caso de que se requieran privilegios para symlinks en Windows, saltar suavemente
        return;
      }

      const mockAuthorizer: IWorkspaceAuthorizer = {
        requestAuthorization: vi.fn(),
      };

      const harness = await createTestHarness({ authorizer: mockAuthorizer });
      const res = await harness.call('qap_status', { targetPath: linkDir });

      expect(mockAuthorizer.requestAuthorization).not.toHaveBeenCalled();
      expect(res.data.status).toBe('blocked');
      expect(res.data.code).toBe('workspace_authorization_required');
    });

    it('Rechaza ruta inexistente sin llamar al autorizador', async () => {
      const nonexistent = join(makeTemp('empty-'), 'does-not-exist');
      const mockAuthorizer: IWorkspaceAuthorizer = { requestAuthorization: vi.fn() };

      const harness = await createTestHarness({ authorizer: mockAuthorizer });
      const res = await harness.call('qap_status', { targetPath: nonexistent });

      expect(mockAuthorizer.requestAuthorization).not.toHaveBeenCalled();
      expect(res.data.status).toBe('blocked');
    });

    it('Rechaza un archivo regular como workspace', async () => {
      const file = join(makeTemp('file-ws-'), 'regular.txt');
      writeFileSync(file, 'hello');
      const mockAuthorizer: IWorkspaceAuthorizer = { requestAuthorization: vi.fn() };

      const harness = await createTestHarness({ authorizer: mockAuthorizer });
      const res = await harness.call('qap_status', { targetPath: file });

      expect(mockAuthorizer.requestAuthorization).not.toHaveBeenCalled();
      expect(res.data.status).toBe('blocked');
    });

    it('Rechaza solapamiento con el directorio host de Knowledge', async () => {
      const hostDir = makeTemp('host-storage-');
      const subFolder = join(hostDir, 'sub-workspace');
      const mockAuthorizer: IWorkspaceAuthorizer = { requestAuthorization: vi.fn() };

      const harness = await createTestHarness({ authorizer: mockAuthorizer, hostDir });
      const res = await harness.call('qap_status', { targetPath: subFolder });

      expect(mockAuthorizer.requestAuthorization).not.toHaveBeenCalled();
      expect(res.data.status).toBe('blocked');
    });

    it('Parámetros falsificados en argumentos MCP (authorized: true, admin: true) no conceden autorización', async () => {
      const workspace = makeTemp('forged-args-');
      // Sin authorizer
      const harness = await createTestHarness({});

      const res = await harness.call('qap_status', {
        targetPath: workspace,
        authorized: true,
        admin: true,
        user_confirmed: true,
      });

      expect(res.data.status).toBe('blocked');
      expect(res.data.code).toBe('workspace_authorization_required');
      expect(existsSync(join(workspace, '.qa'))).toBe(false);
    });

    it('validateCandidateWorkspace rechaza rutas no canónicas y raíces de sistema', () => {
      expect(() => validateCandidateWorkspace('')).toThrow();
      expect(() => validateCandidateWorkspace('relative/path')).toThrow();
      if (process.platform === 'win32') {
        expect(() => validateCandidateWorkspace('C:\\')).toThrow();
        if (process.env.SystemRoot) {
          expect(() => validateCandidateWorkspace(process.env.SystemRoot)).toThrow();
        }
      }
    });
  });
});
