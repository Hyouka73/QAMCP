import { realpathSync } from 'node:fs';
import { relative, isAbsolute, sep } from 'node:path';

import {
  FileSystemStorage,
  DependencyGraphResolver,
  UpdateGuard,
  SemanticHasher,
  type TestNode,
} from '@qap/knowledge';
import type { TestCase } from '@qap/engine';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import {
  McpToolError,
  type IMcpToolHandler,
  type McpInvocationContext,
} from '../dispatcher.js';

import {
  definition,
  isObject,
  projectRoot,
  result,
  validateBase,
  type StateDependencies,
} from './state-services.js';

export interface PlanArguments {
  targetPath?: string;
  module: string;
  environment?: string;
}

/**
 * Declarative MCP handler for `qap_plan`.
 * Resolves test execution plans using genuine test cases and topological DAG scheduling.
 */
export class PlanHandler implements IMcpToolHandler {
  readonly definition = definition('qap_plan');

  constructor(private readonly dependencies: StateDependencies) {}

  validateArguments(args: unknown): boolean {
    if (!isObject(args)) return false;
    if (!validateBase(args, ['targetPath', 'module', 'environment'])) return false;
    if (
      typeof args.module !== 'string' ||
      !args.module.trim() ||
      args.module.length > 128 ||
      [...args.module].some(c => c.charCodeAt(0) < 32) ||
      /[\\/:]/.test(args.module) ||
      args.module === '.' ||
      args.module === '..'
    ) {
      return false;
    }
    if (
      args.environment !== undefined &&
      (typeof args.environment !== 'string' || !args.environment.trim() || args.environment.length > 64)
    ) {
      return false;
    }
    return true;
  }

