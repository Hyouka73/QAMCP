/**
 * QAP Lifecycle State Machine and Pure Transition Engine (E2)
 *
 * Módulo puro sin I/O para la validación y ejecución de transiciones
 * de ciclo de vida del proyecto y de los módulos.
 */

import type {
  LifecycleState,
  ProjectPhase,
  ModuleLifecycleState,
  ModuleStateInfo,
  TransitionHistoryEntry,
  RuleEntry,
  RuleCategory,
  CategoryWaiver,
} from '@qap/shared';

import type { ProjectContext } from './ports.js';
import { computeCoverage, type CoverageResult } from './interview-engine.js';

export type LifecycleSession = LifecycleState['session'];

// ---------------------------------------------------------------------------
// Tablas de transiciones canónicas
// ---------------------------------------------------------------------------

/**
 * Tabla de transiciones del proyecto:
 * ONBOARDING -> SCOPING -> WORKING -> WRAP_UP; WRAP_UP -> SCOPING (nueva sesión).
 * Ninguna otra transición es válida.
 */
export const PROJECT_TRANSITIONS: Record<ProjectPhase, readonly ProjectPhase[]> = {
  ONBOARDING: ['SCOPING'],
  SCOPING: ['WORKING'],
  WORKING: ['WRAP_UP'],
  WRAP_UP: ['SCOPING'],
};

/**
 * Tabla de transiciones de módulos:
 * planned -> observed -> interviewing -> consolidated -> closed;
 * cualquier estado no terminal -> waived (exige waived_reason);
 * interviewing -> observed (re-observación) permitido.
 */
export const MODULE_TRANSITIONS: Record<ModuleLifecycleState, readonly ModuleLifecycleState[]> = {
  planned: ['observed', 'waived'],
  observed: ['interviewing', 'waived'],
  interviewing: ['consolidated', 'observed', 'waived'],
  consolidated: ['interviewing', 'closed', 'waived'],
  closed: [],
  waived: [],
};

// ---------------------------------------------------------------------------
// Tipos de error y resultado
// ---------------------------------------------------------------------------

export interface TransitionErrorDetails {
  razon: string;
  estado_actual: string;
  transiciones_permitidas: string[];
}

export class InvalidTransitionError extends Error {
  readonly razon: string;
  readonly estado_actual: string;
  readonly transiciones_permitidas: string[];

  constructor(details: TransitionErrorDetails) {
    super(`Transición inválida desde '${details.estado_actual}': ${details.razon}`);
    this.name = 'InvalidTransitionError';
    this.razon = details.razon;
    this.estado_actual = details.estado_actual;
    this.transiciones_permitidas = details.transiciones_permitidas;
  }
}

export type TransitionResult<T = LifecycleState> =
  | { success: true; ok: true; state: T; value: T; error?: never }
  | { success: false; ok: false; error: TransitionErrorDetails; state?: never; value?: never };

// ---------------------------------------------------------------------------
// Compuertas de salida por fase (Gate Predicates)
// ---------------------------------------------------------------------------

export interface GateFaltante {
  campo: string;
  motivo: string;
}

export interface GateResult {
  passed: boolean;
  faltantes: GateFaltante[];
  reason?: string;
}

export interface CanExitOnboardingContext {
  project_name?: string;
  description?: string;
  objective?: string;
  objective_source?: 'user' | 'prd' | 'inferred';
  roles?: Array<{ name: string; description?: string; source?: 'user' | 'prd' | 'inferred' }>;
  critical_flows?: Array<{ name: string; description?: string; priority?: string; source?: 'user' | 'prd' | 'inferred' }>;
  source_of_truth?: {
    type?: 'prd' | 'readme' | 'notes' | 'none';
    ref?: string;
    notes?: string;
    declared?: boolean;
    source?: 'user' | 'prd' | 'inferred';
  };
  ingest?: {
    doc_ref?: string;
    analyzed_by?: 'heuristic' | 'agent';
    analyzed_at?: string;
  };
  [key: string]: unknown;
}

export interface CanExitOnboardingEnvironments {
  environments?: Record<string, { url?: string }>;
  [key: string]: unknown;
}

