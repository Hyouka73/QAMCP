import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, realpathSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { BlackBoxCrawlerInput } from '@qap/playwright-adapter';

import { authorizationDiagnostic } from './authorization-diagnostics.js';
import type { DiscoveryAuthorization } from './handlers/discovery.handler.js';

export interface DiscoveryAuthorizationRequest {
  readonly projectRoot: string;
  readonly applicationId: string;
  readonly environmentId: string;
  readonly environmentRevision: number;
  readonly baseUrl: string;
  readonly targetUrl: string;
  readonly limits?: BlackBoxCrawlerInput['limits'];
}

export type DiscoveryAuthorizationResult =
  | { readonly decision: 'approved'; readonly root: string; readonly targetUrl: string; readonly limits?: BlackBoxCrawlerInput['limits'] }
  | { readonly decision: 'rejected'; readonly reason?: string }
  | { readonly decision: 'cancelled'; readonly reason?: string; readonly code?: 'discovery_authorization_cancelled' | 'discovery_authorization_expired' }
  | { readonly decision: 'unavailable'; readonly reason: string; readonly code?: 'discovery_gui_unavailable' | 'discovery_dialog_start_failed' };

export interface IDiscoveryAuthorizer {
  requestAuthorization(
    request: DiscoveryAuthorizationRequest,
    signal?: AbortSignal,
  ): Promise<DiscoveryAuthorizationResult>;
}

export interface PersistedDiscoveryAuthorization {
  readonly projectRoot: string;
  readonly applicationId: string;
  readonly environmentId: string;
  readonly environmentRevision: number;
  readonly navigationUrls: readonly string[];
  readonly limits?: BlackBoxCrawlerInput['limits'];
  readonly authorizedAt: string;
}

/**
 * Atomically records a discovery authorization into the host registry file.
 */
export function atomicRecordDiscoveryAuthorization(registryPath: string, auth: DiscoveryAuthorization): void {
  const dir = dirname(registryPath);
  mkdirSync(dir, { recursive: true, mode: 0o700 });

  let records: PersistedDiscoveryAuthorization[] = [];
  if (existsSync(registryPath)) {
    try {
      const parsed: unknown = JSON.parse(readFileSync(registryPath, 'utf8'));
      if (Array.isArray(parsed)) {
        records = parsed.filter((r): r is PersistedDiscoveryAuthorization =>
          Boolean(r && typeof r === 'object' && typeof (r as PersistedDiscoveryAuthorization).projectRoot === 'string')
        );
      }
    } catch {
      records = [];
    }
  }

  const compare = (p: string) => (process.platform === 'win32' ? p.toLowerCase() : p);
  const canonicalRoot = realpathSync(auth.projectRoot);

  const existingIndex = records.findIndex(r =>
    compare(r.projectRoot) === compare(canonicalRoot) &&
    r.applicationId === auth.applicationId &&
    r.environmentId === auth.environmentId &&
    r.environmentRevision === auth.environmentRevision
  );

  const urlsToAdd = auth.authorization.navigation_urls ?? [];

  if (existingIndex >= 0) {
    const existing = records[existingIndex];
    const combinedUrls = Array.from(new Set([...existing.navigationUrls, ...urlsToAdd]));
    records[existingIndex] = {
      ...existing,
      navigationUrls: combinedUrls,
      limits: auth.limits ? { ...auth.limits } : existing.limits,
      authorizedAt: new Date().toISOString(),
    };
  } else {
    records.push({
      projectRoot: canonicalRoot,
      applicationId: auth.applicationId,
      environmentId: auth.environmentId,
      environmentRevision: auth.environmentRevision,
      navigationUrls: [...urlsToAdd],
      limits: auth.limits ? { ...auth.limits } : undefined,
      authorizedAt: new Date().toISOString(),
    });
  }

  const staging = join(dir, `${randomUUID()}.tmp.json`);
  writeFileSync(staging, JSON.stringify(records, null, 2), { flag: 'wx', mode: 0o600 });
  renameSync(staging, registryPath);
}

/**
 * Loads valid persisted discovery authorizations from disk.
 */
export function loadDiscoveryAuthorizationsFromDisk(registryPath: string): DiscoveryAuthorization[] {
  if (!existsSync(registryPath)) return [];
  try {
    const parsed: unknown = JSON.parse(readFileSync(registryPath, 'utf8'));
    if (!Array.isArray(parsed)) return [];
    const result: DiscoveryAuthorization[] = [];
    for (const item of parsed) {
      if (
        item &&
        typeof item === 'object' &&
        typeof item.projectRoot === 'string' &&
        typeof item.applicationId === 'string' &&
        typeof item.environmentId === 'string' &&
        typeof item.environmentRevision === 'number' &&
        Array.isArray(item.navigationUrls) &&
        existsSync(item.projectRoot)
      ) {
        try {
          const canonical = realpathSync(item.projectRoot);
          result.push({
            projectRoot: canonical,
            applicationId: item.applicationId,
            environmentId: item.environmentId,
            environmentRevision: item.environmentRevision,
            authorization: {
              read_only_acknowledged: true,
              navigation_urls: item.navigationUrls.filter((u: unknown): u is string => typeof u === 'string'),
              allow_public_network: true,
            },
            limits: item.limits ? { ...item.limits } : undefined,
          });
        } catch {
          // ignore unresolvable paths
        }
      }
    }
    return result;
  } catch {
    return [];
  }
}

/**
 * Safely synchronizes in-memory discovery authorizations with the host registry file.
 */
