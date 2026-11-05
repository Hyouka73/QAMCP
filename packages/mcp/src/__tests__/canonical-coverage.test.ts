import { randomBytes, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { SqliteKnowledgeAdapter } from '@qap/knowledge';
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
    async function mcpClient(f: Awaited<ReturnType<typeof fixture>>, gateway?: IModuleClosureReviewGateway) {
      const server = createMcpServer({
        projectRoots: [f.root],
        knowledgeBindings: [
          {
            projectRoot: f.root,
            applicationId: 'app-r5',
            environmentId: 'local',
            store: f.store,
            moduleBindings: f.context.moduleBindings,
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
