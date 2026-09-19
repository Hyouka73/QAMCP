import { Command } from 'commander';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as reporterModule from '@qap/reporter';

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

  it('debe registrar el comando report con las opciones --serve y --port', () => {
    const program = new Command();
    registerCommands(program);

    const reportCmd = program.commands.find((c) => c.name() === 'report');
    expect(reportCmd).toBeDefined();

    const options = reportCmd?.options.map((o) => o.long);
    expect(options).toContain('--serve');
    expect(options).toContain('--port');
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
});
