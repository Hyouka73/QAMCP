import { createHash, randomBytes } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';

import { KnowledgeStoreError } from '@qap/engine';

export const SCHEMA_VERSION = 1;
const APPLICATION_ID = 0x5141504b; // QAPK; never adopt an unmarked Reporter database.
const definitions = [
  `CREATE TABLE knowledge_migrations (
    version INTEGER PRIMARY KEY, checksum TEXT NOT NULL, applied_at TEXT NOT NULL,
    integrity_result TEXT NOT NULL CHECK(integrity_result = 'ok'), cursor_key TEXT NOT NULL
  ) STRICT`,
  `CREATE TABLE knowledge_scopes (
    application_id TEXT PRIMARY KEY, version INTEGER NOT NULL CHECK(version >= 0)
  ) STRICT`,
  `CREATE TABLE knowledge_revisions (
    application_id TEXT NOT NULL REFERENCES knowledge_scopes(application_id),
    kind TEXT NOT NULL, id TEXT NOT NULL, revision INTEGER NOT NULL CHECK(revision > 0),
    id_order BLOB NOT NULL,
    commit_version INTEGER NOT NULL CHECK(commit_version > 0),
    entity_json TEXT NOT NULL CHECK(json_valid(entity_json)),
    trace_json TEXT NOT NULL CHECK(json_valid(trace_json)),
    PRIMARY KEY(application_id, kind, id, revision)
  ) STRICT`,
  `CREATE INDEX knowledge_revision_order ON knowledge_revisions(application_id, kind, id_order, revision)`,
  `CREATE TABLE knowledge_links (
    application_id TEXT NOT NULL, source_kind TEXT NOT NULL, source_id TEXT NOT NULL,
    source_revision INTEGER NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal >= 0),
    target_kind TEXT NOT NULL, target_id TEXT NOT NULL, target_revision INTEGER NOT NULL,
    PRIMARY KEY(application_id, source_kind, source_id, source_revision, ordinal),
    FOREIGN KEY(application_id, source_kind, source_id, source_revision)
      REFERENCES knowledge_revisions(application_id, kind, id, revision) DEFERRABLE INITIALLY DEFERRED,
    FOREIGN KEY(application_id, target_kind, target_id, target_revision)
      REFERENCES knowledge_revisions(application_id, kind, id, revision) DEFERRABLE INITIALLY DEFERRED
  ) STRICT`,
  `CREATE INDEX knowledge_links_target ON knowledge_links(application_id, target_kind, target_id, target_revision)`,
  `CREATE TRIGGER knowledge_revision_sequence BEFORE INSERT ON knowledge_revisions BEGIN
    SELECT CASE WHEN NEW.commit_version != (SELECT version + 1 FROM knowledge_scopes WHERE application_id = NEW.application_id)
      THEN RAISE(ABORT, 'invalid commit version') END;
    SELECT CASE WHEN NEW.revision != (SELECT coalesce(max(revision), 0) + 1 FROM knowledge_revisions
      WHERE application_id = NEW.application_id AND kind = NEW.kind AND id = NEW.id)
      THEN RAISE(ABORT, 'invalid revision sequence') END;
    SELECT CASE WHEN NEW.kind IN ('observation', 'assessment') AND NEW.revision != 1
      THEN RAISE(ABORT, 'append only fact') END;
  END`,
  `CREATE TRIGGER knowledge_links_sealed BEFORE INSERT ON knowledge_links BEGIN
    SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM knowledge_revisions r JOIN knowledge_scopes s USING(application_id)
      WHERE r.application_id = NEW.application_id AND r.kind = NEW.source_kind AND r.id = NEW.source_id
      AND r.revision = NEW.source_revision AND r.commit_version = s.version + 1)
      THEN RAISE(ABORT, 'sealed knowledge references') END;
  END`,
  ...['knowledge_revisions', 'knowledge_links', 'knowledge_migrations'].flatMap(table =>
    ['UPDATE', 'DELETE'].map(op => `CREATE TRIGGER ${table}_${op.toLowerCase()} BEFORE ${op} ON ${table}
      BEGIN SELECT RAISE(ABORT, 'immutable knowledge'); END`)),
];
const checksum = createHash('sha256').update(definitions.join(';\n')).digest('hex');
const mismatch = (): never => { throw new KnowledgeStoreError('SCHEMA_MISMATCH', 'Incompatible knowledge schema'); };
const normalize = (sql: string) => sql.replace(/\s+/g, ' ').trim();

export function checkIntegrity(db: DatabaseSync): void {
  const result = db.prepare('PRAGMA integrity_check').all();
  if (result.length !== 1 || result[0].integrity_check !== 'ok' || db.prepare('PRAGMA foreign_key_check').all().length) mismatch();
}

/** Only known migration: empty, unmarked database -> v1. Existing foreign DBs are rejected.
 * Caller holds BEGIN IMMEDIATE so concurrent initializers cannot race the version check.
 */
export function initializeKnowledgeSchema(db: DatabaseSync): string {
  const version = db.prepare('PRAGMA user_version').get()!.user_version;
  const app = db.prepare('PRAGMA application_id').get()!.application_id;
  const catalog = () => db.prepare("SELECT name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY name").all();
  if (version === 0 && app === 0 && catalog().length === 0) {
    definitions.forEach(sql => db.exec(sql));
    checkIntegrity(db);
    db.prepare('INSERT INTO knowledge_migrations VALUES (?, ?, ?, ?, ?)')
      .run(SCHEMA_VERSION, checksum, new Date().toISOString(), 'ok', randomBytes(32).toString('hex'));
    db.exec(`PRAGMA application_id = ${APPLICATION_ID}; PRAGMA user_version = ${SCHEMA_VERSION}`);
  } else if (version !== SCHEMA_VERSION || app !== APPLICATION_ID) mismatch();

  // Check actual definitions too: missing triggers/indexes must not silently weaken guarantees.
  const actual = catalog().map(r => normalize(String(r.sql))).sort();
  const expected = definitions.map(normalize).sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) mismatch();
  const migrations = db.prepare('SELECT * FROM knowledge_migrations ORDER BY version').all();
  if (migrations.length !== 1 || migrations[0].version !== SCHEMA_VERSION || migrations[0].checksum !== checksum ||
    migrations[0].integrity_result !== 'ok' || !/^[a-f0-9]{64}$/.test(String(migrations[0].cursor_key))) mismatch();
  checkIntegrity(db);
  return String(migrations[0].cursor_key);
}
