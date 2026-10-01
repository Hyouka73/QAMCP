import {mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { handlePlan } from '../commands/plan.js';

describe('qap plan (S6-001)', () => {
    let originalCwd: string;
    let tempDir: string;

    beforeEach(() => {
    originalCwd = process.cwd();
    tempDir = mkdtempSync(join(tmpdir(), 'qap-plan-'));
    process.chdir(tempDir);
  });

    afterEach(() => {
        process.chdir(originalCwd);
        rmSync(tempDir, { recursive: true, force: true });
    });

    function seedModule (moduleName: string): void {
        const moduleDir = join(tempDir, '.qa', 'modules', moduleName);
        mkdirSync(moduleDir, { recursive: true });
        writeFileSync(
            join(moduleDir, 'context.yaml'),
            'objective: probar checkout\nroutes:\n  - /checkout\n  - /checkout/pay\nmanually_edited: false\n'
        );
        writeFileSync(
            join(moduleDir, 'selectors.json'),
            JSON.stringify({ selector: { payButton: '#pay'}})
        );
    }

    it('debe fallar con un mensaje claro si el modulo no existe', async () => {
        await expect(handlePlan('inexistente')).rejects.toThrow(/no existe en \.qa\/modules/);
    });

    it('debe generar tests/plan.json con un checksum SHA-256 valido', async () => {
        seedModule('checkout');

        await handlePlan('checkout');

        const planPath = join(tempDir, '.qa', 'modules', 'checkout', 'tests','plan.json');
        expect(existsSync(planPath)).toBe(true);

        const plan = JSON.parse(readFileSync(planPath, 'utf8')) as {
            module: string;
            checksum: string;
            algorithm: string;
        };

        expect(plan.module).toBe('checkout');
        expect(plan.checksum).toMatch(/^[a-f0-9]{64}$/);
        expect(plan.algorithm).toBe('sha256');
    });

        it('debe producir el mismo checksum si la configuracion no cambia (deteccion de obsolescencia)', async () => {
        seedModule('checkout');

        await handlePlan('checkout');
        const planPath = join(tempDir, '.qa', 'modules', 'checkout', 'tests', 'plan.json');
        const first = JSON.parse(readFileSync(planPath, 'utf-8')) as { checksum: string };

        await handlePlan('checkout');
        const second = JSON.parse(readFileSync(planPath, 'utf-8')) as { checksum: string };

        expect(first.checksum).toBe(second.checksum);
    });

    it ('debe producir un checksum distinto si cambian las rutas del modulo', async () => {
        seedModule('checkout');
        await handlePlan('checkout');
        const planPath = join(tempDir, '.qa', 'modules', 'checkout', 'tests', 'plan.json');
        const before = JSON.parse(readFileSync(planPath, 'utf-8')) as { checksum: string };

        writeFileSync(
            join(tempDir, '.qa', 'modules', 'checkout', 'context.yaml'),
            'objective: probar checkout\nroutes:\n  - /checkout\n  - /checkout/pay\n  - /checkout/confirm\nmanually_edited: false\n'
        );
        await handlePlan('checkout');
        const after = JSON.parse(readFileSync(planPath, 'utf-8')) as { checksum: string};

        expect(before.checksum).not.toBe(after.checksum);
    });
});