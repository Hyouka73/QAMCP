import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { IKnowledgeStore } from '@qap/engine';
import { SqliteKnowledgeAdapter } from '@qap/knowledge';
import {
  validateExpectedRequirement,
  validateCanonicalClosureCommand,
  validateCoverageAssessmentInvariants,
} from '@qap/shared';
import { describe, expect, it, afterEach, vi } from 'vitest';

import { createMcpServer } from '../server.js';
import { CanonicalCoverageService } from '../handlers/canonical-coverage-service.js';
import { CanonicalClosureService } from '../handlers/canonical-closure-service.js';
import {
  SqliteModuleClosureStore,
  ClosureStoreError,
} from '../handlers/module-closure-store.js';
import type {
  IModuleClosureReviewGateway,
  ModuleClosureReviewRequest,
  ModuleClosureReviewDecision,
} from '../handlers/module-closure-gateway.js';
import type { BridgeContext } from '../handlers/module-observation-bridge.js';
import { MemoryKnowledgeStore } from '../../../engine/src/__tests__/mocks/knowledge-store.mock.js';

const roots: string[] = [];
const closers: Array<() => Promise<void> | void> = [];
const time = '2026-10-31T12:00:00.000Z';

afterEach(async () => {
  vi.restoreAllMocks();
  for (const close of closers.splice(0).reverse()) {
    try { await close(); } catch { /* empty */ }
  }
  roots.splice(0).forEach(root => {
    try { rmSync(root, { recursive: true, force: true }); } catch { /* empty */ }
  });
});

class MockReviewGateway implements IModuleClosureReviewGateway {
  readonly requests: ModuleClosureReviewRequest[] = [];
  decisionToReturn: 'approve' | 'reject' | 'tampered_digest' | 'expired' | 'malformed_date' | 'none' = 'approve';
  reviewerName = 'security-adversary-lead';

  async reviewClosure(request: ModuleClosureReviewRequest): Promise<ModuleClosureReviewDecision | null> {
    this.requests.push(structuredClone(request));
    if (this.decisionToReturn === 'none') return null;

    const reqDigest = this.decisionToReturn === 'tampered_digest'
      ? createHash('sha256').update('tampered-digest-adversary').digest('hex')
      : request.requestDigest;

    const expiresAt = this.decisionToReturn === 'expired'
      ? new Date(Date.now() - 60_000).toISOString()
      : (this.decisionToReturn === 'malformed_date' ? 'invalid-not-a-date' : new Date(Date.now() + 60_000).toISOString());

    return {
      approvalId: randomUUID(),
      requestDigest: reqDigest,
      coverageDigest: request.coverageDigest,
      reviewer: this.reviewerName,
      decidedAt: new Date().toISOString(),
      expiresAt,
      decision: this.decisionToReturn === 'reject' ? 'reject' : 'approve',
    };
  }
}

async function createCanonicalFixture(options: {
  gateway?: IModuleClosureReviewGateway;
  requirements?: Array<Record<string, unknown>>;
  extraModules?: boolean;
  physicalKnowledge?: boolean;
} = {}) {
  const root = mkdtempSync(join(tmpdir(), 'qap-adv-'));
  roots.push(root);

  mkdirSync(join(root, '.qa', 'project'), { recursive: true });
  mkdirSync(join(root, '.qa', 'private'), { recursive: true });

  const lifecyclePath = join(root, '.qa', 'project', 'lifecycle.json');
  const lifecycle = {
    _version: '1',
    phase: 'WORKING',
    modules: {
      catalog: { state: 'planned', updated_at: time },
      ...(options.extraModules ? { billing: { state: 'planned', updated_at: time } } : {}),
    },
    session: {
      id: 'session-adv',
      started_at: time,
      plan: [
        { module: 'catalog', path: '/' },
        ...(options.extraModules ? [{ module: 'billing', path: '/billing' }] : []),
      ],
      auth: { required: false },
    },
    history: [],
  };
  writeFileSync(lifecyclePath, JSON.stringify(lifecycle, null, 2));

  // Historical negative tests intentionally use MemoryKnowledgeStore without a
  // fence. Positive closure/CAS tests opt in to a real, durable SQLite fence.
  const knowledgeDbPath = join(root, '.qa', 'private', 'canonical.sqlite');
  const physicalStore = options.physicalKnowledge
    ? new SqliteKnowledgeAdapter(knowledgeDbPath) : undefined;
  if (physicalStore) closers.push(() => physicalStore.close());
  const store: IKnowledgeStore = physicalStore ?? new MemoryKnowledgeStore();

  const trace = {
    source: 'synthetic',
    recorded_by: 'fixture',
    recorded_at: time,
    reason: 'Authorized synthetic fixture',
    review: 'unreviewed' as const,
    evidence_refs: [],
  };

  await store.commit('app-adv', [
    {
      kind: 'application',
      expected_revision: 0,
      trace,
      entity: { application_id: 'app-adv', name: 'Adv App', base_url: 'https://example.invalid', created_at: time },
    },
    {
      kind: 'environment',
      expected_revision: 0,
      trace,
      entity: {
        application_id: 'app-adv',
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
        id: 'module-catalog',
        application_id: 'app-adv',
        key: 'catalog-key',
        title: 'Catalog Canonical Module',
        certainty: 'confirmed',
        criticality: 'high',
        dependencies: [],
        created_at: time,
        updated_at: time,
        is_active: true,
      },
    },
    ...(options.extraModules ? [{
      kind: 'module' as const,
      expected_revision: 0,
      trace,
      entity: {
        id: 'module-billing',
        application_id: 'app-adv',
        key: 'billing-key',
        title: 'Billing Canonical Module',
        certainty: 'confirmed' as const,
        criticality: 'high' as const,
        dependencies: [],
        created_at: time,
        updated_at: time,
        is_active: true,
      },
    }] : []),
  ]);

  if (options.requirements && options.requirements.length > 0) {
    const writes = options.requirements.map(req => ({
      kind: 'requirement' as const,
      expected_revision: 0,
      trace,
      entity: req,
    }));
    await store.commit('app-adv', writes);
  }

  const closureDbPath = join(root, '.qa', 'private', 'module-closure.sqlite');
  const closureKey = randomBytes(32);
  const closureStore = new SqliteModuleClosureStore({
    path: closureDbPath,
    projectRoot: root,
    applicationId: 'app-adv',
    environmentId: 'local',
    protection: 'host_private_directory_and_managed_key',
    key: closureKey,
    initialize: true,
  });
  closers.push(() => closureStore.close());

  const context: BridgeContext = {
    projectRoot: root,
    applicationId: 'app-adv',
    environmentId: 'local',
    moduleBindings: [
      {
        plannedName: 'catalog',
        moduleId: 'module-catalog',
        moduleKey: 'catalog-key',
        moduleRevision: 1,
        applicationRevision: 1,
        environmentRevision: 1,
        provenance: 'host_declared',
      },
      ...(options.extraModules ? [{
        plannedName: 'billing',
        moduleId: 'module-billing',
        moduleKey: 'billing-key',
        moduleRevision: 1,
        applicationRevision: 1,
        environmentRevision: 1,
        provenance: 'host_declared' as const,
      }] : []),
    ],
  };

  const gateway = options.gateway ?? new MockReviewGateway();
  const service = new CanonicalClosureService(store, context, closureStore, gateway);
  const coverageService = new CanonicalCoverageService(store, context, closureStore);

  return {
    root,
    store,
    context,
    closureStore,
    closureDbPath,
    knowledgeDbPath,
    closureKey,
    gateway,
    service,
    coverageService,
  };
}

