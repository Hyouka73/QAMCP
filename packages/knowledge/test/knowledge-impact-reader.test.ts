import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import {
  KnowledgeStoreError, type ImpactRequest, type KnowledgeEntities, type KnowledgePage,
  type KnowledgeRecord, type KnowledgeWrite,
} from '@qap/engine';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { analyzeImpact } from '../src/impact/impact-analyzer.js';
import { readKnowledgeImpact, type KnowledgeImpactReadOptions } from '../src/impact/knowledge-impact-reader.js';
import { SqliteKnowledgeAdapter } from '../src/storage/sqlite-knowledge-adapter.js';

const timestamp = '2026-11-05T12:00:00.000Z';
const directories: string[] = [];
const connections: SqliteKnowledgeAdapter[] = [];
function open(path: string) {
  const store = new SqliteKnowledgeAdapter(path);
  connections.push(store);
  return store;
}
function fixture() {
  const directory = mkdtempSync(join(tmpdir(), 'qap-impact-reader-'));
  directories.push(directory);
  const path = join(directory, 'knowledge.sqlite');
  return { path, store: open(path) };
}
function write<K extends 'application' | 'module'>(kind: K, entity: KnowledgeEntities[K], expected_revision = 0): KnowledgeWrite {
  return { kind, entity, expected_revision, trace: { source: 'physical_test', recorded_by: 'Codex',
    recorded_at: timestamp, reason: 'Verify read-only impact', review: 'unreviewed', evidence_refs: [] } } as KnowledgeWrite;
}
function module(id: string, dependencies: string[] = [], extra: Partial<KnowledgeEntities['module']> = {}): KnowledgeEntities['module'] {
  return { id, key: `key-${id}`, application_id: 'app', title: id, dependencies,
    certainty: 'observed', criticality: 'medium', created_at: timestamp, updated_at: timestamp, is_active: true, ...extra };
}
function request(ids: string[] = [], app = 'app'): ImpactRequest {
  return { contract_version: 1, application_id: app, changed_modules: ids.map(value => ({ kind: 'id', value })) };
}
async function seed(store: SqliteKnowledgeAdapter, modules: KnowledgeEntities['module'][] = [], app = 'app') {
  await store.commit(app, [write('application', { application_id: app, name: app,
    base_url: 'https://example.test', created_at: timestamp })]);
  for (let offset = 0; offset < modules.length; offset += 100) {
    await store.commit(app, modules.slice(offset, offset + 100).map(entity => write('module', entity)));
  }
}
function frozen<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(frozen);
    Object.freeze(value);
  }
  return value;
}
/** Includes every physical table (FTS/shadows too), schema, revisions, versions and bytes. */
function physicalState(db: DatabaseSync, path: string) {
  const schema = db.prepare('SELECT * FROM sqlite_master ORDER BY type, name').all();
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all();
  return {
    schema,
    tables: tables.map(row => ({ name: row.name,
      rows: db.prepare(`SELECT * FROM "${String(row.name).replaceAll('"', '""')}"`).all()
        .map(value => JSON.stringify(value)).sort() })),
    pragmas: ['data_version', 'schema_version', 'user_version', 'application_id', 'page_count', 'freelist_count']
      .map(name => db.prepare(`PRAGMA ${name}`).get()),
    files: ['', '-wal'].map(suffix => existsSync(path + suffix)
      ? createHash('sha256').update(readFileSync(path + suffix)).digest('hex') : null),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  connections.splice(0).forEach(store => store.close());
  directories.splice(0).forEach(directory => rmSync(directory, { recursive: true, force: true }));
});

