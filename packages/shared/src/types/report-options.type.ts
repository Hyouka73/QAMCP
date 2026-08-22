/**
 * Report Options Type
 * 
 * Configuration options for report generation.
 */
export interface ReportOptions {
  format: 'html' | 'json' | 'junit' | 'markdown';
  output_path?: string;
  include_screenshots?: boolean;
  include_logs?: boolean;
  verbose?: boolean;
}
