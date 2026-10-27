import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { confirm } from '@inquirer/prompts';
import { FileSystemStorage, LockManager } from '@qap/knowledge';

import { DataError } from '../errors.js';
import { computeModuleSemanticHash } from '../lib/module-semantic-hash.js';

export interface RollbackCommandOptions {
  to?: string;
  yes?: boolean;
}

const MANIFEST_FILE = 'manifest.json';
const SEMANTIC_HASH_FILE = 'semantic-hash.json';

interface ResolvedSnapshot {
  moduleName: string;
  id: string;
  path: string;
  all: string[];
}

/** Calcula el hash SHA-256 de un archivo en disco. */
function calculateFileSha256(filePath: string): string {
  return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

/** Lista recursiva de archivos relativos en formato POSIX (excluyendo manifest.json). */
function listFilesRecursive(baseDir: string, currentDir: string = baseDir): string[] {
  const files: string[] = [];

  for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
    const fullPath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFilesRecursive(baseDir, fullPath));
    } else if (entry.isFile() && entry.name !== MANIFEST_FILE) {
      files.push(path.relative(baseDir, fullPath).split(path.sep).join('/'));
    }
  }

  return files;
}

/** Snapshots de una carpeta de respaldos, del más reciente al más antiguo. */
function listSnapshots(backupsDir: string): string[] {
  if (!fs.existsSync(backupsDir)) {
    return [];
  }
  return fs
    .readdirSync(backupsDir)
    .filter((name) => fs.statSync(path.join(backupsDir, name)).isDirectory())
    .sort()
    .reverse();
}

function resolveSnapshot(rootDir: string, targetName: string | undefined, to: string | undefined): ResolvedSnapshot {
  const backupsBaseDir = path.join(rootDir, '.qa', 'cache', 'backups');

  if (!targetName) {
    if (!to) {
      throw new DataError(
        'Debe especificar un módulo o un identificador de respaldo (ej. "qap rollback <module>" o "qap rollback --to <id>").'
      );
    }
    if (!fs.existsSync(backupsBaseDir)) {
      throw new DataError('No se encontraron directorios de respaldos en el proyecto.');
    }
    // --to sin módulo: se busca el identificador en todos los módulos.
    for (const moduleName of fs.readdirSync(backupsBaseDir)) {
      const all = listSnapshots(path.join(backupsBaseDir, moduleName));
      if (all.includes(to)) {
        return { moduleName, id: to, path: path.join(backupsBaseDir, moduleName, to), all };
      }
    }
    throw new DataError(`No se encontró el respaldo con el identificador "${to}".`);
  }

  const all = listSnapshots(path.join(backupsBaseDir, targetName));
  if (all.length === 0) {
    throw new DataError(`No se encontraron respaldos previos para el módulo "${targetName}".`);
  }

  const id = to ?? all[0];
  if (!all.includes(id)) {
    throw new DataError(`No se encontró el respaldo "${id}" para el módulo "${targetName}".`);
  }
  return { moduleName: targetName, id, path: path.join(backupsBaseDir, targetName, id), all };
}

function printSnapshots(snapshot: ResolvedSnapshot): void {
  console.log(`Respaldos de '${snapshot.moduleName}' (del más reciente al más antiguo):`);
  for (const id of snapshot.all) {
    console.log(`  - ${id}${id === snapshot.id ? '  (seleccionado)' : ''}`);
  }
}

/** Valida el SHA-256 de cada archivo del backup contra su manifest.json. */
function validateBackupIntegrity(backupPath: string): void {
  const manifestPath = path.join(backupPath, MANIFEST_FILE);
  if (!fs.existsSync(manifestPath)) {
    return; // Respaldo antiguo sin manifest: se restaura sin validar.
  }

  let manifest: { files?: Record<string, string> };
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as { files?: Record<string, string> };
  } catch {
    throw new DataError('Error de integridad: el archivo manifest.json del respaldo está corrupto o no es un JSON válido.');
  }

  if (!manifest.files || typeof manifest.files !== 'object') {
    return;
  }

  for (const [relativeFile, expectedHash] of Object.entries(manifest.files)) {
    const filePath = path.join(backupPath, ...relativeFile.split('/'));
    if (!fs.existsSync(filePath)) {
      throw new DataError(`Error de integridad: falta el archivo "${relativeFile}" registrado en el respaldo.`);
    }
    if (calculateFileSha256(filePath) !== expectedHash) {
      throw new DataError(
        `Error de integridad: el hash SHA-256 del archivo "${relativeFile}" no coincide con el registro del respaldo.`
      );
    }
  }
}

