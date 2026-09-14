import { describe, it, expect } from 'vitest';

import { SemanticHasher } from '../hasher/semantic-hasher.js';

describe('SemanticHasher (S3-006)', () =>{
    const hasher = new SemanticHasher();

    it('debe ser determinista: el mismo input produce siempre el mismo hash', () => {
        const input = {
            routes: ['/login', '/dashboard'],
            selectors: { submitButton: '#submit', usernameField: '#username' },
        };
    const hash1 = hasher.computeHash(input);
    const hash2 = hasher.computeHash(input);
    const hash3 = hasher.computeHash(input);

    expect(hash1).toBe(hash2);
    expect(hash2).toBe(hash3);
    });

    it('debe ser idempotente ante distinto orden de claves en selectors', ()=>{
        const inputA = {
            routes: ['/login'],
            selectors: {usernameField: '#username', submitButton: '#submit'},
        };
        const inputB = {
            routes: ['/login'],
            selectors: {submitButton: '#submit', usernameField: '#username' },
        };

        expect(hasher.computeHash(inputA)).toBe(hasher.computeHash(inputB));
    });

    it('debe ser indempotente ante distinto orden en el array de routes', () => {
        const inputA = { routes: ['/login', '/dashboard'], selectors :{} };
        const inputB = { routes: ['/dashboard', '/login'], selectors : {} };

        expect(hasher.computeHash(inputA)).toBe(hasher.computeHash(inputB));
    });

    it('debe producir un hash SHA-256 valido (64 caracteres hexadecimales)', () => {
        const hash = hasher.computeHash({ routes: ['/X'], selectors: {a: '#a'}});
        expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('debe producir un hash distinto si cambia una ruta', () => {
        const before = hasher.computeHash({ routes: ['/login'], selectors: {} });
        const after = hasher.computeHash({ routes: ['/signup'], selectors: {} });

        expect(before).not.toBe(after);
    });

    it('debe gemerar un objeto SemanticHash completo con generate()', () =>{
        const result = hasher.generate(
            { routes: ['/login'], selectors: { submit: '#submit'} },
            ['selectors.json', 'context.yaml']
        );

        expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
        expect(result.algorithm).toBe ('sha256');
        expect(result.computed_from).toEqual(['selectors.json', 'context.yaml']);
        expect(new Date(result.timestamp).toString()).not.toBe('Invalid Date');
    });

    it('hasChanged debe devolver true si no hay hash previo', () => {
        const changed = hasher.hasChanged({ routes: [], selectors: {} }, null);
        expect(changed).toBe(true);
    });

    it('hasChanged debe devolver false si el input no cambio respecto al hash previo', () => {
        const input = {routes: ['/login'], selectors: { submit: '#submit'} };
        const previous = hasher.generate(input);

        expect(hasher.hasChanged(input, previous)).toBe(false);
    });

    it('hasChanged debe devolver true si el input combio respecto al hash previo', () => {
        const original = { routes: ['/login'], selectors: { submit: '#submit'} };
        const previous = hasher.generate(original);

        const modified = { routes: ['/login'], selectors: { submit: '#submit-v2'} };

        expect(hasher.hasChanged(modified, previous)).toBe(true);
    });
});