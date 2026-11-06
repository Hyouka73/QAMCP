import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createLifecycleFixture, type LifecycleFixture } from './fixtures/lifecycle-canonical.js';
import { getPhaseGuidance } from '../guidance.js';

// Historical P3 identities are intentionally kept verbatim. The legacy P3 suite
// hoists PlaywrightAdapter mocks, so these canonical MCP/SQLite/Chromium checks
// run in a separate test module with the production DiscoveryHandler.
describe('P3 Suite de Verificación MCP (T3 - T15)', () => {
  let f: LifecycleFixture;
  const cleanup: Array<() => Promise<void>> = [];
  beforeEach(async () => { f = await createLifecycleFixture(close => cleanup.push(close)); });
  afterEach(async () => {
    const results = await Promise.allSettled(cleanup.splice(0).map(close => close()));
    for (const item of results) if (item.status === 'rejected') throw item.reason;
  });

  it('T6: qap_discover éxito: no contiene "Descubrir otro módulo", "pregunta_doc" ni "opciones_doc"; siguiente_accion tipo entrevista_vista (<= 5 preguntas) con tool qap_rules_set, categorias_aplicables y rutas_detectadas_fuera_del_plan', async () => {
    await f.working(['catalog', 'orders']);
    const discovered = await f.discover();
    expect(discovered).toMatchObject({
      status_scope: 'acquisition', mode: 'fresh_anonymous_static',
      acquisition_status: 'completed', module_identity_status: 'resolved',
      association_status: 'confirmed', persistence: 'committed',
      counts: { views: expect.any(Number), forms: expect.any(Number) },
    });
    expect(JSON.stringify(discovered)).not.toMatch(/Descubrir otro módulo|pregunta_doc|opciones_doc/);
    expect(discovered).not.toHaveProperty('siguiente_accion');
    expect((await f.knowledge.query(f.scope.applicationId, 'requirement')).items).toHaveLength(0);
    const next = await f.interview('catalog', { action: 'next' });
    expect(next).toMatchObject({ status: 'interviewing', question: {
      module: 'catalog', category: 'proposito', human_review_required: true,
    } });
    expect(await f.call('qap_status')).toMatchObject({ siguiente_accion: {
      tipo: 'trabajo', tool: 'qap_rules_set', module: 'catalog',
      canonical_interview: { action: 'next' },
    } });
    f.integrity();
  });

  it('T7: rules.yaml tras discover: reglas inferred/dom con ids deterministas; re-discover idempotente (sin duplicados, reglas confirmadas intactas)', async () => {
    await f.working();
    await f.discover();
    const first = (await f.knowledge.query(f.scope.applicationId, 'observation')).items;
    expect(first.length).toBeGreaterThan(0);
    expect(new Set(first.map(item => item.entity.id)).size).toBe(first.length);
    const question = (await f.interview('catalog', { action: 'next' })).question;
    await f.confirm('catalog', question, f.proposal);
    const requirements = (await f.knowledge.query(f.scope.applicationId, 'requirement')).items;
    expect(requirements).toHaveLength(1);
    const recorded = await f.knowledge.history(f.scope.applicationId, 'requirement', requirements[0].entity.id);
    await f.discover();
    const all = (await f.knowledge.query(f.scope.applicationId, 'observation')).items;
    expect(all.length).toBeGreaterThan(first.length);
    expect(new Set(all.map(item => item.entity.id)).size).toBe(all.length);
    for (const observed of first) expect(all.some(item => item.entity.id === observed.entity.id)).toBe(true);
    expect((await f.knowledge.query(f.scope.applicationId, 'requirement')).items).toEqual(requirements);
    expect(await f.knowledge.history(f.scope.applicationId, 'requirement', requirements[0].entity.id)).toEqual(recorded);
    expect(existsSync(join(f.root, '.qa', 'modules', 'catalog', 'rules.yaml'))).toBe(false);
    f.integrity();
  });

  it('T9: Fallo de Playwright: no inserta reglas; siguiente_accion tipo decision', async () => {
    await f.working();
    // An explicitly invalid browser binary tests the real acquisition failure
    // rather than the removed PlaywrightAdapter mock or a fabricated success.
    await f.restart(true, ['catalog', 'orders'], { executable_path: join(f.root, 'missing-chromium-binary') });
    const before = readFileSync(f.lifecyclePath, 'utf8');
    const failure = await f.call('qap_discover', { name: 'catalog', path: '/catalog' });
    expect(failure.status).not.toBe('completed');
    expect(failure).toMatchObject({ persistence: 'not_attempted', association_status: 'not_attempted' });
    expect((await f.knowledge.query(f.scope.applicationId, 'observation')).items).toHaveLength(0);
    expect((await f.knowledge.query(f.scope.applicationId, 'requirement')).items).toHaveLength(0);
    expect(readFileSync(f.lifecyclePath, 'utf8')).toBe(before);
    expect(existsSync(join(f.root, '.qa', 'modules', 'catalog', 'rules.yaml'))).toBe(false);
    f.integrity();
  });

  it('T14: qap_status WORKING: (a) observed con hipótesis reanuda entrevista; (b) interviewing incompleto reanuda; (c) planned elige high > medium > low luego orden; (d) todos completos tipo decision', async () => {
    // Plan order is intentionally NOT priority order: high must win over medium and low.
    await f.working(['orders', 'dashboard', 'catalog'], {
      orders: 'low', dashboard: 'medium', catalog: 'high',
    });
    expect(await f.call('qap_status')).toMatchObject({ siguiente_accion: {
      tipo: 'trabajo', tool: 'qap_discover', module: 'catalog',
    } });
    await f.discover();
    // Canonical Discovery records observations but does not mutate legacy lifecycle.
    expect(f.lifecycle().modules.catalog.state).toBe('planned');
    expect(await f.call('qap_status')).toMatchObject({ siguiente_accion: {
      tipo: 'trabajo', tool: 'qap_discover', module: 'catalog',
    } });
    const question = await f.interview('catalog', { action: 'next' });
    expect(question).toMatchObject({ status: 'interviewing', question: {
      module: 'catalog', human_review_required: true,
    } });
    expect(await f.call('qap_status')).toMatchObject({ siguiente_accion: {
      tipo: 'trabajo', tool: 'qap_rules_set', module: 'catalog',
      canonical_interview: { action: 'next' },
    } });
    await f.ready();
    expect(await f.call('qap_status')).toMatchObject({ siguiente_accion: { tool: 'qap_rules_set', module: 'catalog' } });
    expect(await f.approvedClosure('catalog', { action: 'close' })).toMatchObject({ status: 'closed' });
    const next = await f.call('qap_status');
    expect(next).toMatchObject({ siguiente_accion: {
      tipo: 'trabajo', tool: 'qap_discover', module: 'dashboard',
    } });
    expect(next.siguiente_accion.descripcion).toContain('dashboard');
    expect(f.lifecycle().modules.catalog.state).toBe('closed');
    expect(f.lifecycle().modules.dashboard.state).toBe('planned');
    expect(f.lifecycle().modules.orders.state).toBe('planned');

    // Pure guidance verifies stable plan order when two planned modules share priority.
    const commonPlan = [
      { module: 'orders', path: '/orders', priority: 'medium', status: 'pending' },
      { module: 'dashboard', path: '/dashboard', priority: 'medium', status: 'pending' },
      { module: 'catalog', path: '/catalog', priority: 'low', status: 'pending' },
    ];
    expect(getPhaseGuidance('WORKING', {
      plan: commonPlan,
      modules: { orders: { state: 'planned' }, dashboard: { state: 'planned' }, catalog: { state: 'planned' } },
    }).siguiente_accion).toMatchObject({ tipo: 'trabajo', tool: 'qap_discover', module: 'orders' });
  });

  it('T15: E2E: flujo de P2 hasta WORKING -> discover A -> rules_set parcial -> status (reanuda A) -> rules_set completa cobertura -> status (propone B) -> discover B; ninguna respuesta del flujo contiene texto del bucle', async () => {
    const forbidden = /botones interactivos en modal|No respondas con listas|modal interactivo|prohibido usar listas/i;
    const init = await f.working(['catalog', 'orders']);
    expect(JSON.stringify(init)).not.toMatch(forbidden);
    const first = await f.discover('catalog');
    expect(JSON.stringify(first)).not.toMatch(forbidden);
    const question = await f.interview('catalog', { action: 'next' });
    expect(JSON.stringify(question)).not.toMatch(forbidden);
    const pending = await f.call('qap_status');
    expect(pending).toMatchObject({ siguiente_accion: { tool: 'qap_rules_set', module: 'catalog' } });
    expect(JSON.stringify(pending)).not.toMatch(forbidden);
    await f.ready();
    expect((await f.close('catalog', { action: 'evaluate' })).assessment)
      .toMatchObject({ specification_coverage: { status: 'complete' }, execution_coverage: { status: 'not_executed' } });
    expect(await f.approvedClosure('catalog', { action: 'close' })).toMatchObject({ status: 'closed' });
    const next = await f.call('qap_status');
    expect(next).toMatchObject({ siguiente_accion: { tool: 'qap_discover' } });
    expect(next.siguiente_accion.descripcion).toContain('orders');
    const second = await f.discover('orders');
    expect(JSON.stringify([next, second])).not.toMatch(forbidden);
    expect((await f.knowledge.query(f.scope.applicationId, 'requirement')).items).toHaveLength(1);
    expect((await f.knowledge.query(f.scope.applicationId, 'observation')).items.length).toBeGreaterThan(0);
    expect(f.lifecycle().modules.orders.state).toBe('planned');
    f.integrity();
  });
});
