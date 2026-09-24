import { Command } from 'commander';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as reporterModule from '@qap/reporter';
import { FileSystemStorage } from '@qap/knowledge';

import { registerCommands } from '../commands.js';
import { handleReport } from '../commands/report.js';

describe('CLI report & serve commands (S5-006)', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('debe registrar el comando report con las opciones --serve, --port y --format', () => {
    const program = new Command();
    registerCommands(program);

    const reportCmd = program.commands.find((c) => c.name() === 'report');
    expect(reportCmd).toBeDefined();

    const options = reportCmd?.options.map((o) => o.long);
    expect(options).toContain('--serve');
    expect(options).toContain('--port');
    expect(options).toContain('--format');
  });

  it('debe registrar el comando serve como alias directo', () => {
    const program = new Command();
    registerCommands(program);

    const serveCmd = program.commands.find((c) => c.name() === 'serve');
    expect(serveCmd).toBeDefined();

    const options = serveCmd?.options.map((o) => o.long);
    expect(options).toContain('--port');
  });

  it('debe iniciar el servidor interactivo cuando se llama con serve: true', async () => {
    const mockClose = vi.fn().mockResolvedValue(undefined);
    const mockStartServer = vi.spyOn(reporterModule, 'startViewerServer').mockResolvedValue({
      server: {} as never,
      port: 9280,
      host: 'localhost',
      url: 'http://localhost:9280',
      close: mockClose,
    });

    const reportPromise = handleReport(undefined, { serve: true, port: '9280' });

    // Esperar un tick para que se invoque startViewerServer
    await new Promise((r) => setTimeout(r, 10));

    expect(mockStartServer).toHaveBeenCalledWith(
      expect.objectContaining({
        port: 9280,
        host: 'localhost',
      })
    );

    // Simular evento SIGINT para finalizar el servidor
    process.emit('SIGINT');

    await reportPromise;
    expect(mockClose).toHaveBeenCalled();
  });

  it('debe emitir mensaje informativo cuando se pasa un modulo sin --serve', async () => {
    await handleReport('simulation', {});
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("Generando reporte para el módulo 'simulation'...")
    );
  });

  it('debe mostrar error si no encuentra la ejecución al generar reporte HTML', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(FileSystemStorage.prototype, 'getExecutionResult').mockResolvedValue(null);

    await handleReport('inexistente', { format: 'html' });

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("No se encontró un resultado de ejecución con id 'inexistente'")
    );
    errorSpy.mockRestore();
  });

  it('debe generar y persistir el reporte HTML si la ejecución existe', async () => {
    const mockExecutionResult = {
      _version: '1',
      execution_id: 'exec-123',
      module: 'checkout',
      env: 'staging',
      started_at: '2026-09-19T19:10:00Z',
      finished_at: '2026-09-19T19:10:18Z',
      result: 'passed' as const,
      timed_out: false,
      summary: { total: 1, passed: 1, failed: 0, skipped: 0, not_run: 0 },
      cases: [],
    };

    vi.spyOn(FileSystemStorage.prototype, 'getExecutionResult').mockResolvedValue(mockExecutionResult);
    const writeSpy = vi.spyOn(FileSystemStorage.prototype, 'write').mockResolvedValue(undefined);
    const generateSpy = vi.spyOn(reporterModule, 'generateHtmlReport').mockResolvedValue('<!DOCTYPE html><html></html>');

    await handleReport('exec-123', { format: 'html' });

    expect(generateSpy).toHaveBeenCalledWith(mockExecutionResult, expect.any(Object));
    expect(writeSpy).toHaveBeenCalledWith(
      '.qa/executions/exec-123.report.html',
      '<!DOCTYPE html><html></html>'
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Reporte HTML generado en .qa/executions/exec-123.report.html')
    );
  });
});
