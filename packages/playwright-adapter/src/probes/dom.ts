import type { Page } from 'playwright-core';

import type { ActiveProbeInput, ActiveProbeLimits, ProbeOutput, ProbeStructure } from './types.js';

/** Selection happens inside Chromium: no values, HTML, messages or attribute strings cross IPC. */
export async function executeEmptyProbe(page: Page, input: ActiveProbeInput, limits: ActiveProbeLimits): Promise<
  { status: 'blocked' | 'indeterminate'; reason: string } | { status: 'executed'; output: ProbeOutput }> {
  return page.evaluate(async ({ selector, kind, limits }) => {
    const matches = document.querySelectorAll(selector);
    if (matches.length !== 1) return { status: 'blocked' as const, reason: 'TARGET_NOT_UNIQUE' };
    const form = matches[0];
    if (!(form instanceof HTMLFormElement) || form.ownerDocument !== document || form.getRootNode() !== document ||
      !form.isConnected || !form.getClientRects().length || getComputedStyle(form).visibility !== 'visible' ||
      form.closest('[inert],[hidden]')) return { status: 'blocked' as const, reason: 'TARGET_UNAVAILABLE' };
    if (!form.elements.length || form.elements.length > limits.max_controls) return { status: 'blocked' as const, reason: 'CONTROL_LIMIT' };
    const controls = Array.from(form.elements);
    for (const control of controls) {
      if (!(control instanceof HTMLInputElement || control instanceof HTMLSelectElement ||
        control instanceof HTMLTextAreaElement || control instanceof HTMLButtonElement) ||
        !form.contains(control)) return { status: 'blocked' as const, reason: 'UNSUPPORTED_CONTROL_CONTEXT' };
      if (control.value !== '' || (control instanceof HTMLInputElement &&
        (control.checked || control.files?.length || ['password', 'hidden', 'file', 'image'].includes(control.type)))) {
        return { status: 'blocked' as const, reason: 'NONEMPTY_OR_SENSITIVE_FORM' };
      }
    }
    const snapshot = (): ProbeStructure => {
      const walker = document.createTreeWalker(form, NodeFilter.SHOW_ELEMENT);
      let nodes = 0, errors = 0;
      while (nodes <= limits.max_dom_nodes && walker.nextNode()) {
        nodes++;
        const el = walker.currentNode as Element;
        if (el.getAttribute('role') === 'alert' || el.getAttribute('aria-invalid') === 'true') errors++;
      }
      const fields = Array.from({ length: Math.min(form.elements.length, limits.max_controls) }, (_, i) => form.elements[i]).filter((el): el is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLButtonElement =>
        el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement || el instanceof HTMLButtonElement);
      const controls = fields.map(el => ({ tag: el.tagName.toLowerCase() as 'input' | 'select' | 'textarea' | 'button',
        required: el.hasAttribute('required'), disabled: el.matches(':disabled'), will_validate: el.willValidate,
        valid: el.validity.valid, aria_invalid: el.getAttribute('aria-invalid') === 'true',
        constraints: ['required', 'pattern', 'min', 'max', 'minlength', 'maxlength', 'step', 'type'].filter(name => el.hasAttribute(name)),
        invalid_categories: (['valueMissing', 'typeMismatch', 'patternMismatch', 'tooLong', 'tooShort', 'rangeUnderflow',
          'rangeOverflow', 'stepMismatch', 'badInput', 'customError'] as const).filter(key => el.validity[key]),
        ...(el instanceof HTMLInputElement && ['text', 'email', 'number', 'tel', 'url', 'search', 'date', 'time',
          'datetime-local', 'month', 'week', 'checkbox', 'radio', 'submit', 'reset', 'button', 'color', 'range'].includes(el.type)
          ? { input_type: el.type } : {}) }));
      return { visible: form.getClientRects().length > 0 && getComputedStyle(form).visibility === 'visible',
        form_aria_invalid: form.getAttribute('aria-invalid') === 'true', valid: controls.every(c => !c.will_validate || c.valid),
        invalid_controls: controls.filter(c => c.will_validate && !c.valid).length, controls,
        nodes: Math.min(nodes, limits.max_dom_nodes), error_indicators: Math.min(errors, limits.max_dom_nodes),
        no_validate: form.noValidate, truncated: nodes > limits.max_dom_nodes || form.elements.length > limits.max_controls ||
          !form.isConnected || document.querySelectorAll(selector).length !== 1 || document.querySelector(selector) !== form ||
          fields.length !== Math.min(form.elements.length, limits.max_controls) };
    };
    const before = snapshot();
    if (before.truncated) return { status: 'blocked' as const, reason: 'DOM_LIMIT' };
    if (kind === 'protected_empty_submit' && before.valid) return { status: 'blocked' as const, reason: 'VALID_FORM_SUBMIT_REFUSED' };
    let invalid = 0, submits = 0, changes = 0, truncated = false;
    const onInvalid = () => { if (invalid < limits.max_validation_events) invalid++; else truncated = true; };
    const onSubmit = (event: Event) => {
      event.preventDefault();
      if (submits < limits.max_validation_events) submits++; else truncated = true;
    };
    const mutations = (records: MutationRecord[]) => {
      if (changes + records.length > limits.max_dom_changes) truncated = true;
      changes = Math.min(limits.max_dom_changes, changes + records.length);
      if (truncated) observer.disconnect();
    };
    // Default prevention supplements the independent CSP form-action and sealed network barriers.
    window.addEventListener('invalid', onInvalid, true);
    window.addEventListener('submit', onSubmit, true);
    const observer = new MutationObserver(mutations);
    observer.observe(form, { attributes: true, childList: true, subtree: true });
    let nativeReturn: boolean | undefined;
    try {
      // Recheck and operate in this same JS turn: no awaited target substitution window.
      if (kind === 'native_empty_validation') nativeReturn = HTMLFormElement.prototype.checkValidity.call(form);
      else HTMLFormElement.prototype.requestSubmit.call(form);
      await new Promise(resolve => setTimeout(resolve, limits.action_window_ms));
      mutations(observer.takeRecords());
      const after = snapshot();
      if (kind === 'protected_empty_submit' && invalid + submits === 0) {
        return { status: 'indeterminate' as const, reason: 'VALIDATION_INTERACTION_NOT_OBSERVED' };
      }
      return { status: 'executed' as const, output: { before, after,
        validation_events: invalid, submit_events: submits, dom_changes: changes,
        truncated: truncated || after.truncated,
        ...(nativeReturn === undefined ? {} : { native_return: nativeReturn }) } };
    } finally {
      observer.disconnect(); window.removeEventListener('invalid', onInvalid, true);
      window.removeEventListener('submit', onSubmit, true);
    }
  }, { selector: input.authorization.form_selector, kind: input.probe, limits });
}
