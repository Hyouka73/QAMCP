/**
 * QA Engine Ports
 * 
 * This module defines the ports (interfaces) for the QA Engine.
 * Following the Dependency Inversion Principle, the Engine never knows
 * its concrete implementations - they are injected from outside.
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
} from '@qap/shared';

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
 * Storage Port
 * 
 * Responsible for reading/writing to the .qa/ filesystem.
 * Abstracts file operations for test data, results, and configuration.
 */
export interface IStorage {
  /**
   * Read a file and return its content as string.
   */
  read(path: string): Promise<string>;

  /**
   * Write content to a file.
   */
  write(path: string, content: string): Promise<void>;

  /**
   * Check if a file or directory exists.
   */
  exists(path: string): Promise<boolean>;

  /**
   * List files/directories in a path.
   */
  list(path: string): Promise<string[]>;

  /**
   * Delete a file or directory.
   */
  delete(path: string): Promise<void>;

  /**
   * Create a directory if it doesn't exist.
   */
  mkdir(path: string): Promise<void>;

  /**
   * Read a JSON file and parse it.
   */
  readJson<T>(path: string): Promise<T>;

  /**
   * Write an object as JSON to a file.
   */
  writeJson<T>(path: string, data: T): Promise<void>;
}
