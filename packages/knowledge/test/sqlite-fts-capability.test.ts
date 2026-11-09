import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { expect, it } from 'vitest';

import { SqliteKnowledgeAdapter } from '../src/storage/sqlite-knowledge-adapter.js';

import { initializeKnowledgeSchema as initializeV1 } from './fixtures/knowledge-sqlite-v1.js';

it('probes the actual builtin and refuses unsupported builds without changing a populated v1 file', () => {
  const dir = mkdtempSync(join(tmpdir(), 'qap-fts-capability-'));
  const path = join(dir, 'knowledge.sqlite');
  try {
    const db = new DatabaseSync(path);
    const fts = db.prepare("SELECT sqlite_compileoption_used('ENABLE_FTS5') AS enabled").get()!.enabled;
    const sqlite = db.prepare('SELECT sqlite_version() AS version').get()!.version;
    db.exec('BEGIN IMMEDIATE'); initializeV1(db);
    db.exec(`INSERT INTO knowledge_scopes VALUES ('a', 0);
      INSERT INTO knowledge_revisions VALUES ('a', 'application', 'a', 1, x'0061', 1,
        '{"application_id":"a","name":"Preserved","base_url":"https://example.test","created_at":"2026-10-28"}',
        '{"source":"capability_test","recorded_by":"tester","recorded_at":"2026-10-28","reason":"Preserve","review":"unreviewed","evidence_refs":[]}');
      UPDATE knowledge_scopes SET version = 1; COMMIT`);
    db.close(); const bytes = readFileSync(path);
    if (fts === 1) {
      const store = new SqliteKnowledgeAdapter(path); expect(store.schema_version).toBe(2); store.close();
    } else {
      expect(() => new SqliteKnowledgeAdapter(path)).toThrow(expect.objectContaining({
        code: 'UNAVAILABLE', message: 'Knowledge store requires SQLite FTS5',
      }));
      expect(readFileSync(path)).toEqual(bytes);
      const unchanged = new DatabaseSync(path);
      try {
        expect(unchanged.prepare('PRAGMA user_version').get()!.user_version).toBe(1);
        expect(unchanged.prepare('SELECT count(*) AS n FROM knowledge_revisions').get()!.n).toBe(1);
      } finally { unchanged.close(); }
    }
    process.stdout.write(JSON.stringify({ runtime: process.version, sqlite, fts5: fts, outcome: fts === 1 ? 'v2 ready' : 'v1 preserved; unavailable' }) + '\n');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
