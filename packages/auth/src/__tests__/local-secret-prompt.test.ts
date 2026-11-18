import { spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { promptLocalSecret } from '../local-secret-prompt.js';

vi.mock('node:child_process', () => ({ spawn: vi.fn() }));

function fakeChild() {
  const child = Object.assign(new EventEmitter(), {
    stdin: new PassThrough(),
    stdout: new PassThrough(),
    stderr: new PassThrough(),
    kill: vi.fn(),
  });
  vi.mocked(spawn).mockReturnValue(child as unknown as ReturnType<typeof spawn>);
  return child;
}

describe('local credential dialog protocol', () => {
  const platform = Object.getOwnPropertyDescriptor(process, 'platform')!;

  beforeEach(() => {
    Object.defineProperty(process, 'platform', { ...platform, value: 'win32' });
    vi.useFakeTimers();
  });

  afterEach(() => {
    Object.defineProperty(process, 'platform', platform);
    vi.useRealTimers();
  });

  it('kills a started process that does not acknowledge rendering', async () => {
    const child = fakeChild();
    const onPresented = vi.fn();
    const pending = promptLocalSecret('fixture', undefined, onPresented);
    const check = expect(pending).rejects.toMatchObject({ code: 'DIALOG_NOT_PRESENTED' });
    child.emit('spawn');
    child.stderr.write('QAP_CREDENTIAL_DIALOG_RENDERED_EXTRA\r\n');
    await vi.advanceTimersByTimeAsync(8000);
    await check;
    expect(onPresented).not.toHaveBeenCalled();
    expect(child.kill).toHaveBeenCalledOnce();
  });

  it('acknowledges a fragmented render marker and returns the accepted value verbatim', async () => {
    const child = fakeChild();
    const onPresented = vi.fn();
    const pending = promptLocalSecret('fixture', undefined, onPresented);
    child.emit('spawn');
    child.stderr.write('#< CLIXML\r\nQAP_CREDENTIAL_');
    child.stderr.write('DIALOG_RENDERED\r\n');
    expect(onPresented).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(8000);
    child.stdout.write(' synthetic ñ ');
    child.emit('close', 0);
    await expect(pending).resolves.toBe(' synthetic ñ ');
  });

  it('discards private output when no render marker was received', async () => {
    const child = fakeChild();
    const pending = promptLocalSecret('fixture');
    child.emit('spawn');
    child.stdout.write('synthetic');
    child.emit('close', 0);
    await expect(pending).rejects.toMatchObject({ code: 'DIALOG_NOT_PRESENTED' });
  });

  it('distinguishes a cancellation from an unavailable desktop', async () => {
    const child = fakeChild();
    const pending = promptLocalSecret('fixture');
    child.emit('spawn');
    child.stderr.write('QAP_CREDENTIAL_DIALOG_RENDERED\r\n');
    child.emit('close', 2);
    await expect(pending).resolves.toBeUndefined();

    const headless = fakeChild();
    const unavailable = promptLocalSecret('fixture');
    headless.emit('spawn');
    headless.emit('close', 3);
    await expect(unavailable).rejects.toMatchObject({ code: 'DIALOG_DESKTOP_UNAVAILABLE' });
  });
});