/**
 * Invariante obligatorio de ciclo de vida (E2):
 * Todo módulo presente en session.plan tiene entrada en modules del estado (en planned al crearse).
 * modules puede tener más entradas que el plan (proyectos legacy).
 */
export function assertLifecycleStateInvariants(state: LifecycleState): { valid: boolean; reason?: string } {
  if (!state.session?.plan) {
    return { valid: true };
  }
  for (const item of state.session.plan) {
    if (!state.modules || !state.modules[item.module]) {
      return {
        valid: false,
        reason: `Violación de invariante: el módulo '${item.module}' de session.plan no existe en modules.`,
      };
    }
  }
  return { valid: true };
}

/**
 * Compuerta de salida: ONBOARDING -> SCOPING (E3)
 * pasa SOLO si:
 * 1. objective presente, >= 20 caracteres tras trim, distinto del texto autogenerado por qap_init, y con source user|prd;
 * 2. >= 1 rol con name, source user|prd;
 * 3. >= 1 flujo crítico con name, source user|prd;
 * 4. source_of_truth.declared === true (type "none" es válido solo si declared es true);
 *    si type es prd/readme/notes, exige ref o notas registradas; source user|prd;
 * 5. existe al menos un entorno con URL.
 * Devuelve { passed, faltantes: [{campo, motivo}] }. Campos con source "inferred" cuentan como faltantes (motivo: "sin confirmar").
 */
