import { describe, it, expect } from 'vitest';
import type { IStorage } from '@qap/engine';
import type { ExecutionResult } from '@qap/shared';

import { generateHtmlReport } from '../generators/html-report.js';

class MockStorage implements Partial<IStorage> {
  private files = new Map<string, Buffer>();

  setBinaryFile(path: string, content: Buffer): void {
    this.files.set(path, content);
  }

  async exists(path: string): Promise<boolean> {
    return this.files.has(path);
  }

  async readBuffer(path: string): Promise<Buffer> {
    const content = this.files.get(path);
    if (!content) throw new Error(`Not found: ${path}`);
    return content;
  }
}

function buildResult(overrides: Partial<ExecutionResult> = {}): ExecutionResult {
  return {
    _version: '1',
    execution_id: 'test-exec',
    module: 'checkout',
    env: 'staging',
    started_at: '2026-09-19T19:10:00Z',
    finished_at: '2026-09-19T19:10:18Z',
    result: 'passed',
    timed_out: false,
    summary: { total: 1, passed: 1, failed: 0, skipped: 0, not_run: 0 },
    cases: [
      {
        id: 'TC-001',
        title: 'Debe completar el checkout',
        result: 'passed',
        duration_ms: 500,
        steps: [
          { action: 'click', selector: '#pay', status: 'passed', duration_ms: 100 },
        ],
      },
    ],
    ...overrides,
  };
}

describe('generateHtmlReport (S5-003)', () => {
  it('debe generar un HTML autocontenido con CSS y JS embebidos', async () => {
    const storage = new MockStorage();
    const html = await generateHtmlReport(buildResult(), { storage: storage as unknown as IStorage });

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<style>');
    expect(html).toContain('<script>');
    expect(html).not.toContain('<link rel="stylesheet"');
  });

  it('debe embeber una screenshot como data URI base64', async () => {
    const storage = new MockStorage();
    const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
    storage.setBinaryFile('shot.png', pngBytes);

    const result = buildResult({
      cases: [
        {
          id: 'TC-001',
          title: 'Con screenshot',
          result: 'passed',
          steps: [{ action: 'click', status: 'passed', screenshot: 'shot.png' }],
        },
      ],
    });

    const html = await generateHtmlReport(result, { storage: storage as unknown as IStorage });
    const expectedBase64 = pngBytes.toString('base64');

    expect(html).toContain(`data:image/png;base64,${expectedBase64}`);
  });

  it('no debe romper el reporte si una screenshot referenciada no existe', async () => {
    const storage = new MockStorage();
    const result = buildResult({
      cases: [
        {
          id: 'TC-001',
          title: 'Sin screenshot real',
          result: 'passed',
          steps: [{ action: 'click', status: 'passed', screenshot: 'no-existe.png' }],
        },
      ],
    });

    const html = await generateHtmlReport(result, { storage: storage as unknown as IStorage });
    expect(html).toContain('Sin screenshot real');
    expect(html).not.toContain('data:image/png;base64,undefined');
  });

  it('debe incluir botones de filtro por estado', async () => {
    const storage = new MockStorage();
    const html = await generateHtmlReport(buildResult(), { storage: storage as unknown as IStorage });

    expect(html).toContain('data-filter="all"');
    expect(html).toContain('data-filter="passed"');
    expect(html).toContain('data-filter="failed"');
  });

  it('debe mostrar el resumen de totales', async () => {
    const storage = new MockStorage();
    const html = await generateHtmlReport(buildResult(), { storage: storage as unknown as IStorage });

    expect(html).toContain('Total: <strong>1</strong>');
    expect(html).toContain('Pasaron: <strong>1</strong>');
  });

  it('debe renderizar el desglose explícito paso a paso', async () => {
    const storage = new MockStorage();
    const result = buildResult({
      cases: [
        {
          id: 'TC-STEP-TEST',
          title: 'Caso con múltiples pasos',
          result: 'passed',
          steps: [
            { action: 'navigate', selector: 'https://app.com/login', status: 'passed', duration_ms: 200 },
            { action: 'fill_input', selector: '#username', status: 'passed', duration_ms: 50, message: 'Usuario ingresado' },
          ],
        },
      ],
    });

    const html = await generateHtmlReport(result, { storage: storage as unknown as IStorage });

    expect(html).toContain('navigate');
    expect(html).toContain('https://app.com/login');
    expect(html).toContain('fill_input');
    expect(html).toContain('#username');
    expect(html).toContain('Usuario ingresado');
  });

  it('debe sanitizar correctamente las cadenas para evitar vulnerabilidades XSS', async () => {
    const storage = new MockStorage();
    const result = buildResult({
      module: '<script>alert("xss-module")</script>',
      cases: [
        {
          id: 'TC-XSS',
          title: '<img src=x onerror=alert(1)>',
          result: 'failed',
          steps: [
            {
              action: 'click',
              selector: '<button id="xss">Click</button>',
              status: 'failed',
              message: 'Fallo con <script>bad()</script>',
            },
          ],
        },
      ],
    });

    const html = await generateHtmlReport(result, { storage: storage as unknown as IStorage });

    // Confirmamos que el HTML escapa las etiquetas peligrosas
    expect(html).not.toContain('<script>alert("xss-module")</script>');
    expect(html).toContain('&lt;script&gt;alert(&quot;xss-module&quot;)&lt;/script&gt;');

    expect(html).not.toContain('<img src=x onerror=alert(1)>');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');

    expect(html).not.toContain('<button id="xss">Click</button>');
    expect(html).toContain('&lt;button id=&quot;xss&quot;&gt;Click&lt;/button&gt;');

    expect(html).not.toContain('<script>bad()</script>');
    expect(html).toContain('&lt;script&gt;bad()&lt;/script&gt;');
  });
});