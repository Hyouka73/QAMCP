import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { LockManager } from '@qap/knowledge';
import { SchemaValidator, type TCCase, type TestPlan } from '@qap/shared';
import { chromium } from 'playwright-core';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { PlaywrightRunner } from '../src/runner.js';

const tempDirs: string[] = [];

function createTempDir(prefix = 'qap-challenger-test-'): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

describe('Adversarial Stress & Empirical Challenge Suite — PlaywrightRunner', () => {
  let mockBrowser: any;
  let mockContext: any;
  let mockPage: any;

  beforeEach(() => {
    mockPage = {
      setDefaultTimeout: vi.fn(),
      goto: vi.fn().mockResolvedValue(undefined),
      waitForLoadState: vi.fn().mockResolvedValue(undefined),
      click: vi.fn().mockResolvedValue(undefined),
      fill: vi.fn().mockResolvedValue(undefined),
      screenshot: vi.fn().mockResolvedValue(Buffer.from('fake-screenshot')),
    };
    mockContext = {
      newPage: vi.fn().mockResolvedValue(mockPage),
      close: vi.fn().mockResolvedValue(undefined),
    };
    mockBrowser = {
      newContext: vi.fn().mockResolvedValue(mockContext),
      close: vi.fn().mockResolvedValue(undefined),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    for (const dir of tempDirs.splice(0)) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch {
        // ignore
      }
    }
  });

  // =========================================================================
  // CHALLENGE 1: Empty Cases Execution Honesty
  // =========================================================================
  describe('Challenge 1: Empty Cases Execution Honesty', () => {
    it('C1.1: empty cases array returns result failed with total=0, passed=0, failed=0', async () => {
      const runner = new PlaywrightRunner();
      const projectRoot = createTempDir();

      const result = await runner.execute(
        { modules: ['empty-module'], cases: [] },
        { projectRoot }
      );

      expect(result.result).toBe('failed');
      expect(result.result).not.toBe('passed');
      expect(result.summary.total).toBe(0);
      expect(result.summary.passed).toBe(0);
      expect(result.summary.failed).toBe(0);
      expect(result.summary.not_run).toBe(0);
      expect(result.cases).toEqual([]);
    });

    it('C1.2: omitted cases property (undefined) defaults safely and returns failed', async () => {
      const runner = new PlaywrightRunner();
      const projectRoot = createTempDir();

      const plan: TestPlan = { modules: ['empty-module'] };
      const result = await runner.execute(plan, { projectRoot });

      expect(result.result).toBe('failed');
      expect(result.summary.total).toBe(0);
      expect(result.summary.passed).toBe(0);
      expect(result.cases).toHaveLength(0);
    });

    it('C1.3: empty cases execution acquires and cleans up module lock without leaving dangling locks', async () => {
      const runner = new PlaywrightRunner();
      const projectRoot = createTempDir();
      const moduleName = 'locked-empty-module';

      const result = await runner.execute(
        { modules: [moduleName], cases: [] },
        { projectRoot }
      );
      expect(result.result).toBe('failed');

      // Verify that lock is NOT still held - a subsequent lock acquisition must succeed immediately
      const lockManager = new LockManager({ rootDir: projectRoot });
      const release = await lockManager.acquireModuleLock(moduleName);
      expect(typeof release).toBe('function');
      await release();
    });

    it('C1.4: empty cases never initiates browser launch', async () => {
      const runner = new PlaywrightRunner();
      const projectRoot = createTempDir();
      const launchSpy = vi.spyOn(chromium, 'launch');

      await runner.execute(
        { modules: ['no-browser-mod'], cases: [] },
        { projectRoot }
      );

      expect(launchSpy).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // CHALLENGE 2: Unsupported / Unknown Step Actions
  // =========================================================================
  describe('Challenge 2: Unsupported / Unknown Step Actions', () => {
    it('C2.1: step with unsupported action fails step and case, never returns passed', async () => {
      vi.spyOn(chromium, 'launch').mockResolvedValue(mockBrowser);
      const runner = new PlaywrightRunner();
      const projectRoot = createTempDir();

      const testCase: TCCase = {
        _version: '1',
        id: 'TC-QUANTUM',
        name: 'Quantum Click Case',
        steps: [
          { type: 'unsupported_quantum_click' as any, selector: '#quantum-button' },
        ],
      };

      const result = await runner.execute(
        { modules: ['adversarial-mod'], cases: ['TC-QUANTUM'] },
        {
          projectRoot,
          storageResolver: async () => testCase,
        }
      );

      expect(result.result).toBe('failed');
      expect(result.result).not.toBe('passed');
      expect(result.summary.passed).toBe(0);
      expect(result.summary.failed).toBe(1);
      expect(result.cases).toHaveLength(1);
      expect(result.cases[0].result).toBe('failed');
      expect(result.cases[0].steps).toBeDefined();
      expect(result.cases[0].steps![0].status).toBe('failed');
      expect(result.cases[0].steps![0].message).toContain('unsupported_quantum_click');
    });

    it('C2.2: step with malicious eval action is rejected cleanly as unsupported', async () => {
      vi.spyOn(chromium, 'launch').mockResolvedValue(mockBrowser);
      const runner = new PlaywrightRunner();
      const projectRoot = createTempDir();

      const testCase: TCCase = {
        _version: '1',
        id: 'TC-MALICIOUS',
        name: 'Malicious Step Case',
        steps: [
          { type: 'malicious_eval' as any, code: 'process.exit(1)' } as any,
        ],
      };

      const result = await runner.execute(
        { modules: ['adversarial-mod'], cases: ['TC-MALICIOUS'] },
        {
          projectRoot,
          storageResolver: async () => testCase,
        }
      );

      expect(result.result).toBe('failed');
      expect(result.cases[0].result).toBe('failed');
      expect(result.cases[0].steps![0].message).toContain('malicious_eval');
    });

    it('C2.3: step missing type property entirely defaults to desconocido and fails', async () => {
      vi.spyOn(chromium, 'launch').mockResolvedValue(mockBrowser);
      const runner = new PlaywrightRunner();
      const projectRoot = createTempDir();

      const testCase: TCCase = {
        _version: '1',
        id: 'TC-NOTYPE',
        name: 'No Type Step Case',
        steps: [
          { action: 'click', selector: '#btn' } as any,
        ],
      };

      const result = await runner.execute(
        { modules: ['adversarial-mod'], cases: ['TC-NOTYPE'] },
        {
          projectRoot,
          storageResolver: async () => testCase,
        }
      );

      expect(result.result).toBe('failed');
      expect(result.cases[0].result).toBe('failed');
      expect(result.cases[0].steps![0].message).toContain('desconocido');
    });

    it('C2.4: step with empty string type fails explicitly', async () => {
      vi.spyOn(chromium, 'launch').mockResolvedValue(mockBrowser);
      const runner = new PlaywrightRunner();
      const projectRoot = createTempDir();

      const testCase: TCCase = {
        _version: '1',
        id: 'TC-EMPTY-TYPE',
        name: 'Empty Type Step Case',
        steps: [
          { type: '' as any },
        ],
      };

      const result = await runner.execute(
        { modules: ['adversarial-mod'], cases: ['TC-EMPTY-TYPE'] },
        {
          projectRoot,
          storageResolver: async () => testCase,
        }
      );

      expect(result.result).toBe('failed');
      expect(result.cases[0].result).toBe('failed');
      expect(result.cases[0].steps![0].status).toBe('failed');
    });
  });

  // =========================================================================
  // CHALLENGE 3: Skipped / Not_Run Cases Dependency Propagation
  // =========================================================================
  describe('Challenge 3: Skipped / Not_Run Cases Dependency Propagation', () => {
    it('C3.1: transitive dependency failure cascades not_run through deep chain', async () => {
      vi.spyOn(chromium, 'launch').mockResolvedValue(mockBrowser);
      const runner = new PlaywrightRunner();
      const projectRoot = createTempDir();

      // Chain: TC-1 (fails) -> TC-2 -> TC-3 -> TC-4
      // TC-INDEP has no dependencies and should pass
      const casesMap: Record<string, TCCase> = {
        'TC-1': {
          _version: '1',
          id: 'TC-1',
          name: 'Case 1 - Fails',
          depends_on: [],
          steps: [{ type: 'unknown_step_fail' as any }],
        },
        'TC-2': {
          _version: '1',
          id: 'TC-2',
          name: 'Case 2 - Depends on 1',
          depends_on: ['TC-1'],
          steps: [{ type: 'navigate', url: 'https://example.test' }],
        },
        'TC-3': {
          _version: '1',
          id: 'TC-3',
          name: 'Case 3 - Depends on 2',
          depends_on: ['TC-2'],
          steps: [{ type: 'navigate', url: 'https://example.test' }],
        },
        'TC-4': {
          _version: '1',
          id: 'TC-4',
          name: 'Case 4 - Depends on 3',
          depends_on: ['TC-3'],
          steps: [{ type: 'navigate', url: 'https://example.test' }],
        },
        'TC-INDEP': {
          _version: '1',
          id: 'TC-INDEP',
          name: 'Independent Case',
          depends_on: [],
          steps: [{ type: 'navigate', url: 'https://example.test' }],
        },
      };

      const result = await runner.execute(
        { modules: ['chain-mod'], cases: ['TC-1', 'TC-2', 'TC-3', 'TC-4', 'TC-INDEP'] },
        {
          projectRoot,
          storageResolver: async (_m, id) => casesMap[id],
        }
      );

      expect(result.summary.total).toBe(5);
      expect(result.summary.failed).toBe(1);
      expect(result.summary.not_run).toBe(3);
      expect(result.summary.passed).toBe(1);
      expect(result.result).toBe('partial');

      const tc2 = result.cases.find((c) => c.id === 'TC-2')!;
      const tc3 = result.cases.find((c) => c.id === 'TC-3')!;
      const tc4 = result.cases.find((c) => c.id === 'TC-4')!;

      expect(tc2.result).toBe('not_run');
      expect(tc2.duration_ms).toBe(0);
      expect(tc2.not_run_reason).toContain("dependencia 'TC-1' no tuvo estado 'passed'");

      expect(tc3.result).toBe('not_run');
      expect(tc3.duration_ms).toBe(0);
      expect(tc3.not_run_reason).toContain("dependencia 'TC-2' no tuvo estado 'passed'");

      expect(tc4.result).toBe('not_run');
      expect(tc4.duration_ms).toBe(0);
      expect(tc4.not_run_reason).toContain("dependencia 'TC-3' no tuvo estado 'passed'");
    });

    it('C3.2: diamond dependency DAG cascades correctly when root fails', async () => {
      vi.spyOn(chromium, 'launch').mockResolvedValue(mockBrowser);
      const runner = new PlaywrightRunner();
      const projectRoot = createTempDir();

      // Root (fails) -> Left (depends Root), Right (depends Root) -> Bottom (depends Left, Right)
      const casesMap: Record<string, TCCase> = {
        'ROOT': {
          _version: '1',
          id: 'ROOT',
          name: 'Root Case',
          depends_on: [],
          steps: [{ type: 'bad_action' as any }],
        },
        'LEFT': {
          _version: '1',
          id: 'LEFT',
          name: 'Left Branch',
          depends_on: ['ROOT'],
          steps: [{ type: 'navigate', url: 'https://example.test' }],
        },
        'RIGHT': {
          _version: '1',
          id: 'RIGHT',
          name: 'Right Branch',
          depends_on: ['ROOT'],
          steps: [{ type: 'navigate', url: 'https://example.test' }],
        },
        'BOTTOM': {
          _version: '1',
          id: 'BOTTOM',
          name: 'Bottom Convergence',
          depends_on: ['LEFT', 'RIGHT'],
          steps: [{ type: 'navigate', url: 'https://example.test' }],
        },
      };

      const result = await runner.execute(
        { modules: ['diamond-mod'], cases: ['ROOT', 'LEFT', 'RIGHT', 'BOTTOM'] },
        {
          projectRoot,
          storageResolver: async (_m, id) => casesMap[id],
        }
      );

      expect(result.summary.total).toBe(4);
      expect(result.summary.failed).toBe(1);
      expect(result.summary.not_run).toBe(3);
      expect(result.summary.passed).toBe(0);
      expect(result.result).toBe('failed');

      expect(result.cases.find((c) => c.id === 'LEFT')!.result).toBe('not_run');
      expect(result.cases.find((c) => c.id === 'RIGHT')!.result).toBe('not_run');
      expect(result.cases.find((c) => c.id === 'BOTTOM')!.result).toBe('not_run');
    });

    it('C3.3: dependent case pointing to non-existent case is safely skipped as not_run', async () => {
      vi.spyOn(chromium, 'launch').mockResolvedValue(mockBrowser);
      const runner = new PlaywrightRunner();
      const projectRoot = createTempDir();

      const casesMap: Record<string, TCCase> = {
        'ORPHAN': {
          _version: '1',
          id: 'ORPHAN',
          name: 'Orphan Dependent',
          depends_on: ['TC-GHOST-999'],
          steps: [{ type: 'navigate', url: 'https://example.test' }],
        },
      };

      const result = await runner.execute(
        { modules: ['ghost-mod'], cases: ['ORPHAN'] },
        {
          projectRoot,
          storageResolver: async (_m, id) => casesMap[id],
        }
      );

      expect(result.summary.total).toBe(1);
      expect(result.summary.not_run).toBe(1);
      expect(result.summary.passed).toBe(0);
      expect(result.cases[0].result).toBe('not_run');
      expect(result.cases[0].not_run_reason).toContain("dependencia 'TC-GHOST-999' no tuvo estado 'passed'");
    });

    it('C3.4: self-dependency (cycle of 1) is safely skipped as not_run without infinite loop', async () => {
      vi.spyOn(chromium, 'launch').mockResolvedValue(mockBrowser);
      const runner = new PlaywrightRunner();
      const projectRoot = createTempDir();

      const casesMap: Record<string, TCCase> = {
        'TC-SELF': {
          _version: '1',
          id: 'TC-SELF',
          name: 'Self Dependent Case',
          depends_on: ['TC-SELF'],
          steps: [{ type: 'navigate', url: 'https://example.test' }],
        },
      };

      const result = await runner.execute(
        { modules: ['self-mod'], cases: ['TC-SELF'] },
        {
          projectRoot,
          storageResolver: async (_m, id) => casesMap[id],
        }
      );

      expect(result.summary.total).toBe(1);
      expect(result.summary.not_run).toBe(1);
      expect(result.cases[0].result).toBe('not_run');
      expect(result.cases[0].not_run_reason).toContain("dependencia 'TC-SELF' no tuvo estado 'passed'");
    });

    it('C3.5: mutual circular dependency (A depends on B, B depends on A) safely skips both as not_run', async () => {
      vi.spyOn(chromium, 'launch').mockResolvedValue(mockBrowser);
      const runner = new PlaywrightRunner();
      const projectRoot = createTempDir();

      const casesMap: Record<string, TCCase> = {
        'TC-A': {
          _version: '1',
          id: 'TC-A',
          name: 'Case A',
          depends_on: ['TC-B'],
          steps: [{ type: 'navigate', url: 'https://example.test' }],
        },
        'TC-B': {
          _version: '1',
          id: 'TC-B',
          name: 'Case B',
          depends_on: ['TC-A'],
          steps: [{ type: 'navigate', url: 'https://example.test' }],
        },
      };

      const result = await runner.execute(
        { modules: ['cycle-mod'], cases: ['TC-A', 'TC-B'] },
        {
          projectRoot,
          storageResolver: async (_m, id) => casesMap[id],
        }
      );

      expect(result.summary.total).toBe(2);
      expect(result.summary.not_run).toBe(2);
      expect(result.summary.passed).toBe(0);
      expect(result.result).toBe('failed');
      expect(result.cases[0].result).toBe('not_run');
      expect(result.cases[1].result).toBe('not_run');
    });
  });

  // =========================================================================
  // CHALLENGE 4: Project Root Isolation & No CWD Dependency
  // =========================================================================
  describe('Challenge 4: Project Root Isolation & No CWD Dependency', () => {
    it('C4.1: runner confines lock acquisition to options.projectRoot without polluting process.cwd()', async () => {
      vi.spyOn(chromium, 'launch').mockResolvedValue(mockBrowser);
      const runner = new PlaywrightRunner();
      const customRoot = createTempDir('isolated-workspace-');

      const result = await runner.execute(
        { modules: ['confined-mod'], cases: ['TC-CONFINED'] },
        {
          projectRoot: customRoot,
          storageResolver: async () => ({
            _version: '1',
            id: 'TC-CONFINED',
            name: 'Confined Case',
            steps: [{ type: 'navigate', url: 'https://example.test' }],
          }),
        }
      );

      expect(result.result).toBe('passed');

      // Verify cwd did not receive locks for confined-mod
      const cwdLockFile = path.join(process.cwd(), '.qa', 'locks', 'confined-mod.lock');
      expect(fs.existsSync(cwdLockFile)).toBe(false);
    });

    it('C4.2: screenshotsDir resolves relative to options.projectRoot', async () => {
      vi.spyOn(chromium, 'launch').mockResolvedValue(mockBrowser);
      const runner = new PlaywrightRunner();
      const customRoot = createTempDir('screenshot-root-');

      let capturedDir: string | undefined;
      vi.spyOn(
        runner as unknown as { executeStep: (...args: unknown[]) => Promise<void> },
        'executeStep'
      ).mockImplementation((_page: unknown, _step: unknown, screenshotsDir: unknown) => {
        capturedDir = screenshotsDir as string;
        return Promise.resolve();
      });

      await runner.execute(
        { modules: ['screenshot-mod'], cases: ['TC-SS'] },
        {
          projectRoot: customRoot,
          screenshotsDir: 'custom/screenshots/path',
          storageResolver: async () => ({
            _version: '1',
            id: 'TC-SS',
            name: 'SS Case',
            steps: [{ type: 'navigate', url: 'https://example.test' }],
          }),
        }
      );

      expect(capturedDir).toBe(path.resolve(customRoot, 'custom/screenshots/path'));
      expect(capturedDir).not.toContain(process.cwd());
    });
  });

  // =========================================================================
  // CHALLENGE 5: Infrastructure Errors vs Functional Failures
  // =========================================================================
  describe('Challenge 5: Infrastructure Errors vs Functional Failures', () => {
    it('C5.1: Chromium launch failure produces result error, 0 failed, all not_run with structured reasons', async () => {
      const runner = new PlaywrightRunner();
      const projectRoot = createTempDir();

      vi.spyOn(chromium, 'launch').mockRejectedValueOnce(
        new Error("Executable doesn't exist at C:\\Users\\Fake\\AppData\\Local\\ms-playwright\\chromium")
      );

      const result = await runner.execute(
        { modules: ['infra-mod'], cases: ['TC-A', 'TC-B', 'TC-C'] },
        { projectRoot }
      );

      expect(result.result).toBe('error');
      expect(result.result).not.toBe('failed'); // Must be 'error'
      expect(result.result).not.toBe('passed');
      expect(result.summary.total).toBe(3);
      expect(result.summary.passed).toBe(0);
      expect(result.summary.failed).toBe(0); // Zero functional failures
      expect(result.summary.not_run).toBe(3);

      for (const c of result.cases) {
        expect(c.result).toBe('not_run');
        expect(c.duration_ms).toBe(0);
        expect(c.not_run_reason).toContain('Fallo de infraestructura');
        expect(c.not_run_reason).toContain("Executable doesn't exist");
      }
    });

    it('C5.2: Chromium launch timeout produces result error without lock leakage', async () => {
      const runner = new PlaywrightRunner();
      const projectRoot = createTempDir();
      const moduleName = 'timeout-launch-mod';

      vi.spyOn(chromium, 'launch').mockRejectedValueOnce(
        new Error('browserType.launch: Timeout 30000ms exceeded.')
      );

      const result = await runner.execute(
        { modules: [moduleName], cases: ['TC-1'] },
        { projectRoot }
      );

      expect(result.result).toBe('error');
      expect(result.summary.not_run).toBe(1);

      // Verify lock is released and can be acquired again immediately
      const lockManager = new LockManager({ rootDir: projectRoot });
      const release = await lockManager.acquireModuleLock(moduleName);
      expect(typeof release).toBe('function');
      await release();
    });

    it('C5.3: infrastructure error ExecutionResult satisfies strict schema validation', async () => {
      const runner = new PlaywrightRunner();
      const validator = new SchemaValidator();

      vi.spyOn(chromium, 'launch').mockRejectedValueOnce(
        new Error('Failed to launch browser: headless_shell missing')
      );

      const result = await runner.execute(
        { modules: ['schema-infra-mod'], cases: ['TC-S1', 'TC-S2'] },
        { projectRoot: createTempDir() }
      );

      const validation = validator.validateExecutionResult(result);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  // =========================================================================
  // CHALLENGE 6: Host MCP Process Protection & Signals
  // =========================================================================
  describe('Challenge 6: Host MCP Process Protection & Signals', () => {
    it('C6.1: runner NEVER calls process.exit under any circumstances in default mode', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
      vi.spyOn(chromium, 'launch').mockResolvedValue(mockBrowser);

      const runner = new PlaywrightRunner();
      const projectRoot = createTempDir();

      // Run multiple diverse scenarios: empty, failing step, missing case
      await runner.execute({ modules: ['safe-mod'], cases: [] }, { projectRoot });
      await runner.execute(
        { modules: ['safe-mod'], cases: ['TC-FAIL'] },
        {
          projectRoot,
          storageResolver: async () => ({
            _version: '1',
            id: 'TC-FAIL',
            name: 'Failing Case',
            steps: [{ type: 'bad_step' as any }],
          }),
        }
      );

      expect(exitSpy).not.toHaveBeenCalled();
    });

    it('C6.2: runner does NOT register uncleaned global signal listeners', async () => {
      const sigintBefore = process.listenerCount('SIGINT');
      const sigtermBefore = process.listenerCount('SIGTERM');
      const uncaughtBefore = process.listenerCount('uncaughtException');

      const runner = new PlaywrightRunner();
      await runner.execute(
        { modules: ['leak-mod'], cases: [] },
        { projectRoot: createTempDir() }
      );

      expect(process.listenerCount('SIGINT')).toBe(sigintBefore);
      expect(process.listenerCount('SIGTERM')).toBe(sigtermBefore);
      expect(process.listenerCount('uncaughtException')).toBe(uncaughtBefore);
    });

    it('C6.3: pre-aborted cancellation returns error and accounts for every unexecuted case', async () => {
      const runner = new PlaywrightRunner();
      const projectRoot = createTempDir();
      const controller = new AbortController();
      const launchSpy = vi.spyOn(chromium, 'launch');
      controller.abort();

      const result = await runner.execute(
        { modules: ['aborted-mod'], cases: ['TC-1', 'TC-2'] },
        {
          projectRoot,
          signal: controller.signal,
        }
      );

      // An aborted run cannot claim failed product assertions, or silently
      // lose planned cases. Preserve the D-011 evidence-integrity contract.
      expect(result.result).toBe('error');
      expect(result.summary).toEqual({
        total: 2,
        passed: 0,
        failed: 0,
        skipped: 0,
        not_run: 2,
      });
      expect(result.cases.map(item => item.id)).toEqual(['TC-1', 'TC-2']);
      expect(result.cases.every(item => item.result === 'not_run')).toBe(true);
      expect(launchSpy).not.toHaveBeenCalled();
    });

    it('C6.4: cooperative cancellation mid-execution marks remaining cases not_run without crashing process', async () => {
      vi.spyOn(chromium, 'launch').mockResolvedValue(mockBrowser);
      const runner = new PlaywrightRunner();
      const projectRoot = createTempDir();
      const controller = new AbortController();

      const casesMap: Record<string, TCCase> = {
        'TC-1': {
          _version: '1',
          id: 'TC-1',
          name: 'Case 1',
          steps: [{ type: 'navigate', url: 'https://example.test' }],
        },
        'TC-2': {
          _version: '1',
          id: 'TC-2',
          name: 'Case 2',
          steps: [{ type: 'navigate', url: 'https://example.test' }],
        },
      };

      vi.spyOn(
        runner as unknown as { executeStep: (...args: unknown[]) => Promise<void> },
        'executeStep'
      ).mockImplementation(() => {
        // Abort while executing case 1
        controller.abort();
        return Promise.resolve();
      });

      const result = await runner.execute(
        { modules: ['cancel-mod'], cases: ['TC-1', 'TC-2'] },
        {
          projectRoot,
          signal: controller.signal,
          storageResolver: async (_m, id) => casesMap[id],
        }
      );

      expect(result.summary.passed).toBe(1);
      expect(result.summary.not_run).toBe(1);

      const tc2 = result.cases.find((c) => c.id === 'TC-2')!;
      expect(tc2.result).toBe('not_run');
      expect(tc2.not_run_reason).toContain('AbortSignal');
    });
  });

  // =========================================================================
  // CHALLENGE 7: High Volume & Stress Testing
  // =========================================================================
  describe('Challenge 7: High Volume & Stress Testing', () => {
    it('C7.1: stress-tests large DAG with 25 interdependent cases', async () => {
      vi.spyOn(chromium, 'launch').mockResolvedValue(mockBrowser);
      const runner = new PlaywrightRunner();
      const projectRoot = createTempDir();

      const casesMap: Record<string, TCCase> = {};
      const caseIds: string[] = [];

      // TC-00 is root (passes).
      // TC-01..TC-10 depend on TC-00 (pass).
      // TC-11 fails.
      // TC-12..TC-24 depend on TC-11 (should be not_run).
      casesMap['TC-00'] = {
        _version: '1',
        id: 'TC-00',
        name: 'Root Case',
        depends_on: [],
        steps: [{ type: 'navigate', url: 'https://example.test' }],
      };
      caseIds.push('TC-00');

      for (let i = 1; i <= 10; i++) {
        const id = `TC-${String(i).padStart(2, '0')}`;
        caseIds.push(id);
        casesMap[id] = {
          _version: '1',
          id,
          name: `Pass Case ${i}`,
          depends_on: ['TC-00'],
          steps: [{ type: 'navigate', url: 'https://example.test' }],
        };
      }

      casesMap['TC-11'] = {
        _version: '1',
        id: 'TC-11',
        name: 'Failing Case 11',
        depends_on: ['TC-00'],
        steps: [{ type: 'bad_action_fail' as any }],
      };
      caseIds.push('TC-11');

      for (let i = 12; i <= 24; i++) {
        const id = `TC-${String(i).padStart(2, '0')}`;
        caseIds.push(id);
        casesMap[id] = {
          _version: '1',
          id,
          name: `Dependent On Fail Case ${i}`,
          depends_on: ['TC-11'],
          steps: [{ type: 'navigate', url: 'https://example.test' }],
        };
      }

      const result = await runner.execute(
        { modules: ['stress-mod'], cases: caseIds },
        {
          projectRoot,
          storageResolver: async (_m, id) => casesMap[id],
        }
      );

      expect(result.summary.total).toBe(25);
      expect(result.summary.passed).toBe(11); // TC-00 and TC-01..TC-10
      expect(result.summary.failed).toBe(1);  // TC-11
      expect(result.summary.not_run).toBe(13); // TC-12..TC-24
      expect(result.result).toBe('partial');

      // Verify schema compliance of large result
      const validator = new SchemaValidator();
      const check = validator.validateExecutionResult(result);
      expect(check.valid).toBe(true);
    });

    it('C7.2: concurrent runner executions in distinct workspaces do not interfere', async () => {
      vi.spyOn(chromium, 'launch').mockResolvedValue(mockBrowser);
      const runnerA = new PlaywrightRunner();
      const runnerB = new PlaywrightRunner();

      const rootA = createTempDir('workspace-A-');
      const rootB = createTempDir('workspace-B-');

      const pA = runnerA.execute(
        { modules: ['mod-A'], cases: ['TC-A1'] },
        {
          projectRoot: rootA,
          storageResolver: async () => ({
            _version: '1',
            id: 'TC-A1',
            name: 'Case A1',
            steps: [{ type: 'navigate', url: 'https://example.test' }],
          }),
        }
      );

      const pB = runnerB.execute(
        { modules: ['mod-B'], cases: ['TC-B1'] },
        {
          projectRoot: rootB,
          storageResolver: async () => ({
            _version: '1',
            id: 'TC-B1',
            name: 'Case B1',
            steps: [{ type: 'navigate', url: 'https://example.test' }],
          }),
        }
      );

      const [resA, resB] = await Promise.all([pA, pB]);

      expect(resA.result).toBe('passed');
      expect(resA.module).toBe('mod-A');
      expect(resB.result).toBe('passed');
      expect(resB.module).toBe('mod-B');
    });
  });
});
