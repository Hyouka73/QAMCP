import { existsSync, lstatSync, realpathSync, readdirSync, readFileSync, writeFileSync, mkdirSync, renameSync, unlinkSync, openSync, closeSync, fsyncSync } from 'node:fs';
import { resolve, relative, isAbsolute, join, dirname, sep } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';

import YAML from 'yaml';
import { SchemaValidator, type ProjectContext, type ContextSource, type BusinessRole, type CriticalFlow, type SourceOfTruth } from '@qap/shared';
import type { IKnowledgeStore, KnowledgeKind } from '@qap/engine';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { TOOLS } from '../tool-catalog.js';
import { McpToolError } from '../dispatcher.js';

/** Host-owned, already-open store. No filename discovery, implicit open or close. */
export interface ProjectKnowledgeBinding {
  readonly projectRoot: string;
  readonly applicationId: string;
  readonly environmentId: string;
  readonly store: IKnowledgeStore;
}
export interface StateDependencies {
  /** Defaults to the server's cwd; explicit roots authorize additional projects. */
  readonly projectRoots?: readonly string[];
  readonly knowledgeBindings?: readonly ProjectKnowledgeBinding[];
}
export class StateOperationError extends Error {
  constructor(readonly code: 'context_locked' | 'legacy_recovery_required' | 'legacy_conflict') { super(code); }
}
export interface ContextArguments {
  targetPath?: string;
  objective?: string;
  objective_source?: ContextSource;
  source?: ContextSource;
  roles?: Array<BusinessRole | string> | string;
  critical_flows?: Array<CriticalFlow | string> | string;
  source_of_truth?: SourceOfTruth | string;
  base_url?: string;
  environments?: string;
  confirmar_resumen?: string;
  accion?: string;
  corregir?: string[] | string;
  campos?: string[] | string;
}
export interface LegacyEnvironment {
  [key: string]: unknown;
  _version?: string;
  default?: string;
  environments: Record<string, { url?: string; browser_mode?: string }>;
}
export const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
export function result(value: unknown, isError = false): CallToolResult {
  return { isError, content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] };
}
export function definition(name: string) {
  const tool = TOOLS.find(item => item.name === name);
  if (!tool?.description) throw new Error('Missing state tool contract.');
  return structuredClone({ ...tool, description: tool.description });
}
export function validateBase(args: unknown, keys: string[]): boolean {
  if (args === undefined) return true;
  if (!isObject(args) || Object.keys(args).some(key => !keys.includes(key))) return false;
  return args.targetPath === undefined || (typeof args.targetPath === 'string' &&
    args.targetPath.length > 0 && args.targetPath.length <= 4096 && isAbsolute(args.targetPath) && ![...args.targetPath].some(c => c.charCodeAt(0) < 32));
}
const oneOf = (value: unknown, choices: string[]) => typeof value === 'string' && choices.includes(value);
const source = (value: unknown) => value === undefined || (typeof value === 'string' && ['user', 'prd', 'inferred'].includes(value));
const text = (value: unknown, max = 4000) => typeof value === 'string' && value.length <= max && !value.includes(String.fromCharCode(0));
function safeUrl(value: unknown): boolean {
  if (!text(value, 2048)) return false;
  try {
    const url = new URL(value as string);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password && !url.search && !url.hash;
  } catch { return false; }
}
export function validateContextArguments(args: unknown): boolean {
  const keys = ['targetPath', 'objective', 'objective_source', 'source', 'roles', 'critical_flows', 'source_of_truth', 'base_url', 'environments', 'confirmar_resumen', 'accion', 'corregir', 'campos', 'framework', 'app_type', 'project_name', 'auth'];
  if (!validateBase(args, keys)) return false;
  if (args === undefined) return true;
  if (!isObject(args)) return false;
  for (const key of ['framework', 'app_type', 'project_name']) if (args[key] !== undefined && !text(args[key], 100)) return false;
  if (args.auth !== undefined && (!isObject(args.auth) || Object.keys(args.auth).some(k => !['has_auth', 'notes'].includes(k)) || (args.auth.has_auth !== undefined && typeof args.auth.has_auth !== 'boolean') || (args.auth.notes !== undefined && !text(args.auth.notes, 1000)))) return false;
  if (!source(args.source) || !source(args.objective_source)) return false;
  if (args.objective !== undefined && !text(args.objective)) return false;
  for (const key of ['base_url', 'environments']) if (args[key] !== undefined && !safeUrl(args[key])) return false;
  if (args.confirmar_resumen !== undefined && !oneOf(args.confirmar_resumen, ['confirmo_todo', 'corregir', 'definir_url'])) return false;
  if (args.accion !== undefined && !oneOf(args.accion, ['confirmar_resumen', 'corregir'])) return false;
  for (const key of ['corregir', 'campos']) {
    if (args[key] === undefined) continue;
    const values: unknown[] = Array.isArray(args[key]) ? args[key] : [args[key]];
    if (values.length > 4 || values.some(item => typeof item !== 'string' || !['objective', 'roles', 'critical_flows', 'base_url'].includes(item))) return false;
  }
  for (const key of ['roles', 'critical_flows']) {
    const items = args[key];
    if (items === undefined) continue;
    if (typeof items === 'string') {
      const names = items.split(',').map(name => name.trim());
      if (!text(items, 4000) || names.length > 100 || names.some(name => !name || name.length > 100)) return false;
      continue;
    }
    if (!Array.isArray(items) || items.length > 100) return false;
    for (const item of items as unknown[]) {
      if (typeof item === 'string') { if (!text(item, 100) || !item.trim()) return false; continue; }
      if (!isObject(item) || !text(item.name, 100) || !String(item.name).trim() || !source(item.source)) return false;
      if (Object.keys(item).some(k => !['name', 'description', 'source', ...(key === 'critical_flows' ? ['priority', 'path'] : [])].includes(k))) return false;
      if (item.description !== undefined && !text(item.description, 2000)) return false;
      if (item.path !== undefined && !text(item.path, 2048)) return false;
      if (item.priority !== undefined && !oneOf(item.priority, ['high', 'medium', 'low'])) return false;
    }
  }
  const sot = args.source_of_truth;
  if (sot !== undefined) {
    if (typeof sot === 'string') { if (!text(sot, 1024)) return false; }
    else if (!isObject(sot) || Object.keys(sot).some(k => !['type', 'ref', 'notes', 'declared', 'source'].includes(k)) ||
      (sot.type !== undefined && !oneOf(sot.type, ['prd', 'readme', 'notes', 'none'])) || !source(sot.source) ||
      (sot.declared !== undefined && typeof sot.declared !== 'boolean') ||
      (sot.ref !== undefined && !text(sot.ref, 1024)) || (sot.notes !== undefined && !text(sot.notes, 2000))) return false;
    const ref = typeof sot === 'string' ? sot : sot.ref;
    if (typeof ref === 'string' && (isAbsolute(ref) || ref.split(/[\\/]/).includes('..') || /^[a-z]+:/i.test(ref))) return false;
  }
  return JSON.stringify(args).length <= 64_000;
}
function contained(root: string, path: string): boolean {
  const rel = relative(root, path);
  return !isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${sep}`);
}
/** Deny links even within scope: ownership of their targets is not implied. */
function noLinks(root: string, path: string): void {
  if (!contained(root, path)) throw new McpToolError('invalid_arguments');
  let current = root;
  for (const part of relative(root, path).split(sep).filter(Boolean)) {
    current = join(current, part);
    if (existsSync(current) && (lstatSync(current).isSymbolicLink() || !contained(root, realpathSync(current)))) throw new McpToolError('invalid_arguments');
  }
}
export function projectRoot(raw: unknown, dependencies: StateDependencies, write: boolean): string {
  const args = (raw ?? {}) as { targetPath?: string };
  const requested = resolve(args.targetPath ?? process.cwd());
  const root = realpathSync(requested);
  // Reject a target reached through a junction/symlink, including a parent link.
  const compare = (path: string) => process.platform === 'win32' ? path.toLowerCase() : path;
  if (compare(resolve(root)) !== compare(requested)) throw new McpToolError('invalid_arguments');
  if (!lstatSync(root).isDirectory()) throw new McpToolError('invalid_arguments');
  const roots = dependencies.projectRoots ?? [process.cwd()];
  if (write && !roots.some(allowed => contained(realpathSync(allowed), root))) throw new McpToolError('invalid_arguments');
  const qa = join(root, '.qa');
  noLinks(root, qa);
  // Legacy readers/writers follow nested paths; reject their link surface up front.
  let count = 0;
  const walk = (dir: string) => {
    if (!existsSync(dir)) return;
    for (const item of readdirSync(dir, { withFileTypes: true })) {
      if (++count > 20_000) throw new McpToolError('execution_failed');
      const path = join(dir, item.name);
      noLinks(root, path);
      if (item.isDirectory()) walk(path);
      else if (write && lstatSync(path).nlink > 1) throw new McpToolError('invalid_arguments');
    }
  };
  walk(qa);
  return root;
}
export function safeDocument(root: string, ref: string): string {
  const path = resolve(root, ref);
  noLinks(root, path);
  if (!lstatSync(path).isFile() || lstatSync(path).size > 2_000_000) throw new McpToolError('invalid_arguments');
  return path;
}
export function assertProjectSegment(value: string): void {
  if (typeof value !== 'string' || !value || value.length > 128 || value === '.' || value === '..' ||
    /[\\/:]/.test(value) || [...value].some(c => c.charCodeAt(0) < 32)) throw new McpToolError('execution_failed');
}
function yaml(path: string): unknown {
  if (lstatSync(path).size > 1_000_000) throw new McpToolError('execution_failed');
  return YAML.parse(readFileSync(path, 'utf8'), { maxAliasCount: 50 }) as unknown;
}
export function readContext(path: string): ProjectContext | null {
  const value = yaml(path);
  if (!new SchemaValidator().validateProjectContext(value).valid) throw new McpToolError('execution_failed');
  return value as ProjectContext;
}
export function readEnvironment(path: string): LegacyEnvironment {
  const value = yaml(path);
  if (!isObject(value) || !isObject(value.environments)) throw new McpToolError('execution_failed');
  for (const env of Object.values(value.environments)) if (!isObject(env) || (env.url !== undefined && typeof env.url !== 'string')) throw new McpToolError('execution_failed');
  return value as unknown as LegacyEnvironment;
}
export function readCorrections(path: string): { pending: string[]; completed: string[] } {
  const value: unknown = JSON.parse(readFileSync(path, 'utf8'));
  if (!isObject(value) || !Array.isArray(value.pending) || !Array.isArray(value.completed) ||
    [...value.pending as unknown[], ...value.completed as unknown[]].some(v => !oneOf(v, ['objective', 'roles', 'critical_flows', 'base_url']))) throw new McpToolError('execution_failed');
  return value as { pending: string[]; completed: string[] };
}
function binding(root: string, deps: StateDependencies): ProjectKnowledgeBinding | undefined {
  const matches = (deps.knowledgeBindings ?? []).filter(item => realpathSync(item.projectRoot) === root);
  if (matches.length > 1) throw new Error('Ambiguous binding.');
  const found = matches[0];
  if (found && (!/^[A-Za-z0-9_.:-]{1,128}$/.test(found.applicationId) || !/^[A-Za-z0-9_.:-]{1,128}$/.test(found.environmentId) ||
    (deps.knowledgeBindings ?? []).some(item => item.applicationId === found.applicationId && realpathSync(item.projectRoot) !== root))) throw new Error('Invalid binding.');
  return found;
}
export async function knowledgeStatus(root: string, deps: StateDependencies) {
  try {
    const bound = binding(root, deps);
    if (!bound) return { state: 'unbound' as const };
    const { store, applicationId, environmentId } = bound;
    if (store.contract_version !== 1) return { state: 'incompatible' as const };
    const app = await store.get(applicationId, 'application', applicationId);
    const env = await store.get(applicationId, 'environment', environmentId);
    if (!app || !env || app.entity.application_id !== applicationId || env.entity.application_id !== applicationId) return { state: 'incompatible' as const };
    const counts: Record<string, { available: number | null; complete: boolean }> = {};
    let partial = false;
    for (const kind of ['module', 'observation', 'inference', 'evidence'] as const satisfies readonly KnowledgeKind[]) {
      try {
        const page = await store.query(applicationId, kind, { limit: 100 });
        counts[kind] = { available: page.items.length, complete: !page.next_cursor };
        if (page.next_cursor) partial = true;
      } catch { counts[kind] = { available: null, complete: false }; partial = true; }
    }
    return { state: partial ? 'partial' as const : 'available' as const, application_id: applicationId, environment_id: environmentId, application_revision: app.revision,
      environment_revision: env.revision, counts, coverage: 'partial', consistency: 'per_operation_not_snapshot', context_present: true };
  } catch { return { state: 'unavailable' as const }; }
}
export async function contextKnowledge(root: string, args: ContextArguments, deps: StateDependencies) {
  const status = await knowledgeStatus(root, deps);
  if (status.state !== 'available' && status.state !== 'partial') return status;
  try {
    const bound = binding(root, deps)!;
    const env = await bound.store.get(bound.applicationId, 'environment', bound.environmentId);
    const url = args.base_url ?? args.environments;
    if (!env || (url !== undefined && url !== env.entity.base_url)) return { state: 'incompatible' as const };
    const contextPath = join(root, '.qa', 'project', 'context.yaml');
    const legacy = existsSync(contextPath) ? readContext(contextPath) : null;
    if (legacy?.base_url && legacy.base_url !== env.entity.base_url) return { state: 'incompatible' as const };
    return { ...status, strategy: 'legacy_only_no_canonical_projection' };
  } catch { return { state: 'unavailable' as const }; }
}

/** Stage before validation, serialize cooperative writers, journal before publishing.
 * Multi-file publication is recoverable, not atomic. Never hides partial failure. */
export class ContextFiles {
  state: 'staged' | 'committed' | 'partial' = 'staged';
  private readonly changes = new Map<string, string | null>();
  private readonly originals = new Map<string, string | null>();
  private readonly lock: string;
  private readonly descriptor: number;
  constructor(private readonly root: string, private readonly signal: AbortSignal) {
    this.lock = join(root, '.qa', 'project', 'context-update.lock');
    noLinks(root, this.lock);
    mkdirSync(dirname(this.lock), { recursive: true });
    try { this.descriptor = openSync(this.lock, 'wx'); }
    catch { if (existsSync(this.lock)) throw new StateOperationError('context_locked'); throw new Error('Context unavailable.'); }
    try {
      for (const name of ['project/context.yaml', 'project/environments.yaml', 'cache/onboarding_corrections.json']) {
        const path = join(root, '.qa', name);
        noLinks(root, path);
        if (existsSync(path) && lstatSync(path).size > 1_000_000) throw new Error('Legacy context too large.');
        this.originals.set(path, existsSync(path) ? readFileSync(path, 'utf8') : null);
      }
      const history = join(root, '.qa', 'project', 'context-history');
      noLinks(root, history);
      if (existsSync(history) && readdirSync(history).some(name => name.endsWith('.json') && !existsSync(join(history, name + '.committed')))) throw new StateOperationError('legacy_recovery_required');
    } catch (error) { this.close(); throw error; }
  }
  write(path: string, value: string, _encoding: string): void { void _encoding; this.stage(path, value); }
  remove(path: string, _options: { force: boolean }): void { void _options; this.stage(path, null); }
  private stage(path: string, value: string | null): void {
    const allowed = ['project/context.yaml', 'project/environments.yaml', 'cache/onboarding_corrections.json'].map(p => join(this.root, '.qa', p));
    if (!allowed.includes(path)) throw new Error('Unowned file.');
    noLinks(this.root, path);
    if (!this.originals.has(path)) this.originals.set(path, existsSync(path) ? readFileSync(path, 'utf8') : null);
    if (this.originals.get(path) !== value) this.changes.set(path, value);
  }
  flush(): void {
    if (this.signal.aborted) throw new McpToolError('cancelled');
    for (const [path, before] of this.originals) {
      noLinks(this.root, path);
      const current = existsSync(path) ? readFileSync(path, 'utf8') : null;
      if (current !== before) throw new StateOperationError('legacy_conflict');
    }
    if (!this.changes.size) { this.state = 'committed'; return; }
    const history = join(this.root, '.qa', 'project', 'context-history');
    noLinks(this.root, history);
    mkdirSync(history, { recursive: true });
    // Recovery journal stays in the same legacy trust domain; never copied to Knowledge.
    const journal = join(history, `${randomUUID()}.json`);
    this.durableWrite(journal, JSON.stringify({ state: 'prepared', entries: [...this.changes].map(([path, after]) => ({ path: relative(this.root, path), before: this.originals.get(path), after, before_hash: createHash('sha256').update(this.originals.get(path) ?? '').digest('hex') })) }));
    try {
      for (const [path, value] of this.changes) {
        if (this.signal.aborted) throw new McpToolError('cancelled');
        noLinks(this.root, path);
        if (value === null) { if (existsSync(path)) unlinkSync(path); }
        else {
          mkdirSync(dirname(path), { recursive: true });
          const temporary = `${path}.${randomUUID()}.tmp`;
          try { this.durableWrite(temporary, value); renameSync(temporary, path); }
          finally { if (existsSync(temporary)) unlinkSync(temporary); }
        }
      }
      this.state = 'committed';
      // Journal is immutable; completion is a separate marker.
      this.durableWrite(`${journal}.committed`, '');
    } catch { this.state = 'partial'; throw new Error('Legacy publication incomplete.'); }
  }
  private durableWrite(path: string, value: string): void {
    const descriptor = openSync(path, 'wx', 0o600);
    try { writeFileSync(descriptor, value); fsyncSync(descriptor); }
    finally { closeSync(descriptor); }
  }
  close(): void { closeSync(this.descriptor); unlinkSync(this.lock); }
}
