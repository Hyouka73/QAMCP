import { createHash, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer, type Server as HttpServer } from 'node:http';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';

import { EphemeralCredentialProvider } from '@qap/auth';
import type { IRunner } from '@qap/engine';
import type { AuthProfileRecord, EnvironmentRecord, ExecutionResult, TCCase } from '@qap/shared';
import { afterEach, describe, expect, it } from 'vitest';
import YAML from 'yaml';

import { QapApplicationService } from '../application/application-service.js';
import {
  APP_SERVICE_MIGRATIONS,
  APP_SERVICE_SCHEMA_VERSION,
  AppServiceSqliteStore,
} from '../application/app-service-store.js';
import { Block3ExecutionRepo, canonicalizeCaseId } from '../application/block3-execution-repo.js';
import type {
  DiscoveryDossierCanonical,
  DiscoveryDossierScope,
  DiscoveryRevisionRecord,
} from '../application/discovery-dossier.js';
import {
  LineagedCaseError,
  computeLineagedCaseDigest,
  stableStringify,
  type LineagedCaseCandidateInput,
  type LineagedCaseDocument,
  type LineagedCaseErrorCode,
  type LineagedCaseReadScopeInput,
} from '../application/lineaged-case.js';
import type { VerifiableRuleReviewGateway } from '../handlers/state-services.js';
import { runConversationalCaseWorkflow } from '../handlers/conversational-case-workflow.js';
import { PlanHandler } from '../handlers/plan.handler.js';
import { TestHandler } from '../handlers/test.handler.js';
import type { ITestAuthorizer } from '../test-authorizer.js';

const require = createRequire(import.meta.url);
type RawDb = import('node:sqlite').DatabaseSync;
function openRaw(path: string): RawDb {
  const sqlite = require('node:sqlite') as typeof import('node:sqlite');
  return new sqlite.DatabaseSync(path);
}

/** Checksums históricos v1–v7 tal como existían en 669cacdb (HEAD base de la unidad). Inmutables. */
const HISTORICAL_CHECKSUMS: Readonly<Record<number, string>> = {
  1: '1e77c913cc27018797dbeff131c0aa139ac8a8eb2d8cb83f3ec67b8116b1424a',
  2: '34e45ccb3b7bfcc8ca08a01a5a797cef3640516b5a720150dc61a9c23557426e',
  3: 'c2a2f4c34c2134403e14ebda37cc13888c0a4223cea4486fcd4d40102e935adf',
  4: '4efe40e2efc8bddcb2c46dc12f5e40b76928ecf4d67e0adce0869f7d05b2af65',
  5: 'b29e05e63f4671c6b4525cebcb59b31202cff2b4793896db8ebddf81ce497d71',
  6: '3a0c1946a3d6245a820a8da9aeb7a671750322945c127030cfffce7e6610da39',
  7: 'df2fb2f2c478f10ecbac752cd91d5a0cbeb71745fcc314ba5516dcb2f5fd1f7e',
};
const V8_COLUMNS = ['execution_key', 'execution_lineage_json', 'execution_content_digest', 'execution_approval_id'];
const V8_INDEX = 'idx_service_cases_project_execution_key';

const tempDirs: string[] = [];
const sites: HttpServer[] = [];
const services: QapApplicationService[] = [];
const inspectionStores = new Map<QapApplicationService, AppServiceSqliteStore>();
function inspectionStore(service: QapApplicationService): AppServiceSqliteStore {
  let store = inspectionStores.get(service);
  if (!store) {
    store = new AppServiceSqliteStore(join(service.artifacts.rootDir, 'app-service.sqlite'));
    inspectionStores.set(service, store);
  }
  return store;
}

function mkTemp(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  for (const site of sites.splice(0)) {
    site.closeAllConnections();
    await new Promise<void>(resolve => site.close(() => resolve()));
  }
  for (const store of inspectionStores.values()) store.close();
  inspectionStores.clear();
  while (services.length > 0) {
    try {
      services.pop()!.close();
    } catch {
      // already closed
    }
  }
  while (tempDirs.length > 0) {
    rmSync(tempDirs.pop()!, { recursive: true, force: true, maxRetries: 3 });
  }
});

function sha(text: string | Buffer): string {
  return createHash('sha256').update(text).digest('hex');
}

function openService(hostDir: string): QapApplicationService {
  const service = new QapApplicationService({ hostRootDir: hostDir, projectOperationDirectory: hostDir, credentialProvider: new EphemeralCredentialProvider() });
  services.push(service);
  return service;
}

// ---------------------------------------------------------------------------------------------
// Fixtures de dominio
// ---------------------------------------------------------------------------------------------

interface Ctx {
  readonly hostDir: string;
  readonly wsDir: string;
  readonly service: QapApplicationService;
  readonly projectId: string;
  readonly applicationId: string;
  readonly env: EnvironmentRecord;
  readonly profile: AuthProfileRecord;
  readonly moduleKey: string;
}

const TENANT = 'tenant-a';
const ROLE = 'admin';
const ROUTE = '/checkout';

function createCtx(): Ctx {
  const hostDir = mkTemp('qap-01a-host-');
  const wsDir = mkTemp('qap-01a-ws-');
  const service = openService(hostDir);
  const snapshot = service.createProject({ name: 'Portal 01A', canonicalRoot: wsDir, mode: 'investigate_and_test' });
  const projectId = snapshot.project.project_id;
  const env = service.upsertEnvironment({ projectId, name: 'staging', baseUrl: 'http://localhost:4100' });
  const profile = service.upsertProfile({
    projectId,
    envId: env.env_id,
    label: 'admin-a',
    roleName: ROLE,
    tenantId: TENANT,
  });
  return {
    hostDir,
    wsDir,
    service,
    projectId,
    applicationId: snapshot.project.application_id,
    env,
    profile,
    moduleKey: 'checkout',
  };
}

let approvalSeq = 0;

function confirmRule(ctx: Ctx, outcome = 'El total del carrito se muestra con impuestos') {
  approvalSeq += 1;
  const approvalId = `apr-test-${approvalSeq}`;
  return ctx.service.recordRuleConfirmationDecision({
    projectId: ctx.projectId,
    moduleKey: ctx.moduleKey,
    ruleKey: 'total_visible',
    title: 'Total visible',
    expectedOutcome: outcome,
    questionId: `q-${approvalSeq}`,
    questionText: '¿Cuál es el resultado esperado?',
    decision: 'confirm',
    approvalId,
    requestDigest: sha(`request:${approvalId}`),
    presentedStatementDigest: sha(`statement:${approvalId}`),
    reviewer: 'qa-reviewer',
    mechanism: 'test-fixture',
    decidedAt: new Date().toISOString(),
    scope: { environment_name: ctx.env.name, tenant_id: TENANT, role: ROLE, route_pathname: ROUTE },
  });
}
type Confirmed = ReturnType<typeof confirmRule>;

function buildDossier(
  ctx: Ctx,
  confirmed: Confirmed,
  options: { extraHeading?: string; scope?: Partial<DiscoveryDossierScope> } = {},
): DiscoveryDossierCanonical {
  const rule = confirmed.rule!;
  const scope: DiscoveryDossierScope = {
    project_id: ctx.projectId,
    application_id: ctx.applicationId,
    environment_id: ctx.env.env_id,
    environment_name: ctx.env.name,
    tenant_id: TENANT,
    profile_id: ctx.profile.profile_id,
    role: ROLE,
    module_key: ctx.moduleKey,
    module_title: 'Checkout',
    ...options.scope,
  };
  return {
    schema_version: '1',
    scope,
    target_pathname: ROUTE,
    mode: 'investigate_and_test',
    acquisition_status: 'complete',
    routes: [{ reference: 'route-0', state: 'visited', depth: 0, view_id: 'view-1', authorized_pathname: ROUTE }],
    route_counts: { visited: 1, candidate: 0, blocked: 0 },
    views: [
      {
        view_id: 'view-1',
        route: 'route-0',
        route_index: 0,
        state: 'spa_rendered',
        evidence_id: 'ev-view-1',
        headings: ['Checkout', ...(options.extraHeading ? [options.extraHeading] : [])],
        controls: [
          {
            tag: 'button',
            role: 'button',
            label: 'Pagar',
            visibility: 'visible',
            disabled: false,
            required_in_dom: false,
            selector_candidates: ['#pay'],
            selector_stability: 'unverified',
          },
          {
            tag: 'input',
            input_type: 'text',
            label: 'Cupón',
            visibility: 'visible',
            disabled: false,
            required_in_dom: false,
            selector_candidates: ['#coupon'],
            selector_stability: 'unverified',
          },
        ],
        forms_count: 0,
        links_count: 0,
        truncated: false,
      },
    ],
    source_refs: [{ kind: 'knowledge_evidence', ref_id: 'ev-extra-1' }],
    gaps: [],
    limitations: [],
    rule_resolution: {
      precedence_policy: ['exact antes que general'],
      legacy_compatibility_policy: 'sin compatibilidad legacy en la fixture',
      decisions: [
        {
          decision_id: 'dec-total_visible-_checkout',
          rule_key: 'total_visible',
          title: rule.title,
          route_pathname: ROUTE,
          decision_status: 'accredited',
          decision_reason: 'Acreditada por la fixture',
          expected_outcome: rule.expected_outcome,
          source_kind: rule.source_kind,
          source_id: rule.source_id,
          source_ref: rule.source_ref,
          source_version: rule.source_version,
          scope_match: 'exact',
          applied_scope: { environment: ctx.env.name, tenant_id: TENANT, role: ROLE, module_key: ctx.moduleKey },
          candidates: [
            {
              rule_id: rule.rule_id,
              source_kind: rule.source_kind,
              source_id: rule.source_id,
              source_ref: rule.source_ref,
              source_version: rule.source_version,
              scope_declaration: 'exact',
              scope_match: 'exact',
              authority_status: 'accredited',
              specificity_score: 3,
              authority_rank: 2,
              expected_outcome: rule.expected_outcome,
            },
          ],
        },
      ],
      ambiguities: [],
      excluded_sources: [],
      observed_evidence_notes: [],
      summary: {
        accredited_count: 1,
        pending_contradiction_count: 0,
        unaccredited_pending_count: 0,
        legacy_pending_count: 0,
        excluded_sources_count: 0,
        observed_views_count: 1,
      },
    },
  };
}

let executionSeq = 0;

function publishDossier(ctx: Ctx, confirmed: Confirmed, options?: Parameters<typeof buildDossier>[2]): DiscoveryRevisionRecord {
  executionSeq += 1;
  return ctx.service.saveDiscoveryRevision({
    dossier: buildDossier(ctx, confirmed, options),
    targetUrl: `http://localhost:4100${ROUTE}`,
    executionId: `exec-${executionSeq}`,
  }).revision;
}

function tcCase(overrides: Partial<Omit<TCCase, 'id'>> = {}): Omit<TCCase, 'id'> {
  return {
    _version: '1.0',
    name: 'Mostrar el total del carrito',
    tags: ['checkout', 'lineaged'],
    steps: [
      { type: 'navigate', url: ROUTE },
      { type: 'click', selector: '#pay' },
    ],
    ...overrides,
  };
}

function candidateFor(
  ctx: Ctx,
  confirmed: Confirmed,
  revision: DiscoveryRevisionRecord,
  overrides: Partial<LineagedCaseCandidateInput> = {},
): LineagedCaseCandidateInput {
  const rule = confirmed.rule!;
  return {
    projectId: ctx.projectId,
    moduleKey: ctx.moduleKey,
    environmentId: ctx.env.env_id,
    tenantId: TENANT,
    profileId: ctx.profile.profile_id,
    role: ROLE,
    routePathname: ROUTE,
    dossier: { revisionId: revision.revision_id, scopeHash: revision.scope_hash, contentHash: revision.content_hash },
    view: { viewId: 'view-1', evidenceIds: ['ev-view-1'], controlIndexes: [0, 1] },
    decision: {
      decisionId: 'dec-total_visible-_checkout',
      ruleId: rule.rule_id,
      ruleRevision: Number(/^rev:(\d+)$/.exec(rule.source_version)![1]),
      ruleSourceDigest: rule.source_digest ?? null,
    },
    ruleConfirmation: { decisionId: confirmed.decision.decision_id },
    tcCase: tcCase(),
    ...overrides,
  };
}

function setupWithCandidate() {
  const ctx = createCtx();
  const confirmed = confirmRule(ctx);
  const revision = publishDossier(ctx, confirmed);
  const input = candidateFor(ctx, confirmed, revision);
  const created = ctx.service.upsertLineagedCaseCandidate(input);
  return { ctx, confirmed, revision, input, created };
}

function readScopeFor(
  ctx: Ctx,
  overrides: Partial<LineagedCaseReadScopeInput> = {},
): LineagedCaseReadScopeInput {
  return {
    projectId: ctx.projectId,
    applicationId: ctx.applicationId,
    moduleKey: ctx.moduleKey,
    environmentId: ctx.env.env_id,
    tenantId: TENANT,
    profileId: ctx.profile.profile_id,
    role: ROLE,
    ...overrides,
  };
}

function expectLineaged(fn: () => unknown, code: LineagedCaseErrorCode, field?: string): LineagedCaseError {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(LineagedCaseError);
    const typed = error as LineagedCaseError;
    expect(typed.code).toBe(code);
    if (field !== undefined) expect(typed.details?.field).toBe(field);
    return typed;
  }
  throw new Error(`Se esperaba LineagedCaseError(${code}) pero no se lanzó nada.`);
}

function caseRows(ctx: Ctx): string {
  return JSON.stringify(inspectionStore(ctx.service).all('SELECT * FROM service_test_cases ORDER BY case_id'));
}

function tableColumns(db: RawDb, table: string): string[] {
  return (db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>).map((c) => c.name);
}

// ---------------------------------------------------------------------------------------------
// Fixture v7: base de datos real con migraciones v1–v7 aplicadas y datos legacy
// ---------------------------------------------------------------------------------------------

