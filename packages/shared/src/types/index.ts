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

// Module Context
export type { ModuleContext } from './module-context.type.js';

// Auth Profiles
export type { AuthProfiles, AuthProfile, PostLoginCondition } from './auth-profiles.type.js';

// Prerequisites
export type { Prereqs, Requirements, AuthRequirements, StatePrerequisite, Teardown } from './prereqs.type.js';

// Execution Result
export type { ExecutionResult, ExecutionStep, Timestamps, Screenshot } from './execution-result.type.js';

// Rules
export type { Rules, Rule } from './rules.type.js';

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
