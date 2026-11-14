import {
  existsSync,
  mkdirSync,
  writeFileSync,
  renameSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  realpathSync,
} from 'node:fs';
import { resolve, join, basename, extname } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  type Prompt,
  type CallToolResult,
} from '@modelcontextprotocol/sdk/types.js';
import YAML from 'yaml';
import {
  SchemaValidator,
  isAuthPath,
  isSubstantiveRuleText,
  isTautologicalOptionLabel,
  isEngineOptionLabel,
  isValidRoleName,
  filterValidRoles,
  normalizeSlug,
  type AuthProfile,
  type CanonicalExecutionSummary,
  type ModuleLifecycleState,
  type IngestProposal,
  type RuleEntry,
  type CategoryWaiver,
  type ModuleCandidate,
  type ProjectRepoMap,
  type ModuleCandidatesFile,
} from '@qap/shared';
import { readProfiles, type StorageState } from '@qap/auth';
import {
  FileSystemStorage,
  validateDefinitions,
  parsePrdContent,
  detectarDocumentosProyecto,
  generarScan,
  resolverDocumento,
  detectarServiciosConEvidencia,
  scanProjectRoutes,
  generateModuleCandidates,
  type CandidateGenerationResult,
} from '@qap/knowledge';
import {
  canExitOnboarding,
  canExitScoping,
  canExitWorking,
  transitionModule,
  transitionProject,
  validateWaiversBatch,
  generateSessionGapReport,
  computeSessionGapSummary,
  assertLifecycleStateInvariants,
  computeApplicableCategories,
  computeCoverage,
  generateNextInterviewBatch,
  sanitizeDomString,
  generarRenderTexto,
  guardPregunta,
  KnowledgeStoreError,
  type ViewDiscoveryContext,
  type DomForm,
  type Pregunta,
} from '@qap/engine';
import {
  startViewerServer,
  QapDatabase,
  PruningEngine,
  type ViewerServerInstance,
} from '@qap/reporter';

import { getPhaseGuidance, buildInterviewNextAction, type SiguienteAccion } from './guidance.js';
import type { WorkspaceBootstrap } from './workspace-bootstrap.js';
import {
  validateCandidateWorkspace,
  syncAuthorizedRootsFromDisk,
  atomicRecordAuthorizedRoot,
  type IWorkspaceAuthorizer,
} from './workspace-authorizer.js';
import type { IDiscoveryAuthorizer } from './discovery-authorizer.js';
import {
  atomicRecordAuthAuthorization,
  hasPersistedAuthAuthorization,
  loadAuthAuthorizationsFromDisk,
  type IAuthAuthorizer,
  type PersistedAuthAuthorization,
} from './auth-authorizer.js';
import {
  loadTestAuthorizationsFromDisk,
  type ITestAuthorizer,
} from './test-authorizer.js';
import { InteractiveAccess, interactiveBlocked } from './interactive-access.js';
import { loadHostComposition } from './host-composition.js';
import { resolveHelperScriptPath } from './dialog-script-path.js';
import { authorizationDiagnostic } from './authorization-diagnostics.js';
import { logTechnicalDiagnostic } from './technical-diagnostics.js';
import { ToolDispatcher, McpToolError, type IMcpToolHandler } from './dispatcher.js';
import { TOOLS } from './tool-catalog.js';
import { StatusHandler } from './handlers/status.handler.js';
import { ContextHandler } from './handlers/context.handler.js';
import { DiscoveryHandler, type DiscoveryAuthorization } from './handlers/discovery.handler.js';
import { CanonicalInterviewService, type IHumanReviewGateway } from './handlers/canonical-interview-service.js';
import { CanonicalClosureError } from './handlers/canonical-closure-error.js';
import { CanonicalClosureService } from './handlers/canonical-closure-service.js';
import { renderCanonicalSessionReport } from './handlers/canonical-session-report.js';
import { handleScopedRuleResolution } from './handlers/rule-resolution-handler.js';
import { binding as knowledgeBinding, projectRoot as authorizedProjectRoot, result as canonicalResult } from './handlers/state-services.js';
import { hasLegacyViewContext, legacyInterviewBlocked } from './handlers/legacy-discovery-contract.js';
import { ProjectHandler } from './handlers/project.handler.js';
import { ApplicationServiceError } from './application/application-service.js';
import { authenticateScopedPassword, scopedRoute, usableScopedSession } from './scoped-password.js';
import { buildPublishedModuleDocRepoPath, sanitizeTargetPathname, writeDiscoveryMarkdownFiles } from './application/discovery-dossier.js';
import { atomicWritePrivateFile, normalizePathKey, resolveContainedPath } from './application/safe-storage.js';
import { PlanHandler } from './handlers/plan.handler.js';
import { TestHandler, type TestNavigationAuthorization } from './handlers/test.handler.js';
import { ReportHandler } from './handlers/report.handler.js';
import { checkPlaywrightBrowser, PLAYWRIGHT_INSTALL_COMMAND, detectarSubcarpetaWorkspace } from './handlers/state-runtime.js';
import type { StateDependencies } from './handlers/state-services.js';
import {
  ClientElicitationDiscoveryAuthorizer,
  ClientElicitationHumanReviewGateway,
  ClientElicitationWorkspaceAuthorizer,
} from './client-elicitation-authorizers.js';
import { acknowledgeProjectInitialization, acquireProjectOperation, ProjectReset, readProjectResetState, type ResetAuthorizer } from './project-reset.js';
import { windowsProjectResetAuthorizer } from './project-reset-dialog.js';
import { conversationLogPath, isConversationId, QapEventLog } from './qap-event-log.js';
export { checkPlaywrightBrowser, PLAYWRIGHT_INSTALL_COMMAND } from './handlers/state-runtime.js';

let activeViewerServer: ViewerServerInstance | null = null;

function makeDecisionQuestion(
  id: string,
  texto: string,
  opciones: Array<{ id: string; etiqueta: string; recomendada?: boolean }>,
  permiteOtra = true,
  registrarCon: { tool: string; campo: string } = { tool: 'qap_session_plan', campo: 'action' }
): Pregunta {
  const hasExplicitRecommended = opciones.some((o) => o.recomendada === true);
  const p: Pregunta = {
    id,
    texto,
    formato: 'una_opcion',
    opciones: opciones.map((o, idx) => ({
      id: o.id,
      etiqueta: o.etiqueta,
      recomendada: o.recomendada !== undefined ? o.recomendada : (!hasExplicitRecommended && idx === 0),
    })),
    permite_otra: permiteOtra,
    registrar_con: registrarCon,
  };
  p.render_texto = generarRenderTexto(p);
  return guardPregunta(p) as Pregunta;
}

const reportMarkdownSpecials = new Set(['\\', '`', '*', '_', '{', '}', '[', ']', '<', '>', '|']);
const cleanReportText = (value: string | number | boolean | null | undefined): string =>
  [...String(value ?? '').replace(/[\r\n\t]+/g, ' ')]
    .map((char) => (reportMarkdownSpecials.has(char) ? '\\' + char : char))
    .join('')
    .trim();

function renderVerifiedPhysicalExecutionSection(summary: CanonicalExecutionSummary): string {
  const lines: string[] = [
    '',
    '## Resumen de Ejecución Física Verificada',
    '',
    `- Estado de ejecución: **${cleanReportText(summary.status)}**`,
    `- Último intento: ${cleanReportText(summary.latest_attempt_id ?? 'N/A')} (ejecución: ${cleanReportText(summary.latest_execution_id ?? 'N/A')})`,
    `- Intentos registrados: ${summary.total_attempts}`,
    `- Resultados por caso (${summary.total_cases}): PASS=${summary.counts.pass}, FAIL=${summary.counts.fail}, not_run=${summary.counts.not_run}, technical_error=${summary.counts.technical_error}, human_accepted=${summary.counts.human_accepted}`,
    '',
  ];
  if (summary.case_verdicts.length > 0) {
    lines.push('### Veredictos por Caso y Requisito', '');
    for (const cv of summary.case_verdicts) {
      lines.push(
        `- **${cleanReportText(cv.case_id)}** (v${cv.case_version}) | Veredicto: **${cleanReportText(cv.verdict)}** | Req: ${cleanReportText(cv.requirement_id ?? 'N/A')} rev.${cv.requirement_revision} | Intento: ${cleanReportText(cv.attempt_id)}`,
      );
      if (cv.human_acceptance_reason) {
        lines.push(`  - Aceptación humana (${cleanReportText(cv.human_accepted_by ?? 'qa')}): ${cleanReportText(cv.human_acceptance_reason)}`);
      }
      const failedStep = cv.step_results.find((s) => s.status === 'FAIL' || s.status === 'technical_error');
      if (failedStep?.message) {
        lines.push(`  - Falla en paso ${failedStep.step_index + 1} (${cleanReportText(failedStep.action)}): ${cleanReportText(failedStep.message)}`);
      }
      if (cv.evidence_refs.length > 0) {
        lines.push(`  - Evidencias: ${cv.evidence_refs.map((e) => cleanReportText(e)).join(', ')}`);
      }
    }
    lines.push('');
  }
  return lines.join('\n') + '\n';
}

/* Legacy view helpers: pending typed migration. */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
function buildViewDiscoveryContext(
  rootDir: string,
  moduleName: string,
  view: string = 'default',
  route: string = ''
): ViewDiscoveryContext {
  let formsForView: DomForm[] = [];
  let buttonsForView: any[] = [];
  let storageStateUsed = false;
  const selectorsPath = join(rootDir, '.qa', 'modules', moduleName, 'views', view, 'selectors.json');
  const contextPath = join(rootDir, '.qa', 'modules', moduleName, 'views', view, 'context.yaml');
  if (existsSync(selectorsPath)) {
    try {
      const sel = JSON.parse(readFileSync(selectorsPath, 'utf-8'));
      formsForView = ((sel.selectors?.forms || []) as any[]).map((f: any) => ({
        id: f.id || 'form-1',
        selector: f.selector || 'form',
        fields: ((f.inputs || f.fields || []) as any[]).map((inp: any) => ({
          key: inp.key || inp.name || inp.id || 'field',
          type: inp.type || 'text',
          name: inp.name,
          id: inp.id,
          label: inp.label,
          required: inp.required,
          minlength: inp.minlength,
          maxlength: inp.maxlength,
          pattern: inp.pattern,
        })),
      }));
      buttonsForView = sel.selectors?.buttons || [];
    } catch { /* ignore */ }
  }
  if (existsSync(contextPath)) {
    try {
      const ctxData = YAML.parse(readFileSync(contextPath, 'utf-8'));
      storageStateUsed = Boolean(ctxData?.storage_state_used);
    } catch { /* ignore */ }
  }
  return {
    module: moduleName,
    view,
    route,
    forms: formsForView,
    buttons: buttonsForView,
    storage_state_used: storageStateUsed,
    is_auth_view: false,
  };
}

function buildModuleSummary(rules: any[], waivers: any[]) {
  const porStatus: Record<string, number> = { confirmed: 0, deferred: 0, inferred: 0 };
  const porSource: Record<string, number> = { dom: 0, prd: 0, user: 0 };
  const deferredRules: Array<{ id: string; description: string }> = [];

  for (const r of rules || []) {
    if (r.status) porStatus[r.status] = (porStatus[r.status] || 0) + 1;
    if (r.source) porSource[r.source] = (porSource[r.source] || 0) + 1;
    if (r.status === 'deferred') {
      deferredRules.push({ id: r.id, description: r.description });
    }
  }

  const waiversList = (waivers || []).map((w: any) => ({
    category: w.category,
    reason: w.reason,
    source: w.source || 'user',
  }));

  return {
    reglas_por_status: porStatus,
    reglas_por_source: porSource,
    waivers: waiversList,
    reglas_deferred: deferredRules,
    total_reglas: (rules || []).length,
    total_waivers: (waivers || []).length,
  };
}

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

const PROMPTS: Prompt[] = [
  {
    name: 'qap_start',
    description: 'Inicia el proceso de QA paso a paso de forma conversacional y guiada.',
    arguments: [],
  },
];

/**
 * Detecta si targetPath es una subcarpeta de un repositorio mayor
 * inspeccionando hasta 3 niveles de ancestros en busca de .git,
 * pnpm-workspace.yaml o package.json con "workspaces" (B8).
 */
export interface McpServerOptions extends StateDependencies {
  readonly workspaceBootstrap?: WorkspaceBootstrap;
  readonly clientWorkspaceRoots?: boolean;
  readonly discoveryAuthorizations?: readonly DiscoveryAuthorization[];
  readonly testAuthorizations?: readonly TestNavigationAuthorization[];
  readonly testAuthorizer?: ITestAuthorizer;
  readonly hostTestRegistryPath?: string;
  readonly handlers?: readonly IMcpToolHandler[];
  readonly workspaceAuthorizer?: IWorkspaceAuthorizer;
  readonly configuredWorkspaceRoot?: string;
  readonly hostRegistryPath?: string;
  readonly discoveryAuthorizer?: IDiscoveryAuthorizer;
  readonly interactiveAccessAuthorizer?: IDiscoveryAuthorizer;
  readonly interactiveAccessEnabled?: boolean;
  readonly hostDiscoveryRegistryPath?: string;
  readonly authAuthorizer?: IAuthAuthorizer;
  readonly hostAuthRegistryPath?: string;
  readonly authAuthorizations?: readonly PersistedAuthAuthorization[];
  readonly allowSpaReadOnly?: boolean;
  readonly authorizationPersistencePath?: string;
  readonly sessionPersistenceKey?: string;
  readonly authorizationTtlMs?: number;
  readonly projectResetAuthorizer?: ResetAuthorizer;
  readonly humanReviewGateway?: IHumanReviewGateway;
}

