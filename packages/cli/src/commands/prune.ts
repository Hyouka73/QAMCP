import fs from 'node:fs';
import path from 'node:path';

import type { IStorage } from '@qap/engine';
import { HistoryManager, type HistoryEntry } from '@qap/knowledge';
import { QapDatabase, TTL_DEFAULTS } from '@qap/reporter';

export interface PruneCommandOptions {
  olderThanDays?: string | number;
  maxBytes?: string | number;
  maxEntries?: string | number;
  includeScreenshots?: boolean;
  includeHashes?: boolean;
  dryRun?: boolean;
  runtimeDir?: string;
  rootDir?: string;
}

export interface PruneAuditResult {
  candidateRunsCount: number;
  candidateArtifactsCount: number;
  candidateBytes: number;
  candidateHashesCount?: number;
  candidateExecutionsCount?: number;
  markedHistoryEntriesCount?: number;
  isDryRun: boolean;
}

/**
 * Campo del historial (.jsonl) con el id de la ejecución purgada.
 * Suposición de S75-017: ningún código del proyecto lo registra todavía,
 * hay que confirmar el nombre con el equipo.
 */
const EXECUTION_ID_FIELD = 'execution_id';
const DAY_MS = 24 * 60 * 60 * 1000;

/** Implementación mínima de IStorage sobre disco, solo para HistoryManager. */
class DiskHistoryStorage {
  constructor(private readonly rootDir: string) {}

  private resolve(relativePath: string): string {
    return path.join(this.rootDir, ...relativePath.split('/'));
  }

  read(relativePath: string): Promise<string> {
    return Promise.resolve(fs.readFileSync(this.resolve(relativePath), 'utf-8'));
  }

  write(relativePath: string, content: string): Promise<void> {
    const target = this.resolve(relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content, 'utf-8');
    return Promise.resolve();
  }

  exists(relativePath: string): Promise<boolean> {
    return Promise.resolve(fs.existsSync(this.resolve(relativePath)));
  }

  list(relativePath: string): Promise<string[]> {
    const dir = this.resolve(relativePath);
    return Promise.resolve(fs.existsSync(dir) ? fs.readdirSync(dir) : []);
  }
}

interface ExecutionGroup {
  id: string;
  files: string[];
  bytes: number;
  modifiedMs: number;
}

function entrySize(fullPath: string): number {
  const stat = fs.statSync(fullPath);
  if (!stat.isDirectory()) return stat.size;
  return fs.readdirSync(fullPath).reduce((total, name) => total + entrySize(path.join(fullPath, name)), 0);
}

/**
 * Agrupa los archivos de .qa/executions/ por ejecución:
 * <id>, <id>.json, <id>.report.json, <id>.report.md, <id>.report.xml...
 * Supone que el id no contiene puntos. Ignora archivos ocultos (.gitkeep).
 */
function collectExecutionGroups(executionsDir: string): ExecutionGroup[] {
  if (!fs.existsSync(executionsDir)) return [];

  const groups = new Map<string, ExecutionGroup>();

  for (const name of fs.readdirSync(executionsDir)) {
    if (name.startsWith('.')) continue;

    const id = name.split('.')[0];
    const fullPath = path.join(executionsDir, name);
    const group = groups.get(id) ?? { id, files: [], bytes: 0, modifiedMs: 0 };

    group.files.push(fullPath);
    group.bytes += entrySize(fullPath);
    if (name === `${id}.json` || group.modifiedMs === 0) {
      group.modifiedMs = fs.statSync(fullPath).mtimeMs;
    }
    groups.set(id, group);
  }

  return [...groups.values()];
}

/**
 * Marca execution_exists: false en las entradas del historial (.jsonl) de cada
 * módulo cuyo execution_id pertenezca a una ejecución purgada, usando HistoryManager.
 */
