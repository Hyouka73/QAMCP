import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { input } from '@inquirer/prompts';
import { PlaywrightAdapter } from '@qap/playwright-adapter';
import type { ModuleSpec, Module } from '@qap/shared';

export interface DiscoverOptions {
  phase?: string;
  amend?: boolean;
}

function getDiscoverCacheDir(): string {
  return join(process.cwd(), '.qa', 'cache', 'discover');
}

function specPath(name: string): string {
  return join(getDiscoverCacheDir(), `${name}.spec.json`);
}

function modulePath(name: string): string {
  return join(getDiscoverCacheDir(), `${name}.module.json`);
}

function ensureCacheDir(): void {
  const dir = getDiscoverCacheDir();
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function saveSpec(spec: ModuleSpec): void {
  ensureCacheDir();
  writeFileSync(specPath(spec.name), JSON.stringify(spec, null, 2), 'utf-8');
}

function loadSpec(name: string): ModuleSpec {
  const path = specPath(name);
  if (!existsSync(path)) {
    throw new Error(
      `No existe una especificacion persistida para '${name}'. Ejecuta primero 'qap discover ${name} --phase interview'.`
    );
  }
  return JSON.parse(readFileSync(path, 'utf-8')) as ModuleSpec;
}

function saveModule(discoveredModule: Module): void {
  ensureCacheDir();
  writeFileSync(modulePath(discoveredModule.name), JSON.stringify(discoveredModule, null, 2), 'utf-8');
}

function loadModule(name: string): Module {
  const path = modulePath(name);
if (!existsSync(path)) {
  throw new Error(
    `No existe un modulo documentado para '${name}'. Ejecuta primero 'qap discover ${name} --phase navigate'.`
    ); 
  }
  return JSON.parse(readFileSync(path, 'utf-8')) as Module;
}

/**
 * Fase 'interview': recolecta interactivamente los datos minimos de un
 * modulo (nombre, ruta, tags) y persiste el ModuleSpec resultante en
 * .qa/cache/discover/<name>.spec.json, sin navegar la UI todavia.
 */
async function runInterviewPhase(nameArg?: string): Promise<void> {
  const name =
    nameArg ||
    (await input({
      message: 'Nombre del modulo a descubrir:',
      validate: (value) => (value.trim() !== '' ? true : 'El nombre no puede estar vacio.'),
    }));

  const path = await input({
    message: 'Ruta o URL del modulo a explorar:',
    validate: (value) => (value.trim() !== '' ? true : 'La ruta no puede estar vacia.'),
  });

  const tagsRaw = await input({
    message: 'Tags separados por coma (opcional):',
    default: '',
  });

  const spec: ModuleSpec = {
    name,
    path,
    tags: tagsRaw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
  };

  saveSpec(spec);
  console.log(`Especificacion de '${name}' persistida en .qa/cache/discover/${name}.spec.json`);
}

/**
 * Fase 'navigate': recupera el ModuleSpec de la fase 'interview' y navega
 * la UI real con PlaywrightAdapter (S4-001) para extraer conocimiento del
 * modulo. Persiste el Module resultante como paso intermedio.
 */
async function runNavigatePhase(nameArg?: string): Promise<void> {
  if (!nameArg) {
    throw new Error("La fase 'navigate' requiere el nombre del modulo: qap discover <name> --phase navigate");
  }

  const spec = loadSpec(nameArg);
  const adapter = new PlaywrightAdapter();
  const discoveredModule = await adapter.discover(spec);

  saveModule(discoveredModule);
  console.log(`Modulo '${nameArg}' navegado y persistido en .qa/cache/discover/${nameArg}.module.json`);
}

async function runAmendPhase(nameArg?: string): Promise<void> {
  if (!nameArg) {
    throw new Error("La fase 'amend' requiere el nombre del modulo: qap discover <name> --amend");
  }

  const currentModule = loadModule(nameArg);

  const newDescription = await input({
     message: `Descripcion actual: "${currentModule.description ?? ''}". Nueva descripcion (Enter para mantener):`,
     default: currentModule.description ?? '',
  });

  const newTagsRaw = await input({
    message: `Tags actuales: "${(currentModule.tags ?? []).join(', ')}". Nuevos tags separados por coma (Enter para mantener):`,
    default: (currentModule.tags ?? []).join(', '),
  });

  const amendedModule: Module = {
    ...currentModule,
    description: newDescription,
    tags: newTagsRaw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
  };

  saveModule(amendedModule);
  console.log(`Modulo '${nameArg}' corregido (amend) sin re-escaneo. Cambios persistidos en .qa/cache/discover/${nameArg}.module.json`);

}
export async function handleDiscover(nameArg: string | undefined, options: DiscoverOptions): Promise<void> {
  if (options.amend) {
    await runAmendPhase(nameArg);
    return;
  }
  const phase = options.phase ?? 'interview';

  switch (phase) {
    case 'interview':
      await runInterviewPhase(nameArg);
      return;
    case 'navigate':
      await runNavigatePhase(nameArg);
      return;
    case 'repo-map':
      throw new Error(
        "La fase 'repo-map' aun no esta disponible: depende del generador de S4-005 (packages/knowledge/src/prd/bootstrap.ts), pendiente de entrega."
      );
    default:
      throw new Error(`Fase de discover no reconocida: '${phase}'. Fases validas: interview, navigate.`);
  }
}