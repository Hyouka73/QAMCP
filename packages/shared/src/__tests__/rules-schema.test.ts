import { describe, it, expect } from 'vitest';

import { SchemaValidator } from '../validator/schema-validator.js';

describe('T1: rules.schema.json (rules.schema)', () => {
  const validator = new SchemaValidator();

  it('un rules.yaml legacy (solo _version, manually_edited, rules con id/description) valida', () => {
    const legacyRules = {
      _version: '1',
      manually_edited: false,
      rules: [
        {
          id: 'R-001',
          description: 'Regla de negocio legacy',
        },
      ],
    };

    const res = validator.validateRules(legacyRules);
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('los campos nuevos validan correctamente (category, status, source, view, field, evidence, category_waivers)', () => {
    const modernRules = {
      _version: '1',
      manually_edited: false,
      rules: [
        {
          id: 'login.email.campo',
          description: 'El campo de correo electrónico debe ser válido',
          category: 'campo',
          status: 'confirmed',
          source: 'user',
          view: 'login',
          field: 'input[name="email"]',
          evidence: '#login-form input[type="email"]',
          severity: 'high',
          tags: ['auth', 'validation'],
        },
      ],
      category_waivers: [
        {
          view: 'login',
          category: 'sensibilidad',
          reason: 'No procesa datos bancarios ni sensibles',
        },
      ],
    };

    const res = validator.validateRules(modernRules);
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('category inválido se rechaza', () => {
    const invalidCategory = {
      _version: '1',
      manually_edited: false,
      rules: [
        {
          id: 'R-001',
          description: 'Regla con categoría inválida',
          category: 'categoria_inexistente',
        },
      ],
    };

    const res = validator.validateRules(invalidCategory);
    expect(res.valid).toBe(false);
    expect(res.errors.length).toBeGreaterThan(0);
  });

  it('status inválido se rechaza', () => {
    const invalidStatus = {
      _version: '1',
      manually_edited: false,
      rules: [
        {
          id: 'R-001',
          description: 'Regla con estado inválido',
          status: 'status_desconocido',
        },
      ],
    };

    const res = validator.validateRules(invalidStatus);
    expect(res.valid).toBe(false);
    expect(res.errors.length).toBeGreaterThan(0);
  });

  it('source inválido se rechaza', () => {
    const invalidSource = {
      _version: '1',
      manually_edited: false,
      rules: [
        {
          id: 'R-001',
          description: 'Regla con fuente inválida',
          source: 'fuente_invalida',
        },
      ],
    };

    const res = validator.validateRules(invalidSource);
    expect(res.valid).toBe(false);
    expect(res.errors.length).toBeGreaterThan(0);
  });

  it('category_waivers exige view, category y reason no vacío', () => {
    // Falta reason
    const missingReason = {
      _version: '1',
      manually_edited: false,
      rules: [],
      category_waivers: [
        {
          view: 'login',
          category: 'sensibilidad',
        },
      ],
    };
    expect(validator.validateRules(missingReason).valid).toBe(false);

    // Reason vacío (minLength: 1)
    const emptyReason = {
      _version: '1',
      manually_edited: false,
      rules: [],
      category_waivers: [
        {
          view: 'login',
          category: 'sensibilidad',
          reason: '',
        },
      ],
    };
    expect(validator.validateRules(emptyReason).valid).toBe(false);

    // Falta view
    const missingView = {
      _version: '1',
      manually_edited: false,
      rules: [],
      category_waivers: [
        {
          category: 'sensibilidad',
          reason: 'Valido pero sin view',
        },
      ],
    };
    expect(validator.validateRules(missingView).valid).toBe(false);

    // Falta category
    const missingCategory = {
      _version: '1',
      manually_edited: false,
      rules: [],
      category_waivers: [
        {
          view: 'login',
          reason: 'Valido pero sin category',
        },
      ],
    };
    expect(validator.validateRules(missingCategory).valid).toBe(false);
  });
});
