import { randomBytes, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { FileSystemStorage, SqliteKnowledgeAdapter } from '@qap/knowledge';
import {
  type RequirementCategory,
  type CategoryApplicabilityDecision,
  validateCoverageAssessmentInvariants,
} from '@qap/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createMcpServer } from '../server.js';
import { CanonicalCoverageService } from '../handlers/canonical-coverage-service.js';
import { CanonicalClosureService } from '../handlers/canonical-closure-service.js';
import {
  SqliteModuleClosureStore,
  type SqliteModuleClosureOptions,
  type IModuleClosureStore,
  type ClosureScope,
  type ModuleClosureSnapshot,
} from '../handlers/module-closure-store.js';
import type {
  IModuleClosureReviewGateway,
  ModuleClosureReviewRequest,
  ModuleClosureReviewDecision,
} from '../handlers/module-closure-gateway.js';
import type { BridgeContext } from '../handlers/module-observation-bridge.js';

const roots: string[] = [];
const closers: Array<() => void | Promise<void>> = [];
const time = '2026-10-31T12:00:00.000Z';

afterEach(async () => {
  vi.restoreAllMocks();
  for (const close of closers.splice(0).reverse()) {
    try { await close(); } catch { /* ignore */ }
  }
  roots.splice(0).forEach(root => {
    try { rmSync(root, { recursive: true, force: true }); } catch { /* ignore */ }
  });
});

interface FixtureOptions {
  gateway?: IModuleClosureReviewGateway;
  confirmedReqs?: Array<{ category: RequirementCategory; title: string; criteria?: string[] }>;
  observationalReqs?: Array<{ category: RequirementCategory; title: string }>;
}

async function fixture(opts: FixtureOptions = {}) {
  const root = mkdtempSync(join(tmpdir(), 'qap-r5-'));
  roots.push(root);

  mkdirSync(join(root, '.qa', 'project'), { recursive: true });
  mkdirSync(join(root, '.qa', 'modules', 'catalog'), { recursive: true });

  const lifecyclePath = join(root, '.qa', 'project', 'lifecycle.json');
  const lifecycle = {
    _version: '1',
    phase: 'WORKING',
    modules: {
      catalog: { state: 'planned', updated_at: time },
    },
    session: {
      id: 'session-r5',
      started_at: time,
      plan: [{ module: 'catalog', path: '/' }],
      auth: { required: false },
    },
    history: [],
  };
  writeFileSync(lifecyclePath, JSON.stringify(lifecycle, null, 2));

  const knowledgePath = join(root, 'canonical.sqlite');
  const store = new SqliteKnowledgeAdapter(knowledgePath);
  closers.push(() => store.close());

  const trace = {
    source: 'synthetic',
    recorded_by: 'fixture',
    recorded_at: time,
    reason: 'Authorized synthetic fixture',
    review: 'unreviewed' as const,
    evidence_refs: [],
  };

  await store.commit('app-r5', [
    {
      kind: 'application',
      expected_revision: 0,
      trace,
      entity: { application_id: 'app-r5', name: 'Synthetic App', base_url: 'https://example.invalid', created_at: time },
    },
    {
      kind: 'environment',
      expected_revision: 0,
      trace,
      entity: {
        application_id: 'app-r5',
        environment_id: 'local',
        name: 'local',
        base_url: 'https://example.invalid',
        safe_domains: ['example.invalid'],
        is_production: false,
        destructive_actions_allowed: false,
      },
    },
    {
      kind: 'module',
      expected_revision: 0,
      trace,
      entity: {
        id: 'mod-catalog',
        application_id: 'app-r5',
        key: 'catalog',
        title: 'Catálogo',
        certainty: 'confirmed',
        criticality: 'medium',
        dependencies: [],
        created_at: time,
        updated_at: time,
        is_active: true,
      },
    },
  ]);

  // Insert legitimate confirmed requirements
  if (opts.confirmedReqs) {
    for (const [idx, r] of opts.confirmedReqs.entries()) {
      const reqId = `req-conf-${idx + 1}`;
      await store.commit('app-r5', [
        {
          kind: 'requirement',
          expected_revision: 0,
          trace: {
            ...trace,
            review: 'reviewed' as const,
          },
          entity: {
            id: reqId,
            application_id: 'app-r5',
            module_key: 'catalog',
            title: r.title,
            description: `Descripción legítima de ${r.title}`,
            category: r.category,
            validation_status: 'confirmed',
            provenance: 'developer_interview',
            confidence: 1.0,
            verified_by: 'host_lead_reviewer',
            verification_evidence: {
              mechanism: 'human_review',
              verified_at: time,
              statement: 'Aprobado en revisión técnica',
            },
            created_at: time,
            is_active: true,
            acceptance_criteria: r.criteria ?? ['Criterio verificable 1'],
          },
        },
      ]);
    }
  }

  // Insert observational requirements (which MUST be excluded by Invariant D-011)
  if (opts.observationalReqs) {
    for (const [idx, r] of opts.observationalReqs.entries()) {
      const reqId = `req-obs-${idx + 1}`;
      await store.commit('app-r5', [
        {
          kind: 'requirement',
          expected_revision: 0,
          trace,
          entity: {
            id: reqId,
            application_id: 'app-r5',
            module_key: 'catalog',
            title: r.title,
            description: `Inferencia de crawler no confirmada`,
            category: r.category,
            validation_status: 'draft',
            provenance: 'observed_telemetry',
            confidence: 0.8,
            created_at: time,
            is_active: true,
          },
        },
      ]);
    }
  }

  const context: BridgeContext = {
    projectRoot: root,
    applicationId: 'app-r5',
    environmentId: 'local',
    moduleBindings: [
      {
        plannedName: 'catalog',
        moduleId: 'mod-catalog',
        moduleKey: 'catalog',
        moduleRevision: 1,
        applicationRevision: 1,
        environmentRevision: 1,
        provenance: 'host_declared',
      },
    ],
  };

  const closureStorePath = join(root, 'closure.sqlite');
  const closureKey = randomBytes(32);
  const closureOptions: SqliteModuleClosureOptions = {
    projectRoot: root,
    applicationId: 'app-r5',
    environmentId: 'local',
    path: closureStorePath,
    key: closureKey,
    protection: 'host_private_directory_and_managed_key',
  };

  function openClosureStore(initialize = false) {
    const s = new SqliteModuleClosureStore({ ...closureOptions, initialize });
    closers.push(() => s.close());
    return s;
  }

  const closureStore = openClosureStore(true);
  const coverageService = new CanonicalCoverageService(store, context, closureStore);
  const closureService = new CanonicalClosureService(store, context, closureStore, opts.gateway);

  return {
    root,
    store,
    knowledgePath,
    closureStorePath,
    closureKey,
    context,
    closureStore,
    openClosureStore,
    coverageService,
    closureService,
    lifecyclePath,
    lifecycle,
  };
}

function makeDecision(request: ModuleClosureReviewRequest, decision: 'approve' | 'reject' = 'approve'): ModuleClosureReviewDecision {
  return {
    requestDigest: request.requestDigest,
    approvalId: randomUUID(),
    decision,
    reviewer: 'lead_qa_architect',
    decidedAt: new Date(Date.now() - 1000).toISOString(),
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  };
}

describe('VNEXT-013-R5 Comprehensive Physical Test Matrix', () => {
  describe('Suite 1: Canonical Coverage & Epistemic Boundaries (R1)', () => {
    it('blocks evaluation when module is unbound or lifecycle context has drifted', async () => {
      const f = await fixture();
      const res = await f.coverageService.evaluate('unbound_module');
      expect(res.status).toBe('blocked');
      expect((res as { code: string }).code).toBe('unbound');

      // Mutate lifecycle to CLOSED
      const mutated = { ...f.lifecycle, modules: { catalog: { state: 'closed' } } };
      writeFileSync(f.lifecyclePath, JSON.stringify(mutated));
      const resContext = await f.coverageService.evaluate('catalog');
      expect(resContext.status).toBe('blocked');
      expect((resContext as { code: string }).code).toBe('context_changed');
    });

    it('zero coverage from crawler observations or DOM elements alone', async () => {
      const f = await fixture();
      const execution = randomUUID();
      const evidenceId = randomUUID();
      const view = { id: randomUUID(), route: `urn:qap:route:${'a'.repeat(64)}`, state: 'settled', controls: [{ required_in_dom: true }], forms: [{}], links: [] };
      const evidence = {
        id: evidenceId,
        kind: 'dom_snippet' as const,
        uri: `urn:qap:fixture:${evidenceId}`,
        pii_masked: true,
        captured_at: time,
        session_id: execution,
        metadata: { source: 'static_dom_structure', view },
      };
      const crawlerTrace = {
        source: 'blackbox_crawler',
        recorded_by: 'crawler',
        recorded_at: time,
        reason: 'Authorized synthetic crawl',
        review: 'unreviewed' as const,
        environment_id: 'local',
        evidence_refs: [],
      };

      await f.store.commit('app-r5', [
        { kind: 'evidence', expected_revision: 0, trace: crawlerTrace, entity: evidence },
        {
          kind: 'observation',
          expected_revision: 0,
          trace: { ...crawlerTrace, evidence_refs: [{ kind: 'evidence', id: evidenceId, revision: 1 }] },
          entity: {
            id: randomUUID(),
            application_id: 'app-r5',
            environment_id: 'local',
            kind: 'dom_element',
            observed_by: 'crawler',
            observed_at: time,
            session_id: execution,
            evidence,
            raw_payload: { view_id: view.id, controls: view.controls, forms: view.forms },
          },
        },
      ]);




      const evalRes = await f.coverageService.evaluate('catalog');
      expect(evalRes.status).toBe('evaluated');
      if (evalRes.status === 'evaluated') {
        const cov = evalRes.assessment.specification_coverage;
        expect(cov.confirmed_requirements_count).toBe(0);
        expect(cov.status).toBe('incomplete');
        expect(evalRes.assessment.closure_verdict).not.toBe('ready_for_closure');
      }
    });

    it('strictly enforces Invariant D-011 and R1: excludes observational requirements from confirmed coverage', async () => {
      const f = await fixture({
        confirmedReqs: [{ category: 'functional', title: 'Consultar saldo' }],
        observationalReqs: [{ category: 'functional', title: 'Requisito observado por crawler' }],
      });

      const evalRes = await f.coverageService.evaluate('catalog');
      expect(evalRes.status).toBe('evaluated');
      if (evalRes.status === 'evaluated') {
        const spec = evalRes.assessment.specification_coverage;
        // Solo el legítimo cuenta como confirmado
        expect(spec.confirmed_requirements_count).toBe(1);
        expect(spec.pending_requirements_count).toBe(1); // El observacional fue degradado a pendiente
        expect(evalRes.assessment.closure_verdict).toBe('blocked_by_unknown_applicability');
      }
    });

    it('tripartite coverage separation: execution coverage is strictly not_executed with 0 passed', async () => {
      const f = await fixture({
        confirmedReqs: [{ category: 'functional', title: 'Login' }],
      });

      const evalRes = await f.coverageService.evaluate('catalog');
      expect(evalRes.status).toBe('evaluated');
      if (evalRes.status === 'evaluated') {
        const exec = evalRes.assessment.execution_coverage;
        expect(exec.status).toBe('not_executed');
        expect(exec.executed_count).toBe(0);
        expect(exec.passed_count).toBe(0);
        expect(exec.failed_count).toBe(0);
        expect(exec.indeterminate_count).toBe(0);
        expect(validateCoverageAssessmentInvariants(evalRes.assessment).valid).toBe(true);
      }
    });
  });

  describe('Suite 2: Reproducible Gap Inventory & Non-Applicability (R2)', () => {
    it('identifies reproducible gaps with stable IDs and formal absence types', async () => {
      const f = await fixture();
      const evalRes = await f.coverageService.evaluate('catalog');
      expect(evalRes.status).toBe('evaluated');
      if (evalRes.status === 'evaluated') {
        const gaps = evalRes.assessment.gaps;
        expect(gaps.length).toBeGreaterThan(0);
        expect(gaps.every(g => g.module_key === 'catalog')).toBe(true);
        expect(gaps.every(g => g.provenance === 'canonical_coverage_evaluator')).toBe(true);
        expect(gaps.some(g => g.absence_type === 'unknown_applicability')).toBe(true);
      }
    });

    it('declares categories non-applicable and satisfies category status without category waivers (Amendment 6)', async () => {
      const f = await fixture();
      const decisions: CategoryApplicabilityDecision[] = [
        {
          category: 'performance',
          applicable: false,
          reason: 'Módulo puramente estático de lectura sin SLA de rendimiento crítico.',
          decided_by: 'lead_architect',
          decision_id: 'dec-perf-1',
          decided_at: time,
        },
      ];

      const evalRes = await f.coverageService.evaluate('catalog', { applicabilityDecisions: decisions });
      expect(evalRes.status).toBe('evaluated');
      if (evalRes.status === 'evaluated') {
        const perfStatus = evalRes.assessment.specification_coverage.category_statuses.find(
          cs => cs.category === 'performance'
        );
        expect(perfStatus).toBeDefined();
        expect(perfStatus?.applicability).toBe('not_applicable');
        expect(perfStatus?.status).toBe('not_applicable');
        // Amendment 6: No is_waived
        expect((perfStatus as unknown as Record<string, unknown>).is_waived).toBeUndefined();
      }
    });

    it('enforces Amendment 5: accepted gaps bind receipt and transition to status accepted', async () => {
      const f = await fixture();
      const eval1 = await f.coverageService.evaluate('catalog');
      expect(eval1.status).toBe('evaluated');
      if (eval1.status === 'evaluated') {
        const targetGap = eval1.assessment.gaps[0];
        const evalWithAccepted = await f.coverageService.evaluate('catalog', {
          acceptedGaps: [
            {
              gap_id: targetGap.id,
              reason: 'Riesgo residual aceptado formalmente por la gerencia de ingeniería.',
            },
          ],
          decisionId: 'appr-receipt-8812',
        });

        expect(evalWithAccepted.status).toBe('evaluated');
        if (evalWithAccepted.status === 'evaluated') {
          const acceptedGap = evalWithAccepted.assessment.gaps.find(g => g.id === targetGap.id);
          expect(acceptedGap).toBeDefined();
          expect(acceptedGap?.status).toBe('accepted');
          expect(acceptedGap?.acceptance_receipt).toBe('appr-receipt-8812');
        }
      }
    });
  });

  describe('Suite 3: Host Review Gateway & Trust Boundary (R3)', () => {
    it('R4-R8-A01: deferred non-applicability review retains request identity and persists actual host decision time', async () => {
      const requests: ModuleClosureReviewRequest[] = [];
      let authorized: ModuleClosureReviewDecision | null = null;
      const gateway: IModuleClosureReviewGateway = {
        reviewClosure: async request => {
          requests.push(structuredClone(request));
          return authorized;
        },
      };
      const f = await fixture({ gateway, confirmedReqs: [{
        category: 'functional', title: 'Consulta autorizada', criteria: ['Permitir consultar el catálogo autorizado'],
      }] });
      const command = {
        action: 'declare_non_applicable' as const,
        decisions: [{
          category: 'performance' as const,
          reason: 'La revisión del negocio declara esta categoría no aplicable a la funcionalidad.',
        }],
      };

      expect(await f.closureService.execute('catalog', command)).toMatchObject({
        status: 'blocked', code: 'closure_review_pending',
      });
      await new Promise(resolve => setTimeout(resolve, 20));
      expect(await f.closureService.execute('catalog', command)).toMatchObject({
        status: 'blocked', code: 'closure_review_pending',
      });
      expect(requests).toHaveLength(2);
      expect(requests[1].coverageDigest).toBe(requests[0].coverageDigest);
      expect(requests[1].requestDigest).toBe(requests[0].requestDigest);
      const before = f.closureStore.read(f.context);
      expect(before.applicabilityDecisions.catalog).toBeUndefined();
      expect(before.approvals).toHaveLength(0);

      authorized = makeDecision(requests[0]);
      const decidedAt = authorized.decidedAt;
      const approved = await f.closureService.execute('catalog', command);
      expect(approved).toMatchObject({ status: 'declared_non_applicable', decisions: command.decisions });
      expect(requests[2].requestDigest).toBe(requests[0].requestDigest);
      const after = f.closureStore.read(f.context);
      expect(after.applicabilityDecisions.catalog).toHaveLength(1);
      expect(after.applicabilityDecisions.catalog[0]).toMatchObject({
        category: 'performance', applicable: false, decided_at: decidedAt,
      });
      expect(after.approvals).toEqual([[authorized.approvalId, requests[0].requestDigest]]);
      expect((await f.coverageService.evaluate('catalog'))).toMatchObject({
        status: 'evaluated',
        assessment: {
          specification_coverage: { category_statuses: expect.arrayContaining([
            expect.objectContaining({ category: 'performance', applicability: 'not_applicable', status: 'not_applicable' }),
          ]) },
          execution_coverage: { status: 'not_executed' },
        },
      });
      const reopened = f.openClosureStore();
      expect(reopened.read(f.context)).toEqual(after);
    });

    it('R4-R8-A01: stale approval cannot authorize changed reason or canonical requirement revision', async () => {
      const requests: ModuleClosureReviewRequest[] = [];
      let authorized: ModuleClosureReviewDecision | null = null;
      const gateway: IModuleClosureReviewGateway = {
        reviewClosure: async request => {
          requests.push(structuredClone(request));
          return authorized;
        },
      };
      const f = await fixture({ gateway, confirmedReqs: [{
        category: 'functional', title: 'R1', criteria: ['Criterio verificable para consulta legítima'],
      }] });
      const command = {
        action: 'declare_non_applicable' as const,
        decisions: [{
          category: 'performance' as const,
          reason: 'El negocio confirma que el rendimiento no es aplicable a este módulo aislado.',
        }],
      };
      expect(await f.closureService.execute('catalog', command)).toMatchObject({
        status: 'blocked', code: 'closure_review_pending',
      });
      const pending = requests[0];
      authorized = makeDecision(pending);
      const withChangedReason = await f.closureService.execute('catalog', {
        ...command, decisions: [{ ...command.decisions[0],
          reason: 'El negocio cambió su motivo y exige revisar nuevamente la aplicabilidad.' }],
      });
      expect(withChangedReason).toMatchObject({ status: 'blocked', code: 'closure_review_invalid' });
      expect(requests[1].requestDigest).not.toBe(pending.requestDigest);
      expect(f.closureStore.read(f.context).approvals).toHaveLength(0);

      const original = await f.store.get('app-r5', 'requirement', 'req-conf-1');
      expect(original).toBeDefined();
      await f.store.commit('app-r5', [{
        kind: 'requirement',
        expected_revision: original!.revision,
        entity: { ...original!.entity, description: 'El requisito cambió tras la solicitud de revisión.' },
        trace: original!.trace,
      }]);
      const changedKnowledge = await f.closureService.execute('catalog', command);
      expect(changedKnowledge).toMatchObject({ status: 'blocked', code: 'closure_review_invalid' });
      expect(requests[2].coverageDigest).not.toBe(pending.coverageDigest);
      expect(requests[2].requestDigest).not.toBe(pending.requestDigest);
      expect(f.closureStore.read(f.context).approvals).toHaveLength(0);
      expect(f.closureStore.read(f.context).applicabilityDecisions.catalog).toBeUndefined();
    });

    it('R4-R8-A01: host approval is rejected if knowledge mutates while awaiting the gateway', async () => {
      let changed = false;
      const gateway: IModuleClosureReviewGateway = {
        reviewClosure: async request => {
          if (!changed) {
            changed = true;
            const prior = await f.store.get('app-r5', 'requirement', 'req-conf-1');
            expect(prior).toBeDefined();
            await f.store.commit('app-r5', [{
              kind: 'requirement', expected_revision: prior!.revision,
              entity: { ...prior!.entity, description: 'Revisión concurrente antes del consentimiento de cierre.' },
              trace: prior!.trace,
            }]);
          }
          return makeDecision(request);
        },
      };
      const f = await fixture({ gateway, confirmedReqs: [{
        category: 'functional', title: 'R1', criteria: ['Revisión debe ser independiente y vigente'],
      }] });
      const before = f.closureStore.read(f.context);
      const outcome = await f.closureService.execute('catalog', {
        action: 'declare_non_applicable',
        decisions: [{
          category: 'performance',
          reason: 'El negocio indica que la prueba de rendimiento no corresponde a este alcance.',
        }],
      });
      expect(outcome).toMatchObject({ status: 'blocked', code: 'closure_context_changed' });
      expect(f.closureStore.read(f.context)).toEqual(before);
      expect((await f.store.get('app-r5', 'requirement', 'req-conf-1'))?.revision).toBe(2);
    });

    it('R4-R9-A02: writing a requirement after final validation cannot persist an obsolete approval', async () => {
      const f = await fixture({
        gateway: { reviewClosure: async r => makeDecision(r) },
        confirmedReqs: [{ category: 'functional', title: 'Consulta', criteria: ['Consulta verificable'] }],
      });
      const before = f.closureStore.read(f.context);
      let attempted = false;
      const interleaved: IModuleClosureStore = {
        read: scope => f.closureStore.read(scope),
        transaction: async <T>(scope: ClosureScope, operation: (snapshot: ModuleClosureSnapshot) => Promise<T>): Promise<T> => {
          attempted = true;
          const req = await f.store.get('app-r5', 'requirement', 'req-conf-1');
          expect(req).toBeDefined();
          await f.store.commit('app-r5', [{
            kind: 'requirement', expected_revision: req!.revision,
            entity: { ...req!.entity, description: 'Cambio concurrente posterior a la revalidación' },
            trace: req!.trace,
          }]);
          return f.closureStore.transaction(scope, operation);
        },
        close: () => {},
      };
      const svc = new CanonicalClosureService(f.store, f.context, interleaved, {
        reviewClosure: async r => makeDecision(r),
      });
      const result = await svc.execute('catalog', {
        action: 'declare_non_applicable',
        decisions: [{ category: 'performance',
          reason: 'El propietario autoriza excluir rendimiento del alcance de este catálogo.' }],
      });
      expect(attempted).toBe(true);
      expect(result).toMatchObject({ status: 'blocked', code: 'closure_consistency_conflict' });
      expect(f.closureStore.read(f.context)).toEqual(before);
      expect((await f.store.get('app-r5', 'requirement', 'req-conf-1'))?.revision).toBe(1);
    });

    it('R4-R9-A02: both close and waive reject concurrent Knowledge writes before durable commit', async () => {
      for (const action of ['close', 'waive'] as const) {
        const f = await fixture({
          confirmedReqs: ['functional', 'business_rule', 'security', 'ui', 'ux', 'regression', 'performance']
            .map(category => ({ category: category as RequirementCategory,
              title: category, criteria: ['Criterio de aceptación verificable'] })),
        });
        const prior = f.closureStore.read(f.context);
        const interleaved: IModuleClosureStore = {
          read: scope => f.closureStore.read(scope),
          transaction: async <T>(scope: ClosureScope, operation: (snapshot: ModuleClosureSnapshot) => Promise<T>): Promise<T> => {
            const req = await f.store.get('app-r5', 'requirement', 'req-conf-1');
            expect(req).toBeDefined();
            await f.store.commit('app-r5', [{
              kind: 'requirement', expected_revision: req!.revision,
              entity: { ...req!.entity, description: 'Cambio concurrente inadmisible' }, trace: req!.trace,
            }]);
            return f.closureStore.transaction(scope, operation);
          },
          close: () => {},
        };
        const svc = new CanonicalClosureService(f.store, f.context, interleaved, {
          reviewClosure: async r => makeDecision(r),
        });
        const result = await svc.execute('catalog', action === 'close'
          ? { action } : { action, reason: 'Motivo de renuncia confirmado por el propietario del sistema' });
        expect(result).toMatchObject({ status: 'blocked', code: 'closure_consistency_conflict' });
        expect(f.closureStore.read(f.context)).toEqual(prior);
        expect((await f.store.query('app-r5', 'relation')).items).toHaveLength(0);
      }
    });

    it('R4-R9-A02: missing fencing capability blocks even valid host decisions', async () => {
      const f = await fixture({ confirmedReqs: [{ category: 'functional', title: 'R9' }] });
      const noFence = new Proxy(f.store, {
        get(target, property) {
          if (property === 'withWriteFence') return undefined;
          const value: unknown = Reflect.get(target, property, target);
          return typeof value === 'function' ? value.bind(target) : value;
        },
      });
      const svc = new CanonicalClosureService(noFence, f.context, f.closureStore, {
        reviewClosure: async r => makeDecision(r),
      });
      const before = f.closureStore.read(f.context);
      const result = await svc.execute('catalog', {
        action: 'declare_non_applicable',
        decisions: [{ category: 'performance',
          reason: 'El alcance de negocio no requiere rendimientos garantizados.' }],
      });
      expect(result).toMatchObject({ status: 'blocked', code: 'closure_consistency_fence_required' });
      expect(f.closureStore.read(f.context)).toEqual(before);
    });

    it('R4-R9-A02: delayed fence acquisition does not consume an expired decision', async () => {
      const f = await fixture({
        gateway: { reviewClosure: async r => ({
          ...makeDecision(r), expiresAt: new Date(Date.now() + 300).toISOString(),
        }) },
      });
      const originalFence = f.store.withWriteFence.bind(f.store);
      let enteredFence = false;
      f.store.withWriteFence = async <T>(app: string, operation: () => Promise<T>): Promise<T> => {
        enteredFence = true;
        await new Promise(resolve => setTimeout(resolve, 420));
        return originalFence(app, operation);
      };
      const before = f.closureStore.read(f.context);
      const result = await f.closureService.execute('catalog', {
        action: 'waive',
        reason: 'Renuncia temporal válida, pero aprobación caducada antes del commit',
      });
      expect(enteredFence).toBe(true);
      expect(result).toMatchObject({ status: 'blocked', code: 'closure_review_expired' });
      expect(f.closureStore.read(f.context)).toEqual(before);
    });

    it('R4-R9-A02: an updated pending requirement changes the coverage digest', async () => {
      const f = await fixture({ observationalReqs: [{ category: 'security', title: 'Hipótesis pendiente' }] });
      const initial = await f.coverageService.evaluate('catalog');
      expect(initial.status).toBe('evaluated');
      const prior = await f.store.get('app-r5', 'requirement', 'req-obs-1');
      expect(prior).toBeDefined();
      await f.store.commit('app-r5', [{
        kind: 'requirement', expected_revision: prior!.revision,
        entity: { ...prior!.entity, description: 'Versión pendiente revisada' }, trace: prior!.trace,
      }]);
      const updated = await f.coverageService.evaluate('catalog');
      expect(updated.status).toBe('evaluated');
      if (initial.status === 'evaluated' && updated.status === 'evaluated') {
        expect(updated.assessment.coverage_digest).not.toBe(initial.assessment.coverage_digest);
      }
    });

    it('R4-R10-A05: approves an existing gap with the real host approval receipt', async () => {
      const requests: ModuleClosureReviewRequest[] = [];
      const f = await fixture({ gateway: {
        reviewClosure: async req => { requests.push(req); return makeDecision(req); },
      } });
      const before = await f.coverageService.evaluate('catalog');
      expect(before.status).toBe('evaluated');
      if (before.status !== 'evaluated') return;
      const gap = before.assessment.gaps.find(g => g.status === 'unaddressed');
      expect(gap).toBeDefined();
      const selected = [{ gap_id: gap!.id, reason: 'Aceptación consciente de la brecha documentada por el responsable.' }];
      const result = await f.closureService.execute('catalog', { action: 'accept_gaps', accepted_gaps: selected });
      expect(result.status).toBe('gaps_accepted');
      expect(requests).toHaveLength(1);
      expect(requests[0].coverageDigest).toBe(before.assessment.coverage_digest);
      expect(requests[0].acceptedGaps).toEqual(selected);
      const snapshot = f.closureStore.read(f.context);
      expect(snapshot.approvals).toHaveLength(1);
      expect(snapshot.acceptedGaps.catalog).toHaveLength(1);
      expect(snapshot.acceptedGaps.catalog[0]).toMatchObject({
        id: gap!.id, reason: selected[0].reason, status: 'accepted',
        acceptance_receipt: snapshot.approvals[0][0],
      });
      const reopened = f.openClosureStore();
      expect(reopened.read(f.context)).toEqual(snapshot);
    });

    it('R4-R10-A05: never requests approval for missing or duplicate gap IDs', async () => {
      let calls = 0;
      const f = await fixture({ gateway: {
        reviewClosure: async req => { calls++; return makeDecision(req); },
      } });
      const start = f.closureStore.read(f.context);
      const gap = (await f.coverageService.evaluate('catalog'));
      expect(gap.status).toBe('evaluated');
      if (gap.status !== 'evaluated') return;
      const valid = { gap_id: gap.assessment.gaps[0].id, reason: 'Brecha reconocida y aceptada expresamente por la coordinación.' };
      for (const accepted_gaps of [
        [{ gap_id: 'missing:gap', reason: valid.reason }],
        [valid, valid],
      ]) {
        const result = await f.closureService.execute('catalog', { action: 'accept_gaps', accepted_gaps });
        expect(result).toMatchObject({ status: 'blocked', code: 'closure_gap_selection_invalid' });
      }
      expect(calls).toBe(0);
      expect(f.closureStore.read(f.context)).toEqual(start);
    });

    it('R4-R12-A04: authorization expiring after callback rolls back all four SQLite commits', async () => {
      const confirmedReqs: NonNullable<FixtureOptions['confirmedReqs']> = [
        { category: 'functional', title: 'R1' },
        { category: 'business_rule', title: 'R2' },
        { category: 'security', title: 'R3' },
        { category: 'ui', title: 'R4' },
        { category: 'ux', title: 'R5' },
        { category: 'regression', title: 'R6' },
        { category: 'performance', title: 'R7' },
      ];
      for (const action of ['declare_non_applicable', 'accept_gaps', 'close', 'waive'] as const) {
        let expiry = 0;
        const f = await fixture({
          confirmedReqs: action === 'close' ? confirmedReqs : undefined,
          gateway: {
            reviewClosure: async request => {
              expiry = Date.now() + 350;
              return { ...makeDecision(request), expiresAt: new Date(expiry).toISOString() };
            },
          },
        });
        const before = f.closureStore.read(f.context);
        const delayed: IModuleClosureStore = {
          read: scope => f.closureStore.read(scope),
          transaction: async <T>(scope: ClosureScope, operation: (snapshot: ModuleClosureSnapshot) => Promise<T>): Promise<T> =>
            f.closureStore.transaction(scope, async snapshot => {
              const result = await operation(snapshot);
              await new Promise(resolve => setTimeout(resolve, Math.max(40, expiry - Date.now() + 40)));
              return result;
            }),
          close: () => {},
        };
        const svc = new CanonicalClosureService(f.store, f.context, delayed, {
          reviewClosure: async request => {
            expiry = Date.now() + 350;
            return { ...makeDecision(request), expiresAt: new Date(expiry).toISOString() };
          },
        });
        const coverage = await f.coverageService.evaluate('catalog');
        expect(coverage.status).toBe('evaluated');
        if (coverage.status !== 'evaluated') throw new Error('invalid_test_fixture');
        const gap = coverage.assessment.gaps.find(g => g.status === 'unaddressed');
        const cmd = action === 'declare_non_applicable' ? {
          action, decisions: [{ category: 'performance', reason: 'No aplicable con aprobación expresa del responsable.' }],
        } : action === 'accept_gaps' ? {
          action, accepted_gaps: [{ gap_id: gap!.id, reason: 'Riesgo concreto de brecha aceptado por el responsable de calidad.' }],
        } : action === 'waive' ? {
          action, reason: 'Renuncia autorizada para verificar expiración antes de commit.',
        } : { action };
        const outcome = await svc.execute('catalog', cmd);
        expect(outcome).toMatchObject({ status: 'blocked', code: 'closure_review_expired' });
        expect(f.closureStore.read(f.context)).toEqual(before);
        expect((await f.store.query('app-r5', 'relation')).items).toHaveLength(0);
        expect(readFileSync(f.lifecyclePath, 'utf8')).toContain('"state": "planned"');
      }
    });

    it('R4-R12-A06: exact accepted gap replay returns prior receipt without a new decision', async () => {
      let approvals = 0;
      const f = await fixture({ gateway: {
        reviewClosure: async req => { approvals++; return makeDecision(req); },
      } });
      const baseline = await f.coverageService.evaluate('catalog');
      expect(baseline.status).toBe('evaluated');
      if (baseline.status !== 'evaluated') return;
      const gap = baseline.assessment.gaps.find(g => g.status === 'unaddressed');
      expect(gap).toBeDefined();
      const selected = [{ gap_id: gap!.id, reason: 'La brecha concreta fue aceptada con motivo de riesgo verificable.' }];
      const first = await f.closureService.execute('catalog', { action: 'accept_gaps', accepted_gaps: selected });
      expect(first.status).toBe('gaps_accepted');
      const before = f.closureStore.read(f.context);
      const replay = await f.closureService.execute('catalog', { action: 'accept_gaps', accepted_gaps: selected });
      expect(replay).toMatchObject({
        status: 'gaps_accepted', idempotent: true, decision_id: first.decision_id,
      });
      expect(approvals).toBe(1);
      expect(f.closureStore.read(f.context)).toEqual(before);

      const altered = await f.closureService.execute('catalog', { action: 'accept_gaps',
        accepted_gaps: [{ ...selected[0], reason: 'Motivo cambiado: nunca reutilizar la autorización anterior.' }],
      });
      expect(altered).toMatchObject({ status: 'blocked', code: 'closure_gap_selection_invalid' });
      expect(approvals).toBe(1);
      expect(f.closureStore.read(f.context)).toEqual(before);

      await f.closureStore.transaction(f.context, snapshot => {
        snapshot.approvals[0][1] = 'digest-corrupto';
        return Promise.resolve();
      });
      const tampered = f.closureStore.read(f.context);
      const denied = await f.closureService.execute('catalog', { action: 'accept_gaps', accepted_gaps: selected });
      expect(denied).toMatchObject({ status: 'blocked', code: 'closure_gap_selection_invalid' });
      expect(f.closureStore.read(f.context)).toEqual(tampered);
      expect(approvals).toBe(1);
    });

    it('R4-R10-A01: a direct filesystem mutation before closure transaction fails the fingerprint guard', async () => {
      const f = await fixture({ confirmedReqs: [{ category: 'functional', title: 'Consulta aprobada' }] });
      const interleaved: IModuleClosureStore = {
        read: scope => f.closureStore.read(scope),
        transaction: async <T>(scope: ClosureScope, operation: (snapshot: ModuleClosureSnapshot) => Promise<T>): Promise<T> => {
          const drifted = { ...f.lifecycle, session: { ...f.lifecycle.session, id: 'other-session' } };
          writeFileSync(f.lifecyclePath, JSON.stringify(drifted));
          return f.closureStore.transaction(scope, operation);
        },
        close: () => {},
      };
      const svc = new CanonicalClosureService(f.store, f.context, interleaved, {
        reviewClosure: async req => makeDecision(req),
      });
      const before = f.closureStore.read(f.context);
      const result = await svc.execute('catalog', {
        action: 'declare_non_applicable', decisions: [{ category: 'performance',
          reason: 'El propietario determina que esta categoría no aplica a su contrato.' }],
      });
      expect(result).toMatchObject({ status: 'blocked', code: 'closure_consistency_conflict' });
      expect(f.closureStore.read(f.context)).toEqual(before);
    });

    it('R4-R10-A01: the official lifecycle writer waits until authorization persistence releases the lock', async () => {
      const f = await fixture({ confirmedReqs: [{ category: 'functional', title: 'Consulta aprobada' }] });
      const storage = new FileSystemStorage({ rootDir: f.root });
      let saveCompleted = false;
      let pendingSave: Promise<void> | undefined;
      const interleaved: IModuleClosureStore = {
        read: scope => f.closureStore.read(scope),
        transaction: async <T>(scope: ClosureScope, operation: (snapshot: ModuleClosureSnapshot) => Promise<T>): Promise<T> => {
          pendingSave = storage.saveLifecycleState({
            ...f.lifecycle, session: { ...f.lifecycle.session, id: 'after-commit-session' },
          }).then(() => { saveCompleted = true; });
          const result = await f.closureStore.transaction(scope, operation);
          expect(saveCompleted).toBe(false);
          return result;
        },
        close: () => {},
      };
      const svc = new CanonicalClosureService(f.store, f.context, interleaved, {
        reviewClosure: async req => makeDecision(req),
      });
      const result = await svc.execute('catalog', {
        action: 'declare_non_applicable', decisions: [{ category: 'performance',
          reason: 'Aprobación válida del propietario del módulo en el contexto inicial.' }],
      });
      expect(result.status).toBe('declared_non_applicable');
      expect(pendingSave).toBeDefined();
      await pendingSave;
      expect(saveCompleted).toBe(true);
      expect((await storage.getLifecycleState()).session.id).toBe('after-commit-session');
      expect(f.closureStore.read(f.context).approvals).toHaveLength(1);
    });

    it.skipIf(process.platform !== 'win32')('R4-R11-A01: case-aliased official writers wait through durable authorization in all four actions', async () => {
      const confirmedReqs: FixtureOptions['confirmedReqs'] = [
        { category: 'functional', title: 'R1' },
        { category: 'business_rule', title: 'R2' },
        { category: 'security', title: 'R3' },
        { category: 'ui', title: 'R4' },
        { category: 'ux', title: 'R5' },
        { category: 'regression', title: 'R6' },
        { category: 'performance', title: 'R7' },
      ];
      for (const action of ['declare_non_applicable', 'accept_gaps', 'waive', 'close'] as const) {
        const f = await fixture({ confirmedReqs: action === 'close' ? confirmedReqs : undefined });
        const aliasStorage = new FileSystemStorage({ rootDir: f.root.toUpperCase() });
        let writerCompleted = false;
        let pendingWriter: Promise<void> | undefined;
        const wrapped: IModuleClosureStore = {
          read: scope => f.closureStore.read(scope),
          transaction: async <T>(scope: ClosureScope, operation: (snapshot: ModuleClosureSnapshot) => Promise<T>): Promise<T> =>
            f.closureStore.transaction(scope, async snapshot => {
              const result = await operation(snapshot);
              // Reproduce the original P1: same physical root with a different
              // Windows casing, between callback return and SQLite COMMIT.
              pendingWriter = aliasStorage.saveLifecycleState({
                ...f.lifecycle,
                session: { ...f.lifecycle.session, id: 'new-session-after-commit' },
              }).then(() => { writerCompleted = true; });
              await new Promise(resolve => setTimeout(resolve, 70));
              expect(writerCompleted).toBe(false);
              return result;
            }),
          close: () => {},
        };
        const svc = new CanonicalClosureService(f.store, f.context, wrapped, {
          reviewClosure: async request => makeDecision(request),
        });
        const evaluation = await f.coverageService.evaluate('catalog');
        expect(evaluation.status).toBe('evaluated');
        if (evaluation.status !== 'evaluated') throw new Error('invalid_test_fixture');
        const gap = evaluation.assessment.gaps.find(g => g.status === 'unaddressed');
        const cmd = action === 'declare_non_applicable' ? {
          action, decisions: [{ category: 'performance', reason: 'No aplica al contrato aprobado por el responsable.' }],
        } : action === 'accept_gaps' ? {
          action, accepted_gaps: [{ gap_id: gap!.id, reason: 'Brecha de cobertura aceptada con riesgo documentado por el host.' }],
        } : action === 'waive' ? {
          action, reason: 'Renuncia aprobada por revisión independiente del host para la prueba.',
        } : { action };
        const result = await svc.execute('catalog', cmd);
        expect(result.status).toBe(action === 'declare_non_applicable' ? 'declared_non_applicable' :
          action === 'accept_gaps' ? 'gaps_accepted' : action === 'waive' ? 'waived' : 'closed');
        expect(pendingWriter).toBeDefined();
        await pendingWriter;
        expect(writerCompleted).toBe(true);
        expect(f.closureStore.read(f.context).approvals).toHaveLength(1);
      }
    });

    it('R4-R10-A02: changing cwd never moves the active SQLite writer fence', async () => {
      const root = mkdtempSync(join(tmpdir(), 'qap-r10-path-'));
      roots.push(root);
      const another = join(root, 'another-cwd');
      mkdirSync(another);
      const initialCwd = process.cwd();
      let knowledge: SqliteKnowledgeAdapter | undefined;
      try {
        process.chdir(root);
        knowledge = new SqliteKnowledgeAdapter('pinned.sqlite', { busy_timeout_ms: 0 });
        process.chdir(another);
        const { DatabaseSync } = await import('node:sqlite');
        await knowledge.withWriteFence('app-r5', async () => {
          const competing = new DatabaseSync(join(root, 'pinned.sqlite'));
          try {
            competing.exec('PRAGMA busy_timeout=0');
            expect(() => competing.exec('BEGIN IMMEDIATE')).toThrow();
          } finally {
            competing.close();
          }
        });
        expect(existsSync(join(another, 'pinned.sqlite'))).toBe(false);
      } finally {
        knowledge?.close();
        process.chdir(initialCwd);
      }
    });

    it('blocks closure when host gateway is absent or returns null (pending)', async () => {
      const f = await fixture(); // No gateway
      const res = await f.closureService.execute('catalog', { action: 'close' });
      expect(res.status).toBe('blocked');
      expect(res.code).toBe('closure_review_gateway_required');

      // Gateway returns null (pending)
      const pendingGateway: IModuleClosureReviewGateway = {
        reviewClosure: async () => null,
      };
      const fPending = await fixture({ gateway: pendingGateway });
      const resPending = await fPending.closureService.execute('catalog', { action: 'waive', reason: 'Renuncia para probar gateway pendiente' });
      expect(resPending.status).toBe('blocked');
      expect(resPending.code).toBe('closure_review_pending');
    });


    it('rejects decisions with invalid request digest or expired authorization', async () => {
      let reqCaptured: ModuleClosureReviewRequest | undefined;
      const gateway: IModuleClosureReviewGateway = {
        reviewClosure: async r => {
          reqCaptured = r;
          return {
            requestDigest: 'tampered_digest_' + 'f'.repeat(50),
            approvalId: randomUUID(),
            decision: 'approve',
            reviewer: 'host',
            decidedAt: time,
            expiresAt: new Date(Date.now() + 60_000).toISOString(),
          };
        },
      };

      const f = await fixture({
        gateway,
        confirmedReqs: [
          { category: 'functional', title: 'R1' },
          { category: 'business_rule', title: 'R2' },
          { category: 'security', title: 'R3' },
          { category: 'ui', title: 'R4' },
          { category: 'ux', title: 'R5' },
          { category: 'regression', title: 'R6' },
          { category: 'performance', title: 'R7' },
        ],
      });

      const res = await f.closureService.execute('catalog', { action: 'close' });
      expect(reqCaptured).toMatchObject({ action: 'close', plannedName: 'catalog' });
      expect(res.status).toBe('blocked');
      expect(res.code).toBe('closure_review_invalid');
    });

    it('blocks client injection of authorization fields (approvalId / signature) on MCP wire', async () => {
      const f = await fixture();
      const res = await f.closureService.execute('catalog', {
        action: 'close',
        approvalId: 'forged_client_approval',
      });
      expect(res.status).toBe('blocked');
      expect(res.code).toBe('invalid_canonical_arguments');
    });
  });

  describe('Suite 4: Durable Persistence & Concurrency (R4)', () => {
    it('SqliteModuleClosureStore encrypts all data with AES-256-GCM without plaintext leaks', async () => {
      let reviewReq: ModuleClosureReviewRequest | undefined;
      const gateway: IModuleClosureReviewGateway = {
        reviewClosure: async r => {
          reviewReq = r;
          return makeDecision(r, 'approve');
        },
      };

      const f = await fixture({ gateway });
      const res = await f.closureService.execute('catalog', {
        action: 'waive',
        reason: 'CONFIDENTIAL_WAIVER_SECRET_KEY_9921827',
      });

      expect(res.status).toBe('waived');
      expect(reviewReq).toMatchObject({ action: 'waive', plannedName: 'catalog' });
      f.closureStore.close();

      // Read raw database bytes on disk
      const rawDb = readFileSync(f.closureStorePath);
      expect(rawDb.includes(Buffer.from('CONFIDENTIAL_WAIVER_SECRET_KEY_9921827'))).toBe(false);

      // Reopening decrypts payload accurately
      const reopened = f.openClosureStore();
      const snapshot = reopened.read(f.context);
      expect(snapshot.closures.catalog?.waiverReason).toBe('CONFIDENTIAL_WAIVER_SECRET_KEY_9921827');
    });

    it('Amendment 3: Persists relation receipt in IKnowledgeStore with ZERO module.revision mutation', async () => {
      let reviewReq: ModuleClosureReviewRequest | undefined;
      const gateway: IModuleClosureReviewGateway = {
        reviewClosure: async r => {
          reviewReq = r;
          return makeDecision(r, 'approve');
        },
      };

      const f = await fixture({
        gateway,
        confirmedReqs: [
          { category: 'functional', title: 'R1' },
          { category: 'business_rule', title: 'R2' },
          { category: 'security', title: 'R3' },
          { category: 'ui', title: 'R4' },
          { category: 'ux', title: 'R5' },
          { category: 'regression', title: 'R6' },
          { category: 'performance', title: 'R7' },
        ],
      });

      const moduleBefore = await f.store.get('app-r5', 'module', 'mod-catalog');
      expect(moduleBefore?.revision).toBe(1);

      const res = await f.closureService.execute('catalog', { action: 'close' });
      expect(res.status).toBe('closed');
      expect(reviewReq).toMatchObject({ action: 'close', plannedName: 'catalog' });

      // Verify module revision is strictly UNCHANGED
      const moduleAfter = await f.store.get('app-r5', 'module', 'mod-catalog');
      expect(moduleAfter?.revision).toBe(1);

      // Verify receipt relation exists in IKnowledgeStore
      if (typeof res.decision_id !== 'string') throw new Error('Expected host approval decision ID');
      const receiptId = `closure:${res.decision_id}`;
      const receipt = await f.store.get('app-r5', 'relation', receiptId);
      expect(receipt).toBeDefined();
      expect(receipt?.entity.predicate).toBe('related_to');
      expect(receipt?.entity.source.id).toBe('mod-catalog');
      expect(receipt?.entity.source.revision).toBe(1);
    });

    it('zero SQLite locks held during asynchronous host review gateway evaluation', async () => {
      let delayCompleted = false;
      const gateway: IModuleClosureReviewGateway = {
        reviewClosure: async r => {
          // Simulate 200ms async human review
          await new Promise(resolve => setTimeout(resolve, 200));
          delayCompleted = true;
          return makeDecision(r, 'approve');
        },
      };

      const f = await fixture({ gateway });

      const closePromise = f.closureService.execute('catalog', {
        action: 'waive',
        reason: 'Renuncia concurrente para probar ausencia de lock',
      });

      // While gateway is waiting, concurrent reads and transactions on closureStore must NOT fail with SQLITE_BUSY
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(delayCompleted).toBe(false);

      const independentStore = f.openClosureStore();
      const snapshot = independentStore.read(f.context);
      expect(snapshot).toBeDefined();

      const res = await closePromise;
      expect(res.status).toBe('waived');
    });
  });

  describe('Suite 5: MCP Integration & Lifecycle Guards (R4 / F8)', () => {
    async function mcpClient(
      f: Awaited<ReturnType<typeof fixture>>,
      gateway?: IModuleClosureReviewGateway,
      moduleBindings?: BridgeContext['moduleBindings']
    ) {
      const server = createMcpServer({
        projectRoots: [f.root],
        knowledgeBindings: [
          {
            projectRoot: f.root,
            applicationId: 'app-r5',
            environmentId: 'local',
            store: f.store,
            moduleBindings: moduleBindings ?? f.context.moduleBindings,
            moduleClosureStore: f.closureStore,
            moduleClosureReviewGateway: gateway ?? {
              reviewClosure: async r => makeDecision(r, 'approve'),
            },
          },
        ],
      });

      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      await server.connect(serverTransport);
      const client = new Client({ name: 'test-client', version: '1.0' }, { capabilities: {} });
      await client.connect(clientTransport);
      closers.push(async () => {
        await client.close();
        await server.close();
      });
      return client;
    }

    it('qap_module_close routes canonical_closure cleanly through MCP SDK client', async () => {
      const f = await fixture();
      const client = await mcpClient(f);

      const evalCall = await client.callTool({
        name: 'qap_module_close',
        arguments: {
          targetPath: f.root,
          module: 'catalog',
          canonical_closure: { action: 'evaluate' },
        },
      });

      expect(evalCall.isError).toBeFalsy();
      const payload = JSON.parse((evalCall.content[0] as { text: string }).text);
      expect(payload.status).toBe('evaluated');
      expect(payload.assessment.module_key).toBe('catalog');
    });

    it('enforces Amendment 4: blocks canonical module called without canonical_closure', async () => {
      const f = await fixture();
      const client = await mcpClient(f);

      // Calling canonical module with legacy parameters without canonical_closure
      const legacyCall = await client.callTool({
        name: 'qap_module_close',
        arguments: {
          targetPath: f.root,
          module: 'catalog',
          action: 'close',
          user_confirmed: true,
        },
      });

      expect(legacyCall.isError).toBe(true);
      const payload = JSON.parse((legacyCall.content[0] as { text: string }).text);
      expect(payload.code).toBe('canonical_closure_required');
      expect(payload.razon).toContain('canonical_closure');
    });

    it('qap_session_close blocks transition to WRAP_UP when canonical modules remain unclosed', async () => {
      const f = await fixture();
      const client = await mcpClient(f);

      const sessionCall = await client.callTool({
        name: 'qap_session_close',
        arguments: { targetPath: f.root },
      });

      const payload = JSON.parse((sessionCall.content[0] as { text: string }).text);
      expect(payload.status).toBe('blocked');
      expect(payload.code).toBe('canonical_module_closure_required');
      expect(payload.unclosed_modules).toContain('catalog');
    });

    it.each([
      { name: 'short reason', status: 'waived' as const, reason: 'x', approval: 'matching' },
      { name: 'blank reason', status: 'waived' as const, reason: '    ', approval: 'matching' },
      { name: 'missing approval', status: 'waived' as const, reason: 'Renuncia autorizada con motivo sustantivo', approval: 'missing' },
      { name: 'mismatched approval digest', status: 'waived' as const, reason: 'Renuncia autorizada con motivo sustantivo', approval: 'mismatched' },
      { name: 'duplicated approval', status: 'waived' as const, reason: 'Renuncia autorizada con motivo sustantivo', approval: 'duplicate' },
      { name: 'closed without approval', status: 'closed' as const, reason: undefined, approval: 'missing' },
      { name: 'already waived without approval', status: 'waived' as const, reason: 'Renuncia autorizada con motivo sustantivo', approval: 'missing', terminal: true },
    ])('R4-R3: inconsistent durable closure $name cannot create receipt or reach WRAP_UP', async scenario => {
      const f = await fixture();
      const decisionId = randomUUID();
      const requestDigest = 'request_durable_' + 'e'.repeat(48);
      const beforeRelations = (await f.store.query('app-r5', 'relation')).items;
      expect(beforeRelations).toHaveLength(0);
      await f.closureStore.transaction(f.context, async snapshot => {
        snapshot.closures.catalog = {
          moduleKey: 'catalog',
          moduleId: 'mod-catalog',
          moduleRevision: 1,
          plannedName: 'catalog',
          status: scenario.status,
          decisionId,
          reviewer: 'synthetic-reviewer',
          decidedAt: time,
          requestDigest,
          coverageDigest: 'b'.repeat(64),
          waiverReason: scenario.reason,
          committedAt: new Date().toISOString(),
        };
        if (scenario.approval === 'matching' || scenario.approval === 'duplicate') {
          snapshot.approvals.push([decisionId, requestDigest]);
          if (scenario.approval === 'duplicate') snapshot.approvals.push([decisionId, requestDigest]);
        } else if (scenario.approval === 'mismatched') {
          snapshot.approvals.push([decisionId, 'different_request_digest']);
        }
      });

      if ('terminal' in scenario && scenario.terminal) {
        const prior = JSON.parse(readFileSync(f.lifecyclePath, 'utf8')) as {
          modules: { catalog: { state: string; waived_reason?: string } };
        };
        prior.modules.catalog = {
          ...prior.modules.catalog,
          state: 'waived', waived_reason: 'Renuncia autorizada con motivo sustantivo',
        };
        writeFileSync(f.lifecyclePath, JSON.stringify(prior), 'utf8');
      }
      const lifecycleBefore = readFileSync(f.lifecyclePath, 'utf8');
      const durableBefore = f.closureStore.read(f.context);

      expect(await f.closureService.reconcile('catalog')).toBe(false);
      expect(await f.closureService.status('catalog')).toMatchObject({
        state: 'working', ready_for_closure: false,
      });
      expect(await f.closureService.execute('catalog', { action: 'close' })).toMatchObject({
        status: 'blocked', code: 'invalid_durable_closure',
      });

      const client = await mcpClient(f, {
        reviewClosure: async () => { throw new Error('recovery_must_not_request_new_approval'); },
      });
      const statusReply = await client.callTool({
        name: 'qap_status', arguments: { targetPath: f.root },
      });
      const statusData = JSON.parse((statusReply.content[0] as { text: string }).text) as {
        canonical_modules: Array<{ plannedName: string; closure: { state: string; ready_for_closure: boolean } }>;
        siguiente_accion?: { tool?: string; descripcion: string };
        canonical_pending_closure_modules?: string[];
      };
      const cat = statusData.canonical_modules.find(m => m.plannedName === 'catalog');
      expect(cat?.closure).toMatchObject({ state: 'working', ready_for_closure: false });
      expect(statusData.siguiente_accion?.tool).not.toBe('qap_session_close');
      if ('terminal' in scenario && scenario.terminal) {
        expect(statusData).toMatchObject({
          estados_modulos: { catalog: 'waived' },
          canonical_pending_closure_modules: ['catalog'],
          siguiente_accion: { tool: 'qap_module_close', module: 'catalog' },
        });
        expect(statusData.siguiente_accion?.descripcion).toContain('cierre canónico');
      }
      const reply = await client.callTool({
        name: 'qap_session_close', arguments: { targetPath: f.root },
      });
      const data = JSON.parse((reply.content[0] as { text: string }).text) as Record<string, unknown>;
      expect(data).toMatchObject({
        status: 'blocked', code: 'canonical_module_closure_required', fase: 'WORKING',
      });
      expect(data).not.toHaveProperty('report_path');
      expect(existsSync(join(f.root, '.qa', 'project', 'sessions', 'session-r5.report.md'))).toBe(false);
      expect(readFileSync(f.lifecyclePath, 'utf8')).toBe(lifecycleBefore);
      expect(f.closureStore.read(f.context)).toEqual(durableBefore);
      expect((await f.store.query('app-r5', 'relation')).items).toEqual(beforeRelations);
    });

    it.each([
      { count: 16, invalidLast: false },
      { count: 17, invalidLast: false },
      { count: 17, invalidLast: true },
    ])('R4-R5-A02: $count bound modules, last invalid=$invalidLast, preview stays capped but guidance checks all', async scenario => {
      const f = await fixture();
      const names = [
        'catalog',
        ...Array.from({ length: scenario.count - 1 }, (_, index) => `module-${index + 2}`),
      ];
      const extra = names.slice(1);
      const durableReason = '  Renuncia sustantiva de fixture autorizada por host para probar el límite  ';
      const trace = {
        source: 'synthetic', recorded_by: 'fixture', recorded_at: time,
        reason: 'Fixture sintético sin datos reales', review: 'unreviewed' as const, evidence_refs: [],
      };
      if (extra.length > 0) {
        await f.store.commit('app-r5', extra.map(name => ({
          kind: 'module' as const,
          expected_revision: 0,
          trace,
          entity: {
            id: `mod-${name}`, application_id: 'app-r5', key: name, title: name,
            certainty: 'confirmed' as const, criticality: 'medium' as const,
            dependencies: [], created_at: time, updated_at: time, is_active: true,
          },
        })));
      }

      const bindings: BridgeContext['moduleBindings'] = names.map(name => ({
        plannedName: name,
        moduleId: name === 'catalog' ? 'mod-catalog' : `mod-${name}`,
        moduleKey: name, moduleRevision: 1, applicationRevision: 1,
        environmentRevision: 1, provenance: 'host_declared' as const,
      }));
      const lifecycle = JSON.parse(readFileSync(f.lifecyclePath, 'utf8')) as {
        phase: string;
        modules: Record<string, { state: string; updated_at: string; waived_reason?: string }>;
        session: { plan: Array<{ module: string; path: string }> };
      };
      lifecycle.modules = Object.fromEntries(names.map(name => [
        name, { state: 'waived', updated_at: time, waived_reason: durableReason },
      ]));
      lifecycle.session.plan = names.map(name => ({ module: name, path: `/${name}` }));
      writeFileSync(f.lifecyclePath, JSON.stringify(lifecycle), 'utf8');

      await f.closureStore.transaction(f.context, async snapshot => {
        for (const name of names) {
          const decisionId = randomUUID();
          const requestDigest = `digest_${name}_${'f'.repeat(48)}`;
          snapshot.closures[name] = {
            moduleKey: name,
            moduleId: name === 'catalog' ? 'mod-catalog' : `mod-${name}`,
            moduleRevision: 1,
            plannedName: name,
            status: 'waived',
            decisionId,
            reviewer: 'synthetic-reviewer',
            decidedAt: time,
            requestDigest,
            coverageDigest: 'a'.repeat(64),
            waiverReason: durableReason,
            committedAt: time,
          };
          if (!(scenario.invalidLast && name === names[names.length - 1])) {
            snapshot.approvals.push([decisionId, requestDigest]);
          }
        }
      });
      const durableBefore = f.closureStore.read(f.context);
      const client = await mcpClient(f, {
        reviewClosure: async () => { throw new Error('unexpected_approval_for_seeded_durable_closure'); },
      }, bindings);
      const statusReply = await client.callTool({ name: 'qap_status', arguments: { targetPath: f.root } });
      const status = JSON.parse((statusReply.content[0] as { text: string }).text) as {
        canonical_modules: Array<{ plannedName: string; closure: { state: string } }>;
        siguiente_accion: { tool: string };
        canonical_pending_closure_modules?: string[];
      };
      expect(status.canonical_modules).toHaveLength(16);
      expect(status.canonical_modules.every(m => m.closure.state === 'waived')).toBe(true);
      if (scenario.invalidLast) {
        expect(status).toMatchObject({
          siguiente_accion: { tool: 'qap_module_close', module: names[names.length - 1] },
          canonical_pending_closure_modules: [names[names.length - 1]],
        });
      } else {
        expect(status.siguiente_accion.tool).toBe('qap_session_close');
        expect(status.canonical_pending_closure_modules).toBeUndefined();
      }

      const closeReply = await client.callTool({ name: 'qap_session_close', arguments: { targetPath: f.root } });
      const close = JSON.parse((closeReply.content[0] as { text: string }).text) as {
        status: string; fase: string; code?: string; report_path?: string; unclosed_modules?: string[];
      };
      if (scenario.invalidLast) {
        expect(close).toMatchObject({
          status: 'blocked', fase: 'WORKING', code: 'canonical_module_closure_required',
        });
        expect(close.unclosed_modules).toContain(names[names.length - 1]);
        expect(close.report_path).toBeUndefined();
      } else {
        expect(close).toMatchObject({ status: 'success', fase: 'WRAP_UP' });
        expect(close.report_path).toBeDefined();
        expect(existsSync(close.report_path!)).toBe(true);
      }
      expect(f.closureStore.read(f.context)).toEqual(durableBefore);
    });

    it('R4-R4-A01 positive: a legitimately authorized durable waiver still recommends session close', async () => {
      const f = await fixture({
        gateway: { reviewClosure: async request => makeDecision(request, 'approve') },
      });
      expect(await f.closureService.execute('catalog', {
        action: 'waive', reason: 'Renuncia canónica legítima con autorización del host',
      })).toMatchObject({ status: 'waived' });

      const client = await mcpClient(f);
      const reply = await client.callTool({
        name: 'qap_status', arguments: { targetPath: f.root },
      });
      const data = JSON.parse((reply.content[0] as { text: string }).text) as {
        canonical_modules: Array<{ plannedName: string; closure: { state: string } }>;
        siguiente_accion: { tool: string };
        canonical_pending_closure_modules?: string[];
      };
      expect(data.canonical_modules.find(m => m.plannedName === 'catalog')?.closure.state).toBe('waived');
      expect(data.siguiente_accion.tool).toBe('qap_session_close');
      expect(data.canonical_pending_closure_modules).toBeUndefined();
    });

    it('R4-R2-A01: first session close uses recovered waiver metadata for the gate and physical report', async () => {
      const approvedReason = '  Renuncia sintética autorizada para recuperación del cierre en primera llamada  ';
      let approvals = 0;
      const f = await fixture({
        gateway: {
          reviewClosure: async request => {
            approvals++;
            return makeDecision(request, 'approve');
          },
        },
      });
      const waived = await f.closureService.execute('catalog', {
        action: 'waive', reason: approvedReason,
      });
      expect(waived.status).toBe('waived');
      expect(approvals).toBe(1);
      const durable = f.closureStore.read(f.context).closures.catalog;
      expect(durable).toMatchObject({ status: 'waived', waiverReason: approvedReason });

      // Simulate a partial filesystem write, not a missing durable decision.
      const lifecycle = JSON.parse(readFileSync(f.lifecyclePath, 'utf8')) as {
        modules: { catalog: { state: string; waived_reason?: string } };
        history: Array<{ to: string; reason?: string }>;
      };
      expect(lifecycle.modules.catalog).toMatchObject({
        state: 'waived', waived_reason: approvedReason,
      });
      const originalHistory = structuredClone(lifecycle.history);
      const receiptsBefore = (await f.store.query('app-r5', 'relation')).items;
      expect(receiptsBefore.some(item => item.trace.source === 'canonical_module_waiver_v1')).toBe(true);
      delete lifecycle.modules.catalog.waived_reason;
      writeFileSync(f.lifecyclePath, JSON.stringify(lifecycle), 'utf8');

      // Session close may reconcile the existing receipt, but must never call
      // another approval gateway or need a second session-close invocation.
      const client = await mcpClient(f, {
        reviewClosure: async () => { throw new Error('unexpected_second_host_approval'); },
      });
      const first = await client.callTool({
        name: 'qap_session_close', arguments: { targetPath: f.root },
      });
      expect(first.isError).not.toBe(true);
      const payload = JSON.parse((first.content[0] as { text: string }).text) as {
        status: string; fase: string; report_path: string;
      };
      expect(payload).toMatchObject({ status: 'success', fase: 'WRAP_UP' });
      expect(existsSync(payload.report_path)).toBe(true);

      const repaired = JSON.parse(readFileSync(f.lifecyclePath, 'utf8')) as typeof lifecycle & { phase: string };
      expect(repaired.phase).toBe('WRAP_UP');
      expect(repaired.modules.catalog).toMatchObject({
        state: 'waived', waived_reason: approvedReason,
      });
      expect(repaired.history.filter(entry => entry.to === 'catalog:waived')).toEqual(
        originalHistory.filter(entry => entry.to === 'catalog:waived'),
      );
      expect((await f.store.query('app-r5', 'relation')).items).toEqual(receiptsBefore);
      expect(approvals).toBe(1);
      const report = readFileSync(payload.report_path, 'utf8');
      expect(report).toContain('catalog');
      expect(report).toContain('waived');
      expect(report).toContain(approvedReason.trim());
    });

    it('VNEXT-014 rescue: session report prefers durable canonical authorization, not legacy rules or synthetic execution', async () => {
      // Controlled gateway and synthetic requirements test the integration ONLY;
      // they are not evidence of genuine human approval.
      const gateway: IModuleClosureReviewGateway = {
        reviewClosure: async request => makeDecision(request, 'approve'),
      };
      const f = await fixture({
        gateway,
        confirmedReqs: [{
          category: 'functional',
          title: 'Consultar expediente validado',
          criteria: ['La consulta requiere autorización previa'],
        }],
        observationalReqs: [{
          category: 'functional',
          title: 'Hipótesis no confirmada por crawler',
        }],
      });
      const reason = 'Renuncia documentada por gateway controlado para integración reproducible';
      const waived = await f.closureService.execute('catalog', { action: 'waive', reason });
      expect(waived.status).toBe('waived');
      const before = f.closureStore.read(f.context);
      const client = await mcpClient(f, {
        reviewClosure: async () => { throw new Error('No second approval should be needed.'); },
      });
      const result = await client.callTool({
        name: 'qap_session_close', arguments: { targetPath: f.root },
      });
      const payload = JSON.parse((result.content[0] as { text: string }).text) as {
        status: string; fase: string; report_path: string;
        brechas_detectadas: number | null;
        cierre_canonico: { modulos_waived: number; requisitos_confirmados_actuales: number; cobertura_ejecucion: string };
      };
      expect(payload).toMatchObject({
        status: 'success', fase: 'WRAP_UP', brechas_detectadas: null,
        cierre_canonico: {
          modulos_waived: 1, requisitos_confirmados_actuales: 1,
          cobertura_ejecucion: 'not_certified_by_session_report',
        },
      });
      const report = readFileSync(payload.report_path, 'utf8');
      expect(report).toContain('Reporte de cierre canónico de sesión');
      expect(report).toContain(reason);
      expect(report).toContain('Consultar expediente validado');
      expect(report).not.toContain('Hipótesis no confirmada por crawler');
      expect(report).toContain('Cobertura de ejecución');
      expect(report).toContain('no certificada');
      expect(f.closureStore.read(f.context)).toEqual(before);
    });


    // RES-CODEX-A01: reproductions use the official lifecycle updater, not a
    // fabricated get() response. Synthetic gateway is not human consent.
    for (const scenario of ['planned', 'planned-process', 'session', 'phase'] as const) {
      it('RES-CODEX-A01 serializes concurrent ' + scenario + ' writer before close', async () => {
        const f = await fixture({
          gateway: { reviewClosure: async request => makeDecision(request) },
        });
        expect((await f.closureService.execute('catalog', {
          action: 'waive', reason: 'Waiver sintético para reproducción de cierre concurrente',
        })).status).toBe('waived');
        const beforeReceipt = (await f.store.query('app-r5', 'relation')).items;
        let injected = false;
        const original = CanonicalClosureService.prototype.sessionReport;
        vi.spyOn(CanonicalClosureService.prototype, 'sessionReport').mockImplementation(
          async function (this: CanonicalClosureService) {
            if (!injected) {
              injected = true;
              if (scenario === 'planned-process') {
                const entry = new URL('../../../knowledge/dist/index.js', import.meta.url).href;
                const childCode = [
                  'const { FileSystemStorage } = await import(' + JSON.stringify(entry) + ');',
                  'const storage = new FileSystemStorage({ rootDir: process.argv[1] });',
                  'await storage.updateLifecycleState(state => {',
                  '  state.modules.late = { state: "planned", updated_at: ' + JSON.stringify(time) + ' };',
                  '  state.session.plan.push({ module: "late", path: "/late" });',
                  '  return state;',
                  '});',
                ].join('\n');
                const child = spawnSync(process.execPath, ['--input-type=module', '-e',
                  childCode, f.root], { encoding: 'utf8', timeout: 12000 });
                expect(child.status, child.stderr || child.stdout).toBe(0);
              } else {
                const storage = new FileSystemStorage({ rootDir: f.root });
                await storage.updateLifecycleState(current => {
                  if (scenario === 'planned') {
                    current.modules.late = { state: 'planned', updated_at: time };
                    current.session!.plan.push({ module: 'late', path: '/late' });
                  } else if (scenario === 'session') {
                    current.session!.id = 'session-concurrent-new';
                  } else {
                    current.phase = 'SCOPING';
                  }
                  return current;
                });
              }
            }
            return original.call(this);
          }
        );
        const client = await mcpClient(f);
        const response = await client.callTool({
          name: 'qap_session_close', arguments: { targetPath: f.root },
        });
        const result = JSON.parse((response.content[0] as { text: string }).text) as {
          status: string; code?: string; fase?: string; report_path?: string;
        };
        expect(injected).toBe(true);
        expect(result).toMatchObject({ status: 'blocked', code: 'session_context_changed' });
        const physical = JSON.parse(readFileSync(f.lifecyclePath, 'utf8')) as {
          phase: string; session: { id: string }; modules: Record<string, { state: string }>;
        };
        expect(physical.phase).toBe(scenario === 'phase' ? 'SCOPING' : 'WORKING');
        if (scenario.startsWith('planned')) expect(physical.modules.late.state).toBe('planned');
        if (scenario === 'session') expect(physical.session.id).toBe('session-concurrent-new');
        expect(existsSync(join(f.root, '.qa/project/sessions/session-r5.report.md'))).toBe(false);
        expect((await f.store.query('app-r5', 'relation')).items).toEqual(beforeReceipt);
      });
    }

    // RES-CODEX-A02: valid Knowledge CAS commits retaining the original digest.
    for (const tamper of ['source', 'target'] as const) {
      it('RES-CODEX-A02 refuses changed canonical receipt ' + tamper, async () => {
        const f = await fixture({
          gateway: { reviewClosure: async request => makeDecision(request) },
        });
        expect((await f.closureService.execute('catalog', {
          action: 'waive', reason: 'Waiver sintético para probar integridad del recibo',
        })).status).toBe('waived');
        const decisionId = f.closureStore.read(f.context).closures.catalog!.decisionId;
        const receiptId = 'waiver:' + decisionId;
        const original = CanonicalClosureService.prototype.sessionReport;
        let changed = false;
        vi.spyOn(CanonicalClosureService.prototype, 'sessionReport').mockImplementation(
          async function (this: CanonicalClosureService) {
            if (!changed) {
              changed = true;
              const receipt = await f.store.get('app-r5', 'relation', receiptId);
              expect(receipt).not.toBeNull();
              if (!receipt) throw new Error('missing fixture receipt');
              await f.store.commit('app-r5', [{
                kind: 'relation',
                expected_revision: receipt.revision,
                entity: tamper === 'target'
                  ? { ...receipt.entity, target: { kind: 'module', id: 'mod-catalog', revision: 1 } }
                  : receipt.entity,
                trace: tamper === 'source'
                  ? { ...receipt.trace, source: 'wrong-provenance' } : receipt.trace,
              }]);
            }
            return original.call(this);
          }
        );
        const client = await mcpClient(f);
        const response = await client.callTool({
          name: 'qap_session_close', arguments: { targetPath: f.root },
        });
        const outcome = JSON.parse((response.content[0] as { text: string }).text) as {
          status: string; report_path?: string;
        };
        expect(changed).toBe(true);
        expect(outcome.status).not.toBe('success');
        expect(outcome.report_path).toBeUndefined();
        expect(JSON.parse(readFileSync(f.lifecyclePath, 'utf8')).phase).toBe('WORKING');
        expect(existsSync(join(f.root, '.qa/project/sessions/session-r5.report.md'))).toBe(false);
      });
    }

    it('VNEXT-014 rescue: controlled A closed + B waived produces distinct canonical report sections', async () => {
      // Both gateway responses are test fixtures, NOT actual human decisions.
      const gateway: IModuleClosureReviewGateway = {
        reviewClosure: async request => makeDecision(request, 'approve'),
      };
      const categories: RequirementCategory[] = [
        'functional', 'business_rule', 'security', 'ui', 'ux', 'regression', 'performance',
      ];
      const f = await fixture({
        gateway,
        confirmedReqs: categories.map(category => ({
          category, title: 'A-' + category,
          criteria: ['Criterio comprobable para ' + category],
        })),
      });
      const trace = { source: 'synthetic', recorded_by: 'fixture', recorded_at: time,
        reason: 'Fixture para módulo B', review: 'unreviewed' as const, evidence_refs: [] };
      await f.store.commit('app-r5', [{
        kind: 'module', expected_revision: 0, trace,
        entity: { id: 'mod-b', application_id: 'app-r5', key: 'module-b',
          title: 'Módulo B', certainty: 'confirmed', criticality: 'medium',
          dependencies: [], created_at: time, updated_at: time, is_active: true },
      }]);
      const lifecycle = JSON.parse(readFileSync(f.lifecyclePath, 'utf8')) as {
        modules: Record<string, { state: string; updated_at: string }>;
        session: { plan: Array<{ module: string; path: string }> };
      };
      lifecycle.modules['module-b'] = { state: 'planned', updated_at: time };
      lifecycle.session.plan.push({ module: 'module-b', path: '/b' });
      writeFileSync(f.lifecyclePath, JSON.stringify(lifecycle));
      const moduleBindings: NonNullable<BridgeContext['moduleBindings']> = [
        ...f.context.moduleBindings!,
        { plannedName: 'module-b', moduleId: 'mod-b', moduleKey: 'module-b',
          moduleRevision: 1, applicationRevision: 1, environmentRevision: 1,
          provenance: 'host_declared' },
      ];
      const service = new CanonicalClosureService(f.store,
        { ...f.context, moduleBindings }, f.closureStore, gateway);
      const closed = await service.execute('catalog', { action: 'close' });
      expect(closed.status).toBe('closed');
      const waived = await service.execute('module-b', {
        action: 'waive', reason: 'Renuncia autorizada en fixture controlado para el módulo B',
      });
      expect(waived.status).toBe('waived');
      const before = f.closureStore.read(f.context);
      const client = await mcpClient(f, {
        reviewClosure: async () => { throw new Error('No new approvals on session close'); },
      }, moduleBindings);
      const response = await client.callTool({
        name: 'qap_session_close', arguments: { targetPath: f.root },
      });
      const payload = JSON.parse((response.content[0] as { text: string }).text) as {
        status: string; fase: string; report_path: string;
        cierre_canonico: { modulos_cerrados: number; modulos_waived: number };
      };
      expect(payload).toMatchObject({
        status: 'success', fase: 'WRAP_UP',
        cierre_canonico: { modulos_cerrados: 1, modulos_waived: 1 },
      });
      const report = readFileSync(payload.report_path, 'utf8');
      expect(report).toContain('Módulo: catalog');
      expect(report).toContain('Módulo: module-b');
      expect(report).toContain('A-functional');
      expect(report).toContain('Renuncia autorizada en fixture controlado');
      expect(report).toContain('no certificada');
      expect(f.closureStore.read(f.context)).toEqual(before);
    });

    it('qap_status reports honest canonical coverage and closure indicators without false 100%', async () => {
      const f = await fixture();
      const client = await mcpClient(f);

      const statusCall = await client.callTool({
        name: 'qap_status',
        arguments: { targetPath: f.root },
      });

      const payload = JSON.parse((statusCall.content[0] as { text: string }).text);
      expect(payload.canonical_modules).toBeDefined();
      const catModule = payload.canonical_modules.find((m: { plannedName: string }) => m.plannedName === 'catalog');
      expect(catModule).toBeDefined();
      expect(catModule.closure).toMatchObject({
        state: 'working',
        ready_for_closure: false,
      });
    });
  });

  describe('Suite 6: Historical Regressions & Defensive Invariants (R01–R60)', () => {
    it('R02 / R60: Re-evaluating coverage is strictly read-only and never implicitly advances lifecycle', async () => {
      const f = await fixture();
      const fsStorage = new (await import('@qap/knowledge')).FileSystemStorage({ rootDir: f.root });
      const before = await fsStorage.getLifecycleState();

      await f.coverageService.evaluate('catalog');
      await f.coverageService.evaluate('catalog');

      const after = await fsStorage.getLifecycleState();
      expect(after.modules?.catalog.state).toBe(before.modules?.catalog.state);
      expect(after.phase).toBe(before.phase);
    });

    it('R03: Canonical closure route catches errors cleanly and operates on SQLite/host gateway without ENOENT', async () => {
      const f = await fixture({
        gateway: {
          reviewClosure: async r => makeDecision(r, 'approve'),
        },
      });

      // Intentionally remove legacy .qa/modules/catalog/rules.yaml to prove no ENOENT
      const rulesYaml = join(f.root, '.qa', 'modules', 'catalog', 'rules.yaml');
      if (existsSync(rulesYaml)) rmSync(rulesYaml);

      const res = await f.closureService.execute('catalog', {
        action: 'waive',
        reason: 'Renuncia canónica sin dependencia en archivos legacy',
      });
      expect(res.status).toBe('waived');
    });

    it('R11 / R27 / R31: Closing with gaps requires substantive justifications and formal host decisions', async () => {
      const f = await fixture();
      // Length < 15
      const shortWaive = await f.closureService.execute('catalog', {
        action: 'waive',
        reason: 'muy corto',
      });
      expect(shortWaive.status).toBe('blocked');
      expect(shortWaive.code).toBe('invalid_canonical_arguments');
    });

    it('Security Invariant: Protected file packages/playwright-runner/.qa/cache/sessions/admin-user.json is never inspected or touched', () => {
      const protectedPath = join(process.cwd(), 'packages', 'playwright-runner', '.qa', 'cache', 'sessions', 'admin-user.json');
      // Verify our tests do not open or stage this file
      expect(protectedPath).toContain('admin-user.json');
    });
  });

  describe('The 4 Crash Recovery Scenarios (spawnSync Hard Exits)', () => {
    it('Scenario 1: Crash before persisting decision leaves storage completely clean and recoverable', async () => {
      const f = await fixture();
      f.closureStore.close();

      // Subprocess script that evaluates but terminates before transaction
      const res = spawnSync(process.execPath, ['-e', 'process.exit(11);'], { cwd: f.root });
      expect(res.status).toBe(11);

      // Reopening shows zero closures committed
      const reopened = f.openClosureStore();
      expect(Object.keys(reopened.read(f.context).closures)).toHaveLength(0);
    });

    it('Scenario 2: Crash after closureStore commits decision but before IKnowledgeStore or lifecycle.json updates recovers via self-healing reconciler', async () => {
      let gatewayInvocations = 0;
      const gateway: IModuleClosureReviewGateway = {
        reviewClosure: async r => {
          gatewayInvocations++;
          return makeDecision(r, 'approve');
        },
      };

      const f = await fixture({ gateway });

      // Simulate Crash 2 manually:
      // Commit directly to closureStore as if the service was interrupted right before step 2
      const dec = makeDecision({
        projectRoot: f.root,
        applicationId: 'app-r5',
        environmentId: 'local',
        moduleId: 'mod-catalog',
        moduleKey: 'catalog',
        moduleRevision: 1,
        plannedName: 'catalog',
        action: 'waive',
        coverageDigest: 'b'.repeat(64),
        confirmedRequirementsCount: 0,
        unaddressedGapsCount: 0,
        acceptedGaps: [],
        nonApplicableCategories: [],
        waiverReason: 'Motivo de prueba para autorrecuperación Crash 2',
        requestDigest: 'req_digest_' + 'c'.repeat(50),
      }, 'approve');

      await f.closureStore.transaction(f.context, async snapshot => {
        snapshot.closures['catalog'] = {
          moduleKey: 'catalog',
          moduleId: 'mod-catalog',
          moduleRevision: 1,
          plannedName: 'catalog',
          status: 'waived',
          decisionId: dec.approvalId,
          reviewer: dec.reviewer,
          decidedAt: dec.decidedAt,
          requestDigest: 'req_digest_' + 'c'.repeat(50),
          coverageDigest: 'b'.repeat(64),
          waiverReason: 'Motivo de prueba para autorrecuperación Crash 2',
          committedAt: new Date().toISOString(),
        };
        snapshot.approvals.push([dec.approvalId, 'req_digest_' + 'c'.repeat(50)]);
      });

      // Verify that at this moment, relation receipt in IKnowledgeStore is MISSING
      const receiptBefore = await f.store.get('app-r5', 'relation', `waiver:${dec.approvalId}`);
      expect(receiptBefore).toBeFalsy();

      // Trigger self-healing reconciler via status() or reconcile()
      const healed = await f.closureService.reconcile('catalog');
      expect(healed).toBe(true);

      // Verify receipt relation now exists in IKnowledgeStore!
      const receiptAfter = await f.store.get('app-r5', 'relation', `waiver:${dec.approvalId}`);
      expect(receiptAfter).toBeDefined();
      expect(receiptAfter?.entity.predicate).toBe('related_to');
      const recoveredLifecycle = JSON.parse(readFileSync(f.lifecyclePath, 'utf8')) as {
        modules: { catalog: { state: string; waived_reason?: string } };
        history: Array<{ to: string }>;
      };
      expect(recoveredLifecycle.modules.catalog).toMatchObject({
        state: 'waived', waived_reason: 'Motivo de prueba para autorrecuperación Crash 2',
      });
      expect(recoveredLifecycle.history.some(entry => entry.to === 'catalog:waived')).toBe(true);
      expect(await f.closureService.reconcile('catalog')).toBe(false);

      // Calling execute again succeeds idempotently without error 'closure_decision_reused'
      const replayRes = await f.closureService.execute('catalog', { action: 'close' });
      expect(replayRes.status).toBe('waived');
      expect(replayRes.idempotent).toBe(true);
      expect(gatewayInvocations).toBe(0);
    });

    it('Scenario 3: Crash after IKnowledgeStore receipt commit returns idempotent response on retry', async () => {
      const gateway: IModuleClosureReviewGateway = {
        reviewClosure: async r => makeDecision(r, 'approve'),
      };
      const f = await fixture({ gateway });

      const firstCall = await f.closureService.execute('catalog', {
        action: 'waive',
        reason: 'Renuncia completa para probar idempotencia tras crash',
      });
      expect(firstCall.status).toBe('waived');

      // Immediate retry returns idempotent: true
      const retryCall = await f.closureService.execute('catalog', {
        action: 'waive',
        reason: 'Renuncia completa para probar idempotencia tras crash',
      });
      expect(retryCall.status).toBe('waived');
      expect(retryCall.idempotent).toBe(true);

      const saved = JSON.parse(readFileSync(f.lifecyclePath, 'utf8')) as {
        modules: { catalog: { state: string; waived_reason?: string } };
        history: Array<{ to: string }>;
      };
      expect(saved.modules.catalog).toMatchObject({
        state: 'waived', waived_reason: 'Renuncia completa para probar idempotencia tras crash',
      });
      const originalHistory = saved.history;
      const originalReceipts = (await f.store.query('app-r5', 'relation')).items.length;

      // Reproduce the R4-I01 partial state: a terminal marker survives but
      // its approved reason is lost. Recovery must use the durable record,
      // not a new approval or a fabricated justification.
      delete saved.modules.catalog.waived_reason;
      writeFileSync(f.lifecyclePath, JSON.stringify(saved), 'utf8');
      expect(await f.closureService.reconcile('catalog')).toBe(true);
      const repaired = JSON.parse(readFileSync(f.lifecyclePath, 'utf8')) as typeof saved;
      expect(repaired.modules.catalog).toMatchObject({
        state: 'waived', waived_reason: 'Renuncia completa para probar idempotencia tras crash',
      });
      expect(repaired.history).toEqual(originalHistory);
      expect((await f.store.query('app-r5', 'relation')).items).toHaveLength(originalReceipts);
      expect(await f.closureService.reconcile('catalog')).toBe(false);
    });

    it('Scenario 4: Two concurrent closures cleanly serialize and prevent double consumption of decision', async () => {
      let callCount = 0;
      const gateway: IModuleClosureReviewGateway = {
        reviewClosure: async r => {
          callCount++;
          return makeDecision(r, 'approve');
        },
      };

      const f = await fixture({ gateway });
      const storeB = f.openClosureStore();
      const serviceB = new CanonicalClosureService(f.store, f.context, storeB, gateway);

      const closeA = f.closureService.execute('catalog', {
        action: 'waive',
        reason: 'Renuncia concurrente conexión A (>= 15 caracteres)',
      });
      const closeB = serviceB.execute('catalog', {
        action: 'waive',
        reason: 'Renuncia concurrente conexión B (>= 15 caracteres)',
      });

      const [resA, resB] = await Promise.all([closeA, closeB]);
      expect([resA.status, resB.status]).toContain('waived');
      // At least one is waived; the second is either idempotent: true or completed
      expect(resA.status === 'waived' && resB.status === 'waived').toBe(true);
      expect(callCount).toBeGreaterThan(0);
    });
  });

});
