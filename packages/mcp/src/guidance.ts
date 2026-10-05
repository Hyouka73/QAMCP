/**
 * Módulo de Guía Conversacional por Fase de QAP (E6 / P4.2)
 *
 * Genera la `siguiente_accion` tipificada y preguntas estructuradas
 * según el contrato canónico de Pregunta (P4.2):
 * - Una sola pregunta estructurada pendiente a la vez en `siguiente_accion.pregunta`
 * - Sin cadenas de preguntas agregadas, sin pregunta aplanada y sin opciones de nivel superior.
 * - Toda pregunta pasa por el validador puro validarPregunta.
 */

import type { ProjectPhase, RuleCategory, LifecycleState, AuthProfile } from '@qap/shared';
import type {
  CoverageResult,
  InterviewQuestion,
  Pregunta,
  CanExitOnboardingContext,
  CanExitOnboardingEnvironments,
  HallazgosProyectoMin,
} from '@qap/engine';
import { obtenerSiguientePreguntaOnboarding, generarRenderTexto } from '@qap/engine';

export type AccionTipo = 'entrevista' | 'entrevista_vista' | 'decision' | 'trabajo';

/**
 * Directivas obligatorias compartidas (<= 600 caracteres) para tools del flujo principal (P4.3 / E5c).
 */
export const QAP_CORE_DIRECTIVES =
  'DIRECTIVAS OBLIGATORIAS:\n' +
  '1. Sigue estrictamente la siguiente_accion indicada por el servidor.\n' +
  '2. Investiga el workspace antes de preguntar: lee documentos, README y package.json.\n' +
  '3. No pidas al usuario lo que un documento ya especifica.\n' +
  '4. Pasos de tipo "trabajo" son autónomos: ejecútalos directamente sin consultar al usuario; las acciones que requieren confirmación nunca vienen como trabajo.\n' +
  '5. Máximo una sola pregunta estructurada al usuario por turno.';

export interface SiguienteAccion {
  tipo: AccionTipo;
  descripcion: string;
  tool?: string;
  module?: string;
  modulo?: string;
  view?: string;
  vista?: string;
  pregunta?: Pregunta;
  restantes_en_lote?: number;
  categorias_aplicables?: RuleCategory[];
  cobertura?: {
    completa: boolean;
    categorias_aplicables: RuleCategory[];
    categorias_cubiertas: string[];
    inferidas_pendientes: number;
  };
  rutas_detectadas_fuera_del_plan?: string[];
}

export interface BuildInterviewActionParams {
  module: string;
  view?: string;
  route?: string;
  questions: Array<InterviewQuestion | Pregunta>;
  applicableCategories: RuleCategory[];
  coverage: CoverageResult;
  rutasDetectadasFueraDelPlan?: string[];
}

/**
 * Función compartida por qap_discover, qap_rules_set y qap_status
 * para construir de forma unificada la siguiente_accion de tipo "entrevista_vista" (E3a).
 */
export function buildInterviewNextAction(params: BuildInterviewActionParams): SiguienteAccion {
  const view = params.view || 'default';
  const missingCats = Object.entries(params.coverage.categorias)
    .filter(([, v]) => v.aplicable && !v.cubierta)
    .map(([k]) => k);

  const descripcion = missingCats.length > 0
    ? `Entrevista en curso para '${params.module}' (vista: ${view}). Categorías pendientes: ${missingCats.join(', ')}.`
    : `Entrevista de reglas de negocio para el módulo '${params.module}' (vista: ${view}). Cobertura: ${Object.values(params.coverage.categorias).filter((c) => c.cubierta).length}/${params.applicableCategories.length} categorías.`;

  const firstQuestion = params.questions[0] as Pregunta | undefined;
  if (firstQuestion && !firstQuestion.render_texto) {
    firstQuestion.render_texto = generarRenderTexto(firstQuestion);
  }
  const restantes = Math.max(0, params.questions.length - 1);

  const accion: SiguienteAccion = {
    tipo: 'entrevista_vista',
    descripcion,
    tool: 'qap_rules_set',
    module: params.module,
    modulo: params.module,
    view,
    vista: view,
    pregunta: firstQuestion,
    restantes_en_lote: restantes,
    categorias_aplicables: params.applicableCategories,
    cobertura: {
      completa: params.coverage.completa,
      categorias_aplicables: params.applicableCategories,
      categorias_cubiertas: Object.entries(params.coverage.categorias)
        .filter(([, v]) => v.aplicable && v.cubierta)
        .map(([k]) => k),
      inferidas_pendientes: params.coverage.inferidas_pendientes,
    },
  };

  if (params.rutasDetectadasFueraDelPlan && params.rutasDetectadasFueraDelPlan.length > 0) {
    accion.rutas_detectadas_fuera_del_plan = params.rutasDetectadasFueraDelPlan;
  }

  return accion;
}