  async execute(raw: unknown, context: McpInvocationContext): Promise<CallToolResult> {
    if (!this.validateArguments(raw) || !isObject(raw)) {
      throw new McpToolError('invalid_arguments');
    }
    if (context?.signal?.aborted) {
      throw new McpToolError('cancelled');
    }

    const args = raw as PlanArguments;

    // 1. Path resolution, symlink/junction rejection, and canonicalization
    let rootDir: string;
    try {
      rootDir = projectRoot(args, this.dependencies, false);
    } catch {
      throw new McpToolError('invalid_arguments');
    }

    // 2. Strict authorization: verify targetPath is contained within host-authorized projectRoots
    const roots = this.dependencies.projectRoots ?? [process.cwd()];
    const isAuthorized = roots.some(allowed => {
      try {
        const canonicalAllowed = realpathSync(allowed);
        const rel = relative(canonicalAllowed, rootDir);
        return !isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${sep}`);
      } catch {
        return false;
      }
    });

    if (!isAuthorized) {
      throw new McpToolError('invalid_arguments');
    }

    const moduleName = args.module.trim();
    const environment =
      typeof args.environment === 'string' && args.environment.trim()
        ? args.environment.trim()
        : 'local';

    const storage = new FileSystemStorage({ rootDir });

    // 3. Module registration validation
    const moduleExists = await storage.hasModule(moduleName);
    if (!moduleExists) {
      return result(
        {
          status: 'blocked',
          code: 'module_not_found',
          module: moduleName,
          environment,
          message: `El módulo '${moduleName}' no existe en .qa/modules/. Ejecuta 'qap_discover' primero.`,
          desbloquear_con: 'qap_discover',
        },
        true
      );
    }

    // 4. Load real test cases from disk (.qa/modules/<name>/tests/TC-*.yaml)
    const caseIds = await storage.listTestCases(moduleName);
    if (caseIds.length === 0) {
      return result({
        status: 'empty',
        code: 'no_test_cases',
        module: moduleName,
        environment,
        cases: [],
        ordered_nodes: [],
        order: [],
        preserved_cases: [],
        has_cycles: false,
        cycles: [],
        message: `El módulo '${moduleName}' no tiene casos de prueba ejecutables en .qa/modules/${moduleName}/tests/.`,
      });
    }

    const cases: TestCase[] = [];
    const preservedCases: string[] = [];

    for (const caseId of caseIds) {
      try {
        const tc = await storage.getTestCase(moduleName, caseId);
        if (!tc) continue;
        if (UpdateGuard.isProtectedObject(tc as unknown as Record<string, unknown>)) {
          preservedCases.push(tc.id || caseId);
        }
        cases.push(tc);
      } catch (err) {
        return result(
          {
            status: 'error',
            code: 'corrupt_test_case',
            module: moduleName,
            case_id: caseId,
            message: `Error al leer el archivo del caso de prueba '${caseId}': ${err instanceof Error ? err.message : String(err)}`,
          },
          true
        );
      }
    }

    // Filter to cases that have real executable steps
    const executableCases = cases.filter(c => Array.isArray(c.steps) && c.steps.length > 0);
    if (executableCases.length === 0) {
      return result({
        status: 'empty',
        code: 'no_executable_test_cases',
        module: moduleName,
        environment,
        cases: [],
        ordered_nodes: [],
        order: [],
        preserved_cases: preservedCases,
        has_cycles: false,
        cycles: [],
        message: `El módulo '${moduleName}' no tiene casos de prueba con pasos ejecutables en .qa/modules/${moduleName}/tests/.`,
      });
    }

    // 5. Detect duplicate case IDs before resolution
    const seenIds = new Set<string>();
    const duplicateIds: string[] = [];
    for (const tc of executableCases) {
      const id = tc.id;
      if (!id || seenIds.has(id)) {
        duplicateIds.push(id || '(missing-id)');
      }
      seenIds.add(id);
    }

    if (duplicateIds.length > 0) {
      return result(
        {
          status: 'error',
          code: 'duplicate_case_ids',
          module: moduleName,
          environment,
          duplicate_ids: [...new Set(duplicateIds)],
          message: `Se detectaron IDs de casos de prueba duplicados en el módulo '${moduleName}': ${[...new Set(duplicateIds)].join(', ')}`,
        },
        true
      );
    }

    // 6. Detect missing dependencies: ensure each depId in depends_on exists in the module's cases
    const caseIdSet = new Set(executableCases.map(c => c.id));
    const missingDependencies: Array<{ case_id: string; missing_dependency: string }> = [];

    for (const tc of executableCases) {
      if (Array.isArray(tc.depends_on)) {
        for (const dep of tc.depends_on) {
          if (typeof dep === 'string' && dep.trim() && !caseIdSet.has(dep.trim())) {
            missingDependencies.push({ case_id: tc.id, missing_dependency: dep.trim() });
          }
        }
      }
    }

    if (missingDependencies.length > 0) {
      return result(
        {
          status: 'error',
          code: 'missing_dependencies',
          module: moduleName,
          environment,
          missing_dependencies: missingDependencies,
          message: `Se detectaron dependencias hacia casos no existentes: ${missingDependencies.map(d => `${d.case_id} -> ${d.missing_dependency}`).join(', ')}`,
        },
        true
      );
    }

    // 7. Topological DAG resolution
    const nodesForGraph: TestNode[] = executableCases.map(tc => ({
      ...tc,
      id: tc.id,
      depends_on: tc.depends_on ? [...tc.depends_on] : [],
    }));

    const graphResult = DependencyGraphResolver.resolveOrder(nodesForGraph);

    if (graphResult.hasCycles) {
      return result(
        {
          status: 'error',
          code: 'cyclic_dependency',
          module: moduleName,
          environment,
          has_cycles: true,
          cycles: graphResult.cycles ?? [],
          cases: executableCases.map(c => c.id),
          ordered_nodes: [],
          order: [],
          preserved_cases: preservedCases,
          message: `Se detectaron dependencias circulares en el grafo de pruebas del módulo '${moduleName}'.`,
        },
        true
      );
    }

    const orderedCaseIds = graphResult.orderedNodes.map(node => node.id);

    // 8. Deterministic semantic hash calculation (matching CLI standard)
    let checksum: string | undefined;
    let algorithm: string | undefined;
    try {
      const moduleContext = await storage.getModuleContext(moduleName).catch(() => null);
      const moduleSelectors = await storage.getModuleSelectors(moduleName).catch(() => null);
      const routes = moduleContext?.routes ?? [];
      const selectors = moduleSelectors?.selectors ?? {};
      const hasher = new SemanticHasher();
      const semanticHash = hasher.generate({ routes, selectors }, ['context.yaml', 'selectors.json']);
      checksum = semanticHash.hash;
      algorithm = semanticHash.algorithm;
    } catch {
      // Best-effort semantic hashing
    }

    // 9. Standard atomic persistence to .qa/modules/<name>/tests/plan.json
    const planMatrix = {
      _version: '1',
      module: moduleName,
      checksum: checksum ?? '',
      timestamp: new Date().toISOString(),
      algorithm: algorithm ?? 'sha256',
      matrix: {
        cases: orderedCaseIds,
        environment,
      },
    };

    const planPath = `.qa/modules/${moduleName}/tests/plan.json`;
    let persisted = false;
    try {
      await storage.writeJson(planPath, planMatrix);
      persisted = true;
    } catch {
      // If disk write fails, proceed with in-memory plan
    }

    return result({
      status: 'success',
      module: moduleName,
      environment,
      has_cycles: false,
      cycles: [],
      cases: executableCases.map(c => c.id),
      ordered_nodes: orderedCaseIds,
      order: orderedCaseIds,
      preserved_cases: preservedCases,
      total_cases: executableCases.length,
      checksum,
      persisted,
      plan_file: persisted ? planPath : undefined,
    });
  }
}
