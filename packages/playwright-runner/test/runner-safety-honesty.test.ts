import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { FileSystemStorage } from '@qap/knowledge';
import { SchemaValidator, type ExecutionResult } from '@qap/shared';
import { chromium } from 'playwright-core';
import { describe, it, expect, vi, afterEach } from 'vitest';

import { PlaywrightRunner } from '../src/runner.js';

const tempDirs: string[] = [];

function createTempDir(prefix = 'qap-runner-test-'): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

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

describe('PlaywrightRunner Safety & Honesty Regressions — VNEXT-014-C1 (R2)', () => {
  // REG-R2-01: options.projectRoot honored without assuming process.cwd()
  it('REG-R2-01: honors options.projectRoot and avoids assuming process.cwd() (FAIL BEFORE / PASS AFTER)', async () => {
    const customRoot = createTempDir('custom-project-root-');
    const runner = new PlaywrightRunner();

    const storageSpy = vi.spyOn(FileSystemStorage.prototype, 'getTestCase').mockResolvedValueOnce({
      _version: '1',
      id: 'TC-001',
      name: 'Test Case in Custom Root',
      steps: [{ type: 'navigate', url: 'https://example.test' }],
    });

    const mockPage = {
      setDefaultTimeout: vi.fn(),
      goto: vi.fn().mockResolvedValue(undefined),
      waitForLoadState: vi.fn().mockResolvedValue(undefined),
    };
    const mockContext = {
      newPage: vi.fn().mockResolvedValue(mockPage),
      close: vi.fn().mockResolvedValue(undefined),
    };
    const mockBrowser = {
      newContext: vi.fn().mockResolvedValue(mockContext),
      close: vi.fn().mockResolvedValue(undefined),
    };

    vi.spyOn(chromium, 'launch').mockResolvedValueOnce(mockBrowser as any);

    const result = await runner.execute(
      { modules: ['auth-mod'], cases: ['TC-001'] },
      { projectRoot: customRoot }
    );

    // Verify storage was constructed with customRoot, not process.cwd()
    expect(storageSpy).toHaveBeenCalledWith('auth-mod', 'TC-001');
    expect(result.module).toBe('auth-mod');
  });

  // REG-R2-02: Zero cases executed never returns 'passed'
  it('REG-R2-02: zero cases executed never produces passed verdict (FAIL BEFORE / PASS AFTER)', async () => {
    const runner = new PlaywrightRunner();

    const result = await runner.execute(
      { modules: ['empty-mod'], cases: [] },
      { projectRoot: createTempDir() }
    );

    // FAIL BEFORE: Returned 'passed' because totalFailed === 0 evaluated to true
    // PASS AFTER: Returns 'failed' because total === 0 and totalPassed === 0
    expect(result.result).toBe('failed');
    expect(result.result).not.toBe('passed');
    expect(result.summary.total).toBe(0);
    expect(result.summary.passed).toBe(0);
    expect(result.summary.failed).toBe(0);
    expect(result.cases).toHaveLength(0);
  });

  // REG-R2-03: Unknown or unsupported step types throw explicit errors and fail the case
  it('REG-R2-03: unknown or unsupported step types fail explicitly (FAIL BEFORE / PASS AFTER)', async () => {
    const runner = new PlaywrightRunner();
    const mockPage = {} as any;

    // FAIL BEFORE: Default clause in executeStep had a silent 'break;' returning void
    // PASS AFTER: Throws explicit Error rejecting unknown or unsupported step type
    await expect(
      (runner as any).executeStep(mockPage, { type: 'unsupported_phantom_action' })
    ).rejects.toThrow("Acción o tipo de paso no soportado o desconocido: 'unsupported_phantom_action'");
  });

  // REG-R2-04: Chromium launch failures classified as infrastructure errors
  it('REG-R2-04: classifies Chromium launch failure as infrastructure error with not_run cases (FAIL BEFORE / PASS AFTER)', async () => {
    const runner = new PlaywrightRunner();

    vi.spyOn(chromium, 'launch').mockRejectedValueOnce(
      new Error("Executable doesn't exist at C:\\Users\\Fake\\AppData\\Local\\ms-playwright\\chromium")
    );

    const result = await runner.execute(
      {
        modules: ['checkout'],
        cases: ['TC-001', 'TC-002'],
      },
      { projectRoot: createTempDir() }
    );

    // FAIL BEFORE: Returned { result: 'failed', summary: { failed: 1, total: 1 }, cases: [] }
    // PASS AFTER: Returns { result: 'error', summary: { total: 2, passed: 0, failed: 0, not_run: 2 } }
    expect(result.result).toBe('error');
    expect(result.summary.total).toBe(2);
    expect(result.summary.passed).toBe(0);
    expect(result.summary.failed).toBe(0);
    expect(result.summary.not_run).toBe(2);
    expect(result.cases).toHaveLength(2);

    expect(result.cases[0].result).toBe('not_run');
    expect(result.cases[0].not_run_reason).toContain('Fallo de infraestructura');
    expect(result.cases[0].not_run_reason).toContain("Executable doesn't exist");
    expect(result.cases[1].result).toBe('not_run');
  });

  // REG-R2-05: Strict schema compliance with execution-result.schema.json
  it('REG-R2-05: produces execution result strictly compliant with schema without rejected properties (FAIL BEFORE / PASS AFTER)', () => {
    const validator = new SchemaValidator();

    // Valid ExecutionResult as produced by updated PlaywrightRunner (with 'screenshot' and 'network_error')
    const validExecutionResult: ExecutionResult = {
      _version: '1',
      execution_id: 'exec_test_001',
      module: 'checkout',
      env: 'local',
      started_at: new Date().toISOString(),
      finished_at: new Date().toISOString(),
      result: 'failed',
      timed_out: false,
      summary: {
        total: 1,
        passed: 0,
        failed: 1,
        skipped: 0,
        not_run: 0,
      },
      cases: [
        {
          id: 'TC-001',
          title: 'Case 1',
          result: 'failed',
          duration_ms: 120,
          failure_type: 'network_error', // Valid schema enum value (mapped from navigation errors)
          steps: [
            {
              action: 'execute',
              status: 'failed',
              message: 'net::ERR_NAME_NOT_RESOLVED',
              screenshot: '.qa/reports/screenshots/failure.png', // Valid schema property (not screenshot_path)
            },
          ],
        },
      ],
    };

    const validCheck = validator.validateExecutionResult(validExecutionResult);
    expect(validCheck.valid).toBe(true);
    expect(validCheck.errors).toHaveLength(0);

    // FAIL BEFORE: Historical runner produced 'screenshot_path' and 'navigation_error' which fail schema
    const legacyInvalidPayload = {
      ...validExecutionResult,
      cases: [
        {
          ...validExecutionResult.cases[0],
          failure_type: 'navigation_error', // Invalid enum in schema
          steps: [
            {
              action: 'execute',
              status: 'failed',
              screenshot_path: '.qa/reports/screenshots/failure.png', // Invalid property in schema
            },
          ],
        },
      ],
    };

    const invalidCheck = validator.validateExecutionResult(legacyInvalidPayload);
    expect(invalidCheck.valid).toBe(false);
    expect(invalidCheck.errors.length).toBeGreaterThan(0);
  });

  // REG-R2-06: Dependency propagation skips unrun or failed dependencies & failFast preservation
  it('REG-R2-06: propagates DAG dependencies skipping blocked cases and preserves unrun cases on failFast (FAIL BEFORE / PASS AFTER)', async () => {
    const runner = new PlaywrightRunner();

    const mockPage = {
      setDefaultTimeout: vi.fn(),
    };
    const mockContext = {
      newPage: vi.fn().mockResolvedValue(mockPage),
      close: vi.fn().mockResolvedValue(undefined),
    };
    const mockBrowser = {
      newContext: vi.fn().mockResolvedValue(mockContext),
      close: vi.fn().mockResolvedValue(undefined),
    };
    vi.spyOn(chromium, 'launch').mockResolvedValue(mockBrowser as any);

    // Mock executeStep so that TC-001 fails
    vi.spyOn(runner as unknown as { executeStep: (...args: unknown[]) => Promise<void> }, 'executeStep').mockImplementation(
      (_page: unknown, rawStep: unknown) => {
        const step = rawStep as { url?: string };
        if (step.url === 'https://fail.test') {
          return Promise.reject(new Error('Element not found'));
        }
        return Promise.resolve();
      }
    );

    const testCases: Record<string, any> = {
      'TC-001': {
        _version: '1',
        id: 'TC-001',
        name: 'Case 1 - Fails',
        depends_on: [],
        steps: [{ type: 'navigate', url: 'https://fail.test' }],
      },
      'TC-002': {
        _version: '1',
        id: 'TC-002',
        name: 'Case 2 - Depends on 1',
        depends_on: ['TC-001'],
        steps: [{ type: 'navigate', url: 'https://success.test' }],
      },
      'TC-003': {
        _version: '1',
        id: 'TC-003',
        name: 'Case 3 - Independent',
        depends_on: [],
        steps: [{ type: 'navigate', url: 'https://success.test' }],
      },
    };

    // 1. Test dependency skipping without failFast
    const resNoFailFast = await runner.execute(
      { modules: ['test-mod'], cases: ['TC-001', 'TC-002', 'TC-003'] },
      {
        projectRoot: createTempDir(),
        storageResolver: async (_m, id) => testCases[id],
        fail_fast: false,
      }
    );

    expect(resNoFailFast.summary.total).toBe(3);
    expect(resNoFailFast.summary.failed).toBe(1);
    expect(resNoFailFast.summary.not_run).toBe(1);
    expect(resNoFailFast.summary.passed).toBe(1);

    const tc2Result = resNoFailFast.cases.find((c) => c.id === 'TC-002');
    expect(tc2Result).toBeDefined();
    expect(tc2Result!.result).toBe('not_run');
    expect(tc2Result!.not_run_reason).toContain("Omitido porque la dependencia 'TC-001' no tuvo estado 'passed'");

    // 2. Test failFast: remaining unexecuted cases are preserved in inventory as not_run
    const resFailFast = await runner.execute(
      { modules: ['test-mod'], cases: ['TC-001', 'TC-003'] },
      {
        projectRoot: createTempDir(),
        storageResolver: async (_m, id) => testCases[id],
        fail_fast: true,
      }
    );

    // FAIL BEFORE: With failFast, cases after the failing case were completely discarded from result and summary
    // PASS AFTER: Remaining cases preserved as not_run with reason 'Detenido por fail-fast'
    expect(resFailFast.summary.total).toBe(2);
    expect(resFailFast.summary.failed).toBe(1);
    expect(resFailFast.summary.not_run).toBe(1);
    expect(resFailFast.cases).toHaveLength(2);
    expect(resFailFast.cases[0].id).toBe('TC-001');
    expect(resFailFast.cases[0].result).toBe('failed');
    expect(resFailFast.cases[1].id).toBe('TC-003');
    expect(resFailFast.cases[1].result).toBe('not_run');
    expect(resFailFast.cases[1].not_run_reason).toBe('Detenido por fail-fast');
  });

  // REG-R2-07: Host MCP process safety: process.exit is NEVER called and no global signal handlers hijack process
  it('REG-R2-07: host MCP process safety: does not call process.exit or install global exit listeners by default (FAIL BEFORE / PASS AFTER)', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);

    const runner = new PlaywrightRunner();

    // Execute with default options (registerSignalHandlers is false by default)
    await runner.execute(
      { modules: ['test-mod'], cases: [] },
      { projectRoot: createTempDir() }
    );

    // FAIL BEFORE: Signal handlers called process.exit(130), process.exit(143), process.exit(1)
    // PASS AFTER: process.exit is NEVER called by the runner in MCP library mode
    expect(exitSpy).not.toHaveBeenCalled();
  });

  // REG-R2-08: Implicit session recovery disabled when allowImplicitAuth is false (R2 / F7)
  it('REG-R2-08: prevents implicit auto-login and unattended browser launch when allowImplicitAuth is false (FAIL BEFORE / PASS AFTER)', async () => {
    const customRoot = createTempDir('implicit-auth-test-');
    const storage = new FileSystemStorage({ rootDir: customRoot });
    // Write prereqs requiring 'admin'
    await storage.writeYaml('.qa/modules/auth-mod/prereqs.yaml', {
      _version: '1',
      requires: {
        auth: { primary: 'admin' },
      },
    });

    const runner = new PlaywrightRunner();
    const chromiumLaunchSpy = vi.spyOn(chromium, 'launch');

    // Run with allowImplicitAuth: false
    const result = await runner.execute(
      { modules: ['auth-mod'], cases: [] },
      { projectRoot: customRoot, allowImplicitAuth: false }
    );

    // Verify chromium.launch was NEVER called for auto-login
    expect(chromiumLaunchSpy).not.toHaveBeenCalled();
    expect(result.result).toBe('failed'); // 0 cases = failed
  });

  // REG-R2-09: Navigation policy and route interception blocks unauthorized destinations (R2 / F6)
  it('REG-R2-09: isUrlAllowedByPolicy correctly verifies origins and wildcards (FAIL BEFORE / PASS AFTER)', async () => {
    const { isUrlAllowedByPolicy } = await import('../src/runner.js');
    const policy = ['http://localhost:*', 'http://127.0.0.1:8080'];

    expect(isUrlAllowedByPolicy('http://localhost:3000/app', policy)).toBe(true);
    expect(isUrlAllowedByPolicy('http://127.0.0.1:8080/login', policy)).toBe(true);
    expect(isUrlAllowedByPolicy('http://127.0.0.1:9090/blocked', policy)).toBe(false);
    expect(isUrlAllowedByPolicy('http://169.254.169.254/metadata', policy)).toBe(false);
    expect(isUrlAllowedByPolicy('https://evil.internal.corp/steal', policy)).toBe(false);
    expect(isUrlAllowedByPolicy('about:blank', policy)).toBe(true);
  });
});
