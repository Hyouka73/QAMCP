/**
 * Report Type
 * 
 * Represents a generated test report.
 */
export interface Report {
  id: string;
  format: 'html' | 'json' | 'junit' | 'markdown';
  path?: string;
  content?: string;
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration_ms: number;
  };
  created_at: string;
}
