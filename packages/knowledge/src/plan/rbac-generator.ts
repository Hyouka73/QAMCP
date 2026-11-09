import { createHash } from 'node:crypto';

import type { AuthProfile, ModuleContext, RuleEntry, TCCase } from '@qap/shared';
import { filterValidRoles, normalizeSlug } from '@qap/shared';

/**
 * Subconjunto de ModuleContext que usa el generador. users admite el formato real
 * (string[]) y también objetos { role | roles } de contextos antiguos.
 */

export type RbacModuleContext = Partial<Omit<ModuleContext, 'users'>> & {
  users?: Array< string | { role?: string; roles?: string[] }>;
};

/** UUID v4 determinista a partir de una cadena semilla. */
function generateDeterministicUuid(seed: string): string {
  const hash = createHash('sha256').update(seed).digest('hex');
  return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-4${hash.substring(13, 16)}-a${hash.substring(17, 20)}-${hash.substring(20, 32)}`;
}

/** Roles autorizados en moduleContext.users (strings u objetos con role/roles). */
function collectAuthorizedRoles(moduleContext: RbacModuleContext): Set<string> {
  const authorized = new Set<string>();
  
  for (const user of moduleContext.users ?? []) {
    if (typeof user == 'string') {
      authorized.add(normalizeSlug(user));
      continue;
    }
    if (user.role) authorized.add(normalizeSlug(user.role));
    for (const role of user.roles ?? []) authorized.add(normalizeSlug(role));
  };

  return authorized;
}

/** A proposal may reference only an unambiguous, explicitly supplied profile. */
function resolveProfileId(role: string, profiles?: AuthProfile[]): string | undefined {
  const matches = profiles?.filter((profile) =>
    profile.role ? normalizeSlug(profile.role) === role : profile.id === role);
  return matches?.length === 1 ? matches[0].id : undefined;
}

/**
 * Produces blocked access proposals from the legacy role list, not verified denials.
 * Explicit permissions, real resource oracles and isolated identities remain required.
 */
export function generateRbacNegativeCases(
  moduleName: string,
  projectRoles: unknown[],
  moduleContext: RbacModuleContext,
  rules: RuleEntry[],
  profiles?: AuthProfile[]
): TCCase[] {
  const validRoles = filterValidRoles(projectRoles).map((role) => normalizeSlug(role));
  if (validRoles.length === 0 || !Array.isArray(moduleContext.users) || !moduleContext.base_route) return [];

  const authorizedRoles = collectAuthorizedRoles(moduleContext);

  const actorRules = rules.filter((rule) => rule.status === 'confirmed' && rule.category === 'actor');
  if (actorRules.length === 0) return [];
   
  const targetUrl = moduleContext.base_route;
  const cases: TCCase[] = [];

  for (const role of validRoles) {
    if (authorizedRoles.has(role)) continue;

    const profileId = resolveProfileId(role, profiles);
    if (!profileId) continue;

    for (const rule of actorRules) {
      cases.push({
        _version: '1',
        id: generateDeterministicUuid(`${moduleName}:rbac:${rule.id}:${role}`),
        name: `Propuesta RBAC: verificar acceso del rol '${role}' según ${rule.id}; oráculo pendiente`,
        case_category: 'rbac_negative',
        // users/profile heuristics do not prove permissions or a denial oracle.
        tags: ['rbac-negative', moduleName, 'candidate', 'blocked_missing_oracle'],
        source_rule_id: rule.id,
        steps: [
          { type: 'switch_auth', auth_profile: profileId },
          { type: 'navigate', url: targetUrl },
          // No fabricated authorization assertion. The candidate stays blocked.
        ],
      });
    }
  }

  return cases;
}
