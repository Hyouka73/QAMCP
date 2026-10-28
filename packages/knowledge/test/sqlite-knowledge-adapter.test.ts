import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { type KnowledgeEntities, type KnowledgeKind, type KnowledgeWrite } from '@qap/engine';
import { afterEach, describe, expect, it } from 'vitest';

import { knowledgeStoreContract } from '../../engine/src/__tests__/knowledge-store.contract.js';
import { SqliteKnowledgeAdapter } from '../src/storage/sqlite-knowledge-adapter.js';

const timestamp = '2026-10-28T12:00:00.000Z';
const directories: string[] = [];
const connections: SqliteKnowledgeAdapter[] = [];
function fixture() {
  const directory = mkdtempSync(join(tmpdir(), 'qap-sqlite-'));
  directories.push(directory);
  return { directory, path: join(directory, 'knowledge.sqlite') };
}
function open(path: string, timeout = 1000) {
  const adapter = new SqliteKnowledgeAdapter(path, { busy_timeout_ms: timeout });
  connections.push(adapter);
  return adapter;
}
function write<K extends KnowledgeKind>(kind: K, entity: KnowledgeEntities[K], expected_revision = 0): KnowledgeWrite {
  return { kind, entity, expected_revision, trace: { source: 'physical_test', recorded_by: 'tester',
    recorded_at: timestamp, reason: 'Test persistence', review: 'unreviewed', evidence_refs: [] } } as KnowledgeWrite;
}
const application = (app = 'a', name = app) => write('application', {
  application_id: app, name, base_url: 'https://example.test', created_at: timestamp,
});
const moduleEntity: KnowledgeEntities['module'] = { id: 'm', application_id: 'a', key: 'billing', title: 'Billing',
  certainty: 'observed', criticality: 'high', dependencies: [], created_at: timestamp, updated_at: timestamp, is_active: true };

afterEach(() => {
  connections.splice(0).forEach(connection => connection.close());
  directories.splice(0).forEach(directory => rmSync(directory, { recursive: true, force: true }));
});

describe('IKnowledgeStore contract — physical SQLite files', () => {
  knowledgeStoreContract(async () => open(fixture().path));
});

