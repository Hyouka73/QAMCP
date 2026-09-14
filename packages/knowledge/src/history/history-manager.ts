import type { IStorage } from '@qap/engine';

export interface HistoryEntry {
  timestamp: string;
  event: string;
  [key: string]: unknown;
}

export interface HistoryManagerOptions {
  /** Numero maximo de entradas a retener por modulo antes de podar las mas antiguas. */
  maxEntries?: number;
}

const DEFAULT_MAX_ENTRIES = 100;
const BACKUPS_DIR = '.qa/cache/backups';

/**
 * Registro historico de ejecuciones por modulo, con:
 * - Poda automatica: mantiene como maximo `maxEntries` entradas por modulo.
 * - Backups: antes de sobrescribir un archivo de historial (por poda),
 *   crea una copia en .qa/cache/backups/ con timestamp, para no perder
 *   datos historicos de forma irreversible.
 */
export class HistoryManager {
  private maxEntries: number;

  constructor(
    private storage: IStorage,
    options: HistoryManagerOptions = {}
  ) {
    this.maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
  }

  private getHistoryPath(moduleName: string): string {
    return `.qa/cache/history/${moduleName}.jsonl`;
  }

  private getBackupPath(moduleName: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${BACKUPS_DIR}/${moduleName}-${timestamp}.jsonl`;
  }

  private parseEntries(raw: string): HistoryEntry[] {
    return raw
      .trim()
      .split('\n')
      .filter((line) => line.length > 0)
      .map((line) => JSON.parse(line) as HistoryEntry);
  }

  private serializeEntries(entries: HistoryEntry[]): string {
    return entries.map((entry) => JSON.stringify(entry)).join('\n') + (entries.length > 0 ? '\n' : '');
  }

  /**
   * Lee todas las entradas de historial de un modulo.
   * Devuelve un arreglo vacio si el modulo aun no tiene historial.
   */
  async getHistory(moduleName: string): Promise<HistoryEntry[]> {
    const path = this.getHistoryPath(moduleName);
    if (!(await this.storage.exists(path))) return [];

    const raw = await this.storage.read(path);
    return this.parseEntries(raw);
  }

  /**
   * Agrega una entrada al historial de un modulo. Si al agregarla se
   * supera maxEntries, se crea un backup del historial completo antes
   * de podar las entradas mas antiguas.
   */
  async recordExecution(moduleName: string, entry: Omit<HistoryEntry, 'timestamp'>): Promise<void> {
    const existing = await this.getHistory(moduleName);

    const newEntry: HistoryEntry = Object.assign(
      { timestamp: new Date().toISOString() },
      entry
    ) as HistoryEntry;

    const updated = [...existing, newEntry];

    if (updated.length > this.maxEntries) {
      // Backup del historial completo (previo a la poda) antes de sobrescribir.
      await this.createBackup(moduleName, existing);

      // Poda: retiene solo las maxEntries mas recientes.
      const pruned = updated.slice(updated.length - this.maxEntries);
      await this.storage.write(this.getHistoryPath(moduleName), this.serializeEntries(pruned));
      return;
    }

    await this.storage.write(this.getHistoryPath(moduleName), this.serializeEntries(updated));
  }

  /**
   * Crea un backup del historial actual de un modulo en .qa/cache/backups/
   * antes de que sea sobrescrito por la poda automatica.
   */
  private async createBackup(moduleName: string, entries: HistoryEntry[]): Promise<void> {
    const backupPath = this.getBackupPath(moduleName);
    await this.storage.write(backupPath, this.serializeEntries(entries));
  }

  /**
   * Lista los backups existentes para un modulo, en .qa/cache/backups/.
   */
  async listBackups(moduleName: string): Promise<string[]> {
    const files = await this.storage.list(BACKUPS_DIR);
    return files.filter((f) => f.startsWith(`${moduleName}-`) && f.endsWith('.jsonl'));
  }

  /**
   * Devuelve el numero maximo de entradas configurado para retencion.
   */
  getMaxEntries(): number {
    return this.maxEntries;
  }
}