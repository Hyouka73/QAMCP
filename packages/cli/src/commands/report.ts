import { FileSystemStorage } from '@qap/knowledge';
import { startViewerServer } from '@qap/reporter';

export interface ReportOptions {
  serve?: boolean;
  port?: string | number;
}

/**
 * Maneja el comando `qap report` y su modalidad interactiva `--serve` (S5-006).
 */
export async function handleReport(moduleArg?: string, options: ReportOptions = {}): Promise<void> {
  if (options.serve) {
    const parsedPort = options.port !== undefined ? Number(options.port) : 9280;
    const targetPort = Number.isNaN(parsedPort) ? 9280 : parsedPort;

    const storage = new FileSystemStorage({ rootDir: process.cwd() });

    const serverInstance = await startViewerServer({
      storage,
      port: targetPort,
      host: 'localhost',
    });

    // Mantener el proceso vivo hasta recibir señal de interrupción (Ctrl+C)
    await new Promise<void>((resolve) => {
      const shutdown = async (): Promise<void> => {
        console.log('\nDeteniendo servidor QAP Viewer...');
        try {
          await serverInstance.close();
        } catch {
          // Ignorar error al cerrar
        }
        resolve();
      };

      process.once('SIGINT', () => void shutdown());
      process.once('SIGTERM', () => void shutdown());
    });

    return;
  }

  // Generación estática de reporte por módulo (Sprint 5)
  if (moduleArg) {
    console.log(`Generando reporte para el módulo '${moduleArg}'...`);
    console.log(`Reporte para '${moduleArg}' generado. Para explorar la memoria persistente y el grafo interactivo ejecuta: qap report --serve`);
  } else {
    console.log('Uso: qap report <modulo> o qap report --serve [--port <port>]');
  }
}