describe('SqliteKnowledgeAdapter physical guarantees', () => {
  it('persists revisions, provenance, pinned historical links and pagination across reopen', async () => {
    const { path } = fixture();
    const first = open(path);
    await first.commit('a', [application(), write('module', moduleEntity)]);
    await first.commit('a', [write('module', { ...moduleEntity, title: 'Second' }, 1),
      write('relation', { id: 'history-link', source: { kind: 'module', id: 'm', revision: 1 },
        target: { kind: 'application', id: 'a' }, predicate: 'supports' })]);
    const page = await first.history('a', 'module', 'm', { limit: 1 });
    first.close();
    const second = open(path);
    expect((await second.get('a', 'module', 'm'))?.entity.title).toBe('Second');
    expect((await second.get('a', 'module', 'm', 1))?.entity.title).toBe('Billing');
    expect((await second.history('a', 'module', 'm', { cursor: page.next_cursor })).items[0].revision).toBe(2);
    expect((await second.get('a', 'relation', 'history-link'))?.references).toContainEqual({ kind: 'module', id: 'm', revision: 1 });
    expect((await second.history('a', 'module', 'm')).items.every(r => r.trace.source === 'physical_test')).toBe(true);
  });

  it('serializes independent connections, rejects stale revisions and invalidates other-connection cursors', async () => {
    const { path } = fixture();
    const a = open(path); const b = open(path);
    await a.commit('a', [application(), write('module', moduleEntity), write('module', { ...moduleEntity, id: 'n', key: 'next' })]);
    const page = await b.query('a', 'module', { limit: 1 });
    const results = await Promise.allSettled([a.commit('a', [write('module', { ...moduleEntity, title: 'A' }, 1)]),
      b.commit('a', [write('module', { ...moduleEntity, title: 'B' }, 1)])]);
    expect(results.map(r => r.status)).toEqual(['fulfilled', 'rejected']);
    expect(results[1]).toMatchObject({ reason: { code: 'CONFLICT' } });
    await expect(b.query('a', 'module', { cursor: page.next_cursor })).rejects.toMatchObject({ code: 'INVALID_CURSOR' });
    await a.commit('b', [application('b')]);
    expect((await b.query('a', 'module')).items).toHaveLength(2);
    expect((await b.history('a', 'module', 'm')).items).toHaveLength(2);
  });

  it('rolls back actual SQL writes and scope version when an injected second insert fails', async () => {
    const { path } = fixture(); const store = open(path);
    await store.commit('a', [application(), write('module', moduleEntity), write('module', { ...moduleEntity, id: 'n', key: 'next' })]);
    const cursor = (await store.query('a', 'module', { limit: 1 })).next_cursor;
    const db = new DatabaseSync(path);
    try {
      db.exec("CREATE TRIGGER injected_failure BEFORE INSERT ON knowledge_revisions WHEN NEW.id = 'fail' BEGIN SELECT RAISE(ABORT, 'failure'); END");
      await expect(store.commit('a', [write('module', { ...moduleEntity, title: 'Rollback' }, 1),
        write('module', { ...moduleEntity, id: 'fail', key: 'fail' })])).rejects.toMatchObject({ code: 'UNAVAILABLE' });
      expect((await store.get('a', 'module', 'm'))?.revision).toBe(1);
      expect(await store.get('a', 'module', 'fail')).toBeNull();
      expect((await store.query('a', 'module', { cursor })).items).toHaveLength(1);
      expect(db.prepare('PRAGMA integrity_check').get()?.integrity_check).toBe('ok');
      expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
    } finally { db.close(); }
  });

  it('enforces physical immutable history and foreign keys for historical targets', async () => {
    const { path } = fixture(); const store = open(path);
    await store.commit('a', [application(), write('module', moduleEntity)]);
    const db = new DatabaseSync(path);
    try {
      db.exec('PRAGMA foreign_keys = ON');
      expect(() => db.exec("UPDATE knowledge_revisions SET entity_json = '{}'" )).toThrow();
      expect(() => db.exec('DELETE FROM knowledge_revisions')).toThrow();
      expect(() => db.exec("INSERT INTO knowledge_links VALUES ('a','module','m',1,99,'application','a',1)")).toThrow(/sealed/);
      db.exec(`BEGIN IMMEDIATE;
        INSERT INTO knowledge_revisions SELECT application_id, kind, id, revision + 1, id_order, 2, entity_json, trace_json
          FROM knowledge_revisions WHERE kind = 'application';
        INSERT INTO knowledge_links VALUES ('a','application','a',2,0,'module','missing',1)`);
      expect(() => db.exec('COMMIT')).toThrow(/FOREIGN KEY/);
      db.exec('ROLLBACK');
      expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
    } finally { db.close(); }
  });

  it('configures WAL, foreign keys and bounded busy handling without losing the winning write', async () => {
    const { path } = fixture(); const store = open(path, 10);
    await store.commit('a', [application()]);
    const db = new DatabaseSync(path);
    try {
      expect(db.prepare('PRAGMA journal_mode').get()?.journal_mode).toBe('wal');
      db.exec('BEGIN IMMEDIATE');
      await expect(store.commit('b', [application('b')])).rejects.toMatchObject({ code: 'UNAVAILABLE' });
      expect(await store.get('a', 'application', 'a')).not.toBeNull();
      db.exec('ROLLBACK');
      await store.commit('b', [application('b')]);
    } finally { db.close(); }
  });

  it('rejects future versions without altering file contents or journal mode', () => {
    const { path } = fixture(); const store = open(path); store.close();
    const db = new DatabaseSync(path);
    db.exec('PRAGMA user_version = 99'); db.close();
    const bytes = readFileSync(path);
    expect(() => open(path)).toThrow(expect.objectContaining({ code: 'SCHEMA_MISMATCH' }));
    expect(readFileSync(path)).toEqual(bytes);
  });

  it('refuses unmarked existing Reporter data and unknown unversioned schemas', () => {
    const { path } = fixture(); const db = new DatabaseSync(path);
    db.exec("CREATE TABLE reporter (payload TEXT); INSERT INTO reporter VALUES ('keep')"); db.close();
    const bytes = readFileSync(path);
    expect(() => open(path)).toThrow(expect.objectContaining({ code: 'SCHEMA_MISMATCH' }));
    expect(readFileSync(path)).toEqual(bytes);
  });

  it('detects missing physical immutability triggers', () => {
    const { path } = fixture(); open(path).close();
    const db = new DatabaseSync(path);
    db.exec('DROP TRIGGER knowledge_revisions_update'); db.close();
    expect(() => open(path)).toThrow(expect.objectContaining({ code: 'SCHEMA_MISMATCH' }));
  });

  it('records v1 migration integrity and rejects an altered migration checksum', () => {
    const { path } = fixture(); open(path).close();
    const db = new DatabaseSync(path);
    expect(db.prepare('PRAGMA user_version').get()?.user_version).toBe(1);
    expect(db.prepare('SELECT version, integrity_result FROM knowledge_migrations').get()).toMatchObject({ version: 1, integrity_result: 'ok' });
    db.exec(`DROP TRIGGER knowledge_migrations_update;
      UPDATE knowledge_migrations SET checksum = 'unknown';
      CREATE TRIGGER knowledge_migrations_update BEFORE UPDATE ON knowledge_migrations
        BEGIN SELECT RAISE(ABORT, 'immutable knowledge'); END`);
    db.close();
    expect(() => open(path)).toThrow(expect.objectContaining({ code: 'SCHEMA_MISMATCH' }));
  });

  it('uses bound SQL parameters for hostile IDs and leaves unrelated entities intact', async () => {
    const store = open(fixture().path);
    const id = "x'); DROP TABLE knowledge_revisions; --";
    await store.commit('a', [application(), write('module', { ...moduleEntity, id })]);
    expect((await store.get('a', 'module', id))?.entity.id).toBe(id);
    expect((await store.query('a', 'module')).items).toHaveLength(1);
    expect(await store.get('a', 'application', 'a')).not.toBeNull();
  });

  it('preserves knowledge when isolated browser temporary storage is removed', async () => {
    const { directory, path } = fixture(); const store = open(path);
    const browser = join(directory, 'browser-profile'); mkdirSync(browser);
    writeFileSync(join(browser, 'cache'), 'temporary');
    await store.commit('a', [application(), write('module', moduleEntity)]);
    rmSync(browser, { recursive: true });
    store.close();
    expect((await open(path).get('a', 'module', 'm'))?.entity).toEqual(moduleEntity);
  });

  it('rejects malformed runtime entities, secret keys, binary values and unknown kinds atomically', async () => {
    const store = open(fixture().path); await store.commit('a', [application()]);
    const invalid: unknown[] = [null, {}, { ...write('module', moduleEntity), entity: null },
      write('module', { ...moduleEntity, dependencies: null } as any),
      write('module', { ...moduleEntity, is_active: 'true' } as any),
      write('module', { ...moduleEntity, dependencies: [2] } as any),
      write('application', { application_id: 'a', name: 'x', base_url: 'x', created_at: timestamp, metadata: { cookie: 'sensitive' } }),
      { ...write('module', moduleEntity), kind: 'unknown' },
      { ...write('module', moduleEntity), trace: { recorded_by: 42 } },
      write('application', { application_id: 'a', name: 'x', base_url: 'x', created_at: timestamp, metadata: { binary: Buffer.from('data') } })];
    for (const value of invalid) {
      await expect(store.commit('a', [write('module', moduleEntity), value as KnowledgeWrite])).rejects.toMatchObject({ code: 'INVALID_DATA' });
      expect(await store.get('a', 'module', 'm')).toBeNull();
    }
  });

  it('sorts UTF-16 IDs consistently and binds cursors to database, query and application', async () => {
    const store = open(fixture().path);
    await store.commit('a', [application(), ...['\uE000', '😀', 'a'].map(id => write('module', { ...moduleEntity, id, key: id }))]);
    expect((await store.query('a', 'module')).items.map(r => r.id)).toEqual(['a', '😀', '\uE000']);
    const page = await store.query('a', 'module', { limit: 1 });
    const other = open(fixture().path);
    await expect(other.query('a', 'module', { cursor: page.next_cursor })).rejects.toMatchObject({ code: 'INVALID_CURSOR' });
    await store.commit('b', [application('b')]);
    expect((await store.query('a', 'module', { cursor: page.next_cursor })).items).toHaveLength(2);
  });

  it('sanitizes unavailable errors, rejects closed use and permits idempotent close', async () => {
    const store = open(fixture().path); store.close(); store.close();
    await expect(store.get('a', 'application', 'a')).rejects.toMatchObject({ code: 'UNAVAILABLE' });
    expect(() => new SqliteKnowledgeAdapter(join(fixture().directory, 'missing', 'file.sqlite')))
      .toThrow(expect.objectContaining({ code: 'UNAVAILABLE' }));
  });
});
