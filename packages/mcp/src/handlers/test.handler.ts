import { realpathSync } from 'node:fs';

import { FileSystemStorage } from '@qap/knowledge';
import { SchemaValidator, type ExecutionResult, type TCCase } from '@qap/shared';
import type { IRunner } from '@qap/engine';
import { PlaywrightRunner, isUrlAllowedByPolicy, type PlaywrightRunnerOptions } from '@qap/playwright-runner';
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
import { verifyPlanIntegrity, type PlanVigenciaCheck } from './plan.handler.js';

export interface TestNavigationAuthorization {
  readonly projectId?: string;
  readonly projectRoot?: string;
  readonly allowedOrigins: readonly string[]; // e.g. ['http://localhost:*', 'http://127.0.0.1:*']
  readonly allowRedirectsToAllowedOnly?: boolean;
  readonly authorizedProfiles?: readonly string[];
}

export interface TestHandlerOptions {
  readonly testAuthorizations?: readonly TestNavigationAuthorization[];
  readonly storageResolver?: (moduleName: string, caseId: string) => Promise<TCCase>;
  readonly runner?: IRunner;
}

export interface TestArguments {
  targetPath?: string;
  module?: string;
  environment?: string;
  profile?: string;
  headed?: boolean;
}

/**
 * Declarative MCP handler for `qap_test`.
 * Executes preflight-verified test plans via PlaywrightRunner with strict TOCTOU snapshot isolation,
 * host-controlled navigation security, and authentic execution result persistence.
 */
export class TestHandler implements IMcpToolHandler {
  readonly definition = definition('qap_test');
  private readonly options: TestHandlerOptions;

  constructor(
    private readonly dependencies: StateDependencies,
    options?: TestHandlerOptions | readonly TestNavigationAuthorization[]
  ) {
    if (!options) {
      this.options = {};
    } else if (Array.isArray(options)) {
      this.options = { testAuthorizations: options };
    } else {
      this.options = options as TestHandlerOptions;
    }
  }