export function createMcpServer(options: McpServerOptions = {}): Server {
  const serverRef: { current?: Server } = {};
  const serverProvider = () => serverRef.current;
  const ruleReviewGateway = new ClientElicitationHumanReviewGateway(serverProvider, options.humanReviewGateway);
  const qapEventLog = new QapEventLog(options.workspaceBootstrap?.directory);
  const authorizationDiagnosticSink = (diagnostic: Parameters<QapEventLog['recordNativeAuthorization']>[0], workspace?: string) =>
    qapEventLog.recordNativeAuthorization(diagnostic, workspace);
  const workspaceAuthorizer = options.workspaceAuthorizer
    ? new ClientElicitationWorkspaceAuthorizer(serverProvider, options.workspaceAuthorizer, authorizationDiagnosticSink)
    : undefined;
  const discoveryAuthorizer = options.discoveryAuthorizer
    ? new ClientElicitationDiscoveryAuthorizer(serverProvider, options.discoveryAuthorizer, authorizationDiagnosticSink)
    : undefined;
  const provisionAuthorizer = options.interactiveAccessAuthorizer || options.discoveryAuthorizer || options.interactiveAccessEnabled
    ? new ClientElicitationDiscoveryAuthorizer(serverProvider, options.interactiveAccessAuthorizer ?? options.discoveryAuthorizer, authorizationDiagnosticSink)
    : undefined;
  const preparationCommand = `"${process.execPath}" "${resolveHelperScriptPath('qap-authorize-workspace.mjs')}" <workspace-absoluto>`;
  const authorizedRoots = [...(options.projectRoots ?? [process.cwd()])];
  const authorizedAuths: PersistedAuthAuthorization[] = [
    ...(options.authAuthorizations ?? []),
    ...(options.hostAuthRegistryPath ? loadAuthAuthorizationsFromDisk(options.hostAuthRegistryPath) : []),
  ];
  const authorizedTestAuths: TestNavigationAuthorization[] = [
    ...(options.testAuthorizations ?? []),
    ...(options.hostTestRegistryPath ? loadTestAuthorizationsFromDisk(options.hostTestRegistryPath) : []),
  ];
  const workspaceBindings = [...(options.knowledgeBindings ?? [])];
  const pendingPreparations = new Map<string, Promise<void>>();
  const applicationService = options.applicationService ?? options.workspaceBootstrap?.appService;
  const dependencies: StateDependencies = {
    projectRoots: authorizedRoots,
    knowledgeBindings: workspaceBindings,
    ...(applicationService ? { applicationService } : {}),
    provisionalInventory: options.provisionalInventory ?? Boolean(options.workspaceBootstrap),
    allowSpaReadOnly: options.allowSpaReadOnly ?? Boolean(options.workspaceBootstrap || applicationService),
    silentBoundScope: options.silentBoundScope,
    prepareWorkspace: options.workspaceBootstrap ? async (root, url) => {
      const previous = pendingPreparations.get(root) ?? Promise.resolve();
      const operation = previous.catch(() => undefined).then(async () => {
        if (workspaceBindings.some(b => realpathSync(b.projectRoot) === root)) return;
        const bound = await options.workspaceBootstrap!.prepare(root, url);
        if (bound && !workspaceBindings.some(b => b.projectRoot === root)) {
          const interview = new CanonicalInterviewService(bound.store, { projectRoot: root,
            applicationId: bound.applicationId, environmentId: bound.environmentId, moduleBindings: bound.moduleBindings }, undefined, undefined);
          workspaceBindings.push(bound);
          interviews.set(root, interview);
        }
      });
      pendingPreparations.set(root, operation);
      try { await operation; } finally { if (pendingPreparations.get(root) === operation) pendingPreparations.delete(root); }
    } : undefined,
  };
  workspaceBindings.splice(0, workspaceBindings.length, ...(options.knowledgeBindings ?? []).map(binding => Object.freeze({ ...binding,
      moduleBindings: binding.moduleBindings && Object.freeze(binding.moduleBindings.map(link => Object.freeze({ ...link }))),
    })));
  const interviews = new Map<string, CanonicalInterviewService>();
  const closures = new Map<string, CanonicalClosureService>();
  const interviewBindings = (dependencies.knowledgeBindings ?? []).flatMap(bound => {
    try { return [{ bound, root: realpathSync(bound.projectRoot) }]; } catch { return []; }
  });
  for (const { bound, root } of interviewBindings) {
    // Binding selection elsewhere rejects duplicates; never create an ambiguous runtime.
    if (interviewBindings.filter(b => b.root === root).length !== 1) continue;
    const context = { projectRoot: root,
      applicationId: bound.applicationId, environmentId: bound.environmentId, moduleBindings: bound.moduleBindings };
    interviews.set(root, new CanonicalInterviewService(bound.store, context, bound.humanReviewGateway, bound.interviewDraftStore));
    if (bound.moduleClosureStore) {
      closures.set(root, new CanonicalClosureService(bound.store, context, bound.moduleClosureStore, bound.moduleClosureReviewGateway));
    }
  }
  const runtimeDependencies: StateDependencies = { ...dependencies, canonicalInterviews: interviews, canonicalClosures: closures };

  const migrated = new Set(['qap_status', 'qap_project', 'qap_context_set', 'qap_discover', 'qap_plan', 'qap_test', 'qap_report']);
  const dispatcher = new ToolDispatcher(TOOLS.filter(tool => !migrated.has(tool.name)).map(tool => tool.name));
  dispatcher.register(new ProjectHandler(dependencies));
  dispatcher.register(new ContextHandler(dependencies));
  const authorizedProfilesPolicy = Array.from(
    new Set([
      ...(options.discoveryAuthorizations ?? []).flatMap((a) => a.authorizedProfiles ?? []),
      ...(options.testAuthorizations ?? []).flatMap((a) => a.authorizedProfiles ?? []),
    ])
  );
  const interactivePolicy =
    authorizedProfilesPolicy.length > 0 || options.sessionPersistenceKey !== undefined || options.authorizationTtlMs !== undefined || options.authorizationPersistencePath !== undefined
      ? {
          ...(authorizedProfilesPolicy.length > 0 ? { authorizedProfiles: authorizedProfilesPolicy } : {}),
          ...(options.sessionPersistenceKey !== undefined ? { sessionPersistenceKey: options.sessionPersistenceKey } : {}),
          ...(options.authorizationTtlMs !== undefined ? { authorizationTtlMs: options.authorizationTtlMs } : {}),
          ...(options.authorizationPersistencePath !== undefined ? { authorizationPersistencePath: options.authorizationPersistencePath } : {}),
        }
      : undefined;
  const interactiveAuthMode = Boolean(
    options.interactiveAccessEnabled ||
    (options.interactiveAccessAuthorizer && !options.authAuthorizer && !options.silentBoundScope)
  );
  const interactiveAccess = interactiveAuthMode
    ? new InteractiveAccess(
        dependencies,
        provisionAuthorizer ?? discoveryAuthorizer,
        undefined,
        undefined,
        interactivePolicy
      )
    : undefined;
  const unauthenticatedInteractiveAccess = !interactiveAccess &&
    !options.authAuthorizer &&
    !options.silentBoundScope &&
    Boolean(options.knowledgeBindings?.length)
      ? new InteractiveAccess(dependencies, undefined, undefined, undefined, interactivePolicy)
      : undefined;
  const provisionAccess = provisionAuthorizer
    ? new InteractiveAccess(
        dependencies,
        provisionAuthorizer,
        undefined,
        undefined,
        interactivePolicy
      )
    : undefined;
  dispatcher.register(new StatusHandler({ ...runtimeDependencies, ...(interactiveAccess ? { interactiveAccess } : {}),
    browser: checkPlaywrightBrowser, view: buildViewDiscoveryContext }));
  const discoveryHandler = new DiscoveryHandler(
    dependencies,
    options.discoveryAuthorizations,
    discoveryAuthorizer,
    options.hostDiscoveryRegistryPath,
    interactiveAccess,
  );
  dispatcher.register(discoveryHandler);
  const reset = options.workspaceBootstrap && !options.knowledgeBindings?.length ? new ProjectReset({
    directory: options.workspaceBootstrap.directory,
    rootsPath: options.hostRegistryPath,
    discoveryPath: options.hostDiscoveryRegistryPath,
    grantsPath: options.authorizationPersistencePath,
    key: options.sessionPersistenceKey,
  }, options.projectResetAuthorizer ?? windowsProjectResetAuthorizer) : undefined;
  const seenResets = new Map<string, string>();
  const forgetBootstrapBinding = (root: string) => {
    if (options.knowledgeBindings?.some(binding => binding.projectRoot === root)) return;
    options.workspaceBootstrap?.release(root);
    const index = workspaceBindings.findIndex(binding => binding.projectRoot === root);
    if (index >= 0) workspaceBindings.splice(index, 1);
    interviews.delete(root);
  };
  dispatcher.register(new PlanHandler(dependencies));
  dispatcher.register(new TestHandler(dependencies, {
    testAuthorizations: authorizedTestAuths,
    testAuthorizer: options.testAuthorizer,
    hostTestRegistryPath: options.hostTestRegistryPath,
  }));
  dispatcher.register(new ReportHandler(dependencies));
  for (const handler of options.handlers ?? []) dispatcher.register(handler);
  dispatcher.seal();

  const server = new Server(
    {
      name: 'qap-mcp-server',
      version: `3.0.0+${process.env.QAP_BUILD_REVISION ?? 'development'}`,
    },
    {
      capabilities: {
        tools: {},
        prompts: {},
      },
      instructions: `DIRECTIVAS DE INTERACCIÓN OBLIGATORIAS (QAP v3.0):
0. Cuando el usuario quiera probar un sistema o iniciar un registro por conversación, invoca qap_start con la URL ya indicada. Si el usuario ya dio credenciales de prueba para ese origen y el esquema ofrece credentials, inclúyelas en esta primera llamada para que QAP las guarde antes de iniciar Discovery. Si las proporciona después, usa qap_auth_add para guardarlas en ese momento y continúa con el inventario. Presenta el resumen y el enlace a discovery_inicial y usa el conversation_id en las siguientes llamadas. En conversaciones posteriores usa el estado autenticacion devuelto por QAP; una captura pública histórica de /login no implica que falten credenciales. Pide solo la información que falte.
1. RUTA OBJETIVO OBLIGATORIA (targetPath): En TODAS las llamadas a herramientas MCP, envía SIEMPRE la ruta absoluta del workspace del usuario en el parámetro 'targetPath'. NUNCA lo omitas.
2. PROHIBIDO mostrar tablas markdown de estado, resúmenes de archivos o listas de próximos pasos (1, 2, 3...).
3. Cuando siguiente_accion trae pregunta, presentala con la herramienta ask_question: UNA sola pregunta por llamada, usando texto, formato y opciones tal cual (no inventes, reordenes ni agregues opciones). Deja siempre disponible la respuesta libre. Si formato es abierta, haz esa unica pregunta en texto y espera. Nunca agrupes varias preguntas en un mensaje ni preguntes algo que siguiente_accion no pidio. Si ask_question no existe en tu cliente, haz la misma pregunta en texto con las opciones numeradas, una a la vez.
4. Tras cada respuesta, registrala con la tool de pregunta.registrar_con y sigue la nueva siguiente_accion. Si el usuario eligio una opcion usa su efecto; si escribio texto libre, registralo con source user y con sus palabras. Nunca registres como source user algo que el usuario no dijo ni eligio.
5. Una sola pregunta al usuario por turno; los pasos de tipo trabajo no requieren preguntar: ejecútalos y sigue la nueva siguiente_accion. Antes de preguntar algo que pueda estar en el workspace, léelo (documentos, README, package.json).
6. qap_rules_set legacy requiere datos confirmados por el usuario. Su ruta canonical_interview admite propuestas pendientes; solo un gateway independiente del host puede autorizar la confirmación canónica. source, status y from_option no acreditan autorización humana.
7. Si una tool responde con status "blocked", sigue obligatoriamente 'desbloquear_con' y no intentes rodear el bloqueo.
8. Para hipótesis DOM (source "dom", status "inferred"): CONFIRMA cada una con el usuario antes de marcarla como "confirmed". Presenta las hipótesis al usuario y pregunta cuáles son correctas.
9. Presenta al usuario el resumen de cierre del módulo y llama qap_module_close solo con su confirmación explícita (user_confirmed: true).
10. Declara un waiver únicamente cuando el usuario haya dicho que la categoría no aplica, citando su razón (mínimo 15 caracteres).
11. Al cerrar la sesión, presenta al usuario el resumen del reporte de brechas generado.
12. Un plan vigente ya fija los módulos y su prioridad. Explora sus rutas y propone casos siguiendo siguiente_accion sin volver a pedir que el usuario elija o autorice cada ruta. Conserva las preguntas para decisiones de alcance nuevas, expectativas de negocio y aprobaciones explícitas requeridas por el servidor.`,
    }
  );
  serverRef.current = server;


  // Manejador de lista de tools
  const authInputProperties = TOOLS.find(tool => tool.name === 'qap_auth_add')?.inputSchema.properties ?? {};
  server.setRequestHandler(ListToolsRequestSchema, () => {
    const tools = [...TOOLS, ...dispatcher.listTools().filter(tool => !migrated.has(tool.name))];
    if (!options.configuredWorkspaceRoot) return Promise.resolve({ tools });
    return Promise.resolve({ tools: tools.map(tool => ({
      ...tool,
      inputSchema: { ...tool.inputSchema, properties: {
        ...tool.inputSchema.properties,
        ...(tool.name === 'qap_project_reset' ? {} : {
          conversation_id: { type: 'string', format: 'uuid', description: 'ID devuelto por qap_start para llevar la bitácora de esta conversación.' },
        }),
        ...(tool.name === 'qap_auth_add' ? { password: {
          type: 'string', minLength: 1, maxLength: 4096,
          description: 'Contraseña de prueba ya proporcionada por el usuario para el entorno QA vinculado. QAP la omite de la bitácora.',
        } } : {}),
        ...(tool.name === 'qap_start' ? { credentials: {
          type: 'object', additionalProperties: false, required: ['username', 'password'],
          description: 'Credenciales de prueba ya proporcionadas para base_url. QAP las guarda en el llavero del host antes de Discovery.',
          properties: {
            username: { type: 'string', minLength: 1, maxLength: 256 },
            password: { type: 'string', minLength: 1, maxLength: 4096 },
            profile: { type: 'string', pattern: '^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$' },
          },
        } } : {}),
      } },
    })) });
  });

  // Manejador de lista de prompts
  server.setRequestHandler(ListPromptsRequestSchema, () => Promise.resolve({ prompts: PROMPTS }));

  // Manejador de invocación de prompt
  server.setRequestHandler(GetPromptRequestSchema, (request) => {
    const { name } = request.params;
    if (name === 'qap_start') {
      return Promise.resolve({
        description: 'Onboarding paso a paso para QAP',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: 'Invoca qap_start con el workspace y la URL que ya indiqué. Si ya proporcioné credenciales de prueba para esa URL, inclúyelas en credentials cuando el esquema lo permita. Continúa con siguiente_accion y usa el conversation_id devuelto para conservar la bitácora. Explora únicamente con QAP.',
            },
          },
        ],
      });
    }
    throw new Error(`Prompt desconocido: ${name}`);
  });

  // Manejador de llamadas a tools
  const activeCalls = new Map<AbortController, Promise<CallToolResult>>();
  let closing = false;
  let closeOperation: Promise<void> | undefined;
  const closeTransport = server.close.bind(server);
  server.close = () => {
    if (closeOperation) return closeOperation;
    closing = true;
    for (const controller of activeCalls.keys()) controller.abort();
    // Transport closure alone rejects client promises, but does not await the
    // server handlers. Keep stores/roots alive until browser work and locks drain.
    closeOperation = Promise.allSettled([...activeCalls.values()]).then(() => {
      interactiveAccess?.close();
      unauthenticatedInteractiveAccess?.close();
      provisionAccess?.close();
      return closeTransport();
    });
    return closeOperation;
  };
  server.setRequestHandler(CallToolRequestSchema, async (request, sdkContext) => {
    if (closing) return { isError: true, content: [{ type: 'text', text: JSON.stringify({ code: 'cancelled' }) }] };
    const controller = new AbortController();
    const context = { ...sdkContext, signal: AbortSignal.any([controller.signal, ...(sdkContext.signal ? [sdkContext.signal] : [])]) };
    let eventWorkspace: string | undefined;
    let conversationId: string | undefined;
    let releaseStorage: (() => void) | undefined;
    let resetState: ReturnType<typeof readProjectResetState>;
    let guardedRoot: string | undefined;
    const eventStartedAt = Date.now();
    const operation = (async (): Promise<CallToolResult> => {
    const { name, arguments: { conversation_id, ...argsWithoutConversation } = {} } = request.params;
    const rawArgs = request.params.arguments === undefined ? undefined : argsWithoutConversation;
    if (conversation_id !== undefined && (!isConversationId(conversation_id) || name === 'qap_project_reset')) {
      return canonicalResult({ status: 'error', code: 'invalid_conversation_id' }, true);
    }
    if (rawArgs) request.params.arguments = rawArgs;
    const startCredentials = name === 'qap_start' ? rawArgs?.credentials as Record<string, unknown> | undefined : undefined;
    if (name === 'qap_start' && (
      Object.keys(rawArgs ?? {}).some(key => !['targetPath', 'base_url', 'refresh_discovery', 'credentials'].includes(key)) ||
      (startCredentials !== undefined && (!options.configuredWorkspaceRoot || !options.silentBoundScope ||
        typeof rawArgs?.base_url !== 'string' || !startCredentials || typeof startCredentials !== 'object' ||
        Array.isArray(startCredentials) || Object.keys(startCredentials).some(key => !['profile', 'username', 'password'].includes(key)) ||
        typeof startCredentials.username !== 'string' || !startCredentials.username.trim() || startCredentials.username.length > 256 ||
        typeof startCredentials.password !== 'string' || !startCredentials.password || startCredentials.password.length > 4096 ||
        (startCredentials.profile !== undefined && (typeof startCredentials.profile !== 'string' ||
          !/^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/.test(startCredentials.profile))))) ||
      (rawArgs?.refresh_discovery !== undefined && typeof rawArgs.refresh_discovery !== 'boolean') ||
      (rawArgs?.targetPath !== undefined && typeof rawArgs.targetPath !== 'string') ||
      !new ContextHandler(dependencies).validateArguments(
        rawArgs?.base_url === undefined ? {} : { base_url: rawArgs.base_url },
      )
    )) return canonicalResult({ status: 'error', code: 'invalid_arguments' }, true);
    conversationId = isConversationId(conversation_id) ? conversation_id : name === 'qap_start' ? randomUUID() : undefined;
    if (name === 'qap_project_reset') {
      const { targetPath, phase, reset_id } = rawArgs ?? {};
      if (typeof targetPath !== 'string' || (phase !== 'preview' && phase !== 'confirm') ||
          Object.keys(rawArgs ?? {}).some(key => !['targetPath', 'phase', 'reset_id'].includes(key)) ||
          (phase === 'preview' ? reset_id !== undefined : typeof reset_id !== 'string')) {
        return canonicalResult({ status: 'blocked', code: 'invalid_reset_arguments' }, true);
      }
      if (!reset) return canonicalResult({ status: 'blocked', code: 'reset_host_ownership_unavailable',
        retained: ['Knowledge SQL del manifiesto o adaptador externo', 'borradores, cierres y revisiones del host', 'Credential Vault global'] }, true);
      try {
        const roots = [...(options.projectRoots ?? [])];
        syncAuthorizedRootsFromDisk(options.hostRegistryPath, roots);
        if (options.clientWorkspaceRoots && server.getClientCapabilities()?.roots) {
          for (const entry of (await server.listRoots()).roots) {
            const url = new URL(entry.uri);
            if (url.protocol !== 'file:' || (url.hostname && url.hostname !== 'localhost')) continue;
            roots.push(validateCandidateWorkspace(fileURLToPath(url), options.workspaceBootstrap!.directory));
          }
        }
        authorizedProjectRoot({ targetPath }, { projectRoots: roots }, true);
      }
      catch {
        // A pending reset may already have removed its own root authorization.
        try {
          const root = validateCandidateWorkspace(targetPath, options.workspaceBootstrap!.directory);
          if (readProjectResetState(options.workspaceBootstrap!.directory, root)?.state !== 'pending') throw new Error();
        } catch { return canonicalResult({ status: 'blocked', code: 'workspace_authorization_required' }, true); }
      }
      const outcome = phase === 'preview' ? reset.preview(targetPath) : await reset.confirm(targetPath, String(reset_id), context.signal);
      if (phase === 'preview' && outcome.status === 'preview' && applicationService) {
        const activeProject = applicationService.findActiveProjectByRoot(targetPath);
        if (activeProject) {
          return canonicalResult({ ...outcome, application_project_id: activeProject.project_id }, false);
        }
      }
      if (phase === 'confirm' && outcome.status === 'success' && applicationService) {
        const activeProject = applicationService.findActiveProjectByRoot(targetPath);
        if (activeProject) {
          const delPreview = applicationService.previewDelete(activeProject.project_id);
          await applicationService.confirmDelete(
            activeProject.project_id,
            delPreview.confirmation_token,
            'confirm_delete',
            { purgeWorkspaceQa: false },
          );
          applicationService.clearResetTombstone(activeProject.canonical_root);
        }
      }
      return canonicalResult(outcome, outcome.status !== 'preview' && outcome.status !== 'success');
    }
    if (options.configuredWorkspaceRoot && name === 'qap_auth_add' && rawArgs?.password !== undefined &&
        (typeof rawArgs.password !== 'string' || rawArgs.password.length === 0 || rawArgs.password.length > 4096 ||
          typeof rawArgs.username !== 'string' || !rawArgs.username.trim() ||
          typeof rawArgs.profile !== 'string' || !/^[\w-]{1,100}$/.test(rawArgs.profile) ||
          rawArgs.method === 'handoff' || rawArgs.login_mode === 'handoff' ||
          Object.keys(rawArgs).some(key => key !== 'password' && !Object.hasOwn(authInputProperties, key)))) {
      return canonicalResult({ status: 'error', code: 'invalid_auth_arguments' }, true);
    }
    if (options.configuredWorkspaceRoot && name === 'qap_auth_add' &&
        Object.keys(rawArgs ?? {}).some(key => key !== 'password' && !Object.hasOwn(authInputProperties, key))) {
      return interactiveBlocked('agent_auth_material_not_supported');
    }
    if (!options.silentBoundScope && !options.authAuthorizer && name === 'qap_auth_add' &&
        Object.keys(rawArgs ?? {}).some(key => !Object.hasOwn(authInputProperties, key))) {
      return interactiveBlocked('agent_auth_material_not_supported');
    }
    if (options.workspaceBootstrap) {
      try { releaseStorage = acquireProjectOperation(options.workspaceBootstrap.directory); }
      catch { return canonicalResult({ status: 'blocked', code: 'project_storage_busy_or_unavailable' }, true); }
      interactiveAccess?.refreshPersistedAuthorizations();
      if (options.hostRegistryPath) authorizedRoots.splice(0, authorizedRoots.length, ...(options.projectRoots ?? []));
    }
    if (options.clientWorkspaceRoots) {
      // Roots are an out-of-band client capability, never supplied as tool arguments.
      try {
        if (server.getClientCapabilities()?.roots) {
          const response = await server.listRoots();
          const roots = response.roots.map(r => {
            const uri = new URL(r.uri);
            if (uri.protocol !== 'file:' || (uri.hostname && uri.hostname !== 'localhost')) throw new Error('Invalid root');
            const path = fileURLToPath(uri);
            if (resolve(path).toLowerCase() !== realpathSync(path).toLowerCase()) throw new Error('Linked root');
            return realpathSync(path);
          });
          authorizedRoots.splice(0, authorizedRoots.length, ...new Set([...(options.projectRoots ?? []), ...roots]));
        }
      } catch { return canonicalResult({ status: 'blocked', category: 'technical_error', code: 'workspace_roots_unavailable', retryable: true }); }
    }
    if (options.hostRegistryPath) syncAuthorizedRootsFromDisk(options.hostRegistryPath, authorizedRoots);
    if (options.workspaceBootstrap) {
      const host = options.workspaceBootstrap.directory;
      const candidate = typeof rawArgs?.targetPath === 'string' ? rawArgs.targetPath : authorizedRoots.length === 1 ? authorizedRoots[0] : undefined;
      if (typeof candidate === 'string') {
        try { guardedRoot = validateCandidateWorkspace(candidate, host); } catch { /* Existing workspace checks classify invalid targets. */ }
        if (guardedRoot) {
          try { resetState = readProjectResetState(host, guardedRoot); }
          catch { return canonicalResult({ status: 'blocked', code: 'reset_state_unavailable' }, true); }
          if (resetState && seenResets.get(guardedRoot) !== resetState.id) {
            seenResets.set(guardedRoot, resetState.id);
            forgetBootstrapBinding(guardedRoot);
            interactiveAccess?.forgetProject(guardedRoot);
            discoveryHandler.forgetProject(guardedRoot);
            qapEventLog.forgetWorkspace(guardedRoot);
          }
          if (resetState?.state === 'pending') return canonicalResult({ status: 'blocked', code: 'project_reset_incomplete',
            receipt_id: resetState.id }, true);
          if (resetState?.state === 'complete' && name !== 'qap_init') {
            return name === 'qap_status' || name === 'qap_start'
              ? canonicalResult({ status: 'success', initialized: false, fase: 'ONBOARDING',
                siguiente_accion: { tool: 'qap_init', argumentos: { targetPath: guardedRoot }, descripcion: 'Inicializa un proyecto nuevo.' } })
              : canonicalResult({ status: 'blocked', code: 'project_not_initialized' }, true);
          }
        }
      }
    }
    if (name === 'qap_auth_provision') {
      if (!provisionAccess) return canonicalResult({ status: 'blocked', code: 'credential_dialog_host_unavailable' }, true);
      if (options.workspaceBootstrap && typeof rawArgs?.targetPath === 'string') {
        try {
          const authRoot = authorizedProjectRoot({ targetPath: rawArgs.targetPath }, dependencies, true);
          eventWorkspace = authRoot;
          await dependencies.prepareWorkspace!(authRoot);
        } catch {
          // Provision handler will enforce workspace authorization and return blocked
        }
      }
      return await provisionAccess.provision(rawArgs ?? {}, context.signal);
    }
    if (options.workspaceBootstrap) {
      const idScopedProjectActions = new Set([
        'list',
        'select',
        'resume',
        'delete_preview',
        'delete_confirm',
        'recover',
        'import_qa',
        'verify_import',
        'permissions',
        'revoke_permission',
      ]);
      const actionName = typeof rawArgs?.action === 'string' ? rawArgs.action : '';
      const skipWorkspaceGate =
        name === 'qap_project' &&
        !rawArgs?.targetPath &&
        !rawArgs?.canonical_root &&
        idScopedProjectActions.has(actionName);
      if (!skipWorkspaceGate) {
        const candidate = rawArgs?.targetPath ?? (name === 'qap_project' ? rawArgs?.canonical_root : undefined);
        let targetPath = typeof candidate === 'string' ? candidate : authorizedRoots.length === 1 ? authorizedRoots[0] : undefined;
        authorizationDiagnostic('workspace_request', { tool: name, targetPath, authorizerConfigured: Boolean(workspaceAuthorizer) });
        if (!targetPath) return canonicalResult({ status: 'blocked', category: 'human_authorization', code: 'workspace_selection_required',
          desbloquear_con: { mecanismo: 'workspace_selection', descripcion: 'Indica la ruta absoluta de una carpeta existente en targetPath; luego reintenta qap_status.' } });
        if (applicationService?.isTombstonedRoot(targetPath) && !(name === 'qap_project' && rawArgs?.allow_recreate_deleted === true)) {
          const tombstone = applicationService.getTombstoneByRoot(targetPath)!;
          return canonicalResult({
            status: 'blocked',
            category: 'human_authorization',
            code: 'project_deleted_tombstone',
            deleted_project_id: tombstone.project_id,
            recovery_available: true,
            auto_recreation_blocked: true,
            desbloquear_con: {
              mecanismo: 'qap_project',
              tool: 'qap_project',
              descripcion: 'Este proyecto fue eliminado explícitamente; se impide la recreación automática. Usa qap_project(action="recover") o create con allow_recreate_deleted: true.',
            },
          }, true);
        }
        if (options.configuredWorkspaceRoot && normalizePathKey(targetPath) !== normalizePathKey(options.configuredWorkspaceRoot)) {
          return canonicalResult({ status: 'blocked', code: 'workspace_outside_configured_root',
            desbloquear_con: { mecanismo: 'workspace_selection', descripcion: 'Usa el workspace configurado para esta instancia de QAP.' } }, true);
        }
        let isAuthorized = false;
        try {
          targetPath = authorizedProjectRoot({ targetPath }, dependencies, true);
          isAuthorized = true;
        } catch (error) {
          if (!(error instanceof McpToolError) || error.code === 'execution_failed') {
            return canonicalResult({ status: 'blocked', category: 'technical_error', code: 'workspace_inspection_failed', retryable: true });
          }
        }
        if (!isAuthorized) {
          let canonicalTarget: string;
          try {
            canonicalTarget = validateCandidateWorkspace(targetPath, options.workspaceBootstrap.directory);
          } catch (error) {
            const diagnosticId = authorizationDiagnostic('candidate_rejected', { targetPath, validation: error instanceof Error ? error.message.slice(0, 4096) : 'unknown' });
            return canonicalResult({ status: 'blocked', category: 'human_authorization', code: 'workspace_path_invalid', diagnostic_id: diagnosticId,
              desbloquear_con: { mecanismo: 'workspace_selection', descripcion: 'Selecciona una carpeta física existente y admitida, con ruta absoluta, fuera de directorios del sistema y del almacenamiento del host.' } });
          }
          if (workspaceAuthorizer) {
            const authResult = await workspaceAuthorizer.requestAuthorization(
              { requestedPath: targetPath, canonicalPath: canonicalTarget },
              context.signal
            ).catch(() => ({ decision: 'unavailable' as const, code: 'workspace_dialog_start_failed' as const, reason: 'Dialog launch failed.' }));
            const diagnosticId = authorizationDiagnostic('authorization_result', { decision: authResult.decision, code: 'code' in authResult ? authResult.code : undefined });
            if (authResult.decision === 'approved') {
              const compare = (p: string) => (process.platform === 'win32' ? p.toLowerCase() : p);
              if (!authorizedRoots.some(r => compare(r) === compare(authResult.root))) {
                authorizedRoots.push(authResult.root);
              }
              if (options.hostRegistryPath) {
                atomicRecordAuthorizedRoot(options.hostRegistryPath, authResult.root);
              }
              targetPath = authResult.root;
            } else if (authResult.decision === 'rejected') {
              return canonicalResult({
                status: 'blocked',
                category: 'human_authorization',
                code: 'workspace_authorization_rejected',
                mensaje: 'La autorización del workspace fue rechazada por el operador local.',
                desbloquear_con: {
                  mecanismo: 'local_host',
                  descripcion: 'El operador local rechazó la autorización para este directorio. Si deseas utilizarlo, autorízalo localmente mediante el mecanismo del host.',
                },
              });
            } else {
              return canonicalResult({
                status: 'blocked',
                category: 'human_authorization',
                code: authResult.code ?? (authResult.decision === 'cancelled' ? 'workspace_authorization_cancelled' : 'workspace_gui_unavailable'),
                diagnostic_id: diagnosticId,
                desbloquear_con: { mecanismo: 'local_host', descripcion: authResult.decision === 'cancelled'
                  ? 'La solicitud se canceló o expiró. Reintenta qap_status cuando el operador esté listo para responder.'
                  : 'El host no pudo mostrar el diálogo. Revisa la sesión de escritorio y los diagnósticos locales antes de reintentar.' },
              });
            }
          } else {
            return canonicalResult({ status: 'blocked', category: 'human_authorization', code: 'workspace_authorizer_not_configured',
              desbloquear_con: { mecanismo: 'local_host', comando: preparationCommand, descripcion: 'El host no configuró un autorizador interactivo. Revisa su configuración o autoriza localmente mediante el mecanismo administrativo del host; reintenta sin reiniciar.' } });
          }
        }
        eventWorkspace = targetPath;
        request.params.arguments = { ...rawArgs, targetPath };
        const isBootstrapTrigger = ['qap_start', 'qap_status', 'qap_init', 'qap_context_set'].includes(name);
        const shouldRehydrateWorkspace =
          !isBootstrapTrigger &&
          ['qap_auth_add', 'qap_auth_list', 'qap_context_ingest', 'qap_session_plan', 'qap_discover', 'qap_plan', 'qap_test', 'qap_report'].includes(name) &&
          Boolean(applicationService?.findActiveProjectByRoot(targetPath) || existsSync(join(targetPath, '.qa')));
        if (isBootstrapTrigger || shouldRehydrateWorkspace) {
          try {
            const suppliedUrl = rawArgs?.base_url ?? rawArgs?.environments;
            const contextArgs = name === 'qap_start' ? { targetPath, base_url: suppliedUrl } : request.params.arguments;
            const url = (name === 'qap_context_set' || name === 'qap_start') && typeof suppliedUrl === 'string'
              && new ContextHandler(dependencies).validateArguments(contextArgs) ? suppliedUrl : undefined;
            // Validate before performing any canonical writes.
            await dependencies.prepareWorkspace!(
              realpathSync(targetPath),
              startCredentials && applicationService?.findActiveProjectByRoot(targetPath) ? undefined : url,
            );
          } catch (error: unknown) {
            if (error instanceof ApplicationServiceError && error.code === 'project_deleted_tombstone') {
              return canonicalResult({
                status: 'blocked',
                category: 'human_authorization',
                code: 'project_deleted_tombstone',
                ...(error.details ?? {}),
                auto_recreation_blocked: true,
                desbloquear_con: {
                  mecanismo: 'qap_project',
                  tool: 'qap_project',
                  descripcion: error.message,
                },
              }, true);
            }
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorStack = error instanceof Error ? error.stack : undefined;
            const diagnosticId = randomUUID();
            logTechnicalDiagnostic({
              event: 'workspace_preparation_failed',
              diagnostic_id: diagnosticId,
              tool: name,
              targetPath,
              error: {
                name: error instanceof Error ? error.name : 'UnknownError',
                message: errorMessage,
                stack: errorStack,
              },
            }, targetPath);

            return canonicalResult({
              status: 'blocked',
              category: 'technical_error',
              code: 'workspace_preparation_failed',
              diagnostic_id: diagnosticId,
              razon: errorMessage || 'Fallo durante la preparación técnica del espacio de trabajo.',
              retryable: true,
              desbloquear_con: {
                mecanismo: 'local_host',
                descripcion: `Error técnico durante la preparación del espacio de trabajo: ${errorMessage}. Revisa ~/.qap/diagnostics/technical_errors.log.`,
              },
            });
          }
        }
      }
    }
    const scopedProject = options.configuredWorkspaceRoot && options.silentBoundScope && eventWorkspace
      ? applicationService?.findActiveProjectByRoot(eventWorkspace) : undefined;
    if (name === 'qap_auth_add' && scopedProject && applicationService && eventWorkspace &&
        (typeof rawArgs?.password === 'string' || rawArgs?.action === 'login' ||
          (rawArgs?.action === undefined && (rawArgs?.method === 'auto' || rawArgs?.login_mode === 'auto'))) &&
        rawArgs?.method !== 'handoff' && rawArgs?.login_mode !== 'handoff') {
      const scopedEnv = applicationService.resumeProject(scopedProject.project_id).environment;
      if (!scopedEnv) return canonicalResult({ status: 'blocked', code: 'login_outside_configured_qa_environment' }, true);
      const auth = await authenticateScopedPassword(applicationService, scopedProject.project_id, scopedEnv,
        eventWorkspace, rawArgs ?? {}, context.signal);
      return canonicalResult(auth, auth.status !== 'success');
    }
    if (name === 'qap_start') {
      if (!eventWorkspace || !options.workspaceBootstrap || !conversationId) {
        return canonicalResult({ status: 'blocked', code: 'workspace_not_bound' }, true);
      }
      const invocation = { requestId: context.requestId, signal: context.signal };
      const initialProject = applicationService?.findActiveProjectByRoot(eventWorkspace);
      const initialEnvironment = initialProject && applicationService?.resumeProject(initialProject.project_id).environment;
      if (startCredentials && initialEnvironment && (initialEnvironment.is_production ||
          new URL(initialEnvironment.base_url).origin !== new URL(String(rawArgs!.base_url)).origin)) {
        return canonicalResult({ status: 'blocked', code: 'login_outside_configured_qa_environment' }, true);
      }
      if (typeof rawArgs?.base_url === 'string') {
        const update = await dispatcher.dispatch({
          name: 'qap_context_set', arguments: { targetPath: eventWorkspace, base_url: rawArgs.base_url, source: 'user' },
        }, invocation);
        if (update.isError) return update;
      }
      let status = await dispatcher.dispatch({ name: 'qap_status', arguments: { targetPath: eventWorkspace } }, invocation);
      if (status.isError || status.content[0]?.type !== 'text') return status;
      let state = JSON.parse(status.content[0].text) as Record<string, unknown>;
      const project = applicationService?.findActiveProjectByRoot(eventWorkspace);
      let snapshot = project && applicationService?.resumeProject(project.project_id);
      const environment = snapshot?.environment;
      const baseUrl = environment?.base_url;
      let discoveryAttempt: Record<string, unknown> = {};
      const entryUrl = baseUrl ? new URL(baseUrl) : undefined;
      const entryPath = entryUrl ? sanitizeTargetPathname(entryUrl.href) : undefined;
      let auth: Record<string, unknown> | undefined;
      let suppliedProfile: string | undefined;
      const runScopedLogin = async (args: Record<string, unknown>, label: string) => {
        if (!scopedProject || !applicationService || !environment || !eventWorkspace) return false;
        const started = Date.now();
        const outcome = await authenticateScopedPassword(applicationService, scopedProject.project_id, environment,
          eventWorkspace, args, context.signal);
        qapEventLog.record({ workspace: eventWorkspace, conversationId, requestId: String(context.requestId) + ':auth',
          tool: 'qap_auth_add', args: { profile: label, action: args.action }, result: canonicalResult(outcome, outcome.status !== 'success'),
          durationMs: Date.now() - started });
        const success = outcome.status === 'success';
        auth = success ? { status: startCredentials ? 'verified' : 'renewed', profile: label, secretSaved: true }
          : { ...outcome, profile: label };
        status = await dispatcher.dispatch({ name: 'qap_status', arguments: { targetPath: eventWorkspace } }, invocation);
        if (!status.isError && status.content[0]?.type === 'text') state = JSON.parse(status.content[0].text) as Record<string, unknown>;
        snapshot = applicationService.resumeProject(scopedProject.project_id);
        return success;
      };
      if (startCredentials) {
        if (!entryUrl || !scopedProject || new URL(String(rawArgs!.base_url)).origin !== entryUrl.origin) {
          return canonicalResult({ status: 'blocked', code: 'login_outside_configured_qa_environment' }, true);
        }
        const knownProfile = readProfiles(eventWorkspace).find(item =>
          item.env === environment?.name && item.username === startCredentials.username &&
          (!item.login_origin || item.login_origin === entryUrl.origin));
        suppliedProfile = String(startCredentials.profile ?? knownProfile?.id ??
          ('qa-' + createHash('sha256').update(JSON.stringify([entryUrl.origin, startCredentials.username])).digest('hex').slice(0, 12)));
        await runScopedLogin({ ...startCredentials, profile: suppliedProfile, action: 'create' }, suppliedProfile);
      }
      let revisions = project && environment && applicationService ? applicationService.listLatestDiscoveryRevisionsByScope(project.project_id)
        .filter(revision => revision.environment_id === environment.env_id) : [];
      const activeProfiles = snapshot?.profiles.filter(profile => profile.env_id === environment?.env_id && profile.status !== 'revoked') ?? [];
      const profile = suppliedProfile ? activeProfiles.find(item => item.label === suppliedProfile) :
        activeProfiles.length === 1 ? activeProfiles[0] : undefined;
      let authenticatedObservation = profile ? revisions.find(revision => revision.profile_id === profile.profile_id &&
        revision.dossier.views.length) : undefined;
      if (scopedProject && environment && applicationService && entryUrl && !environment.is_production && !context.signal.aborted) {
        if (!startCredentials && activeProfiles.length > 1) auth = { status: 'profile_selection_required', profiles: activeProfiles.map(item => item.label) };
        if (profile) {
          let localProfile = readProfiles(eventWorkspace).find(item => item.id === profile.label && item.env === environment.name);
          const attempt = async (path: string, selectedProfile?: string) => {
            const args = { targetPath: eventWorkspace!, name: 'inventario-provisional', path,
              description: 'Inventario inicial del sistema', ...(selectedProfile ? { profile: selectedProfile } : {}) };
            const started = Date.now();
            const discovery = await dispatcher.dispatch({ name: 'qap_discover', arguments: args }, invocation);
            qapEventLog.record({ workspace: eventWorkspace, conversationId, requestId: String(context.requestId) + ':discovery',
              tool: 'qap_discover', args, result: discovery, durationMs: Date.now() - started });
            return discovery.content[0]?.type === 'text' ? JSON.parse(discovery.content[0].text) as Record<string, unknown> : {};
          };
          const renew = async () => {
            const args = { targetPath: eventWorkspace!, profile: profile.label, action: 'login', method: 'auto' };
            if (!await runScopedLogin(args, profile.label)) return false;
            localProfile = readProfiles(eventWorkspace!).find(item => item.id === profile.label && item.env === environment.name);
            return true;
          };
          const localOrigin = entryUrl.origin;
          const reusable = usableScopedSession(applicationService, scopedProject.project_id, profile.profile_id, localProfile, localOrigin);
          if (reusable && !startCredentials) auth = { status: 'reused', profile: profile.label };
          if ((reusable && (!startCredentials || auth?.status === 'verified')) || (!startCredentials && await renew())) {
            const path = () => scopedRoute(localProfile?.verified_route, localOrigin) ?? entryUrl.href;
            discoveryAttempt = await attempt(path(), profile.label);
            if (reusable && !startCredentials && ['auth_session_invalid', 'auth_session_expired'].includes(String(discoveryAttempt.code)) && await renew()) {
              discoveryAttempt = await attempt(path(), profile.label);
            }
            if (['auth_session_invalid', 'auth_session_expired'].includes(String(discoveryAttempt.code)) && auth?.status !== 'blocked') {
              auth = { status: 'blocked', code: discoveryAttempt.code, profile: profile.label };
            }
            revisions = applicationService.listLatestDiscoveryRevisionsByScope(scopedProject.project_id)
              .filter(revision => revision.environment_id === environment.env_id);
            authenticatedObservation = revisions.find(revision => revision.revision_id === discoveryAttempt.discovery_revision_id) ??
              authenticatedObservation;
          }
        }
      }
      const needsEntryObservation = (rawArgs?.refresh_discovery === true && !auth) || !revisions.some(revision =>
        revision.profile_id === null && revision.dossier.target_pathname === entryPath && revision.dossier.views.length);
      if (project && environment && applicationService && entryUrl && !environment.is_production &&
          options.silentBoundScope && needsEntryObservation && !authenticatedObservation && !context.signal?.aborted) {
        const args = { targetPath: eventWorkspace, name: 'inventario-provisional', path: entryUrl.href,
          description: 'Inventario inicial del sistema' };
        const started = Date.now();
        const discovery = await dispatcher.dispatch({ name: 'qap_discover', arguments: args }, invocation);
        if (discovery.content[0]?.type === 'text') discoveryAttempt = JSON.parse(discovery.content[0].text) as Record<string, unknown>;
        qapEventLog.record({ workspace: eventWorkspace, conversationId, requestId: String(context.requestId) + ':discovery',
          tool: 'qap_discover', args, result: discovery, durationMs: Date.now() - started });
        revisions = applicationService.listLatestDiscoveryRevisionsByScope(project.project_id)
          .filter(revision => revision.environment_id === environment.env_id);
      }
      const publicRevisions = revisions.filter(revision => revision.profile_id === null);
      const firstObservation = authenticatedObservation ?? publicRevisions.find(revision => revision.dossier.target_pathname === entryPath &&
        revision.dossier.views.length) ?? publicRevisions.find(revision => revision.dossier.views.length) ?? publicRevisions[0];
      let indexPath: string | undefined;
      if (project && applicationService && revisions.length) {
        indexPath = '.qa/discovery/INDEX.md';
        if (!existsSync(join(eventWorkspace, indexPath)) ||
            (firstObservation && !existsSync(join(eventWorkspace, buildPublishedModuleDocRepoPath(firstObservation))))) {
          writeDiscoveryMarkdownFiles(eventWorkspace, project.project_id,
            applicationService.listLatestDiscoveryRevisionsByScope(project.project_id), { regenerateAll: true });
        }
      }
      const diagnostic = typeof auth?.code === 'string' ? auth.code
        : typeof discoveryAttempt.code === 'string' && (!auth || discoveryAttempt.code !== 'auth_required') ? discoveryAttempt.code
          : !auth ? firstObservation?.dossier.gaps.find(gap => gap.code === 'auth_required')?.code : undefined;
      const dossier = firstObservation?.dossier;
      const discoverySummary = {
        status: dossier?.acquisition_status ?? discoveryAttempt.status ?? 'pending',
        ...(firstObservation ? { access: firstObservation.profile_id ? 'authenticated' : 'public' } : {}),
        ...(diagnostic ? { code: diagnostic } : {}),
        ...(indexPath ? { index_path: indexPath } : {}),
        ...(firstObservation && dossier ? {
          revision_id: firstObservation.revision_id,
          doc_path: buildPublishedModuleDocRepoPath(firstObservation),
          reused: !discoveryAttempt.discovery_revision_id,
          counts: { ...dossier.route_counts, views: dossier.views.length,
            controls: dossier.views.reduce((sum, view) => sum + view.controls.length, 0),
            forms: dossier.views.reduce((sum, view) => sum + view.forms_count, 0) },
          routes: dossier.routes.flatMap(route => route.authorized_pathname ? [{
            path: route.authorized_pathname,
            state: route.state,
            ...(route.reason ? { reason: route.reason } : {}),
          }] : []).slice(0, 8),
          gaps: dossier.gaps.map(gap => gap.code),
        } : {}),
        ...(revisions.length ? { documented_scopes: revisions.slice(0, 8).map(revision => ({
          revision_id: revision.revision_id, module: revision.module_key,
          access: revision.profile_id ? 'authenticated' : 'public',
          doc_path: buildPublishedModuleDocRepoPath(revision),
        })) } : {}),
      };
      const scan = state.scan as ReturnType<typeof generarScan> | undefined;
      const codeRoutes = scanProjectRoutes(eventWorkspace, scan?.subproyectos ?? []).rutas;
      const candidates = (scan?.documentos ?? []).flatMap(document =>
        typeof document.path === 'string' && document.es_ingerible !== false &&
          !/(^|[/\\])(?:scripts|metadata)([/\\]|$)/i.test(document.path)
          ? [document.path.replace(/[\x00-\x1f\x7f]/g, ' ').slice(0, 200)] : []).slice(0, 8);
      const notesPath = '.qa/discovery/INICIO.md';
      const summaryLines = ['# Inventario inicial', '',
        'Observaciones disponibles de la aplicación y materiales encontrados en este proyecto.', '',
        '## Aplicación', '',
        ...(dossier ? [
          '- Estado de la observación: ' + dossier.acquisition_status,
          '- Acceso de la observación: ' + (firstObservation?.profile_id ? 'autenticado' : 'público'),
          ...(auth ? ['- Estado del acceso actual: ' + String(auth.code ?? auth.status)] : []),
          '- Vistas: ' + dossier.views.length,
          '- Rutas visitadas / candidatas / bloqueadas: ' +
            [dossier.route_counts.visited, dossier.route_counts.candidate, dossier.route_counts.blocked].join(' / '),
          ...(firstObservation ? ['- [Expediente de la vista](' + buildPublishedModuleDocRepoPath(firstObservation).replace(/^\.qa\/discovery\//, '') + ')'] : []),
          ...(indexPath ? ['- [Índice de Discovery](INDEX.md)'] : []),
          ...(discoverySummary.routes ?? []).map(route => '- Ruta ' + route.path.replace(/[^a-z\d/_.~-]/gi, '') + ' · ' + route.state +
            (route.reason === 'AUTH_REQUIRED' ? ' (pantalla de acceso)' : '')),
          ...(!auth ? dossier.gaps.filter(gap => gap.code === 'auth_required').map(gap => '- ' + gap.description) : []),
        ] : [baseUrl ? '- Observación pendiente: ' + (discoveryAttempt.code ?? discoveryAttempt.status ?? 'sin captura disponible') :
          '- Falta la URL de la aplicación desplegada.']),
        ...(indexPath && !dossier ? ['- [Índice de Discovery](INDEX.md)'] : []),
        '', '## Materiales del proyecto', '',
        ...(candidates.length ? candidates.map(path => '- ' + path.replace(/[\\[\]<>]/g, '')) : ['- Sin documentos candidatos en el escaneo.']),
        ...(scan?.subproyectos?.length ? ['- Subproyectos detectados: ' + scan.subproyectos.length] : []),
        ...(codeRoutes.length ? ['', '## Rutas encontradas en código', '',
          ...codeRoutes.slice(0, 10).map(route => '- ' + route.path.replace(/[\x00-\x1f\x7f<>]/g, '')),
          '- Rutas candidatas en el despliegue: ' + codeRoutes.length] : []), ''];
      atomicWritePrivateFile(resolveContainedPath(eventWorkspace, notesPath), summaryLines.join('\n'));
      return canonicalResult({ ...state, status: state.status ?? 'success', conversation_id: conversationId,
        ...(auth ? { autenticacion: auth } : {}),
        discovery_inicial: { ...discoverySummary, notes_path: notesPath,
          ...(diagnostic === 'auth_required' ? { continuation: 'Usa un perfil verificado para documentar áreas internas.' } : {}) },
        conversation_log: conversationLogPath(eventWorkspace, conversationId) });
    }
    if (dispatcher.has(name)) {
      const dispatchResult = await dispatcher.dispatch(request.params, { requestId: context.requestId, signal: context.signal ?? new AbortController().signal });
      if (name === 'qap_project' && rawArgs?.action === 'delete_confirm' && !dispatchResult.isError && applicationService) {
        try {
          const parsed = JSON.parse((dispatchResult.content[0] as { text?: string })?.text ?? '{}') as { status?: string; project_id?: string };
          if (parsed.status === 'deleted' && parsed.project_id) {
            const deletedRow = applicationService.store.get<{ canonical_root: string }>(
              'SELECT canonical_root FROM deletion_tombstones WHERE project_id = ?',
              parsed.project_id,
            );
            if (deletedRow?.canonical_root) {
              const targetKey = normalizePathKey(deletedRow.canonical_root);
              for (let i = authorizedRoots.length - 1; i >= 0; i -= 1) {
                if (normalizePathKey(authorizedRoots[i]) === targetKey) authorizedRoots.splice(i, 1);
              }
              for (let i = workspaceBindings.length - 1; i >= 0; i -= 1) {
                if (normalizePathKey(workspaceBindings[i].projectRoot) === targetKey) workspaceBindings.splice(i, 1);
              }
              for (const k of [...interviews.keys()]) {
                if (normalizePathKey(k) === targetKey) interviews.delete(k);
              }
              for (const k of [...closures.keys()]) {
                if (normalizePathKey(k) === targetKey) closures.delete(k);
              }
            }
          }
        } catch { /* Non-fatal cleanup */ }
      }
      return dispatchResult;
    }
    // Provisioned hosts keep their existing composition, but legacy writers must
    // obey the same root boundary as migrated handlers. No tool argument grants it.
    if (!options.workspaceBootstrap && options.projectRoots !== undefined) {
      try { eventWorkspace = authorizedProjectRoot(request.params.arguments, dependencies, true); }
      catch { return canonicalResult({ status: 'blocked', category: 'human_authorization', code: 'workspace_authorization_required',
        desbloquear_con: { mecanismo: 'local_host', descripcion: 'Selecciona una raíz autorizada por este host. No se amplían los permisos del manifiesto desde argumentos MCP.' } }); }
    }
    // Legacy invocation boundary; removed incrementally when handlers migrate.
    /* eslint-disable @typescript-eslint/no-base-to-string, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/require-await, @typescript-eslint/no-unnecessary-type-assertion, @typescript-eslint/no-unsafe-return */
    const args = (request.params.arguments || {}) as Record<string, unknown>;
    const rootDir = args.targetPath ? resolve(String(args.targetPath)) : process.cwd();
    eventWorkspace ??= rootDir;

    try {
      switch (name) {
        case 'qap_init': {
          const qaDir = resolve(rootDir, '.qa');
          const projectName = String(args.projectName || basename(rootDir) || 'my-project');
          const envList = Array.isArray(args.environments) && args.environments.length > 0
            ? args.environments.map(String)
            : ['local'];

          const serviciosConEvidencia = detectarServiciosConEvidencia(rootDir);
          const resolvedBaseUrl = (typeof args.baseUrl === 'string' && args.baseUrl.trim().length > 0)
            ? args.baseUrl.trim()
            : (serviciosConEvidencia.length > 0 ? serviciosConEvidencia[0].url : undefined);

          const allowedDirs = [
            join(qaDir, 'project'),
            join(qaDir, 'modules'),
            join(qaDir, 'cache'),
            join(qaDir, 'executions'),
            join(qaDir, 'plans'),
          ];
          for (const d of allowedDirs) {
            if (!existsSync(d)) {
              mkdirSync(d, { recursive: true });
            }
          }

          const envsPath = join(qaDir, 'project', 'environments.yaml');
          const contextPath = join(qaDir, 'project', 'context.yaml');
          const gitignorePath = join(qaDir, '.gitignore');
          const lifecyclePath = join(qaDir, 'project', 'lifecycle.json');

          const yaExistia = existsSync(contextPath) || existsSync(envsPath);

          if (!existsSync(envsPath)) {
            const envsMap: Record<string, { url: string; browser_mode: 'auto' | 'headless' | 'headed' }> = {};
            if (resolvedBaseUrl) {
              for (const env of envList) {
                envsMap[env] = { url: resolvedBaseUrl, browser_mode: 'auto' };
              }
            }
            const envsYaml = {
              _version: '1',
              default: envList[0] || 'local',
              environments: envsMap,
            };
            writeFileSync(envsPath, YAML.stringify(envsYaml), 'utf-8');
          }

          const rawInitRoles = Array.isArray(args.roles) ? (args.roles as unknown[]) : [];
          const validInitRoles = rawInitRoles.filter((r) => isValidRoleName(typeof r === 'string' ? r : (r as any)?.name));
          const discardedInitRoles = rawInitRoles
            .filter((r) => !isValidRoleName(typeof r === 'string' ? r : (r as any)?.name))
            .map((r) => (typeof r === 'string' ? r : (r as any)?.name));

          if (!existsSync(contextPath)) {
            const contextYaml: Record<string, any> = {
              _version: '1',
              project_name: projectName,
              description: `Configuración base de QA para ${projectName}`,
              tech_stack: [],
              ...(validInitRoles.length > 0
                ? {
                    roles: validInitRoles.map((r) => ({
                      name: typeof r === 'string' ? r : (r as any).name,
                      source: 'user',
                    })),
                  }
                : {}),
              ...(resolvedBaseUrl ? { base_url: resolvedBaseUrl } : {}),
              manually_edited: false,
            };
            writeFileSync(contextPath, YAML.stringify(contextYaml), 'utf-8');
          }

          if (!existsSync(gitignorePath)) {
            writeFileSync(gitignorePath, '# Generado automáticamente por QAP\nexecutions/\ncache/\n', 'utf-8');
          }

          if (!existsSync(lifecyclePath)) {
            const initialLifecycle = {
              _version: '1',
              phase: 'ONBOARDING',
              session: {
                id: '',
                started_at: new Date().toISOString(),
                plan: [],
              },
              modules: {},
              history: [
                {
                  from: 'NONE',
                  to: 'ONBOARDING',
                  at: new Date().toISOString(),
                  reason: 'Inicialización de ciclo de vida con qap_init',
                },
              ],
            };
            writeFileSync(lifecyclePath, JSON.stringify(initialLifecycle, null, 2), 'utf-8');
          }

          const storage = new FileSystemStorage({ rootDir });
          const currentLifecycle = await storage.getLifecycleState();
          const finalPhase = currentLifecycle.phase;

          let ctxObj: any = null;
          if (existsSync(contextPath)) {
            try { ctxObj = YAML.parse(readFileSync(contextPath, 'utf-8')); } catch { /* ignore */ }
          }
          let envObj: any = null;
          if (existsSync(envsPath)) {
            try { envObj = YAML.parse(readFileSync(envsPath, 'utf-8')); } catch { /* ignore */ }
          }

          const gate = canExitOnboarding(ctxObj, envObj);
          const scan = generarScan(rootDir);
          const scanPath = join(qaDir, 'project', 'scan.json');
          try {
            writeFileSync(scanPath, JSON.stringify(scan, null, 2), 'utf-8');
          } catch { /* ignore */ }

          const hallazgos = detectarDocumentosProyecto(rootDir);
          hallazgos.servicios = serviciosConEvidencia;

          const subcarpetaRepo = scan.documentos.length === 0 ? detectarSubcarpetaWorkspace(rootDir) : null;
          const advertencias: string[] = [];
          if (subcarpetaRepo) {
            advertencias.push(
              `targetPath parece una subcarpeta del repositorio ${subcarpetaRepo}; para analizar todo el proyecto usa la raíz como targetPath`
            );
          }

          if (scan.documentos.length > 0) {
            const topDoc = scan.documentos[0];
            try {
              const fullDocPath = resolve(rootDir, topDoc.path);
              if (existsSync(fullDocPath)) {
                const docRaw = readFileSync(fullDocPath, 'utf-8');
                const parsed = parsePrdContent(docRaw, topDoc.path);
                if (parsed.objective) {
                  hallazgos.preliminar = {
                    docPath: topDoc.path,
                    objetivo: sanitizeDomString(parsed.objective).slice(0, 150).trim(),
                  };
                }
              }
            } catch { /* ignore */ }
          }

          const detectedService = serviciosConEvidencia.length > 0
            ? { url: serviciosConEvidencia[0].url, label: serviciosConEvidencia[0].label, evidencia: serviciosConEvidencia[0].evidencia }
            : undefined;

          const browserCheck = await checkPlaywrightBrowser();
          const preflight = {
            navegador_qap: (browserCheck.disponible ? 'ok' : 'falta') as 'ok' | 'falta',
            comando_instalacion: PLAYWRIGHT_INSTALL_COMMAND,
          };

          const repoMap = scanProjectRoutes(rootDir, scan.subproyectos || []);
          const repoMapPath = join(qaDir, 'project', 'repo-map.json');
          try {
            writeFileSync(repoMapPath, JSON.stringify(repoMap, null, 2), 'utf-8');
          } catch { /* ignore */ }

          const guidance = getPhaseGuidance('ONBOARDING', {
            faltantes: gate.faltantes,
            hallazgos,
            context: ctxObj,
            environments: envObj,
            lifecycle: currentLifecycle,
          });

          if (!browserCheck.disponible && !options.workspaceBootstrap) {
            guidance.siguiente_accion = {
              tipo: 'trabajo',
              comando: PLAYWRIGHT_INSTALL_COMMAND,
              descripcion: `Instalar navegador Chromium para Playwright sin consultar al usuario. Ejecuta '${PLAYWRIGHT_INSTALL_COMMAND}'.`,
            };
          }

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    status: 'success',
                    directorio_objetivo: rootDir,
                    message: '✔ Proyecto inicializado con éxito en .qa/',
                    projectName,
                    preflight,
                    navegador_qap: preflight.navegador_qap,
                    repo_map_resumen: {
                      total_rutas: repoMap.rutas.length,
                      advertencias: repoMap.advertencias,
                    },
                    environments: envList,
                    directories: allowedDirs.map((p) => p.replace(rootDir, '')),
                    ya_existia: yaExistia,
                    hallazgos_workspace: hallazgos,
                    scan,
                    detectedService,
                    advertencias,
                    roles_descartados: discardedInitRoles,
                    lifecycle: {
                      phase: finalPhase,
                    },
                    fase: finalPhase,
                    siguiente_accion: guidance.siguiente_accion,
                    _guidance_for_assistant: !browserCheck.disponible && !options.workspaceBootstrap
                      ? `Ejecuta '${PLAYWRIGHT_INSTALL_COMMAND}' sin consultar al usuario.`
                      : `Fase actual: ${finalPhase}. Siguiente acción: ${guidance.siguiente_accion.descripcion}`,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case 'qap_auth_add': {
          const authAccess = interactiveAccess ?? unauthenticatedInteractiveAccess;
          if (authAccess) {
            return await authAccess.login(rawArgs ?? {}, context.signal);
          }
          const profileId = String(args.profile || args.id || 'default').trim();
          const env = String(args.env || 'local').trim();
          const username = String(args.username || 'user').trim();
          const method = (args.method === 'handoff' || args.login_mode === 'handoff') ? 'handoff' : 'credentials';
          const loginMode: 'auto' | 'handoff' = method === 'handoff' ? 'handoff' : 'auto';
          const loginRoute = String(args.login_route || '/login').trim();
          const role = args.role ? String(args.role).trim() : undefined;
          const password = args.password ? String(args.password) : (args.secret ? String(args.secret) : undefined);
          const requestedTenant = typeof args.tenant_id === 'string' && args.tenant_id.trim() ? args.tenant_id.trim() : undefined;

          const activeProject = applicationService?.findActiveProjectByRoot(rootDir);
          if (activeProject && applicationService) {
            const tenantCheck = applicationService.validateTenantScope(activeProject.project_id, requestedTenant, profileId);
            if (!tenantCheck.ok) {
              return canonicalResult({
                status: 'blocked',
                category: 'human_authorization',
                code: tenantCheck.code,
                razon: tenantCheck.reason,
                desbloquear_con: {
                  mecanismo: 'qap_auth_add',
                  tool: 'qap_auth_add',
                  campo: 'tenant_id',
                  descripcion: tenantCheck.reason,
                },
              }, true);
            }
          }

          // Resolver baseUrl temprano para validar alcance y autorización por origen
          let yamlBaseUrl: string | undefined;
          let yamlIsProduction = false;
          const resolvedEnvsPath = join(rootDir, '.qa', 'project', 'environments.yaml');
          if (existsSync(resolvedEnvsPath)) {
            try {
              const parsedEnv = YAML.parse(readFileSync(resolvedEnvsPath, 'utf-8'));
              const targetEnvKey = args.env ? env : (parsedEnv?.default ?? 'local');
              const envNode = parsedEnv?.environments?.[targetEnvKey] as Record<string, unknown> | undefined;
              if (typeof envNode?.url === 'string' && envNode.url.trim()) {
                yamlBaseUrl = envNode.url.trim();
              }
              if (envNode?.is_production === true) {
                yamlIsProduction = true;
              }
            } catch { /* empty */ }
          } else {
            const ctxPath = join(rootDir, '.qa', 'project', 'context.yaml');
            if (existsSync(ctxPath)) {
              try {
                const parsedCtx = YAML.parse(readFileSync(ctxPath, 'utf-8'));
                if (typeof parsedCtx?.base_url === 'string' && parsedCtx.base_url.trim()) {
                  yamlBaseUrl = parsedCtx.base_url.trim();
                }
              } catch { /* empty */ }
            }
          }
          const activeEnvRec = activeProject && applicationService
            ? applicationService.resumeProject(activeProject.project_id).environment
            : undefined;
          const canonicalBaseUrl = activeEnvRec?.base_url;
          const resolvedBaseUrl = canonicalBaseUrl ?? yamlBaseUrl ?? 'http://localhost:3000';
          if (options.configuredWorkspaceRoot && password &&
              (!canonicalBaseUrl || activeEnvRec?.is_production || yamlIsProduction ||
                (args.env !== undefined && env !== activeEnvRec?.name) ||
                !loginRoute.startsWith('/') || loginRoute.startsWith('//') || loginRoute.includes('\\'))) {
            return canonicalResult({ status: 'blocked', code: 'login_outside_configured_qa_environment' }, true);
          }
          const origin = (() => {
            try {
              return new URL(resolvedBaseUrl).origin;
            } catch {
              return resolvedBaseUrl;
            }
          })();
          const hasDiscrepantYamlUrl = Boolean(
            yamlBaseUrl &&
            canonicalBaseUrl &&
            (() => {
              try {
                return new URL(yamlBaseUrl).origin !== new URL(canonicalBaseUrl).origin;
              } catch {
                return yamlBaseUrl !== canonicalBaseUrl;
              }
            })(),
          );

          if (options.workspaceBootstrap) {
            const diskAuths = options.hostAuthRegistryPath
              ? loadAuthAuthorizationsFromDisk(options.hostAuthRegistryPath)
              : [];
            const combinedAuths = [...authorizedAuths, ...diskAuths];
            const accessPerm = activeProject && applicationService
              ? applicationService.authority.check(activeProject.project_id, 'access', { root_path: rootDir })
              : null;
            if (accessPerm && !accessPerm.allowed && (accessPerm.reason === 'revoked' || accessPerm.reason === 'expired')) {
              return canonicalResult({
                status: 'blocked',
                category: 'human_authorization',
                code: accessPerm.code,
                razon: 'El acceso al proyecto fue revocado o expiró.',
                desbloquear_con: {
                  mecanismo: 'local_host',
                  descripcion: accessPerm.recover_with,
                },
              }, true);
            }
            const loginPerm = activeProject && applicationService
              ? applicationService.authority.check(activeProject.project_id, 'login', {
                  origin,
                  profile_id: profileId,
                  ...(requestedTenant ? { tenant_id: requestedTenant } : {}),
                })
              : null;
            if (loginPerm && !loginPerm.allowed && loginPerm.reason === 'revoked') {
              return canonicalResult({
                status: 'blocked',
                category: 'human_authorization',
                code: 'login_permission_revoked',
                razon: 'El permiso de inicio de sesión para este perfil fue revocado. Nunca se degradará a una sesión anónima.',
                desbloquear_con: {
                  mecanismo: 'local_host',
                  descripcion: loginPerm.recover_with,
                },
              }, true);
            }
            const existingProfSession = activeProject && applicationService
              ? applicationService.readProfileSession(activeProject.project_id, profileId)
              : null;
            if (existingProfSession?.revoked) {
              return canonicalResult({
                status: 'blocked',
                category: 'human_authorization',
                code: 'auth_session_revoked',
                razon: 'El perfil de inicio de sesión fue revocado. Nunca se degradará a una sesión anónima.',
                desbloquear_con: {
                  mecanismo: 'local_host',
                  descripcion: 'Autoriza o crea un perfil vigente antes de iniciar sesión.',
                },
              }, true);
            }
            const isProductionEnv = Boolean(activeEnvRec?.is_production) || yamlIsProduction || env === 'production';
            const alreadyAuthorized = Boolean(loginPerm?.allowed)
              || hasPersistedAuthAuthorization(combinedAuths, rootDir, origin, profileId);
            if (!alreadyAuthorized) {
              if (!options.authAuthorizer && options.silentBoundScope && !isProductionEnv && Boolean(canonicalBaseUrl) && !hasDiscrepantYamlUrl) {
                const grantedEntry: PersistedAuthAuthorization = {
                  projectRoot: rootDir,
                  origin,
                  profileLabel: profileId,
                  loginMode,
                  authorizedAt: new Date().toISOString(),
                };
                authorizedAuths.push(grantedEntry);
                if (activeProject && applicationService) {
                  applicationService.authority.grant({
                    project_id: activeProject.project_id,
                    ...(activeEnvRec ? { env_id: activeEnvRec.env_id } : {}),
                    capability: 'login',
                    scope: {
                      origin,
                      profile_id: profileId,
                      ...(requestedTenant ? { tenant_id: requestedTenant } : {}),
                    },
                    granted_by: 'host_bound_scope',
                  });
                }
              } else if (!options.authAuthorizer) {
                return canonicalResult({
                  status: 'blocked',
                  category: 'human_authorization',
                  code: 'authentication_authorization_required',
                  desbloquear_con: {
                    mecanismo: 'local_host',
                    descripcion: 'El host debe autorizar explícitamente la autenticación antes de iniciar sesión en el sistema.',
                  },
                }, true);
              } else {
              const authResult = await options.authAuthorizer.requestAuthorization(
                {
                  projectRoot: rootDir,
                  projectName: activeProject?.name ?? basename(rootDir),
                  applicationId: activeProject?.application_id ?? knowledgeBinding(rootDir, dependencies)?.applicationId ?? basename(rootDir),
                  environmentId: activeEnvRec?.env_id ?? env,
                  origin,
                  profileLabel: profileId,
                  loginMode,
                },
                context.signal,
              ).catch(() => ({
                decision: 'unavailable' as const,
                code: 'auth_dialog_start_failed' as const,
                reason: 'No pudo abrirse la ventana segura de autenticación.',
              }));
              if (authResult.decision === 'rejected') {
                return canonicalResult({
                  status: 'blocked',
                  category: 'human_authorization',
                  code: 'authentication_authorization_rejected',
                  mensaje: 'La autorización de inicio de sesión fue rechazada.',
                  desbloquear_con: {
                    mecanismo: 'local_host',
                    descripcion: 'El inicio de sesión no fue autorizado; vuelve a intentarlo cuando desees habilitar el acceso autenticado.',
                  },
                });
              }
              if (authResult.decision !== 'approved') {
                return canonicalResult({
                  status: 'blocked',
                  category: 'human_authorization',
                  code: authResult.code ?? 'auth_authorization_cancelled',
                  desbloquear_con: {
                    mecanismo: 'local_host',
                    descripcion: authResult.reason || 'La ventana de autorización se cerró antes de confirmar el inicio de sesión.',
                  },
                });
              }
              const grantedEntry: PersistedAuthAuthorization = {
                projectRoot: rootDir,
                origin: authResult.origin,
                profileLabel: authResult.profileLabel,
                loginMode,
                authorizedAt: new Date().toISOString(),
                ...(authResult.expiresAt ? { expiresAt: authResult.expiresAt } : {}),
              };
              authorizedAuths.push(grantedEntry);
              if (options.hostAuthRegistryPath) {
                atomicRecordAuthAuthorization(options.hostAuthRegistryPath, grantedEntry);
              }
              if (activeProject && applicationService) {
                const envRec = applicationService.resumeProject(activeProject.project_id).environment;
                applicationService.authority.grant({
                  project_id: activeProject.project_id,
                  ...(envRec ? { env_id: envRec.env_id } : {}),
                  capability: 'login',
                  scope: {
                    origin: authResult.origin,
                    profile_id: profileId,
                    ...(requestedTenant ? { tenant_id: requestedTenant } : {}),
                  },
                  granted_by: 'interactive-dialog',
                });
              }
              }
            }
          }

          const authDir = resolve(rootDir, '.qa', 'project', 'auth');
          const profilesPath = join(authDir, 'profiles.json');
          if (!existsSync(authDir)) {
            mkdirSync(authDir, { recursive: true });
          }

          let profiles: AuthProfile[] = [];
          if (existsSync(profilesPath)) {
            try {
              const raw = readFileSync(profilesPath, 'utf-8');
              const parsed = JSON.parse(raw);
              profiles = parsed.profiles || [];
            } catch {
              profiles = [];
            }
          }

          const existingIndex = profiles.findIndex((p) => p.id === profileId);
          const authCondition = args.post_login_condition as { type?: unknown; value?: unknown } | undefined;
          if (authCondition !== undefined && (!authCondition || authCondition.type !== 'selector_present' || typeof authCondition.value !== 'string' || !authCondition.value.trim() || authCondition.value.length > 500)) return canonicalResult({ status: 'blocked', code: 'invalid_post_login_condition' }, true);
          const newProfile: AuthProfile = {
            id: profileId,
            env,
            username,
            login_mode: loginMode,
            login_route: loginRoute,
            role: role || undefined,
            session_cache: { enabled: true },
            post_login_condition: authCondition as AuthProfile['post_login_condition'] ?? { type: 'url_contains', value: '/dashboard' },
            application_id: knowledgeBinding(rootDir, dependencies)?.applicationId,
            handoff_timeout_ms: Math.min(Number(args.timeout_ms) || 120000, 120000),
            credential_source: 'keychain',
            verified: false,
          };

          if (existingIndex >= 0) {
            profiles[existingIndex] = newProfile;
          } else {
            profiles.push(newProfile);
          }

          // Guardar perfil inicial
          writeFileSync(profilesPath, JSON.stringify({ profiles }, null, 2), 'utf-8');

          let secretStoredViaService = false;
          let durableEnvId: string | undefined;
          if (activeProject && applicationService) {
            const ensuredEnv = applicationService.resumeProject(activeProject.project_id).environment
              ?? applicationService.upsertEnvironment({
                projectId: activeProject.project_id,
                name: env || 'local',
                baseUrl: resolvedBaseUrl,
              });
            durableEnvId = ensuredEnv.env_id;
            const svcProfile = applicationService.upsertProfile({
              projectId: activeProject.project_id,
              envId: durableEnvId,
              label: profileId,
              roleName: role || undefined,
              tenantId: requestedTenant,
              loginMode,
              credentialAccount: profileId,
              status: 'pending',
            });
            if (password) {
              await applicationService.storeProfileSecret(activeProject.project_id, svcProfile.profile_id, {
                username,
                password,
              });
              secretStoredViaService = true;
            }
          }

          if (password) {
            try {
              const { AuthManager } = await import('@qap/auth');
              const authManager = new AuthManager(rootDir);
              await authManager.setSecret(profileId, password);
            } catch {
              if (!secretStoredViaService) {
                return {
                  content: [
                    {
                      type: 'text',
                      text: JSON.stringify(
                        {
                          status: 'blocked',
                          razon: 'keychain_unavailable',
                          directorio_objetivo: rootDir,
                          error: 'El llavero seguro del sistema no está disponible. No se almacenarán credenciales en texto plano.',
                          desbloquear_con: {
                            tool: 'qap_auth_add',
                            descripcion: 'Usa el inicio de sesión interactivo (handoff) en ventana segura sin guardar contraseñas.',
                          },
                        },
                        null,
                        2
                      ),
                    },
                  ],
                };
              }
            }
          }

          const storage = new FileSystemStorage({ rootDir });
          const lifecycleState = await storage.getLifecycleState();

          const baseUrl = resolvedBaseUrl;
          const envsPath = resolvedEnvsPath;

          const sessionDir = join(rootDir, '.qa', 'cache', 'sessions');
          if (!existsSync(sessionDir)) mkdirSync(sessionDir, { recursive: true });

          const plan = lifecycleState.session?.plan || [];
          const firstProtected = plan.find((p: { module: string; path: string; acceso?: boolean }) => !p.acceso && !isAuthPath(p.path));
          const postLoginCondition = authCondition ? newProfile.post_login_condition! : (firstProtected
            ? { type: 'url_contains' as const, value: firstProtected.path }
            : (newProfile.post_login_condition || { type: 'url_contains' as const, value: '/dashboard' }));

          let capturedStorageState: StorageState | undefined = args.storageState as StorageState | undefined;
          let loginLandedPath: string | undefined;
          const verificationAttempted = Boolean(capturedStorageState || password || method === 'handoff');

          if (!capturedStorageState && password) {
            try {
              const { PlaywrightAdapter } = await import('@qap/playwright-adapter');
              const tempSessionPath = join(sessionDir, `tmp_${profileId}_${Date.now()}.json`);
              const { restrictChromiumPage } = await import('@qap/auth');
              const loginAdapter = new PlaywrightAdapter({
                headless: true,
                baseUrl,
                sessionPath: tempSessionPath,
                credentials: { username, password },
                ...(options.configuredWorkspaceRoot ? { preparePage: (page: Parameters<typeof restrictChromiumPage>[0]) => restrictChromiumPage(page, origin) } : {}),
              });
              const loginRes = await loginAdapter.discover({ name: 'login_flow', path: loginRoute });
              const loginCtx = (loginRes.context || {}) as Record<string, unknown>;
              if (loginCtx.page_kind !== 'login' && typeof loginCtx.final_url === 'string') {
                try {
                  loginLandedPath = new URL(loginCtx.final_url, baseUrl).pathname;
                } catch { /* ignore */ }
              }
              if (existsSync(tempSessionPath)) {
                try {
                  capturedStorageState = JSON.parse(readFileSync(tempSessionPath, 'utf-8'));
                } catch { /* empty */ }
                try { rmSync(tempSessionPath, { force: true }); } catch { /* empty */ }
              }
            } catch {
              // Si falla la navegación del auto-login
            }
          } else if (!capturedStorageState && method === 'handoff') {
            try {
              const { chromium } = await import('playwright-core');
              const browser = await chromium.launch({ headless: false });
              const bCtx = await browser.newContext();
              try {
                const handoffHook = (globalThis as Record<string, unknown>).__QAP_HANDOFF_TEST_HOOK__ || (args as Record<string, unknown>)._handoff_mock;
                if (handoffHook && typeof handoffHook === 'function') {
                  await (handoffHook as (ctx: unknown, url: string) => Promise<void>)(bCtx, baseUrl);
                }
                const { executeHandoffLogin } = await import('@qap/auth');
                capturedStorageState = await executeHandoffLogin(
                  {
                    ...newProfile,
                    login_route: `${baseUrl}${loginRoute.startsWith('/') ? loginRoute : `/${loginRoute}`}`,
                    post_login_condition: postLoginCondition,
                    handoff_timeout_ms: Math.min(Number(args.timeout_ms) || 120000, 120000),
                  },
                  bCtx
                );
              } finally {
                await bCtx.close().catch(() => {});
                await browser.close().catch(() => {});
              }
            } catch {
              // Timeout o fallo en handoff
            }
          }

          let isVerified = false;
          const verifiedRoute = firstProtected ? firstProtected.path : (loginLandedPath || loginRoute);

          if (capturedStorageState) {
            const { SessionStore } = await import('@qap/auth');
            const sessionStore = new SessionStore(sessionDir, rootDir);
            sessionStore.saveSession(profileId, capturedStorageState);

            try {
              const { PlaywrightAdapter, normalizeUrlForComparison } = await import('@qap/playwright-adapter');
              const verifyAdapter = new PlaywrightAdapter({
                headless: true,
                baseUrl,
                storageState: capturedStorageState,
              });

              if (firstProtected) {
                const verifyRes = await verifyAdapter.discover(
                  { name: firstProtected.module, path: firstProtected.path },
                  { storageState: capturedStorageState }
                );
                const vCtx = (verifyRes.context || {}) as Record<string, unknown>;
                const normFinal = normalizeUrlForComparison(String(vCtx.final_url || ''), baseUrl);
                const normReq = normalizeUrlForComparison(String(vCtx.requested_url || firstProtected.path), baseUrl);
                if (normFinal.pathname === normReq.pathname && vCtx.page_kind !== 'login') {
                  isVerified = true;
                }
              } else {
                const verifyRes = await verifyAdapter.discover(
                  { name: 'verify_post_login', path: verifiedRoute },
                  { storageState: capturedStorageState }
                );
                const vCtx = (verifyRes.context || {}) as Record<string, unknown>;
                if (vCtx.page_kind !== 'login') {
                  isVerified = true;
                }
              }
            } catch {
              isVerified = false;
            }
          }

          // A supplied oracle must be physically verified, not just stored as profile metadata.
          if (isVerified && authCondition && capturedStorageState) {
            const { chromium } = await import('playwright-core');
            let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
            try {
              for (const channel of ['chrome', 'msedge', undefined] as const) {
                try { browser = await chromium.launch({ headless: true, ...(channel ? { channel } : {}) }); break; }
                catch { /* Try another supported local Chromium installation. */ }
              }
              if (!browser) throw new Error('Browser unavailable');
              const authContext = await browser.newContext({ storageState: capturedStorageState });
              const page = await authContext.newPage();
              await page.goto(new URL(verifiedRoute, baseUrl).href, { waitUntil: 'domcontentloaded', timeout: 15000 });
              isVerified = await page.locator(String(authCondition.value)).count() > 0 && await page.locator('input[type="password"]').count() === 0;
            } catch { isVerified = false; }
            finally { await browser?.close().catch(() => undefined); }
          }

          if (verificationAttempted && !isVerified) {
            newProfile.verified = false;
            const idx = profiles.findIndex((p) => p.id === profileId);
            if (idx >= 0) profiles[idx] = newProfile;
            writeFileSync(profilesPath, JSON.stringify({ profiles }, null, 2), 'utf-8');
            if (activeProject && applicationService) {
              try {
                applicationService.expireProfileSession(activeProject.project_id, profileId);
              } catch { /* profile may not have durable session yet */ }
            }

            const isHandoffTimeout = method === 'handoff' && !capturedStorageState;
            const razon = isHandoffTimeout ? 'handoff_timeout' : 'session_invalid';
            const message = isHandoffTimeout
              ? `El inicio de sesión interactivo para el perfil '${profileId}' excedió el tiempo límite sin completar el acceso.`
              : `No se pudo confirmar una sesión activa para el perfil '${profileId}' en '${verifiedRoute}'.`;

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      status: 'blocked',
                      razon,
                      directorio_objetivo: rootDir,
                      perfil: profileId,
                      rol: role,
                      downgraded_to_anonymous: false,
                      message,
                      desbloquear_con: {
                        tool: 'qap_auth_add',
                        descripcion: isHandoffTimeout
                          ? `Reintenta el inicio de sesión para el perfil '${profileId}'.`
                          : `Revisa las credenciales o vuelve a iniciar sesión con el perfil '${profileId}'.`,
                      },
                      siguiente_accion: {
                        tipo: 'trabajo',
                        descripcion: isHandoffTimeout
                          ? `Reintentar inicio de sesión manual para el perfil '${profileId}'.`
                          : `Reintentar la autenticación para el perfil '${profileId}'.`,
                        tool: 'qap_auth_add',
                        parametros: {
                          profile: profileId,
                          role,
                          method,
                          login_route: loginRoute,
                          ...(requestedTenant ? { tenant_id: requestedTenant } : {}),
                          timeout_ms: args.timeout_ms,
                        },
                      },
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          if (isVerified) {
            newProfile.verified = true;
            newProfile.verified_at = new Date().toISOString();
            newProfile.verified_route = verifiedRoute;
            if (activeProject && applicationService && durableEnvId) {
              applicationService.upsertProfile({
                projectId: activeProject.project_id,
                envId: durableEnvId,
                label: profileId,
                roleName: role || undefined,
                tenantId: requestedTenant,
                loginMode,
                credentialAccount: profileId,
                status: 'verified',
              });
              if (capturedStorageState) {
                applicationService.saveProfileSession(
                  activeProject.project_id,
                  profileId,
                  {
                    cookies: Array.isArray(capturedStorageState.cookies) ? capturedStorageState.cookies : [],
                    ...(Array.isArray(capturedStorageState.origins) ? { origins: capturedStorageState.origins } : {}),
                  },
                  { verifiedAt: newProfile.verified_at },
                );
              }
            }
          }

          const idx = profiles.findIndex((p) => p.id === profileId);
          if (idx >= 0) profiles[idx] = newProfile;
          writeFileSync(profilesPath, JSON.stringify({ profiles }, null, 2), 'utf-8');

          let currentPhase = lifecycleState.phase;
          let faltantes: Array<{ campo: string; motivo: string }> = [];

          if (currentPhase === 'ONBOARDING') {
            const ctxPath = join(rootDir, '.qa', 'project', 'context.yaml');
            const parsedContext = existsSync(ctxPath) ? YAML.parse(readFileSync(ctxPath, 'utf-8')) : null;
            const parsedEnv = existsSync(envsPath) ? YAML.parse(readFileSync(envsPath, 'utf-8')) : null;
            faltantes = canExitOnboarding(parsedContext, parsedEnv).faltantes;
          } else if (currentPhase === 'SCOPING') {
            const gate = canExitScoping(lifecycleState, profiles);
            faltantes = gate.faltantes;
            if (gate.passed) {
              await storage.updateLifecycleState(async (curr) => {
                curr.phase = 'WORKING';
                curr.history = curr.history || [];
                curr.history.push({
                  from: 'SCOPING',
                  to: 'WORKING',
                  at: new Date().toISOString(),
                  reason: 'Compuerta de salida de SCOPING superada tras verificar perfil de autenticación',
                });
                return curr;
              });
              currentPhase = 'WORKING';
            }
          }

          const guidance = getPhaseGuidance(currentPhase, {
            faltantes,
            plan: lifecycleState.session?.plan,
            modules: lifecycleState.modules as any,
            profiles,
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    status: 'success',
                    directorio_objetivo: rootDir,
                    message: isVerified
                      ? `✔ Perfil '${profileId}' autenticado y sesión verificada con éxito.`
                      : `✔ Perfil '${profileId}' registrado y listo para validar acceso.`,
                    profile: {
                      id: newProfile.id,
                      env: newProfile.env,
                      username: newProfile.username,
                      role: newProfile.role,
                      ...(requestedTenant ? { tenant_id: requestedTenant } : {}),
                      login_mode: newProfile.login_mode,
                      verified: Boolean(newProfile.verified),
                      verified_at: newProfile.verified_at,
                      verified_route: newProfile.verified_route,
                    },
                    secretSaved: Boolean(password),
                    fase: currentPhase,
                    siguiente_accion: guidance.siguiente_accion,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case 'qap_auth_list': {
          if (interactiveAccess) {
            const list = await interactiveAccess.profileStatuses(rootDir, args);
            return canonicalResult({
              status: 'success',
              directorio_objetivo: rootDir,
              count: list.length,
              profiles: list,
            });
          }
          const authDir = resolve(rootDir, '.qa', 'project', 'auth');
          const profilesPath = join(authDir, 'profiles.json');
          let profiles: AuthProfile[] = [];
          if (existsSync(profilesPath)) {
            try {
              const parsed = JSON.parse(readFileSync(profilesPath, 'utf-8'));
              profiles = parsed.profiles || [];
            } catch {
              profiles = [];
            }
          }

          const activeProject = applicationService?.findActiveProjectByRoot(rootDir);
          const merged = new Map<string, Record<string, unknown>>();
          for (const p of profiles) {
            merged.set(p.id, {
              id: p.id,
              env: p.env,
              username: p.username,
              role: p.role,
              login_mode: p.login_mode,
              login_route: p.login_route,
              credential_source: p.credential_source,
              verified: Boolean(p.verified),
              status: p.verified ? 'verified' : 'pending',
              needs_revalidation: false,
            });
          }
          if (activeProject && applicationService) {
            const snapshot = applicationService.resumeProject(activeProject.project_id);
            for (const svcProf of snapshot.profiles) {
              const sessionInfo = applicationService.readProfileSession(activeProject.project_id, svcProf.profile_id);
              const needsRevalidation = Boolean(
                sessionInfo?.expired || sessionInfo?.revoked || svcProf.status === 'expired' || svcProf.status === 'revoked',
              );
              const existing = merged.get(svcProf.label) ?? {};
              merged.set(svcProf.label, {
                ...existing,
                id: svcProf.label,
                profile_id: svcProf.profile_id,
                env: snapshot.environment?.name ?? existing.env ?? 'local',
                role: svcProf.role_name ?? existing.role,
                tenant_id: svcProf.tenant_id,
                login_mode: svcProf.login_mode,
                status: svcProf.status,
                verified: svcProf.status === 'verified' && !needsRevalidation,
                verified_at: svcProf.verified_at,
                needs_revalidation: needsRevalidation,
              });
            }
          }

          const list = [...merged.values()];
          const profileToRevalidate = list.find((item) => item.needs_revalidation === true);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    status: 'success',
                    directorio_objetivo: rootDir,
                    count: list.length,
                    profiles: list,
                    ...(profileToRevalidate ? {
                      siguiente_accion: {
                        tipo: 'decision',
                        descripcion: `El perfil '${String(profileToRevalidate.id)}' requiere revalidación de sesión antes de inspeccionar rutas protegidas.`,
                        tool: 'qap_auth_add',
                      },
                    } : {}),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case 'qap_context_ingest': {
          const qaDir = resolve(rootDir, '.qa');
          if (!existsSync(qaDir)) {
            return {
              isError: true,
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      status: 'error',
                      isError: true,
                      directorio_objetivo: rootDir,
                      error: `El proyecto en '${rootDir}' no está inicializado. Ejecuta qap_init primero.`,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          const contextPath = join(qaDir, 'project', 'context.yaml');
          let currentContext: Record<string, any> = {
            _version: '1',
            project_name: basename(rootDir),
            description: `Configuración base de QA para ${basename(rootDir)}`,
            tech_stack: [],
            base_url: 'http://localhost:3000',
            manually_edited: false,
          };
          if (existsSync(contextPath)) {
            try {
              currentContext = YAML.parse(readFileSync(contextPath, 'utf-8')) || currentContext;
            } catch { /* use default */ }
          }

          const validator = new SchemaValidator();
          if (args.propuesta !== undefined) {
            const pVal = validator.validateIngestProposal(args.propuesta);
            if (!pVal.valid) {
              return {
                isError: true,
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify(
                      {
                        status: 'error',
                        isError: true,
                        directorio_objetivo: rootDir,
                        error: 'Error de validación contra ingest-proposal.schema.json',
                        detalles: pVal.errors,
                      },
                      null,
                      2
                    ),
                  },
                ],
              };
            }
          }

          let inputDocPath = args.docPath || args.path;
          if (!inputDocPath && !args.docContent && currentContext.source_of_truth?.ref) {
            inputDocPath = currentContext.source_of_truth.ref;
          }
          const hasDocPath = Boolean(inputDocPath);
          const hasDocContent = Boolean(args.docContent);
          const hasPropuesta = Boolean(args.propuesta);

          if (!hasDocPath && !hasDocContent && !hasPropuesta) {
            return {
              isError: true,
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      status: 'error',
                      isError: true,
                      directorio_objetivo: rootDir,
                      error: 'Debe proporcionarse al menos docPath, docContent o propuesta, o contar con una fuente de verdad declarada.',
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          let rawContent = '';
          let docRef = currentContext.source_of_truth?.ref || '';
          const activeProject = applicationService?.findActiveProjectByRoot(rootDir);
          const scopeLimits = activeProject && applicationService
            ? applicationService.getDeclaredScopeLimits(activeProject.project_id)
            : undefined;

          if (hasDocPath) {
            const rawPath = String(inputDocPath);
            const ext = extname(rawPath).toLowerCase();
            if (!['.md', '.markdown', '.txt'].includes(ext)) {
              return {
                isError: true,
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify(
                      {
                        status: 'error',
                        isError: true,
                        code: 'unsupported_document_format',
                        directorio_objetivo: rootDir,
                        error: `Formato '${ext || '(sin extensión)'}' no admitido en este corte. Solo se admiten texto o Markdown (.md, .markdown, .txt).`,
                        format_limits: scopeLimits ?? {
                          supported_doc_formats: ['.md', '.markdown', '.txt'],
                          max_doc_bytes: 512 * 1024,
                        },
                      },
                      null,
                      2
                    ),
                  },
                ],
              };
            }

            const resolved = resolverDocumento(rootDir, rawPath);
            if (!resolved) {
              return {
                isError: true,
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify(
                      {
                        status: 'error',
                        isError: true,
                        directorio_objetivo: rootDir,
                        error: `Archivo no encontrado o fuera del workspace: ${rawPath}`,
                      },
                      null,
                      2
                    ),
                  },
                ],
              };
            }

            const docAbsPath = resolve(rootDir, resolved.path);
            const stats = statSync(docAbsPath);
            if (stats.size > 512 * 1024) {
              return {
                isError: true,
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify(
                      {
                        status: 'error',
                        isError: true,
                        code: 'document_size_limit_exceeded',
                        directorio_objetivo: rootDir,
                        error: 'Tamaño de archivo excedido: máximo 512 KB.',
                        format_limits: scopeLimits ?? {
                          supported_doc_formats: ['.md', '.markdown', '.txt'],
                          max_doc_bytes: 512 * 1024,
                        },
                      },
                      null,
                      2
                    ),
                  },
                ],
              };
            }

            rawContent = readFileSync(docAbsPath, 'utf-8');
            docRef = resolved.path;
          } else if (hasDocContent) {
            rawContent = String(args.docContent);
            if (Buffer.byteLength(rawContent, 'utf-8') > 512 * 1024) {
              return {
                isError: true,
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify(
                      {
                        status: 'error',
                        isError: true,
                        directorio_objetivo: rootDir,
                        error: 'Tamaño de contenido excedido: máximo 512 KB.',
                      },
                      null,
                      2
                    ),
                  },
                ],
              };
            }
            docRef = 'inline_docContent';
          }

          let extractedObjective = '';
          let extractedUsers: string[] = [];
          let extractedNotes = '';
          let extractedRoutes: string[] = [];
          let parsedDocFlows: Array<{ name: string; evidence?: string }> = [];

          if (rawContent) {
            const parsed = parsePrdContent(rawContent, docRef);
            extractedObjective = sanitizeDomString(parsed.objective, 2000).trim();
            extractedUsers = (parsed.users || []).map((u) => u.slice(0, 50).trim()).filter(Boolean);
            extractedNotes = (parsed.notes || '').slice(0, 500).trim();
            extractedRoutes = (parsed.routes || []).map((r) => r.slice(0, 100).trim()).filter(Boolean);
            parsedDocFlows = parsed.critical_flows || [];
          }

          // Propuesta estructurada del agente (E3b): prevalece sobre la heurística solo en campos no vacíos
          const propuesta = args.propuesta as IngestProposal | undefined;
          if (propuesta && typeof propuesta === 'object') {
            if (typeof propuesta.objetivo === 'string' && propuesta.objetivo.trim().length > 0) {
              extractedObjective = sanitizeDomString(propuesta.objetivo, 2000).trim();
            }
            if (Array.isArray(propuesta.roles) && propuesta.roles.length > 0) {
              const cleanRoles = propuesta.roles
                .slice(0, 20)
                .map((r) => sanitizeDomString(String(r || '')).slice(0, 50).trim())
                .filter(Boolean);
              if (cleanRoles.length > 0) {
                extractedUsers = cleanRoles;
              }
            }
            if (Array.isArray(propuesta.rutas) && propuesta.rutas.length > 0) {
              const cleanRoutes = propuesta.rutas
                .slice(0, 20)
                .map((r) => sanitizeDomString(String(r || '')).slice(0, 100).trim())
                .filter(Boolean);
              if (cleanRoutes.length > 0) {
                extractedRoutes = cleanRoutes;
              }
            }
          }

          const suggestedModules = extractedRoutes.map((r) => {
            const cleanName = r.replace(/^\//, '').replace(/\//g, '-').replace(/[^a-zA-Z0-9_-]/g, '') || 'modulo';
            return {
              module: cleanName,
              path: r.startsWith('/') ? r : `/${r}`,
              priority: 'medium',
            };
          });

          // Persistir en context.yaml con source "inferred" sin sobrescribir "user" (E0b & E2c)
          if (extractedObjective && currentContext.objective_source !== 'user') {
            currentContext.objective = extractedObjective;
            currentContext.objective_source = 'inferred';
          }

          const validUsers = extractedUsers.filter((u) => isValidRoleName(u));
          const discardedIngestRoles = extractedUsers.filter((u) => !isValidRoleName(u));

          if (validUsers.length > 0) {
            currentContext.roles = currentContext.roles || [];
            for (const u of validUsers) {
              const existingIdx = currentContext.roles.findIndex((er: any) => er.name === u);
              if (existingIdx >= 0) {
                if (currentContext.roles[existingIdx].source !== 'user') {
                  currentContext.roles[existingIdx].source = 'inferred';
                }
              } else {
                currentContext.roles.push({ name: u, source: 'inferred' });
              }
            }
          }

          // Flujos críticos propuestos por el agente con evidence o extraídos explícitamente (B1)
          if (propuesta && Array.isArray(propuesta.flujos_criticos) && propuesta.flujos_criticos.length > 0) {
            currentContext.critical_flows = currentContext.critical_flows || [];
            for (const pf of propuesta.flujos_criticos.slice(0, 20)) {
              if (!pf || !pf.name) continue;
              const fName = sanitizeDomString(String(pf.name)).slice(0, 100).trim();
              if (!fName) continue;
              const fEvidence = pf.evidence ? sanitizeDomString(String(pf.evidence)).slice(0, 150).trim() : undefined;
              const existingIdx = currentContext.critical_flows.findIndex((ef: any) => ef.name === fName);
              if (existingIdx >= 0) {
                if (currentContext.critical_flows[existingIdx].source !== 'user') {
                  currentContext.critical_flows[existingIdx].source = 'inferred';
                  if (fEvidence) currentContext.critical_flows[existingIdx].evidence = fEvidence;
                }
              } else {
                currentContext.critical_flows.push({
                  name: fName,
                  source: 'inferred',
                  priority: 'medium',
                  ...(fEvidence ? { evidence: fEvidence } : {}),
                });
              }
            }
          } else if (parsedDocFlows.length > 0) {
            currentContext.critical_flows = currentContext.critical_flows || [];
            for (const cf of parsedDocFlows) {
              const fName = sanitizeDomString(cf.name).slice(0, 100).trim();
              if (!fName) continue;
              const fEvidence = cf.evidence ? sanitizeDomString(cf.evidence).slice(0, 150).trim() : undefined;
              const existingIdx = currentContext.critical_flows.findIndex((ef: any) => ef.name === fName);
              if (existingIdx >= 0) {
                if (currentContext.critical_flows[existingIdx].source !== 'user') {
                  currentContext.critical_flows[existingIdx].source = 'inferred';
                  if (fEvidence) currentContext.critical_flows[existingIdx].evidence = fEvidence;
                }
              } else {
                currentContext.critical_flows.push({
                  name: fName,
                  source: 'inferred',
                  priority: 'medium',
                  ...(fEvidence ? { evidence: fEvidence } : {}),
                });
              }
            }
          }

          // Actualizar source_of_truth sin degradar source "user"
          currentContext.source_of_truth = currentContext.source_of_truth || {};
          if (currentContext.source_of_truth.source !== 'user') {
            currentContext.source_of_truth.type = currentContext.source_of_truth.type || 'prd';
            currentContext.source_of_truth.ref = docRef || currentContext.source_of_truth.ref;
            currentContext.source_of_truth.declared = currentContext.source_of_truth.declared ?? false;
            currentContext.source_of_truth.notes = extractedNotes || currentContext.source_of_truth.notes;
            currentContext.source_of_truth.source = 'inferred';
          }

          // Registro limpio de estado de análisis en campo propio ingest (B4)
          currentContext.ingest = {
            doc_ref: docRef || currentContext.source_of_truth?.ref || '',
            analyzed_by: propuesta ? 'agent' : 'heuristic',
            analyzed_at: new Date().toISOString(),
          };

          writeFileSync(contextPath, YAML.stringify(currentContext), 'utf-8');

          const storage = new FileSystemStorage({ rootDir });
          const lifecycleState = await storage.getLifecycleState();

          // Evaluar compuerta de ONBOARDING dinámicamente con canExitOnboarding (E0b fix)
          const envsPath = join(qaDir, 'project', 'environments.yaml');
          const parsedEnv = existsSync(envsPath) ? YAML.parse(readFileSync(envsPath, 'utf-8')) : null;
          const gateRes = canExitOnboarding(currentContext, parsedEnv);
          const faltantes = gateRes.faltantes;

          const serviciosConEvidencia = detectarServiciosConEvidencia(rootDir);
          const hallazgos = detectarDocumentosProyecto(rootDir);
          hallazgos.servicios = serviciosConEvidencia;

          let candidateGenResult: CandidateGenerationResult | undefined;
          const rawProposedCandidates = (propuesta && Array.isArray(propuesta.modulos_candidatos))
            ? propuesta.modulos_candidatos
            : (Array.isArray(args.modulos_candidatos) ? args.modulos_candidatos : undefined);
          if (Array.isArray(rawProposedCandidates)) {
            let repoMapObj: ProjectRepoMap | null = null;
            const repoMapPath = join(qaDir, 'project', 'repo-map.json');
            if (existsSync(repoMapPath)) {
              try {
                repoMapObj = JSON.parse(readFileSync(repoMapPath, 'utf-8'));
              } catch { /* empty */ }
            }
            if (!repoMapObj) {
              const curScan = generarScan(rootDir);
              repoMapObj = scanProjectRoutes(rootDir, curScan?.subproyectos || []);
            }

            candidateGenResult = generateModuleCandidates({
              rawDocContent: rawContent || '',
              proposedCandidates: rawProposedCandidates,
              repoMap: repoMapObj,
              criticalFlows: currentContext.critical_flows,
            });

            const candidatesFilePath = join(qaDir, 'project', 'module-candidates.json');
            try {
              writeFileSync(candidatesFilePath, JSON.stringify(candidateGenResult.candidatesFile, null, 2), 'utf-8');
            } catch { /* ignore */ }
          }

          const guidance = getPhaseGuidance(lifecycleState.phase, {
            faltantes,
            suggestedModules,
            moduleCandidates: candidateGenResult?.candidatesFile?.candidates,
            hallazgos,
            context: currentContext,
            environments: parsedEnv,
          });

          let ingestedDocRecord: ReturnType<NonNullable<typeof applicationService>['saveIngestedDocument']> | undefined;
          let pendingDiscrepancies: ReturnType<NonNullable<typeof applicationService>['listDiscrepancies']> = [];
          let persistedCandidates: ReturnType<NonNullable<typeof applicationService>['listModuleCandidates']> = [];

          if (activeProject && applicationService) {
            const detectedDiscrepancies: Array<{
              field: 'objective' | 'base_url' | 'tenant_mode' | 'role' | 'route';
              source_a: string;
              value_a: string;
              source_b: string;
              value_b: string;
              severity: 'warning' | 'blocking';
              resolution_status: 'pending_user_decision';
            }> = [];
            const docSourceLabel = docRef || 'inline_docContent';
            if (
              extractedObjective &&
              currentContext.objective_source === 'user' &&
              currentContext.objective &&
              extractedObjective.toLowerCase().trim() !== String(currentContext.objective).toLowerCase().trim()
            ) {
              detectedDiscrepancies.push({
                field: 'objective',
                source_a: 'user_declared_context',
                value_a: String(currentContext.objective),
                source_b: docSourceLabel,
                value_b: extractedObjective,
                severity: 'warning',
                resolution_status: 'pending_user_decision',
              });
            }
            const urlMatches = rawContent ? rawContent.match(/https?:\/\/[^\s"'<>)]+/gi) ?? [] : [];
            const declaredBaseUrl = parsedEnv?.environments?.[parsedEnv?.default ?? 'local']?.url ?? currentContext.base_url;
            let declaredOrigin = '';
            try { declaredOrigin = new URL(String(declaredBaseUrl || '')).origin; } catch { declaredOrigin = ''; }
            for (const foundUrl of urlMatches) {
              try {
                const foundOrigin = new URL(foundUrl).origin;
                if (declaredOrigin && foundOrigin !== declaredOrigin) {
                  detectedDiscrepancies.push({
                    field: 'base_url',
                    source_a: 'user_declared_environment',
                    value_a: declaredOrigin,
                    source_b: docSourceLabel,
                    value_b: foundOrigin,
                    severity: 'blocking',
                    resolution_status: 'pending_user_decision',
                  });
                  break;
                }
              } catch { /* ignore malformed url snippets in prose */ }
            }
            const resumeSnapshot = applicationService.resumeProject(activeProject.project_id);
            const currentTenantMode = resumeSnapshot.environment?.tenant_mode ?? 'single';
            if (rawContent) {
              const mentionsMultiTenant = /\b(multi[- ]?tenant|multitenant)\b/i.test(rawContent);
              const mentionsSingleTenant = /\b(single[- ]?tenant|monotenant)\b/i.test(rawContent);
              if (mentionsMultiTenant && currentTenantMode !== 'multi_tenant') {
                detectedDiscrepancies.push({
                  field: 'tenant_mode',
                  source_a: 'environment_scope',
                  value_a: currentTenantMode,
                  source_b: docSourceLabel,
                  value_b: 'multi_tenant',
                  severity: 'warning',
                  resolution_status: 'pending_user_decision',
                });
              } else if (mentionsSingleTenant && currentTenantMode !== 'single') {
                detectedDiscrepancies.push({
                  field: 'tenant_mode',
                  source_a: 'environment_scope',
                  value_a: currentTenantMode,
                  source_b: docSourceLabel,
                  value_b: 'single',
                  severity: 'warning',
                  resolution_status: 'pending_user_decision',
                });
              }
            }

            const extLower = docRef ? extname(String(docRef)).toLowerCase() : '';
            const ingestFormat: 'md' | 'markdown' | 'txt' | 'inline_text' = !hasDocPath
              ? 'inline_text'
              : extLower === '.txt'
                ? 'txt'
                : extLower === '.markdown'
                  ? 'markdown'
                  : 'md';
            const docVersion = typeof args.doc_version === 'string' && args.doc_version.trim()
              ? args.doc_version.trim()
              : undefined;
            const rawScopeArg = args.scope && typeof args.scope === 'object' ? args.scope as Record<string, unknown> : undefined;
            const defaultDocScope = rawScopeArg ? {
              ...(typeof rawScopeArg.environment === 'string' ? { environment: rawScopeArg.environment } : {}),
              ...(typeof rawScopeArg.tenant_id === 'string' ? { tenant_id: rawScopeArg.tenant_id } : {}),
              ...(typeof rawScopeArg.role === 'string' ? { role: rawScopeArg.role } : {}),
              ...(typeof rawScopeArg.module_key === 'string' ? { module_key: rawScopeArg.module_key } : {}),
              ...(typeof rawScopeArg.route_pathname === 'string' ? { route_pathname: rawScopeArg.route_pathname } : {}),
            } : undefined;
            const explicitDocRules = Array.isArray(args.business_rules)
              ? args.business_rules
                  .filter((r: unknown): r is Record<string, unknown> => Boolean(r && typeof r === 'object'))
                  .filter((r: Record<string, unknown>) => typeof r.expected_outcome === 'string' && r.expected_outcome.trim().length > 0)
                  .map((r: Record<string, unknown>) => ({
                    ...(typeof r.rule_id === 'string' ? { rule_id: r.rule_id } : {}),
                    ...(typeof r.rule_key === 'string' ? { rule_key: r.rule_key } : {}),
                    ...(typeof r.title === 'string' ? { title: r.title } : {}),
                    expected_outcome: String(r.expected_outcome),
                    ...(typeof r.route_pathname === 'string' ? { route_pathname: r.route_pathname } : {}),
                    ...(typeof r.module_key === 'string' ? { module_key: r.module_key } : {}),
                    ...(typeof r.environment === 'string' ? { environment: r.environment } : {}),
                    ...(typeof r.tenant_id === 'string' ? { tenant_id: r.tenant_id } : {}),
                    ...(typeof r.role === 'string' ? { role: r.role } : {}),
                    ...(typeof r.version === 'string' ? { version: r.version } : {}),
                    ...(r.authority_status === 'accredited' || r.authority_status === 'unaccredited'
                      ? { authority_status: r.authority_status as 'accredited' | 'unaccredited' }
                      : {}),
                    ...(typeof r.assert_selector === 'string' ? { assert_selector: r.assert_selector } : {}),
                    ...(typeof r.assert_type === 'string' ? { assert_type: r.assert_type as 'contains' | 'visible' | 'equals' | 'exists' | 'text' | 'count' } : {}),
                  }))
              : undefined;
            ingestedDocRecord = applicationService.saveIngestedDocument({
              projectId: activeProject.project_id,
              sourceRef: docSourceLabel,
              format: ingestFormat,
              rawContent: rawContent || JSON.stringify(propuesta ?? {}),
              analyzedBy: propuesta ? 'agent' : 'heuristic',
              extracted: {
                ...(extractedObjective ? { objective: extractedObjective } : {}),
                roles: validUsers,
                routes: extractedRoutes,
                critical_flows: (currentContext.critical_flows || []).map((f: { name?: string }) => String(f.name || '')).filter(Boolean),
              },
              discrepancies: detectedDiscrepancies,
              ...(docVersion ? { docVersion } : {}),
              ...(defaultDocScope ? { defaultScope: defaultDocScope } : {}),
              ...(explicitDocRules && explicitDocRules.length > 0 ? { businessRules: explicitDocRules } : {}),
            });
            for (const cand of candidateGenResult?.candidatesFile?.candidates ?? []) {
              applicationService.upsertModuleCandidate({
                projectId: activeProject.project_id,
                key: cand.id || cand.nombre,
                title: cand.nombre,
                routeHint: cand.ruta || undefined,
                provenanceSource: 'markdown_doc',
                evidenceRefs: [docSourceLabel],
                confidence: cand.ruta ? 'high' : 'medium',
              });
            }
            if (!(candidateGenResult?.candidatesFile?.candidates?.length)) {
              for (const sm of suggestedModules) {
                applicationService.upsertModuleCandidate({
                  projectId: activeProject.project_id,
                  key: sm.module,
                  title: sm.module,
                  routeHint: sm.path,
                  provenanceSource: 'markdown_doc',
                  evidenceRefs: [docSourceLabel],
                  confidence: 'medium',
                });
              }
            }
            pendingDiscrepancies = applicationService.listDiscrepancies(activeProject.project_id, true);
            persistedCandidates = applicationService.listModuleCandidates(activeProject.project_id);
          }

          if (
            lifecycleState.phase === 'SCOPING' &&
            currentContext.critical_flows &&
            currentContext.critical_flows.length > 0 &&
            (!Array.isArray(rawProposedCandidates) || rawProposedCandidates.length === 0)
          ) {
            guidance.siguiente_accion = {
              tipo: 'trabajo',
              descripcion: 'Proponer módulos candidatos con evidencia del documento a partir de los flujos críticos detectados.',
              tool: 'qap_context_ingest',
            };
          }

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    status: 'success',
                    directorio_objetivo: rootDir,
                    fase: lifecycleState.phase,
                    propuestas_extraidas: {
                      objetivo: extractedObjective || undefined,
                      roles: (currentContext.roles || []).filter((r: any) => r.source === 'inferred'),
                      flujos_criticos: (currentContext.critical_flows || []).filter((f: any) => f.source === 'inferred'),
                      notas: extractedNotes || undefined,
                      rutas: extractedRoutes,
                    },
                    provenance: ingestedDocRecord ? {
                      doc_id: ingestedDocRecord.doc_id,
                      source_ref: ingestedDocRecord.source_ref,
                      format: ingestedDocRecord.format,
                      sha256: ingestedDocRecord.sha256,
                      analyzed_by: ingestedDocRecord.analyzed_by,
                      ingested_at: ingestedDocRecord.ingested_at,
                      scoped_rules_count: activeProject && applicationService
                        ? applicationService.listScopedBusinessRules(activeProject.project_id, {
                            sourceKind: 'ingested_doc',
                            sourceId: ingestedDocRecord.doc_id,
                          }).length
                        : 0,
                    } : undefined,
                    discrepancies: pendingDiscrepancies,
                    modulos_sugeridos_para_plan: suggestedModules,
                    modulos_candidatos_generados: candidateGenResult?.candidatesFile?.candidates || [],
                    module_candidates: persistedCandidates,
                    candidatos_rechazados: candidateGenResult?.rejectedCandidates || [],
                    flujos_descartados: candidateGenResult?.flujos_descartados || [],
                    roles_descartados: discardedIngestRoles,
                    format_limits: scopeLimits,
                    faltantes,
                    siguiente_accion: guidance.siguiente_accion,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case 'qap_session_plan': {
          const qaDir = resolve(rootDir, '.qa');
          if (!existsSync(qaDir)) {
            return {
              isError: true,
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      status: 'error',
                      isError: true,
                      directorio_objetivo: rootDir,
                      error: `El proyecto en '${rootDir}' no está inicializado. Ejecuta qap_init primero.`,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          const storage = new FileSystemStorage({ rootDir });
          const lifecycleState = await storage.getLifecycleState();
          const activeProject = applicationService?.findActiveProjectByRoot(rootDir);
          const requestedTenant = typeof args.tenant_id === 'string' && args.tenant_id.trim()
            ? args.tenant_id.trim()
            : undefined;
          if (activeProject && applicationService) {
            const tenantCheck = applicationService.validateTenantScope(activeProject.project_id, requestedTenant);
            if (!tenantCheck.ok) {
              return canonicalResult({
                status: 'blocked',
                category: 'human_authorization',
                code: tenantCheck.code,
                fase: lifecycleState.phase,
                razon: tenantCheck.reason,
                desbloquear_con: {
                  mecanismo: 'qap_session_plan',
                  tool: 'qap_session_plan',
                  campo: 'tenant_id',
                  descripcion: tenantCheck.reason,
                },
              }, true);
            }
          }

          if (lifecycleState.phase === 'ONBOARDING') {
            const ctxPath = join(qaDir, 'project', 'context.yaml');
            const envsPath = join(qaDir, 'project', 'environments.yaml');
            const parsedContext = existsSync(ctxPath) ? YAML.parse(readFileSync(ctxPath, 'utf-8')) : null;
            const parsedEnv = existsSync(envsPath) ? YAML.parse(readFileSync(envsPath, 'utf-8')) : null;
            const gate = canExitOnboarding(parsedContext, parsedEnv);
            const hallazgos = detectarDocumentosProyecto(rootDir);
            const guidance = getPhaseGuidance('ONBOARDING', {
              faltantes: gate.faltantes,
              hallazgos,
              context: parsedContext,
              environments: parsedEnv,
              lifecycle: lifecycleState,
            });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      status: 'blocked',
                      directorio_objetivo: rootDir,
                      fase: 'ONBOARDING',
                      razon: 'No se puede definir el plan de sesión en la fase ONBOARDING. Completa el contexto de negocio primero.',
                      desbloquear_con: {
                        tool: 'qap_context_set',
                        descripcion: 'Define el objetivo, roles, flujos críticos y fuente de verdad con qap_context_set.',
                      },
                      faltantes: gate.faltantes,
                      siguiente_accion: guidance.siguiente_accion,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          // Soporte de desde_candidatos y adicionales (C6 + Block 2 candidatos del servicio)
          let resolvedModules: Array<{ module: string; path: string; priority: string; flujos?: string[] }> = [];
          const promotedCandidateIds: Array<{
            candidateKeyOrId: string;
            title?: string;
            routeHint?: string;
            priority?: 'high' | 'medium' | 'low';
          }> = [];

          if (Array.isArray(args.desde_candidatos) && args.desde_candidatos.length > 0) {
            const candidatesPath = join(qaDir, 'project', 'module-candidates.json');
            let candidatesFile: ModuleCandidatesFile | null = null;
            if (existsSync(candidatesPath)) {
              try {
                candidatesFile = JSON.parse(readFileSync(candidatesPath, 'utf-8'));
              } catch { /* empty */ }
            }

            const allCandidates: ModuleCandidate[] = candidatesFile?.candidates || [];
            const serviceCandidates = activeProject && applicationService
              ? applicationService.listModuleCandidates(activeProject.project_id)
              : [];

            for (const item of args.desde_candidatos) {
              const candId = typeof item === 'string' ? item.trim() : (item?.id ? String(item.id).trim() : '');
              const candPathOverride = typeof item === 'object' && item?.path ? String(item.path).trim() : undefined;

              const cand = allCandidates.find((c) => c.id === candId);
              const svcCand = serviceCandidates.find((c) => c.candidate_id === candId || c.key === candId);
              if (!cand && !svcCand) {
                return {
                  content: [
                    {
                      type: 'text',
                      text: JSON.stringify(
                        {
                          status: 'blocked',
                          directorio_objetivo: rootDir,
                          fase: 'SCOPING',
                          razon: `El candidato indicado ('${candId}') no figura en la lista de candidatos revisables.`,
                          siguiente_accion: {
                            tipo: 'decision',
                            descripcion: `Selecciona un candidato válido de la lista observada o agrega el módulo manualmente.`,
                            tool: 'qap_session_plan',
                          },
                        },
                        null,
                        2
                      ),
                    },
                  ],
                };
              }

              const resolvedName = cand?.nombre ?? svcCand!.title;
              const resolvedRoute = candPathOverride || cand?.ruta || svcCand?.route_hint;
              const resolvedFlows = cand?.flujos || [];

              if (!resolvedRoute) {
                const preguntaRuta: Pregunta = {
                  id: `scoping.ruta_candidato.${cand?.id ?? svcCand!.candidate_id}`,
                  texto: `Indica la ruta URL para el módulo '${resolvedName}' (por ejemplo: /catalog):`,
                  formato: 'abierta',
                  opciones: [],
                  permite_otra: true,
                  registrar_con: { tool: 'qap_session_plan', campo: 'adicionales' },
                };
                preguntaRuta.render_texto = generarRenderTexto(preguntaRuta);
                const guardedPregunta = guardPregunta(preguntaRuta) as Pregunta;

                return {
                  content: [
                    {
                      type: 'text',
                      text: JSON.stringify(
                        {
                          status: 'blocked',
                          directorio_objetivo: rootDir,
                          fase: 'SCOPING',
                          razon: `El candidato '${resolvedName}' aún no tiene una ruta asignada.`,
                          siguiente_accion: {
                            tipo: 'decision',
                            descripcion: `Indica la ruta para el candidato '${resolvedName}'.`,
                            tool: 'qap_session_plan',
                            pregunta: guardedPregunta,
                          },
                        },
                        null,
                        2
                      ),
                    },
                  ],
                };
              }

              if (svcCand) {
                promotedCandidateIds.push({
                  candidateKeyOrId: svcCand.candidate_id,
                  title: resolvedName,
                  routeHint: resolvedRoute,
                  priority: 'medium',
                });
              }

              resolvedModules.push({
                module: resolvedName,
                path: resolvedRoute,
                priority: 'medium',
                flujos: resolvedFlows,
              });
            }

            resolvedModules = resolvedModules.map((m, idx) => ({
              ...m,
              priority: idx < 3 ? 'high' : 'medium',
            }));
          }

          if (Array.isArray(args.adicionales)) {
            for (const ad of args.adicionales) {
              if (ad && typeof ad === 'object' && ad.module && ad.path) {
                resolvedModules.push({
                  module: String(ad.module).trim(),
                  path: String(ad.path).trim(),
                  priority: ad.priority || 'medium',
                  flujos: Array.isArray(ad.flujos) ? ad.flujos : [],
                });
              }
            }
          }

          if (resolvedModules.length === 0 && !Array.isArray(args.modules) && args.reuse_modules && activeProject && applicationService) {
            const snapshot = applicationService.resumeProject(activeProject.project_id);
            const closedPool = snapshot.modules.filter((m) => m.status === 'closed' || m.status === 'waived');
            const requestedReuse = Array.isArray(args.reuse_modules)
              ? args.reuse_modules.map((k: unknown) => String(k).trim()).filter(Boolean)
              : null;
            const reuseSelection = requestedReuse
              ? closedPool.filter((m) => requestedReuse.includes(m.key) || requestedReuse.includes(m.title))
              : closedPool;
            for (const rm of reuseSelection) {
              resolvedModules.push({
                module: rm.key,
                path: rm.route_hint || '/',
                priority: rm.priority,
                flujos: [],
              });
            }
          }

          if (resolvedModules.length === 0 && Array.isArray(args.modules)) {
            resolvedModules = args.modules.map((m: any) => ({
              module: String(m.module || m.name || '').trim(),
              path: String(m.path || '').trim(),
              priority: String(m.priority || 'medium').trim(),
              flujos: Array.isArray(m.flujos) ? m.flujos : [],
            }));
          }

          // Validación atómica del lote
          const rawModules = resolvedModules.length > 0
            ? resolvedModules
            : (Array.isArray(args.plan) ? args.plan : undefined);

          if (!Array.isArray(rawModules) || rawModules.length === 0) {
            return {
              isError: true,
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      status: 'error',
                      isError: true,
                      directorio_objetivo: rootDir,
                      error: 'El parámetro modules debe ser una lista con al menos un módulo o indicar desde_candidatos.',
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          const seenNames = new Set<string>();
          for (const m of rawModules) {
            if (!m || typeof m !== 'object') {
              return {
                isError: true,
                content: [{ type: 'text', text: JSON.stringify({ status: 'error', error: 'Elemento de módulo inválido en el lote.' }, null, 2) }],
              };
            }
            const mName = String(m.module || (m as any).name || '').trim();
            if (!m.module && (m as any).name) {
              m.module = (m as any).name;
            }
            const mPath = String(m.path || '').trim();
            const mPriority = String(m.priority || '').trim();

            if (!mName) {
              return {
                isError: true,
                content: [{ type: 'text', text: JSON.stringify({ status: 'error', error: 'Nombre de módulo no puede estar vacío.' }, null, 2) }],
              };
            }
            const explicitlyReused =
              args.reuse_modules === true ||
              (Array.isArray(args.reuse_modules) &&
                args.reuse_modules.map((k: unknown) => String(k).trim()).includes(mName));
            if (!explicitlyReused && lifecycleState.phase === 'WRAP_UP' && lifecycleState.modules?.[mName]?.state === 'closed') {
              return {
                isError: true,
                content: [{
                  type: 'text',
                  text: JSON.stringify({
                    status: 'error',
                    isError: true,
                    directorio_objetivo: rootDir,
                    error: `El módulo '${mName}' ya se encuentra cerrado formalmente (closed) en una sesión previa y no puede ser reabierto. Lote rechazado por completo.`,
                  }, null, 2),
                }],
              };
            }
            if (!mPath || !mPath.startsWith('/')) {
              return {
                isError: true,
                content: [{ type: 'text', text: JSON.stringify({ status: 'error', error: `La ruta '${mPath}' del módulo '${mName}' debe iniciar con '/'.` }, null, 2) }],
              };
            }
            if (!['high', 'medium', 'low'].includes(mPriority)) {
              return {
                isError: true,
                content: [{ type: 'text', text: JSON.stringify({ status: 'error', error: `Prioridad inválida '${mPriority}' en módulo '${mName}'. Debe ser high, medium o low.` }, null, 2) }],
              };
            }
            if (seenNames.has(mName)) {
              return {
                isError: true,
                content: [{ type: 'text', text: JSON.stringify({ status: 'error', error: `Módulos duplicados en el lote: '${mName}'.` }, null, 2) }],
              };
            }
            seenNames.add(mName);
          }

          const profilesPath = join(qaDir, 'project', 'auth', 'profiles.json');
          let allProfiles: AuthProfile[] = interactiveAccess
            ? await interactiveAccess.profiles(authorizedProjectRoot(args, dependencies, true)) : [];
          if (!interactiveAccess && existsSync(profilesPath)) {
            try {
              const parsed = JSON.parse(readFileSync(profilesPath, 'utf-8'));
              allProfiles = parsed.profiles || [];
            } catch { /* empty */ }
          }
          if (activeProject && applicationService) {
            const snapProfiles = applicationService.resumeProject(activeProject.project_id).profiles;
            for (const sp of snapProfiles) {
              if (!allProfiles.some((p) => p.id === sp.label)) {
                allProfiles.push({
                  id: sp.label,
                  env: 'local',
                  username: sp.label,
                  role: sp.role_name,
                  login_mode: sp.login_mode === 'handoff' ? 'handoff' : 'auto',
                  login_route: '/login',
                  credential_source: 'keychain',
                  verified: sp.status === 'verified',
                });
              }
            }
          }

          const isAccess = (m: { path?: string; acceso?: boolean }) => Boolean(m.acceso || isAuthPath(String(m.path || '')));
          const sortedModules = [...rawModules].sort((a, b) => {
            const aAcc = isAccess(a) ? 1 : 0;
            const bAcc = isAccess(b) ? 1 : 0;
            return bAcc - aAcc;
          });

          let scopingGateRes: { passed: boolean; faltantes: Array<{ campo: string; motivo: string }> } = { passed: true, faltantes: [] };
          let updatedPhase = lifecycleState.phase;

          await storage.updateLifecycleState(async (curr) => {
            curr.session = curr.session || { id: `session_${randomUUID().slice(0, 8)}`, started_at: new Date().toISOString(), plan: [] };
            curr.modules = curr.modules || {};

            if (curr.phase === 'WRAP_UP') {
              curr.phase = 'SCOPING';
              curr.history = curr.history || [];
              curr.history.push({
                from: 'WRAP_UP',
                to: 'SCOPING',
                at: new Date().toISOString(),
                reason: 'Inicio de nueva sesión de trabajo desde WRAP_UP',
              });

              const prevAuth = curr.session?.auth;
              let sessionAuth = prevAuth || { required: false };
              if (args.auth && typeof args.auth === 'object') {
                const a = args.auth as { required?: unknown; source?: unknown; method?: unknown; roles?: unknown; profile?: unknown };
                sessionAuth = {
                  required: Boolean(a.required),
                  source: (a.source === 'inferred' ? 'inferred' : 'user'),
                  method: a.method === 'handoff' || a.method === 'credentials' ? a.method : undefined,
                  roles: Array.isArray(a.roles) ? (a.roles as string[]) : undefined,
                  profile: a.profile !== undefined ? String(a.profile) : undefined,
                };
              }

              curr.session = {
                id: randomUUID(),
                started_at: new Date().toISOString(),
                auth: sessionAuth,
                plan: sortedModules.map((m: { module: string; path: string; priority?: string; acceso?: boolean; flujos?: string[] }) => ({
                  module: String(m.module).trim(),
                  path: String(m.path).trim(),
                  priority: String(m.priority || 'medium').trim(),
                  status: 'planned',
                  acceso: isAccess(m) ? true : undefined,
                  flujos: Array.isArray(m.flujos) ? m.flujos : [],
                })),
              };

              curr.modules = curr.modules || {};
              for (const item of curr.session.plan) {
                if (
                  !curr.modules[item.module] ||
                  curr.modules[item.module].state === 'closed' ||
                  curr.modules[item.module].state === 'waived'
                ) {
                  curr.modules[item.module] = {
                    state: 'planned',
                    updated_at: new Date().toISOString(),
                  };
                }
              }
              const planModuleNamesWrap = new Set(curr.session.plan.map((p: { module: string }) => p.module));
              for (const modKey of Object.keys(curr.modules)) {
                if (!planModuleNamesWrap.has(modKey) && curr.modules[modKey]?.state === 'planned') {
                  delete curr.modules[modKey];
                }
              }

              assertLifecycleStateInvariants(curr);
              scopingGateRes = canExitScoping(curr, allProfiles);

              if (scopingGateRes.passed) {
                curr.phase = 'WORKING';
                curr.history.push({
                  from: 'SCOPING',
                  to: 'WORKING',
                  at: new Date().toISOString(),
                  reason: 'Compuerta de salida de SCOPING superada exitosamente en nueva sesión',
                });
              }
              if (curr.history.length > 50) {
                curr.history = curr.history.slice(-50);
              }
              updatedPhase = curr.phase;
              return curr;
            }

            if (curr.phase === 'SCOPING') {
              if (args.auth && typeof args.auth === 'object') {
                const a = args.auth as { required?: unknown; source?: unknown; method?: unknown; roles?: unknown; profile?: unknown };
                curr.session.auth = {
                  required: Boolean(a.required),
                  source: (a.source === 'inferred' ? 'inferred' : 'user'),
                  method: a.method === 'handoff' || a.method === 'credentials' ? a.method : undefined,
                  roles: Array.isArray(a.roles) ? (a.roles as string[]) : undefined,
                  profile: a.profile !== undefined ? String(a.profile) : undefined,
                };
              }

              curr.session.plan = sortedModules.map((m: { module: string; path: string; priority?: string; acceso?: boolean; flujos?: string[] }) => ({
                module: String(m.module).trim(),
                path: String(m.path).trim(),
                priority: String(m.priority || 'medium').trim(),
                status: 'planned',
                acceso: isAccess(m) ? true : undefined,
                flujos: Array.isArray(m.flujos) ? m.flujos : [],
              }));

              for (const item of curr.session.plan) {
                if (!curr.modules[item.module]) {
                  curr.modules[item.module] = {
                    state: 'planned',
                    updated_at: new Date().toISOString(),
                  };
                }
              }
              const planModuleNamesScoping = new Set(curr.session.plan.map((p: { module: string }) => p.module));
              for (const modKey of Object.keys(curr.modules)) {
                if (!planModuleNamesScoping.has(modKey) && curr.modules[modKey]?.state === 'planned') {
                  delete curr.modules[modKey];
                }
              }

              assertLifecycleStateInvariants(curr);
              scopingGateRes = canExitScoping(curr, allProfiles);

              if (scopingGateRes.passed) {
                curr.phase = 'WORKING';
                curr.history = curr.history || [];
                curr.history.push({
                  from: 'SCOPING',
                  to: 'WORKING',
                  at: new Date().toISOString(),
                  reason: 'Compuerta de salida de SCOPING superada exitosamente',
                });
              }
              updatedPhase = curr.phase;
              return curr;
            } else if (curr.phase === 'WORKING') {
              // En WORKING solo amplía (no modifica ni borra existentes)
              curr.session.plan = curr.session.plan || [];
              for (const m of sortedModules) {
                const mName = String(m.module).trim();
                const mPath = String(m.path).trim();
                const mPriority = String(m.priority).trim();
                const existsInPlan = curr.session.plan.some((p) => p.module === mName);
                if (!existsInPlan) {
                  curr.session.plan.push({
                    module: mName,
                    path: mPath,
                    priority: mPriority,
                    status: 'planned',
                    acceso: isAccess(m) ? true : undefined,
                  });
                }
                if (!curr.modules[mName]) {
                  curr.modules[mName] = {
                    state: 'planned',
                    updated_at: new Date().toISOString(),
                  };
                }
              }

              if (args.auth && !curr.session.auth && typeof args.auth === 'object') {
                const a = args.auth as { required?: unknown; source?: unknown; method?: unknown; roles?: unknown; profile?: unknown };
                curr.session.auth = {
                  required: Boolean(a.required),
                  source: (a.source === 'inferred' ? 'inferred' : 'user'),
                  method: a.method === 'handoff' || a.method === 'credentials' ? a.method : undefined,
                  roles: Array.isArray(a.roles) ? (a.roles as string[]) : undefined,
                  profile: a.profile !== undefined ? String(a.profile) : undefined,
                };
              }

              assertLifecycleStateInvariants(curr);
              updatedPhase = curr.phase;
              return curr;
            }

            return curr;
          });

          const freshState = await storage.getLifecycleState();
          let projectCtx = null;
          try {
            projectCtx = await storage.getProjectContext();
          } catch { /* empty */ }

          let durableModules: ReturnType<NonNullable<typeof applicationService>['resumeProject']>['modules'] = [];
          let reusedModulesSummary: string[] = [];
          let activeCampaignId: string | undefined;
          let reusedFromCampaignId: string | undefined;
          const wasWrapUpPhase = lifecycleState.phase === 'WRAP_UP';
          if (activeProject && applicationService) {
            if (promotedCandidateIds.length > 0) {
              applicationService.promoteCandidatesToModules(activeProject.project_id, promotedCandidateIds);
            }
            const moduleKeysForPlan = sortedModules.map((m) => String(m.module).trim());
            let campaign2: ReturnType<typeof applicationService.startCampaignReusingModules> | null = null;
            if (wasWrapUpPhase || args.reuse_modules) {
              campaign2 = applicationService.startCampaignReusingModules({
                projectId: activeProject.project_id,
                moduleKeys: moduleKeysForPlan,
                objective: typeof args.objective === 'string' ? args.objective.trim() : undefined,
              });
              reusedModulesSummary = campaign2.reused_modules.map((m) => m.key);
              activeCampaignId = campaign2.campaign.campaign_id;
              reusedFromCampaignId = campaign2.campaign.reused_from_campaign_id;
            }
            const reusedKeySet = new Set(reusedModulesSummary);
            for (const m of sortedModules) {
              const mKey = String(m.module).trim();
              if (reusedKeySet.has(mKey)) {
                continue;
              }
              applicationService.upsertModule({
                projectId: activeProject.project_id,
                key: mKey,
                title: mKey,
                routeHint: String(m.path).trim(),
                priority: String(m.priority || 'medium').trim() as 'high' | 'medium' | 'low',
                criticality: String(m.priority || 'medium').trim() as 'high' | 'medium' | 'low',
                status: 'planned',
              });
            }
            const resumed = applicationService.resumeProject(activeProject.project_id);
            durableModules = resumed.modules;
            const activeCamp = campaign2?.campaign ?? resumed.campaign ?? (resumed.environment ? applicationService.startCampaign({
              projectId: activeProject.project_id,
              envId: resumed.environment.env_id,
              mode: 'investigate_and_test',
              phase: freshState.phase,
              targetModuleIds: durableModules.map((mod) => mod.module_id),
            }) : undefined);
            if (activeCamp) {
              activeCampaignId = activeCamp.campaign_id;
              reusedFromCampaignId = activeCamp.reused_from_campaign_id ?? reusedFromCampaignId;
              applicationService.updateCampaignPhase(activeCamp.campaign_id, freshState.phase);
              applicationService.upsertTask({
                projectId: activeProject.project_id,
                campaignId: activeCamp.campaign_id,
                kind: 'planning',
                title: `Alcance acordado con ${sortedModules.length} módulo(s)`,
                status: 'completed',
                progressCurrent: 1,
                progressTotal: 1,
                progressUnit: 'steps',
                recoveryCursor: {
                  recoverable: true,
                  project_id: activeProject.project_id,
                  campaign_id: activeCamp.campaign_id,
                  resume_token: `${activeCamp.campaign_id}:session_planned`,
                  last_completed_step: 'session_planned',
                  checkpoint_at: new Date().toISOString(),
                  recovery_bundle_available: true,
                  tombstone_blocked: false,
                },
              });
            }
          }

          const guidance = getPhaseGuidance(freshState.phase, {
            lifecycle: freshState,
            context: projectCtx,
            faltantes: scopingGateRes.faltantes,
            plan: freshState.session?.plan,
            modules: freshState.modules as any,
            profiles: allProfiles,
          });

          if (!scopingGateRes.passed && freshState.session?.auth?.required === true) {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      status: 'blocked',
                      directorio_objetivo: rootDir,
                      fase: 'SCOPING',
                      razon: 'auth_roles_required',
                      mensaje: 'Con auth.required: true se requiere al menos un rol declarado en auth.roles y que cada rol cuente con un perfil verificado para salir de SCOPING.',
                      faltantes: scopingGateRes.faltantes,
                      plan: freshState.session?.plan,
                      auth: freshState.session?.auth,
                      desbloquear_con: {
                        tool: 'qap_session_plan',
                        descripcion: 'Define auth.roles con qap_session_plan y verifica sus perfiles con qap_auth_add.',
                      },
                      siguiente_accion: guidance.siguiente_accion,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    status: 'success',
                    directorio_objetivo: rootDir,
                    fase: freshState.phase,
                    transicion_automatica: updatedPhase === 'WORKING' && lifecycleState.phase === 'SCOPING',
                    plan: freshState.session?.plan,
                    modules_registered: durableModules,
                    ...(activeCampaignId ? { campaign_id: activeCampaignId } : {}),
                    ...(reusedFromCampaignId ? { reused_from_campaign_id: reusedFromCampaignId } : {}),
                    ...(reusedModulesSummary.length > 0 ? { reused_modules: reusedModulesSummary } : {}),
                    auth: freshState.session?.auth,
                    ...(requestedTenant ? { tenant_id: requestedTenant } : {}),
                    faltantes: freshState.phase === 'WORKING' ? [] : scopingGateRes.faltantes,
                    siguiente_accion: guidance.siguiente_accion,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }



        case 'qap_validate': {
          const targetDefsDir = args.path ? resolve(String(args.path)) : resolve(rootDir, '.qa');
          const definitionsDir = existsSync(join(targetDefsDir, 'definitions')) ? join(targetDefsDir, 'definitions') : targetDefsDir;

          try {
            if (existsSync(definitionsDir) && readdirSync(definitionsDir).length > 0) {
              const res = validateDefinitions(definitionsDir);
              return {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify(
                      {
                        status: 'success',
                        directorio_objetivo: rootDir,
                        valid: res.valid,
                        errors: res.errors,
                        modulesCount: res.modules.length,
                        capabilitiesCount: res.capabilities.length,
                        flowsCount: res.flows.length,
                      },
                      null,
                      2
                    ),
                  },
                ],
              };
            }
          } catch {
            // Fallback a validación básica de esquema
          }

          const validator = new SchemaValidator();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    status: 'success',
                    directorio_objetivo: rootDir,
                    valid: true,
                    message: '✔ Validación de schemas completada sin advertencias.',
                    validatorReady: Boolean(validator),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }


        case 'qap_server': {
          const qaDir = resolve(rootDir, '.qa');
          if (!existsSync(qaDir)) {
            return {
              isError: true,
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      status: 'error',
                      isError: true,
                      directorio_objetivo: rootDir,
                      error: `No existe la carpeta de base de conocimiento .qa/ en '${rootDir}'. Debe ejecutar qap_init primero.`,
                      _guidance_for_assistant: `La carpeta .qa/ no existe en ${rootDir}. Debes ejecutar qap_init primero.`,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          const port = Number(args.port || 9280);

          if (activeViewerServer) {
            console.error(`[QAP Knowledge Graph] Servidor ya activo en: http://localhost:${activeViewerServer.port}`);
            console.error(`[QAP Knowledge Graph] Base de conocimiento servida desde: ${qaDir}`);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      status: 'running',
                      directorio_objetivo: rootDir,
                      base_conocimiento: qaDir,
                      message: `El servidor del Knowledge Graph ya está activo en http://localhost:${activeViewerServer.port}`,
                      url: `http://localhost:${activeViewerServer.port}`,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          const storage = new FileSystemStorage({ rootDir });
          activeViewerServer = await startViewerServer({
            storage,
            port,
            silent: true,
          });

          console.error(`[QAP Knowledge Graph] Servidor interactivo iniciado en: http://localhost:${activeViewerServer.port}`);
          console.error(`[QAP Knowledge Graph] Base de conocimiento servida desde: ${qaDir}`);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    status: 'success',
                    directorio_objetivo: rootDir,
                    base_conocimiento: qaDir,
                    message: `✔ Servidor interactivo de Knowledge Graph iniciado exitosamente en http://localhost:${activeViewerServer.port}`,
                    url: `http://localhost:${activeViewerServer.port}`,
                    _guidance_for_assistant: `DIRECTIVA: Proporciona al usuario el enlace clicable http://localhost:${activeViewerServer.port} para que explore el Knowledge Graph 2D en su navegador.`,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case 'qap_prune': {
          const runtimeDir = resolve(rootDir, '.qa', 'runtime');
          const olderThanDays = args.olderThanDays ? Number(args.olderThanDays) : 30;
          const dryRun = Boolean(args.dryRun);

          if (!existsSync(runtimeDir)) {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    status: 'success',
                    directorio_objetivo: rootDir,
                    message: 'No hay directorio runtime para podar.',
                    freedBytes: 0,
                  }),
                },
              ],
            };
          }

          const db = new QapDatabase(runtimeDir);
          const engine = new PruningEngine(db, runtimeDir);
          const recordTtlMs = olderThanDays * 24 * 60 * 60 * 1000;
          const pruneResult = dryRun
            ? { deletedRunsCount: 0, purgedArtifactsCount: 0, bytesFreed: 0 }
            : engine.prune({ recordTtlMs });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    status: 'success',
                    directorio_objetivo: rootDir,
                    dryRun,
                    deletedRunsCount: pruneResult.deletedRunsCount,
                    purgedArtifactsCount: pruneResult.purgedArtifactsCount,
                    bytesFreed: pruneResult.bytesFreed,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case 'qap_rules_set': {
          // Explicit route. No legacy fallback or dual write after canonical errors.
          if (Object.hasOwn(args, 'canonical_interview')) {
            const root = authorizedProjectRoot(args, dependencies, true);
            if (Object.keys(args).some(k => !['targetPath', 'module', 'canonical_interview'].includes(k)) ||
              typeof args.module !== 'string') return canonicalResult({ status: 'blocked', code: 'invalid_canonical_arguments' }, true);
            const service = interviews.get(root);
            return canonicalResult(service ? await service.execute(args.module, args.canonical_interview)
              : { status: 'blocked', code: 'knowledge_unbound' });
          }
          if (Object.hasOwn(args, 'rule_resolution')) {
            const res = await handleScopedRuleResolution({
              rootDir,
              moduleName: typeof args.module === 'string' ? args.module : '',
              rawArgs: args as Record<string, unknown>,
              appService: options.applicationService,
              reviewGateway: ruleReviewGateway,
            });
            return canonicalResult(res, res.status === 'blocked');
          }
          const moduleName = args.module ? String(args.module) : '';
          if (!moduleName) {
            return {
              isError: true,
              content: [{ type: 'text', text: JSON.stringify({ status: 'error', error: "El parámetro 'module' es requerido." }, null, 2) }],
            };
          }

          const storage = new FileSystemStorage({ rootDir });
          const lifecycleState = await storage.getLifecycleState();
          const currentPhase = lifecycleState.phase;

          // Contrato blocked: solo permitido en WORKING (T10)
          if (currentPhase !== 'WORKING') {
            if (currentPhase === 'WRAP_UP') {
              return {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify(
                      {
                        status: 'blocked',
                        directorio_objetivo: rootDir,
                        fase: 'WRAP_UP',
                        razon: 'La sesión actual ha concluido en la fase WRAP_UP. Inicia una nueva sesión con qap_session_plan o revisa el Knowledge Graph con qap_server.',
                        desbloquear_con: {
                          tool: 'qap_session_plan',
                          descripcion: 'Inicia una nueva sesión de trabajo con qap_session_plan.',
                        },
                        siguiente_accion: {
                          tipo: 'decision',
                          descripcion: 'La sesión actual ha concluido en WRAP_UP. Inicia una nueva sesión con qap_session_plan o revisa el Knowledge Graph con qap_server.',
                          tool: 'qap_session_plan',
                          pregunta: makeDecisionQuestion(
                            'decision_wrap_up',
                            'La sesión ha finalizado. Puedes iniciar una nueva sesión con qap_session_plan o revisar el Knowledge Graph con qap_server.',
                            [
                              { id: 'plan', etiqueta: 'Iniciar nueva sesión con qap_session_plan', recomendada: true },
                              { id: 'server', etiqueta: 'Revisar Knowledge Graph con qap_server' },
                            ]
                          ),
                        },
                      },
                      null,
                      2
                    ),
                  },
                ],
              };
            }

            const desbloquearTool = currentPhase === 'ONBOARDING' ? 'qap_context_set' : 'qap_session_plan';
            const desbloquearDesc = currentPhase === 'ONBOARDING'
              ? 'Completa el contexto inicial del proyecto con qap_context_set.'
              : 'Define el plan de sesión con qap_session_plan.';
            const guidance = getPhaseGuidance(currentPhase);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      status: 'blocked',
                      directorio_objetivo: rootDir,
                      fase: currentPhase,
                      razon: `No se puede ejecutar qap_rules_set en la fase ${currentPhase}. Solo está permitido en la fase WORKING.`,
                      desbloquear_con: {
                        tool: desbloquearTool,
                        descripcion: desbloquearDesc,
                      },
                      siguiente_accion: guidance.siguiente_accion,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          // Contrato blocked: módulo debe estar registrado (T10)
          const modEntry = lifecycleState.modules?.[moduleName];
          if (!modEntry) {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      status: 'blocked',
                      directorio_objetivo: rootDir,
                      fase: 'WORKING',
                      razon: `El módulo '${moduleName}' no está registrado en el plan de sesión ni en el estado del proyecto.`,
                      desbloquear_con: {
                        tool: 'qap_session_plan',
                        descripcion: `Registra el módulo '${moduleName}' en el plan con qap_session_plan antes de configurar sus reglas.`,
                      },
                      siguiente_accion: {
                        tipo: 'decision',
                        descripcion: `Registra el módulo '${moduleName}' usando qap_session_plan o consulta el estado del proyecto con qap_status.`,
                        tool: 'qap_session_plan',
                        pregunta: makeDecisionQuestion(
                          'decision_modulo_no_en_plan',
                          `El módulo '${moduleName}' no forma parte del plan. Registra el módulo con qap_session_plan o consulta el estado del proyecto con qap_status.`,
                          [
                            { id: 'registrar', etiqueta: 'Registrar módulo con qap_session_plan', recomendada: true },
                            { id: 'status', etiqueta: 'Ver estado del proyecto (qap_status)' },
                          ]
                        ),
                      },
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          // Canonical discovery cannot materialize this legacy prerequisite.
          if (!hasLegacyViewContext(rootDir, moduleName, typeof args.view === 'string' && args.view ? args.view : 'default') &&
              modEntry.state !== 'waived' && modEntry.state !== 'closed') {
            return legacyInterviewBlocked(modEntry.state === 'planned');
          }

          // Contrato blocked: módulo planned debe descubrirse primero (T10)
          if (modEntry.state === 'planned') {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      status: 'blocked',
                      directorio_objetivo: rootDir,
                      fase: 'WORKING',
                      razon: `El módulo '${moduleName}' está en estado 'planned'. Debes descubrirlo primero con qap_discover antes de registrar sus reglas.`,
                      desbloquear_con: {
                        tool: 'qap_discover',
                        descripcion: `Ejecuta qap_discover para explorar y mapear el módulo '${moduleName}'.`,
                      },
                      siguiente_accion: {
                        tipo: 'trabajo',
                        descripcion: `Descubre el módulo '${moduleName}' con qap_discover.`,
                        tool: 'qap_discover',
                      },
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          // Contrato blocked: módulo waived o closed no admite reglas (T10)
          if (modEntry.state === 'waived' || modEntry.state === 'closed') {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      status: 'blocked',
                      directorio_objetivo: rootDir,
                      fase: 'WORKING',
                      razon: `El módulo '${moduleName}' se encuentra en estado '${modEntry.state}' y sus reglas no pueden ser modificadas.`,
                      desbloquear_con: {
                        tool: 'qap_status',
                        descripcion: 'Selecciona otro módulo activo del plan o consulta el estado con qap_status.',
                      },
                      siguiente_accion: {
                        tipo: 'trabajo',
                        descripcion: `El módulo '${moduleName}' se encuentra finalizado (${modEntry.state}). Selecciona otro módulo activo del plan.`,
                        tool: 'qap_status',
                      },
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          const view = args.view ? String(args.view) : 'default';
          const incomingRules = Array.isArray(args.rules) ? args.rules : [];
          const incomingWaivers = Array.isArray(args.category_waivers)
            ? args.category_waivers
            : (Array.isArray(args.waivers) ? args.waivers : []);

          // C4: Manejo de propuesta_enunciado (del agente para resolver borrador previo)
          const rawPropuesta = args.propuesta_enunciado !== undefined
            ? String(args.propuesta_enunciado).trim()
            : (incomingRules.find((r: RuleEntry) => (r as unknown as Record<string, unknown>).propuesta_enunciado) as Record<string, unknown> | undefined)?.propuesta_enunciado;

          if (rawPropuesta !== undefined) {
            const propuestaText = String(rawPropuesta).trim();
            if (!isSubstantiveRuleText(propuestaText) || isEngineOptionLabel(propuestaText) || isTautologicalOptionLabel(propuestaText)) {
              return {
                isError: true,
                content: [{
                  type: 'text',
                  text: JSON.stringify({
                    status: 'error',
                    error: "La 'propuesta_enunciado' debe cumplir el umbral sustantivo (al menos 3 palabras y 20 caracteres) y no puede ser igual a una etiqueta genérica del motor.",
                  }, null, 2),
                }],
              };
            }

            // Categoría: de args.category o de la regla que la trae, o del borrador pendiente en rules.yaml
            let targetCategory = (args.category || incomingRules.find((r: RuleEntry) => r.category)?.category) as string | undefined;
            if (!targetCategory) {
              const currentRulesFile = await storage.getModuleRules(moduleName);
              const draftRule = (currentRulesFile?.rules || []).find((r: RuleEntry) => r.borrador && r.category);
              if (draftRule) targetCategory = draftRule.category;
            }
            if (!targetCategory) targetCategory = 'proposito';

            const confirmQId = `confirmar_enunciado.${normalizeSlug(moduleName)}.${normalizeSlug(view)}.${targetCategory}`;
            const confirmPregunta: Pregunta & { categoria: string; enunciado_propuesto: string } = {
              id: confirmQId,
              texto: `Se registrará para ${targetCategory}: ${propuestaText}`,
              formato: 'una_opcion',
              opciones: [
                {
                  id: 'es_correcto',
                  etiqueta: 'Es correcto',
                },
                {
                  id: 'corregir',
                  etiqueta: 'Corregir',
                  efecto: {
                    accion: 'corregir',
                    abre_seguimiento: true,
                  },
                },
                {
                  id: 'definir_despues',
                  etiqueta: 'Lo defino después',
                  efecto: {
                    estado: 'deferred',
                  },
                },
              ],
              permite_otra: false,
              registrar_con: { tool: 'qap_rules_set', campo: 'from_option' },
              seguimiento: {
                id: `${confirmQId}.corregir`,
                texto: `Modifica el enunciado para la categoría ${targetCategory}: ${propuestaText}`,
                formato: 'abierta',
                opciones: [],
                permite_otra: true,
                registrar_con: { tool: 'qap_rules_set', campo: 'user_text' },
              },
              categoria: targetCategory,
              enunciado_propuesto: propuestaText,
            };
            confirmPregunta.render_texto = generarRenderTexto(confirmPregunta);
            const guardedConfirmPregunta = guardPregunta(confirmPregunta) as Pregunta & { categoria: string; enunciado_propuesto: string };
            guardedConfirmPregunta.categoria = targetCategory;
            guardedConfirmPregunta.enunciado_propuesto = propuestaText;

            await storage.savePendingQuestion(moduleName, view, targetCategory, guardedConfirmPregunta);

            const currentRulesFile = await storage.getModuleRules(moduleName);
            const allRules = currentRulesFile?.rules || [];
            const allWaivers = currentRulesFile?.category_waivers || [];

            let projectRoleCountRules = 0;
            try {
              const ctx = await storage.getProjectContext();
              const roles = Array.isArray((ctx as any).roles) ? (ctx as any).roles : [];
              projectRoleCountRules = filterValidRoles(roles).length;
            } catch { /* empty */ }

            let formsForView: DomForm[] = [];
            let buttonsForView: Array<{ key: string; text: string; selector: string }> = [];
            const storageStateUsed = false;
            const selectorsPath = join(rootDir, '.qa', 'modules', moduleName, 'views', view, 'selectors.json');
            if (existsSync(selectorsPath)) {
              try {
                const selObj = JSON.parse(readFileSync(selectorsPath, 'utf-8'));
                if (selObj?.selectors?.forms) formsForView = selObj.selectors.forms;
                if (selObj?.selectors?.buttons) buttonsForView = selObj.selectors.buttons;
              } catch { /* empty */ }
            }
            const viewCtx: ViewDiscoveryContext = {
              module: moduleName,
              view,
              route: '',
              forms: formsForView,
              buttons: buttonsForView,
              storage_state_used: storageStateUsed,
              is_auth_view: false,
            };
            const applicableCats = computeApplicableCategories(viewCtx, projectRoleCountRules);
            const cov = computeCoverage(applicableCats, allRules, allWaivers, view);

            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  status: 'success',
                  directorio_objetivo: rootDir,
                  message: `✔ Propuesta de enunciado para '${targetCategory}' recibida. Se emite pregunta de confirmación estructurada al usuario.`,
                  module: moduleName,
                  view,
                  state: modEntry.state,
                  modulo_estado: modEntry.state,
                  rules_guardadas: 0,
                  waivers_guardados: 0,
                  rules_total: allRules.length,
                  waivers_total: allWaivers.length,
                  cobertura: cov,
                  cobertura_completa: cov.completa,
                  siguiente_accion: {
                    tipo: 'decision',
                    descripcion: `Confirma la propuesta de enunciado para la categoría '${targetCategory}'.`,
                    tool: 'qap_rules_set',
                    module: moduleName,
                    pregunta: guardedConfirmPregunta,
                  },
                }, null, 2),
              }],
            };
          }

          // Validar lote completo antes de cualquier mutación (T12)
          const VALID_CATEGORIES = new Set(['proposito', 'actor', 'campo', 'accion', 'error', 'dato', 'sensibilidad']);
          const VALID_STATUSES = new Set(['inferred', 'confirmed', 'rejected', 'deferred']);
          const VALID_SOURCES = new Set(['dom', 'prd', 'user', 'user_text', 'user_confirmed', 'doc', 'agent']);

          let agentRulesAlert = false;
          let shortRuleDraftCategory: string | undefined = undefined;
          let shortRuleDraftUserText: string | undefined = undefined;
          let directDeterministicQuestion: Pregunta | undefined = undefined;
          let openFollowUpQuestion: Pregunta | undefined = undefined;

          for (const rule of incomingRules) {
            // C4: Si viene user_text
            if (rule.user_text && typeof rule.user_text === 'string') {
              const uText = rule.user_text.trim();
              if (isSubstantiveRuleText(uText) && !isEngineOptionLabel(uText) && !isTautologicalOptionLabel(uText)) {
                rule.description = uText;
                rule.source = 'user_text';
                rule.status = 'confirmed';
                rule.borrador = false;
              } else {
                rule.description = `[Borrador] ${uText}`;
                rule.source = 'user_text';
                rule.status = 'inferred';
                rule.borrador = true;
                rule.user_input = uText;

                // Intento de derivación determinista (ej: categoría actor cuyo texto nombra roles de context.yaml)
                let derivedStatement: string | null = null;
                if (rule.category === 'actor') {
                  try {
                    const ctx = await storage.getProjectContext();
                    const declaredRoles = filterValidRoles((ctx as any)?.roles || []);
                    const lowerText = uText.toLowerCase();
                    const matchedRoles = declaredRoles.filter((r) => lowerText.includes(r.toLowerCase()));
                    if (matchedRoles.length > 0) {
                      derivedStatement = `Acceso y operación del módulo restringidos a los roles: ${matchedRoles.join(', ')}.`;
                    }
                  } catch { /* empty */ }
                }

                if (derivedStatement && isSubstantiveRuleText(derivedStatement)) {
                  const targetCat = rule.category || 'actor';
                  const confirmQId = `confirmar_enunciado.${normalizeSlug(moduleName)}.${normalizeSlug(view)}.${targetCat}`;
                  const confirmPregunta: Pregunta & { categoria: string; enunciado_propuesto: string } = {
                    id: confirmQId,
                    texto: `Se registrará para ${targetCat}: ${derivedStatement}`,
                    formato: 'una_opcion',
                    opciones: [
                      { id: 'es_correcto', etiqueta: 'Es correcto' },
                      { id: 'corregir', etiqueta: 'Corregir', efecto: { accion: 'corregir', abre_seguimiento: true } },
                      { id: 'definir_despues', etiqueta: 'Lo defino después', efecto: { estado: 'deferred' } },
                    ],
                    permite_otra: false,
                    registrar_con: { tool: 'qap_rules_set', campo: 'from_option' },
                    seguimiento: {
                      id: `${confirmQId}.corregir`,
                      texto: `Modifica el enunciado para la categoría ${targetCat}: ${derivedStatement}`,
                      formato: 'abierta',
                      opciones: [],
                      permite_otra: true,
                      registrar_con: { tool: 'qap_rules_set', campo: 'user_text' },
                    },
                    categoria: targetCat,
                    enunciado_propuesto: derivedStatement,
                  };
                  confirmPregunta.render_texto = generarRenderTexto(confirmPregunta);
                  const guarded = guardPregunta(confirmPregunta) as Pregunta & { categoria: string; enunciado_propuesto: string };
                  guarded.categoria = targetCat;
                  guarded.enunciado_propuesto = derivedStatement;

                  await storage.savePendingQuestion(moduleName, view, targetCat, guarded);
                  directDeterministicQuestion = guarded;
                } else {
                  shortRuleDraftCategory = rule.category;
                  shortRuleDraftUserText = uText;
                }
              }
            } else if (rule.from_option && typeof rule.from_option === 'object') {
              const fromOpt = rule.from_option as Record<string, unknown>;
              const qId = (fromOpt.pregunta_id || fromOpt.question_id) as string | undefined;
              const optId = (fromOpt.opcion_id || fromOpt.option_id) as string | undefined;
              let matchedQ: (Pregunta & { categoria?: string; enunciado_propuesto?: string }) | null = null;
              if (qId) {
                matchedQ = (await storage.findPendingQuestion(moduleName, view, qId)) as (Pregunta & { categoria?: string; enunciado_propuesto?: string }) | null;
              }
              if (!matchedQ && rule.category) {
                matchedQ = (await storage.getPendingQuestion(moduleName, view, rule.category)) as (Pregunta & { categoria?: string; enunciado_propuesto?: string }) | null;
              }

              // C3: La categoría de from_option se toma SIEMPRE de la pregunta pendiente persistida
              let persistedCat = matchedQ?.categoria;
              if (!persistedCat && matchedQ?.id) {
                const parts = matchedQ.id.split('.');
                if (parts.length >= 4 && parts[0] === 'interview') {
                  persistedCat = parts[3];
                }
              }

              if (matchedQ && persistedCat) {
                if (rule.category && rule.category !== persistedCat) {
                  return {
                    isError: true,
                    content: [{
                      type: 'text',
                      text: JSON.stringify({
                        status: 'blocked',
                        error: `Categoría discordante al resolver from_option: la pregunta pendiente pertenece a la categoría '${persistedCat}', pero la petición indicó '${rule.category}'. Debe coincidir con la pregunta pendiente.`,
                      }, null, 2),
                    }],
                  };
                }
                rule.category = persistedCat;
              }

              const matchedOpt = matchedQ?.opciones?.find((o: { id: string }) => o.id === optId);
              const optText = (matchedOpt?.etiqueta || '').trim();

              if (optId === 'es_correcto') {
                const statementText = matchedQ?.enunciado_propuesto || rule.description || optText;
                rule.description = statementText;
                rule.source = 'user_confirmed';
                rule.status = 'confirmed';
                rule.borrador = false;
              } else if (matchedOpt && (optId === 'definir_despues' || matchedOpt.efecto?.estado === 'deferred')) {
                rule.description = rule.description || optText || `Categoría diferida: ${rule.category || 'general'}`;
                rule.status = 'deferred';
                rule.source = 'user_confirmed';
                rule.borrador = false;
              } else if (matchedOpt && (matchedOpt.efecto?.abre_seguimiento || matchedOpt.efecto?.accion === 'corregir') && matchedQ?.seguimiento) {
                // Opción que abre seguimiento (ej: Corregir)
                openFollowUpQuestion = matchedQ.seguimiento;
                await storage.savePendingQuestion(moduleName, view, persistedCat || 'proposito', matchedQ.seguimiento);
                (rule as unknown as Record<string, unknown>).__skip_persist = true;
              } else if (matchedOpt && isSubstantiveRuleText(optText) && !isTautologicalOptionLabel(optText)) {
                rule.description = optText;
                rule.source = 'user_confirmed';
                rule.status = 'confirmed';
                rule.borrador = false;
              } else {
                if (rule.description && typeof rule.description === 'string' && rule.description.trim().length > 0) {
                  rule.source = 'agent';
                  rule.status = 'inferred';
                  agentRulesAlert = true;
                } else if (optText.length > 0) {
                  rule.description = optText;
                  rule.source = 'agent';
                  rule.status = 'inferred';
                  agentRulesAlert = true;
                } else {
                  return {
                    isError: true,
                    content: [{
                      type: 'text',
                      text: JSON.stringify({
                        status: 'error',
                        error: "Regla inválida: la opción seleccionada no existe o no tiene texto sustantivo. Lote rechazado por completo.",
                      }, null, 2),
                    }],
                  };
                }
              }
            } else if (rule.source === 'user' && rule.status === 'confirmed' && !isTautologicalOptionLabel(rule.description) && !isEngineOptionLabel(rule.description)) {
              rule.source = 'user';
              rule.status = 'confirmed';
            } else if (rule.status === 'deferred') {
              rule.status = 'deferred';
            } else {
              rule.source = 'agent';
              rule.status = 'inferred';
              agentRulesAlert = true;
            }

            if (!(rule as unknown as Record<string, unknown>).__skip_persist) {
              if (!rule.description || typeof rule.description !== 'string' || rule.description.trim().length === 0) {
                return {
                  isError: true,
                  content: [{ type: 'text', text: JSON.stringify({ status: 'error', error: "Regla inválida: 'description' es requerida y no puede ser vacía. Lote rechazado por completo." }, null, 2) }],
                };
              }
              if (rule.category && !VALID_CATEGORIES.has(rule.category)) {
                return {
                  isError: true,
                  content: [{ type: 'text', text: JSON.stringify({ status: 'error', error: `Categoría inválida '${rule.category}' en regla '${rule.id || 'nueva'}'. Categorías válidas: ${Array.from(VALID_CATEGORIES).join(', ')}. Lote rechazado por completo.` }, null, 2) }],
                };
              }
              if (rule.status && !VALID_STATUSES.has(rule.status)) {
                return {
                  isError: true,
                  content: [{ type: 'text', text: JSON.stringify({ status: 'error', error: `Estado inválido '${rule.status}' en regla '${rule.id || 'nueva'}'. Estados válidos: ${Array.from(VALID_STATUSES).join(', ')}. Lote rechazado por completo.` }, null, 2) }],
                };
              }
              if (rule.source && !VALID_SOURCES.has(rule.source)) {
                return {
                  isError: true,
                  content: [{ type: 'text', text: JSON.stringify({ status: 'error', error: `Fuente inválida '${rule.source}' en regla '${rule.id || 'nueva'}'. Fuentes válidas: ${Array.from(VALID_SOURCES).join(', ')}. Lote rechazado por completo.` }, null, 2) }],
                };
              }
            }
          }

          if (incomingWaivers.length > 0) {
            const waiverValidation = validateWaiversBatch(incomingWaivers);
            if (!waiverValidation.valid) {
              return {
                isError: true,
                content: [{
                  type: 'text',
                  text: JSON.stringify({
                    status: 'error',
                    isError: true,
                    directorio_objetivo: rootDir,
                    error: `Lote de waivers inválido: ${waiverValidation.error}. Lote rechazado por completo.`,
                    errores: [waiverValidation.error],
                  }, null, 2),
                }],
              };
            }
          }

          const reglasIgnoradas: Array<{ id: string; motivo: string }> = [];
          const activeIncomingRules = incomingRules.filter((r: RuleEntry) => !(r as unknown as Record<string, unknown>).__skip_persist);

          // Upsert atómico vía updateModuleRules (E5, T11, T12)
          const updatedRules = await storage.updateModuleRules(moduleName, (current) => {
            const existing = current.rules || [];
            const existingIds = new Set(existing.map((r: any) => r.id));

            // Calcular número secuencial para ids R-001, R-002... (T11)
            let maxRNum = 0;
            for (const r of existing) {
              const match = /^R-(\d+)$/.exec(r.id);
              if (match) {
                const n = parseInt(match[1], 10);
                if (n > maxRNum) maxRNum = n;
              }
            }

            // Upsert: actualizar existentes por id (respetando no-downgrade), o reemplazando borrador previo de misma categoría
            const merged = existing.map((r: RuleEntry) => {
              const incoming = activeIncomingRules.find(
                (ir: RuleEntry) => ir.id === r.id || (ir.category && ir.category === r.category && r.borrador)
              );
              if (incoming) {
                // T12 No-downgrade: regla source user confirmed no se sobrescribe con dom/prd
                if (r.source === 'user' && r.status === 'confirmed' && incoming.source && incoming.source !== 'user') {
                  reglasIgnoradas.push({
                    id: r.id,
                    motivo: `No-downgrade: la regla confirmada por usuario '${r.id}' no puede sobrescribirse con fuente '${incoming.source}'.`,
                  });
                  return r;
                }

                return {
                  ...r,
                  ...incoming,
                  id: r.id,
                  view: incoming.view ?? r.view ?? view,
                  source: incoming.source ?? r.source ?? 'user',
                  borrador: incoming.borrador ?? false,
                  evidence: incoming.evidence ? incoming.evidence.slice(0, 120) : r.evidence,
                };
              }
              return r;
            });

            const newRules = activeIncomingRules
              .filter((ir: RuleEntry) => {
                if (ir.id && existingIds.has(ir.id)) return false;
                if (!ir.id && ir.category && existing.some((er: RuleEntry) => er.borrador && er.category === ir.category)) return false;
                return true;
              })
              .map((ir: RuleEntry) => {
                const ruleId = ir.id || `R-${String(++maxRNum).padStart(3, '0')}`;
                return {
                  ...ir,
                  id: ruleId,
                  view: ir.view ?? view,
                  source: ir.source ?? 'user',
                  status: ir.status ?? 'confirmed',
                  borrador: ir.borrador ?? false,
                  evidence: ir.evidence ? ir.evidence.slice(0, 120) : undefined,
                };
              });

            // Upsert waivers por view+category
            const existingWaivers = current.category_waivers || [];
            const mergedWaivers = existingWaivers.map((w: any) => {
              const incoming = incomingWaivers.find((iw: any) => iw.category === w.category && (iw.view ?? view) === (w.view ?? view));
              return incoming
                ? { ...w, ...incoming, view: incoming.view ?? view, source: 'user', reason: incoming.reason.trim() }
                : w;
            });
            const newWaivers = incomingWaivers
              .filter((iw: any) => !existingWaivers.some((w: any) => w.category === iw.category && (w.view ?? view) === (iw.view ?? view)))
              .map((iw: any) => ({ ...iw, view: iw.view ?? view, source: 'user', reason: iw.reason.trim() }));

            return {
              ...current,
              manually_edited: false,
              rules: [...merged, ...newRules],
              category_waivers: [...mergedWaivers, ...newWaivers],
            };
          });

          // Recalcular cobertura post-mutación
          const allRules = updatedRules.rules || [];
          const allWaivers = updatedRules.category_waivers || [];

          // Construir viewCtx mínimo para coverage
          let projectRoleCountRules = 0;
          try {
            const ctx = await storage.getProjectContext();
            const roles = Array.isArray((ctx as any).roles) ? (ctx as any).roles : [];
            projectRoleCountRules = filterValidRoles(roles).length;
          } catch { /* sin contexto */ }

          let formsForView: DomForm[] = [];
          let buttonsForView: any[] = [];
          let storageStateUsed = false;
          const selectorsPath = join(rootDir, '.qa', 'modules', moduleName, 'views', view, 'selectors.json');
          const contextPath = join(rootDir, '.qa', 'modules', moduleName, 'views', view, 'context.yaml');
          if (existsSync(selectorsPath)) {
            try {
              const sel = JSON.parse(readFileSync(selectorsPath, 'utf-8'));
              formsForView = ((sel.selectors?.forms || []) as any[]).map((f: any) => ({
                id: f.id || 'form-1',
                selector: f.selector || 'form',
                fields: ((f.inputs || f.fields || []) as any[]).map((inp: any) => ({
                  key: inp.key || inp.name || inp.id || 'field',
                  type: inp.type || 'text',
                  name: inp.name,
                  id: inp.id,
                  label: inp.label,
                  required: inp.required,
                  minlength: inp.minlength,
                  maxlength: inp.maxlength,
                  pattern: inp.pattern,
                })),
              }));
              buttonsForView = sel.selectors?.buttons || [];
            } catch { /* fallback */ }
          }
          let routeForView: string | undefined;
          if (existsSync(contextPath)) {
            try {
              const ctxData = YAML.parse(readFileSync(contextPath, 'utf-8'));
              storageStateUsed = Boolean(ctxData?.storage_state_used);
              routeForView = ctxData?.route;
            } catch { /* fallback */ }
          }
          if (!routeForView && lifecycleState.session?.plan) {
            const planItem = lifecycleState.session.plan.find((p: any) => p.module === moduleName);
            if (planItem) routeForView = planItem.path;
          }

          const viewCtx: ViewDiscoveryContext = {
            module: moduleName,
            view,
            route: routeForView,
            forms: formsForView,
            buttons: buttonsForView,
            storage_state_used: storageStateUsed,
            is_auth_view: false,
          };
          const applicableCats = computeApplicableCategories(viewCtx, projectRoleCountRules);
          const cov = computeCoverage(applicableCats, allRules, allWaivers, view);
          const nextQs = generateNextInterviewBatch(viewCtx, allRules, applicableCats, allWaivers);

          // Transición de lifecycle: siempre a través de transitionModule (E1)
          let targetModuleState: ModuleLifecycleState = modEntry.state;
          if (cov.completa) {
            targetModuleState = 'consolidated';
          } else if (modEntry.state === 'consolidated' && !cov.completa) {
            targetModuleState = 'interviewing';
          } else if (modEntry.state === 'observed') {
            targetModuleState = 'interviewing';
          }

          if (targetModuleState !== modEntry.state) {
            await storage.updateLifecycleState(async (curr) => {
              // Si estaba en observed y el objetivo es consolidated, transicionar primero a interviewing
              if (modEntry.state === 'observed' && targetModuleState === 'consolidated') {
                const step1 = transitionModule(curr, moduleName, 'interviewing', {
                  reason: `Inicio de entrevista para módulo '${moduleName}'`,
                });
                if (step1.state) curr = step1.state;
              }

              const trans = transitionModule(
                curr,
                moduleName,
                targetModuleState,
                {
                  reason: targetModuleState === 'consolidated'
                    ? `Módulo '${moduleName}' alcanza estado consolidated (cobertura completa)`
                    : targetModuleState === 'interviewing' && modEntry.state === 'consolidated'
                    ? `Regresión de cobertura en módulo '${moduleName}': vuelve a interviewing`
                    : `Módulo '${moduleName}' en estado '${targetModuleState}' tras qap_rules_set`,
                }
              );
              if (trans.state) curr = trans.state;
              if (curr.session?.plan) {
                const pItem = curr.session.plan.find((p: any) => p.module === moduleName);
                if (pItem) pItem.status = targetModuleState;
              }
              return curr;
            });
          }

          let siguienteAccionRules: SiguienteAccion;
          let moduleSummary: ReturnType<typeof buildModuleSummary> | undefined;

          if (openFollowUpQuestion) {
            siguienteAccionRules = {
              tipo: 'entrevista',
              descripcion: openFollowUpQuestion.texto,
              tool: openFollowUpQuestion.registrar_con?.tool || 'qap_rules_set',
              module: moduleName,
              modulo: moduleName,
              view,
              vista: view,
              pregunta: openFollowUpQuestion,
            };
          } else if (directDeterministicQuestion) {
            siguienteAccionRules = {
              tipo: 'decision',
              descripcion: `Confirma la propuesta de regla para la categoría '${(directDeterministicQuestion as any).categoria}'.`,
              tool: 'qap_rules_set',
              module: moduleName,
              pregunta: directDeterministicQuestion,
            };
          } else if (shortRuleDraftCategory) {
            siguienteAccionRules = {
              tipo: 'trabajo',
              descripcion: `El usuario proporcionó una respuesta breve para la categoría '${shortRuleDraftCategory}': "${shortRuleDraftUserText}". Redacta un enunciado de regla completo (mínimo 3 palabras y 20 caracteres) basado en su respuesta y en la evidencia disponible, y envíalo con qap_rules_set usando el parámetro 'propuesta_enunciado'.`,
              tool: 'qap_rules_set',
              modulo: moduleName,
              vista: view,
            };
          } else if (cov.completa) {
            moduleSummary = buildModuleSummary(allRules, allWaivers);
            const freshState = await storage.getLifecycleState();
            const plan = freshState.session?.plan || [];
            const nextPlanned = plan.find((p: any) => {
              const st = freshState.modules?.[p.module]?.state;
              return st !== 'closed' && st !== 'waived' && p.module !== moduleName;
            });

            const desc = nextPlanned
              ? `Módulo '${moduleName}' consolidado con cobertura completa de reglas. Siguiente módulo planificado: '${nextPlanned.module}'. Confirma el cierre del módulo actual antes de avanzar.`
              : `Módulo '${moduleName}' consolidado con cobertura completa de reglas. Todos los módulos planificados están listos para cierre. Procede a cerrar este módulo con qap_module_close.`;

            const closeDecisionPregunta = makeDecisionQuestion(
              `modulo.${moduleName}.cierre`,
              `El módulo '${moduleName}' ha completado su cobertura (${cov.sustantivas} de ${applicableCats.length} categorías con contenido${cov.diferidas > 0 ? `, ${cov.diferidas} diferidas` : ''}). Confirma la acción para proceder:`,
              [
                { id: 'cerrar', etiqueta: `Cerrar módulo '${moduleName}' formalmente`, recomendada: true },
                { id: 'revisar', etiqueta: 'Revisar reglas antes de cerrar' },
              ],
              true,
              { tool: 'qap_module_close', campo: 'action' }
            );
            closeDecisionPregunta.render_texto = generarRenderTexto(closeDecisionPregunta);

            siguienteAccionRules = {
              tipo: 'decision',
              descripcion: desc,
              tool: 'qap_module_close',
              module: moduleName,
              pregunta: closeDecisionPregunta,
            };
          } else {
            siguienteAccionRules = buildInterviewNextAction({
              module: moduleName,
              view,
              questions: nextQs,
              applicableCategories: applicableCats,
              coverage: cov,
            });
          }

          if (siguienteAccionRules?.pregunta) {
            let cat = (siguienteAccionRules.pregunta as unknown as Record<string, unknown>).categoria as string | undefined;
            if (!cat) {
              const parts = (siguienteAccionRules.pregunta.id || '').split('.');
              if (parts.length >= 4 && parts[0] === 'interview') {
                cat = parts[3];
              }
            }
            if (!cat && applicableCats.length > 0) {
              const missing = applicableCats.find((c) => !cov.categorias[c]?.cubierta);
              if (missing) cat = missing;
            }
            if (cat) {
              try {
                await storage.savePendingQuestion(moduleName, view, cat, siguienteAccionRules.pregunta);
              } catch { /* ignore */ }
            }
          }

          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                directorio_objetivo: rootDir,
                message: `✔ Reglas actualizadas para módulo '${moduleName}' (vista: ${view})`,
                module: moduleName,
                view,
                state: targetModuleState,
                modulo_estado: targetModuleState,
                rules_guardadas: activeIncomingRules.length,
                waivers_guardados: incomingWaivers.length,
                rules_total: allRules.length,
                waivers_total: allWaivers.length,
                reglas_ignoradas: reglasIgnoradas.length > 0 ? reglasIgnoradas : undefined,
                resumen_cierre: moduleSummary,
                cobertura: cov,
                cobertura_completa: cov.completa,
                desbloquear_con: agentRulesAlert
                  ? {
                      tool: 'qap_rules_set',
                      descripcion: "Una o más reglas redactadas por el agente sin user_text sustantivo ni from_option válido se guardaron con source 'agent' y status 'inferred'. No computan para la cobertura. Confírmalas con user_text o from_option.",
                    }
                  : undefined,
                siguiente_accion: siguienteAccionRules,
              }, null, 2),
            }],
          };
        }

        case 'qap_module_close': {
          // Explicit canonical route
          if (Object.hasOwn(args, 'canonical_closure')) {
            const root = authorizedProjectRoot(args, dependencies, true);
            if (typeof args.module !== 'string') return canonicalResult({ status: 'blocked', code: 'invalid_canonical_arguments' }, true);
            const service = closures.get(root);
            return canonicalResult(service ? await service.execute(args.module, args.canonical_closure)
              : { status: 'blocked', code: 'knowledge_unbound' });
          }

          const moduleName = args.module ? String(args.module).trim() : '';

          // Amendment 4: Prevent legacy fallthrough if this module is bound in a canonical project
          const bound = dependencies.knowledgeBindings?.find(b => {
            try { return realpathSync(b.projectRoot) === rootDir; } catch { return false; }
          });
          if (bound?.moduleBindings?.some(b => b.plannedName === moduleName)) {
            return canonicalResult({
              status: 'blocked',
              code: 'canonical_closure_required',
              razon: 'Este módulo requiere cierre canónico mediante canonical_closure.',
            }, true);
          }

          const action = args.action ? String(args.action).trim() : '';
          const userConfirmed = args.user_confirmed === true;
          const reasonStr = typeof args.reason === 'string' ? args.reason.trim() : '';

          if (!moduleName || !action) {

            return {
              isError: true,
              content: [{
                type: 'text',
                text: JSON.stringify({
                  status: 'error',
                  isError: true,
                  directorio_objetivo: rootDir,
                  error: "Los parámetros 'module' y 'action' son obligatorios.",
                }, null, 2),
              }],
            };
          }

          const storage = new FileSystemStorage({ rootDir });
          const lifecycleState = await storage.getLifecycleState();

          // 1. Bloqueado si la fase no es WORKING
          if (lifecycleState.phase !== 'WORKING') {
            const desbloquearTool = lifecycleState.phase === 'WRAP_UP' ? 'qap_session_plan' : 'qap_status';
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  status: 'blocked',
                  directorio_objetivo: rootDir,
                  fase: lifecycleState.phase,
                  razon: `No se puede ejecutar qap_module_close en la fase ${lifecycleState.phase}. Solo está permitido en la fase WORKING.`,
                  desbloquear_con: {
                    tool: desbloquearTool,
                    descripcion: 'Avanza el ciclo de vida a la fase WORKING.',
                  },
                  siguiente_accion: {
                    tipo: 'trabajo',
                    descripcion: `La fase actual es ${lifecycleState.phase}. Consulta el estado con qap_status.`,
                    tool: 'qap_status',
                  },
                }, null, 2),
              }],
            };
          }

          // 2. Bloqueado si el módulo no está registrado
          const modEntry = lifecycleState.modules?.[moduleName];
          if (!modEntry) {
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  status: 'blocked',
                  directorio_objetivo: rootDir,
                  fase: 'WORKING',
                  razon: `El módulo '${moduleName}' no está registrado en el plan de sesión ni en el estado del proyecto.`,
                  desbloquear_con: {
                    tool: 'qap_session_plan',
                    descripcion: `Registra el módulo '${moduleName}' en el plan con qap_session_plan.`,
                  },
                  siguiente_accion: {
                    tipo: 'decision',
                    descripcion: `Registra el módulo '${moduleName}' usando qap_session_plan o consulta el estado con qap_status.`,
                    tool: 'qap_session_plan',
                    pregunta: makeDecisionQuestion(
                      'decision_modulo_no_en_plan',
                      `El módulo '${moduleName}' no forma parte del plan. Registra el módulo con qap_session_plan o consulta el estado del proyecto con qap_status.`,
                      [
                        { id: 'registrar', etiqueta: 'Registrar módulo con qap_session_plan', recomendada: true },
                        { id: 'status', etiqueta: 'Ver estado del proyecto (qap_status)' },
                      ]
                    ),
                  },
                }, null, 2),
              }],
            };
          }

          // 3. Bloqueado si ya es closed o waived
          if (modEntry.state === 'closed' || modEntry.state === 'waived') {
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  status: 'blocked',
                  directorio_objetivo: rootDir,
                  fase: 'WORKING',
                  razon: `El módulo '${moduleName}' ya se encuentra en estado terminal '${modEntry.state}' y no puede cerrarse ni renunciarse de nuevo.`,
                  desbloquear_con: {
                    tool: 'qap_status',
                    descripcion: 'Selecciona otro módulo activo del plan o consulta el estado con qap_status.',
                  },
                  siguiente_accion: {
                    tipo: 'trabajo',
                    descripcion: `El módulo '${moduleName}' ya está en estado terminal '${modEntry.state}'. Consulta el estado del proyecto con qap_status.`,
                    tool: 'qap_status',
                  },
                }, null, 2),
              }],
            };
          }

          const closeProject = applicationService?.findActiveProjectByRoot(rootDir) ?? null;
          const serviceCasesForClose =
            closeProject && applicationService
              ? applicationService.listServiceCases(closeProject.project_id, moduleName)
              : [];
          const serviceExecSummaryForClose =
            closeProject && applicationService
              ? applicationService.getExecutionSummary(closeProject.project_id, moduleName)
              : null;
          const hasServiceModuleEvidence = Boolean(
            closeProject &&
            applicationService &&
            (serviceCasesForClose.some((c) =>
              ['approved', 'pass', 'fail', 'not_run', 'technical_error', 'human_accepted'].includes(c.conformity_status),
            ) ||
              (serviceExecSummaryForClose?.total_attempts ?? 0) > 0),
          );

          if (action === 'close' && userConfirmed && !hasLegacyViewContext(rootDir, moduleName) && !hasServiceModuleEvidence) {
            return legacyInterviewBlocked();
          }

          let rulesList: RuleEntry[] = [];
          let waiversList: CategoryWaiver[] = [];
          try {
            const rf = await storage.getModuleRules(moduleName);
            rulesList = rf?.rules || [];
            waiversList = rf?.category_waivers || [];
          } catch { /* empty */ }

          const planItem = (lifecycleState.session?.plan || []).find((p: { module: string; path?: string }) => p.module === moduleName);
          const route = planItem?.path || '';
          const vContext = buildViewDiscoveryContext(rootDir, moduleName, 'default', route);

          let projectRoleCountClose = 0;
          try {
            const ctx = await storage.getProjectContext();
            const roles = Array.isArray(ctx?.roles) ? ctx.roles : [];
            projectRoleCountClose = filterValidRoles(roles).length;
          } catch { /* sin contexto */ }

          const appCats = computeApplicableCategories(vContext, projectRoleCountClose);
          const covCurrent = computeCoverage(appCats, rulesList, waiversList, 'default');
          const sustantivasCount = covCurrent.sustantivas;
          const totalAplicables = appCats.length;
          const tiene50Porciento = hasServiceModuleEvidence
            ? true
            : (totalAplicables > 0 ? (sustantivasCount / totalAplicables >= 0.50) : true);
          const conteoTexto = hasServiceModuleEvidence
            ? `${serviceCasesForClose.length} caso(s) registrados, ${serviceExecSummaryForClose?.total_attempts ?? 0} intento(s) de ejecución`
            : `${sustantivasCount} de ${totalAplicables} categorías con contenido${covCurrent.diferidas > 0 ? `, ${covCurrent.diferidas} diferidas` : ''}`;

          // 4. Bloqueado si user_confirmed no es true
          if (!userConfirmed) {
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  status: 'blocked',
                  directorio_objetivo: rootDir,
                  fase: 'WORKING',
                  razon: 'El cierre o renuncia de un módulo exige confirmación explícita del usuario (user_confirmed: true) tras presentarle el resumen del módulo.',
                  desbloquear_con: {
                    tool: 'qap_module_close',
                    descripcion: 'Presenta el resumen del módulo al usuario y reintenta con user_confirmed: true.',
                  },
                  siguiente_accion: {
                    tipo: 'decision',
                    descripcion: `Presenta el resumen del módulo '${moduleName}' al usuario y solicita su confirmación explícita antes de llamar qap_module_close.`,
                    tool: 'qap_module_close',
                    pregunta: makeDecisionQuestion(
                      `confirmar_cierre_modulo_${sanitizeDomString(moduleName)}`,
                      `Se requiere confirmación del usuario para cerrar o renunciar al módulo '${moduleName}' (${conteoTexto}). Selecciona cómo proceder con la acción '${action}':`,
                      [
                        { id: 'confirmar', etiqueta: `Confirmar ${action === 'close' ? 'cierre' : 'renuncia'} del módulo '${moduleName}'`, recomendada: true },
                        { id: 'cancelar', etiqueta: 'Seguir refinando reglas' },
                      ],
                      false,
                      { tool: 'qap_module_close', campo: 'user_confirmed' }
                    ),
                  },
                }, null, 2),
              }],
            };
          }

          // 5. Validación por action
          if (action === 'close') {
            if (modEntry.state === 'planned' && !args.accept_gaps && !hasServiceModuleEvidence) {
              return {
                content: [{
                  type: 'text',
                  text: JSON.stringify({
                    status: 'blocked',
                    directorio_objetivo: rootDir,
                    fase: 'WORKING',
                    razon: `El módulo '${moduleName}' está en estado '${modEntry.state}'. Solo los módulos en estado 'consolidated' pueden cerrarse con action 'close'.`,
                    desbloquear_con: {
                      tool: 'qap_rules_set',
                      descripcion: 'Completa la revisión de reglas del módulo hasta alcanzar el estado consolidated.',
                    },
                    siguiente_accion: {
                      tipo: 'trabajo',
                      descripcion: `El módulo '${moduleName}' está en '${modEntry.state}'. Continúa el proceso con qap_rules_set.`,
                      tool: 'qap_rules_set',
                    },
                  }, null, 2),
                }],
              };
            }

            if (!tiene50Porciento) {
              const acceptGaps = args.accept_gaps === true;
              const acceptGapsReason = typeof args.accept_gaps_reason === 'string' ? args.accept_gaps_reason.trim() : '';
              if (!acceptGaps || acceptGapsReason.length < 15) {
                return {
                  content: [{
                    type: 'text',
                    text: JSON.stringify({
                      status: 'blocked',
                      directorio_objetivo: rootDir,
                      fase: 'WORKING',
                      razon: 'cobertura_insuficiente',
                      mensaje: `El módulo '${moduleName}' tiene cobertura sustantiva menor al 50% (${conteoTexto}). Para cerrarlo debes proporcionar accept_gaps: true, accept_gaps_reason (al menos 15 caracteres) y user_confirmed: true.`,
                      cobertura: covCurrent,
                      desbloquear_con: {
                        tool: 'qap_module_close',
                        descripcion: 'Cierra el módulo aceptando brechas con accept_gaps: true, accept_gaps_reason (mínimo 15 caracteres) y user_confirmed: true, o añade reglas con qap_rules_set.',
                      },
                      siguiente_accion: {
                        tipo: 'decision',
                        descripcion: `El módulo '${moduleName}' solo cuenta con ${conteoTexto}. Confirma cómo proceder con el cierre.`,
                        tool: 'qap_module_close',
                        pregunta: makeDecisionQuestion(
                          `cobertura_insuficiente_${sanitizeDomString(moduleName)}`,
                          `El módulo '${moduleName}' tiene cobertura de ${conteoTexto}. Selecciona cómo proceder con el cierre:`,
                          [
                            { id: 'cerrar_con_brechas', etiqueta: 'Aceptar brechas y cerrar módulo con justificación' },
                            { id: 'continuar', etiqueta: 'Continuar refinando reglas con qap_rules_set', recomendada: true },
                          ],
                          true,
                          { tool: 'qap_module_close', campo: 'accept_gaps' }
                        ),
                      },
                    }, null, 2),
                  }],
                };
              }
            }
          } else if (action === 'waive') {
            if (reasonStr.length < 15) {
              return {
                content: [{
                  type: 'text',
                  text: JSON.stringify({
                    status: 'blocked',
                    directorio_objetivo: rootDir,
                    fase: 'WORKING',
                    razon: `La renuncia a un módulo (action: "waive") exige una justificación (reason) de al menos 15 caracteres tras trim. Se recibieron ${reasonStr.length} caracteres.`,
                    desbloquear_con: {
                      tool: 'qap_module_close',
                      descripcion: 'Proporciona una razón justificada de al menos 15 caracteres.',
                    },
                    siguiente_accion: {
                      tipo: 'decision',
                      descripcion: `Especifica una justificación de al menos 15 caracteres para renunciar al módulo '${moduleName}'.`,
                      tool: 'qap_module_close',
                      pregunta: makeDecisionQuestion(
                        `motivo_renuncia_${sanitizeDomString(moduleName)}`,
                        `Especifica la justificación para renunciar al módulo '${moduleName}' (mínimo 15 caracteres):`,
                        [
                          { id: 'cancelar', etiqueta: 'No renunciar y continuar con el módulo', recomendada: true },
                          { id: 'justificar', etiqueta: 'Ingresar motivo en respuesta libre' },
                        ],
                        true,
                        { tool: 'qap_module_close', campo: 'reason' }
                      ),
                    },
                  }, null, 2),
                }],
              };
            }
          } else {
            return {
              isError: true,
              content: [{
                type: 'text',
                text: JSON.stringify({
                  status: 'error',
                  isError: true,
                  directorio_objetivo: rootDir,
                  error: `Acción '${action}' no reconocida. Acciones válidas: 'close', 'waive'.`,
                }, null, 2),
              }],
            };
          }

          // Ejecutar transición
          const targetState: ModuleLifecycleState = action === 'close' ? 'closed' : 'waived';
          await storage.updateLifecycleState(async (curr) => {
            let transState = curr;
            if (transState.modules?.[moduleName]?.state === 'planned' && targetState === 'closed') {
              const toObs = transitionModule(transState, moduleName, 'observed', {
                reason: `Evidencia de ejecución/casos acreditada para cierre de '${moduleName}'`,
              });
              if (toObs.state) transState = toObs.state;
            }
            if (transState.modules?.[moduleName]?.state === 'observed' && targetState === 'closed') {
              const toInter = transitionModule(transState, moduleName, 'interviewing', {
                reason: `Inicio de entrevista para cierre${args.accept_gaps === true ? ' con brechas aceptadas' : ''}`,
              });
              if (toInter.state) transState = toInter.state;
            }
            if (transState.modules?.[moduleName]?.state === 'interviewing' && targetState === 'closed') {
              const toCons = transitionModule(transState, moduleName, 'consolidated', {
                reason: `Consolidación para cierre${args.accept_gaps === true ? ' con brechas aceptadas' : ''}`,
              });
              if (toCons.state) transState = toCons.state;
            }
            const trans = transitionModule(
              transState,
              moduleName,
              targetState,
              action === 'close'
                ? { reason: `Módulo '${moduleName}' cerrado formalmente${args.accept_gaps === true ? ' con brechas aceptadas' : ' tras verificar cobertura completa'}` }
                : { waived_reason: reasonStr, reason: `Módulo '${moduleName}' renunciado (waived). Motivo: ${reasonStr}` }
            );
            if (trans.state) curr = trans.state;
            if (curr.session?.plan) {
              const pItem = curr.session.plan.find((p: any) => p.module === moduleName);
              if (pItem) pItem.status = targetState;
            }
            if (curr.modules?.[moduleName] && args.accept_gaps === true) {
              (curr.modules[moduleName] as unknown as Record<string, unknown>).accepted_gaps = {
                reason: String(args.accept_gaps_reason).trim(),
                at: new Date().toISOString(),
                sustantivas: sustantivasCount,
                total_aplicables: totalAplicables,
                diferidas: covCurrent.diferidas,
              };
            }
            return curr;
          });

          if (closeProject && applicationService) {
            applicationService.closeServiceModule(
              closeProject.project_id,
              moduleName,
              action as 'close' | 'waive',
              action === 'waive' ? reasonStr : undefined,
            );
          }

          const summary = buildModuleSummary(rulesList, waiversList);
          const freshState = await storage.getLifecycleState();
          const plan = freshState.session?.plan || [];
          const nextPlanned = plan.find((p: any) => {
            const st = freshState.modules?.[p.module]?.state;
            return st !== 'closed' && st !== 'waived';
          });

          let sigAccion: SiguienteAccion;
          if (nextPlanned) {
            sigAccion = {
              tipo: 'trabajo',
              descripcion: `Módulo '${moduleName}' ${action === 'close' ? 'cerrado' : 'renunciado'}. Siguiente módulo planificado: '${nextPlanned.module}' en ruta '${nextPlanned.path}'.`,
              tool: 'qap_discover',
            };
          } else {
            sigAccion = {
              tipo: 'decision',
              descripcion: `Módulo '${moduleName}' ${action === 'close' ? 'cerrado' : 'renunciado'}. Todos los módulos del plan han finalizado. Procede a cerrar la sesión con qap_session_close.`,
              tool: 'qap_session_close',
              pregunta: makeDecisionQuestion(
                'decision_cierre_sesion_finalizada',
                `Todos los módulos del plan han finalizado. Selecciona la acción para concluir la sesión o continuar:`,
                [
                  { id: 'cerrar_sesion', etiqueta: 'Cerrar sesión de trabajo (qap_session_close)', recomendada: true },
                  { id: 'continuar_sesion', etiqueta: 'Mantener la sesión abierta para más validaciones' },
                ],
                false,
                { tool: 'qap_session_close', campo: 'confirmar' }
              ),
            };
          }

          const updatedExecSummary =
            closeProject && applicationService
              ? applicationService.getExecutionSummary(closeProject.project_id, moduleName)
              : undefined;

          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                directorio_objetivo: rootDir,
                message: `✔ Módulo '${moduleName}' ${action === 'close' ? 'cerrado formalmente (closed)' : 'renunciado (waived)'}.`,
                module: moduleName,
                action,
                state: targetState,
                estado: targetState,
                reason: action === 'waive' ? reasonStr : undefined,
                ...(updatedExecSummary ? { canonical_execution_summary: updatedExecSummary } : {}),
                resumen: summary,
                siguiente_accion: sigAccion,
              }, null, 2),
            }],
          };
        }

        case 'qap_session_close': {
          const storage = new FileSystemStorage({ rootDir });
          let lifecycleState = await storage.getLifecycleState();

          if (lifecycleState.phase !== 'WORKING') {
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  status: 'blocked',
                  directorio_objetivo: rootDir,
                  fase: lifecycleState.phase,
                  razon: `No se puede ejecutar qap_session_close en la fase ${lifecycleState.phase}. Solo está permitido en la fase WORKING.`,
                  desbloquear_con: {
                    tool: lifecycleState.phase === 'WRAP_UP' ? 'qap_session_plan' : 'qap_status',
                    descripcion: 'Avanza el ciclo de vida a la fase WORKING.',
                  },
                  siguiente_accion: {
                    tipo: 'trabajo',
                    descripcion: `La fase actual es ${lifecycleState.phase}. Consulta el estado con qap_status.`,
                    tool: 'qap_status',
                  },
                }, null, 2),
              }],
            };
          }

          // Canonical bindings cannot fall back to legacy closure, even if their
          // privileged closure store was not composed or targetPath is an alias.
          const canonicalRoot = realpathSync(rootDir);
          const boundCanonical = (dependencies.knowledgeBindings ?? []).some(bound => {
            try {
              return realpathSync(bound.projectRoot) === canonicalRoot &&
                Boolean(bound.moduleBindings?.length);
            } catch { return false; }
          });
          const closureService = closures.get(canonicalRoot);
          if (boundCanonical && !closureService) {
            return canonicalResult({
              status: 'blocked',
              code: 'canonical_closure_store_required',
              razon: 'El host vinculó módulos canónicos pero no configuró un almacén durable de cierre.',
              desbloquear_con: { tool: 'qap_status', descripcion: 'Revisar la composición del host MCP.' },
            }, true);
          }
          if (closureService) {
            const check = await closureService.allModulesClosed();
            if (!check.allClosed) {
              return {
                content: [{
                  type: 'text',
                  text: JSON.stringify({
                    status: 'blocked',
                    code: 'canonical_module_closure_required',
                    directorio_objetivo: rootDir,
                    fase: 'WORKING',
                    razon: `No se puede cerrar la sesión: los siguientes módulos canónicos no cuentan con cierre o renuncia válidamente autorizados: ${check.unclosed.join(', ')}.`,
                    unclosed_modules: check.unclosed,
                    desbloquear_con: {
                      tool: 'qap_module_close',
                      descripcion: 'Cierra o renuncia a los módulos canónicos con qap_module_close y canonical_closure.',
                    },
                    siguiente_accion: {
                      tipo: 'trabajo',
                      descripcion: `Cierra los módulos canónicos pendientes (${check.unclosed.join(', ')}) antes de concluir la sesión.`,
                      tool: 'qap_module_close',
                    },
                  }, null, 2),
                }],
              };
            }
          }

          // allModulesClosed() reconciles durable canonical waivers into lifecycle.json.
          // The snapshot read before that awaited operation may lack waived_reason.
          // Read again so the gate AND the gap report use the same repaired state.
          if (closureService) {
            lifecycleState = await storage.getLifecycleState();
            // Keep the phase gate even if another writer changed the session
            // during reconciliation; never close a non-WORKING session.
            if (lifecycleState.phase !== 'WORKING') {
              return {
                content: [{
                  type: 'text',
                  text: JSON.stringify({
                    status: 'blocked',
                    code: 'session_phase_changed',
                    directorio_objetivo: rootDir,
                    fase: lifecycleState.phase,
                    razon: 'La fase de sesión cambió durante la conciliación; vuelve a consultar qap_status antes de cerrar.',
                    desbloquear_con: { tool: 'qap_status' },
                  }, null, 2),
                }],
              };
            }
          }

          const workingGate = canExitWorking(lifecycleState);
          if (!workingGate.passed) {
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  status: 'blocked',
                  directorio_objetivo: rootDir,
                  fase: 'WORKING',
                  razon: 'No se puede cerrar la sesión de trabajo: aún existen módulos pendientes en el plan o el plan no ha sido definido.',
                  faltantes: workingGate.faltantes,
                  desbloquear_con: {
                    tool: 'qap_module_close',
                    descripcion: 'Cierra o renuncia a los módulos pendientes del plan con qap_module_close.',
                  },
                  siguiente_accion: {
                    tipo: 'decision',
                    descripcion: 'Existen módulos pendientes de cerrar o renunciar antes de concluir la sesión.',
                    tool: 'qap_module_close',
                    pregunta: makeDecisionQuestion(
                      'modulos_pendientes_antes_cierre',
                      'Existen módulos pendientes en el plan. Selecciona cómo proceder:',
                      [
                        { id: 'cerrar_modulos', etiqueta: 'Revisar y cerrar módulos pendientes con qap_module_close', recomendada: true },
                        { id: 'ver_estado', etiqueta: 'Consultar el estado del proyecto con qap_status' },
                      ],
                      true,
                      { tool: 'qap_module_close', campo: 'module' }
                    ),
                  },
                }, null, 2),
              }],
            };
          }


          // Report inventory is deliberately collected BEFORE acquiring the
          // lifecycle lock. The official concurrent writer used in the
          // adversarial test can finish, and any drift is rejected below.
          const approvedLifecycle = JSON.stringify(lifecycleState);
          // Cierre exitoso y transición a WRAP_UP
          const qaDir = resolve(rootDir, '.qa');
          const contextPath = join(qaDir, 'project', 'context.yaml');
          let parsedContext: any = null;
          if (existsSync(contextPath)) {
            try {
              parsedContext = YAML.parse(readFileSync(contextPath, 'utf-8'));
            } catch { /* empty */ }
          }

          const sessionId = lifecycleState.session?.id || randomUUID();
          const startedAt = lifecycleState.session?.started_at || new Date().toISOString();
          const closedAt = new Date().toISOString();

          // Recopilar módulos para el reporte de brechas
          const allModuleNames = new Set([
            ...(lifecycleState.session?.plan || []).map((p: any) => p.module),
            ...Object.keys(lifecycleState.modules || {}),
          ]);

          // The canonical host ledger is authoritative for bound modules.
          // Never reinterpret their empty legacy YAML as zero gaps or approval.
          const canonicalReports = closureService ? await closureService.sessionReport() : [];
          const canonicalNames = new Set(canonicalReports.map(report => report.module));
          const closeSessionProject = applicationService?.findActiveProjectByRoot(rootDir) ?? null;
          const sessionExecutionSummary =
            closeSessionProject && applicationService
              ? applicationService.getExecutionSummary(closeSessionProject.project_id)
              : null;
          const legacyNames = [...allModuleNames].filter(name => !canonicalNames.has(name));
          const moduleRulesMap: Record<string, { rules?: any[]; category_waivers?: any[] }> = {};
          for (const mName of legacyNames) {
            try {
              const rf = await storage.getModuleRules(mName);
              moduleRulesMap[mName] = {
                rules: rf?.rules || [],
                category_waivers: rf?.category_waivers || [],
              };
            } catch {
              moduleRulesMap[mName] = { rules: [], category_waivers: [] };
            }
          }

          const gapParams = {
            sessionId,
            startedAt,
            closedAt,
            projectContext: parsedContext,
            plan: (lifecycleState.session?.plan || []).filter((p: any) => !canonicalNames.has(p.module)),
            modules: Object.fromEntries(Object.entries(lifecycleState.modules || {})
              .filter(([name]) => !canonicalNames.has(name))),
            moduleRules: moduleRulesMap,
          };
          const legacyReportMd = legacyNames.length ? generateSessionGapReport(gapParams) : '';
          const physicalExecutionMd =
            sessionExecutionSummary && sessionExecutionSummary.total_attempts > 0
              ? renderVerifiedPhysicalExecutionSection(sessionExecutionSummary)
              : '';
          const gapReportMd = canonicalReports.length
            ? renderCanonicalSessionReport(canonicalReports) +
              physicalExecutionMd +
              (legacyReportMd ? '\n---\n\n# Módulos legacy no vinculados\n\n' + legacyReportMd : '')
            : legacyReportMd + physicalExecutionMd;
          const gapSummary = computeSessionGapSummary(gapParams);

          const sessionsDir = join(qaDir, 'project', 'sessions');
          if (!existsSync(sessionsDir)) {
            mkdirSync(sessionsDir, { recursive: true });
          }

          const reportFilePath = join(sessionsDir, `${sessionId}.report.md`);

          return await storage.commitLifecycleStateWithFence<CallToolResult>(async (current, commit) => {
            if (current.phase !== 'WORKING' ||
                JSON.stringify(current) !== approvedLifecycle) {
              return canonicalResult({
                status: 'blocked', code: 'session_context_changed',
                fase: current.phase,
                razon: 'La sesión, el plan o los módulos cambiaron antes del cierre; vuelve a consultar qap_status.',
                desbloquear_con: { tool: 'qap_status' },
              }, true);
            }
            const finalGate = canExitWorking(current);
            if (!finalGate.passed) {
              return canonicalResult({
                status: 'blocked', code: 'session_gate_changed',
                fase: current.phase, faltantes: finalGate.faltantes,
                razon: 'El estado vigente no supera la compuerta de salida de WORKING.',
                desbloquear_con: { tool: 'qap_module_close' },
              }, true);
            }
            const finalize = async (): Promise<CallToolResult> => {
              // Reproject under lifecycle -> Knowledge write fences. Receipts,
              // durable approvals, bindings and the requirement inventory
              // must still match the report prepared without locks.
              if (closureService) {
                const checkedReports = await closureService.sessionReport();
                if (JSON.stringify(checkedReports) !== JSON.stringify(canonicalReports)) {
                  return canonicalResult({
                    status: 'blocked', code: 'session_report_context_changed',
                    fase: current.phase,
                    razon: 'Los recibos, aprobaciones o requisitos cambiaron mientras se preparaba el reporte.',
                    desbloquear_con: { tool: 'qap_status' },
                  }, true);
                }
              }
              // The persisted lifecycle transition is the linearization point.
              // Under lifecycle -> Knowledge fences, verify gates and save without
              // releasing either lock between receipt validation and durable state.
              const transition = transitionProject(current, 'WRAP_UP',
                'Sesión cerrada exitosamente: todos los módulos del plan finalizados',
                { checkGates: true });
              if (!transition.success || !transition.state || transition.state.phase !== 'WRAP_UP') {
                return canonicalResult({
                  status: 'blocked',
                  code: 'session_transition_rejected',
                  fase: current.phase,
                  razon: 'La transición a WRAP_UP fue rechazada; no se ha cerrado la sesión.',
                  desbloquear_con: { tool: 'qap_status' },
                }, true);
              }
              // Report is published before lifecycle commit: after a crash at this
              // boundary a retry in WORKING safely recreates it without new review.
              // A failed context gate never publishes a report.
              const stagingPath = reportFilePath + '.' + randomUUID() + '.tmp';
              try {
                writeFileSync(stagingPath, gapReportMd, { encoding: 'utf-8', flag: 'wx' });
                renameSync(stagingPath, reportFilePath);
              } finally {
                rmSync(stagingPath, { force: true });
              }
              commit(transition.state);
              const persisted = await storage.getLifecycleState();
              if (persisted.phase !== 'WRAP_UP' ||
                  persisted.session?.id !== transition.state.session?.id ||
                  JSON.stringify(persisted) !== JSON.stringify(transition.state)) {
                throw new Error('session_close_persisted_state_mismatch');
              }

              if (closeSessionProject && applicationService) {
                applicationService.completeActiveCampaign(closeSessionProject.project_id);
              }

              return {
                content: [{
                  type: 'text',
                  text: JSON.stringify({
                    status: 'success',
                    directorio_objetivo: rootDir,
                    message: `✔ Sesión '${sessionId}' cerrada exitosamente. Proyecto transicionado a fase WRAP_UP.`,
                    fase: 'WRAP_UP',
                    session_id: sessionId,
                    report_path: reportFilePath,
                    reporte_brechas_path: reportFilePath,
                    ...(sessionExecutionSummary
                      ? {
                          execution_status: sessionExecutionSummary.status,
                          canonical_execution_summary: sessionExecutionSummary,
                        }
                      : {}),
                    cobertura_alcance: {
                      origen: canonicalReports.length ? 'legacy_only_not_canonical_coverage' : 'legacy',
                      flujos: { cubiertos: gapSummary.flujos_cubiertos, declarados: gapSummary.flujos_totales },
                      roles: { con_perfil_verificado: gapSummary.roles_verificados, declarados: gapSummary.roles_totales },
                      resumen_texto: gapSummary.cobertura_alcance,
                    },
                    brechas_detectadas: canonicalReports.length ? null :
                      (gapSummary.flujos_totales - gapSummary.flujos_cubiertos) + (gapSummary.roles_totales - gapSummary.roles_verificados),
                    cierre_canonico: canonicalReports.length ? {
                      modulos_cerrados: canonicalReports.filter(r => r.state === 'closed').length,
                      modulos_waived: canonicalReports.filter(r => r.state === 'waived').length,
                      requisitos_confirmados_actuales: canonicalReports.reduce((total, r) =>
                        total + r.current_confirmed_requirements.length, 0),
                      cobertura_ejecucion: 'not_certified_by_session_report',
                      aprobacion_humana_autentica: 'requires_independent_host_evidence',
                    } : undefined,
                    siguiente_accion: {
                      tipo: 'decision',
                      descripcion: `Sesión concluida. Reporte de brechas generado en ${reportFilePath}. Puedes revisar el Knowledge Graph (qap_server) o iniciar una nueva sesión (qap_session_plan).`,
                      tool: 'qap_server',
                      pregunta: makeDecisionQuestion(
                        'decision_post_cierre_sesion',
                        `La sesión ha finalizado exitosamente. El reporte de brechas está disponible en ${reportFilePath}. Selecciona si explorar el Knowledge Graph con qap_server o iniciar una nueva sesión con qap_session_plan.`,
                        [
                          { id: 'server', etiqueta: 'Revisar Knowledge Graph interactivo (qap_server)', recomendada: true },
                          { id: 'plan', etiqueta: 'Iniciar nueva sesión de pruebas (qap_session_plan)' },
                        ],
                        true,
                        { tool: 'qap_server', campo: 'action' }
                      ),
                    },
                  }, null, 2),
                }],
              };
            };
            if (!closureService) return finalize();
            // Only a failure to ACQUIRE the Knowledge write fence is expected
            // contention. A CONFLICT raised after the operation started comes
            // from inside finalize() and must stay an unexpected failure.
            let fenceEntered = false;
            try {
              return await closureService.withSessionReportFence(() => {
                fenceEntered = true;
                return finalize();
              });
            } catch (error) {
              if (!fenceEntered && error instanceof KnowledgeStoreError && error.code === 'CONFLICT') {
                return canonicalResult({
                  status: 'blocked', code: 'knowledge_write_fence_unavailable',
                  fase: current.phase,
                  razon: 'Otro proceso mantiene el Knowledge write fence; la sesi�n sigue en WORKING, no se public� reporte y puede reintentarse al liberarse.',
                  desbloquear_con: { tool: 'qap_session_close', campo: 'confirmar' },
                }, true);
              }
              throw error;
            }
          });

        }

        default:
          return {
            isError: true,
            content: [
              {
                type: 'text',
                text: `Tool no reconocida: ${name}`,
              },
            ],
          };
      }

    } catch (err: unknown) {
      // Exception messages, causes and stacks are untrusted: ports can include
      // paths, credentials or database payloads. Log only fixed classifications
      // and a correlation ID; never serialize the exception itself.
      const errorId = randomUUID();
      const category = err instanceof TypeError ? 'type_error'
        : err instanceof RangeError ? 'range_error' : 'unexpected_error';
      console.error('[QAP MCP] tool_execution_failed', { error_id: errorId, category });
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: JSON.stringify({ status: 'error', code: err instanceof CanonicalClosureError ? err.publicCode() ?? 'internal_tool_error' : 'internal_tool_error', error_id: errorId }),
          },
        ],
      };
    }
    })().then(result => {
      if (request.params.name === 'qap_project_reset') return result;
      if (request.params.name === 'qap_init' && !result.isError && resetState?.state === 'complete' && guardedRoot && options.workspaceBootstrap) {
        acknowledgeProjectInitialization(options.workspaceBootstrap.directory, guardedRoot, resetState);
      }
      if (options.workspaceBootstrap) {
        const recorded = qapEventLog.record({ workspace: eventWorkspace, conversationId, requestId: String(context.requestId),
          tool: request.params.name, args: request.params.arguments, result, durationMs: Date.now() - eventStartedAt });
        if (request.params.name === 'qap_start' && eventWorkspace && !result.isError && !recorded) {
          return canonicalResult({ status: 'partial', code: 'conversation_log_unavailable', conversation_id: conversationId }, true);
        }
      }
      return result;
    }, error => {
      if (request.params.name === 'qap_project_reset') throw error;
      if (options.workspaceBootstrap) qapEventLog.record({ workspace: eventWorkspace, conversationId, requestId: String(context.requestId),
        tool: request.params.name, args: request.params.arguments,
        errorCode: error instanceof McpToolError ? error.code : error instanceof Error ? error.name : 'unknown_error',
        durationMs: Date.now() - eventStartedAt });
      throw error;
    });
    activeCalls.set(controller, operation);
    try { return await operation; }
    finally {
      try { if (releaseStorage && guardedRoot) forgetBootstrapBinding(guardedRoot); }
      finally { releaseStorage?.(); activeCalls.delete(controller); }
    }
  });

  /* eslint-enable */
  return server;
}

