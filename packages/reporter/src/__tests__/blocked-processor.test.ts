import { describe, expect, it } from 'vitest';
import type { CapabilityDefinition } from '@qap/knowledge';

import { processBlockedSteps } from '../postprocessor/blocked-processor.js';
import type { StepResult } from '../types.js';

describe('Post-procesador de Estado blocked (QAP v3.0 Regla 3)', () => {
  const capabilities: CapabilityDefinition[] = [
    {
      id: 'auth.login.submit',
      name: 'Submit Login',
      type: 'ui-interaction',
      moduleId: 'auth',
      prerequisiteGroups: [],
      emits: [{ key: 'auth.token', description: 'JWT Token' }],
    },
    {
      id: 'auth.mfa.verify',
      name: 'Verify MFA',
      type: 'ui-interaction',
      moduleId: 'auth',
      prerequisiteGroups: [
        {
          mode: 'ALL',
          requirements: [{ capabilityId: 'auth.login.submit' }],
        },
      ],
      emits: [{ key: 'auth.session', description: 'Session active' }],
    },
    {
      id: 'dashboard.view',
      name: 'View Dashboard',
      type: 'ui-interaction',
      moduleId: 'dashboard',
      prerequisiteGroups: [
        {
          mode: 'ALL',
          requirements: [{ capabilityId: 'auth.mfa.verify' }],
        },
      ],
      emits: [],
    },
  ];

  it('marca como blocked al paso dependiente cuyo upstream falló (Checklist Gate)', () => {
    const rawSteps: StepResult[] = [
      {
        stepIndex: 0,
        capabilityId: 'auth.login.submit',
        status: 'failed',
        durationMs: 120,
        timestamp: '2026-09-22T10:00:00Z',
        assertions: [{ statement: 'Login HTTP 200', passed: false }],
      },
      {
        stepIndex: 1,
        capabilityId: 'auth.mfa.verify',
        status: 'skipped', // El runner reportó skipped por fallo anterior
        durationMs: 0,
        timestamp: '2026-09-22T10:00:01Z',
        assertions: [],
      },
      {
        stepIndex: 2,
        capabilityId: 'dashboard.view',
        status: 'skipped',
        durationMs: 0,
        timestamp: '2026-09-22T10:00:02Z',
        assertions: [],
      },
    ];

    const processed = processBlockedSteps(rawSteps, capabilities);

    // auth.login.submit permanece 'failed'
    expect(processed[0].status).toBe('failed');

    // auth.mfa.verify debe ser transformado a 'blocked' (no skipped ni passed)
    expect(processed[1].status).toBe('blocked');

    // dashboard.view también debe quedar 'blocked' por fallo en cascada
    expect(processed[2].status).toBe('blocked');
  });

  it('mantiene el estado original (passed) si los upstream pasaron exitosamente', () => {
    const rawSteps: StepResult[] = [
      {
        stepIndex: 0,
        capabilityId: 'auth.login.submit',
        status: 'passed',
        durationMs: 100,
        timestamp: '2026-09-22T10:00:00Z',
        assertions: [{ statement: 'Login HTTP 200', passed: true }],
      },
      {
        stepIndex: 1,
        capabilityId: 'auth.mfa.verify',
        status: 'passed',
        durationMs: 80,
        timestamp: '2026-09-22T10:00:01Z',
        assertions: [{ statement: 'MFA Valid', passed: true }],
      },
      {
        stepIndex: 2,
        capabilityId: 'dashboard.view',
        status: 'passed',
        durationMs: 50,
        timestamp: '2026-09-22T10:00:02Z',
        assertions: [],
      },
    ];

    const processed = processBlockedSteps(rawSteps, capabilities);

    expect(processed[0].status).toBe('passed');
    expect(processed[1].status).toBe('passed');
    expect(processed[2].status).toBe('passed');
  });
});
