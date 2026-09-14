import { randomBytes } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  renameSync,
} from 'node:fs';
import {
  readFile,
  access,
  readdir,
  rm,
  mkdir as mkdirAsync,
} from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

import type { IStorage } from '@qap/engine';
import lockfile from 'proper-lockfile';

const LOCKS_DIR = '.qa/cache/locks';

export interface FileSystemStorageOptions {
  /** Directorio raiz del proyecto (donde vive .qa/). Por defecto, process.cwd(). */
  rootDir?: string;
}

/**
 * Adaptador de almacenamiento en disco para el arbol .qa/.
 * Implementa IStorage con:
 * - Atomic writes: escribe a un archivo temporal y hace rename atomico.
 * - Locking con proper-lockfile bajo .qa/cache/locks/, para evitar
 *   condiciones de carrera entre procesos concurrentes escribiendo el
 *   mismo archivo.
 */
export class FileSystemStorage implements IStorage {
  private rootDir: string;

  constructor(options: FileSystemStorageOptions = {}) {
    this.rootDir = options.rootDir ?? process.cwd();
  }

  private resolvePath(path: string): string {
    return resolve(this.rootDir, path);
  }

  private getLockDir(): string {
    const lockDir = join(this.rootDir, LOCKS_DIR);
    if (!existsSync(lockDir)) {
      mkdirSync(lockDir, { recursive: true });
    }
    return lockDir;
  }

  /**
   * Ejecuta una operacion bajo un lock exclusivo asociado al archivo destino,
   * usando proper-lockfile con retries para tolerar concurrencia real.
   */
  private async withLock<T>(targetPath: string, fn: () => Promise<T>): Promise<T> {
    this.getLockDir();

    // proper-lockfile necesita que el archivo objetivo exista para bloquearlo.
    // Si aun no existe (primera escritura), creamos un placeholder vacio.
    if (!existsSync(targetPath)) {
      mkdirSync(dirname(targetPath), { recursive: true });
      writeFileSync(targetPath, '', 'utf-8');
    }

    const release = await lockfile.lock(targetPath, {
      retries: { retries: 10, minTimeout: 50, maxTimeout: 500 },
      stale: 10000,
      lockfilePath: join(this.getLockDir(), `${Buffer.from(targetPath).toString('hex')}.lock`),
    });

    try {
      return await fn();
    } finally {
      await release();
    }
  }

  async read(path: string): Promise<string> {
    const fullPath = this.resolvePath(path);
    return await readFile(fullPath, 'utf-8');
  }

  async write(path: string, content: string): Promise<void> {
    const fullPath = this.resolvePath(path);
    mkdirSync(dirname(fullPath), { recursive: true });

    await this.withLock(fullPath, () => {
      // Atomic write: escribir a un archivo temporal en el mismo directorio
      // (para garantizar que rename sea atomico dentro del mismo filesystem)
      // y luego renombrar sobre el destino final.
      const tempPath = `${fullPath}.${randomBytes(6).toString('hex')}.tmp`;
      writeFileSync(tempPath, content, 'utf-8');
      renameSync(tempPath, fullPath);
      return Promise.resolve();
    });
  }

  async exists(path: string): Promise<boolean> {
    try {
      await access(this.resolvePath(path));
      return true;
    } catch {
      return false;
    }
  }

  async list(path: string): Promise<string[]> {
    const fullPath = this.resolvePath(path);
    try {
      return await readdir(fullPath);
    } catch {
      return [];
    }
  }

  async delete(path: string): Promise<void> {
    const fullPath = this.resolvePath(path);
    await rm(fullPath, { recursive: true, force: true });
  }

  async mkdir(path: string): Promise<void> {
    const fullPath = this.resolvePath(path);
    await mkdirAsync(fullPath, { recursive: true });
  }

  async readJson<T>(path: string): Promise<T> {
    const content = await this.read(path);
    return JSON.parse(content) as T;
  }

  async writeJson<T>(path: string, data: T): Promise<void> {
    await this.write(path, JSON.stringify(data, null, 2));
  }
}