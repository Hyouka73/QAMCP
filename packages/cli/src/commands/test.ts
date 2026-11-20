import { callLocalQapTool, readProjectResetState, resetHostDirectory, withLocalQapClient, withProjectOperation } from '@qap/mcp';
import { realpathSync } from 'node:fs';
import { FileSystemStorage } from '@qap/knowledge';
import { GitAdapter } from '@qap/git-adapter';

import { DataError } from '../errors.js';

export interface TestCommandOptions {
  tags?: string;
  case?: string;
  shard?: string;
  headed?: boolean;
  retries?: string;
  failFast?: boolean;
  fromDiff?: boolean;
  forceUnlock?: boolean;
  profile?: string;
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

  if (options.forceUnlock) {
    const { LockManager } = await import ('@qap/knowledge');
    const rootDir = realpathSync(process.cwd());
    const host = resetHostDirectory();
    await withProjectOperation(host, () => {
      const state = readProjectResetState(host, rootDir);
      if (state?.state === 'pending' || state?.state === 'complete') throw new DataError('El workspace necesita recuperarse antes de desbloquear.');
      return new LockManager({ rootDir }).forceUnlock(moduleArg);
    });
    console.log(
      moduleArg 
      ? `Lock del módulo '${moduleArg}' liberado forzadamente antes de ejecutar.`
      : 'Todos los locks activos fueron liberados forzadamente antes de ejecutar.'
    );
  }

  let modules: string[];

  if (options.fromDiff) {
    const gitAdapter = new GitAdapter({ cwd: process.cwd() });
    const affectedModules = await gitAdapter.getAffectedModules(storage);

    if (moduleArg) {
      // Intersección: solo correr el módulo pedido si de verdad está afectado.
      modules = affectedModules.includes(moduleArg) ? [moduleArg] : [];
    } else {
      modules = affectedModules;
    }

    if (modules.length === 0) {
      console.log(
        '--from-diff: no hay módulos afectados por los cambios actuales respecto a la rama base. Nada que ejecutar.'
      );
      process.exitCode = 0;
      return;
    }

    console.log(`--from-diff: acotando ejecución a ${modules.length} módulo(s) afectado(s): ${modules.join(', ')}`);
  } else {
    modules = moduleArg ? [moduleArg] : await storage.listModules();
  }

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
      if (options.case && caseId.replace(/^TC-/, '') !== options.case.replace(/^TC-/, '')) continue;

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

  let failed = 0;
  let passed = 0;
  await withLocalQapClient(async client => {
    const call = async (name: string, args: Record<string, unknown>) => {
      const { payload, isError } = await callLocalQapTool(client, name, { targetPath: process.cwd(), ...args });
      if (isError) throw new DataError(payload.code ?? 'qap_mcp_error');
      return payload;
    };
    for (const [moduleName, caseIds] of byModule) {
      const profile = options.profile ? { profile: options.profile } : {};
      const plan = await call('qap_plan', { module: moduleName, ...profile });
      const requested = new Set(caseIds.map(id => id.replace(/^TC-/, '')));
      let pending = (plan.cases ?? []).filter((id: string) => requested.has(id)) as string[];
      if (!pending.length) {
        console.warn(`[${moduleName}] Sin casos elegibles bajo la política del host.`);
        continue;
      }
      for (let retry = 0; pending.length && retry <= maxRetries; retry++) {
        const execution = await call('qap_test', { module: moduleName, environment: plan.environment,
          case_ids: pending, headed: options.headed ?? false, ...profile });
        const report = await call('qap_report', { executionId: execution.execution_id, format: 'all' });
        console.log(`[${moduleName}] ${execution.result} · ${report.executionId}`);
        passed += execution.summary.passed;
        pending = (execution.cases ?? []).filter((item: { result: string }) => item.result !== 'passed')
          .map((item: { id: string }) => item.id);
        if (options.failFast && pending.length) break;
      }
      failed += pending.length;
      if (options.failFast && failed) break;
    }
  });
  console.log(`Total: ${passed}/${passed + failed} casos ok.`);
  process.exitCode = failed > 0 ? 1 : 0;
}
