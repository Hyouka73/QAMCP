import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import type { ExecutionResult, TestPlan } from '@qap/shared';
import { ensureConfinedDir, persistRuntimeEvidenceBundle, resolveConfinedArtifactPath } from './evidence-artifacts.js';
import type { PlaywrightRunner, PlaywrightRunnerOptions } from './runner.js';

const require = createRequire(import.meta.url);
export type EvidenceBundle = Parameters<typeof persistRuntimeEvidenceBundle>[0];

export interface ProvisionalMcpCaseLink {
  case_id: string;
  version?: number;
  requirement_id?: string | null;
  requirement_revision?: number;
  title?: string;
}

export interface ProvisionalMcpFinalization {
  executionId: string;
  attemptId?: string;
  moduleName: string;
  environment: string;
  projectId?: string;
  envId?: string;
  profileId?: string | null;
  cases: readonly ProvisionalMcpCaseLink[];
  trace?: {
    case_approval_digest?: string;
    case_eligibility_digest?: string;
    policy_digest?: string;
    plan_fingerprint?: string;
    requirements: unknown;
    cases: readonly { id: string; source_rule_id?: string }[];
  };
}

export interface ProvisionalExecution {
  operationId: string;
  projectRoot: string;
  /** Private directory containing the provisional files and manifest. */
  provisionalRoot: string;
  result: ExecutionResult;
  mcp?: ProvisionalMcpFinalization;
}

export class ProvisionalPublicationPostCommitError extends Error {
  readonly committed = true;
  readonly phase = 'post_commit' as const;
  readonly operationId: string;
  readonly runId: string;
  readonly executionId: string;
  readonly attemptId?: string;
  readonly executionResult: ExecutionResult;

  constructor(
    message: string,
    details: {
      operationId: string;
      runId: string;
      executionId: string;
      attemptId?: string;
      executionResult: ExecutionResult;
    },
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'ProvisionalPublicationPostCommitError';
    this.operationId = details.operationId;
    this.runId = details.runId;
    this.executionId = details.executionId;
    this.attemptId = details.attemptId;
    this.executionResult = details.executionResult;
  }
}

export function isPostCommitPublicationError(error: unknown): error is ProvisionalPublicationPostCommitError {
  return (
    error instanceof ProvisionalPublicationPostCommitError ||
    Boolean(
      error &&
        typeof error === 'object' &&
        (error as { committed?: unknown; phase?: unknown }).committed === true &&
        (error as { phase?: unknown }).phase === 'post_commit',
    )
  );
}

interface PendingPublicationMarker {
  operationId: string;
  runId: string;
  pid: number;
  executionId?: string;
  attemptId?: string;
  result?: ExecutionResult;
  mcp?: ProvisionalMcpFinalization;
  aborted?: boolean;
  postCommitError?: string;
}

export interface InspectablePendingPublication extends PendingPublicationMarker {
  committed: boolean;
}

/** Prepare an operation using the actual Runner; no project evidence is published. */
export async function prepareProvisionalExecution(
  runner: PlaywrightRunner, plan: TestPlan, options: PlaywrightRunnerOptions = {}, defaultProjectRoot?: string,
): Promise<ProvisionalExecution> {
  if (options.attemptId && (!/^[a-zA-Z0-9_-][a-zA-Z0-9._-]*$/.test(options.attemptId) || options.attemptId === '.' || options.attemptId === '..')) {
    throw new Error('Identificador de intento inválido para una operación provisional.');
  }
  const projectRoot = path.resolve(options.projectRoot ?? defaultProjectRoot ?? process.cwd());
  const provisionalRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'qap-provisional-'));
  fs.chmodSync(provisionalRoot, 0o700);
  const operationId = path.basename(provisionalRoot);
  let bundle: EvidenceBundle | undefined;
  try {
    const result = await runner.executeInternal(plan, { ...options, projectRoot }, {
      root: provisionalRoot, operationId, saveBundle: value => { bundle = value; },
    });
    if (!bundle && (result.artifacts || result.summary.passed > 0)) throw new Error('La ejecución no produjo un paquete de evidencias publicable.');
    const reference = { operationId, projectRoot, provisionalRoot, result };
    fs.writeFileSync(path.join(provisionalRoot, 'manifest.json'), JSON.stringify({ reference, bundle }), { mode: 0o600, flag: 'wx' });
    return reference;
  } catch (error) {
    fs.rmSync(provisionalRoot, { recursive: true, force: true });
    throw error;
  }
}

