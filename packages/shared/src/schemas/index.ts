/**
 * QAP Shared Schemas Index
 * 
 * This module exports all JSON schemas for validation across the QAP system.
 * 
 * CRITERIO PARA _version:
 * - Los schemas que representan archivos de configuración o definición "fuente" (source files)
 *   incluyen el campo _version como requerido. Estos son archivos que los usuarios o desarrolladores
 *   editan manualmente y cuya estructura puede evolucionar con el tiempo:
 *   • auth-profiles.schema.json
 *   • environments.schema.json
 *   • execution-result.schema.json
 *   • module-context.schema.json
 *   • prereqs.schema.json
 *   • project-init.schema.json
 *   • rules.schema.json
 *   • module-flows.schema.json
 *   • flow.schema.json
 *   • tc-case.schema.json
 * 
 * - Los schemas que representan archivos derivados o regenerables (derived/regenerable files)
 *   OMITEN el campo _version. Estos archivos se generan automáticamente a partir de otras fuentes
 *   y pueden ser recalculados en cualquier momento sin pérdida de información:
 *   • selectors.schema.json — Se extrae/mapea automáticamente del análisis del DOM o módulo
 *   • semantic-hash.schema.json — Se calcula automáticamente a partir de otros archivos
 * 
 * La razón es que los archivos derivados no necesitan tracking de versión de schema porque:
 * 1. Su estructura es estable y simple
 * 2. Si cambia la forma de calcularlos, se regeneran completos
 * 3. No hay riesgo de tener datos "huérfanos" de versiones anteriores
 */

import authProfilesSchema from './auth-profiles.schema.json' with { type: 'json' };
import profilesSchema from './profiles.schema.json' with { type: 'json' };
import environmentsSchema from './environments.schema.json' with { type: 'json' };
import executionResultSchema from './execution-result.schema.json' with { type: 'json' };
import moduleContextSchema from './module-context.schema.json' with { type: 'json' };
import prereqsSchema from './prereqs.schema.json' with { type: 'json' };
import projectInitSchema from './project-init.schema.json' with { type: 'json' };
import rulesSchema from './rules.schema.json' with { type: 'json' };
import moduleFlowsSchema from './module-flows.schema.json' with { type: 'json' };
import flowSchema from './flow.schema.json' with { type: 'json' };
import tcCaseSchema from './tc-case.schema.json' with { type: 'json' };
import selectorsSchema from './selectors.schema.json' with { type: 'json' };
import semanticHashSchema from './semantic-hash.schema.json' with { type: 'json' };
import systemPromptSchema from './system-prompt.schema.json' with { type: 'json' };

export {
  authProfilesSchema,
  profilesSchema,
  environmentsSchema,
  executionResultSchema,
  moduleContextSchema,
  prereqsSchema,
  projectInitSchema,
  rulesSchema,
  moduleFlowsSchema,
  flowSchema,
  tcCaseSchema,
  selectorsSchema,
  semanticHashSchema,
  systemPromptSchema,
};

// Export all schemas as a record for dynamic access
export const schemas = {
  'auth-profiles': authProfilesSchema,
  profiles: profilesSchema,
  environments: environmentsSchema,
  'execution-result': executionResultSchema,
  'module-context': moduleContextSchema,
  prereqs: prereqsSchema,
  'project-init': projectInitSchema,
  rules: rulesSchema,
  'module-flows': moduleFlowsSchema,
  flow: flowSchema,
  'tc-case': tcCaseSchema,
  selectors: selectorsSchema,
  'semantic-hash': semanticHashSchema,
  'system-prompt': systemPromptSchema,
} as const;

// Type exports for TypeScript consumers
export type AuthProfilesSchema = typeof authProfilesSchema;
export type ProfilesSchema = typeof profilesSchema;
export type EnvironmentsSchema = typeof environmentsSchema;
export type ExecutionResultSchema = typeof executionResultSchema;
export type ModuleContextSchema = typeof moduleContextSchema;
export type PrereqsSchema = typeof prereqsSchema;
export type ProjectInitSchema = typeof projectInitSchema;
export type RulesSchema = typeof rulesSchema;
export type ModuleFlowsSchema = typeof moduleFlowsSchema;
export type FlowSchema = typeof flowSchema;
export type TCCaseSchema = typeof tcCaseSchema;
export type SelectorsSchema = typeof selectorsSchema;
export type SemanticHashSchema = typeof semanticHashSchema;
export type SystemPromptSchema = typeof systemPromptSchema;

