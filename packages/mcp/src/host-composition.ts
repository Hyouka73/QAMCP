import { existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { URL } from 'node:url';
import { homedir } from 'node:os';

import { SqliteKnowledgeAdapter } from '@qap/knowledge';

import { QapApplicationService } from './application/application-service.js';
import { atomicWritePrivateFile, normalizePathKey } from './application/safe-storage.js';
import { HostReviewQueue } from './host-review.js';
import { SqliteInterviewDraftStore } from './handlers/interview-draft-store.js';
import type { TestNavigationAuthorization } from './handlers/test.handler.js';
import type { DiscoveryAuthorization } from './handlers/discovery.handler.js';
import { SqliteModuleClosureStore } from './handlers/module-closure-store.js';
import type { ModuleBinding } from './handlers/module-observation-bridge.js';
import type { McpServerOptions } from './server.js';
import { WorkspaceBootstrap } from './workspace-bootstrap.js';
import { validateCandidateWorkspace } from './workspace-authorizer.js';
import {
  loadDiscoveryAuthorizationsFromDisk,
  WindowsInteractiveDiscoveryAuthorizer,
} from './discovery-authorizer.js';
import {
  loadAuthAuthorizationsFromDisk,
} from './auth-authorizer.js';
import {
  loadTestAuthorizationsFromDisk,
} from './test-authorizer.js';
import { authorizationDiagnostic } from './authorization-diagnostics.js';

/**
 * Opt-in Stdio composition. The manifest comes from the HOST environment, never
 * from MCP tool arguments or a file discovered in the target application.
 * It contains identities and file locations, not credentials or decisions.
 */
export interface HostComposition {
  readonly options: McpServerOptions;
  close(): void;
}

type JsonRecord = Record<string, unknown>;
const object = (input: unknown): input is JsonRecord =>
  input !== null && typeof input === 'object' && !Array.isArray(input);

function requiredText(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim() || value.length > 4096 ||
      [...value].some(char => char.charCodeAt(0) < 32)) {
    throw new Error('Invalid host configuration: ' + label);
  }
  return value;
}

function existingFile(path: unknown, label: string): string {
  const candidate = requiredText(path, label);
  if (!isAbsolute(candidate) || resolve(candidate) !== candidate ||
      !existsSync(candidate) || realpathSync(candidate) !== candidate) {
    throw new Error('Host configuration requires an existing canonical absolute ' + label);
  }
  const stat = lstatSync(candidate);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 ||
      realpathSync(dirname(candidate)) !== dirname(candidate)) {
    throw new Error('Unsafe host configuration file: ' + label);
  }
  return candidate;
}

/**
 * Existing-only must reject an empty or v1 store BEFORE the mutating adapter
 * constructor runs. Read-only connection + query_only are intentional:
 * migration and provisioning happen through explicit administrative setup.
 */
function preflightExistingKnowledge(path: string): void {
  const sqlite = createRequire(import.meta.url)('node:sqlite') as typeof import('node:sqlite');
  const db = new sqlite.DatabaseSync(path, { readOnly: true });
  try {
    db.exec('PRAGMA query_only = ON');
    const version = db.prepare('PRAGMA user_version').get()?.user_version;
    const applicationId = db.prepare('PRAGMA application_id').get()?.application_id;
    if (version !== 2 || applicationId !== 0x5141504b) {
      throw new Error('Host Knowledge must be provisioned at schema v2 before startup.');
    }
    const migrations = db.prepare(
      'SELECT version, integrity_result FROM knowledge_migrations ORDER BY version'
    ).all();
    if (migrations.length !== 2 || migrations[0].version !== 1 ||
        migrations[1].version !== 2 ||
        migrations.some(row => row.integrity_result !== 'ok')) {
      throw new Error('Host Knowledge is not fully provisioned.');
    }
    // The adapter performs full checksums, schema and FTS integrity validation
    // after this non-mutating version gate.
  } finally {
    db.close();
  }
}

