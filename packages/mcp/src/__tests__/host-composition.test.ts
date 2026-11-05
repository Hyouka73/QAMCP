import { randomBytes } from 'node:crypto';
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { SqliteKnowledgeAdapter } from '@qap/knowledge';
import { afterEach, describe, expect, it } from 'vitest';

import { loadHostComposition } from '../host-composition.js';
import { SqliteInterviewDraftStore } from '../handlers/interview-draft-store.js';
import { SqliteModuleClosureStore } from '../handlers/module-closure-store.js';
import { createMcpServer } from '../server.js';

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

async function provision() {
  const root = mkdtempSync(join(tmpdir(), 'qap-host-'));
  roots.push(root);
  mkdirSync(join(root, '.qa', 'project'), { recursive: true });
  mkdirSync(join(root, '.qa', 'private'), { recursive: true });
  const knowledgeDbPath = join(root, '.qa', 'private', 'knowledge.sqlite');
  const store = new SqliteKnowledgeAdapter(knowledgeDbPath);
  const recorded_at = '2026-11-05T12:00:00.000Z';
  const trace = { source: 'synthetic', recorded_by: 'fixture', recorded_at,
    reason: 'Host composition regression fixture', review: 'unreviewed' as const, evidence_refs: [] };
  await store.commit('app-host', [
    { kind: 'application', expected_revision: 0, trace,
      entity: { application_id: 'app-host', name: 'Fixture Host', base_url: 'https://example.invalid', created_at: recorded_at } },
    { kind: 'environment', expected_revision: 0, trace,
      entity: { application_id: 'app-host', environment_id: 'local',
        name: 'local', base_url: 'https://example.invalid', safe_domains: ['example.invalid'],
        is_production: false, destructive_actions_allowed: false } },
    { kind: 'module', expected_revision: 0, trace,
      entity: { id: 'mod-host', application_id: 'app-host', key: 'host',
        title: 'Host', certainty: 'confirmed', criticality: 'medium', dependencies: [],
        created_at: recorded_at, updated_at: recorded_at, is_active: true } },
  ]);
  store.close();

  const scope = { projectRoot: root, applicationId: 'app-host', environmentId: 'local' };
  const draftPath = join(root, '.qa', 'private', 'interview.sqlite');
  const closurePath = join(root, '.qa', 'private', 'closures.sqlite');
  const draftKey = randomBytes(32);
  const closureKey = randomBytes(32);
  new SqliteInterviewDraftStore({ ...scope, path: draftPath, key: draftKey,
    initialize: true, protection: 'host_private_directory_and_managed_key' }).close();
  new SqliteModuleClosureStore({ ...scope, path: closurePath, key: closureKey,
    initialize: true, protection: 'host_private_directory_and_managed_key' }).close();

  const manifestPath = join(root, '.qa', 'private', 'host-manifest.json');
  const manifest = {
    version: 1, ...scope, knowledgeDbPath,
    moduleBindings: [{
      plannedName: 'host', moduleId: 'mod-host', moduleKey: 'host',
      moduleRevision: 1, applicationRevision: 1, environmentRevision: 1,
      provenance: 'host_declared',
    }],
    interviewDraft: { dbPath: draftPath, keyEnv: 'QAP_MCP_INTERVIEW_KEY_HEX',
      protection: 'host_private_directory_and_managed_key' },
    moduleClosure: { dbPath: closurePath, keyEnv: 'QAP_MCP_CLOSURE_KEY_HEX',
      protection: 'host_private_directory_and_managed_key' },
  };
  writeFileSync(manifestPath, JSON.stringify(manifest), { mode: 0o600 });
  return { root, manifestPath, manifest, scope,
    env: { QAP_MCP_HOST_CONFIG_PATH: manifestPath,
      QAP_MCP_INTERVIEW_KEY_HEX: draftKey.toString('hex'),
      QAP_MCP_CLOSURE_KEY_HEX: closureKey.toString('hex') } };
}

