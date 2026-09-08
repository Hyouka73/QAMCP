import { rmSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { SessionStore, type StorageState } from '../session-store.js';

describe('SessionStore (S2-006)', () => {
    const testCacheDir = join(process.cwd(), '.qa', 'cache', 'test-sessions');
    let store: SessionStore;

    const validState: StorageState = {
        cookies: [
            {
        name: 'session_id',
        value: 'abc-123-xyz',
        domain: 'localhost',
        path: '/',
        expires: Date.now() / 1000 + 3600,
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      },
    ],
    origins: [],
    };

    beforeEach (() => {
        store = new SessionStore(testCacheDir);
    });

    afterEach(() => {
    if (existsSync(testCacheDir)) {
        rmSync(testCacheDir, { recursive: true, force: true});
    }
    });

    it('debe guardar la sesion cifrada en reposo con IV Y Auth-Tag', () =>{
        store.saveSession('perfil-test', validState);

        const filePath = join(testCacheDir, 'perfil-test.json');
        expect(existsSync(filePath)).toBe(true);

        const raw = JSON.parse(readFileSync(filePath, 'utf8'));
        expect(raw).toHaveProperty('iv');
        expect(raw).toHaveProperty('authTag');
        expect(raw).toHaveProperty('data');
        expect(raw).not.toContain('session_id');
    });

    it('debe restaurar una sesion valida en cache evitando re-autenticacion', () => {
        store.saveSession('perfil-test', validState);
        const restored = store.getValidSession('perfil-test');

        expect(restored).not.toBeNull();
        expect(restored?.cookies[0].value).toBe('abc-123-xyz');
    });

    it('debe devolver null si no existe sesion en cache para el perfil', () => {
        const restored = store.getValidSession('perfil-inexistente');
        expect(restored).toBeNull();
    });

    it('debe descartar una sesion expirada y no reutilizarla', () => {
        const expiredState: StorageState = {
            cookies: [
                {
                    name: 'session_id',
                    value: 'expired-token',
                    domain: 'localhost',
                    path: '/',
                    expires: Date.now() / 1000 - 3600,
                    httpOnly: true,
                    secure: false,
                    sameSite: 'Lax',
                },
            ],
            origins: [],
        };

        store.saveSession('perfil-expirado', expiredState);
        const restored = store.getValidSession('perfil-expirado');

        expect(restored).toBeNull();
        expect(existsSync(join(testCacheDir, 'perfil-expirado.json'))).toBe(false);
    });
});