import { createServer, type Server as HttpServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { execFile, execFileSync, spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import os from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import type { AddressInfo } from 'node:net';

import YAML from 'yaml';
import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { FileSystemStorage, LockManager, SemanticHasher } from '@qap/knowledge';
import { SchemaValidator, type TCCase } from '@qap/shared';
import { PlaywrightRunner } from '@qap/playwright-runner';

import { createMcpServer } from '../server.js';
import { materializeReviewedCase } from '../handlers/conversational-case-workflow.js';
import { PlanHandler, computeCasesFingerprint } from '../handlers/plan.handler.js';
import { TestHandler, type TestNavigationAuthorization } from '../handlers/test.handler.js';
import { QapApplicationService } from '../application/application-service.js';
import { WorkspaceBootstrap } from '../workspace-bootstrap.js';
import { workspaceStorageKey } from '../project-reset.js';

const tempDirs: string[] = [];
let localHttpServer: HttpServer | null = null;
let localServerPort = 0;
let localServerUrl = '';
let navigationBarrier: { arrived: () => void; released: Promise<void> } | undefined;
const pendingInvocations: Promise<unknown>[] = [];
const invocationControllers: AbortController[] = [];
const executeHandler = TestHandler.prototype.execute;

function createTempDir(prefix = 'qap-test-handler-'): string {
  const dir = fs_mkdtemp(prefix);
  tempDirs.push(dir);
  return dir;
}

function fs_mkdtemp(prefix: string): string {
  return os.tmpdir() + '/' + prefix + Math.random().toString(36).substring(2, 9);
}

function initProject(targetUrl = 'http://127.0.0.1:8080'): string {
  const root = createTempDir('project-root-');
  mkdirSync(join(root, '.qa', 'project'), { recursive: true });
  mkdirSync(join(root, '.qa', 'modules'), { recursive: true });
  mkdirSync(join(root, '.qa', 'cache', 'history'), { recursive: true });
  mkdirSync(join(root, '.qa', 'executions'), { recursive: true });

  writeFileSync(
    join(root, '.qa', 'project', 'context.yaml'),
    YAML.stringify({
      _version: '1',
      project_name: 'TestHandlerProject',
      objective: 'Testing TestHandler R2/R4 architecture',
      objective_source: 'user',
    }),
    'utf8'
  );

  writeFileSync(
    join(root, '.qa', 'project', 'environments.yaml'),
    YAML.stringify({
      default: 'local',
      environments: {
        local: { url: targetUrl },
        staging: { url: 'https://staging.example.test' },
      },
    }),
    'utf8'
  );

  return root;
}

function seedModule(root: string, moduleName: string): void {
  const modDir = join(root, '.qa', 'modules', moduleName);
  mkdirSync(join(modDir, 'tests'), { recursive: true });
  writeFileSync(
    join(modDir, 'context.yaml'),
    YAML.stringify({
      _version: '1',
      name: moduleName,
      routes: [`/${moduleName}`],
      manually_edited: false,
    }),
    'utf8'
  );
}

function seedTestCase(
  root: string,
  moduleName: string,
  caseId: string,
  overrides?: Partial<TCCase>
): TCCase {
  const tc: TCCase = {
    _version: '1',
    id: caseId,
    name: `Test Case ${caseId}`,
    depends_on: overrides?.depends_on ?? [],
    steps: overrides?.steps ?? [
      { type: 'navigate', url: `${localServerUrl || 'http://127.0.0.1:8080'}/approved` },
      { type: 'assert', selector: '#title', assertion_type: 'visible', timeout: 2000 },
    ],
    ...overrides,
  };

  const tcFile = join(root, '.qa', 'modules', moduleName, 'tests', `${caseId}.yaml`);
  writeFileSync(tcFile, YAML.stringify(tc), 'utf8');
  return tc;
}

async function generateLegitimatePlan(root: string, moduleName: string, environment = 'local'): Promise<void> {
  const planHandler = new PlanHandler({ projectRoots: [root] });
  const planResult = await planHandler.execute(
    { module: moduleName, targetPath: root, environment },
    { requestId: `plan-${Date.now()}`, signal: new AbortController().signal }
  );
  if (planResult.isError) {
    throw new Error(`Failed to generate legitimate plan: ${planResult.content[0].text}`);
  }
}

async function startLocalHttpServer(): Promise<{ server: HttpServer; port: number; url: string }> {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = req.url || '/';
      if (url === '/approved') {
        const respond = () => res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end('<!DOCTYPE html><html><body><h1 id="title">Approved Page</h1></body></html>');
        const barrier = navigationBarrier;
        if (barrier) { barrier.arrived(); void barrier.released.then(respond); } else respond();
      } else if (url === '/failed') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<!DOCTYPE html><html><body><h1 id="title">Denied Page</h1></body></html>');
      } else if (url === '/redirect-unauthorized') {
        res.writeHead(302, { Location: 'http://169.254.169.254/latest/meta-data/' });
        res.end();
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<!DOCTYPE html><html><body><h1 id="title">Generic Page</h1></body></html>');
      }
    });

    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as AddressInfo;
      const port = addr.port;
      const hostUrl = `http://127.0.0.1:${port}`;
      resolve({ server, port, url: hostUrl });
    });
    server.on('error', reject);
  });
}

beforeEach(async () => {
  // Vitest can time out while handler/runner work is still pending. Own every
  // invocation, attach rejection handling immediately, and drain before rm.
  vi.spyOn(TestHandler.prototype, 'execute').mockImplementation(function (this: TestHandler, raw, context) {
    const controller = new AbortController();
    invocationControllers.push(controller);
    const signal = AbortSignal.any([controller.signal, context.signal]);
    const operation = executeHandler.call(this, raw, { ...context, signal });
    pendingInvocations.push(operation.then(() => undefined, () => undefined));
    return operation;
  });
  if (!localHttpServer) {
    const s = await startLocalHttpServer();
    localHttpServer = s.server;
    localServerPort = s.port;
    localServerUrl = s.url;
  }
});

