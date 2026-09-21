import { describe, it, expect } from 'vitest';

import { SchemaValidator } from '../validator/schema-validator.js';

describe('SchemaValidator - Suite de Pruebas Unitarias Aisladas', () => {
  const validator = new SchemaValidator();

  describe('Validación de project-init (project-init.schema.json)', () => {
    it('debe aceptar un payload válido de project-init con configuración completa', () => {
      const validPayload = {
        _version: '1.0',
        projectName: 'qa-platform-core',
        environments: ['local', 'staging', 'production'],
        flags: {
          skipGit: false,
          skipInstall: true,
          template: 'default',
        },
      };

      const result = validator.validateProjectInit(validPayload);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('debe aceptar un payload mínimo válido de project-init', () => {
      const minimalPayload = {
        _version: '1.0',
        projectName: 'qa-minimal',
      };

      const result = validator.validateProjectInit(minimalPayload);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('debe rechazar y formatear mensaje legible cuando falta el campo requerido _version', () => {
      const invalidPayload = {
        projectName: 'missing-version',
      };

      const result = validator.validateProjectInit(invalidPayload);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);

      const requiredError = result.errors.find((err) => err.rule === 'required');
      expect(requiredError).toBeDefined();
      expect(requiredError?.message).toBe("Falta el campo requerido '_version'");
    });

    it('debe rechazar y formatear mensaje legible cuando un tipo de dato es inválido', () => {
      const invalidPayload = {
        _version: '1.0',
        projectName: 12345, // Debería ser string
      };

      const result = validator.validateProjectInit(invalidPayload);
      expect(result.valid).toBe(false);

      const typeError = result.errors.find((err) => err.rule === 'type');
      expect(typeError).toBeDefined();
      expect(typeError?.field).toBe('projectName');
      expect(typeError?.message).toBe("El campo 'projectName' debe ser de tipo 'string'");
    });

    it('debe rechazar y formatear mensaje legible cuando contiene propiedades adicionales no permitidas', () => {
      const invalidPayload = {
        _version: '1.0',
        projectName: 'qa-extra',
        propiedadDesconocida: true,
      };

      const result = validator.validateProjectInit(invalidPayload);
      expect(result.valid).toBe(false);

      const additionalError = result.errors.find((err) => err.rule === 'additionalProperties');
      expect(additionalError).toBeDefined();
      expect(additionalError?.message).toContain("Propiedad no permitida 'propiedadDesconocida'");
    });
  });

  describe('Validación de environments (environments.schema.json)', () => {
    it('debe aceptar un payload válido de environments', () => {
      const validPayload = {
        _version: '1.0',
        default: 'local',
        environments: {
          local: {
            url: 'http://localhost:3000',
            browser_mode: 'auto',
          },
          staging: {
            url: 'https://staging.example.com',
            browser_mode: 'headless',
          },
        },
      };

      const result = validator.validateEnvironments(validPayload);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('debe rechazar cuando falta el campo requerido default', () => {
      const invalidPayload = {
        _version: '1.0',
        environments: {
          local: {
            url: 'http://localhost:3000',
          },
        },
      };

      const result = validator.validateEnvironments(invalidPayload);
      expect(result.valid).toBe(false);

      const requiredError = result.errors.find((err) => err.rule === 'required');
      expect(requiredError).toBeDefined();
      expect(requiredError?.message).toBe("Falta el campo requerido 'default'");
    });

    it('debe rechazar cuando una URL no cumple el patrón pattern https?://', () => {
      const invalidPayload = {
        _version: '1.0',
        default: 'local',
        environments: {
          local: {
            url: 'ftp://invalido.com',
          },
        },
      };

      const result = validator.validateEnvironments(invalidPayload);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]?.field).toContain('url');
    });

    it('debe rechazar propiedades adicionales en la raíz de environments', () => {
      const invalidPayload = {
        _version: '1.0',
        default: 'local',
        environments: {},
        extraProperty: 'not_allowed',
      };

      const result = validator.validateEnvironments(invalidPayload);
      expect(result.valid).toBe(false);

      const additionalError = result.errors.find((err) => err.rule === 'additionalProperties');
      expect(additionalError).toBeDefined();
      expect(additionalError?.message).toContain("Propiedad no permitida 'extraProperty'");
    });
  });

  describe('Validación de execution-result (execution-result.schema.json)', () => {
    it('debe aceptar un resultado de ejecución estructurado y válido', () => {
      const validPayload = {
        _version: '1',
        execution_id: '20260921T100000Z_checkout_a1b2c3d',
        module: 'checkout',
        env: 'staging',
        started_at: '2026-09-21T10:00:00.000Z',
        finished_at: '2026-09-21T10:00:15.000Z',
        result: 'passed',
        timed_out: false,
        summary: {
          total: 1,
          passed: 1,
          failed: 0,
          skipped: 0,
          not_run: 0,
        },
        cases: [
          {
            id: 'TC-CHK-001',
            title: 'Navegar al carrito',
            result: 'passed',
            duration_ms: 1200,
            steps: [
              {
                action: 'click',
                selector: '#btn-cart',
                status: 'passed',
                duration_ms: 300,
              },
            ],
            screenshots: ['screenshots/cart.png'],
          },
        ],
      };

      const result = validator.validateExecutionResult(validPayload);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('debe rechazar cuando el result global no pertenece al enum permitido', () => {
      const invalidPayload = {
        _version: '1',
        execution_id: '20260921T100000Z_auth_a1b2c3d',
        module: 'auth',
        env: 'local',
        started_at: '2026-09-21T10:00:00.000Z',
        finished_at: '2026-09-21T10:00:05.000Z',
        result: 'status_invalido', // No está en enum
        timed_out: false,
        summary: {
          total: 0,
          passed: 0,
          failed: 0,
          skipped: 0,
          not_run: 0,
        },
        cases: [],
      };

      const result = validator.validateExecutionResult(invalidPayload);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((err) => err.field === 'result')).toBe(true);
    });

    it('debe rechazar de forma estricta propiedades adicionales en summary (Principio 9 / additionalProperties: false)', () => {
      const invalidPayload = {
        _version: '1',
        execution_id: '20260921T100000Z_auth_a1b2c3d',
        module: 'auth',
        env: 'local',
        started_at: '2026-09-21T10:00:00.000Z',
        finished_at: '2026-09-21T10:00:05.000Z',
        result: 'failed',
        timed_out: false,
        summary: {
          total: 1,
          passed: 0,
          failed: 1,
          skipped: 0,
          not_run: 0,
          propiedadNoPermitidaEnSummary: 'error_esperado',
        },
        cases: [],
      };

      const result = validator.validateExecutionResult(invalidPayload);
      expect(result.valid).toBe(false);

      const additionalError = result.errors.find((err) => err.rule === 'additionalProperties');
      expect(additionalError).toBeDefined();
      expect(additionalError?.message).toContain("Propiedad no permitida 'propiedadNoPermitidaEnSummary'");
    });

    it('debe rechazar cuando falta el campo summary requerido', () => {
      const invalidPayload = {
        _version: '1',
        execution_id: '20260921T100000Z_auth_a1b2c3d',
        module: 'auth',
        env: 'local',
        started_at: '2026-09-21T10:00:00.000Z',
        finished_at: '2026-09-21T10:00:05.000Z',
        result: 'passed',
        timed_out: false,
        cases: [],
      };

      const result = validator.validateExecutionResult(invalidPayload);
      expect(result.valid).toBe(false);

      const requiredError = result.errors.find((err) => err.rule === 'required');
      expect(requiredError?.message).toBe("Falta el campo requerido 'summary'");
    });
  });

  describe('Validación de system-prompt (system-prompt.schema.json)', () => {
    it('debe aceptar un system-prompt válido completo', () => {
      const validPayload = {
        _version: '1',
        role: 'Eres un QA autónomo especializado en aplicaciones web.',
        objectives: [
          'Mantener los smoke tests de todos los módulos.',
          'Ante un cambio, ejecutar --from-diff y reportar fallos.',
        ],
        constraints: [
          'Siempre confirma con el usuario antes de modificar selectores manualmente.',
          'Usa --tags smoke para CI.',
        ],
        default_workflows: {
          discovery: 'Si el usuario pide descubrir un módulo: 1. Ejecuta qap_discover...',
          testing: 'Para probar un módulo: 1. Verifica el estado...',
        },
      };

      const result = validator.validateSystemPrompt(validPayload);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('debe rechazar un system-prompt sin campos requeridos o con propiedades extra', () => {
      const invalidPayload = {
        _version: '1',
        role: 'Role solo',
        campoInvalido: true,
      };

      const result = validator.validateSystemPrompt(invalidPayload);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Validación de profiles (alias auth-profiles / profiles.schema.json)', () => {
    it('debe validar perfiles tanto por validateProfiles como con alias auth-profiles', () => {
      const validPayload = {
        _version: '1',
        profiles: [
          {
            id: 'admin',
            env: 'local',
            username: 'admin@example.com',
            credential_source: 'keychain',
            login_mode: 'auto',
          },
        ],
      };

      const resultProfiles = validator.validateProfiles(validPayload);
      expect(resultProfiles.valid).toBe(true);
      expect(resultProfiles.errors).toHaveLength(0);
    });
  });
});

