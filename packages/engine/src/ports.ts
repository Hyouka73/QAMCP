/**
 * QA Engine Ports
 *
 * This module defines the ports (interfaces) for the QA Engine.
 * Following the Dependency Inversion Principle (Principio 11 - QAP v2.1),
 * the Engine NEVER knows its concrete implementations - they are injected from outside.
 *
 * IMPORTANT: This file must remain free of any I/O dependencies.
 * - NO imports from 'node:fs', 'node:fs/promises', 'node:path'
 * - NO imports from '@qap/knowledge' or any external concrete package
 * - ONLY TypeScript interfaces, abstract types, and imports from '@qap/shared'
 */

import type {
  ModuleSpec,
  Module,
  TestPlan,
  TestOptions,
  ExecutionResult,
  ReportOptions,
  Report,
  FlowDefinition,
  FlowOptions,
  FlowExecutionResult,
  // Storage domain types
  Environments,
  ModuleContext,
  SystemPrompt,
  Rules,
  Prereqs,
  Selectors,
  SemanticHash,
  TCCase,
} from '@qap/shared';

// ---------------------------------------------------------------------------
// Auxiliary type aliases — bridge between plan naming and @qap/shared types
// These keep the IStorage contract readable while reusing shared schemas.
// ---------------------------------------------------------------------------

/**
 * Configuration for all environments (.qa/project/environments.yaml)
 * Maps to the `Environments` schema from @qap/shared.
 */
export type EnvironmentsConfig = Environments;

/**
 * Project-level context stored in .qa/project/context.yaml
 * This type will migrate to @qap/shared once the schema is formalised (S3+).
 */
export interface ProjectContext {
  _version: string;
  project_name: string;
  description?: string;
  tech_stack?: string[];
  base_url?: string;
  manually_edited?: boolean;
  [key: string]: unknown;
}

/**
 * System prompt configuration (.qa/project/system-prompt.yaml)
 * Maps to the `SystemPrompt` schema from @qap/shared.
 */
export type SystemPromptConfig = SystemPrompt;

/**
 * Rules for a module (.qa/modules/<name>/rules.yaml)
 * Maps to the `Rules` schema from @qap/shared.
 */
export type ModuleRules = Rules;

/**
 * Prerequisites for a module (.qa/modules/<name>/prereqs.yaml)
 * Maps to the `Prereqs` schema from @qap/shared.
 */
export type ModulePrereqs = Prereqs;

/**
 * Selector map for a module (.qa/modules/<name>/selectors.json)
 * Maps to the `Selectors` schema from @qap/shared.
 */
export type ModuleSelectors = Selectors;

/**
 * Semantic hash data for change detection (.qa/modules/<name>/semantic-hash.json)
 * Maps to the `SemanticHash` schema from @qap/shared.
 */
export type SemanticHashData = SemanticHash;

/**
 * A single test case definition (.qa/modules/<name>/tests/TC-*.yaml)
 * Maps to the `TCCase` schema from @qap/shared.
 */
export type TestCase = TCCase;

/**
 * Aggregated status of the project for diagnostics.
 * Declared here (port layer) so the Engine and its adapters share the same shape.
 */
export interface ProjectStatus {
  initialized: boolean;
  modules_discovered: number;
  last_execution?: {
    date: string;
    status: 'success' | 'failure' | 'error';
  };
  environment_configured: boolean;
}

// ---------------------------------------------------------------------------
// Ports (Interfaces) — one per bounded capability
// ---------------------------------------------------------------------------

/**
 * Discoverer Port
 *
 * Responsible for discovering modules based on a specification.
 * Implementations may scan filesystem, git repos, or other sources.
 */
export interface IDiscoverer {
  discover(spec: ModuleSpec): Promise<Module>;
}

/**
 * Runner Port
 *
 * Responsible for executing test plans.
 * Implementations may use Playwright, Cypress, or other test runners.
 */
