import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, realpathSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CredentialError } from '@qap/auth';
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
  readonly interactiveOperation?: {
    operation: 'login' | 'test' | 'discovery_profile';
    profile?: string;
    details: string;
  };
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
  /** Separate operator decision; the value stays inside the host. */
  requestCredential?(request: DiscoveryAuthorizationRequest, profile: string, details: string,
    signal: AbortSignal): Promise<string | undefined>;
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
    this.scriptPath = scriptPath
      ? decodeURIComponent(scriptPath)
      : fileURLToPath(new URL('../../../scripts/qap-interactive-discovery-dialog.ps1', import.meta.url));
  }

  private launchDialog(request: DiscoveryAuthorizationRequest, operation?: string, profile?: string, details?: string) {
    const powershellExe = join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
    return spawn(powershellExe, [
      '-NoProfile', '-NonInteractive', '-STA', '-ExecutionPolicy', 'Bypass', '-File', this.scriptPath,
      '-ApplicationId', request.applicationId, '-EnvironmentId', request.environmentId,
      '-EnvironmentRevision', String(request.environmentRevision), '-BaseUrl', request.baseUrl,
      '-TargetUrl', request.targetUrl, '-MaxPages', String(request.limits?.max_pages ?? 10),
      '-MaxRequests', String(request.limits?.max_requests ?? 50),
      '-TimeoutSec', String(Math.ceil((request.limits?.total_timeout_ms ?? 60_000) / 1000)),
      ...(operation ? ['-Operation', operation, '-ProjectRoot', request.projectRoot,
        '-Profile', profile ?? '(anónimo)', '-ScopeDetails', Buffer.from(details ?? '', 'utf8').toString('base64')] : []),
    ], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: false });
  }

  async requestCredential(request: DiscoveryAuthorizationRequest, profile: string, details: string,
    signal: AbortSignal): Promise<string | undefined> {
    if (signal.aborted) return;
    if (process.platform !== 'win32') throw new CredentialError('DIALOG_DESKTOP_UNAVAILABLE');
    if (!existsSync(this.scriptPath)) throw new CredentialError('DIALOG_START_FAILED');

    return new Promise((resolve, reject) => {
      const child = this.launchDialog(request, 'credential_provision', profile, details);
      const secret = Buffer.alloc(8192);
      let length = 0;
      let control = '';
      let started = false;
      let shown = false;
      let settled = false;
      let timer = setTimeout(() => finish(new CredentialError(started ? 'DIALOG_NOT_PRESENTED' : 'DIALOG_START_FAILED')), 8_000);

      function finish(error?: CredentialError, password?: string): void {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        signal.removeEventListener('abort', abort);
        secret.fill(0);
        if (error) {
          child.kill();
          authorizationDiagnostic('credential_dialog_error', { childPid: child.pid, code: error.code, started, shown });
          reject(error);
        } else {
          authorizationDiagnostic(password === undefined ? 'credential_dialog_cancelled' : 'credential_dialog_accepted',
            { childPid: child.pid, shown });
          resolve(password);
        }
      }

      function abort(): void {
        finish();
        child.kill();
      }

      child.once('spawn', () => {
        if (settled) return;
        started = true;
        authorizationDiagnostic('credential_dialog_started', { childPid: child.pid });
      });
      child.once('error', () => finish(new CredentialError(started ? 'DIALOG_FAILED' : 'DIALOG_START_FAILED')));
      child.stderr.on('data', (chunk: Buffer) => {
        if (settled) return;
        const lines = (control + chunk.toString('utf8')).split('\n');
        control = lines.pop()!.slice(-256);
        for (const line of lines) {
          const context = /^QAP_CREDENTIAL_DESKTOP (\d+) ([\w.-]+) ([\w.-]+) ([\w.-]+) (-?\d+)\r?$/.exec(line);
          if (context) {
            authorizationDiagnostic('credential_dialog_desktop', { childPid: child.pid, session: Number(context[1]),
              station: context[2], desktop: context[3], inputDesktop: context[4], connection: Number(context[5]) });
          }
          const window = /^QAP_CREDENTIAL_WINDOW (\d+) ([01]) ([01])\r?$/.exec(line);
          if (!window) continue;
          authorizationDiagnostic('credential_dialog_window', { childPid: child.pid, hwnd: window[1],
            visible: window[2] === '1', foreground: window[3] === '1' });
          if (started && !shown && window[1] !== '0' && window[2] === '1') {
            shown = true;
            clearTimeout(timer);
            timer = setTimeout(() => finish(new CredentialError('DIALOG_RESPONSE_TIMEOUT')), 45_000);
          }
        }
      });
      child.stdout.on('data', (chunk: Buffer) => {
        if (!settled) {
          if (length + chunk.length > secret.length) finish(new CredentialError('DIALOG_FAILED'));
          else {
            chunk.copy(secret, length);
            length += chunk.length;
          }
        }
        chunk.fill(0);
      });
      child.once('close', code => {
        if (settled) return;
        if (code === 3 && length === 0) finish(new CredentialError('DIALOG_DESKTOP_UNAVAILABLE'));
        else if (code === 2 && shown && length === 0) finish();
        else if (code === 5 && shown && length === 0) finish(new CredentialError('DIALOG_RESPONSE_TIMEOUT'));
        else if (code === 0 && shown && length > 0) finish(undefined, secret.toString('utf8', 0, length));
        else finish(new CredentialError(shown || code === 4 ? 'DIALOG_FAILED' : 'DIALOG_NOT_PRESENTED'));
      });
      signal.addEventListener('abort', abort, { once: true });
      if (signal.aborted) abort();
    });
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
      const { operation, profile, details } = request.interactiveOperation ?? {};
      const child = this.launchDialog(request, operation, profile, details);

      authorizationDiagnostic('discovery_dialog_spawn', {
        childPid: child.pid,
        scriptPath: this.scriptPath,
        applicationId: request.applicationId,
        environmentId: request.environmentId,
        ...(request.interactiveOperation ? { operation: request.interactiveOperation.operation } : { targetUrl: request.targetUrl }),
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
