import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { FileSystemStorage } from '@qap/knowledge';
import YAML from 'yaml';

interface QapProjectConfig {
  name?: string;
  defaultEnv?: string;
}

interface AuthProfilesFile {
  profiles?: unknown[];
}

/** Imprime el estado de inicializacion, configuracion y autenticacion del proyecto. */
function printProjectHeader(): boolean {
  const projectDir = join(process.cwd(), '.qa', 'project');
  const configPath = join(projectDir, 'qa.config.json');
  const contextYamlPath = join(projectDir, 'context.yaml');
  const environmentsYamlPath = join(projectDir, 'environments.yaml');
  const authPath = join(projectDir, 'auth', 'profiles.json');

  console.log('\n--- Estado del Proyecto QA ---');

  const hasConfig = existsSync(configPath) || existsSync(contextYamlPath) || existsSync(environmentsYamlPath);
  if (!hasConfig) {
    console.log('El proyecto no esta inicializado. Ejecuta `qap init` primero.');
    return false;
  }

  console.log('Proyecto inicializado correctamente.');

  try {
    if (existsSync(contextYamlPath)) {
      const parsedContext = YAML.parse(readFileSync(contextYamlPath, 'utf-8'));
      const parsedEnv = existsSync(environmentsYamlPath) ? YAML.parse(readFileSync(environmentsYamlPath, 'utf-8')) : null;
      console.log(`Proyecto: ${parsedContext?.project_name || 'Sin nombre'}`);
      console.log(`Entorno por defecto: ${parsedEnv?.default || 'local'}`);
    } else if (existsSync(configPath)) {
      const config = JSON.parse(readFileSync(configPath, 'utf-8')) as QapProjectConfig;
      console.log(`Proyecto: ${config.name || 'Sin nombre'}`);
      console.log(`Entorno por defecto: ${config.defaultEnv || 'local'}`);
    }
  } catch {
    console.log('Error al leer la configuracion del proyecto.');
  }

  if (existsSync(authPath)) {
    try {
      const parsed = JSON.parse(readFileSync(authPath, 'utf-8')) as AuthProfilesFile;
      const count = parsed.profiles?.length ?? 0;
      console.log(`Perfiles de autenticacion registrados: ${count}`);
    } catch {
      console.log('Perfiles de autenticacion: Error de lectura');
    }
  } else {
    console.log('Perfiles de autenticacion: Ninguno');
  }

  console.log('------------------------------\n');
  return true;
}

export async function handleStatus(moduleName?: string): Promise<void> {
  const storage = new FileSystemStorage();

  if (!moduleName) {
    printProjectHeader();
  }

  if (moduleName) {
    const exists = await storage.exists(`.qa/modules/${moduleName}/context.yaml`);
    if (!exists) {
      throw new Error(`El módulo '${moduleName}' no existe en .qa/modules/`);
    }

    const context = await storage.getModuleContext(moduleName);
    const rawContext = context as unknown as Record<string, unknown>;
    const testCaseIds = await storage.listTestCases(moduleName);
    const selectorsObj = await storage.getModuleSelectors(moduleName);

    let manualCases = 0;
    for (const tcId of testCaseIds) {
      try {
        const tc = await storage.getTestCase(moduleName, tcId);
        if (tc && (tc as unknown as Record<string, unknown>).manually_edited === true) {
          manualCases++;
        }
      } catch {
        // Ignorar casos no legibles
      }
    }

    const routesCount = Array.isArray(context.routes) ? context.routes.length : 0;
    const rulesCount = Array.isArray(rawContext.rules) ? rawContext.rules.length : 0;
    const selectorsCount = Object.keys(selectorsObj.selectors || {}).length;
    const totalCases = testCaseIds.length;

    const coveragePct = routesCount > 0 
      ? Math.min(100, Math.round((totalCases / routesCount) * 100)) 
      : (totalCases > 0 ? 100 : 0);

    console.log(`\n=== Estado del Módulo: ${moduleName} ===`);
    console.log(`┌───────────────────────────┬──────────────────────────┐`);
    console.log(`│ Métrica                   │ Valor                    │`);
    console.log(`├───────────────────────────┼──────────────────────────┤`);
    console.log(`│ Rutas Mapeadas            │ ${String(routesCount).padEnd(24)} │`);
    console.log(`│ Reglas de Negocio         │ ${String(rulesCount).padEnd(24)} │`);
    console.log(`│ Selectors Registrados     │ ${String(selectorsCount).padEnd(24)} │`);
    console.log(`│ Casos de Prueba (Total)   │ ${String(totalCases).padEnd(24)} │`);
    console.log(`│ Editados Manualmente      │ ${String(manualCases).padEnd(24)} │`);
    console.log(`│ Cobertura Estimada        │ ${String(coveragePct + '%').padEnd(24)} │`);
    console.log(`└───────────────────────────┴──────────────────────────┘\n`);
    return;
  }

  const modules = await storage.listModules();
  
  console.log(`\n=== Estado General del Proyecto QA ===`);
  if (modules.length === 0) {
    console.log('No se encontraron módulos en .qa/modules/. Ejecuta `qap discover` primero.\n');
    return;
  }

  console.log(`┌──────────────────────┬─────────┬──────────────┬───────────────┐`);
  console.log(`│ Módulo               │ Rutas   │ Test Cases   │ Manual Edited │`);
  console.log(`├──────────────────────┼─────────┼──────────────┼───────────────┤`);

  for (const mod of modules) {
    try {
      const ctx = await storage.getModuleContext(mod);
      const testCaseIds = await storage.listTestCases(mod);
      
      let manual = 0;
      for (const tcId of testCaseIds) {
        try {
          const tc = await storage.getTestCase(mod, tcId);
          if (tc && (tc as unknown as Record<string, unknown>).manually_edited === true) {
            manual++;
          }
        } catch {
          // Ignorar casos no legibles
        }
      }

      const modName = mod.padEnd(20);
      const routesCount = String(Array.isArray(ctx.routes) ? ctx.routes.length : 0).padEnd(7);
      const casesCount = String(testCaseIds.length).padEnd(12);
      const manualCount = String(manual).padEnd(13);

      console.log(`│ ${modName} │ ${routesCount} │ ${casesCount} │ ${manualCount} │`);
    } catch {
      console.log(`│ ${mod.padEnd(20)} │ ERROR   │ ERROR        │ ERROR         │`);
    }
  }
  console.log(`└──────────────────────┴─────────┴──────────────┴───────────────┘\n`);
}