/**
 * QAP Interview Engine — E3 (P3)
 *
 * Módulo 100 % puro (sin I/O): genera hipótesis deterministas desde DOM,
 * calcula categorías aplicables, cobertura y el siguiente lote de preguntas.
 *
 * Ubicado en @qap/engine por depender de los tipos de @qap/shared
 * (RuleEntry, RuleCategory, etc.) que forman parte del dominio de motor,
 * y por NO requerir dependencias de I/O (Playwright, fs, etc.).
 */

import type {
  RuleEntry,
  RuleCategory,
  RuleStatus,
  CategoryWaiver,
} from '@qap/shared';

import type { Pregunta, Opcion } from './pregunta.js';

// ---------------------------------------------------------------------------
// Constantes configurables (E3.1 — heurística de sensibilidad)
// ---------------------------------------------------------------------------

/**
 * Patrones de heurística de sensibilidad en nombres/etiquetas/autocomplete.
 * Lista ampliable sin cambiar la lógica de negocio.
 */
export const SENSITIVE_PATTERNS: RegExp[] = [
  /password|contrase[ñn]a|clave/i,
  /email|correo/i,
  /tel[eé]fono|phone|mobile|celular/i,
  /tarjeta|card|credit|debit/i,
  /cvv|cvc|ccv/i,
  /token|secret|pin/i,
  /clabe/i,
  /\brfc\b/i,
  /\bcurp\b/i,
  /\biban\b/i,
  /\bssn\b|social.?security/i,
  /tax.?id|n[uú]mero.?fiscal/i,
  /cuenta.?bancaria|bank.?account/i,
];

// ---------------------------------------------------------------------------
// Tipos internos del motor
// ---------------------------------------------------------------------------

/** Campo normalizado proveniente del DOM (E2) */
export interface DomField {
  /** Nombre lógico (name, id, o derivado de label) */
  key: string;
  /** tipo HTML: text, password, email, tel, number, date, etc. */
  type: string;
  /** Nombre del atributo name */
  name?: string;
  /** id del elemento */
  id?: string;
  /** Etiqueta sanitizada (label / aria-label / placeholder) */
  label?: string;
  /** Valor del atributo autocomplete */
  autocomplete?: string;
  /** Si el campo es requerido en el DOM */
  required?: boolean;
  /** Longitud mínima */
  minlength?: number;
  /** Longitud máxima */
  maxlength?: number;
  /** Patrón de validación HTML */
  pattern?: string;
  /** Mínimo numérico */
  min?: string;
  /** Máximo numérico */
  max?: string;
  /** Si el campo es hidden */
  hidden?: boolean;
  /** Si el campo es disabled */
  disabled?: boolean;
  /** ID del formulario al que pertenece */
  formId?: string;
  /** Selector del botón de envío del formulario */
  submitSelector?: string;
}

/** Formulario normalizado proveniente del DOM */
export interface DomForm {
  id: string;
  selector: string;
  fields: DomField[];
  /** Selector del botón de envío */
  submitSelector?: string;
}

/** Contexto de descubrimiento de la vista para el generador */
export interface ViewDiscoveryContext {
  /** Nombre del módulo */
  module: string;
  /** Nombre de la vista */
  view: string;
  /** Ruta URL del módulo o vista (ej: '/auth/login') */
  route?: string;
  /** Formularios descubiertos */
  forms?: DomForm[];
  /** Campos independientes (fuera de formulario) */
  standaloneFields?: DomField[];
  /** Botones descubiertos */
  buttons?: Array<{ key: string; text: string; selector: string }>;
  /** Si se usó storage_state para la sesión */
  storage_state_used?: boolean;
  /** Si la vista es de autenticación */
  is_auth_view?: boolean;
}

/** Pregunta generada para la entrevista */
export interface InterviewQuestion extends Pregunta {
  tipo: 'confirmar_hipotesis' | 'abierta';
  categoria: RuleCategory;
  /** Solo para tipo "confirmar_hipotesis": ids + enunciados de hipótesis */
  hipotesis_ids?: Array<{ id: string; texto: string }>;
}

// ---------------------------------------------------------------------------
// Intención de botones para acción (E0d)
// ---------------------------------------------------------------------------

export type ActionIntent = 'auth' | 'destructive' | 'save' | 'search' | 'generic';

export interface ActionIntentPattern {
  intent: ActionIntent;
  pattern: RegExp;
}

