/**
 * Módulo de Guía Conversacional por Fase de QAP (E6)
 *
 * Genera la `siguiente_accion` tipificada y preguntas contextuales
 * según la fase activa del proyecto y los requerimientos vigentes.
 */

import type { ProjectPhase } from '@qap/shared';

export type AccionTipo = 'entrevista' | 'entrevista_vista' | 'decision' | 'trabajo';

export interface SiguienteAccion {
  tipo: AccionTipo;
  descripcion: string;
  tool?: string;
  preguntas?: string[];
}

export interface PhaseGuidanceOptions {
  faltantes?: Array<{ campo: string; motivo: string }>;
  suggestedModules?: Array<{ module: string; path: string; priority?: string }>;
  plan?: Array<{ module: string; path: string; priority: string; status: string }>;
  modules?: Record<string, { state: string }>;
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
        : ['Definir módulos manualmente'];

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
      // 1. Prioridad: módulos en interviewing que requieren completar entrevista de vista
      const modulesEntries = Object.entries(options.modules ?? {});
      const nextInterviewing = modulesEntries.find(([_, info]) => info.state === 'interviewing');

      if (nextInterviewing) {
        const [modName] = nextInterviewing;
        return {
          fase: 'WORKING',
          siguiente_accion: {
            tipo: 'entrevista_vista',
            descripcion: `El módulo '${modName}' tiene una entrevista de vista pendiente con hipótesis y preguntas sobre reglas de negocio. Registra sus reglas con qap_rules_set.`,
            tool: 'qap_rules_set',
          },
          pregunta: `El módulo '${modName}' requiere completar su entrevista de vista para registrar reglas de negocio. ¿Deseas responder ahora con qap_rules_set?`,
          opciones: [`Responder entrevista de ${modName} (qap_rules_set)`, 'Ver otros módulos'],
        };
      }

      // 2. Siguiente módulo planificado
      const plan = options.plan ?? [];
      const nextPlanned = plan.find((item) => {
        const modState = options.modules?.[item.module]?.state;
        return modState === 'planned';
      });

      if (nextPlanned) {
        return {
          fase: 'WORKING',
          siguiente_accion: {
            tipo: 'trabajo',
            descripcion: `Siguiente módulo planificado para exploración: '${nextPlanned.module}' en ruta '${nextPlanned.path}'.`,
            tool: 'qap_discover',
          },
          pregunta: `¿Deseas iniciar la exploración del módulo '${nextPlanned.module}' (${nextPlanned.path})?`,
          opciones: [`Explorar ${nextPlanned.module}`, 'Ver otros módulos'],
        };
      }

      // 3. Si no hay planned ni interviewing, resumir pendientes o módulos observados
      return {
        fase: 'WORKING',
        siguiente_accion: {
          tipo: 'trabajo',
          descripcion: 'Todos los módulos planificados en la sesión actual han sido observados o procesados. Puedes ampliar el plan con nuevos módulos usando qap_session_plan.',
          tool: 'qap_session_plan',
        },
        pregunta: 'No hay más módulos pendientes de descubrimiento en el plan actual. ¿Deseas ampliar el plan con nuevos módulos?',
        opciones: ['Agregar nuevos módulos', 'Ver reportes'],
      };
    }

    case 'WRAP_UP':
    default: {
      return {
        fase: 'WRAP_UP',
        siguiente_accion: {
          tipo: 'decision',
          descripcion: 'La sesión actual ha concluido. Nueva sesión aún no implementada.',
          tool: 'none',
        },
        pregunta: 'Sesión concluida. Nueva sesión aún no implementada.',
        opciones: [],
      };
    }
  }
}
