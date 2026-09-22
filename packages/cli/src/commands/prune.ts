import fs from 'node:fs';
import path from 'node:path';

import { QapDatabase, PruningEngine, TTL_DEFAULTS } from '@qap/reporter';

export interface PruneCommandOptions {
  olderThanDays?: string | number;
  maxBytes?: string | number;
  dryRun?: boolean;
  runtimeDir?: string;
}

export interface PruneAuditResult {
  candidateRunsCount: number;
  candidateArtifactsCount: number;
  candidateBytes: number;
  isDryRun: boolean;
}

/**
 * Subcomando `qap prune` (QAP v3.0 Fase 3).
 *
 * Opciones:
 *  --older-than-days <dias> : TTL para registros completos
 *  --max-bytes <bytes>      : Cuota máxima permitida
 *  --dry-run                : Audita y reporta espacio liberable sin eliminar archivos
 */
export async function handlePrune(options: PruneCommandOptions = {}): Promise<PruneAuditResult> {
  await Promise.resolve();
  const runtimeDir = options.runtimeDir || path.resolve(process.cwd(), '.qa/runtime');

  if (!fs.existsSync(runtimeDir)) {
    process.stdout.write(`El directorio runtime no existe en ${runtimeDir}. No hay nada para podar.\n`);
    return {
      candidateRunsCount: 0,
      candidateArtifactsCount: 0,
      candidateBytes: 0,
      isDryRun: Boolean(options.dryRun),
    };
  }

  const db = new QapDatabase(runtimeDir);
  const engine = new PruningEngine(db, runtimeDir);

  const olderThanDays = options.olderThanDays ? Number(options.olderThanDays) : undefined;
  const maxBytes = options.maxBytes ? Number(options.maxBytes) : undefined;

  const recordTtlMs = olderThanDays ? olderThanDays * 24 * 60 * 60 * 1000 : TTL_DEFAULTS.RECORD_MS;

  if (options.dryRun) {
    // Simulación dry-run: auditar sin modificar disco ni base de datos
    const now = Date.now();
    let candidateRunsCount = 0;
    let candidateArtifactsCount = 0;
    let candidateBytes = 0;

    const runs = db.listRuns();
    const runsBaseDir = path.join(runtimeDir, 'runs');

    for (const run of runs) {
      if (run.pinned === 1) continue;

      const ageMs = now - new Date(run.started_at).getTime();
      const runDir = path.join(runsBaseDir, run.run_id);

      if (ageMs >= recordTtlMs) {
        candidateRunsCount++;
        if (fs.existsSync(runDir)) {
          candidateBytes += calculateDirectorySize(runDir);
        }
      } else {
        const artifactsDir = path.join(runDir, 'artifacts');
        if (fs.existsSync(artifactsDir)) {
          const files = fs.readdirSync(artifactsDir);
          for (const file of files) {
            const isVideo = file.endsWith('.webm') || file.endsWith('.mp4');
            const isTrace = file.endsWith('.zip');
            if ((isVideo && ageMs >= TTL_DEFAULTS.VIDEO_MS) || (isTrace && ageMs >= TTL_DEFAULTS.TRACE_MS)) {
              try {
                const stat = fs.statSync(path.join(artifactsDir, file));
                candidateBytes += stat.size;
                candidateArtifactsCount++;
              } catch {
                // Continuar
              }
            }
          }
        }
      }
    }

    db.close();

    process.stdout.write(
      `[DRY RUN] Espacio liberable estimado: ${candidateBytes} bytes (${candidateRunsCount} corrida(s) candidata(s), ${candidateArtifactsCount} artefacto(s) multimedia). Ningún archivo fue eliminado.\n`
    );

    return {
      candidateRunsCount,
      candidateArtifactsCount,
      candidateBytes,
      isDryRun: true,
    };
  }

  // Poda efectiva
  const result = engine.prune({
    recordTtlMs,
    maxDiskUsageBytes: maxBytes,
  });

  db.close();

  process.stdout.write(
    `✔ Poda completada: ${result.bytesFreed} bytes liberados. ${result.deletedRunsCount} corrida(s) eliminada(s), ${result.purgedArtifactsCount} artefacto(s) multimedia purgados.\n`
  );

  return {
    candidateRunsCount: result.deletedRunsCount,
    candidateArtifactsCount: result.purgedArtifactsCount,
    candidateBytes: result.bytesFreed,
    isDryRun: false,
  };
}

function calculateDirectorySize(dirPath: string): number {
  let size = 0;
  if (!fs.existsSync(dirPath)) return 0;

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      size += calculateDirectorySize(full);
    } else if (entry.isFile()) {
      try {
        size += fs.statSync(full).size;
      } catch {
        // Continuar
      }
    }
  }
  return size;
}
