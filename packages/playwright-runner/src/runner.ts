import { chromium, type Browser, type BrowserContext, type Page } from 'playwright-core';
import type {
  TestPlan,
  TestOptions,
  ExecutionResult,
  ExecutionStatus,
  TCCase,
  TCStep,
  ExecutedCase,
  CaseResult,
} from '@qap/shared';

export interface PlaywrightRunnerOptions extends TestOptions {
  fail_fast?: boolean;
  storageResolver?: (moduleName: string, caseId: string) => Promise<TCCase>;
}

export class PlaywrightRunner {
  public async execute(
    plan: TestPlan,
    options: PlaywrightRunnerOptions = {}
  ): Promise<ExecutionResult> {
    const startedAt = new Date().toISOString();

    const isHeadless = options.headless ?? true;
    const timeout = options.timeout_ms ?? plan.timeout_ms ?? 30000;
    const failFast = options.fail_fast ?? plan.fail_fast ?? false;
    const moduleName = plan.modules[0] ?? '';
    const env = options.environment ?? plan.environment ?? 'local';

    let browser: Browser | null = null;
    let context: BrowserContext | null = null;

    let totalPassed = 0;
    let totalFailed = 0;
    const totalSkipped = 0;
    const totalNotRun = 0;
    const casesResult: ExecutedCase[] = [];
    let timedOut = false;

    try {
      browser = await chromium.launch({
        headless: isHeadless,
        slowMo: options.slow_mo ?? 0,
      });

      context = await browser.newContext();
      const page = await context.newPage();
      page.setDefaultTimeout(timeout);

      const caseList = plan.cases ?? [];

      for (const caseId of caseList) {
        const caseStartMs = Date.now();
        let caseResult: CaseResult = 'passed';
        let errorMessage: string | undefined;
        let caseTitle = caseId;

        try {
          if (options.storageResolver && moduleName) {
            const testCase = await options.storageResolver(moduleName, caseId);
            caseTitle = testCase.name || caseId;
            const steps = testCase.steps || [];
            for (const step of steps) {
              await this.executeStep(page, step);
            }
          }
          totalPassed++;
        } catch (err: unknown) {
          caseResult = 'failed';
          totalFailed++;
          errorMessage = err instanceof Error ? err.message : String(err);

          if (errorMessage.toLowerCase().includes('timeout')) {
            timedOut = true;
          }

          if (failFast) {
            const failFastCase: ExecutedCase = {
              id: caseId,
              title: caseTitle,
              result: caseResult,
              failure_type: 'assertion_failed',
              duration_ms: Date.now() - caseStartMs,
            };
            casesResult.push(failFastCase);
            break;
          }
        } finally {
          if (caseResult !== 'failed' || !failFast) {
            const executedCase: ExecutedCase = {
              id: caseId,
              title: caseTitle,
              result: caseResult,
              duration_ms: Date.now() - caseStartMs,
              ...(errorMessage
                ? {
                    failure_type: 'assertion_failed' as const,
                    steps: [
                      {
                        action: 'execute',
                        status: 'failed',
                        message: errorMessage,
                      },
                    ],
                  }
                : {}),
            };

            casesResult.push(executedCase);
          }
        }
      }
    } catch (err: unknown) {
      if (casesResult.length === 0) {
        totalFailed = Math.max(totalFailed, 1);
      }
      void err;
    } finally {
      if (context) await context.close().catch(() => {});
      if (browser) await browser.close().catch(() => {});
    }

    const finishedAt = new Date().toISOString();
    const total = totalPassed + totalFailed + totalSkipped + totalNotRun;
    const overallResult: ExecutionStatus =
      totalFailed === 0 ? 'passed' : totalPassed === 0 ? 'failed' : 'partial';

    const executionResult: ExecutionResult = {
      _version: '1',
      execution_id: `exec_${Date.now()}`,
      module: moduleName,
      env,
      started_at: startedAt,
      finished_at: finishedAt,
      result: overallResult,
      timed_out: timedOut,
      summary: {
        total,
        passed: totalPassed,
        failed: totalFailed,
        skipped: totalSkipped,
        not_run: totalNotRun,
      },
      cases: casesResult,
    };

    return executionResult;
  }

  private async executeStep(page: Page, step: TCStep): Promise<void> {
    const rawStep = step as unknown as Record<string, unknown>;

    const typeRaw = rawStep.type ?? rawStep.action;
    const stepType = typeof typeRaw === 'string' ? typeRaw : '';

    const selector =
      typeof rawStep.selector === 'string'
        ? rawStep.selector
        : typeof rawStep.target === 'string'
          ? rawStep.target
          : undefined;

    switch (stepType) {
      case 'navigate':
        if (typeof rawStep.url === 'string') {
          await page.goto(rawStep.url, { waitUntil: 'domcontentloaded' });
        }
        break;
      case 'click':
        if (selector) {
          await page.click(selector);
        }
        break;
      case 'fill':
        if (selector && typeof rawStep.value === 'string') {
          await page.fill(selector, rawStep.value);
        }
        break;
      case 'assert':
        if (selector) {
          await page.waitForSelector(selector, { state: 'visible' });
        }
        break;
      default:
        break;
    }
  }
}