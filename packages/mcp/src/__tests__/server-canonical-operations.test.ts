import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';
import YAML from 'yaml';

import { createLifecycleFixture, type LifecycleFixture } from './fixtures/lifecycle-canonical.js';

// Original Server MCP fullNames are retained for identity-based R3 comparison.
// These tests use the real MCP SDK, loopback/Chromium, SQLite and filesystem.
describe('Suite MCP Server QAP v2.1 / v2.1.2', () => {
  const cleanup: Array<() => Promise<void>> = [];
  async function fixture(testNavigation = false): Promise<LifecycleFixture> {
    return createLifecycleFixture(close => cleanup.push(close), undefined, testNavigation);
  }
  afterEach(async () => {
    const results = await Promise.allSettled(cleanup.splice(0).map(close => close()));
    for (const item of results) if (item.status === 'rejected') throw item.reason;
  });

  it('debe descubrir modulos y responder en desarrollo para qap_plan y qap_test', async () => {
    // TM-46: the historical "en_desarrollo" stub was replaced by real DAG
    // planning and a host-authorized, physical browser execution.
    const f = await fixture(true);
    await f.working(['catalog']);
    const moduleDir = join(f.root, '.qa', 'modules', 'catalog');
    const testsDir = join(moduleDir, 'tests');
    mkdirSync(testsDir, { recursive: true });
    writeFileSync(join(moduleDir, 'context.yaml'), YAML.stringify({
      _version: '1', name: 'catalog', routes: ['/catalog'], manually_edited: false,
    }), 'utf8');
    writeFileSync(join(moduleDir, 'selectors.json'), JSON.stringify({ selectors: {} }), 'utf8');
    const testCase = { _version: '1', id: 'TC-001', name: 'La vista pública carga',
      depends_on: [], steps: [
        { type: 'navigate', url: `${f.origin}/catalog` },
        { type: 'assert', selector: 'h1', assertion_type: 'visible', timeout: 2000 },
      ] };
    const casePath = join(testsDir, 'TC-001.yaml');
    writeFileSync(casePath, YAML.stringify(testCase), 'utf8');

    expect(await f.call('qap_test', { module: 'catalog' })).toMatchObject({
      status: 'blocked', code: 'plan_missing', desbloquear_con: 'qap_plan',
    });
    expect(existsSync(join(testsDir, 'plan.json'))).toBe(false);

    const plan = await f.call('qap_plan', { module: 'catalog' });
    expect(plan).toMatchObject({ status: 'success', persisted: true,
      order: ['TC-001'], total_cases: 1, environment: 'local' });
    const savedPlan = JSON.parse(readFileSync(join(testsDir, 'plan.json'), 'utf8'));
    expect(savedPlan).toMatchObject({ _version: '1', module: 'catalog',
      matrix: { cases: ['TC-001'], environment: 'local' } });
    expect(savedPlan.cases_fingerprint).toMatch(/^[a-f0-9]{64}$/);

    const run = await f.call('qap_test', { module: 'catalog' });
    expect(run).toMatchObject({ status: 'success', result: 'passed',
      summary: { total: 1, passed: 1, failed: 0 } });
    const executionId = (run as unknown as { execution_id?: string }).execution_id;
    expect(executionId).toEqual(expect.any(String));
    if (typeof executionId !== 'string') throw new Error('Missing real execution id');
    const saved = JSON.parse(readFileSync(join(f.root, '.qa', 'executions', `${executionId}.json`), 'utf8'));
    expect(saved).toMatchObject({ result: 'passed' });
    const evidenceBefore = readdirSync(join(f.root, '.qa', 'executions'));

    // Stale case contents must not execute using the old plan or emit PASS.
    writeFileSync(casePath, YAML.stringify({ ...testCase, name: 'Caso modificado después del plan' }), 'utf8');
    expect(await f.call('qap_test', { module: 'catalog' })).toMatchObject({
      status: 'blocked', code: 'cases_mismatch', desbloquear_con: 'qap_plan',
    });
    expect(readdirSync(join(f.root, '.qa', 'executions'))).toEqual(evidenceBefore);
  });

  it('qap_discover: gating por fase y estado de modulo, actualizacion planned -> observed', async () => {
    // TM-52: phase/module security is preserved; automatic planned -> observed
    // was deliberately removed from canonical read-only Discovery.
    const f = await fixture();
    await f.call('qap_init', { baseUrl: f.origin });
    expect(await f.call('qap_discover', { name: 'catalog', path: '/catalog' }))
      .toMatchObject({ status: 'blocked', code: 'phase_restricted', persistence: 'not_attempted' });
    expect((await f.knowledge.query(f.scope.applicationId, 'observation')).items).toHaveLength(0);
    await f.working(['catalog']);
    expect(await f.call('qap_discover', { name: 'unknown', path: '/catalog' }))
      .toMatchObject({ status: 'blocked', code: 'module_restricted', persistence: 'not_attempted' });
    const before = readFileSync(f.lifecyclePath, 'utf8');
    expect(await f.discover()).toMatchObject({ association_status: 'confirmed' });
    expect(readFileSync(f.lifecyclePath, 'utf8')).toBe(before);
    expect(f.lifecycle().modules.catalog.state).toBe('planned');
    expect((await f.knowledge.query(f.scope.applicationId, 'observation')).items.length).toBeGreaterThan(0);
    expect((await f.knowledge.query(f.scope.applicationId, 'requirement')).items).toHaveLength(0);
    f.integrity();
  });

  it('Criterio 8 (E2E): init -> status (entrevista) -> ingest -> context_set compuerta -> auto-SCOPING -> session_plan -> auto-WORKING -> discover', async () => {
    // TM-54: no legacy interview_vista; canonical Discovery never confers approval.
    const f = await fixture();
    expect(await f.call('qap_init', { baseUrl: f.origin })).toMatchObject({
      status: 'success', fase: 'ONBOARDING',
    });
    expect(await f.call('qap_status')).toMatchObject({ fase: 'ONBOARDING' });
    expect(await f.call('qap_discover', { name: 'catalog', path: '/catalog' }))
      .toMatchObject({ status: 'blocked', code: 'phase_restricted' });
    const ingest = await f.call('qap_context_ingest', { docContent:
      '# Objetivo\nCatálogo público de productos consultables\n# Usuarios\nVisitante\n# Rutas\n/catalog' });
    expect(ingest).toMatchObject({ status: 'success', fase: 'ONBOARDING' });
    expect(await f.call('qap_context_set', { framework: 'react', app_type: 'spa',
      objective: 'Validar la consulta sintética del catálogo',
      roles: [{ name: 'visitante' }], critical_flows: [{ name: 'Consultar catálogo' }],
      source_of_truth: { type: 'none', declared: true },
    })).toMatchObject({ status: 'success', fase: 'SCOPING' });
    expect(await f.call('qap_discover', { name: 'catalog', path: '/catalog' }))
      .toMatchObject({ status: 'blocked', code: 'phase_restricted' });
    expect(await f.call('qap_session_plan', { plan: [
      { module: 'catalog', path: '/catalog', priority: 'high' },
    ], auth: { required: false } })).toMatchObject({ status: 'success', fase: 'WORKING' });
    const observed = await f.discover();
    expect(observed).toMatchObject({ acquisition_status: 'completed',
      association_status: 'confirmed', mode: 'fresh_anonymous_static' });
    expect((await f.knowledge.query(f.scope.applicationId, 'observation')).items.length).toBeGreaterThan(0);
    expect((await f.knowledge.query(f.scope.applicationId, 'requirement')).items).toHaveLength(0);
    expect(f.lifecycle().modules.catalog.state).toBe('planned');
    f.integrity();
  });

  it('qap_rules_set: actualiza reglas, transiciona observed -> interviewing, recalcula cobertura y actualiza guidance', async () => {
    // TM-55: separate host-reviewed requirements from unsupported legacy YAML,
    // and measure specification independently from execution coverage.
    const f = await fixture();
    await f.working();
    await f.discover();
    const first = await f.interview('catalog', { action: 'next' });
    expect(first).toMatchObject({ status: 'interviewing', question: {
      module: 'catalog', category: 'proposito', human_review_required: true,
    } });
    expect(await f.call('qap_status')).toMatchObject({ siguiente_accion: {
      tool: 'qap_rules_set', module: 'catalog', canonical_interview: { action: 'next' },
    } });
    const pending = await f.close('catalog', { action: 'evaluate' });
    expect(pending.assessment.specification_coverage.status).toBe('incomplete');
    expect(pending.assessment.execution_coverage.status).toBe('not_executed');
    await f.ready('catalog');
    const requirements = (await f.knowledge.query(f.scope.applicationId, 'requirement')).items;
    expect(requirements).toHaveLength(1);
    expect(requirements[0].entity).toMatchObject({ category: 'functional',
      validation_status: 'confirmed', provenance: 'developer_interview' });
    expect(f.lifecycle().modules.catalog.state).toBe('planned');
    expect(existsSync(join(f.root, '.qa', 'modules', 'catalog', 'rules.yaml'))).toBe(false);
    expect(await f.approvedClosure('catalog', { action: 'close' })).toMatchObject({ status: 'closed' });
    expect(f.lifecycle().modules.catalog.state).toBe('closed');
    f.integrity();
  });
});
