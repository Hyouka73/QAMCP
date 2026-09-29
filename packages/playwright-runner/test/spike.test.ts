import { describe, it, expect } from 'vitest';
import { runChromiumPrototype } from '../test/spike';

describe('Spike tecnico: Chromium headless con playwright-core', () => {
  it('debe lanzar Chromium, navegar y resolver un selector sin errores', async () => {
    const result = await runChromiumPrototype();

    expect(result.title).toBe('Example Domain');
    expect(result.headerText).toBe('Example Domain');
    expect(result.executionTimeMs).toBeGreaterThan(0);
  }, 10000);
});