export function canExitOnboarding(
  context?: CanExitOnboardingContext | null,
  environments?: CanExitOnboardingEnvironments | null
): GateResult {
  const faltantes: GateFaltante[] = [];

  if (!context) {
    return {
      passed: false,
      faltantes: [
        { campo: 'context', motivo: 'context.yaml no proporcionado o inexistente' },
        { campo: 'objective', motivo: 'falta definir el objetivo del proyecto' },
        { campo: 'roles', motivo: 'debe definirse al menos un rol de usuario' },
        { campo: 'critical_flows', motivo: 'debe definirse al menos un flujo crítico' },
        { campo: 'source_of_truth', motivo: 'debe declararse la fuente de verdad del proyecto' },
        { campo: 'environments', motivo: 'debe existir al menos un entorno con URL configurada' },
      ],
      reason: 'context.yaml no proporcionado o inexistente',
    };
  }

  // 1. Objetivo
  const rawObjective = context.objective ?? (context as Record<string, unknown>).description;
  const objective = typeof rawObjective === 'string' ? rawObjective.trim() : '';
  const objSource = context.objective_source;

  if (!objective) {
    faltantes.push({ campo: 'objective', motivo: 'falta definir el objetivo del proyecto' });
  } else if (objective.length < 20) {
    faltantes.push({ campo: 'objective', motivo: 'el objetivo debe tener al menos 20 caracteres tras trim' });
  } else {
    const projectName = typeof context.project_name === 'string' ? context.project_name.trim() : '';
    const autogen = projectName ? `Configuración base de QA para ${projectName}` : '';
    if ((autogen && objective === autogen) || /^Configuración base de QA para\s+.*$/i.test(objective)) {
      faltantes.push({ campo: 'objective', motivo: 'el objetivo coincide con el texto autogenerado por qap_init' });
    } else if (objSource === 'inferred') {
      faltantes.push({ campo: 'objective', motivo: 'sin confirmar' });
    } else if (objSource !== 'user' && objSource !== 'prd') {
      faltantes.push({ campo: 'objective', motivo: 'el origen debe ser user o prd' });
    }
  }

  // 2. Roles
  const roles = context.roles;
  if (!roles || !Array.isArray(roles) || roles.length === 0) {
    faltantes.push({ campo: 'roles', motivo: 'debe definirse al menos un rol de usuario' });
  } else {
    const namedRoles = roles.filter((r) => r && typeof r.name === 'string' && r.name.trim().length > 0);
    if (namedRoles.length === 0) {
      faltantes.push({ campo: 'roles', motivo: 'debe definirse al menos un rol de usuario con nombre' });
    } else {
      const validRoles = namedRoles.filter((r) => r.source === 'user' || r.source === 'prd');
      if (validRoles.length === 0) {
        const hasInferred = namedRoles.some((r) => r.source === 'inferred');
        faltantes.push({ campo: 'roles', motivo: hasInferred ? 'sin confirmar' : 'el origen debe ser user o prd' });
      }
    }
  }

  // 3. Flujos críticos
  const flows = context.critical_flows;
  if (!flows || !Array.isArray(flows) || flows.length === 0) {
    faltantes.push({ campo: 'critical_flows', motivo: 'debe definirse al menos un flujo crítico' });
  } else {
    const namedFlows = flows.filter((f) => f && typeof f.name === 'string' && f.name.trim().length > 0);
    if (namedFlows.length === 0) {
      faltantes.push({ campo: 'critical_flows', motivo: 'debe definirse al menos un flujo crítico con nombre' });
    } else {
      const validFlows = namedFlows.filter((f) => f.source === 'user' || f.source === 'prd');
      if (validFlows.length === 0) {
        const hasInferred = namedFlows.some((f) => f.source === 'inferred');
        faltantes.push({ campo: 'critical_flows', motivo: hasInferred ? 'sin confirmar' : 'el origen debe ser user o prd' });
      }
    }
  }

  // 4. Fuente de verdad
  const sot = context.source_of_truth;
  if (!sot) {
    faltantes.push({ campo: 'source_of_truth', motivo: 'debe declararse la fuente de verdad del proyecto' });
  } else {
    if (sot.declared !== true) {
      faltantes.push({ campo: 'source_of_truth', motivo: 'la fuente de verdad debe estar confirmada (declared: true)' });
    } else if (sot.source === 'inferred') {
      faltantes.push({ campo: 'source_of_truth', motivo: 'sin confirmar' });
    } else if (sot.type !== 'none' && sot.type !== 'prd' && sot.type !== 'readme' && sot.type !== 'notes') {
      faltantes.push({ campo: 'source_of_truth', motivo: 'tipo de fuente de verdad inválido' });
    } else if (sot.type === 'prd' || sot.type === 'readme' || sot.type === 'notes') {
      const hasRef = typeof sot.ref === 'string' && sot.ref.trim().length > 0;
      const hasNotes = typeof sot.notes === 'string' && sot.notes.trim().length > 0;
      if (!hasRef && !hasNotes) {
        faltantes.push({ campo: 'source_of_truth', motivo: 'se requiere ref o notas registradas para la fuente de verdad' });
      }
    }
  }

  // 5. Entornos
  let hasEnvWithUrl = false;
  if (environments) {
    const envsMap = (environments as Record<string, unknown>).environments ?? environments;
    if (typeof envsMap === 'object' && envsMap !== null) {
      for (const key of Object.keys(envsMap)) {
        const env = (envsMap as Record<string, unknown>)[key] as { url?: string } | undefined;
        if (env && typeof env.url === 'string' && env.url.trim().length > 0) {
          hasEnvWithUrl = true;
          break;
        }
      }
    }
  }
  if (!hasEnvWithUrl) {
    faltantes.push({ campo: 'environments', motivo: 'debe existir al menos un entorno con URL configurada' });
  }

  const passed = faltantes.length === 0;
  return {
    passed,
    faltantes,
    reason: passed ? undefined : `Faltan campos obligatorios para superar ONBOARDING: ${faltantes.map((f) => f.campo).join(', ')}`,
  };
}

/**
 * Compuerta de salida: SCOPING -> WORKING (E3)
 * pasa SOLO si:
 * 1. session.plan tiene >= 1 módulo válido (name no vacío, path que inicia con "/", priority definida);
 * 2. session.auth está definido;
 * 3. y, si auth.required es true, el perfil indicado existe en los perfiles registrados.
 * Devuelve { passed, faltantes: [{campo, motivo}] }.
 */
