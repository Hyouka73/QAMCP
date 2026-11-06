import { randomBytes, randomUUID } from 'node:crypto';
import { channel } from 'node:diagnostics_channel';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { SqliteKnowledgeAdapter } from '@qap/knowledge';
import { SchemaValidator, type CanonicalClosureCommand, type CanonicalCoverageAssessment, type LifecycleState } from '@qap/shared';
import { expect } from 'vitest';

import { createMcpServer } from '../../server.js';
import type { HumanReviewRequest, HumanReviewDecision, IHumanReviewGateway, InterviewCommand, RequirementProposal } from '../../handlers/canonical-interview-service.js';
import { SqliteInterviewDraftStore } from '../../handlers/interview-draft-store.js';
import type { ModuleClosureReviewRequest, ModuleClosureReviewDecision, IModuleClosureReviewGateway } from '../../handlers/module-closure-gateway.js';
import { SqliteModuleClosureStore } from '../../handlers/module-closure-store.js';

export interface Question {
  id: string; version: number; category: string; module: string; text: string;
  options: Array<{ id: string; label: string }>; human_review_required: boolean;
}
export interface Payload {
  status: string; code?: string; fase: string; question: Question; requirement_id: string;
  revision: number; assessment: CanonicalCoverageAssessment; report_path: string;
  siguiente_accion: { tool: string; tipo: string; module?: string; canonical_interview?: InterviewCommand;
    pregunta?: { opciones: unknown[] }; descripcion: string };
}

/** Independent, explicitly populated synthetic host inboxes. Tool arguments cannot
 * grant authority. These decisions exercise the gateway contract, not real human consent. */
export class LifecycleReviewInbox implements IHumanReviewGateway, IModuleClosureReviewGateway {
  interviews: HumanReviewRequest[] = [];
  closures: ModuleClosureReviewRequest[] = [];
  private interviewDecisions = new Map<string, HumanReviewDecision>();
  private closureDecisions = new Map<string, ModuleClosureReviewDecision>();
  async review(request: HumanReviewRequest) {
    this.interviews.push(request);
    return this.interviewDecisions.get(request.requestDigest) ?? null;
  }
  async reviewClosure(request: ModuleClosureReviewRequest) {
    this.closures.push(request);
    return this.closureDecisions.get(request.requestDigest) ?? null;
  }
  approveInterview(request: HumanReviewRequest) {
    this.interviewDecisions.set(request.requestDigest, {
      requestDigest: request.requestDigest, presentedStatementDigest: request.statementDigest,
      approvalId: randomUUID(), decision: 'confirm', reviewer: 'synthetic-business-owner',
      decidedAt: new Date(Date.now() - 1000).toISOString(), expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });
  }
  approveClosure(request: ModuleClosureReviewRequest) {
    this.closureDecisions.set(request.requestDigest, {
      requestDigest: request.requestDigest, approvalId: randomUUID(), decision: 'approve',
      reviewer: 'synthetic-business-owner', decidedAt: new Date(Date.now() - 1000).toISOString(),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });
  }
}

