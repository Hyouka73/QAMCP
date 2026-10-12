import { PlaywrightRunner } from '@qap/playwright-runner';
import { FileSystemStorage } from '@qap/knowledge';
import type { TestPlan, ExecutionResult, ExecutionStatus } from '@qap/shared';

import { DataError } from '../errors.js';

export interface TestCommandOptions {
  tags?: string;
  case?: string;
  shard?: string;
  headed?: boolean;
  retries?: string;
  failFast?: boolean;
}

interface ResolvedCase {
  module: string;
  caseId: string;
}

function parseShard(shard: string): { index: number; total: number } {
  const match = /^(\d+)\/(\d+)$/.exec(shard.trim());
  if (!match) {
    throw new DataError(`--shard invalido: "${shard}". Formato esperado "i/n" (ej. "1/3").`);
  }
  const index = Number(match[1]);
  const total = Number(match[2]);
  if (total < 1 || index < 1 || index > total) {
    throw new DataError(`--shard invalido: "${shard}". El indice debe estar entre 1 y el total.`);
  }
  return { index, total };
}

export async function handleTest(
  moduleArg: string | undefined,
  options: TestCommandOptions = {}
): Promise<void> {
  const storage = new FileSystemStorage({ rootDir: process.cwd() });

  const modules = moduleArg ? [moduleArg] : await storage.listModules();
  if (modules.length === 0) {
    throw new DataError('No hay modulos registrados en .qa/modules/. Ejecuta "qap discover" primero.');
  }

  const requestedTags = options.tags
    ? options.tags.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  // 1. Resolver casos por modulo, aplicando --case y --tagsF
  const resolved: ResolvedCase[] = [];
  for (const moduleName of modules) {
    if (!(await storage.hasModule(moduleName))) continue;

    const caseIds = await storage.listTestCases(moduleName);
    for (const caseId of caseIds) {
      if (options.case && caseId !== options.case) continue;

      if (requestedTags.length > 0) {
        const testCase = await storage.getTestCase(moduleName, caseId);
        const caseTags = testCase.tags ?? [];
        if (!requestedTags.some((tag) => caseTags.includes(tag))) continue;
      }

      resolved.push({ module: moduleName, caseId });
    }
  }

  if (options.case && resolved.length === 0) {
    throw new DataError(`No se encontro el caso "${options.case}" en los modulos indicados.`);
  }

  if (resolved.length === 0) {
    console.warn('No se encontraron casos que coincidan con --tags.');
    return;
  }

  // 2. --shard: particion determinista "i/n"
  let finalCases = resolved;
  if (options.shard) {
    const { index, total } = parseShard(options.shard);
    finalCases = resolved.filter((_, i) => i % total === index - 1);
    console.log(`Shard ${index}/${total}: ${finalCases.length} de ${resolved.length} casos asignados.`);
  }

  const byModule = new Map<string, string[]>();
  for (const { module, caseId } of finalCases) {
    if (!byModule.has(module)) byModule.set(module, []);
    byModule.get(module)!.push(caseId);
  }

  const maxRetries = options.retries ? Number(options.retries) : 0;
  if (options.retries && (!Number.isInteger(maxRetries) || maxRetries < 0)) {
    throw new DataError(`--retries invalido: "${options.retries}". Debe ser un entero >= 0.`);
  }

  const runner = new PlaywrightRunner();
  let overallPassed = 0;
  let overallFailed = 0;
  let overallTotal = 0;

  // 3. Ejecutar por modulo (PlaywrightRunner.execute solo soporta un modulo por plan)
  for (const [moduleName, caseIds] of byModule) {
    const plan: TestPlan = {
      modules: [moduleName],
      cases: caseIds,
      tags: requestedTags.length > 0 ? requestedTags : undefined,
      fail_fast: options.failFast ?? false,
    };

    const result = await runner.execute(plan, {
      headless: !(options.headed ?? false),
      fail_fast: options.failFast ?? false,
      storageResolver: (mod, caseId) => storage.getTestCase(mod, caseId),
      screenshotsDir: '.qa/reports/screenshots',
    });

    // 4. Reintentos: orquestados aqui porque PlaywrightRunner.execute() no los implementa.
    //    Solo se re-ejecutan los casos que fallaron, hasta maxRetries veces.
    const caseMap = new Map(result.cases.map((c) => [c.id, c]));

// Si el runner murio antes de generar un ExecutedCase para algun caso esperado
// (ej. fallo de infraestructura como chromium.launch()), lo marcamos como fallido
// en vez de dejarlo fuera del conteo silenciosamente.
for (const caseId of caseIds) {
  if (!caseMap.has(caseId)) {
    caseMap.set(caseId, {
      id: caseId,
      title: caseId,
      result: 'failed',
      duration_ms: 0,
      failure_type: 'execution_timeout',
      steps: [
        {
          action: 'execute',
          status: 'failed',
          message: 'El caso no se ejecuto: fallo de infraestructura antes del loop de casos (ver logs del runner).',
        },
      ],
    });
  }
}

let attempt = 0;

    while (attempt < maxRetries) {
      const failedIds = [...caseMap.values()].filter((c) => c.result === 'failed').map((c) => c.id);
      if (failedIds.length === 0) break;

      attempt += 1;
      console.log(`[${moduleName}] Reintento ${attempt}/${maxRetries} para ${failedIds.length} caso(s) fallido(s).`);

      const retryResult = await runner.execute(
        { ...plan, cases: failedIds },
        {
          headless: !(options.headed ?? false),
          fail_fast: false,
          storageResolver: (mod, caseId) => storage.getTestCase(mod, caseId),
          screenshotsDir: '.qa/reports/screenshots',
        }
      );

      for (const c of retryResult.cases) {
        caseMap.set(c.id, c);
      }
    }

    const mergedCases = [...caseMap.values()];
    const passed = mergedCases.filter((c) => c.result === 'passed').length;
    const failed = mergedCases.filter((c) => c.result === 'failed').length;
    const total = mergedCases.length;
    const overallResult: ExecutionStatus = failed === 0 ? 'passed' : passed === 0 ? 'failed' : 'partial';

    const finalResult: ExecutionResult = {
      ...result,
      finished_at: new Date().toISOString(),
      result: overallResult,
      summary: { ...result.summary, total, passed, failed },
      cases: mergedCases,
    };

    await storage.saveExecutionResult(finalResult.execution_id, finalResult);

    console.log(`[${moduleName}] ${passed}/${total} casos ok (${overallResult})`);

    overallPassed += passed;
    overallFailed += failed;
    overallTotal += total;
  }

  console.log(`Total: ${overallPassed}/${overallTotal} casos ok.`);
  process.exitCode = overallFailed > 0 ? 1 : 0;
}