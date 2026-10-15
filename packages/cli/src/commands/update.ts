import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { confirm } from '@inquirer/prompts';
import { FileSystemStorage } from '@qap/knowledge';
import { UpdateGuard, ModuleBackupManager } from '@qap/knowledge';
import type { Module, ModuleContext, Selectors } from '@qap/shared';

import { DataError } from '../errors.js';

export interface UpdateCommandOptions {
  dryRun?: boolean;
  interactive?: boolean;
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

  const contextPath = join(rootDir, '.qa', 'modules', moduleName, 'context.yaml');

  // Salvaguarda S6-003: no tocar un módulo marcado como editado a mano.
  if (await UpdateGuard.isFileProtected(contextPath)) {
    console.log(
      `El módulo '${moduleName}' tiene 'manually_edited: true' en context.yaml. ` +
        `'qap update' no sobrescribe módulos editados manualmente. Operación cancelada.`
    );
    return;
  }

  const cachedModule = loadCachedModule(moduleName);

  let currentContext: ModuleContext | null = null;
  if (existsSync(contextPath)) {
    currentContext = await storage.getModuleContext(moduleName);
  }

  let currentSelectors: Selectors | null = null;
  try {
    currentSelectors = await storage.getModuleSelectors(moduleName);
  } catch {
    currentSelectors = null;
  }

  const derivedSelectors = deriveSelectorsFromCachedModule(cachedModule);
  const metadataDiffs = computeMetadataDiff(currentContext, cachedModule);
  const selectorsDiffs = computeSelectorsDiff(currentSelectors?.selectors ?? {}, derivedSelectors);
  const diffs = [...metadataDiffs, ...selectorsDiffs];

  console.log(`\n=== Diff para el módulo '${moduleName}' ===`);
  if (diffs.length === 0) {
    console.log('  Sin cambios: el módulo ya está sincronizado con lo descubierto.');
    return;
  }
  printDiff(diffs);
  console.log('');

  if (options.dryRun) {
    console.log(`[DRY RUN] ${diffs.length} campo(s) cambiarían. Ningún archivo fue modificado.`);
    return;
  }

  const wantsConfirmation = options.interactive || options.diff;
  if (wantsConfirmation) {
    const proceed = await confirm({
      message: `¿Aplicar estos ${diffs.length} cambio(s) a '${moduleName}'?`,
      default: false,
    });
    if (!proceed) {
      console.log('Actualización cancelada por el usuario.');
      return;
    }
  }

  const backupPath = ModuleBackupManager.backupModule(rootDir, moduleName);
  if (backupPath) {
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

  console.log(`✔ Módulo '${moduleName}' actualizado (${diffs.length} campo(s) aplicados).`);
  process.exitCode = 0;
}