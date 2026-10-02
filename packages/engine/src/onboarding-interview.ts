import type { LifecycleState } from '@qap/shared';

import type { CanExitOnboardingContext, CanExitOnboardingEnvironments } from './lifecycle.js';
import { canExitOnboarding } from './lifecycle.js';
import { type Pregunta, type Opcion, generarRenderTexto } from './pregunta.js';
import { sanitizeDomString, truncarTexto } from './interview-engine.js';

export interface DocumentoCandidatoMin {
  path: string;
  nombre?: string;
  es_ingerible?: boolean;
  tamano_bytes?: number;
}

export interface ServicioDetectadoMin {
  url: string;
  label: string;
  evidencia: string;
}

export interface HallazgosProyectoMin {
  documentos?: DocumentoCandidatoMin[];
  package_json?: {
    name?: string;
    description?: string;
  };
  preliminar?: {
    docPath: string;
    objetivo?: string;
    roles?: string[];
  };
  docAnalizado?: string;
  servicios?: ServicioDetectadoMin[];
}

function crearPregunta(p: Omit<Pregunta, 'render_texto'>): Pregunta {
  const render_texto = generarRenderTexto(p);
  const result: Pregunta = {
    ...p,
    render_texto,
  };
  if (p.seguimiento) {
    result.seguimiento = {
      ...p.seguimiento,
      render_texto: generarRenderTexto(p.seguimiento),
    };
  }
  return result;
}

