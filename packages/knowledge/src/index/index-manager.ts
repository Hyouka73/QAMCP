import type { IStorage } from '@qap/engine';

const INDEX_PATH = '.qa/cache/index/index.json';
const ALIASES_PATH = '.qa/cache/index/aliases.json';

export interface ModuleIndexEntry {
  id: string;
  name: string;
  path: string;
  tags: string[];
}

export interface AliasMap {
  [alias: string]: string; // Mapea alias a id o ruta
}

export class IndexManager {
  private modulesMap: Map<string, ModuleIndexEntry> = new Map();
  private tagsMap: Map<string, Set<string>> = new Map();
  private aliasesMap: Map<string, string> = new Map();

  constructor(private storage: IStorage) {}

  /**
   * Carga index.json y aliases.json desde IStorage a memoria para lookups O(1)
   */
  async load(): Promise<void> {
    try {
      if (await this.storage.exists(INDEX_PATH)) {
  const entries = await this.storage.readJson<ModuleIndexEntry[]>(INDEX_PATH);
        this.modulesMap.clear();
        this.tagsMap.clear();

        if (Array.isArray(entries)) {
          for (const entry of entries) {
            this.modulesMap.set(entry.id, entry);
            this.modulesMap.set(entry.name, entry); // Permite búsqueda O(1) por ID o por nombre

            if (entry.tags && Array.isArray(entry.tags)) {
              for (const tag of entry.tags) {
                if (!this.tagsMap.has(tag)) {
                  this.tagsMap.set(tag, new Set());
                }
                this.tagsMap.get(tag)!.add(entry.id);
              }
            }
          }
        }
      }
    } catch {
      // Manejo seguro si index.json está vacío o no es un arreglo válido
    }

    try {
      if (await this.storage.exists(ALIASES_PATH)) {
  const aliases = await this.storage.readJson<AliasMap>(ALIASES_PATH);
        if (aliases && typeof aliases === 'object') {
          this.aliasesMap = new Map(Object.entries(aliases));
        }
      }
    } catch {
      // Manejo seguro de aliases.json
    }
  }

  /**
   * Serializa y persiste index.json y aliases.json
   */
  async save(): Promise<void> {
  const uniqueModules = Array.from(new Set(this.modulesMap.values()));
  await this.storage.writeJson(INDEX_PATH, uniqueModules);

  const aliasObj: AliasMap = Object.fromEntries(this.aliasesMap.entries());
  await this.storage.writeJson(ALIASES_PATH, aliasObj);
}
  /**
   * Búsqueda en complejidad O(1) por ID o por Nombre de módulo
   */
  getModule(key: string): ModuleIndexEntry | undefined {
    return this.modulesMap.get(key);
  }

  /**
   * Registra un nuevo módulo en la estructura de memoria
   */
  registerModule(entry: ModuleIndexEntry): void {
    this.modulesMap.set(entry.id, entry);
    this.modulesMap.set(entry.name, entry);

    if (entry.tags && Array.isArray(entry.tags)) {
      for (const tag of entry.tags) {
        if (!this.tagsMap.has(tag)) {
          this.tagsMap.set(tag, new Set());
        }
        this.tagsMap.get(tag)!.add(entry.id);
      }
    }
  }

  /**
   * Recupera módulos asociados a un Tag específico en O(1)
   */
  getModulesByTag(tag: string): ModuleIndexEntry[] {
    const ids = this.tagsMap.get(tag);
    if (!ids) return [];
    
    const result: ModuleIndexEntry[] = [];
    const visited = new Set<string>();

    for (const id of ids) {
      const mod = this.modulesMap.get(id);
      if (mod && !visited.has(mod.id)) {
        visited.add(mod.id);
        result.push(mod);
      }
    }

    return result;
  }

  /**
   * Registra o actualiza un alias de ruta
   */
  setAlias(alias: string, targetPathOrId: string): void {
    this.aliasesMap.set(alias, targetPathOrId);
  }

  /**
   * Resuelve un alias de ruta en O(1)
   */
  resolveAlias(alias: string): string | undefined {
    return this.aliasesMap.get(alias);
  }
}