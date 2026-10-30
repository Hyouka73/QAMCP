import { randomBytes, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { pathToFileURL } from 'node:url';

import { SqliteKnowledgeAdapter } from '@qap/knowledge';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CanonicalInterviewService, type HumanReviewDecision, type HumanReviewRequest, type IHumanReviewGateway } from '../handlers/canonical-interview-service.js';
import { SqliteInterviewDraftStore, type SqliteInterviewDraftOptions } from '../handlers/interview-draft-store.js';
import type { BridgeContext } from '../handlers/module-observation-bridge.js';

const roots: string[] = [], closers: Array<() => void> = [];
const proposal = { title: 'Consultar catálogo privado', description: 'El catálogo debe conservar el dato PRIVADO_R4_72618 y permitir su consulta.', category: 'functional' as const };
const time = '2026-10-30T12:00:00.000Z';
afterEach(() => { vi.restoreAllMocks(); closers.splice(0).reverse().forEach(close => close()); roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })); });
async function fixture(gateway?: IHumanReviewGateway) {
  const root = mkdtempSync(join(tmpdir(), 'qap-r4-')); roots.push(root);
  mkdirSync(join(root, '.qa', 'project'), { recursive: true });
  const lifecyclePath = join(root, '.qa', 'project', 'lifecycle.json');
  const lifecycle = { _version: '1', phase: 'WORKING', modules: { catalog: { state: 'planned', updated_at: time } },
    session: { id: 's', started_at: time, plan: [{ module: 'catalog', path: '/' }], auth: { required: false } }, history: [] };
  writeFileSync(lifecyclePath, JSON.stringify(lifecycle));
  const knowledgePath = join(root, 'canonical.sqlite'), store = new SqliteKnowledgeAdapter(knowledgePath); closers.push(() => store.close());
  const trace = { source: 'synthetic', recorded_by: 'fixture', recorded_at: time, reason: 'Authorized synthetic fixture', review: 'unreviewed' as const, evidence_refs: [] };
  await store.commit('a', [
    { kind: 'application', expected_revision: 0, trace, entity: { application_id: 'a', name: 'Synthetic', base_url: 'https://example.invalid', created_at: time } },
    { kind: 'environment', expected_revision: 0, trace, entity: { application_id: 'a', environment_id: 'local', name: 'local', base_url: 'https://example.invalid', safe_domains: ['example.invalid'], is_production: false, destructive_actions_allowed: false } },
    { kind: 'module', expected_revision: 0, trace, entity: { id: 'm', application_id: 'a', key: 'catalog', title: 'Synthetic', certainty: 'pending_review', criticality: 'medium', dependencies: [], created_at: time, updated_at: time, is_active: true } },
  ]);
  const context: BridgeContext = { projectRoot: root, applicationId: 'a', environmentId: 'local', moduleBindings: [{ plannedName: 'catalog', moduleId: 'm', moduleKey: 'catalog', moduleRevision: 1, applicationRevision: 1, environmentRevision: 1, provenance: 'host_declared' }] };
  const options: SqliteInterviewDraftOptions = { ...context, path: join(root, 'drafts.sqlite'), key: randomBytes(32), protection: 'host_private_directory_and_managed_key' };
  function open(initialize = false) { const s = new SqliteInterviewDraftStore({ ...options, initialize }); closers.push(() => s.close()); return s; }
  const drafts = open(true);
  function service(s = drafts, c = context, g = gateway) { return new CanonicalInterviewService(store, c, g, s); }
  return { root, store, knowledgePath, options, context, drafts, open, service, lifecyclePath, lifecycle };
}
async function pending(service: CanonicalInterviewService) {
  const next = await service.execute('catalog', { action: 'next' }), q = next.question as { id: string };
  expect(q).toBeDefined();
  expect(await service.execute('catalog', { action: 'propose', question_id: q.id, version: 0, expected_revision: 0, proposal })).toMatchObject({ status: 'pending_review' });
  return { action: 'review', question_id: q.id, version: 1 };
}
function decision(request: HumanReviewRequest, action: HumanReviewDecision['decision'] = 'confirm'): HumanReviewDecision {
  return { requestDigest: request.requestDigest, presentedStatementDigest: request.statementDigest,
    approvalId: randomUUID(), reviewer: 'synthetic-independent-owner', decision: action,
    decidedAt: new Date(Date.now() - 1000).toISOString(), expiresAt: new Date(Date.now() + 60_000).toISOString() };
}

