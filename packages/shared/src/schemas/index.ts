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

export { default as authProfilesSchema } from './auth-profiles.schema.json';
export { default as environmentsSchema } from './environments.schema.json';
export { default as executionResultSchema } from './execution-result.schema.json';
export { default as moduleContextSchema } from './module-context.schema.json';
export { default as prereqsSchema } from './prereqs.schema.json';
export { default as projectInitSchema } from './project-init.schema.json';
export { default as rulesSchema } from './rules.schema.json';
export { default as moduleFlowsSchema } from './module-flows.schema.json';
export { default as flowSchema } from './flow.schema.json';
export { default as tcCaseSchema } from './tc-case.schema.json';
export { default as selectorsSchema } from './selectors.schema.json';
export { default as semanticHashSchema } from './semantic-hash.schema.json';

// Export all schemas as a record for dynamic access
export const schemas = {
  'auth-profiles': authProfilesSchema,
  'environments': environmentsSchema,
  'execution-result': executionResultSchema,
  'module-context': moduleContextSchema,
  'prereqs': prereqsSchema,
  'project-init': projectInitSchema,
  'rules': rulesSchema,
  'module-flows': moduleFlowsSchema,
  'flow': flowSchema,
  'tc-case': tcCaseSchema,
  'selectors': selectorsSchema,
  'semantic-hash': semanticHashSchema,
} as const;

// Type exports for TypeScript consumers
export type AuthProfilesSchema = typeof authProfilesSchema;
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
