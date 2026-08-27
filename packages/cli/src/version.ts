/**
 * Resuelve la versión del CLI leyendo `package.json` en tiempo de ejecución,
 * para no duplicar el número de versión en el código fuente.
 *
 * Se usa `createRequire` (en vez de un import attribute JSON) para mantener
 * compatibilidad con el rango de Node soportado por el proyecto (>=18).
 */

import { createRequire } from 'node:module';

interface PackageJson {
  version: string;
}

const require = createRequire(import.meta.url);
const pkg = require('../package.json') as PackageJson;

export const CLI_VERSION: string = pkg.version;