function readOperation(reference: ProvisionalExecution): { bundle?: EvidenceBundle; reference: ProvisionalExecution } {
  const root = path.resolve(reference.provisionalRoot);
  if (!/^qap-provisional-[a-zA-Z0-9]+$/.test(reference.operationId) ||
      root !== path.join(path.resolve(os.tmpdir()), reference.operationId) ||
      fs.lstatSync(root).isSymbolicLink()) throw new Error('Referencia provisional inválida.');
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8')) as { bundle?: EvidenceBundle; reference: ProvisionalExecution };
  if (manifest.reference.operationId !== reference.operationId || manifest.reference.provisionalRoot !== root ||
      manifest.reference.projectRoot !== reference.projectRoot || (manifest.bundle && manifest.bundle.projectRoot !== root)) {
    throw new Error('La operación provisional no coincide con su manifiesto.');
  }
  return manifest;
}

/** Recover a completed preparation after a process restart. */
export function loadProvisionalExecution(operationId: string): ProvisionalExecution {
  if (!/^qap-provisional-[a-zA-Z0-9]+$/.test(operationId)) throw new Error('Identificador provisional inválido.');
  const root = path.join(path.resolve(os.tmpdir()), operationId);
  if (fs.lstatSync(root).isSymbolicLink()) throw new Error('Directorio provisional inválido.');
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8')) as { reference: ProvisionalExecution };
  if (manifest.reference.operationId !== operationId || manifest.reference.provisionalRoot !== root) throw new Error('Manifiesto provisional inválido.');
  return readOperation(manifest.reference).reference;
}

/** Stage MCP finalization metadata into the provisional manifest before publishing. */
export function stageProvisionalMcpFinalization(
  reference: ProvisionalExecution,
  mcp: ProvisionalMcpFinalization,
): ProvisionalExecution {
  const manifest = readOperation(reference);
  const baseResult = reference.result ?? manifest.reference.result;
  const nextResult: ExecutionResult =
    mcp.attemptId && !baseResult.attempt_id
      ? { ...baseResult, attempt_id: mcp.attemptId }
      : baseResult;
  const nextReference: ProvisionalExecution = {
    ...manifest.reference,
    result: nextResult,
    mcp,
  };
  const manifestPath = path.join(manifest.reference.provisionalRoot, 'manifest.json');
  const tmpPath = `${manifestPath}.tmp-${Date.now()}`;
  fs.writeFileSync(tmpPath, JSON.stringify({ reference: nextReference, bundle: manifest.bundle }), { mode: 0o600 });
  fs.renameSync(tmpPath, manifestPath);
  return nextReference;
}

