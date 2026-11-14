import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, unlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';

import {
  FileSystemStorage,
  DependencyGraphResolver,
  UpdateGuard,
  SemanticHasher,
  type TestNode,
} from '@qap/knowledge';
import { normalizeSlug } from '@qap/shared';
import type { TestCase } from '@qap/engine';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import type { DiscoveryDossierScope } from '../application/discovery-dossier.js';
import {
  McpToolError,
  type IMcpToolHandler,
  type McpInvocationContext,
} from '../dispatcher.js';

import { caseWorkflow } from './case-workflow.js';
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
  case_workflow?: unknown;
  discovery_revision_id?: string;
  tenant_id?: string;
  profile?: string;
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
  code?:
    | 'config_mismatch'
    | 'cases_mismatch'
    | 'historical_plan'
    | 'dag_order_mismatch'
    | 'plan_missing'
    | 'module_mismatch'
    | 'environment_mismatch'
    | 'incompatible_version'
    | 'corrupt_plan'
    | 'corrupt_test_case';
  reason?: string;
  stored_checksum?: string;
  current_checksum?: string;
  stored_cases_fingerprint?: string;
  current_cases_fingerprint?: string;
  desbloquear_con?: 'qap_plan';
  plan?: PlanMatrixPersisted;
  verified_cases?: TestCase[];
}

export interface InspectPlanOptions {
  expectedModule?: string;
  expectedEnvironment?: string;
  currentCases?: TestCase[];
  currentChecksum?: string;
  currentDagOrder?: string[];
}

export interface VerifyPlanIntegrityOptions {
  environment?: string;
}

