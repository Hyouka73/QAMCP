import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import { confirm } from '@inquirer/prompts';
import { FileSystemStorage, ModuleBackupManager, UpdateGuard } from '@qap/knowledge';
import type { Module, ModuleContext, Selectors } from '@qap/shared';
import { parse } from 'yaml';

import { DataError } from '../errors.js';
import { computeModuleSemanticHash } from '../lib/module-semantic-hash.js';

export interface UpdateCommandOptions {
  /** Aplica los cambios sin pedir confirmación. */
  yes?: boolean;
  /** Muestra el diff y termina sin modificar archivos. */
  dryRun?: boolean;
  /** Ignora la protección `manually_edited: true`. */
  force?: boolean;
  /** Reservado: la tarea S75-015 no define su comportamiento. */
  phase?: string;
  /** @deprecated Sin efecto: ahora se pide confirmación siempre, salvo con --yes. */
  interactive?: boolean;
  /** @deprecated Sin efecto: ahora se pide confirmación siempre, salvo con --yes. */
  diff?: boolean;
}

interface DiffEntry {
  field: string;
  before: string;
  after: string;
}

interface DiscoveredInputLike {
  key: string;
  selector: string;
}

interface DiscoveredFormLike {
  inputs?: DiscoveredInputLike[];
}

interface DiscoveredModuleContext {
  forms?: DiscoveredFormLike[];
  inputs?: DiscoveredInputLike[];
}

const PROTECTABLE_FILE_NAMES = new Set(['context.yaml', 'rules.yaml']);
const TEST_CASE_FILE_PATTERN = /^TC-.+\.ya?ml$/;

function toPosix(path: string): string {
  return path.split('\\').join('/');
}

function getDiscoverCacheDir(): string {
  return join(process.cwd(), '.qa', 'cache', 'discover');
}

function loadCachedModule(moduleName: string): Module {
  const path = join(getDiscoverCacheDir(), `${moduleName}.module.json`);
  if (!existsSync(path)) {
    throw new DataError(
      `No hay datos descubiertos para '${moduleName}'. Ejecuta 'qap discover ${moduleName} --phase navigate' primero.`
    );
  }
  return JSON.parse(readFileSync(path, 'utf-8')) as Module;
}

/**
 * Recorre la carpeta del módulo y devuelve context.yaml, rules.yaml y cada
 * TC-*.yaml, sin asumir en qué subcarpeta viven.
 */
function collectProtectableFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];

  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...collectProtectableFiles(fullPath));
    } else if (PROTECTABLE_FILE_NAMES.has(entry.name) || TEST_CASE_FILE_PATTERN.test(entry.name)) {
      found.push(fullPath);
    }
  }
  return found;
}

/**
 * Devuelve los archivos del módulo con `manually_edited: true`, usando
 * UpdateGuard.isProtectedObject() como caja negra (S75-015).
 */
function findProtectedFiles(moduleDir: string): string[] {
  const protectedFiles: string[] = [];

  for (const filePath of collectProtectableFiles(moduleDir)) {
    try {
      const parsed: unknown = parse(readFileSync(filePath, 'utf-8'));
      if (UpdateGuard.isProtectedObject(parsed as Record<string, unknown> | null | undefined)) {
        protectedFiles.push(filePath);
      }
    } catch {
      // YAML ilegible: se trata como no protegido, igual que UpdateGuard.isProtectedContent.
    }
  }

  return protectedFiles;
}

async function loadCurrentSelectors(storage: FileSystemStorage, moduleName: string): Promise<Selectors | null> {
  try {
    return await storage.getModuleSelectors(moduleName);
  } catch {
    return null;
  }
}

/**
 * Deriva un mapa { clave: selector } a partir de los formularios e inputs
 * standalone que PlaywrightAdapter cachea en Module.context durante la
 * fase 'navigate' de discover (S75-015).
 */
function deriveSelectorsFromCachedModule(cached: Module): Record<string, string> {
  const context = cached.context as DiscoveredModuleContext | undefined;
  const derived: Record<string, string> = {};

  if (!context) return derived;

  for (const form of context.forms ?? []) {
    for (const input of form.inputs ?? []) {
      if (input.key && input.selector) {
        derived[input.key] = input.selector;
      }
    }
  }

  for (const input of context.inputs ?? []) {
    if (input.key && input.selector) {
      derived[input.key] = input.selector;
    }
  }

  return derived;
}

function computeMetadataDiff(current: ModuleContext | null, cached: Module): DiffEntry[] {
  const diffs: DiffEntry[] = [];

  const currentDescription = current?.description ?? '';
  const cachedDescription = cached.description ?? '';
  if (currentDescription !== cachedDescription) {
    diffs.push({ field: 'description', before: currentDescription, after: cachedDescription });
  }

  const currentTags = (current?.tags ?? []).join(', ');
  const cachedTags = (cached.tags ?? []).join(', ');
  if (currentTags !== cachedTags) {
    diffs.push({ field: 'tags', before: currentTags, after: cachedTags });
  }

  const currentRoute = current?.base_route ?? '';
  const cachedRoute = cached.path ?? '';
  if (currentRoute !== cachedRoute) {
    diffs.push({ field: 'base_route', before: currentRoute, after: cachedRoute });
  }

  return diffs;
}