/** Publish a prepared operation. Existing run IDs and artifact directories are never overwritten. */
export function publishProvisionalExecution(
  reference: ProvisionalExecution,
  options?: { deferPendingCleanup?: boolean; mcp?: ProvisionalMcpFinalization },
): ExecutionResult {
  const manifest = readOperation(reference);
  const { bundle } = manifest;
  const mcp = options?.mcp ?? manifest.reference.mcp ?? reference.mcp;
  const attemptId = mcp?.attemptId ?? manifest.reference.result.attempt_id ?? undefined;
  const effectiveResult: ExecutionResult =
    attemptId && !manifest.reference.result.attempt_id
      ? { ...manifest.reference.result, attempt_id: attemptId }
      : manifest.reference.result;
  const executionId = mcp?.executionId ?? effectiveResult.execution_id;

  if (!bundle) {
    if (effectiveResult.artifacts || effectiveResult.summary.passed > 0) throw new Error('Paquete de evidencias ausente.');
    if (!options?.deferPendingCleanup) {
      fs.rmSync(reference.provisionalRoot, { recursive: true, force: true });
    }
    return effectiveResult;
  }
  const root = reference.projectRoot;
  const artifacts = effectiveResult.artifacts;
  for (const rel of [artifacts?.video_path, artifacts?.trace_zip_path, ...(artifacts?.screenshots ?? [])]) {
    if (rel && !fs.statSync(resolveConfinedArtifactPath(reference.provisionalRoot, rel)).isFile()) {
      throw new Error(`Falta un artefacto provisional: ${rel}`);
    }
  }
  const runRel = `.qa/runtime/runs/${bundle.runId}`;
  const shotsRel = `.qa/reports/screenshots/${reference.operationId}`;
  const sourceRun = resolveConfinedArtifactPath(reference.provisionalRoot, runRel);
  const sourceShots = resolveConfinedArtifactPath(reference.provisionalRoot, shotsRel);
  const targetRun = resolveConfinedArtifactPath(root, runRel);
  const targetShots = resolveConfinedArtifactPath(root, shotsRel);
  if (fs.existsSync(targetRun) || fs.existsSync(targetShots)) throw new Error('Ya existen artefactos para esta operación.');
  const dbPath = resolveConfinedArtifactPath(root, '.qa/runtime/qap.sqlite');
  if (fs.existsSync(dbPath)) {
    const sqlite = require('node:sqlite') as typeof import('node:sqlite');
    const db = new sqlite.DatabaseSync(dbPath, { readOnly: true });
    try {
      const table = db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='runs'").get();
      if (table && db.prepare('SELECT 1 FROM runs WHERE run_id = ?').get(bundle.runId)) throw new Error('El identificador de ejecución ya existe.');
    } finally { db.close(); }
  }
  let runCopied = false;
  let shotsCopied = false;
  let committedInSqlite = false;
  const markerPath = path.join(targetRun, '.qap-publication-pending');
  const pendingPayload: PendingPublicationMarker = {
    operationId: reference.operationId,
    runId: bundle.runId,
    pid: process.pid,
    executionId,
    ...(attemptId ? { attemptId } : {}),
    result: effectiveResult,
    ...(mcp ? { mcp } : {}),
  };
  try {
    ensureConfinedDir(root, '.qa/runtime/runs');
    fs.mkdirSync(targetRun);
    runCopied = true;
    // Written before any public artifact. Recovery only touches directories bearing this marker.
    fs.writeFileSync(markerPath, JSON.stringify(pendingPayload), { flag: 'wx', mode: 0o600, flush: true });
    if (fs.existsSync(sourceRun)) fs.cpSync(sourceRun, targetRun, { recursive: true, errorOnExist: true, force: false });
    if (fs.existsSync(sourceShots)) {
      ensureConfinedDir(root, '.qa/reports/screenshots');
      fs.mkdirSync(targetShots);
      shotsCopied = true;
      fs.cpSync(sourceShots, targetShots, { recursive: true, errorOnExist: true, force: false });
    }
    const persisted = persistRuntimeEvidenceBundle({ ...bundle, projectRoot: root, insertOnly: true });
    if (persisted.committed) committedInSqlite = true;
    if (persisted.error) throw new Error(persisted.error);
    committedInSqlite = true;
    if (shotsCopied) fs.writeFileSync(path.join(targetShots, '.qap-committed'), '1', { mode: 0o600 });
    if (!options?.deferPendingCleanup) {
      fs.rmSync(markerPath, { force: true });
    }
  } catch (error) {
    const committed = committedInSqlite || hasCommittedRun(root, bundle.runId);
    if (!committed) {
      if (runCopied) fs.rmSync(targetRun, { recursive: true, force: true });
      if (shotsCopied) fs.rmSync(targetShots, { recursive: true, force: true });
      throw error;
    }
    const msg = error instanceof Error ? error.message : String(error);
    try {
      if (fs.existsSync(targetRun)) {
        fs.writeFileSync(
          markerPath,
          JSON.stringify({ ...pendingPayload, aborted: true, postCommitError: msg }),
          { mode: 0o600, flush: true },
        );
      }
    } catch {
      // Best-effort post-commit pending state update
    }
    throw new ProvisionalPublicationPostCommitError(
      msg,
      {
        operationId: reference.operationId,
        runId: bundle.runId,
        executionId,
        attemptId,
        executionResult: effectiveResult,
      },
      { cause: error },
    );
  }
  // Publication succeeded; a cleanup failure must not report the committed run as failed.
  if (!options?.deferPendingCleanup) {
    try { fs.rmSync(reference.provisionalRoot, { recursive: true, force: true }); } catch { /* discard later */ }
  }
  return effectiveResult;
}