function secret(env: NodeJS.ProcessEnv, name: unknown): Buffer {
  const key = requiredText(name, 'keyEnv');
  if (!/^QAP_MCP_[A-Z0-9_]+_KEY_HEX$/.test(key) ||
      !/^[0-9a-fA-F]{64}$/.test(env[key] ?? '')) {
    throw new Error('Missing or invalid host-managed 32-byte key.');
  }
  return Buffer.from(env[key], 'hex');
}

function declaredModules(value: unknown): ModuleBinding[] {
  if (!Array.isArray(value) || value.length > 256) {
    throw new Error('Host must explicitly declare module bindings (empty for provisional inventory).');
  }
  const modules: ModuleBinding[] = [];
  const names = new Set<string>();
  for (const item of value) {
    if (!object(item)) throw new Error('Invalid host module binding.');
    const plannedName = requiredText(item.plannedName, 'plannedName');
    const moduleId = requiredText(item.moduleId, 'moduleId');
    const moduleKey = requiredText(item.moduleKey, 'moduleKey');
    const revisions = [item.moduleRevision, item.applicationRevision, item.environmentRevision];
    if (names.has(plannedName) || item.provenance !== 'host_declared' ||
        revisions.some(v => !Number.isSafeInteger(v) || (v as number) < 1)) {
      throw new Error('Ambiguous or invalid host module binding.');
    }
    names.add(plannedName);
    modules.push({
      plannedName, moduleId, moduleKey,
      moduleRevision: item.moduleRevision as number,
      applicationRevision: item.applicationRevision as number,
      environmentRevision: item.environmentRevision as number,
      provenance: 'host_declared',
    });
  }
  return modules;
}

/**
 * Discovery consent must be declared verbatim by the trusted host. No automatic
 * consent for application URLs, public/private IPs or authenticated traffic.
 * Crawler itself revalidates destination, DNS, policy and network scope.
 */
function discoveryPolicy(
  input: unknown,
  scope: { projectRoot: string; applicationId: string; environmentId: string },
  currentRevision: number,
): DiscoveryAuthorization | undefined {
  if (input === undefined) return;
  if (!object(input) || input.read_only_acknowledged !== true ||
      input.environmentRevision !== currentRevision ||
      !Array.isArray(input.navigation_urls) ||
      !input.navigation_urls.length || input.navigation_urls.length > 64) {
    throw new Error('Explicit pinned read-only Discovery authorization required.');
  }
  if (input.authorizedProfiles !== undefined && (!Array.isArray(input.authorizedProfiles) || input.authorizedProfiles.length > 64 ||
    input.authorizedProfiles.some(v => typeof v !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(v)))) throw new Error('Invalid Discovery profiles');
  const navigation_urls = input.navigation_urls.map(item => {
    const value = requiredText(item, 'discovery.navigation_urls');
    let url: URL;
    try { url = new URL(value); }
    catch { throw new Error('Discovery URL must be absolute and exact.'); }
    if (!['http:', 'https:'].includes(url.protocol) ||
        !url.hostname || url.username || url.password || url.hash || url.href !== value) {
      throw new Error('Discovery URL must be absolute and exact.');
    }
    return value;
  });
  if (new Set(navigation_urls).size !== navigation_urls.length) {
    throw new Error('Duplicate Discovery navigation authorization.');
  }
  if (input.allowed_ips !== undefined &&
      (!Array.isArray(input.allowed_ips) || input.allowed_ips.length > 64 ||
       input.allowed_ips.some(value => typeof value !== 'string' ||
         !/^[0-9a-fA-F:.]{2,45}$/.test(value)))) {
    throw new Error('Invalid host Discovery allowed_ips.');
  }
  if (input.allow_public_network !== undefined &&
      typeof input.allow_public_network !== 'boolean') {
    throw new Error('Invalid public-network Discovery authorization.');
  }
  if (input.limits !== undefined) {
    if (!object(input.limits) || Object.keys(input.limits).some(key =>
        !['max_pages', 'max_depth', 'total_timeout_ms', 'navigation_timeout_ms',
          'max_requests', 'max_bytes', 'max_redirects', 'max_elements'].includes(key)) ||
        Object.values(input.limits).some(value => !Number.isSafeInteger(value) ||
          (value as number) < 1)) {
      throw new Error('Invalid bounded host Discovery limits.');
    }
  }
  if (input.browser !== undefined && (
      !object(input.browser) ||
      Object.keys(input.browser).some(key => key !== 'channel') ||
      !['chrome', 'msedge'].includes(String(input.browser.channel))
    )) {
    throw new Error('Unsupported host Discovery browser selector.');
  }
  return {
    ...scope,
    environmentRevision: currentRevision,
    ...(Array.isArray(input.authorizedProfiles) ? { authorizedProfiles: input.authorizedProfiles.map(value => requiredText(value, 'authorizedProfiles')) } : {}),
    authorization: {
      read_only_acknowledged: true,
      navigation_urls,
      ...(Array.isArray(input.allowed_ips) ?
        { allowed_ips: input.allowed_ips.map((value: unknown) => requiredText(value, 'allowed_ips')) } : {}),
      ...(typeof input.allow_public_network === 'boolean' ?
        { allow_public_network: input.allow_public_network } : {}),
    },
    ...(object(input.limits) ?
      { limits: { ...input.limits } } : {}),
    ...(input.browser ? { dependencies: { browser: { channel: input.browser.channel as 'chrome' | 'msedge' } } } : {}),
  };
}