export function validatePlanDagIntegrity(
  storedCases: string[],
  currentCases: TestCase[]
): { valid: boolean; code?: 'cases_mismatch' | 'dag_order_mismatch'; reason?: string } {
  // 1. Verificación de tipo y cardinalidad
  if (!Array.isArray(storedCases)) {
    return {
      valid: false,
      code: 'cases_mismatch',
      reason: 'La propiedad matrix.cases no es un array válido.',
    };
  }

  const expectedCasesMap = new Map<string, TestCase>();
  for (const tc of currentCases) {
    expectedCasesMap.set(tc.id, tc);
  }

  if (storedCases.length !== expectedCasesMap.size) {
    return {
      valid: false,
      code: 'cases_mismatch',
      reason: `El número de casos en el plan (${storedCases.length}) difiere de los casos ejecutables en disco (${expectedCasesMap.size}).`,
    };
  }

  // 2. Verificación de biyección y duplicados
  const positionMap = new Map<string, number>();
  for (let idx = 0; idx < storedCases.length; idx++) {
    const caseId = storedCases[idx];
    if (typeof caseId !== 'string' || !caseId.trim()) {
      return {
        valid: false,
        code: 'cases_mismatch',
        reason: `El identificador en el índice ${idx} de matrix.cases es inválido.`,
      };
    }
    if (positionMap.has(caseId)) {
      return {
        valid: false,
        code: 'cases_mismatch',
        reason: `El caso '${caseId}' está duplicado en matrix.cases.`,
      };
    }
    if (!expectedCasesMap.has(caseId)) {
      return {
        valid: false,
        code: 'cases_mismatch',
        reason: `El caso '${caseId}' en matrix.cases no existe entre los casos ejecutables del módulo.`,
      };
    }
    positionMap.set(caseId, idx);
  }

  // 3. Verificación de invariante topológico: para toda arista (dep -> case), pos(dep) < pos(case)
  for (const tc of currentCases) {
    const casePos = positionMap.get(tc.id)!;
    const deps = Array.isArray(tc.depends_on) ? tc.depends_on : [];

    for (const dep of deps) {
      if (typeof dep !== 'string' || !dep.trim()) continue;
      const depTrimmed = dep.trim();

      const depPos = positionMap.get(depTrimmed);
      if (depPos === undefined) {
        return {
          valid: false,
          code: 'dag_order_mismatch',
          reason: `El caso '${tc.id}' depende de '${depTrimmed}', el cual no está presente en matrix.cases.`,
        };
      }

      if (depPos >= casePos) {
        return {
          valid: false,
          code: 'dag_order_mismatch',
          reason: `Violación de dependencias DAG: la dependencia '${depTrimmed}' (índice ${depPos}) debe ejecutarse antes de '${tc.id}' (índice ${casePos}).`,
        };
      }
    }
  }

  return { valid: true };
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
  if (!plan || typeof plan !== 'object' || Array.isArray(plan)) {
    return {
      validity: 'unverifiable',
      is_fresh: false,
      code: 'corrupt_plan',
      reason: 'El plan de pruebas no tiene una estructura de objeto válida.',
      desbloquear_con: 'qap_plan',
    };
  }

  const raw = plan as Partial<PlanMatrixPersisted>;
  const rawObj = plan as Record<string, unknown>;

  // 1. Verificación de versión de esquema del plan
  const schemaVersion = rawObj._version;
  if (schemaVersion === undefined || schemaVersion !== '1') {
    const versionDisplay = typeof schemaVersion === 'string' ? schemaVersion : JSON.stringify(schemaVersion);
    return {
      validity: 'unverifiable',
      is_fresh: false,
      code: 'incompatible_version',
      reason:
        schemaVersion === undefined
          ? "El plan carece del campo obligatorio de versión de esquema ('_version')."
          : `La versión de esquema del plan ('${versionDisplay}') no es compatible. Versiones soportadas: '1'.`,
      desbloquear_con: 'qap_plan',
    };
  }

  // 1b. Verificación de presencia de checksum
  if (!raw.checksum || typeof raw.checksum !== 'string' || !raw.checksum.trim()) {
    return {
      validity: 'unverifiable',
      is_fresh: false,
      code: 'corrupt_plan',
      reason: "El plan carece de un checksum de configuración ('checksum') válido.",
      desbloquear_con: 'qap_plan',
    };
  }

  // 2. Planes históricos sin huella determinista
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

  // 3. Compatibilidad de versión de huella de casos
  const fpVersion = rawObj.cases_fingerprint_version;
  if (fpVersion === undefined || fpVersion !== '1') {
    const fpVersionDisplay = typeof fpVersion === 'string' ? fpVersion : JSON.stringify(fpVersion);
    return {
      validity: 'unverifiable',
      is_fresh: false,
      code: 'incompatible_version',
      reason:
        fpVersion === undefined
          ? "El plan carece del campo obligatorio de versión de huella de casos ('cases_fingerprint_version')."
          : `La versión de huella de casos ('${fpVersionDisplay}') no es reconocida o compatible. Versiones soportadas: '1'.`,
      stored_checksum: typeof raw.checksum === 'string' ? raw.checksum : undefined,
      desbloquear_con: 'qap_plan',
    };
  }

  // 4. Verificación de módulo objetivo
  if (typeof raw.module !== 'string' || !raw.module.trim()) {
    return {
      validity: 'unverifiable',
      is_fresh: false,
      code: 'corrupt_plan',
      reason: "El plan carece de un campo 'module' válido.",
      desbloquear_con: 'qap_plan',
    };
  }
  if (options?.expectedModule !== undefined && raw.module !== options.expectedModule) {
    return {
      validity: 'obsolete',
      is_fresh: false,
      code: 'module_mismatch',
      reason: `El plan especifica el módulo '${raw.module}', pero se solicitó '${options.expectedModule}'.`,
      stored_checksum: typeof raw.checksum === 'string' ? raw.checksum : undefined,
      stored_cases_fingerprint: raw.cases_fingerprint,
      desbloquear_con: 'qap_plan',
    };
  }

  // 5. Verificación de estructura de matriz
  if (!raw.matrix || typeof raw.matrix !== 'object' || !Array.isArray(raw.matrix.cases)) {
    return {
      validity: 'unverifiable',
      is_fresh: false,
      code: 'corrupt_plan',
      reason: "El plan carece de una sección 'matrix.cases' válida.",
      stored_checksum: typeof raw.checksum === 'string' ? raw.checksum : undefined,
      stored_cases_fingerprint: raw.cases_fingerprint,
      desbloquear_con: 'qap_plan',
    };
  }

  // 6. Verificación de entorno objetivo
  if (typeof raw.matrix.environment !== 'string' || !raw.matrix.environment.trim()) {
    return {
      validity: 'unverifiable',
      is_fresh: false,
      code: 'corrupt_plan',
      reason: "El plan carece de un entorno válido en 'matrix.environment'.",
      stored_checksum: typeof raw.checksum === 'string' ? raw.checksum : undefined,
      stored_cases_fingerprint: raw.cases_fingerprint,
      desbloquear_con: 'qap_plan',
    };
  }
  if (options?.expectedEnvironment !== undefined && raw.matrix.environment !== options.expectedEnvironment) {
    return {
      validity: 'obsolete',
      is_fresh: false,
      code: 'environment_mismatch',
      reason: `El plan fue generado para el entorno '${raw.matrix.environment}', pero se solicitó '${options.expectedEnvironment}'.`,
      stored_checksum: typeof raw.checksum === 'string' ? raw.checksum : undefined,
      stored_cases_fingerprint: raw.cases_fingerprint,
      desbloquear_con: 'qap_plan',
    };
  }

  // 7. Deriva de configuración (rutas o selectores)
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

  // 8. Deriva de casos (huella determinista) y validación DAG en matrix.cases
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

    // Validación estricta del array matrix.cases contra dependencias DAG
    const dagResult = validatePlanDagIntegrity(raw.matrix.cases, options.currentCases);
    if (!dagResult.valid) {
      return {
        validity: 'obsolete',
        is_fresh: false,
        code: dagResult.code ?? 'dag_order_mismatch',
        reason: dagResult.reason ?? 'El orden de casos en el plan no respeta el grafo de dependencias.',
        stored_checksum: typeof raw.checksum === 'string' ? raw.checksum : undefined,
        stored_cases_fingerprint: raw.cases_fingerprint,
        desbloquear_con: 'qap_plan',
      };
    }
  } else if (options?.currentDagOrder !== undefined) {
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
    plan: raw as PlanMatrixPersisted,
    verified_cases: options?.currentCases,
  };
}

