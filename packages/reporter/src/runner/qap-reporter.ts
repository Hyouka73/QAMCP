import crypto from 'node:crypto';
import path from 'node:path';

import type { CapabilityDefinition } from '@qap/knowledge';

import { QapDatabase } from '../persistence/sqlite-client.js';
import { processBlockedSteps } from '../postprocessor/blocked-processor.js';
import type { RunRecord, StepResult } from '../types.js';

export interface TestEvent {
  file: string;
  title: string;
  status: 'passed' | 'failed' | 'skipped';
  durationMs: number;
  error?: {
    message: string;
    stackTrace?: string;
  };
  screenshotFile?: string;
  annotations?: Array<{ type: string; description: string; durationMs?: number }>;
}

export interface QapReporterOptions {
  runtimeDir: string;
  capabilities: CapabilityDefinition[];
  flowId?: string;
  gitCommit?: string;
  gitBranch?: string;
  memoryOnly?: boolean;
}

/**
 * Normaliza una ruta a formato POSIX relativo.
 */
function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

/**
 * Reporter nativo de QAP (Vitest / Playwright / Runner agnostic).
 *
 * Mapeo de dos capas:
 * - Capa 1: Por introspección sin cambios en el código de prueba del usuario (testBinding).
 * - Capa 2: Por anotaciones de sub-pasos (qapStep()).
 */
export class QapReporter {
  private db: QapDatabase;
  private capabilities: CapabilityDefinition[];
  private flowId?: string;
  private gitCommit: string;
  private gitBranch: string;
  private collectedSteps: StepResult[] = [];
  private runId: string;
  private startedAt: string;

  constructor(options: QapReporterOptions) {
    this.db = new QapDatabase(options.runtimeDir, options.memoryOnly ?? false);
    this.capabilities = options.capabilities;
    this.flowId = options.flowId;
    this.gitCommit = options.gitCommit ?? '';
    this.gitBranch = options.gitBranch ?? '';
    this.runId = `run-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    this.startedAt = new Date().toISOString();
  }

  getRunId(): string {
    return this.runId;
  }

  getDatabase(): QapDatabase {
    return this.db;
  }

  close(): void {
    this.db.close();
  }

  /**
   * Resuelve la capacidad asociada a un test a través de testBinding (Capa 1).
   */
  resolveCapabilityForTest(filePath: string, title: string): CapabilityDefinition | undefined {
    const normalizedFile = normalizePath(filePath);

    // 1. Coincidencia exacta de archivo e identificador
    for (const cap of this.capabilities) {
      if (cap.testBinding) {
        const bindingFile = normalizePath(cap.testBinding.file);
        const fileMatches = normalizedFile.endsWith(bindingFile) || bindingFile.endsWith(normalizedFile);

        if (fileMatches && cap.testBinding.identifier) {
          if (title.includes(cap.testBinding.identifier)) {
            return cap;
          }
        }
      }
    }

    // 2. Coincidencia solo por archivo si no se especificó identificador
    for (const cap of this.capabilities) {
      if (cap.testBinding) {
        const bindingFile = normalizePath(cap.testBinding.file);
        if (normalizedFile.endsWith(bindingFile) || bindingFile.endsWith(normalizedFile)) {
          if (!cap.testBinding.identifier) {
            return cap;
          }
        }
      }
    }

    return undefined;
  }

  /**
   * Procesa la finalización de un test ejecutado.
   */
  onTestEnd(event: TestEvent): void {
    const timestamp = new Date().toISOString();

    // 1. Revisar si hay anotaciones explícitas de sub-pasos qapStep (Capa 2)
    const qapAnnotations = (event.annotations || []).filter(
      (a) => a.type === 'qap:capabilityId'
    );

    if (qapAnnotations.length > 0) {
      for (const ann of qapAnnotations) {
        const stepIndex = this.collectedSteps.length;
        this.collectedSteps.push({
          stepIndex,
          capabilityId: ann.description,
          status: event.status,
          durationMs: ann.durationMs ?? event.durationMs,
          timestamp,
          assertions: [],
          screenshotFile: event.screenshotFile,
          error: event.error
            ? {
                message: event.error.message,
                stackTrace: event.error.stackTrace,
                capturedAtStepMs: ann.durationMs ?? event.durationMs,
              }
            : undefined,
        });
      }
      return;
    }

    // 2. Mapeo por testBinding sin anotaciones (Capa 1)
    const matchedCap = this.resolveCapabilityForTest(event.file, event.title);
    const capabilityId = matchedCap ? matchedCap.id : `unbound.${path.basename(event.file)}.${event.title}`;

    const stepIndex = this.collectedSteps.length;
    this.collectedSteps.push({
      stepIndex,
      capabilityId,
      status: event.status,
      durationMs: event.durationMs,
      timestamp,
      assertions: [],
      screenshotFile: event.screenshotFile,
      error: event.error
        ? {
            message: event.error.message,
            stackTrace: event.error.stackTrace,
            capturedAtStepMs: event.durationMs,
          }
        : undefined,
    });
  }

  /**
   * Finaliza la corrida:
   * 1. Aplica el post-procesador de estado `blocked` (Regla 3).
   * 2. Calcula métricas globales de la corrida.
   * 3. Ejecuta la persistencia dual atómica (Reglas 9 y 10).
   */
  finishRun(): RunRecord {
    const finishedAt = new Date().toISOString();

    // Derivar estado 'blocked' sobre los pasos recogidos
    const processedSteps = processBlockedSteps(this.collectedSteps, this.capabilities);

    let totalDurationMs = 0;
    let hasFailed = false;
    let hasPassed = false;

    for (const step of processedSteps) {
      totalDurationMs += step.durationMs;
      if (step.status === 'failed' || step.status === 'blocked') {
        hasFailed = true;
      }
      if (step.status === 'passed') {
        hasPassed = true;
      }
    }

    let overallStatus: 'passed' | 'failed' | 'partial' = 'passed';
    if (hasFailed && hasPassed) {
      overallStatus = 'partial';
    } else if (hasFailed) {
      overallStatus = 'failed';
    }

    const runRecord: RunRecord = {
      runId: this.runId,
      flowId: this.flowId,
      startedAt: this.startedAt,
      finishedAt,
      totalDurationMs,
      overallStatus,
      environment: {
        gitCommit: this.gitCommit,
        gitBranch: this.gitBranch,
        hostOs: process.platform,
        runnerFramework: 'vitest/native',
      },
      steps: processedSteps,
      artifacts: {
        totalDiskUsageBytes: 0,
        screenshots: [],
      },
      lifecycle: {
        pinned: false,
        createdAt: this.startedAt,
      },
    };

    // Persistir dualmente en filesystem y SQLite
    this.db.saveRun(runRecord);

    return runRecord;
  }
}