export interface IRunner {
  execute(plan: TestPlan, options: TestOptions): Promise<ExecutionResult>;
}

/**
 * Reporter Port
 *
 * Responsible for generating reports from execution results.
 * Implementations may produce HTML, JSON, JUnit, or other formats.
 */
export interface IReporter {
  generate(result: ExecutionResult, options: ReportOptions): Promise<Report>;
}

/**
 * FlowRunner Port
 *
 * Responsible for executing multi-module flows.
 * Handles orchestration, context sharing, and flow-level teardown.
 */
export interface IFlowRunner {
  executeFlow(flow: FlowDefinition, options: FlowOptions): Promise<FlowExecutionResult>;
}

/**
 * Storage Port  (S3-001 — QAP v2.1)
 *
 * Defines the complete abstract contract for reading/writing to the .qa/ tree.
 * The Engine calls this interface exclusively; NO concrete I/O is allowed here.
 *
 * Implementation responsibility: Diego (S3-002) → packages/knowledge/FileSystemStorage
 *
 * Sections mirror the .qa/ directory layout:
 *  • .qa/project/          → global project configuration
 *  • .qa/modules/<name>/   → per-module domain data
 *  • .qa/modules/<name>/tests/ → test plans and test cases
 *  • .qa/executions/       → execution results
 *  • .qa/cache/history/    → append-only execution history
 *  • .qa/flows/            → multi-module flow definitions
 */
export interface IStorage {
  // -------------------------------------------------------------------------
  // Low-level primitives
  // These keep backward compatibility with the existing Engine methods
  // (plan(), update(), status(), context()) that were written before S3-001.
  // -------------------------------------------------------------------------

  /** Read a file and return its content as a string. */
  read(path: string): Promise<string>;

  /** Write content to a file. */
  write(path: string, content: string): Promise<void>;

  /** Check if a file or directory exists. */
  exists(path: string): Promise<boolean>;

  /** List files/directories at a path. */
  list(path: string): Promise<string[]>;

  /** Delete a file or directory. */
  delete(path: string): Promise<void>;

  /** Create a directory (and parents) if it does not exist. */
  mkdir(path: string): Promise<void>;

  /** Read a JSON file and parse it as type T. */
  readJson<T>(path: string): Promise<T>;

  /** Serialise an object and write it as JSON to a file. */
  writeJson<T>(path: string, data: T): Promise<void>;

  // -------------------------------------------------------------------------
  // Global project configuration  (.qa/project/)
  // -------------------------------------------------------------------------

  /**
   * Returns the absolute path to the project root (where .qa/ lives).
   * Synchronous — allows callers to build paths without await.
   */
  getProjectRoot(): string;

  /** Returns true if the .qa/ tree has been initialised (qap init has run). */
  isInitialized(): Promise<boolean>;

  /** Read .qa/project/environments.yaml */
  getEnvironments(): Promise<EnvironmentsConfig>;

  /** Write .qa/project/environments.yaml */
  saveEnvironments(envs: EnvironmentsConfig): Promise<void>;

  /** Read .qa/project/context.yaml */
  getProjectContext(): Promise<ProjectContext>;

  /** Write .qa/project/context.yaml */
  saveProjectContext(ctx: ProjectContext): Promise<void>;

  /**
   * Read .qa/project/system-prompt.yaml
   * Returns null if the file does not exist yet.
   */
  getSystemPrompt(): Promise<SystemPromptConfig | null>;

  // -------------------------------------------------------------------------
  // Module domain  (.qa/modules/<name>/)
  // -------------------------------------------------------------------------

  /** Returns the names of all modules found under .qa/modules/. */
  listModules(): Promise<string[]>;

  /** Returns true if a directory for the given module name exists. */
  hasModule(moduleName: string): Promise<boolean>;

  /** Read .qa/modules/<name>/context.yaml */
  getModuleContext(moduleName: string): Promise<ModuleContext>;

