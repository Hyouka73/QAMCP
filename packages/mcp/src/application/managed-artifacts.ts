import { createHash, randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  assertSafeHostPath,
  atomicWritePrivateFile,
  ensurePrivateDir,
  listSafeFiles,
  resolveContainedPath,
  safeDeleteOwnedPath,
} from './safe-storage.js';

export type ManagedArtifactCategory =
  | 'screenshots'
  | 'traces'
  | 'reports'
  | 'sessions'
  | 'imports'
  | 'misc';

export interface StoredArtifactReceipt {
  readonly artifact_id: string;
  readonly project_id: string;
  readonly category: ManagedArtifactCategory;
  readonly relative_path: string;
  readonly absolute_path: string;
  readonly sha256: string;
  readonly bytes: number;
  readonly created_at: string;
}

export interface StoredRecoveryBundle {
  readonly bundle_path: string;
  readonly sha256: string;
  readonly created_at: string;
}

/**
 * Host-managed private artifact store keyed strictly by project_id.
 * Keeps project storage physically isolated and trackable for safe cleanup.
 */
export class ManagedArtifactStore {
  readonly rootDir: string;

  constructor(hostRootDir: string) {
    this.rootDir = ensurePrivateDir(hostRootDir);
  }

  projectDir(projectId: string): string {
    if (!/^[a-zA-Z0-9._-]{3,128}$/.test(projectId)) {
      throw new Error('Invalid project_id for managed artifact storage');
    }
    return resolveContainedPath(join(this.rootDir, 'projects'), projectId);
  }

  ensureProjectWorkspace(projectId: string): {
    projectDir: string;
    knowledgeDbPath: string;
    artifactsDir: string;
    sessionsDir: string;
  } {
    const base = ensurePrivateDir(this.projectDir(projectId));
    const artifactsDir = ensurePrivateDir(join(base, 'artifacts'));
    const sessionsDir = ensurePrivateDir(join(base, 'sessions'));
    return {
      projectDir: base,
      knowledgeDbPath: resolveContainedPath(base, 'knowledge.sqlite'),
      artifactsDir,
      sessionsDir,
    };
  }

  writeProjectArtifact(
    projectId: string,
    category: ManagedArtifactCategory,
    relativeName: string,
    content: string | Buffer,
  ): StoredArtifactReceipt {
    const layout = this.ensureProjectWorkspace(projectId);
    const subDir = category === 'sessions' ? layout.sessionsDir : ensurePrivateDir(join(layout.artifactsDir, category));
    const safeTarget = resolveContainedPath(subDir, relativeName);
    const buf = typeof content === 'string' ? Buffer.from(content, 'utf8') : content;
    atomicWritePrivateFile(safeTarget, buf);
    const sha256 = createHash('sha256').update(buf).digest('hex');
    const relFromProject = category === 'sessions'
      ? join('sessions', relativeName).replaceAll('\\', '/')
      : join('artifacts', category, relativeName).replaceAll('\\', '/');
    return {
      artifact_id: randomUUID(),
      project_id: projectId,
      category,
      relative_path: relFromProject,
      absolute_path: safeTarget,
      sha256,
      bytes: buf.byteLength,
      created_at: new Date().toISOString(),
    };
  }

  readProjectArtifact(projectId: string, relativePath: string): Buffer | null {
    const base = this.projectDir(projectId);
    const safeTarget = resolveContainedPath(base, relativePath);
    if (!existsSync(safeTarget)) return null;
    return readFileSync(assertSafeHostPath(safeTarget));
  }

  listOwnedProjectPaths(projectId: string): string[] {
    const base = this.projectDir(projectId);
    if (!existsSync(base)) return [];
    return listSafeFiles(base);
  }

  purgeProjectDirectory(projectId: string): string[] {
    const projectsBoundary = ensurePrivateDir(join(this.rootDir, 'projects'));
    const base = this.projectDir(projectId);
    if (!existsSync(base)) return [];
    const existingFiles = listSafeFiles(base);
    safeDeleteOwnedPath(base, projectsBoundary);
    return [base, ...existingFiles];
  }

  readProjectArtifactJson<T = Record<string, unknown>>(projectId: string, category: ManagedArtifactCategory, relativeName: string): T | null {
    const base = this.projectDir(projectId);
    const dir = category === 'sessions' ? join(base, 'sessions') : join(base, 'artifacts', category);
    if (!existsSync(dir)) return null;
    const safeTarget = resolveContainedPath(dir, relativeName);
    if (!existsSync(safeTarget)) return null;
    const raw = readFileSync(assertSafeHostPath(safeTarget), 'utf8');
    return JSON.parse(raw) as T;
  }

  writeRecoveryBundle(projectId: string, payload: unknown): StoredRecoveryBundle {
    if (!/^[a-zA-Z0-9._-]{3,128}$/.test(projectId)) {
      throw new Error('Invalid project_id for recovery bundle');
    }
    const recoveryDir = ensurePrivateDir(join(this.rootDir, 'recovery'));
    const createdAt = new Date().toISOString();
    const stampedName = `${projectId}-${createdAt.replace(/[:.]/g, '-')}.recovery.json`;
    const latestName = `${projectId}.latest.recovery.json`;
    const serialized = JSON.stringify(payload, null, 2);
    const sha256 = createHash('sha256').update(serialized).digest('hex');
    const stampedPath = resolveContainedPath(recoveryDir, stampedName);
    const latestPath = resolveContainedPath(recoveryDir, latestName);
    atomicWritePrivateFile(stampedPath, serialized);
    atomicWritePrivateFile(latestPath, serialized);
    return {
      bundle_path: stampedPath,
      sha256,
      created_at: createdAt,
    };
  }

  readLatestRecoveryBundle<T = Record<string, unknown>>(projectId: string): { path: string; sha256: string; data: T } | null {
    if (!/^[a-zA-Z0-9._-]{3,128}$/.test(projectId)) return null;
    const recoveryDir = join(this.rootDir, 'recovery');
    if (!existsSync(recoveryDir)) return null;
    const latestPath = resolveContainedPath(recoveryDir, `${projectId}.latest.recovery.json`);
    if (!existsSync(latestPath)) return null;
    const raw = readFileSync(assertSafeHostPath(latestPath), 'utf8');
    return {
      path: latestPath,
      sha256: createHash('sha256').update(raw).digest('hex'),
      data: JSON.parse(raw) as T,
    };
  }
}
