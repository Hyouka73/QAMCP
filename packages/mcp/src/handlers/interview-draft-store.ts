import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { closeSync, existsSync, lstatSync, openSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, isAbsolute } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';

import type { InterviewQuestion } from './canonical-interview-service.js';

export interface InterviewScope { projectRoot: string; applicationId: string; environmentId: string }
export interface InterviewDraftSnapshot {
  scope: InterviewScope;
  questions: InterviewQuestion[];
  /** Consumed decision IDs/digests only, never gateway tokens or decision objects. */
  approvals: Array<[string, string]>;
}
export type DraftAvailability = 'compatible' | 'not_initialized' | 'incompatible' | 'corrupt' | 'unavailable';
export class InterviewDraftError extends Error {
  constructor(readonly code: DraftAvailability | 'conflict' | 'write_failed' | 'scope_mismatch' | 'retention_limit') {
    super(`Interview draft store: ${code}`);
  }
}
/** Internal privileged port. The callback holds an exclusive cross-connection writer
 * reservation until completion. Implementations must rollback on callback/write failure.
 * Reads never initialize storage; only the host may provision or erase drafts.
 */
export interface IInterviewDraftStore {
  read(scope: InterviewScope): InterviewDraftSnapshot;
  transaction<T>(scope: InterviewScope, operation: (snapshot: InterviewDraftSnapshot) => Promise<T>): Promise<T>;
}
export interface SqliteInterviewDraftOptions extends InterviewScope {
  path: string;
  /** 32 random bytes, supplied from a protected host secret provider, never MCP. */
  key: Uint8Array;
  /** Explicit provisioning; refuses every existing file, including an empty file. */
  initialize?: boolean;
  /** Host attestation: private directory/ACL, restricted key access and deliberate
   * retention/deletion of this database AND backups have been configured. */
  protection: 'host_private_directory_and_managed_key';
}
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

/** Separate schema v1. All payloads/history encrypted with AES-256-GCM, random nonce,
 * scope+generation AAD. SQLite receives ciphertext only (including WAL/journals).
 * No automatic migration, pruning, file discovery or canonical knowledge writes.
 */