export type LifecycleFixture = Awaited<ReturnType<typeof createLifecycleFixture>>;
const stages = channel('qap.e01.fixture');
function stage(name: string) {
  if (!stages.hasSubscribers) return () => undefined;
  const span = { stage: name, id: randomUUID() };
  stages.publish({ ...span, event: 'begin' });
  return () => { stages.publish({ ...span, event: 'end' }); };
}
export async function createLifecycleFixture(registerCleanup: (close: () => Promise<void>) => void, htmlOverride?: string) {
  const prepared = stage('fixture.prepare');
  const root = mkdtempSync(join(tmpdir(), 'qap-lifecycle-canonical-'));
  const http = createServer((req, res) => {
    expect(req.headers.cookie).toBeUndefined();
    expect(req.headers.authorization).toBeUndefined();
    res.setHeader('Content-Type', 'text/html');
    res.end(htmlOverride ?? '<html><body><h1>Synthetic catalog</h1><form><input required><button>Consultar</button></form></body></html>');
  });
  let client: Client | undefined, server: ReturnType<typeof createMcpServer> | undefined;
  let store: SqliteKnowledgeAdapter | undefined;
  let drafts: SqliteInterviewDraftStore | undefined, closure: SqliteModuleClosureStore | undefined;
  const path = join(root, 'knowledge.sqlite'), draftPath = join(root, 'drafts.sqlite'), closurePath = join(root, 'closure.sqlite');
  const scope = { projectRoot: root, applicationId: 'lifecycle-app', environmentId: 'local' };
  const draftKey = randomBytes(32), closureKey = randomBytes(32);
  function removeTemporaryRoot() {
    if (!resolve(root).startsWith(resolve(tmpdir()) + sep)) throw new Error('Unsafe temporary root');
    rmSync(root, { recursive: true, force: true });
  }
  registerCleanup(async () => {
    const cleaned = stage('fixture.cleanup');
    // Close every owned resource even when the test/setup failed. Never delete a
    // shared parent or a path computed outside this unique temporary root.
    try { await client?.close(); } finally {
      try { await server?.close(); } finally {
        try {
          http.closeAllConnections();
          if (http.listening) await new Promise<void>((ok, fail) => http.close(e => e ? fail(e) : ok()));
        } finally {
          try { drafts?.close(); } finally {
            try { closure?.close(); } finally {
              store?.close();
              removeTemporaryRoot();
              cleaned();
            }
          }
        }
      }
    }
  });
  await new Promise<void>(ok => http.listen(0, '127.0.0.1', ok));
  const origin = `http://127.0.0.1:${(http.address() as { port: number }).port}`;
  const knowledge = store = new SqliteKnowledgeAdapter(path);
  const time = new Date().toISOString();
  const trace = { source: 'synthetic', recorded_by: 'fixture', recorded_at: time,
    reason: 'Explicit synthetic host composition', review: 'unreviewed' as const, evidence_refs: [] };
  const names = ['catalog', 'orders', 'dashboard'];
  await knowledge.commit(scope.applicationId, [
    { kind: 'application', expected_revision: 0, trace, entity: { application_id: scope.applicationId, name: 'Synthetic lifecycle', base_url: origin, created_at: time } },
    { kind: 'environment', expected_revision: 0, trace, entity: {
      application_id: scope.applicationId, environment_id: scope.environmentId, name: 'local', base_url: origin,
      safe_domains: ['127.0.0.1'], is_production: false, destructive_actions_allowed: false,
    } },
    ...names.map(name => ({ kind: 'module' as const, expected_revision: 0, trace, entity: {
      id: `module-${name}`, key: name, application_id: scope.applicationId, title: `Synthetic ${name}`,
      certainty: 'pending_review' as const, criticality: 'medium' as const, dependencies: [],
      created_at: time, updated_at: time, is_active: true,
    } })),
  ]);
  const closureOptions = { ...scope, path: closurePath, key: closureKey,
    protection: 'host_private_directory_and_managed_key' as const };
  const draftOptions = { ...scope, path: draftPath, key: draftKey,
    protection: 'host_private_directory_and_managed_key' as const };
  drafts = new SqliteInterviewDraftStore({ ...draftOptions, initialize: true });
  closure = new SqliteModuleClosureStore({ ...closureOptions, initialize: true });
  const inbox = new LifecycleReviewInbox();
  const validator = new SchemaValidator();
  const moduleBindings = names.map(name => ({ plannedName: name, moduleId: `module-${name}`, moduleKey: name,
    moduleRevision: 1, applicationRevision: 1, environmentRevision: 1, provenance: 'host_declared' as const }));
  async function connect(authorized = true, boundNames = ['catalog', 'orders'], browserOverride?: { executable_path: string }) {
    server = createMcpServer({ projectRoots: [root], knowledgeBindings: [{ ...scope, store: knowledge,
      moduleBindings: moduleBindings.filter(b => boundNames.includes(b.plannedName)), humanReviewGateway: inbox, interviewDraftStore: drafts,
      moduleClosureStore: closure, moduleClosureReviewGateway: inbox }],
    discoveryAuthorizations: authorized ? [{ ...scope, environmentRevision: 1,
      authorization: { read_only_acknowledged: true, navigation_urls: names.map(n => `${origin}/${n}`), allowed_ips: ['127.0.0.1'] },
      dependencies: { browser: browserOverride ?? { channel: 'chrome' as const } } }] : [],
    });
    client = new Client({ name: 'canonical-lifecycle-test', version: '1' });
    const [a, b] = InMemoryTransport.createLinkedPair();
    await server.connect(b); await client.connect(a);
  }
  const lifecyclePath = join(root, '.qa', 'project', 'lifecycle.json');
  function lifecycle() {
    const state = JSON.parse(readFileSync(lifecyclePath, 'utf8')) as LifecycleState;
    expect(validator.validateLifecycleState(state)).toMatchObject({ valid: true });
    return state;
  }
  async function call(name: string, args: Record<string, unknown> = {}) {
    const called = stage(`mcp.${name}`);
    try {
      if (!client) throw new Error('Fixture disconnected');
      const response = await client.request({ method: 'tools/call', params: { name, arguments: { targetPath: root, ...args } } }, CallToolResultSchema);
      const item = response.content[0];
      if (item.type !== 'text') throw new Error('Expected MCP text response');
      if (existsSync(lifecyclePath)) lifecycle(); // Validate after every call, including rejected writes.
      return JSON.parse(item.text) as Payload;
    } finally { called(); }
  }
  const interview = (module: string, command: InterviewCommand) => call('qap_rules_set', { module, canonical_interview: command });
  const close = (module: string, command: CanonicalClosureCommand) => call('qap_module_close', { module, canonical_closure: command });
  async function approvedClosure(module: string, command: CanonicalClosureCommand) {
    const before = closure!.read(scope);
    expect(await close(module, command)).toMatchObject({ status: 'blocked', code: 'closure_review_pending' });
    expect(closure!.read(scope)).toEqual(before);
    const request = inbox.closures.at(-1)!;
    expect(request.plannedName).toBe(module); expect(request.action).toBe(command.action);
    inbox.approveClosure(request);
    return close(module, command);
  }
  async function confirm(module: string, question: Question, proposal: RequirementProposal, revision = 0) {
    const proposed = await interview(module, { action: revision ? 'correct' : 'propose', question_id: question.id,
      version: question.version, expected_revision: revision, proposal });
    expect(proposed.status).toBe(revision ? 'corrected' : 'pending_review');
    const command = { action: 'review' as const, question_id: question.id, version: proposed.question.version };
    const before = await knowledge.query(scope.applicationId, 'requirement');
    expect(await interview(module, command)).toMatchObject({ status: 'blocked', code: 'human_review_not_authorized' });
    expect(await knowledge.query(scope.applicationId, 'requirement')).toEqual(before);
    const request = inbox.interviews.at(-1)!;
    expect(request.proposal).toEqual(proposal);
    inbox.approveInterview(request);
    const result = await interview(module, command);
    expect(result).toMatchObject({ status: 'confirmed', revision: revision + 1 });
    expect(await knowledge.get(scope.applicationId, 'requirement', result.requirement_id)).toMatchObject({
      revision: revision + 1, entity: { validation_status: 'confirmed', provenance: 'developer_interview', ...proposal },
      trace: { source: 'canonical_interview_v1', review: 'reviewed' },
    });
    return { result, question: { ...proposed.question, version: proposed.question.version }, proposal };
  }
  const proposal: RequirementProposal = { title: 'Consultar el catálogo público',
    description: 'El visitante debe poder consultar los productos públicos disponibles.', category: 'functional',
    acceptance_criteria: ['La consulta muestra únicamente productos públicos disponibles.'] };
  async function ready(module = 'catalog') {
    const question = (await interview(module, { action: 'next' })).question;
    const confirmed = await confirm(module, question, proposal);
    // Synthetic scope explicitly excludes these categories. Never inferred from DOM.
    expect(await approvedClosure(module, { action: 'declare_non_applicable', decisions:
      (['business_rule', 'security', 'ui', 'ux', 'regression', 'performance'] as const).map(category => ({
        category, reason: `El alcance sintético de consulta excluye expresamente ${category}.`,
      })) })).toMatchObject({ status: 'declared_non_applicable' });
    expect(await close(module, { action: 'evaluate' })).toMatchObject({ status: 'evaluated', assessment: {
      specification_coverage: { status: 'complete', confirmed_requirements_count: 1 },
      execution_coverage: { status: 'not_executed' }, closure_verdict: 'ready_for_closure',
    } });
    return confirmed;
  }
  async function working(namesToPlan = ['catalog']) {
    const initialized = await call('qap_init', { baseUrl: origin });
    expect(initialized).toMatchObject({ status: 'success', fase: 'ONBOARDING' });
    expect(await call('qap_context_set', { framework: 'react', app_type: 'spa',
      objective: 'Validar la consulta sintética del catálogo', roles: [{ name: 'visitante' }],
      critical_flows: [{ name: 'Consultar catálogo' }], source_of_truth: { type: 'none', declared: true },
    })).toMatchObject({ status: 'success', fase: 'SCOPING' });
    expect(await call('qap_session_plan', { plan: namesToPlan.map((module, i) => ({ module, path: `/${module}`,
      priority: i === 0 ? 'high' : 'medium' })), auth: { required: false },
    })).toMatchObject({ status: 'success', fase: 'WORKING' });
    return initialized;
  }
  async function discover(module = 'catalog') {
    const before = readFileSync(lifecyclePath, 'utf8');
    const result = await call('qap_discover', { name: module, path: `/${module}` });
    expect(result).toMatchObject({ acquisition_status: 'completed', persistence: 'committed',
      module_identity_status: 'resolved', association_status: 'confirmed',
      cleanup: { browser_closed: true, proxy_closed: true } });
    expect(readFileSync(lifecyclePath, 'utf8')).toBe(before);
    expect(existsSync(join(root, '.qa', 'modules', module, 'rules.yaml'))).toBe(false);
    return result;
  }
  async function restart(authorized = true, boundNames = ['catalog', 'orders'], browserOverride?: { executable_path: string }) {
    await client?.close(); await server?.close();
    drafts?.close(); closure?.close();
    drafts = new SqliteInterviewDraftStore(draftOptions);
    closure = new SqliteModuleClosureStore(closureOptions);
    await connect(authorized, boundNames, browserOverride);
  }
  function integrity() {
    for (const file of [path, draftPath, closurePath]) {
      const db = new DatabaseSync(file, { readOnly: true });
      try {
        expect(db.prepare('PRAGMA integrity_check').all()).toEqual([{ integrity_check: 'ok' }]);
        expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
      } finally { db.close(); }
    }
  }
  await connect();
  prepared();
  return { root, scope, path, knowledge, inbox, call, interview, close, approvedClosure, confirm, proposal,
    ready, working, discover, restart, lifecycle, lifecyclePath, integrity,
    durable: () => closure!.read(scope), drafts: () => drafts!.read(scope) };
}
