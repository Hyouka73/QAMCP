import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { performance } from 'node:perf_hooks';

import type { ActionTargetSearchRequest, KnowledgeEntities, KnowledgeKind, KnowledgeWrite } from '@qap/engine';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SqliteKnowledgeAdapter } from '../src/storage/sqlite-knowledge-adapter.js';

import { initializeKnowledgeSchema as initializeV1 } from './fixtures/knowledge-sqlite-v1.js';

const timestamp = '2026-10-28T12:00:00.000Z';
const trace = { source: 'search_test', recorded_by: 'tester', recorded_at: timestamp,
  reason: 'Sanitized UI discovery', review: 'unreviewed' as const, evidence_refs: [] };
const directories: string[] = [];
const stores: SqliteKnowledgeAdapter[] = [];
function pathFixture() {
  const dir = mkdtempSync(join(tmpdir(), 'qap-fts-')); directories.push(dir);
  return join(dir, 'knowledge.sqlite');
}
function open(path = pathFixture()) {
  const store = new SqliteKnowledgeAdapter(path); stores.push(store); return store;
}
function write<K extends KnowledgeKind>(kind: K, entity: KnowledgeEntities[K], expected_revision = 0): KnowledgeWrite {
  return { kind, entity, expected_revision, trace } as KnowledgeWrite;
}
function parents(app = 'a'): KnowledgeWrite[] {
  return [write('application', { application_id: app, name: app, base_url: 'https://example.test', created_at: timestamp }),
    write('module', { id: 'm', application_id: app, key: 'credit', title: 'Credit', certainty: 'observed',
      criticality: 'high', dependencies: [], created_at: timestamp, updated_at: timestamp, is_active: true }),
    write('view', { id: 'v', application_id: app, module_id: 'm', route_pattern: '/credit', certainty: 'observed',
      interactive_elements_count: 0, forms_count: 0, created_at: timestamp, updated_at: timestamp, is_active: true })];
}
function target(id = 'approve', patch: Partial<KnowledgeEntities['action_target']> = {}): KnowledgeEntities['action_target'] {
  return { id, application_id: 'a', view_id: 'v', selector: '#authorize-credit',
    fallback_selectors: ['[data-testid="loan-approval"]', '//button[@name="conceder"]'],
    accessibility_label: 'Autorizar crédito', element_type: 'button', certainty: 'observed',
    confidence_score: 0.9, is_active: true, created_at: timestamp, updated_at: timestamp, ...patch };
}
const search = (store: SqliteKnowledgeAdapter, query: string, patch: Partial<ActionTargetSearchRequest> = {}) =>
  store.searchActionTargets({ application_id: 'a', query, ...patch });
const ids = (hits: Awaited<ReturnType<typeof search>>) => hits.map(h => h.target.id);

afterEach(() => {
  vi.restoreAllMocks(); stores.splice(0).forEach(s => s.close());
  directories.splice(0).forEach(d => rmSync(d, { recursive: true, force: true }));
});

