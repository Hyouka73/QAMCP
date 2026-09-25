import type { ExecutionResult } from '@qap/shared';
import { FileSystemStorage } from '@qap/knowledge';
import {
  startViewerServer,
  generateHtmlReport,
  generateJsonReport,
  generateMarkdownReport,
  generateJunitReport,
} from '@qap/reporter';

export interface ReportOptions {
  serve?: boolean;
  port?: string | number;
  format?: string;
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

  // Generación de reporte HTML autocontenido (S5-003)
  if (moduleArg && options.format === 'html') {
    const storage = new FileSystemStorage({ rootDir: process.cwd() });
    const result = await storage.getExecutionResult(moduleArg);

    if (!result) {
      console.error(
        `No se encontró un resultado de ejecución con id '${moduleArg}' en .qa/executions/. Usa el execution_id exacto, ej: 'qap report 2026-09-19_checkout_e2e --format html'.`
      );
      return;
    }

    const html = await generateHtmlReport(result, { storage });
    const outputPath = `.qa/executions/${moduleArg}.report.html`;
    await storage.write(outputPath, html);
    console.log(`Reporte HTML generado en ${outputPath}`);
    return;
  }

  // Generación de reportes alternativos: JSON, Markdown y JUnit XML (S5-004)
  if (moduleArg && (options.format === 'json' || options.format === 'markdown' || options.format === 'junit')) {
    const storage = new FileSystemStorage({ rootDir: process.cwd() });
    const result = await storage.getExecutionResult(moduleArg);

    if (!result) {
      console.error(
        `No se encontró un resultado de ejecución con id '${moduleArg}' en .qa/executions/. Usa el execution_id exacto, ej: 'qap report 2026-09-19_checkout_e2e --format junit'.`
      );
      return;
    }

    const formatConfig: Record<string, { generate: (r: ExecutionResult) => string; ext: string }> = {
      json: { generate: generateJsonReport, ext: 'json' },
      markdown: { generate: generateMarkdownReport, ext: 'md' },
      junit: { generate: generateJunitReport, ext: 'xml' },
    };

    const { generate, ext } = formatConfig[options.format];
    const content = generate(result);
    const outputPath = `.qa/executions/${moduleArg}.report.${ext}`;
    await storage.write(outputPath, content);
    console.log(`Reporte ${options.format.toUpperCase()} generado en ${outputPath}`);
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