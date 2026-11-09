import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { FileSystemStorage, LockManager } from '@qap/knowledge';
import { chromium, type Browser, type BrowserContext } from 'playwright-core';
import { describe, expect, it, vi } from 'vitest';

import { PlaywrightRunner } from '../src/runner.js';

describe('014-CODEX-004 cancellation and resource drain', () => {
  it.each(['launch', 'context'] as const)('drains a late %s before releasing the lock and deleting its root', async stage => {
    const root = mkdtempSync(join(tmpdir(), 'qap-drain-'));
    const storage = new FileSystemStorage({ rootDir: root });
    await storage.saveTestCase('orders', {
      _version: '1', id: 'TC-001', name: 'Cancellation fixture',
      steps: [{ type: 'navigate', url: 'https://example.test' }],
    });
    const controller = new AbortController();
    let enter!: () => void;
    let resume!: () => void;
    const entered = new Promise<void>(resolve => { enter = resolve; });
    const barrier = new Promise<void>(resolve => { resume = resolve; });
    const context = { close: vi.fn().mockResolvedValue(undefined) };
    const browser = {
      close: vi.fn().mockResolvedValue(undefined),
      newContext: vi.fn(async () => {
        if (stage === 'context') { enter(); await barrier; }
        return context as unknown as BrowserContext;
      }),
    };
    const launch = vi.spyOn(chromium, 'launch').mockImplementation(async () => {
      if (stage === 'launch') { enter(); await barrier; }
      return browser as unknown as Browser;
    });
    const operation = new PlaywrightRunner().execute({ modules: ['orders'], cases: ['TC-001'] }, {
      projectRoot: root, signal: controller.signal, allowImplicitAuth: false,
    });
    // Attach a handler now; failures remain observable by awaiting operation.
    const drained = operation.then(() => undefined, () => undefined);
    try {
      await Promise.race([entered, operation.then(() => { throw new Error('Runner completed before reaching the cancellation barrier'); })]);
      controller.abort();
      expect(existsSync(join(root, '.qa/cache/locks/orders.lock'))).toBe(true);
      resume();
      const result = await operation;
      expect(result.result).toBe('error');
      expect(result.summary).toMatchObject({ passed: 0, not_run: 1 });
      expect(browser.close).toHaveBeenCalled();
      if (stage === 'launch') expect(browser.newContext).not.toHaveBeenCalled();
      else expect(context.close).toHaveBeenCalled();
      expect(existsSync(join(root, '.qa/cache/locks/orders.lock'))).toBe(false);
      const release = await new LockManager({ rootDir: root }).acquireModuleLock('orders');
      await release();
    } finally {
      controller.abort(); resume(); await drained;
      launch.mockRestore();
      rmSync(root, { recursive: true, force: true });
    }
  });
});