/** Exact origins only: an opt-in host policy must never derive consent from tool arguments. */
function testPolicy(input: unknown, projectRoot: string): TestNavigationAuthorization | undefined {
  if (input === undefined) return;
  if (!object(input) || Object.keys(input).some(key => !['allowedOrigins', 'authorizedProfiles'].includes(key)) ||
      !Array.isArray(input.allowedOrigins) || !input.allowedOrigins.length || input.allowedOrigins.length > 64) {
    throw new Error('Invalid host test navigation authorization.');
  }
  const allowedOrigins = input.allowedOrigins.map(value => {
    const origin = requiredText(value, 'testAuthorization.allowedOrigins');
    let url: URL;
    try { url = new URL(origin); } catch { throw new Error('Test authorization requires exact HTTP origins.'); }
    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin || url.username || url.password) {
      throw new Error('Test authorization requires exact HTTP origins.');
    }
    return origin;
  });
  if (input.authorizedProfiles !== undefined && (!Array.isArray(input.authorizedProfiles) ||
      input.authorizedProfiles.length > 64 || input.authorizedProfiles.some(value =>
        typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(value)))) {
    throw new Error('Invalid host authorized profiles.');
  }
  return { projectRoot, allowedOrigins, allowRedirectsToAllowedOnly: true,
    ...(Array.isArray(input.authorizedProfiles) ? { authorizedProfiles: input.authorizedProfiles.map(value => requiredText(value, 'authorizedProfiles')) } : {}) };
}

function resolveOrProvisionHostSessionKey(directory: string, env: NodeJS.ProcessEnv): string | undefined {
  if (/^[0-9a-fA-F]{64}$/.test(env.QAP_SESSION_KEY ?? '')) {
    return env.QAP_SESSION_KEY;
  }
  if (env.QAP_DISABLE_SESSION_PERSISTENCE === '1' || env.NODE_ENV === 'test') {
    return undefined;
  }
  try {
    mkdirSync(directory, { recursive: true });
    const keyFile = resolve(directory, 'host-session.key');
    if (existsSync(keyFile)) {
      const existing = readFileSync(keyFile, 'utf8').trim();
      if (/^[0-9a-fA-F]{64}$/.test(existing)) return existing;
    }
    const generated = randomBytes(32).toString('hex');
    writeFileSync(keyFile, generated + '\n', { encoding: 'utf8', mode: 0o600 });
    return generated;
  } catch {
    return undefined;
  }
}

