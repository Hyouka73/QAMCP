import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AuthProfile } from '@qap/shared';

const PROFILES_PATH = join(process.cwd(), '.qa', 'project', 'auth', 'profiles.json');

export async function readProfile(profileId: string): Promise<AuthProfile | null> {
  if (!existsSync(PROFILES_PATH)) return null;
  const raw = readFileSync(PROFILES_PATH, 'utf-8');
  const parsed = JSON.parse(raw) as { profiles: AuthProfile[] };
  return parsed.profiles.find((p) => p.id === profileId) ?? null;
}