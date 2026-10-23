import { computeSessionGapSummary, generateSessionGapReport } from '@qap/engine';

import type { ToolTextResult } from './interview-tools.js';

type GapReportParams = Parameters<typeof computeSessionGapSummary>[0];

export function handleGapReportTools(name: string, args: Record<string, unknown>): ToolTextResult {
  const params = args as unknown as GapReportParams;

  if (name === 'compute_session_gap_summary') {
    return {
      content: [{ type: 'text', text: JSON.stringify(computeSessionGapSummary(params), null, 2) }],
    };
  }

  if (name === 'generate_session_gap_report') {
    return { content: [{ type: 'text', text: generateSessionGapReport(params) }] };
  }

  throw new Error(`Herramienta de reportes de brechas desconocida: ${name}`);
}