import type { Page } from 'playwright-core';
import type { TCStep } from '@qap/shared';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Toma de capturas de pantalla explícitas o automáticas ante fallos (S7-004).
 */
export async function executeScreenshot(page: Page, step: TCStep, outputDir: string = '.qa/reports/screenshots'): Promise<string> {
  const filename = step.filename ?? `screenshot_${Date.now()}.png`;
  const targetPath = path.isAbsolute(filename) ? filename : path.join(outputDir, filename);

  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (step.selector) {
    const locator = page.locator(step.selector);
    await locator.screenshot({ path: targetPath });
  } else {
    await page.screenshot({ path: targetPath, fullPage: true });
  }

  return targetPath;
}