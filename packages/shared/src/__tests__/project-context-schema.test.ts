import { describe, it, expect } from 'vitest';

import { SchemaValidator } from '../validator/schema-validator.js';
import type { ProjectContext } from '../types/project-context.type.js';

describe('project-context.schema.json (E1, Retrocompatibilidad y Evolución)', () => {
  const validator = new SchemaValidator();

  it('debe validar un context.yaml legacy sin campos de negocio opcionales', () => {
    const legacyContext = {
      _version: '1',
      project_name: 'legacy-project',
      description: 'Configuración base de QA para legacy-project',
      tech_stack: ['typescript', 'react'],
      base_url: 'http://localhost:3000',
      manually_edited: false,
    };

    const res = validator.validateProjectContext(legacyContext);
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('debe validar un context.yaml completo con campos de negocio y procedencia', () => {
    const fullContext: ProjectContext = {
      _version: '1',
      project_name: 'enterprise-app',
      description: 'Sistema empresarial',
      tech_stack: ['node', 'postgres'],
      base_url: 'https://staging.example.com',
      manually_edited: true,
      objective: 'Optimizar la gestión de pacientes y citas hospitalarias',
      objective_source: 'user',
      roles: [
        { name: 'doctor', description: 'Atiende consultas', source: 'prd' },
        { name: 'paciente', source: 'user' },
      ],
      critical_flows: [
        { name: 'agendar_cita', description: 'Reserva de turno médico', priority: 'high', source: 'prd' },
      ],
      source_of_truth: {
        type: 'prd',
        ref: 'docs/prd.md',
        declared: true,
        source: 'user',
      },
    };

    const res = validator.validateProjectContext(fullContext);
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('debe validar source_of_truth de tipo "none" con declared: true', () => {
    const contextWithNone: ProjectContext = {
      _version: '1',
      project_name: 'no-prd-project',
      source_of_truth: {
        type: 'none',
        declared: true,
        source: 'user',
      },
    };

    const res = validator.validateProjectContext(contextWithNone);
    expect(res.valid).toBe(true);
  });

  it('debe rechazar propiedades no permitidas por additionalProperties: false', () => {
    const invalidContext = {
      _version: '1',
      project_name: 'test',
      extra_unknown_field: 'not allowed',
    };

    const res = validator.validateProjectContext(invalidContext);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.rule === 'additionalProperties' || e.field.includes('extra_unknown_field'))).toBe(true);
  });

  it('debe rechazar si falta _version o project_name', () => {
    const missingVersion = {
      project_name: 'test',
    };
    expect(validator.validateProjectContext(missingVersion).valid).toBe(false);

    const missingName = {
      _version: '1',
    };
    expect(validator.validateProjectContext(missingName).valid).toBe(false);
  });

  it('debe rechazar valores de source inválidos', () => {
    const invalidSource = {
      _version: '1',
      project_name: 'test',
      objective: 'Texto de prueba de más de veinte caracteres',
      objective_source: 'invented-source',
    };

    const res = validator.validateProjectContext(invalidSource);
    expect(res.valid).toBe(false);
  });
});