/**
 * Función pura que calcula la siguiente pregunta pendiente en la fase ONBOARDING (E2c / P4.2 / P4.3).
 *
 * Sigue el orden canónico con auto-ingesta y confirmación única:
 * 1. fuente_de_verdad (con preliminar si existe)
 * 2. confirmación única si objetivo, roles y flujos tienen propuestas inferred
 * 3. objetivo (fallback)
 * 4. roles (fallback)
 * 5. flujos_criticos (fallback)
 * 6. entorno (solo si no existe en environments)
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
  const envsObj = environments ?? (contexto?.environments ? { environments: contexto.environments as Record<string, { url?: string }> } : null);
  const gate = canExitOnboarding(contexto, envsObj);

  if (gate.passed) {
    return null;
  }

  const faltantesCampos = new Set(gate.faltantes.map((f) => f.campo));
  const docAnalizado = hallazgos?.docAnalizado || (contexto?.source_of_truth?.ref ? sanitizeDomString(contexto.source_of_truth.ref, 500) : '');

  // 1. Fuente de verdad
  if (faltantesCampos.has('source_of_truth') || faltantesCampos.has('context')) {
    const docs = (hallazgos?.documentos ?? []).slice(0, 3);

    let opciones: Opcion[];
    if (docs.length > 0) {
      opciones = docs.map((d, idx) => ({
        id: sanitizeDomString(d.path, 500),
        etiqueta: sanitizeDomString(d.path, 500),
        recomendada: idx === 0,
        efecto: { accion: 'declarar_fuente' as const },
      }));
      opciones.push({
        id: 'none',
        etiqueta: 'No existe documento, definimos desde cero',
        efecto: { accion: 'sin_documento' as const },
      });
    } else {
      opciones = [
        { id: 'custom', etiqueta: 'Sí existe (indicaré la ruta)', recomendada: true, efecto: { accion: 'declarar_fuente' as const } },
        { id: 'none', etiqueta: 'No, definimos desde cero', efecto: { accion: 'sin_documento' as const } },
      ];
    }

    let texto = 'Selecciona la fuente de verdad del proyecto para extraer el alcance y especificación:';
    if (hallazgos?.preliminar?.docPath && hallazgos?.preliminar?.objetivo) {
      const cleanObj = truncarTexto(hallazgos.preliminar.objetivo, 280);
      const cleanDoc = sanitizeDomString(hallazgos.preliminar.docPath, 500);
      texto = `Encontré '${cleanDoc}'; entendí: objetivo '${cleanObj}'. Selecciona la fuente de verdad del proyecto para extraer el alcance y especificación:`;
    }

    return crearPregunta({
      id: 'onboarding.fuente_de_verdad',
      texto,
      formato: 'una_opcion',
      opciones,
      permite_otra: true,
      registrar_con: { tool: 'qap_context_set', campo: 'source_of_truth' },
    });
  }

  // Comprobar si los 3 campos clave (objetivo, roles, flujos) tienen propuesta
  const hasObjectiveProposal = Boolean(
    contexto?.objective &&
    !/^Configuración base de QA para\s+.*$/i.test(contexto.objective.trim()) &&
    contexto.objective.trim().length >= 10
  );
  const hasRolesProposal = Array.isArray(contexto?.roles) && contexto.roles.length > 0;
  const hasFlowsProposal = Array.isArray(contexto?.critical_flows) && contexto.critical_flows.length > 0;

  // 2. Confirmación única (E4a) cuando objective, roles y flujos tienen propuesta
  if (hasObjectiveProposal && hasRolesProposal && hasFlowsProposal) {
    const rolesList = (contexto?.roles ?? []).map((r) => sanitizeDomString(r.name)).join(', ');
    const flowsList = (contexto?.critical_flows ?? []).map((f) => sanitizeDomString(f.name)).join(', ');
    const rawBaseUrl = (contexto as Record<string, unknown> | undefined)?.base_url;
    const envUrl = envsObj?.environments?.local?.url || (envsObj?.environments ? Object.values(envsObj.environments).find((e) => typeof e?.url === 'string' && e.url.trim().length > 0)?.url : undefined);
    const hasUrl = Boolean(
      (typeof rawBaseUrl === 'string' && rawBaseUrl.trim().length > 0) ||
      (typeof envUrl === 'string' && envUrl.trim().length > 0)
    );
    const baseUrl = hasUrl
      ? (typeof rawBaseUrl === 'string' && rawBaseUrl.trim().length > 0 ? rawBaseUrl.trim() : (envUrl as string).trim())
      : '(sin definir)';
    const cleanObjective = truncarTexto(contexto?.objective, 280);

    const textoResumen = `Resumen de configuración detectado para el proyecto:\n1. Objetivo: ${cleanObjective}\n2. Roles: ${rolesList}\n3. Flujos críticos: ${flowsList}\n4. URL base: ${baseUrl}\nConfirma la configuración o selecciona los campos a corregir:`;

    const seguimientoPregunta: Pregunta = {
      id: 'onboarding.campos_a_corregir',
      texto: 'Selecciona los campos que requieren corrección:',
      formato: 'multiple',
      opciones: [
        { id: 'objective', etiqueta: 'Objetivo' },
        { id: 'roles', etiqueta: 'Roles' },
        { id: 'critical_flows', etiqueta: 'Flujos críticos' },
        { id: 'base_url', etiqueta: 'URL base' },
      ],
      permite_otra: false,
      registrar_con: { tool: 'qap_context_set', campo: 'corregir' },
    };

    const opcionesResumen: Opcion[] = hasUrl
      ? [
          {
            id: 'confirmo_todo',
            etiqueta: 'Confirmo todo',
            recomendada: true,
            efecto: { accion: 'confirmar_resumen' as const },
          },
          {
            id: 'corregir',
            etiqueta: 'Quiero corregir algo',
            efecto: { accion: 'corregir' as const, abre_seguimiento: true },
          },
        ]
      : [
          {
            id: 'definir_url',
            etiqueta: 'Definir URL de entorno',
            recomendada: true,
            efecto: { accion: 'definir_url' as const },
          },
          {
            id: 'corregir',
            etiqueta: 'Quiero corregir algo',
            efecto: { accion: 'corregir' as const, abre_seguimiento: true },
          },
        ];

    return crearPregunta({
      id: 'onboarding.confirmar_resumen',
      texto: textoResumen,
      formato: 'una_opcion',
      opciones: opcionesResumen,
      permite_otra: false,
      registrar_con: { tool: 'qap_context_set', campo: 'confirmar_resumen' },
      seguimiento: seguimientoPregunta,
    });
  }

  // 3. Fallback: Objetivo
  if (faltantesCampos.has('objective')) {
    const rawHypothesis = (contexto?.objective && !/^Configuración base de QA para\s+.*$/i.test(contexto.objective.trim()))
      ? contexto.objective
      : (hallazgos?.package_json?.description || '');

    const cleanHypothesis = truncarTexto(rawHypothesis, 280);

    if (cleanHypothesis.length >= 10) {
      return crearPregunta({
        id: 'onboarding.objetivo',
        texto: `El objetivo propuesto para el proyecto es: "${cleanHypothesis}". Confirma si es correcto o si requiere ajustes:`,
        formato: 'una_opcion',
        opciones: [
          { id: 'correcto', etiqueta: 'Es correcto', recomendada: true, efecto: { estado: 'confirmed' } },
          { id: 'ajustar', etiqueta: 'Hay que ajustarlo', efecto: { estado: 'rejected' } },
        ],
        permite_otra: true,
        registrar_con: { tool: 'qap_context_set', campo: 'objective' },
      });
    } else {
      const prefix = docAnalizado ? `No encontré objetivo en '${docAnalizado}'. ` : '';
      return crearPregunta({
        id: 'onboarding.objetivo',
        texto: `${prefix}Describe el objetivo central del proyecto y la necesidad de negocio que resuelve:`,
        formato: 'abierta',
        opciones: [],
        permite_otra: true,
        registrar_con: { tool: 'qap_context_set', campo: 'objective' },
      });
    }
  }

  // 4. Fallback: Roles
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

    const prefix = (docAnalizado && uniqueRoles.length === 0) ? `No encontré roles en '${docAnalizado}'. ` : '';
    return crearPregunta({
      id: 'onboarding.roles',
      texto: `${prefix}Selecciona los roles de usuario que interactúan con el sistema o escribe otros roles adicionales:`,
      formato: 'multiple',
      opciones,
      permite_otra: true,
      registrar_con: { tool: 'qap_context_set', campo: 'roles' },
    });
  }

  // 5. Fallback: Flujos críticos
  if (faltantesCampos.has('critical_flows')) {
    const rawFlows = (contexto?.critical_flows ?? [])
      .map((f) => ({
        id: sanitizeDomString(f.name).trim(),
        etiqueta: sanitizeDomString(f.description ? `${f.name}: ${f.description}` : f.name).trim(),
      }))
      .filter((f) => f.id.length > 0);

    if (rawFlows.length >= 2) {
      return crearPregunta({
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
      });
    } else {
      const prefix = docAnalizado ? `No encontré flujos en '${docAnalizado}'. ` : '';
      return crearPregunta({
        id: 'onboarding.flujos_criticos',
        texto: `${prefix}Indica cuáles son los flujos críticos o procesos de negocio prioritarios que no pueden fallar:`,
        formato: 'abierta',
        opciones: [],
        permite_otra: true,
        registrar_con: { tool: 'qap_context_set', campo: 'critical_flows' },
      });
    }
  }

  // 6. Entorno (solo si canExitOnboarding lo reporta y no existe URL)
  if (faltantesCampos.has('environments')) {
    const servicios = hallazgos?.servicios || [];
    let opciones: Opcion[] = [];
    if (servicios.length > 0) {
      opciones = servicios.map((s, idx) => ({
        id: s.url,
        etiqueta: `${s.url} - ${s.label} (${s.evidencia})`,
        recomendada: idx === 0,
      }));
    }

    return crearPregunta({
      id: 'onboarding.url_entorno',
      texto: 'Indica o selecciona la URL base del entorno para ejecutar las pruebas:',
      formato: opciones.length > 0 ? 'una_opcion' : 'abierta',
      opciones,
      permite_otra: true,
      registrar_con: { tool: 'qap_context_set', campo: 'environments' },
    });
  }

  return null;
}

