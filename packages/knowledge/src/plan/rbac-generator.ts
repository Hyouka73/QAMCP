import { createHash } from 'node:crypto';

import type { AuthProfile, ModuleContext, RuleEntry, TCCase, TCStep } from '@qap/shared';
import { filterValidRoles, normalizeSlug } from '@qap/shared';

/** Selector CSS estándar de denegación observable (cuando se habilita explícitamente observable_denial: true o denial_oracle: true). */
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

/** Procedencias acreditadas para reglas RBAC (excluye inferencias no validadas como 'agent' o 'dom'). */
const TRUSTED_RULE_SOURCES: ReadonlySet<string | undefined> = new Set([
  'user_confirmed',
  'prd',
  'user_text',
  'user',
  'doc',
  undefined,
]);

/** UUID v4 determinista a partir de una cadena semilla. */
function generateDeterministicUuid(seed: string): string {
  const hash = createHash('sha256').update(seed).digest('hex');
  return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-4${hash.substring(13, 16)}-a${hash.substring(17, 20)}-${hash.substring(20, 32)}`;
}

/** Escapa caracteres especiales para expresiones regulares literales. */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

const IGNORED_ROLE_WORDS = new Set([
  'acceso',
  'usuario',
  'usuarios',
  'el',
  'la',
  'los',
  'las',
  'un',
  'una',
  'autenticado',
  'autenticados',
  'sistema',
  'modulo',
  'vista',
]);

/**
 * Fundamenta los roles autorizados y prohibidos para una regla actor específica.
 * - Solo admite etiquetas con semántica explícita de rol (`role:<rol>`, `actor:<rol>`) o etiquetas
 *   que correspondan a un rol válido del proyecto (nunca etiquetas temáticas como `'seguridad'`).
 * - Elimina definitivamente cualquier inferencia o fallback desde `moduleContext.users`.
 */
function extractRuleRoleGrounding(
  rule: RuleEntry,
  validRoles: string[]
): RuleRoleGrounding | null {
  const authorized = new Set<string>();
  const forbidden = new Set<string>();
  const validRoleSet = new Set(validRoles);

  // 1. Tags de la regla:
  // - Prefijo explícito `role:<rol>` o `actor:<rol>` (solo si corresponde a un rol válido del proyecto)
  // - O coincidencia exacta con un rol válido del proyecto (`validRoleSet`)
  // Las etiquetas temáticas (ej. 'seguridad', 'role:seguridad') o roles inexistentes ('actor:superadmin')
  // NO fundamentan permisos ni fabrican matrices de denegación.
  for (const rawTag of rule.tags ?? []) {
    if (typeof rawTag !== 'string') continue;
    const trimmed = rawTag.trim();
    const explicitPrefixMatch = /^(?:role|actor)\s*[:=-]\s*(.+)$/i.exec(trimmed);
    if (explicitPrefixMatch) {
      const candidate = normalizeSlug(explicitPrefixMatch[1] ?? '');
      if (candidate.length > 0 && !IGNORED_ROLE_WORDS.has(candidate) && validRoleSet.has(candidate)) {
        authorized.add(candidate);
      }
      continue;
    }

    const normalizedTag = normalizeSlug(trimmed);
    if (normalizedTag.length > 0 && !IGNORED_ROLE_WORDS.has(normalizedTag) && validRoleSet.has(normalizedTag)) {
      authorized.add(normalizedTag);
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

  // Sin fallback a moduleContext.users: si la regla confirmada no fundamenta permisos por sí misma, fail-closed.
  if (authorized.size === 0 && forbidden.size === 0) {
    return null;
  }

  return { authorized, forbidden };
}

/**
 * Resuelve los pasos de aserción observables de denegación.
 *
 * Garantías (H01 & H07):
 * - NUNCA acredita una caída HTTP 500 o página vacía mediante `not_exists` aislado.
 *   La ausencia de un control privilegiado (`not_exists`) por sí sola no demuestra autorización denegada,
 *   por lo que solo puede emitirse como verificación adicional tras una evidencia positiva de bloqueo (`visible`).
 * - NUNCA inventa selectores de denegación ante metadatos ausentes: requiere `denial_selector`,
 *   `denial_oracle` explícito o confirmación `observable_denial: true`.
 * - NUNCA emite `selector: 'body', assertion_type: 'exists'`.
 */
function resolveDenialSteps(moduleContext: RbacModuleContext): TCStep[] | null {
  if (!moduleContext || typeof moduleContext !== 'object') {
    return null;
  }

  // Compuerta explícita de inexistencia de oráculo
  if (moduleContext.observable_denial === false || moduleContext.denial_oracle === false) {
    return null;
  }

  const customDenialSelector =
    typeof moduleContext.denial_selector === 'string' && moduleContext.denial_selector.trim().length > 0
      ? moduleContext.denial_selector.trim()
      : typeof moduleContext.denial_oracle === 'string' && moduleContext.denial_oracle.trim().length > 0
      ? moduleContext.denial_oracle.trim()
      : undefined;

  const hasExplicitDefaultOracle =
    moduleContext.observable_denial === true || moduleContext.denial_oracle === true;

  const positiveDenialSelector =
    customDenialSelector ?? (hasExplicitDefaultOracle ? DEFAULT_DENIAL_SELECTOR : undefined);

  // Sin evidencia positiva de denegación acreditada, fail-closed (no emitir not_exists aislado ni inventar selector)
  if (!positiveDenialSelector) {
    return null;
  }

  const steps: TCStep[] = [
    {
      type: 'assert',
      selector: positiveDenialSelector,
      assertion_type: 'visible',
    },
  ];

  // Si además se especifica un control privilegiado, verificar también su ausencia en el DOM
  if (
    typeof moduleContext.privileged_selector === 'string' &&
    moduleContext.privileged_selector.trim().length > 0
  ) {
    steps.push({
      type: 'assert',
      selector: moduleContext.privileged_selector.trim(),
      assertion_type: 'not_exists',
    });
  }

  return steps;
}

/**
 * Resuelve el ID del auth_profile acreditado para un rol dado (H06 / RBAC-1 / RBAC-6).
 *
 * Reglas de integridad de identidad:
 * 1. Si el perfil define `profile.role` no vacío, ese rol explícito es VINCULANTE:
 *    solo coincide si `normalizeSlug(profile.role) === role`. Jamás se permite que el prefijo
 *    de `profile.id` contradiga un `profile.role` explícito (ej. `{ id: 'viewer-admin', role: 'admin' }`
 *    nunca se asigna a una prueba para `'viewer'`).
 * 2. Solo si el perfil carece de `profile.role` (legacy), se permite compatibilidad por `profile.id`
 *    con frontera estricta de slug (`id === role` o `id` comienza con `${role}-` o `${role}_`)
 *    y verificando que el resto del identificador no mencione otro rol distinto del proyecto.
 * 3. Si existen múltiples perfiles candidatos ambiguos para el mismo rol, fail-closed (`undefined`).
 */
function resolveProfileId(
  role: string,
  profiles?: AuthProfile[],
  allProjectRoles: string[] = []
): string | undefined {
  if (!role || role.length === 0 || !profiles || profiles.length === 0) return undefined;

  const explicitMatches: string[] = [];
  const legacyPrefixMatches: string[] = [];
  const otherRoles = allProjectRoles.filter((r) => r !== role);

  for (const profile of profiles) {
    if (!profile || typeof profile !== 'object') continue;
    const rawId = typeof profile.id === 'string' ? profile.id.trim() : '';
    if (rawId.length === 0) continue;

    const rawRole = (profile as { role?: unknown }).role;
    const hasExplicitRole = typeof rawRole === 'string' && rawRole.trim().length > 0;

    if (hasExplicitRole) {
      const normalizedProfileRole = normalizeSlug(rawRole);
      if (normalizedProfileRole === role) {
        explicitMatches.push(rawId);
      }
      // Si tiene profile.role explícito y no coincide con `role`, jamás hacer fallback a profile.id
      continue;
    }

    // Perfil legacy sin profile.role: validar frontera estricta de slug en profile.id
    const normalizedId = normalizeSlug(rawId);
    const escapedRole = escapeRegex(role);
    const boundaryPattern = new RegExp(`^${escapedRole}(?:$|[-_].+)`, 'i');
    if (!boundaryPattern.test(rawId) && !boundaryPattern.test(normalizedId)) {
      continue;
    }

    // Verificar que el sufijo del id no contenga otro rol del proyecto (evitar ambigüedad como 'viewer-admin')
    const remainder = normalizedId.slice(role.length).replace(/^[-_]+/, '');
    const remainderTokens = remainder.split(/[-_]+/).filter(Boolean);
    const hasConflictingRoleToken = remainderTokens.some((token) => otherRoles.includes(token));
    if (hasConflictingRoleToken) {
      continue;
    }

    legacyPrefixMatches.push(rawId);
  }

  if (explicitMatches.length === 1) {
    return explicitMatches[0];
  }
  if (explicitMatches.length > 1) {
    // Ambigüedad entre múltiples perfiles explícitos para el mismo rol -> fail-closed
    return undefined;
  }

  if (legacyPrefixMatches.length === 1) {
    return legacyPrefixMatches[0];
  }

  return undefined;
}

/**
 * Genera casos RBAC negativos verificables: cada rol del proyecto que NO está autorizado
 * para la regla de actor confirmada intenta acceder y debe ser bloqueado con un resultado observable
 * acreditado (switch_auth -> navigate -> assert denial observable).
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

  // Solo procesar reglas confirmadas de categoría actor y procedencia acreditada
  const actorRules = rules.filter(
    (rule) =>
      rule.status === 'confirmed' &&
      TRUSTED_RULE_SOURCES.has(rule.source) &&
      rule.category === 'actor'
  );
  if (actorRules.length === 0) return [];

  // Resolver los pasos de aserción de denegación observable acreditados; si no existen, fail-closed
  const denialSteps = resolveDenialSteps(moduleContext);
  if (!denialSteps || denialSteps.length === 0) return [];

  const targetUrl = moduleContext.base_route ?? `/${normalizeSlug(moduleName)}`;
  const cases: TCCase[] = [];

  for (const rule of actorRules) {
    const grounding = extractRuleRoleGrounding(rule, validRoles);
    if (!grounding) {
      // Regla sin fundamentación explícita de roles: omitir (fail-closed)
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

      // Resolver perfil acreditado para el rol no autorizado; si no existe o es incompatible, fail-closed
      const profileId = resolveProfileId(role, profiles, validRoles);
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
          ...denialSteps.map((step) => ({ ...step })),
        ],
      });
    }
  }

  return cases;
}
