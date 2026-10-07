/**
 * Validaciones canónicas para nombres de rol de usuario (C9).
 * Rechaza nombres vacíos, texto compuesto exclusivamente por separadores de tabla Markdown
 * (| : - espacios) y cualquier nombre que inicie o termine con barra vertical (|).
 */

export const ROLE_TABLE_CHARS_PATTERN = /^[\s|:-]+$/;
export const ROLE_TABLE_EDGE_PATTERN = /(^\|)|(\|$)/;

export function isValidRoleName(name: unknown): boolean {
  if (typeof name !== 'string') return false;
  const trimmed = name.trim();
  if (trimmed.length === 0) return false;
  if (ROLE_TABLE_CHARS_PATTERN.test(trimmed)) return false;
  if (ROLE_TABLE_EDGE_PATTERN.test(trimmed)) return false;
  return true;
}

export function filterValidRoles(roles: unknown[]): string[] {
  if (!Array.isArray(roles)) return [];
  const result: string[] = [];
  for (const r of roles) {
    const rName = typeof r === 'string' ? r : (r && typeof r === 'object' ? (r as { name?: unknown; id?: unknown }).name ?? (r as { id?: unknown }).id : undefined);
    if (typeof rName === 'string' && isValidRoleName(rName)) {
      result.push(rName.trim());
    }
  }
  return result;
}
