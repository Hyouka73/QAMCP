# Sonda independiente de continuidad

Guardar el bloque como interview-probe-portable.mjs fuera del repositorio y ejecutar con Node 24: `node <ARTEFACTOS>/interview-probe-portable.mjs <WORKTREE>`. Requiere build previo y dependencias congeladas. Fixture sintético explícito con SQLite y SDK MCP; no emite decisiones ni llama review. Deriva únicamente la preparación del fixture de canonical-interview.test.ts y añade snapshots de todas las tablas, DB/WAL y lifecycle. La variante parcial del helper no se invoca.

~~~js
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const [repo]=process.argv.slice(2);
const req=createRequire(repo+'/packages/mcp/package.json');
const load=async id=>import(pathToFileURL(req.resolve(id)).href);
import { randomUUID } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
const { Client }=await load('@modelcontextprotocol/sdk/client/index.js');
const { InMemoryTransport }=await load('@modelcontextprotocol/sdk/inMemory.js');
const { CallToolResultSchema }=await load('@modelcontextprotocol/sdk/types.js');
const { SqliteKnowledgeAdapter }=await load('@qap/knowledge');
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const { createMcpServer }=await load(repo+'/packages/mcp/dist/index.js');
const { CanonicalInterviewService }=await load(repo+'/packages/mcp/dist/index.js');
const { ModuleObservationBridge }=await load(repo+'/packages/mcp/dist/index.js');
const time = '2026-10-30T12:00:00.000Z';
const canary = 'PRIVATE_R3_UNTRUSTED_7b91';
const trace = { source: 'synthetic', recorded_by: 'fixture', recorded_at: time, reason: 'Authorized synthetic fixture', review: 'unreviewed', evidence_refs: [] };
const roots = [], stores = [];
const connections = [];
/** The host's independent review inbox. MCP has no handle to populate this inbox.
 * Tests simulate presentation and explicit human decisions through the host API.
 */
