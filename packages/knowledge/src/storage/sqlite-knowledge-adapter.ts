/* eslint-disable @typescript-eslint/require-await -- Promise port over synchronous SQLite; never yield inside a transaction. */
import { createHmac } from 'node:crypto';
import { createRequire } from 'node:module';
import type { DatabaseSync, SQLInputValue } from 'node:sqlite';

import {
  KnowledgeStoreError, type IKnowledgeStore, type KnowledgeKind, type KnowledgeRecord,
  type KnowledgeRef, type KnowledgeWrite, type KnowledgeQuery, type KnowledgePageRequest,
  type KnowledgePage,
  type IActionTargetSearch, type ActionTargetSearchRequest, type ActionTargetSearchHit,
} from '@qap/engine';

import { KnowledgeCommitPlanner } from './knowledge-commit-planner.js';
import { knowledgeKinds } from './knowledge-shape.js';
import { initializeKnowledgeSchema, SCHEMA_VERSION } from './knowledge-sqlite-schema.js';

export interface SqliteKnowledgeOptions {
  /** Bounded synchronous lock wait, default 1000 ms; no automatic commit retries. */
  busy_timeout_ms?: number;
}
type Row = Record<string, unknown>;
function fail(code: KnowledgeStoreError['code']): never {
  throw new KnowledgeStoreError(code, `Knowledge store: ${code}`);
}
const identity = (value: unknown): void => {
  if (typeof value !== 'string' || !value.trim() || Buffer.from(value).toString() !== value) fail('INVALID_DATA');
};
const kindCheck = (kind: KnowledgeKind): void => {
  if (!knowledgeKinds.includes(kind)) fail('INVALID_DATA');
};

/** Opt-in local adapter. Does not discover/adopt legacy databases or browser directories.
 * DatabaseSync blocks the calling thread: compose in a worker for latency-sensitive hosts.
 */
export class SqliteKnowledgeAdapter implements IKnowledgeStore, IActionTargetSearch {
  readonly contract_version = 1 as const;
  readonly schema_version = SCHEMA_VERSION;
  private readonly db: DatabaseSync;
  private readonly cursorKey: string;
  private closed = false;
  private readonly planner = new KnowledgeCommitPlanner();

  constructor(path: string, options: SqliteKnowledgeOptions = {}) {
    identity(path);
    const timeout = options.busy_timeout_ms ?? 1000;
    if (!Number.isSafeInteger(timeout) || timeout < 0 || timeout > 60_000) fail('INVALID_DATA');
    try {
      // Lazy builtin load preserves legacy consumers on older Node runtimes. node:sqlite
      // must retain its prefix (bare 'sqlite' is not a builtin in downstream bundles).
      const loadBuiltin = createRequire(import.meta.url);
      const sqlite = loadBuiltin('node:sqlite') as typeof import('node:sqlite');
      this.db = new sqlite.DatabaseSync(path);
    } catch { fail('UNAVAILABLE'); }
    try {
      this.db.exec(`PRAGMA busy_timeout = ${timeout}; PRAGMA foreign_keys = ON`);
      // Builtin builds differ: Node 22.13.1 Windows lacks ENABLE_FTS5. Refuse
      // before any migration/journal change; never load native extensions implicitly.
      if (this.db.prepare("SELECT sqlite_compileoption_used('ENABLE_FTS5') AS enabled").get()!.enabled !== 1) {
        throw new KnowledgeStoreError('UNAVAILABLE', 'Knowledge store requires SQLite FTS5');
      }
      this.cursorKey = this.transaction('IMMEDIATE', () => initializeKnowledgeSchema(this.db));
      // Reject foreign/unknown schemas before any persistent journal mode change.
      if (path !== ':memory:' && this.db.prepare('PRAGMA journal_mode = WAL').get()!.journal_mode !== 'wal') fail('UNAVAILABLE');
      this.db.exec('PRAGMA synchronous = FULL');
    } catch (error) {
      this.db.close();
      if (error instanceof KnowledgeStoreError) throw error;
      fail('SCHEMA_MISMATCH');
    }
  }

