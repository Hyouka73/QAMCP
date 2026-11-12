import { existsSync, lstatSync, mkdirSync, realpathSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { basename, join, parse, resolve } from 'node:path';

import { SqliteKnowledgeAdapter } from '@qap/knowledge';
import YAML from 'yaml';

import type { ProjectKnowledgeBinding } from './handlers/state-services.js';
import { workspaceStorageKey } from './project-reset.js';

/** Host-owned capability. Never constructed from tool arguments or project files.
 * No review keys/gateways or navigation policies are created by this component. */
export class WorkspaceBootstrap {
  private readonly stores = new Map<string, SqliteKnowledgeAdapter>();
  readonly directory: string;
  constructor(directory: string) { this.directory = resolve(directory); }

  async prepare(root: string, url?: string): Promise<ProjectKnowledgeBinding | undefined> {
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
          safe_domains: [], is_production: false, destructive_actions_allowed: false } },
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
    if (!existing && !url) return undefined;
    return { projectRoot: root, applicationId: app, environmentId, store, moduleBindings: [] };
  }
  hasKnowledge(root: string): boolean { return existsSync(join(this.directory, workspaceStorageKey(root), 'knowledge.sqlite')); }
  release(root: string): void { this.stores.get(root)?.close(); this.stores.delete(root); }
  close(): void { for (const root of this.stores.keys()) this.release(root); }
}