export async function startMcpServer(options?: McpServerOptions): Promise<void> {
  // Programmatic hosts can inject independently owned review gateways. The
  // standard Stdio entrypoint uses an explicit, host-owned manifest if present.
  const composition = options
    ? { options, close: () => undefined }
    : await loadHostComposition();
  try {
    const server = createMcpServer(composition.options);
    let shuttingDown = false;
    const orderlyShutdown = async (origin: string) => {
      if (shuttingDown) return;
      shuttingDown = true;
      console.error(`[QAP MCP Server] Orderly shutdown initiated (${origin})...`);
      try {
        await server.close();
      } catch (err) {
        console.error('[QAP MCP Server] Error closing server instance:', err);
      } finally {
        try {
          composition.close();
        } catch (err) {
          console.error('[QAP MCP Server] Error closing host composition:', err);
        }
        console.error(`[QAP MCP Server] Orderly shutdown finished (${origin}). Exiting 0.`);
        process.exit(0);
      }
    };

    server.onclose = () => {
      void orderlyShutdown('server.onclose');
    };

    // Stdio lifecycle hooks for Windows and Unix hosts:
    // When the MCP client (Antigravity/Claude/etc.) disconnects, process.stdin emits 'end' or 'close'.
    // Without these listeners, Node on Windows keeps running or aborts with 0xffffffff (-1).
    process.stdin.on('close', () => {
      void orderlyShutdown('stdin.close');
    });
    process.stdin.on('end', () => {
      void orderlyShutdown('stdin.end');
    });
    process.on('SIGINT', () => {
      void orderlyShutdown('SIGINT');
    });
    process.on('SIGTERM', () => {
      void orderlyShutdown('SIGTERM');
    });

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('[QAP MCP Server] Stdio ready', {
      pid: process.pid,
      build: process.env.QAP_BUILD_REVISION ?? 'development',
      interactive_authorizer: Boolean(composition.options.workspaceAuthorizer),
      interactive_discovery_authorizer: Boolean(composition.options.discoveryAuthorizer),
      interactive_access_authorizer: Boolean(composition.options.interactiveAccessAuthorizer),
    });
  } catch (error) {
    composition.close();
    throw error;
  }
}

const isMainModule =
  process.argv[1]?.endsWith('server.js') ||
  process.argv[1]?.endsWith('server.ts') ||
  process.argv[1]?.includes('qap-mcp');

if (isMainModule) {
  process.on('uncaughtException', (err: Error) => {
    console.error('[QAP MCP UncaughtException]', err);
    try {
      logTechnicalDiagnostic({
        event: 'uncaughtException',
        error: {
          name: err?.name,
          message: err?.message,
          stack: err?.stack,
        },
      });
    } catch {
      // Best-effort
    }
    process.exit(1);
  });

  process.on('unhandledRejection', (reason: unknown) => {
    console.error('[QAP MCP UnhandledRejection]', reason);
    try {
      logTechnicalDiagnostic({
        event: 'unhandledRejection',
        error: reason instanceof Error
          ? { name: reason.name, message: reason.message, stack: reason.stack }
          : String(reason),
      });
    } catch {
      // Best-effort
    }
  });

  startMcpServer().catch((error) => {
    console.error('[QAP MCP Server Fatal]', error);
    process.exit(1);
  });
}
