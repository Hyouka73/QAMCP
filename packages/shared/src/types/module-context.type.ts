/**
 * Tipo unificado para context.yaml de un módulo — schema v2.
 *
 * Combina los campos del engine (objective, users, risks, manually_edited)
 * con los campos del grafo de conocimiento (views, surfaces, base_route)
 * y los metadatos de navegación del grafo (tags, critical_path, owner,
 * health_status, related_modules).
 */

/** Tipos de superficie UI dentro de una vista */
export type SurfaceKind = 'tab' | 'modal' | 'drawer' | 'section';

/** Estado de salud operacional del módulo */
export type ModuleHealthStatus = 'healthy' | 'degraded' | 'unknown';

/** Una superficie UI anidada dentro de una vista (tab, modal, drawer, section) */
export interface ModuleSurface {
  /** Identificador único dentro de la vista */
  id: string;
  /** Nombre legible para humanos */
  name?: string;
  /** Categoría de superficie */
  type: SurfaceKind;
}

/** Una vista UI expuesta por el módulo */
export interface ModuleView {
  /** Identificador único dentro del módulo */
  id: string;
  /** Nombre legible para humanos */
  name?: string;
  /** Ruta URL de esta vista (ej: '/auth/login') */
  path?: string;
  /** Superficies anidadas dentro de la vista */
  surfaces?: ModuleSurface[];
}

/**
 * Contexto completo de un módulo QAP — schema v2 unificado.
 * Refleja el contenido de `.qa/modules/<name>/context.yaml`.
 */
export interface ModuleContext {
  /** Versión del schema. '2' para archivos conformes al schema v2 unificado. */
  _version: string;

  /** Identificador del módulo. Debe coincidir con el directorio en .qa/modules/. */
  module: string;

  // ─── Campos de descripción ───────────────────────────────────────────────

  /** Descripción corta legible para humanos. Etiqueta principal en el grafo. */
  description?: string;

  /** Objetivo de negocio primario del módulo. Más detallado que description. */
  objective?: string;

  // ─── Campos de estructura UI ─────────────────────────────────────────────

  /** Ruta URL raíz del módulo (ej: '/auth'). Punto de entrada en el grafo. */
  base_route?: string;

  /** Jerarquía de vistas UI expuestas por el módulo. */
  views?: ModuleView[];

  // ─── Campos del engine ───────────────────────────────────────────────────

  /** Tipos de usuario o roles involucrados (ej: 'anonymous', 'admin'). */
  users?: string[];

  /** Lista plana de rutas cubiertas por este módulo. */
  routes?: string[];

  /** Riesgos de QA identificados para este módulo. */
  risks?: string[];

  /** Notas adicionales de implementación para ingenieros de QA. */
  notes?: string;

  /**
   * Selectores CSS que apuntan a datos sensibles (contraseñas, PII, RFC, etc.).
   * Serán enmascarados durante la ejecución de tests.
   */
  sensitive_selectors?: string[];

  /** true si este archivo ha sido revisado o editado manualmente por un humano. */
  manually_edited?: boolean;

  /** Referencia al PRD (ruta de archivo, URL o ID de ticket). */
  prd_source?: string;

  // ─── Metadatos de navegación del grafo ───────────────────────────────────

  /**
   * Etiquetas semánticas para agrupar módulos en el grafo de conocimiento.
   * Ej: ['security', 'payments', 'onboarding'].
   * El visor aplica clusters visuales basados en estas etiquetas.
   */
  tags?: string[];

  /**
   * Si es true, este módulo forma parte del journey principal de usuario.
   * El visor resaltará visualmente estos nodos.
   */
  critical_path?: boolean;

  /** Equipo o persona responsable de este módulo (ej: 'auth-squad'). */
  owner?: string;

  /**
   * Estado de salud operacional del módulo.
   * - 'healthy': tests pasando
   * - 'degraded': algunos fallos recientes
   * - 'unknown': sin ejecuciones recientes
   * Determina el color del nodo en el grafo.
   */
  health_status?: ModuleHealthStatus;

  /**
   * Relaciones explícitas con otros módulos no capturadas por prereqs.yaml o flows.
   * Se convierten en aristas 'related' en el grafo de conocimiento.
   */
  related_modules?: string[];
}