/**
 * Recalcula el hash del snapshot con SemanticHasher y lo compara con el
 * semantic-hash.json que 'qap update' guardó dentro del respaldo.
 */
function validateSemanticHash(backupPath: string): void {
  const hashPath = path.join(backupPath, SEMANTIC_HASH_FILE);
  if (!fs.existsSync(hashPath)) {
    return; // Respaldo sin hash semántico (creado antes de S75-016).
  }

  let stored: { hash?: unknown };
  try {
    stored = JSON.parse(fs.readFileSync(hashPath, 'utf-8')) as { hash?: unknown };
  } catch {
    throw new DataError('Error de integridad: el semantic-hash.json del respaldo está corrupto o no es un JSON válido.');
  }

  if (stored.hash !== computeModuleSemanticHash(backupPath).hash) {
    throw new DataError('Error de integridad: el hash semántico del respaldo no coincide con su contenido.');
  }
}

/**
 * Restauración en dos fases: primero copia todo a archivos temporales junto a
 * su destino y, solo si todas las copias salieron bien, los renombra encima.
 * Si algo falla en la fase 1, el módulo queda intacto.
 */
function restoreFiles(backupPath: string, targetDir: string): void {
  const relativeFiles = listFilesRecursive(backupPath).filter((file) => file !== SEMANTIC_HASH_FILE);
  const staged: Array<{ tempPath: string; destPath: string }> = [];

  try {
    for (const relativeFile of relativeFiles) {
      const srcPath = path.join(backupPath, ...relativeFile.split('/'));
      const destPath = path.join(targetDir, ...relativeFile.split('/'));
      const tempPath = `${destPath}.rollback-tmp`;

      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      staged.push({ tempPath, destPath });
      fs.copyFileSync(srcPath, tempPath);
    }
  } catch (error) {
    for (const { tempPath } of staged) {
      fs.rmSync(tempPath, { force: true });
    }
    throw error;
  }

  for (const { tempPath, destPath } of staged) {
    fs.renameSync(tempPath, destPath);
  }
}

export async function handleRollback(targetName?: string, options: RollbackCommandOptions = {}): Promise<void> {
  const rootDir = process.cwd();

  // 1. Resolver el módulo y el snapshot, y mostrar los disponibles
  const snapshot = resolveSnapshot(rootDir, targetName, options.to);
  printSnapshots(snapshot);

  // 2. Confirmación solo si no se pasa --yes y hay un terminal interactivo
  if (!options.yes && process.stdin.isTTY) {
    const proceed = await confirm({
      message: `¿Está seguro de realizar el rollback del módulo '${snapshot.moduleName}' utilizando el respaldo '${snapshot.id}'?`,
      default: false,
    });
    if (!proceed) {
      console.log('Rollback cancelado por el usuario.');
      return;
    }
  }

  // 3. Verificar integridad antes de restaurar
  validateBackupIntegrity(snapshot.path);
  validateSemanticHash(snapshot.path);

  // 4. Lock del módulo, restauración y liberación en finally
  const lockManager = new LockManager({ rootDir });
  const releaseLock = await lockManager.acquireModuleLock(snapshot.moduleName);
  try {
    const targetDir = path.join(rootDir, '.qa', 'modules', snapshot.moduleName);
    fs.mkdirSync(targetDir, { recursive: true });
    restoreFiles(snapshot.path, targetDir);

    // El hash del módulo restaurado se calcula igual que en 'qap update'.
    const storage = new FileSystemStorage({ rootDir });
    await storage.saveSemanticHash(snapshot.moduleName, computeModuleSemanticHash(targetDir));

    process.stdout.write(
      `✔ Rollback completado para el módulo "${snapshot.moduleName}" utilizando el respaldo ${snapshot.id}.\n`
    );
    process.exitCode = 0;
  } finally {
    await releaseLock();
  }
}