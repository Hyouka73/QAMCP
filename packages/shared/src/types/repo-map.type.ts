/**
 * RepoMap Type Definition (S4-005)
 *
 * Mapeo de archivos fuente pertenecientes a un módulo.
 * Las rutas en files deben normalizarse con separadores POSIX (/).
 */

export interface RepoMap {
  _version: '1';
  module: string;
  files: string[];
}
