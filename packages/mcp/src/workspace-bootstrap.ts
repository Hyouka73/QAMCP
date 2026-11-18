import { existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { basename, join, parse, resolve } from 'node:path';

import { SqliteKnowledgeAdapter } from '@qap/knowledge';
import { KnowledgeStoreError } from '@qap/engine';
import YAML from 'yaml';

import { ApplicationServiceError, type QapApplicationService, type RootAuthorizationReference } from './application/application-service.js';
import type { ProjectKnowledgeBinding } from './handlers/state-services.js';
import { readProjectResetState, withProjectOperation, workspaceStorageKey } from './project-reset.js';

/** Host-owned capability. Never constructed from tool arguments or project files.
 * No review keys/gateways or navigation policies are created by this component. */
export class WorkspaceBootstrap {
  private readonly stores = new Map<string, SqliteKnowledgeAdapter>();
  readonly directory: string;
  constructor(
    directory: string,
    readonly appService?: QapApplicationService,
  ) {
    this.directory = resolve(directory);
    this.appService?.bindProjectOperationDirectory(this.directory);
  }

  private preparation: Promise<unknown> = Promise.resolve();
  private readonly initializationRevision = new Map<string, number>();
  private readonly pendingWarm = new Map<string, Promise<ProjectKnowledgeBinding | undefined>>();

  private registered = (root: string): boolean => {
    try {
      const roots: unknown = JSON.parse(readFileSync(join(this.directory, 'authorized-roots.json'), 'utf8'));
      const key = (value: string) => process.platform === 'win32' ? resolve(value).toLowerCase() : resolve(value);
      return Array.isArray(roots) && roots.every(item => typeof item === 'string') && roots.some(item => key(item) === key(root));
    } catch { return false; }
  };

  validateBinding(binding: ProjectKnowledgeBinding): boolean {
    try {
      const access = this.appService && binding.projectAccess && this.appService.authority.check(binding.projectAccess.projectId, 'access', { root_path: binding.projectRoot }, undefined, Date.now(), false);
      return !!this.appService && !!binding.rootAuthorization &&
        resolve(binding.projectRoot) === binding.rootAuthorization.canonical_root &&
        this.appService.validateRootAuthorizationReference(binding.rootAuthorization, this.registered) &&
        !!binding.projectAccess &&
        this.appService.findActiveProjectByRoot(binding.projectRoot)?.project_id === binding.projectAccess.projectId &&
        !!access?.allowed && access.grant?.grant_id === binding.projectAccess.grantId;
    } catch { return false; }
  }

  prepare(root: string, url?: string): Promise<ProjectKnowledgeBinding | undefined> {
    const reference = this.appService?.getRootAuthorizationReference(root, this.registered);
    if (!reference) return Promise.reject(new ApplicationServiceError('workspace_persistent_authority_required', 'La autoridad de la raíz no está vigente.'));
    const active = this.appService?.findActiveProjectByRoot(root);
    const admitted = active && this.appService!.authority.check(active.project_id, 'access', { root_path: active.canonical_root }, undefined, Date.now(), false);
    if (active && (!admitted?.allowed || !admitted.grant)) return Promise.reject(new ApplicationServiceError('capability_access_revoked', 'El acceso al proyecto no está vigente.'));
    const access = active && admitted?.grant ? { projectId: active.project_id, grantId: admitted.grant.grant_id } : undefined;
    // Capture the optimistic initialization epoch without taking a local lock.
    const observed = this.initializationRevision.get(root) ?? (this.hasKnowledge(root) ? 1 : 0);
    const requestKey = JSON.stringify([root, url, reference, access]);
    const pending = observed ? this.pendingWarm.get(requestKey) : undefined;
    if (pending) return pending;
    // Schedule local publications; no gate or SQLite transaction is held while queued.
    const operation = this.preparation.catch(() => undefined).then(() =>
      withProjectOperation(this.directory, async () => {
        // Preserve revision-zero conflicts after admission through the host gate.
        if ((this.initializationRevision.get(root) ?? observed) !== observed) {
          throw new KnowledgeStoreError('CONFLICT', 'Concurrent workspace initialization');
        }
        if (!this.appService!.validateRootAuthorizationReference(reference, this.registered)) {
          throw new ApplicationServiceError('workspace_persistent_authority_required', 'La autoridad de la raíz no está vigente.');
        }
        const current = this.appService!.findActiveProjectByRoot(root);
        const currentAccess = current && this.appService!.authority.check(current.project_id, 'access', { root_path: current.canonical_root }, undefined, Date.now(), false);
        if ((access && (current?.project_id !== access.projectId || !currentAccess?.allowed || currentAccess.grant?.grant_id !== access.grantId)) || (!access && current)) throw new ApplicationServiceError('capability_access_revoked', 'El acceso al proyecto no está vigente.');
        const result = await this.publish(root, reference, url);
        if (result) this.initializationRevision.set(root, 1);
        return result;
      }));
    const completed = operation.finally(() => {
      if (this.pendingWarm.get(requestKey) === completed) this.pendingWarm.delete(requestKey);
    });
    if (observed) this.pendingWarm.set(requestKey, completed);
    this.preparation = completed;
    return completed;
  }

  private async publish(root: string, reference: RootAuthorizationReference, url?: string): Promise<ProjectKnowledgeBinding | undefined> {
    if (readProjectResetState(this.directory, root)?.state === 'pending') {
      throw new ApplicationServiceError('project_reset_incomplete', 'El reset del proyecto no ha terminado.');
    }
    const tombstone = this.appService?.getTombstoneByRoot(root);
    if (tombstone) {
      throw new ApplicationServiceError(
        'project_deleted_tombstone',
        `El workspace '${root}' tiene un borrado previo (${tombstone.project_id}); se impide su recreación automática.`,
        { deleted_project_id: tombstone.project_id, recovery_available: true },
      );
    }
    if (this.appService?.isRootDeletionInProgress(root)) throw new ApplicationServiceError('root_authorization_deletion_in_progress', 'El borrado de la raíz está en curso.');
    const active = this.appService?.findActiveProjectByRoot(root);
    if (active && !this.appService!.authority.check(active.project_id, 'access', { root_path: active.canonical_root }, undefined, Date.now(), false).allowed) {
      throw new ApplicationServiceError('capability_access_revoked', 'El acceso al proyecto no está vigente.');
    }
    const key = workspaceStorageKey(root);
    const host = join(resolve(this.directory), key);
    // Check every existing ancestor before mkdir/open, including host and DB links.
    const safe = (path: string) => {
      let part = parse(path).root;
      for (const segment of path.slice(part.length).split(/[\\/]/).filter(Boolean)) {
        part = join(part, segment);
        if (existsSync(part) && (lstatSync(part).isSymbolicLink() ||
            resolve(realpathSync(part)).toLowerCase() !== resolve(part).toLowerCase() ||
            (lstatSync(part).isFile() && lstatSync(part).nlink !== 1))) throw new Error('Unsafe bootstrap path');
      }
    };
    safe(host);
    // Host data must remain outside the application workspace.
    const within = (a: string, b: string) => b.toLowerCase() === a.toLowerCase() || b.toLowerCase().startsWith(a.toLowerCase() + '/');
    if (within(root.replaceAll('\\', '/'), host.replaceAll('\\', '/'))) throw new Error('Host directory overlaps project');
    mkdirSync(host, { recursive: true, mode: 0o700 });
    const db = join(host, 'knowledge.sqlite');
    for (const suffix of ['', '-wal', '-shm']) safe(db + suffix);
    if (existsSync(db)) {
      try {
        if (lstatSync(db).isFile() && statSync(db).size === 0) {
          const wal = db + '-wal';
          const shm = db + '-shm';
          const hasWalContent = existsSync(wal) && statSync(wal).size > 0;
          if (!hasWalContent) {
            unlinkSync(db);
            if (existsSync(wal)) unlinkSync(wal);
            if (existsSync(shm)) unlinkSync(shm);
          }
        }
      } catch {
        // Best effort
      }
    }
    let store = this.stores.get(root);
    if (!store) { store = new SqliteKnowledgeAdapter(db); this.stores.set(root, store); }
    const app = 'workspace-' + key.slice(0, 32), environmentId = 'local';
    const existing = await store.get(app, 'application', app);
    if (!existing && url) {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash) throw new Error('Invalid application URL');
      const at = new Date().toISOString();
      const trace = { source: 'onboarding_input', recorded_by: 'qap_context_set', recorded_at: at,
        reason: 'Application location supplied during onboarding; no navigation or review authorization', review: 'unreviewed' as const, evidence_refs: [] };
      await store.commit(app, [
        { kind: 'application', expected_revision: 0, trace, entity: { application_id: app, name: basename(root), base_url: url, created_at: at } },
        { kind: 'environment', expected_revision: 0, trace, entity: { application_id: app, environment_id: environmentId, name: 'local', base_url: url,
          safe_domains: (() => { try { return [new URL(url).hostname]; } catch { return []; } })(), is_production: false, destructive_actions_allowed: false } },
      ]);
    }
    // Minimal compatible local scaffold. Exclusive writes preserve restart state.
    const qa = join(root, '.qa');
    for (const path of ['project', 'modules', 'cache', 'executions', 'plans']) { safe(join(qa, path)); mkdirSync(join(qa, path), { recursive: true }); }
    const put = (relative: string, content: string) => {
      const path = join(qa, relative); safe(path);
      if (!existsSync(path)) { try { writeFileSync(path, content, { flag: 'wx', mode: 0o600 }); } catch (e) { if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e; } }
    };
    put('project/context.yaml', YAML.stringify({ _version: '1', project_name: basename(root), description: '', tech_stack: [], manually_edited: false }));
    put('project/environments.yaml', YAML.stringify({ _version: '1', default: 'local', environments: {} }));
    put('project/lifecycle.json', JSON.stringify({ _version: '1', phase: 'ONBOARDING', session: { id: '', started_at: new Date().toISOString(), plan: [] }, modules: {}, history: [] }));
    put('.gitignore', 'cache/\nexecutions/\n');
    if (this.appService) {
      let project = this.appService.findActiveProjectByRoot(root);
      if (!project) {
        const snapshot = this.appService.createProject({
          name: basename(root) || 'proyecto',
          canonicalRoot: root,
          baseUrl: url,
        });
        project = snapshot.project;
      } else if (url && project.active_env_id) {
        this.appService.upsertEnvironment({
          projectId: project.project_id,
          name: 'local',
          baseUrl: url,
        });
      }
      if (!this.appService.authority.check(project.project_id, 'access', { root_path: project.canonical_root }).allowed) {
        this.appService.authority.grant({
          project_id: project.project_id,
          capability: 'access',
          scope: { root_path: project.canonical_root, ...(project.active_env_id ? { env_id: project.active_env_id } : {}) },
          granted_by: 'host_operator',
        });
      }
    }
    if (!existing && !url) return undefined;
    const rootAuthorization = Object.freeze({ ...reference,
      protected_ancestors: Object.freeze(reference.protected_ancestors.map(ancestor => Object.freeze({ ...ancestor }))) });
    const project = this.appService!.findActiveProjectByRoot(root);
    const grant = project && this.appService!.authority.check(project.project_id, 'access', { root_path: root }, undefined, Date.now(), false);
    if (!project || !grant?.allowed || !grant.grant) throw new ApplicationServiceError('capability_access_revoked', 'El acceso al proyecto no está vigente.');
    const projectAccess = Object.freeze({ projectId: project.project_id, grantId: grant.grant.grant_id });
    return Object.freeze({ projectRoot: root, rootAuthorization, projectAccess, applicationId: app, environmentId, store, moduleBindings: [] });
  }
  hasKnowledge(root: string): boolean { return existsSync(join(this.directory, workspaceStorageKey(root), 'knowledge.sqlite')); }
  release(root: string): void { this.stores.get(root)?.close(); this.stores.delete(root); }
  close(): void { for (const root of this.stores.keys()) this.release(root); }
}
