import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import YAML from 'yaml';

import { loadGuardrails } from '../loader/guardrails-loader.js';
import { validateDefinitions } from '../loader/definitions-loader.js';

describe('Loader y Validador de Guardrails e Invariantes (.qa/definitions/guardrails/)', () => {
  let tempDir: string;
  let guardrailsDir: string;
  let modulesDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qap-guardrails-test-'));
    guardrailsDir = path.join(tempDir, 'guardrails');
    modulesDir = path.join(tempDir, 'modules');
    fs.mkdirSync(guardrailsDir, { recursive: true });
    fs.mkdirSync(modulesDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('carga exitosamente definiciones de guardrails válidas desde archivo YAML con envoltorio guardrails', () => {
    const yamlData = {
      _version: '1',
      guardrails: [
        {
          id: 'G-001',
          name: 'Autenticación Previa Obligatoria',
          category: 'security',
          severity: 'critical',
          description: 'Ningún usuario puede avanzar a flujos protegidos sin haber validado su sesión MFA.',
          rationale: 'Cumplimiento de estándar OWASP ASVS 4.0.',
          enforcedByCapabilities: ['auth.login.submit', 'auth.mfa.verify'],
          remediation: 'Revisar el flujo de redirección hacia /mfa-challenge antes de otorgar el JWT.',
          ownerSquad: 'identity',
        },
        {
          id: 'G-002',
          name: 'Inmutabilidad de Transacciones Confirmadas',
          category: 'financial-integrity',
          severity: 'high',
          description: 'Una vez emitido un evento de cobro autorizado, se prohíbe el reintento con el mismo token.',
          enforcedByCapabilities: ['billing.payment.submit'],
          remediation: 'Verificar que el gateway responda 409 Conflict.',
          ownerSquad: 'payments',
        },
      ],
    };

    fs.writeFileSync(path.join(guardrailsDir, 'auth-invariants.yaml'), YAML.stringify(yamlData));

    const result = loadGuardrails(guardrailsDir);
    expect(result.valid).toBe(true);
    expect(result.guardrails).toHaveLength(2);
    expect(result.guardrails[0]?.id).toBe('G-001');
    expect(result.guardrails[0]?.severity).toBe('critical');
    expect(result.guardrails[1]?.id).toBe('G-002');
    expect(result.guardrails[1]?.category).toBe('financial-integrity');
    expect(result.errors).toHaveLength(0);
  });

  it('falla con mensaje descriptivo si un guardrail incumple el JSON Schema (falta remediation o severidad inválida)', () => {
    const invalidYaml = {
      guardrails: [
        {
          id: 'G-BAD',
          name: 'Invalid Guardrail',
          category: 'security',
          severity: 'ultra-critical', // no pertenece al enum
          description: 'Missing remediation',
          enforcedByCapabilities: ['auth.login.submit'],
          ownerSquad: 'identity',
          // falta remediation
        },
      ],
    };

    fs.writeFileSync(path.join(guardrailsDir, 'invalid.yaml'), YAML.stringify(invalidYaml));

    const result = loadGuardrails(guardrailsDir);
    expect(result.valid).toBe(false);
    expect(result.guardrails).toHaveLength(0);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.includes('[Schema]'))).toBe(true);
  });

  it('detecta guardrails duplicados entre múltiples archivos y reporta el origen', () => {
    const g1 = {
      guardrails: [
        {
          id: 'G-DUP',
          name: 'First Instance',
          category: 'compliance',
          severity: 'medium',
          description: 'Valid invariant',
          enforcedByCapabilities: ['audit.log'],
          remediation: 'Verify logs',
          ownerSquad: 'secops',
        },
      ],
    };

    const g2 = {
      guardrails: [
        {
          id: 'G-DUP',
          name: 'Duplicate Instance',
          category: 'compliance',
          severity: 'medium',
          description: 'Duplicated invariant',
          enforcedByCapabilities: ['audit.log'],
          remediation: 'Verify logs',
          ownerSquad: 'secops',
        },
      ],
    };

    fs.writeFileSync(path.join(guardrailsDir, 'g1.yaml'), YAML.stringify(g1));
    fs.writeFileSync(path.join(guardrailsDir, 'g2.yaml'), YAML.stringify(g2));

    const result = loadGuardrails(guardrailsDir);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Guardrail duplicado: 'G-DUP'"))).toBe(true);
  });

  it('integra guardrails en validateDefinitions() y valida integridad referencial hacia capacidades', () => {
    const authModule = {
      id: 'auth',
      name: 'Auth Module',
      category: 'core',
      capabilities: [
        {
          id: 'auth.login.submit',
          name: 'Submit Login',
          type: 'ui-interaction',
          moduleId: 'auth',
          prerequisiteGroups: [],
          emits: [{ key: 'auth.session.active', description: 'Active session' }],
        },
      ],
    };

    const validGuardrail = {
      guardrails: [
        {
          id: 'G-001',
          name: 'Auth Invariant',
          category: 'security',
          severity: 'critical',
          description: 'Login required',
          enforcedByCapabilities: ['auth.login.submit'],
          remediation: 'Require login',
          ownerSquad: 'identity',
        },
      ],
    };

    fs.writeFileSync(path.join(modulesDir, 'auth.yaml'), YAML.stringify(authModule));
    fs.writeFileSync(path.join(guardrailsDir, 'auth.yaml'), YAML.stringify(validGuardrail));

    const result = validateDefinitions(tempDir);
    expect(result.valid).toBe(true);
    expect(result.modules).toHaveLength(1);
    expect(result.capabilities).toHaveLength(1);
    expect(result.guardrails).toHaveLength(1);
    expect(result.guardrails[0]?.id).toBe('G-001');
  });

  it('falla en validateDefinitions() si un guardrail apunta a una capacidad inexistente (integridad referencial rota)', () => {
    const authModule = {
      id: 'auth',
      name: 'Auth Module',
      category: 'core',
      capabilities: [
        {
          id: 'auth.login.submit',
          name: 'Submit Login',
          type: 'ui-interaction',
          moduleId: 'auth',
          prerequisiteGroups: [],
          emits: [],
        },
      ],
    };

    const brokenGuardrail = {
      guardrails: [
        {
          id: 'G-ORPHAN',
          name: 'Broken Invariant',
          category: 'security',
          severity: 'high',
          description: 'Points to non-existent capability',
          enforcedByCapabilities: ['auth.login.submit', 'auth.phantom.capability'],
          remediation: 'Fix capability mapping',
          ownerSquad: 'identity',
        },
      ],
    };

    fs.writeFileSync(path.join(modulesDir, 'auth.yaml'), YAML.stringify(authModule));
    fs.writeFileSync(path.join(guardrailsDir, 'broken.yaml'), YAML.stringify(brokenGuardrail));

    const result = validateDefinitions(tempDir);
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) =>
        e.includes("referencia a capacidad inexistente 'auth.phantom.capability' en enforcedByCapabilities")
      )
    ).toBe(true);
  });
});