describe('VNEXT-014 host-owned Stdio composition', () => {
  it('keeps legacy-only startup when no manifest is configured', async () => {
    const composed = await loadHostComposition({});
    expect(composed.options.knowledgeBindings).toBeUndefined();
    composed.close();
  });

  it('rejects an explicitly configured nonexistent manifest rather than falling back', async () => {
    await expect(loadHostComposition({ QAP_MCP_HOST_CONFIG_PATH: join(tmpdir(), 'qap-nonexistent-manifest-014.json') }))
      .rejects.toThrow();
  });

  it('opens existing canonical stores, resolves host-declared revisions and does not forge gateways', async () => {
    const fixture = await provision();
    const composed = await loadHostComposition(fixture.env);
    try {
      const binding = composed.options.knowledgeBindings?.[0];
      expect(binding?.moduleBindings?.[0].moduleId).toBe('mod-host');
      expect(binding?.moduleClosureStore).toBeDefined();
      expect(binding?.interviewDraftStore).toBeDefined();
      expect(binding?.humanReviewGateway).toBeUndefined();
      expect(binding?.moduleClosureReviewGateway).toBeUndefined();
      expect(existsSync(fixture.manifestPath)).toBe(true);
    } finally { composed.close(); }
  });

  it('rejects missing keys and stale pinned revisions without silently adopting a store', async () => {
    const fixture = await provision();
    await expect(loadHostComposition({ QAP_MCP_HOST_CONFIG_PATH: fixture.manifestPath }))
      .rejects.toThrow();
    writeFileSync(fixture.manifestPath,
      JSON.stringify({ ...fixture.manifest,
        moduleBindings: fixture.manifest.moduleBindings.map(binding => ({ ...binding, moduleRevision: 999 })) }));
    await expect(loadHostComposition(fixture.env)).rejects.toThrow();
  });

  it('only wires explicitly host-approved pinned Discovery consent; rejects missing acknowledgement', async () => {
    const fixture = await provision();
    const policy = {
      read_only_acknowledged: true,
      environmentRevision: 1,
      navigation_urls: ['https://example.invalid/'],
      allowed_ips: [],
      allow_public_network: false,
      limits: { max_pages: 1 },
    };
    writeFileSync(fixture.manifestPath,
      JSON.stringify({ ...fixture.manifest, discoveryAuthorization: policy }));
    const composed = await loadHostComposition(fixture.env);
    try {
      expect(composed.options.discoveryAuthorizations).toHaveLength(1);
      expect(composed.options.discoveryAuthorizations?.[0].authorization.navigation_urls)
        .toEqual(['https://example.invalid/']);
      expect(composed.options.discoveryAuthorizations?.[0].authorization.allow_public_network)
        .toBe(false);
      expect(composed.options.discoveryAuthorizations?.[0].authorization.allowed_ips).toEqual([]);
    } finally { composed.close(); }
    writeFileSync(fixture.manifestPath,
      JSON.stringify({ ...fixture.manifest,
        discoveryAuthorization: { ...policy, read_only_acknowledged: false } }));
    await expect(loadHostComposition(fixture.env)).rejects.toThrow();
    writeFileSync(fixture.manifestPath,
      JSON.stringify({ ...fixture.manifest,
        discoveryAuthorization: { ...policy, environmentRevision: 2 } }));
    await expect(loadHostComposition(fixture.env)).rejects.toThrow();
  });

  it('fails closed when canonical modules have no durable closure store', async () => {
    const fixture = await provision();
    const composed = await loadHostComposition(fixture.env);
    const server = createMcpServer({
      projectRoots: [fixture.root],
      knowledgeBindings: (composed.options.knowledgeBindings ?? []).map(binding => ({
        ...binding, moduleClosureStore: undefined,
      })),
    });
    const client = new Client({ name: 'host-composition-test', version: '1.0.0' });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    writeFileSync(join(fixture.root, '.qa', 'project', 'lifecycle.json'), JSON.stringify({
      _version: '1', phase: 'WORKING',
      modules: { host: { state: 'planned', updated_at: '2026-11-05T12:00:00.000Z' } },
      session: { id: 'host-session', started_at: '2026-11-05T12:00:00.000Z',
        plan: [{ module: 'host', path: '/' }], auth: { required: false } },
      history: [],
    }));
    try {
      await server.connect(serverTransport);
      await client.connect(clientTransport);
      const response = await client.callTool({ name: 'qap_session_close', arguments: { targetPath: fixture.root } });
      const item = response.content[0];
      expect(item.type).toBe('text');
      if (item.type === 'text') {
        expect(JSON.parse(item.text)).toMatchObject({
          status: 'blocked', code: 'canonical_closure_store_required',
        });
      }
    } finally {
      await client.close();
      await server.close();
      composed.close();
    }
  });
});
