import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, join, basename } from 'node:path';

import { SchemaValidator, filterValidRoles, normalizeSlug, type ProjectContext, type AuthProfile, type RuleEntry, type CategoryWaiver, type ModuleCandidate } from '@qap/shared';
import { FileSystemStorage, detectarServiciosConEvidencia, generarScan, detectarDocumentosProyecto, parsePrdContent } from '@qap/knowledge';
import { canExitOnboarding, canExitScoping, obtenerSiguientePreguntaOnboarding, computeApplicableCategories, computeCoverage, generateNextInterviewBatch, sanitizeDomString, type ViewDiscoveryContext } from '@qap/engine';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { getPhaseGuidance, buildInterviewNextAction, type SiguienteAccion } from '../guidance.js';
import type { IMcpToolHandler } from '../dispatcher.js';
import type { InteractiveAccess } from '../interactive-access.js';
import { getVersionDiagnostic } from '../version-diagnostic.js';

import { binding, definition, validateBase, projectRoot, readContext, readEnvironment, isObject, type StateDependencies, type LegacyEnvironment, knowledgeStatus, result, safeDocument, assertProjectSegment } from './state-services.js';
import { ModuleObservationBridge } from './module-observation-bridge.js';
import { PLAYWRIGHT_INSTALL_COMMAND, detectarSubcarpetaWorkspace } from './state-runtime.js';
import { discoveryIntegration, hasLegacyViewContext, legacyInterviewBlocked } from './legacy-discovery-contract.js';