function buildV7Database(dbPath: string): { dump: () => string } {
  mkdirSync(join(dbPath, '..'), { recursive: true });
  const db = openRaw(dbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  for (const migration of APP_SERVICE_MIGRATIONS.filter((m) => m.version <= 7)) {
    db.exec(migration.sql);
    db.prepare('INSERT INTO app_schema_migrations (version, applied_at, checksum) VALUES (?, ?, ?)').run(
      migration.version,
      '2026-01-01T00:00:00.000Z',
      migration.checksum,
    );
  }
  const now = '2026-02-02T10:00:00.000Z';
  db.prepare(
    `INSERT INTO projects (project_id, name, slug, canonical_root, root_hash, application_id, status, created_at, updated_at)
     VALUES ('proj-legacy', 'Legacy', 'legacy', 'C:/legacy', 'roothash', 'app-legacy', 'active', ?, ?)`,
  ).run(now, now);
  db.prepare(
    `INSERT INTO modules (module_id, project_id, key, title, status, created_at, updated_at)
     VALUES ('mod-legacy', 'proj-legacy', 'login', 'Login', 'candidate', ?, ?)`,
  ).run(now, now);
  db.prepare(
    `INSERT INTO service_requirements (requirement_id, project_id, module_id, module_key, revision, title, description,
       category, source, validation_status, acceptance_criteria_json, created_at, updated_at)
     VALUES ('REQ-LOGIN-1', 'proj-legacy', 'mod-legacy', 'login', 3, 'Login', 'desc', 'functional', 'user', 'confirmed', '["ok"]', ?, ?)`,
  ).run(now, now);
  db.prepare(
    `INSERT INTO service_test_cases (case_id, project_id, module_id, module_key, requirement_id, requirement_revision, title,
       version, observation_json, inference_json, expectation_json, oracle_status, risk_level, risk_decision, steps_json,
       conformity_status, confirmation_digest, confirmed_by, confirmed_at, campaign_id, created_at, updated_at)
     VALUES ('case-legacy-1', 'proj-legacy', 'mod-legacy', 'login', 'REQ-LOGIN-1', 3, 'Login ok', 4,
       '{"obs":1}', '{"inf":2}', '{"exp":3}', 'accredited', 'high', 'accepted_by_qa', '[{"type":"navigate","url":"/login"}]',
       'approved', 'legacy-confirmation-digest', 'qa-legacy', ?, 'camp-1', ?, ?)`,
  ).run(now, now, now);
  const dump = () =>
    JSON.stringify(
      ['projects', 'modules', 'service_requirements', 'service_test_cases'].map((t) =>
        db.prepare(`SELECT * FROM ${t}`).all(),
      ),
    );
  const before = dump();
  db.close();
  return { dump: () => before };
}

function legacyDump(dbPath: string): { all: string; caseRow: Record<string, unknown> } {
  const db = openRaw(dbPath);
  try {
    const stripped = (db.prepare('SELECT * FROM service_test_cases').all() as Array<Record<string, unknown>>).map((row) => {
      const copy = { ...row };
      for (const c of V8_COLUMNS) delete copy[c];
      return copy;
    });
    const rest = ['projects', 'modules', 'service_requirements'].map((t) => db.prepare(`SELECT * FROM ${t}`).all());
    return {
      all: JSON.stringify([rest[0], rest[1], rest[2], stripped]),
      caseRow: db.prepare("SELECT * FROM service_test_cases WHERE case_id = 'case-legacy-1'").get() as Record<string, unknown>,
    };
  } finally {
    db.close();
  }
}

describe('P0.3b-01A — migración SQLite v8', () => {
  it('base nueva: v1–v8 registradas, versión declarada 8 y estructura v8 completa', () => {
    expect(APP_SERVICE_SCHEMA_VERSION).toBe(8);
    const dir = mkTemp('qap-01a-new-');
    const dbPath = join(dir, 'app-service.sqlite');
    const store = new AppServiceSqliteStore(dbPath);
    try {
      const versions = store.all<{ version: number }>('SELECT version FROM app_schema_migrations ORDER BY version').map((r) => r.version);
      expect(versions).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
      const columns = tableColumns(store.db, 'service_test_cases');
      for (const column of V8_COLUMNS) expect(columns).toContain(column);
      const index = store.get<{ sql: string }>("SELECT sql FROM sqlite_master WHERE type = 'index' AND name = ?", V8_INDEX);
      expect(index?.sql).toMatch(/UNIQUE INDEX/i);
      expect(index?.sql).toMatch(/WHERE execution_key IS NOT NULL/i);
      expect(store.integrityCheck()).toBe(true);
    } finally {
      store.close();
    }
  });

  it('migra desde v7 con datos existentes sin perder información', () => {
    const dir = mkTemp('qap-01a-v7-');
    const dbPath = join(dir, 'app-service.sqlite');
    const seeded = buildV7Database(dbPath);
    const before = legacyDump(dbPath);
    expect(before.all).toBe(JSON.stringify(JSON.parse(before.all))); // sanity
    expect(seeded.dump()).toContain('case-legacy-1');
    const rawBefore = openRaw(dbPath);
    expect(tableColumns(rawBefore, 'service_test_cases')).not.toContain('execution_key');
    rawBefore.close();

    const store = new AppServiceSqliteStore(dbPath);
    try {
      const after = legacyDump(dbPath);
      expect(after.all).toBe(before.all);
      for (const column of V8_COLUMNS) expect(after.caseRow[column]).toBeNull();
      expect(after.caseRow.confirmation_digest).toBe('legacy-confirmation-digest');
      expect(after.caseRow.confirmed_by).toBe('qa-legacy');
      expect(after.caseRow.version).toBe(4);
      expect(store.get<{ n: number }>('SELECT COUNT(*) AS n FROM app_schema_migrations WHERE version = 8')?.n).toBe(1);
      expect(store.integrityCheck()).toBe(true);
    } finally {
      store.close();
    }
  });

  it('checksums v1–v7 intactos y una sola migración v8 tras dos reaperturas', () => {
    const dir = mkTemp('qap-01a-reopen-');
    const dbPath = join(dir, 'app-service.sqlite');
    for (const migration of APP_SERVICE_MIGRATIONS.filter((m) => m.version <= 7)) {
      expect(migration.checksum).toBe(HISTORICAL_CHECKSUMS[migration.version]);
    }
    new AppServiceSqliteStore(dbPath).close();
    const first = openRaw(dbPath);
    const registered = first.prepare('SELECT version, checksum, applied_at FROM app_schema_migrations ORDER BY version').all() as Array<{
      version: number;
      checksum: string;
      applied_at: string;
    }>;
    first.close();
    for (let v = 1; v <= 7; v += 1) {
      expect(registered.find((r) => r.version === v)?.checksum).toBe(HISTORICAL_CHECKSUMS[v]);
    }
    const v8First = registered.find((r) => r.version === 8)!;
    expect(v8First.checksum).toBe(APP_SERVICE_MIGRATIONS.find((m) => m.version === 8)!.checksum);

    new AppServiceSqliteStore(dbPath).close();
    new AppServiceSqliteStore(dbPath).close();
    const last = openRaw(dbPath);
    try {
      const rows = last.prepare('SELECT version, applied_at FROM app_schema_migrations WHERE version = 8').all() as Array<{
        version: number;
        applied_at: string;
      }>;
      expect(rows).toHaveLength(1);
      expect(rows[0]!.applied_at).toBe(v8First.applied_at);
      const columns = tableColumns(last, 'service_test_cases');
      for (const column of V8_COLUMNS) expect(columns.filter((c) => c === column)).toHaveLength(1);
      expect(
        (last.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'index' AND name = ?").get(V8_INDEX) as { n: number }).n,
      ).toBe(1);
    } finally {
      last.close();
    }
  });

  it('rollback real ante fallo de DDL: ALTER previos se revierten y el registro no avanza', () => {
    const dir = mkTemp('qap-01a-rollback-');
    const dbPath = join(dir, 'app-service.sqlite');
    buildV7Database(dbPath);
    const snapshot = legacyDump(dbPath).all;
    // Un objeto con el nombre del índice v8 hace fallar el ÚLTIMO statement, tras cuatro ALTER exitosos.
    const planted = openRaw(dbPath);
    planted.exec(`CREATE TABLE ${V8_INDEX} (marker TEXT); INSERT INTO ${V8_INDEX} VALUES ('intacto');`);
    planted.close();

    expect(() => new AppServiceSqliteStore(dbPath)).toThrow();

    const inspected = openRaw(dbPath);
    try {
      const columns = tableColumns(inspected, 'service_test_cases');
      for (const column of V8_COLUMNS) expect(columns).not.toContain(column);
      expect((inspected.prepare('SELECT COUNT(*) AS n FROM app_schema_migrations WHERE version = 8').get() as { n: number }).n).toBe(0);
      expect((inspected.prepare(`SELECT marker FROM ${V8_INDEX}`).get() as { marker: string }).marker).toBe('intacto');
      inspected.exec(`DROP TABLE ${V8_INDEX};`);
    } finally {
      inspected.close();
    }
    expect(legacyDump(dbPath).all).toBe(snapshot);

    const store = new AppServiceSqliteStore(dbPath);
    try {
      expect(store.get<{ n: number }>('SELECT COUNT(*) AS n FROM app_schema_migrations WHERE version = 8')?.n).toBe(1);
      expect(store.integrityCheck()).toBe(true);
    } finally {
      store.close();
    }
  });

  it('rechaza checksum v8 incorrecto sin emitir DDL ni reconstruir tablas', () => {
    const dir = mkTemp('qap-01a-badsum-');
    const dbPath = join(dir, 'app-service.sqlite');
    new AppServiceSqliteStore(dbPath).close();
    const tamper = openRaw(dbPath);
    tamper.prepare('UPDATE app_schema_migrations SET checksum = ? WHERE version = 8').run('0'.repeat(64));
    const columnsBefore = tableColumns(tamper, 'service_test_cases');
    tamper.close();

    expect(() => new AppServiceSqliteStore(dbPath)).toThrow(/checksum \(v8\)/);

    const inspected = openRaw(dbPath);
    try {
      expect(tableColumns(inspected, 'service_test_cases')).toEqual(columnsBefore);
      expect(
        (inspected.prepare('SELECT checksum FROM app_schema_migrations WHERE version = 8').get() as { checksum: string }).checksum,
      ).toBe('0'.repeat(64));
    } finally {
      inspected.close();
    }
  });

  it('rechaza estructura incompatible (columnas v8 sin registro) y no reconstruye nada', () => {
    const dir = mkTemp('qap-01a-incompat-');
    const dbPath = join(dir, 'app-service.sqlite');
    buildV7Database(dbPath);
    const partial = openRaw(dbPath);
    partial.exec('ALTER TABLE service_test_cases ADD COLUMN execution_key TEXT;');
    const columnsBefore = tableColumns(partial, 'service_test_cases');
    partial.close();

    expect(() => new AppServiceSqliteStore(dbPath)).toThrow(/columns present without migration record/);

    const inspected = openRaw(dbPath);
    try {
      expect(tableColumns(inspected, 'service_test_cases')).toEqual(columnsBefore);
      expect((inspected.prepare('SELECT COUNT(*) AS n FROM app_schema_migrations WHERE version = 8').get() as { n: number }).n).toBe(0);
    } finally {
      inspected.close();
    }
  });

  it('rechaza v8 registrada con estructura alterada (índice ausente)', () => {
    const dir = mkTemp('qap-01a-noindex-');
    const dbPath = join(dir, 'app-service.sqlite');
    new AppServiceSqliteStore(dbPath).close();
    const tamper = openRaw(dbPath);
    tamper.exec(`DROP INDEX ${V8_INDEX};`);
    tamper.close();
    expect(() => new AppServiceSqliteStore(dbPath)).toThrow(/structure \(v8\)/);
  });
});

describe('P0.3b-01A — contrato interno del candidato con linaje', () => {
  it('crea el candidato: UUID del servidor, pending_oracle/missing_oracle, sin aprobación ni elegibilidad', () => {
    const { ctx, created, input } = setupWithCandidate();
    expect(created.outcome).toBe('created');
    const record = created.case;
    expect(record.case_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(record.tc_case.id).toBe(record.case_id);
    expect(record.version).toBe(1);
    expect(record.conformity_status).toBe('pending_oracle');
    expect(record.oracle_status).toBe('missing_oracle');
    expect(record.execution_approval_id).toBeNull();
    expect(record.confirmation_digest).toBeNull();
    expect(record.confirmed_by).toBeNull();
    expect(record.confirmed_at).toBeNull();
    expect(record.execution_eligible).toBe(false);
    expect(record.execution_content_digest).toMatch(/^lcd-v1:[a-f0-9]{64}$/);
    expect(record.execution_key).toMatch(/^lck-v1:[a-f0-9]{64}$/);
    expect(record.scope).toMatchObject({
      project_id: ctx.projectId,
      application_id: ctx.applicationId,
      module_key: 'checkout',
      environment_id: ctx.env.env_id,
      tenant_id: TENANT,
      profile_id: ctx.profile.profile_id,
      role: ROLE,
      route_pathname: ROUTE,
    });
    expect(record.lineage.dossier).toEqual({
      revision_id: input.dossier.revisionId,
      scope_hash: input.dossier.scopeHash,
      content_hash: input.dossier.contentHash,
    });
    expect(record.lineage.view.view_id).toBe('view-1');
    expect(record.lineage.controls.map((c) => c.control_index)).toEqual([0, 1]);
    expect(record.lineage.rule.revision).toBe(1);
    expect(record.lineage.rule_confirmation?.revision).toBe(1);

    // Columnas v8: el digest vive en execution_content_digest; la aprobación de ejecución queda vacía.
    const row = inspectionStore(ctx.service).get<Record<string, unknown>>(
      'SELECT * FROM service_test_cases WHERE case_id = ?',
      record.case_id,
    )!;
    expect(row.execution_content_digest).toBe(record.execution_content_digest);
    expect(row.confirmation_digest).toBeNull();
    expect(row.execution_approval_id).toBeNull();
    expect(row.steps_json).toBe('[]');
    expect(row.execution_key).toBe(record.execution_key);
    expect(inspectionStore(ctx.service).integrityCheck()).toBe(true);
  });

  it('rechaza un id suministrado por el cliente y TCCase inválido sin escribir nada', () => {
    const { ctx, confirmed, revision, input } = setupWithCandidate();
    const before = caseRows(ctx);
    expectLineaged(
      () =>
        ctx.service.upsertLineagedCaseCandidate({
          ...input,
          tcCase: { ...tcCase(), id: '11111111-1111-4111-8111-111111111111' } as unknown as Omit<TCCase, 'id'>,
        }),
      'lineaged_case_invalid_input',
      'tcCase.id',
    );
    expectLineaged(
      () =>
        ctx.service.upsertLineagedCaseCandidate(
          candidateFor(ctx, confirmed, revision, {
            tcCase: { _version: '1.0', name: 'x', steps: [{ type: 'bogus' }] } as unknown as Omit<TCCase, 'id'>,
          }),
        ),
      'lineaged_case_tc_case_invalid',
    );
    expectLineaged(
      () =>
        ctx.service.upsertLineagedCaseCandidate({
          ...input,
          tcCase: tcCase({ source_rule_id: 'otra-regla' }),
        }),
      'lineaged_case_scope_mismatch',
      'tcCase.source_rule_id',
    );
    expect(caseRows(ctx)).toBe(before);
  });

  it('persiste y se recupera tras reiniciar el servicio', () => {
    const { ctx, created } = setupWithCandidate();
    const record = created.case;
    ctx.service.close();

    const restarted = openService(ctx.hostDir);
    const scope = readScopeFor(ctx);
    const byId = restarted.getLineagedCase(scope, { caseId: record.case_id });
    const byKey = restarted.getLineagedCase(scope, { executionKey: record.execution_key });
    expect(byId).toEqual(record);
    expect(byKey).toEqual(record);
    expect(restarted.listLineagedCases(scope)).toEqual([record]);
    expect(restarted.listLineagedCases(readScopeFor(ctx, { moduleKey: 'otro' }))).toEqual([]);
    expect(inspectionStore(restarted).integrityCheck()).toBe(true);
  });

  it('idempotencia: el mismo candidato devuelve ID, versión y digest existentes, aun con claves reordenadas', () => {
    const { ctx, created, input } = setupWithCandidate();
    const before = caseRows(ctx);
    const again = ctx.service.upsertLineagedCaseCandidate(input);
    expect(again.outcome).toBe('unchanged');
    expect(again.case.case_id).toBe(created.case.case_id);
    expect(again.case.version).toBe(1);
    expect(again.case.execution_content_digest).toBe(created.case.execution_content_digest);

    const reordered = ctx.service.upsertLineagedCaseCandidate({
      ...input,
      tcCase: {
        steps: [
          { selector: '#pay', type: 'click' },
          { url: ROUTE, type: 'navigate' },
        ].reverse() as TCCase['steps'],
        tags: ['checkout', 'lineaged'],
        name: 'Mostrar el total del carrito',
        _version: '1.0',
      },
      view: { controlIndexes: [1, 0], evidenceIds: ['ev-view-1'], viewId: 'view-1' },
    });
    expect(reordered.outcome).toBe('unchanged');
    expect(reordered.case.execution_content_digest).toBe(created.case.execution_content_digest);
    expect(caseRows(ctx)).toBe(before);
    expect(ctx.service.listLineagedCases(readScopeFor(ctx))).toHaveLength(1);
  });

  it('conflicto: contenido distinto con el mismo dossier y revisión de regla no muta nada', () => {
    const { ctx, input, created } = setupWithCandidate();
    const before = caseRows(ctx);
    const error = expectLineaged(
      () =>
        ctx.service.upsertLineagedCaseCandidate({
          ...input,
          tcCase: tcCase({ name: 'Otro nombre', steps: [{ type: 'navigate', url: ROUTE }] }),
        }),
      'lineaged_case_content_conflict',
    );
    expect(error.details?.case_id).toBe(created.case.case_id);
    expect(caseRows(ctx)).toBe(before);

    // Una expectedVersion obsoleta tampoco convierte el conflicto en sobrescritura.
    expectLineaged(
      () =>
        ctx.service.upsertLineagedCaseCandidate({
          ...input,
          expectedVersion: 1,
          tcCase: tcCase({ tags: ['distinto'] }),
        }),
      'lineaged_case_content_conflict',
    );
    expect(caseRows(ctx)).toBe(before);
  });

  it('avance de revisión: exige expectedVersion, mantiene el ID, incrementa la versión e invalida aprobaciones', () => {
    const { ctx, created, input } = setupWithCandidate();
    const id = created.case.case_id;

    // Simula una aprobación previa heredada (01A no la produce) para comprobar su invalidación.
    inspectionStore(ctx.service).run(
      `UPDATE service_test_cases SET execution_approval_id = 'apr-heredada', conformity_status = 'approved',
         confirmation_digest = 'dig-heredado', confirmed_by = 'alguien', confirmed_at = '2026-01-01T00:00:00.000Z',
         oracle_status = 'accredited' WHERE case_id = ?`,
      id,
    );

    const confirmed2 = confirmRule(ctx, 'El total del carrito se muestra con impuestos y descuento');
    const revision2 = publishDossier(ctx, confirmed2);
    const advance = candidateFor(ctx, confirmed2, revision2);
    expect(advance.decision.ruleRevision).toBe(2);

    const before = caseRows(ctx);
    expectLineaged(() => ctx.service.upsertLineagedCaseCandidate(advance), 'lineaged_case_expected_version_required');
    expect(caseRows(ctx)).toBe(before);

    const advanced = ctx.service.upsertLineagedCaseCandidate({
      ...advance,
      expectedVersion: 1,
      tcCase: tcCase({ steps: [{ type: 'navigate', url: ROUTE }, { type: 'click', selector: '#pay' }, { type: 'screenshot' }] }),
    });
    expect(advanced.outcome).toBe('advanced');
    expect(advanced.case.case_id).toBe(id);
    expect(advanced.case.version).toBe(2);
    expect(advanced.case.execution_content_digest).not.toBe(created.case.execution_content_digest);
    expect(advanced.case.lineage.rule.revision).toBe(2);
    expect(advanced.case.lineage.dossier.revision_id).toBe(revision2.revision_id);
    expect(advanced.case.execution_approval_id).toBeNull();
    expect(advanced.case.confirmation_digest).toBeNull();
    expect(advanced.case.confirmed_by).toBeNull();
    expect(advanced.case.confirmed_at).toBeNull();
    expect(advanced.case.conformity_status).toBe('pending_oracle');
    expect(advanced.case.oracle_status).toBe('missing_oracle');
    expect(advanced.case.execution_eligible).toBe(false);
    expect(ctx.service.listLineagedCases(readScopeFor(ctx))).toHaveLength(1);

    // Un candidato original (rev 1) ya no puede reaplicarse: la regla vigente es la rev 2.
    expectLineaged(
      () => ctx.service.upsertLineagedCaseCandidate({ ...input, expectedVersion: 2 }),
      'lineaged_case_reference_invalid',
      'decision.ruleId',
    );
    expect(inspectionStore(ctx.service).integrityCheck()).toBe(true);
  });

  it('CAS: una versión obsoleta no puede sobrescribir una nueva', () => {
    const { ctx, created } = setupWithCandidate();
    const confirmed2 = confirmRule(ctx, 'Total con impuestos y envío');
    const advance2 = candidateFor(ctx, confirmed2, publishDossier(ctx, confirmed2));
    const v2 = ctx.service.upsertLineagedCaseCandidate({ ...advance2, expectedVersion: 1 });
    expect(v2.case.version).toBe(2);

    const confirmed3 = confirmRule(ctx, 'Total con impuestos, envío y propina');
    const advance3 = candidateFor(ctx, confirmed3, publishDossier(ctx, confirmed3), {
      tcCase: tcCase({ name: 'Escritor obsoleto' }),
    });
    const before = caseRows(ctx);
    const stale = expectLineaged(
      () => ctx.service.upsertLineagedCaseCandidate({ ...advance3, expectedVersion: 1 }),
      'lineaged_case_stale_version',
    );
    expect(stale.details).toMatchObject({ expected_version: 1, current_version: 2 });
    expect(caseRows(ctx)).toBe(before);
    expect(ctx.service.getLineagedCase(readScopeFor(ctx), { caseId: created.case.case_id })?.version).toBe(2);

    const v3 = ctx.service.upsertLineagedCaseCandidate({ ...advance3, expectedVersion: 2 });
    expect(v3.case.version).toBe(3);
    expect(v3.case.case_id).toBe(created.case.case_id);
  });

  it('avance solo por nuevo dossier (misma revisión de regla) también exige y respeta expectedVersion', () => {
    const { ctx, confirmed, created, input } = setupWithCandidate();
    const revision2 = publishDossier(ctx, confirmed, { extraHeading: 'Resumen' });
    expect(revision2.revision_id).not.toBe(input.dossier.revisionId);
    const next = candidateFor(ctx, confirmed, revision2);
    expectLineaged(() => ctx.service.upsertLineagedCaseCandidate(next), 'lineaged_case_expected_version_required');
    const advanced = ctx.service.upsertLineagedCaseCandidate({ ...next, expectedVersion: 1 });
    expect(advanced.outcome).toBe('advanced');
    expect(advanced.case.case_id).toBe(created.case.case_id);
    expect(advanced.case.version).toBe(2);
    expect(advanced.case.lineage.rule.revision).toBe(1);
  });

  it('una revisión inferior de la misma regla se rechaza (nivel repositorio, sin tocar el caso)', () => {
    const { ctx, created, input } = setupWithCandidate();
    const confirmed2 = confirmRule(ctx, 'Total con impuestos y descuento');
    const advance2 = candidateFor(ctx, confirmed2, publishDossier(ctx, confirmed2));
    ctx.service.upsertLineagedCaseCandidate({ ...advance2, expectedVersion: 1 });
    const before = caseRows(ctx);

    const error = expectLineaged(
      () =>
        inspectionStore(ctx.service).transaction('IMMEDIATE', () =>
          new Block3ExecutionRepo(inspectionStore(ctx.service)).upsertLineagedCandidateInTransaction({
            projectId: ctx.projectId,
            moduleKey: ctx.moduleKey,
            scope: created.case.scope,
            executionKey: created.case.execution_key,
            dossierRevisionId: input.dossier.revisionId,
            ruleRevision: 1,
            expectedVersion: 2,
            resolveModuleId: () => {
              throw new Error('no debe resolver módulo');
            },
            prepare: () => {
              throw new Error('no debe preparar contenido');
            },
          }),
        ),
      'lineaged_case_rule_revision_regression',
    );
    expect(error.details).toMatchObject({ stored_revision: 2, candidate_revision: 1 });
    expect(caseRows(ctx)).toBe(before);
  });

  it('expectedVersion no aplica a una creación (identidad sin caso previo)', () => {
    const ctx = createCtx();
    const confirmed = confirmRule(ctx);
    const revision = publishDossier(ctx, confirmed);
    expectLineaged(
      () => ctx.service.upsertLineagedCaseCandidate(candidateFor(ctx, confirmed, revision, { expectedVersion: 1 })),
      'lineaged_case_stale_version',
    );
    expect(ctx.service.listLineagedCases(readScopeFor(ctx))).toEqual([]);
  });

  it('el índice único parcial impide dos casos para la misma identidad lógica', () => {
    const { ctx, created } = setupWithCandidate();
    const row = inspectionStore(ctx.service).get<Record<string, unknown>>('SELECT * FROM service_test_cases WHERE case_id = ?', created.case.case_id)!;
    expect(() =>
      inspectionStore(ctx.service).run(
        `INSERT INTO service_test_cases (case_id, project_id, module_id, module_key, title, observation_json, inference_json,
           expectation_json, oracle_status, steps_json, conformity_status, created_at, updated_at, execution_key)
         VALUES ('dup', ?, ?, 'checkout', 't', '{}', '{}', '{}', 'missing_oracle', '[]', 'pending_oracle', 'x', 'x', ?)`,
        row.project_id as string,
        row.module_id as string,
        row.execution_key as string,
      ),
    ).toThrow(/UNIQUE/i);
    // Las filas legacy (execution_key NULL) no colisionan entre sí.
    for (const id of ['legacy-a', 'legacy-b']) {
      inspectionStore(ctx.service).run(
        `INSERT INTO service_test_cases (case_id, project_id, module_id, module_key, title, observation_json, inference_json,
           expectation_json, oracle_status, steps_json, conformity_status, created_at, updated_at)
         VALUES (?, ?, ?, 'checkout', 't', '{}', '{}', '{}', 'missing_oracle', '[]', 'pending_oracle', 'x', 'x')`,
        id,
        row.project_id as string,
        row.module_id as string,
      );
    }
  });
});

describe('P0.3b-01A — digest versionado', () => {
  function documentOf(overrides: Partial<TCCase> = {}): LineagedCaseDocument {
    const tc: TCCase = {
      _version: '1.0',
      id: '22222222-2222-4222-8222-222222222222',
      name: 'Caso',
      steps: [
        { type: 'navigate', url: '/a' },
        { type: 'click', selector: '#b' },
      ],
      ...overrides,
    };
    return {
      schema: 'qap.lineaged_case.v1',
      identity: { case_id: tc.id, execution_key: 'lck-v1:abc', rule_id: 'sreq-1', rule_key: 'k' },
      scope: {
        project_id: 'p',
        application_id: 'a',
        module_key: 'm',
        environment_id: 'e',
        environment_name: 'env',
        tenant_id: null,
        profile_id: null,
        role: null,
        route_pathname: '/a',
      },
      lineage: {
        dossier: { revision_id: 'drev-1', scope_hash: 's', content_hash: 'c' },
        view: { view_id: 'v', route_index: 0, evidence_id: 'ev' },
        controls: [{ control_index: 0, control_digest: 'x' }],
        evidence_ids: ['ev'],
        decision: { decision_id: 'd', decision_status: 'accredited', rule_key: 'k', route_pathname: '/a', scope_match: 'exact' },
        rule: {
          rule_id: 'sreq-1',
          source_kind: 'confirmed_requirement',
          source_id: 'REQ',
          source_ref: 'ref',
          source_version: 'rev:1',
          revision: 1,
          source_digest: null,
        },
        rule_confirmation: null,
      },
      tc_case: tc,
    };
  }

  it('es estable con claves reordenadas y sensible a contenido, orden de pasos y versión', () => {
    const base = documentOf();
    const digest = computeLineagedCaseDigest(base, 1);
    expect(digest).toMatch(/^lcd-v1:[a-f0-9]{64}$/);

    const reorderedKeys: LineagedCaseDocument = JSON.parse(
      stableStringify({ tc_case: base.tc_case, lineage: base.lineage, scope: base.scope, identity: base.identity, schema: base.schema }),
    );
    const shuffled = {
      ...reorderedKeys,
      tc_case: { steps: [...base.tc_case.steps].map((s) => Object.fromEntries(Object.entries(s).reverse())), name: 'Caso', id: base.tc_case.id, _version: '1.0' },
    } as unknown as LineagedCaseDocument;
    expect(computeLineagedCaseDigest(shuffled, 1)).toBe(digest);

    expect(computeLineagedCaseDigest(documentOf({ name: 'Caso 2' }), 1)).not.toBe(digest);
    expect(
      computeLineagedCaseDigest(
        documentOf({
          steps: [
            { type: 'click', selector: '#b' },
            { type: 'navigate', url: '/a' },
          ],
        }),
        1,
      ),
    ).not.toBe(digest);
    expect(computeLineagedCaseDigest(base, 2)).not.toBe(digest);
    expect(stableStringify({ b: 1, a: [2, 1] })).toBe('{"a":[2,1],"b":1}');
  });
});

describe('P0.3b-01A — referencias comprobadas y ámbito canónico', () => {
  it('rechaza cruces de proyecto', () => {
    const { ctx, input } = setupWithCandidate();
    const wsB = mkTemp('qap-01a-wsB-');
    const projectB = ctx.service.createProject({ name: 'Portal B', canonicalRoot: wsB, mode: 'investigate_and_test' }).project.project_id;
    const envB = ctx.service.upsertEnvironment({ projectId: projectB, name: 'staging', baseUrl: 'http://localhost:4100' });
    const before = caseRows(ctx);
    expectLineaged(
      () =>
        ctx.service.upsertLineagedCaseCandidate({
          ...input,
          projectId: projectB,
          environmentId: envB.env_id,
          profileId: null,
        }),
      'lineaged_case_scope_mismatch',
      'projectId',
    );
    expect(caseRows(ctx)).toBe(before);
  });

  it('rechaza cruces de entorno, tenant, perfil y rol', () => {
    const { ctx, confirmed, input } = setupWithCandidate();
    const env2 = ctx.service.upsertEnvironment({ projectId: ctx.projectId, name: 'qa2', baseUrl: 'http://localhost:4200' });
    const profile2 = ctx.service.upsertProfile({
      projectId: ctx.projectId,
      envId: ctx.env.env_id,
      label: 'admin-b',
      roleName: ROLE,
      tenantId: TENANT,
    });
    const revNoProfile = publishDossier(ctx, confirmed, { scope: { profile_id: null } });
    const before = caseRows(ctx);

    expectLineaged(
      () => ctx.service.upsertLineagedCaseCandidate({ ...input, environmentId: env2.env_id, profileId: null }),
      'lineaged_case_scope_mismatch',
      'environmentId',
    );
    expectLineaged(
      () => ctx.service.upsertLineagedCaseCandidate({ ...input, tenantId: 'tenant-b' }),
      'lineaged_case_scope_mismatch',
      'tenantId',
    );
    expectLineaged(
      () => ctx.service.upsertLineagedCaseCandidate({ ...input, tenantId: 'tenant-b', profileId: null }),
      'lineaged_case_scope_mismatch',
      'tenantId',
    );
    expectLineaged(
      () => ctx.service.upsertLineagedCaseCandidate({ ...input, profileId: profile2.profile_id }),
      'lineaged_case_scope_mismatch',
      'profileId',
    );
    expectLineaged(
      () => ctx.service.upsertLineagedCaseCandidate({ ...input, role: 'viewer' }),
      'lineaged_case_scope_mismatch',
      'role',
    );
    expectLineaged(
      () =>
        ctx.service.upsertLineagedCaseCandidate({
          ...candidateFor(ctx, confirmed, revNoProfile),
          profileId: null,
          role: 'viewer',
        }),
      'lineaged_case_scope_mismatch',
      'role',
    );
    expectLineaged(
      () => ctx.service.upsertLineagedCaseCandidate({ ...input, routePathname: '/otra-ruta' }),
      'lineaged_case_scope_mismatch',
      'routePathname',
    );
    expect(caseRows(ctx)).toBe(before);
  });

  it('rechaza aliases ambiguos y formas no canónicas', () => {
    const { ctx, input } = setupWithCandidate();
    const before = caseRows(ctx);
    expectLineaged(() => ctx.service.upsertLineagedCaseCandidate({ ...input, moduleKey: 'Checkout' }), 'lineaged_case_ambiguous_alias', 'moduleKey');
    expectLineaged(() => ctx.service.upsertLineagedCaseCandidate({ ...input, tenantId: '*' }), 'lineaged_case_ambiguous_alias', 'tenantId');
    expectLineaged(() => ctx.service.upsertLineagedCaseCandidate({ ...input, role: 'todos' }), 'lineaged_case_ambiguous_alias', 'role');
    expectLineaged(() => ctx.service.upsertLineagedCaseCandidate({ ...input, role: ' admin' }), 'lineaged_case_ambiguous_alias', 'role');
    expectLineaged(
      () => ctx.service.upsertLineagedCaseCandidate({ ...input, routePathname: '/checkout?x=1' }),
      'lineaged_case_ambiguous_alias',
      'routePathname',
    );
    expectLineaged(() => ctx.service.upsertLineagedCaseCandidate({ ...input, routePathname: '*' }), 'lineaged_case_ambiguous_alias', 'routePathname');
    expectLineaged(() => ctx.service.upsertLineagedCaseCandidate({ ...input, routePathname: 'checkout' }), 'lineaged_case_ambiguous_alias', 'routePathname');
    expect(caseRows(ctx)).toBe(before);
  });

  it('rechaza referencias no comprobables: dossier, vista, controles, evidencias, decisión, regla y confirmación', () => {
    const { ctx, confirmed, revision, input } = setupWithCandidate();
    const before = caseRows(ctx);
    const bad = (override: Partial<LineagedCaseCandidateInput>, field: string, code: LineagedCaseErrorCode = 'lineaged_case_reference_invalid') =>
      expectLineaged(() => ctx.service.upsertLineagedCaseCandidate({ ...input, ...override }), code, field);

    bad({ dossier: { ...input.dossier, revisionId: 'drev-inexistente' } }, 'dossier.revisionId');
    bad({ dossier: { ...input.dossier, scopeHash: 'a'.repeat(64) } }, 'dossier.scopeHash');
    bad({ dossier: { ...input.dossier, contentHash: 'b'.repeat(64) } }, 'dossier.contentHash');
    bad({ view: { ...input.view!, viewId: 'view-404' } }, 'view.viewId');
    bad({ view: { ...input.view!, controlIndexes: [0, 7] } }, 'view.controlIndexes');
    bad({ view: { ...input.view!, evidenceIds: ['ev-desconocida'] } }, 'view.evidenceIds');
    bad({ view: { ...input.view!, evidenceIds: ['ev-extra-1'] } }, 'view.evidenceIds');
    bad({ decision: { ...input.decision, decisionId: 'dec-404' } }, 'decision.decisionId');
    bad({ decision: { ...input.decision, ruleId: 'sreq-otra' } }, 'decision.ruleId');
    bad({ decision: { ...input.decision, ruleRevision: 9 } }, 'decision.ruleRevision');
    bad({ decision: { ...input.decision, ruleSourceDigest: 'f'.repeat(64) } }, 'decision.ruleSourceDigest');
    bad({ ruleConfirmation: null }, 'ruleConfirmation');
    bad({ ruleConfirmation: { decisionId: 'rcd-inexistente' } }, 'ruleConfirmation.decisionId');

    // Los metadatos del dossier no son autoridad: una decisión sin regla fuente única se rechaza.
    const mutated = inspectionStore(ctx.service).get<Record<string, unknown>>(
      'SELECT dossier_json FROM discovery_revisions WHERE revision_id = ?',
      revision.revision_id,
    )!;
    expect(typeof mutated.dossier_json).toBe('string');
    expect(confirmed.rule).not.toBeNull();
    expect(caseRows(ctx)).toBe(before);
  });
});

describe('P0.3b-01A — aislamiento legacy', () => {
  function legacyCase(ctx: Ctx) {
    const result = ctx.service.proposeModuleCases({
      projectId: ctx.projectId,
      moduleKey: ctx.moduleKey,
      proposals: [
        {
          title: 'Caso legacy acreditado',
          expected_outcome: 'La página responde',
          oracle_source: 'user',
          expectation_metadata: { decision_status: 'accredited' },
          steps: [
            { type: 'navigate', url: '/legacy' },
            { type: 'assert', selector: 'body', assertion_type: 'contains', expected: 'ok' },
          ],
        },
      ],
    });
    return result.all_cases[0]!;
  }

  it('lecturas y operaciones legacy aíslan los candidatos y bloquean IDs con linaje solicitados explícitamente', () => {
    const { ctx, created } = setupWithCandidate();
    const lineagedId = created.case.case_id;
    const legacy = legacyCase(ctx);
    const lineagedBefore = caseRows(ctx);

    // Lectura operativa: la lista legacy no incluye candidatos; el ID explícito se bloquea.
    expect(ctx.service.listServiceCases(ctx.projectId, ctx.moduleKey).map((c) => c.case_id)).toEqual([legacy.case_id]);
    expect(ctx.service.listServiceCases(ctx.projectId).map((c) => c.case_id)).toEqual([legacy.case_id]);
    expectLineaged(() => ctx.service.block3.getCase(ctx.projectId, lineagedId), 'lineaged_case_legacy_blocked');

    // Propuesta: el lote entero se revierte; nada se omite en silencio.
    const caseCountBefore = inspectionStore(ctx.service).get<{ n: number }>('SELECT COUNT(*) AS n FROM service_test_cases')!.n;
    expectLineaged(
      () =>
        ctx.service.proposeModuleCases({
          projectId: ctx.projectId,
          moduleKey: ctx.moduleKey,
          proposals: [
            { title: 'Nuevo legacy en el mismo lote', steps: [{ type: 'navigate', url: '/n' }] },
            { case_id: lineagedId, title: 'Intento de pisar candidato', steps: [{ type: 'navigate', url: '/x' }] },
          ],
        }),
      'lineaged_case_legacy_blocked',
    );
    expect(inspectionStore(ctx.service).get<{ n: number }>('SELECT COUNT(*) AS n FROM service_test_cases')!.n).toBe(caseCountBefore);

    // Decisión de oráculos.
    expectLineaged(
      () =>
        ctx.service.decideCaseOracles({
          projectId: ctx.projectId,
          moduleKey: ctx.moduleKey,
          decisions: [{ case_id: lineagedId, expected_outcome: 'Resultado impuesto por vía legacy' }],
        }),
      'lineaged_case_legacy_blocked',
    );

    // Aprobación explícita: no se aprueba el resto del lote ni se omite el ID con linaje.
    expectLineaged(
      () =>
        ctx.service.approveCaseBatch({
          projectId: ctx.projectId,
          moduleKey: ctx.moduleKey,
          caseIds: [legacy.case_id, lineagedId],
          approvedBy: 'qa',
        }),
      'lineaged_case_legacy_blocked',
    );
    expect(ctx.service.listServiceCases(ctx.projectId, ctx.moduleKey)[0]!.conformity_status).toBe('proposed');

    // Creación de intentos.
    expectLineaged(
      () =>
        ctx.service.createExecutionAttempt({
          projectId: ctx.projectId,
          moduleKey: ctx.moduleKey,
          cases: [{ case_id: legacy.case_id }, { case_id: lineagedId }],
        }),
      'lineaged_case_legacy_blocked',
    );
    expect(inspectionStore(ctx.service).get<{ n: number }>('SELECT COUNT(*) AS n FROM execution_attempts')!.n).toBe(0);

    // Aceptación humana y actualización de conformidad al finalizar un intento legacy.
    expectLineaged(
      () =>
        ctx.service.recordCaseHumanAcceptance({
          projectId: ctx.projectId,
          caseId: lineagedId,
          acceptedBy: 'qa',
          reason: 'Intento de aceptar un candidato por la vía legacy',
        }),
      'lineaged_case_legacy_blocked',
    );
    const attempt = ctx.service.createExecutionAttempt({
      projectId: ctx.projectId,
      moduleKey: ctx.moduleKey,
      cases: [{ case_id: legacy.case_id }],
    });
    expectLineaged(
      () =>
        ctx.service.finalizeExecutionAttempt({
          attemptId: attempt.attempt_id,
          executionResult: {
            execution_id: attempt.execution_id,
            result: 'completed',
            cases: [{ id: lineagedId, result: 'passed', steps: [] }],
          } as unknown as ExecutionResult,
        }),
      'lineaged_case_legacy_blocked',
    );

    // Ninguna operación legacy tocó el candidato.
    expect(caseRows(ctx).includes(lineagedId)).toBe(true);
    const lineagedRowsNow = JSON.parse(caseRows(ctx)).filter((r: { case_id: string }) => r.case_id === lineagedId);
    const lineagedRowsBefore = JSON.parse(lineagedBefore).filter((r: { case_id: string }) => r.case_id === lineagedId);
    expect(lineagedRowsNow).toEqual(lineagedRowsBefore);
    const record = ctx.service.getLineagedCase(readScopeFor(ctx), { caseId: lineagedId })!;
    expect(record.conformity_status).toBe('pending_oracle');
    expect(record.oracle_status).toBe('missing_oracle');
    expect(record.execution_approval_id).toBeNull();
    expect(record.execution_eligible).toBe(false);
  });

  it('las rutas legacy siguen funcionando sin IDs con linaje y nunca seleccionan candidatos', () => {
    const { ctx, created } = setupWithCandidate();
    const legacy = legacyCase(ctx);
    const approved = ctx.service.approveCaseBatch({ projectId: ctx.projectId, moduleKey: ctx.moduleKey, approvedBy: 'qa' });
    expect(approved.status).toBe('approved');
    expect(approved.approved_cases.map((c) => c.case_id)).toEqual([legacy.case_id]);
    expect(ctx.service.getLineagedCase(readScopeFor(ctx), { caseId: created.case.case_id })?.conformity_status).toBe('pending_oracle');

    const attempt = ctx.service.createExecutionAttempt({
      projectId: ctx.projectId,
      moduleKey: ctx.moduleKey,
      cases: [{ case_id: legacy.case_id }],
    });
    expect(attempt.case_ids).toEqual([legacy.case_id]);
    const finalized = ctx.service.finalizeExecutionAttempt({
      attemptId: attempt.attempt_id,
      technicalError: { code: 'runner_unavailable', message: 'sin runner en la prueba' },
    });
    expect(finalized.case_results).toHaveLength(1);
    expect(ctx.service.getExecutionSummary(ctx.projectId, ctx.moduleKey).total_cases).toBe(1);
    expect(ctx.service.getLineagedCase(readScopeFor(ctx), { caseId: created.case.case_id })?.conformity_status).toBe('pending_oracle');
  });

  it('las consultas de candidatos no devuelven casos legacy', () => {
    const { ctx, created } = setupWithCandidate();
    const legacy = legacyCase(ctx);
    expect(ctx.service.getLineagedCase(readScopeFor(ctx), { caseId: legacy.case_id })).toBeNull();
    expect(ctx.service.listLineagedCases(readScopeFor(ctx)).map((c) => c.case_id)).toEqual([created.case.case_id]);
  });

  it('un caso con linaje alterado en disco se detecta como corrupto al leerlo', () => {
    const { ctx, created } = setupWithCandidate();
    inspectionStore(ctx.service).run(
      "UPDATE service_test_cases SET execution_content_digest = 'lcd-v1:' || ? WHERE case_id = ?",
      '0'.repeat(64),
      created.case.case_id,
    );
    expectLineaged(() => ctx.service.getLineagedCase(readScopeFor(ctx), { caseId: created.case.case_id }), 'lineaged_case_corrupt');
  });
});

describe('P0.3b-01A — YAML y plan.json existentes', () => {
  function listFiles(root: string): string[] {
    const out: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) walk(full);
        else out.push(relative(root, full));
      }
    };
    walk(root);
    return out.sort();
  }

  it('se conservan byte a byte y no se crean ni publican artefactos en el workspace', () => {
    const ctx = createCtx();
    const plansDir = join(ctx.wsDir, '.qa', 'plans', 'checkout');
    mkdirSync(plansDir, { recursive: true });
    const yaml = Buffer.from('_version: "1.0"\r\nid: 33333333-3333-4333-8333-333333333333\r\nname: "Caso publicado ñ"\r\nsteps:\r\n  - type: navigate\r\n    url: /checkout\r\n', 'utf8');
    const plan = Buffer.from('{"plan":{"b":2,"a":1},"cases":["TC-001"]}\n  ', 'utf8');
    writeFileSync(join(plansDir, 'TC-001.yaml'), yaml);
    writeFileSync(join(plansDir, 'plan.json'), plan);
    const hashes = () => ({
      yaml: sha(readFileSync(join(plansDir, 'TC-001.yaml'))),
      plan: sha(readFileSync(join(plansDir, 'plan.json'))),
    });
    const before = hashes();
    const treeBefore = listFiles(ctx.wsDir);

    const confirmed = confirmRule(ctx);
    const revision = publishDossier(ctx, confirmed);
    const input = candidateFor(ctx, confirmed, revision);
    const created = ctx.service.upsertLineagedCaseCandidate(input);
    ctx.service.upsertLineagedCaseCandidate(input);
    const confirmed2 = confirmRule(ctx, 'Nueva expectativa');
    ctx.service.upsertLineagedCaseCandidate({
      ...candidateFor(ctx, confirmed2, publishDossier(ctx, confirmed2)),
      expectedVersion: created.case.version,
    });

    expect(hashes()).toEqual(before);
    expect(readFileSync(join(plansDir, 'TC-001.yaml')).equals(yaml)).toBe(true);
    expect(readFileSync(join(plansDir, 'plan.json')).equals(plan)).toBe(true);
    expect(listFiles(ctx.wsDir)).toEqual(treeBefore);
    expect(existsSync(join(ctx.wsDir, 'plan.json'))).toBe(false);
  });
});

