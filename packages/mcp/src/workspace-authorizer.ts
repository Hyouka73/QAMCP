import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, renameSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, isAbsolute, join, parse, resolve, sep } from 'node:path';

import { authorizationDiagnostic } from './authorization-diagnostics.js';
import { resolveDialogScriptPath } from './dialog-script-path.js';

export interface WorkspaceAuthorizationRequest {
  readonly requestedPath: string;
  readonly canonicalPath: string;
}

export type WorkspaceAuthorizationResult =
  | { readonly decision: 'approved'; readonly root: string }
  | { readonly decision: 'rejected'; readonly root: string; readonly reason?: string }
  | { readonly decision: 'cancelled'; readonly reason?: string; readonly code?: 'workspace_authorization_cancelled' | 'workspace_authorization_expired' }
  | { readonly decision: 'unavailable'; readonly reason: string; readonly code?: 'workspace_gui_unavailable' | 'workspace_dialog_start_failed' };

export interface IWorkspaceAuthorizer {
  requestAuthorization(
    request: WorkspaceAuthorizationRequest,
    signal?: AbortSignal,
  ): Promise<WorkspaceAuthorizationResult>;
}

/**
 * Validates a candidate workspace path before any authorization or scaffold.
 * Rejects symlinks, junctions, system roots, non-directories, and paths overlapping host storage.
 */
export function validateCandidateWorkspace(candidate: unknown, hostDirectory?: string): string {
  if (typeof candidate !== 'string' || !candidate.trim() || candidate.length > 4096) {
    throw new Error('Workspace path must be a non-empty string.');
  }
  if ([...candidate].some(char => char.charCodeAt(0) < 32)) {
    throw new Error('Workspace path contains control characters.');
  }
  if (!isAbsolute(candidate)) {
    throw new Error('Workspace path must be absolute.');
  }

  const resolved = resolve(candidate);
  if (!existsSync(resolved)) {
    throw new Error('Workspace path does not exist on disk.');
  }

  const canonical = realpathSync(resolved);
  const compare = (p: string) => (process.platform === 'win32' ? p.toLowerCase() : p);
  if (compare(canonical) !== compare(resolved)) {
    throw new Error('Workspace path reaches target through a symlink or junction.');
  }

  const stat = lstatSync(canonical);
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    throw new Error('Workspace path must be a physical directory.');
  }

  // Reject system root directory (e.g. C:\ or /)
  const rootDir = parse(canonical).root;
  if (compare(canonical) === compare(rootDir) || compare(canonical) === compare(rootDir.replace(/[\\/]$/, ''))) {
    throw new Error('System root cannot be authorized as a workspace.');
  }

  // On Windows, reject Windows directory or Program Files
  if (process.platform === 'win32') {
    const sysRoot = process.env.SystemRoot ? resolve(process.env.SystemRoot).toLowerCase() : 'c:\\windows';
    if (canonical.toLowerCase() === sysRoot || canonical.toLowerCase().startsWith(sysRoot + sep)) {
      throw new Error('Windows system directory cannot be authorized as a workspace.');
    }
  }

  // Verify all ancestor segments for symlinks, junctions and multi-links
  let part = rootDir;
  for (const segment of canonical.slice(rootDir.length).split(/[\\/]/).filter(Boolean)) {
    part = join(part, segment);
    if (existsSync(part)) {
      const partStat = lstatSync(part);
      if (partStat.isSymbolicLink() || (partStat.isFile() && partStat.nlink !== 1)) {
        throw new Error('Unsafe workspace path ancestor.');
      }
      if (compare(realpathSync(part)) !== compare(resolve(part))) {
        throw new Error('Workspace ancestor contains a junction or link.');
      }
    }
  }

  // Check overlap with host storage directory
  const effectiveHostDir = resolve(hostDirectory ?? process.env.QAP_MCP_WORKSPACE_HOST_DIR ?? join(homedir(), '.qap', 'workspaces'));
  const within = (parent: string, child: string) => {
    const p = compare(parent.replaceAll('\\', '/'));
    const c = compare(child.replaceAll('\\', '/'));
    return c === p || c.startsWith(p + '/');
  };
  if (within(canonical, effectiveHostDir) || within(effectiveHostDir, canonical)) {
    throw new Error('Workspace directory overlaps host storage directory.');
  }

  return canonical;
}

/**
 * Atomically records an authorized root into the host registry file.
 */
export function atomicRecordAuthorizedRoot(registryPath: string, root: string): void {
  const dir = dirname(registryPath);
  mkdirSync(dir, { recursive: true, mode: 0o700 });

  let roots: string[] = [];
  if (existsSync(registryPath)) {
    try {
      const parsed: unknown = JSON.parse(readFileSync(registryPath, 'utf8'));
      if (Array.isArray(parsed)) {
        roots = parsed.filter((r): r is string => typeof r === 'string');
      }
    } catch {
      roots = [];
    }
  }

  const compare = (p: string) => (process.platform === 'win32' ? p.toLowerCase() : p);
  if (!roots.some(r => compare(r) === compare(root))) {
    roots.push(root);
    const staging = join(dir, `${randomUUID()}.tmp.json`);
    writeFileSync(staging, JSON.stringify(roots, null, 2), { flag: 'wx', mode: 0o600 });
    renameSync(staging, registryPath);
  }
}

/**
 * Safely synchronizes in-memory authorized roots with the on-disk registry file.
 */
