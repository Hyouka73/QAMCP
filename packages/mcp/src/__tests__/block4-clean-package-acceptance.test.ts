import { createHash, randomUUID } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { CredentialProvider, CredentialReference } from '@qap/shared';
import { describe, expect, it, vi } from 'vitest';

import { QapApplicationService } from '../application/application-service.js';
import { type IAuthAuthorizer, WindowsInteractiveAuthAuthorizer } from '../auth-authorizer.js';
import { type IDiscoveryAuthorizer, WindowsInteractiveDiscoveryAuthorizer } from '../discovery-authorizer.js';
import { createMcpServer } from '../server.js';
import { type ITestAuthorizer, WindowsInteractiveTestAuthorizer } from '../test-authorizer.js';
import { WorkspaceBootstrap } from '../workspace-bootstrap.js';
import { type IWorkspaceAuthorizer, WindowsInteractiveWorkspaceAuthorizer } from '../workspace-authorizer.js';

import { startProtectedSpaStaging } from './fixtures/protected-spa-staging.js';

class TestMemoryCredentialProvider implements CredentialProvider {
  readonly entries = new Map<string, string>();

  private key(ref: CredentialReference): string {
    return `${ref.project_id}:${ref.profile_id}:${ref.account}`;
  }

  async set(
    ref: CredentialReference,
    secret: { username?: string; password?: string; token?: string },
  ): Promise<void> {
    this.entries.set(this.key(ref), JSON.stringify(secret));
  }

  async get(
    ref: CredentialReference,
  ): Promise<{ username?: string; password?: string; token?: string } | null> {
    const raw = this.entries.get(this.key(ref));
    return raw ? (JSON.parse(raw) as { username?: string; password?: string; token?: string }) : null;
  }

  async delete(ref: CredentialReference): Promise<boolean> {
    return this.entries.delete(this.key(ref));
  }
}

const REPO_ROOT = resolve(fileURLToPath(new URL('../../../../', import.meta.url)));

