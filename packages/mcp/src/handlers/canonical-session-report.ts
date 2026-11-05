import type { CanonicalSessionModuleReport } from './canonical-closure-service.js';

/** Markdown is documentary output, not a source of authorizations or executions. */
const markdownSpecials = new Set(['\\\\', '`', '*', '_', '{', '}', '[', ']', '<', '>', '|']);
const clean = (value: string | number | boolean | null | undefined): string =>
  [...String(value ?? '').replace(/[\\r\\n\\t]+/g, ' ')]
    .map(char => markdownSpecials.has(char) ? '\\\\' + char : char)
    .join('').trim();

export function renderCanonicalSessionReport(
  reports: readonly CanonicalSessionModuleReport[],
): string {
  const lines: string[] = [
    '# Reporte de cierre canónico de sesión',
    '',
    'Fuente de autoridad: registros durables de cierre y aprobaciones correlacionadas del host.',
    'Los requisitos listados son el inventario vigente al generar este reporte; no se afirma que el inventario sea idéntico al del momento de la aprobación.',
    '**Cobertura de especificación:** inventario y decisiones canónicas, no ejecución de pruebas.',
    '**Cobertura de revisión:** se registran decisiones del gateway; los fixtures automatizados no acreditan consentimiento humano auténtico.',
    '**Cobertura de ejecución:** no certificada por este reporte. Los resultados de qap_test requieren sus propias evidencias físicas.',
    '',
  ];
  for (const item of reports) {
    lines.push('## Módulo: ' + clean(item.module), '');
    lines.push('- Estado canónico autorizado: **' + clean(item.state) + '**');
    lines.push('- Decisión: ' + clean(item.decision_id));
    lines.push('- Revisor registrado: ' + clean(item.reviewer) + ' (' + clean(item.decided_at) + ')');
    lines.push('- Digest de autorización: ' + clean(item.request_digest));
    lines.push('- Digest de cobertura al cierre: ' + clean(item.coverage_digest));
    if (item.state === 'waived') {
      lines.push('- Motivo de waiver: ' + clean(item.waiver_reason));
    }
    lines.push('', '### Requisitos confirmados (inventario actual)', '');
    if (!item.current_confirmed_requirements.length) lines.push('- Ninguno registrado como confirmado actualmente.');
    for (const requirement of item.current_confirmed_requirements) {
      lines.push('- ' + clean(requirement.id) + ' (rev. ' + requirement.revision + ', ' +
        clean(requirement.category) + '): ' + clean(requirement.title));
    }
    lines.push('- Requisitos pendientes o no acreditables actualmente: ' +
      item.current_pending_requirements_count);
    lines.push('', '### Brechas aceptadas durables', '');
    if (!item.accepted_gaps.length && !item.closure_accepted_gaps?.length) {
      lines.push('- No hay brechas aceptadas registradas en esta proyección.');
    }
    for (const gap of item.accepted_gaps) {
      lines.push('- ' + clean(gap.id) + ' (' + clean(gap.category) + '): ' +
        clean(gap.reason) + '; recibo: ' + clean(gap.acceptance_receipt ?? 'no registrado'));
    }
    for (const gap of item.closure_accepted_gaps ?? []) {
      if (!item.accepted_gaps.some(existing => existing.id === gap.gap_id)) {
        lines.push('- ' + clean(gap.gap_id) + ': ' + clean(gap.reason) +
          ' (registrada en la decisión de cierre)');
      }
    }
    lines.push('', '### Aplicabilidad', '');
    if (!item.applicability_decisions.length && !item.closure_non_applicable_categories?.length) {
      lines.push('- Sin decisiones explícitas durables de aplicabilidad.');
    }
    for (const decision of item.applicability_decisions) {
      lines.push('- ' + clean(decision.category) + ': ' +
        (decision.applicable ? 'aplicable' : 'no aplicable') +
        '; motivo: ' + clean(decision.reason) + '; decisión: ' + clean(decision.decision_id));
    }
    for (const decision of item.closure_non_applicable_categories ?? []) {
      if (!item.applicability_decisions.some(saved =>
        saved.category === decision.category && !saved.applicable)) {
        lines.push('- ' + clean(decision.category) + ': no aplicable; motivo: ' +
          clean(decision.reason) + ' (decisión de cierre)');
      }
    }
    lines.push('');
  }
  return lines.join('\n') + '\n';
}
