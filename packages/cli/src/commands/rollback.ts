import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

import { DataError } from '../errors.js';

export interface RollbackCommandOptions {
  to?: string;
}

function calculateFileSha256(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

/** Lista todos los archivos dentro de un directorio, recursivamente, como rutas relativas POSIX. */
function listFilesRecursive(baseDir: string, currentDir: string = baseDir): string[] {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFilesRecursive(baseDir, fullPath));
    } else if (entry.isFile() && entry.name !== 'manifest.json') {
      const relative = path.relative(baseDir, fullPath).split(path.sep).join('/');
      files.push(relative);
    }
  }

  return files;
}

/**
 * Valida la integridad SHA-256 de un backup contra su manifest.json.
 * Si no existe manifest.json, el backup se considera uno "legacy" (creado
 * antes de S75-016) y se restaura sin validar, para no romper backups
 * previos; cualquier backup nuevo sí lo genera (ver ModuleBackupManager).
 */
function validateBackupIntegrity(backupPath: string): void {
  const manifestPath = path.join(backupPath, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    return;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as { files?: Record<string, string> };
  if (!manifest.files || typeof manifest.files !== 'object') {
    return;
  }

  for (const [relativeFile, expectedHash] of Object.entries(manifest.files)) {
    const filePath = path.join(backupPath, ...relativeFile.split('/'));
    if (!fs.existsSync(filePath)) {
      throw new DataError(`Error de integridad: falta el archivo "${relativeFile}" registrado en el respaldo.`);
    }
    const actualHash = calculateFileSha256(filePath);
    if (actualHash !== expectedHash) {
      throw new DataError(
        `Error de integridad: el hash SHA-256 del archivo "${relativeFile}" no coincide con el registro del respaldo.`
      );
    }
  }
}

/** Copia todos los archivos de un backup al directorio destino, recreando subcarpetas. */
function restoreFiles(backupPath: string, targetDir: string): void {
  const relativeFiles = listFilesRecursive(backupPath);

  for (const relativeFile of relativeFiles) {
    const srcPath = path.join(backupPath, ...relativeFile.split('/'));
    const destPath = path.join(targetDir, ...relativeFile.split('/'));

    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.copyFileSync(srcPath, destPath);
  }
}

export async function handleRollback(moduleNameOrId?: string, options?: RollbackCommandOptions): Promise<void> {
  await Promise.resolve();
  const rootDir = process.cwd();

  // Flujo con --to <id>: busca el backup por su identificador exacto en cualquier módulo.
  if (options?.to) {
    const backupId = options.to;
    const backupsBaseDir = path.join(rootDir, '.qa', 'cache', 'backups');

    if (!fs.existsSync(backupsBaseDir)) {
      throw new DataError('No se encontraron directorios de respaldos en el proyecto.');
    }

    let foundBackupPath: string | null = null;
    let targetModule: string | null = null;

    const modules = fs.readdirSync(backupsBaseDir);
    for (const mod of modules) {
      const modBackupsDir = path.join(backupsBaseDir, mod);
      if (fs.statSync(modBackupsDir).isDirectory()) {
        const backups = fs.readdirSync(modBackupsDir);
        if (backups.includes(backupId)) {
          foundBackupPath = path.join(modBackupsDir, backupId);
          targetModule = mod;
          break;
        }
      }
    }

    if (!foundBackupPath || !targetModule) {
      throw new DataError(`No se encontró el respaldo con el identificador "${backupId}".`);
    }

    validateBackupIntegrity(foundBackupPath);

    const targetDir = path.join(rootDir, '.qa', 'modules', targetModule);
    fs.mkdirSync(targetDir, { recursive: true });
    restoreFiles(foundBackupPath, targetDir);

    process.stdout.write(`✔ Rollback completado para el módulo "${targetModule}" utilizando el respaldo "${backupId}".\n`);
    process.exitCode = 0;
    return;
  }

  // Flujo con solo el nombre del módulo: restaura el backup más reciente.
  if (!moduleNameOrId) {
    throw new DataError('Debe especificar un módulo o un identificador de respaldo (ej. "qap rollback <module>" o "qap rollback --to <id>").');
  }

  const moduleName = moduleNameOrId;
  const backupsDir = path.join(rootDir, '.qa', 'cache', 'backups', moduleName);
  if (!fs.existsSync(backupsDir)) {
    throw new DataError(`No se encontraron respaldos previos para el módulo "${moduleName}".`);
  }

  const backups = fs.readdirSync(backupsDir).sort().reverse();
  if (backups.length === 0) {
    throw new DataError(`El directorio de respaldos para "${moduleName}" está vacío.`);
  }

  const latestBackup = backups[0];
  const backupPath = path.join(backupsDir, latestBackup);

  validateBackupIntegrity(backupPath);

  const targetDir = path.join(rootDir, '.qa', 'modules', moduleName);
  fs.mkdirSync(targetDir, { recursive: true });
  restoreFiles(backupPath, targetDir);

  process.stdout.write(`✔ Rollback completado para el módulo "${moduleName}" utilizando el respaldo ${latestBackup}.\n`);
  process.exitCode = 0;
}