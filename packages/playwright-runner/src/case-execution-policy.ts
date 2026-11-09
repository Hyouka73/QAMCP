import type { TCCase } from '@qap/shared';

/** Blocking signals are not proof of the converse: removing a tag grants no authority. */
export function caseExecutionBlockReason(testCase: TCCase): string | undefined {
  if (testCase.case_category === 'bva' || testCase.case_category === 'rbac_negative' ||
      testCase.tags?.includes('blocked_missing_oracle')) {
    return 'blocked_missing_oracle: propuesta sin oráculo y autoridad aprobados';
  }
  if (testCase.steps.some((step) => step.type === 'intercept_network')) {
    return 'blocked_intercept_contract: falta aprobación de alcance, origen y limpieza de simulación; no acredita RBAC real';
  }
  if (testCase.steps.some((step) => step.type === 'switch_auth')) {
    return 'blocked_session_transition: falta reemplazo aislado del contexto y ámbito de identidad; no se permite mezclar sesiones';
  }
  return undefined;
}
