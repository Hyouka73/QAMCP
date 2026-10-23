import { computeCoverage, generateNextInterviewBatch } from '@qap/engine';

export interface ToolTextResult {
  content: Array<{ type: 'text'; text: string }>;
}

type InterviewBatchParams = Parameters<typeof generateNextInterviewBatch>;
type CoverageParams = Parameters<typeof computeCoverage>;

interface InterviewBatchToolArgs {
  context: InterviewBatchParams[0];
  hypotheses?: InterviewBatchParams[1];
  applicableCategories?: InterviewBatchParams[2];
  waivers?: InterviewBatchParams[3];
}

interface CoverageToolArgs {
  applicableCategories?: CoverageParams[0];
  rules?: CoverageParams[1];
  waivers?: CoverageParams[2];
  view?: CoverageParams[3];
}

function asJsonResult(value: unknown): ToolTextResult {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] };
}

export function handleInterviewTools(name: string, args: Record<string, unknown>): ToolTextResult {
  if (name === 'generate_next_interview_batch') {
    const a = args as unknown as InterviewBatchToolArgs;
    return asJsonResult(
      generateNextInterviewBatch(
        a.context,
        a.hypotheses ?? [],
        a.applicableCategories ?? [],
        a.waivers ?? []
      )
    );
  }

  if (name === 'compute_coverage') {
    const a = args as unknown as CoverageToolArgs;
    return asJsonResult(
      computeCoverage(
        a.applicableCategories ?? [],
        a.rules ?? [],
        a.waivers ?? [],
        a.view ?? 'default'
      )
    );
  }

  throw new Error(`Herramienta de entrevista desconocida: ${name}`);
}