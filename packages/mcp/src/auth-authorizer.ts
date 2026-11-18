import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { atomicWritePrivateFile, normalizePathKey } from './application/safe-storage.js';
import { authorizationDiagnostic } from './authorization-diagnostics.js';
import { resolveDialogScriptPath } from './dialog-script-path.js';

export interface AuthAuthorizationRequest {
  readonly projectRoot: string;
  readonly projectName: string;
  readonly applicationId: string;
  readonly environmentId: string;
  readonly origin: string;
  readonly profileLabel: string;
  readonly loginMode: 'auto' | 'handoff';
}

export type AuthAuthorizationResult =
  | { readonly decision: 'approved'; readonly origin: string; readonly profileLabel: string; readonly expiresAt?: string }
  | { readonly decision: 'rejected'; readonly reason?: string }
  | { readonly decision: 'cancelled'; readonly reason?: string; readonly code?: 'auth_authorization_cancelled' | 'auth_authorization_expired' }
  | { readonly decision: 'unavailable'; readonly reason: string; readonly code?: 'auth_gui_unavailable' | 'auth_dialog_start_failed' };

export interface IAuthAuthorizer {
  requestAuthorization(
    request: AuthAuthorizationRequest,
    signal?: AbortSignal,
  ): Promise<AuthAuthorizationResult>;
}

export interface PersistedAuthAuthorization {
  readonly projectRoot: string;
  readonly origin: string;
  readonly profileLabel: string;
  readonly loginMode: 'auto' | 'handoff';
  readonly authorizedAt: string;
  readonly expiresAt?: string;
}

export function loadAuthAuthorizationsFromDisk(registryPath: string): PersistedAuthAuthorization[] {
  if (!existsSync(registryPath)) return [];
  try {
    const parsed: unknown = JSON.parse(readFileSync(registryPath, 'utf8'));
    if (!Array.isArray(parsed)) return [];
    const now = Date.now();
    return parsed.filter((entry): entry is PersistedAuthAuthorization => {
      if (!entry || typeof entry !== 'object') return false;
      const rec = entry as Partial<PersistedAuthAuthorization>;
      if (typeof rec.projectRoot !== 'string' || typeof rec.origin !== 'string' || typeof rec.profileLabel !== 'string') {
        return false;
      }
      if (rec.expiresAt && Date.parse(rec.expiresAt) <= now) {
        return false;
      }
      return true;
    });
  } catch {
    return [];
  }
}

export function atomicRecordAuthAuthorization(registryPath: string, entry: PersistedAuthAuthorization): void {
  mkdirSync(dirname(registryPath), { recursive: true, mode: 0o700 });
  const existing = loadAuthAuthorizationsFromDisk(registryPath);
  let canonicalRoot: string;
  try {
    canonicalRoot = realpathSync(entry.projectRoot);
  } catch {
    canonicalRoot = entry.projectRoot;
  }
  const key = normalizePathKey(canonicalRoot);
  const filtered = existing.filter(
    (item) => !(normalizePathKey(item.projectRoot) === key && item.origin === entry.origin && item.profileLabel === entry.profileLabel),
  );
  filtered.push({ ...entry, projectRoot: canonicalRoot });
  atomicWritePrivateFile(registryPath, JSON.stringify(filtered, null, 2));
}

export function hasPersistedAuthAuthorization(
  list: readonly PersistedAuthAuthorization[],
  projectRoot: string,
  origin: string,
  profileLabel?: string,
): boolean {
  const key = normalizePathKey(projectRoot);
  const now = Date.now();
  return list.some((entry) => {
    if (normalizePathKey(entry.projectRoot) !== key) return false;
    if (entry.origin !== origin) return false;
    if (entry.expiresAt && Date.parse(entry.expiresAt) <= now) return false;
    if (profileLabel && entry.profileLabel !== profileLabel && entry.profileLabel !== '*') return false;
    return true;
  });
}

/**
 * Native Windows interactive authentication authorization dialog.
 */
export class WindowsInteractiveAuthAuthorizer implements IAuthAuthorizer {
  private readonly scriptPath: string;

  constructor(scriptPath?: string) {
    this.scriptPath = scriptPath
      ? decodeURIComponent(scriptPath)
      : resolveDialogScriptPath('qap-interactive-auth-dialog.ps1');
  }

  async requestAuthorization(
    request: AuthAuthorizationRequest,
    signal?: AbortSignal,
  ): Promise<AuthAuthorizationResult> {
    if (process.platform !== 'win32') {
      return { decision: 'unavailable', code: 'auth_gui_unavailable', reason: 'Interactive dialog only supported on Windows.' };
    }
    if (!existsSync(this.scriptPath)) {
      authorizationDiagnostic('auth_dialog_script_missing', { scriptPath: this.scriptPath });
      return { decision: 'unavailable', code: 'auth_dialog_start_failed', reason: 'Auth authorization dialog script not found.' };
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
        [
          '-NoProfile',
          '-NonInteractive',
          '-STA',
          '-ExecutionPolicy',
          'Bypass',
          '-File',
          this.scriptPath,
          '-ProjectName',
          request.projectName,
          '-Origin',
          request.origin,
          '-ProfileLabel',
          request.profileLabel,
          '-LoginMode',
          request.loginMode,
        ],
        { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: false },
      );

      let stdout = '';
      let shown = false;
      let stderrTail = '';

      child.stdout.on('data', (chunk: Buffer) => {
        stdout = (stdout + chunk.toString('utf8')).slice(-4096);
      });

      child.stderr.on('data', (chunk: Buffer) => {
        stderrTail = (stderrTail + chunk.toString('utf8')).slice(-256);
        if (!shown && stderrTail.includes('QAP_DIALOG_SHOWN')) {
          shown = true;
        }
      });

      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        signal?.removeEventListener('abort', onAbort);
        child.kill();
        resolveResult({ decision: 'cancelled', code: 'auth_authorization_expired' });
      }, 125_000);

      const onAbort = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          signal?.removeEventListener('abort', onAbort);
          try { child.kill('SIGTERM'); } catch { /* ignore */ }
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
        if (code === 0 && text === 'AUTHORIZED' && shown) {
          resolveResult({ decision: 'approved', origin: request.origin, profileLabel: request.profileLabel });
        } else if (code === 1 && text === 'REJECTED' && shown) {
          resolveResult({ decision: 'rejected', reason: 'Operator rejected authentication authorization.' });
        } else if (code === 3 && text === 'UNAVAILABLE') {
          resolveResult({ decision: 'unavailable', code: 'auth_gui_unavailable', reason: 'Desktop session not interactive.' });
        } else if (code === 2 && ['CANCELLED', 'EXPIRED'].includes(text) && shown) {
          resolveResult({ decision: 'cancelled', code: text === 'EXPIRED' ? 'auth_authorization_expired' : 'auth_authorization_cancelled' });
        } else {
          resolveResult({ decision: 'unavailable', code: 'auth_dialog_start_failed', reason: 'Dialog failed or returned invalid response.' });
        }
      });

      child.on('error', () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (signal) signal.removeEventListener('abort', onAbort);
        resolveResult({ decision: 'unavailable', code: 'auth_dialog_start_failed', reason: 'Failed to launch auth dialog.' });
      });
    });
  }
}
