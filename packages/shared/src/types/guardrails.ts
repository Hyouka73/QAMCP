/**
 * Guardrail Definition Types for QAP v3.0
 * 
 * Subsystem: Guardrails & Business Invariants
 * Reference: qap-guardrails-engine
 */

export type GuardrailSeverity = 'critical' | 'high' | 'medium' | 'low';

export type GuardrailCategory =
  | 'security'
  | 'financial-integrity'
  | 'business-invariant'
  | 'compliance'
  | 'performance';

export interface GuardrailDefinition {
  /** Identificador único, ej: "G-001" o "auth.mfa.required" */
  id: string;
  /** Nombre legible o título de la invariante */
  name: string;
  /** Categoría funcional o arquitectónica */
  category: GuardrailCategory;
  /** Nivel de impacto o severidad */
  severity: GuardrailSeverity;
  /** Explicación de la invariante en lenguaje natural */
  description: string;
  /** Justificación de negocio o marco normativo */
  rationale?: string;
  /** Lista de capabilities que salvaguardan y comprueban este guardrail */
  enforcedByCapabilities: string[];
  /** Expresión booleana o condición formal de violación si aplica */
  violationCondition?: string;
  /** Guía técnica o pasos de mitigación en caso de violación */
  remediation: string;
  /** Squad responsable de velar por este guardrail */
  ownerSquad: string;
}
