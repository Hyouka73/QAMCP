import type { ExecutionResult, ExecutedCase, ExecutedStep } from '@qap/shared';

/**
 * Generador de reporte Markdown (logs en texto) para S5-004.
 * Tabla de resumen + lista de casos con su desglose de pasos.
 */

function escapeMd(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

const STATUS_LABELS: Record<string, string> = {
  passed: 'Pasó',
  failed: 'Falló',
  skipped: 'Omitido',
  not_run: 'No ejecutado',
};

function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

function renderStep(step: ExecutedStep, index: number): string {
  const duration = typeof step.duration_ms === 'number' ? `${step.duration_ms} ms` : '—';
  const selector = step.selector ? ` \`${escapeMd(step.selector)}\`` : '';
  const line = `  - #${index + 1} **${escapeMd(step.action)}**${selector} — ${duration} — ${statusLabel(step.status)}`;
  const expObs =
    step.expected !== undefined || step.observed !== undefined
      ? `\n    - Esperado: \`${escapeMd(String(step.expected ?? '—'))}\` · Observado: \`${escapeMd(String(step.observed ?? '—'))}\``
      : '';
  const message = step.message ? `\n    - ${escapeMd(step.message)}` : '';
  const shot = step.screenshot
    ? `\n    - Captura${step.focused_screenshot ? ' enfocada' : ''}: \`${escapeMd(step.screenshot)}\``
    : '';
  const artErr = step.artifact_error ? `\n    - Causa fallo artefacto: ${escapeMd(step.artifact_error)}` : '';
  return line + expObs + message + shot + artErr;
}

function renderCase(caseItem: ExecutedCase): string {
  const duration = typeof caseItem.duration_ms === 'number' ? `${caseItem.duration_ms} ms` : '—';
  const header = `### ${escapeMd(caseItem.title)} (${escapeMd(caseItem.id)}) — ${statusLabel(caseItem.result)} — ${duration}`;

  const failureInfo = caseItem.failure_type
    ? `\n- Tipo de fallo: \`${escapeMd(caseItem.failure_type)}\``
    : '';
  const notRunInfo = caseItem.not_run_reason ? `\n- Motivo: ${escapeMd(caseItem.not_run_reason)}` : '';

  const steps = caseItem.steps ?? [];
  const stepsMd =
    steps.length > 0 ? steps.map((step, i) => renderStep(step, i)).join('\n') : '  - Sin pasos registrados';

  return `${header}${failureInfo}${notRunInfo}\n\n${stepsMd}`;
}

export function generateMarkdownReport(result: ExecutionResult): string {
  const { summary } = result;

  const summaryTable = [
    '| Total | Pasaron | Fallaron | Omitidos | No ejecutados |',
    '|---|---|---|---|---|',
    `| ${summary.total} | ${summary.passed} | ${summary.failed} | ${summary.skipped} | ${summary.not_run} |`,
  ].join('\n');

  const casesMd = result.cases.map(renderCase).join('\n\n');
  const artifactLines: string[] = [];
  if (result.attempt_id) {
    artifactLines.push(`- Intento: \`${escapeMd(result.attempt_id)}\``);
  }
  if (result.artifacts?.video_path) {
    artifactLines.push(`- Video WebM: \`${escapeMd(result.artifacts.video_path)}\``);
  }
  if (result.artifacts?.trace_zip_path) {
    artifactLines.push(`- Trace Playwright: \`${escapeMd(result.artifacts.trace_zip_path)}\``);
  }
  if (result.artifacts?.timeline_path) {
    artifactLines.push(`- Timeline de pasos: \`${escapeMd(result.artifacts.timeline_path)}\``);
  }
  if (result.artifacts?.artifact_errors && result.artifacts.artifact_errors.length > 0) {
    for (const err of result.artifacts.artifact_errors) {
      artifactLines.push(`- Diagnóstico artefacto (${escapeMd(err.artifact)}): ${escapeMd(err.message)}`);
    }
  }
  const artifactsSection =
    artifactLines.length > 0 ? ['## Evidencia del intento', '', ...artifactLines, ''] : [];

  return [
    `# Reporte de ejecución: ${escapeMd(result.module)}`,
    '',
    `Entorno: **${escapeMd(result.env)}** · Resultado global: **${statusLabel(result.result)}**`,
    '',
    summaryTable,
    '',
    ...artifactsSection,
    casesMd,
    '',
  ].join('\n');
}