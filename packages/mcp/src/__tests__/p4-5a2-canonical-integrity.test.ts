import { readFileSync } from 'node:fs';
import { isSubstantiveRuleText, normalizeSlug } from '@qap/shared';
import { afterEach, describe, expect, it } from 'vitest';
import { createLifecycleFixture, type LifecycleFixture } from './fixtures/lifecycle-canonical.js';

// Stable nested historical fullNames; canonical tests have no hoisted adapter mocks.
describe('P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10)', () => {
  const cleanup: Array<() => Promise<void>> = [];
  const fixture = (html?: string): Promise<LifecycleFixture> => createLifecycleFixture(close => cleanup.push(close), html);
  afterEach(async () => {
    const settled = await Promise.allSettled(cleanup.splice(0).map(close => close()));
    for (const v of settled) if (v.status === 'rejected') throw v.reason;
  });
  describe('C3: Integridad de categoría en from_option y regla de cobertura completa', () => {
    it('C3-a: la categoría de from_option se toma siempre de la pregunta pendiente persistida', async () => {
      const f = await fixture();
      await f.working();
      const q = (await f.interview('catalog', { action: 'next' })).question;
      expect(q.category).toBe('proposito');
      // Interview category is a question prompt; formal requirement classification is explicit.
      const proposal = { ...f.proposal, category: 'security' as const };
      const p = await f.interview('catalog', { action: 'propose', question_id: q.id,
        version: q.version, expected_revision: 0, proposal });
      expect(p).toMatchObject({ status: 'pending_review', question: { id: q.id, category: 'proposito' } });
      expect((await f.knowledge.query(f.scope.applicationId, 'requirement')).items).toHaveLength(0);
      const review = { action: 'review' as const, question_id: q.id, version: p.question.version };
      expect(await f.interview('catalog', review)).toMatchObject({
        status: 'blocked', code: 'human_review_not_authorized',
      });
      const request = f.inbox.interviews.at(-1)!;
      expect(request.proposal.category).toBe('security');
      f.inbox.approveInterview(request);
      const accepted = await f.interview('catalog', review);
      expect(accepted).toMatchObject({ status: 'confirmed', revision: 1 });
      const saved = await f.knowledge.get(f.scope.applicationId, 'requirement', accepted.requirement_id);
      expect(saved?.entity).toMatchObject({
        category: 'security', validation_status: 'confirmed', provenance: 'developer_interview',
      });
      expect(saved?.trace).toMatchObject({ source: 'canonical_interview_v1',
        reason: request.requestDigest, review: 'reviewed' });
      f.integrity();
    });

    it('C3-b: si la petición declara una categoría distinta a la de la pregunta pendiente se rechaza con blocked', async () => {
      const f = await fixture();
      await f.working();
      const q = (await f.interview('catalog', { action: 'next' })).question;
      const before = await f.knowledge.query(f.scope.applicationId, 'requirement');
      expect(await f.interview('catalog', { action: 'review', question_id: 'invented-actor',
        version: q.version })).toMatchObject({ status: 'blocked', code: 'unknown_question' });
      expect(await f.interview('orders', { action: 'propose', question_id: q.id, version: q.version,
        expected_revision: 0, proposal: f.proposal })).toMatchObject({ status: 'blocked' });
      // An unrecognized formal category cannot be smuggled through a canonical command.
      const invalid = await f.call('qap_rules_set', { module: 'catalog', canonical_interview: {
        action: 'propose', question_id: q.id, version: q.version, expected_revision: 0,
        proposal: { ...f.proposal, category: 'categoria_inventada' },
      } });
      expect(invalid.status).not.toBe('pending_review');
      expect(invalid.status).not.toBe('confirmed');
      // A valid category DIFFERENT from the prompt is allowed to be proposed,
      // but must never persist without a separate host review (TM-33 positive).
      const proposed = await f.interview('catalog', { action: 'propose', question_id: q.id,
        version: q.version, expected_revision: 0, proposal: { ...f.proposal, category: 'security' } });
      expect(proposed).toMatchObject({ status: 'pending_review' });
      expect(await f.interview('catalog', { action: 'review', question_id: q.id,
        version: proposed.question.version })).toMatchObject({
        status: 'blocked', code: 'human_review_not_authorized',
      });
      expect(await f.knowledge.query(f.scope.applicationId, 'requirement')).toEqual(before);
      f.integrity();
    });
  });

  describe('C4: Flujo de respuestas cortas como borrador y propuesta de enunciado', () => {
    it('C4-a: respuesta corta se guarda como borrador (status inferred, source user_text, borrador true) y no cubre', async () => {
      const f=await fixture();await f.working();const q=(await f.interview('catalog',{action:'next'})).question;expect(await f.interview('catalog',{action:'propose',question_id:q.id,version:q.version,expected_revision:0,proposal:{...f.proposal,title:'Gestión compras'}})).toMatchObject({status:'pending_review'});const draft=f.drafts();expect(draft.questions.find(item=>item.id===q.id)).toMatchObject({state:'pending_review',proposal:{title:'Gestión compras'}});expect((await f.knowledge.query(f.scope.applicationId,'requirement')).items).toHaveLength(0);await f.restart();expect(f.drafts()).toEqual(draft);const next=(await f.interview('catalog',{action:'next'})).question;expect(next.id).toBe(q.id);expect(await f.interview('catalog',{action:'review',question_id:q.id,version:next.version})).toMatchObject({status:'blocked',code:'substantive_statement_required'});
    });

    it('C4-b: derivación determinista en categoría actor que nombra roles emite Pregunta una_opcion directamente', async () => {
      const f=await fixture();await f.working();const first=(await f.interview('catalog',{action:'next'})).question;await f.confirm('catalog',first,f.proposal);const actor=(await f.interview('catalog',{action:'next'})).question;expect(actor).toMatchObject({module:'catalog',category:'actor',human_review_required:true});expect(actor.options.map(o=>o.id)).toEqual(['propose','correct','defer','review']);expect((await f.interview('catalog',{action:'next'})).question).toEqual(actor);expect((await f.knowledge.query(f.scope.applicationId,'requirement')).items).toHaveLength(1);
    });

    it('C4-c: envío de propuesta_enunciado válida para un borrador emite Pregunta una_opcion con las 3 opciones', async () => {
      const f=await fixture();await f.working();const q=(await f.interview('catalog',{action:'next'})).question;const p=await f.interview('catalog',{action:'propose',question_id:q.id,version:q.version,expected_revision:0,proposal:f.proposal});expect(p).toMatchObject({status:'pending_review',question:{id:q.id,human_review_required:true}});expect(p.question.options.map(o=>o.id)).toEqual(['propose','correct','defer','review']);expect(await f.interview('catalog',{action:'review',question_id:q.id,version:p.question.version})).toMatchObject({status:'blocked',code:'human_review_not_authorized'});expect((await f.knowledge.query(f.scope.applicationId,'requirement')).items).toHaveLength(0);
    });

    it('C4-d: resolver con "Es correcto" guarda regla confirmed user_confirmed con enunciado exacto y cubre', async () => {
      const f = await fixture();
      await f.working();
      const q = (await f.interview('catalog', { action: 'next' })).question;
      const approved = await f.confirm('catalog', q, f.proposal);
      expect(approved.result).toMatchObject({ status: 'confirmed', revision: 1 });
      const req = (await f.knowledge.query(f.scope.applicationId, 'requirement')).items;
      expect(req).toHaveLength(1);
      expect(req[0].entity).toMatchObject({ title: f.proposal.title, description: f.proposal.description,
        category: 'functional', validation_status: 'confirmed', provenance: 'developer_interview' });
      const saved = await f.knowledge.get(f.scope.applicationId, 'requirement', req[0].entity.id);
      expect(saved?.trace).toMatchObject({ source: 'canonical_interview_v1', review: 'reviewed',
        reason: expect.any(String) });
      const receipts = (await f.knowledge.query(f.scope.applicationId, 'relation')).items
        .filter(item => item.trace.source === 'human_review_authorization_v1');
      expect(receipts).toHaveLength(1);
      expect(receipts[0].trace).toMatchObject({ reason: saved?.trace.reason, review: 'reviewed' });
      expect(receipts[0].entity).toMatchObject({ predicate: 'related_to',
        target: { kind: 'requirement', id: req[0].entity.id, revision: 1 } });
      const incomplete = await f.close('catalog', { action: 'evaluate' });
      expect(incomplete.assessment.specification_coverage.status).toBe('incomplete');
      expect(await f.approvedClosure('catalog', { action: 'declare_non_applicable', decisions:
        (['business_rule', 'security', 'ui', 'ux', 'regression', 'performance'] as const).map(category => ({
          category, reason: `Fuera del alcance sintético del catálogo: ${category}.`,
        })) })).toMatchObject({ status: 'declared_non_applicable' });
      const coverage = await f.close('catalog', { action: 'evaluate' });
      expect(coverage.assessment.specification_coverage).toMatchObject({
        status: 'complete', confirmed_requirements_count: 1,
      });
      expect(coverage.assessment.execution_coverage.status).toBe('not_executed');
      f.integrity();
    });

    it('C4-e: resolver con "Lo defino después" guarda regla deferred y no cubre', async () => {
      const f=await fixture();await f.working();const q=(await f.interview('catalog',{action:'next'})).question;const d=await f.interview('catalog',{action:'defer',question_id:q.id,version:q.version});expect(d).toMatchObject({status:'deferred',question:{state:'deferred'}});expect((await f.knowledge.query(f.scope.applicationId,'requirement')).items).toHaveLength(0);await f.restart();expect((await f.interview('catalog',{action:'next'})).question).toMatchObject({id:q.id,state:'deferred'});expect((await f.knowledge.query(f.scope.applicationId,'requirement')).items).toHaveLength(0);
    });

    it('C4-f: propuesta_enunciado corta o genérica es rechazada con status error', async () => {
      const f=await fixture();expect(isSubstantiveRuleText('Confirmar propósito y comportamiento esperado')).toBe(false);await f.working();const q=(await f.interview('catalog',{action:'next'})).question;const p=await f.interview('catalog',{action:'propose',question_id:q.id,version:q.version,expected_revision:0,proposal:{...f.proposal,description:'Confirmar propósito y comportamiento esperado'}});expect(await f.interview('catalog',{action:'review',question_id:q.id,version:p.question.version})).toMatchObject({status:'blocked',code:'substantive_statement_required'});expect((await f.knowledge.query(f.scope.applicationId,'requirement')).items).toHaveLength(0);
    });
  });

  describe('C10: Detección y advertencia de extracción vacía', () => {
    it('C10-a: página app/login sin elementos interactivos genera advertencia extraccion_vacia y trabajo', async () => {
      const f=await fixture('<html><body><h1>Vista vacía</h1></body></html>');await f.working();const data=await f.call('qap_discover',{name:'catalog',path:'/catalog'});expect(data).toMatchObject({acquisition_status:'completed',persistence:'committed',counts:{controls:0,forms:0,views:expect.any(Number)}});expect(data.limitations).toEqual(expect.any(Array));expect(data.next_safe_action).toEqual(expect.any(String));expect((await f.knowledge.query(f.scope.applicationId,'requirement')).items).toHaveLength(0);expect((await f.close('catalog',{action:'evaluate'})).assessment.specification_coverage.status).toBe('incomplete');
    });

    it('C10-b: página con al menos un elemento interactivo no genera advertencia extraccion_vacia', async () => {
      const f=await fixture();await f.working();const data=await f.discover();expect(data).toMatchObject({persistence:'committed',counts:{controls:expect.any(Number),forms:expect.any(Number)}});expect(data.counts.controls).toBeGreaterThan(0);expect(data.limitations).toEqual(expect.any(Array));expect((await f.knowledge.query(f.scope.applicationId,'observation')).items.length).toBeGreaterThan(0);expect((await f.knowledge.query(f.scope.applicationId,'requirement')).items).toHaveLength(0);
    });

    it('C10-c: la advertencia extraccion_vacia es agnóstica de la aplicación', async () => {
      const f=await fixture('<html><body><section>Sin acciones</section></body></html>');await f.working(['catalog','orders']);for(const module of ['catalog','orders']){const data=await f.call('qap_discover',{name:module,path:'/'+module});expect(data).toMatchObject({acquisition_status:'completed',persistence:'committed',counts:{controls:0,forms:0}});expect(data.limitations).toEqual(expect.any(Array));expect(data).not.toHaveProperty('extraccion_vacia');}expect((await f.knowledge.query(f.scope.applicationId,'requirement')).items).toHaveLength(0);
    });
  });

  describe('C3: Transliteración NFD de slugs y prevención de módulos fuera del plan', () => {
    it('C1-c: módulo con tilde preserva nombre en lifecycle, crea directorio y normaliza pending_questions con transliteración NFD', async () => {
      expect(normalizeSlug('Asignación de ejecutivo de campo por carga')).toBe('asignacion_de_ejecutivo_de_campo_por_carga');expect(normalizeSlug('Operación básica')).toBe('operacion_basica');const f=await fixture();await f.working(['catalog']);const before=readFileSync(f.lifecyclePath,'utf8');expect(await f.call('qap_discover',{name:'Operación básica',path:'/catalog'})).toMatchObject({status:'blocked',code:'module_restricted',persistence:'not_attempted'});expect(readFileSync(f.lifecyclePath,'utf8')).toBe(before);expect(f.lifecycle().modules).not.toHaveProperty('operacion_basica');
    });

    it('C2-seguimiento: selección de "Corregir" emite pregunta de seguimiento y no persiste regla espuria en rules.yaml', async () => {
      const f=await fixture();await f.working();const q=(await f.interview('catalog',{action:'next'})).question;const p=await f.interview('catalog',{action:'propose',question_id:q.id,version:q.version,expected_revision:0,proposal:f.proposal});const fixed=await f.interview('catalog',{action:'correct',question_id:q.id,version:p.question.version,expected_revision:0,proposal:{...f.proposal,description:'La consulta requiere datos vigentes del catálogo verificados.'}});expect(fixed).toMatchObject({status:'corrected',question:{id:q.id,human_review_required:true}});expect(fixed.question.version).toBeGreaterThan(p.question.version);expect((await f.knowledge.query(f.scope.applicationId,'requirement')).items).toHaveLength(0);expect(await f.interview('catalog',{action:'review',question_id:q.id,version:fixed.question.version})).toMatchObject({status:'blocked',code:'human_review_not_authorized'});
    });
  });
});
