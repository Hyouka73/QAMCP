import { expect, it, vi } from 'vitest';

vi.mock('playwright-core', () => { throw new Error('Driver must not initialize before browser execution'); });

it('E01: importing the runner and session contracts does not initialize the browser driver', async () => {
  const runner = await import('../index.js');
  expect(runner.PlaywrightRunner).toBeTypeOf('function');
  expect(runner.resolveModuleSession).toBeTypeOf('function');
});
