import { existsSync, lstatSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';

import { SqliteKnowledgeAdapter } from '@qap/knowledge';

import { SqliteInterviewDraftStore } from './handlers/interview-draft-store.js';
import { SqliteModuleClosureStore } from './handlers/module-closure-store.js';
import type { ModuleBinding } from './handlers/module-observation-bridge.js';
import type { McpServerOptions } from './server.js';

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

function secret(env: NodeJS.ProcessEnv, name: unknown): Buffer {
  const key = requiredText(name, 'keyEnv');
  if (!/^QAP_MCP_[A-Z0-9_]+_KEY_HEX$/.test(key) ||
      !/^[0-9a-fA-F]{64}$/.test(env[key] ?? '')) {
    throw new Error('Missing or invalid host-managed 32-byte key.');
  }
  return Buffer.from(env[key], 'hex');
}

function declaredModules(value: unknown): ModuleBinding[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 256) {
    throw new Error('Host must explicitly declare one or more module bindings.');
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

/** No manifest means legacy-only startup; malformed opt-in ALWAYS fails startup. */
export async function loadHostComposition(
  env: NodeJS.ProcessEnv = process.env
): Promise<HostComposition> {
  const manifestPath = env.QAP_MCP_HOST_CONFIG_PATH;
  if (manifestPath === undefined) {
    return { options: {}, close() { /* No host-owned resources. */ } };
  }
  const path = existingFile(manifestPath, 'manifest');
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
  const dbPath = existingFile(payload.knowledgeDbPath, 'knowledgeDbPath');

  const closeables: Array<{ close(): void }> = [];
  try {
    // Existing-only: never silently initialize a privileged Knowledge database.
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
        knowledgeBindings: [{
          ...scope, store, moduleBindings: modules, interviewDraftStore, moduleClosureStore,
          // Never infer review authority from a JSON manifest or an MCP client.
          // An application host may inject a genuine gateway through createMcpServer.
        }],
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