export class StatusHandler implements IMcpToolHandler {
  readonly definition = definition('qap_status');
  constructor(private readonly dependencies: StateDependencies & { interactiveAccess?: InteractiveAccess; browser: () => Promise<{ disponible: boolean }>; view: (root: string, module: string, view: string, route: string) => ViewDiscoveryContext }) {}
  validateArguments(args: unknown): boolean { return validateBase(args, ['targetPath']); }
  async execute(raw: unknown): Promise<CallToolResult> {
    const rootDir = projectRoot(raw, this.dependencies, false);
    const appService = this.dependencies.applicationService;
    if (appService) {
      const tombstone = appService.getTombstoneByRoot(rootDir);
      if (tombstone) {
        return result(
          {
            status: 'blocked',
            category: 'human_authorization',
            code: 'project_deleted_tombstone',
            initialized: false,
            deleted_project_id: tombstone.project_id,
            recovery_available: true,
            auto_recreation_blocked: true,
            desbloquear_con: {
              mecanismo: 'qap_project',
              tool: 'qap_project',
              descripcion: 'Este proyecto fue eliminado explícitamente. Recupera con qap_project(action="recover") o crea uno nuevo explícitamente.',
            },
          },
          true,
        );
      }
    }
    const knowledge = await knowledgeStatus(rootDir, this.dependencies);
    const canonicalModules: unknown[] = [];
    // A terminal state in lifecycle.json is not proof of a valid canonical
    // closure. Track host-bound modules until their durable closure validates.
    const unresolvedCanonicalModules = new Set<string>();
    let pendingCanonicalInterview: string | undefined;
    try {
      const bound = binding(rootDir, this.dependencies);
      if (bound?.moduleBindings?.length) {
        const bridge = new ModuleObservationBridge(bound.store, { ...bound, projectRoot: rootDir });
        const boundNames = [...new Set(bound.moduleBindings.map(b => b.plannedName))];
        for (const name of boundNames) unresolvedCanonicalModules.add(name);
        // Verify every host-bound closure. The 16-item limit belongs only to
        // presentation; it must never cap the session-close guidance gate.
        for (const [index, name] of boundNames.entries()) {
          const closureStatus = await this.dependencies.canonicalClosures?.get(rootDir)?.status(name);
          if (closureStatus?.state === 'closed' || closureStatus?.state === 'waived') {
            unresolvedCanonicalModules.delete(name);
          }
          if (index < 16) {
            const interview = await this.dependencies.canonicalInterviews?.get(rootDir)?.status(name);
            // Only resume questions actually held by the host in the current
            // canonical context. No generated questions, implied approval, or
            // legacy YAML is needed merely to recommend a continuation.
            if (
              !pendingCanonicalInterview &&
              closureStatus?.state !== 'closed' &&
              closureStatus?.state !== 'waived' &&
              interview?.availability === 'general_questions_available' &&
              typeof interview.pending_questions === 'number' &&
              interview.pending_questions > 0
            ) {
              pendingCanonicalInterview = name;
            }
            canonicalModules.push({
              plannedName: name,
              ...await bridge.project(name),
              interview: interview ?? {
                availability: 'host_runtime_absent', human_review_required: true, coverage: 'not_certified' },
              closure: closureStatus ?? { state: 'working', ready_for_closure: false },
            });
          }
        }


      }
    } catch { canonicalModules.push({ association_status: 'unavailable', coverage: 'unknown', human_review_required: true }); }
    const legacy = await this.inspectLegacyState(rootDir);
    const text = legacy.content[0];
    if (text.type !== 'text') return legacy;
    const payload = JSON.parse(text.text) as Record<string, unknown>;
    // Version diagnosis is independent from Knowledge and lifecycle so it is
    // present even for a fresh workspace in ONBOARDING.
    payload.version_diagnostic = await getVersionDiagnostic({
      logPath: join(rootDir, '.qa', 'runtime', 'qap-version-diagnostics.jsonl'),
      log: Boolean(this.dependencies.prepareWorkspace && existsSync(join(rootDir, '.qa'))),
    });
    if (this.dependencies.prepareWorkspace && payload.fase === 'ONBOARDING') {
      const contextFile = join(rootDir, '.qa', 'project', 'context.yaml');
      const context = existsSync(contextFile) ? readContext(contextFile) : null;
      const rawScanDocs = (payload.scan as { documentos?: Array<{ path: string; es_ingerible?: boolean; tamano_bytes?: number; categoria?: string }> } | undefined)?.documentos ?? [];
      const docs = rawScanDocs.filter((d) => d && d.es_ingerible !== false && (typeof d.tamano_bytes !== 'number' || d.tamano_bytes > 0) && d.categoria !== 'placeholder' && d.categoria !== 'archivo_vacio');
      const service = payload.detectedService as { url?: string } | undefined;
      const bound = binding(rootDir, this.dependencies);
      const application = bound ? await bound.store.get(bound.applicationId, 'application', bound.applicationId) : undefined;
      if (!context?.base_url && application?.entity.base_url) {
        payload.siguiente_accion = { tipo: 'trabajo', tool: 'qap_context_set', argumentos: { targetPath: rootDir, base_url: application.entity.base_url, source: 'inferred' },
          descripcion: 'Recupera la ubicación ya registrada desde Knowledge con los argumentos indicados. No vuelvas a preguntar su URL; esto no autoriza navegación.' };
      } else if (!context?.base_url && !service?.url && docs.length === 0) {
        const texto = '¿Dónde está el sistema que quieres probar? Puedes proporcionarme su URL o indicarme un proyecto local';
        payload.siguiente_accion = { tipo: 'entrevista', descripcion: texto, tool: 'qap_context_set', pregunta: {
          id: 'onboarding.system_location', texto, render_texto: texto, formato: 'abierta', opciones: [], permite_otra: true,
          registrar_con: { tool: 'qap_context_set', campo: 'base_url' },
        } };
        payload._guidance_for_assistant = texto + '. Si indica otro proyecto local, primero resuelve su raíz autorizada con qap_status. Nunca uses una ruta local como base_url.';
        payload.onboarding = { category: 'missing_information', terminal: false, inventory: 'provisional', application_registered: false };
      } else if (docs.length > 0 && !context?.source_of_truth?.declared) {
        payload.siguiente_accion = { tipo: 'trabajo', tool: 'qap_context_ingest', descripcion: `Lee '${docs[0].path}' e ingiere únicamente propuestas con evidencia antes de preguntar. No confirma requisitos ni módulos.` };
      }
    }
    const nextAction = payload.siguiente_accion as SiguienteAccion | undefined;
    // Never recommend qap_session_close based only on the legacy lifecycle:
    // the actual session-close gate also requires every bound canonical module
    // to have a host-authorized durable closure.
    if (
      payload.fase === 'WORKING' &&
      nextAction?.tool === 'qap_session_close' &&
      unresolvedCanonicalModules.size > 0
    ) {
      const pending = [...unresolvedCanonicalModules];
      const first = pending[0];
      const description = `La sesión no puede cerrarse: los módulos ${pending.join(', ')} aún no cuentan con un cierre canónico válido. Revisa su cierre y aprobación mediante qap_module_close; si hay un registro durable inconsistente, se requiere intervención del host antes de reintentar.`;
      payload.siguiente_accion = {
        tipo: 'trabajo',
        descripcion: description,
        tool: 'qap_module_close',
        module: first,
        modulo: first,
      } satisfies SiguienteAccion;
      payload._guidance_for_assistant = description;
      payload.canonical_pending_closure_modules = pending;
    }
    if (payload.fase === 'WORKING' && pendingCanonicalInterview) {
      const description = `El módulo '${pendingCanonicalInterview}' tiene una pregunta canónica pendiente del host. Reanúdala mediante qap_rules_set con canonical_interview.action=next; la respuesta requiere revisión humana independiente antes de acreditar cobertura o cerrar.`;
      payload.siguiente_accion = {
        tipo: 'trabajo',
        tool: 'qap_rules_set',
        module: pendingCanonicalInterview,
        modulo: pendingCanonicalInterview,
        canonical_interview: { action: 'next' },
        descripcion: description,
      } satisfies SiguienteAccion;
      payload._guidance_for_assistant = description;
    }
    const activeAppProject = appService ? appService.findActiveProjectByRoot(rootDir) : null;
    const applicationSnapshot = activeAppProject && appService ? appService.resumeProject(activeAppProject.project_id) : undefined;
    return result({ ...payload, knowledge: this.dependencies.prepareWorkspace && knowledge.state === 'unbound' ? { state: 'prepared', context_present: false, next: 'await_application_location' } : knowledge, canonical_modules: canonicalModules,
      ...(applicationSnapshot ? {
        application: {
          project_id: applicationSnapshot.project.project_id,
          project_status: applicationSnapshot.project.status,
          campaign_id: applicationSnapshot.campaign?.campaign_id ?? null,
          mode: applicationSnapshot.campaign?.mode ?? null,
          progress: applicationSnapshot.progress,
          pending_decision: applicationSnapshot.pending_decision,
          recovery: applicationSnapshot.recovery,
          capabilities: applicationSnapshot.capabilities,
        },
      } : {}),
      canonical_bridge: { absence_does_not_imply_no_observations: true, coverage: 'partial', human_review_required: true },
      integration: { ...discoveryIntegration, module_association: 'inspect_canonical_modules' }, provenance: { knowledge: 'IKnowledgeStore', onboarding: 'legacy_files', hallazgos_workspace: 'workspace_inspection', preflight: 'runtime' }, coverage: 'partial_inventory_not_test_verdicts' });
  }
  private async inspectLegacyState(rootDir: string): Promise<CallToolResult> {
    const appService = this.dependencies.applicationService;
    const qaDir = resolve(rootDir, '.qa');
    const initialized = existsSync(qaDir);

    let projectName = 'No inicializado';
    let environments: string[] = [];
    let moduleCount = 0;
    let profileCount = 0;
    let executionCount = 0;

    let parsedContext: ProjectContext | null = null;
    let parsedEnv: LegacyEnvironment | null = null;
    let profilesList: AuthProfile[] = [];
    let contextState = 'missing';
    const readWarnings: string[] = [];

    if (initialized) {
      const contextPath = join(qaDir, 'project', 'context.yaml');
      if (existsSync(contextPath)) {
        try {
          parsedContext = readContext(contextPath);
          contextState = 'available';
          projectName = parsedContext?.project_name || projectName;
        } catch {
          contextState = 'incompatible';
          readWarnings.push('legacy_context_unreadable_or_incompatible');
        }
      }

      const envPath = join(qaDir, 'project', 'environments.yaml');
      if (existsSync(envPath)) {
        try {
          parsedEnv = readEnvironment(envPath);
          environments = Object.keys(parsedEnv?.environments || {});
        } catch {
          readWarnings.push('legacy_environment_unreadable');
        }
      }

      const indexPath = join(qaDir, 'modules', 'index.json');
      const fallbackIndexPath = join(qaDir, 'index.json');
      if (existsSync(indexPath)) {
        try {
          const parsed: unknown = JSON.parse(readFileSync(indexPath, 'utf-8'));
          moduleCount = Array.isArray(parsed) ? parsed.length : 0;
        } catch {
          moduleCount = 0;
        }
      } else if (existsSync(fallbackIndexPath)) {
        try {
          const parsed: unknown = JSON.parse(readFileSync(fallbackIndexPath, 'utf-8'));
          moduleCount = Array.isArray(parsed) ? parsed.length : 0;
        } catch {
          moduleCount = 0;
        }
      } else {
        const modulesDir = join(qaDir, 'modules');
        if (existsSync(modulesDir)) {
          moduleCount = readdirSync(modulesDir).filter((f) => !f.startsWith('.') && f !== 'index.json').length;
        }
      }

      const profilesFile = join(qaDir, 'project', 'auth', 'profiles.json');
      if (this.dependencies.interactiveAccess) {
        profilesList = await this.dependencies.interactiveAccess.profiles(rootDir);
        profileCount = profilesList.length;
      } else if (existsSync(profilesFile)) {
        try {
          const parsed: unknown = JSON.parse(readFileSync(profilesFile, 'utf-8'));
          profilesList = isObject(parsed) && Array.isArray(parsed.profiles) ? parsed.profiles as AuthProfile[] : [];
          profileCount = profilesList.length;
        } catch {
          // Ignore
        }
      }

      const execDir = join(qaDir, 'executions');
      if (existsSync(execDir)) {
        executionCount = readdirSync(execDir).filter((f) => f.endsWith('.json')).length;
      }
    }

    const validator = new SchemaValidator();

    // Detección automática de servicios y URLs en el repo con evidencia (E1c / E0c)
    const serviciosConEvidencia = detectarServiciosConEvidencia(rootDir);
    const detectedService = serviciosConEvidencia.length > 0
      ? { url: serviciosConEvidencia[0].url, label: serviciosConEvidencia[0].label, evidencia: serviciosConEvidencia[0].evidencia }
      : undefined;

    const scan = generarScan(rootDir);
    const hallazgos = detectarDocumentosProyecto(rootDir);
    hallazgos.servicios = serviciosConEvidencia;

    const subcarpetaRepo = scan.documentos.length === 0 ? detectarSubcarpetaWorkspace(rootDir) : null;
    const advertencias: string[] = [...readWarnings];
    if (subcarpetaRepo) {
      advertencias.push(
        `targetPath parece una subcarpeta del repositorio ${subcarpetaRepo}; para analizar todo el proyecto usa la raíz como targetPath`
      );
    }

    if (scan.documentos.length > 0) {
      const topDoc = scan.documentos[0];
      try {
        const fullDocPath = safeDocument(rootDir, topDoc.path);
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

    const browserCheck = await this.dependencies.browser();
    const preflight = {
      navegador_qap: (browserCheck.disponible ? 'ok' : 'falta'),
      comando_instalacion: PLAYWRIGHT_INSTALL_COMMAND,
    };
    const installAccion: SiguienteAccion = {
      tipo: 'trabajo',
      comando: PLAYWRIGHT_INSTALL_COMMAND,
      descripcion: `Instalar navegador Chromium para Playwright sin consultar al usuario. Ejecuta '${PLAYWRIGHT_INSTALL_COMMAND}'.`,
    };

    if (!initialized) {
      const preg = obtenerSiguientePreguntaOnboarding(null, null, hallazgos, null);
      const statusNextAction = !browserCheck.disponible
        ? installAccion
        : {
            tipo: 'entrevista' as const,
            descripcion: 'Proyecto no inicializado. Comienza el onboarding respondiendo a la fuente de verdad.',
            tool: 'qap_init',
            pregunta: preg ?? undefined,
          };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                status: 'success',
                directorio_objetivo: rootDir,
                initialized: false,
                context_state: contextState,
                preflight,
                navegador_qap: preflight.navegador_qap,
                projectName: basename(rootDir),
                environments: [],
                stats: {
                  modules: 0,
                  authProfiles: 0,
                  executions: 0,
                },
                validatorReady: Boolean(validator),
                detectedService,
                scan,
                hallazgos_workspace: hallazgos,
                advertencias,
                siguiente_accion: statusNextAction,
                _guidance_for_assistant: !browserCheck.disponible
                  ? `Ejecuta '${PLAYWRIGHT_INSTALL_COMMAND}' sin consultar al usuario.`
                  : 'NO expliques listas de pasos futuros. Haz al usuario la pregunta con ask_question: ' + (preg?.texto || ''),
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // Caso inicializado
    const storage = new FileSystemStorage({ rootDir });
    const lifecycleState = await storage.getLifecycleState();
    const currentPhase = lifecycleState.phase;

    let faltantes: Array<{ campo: string; motivo: string }> = [];
    if (currentPhase === 'ONBOARDING') {
      const gate = canExitOnboarding(parsedContext, parsedEnv);
      faltantes = gate.faltantes;
    } else if (currentPhase === 'SCOPING') {
      const gate = canExitScoping(lifecycleState, profilesList);
      faltantes = gate.faltantes;
    }

    const estadosModulos: Record<string, string> = {};
    const modulesGuidance: Record<string, { state: string; hasPendingHypotheses?: boolean }> = {};
    for (const [k, v] of Object.entries(lifecycleState.modules || {})) {
      assertProjectSegment(k);
      estadosModulos[k] = v.state;
      let hasPendingHypotheses = false;
      if (v.state === 'observed' || v.state === 'interviewing') {
        try {
          const rulesFile = await storage.getModuleRules(k);
          const rules = rulesFile?.rules || [];
          hasPendingHypotheses = rules.some((r) => r.source === 'dom' && r.status === 'inferred');
        } catch {
          hasPendingHypotheses = false;
        }
      }
      modulesGuidance[k] = {
        state: v.state,
        hasPendingHypotheses,
      };
    }

    let interviewAction: SiguienteAccion | undefined;
    if (currentPhase === 'WORKING') {
      const planModules = (lifecycleState.session?.plan || []).map((p) => p.module);
      const candidateModules = [
        ...planModules,
        ...Object.keys(lifecycleState.modules || {}).filter((m) => !planModules.includes(m)),
      ];

      for (const modName of candidateModules) {
        assertProjectSegment(modName);
        const modState = lifecycleState.modules?.[modName]?.state;
        if (modState === 'interviewing' || modState === 'observed' || modState === 'consolidated') {
          if (!hasLegacyViewContext(rootDir, modName)) {
            const blocked = legacyInterviewBlocked().content[0];
            if (blocked.type === 'text') {
              const data = JSON.parse(blocked.text) as { siguiente_accion: SiguienteAccion };
              interviewAction = data.siguiente_accion;
            }
            break;
          }
        }
        if (modState === 'interviewing' || modState === 'observed') {
          const planItem = (lifecycleState.session?.plan || []).find((p) => p.module === modName);
          const route = planItem?.path || '';
          const vContext = this.dependencies.view(rootDir, modName, 'default', route);
          let rulesList: RuleEntry[] = [];
          let waiversList: CategoryWaiver[] = [];
          try {
            const rf = await storage.getModuleRules(modName);
            rulesList = rf?.rules || [];
            waiversList = rf?.category_waivers || [];
          } catch { /* empty */ }

          const validRolesList = filterValidRoles(parsedContext?.roles || []);
          const appCats = computeApplicableCategories(vContext, validRolesList.length);
          const cov = computeCoverage(appCats, rulesList, waiversList, 'default');
          if (!cov.completa) {
            const nextQs = generateNextInterviewBatch(vContext, rulesList, appCats, waiversList);
            interviewAction = buildInterviewNextAction({
              module: modName,
              view: 'default',
              route,
              questions: nextQs,
              applicableCategories: appCats,
              coverage: cov,
            });
            break;
          }
        }
      }
    }

    let reportPath: string | undefined;
    if (currentPhase === 'WRAP_UP') {
      const sessionsDir = join(qaDir, 'project', 'sessions');
      if (lifecycleState.session?.id) {
        assertProjectSegment(lifecycleState.session.id);
        const candidate = join(sessionsDir, `${lifecycleState.session.id}.report.md`);
        if (existsSync(candidate)) {
          reportPath = candidate;
        }
      }
      if (!reportPath && existsSync(sessionsDir)) {
        try {
          const reports = readdirSync(sessionsDir).filter((f) => f.endsWith('.report.md'));
          if (reports.length > 0) {
            reports.sort().reverse();
            reportPath = join(sessionsDir, reports[0]);
          }
        } catch { /* empty */ }
      }
    }

    let moduleCandidatesList: ModuleCandidate[] | undefined;
    const candidatesFilePath = join(qaDir, 'project', 'module-candidates.json');
    if (existsSync(candidatesFilePath)) {
      try {
        const cf = JSON.parse(readFileSync(candidatesFilePath, 'utf-8')) as { candidates?: ModuleCandidate[] };
        moduleCandidatesList = cf.candidates;
      } catch { /* empty */ }
    }

    const activeAppProject = appService?.findActiveProjectByRoot(rootDir);
    const resumeSnapshot = activeAppProject && appService ? appService.resumeProject(activeAppProject.project_id) : undefined;
    const serviceCases = activeAppProject && appService ? appService.listServiceCases(activeAppProject.project_id) : [];
    const moduleKey = (name: string) => resumeSnapshot?.modules.find(module =>
      module.title.toLowerCase() === name.toLowerCase())?.key ?? normalizeSlug(name);
    const baseUrl = resumeSnapshot?.environment?.base_url;
    const modulesWithInventory = new Set<string>();
    if (baseUrl) {
      for (const item of lifecycleState.session?.plan ?? []) {
        try {
          const target = new URL(item.path, baseUrl).href;
          if (resumeSnapshot?.partial_inventories?.some(inventory => inventory.target_url === target && inventory.views_count > 0)) {
            modulesWithInventory.add(item.module);
          }
        } catch { /* An invalid plan route cannot match a persisted inventory. */ }
      }
    }
    const currentKnowledge = this.dependencies.provisionalInventory ? await knowledgeStatus(rootDir, this.dependencies) : undefined;
    const guidance = getPhaseGuidance(currentPhase, {
      investigateBeforeScoping: this.dependencies.provisionalInventory && !(currentKnowledge && 'counts' in currentKnowledge && (currentKnowledge.counts.observation?.available ?? 0) > 0),
      faltantes,
      plan: lifecycleState.session?.plan,
      modules: modulesGuidance,
      moduleCandidates: moduleCandidatesList,
      interviewAction,
      modulesWithInventory,
      modulesWithCases: new Set((lifecycleState.session?.plan ?? []).filter(item =>
        serviceCases.some(c => c.module_key === moduleKey(item.module))).map(item => item.module)),
      reportPath,
      hallazgos,
      context: parsedContext,
      lifecycle: lifecycleState,
      environments: parsedEnv,
      profiles: profilesList,
    });

    if (!browserCheck.disponible && !this.dependencies.prepareWorkspace) {
      guidance.siguiente_accion = installAccion;
    }

    const recoveredProfiles = resumeSnapshot?.profiles.map((p) => {
      const sessionInfo = appService!.readProfileSession(resumeSnapshot.project.project_id, p.profile_id);
      const needsRevalidation = Boolean(
        sessionInfo?.expired || sessionInfo?.revoked || p.status === 'expired' || p.status === 'revoked',
      );
      return {
        profile_id: p.profile_id,
        label: p.label,
        role: p.role_name,
        tenant_id: p.tenant_id,
        login_mode: p.login_mode,
        status: p.status,
        needs_revalidation: needsRevalidation,
        downgraded_to_anonymous: false,
      };
    });
    const pendingDiscrepancies = (resumeSnapshot?.discrepancies ?? [])
      .filter((d) => d.resolution_status === 'pending_user_decision');
    const expiredProfile = recoveredProfiles?.find((p) => p.needs_revalidation);

    const pendingOracleCases = serviceCases.filter((c) => c.conformity_status === 'pending_oracle');
    const recoverablePublications = activeAppProject && appService
      ? appService.listRecoverablePublications(activeAppProject.project_id)
      : [];
    const canonicalExecSummary = activeAppProject && appService
      ? appService.getExecutionSummary(activeAppProject.project_id)
      : undefined;
    const reusableClosedModules = (resumeSnapshot?.modules ?? [])
      .filter((m) => m.status === 'closed' || m.status === 'waived')
      .map((m) => m.key);

    if (expiredProfile && browserCheck.disponible) {
      guidance.siguiente_accion = {
        tipo: 'decision',
        descripcion: `La sesión protegida de '${expiredProfile.label}' requiere revalidación; inicia sesión nuevamente sin degradar a anónimo.`,
        tool: 'qap_auth_add',
      };
    } else if (recoverablePublications.length > 0) {
      const pendingPub = recoverablePublications[0];
      guidance.siguiente_accion = {
        tipo: 'trabajo',
        descripcion: `Hay una publicación de reporte incompleta (${pendingPub.execution_id}, falló formato '${pendingPub.failed_format ?? 'desconocido'}'). Recupérala con qap_report sin reejecutar el navegador.`,
        tool: 'qap_report',
      };
    } else if (pendingDiscrepancies.length > 0 && !interviewAction) {
      const firstDisc = pendingDiscrepancies[0];
      guidance.siguiente_accion = {
        tipo: 'decision',
        descripcion: `Hay una discrepancia en '${firstDisc.field}' entre ${firstDisc.source_a} y ${firstDisc.source_b}; confirma qué valor conservar antes de continuar.`,
        tool: 'qap_project',
      };
    } else if (guidance.siguiente_accion.tipo !== 'trabajo' && pendingOracleCases.length > 0 && currentPhase === 'WORKING') {
      guidance.siguiente_accion = {
        tipo: 'decision',
        descripcion: `Hay ${pendingOracleCases.length} caso(s) sin oráculo de negocio pendiente(s) de decisión del QA (sin bloquear el resto del lote).`,
        tool: 'qap_plan',
      };
    } else if (resumeSnapshot?.pending_decision &&
      (currentPhase !== 'WORKING' || guidance.siguiente_accion.tipo !== 'trabajo')) {
      guidance.siguiente_accion = {
        tipo: 'decision',
        descripcion: resumeSnapshot.pending_decision.prompt,
        tool: guidance.siguiente_accion.tool,
      };
    }

    const stateModuleCount = Object.keys(lifecycleState.modules || {}).length;
    const totalModules = Math.max(moduleCount, stateModuleCount, resumeSnapshot?.modules.length ?? 0);


    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              status: 'success',
              directorio_objetivo: rootDir,
              initialized: true,
              context_state: contextState,
              preflight,
              navegador_qap: preflight.navegador_qap,
              fase: currentPhase,
              estados_modulos: estadosModulos,
              faltantes,
              siguiente_accion: guidance.siguiente_accion,
              scan,
              hallazgos_workspace: hallazgos,
              advertencias,
              projectName: projectName !== 'No inicializado' ? projectName : basename(rootDir),
              ...(resumeSnapshot ? {
                project_id: resumeSnapshot.project.project_id,
                campaign: resumeSnapshot.campaign,
                recovered_profiles: recoveredProfiles,
                auth_revalidation_needed: Boolean(expiredProfile),
                scope_limits: resumeSnapshot.scope_limits,
                discrepancies: pendingDiscrepancies,
                module_candidates: resumeSnapshot.module_candidates,
                partial_inventories: resumeSnapshot.partial_inventories,
                ingested_documents: resumeSnapshot.ingested_documents,
                recovery: resumeSnapshot.recovery,
                pending_decision: resumeSnapshot.pending_decision,
                service_cases_summary: {
                  total: serviceCases.length,
                  pending_oracle: pendingOracleCases.length,
                  approved_or_executed: serviceCases.filter((c) => c.conformity_status !== 'pending_oracle' && c.conformity_status !== 'proposed').length,
                },
                pending_oracles: pendingOracleCases.map((c) => ({
                  case_id: c.case_id,
                  module_key: c.module_key,
                  title: c.title,
                  question: c.expectation.business_risk_question,
                })),
                pending_report_recovery: recoverablePublications,
                canonical_execution_summary: canonicalExecSummary,
                reusable_closed_modules: reusableClosedModules,
              } : {}),
              environments,
              stats: {
                modules: totalModules,
                authProfiles: Math.max(profileCount, resumeSnapshot?.profiles.length ?? 0),
                executions: executionCount,
              },
              validatorReady: Boolean(validator),
              detectedService,
              _guidance_for_assistant: `Fase actual: ${currentPhase}. Siguiente acción: ${guidance.siguiente_accion.descripcion}`,
            },
            null,
            2
          ),
        },
      ],
    };
  }
}
