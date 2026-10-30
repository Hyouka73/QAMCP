import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, join, basename } from 'node:path';

import { SchemaValidator, filterValidRoles, type ProjectContext, type AuthProfile, type RuleEntry, type CategoryWaiver, type ModuleCandidate } from '@qap/shared';
import { FileSystemStorage, detectarServiciosConEvidencia, generarScan, detectarDocumentosProyecto, parsePrdContent } from '@qap/knowledge';
import { canExitOnboarding, canExitScoping, obtenerSiguientePreguntaOnboarding, computeApplicableCategories, computeCoverage, generateNextInterviewBatch, sanitizeDomString, type ViewDiscoveryContext } from '@qap/engine';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { getPhaseGuidance, buildInterviewNextAction, type SiguienteAccion } from '../guidance.js';
import type { IMcpToolHandler } from '../dispatcher.js';

import { definition, validateBase, projectRoot, readContext, readEnvironment, isObject, type StateDependencies, type LegacyEnvironment, knowledgeStatus, result, safeDocument, assertProjectSegment } from './state-services.js';
import { PLAYWRIGHT_INSTALL_COMMAND, detectarSubcarpetaWorkspace } from './state-runtime.js';
import { discoveryIntegration, hasLegacyViewContext, legacyInterviewBlocked } from './legacy-discovery-contract.js';

export class StatusHandler implements IMcpToolHandler {
  readonly definition = definition('qap_status');
  constructor(private readonly dependencies: StateDependencies & { browser: () => Promise<{ disponible: boolean }>; view: (root: string, module: string, view: string, route: string) => ViewDiscoveryContext }) {}
  validateArguments(args: unknown): boolean { return validateBase(args, ['targetPath']); }
  async execute(raw: unknown): Promise<CallToolResult> {
    const rootDir = projectRoot(raw, this.dependencies, false);
    const knowledge = await knowledgeStatus(rootDir, this.dependencies);
    const legacy = await this.inspectLegacyState(rootDir);
    const text = legacy.content[0];
    if (text.type !== 'text') return legacy;
    const payload = JSON.parse(text.text) as Record<string, unknown>;
    return result({ ...payload, knowledge, integration: discoveryIntegration, provenance: { knowledge: 'IKnowledgeStore', onboarding: 'legacy_files', hallazgos_workspace: 'workspace_inspection', preflight: 'runtime' }, coverage: 'partial_inventory_not_test_verdicts' });
  }
  private async inspectLegacyState(rootDir: string): Promise<CallToolResult> {

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
      if (existsSync(profilesFile)) {
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

    const guidance = getPhaseGuidance(currentPhase, {
      faltantes,
      plan: lifecycleState.session?.plan,
      modules: modulesGuidance,
      moduleCandidates: moduleCandidatesList,
      interviewAction,
      reportPath,
      hallazgos,
      context: parsedContext,
      lifecycle: lifecycleState,
      environments: parsedEnv,
      profiles: profilesList,
    });

    if (!browserCheck.disponible) {
      guidance.siguiente_accion = installAccion;
    }

    const stateModuleCount = Object.keys(lifecycleState.modules || {}).length;
    const totalModules = Math.max(moduleCount, stateModuleCount);


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
              environments,
              stats: {
                modules: totalModules,
                authProfiles: profileCount,
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
