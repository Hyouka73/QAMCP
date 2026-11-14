import { AsyncLocalStorage } from 'node:async_hooks';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { closeSync, existsSync, lstatSync, openSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, isAbsolute } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';

import type { CanonicalGap, CategoryApplicabilityDecision, RequirementCategory } from '@qap/shared';

export interface ClosureScope {
  projectRoot: string;
  applicationId: string;
  environmentId: string;
}

export interface ModuleClosureRecord {
  readonly moduleKey: string;
  readonly moduleId: string;
  readonly moduleRevision: number;
  readonly plannedName: string;
  readonly status: 'closed' | 'waived';
  readonly decisionId: string;
  readonly reviewer: string;
  readonly decidedAt: string;
  readonly requestDigest: string;
  readonly coverageDigest: string;
  readonly waiverReason?: string;
  readonly acceptedGaps?: readonly { readonly gap_id: string; readonly reason: string }[];
  readonly nonApplicableCategories?: readonly { readonly category: RequirementCategory; readonly reason: string }[];
  readonly committedAt: string;
}

export interface ModuleClosureSnapshot {
  readonly scope: ClosureScope;
  readonly closures: Record<string, ModuleClosureRecord>;
  readonly applicabilityDecisions: Record<string, CategoryApplicabilityDecision[]>;
  readonly acceptedGaps: Record<string, CanonicalGap[]>;
  readonly approvals: Array<[string, string]>; // [decisionId, requestDigest]
}

export type ClosureStoreAvailability = 'compatible' | 'not_initialized' | 'incompatible' | 'corrupt' | 'unavailable';

export class ClosureStoreError extends Error {
  constructor(readonly code: ClosureStoreAvailability | 'conflict' | 'context_changed' | 'revision_conflict' | 'write_failed' | 'scope_mismatch' | 'retention_limit' | 'decision_reused' | 'authorization_expired') {
    super(`Module closure store: ${code}`);
  }
}

const commitDeadline = new AsyncLocalStorage<number>();

export function withClosureCommitDeadline<T>(deadlineMs: number, action: () => Promise<T>): Promise<T> {
  if (!Number.isFinite(deadlineMs)) throw new ClosureStoreError('authorization_expired');
  return commitDeadline.run(deadlineMs, action);
}

/**
 * Privileged host contract: SQL closure transaction must execute in the same
 * AsyncLocalStorage context as withClosureCommitDeadline. A wrapper/decorator
 * that queues work using timers/tasks created before the review request is
 * NOT an authorized host composition unless it explicitly propagates the ALS
 * context and rechecks the deadline before physical COMMIT.
 *
 * This interface is structurally typed and cannot enforce propagation at
 * runtime for arbitrary third-party decorators. The standard host composition
 * uses SqliteModuleClosureStore directly; do not claim a universal deadline
 * guarantee for arbitrary IModuleClosureStore implementations.
 */
export interface IModuleClosureStore {
  read(scope: ClosureScope): ModuleClosureSnapshot;
  transaction<T>(scope: ClosureScope, operation: (snapshot: ModuleClosureSnapshot) => Promise<T>): Promise<T>;
  close(): void;
}

export interface SqliteModuleClosureOptions extends ClosureScope {
  path: string;
  key: Uint8Array;
  initialize?: boolean;
  protection: 'host_private_directory_and_managed_key';
}

const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

/**
 * Almacén durable de decisiones de cierre de módulos e historial de autorizaciones (R4).
 * Esquema v1 aislado en SQLite independiente del catálogo canónico, cifrado completo AES-256-GCM.
 */
export class SqliteModuleClosureStore implements IModuleClosureStore {
  private db?: DatabaseSync;
  private readonly key: Buffer;
  private readonly scope: string;
  private readonly identity: ClosureScope;
  private busy = false;
  private availability: ClosureStoreAvailability = 'unavailable';

