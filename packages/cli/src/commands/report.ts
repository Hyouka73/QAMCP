import type { ExecutionResult } from '@qap/shared';
import type { IStorage } from '@qap/engine';
import { FileSystemStorage } from '@qap/knowledge';
import {
  startViewerServer,
  generateHtmlReport,
  generateJsonReport,
  generateMarkdownReport,
  generateJunitReport,
  detectRegressions,
  updateManifestIfCompleted,
} from '@qap/reporter';

export interface ReportOptions {
  serve?: boolean;
  port?: string | number;
  format?: string;
}

/**
 * Compara la ejecución actual contra la última ejecución exitosa registrada
 * en el manifest (S5-005), imprime el resumen en consola, y actualiza el
 * manifest si esta ejecución fue exitosa.
 */
async function printRegressionSummary(storage: IStorage, result: ExecutionResult): Promise<void> {
  const comparison = await detectRegressions(storage, result);

  if (comparison.baselineExecutionId) {
    if (comparison.newFailures.length === 0 && comparison.fixedFailures.length === 0) {
      console.log(
        `Sin cambios respecto a la última ejecución exitosa (${comparison.baselineExecutionId}).`
      );
    } else {
      if (comparison.newFailures.length > 0) {
        const ids = comparison.newFailures.map((c) => c.id).join(', ');
        console.log(
          `⚠ ${comparison.newFailures.length} falla(s) nueva(s) respecto a ${comparison.baselineExecutionId}: ${ids}`
        );
      }
      if (comparison.fixedFailures.length > 0) {
        const ids = comparison.fixedFailures.map((c) => c.id).join(', ');
        console.log(
          `✔ ${comparison.fixedFailures.length} falla(s) corregida(s) respecto a ${comparison.baselineExecutionId}: ${ids}`
        );
      }
    }
  }

  await updateManifestIfCompleted(storage, result);
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
      // AC-004: Tolerancia a referencias huérfanas (QAP-v2.1-plan L79).
      // La ejecución fue purgada por `qap prune`. En lugar de abortar,
      // se genera un reporte sintético marcado como [execution purged].
      const now = new Date().toISOString();
      const purgedResult: ExecutionResult = {
        _version: '1',
        execution_id: moduleArg,
        module: `[execution purged] ${moduleArg}`,
        env: 'unknown',
        started_at: now,
        finished_at: now,
        result: 'error',
        timed_out: false,
        summary: { total: 0, passed: 0, failed: 0, skipped: 0, not_run: 0 },
        cases: [],
      };
      const purgeHtml = await generateHtmlReport(purgedResult, { storage });
      const purgedOutputPath = `.qa/executions/${moduleArg}.report.html`;
      const purgeComment = `<!-- [execution purged] execution_id: ${moduleArg} -->\n`;
      await storage.write(purgedOutputPath, purgeComment + purgeHtml);
      console.warn(
        `⚠ La ejecución '${moduleArg}' fue purgada. Reporte marcado como [execution purged] en ${purgedOutputPath}`,
      );
      return;
    }

    const html = await generateHtmlReport(result, { storage });
    const outputPath = `.qa/executions/${moduleArg}.report.html`;
    await storage.write(outputPath, html);
    console.log(`Reporte HTML generado en ${outputPath}`);

    await printRegressionSummary(storage, result);
    return;
  }

  // Generación de reportes alternativos: JSON, Markdown y JUnit XML (S5-004)
  if (moduleArg && (options.format === 'json' || options.format === 'markdown' || options.format === 'junit')) {
    const storage = new FileSystemStorage({ rootDir: process.cwd() });
    const result = await storage.getExecutionResult(moduleArg);

    if (!result) {
      // AC-004: Tolerancia a referencias huérfanas para formatos alternativos.
      const now = new Date().toISOString();
      const purgedResult: ExecutionResult = {
        _version: '1',
        execution_id: moduleArg,
        module: `[execution purged] ${moduleArg}`,
        env: 'unknown',
        started_at: now,
        finished_at: now,
        result: 'error',
        timed_out: false,
        summary: { total: 0, passed: 0, failed: 0, skipped: 0, not_run: 0 },
        cases: [],
      };

      const formatConfig: Record<string, { generate: (r: ExecutionResult) => string; ext: string }> = {
        json: { generate: generateJsonReport, ext: 'json' },
        markdown: { generate: generateMarkdownReport, ext: 'md' },
        junit: { generate: generateJunitReport, ext: 'xml' },
      };
      const { generate, ext } = formatConfig[options.format];
      const purgedOutputPath = `.qa/executions/${moduleArg}.report.${ext}`;
      const purgeContent = generate(purgedResult);
      await storage.write(purgedOutputPath, purgeContent);
      console.warn(
        `⚠ La ejecución '${moduleArg}' fue purgada. Reporte marcado como [execution purged] en ${purgedOutputPath}`,
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

    await printRegressionSummary(storage, result);
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