import type { ExecutionResult, ExecutedCase } from '@qap/shared';

/**
 * Generador de reporte JUnit XML para integración con pipelines CI/CD (S5-004).
 * Sigue la estructura mínima estándar reconocida por Jenkins/GitHub Actions:
 * <testsuite> contiene <testcase>, y cada caso fallido tiene un <failure> adentro.
 *
 * Decisión: el modelo de datos de QAP tiene 'skipped' y 'not_run' como estados
 * separados, pero JUnit XML solo define <skipped/>. Ambos se mapean a <skipped/>
 * porque no existe un elemento estándar equivalente a 'not_run'.
 */

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function msToSeconds(ms: number | undefined): string {
  return ((ms ?? 0) / 1000).toFixed(3);
}

function renderTestCase(caseItem: ExecutedCase, module: string): string {
  const attrs = [
    `name="${escapeXml(caseItem.title)}"`,
    `classname="${escapeXml(module)}"`,
    `time="${msToSeconds(caseItem.duration_ms)}"`,
  ].join(' ');

  if (caseItem.result === 'failed') {
    const failureType = caseItem.failure_type ?? 'assertion_failed';
    const message = caseItem.not_run_reason ?? `Caso '${caseItem.id}' falló`;
    return `    <testcase ${attrs}>\n      <failure message="${escapeXml(message)}" type="${escapeXml(failureType)}"></failure>\n    </testcase>`;
  }

  if (caseItem.result === 'skipped' || caseItem.result === 'not_run') {
    const reason = caseItem.not_run_reason ? ` message="${escapeXml(caseItem.not_run_reason)}"` : '';
    return `    <testcase ${attrs}>\n      <skipped${reason}></skipped>\n    </testcase>`;
  }

  return `    <testcase ${attrs}></testcase>`;
}

export function generateJunitReport(result: ExecutionResult): string {
  const { summary } = result;
  const startedMs = Date.parse(result.started_at);
  const finishedMs = Date.parse(result.finished_at);
  const totalTimeSec =
    !Number.isNaN(startedMs) && !Number.isNaN(finishedMs)
      ? ((finishedMs - startedMs) / 1000).toFixed(3)
      : '0.000';

  const testcasesXml = result.cases.map((c) => renderTestCase(c, result.module)).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  <testsuite name="${escapeXml(result.module)}" tests="${summary.total}" failures="${summary.failed}" skipped="${summary.skipped + summary.not_run}" time="${totalTimeSec}">
${testcasesXml}
  </testsuite>
</testsuites>
`;
}