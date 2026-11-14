import * as fs from 'node:fs';
import * as path from 'node:path';

import type { Page } from 'playwright-core';
import type { TCStep } from '@qap/shared';

import { maskSensitiveDomBeforeCapture } from '../evidence-artifacts.js';

export interface ScreenshotCaptureMetadata {
  targetPath: string;
  focused: boolean;
}

export async function executeScreenshotWithMetadata(
  page: Page,
  step: TCStep,
  outputDir: string = '.qa/reports/screenshots',
): Promise<ScreenshotCaptureMetadata> {
  const filename = step.filename ?? `screenshot_${Date.now()}.png`;
  const targetPath = path.isAbsolute(filename) ? filename : path.join(outputDir, filename);

  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  await maskSensitiveDomBeforeCapture(page);

  const pageAny = page as unknown as {
    locator?: (sel: string) => {
      first?: () => { screenshot?: (opts: { path: string; timeout?: number }) => Promise<Buffer> };
      screenshot?: (opts: { path: string; timeout?: number }) => Promise<Buffer>;
    };
    screenshot: (opts: { path: string; fullPage?: boolean }) => Promise<Buffer>;
  };

  if (step.selector && typeof pageAny.locator === 'function') {
    try {
      const locatorObj = pageAny.locator(step.selector);
      const targetLocator =
        locatorObj && typeof locatorObj.first === 'function' ? locatorObj.first() : locatorObj;
      if (targetLocator && typeof targetLocator.screenshot === 'function') {
        await targetLocator.screenshot({ path: targetPath, timeout: step.timeout ?? 2500 });
        return { targetPath, focused: true };
      }
    } catch {
      // Fallback to full-page screenshot if the target element cannot be captured directly
    }
  }

  await page.screenshot({ path: targetPath, fullPage: true });
  return { targetPath, focused: false };
}

/**
 * Toma de capturas de pantalla explícitas o automáticas ante fallos (S7-004).
 */
export async function executeScreenshot(
  page: Page,
  step: TCStep,
  outputDir: string = '.qa/reports/screenshots',
): Promise<string> {
  const { targetPath } = await executeScreenshotWithMetadata(page, step, outputDir);
  return targetPath;
}