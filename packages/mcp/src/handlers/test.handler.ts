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
import { atomicRecordTestAuthorization, type ITestAuthorizer } from '../test-authorizer.js';

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
  readonly testAuthorizer?: ITestAuthorizer;
  readonly hostTestRegistryPath?: string;
  readonly storageResolver?: (moduleName: string, caseId: string) => Promise<TCCase>;
  readonly runner?: IRunner;
}

export interface TestArguments {
  targetPath?: string;
  module?: string;
  environment?: string;
  profile?: string;
  headed?: boolean;
  case_ids?: string[];
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
    // Strict validation against public schema: targetPath, module, environment, profile, headed, case_ids
    if (!validateBase(args, ['targetPath', 'module', 'environment', 'profile', 'headed', 'case_ids'])) {
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

    if (args.case_ids !== undefined) {
      if (!Array.isArray(args.case_ids) || args.case_ids.length > 500) {
        return false;
      }
      for (const item of args.case_ids) {
        if (
          typeof item !== 'string' ||
          !item.trim() ||
          item.length > 128 ||
          /[\\/:]/.test(item) ||
          [...item].some(c => c.charCodeAt(0) < 32)
        ) {
          return false;
        }
      }
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

    const appService = this.dependencies.applicationService;
    const appProject = appService?.findActiveProjectByRoot(rootDir) ?? null;
    const appSnapshot = appProject && appService ? appService.resumeProject(appProject.project_id) : null;

    // 4. Host Navigation Policy Authorization (R2) + ApplicationService Execute Authority
    let yamlEnvUrl: string | undefined;
    let isProductionEnv = environment === 'production';
    try {
      const envConfig = await storage.getEnvironments();
      const envRecord = envConfig?.environments?.[environment] as Record<string, unknown> | undefined;
      yamlEnvUrl = typeof envRecord?.url === 'string' ? envRecord.url : undefined;
      if (envRecord?.is_production === true) {
        isProductionEnv = true;
      }
    } catch {
      yamlEnvUrl = undefined;
    }
    const canonicalEnvUrl = appSnapshot?.environment?.base_url;
    const envUrl = canonicalEnvUrl ?? yamlEnvUrl;
    if (appSnapshot?.environment?.is_production === true) {
      isProductionEnv = true;
    }
    const hasDiscrepantYamlUrl = Boolean(
      yamlEnvUrl &&
      canonicalEnvUrl &&
      (() => {
        try {
          return new URL(yamlEnvUrl).origin !== new URL(canonicalEnvUrl).origin;
        } catch {
          return yamlEnvUrl !== canonicalEnvUrl;
        }
      })(),
    );

    let envOrigin: string | undefined;
    if (envUrl) {
      try {
        envOrigin = new URL(envUrl).origin;
      } catch {
        envOrigin = undefined;
      }
    }

    if (appProject && appService) {
      const accessCheck = appService.authority.check(appProject.project_id, 'access', {
        root_path: rootDir,
      });
      if (!accessCheck.allowed && (accessCheck.reason === 'revoked' || accessCheck.reason === 'expired')) {
        return result(
          {
            status: 'blocked',
            code: accessCheck.code,
            module: moduleName,
            environment,
            message: 'El acceso al proyecto fue revocado o expiró. No se puede ejecutar pruebas.',
            desbloquear_con: 'qap_status',
          },
          true,
        );
      }

      const executeCheck = appService.authority.check(appProject.project_id, 'execute', {
        root_path: rootDir,
        ...(envOrigin ? { origin: envOrigin } : {}),
        ...(appSnapshot?.environment?.env_id ? { env_id: appSnapshot.environment.env_id } : {}),
      });
      if (!executeCheck.allowed && (executeCheck.reason === 'revoked' || executeCheck.reason === 'expired')) {
        return result(
          {
            status: 'blocked',
            code: executeCheck.code,
            module: moduleName,
            environment,
            message:
              'La autorización de ejecución para este proyecto fue revocada o expiró. Autoriza nuevamente antes de ejecutar.',
            desbloquear_con: 'qap_status',
          },
          true,
        );
      }

      if (args.profile) {
        const loginCheck = appService.authority.check(appProject.project_id, 'login', {
          ...(envOrigin ? { origin: envOrigin } : {}),
          profile_id: args.profile,
        });
        if (!loginCheck.allowed && (loginCheck.reason === 'revoked' || loginCheck.reason === 'expired')) {
          return result(
            {
              status: 'blocked',
              code: loginCheck.reason === 'revoked' ? 'auth_session_revoked' : 'auth_session_expired',
              module: moduleName,
              environment,
              profile: args.profile,
              message:
                loginCheck.reason === 'revoked'
                  ? `La autorización de inicio de sesión para '${args.profile}' fue revocada. Nunca se degradará a anónimo.`
                  : `La autorización de inicio de sesión para '${args.profile}' expiró. Revalida con 'qap_auth_add'.`,
              desbloquear_con: 'qap_auth_add',
            },
            true,
          );
        }
      }
    }

    let canonicalRoot: string;
    try {
      canonicalRoot = realpathSync(rootDir);
    } catch {
      canonicalRoot = rootDir;
    }

    const staticAuths = this.options.testAuthorizations ?? [];
    let authorizations: TestNavigationAuthorization[] = [...staticAuths];

    let matchingAuths = authorizations.filter(auth => {
      if (auth.projectRoot) {
        try {
          return realpathSync(auth.projectRoot) === canonicalRoot;
        } catch {
          return false;
        }
      }
      return true; // global policy if no specific projectRoot
    });

    const hasStaticOriginMatch =
      matchingAuths.length > 0 &&
      matchingAuths.some(a => (a.allowedOrigins ?? []).length > 0) &&
      (!envUrl ||
        isUrlAllowedByPolicy(
          envUrl,
          Array.from(new Set(matchingAuths.flatMap(a => Array.from(a.allowedOrigins ?? [])))),
        ));

    if (!hasStaticOriginMatch && appProject && appService) {
      const executeGrantCheck = appService.authority.check(appProject.project_id, 'execute', {
        root_path: rootDir,
        ...(envOrigin ? { origin: envOrigin } : {}),
      });
      if (executeGrantCheck.allowed && executeGrantCheck.grant?.scope.origin) {
        const grantedAuth: TestNavigationAuthorization = {
          projectRoot: canonicalRoot,
          allowedOrigins: [executeGrantCheck.grant.scope.origin],
          allowRedirectsToAllowedOnly: true,
          ...(args.profile ? { authorizedProfiles: [args.profile] } : {}),
        };
        authorizations = [...authorizations, grantedAuth];
        matchingAuths = [...matchingAuths, grantedAuth];
      } else if (
        !this.options.testAuthorizer &&
        this.dependencies.silentBoundScope &&
        Boolean(canonicalEnvUrl) &&
        !hasDiscrepantYamlUrl &&
        environment === (appSnapshot?.environment?.name ?? 'local') &&
        envOrigin &&
        !isProductionEnv &&
        authorizations.length === 0
      ) {
        appService.authority.grant({
          project_id: appProject.project_id,
          capability: 'execute',
          scope: {
            root_path: canonicalRoot,
            origin: envOrigin,
            ...(appSnapshot?.environment?.env_id ? { env_id: appSnapshot.environment.env_id } : {}),
          },
          granted_by: 'host_bound_scope',
          policy_hash: createHash('sha256').update(envOrigin).digest('hex'),
        });
        const grantedAuth: TestNavigationAuthorization = {
          projectRoot: canonicalRoot,
          allowedOrigins: [envOrigin],
          allowRedirectsToAllowedOnly: true,
          ...(args.profile && args.profile !== 'admin-user' ? { authorizedProfiles: [args.profile] } : {}),
        };
        authorizations = [...authorizations, grantedAuth];
        matchingAuths = [...matchingAuths, grantedAuth];
      } else if (this.options.testAuthorizer) {
        const requestedOrigin = envOrigin ?? 'http://127.0.0.1';
        const authRes = await this.options.testAuthorizer.requestAuthorization(
          {
            projectRoot: canonicalRoot,
            projectName: appProject.name,
            origin: requestedOrigin,
            moduleName,
            caseCount: args.case_ids?.length ?? 1,
            profileLabel: args.profile,
          },
          context?.signal,
        );
        if (authRes.decision === 'rejected') {
          return result(
            {
              status: 'blocked',
              code: 'test_authorization_rejected',
              module: moduleName,
              environment,
              message: authRes.reason ?? 'Autorización de ejecución rechazada por el usuario.',
              desbloquear_con: 'qap_status',
            },
            true,
          );
        }
        if (authRes.decision === 'cancelled') {
          return result(
            {
              status: 'blocked',
              code: authRes.code ?? 'test_authorization_cancelled',
              module: moduleName,
              environment,
              message: authRes.reason ?? 'Autorización de ejecución cancelada o expirada.',
              desbloquear_con: 'qap_status',
            },
            true,
          );
        }
        if (authRes.decision === 'unavailable') {
          return result(
            {
              status: 'blocked',
              code: 'navigation_not_authorized',
              diagnostic_code: authRes.code,
              module: moduleName,
              environment,
              message: authRes.reason,
              desbloquear_con: 'qap_context_set',
            },
            true,
          );
        }

        const approvedOrigins = authRes.allowedOrigins.length > 0 ? authRes.allowedOrigins : [requestedOrigin];
        appService.authority.grant({
          project_id: appProject.project_id,
          capability: 'execute',
          scope: {
            root_path: canonicalRoot,
            origin: approvedOrigins[0],
            ...(appSnapshot?.environment?.env_id ? { env_id: appSnapshot.environment.env_id } : {}),
          },
          granted_by: 'interactive_test_authorizer',
          policy_hash: createHash('sha256').update(approvedOrigins.join('|')).digest('hex'),
        });

        const approvedAuth: TestNavigationAuthorization = {
          projectRoot: canonicalRoot,
          allowedOrigins: approvedOrigins,
          allowRedirectsToAllowedOnly: true,
          ...(authRes.authorizedProfiles ? { authorizedProfiles: authRes.authorizedProfiles } : {}),
        };
        if (this.options.hostTestRegistryPath) {
          atomicRecordTestAuthorization(this.options.hostTestRegistryPath, approvedAuth);
        }
        authorizations = [...authorizations, approvedAuth];
        matchingAuths = [...matchingAuths, approvedAuth];
      }
    }

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

    const lifecycle = await storage.getLifecycleState();
    const bound = binding(rootDir, this.dependencies);
    const activeEnvName = appProject && appService ? appService.resumeProject(appProject.project_id).environment?.name : undefined;
    const boundEnvMatches = bound ? (environment === bound.environmentId || activeEnvName === environment) : true;
    if (bound && (!boundEnvMatches || (lifecycle.session?.auth?.profile && lifecycle.session.auth.profile !== args.profile))) return result({ status: 'blocked', code: 'auth_context_mismatch' }, true);
    if (bound && lifecycle.session?.auth?.required && !args.profile) return result({ status: 'blocked', code: 'auth_profile_required' }, true);
    let runnerStorageState: PlaywrightRunnerOptions['storageState'];
    let runnerExtraHeaders: Record<string, string> | undefined;
    let resolvedProfileId: string | undefined = args.profile;

    if (args.profile && appProject && appService) {
      const svcSession = appService.readProfileSession<{
        cookies?: Array<Record<string, unknown>>;
        origins?: Array<Record<string, unknown>>;
      }>(appProject.project_id, args.profile);
      if (svcSession) {
        if (svcSession.revoked) {
          return result(
            {
              status: 'blocked',
              code: 'auth_session_revoked',
              module: moduleName,
              environment,
              profile: args.profile,
              message: `La sesión del perfil '${args.profile}' fue revocada. Nunca se degradará a anónimo; reautentica con 'qap_auth_add'.`,
              desbloquear_con: 'qap_auth_add',
            },
            true,
          );
        }
        if (svcSession.expired || !svcSession.session) {
          return result(
            {
              status: 'blocked',
              code: 'auth_session_expired',
              module: moduleName,
              environment,
              profile: args.profile,
              message: `La sesión del perfil '${args.profile}' expiró o no está vigente. Nunca se degradará a anónimo; revalida con 'qap_auth_add'.`,
              desbloquear_con: 'qap_auth_add',
            },
            true,
          );
        }
        const tenantCheck = appService.validateTenantScope(
          appProject.project_id,
          svcSession.profile.tenant_id,
          svcSession.profile.profile_id,
        );
        if (!tenantCheck.ok) {
          return result(
            {
              status: 'blocked',
              code: tenantCheck.code,
              module: moduleName,
              environment,
              profile: args.profile,
              message: tenantCheck.reason,
              desbloquear_con: 'qap_auth_add',
            },
            true,
          );
        }
        if (bound && matchingAuths.some(a => a.authorizedProfiles && a.authorizedProfiles.length > 0)) {
          if (!matchingAuths.some(a => a.authorizedProfiles?.includes(args.profile!))) {
            return result({ status: 'blocked', code: 'unauthorized_profile' }, true);
          }
        }
        resolvedProfileId = svcSession.profile.profile_id;
        runnerStorageState = svcSession.session as PlaywrightRunnerOptions['storageState'];
        if (tenantCheck.tenant_id) {
          runnerExtraHeaders = { 'X-Tenant-Id': tenantCheck.tenant_id };
        }
      } else if (bound) {
        if (!matchingAuths.some(a => a.authorizedProfiles?.includes(args.profile!))) return result({ status: 'blocked', code: 'unauthorized_profile' }, true);
        const profile = await readProfile(args.profile, rootDir);
        const session = new SessionStore(undefined, rootDir).getValidSession(args.profile);
        if (!profile?.verified || profile.application_id !== bound.applicationId || profile.env !== environment || !session) return result({ status: 'blocked', code: 'auth_session_expired' }, true);
      }
    } else if (args.profile && bound) {
      if (!matchingAuths.some(a => a.authorizedProfiles?.includes(args.profile!))) return result({ status: 'blocked', code: 'unauthorized_profile' }, true);
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

    let selectedPlanCaseIds = verifiedPlan.matrix.cases;
    if (args.case_ids && args.case_ids.length > 0) {
      const requestedSet = new Set(args.case_ids.map(id => id.trim()));
      const missingFromPlan = [...requestedSet].filter(id => !snapshotMap.has(id));
      if (missingFromPlan.length > 0) {
        return result(
          {
            status: 'blocked',
            code: 'unknown_case_in_batch',
            module: moduleName,
            environment,
            missing_case_ids: missingFromPlan,
            message: `Algunos casos del lote solicitado no forman parte del plan vigente para '${moduleName}'.`,
            desbloquear_con: 'qap_plan',
          },
          true,
        );
      }
      selectedPlanCaseIds = verifiedPlan.matrix.cases.filter(id => requestedSet.has(id));
      for (const id of [...snapshotMap.keys()]) {
        if (!requestedSet.has(id)) {
          snapshotMap.delete(id);
        }
      }
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

    // Pre-launch durable execution attempt persistence BEFORE invoking browser runner (Block 3)
    const serviceCasesById = new Map(
      appProject && appService
        ? appService.listServiceCases(appProject.project_id, moduleName).map(c => [c.case_id, c])
        : [],
    );
    const attemptRecord =
      appProject && appService
        ? appService.createExecutionAttempt({
            projectId: appProject.project_id,
            moduleKey: moduleName,
            envId: appSnapshot?.environment?.env_id ?? environment,
            profileId: resolvedProfileId ?? null,
            cases: [...snapshotMap.values()].map(c => {
              const svc = serviceCasesById.get(c.id);
              return {
                case_id: c.id,
                version: svc?.version ?? 1,
                requirement_id: svc?.requirement_id ?? c.source_rule_id ?? null,
                requirement_revision: svc?.requirement_revision ?? 1,
                title: c.name ?? svc?.title ?? c.id,
              };
            }),
          })
        : null;
    if (attemptRecord && appService) {
      appService.markAttemptRunning(attemptRecord.attempt_id);
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
      storageState: runnerStorageState,
      extraHTTPHeaders: runnerExtraHeaders,
      storageResolver,
      allowedOrigins,
    };

    let executionResult: ExecutionResult;
    try {
      executionResult = await runner.execute(
        {
          modules: [moduleName],
          cases: selectedPlanCaseIds,
          environment,
        },
        runnerOptions
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (attemptRecord && appService) {
        appService.finalizeExecutionAttempt({
          attemptId: attemptRecord.attempt_id,
          technicalError: { code: 'execution_failed', message: msg },
        });
      }
      return result(
        {
          status: 'error',
          code: 'execution_failed',
          module: moduleName,
          environment,
          ...(attemptRecord ? { attempt_id: attemptRecord.attempt_id } : {}),
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
      if (attemptRecord && appService) {
        appService.finalizeExecutionAttempt({
          attemptId: attemptRecord.attempt_id,
          executionResult,
          technicalError: {
            code: 'browser_not_available',
            message:
              executionResult.cases[0]?.not_run_reason ??
              'Error de infraestructura: el navegador Chromium no está disponible.',
          },
        });
      }
      return result(
        {
          status: 'blocked',
          code: 'browser_not_available',
          module: moduleName,
          environment,
          ...(attemptRecord ? { attempt_id: attemptRecord.attempt_id } : {}),
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
      if (attemptRecord && appService) {
        appService.finalizeExecutionAttempt({
          attemptId: attemptRecord.attempt_id,
          technicalError: {
            code: 'invalid_execution_result',
            message: 'El runner devolvió un resultado incompatible con el esquema canónico.',
          },
        });
      }
      return result(
        {
          status: 'error',
          code: 'invalid_execution_result',
          module: moduleName,
          environment,
          ...(attemptRecord ? { attempt_id: attemptRecord.attempt_id } : {}),
          message: 'El runner devolvió un resultado incompatible con el esquema canónico. No se guardó ninguna ejecución.',
          desbloquear_con: 'qap_status',
        },
        true
      );
    }

    if (!isInternallyConsistentExecution(executionResult, { module: moduleName, environment })) {
      if (attemptRecord && appService) {
        appService.finalizeExecutionAttempt({
          attemptId: attemptRecord.attempt_id,
          technicalError: {
            code: 'inconsistent_execution_result',
            message: 'El resultado devuelto por el runner es internamente inconsistente.',
          },
        });
      }
      return result(
        {
          status: 'error',
          code: 'inconsistent_execution_result',
          module: moduleName,
          environment,
          ...(attemptRecord ? { attempt_id: attemptRecord.attempt_id } : {}),
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
      if (attemptRecord && appService) {
        appService.finalizeExecutionAttempt({
          attemptId: attemptRecord.attempt_id,
          technicalError: {
            code: 'invalid_execution_id',
            message: 'El identificador de ejecución no es seguro para persistencia.',
          },
        });
      }
      return result(
        {
          status: 'error',
          code: 'invalid_execution_id',
          module: moduleName,
          environment,
          ...(attemptRecord ? { attempt_id: attemptRecord.attempt_id } : {}),
          message: 'El identificador de ejecución no es seguro para persistencia. No se guardó ninguna ejecución.',
        },
        true
      );
    }

    try {
      await storage.saveExecutionResult(executionId, executionResult);

    } catch {
      if (attemptRecord && appService) {
        appService.finalizeExecutionAttempt({
          attemptId: attemptRecord.attempt_id,
          technicalError: {
            code: 'execution_not_persisted',
            message: 'Fallo al guardar el resultado de ejecución en disco.',
          },
        });
      }
      return result(
        {
          status: 'error',
          code: 'execution_not_persisted',
          module: moduleName,
          environment,
          ...(attemptRecord ? { attempt_id: attemptRecord.attempt_id } : {}),
          message: 'La ejecución terminó, pero no se pudo guardar su resultado. No se acreditó como ejecución persistida.',
          desbloquear_con: 'qap_status',
        },
        true
      );
    }

    let traceRelPath: string | null = null;
    if (approval.request_digest) {
      traceRelPath = '.qa/executions/' + executionId + '.trace.json';
      try {
        await storage.writeJson(traceRelPath, {
          execution_id: executionId,
          case_approval_digest: approval.request_digest,
          requirements: approval.requirements,
          cases: [...snapshotMap.values()].map(c => ({ id: c.id, source_rule_id: c.source_rule_id })),
        });
      } catch {
        if (attemptRecord && appService) {
          appService.finalizeExecutionAttempt({
            attemptId: attemptRecord.attempt_id,
            executionResult,
            rawExecutionPath: `.qa/executions/${executionId}.json`,
            tracePath: null,
          });
        }
        return result(
          {
            status: 'partial',
            code: 'execution_trace_not_persisted',
            execution_id: executionId,
            ...(attemptRecord ? { attempt_id: attemptRecord.attempt_id } : {}),
            execution_saved: true,
            trace_saved: false,
            summary: executionResult.summary,
            message:
              'La ejecución está guardada; falta persistir su trazabilidad. No reejecutar el navegador implícitamente.',
            desbloquear_con: 'qap_report',
          },
          true,
        );
      }
    }

    if (attemptRecord && appService) {
      appService.finalizeExecutionAttempt({
        attemptId: attemptRecord.attempt_id,
        executionResult,
        rawExecutionPath: `.qa/executions/${executionId}.json`,
        tracePath: traceRelPath,
      });
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
          ...(attemptRecord ? { attempt_id: attemptRecord.attempt_id } : {}),
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

    const canonicalExecutionSummary =
      appProject && appService ? appService.getExecutionSummary(appProject.project_id, moduleName) : undefined;

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
          ...(attemptRecord ? { attempt_id: attemptRecord.attempt_id } : {}),
          ...(canonicalExecutionSummary ? { canonical_execution_summary: canonicalExecutionSummary } : {}),
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
      ...(attemptRecord ? { attempt_id: attemptRecord.attempt_id } : {}),
      ...(canonicalExecutionSummary ? { canonical_execution_summary: canonicalExecutionSummary } : {}),
      summary: executionResult.summary,
      cases: executionResult.cases,
      started_at: executionResult.started_at,
      finished_at: executionResult.finished_at,
    });
  }
}
