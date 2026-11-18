import { createHash, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const modulePath = process.env.QAP_ROT_MODULE;
const hostDir = process.env.QAP_ROT_HOST;
const appDir = process.env.QAP_ROT_APP;
const providerDir = process.env.QAP_ROT_PROVIDER_DIR;
const workspace = process.env.QAP_ROT_WORKSPACE;
const failDeleteFile = process.env.QAP_ROT_FAIL_DELETE_FILE;
const setEnteredFile = process.env.QAP_ROT_SET_ENTERED_FILE;
const setReleaseFile = process.env.QAP_ROT_SET_RELEASE_FILE;
const mode = process.env.QAP_ROT_MODE ?? 'mcp';

if (!modulePath || !hostDir || !appDir || !providerDir) {
  throw new Error('Missing required QAP_ROT_* environment variables');
}

const requireFromMcp = createRequire(pathToFileURL(modulePath));
const mcp = await import(pathToFileURL(modulePath).href);
const auth = await import(pathToFileURL(requireFromMcp.resolve('@qap/auth')).href);

function secretPath(ref) {
  const digest = createHash('sha256').update(auth.referenceKey(ref)).digest('hex');
  return join(providerDir, `${digest}.json`);
}

function waitForFile(filePath, timeoutMs) {
  return new Promise((resolve, reject) => {
    if (existsSync(filePath)) {
      resolve();
      return;
    }
    const deadline = Date.now() + timeoutMs;
    const interval = setInterval(() => {
      if (existsSync(filePath)) {
        clearInterval(interval);
        resolve();
      } else if (Date.now() >= deadline) {
        clearInterval(interval);
        reject(new Error(`Timed out waiting for barrier release: ${filePath}`));
      }
    }, 15);
  });
}

const provider = {
  async set(ref, credentials) {
    const validated = auth.validateCredentials(credentials);
    const file = secretPath(ref);
    const stage = `${file}.${process.pid}.${randomUUID()}.tmp`;
    mkdirSync(providerDir, { recursive: true });
    writeFileSync(stage, JSON.stringify({ ref, password: validated.password }), { encoding: 'utf8', mode: 0o600 });
    renameSync(stage, file);
    if (setEnteredFile) {
      writeFileSync(setEnteredFile, String(process.pid), 'utf8');
    }
    if (setReleaseFile) {
      await waitForFile(setReleaseFile, 30_000);
    }
  },
  async get(ref) {
    const file = secretPath(ref);
    if (!existsSync(file)) return null;
    const parsed = JSON.parse(readFileSync(file, 'utf8'));
    return typeof parsed.password === 'string' ? { password: parsed.password } : null;
  },
  async delete(ref) {
    if (failDeleteFile && existsSync(failDeleteFile)) {
      throw new Error('synthetic_provider_delete_unavailable');
    }
    const file = secretPath(ref);
    if (!existsSync(file)) return false;
    rmSync(file, { force: true });
    return true;
  },
  close() {},
};

const applicationService = new mcp.QapApplicationService({
  hostRootDir: appDir,
  projectOperationDirectory: hostDir,
  credentialProvider: provider,
});

await applicationService.reconcileReplacedCredentials();

if (mode === 'reconcile') {
  const projectId = process.env.QAP_ROT_READ_PROJECT_ID;
  const profileRef = process.env.QAP_ROT_READ_PROFILE;
  let secret = null;
  if (projectId && profileRef) {
    const matched = applicationService.resolveProfileAlias(projectId, profileRef);
    if (matched.status === 'matched') {
      secret = await applicationService.readProfileSecret(projectId, matched.profile.profile_id);
    }
  }
  applicationService.close();
  process.stdout.write(JSON.stringify({ reconciled: true, secret }) + '\n');
  process.exit(0);
}

if (!workspace) {
  throw new Error('QAP_ROT_WORKSPACE is required in mcp mode');
}

const bootstrap = new mcp.WorkspaceBootstrap(hostDir, applicationService);
const server = mcp.createMcpServer({
  projectRoots: [workspace],
  configuredWorkspaceRoot: workspace,
  workspaceBootstrap: bootstrap,
  applicationService,
  allowSpaReadOnly: true,
  silentBoundScope: true,
  hostRegistryPath: join(hostDir, 'authorized-roots.json'),
});

let closed = false;
const shutdown = async () => {
  if (closed) return;
  closed = true;
  try { await server.close(); } catch {}
  try { bootstrap.close(); } catch {}
  try { applicationService.close(); } catch {}
};

process.once('SIGINT', () => { void shutdown().finally(() => process.exit(0)); });
process.once('SIGTERM', () => { void shutdown().finally(() => process.exit(0)); });
process.stdin.once('end', () => { void shutdown().finally(() => process.exit(0)); });

await server.connect(new StdioServerTransport());
