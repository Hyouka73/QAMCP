/**
 * Utilidad canónica para normalización de identificadores y slugs en QAP (C3).
 * Aplica transliteración de diacríticos mediante normalización NFD y eliminación
 * de marcas diacríticas (acentos, tildes), preservando caracteres alfanuméricos ASCII.
 *
 * Determinista, pura y agnóstica:
 * "Asignación de ejecutivo de campo por carga" -> "asignacion_de_ejecutivo_de_campo_por_carga"
 * "modulo_test" -> "modulo_test"
 * "admin" -> "admin"
 */
export function normalizeSlug(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '');
}
