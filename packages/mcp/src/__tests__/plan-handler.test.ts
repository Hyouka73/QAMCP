import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, symlinkSync, linkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { FileSystemStorage, SemanticHasher } from '@qap/knowledge';
import { afterEach, describe, expect, it, vi } from 'vitest';
import YAML from 'yaml';

import { McpToolError } from '../dispatcher.js';
import { PlanHandler } from '../handlers/plan.handler.js';
import { projectRoot } from '../handlers/state-services.js';
import { createMcpServer, type McpServerOptions } from '../server.js';

const directories: string[] = [];
const connections: Array<{ client: Client; server: ReturnType<typeof createMcpServer> }> = [];

function directory(): string {
  const path = mkdtempSync(join(tmpdir(), 'qap-plan-test-'));
  directories.push(path);
  return path;
}

function initProject(root = directory()): string {
  mkdirSync(join(root, '.qa', 'project'), { recursive: true });
  writeFileSync(
    join(root, '.qa', 'project', 'context.yaml'),
    YAML.stringify({
      _version: '1',
      project_name: 'PlanTestProject',
      objective: 'Testing PlanHandler real declarative behavior',
      objective_source: 'user',
    }),
    'utf8'
  );
  writeFileSync(
    join(root, '.qa', 'project', 'environments.yaml'),
    YAML.stringify({
      default: 'local',
      environments: { local: { url: 'https://example.test' } },
    }),
    'utf8'
  );
  return root;
}

function seedModule(root: string, moduleName: string): void {
  const modDir = join(root, '.qa', 'modules', moduleName);
  mkdirSync(modDir, { recursive: true });
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
  writeFileSync(
    join(modDir, 'selectors.json'),
    JSON.stringify({ selectors: { submitButton: '#submit' } }),
    'utf8'
  );
}

function seedTestCase(
  root: string,
  moduleName: string,
  caseId: string,
  options: {
    depends_on?: string[];
    manually_edited?: boolean;
    steps?: Array<Record<string, unknown>>;
  } = {}
): void {
  const testsDir = join(root, '.qa', 'modules', moduleName, 'tests');
  mkdirSync(testsDir, { recursive: true });
  const tc = {
    _version: '1',
    id: caseId,
    name: `Test Case ${caseId}`,
    depends_on: options.depends_on ?? [],
    manually_edited: options.manually_edited ?? false,
    steps: options.steps ?? [
      {
        type: 'navigate',
        url: `https://example.test/${moduleName}`,
      },
      {
        type: 'assert',
        selector: '#main',
        assertion_type: 'visible',
      },
    ],
  };
  writeFileSync(join(testsDir, `${caseId}.yaml`), YAML.stringify(tc), 'utf8');
}

async function connect(options: McpServerOptions = {}): Promise<Client> {
  const server = createMcpServer(options);
  const client = new Client({ name: 'plan-test-client', version: '1.0' });
  const [a, b] = InMemoryTransport.createLinkedPair();
  connections.push({ client, server });
  await server.connect(b);
  await client.connect(a);
  return client;
}

async function callTool(client: Client, name: string, args: Record<string, unknown>) {
  const response = await client.request(
    { method: 'tools/call', params: { name, arguments: args } },
    CallToolResultSchema
  );
  const item = response.content[0];
  if (item.type !== 'text') throw new Error('Expected text content');
  return { response, data: JSON.parse(item.text) as Record<string, any> };
}

