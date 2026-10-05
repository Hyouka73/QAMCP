import { FileSystemStorage } from '@qap/knowledge';

export async function handleSearch(query: string, targetModule?: string): Promise<void> {
  const storage = new FileSystemStorage();
  const queryLower = query.toLowerCase();

  const modulesToSearch = targetModule ? [targetModule] : await storage.listModules();

  if (modulesToSearch.length === 0) {
    console.log('No hay módulos disponibles para realizar la búsqueda.');
    return;
  }

  const results: Array<{ module: string; key: string; selector: string }> = [];

  for (const mod of modulesToSearch) {
    try {
      const selectorsObj = await storage.getModuleSelectors(mod);
      const selectorsMap = selectorsObj.selectors || {};

      for (const [key, selectorVal] of Object.entries(selectorsMap)) {
        if (
          key.toLowerCase().includes(queryLower) ||
          String(selectorVal).toLowerCase().includes(queryLower)
        ) {
          results.push({
            module: mod,
            key,
            selector: String(selectorVal),
          });
        }
      }
    } catch {
      // Módulo sin selectores válidos
    }
  }

  console.log(`\n=== Búsqueda de Selectores para: "${query}" ===`);
  if (results.length === 0) {
    console.log(`No se encontraron selectores que coincidan con "${query}".\n`);
    return;
  }

  console.log(`┌──────────────────────┬──────────────────────────┬──────────────────────────────────────────┐`);
  console.log(`│ Módulo               │ Selector Key             │ Expresión CSS / XPath                    │`);
  console.log(`├──────────────────────┼──────────────────────────┼──────────────────────────────────────────┤`);

  results.forEach((res) => {
    const mod = res.module.padEnd(20);
    const key = res.key.slice(0, 24).padEnd(24);
    const val = res.selector.slice(0, 40).padEnd(40);
    console.log(`│ ${mod} │ ${key} │ ${val} │`);
  });

  console.log(`└──────────────────────┴──────────────────────────┴──────────────────────────────────────────┘`);
  console.log(`Total encontrados: ${results.length}\n`);
}