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
import { randomUUID } from 'node:crypto';
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
  type ModuleLifecycleState,
  type IngestProposal,
  type RuleEntry,
  type CategoryWaiver,
  type ModuleCandidate,
  type ProjectRepoMap,
  type ModuleCandidatesFile,
} from '@qap/shared';
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
import { InteractiveAccess, interactiveBlocked } from './interactive-access.js';
import { loadHostComposition } from './host-composition.js';
import { authorizationDiagnostic } from './authorization-diagnostics.js';
import { logTechnicalDiagnostic } from './technical-diagnostics.js';
import { ToolDispatcher, McpToolError, type IMcpToolHandler } from './dispatcher.js';
import { TOOLS } from './tool-catalog.js';
import { StatusHandler } from './handlers/status.handler.js';
import { ContextHandler } from './handlers/context.handler.js';
import { DiscoveryHandler, type DiscoveryAuthorization } from './handlers/discovery.handler.js';
import { CanonicalInterviewService } from './handlers/canonical-interview-service.js';
import { CanonicalClosureError } from './handlers/canonical-closure-error.js';
import { CanonicalClosureService } from './handlers/canonical-closure-service.js';
import { renderCanonicalSessionReport } from './handlers/canonical-session-report.js';
import { projectRoot as authorizedProjectRoot, result as canonicalResult } from './handlers/state-services.js';
import { hasLegacyViewContext, legacyInterviewBlocked } from './handlers/legacy-discovery-contract.js';
import { CleanHandler } from './handlers/clean.handler.js';
import { PlanHandler } from './handlers/plan.handler.js';
import { TestHandler, type TestNavigationAuthorization } from './handlers/test.handler.js';
import { ReportHandler } from './handlers/report.handler.js';
import { checkPlaywrightBrowser, PLAYWRIGHT_INSTALL_COMMAND, detectarSubcarpetaWorkspace } from './handlers/state-runtime.js';
import type { StateDependencies } from './handlers/state-services.js';
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
  readonly handlers?: readonly IMcpToolHandler[];
  readonly workspaceAuthorizer?: IWorkspaceAuthorizer;
  readonly hostRegistryPath?: string;
  readonly discoveryAuthorizer?: IDiscoveryAuthorizer;
  readonly interactiveAccessAuthorizer?: IDiscoveryAuthorizer;
  readonly interactiveAccessEnabled?: boolean;
  readonly hostDiscoveryRegistryPath?: string;
}