describe('R4 encrypted durable interview state', () => {
  it('recovers exact drafts, corrections, defer/resume and history across closed connections', async () => {
    const f = await fixture(), cmd = await pending(f.service());
    const before = f.drafts.read(f.context); f.drafts.close();
    const reopened = f.open(), service = f.service(reopened);
    expect(reopened.read(f.context)).toEqual(before);
    expect(await service.execute('catalog', { ...cmd, action: 'defer' })).toMatchObject({ status: 'deferred', question: { version: 2 } });
    reopened.close();
    const again = f.open(), resumed = f.service(again);
    expect(await resumed.status('catalog')).toMatchObject({ deferred_questions: 1, pending_proposals: 1 });
    expect(await resumed.execute('catalog', { ...cmd, action: 'resume', version: 2 })).toMatchObject({ status: 'pending_review', question: { version: 3 } });
    expect(await resumed.execute('catalog', { ...cmd, action: 'correct', version: 3, expected_revision: 0, proposal: { ...proposal, title: 'Catálogo corregido por propietario' } })).toMatchObject({ status: 'corrected', question: { version: 4 } });
    again.close();
    expect(await f.service(f.open()).status('catalog')).toMatchObject({ corrected_proposals: 1, confirmed_requirements: 0 });
    const db = new DatabaseSync(f.options.path); expect(db.prepare('SELECT count(*) AS n FROM interview_history').get()?.n).toBe(5); db.close();
    for (const base of [f.options.path, f.knowledgePath]) for (const suffix of ['', '-wal', '-shm']) {
      if (existsSync(base + suffix)) expect(readFileSync(base + suffix).includes(Buffer.from('PRIVADO_R4_72618'))).toBe(false);
    }
  });

  it.each(['reject', 'defer'] as const)('persists host %s and prevents old decision replay', async action => {
    let approved: HumanReviewDecision | null = null, request: HumanReviewRequest;
    const gateway = { review: async (r: HumanReviewRequest) => { request = r; return approved; } };
    const f = await fixture(gateway), cmd = await pending(f.service());
    await f.service().execute('catalog', cmd); approved = decision(request!, action);
    expect(await f.service().execute('catalog', cmd)).toMatchObject({ status: action === 'reject' ? 'rejected' : 'deferred' });
    f.drafts.close(); const s = f.service(f.open());
    expect(await s.status('catalog')).toMatchObject(action === 'reject' ? { rejected_proposals: 1 } : { deferred_questions: 1 });
    expect(await s.execute('catalog', cmd)).toMatchObject({ code: 'proposal_version_conflict' });
    expect((await f.store.query('a', 'requirement')).items).toHaveLength(0);
  });

  it('two independent connections serialize writers, detect stale versions and preserve the winner', async () => {
    const f = await fixture(), a = f.service(), cmd = await pending(a), other = f.open(), b = f.service(other);
    const write = { ...cmd, action: 'correct', expected_revision: 0, proposal: { ...proposal, title: 'Nueva propuesta concurrente' } };
    const results = await Promise.all([a.execute('catalog', write), b.execute('catalog', write)]);
    expect(results.filter(r => r.status === 'corrected')).toHaveLength(1);
    expect(results.filter(r => r.code === 'draft_conflict' || r.code === 'proposal_version_conflict')).toHaveLength(1);
    expect(other.read(f.context).questions.find(q => q.id === cmd.question_id)?.version).toBe(2);
    expect(await b.execute('catalog', write)).toMatchObject({ code: 'proposal_version_conflict' });
    expect(await b.execute('catalog', { ...write, version: 2 })).toMatchObject({ question: { version: 2 } });
  });

  it('rolls back failed physical writes and reports unknown status when storage closes', async () => {
    const f = await fixture(), cmd = await pending(f.service()), before = f.drafts.read(f.context);
    const db = new DatabaseSync(f.options.path);
    db.exec("CREATE TRIGGER fail_write BEFORE INSERT ON interview_history BEGIN SELECT RAISE(ABORT, 'PRIVATE_R4_72618'); END");
    const result = await f.service().execute('catalog', { ...cmd, action: 'defer' });
    expect(result).toMatchObject({ code: 'draft_write_failed' }); expect(JSON.stringify(result)).not.toContain('PRIVATE_R4');
    expect(f.drafts.read(f.context)).toEqual(before);
    expect(db.prepare('PRAGMA integrity_check').get()?.integrity_check).toBe('ok'); db.close(); f.drafts.close();
    expect(await f.service().status('catalog')).toMatchObject({ availability: 'unavailable', pending_questions: 'unknown' });
    expect((await f.store.query('a', 'requirement')).items).toHaveLength(0);
  });

  it('reconciles canonical commit followed by failed draft commit without a second approval', async () => {
    let approved: HumanReviewDecision | null = null, request: HumanReviewRequest, calls = 0;
    const f = await fixture({ review: async r => { calls++; request = r; return approved; } });
    const s = f.service(), cmd = await pending(s); await s.execute('catalog', cmd); approved = decision(request!);
    const db = new DatabaseSync(f.options.path);
    db.exec("CREATE TRIGGER fail_write BEFORE INSERT ON interview_history BEGIN SELECT RAISE(ABORT, 'failure'); END");
    expect(await s.execute('catalog', cmd)).toMatchObject({ code: 'draft_write_failed' });
    const canonical = (await f.store.query('a', 'requirement')).items[0]; expect(canonical.revision).toBe(1);
    db.exec('DROP TRIGGER fail_write'); db.close(); f.drafts.close();
    const recovered = f.service(f.open());
    expect(await recovered.status('catalog')).toMatchObject({ confirmed_requirements: 1, pending_proposals: 0 });
    expect(await recovered.execute('catalog', cmd)).toMatchObject({ status: 'confirmed', idempotent: true });
    expect(calls).toBe(2);
    expect((await f.store.history('a', 'requirement', canonical.id)).items).toHaveLength(1);
    expect((await f.store.query('a', 'relation')).items).toHaveLength(1);
  });

  it.each(['project', 'application', 'environment', 'session', 'inactive', 'revision'] as const)('blocks restored draft in changed %s', async mode => {
    const f = await fixture(), cmd = await pending(f.service()), c = structuredClone(f.context);
    if (mode === 'project') { c.projectRoot = mkdtempSync(join(tmpdir(), 'qap-other-')); roots.push(c.projectRoot); }
    if (mode === 'application') c.applicationId = 'other';
    if (mode === 'environment') c.environmentId = 'other';
    if (mode === 'revision') c.moduleBindings = c.moduleBindings!.map(b => ({ ...b, moduleRevision: 2 }));
    if (mode === 'session') { f.lifecycle.session.id = 'new'; writeFileSync(f.lifecyclePath, JSON.stringify(f.lifecycle)); }
    if (mode === 'inactive') {
      const record = (await f.store.get('a', 'module', 'm'))!;
      await f.store.commit('a', [{ kind: 'module', entity: { ...record.entity, is_active: false }, expected_revision: 1, trace: record.trace }]);
    }
    expect(await f.service(f.open(), c).execute('catalog', cmd)).toMatchObject({ status: 'blocked' });
    expect((await f.store.query('a', 'requirement')).items).toHaveLength(0);
  });

  it('does not create on read, adopt foreign schemas, accept wrong keys or destroy damaged state', async () => {
    const f = await fixture(); await pending(f.service());
    expect(() => new SqliteInterviewDraftStore({ ...f.options, protection: undefined! })).toThrow('scope_mismatch');
    expect(() => new SqliteInterviewDraftStore({ ...f.options, key: randomBytes(31) })).toThrow('scope_mismatch');
    expect(() => new SqliteInterviewDraftStore({ ...f.options, initialize: true })).toThrow('incompatible');
    const missing = new SqliteInterviewDraftStore({ ...f.options, path: join(f.root, 'missing.sqlite') });
    expect(() => missing.read(f.context)).toThrow('not_initialized'); expect(existsSync(join(f.root, 'missing.sqlite'))).toBe(false); missing.close();
    const wrong = new SqliteInterviewDraftStore({ ...f.options, key: randomBytes(32) });
    expect(() => wrong.read(f.context)).toThrow('corrupt'); wrong.close();
    const foreignPath = join(f.root, 'foreign.sqlite'), foreign = new DatabaseSync(foreignPath);
    foreign.exec('CREATE TABLE precious(value TEXT); INSERT INTO precious VALUES (\'preserve\')'); foreign.close();
    const incompatible = new SqliteInterviewDraftStore({ ...f.options, path: foreignPath });
    expect(() => incompatible.read(f.context)).toThrow('incompatible'); incompatible.close();
    const db = new DatabaseSync(foreignPath); expect(db.prepare('SELECT value FROM precious').get()?.value).toBe('preserve'); db.close();
    const versioned = new DatabaseSync(f.options.path); versioned.exec('UPDATE interview_meta SET version=2');
    const unknownVersion = f.open(); expect(() => unknownVersion.read(f.context)).toThrow('incompatible');
    expect(versioned.prepare('SELECT version FROM interview_meta').get()?.version).toBe(2);
    versioned.exec('UPDATE interview_meta SET version=1'); versioned.close();
    const brokenPath = join(f.root, 'broken.sqlite'); writeFileSync(brokenPath, 'broken sqlite fixture');
    const broken = new SqliteInterviewDraftStore({ ...f.options, path: brokenPath });
    expect(() => broken.read(f.context)).toThrow('corrupt'); broken.close();
    expect(readFileSync(brokenPath, 'utf8')).toBe('broken sqlite fixture');
    f.drafts.close(); const damaged = new DatabaseSync(f.options.path);
    damaged.exec("UPDATE interview_history SET payload = zeroblob(40) WHERE generation=(SELECT max(generation) FROM interview_history)"); damaged.close();
    const corrupt = f.open(); expect(() => corrupt.read(f.context)).toThrow('corrupt');
    expect(await f.service(corrupt).execute('catalog', { action: 'next' })).toMatchObject({ code: 'draft_corrupt' });
  });

  it.each(['expired', 'revoked', 'altered', 'absent', 'unavailable'] as const)('reopened proposal has no authority with %s gateway decision', async mode => {
    let authorized: HumanReviewDecision | null = null, request: HumanReviewRequest;
    const gateway = { review: async (r: HumanReviewRequest) => { request = r; if (mode === 'unavailable') throw new Error(proposal.description); return authorized; } };
    const f = await fixture(gateway), cmd = await pending(f.service());
    await f.service().execute('catalog', cmd);
    if (mode !== 'unavailable') authorized = decision(request!);
    if (mode === 'expired') authorized!.expiresAt = new Date(Date.now() - 1).toISOString();
    if (mode === 'revoked') authorized = null;
    if (mode === 'altered') authorized!.presentedStatementDigest = 'altered';
    f.drafts.close(); const s = new CanonicalInterviewService(f.store, f.context, mode === 'absent' ? undefined : gateway, f.open());
    const result = await s.execute('catalog', cmd);
    expect(result.status).toBe('blocked'); expect(JSON.stringify(result)).not.toContain(proposal.description);
    expect((await f.store.query('a', 'requirement')).items).toHaveLength(0);
  });

  it('retains consumed reject IDs across restart and requires fresh review for reactivation', async () => {
    let authorized: HumanReviewDecision | null = null, request: HumanReviewRequest;
    const f = await fixture({ review: async r => { request = r; return authorized; } }), cmd = await pending(f.service());
    await f.service().execute('catalog', cmd); authorized = decision(request!, 'reject');
    await f.service().execute('catalog', cmd); f.drafts.close();
    const s = f.service(f.open());
    expect(await s.execute('catalog', { ...cmd, action: 'correct', version: 2, expected_revision: 0, proposal })).toMatchObject({ status: 'corrected', question: { version: 3 } });
    await s.execute('catalog', { ...cmd, version: 3 });
    authorized = { ...decision(request!), approvalId: authorized.approvalId };
    expect(await s.execute('catalog', { ...cmd, version: 3 })).toMatchObject({ code: 'human_review_invalid' });
    authorized = decision(request!);
    expect(await s.execute('catalog', { ...cmd, version: 3 })).toMatchObject({ status: 'confirmed' });
  });

  it('SQLite rolls back a writer process that exits before COMMIT', async () => {
    const f = await fixture(); await pending(f.service()); const before = f.drafts.read(f.context); f.drafts.close();
    const child = spawnSync(process.execPath, ['--input-type=module', '-e', `
      import {DatabaseSync} from 'node:sqlite';
      const db=new DatabaseSync(process.argv[1]); db.exec('BEGIN IMMEDIATE');
      db.exec('INSERT INTO interview_history SELECT generation+1,payload FROM interview_history ORDER BY generation DESC LIMIT 1');
      process.exit(23);
    `, f.options.path], { encoding: 'utf8', timeout: 10000 });
    expect(child.status).toBe(23); expect(f.open().read(f.context)).toEqual(before);
    const db = new DatabaseSync(f.options.path); expect(db.prepare('PRAGMA integrity_check').get()?.integrity_check).toBe('ok'); db.close();
    expect((await f.store.query('a', 'requirement')).items).toHaveLength(0);
  });

  it('terminates Node processes between real MCP SDK operations and reopens both physical stores', async () => {
    const f = await fixture(); f.drafts.close(); f.store.close();
    const script = `
      import { Client } from '@modelcontextprotocol/sdk/client/index.js';
      import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
      import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
      import { SqliteKnowledgeAdapter } from '@qap/knowledge';
      const { createMcpServer, SqliteInterviewDraftStore } = await import(process.env.QAP_R4_DIST);
      let data=''; for await(const chunk of process.stdin) data+=chunk;
      const p=JSON.parse(data), store=new SqliteKnowledgeAdapter(p.knowledgePath);
      const drafts=new SqliteInterviewDraftStore({...p.options,key:Buffer.from(p.key,'hex')});
      let request;
      const gateway={ review: async r => { request=r; return p.decision ?? null; } };
      const server=createMcpServer({projectRoots:[p.context.projectRoot],knowledgeBindings:[{...p.context,store,interviewDraftStore:drafts,humanReviewGateway:gateway}]});
      const client=new Client({name:'r4-process',version:'1'}), [a,b]=InMemoryTransport.createLinkedPair();
      await server.connect(b); await client.connect(a);
      const results=[];
      for(const command of p.commands) {
        const r=await client.request({method:'tools/call',params:command.action==='status'?
          {name:'qap_status',arguments:{targetPath:p.context.projectRoot}}:
          {name:'qap_rules_set',arguments:{targetPath:p.context.projectRoot,module:'catalog',canonical_interview:command}}},CallToolResultSchema);
        results.push(JSON.parse(r.content[0].text));
      }
      const snapshot=drafts.read(p.context);
      const exact=snapshot.questions.find(q=>q.proposal)?.proposal.description===p.expected;
      await client.close(); await server.close(); drafts.close(); store.close();
      process.stdout.write(JSON.stringify({results,exact,request:request&&{requestDigest:request.requestDigest,statementDigest:request.statementDigest}}));
    `;
    const child = (commands: unknown[], d?: HumanReviewDecision) => {
      const r = spawnSync(process.execPath, ['--input-type=module', '-e', script], { cwd: resolve('.'), encoding: 'utf8',
        env: { ...process.env, QAP_R4_DIST: pathToFileURL(resolve('dist/index.js')).href },
        input: JSON.stringify({ knowledgePath: f.knowledgePath, context: f.context, options: { ...f.options, key: undefined }, key: Buffer.from(f.options.key).toString('hex'), commands, decision: d, expected: proposal.description }), timeout: 30000 });
      expect(r.status, r.stderr).toBe(0); expect(r.stdout).not.toContain(proposal.description);
      return JSON.parse(r.stdout) as { results: Array<Record<string, any>>; exact: boolean; request?: HumanReviewRequest };
    };
    const before = readFileSync(f.lifecyclePath, 'utf8');
    const issued = child([{ action: 'next' }]).results[0].question, q = issued.id as string;
    const proposed = child([{ action: 'propose', question_id: q, version: 0, expected_revision: 0, proposal }]);
    expect(proposed.exact).toBe(true);
    const status = child([{ action: 'status' }]);
    expect(status.results[0]).toMatchObject({ canonical_modules: [{ interview: { pending_proposals: 1, pending_storage: 'compatible' } }] });
    const review = { action: 'review', question_id: q, version: 1 }, recovered = child([{ action: 'resume', question_id: q, version: 1 }, review]);
    expect(recovered.exact).toBe(true); expect(recovered.results[0].question).toMatchObject({ id: q, state: 'pending_review', version: 1,
      context: issued.context, statement_digest: proposed.results[0].question.statement_digest });
    // Independent host fixture decision, transmitted to the privileged host only.
    const approval = decision(recovered.request!);
    expect(child([review], approval).results[0]).toMatchObject({ status: 'confirmed', revision: 1 });
    expect(child([review]).results[0]).toMatchObject({ status: 'confirmed', idempotent: true });
    const reopened = new SqliteKnowledgeAdapter(f.knowledgePath); closers.push(() => reopened.close());
    expect((await reopened.query('a', 'requirement')).items).toHaveLength(1);
    expect((await reopened.query('a', 'relation')).items).toHaveLength(1);
    expect(readFileSync(f.lifecyclePath, 'utf8')).toBe(before);
    expect(existsSync(join(f.root, '.qa', 'modules'))).toBe(false);
  }, 30000);
});