export function canExitScoping(
  sessionOrState?: LifecycleSession | LifecycleState | null,
  registeredProfiles?: string[] | { profiles?: Array<{ id: string }> } | null
): GateResult {
  const faltantes: GateFaltante[] = [];
  const session: LifecycleSession | undefined | null =
    sessionOrState && 'session' in sessionOrState
      ? sessionOrState.session
      : sessionOrState;

  // 1. Plan de sesión
  const plan = session?.plan;
  if (!plan || !Array.isArray(plan) || plan.length === 0) {
    faltantes.push({ campo: 'session.plan', motivo: 'el plan de sesión debe contener al menos un módulo' });
  } else {
    let hasValidModule = false;
    for (const item of plan) {
      const modName = (item.module ?? (item as unknown as { name?: string }).name ?? '').trim();
      const modPath = (item.path ?? '').trim();
      const priority = (item.priority ?? '').trim();

      if (!modName || !modPath || !priority) {
        faltantes.push({
          campo: 'session.plan',
          motivo: `módulo '${modName || '(sin nombre)'}' incompleto: requiere nombre, ruta y prioridad`,
        });
        continue;
      }

      if (!modPath.startsWith('/')) {
        faltantes.push({
          campo: 'session.plan',
          motivo: `la ruta '${modPath}' del módulo '${modName}' debe iniciar con '/'`,
        });
        continue;
      }

      hasValidModule = true;
    }

    if (!hasValidModule && faltantes.every((f) => f.campo !== 'session.plan')) {
      faltantes.push({ campo: 'session.plan', motivo: 'el plan no contiene ningún módulo válido' });
    }
  }

  // 2. Auth en session
  if (!session?.auth) {
    faltantes.push({ campo: 'session.auth', motivo: 'debe definirse la decisión de autenticación (auth.required)' });
  } else if (session.auth.required === true) {
    const profile = session.auth.profile?.trim();
    if (!profile) {
      faltantes.push({ campo: 'session.auth.profile', motivo: 'debe indicarse un perfil cuando auth.required es true' });
    } else {
      const profileIds: string[] = Array.isArray(registeredProfiles)
        ? registeredProfiles
        : Array.isArray((registeredProfiles as { profiles?: Array<{ id: string }> })?.profiles)
        ? (registeredProfiles as { profiles?: Array<{ id: string }> }).profiles!.map((p) => p.id)
        : [];

      if (!profileIds.includes(profile)) {
        faltantes.push({
          campo: 'session.auth.profile',
          motivo: `el perfil de autenticación '${profile}' no existe en los perfiles registrados`,
        });
      }
    }
  }

  const passed = faltantes.length === 0;
  return {
    passed,
    faltantes,
    reason: passed ? undefined : `Faltan requerimientos de alcance para superar SCOPING: ${faltantes.map((f) => f.campo).join(', ')}`,
  };
}

/**
 * Compuerta pura de cierre de módulo: canCloseModule (E2)
 *
 * Pasa SOLO si:
 * 1. La cobertura de la vista es completa (completa: true)
 * 2. No existen reglas inferidas pendientes (inferidas_pendientes == 0)
 */
export interface CanCloseModuleResult {
  passed: boolean;
  reason?: string;
  coverage: CoverageResult;
}

export function canCloseModule(
  rules: RuleEntry[],
  waivers: CategoryWaiver[],
  applicableCategories: RuleCategory[],
  view: string = 'default'
): CanCloseModuleResult {
  const coverage = computeCoverage(applicableCategories, rules, waivers, view);
  if (coverage.inferidas_pendientes > 0) {
    return {
      passed: false,
      reason: `El módulo no cumple la compuerta canCloseModule: existen ${coverage.inferidas_pendientes} regla(s) inferida(s) pendiente(s) de resolución.`,
      coverage,
    };
  }
  if (!coverage.completa) {
    const missing = Object.entries(coverage.categorias)
      .filter(([, v]) => v.aplicable && !v.cubierta)
      .map(([k]) => k);
    return {
      passed: false,
      reason: `El módulo no cumple la compuerta canCloseModule: cobertura incompleta. Categorías pendientes: ${missing.join(', ')}.`,
      coverage,
    };
  }
  return {
    passed: true,
    coverage,
  };
}

export interface ExitWorkingFaltante {
  modulo: string;
  estado: string;
  campo: string;
  motivo: string;
}

export interface CanExitWorkingResult {
  passed: boolean;
  faltantes: ExitWorkingFaltante[];
  reason?: string;
}

