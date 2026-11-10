import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createMcpServer } from '../server.js';
import { WorkspaceBootstrap } from '../workspace-bootstrap.js';
import {
  type IDiscoveryAuthorizer,
  type DiscoveryAuthorizationRequest,
  type DiscoveryAuthorizationResult,
  atomicRecordDiscoveryAuthorization,
  loadDiscoveryAuthorizationsFromDisk,
  syncDiscoveryAuthorizationsFromDisk,
} from '../discovery-authorizer.js';
import type { DiscoveryAuthorization } from '../handlers/discovery.handler.js';

const tempDirs: string[] = [];
const cleanupFns: Array<() => Promise<void>> = [];

function makeTemp(prefix = 'qap-disc-auth-test-'): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  for (const fn of cleanupFns.splice(0)) await fn();
  for (const dir of tempDirs.splice(0)) {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
});

describe('Interactive Discovery Authorization Suite', () => {
  it('unit: records, loads, and merges discovery authorizations atomically', () => {
    const dir = makeTemp('disc-reg-');
    const registryPath = join(dir, 'discovery-authorizations.json');
    const root = makeTemp('proj-a-');

    const auth1: DiscoveryAuthorization = {
      projectRoot: root,
      applicationId: 'app-a',
      environmentId: 'staging',
      environmentRevision: 1,
      authorization: {
        read_only_acknowledged: true,
        navigation_urls: ['https://staging.example.invalid/'],
      },
      limits: { max_pages: 5 },
    };

    atomicRecordDiscoveryAuthorization(registryPath, auth1);
    expect(existsSync(registryPath)).toBe(true);

    const loaded1 = loadDiscoveryAuthorizationsFromDisk(registryPath);
    expect(loaded1).toHaveLength(1);
    expect(loaded1[0].applicationId).toBe('app-a');
    expect(loaded1[0].authorization.navigation_urls).toEqual(['https://staging.example.invalid/']);

    // Merge second URL for same context
    const auth2: DiscoveryAuthorization = {
      projectRoot: root,
      applicationId: 'app-a',
      environmentId: 'staging',
      environmentRevision: 1,
      authorization: {
        read_only_acknowledged: true,
        navigation_urls: ['https://staging.example.invalid/dashboard'],
      },
    };
    atomicRecordDiscoveryAuthorization(registryPath, auth2);

    const loaded2 = loadDiscoveryAuthorizationsFromDisk(registryPath);
    expect(loaded2).toHaveLength(1);
    expect(loaded2[0].authorization.navigation_urls).toEqual([
      'https://staging.example.invalid/',
      'https://staging.example.invalid/dashboard',
    ]);

    // Test in-memory synchronization
    const inMem: DiscoveryAuthorization[] = [];
    syncDiscoveryAuthorizationsFromDisk(registryPath, inMem);
    expect(inMem).toHaveLength(1);
    expect(inMem[0].authorization.navigation_urls).toHaveLength(2);
  });

  it('qap_discover: requests operator authorization when authorizer is configured and approves', async () => {
    const hostDir = makeTemp('host-');
    const ws = makeTemp('ws-');
    const bootstrap = new WorkspaceBootstrap(hostDir);
    const registryPath = join(hostDir, 'authorized-roots.json');
    const discoveryRegistryPath = join(hostDir, 'discovery-authorizations.json');

    const authRequests: DiscoveryAuthorizationRequest[] = [];
    const mockAuthorizer: IDiscoveryAuthorizer = {
      async requestAuthorization(req) {
        authRequests.push(req);
        return {
          decision: 'approved',
          root: req.projectRoot,
          targetUrl: req.targetUrl,
          limits: req.limits,
        };
      },
    };

    const server = createMcpServer({
      projectRoots: [ws],
      workspaceBootstrap: bootstrap,
      clientWorkspaceRoots: false,
      discoveryAuthorizer: mockAuthorizer,
      hostDiscoveryRegistryPath: discoveryRegistryPath,
    });

    const client = new Client({ name: 'disc-auth-client', version: '1.0.0' }, {});
    const [tA, tB] = InMemoryTransport.createLinkedPair();
    await server.connect(tB);
    await client.connect(tA);

    cleanupFns.push(async () => {
      await client.close();
      await server.close();
      bootstrap.close();
    });

    // 1. Initialize workspace
    const initRes = await client.callTool({ name: 'qap_status', arguments: { targetPath: ws } });
    const status1 = JSON.parse((initRes.content as Array<{ text: string }>)[0].text);
    expect(status1.initialized).toBe(true);

    // 2. Set target URL to advance towards SCOPING
    const setRes = await client.callTool({
      name: 'qap_context_set',
      arguments: { targetPath: ws, base_url: 'https://staging.lendus.dev/', source: 'user' },
    });
    const setParsed = JSON.parse((setRes.content as Array<{ text: string }>)[0].text);
    expect(setParsed.status).toBe('success');

    // 3. Invoke qap_discover with provisional inventory
    // BlackBoxCrawler will be invoked; in this mock test without real network it may return blocked network
    // but the authorization prompt must be triggered first!
    const discoverRes = await client.callTool({
      name: 'qap_discover',
      arguments: {
        targetPath: ws,
        name: 'inventario-provisional',
        path: 'https://staging.lendus.dev/',
      },
    });

    // Verify dialog was requested with exact expected parameters
    expect(authRequests).toHaveLength(1);
    expect(authRequests[0].targetUrl).toBe('https://staging.lendus.dev/');
    expect(authRequests[0].baseUrl).toBe('https://staging.lendus.dev/');

    // Verify decision was recorded on disk
    expect(existsSync(discoveryRegistryPath)).toBe(true);
    const persisted = loadDiscoveryAuthorizationsFromDisk(discoveryRegistryPath);
    expect(persisted).toHaveLength(1);
    expect(persisted[0].authorization.navigation_urls).toContain('https://staging.lendus.dev/');

    // 4. Second call to qap_discover on same URL does NOT prompt authorizer again (continuity)
    await client.callTool({
      name: 'qap_discover',
      arguments: {
        targetPath: ws,
        name: 'inventario-provisional',
        path: 'https://staging.lendus.dev/',
      },
    });
    expect(authRequests).toHaveLength(1); // Still 1, no second prompt!
  });

  it('qap_discover: operator rejection returns blocked discovery_authorization_rejected and writes no permissions', async () => {
    const hostDir = makeTemp('host-');
    const ws = makeTemp('ws-');
    const bootstrap = new WorkspaceBootstrap(hostDir);
    const discoveryRegistryPath = join(hostDir, 'discovery-authorizations.json');

    const mockAuthorizer: IDiscoveryAuthorizer = {
      async requestAuthorization() {
        return { decision: 'rejected', reason: 'Operator rejected navigation.' };
      },
    };

    const server = createMcpServer({
      projectRoots: [ws],
      workspaceBootstrap: bootstrap,
      clientWorkspaceRoots: false,
      discoveryAuthorizer: mockAuthorizer,
      hostDiscoveryRegistryPath: discoveryRegistryPath,
    });

    const client = new Client({ name: 'disc-reject-client', version: '1.0.0' }, {});
    const [tA, tB] = InMemoryTransport.createLinkedPair();
    await server.connect(tB);
    await client.connect(tA);

    cleanupFns.push(async () => {
      await client.close();
      await server.close();
      bootstrap.close();
    });

    await client.callTool({ name: 'qap_status', arguments: { targetPath: ws } });
    await client.callTool({
      name: 'qap_context_set',
      arguments: { targetPath: ws, base_url: 'https://staging.lendus.dev/', source: 'user' },
    });

    const discoverRes = await client.callTool({
      name: 'qap_discover',
      arguments: {
        targetPath: ws,
        name: 'inventario-provisional',
        path: 'https://staging.lendus.dev/',
      },
    });

    const parsed = JSON.parse((discoverRes.content as Array<{ text: string }>)[0].text);
    expect(parsed.status).toBe('blocked');
    expect(parsed.category).toBe('human_authorization');
    expect(parsed.code).toBe('discovery_authorization_rejected');
    expect(parsed.persistence).toBe('not_attempted');
    expect(parsed.next_safe_action).toContain('investigación documental offline');

    // Verify NO authorizations recorded on disk
    const diskRecords = loadDiscoveryAuthorizationsFromDisk(discoveryRegistryPath);
    expect(diskRecords).toHaveLength(0);
  });

  it('qap_discover: cancellation / timeout returns blocked discovery_authorization_cancelled', async () => {
    const hostDir = makeTemp('host-');
    const ws = makeTemp('ws-');
    const bootstrap = new WorkspaceBootstrap(hostDir);
    const discoveryRegistryPath = join(hostDir, 'discovery-authorizations.json');

    const mockAuthorizer: IDiscoveryAuthorizer = {
      async requestAuthorization() {
        return { decision: 'cancelled', code: 'discovery_authorization_cancelled' };
      },
    };

    const server = createMcpServer({
      projectRoots: [ws],
      workspaceBootstrap: bootstrap,
      clientWorkspaceRoots: false,
      discoveryAuthorizer: mockAuthorizer,
      hostDiscoveryRegistryPath: discoveryRegistryPath,
    });

    const client = new Client({ name: 'disc-cancel-client', version: '1.0.0' }, {});
    const [tA, tB] = InMemoryTransport.createLinkedPair();
    await server.connect(tB);
    await client.connect(tA);

    cleanupFns.push(async () => {
      await client.close();
      await server.close();
      bootstrap.close();
    });

    await client.callTool({ name: 'qap_status', arguments: { targetPath: ws } });
    await client.callTool({
      name: 'qap_context_set',
      arguments: { targetPath: ws, base_url: 'https://staging.lendus.dev/', source: 'user' },
    });

    const discoverRes = await client.callTool({
      name: 'qap_discover',
      arguments: {
        targetPath: ws,
        name: 'inventario-provisional',
        path: 'https://staging.lendus.dev/',
      },
    });

    const parsed = JSON.parse((discoverRes.content as Array<{ text: string }>)[0].text);
    expect(parsed.status).toBe('blocked');
    expect(parsed.category).toBe('human_authorization');
    expect(parsed.code).toBe('discovery_authorization_cancelled');
  });

  it('qap_discover: isolates discovery permissions between separate projects', async () => {
    const hostDir = makeTemp('host-');
    const wsA = makeTemp('ws-a-');
    const wsB = makeTemp('ws-b-');
    const bootstrap = new WorkspaceBootstrap(hostDir);
    const discoveryRegistryPath = join(hostDir, 'discovery-authorizations.json');

    let promptCount = 0;
    const mockAuthorizer: IDiscoveryAuthorizer = {
      async requestAuthorization(req) {
        promptCount++;
        return {
          decision: 'approved',
          root: req.projectRoot,
          targetUrl: req.targetUrl,
        };
      },
    };

    const server = createMcpServer({
      projectRoots: [wsA, wsB],
      workspaceBootstrap: bootstrap,
      clientWorkspaceRoots: false,
      discoveryAuthorizer: mockAuthorizer,
      hostDiscoveryRegistryPath: discoveryRegistryPath,
    });

    const client = new Client({ name: 'disc-iso-client', version: '1.0.0' }, {});
    const [tA, tB] = InMemoryTransport.createLinkedPair();
    await server.connect(tB);
    await client.connect(tA);

    cleanupFns.push(async () => {
      await client.close();
      await server.close();
      bootstrap.close();
    });

    // Authorize Workspace A
    await client.callTool({ name: 'qap_status', arguments: { targetPath: wsA } });
    await client.callTool({
      name: 'qap_context_set',
      arguments: { targetPath: wsA, base_url: 'https://shared-target.invalid/', source: 'user' },
    });
    await client.callTool({
      name: 'qap_discover',
      arguments: { targetPath: wsA, name: 'inventario-provisional', path: 'https://shared-target.invalid/' },
    });
    expect(promptCount).toBe(1);

    // Initialize Workspace B with the same URL
    await client.callTool({ name: 'qap_status', arguments: { targetPath: wsB } });
    await client.callTool({
      name: 'qap_context_set',
      arguments: { targetPath: wsB, base_url: 'https://shared-target.invalid/', source: 'user' },
    });
    // Calling discover on Workspace B MUST trigger a distinct authorization prompt (no inherited permission)
    await client.callTool({
      name: 'qap_discover',
      arguments: { targetPath: wsB, name: 'inventario-provisional', path: 'https://shared-target.invalid/' },
    });
    expect(promptCount).toBe(2);
  });
});
