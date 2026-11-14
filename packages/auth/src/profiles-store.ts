import { existsSync, lstatSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { SchemaValidator, type AuthProfile, type PreviousAccountReference } from '@qap/shared';

import { CredentialError } from './credential-provider.js';
import { atomicPrivateWrite, safeDirectory, safeProfileId, withFileLock } from './secure-files.js';

const validator = new SchemaValidator();

export interface ProfileQueryCriteria {
  id?: string;
  alias?: string;
  username?: string;
  role?: string;
  scenario?: string;
  env?: string;
  application_id?: string;
}

export type EnvironmentPolicyTier = 'agile_qa' | 'sensitive';

export interface ProfileMutationOptions {
  basePath?: string;
  allowPrivileged?: boolean;
  credentialHandlingOnUsernameChange?: 'preserved' | 'revoked' | 'not_configured';
}

export interface ProfileUpdateResult {
  profile: AuthProfile;
  previousProfile: AuthProfile;
  usernameChanged: boolean;
  previousUsername?: string;
}

const AGILE_ENV_PATTERNS = /^(local|dev|development|fixture|fixtures|staging|stg|qa|test|testing|sandbox|preview|demo)(?:[-_.]|$)/i;
const SENSITIVE_ENV_PATTERNS = /^(prod|production|live|prd|real)(?:[-_.]|$)/i;
const PRIVILEGED_ID_OR_ROLE_PATTERNS = /^(admin|admin-user|root|superadmin|superuser|owner|sysadmin|system-admin)$/i;

/**
 * Valida que el identificador de usuario sea cualquier cadena imprimible válida (no solo email).
 */
export function isValidUsernameIdentifier(username: unknown): username is string {
  if (typeof username !== 'string') return false;
  const trimmed = username.trim();
  if (!trimmed || trimmed.length > 256 || trimmed !== username) return false;
  return !/\p{C}/u.test(username);
}

/**
 * Clasifica la política del entorno diferenciando entornos ágiles de QA frente a entornos sensibles.
 */
export function classifyEnvironmentPolicy(env: string, isProductionFlag?: boolean): EnvironmentPolicyTier {
  if (isProductionFlag === true) return 'sensitive';
  const normalized = env.trim();
  if (SENSITIVE_ENV_PATTERNS.test(normalized)) return 'sensitive';
  if (AGILE_ENV_PATTERNS.test(normalized)) return 'agile_qa';
  return 'sensitive';
}

/**
 * Determina si un perfil es privilegiado por metadatos explícitos, identificador reservado o entorno sensible.
 */
export function isPrivilegedProfile(
  profile: Partial<AuthProfile> & { id?: string; env?: string; role?: string; privileged?: boolean },
  isProductionEnv?: boolean
): boolean {
  if (profile.privileged === true) return true;
  if (profile.id && PRIVILEGED_ID_OR_ROLE_PATTERNS.test(profile.id.trim())) return true;
  if (profile.role && PRIVILEGED_ID_OR_ROLE_PATTERNS.test(profile.role.trim())) return true;
  if (profile.env && classifyEnvironmentPolicy(profile.env, isProductionEnv) === 'sensitive') return true;
  return false;
}

function profilesFilePath(basePath?: string): string {
  return join(basePath ?? process.cwd(), '.qa', 'project', 'auth', 'profiles.json');
}

export function readProfiles(basePath?: string): AuthProfile[] {
  const profilesPath = profilesFilePath(basePath);
  if (!existsSync(profilesPath)) return [];
  safeDirectory(join(basePath ?? process.cwd(), '.qa', 'project', 'auth'));
  const stat = lstatSync(profilesPath);
  if (stat.isSymbolicLink() || !stat.isFile() || stat.nlink !== 1 || stat.size > 1024 * 1024) throw new CredentialError('UNSAFE_PATH');

  try {
    const raw = readFileSync(profilesPath, 'utf-8');
    const parsed = JSON.parse(raw) as { profiles: AuthProfile[] };
    if (!Array.isArray(parsed?.profiles)) throw new CredentialError('INVALID_INPUT');
    return parsed.profiles;
  } catch { throw new CredentialError('INVALID_INPUT'); }
}

export function readProfile(profileId: string, basePath?: string): Promise<AuthProfile | null> {
  safeProfileId(profileId);
  const matches = readProfiles(basePath).filter((p) => p?.id === profileId);
  if (matches.length > 1) throw new CredentialError('INVALID_INPUT');
  return Promise.resolve(matches[0] ?? null);
}

/**
 * Escribe de forma atómica y validada el archivo profiles.json sin exponer ni aceptar secretos.
 */
export function writeProfiles(profiles: AuthProfile[], basePath?: string): void {
  for (const profile of profiles) {
    safeProfileId(profile.id);
    if (!isValidUsernameIdentifier(profile.username)) {
      throw new CredentialError('INVALID_INPUT');
    }
  }
  const payload = { _version: '1' as const, profiles };
  if (!validator.validateProfiles(payload).valid) {
    throw new CredentialError('INVALID_INPUT');
  }
  const filePath = profilesFilePath(basePath);
  withFileLock(filePath, () => {
    atomicPrivateWrite(filePath, JSON.stringify(payload, null, 2));
  });
}

function normalizeCase(value: string): string {
  return value.trim().toLowerCase();
}

function matchesCriteria(profile: AuthProfile, criteria: ProfileQueryCriteria): boolean {
  if (criteria.application_id !== undefined && profile.application_id !== criteria.application_id) {
    return false;
  }
  if (criteria.env !== undefined && profile.env !== criteria.env) {
    return false;
  }
  if (criteria.id !== undefined && profile.id !== criteria.id) {
    return false;
  }
  if (criteria.alias !== undefined) {
    const targetAlias = normalizeCase(criteria.alias);
    const aliases = [
      ...(profile.alias ? [profile.alias] : []),
      ...(Array.isArray(profile.aliases) ? profile.aliases : []),
    ].map(normalizeCase);
    if (!aliases.includes(targetAlias) && normalizeCase(profile.id) !== targetAlias) {
      return false;
    }
  }
  if (criteria.username !== undefined && profile.username !== criteria.username.trim()) {
    return false;
  }
  if (criteria.role !== undefined) {
    if (!profile.role || normalizeCase(profile.role) !== normalizeCase(criteria.role)) {
      return false;
    }
  }
  if (criteria.scenario !== undefined) {
    const targetScenario = normalizeCase(criteria.scenario);
    const scenarios = [
      ...(profile.scenario ? [profile.scenario] : []),
      ...(Array.isArray(profile.scenarios) ? profile.scenarios : []),
    ].map(normalizeCase);
    if (!scenarios.includes(targetScenario)) {
      return false;
    }
  }
  return true;
}

/**
 * Filtra múltiples perfiles por aplicación, entorno, alias, username, rol o escenario.
 */
export function findProfiles(criteria: ProfileQueryCriteria, basePath?: string): AuthProfile[] {
  const all = readProfiles(basePath);
  return all.filter((profile) => matchesCriteria(profile, criteria));
}

/**
 * Selecciona un perfil de forma determinista por id, alias, username, rol o escenario.
 */
export function selectProfile(
  criteria: ProfileQueryCriteria,
  basePath?: string
): { profile: AuthProfile | null; candidates: AuthProfile[]; ambiguous: boolean } {
  const candidates = findProfiles(criteria, basePath);
  if (candidates.length === 0) {
    return { profile: null, candidates: [], ambiguous: false };
  }
  if (candidates.length === 1) {
    return { profile: candidates[0]!, candidates, ambiguous: false };
  }
  // Si se indicó id o alias exacto que desempata, priorizarlo
  if (criteria.id) {
    const exactId = candidates.find((c) => c.id === criteria.id);
    if (exactId) return { profile: exactId, candidates, ambiguous: false };
  }
  return { profile: null, candidates, ambiguous: true };
}

/**
 * Crea un nuevo perfil de autenticación sin sobrescribir perfiles existentes.
 */
export function createProfile(profile: AuthProfile, options: ProfileMutationOptions = {}): AuthProfile {
  safeProfileId(profile.id);
  if (!isValidUsernameIdentifier(profile.username)) {
    throw new CredentialError('INVALID_INPUT');
  }
  if (isPrivilegedProfile(profile) && !options.allowPrivileged) {
    throw new CredentialError('PRIVILEGED_PROFILE_RESTRICTED');
  }

  const basePath = options.basePath;
  const filePath = profilesFilePath(basePath);
  return withFileLock(filePath, () => {
    const existing = readProfiles(basePath);
    if (existing.some((p) => p.id === profile.id)) {
      throw new CredentialError('PROFILE_ALREADY_EXISTS');
    }
    if (profile.alias) {
      const aliasNorm = normalizeCase(profile.alias);
      const duplicateAlias = existing.some(
        (p) =>
          p.env === profile.env &&
          p.application_id === profile.application_id &&
          ((p.alias && normalizeCase(p.alias) === aliasNorm) ||
            (Array.isArray(p.aliases) && p.aliases.some((a) => normalizeCase(a) === aliasNorm)))
      );
      if (duplicateAlias) {
        throw new CredentialError('PROFILE_ALREADY_EXISTS');
      }
    }

    const updated = [...existing, profile];
    const payload = { _version: '1' as const, profiles: updated };
    if (!validator.validateProfiles(payload).valid) {
      throw new CredentialError('INVALID_INPUT');
    }
    atomicPrivateWrite(filePath, JSON.stringify(payload, null, 2));
    return profile;
  });
}

/**
 * Actualiza un perfil existente gestionando de forma segura el cambio de username sin reasociar contraseñas.
 */
export function updateProfile(
  profileId: string,
  patch: Partial<AuthProfile>,
  options: ProfileMutationOptions = {}
): ProfileUpdateResult {
  safeProfileId(profileId);
  if (patch.id !== undefined && patch.id !== profileId) {
    throw new CredentialError('INVALID_INPUT');
  }
  if (patch.username !== undefined && !isValidUsernameIdentifier(patch.username)) {
    throw new CredentialError('INVALID_INPUT');
  }

  const basePath = options.basePath;
  const filePath = profilesFilePath(basePath);
  return withFileLock(filePath, () => {
    const existing = readProfiles(basePath);
    const index = existing.findIndex((p) => p.id === profileId);
    if (index < 0) {
      throw new CredentialError('PROFILE_NOT_FOUND');
    }
    const previousProfile = existing[index]!;
    if ((isPrivilegedProfile(previousProfile) || isPrivilegedProfile({ ...previousProfile, ...patch })) && !options.allowPrivileged) {
      throw new CredentialError('PRIVILEGED_PROFILE_RESTRICTED');
    }

    const usernameChanged = patch.username !== undefined && patch.username !== previousProfile.username;
    let previousAccounts: PreviousAccountReference[] | undefined = previousProfile.previous_accounts
      ? [...previousProfile.previous_accounts]
      : undefined;

    if (usernameChanged) {
      const entry: PreviousAccountReference = {
        username: previousProfile.username,
        changed_at: new Date().toISOString(),
        credential_handling: options.credentialHandlingOnUsernameChange ?? 'preserved',
      };
      previousAccounts = [...(previousAccounts ?? []), entry].slice(-32);
    }

    const nextProfile: AuthProfile = {
      ...previousProfile,
      ...patch,
      id: profileId,
      ...(previousAccounts ? { previous_accounts: previousAccounts } : {}),
      // Si cambia el username, la verificación previa ya no aplica a la nueva identidad
      ...(usernameChanged ? { verified: undefined, verified_at: undefined, verified_route: undefined } : {}),
    };

    if (nextProfile.verified === undefined) delete nextProfile.verified;
    if (nextProfile.verified_at === undefined) delete nextProfile.verified_at;
    if (nextProfile.verified_route === undefined) delete nextProfile.verified_route;

    const updated = [...existing];
    updated[index] = nextProfile;
    const payload = { _version: '1' as const, profiles: updated };
    if (!validator.validateProfiles(payload).valid) {
      throw new CredentialError('INVALID_INPUT');
    }
    atomicPrivateWrite(filePath, JSON.stringify(payload, null, 2));
    return {
      profile: nextProfile,
      previousProfile,
      usernameChanged,
      ...(usernameChanged ? { previousUsername: previousProfile.username } : {}),
    };
  });
}
