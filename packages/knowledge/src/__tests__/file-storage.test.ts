import { existsSync, mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { FileSystemStorage } from '../storage/file-storage.js';

describe('FileSystemStorage (S3-002)', () => {
  let tempDir: string;
  let storage: FileSystemStorage;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'qap-filestorage-test-'));
    storage = new FileSystemStorage({ rootDir: tempDir });
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('debe escribir y leer un archivo de texto correctamente', async () => {
    await storage.write('data/note.txt', 'hola mundo');
    const content = await storage.read('data/note.txt');
    expect(content).toBe('hola mundo');
  });

  it('debe escribir y leer JSON correctamente', async () => {
    await storage.writeJson('data/config.json', { name: 'qap', version: 1 });
    const parsed = await storage.readJson<{ name: string; version: number }>('data/config.json');
    expect(parsed).toEqual({ name: 'qap', version: 1 });
  });

  it('debe confirmar existencia de archivos y directorios', async () => {
    expect(await storage.exists('data/note.txt')).toBe(false);
    await storage.write('data/note.txt', 'x');
    expect(await storage.exists('data/note.txt')).toBe(true);
  });

  it('debe listar el contenido de un directorio', async () => {
    await storage.write('data/a.txt', '1');
    await storage.write('data/b.txt', '2');
    const files = await storage.list('data');
    expect(files.sort()).toEqual(['a.txt', 'b.txt']);
  });

  it('debe eliminar archivos', async () => {
    await storage.write('data/note.txt', 'x');
    await storage.delete('data/note.txt');
    expect(await storage.exists('data/note.txt')).toBe(false);
  });

  it('debe crear directorios con mkdir', async () => {
    await storage.mkdir('data/nested/dir');
    expect(existsSync(join(tempDir, 'data', 'nested', 'dir'))).toBe(true);
  });

  it('nunca debe dejar un archivo .tmp huerfano tras una escritura exitosa (atomic write)', async () => {
    await storage.write('data/note.txt', 'contenido final');

    const files = await storage.list('data');
    const tmpFiles = files.filter((f) => f.endsWith('.tmp'));

    expect(tmpFiles).toHaveLength(0);
    expect(readFileSync(join(tempDir, 'data', 'note.txt'), 'utf-8')).toBe('contenido final');
  });

  it('debe crear el directorio de locks bajo .qa/cache/locks al escribir', async () => {
    await storage.write('data/note.txt', 'x');
    expect(existsSync(join(tempDir, '.qa', 'cache', 'locks'))).toBe(true);
  });

  it('debe serializar escrituras concurrentes al mismo archivo sin corromper el contenido (control de concurrencia)', async () => {
    const writes = Array.from({ length: 10 }, (_, i) =>
      storage.write('data/shared.txt', `valor-${i}`)
    );

    await Promise.all(writes);

    const finalContent = await storage.read('data/shared.txt');
    expect(finalContent).toMatch(/^valor-\d$/);
  });

  describe('Configuracion global del proyecto', () => {
    it('debe reportar isInitialized false si no existe .qa/', async () => {
      expect(await storage.isInitialized()).toBe(false);
    });

    it('debe reportar isInitialized true tras crear .qa/', async () => {
      await storage.mkdir('.qa');
      expect(await storage.isInitialized()).toBe(true);
    });

    it('debe guardar y leer environments.yaml', async () => {
      const envs = { version: '1.0', environments: { local: { baseUrl: 'http://localhost:3000' } } };
      await storage.saveEnvironments(envs as never);
      const result = await storage.getEnvironments();
      expect(result).toEqual(envs);
    });

    it('debe guardar y leer context.yaml del proyecto', async () => {
      const ctx = { _version: '1', project_name: 'Test Project' };
      await storage.saveProjectContext(ctx);
      const result = await storage.getProjectContext();
      expect(result).toEqual(ctx);
    });

    it('debe devolver null si system-prompt.yaml no existe', async () => {
      expect(await storage.getSystemPrompt()).toBeNull();
    });
  });

  describe('Dominio de modulos', () => {
    it('debe listar modulos existentes', async () => {
      await storage.mkdir('.qa/modules/checkout');
      await storage.mkdir('.qa/modules/login');
      const modules = await storage.listModules();
      expect(modules.sort()).toEqual(['checkout', 'login']);
    });

    it('debe confirmar si un modulo existe con hasModule', async () => {
      expect(await storage.hasModule('checkout')).toBe(false);
      await storage.mkdir('.qa/modules/checkout');
      expect(await storage.hasModule('checkout')).toBe(true);
    });

    it('debe guardar y leer context.yaml de un modulo', async () => {
      const ctx = { _version: '1', objective: 'probar checkout', manually_edited: false };
      await storage.saveModuleContext('checkout', ctx);
      const result = await storage.getModuleContext('checkout');
      expect(result).toEqual(ctx);
    });

    it('debe devolver null si rules.yaml de un modulo no existe', async () => {
      expect(await storage.getModuleRules('checkout')).toBeNull();
    });

    it('debe guardar y leer selectors.json de un modulo', async () => {
      const selectors = { _version: '1', selectors: {} };
      await storage.saveModuleSelectors('checkout', selectors);
      const result = await storage.getModuleSelectors('checkout');
      expect(result).toEqual(selectors);
    });

    it('debe devolver null si semantic-hash.json de un modulo no existe', async () => {
      expect(await storage.getSemanticHash('checkout')).toBeNull();
    });
  });

  describe('Planes y casos de prueba', () => {
    it('debe listar solo archivos TC-*.yaml como test cases', async () => {
      await storage.write('.qa/modules/checkout/tests/TC-001.yaml', 'id: TC-001');
      await storage.write('.qa/modules/checkout/tests/TC-002.yaml', 'id: TC-002');
      await storage.write('.qa/modules/checkout/tests/plan.yaml', 'version: 1');

      const cases = await storage.listTestCases('checkout');
      expect(cases.sort()).toEqual(['TC-001', 'TC-002']);
    });

    it('debe guardar un test case usando su id como nombre de archivo', async () => {
      const testCase = { _version: '1', id: 'TC-001', name: 'Login exitoso', steps: [] };
      await storage.saveTestCase('checkout', testCase);
      const result = await storage.getTestCase('checkout', 'TC-001');
      expect(result).toEqual(testCase);
    });
  });

  describe('Resultados de ejecucion e historial', () => {
    it('debe guardar y leer un resultado de ejecucion', async () => {
      const result = {
        _version: '1',
        execution_id: 'exec-001',
        module: 'checkout',
        status: 'success' as const,
        timestamps: { started_at: new Date().toISOString() },
      };
      await storage.saveExecutionResult('exec-001', result);
      const restored = await storage.getExecutionResult('exec-001');
      expect(restored).toEqual(result);
    });

    it('debe devolver null si el resultado de ejecucion no existe', async () => {
      expect(await storage.getExecutionResult('no-existe')).toBeNull();
    });

    it('debe anexar entradas al historial en formato JSONL', async () => {
      await storage.appendHistory('checkout', { event: 'run', status: 'success' });
      await storage.appendHistory('checkout', { event: 'run', status: 'failure' });

      const content = await storage.read('.qa/cache/history/checkout.jsonl');
      const lines = content.trim().split('\n');
      expect(lines).toHaveLength(2);
      expect(JSON.parse(lines[0])).toEqual({ event: 'run', status: 'success' });
    });
  });

  describe('Flows multi-modulo', () => {
    it('debe listar flows existentes', async () => {
      await storage.write('.qa/flows/checkout-flow.yaml', 'name: checkout-flow');
      const flows = await storage.listFlows();
      expect(flows).toEqual(['checkout-flow']);
    });

    it('debe guardar y leer un flow', async () => {
      const flow = { _version: '1', name: 'checkout-flow', modules: ['checkout'] };
      await storage.saveFlow('checkout-flow', flow as never);
      const result = await storage.getFlow('checkout-flow');
      expect(result).toEqual(flow);
    });
  });

  describe('Diagnostico y estado del proyecto', () => {
    it('debe reportar estado no inicializado si no existe .qa/', async () => {
      const status = await storage.getStatus();
      expect(status.initialized).toBe(false);
      expect(status.modules_discovered).toBe(0);
      expect(status.environment_configured).toBe(false);
    });

    it('debe reportar modulos descubiertos y ambiente configurado tras inicializar', async () => {
      await storage.mkdir('.qa/modules/checkout');
      await storage.saveEnvironments({ version: '1.0', environments: {} } as never);

      const status = await storage.getStatus();
      expect(status.initialized).toBe(true);
      expect(status.modules_discovered).toBe(1);
      expect(status.environment_configured).toBe(true);
    });
  });
});