import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, realpathSync } from 'node:fs';
import { appendFile, mkdir, readFile, readdir } from 'node:fs/promises';
import { dirname, join, parse } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const PROCESS_STARTED_AT = new Date().toISOString();

type BuildMetadata = {
  schemaVersion: number;
  packageVersion: string;
  repositoryHead: string | null;
  buildFingerprint: string;
  bundleSha256: string;
  builtAt: string;
};

export type VersionDiagnostic = {
  status: 'current' | 'stale_process' | 'build_outdated' | 'unknown' | 'incompatible';
  action: 'continue' | 'recompile' | 'reconnect_mcp' | 'review_configuration';
  message: string;
  active: { sha: string | null; fingerprint: string | null; version: string; pid: number; startedAt: string; serverPath: string };
  disk: { sha: string | null; fingerprint: string | null; version: string | null; bundleSha256: string | null; metadataPath: string };
  repository: { root: string | null; head: string | null; comparison: 'matched' | 'outdated' | 'unavailable' };
  logPath: string;
};

type DiagnosticOptions = {
  serverPath?: string;
  metadataPath?: string;
  logPath?: string;
  pid?: number;
  startedAt?: string;
  activeSha?: string | null;
  activeFingerprint?: string | null;
  version?: string;
  readHead?: (root: string) => string | null;
  log?: boolean;
};

const isMetadata = (value: unknown): value is BuildMetadata => {
  if (!value || typeof value !== 'object') return false;
  const meta = value as Partial<BuildMetadata>;
  return typeof meta.schemaVersion === 'number'
    && typeof meta.packageVersion === 'string'
    && (typeof meta.repositoryHead === 'string' || meta.repositoryHead === null)
    && typeof meta.buildFingerprint === 'string'
    && /^[a-f0-9]{64}$/i.test(meta.buildFingerprint)
    && typeof meta.bundleSha256 === 'string'
    && /^[a-f0-9]{64}$/i.test(meta.bundleSha256)
    && typeof meta.builtAt === 'string';
};

async function findRepositoryRoot(serverPath: string): Promise<string | null> {
  let current = dirname(serverPath);
  while (true) {
    if (existsSync(join(current, 'pnpm-workspace.yaml'))) return current;
    const parent = dirname(current);
    if (parent === current || current === parse(current).root) break;
    current = parent;
  }
  try { return (await execFileAsync('git', ['-C', dirname(serverPath), 'rev-parse', '--show-toplevel'], { encoding: 'utf8', timeout: 1500 })).stdout.trim() || null; }
  catch { return null; }
}

