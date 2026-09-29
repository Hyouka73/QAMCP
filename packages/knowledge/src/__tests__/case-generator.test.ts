import { describe, it, expect } from 'vitest';

import { CaseGenerator, generateDeterministicUuid } from '../plan/case-generator.js';

describe('Suite S6-002: CaseGenerator y UUID Determinista', () => {
  it('debe generar un UUID determinista v4 consistente con la misma semilla', () => {
    const seed = 'auth:login-exitoso';
    const uuid1 = generateDeterministicUuid(seed);
    const uuid2 = generateDeterministicUuid(seed);

    expect(uuid1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-a[0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(uuid1).toBe(uuid2);
  });

  it('debe generar UUIDs distintos para semillas diferentes', () => {
    const uuid1 = generateDeterministicUuid('auth:login');
    const uuid2 = generateDeterministicUuid('auth:register');

    expect(uuid1).not.toBe(uuid2);
  });

  it('debe construir la estructura básica de TCCase usando CaseGenerator.generateCase', () => {
    const testCase = CaseGenerator.generateCase({
      moduleName: 'auth',
      caseName: 'recuperar-password',
    });

    const expectedUuid = generateDeterministicUuid('auth:recuperar-password');

    expect(testCase.id).toBe(expectedUuid);
    expect(testCase.name).toBe('recuperar-password');
    expect(testCase.tags).toContain('auth');
    expect(testCase.steps.length).toBeGreaterThan(0);
  });
});