class ReviewInbox {
    requests = [];
    decisions = new Map();
    async review(request) {
        this.requests.push(request);
        return this.decisions.get(request.requestDigest) ?? null;
    }
    decide(request, decision = 'confirm') {
        const record = { requestDigest: request.requestDigest, approvalId: randomUUID(), decision,
            presentedStatementDigest: request.statementDigest, reviewer: 'synthetic-business-owner',
            decidedAt: new Date(Date.now() - 1000).toISOString(), expiresAt: new Date(Date.now() + 60_000).toISOString() };
        this.decisions.set(request.requestDigest, record);
        return record;
    }
}
async function fixture(gateway) {
    const root = mkdtempSync(join(tmpdir(), 'qap-interview-'));
    roots.push(root);
    mkdirSync(join(root, '.qa', 'project'), { recursive: true });
    const lifecyclePath = join(root, '.qa', 'project', 'lifecycle.json');
    const lifecycle = { _version: '1', phase: 'WORKING', modules: { catalog: { state: 'planned', updated_at: time } },
        session: { id: 's', started_at: time, plan: [{ module: 'catalog', path: '/' }], auth: { required: false } }, history: [] };
    writeFileSync(lifecyclePath, JSON.stringify(lifecycle));
    const path = join(root, 'synthetic.sqlite');
    const store = new SqliteKnowledgeAdapter(path);
    stores.push(store);
    await store.commit('a', [
        { kind: 'application', expected_revision: 0, trace, entity: { application_id: 'a', name: 'Synthetic', base_url: 'https://example.invalid', created_at: time } },
        { kind: 'environment', expected_revision: 0, trace, entity: { application_id: 'a', environment_id: 'local', name: 'local', base_url: 'https://example.invalid', safe_domains: ['example.invalid'], is_production: false, destructive_actions_allowed: false } },
        { kind: 'module', expected_revision: 0, trace, entity: { id: 'module-catalog', application_id: 'a', key: 'catalog-key', title: 'Synthetic canonical module', certainty: 'pending_review', criticality: 'medium', dependencies: [], created_at: time, updated_at: time, is_active: true } },
    ]);
    const context = { projectRoot: root, applicationId: 'a', environmentId: 'local', moduleBindings: [{ plannedName: 'catalog', moduleId: 'module-catalog', moduleKey: 'catalog-key', moduleRevision: 1, applicationRevision: 1, environmentRevision: 1, provenance: 'host_declared' }] };
    const service = new CanonicalInterviewService(store, context, gateway);
    const bridge = new ModuleObservationBridge(store, context);
    async function associate(partial = false) {
        // Explicit authorized persisted fixture: same canonical structure produced by the
        // real crawler, independently exercised in discovery-handler.test.ts.
        const execution = randomUUID(), evidenceId = randomUUID();
        const view = { id: randomUUID(), route: `urn:qap:route:${'a'.repeat(64)}`, state: 'settled', controls: [{ required_in_dom: true }], forms: [{}], links: [], untrusted: canary };
        const evidence = { id: evidenceId, kind: 'dom_snippet', uri: `urn:qap:fixture:${evidenceId}`, pii_masked: true, captured_at: time,
            session_id: execution, metadata: { source: 'static_dom_structure', view } };
        const crawlerTrace = { ...trace, source: 'blackbox_crawler', recorded_by: 'crawler', environment_id: 'local' };
        const observations = ['navigation_route', 'dom_element'].map(kind => ({ id: randomUUID(), application_id: 'a', environment_id: 'local', kind: kind,
            observed_by: 'crawler', observed_at: time, session_id: execution, evidence,
            raw_payload: kind === 'navigation_route' ? { route: view.route, view_id: view.id, state: view.state } : { view_id: view.id, controls: view.controls, forms: view.forms } }));
        await store.commit('a', [{ kind: 'evidence', expected_revision: 0, trace: crawlerTrace, entity: evidence },
            ...observations.map(entity => ({ kind: 'observation', entity, expected_revision: 0,
                trace: { ...crawlerTrace, evidence_refs: [{ kind: 'evidence', id: evidence.id, revision: 1 }] } }))]);
        const receipt = await bridge.receipt('catalog', execution, observations.map(o => o.id));
        assert.ok(receipt);
        if (partial) {
            // Real rollback-safe edge creation, then simulate an incomplete authorized
            // prefix using the bridge's exact existing relation (not fabricated YAML).
            const spy = vi.spyOn(store, 'commit').mockImplementationOnce(async (app, writes) => {
                spy.mockRestore();
                return store.commit(app, writes.slice(0, 1));
            });
        }
        await bridge.associate('catalog', receipt);
        return { evidence, observations, receipt: receipt };
    }
    async function connect() {
        const server = createMcpServer({ projectRoots: [root], knowledgeBindings: [{ ...context, store, humanReviewGateway: gateway }] });
        const client = new Client({ name: 'canonical-interview-test', version: '1' });
        const [a, b] = InMemoryTransport.createLinkedPair();
        connections.push({ client, server });
        await server.connect(b);
        await client.connect(a);
        const invoke = async (name, args = {}) => {
            const response = await client.request({ method: 'tools/call', params: { name, arguments: { targetPath: root, ...args } } }, CallToolResultSchema);
            const item = response.content[0];
            if (item.type !== 'text')
                throw new Error('Missing text');
            assert.ok(!item.text.includes(canary));
            return JSON.parse(item.text);
        };
        return { client, invoke, call: (command, extra = {}) => invoke('qap_rules_set', { module: 'catalog', canonical_interview: command, ...extra }) };
    }
    return { root, path, store, context, service, bridge, lifecycle, lifecyclePath, associate, connect };
}
const inbox = new ReviewInbox();
const f = await fixture(inbox);
try {
    await f.associate();
    const mcp = await f.connect();
    const hash = data => createHash('sha256').update(data).digest('hex');
    const snapshot = () => {
        const db = new DatabaseSync(f.path, { readOnly: true });
        try {
            const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
            return { lifecycle: hash(readFileSync(f.lifecyclePath)), files: Object.fromEntries(['', '-wal'].filter(x => existsSync(f.path + x)).map(x => [x || 'main', hash(readFileSync(f.path + x))])),
                tables: Object.fromEntries(tables.map(({ name }) => [name, db.prepare('SELECT * FROM "' + name.replaceAll('"', '""') + '"').all()])) };
        }
        finally {
            db.close();
        }
    };
    const before = snapshot();
    const initial = await mcp.invoke('qap_status');
    assert.equal(initial.siguiente_accion?.canonical_interview, undefined);
    assert.equal(initial.canonical_modules[0].interview.pending_questions, 0);
    assert.deepEqual(snapshot(), before);
    console.log(JSON.stringify({ step: 'before_interview', pending: 0, invented: false, sqlite_and_lifecycle_unchanged: true }));
    let current = await mcp.call({ action: 'next' });
    assert.equal(current.status, 'interviewing');
    for (const phase of ['opened', 'proposed']) {
        if (phase === 'proposed') {
            current = await mcp.call({ action: 'propose', question_id: current.question.id, version: current.question.version, expected_revision: 0,
                proposal: { title: 'Consultar el catálogo de productos', description: 'La persona autorizada consulta el catálogo de productos vigentes.', category: 'functional' } });
            assert.equal(current.status, 'pending_review');
        }
        const before = snapshot();
        const one = await mcp.invoke('qap_status'), two = await mcp.invoke('qap_status');
        assert.deepEqual(one.siguiente_accion, two.siguiente_accion);
        assert.equal(one.siguiente_accion.tool, 'qap_rules_set');
        assert.equal(one.siguiente_accion.module, 'catalog');
        assert.deepEqual(one.siguiente_accion.canonical_interview, { action: 'next' });
        const continued = await mcp.invoke('qap_rules_set', { module: one.siguiente_accion.module, canonical_interview: one.siguiente_accion.canonical_interview });
        assert.equal(continued.question.id, current.question.id);
        assert.equal(continued.question.version, current.question.version);
        assert.equal(continued.question.statement_digest, current.question.statement_digest);
        assert.deepEqual(snapshot(), before);
        assert.equal((await f.store.query('a', 'requirement')).items.length, 0);
        assert.equal(inbox.requests.length, 0);
        assert.equal(existsSync(join(f.root, '.qa/modules/catalog/rules.yaml')), false);
        console.log(JSON.stringify({ step: phase, question_id: continued.question.id, version: continued.question.version,
            pending: one.canonical_modules[0].interview.pending_questions, next: one.siguiente_accion, requirements: 0, gateway_requests: 0,
            sqlite_and_lifecycle_unchanged: true, sqlite_sha256: before.files, lifecycle_sha256: before.lifecycle, rules_yaml: false }));
    }
}
finally {
    for (const c of connections) {
        await c.client.close();
        await c.server.close();
    }
    f.store.close();
    // Retain only this authorized synthetic fixture outside Git for the audit.
}
~~~
