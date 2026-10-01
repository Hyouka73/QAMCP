/**
 * Módulo de Guía Conversacional por Fase de QAP (E6 / P3.1)
 *
 * Genera la `siguiente_accion` tipificada y preguntas contextuales
 * según la fase activa del proyecto y los requerimientos vigentes.
 *
 * Directivas de E0b:
 * - En toda respuesta con siguiente_accion de tipo "trabajo" o "entrevista_vista",
 *   `pregunta` es una instrucción o el texto de las preguntas (NUNCA "¿Deseas…?")
 *   y `opciones` es [].
 * - Solo el tipo "decision" puede llevar opciones, y con >= 2 alternativas reales.
 * - Ninguna guía recomienda qap_report mientras no existan ejecuciones reales.
 */

import type { ProjectPhase, RuleCategory } from '@qap/shared';
import type { CoverageResult, InterviewQuestion } from '@qap/engine';

export type AccionTipo = 'entrevista' | 'entrevista_vista' | 'decision' | 'trabajo';

export interface SiguienteAccion {
  tipo: AccionTipo;
  descripcion: string;
  tool?: string;
  module?: string;
  modulo?: string;
  view?: string;
  vista?: string;
  preguntas?: Array<InterviewQuestion | Record<string, unknown> | string>;
  categorias_aplicables?: RuleCategory[];
  cobertura?: {
    completa: boolean;
    categorias_aplicables: RuleCategory[];
    categorias_cubiertas: string[];
    inferidas_pendientes: number;
  };
  rutas_detectadas_fuera_del_plan?: string[];
  opciones?: string[];
}

export interface BuildInterviewActionParams {
  module: string;
  view?: string;
  route?: string;
  questions: Array<InterviewQuestion | Record<string, unknown> | string>;
  applicableCategories: RuleCategory[];
  coverage: CoverageResult;
  rutasDetectadasFueraDelPlan?: string[];
}

/**
 * Función compartida por qap_discover, qap_rules_set y qap_status
 * para construir de forma unificada la siguiente_accion de tipo "entrevista_vista" (E0a).
 */
