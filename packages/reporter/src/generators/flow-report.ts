import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Generador de reportes de ejecución de flujos (HTML y JSON) para S82-005.
 */

export type FlowReportStatus = 'passed' | 'failed' | 'skipped' | 'not_run' | 'partial';

export interface FlowCaseExecutionResult {
  id: string;
  title?: string;
  status: FlowReportStatus;
  durationMs?: number;
  reason?: string;
  failureType?: string;
}

export interface FlowReportSummary {
  totalCases: number;
  passed: number;
  failed: number;
  skipped: number;
  notRun: number;
}

export interface FlowModuleExecutionResult {
  module: string;
  status: FlowReportStatus;
  durationMs?: number;
  error?: string;
  reportPath?: string;
  cases?: FlowCaseExecutionResult[];
}

export interface FlowReportResult {
  flowName: string;
  status: FlowReportStatus;
  terminalStatus?: 'passed' | 'failed';
  summary?: FlowReportSummary;
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
  if (value === 'not_run') return 'not_run';
  if (value === 'skipped') return 'skipped';
  if (value === 'partial') return 'partial';
  return 'failed';
}

function extractCaseReason(rawCase: Record<string, unknown>): string | undefined {
  if (typeof rawCase.not_run_reason === 'string' && rawCase.not_run_reason.trim().length > 0) {
    return rawCase.not_run_reason;
  }
  if (typeof rawCase.error === 'string' && rawCase.error.trim().length > 0) {
    return rawCase.error;
  }
  if (rawCase.error && typeof rawCase.error === 'object') {
    const errMsg = (rawCase.error as { message?: unknown }).message;
    if (typeof errMsg === 'string' && errMsg.trim().length > 0) {
      return errMsg;
    }
  }
  if (typeof rawCase.message === 'string' && rawCase.message.trim().length > 0) {
    return rawCase.message;
  }
  if (Array.isArray(rawCase.steps)) {
    const failedStep = (rawCase.steps as Array<Record<string, unknown>>).find(
      (s) => s && (s.status === 'failed' || s.status === 'blocked') && typeof s.message === 'string' && s.message.trim().length > 0
    );
    if (failedStep && typeof failedStep.message === 'string') {
      return failedStep.message;
    }
  }
  if (typeof rawCase.failure_type === 'string' && rawCase.failure_type.trim().length > 0) {
    return rawCase.failure_type;
  }
  return undefined;
}

function normalizeModuleCases(
  rawCases: unknown,
  moduleName: string
): FlowCaseExecutionResult[] | undefined {
  if (!Array.isArray(rawCases)) return undefined;
  const cases: FlowCaseExecutionResult[] = [];
  for (const item of rawCases) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const c = item as Record<string, unknown>;
    const rawId = c.id ?? c.case_id;
    const id = typeof rawId === 'string' && rawId.trim().length > 0 ? rawId : moduleName;
    const rawTitle = c.title ?? c.name;
    const title = typeof rawTitle === 'string' && rawTitle.trim().length > 0 ? rawTitle : undefined;
    const status = toStatus(c.result ?? c.status);
    const durationMs =
      typeof c.duration_ms === 'number'
        ? c.duration_ms
        : typeof c.durationMs === 'number'
          ? c.durationMs
          : 0;
    const reason = extractCaseReason(c);
    const failureType =
      typeof c.failure_type === 'string' && c.failure_type.trim().length > 0 ? c.failure_type : undefined;

    cases.push({
      id,
      ...(title ? { title } : {}),
      status,
      durationMs,
      ...(reason ? { reason } : {}),
      ...(failureType ? { failureType } : {}),
    });
  }
  return cases;
}

function extractModuleError(m: Record<string, unknown>): string | undefined {
  if (typeof m.message === 'string' && m.message.trim().length > 0) return m.message;
  if (typeof m.error === 'string' && m.error.trim().length > 0) return m.error;
  if (typeof m.not_run_reason === 'string' && m.not_run_reason.trim().length > 0) return m.not_run_reason;
  if (Array.isArray(m.cases)) {
    const reasons: string[] = [];
    for (const rawCase of m.cases as Array<Record<string, unknown>>) {
      if (!rawCase || typeof rawCase !== 'object') continue;
      const reason = extractCaseReason(rawCase);
      if (reason) reasons.push(reason);
    }
    if (reasons.length > 0) {
      return reasons.join('; ');
    }
  }
  return undefined;
}

