/**
 * Patrones canónicos de rutas de acceso / autenticación (P4.4).
 * Exportados desde un único archivo canónico en @qap/shared.
 */

export const DEFAULT_AUTH_PATH_PATTERNS = [
  '/login',
  '/signin',
  '/sign-in',
  '/auth',
  '/acceso',
  '/ingresar',
  '/sso',
] as const;

export type AuthPathPattern = (typeof DEFAULT_AUTH_PATH_PATTERNS)[number];

/**
 * Normaliza una URL o ruta para propósitos de comparación determinista:
 * - Elimina query string y hash
 * - Elimina barra final (trailing slash) excepto si la ruta es '/'
 * - Convierte a minúsculas
 */
export function normalizePathname(rawPathOrUrl: string): string {
  if (!rawPathOrUrl) return '';
  const clean = rawPathOrUrl.split('?')[0].split('#')[0].trim().toLowerCase();
  if (clean.length > 1 && clean.endsWith('/')) {
    return clean.slice(0, -1);
  }
  return clean;
}

/**
 * Determina si una ruta o URL corresponde a un patrón de acceso / login.
 */
export function isAuthPath(
  pathOrUrl: string,
  patterns: readonly string[] = DEFAULT_AUTH_PATH_PATTERNS
): boolean {
  if (!pathOrUrl) return false;
  let pathname = pathOrUrl;
  try {
    if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
      pathname = new URL(pathOrUrl).pathname;
    }
  } catch {
    // Si no es URL absoluta válida, usa la ruta directamente
  }

  const normalized = normalizePathname(pathname);
  if (!normalized) return false;

  return patterns.some((pattern) => {
    const normPattern = normalizePathname(pattern);
    return normalized === normPattern || normalized.startsWith(`${normPattern}/`);
  });
}