export interface PhaseGuidanceOptions {
  context?: CanExitOnboardingContext | null;
  lifecycle?: LifecycleState | null;
  hallazgos?: HallazgosProyectoMin | null;
  faltantes?: Array<{ campo: string; motivo: string }>;
  suggestedModules?: Array<{ module: string; path: string; priority?: string }>;
  plan?: Array<{ module: string; path: string; priority: string; status: string }>;
  modules?: Record<string, { state: string; hasPendingHypotheses?: boolean }>;
  interviewAction?: SiguienteAccion;
  reportPath?: string;
  environments?: CanExitOnboardingEnvironments | null;
  profiles?: AuthProfile[];
}

export interface GuidanceResult {
  fase: ProjectPhase;
  siguiente_accion: SiguienteAccion;
}

export function getPhaseGuidance(
  phase: ProjectPhase,
  options: PhaseGuidanceOptions = {}
): GuidanceResult {
  switch (phase) {
    case 'ONBOARDING': {
      // E3a: Con fuente declarada e ingerible (existente en workspace) y campos sin propuesta, siguiente_accion es tipo "trabajo"
      const sot = options.context?.source_of_truth;
      const isIngestibleDoc = Boolean(
        sot?.declared &&
        sot?.ref &&
        sot?.type !== 'none' &&
        options.hallazgos?.documentos &&
        options.hallazgos.documentos.some(
          (d) => d.path === sot.ref || d.nombre === sot.ref || d.path.endsWith(`/${sot.ref}`)
        )
      );
      const agentAnalyzed = Boolean(
        options.context?.ingest?.analyzed_by === 'agent' ||
        sot?.notes?.includes('[agent_analyzed]')
      );
      if (isIngestibleDoc && !agentAnalyzed) {
        const hasObjectiveProposal = Boolean(
          options.context?.objective &&
          !/^Configuración base de QA para\s+.*$/i.test(options.context.objective.trim()) &&
          options.context.objective.trim().length >= 10
        );
        const hasRolesProposal = Array.isArray(options.context?.roles) && options.context.roles.length > 0;
        const hasFlowsProposal = Array.isArray(options.context?.critical_flows) && options.context.critical_flows.length > 0;

        if (!hasObjectiveProposal || !hasRolesProposal || !hasFlowsProposal) {
          return {
            fase: 'ONBOARDING',
            siguiente_accion: {
              tipo: 'trabajo',
              descripcion: `Lee el archivo '${sot.ref}' con tus herramientas de lectura y envía en el parámetro propuesta { objetivo, roles[], flujos_criticos[{name, evidence}], rutas[], riesgos[] } solo lo que el documento dice, sin inventar, con evidence (título de sección o <= 15 palabras). Si no puedes leer archivos, llama sin propuesta.`,
              tool: 'qap_context_ingest',
            },
          };
        }
      }

      const q = obtenerSiguientePreguntaOnboarding(
        options.context,
        options.lifecycle,
        options.hallazgos,
        options.environments
      );

      if (!q) {
        // Todas las compuertas de onboarding pasaron; avanzar a SCOPING
        return getPhaseGuidance('SCOPING', options);
      }

      if (!q.render_texto) {
        q.render_texto = generarRenderTexto(q);
      }

      return {
        fase: 'ONBOARDING',
        siguiente_accion: {
          tipo: 'entrevista',
          descripcion: `Pregunta pendiente de onboarding (${q.id}). Preséntala al usuario usando la herramienta interactiva ask_question.`,
          tool: q.registrar_con.tool,
          pregunta: q,
        },
      };
    }

    case 'SCOPING': {
      // 1. Módulos a probar
      const plan = options.plan ?? options.lifecycle?.session?.plan ?? [];
      const hasPlan = Array.isArray(plan) && plan.length > 0;

      if (!hasPlan) {
        const candidateModules: Array<{ module: string; path: string }> = [];
        if (options.suggestedModules && options.suggestedModules.length > 0) {
          candidateModules.push(...options.suggestedModules);
        } else if (Array.isArray(options.context?.critical_flows)) {
          for (const flow of options.context.critical_flows) {
            const flowObj = typeof flow === 'object' && flow !== null ? (flow as { name?: unknown; path?: unknown }) : null;
            const flowName = typeof flow === 'string' ? flow : (typeof flowObj?.name === 'string' ? flowObj.name : '');
            const flowPath =
              (typeof flowObj?.path === 'string' && flowObj.path) ||
              `/${flowName.toLowerCase().replace(/[^a-z0-9_-]+/g, '_')}`;
            if (flowName && !candidateModules.some((m) => m.module === flowName)) {
              candidateModules.push({ module: flowName, path: flowPath });
            }
          }
        }

        let modulesPregunta: Pregunta;
        if (candidateModules.length >= 2) {
          modulesPregunta = {
            id: 'scoping.modulos_a_probar',
            texto: 'Selecciona los módulos prioritarios a verificar en esta sesión:',
            formato: 'multiple',
            opciones: candidateModules.map((m, idx) => ({
              id: `modulo_${m.module.toLowerCase().replace(/[^a-z0-9_-]+/g, '_')}`,
              etiqueta: `${m.module} (${m.path})`,
              recomendada: idx === 0,
            })),
            permite_otra: true,
            registrar_con: { tool: 'qap_session_plan', campo: 'modules' },
          };
        } else {
          modulesPregunta = {
            id: 'scoping.modulos_a_probar',
            texto: 'Indica los módulos a probar con su nombre y ruta (por ejemplo: Catálogo /catalog, Pagos /checkout):',
            formato: 'abierta',
            opciones: [],
            permite_otra: true,
            registrar_con: { tool: 'qap_session_plan', campo: 'modules' },
          };
        }
        modulesPregunta.render_texto = generarRenderTexto(modulesPregunta);

        return {
          fase: 'SCOPING',
          siguiente_accion: {
            tipo: 'decision',
            descripcion:
              candidateModules.length > 0
                ? `Define los módulos prioritarios a verificar con qap_session_plan: ${candidateModules.map((m) => `${m.module} (${m.path})`).join(', ')}.`
                : 'Define los módulos prioritarios a verificar en esta sesión de trabajo.',
            tool: 'qap_session_plan',
            pregunta: modulesPregunta,
          },
        };
      }

      // 2. Si la aplicación requiere inicio de sesión
      const sessionAuth = options.lifecycle?.session?.auth;
      const hasAuthDecision = sessionAuth?.required !== undefined;

      if (!hasAuthDecision) {
        const authReqPregunta: Pregunta = {
          id: 'scoping.requiere_login',
          texto: 'Indica si la aplicación requiere inicio de sesión para acceder a sus funciones:',
          formato: 'una_opcion',
          opciones: [
            {
              id: 'requiere_login',
              etiqueta: 'Requiere inicio de sesión (usuarios autenticados)',
            },
            {
              id: 'es_publica',
              etiqueta: 'Es una aplicación pública (sin inicio de sesión)',
            },
          ],
          permite_otra: false,
          registrar_con: { tool: 'qap_session_plan', campo: 'auth' },
        };
        authReqPregunta.render_texto = generarRenderTexto(authReqPregunta);

        return {
          fase: 'SCOPING',
          siguiente_accion: {
            tipo: 'decision',
            descripcion: 'Especifica si el entorno bajo prueba exige inicio de sesión o es público.',
            tool: 'qap_session_plan',
            pregunta: authReqPregunta,
          },
        };
      }

      // 3. Método (solo si requiere login)
      if (sessionAuth?.required === true && !sessionAuth.method) {
        const methodPregunta: Pregunta = {
          id: 'scoping.metodo_auth',
          texto: 'Selecciona el método de autenticación para las pruebas:',
          formato: 'una_opcion',
          opciones: [
            {
              id: 'handoff',
              etiqueta: 'Inicio de sesión manual en navegador (Handoff)',
              recomendada: true,
            },
            {
              id: 'credentials',
              etiqueta: 'Credenciales de prueba automáticas (guardadas en llavero)',
            },
          ],
          permite_otra: false,
          registrar_con: { tool: 'qap_session_plan', campo: 'auth_method' },
        };
        methodPregunta.render_texto = generarRenderTexto(methodPregunta);

        return {
          fase: 'SCOPING',
          siguiente_accion: {
            tipo: 'decision',
            descripcion: 'Selecciona el método de inicio de sesión: handoff manual en navegador o credenciales en llavero.',
            tool: 'qap_session_plan',
            pregunta: methodPregunta,
          },
        };
      }

      // 4. Roles a probar (solo si requiere login)
      const chosenRoles = sessionAuth?.roles;
      const hasRoles = Array.isArray(chosenRoles) && chosenRoles.length > 0;
      if (sessionAuth?.required === true && !hasRoles) {
        const rawRoles = (options.context?.roles || [])
          .map((r: unknown) => {
            if (typeof r === 'string') return r;
            if (r && typeof r === 'object') {
              const obj = r as Record<string, unknown>;
              return typeof obj.name === 'string' ? obj.name : (typeof obj.id === 'string' ? obj.id : '');
            }
            return '';
          })
          .filter(Boolean);

        let rolesPregunta: Pregunta;
        if (rawRoles.length >= 2) {
          rolesPregunta = {
            id: 'scoping.roles_a_probar',
            texto: 'Selecciona los roles de usuario que se deben probar en esta sesión:',
            formato: 'multiple',
            opciones: rawRoles.map((role: string, idx: number) => ({
              id: `rol_${role.toLowerCase().replace(/[^a-z0-9_-]+/g, '_')}`,
              etiqueta: role,
              recomendada: idx === 0,
            })),
            permite_otra: true,
            registrar_con: { tool: 'qap_session_plan', campo: 'roles' },
          };
        } else {
          rolesPregunta = {
            id: 'scoping.roles_a_probar',
            texto: 'Indica los roles de usuario a probar en esta sesión (por ejemplo: admin, comprador):',
            formato: 'abierta',
            opciones: [],
            permite_otra: true,
            registrar_con: { tool: 'qap_session_plan', campo: 'roles' },
          };
        }
        rolesPregunta.render_texto = generarRenderTexto(rolesPregunta);

        return {
          fase: 'SCOPING',
          siguiente_accion: {
            tipo: 'decision',
            descripcion: 'Define los roles de usuario a verificar en la sesión.',
            tool: 'qap_session_plan',
            pregunta: rolesPregunta,
          },
        };
      }

      // 5. Captura y verificación de cada perfil pendiente
      const profiles = options.profiles || [];
      const pendingRole = (chosenRoles || []).find((role: string) => {
        const p = profiles.find((prof) => prof.role === role || prof.id === role);
        return !p || p.verified !== true;
      });

      if (sessionAuth?.required === true && pendingRole) {
        if (sessionAuth.method === 'handoff') {
          return {
            fase: 'SCOPING',
            siguiente_accion: {
              tipo: 'trabajo',
              descripcion: `Inicia sesión en la ventana del navegador que se abrirá llamando a qap_auth_add con method handoff para el rol '${pendingRole}'.`,
              tool: 'qap_auth_add',
              parametros: {
                role: pendingRole,
                method: 'handoff',
              },
            },
          };
        }

        const capturePregunta: Pregunta = {
          id: `scoping.capturar_perfil_credentials_${pendingRole}`,
          texto: `Indica el usuario y contraseña de prueba para el rol '${pendingRole}' (por ejemplo: tester_${pendingRole}, clave_segura):`,
          formato: 'abierta',
          opciones: [],
          permite_otra: false,
          registrar_con: { tool: 'qap_auth_add', campo: 'credentials' },
        };
        capturePregunta.render_texto = generarRenderTexto(capturePregunta);

        return {
          fase: 'SCOPING',
          siguiente_accion: {
            tipo: 'decision',
            descripcion: `Captura y verifica el perfil con credenciales para el rol '${pendingRole}'.`,
            tool: 'qap_auth_add',
            pregunta: capturePregunta,
          },
        };
      }

      // Si todo está configurado en SCOPING
      return {
        fase: 'SCOPING',
        siguiente_accion: {
          tipo: 'trabajo',
          descripcion: 'Plan de sesión y autenticación verificados. Procede a ejecutar la exploración con qap_discover.',
          tool: 'qap_discover',
        },
      };
    }

    case 'WORKING': {
      // 1. Reanudación de entrevista si se proporciona acción compartida precalculada (E0a / E3a)
      if (options.interviewAction) {
        return {
          fase: 'WORKING',
          siguiente_accion: options.interviewAction,
        };
      }

      // 1b. Prioridad: módulos en interviewing, o módulos en observed con hipótesis pendientes
      const modulesEntries = Object.entries(options.modules ?? {});
      const nextInterview = modulesEntries.find(([, info]) => {
        if (info.state === 'interviewing') return true;
        if (info.state === 'observed' && info.hasPendingHypotheses !== false) {
          return info.hasPendingHypotheses === true;
        }
        return false;
      });

      if (nextInterview) {
        const [modName, info] = nextInterview;
        const interviewPregunta: Pregunta = {
          id: `modulo.${modName}.entrevista`,
          texto: `El módulo '${modName}' tiene una entrevista de vista pendiente con hipótesis y preguntas sobre reglas de negocio. Registra sus reglas con qap_rules_set:`,
          formato: 'abierta',
          opciones: [],
          permite_otra: true,
          registrar_con: { tool: 'qap_rules_set', campo: 'rules' },
        };
        interviewPregunta.render_texto = generarRenderTexto(interviewPregunta);

        return {
          fase: 'WORKING',
          siguiente_accion: {
            tipo: 'entrevista_vista',
            descripcion: info.state === 'observed'
              ? `El módulo '${modName}' fue descubierto y tiene hipótesis sobre reglas de negocio pendientes. Registra sus reglas con qap_rules_set.`
              : `El módulo '${modName}' tiene una entrevista de vista pendiente con hipótesis y preguntas sobre reglas de negocio. Registra sus reglas con qap_rules_set.`,
            tool: 'qap_rules_set',
            module: modName,
            modulo: modName,
            view: 'default',
            vista: 'default',
            pregunta: interviewPregunta,
            restantes_en_lote: 0,
          },
        };
      }

      // 2. Siguiente módulo planificado ordenado por prioridad high > medium > low, luego orden del plan
      const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };
      const plan = options.plan ?? [];
      const plannedItems = plan
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => {
          const modState = options.modules?.[item.module]?.state;
          return modState === 'planned';
        })
        .sort((a, b) => {
          const pA = PRIORITY_ORDER[a.item.priority?.toLowerCase() ?? 'medium'] ?? 1;
          const pB = PRIORITY_ORDER[b.item.priority?.toLowerCase() ?? 'medium'] ?? 1;
          if (pA !== pB) return pA - pB;
          return a.index - b.index;
        });

      if (plannedItems.length > 0) {
        const nextPlanned = plannedItems[0].item;
        return {
          fase: 'WORKING',
          siguiente_accion: {
            tipo: 'trabajo',
            descripcion: `Siguiente módulo planificado para exploración: '${nextPlanned.module}' en ruta '${nextPlanned.path}'. Ejecuta qap_discover para iniciar.`,
            tool: 'qap_discover',
            module: nextPlanned.module,
            modulo: nextPlanned.module,
          },
        };
      }

      // 3. Revisar si hay módulos en consolidated que requieran cierre formal (E2 / E4)
      const consolidatedModules = Object.entries(options.modules ?? {}).filter(
        ([, info]) => info.state === 'consolidated'
      );
      if (consolidatedModules.length > 0) {
        const [modName] = consolidatedModules[0];
        const closePregunta: Pregunta = {
          id: `modulo.${modName}.cierre`,
          texto: `El módulo '${modName}' ha completado su cobertura de reglas (consolidated). Confirma la acción para proceder:`,
          formato: 'una_opcion',
          opciones: [
            { id: 'cerrar', etiqueta: `Cerrar módulo '${modName}' formalmente`, recomendada: true, efecto: { estado: 'confirmed' } },
            { id: 'revisar', etiqueta: 'Revisar reglas antes de cerrar' },
          ],
          permite_otra: true,
          registrar_con: { tool: 'qap_module_close', campo: 'action' },
        };
        closePregunta.render_texto = generarRenderTexto(closePregunta);

        return {
          fase: 'WORKING',
          siguiente_accion: {
            tipo: 'decision',
            descripcion: `El módulo '${modName}' ha alcanzado cobertura completa (consolidated). Se requiere decisión del usuario sobre el cierre formal del módulo.`,
            tool: 'qap_module_close',
            module: modName,
            modulo: modName,
            pregunta: closePregunta,
          },
        };
      }

      // 4. Si todos los módulos del plan están en closed o waived: listos para cerrar sesión (E3 / E4)
      const sessionClosePregunta: Pregunta = {
        id: 'session.cerrar_sesion',
        texto: 'Todos los módulos de la sesión han finalizado su ciclo de vida. Confirma el cierre de la sesión para generar el reporte de brechas:',
        formato: 'una_opcion',
        opciones: [
          { id: 'cerrar_sesion', etiqueta: 'Cerrar sesión y generar reporte de brechas', recomendada: true },
          { id: 'ampliar_plan', etiqueta: 'Ampliar plan con otro módulo' },
        ],
        permite_otra: true,
        registrar_con: { tool: 'qap_session_close', campo: 'action' },
      };
      sessionClosePregunta.render_texto = generarRenderTexto(sessionClosePregunta);

      return {
        fase: 'WORKING',
        siguiente_accion: {
          tipo: 'decision',
          descripcion: 'Todos los módulos planificados en la sesión actual están cerrados o renunciados. Se requiere decisión del usuario sobre el cierre de la sesión (qap_session_close).',
          tool: 'qap_session_close',
          pregunta: sessionClosePregunta,
        },
      };
    }

    case 'WRAP_UP':
    default: {
      const reportMsg = options.reportPath
        ? `Reporte de brechas generado en: ${options.reportPath}.`
        : '';
      const wrapUpPregunta: Pregunta = {
        id: 'wrap_up.decision',
        texto: reportMsg
          ? `La sesión actual ha concluido en la fase WRAP_UP. ${reportMsg} Selecciona la siguiente acción:`
          : 'La sesión actual ha concluido en la fase WRAP_UP. Selecciona la siguiente acción:',
        formato: 'una_opcion',
        opciones: [
          { id: 'qap_server', etiqueta: 'Explorar Knowledge Graph interactivo (qap_server)', recomendada: true },
          { id: 'qap_session_plan', etiqueta: 'Iniciar nueva sesión de pruebas (qap_session_plan)' },
        ],
        permite_otra: true,
        registrar_con: { tool: 'qap_server', campo: 'action' },
      };
      wrapUpPregunta.render_texto = generarRenderTexto(wrapUpPregunta);

      return {
        fase: 'WRAP_UP',
        siguiente_accion: {
          tipo: 'decision',
          descripcion: `La sesión actual ha concluido en la fase WRAP_UP.${reportMsg ? ` ${reportMsg}` : ''} Se requiere decisión del usuario para explorar el Knowledge Graph (qap_server) o iniciar una nueva sesión (qap_session_plan).`,
          tool: 'qap_server',
          pregunta: wrapUpPregunta,
        },
      };
    }
  }
}
