import { createHash } from 'node:crypto';
import { existsSync, lstatSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';

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

export interface PlanMatrixPersisted {
  _version: '1';
  module: string;
  checksum: string;
  cases_fingerprint: string;
  cases_fingerprint_version: string;
  timestamp: string;
  algorithm: string;
  matrix: {
    cases: string[];
    environment: string;
  };
}

export interface PlanVigenciaCheck {
  validity: 'valid' | 'obsolete' | 'unverifiable' | 'not_found';
  is_fresh: boolean;
  code?: 'config_mismatch' | 'cases_mismatch' | 'historical_plan' | 'dag_order_mismatch' | 'plan_missing';
  reason?: string;
  stored_checksum?: string;
  current_checksum?: string;
  stored_cases_fingerprint?: string;
  current_cases_fingerprint?: string;
  desbloquear_con?: 'qap_plan';
}

export interface InspectPlanOptions {
  currentCases?: TestCase[];
  currentChecksum?: string;
  currentDagOrder?: string[];
}

function normalizeForHashing(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeForHashing);
  }
  if (value !== null && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const sortedKeys = Object.keys(obj).sort();
    const normalized: Record<string, unknown> = {};
    for (const key of sortedKeys) {
      normalized[key] = normalizeForHashing(obj[key]);
    }
    return normalized;
  }
  return value;
}

export function computeCasesFingerprint(cases: TestCase[]): {
  cases_fingerprint: string;
  cases_fingerprint_version: string;
} {
  const sortedCases = [...cases].sort((a, b) => a.id.localeCompare(b.id));
  const canonicalCases = sortedCases.map(tc => {
    const raw = tc as unknown as Record<string, unknown>;
    const rawTags = Array.isArray(raw.tags) ? (raw.tags as unknown[]) : [];
    const sortedTags = rawTags.map(String).sort();
    return {
      id: tc.id,
      name: tc.name ?? '',
      depends_on: Array.isArray(tc.depends_on) ? [...tc.depends_on].sort() : [],
      tags: sortedTags,
      manually_edited: Boolean(raw.manually_edited),
      steps: normalizeForHashing(tc.steps ?? []),
    };
  });

  const canonicalPayload = JSON.stringify({
    _version: '1',
    cases: canonicalCases,
  });

  const hash = createHash('sha256').update(canonicalPayload, 'utf8').digest('hex');
  return {
    cases_fingerprint: hash,
    cases_fingerprint_version: '1',
  };
}

export function inspectPlanVigencia(plan: unknown, options?: InspectPlanOptions): PlanVigenciaCheck {
  if (!plan || typeof plan !== 'object') {
    return {
      validity: 'not_found',
      is_fresh: false,
      code: 'plan_missing',
      reason: 'No se encontró el plan de pruebas especificado.',
      desbloquear_con: 'qap_plan',
    };
  }

  const raw = plan as Partial<PlanMatrixPersisted>;

  // Historical plan lacking cases_fingerprint: unverifiable (never auto-validated, never deleted)
  if (!raw.cases_fingerprint || typeof raw.cases_fingerprint !== 'string') {
    return {
      validity: 'unverifiable',
      is_fresh: false,
      code: 'historical_plan',
      reason: "El plan existente fue generado con una versión anterior sin huella determinista de casos ('cases_fingerprint'). Debe regenerarse con 'qap_plan'.",
      stored_checksum: typeof raw.checksum === 'string' ? raw.checksum : undefined,
      desbloquear_con: 'qap_plan',
    };
  }

  // Config drift check (routes or selectors)
  if (
    options?.currentChecksum !== undefined &&
    typeof raw.checksum === 'string' &&
    raw.checksum !== options.currentChecksum
  ) {
    return {
      validity: 'obsolete',
      is_fresh: false,
      code: 'config_mismatch',
      reason: 'La configuración del módulo (rutas o selectores) ha cambiado respecto al plan generado.',
      stored_checksum: raw.checksum,
      current_checksum: options.currentChecksum,
      stored_cases_fingerprint: raw.cases_fingerprint,
      desbloquear_con: 'qap_plan',
    };
  }

  // Cases drift check (steps, dependencies, manual flags)
  if (options?.currentCases !== undefined) {
    const { cases_fingerprint: currentFp } = computeCasesFingerprint(options.currentCases);
    if (raw.cases_fingerprint !== currentFp) {
      return {
        validity: 'obsolete',
        is_fresh: false,
        code: 'cases_mismatch',
        reason: 'Los casos de prueba (pasos, dependencias o metadatos) han cambiado respecto al plan generado.',
        stored_checksum: typeof raw.checksum === 'string' ? raw.checksum : undefined,
        stored_cases_fingerprint: raw.cases_fingerprint,
        current_cases_fingerprint: currentFp,
        desbloquear_con: 'qap_plan',
      };
    }
  }

  // DAG ordering drift check
  if (options?.currentDagOrder !== undefined) {
    const storedCases = raw.matrix?.cases;
    if (
      !Array.isArray(storedCases) ||
      storedCases.length !== options.currentDagOrder.length ||
      storedCases.some((c, idx) => c !== options.currentDagOrder![idx])
    ) {
      return {
        validity: 'obsolete',
        is_fresh: false,
        code: 'dag_order_mismatch',
        reason: 'El orden de ejecución de los casos ha variado respecto al grafo topológico actual.',
        stored_checksum: typeof raw.checksum === 'string' ? raw.checksum : undefined,
        stored_cases_fingerprint: raw.cases_fingerprint,
        desbloquear_con: 'qap_plan',
      };
    }
  }

  return {
    validity: 'valid',
    is_fresh: true,
    stored_checksum: typeof raw.checksum === 'string' ? raw.checksum : undefined,
    stored_cases_fingerprint: raw.cases_fingerprint,
  };
}