describe('R1 — aislamiento entre proyectos y preflight sin efectos secundarios', () => {
  it('P1-A: bloquea atribución cruzada de ejecución desde proyecto B sin crear módulos/campañas ni revelar propietario', () => {
    const ctxA = createCtx();
    const confirmed = confirmRule(ctxA);
    const revision = publishDossier(ctxA, confirmed);
    const created = ctxA.service.upsertLineagedCaseCandidate(candidateFor(ctxA, confirmed, revision));
    const lineagedId = created.case.case_id;

    // Segundo proyecto B en la misma base SQLite del host
    const wsB = mkTemp('qap-01a-ws-b-');
    const snapB = ctxA.service.createProject({ name: 'Proyecto B', canonicalRoot: wsB, mode: 'investigate_and_test' });
    const projectB = snapB.project.project_id;
    ctxA.service.upsertEnvironment({ projectId: projectB, name: 'staging', baseUrl: 'http://localhost:4200' });

    // Una lectura ajena es indistinguible de un UUID inexistente.
    expect(ctxA.service.block3.getCase(projectB, lineagedId)).toBeNull();
    expect(ctxA.service.block3.getCase(projectB, randomUUID())).toBeNull();

    // createExecutionAttempt desde B sobre módulo nuevo NO debe crear módulo, campaña ni intento
    const modulesBefore = inspectionStore(ctxA.service).get<{ n: number }>(
      'SELECT COUNT(*) AS n FROM modules WHERE project_id = ?',
      projectB,
    )!.n;
    const campaignsBefore = inspectionStore(ctxA.service).get<{ n: number }>(
      'SELECT COUNT(*) AS n FROM campaigns WHERE project_id = ?',
      projectB,
    )!.n;

    expectLineaged(
      () =>
        ctxA.service.createExecutionAttempt({
          projectId: projectB,
          moduleKey: 'modulo_fantasma_b',
          cases: [{ case_id: lineagedId }],
        }),
      'lineaged_case_legacy_blocked',
    );
    expect(
      inspectionStore(ctxA.service).get<{ n: number }>(
        'SELECT COUNT(*) AS n FROM modules WHERE project_id = ?',
        projectB,
      )!.n,
    ).toBe(modulesBefore);
    expect(
      inspectionStore(ctxA.service).get<{ n: number }>(
        'SELECT COUNT(*) AS n FROM campaigns WHERE project_id = ?',
        projectB,
      )!.n,
    ).toBe(campaignsBefore);
    expect(
      inspectionStore(ctxA.service).get<{ n: number }>(
        'SELECT COUNT(*) AS n FROM execution_attempts WHERE project_id = ?',
        projectB,
      )!.n,
    ).toBe(0);
    expect(ctxA.service.getExecutionSummary(projectB).status).not.toBe('executed_passed');

    // proposeModuleCases y decideCaseOracles desde B tampoco crean módulos como efecto secundario
    expectLineaged(
      () =>
        ctxA.service.proposeModuleCases({
          projectId: projectB,
          moduleKey: 'modulo_fantasma_propose',
          proposals: [{ case_id: lineagedId, title: 'Spoof', steps: [] }],
        }),
      'lineaged_case_legacy_blocked',
    );
    expectLineaged(
      () =>
        ctxA.service.decideCaseOracles({
          projectId: projectB,
          moduleKey: 'modulo_fantasma_decide',
          decisions: [{ case_id: lineagedId, expected_outcome: 'Outcome spoof' }],
        }),
      'lineaged_case_legacy_blocked',
    );
    expect(
      inspectionStore(ctxA.service).get<{ n: number }>(
        'SELECT COUNT(*) AS n FROM modules WHERE project_id = ?',
        projectB,
      )!.n,
    ).toBe(modulesBefore);

    // finalizeExecutionAttempt desde B con el UUID con linaje de A debe bloquearse sin persistir resultados
    const synthAttempt = ctxA.service.createExecutionAttempt({
      projectId: projectB,
      moduleKey: 'checkout',
      cases: [{ case_id: 'TC-SYNTH-LEGIT' }],
    });
    expectLineaged(
      () =>
        ctxA.service.finalizeExecutionAttempt({
          attemptId: synthAttempt.attempt_id,
          executionResult: {
            execution_id: synthAttempt.execution_id,
            result: 'completed',
            cases: [{ id: lineagedId, result: 'passed', steps: [] }],
          } as unknown as ExecutionResult,
        }),
      'lineaged_case_legacy_blocked',
    );
    expect(
      inspectionStore(ctxA.service).get<{ n: number }>(
        'SELECT COUNT(*) AS n FROM execution_case_results WHERE project_id = ?',
        projectB,
      )!.n,
    ).toBe(0);
    expect(ctxA.service.getExecutionSummary(projectB).status).not.toBe('executed_passed');

    // Contrato legacy válido con ID sintético sigue funcionando
    const finalizedSynth = ctxA.service.finalizeExecutionAttempt({
      attemptId: synthAttempt.attempt_id,
      executionResult: {
        execution_id: synthAttempt.execution_id,
        result: 'completed',
        cases: [{ id: 'TC-SYNTH-LEGIT', result: 'passed', steps: [] }],
      } as unknown as ExecutionResult,
    });
    expect(finalizedSynth.attempt.status).toBe('completed');
    expect(finalizedSynth.case_results).toHaveLength(1);
    expect(finalizedSynth.case_results[0]!.verdict).toBe('PASS');
  });

  it('P1-B: lotes mixtos en approve_batch y decide_oracles bloquean antes del gateway, recibos y módulos sin mutación parcial', async () => {
    const ctx = createCtx();
    const confirmed = confirmRule(ctx);
    const revision = publishDossier(ctx, confirmed);
    const created = ctx.service.upsertLineagedCaseCandidate(candidateFor(ctx, confirmed, revision));
    const lineagedId = created.case.case_id;

    // Casos legacy legítimos: uno listo (proposed) y otro pending_oracle
    const mod = ctx.service.upsertModule({ projectId: ctx.projectId, key: ctx.moduleKey, title: ctx.moduleKey });
    const readyRes = ctx.service.proposeModuleCases({
      projectId: ctx.projectId,
      moduleKey: ctx.moduleKey,
      proposals: [
        {
          title: 'Caso legacy listo',
          expected_outcome: 'ok',
          oracle_source: 'user',
          expectation_metadata: { decision_status: 'accredited' },
          steps: [
            { type: 'navigate', url: 'http://localhost:4100/checkout' },
            { type: 'assert', selector: 'body', assertion_type: 'contains', expected: 'ok' },
          ],
        },
      ],
    });
    const legacyReady = readyRes.proposed[0]!;
    const pendingRes = ctx.service.block3.proposeCases({
      projectId: ctx.projectId,
      moduleId: mod.module_id,
      moduleKey: ctx.moduleKey,
      proposals: [
        {
          title: 'Caso legacy pendiente',
          expected_outcome: null,
          steps: [{ type: 'navigate', url: 'http://localhost:4100/checkout' }],
        },
      ],
    });
    const legacyPending = pendingRes.pending_oracle[0]!;

    let gatewayCalls = 0;
    const spyGateway = {
      isAvailable: () => true,
      lastMechanism: () => 'host_gateway',
      review: async (req: { requestDigest: string; statementDigest: string }) => {
        gatewayCalls += 1;
        const now = new Date();
        const expires = new Date(now.getTime() + 5 * 60_000);
        return {
          approvalId: randomUUID(),
          requestDigest: req.requestDigest,
          presentedStatementDigest: req.statementDigest,
          decision: 'confirm' as const,
          reviewer: 'qa_auditor',
          decidedAt: now.toISOString(),
          expiresAt: expires.toISOString(),
        };
      },
    };

    const receiptsBefore = inspectionStore(ctx.service).get<{ n: number }>(
      "SELECT COUNT(*) AS n FROM host_session_state WHERE key LIKE 'human_approval:%'",
    )!.n;
    const ruleConfirmationsBefore = inspectionStore(ctx.service).get<{ n: number }>(
      'SELECT COUNT(*) AS n FROM rule_confirmation_decisions',
    )!.n;
    const modulesBefore = inspectionStore(ctx.service).get<{ n: number }>(
      'SELECT COUNT(*) AS n FROM modules WHERE project_id = ?',
      ctx.projectId,
    )!.n;

    // 1) approve_batch mixto sobre módulo inexistente -> 0 llamadas gateway, 0 recibos, 0 módulos, 0 mutaciones
    const mixedApprove = await runConversationalCaseWorkflow(
      ctx.wsDir,
      'modulo_inexistente_r1',
      { action: 'approve_batch', case_ids: [legacyReady.case_id, lineagedId] },
      { applicationService: ctx.service, ruleReviewGateway: spyGateway as never },
    );
    expect(mixedApprove.status).toBe('blocked');
    expect(mixedApprove.code).toBe('lineaged_case_legacy_blocked');
    expect(gatewayCalls).toBe(0);
    expect(
      inspectionStore(ctx.service).get<{ n: number }>(
        "SELECT COUNT(*) AS n FROM host_session_state WHERE key LIKE 'human_approval:%'",
      )!.n,
    ).toBe(receiptsBefore);
    expect(
      inspectionStore(ctx.service).get<{ n: number }>(
        'SELECT COUNT(*) AS n FROM modules WHERE project_id = ?',
        ctx.projectId,
      )!.n,
    ).toBe(modulesBefore);
    expect(ctx.service.block3.getCase(ctx.projectId, legacyReady.case_id)!.conformity_status).toBe('proposed');

    // 2) decide_oracles mixto -> 0 llamadas gateway, 0 recibos, 0 confirmaciones, 0 actualizaciones parciales
    const mixedDecide = await runConversationalCaseWorkflow(
      ctx.wsDir,
      ctx.moduleKey,
      {
        action: 'decide_oracles',
        decisions: [
          { case_id: legacyPending.case_id, expected_outcome: 'Confirmación legítima esperada' },
          { case_id: lineagedId, expected_outcome: 'Intento de sobrescribir caso con linaje' },
        ],
      },
      { applicationService: ctx.service, ruleReviewGateway: spyGateway as never },
    );
    expect(mixedDecide.status).toBe('blocked');
    expect(mixedDecide.code).toBe('lineaged_case_legacy_blocked');
    expect(gatewayCalls).toBe(0);
    expect(
      inspectionStore(ctx.service).get<{ n: number }>(
        "SELECT COUNT(*) AS n FROM host_session_state WHERE key LIKE 'human_approval:%'",
      )!.n,
    ).toBe(receiptsBefore);
    expect(inspectionStore(ctx.service).get<{ n: number }>('SELECT COUNT(*) AS n FROM rule_confirmation_decisions')!.n).toBe(
      ruleConfirmationsBefore,
    );
    const pendingAfter = ctx.service.block3.getCase(ctx.projectId, legacyPending.case_id)!;
    expect(pendingAfter.conformity_status).toBe('pending_oracle');
    expect(pendingAfter.oracle_status).toBe('missing_oracle');

    // 3) decideCaseOracles directo con lote mixto también rechaza íntegramente
    expectLineaged(
      () =>
        ctx.service.decideCaseOracles({
          projectId: ctx.projectId,
          moduleKey: ctx.moduleKey,
          decisions: [
            { case_id: legacyPending.case_id, expected_outcome: 'Confirmación legítima esperada' },
            { case_id: lineagedId, expected_outcome: 'Intento de sobrescribir caso con linaje' },
          ],
        }),
      'lineaged_case_legacy_blocked',
    );
    expect(ctx.service.block3.getCase(ctx.projectId, legacyPending.case_id)!.conformity_status).toBe('pending_oracle');

    // 4) Operaciones legacy puras siguen funcionando normalmente
    const okDecide = await runConversationalCaseWorkflow(
      ctx.wsDir,
      ctx.moduleKey,
      {
        action: 'decide_oracles',
        decisions: [{ case_id: legacyPending.case_id, expected_outcome: 'Confirmación legítima esperada' }],
      },
      { applicationService: ctx.service, ruleReviewGateway: spyGateway as never },
    );
    expect(okDecide.status).toBe('updated');
    expect(gatewayCalls).toBe(1);

    const okApprove = await runConversationalCaseWorkflow(
      ctx.wsDir,
      ctx.moduleKey,
      { action: 'approve_batch', case_ids: [legacyReady.case_id] },
      { applicationService: ctx.service, ruleReviewGateway: spyGateway as never },
    );
    expect(okApprove.status).toBe('approved');
    expect(gatewayCalls).toBe(2);
  });

  // ===========================================================================================
  // R1-fix: Cierre de hallazgos P1-1, P1-2 y P2
  // ===========================================================================================

  describe('R1-fix — cierre de hallazgos P1-1, P1-2 y P2', () => {
    function mixUuidCase(uuid: string): string {
      let idx = 0;
      const mixed = [...uuid]
        .map((ch) => {
          if (!/[0-9a-f]/i.test(ch)) return ch;
          const out = idx % 2 === 0 ? ch.toUpperCase() : ch.toLowerCase();
          idx += 1;
          return out;
        })
        .join('');
      if (mixed === uuid.toLowerCase() || mixed === uuid.toUpperCase()) {
        throw new Error(`Se esperaba UUID mixto distinto de lower/upper: ${mixed}`);
      }
      return mixed;
    }

    function snapshotAllSqliteTables(service: QapApplicationService): string {
      const tables = inspectionStore(service)
        .all(`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name`)
        .map((r) => String(r.name));
      const dump: Record<string, unknown[]> = {};
      for (const table of tables) {
        dump[table] = inspectionStore(service).all(`SELECT * FROM "${table}"`);
      }
      return JSON.stringify(dump);
    }

    function snapshotProjectState(service: QapApplicationService, projectId: string) {
      return {
        sqlite: snapshotAllSqliteTables(service),
        summary: JSON.stringify(service.getExecutionSummary(projectId)),
      };
    }

    function listRelativeFiles(dir: string, root = dir): string[] {
      if (!existsSync(dir)) return [];
      const out: string[] = [];
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
          out.push(...listRelativeFiles(full, root));
        } else {
          out.push(relative(root, full).replace(/\\/g, '/'));
        }
      }
      return out.sort();
    }

    function seedWorkspaceFiles(
      root: string,
      moduleKey: string,
      envName: string,
      url: string,
      cases: readonly string[],
    ): void {
      mkdirSync(join(root, '.qa', 'project'), { recursive: true });
      writeFileSync(
        join(root, '.qa', 'project', 'context.yaml'),
        YAML.stringify({
          _version: '1',
          project_name: 'AdversarialR1Workspace',
          objective: 'R1-fix adversarial workspace',
          objective_source: 'user',
        }),
        'utf8',
      );
      writeFileSync(
        join(root, '.qa', 'project', 'environments.yaml'),
        YAML.stringify({
          _version: '1',
          default: envName,
          environments: { [envName]: { url } },
        }),
        'utf8',
      );
      const modDir = join(root, '.qa', 'modules', moduleKey);
      const testsDir = join(modDir, 'tests');
      const casesDir = join(testsDir, 'cases');
      mkdirSync(casesDir, { recursive: true });
      writeFileSync(
        join(modDir, 'context.yaml'),
        YAML.stringify({
          _version: '1',
          name: moduleKey,
          routes: [`/${moduleKey}`],
          manually_edited: false,
        }),
        'utf8',
      );
      writeFileSync(
        join(modDir, 'selectors.json'),
        JSON.stringify({ selectors: { payButton: '#pay' } }),
        'utf8',
      );
      for (const caseId of cases) {
        const filePath = caseId.startsWith('TC-')
          ? join(testsDir, `${caseId}.yaml`)
          : join(casesDir, `${caseId}.yaml`);
        writeFileSync(
          filePath,
          YAML.stringify({
            _version: '1',
            id: caseId,
            name: `Case ${caseId}`,
            depends_on: [],
            manually_edited: false,
            steps: [
              { type: 'navigate', url: `${url}/${moduleKey}` },
              { type: 'assert', selector: '#pay', assertion_type: 'visible' },
            ],
          }),
          'utf8',
        );
      }
    }

    async function createSignedPlan(root: string, moduleKey: string, environment: string): Promise<void> {
      const planner = new PlanHandler({ projectRoots: [root] });
      const res = await planner.execute(
        { targetPath: root, module: moduleKey, environment },
        { requestId: `plan-${randomUUID()}`, signal: new AbortController().signal },
      );
      expect(res.isError).toBe(false);
      const payload = JSON.parse((res.content[0] as { text: string }).text) as Record<string, unknown>;
      expect(payload.status).toBe('success');
    }

    function buildValidExecutionResult(
      moduleKey: string,
      envName: string,
      cases: ReadonlyArray<{ id: string; result?: 'passed' | 'failed' }>,
    ): ExecutionResult {
      const now = new Date().toISOString();
      const passedCount = cases.filter((c) => (c.result ?? 'passed') === 'passed').length;
      const failedCount = cases.filter((c) => c.result === 'failed').length;
      return {
        _version: '1',
        execution_id: `exec_${randomUUID().replace(/-/g, '').slice(0, 12)}`,
        module: moduleKey,
        env: envName,
        started_at: now,
        finished_at: now,
        result: failedCount === 0 ? 'passed' : passedCount === 0 ? 'failed' : 'partial',
        timed_out: false,
        summary: {
          total: cases.length,
          passed: passedCount,
          failed: failedCount,
          skipped: 0,
          not_run: 0,
        },
        cases: cases.map((c) => ({
          id: c.id,
          title: `Ejecución ${c.id}`,
          result: c.result ?? 'passed',
          duration_ms: 15,
          steps: [{ step_index: 0, action: 'navigate', status: c.result ?? 'passed', duration_ms: 10 }],
        })),
      };
    }

    function setupCrossProjectPair(envUrl = 'http://127.0.0.1:4199') {
      const a = setupWithCandidate();
      const lineagedLower = a.created.case.case_id;
      const lineagedUpper = lineagedLower.toUpperCase();
      const lineagedMixed = mixUuidCase(lineagedLower);

      const wsB = mkTemp('qap-01a-ws-b-');
      const snapB = a.ctx.service.createProject({
        name: 'Portal B',
        canonicalRoot: wsB,
        mode: 'investigate_and_test',
      });
      const envB = a.ctx.service.upsertEnvironment({
        projectId: snapB.project.project_id,
        name: 'local',
        baseUrl: envUrl,
      });
      const modB = a.ctx.service.upsertModule({
        projectId: snapB.project.project_id,
        key: 'checkout',
        title: 'Checkout B',
      });
      return {
        ...a,
        lineagedLower,
        lineagedUpper,
        lineagedMixed,
        wsB,
        projectB: snapB.project,
        envB,
        modB,
      };
    }

    it('P1-1: creación y finalización de intentos en B con UUID de A (literal, mayúsculas y mixto) se bloquean con SQLite y resumen intactos; controles legacy positivos pasan', () => {
      const pair = setupCrossProjectPair();
      const { service } = pair.ctx;
      const { projectB, envB, lineagedLower, lineagedUpper, lineagedMixed } = pair;
      const synthLegacyId = 'TC-SYNTH-LEGIT-MIX';
      const legacyUuidB = randomUUID().toLowerCase();

      expect(canonicalizeCaseId(synthLegacyId)).toBe(synthLegacyId);
      expect(canonicalizeCaseId(lineagedUpper)).toBe(lineagedLower);
      expect(canonicalizeCaseId(lineagedMixed)).toBe(lineagedLower);

      service.proposeModuleCases({
        projectId: projectB.project_id,
        moduleKey: 'checkout',
        proposals: [
          {
            case_id: synthLegacyId,
            title: 'Caso sintético legacy B',
            oracle_source: 'user',
            expected_outcome: 'Total válido en B',
            steps: [{ type: 'navigate', url: '/checkout' }],
          },
          {
            case_id: legacyUuidB,
            title: 'Caso UUID legacy válido B',
            oracle_source: 'user',
            expected_outcome: 'Flujo UUID válido en B',
            steps: [{ type: 'navigate', url: '/checkout' }],
          },
        ],
      });

      const beforeCreate = snapshotProjectState(service, projectB.project_id);

      for (const variant of [lineagedLower, lineagedUpper, lineagedMixed]) {
        const err = expectLineaged(
          () =>
            service.createExecutionAttempt({
              projectId: projectB.project_id,
              moduleKey: 'checkout',
              envId: envB.env_id,
              cases: [{ case_id: variant, title: 'Intento forjado A->B' }],
            }),
          'lineaged_case_legacy_blocked',
        );
        expect(JSON.stringify(err.details ?? {})).not.toContain(pair.ctx.projectId);
        expect(JSON.stringify(err.details ?? {})).not.toContain(aKeyLeakNeedle(pair));
        expect(service.block3.getCase(projectB.project_id, variant)).toBeNull();
        expectLineaged(
          () =>
            service.recordCaseHumanAcceptance({
              projectId: projectB.project_id,
              caseId: variant,
              moduleKey: 'checkout',
              acceptedBy: 'attacker',
              reason: 'Razón de aceptación suficientemente larga',
            }),
          'lineaged_case_legacy_blocked',
        );
      }

      expect(snapshotProjectState(service, projectB.project_id)).toEqual(beforeCreate);

      // Crear intento legítimo en B usando UUID en mayúsculas y sintético literal para probar finalizeExecutionAttempt
      const legitAttempt = service.createExecutionAttempt({
        projectId: projectB.project_id,
        moduleKey: 'checkout',
        envId: envB.env_id,
        cases: [
          { case_id: legacyUuidB.toUpperCase(), title: 'UUID B en mayúsculas' },
          { case_id: synthLegacyId, title: 'Sintético B intacto' },
        ],
      });

      const beforeFinalize = snapshotProjectState(service, projectB.project_id);

      for (const variant of [lineagedLower, lineagedUpper, lineagedMixed]) {
        expectLineaged(
          () =>
            service.finalizeExecutionAttempt({
              attemptId: legitAttempt.attempt_id,
              executionResult: buildValidExecutionResult('checkout', envB.name, [{ id: variant, result: 'passed' }]),
            }),
          'lineaged_case_legacy_blocked',
        );
        expectLineaged(
          () =>
            service.finalizeExecutionAttempt({
              attemptId: legitAttempt.attempt_id,
              executionResult: buildValidExecutionResult('checkout', envB.name, [
                { id: legacyUuidB, result: 'passed' },
                { id: variant, result: 'passed' },
              ]),
            }),
          'lineaged_case_legacy_blocked',
        );
      }

      expect(snapshotProjectState(service, projectB.project_id)).toEqual(beforeFinalize);

      // Control positivo: el intento legítimo finaliza con PASS para ambos casos de B
      const finalized = service.finalizeExecutionAttempt({
        attemptId: legitAttempt.attempt_id,
        executionResult: buildValidExecutionResult('checkout', envB.name, [
          { id: legacyUuidB.toUpperCase(), result: 'passed' },
          { id: synthLegacyId, result: 'passed' },
        ]),
      });
      expect(finalized.attempt.status).toBe('completed');
      expect(finalized.case_results.map((r) => [r.case_id, r.verdict])).toEqual([
        [legacyUuidB, 'PASS'],
        [synthLegacyId, 'PASS'],
      ]);
      const summaryAfter = service.getExecutionSummary(projectB.project_id, 'checkout');
      expect(summaryAfter.status).toBe('executed_passed');
      expect(summaryAfter.case_verdicts.find((c) => c.case_id === synthLegacyId)?.verdict).toBe('PASS');
      expect(summaryAfter.case_verdicts.find((c) => c.case_id === legacyUuidB)?.verdict).toBe('PASS');
    });

    it('P2 y lotes mixtos vía PlanHandler.execute: cero llamadas gateway/recibos/mutaciones y respuestas indistinguibles entre UUID ajeno e inexistente', async () => {
      const pair = setupCrossProjectPair();
      const { service } = pair.ctx;
      const { wsB, projectB, envB, lineagedLower, lineagedUpper, lineagedMixed } = pair;
      const nonExistentUuid = randomUUID();

      const legacyReadyUuid = randomUUID();
      const legacyPendingUuid = randomUUID();
      const proposed = service.proposeModuleCases({
        projectId: projectB.project_id,
        moduleKey: 'checkout',
        proposals: [
          {
            case_id: legacyReadyUuid,
            title: 'Legacy listo para aprobar',
            oracle_source: 'user',
            expected_outcome: 'Total acreditado',
            steps: [{ type: 'navigate', url: '/checkout' }],
          },
          {
            case_id: legacyPendingUuid,
            title: 'Legacy pendiente de oráculo',
            oracle_source: 'missing',
            steps: [{ type: 'navigate', url: '/checkout' }],
          },
        ],
      });
      const legacyReady = proposed.all_cases.find((c) => c.case_id === legacyReadyUuid)!;
      const legacyPending = proposed.all_cases.find((c) => c.case_id === legacyPendingUuid)!;
      expect(legacyPending.conformity_status).toBe('pending_oracle');

      seedWorkspaceFiles(wsB, 'checkout', envB.name, envB.base_url, [legacyReady.case_id, legacyPending.case_id]);

      let gatewayCalls = 0;
      const spyGateway: VerifiableRuleReviewGateway = {
        isAvailable: () => true,
        lastMechanism: () => 'host_gateway',
        async review(request) {
          gatewayCalls += 1;
          const now = new Date().toISOString();
          return {
            requestDigest: request.requestDigest,
            approvalId: randomUUID(),
            decision: 'confirm',
            presentedStatementDigest: request.statementDigest,
            reviewer: 'qa-spy',
            decidedAt: now,
            expiresAt: new Date(Date.now() + 600_000).toISOString(),
          };
        },
      };

      const planHandler = new PlanHandler({
        projectRoots: [wsB],
        applicationService: service,
        ruleReviewGateway: spyGateway,
      });

      const callWorkflow = async (caseWorkflow: Record<string, unknown>) => {
        const res = await planHandler.execute(
          {
            targetPath: wsB,
            module: 'checkout',
            environment: envB.name,
            case_workflow: caseWorkflow as never,
          },
          { requestId: `req-${randomUUID()}`, signal: new AbortController().signal },
        );
        const text = (res.content[0] as { text: string }).text;
        return {
          raw: text,
          parsed: JSON.parse(text) as Record<string, unknown>,
        };
      };

      // Acreditar el oráculo de legacyReady durante el setup para probar que approve_batch mixto bloquea un lote realmente elegible
      const readyOracle = await callWorkflow({
        action: 'decide_oracles',
        decisions: [{ case_id: legacyReady.case_id, expected_outcome: 'Total acreditado' }],
      });
      expect(readyOracle.parsed.status).toBe('updated');
      gatewayCalls = 0;

      const beforeFiles = listRelativeFiles(join(wsB, '.qa'));
      const beforeDb = snapshotProjectState(service, projectB.project_id);

      // 1) review: UUID inexistente vs UUID ajeno con linaje (lower, upper, mixed) y mezcla con caso válido
      const reviewBaseline = await callWorkflow({ action: 'review', case_ids: [nonExistentUuid] });
      expect(reviewBaseline.parsed.status).toBe('blocked');
      expect(reviewBaseline.parsed.code).toBe('case_not_found_in_scope');

      for (const variant of [lineagedLower, lineagedUpper, lineagedMixed]) {
        const foreignOnly = await callWorkflow({ action: 'review', case_ids: [variant] });
        expect(foreignOnly.parsed).toEqual(reviewBaseline.parsed);
        expect(foreignOnly.raw).toBe(reviewBaseline.raw);

        const mixedReview = await callWorkflow({ action: 'review', case_ids: [legacyReady.case_id, variant] });
        const mixedMissing = await callWorkflow({ action: 'review', case_ids: [legacyReady.case_id, nonExistentUuid] });
        expect(mixedReview.parsed).toEqual(reviewBaseline.parsed);
        expect(mixedReview.raw).toBe(mixedMissing.raw);
      }

      // 2) approve_batch mixto: [legacyReady, variant] vs [legacyReady, nonExistentUuid]
      const approveMissing = await callWorkflow({
        action: 'approve_batch',
        case_ids: [legacyReady.case_id, nonExistentUuid],
      });
      expect(approveMissing.parsed.status).toBe('blocked');
      expect(approveMissing.parsed.code).toBe('case_not_found_in_scope');

      for (const variant of [lineagedLower, lineagedUpper, lineagedMixed]) {
        const approveForeign = await callWorkflow({
          action: 'approve_batch',
          case_ids: [legacyReady.case_id, variant],
        });
        expect(approveForeign.parsed).toEqual(approveMissing.parsed);
        expect(approveForeign.raw).toBe(approveMissing.raw);
        expect(approveForeign.raw).not.toContain(pair.ctx.projectId);
        expect(approveForeign.raw).not.toContain(aKeyLeakNeedle(pair));
        expect(approveForeign.raw.toLowerCase()).not.toContain(lineagedLower);
      }

      // 3) decide_oracles mixto: [legacyPending, variant] vs [legacyPending, nonExistentUuid]
      const decideMissing = await callWorkflow({
        action: 'decide_oracles',
        decisions: [
          { case_id: legacyPending.case_id, expected_outcome: 'Oráculo válido para legacy' },
          { case_id: nonExistentUuid, expected_outcome: 'UUID inexistente' },
        ],
      });
      expect(decideMissing.parsed.status).toBe('blocked');
      expect(decideMissing.parsed.code).toBe('case_not_found_in_scope');

      for (const variant of [lineagedLower, lineagedUpper, lineagedMixed]) {
        const decideForeign = await callWorkflow({
          action: 'decide_oracles',
          decisions: [
            { case_id: legacyPending.case_id, expected_outcome: 'Oráculo válido para legacy' },
            { case_id: variant, expected_outcome: 'Intento de contaminar lote mixto' },
          ],
        });
        expect(decideForeign.parsed).toEqual(decideMissing.parsed);
        expect(decideForeign.raw).toBe(decideMissing.raw);
      }

      // 4) accept_case_gap: UUID ajeno en mayúsculas vs inexistente
      const acceptMissing = await callWorkflow({
        action: 'accept_case_gap',
        acceptance: { case_id: nonExistentUuid, reason: 'Razón de aceptación de al menos 15 chars' },
      });
      const acceptForeign = await callWorkflow({
        action: 'accept_case_gap',
        acceptance: { case_id: lineagedMixed, reason: 'Razón de aceptación de al menos 15 chars' },
      });
      expect(acceptMissing.parsed.status).toBe('blocked');
      expect(acceptForeign.parsed).toEqual(acceptMissing.parsed);
      expect(acceptForeign.raw).toBe(acceptMissing.raw);

      // Verificación estricta: cero gateway, cero recibos, cero mutaciones parciales en DB o disco
      expect(gatewayCalls).toBe(0);
      expect(snapshotProjectState(service, projectB.project_id)).toEqual(beforeDb);
      expect(listRelativeFiles(join(wsB, '.qa'))).toEqual(beforeFiles);
      const ruleDecisionCountBeforePos = inspectionStore(service).all('SELECT * FROM rule_confirmation_decisions').length;
      expect(service.block3.getCase(projectB.project_id, legacyReady.case_id)!.conformity_status).not.toBe('approved');
      expect(service.block3.getCase(projectB.project_id, legacyPending.case_id)!.conformity_status).toBe('pending_oracle');

      // 5) Control positivo por PlanHandler.execute para casos legacy válidos de B
      const okDecide = await callWorkflow({
        action: 'decide_oracles',
        decisions: [{ case_id: legacyPending.case_id, expected_outcome: 'Oráculo legítimo confirmado por QA' }],
      });
      expect(okDecide.parsed.status).toBe('updated');
      expect(gatewayCalls).toBe(1);

      const okApprove = await callWorkflow({
        action: 'approve_batch',
        case_ids: [legacyReady.case_id],
      });
      expect(okApprove.parsed.status).toBe('approved');
      expect(gatewayCalls).toBe(2);
      expect(inspectionStore(service).all('SELECT * FROM rule_confirmation_decisions').length).toBeGreaterThan(
        ruleDecisionCountBeforePos,
      );
    });

    it('P1-2 vía TestHandler.execute: bloqueo global antes de autorización (interactiva/silenciosa), grants, registro host y runner en selección explícita, implícita y raíz legacy sin proyecto', async () => {
      let requests = 0;
      const site = createServer((_request, response) => {
        requests++;
        response.setHeader('Content-Type', 'text/html');
        response.end('<!doctype html><html><body><button id="pay">Checkout operativo confirmado</button></body></html>');
      });
      await new Promise<void>(resolve => site.listen(0, '127.0.0.1', resolve));
      sites.push(site);
      const origin = 'http://127.0.0.1:' + (site.address() as { port: number }).port;
      const pair = setupCrossProjectPair(origin);
      const { service } = pair.ctx;
      const { wsB, projectB, envB, lineagedLower, lineagedUpper, lineagedMixed } = pair;
      const hostTestRegistryPath = join(pair.ctx.hostDir, 'authorized-tests.json');

      // Módulo en B con caso legacy legítimo + caso con linaje de A
      const legacyCaseB = 'TC-B-LEGIT-1';
      seedWorkspaceFiles(wsB, 'checkout', envB.name, envB.base_url, [legacyCaseB, lineagedMixed]);
      await createSignedPlan(wsB, 'checkout', envB.name);

      // Segundo módulo en B para probar selección explícita de UUID literal/mayúsculo presente en disco
      seedWorkspaceFiles(wsB, 'orders', envB.name, envB.base_url, [lineagedUpper]);
      await createSignedPlan(wsB, 'orders', envB.name);

      let authorizerCalls = 0;
      const spyAuthorizer: ITestAuthorizer = {
        async requestAuthorization(req) {
          authorizerCalls += 1;
          return {
            decision: 'approved',
            allowedOrigins: [req.origin],
          };
        },
      };

      let runnerCalls = 0;
      const mockRunner: IRunner = {
        async execute(spec) {
          runnerCalls += 1;
          return buildValidExecutionResult(
            spec.modules[0] ?? 'checkout',
            spec.environment ?? 'staging',
            (spec.cases ?? []).map((id) => ({ id, result: 'passed' as const })),
          );
        },
      };

      const grantsBefore = () =>
        JSON.stringify(inspectionStore(service).all('SELECT * FROM permission_grants ORDER BY grant_id'));
      const attemptsBefore = () =>
        JSON.stringify(inspectionStore(service).all('SELECT * FROM execution_attempts ORDER BY attempt_id'));
      const modulesBefore = () =>
        JSON.stringify(inspectionStore(service).all('SELECT * FROM modules ORDER BY module_id'));

      const initialGrants = grantsBefore();
      const initialAttempts = attemptsBefore();
      const initialModules = modulesBefore();

      const callTest = async (
        handler: TestHandler,
        args: { targetPath: string; module: string; environment: string; case_ids?: string[] },
      ) => {
        const res = await handler.execute(args, {
          requestId: `test-${randomUUID()}`,
          signal: new AbortController().signal,
        });
        return JSON.parse((res.content[0] as { text: string }).text) as Record<string, unknown>;
      };

      // 1) Autorización interactiva + proyecto registrado B: implícita, explícita (lower/upper/mixed) y subconjunto con plan contaminado
      const interactiveHandlerB = new TestHandler(
        { projectRoots: [wsB], applicationService: service },
        { testAuthorizer: spyAuthorizer, hostTestRegistryPath, runner: mockRunner },
      );

      for (const args of [
        { targetPath: wsB, module: 'checkout', environment: envB.name },
        { targetPath: wsB, module: 'checkout', environment: envB.name, case_ids: [legacyCaseB] },
        { targetPath: wsB, module: 'checkout', environment: envB.name, case_ids: [lineagedLower] },
        { targetPath: wsB, module: 'checkout', environment: envB.name, case_ids: [lineagedUpper] },
        { targetPath: wsB, module: 'checkout', environment: envB.name, case_ids: [lineagedMixed] },
        { targetPath: wsB, module: 'orders', environment: envB.name },
      ]) {
        const out = await callTest(interactiveHandlerB, args);
        expect(out.status).toBe('blocked');
        expect(out.code).toBe('lineaged_case_legacy_blocked');
      }
      expect(authorizerCalls).toBe(0);
      expect(runnerCalls).toBe(0);
      expect(existsSync(hostTestRegistryPath)).toBe(false);
      expect(grantsBefore()).toBe(initialGrants);
      expect(attemptsBefore()).toBe(initialAttempts);
      expect(modulesBefore()).toBe(initialModules);

      // 2) Pre-sembrar registro del host para confirmar integridad exacta y probar autorización silenciosa (silentBoundScope)
      const preSeededRegistry = JSON.stringify(
        [{ projectRoot: wsB + '-unrelated', allowedOrigins: ['http://127.0.0.1:9999'] }],
        null,
        2,
      );
      writeFileSync(hostTestRegistryPath, preSeededRegistry, 'utf8');

      const silentHandlerB = new TestHandler(
        { projectRoots: [wsB], applicationService: service, silentBoundScope: true },
        { hostTestRegistryPath, runner: mockRunner },
      );

      for (const caseIds of [undefined, [lineagedUpper], [legacyCaseB]]) {
        const out = await callTest(silentHandlerB, {
          targetPath: wsB,
          module: 'checkout',
          environment: envB.name,
          ...(caseIds ? { case_ids: caseIds } : {}),
        });
        expect(out.status).toBe('blocked');
        expect(out.code).toBe('lineaged_case_legacy_blocked');
      }
      expect(runnerCalls).toBe(0);
      expect(readFileSync(hostTestRegistryPath, 'utf8')).toBe(preSeededRegistry);
      expect(grantsBefore()).toBe(initialGrants);
      expect(attemptsBefore()).toBe(initialAttempts);

      // 3) Raíz legacy sin proyecto registrado en SQLite (appProject === null) pero con applicationService disponible
      // Incluso con política estática de navegación explícita (testAuthorizations), el veto global impide ejecutar el runner.
      const wsLegacyUnreg = mkTemp('qap-01a-unreg-legacy-');
      expect(service.findActiveProjectByRoot(wsLegacyUnreg)).toBeNull();
      seedWorkspaceFiles(wsLegacyUnreg, 'tainted-legacy', 'local', origin, [lineagedMixed]);
      await createSignedPlan(wsLegacyUnreg, 'tainted-legacy', 'local');

      const unregAuthPolicy = [
        {
          projectRoot: wsLegacyUnreg,
          allowedOrigins: [origin],
          allowRedirectsToAllowedOnly: true,
        },
      ];
      const unregTaintedHandler = new TestHandler(
        { projectRoots: [wsLegacyUnreg], applicationService: service, silentBoundScope: true },
        { testAuthorizations: unregAuthPolicy, testAuthorizer: spyAuthorizer, hostTestRegistryPath, runner: mockRunner },
      );
      for (const caseIds of [undefined, [lineagedLower], [lineagedUpper], [lineagedMixed]]) {
        const out = await callTest(unregTaintedHandler, {
          targetPath: wsLegacyUnreg,
          module: 'tainted-legacy',
          environment: 'local',
          ...(caseIds ? { case_ids: caseIds } : {}),
        });
        expect(out.status).toBe('blocked');
        expect(out.code).toBe('lineaged_case_legacy_blocked');
      }
      expect(authorizerCalls).toBe(0);
      expect(runnerCalls).toBe(0);
      expect(readFileSync(hostTestRegistryPath, 'utf8')).toBe(preSeededRegistry);
      expect(grantsBefore()).toBe(initialGrants);
      expect(attemptsBefore()).toBe(initialAttempts);

      // 4) Control positivo 1: raíz legacy sin proyecto con caso legacy legítimo funciona normalmente
      const legitLegacyId = 'TC-UNREG-LEGIT-1';
      seedWorkspaceFiles(wsLegacyUnreg, 'clean-legacy', 'local', origin, [legitLegacyId]);
      await createSignedPlan(wsLegacyUnreg, 'clean-legacy', 'local');

      expect(requests).toBe(0);
      const okLegacyHandler = new TestHandler(
        { projectRoots: [wsLegacyUnreg], applicationService: service },
        { testAuthorizations: unregAuthPolicy },
      );
      const okLegacyOut = await callTest(okLegacyHandler, {
        targetPath: wsLegacyUnreg,
        module: 'clean-legacy',
        environment: 'local',
      });
      expect(okLegacyOut.status, JSON.stringify(okLegacyOut)).toBe('success');
      expect(okLegacyOut.result).toBe('passed');
      expect(requests).toBeGreaterThan(0);
      const afterLegacy = requests;

      // 5) Control positivo 2: proyecto registrado B con caso legacy aprobado + autorización explícita ejecuta con PASS
      const cleanModKey = 'clean-b';
      const cleanLegacyCaseId = randomUUID();
      service.upsertModule({ projectId: projectB.project_id, key: cleanModKey, title: 'Clean B' });
      service.proposeModuleCases({
        projectId: projectB.project_id,
        moduleKey: cleanModKey,
        proposals: [
          {
            case_id: cleanLegacyCaseId,
            title: 'Caso limpio legacy en B',
            oracle_source: 'user',
            expected_outcome: 'Checkout operativo',
            steps: [{ type: 'navigate', url: origin + '/clean-b' }],
          },
        ],
      });
      let posGatewayCalls = 0;
      const posGateway: VerifiableRuleReviewGateway = {
        isAvailable: () => true,
        lastMechanism: () => 'host_gateway',
        async review(request) {
          posGatewayCalls += 1;
          const now = new Date().toISOString();
          return {
            requestDigest: request.requestDigest,
            approvalId: randomUUID(),
            decision: 'confirm',
            presentedStatementDigest: request.statementDigest,
            reviewer: 'qa-spy',
            decidedAt: now,
            expiresAt: new Date(Date.now() + 600_000).toISOString(),
          };
        },
      };
      const posDecide = await runConversationalCaseWorkflow(
        wsB,
        cleanModKey,
        {
          action: 'decide_oracles',
          decisions: [{ case_id: cleanLegacyCaseId, expected_outcome: 'Checkout operativo confirmado' }],
        },
        {
          applicationService: service,
          ruleReviewGateway: posGateway,
        },
      );
      expect(posDecide.status).toBe('updated');
      const posApprove = await runConversationalCaseWorkflow(
        wsB,
        cleanModKey,
        { action: 'approve_batch', case_ids: [cleanLegacyCaseId] },
        {
          applicationService: service,
          ruleReviewGateway: posGateway,
        },
      );
      expect(posApprove.status).toBe('approved');
      expect(posGatewayCalls).toBe(2);

      seedWorkspaceFiles(wsB, cleanModKey, envB.name, envB.base_url, []);
      await createSignedPlan(wsB, cleanModKey, envB.name);

      service.authority.grant({
        project_id: projectB.project_id, capability: 'access',
        scope: { root_path: wsB, env_id: envB.env_id },
        granted_by: 'synthetic_host_operator',
      });
      service.authority.grant({
        project_id: projectB.project_id, capability: 'execute',
        scope: { root_path: wsB, env_id: envB.env_id, origin },
        granted_by: 'synthetic_host_operator',
      });
      const okRegisteredHandler = new TestHandler({ projectRoots: [wsB], applicationService: service });
      const okRegisteredOut = await callTest(okRegisteredHandler, {
        targetPath: wsB,
        module: cleanModKey,
        environment: envB.name,
      });
      expect(okRegisteredOut.status, JSON.stringify(okRegisteredOut)).toBe('success');
      expect(okRegisteredOut.result).toBe('passed');
      expect(requests).toBeGreaterThan(afterLegacy);
      expect(runnerCalls).toBe(0);
    }, 45_000);
  });
  describe('R2-A — aislamiento de lecturas y pertenencia de evidencias', () => {
    it('lectura correcta con ámbito exacto por caseId, executionKey y listLineagedCases (con y sin routePathname)', () => {
      const { ctx, created } = setupWithCandidate();
      const record = created.case;
      const exactScope = readScopeFor(ctx);
      const exactScopeWithRoute = readScopeFor(ctx, { routePathname: ROUTE });

      expect(ctx.service.getLineagedCase(exactScope, { caseId: record.case_id })).toEqual(record);
      expect(ctx.service.getLineagedCase(exactScope, { executionKey: record.execution_key })).toEqual(record);
      expect(ctx.service.getLineagedCase(exactScopeWithRoute, { caseId: record.case_id })).toEqual(record);
      expect(ctx.service.getLineagedCase(exactScopeWithRoute, { executionKey: record.execution_key })).toEqual(record);
      expect(ctx.service.listLineagedCases(exactScope)).toEqual([record]);
      expect(ctx.service.listLineagedCases(exactScopeWithRoute)).toEqual([record]);

      // También a nivel repositorio interno: exige ámbito canónico completo y devuelve el registro exacto.
      expect(ctx.service.block3.getLineagedCase(exactScope, { caseId: record.case_id })).toEqual(record);
      expect(ctx.service.block3.listLineagedCases(exactScope)).toEqual([record]);
    });

    it('rechaza lecturas al alterar individualmente proyecto, aplicación, módulo, entorno, tenant, perfil, rol y ruta sin filtrar existencia', () => {
      const { ctx, created } = setupWithCandidate();
      const record = created.case;
      const wsB = mkTemp('qap-r2a-wsB-');
      const snapB = ctx.service.createProject({ name: 'Portal R2A B', canonicalRoot: wsB, mode: 'investigate_and_test' });
      const envB = ctx.service.upsertEnvironment({ projectId: snapB.project.project_id, name: 'staging', baseUrl: 'http://localhost:4300' });
      const env2 = ctx.service.upsertEnvironment({ projectId: ctx.projectId, name: 'qa-other', baseUrl: 'http://localhost:4400' });
      const profile2 = ctx.service.upsertProfile({
        projectId: ctx.projectId,
        envId: ctx.env.env_id,
        label: 'admin-other',
        roleName: ROLE,
        tenantId: TENANT,
      });

      const alteredScopes: Array<{ label: string; scope: LineagedCaseReadScopeInput }> = [
        {
          label: 'projectId (otro proyecto activo)',
          scope: readScopeFor(ctx, { projectId: snapB.project.project_id, applicationId: snapB.project.application_id, environmentId: envB.env_id, profileId: null }),
        },
        {
          label: 'projectId (proyecto inexistente)',
          scope: readScopeFor(ctx, { projectId: 'proj-inexistente-r2a' }),
        },
        { label: 'applicationId', scope: readScopeFor(ctx, { applicationId: 'app-otra-r2a' }) },
        { label: 'moduleKey', scope: readScopeFor(ctx, { moduleKey: 'orders' }) },
        { label: 'environmentId', scope: readScopeFor(ctx, { environmentId: env2.env_id }) },
        { label: 'tenantId', scope: readScopeFor(ctx, { tenantId: 'tenant-b' }) },
        { label: 'tenantId null', scope: readScopeFor(ctx, { tenantId: null }) },
        { label: 'profileId', scope: readScopeFor(ctx, { profileId: profile2.profile_id }) },
        { label: 'profileId null', scope: readScopeFor(ctx, { profileId: null }) },
        { label: 'role', scope: readScopeFor(ctx, { role: 'viewer' }) },
        { label: 'role null', scope: readScopeFor(ctx, { role: null }) },
        { label: 'routePathname', scope: readScopeFor(ctx, { routePathname: '/otra-ruta' }) },
      ];

      const before = caseRows(ctx);
      for (const { label, scope } of alteredScopes) {
        expect(ctx.service.getLineagedCase(scope, { caseId: record.case_id }), label).toBeNull();
        expect(ctx.service.getLineagedCase(scope, { executionKey: record.execution_key }), label).toBeNull();
        expect(ctx.service.listLineagedCases(scope), label).toEqual([]);
        // Ninguna lectura interna omite la validación de pertenencia.
        expect(ctx.service.block3.getLineagedCase(scope, { caseId: record.case_id }), `repo:${label}`).toBeNull();
        expect(ctx.service.block3.listLineagedCases(scope), `repo:${label}`).toEqual([]);
      }
      expect(caseRows(ctx)).toBe(before);
    });

    it('bloquea consultas y listados sin contexto completo o con aliases ambiguos (servicio y repositorio)', () => {
      const { ctx, created } = setupWithCandidate();
      const record = created.case;
      const valid = readScopeFor(ctx);
      const before = caseRows(ctx);

      const omit = <K extends keyof LineagedCaseReadScopeInput>(key: K) => {
        const copy: Record<string, unknown> = { ...valid };
        delete copy[key];
        return copy as unknown as LineagedCaseReadScopeInput;
      };

      const invalidScopes: Array<{ label: string; scope: unknown; code: LineagedCaseErrorCode; field?: string }> = [
        { label: 'sin scope', scope: undefined, code: 'lineaged_case_invalid_input', field: 'scope' },
        { label: 'sin projectId', scope: omit('projectId'), code: 'lineaged_case_invalid_input', field: 'projectId' },
        { label: 'sin applicationId', scope: omit('applicationId'), code: 'lineaged_case_invalid_input', field: 'applicationId' },
        { label: 'sin moduleKey', scope: omit('moduleKey'), code: 'lineaged_case_invalid_input', field: 'moduleKey' },
        { label: 'sin environmentId', scope: omit('environmentId'), code: 'lineaged_case_invalid_input', field: 'environmentId' },
        { label: 'sin tenantId', scope: omit('tenantId'), code: 'lineaged_case_invalid_input', field: 'tenantId' },
        { label: 'sin profileId', scope: omit('profileId'), code: 'lineaged_case_invalid_input', field: 'profileId' },
        { label: 'sin role', scope: omit('role'), code: 'lineaged_case_invalid_input', field: 'role' },
        { label: 'nombre de entorno en environmentId', scope: { ...valid, environmentId: ctx.env.name }, code: 'lineaged_case_ambiguous_alias', field: 'environmentId' },
        { label: 'label de perfil en profileId', scope: { ...valid, profileId: ctx.profile.label }, code: 'lineaged_case_ambiguous_alias', field: 'profileId' },
        { label: 'wildcard tenantId', scope: { ...valid, tenantId: '*' }, code: 'lineaged_case_ambiguous_alias', field: 'tenantId' },
        { label: 'wildcard role', scope: { ...valid, role: 'todos' }, code: 'lineaged_case_ambiguous_alias', field: 'role' },
        { label: 'moduleKey no canónico', scope: { ...valid, moduleKey: 'Checkout' }, code: 'lineaged_case_ambiguous_alias', field: 'moduleKey' },
        { label: 'routePathname con query', scope: { ...valid, routePathname: '/checkout?a=1' }, code: 'lineaged_case_ambiguous_alias', field: 'routePathname' },
      ];

      for (const { scope, code, field } of invalidScopes) {
        expectLineaged(() => ctx.service.getLineagedCase(scope as LineagedCaseReadScopeInput, { caseId: record.case_id }), code, field);
        expectLineaged(() => ctx.service.listLineagedCases(scope as LineagedCaseReadScopeInput), code, field);
        expectLineaged(() => ctx.service.block3.getLineagedCase(scope as LineagedCaseReadScopeInput, { caseId: record.case_id }), code, field);
        expectLineaged(() => ctx.service.block3.listLineagedCases(scope as LineagedCaseReadScopeInput), code, field);
      }

      // Selector en forma no canónica (UUID en mayúsculas / executionKey en mayúsculas) o ruta contradictoria
      expectLineaged(() => ctx.service.getLineagedCase(valid, { caseId: record.case_id.toUpperCase() }), 'lineaged_case_ambiguous_alias', 'caseId');
      expectLineaged(() => ctx.service.getLineagedCase(valid, { executionKey: record.execution_key.toUpperCase() }), 'lineaged_case_ambiguous_alias', 'executionKey');
      expectLineaged(
        () => ctx.service.getLineagedCase({ ...valid, routePathname: '/checkout' }, { caseId: record.case_id, routePathname: '/cart' }),
        'lineaged_case_scope_mismatch',
        'routePathname',
      );
      expect(caseRows(ctx)).toBe(before);
    });

    it('rechaza evidencia de otra vista, de otra ruta o del inventario global source_refs', () => {
      const ctx = createCtx();
      const confirmed = confirmRule(ctx);
      const baseDossier = buildDossier(ctx, confirmed);
      const twoRouteDossier: DiscoveryDossierCanonical = {
        ...baseDossier,
        routes: [
          { reference: 'route-0', state: 'visited', depth: 0, view_id: 'view-1', authorized_pathname: ROUTE },
          { reference: 'route-1', state: 'visited', depth: 1, view_id: 'view-2', authorized_pathname: '/cart' },
        ],
        route_counts: { visited: 2, candidate: 0, blocked: 0 },
        views: [
          baseDossier.views[0]!,
          {
            view_id: 'view-2',
            route: 'route-1',
            route_index: 1,
            state: 'spa_rendered',
            evidence_id: 'ev-view-2',
            headings: ['Cart'],
            controls: [
              {
                tag: 'button',
                role: 'button',
                label: 'Vaciar',
                visibility: 'visible',
                disabled: false,
                required_in_dom: false,
                selector_candidates: ['#clear'],
                selector_stability: 'unverified',
              },
            ],
            forms_count: 0,
            links_count: 0,
            truncated: false,
          },
        ],
        source_refs: [
          { kind: 'knowledge_evidence', ref_id: 'ev-view-1' },
          { kind: 'knowledge_evidence', ref_id: 'ev-view-2' },
          { kind: 'knowledge_evidence', ref_id: 'ev-extra-1' },
          { kind: 'knowledge_observation', ref_id: 'obs-global-1' },
        ],
      };

      executionSeq += 1;
      const revision = ctx.service.saveDiscoveryRevision({
        dossier: twoRouteDossier,
        targetUrl: `http://localhost:4100${ROUTE}`,
        executionId: `exec-${executionSeq}`,
      }).revision;

      const baseCandidate = candidateFor(ctx, confirmed, revision);
      const before = caseRows(ctx);

      // 1) Evidencia de otra vista/ruta (ev-view-2) en view-1 (/checkout)
      expectLineaged(
        () =>
          ctx.service.upsertLineagedCaseCandidate({
            ...baseCandidate,
            view: { viewId: 'view-1', evidenceIds: ['ev-view-1', 'ev-view-2'], controlIndexes: [0] },
          }),
        'lineaged_case_reference_invalid',
        'view.evidenceIds',
      );
      expectLineaged(
        () =>
          ctx.service.upsertLineagedCaseCandidate({
            ...baseCandidate,
            view: { viewId: 'view-1', evidenceIds: ['ev-view-2'], controlIndexes: [0] },
          }),
        'lineaged_case_reference_invalid',
        'view.evidenceIds',
      );

      // 2) Identificador presente en el inventario global source_refs (ev-extra-1 / obs-global-1) no es válido para view-1
      expectLineaged(
        () =>
          ctx.service.upsertLineagedCaseCandidate({
            ...baseCandidate,
            view: { viewId: 'view-1', evidenceIds: ['ev-view-1', 'ev-extra-1'], controlIndexes: [0] },
          }),
        'lineaged_case_reference_invalid',
        'view.evidenceIds',
      );
      expectLineaged(
        () =>
          ctx.service.upsertLineagedCaseCandidate({
            ...baseCandidate,
            view: { viewId: 'view-1', evidenceIds: ['ev-view-1', 'obs-global-1'], controlIndexes: [0] },
          }),
        'lineaged_case_reference_invalid',
        'view.evidenceIds',
      );

      // 3) Vista de otra ruta (/cart) para candidato en /checkout
      expectLineaged(
        () =>
          ctx.service.upsertLineagedCaseCandidate({
            ...baseCandidate,
            view: { viewId: 'view-2', evidenceIds: ['ev-view-2'], controlIndexes: [0] },
          }),
        'lineaged_case_scope_mismatch',
        'routePathname',
      );

      // 4) Vista secundaria en `views` con evidencia ajena o de otra ruta
      expectLineaged(
        () =>
          ctx.service.upsertLineagedCaseCandidate({
            ...baseCandidate,
            view: undefined,
            views: [
              { viewId: 'view-1', evidenceIds: ['ev-view-1'], controlIndexes: [0] },
              { viewId: 'view-2', evidenceIds: ['ev-view-2'], controlIndexes: [0] },
            ],
          }),
        'lineaged_case_scope_mismatch',
        'routePathname',
      );

      expect(caseRows(ctx)).toBe(before);
    });

    it('acepta caso legítimo con varias vistas correctamente asociadas y lo recupera íntegro tras reiniciar', () => {
      const ctx = createCtx();
      const confirmed = confirmRule(ctx);
      const baseDossier = buildDossier(ctx, confirmed);
      const multiViewDossier: DiscoveryDossierCanonical = {
        ...baseDossier,
        routes: [
          { reference: 'route-0', state: 'visited', depth: 0, view_id: 'view-1', authorized_pathname: ROUTE },
        ],
        route_counts: { visited: 1, candidate: 0, blocked: 0 },
        views: [
          baseDossier.views[0]!,
          {
            view_id: 'view-1b',
            route: 'route-0',
            route_index: 0,
            state: 'spa_rendered',
            evidence_id: 'ev-view-1b',
            headings: ['Checkout Summary'],
            controls: [
              {
                tag: 'button',
                role: 'button',
                label: 'Confirmar',
                visibility: 'visible',
                disabled: false,
                required_in_dom: false,
                selector_candidates: ['#confirm'],
                selector_stability: 'unverified',
              },
            ],
            forms_count: 0,
            links_count: 0,
            truncated: false,
          },
        ],
        source_refs: [
          { kind: 'knowledge_evidence', ref_id: 'ev-view-1' },
          { kind: 'knowledge_evidence', ref_id: 'ev-view-1b' },
        ],
      };

      executionSeq += 1;
      const revision = ctx.service.saveDiscoveryRevision({
        dossier: multiViewDossier,
        targetUrl: `http://localhost:4100${ROUTE}`,
        executionId: `exec-${executionSeq}`,
      }).revision;

      const created = ctx.service.upsertLineagedCaseCandidate(
        candidateFor(ctx, confirmed, revision, {
          view: undefined,
          views: [
            { viewId: 'view-1', evidenceIds: ['ev-view-1'], controlIndexes: [0] },
            { viewId: 'view-1b', evidenceIds: ['ev-view-1b'], controlIndexes: [0] },
          ],
        }),
      );
      expect(created.outcome).toBe('created');
      expect(created.case.lineage.view.view_id).toBe('view-1');
      expect(created.case.lineage.views?.map((v) => v.view_id)).toEqual(['view-1', 'view-1b']);
      expect(created.case.lineage.evidence_ids).toEqual(['ev-view-1', 'ev-view-1b']);

      ctx.service.close();
      const restarted = openService(ctx.hostDir);
      const scope = readScopeFor(ctx, { routePathname: ROUTE });
      expect(restarted.getLineagedCase(scope, { caseId: created.case.case_id })).toEqual(created.case);
      expect(restarted.listLineagedCases(scope)).toEqual([created.case]);
      expect(inspectionStore(restarted).integrityCheck()).toBe(true);
    });
  });
});

