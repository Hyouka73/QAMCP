/**
 * Tipos de datos canónicos para el Motor de Conocimiento Estático de QAP v3.0.
 *
 * Fuente de verdad técnica: qap-v3-architect/SKILL.md
 * Ubicación física del conocimiento: .qa/definitions/
 */

export type CapabilityType =
  | 'ui-interaction'
  | 'api-rest'
  | 'event-stream'
  | 'business-rule'
  | 'db-state';

export interface StateRequirement {
  capabilityId: string;
  condition?: string;
  isOptional?: boolean;
}

export interface PrerequisiteGroup {
  /** Modo de evaluación interno: 'ALL' para conjunción (AND), 'ANY' para disyunción (OR). */
  mode: 'ALL' | 'ANY';
  requirements: StateRequirement[];
}

export interface EmittedState {
  key: string;
  schemaRef?: string;
  description: string;
}

export interface CapabilityDefinition {
  id: string;
  name: string;
  type: CapabilityType;
  description?: string;
  moduleId: string;
  /** Relación AND entre grupos; el campo mode define si es ALL o ANY dentro de cada grupo. */
  prerequisiteGroups: PrerequisiteGroup[];
  emits: EmittedState[];
  guardrailIds?: string[];
  testBinding?: {
    file: string;
    identifier?: string;
  };
}

export interface ModuleDefinition {
  id: string;
  name: string;
  category: string;
  ownerSquad?: string;
  capabilities: CapabilityDefinition[];
}

export interface FlowStep {
  stepIndex: number;
  capabilityId: string;
  customLabel?: string;
  stepTimeoutMs?: number;
}

export interface FlowDefinition {
  id: string;
  name: string;
  description: string;
  tags: string[];
  steps: FlowStep[];
}
