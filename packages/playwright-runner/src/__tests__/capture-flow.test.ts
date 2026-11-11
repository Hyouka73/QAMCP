import { chromium, type Browser, type Page } from 'playwright-core';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import type { TCStep } from '@qap/shared';

import { executeCapture } from '../actions/capture.js';

describe('S82-002: capture real alimenta el buffer del flujo', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch();
    page = await browser.newPage();
    await page.setContent(
      '<span id="user-id"> USR-999 </span><input id="loan" value="LN-123" />'
    );
  });

  afterAll(async () => {
    await browser.close();
  });

  it('captura texto y lo guarda en contextVariables y en _capturedBuffer', async () => {
    const step = { type: 'capture', selector: '#user-id', capture_as: 'USER_ID' } as unknown as TCStep;
    const contextVariables: Record<string, string> = {};
    const context_data: Record<string, unknown> & {
      _capturedBuffer?: Record<string, Record<string, string>>;
    } = { _capturedBuffer: {} };

    const value = await executeCapture(page, step, contextVariables, {
      caseId: 'tc_capture',
      context_data,
    });

    expect(value).toBe('USR-999');
    expect(contextVariables['USER_ID']).toBe('USR-999');
    expect(context_data._capturedBuffer?.['tc_capture']?.['USER_ID']).toBe('USR-999');
  });

  it('captura el valor de un input', async () => {
    const step = { type: 'capture', selector: '#loan', capture_as: 'LOAN_ID' } as unknown as TCStep;
    const value = await executeCapture(page, step, {}, { caseId: 'c2', context_data: { _capturedBuffer: {} } });
    expect(value).toBe('LN-123');
  });

  it('sin context_data no contamina contextVariables con el buffer', async () => {
    const step = { type: 'capture', selector: '#user-id', capture_as: 'USER_ID' } as unknown as TCStep;
    const contextVariables: Record<string, string> = {};

    await executeCapture(page, step, contextVariables);

    expect(Object.keys(contextVariables)).toEqual(['USER_ID']);
  });
});