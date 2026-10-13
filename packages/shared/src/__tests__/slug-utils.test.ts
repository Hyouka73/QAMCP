import { describe, it, expect } from 'vitest';

import { normalizeSlug } from '../utils/slug-utils.js';

describe('normalizeSlug - Utilidad canónica de slugs con transliteración NFD (C3)', () => {
  it('translitera diacríticos y tildes sin convertirlos en guion bajo', () => {
    const input = 'Asignación de ejecutivo de campo por carga';
    const output = normalizeSlug(input);
    expect(output).toBe('asignacion_de_ejecutivo_de_campo_por_carga');
    expect(output).not.toContain('asignaci_n');
  });

  it('preserva slugs válidos y cadenas alfanuméricas estándar', () => {
    expect(normalizeSlug('admin')).toBe('admin');
    expect(normalizeSlug('modulo_test')).toBe('modulo_test');
    expect(normalizeSlug('checkout-flow')).toBe('checkout-flow');
    expect(normalizeSlug('user123')).toBe('user123');
  });

  it('maneja múltiples diacríticos y caracteres especiales limpiamente', () => {
    expect(normalizeSlug('Operación & Gestión: Módulo #1')).toBe('operacion_gestion_modulo_1');
    expect(normalizeSlug('')).toBe('');
  });
});