function computeSelectorsDiff(
  currentSelectors: Record<string, string>,
  derivedSelectors: Record<string, string>
): DiffEntry[] {
  const diffs: DiffEntry[] = [];

  for (const [key, newSelector] of Object.entries(derivedSelectors)) {
    const oldSelector = currentSelectors[key] ?? '';
    if (oldSelector !== newSelector) {
      diffs.push({ field: `selectors.${key}`, before: oldSelector, after: newSelector });
    }
  }

  return diffs;
}

function printDiff(diffs: DiffEntry[]): void {
  for (const d of diffs) {
    console.log(`  ${d.field}:`);
    console.log(`    - antes: ${d.before || '(vacío)'}`);
    console.log(`    - nuevo: ${d.after || '(vacío)'}`);
  }
}

export async function handleUpdate(moduleName?: string, options: UpdateCommandOptions = {}): Promise<void> {
  const rootDir = process.cwd();
  const storage = new FileSystemStorage({ rootDir });

  if (!moduleName) {
    throw new DataError('Debe especificar un módulo para actualizar (ej. "qap update <module>").');
  }

  if (!(await storage.hasModule(moduleName))) {
    throw new DataError(`El módulo '${moduleName}' no existe en el almacenamiento.`);
  }

  const moduleDir = join(rootDir, '.qa', 'modules', moduleName);
  const contextPath = join(moduleDir, 'context.yaml');

  // Protección manual: cada archivo con manually_edited: true se omite (salvo --force).
  const protectedFiles = options.force ? [] : findProtectedFiles(moduleDir);
  const contextProtected = protectedFiles.includes(contextPath);

  if (protectedFiles.length > 0) {
    console.log(`Archivos con 'manually_edited: true' (se omiten, usa --force para incluirlos):`);
    for (const filePath of protectedFiles) {
      console.log(`  - ${toPosix(relative(moduleDir, filePath))}`);
    }
  }

  const cachedModule = loadCachedModule(moduleName);

  let currentContext: ModuleContext | null = null;
  if (!contextProtected && existsSync(contextPath)) {
    currentContext = await storage.getModuleContext(moduleName);
  }

  const currentSelectors = await loadCurrentSelectors(storage, moduleName);
  const derivedSelectors = deriveSelectorsFromCachedModule(cachedModule);

  const metadataDiffs = contextProtected ? [] : computeMetadataDiff(currentContext, cachedModule);
  const selectorsDiffs = computeSelectorsDiff(currentSelectors?.selectors ?? {}, derivedSelectors);
  const diffs = [...metadataDiffs, ...selectorsDiffs];

  console.log(`\n=== Diff para el módulo '${moduleName}' ===`);
  if (diffs.length === 0) {
    console.log('  Sin cambios que aplicar: el módulo ya está sincronizado (o sus cambios están en archivos protegidos).');
    return;
  }
  printDiff(diffs);
  console.log('');

  if (options.dryRun) {
    console.log(`[DRY RUN] ${diffs.length} campo(s) cambiarían. Ningún archivo fue modificado.`);
    return;
  }

  if (!options.yes) {
    const proceed = await confirm({
      message: `¿Aplicar estos ${diffs.length} cambio(s) a '${moduleName}'?`,
      default: false,
    });
    if (!proceed) {
      console.log('Actualización cancelada por el usuario.');
      return;
    }
  }

  // Hash semántico del estado previo: se guarda dentro del respaldo para que
  // 'qap rollback' pueda verificar su integridad con SemanticHasher.
  const previousHash = computeModuleSemanticHash(moduleDir);
  const backupPath = ModuleBackupManager.backupModule(rootDir, moduleName);
  if (backupPath) {
    writeFileSync(join(backupPath, 'semantic-hash.json'), JSON.stringify(previousHash, null, 2), 'utf-8');
    console.log(`Respaldo creado en: ${backupPath}`);
  }

  if (metadataDiffs.length > 0) {
    const updatedContext: ModuleContext = {
      _version: currentContext?._version ?? '2',
      module: moduleName,
      ...currentContext,
      description: cachedModule.description ?? currentContext?.description,
      tags: cachedModule.tags ?? currentContext?.tags,
      base_route: cachedModule.path ?? currentContext?.base_route,
    };
    await storage.saveModuleContext(moduleName, updatedContext);
  }

  if (selectorsDiffs.length > 0) {
    const mergedSelectors: Selectors = {
      selectors: { ...(currentSelectors?.selectors ?? {}), ...derivedSelectors },
      metadata: {
        generated_at: new Date().toISOString(),
        source: 'qap update',
      },
    };
    await storage.saveModuleSelectors(moduleName, mergedSelectors);
  }

  // Recalcula semantic-hash.json con el estado final del módulo.
  await storage.saveSemanticHash(moduleName, computeModuleSemanticHash(moduleDir));

  console.log(`✔ Módulo '${moduleName}' actualizado (${diffs.length} campo(s) aplicados). Hash semántico recalculado.`);
}