function computeSummary(modules: FlowModuleExecutionResult[], rawResults: Record<string, unknown>): FlowReportSummary {
  const summary: FlowReportSummary = {
    totalCases: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    notRun: 0,
  };

  for (const mod of modules) {
    if (Array.isArray(mod.cases) && mod.cases.length > 0) {
      for (const c of mod.cases) {
        summary.totalCases++;
        if (c.status === 'passed') summary.passed++;
        else if (c.status === 'skipped') summary.skipped++;
        else if (c.status === 'not_run') summary.notRun++;
        else summary.failed++;
      }
      continue;
    }

    const rawMod = (rawResults[mod.module] ?? {}) as Record<string, unknown>;
    const rawSum = rawMod.summary;
    if (rawSum && typeof rawSum === 'object' && !Array.isArray(rawSum)) {
      const s = rawSum as Record<string, unknown>;
      const toCount = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0);
      summary.totalCases += toCount(s.total);
      summary.passed += toCount(s.passed);
      summary.failed += toCount(s.failed);
      summary.skipped += toCount(s.skipped);
      summary.notRun += toCount(s.not_run);
    }
  }

  return summary;
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
    const cases = normalizeModuleCases(m.cases, module);
    return {
      module,
      status: toStatus(m.result ?? m.status),
      durationMs: Number.isNaN(start) || Number.isNaN(end) ? 0 : end - start,
      error: extractModuleError(m),
      reportPath: typeof m.report_path === 'string' ? m.report_path : undefined,
      ...(cases !== undefined ? { cases } : {}),
    };
  });

  const summary = computeSummary(modules, results);
  const rawStatus = toStatus(r.status);
  const hasAnyNonPassingModule = modules.some((m) => m.status !== 'passed');
  const hasAnyNonPassingCase = summary.failed > 0 || summary.notRun > 0 || summary.skipped > 0;
  const terminalStatus: 'passed' | 'failed' =
    rawStatus === 'passed' && !hasAnyNonPassingModule && !hasAnyNonPassingCase ? 'passed' : 'failed';
  const status: FlowReportStatus = terminalStatus;

  return {
    flowName: typeof r.flow_name === 'string' ? r.flow_name : 'unknown-flow',
    status,
    terminalStatus,
    summary,
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

function renderCasesHtml(cases?: FlowCaseExecutionResult[]): string {
  if (!Array.isArray(cases) || cases.length === 0) return '';
  const rows = cases
    .map(
      (c) => `
          <tr>
            <td><code>${esc(c.id)}</code>${c.title && c.title !== c.id ? ` <span class="case-title">${esc(c.title)}</span>` : ''}</td>
            <td><span class="badge ${esc(c.status)}">${esc(c.status.toUpperCase())}</span></td>
            <td>${esc(c.durationMs ?? 0)} ms</td>
            <td>${c.reason ? esc(c.reason) : '-'}</td>
          </tr>`
    )
    .join('');

  return `<table class="cases-table">
        <thead><tr><th>Caso</th><th>Estado</th><th>Duración</th><th>Motivo / Detalle</th></tr></thead>
        <tbody>${rows}
        </tbody>
      </table>`;
}

export function generateFlowHtmlReport(flowResult: FlowReportResult): string {
  const terminalStatus = flowResult.terminalStatus ?? (flowResult.status === 'passed' ? 'passed' : 'failed');
  const summaryCounts = flowResult.summary;
  const summaryLineHtml = summaryCounts
    ? `<p><strong>Resumen de casos:</strong> Total: ${esc(summaryCounts.totalCases)} | Pasaron: ${esc(summaryCounts.passed)} | Fallaron: ${esc(summaryCounts.failed)} | Omitidos: ${esc(summaryCounts.skipped)} | No ejecutados: ${esc(summaryCounts.notRun)}</p>`
    : '';

  const modulesHtml = (flowResult.modules || [])
    .map(
      (m, idx) => `
      <div class="module-card ${esc(m.status)}">
        <h3>#${idx + 1} - ${esc(m.module)}</h3>
        <p><strong>Estado:</strong> <span class="badge ${esc(m.status)}">${esc(m.status.toUpperCase())}</span></p>
        <p><strong>Duración:</strong> ${esc(m.durationMs ?? 0)} ms</p>
        ${m.error ? `<p class="error"><strong>Detalle:</strong> ${esc(m.error)}</p>` : ''}
        ${renderCasesHtml(m.cases)}
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
    .module-card.not_run { border-left-color: #6b7280; }
    .module-card.partial { border-left-color: #fd7e14; }
    .badge { padding: 3px 8px; border-radius: 4px; font-size: 12px; color: #fff; }
    .badge.passed { background: #28a745; }
    .badge.failed { background: #dc3545; }
    .badge.skipped { background: #ffc107; color: #333; }
    .badge.not_run { background: #6b7280; }
    .badge.partial { background: #fd7e14; }
    .cases-table, .vars-table { width: 100%; border-collapse: collapse; background: #fff; margin-top: 10px; }
    .cases-table th, .cases-table td, .vars-table th, .vars-table td { padding: 8px 12px; border-bottom: 1px solid #ddd; text-align: left; }
    .cases-table th { background: #f1f5f9; color: #334155; font-size: 13px; }
    .vars-table th { background: #007bff; color: #fff; }
    .case-title { color: #64748b; font-size: 12px; }
    .error { color: #dc3545; }
  </style>
</head>
<body>
  <h1>Reporte del Flujo: ${esc(flowResult.flowName)}</h1>
  <div class="summary">
    <p><strong>Estado General:</strong> <span class="badge ${esc(flowResult.status)}">${esc(flowResult.status.toUpperCase())}</span></p>
    <p><strong>Resultado Terminal:</strong> <span class="badge ${esc(terminalStatus)}">${esc(terminalStatus.toUpperCase())}</span></p>
    ${summaryLineHtml}
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