import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import type { KnowledgeWrite } from '@qap/engine';
import { validateApplicationObservation } from '@qap/shared';
import { afterEach, describe, expect, it } from 'vitest';

import { ReconnaissanceService, type ReconnaissanceInput } from '../../playwright-adapter/dist/index.js';
import { SqliteKnowledgeAdapter } from '../src/storage/sqlite-knowledge-adapter.js';

const directories: string[] = [];
const stores: SqliteKnowledgeAdapter[] = [];
const servers: Server[] = [];
const canary = 'CANARY_RECON_SQLITE_e96759';
const timestamp = '2026-10-28T12:00:00.000Z';
const trace = { source: 'synthetic', recorded_by: 'test', recorded_at: timestamp, reason: 'Synthetic recon fixture',
  review: 'unreviewed' as const, evidence_refs: [] };

afterEach(async () => {
  for (const server of servers.splice(0)) {
    server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve()));
  }
  stores.splice(0).forEach(store => store.close());
  directories.splice(0).forEach(path => rmSync(path, { recursive: true, force: true }));
});

async function fixture() {
  const directory = mkdtempSync(join(tmpdir(), 'qap-recon-'));
  directories.push(directory);
  const path = join(directory, 'synthetic.sqlite');
  const store = new SqliteKnowledgeAdapter(path); stores.push(store);
  let hits = 0;
  const server = createServer((req, res) => {
    hits++;
    expect(req.headers.authorization).toBeUndefined(); expect(req.headers.cookie).toBeUndefined();
    res.setHeader('Set-Cookie', `s=${canary}; HttpOnly; Secure`);
    res.setHeader('X-Private', canary);
    res.setHeader('Content-Security-Policy', `script-src 'nonce-${canary}'`);
    res.setHeader('Content-Type', 'text/html');
    res.end(`<html><script src="/_next/${canary}"></script>${canary}@private.invalid</html>`);
  });
  servers.push(server);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  const input: ReconnaissanceInput = { application_id: 'a',
    environment: { application_id: 'a', environment_id: 'local', name: 'synthetic', base_url: origin,
      is_production: false, destructive_actions_allowed: false, safe_domains: ['127.0.0.1'] },
    target_url: `${origin}/${canary}?token=${canary}`, authorization: {
      allowed_urls: [`${origin}/${canary}?token=${canary}`, `${origin}/robots.txt`, `${origin}/sitemap.xml`],
      allowed_ips: ['127.0.0.1'] } };
  const context: KnowledgeWrite[] = [
    { kind: 'application', entity: { application_id: 'a', name: 'Test', base_url: origin, created_at: timestamp },
      expected_revision: 0, trace },
    { kind: 'environment', entity: input.environment, expected_revision: 0, trace },
  ];
  await store.commit('a', context);
  await store.commit('b', [{ kind: 'application', entity: { application_id: 'b', name: 'Other', base_url: origin,
    created_at: timestamp }, expected_revision: 0, trace }]);
  return { input, store, path, directory, server, hits: () => hits };
}

describe('VNEXT-006 reconnaissance through IKnowledgeStore to physical SQLite', () => {
  it('round-trips masked facts and evidence, pins links, isolates applications and preserves repeated runs', async () => {
    const f = await fixture();
    const service = new ReconnaissanceService(f.store);
    const first = await service.run(f.input);
    const second = await service.run(f.input);
    expect(first.observations).toHaveLength(3);
    expect(first.execution_id).not.toBe(second.execution_id);
    const observations = (await f.store.query('a', 'observation')).items;
    expect(observations).toHaveLength(6);
    for (const record of observations) {
      expect(validateApplicationObservation(record.entity).valid).toBe(true);
      expect(record.entity.observed_by).toBe('recon');
      expect(record.trace).toMatchObject({ source: 'http_reconnaissance', review: 'unreviewed', environment_id: 'local' });
      const evidence = await f.store.get('a', 'evidence', record.entity.evidence.id, 1);
      expect(evidence?.entity).toEqual(record.entity.evidence);
      expect(evidence?.entity.kind).toBe('http_recon_metadata');
      expect(record.references).toContainEqual({ kind: 'evidence', id: record.entity.evidence.id, revision: 1 });
      expect(record.references).toContainEqual({ kind: 'environment', id: 'local', revision: 1 });
      expect((await f.store.history('a', 'observation', record.id)).items).toHaveLength(1);
      expect(await f.store.get('b', 'observation', record.id)).toBeNull();
    }
    expect((await f.store.query('b', 'observation')).items).toHaveLength(0);
    expect((await f.store.query('a', 'inference')).items).toHaveLength(0);
    expect((await f.store.query('a', 'requirement')).items).toHaveLength(0);
    expect(JSON.stringify([first, second, observations])).not.toContain(canary);
    f.store.close();
    const reopened = new SqliteKnowledgeAdapter(f.path); stores.push(reopened);
    expect((await reopened.query('a', 'observation')).items).toHaveLength(6);
    // Includes the physical database and any extant WAL/SHM, not just logical queries.
    for (const name of readdirSync(f.directory)) expect(readFileSync(join(f.directory, name)).includes(Buffer.from(canary))).toBe(false);
  });

  it('rolls back evidence and observations together when a real SQL insert fails', async () => {
    const f = await fixture(); const db = new DatabaseSync(f.path);
    try {
      db.exec(`CREATE TRIGGER recon_failure BEFORE INSERT ON knowledge_revisions
        WHEN NEW.kind = 'observation' BEGIN SELECT RAISE(ABORT, 'synthetic failure'); END`);
      const error = await new ReconnaissanceService(f.store).run(f.input).catch((error: unknown) => error);
      expect(error).toMatchObject({ code: 'PERSISTENCE_FAILED' });
      expect(String(error)).not.toContain(canary);
      expect((await f.store.query('a', 'evidence')).items).toHaveLength(0);
      expect((await f.store.query('a', 'observation')).items).toHaveLength(0);
      expect(db.prepare('PRAGMA integrity_check').get()?.integrity_check).toBe('ok');
      expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
      db.exec('DROP TRIGGER recon_failure');
      expect((await new ReconnaissanceService(f.store).run(f.input)).observations).toHaveLength(3);
    } finally { db.close(); }
  });

  it('rejects missing or cross-application context without making HTTP requests', async () => {
    const f = await fixture(); f.input.application_id = 'b'; f.input.environment.application_id = 'b';
    await expect(new ReconnaissanceService(f.store).run(f.input)).rejects.toMatchObject({ code: 'CONTEXT_REQUIRED' });
    expect(f.hits()).toBe(0);
    expect((await f.store.query('b', 'evidence')).items).toHaveLength(0);
  });

  it('refuses persistence if the contextual revision changes during acquisition', async () => {
    const f = await fixture();
    let update: Promise<unknown> | undefined;
    f.server.once('request', () => {
      update = f.store.commit('a', [{ kind: 'environment', entity: f.input.environment,
        expected_revision: 1, trace }]);
    });
    await expect(new ReconnaissanceService(f.store).run(f.input)).rejects.toMatchObject({ code: 'CONTEXT_CHANGED' });
    await update;
    expect((await f.store.query('a', 'observation')).items).toHaveLength(0);
    expect((await f.store.query('a', 'evidence')).items).toHaveLength(0);
  });
});