export function syncAuthorizedRootsFromDisk(registryPath: string | undefined, inMemoryRoots: string[]): void {
  if (!registryPath || !existsSync(registryPath)) return;
  try {
    const content = readFileSync(registryPath, 'utf8');
    const parsed: unknown = JSON.parse(content);
    if (!Array.isArray(parsed)) return;
    const compare = (p: string) => (process.platform === 'win32' ? p.toLowerCase() : p);
    for (const item of parsed) {
      if (typeof item === 'string' && isAbsolute(item) && existsSync(item)) {
        try {
          const canonical = realpathSync(item);
          if (!inMemoryRoots.some(r => compare(r) === compare(canonical))) {
            inMemoryRoots.push(canonical);
          }
        } catch {
          // ignore unresolvable entries
        }
      }
    }
  } catch {
    // ignore read/parse errors
  }
}

/**
 * Native Windows interactive workspace authorizer.
 * Displays a modal dialog in the operator desktop session with path details and permitted operations.
 */
export class WindowsInteractiveWorkspaceAuthorizer implements IWorkspaceAuthorizer {
  private readonly scriptPath: string;

  constructor(scriptPath?: string) {
    this.scriptPath = scriptPath
      ? decodeURIComponent(scriptPath)
      : resolveDialogScriptPath('qap-interactive-dialog.ps1');
  }

  async requestAuthorization(
    request: WorkspaceAuthorizationRequest,
    signal?: AbortSignal,
  ): Promise<WorkspaceAuthorizationResult> {
    if (process.platform !== 'win32') {
      return { decision: 'unavailable', code: 'workspace_gui_unavailable', reason: 'Interactive dialog only supported on Windows.' };
    }
    if (!existsSync(this.scriptPath)) {
      authorizationDiagnostic('dialog_script_missing', { scriptPath: this.scriptPath });
      return { decision: 'unavailable', code: 'workspace_dialog_start_failed', reason: 'Authorization dialog script not found.' };
    }
    if (signal?.aborted) {
      return { decision: 'cancelled', reason: 'Operation aborted.' };
    }

    return new Promise((resolveResult) => {
      let settled = false;
      const powershellExe = process.env.SystemRoot
        ? join(process.env.SystemRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe')
        : 'powershell.exe';

      const child = spawn(
        powershellExe,
        ['-NoProfile', '-NonInteractive', '-STA', '-ExecutionPolicy', 'Bypass', '-File', this.scriptPath, '-CanonicalPath', request.canonicalPath],
        { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: false },
      );
      authorizationDiagnostic('dialog_spawn', { childPid: child.pid, scriptPath: this.scriptPath, targetPath: request.canonicalPath });

      let stdout = '';
      let shown = false;
      let stderrBytes = 0;
      let stderrTail = '';
      child.stdout.on('data', (chunk: Buffer) => {
        stdout = (stdout + chunk.toString('utf8')).slice(-4096);
      });
      child.stderr.on('data', (chunk: Buffer) => {
        stderrBytes += chunk.length;
        stderrTail = (stderrTail + chunk.toString('utf8')).slice(-256);
        const failure = stderrTail.match(/QAP_DIALOG_ERROR ([A-Za-z0-9_.]+) (-?\d+)/);
        if (failure) authorizationDiagnostic('dialog_script_error', { exceptionType: failure[1], hresult: failure[2] });
        if (!shown && stderrTail.includes('QAP_DIALOG_SHOWN')) {
          shown = true;
          authorizationDiagnostic('dialog_shown', { childPid: child.pid });
        }
      });
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        signal?.removeEventListener('abort', onAbort);
        child.kill();
        authorizationDiagnostic('dialog_watchdog_expired', { shown });
        resolveResult({ decision: 'cancelled', code: 'workspace_authorization_expired' });
      }, 125_000);

      const onAbort = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          signal?.removeEventListener('abort', onAbort);
          try { child.kill('SIGTERM'); } catch { /* ignore kill error */ }
          authorizationDiagnostic('dialog_aborted', { shown });
          resolveResult({ decision: 'cancelled', reason: 'Operation aborted.' });
        }
      };

      if (signal) {
        signal.addEventListener('abort', onAbort, { once: true });
        if (signal.aborted) onAbort();
      }

      child.on('close', (code) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (signal) signal.removeEventListener('abort', onAbort);

        const text = stdout.trim();
        authorizationDiagnostic('dialog_closed', { childPid: child.pid, exitCode: code, shown, stderrBytes });
        if (code === 0 && text === 'AUTHORIZED' && shown) {
          resolveResult({ decision: 'approved', root: request.canonicalPath });
        } else if (code === 1 && text === 'REJECTED' && shown) {
          resolveResult({ decision: 'rejected', root: request.canonicalPath, reason: 'Operator rejected workspace authorization.' });
        } else if (code === 3 && text === 'UNAVAILABLE') {
          resolveResult({ decision: 'unavailable', code: 'workspace_gui_unavailable', reason: 'Desktop session not interactive.' });
        } else if (code === 2 && ['CANCELLED', 'EXPIRED'].includes(text) && shown) {
          resolveResult({ decision: 'cancelled', code: text === 'EXPIRED' ? 'workspace_authorization_expired' : 'workspace_authorization_cancelled' });
        } else {
          resolveResult({ decision: 'unavailable', code: 'workspace_dialog_start_failed', reason: 'Dialog failed or returned an invalid response.' });
        }
      });

      child.on('error', (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (signal) signal.removeEventListener('abort', onAbort);
        authorizationDiagnostic('dialog_spawn_error', { code: (err as NodeJS.ErrnoException).code });
        resolveResult({ decision: 'unavailable', code: 'workspace_dialog_start_failed', reason: 'Failed to launch authorization dialog.' });
      });
    });
  }
}