/** Complete a deferred publication once MCP finalization has succeeded. */
export function completeProvisionalPublication(reference: ProvisionalExecution, runId?: string): void {
  const targetRunId = runId ?? reference.result.attempt_id ?? reference.result.execution_id;
  if (
    targetRunId &&
    /^[a-zA-Z0-9_-][a-zA-Z0-9._-]*$/.test(targetRunId) &&
    targetRunId !== '..'
  ) {
    try {
      const marker = resolveConfinedArtifactPath(
        reference.projectRoot,
        `.qa/runtime/runs/${targetRunId}/.qap-publication-pending`,
      );
      if (fs.existsSync(marker)) {
        fs.rmSync(marker, { force: true });
      }
    } catch {
      // Best-effort marker cleanup
    }
  }
  try {
    if (fs.existsSync(reference.provisionalRoot)) {
      fs.rmSync(reference.provisionalRoot, { recursive: true, force: true });
    }
  } catch {
    // Best-effort provisional cleanup
  }
}

/** Mark an in-flight post-commit publication as interrupted so recovery can finalize it. */
export function markProvisionalPublicationInterrupted(
  projectRoot: string,
  runId: string,
  reason?: string,
): void {
  if (!runId || !/^[a-zA-Z0-9_-][a-zA-Z0-9._-]*$/.test(runId) || runId === '..') return;
  try {
    const marker = resolveConfinedArtifactPath(
      path.resolve(projectRoot),
      `.qa/runtime/runs/${runId}/.qap-publication-pending`,
    );
    if (!fs.existsSync(marker) || fs.lstatSync(marker).isSymbolicLink()) return;
    const parsed = JSON.parse(fs.readFileSync(marker, 'utf8')) as PendingPublicationMarker;
    fs.writeFileSync(
      marker,
      JSON.stringify({
        ...parsed,
        aborted: true,
        ...(reason ? { postCommitError: reason } : {}),
      }),
      { mode: 0o600, flush: true },
    );
  } catch {
    // Best-effort interruption mark
  }
}

/** Remove only the explicitly identified provisional operation. */
export function discardProvisionalExecution(reference: ProvisionalExecution): void {
  readOperation(reference);
  fs.rmSync(reference.provisionalRoot, { recursive: true, force: true });
}

export function hasCommittedRun(root: string, runId: string): boolean {
  const dbPath = resolveConfinedArtifactPath(root, '.qa/runtime/qap.sqlite');
  if (!fs.existsSync(dbPath)) return false;
  const sqlite = require('node:sqlite') as typeof import('node:sqlite');
  const db = new sqlite.DatabaseSync(dbPath, { readOnly: true });
  try {
    return !!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='runs'").get() &&
      !!db.prepare('SELECT 1 FROM runs WHERE run_id = ?').get(runId);
  } finally { db.close(); }
}

function isPublisherProcessDead(info: PendingPublicationMarker): boolean {
  if (info.aborted === true) return true;
  try {
    process.kill(info.pid, 0);
    return false;
  } catch (error) {
    return (error as { code?: string } | null)?.code === 'ESRCH';
  }
}

function writeExclusivePrivateJson(absPath: string, data: unknown): void {
  try {
    fs.writeFileSync(absPath, JSON.stringify(data, null, 2), { flag: 'wx', encoding: 'utf8', mode: 0o600 });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
  }
}

