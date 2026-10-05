import { existsSync, rmSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { confirm } from '@inquirer/prompts';

export interface CleanOptions {
  yes?: boolean;
  force?: boolean;
}

/**
 * Elimina de forma segura todo el árbol .qa/ del proyecto actual y limpia locks remanentes.
 */
export async function handleClean(options: CleanOptions = {}): Promise<void> {
  const rootDir = process.cwd();
  const qaDir = resolve(rootDir, '.qa');

  // Si no existe .qa/, informar y terminar
  if (!existsSync(qaDir)) {
    console.log('✔ Directorio .qa/ no existe. El proyecto ya está limpio.');
    return;
  }

  // Verificación de seguridad de ruta para prevenir eliminaciones accidentales
  if (!qaDir.endsWith('.qa')) {
    throw new Error(`Ruta inválida para limpieza: ${qaDir}`);
  }

  // Confirmación interactiva si no se proporciona -y/--yes ni -f/--force
  const isForce = Boolean(options.force || options.yes);
  if (!isForce) {
    if (process.stdin.isTTY) {
      const shouldProceed = await confirm({
        message: '¿Está seguro de que desea eliminar todo el directorio .qa/ y sus datos?',
        default: false,
      });

      if (!shouldProceed) {
        console.log('Operación de limpieza cancelada por el usuario.');
        return;
      }
    } else {
      console.warn('Advertencia: Ejecución en modo no-TTY sin flag -y/--force. Use --force para omitir confirmación.');
    }
  }

  // 1. Limpieza de locks remanentes en .qa/cache/locks/ si existen
  const locksDir = join(qaDir, 'cache', 'locks');
  if (existsSync(locksDir)) {
    try {
      const lockFiles = readdirSync(locksDir);
      for (const file of lockFiles) {
        rmSync(join(locksDir, file), { force: true });
      }
    } catch {
      // Ignorar errores al vaciar locks individualmente si luego se eliminará todo el directorio
    }
  }

  // 2. Eliminación segura de todo el árbol .qa/
  rmSync(qaDir, { recursive: true, force: true });

  console.log('✔ Directorio .qa/ eliminado. Proyecto listo para inicialización limpia.');
}