export function buildInterviewNextAction(params: BuildInterviewActionParams): SiguienteAccion {
  const view = params.view || 'default';
  const missingCats = Object.entries(params.coverage.categorias)
    .filter(([, v]) => v.aplicable && !v.cubierta)
    .map(([k]) => k);

  const descripcion = missingCats.length > 0
    ? `Entrevista en curso para '${params.module}' (vista: ${view}). Categorías pendientes: ${missingCats.join(', ')}.`
    : `Entrevista de reglas de negocio para el módulo '${params.module}' (vista: ${view}). Cobertura: ${Object.values(params.coverage.categorias).filter((c) => c.cubierta).length}/${params.applicableCategories.length} categorías.`;

  const accion: SiguienteAccion = {
    tipo: 'entrevista_vista',
    descripcion,
    tool: 'qap_rules_set',
    module: params.module,
    modulo: params.module,
    view,
    vista: view,
    preguntas: params.questions,
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
  faltantes?: Array<{ campo: string; motivo: string }>;
  suggestedModules?: Array<{ module: string; path: string; priority?: string }>;
  plan?: Array<{ module: string; path: string; priority: string; status: string }>;
  modules?: Record<string, { state: string; hasPendingHypotheses?: boolean }>;
  interviewAction?: SiguienteAccion;
  reportPath?: string;
}

export interface GuidanceResult {
  fase: ProjectPhase;
  siguiente_accion: SiguienteAccion;
  pregunta: string;
  opciones: string[];
}

const ONBOARDING_QUESTIONS_ORDER = [
  {
    campo: 'source_of_truth',
    pregunta: '1. Fuente de verdad: ¿Existe algún documento de especificación (PRD, README, OpenAPI o notas) que defina el sistema, o definimos el alcance desde cero?',
  },
  {
    campo: 'objective',
    pregunta: '2. Objetivo del proyecto: ¿Cuál es el propósito central de la aplicación y qué dolor o necesidad de negocio resuelve?',
  },
  {
    campo: 'roles',
    pregunta: '3. Roles de usuario: ¿Qué tipos de usuarios o actores interactúan con el sistema (ej: cliente, administrador, auditor)?',
  },
  {
    campo: 'critical_flows',
    pregunta: '4. Flujos críticos: ¿Cuáles son las rutas o procesos de negocio más importantes que no pueden fallar?',
  },
  {
    campo: 'environments',
    pregunta: '5. Entorno de pruebas: ¿Cuál es la URL base y entorno configurado para ejecutar las pruebas (ej: http://localhost:3000)?',
  },
];

export function getPhaseGuidance(
  phase: ProjectPhase,
  options: PhaseGuidanceOptions = {}
): GuidanceResult {
  switch (phase) {
    case 'ONBOARDING': {
      const faltantesCampos = new Set(options.faltantes?.map((f) => f.campo) ?? []);

      // Filtrar preguntas según los campos faltantes en el orden canónico estricto
      const relevantQuestions = ONBOARDING_QUESTIONS_ORDER
        .filter((q) => {
          if (!options.faltantes || options.faltantes.length === 0) return true;
          return faltantesCampos.has(q.campo);
        })
        .slice(0, 5)
        .map((q) => q.pregunta);

      const preguntas = relevantQuestions.length > 0
        ? relevantQuestions
        : [
            '1. Fuente de verdad: ¿Existe PRD, README o especificación técnica?',
            '2. Objetivo del proyecto: ¿Cuál es el propósito y dolor de negocio que resuelve?',
            '3. Roles de usuario: ¿Qué tipos de usuarios interactúan con la plataforma?',
            '4. Flujos críticos: ¿Cuáles son los flujos prioritarios de negocio?',
            '5. Entorno: ¿Cuál es la URL base del sistema?',
          ];

      return {
        fase: 'ONBOARDING',
        siguiente_accion: {
          tipo: 'entrevista',
          descripcion: 'Responde a las siguientes preguntas en un solo mensaje de texto libre para completar el contexto inicial del proyecto.',
          tool: 'qap_context_set',
          preguntas,
        },
        pregunta: `Para iniciar con el análisis de calidad, por favor responde a las siguientes preguntas en un solo mensaje:\n\n${preguntas.join('\n\n')}`,
        opciones: [], // Preguntas abiertas: sin opciones de botón
      };
    }

    case 'SCOPING': {
      let descripcion = 'Define el plan de trabajo de la sesión (módulos, rutas y prioridades) y la decisión de autenticación.';
      if (options.suggestedModules && options.suggestedModules.length > 0) {
        const sugeridos = options.suggestedModules.map((m) => `${m.module} (${m.path})`).join(', ');
        descripcion += ` Módulos sugeridos extraídos del documento: ${sugeridos}.`;
      }

      const opciones = options.suggestedModules && options.suggestedModules.length > 0
        ? options.suggestedModules.map((m) => `Registrar ${m.module} (${m.path})`)
        : ['Definir módulos manualmente', 'Consultar especificación del proyecto'];

      return {
        fase: 'SCOPING',
        siguiente_accion: {
          tipo: 'decision',
          descripcion,
          tool: 'qap_session_plan',
        },
        pregunta: 'Define los módulos prioritarios a verificar en esta sesión y especifica si la aplicación requiere autenticación (qap_session_plan).',
        opciones,
      };
    }

    case 'WORKING': {
      // 1. Reanudación de entrevista si se proporciona acción compartida precalculada (E0a)
      if (options.interviewAction) {
        const action = options.interviewAction;
        const qList = action.preguntas || [];
        const formattedQuestions = qList
          .map((q) => {
            if (typeof q === 'string') return q;
            if (q && typeof q === 'object' && 'texto' in q) {
              const val = (q as { texto?: unknown }).texto;
              return typeof val === 'string' ? val : '';
            }
            return '';
          })
          .filter((t): t is string => t.length > 0);

        const pregunta = formattedQuestions.length > 0
          ? `Preguntas de entrevista de reglas para el módulo '${action.module}' (vista: ${action.view}):\n\n${formattedQuestions.join('\n\n')}`
          : `El módulo '${action.module}' requiere completar su entrevista de vista. Registra sus reglas de negocio con qap_rules_set.`;

        return {
          fase: 'WORKING',
          siguiente_accion: action,
          pregunta,
          opciones: [], // E0b: sin permisos ni botones de una sola opción
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
        return {
          fase: 'WORKING',
          siguiente_accion: {
            tipo: 'entrevista_vista',
            descripcion: info.state === 'observed'
              ? `El módulo '${modName}' fue descubierto y tiene hipótesis sobre reglas de negocio pendientes. Registra sus reglas con qap_rules_set.`
              : `El módulo '${modName}' tiene una entrevista de vista pendiente con hipótesis y preguntas sobre reglas de negocio. Registra sus reglas con qap_rules_set.`,
            tool: 'qap_rules_set',
            module: modName,
            view: 'default',
            preguntas: [],
          },
          pregunta: `El módulo '${modName}' requiere completar su entrevista de vista. Registra sus reglas de negocio con qap_rules_set.`,
          opciones: [], // E0b: opciones estrictamente vacías
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
            descripcion: `Siguiente módulo planificado para exploración: '${nextPlanned.module}' en ruta '${nextPlanned.path}'.`,
            tool: 'qap_discover',
          },
          pregunta: `Siguiente módulo planificado para exploración: '${nextPlanned.module}' (${nextPlanned.path}). Ejecuta qap_discover para iniciar.`,
          opciones: [], // E0b: sin opciones
        };
      }

      // 3. Revisar si hay módulos en consolidated que requieran cierre formal (E2)
      const consolidatedModules = Object.entries(options.modules ?? {}).filter(
        ([, info]) => info.state === 'consolidated'
      );
      if (consolidatedModules.length > 0) {
        const [modName] = consolidatedModules[0];
        return {
          fase: 'WORKING',
          siguiente_accion: {
            tipo: 'trabajo',
            descripcion: `El módulo '${modName}' ha completado su cobertura de reglas (consolidated). Presenta el resumen al usuario y, con su confirmación explícita, ejecuta qap_module_close.`,
            tool: 'qap_module_close',
          },
          pregunta: `El módulo '${modName}' ha alcanzado cobertura completa. Presenta el resumen al usuario y llama a qap_module_close con user_confirmed: true para cerrar el módulo.`,
          opciones: [],
        };
      }

      // 4. Si todos los módulos del plan están en closed o waived: listos para cerrar sesión (E3)
      return {
        fase: 'WORKING',
        siguiente_accion: {
          tipo: 'trabajo',
          descripcion: 'Todos los módulos planificados en la sesión actual están cerrados o renunciados. Procede a cerrar la sesión con qap_session_close.',
          tool: 'qap_session_close',
        },
        pregunta: 'Todos los módulos de la sesión han finalizado su ciclo de vida. Ejecuta qap_session_close para cerrar la sesión y generar el reporte final de brechas.',
        opciones: [],
      };
    }

    case 'WRAP_UP':
    default: {
      const reportMsg = options.reportPath
        ? ` Reporte de brechas generado en: ${options.reportPath}.`
        : '';

      return {
        fase: 'WRAP_UP',
        siguiente_accion: {
          tipo: 'decision',
          descripcion: `La sesión actual ha concluido en la fase WRAP_UP.${reportMsg} Puedes explorar el Knowledge Graph con qap_server o iniciar una nueva sesión de pruebas con qap_session_plan.`,
          tool: 'qap_server',
        },
        pregunta: `La sesión ha concluido exitosamente.${reportMsg} ¿Deseas explorar el Knowledge Graph interactivo o iniciar una nueva sesión de pruebas?`,
        opciones: [
          'Explorar Knowledge Graph (qap_server)',
          'Iniciar nueva sesión de pruebas (qap_session_plan)',
        ], // E0b: >= 2 opciones reales
      };
    }
  }
}