  close(): void {
    if (!this.closed) { this.db.close(); this.closed = true; }
  }

  async searchActionTargets(request: ActionTargetSearchRequest): Promise<ActionTargetSearchHit[]> {
    if (!request || typeof request !== 'object') fail('INVALID_DATA');
    identity(request.application_id);
    const limit = request.limit ?? 20;
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100 ||
      typeof request.query !== 'string' || request.query.length > 2048 ||
      Buffer.from(request.query).toString() !== request.query ||
      (request.include_inactive !== undefined && typeof request.include_inactive !== 'boolean')) fail('INVALID_DATA');
    for (const value of [request.view_id, request.module_id, request.environment_id, request.role_id]) {
      if (value !== undefined) identity(value);
    }
    // Never forward raw MATCH syntax. Punctuation (including CSS/XPath syntax) is a
    // separator; each Unicode word is a quoted literal. OR tolerates brief prose.
    const words = request.query.normalize('NFC').match(/[\p{L}\p{N}\p{M}]+/gu) ?? [];
    if (words.length > 64) fail('INVALID_DATA');
    const expression = [...new Set(words)].map(word => `"${word}"`).join(' OR ');
    return this.transaction('DEFERRED', () => {
      if (!expression) return [];
      const params: SQLInputValue[] = [expression, request.application_id];
      // CROSS JOIN fixes FTS before the application index: ordinary JOIN can run
      // one MATCH per target instead of looking up each matching rowid once.
      let sql = `SELECT r.*, bm25(action_targets_fts, 10.0, 4.0, 2.0, 1.0) AS score
        FROM action_targets_fts CROSS JOIN action_target_search s ON s.rowid = action_targets_fts.rowid
        JOIN knowledge_revisions r ON r.application_id = s.application_id AND r.kind = s.kind
          AND r.id = s.id AND r.revision = s.revision
        WHERE action_targets_fts MATCH ? AND s.application_id = ?`;
      if (!request.include_inactive) sql += " AND json_extract(r.entity_json, '$.is_active') = 1";
      if (request.view_id !== undefined) {
        sql += " AND json_extract(r.entity_json, '$.view_id') = ?"; params.push(request.view_id);
      }
      if (request.module_id !== undefined) {
        sql += ` AND EXISTS (SELECT 1 FROM knowledge_links l JOIN knowledge_revisions v
          ON v.application_id = l.application_id AND v.kind = l.target_kind
            AND v.id = l.target_id AND v.revision = l.target_revision
          WHERE l.application_id = r.application_id AND l.source_kind = r.kind AND l.source_id = r.id
            AND l.source_revision = r.revision AND l.target_kind = 'view'
            AND json_extract(v.entity_json, '$.module_id') = ?)`;
        params.push(request.module_id);
      }
      for (const field of ['environment_id', 'role_id'] as const) {
        if (request[field] !== undefined) {
          sql += ` AND json_extract(r.trace_json, '$.${field}') = ?`; params.push(request[field]);
        }
      }
      sql += ' ORDER BY score, r.id_order LIMIT ?'; params.push(limit);
      return this.db.prepare(sql).all(...params).map(row => ({
        target: this.record(row) as KnowledgeRecord<'action_target'>, score: Number(row.score),
      }));
    });
  }

  async get<K extends KnowledgeKind>(app: string, kind: K, id: string, revision?: number): Promise<KnowledgeRecord<K> | null> {
    identity(app); identity(id); kindCheck(kind);
    if (revision !== undefined && (!Number.isSafeInteger(revision) || revision < 1)) fail('INVALID_DATA');
    return this.transaction('DEFERRED', () => {
      const row = this.db.prepare(`SELECT * FROM knowledge_revisions WHERE application_id = ? AND kind = ? AND id = ?
        ${revision === undefined ? 'ORDER BY revision DESC LIMIT 1' : 'AND revision = ?'}`)
        .get(...[app, kind, id, ...(revision === undefined ? [] : [revision])]);
      return row ? this.record(row) as KnowledgeRecord<K> : null;
    });
  }

  async query<K extends KnowledgeKind>(app: string, kind: K, query: KnowledgeQuery = {}): Promise<KnowledgePage<KnowledgeRecord<K>>> {
    identity(app); kindCheck(kind);
    if (!query || typeof query !== 'object') fail('INVALID_DATA');
    const ref = query.references;
    if (ref !== undefined) {
      if (!ref || typeof ref !== 'object') fail('INVALID_DATA');
      kindCheck(ref.kind); identity(ref.id);
      if (ref.revision !== undefined && (!Number.isSafeInteger(ref.revision) || ref.revision < 1)) fail('INVALID_DATA');
    }
    const params: SQLInputValue[] = [app, kind];
    let sql = `SELECT r.* FROM knowledge_revisions r WHERE r.application_id = ? AND r.kind = ?
      AND r.revision = (SELECT max(n.revision) FROM knowledge_revisions n
        WHERE n.application_id = r.application_id AND n.kind = r.kind AND n.id = r.id)`;
    if (ref) {
      sql += ` AND EXISTS (SELECT 1 FROM knowledge_links l WHERE l.application_id = r.application_id
        AND l.source_kind = r.kind AND l.source_id = r.id AND l.source_revision = r.revision
        AND l.target_kind = ? AND l.target_id = ? ${ref.revision === undefined ? '' : 'AND l.target_revision = ?'})`;
      params.push(ref.kind, ref.id, ...(ref.revision === undefined ? [] : [ref.revision]));
    }
    // JS contract sorts UTF-16 IDs; binary UTF-8 order differs for astral characters.
    sql += ' ORDER BY r.id_order';
    return this.readPage<K>(app, JSON.stringify(['query', kind, ref ? [ref.kind, ref.id, ref.revision ?? null] : null]), sql, params, query);
  }

  async history<K extends KnowledgeKind>(app: string, kind: K, id: string, page: KnowledgePageRequest = {}): Promise<KnowledgePage<KnowledgeRecord<K>>> {
    identity(app); identity(id); kindCheck(kind);
    return this.readPage<K>(app, JSON.stringify(['history', kind, id]),
      'SELECT * FROM knowledge_revisions WHERE application_id = ? AND kind = ? AND id = ? ORDER BY revision', [app, kind, id], page);
  }

  async commit(app: string, writes: readonly KnowledgeWrite[]): Promise<KnowledgeRecord[]> {
    identity(app);
    // Scan before acquiring the writer lock. Never yield while holding a transaction.
    let prepared: KnowledgeWrite[];
    try { prepared = this.planner.prepare(writes); } catch { return fail('INVALID_DATA'); }
    return this.transaction('IMMEDIATE', () => {
      const staged = new Map<string, KnowledgeRecord>();
      for (const row of this.db.prepare(`SELECT r.* FROM knowledge_revisions r WHERE r.application_id = ?
        AND r.revision = (SELECT max(n.revision) FROM knowledge_revisions n
          WHERE n.application_id = r.application_id AND n.kind = r.kind AND n.id = r.id)`).all(app)) {
        const record = this.record(row, false);
        const key = JSON.stringify([record.kind, record.id]);
        staged.set(key, record);
      }
      let records: KnowledgeRecord[];
      const historical = this.db.prepare('SELECT 1 FROM knowledge_revisions WHERE application_id = ? AND kind = ? AND id = ? AND revision = ?');
      try { records = this.planner.plan(app, prepared, staged,
        ref => !!historical.get(app, ref.kind, ref.id, ref.revision!)); } catch (error) {
        if (error instanceof KnowledgeStoreError) throw error;
        return fail('INVALID_DATA');
      }
      this.db.prepare('INSERT INTO knowledge_scopes VALUES (?, 0) ON CONFLICT DO NOTHING').run(app);
      const version = Number(this.db.prepare('SELECT version FROM knowledge_scopes WHERE application_id = ?').get(app)!.version) + 1;
      const insert = this.db.prepare('INSERT INTO knowledge_revisions VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      const link = this.db.prepare('INSERT INTO knowledge_links VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      for (const record of records) {
        identity(record.id);
        insert.run(app, record.kind, record.id, record.revision, Buffer.from(record.id, 'utf16le').swap16(), version, JSON.stringify(record.entity), JSON.stringify(record.trace));
        record.references.forEach((ref, ordinal) => link.run(app, record.kind, record.id, record.revision, ordinal, ref.kind, ref.id, ref.revision!));
      }
      this.db.prepare('UPDATE knowledge_scopes SET version = version + 1 WHERE application_id = ?').run(app);
      return records;
    });
  }

  private record(row: Row, includeReferences = true): KnowledgeRecord {
    const references = includeReferences ? this.db.prepare(`SELECT target_kind AS kind, target_id AS id, target_revision AS revision
      FROM knowledge_links WHERE application_id = ? AND source_kind = ? AND source_id = ? AND source_revision = ? ORDER BY ordinal`)
      .all(String(row.application_id), String(row.kind), String(row.id), Number(row.revision)) as unknown as KnowledgeRef[] : [];
    return { application_id: String(row.application_id), kind: row.kind as KnowledgeKind, id: String(row.id), revision: Number(row.revision),
      entity: JSON.parse(String(row.entity_json)) as KnowledgeRecord['entity'],
      trace: JSON.parse(String(row.trace_json)) as KnowledgeRecord['trace'], references };
  }

  private readPage<K extends KnowledgeKind>(app: string, query: string, sql: string, params: SQLInputValue[], page: KnowledgePageRequest): KnowledgePage<KnowledgeRecord<K>> {
    if (!page || typeof page !== 'object') fail('INVALID_DATA');
    const limit = page.limit ?? 50;
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) fail('INVALID_DATA');
    return this.transaction('DEFERRED', () => {
      const version = Number(this.db.prepare('SELECT version FROM knowledge_scopes WHERE application_id = ?').get(app)?.version ?? 0);
      let offset = 0;
      if (page.cursor !== undefined) {
        try {
          if (typeof page.cursor !== 'string') fail('INVALID_CURSOR');
          const [payload, signature, ...extra] = page.cursor.split('.');
          if (extra.length || this.sign(payload) !== signature) fail('INVALID_CURSOR');
          const decoded: unknown = JSON.parse(Buffer.from(payload, 'base64url').toString());
          if (!Array.isArray(decoded) || decoded.length !== 4 || decoded[0] !== app || decoded[1] !== query ||
            decoded[2] !== version || !Number.isSafeInteger(decoded[3]) || Number(decoded[3]) < 0) fail('INVALID_CURSOR');
          offset = Number(decoded[3]);
        } catch { fail('INVALID_CURSOR'); }
      }
      const rows = this.db.prepare(`${sql} LIMIT ? OFFSET ?`).all(...params, limit + 1, offset);
      const payload = Buffer.from(JSON.stringify([app, query, version, offset + limit])).toString('base64url');
      return { items: rows.slice(0, limit).map(row => this.record(row) as KnowledgeRecord<K>),
        ...(rows.length > limit ? { next_cursor: `${payload}.${this.sign(payload)}` } : {}) };
    });
  }

  private sign(payload: string): string { return createHmac('sha256', this.cursorKey).update(payload).digest('hex'); }

  private transaction<T>(mode: 'IMMEDIATE' | 'DEFERRED', action: () => T): T {
    if (this.closed) return fail('UNAVAILABLE');
    let begun = false;
    try {
      this.db.exec(`BEGIN ${mode}`); begun = true;
      const result = action();
      this.db.exec('COMMIT');
      return result;
    } catch (error) {
      if (begun) { try { this.db.exec('ROLLBACK'); } catch { /* Preserve sanitized original error. */ } }
      if (error instanceof KnowledgeStoreError) throw error;
      return fail('UNAVAILABLE');
    }
  }
}
