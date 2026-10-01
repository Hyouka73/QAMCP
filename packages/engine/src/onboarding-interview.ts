import type { LifecycleState } from '@qap/shared';

import type { CanExitOnboardingContext, CanExitOnboardingEnvironments } from './lifecycle.js';
import { canExitOnboarding } from './lifecycle.js';
import { type Pregunta, type Opcion } from './pregunta.js';
import { sanitizeDomString } from './interview-engine.js';

export interface DocumentoCandidatoMin {
  path: string;
  nombre?: string;
  es_ingerible?: boolean;
  tamano_bytes?: number;
}

export interface HallazgosProyectoMin {
  documentos?: DocumentoCandidatoMin[];
  package_json?: {
    name?: string;
    description?: string;
  };
}

/**
 * Función pura que calcula la siguiente pregunta pendiente en la fase ONBOARDING (E2c / P4.2).
 *
 * Sigue estrictamente el orden canónico de canExitOnboarding.faltantes:
 * 1. fuente_de_verdad
 * 2. objetivo
 * 3. roles
 * 4. flujos_criticos
 * 5. entorno (solo si no existe en environments)
 *
 * Devuelve UNA sola Pregunta estructurada a la vez o null si el onboarding está completo.
 */
export function obtenerSiguientePreguntaOnboarding(
  contexto?: CanExitOnboardingContext | null,
  _lifecycle?: LifecycleState | null,
  hallazgos?: HallazgosProyectoMin | null,
  environments?: CanExitOnboardingEnvironments | null
): Pregunta | null {
  // Entorno por defecto o provisto
  const envsObj = environments ?? (contexto?.environments ? { environments: contexto.environments as Record<string, { url?: string }> } : { environments: { local: { url: 'http://localhost:3000' } } });
  const gate = canExitOnboarding(contexto, envsObj);

  if (gate.passed) {
    return null;
  }

  const faltantesCampos = new Set(gate.faltantes.map((f) => f.campo));

  // 1. Fuente de verdad
  if (faltantesCampos.has('source_of_truth') || faltantesCampos.has('context')) {
    const docs = (hallazgos?.documentos ?? []).slice(0, 3);

    let opciones: Opcion[];
    if (docs.length > 0) {
      opciones = docs.map((d, idx) => ({
        id: sanitizeDomString(d.path),
        etiqueta: sanitizeDomString(d.path),
        recomendada: idx === 0,
        efecto: { estado: 'confirmed' },
      }));
      opciones.push({
        id: 'none',
        etiqueta: 'No existe documento, definimos desde cero',
        efecto: { estado: 'confirmed' },
      });
    } else {
      opciones = [
        { id: 'custom', etiqueta: 'Sí existe (indicaré la ruta)', recomendada: true },
        { id: 'none', etiqueta: 'No, definimos desde cero', efecto: { estado: 'confirmed' } },
      ];
    }

    return {
      id: 'onboarding.fuente_de_verdad',
      texto: 'Selecciona la fuente de verdad del proyecto para extraer el alcance y especificación:',
      formato: 'una_opcion',
      opciones,
      permite_otra: true,
      registrar_con: { tool: 'qap_context_set', campo: 'source_of_truth' },
    };
  }

  // 2. Objetivo
  if (faltantesCampos.has('objective')) {
    const rawHypothesis = (contexto?.objective && !/^Configuración base de QA para\s+.*$/i.test(contexto.objective.trim()))
      ? contexto.objective
      : (hallazgos?.package_json?.description || '');

    const cleanHypothesis = sanitizeDomString(rawHypothesis).trim();

    if (cleanHypothesis.length >= 10) {
      return {
        id: 'onboarding.objetivo',
        texto: `El objetivo propuesto para el proyecto es: "${cleanHypothesis}". Confirma si es correcto o si requiere ajustes:`,
        formato: 'una_opcion',
        opciones: [
          { id: 'correcto', etiqueta: 'Es correcto', recomendada: true, efecto: { estado: 'confirmed' } },
          { id: 'ajustar', etiqueta: 'Hay que ajustarlo', efecto: { estado: 'rejected' } },
        ],
        permite_otra: true,
        registrar_con: { tool: 'qap_context_set', campo: 'objective' },
      };
    } else {
      return {
        id: 'onboarding.objetivo',
        texto: 'Describe el objetivo central del proyecto y la necesidad de negocio que resuelve:',
        formato: 'abierta',
        opciones: [],
        permite_otra: true,
        registrar_con: { tool: 'qap_context_set', campo: 'objective' },
      };
    }
  }

  // 3. Roles
  if (faltantesCampos.has('roles')) {
    const rawRoles = (contexto?.roles ?? [])
      .map((r) => sanitizeDomString(r.name).trim())
      .filter((n) => n.length > 0);
    const uniqueRoles = Array.from(new Set(rawRoles));

    let opciones: Opcion[];
    if (uniqueRoles.length >= 2) {
      opciones = uniqueRoles.map((r, idx) => ({
        id: r,
        etiqueta: r,
        recomendada: idx === 0,
        efecto: { estado: 'confirmed' },
      }));
    } else if (uniqueRoles.length === 1) {
      opciones = [
        { id: uniqueRoles[0], etiqueta: uniqueRoles[0], recomendada: true, efecto: { estado: 'confirmed' } },
        { id: 'administrador', etiqueta: 'Administrador (sugerencia)' },
        { id: 'invitado', etiqueta: 'Invitado (sugerencia)' },
      ];
    } else {
      opciones = [
        { id: 'usuario_final', etiqueta: 'Usuario final (sugerencia)', recomendada: true },
        { id: 'administrador', etiqueta: 'Administrador (sugerencia)' },
        { id: 'invitado', etiqueta: 'Invitado (sugerencia)' },
      ];
    }

    return {
      id: 'onboarding.roles',
      texto: 'Selecciona los roles de usuario que interactúan con el sistema o escribe otros roles adicionales:',
      formato: 'multiple',
      opciones,
      permite_otra: true,
      registrar_con: { tool: 'qap_context_set', campo: 'roles' },
    };
  }

  // 4. Flujos críticos
  if (faltantesCampos.has('critical_flows')) {
    const rawFlows = (contexto?.critical_flows ?? [])
      .map((f) => ({
        id: sanitizeDomString(f.name).trim(),
        etiqueta: sanitizeDomString(f.description ? `${f.name}: ${f.description}` : f.name).trim(),
      }))
      .filter((f) => f.id.length > 0);

    if (rawFlows.length >= 2) {
      return {
        id: 'onboarding.flujos_criticos',
        texto: 'Selecciona los flujos críticos o rutas prioritarias a verificar:',
        formato: 'multiple',
        opciones: rawFlows.map((f, idx) => ({
          id: f.id,
          etiqueta: f.etiqueta,
          recomendada: idx === 0,
          efecto: { estado: 'confirmed' },
        })),
        permite_otra: true,
        registrar_con: { tool: 'qap_context_set', campo: 'critical_flows' },
      };
    } else {
      return {
        id: 'onboarding.flujos_criticos',
        texto: 'Indica cuáles son los flujos críticos o procesos de negocio prioritarios que no pueden fallar:',
        formato: 'abierta',
        opciones: [],
        permite_otra: true,
        registrar_con: { tool: 'qap_context_set', campo: 'critical_flows' },
      };
    }
  }

  // 5. Entorno (solo si canExitOnboarding lo reporta y no existe URL)
  if (faltantesCampos.has('environments')) {
    return {
      id: 'onboarding.entorno',
      texto: 'Indica la URL base del entorno para ejecutar las pruebas (ej: http://localhost:3000):',
      formato: 'abierta',
      opciones: [],
      permite_otra: true,
      registrar_con: { tool: 'qap_context_set', campo: 'environments' },
    };
  }

  return null;
}