async function drainTestFixtures(): Promise<void> {
  // A hook may itself time out while draining. Capture ownership BEFORE any
  // await: a late hook must never delete a subsequent test's roots or mocks.
  const ownedDirs = tempDirs.splice(0);
  const ownedInvocations = pendingInvocations.splice(0);
  invocationControllers.splice(0).forEach(controller => controller.abort());
  vi.restoreAllMocks();
  await Promise.all(ownedInvocations);
  for (const dir of ownedDirs) {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}

afterEach(drainTestFixtures);

afterAll(async () => {
  if (localHttpServer) {
    await new Promise<void>((resolve) => {
      localHttpServer?.close(() => resolve());
    });
    localHttpServer = null;
  }
});

describe('TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4)', () => {
  it('014-CODEX-004: an overlapping cleanup owns only its original roots until locks drain', async () => {
    const first = initProject(localServerUrl);
    const release = await new LockManager({ rootDir: first }).acquireModuleLock('orders');
    let resume!: () => void;
    const barrier = new Promise<void>(resolve => { resume = resolve; });
    pendingInvocations.push(barrier.then(release));
    const draining = drainTestFixtures();
    let second: string;
    try {
      expect(existsSync(join(first, '.qa/cache/locks/orders.lock'))).toBe(true);
      second = initProject(localServerUrl);
    } finally {
      resume();
      await draining;
    }
    expect(existsSync(first)).toBe(false);
    expect(existsSync(second)).toBe(true);
  });

  // Scenario 1: Plan vigente y autorizado (execution passes, persistence authentic)
  it('Scenario 1: executes valid and authorized plan, persisting authentic result (R4.1)', async () => {
    const root = initProject(localServerUrl);
    seedModule(root, 'checkout');
    seedTestCase(root, 'checkout', 'TC-001', {
      steps: [
        { type: 'navigate', url: `${localServerUrl}/approved` },
        { type: 'assert', selector: '#title', assertion_type: 'visible', timeout: 2000 },
      ],
    });
    await generateLegitimatePlan(root, 'checkout', 'local');

    const auths: TestNavigationAuthorization[] = [
      {
        projectRoot: root,
        allowedOrigins: ['http://127.0.0.1:*', 'http://localhost:*'],
      },
    ];

    const handler = new TestHandler({ projectRoots: [root] }, auths);
    const res = await handler.execute(
      { module: 'checkout', targetPath: root, environment: 'local' },
      { requestId: 'test-scen-1', signal: new AbortController().signal }
    );

    expect(res.isError).toBeFalsy();
    const data = JSON.parse(res.content[0].text as string);
    expect(data.status).toBe('success');
    expect(data.result).toBe('passed');
    expect(data.module).toBe('checkout');
    expect(data.summary.passed).toBe(1);
    expect(data.summary.failed).toBe(0);

    // Verify persistence in .qa/executions/
    const execFile = join(root, '.qa', 'executions', `${data.execution_id}.json`);
    expect(existsSync(execFile)).toBe(true);
    const persisted = JSON.parse(readFileSync(execFile, 'utf8'));
    expect(persisted.result).toBe('passed');

    // Verify history appended in .qa/cache/history/
    const historyFile = join(root, '.qa', 'cache', 'history', 'checkout.jsonl');
    expect(existsSync(historyFile)).toBe(true);
    const historyContent = readFileSync(historyFile, 'utf8');
    expect(historyContent).toContain(data.execution_id);
  });

  // Scenario 2: Plan inexistente, histórico, corrupto u obsoleto
  it('Scenario 2: rejects missing, historical, corrupt, or obsolete plans without executing runner (R4.2)', async () => {
    const root = initProject(localServerUrl);
    seedModule(root, 'auth-mod');
    const auths: TestNavigationAuthorization[] = [{ allowedOrigins: ['*'] }];
    const handler = new TestHandler({ projectRoots: [root] }, auths);

    // 2a. Plan missing
    const resMissing = await handler.execute(
      { module: 'auth-mod', targetPath: root },
      { requestId: 'test-scen-2a', signal: new AbortController().signal }
    );
    expect(resMissing.isError).toBe(true);
    const dataMissing = JSON.parse(resMissing.content[0].text as string);
    expect(dataMissing.status).toBe('blocked');
    expect(dataMissing.code).toBe('plan_missing');

    // 2b. Historical plan without cases_fingerprint
    const planFile = join(root, '.qa', 'modules', 'auth-mod', 'tests', 'plan.json');
    writeFileSync(
      planFile,
      JSON.stringify({
        _version: '1',
        module: 'auth-mod',
        checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        timestamp: '2026-10-30T00:00:00.000Z',
        algorithm: 'sha256',
        matrix: { cases: ['TC-001'], environment: 'local' },
      }),
      'utf8'
    );
    const resHist = await handler.execute(
      { module: 'auth-mod', targetPath: root },
      { requestId: 'test-scen-2b', signal: new AbortController().signal }
    );
    const dataHist = JSON.parse(resHist.content[0].text as string);
    expect(dataHist.status).toBe('blocked');
    expect(dataHist.code).toBe('historical_plan');

    // 2c. Corrupt plan (invalid JSON)
    writeFileSync(planFile, '{"_version": "1", INVALID JSON', 'utf8');
    const resCorrupt = await handler.execute(
      { module: 'auth-mod', targetPath: root },
      { requestId: 'test-scen-2c', signal: new AbortController().signal }
    );
    const dataCorrupt = JSON.parse(resCorrupt.content[0].text as string);
    expect(dataCorrupt.status).toBe('blocked');
    expect(dataCorrupt.code).toBe('corrupt_plan');
  });

  // Scenario 3: Módulo y entorno incompatibles
  it('Scenario 3: rejects environment mismatch, module mismatch, and missing module (R4.3)', async () => {
    const root = initProject(localServerUrl);
    seedModule(root, 'billing');
    seedTestCase(root, 'billing', 'TC-001');
    await generateLegitimatePlan(root, 'billing', 'local');

    const auths: TestNavigationAuthorization[] = [{ allowedOrigins: ['*'] }];
    const handler = new TestHandler({ projectRoots: [root] }, auths);

    // 3a. Missing module argument
    const resNoMod = await handler.execute(
      { targetPath: root },
      { requestId: 'test-scen-3a', signal: new AbortController().signal }
    );
    expect(resNoMod.isError).toBe(true);
    const dataNoMod = JSON.parse(resNoMod.content[0].text as string);
    expect(dataNoMod.status).toBe('blocked');
    expect(dataNoMod.code).toBe('module_required');

    // 3b. Non-string module argument returns structured block module_required
    const resNonStringMod = await handler.execute(
      { module: 123 as any, targetPath: root },
      { requestId: 'test-scen-3a-nonstring', signal: new AbortController().signal }
    );
    expect(resNonStringMod.isError).toBe(true);
    const dataNonStringMod = JSON.parse(resNonStringMod.content[0].text as string);
    expect(dataNonStringMod.status).toBe('blocked');
    expect(dataNonStringMod.code).toBe('module_required');

    // 3c. Environment mismatch (plan generated for local, requested staging)
    const resEnvMismatch = await handler.execute(
      { module: 'billing', targetPath: root, environment: 'staging' },
      { requestId: 'test-scen-3b', signal: new AbortController().signal }
    );
    expect(resEnvMismatch.isError).toBe(true);
    const dataEnvMismatch = JSON.parse(resEnvMismatch.content[0].text as string);
    expect(dataEnvMismatch.status).toBe('blocked');
    expect(dataEnvMismatch.code).toBe('environment_mismatch');
  });

  // Scenario 4: Casos alterados antes de la ejecución (TOCTOU Snapshot immunity)
  it('Scenario 4: in-memory snapshot prevents TOCTOU tampering of YAML files after verification (R4.4)', async () => {
    const root = initProject(localServerUrl);
    seedModule(root, 'orders');
    seedTestCase(root, 'orders', 'TC-ORIGINAL', {
      steps: [
        { type: 'navigate', url: `${localServerUrl}/approved` },
        { type: 'assert', selector: '#title', assertion_type: 'visible', timeout: 2000 },
      ],
    });
    await generateLegitimatePlan(root, 'orders', 'local');

    const auths: TestNavigationAuthorization[] = [{ allowedOrigins: ['http://127.0.0.1:*'] }];
    const runnerSpy = vi.spyOn(PlaywrightRunner.prototype, 'prepare');

    const handler = new TestHandler({ projectRoots: [root] }, auths);

    // Call execute
    const res = await handler.execute(
      { module: 'orders', targetPath: root, environment: 'local' },
      { requestId: 'test-scen-4', signal: new AbortController().signal }
    );

    expect(res.isError).toBeFalsy();

    // Verify runner received custom storageResolver
    expect(runnerSpy).toHaveBeenCalled();
    const passedOptions = runnerSpy.mock.calls[0][1];
    expect(passedOptions?.storageResolver).toBeDefined();

    // Now test that storageResolver resolves from the verified in-memory snapshot,
    // EVEN IF the YAML file on disk is deleted!
    const yamlPath = join(root, '.qa', 'modules', 'orders', 'tests', 'TC-ORIGINAL.yaml');
    rmSync(yamlPath);
    expect(existsSync(yamlPath)).toBe(false);

    // The storageResolver provided by TestHandler still resolves TC-ORIGINAL cleanly!
    const resolvedTc = await passedOptions!.storageResolver!('orders', 'TC-ORIGINAL');
    expect(resolvedTc).toBeDefined();
    expect(resolvedTc.id).toBe('TC-ORIGINAL');
    expect(resolvedTc.steps).toHaveLength(2);
  });

  // Scenario 5: URL o proyecto no autorizado, incluyendo redirecciones
  it('Scenario 5: blocks unauthorized URLs, unconfigured host policy, and redirects (R4.5)', async () => {
    const root = initProject('http://unauthorized.external.target');
    seedModule(root, 'orders');
    seedTestCase(root, 'orders', 'TC-001');
    await generateLegitimatePlan(root, 'orders', 'local');

    // 5a. No host authorizations configured -> blocked
    const handlerNoAuth = new TestHandler({ projectRoots: [root] }, []);
    const resNoAuth = await handlerNoAuth.execute(
      { module: 'orders', targetPath: root, environment: 'local' },
      { requestId: 'test-scen-5a', signal: new AbortController().signal }
    );
    expect(resNoAuth.isError).toBe(true);
    const dataNoAuth = JSON.parse(resNoAuth.content[0].text as string);
    expect(dataNoAuth.status).toBe('blocked');
    expect(dataNoAuth.code).toBe('navigation_not_authorized');

    // 5b. Host policy does not authorize 'http://unauthorized.external.target'
    const handlerRestricted = new TestHandler({ projectRoots: [root] }, [
      { projectRoot: root, allowedOrigins: ['http://127.0.0.1:*'] },
    ]);
    const resRestricted = await handlerRestricted.execute(
      { module: 'orders', targetPath: root, environment: 'local' },
      { requestId: 'test-scen-5b', signal: new AbortController().signal }
    );
    expect(resRestricted.isError).toBe(true);
    const dataRestricted = JSON.parse(resRestricted.content[0].text as string);
    expect(dataRestricted.status).toBe('blocked');
    expect(dataRestricted.code).toBe('navigation_not_authorized');

    // 5c. HTTP 302 redirect from authorized origin to unauthorized origin is aborted by browser route interception
    const redirectRoot = initProject(localServerUrl);
    seedModule(redirectRoot, 'redirect-mod');
    seedTestCase(redirectRoot, 'redirect-mod', 'TC-REDIRECT', {
      steps: [
        { type: 'navigate', url: `${localServerUrl}/redirect-unauthorized` },
        { type: 'assert', selector: '#title', assertion_type: 'visible', timeout: 1000 },
      ],
    });
    await generateLegitimatePlan(redirectRoot, 'redirect-mod', 'local');

    const handlerRedirect = new TestHandler({ projectRoots: [redirectRoot] }, [
      { projectRoot: redirectRoot, allowedOrigins: [`http://127.0.0.1:${localServerPort}`] },
    ]);
    const resRedirect = await handlerRedirect.execute(
      { module: 'redirect-mod', targetPath: redirectRoot, environment: 'local' },
      { requestId: 'test-scen-5c', signal: new AbortController().signal }
    );
    const dataRedirect = JSON.parse(resRedirect.content[0].text as string);
    expect(dataRedirect.result).toBe('failed');
    expect(dataRedirect.summary.failed).toBe(1);
    expect(dataRedirect.cases[0].result).toBe('failed');
    expect(dataRedirect.cases[0].failure_type).toBe('network_error');
  });

  // Scenario 6: Ausencia de navegador (error de infraestructura honesto)
  it('Scenario 6: classifies missing browser launch failure as infrastructure block (R4.6)', async () => {
    const root = initProject(localServerUrl);
    seedModule(root, 'checkout');
    seedTestCase(root, 'checkout', 'TC-001');
    await generateLegitimatePlan(root, 'checkout', 'local');

    // Mock runner returning infrastructure error (as when Chromium executable is missing)
    const mockRunner = {
      execute: vi.fn().mockResolvedValue({
        _version: '1',
        execution_id: 'exec_infra_err',
        module: 'checkout',
        env: 'local',
        started_at: new Date().toISOString(),
        finished_at: new Date().toISOString(),
        result: 'error',
        timed_out: false,
        summary: { total: 1, passed: 0, failed: 0, skipped: 0, not_run: 1 },
        cases: [
          {
            id: 'TC-001',
            title: 'TC-001',
            result: 'not_run',
            not_run_reason: "Fallo de infraestructura: no se pudo iniciar el navegador Chromium (Executable doesn't exist)",
            duration_ms: 0,
          },
        ],
      }),
    };

    const handler = new TestHandler(
      { projectRoots: [root] },
      {
        testAuthorizations: [{ allowedOrigins: ['*'] }],
        runner: mockRunner,
      }
    );

    const res = await handler.execute(
      { module: 'checkout', targetPath: root, environment: 'local' },
      { requestId: 'test-scen-6', signal: new AbortController().signal }
    );

    expect(res.isError).toBe(true);
    const data = JSON.parse(res.content[0].text as string);
    expect(data.status).toBe('blocked');
    expect(data.code).toBe('browser_not_available');
    expect(data.message).toContain('Fallo de infraestructura');
  });

  // Scenario 7: Autenticación no autorizada y desactivación de recuperación implícita de sesión
  it('Scenario 7: rejects unauthorized profiles and disables implicit session recovery (R4.7)', async () => {
    const root = initProject(localServerUrl);
    seedModule(root, 'secure-mod');
    seedTestCase(root, 'secure-mod', 'TC-001');
    await generateLegitimatePlan(root, 'secure-mod', 'local');

    const auths: TestNavigationAuthorization[] = [
      {
        allowedOrigins: ['*'],
        authorizedProfiles: ['tester-user'], // only 'tester-user' is authorized
      },
    ];

    const handler = new TestHandler({ projectRoots: [root] }, auths);

    // 7a. Rejects admin-user.json
    const resAdmin = await handler.execute(
      { module: 'secure-mod', targetPath: root, profile: 'admin-user' },
      { requestId: 'test-scen-7a', signal: new AbortController().signal }
    );
    expect(resAdmin.isError).toBe(true);
    const dataAdmin = JSON.parse(resAdmin.content[0].text as string);
    expect(dataAdmin.status).toBe('blocked');
    expect(dataAdmin.code).toBe('unauthorized_profile');

    // 7b. Rejects unlisted profile 'rogue-profile'
    const resRogue = await handler.execute(
      { module: 'secure-mod', targetPath: root, profile: 'rogue-profile' },
      { requestId: 'test-scen-7b', signal: new AbortController().signal }
    );
    expect(resRogue.isError).toBe(true);
    const dataRogue = JSON.parse(resRogue.content[0].text as string);
    expect(dataRogue.status).toBe('blocked');
    expect(dataRogue.code).toBe('unauthorized_profile');

    // 7c. Runner called with allowImplicitAuth: false
    const runnerSpy = vi.spyOn(PlaywrightRunner.prototype, 'prepare');
    await handler.execute(
      { module: 'secure-mod', targetPath: root, profile: 'tester-user' },
      { requestId: 'test-scen-7c', signal: new AbortController().signal }
    );
    expect(runnerSpy).toHaveBeenCalled();
    const passedOptions = runnerSpy.mock.calls[0][1];
    expect(passedOptions?.allowImplicitAuth).toBe(false);
  });

  // Scenario 8: Fallo funcional real frente a fallo de infraestructura
  it('Scenario 8: distinguishes real functional failure from infrastructure failure (R4.8)', async () => {
    const root = initProject(localServerUrl);
    seedModule(root, 'functional-mod');
    seedTestCase(root, 'functional-mod', 'TC-FAIL', {
      steps: [
        { type: 'navigate', url: `${localServerUrl}/approved` },
        // Assertion on element with non-matching text -> fails immediately in <50ms
        { type: 'assert', selector: '#title', assertion_type: 'contains', expected: 'ThisTextIsNotInTitle', timeout: 500 },
      ],
    });
    await generateLegitimatePlan(root, 'functional-mod', 'local');

    const auths: TestNavigationAuthorization[] = [{ allowedOrigins: ['http://127.0.0.1:*'] }];
    const handler = new TestHandler({ projectRoots: [root] }, auths);

    const res = await handler.execute(
      { module: 'functional-mod', targetPath: root, environment: 'local' },
      { requestId: 'test-scen-8', signal: new AbortController().signal }
    );

    // Functional failure returns completed status with result: 'failed'
    const data = JSON.parse(res.content[0].text as string);
    expect(data.result).toBe('failed');
    expect(data.summary.failed).toBe(1);
    expect(data.cases[0].result).toBe('failed');
    expect(data.cases[0].failure_type).toMatch(/selector_not_found|assertion_failed/);
  }, 15000);

  // Scenario 9: Cero casos ejecutados sin falso PASS
  it('Scenario 9: zero cases executed never returns fake PASS verdict (R4.9)', async () => {
    const root = initProject(localServerUrl);
    seedModule(root, 'empty-mod');

    // Create a legitimate verified plan with 0 cases (matrix.cases: [])
    const storage = new FileSystemStorage({ rootDir: root });
    const moduleContext = await storage.getModuleContext('empty-mod');
    const hasher = new SemanticHasher();
    const checksum = hasher.computeHash({ routes: moduleContext?.routes ?? [], selectors: {} });
    const { cases_fingerprint, cases_fingerprint_version } = computeCasesFingerprint([]);

    const planFile = join(root, '.qa', 'modules', 'empty-mod', 'tests', 'plan.json');
    writeFileSync(
      planFile,
      JSON.stringify(
        {
          _version: '1',
          module: 'empty-mod',
          checksum,
          cases_fingerprint,
          cases_fingerprint_version,
          timestamp: new Date().toISOString(),
          algorithm: 'sha256',
          matrix: { cases: [], environment: 'local' },
        },
        null,
        2
      ),
      'utf8'
    );

    const auths: TestNavigationAuthorization[] = [{ allowedOrigins: ['*'] }];
    const handler = new TestHandler({ projectRoots: [root] }, auths);

    const res = await handler.execute(
      { module: 'empty-mod', targetPath: root, environment: 'local' },
      { requestId: 'test-scen-9', signal: new AbortController().signal }
    );

    const data = JSON.parse(res.content[0].text as string);
    expect(data.result).toBe('failed');
    expect(data.result).not.toBe('passed');
    expect(data.summary.passed).toBe(0);
  });

  // Scenario 10: Cancelación y limpieza del runner (AbortSignal)
  it('Scenario 10: supports cancellation and resource cleanup under AbortSignal (R4.10)', async () => {
    const root = initProject(localServerUrl);
    seedModule(root, 'cancel-mod');
    seedTestCase(root, 'cancel-mod', 'TC-001');
    await generateLegitimatePlan(root, 'cancel-mod', 'local');

    const auths: TestNavigationAuthorization[] = [{ allowedOrigins: ['*'] }];
    const handler = new TestHandler({ projectRoots: [root] }, auths);

    // Abort before execution
    const abortCtrl = new AbortController();
    abortCtrl.abort();

    await expect(
      handler.execute(
        { module: 'cancel-mod', targetPath: root, environment: 'local' },
        { requestId: 'test-scen-10', signal: abortCtrl.signal }
      )
    ).rejects.toThrow();
  });

  // Scenario 11: Persistencia de resultados auténticos en disco
  it('Scenario 11: persists execution results adhering to schema without automatic SQLite ConformityAssessment (R4.11)', async () => {
    const root = initProject(localServerUrl);
    seedModule(root, 'persist-mod');
    seedTestCase(root, 'persist-mod', 'TC-001', {
      steps: [
        { type: 'navigate', url: `${localServerUrl}/approved` },
        { type: 'assert', selector: '#title', assertion_type: 'visible', timeout: 2000 },
      ],
    });
    await generateLegitimatePlan(root, 'persist-mod', 'local');

    const auths: TestNavigationAuthorization[] = [{ allowedOrigins: ['http://127.0.0.1:*'] }];
    const handler = new TestHandler({ projectRoots: [root] }, auths);

    const res = await handler.execute(
      { module: 'persist-mod', targetPath: root, environment: 'local' },
      { requestId: 'test-scen-11', signal: new AbortController().signal }
    );

    const data = JSON.parse(res.content[0].text as string);
    const execFile = join(root, '.qa', 'executions', `${data.execution_id}.json`);
    expect(existsSync(execFile)).toBe(true);

    const rawResult = JSON.parse(readFileSync(execFile, 'utf8'));
    const validator = new SchemaValidator();
    const validation = validator.validateExecutionResult(rawResult);
    expect(validation.valid).toBe(true);

    // Verify SQLite canonical v2 was NOT touched or created with ConformityAssessment
    const sqlitePath = join(root, '.qa', 'project', 'qap.sqlite');
    expect(existsSync(sqlitePath)).toBe(false);
  });

  // Scenario 12: Integración mediante MCP y conservación del catálogo vigente
  it('Scenario 12: integrates cleanly via createMcpServer preserving exact 19 tools (R4.12)', async () => {
    const root = realpathSync(initProject(localServerUrl));
    seedModule(root, 'mcp-mod');
    const host = createTempDir('qap-host-');
    mkdirSync(host, { recursive: true });
    const appDir = join(host, 'application');
    const workspaceDir = join(host, 'workspaces');
    execFileSync(process.execPath, [resolve('../../scripts/qap-authorize-workspace.mjs'), root], {
      env: { ...process.env, QAP_MCP_APP_SERVICE_DIR: appDir, QAP_MCP_WORKSPACE_HOST_DIR: workspaceDir }, windowsHide: true,
    });
    const service = new QapApplicationService({ hostRootDir: appDir, projectOperationDirectory: workspaceDir });
    const bootstrap = new WorkspaceBootstrap(workspaceDir, service);
    await bootstrap.prepare(root, localServerUrl);
    const otherRoot = realpathSync(initProject(localServerUrl));
    execFileSync(process.execPath, [resolve('../../scripts/qap-authorize-workspace.mjs'), otherRoot], {
      env: { ...process.env, QAP_MCP_APP_SERVICE_DIR: appDir, QAP_MCP_WORKSPACE_HOST_DIR: workspaceDir }, windowsHide: true,
    });
    await bootstrap.prepare(otherRoot, localServerUrl);
    const project = service.findActiveProjectByRoot(root)!;
    const g1 = service.authority.grant({ project_id: project.project_id, capability: 'execute', scope: { root_path: root, origin: localServerUrl, env_id: project.active_env_id! }, granted_by: 'test' });
    const proposed = service.proposeModuleCases({ projectId: project.project_id, moduleKey: 'mcp-mod', proposals: [{
      case_id: 'TC-001', title: 'Test Case TC-001', expected_outcome: 'Approved Page', oracle_source: 'user',
      expectation_metadata: { decision_status: 'accredited' },
      steps: [{ type: 'navigate', url: `${localServerUrl}/approved` }, { type: 'assert', selector: '#title', assertion_type: 'contains', expected: 'Approved Page' }],
    }] });
    expect(proposed.proposed).toHaveLength(1);
    expect(service.approveCaseBatch({ projectId: project.project_id, moduleKey: 'mcp-mod', caseIds: ['TC-001'], approvedBy: 'test' }).status).toBe('approved');
    const approvedCase = service.listServiceCases(project.project_id, 'mcp-mod').find(tc => tc.case_id === 'TC-001')!;
    await new FileSystemStorage({ rootDir: root }).saveTestCase('mcp-mod', materializeReviewedCase(approvedCase, 'mcp-mod'));
    await generateLegitimatePlan(root, 'mcp-mod', 'local');
    const server = createMcpServer({
      projectRoots: [root],
      testAuthorizations: [{ allowedOrigins: ['http://127.0.0.1:*'] }],
      applicationService: service,
      workspaceBootstrap: bootstrap,
      hostRegistryPath: join(workspaceDir, 'authorized-roots.json'),
    });

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: 'test-client', version: '1.0.0' }, { capabilities: {} });
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    // Verify the current public catalog
    const tools = await client.listTools();
    expect(tools.tools).toHaveLength(19);
    const toolNames = tools.tools.map(t => t.name);
    expect(toolNames).toContain('qap_test');
    expect(toolNames).toContain('qap_plan');
    expect(toolNames).toContain('qap_discover');
    expect(toolNames).toContain('qap_status');

    // Call qap_test via MCP protocol
    const callRes = await client.callTool({
      name: 'qap_test',
      arguments: { module: 'mcp-mod', targetPath: root, environment: 'local' },
    });

    expect(callRes.isError, JSON.stringify(callRes)).toBeFalsy();
    const data = JSON.parse((callRes.content as any)[0].text);
    expect(data.status).toBe('success');
    expect(data.result).toBe('passed');

    await client.close();
    await server.close();
    const connectStdio = async () => {
      const c = new Client({ name: 'publication-integration', version: '1' });
      await c.connect(new StdioClientTransport({ command: process.execPath, args: [resolve('dist/server.js')], stderr: 'pipe',
        env: { ...process.env, QAP_MCP_HOST_DATA_DIR: host, QAP_MCP_WORKSPACE_ROOT: root, NODE_ENV: 'test' } as Record<string, string> }));
      return c;
    };
    const first = await connectStdio();
    const second = await connectStdio();
    try {
      const call = () => first.callTool({ name: 'qap_test', arguments: { module: 'mcp-mod', targetPath: root, environment: 'local' } });
      const positive = await call();
      expect(positive.isError, JSON.stringify(positive)).toBeFalsy();
      expect(JSON.parse((positive.content as any)[0].text).result).toBe('passed');
      const { DatabaseSync } = await import('node:sqlite');
      const runtimeDb = join(root, '.qa/runtime/qap.sqlite');
      const rows = () => { const db = new DatabaseSync(runtimeDb, { readOnly: true }); try { return db.prepare('SELECT * FROM runs ORDER BY run_id').all(); } finally { db.close(); } };
      const files = (p: string): string[] => existsSync(p) ? readdirSync(p, { recursive: true }).map(String).sort() : [];
      const knowledge = () => {
        const db = new DatabaseSync(join(workspaceDir, workspaceStorageKey(root), 'knowledge.sqlite'), { readOnly: true });
        try { return db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map(({ name }) => {
          const table = String(name).replaceAll('"', '""');
          return [name, db.prepare(`SELECT * FROM "${table}"`).all()];
        }); } finally { db.close(); }
      };
      const otherFiles = () => files(join(otherRoot, '.qa')).filter(p => statSync(join(otherRoot, '.qa', p)).isFile()).map(p => [p, createHash('sha256').update(readFileSync(join(otherRoot, '.qa', p))).digest('hex')]);
      const beforeRows = rows();
      const beforeRuns = files(join(root, '.qa/runtime/runs'));
      const beforeShots = files(join(root, '.qa/reports/screenshots'));
      const beforeAttempts = service.listExecutionAttempts(project.project_id);
      const beforeKnowledge = knowledge();
      const beforeOther = otherFiles();
      let arrived!: () => void, release!: () => void;
      const entered = new Promise<void>(resolve => { arrived = resolve; });
      navigationBarrier = { arrived, released: new Promise<void>(resolve => { release = resolve; }) };
      const pending = call();
      try {
        await entered;
        const revoked = await second.callTool({ name: 'qap_project', arguments: { action: 'revoke_permission', project_id: project.project_id, targetPath: root, grant_id: g1.grant_id } });
        expect(revoked.isError, JSON.stringify(revoked)).toBeFalsy();
        service.authority.grant({ project_id: project.project_id, capability: 'execute', scope: { root_path: root, origin: localServerUrl, env_id: project.active_env_id! }, granted_by: 'test' });
      } finally { navigationBarrier = undefined; release(); }
      const rejected = await pending;
      expect(rejected.isError, JSON.stringify(rejected)).toBe(true);
      expect(JSON.parse((rejected.content as any)[0].text).code).toBe('operation_grant_revoked');
      expect(rows()).toEqual(beforeRows);
      expect(files(join(root, '.qa/runtime/runs'))).toEqual(beforeRuns);
      expect(files(join(root, '.qa/reports/screenshots'))).toEqual(beforeShots);
      expect(service.listExecutionAttempts(project.project_id)).toEqual(beforeAttempts);
      expect(knowledge()).toEqual(beforeKnowledge);
      expect(otherFiles()).toEqual(beforeOther);
    } finally { await first.close(); await second.close(); }
    // Kill a real publisher after run.json reaches disk and let a fresh MCP host recover it.
    const { DatabaseSync } = await import('node:sqlite');
    const reporterUrl = pathToFileURL(resolve('../reporter/dist/index.js')).href;
    const runnerUrl = pathToFileURL(resolve('../playwright-runner/dist/index.js')).href;
    const { QapDatabase, startViewerServer } = await import(reporterUrl);
    const viewer = await startViewerServer({ storage: { getProjectRoot: () => root }, port: 0, host: '127.0.0.1', silent: true });
    const runner = new PlaywrightRunner({ projectRoot: root });
    const prepared = await runner.prepare({ modules: ['mcp-mod'], cases: ['TC-CRASH'], environment: 'local' }, {
      attemptId: 'interrupted-host-recovery', allowImplicitAuth: false, lock_owned_by_caller: true,
      storageResolver: async () => ({ _version: '1', id: 'TC-CRASH', name: 'Crash', steps: [
        { type: 'navigate', url: `${localServerUrl}/approved` },
        { type: 'assert', selector: '#title', assertion_type: 'visible' },
        { type: 'screenshot', filename: 'crash.png' },
      ] }) as any,
    });
    expect(prepared.result.result).toBe('passed');
    const snapshot = (dir: string): Array<[string, string]> => existsSync(dir)
      ? readdirSync(dir, { recursive: true }).map(String).sort().filter(p => statSync(join(dir, p)).isFile())
        .map(p => [p, createHash('sha256').update(readFileSync(join(dir, p))).digest('hex')]) : [];
    const otherBefore = snapshot(join(otherRoot, '.qa'));
    const dbRows = () => { const db = new DatabaseSync(join(root, '.qa/runtime/qap.sqlite'), { readOnly: true });
      try { return db.prepare('SELECT * FROM runs ORDER BY run_id').all(); } finally { db.close(); } };
    let before = dbRows();
    expect(before.length).toBeGreaterThan(0);
    const committedBefore = snapshot(join(root, '.qa/runtime/runs'));
    const childCode = `
      import fs from 'node:fs';
      const original = fs.writeFileSync;
      fs.writeFileSync = function(p, ...args) {
        const result = original.call(this, p, ...args);
        if (typeof p === 'string' && p.endsWith('run.json')) {
          fs.writeSync(1, 'BARRIER\\n');
          Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0);
        }
        return result;
      };
      const m = await import(process.argv[1]);
      m.publishProvisionalExecution(m.loadProvisionalExecution(process.argv[2]));`;
    const child = spawn(process.execPath, ['--input-type=module', '-e', childCode, runnerUrl, prepared.operationId], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    let stderr = '';
    child.stderr.setEncoding('utf8'); child.stderr.on('data', chunk => { stderr += chunk; });
    try {
      await new Promise<void>((resolveBarrier, reject) => {
        const timeout = setTimeout(() => reject(new Error(`publisher barrier timeout: ${stderr}`)), 30000);
        child.stdout.setEncoding('utf8');
        child.stdout.on('data', chunk => { if (chunk.includes('BARRIER')) { clearTimeout(timeout); resolveBarrier(); } });
        child.once('exit', code => { clearTimeout(timeout); reject(new Error(`publisher exited ${code}: ${stderr}`)); });
      });
      const runDir = join(root, '.qa/runtime/runs/interrupted-host-recovery');
      const runUrl = `${viewer.url}/artifacts/runtime/runs/interrupted-host-recovery/run.json`;
      const shotUrl = `${viewer.url}/artifacts/${prepared.result.artifacts!.screenshots![0].replace(/^\.qa\//, '')}`;
      expect(existsSync(join(runDir, 'run.json'))).toBe(true);
      expect(existsSync(join(runDir, '.qap-publication-pending'))).toBe(true);
      expect(dbRows()).toEqual(before);
      expect((await fetch(runUrl)).status).toBe(404);
      expect((await fetch(shotUrl)).status).toBe(404);
      const preReport = new QapDatabase(join(root, '.qa/runtime'));
      expect(preReport.getRun('interrupted-host-recovery')).toBeNull();
      preReport.reindex();
      expect(preReport.getRun('interrupted-host-recovery')).toBeNull();
      preReport.close();
      before = dbRows(); // Reporter reindex normalizes nullable git fields on existing runs.
      const exited = new Promise(resolveExit => child.once('exit', resolveExit));
      child.kill('SIGKILL'); await exited;
      expect(existsSync(join(runDir, 'run.json'))).toBe(true);
      const restarted = await connectStdio();
      try {
        for (let i = 0; i < 2; i++) {
          const opened = await restarted.callTool({ name: 'qap_status', arguments: { targetPath: root } });
          expect(opened.isError, JSON.stringify(opened)).toBeFalsy();
          expect(existsSync(runDir)).toBe(false);
          expect(dbRows()).toEqual(before);
          expect(snapshot(join(root, '.qa/runtime/runs'))).toEqual(committedBefore);
          expect(snapshot(join(otherRoot, '.qa'))).toEqual(otherBefore);
          expect((await fetch(runUrl)).status).toBe(404);
          expect((await fetch(shotUrl)).status).toBe(404);
          const report = new QapDatabase(join(root, '.qa/runtime'));
          expect(report.getRun('interrupted-host-recovery')).toBeNull();
          report.reindex();
          expect(report.getRun('interrupted-host-recovery')).toBeNull();
          report.close();
        }
      } finally { await restarted.close(); }
      expect(existsSync(join(root, '.qa/reports/screenshots', prepared.operationId))).toBe(false);
      if (process.env.QAP_ACCEPTANCE_EVIDENCE) writeFileSync(process.env.QAP_ACCEPTANCE_EVIDENCE, JSON.stringify({
        result: 'PASS', chromium: prepared.result.result, operationId: prepared.operationId,
        barrier: 'run.json persisted before SQLite commit', physicalTermination: true,
        reporterBeforeAndAfter: 404, sqliteRowsBeforeAndAfter: before.length,
        automaticMcpReopenCount: 2, interruptedRunRemoved: true, committedRunFilesPreserved: committedBefore.length,
        projectBFilesPreserved: otherBefore.length,
      }, null, 2));
    } finally {
      if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
      await viewer.close();
    }
    bootstrap.close();
    service.close();
  }, 90_000);

  // Scenario 13: Physical Chromium Execution against isolated local HTTP server (PASS and FAIL)
  it('Scenario 13: physical Playwright Chromium execution against isolated local HTTP fixture (Real PASS & FAIL)', async () => {
    const root = initProject(localServerUrl);
    seedModule(root, 'physical-mod');

    // Case 1: Real PASS against /approved
    seedTestCase(root, 'physical-mod', 'TC-PASS', {
      steps: [
        { type: 'navigate', url: `${localServerUrl}/approved` },
        { type: 'assert', selector: '#title', assertion_type: 'visible', timeout: 2000 },
      ],
    });

    // Case 2: Real FAIL against /failed with failing assertion on text content (fails in <50ms)
    seedTestCase(root, 'physical-mod', 'TC-FAIL', {
      steps: [
        { type: 'navigate', url: `${localServerUrl}/failed` },
        { type: 'assert', selector: '#title', assertion_type: 'contains', expected: 'ExpectedApprovedText', timeout: 500 },
      ],
    });

    await generateLegitimatePlan(root, 'physical-mod', 'local');

    const auths: TestNavigationAuthorization[] = [
      {
        projectRoot: root,
        allowedOrigins: ['http://127.0.0.1:*'],
      },
    ];

    const handler = new TestHandler({ projectRoots: [root] }, auths);
    const res = await handler.execute(
      { module: 'physical-mod', targetPath: root, environment: 'local' },
      { requestId: 'test-scen-physical', signal: new AbortController().signal }
    );

    const data = JSON.parse(res.content[0].text as string);
    // Real physical execution completed with 1 PASS and 1 FAIL
    expect(data.result).toBe('partial');
    expect(data.summary.total).toBe(2);
    expect(data.summary.passed).toBe(1);
    expect(data.summary.failed).toBe(1);

    const passCase = data.cases.find((c: any) => c.id === 'TC-PASS');
    expect(passCase).toBeDefined();
    expect(passCase.result).toBe('passed');
    expect(passCase.duration_ms).toBeGreaterThan(0);

    const failCase = data.cases.find((c: any) => c.id === 'TC-FAIL');
    expect(failCase).toBeDefined();
    expect(failCase.result).toBe('failed');
    expect(failCase.failure_type).toMatch(/selector_not_found|assertion_failed/);
  }, 15000);
});


