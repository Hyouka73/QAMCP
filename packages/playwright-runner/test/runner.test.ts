import { describe, it, expect } from 'vitest';

import { PlaywrightRunner } from '../src/runner.js';

describe('PlaywrightRunner (S7-001)', () => {
  it('ejecuta un plan sin casos y devuelve un ExecutionResult válido', async () => {
    const runner = new PlaywrightRunner();

    const result = await runner.execute(
      { modules: ['demo-module'], cases: [] },
      { headless: true }
    );

    // Campos obligatorios del contrato ExecutionResult (S5-001)
    expect(result._version).toBe('1');
    expect(result.module).toBe('demo-module');
    expect(typeof result.started_at).toBe('string');
    expect(typeof result.finished_at).toBe('string');
    expect(['passed', 'failed', 'partial', 'error']).toContain(result.result);
    expect(typeof result.timed_out).toBe('boolean');
    expect(result.summary).toBeDefined();
    expect(Array.isArray(result.cases)).toBe(true);

    // Sin casos en el plan, debe considerarse "passed" (0 fallos)
    expect(result.result).toBe('passed');
    expect(result.summary.total).toBe(0);
  }, 15000);

  it('ejecuta un caso real usando storageResolver y navega sin consumir tokens de IA', async () => {
    const runner = new PlaywrightRunner();

    const result = await runner.execute(
      { modules: ['demo-module'], cases: ['case-1'] },
      {
        headless: true,
        storageResolver: async () => ({
          _version: '1',
          id: 'a1b2c3d4-e5f6-4789-a123-456789abcdef',
          name: 'Caso de prueba de humo',
          steps: [
            {
              type: 'navigate',
              url: 'data:text/html,<html><body><h1 id="ok">Listo</h1></body></html>',
            },
            { type: 'assert', selector: '#ok', assertion_type: 'visible' },
          ],
        }),
      }
    );

    expect(result.result).toBe('passed');
    expect(result.cases).toHaveLength(1);
    expect(result.cases[0].id).toBe('case-1');
    expect(result.cases[0].title).toBe('Caso de prueba de humo');
    expect(result.cases[0].result).toBe('passed');
  }, 15000);
});