describe('Action target lexical retrieval', () => {
  it('finds labels, natural prose, accents, CSS identifiers, XPath and fallback selectors', async () => {
    const store = open(); await store.commit('a', [...parents(), write('action_target', target())]);
    for (const query of ['credito', 'Encuentra el botón para autorizar crédito', '#authorize-credit',
      'loan-approval', '//button[@name="conceder"]']) {
      const hits = await search(store, query);
      expect(ids(hits)).toEqual(['approve']);
      expect(hits[0].target).toMatchObject({ revision: 1, entity: target(), trace });
      expect(hits[0].target.references).toContainEqual({ kind: 'view', id: 'v', revision: 1 });
    }
    expect(await search(store, 'nonexistent')).toEqual([]);
    expect(await search(store, 'Sanitized UI discovery search_test')).toEqual([]); // Provenance is returned, never indexed.
    expect(await search(store, '///"***')).toEqual([]);
  });

  it('handles Unicode and decomposed accents without claiming stemming or selector interpretation', async () => {
    const store = open(); await store.commit('a', [...parents(), write('action_target', target('unicode', {
      accessibility_label: 'Iniciar sesión 東京', selector: '#tasaInteres', fallback_selectors: [] }))]);
    for (const query of ['sesio\u0301n', 'SESION', '東京', 'tasaInteres']) expect(ids(await search(store, query))).toEqual(['unicode']);
    expect(await search(store, 'Interes')).toEqual([]); // unicode61 does not split camelCase.
    expect(await search(store, 'sesiones')).toEqual([]);
  });

  it('weights labels above selectors, sorts by score then deterministic ID and limits results', async () => {
    const store = open(); await store.commit('a', [...parents(),
      write('action_target', target('label', { accessibility_label: 'Crédito', selector: '#x', fallback_selectors: [] })),
      write('action_target', target('selector', { accessibility_label: 'Otro', selector: '#credito', fallback_selectors: [] })),
      ...['z', 'a'].map(id => write('action_target', target(id, { accessibility_label: 'Empate', selector: '#same', fallback_selectors: [] })))]);
    const hits = await search(store, 'credito'); expect(ids(hits)).toEqual(['label', 'selector']);
    expect(hits[0].score).toBeLessThan(hits[1].score);
    expect(ids(await search(store, 'credito', { limit: 1 }))).toEqual(['label']);
    expect(ids(await search(store, 'Empate'))).toEqual(['a', 'z']);
  });

  it('isolates applications even with identical target/view IDs and hostile scope strings', async () => {
    const store = open(); await store.commit('a', [...parents(), write('action_target', target())]);
    const app = "b' OR 1=1 --";
    await store.commit(app, [...parents(app), write('action_target', target('approve', {
      application_id: app, accessibility_label: 'SecretoProyectoB', selector: '#private', fallback_selectors: [] }))]);
    expect(await search(store, 'SecretoProyectoB')).toEqual([]);
    expect(ids(await search(store, 'SecretoProyectoB', { application_id: app }))).toEqual(['approve']);
    expect(await search(store, 'credito', { application_id: 'missing' })).toEqual([]);
  });

  it('filters by view, pinned module relationship and actual trace context', async () => {
    const store = open(); const w = write('action_target', target());
    w.trace = { ...trace, environment_id: 'dev', role_id: 'reviewer' };
    await store.commit('a', [...parents(), write('environment', { environment_id: 'dev', application_id: 'a',
      name: 'Dev', base_url: 'https://example.test', is_production: false, destructive_actions_allowed: false, safe_domains: [] }),
      write('role', { role_id: 'reviewer', application_id: 'a', role_name: 'Reviewer', permissions: [], is_authenticated: true }), w]);
    expect(ids(await search(store, 'credito', { view_id: 'v', module_id: 'm', environment_id: 'dev', role_id: 'reviewer' }))).toEqual(['approve']);
    for (const filter of [{ view_id: 'other' }, { module_id: 'other' }, { environment_id: 'other' }, { role_id: 'other' }]) {
      expect(await search(store, 'credito', filter)).toEqual([]);
    }
    const view = (await store.get('a', 'view', 'v'))!.entity;
    await store.commit('a', [write('module', { ...(parents()[1].entity as KnowledgeEntities['module']), id: 'm2', key: 'other' }),
      write('view', { ...view, module_id: 'm2' }, 1)]);
    expect(ids(await search(store, 'credito', { module_id: 'm' }))).toEqual(['approve']);
    expect(await search(store, 'credito', { module_id: 'm2' })).toEqual([]);
  });

  it.each(['" OR * NOT (', '"; DROP TABLE knowledge_revisions; --', 'NEAR(credito, 3)',
    'selector:credito OR {fallback_selectors}:*', '\u0000\n[]()^+-*', "x' UNION SELECT * --"])(
    'treats hostile MATCH/SQL input as bounded literal words: %s', async query => {
    const store = open(); await store.commit('a', [...parents(), write('action_target', target())]);
    await expect(search(store, query)).resolves.toBeInstanceOf(Array);
    expect(ids(await search(store, 'credito'))).toEqual(['approve']);
    expect(await store.get('a', 'application', 'a')).not.toBeNull();
  });

  it('rejects malformed, excessive and invalid runtime requests with sanitized errors', async () => {
    const store = open();
    const invalid: unknown[] = [null, {}, { application_id: '', query: 'x' },
      ...[{ query: 'x'.repeat(2049) }, { query: 'x '.repeat(65) }, { query: '\ud800' },
        { query: 42 }, { limit: 0 }, { limit: 101 }, { limit: 1.5 }, { view_id: '' },
        { module_id: null }, { include_inactive: 'yes' }].map(p => ({ application_id: 'a', query: 'x', ...p }))];
    for (const request of invalid) await expect(store.searchActionTargets(request as ActionTargetSearchRequest))
      .rejects.toMatchObject({ code: 'INVALID_DATA', message: 'Knowledge store: INVALID_DATA' });
    expect(await search(store, '')).toEqual([]);
    await store.commit('a', parents());
    const secret = write('action_target', target());
    Object.assign(secret.entity, { password: 'fixture-only-sensitive-value' });
    await expect(store.commit('a', [secret])).rejects.toMatchObject({ code: 'INVALID_DATA' });
    expect(await search(store, 'fixture-only-sensitive-value')).toEqual([]);
    store.close(); await expect(search(store, '')).rejects.toMatchObject({ code: 'UNAVAILABLE' });
  });

  it('updates the current projection atomically, excludes old text and preserves history across connections/reopen', async () => {
    const path = pathFixture(); const a = open(path); const b = open(path);
    await a.commit('a', [...parents(), write('action_target', target())]);
    expect(ids(await search(b, 'credito'))).toEqual(['approve']);
    await a.commit('a', [write('action_target', target('approve', { accessibility_label: 'Generar reporte',
      selector: '#report', fallback_selectors: ['#export'] }), 1)]);
    expect(await search(b, 'credito')).toEqual([]);
    expect(await search(b, 'authorize')).toEqual([]);
    expect(await search(b, 'conceder')).toEqual([]);
    expect(ids(await search(b, 'export'))).toEqual(['approve']);
    expect((await b.history('a', 'action_target', 'approve')).items.map(r => r.revision)).toEqual([1, 2]);
    a.close(); b.close(); const reopened = open(path);
    expect(ids(await search(reopened, 'reporte'))).toEqual(['approve']);
    expect((await reopened.get('a', 'action_target', 'approve', 1))?.entity.accessibility_label).toBe('Autorizar crédito');
  });

  it('excludes inactive current revisions by default and supports reactivation', async () => {
    const store = open(); await store.commit('a', [...parents(), write('action_target', target())]);
    await store.commit('a', [write('action_target', target('approve', { is_active: false }), 1)]);
    expect(await search(store, 'credito')).toEqual([]);
    expect((await search(store, 'credito', { include_inactive: true }))[0].target.revision).toBe(2);
    await store.commit('a', [write('action_target', target(), 2)]);
    expect((await search(store, 'credito'))[0].target.revision).toBe(3);
  });

  it('leaves the index intact on stale CAS, rejected batch and physical failure after indexing', async () => {
    const path = pathFixture(); const store = open(path);
    await store.commit('a', [...parents(), write('action_target', target())]);
    const changed = target('approve', { accessibility_label: 'RollbackSentinel', selector: '#changed', fallback_selectors: [] });
    await expect(store.commit('a', [write('action_target', changed, 0)])).rejects.toMatchObject({ code: 'CONFLICT' });
    await expect(store.commit('a', [write('action_target', changed, 1), write('action_target', target('invalid', { view_id: 'missing' }))]))
      .rejects.toMatchObject({ code: 'REFERENCE_NOT_FOUND' });
    const db = new DatabaseSync(path);
    try {
      db.exec("CREATE TRIGGER injected_failure BEFORE INSERT ON knowledge_revisions WHEN NEW.id = 'fail' BEGIN SELECT RAISE(ABORT, 'injected'); END");
      await expect(store.commit('a', [write('action_target', changed, 1), write('action_target', target('fail'))]))
        .rejects.toMatchObject({ code: 'UNAVAILABLE' });
      expect(await search(store, 'RollbackSentinel')).toEqual([]);
      expect(ids(await search(store, 'credito'))).toEqual(['approve']);
      expect(await store.get('a', 'action_target', 'fail')).toBeNull();
      expect((await store.history('a', 'action_target', 'approve')).items).toHaveLength(1);
      expect(db.prepare('SELECT version FROM knowledge_scopes').get()?.version).toBe(1);
      db.exec('DROP TRIGGER injected_failure');
    } finally { db.close(); }
    store.close(); expect(ids(await search(open(path), 'credito'))).toEqual(['approve']);
  });

  it('readers see confirmed data while another writer has an indexed but uncommitted revision', async () => {
    const path = pathFixture(); const store = open(path);
    await store.commit('a', [...parents(), write('action_target', target())]);
    const db = new DatabaseSync(path);
    try {
      db.exec('BEGIN IMMEDIATE');
      db.prepare(`INSERT INTO knowledge_revisions SELECT application_id, kind, id, revision + 1, id_order,
        commit_version + 1, ?, trace_json FROM knowledge_revisions WHERE kind = 'action_target'`)
        .run(JSON.stringify(target('approve', { accessibility_label: 'Uncommitted' })));
      expect(await search(store, 'Uncommitted')).toEqual([]);
      expect(ids(await search(store, 'credito'))).toEqual(['approve']);
      db.exec('ROLLBACK');
    } finally { db.close(); }
  });
});