describe('VNEXT-014-D preflight — execution evidence integrity', () => {
  async function setup(): Promise<string> {
    const root = initProject(localServerUrl);
    seedModule(root, 'evidence-mod');
    seedTestCase(root, 'evidence-mod', 'TC-001');
    await generateLegitimatePlan(root, 'evidence-mod');
    return root;
  }

  function sampleExecution(executionId = 'exec_evidence_001') {
    const now = new Date().toISOString();
    return {
      _version: '1',
      execution_id: executionId,
      module: 'evidence-mod',
      env: 'local',
      started_at: now,
      finished_at: now,
      result: 'passed',
      timed_out: false,
      summary: { total: 1, passed: 1, failed: 0, skipped: 0, not_run: 0 },
      cases: [{ id: 'TC-001', title: 'Test Case TC-001', result: 'passed', duration_ms: 1 }],
    };
  }

  async function executeMocked(root: string, execution: unknown) {
    const runner = { execute: vi.fn().mockResolvedValue(execution) };
    const handler = new TestHandler(
      { projectRoots: [root] },
      {
        testAuthorizations: [{ projectRoot: root, allowedOrigins: ['*'] }],
        runner,
      }
    );
    const response = await handler.execute(
      { module: 'evidence-mod', targetPath: root, environment: 'local' },
      { requestId: 'evidence-preflight', signal: new AbortController().signal }
    );
    return { response, body: JSON.parse(response.content[0].text as string) as Record<string, unknown>, runner };
  }

  it('D-01: does not persist schema-invalid runner outputs', async () => {
    const root = await setup();
    const save = vi.spyOn(FileSystemStorage.prototype, 'saveExecutionResult');
    const invalid = { ...sampleExecution(), result: 'nonexistent_result' };

    const { response, body } = await executeMocked(root, invalid);

    expect(response.isError).toBe(true);
    expect(body.status).toBe('error');
    expect(body.code).toBe('invalid_execution_result');
    expect(save).not.toHaveBeenCalled();
    expect(existsSync(join(root, '.qa', 'executions', 'exec_evidence_001.json'))).toBe(false);
  });

  it('D-02: refuses traversal-capable execution IDs despite schema v1 accepting strings', async () => {
    const root = await setup();
    const save = vi.spyOn(FileSystemStorage.prototype, 'saveExecutionResult');

    const { response, body } = await executeMocked(root, sampleExecution('../outside'));

    expect(response.isError).toBe(true);
    expect(body.code).toBe('invalid_execution_id');
    expect(save).not.toHaveBeenCalled();
  });

  it('D-03: failed execution persistence cannot be reported as success or recorded in history', async () => {
    const root = await setup();
    vi.spyOn(FileSystemStorage.prototype, 'saveExecutionResult')
      .mockRejectedValueOnce(new Error('private disk path: no space'));
    const append = vi.spyOn(FileSystemStorage.prototype, 'appendHistory');

    const { response, body } = await executeMocked(root, sampleExecution());

    expect(response.isError).toBe(true);
    expect(body.status).toBe('error');
    expect(body.code).toBe('execution_not_persisted');
    expect(JSON.stringify(body)).not.toContain('private disk path');
    expect(append).not.toHaveBeenCalled();
  });

  it('D-04: history failure preserves saved evidence but returns an explicit partial error', async () => {
    const root = await setup();
    vi.spyOn(FileSystemStorage.prototype, 'appendHistory')
      .mockRejectedValueOnce(new Error('history file locked'));

    const { response, body } = await executeMocked(root, sampleExecution());

    expect(response.isError).toBe(true);
    expect(body.status).toBe('partial');
    expect(body.code).toBe('execution_history_not_persisted');
    expect(body.execution_saved).toBe(true);
    expect(body.history_saved).toBe(false);
    expect(body.execution_id).toBe('exec_evidence_001');
    const persisted = JSON.parse(
      readFileSync(join(root, '.qa', 'executions', 'exec_evidence_001.json'), 'utf8')
    );
    expect(persisted.result).toBe('passed');
  });

  it('D-05: rejects a schema-valid execution associated with a different module', async () => {
    const root = await setup();
    const save = vi.spyOn(FileSystemStorage.prototype, 'saveExecutionResult');
    const swapped = { ...sampleExecution('exec_wrong_module'), module: 'other-module' };

    const { response, body } = await executeMocked(root, swapped);

    expect(response.isError).toBe(true);
    expect(body.code).toBe('inconsistent_execution_result');
    expect(save).not.toHaveBeenCalled();
  });

  it('D-06: rejects summary totals that disagree with executed cases', async () => {
    const root = await setup();
    const save = vi.spyOn(FileSystemStorage.prototype, 'saveExecutionResult');
    const incorrect = {
      ...sampleExecution('exec_wrong_count'),
      summary: { total: 2, passed: 2, failed: 0, skipped: 0, not_run: 0 },
    };

    const { response, body } = await executeMocked(root, incorrect);

    expect(response.isError).toBe(true);
    expect(body.code).toBe('inconsistent_execution_result');
    expect(save).not.toHaveBeenCalled();
  });

  it('D-07: a critical runner error persists not_run evidence without reporting MCP success', async () => {
    const root = await setup();
    const interrupted = {
      ...sampleExecution('exec_interrupted'),
      result: 'error',
      summary: { total: 1, passed: 0, failed: 0, skipped: 0, not_run: 1 },
      cases: [{
        id: 'TC-001',
        title: 'Test Case TC-001',
        result: 'not_run',
        not_run_reason: 'Interrupción crítica de la ejecución',
        duration_ms: 0,
      }],
    };

    const { response, body } = await executeMocked(root, interrupted);

    expect(response.isError).toBe(true);
    expect(body.status).toBe('error');
    expect(body.code).toBe('runner_execution_error');
    const saved = JSON.parse(
      readFileSync(join(root, '.qa', 'executions', 'exec_interrupted.json'), 'utf8')
    ) as { result: string; summary: { not_run: number } };
    expect(saved.result).toBe('error');
    expect(saved.summary.not_run).toBe(1);
  });
});

