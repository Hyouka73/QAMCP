import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Generador de reportes de ejecución de flujos (HTML y JSON) para S82-005.
 */

export type FlowReportStatus = 'passed' | 'failed' | 'skipped';

export interface FlowModuleExecutionResult {
  module: string;
  status: FlowReportStatus;
  durationMs?: number;
  error?: string;
  reportPath?: string;
}

export interface FlowReportResult {
  flowName: string;
  status: FlowReportStatus;
  modules: FlowModuleExecutionResult[];
  sharedVariables?: Record<string, unknown>;
  error?: string;
  startTime?: string;
  endTime?: string;
  durationMs?: number;
}

function esc(value: unknown): string {
    const text =
    typeof value === 'string'
      ? value
      : typeof value === 'number' || typeof value === 'boolean'
        ? String(value)
        : value === null || value === undefined
          ? ''
          : JSON.stringify(value);
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toStatus(value: unknown): FlowReportStatus {
  if (value === 'passed' || value === 'success') return 'passed';
  if (value === 'skipped' || value === 'not_run') return 'skipped';
  return 'failed';
}

/**
 * Convierte el resultado real del FlowOrchestrator
 * ({ flow_name, status, results, shared_variables, error }) al formato del reporte.
 */
export function normalizeFlowResult(raw: unknown): FlowReportResult {
  const r = (raw ?? {}) as Record<string, unknown>;
  const results = (r.results ?? {}) as Record<string, unknown>;

  const modules: FlowModuleExecutionResult[] = Object.entries(results).map(([module, res]) => {
    const m = (res ?? {}) as Record<string, unknown>;
    const start = typeof m.started_at === 'string' ? Date.parse(m.started_at) : NaN;
    const end = typeof m.finished_at === 'string' ? Date.parse(m.finished_at) : NaN;
    return {
      module,
      status: toStatus(m.result ?? m.status),
      durationMs: Number.isNaN(start) || Number.isNaN(end) ? 0 : end - start,
      error: typeof m.message === 'string' ? m.message : undefined,
      reportPath: typeof m.report_path === 'string' ? m.report_path : undefined,
    };
  });

  return {
    flowName: typeof r.flow_name === 'string' ? r.flow_name : 'unknown-flow',
    status: toStatus(r.status),
    modules,
    sharedVariables: (r.shared_variables as Record<string, unknown> | undefined) ?? {},
    error: typeof r.error === 'string' ? r.error : undefined,
    startTime: typeof r.started_at === 'string' ? r.started_at : undefined,
    durationMs: modules.reduce((acc, m) => acc + (m.durationMs ?? 0), 0),
  };
}

export function generateFlowJsonReport(flowResult: FlowReportResult): string {
  return JSON.stringify(flowResult, null, 2);
}

export function generateFlowHtmlReport(flowResult: FlowReportResult): string {
  const modulesHtml = (flowResult.modules || [])
    .map(
      (m, idx) => `
      <div class="module-card ${esc(m.status)}">
        <h3>#${idx + 1} - ${esc(m.module)}</h3>
        <p><strong>Estado:</strong> <span class="badge ${esc(m.status)}">${esc(m.status.toUpperCase())}</span></p>
        <p><strong>Duración:</strong> ${esc(m.durationMs ?? 0)} ms</p>
        ${m.error ? `<p class="error"><strong>Detalle:</strong> ${esc(m.error)}</p>` : ''}
        ${m.reportPath ? `<p><a href="${esc(m.reportPath)}" target="_blank" rel="noopener">Ver reporte individual</a></p>` : ''}
      </div>`
    )
    .join('');

  const entries = Object.entries(flowResult.sharedVariables || {});
  const variablesHtml =
    entries.length > 0
      ? `<table class="vars-table">
        <thead><tr><th>Variable (\${flow.*})</th><th>Valor</th></tr></thead>
        <tbody>
          ${entries
            .map(([k, v]) => `<tr><td>\${flow.${esc(k)}}</td><td>${esc(typeof v === 'string' ? v : JSON.stringify(v))}</td></tr>`)
            .join('')}
        </tbody>
      </table>`
      : '<p>No se transfirieron variables compartidas en este flujo.</p>';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Reporte de Flujo: ${esc(flowResult.flowName)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f4f6f9; color: #333; }
    .summary { background: #fff; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; }
    .timeline { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
    .module-card { background: #fff; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 5px solid #ccc; }
    .module-card.passed { border-left-color: #28a745; }
    .module-card.failed { border-left-color: #dc3545; }
    .module-card.skipped { border-left-color: #ffc107; }
    .badge { padding: 3px 8px; border-radius: 4px; font-size: 12px; color: #fff; }
    .badge.passed { background: #28a745; }
    .badge.failed { background: #dc3545; }
    .badge.skipped { background: #ffc107; color: #333; }
    .vars-table { width: 100%; border-collapse: collapse; background: #fff; }
    .vars-table th, .vars-table td { padding: 10px 15px; border-bottom: 1px solid #ddd; text-align: left; }
    .vars-table th { background: #007bff; color: #fff; }
    .error { color: #dc3545; }
  </style>
</head>
<body>
  <h1>Reporte del Flujo: ${esc(flowResult.flowName)}</h1>
  <div class="summary">
    <p><strong>Estado General:</strong> <span class="badge ${esc(flowResult.status)}">${esc(flowResult.status.toUpperCase())}</span></p>
    <p><strong>Duración Total:</strong> ${esc(flowResult.durationMs ?? 0)} ms</p>
    ${flowResult.error ? `<p class="error"><strong>Error:</strong> ${esc(flowResult.error)}</p>` : ''}
  </div>

  <h2>Timeline Secuencial de Módulos</h2>
  <div class="timeline">${modulesHtml}</div>

  <h2>Variables Transferidas (\${flow.*})</h2>
  ${variablesHtml}
</body>
</html>`;
}

/**
 * Escribe .qa/reports/flow-<flow_name>-<timestamp>.html y .json. Devuelve las rutas.
 */
export function writeFlowReports(
  flowResult: FlowReportResult,
  rootDir: string = process.cwd()
): { html: string; json: string } {
  const reportsDir = path.join(rootDir, '.qa', 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  const safeName = flowResult.flowName.replace(/[^a-zA-Z0-9_.-]/g, '_');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const base = path.join(reportsDir, `flow-${safeName}-${timestamp}`);

  fs.writeFileSync(`${base}.html`, generateFlowHtmlReport(flowResult), 'utf-8');
  fs.writeFileSync(`${base}.json`, generateFlowJsonReport(flowResult), 'utf-8');
  return { html: `${base}.html`, json: `${base}.json` };
}