/** Real v1 DDL/checksum copied unchanged from authorized HEAD, never generated by v2. */
function populatedV1(path: string) {
  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys = ON; BEGIN IMMEDIATE'); initializeV1(db);
  db.exec("INSERT INTO knowledge_scopes VALUES ('a',0)");
  const insert = db.prepare('INSERT INTO knowledge_revisions VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const entities = [...parents(), write('action_target', target()),
    write('action_target', target('second', { accessibility_label: 'Tasa de interés' }))];
  for (const w of entities) {
    const id = w.kind === 'application' ? 'a' : (w.entity as { id: string }).id;
    insert.run('a', w.kind, id, 1, Buffer.from(id, 'utf16le').swap16(), 1, JSON.stringify(w.entity), JSON.stringify(w.trace));
  }
  db.exec(`INSERT INTO knowledge_links VALUES ('a','module','m',1,0,'application','a',1);
    INSERT INTO knowledge_links VALUES ('a','view','v',1,0,'application','a',1);
    INSERT INTO knowledge_links VALUES ('a','view','v',1,1,'module','m',1);
    INSERT INTO knowledge_links VALUES ('a','action_target','approve',1,0,'application','a',1);
    INSERT INTO knowledge_links VALUES ('a','action_target','approve',1,1,'view','v',1);
    INSERT INTO knowledge_links VALUES ('a','action_target','second',1,0,'application','a',1);
    INSERT INTO knowledge_links VALUES ('a','action_target','second',1,1,'view','v',1);
    UPDATE knowledge_scopes SET version = 1;
    COMMIT; BEGIN IMMEDIATE`);
  insert.run('a', 'action_target', 'approve', 2, Buffer.from('approve', 'utf16le').swap16(), 2,
    JSON.stringify(target('approve', { accessibility_label: 'Generar reporte', selector: '#report', fallback_selectors: [] })), JSON.stringify({ ...trace, reason: 'Updated label' }));
  db.exec(`INSERT INTO knowledge_links VALUES ('a','action_target','approve',2,0,'application','a',1);
    INSERT INTO knowledge_links VALUES ('a','action_target','approve',2,1,'view','v',1);
    UPDATE knowledge_scopes SET version = 2; COMMIT`);
  return db;
}
const snapshot = (db: DatabaseSync) => ['knowledge_revisions', 'knowledge_links', 'knowledge_scopes', 'knowledge_migrations']
  .map(table => db.prepare(`SELECT * FROM ${table} ORDER BY 1,2`).all());

