/**
 * Tipos TypeScript para Rules — P3 extension.
 *
 * POLÍTICA DE EVOLUCIÓN: todos los campos nuevos son opcionales para mantener
 * retrocompatibilidad con rules.yaml legacy (_version "1").
 */

/** Categorías semánticas de una regla de negocio */
export type RuleCategory =
  | 'proposito'
  | 'actor'
  | 'campo'
  | 'accion'
  | 'error'
  | 'dato'
  | 'sensibilidad';

/** Estado de confirmación de una regla */
export type RuleStatus = 'inferred' | 'confirmed' | 'rejected' | 'deferred';

/** Procedencia de una regla */
export type RuleSource = 'dom' | 'prd' | 'user';

/**
 * Schema for rules.yaml of a module - defines validation or business rules
 * with manual edit tracking.
 */
export interface Rules {
  /**
   * Schema version for evolution tracking
   */
  _version: string;
  /**
   * Indicates if this rules file has been manually edited by a human
   */
  manually_edited: boolean;
  /**
   * List of rules defined for this module
   */
  rules?: RuleEntry[];
  /**
   * Categorías que el usuario declara "no aplica" para esta vista.
   * Solo source user, reason obligatorio.
   */
  category_waivers?: CategoryWaiver[];
}

/** Una regla de negocio individual */
export interface RuleEntry {
  /** Identificador único. Formato libre para legacy; determinista para DOM-inferred. */
  id: string;
  /** Descripción legible de la regla */
  description: string;
  /** Expresión de condición (opcional) */
  condition?: string;
  /** Acción a tomar cuando la regla se dispara (opcional) */
  action?: string;
  /** Severidad de la regla */
  severity?: 'low' | 'medium' | 'high' | 'critical';
  /** Etiquetas asociadas */
  tags?: string[];
  /** Vista o pantalla a la que aplica (ej: 'default') */
  view?: string;
  /** Categoría semántica */
  category?: RuleCategory;
  /** Estado de confirmación */
  status?: RuleStatus;
  /** Procedencia de la regla */
  source?: RuleSource;
  /** Campo o selector al que aplica (si aplica) */
  field?: string;
  /** Evidencia corta (selector o referencia, truncada a 120 chars) */
  evidence?: string;
}

/** Declaración de waiver de categoría por el usuario */
export interface CategoryWaiver {
  /** Vista a la que aplica el waiver */
  view: string;
  /** Categoría declarada como no aplicable */
  category: RuleCategory;
  /** Razón obligatoria (no puede estar vacía) */
  reason: string;
}

/** Alias de retrocompatibilidad */
export type Rule = RuleEntry;
