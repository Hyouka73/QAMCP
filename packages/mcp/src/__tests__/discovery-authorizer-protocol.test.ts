import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';

import { afterEach, describe, expect, it, vi } from 'vitest';

const launch = vi.hoisted(() => vi.fn());
vi.mock('node:child_process', () => ({ spawn: launch }));
vi.mock('../authorization-diagnostics.js', () => ({ authorizationDiagnostic: () => 'synthetic-id' }));
import { WindowsInteractiveDiscoveryAuthorizer } from '../discovery-authorizer.js';

afterEach(() => { vi.useRealTimers(); launch.mockReset(); });

describe.skipIf(process.platform !== 'win32')('Windows discovery child protocol (synthetic, not GUI evidence)', () => {
  function start(signal?: AbortSignal) {
    const child = Object.assign(new EventEmitter(), { stdout: new PassThrough(), stderr: new PassThrough(), pid: 123, kill: vi.fn() });
    launch.mockReturnValue(child);
    const authorizer = new WindowsInteractiveDiscoveryAuthorizer(new URL('../../../../scripts/qap-interactive-discovery-dialog.ps1', import.meta.url).pathname.replace(/^\//, ''));
    const result = authorizer.requestAuthorization({
      projectRoot: 'C:\\fixture',
      applicationId: 'test-app',
      environmentId: 'staging',
      environmentRevision: 1,
      baseUrl: 'https://staging.test.invalid/',
      targetUrl: 'https://staging.test.invalid/',
    }, signal);
    return { child, result };
  }

  it('exit 1 without REJECTED is a launch error, not human rejection', async () => {
    const { child, result } = start(); child.emit('close', 1);
    expect(await result).toMatchObject({ decision: 'unavailable', code: 'discovery_dialog_start_failed' });
  });

  it('does not accept a substring such as NOT_AUTHORIZED', async () => {
    const { child, result } = start(); child.stderr.write('QAP_DIALOG_SHOWN'); child.stdout.write('NOT_AUTHORIZED'); child.emit('close', 0);
    expect(await result).toMatchObject({ decision: 'unavailable' });
  });

  it('handles a shown marker split across pipe chunks and registers rejection', async () => {
    const { child, result } = start(); child.stderr.write('QAP_DIALOG_'); child.stderr.write('SHOWN\n'); child.stdout.write('REJECTED\r\n'); child.emit('close', 1);
    expect(await result).toMatchObject({ decision: 'rejected' });
  });

  it('shown marker followed by AUTHORIZED and exit 0 approves', async () => {
    const { child, result } = start(); child.stderr.write('QAP_DIALOG_SHOWN\n'); child.stdout.write('AUTHORIZED\r\n'); child.emit('close', 0);
    expect(await result).toMatchObject({ decision: 'approved', targetUrl: 'https://staging.test.invalid/' });
  });

  it('handles CANCELLED and EXPIRED responses properly', async () => {
    const { child, result } = start(); child.stderr.write('QAP_DIALOG_SHOWN\n'); child.stdout.write('EXPIRED\r\n'); child.emit('close', 2);
    expect(await result).toMatchObject({ decision: 'cancelled', code: 'discovery_authorization_expired' });
  });

  it('spawn failure exposes a fixed public classification', async () => {
    const { child, result } = start(); child.emit('error', Object.assign(new Error('PRIVATE'), { code: 'EACCES' }));
    const value = await result;
    expect(value).toMatchObject({ code: 'discovery_dialog_start_failed' });
    expect(JSON.stringify(value)).not.toContain('PRIVATE');
  });

  it('watchdog terminates the child and reports expiration', async () => {
    vi.useFakeTimers(); const { child, result } = start(); await vi.advanceTimersByTimeAsync(125_000);
    expect(await result).toMatchObject({ decision: 'cancelled', code: 'discovery_authorization_expired' });
    expect(child.kill).toHaveBeenCalledOnce();
  });
});
