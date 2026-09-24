import type { ExecutionResult, ExecutedCase, ExecutedStep } from '@qap/shared';
import type { IStorage } from '@qap/engine';

/**
 * Generador de reportes HTML autocontenido (S5-003).
 *
 * Produce un único archivo .html que:
 * - No depende de archivos externos (CSS/JS embebidos inline)
 * - Embebe las screenshots como data URIs (base64)
 * - Muestra el desglose paso a paso de cada caso
 * - Incluye filtros por estado (passed/failed/skipped/not_run) vía JS embebido
 */

// -----------------------------------------------------------------------------
// Utilidades internas
// -----------------------------------------------------------------------------

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Interfaz local para extender IStorage y soportar lecturas binarias
 * de forma estrictamente tipada sin violar reglas de ESLint.
 */
interface ExtendedStorage extends IStorage {
  readBuffer?: (path: string) => Promise<Buffer>;
}

/**
 * Lee una screenshot desde el storage y la convierte a data URI base64.
 */
async function screenshotToDataUri(
  storage: IStorage,
  relativePath: string,
): Promise<string | null> {
  try {
    const exists = await storage.exists(relativePath);
    if (!exists) return null;

    const extStorage = storage as ExtendedStorage;
   
   if (typeof extStorage.readBuffer !== 'function') {
      // Sin lectura binaria no podemos embeber la imagen sin corromperla
      return null;
    }
    const buffer: Buffer = await extStorage.readBuffer(relativePath);

    return `data:image/png;base64,${buffer.toString('base64')}`;
  } catch {
    // Si falla la lectura (archivo movido, corrupto, etc.) no rompemos el reporte completo
    return null;
  }
}

const STATUS_LABELS: Record<string, string> = {
  passed: 'Pasó',
  failed: 'Falló',
  skipped: 'Omitido',
  not_run: 'No ejecutado',
};

const STATUS_COLORS: Record<string, string> = {
  passed: '#16a34a',
  failed: '#dc2626',
  skipped: '#ca8a04',
  not_run: '#6b7280',
};

function statusBadge(status: string): string {
  const label = STATUS_LABELS[status] ?? status;
  const color = STATUS_COLORS[status] ?? '#6b7280';
  return `<span class="badge" style="background:${color}">${escapeHtml(label)}</span>`;
}

// -----------------------------------------------------------------------------
// Render de un paso individual
// -----------------------------------------------------------------------------

async function renderStep(
  step: ExecutedStep,
  index: number,
  caseId: string,
  storage: IStorage,
): Promise<string> {
  let screenshotHtml = '';

  if (step.screenshot) {
    const dataUri = await screenshotToDataUri(storage, step.screenshot);
    if (dataUri) {
      screenshotHtml = `
        <div class="step-screenshot">
          <img src="${dataUri}" alt="Screenshot paso ${index + 1} de ${escapeHtml(caseId)}" loading="lazy" />
        </div>`;
    }
  }

  const message = step.message ? `<p class="step-message">${escapeHtml(step.message)}</p>` : '';
  const selector = step.selector ? `<code class="step-selector">${escapeHtml(step.selector)}</code>` : '';
  const duration = typeof step.duration_ms === 'number' ? `${step.duration_ms} ms` : '—';

  return `
    <li class="step" data-step-status="${escapeHtml(step.status)}">
      <div class="step-header">
        <span class="step-index">#${index + 1}</span>
        <span class="step-action">${escapeHtml(step.action)}</span>
        ${selector}
        <span class="step-duration">${duration}</span>
        ${statusBadge(step.status)}
      </div>
      ${message}
      ${screenshotHtml}
    </li>`;
}

// -----------------------------------------------------------------------------
// Render de un caso completo (con sus pasos)
// -----------------------------------------------------------------------------

async function renderCase(caseItem: ExecutedCase, storage: IStorage): Promise<string> {
  const steps = caseItem.steps ?? [];
  const stepsHtml = (
    await Promise.all(steps.map((step, i) => renderStep(step, i, caseItem.id, storage)))
  ).join('\n');

  const failureInfo = caseItem.failure_type
    ? `<p class="case-failure-type">Tipo de fallo: <code>${escapeHtml(caseItem.failure_type)}</code></p>`
    : '';

  const notRunInfo = caseItem.not_run_reason
    ? `<p class="case-not-run-reason">Motivo: ${escapeHtml(caseItem.not_run_reason)}</p>`
    : '';

  const duration = typeof caseItem.duration_ms === 'number' ? `${caseItem.duration_ms} ms` : '—';

  return `
    <section class="case" data-case-status="${escapeHtml(caseItem.result)}">
      <header class="case-header">
        <h3>${escapeHtml(caseItem.title)}</h3>
        <div class="case-meta">
          <span class="case-id">${escapeHtml(caseItem.id)}</span>
          <span class="case-duration">${duration}</span>
          ${statusBadge(caseItem.result)}
        </div>
      </header>
      ${failureInfo}
      ${notRunInfo}
      <ol class="steps-list">
        ${stepsHtml || '<li class="no-steps">Sin pasos registrados</li>'}
      </ol>
    </section>`;
}