function repairExecutionFilesFromMarker(root: string, info: PendingPublicationMarker): void {
  if (!info.result || !info.executionId) return;
  if (!info.mcp && !fs.existsSync(path.join(root, '.qa', 'executions'))) return;
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(info.executionId)) return;

  const attemptId = info.attemptId ?? info.mcp?.attemptId ?? info.result.attempt_id ?? undefined;
  const executionToPersist: ExecutionResult =
    attemptId && !info.result.attempt_id ? { ...info.result, attempt_id: attemptId } : info.result;

  ensureConfinedDir(root, '.qa/executions');
  const execJsonAbs = resolveConfinedArtifactPath(root, `.qa/executions/${info.executionId}.json`);
  if (!fs.existsSync(execJsonAbs)) {
    writeExclusivePrivateJson(execJsonAbs, executionToPersist);
  }

  if (info.mcp?.trace) {
    const traceAbs = resolveConfinedArtifactPath(root, `.qa/executions/${info.executionId}.trace.json`);
    if (!fs.existsSync(traceAbs)) {
      writeExclusivePrivateJson(traceAbs, {
        execution_id: info.executionId,
        ...(attemptId ? { attempt_id: attemptId } : {}),
        ...info.mcp.trace,
        ...(executionToPersist.artifacts ? { artifacts: executionToPersist.artifacts } : {}),
        ...(executionToPersist.timeline ? { timeline: executionToPersist.timeline } : {}),
      });
    }
  }

  const moduleName = executionToPersist.module;
  if (
    moduleName &&
    typeof moduleName === 'string' &&
    moduleName.trim().length > 0 &&
    !/[\\/:]/.test(moduleName) &&
    moduleName !== '.' &&
    moduleName !== '..'
  ) {
    ensureConfinedDir(root, '.qa/cache/history');
    const historyAbs = resolveConfinedArtifactPath(root, `.qa/cache/history/${moduleName}.jsonl`);
    let alreadyRecorded = false;
    if (fs.existsSync(historyAbs)) {
      try {
        const lines = fs.readFileSync(historyAbs, 'utf8').split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const parsed = JSON.parse(trimmed) as { execution_id?: unknown };
            if (parsed.execution_id === info.executionId) {
              alreadyRecorded = true;
              break;
            }
          } catch {
            // Ignore malformed individual lines
          }
        }
      } catch {
        // Ignore unreadable history
      }
    }
    if (!alreadyRecorded) {
      const historyEntry = {
        execution_id: info.executionId,
        timestamp: executionToPersist.finished_at,
        result: executionToPersist.result,
        summary: executionToPersist.summary,
      };
      fs.appendFileSync(historyAbs, `${JSON.stringify(historyEntry)}\n`, { encoding: 'utf8', mode: 0o600 });
    }
  }
}

/** Inspect pending publications whose publisher is dead/aborted before recovery removes markers. */
export function inspectRecoverableProvisionalPublications(projectRoot: string): InspectablePendingPublication[] {
  const root = path.resolve(projectRoot);
  const runsDir = resolveConfinedArtifactPath(root, '.qa/runtime/runs');
  const items: InspectablePendingPublication[] = [];
  if (!fs.existsSync(runsDir)) return items;
  for (const entry of fs.readdirSync(runsDir, { withFileTypes: true })) {
    const quarantine = entry.name.startsWith('.qap-recovery-qap-provisional-');
    if (!entry.isDirectory() || (!quarantine && !/^[a-zA-Z0-9_-][a-zA-Z0-9._-]*$/.test(entry.name)) || entry.name === '..') continue;
    const runDir = resolveConfinedArtifactPath(root, `.qa/runtime/runs/${entry.name}`);
    const marker = path.join(runDir, '.qap-publication-pending');
    if (!fs.existsSync(marker) || fs.lstatSync(marker).isSymbolicLink()) continue;
    let info: PendingPublicationMarker;
    try { info = JSON.parse(fs.readFileSync(marker, 'utf8')) as PendingPublicationMarker; } catch { continue; }
    if (!/^qap-provisional-[a-zA-Z0-9]+$/.test(info.operationId) || !Number.isSafeInteger(info.pid) || info.pid <= 0 ||
        (quarantine ? entry.name !== `.qap-recovery-${info.operationId}` : info.runId !== entry.name)) continue;
    if (!isPublisherProcessDead(info)) continue;
    items.push({
      ...info,
      committed: !quarantine && hasCommittedRun(root, info.runId),
    });
  }
  return items;
}

