import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { afterEach, describe, expect, it } from 'vitest';
import YAML from 'yaml';

import { createMcpServer, type McpServerOptions } from '../server.js';
import { PlanHandler } from '../handlers/plan.handler.js';
import { McpToolError } from '../dispatcher.js';

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
    expect(data.desbloquear_con).toBe('qap_discover');
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
  it('integrates completely with createMcpServer, exposes exactly 18 tools and dispatches qap_plan cleanly', async () => {
    const root = initProject();
    seedModule(root, 'orders');
    seedTestCase(root, 'orders', 'TC-001', { depends_on: [] });
    seedTestCase(root, 'orders', 'TC-002', { depends_on: ['TC-001'] });

    const client = await connect({ projectRoots: [root] });

    // 1. Verify exact 18 tools exposed
    const toolsResult = await client.listTools();
    expect(toolsResult.tools.length).toBe(18);
    const toolNames = toolsResult.tools.map(t => t.name);
    expect(toolNames).toContain('qap_plan');
    expect(toolNames).toContain('qap_test');
    expect(toolNames).toContain('qap_status');
    expect(toolNames).toContain('qap_discover');

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

    // 3. Verify qap_test remains intact
    const testToolRes = await callTool(client, 'qap_test', { module: 'orders', targetPath: root });
    expect(testToolRes.data.estado).toBe('en_desarrollo');
    expect(testToolRes.data.sprint_disponible).toBe(7);
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
});