afterEach(async () => {
  for (const { client, server } of connections.splice(0)) {
    await client.close();
    await server.close();
  }
  directories.splice(0).forEach(root => {
    try {
      rmSync(root, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });
});

describe('PlanHandler Real Declarative Implementation (VNEXT-014-B)', () => {
  // Criterion 1: Topological DAG ordering via DependencyGraphResolver
  it('resolves correct topological DAG order respecting dependencies and persists plan.json', async () => {
    const root = initProject();
    seedModule(root, 'checkout');

    // Create DAG: TC-001 (no deps), TC-002 -> TC-001, TC-003 -> TC-002
    // Seed them in reverse order to ensure sorting does not depend on file write order
    seedTestCase(root, 'checkout', 'TC-003', { depends_on: ['TC-002'] });
    seedTestCase(root, 'checkout', 'TC-001', { depends_on: [] });
    seedTestCase(root, 'checkout', 'TC-002', { depends_on: ['TC-001'] });

    const handler = new PlanHandler({ projectRoots: [root] });
    const res = await handler.execute(
      { module: 'checkout', targetPath: root, environment: 'staging' },
      { requestId: 'test-1', signal: new AbortController().signal }
    );

    expect(res.isError).toBe(false);
    const data = JSON.parse(res.content[0].text as string);
    expect(data.status).toBe('success');
    expect(data.module).toBe('checkout');
    expect(data.environment).toBe('staging');
    expect(data.has_cycles).toBe(false);
    expect(data.ordered_nodes).toEqual(['TC-001', 'TC-002', 'TC-003']);
    expect(data.order).toEqual(['TC-001', 'TC-002', 'TC-003']);
    expect(data.total_cases).toBe(3);

    // Verify standard persistence in .qa/modules/checkout/tests/plan.json
    const planFile = join(root, '.qa', 'modules', 'checkout', 'tests', 'plan.json');
    expect(existsSync(planFile)).toBe(true);
    const persisted = JSON.parse(readFileSync(planFile, 'utf8'));
    expect(persisted._version).toBe('1');
    expect(persisted.module).toBe('checkout');
    expect(persisted.matrix.cases).toEqual(['TC-001', 'TC-002', 'TC-003']);
    expect(persisted.matrix.environment).toBe('staging');
    expect(persisted.checksum).toMatch(/^[a-f0-9]{64}$/);
  });

  // Criterion 2: Missing dependencies handling
  it('detects missing dependencies and returns structured error without crashing', async () => {
    const root = initProject();
    seedModule(root, 'billing');
    seedTestCase(root, 'billing', 'TC-001', { depends_on: ['TC-NONEXISTENT'] });

    const handler = new PlanHandler({ projectRoots: [root] });
    const res = await handler.execute(
      { module: 'billing', targetPath: root },
      { requestId: 'test-2', signal: new AbortController().signal }
    );

    expect(res.isError).toBe(true);
    const data = JSON.parse(res.content[0].text as string);
    expect(data.status).toBe('error');
    expect(data.code).toBe('missing_dependencies');
    expect(data.missing_dependencies).toEqual([
      { case_id: 'TC-001', missing_dependency: 'TC-NONEXISTENT' },
    ]);
  });

  // Criterion 3: Duplicate IDs handling
  it('detects duplicate case IDs across files and reports error before graph resolution', async () => {
    const root = initProject();
    seedModule(root, 'auth');

    // Create two files that both declare id: 'TC-001'
    seedTestCase(root, 'auth', 'TC-001');
    const testsDir = join(root, '.qa', 'modules', 'auth', 'tests');
    const duplicateCase = {
      _version: '1',
      id: 'TC-001', // duplicate id in a different file
      name: 'Duplicate Case',
      steps: [{ type: 'navigate', url: 'https://example.test/auth' }],
    };
    writeFileSync(join(testsDir, 'TC-002.yaml'), YAML.stringify(duplicateCase), 'utf8');

    const handler = new PlanHandler({ projectRoots: [root] });
    const res = await handler.execute(
      { module: 'auth', targetPath: root },
      { requestId: 'test-3', signal: new AbortController().signal }
    );

    expect(res.isError).toBe(true);
    const data = JSON.parse(res.content[0].text as string);
    expect(data.status).toBe('error');
    expect(data.code).toBe('duplicate_case_ids');
    expect(data.duplicate_ids).toContain('TC-001');
  });

  // Criterion 4: Cycle detection without crashing
  it('detects cyclic dependencies safely returning cycle information without unhandled crashes', async () => {
    const root = initProject();
    seedModule(root, 'catalog');

    // TC-001 -> TC-002 -> TC-001
    seedTestCase(root, 'catalog', 'TC-001', { depends_on: ['TC-002'] });
    seedTestCase(root, 'catalog', 'TC-002', { depends_on: ['TC-001'] });

    const handler = new PlanHandler({ projectRoots: [root] });
    const res = await handler.execute(
      { module: 'catalog', targetPath: root },
      { requestId: 'test-4', signal: new AbortController().signal }
    );

    expect(res.isError).toBe(true);
    const data = JSON.parse(res.content[0].text as string);
    expect(data.status).toBe('error');
    expect(data.code).toBe('cyclic_dependency');
    expect(data.has_cycles).toBe(true);
    expect(Array.isArray(data.cycles)).toBe(true);
    expect(data.cycles.length).toBeGreaterThan(0);
    expect(data.ordered_nodes).toEqual([]);
    expect(data.order).toEqual([]);
  });

  // Criterion 5: Module without executable cases returns cases: [] without fake fabrication
  it('returns explicit cases: [] when module directory has no test cases', async () => {
    const root = initProject();
    seedModule(root, 'empty-mod');

    const handler = new PlanHandler({ projectRoots: [root] });
    const res = await handler.execute(
      { module: 'empty-mod', targetPath: root },
      { requestId: 'test-5a', signal: new AbortController().signal }
    );

    expect(res.isError).toBe(false);
    const data = JSON.parse(res.content[0].text as string);
    expect(data.status).toBe('empty');
    expect(data.code).toBe('no_test_cases');
    expect(data.cases).toEqual([]);
    expect(data.ordered_nodes).toEqual([]);
    expect(data.order).toEqual([]);
    expect(data.has_cycles).toBe(false);
  });

  it('returns explicit cases: [] when cases exist but lack executable steps', async () => {
    const root = initProject();
    seedModule(root, 'stepless-mod');
    seedTestCase(root, 'stepless-mod', 'TC-001', { steps: [] });

    const handler = new PlanHandler({ projectRoots: [root] });
    const res = await handler.execute(
      { module: 'stepless-mod', targetPath: root },
      { requestId: 'test-5b', signal: new AbortController().signal }
    );

    expect(res.isError).toBe(false);
    const data = JSON.parse(res.content[0].text as string);
    expect(data.status).toBe('empty');
    expect(data.code).toBe('no_executable_test_cases');
    expect(data.cases).toEqual([]);
    expect(data.ordered_nodes).toEqual([]);
  });

  // Criterion 6: Argument validation, unauthorized paths, symlinks and Windows multi-drive
  it('rejects invalid arguments (missing or malformed module)', () => {
    const handler = new PlanHandler({ projectRoots: [process.cwd()] });
    expect(handler.validateArguments({})).toBe(false);
    expect(handler.validateArguments({ module: '' })).toBe(false);
    expect(handler.validateArguments({ module: '   ' })).toBe(false);
    expect(handler.validateArguments({ module: '../traversal' })).toBe(false);
    expect(handler.validateArguments({ module: 'valid', unexpectedKey: 123 })).toBe(false);
    expect(handler.validateArguments({ module: 'valid', environment: 'local' })).toBe(true);
  });

  it('rejects unauthorized external targetPath outside authorized projectRoots', async () => {
    const rootA = initProject();
    const rootB = initProject(); // rootB is NOT in authorized projectRoots
    seedModule(rootB, 'secret');

    const handler = new PlanHandler({ projectRoots: [rootA] });
    await expect(
      handler.execute(
        { module: 'secret', targetPath: rootB },
        { requestId: 'test-sec-1', signal: new AbortController().signal }
      )
    ).rejects.toThrow(McpToolError);
  });

  it('rejects targetPath containing directory traversal escapes', async () => {
    const root = initProject();
    const handler = new PlanHandler({ projectRoots: [root] });

    await expect(
      handler.execute(
        { module: 'checkout', targetPath: join(root, '..', 'escaped') },
        { requestId: 'test-sec-2', signal: new AbortController().signal }
      )
    ).rejects.toThrow(McpToolError);
  });

  it('rejects symlinks and junctions inside project directory', async () => {
    const root = initProject();
    const external = directory();
    seedModule(external, 'linked');

    const link = join(root, '.qa', 'linked_junction');
    try {
      symlinkSync(external, link, 'junction');
      const handler = new PlanHandler({ projectRoots: [root] });
      await expect(
        handler.execute(
          { module: 'linked', targetPath: root },
          { requestId: 'test-sec-3', signal: new AbortController().signal }
        )
      ).rejects.toThrow(McpToolError);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'EPERM') {
        // Skip junction test if non-admin OS restricts symlink creation
      } else {
        throw err;
      }
    }
  });

  it('returns blocked status if target module is not registered in .qa/modules/', async () => {
    const root = initProject();
    const handler = new PlanHandler({ projectRoots: [root] });

    const res = await handler.execute(
      { module: 'unregistered-module', targetPath: root },
      { requestId: 'test-6', signal: new AbortController().signal }
    );

    expect(res.isError).toBe(true);
    const data = JSON.parse(res.content[0].text as string);
    expect(data.status).toBe('blocked');
    expect(data.code).toBe('module_not_found');
    expect(data.desbloquear_con).toBe('qap_status');
    expect(data.message).not.toContain('qap_discover');
    expect(data.message).toContain('qap_status');
  });

  // Criterion 7: Preservation of manually edited cases (UpdateGuard)
  it('identifies and preserves manually edited cases with UpdateGuard', async () => {
    const root = initProject();
    seedModule(root, 'profile');
    seedTestCase(root, 'profile', 'TC-AUTO', { manually_edited: false });
    seedTestCase(root, 'profile', 'TC-MANUAL', { manually_edited: true });

    const handler = new PlanHandler({ projectRoots: [root] });
    const res = await handler.execute(
      { module: 'profile', targetPath: root },
      { requestId: 'test-7', signal: new AbortController().signal }
    );

    expect(res.isError).toBe(false);
    const data = JSON.parse(res.content[0].text as string);
    expect(data.preserved_cases).toContain('TC-MANUAL');
    expect(data.preserved_cases).not.toContain('TC-AUTO');
  });

  // Criterion 8: Real MCP integration via ToolDispatcher and InMemoryTransport
  it('integrates completely with createMcpServer, exposes exactly 21 tools and dispatches qap_plan cleanly', async () => {
    const root = initProject();
    seedModule(root, 'orders');
    seedTestCase(root, 'orders', 'TC-001', { depends_on: [] });
    seedTestCase(root, 'orders', 'TC-002', { depends_on: ['TC-001'] });

    const client = await connect({ projectRoots: [root] });

    // 1. Verify exact 21 unique tools exposed
    const toolsResult = await client.listTools();
    expect(toolsResult.tools.length).toBe(21);
    const toolNames = toolsResult.tools.map(t => t.name);
    expect(new Set(toolNames).size).toBe(21);
    expect(toolNames).toContain('qap_plan');
    expect(toolNames).toContain('qap_test');
    expect(toolNames).toContain('qap_status');
    expect(toolNames).toContain('qap_discover');
    expect(toolNames).toContain('qap_start');

    // 2. Call qap_plan via real MCP protocol
    const { response, data } = await callTool(client, 'qap_plan', {
      module: 'orders',
      targetPath: root,
      environment: 'local',
    });

    expect(response.isError).toBeFalsy();
    expect(data.status).toBe('success');
    expect(data.module).toBe('orders');
    expect(data.ordered_nodes).toEqual(['TC-001', 'TC-002']);
    expect(data.has_cycles).toBe(false);

    // 3. Verify qap_test is dispatched to real TestHandler (migrated from legacy stub)
    const testToolRes = await callTool(client, 'qap_test', { module: 'orders', targetPath: root });
    expect(testToolRes.data.status).toBe('blocked');
    expect(['navigation_not_authorized', 'plan_missing']).toContain(testToolRes.data.code);
  });

  // Criterion 9: Absence of synthetic plans
  it('never synthesizes fake test cases or relies on fallback defaultPlan', async () => {
    const root = initProject();
    seedModule(root, 'no-fakes');

    const client = await connect({ projectRoots: [root] });
    const { data } = await callTool(client, 'qap_plan', {
      module: 'no-fakes',
      targetPath: root,
    });

    // Must return empty or blocked, never a synthetic test plan with fake cases
    expect(data.status).toBe('empty');
    expect(data.cases).toEqual([]);
    expect(data.ordered_nodes).toEqual([]);
    expect(data.total_cases).toBeUndefined();
  });

  // =========================================================================
  // VNEXT-014-B-R1 Stabilization Deterministic Regressions (FAIL BEFORE / PASS AFTER)
  // =========================================================================

  // Regression A: Checksum blindness vs cases_fingerprint sensitivity to YAML changes (R1.1, R1.2, R4)
  it('detects modifications in YAML steps and dependencies post-plan generation (FAIL BEFORE / PASS AFTER)', async () => {
    const root = initProject();
    seedModule(root, 'billing');
    seedTestCase(root, 'billing', 'TC-001', {
      steps: [{ type: 'navigate', url: 'https://example.test/billing' }],
    });
    seedTestCase(root, 'billing', 'TC-002', {
      depends_on: ['TC-001'],
      steps: [{ type: 'click', selector: '#pay' }],
    });

    const handler = new PlanHandler({ projectRoots: [root] });
    const res1 = await handler.execute(
      { module: 'billing', targetPath: root },
      { requestId: 'r1', signal: new AbortController().signal }
    );
    const data1 = JSON.parse(res1.content[0].text as string);

    // Initial plan on disk
    const planPath = join(root, '.qa', 'modules', 'billing', 'tests', 'plan.json');
    const planBefore = JSON.parse(readFileSync(planPath, 'utf8'));
    expect(planBefore.checksum).toBeDefined();
    expect(planBefore.cases_fingerprint).toBeDefined();

    // Modify steps in TC-001.yaml
    const tc1Path = join(root, '.qa', 'modules', 'billing', 'tests', 'TC-001.yaml');
    const tc1 = YAML.parse(readFileSync(tc1Path, 'utf8'));
    tc1.steps.push({ type: 'assert', selector: '#confirmation', assertion_type: 'visible' });
    writeFileSync(tc1Path, YAML.stringify(tc1), 'utf8');

    // Modify dependency in TC-002.yaml
    const tc2Path = join(root, '.qa', 'modules', 'billing', 'tests', 'TC-002.yaml');
    const tc2 = YAML.parse(readFileSync(tc2Path, 'utf8'));
    tc2.depends_on = [];
    writeFileSync(tc2Path, YAML.stringify(tc2), 'utf8');

    // FAIL BEFORE: The legacy checksum was blind to YAML step and dependency modifications!
    const legacyHasher = new SemanticHasher();
    const context = YAML.parse(readFileSync(join(root, '.qa', 'modules', 'billing', 'context.yaml'), 'utf8'));
    const selectors = JSON.parse(readFileSync(join(root, '.qa', 'modules', 'billing', 'selectors.json'), 'utf8'));
    const legacyChecksumAfter = legacyHasher.computeHash({ routes: context.routes, selectors: selectors.selectors });
    expect(planBefore.checksum).toBe(legacyChecksumAfter); // PROVES legacy checksum failed to detect the change!

    // PASS AFTER: cases_fingerprint detects the change and marks the plan obsolete
    const res2 = await handler.execute(
      { module: 'billing', targetPath: root },
      { requestId: 'r2', signal: new AbortController().signal }
    );
    const data2 = JSON.parse(res2.content[0].text as string);
    const planAfter = JSON.parse(readFileSync(planPath, 'utf8'));

    expect(planAfter.cases_fingerprint).toBeDefined();
    expect(planAfter.cases_fingerprint).not.toBe(planBefore.cases_fingerprint);
    expect(data2.cases_fingerprint).not.toBe(data1.cases_fingerprint);

    // Also inspect plan vigencia with PlanHandler.inspectPlanVigencia
    const vigenciaCheck = PlanHandler.inspectPlanVigencia(planBefore, { currentCases: [tc1, tc2] });
    expect(vigenciaCheck.validity).toBe('obsolete');
    expect(vigenciaCheck.is_fresh).toBe(false);
    expect(vigenciaCheck.code).toBe('cases_mismatch');
  });

  // Regression B: Authorized write enforcement with projectRoot(..., true) rejecting hardlinks in .qa (R2.1, R4)
  it('enforces authorized write mode and rejects directories with hardlinks in .qa (FAIL BEFORE / PASS AFTER)', async () => {
    const root = initProject();
    seedModule(root, 'hardlink-mod');
    seedTestCase(root, 'hardlink-mod', 'TC-001');

    const sourceFile = join(root, '.qa', 'modules', 'hardlink-mod', 'context.yaml');
    const hardlinkFile = join(root, '.qa', 'modules', 'hardlink-mod', 'context-hardlink.yaml');

    try {
      linkSync(sourceFile, hardlinkFile);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'EPERM') return; // Skip if OS denies hardlinks
    }

    // FAIL BEFORE: Calling projectRoot with write=false tolerated hardlinks
    expect(() => projectRoot({ targetPath: root }, { projectRoots: [root] }, false)).not.toThrow();

    // PASS AFTER: PlanHandler with write=true strictly rejects hardlinks inside .qa
    const handler = new PlanHandler({ projectRoots: [root] });
    await expect(
      handler.execute(
        { module: 'hardlink-mod', targetPath: root },
        { requestId: 'test-hardlink', signal: new AbortController().signal }
      )
    ).rejects.toThrow(McpToolError);
  });

  // Regression C: Persistence write failure handling (sanitized error response & no partial files) (R2.3, R2.4, R3.3, R4)
  it('handles persistence write failure with sanitized error and no partial files (FAIL BEFORE / PASS AFTER)', async () => {
    const root = initProject();
    seedModule(root, 'fail-write');
    seedTestCase(root, 'fail-write', 'TC-001');

    const writeSpy = vi.spyOn(FileSystemStorage.prototype, 'writeJson').mockRejectedValueOnce(
      new Error('EACCES: permission denied, open D:\\SensitiveInternalServerPath\\.qa\\plan.json.tmp')
    );

    const handler = new PlanHandler({ projectRoots: [root] });
    const res = await handler.execute(
      { module: 'fail-write', targetPath: root },
      { requestId: 'test-fail-write', signal: new AbortController().signal }
    );

    writeSpy.mockRestore();

    // FAIL BEFORE: res.isError was false, status was 'success', persisted was false (simulating success)
    // PASS AFTER: res.isError is true, status is 'error', code is 'persistence_failed', persisted is false
    expect(res.isError).toBe(true);
    const data = JSON.parse(res.content[0].text as string);
    expect(data.status).toBe('error');
    expect(data.code).toBe('persistence_failed');
    expect(data.persisted).toBe(false);
    expect(data.module).toBe('fail-write');

    // Ensure raw filesystem path and error traces are NOT leaked in MCP response
    expect(data.message).not.toContain('SensitiveInternalServerPath');
    expect(data.message).not.toContain('EACCES');
    expect(data.message).toContain("No se pudo persistir el plan de pruebas para el módulo 'fail-write'");

    // Verify no plan.json file remains on disk
    const planFile = join(root, '.qa', 'modules', 'fail-write', 'tests', 'plan.json');
    expect(existsSync(planFile)).toBe(false);
  });

  // Regression D: Historical plan without cases_fingerprint classified as unverifiable without deleting file (R1.3, R1.4, R4)
  it('classifies historical plans without cases_fingerprint as unverifiable without deleting them (FAIL BEFORE / PASS AFTER)', async () => {
    const root = initProject();
    seedModule(root, 'historical-mod');
    seedTestCase(root, 'historical-mod', 'TC-001');

    const planPath = join(root, '.qa', 'modules', 'historical-mod', 'tests', 'plan.json');
    const historicalPlan = {
      _version: '1',
      module: 'historical-mod',
      checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      timestamp: '2026-10-30T00:00:00.000Z',
      algorithm: 'sha256',
      matrix: { cases: ['TC-001'], environment: 'local' },
    };
    writeFileSync(planPath, JSON.stringify(historicalPlan, null, 2), 'utf8');

    // Inspect with static PlanHandler.inspectPlanVigencia
    const status = PlanHandler.inspectPlanVigencia(historicalPlan);
    expect(status.validity).toBe('unverifiable');
    expect(status.is_fresh).toBe(false);
    expect(status.code).toBe('historical_plan');
    expect(status.desbloquear_con).toBe('qap_plan');

    // Inspect with on-disk verifyPlanIntegrity
    const storage = new FileSystemStorage({ rootDir: root });
    const onDiskStatus = await PlanHandler.verifyPlanIntegrity(storage, 'historical-mod');
    expect(onDiskStatus.validity).toBe('unverifiable');
    expect(onDiskStatus.is_fresh).toBe(false);

    // Verify historical plan file is NOT deleted
    expect(existsSync(planPath)).toBe(true);
  });

  // Regression E: Manual case bit-for-bit preservation on disk and in execution order (R1.5, R4)
  it('preserves manually edited test cases bit-for-bit on disk without modifying custom content (FAIL BEFORE / PASS AFTER)', async () => {
    const root = initProject();
    seedModule(root, 'manual-mod');
    seedTestCase(root, 'manual-mod', 'TC-MANUAL', {
      manually_edited: true,
      steps: [
        { type: 'navigate', url: 'https://custom.target/manual-flow' },
        { type: 'assert', selector: '#custom-badge', assertion_type: 'visible' },
      ],
    });

    const manualPath = join(root, '.qa', 'modules', 'manual-mod', 'tests', 'TC-MANUAL.yaml');
    const originalContent = readFileSync(manualPath, 'utf8');
    const originalBuffer = readFileSync(manualPath);

    const handler = new PlanHandler({ projectRoots: [root] });
    const res = await handler.execute(
      { module: 'manual-mod', targetPath: root },
      { requestId: 'test-manual-preserve', signal: new AbortController().signal }
    );

    const data = JSON.parse(res.content[0].text as string);
    expect(data.status).toBe('success');
    expect(data.preserved_cases).toContain('TC-MANUAL');
    expect(data.ordered_nodes).toContain('TC-MANUAL');

    // Verify bit-for-bit identical content on disk
    const postExecBuffer = readFileSync(manualPath);
    expect(postExecBuffer.equals(originalBuffer)).toBe(true);
    const postExecContent = readFileSync(manualPath, 'utf8');
    expect(postExecContent).toBe(originalContent);
  });
});

