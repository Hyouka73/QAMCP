import type { ExecutionResult } from '@qap/shared';

/**
 * Pure semantic checks beyond the JSON schema.
 * This does not attest that a browser ran: it only establishes the internal
 * consistency of an ExecutionResult that must already pass schema validation.
 */
export function isInternallyConsistentExecution(
  evidence: ExecutionResult,
  expected?: { module?: string; environment?: string }
): boolean {
  if (expected?.module !== undefined && evidence.module !== expected.module) return false;
  if (expected?.environment !== undefined && evidence.env !== expected.environment) return false;

  const counts = { passed: 0, failed: 0, skipped: 0, not_run: 0 };
  const identifiers = new Set<string>();
  for (const testCase of evidence.cases) {
    if (!testCase.id || identifiers.has(testCase.id)) return false;
    identifiers.add(testCase.id);
    counts[testCase.result]++;
  }
  const s = evidence.summary;
  if (
    s.total !== evidence.cases.length ||
    s.passed !== counts.passed ||
    s.failed !== counts.failed ||
    s.skipped !== counts.skipped ||
    s.not_run !== counts.not_run
  ) return false;

  switch (evidence.result) {
    case 'passed':
      return s.total > 0 && s.passed === s.total;
    case 'failed':
      return s.passed === 0;
    case 'partial':
      return s.passed > 0 && s.passed < s.total;
    case 'error':
      // Infrastructure errors may have recorded some cases before aborting.
      return true;
    default:
      return false;
  }
}
