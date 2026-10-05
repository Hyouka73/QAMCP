/**
 * Tipos TypeScript para el estado del ciclo de vida de QAP (E1)
 */

export type ProjectPhase = 'ONBOARDING' | 'SCOPING' | 'WORKING' | 'WRAP_UP';

export type ModuleLifecycleState =
  | 'planned'
  | 'observed'
  | 'interviewing'
  | 'consolidated'
  | 'closed'
  | 'waived';

export interface SessionPlanItem {
  module: string;
  path: string;
  priority: string;
  status: string;
  acceso?: boolean;
}

export interface SessionAuthConfig {
  required: boolean;
  source?: 'user' | 'system' | 'inferred';
  profile?: string;
  method?: 'handoff' | 'credentials';
  roles?: string[];
}

export interface LifecycleSession {
  id: string;
  started_at: string;
  plan: SessionPlanItem[];
  auth?: SessionAuthConfig;
}

export interface ModuleStateInfo {
  state: ModuleLifecycleState;
  waived_reason?: string;
  updated_at: string;
}

export interface TransitionHistoryEntry {
  from: string;
  to: string;
  at: string;
  reason?: string;
  module?: string;
}

export interface LifecycleState {
  _version: string;
  phase: ProjectPhase;
  session: LifecycleSession;
  modules: Record<string, ModuleStateInfo>;
  history: TransitionHistoryEntry[];
}
