import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

describe('ENC compiled JavaScript boundary', () => {
  it('resists timeout and capability SQL injection in compiled JavaScript', () => {
    const program = String.raw`
      import { strict as assert } from 'node:assert';
      import { mkdtempSync, rmSync } from 'node:fs';
      import { tmpdir } from 'node:os';
      import { join } from 'node:path';
      import { DatabaseSync } from 'node:sqlite';
      import { QapApplicationService } from './dist/index.js';
      import { SqliteKnowledgeAdapter } from '@qap/knowledge';
      const dir = mkdtempSync(join(tmpdir(), 'qap-enc-r2-'));
      const service = new QapApplicationService({hostRootDir: join(dir, 'host')});
      const store = new SqliteKnowledgeAdapter(join(dir, 'knowledge.sqlite'));
      const db = new DatabaseSync(join(dir, 'knowledge.sqlite'));
      try {
        db.exec("CREATE TABLE canary (v); INSERT INTO canary VALUES ('safe')");
        store.lockTimeoutMs = '0; DELETE FROM canary; --';
        let called = false;
        await store.withWriteFence('a', async () => { called = true; });
        assert.equal(called, true);
        assert.equal(db.prepare('SELECT count(*) n FROM canary').get().n, 1);
        for (const invalid of [null, NaN, Infinity, -1, 60001, 0.5, '1']) assert.throws(() => new SqliteKnowledgeAdapter(':memory:', {busy_timeout_ms: invalid}));
        const { mkdirSync } = await import('node:fs');
        const aRoot = join(dir, 'a'), bRoot = join(dir, 'b'); mkdirSync(aRoot); mkdirSync(bRoot);
        const a = service.createProject({name:'a', canonicalRoot:aRoot}).project.project_id;
        const b = service.createProject({name:'b', canonicalRoot:bRoot}).project.project_id;
        for (const id of [a,b]) service.authority.grant({project_id:id, capability:'execute', granted_by:'test', policy_hash:'test'});
        const caps = ['execute']; caps.map = () => ({join: () => '?) OR 1=1 --'});
        caps[Symbol.iterator] = () => { throw Error('external iterator'); };
        assert.equal(service.authority.revokeProjectAccess(a, 'test', caps), 1);
        assert.equal(service.authority.listGrants(a).find(g => g.capability === 'execute').status, 'revoked');
        assert.equal(service.authority.listGrants(b).find(g => g.capability === 'execute').status, 'active');
        for (const invalid of [null, ['bogus'], [42], 'execute']) assert.throws(() => service.authority.revokeProjectAccess(a, 'test', invalid));
      } finally { db.close(); store.close(); service.close(); rmSync(dir, {recursive:true, force:true}); }
    `;
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', program], { cwd: process.cwd(), encoding: 'utf8' });
    expect(result.status, result.stderr).toBe(0);
  });

  it('does not expose a SQLite handle or SQL entry point through service collaborators', () => {
    const program = String.raw`
      import { strict as assert } from 'node:assert';
      import { mkdtempSync, rmSync } from 'node:fs';
      import { tmpdir } from 'node:os';
      import { join } from 'node:path';
      import { QapApplicationService } from './dist/index.js';
      const host = mkdtempSync(join(tmpdir(), 'qap-enc-host-'));
      const root = mkdtempSync(join(tmpdir(), 'qap-enc-root-'));
      const service = new QapApplicationService({ hostRootDir: host });
      try {
        const project = service.createProject({ name: 'ENC', canonicalRoot: root });
        const knowledge = service.openKnowledgeStore(project.project.project_id);
        const objects = [service, service.authority, service.importer, service.block3, knowledge];
        for (const object of objects) {
          for (const key of ['store', 'db', 'database', 'connection', 'sqlite', 'transaction', 'readPage', 'findServiceCaseRow']) {
            assert.equal(Reflect.get(object, key), undefined, object.constructor.name + '.' + key);
          }
          for (const key of Reflect.ownKeys(object)) {
            const value = Reflect.get(object, key);
            assert.ok(!(value && typeof value === 'object' && typeof value.prepare === 'function' && typeof value.exec === 'function'), String(key));
          }
        }
        const seen = new Set();
        function inspect(value) {
          if (!value || typeof value !== 'object' || seen.has(value)) return;
          seen.add(value);
          assert.ok(!(typeof value.prepare === 'function' && typeof value.exec === 'function'), 'SQLite connection reachable');
          assert.ok(!(typeof value.get === 'function' && typeof value.all === 'function' && typeof value.run === 'function'), 'SQL store reachable');
          if (value instanceof Map) for (const [key, item] of value) { inspect(key); inspect(item); }
          if (value instanceof Set) for (const item of value) inspect(item);
          for (const key of Reflect.ownKeys(value)) {
            const descriptor = Object.getOwnPropertyDescriptor(value, key);
            if (descriptor && 'value' in descriptor) inspect(descriptor.value);
          }
        }
        for (const object of objects) inspect(object);
        assert.throws(() => knowledge.transaction('IMMEDIATE; SELECT 1', () => {}), TypeError);
        assert.throws(() => service.block3.findServiceCaseRow('unscoped'), TypeError);
        assert.equal(typeof service.authority.check, 'function');
        assert.equal(typeof knowledge.commit, 'function');
        assert.equal(service.getDeletedProjectRoot(project.project.project_id), null);
      } finally {
        service.close();
        rmSync(root, { recursive: true, force: true });
        rmSync(host, { recursive: true, force: true });
      }
    `;
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', program], { cwd: process.cwd(), encoding: 'utf8' });
    expect(result.stderr).not.toContain('AssertionError');
    expect(result.status, result.stderr).toBe(0);
  });
});
