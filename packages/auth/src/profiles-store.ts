import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { AuthProfile } from '@qap/shared';

export function readProfile(profileId: string, basePath?: string): Promise<AuthProfile | null> {
  const profilesPath = join(basePath ?? process.cwd(), '.qa', 'project', 'auth', 'profiles.json');
  if (!existsSync(profilesPath)) return Promise.resolve(null);

  const raw = readFileSync(profilesPath, 'utf-8');
  const parsed = JSON.parse(raw) as { profiles: AuthProfile[] };

  return Promise.resolve(parsed.profiles?.find((p) => p.id === profileId) ?? null);
}