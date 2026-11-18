import { execFile, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { afterEach, expect, it } from 'vitest';
import { referenceKey } from '@qap/auth';
import { QapApplicationService } from '../../dist/index.js';

const execFileAsync = promisify(execFile);
const testDir = dirname(fileURLToPath(import.meta.url));
const mcpIndexPath = resolve(testDir, '../../dist/index.js');
const workerPath = resolve(testDir, './fixtures/credential-rotation-worker.mjs');
const authorizeScript = resolve(testDir, '../../../../scripts/qap-authorize-workspace.mjs');

const cleanups = [];
afterEach(async () => {
  for (const fn of cleanups.splice(0).reverse()) {
    await fn();
  }
});

function readProviderInventory(providerDir) {
  if (!existsSync(providerDir)) return [];
  return readdirSync(providerDir)
    .filter(name => name.endsWith('.json'))
    .sort()
    .map(name => ({
      file: name,
      ...JSON.parse(readFileSync(join(providerDir, name), 'utf8')),
    }));
}

function writeSyntheticSecret(providerDir, ref, password) {
  mkdirSync(providerDir, { recursive: true });
  const digest = createHash('sha256').update(referenceKey(ref)).digest('hex');
  writeFileSync(join(providerDir, `${digest}.json`), JSON.stringify({ ref, password }), 'utf8');
}

function waitForFile(filePath, timeoutMs = 20_000) {
  return new Promise((resolveDone, rejectDone) => {
    if (existsSync(filePath)) {
      resolveDone();
      return;
    }
    const deadline = Date.now() + timeoutMs;
    const interval = setInterval(() => {
      if (existsSync(filePath)) {
        clearInterval(interval);
        resolveDone();
      } else if (Date.now() >= deadline) {
        clearInterval(interval);
        rejectDone(new Error(`Timed out waiting for file: ${filePath}`));
      }
    }, 15);
  });
}

function snapshotProjectRows(db, projectId) {
  const query = (table, order = 'rowid ASC') =>
    db.prepare(`SELECT * FROM ${table} WHERE project_id = ? ORDER BY ${order}`).all(projectId);
  return {
    projects: query('projects'),
    environments: query('environments'),
    profiles: query('profiles'),
    permission_grants: query('permission_grants'),
    owned_artifacts: query('owned_artifacts'),
  };
}

it('certifies P1-03 credential rotation, revocation, concurrency and project isolation across independent OS processes', async () => {
  const base = realpathSync(mkdtempSync(join(tmpdir(), 'qap-p1-03-multi-')));
  cleanups.push(() => rmSync(base, { recursive: true, force: true }));

  const hostDir = join(base, 'host');
  const appDir = join(base, 'app');
  const providerDir = join(base, 'provider');
  const rootA = join(base, 'workspace-a');
  const rootB = join(base, 'workspace-b');
  const failDeleteFile = join(base, 'fail-delete.flag');
  for (const dir of [hostDir, appDir, providerDir, rootA, rootB]) {
    mkdirSync(dir, { recursive: true });
  }

  // Authorize both workspaces through the host operator helper.
  const authEnv = {
    ...process.env,
    QAP_MCP_APP_SERVICE_DIR: appDir,
    QAP_MCP_WORKSPACE_HOST_DIR: hostDir,
  };
  execFileSync(process.execPath, [authorizeScript, rootA], { env: authEnv, windowsHide: true, stdio: 'pipe' });
  execFileSync(process.execPath, [authorizeScript, rootB], { env: authEnv, windowsHide: true, stdio: 'pipe' });

  // Local HTTP login server supporting valid sessions and a deterministic barrier for concurrent POST /login requests.
  const validSessions = new Set();
  let sessionSeq = 0;
  let concurrentBarrierCount = 0;
  let concurrentWaiters = [];

  const site = createServer((req, res) => {
    if (req.url === '/login' && req.method === 'GET') {
      res.writeHead(200, { 'content-type': 'text/html' }).end(
        '<form method="post" action="/login"><input type="text" name="username"><input name="password" type="password"><button type="submit">Login</button></form>',
      );
      return;
    }
    if (req.url === '/login' && req.method === 'POST') {
      const chunks = [];
      req.on('data', chunk => chunks.push(Buffer.from(chunk)));
      req.on('end', async () => {
        const fields = new URLSearchParams(Buffer.concat(chunks).toString());
        const user = fields.get('username');
        const pass = fields.get('password');
        if (!['alice', 'bob'].includes(user ?? '') || !pass) {
          res.writeHead(403).end();
          return;
        }
        if (concurrentBarrierCount > 0) {
          await new Promise(resolveWait => {
            concurrentWaiters.push(resolveWait);
            if (concurrentWaiters.length >= concurrentBarrierCount) {
              const ready = concurrentWaiters.splice(0, concurrentWaiters.length);
              concurrentBarrierCount = 0;
              for (const fn of ready) fn();
            }
          });
        }
        const token = `qap-sess-${++sessionSeq}`;
        validSessions.add(token);
        res.writeHead(302, { location: '/home', 'set-cookie': `qap-test=${token}; Path=/; HttpOnly` }).end();
      });
      return;
    }
    if (req.url === '/home') {
      const cookie = String(req.headers.cookie ?? '');
      const match = /qap-test=([^;\s]+)/.exec(cookie);
      if (match && validSessions.has(match[1])) {
        res.writeHead(200, { 'content-type': 'text/html' }).end('<h1>Welcome</h1>');
        return;
      }
      res.writeHead(302, { location: '/login' }).end();
      return;
    }
    res.writeHead(404).end();
  });
  await new Promise(resolveListen => site.listen(0, '127.0.0.1', resolveListen));
  cleanups.push(() => new Promise((done, reject) => site.close(err => (err ? reject(err) : done()))));
  const baseUrl = `http://127.0.0.1:${site.address().port}`;

  async function spawnMcpClient(workspace, extraEnv = {}) {
    const client = new Client({ name: 'p1-03-multiprocess', version: '1.0.0' }, {});
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [workerPath],
      stderr: 'pipe',
      env: {
        PATH: process.env.PATH ?? '',
        NODE_ENV: 'test',
        ...(process.env.PLAYWRIGHT_BROWSERS_PATH ? { PLAYWRIGHT_BROWSERS_PATH: process.env.PLAYWRIGHT_BROWSERS_PATH } : {}),
        QAP_ROT_MODULE: mcpIndexPath,
        QAP_ROT_HOST: hostDir,
        QAP_ROT_APP: appDir,
        QAP_ROT_PROVIDER_DIR: providerDir,
        QAP_ROT_WORKSPACE: workspace,
        QAP_ROT_FAIL_DELETE_FILE: failDeleteFile,
        QAP_ROT_MODE: 'mcp',
        ...extraEnv,
      },
    });
    await client.connect(transport);
    let closed = false;
    const call = async (name, args = {}) => {
      const result = await client.callTool({ name, arguments: { targetPath: workspace, ...args } }, undefined, { timeout: 60_000 });
      return JSON.parse(result.content[0].text);
    };
    const close = async () => {
      if (closed) return;
      closed = true;
      if (extraEnv.QAP_ROT_SET_RELEASE_FILE && !existsSync(extraEnv.QAP_ROT_SET_RELEASE_FILE)) {
        try { writeFileSync(extraEnv.QAP_ROT_SET_RELEASE_FILE, 'cleanup', 'utf8'); } catch {}
      }
      await client.close().catch(() => {});
    };
    cleanups.push(close);
    return { call, close };
  }

  async function runReconcileChild(extraEnv = {}) {
    const { stdout } = await execFileAsync(process.execPath, [workerPath], {
      env: {
        PATH: process.env.PATH ?? '',
        NODE_ENV: 'test',
        QAP_ROT_MODULE: mcpIndexPath,
        QAP_ROT_HOST: hostDir,
        QAP_ROT_APP: appDir,
        QAP_ROT_PROVIDER_DIR: providerDir,
        QAP_ROT_FAIL_DELETE_FILE: failDeleteFile,
        QAP_ROT_MODE: 'reconcile',
        ...extraEnv,
      },
      windowsHide: true,
      timeout: 20_000,
    });
    return JSON.parse(stdout.trim());
  }

  const db = new DatabaseSync(join(appDir, 'app-service.sqlite'));
  cleanups.push(() => db.close());

  // Pre-configure Project B (isolation baseline) in its own independent process.
  const setupB = await spawnMcpClient(rootB);
  expect((await setupB.call('qap_context_set', { base_url: baseUrl, source: 'user' })).status).toBe('success');
  const authB = await setupB.call('qap_auth_add', {
    profile: 'bob',
    username: 'bob',
    password: 'project-b-secret',
    verification_route: '/home',
  });
  expect(authB).toMatchObject({ status: 'success', code: 'authentication_verified' });
  await setupB.close();

  const projectB = db.prepare("SELECT project_id FROM projects WHERE canonical_root = ? AND status = 'active'").get(rootB);
  expect(projectB?.project_id).toBeTruthy();
  const projectBSnapshotBefore = snapshotProjectRows(db, projectB.project_id);
  const projectBSecretsBefore = readProviderInventory(providerDir).filter(item => item.ref.projectId === projectB.project_id);
  expect(projectBSecretsBefore).toHaveLength(1);
  expect(projectBSecretsBefore[0].password).toBe('project-b-secret');

  // Seed Project A workspace context first.
  const initA = await spawnMcpClient(rootA);
  expect((await initA.call('qap_context_set', { base_url: baseUrl, source: 'user' })).status).toBe('success');
  await initA.close();
  const projectA = db.prepare("SELECT project_id, application_id FROM projects WHERE canonical_root = ? AND status = 'active'").get(rootA);
  expect(projectA?.project_id).toBeTruthy();

  const aliceInventory = () => readProviderInventory(providerDir).filter(item => item.ref.projectId === projectA.project_id && item.ref.auth_profile_id !== 'unrelated-profile');
  const cleanupRows = () => db.prepare("SELECT key, value FROM host_session_state WHERE key LIKE 'credential_cleanup:v1:%' ORDER BY key").all();
  const aliceRow = () => db.prepare('SELECT * FROM profiles WHERE project_id = ? AND label = ?').get(projectA.project_id, 'alice');

  // 1. Two legitimate logins in independent processes -> only the latest secret reference remains active.
  const proc1 = await spawnMcpClient(rootA);
  const res1 = await proc1.call('qap_auth_add', {
    profile: 'alice',
    username: 'alice',
    password: 'first-password',
    verification_route: '/home',
  });
  await proc1.close();
  expect(res1).toMatchObject({ status: 'success', code: 'authentication_verified' });
  expect(aliceInventory().map(i => i.password)).toEqual(['first-password']);
  const firstRefKey = aliceRow().credential_ref_key;
  expect(cleanupRows()).toHaveLength(0);

  const proc2 = await spawnMcpClient(rootA);
  const res2 = await proc2.call('qap_auth_add', {
    profile: 'alice',
    username: 'alice',
    password: 'second-password',
    verification_route: '/home',
  });
  await proc2.close();
  expect(res2).toMatchObject({ status: 'success', code: 'authentication_verified' });
  const invAfter2 = aliceInventory();
  expect(invAfter2).toHaveLength(1);
  expect(invAfter2[0].password).toBe('second-password');
  const secondRefKey = aliceRow().credential_ref_key;
  expect(secondRefKey).not.toBe(firstRefKey);
  expect(invAfter2[0].ref.account).toBe(secondRefKey);
  expect(cleanupRows()).toHaveLength(0);

  // 2. Delete failure of replaced secret -> pending cleanup staged in SQLite & reconciled automatically in a new process.
  writeFileSync(failDeleteFile, '1', 'utf8');
  const proc3 = await spawnMcpClient(rootA);
  const res3 = await proc3.call('qap_auth_add', {
    profile: 'alice',
    username: 'alice',
    password: 'third-password',
    verification_route: '/home',
  });
  await proc3.close();
  expect(res3).toMatchObject({ status: 'success', code: 'authentication_verified' });

  const thirdRefKey = aliceRow().credential_ref_key;
  expect(thirdRefKey).not.toBe(secondRefKey);
  const pendingAfterFail = cleanupRows();
  expect(pendingAfterFail).toHaveLength(1);
  expect(JSON.parse(pendingAfterFail[0].value).account).toBe(secondRefKey);
  expect(aliceInventory().map(i => i.password).sort()).toEqual(['second-password', 'third-password']);

  rmSync(failDeleteFile, { force: true });
  const reconcileOut = await runReconcileChild({
    QAP_ROT_READ_PROJECT_ID: projectA.project_id,
    QAP_ROT_READ_PROFILE: 'alice',
  });
  expect(reconcileOut).toEqual({ reconciled: true, secret: { password: 'third-password' } });
  expect(cleanupRows()).toHaveLength(0);
  const invAfterReconcile = aliceInventory();
  expect(invAfterReconcile).toHaveLength(1);
  expect(invAfterReconcile[0].password).toBe('third-password');
  expect(invAfterReconcile[0].ref.account).toBe(thirdRefKey);

  // Reconcile must never delete the active credential even if its current reference was staged.
  const adminSvc = new QapApplicationService({ hostRootDir: appDir, projectOperationDirectory: hostDir });
  try {
    adminSvc.stageReplacedCredential(invAfterReconcile[0].ref);
  } finally {
    adminSvc.close();
  }
  await runReconcileChild();
  expect(aliceInventory().map(i => i.password)).toEqual(['third-password']);
  expect(cleanupRows()).toHaveLength(0);

  // 3. Revocation of G1 during provider write, followed by G2 -> original operation neither publishes session nor deletes unrelated secrets.
  const unrelatedRef = {
    projectId: projectA.project_id,
    applicationId: projectA.application_id,
    environment: aliceRow().env_id,
    auth_profile_id: 'unrelated-profile',
    account: 'unrelated-account',
  };
  writeSyntheticSecret(providerDir, unrelatedRef, 'keep-unrelated-secret');
  const profileBeforeG1 = aliceRow();
  const artifactsBeforeG1 = db.prepare("SELECT * FROM owned_artifacts WHERE project_id = ? ORDER BY rowid ASC").all(projectA.project_id);
  const profilesJsonBeforeG1 = readFileSync(join(rootA, '.qa', 'project', 'auth', 'profiles.json'), 'utf8');

  const enteredFile = join(base, 'set-entered.flag');
  const releaseFile = join(base, 'set-release.flag');
  const g1Row = db.prepare(
    "SELECT grant_id FROM permission_grants WHERE project_id = ? AND capability = 'access' AND status = 'active' ORDER BY granted_at DESC, rowid DESC LIMIT 1",
  ).get(projectA.project_id);
  expect(g1Row?.grant_id).toBeTruthy();

  const procG1 = await spawnMcpClient(rootA, {
    QAP_ROT_SET_ENTERED_FILE: enteredFile,
    QAP_ROT_SET_RELEASE_FILE: releaseFile,
  });
  const pendingG1 = procG1.call('qap_auth_add', {
    profile: 'alice',
    username: 'alice',
    password: 'revoked-g1-password',
    verification_route: '/home',
  });

  await waitForFile(enteredFile);
  // While paused after writing temporary secret to provider, revoke G1 and grant G2 from a separate process context.
  expect(aliceInventory().map(i => i.password).sort()).toEqual(['revoked-g1-password', 'third-password']);
  const revoker = new QapApplicationService({ hostRootDir: appDir, projectOperationDirectory: hostDir });
  let g2GrantId;
  try {
    expect(revoker.authority.revokeGrant(projectA.project_id, g1Row.grant_id, 'revoked_during_write')).toMatchObject({
      status: 'revoked',
      grant_id: g1Row.grant_id,
    });
    const g2 = revoker.authority.grant({
      project_id: projectA.project_id,
      capability: 'access',
      scope: { root_path: rootA },
      granted_by: 'test',
    });
    g2GrantId = g2.grant_id;
  } finally {
    revoker.close();
  }
  expect(g2GrantId).not.toBe(g1Row.grant_id);
  writeFileSync(releaseFile, '1', 'utf8');

  const g1Outcome = await pendingG1;
  await procG1.close();
  expect(g1Outcome).toMatchObject({ status: 'blocked', code: 'capability_access_revoked' });
  expect(aliceRow()).toEqual(profileBeforeG1);
  expect(db.prepare("SELECT * FROM owned_artifacts WHERE project_id = ? ORDER BY rowid ASC").all(projectA.project_id)).toEqual(artifactsBeforeG1);
  expect(readFileSync(join(rootA, '.qa', 'project', 'auth', 'profiles.json'), 'utf8')).toBe(profilesJsonBeforeG1);
  expect(aliceInventory().map(i => i.password)).toEqual(['third-password']);
  expect(readProviderInventory(providerDir).find(item => item.ref.auth_profile_id === 'unrelated-profile')?.password).toBe('keep-unrelated-secret');
  expect(cleanupRows()).toHaveLength(0);

  // Subsequent authorized login under G2 succeeds.
  const procG2 = await spawnMcpClient(rootA);
  const g2Outcome = await procG2.call('qap_auth_add', {
    profile: 'alice',
    username: 'alice',
    password: 'g2-authorized-password',
    verification_route: '/home',
  });
  await procG2.close();
  expect(g2Outcome).toMatchObject({ status: 'success', code: 'authentication_verified' });
  const g2RefKey = aliceRow().credential_ref_key;
  expect(g2RefKey).not.toBe(thirdRefKey);
  expect(aliceInventory().map(i => i.password)).toEqual(['g2-authorized-password']);

  // 4. Concurrent renewals in two independent processes with deterministic POST /login barrier -> neither loses active ref nor leaks secrets.
  concurrentBarrierCount = 2;
  const conc1EnteredFile = join(base, 'conc1-entered.flag');
  const procConc1 = await spawnMcpClient(rootA, { QAP_ROT_SET_ENTERED_FILE: conc1EnteredFile });
  const concPromise1 = procConc1.call('qap_auth_add', {
    profile: 'alice',
    username: 'alice',
    password: 'concurrent-one',
    verification_route: '/home',
  });
  await waitForFile(conc1EnteredFile);

  const procConc2 = await spawnMcpClient(rootA);
  const concPromise2 = procConc2.call('qap_auth_add', {
    profile: 'alice',
    username: 'alice',
    password: 'concurrent-two',
    verification_route: '/home',
  });

  const [concRes1, concRes2] = await Promise.all([concPromise1, concPromise2]);
  await Promise.all([procConc1.close(), procConc2.close()]);

  const statuses = [concRes1.status, concRes2.status].sort();
  expect(statuses, JSON.stringify({ concRes1, concRes2 })).toEqual(['blocked', 'success']);
  const loser = concRes1.status === 'blocked' ? concRes1 : concRes2;
  expect(loser.code).toBe('auth_profile_changed');
  const expectedWinnerPassword = concRes1.status === 'success' ? 'concurrent-one' : 'concurrent-two';

  expect(cleanupRows()).toHaveLength(0);
  const finalAliceInv = aliceInventory();
  expect(finalAliceInv).toHaveLength(1);
  expect(finalAliceInv[0].password).toBe(expectedWinnerPassword);
  expect(aliceRow().credential_ref_key).toBe(finalAliceInv[0].ref.account);
  expect(readProviderInventory(providerDir).find(item => item.ref.auth_profile_id === 'unrelated-profile')?.password).toBe('keep-unrelated-secret');

  // 5. Isolation between two projects -> Project B rows and credentials remain untouched.
  expect(snapshotProjectRows(db, projectB.project_id)).toEqual(projectBSnapshotBefore);
  const projectBSecretsAfter = readProviderInventory(providerDir).filter(item => item.ref.projectId === projectB.project_id);
  expect(projectBSecretsAfter).toEqual(projectBSecretsBefore);
}, 120_000);
