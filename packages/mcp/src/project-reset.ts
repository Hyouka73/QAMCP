import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from 'node:crypto';
import { closeSync, fsyncSync, lstatSync, mkdirSync, openSync, readFileSync, readdirSync, readSync, realpathSync, renameSync, rmdirSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { createRequire } from 'node:module';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

import { validateCandidateWorkspace } from './workspace-authorizer.js';

const TTL = 120_000;
const requireSqlite = () => createRequire(import.meta.url)('node:sqlite') as typeof import('node:sqlite');
const same = (a: string, b: string) => process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b;
const within = (parent: string, child: string) => {
  const rel = relative(parent, child);
  return rel !== '..' && !rel.startsWith('..' + sep) && !isAbsolute(rel);
};
const hash = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
export const workspaceStorageKey = (root: string) => hash(process.platform === 'win32' ? root.toLowerCase() : root);
export const resetHostDirectory = () => resolve(process.env.QAP_MCP_WORKSPACE_HOST_DIR ?? join(homedir(), '.qap', 'workspaces'));

export function localProjectResetOptions(): ResetOptions {
  const directory = resetHostDirectory();
  const keyPath = join(directory, 'host-session.key');
  const key = process.env.QAP_SESSION_KEY ?? (physical(directory) && physical(keyPath)?.isFile() ? readFileSync(keyPath, 'utf8').trim() : undefined);
  return { directory, rootsPath: join(directory, 'authorized-roots.json'), discoveryPath: join(directory, 'discovery-authorizations.json'),
    grantsPath: join(directory, 'qa-session-authorizations.enc'), key };
}

type Classification = 'exclusive' | 'shared' | 'external';
interface Resource { resource: string; classification: Classification; action: 'remove' | 'remove_project_records' | 'preserve'; count: number }
interface Target { summary: Resource; stamp: string; remove?: () => void }
interface Snapshot { targets: Target[]; digest: string; sqlite: string[] }
export interface ResetPreview { project: string; reset_id: string; inventory_digest: string; expires_at: string; inventory: Resource[] }
export type ResetAuthorizer = (preview: ResetPreview, signal: AbortSignal) => Promise<'approved' | 'rejected' | 'cancelled' | 'unavailable'>;
interface ResetOptions {
  directory: string;
  rootsPath?: string;
  discoveryPath?: string;
  grantsPath?: string;
  key?: string;
}
interface ResetState { id: string; state: 'pending' | 'complete' | 'initialized' }
class ResetError extends Error {}
const fail = (code: string): never => { throw new ResetError(code); };
const codeOf = (error: unknown) => error instanceof ResetError ? error.message : 'storage_error';
const stat = (path: string) => {
  try { return lstatSync(path, { bigint: true }); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; return undefined; }
};
function physical(path: string) {
  const s = stat(path);
  if (s && (s.isSymbolicLink() || (!s.isDirectory() && (!s.isFile() || s.nlink !== 1n)) ||
    !same(realpathSync(path), path))) fail('unsafe_storage_path');
  return s;
}
function directory(path: string): void {
  if (dirname(path) !== path && !stat(path)) directory(dirname(path));
  const s = physical(path);
  if (s && !s.isDirectory()) fail('unsafe_storage_path');
  if (!s) {
    try { mkdirSync(path, { mode: 0o700 }); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error; }
  }
  if (!physical(path)?.isDirectory()) fail('unsafe_storage_path');
}
function atomic(path: string, value: unknown): void {
  const stage = path + '.' + randomUUID() + '.tmp';
  const fd = openSync(stage, 'wx', 0o600);
  try {
    try { writeFileSync(fd, JSON.stringify(value)); fsyncSync(fd); } finally { closeSync(fd); }
    renameSync(stage, path);
  } finally { rmSync(stage, { force: true }); }
}

// SQLite releases this cross-process gate automatically if a QAP process exits.
export function acquireProjectOperation(host: string): () => void {
  directory(host);
  const path = join(host, 'project-operations.sqlite');
  if (physical(path)?.isDirectory()) fail('unsafe_storage_path');
  const db = new (requireSqlite().DatabaseSync)(path);
  try { db.exec('PRAGMA busy_timeout=0; BEGIN EXCLUSIVE'); }
  catch { db.close(); return fail('project_storage_busy'); }
  return () => { db.close(); };
}
export function readProjectResetState(host: string, root: string): ResetState | undefined {
  if (!physical(host)) return;
  const dir = join(host, 'project-resets');
  if (!physical(dir)) return;
  const path = join(dir, workspaceStorageKey(root) + '.json');
  if (!physical(path)) return;
  const value = JSON.parse(readFileSync(path, 'utf8')) as ResetState;
  if (!['pending', 'complete', 'initialized'].includes(value.state) || typeof value.id !== 'string') fail('reset_state_invalid');
  return value;
}
export function acknowledgeProjectInitialization(host: string, root: string, state: ResetState): void {
  atomic(join(host, 'project-resets', workspaceStorageKey(root) + '.json'), { ...state, state: 'initialized' });
}

function stamp(path: string, onSqlite: (path: string) => void) {
  const digest = createHash('sha256');
  let count = 0;
  const buffer = Buffer.alloc(65_536);
  function visit(file: string, name: string): void {
    const before = physical(file);
    if (!before) return;
    count++;
    digest.update(JSON.stringify([name, before.dev.toString(), before.ino.toString(), before.mode.toString(),
      before.size.toString(), before.mtimeNs.toString(), before.ctimeNs.toString()]));
    if (before.isDirectory()) {
      for (const child of readdirSync(file).sort()) visit(join(file, child), join(name, child));
    } else if (!file.endsWith('-shm')) {
      // SHM is a volatile WAL index with mandatory byte range locks on Windows.
      const fd = openSync(file, 'r');
      try {
        let bytes = readSync(fd, buffer, 0, buffer.length, null);
        if (bytes >= 16 && buffer.subarray(0, 16).equals(Buffer.from('SQLite format 3\0'))) onSqlite(file);
        while (bytes) {
          digest.update(buffer.subarray(0, bytes));
          bytes = readSync(fd, buffer, 0, buffer.length, null);
        }
      } finally { closeSync(fd); }
    }
    const after = physical(file);
    if (!after || before.ino !== after.ino || before.ctimeNs !== after.ctimeNs || before.mtimeNs !== after.mtimeNs) fail('inventory_changed');
  }
  visit(path, '');
  buffer.fill(0);
  return { count, stamp: digest.digest('hex') };
}

function decodeGrants(data: Buffer, secret?: string): unknown {
  if (!secret || !/^[0-9a-f]{64}$/i.test(secret)) return fail('authorization_store_key_unavailable');
  const key = Buffer.from(secret, 'hex');
  try {
    const { iv, tag, data: ciphertext } = JSON.parse(data.toString('utf8')) as Record<string, string>;
    const cipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
    cipher.setAAD(Buffer.from('qap-qa-authorizations-v1'));
    cipher.setAuthTag(Buffer.from(tag, 'hex'));
    const clear = Buffer.concat([cipher.update(Buffer.from(ciphertext, 'hex')), cipher.final()]);
    try { return JSON.parse(clear.toString('utf8')) as unknown; } finally { clear.fill(0); }
  } finally { key.fill(0); }
}
function encodeGrants(records: unknown[], secret: string): object {
  const key = Buffer.from(secret, 'hex');
  const iv = randomBytes(12);
  const clear = Buffer.from(JSON.stringify(records));
  try {
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    cipher.setAAD(Buffer.from('qap-qa-authorizations-v1'));
    return { iv: iv.toString('hex'), data: Buffer.concat([cipher.update(clear), cipher.final()]).toString('hex'), tag: cipher.getAuthTag().toString('hex') };
  } finally { clear.fill(0); key.fill(0); }
}

function inventory(root: string, options: ResetOptions): Snapshot {
  const host = options.directory;
  // These staging files may hold records for multiple projects. Do not silently
  // ignore a registry interrupted before its atomic replacement.
  if (readdirSync(host).some(name => /^(?:[a-f0-9-]{36}(?:\.tmp)?\.json|(?:authorized-roots\.json|discovery-authorizations\.json|qa-session-authorizations\.enc)\.[a-f0-9-]+\.tmp)$/i.test(name))) {
    fail('authorization_registry_staging_present');
  }
  const targets: Target[] = [];
  const sqlite: string[] = [];
  const exclusive = (resource: string, path: string) => {
    const item = stamp(path, file => sqlite.push(file));
    targets.push({ summary: { resource, classification: 'exclusive', action: 'remove', count: item.count },
      stamp: item.stamp, remove: item.count ? () => { rmSync(path, { recursive: true, force: true }); } : undefined });
  };
  exclusive('.qa (perfiles, sesiones, cachés, logs, borradores y cierres locales)', join(root, '.qa'));
  const owned = join(host, workspaceStorageKey(root));
  const dbNames = ['knowledge.sqlite', 'knowledge.sqlite-wal', 'knowledge.sqlite-shm', 'knowledge.sqlite-journal'];
  if (physical(owned) && (!physical(owned)?.isDirectory() || readdirSync(owned).some(name => !dbNames.includes(name)))) {
    fail('unclassified_host_resources');
  }
  for (const name of dbNames) {
    if (physical(join(owned, name))?.isDirectory()) fail('unsafe_storage_path');
    exclusive('host/' + name, join(owned, name));
  }
  if (physical(owned)) targets.push({ summary: { resource: 'directorio Knowledge del proyecto', classification: 'exclusive', action: 'remove', count: 1 },
    stamp: String(physical(owned)?.ino), remove: () => rmdirSync(owned) });

  const registry = (resource: string, path: string | undefined, kind: 'roots' | 'discovery' | 'grants') => {
    const s = path && physical(path);
    let records: unknown[] = [];
    let digest = '';
    if (path && s) {
      if (!s.isFile() || s.size > 4_000_000n || dirname(path) !== host) fail('unsafe_registry');
      const raw = readFileSync(path);
      const parsed: unknown = kind === 'grants' ? decodeGrants(raw, options.key) : JSON.parse(raw.toString('utf8'));
      if (!Array.isArray(parsed)) return fail('invalid_authorization_registry');
      records = parsed;
      digest = hash(raw);
    }
    const kept = records.filter(record => {
      const owner: unknown = kind === 'roots' ? record : (record as { projectRoot?: unknown } | null)?.projectRoot;
      if (typeof owner !== 'string' || !isAbsolute(owner)) return fail('invalid_authorization_registry');
      if (within(join(root, '.qa'), owner)) return fail('nested_workspace_in_reset_scope');
      return !same(owner, root);
    });
    const count = records.length - kept.length;
    targets.push({ summary: { resource, classification: 'shared', action: 'remove_project_records', count },
      stamp: digest, remove: count && path ? () => {
        if (!physical(path) || hash(readFileSync(path)) !== digest) fail('inventory_changed');
        atomic(path, kind === 'grants' ? encodeGrants(kept, options.key!) : kept);
      } : undefined });
  };
  registry('raíces autorizadas', options.rootsPath, 'roots');
  registry('autorizaciones Discovery', options.discoveryPath, 'discovery');
  registry('autorizaciones QA cifradas', options.grantsPath, 'grants');
  for (const resource of ['Credential Vault global y clave del host', 'diagnósticos compartidos, copias externas y archivos fuera de .qa']) {
    targets.push({ summary: { resource, classification: 'external', action: 'preserve', count: 0 }, stamp: '' });
  }
  return { targets, sqlite, digest: hash(JSON.stringify([workspaceStorageKey(root), targets.map(t => [t.summary, t.stamp])])) };
}

function checkSqlite(path: string, exclusiveApp?: string): void {
  const db = new (requireSqlite().DatabaseSync)(path);
  try {
    db.exec('PRAGMA busy_timeout=0; PRAGMA locking_mode=EXCLUSIVE');
    // An open WAL connection in another process prevents switching modes.
    if (db.prepare('PRAGMA journal_mode=DELETE').get()?.journal_mode !== 'delete') fail('sqlite_busy');
    db.exec('BEGIN EXCLUSIVE');
    if (exclusiveApp && db.prepare('PRAGMA application_id').get()?.application_id !== 0x5141504b) fail('sqlite_ownership_ambiguous');
    if (exclusiveApp && db.prepare('SELECT application_id FROM knowledge_scopes WHERE application_id <> ? LIMIT 1').get(exclusiveApp)) {
      fail('sqlite_ownership_ambiguous');
    }
  } catch (error) {
    if (error instanceof ResetError) throw error;
    fail('sqlite_busy_or_unavailable');
  } finally { db.close(); }
}

export class ProjectReset {
  // Only one pending preview per server; a new preview supersedes the previous one.
  private pending?: ResetPreview;

  constructor(private readonly options: ResetOptions, private readonly authorize?: ResetAuthorizer) {}

  private root(candidate: string): string {
    return validateCandidateWorkspace(candidate, this.options.directory);
  }

  preview(candidate: string) {
    this.pending = undefined;
    let release: (() => void) | undefined;
    try {
      const project = this.root(candidate);
      release = acquireProjectOperation(this.options.directory);
      const snapshot = inventory(project, this.options);
      const preview = { project, reset_id: randomUUID(), inventory_digest: snapshot.digest,
        expires_at: new Date(Date.now() + TTL).toISOString(), inventory: snapshot.targets.map(t => t.summary) };
      this.pending = structuredClone(preview);
      return { status: 'preview' as const, ...preview };
    } catch (error) { return { status: 'blocked' as const, code: codeOf(error) }; }
    finally { release?.(); }
  }

  async confirm(candidate: string, id: string, signal: AbortSignal) {
    const blocked = (code: string) => ({ status: 'blocked' as const, code });
    const preview = this.pending;
    if (!preview || preview.reset_id !== id || !same(preview.project, candidate)) return blocked('reset_preview_required');
    this.pending = undefined;
    const remaining = () => Date.parse(preview.expires_at) - Date.now();
    if (remaining() <= 0) return blocked('reset_preview_expired');
    if (!this.authorize) return blocked('reset_authorization_unavailable');
    if (signal.aborted) return blocked('reset_authorization_cancelled');
    let release: (() => void) | undefined;
    try {
      const consent = await this.authorize(structuredClone(preview), AbortSignal.any([signal, AbortSignal.timeout(remaining())]))
        .catch(() => 'unavailable' as const);
      if (signal.aborted) return blocked('reset_authorization_cancelled');
      if (remaining() <= 0) return blocked('reset_preview_expired');
      if (consent !== 'approved') return blocked('reset_authorization_' + consent);
      const root = this.root(candidate);
      if (!same(root, preview.project)) return blocked('inventory_changed');
      release = acquireProjectOperation(this.options.directory);
      const snapshot = inventory(root, this.options);
      if (snapshot.digest !== preview.inventory_digest) return blocked('inventory_changed');
      if (remaining() <= 0) return blocked('reset_preview_expired');
      if (signal.aborted) return blocked('reset_authorization_cancelled');
      const host = this.options.directory;
      const dir = join(host, 'project-resets');
      directory(dir);
      const receipt = join(dir, id + '.receipt.json');
      const state = join(dir, workspaceStorageKey(root) + '.json');
      const audit = { id, workspace_id: workspaceStorageKey(root), inventory_digest: snapshot.digest,
        started_at: new Date().toISOString(), authorization: 'local_human', status: 'pending',
        removed: [] as Resource[], retained: snapshot.targets.filter(t => !t.remove).map(t => t.summary),
        pending: snapshot.targets.filter(t => t.remove).map(t => t.summary),
        failures: [] as { resource: string; code: string }[] };
      atomic(receipt, audit);
      let current = 'concurrency_preflight';
      let mutationStarted = false;
      try {
        // Reject active legacy locks and incomplete SQLite ownership before deleting anything.
        const lockDir = join(root, '.qa', 'cache', 'locks');
        if (physical(lockDir) && readdirSync(lockDir).some(name => name.endsWith('.lock'))) fail('project_storage_busy');
        const knowledge = join(host, workspaceStorageKey(root), 'knowledge.sqlite');
        for (const file of snapshot.sqlite) checkSqlite(file, same(file, knowledge) ? 'workspace-' + workspaceStorageKey(root).slice(0, 32) : undefined);
        if (stat(knowledge) && !snapshot.sqlite.includes(knowledge) && stat(knowledge)?.size !== 0n) fail('sqlite_ownership_ambiguous');
        atomic(state, { id, state: 'pending' });
        mutationStarted = true;
        for (const target of snapshot.targets) {
          if (!target.remove) continue;
          current = target.summary.resource;
          // SQLite may remove its own sidecars when closing the exclusive connection.
          target.remove();
          audit.removed.push(target.summary);
          audit.pending.shift();
          atomic(receipt, audit);
        }
        current = 'postcondition';
        if (inventory(root, this.options).targets.some(t => t.remove)) fail('reset_resources_remaining');
        audit.status = 'complete';
        atomic(receipt, audit);
        atomic(state, { id, state: 'complete' });
        return { status: 'success' as const, code: 'project_reset_complete', receipt_id: id, removed: audit.removed, retained: audit.retained };
      } catch (error) {
        audit.status = mutationStarted ? 'partial' : 'blocked';
        audit.failures.push({ resource: current, code: codeOf(error) });
        try { atomic(receipt, audit); } catch { audit.failures.push({ resource: 'receipt', code: 'receipt_write_failed' }); }
        return { status: mutationStarted ? 'partial' as const : 'blocked' as const, code: mutationStarted ? 'project_reset_incomplete' : codeOf(error),
          receipt_id: id, removed: audit.removed, pending: audit.pending, failures: audit.failures };
      }
    } catch (error) { return blocked(codeOf(error)); }
    finally { release?.(); }
  }
}
