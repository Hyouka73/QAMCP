import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { AuthManager } from '@qap/auth';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { FileSystemStorage, SqliteKnowledgeAdapter } from '@qap/knowledge';
import type { AuthProfile } from '@qap/shared';
import { expect, it, vi } from 'vitest';

import type { DiscoveryAuthorizationRequest, IDiscoveryAuthorizer } from '../discovery-authorizer.js';
import { HostReviewQueue } from '../host-review.js';
import { createMcpServer } from '../server.js';

it.skipIf(process.env.QAP_INTERACTIVE_BROWSER_FIXTURE !== '1').each(['handoff', 'auto', 'token'] as const)(
  'runs %s in Chromium through MCP with simulated operator decisions', async method => {
    const temp = mkdtempSync(join(tmpdir(), 'qap-interactive-browser-'));
    const root = join(temp, 'project');
    mkdirSync(root);
    const db = new SqliteKnowledgeAdapter(join(temp, 'knowledge.sqlite'));
    const reviewDir = join(temp, 'reviews');
    mkdirSync(reviewDir);
    const reviews = new HostReviewQueue(reviewDir, randomBytes(32));
    const password = randomBytes(16).toString('hex');
    let token = randomBytes(16).toString('hex');
    let challenge = false;
    const calls: string[] = [];
    let successfulLogins = 0;
    const http = createServer((request, response) => {
      const path = request.url ?? '/';
      calls.push(request.method + ' ' + path);
      response.setHeader('content-type', 'text/html');
      if (path === '/login' && request.method === 'GET') {
        if (method === 'handoff') {
          // The fixture submits its own form. A production operator supplies credentials manually.
          return response.end('<form method="POST"><input type="password"></form><script>document.forms[0].submit()</script>');
        }
        const challengeInput = challenge ? '<input autocomplete="one-time-code">' : '';
        return response.end('<form method="POST"><input id="who" name="who"><input type="password" id="key" name="key">' +
          challengeInput + '<button id="enter" type="submit">Log in</button></form>');
      }
      if (request.method === 'POST' && (path === '/login' || path === '/exchange')) {
        const finish = (accepted: boolean) => {
          if (!accepted) { response.writeHead(403); response.end(); return; }
          successfulLogins++;
          token = randomBytes(16).toString('hex');
          response.writeHead(path === '/exchange' ? 204 : 303, { location: '/private',
            'set-cookie': 'fixture=' + token + '; HttpOnly; Path=/' });
          response.end();
        };
        if (path === '/exchange') return finish(request.headers.authorization === 'Bearer ' + password);
        if (method === 'handoff') return finish(true);
        let body = '';
        request.setEncoding('utf8').on('data', (chunk: string) => { body += chunk; }).on('end', () => {
          const form = new URLSearchParams(body);
          finish(form.get('who') === 'fixture-user' && form.get('key') === password);
        });
        return;
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
    let approveProvision = false;
    const authorizer: IDiscoveryAuthorizer = { requestAuthorization: request => {
      prompts.push(request);
      if (request.interactiveOperation?.operation === 'test' && rejectTest) return Promise.resolve({ decision: 'rejected' });
      return Promise.resolve({ decision: 'approved', root: request.projectRoot, targetUrl: request.targetUrl });
    }, requestCredential: async () => approveProvision ? password : undefined };
    const createServerForFixture = () => createMcpServer({ projectRoots: [root], interactiveAccessEnabled: true, interactiveAccessAuthorizer: authorizer,
      knowledgeBindings: [{ ...scope, store: db, caseReviewGateway: reviews,
        moduleBindings: [{ plannedName: 'smoke', moduleId: 'mod-fixture', moduleKey: 'smoke', provenance: 'host_declared',
          moduleRevision: 1, applicationRevision: 1, environmentRevision: 1 }] }],
      testAuthorizations: [{ projectRoot: root, allowedOrigins: [origin], authorizedProfiles: ['tester'] }],
      discoveryAuthorizations: [{ ...scope, environmentRevision: 1, authorizedProfiles: ['tester'],
        authorization: { read_only_acknowledged: true, allowed_ips: ['127.0.0.1'],
          navigation_urls: [origin + '/public', origin + '/private'] } }],
    });
    const createClient = () => new Client({ name: 'fixture', version: '1' });
    let server = createServerForFixture();
    let client = createClient();
    const connect = async () => {
      const [transport, host] = InMemoryTransport.createLinkedPair();
      await server.connect(host);
      await client.connect(transport);
    };
    const config: AuthProfile = { id: 'tester', env: 'local', application_id: app, username: 'fixture-user',
      credential_source: method === 'token' ? 'env' : 'keychain', login_mode: 'auto', login_origin: origin,
      login_route: '/login', token_exchange_route: method === 'token' ? '/exchange' : undefined,
      verification_route: '/private', post_login_condition: { type: 'selector_present', value: '#signed-in' },
      form_selectors: { username: '#who', password: '#key', submit: '#enter' } };
    const manager = new AuthManager(root);
    let provisioned = false;
    const consoleSpies = (['log', 'warn', 'error'] as const).map(level => vi.spyOn(console, level));
    const call = async (name: string, args: Record<string, unknown> = {}) => {
      const response = await client.callTool({ name, arguments: { targetPath: root, ...args } });
      const serialized = JSON.stringify(response);
      expect(serialized).not.toContain(token);
      expect(serialized).not.toContain(password);
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
      await connect();
      await call('qap_init', { baseUrl: origin });
      const storage = new FileSystemStorage({ rootDir: root });
      const plan = [{ module: 'smoke', path: '/private', priority: 'high' as const, status: 'planned' as const }];
      await storage.saveLifecycleState({ _version: '1', phase: 'WORKING', session: { id: 'fixture', started_at: at, plan },
        modules: { smoke: { state: 'planned', updated_at: at } }, history: [] });
      const publicDiscovery = await call('qap_discover', { name: 'smoke', path: '/public' });
      expect(publicDiscovery).toMatchObject({ mode: 'fresh_anonymous_static', acquisition_persistence: 'committed' });

      await storage.saveLifecycleState({ _version: '1', phase: 'SCOPING', session: { id: 'fixture', started_at: at, plan,
        auth: { required: true, method: method === 'handoff' ? 'handoff' : 'credentials', profile: 'tester', roles: ['tester'], source: 'user' } },
        modules: { smoke: { state: 'planned', updated_at: at } }, history: [] });
      const loginArgs = { profile: 'tester', env: 'local', method: method === 'token' ? 'auto' : method, timeout_ms: 15000 };
      const baseArgs = { profile: 'tester', env: 'local', timeout_ms: 15000 };
      const cache = join(root, '.qa', 'cache', 'verified-sessions');
      const configDir = join(root, '.qa', 'project', 'auth');
      if (method === 'handoff') {
        const handoff = { ...loginArgs, post_login_condition: { type: 'selector_present', value: '#signed-in' } };
        expect(await call('qap_auth_add', { ...handoff, verification_route: '/misleading' })).toMatchObject({ code: 'session_invalid' });
        expect(await call('qap_auth_add', { ...handoff, verification_route: '/private' })).toMatchObject({
          code: 'authentication_verified', verified: true, session_scope: 'host_process',
        });
      } else {
        expect(await call('qap_auth_add', loginArgs)).toMatchObject({ code: 'credentials_not_configured' });
        mkdirSync(configDir, { recursive: true });
        writeFileSync(join(configDir, 'profiles.json'), JSON.stringify({ _version: '1', profiles: [config] }));
        const sessionKey = randomBytes(32).toString('hex');
        vi.stubEnv('QAP_SESSION_KEY', sessionKey);
        if (method === 'token') {
          vi.stubEnv(manager.scopedTokenVariable(config), password);
        } else {
          const provision = { profile: 'tester', env: 'local' };
          expect(await call('qap_auth_provision', provision)).toMatchObject({ status: 'cancelled' });
          expect(await manager.getCredentialStatus(config.id)).toMatchObject({ state: 'not_configured' });
          approveProvision = true;
          provisioned = true;
          expect(await call('qap_auth_provision', provision)).toMatchObject({
            code: 'credential_saved', credential_state: 'available', provider: 'keychain',
          });
          expect(await manager.getCredentialStatus(config.id)).toMatchObject({ state: 'available' });
          expect((await manager.getCredentials(config.id))?.password === password).toBe(true);
          expect(await manager.getProfileCredentials({ ...config, env: 'staging' }, true)).toBeNull();
          expect(await manager.getProfileCredentials({ ...config, id: 'someone-else' }, true)).toBeNull();
          expect(await manager.getProfileCredentials({ ...config, username: 'other-user' }, true)).toBeNull();
          expect(await manager.getProfileCredentials({ ...config, application_id: 'other-app' }, true)).toBeNull();
          const other = new AuthManager(temp);
          try { expect(await other.getProfileCredentials(config, true)).toBeNull(); }
          finally { other.close(); }
          challenge = true;
          expect(await call('qap_auth_add', loginArgs)).toMatchObject({ code: 'challenge_detected', challenge_detected: true });
          expect(successfulLogins).toBe(0);
          challenge = false;
        }
        expect(await call('qap_auth_add', loginArgs)).toMatchObject({ code: 'authentication_verified',
          verified: true, session_scope: 'encrypted_disk' });
        expect(await call('qap_auth_add', loginArgs)).toMatchObject({ code: 'session_valid' });
        expect(successfulLogins).toBe(1);
        const cacheFile = join(cache, readdirSync(cache)[0]);
        const envelope = readFileSync(cacheFile, 'utf8');
        expect(envelope).not.toContain(token);
        expect(envelope).not.toContain(password);
        expect(envelope).not.toContain('#signed-in');
        await client.close();
        await server.close();
        server = createServerForFixture();
        client = createClient();
        await connect();
        vi.stubEnv('QAP_SESSION_KEY', undefined);
        expect(await call('qap_auth_add', { ...baseArgs, method: 'reuse' })).toMatchObject({ code: 'session_expired' });
        expect(await call('qap_auth_list')).toMatchObject({ count: 1, profiles: [
          { id: config.id, env: config.env, code: 'authentication_required', verified: false },
        ] });
        vi.stubEnv('QAP_SESSION_KEY', sessionKey);
        expect(await call('qap_auth_add', { ...baseArgs, method: 'reuse' })).toMatchObject({
          code: 'session_valid', session_scope: 'encrypted_disk',
        });
        expect(successfulLogins).toBe(1);
        token = randomBytes(16).toString('hex');
        expect(await call('qap_auth_add', { ...baseArgs, method: 'reuse' })).toMatchObject({ code: 'session_expired' });
        expect(successfulLogins).toBe(1);
        expect(await call('qap_auth_add', loginArgs)).toMatchObject({ code: 'authentication_verified' });
        expect(successfulLogins).toBe(2);
      }
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
      rejectTest = false;
      const execution = await call('qap_test', run);
      expect(execution).toMatchObject({ status: 'success', result: 'passed', summary: { passed: 1 } });
      const evidence = readFileSync(join(root, '.qa', 'executions', String(execution.execution_id) + '.json'), 'utf8');
      expect(evidence).not.toContain(token);
      expect(evidence).not.toContain(password);
      const logs = JSON.stringify(consoleSpies.flatMap(spy => spy.mock.calls));
      expect(logs).not.toContain(password);
      expect(logs).not.toContain(token);
      expect(calls).not.toContain('POST /mutate');
      expect(existsSync(join(root, '.qa/cache/sessions'))).toBe(false);
      // Reusable QA session authorization covers discovery_profile and test without opening extra windows
      expect(prompts.some(p => p.interactiveOperation?.operation === 'login')).toBe(true);
      expect(prompts.some(p => p.interactiveOperation?.operation === 'discovery_profile')).toBe(false);
      expect(prompts.some(p => p.interactiveOperation?.operation === 'test')).toBe(false);
      if (method !== 'handoff') expect(successfulLogins).toBe(2);
      if (provisioned) {
        expect(await manager.deleteSecret(config.id)).toBe(true);
        provisioned = false;
        expect(await manager.getCredentialStatus(config.id)).toMatchObject({ state: 'not_configured' });
      }
    } finally {
      if (provisioned) await manager.deleteSecret(config.id);
      manager.close();
      vi.unstubAllEnvs();
      for (const spy of consoleSpies) spy.mockRestore();
      await client.close();
      await server.close();
      await new Promise<void>((resolve, reject) => http.close(error => error ? reject(error) : resolve()));
      reviews.close();
      db.close();
      rmSync(temp, { recursive: true, force: true });
    }
  }, 120000);