describe('Explicit v1 -> v2 migration', () => {
  it('initializes new files through both migrations and verifies FTS5 availability', () => {
    const path = pathFixture(); expect(open(path).schema_version).toBe(2);
    const db = new DatabaseSync(path);
    try {
      expect(db.prepare('PRAGMA user_version').get()?.user_version).toBe(2);
      expect(db.prepare('SELECT version, integrity_result FROM knowledge_migrations ORDER BY version').all())
        .toEqual([{ version: 1, integrity_result: 'ok' }, { version: 2, integrity_result: 'ok' }]);
      expect(db.prepare("SELECT sqlite_compileoption_used('ENABLE_FTS5') AS fts").get()?.fts).toBe(1);
    } finally { db.close(); }
  });

  it('backfills only latest targets from real populated v1, preserving revisions, links, trace and cursor key', async () => {
    const path = pathFixture(); const old = populatedV1(path); const before = snapshot(old); old.close();
    const store = open(path);
    expect(await search(store, 'credito')).toEqual([]);
    expect(ids(await search(store, 'reporte'))).toEqual(['approve']);
    expect(ids(await search(store, 'interes'))).toEqual(['second']);
    const db = new DatabaseSync(path);
    try {
      const after = snapshot(db); expect(after.slice(0, 3)).toEqual(before.slice(0, 3));
      expect(after[3][0]).toEqual(before[3][0]);
      expect(after[3][1].cursor_key).toBe(before[3][0].cursor_key);
      expect(db.prepare('SELECT count(*) AS n FROM action_target_search').get()?.n).toBe(2);
      expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
    } finally { db.close(); }
    expect((await store.history('a', 'action_target', 'approve')).items.map(r => r.trace.reason))
      .toEqual(['Sanitized UI discovery', 'Updated label']);
    store.close(); expect(ids(await search(open(path), 'reporte'))).toEqual(['approve']);
  });

  it('preserves existing v1 signed cursors without invalidation', async () => {
    const path = pathFixture(); const db = populatedV1(path);
    const { createHmac } = await import('node:crypto');
    const key = String(db.prepare('SELECT cursor_key FROM knowledge_migrations').get()!.cursor_key); db.close();
    const payload = Buffer.from(JSON.stringify(['a', JSON.stringify(['history', 'action_target', 'approve']), 2, 1])).toString('base64url');
    const cursor = `${payload}.${createHmac('sha256', key).update(payload).digest('hex')}`;
    expect((await open(path).history('a', 'action_target', 'approve', { cursor })).items[0].revision).toBe(2);
  });

  it('rolls back DDL/backfill/version after an injected migration failure and can retry safely', () => {
    const path = pathFixture(); const db = populatedV1(path); const before = snapshot(db); db.close();
    const exec = DatabaseSync.prototype.exec;
    const injection = vi.spyOn(DatabaseSync.prototype, 'exec').mockImplementation(function (this: DatabaseSync, sql: string) {
      if (sql.startsWith('INSERT INTO action_target_search(')) throw new Error('Injected backfill I/O failure');
      return exec.call(this, sql);
    });
    expect(() => open(path)).toThrow(expect.objectContaining({ code: 'UNAVAILABLE' })); injection.mockRestore();
    const after = new DatabaseSync(path);
    try {
      expect(snapshot(after)).toEqual(before);
      expect(after.prepare('PRAGMA user_version').get()?.user_version).toBe(1);
      expect(after.prepare("SELECT name FROM sqlite_master WHERE name LIKE 'action_target%'").all()).toEqual([]);
      expect(after.prepare('PRAGMA integrity_check').get()?.integrity_check).toBe('ok');
    } finally { after.close(); }
    expect(open(path).schema_version).toBe(2);
  });

  it('rejects unknown v1 structures before migration and detects damaged FTS content on reopen', async () => {
    const path = pathFixture(); const db = populatedV1(path); db.exec('CREATE TABLE unknown (id TEXT)'); const before = snapshot(db); db.close();
    expect(() => open(path)).toThrow(expect.objectContaining({ code: 'SCHEMA_MISMATCH' }));
    const after = new DatabaseSync(path);
    try { expect(snapshot(after)).toEqual(before); after.exec('DROP TABLE unknown'); } finally { after.close(); }
    const store = open(path); store.close();
    const damaged = new DatabaseSync(path);
    damaged.exec("INSERT INTO action_targets_fts(action_targets_fts) VALUES ('delete-all')"); damaged.close();
    expect(() => open(path)).toThrow(expect.objectContaining({ code: 'SCHEMA_MISMATCH' }));
  });

  it('rejects a self-consistent FTS projection that no longer contains the current revision', () => {
    const path = pathFixture(); populatedV1(path).close(); open(path).close();
    const db = new DatabaseSync(path);
    try {
      db.prepare("UPDATE action_target_search SET revision = 1 WHERE id = 'approve'").run();
    } finally { db.close(); }
    expect(() => open(path)).toThrow(expect.objectContaining({ code: 'SCHEMA_MISMATCH' }));
  });
});

