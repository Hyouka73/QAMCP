import { randomUUID } from 'node:crypto';
import { appendFileSync, existsSync, lstatSync, mkdirSync, realpathSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, parse, resolve } from 'node:path';

export interface TechnicalDiagnosticEntry {
  event: string;
  diagnostic_id?: string;
  tool?: string;
  targetPath?: string;
  error?: {
    name?: string;
    message?: string;
    stack?: string;
  } | string;
  [key: string]: unknown;
}

let techLogPath: string | undefined;

/**
 * Protected technical error diagnostic logger.
 * Writes structured diagnostics to ~/.qap/diagnostics/technical_errors.log
 * and optionally to project-level .qa/logs/technical_errors.log.
 * Preserves MCP stdout isolation by directing internal diagnostics only to files or stderr.
 */
export function logTechnicalDiagnostic(details: TechnicalDiagnosticEntry, projectRoot?: string): string {
  const diagnosticId = details.diagnostic_id ?? randomUUID();
  try {
    const entry = JSON.stringify({
      at: new Date().toISOString(),
      pid: process.pid,
      nodeVersion: process.version,
      nodeExecutable: process.execPath,
      diagnostic_id: diagnosticId,
      ...details,
    }) + '\n';

    // 1. ~/.qap/diagnostics/technical_errors.log
    if (!techLogPath) {
      const base = join(homedir(), '.qap', 'diagnostics');
      let part = parse(base).root;
      for (const segment of base.slice(part.length).split(/[\\/]/).filter(Boolean)) {
        part = join(part, segment);
        if (!existsSync(part)) {
          mkdirSync(part, { recursive: true, mode: 0o700 });
        }
        if (lstatSync(part).isSymbolicLink() || realpathSync(part).toLowerCase() !== resolve(part).toLowerCase()) {
          throw new Error('Unsafe log directory');
        }
      }
      techLogPath = join(base, 'technical_errors.log');
    }
    appendFileSync(techLogPath, entry, { mode: 0o600 });

    // 2. Project local .qa/logs/technical_errors.log if accessible
    if (projectRoot && existsSync(projectRoot)) {
      const qaLogs = join(projectRoot, '.qa', 'logs');
      if (!existsSync(qaLogs)) {
        mkdirSync(qaLogs, { recursive: true, mode: 0o700 });
      }
      appendFileSync(join(qaLogs, 'technical_errors.log'), entry, { mode: 0o600 });
    }
  } catch (err) {
    console.error('[QAP MCP Technical Diagnostic Log Error]', err);
  }
  return diagnosticId;
}
