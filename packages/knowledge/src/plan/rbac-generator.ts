import { createHash } from 'node:crypto';

import type { AuthProfile, ModuleContext, RuleEntry, TCCase, TCStep } from '@qap/shared';
import { filterValidRoles, normalizeSlug } from '@qap/shared';

/** Selector CSS estándar de denegación observable (banner o mensaje de acceso restringido/403). */
export const DEFAULT_DENIAL_SELECTOR = '[data-testid="access-denied"], .error-403, .unauthorized';

/**
 * Subconjunto de ModuleContext que usa el generador RBAC.
 * Soporta configuración explícita de oráculo de denegación observable y roles heredados.
 */
export type RbacModuleContext = Partial<Omit<ModuleContext, 'users'>> & {
  users?: Array<string | { role?: string; roles?: string[] }>;
  denial_selector?: string;
  privileged_selector?: string;
  observable_denial?: boolean;
  denial_oracle?: boolean | string;
};

/** UUID v4 determinista a partir de una cadena semilla. */
function generateDeterministicUuid(seed: string): string {
  const hash = createHash('sha256').update(seed).digest('hex');
  return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-4${hash.substring(13, 16)}-a${hash.substring(17, 20)}-${hash.substring(20, 32)}`;
}

/** Escapa caracteres especiales para expresiones regulares literales. */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Roles autorizados en moduleContext.users (strings u objetos con role/roles). */
function collectAuthorizedRoles(moduleContext: RbacModuleContext): Set<string> {
  const authorized = new Set<string>();

  for (const user of moduleContext.users ?? []) {
    if (typeof user === 'string') {
      const slug = normalizeSlug(user);
      if (slug.length > 0) authorized.add(slug);
      continue;
    }
    if (user.role) {
      const slug = normalizeSlug(user.role);
      if (slug.length > 0) authorized.add(slug);
    }
    for (const role of user.roles ?? []) {
      const slug = normalizeSlug(role);
      if (slug.length > 0) authorized.add(slug);
    }
  }

  return authorized;
}

/** Detecta si un rol específico está declarado como prohibido/restringido en el texto de una regla. */
function isRoleForbiddenInText(text: string, role: string): boolean {
  const escaped = escapeRegex(role);
  const patterns = [
    new RegExp(
      `(?:prohibid[oa]s?|proh[ií]be[sn]?|prohibir|denegad[oa]s?|deniega[n]?|bloquead[oa]s?|bloquea[n]?|restringid[oa]s?|restringe[n]?|no\\s+(?:se\\s+)?permite[n]?|sin\\s+acceso|no\\s+autorizad[oa]s?)[^.;!?\\n]*?\\b${escaped}\\b`,
      'i'
    ),
    new RegExp(
      `\\b${escaped}\\b[^.;!?\\n]*?\\b(?:no\\s+(?:tiene\\s+acceso|puede|debe|est[aá]\\s+autorizado)|(?:est[aá]|tiene|qued[ao])\\s+(?:prohibid[oa]s?|denegad[oa]s?|bloquead[oa]s?|restringid[oa]s?)|proh[ií]be[sn]?|deniega[n]?|bloquea[n]?|restringe[n]?)\\b`,
      'i'
    ),
  ];
  return patterns.some((p) => p.test(text));
}

interface RuleRoleGrounding {
  authorized: Set<string>;
  forbidden: Set<string>;
}

const AUTHORIZED_PATTERNS = [
  /(?:solo|s[oó]lo)\s+(?:usuarios?\s+con\s+rol\s+|el\s+rol\s+|los?\s+)?([a-z0-9_-]+)/gi,
  /(?:exclusivo\s+(?:para\s+)?|restringido\s+a\s+)(?:el\s+rol\s+|los?\s+)?([a-z0-9_-]+)/gi,
  /(?:requiere\s+(?:el\s+)?(?:rol\s+)?)([a-z0-9_-]+)/gi,
  /(?:permite\s+(?:el\s+)?acceso\s+a|permitido\s+(?:para|a)\s+)(?:el\s+rol\s+|los?\s+)?([a-z0-9_-]+)/gi,
];

const IGNORED_ROLE_WORDS = new Set(['acceso', 'usuario', 'usuarios', 'el', 'la', 'los', 'las', 'un', 'una', 'autenticado', 'autenticados']);

/**
 * Fundamenta los roles autorizados y prohibidos para una regla actor específica.
 * Prioriza la especificación sustantiva en la regla (tags, condition, description, user_text, action)
 * sobre presunciones genéricas del contexto (RBAC-2 y RBAC-4).
 */
function extractRuleRoleGrounding(
  rule: RuleEntry,
  validRoles: string[],
  moduleContext?: RbacModuleContext
): RuleRoleGrounding | null {
  const authorized = new Set<string>();
  const forbidden = new Set<string>();

  // 1. Tags de la regla (ej: 'role:admin', 'admin', 'actor:admin')
  for (const tag of rule.tags ?? []) {
    const normalizedTag = normalizeSlug(tag);
    const strippedTag = normalizedTag.replace(/^(?:role|actor)-/, '');
    authorized.add(strippedTag);
    for (const role of validRoles) {
      if (normalizedTag === role || strippedTag === role) {
        authorized.add(role);
      }
    }
  }

  // 2. Texto sustantivo de la regla (description, condition, user_text, action)
  const textToSearch = [
    rule.description,
    rule.condition,
    rule.user_text,
    rule.action,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  // a) Extraer roles autorizados mediante patrones gramaticales explícitos ("solo <rol>", etc.)
  for (const pattern of AUTHORIZED_PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(textToSearch)) !== null) {
      const candidate = normalizeSlug(match[1] ?? '');
      if (candidate && !IGNORED_ROLE_WORDS.has(candidate)) {
        authorized.add(candidate);
      }
    }
  }

  // b) Evaluar roles conocidos del proyecto en el texto
  for (const role of validRoles) {
    if (isRoleForbiddenInText(textToSearch, role)) {
      forbidden.add(role);
    } else {
      const roleRegex = new RegExp(`\\b${escapeRegex(role)}\\b`, 'i');
      if (roleRegex.test(textToSearch)) {
        authorized.add(role);
      }
    }
  }

  // 3. Fallback contextual: Si la regla es de actor confirmada pero no declara roles específicos,
  // consultar si moduleContext define usuarios/roles confirmados para el módulo
  if (authorized.size === 0 && forbidden.size === 0 && moduleContext) {
    const contextRoles = collectAuthorizedRoles(moduleContext);
    for (const role of contextRoles) {
      if (validRoles.includes(role)) {
        authorized.add(role);
      }
    }
  }

  // Si tras consultar la regla y el contexto no hay ningún rol fundamentado,
  // la regla no puede determinar autorización de forma confiable (fail-closed, no producto cartesiano ciego)
  if (authorized.size === 0 && forbidden.size === 0) {
    return null;
  }

  return { authorized, forbidden };
}

/**
 * Resuelve el paso de aserción observable de denegación.
 * Garantiza que una prueba negativa verifique un bloqueo observable real
 * (elemento de acceso denegado visible o control privilegiado ausente),
 * nunca una aserción vacua como 'body exists' (RBAC-3 y RBAC-5).
 */
function resolveDenialStep(moduleContext: RbacModuleContext): TCStep | null {
  // Si explícitamente se declara que no hay oráculo observable de denegación, fail-closed
  if (moduleContext.observable_denial === false || moduleContext.denial_oracle === false) {
    return null;
  }

  // 1. Si se define un selector privilegiado que debe estar ausente (not_exists)
  if (moduleContext.privileged_selector) {
    return {
      type: 'assert',
      selector: moduleContext.privileged_selector,
      assertion_type: 'not_exists',
    };
  }

  // 2. Si se define un selector de denegación específico en el contexto
  if (moduleContext.denial_selector) {
    return {
      type: 'assert',
      selector: moduleContext.denial_selector,
      assertion_type: 'visible',
    };
  }

  // 3. Oráculo observable estándar: banner o mensaje de acceso denegado visible
  return {
    type: 'assert',
    selector: DEFAULT_DENIAL_SELECTOR,
    assertion_type: 'visible',
  };
}

/**
 * Resuelve el ID del auth_profile acreditado para un rol dado.
 * Coincidencia por profile.role o profile.id.
 * Retorna undefined si no se encuentra un perfil acreditado (elimina el fallback inventado <rol>-local, RBAC-1).
 */
function resolveProfileId(role: string, profiles?: AuthProfile[]): string | undefined {
  if (!role || role.length === 0 || !profiles || profiles.length === 0) return undefined;
  const matched = profiles.find((profile) => {
    if (!profile || typeof profile !== 'object') return false;
    const profileRole = normalizeSlug((profile as { role?: string }).role ?? '');
    if (profileRole.length > 0 && profileRole === role) return true;
    if (typeof profile.id === 'string' && profile.id.length > 0 && profile.id.startsWith(role)) {
      return true;
    }
    return false;
  });
  return typeof matched?.id === 'string' && matched.id.length > 0 ? matched.id : undefined;
}

/**
 * Genera casos RBAC negativos verificables: cada rol del proyecto que NO está autorizado
 * para la regla de actor confirmada intenta acceder y debe ser bloqueado con un resultado observable
 * (switch_auth -> navigate -> assert denial observable).
 *
 * Cumple estrictamente con:
 * - RBAC-1: Sin perfiles sintéticos fabricados (<rol>-local). Si no hay perfil acreditado, fail-closed.
 * - RBAC-2: Autorización fundamentada en reglas actor confirmadas, no supuesta de listas libres.
 * - RBAC-3 & RBAC-5: Verificación de denegación observable (sin 'body exists').
 * - RBAC-4: Sin producto cartesiano ciego; validación estricta de aplicabilidad e identidad.
 */
export function generateRbacNegativeCases(
  moduleName: string,
  projectRoles: unknown[],
  moduleContext: RbacModuleContext,
  rules: RuleEntry[],
  profiles?: AuthProfile[]
): TCCase[] {
  const validRoles = filterValidRoles(projectRoles)
    .map((role) => normalizeSlug(role))
    .filter((role) => role.length > 0);
  if (validRoles.length === 0) return [];

  // Solo procesar reglas confirmadas de categoría actor
  const actorRules = rules.filter((rule) => rule.status === 'confirmed' && rule.category === 'actor');
  if (actorRules.length === 0) return [];

  // Resolver el oráculo de denegación observable; si no se conoce, fail-closed (no emitir casos ejecutables)
  const denialStep = resolveDenialStep(moduleContext);
  if (!denialStep) return [];

  const targetUrl = moduleContext.base_route ?? `/${normalizeSlug(moduleName)}`;
  const cases: TCCase[] = [];

  for (const rule of actorRules) {
    const grounding = extractRuleRoleGrounding(rule, validRoles, moduleContext);
    if (!grounding) {
      // Regla sin fundamentación de roles: omitir para evitar producto cartesiano ciego
      continue;
    }

    for (const role of validRoles) {
      // Determinar si el rol es no autorizado para esta regla:
      // a) Explícitamente prohibido por la regla
      // b) O no incluido en el conjunto de roles autorizados cuando existen roles autorizados definidos
      const isUnauthorized =
        grounding.forbidden.has(role) ||
        (grounding.authorized.size > 0 && !grounding.authorized.has(role));

      if (!isUnauthorized) continue;

      // Resolver perfil acreditado para el rol no autorizado; si no existe, fail-closed (no inventar identidades)
      const profileId = resolveProfileId(role, profiles);
      if (!profileId) continue;

      cases.push({
        _version: '1',
        id: generateDeterministicUuid(`${moduleName}:rbac:${rule.id}:${role}`),
        name: `RBAC Negativo: Rol '${role}' no autorizado en ${rule.id}`,
        case_category: 'rbac_negative',
        tags: ['rbac-negative', moduleName],
        source_rule_id: rule.id,
        steps: [
          { type: 'switch_auth', auth_profile: profileId },
          { type: 'navigate', url: targetUrl },
          denialStep,
        ],
      });
    }
  }

  return cases;
}