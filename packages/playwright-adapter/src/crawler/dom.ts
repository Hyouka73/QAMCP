import type { Page } from 'playwright-core';

import type { ObservedControl, ObservedView } from './types.js';

/** No input values, text blobs, names, IDs, HTML, data attributes or user labels leave the DOM. */
export async function extractDom(page: Page, limit: number) {
  return page.evaluate((limit: number) => {
    const roles = new Set(['button', 'link', 'checkbox', 'radio', 'textbox', 'combobox', 'listbox',
      'menu', 'menubar', 'menuitem', 'navigation', 'dialog', 'tab', 'tablist', 'switch', 'slider', 'spinbutton']);
    const types = new Set(['text', 'password', 'email', 'number', 'tel', 'url', 'search', 'date', 'time',
      'datetime-local', 'month', 'week', 'checkbox', 'radio', 'file', 'hidden', 'submit', 'reset', 'button',
      'color', 'range', 'image']);
    const labels = new Set(['home', 'about', 'contact', 'help', 'search', 'inicio', 'ayuda', 'contacto', 'buscar']);
    const forms = Array.from(document.forms).slice(0, limit);
    const nodes = document.querySelectorAll('a[href],button,input,select,textarea,form,[role],dialog');
    const controls: ObservedControl[] = [];
    const links: Array<{ href: string; control_index: number; label?: string; download: boolean }> = [];
    for (const el of Array.from(nodes).slice(0, limit)) {
      const tag = el.tagName.toLowerCase();
      const role = el.getAttribute('role') ?? '';
      const inputType = el instanceof HTMLInputElement ? el.type : '';
      const label = (el.getAttribute('aria-label') ?? (tag === 'a' ? el.textContent : '') ?? '').trim().toLowerCase();
      let visibility: ObservedControl['visibility'] = 'not_evaluable';
      try {
        const style = getComputedStyle(el);
        visibility = el.getClientRects().length > 0 && style.visibility !== 'hidden' && style.display !== 'none'
          ? 'visible' : 'hidden';
      } catch { /* remain not_evaluable */ }
      // Structural selectors do not contain untrusted attribute values. No stability promise.
      const path: string[] = [];
      let ancestor: Element | null = el;
      while (ancestor && path.length < 24) {
        const name = ancestor.tagName.toLowerCase();
        if (!['html', 'body', 'main', 'div', 'section', 'article', 'header', 'footer', 'nav', 'aside',
          'ul', 'ol', 'li', 'span', 'p', 'form', 'fieldset', 'label', 'a', 'button', 'input',
          'select', 'textarea', 'dialog', 'table', 'tbody', 'tr', 'td', 'details', 'summary'].includes(name)) break;
        let ordinal = 1;
        for (let previous = ancestor.previousElementSibling; previous; previous = previous.previousElementSibling) {
          if (previous.tagName === ancestor.tagName) ordinal++;
        }
        path.unshift(`${name}:nth-of-type(${ordinal})`);
        ancestor = ancestor.parentElement;
      }
      const owner = el instanceof HTMLInputElement || el instanceof HTMLSelectElement ||
        el instanceof HTMLTextAreaElement || el instanceof HTMLButtonElement ? el.form : null;
      const formIndex = owner ? forms.indexOf(owner) : -1;
      const control: ObservedControl = { index: controls.length,
        tag: ['a', 'button', 'input', 'select', 'textarea', 'form', 'dialog'].includes(tag) ? tag : 'aria_element',
        visibility, disabled: el.matches(':disabled') || el.getAttribute('aria-disabled') === 'true',
        required_in_dom: el.hasAttribute('required'), selector_candidates: path.length ? [path.join(' > ')] : [],
        selector_stability: 'unverified', ...(roles.has(role) ? { role } : {}),
        ...(types.has(inputType) ? { input_type: inputType } : {}),
        ...(formIndex >= 0 ? { form_index: formIndex } : {}), ...(labels.has(label) ? { label } : {}) };
      controls.push(control);
      if (el instanceof HTMLAnchorElement) links.push({ href: el.href, control_index: control.index,
        download: el.hasAttribute('download'), ...(control.label ? { label: control.label } : {}) });
    }
    return { controls, links,
      menus: Math.min(limit, document.querySelectorAll('nav,[role="navigation"],[role="menu"],[role="menubar"]').length),
      headings: Math.min(limit, document.querySelectorAll('h1,h2,h3,h4,h5,h6').length),
      forms: forms.map((form, index): ObservedView['forms'][number] => ({ index,
        field_indices: controls.filter(c => c.form_index === index && ['input', 'select', 'textarea'].includes(c.tag)).map(c => c.index),
        submit_indices: controls.filter(c => c.form_index === index &&
          (c.input_type === 'submit' || (c.tag === 'button' && (nodes[c.index] as HTMLButtonElement).type === 'submit'))).map(c => c.index),
        method: ['get', 'post'].includes(form.method) ? form.method as 'get' | 'post' : 'other' })),
      script_dependent: !!document.querySelector('script, #skeleton, .skeleton, [aria-busy="true"], [data-skeleton]'),
      truncated: nodes.length > limit || document.forms.length > limit,
    };
  }, limit);
}