// -----------------------------------------------------------------------------
// CSS y JS embebidos (sin dependencias externas → reporte autocontenido)
// -----------------------------------------------------------------------------

const EMBEDDED_STYLES = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, Segoe UI, Roboto, sans-serif;
    background: #f4f5f7; color: #1f2937; margin: 0; padding: 24px;
  }
  h1 { font-size: 22px; margin-bottom: 4px; }
  .summary { display: flex; gap: 12px; margin: 16px 0 24px; flex-wrap: wrap; }
  .summary .stat {
    background: #fff; border-radius: 8px; padding: 10px 16px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.08); font-size: 14px;
  }
  .filters { margin-bottom: 20px; display: flex; gap: 8px; flex-wrap: wrap; }
  .filters button {
    border: 1px solid #d1d5db; background: #fff; border-radius: 999px;
    padding: 6px 14px; cursor: pointer; font-size: 13px;
  }
  .filters button.active { background: #1f2937; color: #fff; border-color: #1f2937; }
  .badge {
    display: inline-block; color: #fff; font-size: 11px; font-weight: 600;
    padding: 2px 8px; border-radius: 999px; text-transform: uppercase;
  }
  .case {
    background: #fff; border-radius: 10px; padding: 16px 20px; margin-bottom: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  .case-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
  .case-meta { display: flex; gap: 10px; align-items: center; font-size: 13px; color: #6b7280; }
  .case-failure-type, .case-not-run-reason { font-size: 13px; color: #b91c1c; }
  .steps-list { list-style: none; padding: 0; margin: 12px 0 0; }
  .step {
    border-left: 3px solid #e5e7eb; padding: 8px 12px; margin-bottom: 8px; background: #fafafa;
  }
  .step-header { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; font-size: 13px; }
  .step-index { color: #9ca3af; }
  .step-action { font-weight: 600; }
  .step-selector { background: #eef2ff; padding: 1px 6px; border-radius: 4px; font-size: 12px; }
  .step-duration { color: #6b7280; font-size: 12px; }
  .step-message { font-size: 13px; margin: 6px 0 0; color: #374151; }
  .step-screenshot img { max-width: 320px; border-radius: 6px; margin-top: 8px; border: 1px solid #e5e7eb; }
  .case[hidden], .step[hidden] { display: none; }
`;

const EMBEDDED_SCRIPT = `
  (function () {
    var buttons = document.querySelectorAll('.filters button');
    var cases = document.querySelectorAll('.case');

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        buttons.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var filter = btn.getAttribute('data-filter');

        cases.forEach(function (caseEl) {
          var status = caseEl.getAttribute('data-case-status');
          caseEl.hidden = filter !== 'all' && filter !== status;
        });
      });
    });
  })();
`;

// -----------------------------------------------------------------------------
// Función principal exportada
// -----------------------------------------------------------------------------

export interface HtmlReportOptions {
  /** Instancia de IStorage usada para resolver rutas de screenshots. */
  storage: IStorage;
}

/**
 * Genera un reporte HTML autocontenido a partir de un ExecutionResult.
 * Devuelve el HTML como string; quien llame decide dónde escribirlo (vía IStorage).
 */
export async function generateHtmlReport(
  result: ExecutionResult,
  options: HtmlReportOptions,
): Promise<string> {
  const { storage } = options;

  const casesHtml = (
    await Promise.all(result.cases.map((c) => renderCase(c, storage)))
  ).join('\n');

  const { summary } = result;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Reporte de ejecución — ${escapeHtml(result.module)}</title>
  <style>${EMBEDDED_STYLES}</style>
</head>
<body>
  <h1>Reporte de ejecución: ${escapeHtml(result.module)}</h1>
  <p>Entorno: <strong>${escapeHtml(result.env)}</strong> · Resultado global: ${statusBadge(result.result)}</p>

  <div class="summary">
    <div class="stat">Total: <strong>${summary.total}</strong></div>
    <div class="stat">Pasaron: <strong>${summary.passed}</strong></div>
    <div class="stat">Fallaron: <strong>${summary.failed}</strong></div>
    <div class="stat">Omitidos: <strong>${summary.skipped}</strong></div>
    <div class="stat">No ejecutados: <strong>${summary.not_run}</strong></div>
  </div>

  <div class="filters">
    <button data-filter="all" class="active">Todos</button>
    <button data-filter="passed">Pasaron</button>
    <button data-filter="failed">Fallaron</button>
    <button data-filter="skipped">Omitidos</button>
    <button data-filter="not_run">No ejecutados</button>
  </div>

  <main>
    ${casesHtml}
  </main>

  <script>${EMBEDDED_SCRIPT}</script>
</body>
</html>`;
}