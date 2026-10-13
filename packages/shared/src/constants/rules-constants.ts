/**
 * Constantes canónicas para la integridad y procedencia del conocimiento en QAP (P4.5-A).
 */

export const SUBSTANTIVE_RULE_MIN_WORDS = 3;
export const SUBSTANTIVE_RULE_MIN_CHARS = 20;
export const WAIVER_MIN_REASON_CHARS = 15;
export const ACCEPT_GAPS_MIN_REASON_CHARS = 15;
export const MIN_SUBSTANTIVE_COVERAGE_RATIO = 0.50; // 50%
export const MAX_SNIPPET_LENGTH = 120;

/**
 * Etiquetas de opciones predefinidas generadas por el motor.
 * Una descripción de regla que coincida con una de estas etiquetas no califica como sustantiva.
 */
export const ENGINE_OPTION_LABELS = [
  'Confirmar propósito y comportamiento esperado',
  'Definir propósito más adelante',
  'Validar esta acción y su flujo de negocio',
  'Dejar pendiente de validación',
  'No aplica validación adicional para esta acción',
  'Módulo accesible para los roles asignados',
  'Dejar definición de actores para después',
  'Disponible para todo público sin restricción de rol',
  'Aplicar validaciones adicionales de unicidad o formato',
  'Dejar validaciones de campos para después',
  'Las validaciones HTML del DOM son suficientes',
  'Requiere validación de mensajes de error de negocio',
  'Dejar manejo de errores para después',
  'No aplican validaciones de error específicas en esta vista',
  'Verificar persistencia e integridad de datos',
  'Dejar reglas de datos para después',
  'No se manejan datos adicionales en esta vista',
  'Confirmar manejo seguro y enmascaramiento de datos sensibles',
  'Revisar sensibilidad más adelante',
  'No se consideran datos sensibles en esta vista',
  'Confirmo todas',
  'Quiero corregir alguna',
  'Las dejo pendientes',
  'Mantener todas sin cambios',
  'Confirmo todo',
  'Quiero corregir algo',
  'Cerrar módulo formalmente',
  'Revisar reglas antes de cerrar',
  'Cerrar sesión y generar reporte de brechas',
  'Ampliar plan con otro módulo',
  'Iniciar sesión en ventana del navegador (handoff)',
  'Usar credenciales de prueba en llavero seguro',
  'No existe documento, definimos desde cero',
  'Sí existe (indicaré la ruta)',
  'No, definimos desde cero',
] as const;

/**
 * Normaliza un texto para comparaciones léxicas sin sensibilidad a mayúsculas o signos.
 */
export function normalizeRuleText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const NORMALIZED_ENGINE_LABELS = new Set(ENGINE_OPTION_LABELS.map(normalizeRuleText));

export function isEngineOptionLabel(text: string | undefined | null): boolean {
  if (!text || typeof text !== 'string') return false;
  return NORMALIZED_ENGINE_LABELS.has(normalizeRuleText(text));
}

/**
 * Determina si el texto de una regla es sustantivo:
 * - Al menos 3 palabras
 * - Al menos 20 caracteres
 * - Distinto (normalizado) de cualquier etiqueta de opción generada por el motor
 * - No vacío
 */
export function isSubstantiveRuleText(text: string | undefined | null): boolean {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (trimmed.length < SUBSTANTIVE_RULE_MIN_CHARS) return false;

  const words = trimmed.split(/\s+/).filter((w) => w.length > 0);
  if (words.length < SUBSTANTIVE_RULE_MIN_WORDS) return false;

  const norm = normalizeRuleText(trimmed);
  if (NORMALIZED_ENGINE_LABELS.has(norm)) return false;

  // Patrones tautológicos genéricos
  if (/^(confirmar|validar|definir)\s+(proposito|comportamiento|esta accion|reglas)(\s+y\s+comportamiento expected)?$/i.test(norm)) {
    return false;
  }

  return true;
}

/**
 * Determina si la etiqueta de una opción de pregunta es tautológica.
 * Una opción con etiqueta tautológica repite la categoría o el propósito en lugar de proponer una regla concreta.
 */
export function isTautologicalOptionLabel(etiqueta: string | undefined | null): boolean {
  if (!etiqueta || typeof etiqueta !== 'string') return false;
  const norm = normalizeRuleText(etiqueta);
  const tautologicalLabels = new Set([
    normalizeRuleText('Confirmar propósito y comportamiento esperado'),
    normalizeRuleText('Validar esta acción y su flujo de negocio'),
    normalizeRuleText('Módulo accesible para los roles asignados'),
    normalizeRuleText('Aplicar validaciones adicionales de unicidad o formato'),
    normalizeRuleText('Requiere validación de mensajes de error de negocio'),
    normalizeRuleText('Verificar persistencia e integridad de datos'),
    normalizeRuleText('Confirmar manejo seguro y enmascaramiento de datos sensibles'),
  ]);
  if (tautologicalLabels.has(norm)) return true;
  if (/^(confirmar|validar|definir)\s+(el\s+|la\s+|los\s+|las\s+)?(proposito|comportamiento|esta accion|accion y su flujo|roles asignados|validaciones adicionales|mensajes de error|persistencia e integridad|manejo seguro)(\s+|$)/i.test(norm)) {
    return true;
  }
  return false;
}

/**
 * Sanitiza fragmentos de texto provenientes de documentos o parsers antes de interpolarlos en preguntas.
 * - Quita barras de tabla (|), marcadores markdown (#, *, `, ~, etc.), marcadores diff (+, -, @@), caracteres de control.
 * - Trunca a un máximo de 120 caracteres.
 * - Descarta el resultado si queda vacío o si empieza por un marcador de tabla o diff.
 */
export function sanitizeSnippet(text: string | undefined | null): string | undefined {
  if (!text || typeof text !== 'string') return undefined;

  let cleaned = text
    .replace(/[\r\n\t]/g, ' ')
    .split('')
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      return code >= 32 && code !== 127;
    })
    .join('')
    .replace(/\|/g, ' ')                    // barras de tabla
    .replace(/```.*?```/gs, '')             // bloques de código
    .replace(/[`#*~_]/g, '')                // markdown residual
    .replace(/@@.*?@@/g, '')                // diff chunks
    .replace(/^[+-]\s*/gm, '')              // diff +/- al inicio de línea
    .replace(/\s+/g, ' ')
    .trim();

  // Descartar si empieza por marcadores de tabla o diff o si quedó vacío
  if (!cleaned || /^[|+-]|^(---|\+\+\+|@@)/.test(cleaned)) {
    return undefined;
  }

  if (cleaned.length > MAX_SNIPPET_LENGTH) {
    cleaned = cleaned.slice(0, MAX_SNIPPET_LENGTH).trim();
  }

  if (cleaned.length === 0 || /^[|+-]/.test(cleaned)) {
    return undefined;
  }

  return cleaned;
}
