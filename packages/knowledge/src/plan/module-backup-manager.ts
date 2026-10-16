import { existsSync, mkdirSync, copyFileSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';

function sha256Of(filePath: string): string {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

/**
 * Respalda el contenido actual de .qa/modules/<moduleName>/ antes de que
 * 'qap update' lo sobrescriba, para que 'qap rollback' tenga algo real
 * que restaurar (S7-008), incluyendo el plan de pruebas del módulo y un
 * manifest.json con el hash SHA-256 de cada archivo respaldado, para que
 * la validación de integridad de 'qap rollback --to <id>' (S75-016)
 * tenga algo real que verificar.
 *
 * Preserva la estructura de subcarpetas original (ej. tests/plan.json),
 * para que 'qap rollback' pueda restaurar cada archivo en su ubicación
 * real dentro de .qa/modules/<moduleName>/.
 */
export class ModuleBackupManager {
  /**
   * Copia los archivos existentes de un módulo a
   * .qa/cache/backups/<moduleName>/<timestamp>/, preservando su ruta
   * relativa original, y genera manifest.json con el hash SHA-256 de
   * cada archivo copiado.
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

    const relativeFilesToBackup = [
      'context.yaml',
      'repo-map.json',
      'selectors.json',
      join('tests', 'plan.json'),
    ].filter((f) => existsSync(join(moduleDir, f)));

    if (relativeFilesToBackup.length === 0) {
      return null;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = join(rootDir, '.qa', 'cache', 'backups', moduleName, timestamp);
    mkdirSync(backupDir, { recursive: true });

    const manifestFiles: Record<string, string> = {};

    for (const relativeFile of relativeFilesToBackup) {
      const srcPath = join(moduleDir, relativeFile);
      const destPath = join(backupDir, relativeFile);

      mkdirSync(dirname(destPath), { recursive: true });
      copyFileSync(srcPath, destPath);

      // Clave del manifiesto en formato POSIX, consistente entre plataformas.
      const manifestKey = relativeFile.split('\\').join('/');
      manifestFiles[manifestKey] = sha256Of(destPath);
    }

    writeFileSync(join(backupDir, 'manifest.json'), JSON.stringify({ files: manifestFiles }, null, 2));

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