it('measures reproducible local lexical retrieval over 1200 targets without absolute timing gates', async () => {
  const store = open(); await store.commit('a', parents());
  for (let offset = 0; offset < 1200; offset += 100) {
    await store.commit('a', Array.from({ length: 100 }, (_, i) => {
      const n = offset + i; const label = ['Autorizar crédito', 'Tasa de interés', 'Generar reporte', 'Inicio de sesión'][n % 4];
      return write('action_target', target(`target-${String(n).padStart(4, '0')}`, {
        accessibility_label: label, selector: `#control-${n}`, fallback_selectors: [`[data-testid="item-${n}"]`] }));
    }));
  }
  const timings = [];
  for (const query of ['autorizar credito', 'tasa de interes', '#control-731', 'nonexistent']) {
    const ms: number[] = []; let hits: Awaited<ReturnType<typeof search>> = [];
    for (let run = 0; run < 15; run++) {
      const start = performance.now(); hits = await search(store, query, { limit: 10 }); ms.push(performance.now() - start);
    }
    ms.sort((a, b) => a - b);
    timings.push({ query, count: hits.length, first: ids(hits).slice(0, 3), median_ms: +ms[7].toFixed(3), p95_ms: +ms[14].toFixed(3) });
    expect(hits.length).toBe(query === 'nonexistent' ? 0 : 10);
  }
  process.stdout.write(JSON.stringify({ runtime: process.version, catalog: 1200, samples: 15, timings }) + '\n');
}, 30_000);