function sha256File(filePath: string): string {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function sha256Json(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

interface ParsedToolResponse {
  readonly isError: boolean;
  readonly rawText: string;
  readonly data: Record<string, unknown>;
}

async function callJson(
  client: Client,
  name: string,
  args: Record<string, unknown>,
): Promise<ParsedToolResponse> {
  const res = await client.callTool({ name, arguments: args });
  const textBlock = (res.content as Array<{ type: string; text?: string }>).find(
    (c) => c.type === 'text',
  );
  const rawText = textBlock?.text ?? '{}';
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(rawText) as Record<string, unknown>;
  } catch {
    data = { rawText };
  }
  return {
    isError: res.isError === true,
    rawText,
    data,
  };
}

function makeHostEnv(baseDir: string, extra?: {
  discoveryDenied?: boolean;
  testDenied?: boolean;
}) {
  const hostRoot = join(baseDir, 'qap-host-data');
  const workspaceHostDir = join(hostRoot, 'workspaces');
  const appServiceDir = join(hostRoot, 'application');
  const workspaceRegistry = join(workspaceHostDir, 'authorized-roots.json');
  const discoveryRegistry = join(workspaceHostDir, 'discovery-authorizations.json');
  const authRegistry = join(workspaceHostDir, 'auth-authorizations.json');
  const testRegistry = join(workspaceHostDir, 'test-authorizations.json');

  mkdirSync(workspaceHostDir, { recursive: true });
  mkdirSync(appServiceDir, { recursive: true });

  const service = new QapApplicationService({
    hostRootDir: appServiceDir,
    masterKey: Buffer.alloc(32, 0x44),
    credentialProvider: new TestMemoryCredentialProvider(),
  });
  const bootstrap = new WorkspaceBootstrap(hostRoot, service);

  const authorizedRoots: string[] = [];

  const workspaceAuthorizer = {
    requestAuthorization: vi.fn<IWorkspaceAuthorizer['requestAuthorization']>(async (req) => {
      if (!authorizedRoots.includes(req.canonicalPath)) {
        authorizedRoots.push(req.canonicalPath);
      }
      writeFileSync(workspaceRegistry, JSON.stringify(authorizedRoots, null, 2), 'utf8');
      return {
        decision: 'approved',
        root: req.canonicalPath,
      };
    }),
  };

  const discoveryAuthorizer = {
    requestAuthorization: vi.fn<IDiscoveryAuthorizer['requestAuthorization']>(async (req) => {
      if (extra?.discoveryDenied) {
        return { decision: 'rejected', reason: 'Operator denied discovery scope' };
      }
      return {
        decision: 'approved',
        root: req.projectRoot,
        targetUrl: req.targetUrl,
        limits: req.limits ?? { maxPages: 12, maxDepth: 2 },
      };
    }),
  };

  const authAuthorizer = {
    requestAuthorization: vi.fn<IAuthAuthorizer['requestAuthorization']>(async (req) => ({
      decision: 'approved',
      origin: req.origin,
      profileLabel: req.profileLabel,
      expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    })),
  };

  const testAuthorizer = {
    requestAuthorization: vi.fn<ITestAuthorizer['requestAuthorization']>(async (req) => {
      if (extra?.testDenied) {
        return { decision: 'rejected', reason: 'QA denied navigation execution' };
      }
      return {
        decision: 'approved',
        allowedOrigins: [req.origin],
      };
    }),
  };

  return {
    service,
    bootstrap,
    hostRoot,
    workspaceHostDir,
    appServiceDir,
    workspaceRegistry,
    discoveryRegistry,
    authRegistry,
    testRegistry,
    authorizedRoots,
    workspaceAuthorizer,
    discoveryAuthorizer,
    authAuthorizer,
    testAuthorizer,
  };
}

describe('Bloque 4 — Paquete limpio instalado, cliente real Stdio y matriz de aceptación', () => {
  it('verifica paquete limpio empaquetado con runtime FTS5, Chromium, diálogos Windows y arranque en frío Stdio sin presembrado', async () => {
    const tempBase = mkdtempSync(join(tmpdir(), 'qap-b4-pkg-'));
    const installDir = join(tempBase, 'clean-install');
    const packDir = join(tempBase, 'tarballs');
    const coldWorkspace = join(tempBase, 'cold-workspace');
    const isolatedHostData = join(tempBase, 'isolated-host-data');
    const isolatedWorkspacesDir = join(isolatedHostData, 'workspaces');

    mkdirSync(installDir, { recursive: true });
    mkdirSync(packDir, { recursive: true });
    mkdirSync(coldWorkspace, { recursive: true });
    mkdirSync(isolatedWorkspacesDir, { recursive: true });

    const evidence: Record<string, unknown> = {
      stage: 'clean_package_and_stdio_cold_start',
      started_at: new Date().toISOString(),
    };

    try {
      const staging = await startProtectedSpaStaging();
      const baseUrl = staging.origin;

      try {
        // 1. Pack @hyouka73/qap-cli cleanly
        const pnpmCmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
        execFileSync(
          pnpmCmd,
          ['--filter', '@hyouka73/qap-cli', 'pack', '--pack-destination', packDir],
          { cwd: REPO_ROOT, stdio: 'pipe', shell: process.platform === 'win32' },
        );
        const tarballs = readdirSync(packDir).filter((f) => f.endsWith('.tgz'));
        expect(tarballs.length).toBe(1);
        const tarballPath = join(packDir, tarballs[0]);
        evidence.tarball = { file: tarballs[0], sha256: sha256File(tarballPath) };

        // 2. Clean npm install inside isolated directory outside the repo
        const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
        execFileSync(
          npmCmd,
          ['--prefix', installDir, 'install', '--no-audit', '--no-fund', '--prefer-offline', tarballPath],
          { cwd: tempBase, stdio: 'pipe', shell: process.platform === 'win32' },
        );

        const installedPkgRoot = join(installDir, 'node_modules', '@hyouka73', 'qap-cli');
        const installedPkgJson = JSON.parse(readFileSync(join(installedPkgRoot, 'package.json'), 'utf8')) as {
          version: string;
          dependencies?: Record<string, string>;
        };
        const entrypointPath = join(installedPkgRoot, 'dist', 'entrypoint.js');
        expect(existsSync(entrypointPath)).toBe(true);
        const depValues = Object.values(installedPkgJson.dependencies ?? {});
        expect(depValues.some((v) => v.includes('workspace:'))).toBe(false);

        // 3. Verify Windows interactive dialog scripts + helper scripts + UI template bundled inside clean install
        const requiredAssets = [
          'dist/assets/dialogs/qap-interactive-dialog.ps1',
          'dist/assets/dialogs/qap-interactive-discovery-dialog.ps1',
          'dist/assets/dialogs/qap-interactive-auth-dialog.ps1',
          'dist/assets/dialogs/qap-interactive-test-dialog.ps1',
          'dist/assets/scripts/qap-authorize-workspace.mjs',
          'dist/template/index.html',
        ];
        const assetDigests: Record<string, string> = {};
        for (const rel of requiredAssets) {
          const full = join(installedPkgRoot, rel);
          expect(existsSync(full)).toBe(true);
          assetDigests[rel] = sha256File(full);
        }
        evidence.bundled_assets_sha256 = assetDigests;

        // Also check WindowsInteractive* authorizer constructors resolve scripts with zero arguments
        for (const AuthorizerCtor of [
          WindowsInteractiveWorkspaceAuthorizer,
          WindowsInteractiveDiscoveryAuthorizer,
          WindowsInteractiveAuthAuthorizer,
          WindowsInteractiveTestAuthorizer,
        ]) {
          const inst = new AuthorizerCtor() as unknown as { scriptPath: string };
          expect(existsSync(inst.scriptPath)).toBe(true);
        }

        // 4. Verify CLI binary responds from installed package + SQLite FTS5 + Chromium launch inside clean install
        const cliVersion = execFileSync(process.execPath, [entrypointPath, '--version'], {
          cwd: installDir,
          encoding: 'utf8',
        }).trim();
        expect(cliVersion).toBe(installedPkgJson.version);

        const runtimeProbeScript = `
          import { createRequire } from 'node:module';
          const req = createRequire(${JSON.stringify(join(installedPkgRoot, 'package.json'))});
          const { DatabaseSync } = req('node:sqlite');
          const db = new DatabaseSync(':memory:');
          const row = db.prepare("SELECT sqlite_compileoption_used('ENABLE_FTS5') AS enabled").get();
          if (!row || row.enabled !== 1) throw new Error('FTS5 unavailable');
          db.exec("CREATE VIRTUAL TABLE probe_fts USING fts5(title); INSERT INTO probe_fts VALUES ('pedidos');");
          const hit = db.prepare("SELECT title FROM probe_fts WHERE probe_fts MATCH 'pedidos'").get();
          const { chromium } = req('playwright-core');
          const browser = await chromium.launch({ headless: true });
          const version = browser.version();
          await browser.close();
          console.log(JSON.stringify({ fts5: true, ftsHit: hit.title, chromiumVersion: version }));
        `;
        const runtimeProbe = execFileSync(
          process.execPath,
          ['--input-type=module', '-e', runtimeProbeScript],
          { cwd: installDir, encoding: 'utf8' },
        );
        const runtimeInfo = JSON.parse(runtimeProbe.trim().split(/\r?\n/).pop()!) as {
          fts5: boolean;
          ftsHit: string;
          chromiumVersion: string;
        };
        expect(runtimeInfo.fts5).toBe(true);
        expect(runtimeInfo.ftsHit).toBe('pedidos');
        expect(runtimeInfo.chromiumVersion.length).toBeGreaterThan(3);
        evidence.runtime = runtimeInfo;

        // 5. Cold start over real MCP Stdio from the cleanly installed package in an empty workspace
        const cleanEnv: Record<string, string> = {};
        for (const [k, v] of Object.entries(process.env)) {
          if (typeof v === 'string') cleanEnv[k] = v;
        }
        cleanEnv.NODE_ENV = 'production';
        cleanEnv.QAP_DISABLE_INTERACTIVE_AUTH = '1';
        cleanEnv.QAP_MCP_HOST_DATA_DIR = isolatedHostData;
        cleanEnv.QAP_MCP_WORKSPACE_HOST_DIR = isolatedWorkspacesDir;
        cleanEnv.QAP_MCP_APP_SERVICE_DIR = join(isolatedHostData, 'application');

        const transport = new StdioClientTransport({
          command: process.execPath,
          args: [entrypointPath, 'mcp'],
          cwd: tempBase,
          env: cleanEnv,
        });
        const client = new Client({ name: 'qap-block4-stdio-acceptance', version: '1.0.0' });
        await client.connect(transport);

        try {
          const tools = await client.listTools();
          expect(tools.tools.some((t) => t.name === 'qap_status')).toBe(true);
          expect(tools.tools.some((t) => t.name === 'qap_project')).toBe(true);
          expect(tools.tools.some((t) => t.name === 'qap_test')).toBe(true);

          // Cold start check: empty workspace, zero pre-seeded files/projects/decisions -> must block safely without creating .qa
          const coldStatus = await callJson(client, 'qap_status', { targetPath: coldWorkspace });
          expect(coldStatus.data.status).toBe('blocked');
          expect(coldStatus.data.code).toBe('workspace_authorizer_not_configured');
          expect(existsSync(join(coldWorkspace, '.qa'))).toBe(false);

          // Authorize coldWorkspace via the helper script bundled inside the cleanly installed package
          const bundledAuthHelper = join(installedPkgRoot, 'dist/assets/scripts/qap-authorize-workspace.mjs');
          const authProc = spawnSync(process.execPath, [bundledAuthHelper, coldWorkspace], {
            env: cleanEnv,
            encoding: 'utf8',
          });
          expect(authProc.status, authProc.stderr).toBe(0);

          // Retry over the SAME live Stdio MCP connection (no restart!) -> workspace initializes cleanly
          const readyStatus = await callJson(client, 'qap_status', { targetPath: coldWorkspace });
          expect(readyStatus.isError).toBe(false);
          expect(existsSync(join(coldWorkspace, '.qa'))).toBe(true);

          const projects = await callJson(client, 'qap_project', {
            action: 'list',
            targetPath: coldWorkspace,
          });
          expect(projects.isError).toBe(false);
          expect(Array.isArray(projects.data.projects)).toBe(true);
          expect((projects.data.projects as Array<unknown>).length).toBeGreaterThanOrEqual(1);

          const ctxRes = await callJson(client, 'qap_context_set', {
            targetPath: coldWorkspace,
            base_url: baseUrl,
            roles: [{ name: 'operador', source: 'user' }],
            critical_flows: [{ name: 'Consultar pedidos', source: 'user' }],
            source_of_truth: {
              type: 'prd',
              declared: true,
              source: 'user',
              notes: 'Staging sintético local de pedidos',
            },
          });
          expect(ctxRes.isError).toBe(false);
          evidence.stdio_cold_start = {
            tools_count: tools.tools.length,
            cold_block_code: coldStatus.data.code,
            context_status: ctxRes.data.status,
          };
        } finally {
          await client.close();
          await transport.close().catch(() => {});
        }
      } finally {
        await staging.close();
      }
    } finally {
      rmSync(tempBase, { recursive: true, force: true });
    }

    if (process.env.QAP_BLOCK4_EVIDENCE_OUT) {
      const outPath = resolve(process.env.QAP_BLOCK4_EVIDENCE_OUT);
      const prev = existsSync(outPath)
        ? (JSON.parse(readFileSync(outPath, 'utf8')) as Record<string, unknown>)
        : {};
      writeFileSync(outPath, JSON.stringify({ ...prev, part1_package_and_stdio: evidence }, null, 2), 'utf8');
    }
  }, 120000);

  it('cubre matriz completa de aceptación: PASS/FAIL, oráculo ausente, rechazo, sesión caducada, revocación, reinicio + recuperación sin reejecución, Campaña 2 y borrado aislado', async () => {
    const tempBase = mkdtempSync(join(tmpdir(), 'qap-b4-matrix-'));
    const wsA = join(tempBase, 'workspace-alpha');
    const wsB = join(tempBase, 'workspace-beta');
    mkdirSync(wsA, { recursive: true });
    mkdirSync(wsB, { recursive: true });
    // Source marker file in workspace A that MUST survive project deletion
    const externalSourceFileA = join(wsA, 'README.md');
    writeFileSync(externalSourceFileA, '# Sistema Alpha — Fuente original\n', 'utf8');

    const env = makeHostEnv(tempBase);
    const staging = await startProtectedSpaStaging();
    const baseUrl = staging.origin;

    const stages: Array<Record<string, unknown>> = [];

    const connectServer = async () => {
      const server = createMcpServer({
        workspaceBootstrap: env.bootstrap,
        projectRoots: env.authorizedRoots,
        clientWorkspaceRoots: true,
        workspaceAuthorizer: env.workspaceAuthorizer,
        hostRegistryPath: env.workspaceRegistry,
        discoveryAuthorizer: env.discoveryAuthorizer,
        hostDiscoveryRegistryPath: env.discoveryRegistry,
        authAuthorizer: env.authAuthorizer,
        hostAuthRegistryPath: env.authRegistry,
        testAuthorizer: env.testAuthorizer,
        hostTestRegistryPath: env.testRegistry,
        applicationService: env.service,
      });
      const client = new Client({ name: 'qap-b4-matrix', version: '1.0.0' });
      const [cTrans, sTrans] = InMemoryTransport.createLinkedPair();
      await Promise.all([client.connect(cTrans), server.connect(sTrans)]);
      return {
        client,
        server,
        close: async () => {
          await client.close();
          await server.close();
        },
      };
    };

    try {
      let mcp = await connectServer();
      try {
        // 1. Cold start onboarding + context + Markdown ingestion (provenance & discrepancy)
        const statusA = await callJson(mcp.client, 'qap_status', { targetPath: wsA });
        expect(statusA.isError).toBe(false);
        const listA = await callJson(mcp.client, 'qap_project', { action: 'list', targetPath: wsA });
        const matchedA = Array.isArray(listA.data.projects)
          ? (listA.data.projects as Array<{ project_id: string; canonical_root: string }>).find(
              (p) => p.canonical_root.toLowerCase() === wsA.toLowerCase(),
            )
          : undefined;
        const projAId =
          (typeof statusA.data.project_id === 'string' ? statusA.data.project_id : undefined) ??
          matchedA?.project_id ??
          env.service.findActiveProjectByRoot(wsA)?.project_id ??
          '';
        expect(projAId, JSON.stringify({ statusA: statusA.data, listA: listA.data })).toBeTruthy();

        const ctxA = await callJson(mcp.client, 'qap_context_set', {
          targetPath: wsA,
          base_url: baseUrl,
          objective: 'Validar módulo de pedidos SPA autenticado',
          roles: [{ name: 'operador', source: 'user' }],
          critical_flows: [{ name: 'Consultar pedidos', source: 'user' }],
          source_of_truth: {
            type: 'prd',
            declared: true,
            source: 'user',
            notes: 'Staging sintético local de pedidos SPA y spec Markdown',
          },
        });
        expect(ctxA.isError, JSON.stringify(ctxA.data)).toBe(false);

        const docIngest = await callJson(mcp.client, 'qap_context_ingest', {
          targetPath: wsA,
          docContent: '# Especificación Pedidos\n- El listado debe mostrar ORD-101\n- Rol: operador',
        });
        expect(docIngest.isError, JSON.stringify(docIngest.data)).toBe(false);
        const confirmCtx = await callJson(mcp.client, 'qap_context_set', {
          targetPath: wsA,
          confirmar_resumen: 'confirmo_todo',
        });
        expect(confirmCtx.isError, JSON.stringify(confirmCtx.data)).toBe(false);
        stages.push({ stage: 'onboarding_and_doc', project_id: projAId, sha256: sha256Json(docIngest.data) });

        // 2. Protected login + expired session check (never downgrade to anonymous) + revalidation
        const authRes = await callJson(mcp.client, 'qap_auth_add', {
          targetPath: wsA,
          profile: 'operador-acme',
          username: 'qa.operator',
          password: 'StagingPass#2026',
          role: 'operador',
          login_route: '/login',
        });
        expect(authRes.isError, JSON.stringify(authRes.data)).toBe(false);

        const envRecord = env.service.resumeProject(projAId).environment!;
        // Simulate session expiry + verify expired session status without anonymous downgrade
        const cookiesUrl = new URL(baseUrl).origin;
        const profileRec = env.service.resumeProject(projAId).profiles.find((p) => p.label === 'operador-acme')!;
        const origProfile = env.service.readProfileSession(projAId, profileRec.profile_id);
        expect(origProfile).not.toBeNull();
        expect(origProfile!.expired).toBe(false);
        env.service.saveProfileSession(
          projAId,
          profileRec.profile_id,
          { cookies: [], origins: [] },
          { ttlMs: -60_000 },
        );
        const expiredCheck = env.service.readProfileSession(projAId, profileRec.profile_id);
        expect(expiredCheck?.expired).toBe(true);

        // Revalidate via HTTP login against ProtectedSpaStagingServer
        const loginResp = await fetch(`${cookiesUrl}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            username: 'qa.operator',
            password: 'StagingPass#2026',
            tenant: 'tenant-acme',
          }),
          redirect: 'manual',
        });
        const setCookieHeaders = loginResp.headers.getSetCookie?.() ?? [];
        const sessionPair = setCookieHeaders
          .find((h) => h.startsWith('qap_session='))
          ?.split(';')[0]
          ?.split('=')[1];
        expect(sessionPair).toBeTruthy();

        const validStorageState = {
          cookies: [
            {
              name: 'qap_session',
              value: sessionPair!,
              domain: new URL(baseUrl).hostname,
              path: '/',
              expires: -1,
              httpOnly: true,
              secure: false,
              sameSite: 'Lax' as const,
            },
            {
              name: 'qap_tenant',
              value: 'tenant-acme',
              domain: new URL(baseUrl).hostname,
              path: '/',
              expires: -1,
              httpOnly: false,
              secure: false,
              sameSite: 'Lax' as const,
            },
          ],
          origins: [],
        };
        env.service.saveProfileSession(projAId, profileRec.profile_id, validStorageState, {
          ttlMs: 3_600_000,
        });
        stages.push({ stage: 'auth_expiry_and_revalidation', env_id: envRecord.env_id, expired: expiredCheck?.expired });

        // 3. Session plan (SCOPING -> WORKING) -> SPA discovery
        const planSession = await callJson(mcp.client, 'qap_session_plan', {
          targetPath: wsA,
          tenant_id: 'tenant-acme',
          modules: [
            { module: 'pedidos', path: '/app', priority: 'high', flujos: ['Consultar pedidos'] },
          ],
          auth: { required: true, method: 'credentials', roles: ['operador'], profile: 'operador-acme' },
        });
        expect(planSession.isError, JSON.stringify(planSession.data)).toBe(false);
        expect(planSession.data.fase, JSON.stringify({ confirmCtx: confirmCtx.data, planSession: planSession.data })).toBe('WORKING');

        const discRes = await callJson(mcp.client, 'qap_discover', {
          targetPath: wsA,
          name: 'pedidos',
          description: 'Portal SPA Protegido de Pedidos',
          path: '/app',
          profile: 'operador-acme',
          allow_spa: true,
        });
        expect(discRes.isError, JSON.stringify(discRes.data)).toBe(false);
        stages.push({ stage: 'discovery_spa', sha256: sha256Json(discRes.data) });

        // 4. Case proposal with PASS case, deliberate FAIL case, and pending_oracle case
        const proposeRes = await callJson(mcp.client, 'qap_plan', {
          targetPath: wsA,
          module: 'pedidos',
          case_workflow: {
            action: 'propose_from_observations',
            proposals: [
              {
                title: 'Mostrar orden ORD-101 tras autenticar',
                expected_outcome: 'Se visualiza ORD-101 en #spa-shell',
                oracle_source: 'user',
                steps: [
                  { type: 'navigate', url: `${baseUrl}/app` },
                  { type: 'waitFor', selector: '#spa-shell' },
                  { type: 'assert', selector: '#spa-shell', assertion_type: 'contains', expected: 'ORD-101' },
                ],
              },
              {
                title: 'Fallo deliberado esperando orden inexistente ORD-999',
                expected_outcome: 'El tablero debe contener ORD-999 (fallo deliberado)',
                oracle_source: 'user',
                steps: [
                  { type: 'navigate', url: `${baseUrl}/app` },
                  { type: 'waitFor', selector: '#spa-shell' },
                  { type: 'assert', selector: '#spa-shell', assertion_type: 'contains', expected: 'ORD-999-MISSING' },
                ],
              },
              {
                title: 'Caso pendiente sin oráculo de negocio',
                oracle_source: 'missing',
                steps: [{ type: 'navigate', url: `${baseUrl}/app` }],
              },
            ],
          },
        });
        expect(proposeRes.isError).toBe(false);
        expect(proposeRes.data.non_blocking_pending_oracles).toBe(true);
        const proposedCases = proposeRes.data.proposed_cases as Array<{ case_id: string }>;
        expect(proposedCases.length).toBe(2);

        const approveBatch = await callJson(mcp.client, 'qap_plan', {
          targetPath: wsA,
          module: 'pedidos',
          case_workflow: { action: 'approve_batch' },
        });
        expect(approveBatch.data.status).toBe('approved');
        expect((approveBatch.data.skipped_pending_oracle as Array<unknown>).length).toBe(1);

        const dagPlan = await callJson(mcp.client, 'qap_plan', {
          targetPath: wsA,
          module: 'pedidos',
        });
        expect(dagPlan.isError).toBe(false);

        // 5. Execution rejection when QA denies navigation authorization
        env.testAuthorizer.requestAuthorization.mockResolvedValueOnce({
          decision: 'rejected',
          reason: 'QA rejected test navigation',
        });
        const deniedTest = await callJson(mcp.client, 'qap_test', {
          targetPath: wsA,
          module: 'pedidos',
          profile: 'operador-acme',
        });
        expect(deniedTest.isError).toBe(true);
        expect(deniedTest.data.status).toBe('blocked');

        // 6. Real Chromium PASS + deliberate FAIL execution
        const execTest = await callJson(mcp.client, 'qap_test', {
          targetPath: wsA,
          module: 'pedidos',
          profile: 'operador-acme',
        });
        expect(execTest.isError).toBe(false);
        expect(execTest.data.result).toBe('partial');
        const execId = String(execTest.data.execution_id);
        const attemptId = String(execTest.data.attempt_id);
        stages.push({
          stage: 'chromium_pass_and_deliberate_fail',
          attempt_id: attemptId,
          execution_id: execId,
          result: execTest.data.result,
          sha256: sha256Json(execTest.data),
        });

        // 7. Partial report publication + FULL SERVER RESTART + recovery WITHOUT re-running Playwright
        const partialFormatRes = await callJson(mcp.client, 'qap_report', {
          targetPath: wsA,
          executionId: execId,
          module: 'pedidos',
          format: 'html',
        });
        expect(partialFormatRes.isError, JSON.stringify(partialFormatRes.data)).toBe(false);
        const partialReports = partialFormatRes.data.reports as Record<string, string>;
        const htmlArtifact = partialReports.html;
        expect(existsSync(htmlArtifact)).toBe(true);

        const serviceModA = env.service.resumeProject(projAId).modules.find((m) => m.key === 'pedidos');
        expect(serviceModA?.key).toBe('pedidos');
        // Simulate an interrupted multi-format publication containing published html but pending json/markdown/junit
        const partialPub = env.service.beginReportPublication({
          projectId: projAId,
          moduleKey: 'pedidos',
          attemptId,
          executionId: execId,
          requestedFormats: ['html', 'markdown', 'junit'],
        });
        env.service.recordPublishedReportFormat({
          publicationId: partialPub.publication_id,
          format: 'html',
          filePath: htmlArtifact,
          sha256: sha256File(htmlArtifact),
          bytes: readFileSync(htmlArtifact).length,
        });

        // Restart MCP server completely cleanly
        await mcp.close();
        const priorTestCalls = env.testAuthorizer.requestAuthorization.mock.calls.length;
        mcp = await connectServer();

        const recoveredReport = await callJson(mcp.client, 'qap_report', {
          targetPath: wsA,
          recover_pending: true,
          format: 'all',
        });
        expect(recoveredReport.isError, JSON.stringify(recoveredReport.data)).toBe(false);
        const pubData = recoveredReport.data.publication as {
          status: string;
          reused_formats: string[];
          generated_formats: string[];
        };
        expect(pubData.status).toBe('completed');
        expect(pubData.reused_formats).toContain('html');
        expect(env.testAuthorizer.requestAuthorization.mock.calls.length).toBe(priorTestCalls);
        stages.push({
          stage: 'restart_and_partial_report_recovery',
          reused_formats: pubData.reused_formats,
          generated_formats: pubData.generated_formats,
          sha256: sha256Json(recoveredReport.data),
        });

        // 8. Execute revocation check (fail closed)
        const revoked = env.service.authority.revokeProjectAccess(projAId, 'b4_revocation_check', ['execute']);
        expect(revoked).toBeGreaterThanOrEqual(1);
        const revokedTest = await callJson(mcp.client, 'qap_test', {
          targetPath: wsA,
          module: 'pedidos',
          profile: 'operador-acme',
        });
        expect(revokedTest.isError).toBe(true);
        expect(revokedTest.data.status).toBe('blocked');

        // Re-grant execute for closure/campaign 2 continuity
        env.service.authority.grant({
          project_id: projAId,
          capability: 'execute',
          scope: { root_path: wsA, origin: cookiesUrl, env_id: envRecord.env_id },
          granted_by: 'test_operator',
          policy_hash: randomUUID(),
        });

        // 9. Human acceptance + close module + close session + Campaign 2 regression reuse
        env.service.recordCaseHumanAcceptance({
          projectId: projAId,
          caseId: proposedCases[1].case_id,
          moduleKey: 'pedidos',
          acceptedBy: 'qa_operator_real',
          reason: 'PASS validado y FAIL ORD-999 confirmado como brecha deliberada',
        });

        const closeModA = await callJson(mcp.client, 'qap_module_close', {
          targetPath: wsA,
          module: 'pedidos',
          action: 'close',
          user_confirmed: true,
          accept_gaps: true,
          accept_gaps_reason: 'Fallo deliberado ORD-999 documentado para regresión.',
        });
        expect(closeModA.isError).toBe(false);

        const closeSessionA = await callJson(mcp.client, 'qap_session_close', {
          targetPath: wsA,
          confirmar: true,
        });
        expect(closeSessionA.isError, JSON.stringify(closeSessionA.data)).toBe(false);
        const reportMd = readFileSync(String(closeSessionA.data.report_path), 'utf8');
        expect(reportMd).toContain('Resumen de Ejecución Física Verificada');
        expect(reportMd).not.toContain('El reporte canónico indica not_executed cuando existen resultados físicos');

        const camp2Plan = await callJson(mcp.client, 'qap_session_plan', {
          targetPath: wsA,
          reuse_modules: true,
          auth: { required: true, method: 'credentials', roles: ['operador'], profile: 'operador-acme' },
        });
        expect(camp2Plan.isError, JSON.stringify(camp2Plan.data)).toBe(false);
        stages.push({ stage: 'campaign2_regression_reuse', module: 'pedidos', sha256: sha256Json(camp2Plan.data) });

        // 10. Two isolated projects A & B + explicit deletion of A preserving source & B
        const statusB = await callJson(mcp.client, 'qap_status', { targetPath: wsB });
        expect(statusB.isError).toBe(false);
        const listB = await callJson(mcp.client, 'qap_project', { action: 'list', targetPath: wsB });
        const matchedB = Array.isArray(listB.data.projects)
          ? (listB.data.projects as Array<{ project_id: string; canonical_root: string }>).find(
              (p) => p.canonical_root.toLowerCase() === wsB.toLowerCase(),
            )
          : undefined;
        const projBId =
          (typeof statusB.data.project_id === 'string' ? statusB.data.project_id : undefined) ??
          matchedB?.project_id ??
          env.service.findActiveProjectByRoot(wsB)?.project_id ??
          '';
        expect(projBId, JSON.stringify({ statusB: statusB.data, listB: listB.data })).toBeTruthy();
        expect(projBId).not.toBe(projAId);

        const previewDel = await callJson(mcp.client, 'qap_project', {
          action: 'delete_preview',
          project_id: projAId,
        });
        expect(previewDel.data.status).toBe('confirmation_required');
        const previewObj = previewDel.data.preview as { confirmation_token: string };

        const confirmDel = await callJson(mcp.client, 'qap_project', {
          action: 'delete_confirm',
          project_id: projAId,
          confirmation_token: previewObj.confirmation_token,
          decision: 'confirm_delete',
          purge_workspace_qa: true,
        });
        expect(confirmDel.isError).toBe(false);
        expect(confirmDel.data.status).toBe('deleted');

        // Project A source survives, Project B survives intact, Project A does NOT auto-recreate
        expect(existsSync(externalSourceFileA)).toBe(true);
        const autoRecreateBlocked = await callJson(mcp.client, 'qap_status', { targetPath: wsA });
        expect(autoRecreateBlocked.data.status).toBe('blocked');

        const listAfterDelete = await callJson(mcp.client, 'qap_project', { action: 'list' });
        const survivingIds = (listAfterDelete.data.projects as Array<{ project_id: string }>).map(
          (p) => p.project_id,
        );
        expect(survivingIds).not.toContain(projAId);
        expect(survivingIds).toContain(projBId);

        stages.push({
          stage: 'isolated_deletion',
          deleted_project: projAId,
          surviving_projects: survivingIds,
          source_preserved: existsSync(externalSourceFileA),
        });
      } finally {
        await mcp.close();
      }
    } finally {
      await staging.close();
      env.bootstrap.close();
      env.service.close();
      rmSync(tempBase, { recursive: true, force: true, maxRetries: 3 });
    }

    if (process.env.QAP_BLOCK4_EVIDENCE_OUT) {
      const outPath = resolve(process.env.QAP_BLOCK4_EVIDENCE_OUT);
      const prev = existsSync(outPath)
        ? (JSON.parse(readFileSync(outPath, 'utf8')) as Record<string, unknown>)
        : {};
      writeFileSync(
        outPath,
        JSON.stringify(
          {
            ...prev,
            part2_acceptance_matrix: {
              finished_at: new Date().toISOString(),
              stages,
            },
          },
          null,
          2,
        ),
        'utf8',
      );
    }
  }, 120000);
});
