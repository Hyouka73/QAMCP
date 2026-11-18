import fs from 'node:fs';
import path from 'node:path';

import { QapDatabase } from '../persistence/sqlite-client.js';
import type { RunRow } from '../persistence/sqlite-client.js';

export interface QuotaArtifact {
  path: string;
  bytes: number;
}

/** Shared, non-mutating quota selection. Records, unknown files and pins survive. */
export function planQuotaArtifacts(
  runtimeDir: string,
  runs: RunRow[],
  maxBytes: number,
  alreadyRemoved: ReadonlySet<string> = new Set()
): QuotaArtifact[] {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 0) throw new Error('Invalid byte quota');
  const sizes = new Map<string, number>();
  const collect = (dir: string): void => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (alreadyRemoved.has(fullPath) || entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) collect(fullPath);
      else if (entry.isFile()) sizes.set(fullPath, fs.statSync(fullPath).size);
    }
  };
  const runsDir = path.resolve(runtimeDir, 'runs');
  collect(runsDir);
  let remaining = [...sizes.values()].reduce((sum, size) => sum + size, 0);
  const selected: QuotaArtifact[] = [];
  const ordered = runs.filter((run) => run.pinned === 0).slice().sort((a, b) =>
    Date.parse(a.started_at) - Date.parse(b.started_at) || a.run_id.localeCompare(b.run_id));
  for (const run of ordered) {
    // Do not traverse IDs outside the managed runs directory.
    const runDir = path.resolve(runsDir, run.run_id);
    if (path.dirname(runDir) !== path.resolve(runsDir)) throw new Error('Invalid runtime run ID');
    const artifactsDir = path.join(runDir, 'artifacts');
    const artifacts = [...sizes.keys()].filter((file) => path.dirname(file) === artifactsDir && /\.(webm|mp4|zip)$/i.test(file)).sort();
    for (const file of artifacts) {
      if (remaining <= maxBytes) return selected;
      const bytes = sizes.get(file)!;
      selected.push({ path: file, bytes });
      remaining -= bytes;
    }
  }
  return selected;
}

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
    if (policy.maxDiskUsageBytes !== undefined && policy.maxDiskUsageBytes >= 0) {
      for (const artifact of planQuotaArtifacts(this.runtimeDir, this.db.listRuns(), policy.maxDiskUsageBytes)) {
        fs.unlinkSync(artifact.path);
        bytesFreed += artifact.bytes;
        purgedArtifactsCount++;
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