async function readRepositoryHead(root: string): Promise<string | null> {
  try { return (await execFileAsync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8', timeout: 1500 })).stdout.trim() || null; }
  catch { return null; }
}

async function recordIfChanged(logPath: string, diagnostic: VersionDiagnostic): Promise<void> {
  const signature = JSON.stringify({ status: diagnostic.status, activeSha: diagnostic.active.sha, diskSha: diagnostic.disk.sha, activeFingerprint: diagnostic.active.fingerprint, diskFingerprint: diagnostic.disk.fingerprint, repositoryHead: diagnostic.repository.head });
  try {
    await mkdir(dirname(logPath), { recursive: true });
    let previous: { signature?: string } | undefined;
    try {
      const lines = (await readFile(logPath, 'utf8')).trimEnd().split(/\r?\n/);
      for (let i = lines.length - 1; i >= 0; i--) {
        try { previous = JSON.parse(lines[i]) as { signature?: string }; break; } catch { /* skip a partial or invalid trailing record */ }
      }
    } catch { /* first diagnostic record */ }
    if (previous?.signature === signature) return;
    await appendFile(logPath, JSON.stringify({ timestamp: new Date().toISOString(), signature, status: diagnostic.status,
      activeSha: diagnostic.active.sha, diskSha: diagnostic.disk.sha, repositoryHead: diagnostic.repository.head }) + '\n', 'utf8');
  } catch { /* Diagnostics must never block qap_status. */ }
}

export async function getVersionDiagnostic(options: DiagnosticOptions = {}): Promise<VersionDiagnostic> {
  let serverPath = options.serverPath;
  if (!serverPath) {
    const argvPath = process.argv[1];
    try { serverPath = argvPath ? realpathSync(argvPath) : fileURLToPath(import.meta.url); }
    catch { serverPath = argvPath || fileURLToPath(import.meta.url); }
  }
  const metadataPath = options.metadataPath ?? join(dirname(serverPath), 'build-meta.json');
  const logPath = options.logPath ?? join(dirname(serverPath), '..', '..', '..', '.qa', 'runtime', 'qap-version-diagnostics.jsonl');
  const activeSha = options.activeSha === undefined ? (process.env.QAP_BUILD_REVISION || null) : options.activeSha;
  const activeFingerprint = options.activeFingerprint === undefined ? (process.env.QAP_BUILD_FINGERPRINT || null) : options.activeFingerprint;
  const version = options.version ?? process.env.QAP_MCP_VERSION ?? 'unknown';
  const repositoryRoot = await findRepositoryRoot(serverPath);
  const repositoryHead = repositoryRoot
    ? (options.readHead ? options.readHead(repositoryRoot) : await readRepositoryHead(repositoryRoot))
    : null;
  let metadata: BuildMetadata | null = null;
  const metadataExists = existsSync(metadataPath);
  let metadataInvalid = false;
  if (metadataExists) {
    try {
      const value: unknown = JSON.parse(await readFile(metadataPath, 'utf8'));
      if (isMetadata(value)) metadata = value;
      else metadataInvalid = true;
    } catch { metadataInvalid = true; }
  }

  let bundleMatchesMetadata = false;
  if (metadata && existsSync(join(dirname(metadataPath), 'server.js'))) {
    try {
      const bundleHash = createHash('sha256');
      for (const name of (await readdir(dirname(metadataPath))).filter((entry) => entry.endsWith('.js')).sort()) {
        bundleHash.update(name + '\0').update(await readFile(join(dirname(metadataPath), name)));
      }
      bundleMatchesMetadata = bundleHash.digest('hex') === metadata.bundleSha256;
    }
    catch { bundleMatchesMetadata = false; }
  }

  let status: VersionDiagnostic['status'] = 'unknown';
  let action: VersionDiagnostic['action'] = 'review_configuration';
  let message = 'No hay metadatos verificables suficientes para comparar el servidor con el artefacto en disco.';
  if (metadataInvalid || (metadata && metadata.schemaVersion !== 1) || (metadata && !bundleMatchesMetadata)) {
    status = 'incompatible';
    action = 'review_configuration';
    message = metadataInvalid || metadata?.schemaVersion !== 1
      ? 'Los metadatos de compilación no son compatibles o están dañados; revisa la configuración del MCP.'
      : 'El bundle en disco no coincide con su huella de compilación; revisa la configuración del MCP.';
  } else if (metadata && !activeFingerprint) {
    status = 'unknown';
    action = 'review_configuration';
  } else if (metadata && (activeFingerprint !== metadata.buildFingerprint || (metadata.repositoryHead && activeSha !== metadata.repositoryHead))) {
    status = 'stale_process';
    action = 'reconnect_mcp';
    message = 'El proceso activo conserva una compilación distinta del artefacto actual en disco; reconecta el MCP en Antigravity.';
  } else if (metadata && repositoryHead && metadata.repositoryHead !== repositoryHead) {
    status = 'build_outdated';
    action = 'recompile';
    message = 'El repositorio del servidor tiene un HEAD nuevo respecto a la última compilación; recompila QAP y reconecta el MCP.';
  } else if (metadata && bundleMatchesMetadata) {
    status = 'current';
    action = 'continue';
    message = repositoryHead ? 'El proceso activo, el bundle en disco y el HEAD del repositorio del servidor están sincronizados.'
      : 'El proceso activo y el bundle en disco están sincronizados; no se pudo consultar Git.';
  }

  const diagnostic: VersionDiagnostic = {
    status, action, message,
    active: { sha: activeSha, fingerprint: activeFingerprint, version, pid: options.pid ?? process.pid,
      startedAt: options.startedAt ?? PROCESS_STARTED_AT, serverPath },
    disk: { sha: metadata?.repositoryHead ?? null, fingerprint: metadata?.buildFingerprint ?? null,
      version: metadata?.packageVersion ?? null, bundleSha256: metadata?.bundleSha256 ?? null, metadataPath },
    repository: { root: repositoryRoot, head: repositoryHead,
      comparison: !repositoryHead || !metadata?.repositoryHead ? 'unavailable' : repositoryHead === metadata.repositoryHead ? 'matched' : 'outdated' },
    logPath,
  };
  if (options.log !== false) await recordIfChanged(logPath, diagnostic);
  return diagnostic;
}
