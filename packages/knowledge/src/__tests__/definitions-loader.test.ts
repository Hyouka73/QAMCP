import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import YAML from 'yaml';

import { validateDefinitions } from '../loader/definitions-loader.js';

describe('Loader y Validador de Definiciones Estáticas (.qa/definitions/)', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qap-defs-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('valida exitosamente módulos y flujos sintáctica y semánticamente correctos', () => {
    const modulesDir = path.join(tempDir, 'modules');
    const flowsDir = path.join(tempDir, 'flows');
    fs.mkdirSync(modulesDir, { recursive: true });
    fs.mkdirSync(flowsDir, { recursive: true });

    const authModule = {
      id: 'auth',
      name: 'Auth Module',
      category: 'core',
      capabilities: [
        {
          id: 'auth.login',
          name: 'Login',
          type: 'ui-interaction',
          moduleId: 'auth',
          prerequisiteGroups: [],
          emits: [{ key: 'auth.logged_in', description: 'User is authenticated' }],
        },
        {
          id: 'auth.mfa',
          name: 'MFA',
          type: 'ui-interaction',
          moduleId: 'auth',
          prerequisiteGroups: [
            {
              mode: 'ALL',
              requirements: [{ capabilityId: 'auth.login' }],
            },
          ],
          emits: [{ key: 'auth.mfa_passed', description: 'MFA verified' }],
        },
      ],
    };

    const loginFlow = {
      id: 'login-e2e',
      name: 'Login Flow',
      description: 'End to end login flow',
      tags: ['smoke'],
      steps: [
        { stepIndex: 0, capabilityId: 'auth.login' },
        { stepIndex: 1, capabilityId: 'auth.mfa' },
      ],
    };

    fs.writeFileSync(path.join(modulesDir, 'auth.yaml'), YAML.stringify(authModule));
    fs.writeFileSync(path.join(flowsDir, 'login.yaml'), YAML.stringify(loginFlow));

    const result = validateDefinitions(tempDir);
    expect(result.valid).toBe(true);
    expect(result.modules).toHaveLength(1);
    expect(result.flows).toHaveLength(1);
    expect(result.capabilities).toHaveLength(2);
    expect(result.errors).toHaveLength(0);
  });

  it('falla con mensajes descriptivos ante violaciones de JSON Schema', () => {
    const modulesDir = path.join(tempDir, 'modules');
    fs.mkdirSync(modulesDir, { recursive: true });

    // Módulo inválido: falta campo 'category' y type de capability es inválido
    const invalidModule = {
      id: 'broken',
      name: 'Broken Module',
      capabilities: [
        {
          id: 'broken.cap',
          name: 'Invalid Type',
          type: 'invalid-type-value',
          moduleId: 'broken',
          prerequisiteGroups: [],
          emits: [],
        },
      ],
    };

    fs.writeFileSync(path.join(modulesDir, 'broken.yaml'), YAML.stringify(invalidModule));

    const result = validateDefinitions(tempDir);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.includes('[Schema]'))).toBe(true);
  });

  it('detecta referencias a capacidades inexistentes tanto en requisitos como en flujos', () => {
    const modulesDir = path.join(tempDir, 'modules');
    const flowsDir = path.join(tempDir, 'flows');
    fs.mkdirSync(modulesDir, { recursive: true });
    fs.mkdirSync(flowsDir, { recursive: true });

    const mod = {
      id: 'payments',
      name: 'Payments',
      category: 'checkout',
      capabilities: [
        {
          id: 'pay.submit',
          name: 'Submit Payment',
          type: 'api-rest',
          moduleId: 'payments',
          prerequisiteGroups: [
            {
              mode: 'ALL',
              requirements: [{ capabilityId: 'non.existent.cap' }],
            },
          ],
          emits: [],
        },
      ],
    };

    const flow = {
      id: 'pay-flow',
      name: 'Pay Flow',
      description: 'Test flow',
      tags: ['test'],
      steps: [{ stepIndex: 0, capabilityId: 'phantom.cap' }],
    };

    fs.writeFileSync(path.join(modulesDir, 'payments.yaml'), YAML.stringify(mod));
    fs.writeFileSync(path.join(flowsDir, 'flow.yaml'), YAML.stringify(flow));

    const result = validateDefinitions(tempDir);
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) => e.includes("capacidad prerrequisito 'non.existent.cap' no existe"))
    ).toBe(true);
    expect(
      result.errors.some((e) => e.includes("referencia a capacidad inexistente 'phantom.cap'"))
    ).toBe(true);
  });

  it('detecta ciclos y formatea la traza al cargar definiciones', () => {
    const modulesDir = path.join(tempDir, 'modules');
    fs.mkdirSync(modulesDir, { recursive: true });

    const cyclicModule = {
      id: 'cyclic',
      name: 'Cyclic Module',
      category: 'test',
      capabilities: [
        {
          id: 'c.one',
          name: 'One',
          type: 'ui-interaction',
          moduleId: 'cyclic',
          prerequisiteGroups: [
            { mode: 'ALL', requirements: [{ capabilityId: 'c.two' }] },
          ],
          emits: [],
        },
        {
          id: 'c.two',
          name: 'Two',
          type: 'ui-interaction',
          moduleId: 'cyclic',
          prerequisiteGroups: [
            { mode: 'ALL', requirements: [{ capabilityId: 'c.one' }] },
          ],
          emits: [],
        },
      ],
    };

    fs.writeFileSync(path.join(modulesDir, 'cyclic.yaml'), YAML.stringify(cyclicModule));

    const result = validateDefinitions(tempDir);
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) => e.includes('Ciclo de dependencias detectado:'))
    ).toBe(true);
  });
});