/** No manifest enables root-authorized local bootstrap. Malformed opt-in fails closed. */
export async function loadHostComposition(
  env: NodeJS.ProcessEnv = process.env
): Promise<HostComposition> {
  const manifestPath = env.QAP_MCP_HOST_CONFIG_PATH;
  const isWindowsInteractive = process.platform === 'win32' && !env.QAP_DISABLE_INTERACTIVE_AUTH && env.NODE_ENV !== 'test';
  if (manifestPath === undefined) {
    const defaultQapHome = resolve(env.QAP_MCP_HOST_DATA_DIR ?? resolve(homedir(), '.qap'));
    const directory = resolve(env.QAP_MCP_WORKSPACE_HOST_DIR ?? join(defaultQapHome, 'workspaces'));
    const appDataDir = resolve(env.QAP_MCP_APP_SERVICE_DIR ?? join(defaultQapHome, 'application'));
    const workspaceRoot = env.QAP_MCP_WORKSPACE_ROOT === undefined
      ? undefined
      : validateCandidateWorkspace(env.QAP_MCP_WORKSPACE_ROOT, directory);
    const registry = resolve(directory, 'authorized-roots.json');
    const discoveryRegistry = resolve(directory, 'discovery-authorizations.json');
    const authRegistry = resolve(directory, 'auth-authorizations.json');
    const testRegistry = resolve(directory, 'test-authorizations.json');
    const applicationService = new QapApplicationService({
      hostRootDir: appDataDir,
      onProjectDeleted: (_projectId, canonicalRoot) => {
        const targetKey = normalizePathKey(canonicalRoot);
        if (existsSync(registry)) {
          try {
            const parsed: unknown = JSON.parse(readFileSync(registry, 'utf8'));
            if (Array.isArray(parsed)) {
              const filtered = parsed.filter((p) => typeof p === 'string' && normalizePathKey(p) !== targetKey);
              atomicWritePrivateFile(registry, JSON.stringify(filtered, null, 2));
            }
          } catch { /* Best-effort cleanup */ }
        }
        if (existsSync(discoveryRegistry)) {
          try {
            const parsed: unknown = JSON.parse(readFileSync(discoveryRegistry, 'utf8'));
            if (Array.isArray(parsed)) {
              const filtered = parsed.filter(
                (entry) => entry && typeof entry === 'object' && normalizePathKey(String((entry as { projectRoot?: string }).projectRoot ?? '')) !== targetKey,
              );
              atomicWritePrivateFile(discoveryRegistry, JSON.stringify(filtered, null, 2));
            }
          } catch { /* Best-effort cleanup */ }
        }
        if (existsSync(authRegistry)) {
          try {
            const parsed: unknown = JSON.parse(readFileSync(authRegistry, 'utf8'));
            if (Array.isArray(parsed)) {
              const filtered = parsed.filter(
                (entry) => entry && typeof entry === 'object' && normalizePathKey(String((entry as { projectRoot?: string }).projectRoot ?? '')) !== targetKey,
              );
              atomicWritePrivateFile(authRegistry, JSON.stringify(filtered, null, 2));
            }
          } catch { /* Best-effort cleanup */ }
        }
        if (existsSync(testRegistry)) {
          try {
            const parsed: unknown = JSON.parse(readFileSync(testRegistry, 'utf8'));
            if (Array.isArray(parsed)) {
              const filtered = parsed.filter(
                (entry) => entry && typeof entry === 'object' && normalizePathKey(String((entry as { projectRoot?: string }).projectRoot ?? '')) !== targetKey,
              );
              atomicWritePrivateFile(testRegistry, JSON.stringify(filtered, null, 2));
            }
          } catch { /* Best-effort cleanup */ }
        }
      },
    });
    const bootstrap = new WorkspaceBootstrap(directory, applicationService);
    if (existsSync(registry)) {
      const values: unknown = JSON.parse(readFileSync(existingFile(registry, 'workspace registry'), 'utf8'));
      if (!Array.isArray(values) || values.some(value => typeof value !== 'string' || !isAbsolute(value) || realpathSync(value) !== value)) throw new Error('Invalid workspace registry');
    }
    const persistedDiscoveryAuthorizations = existsSync(discoveryRegistry)
      ? loadDiscoveryAuthorizationsFromDisk(discoveryRegistry)
      : [];
    const persistedAuthAuthorizations = existsSync(authRegistry)
      ? loadAuthAuthorizationsFromDisk(authRegistry)
      : [];
    const persistedTestAuthorizations = existsSync(testRegistry)
      ? loadTestAuthorizationsFromDisk(testRegistry)
      : [];
    const sessionPersistenceKey = isWindowsInteractive
      ? resolveOrProvisionHostSessionKey(directory, env)
      : undefined;
    const parsedTtl = env.QAP_SESSION_AUTH_TTL_MS ? Number(env.QAP_SESSION_AUTH_TTL_MS) : undefined;
    const authorizationTtlMs = parsedTtl && Number.isInteger(parsedTtl) && parsedTtl > 0 ? parsedTtl : undefined;
    authorizationDiagnostic('host_composition', {
      build: process.env.QAP_BUILD_REVISION ?? 'development',
      authorizer: 'host_bound_scope_only',
      discoveryAuthorizer: 'unconfigured',
      testAuthorizer: 'unconfigured',
      silentBoundScope: true,
      disabledByFlag: Boolean(env.QAP_DISABLE_INTERACTIVE_AUTH), testEnvironment: env.NODE_ENV === 'test', manifest: false,
    });
    return {
      options: {
        projectRoots: workspaceRoot ? [workspaceRoot] : [],
        configuredWorkspaceRoot: workspaceRoot,
        workspaceBootstrap: bootstrap,
        applicationService,
        allowSpaReadOnly: true,
        silentBoundScope: true,
        interactiveAccessAuthorizer: isWindowsInteractive ? new WindowsInteractiveDiscoveryAuthorizer() : undefined,
        clientWorkspaceRoots: workspaceRoot === undefined,
        hostRegistryPath: workspaceRoot === undefined ? registry : undefined,
        hostDiscoveryRegistryPath: discoveryRegistry,
        authorizationPersistencePath: resolve(directory, 'qa-session-authorizations.enc'),
        discoveryAuthorizations: persistedDiscoveryAuthorizations,
        hostAuthRegistryPath: authRegistry,
        authAuthorizations: persistedAuthAuthorizations,
        hostTestRegistryPath: testRegistry,
        testAuthorizations: persistedTestAuthorizations,
        sessionPersistenceKey,
        authorizationTtlMs,
      },
      close() {
        bootstrap.close();
        applicationService.close();
      },
    };
  }
  const path = existingFile(manifestPath, 'manifest');
  authorizationDiagnostic('host_composition', { build: process.env.QAP_BUILD_REVISION ?? 'development', manifest: true, authorizer: 'manifest_scope_only' });
  const payload: unknown = JSON.parse(readFileSync(path, 'utf8'));
  if (!object(payload) || payload.version !== 1) throw new Error('Unsupported host manifest version.');
  const root = requiredText(payload.projectRoot, 'projectRoot');
  if (!isAbsolute(root) || resolve(root) !== root || realpathSync(root) !== root ||
      !lstatSync(root).isDirectory()) {
    throw new Error('Project root must be an existing canonical absolute directory.');
  }
  const app = requiredText(payload.applicationId, 'applicationId');
  const environment = requiredText(payload.environmentId, 'environmentId');
  const modules = declaredModules(payload.moduleBindings);
  if (payload.interactiveAccess !== undefined && typeof payload.interactiveAccess !== 'boolean') {
    throw new Error('Invalid host interactiveAccess setting.');
  }
  const testAuthorization = testPolicy(payload.testAuthorization, root);
  const dbPath = existingFile(payload.knowledgeDbPath, 'knowledgeDbPath');

  const closeables: Array<{ close(): void }> = [];
  try {
    // Fail before the mutating adapter can create/migrate a supplied empty/v1 DB.
    preflightExistingKnowledge(dbPath);
    const store = new SqliteKnowledgeAdapter(dbPath);
    closeables.push(store);
    const application = await store.get(app, 'application', app);
    const target = await store.get(app, 'environment', environment);
    if (!application || !target || target.entity.application_id !== app ||
        target.entity.environment_id !== environment) {
      throw new Error('Host application/environment not present in canonical Knowledge.');
    }
    for (const binding of modules) {
      const module = await store.get(app, 'module', binding.moduleId);
      if (!module || module.entity.application_id !== app ||
          module.entity.key !== binding.moduleKey ||
          !module.entity.is_active || module.entity.superseded_by ||
          module.revision !== binding.moduleRevision ||
          application.revision !== binding.applicationRevision ||
          target.revision !== binding.environmentRevision) {
        throw new Error('Host module binding does not match pinned canonical revisions.');
      }
    }

    const scope = { projectRoot: root, applicationId: app, environmentId: environment };
    let reviewQueue: HostReviewQueue | undefined;
    if (payload.humanReview !== undefined) {
      if (!object(payload.humanReview) || payload.humanReview.protection !== 'host_private_directory_and_managed_key') throw new Error('Host review protection required');
      const reviewKey = secret(env, payload.humanReview.keyEnv);
      try { reviewQueue = new HostReviewQueue(requiredText(payload.humanReview.directory, 'humanReview.directory'), reviewKey); }
      finally { reviewKey.fill(0); }
      closeables.push(reviewQueue);
    }
    let interviewDraftStore: SqliteInterviewDraftStore | undefined;
    let moduleClosureStore: SqliteModuleClosureStore | undefined;
    if (payload.interviewDraft !== undefined) {
      if (!object(payload.interviewDraft) ||
          payload.interviewDraft.protection !== 'host_private_directory_and_managed_key') {
        throw new Error('Interview store requires host protection attestation.');
      }
      const draftKey = secret(env, payload.interviewDraft.keyEnv);
      try {
        interviewDraftStore = new SqliteInterviewDraftStore({
          ...scope,
          path: existingFile(payload.interviewDraft.dbPath, 'interviewDraft.dbPath'),
          key: draftKey,
          protection: 'host_private_directory_and_managed_key',
        });
      } finally { draftKey.fill(0); }
      closeables.push(interviewDraftStore);
      interviewDraftStore.read(scope); // Never silently accept unavailable/corrupt stores.
    }
    if (payload.moduleClosure !== undefined) {
      if (!object(payload.moduleClosure) ||
          payload.moduleClosure.protection !== 'host_private_directory_and_managed_key') {
        throw new Error('Closure store requires host protection attestation.');
      }
      const closureKey = secret(env, payload.moduleClosure.keyEnv);
      try {
        moduleClosureStore = new SqliteModuleClosureStore({
          ...scope,
          path: existingFile(payload.moduleClosure.dbPath, 'moduleClosure.dbPath'),
          key: closureKey,
          protection: 'host_private_directory_and_managed_key',
        });
      } finally { closureKey.fill(0); }
      closeables.push(moduleClosureStore);
      moduleClosureStore.read(scope);
    }
    return {
      options: {
        projectRoots: [root],
        provisionalInventory: modules.length === 0,
        interactiveAccessEnabled: payload.interactiveAccess === true,
        interactiveAccessAuthorizer: payload.interactiveAccess === true && isWindowsInteractive
          ? new WindowsInteractiveDiscoveryAuthorizer() : undefined,
        ...(testAuthorization ? { testAuthorizations: [testAuthorization] } : {}),
        knowledgeBindings: [{
          ...scope, store, moduleBindings: modules, interviewDraftStore, moduleClosureStore,
          humanReviewGateway: reviewQueue, moduleClosureReviewGateway: reviewQueue, caseReviewGateway: reviewQueue,
          // Never infer review authority from a JSON manifest or an MCP client.
          // An application host may inject a genuine gateway through createMcpServer.
        }],
        ...(payload.discoveryAuthorization !== undefined ? {
          discoveryAuthorizations: [
            discoveryPolicy(payload.discoveryAuthorization, scope, target.revision)!,
          ],
        } : {}),
      },
      close() {
        for (const resource of [...closeables].reverse()) resource.close();
      },
    };
  } catch (error) {
    for (const resource of closeables.reverse()) {
      try { resource.close(); } catch { /* Preserve original startup failure. */ }
    }
    throw error;
  }
}