export class SqliteInterviewDraftStore implements IInterviewDraftStore {
  private db?: DatabaseSync;
  private readonly key: Buffer;
  private readonly scope: string;
  private readonly identity: InterviewScope;
  private busy = false;
  private availability: DraftAvailability = 'unavailable';
  constructor(options: SqliteInterviewDraftOptions) {
    this.key = Buffer.from(options.key);
    this.identity = { projectRoot: options.projectRoot, applicationId: options.applicationId, environmentId: options.environmentId };
    this.scope = hash([options.projectRoot, options.applicationId, options.environmentId]);
    if (this.key.length !== 32 || options.protection !== 'host_private_directory_and_managed_key' ||
      !isAbsolute(options.path) || !isAbsolute(options.projectRoot) || !options.applicationId || !options.environmentId) throw new InterviewDraftError('scope_mismatch');
    try {
      if (realpathSync(options.projectRoot) !== options.projectRoot) throw new InterviewDraftError('scope_mismatch');
      // Host must provision the private parent itself. Never follow a file symlink,
      // junction parent or hardlink. Same-account filesystem races remain a host concern.
      if (realpathSync(dirname(options.path)) !== dirname(options.path)) throw new InterviewDraftError('scope_mismatch');
      if (options.initialize) {
        const fd = openSync(options.path, 'wx', 0o600); closeSync(fd);
      } else if (!existsSync(options.path)) { this.availability = 'not_initialized'; return; }
      const stat = lstatSync(options.path);
      if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) throw new InterviewDraftError('scope_mismatch');
      const sqlite = createRequire(import.meta.url)('node:sqlite') as typeof import('node:sqlite');
      this.db = new sqlite.DatabaseSync(options.path);
      this.db.exec('PRAGMA busy_timeout=0');
      if (options.initialize) {
        this.db.exec(`BEGIN IMMEDIATE;
          CREATE TABLE interview_meta (version INTEGER NOT NULL, scope TEXT NOT NULL);
          CREATE TABLE interview_history (generation INTEGER PRIMARY KEY, payload BLOB NOT NULL);
          INSERT INTO interview_meta VALUES (1, '${this.scope}'); COMMIT;`);
      }
      const meta = this.db.prepare('SELECT version, scope FROM interview_meta').all();
      if (meta.length !== 1 || meta[0].version !== 1) throw new InterviewDraftError('incompatible');
      if (meta[0].scope !== this.scope) throw new InterviewDraftError('scope_mismatch');
      this.db.prepare('SELECT generation, payload FROM interview_history LIMIT 0').all();
      this.db.exec('PRAGMA synchronous=FULL');
      this.availability = 'compatible';
      this.read(options); // Authenticate before enabling writes or changing journal mode.
      this.db.exec('PRAGMA journal_mode=WAL');
    } catch (error) {
      this.db?.close(); this.db = undefined;
      const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
      const sqliteCode = error && typeof error === 'object' && 'errcode' in error ? error.errcode : undefined;
      this.availability = error instanceof InterviewDraftError && error.code === 'corrupt' || sqliteCode === 11 || sqliteCode === 26 ? 'corrupt' :
        code === 'EACCES' || code === 'EPERM' || code === 'ENOENT' ? 'unavailable' : 'incompatible';
      if (options.initialize) throw new InterviewDraftError(this.availability);
    }
  }
  close(): void { if (this.busy) throw new InterviewDraftError('conflict'); this.db?.close(); this.db = undefined; this.key.fill(0); this.availability = 'unavailable'; }
  private check(scope: InterviewScope): DatabaseSync {
    if (hash([scope.projectRoot, scope.applicationId, scope.environmentId]) !== this.scope) throw new InterviewDraftError('scope_mismatch');
    if (this.busy) throw new InterviewDraftError('conflict');
    if (!this.db || this.availability !== 'compatible') throw new InterviewDraftError(this.availability);
    return this.db;
  }
  private decode(payload: Uint8Array, generation: number): InterviewDraftSnapshot {
    try {
      const bytes = Buffer.from(payload), decipher = createDecipheriv('aes-256-gcm', this.key, bytes.subarray(0, 12));
      decipher.setAAD(Buffer.from(`${this.scope}:${generation}`)); decipher.setAuthTag(bytes.subarray(12, 28));
      const snapshot = JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString()) as InterviewDraftSnapshot;
      if (!snapshot.scope || hash([snapshot.scope.projectRoot, snapshot.scope.applicationId, snapshot.scope.environmentId]) !== this.scope ||
        !Array.isArray(snapshot.questions) || snapshot.questions.length > 1024 || !Array.isArray(snapshot.approvals) ||
        snapshot.approvals.some(a => !Array.isArray(a) || a.length !== 2 || a.some(v => typeof v !== 'string')) ||
        new Set(snapshot.questions.map(q => q.id)).size !== snapshot.questions.length || snapshot.questions.some(q =>
          q.id !== `interview:${hash([q.context, q.category])}` || !q.context || !q.module ||
          !['proposito', 'actor', 'campo', 'accion', 'error', 'dato', 'sensibilidad'].includes(q.category) ||
          !['proposal', 'pending_review', 'corrected', 'deferred', 'rejected', 'confirmed'].includes(q.state) ||
          !Number.isSafeInteger(q.version) || q.version < 0 ||
          (q.proposal && hash(q.proposal) !== q.proposalDigest))) throw new Error();
      return snapshot;
    } catch { throw new InterviewDraftError('corrupt'); }
  }
  private latest(db: DatabaseSync) {
    const row = db.prepare('SELECT generation, payload FROM interview_history ORDER BY generation DESC LIMIT 1').get();
    return { generation: row ? Number(row.generation) : 0,
      snapshot: row ? this.decode(row.payload as Uint8Array, Number(row.generation)) : { scope: structuredClone(this.identity), questions: [], approvals: [] } };
  }
  read(scope: InterviewScope): InterviewDraftSnapshot {
    try { return this.latest(this.check(scope)).snapshot; }
    catch (error) { throw error instanceof InterviewDraftError ? error : new InterviewDraftError('unavailable'); }
  }
  async transaction<T>(scope: InterviewScope, operation: (snapshot: InterviewDraftSnapshot) => Promise<T>): Promise<T> {
    const db = this.check(scope);
    try { db.exec('BEGIN IMMEDIATE'); } catch { throw new InterviewDraftError('conflict'); }
    this.busy = true;
    try {
      const { snapshot, generation } = this.latest(db), before = JSON.stringify(snapshot);
      const result = await operation(snapshot);
      if (JSON.stringify(snapshot) !== before) {
        // Bounded storage; retention requires deliberate host review, never silent loss.
        if (generation >= 4096) throw new InterviewDraftError('retention_limit');
        const nonce = randomBytes(12), cipher = createCipheriv('aes-256-gcm', this.key, nonce);
        cipher.setAAD(Buffer.from(`${this.scope}:${generation + 1}`));
        const ciphertext = Buffer.concat([cipher.update(JSON.stringify(snapshot)), cipher.final()]);
        const payload = Buffer.concat([nonce, cipher.getAuthTag(), ciphertext]);
        db.prepare('INSERT INTO interview_history(generation,payload) VALUES (?,?)').run(generation + 1, payload);
      }
      db.exec('COMMIT'); return result;
    } catch (error) {
      try { db.exec('ROLLBACK'); } catch { this.availability = 'unavailable'; }
      throw error instanceof InterviewDraftError ? error : new InterviewDraftError('write_failed');
    } finally { this.busy = false; }
  }
}