  constructor(options: SqliteModuleClosureOptions) {
    this.key = Buffer.from(options.key);
    this.identity = { projectRoot: options.projectRoot, applicationId: options.applicationId, environmentId: options.environmentId };
    this.scope = hash([options.projectRoot, options.applicationId, options.environmentId]);

    if (
      this.key.length !== 32 ||
      options.protection !== 'host_private_directory_and_managed_key' ||
      !isAbsolute(options.path) ||
      !isAbsolute(options.projectRoot) ||
      !options.applicationId ||
      !options.environmentId
    ) {
      throw new ClosureStoreError('scope_mismatch');
    }

    try {
      if (realpathSync(options.projectRoot) !== options.projectRoot) throw new ClosureStoreError('scope_mismatch');
      if (realpathSync(dirname(options.path)) !== dirname(options.path)) throw new ClosureStoreError('scope_mismatch');

      if (options.initialize) {
        const fd = openSync(options.path, 'wx', 0o600);
        closeSync(fd);
      } else if (!existsSync(options.path)) {
        this.availability = 'not_initialized';
        return;
      }

      const stat = lstatSync(options.path);
      if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) throw new ClosureStoreError('scope_mismatch');

      const sqlite = createRequire(import.meta.url)('node:sqlite') as typeof import('node:sqlite');
      this.db = new sqlite.DatabaseSync(options.path);
      this.db.exec('PRAGMA busy_timeout=0');

      if (options.initialize) {
        this.db.exec(`BEGIN IMMEDIATE;
          CREATE TABLE closure_meta (version INTEGER NOT NULL, scope TEXT NOT NULL);
          CREATE TABLE closure_history (generation INTEGER PRIMARY KEY, payload BLOB NOT NULL);
          INSERT INTO closure_meta VALUES (1, '${this.scope}'); COMMIT;`);
      }

      const meta = this.db.prepare('SELECT version, scope FROM closure_meta').all() as Array<{ version: number; scope: string }>;
      if (meta.length !== 1 || meta[0].version !== 1) throw new ClosureStoreError('incompatible');
      if (meta[0].scope !== this.scope) throw new ClosureStoreError('scope_mismatch');

      this.db.prepare('SELECT generation, payload FROM closure_history LIMIT 0').all();
      this.db.exec('PRAGMA synchronous=FULL');
      this.availability = 'compatible';
      this.read(options);
      this.db.exec('PRAGMA journal_mode=WAL');
    } catch (error) {
      this.db?.close();
      this.db = undefined;
      const code = error && typeof error === 'object' && 'code' in error ? (error).code : undefined;
      const sqliteCode = error && typeof error === 'object' && 'errcode' in error ? (error).errcode : undefined;
      this.availability =
        (error instanceof ClosureStoreError && error.code === 'corrupt') || sqliteCode === 11 || sqliteCode === 26
          ? 'corrupt'
          : code === 'EACCES' || code === 'EPERM' || code === 'ENOENT'
          ? 'unavailable'
          : 'incompatible';
      if (options.initialize) throw new ClosureStoreError(this.availability);
    }
  }

  close(): void {
    if (this.busy) throw new ClosureStoreError('conflict');
    this.db?.close();
    this.db = undefined;
    this.key.fill(0);
    this.availability = 'unavailable';
  }

  private check(scope: ClosureScope): DatabaseSync {
    if (hash([scope.projectRoot, scope.applicationId, scope.environmentId]) !== this.scope) throw new ClosureStoreError('scope_mismatch');
    if (this.busy) throw new ClosureStoreError('conflict');
    if (!this.db || this.availability !== 'compatible') throw new ClosureStoreError(this.availability);
    return this.db;
  }

  private decode(payload: Uint8Array, generation: number): ModuleClosureSnapshot {
    try {
      const bytes = Buffer.from(payload);
      const decipher = createDecipheriv('aes-256-gcm', this.key, bytes.subarray(0, 12));
      decipher.setAAD(Buffer.from(`${this.scope}:${generation}`));
      decipher.setAuthTag(bytes.subarray(12, 28));
      const snapshot = JSON.parse(
        Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString()
      ) as ModuleClosureSnapshot;

      if (
        !snapshot.scope ||
        hash([snapshot.scope.projectRoot, snapshot.scope.applicationId, snapshot.scope.environmentId]) !== this.scope ||
        !snapshot.closures ||
        typeof snapshot.closures !== 'object' ||
        !Array.isArray(snapshot.approvals) ||
        snapshot.approvals.some(a => !Array.isArray(a) || a.length !== 2 || a.some(v => typeof v !== 'string'))
      ) {
        throw new Error();
      }
      return snapshot;
    } catch {
      throw new ClosureStoreError('corrupt');
    }
  }

  private latest(db: DatabaseSync) {
    const row = db.prepare('SELECT generation, payload FROM closure_history ORDER BY generation DESC LIMIT 1').get() as
      | { generation: number; payload: Uint8Array }
      | undefined;
    return {
      generation: row ? Number(row.generation) : 0,
      snapshot: row
        ? this.decode(row.payload, Number(row.generation))
        : {
            scope: structuredClone(this.identity),
            closures: {},
            applicabilityDecisions: {},
            acceptedGaps: {},
            approvals: [],
          },
    };
  }

  read(scope: ClosureScope): ModuleClosureSnapshot {
    try {
      return this.latest(this.check(scope)).snapshot;
    } catch (error) {
      throw error instanceof ClosureStoreError ? error : new ClosureStoreError('unavailable');
    }
  }

  async transaction<T>(scope: ClosureScope, operation: (snapshot: ModuleClosureSnapshot) => Promise<T>): Promise<T> {
    const db = this.check(scope);
    try {
      db.exec('BEGIN IMMEDIATE');
    } catch {
      throw new ClosureStoreError('conflict');
    }
    this.busy = true;
    try {
      const { snapshot, generation } = this.latest(db);
      const before = JSON.stringify(snapshot);
      const result = await operation(snapshot);
      const deadline = commitDeadline.getStore();
      if (deadline !== undefined && Date.now() >= deadline) throw new ClosureStoreError('authorization_expired');
      if (JSON.stringify(snapshot) !== before) {
        if (generation >= 4096) throw new ClosureStoreError('retention_limit');
        const nonce = randomBytes(12);
        const cipher = createCipheriv('aes-256-gcm', this.key, nonce);
        cipher.setAAD(Buffer.from(`${this.scope}:${generation + 1}`));
        const ciphertext = Buffer.concat([cipher.update(JSON.stringify(snapshot)), cipher.final()]);
        const payload = Buffer.concat([nonce, cipher.getAuthTag(), ciphertext]);
        db.prepare('INSERT INTO closure_history(generation, payload) VALUES (?, ?)').run(generation + 1, payload);
      }
      if (deadline !== undefined && Date.now() >= deadline) throw new ClosureStoreError('authorization_expired');
      db.exec('COMMIT');
      return result;
    } catch (error) {
      try {
        db.exec('ROLLBACK');
      } catch {
        this.availability = 'unavailable';
      }
      throw error instanceof ClosureStoreError ? error : new ClosureStoreError('write_failed');
    } finally {
      this.busy = false;
    }
  }
}