async function markPurgedInHistory(rootDir: string, purgedIds: Set<string>, dryRun: boolean): Promise<number> {
  const historyDir = path.join(rootDir, '.qa', 'cache', 'history');
  if (purgedIds.size === 0 || !fs.existsSync(historyDir)) return 0;

  const storage = new DiskHistoryStorage(rootDir);
  const manager = new HistoryManager(storage as unknown as IStorage, { maxEntries: Number.MAX_SAFE_INTEGER });
  let marked = 0;

  for (const file of fs.readdirSync(historyDir).filter((name) => name.endsWith('.jsonl'))) {
    const moduleName = file.slice(0, -'.jsonl'.length);
    const entries = await manager.getHistory(moduleName);

    const updated: HistoryEntry[] = entries.map((entry) => {
      const executionId = entry[EXECUTION_ID_FIELD];
      if (typeof executionId === 'string' && purgedIds.has(executionId) && entry.execution_exists !== false) {
        marked++;
        return { ...entry, execution_exists: false };
      }
      return entry;
    });

    if (!dryRun && updated.some((entry, index) => entry !== entries[index])) {
      const serialized = updated.map((entry) => JSON.stringify(entry)).join('\n') + '\n';
      await storage.write(`.qa/cache/history/${file}`, serialized);
    }
  }

  return marked;
}

/**
 * Subcomando `qap prune` (S75-017).
 */
