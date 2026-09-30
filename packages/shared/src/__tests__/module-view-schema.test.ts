import { describe, it, expect } from 'vitest';

import type { ModuleViewData } from '../types/module-view.type.js';
import { SchemaValidator } from '../validator/schema-validator.js';

describe('module-view.schema.json', () => {
  const validator = new SchemaValidator();

  const validView: ModuleViewData = {
    _version: '1',
    view_name: 'default',
    description: 'Vista inicial de autenticación',
    path: '/login',
    current_url: 'http://localhost:3000/login',
    tags: ['auth', 'public'],
    is_auth_view: true,
    session_saved: false,
    storage_state_used: false,
    playwright_used: true,
    playwright_error: null,
    discovered_at: '2026-09-30T12:00:00.000Z',
    page_title: 'Login - Mi App',
    routes_found: ['/dashboard', '/recover'],
  };

  it('debe validar un contexto de vista válido con todos sus 14 campos', () => {
    const res = validator.validateModuleView(validView);
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('debe permitir playwright_error como string cuando ocurre un error', () => {
    const withError = {
      ...validView,
      playwright_used: false,
      playwright_error: 'Connection refused',
    };
    const res = validator.validateModuleView(withError);
    expect(res.valid).toBe(true);
  });

  it('debe rechazar propiedades adicionales por additionalProperties: false', () => {
    const extra = {
      ...validView,
      unexpected_field: 123,
    };
    const res = validator.validateModuleView(extra);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.field.includes('unexpected_field') || e.rule === 'additionalProperties')).toBe(true);
  });

  it('E0 camino (a): debe validar camino de fallo de Playwright (playwright_used false, playwright_error con texto)', () => {
    const errorView: ModuleViewData = {
      ...validView,
      playwright_used: false,
      playwright_error: 'net::ERR_CONNECTION_REFUSED at http://localhost:3000',
    };
    const res = validator.validateModuleView(errorView);
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('E0 camino (b): debe validar vista de autenticación con session_saved true', () => {
    const authView: ModuleViewData = {
      ...validView,
      is_auth_view: true,
      session_saved: true,
      storage_state_used: true,
    };
    const res = validator.validateModuleView(authView);
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('E0 camino (c): debe validar vista con routes_found vacío', () => {
    const emptyRoutesView: ModuleViewData = {
      ...validView,
      routes_found: [],
    };
    const res = validator.validateModuleView(emptyRoutesView);
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });
});