export async function verifyPlanIntegrity(
  storage: FileSystemStorage,
  moduleName: string
): Promise<PlanVigenciaCheck> {
  const planPath = `.qa/modules/${moduleName}/tests/plan.json`;
  let plan: unknown;
  try {
    plan = await storage.readJson<unknown>(planPath);
  } catch {
    return {
      validity: 'not_found',
      is_fresh: false,
      code: 'plan_missing',
      reason: `No se encontró el archivo de plan '${planPath}'.`,
      desbloquear_con: 'qap_plan',
    };
  }

  if (!plan) {
    return {
      validity: 'not_found',
      is_fresh: false,
      code: 'plan_missing',
      reason: `No se encontró el archivo de plan '${planPath}'.`,
      desbloquear_con: 'qap_plan',
    };
  }

  const raw = plan as Partial<PlanMatrixPersisted>;
  if (!raw.cases_fingerprint || typeof raw.cases_fingerprint !== 'string') {
    return inspectPlanVigencia(plan);
  }

  const moduleContext = await storage.getModuleContext(moduleName).catch(() => null);
  const moduleSelectors = await storage.getModuleSelectors(moduleName).catch(() => null);
  const routes = moduleContext?.routes ?? [];
  const selectors = moduleSelectors?.selectors ?? {};
  const hasher = new SemanticHasher();
  const currentChecksum = hasher.computeHash({ routes, selectors });

  const caseIds = await storage.listTestCases(moduleName).catch(() => []);
  const currentCases: TestCase[] = [];
  for (const id of caseIds) {
    try {
      const tc = await storage.getTestCase(moduleName, id);
      if (tc && Array.isArray(tc.steps) && tc.steps.length > 0) {
        currentCases.push(tc);
      }
    } catch {
      // Corrupted cases will trigger drift detection
    }
  }

  return inspectPlanVigencia(plan, {
    currentCases,
    currentChecksum,
  });
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

    // 1. Path resolution, strict write authorization, symlink/junction & hardlink rejection
    let rootDir: string;
    try {
      rootDir = projectRoot(args, this.dependencies, true);
    } catch (err) {
      if (err instanceof McpToolError) throw err;
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
          message: `El módulo '${moduleName}' no existe en .qa/modules/. Verifique los módulos registrados con 'qap_status' o inicialice el módulo en el workspace antes de planificar.`,
          desbloquear_con: 'qap_status',
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
      } catch {
        return result(
          {
            status: 'error',
            code: 'corrupt_test_case',
            module: moduleName,
            case_id: caseId,
            message: `Error al leer el archivo del caso de prueba '${caseId}': el archivo está corrupto o tiene un formato no válido.`,
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

    // 9. Compute deterministic cases fingerprint over executable test cases
    const { cases_fingerprint, cases_fingerprint_version } = computeCasesFingerprint(executableCases);

    // 10. Standard atomic persistence to .qa/modules/<name>/tests/plan.json
    const planMatrix: PlanMatrixPersisted = {
      _version: '1',
      module: moduleName,
      checksum: checksum ?? '',
      cases_fingerprint,
      cases_fingerprint_version,
      timestamp: new Date().toISOString(),
      algorithm: algorithm ?? 'sha256',
      matrix: {
        cases: orderedCaseIds,
        environment,
      },
    };

    const planPath = `.qa/modules/${moduleName}/tests/plan.json`;
    const fullPlanPath = resolve(rootDir, planPath);
    try {
      await storage.writeJson(planPath, planMatrix);
    } catch {
      // Clean up partial or empty 0-byte file stub if present (R2.4)
      try {
        if (existsSync(fullPlanPath)) {
          const stat = lstatSync(fullPlanPath);
          if (stat.size === 0) {
            unlinkSync(fullPlanPath);
          }
        }
      } catch {
        // Suppress cleanup failure
      }

      return result(
        {
          status: 'error',
          code: 'persistence_failed',
          module: moduleName,
          environment,
          persisted: false,
          message: `No se pudo persistir el plan de pruebas para el módulo '${moduleName}'. Verifique los permisos de escritura del proyecto.`,
        },
        true
      );
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
      cases_fingerprint,
      cases_fingerprint_version,
      persisted: true,
      plan_file: planPath,
    });
  }

  static inspectPlanVigencia(plan: unknown, options?: InspectPlanOptions): PlanVigenciaCheck {
    return inspectPlanVigencia(plan, options);
  }

  static async verifyPlanIntegrity(
    storage: FileSystemStorage,
    moduleName: string
  ): Promise<PlanVigenciaCheck> {
    return verifyPlanIntegrity(storage, moduleName);
  }
}
