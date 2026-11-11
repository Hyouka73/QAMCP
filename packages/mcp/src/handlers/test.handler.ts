import { createHash } from 'node:crypto';
import { realpathSync } from 'node:fs';

import { SessionStore, readProfile } from '@qap/auth';
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
import { interactiveBlocked, interactiveScope, sameInteractiveScope, validInteractiveProfile, type InteractiveAccess } from '../interactive-access.js';

import { verifyCaseApproval } from './case-workflow.js';
import {
  binding,
  definition,
  isObject,
  projectRoot,
  result,
  validateBase,
  type StateDependencies,
} from './state-services.js';
import { verifyPlanIntegrity, type PlanVigenciaCheck } from './plan.handler.js';
import { isInternallyConsistentExecution } from './execution-evidence.js';

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
  readonly interactiveAccess?: InteractiveAccess;
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
    const interactive = this.options.interactiveAccess;
    const enforceHostPolicy = !interactive || authorizations.length > 0;
    if (!interactive && authorizations.length === 0) {
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

    if (enforceHostPolicy && matchingAuths.length === 0) {
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

    if (enforceHostPolicy && allowedOrigins.length === 0) {
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

    const scope = interactive ? await interactiveScope(rootDir, this.dependencies, environment) : undefined;
    if (interactive && (!scope || (envUrl && !isUrlAllowedByPolicy(envUrl, [scope.origin])) ||
        (enforceHostPolicy && !matchingAuths.some(auth =>
          isUrlAllowedByPolicy(scope.baseUrl, [...auth.allowedOrigins]) &&
          (!args.profile || auth.authorizedProfiles?.includes(args.profile)))))) {
      return interactiveBlocked('authorization_context_mismatch');
    }

    if (enforceHostPolicy && envUrl && !isUrlAllowedByPolicy(envUrl, allowedOrigins)) {
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
    if (enforceHostPolicy && (args.profile === 'admin-user' || args.profile === 'admin')) {
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
    } else if (enforceHostPolicy && args.profile) {
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

    const lifecycle = await storage.getLifecycleState();
    const bound = binding(rootDir, this.dependencies);
    if (bound && (environment !== bound.environmentId || (lifecycle.session?.auth?.profile && lifecycle.session.auth.profile !== args.profile))) return result({ status: 'blocked', code: 'auth_context_mismatch' }, true);
    if (bound && lifecycle.session?.auth?.required && !args.profile) return result({ status: 'blocked', code: 'auth_profile_required' }, true);
    if (enforceHostPolicy && args.profile && bound && !matchingAuths.some(a => a.authorizedProfiles?.includes(args.profile!))) {
      return result({ status: 'blocked', code: 'unauthorized_profile' }, true);
    }
    if (!interactive && args.profile && bound) {
      const profile = await readProfile(args.profile, rootDir);
      const session = new SessionStore(undefined, rootDir).getValidSession(args.profile);
      if (!profile?.verified || profile.application_id !== bound.applicationId || profile.env !== environment || !session) return result({ status: 'blocked', code: 'auth_session_expired' }, true);
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

    let approval;
    try { approval = await verifyCaseApproval(rootDir, moduleName, [...snapshotMap.values()], this.dependencies); }
    catch { return result({ status: 'blocked', code: 'case_approval_unavailable' }, true); }
    if (!approval.allowed) return result({ status: 'blocked', ...approval }, true);

    let verifiedSession: PlaywrightRunnerOptions['verifiedSession'];
    if (interactive && scope) {
      if (args.profile !== undefined && !validInteractiveProfile(args.profile)) return interactiveBlocked('unauthorized_profile');
      if (snapshotMap.size === 0 || [...snapshotMap.values()].some(tc =>
        tc.steps.some(step => !['navigate', 'click', 'assert', 'waitFor'].includes(step.type)))) {
        return interactiveBlocked('test_scope_not_read_only');
      }
      const digest = createHash('sha256').update(JSON.stringify([...snapshotMap.values()])).digest('hex');
      const blocked = await interactive.consent('test', scope, args.profile, scope.baseUrl,
        `Módulo: ${moduleName}\nCasos: ${snapshotMap.size}\nPlan SHA-256: ${digest}`, context.signal);
      if (blocked) return interactiveBlocked(blocked);
      const current = await interactiveScope(projectRoot(args, this.dependencies, true), this.dependencies, environment);
      const currentLifecycle = await storage.getLifecycleState();
      const currentApproval = await verifyCaseApproval(rootDir, moduleName, [...snapshotMap.values()], this.dependencies);
      if (!sameInteractiveScope(scope, current) ||
          JSON.stringify(currentLifecycle.session?.auth) !== JSON.stringify(lifecycle.session?.auth) ||
          !currentApproval.allowed || currentApproval.request_digest !== approval.request_digest) {
        return interactiveBlocked('authorization_context_mismatch');
      }
      if (context.signal.aborted) return interactiveBlocked('test_authorization_cancelled');
      if (args.profile) {
        verifiedSession = interactive.readSession(scope, args.profile);
        if (!verifiedSession) return interactiveBlocked('auth_session_expired');
      }
    }

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
      allowedOrigins: scope ? [scope.origin] : allowedOrigins,
      interactiveReadOnly: Boolean(interactive),
      verifiedSession,
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
      const msg = interactive ? 'Ejecución interactiva interrumpida.' : err instanceof Error ? err.message : String(err);
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

    if (!isInternallyConsistentExecution(executionResult, { module: moduleName, environment })) {
      return result(
        {
          status: 'error',
          code: 'inconsistent_execution_result',
          module: moduleName,
          environment,
          message: 'El resultado devuelto por el runner no corresponde al módulo/entorno o sus conteos y estados son inconsistentes. No se guardó evidencia.',
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

    if (approval.request_digest) {
      try { await storage.writeJson('.qa/executions/' + executionId + '.trace.json', {
        execution_id: executionId, case_approval_digest: approval.request_digest, requirements: approval.requirements,
        cases: [...snapshotMap.values()].map(c => ({ id: c.id, source_rule_id: c.source_rule_id })) }); }
      catch { return result({ status: 'partial', code: 'execution_trace_not_persisted', execution_id: executionId,
        execution_saved: true, trace_saved: false, summary: executionResult.summary,
        message: 'La ejecución está guardada; falta persistir su trazabilidad. No reejecutar el navegador implícitamente.', desbloquear_con: 'qap_report' }, true); }
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

    if (executionResult.result === 'error') {
      // Unlike a failed product assertion, a critical runner error is not
      // a completed functional evaluation. Keep its persisted evidence visible
      // while marking the MCP call as unsuccessful.
      return result(
        {
          status: 'error',
          code: 'runner_execution_error',
          module: moduleName,
          environment,
          execution_id: executionId,
          summary: executionResult.summary,
          message: 'La ejecución se interrumpió. El resultado y los casos no ejecutados quedaron registrados sin acreditar conformidad.',
          desbloquear_con: 'qap_status',
        },
        true
      );
    }

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
