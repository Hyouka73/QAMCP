import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, realpathSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { authorizationDiagnostic } from './authorization-diagnostics.js';
import { resolveDialogScriptPath } from './dialog-script-path.js';
import type { TestNavigationAuthorization } from './handlers/test.handler.js';

export interface TestExecutionAuthorizationRequest {
  readonly projectRoot: string;
  readonly projectName: string;
  readonly origin: string;
  readonly moduleName: string;
  readonly caseCount: number;
  readonly profileLabel?: string;
}

export type TestExecutionAuthorizationResult =
  | {
      readonly decision: 'approved';
      readonly allowedOrigins: readonly string[];
      readonly authorizedProfiles?: readonly string[];
    }
  | { readonly decision: 'rejected'; readonly reason?: string }
  | {
      readonly decision: 'cancelled';
      readonly reason?: string;
      readonly code?: 'test_authorization_cancelled' | 'test_authorization_expired';
    }
  | {
      readonly decision: 'unavailable';
      readonly reason: string;
      readonly code?: 'test_gui_unavailable' | 'test_dialog_start_failed';
    };

export interface ITestAuthorizer {
  requestAuthorization(
    request: TestExecutionAuthorizationRequest,
    signal?: AbortSignal,
  ): Promise<TestExecutionAuthorizationResult>;
}

export function atomicRecordTestAuthorization(
  registryPath: string,
  auth: TestNavigationAuthorization,
): void {
  const dir = dirname(registryPath);
  mkdirSync(dir, { recursive: true, mode: 0o700 });

  let records: TestNavigationAuthorization[] = [];
  if (existsSync(registryPath)) {
    try {
      const parsed: unknown = JSON.parse(readFileSync(registryPath, 'utf8'));
      if (Array.isArray(parsed)) {
        records = parsed.filter(
          (r): r is TestNavigationAuthorization =>
            Boolean(r && typeof r === 'object' && Array.isArray((r as TestNavigationAuthorization).allowedOrigins)),
        );
      }
    } catch {
      records = [];
    }
  }

  const compare = (p: string) => (process.platform === 'win32' ? p.toLowerCase() : p);
  const canonicalRoot = auth.projectRoot ? realpathSync(auth.projectRoot) : '';

  const existingIndex = records.findIndex(
    (r) => (r.projectRoot ? compare(r.projectRoot) : '') === compare(canonicalRoot),
  );
  const mergedOrigins = Array.from(new Set(auth.allowedOrigins));
  const mergedProfiles = auth.authorizedProfiles ? Array.from(new Set(auth.authorizedProfiles)) : undefined;

  if (existingIndex >= 0) {
    const existing = records[existingIndex];
    records[existingIndex] = {
      ...existing,
      projectRoot: canonicalRoot || existing.projectRoot,
      allowedOrigins: Array.from(new Set([...existing.allowedOrigins, ...mergedOrigins])),
      ...(existing.authorizedProfiles || mergedProfiles
        ? {
            authorizedProfiles: Array.from(
              new Set([...(existing.authorizedProfiles ?? []), ...(mergedProfiles ?? [])]),
            ),
          }
        : {}),
    };
  } else {
    records.push({
      projectRoot: canonicalRoot || auth.projectRoot,
      allowedOrigins: mergedOrigins,
      allowRedirectsToAllowedOnly: true,
      ...(mergedProfiles ? { authorizedProfiles: mergedProfiles } : {}),
    });
  }

  const staging = join(dir, `${randomUUID()}.tmp.json`);
  writeFileSync(staging, JSON.stringify(records, null, 2), { flag: 'wx', mode: 0o600 });
  renameSync(staging, registryPath);
}

export function loadTestAuthorizationsFromDisk(registryPath: string): TestNavigationAuthorization[] {
  if (!existsSync(registryPath)) return [];
  try {
    const parsed: unknown = JSON.parse(readFileSync(registryPath, 'utf8'));
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r): r is TestNavigationAuthorization =>
        Boolean(r && typeof r === 'object' && Array.isArray((r as TestNavigationAuthorization).allowedOrigins)),
    );
  } catch {
    return [];
  }
}

export class WindowsInteractiveTestAuthorizer implements ITestAuthorizer {
  private readonly scriptPath: string;

  constructor(scriptPath?: string) {
    this.scriptPath = scriptPath
      ? decodeURIComponent(scriptPath)
      : resolveDialogScriptPath('qap-interactive-test-dialog.ps1');
  }

  async requestAuthorization(
    request: TestExecutionAuthorizationRequest,
    signal?: AbortSignal,
  ): Promise<TestExecutionAuthorizationResult> {
    if (process.platform !== 'win32') {
      return {
        decision: 'unavailable',
        code: 'test_gui_unavailable',
        reason: 'Interactive dialog only supported on Windows.',
      };
    }
    if (!existsSync(this.scriptPath)) {
      authorizationDiagnostic('test_dialog_script_missing', { scriptPath: this.scriptPath });
      return {
        decision: 'unavailable',
        code: 'test_dialog_start_failed',
        reason: 'Test authorization dialog script not found.',
      };
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
          '-ModuleName',
          request.moduleName,
          '-CaseCount',
          String(request.caseCount),
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
        resolveResult({ decision: 'cancelled', code: 'test_authorization_expired' });
      }, 125_000);

      const onAbort = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          signal?.removeEventListener('abort', onAbort);
          try {
            child.kill('SIGTERM');
          } catch {
            /* ignore */
          }
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
          resolveResult({
            decision: 'approved',
            allowedOrigins: [request.origin],
            ...(request.profileLabel ? { authorizedProfiles: [request.profileLabel] } : {}),
          });
        } else if (code === 1 && text === 'REJECTED' && shown) {
          resolveResult({ decision: 'rejected', reason: 'Operator rejected test execution authorization.' });
        } else if (code === 3 && text === 'UNAVAILABLE') {
          resolveResult({ decision: 'unavailable', code: 'test_gui_unavailable', reason: 'Desktop session not interactive.' });
        } else if (code === 2 && ['CANCELLED', 'EXPIRED'].includes(text) && shown) {
          resolveResult({
            decision: 'cancelled',
            code: text === 'EXPIRED' ? 'test_authorization_expired' : 'test_authorization_cancelled',
          });
        } else {
          resolveResult({
            decision: 'unavailable',
            code: 'test_dialog_start_failed',
            reason: 'Dialog failed or returned invalid response.',
          });
        }
      });

      child.on('error', () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (signal) signal.removeEventListener('abort', onAbort);
        resolveResult({ decision: 'unavailable', code: 'test_dialog_start_failed', reason: 'Failed to launch test dialog.' });
      });
    });
  }
}
