/**
 * Tipos TypeScript para el contexto de negocio y del proyecto (.qa/project/context.yaml) (E1)
 */

export type ContextSource = 'user' | 'prd' | 'inferred';

export type SourceOfTruthType = 'prd' | 'readme' | 'notes' | 'none';

export interface BusinessRole {
  name: string;
  description?: string;
  source?: ContextSource;
}

export interface CriticalFlow {
  name: string;
  description?: string;
  priority?: string;
  source?: ContextSource;
}

export interface SourceOfTruth {
  type: SourceOfTruthType;
  ref?: string;
  notes?: string;
  declared: boolean;
  source?: ContextSource;
}

export interface ProjectContext {
  _version: string;
  project_name: string;
  description?: string;
  tech_stack?: string[];
  base_url?: string;
  manually_edited?: boolean;
  objective?: string;
  objective_source?: ContextSource;
  roles?: BusinessRole[];
  critical_flows?: CriticalFlow[];
  source_of_truth?: SourceOfTruth;
  [key: string]: unknown;
}
