/**
 * Storage Mock — S3-001 (QAP v2.1)
 *
 * Provides a full Vitest mock of IStorage for use in engine unit tests.
 * Every method returns a sensible default resolved value so tests can
 * selectively override only what they need with `.mockResolvedValueOnce()`.
 *
 * Usage:
 *   import { createStorageMock } from './mocks/storage.mock.js';
 *   const mockStorage = createStorageMock();
 *   mockStorage.exists.mockResolvedValueOnce(true);
 */

import { vi } from 'vitest';

import type { IStorage } from '../../ports.js';

/**
 * Full mock of IStorage with typed vi.fn() for every method.
 * The shape { [K in keyof IStorage]: ReturnType<typeof vi.fn> } is intentionally
 * preserved so engine.test.ts can continue its existing mock patterns unchanged.
 */
export type StorageMock = { [K in keyof IStorage]: ReturnType<typeof vi.fn> };

/**
 * Creates a fresh StorageMock with default resolved values.
 * Call this in beforeEach() to avoid state leakage between tests.
 */
export function createStorageMock(): StorageMock {
  return {
    // --- Low-level primitives ---
    read: vi.fn().mockResolvedValue(''),
    write: vi.fn().mockResolvedValue(undefined),
    exists: vi.fn().mockResolvedValue(false),
    list: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(undefined),
    mkdir: vi.fn().mockResolvedValue(undefined),
    readJson: vi.fn().mockResolvedValue({}),
    writeJson: vi.fn().mockResolvedValue(undefined),

    // --- Global project configuration ---
    getProjectRoot: vi.fn().mockReturnValue('/fake/project/root'),
    isInitialized: vi.fn().mockResolvedValue(false),
    getEnvironments: vi.fn().mockResolvedValue({
      _version: '2.1.0',
      environments: {},
      default: 'dev',
    }),
    saveEnvironments: vi.fn().mockResolvedValue(undefined),
    getProjectContext: vi.fn().mockResolvedValue({
      _version: '2.1.0',
      project_name: 'test-project',
    }),
    saveProjectContext: vi.fn().mockResolvedValue(undefined),
    getSystemPrompt: vi.fn().mockResolvedValue(null),

    // --- Module domain ---
    listModules: vi.fn().mockResolvedValue([]),
    hasModule: vi.fn().mockResolvedValue(false),
    getModuleContext: vi.fn().mockResolvedValue({
      _version: '2.1.0',
      objective: '',
      manually_edited: false,
      routes: [],
    }),
    saveModuleContext: vi.fn().mockResolvedValue(undefined),
    getModuleRules: vi.fn().mockResolvedValue(null),
    saveModuleRules: vi.fn().mockResolvedValue(undefined),
    getModulePrereqs: vi.fn().mockResolvedValue(null),
    saveModulePrereqs: vi.fn().mockResolvedValue(undefined),
    getModuleSelectors: vi.fn().mockResolvedValue({ selectors: {} }),
    saveModuleSelectors: vi.fn().mockResolvedValue(undefined),
    getSemanticHash: vi.fn().mockResolvedValue(null),
    saveSemanticHash: vi.fn().mockResolvedValue(undefined),

    // --- Test plans and test cases ---
    getTestPlan: vi.fn().mockResolvedValue({ modules: [] }),
    saveTestPlan: vi.fn().mockResolvedValue(undefined),
    listTestCases: vi.fn().mockResolvedValue([]),
    getTestCase: vi.fn().mockResolvedValue(null),
    saveTestCase: vi.fn().mockResolvedValue(undefined),

    // --- Execution results and history ---
    saveExecutionResult: vi.fn().mockResolvedValue(undefined),
    getExecutionResult: vi.fn().mockResolvedValue(null),
    appendHistory: vi.fn().mockResolvedValue(undefined),

    // --- Multi-module flows ---
    listFlows: vi.fn().mockResolvedValue([]),
    getFlow: vi.fn().mockResolvedValue(null),
    saveFlow: vi.fn().mockResolvedValue(undefined),

    // --- Diagnostics ---
    getStatus: vi.fn().mockResolvedValue({
      initialized: false,
      modules_discovered: 0,
      environment_configured: false,
    }),
  };
}
