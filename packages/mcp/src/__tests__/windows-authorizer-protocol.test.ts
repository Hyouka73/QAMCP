import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';

import { afterEach, describe, expect, it, vi } from 'vitest';

const launch = vi.hoisted(() => vi.fn());
vi.mock('node:child_process', () => ({ spawn: launch }));
vi.mock('../authorization-diagnostics.js', () => ({ authorizationDiagnostic: () => 'synthetic-id' }));
import { WindowsInteractiveWorkspaceAuthorizer } from '../workspace-authorizer.js';

// Protocol regression tests ONLY. These do not establish that a desktop UI exists.
afterEach(() => { vi.useRealTimers(); launch.mockReset(); });
describe.skipIf(process.platform !== 'win32')('Windows child protocol (synthetic, not GUI evidence)', () => {
  function start(signal?: AbortSignal) {
    const child = Object.assign(new EventEmitter(), { stdout: new PassThrough(), stderr: new PassThrough(), pid: 123, kill: vi.fn() });
    launch.mockReturnValue(child);
    const authorizer = new WindowsInteractiveWorkspaceAuthorizer(new URL('../../../../scripts/qap-interactive-dialog.ps1', import.meta.url).pathname.replace(/^\//, ''));
    const result = authorizer.requestAuthorization({ requestedPath: 'C:\\fixture', canonicalPath: 'C:\\fixture' }, signal);
    return { child, result };
  }
  it('exit 1 without REJECTED is a launch error, not human rejection', async () => {
    const { child, result } = start(); child.emit('close', 1);
    expect(await result).toMatchObject({ decision: 'unavailable', code: 'workspace_dialog_start_failed' });
  });
  it('does not accept a substring such as NOT_AUTHORIZED', async () => {
    const { child, result } = start(); child.stderr.write('QAP_DIALOG_SHOWN'); child.stdout.write('NOT_AUTHORIZED'); child.emit('close', 0);
    expect(await result).toMatchObject({ decision: 'unavailable' });
  });
  it('handles a shown marker split across pipe chunks', async () => {
    const { child, result } = start(); child.stderr.write('QAP_DIALOG_'); child.stderr.write('SHOWN\n'); child.stdout.write('REJECTED\r\n'); child.emit('close', 1);
    expect(await result).toMatchObject({ decision: 'rejected' });
  });
  it('spawn failure exposes a fixed public classification', async () => {
    const { child, result } = start(); child.emit('error', Object.assign(new Error('PRIVATE'), { code: 'EACCES' }));
    const value = await result;
    expect(value).toMatchObject({ code: 'workspace_dialog_start_failed' });
    expect(JSON.stringify(value)).not.toContain('PRIVATE');
  });
  it('watchdog terminates the child and reports expiration', async () => {
    vi.useFakeTimers(); const { child, result } = start(); await vi.advanceTimersByTimeAsync(125_000);
    expect(await result).toMatchObject({ decision: 'cancelled', code: 'workspace_authorization_expired' });
    expect(child.kill).toHaveBeenCalledOnce();
  });
});
