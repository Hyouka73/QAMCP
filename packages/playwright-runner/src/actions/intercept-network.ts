import type { TCStep } from '@qap/shared';
import type { Page } from 'playwright-core';

const DEFAULT_URL_PATTERN = '**/*';
const DEFAULT_STATUS = 403;

export async function executeInterceptNetwork(page: Page, step: TCStep): Promise<void> {
  const config = step.intercept_config;
  const urlPattern = config?.url_pattern ?? step.target ?? DEFAULT_URL_PATTERN;
  const status = config?.response_override?.status ?? step.expected_status ?? DEFAULT_STATUS;
  const body = config?.response_override?.body ?? JSON.stringify({ error: 'Unauthorized / Forbidden', status });
  const method = config?.method;


  await page.route(urlPattern, async (route) => {
   if (method && route.request().method() !== method) {
    await route.continue();
    return;
   }
   await route.fulfill({ status, contentType: 'application/json', body });
  });
}