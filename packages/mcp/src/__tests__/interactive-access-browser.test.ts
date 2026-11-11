import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { FileSystemStorage, SqliteKnowledgeAdapter } from '@qap/knowledge';
import { expect, it } from 'vitest';

import type { DiscoveryAuthorizationRequest, IDiscoveryAuthorizer } from '../discovery-authorizer.js';
import { HostReviewQueue } from '../host-review.js';
import { createMcpServer } from '../server.js';

it.skipIf(process.env.QAP_INTERACTIVE_BROWSER_FIXTURE !== '1')(
  'runs the real Chromium/MCP pipeline on a local fixture with simulated operator decisions', async () => {
    const temp = mkdtempSync(join(tmpdir(), 'qap-interactive-browser-'));
    const root = join(temp, 'project');
    mkdirSync(root);
    const db = new SqliteKnowledgeAdapter(join(temp, 'knowledge.sqlite'));
    const reviewDir = join(temp, 'reviews');
    mkdirSync(reviewDir);
    const reviews = new HostReviewQueue(reviewDir, randomBytes(32));
    const token = randomBytes(16).toString('hex');
    const calls: string[] = [];
    const http = createServer((request, response) => {
      const path = request.url ?? '/';
      calls.push(request.method + ' ' + path);
      response.setHeader('content-type', 'text/html');
      if (path === '/login' && request.method === 'GET') {
        // The fixture submits its own form. A production operator supplies credentials manually.
        return response.end('<form id="login" method="POST"><input type="password"></form><script>document.forms[0].submit()</script>');
      }
      if (path === '/login' && request.method === 'POST') {
        response.writeHead(303, { location: '/private', 'set-cookie': 'fixture=' + token + '; HttpOnly; Path=/' });
        return response.end();
      }
      if (path === '/private' && request.headers.cookie?.includes('fixture=' + token)) {
        return response.end('<main id="signed-in"><h1>Fixture ready</h1><button id="write" onclick="fetch(\'/mutate\',{method:\'POST\'}).catch(()=>{})">Attempt POST</button></main>');
      }
      if (path === '/public') return response.end('<main><h1>Public fixture</h1></main>');
      if (path === '/misleading') return response.end('<main id="signed-in">Public lookalike</main>');
      response.writeHead(401);
      return response.end('<form><input type="password"></form>');
    });
    await new Promise<void>(resolve => http.listen(0, '127.0.0.1', resolve));
    const origin = 'http://127.0.0.1:' + (http.address() as AddressInfo).port;
    const scope = { projectRoot: root, applicationId: 'app-fixture', environmentId: 'local' };
    const app = scope.applicationId;
    const at = new Date().toISOString();
    const trace = { source: 'synthetic', recorded_by: 'fixture', recorded_at: at, reason: 'Local browser regression',
      review: 'reviewed' as const, evidence_refs: [] };
    const prompts: DiscoveryAuthorizationRequest[] = [];
    let rejectTest = true;
    const authorizer: IDiscoveryAuthorizer = { requestAuthorization: request => {
      prompts.push(request);
      if (request.interactiveOperation?.operation === 'test' && rejectTest) return Promise.resolve({ decision: 'rejected' });
      return Promise.resolve({ decision: 'approved', root: request.projectRoot, targetUrl: request.targetUrl });
    } };
    const server = createMcpServer({ projectRoots: [root], interactiveAccessEnabled: true, interactiveAccessAuthorizer: authorizer,
      knowledgeBindings: [{ ...scope, store: db, caseReviewGateway: reviews,
        moduleBindings: [{ plannedName: 'smoke', moduleId: 'mod-fixture', moduleKey: 'smoke', provenance: 'host_declared',
          moduleRevision: 1, applicationRevision: 1, environmentRevision: 1 }] }],
      testAuthorizations: [{ projectRoot: root, allowedOrigins: [origin], authorizedProfiles: ['tester'] }],
      discoveryAuthorizations: [{ ...scope, environmentRevision: 1, authorizedProfiles: ['tester'],
        authorization: { read_only_acknowledged: true, allowed_ips: ['127.0.0.1'],
          navigation_urls: [origin + '/public', origin + '/private'] } }],
    });
    const client = new Client({ name: 'fixture', version: '1' });
    const [transport, host] = InMemoryTransport.createLinkedPair();
    const call = async (name: string, args: Record<string, unknown> = {}) => {
      const response = await client.callTool({ name, arguments: { targetPath: root, ...args } });
      const serialized = JSON.stringify(response);
      expect(serialized).not.toContain(token);
      return JSON.parse((response.content as Array<{ text: string }>)[0].text) as Record<string, unknown>;
    };
    try {
      await db.commit(app, [
        { kind: 'application', expected_revision: 0, trace, entity: { application_id: app, name: 'Fixture', base_url: origin, created_at: at } },
        { kind: 'environment', expected_revision: 0, trace, entity: { application_id: app, environment_id: 'local',
          name: 'local', base_url: origin, safe_domains: ['127.0.0.1'], is_production: false, destructive_actions_allowed: false } },
        { kind: 'module', expected_revision: 0, trace, entity: { id: 'mod-fixture', application_id: app, key: 'smoke', title: 'Smoke',
          certainty: 'confirmed', criticality: 'medium', dependencies: [], created_at: at, updated_at: at, is_active: true } },
        { kind: 'requirement', expected_revision: 0, trace, entity: { id: 'req-fixture', application_id: app, module_key: 'smoke',
          title: 'Estado visible', description: 'El operador autenticado puede ver el estado del módulo de pruebas.',
          category: 'functional', validation_status: 'confirmed', provenance: 'developer_interview', confidence: 1,
          verified_by: 'fixture-reviewer', verification_evidence: { mechanism: 'human_review', verified_at: at,
            statement: 'Aprobación simulada de la prueba' }, created_at: at, is_active: true,
          acceptance_criteria: ['El estado Fixture ready es visible.'] } },
      ]);
      await server.connect(host);
      await client.connect(transport);
      await call('qap_init', { baseUrl: origin });
      const storage = new FileSystemStorage({ rootDir: root });
      const plan = [{ module: 'smoke', path: '/private', priority: 'high' as const, status: 'planned' as const }];
      await storage.saveLifecycleState({ _version: '1', phase: 'WORKING', session: { id: 'fixture', started_at: at, plan },
        modules: { smoke: { state: 'planned', updated_at: at } }, history: [] });
      const publicDiscovery = await call('qap_discover', { name: 'smoke', path: '/public' });
      expect(publicDiscovery).toMatchObject({ mode: 'fresh_anonymous_static', acquisition_persistence: 'committed' });

      await storage.saveLifecycleState({ _version: '1', phase: 'SCOPING', session: { id: 'fixture', started_at: at, plan,
        auth: { required: true, method: 'handoff', profile: 'tester', roles: ['tester'], source: 'user' } },
        modules: { smoke: { state: 'planned', updated_at: at } }, history: [] });
      const loginArgs = { profile: 'tester', env: 'local', method: 'handoff',
        post_login_condition: { type: 'selector_present', value: '#signed-in' }, timeout_ms: 15000 };
      expect(await call('qap_auth_add', { ...loginArgs, verification_route: '/misleading' })).toMatchObject({ code: 'session_invalid' });
      expect(await call('qap_auth_add', { ...loginArgs, verification_route: '/private' })).toMatchObject({ status: 'success', verified: true });
      expect(await call('qap_session_plan', { modules: plan })).toMatchObject({ fase: 'WORKING' });
      expect(await call('qap_discover', { name: 'smoke', path: '/private', profile: 'tester' })).toMatchObject({
        mode: 'fresh_authenticated_static', acquisition_persistence: 'committed',
      });

      const proposals = [{ requirement_id: 'req-fixture', expected_revision: 1, name: 'Consulta del estado', steps: [
        { type: 'navigate', url: origin + '/private' }, { type: 'assert', selector: '#signed-in', assertion_type: 'visible' },
        { type: 'click', selector: '#write' }, { type: 'assert', selector: 'h1', assertion_type: 'equals', expected: 'Fixture ready' },
      ] }];
      expect(await call('qap_plan', { module: 'smoke', case_workflow: { action: 'generate', proposals } })).toMatchObject({ status: 'proposed' });
      expect(await call('qap_plan', { module: 'smoke' })).toMatchObject({ total_cases: 1 });
      const review = { module: 'smoke', case_workflow: { action: 'review' } };
      const pending = await call('qap_plan', review);
      reviews.decide(String(pending.review_request_digest), 'fixture-reviewer', 'approve');
      expect(await call('qap_plan', review)).toMatchObject({ status: 'approved' });

      const run = { module: 'smoke', profile: 'tester' };
      const before = calls.length;
      expect(await call('qap_test', run)).toMatchObject({ code: 'test_authorization_rejected' });
      expect(calls).toHaveLength(before);
      rejectTest = false;
      const execution = await call('qap_test', run);
      expect(execution).toMatchObject({ status: 'success', result: 'passed', summary: { passed: 1 } });
      const evidence = readFileSync(join(root, '.qa', 'executions', String(execution.execution_id) + '.json'), 'utf8');
      expect(evidence).not.toContain(token);
      expect(calls).not.toContain('POST /mutate');
      expect(existsSync(join(root, '.qa/cache/sessions'))).toBe(false);
      expect(prompts.map(p => p.interactiveOperation?.operation)).toEqual(['login', 'login', 'discovery_profile', 'test', 'test']);
    } finally {
      await client.close();
      await server.close();
      await new Promise<void>((resolve, reject) => http.close(error => error ? reject(error) : resolve()));
      reviews.close();
      db.close();
      rmSync(temp, { recursive: true, force: true });
    }
  }, 120000);