export const ACTION_INTENT_PATTERNS: ActionIntentPattern[] = [
  {
    intent: 'auth',
    pattern: /\b(iniciar\s*sesi[oó]n|login|sign\s*in|entrar|acceder|ingresar)\b/i,
  },
  {
    intent: 'destructive',
    pattern: /\b(eliminar|borrar|delete|remove|destruir|baja)\b/i,
  },
  {
    intent: 'save',
    pattern: /\b(guardar|crear|enviar|save|create|submit|registrar|actualizar)\b/i,
  },
  {
    intent: 'search',
    pattern: /\b(buscar|search|filtrar|filter|consultar)\b/i,
  },
];

export const ACTION_TEMPLATES: Record<ActionIntent, (buttonText: string, targetLabel?: string) => string> = {
  auth: (buttonText: string, targetLabel?: string) =>
    `El botón "${buttonText}" gestiona autenticación en el módulo ${targetLabel || 'actual'}. ¿Qué comportamiento debe tener ante credenciales incorrectas, bloqueo de cuenta por intentos fallidos, duración de sesión y redirección según rol?`,

  destructive: (buttonText: string, targetLabel?: string) =>
    `El botón "${buttonText}" ejecuta una acción destructiva en el módulo ${targetLabel || 'actual'}. ¿Se requiere diálogo de confirmación previa, la operación es reversible o soft-delete, y qué permisos o roles se exigen?`,

  save: (buttonText: string, targetLabel?: string) =>
    `El botón "${buttonText}" guarda o envía información en el módulo ${targetLabel || 'actual'}. ¿Qué validaciones de negocio se aplican antes de persistir, qué efectos secundarios existen y cómo se previene el envío de duplicados?`,

  search: (buttonText: string, targetLabel?: string) =>
    `El botón "${buttonText}" realiza búsquedas o filtrado en el módulo ${targetLabel || 'actual'}. ¿Cuáles son los criterios de coincidencia, límites de paginación y comportamiento ante resultados vacíos?`,

  generic: (buttonText: string, targetLabel?: string) =>
    `El botón "${buttonText}" aparenta cambiar estado en el módulo ${targetLabel || 'actual'}. ¿Qué efectos secundarios tiene esta acción (creación, modificación, eliminación, envío externo)? ¿Tiene precondiciones?`,
};

export function detectActionIntent(buttonText: string): ActionIntent {
  const clean = sanitizeDomString(buttonText).toLowerCase();
  for (const { intent, pattern } of ACTION_INTENT_PATTERNS) {
    if (pattern.test(clean)) {
      return intent;
    }
  }
  return 'generic';
}

export function getActionButtonQuestion(buttonText: string, targetLabel?: string): string {
  const intent = detectActionIntent(buttonText);
  return ACTION_TEMPLATES[intent](sanitizeDomString(buttonText) || 'Acción', targetLabel);
}

// ---------------------------------------------------------------------------
// Plantillas de preguntas (E0d — enunciados contextuales sin ids internos)
// ---------------------------------------------------------------------------

/**
 * Plantillas de preguntas en español parametrizadas por módulo y ruta.
 * NUNCA usan el id interno de vista ("default") ni ids de formulario ("form-1").
 */
export const QUESTION_TEMPLATES = {
  proposito: (targetLabel: string) =>
    `¿Cuál es el propósito de negocio del módulo ${targetLabel}? Describe qué acción realiza el usuario y qué resultado espera.`,

  actor: (targetLabel: string) =>
    `¿Qué roles o usuarios tienen acceso al módulo ${targetLabel}? ¿Hay restricciones de permisos?`,

  confirmar_hipotesis: (count: number) =>
    `El DOM sugiere ${count} regla(s). Por favor confirma si son correctas o corrige por id:`,

  error_form: (targetLabel: string) =>
    `Para los formularios del módulo ${targetLabel}: ¿Qué mensajes de error debe mostrar el sistema cuando la validación falla? ¿Hay reglas de unicidad, rangos de negocio u otras restricciones no visibles en el DOM?`,

  accion: (buttonText: string, targetLabel?: string) =>
    getActionButtonQuestion(buttonText, targetLabel),

  dato: (targetLabel: string) =>
    `¿Qué datos ingresados en el módulo ${targetLabel} son persistidos o enviados a sistemas externos? ¿Hay datos calculados o derivados?`,

  sensibilidad: (fields: string[]) =>
    `Se detectaron campos posiblemente sensibles: ${fields.join(', ')}. ¿Cómo deben tratarse estos datos? (cifrado, enmascarado, retención, auditoría)`,
} as const;

