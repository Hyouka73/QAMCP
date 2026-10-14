import { FileSystemStorage } from '@qap/knowledge';
import { LockManager } from '@qap/engine';
import { DataError } from '../errors.js';

export interface UnlockCommandOptions {
  force?: boolean;
}

export async function handleUnlock(moduleName?: string, options: UnlockCommandOptions = {}): Promise<void> {
  if (!moduleName) {
    throw new DataError('Debe especificar un módulo para desbloquear (ej. "qap unlock <module> --force").');
  }

  if (!options.force) {
    throw new DataError(
      'qap unlock requiere la bandera --force para confirmar la liberación forzada de un lock (ej. "qap unlock <module> --force").'
    );
  }

  const storage = new FileSystemStorage({ rootDir: process.cwd() });
  const lockManager = new LockManager(storage);

  const wasLocked = await lockManager.isLocked(moduleName);

  await lockManager.forceUnlock(moduleName);

  if (wasLocked) {
    console.log(`✔ Lock del módulo '${moduleName}' liberado forzadamente.`);
  } else {
    console.log(`El módulo '${moduleName}' no tenía ningún lock activo. Nada que liberar.`);
  }

  process.exitCode = 0;
}