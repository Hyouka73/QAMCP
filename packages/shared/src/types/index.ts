/**
 * QAP Shared Types Index
 * 
 * This module exports all TypeScript types derived from JSON schemas.
 * These types are designed to match exactly with their corresponding JSON schemas
 * to ensure AJV validation and TypeScript type checking are consistent.
 */

// Project Init
export type { ProjectInit } from './project-init.type.js';

// Environments
export type { Environments, EnvironmentConfig } from './environments.type.js';

// System Prompt
export type { SystemPrompt, DefaultWorkflows } from './system-prompt.type.js';

// Module Context
export type {
  ModuleContext,
  ModuleView,
  ModuleSurface,
  SurfaceKind,
  ModuleHealthStatus,
} from './module-context.type.js';

// Auth Profiles
export type { AuthProfiles, AuthProfile, PostLoginCondition } from './auth-profiles.type.js';

// Prerequisites
export type { Prereqs, Requirements, AuthRequirements, StatePrerequisite, Teardown } from './prereqs.type.js';

// Execution Result (S5-001)
export type {
  ExecutionResult,
  ExecutionSummary,
  ExecutedCase,
  ExecutedStep,
  FailureType,
  ExecutionStatus,
  CaseResult,
  ExecutionStep,
  Timestamps,
  Screenshot,
} from './execution-result.type.js';

// Rules (P3: extended with category, status, source, evidence, category_waivers)
export type {
  Rules,
  Rule,
  RuleEntry,
  RuleCategory,
  RuleStatus,
  RuleSource,
  CategoryWaiver,
} from './rules.type.js';

// Module Flows
export type { ModuleFlows, FlowItem } from './module-flows.type.js';

// Flow (Multi-Module)
export type { Flow, FlowModule, ContextSharing, FlowTeardown, TeardownAction } from './flow.type.js';

// Test Case
export type { 
  TCCase, 
  TCStep, 
  TCStepType, 
  AssertionType, 
  HttpMethod, 
  InterceptConfig 
} from './tc-case.type.js';

// Selectors
export type { Selectors, SelectorsMetadata } from './selectors.type.js';

// Semantic Hash
export type { SemanticHash } from './semantic-hash.type.js';

// Repo Map (S4-005)
export type { RepoMap } from './repo-map.type.js';

// Engine Ports - Module Discovery
export type { ModuleSpec } from './module-spec.type.js';
export type { Module } from './module.type.js';

// Engine Ports - Test Execution
export type { TestPlan } from './test-plan.type.js';
export type { TestOptions } from './test-options.type.js';

// Engine Ports - Reporting
export type { ReportOptions } from './report-options.type.js';
export type { Report } from './report.type.js';

// Engine Ports - Flow Execution
export type { FlowDefinition, FlowModuleRef, ContextSharingDef } from './flow-definition.type.js';
export type { FlowOptions } from './flow-options.type.js';
export type { FlowExecutionResult, ModuleExecutionResult, ExecutionResultSummary } from './flow-execution-result.type.js';

// Guardrails & Business Invariants (QAP v3.0)
export type {
  GuardrailSeverity,
  GuardrailCategory,
  GuardrailDefinition,
} from './guardrails.js';

// Knowledge Granular Architecture (Sprint 5)
export type {
  ModuleViewContext,
  ModuleViewSelectors,
  ModuleSummary,
  KnowledgeIndex,
} from './knowledge-granular.type.js';

// Lifecycle State (E1, E2)
export type {
  ProjectPhase,
  ModuleLifecycleState,
  SessionPlanItem,
  SessionAuthConfig,
  LifecycleSession,
  ModuleStateInfo,
  TransitionHistoryEntry,
  LifecycleState,
} from './lifecycle-state.type.js';

// Module View Context (E5b)
export type { ModuleViewData } from './module-view.type.js';

// Project & Business Context (E1)
export type {
  ContextSource,
  SourceOfTruthType,
  BusinessRole,
  CriticalFlow,
  SourceOfTruth,
  ProjectContext,
} from './project-context.type.js';


