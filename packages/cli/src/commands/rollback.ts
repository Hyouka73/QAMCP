import fs from 'node:fs';
import path from 'node:path';

import { DataError } from '../errors.js';

export async function handleRollback(moduleName?: string): Promise<void> {
  await Promise.resolve();
  const rootDir = process.cwd();

  if (!moduleName) {
    throw new DataError('Debe especificar un módulo para realizar rollback (ej. "qap rollback <module>").');
  }

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
  const targetDir = path.join(rootDir, '.qa', 'modules', moduleName);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const files = fs.readdirSync(backupPath);
  for (const file of files) {
    fs.copyFileSync(path.join(backupPath, file), path.join(targetDir, file));
  }

  process.stdout.write(`✔ Rollback completado para el módulo "${moduleName}" utilizando el respaldo ${latestBackup}.\n`);
  process.exitCode = 0;
}