  validateArguments(args: unknown): boolean {
    if (!isObject(args)) return false;
    // Strict validation against public schema: targetPath, module, environment, profile, headed
    if (!validateBase(args, ['targetPath', 'module', 'environment', 'profile', 'headed'])) {
      return false;
    }

    if (args.module !== undefined && typeof args.module === 'string') {
      if (
        args.module.length > 128 ||
        [...args.module].some(c => c.charCodeAt(0) < 32) ||
        /[\\/:]/.test(args.module) ||
        args.module === '.' ||
        args.module === '..'
      ) {
        return false;
      }
    }

    if (
      args.environment !== undefined &&
      (typeof args.environment !== 'string' || !args.environment.trim() || args.environment.length > 64)
    ) {
      return false;
    }

    if (
      args.profile !== undefined &&
      (typeof args.profile !== 'string' || !args.profile.trim() || args.profile.length > 64)
    ) {
      return false;
    }

    if (args.headed !== undefined && typeof args.headed !== 'boolean') {
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

    const args = raw as TestArguments;

    // 1. Enforce explicit module requirement (R2)
    if (!args.module || typeof args.module !== 'string' || !args.module.trim()) {
      return result(
        {
          status: 'blocked',
          code: 'module_required',
          message:
            "Se requiere especificar un 'module' explícito para la ejecución de pruebas. La ejecución de la suite completa sin módulo está reservada para fases posteriores.",
          desbloquear_con: 'qap_plan',
        },
        true
      );
    }

    const moduleName = args.module.trim();
    const environment =
      typeof args.environment === 'string' && args.environment.trim()
        ? args.environment.trim()
        : 'local';

    // 2. Path resolution and strict containment via projectRoot (R2)
    let rootDir: string;
    try {
      rootDir = projectRoot(args, this.dependencies, true);
    } catch (err) {
      if (err instanceof McpToolError) throw err;
      throw new McpToolError('invalid_arguments');
    }

    const storage = new FileSystemStorage({ rootDir });

    // 3. Module existence verification
    const moduleExists = await storage.hasModule(moduleName);
    if (!moduleExists) {
      return result(
        {
          status: 'blocked',
          code: 'module_not_found',
          module: moduleName,
          environment,
          message: `El módulo '${moduleName}' no existe en .qa/modules/. Verifique los módulos disponibles con 'qap_status'.`,
          desbloquear_con: 'qap_status',
        },
        true
      );
    }

    // 4. Host Navigation Policy Authorization (R2)
    const authorizations = this.options.testAuthorizations ?? [];
    if (authorizations.length === 0) {
      return result(
        {
          status: 'blocked',
          code: 'navigation_not_authorized',
          module: moduleName,
          environment,
          message:
            'No existe una política confiable del host configurada para autorizar la navegación. La ejecución de pruebas sobre la red requiere autorización previa del host.',
          desbloquear_con: 'qap_context_set',
        },
        true
      );
    }

    let canonicalRoot: string;
    try {
      canonicalRoot = realpathSync(rootDir);
    } catch {
      canonicalRoot = rootDir;
    }

    // Find authorizations matching current project
    const matchingAuths = authorizations.filter(auth => {
      if (auth.projectRoot) {
        try {
          return realpathSync(auth.projectRoot) === canonicalRoot;
        } catch {
          return false;
        }
      }
      return true; // global policy if no specific projectRoot
    });

    if (matchingAuths.length === 0) {
      return result(
        {
          status: 'blocked',
          code: 'navigation_not_authorized',
          module: moduleName,
          environment,
          message: `El proyecto en '${rootDir}' no cuenta con autorización de navegación en la política del host.`,
          desbloquear_con: 'qap_context_set',
        },
        true
      );
    }

    const allowedOrigins = Array.from(
      new Set(matchingAuths.flatMap(a => Array.from(a.allowedOrigins ?? [])))
    );

    if (allowedOrigins.length === 0) {
      return result(
        {
          status: 'blocked',
          code: 'navigation_not_authorized',
          module: moduleName,
          environment,
          message: 'La política de navegación del host no contiene orígenes autorizados permitidos.',
          desbloquear_con: 'qap_context_set',
        },
        true
      );
    }

    // Check environment URL from environments.yaml against allowed origins
    let envUrl: string | undefined;
    try {
      const envConfig = await storage.getEnvironments();
      envUrl = envConfig?.environments?.[environment]?.url;
    } catch {
      envUrl = undefined;
    }

    if (envUrl && !isUrlAllowedByPolicy(envUrl, allowedOrigins)) {
      return result(
        {
          status: 'blocked',
          code: 'navigation_not_authorized',
          module: moduleName,
          environment,
          target_url: envUrl,
          message: `La URL base '${envUrl}' configurada para el entorno '${environment}' no está autorizada por la política de navegación del host.`,
          desbloquear_con: 'qap_context_set',
        },
        true
      );
    }

    // 5. Authentication Security (R2)
    // Absolute ban on admin-user.json
    if (args.profile === 'admin-user' || args.profile === 'admin') {
      // Check if specifically authorized in host policy
      const authorizedProfiles = Array.from(
        new Set(matchingAuths.flatMap(a => Array.from(a.authorizedProfiles ?? [])))
      );
      if (!authorizedProfiles.includes(args.profile)) {
        return result(
          {
            status: 'blocked',
            code: 'unauthorized_profile',
            module: moduleName,
            profile: args.profile,
            message: `El perfil de autenticación '${args.profile}' está restringido o no está autorizado por la política del host.`,
            desbloquear_con: 'qap_status',
          },
          true
        );
      }
    } else if (args.profile) {
      const authorizedProfiles = Array.from(
        new Set(matchingAuths.flatMap(a => Array.from(a.authorizedProfiles ?? [])))
      );
      if (authorizedProfiles.length > 0 && !authorizedProfiles.includes(args.profile)) {
        return result(
          {
            status: 'blocked',
            code: 'unauthorized_profile',
            module: moduleName,
            profile: args.profile,
            message: `El perfil de autenticación '${args.profile}' no está autorizado por la política del host.`,
            desbloquear_con: 'qap_status',
          },
          true
        );
      }
    }

    // 6. Preflight Plan Verification Gate (R1 / R2)
    const planCheck: PlanVigenciaCheck = await verifyPlanIntegrity(storage, moduleName, {
      environment,
    });

    if (planCheck.validity !== 'valid') {
      return result(
        {
          status: 'blocked',
          code: planCheck.code ?? 'plan_invalid',
          module: moduleName,
          environment,
          message:
            planCheck.reason ??
            `El plan de pruebas para el módulo '${moduleName}' no es válido o está obsoleto (validity: '${planCheck.validity}'). Debe regenerarse con 'qap_plan'.`,
          desbloquear_con: planCheck.desbloquear_con ?? 'qap_plan',
          vigencia: planCheck,
        },
        true
      );
    }

    const verifiedPlan = planCheck.plan;
    if (!verifiedPlan || !verifiedPlan.matrix || !Array.isArray(verifiedPlan.matrix.cases)) {
      return result(
        {
          status: 'blocked',
          code: 'corrupt_plan',
          module: moduleName,
          environment,
          message: 'La estructura del plan verificado en memoria es inválida.',
          desbloquear_con: 'qap_plan',
        },
        true
      );
    }

    // 7. TOCTOU Snapshot Protection (R1.6 / R2)
    // Populate an in-memory snapshot map of verified cases so PlaywrightRunner NEVER reads YAMLs from disk
    const snapshotMap = new Map<string, TCCase>();
    for (const tc of planCheck.verified_cases ?? []) {
      snapshotMap.set(tc.id, structuredClone(tc));
    }

    const storageResolver =
      this.options.storageResolver ??
      ((_mod: string, caseId: string) => {
        const tc = snapshotMap.get(caseId);
        if (!tc) {
          return Promise.reject(
            new Error(`El caso de prueba '${caseId}' no forma parte del snapshot verificado.`)
          );
        }
        return Promise.resolve(structuredClone(tc));
      });

    // 8. Safe Runner Execution (R2 / F7 / F8)
    const runner = this.options.runner ?? new PlaywrightRunner();
    const runnerOptions: PlaywrightRunnerOptions = {
      projectRoot: rootDir,
      environment,
      headless: args.headed !== true,
      fail_fast: false,
      registerSignalHandlers: false,
      signal: context?.signal,
      allowImplicitAuth: false,
      profile: args.profile,
      storageResolver,
      allowedOrigins,
    };

    let executionResult: ExecutionResult;
    try {
      executionResult = await runner.execute(
        {
          modules: [moduleName],
          cases: verifiedPlan.matrix.cases,
          environment,
        },
        runnerOptions
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return result(
        {
          status: 'error',
          code: 'execution_failed',
          module: moduleName,
          environment,
          message: `Fallo crítico durante la ejecución del runner: ${msg}`,
        },
        true
      );
    }

    // 9. Honest Infrastructure Error Isolation (R2 / R4)
    if (
      executionResult.result === 'error' &&
      executionResult.cases.some(
        c => c.result === 'not_run' && c.not_run_reason?.toLowerCase().includes('infraestructura')
      )
    ) {
      return result(
        {
          status: 'blocked',
          code: 'browser_not_available',
          module: moduleName,
          environment,
          message:
            executionResult.cases[0]?.not_run_reason ??
            'Error de infraestructura: el navegador Chromium no está disponible.',
          desbloquear_con: 'qap_status',
          execution: executionResult,
        },
        true
      );
    }

    // 10. Authentic Result Schema Validation and Persistence (R2 / F9)
    // Strictly validate against execution-result.schema.json
    const validator = new SchemaValidator();
    const schemaValidation = validator.validateExecutionResult(executionResult);
    if (!schemaValidation.valid) {
      // Never persist or report an execution that violates the canonical schema.
      // In particular, an invalid execution_id must never reach filesystem paths.
      return result(
        {
          status: 'error',
          code: 'invalid_execution_result',
          module: moduleName,
          environment,
          message: 'El runner devolvió un resultado incompatible con el esquema canónico. No se guardó ninguna ejecución.',
          desbloquear_con: 'qap_status',
        },
        true
      );
    }

    const executionId = executionResult.execution_id;
    // Schema v1 declares execution_id as a free-form string. Storage uses it in a
    // filesystem path; enforce a safe basename before any persistence attempt.
    if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(executionId)) {
      return result(
        {
          status: 'error',
          code: 'invalid_execution_id',
          module: moduleName,
          environment,
          message: 'El identificador de ejecución no es seguro para persistencia. No se guardó ninguna ejecución.',
        },
        true
      );
    }

    try {
      await storage.saveExecutionResult(executionId, executionResult);
    } catch {
      return result(
        {
          status: 'error',
          code: 'execution_not_persisted',
          module: moduleName,
          environment,
          message: 'La ejecución terminó, pero no se pudo guardar su resultado. No se acreditó como ejecución persistida.',
          desbloquear_con: 'qap_status',
        },
        true
      );
    }

    try {
      await storage.appendHistory(moduleName, {
        execution_id: executionId,
        timestamp: executionResult.finished_at,
        result: executionResult.result,
        summary: executionResult.summary,
      });
    } catch {
      // A report can use the saved execution, but the history is incomplete.
      // Do not claim full success or retry the browser execution implicitly.
      return result(
        {
          status: 'partial',
          code: 'execution_history_not_persisted',
          module: moduleName,
          environment,
          execution_id: executionId,
          execution_saved: true,
          history_saved: false,
          result: executionResult.result,
          summary: executionResult.summary,
          message: 'El resultado se guardó, pero falló la actualización del historial.',
          desbloquear_con: 'qap_status',
        },
        true
      );
    }

    // Note: NEVER create automated ConformityAssessment in SQLite (enforced by design).

    // 11. Final Structured MCP Response (Distinguishing PASS, FAIL, PARTIAL)
    return result({
      status: executionResult.result === 'passed' ? 'success' : 'completed',
      result: executionResult.result,
      module: moduleName,
      environment,
      execution_id: executionId,
      summary: executionResult.summary,
      cases: executionResult.cases,
      started_at: executionResult.started_at,
      finished_at: executionResult.finished_at,
    });
  }
}
