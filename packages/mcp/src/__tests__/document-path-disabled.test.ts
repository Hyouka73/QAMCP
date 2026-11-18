import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { afterEach, expect, it, vi } from 'vitest';
import YAML from 'yaml';

const reads = vi.hoisted(() => [] as string[]);
vi.mock('node:fs', async importOriginal => {
  const fs = await importOriginal<typeof import('node:fs')>();
  return { ...fs, readFileSync: (...args: Parameters<typeof fs.readFileSync>) => {
    if (typeof args[0] === 'string') reads.push(args[0]);
    return (fs.readFileSync as (...a: any[]) => any)(...args);
  } };
});
import { ContextHandler } from '../handlers/context.handler.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { QapApplicationService } from '../application/application-service.js';
import { WorkspaceBootstrap } from '../workspace-bootstrap.js';
import { createMcpServer } from '../server.js';

async function fixture() {
  const temp = mkdtempSync(join(tmpdir(), 'qap-doc-host-'));
  const root = join(temp, 'workspace'), host = join(temp, 'host');
  mkdirSync(root); mkdirSync(host);
  const service = new QapApplicationService({ hostRootDir: host });
  const bootstrap = new WorkspaceBootstrap(host, service);
  execFileSync(process.execPath, [resolve('../../scripts/qap-authorize-workspace.mjs'), root], { env: { ...process.env, QAP_MCP_APP_SERVICE_DIR: host, QAP_MCP_WORKSPACE_HOST_DIR: host }, windowsHide: true, stdio: 'pipe' });
  const server = createMcpServer({ workspaceBootstrap: bootstrap, applicationService: service,
    hostRegistryPath: join(host, 'roots.json'),
    workspaceAuthorizer: { requestAuthorization: async ({ canonicalPath }) => ({ decision: 'approved', root: canonicalPath }) } });
  const client = new Client({ name: 'document-test', version: '1' });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(a), client.connect(b)]);
  cleanup.push(async () => { await client.close(); await server.close(); bootstrap.close(); service.close(); rmSync(temp, { recursive: true, force: true }); });
  async function call(name: string, args: Record<string, unknown> = {}) {
    const res = await client.callTool({ name, arguments: { targetPath: root, ...args } });
    return JSON.parse(((res.content as Array<{ text: string }>)[0]).text) as Record<string, any>;
  }
  const status = await call('qap_status');
  return { root, call, service, projectId: status.project_id as string };
}

const cleanup: Array<() => Promise<void>> = [];
afterEach(async () => { for (const close of cleanup.splice(0)) await close(); });
function snapshot(root: string) {
  return Object.fromEntries(readdirSync(root, { recursive: true, withFileTypes: true })
    .filter(e => e.isFile() && !e.name.endsWith('-shm')).map(e => { const p = join(e.parentPath, e.name); return [p, createHash('sha256').update(readFileSync(p)).digest('hex')]; }));
}
it('rejects all public path forms before document access or protected effects', async () => {
  const f = await fixture();
  const other = mkdtempSync(join(tmpdir(), 'qap-external-document-'));
  cleanup.push(async () => rmSync(other, { recursive: true, force: true }));
  writeFileSync(join(other, 'secret.md'), 'EXTERNAL_SECRET_CONTENT');
  writeFileSync(join(f.root, 'normal.md'), '# Objetivo\nDocumento local');
  symlinkSync(other, join(f.root, 'link'), 'junction');
  const before = snapshot(join(f.root, '.qa'));
  reads.length = 0;
  const knowledgeBefore = f.service.listIngestedDocuments(f.projectId);
  for (const path of ['normal.md', 'link/secret.md', join(other, 'secret.md')]) {
    for (const args of [{ docPath: path }, { path }, { docPath: path, docContent: 'texto' }]) {
      const response = await f.call('qap_context_ingest', args);
      expect(response).toMatchObject({ status: 'error', code: 'direct_document_path_unavailable' });
      expect(JSON.stringify(response)).not.toContain('EXTERNAL_SECRET_CONTENT');
    }
    for (const source_of_truth of [path, { type: 'prd', ref: path }]) {
      expect(await f.call('qap_context_set', { source_of_truth, objective: 'must not persist' }))
        .toMatchObject({ status: 'error', code: 'direct_document_path_unavailable' });
    }
  }
  const handler = new ContextHandler({} as ConstructorParameters<typeof ContextHandler>[0]);
  const direct = await handler.execute({ source_of_truth: 'normal.md' }, { signal: new AbortController().signal } as Parameters<ContextHandler['execute']>[1]);
  expect(JSON.parse((direct.content[0] as { text: string }).text).code).toBe('direct_document_path_unavailable');
  expect(reads.filter(p => p === join(f.root, 'normal.md') || p.includes('secret.md'))).toEqual([]);
  expect(snapshot(join(f.root, '.qa'))).toEqual(before);
  expect(f.service.listIngestedDocuments(f.projectId)).toEqual(knowledgeBefore);
});
it.each(['Texto autorizado para la aplicación de prueba.', '# Objetivo\nConsultar el catálogo público\n# Usuarios\nVisitante'])('ingests and persists authorized inline content', async content => {
  const f = await fixture();
  const result = await f.call('qap_context_ingest', { docContent: content });
  expect(result).toMatchObject({ status: 'success' });
  const docs = f.service.listIngestedDocuments(f.projectId);
  expect(docs).toHaveLength(1);
  expect(docs[0].source_ref).toBe('inline_docContent');
  expect(docs[0].sha256).toBe(createHash('sha256').update(content).digest('hex'));
});


it('rejects the saved-reference fallback and preserves the project', async () => {
  const f = await fixture();
  const contextPath = join(f.root, '.qa', 'project', 'context.yaml');
  const context = YAML.parse(readFileSync(contextPath, 'utf8'));
  context.source_of_truth = { type: 'prd', ref: 'stored.md', declared: true, source: 'user' };
  writeFileSync(contextPath, YAML.stringify(context));
  writeFileSync(join(f.root, 'stored.md'), 'MUST_NOT_BE_READ');
  const before = snapshot(join(f.root, '.qa'));
  reads.length = 0;
  expect(await f.call('qap_context_ingest')).toMatchObject({ status: 'error', code: 'direct_document_path_unavailable' });
  expect(reads).not.toContain(join(f.root, 'stored.md'));
  expect(snapshot(join(f.root, '.qa'))).toEqual(before);
  expect(f.service.listIngestedDocuments(f.projectId)).toEqual([]);
});