export async function verifyPlanIntegrity(
  storage: FileSystemStorage,
  moduleName: string,
  options?: VerifyPlanIntegrityOptions
): Promise<PlanVigenciaCheck> {
  const planPath = `.qa/modules/${moduleName}/tests/plan.json`;

  const fileExists = await storage.exists(planPath);
  if (!fileExists) {
    return {
      validity: 'not_found',
      is_fresh: false,
      code: 'plan_missing',
      reason: `No se encontró el archivo de plan '${planPath}'.`,
      desbloquear_con: 'qap_plan',
    };
  }

  let plan: unknown;
  try {
    plan = await storage.readJson<unknown>(planPath);
  } catch {
    return {
      validity: 'unverifiable',
      is_fresh: false,
      code: 'corrupt_plan',
      reason: `El archivo de plan '${planPath}' está corrupto o contiene JSON no válido.`,
      desbloquear_con: 'qap_plan',
    };
  }

  const raw = plan as Partial<PlanMatrixPersisted>;
  if (!raw.cases_fingerprint || typeof raw.cases_fingerprint !== 'string') {
    return inspectPlanVigencia(plan, {
      expectedModule: moduleName,
      expectedEnvironment: options?.environment,
    });
  }

  const moduleContext = await storage.getModuleContext(moduleName).catch(() => null);
  const moduleSelectors = await storage.getModuleSelectors(moduleName).catch(() => null);
  const routes = moduleContext?.routes ?? [];
  const selectors = moduleSelectors?.selectors ?? {};
  const hasher = new SemanticHasher();
  const currentChecksum = hasher.computeHash({ routes, selectors });

  let caseIds: string[];
  try {
    caseIds = await storage.listTestCases(moduleName);
  } catch (err) {
    return {
      validity: 'unverifiable',
      is_fresh: false,
      code: 'corrupt_test_case',
      reason: `Error al listar los casos de prueba del módulo '${moduleName}': ${err instanceof Error ? err.message : String(err)}`,
      desbloquear_con: 'qap_plan',
    };
  }
  const currentCases: TestCase[] = [];
  for (const id of caseIds) {
    try {
      const tc = await storage.getTestCase(moduleName, id);
      if (tc && Array.isArray(tc.steps) && tc.steps.length > 0) {
        currentCases.push(tc);
      }
    } catch {
      return {
        validity: 'unverifiable',
        is_fresh: false,
        code: 'corrupt_test_case',
        reason: `Error al leer el archivo del caso de prueba '${id}': el archivo está corrupto o tiene formato inválido.`,
        desbloquear_con: 'qap_plan',
      };
    }
  }

  return inspectPlanVigencia(plan, {
    expectedModule: moduleName,
    expectedEnvironment: options?.environment,
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
    if (!validateBase(args, ['targetPath', 'module', 'environment', 'case_workflow', 'discovery_revision_id', 'tenant_id', 'profile'])) return false;
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
    if (
      args.discovery_revision_id !== undefined &&
      (typeof args.discovery_revision_id !== 'string' || !args.discovery_revision_id.trim() || args.discovery_revision_id.length > 128)
    ) {
      return false;
    }
    if (
      args.tenant_id !== undefined &&
      (typeof args.tenant_id !== 'string' || !args.tenant_id.trim() || args.tenant_id.length > 128)
    ) {
      return false;
    }
    if (
      args.profile !== undefined &&
      (typeof args.profile !== 'string' || !args.profile.trim() || args.profile.length > 128)
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

    const args = raw as unknown as PlanArguments;

    // 1. Path resolution, strict write authorization, symlink/junction & hardlink rejection
    let rootDir: string;
    try {
      rootDir = projectRoot(args, this.dependencies, true);
    } catch (err) {
      if (err instanceof McpToolError) throw err;
      throw new McpToolError('invalid_arguments');
    }

    const moduleName = args.module.trim();
    const explicitEnvironment =
      typeof args.environment === 'string' && args.environment.trim()
        ? args.environment.trim()
        : undefined;
    let environment = explicitEnvironment ?? 'local';

    const appService = this.dependencies.applicationService;
    const appProject = appService ? appService.findActiveProjectByRoot(rootDir) : null;
    if (args.discovery_revision_id !== undefined) {
      if (!appService) {
        return result({ status: 'blocked', code: 'application_service_unavailable', module: moduleName }, true);
      }
      if (!appProject) {
        return result({ status: 'blocked', code: 'project_not_found', module: moduleName }, true);
      }
    }

    let effectiveScope: (DiscoveryDossierScope & { readonly base_url?: string }) | undefined;
    let validatedDiscoveryRevisionId: string | undefined;
    if (appService && appProject) {
      const requestedProfile = typeof args.profile === 'string' && args.profile.trim() ? args.profile.trim() : undefined;
      const requestedTenant = typeof args.tenant_id === 'string' && args.tenant_id.trim() ? args.tenant_id.trim() : undefined;
      const scopeRes = appService.resolveEffectiveScope({
        projectId: appProject.project_id,
        moduleName,
        environment: explicitEnvironment,
        tenantId: requestedTenant,
        profile: requestedProfile,
      });
      if (!scopeRes.ok) {
        return result(
          {
            status: 'blocked',
            code: scopeRes.code,
            module: moduleName,
            message: scopeRes.reason,
            question: scopeRes.question,
            field: scopeRes.field,
            ...(scopeRes.options ? { options: scopeRes.options } : {}),
          },
          true,
        );
      }
      effectiveScope = scopeRes.scope;
      environment = scopeRes.scope.environment_name;

      if (args.discovery_revision_id !== undefined) {
        const scopeCheck = appService.validateDiscoveryRevisionScope(args.discovery_revision_id.trim(), {
          projectId: effectiveScope.project_id,
          applicationId: effectiveScope.application_id,
          moduleKey: effectiveScope.module_key,
          environmentId: effectiveScope.environment_id,
          environmentName: effectiveScope.environment_name,
          tenantId: effectiveScope.tenant_id,
          checkTenant: true,
          profileId: effectiveScope.profile_id,
          checkProfile: true,
          role: effectiveScope.role,
          checkRole: true,
        });
        if (!scopeCheck.ok) {
          return result(
            {
              status: 'blocked',
              code: scopeCheck.code,
              module: moduleName,
              discovery_revision_id: args.discovery_revision_id.trim(),
              message: scopeCheck.reason,
            },
            true,
          );
        }
        validatedDiscoveryRevisionId = scopeCheck.revision.revision_id;
      }
    }

    if (args.case_workflow !== undefined) {
      const value = await caseWorkflow(
        rootDir,
        moduleName,
        args.case_workflow,
        this.dependencies,
        validatedDiscoveryRevisionId || effectiveScope
          ? {
              ...(validatedDiscoveryRevisionId ? { discoveryRevisionId: validatedDiscoveryRevisionId } : {}),
              ...(effectiveScope ? { effectiveScope } : {}),
            }
          : undefined,
      );
      return result(value, value.status === 'blocked');
    }
    const storage = new FileSystemStorage({ rootDir });

    // 3. Module registration validation
    let moduleExists = await storage.hasModule(moduleName);
    if (!moduleExists && this.dependencies.applicationService) {
      const appProject = this.dependencies.applicationService.findActiveProjectByRoot(rootDir);
      if (appProject) {
        const snapshot = this.dependencies.applicationService.resumeProject(appProject.project_id);
        const ownedModule = snapshot.modules.find((m) => m.key === moduleName);
        if (ownedModule) {
          mkdirSync(join(rootDir, '.qa', 'modules', moduleName, 'tests'), { recursive: true });
          moduleExists = true;
        }
      }
    }
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
    moduleName: string,
    options?: VerifyPlanIntegrityOptions
  ): Promise<PlanVigenciaCheck> {
    return verifyPlanIntegrity(storage, moduleName, options);
  }
}
