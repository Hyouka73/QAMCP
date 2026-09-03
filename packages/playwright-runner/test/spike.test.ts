import { describe, it, expect } from 'vitest';

import { runChromiumPrototype } from './spike.js';

describe('Spike tecnico: Chromium headless con playwright-core', () => {
  it('debe lanzar Chromium, navegar y resolver un selector sin errores', async () => {
    const result = await runChromiumPrototype('https://example.com');

    expect(result.title).toBeTruthy();
    expect(result.headerText).toBeTruthy();
    expect(result.executionTimeMs).toBeGreaterThan(0);
  }, 30000);
});