// ---------------------------------------------------------------------------
// Política de Waivers (E1 — función pura)
// ---------------------------------------------------------------------------

export interface WaiverValidationResult {
  valid: boolean;
  error?: string;
}

export type WaiverInput = Partial<CategoryWaiver> & { source?: string };

export function validateCategoryWaiver(waiver: WaiverInput): WaiverValidationResult {
  if (!waiver.category) {
    return { valid: false, error: "Waiver inválido: 'category' es requerida." };
  }
  if (waiver.category === 'proposito') {
    return {
      valid: false,
      error: "La categoría 'proposito' no se puede renunciar mediante waiver.",
    };
  }
  const VALID_CATEGORIES = new Set(['actor', 'campo', 'accion', 'error', 'dato', 'sensibilidad']);
  if (!VALID_CATEGORIES.has(waiver.category)) {
    return { valid: false, error: `Categoría inválida para waiver: '${waiver.category}'.` };
  }
  const source = waiver.source ?? 'user';
  if (source !== 'user') {
    return { valid: false, error: "Todo waiver exige source 'user'." };
  }
  const reason = (waiver.reason ?? '').trim();
  if (reason.length < 15) {
    return {
      valid: false,
      error: `El reason del waiver para categoría '${waiver.category}' debe tener al menos 15 caracteres tras trim (actual: ${reason.length}).`,
    };
  }
  return { valid: true };
}

export function validateWaiversBatch(waivers: WaiverInput[]): WaiverValidationResult {
  for (const w of waivers) {
    const res = validateCategoryWaiver(w);
    if (!res.valid) {
      return res;
    }
  }
  return { valid: true };
}

// ---------------------------------------------------------------------------
// E3.1 — Heurística de sensibilidad
// ---------------------------------------------------------------------------

/**
 * Determina si un campo es potencialmente sensible según su tipo, nombre,
 * etiqueta o autocomplete. Puro y determinista.
 */
export function isFieldSensitive(field: DomField): boolean {
  if (field.type === 'password') return true;

  const rawText = [
    field.name ?? '',
    field.id ?? '',
    field.label ?? '',
    field.autocomplete ?? '',
    field.key,
    field.type ?? '',
  ]
    .join(' ')
    .toLowerCase();

  // Normalizar separadores (_, -) a espacios para que los límites de palabra funcionen con snake_case y kebab-case
  const normalizedText = rawText.replace(/[_-]/g, ' ');

  return SENSITIVE_PATTERNS.some((p) => p.test(normalizedText) || p.test(rawText));
}

// ---------------------------------------------------------------------------
// E3.1 — Generador de hipótesis deterministas desde DOM
// ---------------------------------------------------------------------------

/**
 * Genera un id determinista para una regla inferida del DOM.
 * Formato: `<view>.<campo>.<tipo-de-regla>` — re-descubrimiento no duplica.
 */
