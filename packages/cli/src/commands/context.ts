import { FileSystemStorage } from '@qap/knowledge';

export async function handleContext(moduleName: string): Promise<void> {
  const storage = new FileSystemStorage();

  const exists = await storage.exists(`.qa/modules/${moduleName}/context.yaml`);
  if (!exists) {
    throw new Error(`El módulo '${moduleName}' no existe en .qa/modules/`);
  }

  const context = await storage.getModuleContext(moduleName);
  const rawContext = context as unknown as Record<string, unknown>;

  const description = (rawContext.description as string) || 'Sin descripción';
  const baseUrl = (rawContext.baseUrl as string) || (rawContext.base_url as string) || 'N/A';
  const routes = Array.isArray(context.routes) ? context.routes : [];
  const rules = Array.isArray(rawContext.rules) ? (rawContext.rules as Array<Record<string, unknown>>) : [];
  const variables = typeof rawContext.variables === 'object' && rawContext.variables !== null
    ? (rawContext.variables as Record<string, unknown>)
    : {};

  console.log(`\n=== Contexto del Módulo: ${moduleName} ===`);
  console.log(`Descripción: ${description}`);
  console.log(`URL Base: ${baseUrl}\n`);

  console.log(`--- Rutas (${routes.length}) ---`);
  if (routes.length > 0) {
    routes.forEach((route) => {
      if (typeof route === 'string') {
        console.log(`  • ${route}`);
      } else if (typeof route === 'object' && route !== null) {
        const r = route as Record<string, unknown>;
        console.log(`  • [${r.alias || 'ruta'}] ${r.path || JSON.stringify(r)}`);
      }
    });
  } else {
    console.log('  (No hay rutas registradas)');
  }

  console.log(`\n--- Reglas de Negocio / Prerrequisitos (${rules.length}) ---`);
  if (rules.length > 0) {
    rules.forEach((rule) => {
      const id = (rule.id as string) || 'RULE';
      const desc = (rule.description as string) || (rule.name as string) || JSON.stringify(rule);
      console.log(`  • ${id}: ${desc}`);
    });
  } else {
    console.log('  (No hay reglas registradas)');
  }

  console.log(`\n--- Variables ---`);
  const varKeys = Object.keys(variables);
  if (varKeys.length > 0) {
    varKeys.forEach((key) => {
      console.log(`  • ${key}: ${String(variables[key])}`);
    });
  } else {
    console.log('  (No hay variables definidas)');
  }
  console.log('───────────────────────────────────────────────\n');
}