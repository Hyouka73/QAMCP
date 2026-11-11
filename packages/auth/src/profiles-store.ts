import { existsSync, lstatSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { AuthProfile } from '@qap/shared';

import { CredentialError } from './credential-provider.js';
import { safeDirectory, safeProfileId } from './secure-files.js';

export function readProfiles(basePath?: string): AuthProfile[] {
  const profilesPath = join(basePath ?? process.cwd(), '.qa', 'project', 'auth', 'profiles.json');
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
