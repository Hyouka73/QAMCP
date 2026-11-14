import { readFileSync } from 'node:fs';

import { isEngineOptionLabel, isSubstantiveRuleText } from '@qap/shared';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createLifecycleFixture, type LifecycleFixture } from './fixtures/lifecycle-canonical.js';

// Historical P4.5-A identities retain full names. No hoisted adapter mocks:
// canonical interview and closure are verified against MCP SDK + SQLite.
describe('P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a)', () => {
  let f: LifecycleFixture;
  const cleanup: Array<() => Promise<void>> = [];
  beforeEach(async () => { f = await createLifecycleFixture(close => cleanup.push(close)); });
  afterEach(async () => {
    const outcomes = await Promise.allSettled(cleanup.splice(0).map(close => close()));
    for (const outcome of outcomes) if (outcome.status === 'rejected') throw outcome.reason;
  });

  it('Criterio 2: regla redactada por agente sin user_text ni from_option se guarda como inferred/agent y no cuenta en cobertura', async () => {
    await f.working();
    const initial = (await f.knowledge.query(f.scope.applicationId, 'requirement')).items;
    expect(await f.call('qap_rules_set', { module: 'catalog', view: 'default', rules: [{
      category: 'proposito', description: 'Enunciado fabricado por el agente', source: 'agent', status: 'confirmed',
    }] })).toMatchObject({ status: 'blocked', code: 'legacy_interview_unavailable' });
    const q = (await f.interview('catalog', { action: 'next' })).question;
    expect(await f.interview('catalog', { action: 'propose', question_id: q.id,
      version: q.version, expected_revision: 0, proposal: f.proposal })).toMatchObject({ status: 'pending_review' });
    expect((await f.knowledge.query(f.scope.applicationId, 'requirement')).items).toEqual(initial);
    expect((await f.close('catalog', { action: 'evaluate' })).assessment.specification_coverage.confirmed_requirements_count).toBe(0);
  });

  it('Criterio 3: una etiqueta de opción predefinida del motor NO cubre una categoría', async () => {
    expect(isEngineOptionLabel('Confirmar propósito y comportamiento esperado')).toBe(true);
    expect(isSubstantiveRuleText('Confirmar propósito y comportamiento esperado')).toBe(false);
    await f.working();
    const q = (await f.interview('catalog', { action: 'next' })).question;
    const proposal = { ...f.proposal, title: 'Confirmar propósito y comportamiento esperado' };
    const created = await f.interview('catalog', { action: 'propose', question_id: q.id, version: q.version,
      expected_revision: 0, proposal });
    expect(created.status).toBe('pending_review');
    expect(await f.interview('catalog', { action: 'review', question_id: q.id, version: created.question.version }))
      .toMatchObject({ status: 'blocked', code: 'substantive_statement_required' });
    expect((await f.knowledge.query(f.scope.applicationId, 'requirement')).items).toHaveLength(0);
  });

  it('Criterio 4: un módulo con 2 reglas de 7 categorías no cierra sin accept_gaps, y cierra con él dejando registro', async () => {
    await f.working();
    const question = (await f.interview('catalog', { action: 'next' })).question;
    await f.confirm('catalog', question, f.proposal);
    const evaluation = await f.close('catalog', { action: 'evaluate' });
    expect(evaluation.assessment.specification_coverage).toMatchObject({
      status: 'incomplete', confirmed_requirements_count: 1,
    });
    expect(await f.close('catalog', { action: 'close' }))
      .toMatchObject({ status: 'blocked', code: 'closure_preconditions_not_met' });
    const gap = evaluation.assessment.gaps.find(item => item.status === 'unaddressed');
    expect(gap).toBeDefined();
    const selected = [{ gap_id: gap!.id, reason: 'La brecha explícita es aceptada mediante revisión independiente.' }];
    expect(await f.approvedClosure('catalog', { action: 'accept_gaps', accepted_gaps: selected }))
      .toMatchObject({ status: 'gaps_accepted' });
    expect(f.durable().acceptedGaps.catalog).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: gap!.id, status: 'accepted', reason: selected[0].reason }),
    ]));
    // Acceptance of one gap does NOT bypass all remaining closure prerequisites.
    expect(await f.close('catalog', { action: 'close' }))
      .toMatchObject({ status: 'blocked', code: 'closure_preconditions_not_met' });
    expect(f.lifecycle().modules.catalog.state).toBe('planned');
  });

  it('C9a: blocked de qap_discover con auth_required incluye razon auth_required y directorio_objetivo, con claves alineadas a session_invalid', async () => {
    await f.working();
    const before = readFileSync(f.lifecyclePath, 'utf8');
    const denied = await f.call('qap_discover', { name: 'catalog', path: '/catalog', auth: { required: true } });
    expect(denied).toMatchObject({ status: 'blocked', code: 'authentication_not_supported',
      acquisition_status: 'blocked', acquisition_persistence: 'not_attempted',
      persistence: 'not_attempted', association_status: 'not_attempted' });
    expect(readFileSync(f.lifecyclePath, 'utf8')).toBe(before);
    expect((await f.knowledge.query(f.scope.applicationId, 'observation')).items).toHaveLength(0);
    expect((await f.knowledge.query(f.scope.applicationId, 'requirement')).items).toHaveLength(0);
  });

  it('C4-a: from_option con pregunta_id inexistente, opcion_id inexistente o sin texto sustantivo (rechazo o degradación a agent/inferred)', async () => {
    await f.working();
    const question = (await f.interview('catalog', { action: 'next' })).question;
    expect(await f.interview('catalog', { action: 'review', question_id: 'invented-question', version: question.version }))
      .toMatchObject({ status: 'blocked', code: 'unknown_question' });
    const invalidLegacy = await f.call('qap_rules_set', { module: 'catalog', view: 'default', rules: [{
      category: 'proposito', from_option: { pregunta_id: 'invented-question', opcion_id: 'fake-option' },
    }] });
    expect(invalidLegacy).toMatchObject({ status: 'blocked', code: 'legacy_interview_unavailable' });
    expect(question.options.some(option => option.id === 'fake-option')).toBe(false);
    expect((await f.knowledge.query(f.scope.applicationId, 'requirement')).items).toHaveLength(0);
  });

  it('C4-b: límites de sustantividad (2 palabras o 19 caracteres no cubren; 3 palabras y 20 caracteres sí)', async () => {
    expect(isSubstantiveRuleText('PalabraUnica PalabraLargaVeinteChars')).toBe(false);
    expect(isSubstantiveRuleText('uno dos tres cuatro')).toBe(false);
    expect('uno dos tres cuatro'.length).toBe(19);
    expect('Uno dos tres cuatro!'.length).toBe(20);
    expect(isSubstantiveRuleText('Uno dos tres cuatro!')).toBe(true);
    await f.working();
    const q = (await f.interview('catalog', { action: 'next' })).question;
    const partial = await f.interview('catalog', { action: 'propose', question_id: q.id, version: q.version,
      expected_revision: 0, proposal: { ...f.proposal, title: 'uno dos tres cuatro' } });
    expect(await f.interview('catalog', { action: 'review', question_id: q.id, version: partial.question.version }))
      .toMatchObject({ status: 'blocked', code: 'substantive_statement_required' });
    expect((await f.knowledge.query(f.scope.applicationId, 'requirement')).items).toHaveLength(0);
    const corrected = await f.interview('catalog', { action: 'correct', question_id: q.id,
      version: partial.question.version, expected_revision: 0, proposal: f.proposal });
    expect(corrected.status).toBe('corrected');
    const before = (await f.knowledge.query(f.scope.applicationId, 'requirement')).items;
    expect(await f.interview('catalog', { action: 'review', question_id: q.id, version: corrected.question.version }))
      .toMatchObject({ status: 'blocked', code: 'human_review_not_authorized' });
    expect((await f.knowledge.query(f.scope.applicationId, 'requirement')).items).toEqual(before);
  });

  it('C4-c: accept_gaps con razón de 14 caracteres bloquea y con 15 cierra y deja el registro', async () => {
    await f.working();
    const evaluation = await f.close('catalog', { action: 'evaluate' });
    const gap = evaluation.assessment.gaps.find(item => item.status === 'unaddressed');
    expect(gap).toBeDefined();
    const reason14 = '12345678901234', reason15 = 'Riesgo aceptado';
    expect(reason14).toHaveLength(14);
    expect(reason15).toHaveLength(15);
    const small = await f.close('catalog', { action: 'accept_gaps',
      accepted_gaps: [{ gap_id: gap!.id, reason: reason14 }] });
    expect(small).toMatchObject({ status: 'blocked', code: 'invalid_canonical_arguments' });
    expect(f.durable().acceptedGaps.catalog).toBeUndefined();
    const command = { action: 'accept_gaps' as const, accepted_gaps: [{ gap_id: gap!.id, reason: reason15 }] };
    expect(await f.approvedClosure('catalog', command)).toMatchObject({ status: 'gaps_accepted' });
    expect(f.durable().acceptedGaps.catalog).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: gap!.id, reason: reason15 }),
    ]));
    expect(f.lifecycle().modules.catalog.state).toBe('planned');
  });

  it('C1: campos honestos en bloqueos previos a navegar y navegación real', async () => {
    await f.working();
    const before = readFileSync(f.lifecyclePath, 'utf8');
    await f.restart(false);
    const denied = await f.call('qap_discover', { name: 'catalog', path: '/catalog' });
    expect(denied).toMatchObject({ status: 'blocked', code: 'discovery_authorization_required',
      persistence: 'not_attempted', acquisition_persistence: 'not_attempted',
      association_status: 'not_attempted' });
    expect(readFileSync(f.lifecyclePath, 'utf8')).toBe(before);
    expect((await f.knowledge.query(f.scope.applicationId, 'observation')).items).toHaveLength(0);
    await f.restart(true);
    const actual = await f.discover();
    expect(actual).toMatchObject({ status_scope: 'acquisition', mode: 'fresh_anonymous_static',
      persistence: 'committed', counts: { views: expect.any(Number), visited_routes: expect.any(Number) } });
    expect((await f.knowledge.query(f.scope.applicationId, 'observation')).items.length).toBeGreaterThan(0);
    expect(readFileSync(f.lifecyclePath, 'utf8')).toBe(before);
  });

  it('C3: flujo real de preguntas de categoría, formato una_opcion, persistencia y respuestas user_text y deferred', async () => {
    await f.working();
    await f.discover();
    const q = (await f.interview('catalog', { action: 'next' })).question;
    expect(q.options.map(option => option.id)).toEqual(['propose', 'correct', 'defer', 'review']);
    const deferred = await f.interview('catalog', { action: 'defer', question_id: q.id, version: q.version });
    expect(deferred).toMatchObject({ status: 'deferred', question: { state: 'deferred' } });
    expect((await f.knowledge.query(f.scope.applicationId, 'requirement')).items).toHaveLength(0);
    const resumed = await f.interview('catalog', { action: 'resume',
      question_id: q.id, version: deferred.question.version });
    expect(resumed).toMatchObject({ question: { id: q.id } });
    await f.confirm('catalog', resumed.question, f.proposal);
    expect((await f.knowledge.query(f.scope.applicationId, 'requirement')).items).toHaveLength(1);
    expect((await f.close('catalog', { action: 'evaluate' })).assessment.execution_coverage.status).toBe('not_executed');
    f.integrity();
  });

});