/**
 * Compuerta de salida: WORKING -> WRAP_UP (E3)
 *
 * Pasa SOLO si:
 * 1. session.plan no está vacío
 * 2. Todos los módulos del plan están en estado 'closed' o 'waived' (con su reason no vacía)
 * Proyectos legacy con plan vacío: no pasa; el motivo indica registrar el plan con qap_session_plan.
 */
export function canExitWorking(
  sessionOrState?: LifecycleSession | LifecycleState | null,
  modulesState?: Record<string, ModuleStateInfo> | null
): CanExitWorkingResult {
  const session: LifecycleSession | undefined | null =
    sessionOrState && 'session' in sessionOrState
      ? sessionOrState.session
      : sessionOrState;

  const modules: Record<string, ModuleStateInfo> =
    modulesState ??
    (sessionOrState && 'modules' in sessionOrState
      ? sessionOrState.modules
      : {});

  const plan = session?.plan;
  if (!plan || !Array.isArray(plan) || plan.length === 0) {
    return {
      passed: false,
      faltantes: [],
      reason: 'El plan de sesión está vacío. Registra el plan con qap_session_plan antes de cerrar la sesión.',
    };
  }

  const faltantes: ExitWorkingFaltante[] = [];
  for (const item of plan) {
    const modName = item.module;
    const modInfo = modules[modName];
    const currentState = modInfo?.state;

    if (currentState === 'closed') {
      continue;
    }
    if (currentState === 'waived') {
      if (!modInfo.waived_reason || modInfo.waived_reason.trim().length === 0) {
        faltantes.push({
          modulo: modName,
          estado: 'waived (sin justificación)',
          campo: `modules.${modName}`,
          motivo: 'waived exige waived_reason',
        });
      }
      continue;
    }

    faltantes.push({
      modulo: modName,
      estado: currentState || 'desconocido',
      campo: `modules.${modName}`,
      motivo: `estado actual '${currentState || 'desconocido'}' no es terminal (closed o waived)`,
    });
  }

  const passed = faltantes.length === 0;
  return {
    passed,
    faltantes,
    reason: passed
      ? undefined
      : `Existen módulos pendientes en el plan de sesión que no han sido cerrados ni renunciados: ${faltantes.map((f) => `${f.modulo} (${f.estado})`).join(', ')}.`,
  };
}

/**
 * Compuerta de salida: WRAP_UP -> SCOPING
 */
export function canExitWrapUp(): GateResult {
  return { passed: true, faltantes: [] };
}

// ---------------------------------------------------------------------------
// Funciones puras de validación de transiciones
// ---------------------------------------------------------------------------

/**
 * Valida una transición de fase de proyecto.
 */
export function validateProjectTransition(
  from: ProjectPhase,
  to: ProjectPhase
): TransitionResult<ProjectPhase> {
  const allowed = PROJECT_TRANSITIONS[from] || [];
  if (!allowed.includes(to)) {
    return {
      success: false,
      ok: false,
      error: {
        razon: `Transición de proyecto inválida: no se permite pasar de '${from}' a '${to}'.`,
        estado_actual: from,
        transiciones_permitidas: [...allowed],
      },
    };
  }

  return {
    success: true,
    ok: true,
    state: to,
    value: to,
  };
}

/**
 * Valida una transición de estado de módulo.
 */
export function validateModuleTransition(
  from: ModuleLifecycleState,
  to: ModuleLifecycleState,
  waivedReason?: string
): TransitionResult<ModuleLifecycleState> {
  const allowed = MODULE_TRANSITIONS[from] || [];

  if (from === 'closed' || from === 'waived') {
    return {
      success: false,
      ok: false,
      error: {
        razon: `El estado '${from}' es terminal y no permite transiciones.`,
        estado_actual: from,
        transiciones_permitidas: [],
      },
    };
  }

  if (to === 'waived') {
    if (!waivedReason || waivedReason.trim() === '') {
      return {
        success: false,
        ok: false,
        error: {
          razon: 'La transición a waived exige un waived_reason no vacío.',
          estado_actual: from,
          transiciones_permitidas: [...allowed],
        },
      };
    }
  }

  if (!allowed.includes(to)) {
    return {
      success: false,
      ok: false,
      error: {
        razon: `Transición de módulo inválida: no se permite pasar de '${from}' a '${to}'.`,
        estado_actual: from,
        transiciones_permitidas: [...allowed],
      },
    };
  }

  return {
    success: true,
    ok: true,
    state: to,
    value: to,
  };
}

