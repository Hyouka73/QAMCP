import { createHash } from 'node:crypto';
import { lstatSync, readFileSync } from 'node:fs';
import { isAbsolute } from 'node:path';

import { normalizePathKey } from './application/safe-storage.js';

export interface FixtureWrite {
  readonly id: string;
  readonly view: string;
  readonly selector: string;
  readonly path: string;
  readonly body: string;
  readonly cleanup: string;
}

export interface AutonomyPolicy {
  readonly origin: string;
  readonly entry: string;
  readonly paths: readonly string[];
  readonly profiles: readonly string[];
  readonly tenant: string | null;
  readonly batchPages: number;
  readonly writes: readonly FixtureWrite[];
  readonly digest: string;
}

export type AutonomyPolicyLookup = (root: string, origin?: string) => AutonomyPolicy | undefined;

const plain = (input: unknown): input is Record<string, unknown> =>
  input !== null && typeof input === 'object' && !Array.isArray(input);
const path = (value: unknown): value is string => typeof value === 'string' && value.length <= 160 &&
  /^\/(?:[a-zA-Z0-9_~-]+(?:\.[a-zA-Z0-9_~-]+)*(?:\/|$))*$/.test(value);

/** Read the operator-owned policy on every admission. Missing or malformed policy fails closed. */
export function loadAutonomyPolicy(file: string): AutonomyPolicyLookup {
  return (root, requestedOrigin) => {
    try {
      const stat = lstatSync(file);
      if (!stat.isFile() || stat.size > 131_072) return;
      const document: unknown = JSON.parse(readFileSync(file, 'utf8'));
      if (!plain(document) || document.version !== 1 || !Array.isArray(document.targets)) return;
      const matches = document.targets.filter(target => plain(target) && typeof target.workspace === 'string' &&
        isAbsolute(target.workspace) && normalizePathKey(target.workspace) === normalizePathKey(root) &&
        (!requestedOrigin || target.origin === requestedOrigin));
      if (matches.length !== 1) return;
      const target = matches[0];
      const origin = new URL(target.origin);
      if (origin.origin !== target.origin || !['http:', 'https:'].includes(origin.protocol) ||
          target.environment !== 'test' || !path(target.entry) || !Array.isArray(target.paths) ||
          target.paths.length < 1 || target.paths.length > 32 || !target.paths.every(path) ||
          !target.paths.includes(target.entry) || new Set(target.paths).size !== target.paths.length) return;
      const profiles = target.profiles ?? [];
      const tenant = target.tenant ?? null;
      const batchPages = target.batchPages ?? 4;
      if (!Array.isArray(profiles) || !profiles.every(value => typeof value === 'string' && /^[\w-]{1,64}$/.test(value)) ||
          (tenant !== null && (typeof tenant !== 'string' || !/^[\w-]{1,128}$/.test(tenant))) ||
          !Number.isSafeInteger(batchPages) || batchPages < 1 || batchPages > 12) return;
      const writes = target.fixtureWrites ?? [];
      if (!Array.isArray(writes) || writes.length > 8 || (writes.length &&
          (origin.hostname !== '127.0.0.1' || profiles.length || tenant !== null || target.isolatedFixture !== true))) return;
      if (!writes.every(write => plain(write) && typeof write.id === 'string' && /^[\w-]{1,60}$/.test(write.id) &&
          path(write.view) && target.paths.includes(write.view) && typeof write.selector === 'string' &&
          write.selector.length <= 120 && /^(?:[a-z]+:nth-of-type\([1-9][0-9]*\)(?: > |$))+$/.test(write.selector) &&
          path(write.path) && path(write.cleanup) &&
          write.path !== write.cleanup && !target.paths.includes(write.path) && !target.paths.includes(write.cleanup) &&
          typeof write.body === 'string' && write.body.length <= 1024 && plain(JSON.parse(write.body))) ||
          new Set(writes.map(write => write.id)).size !== writes.length) return;
      return { origin: origin.origin, entry: target.entry, paths: target.paths, profiles, tenant, batchPages, writes,
        digest: createHash('sha256').update(JSON.stringify(target)).digest('hex') };
    } catch { return undefined; }
  };
}

export function policyAllowsNavigation(policy: AutonomyPolicy, value: string): boolean {
  try {
    const url = new URL(value);
    return url.origin === policy.origin && url.href === value && !url.username && !url.password && !url.search &&
      !url.hash && policy.paths.includes(url.pathname);
  } catch { return false; }
}
