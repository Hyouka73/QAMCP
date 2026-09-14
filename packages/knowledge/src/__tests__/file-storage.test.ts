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
    // Disparamos 10 escrituras concurrentes al MISMO archivo.
    // Gracias al locking, deben serializarse: el archivo final debe
    // contener exactamente uno de los valores escritos, nunca datos mezclados/corruptos.
    const writes = Array.from({ length: 10 }, (_, i) =>
      storage.write('data/shared.txt', `valor-${i}`)
    );

    await Promise.all(writes);

    const finalContent = await storage.read('data/shared.txt');
    expect(finalContent).toMatch(/^valor-\d$/);
  });
});