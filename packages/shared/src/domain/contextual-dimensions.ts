/**
 * QAMCP vNext — Dimensiones Contextuales de Conocimiento (D-013, D-007, D-003)
 * 
 * Permite asociar cualquier entidad de conocimiento con:
 * - Aplicaciones y subsistemas
 * - Entornos y políticas de ejecución
 * - Roles y permisos (RBAC)
 * - Prerrequisitos (estados previos, dependencias)
 * - Sesiones y perfiles de autenticación (sin almacenar contraseñas en memoria de conocimiento)
 * - Políticas de limpieza de navegador (aislamiento sin borrado de memoria QAP)
 * - Evidencias multimodales (capturas con PII enmascarada, trazas de red, DOM)
 */

/** Tipo de evidencia multimodal */
export type EvidenceKind =
  | 'screenshot'
  | 'network_har'
  | 'dom_snippet'
  | 'console_log';

/** Referencia a evidencia multimodal vinculada a observaciones o pruebas */
export interface MultimodalEvidenceRef {
  id: string;
  kind: EvidenceKind;
  storage_path?: string;
  uri?: string;
  pii_masked: boolean;
  captured_at: string;
  session_id?: string;
  metadata?: Record<string, unknown>;
}

/** Contexto e identidad de la aplicación bajo prueba */
export interface ApplicationContext {
  application_id: string;
  name: string;
  base_url: string;
  subsystems?: string[];
  created_at: string;
  metadata?: Record<string, unknown>;
}

/** Política de entorno y restricciones de seguridad (D-003) */
export interface EnvironmentPolicy {
  environment_id: string;
  application_id: string;
  name: 'dev' | 'staging' | 'prod' | string;
  base_url: string;
  is_production: boolean;
  destructive_actions_allowed: boolean;
  safe_domains: string[];
  rate_limit_ms?: number;
  headers?: Record<string, string>;
}

/** Alcance de Roles y Permisos (RBAC) */
export interface RolePermissionScope {
  role_id: string;
  application_id: string;
  role_name: string;
  permissions: string[];
  is_authenticated: boolean;
  auth_profile_id?: string; // Puntero al perfil en la bóveda de credenciales (NUNCA contraseña en texto plano)
  description?: string;
}

/** Tipo de prerrequisito para un flujo o caso de prueba */
export type PrerequisiteKind =
  | 'auth_session'      // Sesión autenticada con rol específico
  | 'data_fixture'     // Datos preexistentes requeridos en la app
  | 'navigation_state' // Debe encontrarse en una ruta o modal específico
  | 'preceding_flow';  // Requiere la ejecución previa exitosa de otro flujo (DAG)

/** Definición formal de prerrequisito */
export interface PrerequisiteDefinition {
  id: string;
  title: string;
  kind: PrerequisiteKind;
  required_role_id?: string;
  depends_on_flow_id?: string;
  state_assertions?: Record<string, unknown>;
  teardown_required?: boolean;
}

/** Modo de limpieza del navegador para aislamiento de pruebas (D-007) */
export type BrowserCleanupMode =
  | 'clear_cache_only'   // Borra solo caché HTTP/imágenes; mantiene cookies/localStorage
  | 'fresh_context'      // Nuevo BrowserContext completamente aislado (incognito)
  | 'retain_session'     // Reutiliza la sesión activa sin purgar almacenamiento
  | 'isolated_storage';  // StorageState temporal efímero

/** Política de Limpieza del Navegador */
export interface BrowserCleanupPolicy {
  cleanup_mode: BrowserCleanupMode;
  clear_cookies: boolean;
  clear_local_storage: boolean;
  clear_session_storage: boolean;
  clear_browser_cache: boolean;
  isolate_network: boolean;
  /**
   * Invariante Crítica (D-007):
   * La memoria de conocimiento de QAP reside fuera del navegador (SQLite/PostgreSQL).
   * La limpieza de caché o almacenamiento web NUNCA debe borrar la memoria de QAP.
   */
  preserve_qap_knowledge: true;
}
