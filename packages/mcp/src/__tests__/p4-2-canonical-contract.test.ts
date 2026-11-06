import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { validarPregunta, type Pregunta } from '@qap/engine';

import { createLifecycleFixture, type LifecycleFixture } from './fixtures/lifecycle-canonical.js';

// Isolated from the legacy suite's hoisted adapter mocks. Retains exact
// historical fullNames while exercising the canonical MCP SDK and host gateway.
describe('P4.2 Suite: Contrato Canónico de Pregunta y Verificación E2E (Criterio 4 y Criterio 6)', () => {
  let f: LifecycleFixture;
  const cleanup: Array<() => Promise<void>> = [];
  beforeEach(async () => { f = await createLifecycleFixture(close => cleanup.push(close)); });
  afterEach(async () => {
    const closed = await Promise.allSettled(cleanup.splice(0).map(close => close()));
    for (const item of closed) if (item.status === 'rejected') throw item.reason;
  });

  it('Criterio 4.4: Ninguna respuesta con siguiente_accion trae preguntas como cadenas ni pregunta aplanada', async () => {
    const responses = [];
    responses.push(await f.working());
    responses.push(await f.call('qap_status'));
    responses.push(await f.discover());
    responses.push(await f.call('qap_status'));
    responses.push(await f.interview('catalog', { action: 'next' }));
    responses.push(await f.close('catalog', { action: 'evaluate' }));
    for (const payload of responses) {
      expect(payload).not.toHaveProperty('pregunta');
      expect(payload).not.toHaveProperty('opciones');
      if (payload.siguiente_accion) {
        expect(payload.siguiente_accion).not.toHaveProperty('preguntas');
        if (payload.siguiente_accion.pregunta) {
          expect(typeof payload.siguiente_accion.pregunta).toBe('object');
          expect(Array.isArray(payload.siguiente_accion.pregunta.opciones)).toBe(true);
        }
      }
    }
    const question = (await f.interview('catalog', { action: 'next' })).question;
    expect(question).toMatchObject({ human_review_required: true, module: 'catalog', category: 'proposito' });
    expect(question.options.every(option => option.id.length > 0 && option.label.length > 0)).toBe(true);
    expect((await f.knowledge.query(f.scope.applicationId, 'requirement')).items).toHaveLength(0);
  });

  it('Criterio 6: E2E Completo donde TODA siguiente_accion de tipo entrevista, entrevista_vista o decision trae Pregunta válida', async () => {
    const init = await f.working(['catalog', 'orders']);
    expect(init.siguiente_accion.tipo).toBe('entrevista');
    expect(validarPregunta(init.siguiente_accion.pregunta as unknown as Pregunta).valid).toBe(true);
    const statusBefore = await f.call('qap_status');
    expect(statusBefore.siguiente_accion).toMatchObject({ tipo: 'trabajo', tool: 'qap_discover' });
    const discovery = await f.discover();
    expect(discovery).not.toHaveProperty('siguiente_accion');
    const question = (await f.interview('catalog', { action: 'next' })).question;
    expect(question.id).toMatch(/^interview:[a-f0-9]{64}$/);
    expect(question.version).toBeGreaterThan(0);
    expect(question.text.length).toBeGreaterThan(15);
    expect(question.human_review_required).toBe(true);
    expect(question.options.map(option => option.id)).toEqual(['propose', 'correct', 'defer', 'review']);
    expect((await f.interview('catalog', { action: 'next' })).question).toEqual(question);
    const statusDuring = await f.call('qap_status');
    expect(statusDuring.siguiente_accion).toMatchObject({
      tipo: 'trabajo', tool: 'qap_rules_set', module: 'catalog', canonical_interview: { action: 'next' },
    });
    expect((await f.knowledge.query(f.scope.applicationId, 'requirement')).items).toHaveLength(0);
    await f.ready(); // Propose -> blocked review -> independent synthetic host approval.
    expect((await f.knowledge.query(f.scope.applicationId, 'requirement')).items).toHaveLength(1);
    expect(await f.approvedClosure('catalog', { action: 'close' })).toMatchObject({ status: 'closed' });
    expect(await f.approvedClosure('orders', { action: 'waive',
      reason: 'Las órdenes se excluyen expresamente del alcance sintético de esta prueba.' })).toMatchObject({ status: 'waived' });
    const close = await f.call('qap_session_close');
    expect(close).toMatchObject({ status: 'success', fase: 'WRAP_UP' });
    const statusAfter = await f.call('qap_status');
    expect(statusAfter.siguiente_accion.tipo).toBe('decision');
    expect(validarPregunta(statusAfter.siguiente_accion.pregunta as unknown as Pregunta).valid).toBe(true);
    expect(statusAfter).not.toHaveProperty('pregunta');
    expect(statusAfter).not.toHaveProperty('opciones');
    f.integrity();
  });
});