/**
 * Añade una entrada al historial respetando el límite máximo de 50 entradas (FIFO).
 */
export function appendTransitionHistory(
  history: TransitionHistoryEntry[],
  entry: TransitionHistoryEntry
): TransitionHistoryEntry[] {
  const next = [...(history || []), entry];
  if (next.length > 50) {
    return next.slice(next.length - 50);
  }
  return next;
}

// ---------------------------------------------------------------------------
// Funciones puras de transición sobre LifecycleState completo
// ---------------------------------------------------------------------------

/**
 * Transiciona la fase del proyecto actualizando estado e historial.
 */
export function transitionProject(
  state: LifecycleState,
  toPhase: ProjectPhase,
  reason?: string,
  options?: {
    context?: CanExitOnboardingContext | null;
    environments?: CanExitOnboardingEnvironments | null;
    session?: LifecycleSession | null;
    registeredProfiles?: string[] | { profiles?: Array<{ id: string }> } | null;
    checkGates?: boolean;
  }
): TransitionResult<LifecycleState> {
  const validation = validateProjectTransition(state.phase, toPhase);
  if (!validation.success) {
    return validation;
  }

  if (options?.checkGates) {
    if (state.phase === 'ONBOARDING' && toPhase === 'SCOPING') {
      const gate = canExitOnboarding(options.context, options.environments);
      if (!gate.passed) {
        return {
          success: false,
          ok: false,
          error: {
            razon: gate.reason || 'Compuerta de salida de ONBOARDING no superada.',
            estado_actual: state.phase,
            transiciones_permitidas: [...PROJECT_TRANSITIONS[state.phase]],
          },
        };
      }
    } else if (state.phase === 'SCOPING' && toPhase === 'WORKING') {
      const gate = canExitScoping(options.session ?? state.session, options.registeredProfiles);
      if (!gate.passed) {
        return {
          success: false,
          ok: false,
          error: {
            razon: gate.reason || 'Compuerta de salida de SCOPING no superada.',
            estado_actual: state.phase,
            transiciones_permitidas: [...PROJECT_TRANSITIONS[state.phase]],
          },
        };
      }
    } else if (state.phase === 'WORKING') {
      const gate = canExitWorking(state);
      if (!gate.passed) {
        return {
          success: false,
          ok: false,
          error: {
            razon: gate.reason || 'Compuerta no superada.',
            estado_actual: state.phase,
            transiciones_permitidas: [...PROJECT_TRANSITIONS[state.phase]],
          },
        };
      }
    } else if (state.phase === 'WRAP_UP') {
      const gate = canExitWrapUp();
      if (!gate.passed) {
        return {
          success: false,
          ok: false,
          error: {
            razon: gate.reason || 'Compuerta no superada.',
            estado_actual: state.phase,
            transiciones_permitidas: [...PROJECT_TRANSITIONS[state.phase]],
          },
        };
      }
    }
  }

  const historyEntry: TransitionHistoryEntry = {
    from: state.phase,
    to: toPhase,
    at: new Date().toISOString(),
    ...(reason ? { reason } : {}),
  };

  const newState: LifecycleState = {
    ...state,
    phase: toPhase,
    history: appendTransitionHistory(state.history, historyEntry),
  };

  return {
    success: true,
    ok: true,
    state: newState,
    value: newState,
  };
}

/**
 * Transiciona el estado de un módulo en LifecycleState.
 */
export function transitionModule(
  state: LifecycleState,
  moduleName: string,
  toState: ModuleLifecycleState,
  options?: { waived_reason?: string; reason?: string }
): TransitionResult<LifecycleState> {
  const current = state.modules[moduleName] || {
    state: 'planned' as const,
    updated_at: new Date().toISOString(),
  };

  const validation = validateModuleTransition(
    current.state,
    toState,
    options?.waived_reason
  );
  if (!validation.success) {
    return validation;
  }

  const now = new Date().toISOString();
  const updatedModule: ModuleStateInfo = {
    state: toState,
    updated_at: now,
    ...(options?.waived_reason ? { waived_reason: options.waived_reason } : {}),
  };

  const historyEntry: TransitionHistoryEntry = {
    from: `${moduleName}:${current.state}`,
    to: `${moduleName}:${toState}`,
    at: now,
    module: moduleName,
    ...(options?.reason || options?.waived_reason
      ? { reason: options.reason || options.waived_reason }
      : {}),
  };

  const newState: LifecycleState = {
    ...state,
    modules: {
      ...state.modules,
      [moduleName]: updatedModule,
    },
    history: appendTransitionHistory(state.history, historyEntry),
  };

  return {
    success: true,
    ok: true,
    state: newState,
    value: newState,
  };
}