  /** Write .qa/modules/<name>/context.yaml */
  saveModuleContext(moduleName: string, context: ModuleContext): Promise<void>;

  /**
   * Read .qa/modules/<name>/rules.yaml
   * Returns null if the file does not exist.
   */
  getModuleRules(moduleName: string): Promise<ModuleRules | null>;

  /** Write .qa/modules/<name>/rules.yaml */
  saveModuleRules(moduleName: string, rules: ModuleRules): Promise<void>;

  /**
   * Read .qa/modules/<name>/prereqs.yaml
   * Returns null if the file does not exist.
   */
  getModulePrereqs(moduleName: string): Promise<ModulePrereqs | null>;

  /** Write .qa/modules/<name>/prereqs.yaml */
  saveModulePrereqs(moduleName: string, prereqs: ModulePrereqs): Promise<void>;

  /** Read .qa/modules/<name>/selectors.json */
  getModuleSelectors(moduleName: string): Promise<ModuleSelectors>;

  /** Write .qa/modules/<name>/selectors.json */
  saveModuleSelectors(moduleName: string, selectors: ModuleSelectors): Promise<void>;

  /**
   * Read .qa/modules/<name>/semantic-hash.json
   * Returns null if the file does not exist.
   */
  getSemanticHash(moduleName: string): Promise<SemanticHashData | null>;

  /** Write .qa/modules/<name>/semantic-hash.json */
  saveSemanticHash(moduleName: string, data: SemanticHashData): Promise<void>;

  // -------------------------------------------------------------------------
  // Test plans and test cases  (.qa/modules/<name>/tests/)
  // -------------------------------------------------------------------------

  /** Read .qa/modules/<name>/tests/plan.yaml */
  getTestPlan(moduleName: string): Promise<TestPlan>;

  /** Write .qa/modules/<name>/tests/plan.yaml */
  saveTestPlan(moduleName: string, plan: TestPlan): Promise<void>;

  /** Returns the IDs (filenames without extension) of all test cases in a module. */
  listTestCases(moduleName: string): Promise<string[]>;

  /** Read .qa/modules/<name>/tests/<caseId>.yaml */
  getTestCase(moduleName: string, caseId: string): Promise<TestCase>;

  /** Write .qa/modules/<name>/tests/<caseId>.yaml */
  saveTestCase(moduleName: string, testCase: TestCase): Promise<void>;

  // -------------------------------------------------------------------------
  // Execution results and history
  // .qa/executions/<executionId>.json  |  .qa/cache/history/<module>.jsonl
  // -------------------------------------------------------------------------

  /** Write a full execution result to .qa/executions/<executionId>.json */
  saveExecutionResult(executionId: string, result: ExecutionResult): Promise<void>;

  /**
   * Read .qa/executions/<executionId>.json
   * Returns null if the execution record does not exist.
   */
  getExecutionResult(executionId: string): Promise<ExecutionResult | null>;

  /**
   * Append a single entry to the module's history log.
   * (.qa/cache/history/<moduleName>.jsonl — newline-delimited JSON)
   */
  appendHistory(moduleName: string, entry: Record<string, unknown>): Promise<void>;

  // -------------------------------------------------------------------------
  // Multi-module flows  (.qa/flows/)
  // -------------------------------------------------------------------------

  /** Returns the names of all flows found under .qa/flows/. */
  listFlows(): Promise<string[]>;

  /** Read .qa/flows/<flowName>.yaml */
  getFlow(flowName: string): Promise<FlowDefinition>;

  /** Write .qa/flows/<flowName>.yaml */
  saveFlow(flowName: string, flow: FlowDefinition): Promise<void>;

  // -------------------------------------------------------------------------
  // Diagnostics and project status
  // -------------------------------------------------------------------------

  /**
   * Returns an aggregated snapshot of the project's current state.
   * Implementations should gather this from the .qa/ tree without
   * requiring the Engine to understand storage paths.
   */
  getStatus(): Promise<ProjectStatus>;
}
