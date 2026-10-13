import { existsSync, mkdirSync, copyFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Respalda el contenido actual de .qa/modules/<moduleName>/ antes de que
 * 'qap update' lo sobrescriba, para que 'qap rollback' tenga algo real
 * que restaurar (S7-008).
 *
 * Usa fs directo (no IStorage) a propósito: 'rollback.ts' ya lee este
 * mismo formato de carpeta con fs directo, así que mantenemos ambos lados
 * consistentes entre sí en vez de mezclar abstracciones.
 */
export class ModuleBackupManager {
  /**
   * Copia los archivos existentes de un módulo a
   * .qa/cache/backups/<moduleName>/<timestamp>/, en forma plana (sin
   * subcarpetas), que es el formato que 'qap rollback' espera leer.
   *
   * Devuelve la ruta del backup creado, o null si el módulo no tenía
   * ningún archivo existente que respaldar (nada que perder, nada que
   * respaldar).
   */
  public static backupModule(rootDir: string, moduleName: string): string | null {
    const moduleDir = join(rootDir, '.qa', 'modules', moduleName);
    if (!existsSync(moduleDir)) {
      return null;
    }

    const filesToBackup = ['context.yaml', 'repo-map.json', 'selectors.json'].filter((f) =>
      existsSync(join(moduleDir, f))
    );

    if (filesToBackup.length === 0) {
      return null;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = join(rootDir, '.qa', 'cache', 'backups', moduleName, timestamp);
    mkdirSync(backupDir, { recursive: true });

    for (const file of filesToBackup) {
      copyFileSync(join(moduleDir, file), join(backupDir, file));
    }

    return backupDir;
  }

  /** Lista los backups disponibles para un módulo, más reciente primero. */
  public static listBackups(rootDir: string, moduleName: string): string[] {
    const backupsDir = join(rootDir, '.qa', 'cache', 'backups', moduleName);
    if (!existsSync(backupsDir)) {
      return [];
    }
    return readdirSync(backupsDir).sort().reverse();
  }
}