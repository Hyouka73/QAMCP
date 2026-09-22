/**
 * Tipos canónicos de Telemetría Dinámica y Persistencia en QAP v3.0.
 *
 * Fuente de verdad técnica: qap-v3-architect/SKILL.md
 * Ubicación física de datos efímeros: .qa/runtime/ (estrictamente excluida de Git)
 */

export type StepExecutionStatus = 'passed' | 'failed' | 'blocked' | 'skipped';

export interface AssertionTelemetry {
  statement: string;
  passed: boolean;
  expected?: unknown;
  actual?: unknown;
  errorSnippet?: string;
}

export interface StepResult {
  stepIndex: number;
  capabilityId: string;
  status: StepExecutionStatus;
  durationMs: number;
  timestamp: string;
  assertions: AssertionTelemetry[];
  error?: {
    message: string;
    stackTrace?: string;
    capturedAtStepMs: number;
  };
  screenshotFile?: string;
}

export interface ArtifactsManifest {
  video?: { filename: string; durationSec: number; sizeBytes: number; mimeType: string };
  trace?: { filename: string; sizeBytes: number };
  screenshots: Array<{ stepIndex: number; filename: string; sizeBytes: number }>;
  totalDiskUsageBytes: number;
}

export interface RunRecord {
  runId: string;
  flowId?: string;
  startedAt: string;
  finishedAt: string;
  totalDurationMs: number;
  overallStatus: 'passed' | 'failed' | 'partial';
  environment: {
    gitCommit: string;
    gitBranch: string;
    hostOs: string;
    runnerFramework: string;
  };
  steps: StepResult[];
  artifacts: ArtifactsManifest;
  lifecycle: { pinned: boolean; createdAt: string; expiresAt?: string };
}

export interface RunFilterOptions {
  flowId?: string;
  status?: 'passed' | 'failed' | 'partial';
  limit?: number;
  offset?: number;
}
