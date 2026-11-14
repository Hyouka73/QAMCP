export interface RawStep {
  action?: string;
  type?: string;
  target?: string;
  url?: string;
  condition?: string;
  assertion_type?: string;
  as?: string;
  capture_as?: string;
  profile?: string;
  auth_profile?: string;
  title?: string;
  name?: string;
  [key: string]: unknown;
}

export interface RawTestCase {
  id?: string;
  name?: string;
  title?: string;
  steps?: RawStep[];
  [key: string]: unknown;
}

export function normalizeTcCase<T extends RawTestCase>(testCase: T): T {
  const normalized = { ...testCase };

  if (normalized.title && !normalized.name) {
    normalized.name = normalized.title;
  }

  if (Array.isArray(normalized.steps)) {
    normalized.steps = normalized.steps.map((step: RawStep) => {
      const s = { ...step };
      if (s.action && !s.type) {
        s.type = s.action;
      }
      if (s.target && !s.url && !s.target.startsWith('http') && s.type === 'navigate') {
        s.url = s.target;
      }
      if (s.condition && !s.assertion_type) {
        s.assertion_type = s.condition;
      }
      if (s.as && !s.capture_as) {
        s.capture_as = s.as;
      }
      if (s.profile && !s.auth_profile) {
        s.auth_profile = s.profile;
      }
      if (s.title && !s.name) {
        s.name = s.title;
      }
      return s;
    });
  }

  return normalized;
}