export function createMcpServer(options: McpServerOptions = {}): Server {
  const preparationCommand = `"${process.execPath}" "${fileURLToPath(new URL('../../../scripts/qap-authorize-workspace.mjs', import.meta.url))}" <workspace-absoluto>`;
  const authorizedRoots = [...(options.projectRoots ?? [process.cwd()])];
  const workspaceBindings = [...(options.knowledgeBindings ?? [])];
  const pendingPreparations = new Map<string, Promise<void>>();
  const dependencies: StateDependencies = {
    projectRoots: authorizedRoots,
    knowledgeBindings: workspaceBindings,
    provisionalInventory: options.provisionalInventory ?? Boolean(options.workspaceBootstrap),
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

  const migrated = new Set(['qap_status', 'qap_clean', 'qap_context_set', 'qap_discover', 'qap_plan', 'qap_test', 'qap_report']);
  const dispatcher = new ToolDispatcher(TOOLS.filter(tool => !migrated.has(tool.name)).map(tool => tool.name));

  dispatcher.register(new CleanHandler(dependencies));
  dispatcher.register(new ContextHandler(dependencies));
  const authorizedProfilesPolicy = Array.from(
    new Set([
      ...(options.discoveryAuthorizations ?? []).flatMap((a) => a.authorizedProfiles ?? []),
      ...(options.testAuthorizations ?? []).flatMap((a) => a.authorizedProfiles ?? []),
    ])
  );
  const interactiveAccess = options.workspaceBootstrap || options.interactiveAccessEnabled
    ? new InteractiveAccess(
        dependencies,
        options.interactiveAccessAuthorizer,
        undefined,
        undefined,
        authorizedProfilesPolicy.length > 0 ? { authorizedProfiles: authorizedProfilesPolicy } : undefined
      )
    : undefined;
  dispatcher.register(new StatusHandler({ ...runtimeDependencies, interactiveAccess,
    browser: checkPlaywrightBrowser, view: buildViewDiscoveryContext }));
  dispatcher.register(new DiscoveryHandler(
    dependencies,
    options.discoveryAuthorizations,
    options.discoveryAuthorizer,
    options.hostDiscoveryRegistryPath,
    interactiveAccess,
  ));
  dispatcher.register(new PlanHandler(dependencies));
  dispatcher.register(new TestHandler(dependencies, {
    testAuthorizations: options.testAuthorizations,
    interactiveAccess,
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
0. Si el usuario dice «Quiero probar un sistema» o quiere probar una aplicación, invoca qap_status inmediatamente. No requiere qap_start. La preparación local segura es automática solo en raíces autorizadas. targetPath nunca concede permisos. No instales, navegues, autentiques ni ejecutes sin autorización correspondiente. Si falta información pregunta una vez; si falta autorización sigue la acción local concreta del host.
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
11. Al cerrar la sesión, presenta al usuario el resumen del reporte de brechas generado.`,
    }
  );


  // Manejador de lista de tools
  const authInputProperties = TOOLS.find(tool => tool.name === 'qap_auth_add')?.inputSchema.properties ?? {};
  server.setRequestHandler(ListToolsRequestSchema, () =>
    Promise.resolve({ tools: [...TOOLS, ...dispatcher.listTools().filter(tool => !migrated.has(tool.name))] }));

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
              text: 'Inicia revisando el estado de QAP con qap_status y guíame paso a paso sin muros de texto.',
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
      return closeTransport();
    });
    return closeOperation;
  };
  server.setRequestHandler(CallToolRequestSchema, async (request, sdkContext) => {
    if (closing) return { isError: true, content: [{ type: 'text', text: JSON.stringify({ code: 'cancelled' }) }] };
    const controller = new AbortController();
    const context = { ...sdkContext, signal: AbortSignal.any([controller.signal, ...(sdkContext.signal ? [sdkContext.signal] : [])]) };
    const operation = (async (): Promise<CallToolResult> => {
    const { name, arguments: rawArgs } = request.params;
    if (name === 'qap_auth_add' && Object.keys(rawArgs ?? {}).some(key => !Object.hasOwn(authInputProperties, key))) {
      return interactiveBlocked('agent_auth_material_not_supported');
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
    if (options.hostRegistryPath) {
      syncAuthorizedRootsFromDisk(options.hostRegistryPath, authorizedRoots);
    }
    if (name === 'qap_auth_provision') {
      if (!interactiveAccess) return canonicalResult({ status: 'blocked', code: 'credential_dialog_host_unavailable' }, true);
      return await interactiveAccess.provision(rawArgs ?? {}, context.signal);
    }
    if (options.workspaceBootstrap) {
      const candidate = rawArgs?.targetPath;
      let targetPath = typeof candidate === 'string' ? candidate : authorizedRoots.length === 1 ? authorizedRoots[0] : undefined;
      authorizationDiagnostic('workspace_request', { tool: name, targetPath, authorizerConfigured: Boolean(options.workspaceAuthorizer) });
      if (!targetPath) return canonicalResult({ status: 'blocked', category: 'human_authorization', code: 'workspace_selection_required',
        desbloquear_con: { mecanismo: 'workspace_selection', descripcion: 'Indica la ruta absoluta de una carpeta existente en targetPath; luego reintenta qap_status.' } });
      let isAuthorized = false;
      try {
        authorizedProjectRoot({ targetPath }, dependencies, true);
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
        if (options.workspaceAuthorizer) {
          const authResult = await options.workspaceAuthorizer.requestAuthorization(
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
      request.params.arguments = { ...rawArgs, targetPath };
      if (['qap_status', 'qap_init', 'qap_context_set'].includes(name)) {
        try {
          const suppliedUrl = rawArgs?.base_url ?? rawArgs?.environments;
          const url = name === 'qap_context_set' && typeof suppliedUrl === 'string' ? suppliedUrl : undefined;
          // Validate before performing any canonical writes.
          await dependencies.prepareWorkspace!(realpathSync(targetPath), name === 'qap_context_set' && new ContextHandler(dependencies).validateArguments(request.params.arguments) ? url : undefined);
        } catch (error: unknown) {
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
    if (dispatcher.has(name)) return dispatcher.dispatch(request.params, { requestId: context.requestId, signal: context.signal ?? new AbortController().signal });
    // Provisioned hosts keep their existing composition, but legacy writers must
    // obey the same root boundary as migrated handlers. No tool argument grants it.
    if (!options.workspaceBootstrap && options.projectRoots !== undefined) {
      try { authorizedProjectRoot(request.params.arguments, dependencies, true); }
      catch { return canonicalResult({ status: 'blocked', category: 'human_authorization', code: 'workspace_authorization_required',
        desbloquear_con: { mecanismo: 'local_host', descripcion: 'Selecciona una raíz autorizada por este host. No se amplían los permisos del manifiesto desde argumentos MCP.' } }); }
    }
    // Legacy invocation boundary; removed incrementally when handlers migrate.
    /* eslint-disable @typescript-eslint/no-base-to-string, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/require-await, @typescript-eslint/no-unnecessary-type-assertion, @typescript-eslint/no-unsafe-return */
    const args = (request.params.arguments || {}) as Record<string, unknown>;
    const rootDir = args.targetPath ? resolve(String(args.targetPath)) : process.cwd();

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
          if (!interactiveAccess) return interactiveBlocked('authentication_authorization_required');
          return await interactiveAccess.login(args, context.signal).catch(() => interactiveBlocked('authentication_failed'));
        }

        case 'qap_auth_list': {
          const profiles = interactiveAccess
            ? await interactiveAccess.profileStatuses(authorizedProjectRoot(args, dependencies, false), args) : [];
          return canonicalResult({ status: 'success', count: profiles.length, profiles });
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
                        directorio_objetivo: rootDir,
                        error: 'Extensión no permitida. Solo se admiten archivos .md, .markdown o .txt.',
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
                        directorio_objetivo: rootDir,
                        error: 'Tamaño de archivo excedido: máximo 512 KB.',
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
                    modulos_sugeridos_para_plan: suggestedModules,
                    modulos_candidatos_generados: candidateGenResult?.candidatesFile?.candidates || [],
                    candidatos_rechazados: candidateGenResult?.rejectedCandidates || [],
                    flujos_descartados: candidateGenResult?.flujos_descartados || [],
                    roles_descartados: discardedIngestRoles,
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

          // Soporte de desde_candidatos y adicionales (C6)
          let resolvedModules: Array<{ module: string; path: string; priority: string; flujos?: string[] }> = [];

          if (Array.isArray(args.desde_candidatos) && args.desde_candidatos.length > 0) {
            const candidatesPath = join(qaDir, 'project', 'module-candidates.json');
            let candidatesFile: ModuleCandidatesFile | null = null;
            if (existsSync(candidatesPath)) {
              try {
                candidatesFile = JSON.parse(readFileSync(candidatesPath, 'utf-8'));
              } catch { /* empty */ }
            }

            const allCandidates: ModuleCandidate[] = candidatesFile?.candidates || [];

            for (const item of args.desde_candidatos) {
              const candId = typeof item === 'string' ? item.trim() : (item?.id ? String(item.id).trim() : '');
              const candPathOverride = typeof item === 'object' && item?.path ? String(item.path).trim() : undefined;

              const cand = allCandidates.find((c) => c.id === candId);
              if (!cand) {
                return {
                  content: [
                    {
                      type: 'text',
                      text: JSON.stringify(
                        {
                          status: 'blocked',
                          directorio_objetivo: rootDir,
                          fase: 'SCOPING',
                          razon: `El candidato con id '${candId}' no existe en module-candidates.json.`,
                          siguiente_accion: {
                            tipo: 'decision',
                            descripcion: `El id de candidato '${candId}' no es válido. Selecciona un candidato existente o añade módulos con adicionales.`,
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

              const finalPath = candPathOverride || cand.ruta;
              if (!finalPath) {
                const preguntaRuta: Pregunta = {
                  id: `scoping.ruta_candidato.${cand.id}`,
                  texto: `Indica la ruta HTTP/URL para el módulo '${cand.nombre}' (por ejemplo: /catalog):`,
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
                          razon: `El candidato '${cand.nombre}' (id: ${cand.id}) no tiene una ruta definida. Aporta la ruta para continuar.`,
                          siguiente_accion: {
                            tipo: 'decision',
                            descripcion: `El candidato '${cand.nombre}' requiere que se especifique su ruta URL.`,
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

              resolvedModules.push({
                module: cand.nombre,
                path: finalPath,
                priority: 'medium',
                flujos: cand.flujos || [],
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
            if (lifecycleState.phase === 'WRAP_UP' && lifecycleState.modules?.[mName]?.state === 'closed') {
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
                if (!curr.modules[item.module]) {
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
                    auth: freshState.session?.auth,
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

          if (action === 'close' && userConfirmed && !hasLegacyViewContext(rootDir, moduleName)) {
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
          const tiene50Porciento = totalAplicables > 0 ? (sustantivasCount / totalAplicables >= 0.50) : true;
          const conteoTexto = `${sustantivasCount} de ${totalAplicables} categorías con contenido${covCurrent.diferidas > 0 ? `, ${covCurrent.diferidas} diferidas` : ''}`;

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
            if (modEntry.state === 'planned' && !args.accept_gaps) {
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
            if (curr.modules?.[moduleName]?.state === 'observed' && targetState === 'closed') {
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
          const gapReportMd = canonicalReports.length
            ? renderCanonicalSessionReport(canonicalReports) +
              (legacyReportMd ? '\n---\n\n# Módulos legacy no vinculados\n\n' + legacyReportMd : '')
            : legacyReportMd;
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
    })();
    activeCalls.set(controller, operation);
    try { return await operation; }
    finally { activeCalls.delete(controller); }
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
