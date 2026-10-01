import { FileSystemStorage } from '@qap/knowledge';
import { DependencyGraphResolver, SemanticHasher, UpdateGuard, type TestNode } from '@qap/knowledge';

import { DataError } from '../errors.js';

export async function handlePlan(moduleName: string): Promise<void> {
  const storage = new FileSystemStorage({ rootDir: process.cwd() });

  const hasModule = await storage.hasModule(moduleName);
  if (!hasModule) {
    throw new DataError(
      `El módulo '${moduleName}' no existe en .qa/modules/. Ejecuta 'qap discover' primero.`
    );
  }

  // 1. Leer rutas desde context.yaml y selectores desde selectors.json (fuente real de datos)
  const context = await storage.getModuleContext(moduleName).catch(() => null);
  const selectorsData = await storage.getModuleSelectors(moduleName).catch(() => null);

  const routes = context?.routes ?? [];
  const selectors = selectorsData?.selectors ?? {};

  // 2. Calcular checksum determinista con SemanticHasher (S3-006)
  const hasher = new SemanticHasher();
  const semanticHash = hasher.generate({ routes, selectors }, ['context.yaml', 'selectors.json']);

  // 3. Leer los test cases existentes del módulo, respetando manually_edited (S6-003)
  const caseIds = await storage.listTestCases(moduleName);
  const rawCases: TestNode[] = [];
  const preservedCases: string[] = [];

  for (const caseId of caseIds) {
    const testCase = await storage.getTestCase(moduleName, caseId);
    const isEdited = UpdateGuard.isProtectedObject(testCase as unknown as Record<string, unknown>);
    if (isEdited) {
      preservedCases.push(caseId);
    }
    rawCases.push(testCase as unknown as TestNode);
  }

  if (preservedCases.length > 0) {
    console.log(
      `[UpdateGuard] ${preservedCases.length} caso(s) editado(s) manualmente preservado(s): ${preservedCases.join(', ')}`
    );
  }

  // 4. Ordenar los casos según sus dependencias declaradas (S6-004)
  const graphResult = DependencyGraphResolver.resolveOrder(rawCases);
  if (graphResult.hasCycles) {
    console.warn(`[Advertencia] Se detectaron dependencias circulares: ${JSON.stringify(graphResult.cycles)}`);
  }
  const sortedCases = graphResult.hasCycles ? rawCases : graphResult.orderedNodes;

  // 5. Generar y persistir la matriz de ejecución en tests/plan.json
  const planMatrix = {
    _version: '1',
    module: moduleName,
    checksum: semanticHash.hash,
    timestamp: semanticHash.timestamp,
    algorithm: semanticHash.algorithm,
    matrix: {
      cases: sortedCases.map((c) => c.id),
      environment: context && 'default',
    },
  };

  const planPath = `.qa/modules/${moduleName}/tests/plan.json`;
  await storage.writeJson(planPath, planMatrix);

  console.log(`Plan de pruebas generado exitosamente en: ${planPath}`);
  console.log(`Checksum de configuración (SHA-256): ${semanticHash.hash}`);
}