export function buildInferredRuleId(view: string, fieldKey: string, ruleType: string): string {
  const safeView = view.replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeField = fieldKey.replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeType = ruleType.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${safeView}.${safeField}.${safeType}`;
}

/**
 * Genera reglas candidatas (status "inferred", source "dom") para todos
 * los campos y formularios del DOM. Determinista: misma vista -> mismos ids.
 */
export function generateDomHypotheses(
  ctx: ViewDiscoveryContext
): RuleEntry[] {
  const rules: RuleEntry[] = [];
  const { view } = ctx;

  const allFields: DomField[] = [
    ...(ctx.forms?.flatMap((f) => f.fields) ?? []),
    ...(ctx.standaloneFields ?? []),
  ];

  for (const field of allFields) {
    if (field.hidden || field.disabled) continue;

    const fieldKey = field.key || field.name || field.id || 'field';
    const isPassword = field.type === 'password';
    const cleanLabel = field.label && !isPassword ? sanitizeDomString(field.label) : undefined;
    const cleanFieldKey = sanitizeDomString(fieldKey);
    const displayLabel = cleanLabel || cleanFieldKey;

    // Regla: campo requerido
    if (field.required) {
      rules.push({
        id: buildInferredRuleId(view, fieldKey, 'required'),
        description: `El campo "${displayLabel}" es obligatorio en el DOM (required).`,
        category: 'campo',
        status: 'inferred',
        source: 'dom',
        view,
        field: fieldKey,
        evidence: field.id ? `#${field.id}` : field.name ? `[name="${field.name}"]` : fieldKey,
      });
    }

    // Regla: formato por type / pattern (excluyendo password y campos sensibles)
    if (
      field.type &&
      field.type !== 'text' &&
      field.type !== 'textarea' &&
      field.type !== 'select' &&
      field.type !== 'password' &&
      !isFieldSensitive(field)
    ) {
      const formatDesc = getTypeFormatDescription(field.type, field.pattern);
      if (formatDesc) {
        rules.push({
          id: buildInferredRuleId(view, fieldKey, `format_${field.type}`),
          description: formatDesc,
          category: 'campo',
          status: 'inferred',
          source: 'dom',
          view,
          field: fieldKey,
          evidence: field.type === 'email'
            ? 'type="email"'
            : field.pattern
            ? `pattern="${sanitizeDomString(field.pattern)}"`
            : `type="${field.type}"`,
        });
      }
    }

    if (field.pattern && field.type === 'text' && !isFieldSensitive(field)) {
      rules.push({
        id: buildInferredRuleId(view, fieldKey, 'pattern'),
        description: `El campo "${displayLabel}" tiene un patrón de validación HTML: "${sanitizeDomString(field.pattern)}".`,
        category: 'campo',
        status: 'inferred',
        source: 'dom',
        view,
        field: fieldKey,
        evidence: `pattern="${sanitizeDomString(field.pattern)}"`,
      });
    }

    // Reglas de longitud
    if (field.minlength !== undefined && field.minlength > 0) {
      rules.push({
        id: buildInferredRuleId(view, fieldKey, 'minlength'),
        description: `El campo "${displayLabel}" requiere al menos ${field.minlength} caracteres.`,
        category: 'campo',
        status: 'inferred',
        source: 'dom',
        view,
        field: fieldKey,
        evidence: `minlength="${field.minlength}"`,
      });
    }

    if (field.maxlength !== undefined && field.maxlength > 0) {
      rules.push({
        id: buildInferredRuleId(view, fieldKey, 'maxlength'),
        description: `El campo "${displayLabel}" acepta máximo ${field.maxlength} caracteres.`,
        category: 'campo',
        status: 'inferred',
        source: 'dom',
        view,
        field: fieldKey,
        evidence: `maxlength="${field.maxlength}"`,
      });
    }

    // Reglas de rango numérico
    if (field.min !== undefined) {
      rules.push({
        id: buildInferredRuleId(view, fieldKey, 'min'),
        description: `El campo "${displayLabel}" tiene valor mínimo ${field.min}.`,
        category: 'campo',
        status: 'inferred',
        source: 'dom',
        view,
        field: fieldKey,
        evidence: `min="${field.min}"`,
      });
    }

    if (field.max !== undefined) {
      rules.push({
        id: buildInferredRuleId(view, fieldKey, 'max'),
        description: `El campo "${displayLabel}" tiene valor máximo ${field.max}.`,
        category: 'campo',
        status: 'inferred',
        source: 'dom',
        view,
        field: fieldKey,
        evidence: `max="${field.max}"`,
      });
    }

    // Marca de sensibilidad
    if (isFieldSensitive(field)) {
      rules.push({
        id: buildInferredRuleId(view, fieldKey, 'sensibilidad'),
        description: `El campo "${displayLabel}" maneja datos sensibles. Confirma las medidas de protección requeridas.`,
        category: 'sensibilidad',
        status: 'inferred',
        source: 'dom',
        view,
        field: fieldKey,
        evidence: field.type === 'password' ? 'type="password"' : `key="${fieldKey}"`,
      });
    }
  }

  return rules;
}

/** Obtiene una descripción de formato basada en el type y pattern HTML */
function getTypeFormatDescription(type: string, pattern?: string): string | null {
  switch (type) {
    case 'email':
      return `El campo requiere un email válido (type="email").`;
    case 'tel':
      return `El campo requiere un número de teléfono (type="tel")${pattern ? ` con patrón "${pattern.slice(0, 40)}"` : ''}.`;
    case 'number':
      return `El campo acepta solo valores numéricos (type="number").`;
    case 'date':
      return `El campo requiere una fecha (type="date").`;
    case 'url':
      return `El campo requiere una URL válida (type="url").`;
    case 'color':
      return null; // no es una regla de negocio relevante
    default:
      return pattern
        ? `El campo tiene restricción de formato: pattern="${pattern.slice(0, 60)}".`
        : null;
  }
}

