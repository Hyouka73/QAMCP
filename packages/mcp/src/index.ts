// @qap/mcp - MCP Server & Tool Provider
export * from './server.js';
export * from './dispatcher.js';
export type { StateDependencies, ProjectKnowledgeBinding } from './handlers/state-services.js';
export { registerMcpProject } from './register.js';
export type { RegisterMcpOptions } from './register.js';
export { handleInterviewTools } from './tools/interview-tools.js';
export { handleGapReportTools } from './tools/gap-report-tools.js';

export { DiscoveryHandler, type DiscoveryAuthorization } from './handlers/discovery.handler.js';
export { ModuleObservationBridge, type ModuleBinding, type AssociationReceipt } from './handlers/module-observation-bridge.js';
