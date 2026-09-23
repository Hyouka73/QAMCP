import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { CapabilityDefinition } from '@qap/knowledge';

import { QapReporter } from '../runner/qap-reporter.js';

describe('Reporter Nativo QAP y Mapeo testBinding (Checklist Gate)', () => {
  let tempDir: string;

  const capabilities: CapabilityDefinition[] = [
    {
      id: 'auth.login.submit',
      name: 'Login Form Submission',
      type: 'ui-interaction',
      moduleId: 'auth',
      prerequisiteGroups: [],
      emits: [],
      testBinding: {
        file: 'test/auth/login.spec.ts',
        identifier: 'debe iniciar sesion correctamente',
      },
    },
    {
      id: 'checkout.payment.process',
      name: 'Process Payment',
      type: 'api-rest',
      moduleId: 'checkout',
      prerequisiteGroups: [],
      emits: [],
      testBinding: {
        file: 'test/checkout/payment.spec.ts',
        // Sin identifier: mapea a nivel de archivo
      },
    },
  ];

  let reporter: QapReporter | undefined;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qap-reporter-test-'));
    reporter = undefined;
  });

  afterEach(() => {
    try {
      reporter?.close();
    } catch {
      // Continuar
    }
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('mapea un test sin qapStep() a su capabilityId vía testBinding (Checklist Gate)', () => {
    reporter = new QapReporter({
      runtimeDir: tempDir,
      capabilities,
      gitCommit: '1234567',
      gitBranch: 'main',
    });

    // Evento de test estándar sin ninguna anotación ni cambio de código de usuario
    reporter.onTestEnd({
      file: 'C:/project/test/auth/login.spec.ts',
      title: 'Login Suite > debe iniciar sesion correctamente',
      status: 'passed',
      durationMs: 420,
    });

    const runRecord = reporter.finishRun();

    expect(runRecord.steps).toHaveLength(1);
    expect(runRecord.steps[0].capabilityId).toBe('auth.login.submit');
    expect(runRecord.steps[0].status).toBe('passed');
    expect(runRecord.overallStatus).toBe('passed');
  });

  it('soporta mapeo por archivo completo cuando testBinding no especifica identifier', () => {
    reporter = new QapReporter({
      runtimeDir: tempDir,
      capabilities,
    });

    reporter.onTestEnd({
      file: 'src/tests/test/checkout/payment.spec.ts',
      title: 'Procesar cargo con tarjeta de crédito',
      status: 'passed',
      durationMs: 310,
    });

    const runRecord = reporter.finishRun();

    expect(runRecord.steps).toHaveLength(1);
    expect(runRecord.steps[0].capabilityId).toBe('checkout.payment.process');
  });

  it('soporta anotaciones granulares de sub-pasos emitidas vía qapStep()', () => {
    reporter = new QapReporter({
      runtimeDir: tempDir,
      capabilities,
    });

    reporter.onTestEnd({
      file: 'test/custom.spec.ts',
      title: 'Test complejo con múltiples pasos',
      status: 'passed',
      durationMs: 800,
      annotations: [
        { type: 'qap:capabilityId', description: 'auth.login.submit', durationMs: 300 },
        { type: 'qap:capabilityId', description: 'checkout.payment.process', durationMs: 500 },
      ],
    });

    const runRecord = reporter.finishRun();

    expect(runRecord.steps).toHaveLength(2);
    expect(runRecord.steps[0].capabilityId).toBe('auth.login.submit');
    expect(runRecord.steps[1].capabilityId).toBe('checkout.payment.process');
  });
});