describe('VNEXT-015-03 read-only impact over physical SQLite', () => {
  it('exhausts an empty inventory without asserting snapshot consistency', async () => {
    const { store } = fixture();
    await seed(store);
    const result = await readKnowledgeImpact(store, 'app', request());
    expect(result).toEqual({ reading: { status: 'exhausted', snapshot_consistency: 'not_verified',
      attempts: 1, query_count: 1, invalid_cursor_count: 0, module_count: 0 }, analysis: analyzeImpact(request(), []) });
  });

  it('reads current revisions, keeps strict application isolation and delegates depth and diagnostics', async () => {
    const { store } = fixture();
    const modules = [module('A'), module('B', ['A']), module('C', ['key-B'])];
    await seed(store, modules);
    await seed(store, [module('A', [], { application_id: 'other' }),
      module('foreign', ['A'], { application_id: 'other' })], 'other');
    const current = module('B');
    await store.commit('app', [write('module', current, 1)]);
    const query = vi.spyOn(store, 'query');
    const input = { ...request(['B']), max_depth: 0 };
    const result = await readKnowledgeImpact(store, 'app', input, { page_size: 1 });
    expect(result.reading).toMatchObject({ status: 'exhausted', module_count: 3, query_count: 3 });
    expect(result.analysis).toEqual(analyzeImpact(input, [modules[0], current, modules[2]]));
    expect(result.analysis?.completeness).toBe('depth_limited');
    expect(result.analysis?.affected_modules.map(item => item.id)).toEqual(['B']);
    expect(query.mock.calls.every(([app, kind, options]) => app === 'app' && kind === 'module' &&
      options?.limit === 1 && options.references === undefined)).toBe(true);
    const other = await readKnowledgeImpact(store, 'other', request(['A'], 'other'), { page_size: 1 });
    expect(other.analysis?.affected_modules.map(item => item.id)).toEqual(['A', 'foreign']);
  });

  it.each([1, 37, 100])('exhausts 205 modules at page size %s, with deterministic results', async pageSize => {
    const { store } = fixture();
    const modules = Array.from({ length: 205 }, (_, index) => module(`m${String(index).padStart(3, '0')}`,
      index ? ['m000'] : []));
    await seed(store, modules);
    const result = await readKnowledgeImpact(store, 'app', request(['m000']), { page_size: pageSize });
    expect(result.reading).toMatchObject({ status: 'exhausted', module_count: 205,
      query_count: Math.ceil(205 / pageSize) });
    expect(result.analysis).toEqual(analyzeImpact(request(['m000']), [...modules].reverse()));
    expect(result.analysis?.affected_modules).toHaveLength(205);
  });

  it('preserves inactive traversal, exclusion, seed rejection and no successor substitution', async () => {
    const { store } = fixture();
    const modules = [module('A'), module('B', ['A'], { is_active: false, superseded_by: 'D' }),
      module('C', ['B']), module('D')];
    await seed(store, modules);
    for (const input of [request(['A']), request(['B'])]) {
      const result = await readKnowledgeImpact(store, 'app', input, { page_size: 1 });
      expect(result.reading.status).toBe('exhausted');
      expect(result.analysis).toEqual(analyzeImpact(input, modules));
    }
  });

  it('physically invalidates a cursor after another connection commits, discards all old pages and restarts', async () => {
    const { path, store } = fixture();
    await seed(store, [module('A'), module('B', ['A'])]);
    const writer = open(path);
    const original = store.query.bind(store);
    const invalidations: string[] = [];
    let wrote = false;
    const query = vi.spyOn(store, 'query').mockImplementation(async (app, kind, options) => {
      try {
        const page = await original(app, kind, options);
        if (!wrote) {
          wrote = true;
          // Changes an already-read module AND inserts before its old page boundary.
          await writer.commit('app', [write('module', module('0')), write('module', module('Z')),
            write('module', module('A', ['Z']), 1)]);
        }
        return page;
      } catch (error) {
        if (error instanceof KnowledgeStoreError) invalidations.push(error.code);
        throw error;
      }
    });
    const result = await readKnowledgeImpact(store, 'app', request(['Z']), { page_size: 1 });
    expect(invalidations).toEqual(['INVALID_CURSOR']);
    expect(query.mock.calls.map(([, , options]) => options?.cursor === undefined)).toEqual([true, false, true, false, false, false]);
    expect(result.reading).toEqual({ status: 'exhausted', snapshot_consistency: 'not_verified',
      attempts: 2, query_count: 6, invalid_cursor_count: 1, module_count: 4 });
    expect(result.analysis).toEqual(analyzeImpact(request(['Z']),
      [module('0'), module('A', ['Z']), module('B', ['A']), module('Z')]));
    expect(result.analysis?.affected_modules.map(item => [item.id, item.depth])).toEqual([['Z', 0], ['A', 1], ['B', 2]]);
  });

  it.each([1, 3])('fails closed after %s attempts invalidated by real writes from another connection', async maxAttempts => {
    const { path, store } = fixture();
    await seed(store, [module('A'), module('B', ['A'])]);
    const writer = open(path);
    const original = store.query.bind(store);
    let revision = 1;
    const query = vi.spyOn(store, 'query').mockImplementation(async (app, kind, options) => {
      const page = await original(app, kind, options);
      if (options?.cursor === undefined) {
        await writer.commit('app', [write('module', module('A', [], { title: `revision-${revision + 1}` }), revision)]);
        revision++;
      }
      return page;
    });
    const result = await readKnowledgeImpact(store, 'app', request(['A']), { page_size: 1, max_attempts: maxAttempts });
    expect(result).toEqual({ reading: { status: 'invalidated', snapshot_consistency: 'not_verified',
      attempts: maxAttempts, query_count: 2 * maxAttempts, invalid_cursor_count: maxAttempts, module_count: 0 },
      analysis: null, failure: { code: 'INVALID_CURSOR_EXHAUSTED', store_code: 'INVALID_CURSOR' } });
    expect(query).toHaveBeenCalledTimes(2 * maxAttempts);
    expect((await writer.history('app', 'module', 'A')).items).toHaveLength(maxAttempts + 1);
  });

  it('does not restart when a different application is concurrently updated', async () => {
    const { path, store } = fixture();
    await seed(store, [module('A'), module('B', ['A'])]);
    await seed(store, [], 'other');
    const writer = open(path);
    const original = store.query.bind(store);
    vi.spyOn(store, 'query').mockImplementation(async (app, kind, options) => {
      const page = await original(app, kind, options);
      if (!options?.cursor) await writer.commit('other', [write('module', module('other', [], { application_id: 'other' }))]);
      return page;
    });
    const result = await readKnowledgeImpact(store, 'app', request(['A']), { page_size: 1 });
    expect(result.reading).toMatchObject({ status: 'exhausted', attempts: 1, invalid_cursor_count: 0, module_count: 2 });
  });

  it('reports exhaustion without snapshot verification when a writer commits after the terminal page', async () => {
    const { path, store } = fixture();
    await seed(store, [module('A'), module('B', ['A'])]);
    const writer = open(path);
    const original = store.query.bind(store);
    vi.spyOn(store, 'query').mockImplementation(async (app, kind, options) => {
      const page = await original(app, kind, options);
      if (page.next_cursor === undefined) await writer.commit('app', [write('module', module('B'), 1)]);
      return page;
    });
    const result = await readKnowledgeImpact(store, 'app', request(['A']), { page_size: 1 });
    expect(result.reading).toMatchObject({ status: 'exhausted', snapshot_consistency: 'not_verified', invalid_cursor_count: 0 });
    expect(result.analysis?.coherence).toBe('caller_supplied_not_verified');
    expect(result.analysis?.affected_modules.map(item => item.id)).toEqual(['A', 'B']);
    expect((await writer.get('app', 'module', 'B'))?.entity.dependencies).toEqual([]);
  });

  it('bounds progressing unique cursors and accepts a terminal page exactly at the limit', async () => {
    const { store } = fixture();
    await seed(store, [module('A'), module('B'), module('C')]);
    const query = vi.spyOn(store, 'query');
    const incomplete = await readKnowledgeImpact(store, 'app', request(['A']), { page_size: 1, max_pages: 2 });
    expect(incomplete.reading).toMatchObject({ status: 'interrupted', query_count: 2, module_count: 0, attempts: 1 });
    expect(incomplete.analysis).toBeNull();
    expect(incomplete.failure?.code).toBe('PAGE_LIMIT');
    expect(query).toHaveBeenCalledTimes(2);
    const complete = await readKnowledgeImpact(store, 'app', request(['A']), { page_size: 1, max_pages: 3 });
    expect(complete.reading.status).toBe('exhausted');
  });

  it('rejects a repeated cursor before allowing an endless loop', async () => {
    const { store } = fixture();
    await seed(store, [module('A'), module('B'), module('C')]);
    const original = store.query.bind(store);
    let first: string | undefined;
    const query = vi.spyOn(store, 'query').mockImplementation(async (app, kind, options) => {
      const page = await original(app, kind, options);
      first ??= page.next_cursor;
      return { ...page, next_cursor: first };
    });
    const result = await readKnowledgeImpact(store, 'app', request(['A']), { page_size: 1 });
    expect(result.failure?.code).toBe('REPEATED_CURSOR');
    expect(result.analysis).toBeNull();
    expect(query).toHaveBeenCalledTimes(2);
  });

  it('bounds retries when a defective opaque cursor is rejected by physical SQLite', async () => {
    const { store } = fixture();
    await seed(store, [module('A'), module('B')]);
    const original = store.query.bind(store);
    const query = vi.spyOn(store, 'query').mockImplementation(async (app, kind, options) => {
      const page = await original(app, kind, options);
      return { ...page, next_cursor: 'defective-opaque-cursor' };
    });
    const result = await readKnowledgeImpact(store, 'app', request(['A']), { page_size: 1, max_attempts: 2 });
    expect(result.reading).toMatchObject({ status: 'invalidated', attempts: 2, query_count: 4, invalid_cursor_count: 2 });
    expect(result.failure?.code).toBe('INVALID_CURSOR_EXHAUSTED');
    expect(result.analysis).toBeNull();
    expect(query).toHaveBeenCalledTimes(4);
  });

  it('rejects an empty final continuation instead of treating an inconsistent inventory as complete', async () => {
    const { store } = fixture();
    await seed(store, [module('A'), module('B')]);
    const original = store.query.bind(store);
    vi.spyOn(store, 'query').mockImplementation(async (app, kind, options) => {
      const page = await original(app, kind, options);
      return options?.cursor ? { items: [] } : page;
    });
    const result = await readKnowledgeImpact(store, 'app', request(['A']), { page_size: 1 });
    expect(result.failure?.code).toBe('INVALID_PAGE');
    expect(result.analysis).toBeNull();
  });

  const faultyPages: Array<[string, (page: KnowledgePage<KnowledgeRecord<'module'>>) => unknown, string]> = [
    ['null page', () => null, 'INVALID_PAGE'],
    ['missing items', () => ({}), 'INVALID_PAGE'],
    ['oversized page', page => ({ items: [...page.items, ...page.items] }), 'INVALID_PAGE'],
    ['empty continuation', page => ({ ...page, items: [] }), 'INVALID_PAGE'],
    ['blank cursor', page => ({ ...page, next_cursor: '' }), 'INVALID_PAGE'],
    ['non-string cursor', page => ({ ...page, next_cursor: 42 }), 'INVALID_PAGE'],
    ['foreign envelope', page => ({ ...page, items: page.items.map(record => ({ ...record, application_id: 'other' })) }), 'APPLICATION_MISMATCH'],
    ['foreign entity', page => ({ ...page, items: page.items.map(record => ({ ...record, entity: { ...record.entity, application_id: 'other' } })) }), 'APPLICATION_MISMATCH'],
    ['wrong kind', page => ({ ...page, items: page.items.map(record => ({ ...record, kind: 'flow' })) }), 'INVALID_RECORD'],
    ['identity mismatch', page => ({ ...page, items: page.items.map(record => ({ ...record, id: 'wrong' })) }), 'INVALID_RECORD'],
    ['invalid revision', page => ({ ...page, items: page.items.map(record => ({ ...record, revision: 0 })) }), 'INVALID_RECORD'],
    ['invalid dependencies', page => ({ ...page, items: page.items.map(record => ({ ...record, entity: { ...record.entity, dependencies: null } })) }), 'INVALID_RECORD'],
    ['sparse dependencies', page => ({ ...page, items: page.items.map(record => ({ ...record, entity: { ...record.entity, dependencies: new Array<string>(1) } })) }), 'INVALID_RECORD'],
  ];
  it.each(faultyPages)('fails closed on a defective response: %s', async (_name, corrupt, expected) => {
    const { store } = fixture();
    await seed(store, [module('A'), module('B')]);
    const original = store.query.bind(store);
    const query = vi.spyOn(store, 'query').mockImplementation(async (app, kind, options) =>
      corrupt(await original(app, kind, options) as KnowledgePage<KnowledgeRecord<'module'>>) as KnowledgePage<KnowledgeRecord<typeof kind>>);
    const result = await readKnowledgeImpact(store, 'app', request(['A']), { page_size: 1 });
    expect(result.reading).toMatchObject({ status: 'rejected', module_count: 0 });
    expect(result.analysis).toBeNull();
    expect(result.failure?.code).toBe(expected);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('rejects duplicate identities across pages, even when their revision changes', async () => {
    const { store } = fixture();
    await seed(store, [module('A'), module('B')]);
    const original = store.query.bind(store);
    const first = (await original('app', 'module', { limit: 1 })).items[0];
    vi.spyOn(store, 'query').mockImplementation(async (app, kind, options) => {
      const page = await original(app, kind, options);
      return options?.cursor ? { ...page, items: [{ ...first, revision: 2 }] } : page;
    });
    const result = await readKnowledgeImpact(store, 'app', request(['A']), { page_size: 1 });
    expect(result.failure?.code).toBe('DUPLICATE_MODULE_ID');
    expect(result.analysis).toBeNull();
  });

  it('rejects duplicate IDs within a page and unordered unique inventories', async () => {
    const { store } = fixture();
    await seed(store, [module('A'), module('B')]);
    const original = store.query.bind(store);
    for (const duplicate of [true, false]) {
      vi.spyOn(store, 'query').mockImplementation(async (app, kind, options) => {
        const page = await original(app, kind, options);
        return { items: duplicate ? [page.items[0], page.items[0]] : page.items.reverse() };
      });
      const result = await readKnowledgeImpact(store, 'app', request(['A']));
      expect(result.failure?.code).toBe(duplicate ? 'DUPLICATE_MODULE_ID' : 'UNORDERED_INVENTORY');
      expect(result.analysis).toBeNull();
      vi.restoreAllMocks();
    }
  });

  it('keeps graph inconsistency diagnostics in the pure analyzer after pagination exhausts', async () => {
    const { store } = fixture();
    const modules = [module('A'), module('B')];
    await seed(store, modules);
    const original = store.query.bind(store);
    vi.spyOn(store, 'query').mockImplementation(async (app, kind, options) => {
      const page = await original(app, kind, options);
      return { ...page, items: page.items.map(record => ({ ...record,
        entity: { ...record.entity, key: 'duplicate-key' } })) };
    });
    const result = await readKnowledgeImpact(store, 'app', request(['A']));
    expect(result.reading.status).toBe('exhausted');
    expect(result.analysis).toEqual(analyzeImpact(request(['A']), modules.map(item => ({ ...item, key: 'duplicate-key' }))));
    expect(result.analysis?.completeness).toBe('rejected');
    expect(result.analysis?.diagnostics).toContainEqual({ code: 'AMBIGUOUS_KEY', key: 'duplicate-key', module_ids: ['A', 'B'] });
  });

  it.each([new KnowledgeStoreError('UNAVAILABLE', 'sensitive adapter payload'), new Error('sensitive driver payload')])(
    'interrupts without retrying or exposing payloads on non-cursor failure %#', async error => {
      const { store } = fixture();
      await seed(store, [module('A'), module('B')]);
      const original = store.query.bind(store);
      const query = vi.spyOn(store, 'query').mockImplementation(async (app, kind, options) => {
        if (options?.cursor) throw error;
        return original(app, kind, options);
      });
      const result = await readKnowledgeImpact(store, 'app', request(['A']), { page_size: 1 });
      expect(result.reading).toMatchObject({ status: 'interrupted', attempts: 1, query_count: 2, module_count: 0 });
      expect(result.failure?.code).toBe('STORE_FAILURE');
      expect(result.analysis).toBeNull();
      expect(JSON.stringify(result)).not.toContain('sensitive');
      expect(query).toHaveBeenCalledTimes(2);
    });

  it.each<KnowledgeImpactReadOptions>([
    { page_size: 0 }, { page_size: 101 }, { page_size: 1.5 }, { page_size: NaN },
    { max_pages: 0 }, { max_pages: 10_001 }, { max_pages: Infinity },
    { max_attempts: 0 }, { max_attempts: 11 }, { max_attempts: 1.5 },
  ])('rejects invalid bounds before I/O: %j', async options => {
    const { store } = fixture();
    const query = vi.spyOn(store, 'query');
    const result = await readKnowledgeImpact(store, 'app', request(), options);
    expect(result.failure?.code).toBe('INVALID_INPUT');
    expect(result.analysis).toBeNull();
    expect(query).not.toHaveBeenCalled();
  });

  it('rejects a mismatched explicit scope before I/O', async () => {
    const { store } = fixture();
    const query = vi.spyOn(store, 'query');
    const result = await readKnowledgeImpact(store, 'other', request(['A']));
    expect(result.failure?.code).toBe('INVALID_INPUT');
    expect(query).not.toHaveBeenCalled();
  });

  it('rejects a sparse runtime seed array before I/O', async () => {
    const { store } = fixture();
    const query = vi.spyOn(store, 'query');
    const result = await readKnowledgeImpact(store, 'app', { ...request(), changed_modules: new Array(1) as ImpactRequest['changed_modules'] });
    expect(result.failure?.code).toBe('INVALID_INPUT');
    expect(result.analysis).toBeNull();
    expect(query).not.toHaveBeenCalled();
  });

  it('copies caller inputs before awaiting and accepts frozen store-owned values', async () => {
    const { store } = fixture();
    const modules = [module('A'), module('B', ['A'])];
    await seed(store, modules);
    const original = store.query.bind(store);
    const input = request(['A']);
    const saved = structuredClone(input);
    vi.spyOn(store, 'query').mockImplementation(async (app, kind, options) => {
      const page = await original(app, kind, options);
      (input.changed_modules as Array<{ kind: 'id'; value: string }>)[0].value = 'missing';
      return frozen(page);
    });
    const result = await readKnowledgeImpact(store, 'app', input, frozen({ page_size: 1 }));
    expect(result.analysis).toEqual(analyzeImpact(saved, modules));
    vi.restoreAllMocks();
    const stable = frozen(request(['A']));
    expect((await readKnowledgeImpact(store, 'app', stable)).analysis).toEqual(result.analysis);
    expect(stable).toEqual(saved);
  });

  it('detaches accepted page entities and dependencies before the next query', async () => {
    const { store } = fixture();
    const modules = [module('A', ['C']), module('B', ['A']), module('C')];
    await seed(store, modules);
    const original = store.query.bind(store);
    let first: KnowledgeRecord<'module'> | undefined;
    vi.spyOn(store, 'query').mockImplementation(async (app, kind, options) => {
      const page = await original(app, kind, options);
      if (!first) first = page.items[0] as KnowledgeRecord<'module'>;
      else {
        first.entity.dependencies.splice(0);
        first.entity.is_active = false;
      }
      return page;
    });
    const result = await readKnowledgeImpact(store, 'app', request(['C']), { page_size: 1 });
    expect(result.analysis).toEqual(analyzeImpact(request(['C']), modules));
    vi.restoreAllMocks();
    if (result.analysis) (result.analysis.affected_modules[0].paths[0].module_ids as string[]).push('mutated');
    const next = await readKnowledgeImpact(store, 'app', request(['C']), { page_size: 1 });
    expect(next.analysis).toEqual(analyzeImpact(request(['C']), modules));
  });

  it.each([false, true])('leaves all physical data, revisions, schema, scope versions and bytes unchanged (failure=%s)', async failRead => {
    const { path, store } = fixture();
    await seed(store, [module('A'), module('B', ['A'])]);
    const db = new DatabaseSync(path, { readOnly: true });
    try {
      const before = physicalState(db, path);
      const commit = vi.spyOn(store, 'commit');
      const fence = vi.spyOn(store, 'withWriteFence');
      const get = vi.spyOn(store, 'get');
      const history = vi.spyOn(store, 'history');
      const options = { page_size: 1, ...(failRead ? { max_pages: 1 } : {}) };
      const result = await readKnowledgeImpact(store, 'app', frozen(request(['A'])), options);
      expect(result.reading.status).toBe(failRead ? 'interrupted' : 'exhausted');
      expect(physicalState(db, path)).toEqual(before);
      expect(commit).not.toHaveBeenCalled();
      expect(fence).not.toHaveBeenCalled();
      expect(get).not.toHaveBeenCalled();
      expect(history).not.toHaveBeenCalled();
      expect(db.prepare('PRAGMA integrity_check').get()?.integrity_check).toBe('ok');
      expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
    } finally { db.close(); }
  });
});