describe('R1 Deterministic Regressions — Plan Integrity & DAG Validation (VNEXT-014-C1)', () => {
  // R1.1: Truncated or altered matrix.cases with intact YAMLs in disk
  it('R1.1: rejects truncated or altered matrix.cases even when test cases on disk are intact (FAIL BEFORE / PASS AFTER)', async () => {
    const root = initProject();
    seedModule(root, 'checkout');
    seedTestCase(root, 'checkout', 'TC-001');
    seedTestCase(root, 'checkout', 'TC-002');

    // Generate legitimate plan
    const handler = new PlanHandler({ projectRoots: [root] });
    await handler.execute(
      { module: 'checkout', targetPath: root, environment: 'local' },
      { requestId: 'test-r1-1', signal: new AbortController().signal }
    );

    const planPath = join(root, '.qa', 'modules', 'checkout', 'tests', 'plan.json');
    const plan = JSON.parse(readFileSync(planPath, 'utf8'));

    // Corrupt matrix by truncating TC-002 from matrix.cases
    plan.matrix.cases = ['TC-001'];
    writeFileSync(planPath, JSON.stringify(plan, null, 2), 'utf8');

    const storage = new FileSystemStorage({ rootDir: root });
    const check = await PlanHandler.verifyPlanIntegrity(storage, 'checkout');

    // FAIL BEFORE: validity was 'valid' (cases_fingerprint on disk matched)
    // PASS AFTER: validity is 'obsolete', code is 'cases_mismatch'
    expect(check.validity).toBe('obsolete');
    expect(check.is_fresh).toBe(false);
    expect(check.code).toBe('cases_mismatch');
    expect(check.reason).toContain('El número de casos en el plan (1) difiere de los casos ejecutables en disco (2)');
  });

  // R1.2: Inverted DAG dependency in matrix.cases
  it('R1.2: rejects inverted DAG dependencies in matrix.cases (FAIL BEFORE / PASS AFTER)', async () => {
    const root = initProject();
    seedModule(root, 'checkout');
    seedTestCase(root, 'checkout', 'TC-001', { depends_on: [] });
    seedTestCase(root, 'checkout', 'TC-002', { depends_on: ['TC-001'] });

    const handler = new PlanHandler({ projectRoots: [root] });
    await handler.execute(
      { module: 'checkout', targetPath: root, environment: 'local' },
      { requestId: 'test-r1-2', signal: new AbortController().signal }
    );

    const planPath = join(root, '.qa', 'modules', 'checkout', 'tests', 'plan.json');
    const plan = JSON.parse(readFileSync(planPath, 'utf8'));

    // Invert the execution order: put TC-002 before its dependency TC-001
    plan.matrix.cases = ['TC-002', 'TC-001'];
    writeFileSync(planPath, JSON.stringify(plan, null, 2), 'utf8');

    const storage = new FileSystemStorage({ rootDir: root });
    const check = await PlanHandler.verifyPlanIntegrity(storage, 'checkout');

    // FAIL BEFORE: validity was 'valid' (no DAG verification was performed in verifyPlanIntegrity)
    // PASS AFTER: validity is 'obsolete', code is 'dag_order_mismatch'
    expect(check.validity).toBe('obsolete');
    expect(check.is_fresh).toBe(false);
    expect(check.code).toBe('dag_order_mismatch');
    expect(check.reason).toContain("Violación de dependencias DAG: la dependencia 'TC-001'");
  });

  // R1.3: Accepts valid alternate topological sorts
  it('R1.3: accepts valid alternate topological orders without arbitrary positional rejection (FAIL BEFORE / PASS AFTER)', async () => {
    const root = initProject();
    seedModule(root, 'checkout');
    // Independent cases: TC-001 and TC-002 have no mutual dependencies
    seedTestCase(root, 'checkout', 'TC-001', { depends_on: [] });
    seedTestCase(root, 'checkout', 'TC-002', { depends_on: [] });

    const handler = new PlanHandler({ projectRoots: [root] });
    await handler.execute(
      { module: 'checkout', targetPath: root, environment: 'local' },
      { requestId: 'test-r1-3', signal: new AbortController().signal }
    );

    const planPath = join(root, '.qa', 'modules', 'checkout', 'tests', 'plan.json');
    const plan = JSON.parse(readFileSync(planPath, 'utf8'));

    // Set reverse order [TC-002, TC-001], which is 100% topologically valid since both have 0 deps
    plan.matrix.cases = ['TC-002', 'TC-001'];
    writeFileSync(planPath, JSON.stringify(plan, null, 2), 'utf8');

    const storage = new FileSystemStorage({ rootDir: root });
    const check = await PlanHandler.verifyPlanIntegrity(storage, 'checkout');

    // PASS AFTER: Accepts [TC-002, TC-001] as valid topological sort
    expect(check.validity).toBe('valid');
    expect(check.is_fresh).toBe(true);
  });

  // R1.4: Rejects environment mismatch
  it('R1.4: rejects environment mismatch between plan and requested environment (FAIL BEFORE / PASS AFTER)', async () => {
    const root = initProject();
    seedModule(root, 'checkout');
    seedTestCase(root, 'checkout', 'TC-001');

    const handler = new PlanHandler({ projectRoots: [root] });
    await handler.execute(
      { module: 'checkout', targetPath: root, environment: 'local' },
      { requestId: 'test-r1-4', signal: new AbortController().signal }
    );

    const storage = new FileSystemStorage({ rootDir: root });

    // Verify requesting 'staging' when plan was generated for 'local'
    const check = await PlanHandler.verifyPlanIntegrity(storage, 'checkout', { environment: 'staging' });

    // FAIL BEFORE: Returned validity: 'valid' (environment was ignored)
    // PASS AFTER: Returns validity: 'obsolete', code: 'environment_mismatch'
    expect(check.validity).toBe('obsolete');
    expect(check.is_fresh).toBe(false);
    expect(check.code).toBe('environment_mismatch');
    expect(check.reason).toContain("El plan fue generado para el entorno 'local', pero se solicitó 'staging'");
  });

  // R1.5: Rejects module mismatch
  it('R1.5: rejects module mismatch when plan belongs to another module (FAIL BEFORE / PASS AFTER)', async () => {
    const root = initProject();
    seedModule(root, 'checkout');
    seedTestCase(root, 'checkout', 'TC-001');

    const handler = new PlanHandler({ projectRoots: [root] });
    await handler.execute(
      { module: 'checkout', targetPath: root, environment: 'local' },
      { requestId: 'test-r1-5', signal: new AbortController().signal }
    );

    // Copy checkout's plan.json into billing module folder
    seedModule(root, 'billing');
    seedTestCase(root, 'billing', 'TC-001');
    const checkoutPlanPath = join(root, '.qa', 'modules', 'checkout', 'tests', 'plan.json');
    const billingPlanPath = join(root, '.qa', 'modules', 'billing', 'tests', 'plan.json');
    writeFileSync(billingPlanPath, readFileSync(checkoutPlanPath, 'utf8'), 'utf8');

    const storage = new FileSystemStorage({ rootDir: root });
    const check = await PlanHandler.verifyPlanIntegrity(storage, 'billing');

    // FAIL BEFORE: Returned validity: 'valid' (module mismatch was not validated)
    // PASS AFTER: Returns validity: 'obsolete', code: 'module_mismatch'
    expect(check.validity).toBe('obsolete');
    expect(check.is_fresh).toBe(false);
    expect(check.code).toBe('module_mismatch');
    expect(check.reason).toContain("El plan especifica el módulo 'checkout', pero se solicitó 'billing'");
  });

  // R1.6: Distinguishes corrupt JSON from missing plan and rejects missing matrix
  it('R1.6: distinguishes corrupt JSON from missing plan and rejects missing matrix (FAIL BEFORE / PASS AFTER)', async () => {
    const root = initProject();
    seedModule(root, 'checkout');
    seedTestCase(root, 'checkout', 'TC-001');

    const planPath = join(root, '.qa', 'modules', 'checkout', 'tests', 'plan.json');
    const storage = new FileSystemStorage({ rootDir: root });

    // 1. Missing plan file -> plan_missing
    const missingCheck = await PlanHandler.verifyPlanIntegrity(storage, 'checkout');
    expect(missingCheck.validity).toBe('not_found');
    expect(missingCheck.code).toBe('plan_missing');

    // 2. Corrupt JSON syntax on disk -> corrupt_plan (NOT plan_missing)
    writeFileSync(planPath, '{"_version": "1", "module": "checkout", "matrix": ', 'utf8');
    const corruptSyntaxCheck = await PlanHandler.verifyPlanIntegrity(storage, 'checkout');
    expect(corruptSyntaxCheck.validity).toBe('unverifiable');
    expect(corruptSyntaxCheck.code).toBe('corrupt_plan');
    expect(corruptSyntaxCheck.reason).toContain('está corrupto o contiene JSON no válido');

    // 3. Valid JSON but missing matrix section -> corrupt_plan
    const missingMatrixPlan = {
      _version: '1',
      module: 'checkout',
      checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      cases_fingerprint: 'dummy_hash',
      cases_fingerprint_version: '1',
      timestamp: '2026-11-02T00:00:00.000Z',
    };
    writeFileSync(planPath, JSON.stringify(missingMatrixPlan, null, 2), 'utf8');
    const missingMatrixCheck = await PlanHandler.verifyPlanIntegrity(storage, 'checkout');
    expect(missingMatrixCheck.validity).toBe('unverifiable');
    expect(missingMatrixCheck.code).toBe('corrupt_plan');
    expect(missingMatrixCheck.reason).toContain("El plan carece de una sección 'matrix.cases' válida");
  });

  // R1.7: Rejects unknown or incompatible fingerprint version and schema version
  it('R1.7: rejects unknown or incompatible fingerprint and schema versions (FAIL BEFORE / PASS AFTER)', async () => {
    const root = initProject();
    seedModule(root, 'checkout');
    seedTestCase(root, 'checkout', 'TC-001');

    const handler = new PlanHandler({ projectRoots: [root] });
    await handler.execute(
      { module: 'checkout', targetPath: root, environment: 'local' },
      { requestId: 'test-r1-7', signal: new AbortController().signal }
    );

    const planPath = join(root, '.qa', 'modules', 'checkout', 'tests', 'plan.json');
    const originalPlan = JSON.parse(readFileSync(planPath, 'utf8'));
    const storage = new FileSystemStorage({ rootDir: root });

    // Incompatible cases_fingerprint_version = '99'
    const incompatibleFpPlan = { ...originalPlan, cases_fingerprint_version: '99' };
    writeFileSync(planPath, JSON.stringify(incompatibleFpPlan, null, 2), 'utf8');
    const fpCheck = await PlanHandler.verifyPlanIntegrity(storage, 'checkout');
    expect(fpCheck.validity).toBe('unverifiable');
    expect(fpCheck.is_fresh).toBe(false);
    expect(fpCheck.code).toBe('incompatible_version');
    expect(fpCheck.reason).toContain("La versión de huella de casos ('99') no es reconocida o compatible");

    // Incompatible schema _version = '2'
    const incompatibleSchemaPlan = { ...originalPlan, _version: '2' };
    writeFileSync(planPath, JSON.stringify(incompatibleSchemaPlan, null, 2), 'utf8');
    const schemaCheck = await PlanHandler.verifyPlanIntegrity(storage, 'checkout');
    expect(schemaCheck.validity).toBe('unverifiable');
    expect(schemaCheck.is_fresh).toBe(false);
    expect(schemaCheck.code).toBe('incompatible_version');
    expect(schemaCheck.reason).toContain("La versión de esquema del plan ('2') no es compatible");
  });

  // R1.8: Rejects plan with missing cases_fingerprint_version
  it('R1.8: rejects plan with missing cases_fingerprint_version (FAIL BEFORE / PASS AFTER)', async () => {
    const root = initProject();
    seedModule(root, 'checkout');
    seedTestCase(root, 'checkout', 'TC-001');

    const handler = new PlanHandler({ projectRoots: [root] });
    await handler.execute(
      { module: 'checkout', targetPath: root, environment: 'local' },
      { requestId: 'test-r1-8', signal: new AbortController().signal }
    );

    const planPath = join(root, '.qa', 'modules', 'checkout', 'tests', 'plan.json');
    const originalPlan = JSON.parse(readFileSync(planPath, 'utf8'));
    delete originalPlan.cases_fingerprint_version;
    writeFileSync(planPath, JSON.stringify(originalPlan, null, 2), 'utf8');

    const storage = new FileSystemStorage({ rootDir: root });
    const check = await PlanHandler.verifyPlanIntegrity(storage, 'checkout');

    expect(check.validity).toBe('unverifiable');
    expect(check.is_fresh).toBe(false);
    expect(check.code).toBe('incompatible_version');
    expect(check.reason).toContain("El plan carece del campo obligatorio de versión de huella de casos ('cases_fingerprint_version')");
  });

  // R1.9: Rejects plan with missing checksum
  it('R1.9: rejects plan with missing checksum (FAIL BEFORE / PASS AFTER)', async () => {
    const root = initProject();
    seedModule(root, 'checkout');
    seedTestCase(root, 'checkout', 'TC-001');

    const handler = new PlanHandler({ projectRoots: [root] });
    await handler.execute(
      { module: 'checkout', targetPath: root, environment: 'local' },
      { requestId: 'test-r1-9', signal: new AbortController().signal }
    );

    const planPath = join(root, '.qa', 'modules', 'checkout', 'tests', 'plan.json');
    const originalPlan = JSON.parse(readFileSync(planPath, 'utf8'));
    delete originalPlan.checksum;
    writeFileSync(planPath, JSON.stringify(originalPlan, null, 2), 'utf8');

    const storage = new FileSystemStorage({ rootDir: root });
    const check = await PlanHandler.verifyPlanIntegrity(storage, 'checkout');

    expect(check.validity).toBe('unverifiable');
    expect(check.is_fresh).toBe(false);
    expect(check.code).toBe('corrupt_plan');
    expect(check.reason).toContain("El plan carece de un checksum de configuración ('checksum') válido");
  });

  // R1.10: Rejects plan with missing schema version (_version)
  it('R1.10: rejects plan with missing schema version (FAIL BEFORE / PASS AFTER)', async () => {
    const root = initProject();
    seedModule(root, 'checkout');
    seedTestCase(root, 'checkout', 'TC-001');

    const handler = new PlanHandler({ projectRoots: [root] });
    await handler.execute(
      { module: 'checkout', targetPath: root, environment: 'local' },
      { requestId: 'test-r1-10', signal: new AbortController().signal }
    );

    const planPath = join(root, '.qa', 'modules', 'checkout', 'tests', 'plan.json');
    const originalPlan = JSON.parse(readFileSync(planPath, 'utf8'));
    delete originalPlan._version;
    writeFileSync(planPath, JSON.stringify(originalPlan, null, 2), 'utf8');

    const storage = new FileSystemStorage({ rootDir: root });
    const check = await PlanHandler.verifyPlanIntegrity(storage, 'checkout');

    expect(check.validity).toBe('unverifiable');
    expect(check.is_fresh).toBe(false);
    expect(check.code).toBe('incompatible_version');
    expect(check.reason).toContain("El plan carece del campo obligatorio de versión de esquema ('_version')");
  });

  // R1.11: Handles listTestCases failure as unverifiable, never success
  it('R1.11: handles listTestCases failure as unverifiable and never as success (FAIL BEFORE / PASS AFTER)', async () => {
    const root = initProject();
    seedModule(root, 'empty-mod');
    mkdirSync(join(root, '.qa', 'modules', 'empty-mod', 'tests'), { recursive: true });

    // Create a plan with 0 cases
    const planPath = join(root, '.qa', 'modules', 'empty-mod', 'tests', 'plan.json');
    const zeroCasePlan = {
      _version: '1',
      module: 'empty-mod',
      checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      cases_fingerprint: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      cases_fingerprint_version: '1',
      timestamp: '2026-11-02T00:00:00.000Z',
      algorithm: 'sha256',
      matrix: { cases: [], environment: 'local' },
    };
    writeFileSync(planPath, JSON.stringify(zeroCasePlan, null, 2), 'utf8');

    const storage = new FileSystemStorage({ rootDir: root });
    const listSpy = vi.spyOn(storage, 'listTestCases').mockRejectedValue(new Error('EACCES: permission denied'));

    const check = await PlanHandler.verifyPlanIntegrity(storage, 'empty-mod');
    listSpy.mockRestore();

    // FAIL BEFORE: listTestCases error was swallowed by .catch(() => []), resulting in validity: 'valid' (FALSE SUCCESS!)
    // PASS AFTER: validity is 'unverifiable', code is 'corrupt_test_case'
    expect(check.validity).toBe('unverifiable');
    expect(check.is_fresh).toBe(false);
    expect(check.code).toBe('corrupt_test_case');
    expect(check.reason).toContain("Error al listar los casos de prueba del módulo 'empty-mod'");
    expect(check.reason).toContain('EACCES: permission denied');
  });

  // R1.12: Returns verified plan and cases snapshot for TOCTOU prevention
  it('R1.12: returns verified plan and cases snapshot for TOCTOU prevention (FAIL BEFORE / PASS AFTER)', async () => {
    const root = initProject();
    seedModule(root, 'checkout');
    seedTestCase(root, 'checkout', 'TC-001');
    seedTestCase(root, 'checkout', 'TC-002');

    const handler = new PlanHandler({ projectRoots: [root] });
    await handler.execute(
      { module: 'checkout', targetPath: root, environment: 'local' },
      { requestId: 'test-r1-12', signal: new AbortController().signal }
    );

    const storage = new FileSystemStorage({ rootDir: root });
    const check = await PlanHandler.verifyPlanIntegrity(storage, 'checkout', { environment: 'local' });

    expect(check.validity).toBe('valid');
    expect(check.is_fresh).toBe(true);
    expect(check.plan).toBeDefined();
    expect(check.plan?.module).toBe('checkout');
    expect(check.plan?.matrix.cases).toEqual(['TC-001', 'TC-002']);
    expect(check.verified_cases).toBeDefined();
    expect(check.verified_cases?.length).toBe(2);
    expect(check.verified_cases?.map(c => c.id)).toEqual(['TC-001', 'TC-002']);
  });
});
