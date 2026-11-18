import path from 'node:path';

import type { RunRecord } from '../types.js';

import { QapReporter } from './qap-reporter.js';

export interface FlowTelemetryEvent {
  flowName: string;
  module: string;
  caseId: string;
  status: 'passed' | 'failed' | 'skipped' | 'not_run';
  durationMs: number;
  error?: string;
}

export interface FlowTelemetryFinishOptions {
  status?: 'passed' | 'failed' | 'partial' | 'error' | (string & {});
  error?: string;
  resumeNoOp?: boolean;
}

export interface FlowTelemetry {
  onCaseEnd(event: FlowTelemetryEvent): void;
  finish(options?: FlowTelemetryFinishOptions | string): RunRecord;
}

export interface FlowTelemetryOptions {
  /** Normalmente <raíz>/.qa/runtime */
  runtimeDir: string;
  flowName: string;
}

/**
 * Conecta un flujo con QapReporter: cada caso emite onTestEnd() con la
 * anotación qap:capabilityId y finish() persiste la corrida (SQLite WAL + run.json).
 */
export function createFlowTelemetry(options: FlowTelemetryOptions): FlowTelemetry {
  const reporter = new QapReporter({
    runtimeDir: options.runtimeDir,
    capabilities: [],
    flowId: options.flowName,
  });
  const flowFile = path.posix.join('.qa', 'flows', `${options.flowName}.yaml`);

  return {
    onCaseEnd(event) {
      reporter.onTestEnd({
        file: flowFile,
        title: `${event.module}:${event.caseId}`,
        status: event.status,
        durationMs: event.durationMs,
        error: event.error ? { message: event.error } : undefined,
        annotations: [
          {
            type: 'qap:capabilityId',
            description: `${event.flowName}.${event.module}.${event.caseId}`,
            durationMs: event.durationMs,
          },
        ],
      });
    },
    finish(finishOptions) {
      const run = reporter.finishRun(finishOptions);
      reporter.close();
      return run;
    },
  };
}