// ---------------------------------------------------------------------------
// E3.2 — Categorías aplicables por vista (función pura)
// ---------------------------------------------------------------------------

/**
 * Determina qué categorías de la entrevista aplican a esta vista.
 * Puro y determinista: mismo ctx -> mismas categorías.
 */
export function computeApplicableCategories(
  ctx: ViewDiscoveryContext,
  projectRoleCount: number
): RuleCategory[] {
  const applicable: RuleCategory[] = [];

  // proposito: SIEMPRE
  applicable.push('proposito');

  // actor: si la vista usó sesión O el proyecto tiene >= 2 roles
  if (ctx.storage_state_used || projectRoleCount >= 2) {
    applicable.push('actor');
  }

  const allFields = [
    ...(ctx.forms?.flatMap((f) => f.fields) ?? []),
    ...(ctx.standaloneFields ?? []),
  ].filter((f) => !f.hidden && !f.disabled);

  const visibleInputCount = allFields.length;
  const formCount = (ctx.forms?.length ?? 0);
  const buttonCount = (ctx.buttons?.length ?? 0);

  // campo: si hay >= 1 input visible
  if (visibleInputCount >= 1) {
    applicable.push('campo');
  }

  // error: si hay >= 1 formulario
  if (formCount >= 1) {
    applicable.push('error');
  }

  // accion: si hay >= 1 botón/envío que no sea solo navegación
  const actionButtons = (ctx.buttons ?? []).filter(
    (b) => !/^(ir|ir a|volver|regresar|cancelar|cerrar|salir|back|close|cancel)/i.test(b.text)
  );
  if (buttonCount >= 1 || formCount >= 1) {
    // Si hay botón o formulario se asume que hay acción
    if (actionButtons.length >= 1 || formCount >= 1) {
      applicable.push('accion');
    }
  }

  // dato: si aplican campo o accion
  if (applicable.includes('campo') || applicable.includes('accion')) {
    applicable.push('dato');
  }

  // sensibilidad: si algún campo sensible
  const hasSensitive = allFields.some((f) => isFieldSensitive(f));
  if (hasSensitive) {
    applicable.push('sensibilidad');
  }

  return applicable;
}

// ---------------------------------------------------------------------------
// E3.3 — Cobertura (función pura reutilizable)
// ---------------------------------------------------------------------------

export interface CategoryCoverage {
  aplicable: boolean;
  cubierta: boolean;
  pendientes: number; // reglas inferred sin confirmar en esa categoría
}

export interface CoverageResult {
  completa: boolean;
  categorias: Record<RuleCategory, CategoryCoverage>;
  inferidas_pendientes: number;
}

const ALL_CATEGORIES: RuleCategory[] = [
  'proposito', 'actor', 'campo', 'accion', 'error', 'dato', 'sensibilidad',
];

/**
 * Calcula la cobertura de la entrevista de una vista.
 * Una categoría está cubierta si tiene >= 1 regla en confirmed | rejected | deferred, o un waiver.
 * completa = todas las aplicables cubiertas Y inferidas_pendientes == 0.
 */
export function computeCoverage(
  applicableCategories: RuleCategory[],
  rules: RuleEntry[],
  waivers: CategoryWaiver[],
  view: string
): CoverageResult {
  const applicableSet = new Set(applicableCategories);

  const categorias = {} as Record<RuleCategory, CategoryCoverage>;
  let totalInferidaPendiente = 0;

  for (const cat of ALL_CATEGORIES) {
    const aplicable = applicableSet.has(cat);
    const viewRules = rules.filter((r) => (!r.view || r.view === view) && r.category === cat);
    const hasWaiver = waivers.some((w) => w.view === view && w.category === cat);

    const resolvedStatuses: RuleStatus[] = ['confirmed', 'rejected', 'deferred'];
    const hasResolved = viewRules.some((r) => r.status && resolvedStatuses.includes(r.status));
    const cubierta = aplicable && (hasWaiver || hasResolved);

    const pendientes = viewRules.filter((r) => r.status === 'inferred').length;
    if (aplicable) {
      totalInferidaPendiente += pendientes;
    }

    categorias[cat] = { aplicable, cubierta, pendientes };
  }

  const todasCubiertas = ALL_CATEGORIES.every(
    (cat) => !applicableSet.has(cat) || categorias[cat].cubierta
  );
  const completa = todasCubiertas && totalInferidaPendiente === 0;

  return { completa, categorias, inferidas_pendientes: totalInferidaPendiente };
}

