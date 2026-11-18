import { createHash, randomBytes } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';

import { KnowledgeStoreError } from '@qap/engine';

export const SCHEMA_VERSION = 2;
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
// v1 definitions/checksum above are frozen. v2 adds a disposable current projection.
const v2Definitions = [
  `CREATE TABLE action_target_search (
    rowid INTEGER PRIMARY KEY, application_id TEXT NOT NULL, id TEXT NOT NULL,
    revision INTEGER NOT NULL, kind TEXT NOT NULL DEFAULT 'action_target' CHECK(kind = 'action_target'),
    accessibility_label TEXT NOT NULL, selector TEXT NOT NULL,
    fallback_selectors TEXT NOT NULL, element_type TEXT NOT NULL,
    UNIQUE(application_id, id),
    FOREIGN KEY(application_id, kind, id, revision)
      REFERENCES knowledge_revisions(application_id, kind, id, revision)
  ) STRICT`,
  `CREATE VIRTUAL TABLE action_targets_fts USING fts5(accessibility_label, selector, fallback_selectors, element_type, content='action_target_search', content_rowid='rowid', tokenize='unicode61 remove_diacritics 2')`,
  `CREATE TRIGGER action_target_search_insert AFTER INSERT ON action_target_search BEGIN
    INSERT INTO action_targets_fts(rowid, accessibility_label, selector, fallback_selectors, element_type)
    VALUES (NEW.rowid, NEW.accessibility_label, NEW.selector, NEW.fallback_selectors, NEW.element_type);
  END`,
  `CREATE TRIGGER action_target_search_delete AFTER DELETE ON action_target_search BEGIN
    INSERT INTO action_targets_fts(action_targets_fts, rowid, accessibility_label, selector, fallback_selectors, element_type)
    VALUES ('delete', OLD.rowid, OLD.accessibility_label, OLD.selector, OLD.fallback_selectors, OLD.element_type);
  END`,
  `CREATE TRIGGER action_target_revision_insert AFTER INSERT ON knowledge_revisions
    WHEN NEW.kind = 'action_target' BEGIN
    DELETE FROM action_target_search WHERE application_id = NEW.application_id AND id = NEW.id;
    INSERT INTO action_target_search(application_id, id, revision, accessibility_label, selector, fallback_selectors, element_type)
    VALUES (NEW.application_id, NEW.id, NEW.revision,
      coalesce(json_extract(NEW.entity_json, '$.accessibility_label'), ''),
      json_extract(NEW.entity_json, '$.selector'),
      coalesce((SELECT group_concat(value, ' ') FROM json_each(NEW.entity_json, '$.fallback_selectors')), ''),
      json_extract(NEW.entity_json, '$.element_type'));
  END`,
];
const shadows = [
  "CREATE TABLE 'action_targets_fts_data'(id INTEGER PRIMARY KEY, block BLOB)",
  "CREATE TABLE 'action_targets_fts_idx'(segid, term, pgno, PRIMARY KEY(segid, term)) WITHOUT ROWID",
  "CREATE TABLE 'action_targets_fts_docsize'(id INTEGER PRIMARY KEY, sz BLOB)",
  "CREATE TABLE 'action_targets_fts_config'(k PRIMARY KEY, v) WITHOUT ROWID",
];
const v2Checksum = createHash('sha256').update([...v2Definitions, ...shadows].join(';\n')).digest('hex');
const mismatch = (): never => { throw new KnowledgeStoreError('SCHEMA_MISMATCH', 'Incompatible knowledge schema'); };
const normalize = (sql: string) => sql.replace(/\s+/g, ' ').trim();

export function checkIntegrity(db: DatabaseSync): void {
  const result = db.prepare('PRAGMA integrity_check').all();
  if (result.length !== 1 || result[0].integrity_check !== 'ok' || db.prepare('PRAGMA foreign_key_check').all().length) mismatch();
}

/** Explicit empty -> v1 -> v2. Existing foreign DBs are rejected.
 * Caller holds BEGIN IMMEDIATE so concurrent initializers cannot race the version check.
 */
