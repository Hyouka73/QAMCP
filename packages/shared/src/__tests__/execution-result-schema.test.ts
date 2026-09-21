import { describe, it, expect } from 'vitest';

import type { ExecutionResult, FailureType } from '../types/execution-result.type.js';
import { SchemaValidator } from '../validator/schema-validator.js';

describe('Contrato execution-result.schema.json (S5-001)', () => {
  const validator = new SchemaValidator();

  const createBaseValidPayload = (): ExecutionResult => ({
    _version: '1',
    execution_id: '20260921T103000Z_auth_c4d5e6f',
    module: 'auth',
    env: 'local',
    started_at: '2026-09-21T10:30:00.000Z',
    finished_at: '2026-09-21T10:30:12.500Z',
    result: 'passed',
    timed_out: false,
    summary: {
      total: 3,
      passed: 2,
      failed: 1,
      skipped: 0,
      not_run: 0,
    },
    cases: [
      {
        id: 'TC-AUTH-001',
        title: 'Inicio de sesión con credenciales válidas',
        result: 'passed',
        duration_ms: 1450,
        steps: [
          {
            action: 'fill',
            selector: '#username',
            duration_ms: 120,
            status: 'passed',
            message: null,
            screenshot: null,
          },
          {
            action: 'click',
            selector: '#btn-submit',
            duration_ms: 300,
            status: 'passed',
            message: 'Login enviado',
            screenshot: 'screenshots/login-success.png',
          },
        ],
        screenshots: ['screenshots/login-success.png'],
      },
    ],
  });

  it('debe validar exitosamente un payload completo y válido según el esquema', () => {
    const payload = createBaseValidPayload();
    const result = validator.validateExecutionResult(payload);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.data).toBeDefined();
    expect(result.data?._version).toBe('1');
    expect(result.data?.result).toBe('passed');
  });

  it('debe rechazar payloads con propiedades extrañas en la raíz (additionalProperties: false)', () => {
    const payload: Record<string, unknown> = {
      ...createBaseValidPayload(),
      unauthorized_root_prop: 'inyeccion_invalida',
    };

    const result = validator.validateExecutionResult(payload);
    expect(result.valid).toBe(false);

    const error = result.errors.find((err) => err.rule === 'additionalProperties');
    expect(error).toBeDefined();
    expect(error?.message).toContain("Propiedad no permitida 'unauthorized_root_prop'");
  });

  it('debe sugerir el campo correcto con Levenshtein cuando hay un error tipográfico en additionalProperties', () => {
    const base = createBaseValidPayload();
    const payload: Record<string, unknown> = {
      ...base,
      reuslt: 'passed', // Typo de result
    };
    delete payload['result'];

    const result = validator.validateExecutionResult(payload);
    expect(result.valid).toBe(false);

    const error = result.errors.find((err) => err.rule === 'additionalProperties');
    expect(error).toBeDefined();
    expect(error?.message).toContain("Propiedad no permitida 'reuslt'");
    expect(error?.message).toContain("¿Quizás quisiste decir 'result'?");
  });

  it('debe rechazar de forma estricta un _version diferente de "1"', () => {
    const payload: Record<string, unknown> = {
      ...createBaseValidPayload(),
      _version: '2',
    };

    const result = validator.validateExecutionResult(payload);
    expect(result.valid).toBe(false);

    const versionError = result.errors.find((err) => err.field === '_version');
    expect(versionError).toBeDefined();
  });

  it('debe rechazar _version con valor "1.0" o "2.1.0" al exigir const "1"', () => {
    const payload: Record<string, unknown> = {
      ...createBaseValidPayload(),
      _version: '2.1.0',
    };

    const result = validator.validateExecutionResult(payload);
    expect(result.valid).toBe(false);
  });

  it('debe soportar casos con failure_type: "assertion_failed" y detalles de fallo', () => {
    const payload = createBaseValidPayload();
    payload.result = 'failed';
    payload.summary.failed = 1;
    payload.cases.push({
      id: 'TC-AUTH-002',
      title: 'Fallo al ingresar password incorrecto',
      result: 'failed',
      failure_type: 'assertion_failed',
      duration_ms: 850,
      steps: [
        {
          action: 'assert_text',
          selector: '.error-banner',
          duration_ms: 100,
          status: 'failed',
          message: 'Expected error message not displayed',
          screenshot: 'screenshots/failure-banner.png',
        },
      ],
      screenshots: ['screenshots/failure-banner.png'],
    });

    const result = validator.validateExecutionResult(payload);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.data?.cases[1]?.failure_type).toBe('assertion_failed');
  });

  it('debe soportar casos con not_run y not_run_reason cuando depende de un paso previo', () => {
    const payload = createBaseValidPayload();
    payload.result = 'partial';
    payload.summary.not_run = 1;
    payload.cases.push({
      id: 'TC-AUTH-003',
      title: 'Acceso a perfil autenticado',
      result: 'not_run',
      failure_type: null,
      not_run_reason: 'Dependencia fallida: TC-AUTH-002 no completó inicio de sesión',
    });

    const result = validator.validateExecutionResult(payload);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.data?.cases[1]?.result).toBe('not_run');
    expect(result.data?.cases[1]?.not_run_reason).toContain('Dependencia fallida');
  });

  it('debe validar la taxonomía de fallos permitida en failure_type', () => {
    const validFailureTypes: FailureType[] = [
      'assertion_failed',
      'execution_timeout',
      'selector_not_found',
      'network_error',
      'auth_failed',
    ];

    for (const failureType of validFailureTypes) {
      const payload = createBaseValidPayload();
      payload.result = 'failed';
      const firstCase = payload.cases[0];
      if (firstCase) {
        firstCase.result = 'failed';
        firstCase.failure_type = failureType;
      }

      const result = validator.validateExecutionResult(payload);
      expect(result.valid).toBe(true);
    }
  });

  it('debe rechazar failure_type no contemplado en la taxonomía estricta', () => {
    const payload = createBaseValidPayload();
    const firstCase = payload.cases[0];
    if (firstCase) {
      (firstCase as unknown as Record<string, unknown>)['failure_type'] = 'tipo_desconocido_invalido';
    }

    const result = validator.validateExecutionResult(payload);
    expect(result.valid).toBe(false);
  });
});