// ---------------------------------------------------------------------------
// E3.4 — Siguiente lote de preguntas (función pura)
// ---------------------------------------------------------------------------

/** Prioridad de categorías para ordenar las preguntas */
const CATEGORY_PRIORITY: Record<RuleCategory, number> = {
  sensibilidad: 0,
  accion: 1,
  actor: 2,
  campo: 3,
  error: 4,
  proposito: 5,
  dato: 6,
};

/**
 * Genera el siguiente lote de preguntas (máx. 5) para la entrevista de una vista.
 * Puro y sin I/O: puede reanudarse en otra conversación.
 *
 * @param ctx - Contexto de descubrimiento de la vista
 * @param existingRules - Reglas ya registradas (para no repreguntarlas)
 * @param applicableCategories - Categorías aplicables calculadas con computeApplicableCategories
 * @param waivers - Waivers de categoría declarados por el usuario
 */
export function generateNextInterviewBatch(
  ctx: ViewDiscoveryContext,
  existingRules: RuleEntry[],
  applicableCategories: RuleCategory[],
  waivers: CategoryWaiver[]
): InterviewQuestion[] {
  const { view } = ctx;
  const targetLabel = ctx.route ? `'${ctx.module}' (${ctx.route})` : `'${ctx.module}'`;
  const questions: InterviewQuestion[] = [];

  const resolvedStatuses: RuleStatus[] = ['confirmed', 'rejected', 'deferred'];

  // 1. Agrupar hipótesis DOM pendientes en UNA pregunta confirmar_hipotesis
  const pendingHypotheses = existingRules.filter(
    (r) => r.source === 'dom' && r.status === 'inferred' && (!r.view || r.view === view)
  );

  if (pendingHypotheses.length > 0) {
    const listado = pendingHypotheses
      .map((h) => `- [${h.id}] ${sanitizeDomString(h.description)}`)
      .join('\n');
    const texto = `Se detectaron ${pendingHypotheses.length} hipótesis sobre reglas de negocio para el módulo ${targetLabel}:\n${listado}\n\nSelecciona una opción para confirmar o corregir:`;

    const confirmOptions: Opcion[] = [
      { id: 'confirmo_todas', etiqueta: 'Confirmo todas', recomendada: true, efecto: { estado: 'confirmed' } },
      { id: 'corregir_alguna', etiqueta: 'Quiero corregir alguna', efecto: { abre_seguimiento: true } },
      { id: 'dejo_pendientes', etiqueta: 'Las dejo pendientes', efecto: { estado: 'deferred' } },
    ];

    const rejectOptions: Opcion[] = pendingHypotheses.length >= 2
      ? pendingHypotheses.map((h) => ({
          id: h.id,
          etiqueta: `Rechazar: [${h.id}] ${sanitizeDomString(h.description)}`,
          efecto: { estado: 'rejected' },
        }))
      : [
          {
            id: pendingHypotheses[0].id,
            etiqueta: `Rechazar: [${pendingHypotheses[0].id}] ${sanitizeDomString(pendingHypotheses[0].description)}`,
            efecto: { estado: 'rejected' },
          },
          { id: 'ninguna', etiqueta: 'Mantener todas sin cambios' },
        ];

    const seguimiento: Pregunta = {
      id: `${view}.corregir_hipotesis`,
      texto: 'Selecciona las hipótesis que sean incorrectas para rechazarlas:',
      formato: 'multiple',
      opciones: rejectOptions,
      permite_otra: true,
      registrar_con: { tool: 'qap_rules_set', campo: 'rules' },
    };

    questions.push({
      id: `${view}.confirmar_hipotesis`,
      tipo: 'confirmar_hipotesis',
      categoria: 'campo',
      texto,
      formato: 'una_opcion',
      opciones: confirmOptions,
      permite_otra: false,
      registrar_con: { tool: 'qap_rules_set', campo: 'rules' },
      seguimiento,
      hipotesis_ids: pendingHypotheses.map((h) => ({ id: h.id, texto: h.description })),
    });
  }

  // 2. Preguntas abiertas por categoría sin cobertura (excluyendo campo y sensibilidad si ya van con hipótesis)
  const openCategories = applicableCategories
    .filter((cat) => {
      // Ya cubierta por waiver
      if (waivers.some((w) => w.view === view && w.category === cat)) return false;
      // Tiene al menos una regla resuelta
      const hasResolved = existingRules.some(
        (r) => (!r.view || r.view === view) && r.category === cat && r.status && resolvedStatuses.includes(r.status)
      );
      return !hasResolved;
    })
    .filter((cat) => {
      // "campo" se cubrió con las hipótesis si hubiera pendientes; si no hay pendientes pero tampoco confirmados, añadir
      if (cat === 'campo' && pendingHypotheses.length > 0) return false;
      // E0d: La sensibilidad se pregunta UNA sola vez (si ya va como hipótesis en confirmar_hipotesis, no como pregunta abierta)
      if (cat === 'sensibilidad' && pendingHypotheses.some((h) => h.category === 'sensibilidad')) return false;
      return true;
    })
    .sort((a, b) => (CATEGORY_PRIORITY[a] ?? 99) - (CATEGORY_PRIORITY[b] ?? 99));

  const allFields = [
    ...(ctx.forms?.flatMap((f) => f.fields) ?? []),
    ...(ctx.standaloneFields ?? []),
  ].filter((f) => !f.hidden && !f.disabled);

  const sensitiveFields = allFields
    .filter(isFieldSensitive)
    .map((f) => (f.type !== 'password' && f.label ? sanitizeDomString(f.label) : sanitizeDomString(f.key)));
  const actionButtons = (ctx.buttons ?? []).filter(
    (b) => !/^(ir|ir a|volver|regresar|cancelar|cerrar|salir|back|close|cancel)/i.test(b.text)
  );

  for (const cat of openCategories) {
    if (questions.length >= 5) break;

    switch (cat) {
      case 'sensibilidad':
        questions.push({
          id: `${view}.sensibilidad`,
          tipo: 'abierta',
          categoria: 'sensibilidad',
          texto: QUESTION_TEMPLATES.sensibilidad(sensitiveFields.length > 0 ? sensitiveFields : ['campo sensible detectado']),
          formato: 'una_opcion',
          opciones: [
            { id: 'confirmar_sensibilidad', etiqueta: 'Confirmar manejo seguro y enmascaramiento de datos sensibles', recomendada: true, efecto: { estado: 'confirmed' } },
            { id: 'deferir_sensibilidad', etiqueta: 'Revisar sensibilidad más adelante', efecto: { estado: 'deferred' } },
            { id: 'waiver_sensibilidad', etiqueta: 'No se consideran datos sensibles en esta vista', efecto: { estado: 'rejected' } },
          ],
          permite_otra: true,
          registrar_con: { tool: 'qap_rules_set', campo: 'rules' },
        });
        break;

      case 'accion': {
        const btn = actionButtons[0];
        if (btn) {
          questions.push({
            id: `${view}.accion.${btn.key}`,
            tipo: 'abierta',
            categoria: 'accion',
            texto: QUESTION_TEMPLATES.accion(sanitizeDomString(btn.text) || sanitizeDomString(btn.key), targetLabel),
            formato: 'una_opcion',
            opciones: [
              { id: 'validar_accion', etiqueta: 'Validar esta acción y su flujo de negocio', recomendada: true, efecto: { estado: 'confirmed' } },
              { id: 'deferir_accion', etiqueta: 'Dejar pendiente de validación', efecto: { estado: 'deferred' } },
              { id: 'waiver_accion', etiqueta: 'No aplica validación adicional para esta acción', efecto: { estado: 'rejected' } },
            ],
            permite_otra: true,
            registrar_con: { tool: 'qap_rules_set', campo: 'rules' },
          });
        }
        break;
      }

      case 'actor':
        questions.push({
          id: `${view}.actor`,
          tipo: 'abierta',
          categoria: 'actor',
          texto: QUESTION_TEMPLATES.actor(targetLabel),
          formato: 'una_opcion',
          opciones: [
            { id: 'confirmar_actor', etiqueta: 'Módulo accesible para los roles asignados', recomendada: true, efecto: { estado: 'confirmed' } },
            { id: 'deferir_actor', etiqueta: 'Dejar definición de actores para después', efecto: { estado: 'deferred' } },
            { id: 'waiver_actor', etiqueta: 'Disponible para todo público sin restricción de rol', efecto: { estado: 'rejected' } },
          ],
          permite_otra: true,
          registrar_con: { tool: 'qap_rules_set', campo: 'rules' },
        });
        break;

      case 'campo':
        questions.push({
          id: `${view}.campo`,
          tipo: 'abierta',
          categoria: 'campo',
          texto: `Identifica validaciones de negocio adicionales para los campos del módulo ${targetLabel}:`,
          formato: 'una_opcion',
          opciones: [
            { id: 'confirmar_campo', etiqueta: 'Aplicar validaciones adicionales de unicidad o formato', recomendada: true, efecto: { estado: 'confirmed' } },
            { id: 'deferir_campo', etiqueta: 'Dejar validaciones de campos para después', efecto: { estado: 'deferred' } },
            { id: 'waiver_campo', etiqueta: 'Las validaciones HTML del DOM son suficientes', efecto: { estado: 'rejected' } },
          ],
          permite_otra: true,
          registrar_con: { tool: 'qap_rules_set', campo: 'rules' },
        });
        break;

      case 'error': {
        questions.push({
          id: `${view}.error`,
          tipo: 'abierta',
          categoria: 'error',
          texto: QUESTION_TEMPLATES.error_form(targetLabel),
          formato: 'una_opcion',
          opciones: [
            { id: 'confirmar_error', etiqueta: 'Requiere validación de mensajes de error de negocio', recomendada: true, efecto: { estado: 'confirmed' } },
            { id: 'deferir_error', etiqueta: 'Dejar manejo de errores para después', efecto: { estado: 'deferred' } },
            { id: 'waiver_error', etiqueta: 'No aplican validaciones de error específicas en esta vista', efecto: { estado: 'rejected' } },
          ],
          permite_otra: true,
          registrar_con: { tool: 'qap_rules_set', campo: 'rules' },
        });
        break;
      }

      case 'proposito':
        questions.push({
          id: `${view}.proposito`,
          tipo: 'abierta',
          categoria: 'proposito',
          texto: QUESTION_TEMPLATES.proposito(targetLabel),
          formato: 'una_opcion',
          opciones: [
            { id: 'confirmar_proposito', etiqueta: 'Confirmar propósito y comportamiento esperado', recomendada: true, efecto: { estado: 'confirmed' } },
            { id: 'deferir_proposito', etiqueta: 'Definir propósito más adelante', efecto: { estado: 'deferred' } },
          ],
          permite_otra: true,
          registrar_con: { tool: 'qap_rules_set', campo: 'rules' },
        });
        break;

      case 'dato':
        questions.push({
          id: `${view}.dato`,
          tipo: 'abierta',
          categoria: 'dato',
          texto: QUESTION_TEMPLATES.dato(targetLabel),
          formato: 'una_opcion',
          opciones: [
            { id: 'confirmar_dato', etiqueta: 'Verificar persistencia e integridad de datos', recomendada: true, efecto: { estado: 'confirmed' } },
            { id: 'deferir_dato', etiqueta: 'Dejar reglas de datos para después', efecto: { estado: 'deferred' } },
            { id: 'waiver_dato', etiqueta: 'No se manejan datos adicionales en esta vista', efecto: { estado: 'rejected' } },
          ],
          permite_otra: true,
          registrar_con: { tool: 'qap_rules_set', campo: 'rules' },
        });
        break;
    }
  }

  return questions.slice(0, 5);
}

// ---------------------------------------------------------------------------
// Sanitización de cadenas del DOM (E2 — dato no confiable)
// ---------------------------------------------------------------------------

const MAX_DOM_STRING_LENGTH = 60;

/**
 * Sanitiza texto proveniente del DOM:
 * - Elimina saltos de línea y caracteres de control
 * - Elimina marcado HTML residual y markdown
 * - Trunca a 60 caracteres
 */
export function sanitizeDomString(raw: string | undefined | null): string {
  if (!raw) return '';
  return raw
    // eslint-disable-next-line no-control-regex
    .replace(/[\r\n\t\x00-\x1F\x7F]/g, ' ')  // caracteres de control -> espacio
    .replace(/<[^>]*>/g, '')                   // tags HTML residuales
    .replace(/[*_#`~[\]]/g, '')               // marcado markdown residual
    .replace(/\s+/g, ' ')                      // colapsar espacios
    .trim()
    .slice(0, MAX_DOM_STRING_LENGTH);
}