export function initializeKnowledgeSchema(db: DatabaseSync): string {
  let version = db.prepare('PRAGMA user_version').get()!.user_version;
  const app = db.prepare('PRAGMA application_id').get()!.application_id;
  const catalog = () => db.prepare("SELECT name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY name").all();
  if (version === 0 && app === 0 && catalog().length === 0) {
    definitions.forEach(sql => db.exec(sql));
    checkIntegrity(db);
    db.prepare('INSERT INTO knowledge_migrations VALUES (?, ?, ?, ?, ?)')
      .run(1, checksum, new Date().toISOString(), 'ok', randomBytes(32).toString('hex'));
    db.exec(`PRAGMA application_id = ${APPLICATION_ID}; PRAGMA user_version = 1`);
    version = 1;
  } else if ((version !== 1 && version !== SCHEMA_VERSION) || app !== APPLICATION_ID) mismatch();

  // Check actual definitions too: missing triggers/indexes must not silently weaken guarantees.
  const actual = catalog().map(r => normalize(String(r.sql))).sort();
  const expected = [...definitions, ...(version === 2 ? [...v2Definitions, ...shadows] : [])].map(normalize).sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) mismatch();
  const migrations = db.prepare('SELECT * FROM knowledge_migrations ORDER BY version').all();
  if (migrations.length !== version || migrations.some((m, i) => m.version !== i + 1 ||
    m.checksum !== [checksum, v2Checksum][i] || m.integrity_result !== 'ok' ||
    !/^[a-f0-9]{64}$/.test(String(m.cursor_key)))) mismatch();
  checkIntegrity(db);
  if (version === 1) {
    v2Definitions.forEach(sql => db.exec(sql));
    db.exec(`INSERT INTO action_target_search(application_id, id, revision, accessibility_label, selector, fallback_selectors, element_type)
      SELECT r.application_id, r.id, r.revision,
        coalesce(json_extract(r.entity_json, '$.accessibility_label'), ''),
        json_extract(r.entity_json, '$.selector'),
        coalesce((SELECT group_concat(value, ' ') FROM json_each(r.entity_json, '$.fallback_selectors')), ''),
        json_extract(r.entity_json, '$.element_type')
      FROM knowledge_revisions r WHERE r.kind = 'action_target' AND r.revision =
        (SELECT max(n.revision) FROM knowledge_revisions n
          WHERE n.application_id = r.application_id AND n.kind = r.kind AND n.id = r.id)`);
    checkIntegrity(db);
    db.prepare('INSERT INTO knowledge_migrations VALUES (?, ?, ?, ?, ?)')
      .run(2, v2Checksum, new Date().toISOString(), 'ok', String(migrations[0].cursor_key));
    db.exec('PRAGMA user_version = 2');
  }
  // rank=1 also compares the index with external content; never silently repair corruption.
  try { db.exec("INSERT INTO action_targets_fts(action_targets_fts, rank) VALUES ('integrity-check', 1)"); }
  catch { mismatch(); }
  // FTS integrity alone cannot detect a self-consistent but obsolete projection.
  const current = `SELECT r.* FROM knowledge_revisions r WHERE r.kind = 'action_target'
    AND r.revision = (SELECT max(n.revision) FROM knowledge_revisions n
      WHERE n.application_id = r.application_id AND n.kind = r.kind AND n.id = r.id)`;
  if (db.prepare(`SELECT count(*) AS n FROM (${current})`).get()!.n !==
    db.prepare('SELECT count(*) AS n FROM action_target_search').get()!.n ||
    db.prepare(`SELECT 1 FROM (${current}) r LEFT JOIN action_target_search s
      ON s.application_id = r.application_id AND s.id = r.id
      WHERE s.revision IS NOT r.revision
        OR s.accessibility_label IS NOT coalesce(json_extract(r.entity_json, '$.accessibility_label'), '')
        OR s.selector IS NOT json_extract(r.entity_json, '$.selector')
        OR s.fallback_selectors IS NOT coalesce((SELECT group_concat(value, ' ') FROM json_each(r.entity_json, '$.fallback_selectors')), '')
        OR s.element_type IS NOT json_extract(r.entity_json, '$.element_type') LIMIT 1`).get()) mismatch();
  return String(migrations[0].cursor_key);
}