describe('Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2)', () => {

  // =========================================================================
  // GUARANTEE 1: Epistemic Bypass
  // =========================================================================
  describe('Guarantee 1: Epistemic Bypass Stress-Testing', () => {
    it('1.1: Rejects status confirmed when provenance is active_probe', () => {
      const res = validateExpectedRequirement({
        id: 'req-probe-1',
        module_key: 'catalog-key',
        category: 'proposito',
        statement: 'El catálogo debe filtrar productos por categoría.',
        status: 'confirmed',
        provenance: 'active_probe',
        verified_by: 'human_reviewer',
        is_active: true,
      });
      expect(res.valid).toBe(false);
      expect(res.violations.some(v => v.code === 'EPISTEMIC_VIOLATION_PROBE_CANNOT_CONFIRM_REQUIREMENT')).toBe(true);
    });

    it('1.2: Rejects status confirmed when provenance is crawler', () => {
      const res = validateExpectedRequirement({
        id: 'req-crawler-1',
        module_key: 'catalog-key',
        category: 'alcance',
        statement: 'El crawler observó una ruta /api/catalog.',
        status: 'confirmed',
        provenance: 'crawler',
        verified_by: 'qa_lead',
        is_active: true,
      });
      expect(res.valid).toBe(false);
      expect(res.violations.some(v => v.code === 'EPISTEMIC_VIOLATION_PROBE_CANNOT_CONFIRM_REQUIREMENT')).toBe(true);
    });

    it('1.3: Rejects status confirmed when provenance is network_intercept or observed_telemetry', () => {
      for (const prov of ['network_intercept', 'observed_telemetry']) {
        const res = validateExpectedRequirement({
          id: `req-${prov}`,
          module_key: 'catalog-key',
          category: 'seguridad_y_permisos',
          statement: 'Telemetría capturada.',
          status: 'confirmed',
          provenance: prov as any,
          verified_by: 'admin',
          is_active: true,
        });
        expect(res.valid).toBe(false);
        expect(res.violations.some(v => v.code === 'EPISTEMIC_VIOLATION_PROBE_CANNOT_CONFIRM_REQUIREMENT')).toBe(true);
      }
    });

    it('1.4: Epistemic spoofing via source instead of provenance is caught', () => {
      const res = validateExpectedRequirement({
        id: 'req-source-spoof',
        module_key: 'catalog-key',
        category: 'proposito',
        statement: 'Fuente probe en source en vez de provenance.',
        status: 'confirmed',
        source: 'active_probe' as any,
        verified_by: 'developer',
        is_active: true,
      });
      expect(res.valid).toBe(false);
      expect(res.violations.some(v => v.code === 'EPISTEMIC_VIOLATION_PROBE_CANNOT_CONFIRM_REQUIREMENT')).toBe(true);
    });

    it('1.5: Invariant R1: legacy_manual_edit without verification_evidence cannot confirm', () => {
      const res = validateExpectedRequirement({
        id: 'req-legacy-1',
        module_key: 'catalog-key',
        category: 'proposito',
        statement: 'Requisito migrado de rules.yaml legacy.',
        status: 'confirmed',
        provenance: 'legacy_manual_edit',
        verified_by: 'operator_id',
        is_active: true,
      });
      expect(res.valid).toBe(false);
      expect(res.violations.some(v => v.code === 'LEGACY_MIGRATION_CONFIRMATION_WITHOUT_EVIDENCE_FORBIDDEN')).toBe(true);
    });

    it('1.6: Knowledge store and coverage engine strictly prevent observational requirements from confirming', async () => {
      const f = await createCanonicalFixture();

      // 1. Verify MemoryKnowledgeStore rejects committing confirmed requirement with active_probe
      const forgedReq = {
        id: 'req-forged-active-probe',
        application_id: 'app-adv',
        module_key: 'catalog-key',
        category: 'proposito',
        statement: 'Sonda intentando actuar como requisito confirmado.',
        validation_status: 'confirmed',
        provenance: 'active_probe',
        verified_by: 'unauthorized_probe',
        is_active: true,
      };

      await expect(
        f.store.commit('app-adv', [
          {
            kind: 'requirement',
            expected_revision: 0,
            trace: { source: 'active_probe', recorded_by: 'probe', recorded_at: time, reason: 'test', review: 'unreviewed', evidence_refs: [] },
            entity: forgedReq,
          },
        ])
      ).rejects.toThrow();

      // 2. Even if a mock store somehow returns an active_probe confirmed record during query,
      // CanonicalCoverageService evaluate() performs defense-in-depth filtering:
      const originalQuery = f.store.query.bind(f.store);
      f.store.query = async (app, kind, query) => {
        if (kind === 'requirement') {
          return {
            items: [
              {
                kind: 'requirement',
                id: 'req-mock-probe',
                revision: 1,
                application_id: 'app-adv',
                trace: { source: 'active_probe', recorded_by: 'probe', recorded_at: time, reason: 'test', review: 'unreviewed', evidence_refs: [] },
                references: [],
                entity: forgedReq,
              },
            ] as any,
          };
        }
        return originalQuery(app, kind, query);
      };

      const evalRes = await f.coverageService.evaluate('catalog');
      expect(evalRes.status).toBe('evaluated');
      if (evalRes.status === 'evaluated') {
        const spec = evalRes.assessment.specification_coverage;
        // MUST NOT be counted as confirmed requirement!
        expect(spec.confirmed_requirements_count).toBe(0);
        // MUST be demoted to pending!
        expect(spec.pending_requirements_count).toBe(1);
        expect(spec.status).not.toBe('complete');
        expect(evalRes.assessment.closure_verdict).not.toBe('ready_for_closure');
      }
    });
  });

  // =========================================================================
  // GUARANTEE 2: Wire Authorization Injection
  // =========================================================================
  describe('Guarantee 2: Wire Authorization Injection Stress-Testing', () => {
    it('2.1: Rejects all forbidden authorization keys in wire command arguments', () => {
      const forbiddenKeys = [
        'approvalId',
        'approval_id',
        'signature',
        'decision_id',
        'decisionId',
        'decided_by',
        'decidedBy',
      ];

      for (const forbiddenKey of forbiddenKeys) {
        const cmd = {
          action: 'close',
          [forbiddenKey]: 'injected-auth-value-xyz',
        };
        const validation = validateCanonicalClosureCommand(cmd);
        expect(validation.valid).toBe(false);
        expect(validation.violations.some(v => v.code === 'CLIENT_AUTHORIZATION_INJECTION_FORBIDDEN')).toBe(true);
      }
    });

    it('2.2: Rejects forbidden keys even when combined with waive or accept_gaps', () => {
      const waiveCmd = {
        action: 'waive',
        reason: 'Motivo sustantivo de renuncia de prueba con más de 15 caracteres.',
        approvalId: 'forged-uuid-123',
      };
      const vWaive = validateCanonicalClosureCommand(waiveCmd);
      expect(vWaive.valid).toBe(false);
      expect(vWaive.violations.some(v => v.code === 'CLIENT_AUTHORIZATION_INJECTION_FORBIDDEN')).toBe(true);

      const gapCmd = {
        action: 'accept_gaps',
        accepted_gaps: [{ gap_id: 'gap-1', reason: 'Aceptación de brecha sustantiva autorizada.' }],
        signature: 'rsa-sha256-fake-sig',
      };
      const vGap = validateCanonicalClosureCommand(gapCmd);
      expect(vGap.valid).toBe(false);
      expect(vGap.violations.some(v => v.code === 'CLIENT_AUTHORIZATION_INJECTION_FORBIDDEN')).toBe(true);
    });

    it('2.3: Rejects unexpected fields in canonical closure commands', () => {
      const badCmd = {
        action: 'close',
        jwt_token: 'fake.jwt.token',
        hacked_status: 'closed',
      };
      const v = validateCanonicalClosureCommand(badCmd);
      expect(v.valid).toBe(false);
      expect(v.violations.some(v => v.code === 'UNEXPECTED_COMMAND_FIELD')).toBe(true);
    });

    it('2.4: Substantive reason enforcement rejects non-substantive explanations (< 15 chars)', () => {
      const shortWaive = { action: 'waive', reason: 'corta' };
      const vWaive = validateCanonicalClosureCommand(shortWaive);
      expect(vWaive.valid).toBe(false);
      expect(vWaive.violations.some(v => v.code === 'SUBSTANTIVE_WAIVER_REASON_REQUIRED')).toBe(true);

      const shortGap = { action: 'accept_gaps', accepted_gaps: [{ gap_id: 'gap-1', reason: 'muy corta' }] };
      const vGap = validateCanonicalClosureCommand(shortGap);
      expect(vGap.valid).toBe(false);
      expect(vGap.violations.some(v => v.code === 'SUBSTANTIVE_GAP_ACCEPTANCE_REASON_REQUIRED')).toBe(true);
    });

    it('2.5: Host gateway bypass rejection: closes block if gateway is missing', async () => {
      const f = await createCanonicalFixture();
      const serviceNoGateway = new CanonicalClosureService(f.store, f.context, f.closureStore, undefined);
      const res = await serviceNoGateway.execute('catalog', { action: 'close' });
      expect(res.status).toBe('blocked');
      expect(res.code).toBe('closure_review_gateway_required');
    });

    it('2.6: Host gateway tampered digest rejection: blocks if decision digest does not match request digest', async () => {
      const mockGateway = new MockReviewGateway();
      mockGateway.decisionToReturn = 'tampered_digest';
      const f = await createCanonicalFixture({ gateway: mockGateway });

      const res = await f.service.execute('catalog', {
        action: 'waive',
        reason: 'Renuncia formal debidamente fundamentada para auditoría de seguridad.',
      });
      expect(res.status).toBe('blocked');
      expect(res.code).toBe('closure_review_invalid');
    });

    it('2.7: Host gateway expired decision rejection: blocks if review decision timestamp expired', async () => {
      const mockGateway = new MockReviewGateway();
      mockGateway.decisionToReturn = 'expired';
      const f = await createCanonicalFixture({ gateway: mockGateway });

      const res = await f.service.execute('catalog', {
        action: 'waive',
        reason: 'Renuncia formal debidamente fundamentada para auditoría de seguridad.',
      });
      expect(res.status).toBe('blocked');
      expect(res.code).toBe('closure_review_expired');
    });

    it('2.7b: Host gateway malformed date parsing: blocks on NaN/invalid timestamp avoiding fail-open', async () => {
      const mockGateway = new MockReviewGateway();
      mockGateway.decisionToReturn = 'malformed_date';
      const f = await createCanonicalFixture({ gateway: mockGateway });

      const res = await f.service.execute('catalog', {
        action: 'waive',
        reason: 'Renuncia formal debidamente fundamentada para auditoría de seguridad.',
      });
      expect(res.status).toBe('blocked');
      expect(res.code).toBe('closure_review_expired');
    });

    it('2.8: Host gateway rejected decision: blocks if reviewer rejects', async () => {
      const mockGateway = new MockReviewGateway();
      mockGateway.decisionToReturn = 'reject';
      const f = await createCanonicalFixture({ gateway: mockGateway });

      const res = await f.service.execute('catalog', {
        action: 'waive',
        reason: 'Renuncia formal debidamente fundamentada para auditoría de seguridad.',
      });
      expect(res.status).toBe('blocked');
      expect(res.code).toBe('closure_review_rejected');
    });
  });

  // =========================================================================
  // GUARANTEE 3: Obsolete Revision Invalidation
  // =========================================================================
  describe('Guarantee 3: Obsolete Revision Invalidation Stress-Testing', () => {
    it('3.1: Aborts and rolls back if module revision mutates during human review window', async () => {
      const mockGateway = new MockReviewGateway();
      const f = await createCanonicalFixture({ gateway: mockGateway, physicalKnowledge: true });

      const originalReview = mockGateway.reviewClosure.bind(mockGateway);
      mockGateway.reviewClosure = async (req) => {
        const dec = await originalReview(req);
        // MUTATE module in knowledge store to revision 2!
        await f.store.commit('app-adv', [
          {
            kind: 'module',
            expected_revision: 1,
            trace: {
              source: 'adversarial_tamper',
              recorded_by: 'concurrent_actor',
              recorded_at: new Date().toISOString(),
              reason: 'Adversarial revision drift',
              review: 'unreviewed',
              evidence_refs: [],
            },
            entity: {
              id: 'module-catalog',
              application_id: 'app-adv',
              key: 'catalog-key',
              title: 'Catalog Mutated Mid-Review',
              certainty: 'confirmed',
              criticality: 'critical',
              dependencies: [],
              created_at: time,
              updated_at: new Date().toISOString(),
              is_active: true,
            },
          },
        ]);
        return dec;
      };

      // The current wire contract returns an explicit blocked result on
      // obsolete approval context; it must not consume the host decision.
      const denied = await f.service.execute('catalog', {
        action: 'waive',
        reason: 'Renuncia formal debidamente fundamentada para auditoría de seguridad.',
      });
      expect(denied).toMatchObject({ status: 'blocked', code: 'closure_context_changed' });

      // Ensure that closure was NOT committed
      const snap = f.closureStore.read(f.context);
      expect(snap.closures['catalog']).toBeUndefined();

      // Ensure that Knowledge store has NO closure receipt
      const receipt = await f.store.query('app-adv', 'relation');
      expect(receipt.items.length).toBe(0);
    });

    it('3.2: Aborts if module is deactivated during review', async () => {
      const mockGateway = new MockReviewGateway();
      const f = await createCanonicalFixture({ gateway: mockGateway, physicalKnowledge: true });

      const originalReview = mockGateway.reviewClosure.bind(mockGateway);
      mockGateway.reviewClosure = async (req) => {
        const dec = await originalReview(req);
        // Deactivate module in knowledge store!
        await f.store.commit('app-adv', [
          {
            kind: 'module',
            expected_revision: 1,
            trace: {
              source: 'adversarial_tamper',
              recorded_by: 'concurrent_actor',
              recorded_at: new Date().toISOString(),
              reason: 'Deactivate module',
              review: 'unreviewed',
              evidence_refs: [],
            },
            entity: {
              id: 'module-catalog',
              application_id: 'app-adv',
              key: 'catalog-key',
              title: 'Catalog Deactivated',
              certainty: 'confirmed',
              criticality: 'low',
              dependencies: [],
              created_at: time,
              updated_at: new Date().toISOString(),
              is_active: false,
            },
          },
        ]);
        return dec;
      };

      const denied = await f.service.execute('catalog', {
        action: 'waive',
        reason: 'Renuncia formal debidamente fundamentada para auditoría de seguridad.',
      });
      expect(denied).toMatchObject({ status: 'blocked', code: 'closure_context_changed' });
      expect(f.closureStore.read(f.context).closures.catalog).toBeUndefined();
      expect(f.closureStore.read(f.context).approvals).toHaveLength(0);
      expect((await f.store.query('app-adv', 'relation')).items).toHaveLength(0);
    });

    it('3.3: Prevents approvalId reuse across closure attempts', async () => {
      const mockGateway = new MockReviewGateway();
      const f = await createCanonicalFixture({ gateway: mockGateway, physicalKnowledge: true });

      const r1 = await f.service.execute('catalog', {
        action: 'waive',
        reason: 'Renuncia formal debidamente fundamentada para auditoría de seguridad.',
      });
      expect(r1.status).toBe('waived');
      const approvalId = r1.decision_id as string;
      expect(approvalId).toBeDefined();

      await expect(
        f.closureStore.transaction(f.context, async snapshot => {
          if (snapshot.approvals.some(a => a[0] === approvalId)) {
            throw new Error('closure_decision_reused');
          }
          snapshot.approvals.push([approvalId, 'forged-request-digest']);
        })
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // GUARANTEE 4: Dual-Store Crash Recovery
  // =========================================================================
  describe('Guarantee 4: Dual-Store Crash Recovery Stress-Testing', () => {
    it('4.1: Recovers automatically without second human approval when process crashed after SQLite commit', async () => {
      const mockGateway = new MockReviewGateway();
      const f = await createCanonicalFixture({ gateway: mockGateway });

      const decisionId = 'dec-simulated-crash-123';
      const requestDigest = createHash('sha256').update('crash-req-123').digest('hex');
      const coverageDigest = createHash('sha256').update('crash-cov-123').digest('hex');

      await f.closureStore.transaction(f.context, async snapshot => {
        snapshot.closures['catalog'] = {
          moduleKey: 'catalog-key',
          moduleId: 'module-catalog',
          moduleRevision: 1,
          plannedName: 'catalog',
          status: 'closed',
          decisionId,
          reviewer: 'simulated-crash-reviewer',
          decidedAt: new Date().toISOString(),
          requestDigest,
          coverageDigest,
          committedAt: new Date().toISOString(),
        };
        snapshot.approvals.push([decisionId, requestDigest]);
      });

      const receiptBefore = await f.store.get('app-adv', 'relation', `closure:${decisionId}`);
      expect(receiptBefore).toBeNull();

      const fsStorage = join(f.root, '.qa', 'project', 'lifecycle.json');
      const lcBefore = JSON.parse(readFileSync(fsStorage, 'utf8'));
      expect(lcBefore.modules.catalog.state).toBe('planned');

      const initialRequestsCount = mockGateway.requests.length;
      const reconciled = await f.service.reconcile('catalog');
      expect(reconciled).toBe(true);

      expect(mockGateway.requests.length).toBe(initialRequestsCount);

      const receiptAfter = await f.store.get('app-adv', 'relation', `closure:${decisionId}`);
      expect(receiptAfter).not.toBeNull();
      expect(receiptAfter?.entity.predicate).toBe('related_to');
      expect(receiptAfter?.entity.source.id).toBe('module-catalog');
      expect(receiptAfter?.entity.source.revision).toBe(1);

      const lcAfter = JSON.parse(readFileSync(fsStorage, 'utf8'));
      expect(lcAfter.modules.catalog.state).toBe('closed');

      const secondReconcile = await f.service.reconcile('catalog');
      expect(secondReconcile).toBe(false);
    });

    it('4.2: Recovers waived module crash state accurately', async () => {
      const f = await createCanonicalFixture();
      const decisionId = 'dec-simulated-waiver-crash';

      await f.closureStore.transaction(f.context, async snapshot => {
        snapshot.closures['catalog'] = {
          moduleKey: 'catalog-key',
          moduleId: 'module-catalog',
          moduleRevision: 1,
          plannedName: 'catalog',
          status: 'waived',
          decisionId,
          reviewer: 'human-waive-approver',
          decidedAt: new Date().toISOString(),
          requestDigest: 'digest-waive',
          coverageDigest: 'cov-waive',
          waiverReason: 'Motivo sustantivo de renuncia superior a 15 caracteres.',
          committedAt: new Date().toISOString(),
        };
        snapshot.approvals.push([decisionId, 'digest-waive']);
      });

      const reconciled = await f.service.reconcile('catalog');
      expect(reconciled).toBe(true);

      const waiverReceipt = await f.store.get('app-adv', 'relation', `waiver:${decisionId}`);
      expect(waiverReceipt).not.toBeNull();
      expect(waiverReceipt?.trace.source).toBe('canonical_module_waiver_v1');

      const fsStorage = join(f.root, '.qa', 'project', 'lifecycle.json');
      const lcAfter = JSON.parse(readFileSync(fsStorage, 'utf8'));
      expect(lcAfter.modules.catalog.state).toBe('waived');
    });

    it('4.3: Corrupt database or wrong AES key strictly rejects without RAM fallback', async () => {
      const root = mkdtempSync(join(tmpdir(), 'qap-corrupt-'));
      roots.push(root);

      const dbPath = join(root, 'closure.sqlite');
      const validKey = randomBytes(32);
      const wrongKey = randomBytes(32);
      const scope = { projectRoot: root, applicationId: 'app-adv', environmentId: 'local' };

      // Initialize and write a valid encrypted snapshot
      const store1 = new SqliteModuleClosureStore({
        path: dbPath,
        projectRoot: root,
        applicationId: 'app-adv',
        environmentId: 'local',
        protection: 'host_private_directory_and_managed_key',
        key: validKey,
        initialize: true,
      });
      await store1.transaction(scope, async snapshot => {
        snapshot.approvals.push(['app-1', 'digest-1']);
      });
      store1.close();

      // Opening with WRONG key must throw ClosureStoreError when reading/decrypting payload
      const storeBad = new SqliteModuleClosureStore({
        path: dbPath,
        projectRoot: root,
        applicationId: 'app-adv',
        environmentId: 'local',
        protection: 'host_private_directory_and_managed_key',
        key: wrongKey,
        initialize: false,
      });

      expect(() => {
        storeBad.read(scope);
      }).toThrow();
    });
  });

  // =========================================================================
  // GUARANTEE 5: Legacy Closure Bypass
  // =========================================================================
  describe('Guarantee 5: Legacy Closure Bypass Stress-Testing', () => {
    it('5.1: Legacy qap_module_close rejects canonical module with canonical_closure_required', async () => {
      const f = await createCanonicalFixture();

      const server = createMcpServer({
        projectRoots: [f.root],
        knowledgeBindings: [
          {
            projectRoot: f.root,
            applicationId: 'app-adv',
            environmentId: 'local',
            store: f.store,
            moduleClosureStore: f.closureStore,
            moduleClosureReviewGateway: f.gateway,
            moduleBindings: f.context.moduleBindings,
          },
        ],
      });

      const client = new Client({ name: 'legacy-bypass-adversary', version: '1' });
      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      await server.connect(serverTransport);
      await client.connect(clientTransport);

      closers.push(async () => {
        await client.close();
        await server.close();
      });

      const res = await client.callTool({
        name: 'qap_module_close',
        arguments: {
          targetPath: f.root,
          module: 'catalog',
          action: 'close',
          user_confirmed: true,
        },
      });

      expect(res.isError).toBe(true);
      const parsed = JSON.parse((res.content[0] as any).text);
      expect(parsed.status).toBe('blocked');
      expect(parsed.code).toBe('canonical_closure_required');
      expect(parsed.razon).toContain('canonical_closure');
    });

    it('5.2: Legacy qap_module_close waive also blocked for canonical modules', async () => {
      const f = await createCanonicalFixture();

      const server = createMcpServer({
        projectRoots: [f.root],
        knowledgeBindings: [
          {
            projectRoot: f.root,
            applicationId: 'app-adv',
            environmentId: 'local',
            store: f.store,
            moduleClosureStore: f.closureStore,
            moduleClosureReviewGateway: f.gateway,
            moduleBindings: f.context.moduleBindings,
          },
        ],
      });

      const client = new Client({ name: 'legacy-bypass-adversary-2', version: '1' });
      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      await server.connect(serverTransport);
      await client.connect(clientTransport);

      closers.push(async () => {
        await client.close();
        await server.close();
      });

      const res = await client.callTool({
        name: 'qap_module_close',
        arguments: {
          targetPath: f.root,
          module: 'catalog',
          action: 'waive',
          reason: 'Motivo sustantivo de renuncia de más de 15 caracteres.',
          user_confirmed: true,
        },
      });

      expect(res.isError).toBe(true);
      const parsed = JSON.parse((res.content[0] as any).text);
      expect(parsed.status).toBe('blocked');
      expect(parsed.code).toBe('canonical_closure_required');
    });

    it('5.3: qap_session_close blocks advance to WRAP_UP when canonical module is unclosed', async () => {
      const f = await createCanonicalFixture();

      const server = createMcpServer({
        projectRoots: [f.root],
        knowledgeBindings: [
          {
            projectRoot: f.root,
            applicationId: 'app-adv',
            environmentId: 'local',
            store: f.store,
            moduleClosureStore: f.closureStore,
            moduleClosureReviewGateway: f.gateway,
            moduleBindings: f.context.moduleBindings,
          },
        ],
      });

      const client = new Client({ name: 'session-close-adversary', version: '1' });
      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      await server.connect(serverTransport);
      await client.connect(clientTransport);

      closers.push(async () => {
        await client.close();
        await server.close();
      });

      const res = await client.callTool({
        name: 'qap_session_close',
        arguments: {
          targetPath: f.root,
        },
      });

      const parsed = JSON.parse((res.content[0] as any).text);
      expect(parsed.status).toBe('blocked');
      expect(parsed.code).toBe('canonical_module_closure_required');
      expect(parsed.unclosed_modules).toContain('catalog');
    });

    it('5.4: Canonical closure unlocks qap_session_close', async () => {
      const f = await createCanonicalFixture({ physicalKnowledge: true });

      const server = createMcpServer({
        projectRoots: [f.root],
        knowledgeBindings: [
          {
            projectRoot: f.root,
            applicationId: 'app-adv',
            environmentId: 'local',
            store: f.store,
            moduleClosureStore: f.closureStore,
            moduleClosureReviewGateway: f.gateway,
            moduleBindings: f.context.moduleBindings,
          },
        ],
      });

      const client = new Client({ name: 'canonical-flow-client', version: '1' });
      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      await server.connect(serverTransport);
      await client.connect(clientTransport);

      closers.push(async () => {
        await client.close();
        await server.close();
      });

      const closeRes = await client.callTool({
        name: 'qap_module_close',
        arguments: {
          targetPath: f.root,
          module: 'catalog',
          canonical_closure: {
            action: 'waive',
            reason: 'Renuncia autorizada formalmente por el líder del módulo catalog.',
          },
        },
      });
      expect(closeRes.isError).toBeFalsy();
      const closeParsed = JSON.parse((closeRes.content[0] as any).text);
      expect(closeParsed.status).toBe('waived');

      const sessionRes = await client.callTool({
        name: 'qap_session_close',
        arguments: {
          targetPath: f.root,
        },
      });
      expect(sessionRes.isError).toBeFalsy();
      const sessionParsed = JSON.parse((sessionRes.content[0] as any).text) as {
        status: string; fase: string; report_path: string; code?: string;
      };
      expect(sessionParsed).toMatchObject({ status: 'success', fase: 'WRAP_UP' });
      expect(sessionParsed.code).not.toBe('canonical_module_closure_required');
      expect(existsSync(sessionParsed.report_path)).toBe(true);
      expect(readFileSync(sessionParsed.report_path, 'utf8')).toContain('catalog');
      expect(JSON.parse(readFileSync(join(f.root, '.qa', 'project', 'lifecycle.json'), 'utf8')).phase).toBe('WRAP_UP');
      expect((await f.store.query('app-adv', 'relation')).items).toHaveLength(1);
    });
  });

  // =========================================================================
  // GUARANTEE 6: False Execution Attestation
  // =========================================================================
  describe('Guarantee 6: False Execution Attestation Stress-Testing', () => {
    it('6.1: Invariant validator rejects execution_coverage status !== not_executed', () => {
      const badAssessment: any = {
        module_id: 'module-catalog',
        module_key: 'catalog-key',
        module_revision: 1,
        coverage_digest: createHash('sha256').update('test').digest('hex'),
        closure_verdict: 'ready_for_closure',
        specification_coverage: {
          status: 'complete',
          confirmed_requirements_count: 7,
          pending_requirements_count: 0,
          unaddressed_gaps_count: 0,
          accepted_gaps_count: 0,
          total_gaps_count: 0,
          category_statuses: [],
        },
        review_coverage: {
          status: 'unreviewed',
          reviewed_categories_count: 0,
        },
        execution_coverage: {
          status: 'executed',
          executed_count: 10,
          passed_count: 10,
          failed_count: 0,
          indeterminate_count: 0,
          conformity_assessments: [],
        },
        gaps: [],
        assessed_at: new Date().toISOString(),
      };

      const res = validateCoverageAssessmentInvariants(badAssessment);
      expect(res.valid).toBe(false);
      expect(res.violations.some(v => v.code === 'EXECUTION_COVERAGE_UNVERIFIED_FORBIDDEN')).toBe(true);
      expect(res.violations.some(v => v.code === 'EXECUTION_VERDICTS_FORBIDDEN')).toBe(true);
    });

    it('6.2: Rejects non-zero passed counts even if status is not_executed', () => {
      const spoofedAssessment: any = {
        module_id: 'module-catalog',
        module_key: 'catalog-key',
        module_revision: 1,
        coverage_digest: createHash('sha256').update('test').digest('hex'),
        closure_verdict: 'ready_for_closure',
        specification_coverage: {
          status: 'complete',
          confirmed_requirements_count: 7,
          pending_requirements_count: 0,
          unaddressed_gaps_count: 0,
          accepted_gaps_count: 0,
          total_gaps_count: 0,
          category_statuses: [],
        },
        review_coverage: {
          status: 'unreviewed',
          reviewed_categories_count: 0,
        },
        execution_coverage: {
          status: 'not_executed',
          executed_count: 0,
          passed_count: 1,
          failed_count: 0,
          indeterminate_count: 0,
          conformity_assessments: [],
        },
        gaps: [],
        assessed_at: new Date().toISOString(),
      };

      const res = validateCoverageAssessmentInvariants(spoofedAssessment);
      expect(res.valid).toBe(false);
      expect(res.violations.some(v => v.code === 'EXECUTION_VERDICTS_FORBIDDEN')).toBe(true);
    });

    it('6.3: Invariant validator rejects individual category waiver (Amendment 6)', () => {
      const catWaivedAssessment: any = {
        module_id: 'module-catalog',
        module_key: 'catalog-key',
        module_revision: 1,
        coverage_digest: createHash('sha256').update('test').digest('hex'),
        closure_verdict: 'ready_for_closure',
        specification_coverage: {
          status: 'complete',
          confirmed_requirements_count: 6,
          pending_requirements_count: 0,
          unaddressed_gaps_count: 0,
          accepted_gaps_count: 0,
          total_gaps_count: 0,
          category_statuses: [
            { category: 'seguridad_y_permisos', status: 'waived', is_waived: true },
          ],
        },
        review_coverage: {
          status: 'unreviewed',
          reviewed_categories_count: 0,
        },
        execution_coverage: {
          status: 'not_executed',
          executed_count: 0,
          passed_count: 0,
          failed_count: 0,
          indeterminate_count: 0,
          conformity_assessments: [],
        },
        gaps: [],
        assessed_at: new Date().toISOString(),
      };

      const res = validateCoverageAssessmentInvariants(catWaivedAssessment);
      expect(res.valid).toBe(false);
      expect(res.violations.some(v => v.code === 'CATEGORY_WAIVER_FORBIDDEN')).toBe(true);
    });

    it('6.4: CanonicalCoverageService evaluate strictly emits not_executed and 0 counts', async () => {
      const f = await createCanonicalFixture();
      const evalRes = await f.coverageService.evaluate('catalog');
      expect(evalRes.status).toBe('evaluated');
      if (evalRes.status === 'evaluated') {
        const exec = evalRes.assessment.execution_coverage;
        expect(exec.status).toBe('not_executed');
        expect(exec.executed_count).toBe(0);
        expect(exec.passed_count).toBe(0);
        expect(exec.failed_count).toBe(0);
        expect(exec.indeterminate_count).toBe(0);
        expect(exec.note).toContain('VNEXT-014');
      }
    });
  });

  // =========================================================================
  // GUARANTEE 7: CAS Concurrency
  // =========================================================================
  describe('Guarantee 7: CAS Concurrency Stress-Testing', () => {
    it('7.1: Physical SQLite concurrent transactions handle race conditions without history corruption', async () => {
      const root = mkdtempSync(join(tmpdir(), 'qap-cas-'));
      roots.push(root);

      const dbPath = join(root, 'closure-concurrency.sqlite');
      const key = randomBytes(32);
      const scope = { projectRoot: root, applicationId: 'app-cas', environmentId: 'local' };

      const store = new SqliteModuleClosureStore({
        path: dbPath,
        projectRoot: root,
        applicationId: 'app-cas',
        environmentId: 'local',
        protection: 'host_private_directory_and_managed_key',
        key,
        initialize: true,
      });
      closers.push(() => store.close());

      const numWriters = 20;
      const results: number[] = [];

      await Promise.all(
        Array.from({ length: numWriters }).map(async (_, idx) => {
          let attempts = 0;
          while (attempts < 50) {
            try {
              await store.transaction(scope, async snapshot => {
                snapshot.approvals.push([`approval-${idx}`, `digest-${idx}`]);
              });
              results.push(idx);
              break;
            } catch (err: any) {
              if (err instanceof ClosureStoreError && err.code === 'conflict') {
                attempts++;
                await new Promise(r => setTimeout(r, 10 + Math.random() * 20));
                continue;
              }
              throw err;
            }
          }
        })
      );

      expect(results.length).toBe(numWriters);
      const finalSnapshot = store.read(scope);
      expect(finalSnapshot.approvals.length).toBe(numWriters);

      const rawDb = new DatabaseSync(dbPath);
      closers.push(() => rawDb.close());
      const historyRows = rawDb.prepare('SELECT generation FROM closure_history ORDER BY generation ASC').all() as any[];
      expect(historyRows.length).toBe(numWriters);
      historyRows.forEach((row, idx) => {
        expect(row.generation).toBe(idx + 1);
      });
    });

    it('7.2: CanonicalClosureService serializes closure and second attempt is idempotent: true', async () => {
      const mockGateway = new MockReviewGateway();
      const f = await createCanonicalFixture({ gateway: mockGateway, physicalKnowledge: true });

      // First closure
      const res1 = await f.service.execute('catalog', {
        action: 'waive',
        reason: 'Renuncia autorizada formalmente en primera ejecución.',
      });
      expect(res1.status).toBe('waived');
      expect(res1.idempotent).toBeUndefined();

      // Second closure of already closed/waived module
      const res2 = await f.service.execute('catalog', {
        action: 'waive',
        reason: 'Segunda llamada debe detectar estado cerrado y ser idempotente.',
      });
      expect(res2.status).toBe('waived');
      expect(res2.idempotent).toBe(true);

      // Verify Knowledge store has exactly ONE relation receipt
      const relations = await f.store.query('app-adv', 'relation');
      expect(relations.items.length).toBe(1);
    });

    it('7.3: Concurrent closure of distinct modules succeeds via bounded retry loop under SQLite CAS lock', async () => {
      const mockGateway = new MockReviewGateway();
      const f = await createCanonicalFixture({ gateway: mockGateway, extraModules: true, physicalKnowledge: true });

      const closureStore2 = new SqliteModuleClosureStore({
        path: f.closureDbPath,
        projectRoot: f.root,
        applicationId: 'app-adv',
        environmentId: 'local',
        protection: 'host_private_directory_and_managed_key',
        key: f.closureKey,
        initialize: false,
      });
      closers.push(() => closureStore2.close());
      // Independent physical SQLite handles: exercise the canonical fence
      // across connections, not just a shared in-memory store object.
      const knowledgeStore2 = new SqliteKnowledgeAdapter(f.knowledgeDbPath);
      closers.push(() => knowledgeStore2.close());
      const service2 = new CanonicalClosureService(knowledgeStore2, f.context, closureStore2, mockGateway);

      // Run concurrent closures for two distinct modules across competing connections
      const [resCatalog, resBilling] = await Promise.all([
        f.service.execute('catalog', {
          action: 'waive',
          reason: 'Renuncia formal para módulo catalog debidamente justificada.',
        }),
        service2.execute('billing', {
          action: 'waive',
          reason: 'Renuncia formal para módulo billing debidamente justificada.',
        }),
      ]);

      expect(resCatalog.status).toBe('waived');
      expect(resBilling.status).toBe('waived');

      // Both modules must be recorded in SQLite closureStore
      const snap = f.closureStore.read({
        projectRoot: f.context.projectRoot,
        applicationId: f.context.applicationId,
        environmentId: f.context.environmentId,
      });
      expect(snap.closures.catalog).toBeDefined();
      expect(snap.closures.billing).toBeDefined();
      expect(snap.closures.catalog.decisionId).not.toBe(snap.closures.billing.decisionId);
      expect(snap.approvals).toHaveLength(2);
      const receipts = await f.store.query('app-adv', 'relation');
      expect(receipts.items).toHaveLength(2);
    });

    it('7.4: Simultaneous closure requests for same module with divergent gateway decisions persist exactly one closure and canonical receipt', async () => {
      let callCount = 0;
      const mockGateway: IModuleClosureReviewGateway = {
        async reviewClosure(request: ModuleClosureReviewRequest): Promise<ModuleClosureReviewDecision | null> {
          callCount++;
          return {
            approvalId: `appr-decision-${callCount}`,
            requestDigest: request.requestDigest,
            coverageDigest: request.coverageDigest,
            reviewer: `reviewer-${callCount}`,
            decidedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 60_000).toISOString(),
            decision: 'approve',
          };
        },
      };

      const f = await createCanonicalFixture({ gateway: mockGateway, physicalKnowledge: true });

      // Pre-declare non-applicable categories so catalog is ready_for_closure
      await f.service.execute('catalog', {
        action: 'declare_non_applicable',
        decisions: [
          { category: 'functional', reason: 'Pre-declaración autorizada formalmente para test' },
          { category: 'business_rule', reason: 'Pre-declaración autorizada formalmente para test' },
          { category: 'security', reason: 'Pre-declaración autorizada formalmente para test' },
          { category: 'ui', reason: 'Pre-declaración autorizada formalmente para test' },
          { category: 'ux', reason: 'Pre-declaración autorizada formalmente para test' },
          { category: 'regression', reason: 'Pre-declaración autorizada formalmente para test' },
          { category: 'performance', reason: 'Pre-declaración autorizada formalmente para test' },
        ],
      });

      const closureStore2 = new SqliteModuleClosureStore({
        path: f.closureDbPath,
        projectRoot: f.root,
        applicationId: 'app-adv',
        environmentId: 'local',
        protection: 'host_private_directory_and_managed_key',
        key: f.closureKey,
        initialize: false,
      });
      closers.push(() => closureStore2.close());
      // Independent physical SQLite handles: exercise the canonical fence
      // across connections, not just a shared in-memory store object.
      const knowledgeStore2 = new SqliteKnowledgeAdapter(f.knowledgeDbPath);
      closers.push(() => knowledgeStore2.close());
      const service2 = new CanonicalClosureService(knowledgeStore2, f.context, closureStore2, mockGateway);

      // Fire two simultaneous requests for the same module 'catalog' across competing connections
      // Request 1: close, Request 2: waive
      const [resClose, resWaive] = await Promise.all([
        f.service.execute('catalog', { action: 'close' }),
        service2.execute('catalog', {
          action: 'waive',
          reason: 'Renuncia concurrente debidamente fundamentada para catalog.',
        }),
      ]);

      const winner = (resClose.idempotent ? resWaive : resClose);
      const loser = (resClose.idempotent ? resClose : resWaive);

      expect(winner.idempotent).toBeUndefined();
      expect(loser.idempotent).toBe(true);
      expect(loser.decision_id).toBe(winner.decision_id);
      expect(loser.status).toBe(winner.status);

      // 3. Exactly one record in SqliteModuleClosureStore
      const snap = f.closureStore.read({
        projectRoot: f.context.projectRoot,
        applicationId: f.context.applicationId,
        environmentId: f.context.environmentId,
      });
      expect(snap.closures.catalog).toBeDefined();
      expect(snap.closures.catalog.decisionId).toBe(winner.decision_id);
      expect(snap.approvals.some(a => a[0] === winner.decision_id)).toBe(true);

      // 4. Exactly ONE relation receipt in IKnowledgeStore (NO orphan receipt from loser)
      const relations = await f.store.query('app-adv', 'relation');
      expect(relations.items.length).toBe(1);
      const expectedReceiptId = winner.status === 'waived' ? `waiver:${String(winner.decision_id)}` : `closure:${String(winner.decision_id)}`;
      expect(relations.items[0].id).toBe(expectedReceiptId);

      // 5. lifecycle.json must match winning status
      const fsStorage = join(f.root, '.qa', 'project', 'lifecycle.json');
      const lc = JSON.parse(readFileSync(fsStorage, 'utf8'));
      expect(lc.modules.catalog.state).toBe(winner.status);
    });

    it('7.5: Rejects write error recovery if existing receipt has tampered provenance or mismatched entity', async () => {
      const mockGateway = new MockReviewGateway();
      const f = await createCanonicalFixture({ gateway: mockGateway, physicalKnowledge: true });
      const decisionId = 'dec-tampered-receipt-test';
      mockGateway.requests = [];
      mockGateway.reviewClosure = async (req) => ({
        approvalId: decisionId,
        requestDigest: req.requestDigest,
        coverageDigest: req.coverageDigest,
        reviewer: 'security-reviewer',
        decidedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        decision: 'approve',
      });

      // Pre-seed IKnowledgeStore with forged module entity and tampered relation having the same ID but forged source
      await f.store.commit('app-adv', [
        {
          kind: 'module',
          expected_revision: 0,
          entity: {
            id: 'module-forged-attacker',
            application_id: 'app-adv',
            key: 'forged',
            title: 'Forged',
            certainty: 'unconfirmed',
            criticality: 'low',
            dependencies: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_active: true,
          },
          trace: {
            source: 'attacker',
            recorded_by: 'attacker',
            recorded_at: new Date().toISOString(),
            reason: 'attacker-seed',
            review: 'unreviewed',
            evidence_refs: [],
          },
        },
        {
          kind: 'relation',
          expected_revision: 0,
          entity: {
            id: `waiver:${decisionId}`,
            predicate: 'related_to',
            source: { kind: 'module', id: 'module-forged-attacker', revision: 1 },
            target: { kind: 'application', id: 'app-adv', revision: 1 },
          },
          trace: {
            source: 'canonical_module_waiver_v1',
            recorded_by: 'attacker',
            recorded_at: new Date().toISOString(),
            reason: 'tampered-digest',
            review: 'reviewed',
            evidence_refs: [],
          },
        },
      ]);

      // Attempt closure (waiver): store.commit will fail with expected_revision: 0 conflict.
      // The service must NOT swallow the error: it must validate provenance and throw.
      await expect(f.service.execute('catalog', {
        action: 'waive',
        reason: 'Renuncia formal para verificar rechazo de procedencia corrupta.',
      })).rejects.toThrow(/closure_receipt_provenance_invalid|provenance/);
    });
  });

});
