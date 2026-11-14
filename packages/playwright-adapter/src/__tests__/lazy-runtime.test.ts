import { expect, it, vi } from 'vitest';

vi.mock('playwright-core', () => { throw new Error('Driver must not initialize during a metadata-only import'); });

it('E01: importing discovery contracts does not initialize the browser driver', async () => {
  const adapter = await import('../index.js');
  expect(adapter.BlackBoxCrawler).toBeTypeOf('function');
  expect(adapter.launchBrowser).toBeTypeOf('function');
});
