import { describe, expect, it } from 'vitest';

import { classifyError } from '../taxonomy';

describe('Taxonomía de Errores (S5-002)', () => {
    it ('debe clasificar selector_not_found', () => {
        const result = classifyError(new Error('element not found: #submit-btn'));
        expect (result.category).toBe('selector_not_found');
    });

    it('debe clasificar assertion_failed', () => {
        const result= classifyError(new Error('expected true but received false'));
        expect(result.category).toBe('assertion_failed');
    });

    it('debe clasificar execution_timeout', ()=>{
        const result= classifyError(new Error('timeout exceeded 30000ms'));
        expect(result.category).toBe('execution_timeout');
    });

    it('debe clasificar network_error', () => {
        const result = classifyError(new Error('network error: HTTP 500 Internal Server Error'));
        expect(result.category).toBe('network_error');
    });

    it('debe clasificar navigation_error', () => {
        const result = classifyError(new Error ('failed to navigate: net::ERR_CONNECTION_REFUSED'));
        expect(result.category).toBe('navigation_error');
    });

    it('debe clasificar como assertion_failed cuando el mensaje no coincide con ningun patron (fallback)', () => {
        const result = classifyError(new Error('un error totalmente inesperado sin patrón conocido'));
        expect(result.category).toBe('assertion_failed');
    });

    it('debe clasificar correctamente cuando el input es un string plano', () => {
        const result = classifyError('timeout exceeded while waiting for element');
        expect(result.category).toBe('execution_timeout');
    });

    it('debe manejar un input que no es Error ni string (objeto)', () => {
        const result = classifyError({ code: 500, reason: 'network failure' });
        expect(result.category).toBe('network_error');
        expect(result.message).toContain('network');
    });
});