export type TransitionOutput = LifecycleState | ProjectPhase | ModuleLifecycleState;

/**
 * Función de transición polimórfica que soporta:
 * 1. transition(fromState, toState, options?) -> TransitionResult<ProjectPhase | ModuleLifecycleState>
 * 2. transition(lifecycleState, toPhase, options?) -> TransitionResult<LifecycleState>
 * 3. transition(lifecycleState, { module, to, waived_reason, reason }, options?) -> TransitionResult<LifecycleState>
 */
export function transition(
  fromOrState: ProjectPhase | ModuleLifecycleState | LifecycleState,
  toOrTarget:
    | ProjectPhase
    | ModuleLifecycleState
    | { module: string; to: ModuleLifecycleState; waived_reason?: string; reason?: string },
  options?: {
    waived_reason?: string;
    reason?: string;
    context?: ProjectContext | null;
    checkGates?: boolean;
  }
): TransitionResult<TransitionOutput> {
  // Caso 2 & 3: Se pasa un objeto LifecycleState completo
  if (typeof fromOrState === 'object' && fromOrState !== null && 'phase' in fromOrState && 'modules' in fromOrState) {
    if (typeof toOrTarget === 'object' && toOrTarget !== null && 'module' in toOrTarget) {
      return transitionModule(fromOrState, toOrTarget.module, toOrTarget.to, {
        waived_reason: toOrTarget.waived_reason ?? options?.waived_reason,
        reason: toOrTarget.reason ?? options?.reason,
      });
    }

    if (typeof toOrTarget === 'string' && (toOrTarget === 'ONBOARDING' || toOrTarget === 'SCOPING' || toOrTarget === 'WORKING' || toOrTarget === 'WRAP_UP')) {
      return transitionProject(fromOrState, toOrTarget, options?.reason, {
        context: options?.context,
        checkGates: options?.checkGates,
      });
    }
  }

  // Caso 1a: Transición de fase de proyecto
  const projectPhases: ProjectPhase[] = ['ONBOARDING', 'SCOPING', 'WORKING', 'WRAP_UP'];
  if (
    typeof fromOrState === 'string' &&
    projectPhases.includes(fromOrState as ProjectPhase) &&
    typeof toOrTarget === 'string' &&
    projectPhases.includes(toOrTarget as ProjectPhase)
  ) {
    return validateProjectTransition(fromOrState as ProjectPhase, toOrTarget as ProjectPhase);
  }

  // Caso 1b: Transición de estado de módulo
  const moduleStates: ModuleLifecycleState[] = [
    'planned',
    'observed',
    'interviewing',
    'consolidated',
    'closed',
    'waived',
  ];
  if (
    typeof fromOrState === 'string' &&
    moduleStates.includes(fromOrState as ModuleLifecycleState) &&
    typeof toOrTarget === 'string' &&
    moduleStates.includes(toOrTarget as ModuleLifecycleState)
  ) {
    return validateModuleTransition(
      fromOrState as ModuleLifecycleState,
      toOrTarget as ModuleLifecycleState,
      options?.waived_reason
    );
  }

  const fromStr = typeof fromOrState === 'string' ? fromOrState : JSON.stringify(fromOrState);
  const toStr = typeof toOrTarget === 'string' ? toOrTarget : JSON.stringify(toOrTarget);

  return {
    success: false,
    ok: false,
    error: {
      razon: `Parámetros de transición desconocidos: '${fromStr}' -> '${toStr}'`,
      estado_actual: fromStr,
      transiciones_permitidas: [],
    },
  };
}