/** Recover abandoned provisional publications; live publishers are left alone. */
export function recoverProvisionalPublications(projectRoot: string): { removed: number; confirmed: number } {
  const root = path.resolve(projectRoot);
  const runsDir = resolveConfinedArtifactPath(root, '.qa/runtime/runs');
  const result = { removed: 0, confirmed: 0 };
  if (!fs.existsSync(runsDir)) return result;
  for (const entry of fs.readdirSync(runsDir, { withFileTypes: true })) {
    const quarantine = entry.name.startsWith('.qap-recovery-qap-provisional-');
    if (!entry.isDirectory() || (!quarantine && !/^[a-zA-Z0-9_-][a-zA-Z0-9._-]*$/.test(entry.name)) || entry.name === '..') continue;
    const runDir = resolveConfinedArtifactPath(root, `.qa/runtime/runs/${entry.name}`);
    const marker = path.join(runDir, '.qap-publication-pending');
    if (!fs.existsSync(marker) || fs.lstatSync(marker).isSymbolicLink()) continue;
    let info: PendingPublicationMarker;
    try { info = JSON.parse(fs.readFileSync(marker, 'utf8')) as PendingPublicationMarker; } catch { continue; }
    if (!/^qap-provisional-[a-zA-Z0-9]+$/.test(info.operationId) || !Number.isSafeInteger(info.pid) || info.pid <= 0 ||
        (quarantine ? entry.name !== `.qap-recovery-${info.operationId}` : info.runId !== entry.name)) continue;
    if (!isPublisherProcessDead(info)) continue;
    if (!quarantine && hasCommittedRun(root, info.runId)) {
      fs.writeFileSync(path.join(runDir, '.qap-committed'), '1', { mode: 0o600 });
      const shots = resolveConfinedArtifactPath(root, `.qa/reports/screenshots/${info.operationId}`);
      if (fs.existsSync(shots)) fs.writeFileSync(path.join(shots, '.qap-committed'), '1', { mode: 0o600 });
      try { repairExecutionFilesFromMarker(root, info); } catch { /* best-effort repair */ }
      if (info.mcp) {
        const stagedDir = path.join(path.resolve(os.tmpdir()), info.operationId);
        try {
          if (fs.existsSync(stagedDir) && !fs.lstatSync(stagedDir).isSymbolicLink()) {
            fs.rmSync(stagedDir, { recursive: true, force: true });
          }
        } catch {
          // Best-effort cleanup of staged temp dir
        }
      }
      fs.rmSync(marker, { force: true });
      result.confirmed++;
    } else {
      // Atomically claim the old directory before deleting. A concurrent new run with
      // the same run ID must never be removed by this recovery.
      const claimed = resolveConfinedArtifactPath(root, `.qa/runtime/runs/.qap-recovery-${info.operationId}`);
      if (!quarantine) {
        if (fs.existsSync(claimed)) continue;
        try { fs.renameSync(runDir, claimed); } catch (error) {
          if (['ENOENT', 'EEXIST', 'EPERM'].includes((error as NodeJS.ErrnoException).code ?? '')) continue;
          throw error;
        }
      }
      const shots = resolveConfinedArtifactPath(root, `.qa/reports/screenshots/${info.operationId}`);
      fs.rmSync(shots, { recursive: true, force: true });
      fs.rmSync(claimed, { recursive: true, force: true });
      result.removed++;
    }
  }
  return result;
}