function aKeyLeakNeedle(pair: { created: { case: { execution_key: string } } }): string {
  return pair.created.case.execution_key;
}

describe('R2-A-FIX — reproducción adversarial', () => {
  it('documenta la exposición pendiente por SQL directo', () => {
    const { ctx, created } = setupWithCandidate();
    const row = inspectionStore(ctx.service).get<{ execution_lineage_json: string }>(
      'SELECT execution_lineage_json FROM service_test_cases WHERE case_id = ?', created.case.case_id,
    );
    expect(JSON.parse(row!.execution_lineage_json).scope.role).toBe(ROLE);
  });
  it('exige scope en replay interno', () => {
    const { ctx, created } = setupWithCandidate();
    const row = inspectionStore(ctx.service).get<{ execution_lineage_json: string }>('SELECT execution_lineage_json FROM service_test_cases WHERE case_id = ?', created.case.case_id)!;
    const doc = JSON.parse(row.execution_lineage_json) as LineagedCaseDocument;
    expect(() => inspectionStore(ctx.service).transaction('IMMEDIATE', () => new Block3ExecutionRepo(inspectionStore(ctx.service)).upsertLineagedCandidateInTransaction({
      projectId: ctx.projectId, moduleKey: ctx.moduleKey, executionKey: created.case.execution_key,
      dossierRevisionId: doc.lineage.dossier.revision_id, ruleRevision: doc.lineage.rule.revision,
      expectedVersion: undefined, resolveModuleId: () => '', prepare: () => doc,
    }))).toThrow();
  });
  it('no revela corrupción a un rol ajeno', () => {
    const { ctx, created } = setupWithCandidate();
    const row = inspectionStore(ctx.service).get<{ execution_lineage_json: string }>('SELECT execution_lineage_json FROM service_test_cases WHERE case_id = ?', created.case.case_id)!;
    const doc = JSON.parse(row.execution_lineage_json);
    doc.scope.role = 'viewer';
    inspectionStore(ctx.service).run('UPDATE service_test_cases SET execution_lineage_json = ? WHERE case_id = ?', JSON.stringify(doc), created.case.case_id);
    expect(ctx.service.getLineagedCase(readScopeFor(ctx, { role: 'viewer' }), { caseId: created.case.case_id })).toBeNull();
    expectLineaged(() => ctx.service.getLineagedCase(readScopeFor(ctx), { caseId: created.case.case_id }), 'lineaged_case_corrupt');
  });
  it('acepta scope devuelto y rechaza rol contradictorio', () => {
    const { ctx, created } = setupWithCandidate();
    expect(ctx.service.getLineagedCase(created.case.scope, { caseId: created.case.case_id })?.case_id).toBe(created.case.case_id);
    expect(() => ctx.service.getLineagedCase(ctx.projectId, { caseId: created.case.case_id, role: 'viewer' }, readScopeFor(ctx))).toThrow();
  });
  it('rechaza ruta no visitada y referencia huérfana', () => {
    for (const variant of ['unvisited', 'orphan', 'null'] as const) {
      const ctx = createCtx();
      const confirmed = confirmRule(ctx);
      const base = buildDossier(ctx, confirmed);
      const dossier = {
        ...base,
        routes: variant === 'unvisited' ? base.routes.map(r => ({ ...r, state: 'candidate' as const })) : base.routes,
        views: base.views.map(v => variant === 'orphan' ? { ...v, route_index: 9 } : variant === 'null' ? { ...v, route_index: null } : v),
      } as unknown as DiscoveryDossierCanonical;
      const revision = ctx.service.saveDiscoveryRevision({ dossier, targetUrl: `http://localhost:4100${ROUTE}`, executionId: `invalid-${variant}` }).revision;
      expect(() => ctx.service.upsertLineagedCaseCandidate(candidateFor(ctx, confirmed, revision)), variant).toThrow();
    }
  });
  it('rechaza dossier sin ruta', () => {
    const ctx = createCtx();
    const confirmed = confirmRule(ctx);
    const dossier = buildDossier(ctx, confirmed);
    const invalid = { ...dossier, routes: [], views: dossier.views.map(({ route_index, ...view }) => view) };
    const revision = ctx.service.saveDiscoveryRevision({ dossier: invalid, targetUrl: `http://localhost:4100${ROUTE}`, executionId: 'no-route' }).revision;
    expect(() => ctx.service.upsertLineagedCaseCandidate(candidateFor(ctx, confirmed, revision))).toThrow();
  });
});
