import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { validarPregunta } from '@qap/engine';
import { SqliteKnowledgeAdapter } from '@qap/knowledge';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createLifecycleFixture, type LifecycleFixture } from './fixtures/lifecycle-canonical.js';

describe('Lifecycle V3 E2E & Verification Suite (E0 - E3)', () => {
  let f: LifecycleFixture;
  const cleanup: Array<() => Promise<void>> = [];
  beforeEach(async () => { f = await createLifecycleFixture(close => cleanup.push(close)); });
  afterEach(async () => {
    const results = await Promise.allSettled(cleanup.splice(0).map(close => close()));
    for (const result of results) if (result.status === 'rejected') throw result.reason;
  });

  // Historical identities remain stable; equivalence is recorded in MATRIZ_55.md.
  it('E0a: qap_status en WORKING para módulo con cobertura incompleta devuelve module, view y preguntas no vacías idénticas a qap_rules_set', async () => {
    await f.working(); await f.discover();
    expect((await f.knowledge.query(f.scope.applicationId, 'observation')).items.length).toBeGreaterThan(0);
    expect((await f.knowledge.query(f.scope.applicationId, 'requirement')).items).toHaveLength(0);
    const first = await f.interview('catalog', { action: 'next' });
    expect(first).toMatchObject({ status: 'interviewing', question: { module: 'catalog', category: 'proposito', human_review_required: true } });
    await f.confirm('catalog', first.question, f.proposal);
    const partial = await f.interview('catalog', { action: 'next' });
    expect(partial).toMatchObject({ status: 'interviewing', question: { category: 'actor' } });
    const stateBefore = readFileSync(f.lifecyclePath, 'utf8'), authorityBefore = f.durable();
    const reviewsBefore = f.inbox.interviews.length;
    const coverageBefore = (await f.close('catalog', { action: 'evaluate' })).assessment;
    expect(coverageBefore.specification_coverage).toMatchObject({ status: 'incomplete', confirmed_requirements_count: 1 });
    const status = await f.call('qap_status');
    expect(status).toMatchObject({ fase: 'WORKING', siguiente_accion: {
      tipo: 'trabajo', tool: 'qap_rules_set', module: 'catalog', canonical_interview: { action: 'next' },
    } });
    expect(status).toHaveProperty('canonical_modules', expect.arrayContaining([
      expect.objectContaining({ plannedName: 'catalog', interview: expect.objectContaining({ pending_proposals: 0, confirmed_requirements: 1 }) }),
    ]));
    const resumed = await f.call(status.siguiente_accion.tool, {
      module: status.siguiente_accion.module, canonical_interview: status.siguiente_accion.canonical_interview,
    });
    expect(resumed.question).toEqual(partial.question);
    expect((await f.call('qap_status')).siguiente_accion).toEqual(status.siguiente_accion);
    expect((await f.close('catalog', { action: 'evaluate' })).assessment.coverage_digest).toBe(coverageBefore.coverage_digest);
    expect(readFileSync(f.lifecyclePath, 'utf8')).toBe(stateBefore);
    expect(f.durable()).toEqual(authorityBefore);
    expect(f.inbox.interviews).toHaveLength(reviewsBefore);
    f.integrity();
  });

  it('E0b: contrato estricto de opciones y preguntas en todo el flujo', async () => {
    const init = await f.working();
    expect(init).toMatchObject({ status: 'success', siguiente_accion: { tipo: 'entrevista' } });
    expect(validarPregunta(init.siguiente_accion.pregunta!).valid).toBe(true);
    expect(init).not.toHaveProperty('pregunta'); expect(init).not.toHaveProperty('opciones');
    await f.discover();
    let current = await f.interview('catalog', { action: 'next' });
    expect(current.status).toBe('interviewing');
    const categories = new Set<string>();
    for (let i = 0; i < 7; i++) {
      const q = current.question;
      expect(q.id).toMatch(/^interview:[a-f0-9]{64}$/);
      expect(q.module).toBe('catalog'); expect(q.text.length).toBeGreaterThan(15);
      expect(q.options.map(o => o.id)).toEqual(['propose', 'correct', 'defer', 'review']);
      expect(q.options.every(o => o.label.length > 0)).toBe(true);
      expect(q.human_review_required).toBe(true);
      expect(current).toMatchObject({ coverage: 'not_certified' });
      expect(current).not.toHaveProperty('pregunta'); expect(current).not.toHaveProperty('opciones');
      categories.add(q.category);
      await f.confirm('catalog', q, { ...f.proposal, title: `Consulta sintética revisada de ${q.category}`,
        description: `El alcance sintético de ${q.category} requiere consulta pública sin modificar datos.` });
      current = await f.interview('catalog', { action: 'next' });
    }
    expect(categories).toEqual(new Set(['proposito', 'actor', 'dato', 'sensibilidad', 'campo', 'accion', 'error']));
    expect(current.status).toBe('reviewed_questions_only');
    expect((await f.knowledge.query(f.scope.applicationId, 'requirement')).items).toHaveLength(7);
    expect(await f.close('catalog', { action: 'close' })).toMatchObject({ status: 'blocked', code: 'closure_preconditions_not_met' });
  });

  it('E0c: qap_report sin ejecuciones responde blocked y no escribe archivos; ninguna siguiente_accion recomienda qap_report sin ejecuciones', async () => {
    expect(await f.call('qap_init', { baseUrl: 'http://localhost:3000' })).toMatchObject({ status: 'success' });
    const report = await f.call('qap_report', { format: 'all' });
    expect(report).toMatchObject({ status: 'blocked' });
    expect(report).toHaveProperty('razon', expect.stringContaining('ejecuciones'));
    const execDir = join(f.root, '.qa', 'executions');
    if (existsSync(execDir)) expect(readdirSync(execDir).filter(file => /\.report\.(html|json)$/.test(file))).toHaveLength(0);
    expect(report.siguiente_accion.tool).not.toBe('qap_report');
    expect((await f.call('qap_status')).siguiente_accion.tool).not.toBe('qap_report');
  });

  it('E1: regresión consolidated -> interviewing tras re-discover y política de waivers', async () => {
    await f.working(); await f.discover();
    const confirmed = await f.ready();
    const before = (await f.close('catalog', { action: 'evaluate' })).assessment;
    const requirements = (await f.knowledge.query(f.scope.applicationId, 'requirement')).items, history = f.lifecycle().history;
    await f.discover();
    // DOM acquisition cannot invent requirements or regress lifecycle authority.
    expect((await f.knowledge.query(f.scope.applicationId, 'requirement')).items).toEqual(requirements);
    expect((await f.close('catalog', { action: 'evaluate' })).assessment.coverage_digest).toBe(before.coverage_digest);
    expect(f.lifecycle().history).toEqual(history);
    await f.confirm('catalog', confirmed.question, { ...f.proposal,
      description: 'La consulta debe incluir también productos aprobados por revisión independiente.', acceptance_criteria: [] }, 1);
    const changed = (await f.close('catalog', { action: 'evaluate' })).assessment;
    expect(changed.coverage_digest).not.toBe(before.coverage_digest);
    expect(changed).toMatchObject({ closure_verdict: 'blocked_by_gaps', specification_coverage: { status: 'incomplete' } });
    expect(changed.gaps).toEqual(expect.arrayContaining([expect.objectContaining({ absence_type: 'incomplete_acceptance_criterion', status: 'unaddressed' })]));
    expect(await f.close('catalog', { action: 'close' })).toMatchObject({ status: 'blocked', code: 'closure_preconditions_not_met' });
    expect(f.durable().closures).toEqual({});
    expect(f.lifecycle().modules.catalog.state).toBe('planned');
    expect((await f.interview('catalog', { action: 'next' })).question.category).toBe('actor');
    expect(await f.call('qap_status')).toMatchObject({ siguiente_accion: { tool: 'qap_rules_set', module: 'catalog' } });
    f.integrity();
  });

  it('E1 canonical: applicability rejects legacy categories and short reasons; wire waivers cannot replace host review', async () => {
    await f.working();
    const before = f.durable(), lifecycle = readFileSync(f.lifecyclePath, 'utf8');
    for (const decisions of [
      [{ category: 'proposito', reason: 'Una categoría legacy no es una categoría formal' }],
      [{ category: 'security', reason: 'Muy corta' }],
    ]) expect(await f.call('qap_module_close', { module: 'catalog', canonical_closure: { action: 'declare_non_applicable', decisions } }))
      .toMatchObject({ status: 'blocked', code: 'invalid_canonical_arguments' });
    expect(await f.close('catalog', { action: 'declare_non_applicable', decisions: [
      { category: 'security', reason: 'El alcance sintético excluye expresamente seguridad.' },
    ] })).toMatchObject({ status: 'blocked', code: 'closure_review_pending' });
    expect(await f.call('qap_rules_set', { module: 'catalog', category_waivers: [
      { category: 'proposito', reason: 'El texto del cliente no concede una autorización' },
    ] })).toMatchObject({ status: 'blocked', code: 'legacy_interview_unavailable' });
    expect(f.durable()).toEqual(before);
    expect(readFileSync(f.lifecyclePath, 'utf8')).toBe(lifecycle);
    expect((await f.knowledge.query(f.scope.applicationId, 'requirement')).items).toHaveLength(0);
  });

  it('E1 canonical: a reviewed specification revision invalidates an earlier pending closure authorization', async () => {
    await f.working();
    const confirmed = await f.ready();
    expect(await f.close('catalog', { action: 'close' })).toMatchObject({ status: 'blocked', code: 'closure_review_pending' });
    const oldRequest = f.inbox.closures.at(-1)!;
    await f.confirm('catalog', confirmed.question, { ...f.proposal,
      description: 'La consulta pública debe devolver exclusivamente productos activos y disponibles.' }, 1);
    f.inbox.approveClosure(oldRequest);
    const before = f.durable();
    expect(await f.close('catalog', { action: 'close' })).toMatchObject({ status: 'blocked', code: 'closure_review_pending' });
    expect(f.inbox.closures.at(-1)!.coverageDigest).not.toBe(oldRequest.coverageDigest);
    expect(f.inbox.closures.at(-1)!.requestDigest).not.toBe(oldRequest.requestDigest);
    expect(f.durable()).toEqual(before); expect(f.durable().closures).toEqual({});
    expect(f.lifecycle().modules.catalog.state).toBe('planned');
    expect((await f.knowledge.query(f.scope.applicationId, 'relation')).items.filter(r => r.trace.source === 'canonical_module_closure_v1')).toHaveLength(0);
  });

  it('E2: qap_module_close validaciones, compuertas y transiciones', async () => {
    await f.working(['catalog', 'orders']);
    const initial = f.durable();
    expect(await f.close('missing', { action: 'close' })).toMatchObject({ status: 'blocked', code: 'unbound' });
    expect(await f.call('qap_module_close', { module: 'catalog', action: 'close', user_confirmed: true }))
      .toMatchObject({ status: 'blocked', code: 'canonical_closure_required' });
    expect(await f.close('catalog', { action: 'close' })).toMatchObject({ status: 'blocked', code: 'closure_preconditions_not_met' });
    expect(f.durable()).toEqual(initial);
    await f.discover(); await f.ready();
    expect(await f.approvedClosure('catalog', { action: 'close' })).toMatchObject({ status: 'closed' });
    expect(f.lifecycle().modules.catalog.state).toBe('closed');
    const snapshot = f.durable(), receipts = (await f.knowledge.query(f.scope.applicationId, 'relation')).items;
    expect(receipts.filter(r => r.trace.source === 'canonical_module_closure_v1')).toHaveLength(1);
    expect(await f.close('catalog', { action: 'close' })).toMatchObject({ status: 'closed', idempotent: true });
    expect(await f.close('catalog', { action: 'waive', reason: 'Intento de cambiar un cierre ya autorizado' })).toMatchObject({ status: 'closed', idempotent: true });
    expect(f.durable()).toEqual(snapshot);
    expect((await f.knowledge.query(f.scope.applicationId, 'relation')).items).toEqual(receipts);
    expect(await f.call('qap_status')).toMatchObject({ siguiente_accion: { tool: 'qap_discover' } });
    expect(await f.close('orders', { action: 'waive', reason: 'corta' })).toMatchObject({ status: 'blocked', code: 'invalid_canonical_arguments' });
    expect(await f.approvedClosure('orders', { action: 'waive', reason: 'El equipo pospone explícitamente las órdenes de este alcance sintético.' })).toMatchObject({ status: 'waived' });
    expect(f.lifecycle().modules.orders.state).toBe('waived');
    expect((await f.knowledge.query(f.scope.applicationId, 'relation')).items.filter(r => r.trace.source === 'canonical_module_waiver_v1')).toHaveLength(1);
    expect(await f.call('qap_status')).toMatchObject({ siguiente_accion: { tool: 'qap_session_close' } });
    f.integrity();
  });

  it('E3: canExitWorking, qap_session_close, reporte de brechas y nueva sesión desde WRAP_UP', async () => {
    await f.working(['catalog', 'orders']);
    expect(await f.call('qap_session_close')).toMatchObject({ status: 'blocked', code: 'canonical_module_closure_required', unclosed_modules: ['catalog', 'orders'] });
    await f.discover(); await f.ready();
    expect(await f.approvedClosure('catalog', { action: 'close' })).toMatchObject({ status: 'closed' });
    expect(await f.call('qap_session_close')).toMatchObject({ status: 'blocked', unclosed_modules: ['orders'] });
    const reason = 'El equipo pospone las órdenes hasta disponer del backend del entorno.';
    expect(await f.approvedClosure('orders', { action: 'waive', reason })).toMatchObject({ status: 'waived' });
    const durable = f.durable();
    await f.restart(); expect(f.durable()).toEqual(durable);
    const closed = await f.call('qap_session_close');
    expect(closed).toMatchObject({ status: 'success', fase: 'WRAP_UP' });
    const report = readFileSync(closed.report_path, 'utf8');
    expect(report).toContain('# Reporte de cierre canónico de sesión');
    expect(report).toContain('catalog'); expect(report).toContain('orders'); expect(report).toContain(reason);
    expect(report).toContain('Consultar el catálogo público');
    for (const record of Object.values(durable.closures)) expect(report).toContain(record.decisionId);
    expect(report).toContain('no certificada por este reporte'); expect(report).not.toContain('cobertura por flujo crítico');
    expect(f.lifecycle().phase).toBe('WRAP_UP');
    const status = await f.call('qap_status');
    expect(status).toMatchObject({ fase: 'WRAP_UP', siguiente_accion: { tipo: 'decision' } });
    expect(status.siguiente_accion.pregunta!.opciones.length).toBeGreaterThanOrEqual(2);
    expect(status.siguiente_accion.descripcion).toContain(closed.report_path);
    const before = readFileSync(f.lifecyclePath, 'utf8');
    expect(await f.call('qap_discover', { name: 'dashboard', path: '/dashboard' })).toMatchObject({ status: 'blocked', persistence: 'not_attempted' });
    expect(await f.call('qap_rules_set', { module: 'catalog', rules: [] })).toMatchObject({ status: 'blocked' });
    expect(await f.call('qap_session_plan', { plan: [{ module: 'catalog', path: '/catalog', priority: 'high' }] })).toMatchObject({ status: 'error' });
    expect(readFileSync(f.lifecyclePath, 'utf8')).toBe(before);
    const oldSession = f.lifecycle().session.id, oldHistory = f.lifecycle().history;
    expect(await f.call('qap_session_plan', { plan: [{ module: 'dashboard', path: '/dashboard', priority: 'high' }] })).toMatchObject({ status: 'success', fase: 'WORKING' });
    const next = f.lifecycle();
    expect(next.modules).toMatchObject({ catalog: { state: 'closed' }, orders: { state: 'waived' }, dashboard: { state: 'planned' } });
    expect(next.session.id).not.toBe(oldSession);
    expect(next.history.slice(0, oldHistory.length)).toEqual(oldHistory);
    expect(next.history.slice(oldHistory.length).map(h => [h.from, h.to])).toEqual([['WRAP_UP', 'SCOPING'], ['SCOPING', 'WORKING']]);
    expect(readFileSync(closed.report_path, 'utf8')).toBe(report); expect(f.durable()).toEqual(durable);
    f.integrity();
  });

  it('Criterio 9: E2E completo: init -> onboarding -> scoping -> working -> discover A -> rules_set parcial -> status (reanuda) -> rules_set completa -> module_close A -> discover B -> module_close waive B -> session_close -> status WRAP_UP -> session_plan nueva sesión', async () => {
    await f.working(['catalog', 'orders']); await f.discover('catalog');
    const question = (await f.interview('catalog', { action: 'next' })).question;
    expect(await f.interview('catalog', { action: 'propose', question_id: question.id, version: question.version,
      expected_revision: 0, proposal: f.proposal })).toMatchObject({ status: 'pending_review' });
    expect((await f.knowledge.query(f.scope.applicationId, 'requirement')).items).toHaveLength(0);
    const drafts = f.drafts(); await f.restart(); expect(f.drafts()).toEqual(drafts);
    expect(await f.call('qap_status')).toMatchObject({ siguiente_accion: { tool: 'qap_rules_set', module: 'catalog', canonical_interview: { action: 'next' } } });
    expect((await f.interview('catalog', { action: 'next' })).question).toMatchObject({ id: question.id, version: 1, state: 'pending_review' });
    await f.ready();
    expect(await f.approvedClosure('catalog', { action: 'close' })).toMatchObject({ status: 'closed' });
    await f.discover('orders');
    expect((await f.knowledge.query(f.scope.applicationId, 'requirement')).items.every(r => r.entity.module_key === 'catalog')).toBe(true);
    expect(await f.approvedClosure('orders', { action: 'waive', reason: 'El host difiere las órdenes sin afirmar cobertura de pruebas.' })).toMatchObject({ status: 'waived' });
    const report = await f.call('qap_session_close');
    expect(report).toMatchObject({ status: 'success', fase: 'WRAP_UP' }); expect(existsSync(report.report_path)).toBe(true);
    expect(await f.call('qap_status')).toMatchObject({ fase: 'WRAP_UP' });
    const physical = new SqliteKnowledgeAdapter(f.path);
    try {
      expect((await physical.query(f.scope.applicationId, 'requirement')).items).toHaveLength(1);
      const receipts = (await physical.query(f.scope.applicationId, 'relation')).items;
      for (const source of ['human_review_authorization_v1', 'canonical_module_closure_v1', 'canonical_module_waiver_v1'])
        expect(receipts.filter(r => r.trace.source === source)).toHaveLength(1);
      expect((await physical.query('other-app', 'observation')).items).toHaveLength(0);
    } finally { physical.close(); }
    expect(await f.call('qap_session_plan', { plan: [{ module: 'dashboard', path: '/dashboard', priority: 'high' }] })).toMatchObject({ status: 'success', fase: 'WORKING' });
    await f.restart(true, ['catalog', 'orders', 'dashboard']);
    expect(await f.interview('dashboard', { action: 'next' })).toMatchObject({ status: 'interviewing', question: { module: 'dashboard' } });
    f.integrity();
  });

  it('E0 authorization: removing host consent blocks navigation and leaves Knowledge, drafts and lifecycle intact', async () => {
    await f.working(); await f.restart(false);
    const lifecycle = readFileSync(f.lifecyclePath, 'utf8'), durable = f.durable(), drafts = f.drafts();
    expect(await f.call('qap_discover', { name: 'catalog', path: '/catalog' }))
      .toMatchObject({ status: 'blocked', code: 'discovery_authorization_required', persistence: 'not_attempted' });
    for (const kind of ['observation', 'requirement', 'relation'] as const)
      expect((await f.knowledge.query(f.scope.applicationId, kind)).items).toHaveLength(0);
    expect(readFileSync(f.lifecyclePath, 'utf8')).toBe(lifecycle);
    expect(f.durable()).toEqual(durable); expect(f.drafts()).toEqual(drafts);
    expect(existsSync(join(f.root, '.qa', 'modules', 'catalog'))).toBe(false);
  });
});