export async function handlePrune(options: PruneCommandOptions = {}): Promise<PruneAuditResult> {
  const rootDir = options.rootDir || process.cwd();
  const runtimeDir = options.runtimeDir || path.resolve(rootDir, '.qa/runtime');

  if (!fs.existsSync(runtimeDir) && !fs.existsSync(path.join(rootDir, '.qa'))) {
    process.stdout.write(`El directorio runtime no existe en ${runtimeDir}. No hay nada para podar.\n`);
    return {
      candidateRunsCount: 0,
      candidateArtifactsCount: 0,
      candidateBytes: 0,
      candidateHashesCount: 0,
      candidateExecutionsCount: 0,
      markedHistoryEntriesCount: 0,
      isDryRun: Boolean(options.dryRun),
    };
  }

  // Asegurar directorio runtime si no existe
  fs.mkdirSync(runtimeDir, { recursive: true });

  const db = new QapDatabase(runtimeDir);

  const olderThanDays = options.olderThanDays ? Number(options.olderThanDays) : undefined;
  const maxEntries = options.maxEntries !== undefined ? Number(options.maxEntries) : 50;

  const recordTtlMs = olderThanDays ? olderThanDays * DAY_MS : TTL_DEFAULTS.RECORD_MS;
  const now = Date.now();

  let candidateRunsCount = 0;
  let candidateArtifactsCount = 0;
  let candidateBytes = 0;
  let candidateHashesCount = 0;

  const runs = db.listRuns();
  const runsBaseDir = path.join(runtimeDir, 'runs');

  const unpinnedRuns = runs.filter((r) => r.pinned === 0);
  const runsToPruneByCount =
    maxEntries && unpinnedRuns.length > maxEntries
      ? new Set(
          unpinnedRuns
            .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime())
            .slice(0, unpinnedRuns.length - maxEntries)
            .map((r) => r.run_id)
        )
      : new Set<string>();

  const purgedRunIds: string[] = [];

  for (const run of runs) {
    if (run.pinned === 1) continue;

    const ageMs = now - new Date(run.started_at).getTime();
    const runDir = path.join(runsBaseDir, run.run_id);

    if (ageMs >= recordTtlMs || runsToPruneByCount.has(run.run_id)) {
      candidateRunsCount++;
      purgedRunIds.push(run.run_id);
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
          const isScreenshot = file.endsWith('.png') || file.endsWith('.jpg');

          const shouldPruneArtifact =
            (isVideo && ageMs >= TTL_DEFAULTS.VIDEO_MS) ||
            (isTrace && ageMs >= TTL_DEFAULTS.TRACE_MS) ||
            (options.includeScreenshots && isScreenshot);

          if (shouldPruneArtifact) {
            try {
              const filePath = path.join(artifactsDir, file);
              const stat = fs.statSync(filePath);
              candidateBytes += stat.size;
              candidateArtifactsCount++;
              if (!options.dryRun) {
                fs.unlinkSync(filePath);
              }
            } catch {
              // Continuar
            }
          }
        }
      }
    }
  }

  // Ejecuciones de .qa/executions/ que exceden max-entries o la antigüedad (S75-017).
  // maxEntries <= 0 se interpreta como "sin límite por cantidad", igual que con las corridas.
  const purgedExecutionIds = new Set<string>();
  const executionGroups = collectExecutionGroups(path.join(rootDir, '.qa', 'executions')).sort(
    (a, b) => b.modifiedMs - a.modifiedMs // más reciente primero
  );

  executionGroups.forEach((group, index) => {
    const exceedsCount = maxEntries > 0 && index >= maxEntries;
    const exceedsAge = olderThanDays !== undefined && now - group.modifiedMs >= olderThanDays * DAY_MS;
    if (!exceedsCount && !exceedsAge) return;

    purgedExecutionIds.add(group.id);
    candidateBytes += group.bytes;
    if (!options.dryRun) {
      for (const filePath of group.files) {
        fs.rmSync(filePath, { recursive: true, force: true });
      }
    }
  });

  // Sincronizar history.json (formato previo, por run_id de las corridas purgadas)
  const historyCacheDir = path.join(rootDir, '.qa', 'cache', 'history');
  if (fs.existsSync(historyCacheDir)) {
    const historyFiles = fs.readdirSync(historyCacheDir).filter((f) => f.endsWith('.json'));

    for (const hFile of historyFiles) {
      const historyPath = path.join(historyCacheDir, hFile);
      try {
        const historyData: unknown = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
        if (Array.isArray(historyData)) {
          let changed = false;
          for (const entry of historyData as Array<Record<string, unknown>>) {
            const entryRunId = entry.runId ?? entry.run_id;
            if (typeof entryRunId === 'string' && purgedRunIds.includes(entryRunId)) {
              entry.execution_exists = false;
              changed = true;
            }
          }
          if (changed && !options.dryRun) {
            fs.writeFileSync(historyPath, JSON.stringify(historyData, null, 2));
          }
        }
      } catch {
        // Continuar
      }
    }
  }

  // Sincronizar el historial de HistoryManager (.jsonl) con las ejecuciones purgadas
  const markedHistoryEntriesCount = await markPurgedInHistory(rootDir, purgedExecutionIds, Boolean(options.dryRun));

  // Soporte para --include-hashes (>24h en .qa/cache/hashes/)
  const hashesDir = path.join(rootDir, '.qa', 'cache', 'hashes');
  if (options.includeHashes && fs.existsSync(hashesDir)) {
    const hashEntries = fs.readdirSync(hashesDir, { withFileTypes: true });
    for (const entry of hashEntries) {
      const fullPath = path.join(hashesDir, entry.name);
      try {
        const stat = fs.statSync(fullPath);
        const fileAgeMs = now - stat.mtimeMs;
        if (fileAgeMs >= DAY_MS) {
          candidateHashesCount++;
          candidateBytes += stat.size;
          if (!options.dryRun) {
            fs.unlinkSync(fullPath);
          }
        }
      } catch {
        // Continuar
      }
    }
  }

  if (!options.dryRun) {
    for (const runId of purgedRunIds) {
      const runDir = path.join(runsBaseDir, runId);
      if (fs.existsSync(runDir)) {
        fs.rmSync(runDir, { recursive: true, force: true });
      }
      db.deleteRun(runId);
    }
  }

  db.close();

  if (options.dryRun) {
    process.stdout.write(
      `[DRY RUN] Espacio liberable estimado: ${candidateBytes} bytes (${candidateRunsCount} corrida(s) candidata(s), ${candidateArtifactsCount} artefacto(s) multimedia, ${candidateHashesCount} hash(es)). Ningún archivo fue eliminado.\n`
    );
  } else {
    process.stdout.write(
      `✔ Poda completada: ${candidateBytes} bytes liberados. ${candidateRunsCount} corrida(s) eliminada(s), ${candidateArtifactsCount} artefacto(s) multimedia purgados.\n`
    );
  }

  if (purgedExecutionIds.size > 0 || markedHistoryEntriesCount > 0) {
    process.stdout.write(
      `Ejecuciones en .qa/executions: ${purgedExecutionIds.size}. Entradas de historial marcadas con execution_exists: false: ${markedHistoryEntriesCount}.\n`
    );
  }

  return {
    candidateRunsCount,
    candidateArtifactsCount,
    candidateBytes,
    candidateHashesCount,
    candidateExecutionsCount: purgedExecutionIds.size,
    markedHistoryEntriesCount,
    isDryRun: Boolean(options.dryRun),
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