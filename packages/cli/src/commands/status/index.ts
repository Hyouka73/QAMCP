import { FileSystemStorage } from '@qap/knowledge';

export async function handleStatus(moduleName?: string): Promise<void> {
  const storage = new FileSystemStorage();

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