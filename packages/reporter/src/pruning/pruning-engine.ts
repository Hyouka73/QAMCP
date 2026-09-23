import fs from 'node:fs';
import path from 'node:path';

import { QapDatabase } from '../persistence/sqlite-client.js';

export const TTL_DEFAULTS = {
  VIDEO_MS: 7 * 24 * 60 * 60 * 1000,    // 7 días
  TRACE_MS: 14 * 24 * 60 * 60 * 1000,   // 14 días
  RECORD_MS: 30 * 24 * 60 * 60 * 1000,  // 30 días
} as const;

export interface PruningPolicy {
  videoTtlMs?: number;
  traceTtlMs?: number;
  recordTtlMs?: number;
  maxDiskUsageBytes?: number;
}

export interface PruneResult {
  deletedRunsCount: number;
  purgedArtifactsCount: number;
  bytesFreed: number;
}

/**
 * Motor de Poda y Recolección de Basura de QAP v3.0 (Decisión Canónica 6).
 *
 * Orden estricto de evaluación:
 * 1. Exclusión de pinned: true (inmune a toda poda por TTL y por cuota).
 * 2. TTL diferenciado:
 *    - Videos: 7 días
 *    - Trazas .zip: 14 días
 *    - run.json y fila en SQLite: 30 días
 * 3. Cuota de disco dura (LRU): solo purga multimedia antigua, preservando siempre
 *    los registros de resultados y aserciones.
 */
export class PruningEngine {
  private db: QapDatabase;
  private runtimeDir: string;

  constructor(db: QapDatabase, runtimeDir: string) {
    this.db = db;
    this.runtimeDir = runtimeDir;
  }

  prune(policy: PruningPolicy = {}, now: number = Date.now()): PruneResult {
    const videoTtl = policy.videoTtlMs ?? TTL_DEFAULTS.VIDEO_MS;
    const traceTtl = policy.traceTtlMs ?? TTL_DEFAULTS.TRACE_MS;
    const recordTtl = policy.recordTtlMs ?? TTL_DEFAULTS.RECORD_MS;

    let deletedRunsCount = 0;
    let purgedArtifactsCount = 0;
    let bytesFreed = 0;

    const runs = this.db.listRuns();

    for (const run of runs) {
      // Regla 6.a: pinned: true excluye el run de cualquier eliminación
      if (run.pinned === 1) {
        continue;
      }

      const startedTime = new Date(run.started_at).getTime();
      const ageMs = now - startedTime;

      // Regla 6.b: Expiración total del registro (30 días)
      if (ageMs >= recordTtl) {
        const runDir = path.join(this.runtimeDir, 'runs', run.run_id);
        if (fs.existsSync(runDir)) {
          const runBytes = this.calculateDirSize(runDir);
          bytesFreed += runBytes;
        }
        this.db.deleteRun(run.run_id);
        deletedRunsCount++;
        continue;
      }

      // Regla 6.b: TTL diferenciado por artefacto dentro de runs supervivientes
      const artifactsDir = path.join(this.runtimeDir, 'runs', run.run_id, 'artifacts');
      if (fs.existsSync(artifactsDir)) {
        const files = fs.readdirSync(artifactsDir);
        for (const file of files) {
          const filePath = path.join(artifactsDir, file);
          try {
            const stat = fs.statSync(filePath);
            const isVideo = file.endsWith('.webm') || file.endsWith('.mp4');
            const isTrace = file.endsWith('.zip');

            if ((isVideo && ageMs >= videoTtl) || (isTrace && ageMs >= traceTtl)) {
              bytesFreed += stat.size;
              fs.unlinkSync(filePath);
              purgedArtifactsCount++;
            }
          } catch {
            // Ignorar errores de archivo individual
          }
        }
      }
    }

    // Regla 6.c: Cuota dura por LRU sobre multimedia si se definió maxDiskUsageBytes
    if (policy.maxDiskUsageBytes && policy.maxDiskUsageBytes > 0) {
      const runsBaseDir = path.join(this.runtimeDir, 'runs');
      if (fs.existsSync(runsBaseDir)) {
        let currentDiskUsage = this.calculateDirSize(runsBaseDir);

        if (currentDiskUsage > policy.maxDiskUsageBytes) {
          // Ordenar runs unpinned de más antiguo a más reciente (LRU)
          const unpinnedRuns = this.db
            .listRuns()
            .filter((r) => r.pinned === 0)
            .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());

          for (const run of unpinnedRuns) {
            if (currentDiskUsage <= policy.maxDiskUsageBytes) break;

            const artifactsDir = path.join(this.runtimeDir, 'runs', run.run_id, 'artifacts');
            if (fs.existsSync(artifactsDir)) {
              const files = fs.readdirSync(artifactsDir);
              for (const file of files) {
                if (currentDiskUsage <= policy.maxDiskUsageBytes) break;
                const filePath = path.join(artifactsDir, file);
                try {
                  const stat = fs.statSync(filePath);
                  bytesFreed += stat.size;
                  currentDiskUsage -= stat.size;
                  fs.unlinkSync(filePath);
                  purgedArtifactsCount++;
                } catch {
                  // Continuar
                }
              }
            }
          }
        }
      }
    }

    return {
      deletedRunsCount,
      purgedArtifactsCount,
      bytesFreed,
    };
  }

  private calculateDirSize(dirPath: string): number {
    let total = 0;
    if (!fs.existsSync(dirPath)) return 0;

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        total += this.calculateDirSize(fullPath);
      } else if (entry.isFile()) {
        try {
          total += fs.statSync(fullPath).size;
        } catch {
          // Continuar
        }
      }
    }
    return total;
  }
}
