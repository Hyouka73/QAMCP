import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createLifecycleFixture, type LifecycleFixture } from './fixtures/lifecycle-canonical.js';

// Keep original fullNames for the 55-case historical matrix. These cases
// exercise canonical Discovery (MCP SDK, host binding, real SQLite) instead of
// the removed YAML module-view validation path.
describe('Suite MCP Server QAP v2.1 / v2.1.2', () => {
  let f: LifecycleFixture;
  const cleanup: Array<() => Promise<void>> = [];
  beforeEach(async () => { f = await createLifecycleFixture(close => cleanup.push(close)); });
  afterEach(async () => {
    const results = await Promise.allSettled(cleanup.splice(0).map(close => close()));
    for (const item of results) if (item.status === 'rejected') throw item.reason;
  });

  it('el contexto de vista generado por qap_discover debe validar contra module-view.schema.json (Criterio 4)', async () => {
    await f.working();
    const observed = await f.discover();
    expect(observed).toMatchObject({
      mode: 'fresh_anonymous_static', status_scope: 'acquisition',
      module_identity_status: 'resolved', association_status: 'confirmed',
      persistence: 'committed', observations: expect.any(Number), evidence: expect.any(Number),
    });
    expect(observed.observations).toBeGreaterThan(0);
    expect(observed.evidence).toBeGreaterThan(0);
    const data = (await f.knowledge.query(f.scope.applicationId, 'observation')).items;
    expect(data.length).toBe(observed.observations);
    expect(data.every(item => item.trace.review === 'unreviewed')).toBe(true);
    expect((await f.knowledge.query(f.scope.applicationId, 'requirement')).items).toHaveLength(0);
    expect(existsSync(join(f.root, '.qa', 'modules', 'catalog', 'views', 'default', 'context.yaml'))).toBe(false);
    f.integrity();
  });

  it('qap_discover con contexto de vista inválido no debe escribir archivos y debe retornar error (Criterio 4)', async () => {
    await f.working();
    const lifecycle = readFileSync(f.lifecyclePath, 'utf8');
    await f.restart(false);
    const denied = await f.call('qap_discover', { name: 'catalog', path: '/catalog' });
    expect(denied).toMatchObject({ status: 'blocked', code: 'discovery_authorization_required',
      persistence: 'not_attempted', acquisition_persistence: 'not_attempted', association_status: 'not_attempted' });
    expect(readFileSync(f.lifecyclePath, 'utf8')).toBe(lifecycle);
    expect((await f.knowledge.query(f.scope.applicationId, 'observation')).items).toHaveLength(0);
    expect((await f.knowledge.query(f.scope.applicationId, 'requirement')).items).toHaveLength(0);
    expect(existsSync(join(f.root, '.qa', 'modules', 'catalog'))).toBe(false);
    await f.restart(true);
    // TM-48: missing host authorization is different from a malformed or
    // incompatible semantic context. Exercise the canonical URL and module gates.
    const snapshot = readFileSync(f.lifecyclePath, 'utf8');
    expect(await f.call('qap_discover', { name: 'catalog', path: '/not-allowed' }))
      .toMatchObject({ status: 'blocked', code: 'url_not_authorized', persistence: 'not_attempted' });
    expect(await f.call('qap_discover', { name: 'catalog', path: '/catalog/../orders' }))
      .toMatchObject({ status: 'blocked', code: 'url_not_authorized', persistence: 'not_attempted' });
    expect(await f.call('qap_discover', { name: 'not-in-plan', path: '/catalog' }))
      .toMatchObject({ status: 'blocked', code: 'module_restricted', persistence: 'not_attempted' });
    expect(await f.call('qap_discover', { name: 'catalog', path: '/catalog', credentials: 'never-use-arguments' }))
      .toMatchObject({ status: 'blocked', code: 'authentication_not_supported', persistence: 'not_attempted' });
    expect(readFileSync(f.lifecyclePath, 'utf8')).toBe(snapshot);
    expect((await f.knowledge.query(f.scope.applicationId, 'observation')).items).toHaveLength(0);
    expect((await f.knowledge.query(f.scope.applicationId, 'requirement')).items).toHaveLength(0);
    expect(existsSync(join(f.root, '.qa', 'modules', 'catalog'))).toBe(false);

    // Environment revision is independently pinned by host consent. A valid
    // URL and binding cannot override an obsolete authorization revision.
    await f.restart(true, ['catalog', 'orders'], undefined, 999);
    const stale = await f.call('qap_discover', { name: 'catalog', path: '/catalog' });
    expect(stale).toMatchObject({ status: 'blocked', code: 'authorization_context_mismatch',
      persistence: 'not_attempted', association_status: 'not_attempted' });
    expect(readFileSync(f.lifecyclePath, 'utf8')).toBe(snapshot);
    expect((await f.knowledge.query(f.scope.applicationId, 'observation')).items).toHaveLength(0);
    expect(existsSync(join(f.root, '.qa', 'modules', 'catalog'))).toBe(false);

    await f.restart(true);
    expect(await f.discover()).toMatchObject({ persistence: 'committed', association_status: 'confirmed' });
    f.integrity();
  });

  it('E0a: qap_discover valida contra module-view.schema.json en camino de fallo de Playwright', async () => {
    await f.working();
    await f.restart(true, ['catalog', 'orders'], { executable_path: join(f.root, 'nonexistent-browser') });
    const lifecycle = readFileSync(f.lifecyclePath, 'utf8');
    const failed = await f.call('qap_discover', { name: 'catalog', path: '/catalog' });
    expect(failed.acquisition_status).not.toBe('completed');
    expect(failed).toMatchObject({ persistence: 'not_attempted', association_status: 'not_attempted' });
    expect((await f.knowledge.query(f.scope.applicationId, 'observation')).items).toHaveLength(0);
    expect((await f.knowledge.query(f.scope.applicationId, 'requirement')).items).toHaveLength(0);
    expect(readFileSync(f.lifecyclePath, 'utf8')).toBe(lifecycle);
    f.integrity();
  });

  it('E0c: qap_discover valida contra module-view.schema.json en vista con routes_found vacio', async () => {
    // An empty interactive surface is not a fabricated absence of the view:
    // the crawler may record a visited route and structural observation.
    const emptyCleanup: Array<() => Promise<void>> = [];
    const empty = await createLifecycleFixture(close => emptyCleanup.push(close),
      '<html><body><h1>Synthetic passive view</h1></body></html>');
    cleanup.push(...emptyCleanup);
    await empty.working();
    const observed = await empty.call('qap_discover', { name: 'catalog', path: '/catalog' });
    expect(observed).toMatchObject({ status_scope: 'acquisition', mode: 'fresh_anonymous_static',
      persistence: 'committed', counts: { controls: 0, forms: 0 }, association_status: 'confirmed' });
    expect((await empty.knowledge.query(empty.scope.applicationId, 'observation')).items.length).toBeGreaterThan(0);
    expect((await empty.knowledge.query(empty.scope.applicationId, 'requirement')).items).toHaveLength(0);
    empty.integrity();
  });
});