export function syncDiscoveryAuthorizationsFromDisk(
  registryPath: string | undefined,
  inMemoryAuthorizations: DiscoveryAuthorization[],
): void {
  if (!registryPath || !existsSync(registryPath)) return;
  const onDisk = loadDiscoveryAuthorizationsFromDisk(registryPath);
  const compare = (p: string) => (process.platform === 'win32' ? p.toLowerCase() : p);

  for (const diskAuth of onDisk) {
    const existing = inMemoryAuthorizations.find(a =>
      compare(a.projectRoot) === compare(diskAuth.projectRoot) &&
      a.applicationId === diskAuth.applicationId &&
      a.environmentId === diskAuth.environmentId &&
      a.environmentRevision === diskAuth.environmentRevision
    );
    if (!existing) {
      inMemoryAuthorizations.push(diskAuth);
    } else {
      // Merge any newly authorized URLs
      const existingUrls = new Set(existing.authorization.navigation_urls);
      for (const url of diskAuth.authorization.navigation_urls) {
        if (!existingUrls.has(url)) {
          (existing.authorization.navigation_urls as string[]).push(url);
        }
      }
    }
  }
}

/**
 * Native Windows interactive discovery authorizer.
 * Displays a modal dialog requesting operator consent for exploratory web navigation.
 * Note: this dialog is not a security boundary against processes executing under the same Windows user.
 */
export class WindowsInteractiveDiscoveryAuthorizer implements IDiscoveryAuthorizer {
  private readonly scriptPath: string;

  constructor(scriptPath?: string) {
    this.scriptPath = scriptPath ?? fileURLToPath(new URL('../../../scripts/qap-interactive-discovery-dialog.ps1', import.meta.url));
  }

  async requestAuthorization(
    request: DiscoveryAuthorizationRequest,
    signal?: AbortSignal,
  ): Promise<DiscoveryAuthorizationResult> {
    if (process.platform !== 'win32') {
      return { decision: 'unavailable', code: 'discovery_gui_unavailable', reason: 'Interactive dialog only supported on Windows.' };
    }
    if (!existsSync(this.scriptPath)) {
      authorizationDiagnostic('discovery_dialog_script_missing', { scriptPath: this.scriptPath });
      return { decision: 'unavailable', code: 'discovery_dialog_start_failed', reason: 'Discovery authorization dialog script not found.' };
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
          '-ApplicationId',
          request.applicationId,
          '-EnvironmentId',
          request.environmentId,
          '-EnvironmentRevision',
          String(request.environmentRevision),
          '-BaseUrl',
          request.baseUrl,
          '-TargetUrl',
          request.targetUrl,
          '-MaxPages',
          String(request.limits?.max_pages ?? 10),
          '-MaxRequests',
          String(request.limits?.max_requests ?? 50),
          '-TimeoutSec',
          String(Math.ceil((request.limits?.total_timeout_ms ?? 60_000) / 1000)),
        ],
        { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: false },
      );

      authorizationDiagnostic('discovery_dialog_spawn', {
        childPid: child.pid,
        scriptPath: this.scriptPath,
        applicationId: request.applicationId,
        environmentId: request.environmentId,
        targetUrl: request.targetUrl,
      });

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
        if (failure) {
          authorizationDiagnostic('discovery_dialog_script_error', { exceptionType: failure[1], hresult: failure[2] });
        }
        if (!shown && stderrTail.includes('QAP_DIALOG_SHOWN')) {
          shown = true;
          authorizationDiagnostic('discovery_dialog_shown', { childPid: child.pid });
        }
      });

      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        signal?.removeEventListener('abort', onAbort);
        child.kill();
        authorizationDiagnostic('discovery_dialog_watchdog_expired', { shown });
        resolveResult({ decision: 'cancelled', code: 'discovery_authorization_expired' });
      }, 125_000);

      const onAbort = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          signal?.removeEventListener('abort', onAbort);
          try { child.kill('SIGTERM'); } catch { /* ignore kill error */ }
          authorizationDiagnostic('discovery_dialog_aborted', { shown });
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
        authorizationDiagnostic('discovery_dialog_closed', { childPid: child.pid, exitCode: code, shown, stderrBytes });
        if (code === 0 && text === 'AUTHORIZED' && shown) {
          resolveResult({ decision: 'approved', root: request.projectRoot, targetUrl: request.targetUrl, limits: request.limits });
        } else if (code === 1 && text === 'REJECTED' && shown) {
          resolveResult({ decision: 'rejected', reason: 'Operator rejected discovery navigation authorization.' });
        } else if (code === 3 && text === 'UNAVAILABLE') {
          resolveResult({ decision: 'unavailable', code: 'discovery_gui_unavailable', reason: 'Desktop session not interactive.' });
        } else if (code === 2 && ['CANCELLED', 'EXPIRED'].includes(text) && shown) {
          resolveResult({ decision: 'cancelled', code: text === 'EXPIRED' ? 'discovery_authorization_expired' : 'discovery_authorization_cancelled' });
        } else {
          resolveResult({ decision: 'unavailable', code: 'discovery_dialog_start_failed', reason: 'Dialog failed or returned an invalid response.' });
        }
      });

      child.on('error', (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (signal) signal.removeEventListener('abort', onAbort);
        authorizationDiagnostic('discovery_dialog_spawn_error', { code: (err as NodeJS.ErrnoException).code });
        resolveResult({ decision: 'unavailable', code: 'discovery_dialog_start_failed', reason: 'Failed to launch discovery authorization dialog.' });
      });
    });
  }
}