describe('Post-commit consistency & MCP crash recovery acceptance (C, D, E, F)', () => {
  const runtimeGlobals = globalThis as unknown as {
    process: { execPath: string; env: Record<string, string | undefined> };
    setTimeout: (cb: () => void, ms: number) => unknown;
    clearTimeout: (handle: unknown) => void;
    fetch: (url: string) => Promise<{ status: number }>;
  };

  async function setupAuthorizedMcpWorkspace() {
    const root = realpathSync(initProject(localServerUrl));
    const otherRoot = realpathSync(initProject(localServerUrl));
    seedModule(root, 'mcp-mod');
    const host = createTempDir('qap-postcommit-host-');
    mkdirSync(host, { recursive: true });
    const appDir = join(host, 'application');
    const workspaceDir = join(host, 'workspaces');

    execFileSync(runtimeGlobals.process.execPath, [resolve('../../scripts/qap-authorize-workspace.mjs'), root], {
      env: { ...runtimeGlobals.process.env, QAP_MCP_APP_SERVICE_DIR: appDir, QAP_MCP_WORKSPACE_HOST_DIR: workspaceDir },
      windowsHide: true,
    });
    execFileSync(runtimeGlobals.process.execPath, [resolve('../../scripts/qap-authorize-workspace.mjs'), otherRoot], {
      env: { ...runtimeGlobals.process.env, QAP_MCP_APP_SERVICE_DIR: appDir, QAP_MCP_WORKSPACE_HOST_DIR: workspaceDir },
      windowsHide: true,
    });

    const service = new QapApplicationService({ hostRootDir: appDir, projectOperationDirectory: workspaceDir });
    const bootstrap = new WorkspaceBootstrap(workspaceDir, service);
    await bootstrap.prepare(root, localServerUrl);
    await bootstrap.prepare(otherRoot, localServerUrl);

    const project = service.findActiveProjectByRoot(root)!;
    const executeGrant = service.authority.grant({
      project_id: project.project_id,
      capability: 'execute',
      scope: { root_path: root, origin: localServerUrl, env_id: project.active_env_id! },
      granted_by: 'test',
    });
    const proposed = service.proposeModuleCases({
      projectId: project.project_id,
      moduleKey: 'mcp-mod',
      proposals: [
        {
          case_id: 'TC-001',
          title: 'Test Case TC-001',
          expected_outcome: 'Approved Page',
          oracle_source: 'user',
          expectation_metadata: { decision_status: 'accredited' },
          steps: [
            { type: 'navigate', url: `${localServerUrl}/approved` },
            { type: 'assert', selector: '#title', assertion_type: 'contains', expected: 'Approved Page' },
          ],
        },
      ],
    });
    expect(proposed.proposed).toHaveLength(1);
    expect(
      service.approveCaseBatch({
        projectId: project.project_id,
        moduleKey: 'mcp-mod',
        caseIds: ['TC-001'],
        approvedBy: 'test',
      }).status,
    ).toBe('approved');

    const approvedCase = service.listServiceCases(project.project_id, 'mcp-mod').find(tc => tc.case_id === 'TC-001')!;
    await new FileSystemStorage({ rootDir: root }).saveTestCase('mcp-mod', materializeReviewedCase(approvedCase, 'mcp-mod'));
    await generateLegitimatePlan(root, 'mcp-mod', 'local');

    bootstrap.close();
    service.close();

    return { root, otherRoot, host, appDir, workspaceDir, projectId: project.project_id, executeGrantId: executeGrant.grant_id };
  }

  const snapshotTree = (dir: string): Array<[string, string]> =>
    existsSync(dir)
      ? readdirSync(dir, { recursive: true })
          .map(String)
          .sort()
          .filter((p: string) => statSync(join(dir, p)).isFile())
          .map((p: string) => [p, createHash('sha256').update(readFileSync(join(dir, p))).digest('hex')])
      : [];

  it('C & E: recovers a crash after SQLite COMMIT without relaunching Chromium, preserves IDs, is idempotent, and isolates neighbor projects', async () => {
    const { root, otherRoot, host, appDir, workspaceDir, projectId } = await setupAuthorizedMcpWorkspace();
    const otherBefore = snapshotTree(join(otherRoot, '.qa'));
    const mcpIndexUrl = pathToFileURL(resolve('dist/index.js')).href;
    const reporterUrl = pathToFileURL(resolve('../reporter/dist/index.js')).href;
    const { QapDatabase, startViewerServer } = await import(reporterUrl);

    // Child runs real MCP TestHandler with real Chromium, then stalls at deterministic barrier AFTER SQLite COMMIT
    // and BEFORE FileSystemStorage.saveExecutionResult + finalizeExecutionAttempt.
    const childScript = `
      import { Client } from '@modelcontextprotocol/sdk/client/index.js';
      import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
      import { FileSystemStorage } from '@qap/knowledge';
      import fs from 'node:fs';

      const originalSave = FileSystemStorage.prototype.saveExecutionResult;
      FileSystemStorage.prototype.saveExecutionResult = async function(...args) {
        fs.writeSync(1, 'POST_COMMIT_BARRIER:' + args[0] + '\\n');
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0);
        return originalSave.apply(this, args);
      };

      const { createMcpServer, QapApplicationService, WorkspaceBootstrap } = await import(process.argv[1]);
      const [root, appDir, workspaceDir, url] = process.argv.slice(2);
      const service = new QapApplicationService({ hostRootDir: appDir, projectOperationDirectory: workspaceDir });
      const bootstrap = new WorkspaceBootstrap(workspaceDir, service);
      const server = createMcpServer({
        projectRoots: [root],
        testAuthorizations: [{ projectRoot: root, allowedOrigins: [url] }],
        applicationService: service,
        workspaceBootstrap: bootstrap,
        hostRegistryPath: workspaceDir + '/authorized-roots.json',
      });
      const [ct, st] = InMemoryTransport.createLinkedPair();
      const client = new Client({ name: 'crash-post-commit', version: '1' }, { capabilities: {} });
      await server.connect(st);
      await client.connect(ct);
      await client.callTool({ name: 'qap_test', arguments: { module: 'mcp-mod', targetPath: root, environment: 'local' } });
    `;

    const child = spawn(
      runtimeGlobals.process.execPath,
      ['--input-type=module', '-e', childScript, mcpIndexUrl, root, appDir, workspaceDir, localServerUrl],
      { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true },
    );
    let stderr = '';
    let executionId = '';
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk: string) => { stderr += chunk; });

    try {
      await new Promise<void>((resolveBarrier, reject) => {
        const timeout = runtimeGlobals.setTimeout(() => reject(new Error(`post-commit barrier timeout: ${stderr}`)), 45000);
        child.stdout.setEncoding('utf8');
        child.stdout.on('data', (chunk: string) => {
          const match = chunk.match(/POST_COMMIT_BARRIER:([^\r\n]+)/);
          if (match) {
            executionId = match[1].trim();
            runtimeGlobals.clearTimeout(timeout);
            resolveBarrier();
          }
        });
        child.once('exit', (code: number | null) => {
          runtimeGlobals.clearTimeout(timeout);
          reject(new Error(`child exited ${code}: ${stderr}`));
        });
      });

      // Verify pre-kill state: runtime SQLite already has 1 committed run, attempt is still 'running' with 0 case results
      const preDb = new QapDatabase(join(root, '.qa/runtime'), false, { readOnly: true });
      const preRuns = preDb.listRuns() as Array<{ run_id: string }>;
      preDb.close();
      expect(preRuns).toHaveLength(1);
      const attemptId = preRuns[0].run_id;
      expect(existsSync(join(root, '.qa/executions', `${executionId}.json`))).toBe(false);

      const preService = new QapApplicationService({ hostRootDir: appDir, projectOperationDirectory: workspaceDir });
      const preAttempts = preService.listExecutionAttempts(projectId, 'mcp-mod');
      expect(preAttempts).toHaveLength(1);
      expect(preAttempts[0].attempt_id).toBe(attemptId);
      expect(preAttempts[0].execution_id).toBe(executionId);
      expect(preAttempts[0].status).toBe('running');
      expect(preService.getExecutionSummary(projectId, 'mcp-mod').case_verdicts).toHaveLength(0);
      preService.close();

      // Physically terminate process after SQLite COMMIT
      const exited = new Promise((resolveExit) => child.once('exit', resolveExit));
      child.kill('SIGKILL');
      await exited;
    } finally {
      if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
    }

    // Reopen fresh MCP host via stdio WITHOUT running qap_test / Chromium; repeat qap_status for idempotency
    const restarted = new Client({ name: 'post-commit-restart', version: '1' });
    await restarted.connect(
      new StdioClientTransport({
        command: runtimeGlobals.process.execPath,
        args: [resolve('dist/server.js')],
        stderr: 'pipe',
        env: { ...runtimeGlobals.process.env, QAP_MCP_HOST_DATA_DIR: host, QAP_MCP_WORKSPACE_ROOT: root, NODE_ENV: 'test' } as Record<string, string>,
      }),
    );
    const viewer = await startViewerServer({ storage: { getProjectRoot: () => root }, port: 0, host: '127.0.0.1', silent: true });
    try {
      for (let i = 0; i < 3; i++) {
        const opened = await restarted.callTool({ name: 'qap_status', arguments: { targetPath: root } });
        expect(opened.isError, JSON.stringify(opened)).toBeFalsy();
      }

      const postDb = new QapDatabase(join(root, '.qa/runtime'), false, { readOnly: true });
      const postRuns = postDb.listRuns() as Array<{ run_id: string }>;
      postDb.close();
      expect(postRuns).toHaveLength(1);
      const attemptId = postRuns[0].run_id;

      expect(existsSync(join(root, '.qa/runtime/runs', attemptId, '.qap-committed'))).toBe(true);
      expect(existsSync(join(root, '.qa/runtime/runs', attemptId, '.qap-publication-pending'))).toBe(false);
      expect(existsSync(join(root, '.qa/executions', `${executionId}.json`))).toBe(true);
      expect(existsSync(join(root, '.qa/cache/history/mcp-mod.jsonl'))).toBe(true);

      const historyLines = readFileSync(join(root, '.qa/cache/history/mcp-mod.jsonl'), 'utf8')
        .trim()
        .split(/\r?\n/)
        .filter(Boolean);
      expect(historyLines).toHaveLength(1);

      const reportDb = new QapDatabase(join(root, '.qa/runtime'));
      expect(reportDb.getRun(attemptId)?.runId).toBe(attemptId);
      reportDb.close();
      expect((await runtimeGlobals.fetch(`${viewer.url}/api/runs/${attemptId}`)).status).toBe(200);

      const postService = new QapApplicationService({ hostRootDir: appDir, projectOperationDirectory: workspaceDir });
      const postAttempts = postService.listExecutionAttempts(projectId, 'mcp-mod');
      expect(postAttempts).toHaveLength(1);
      expect(postAttempts[0].attempt_id).toBe(attemptId);
      expect(postAttempts[0].execution_id).toBe(executionId);
      expect(postAttempts[0].status).toBe('completed');
      expect(postAttempts[0].raw_execution_path).toBe(`.qa/executions/${executionId}.json`);
      expect(postAttempts[0].video_path).toBe(`.qa/runtime/runs/${attemptId}/artifacts/attempt.webm`);
      const summary = postService.getExecutionSummary(projectId, 'mcp-mod');
      expect(summary.total_attempts).toBe(1);
      expect(summary.case_verdicts).toHaveLength(1);
      expect(summary.case_verdicts[0].verdict).toBe('PASS');
      postService.close();

      expect(snapshotTree(join(otherRoot, '.qa'))).toEqual(otherBefore);
    } finally {
      await viewer.close();
      await restarted.close();
    }
  }, 90_000);

  it('D: classifies post-commit .qap-committed receipt failure as execution_finalization_pending (never execution_not_persisted) and repairs idempotently', async () => {
    const { root, host, appDir, workspaceDir, projectId } = await setupAuthorizedMcpWorkspace();
    const mcpIndexUrl = pathToFileURL(resolve('dist/index.js')).href;

    const childScript = `
      import fs from 'node:fs';
      import { Client } from '@modelcontextprotocol/sdk/client/index.js';
      import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

      const originalWrite = fs.writeFileSync;
      fs.writeFileSync = function(p, ...args) {
        if (typeof p === 'string' && p.endsWith('.qap-committed')) {
          throw new Error('receipt write failed after commit');
        }
        return originalWrite.call(this, p, ...args);
      };

      const { createMcpServer, QapApplicationService, WorkspaceBootstrap } = await import(process.argv[1]);
      const [root, appDir, workspaceDir, url] = process.argv.slice(2);
      const service = new QapApplicationService({ hostRootDir: appDir, projectOperationDirectory: workspaceDir });
      const bootstrap = new WorkspaceBootstrap(workspaceDir, service);
      const server = createMcpServer({
        projectRoots: [root],
        testAuthorizations: [{ projectRoot: root, allowedOrigins: [url] }],
        applicationService: service,
        workspaceBootstrap: bootstrap,
        hostRegistryPath: workspaceDir + '/authorized-roots.json',
      });
      const [ct, st] = InMemoryTransport.createLinkedPair();
      const client = new Client({ name: 'receipt-failure-mcp', version: '1' }, { capabilities: {} });
      await server.connect(st);
      await client.connect(ct);
      const res = await client.callTool({ name: 'qap_test', arguments: { module: 'mcp-mod', targetPath: root, environment: 'local' } });
      await client.close();
      await server.close();
      bootstrap.close();
      service.close();
      console.log(JSON.stringify(JSON.parse(res.content[0].text)));
    `;

    // The loopback application runs on the parent event loop while Chromium runs in the child.
    const childRun = await promisify(execFile)(
      runtimeGlobals.process.execPath,
      ['--input-type=module', '-e', childScript, mcpIndexUrl, root, appDir, workspaceDir, localServerUrl],
      { encoding: 'utf8', windowsHide: true, timeout: 60000 },
    );
    const body = JSON.parse(childRun.stdout.trim()) as Record<string, unknown>;
    expect(body.code).toBe('execution_finalization_pending');
    expect(body.code).not.toBe('execution_not_persisted');
    expect(body.status).toBe('partial');
    expect(body.committed).toBe(true);
    expect(body.finalization_pending).toBe(true);
    const executionId = String(body.execution_id);
    const attemptId = String(body.attempt_id);
    expect(existsSync(join(root, '.qa/runtime/runs', attemptId, '.qap-committed'))).toBe(false);
    expect(existsSync(join(root, '.qa/runtime/runs', attemptId, '.qap-publication-pending'))).toBe(true);

    const pendingService = new QapApplicationService({ hostRootDir: appDir, projectOperationDirectory: workspaceDir });
    const pendingAttempt = pendingService.listExecutionAttempts(projectId, 'mcp-mod');
    expect(pendingAttempt).toHaveLength(1);
    expect(pendingAttempt[0].status).toBe('running');
    expect(pendingAttempt[0].error_code).toBe('execution_finalization_pending');
    pendingService.close();

    // Recover via reopened MCP host without relaunching Chromium
    const restarted = new Client({ name: 'receipt-recover', version: '1' });
    await restarted.connect(
      new StdioClientTransport({
        command: runtimeGlobals.process.execPath,
        args: [resolve('dist/server.js')],
        stderr: 'pipe',
        env: { ...runtimeGlobals.process.env, QAP_MCP_HOST_DATA_DIR: host, QAP_MCP_WORKSPACE_ROOT: root, NODE_ENV: 'test' } as Record<string, string>,
      }),
    );
    try {
      const s1 = await restarted.callTool({ name: 'qap_status', arguments: { targetPath: root } });
      expect(s1.isError, JSON.stringify(s1)).toBeFalsy();
      const s2 = await restarted.callTool({ name: 'qap_status', arguments: { targetPath: root } });
      expect(s2.isError, JSON.stringify(s2)).toBeFalsy();
    } finally {
      await restarted.close();
    }

    expect(existsSync(join(root, '.qa/runtime/runs', attemptId, '.qap-committed'))).toBe(true);
    expect(existsSync(join(root, '.qa/runtime/runs', attemptId, '.qap-publication-pending'))).toBe(false);
    const recoveredService = new QapApplicationService({ hostRootDir: appDir, projectOperationDirectory: workspaceDir });
    const attempts = recoveredService.listExecutionAttempts(projectId, 'mcp-mod');
    expect(attempts).toHaveLength(1);
    expect(attempts[0].attempt_id).toBe(attemptId);
    expect(attempts[0].execution_id).toBe(executionId);
    expect(attempts[0].status).toBe('completed');
    expect(attempts[0].error_code).toBeNull();
    expect(recoveredService.getExecutionSummary(projectId, 'mcp-mod').case_verdicts).toHaveLength(1);
    recoveredService.close();
  }, 90_000);

  it('F: never reactivates an execution whose grant was revoked before commit or replaces revoked grants during recovery', async () => {
    const { root, host, appDir, workspaceDir, projectId, executeGrantId } = await setupAuthorizedMcpWorkspace();
    const reporterUrl = pathToFileURL(resolve('../reporter/dist/index.js')).href;
    const { QapDatabase } = await import(reporterUrl);

    // 1. Revoke execute grant before commit and seed an uncommitted pending publication from a dead pid
    const service = new QapApplicationService({ hostRootDir: appDir, projectOperationDirectory: workspaceDir });
    const bootstrap = new WorkspaceBootstrap(workspaceDir, service);
    service.authority.revokeGrant(projectId, executeGrantId);

    const dead = spawnSync(runtimeGlobals.process.execPath, ['-e', ''], { windowsHide: true });
    const attempt = service.createExecutionAttempt({
      projectId,
      moduleKey: 'mcp-mod',
      attemptId: 'revoked-precommit-att',
      executionId: 'exec_revoked_precommit',
      cases: [{ case_id: 'TC-001' }],
    });
    service.markAttemptRunning(attempt.attempt_id);
    const pendingRunDir = join(root, '.qa/runtime/runs/revoked-precommit-att');
    mkdirSync(join(pendingRunDir, 'artifacts'), { recursive: true });
    writeFileSync(
      join(pendingRunDir, '.qap-publication-pending'),
      JSON.stringify({
        operationId: 'qap-provisional-revoked123',
        runId: 'revoked-precommit-att',
        pid: dead.pid,
        executionId: 'exec_revoked_precommit',
        attemptId: 'revoked-precommit-att',
      }),
    );
    writeFileSync(join(pendingRunDir, 'run.json'), JSON.stringify({ runId: 'revoked-precommit-att' }));

    // Reopening via bootstrap/status reconciles uncommitted artifact away and NEVER commits or reactivates it
    await bootstrap.prepare(root, localServerUrl);
    expect(existsSync(pendingRunDir)).toBe(false);
    expect(existsSync(join(root, '.qa/executions/exec_revoked_precommit.json'))).toBe(false);
    expect(service.listExecutionAttempts(projectId, 'mcp-mod')).toHaveLength(0);
    if (existsSync(join(root, '.qa/runtime/qap.sqlite'))) {
      const db = new QapDatabase(join(root, '.qa/runtime'), false, { readOnly: true });
      const rows = db.listRuns();
      db.close();
      expect(rows).toHaveLength(0);
    }

    // 2. Attempting qap_test with revoked execute grant remains blocked and grants are not replaced
    const server = createMcpServer({
      projectRoots: [root],
      testAuthorizations: [{ projectRoot: root, allowedOrigins: [localServerUrl] }],
      applicationService: service,
      workspaceBootstrap: bootstrap,
      hostRegistryPath: join(workspaceDir, 'authorized-roots.json'),
    });
    const [ct, st] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: 'revoked-client', version: '1' }, { capabilities: {} });
    await server.connect(st);
    await client.connect(ct);
    const blockedRes = await client.callTool({
      name: 'qap_test',
      arguments: { module: 'mcp-mod', targetPath: root, environment: 'local' },
    });
    expect(blockedRes.isError).toBe(true);
    expect(JSON.parse((blockedRes.content as Array<{ text: string }>)[0].text).code).toBe('capability_execute_revoked');

    // 3. Revoking access grant blocks recoverProject without replacing grants
    const accessGrant = service.authority.listGrants(projectId).find((g) => g.capability === 'access')!;
    const grantsBefore = service.authority.listGrants(projectId);
    service.authority.revokeGrant(projectId, accessGrant.grant_id);
    expect(() => bootstrap.recoverProject(root)).toThrow();
    expect(service.authority.listGrants(projectId).map((g) => g.grant_id)).toEqual(grantsBefore.map((g) => g.grant_id));

    await client.close();
    await server.close();
    bootstrap.close();
    service.close();
    expect(existsSync(host)).toBe(true);
  }, 60_000);
});
