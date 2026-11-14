import {mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { SchemaValidator } from '@qap/shared';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import YAML from 'yaml';

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

        it('con --preview no escribe archivos', async () => {
        seedModule('checkout');

        await handlePlan('checkout', { preview: true });

        const planPath = join(tempDir, '.qa', 'modules', 'checkout', 'tests', 'plan.json');
        expect(existsSync(planPath)).toBe(false);
        expect(existsSync(join(tempDir, '.qa', 'modules', 'checkout', 'tests', 'cases'))).toBe(false);
    });

    it('genera el caso happy path en tests/cases/<slug>-<hash6>.yaml y lo lista en plan.json', async () => {
        seedModule('checkout');

        await handlePlan('checkout');

        const casesDir = join(tempDir, '.qa', 'modules', 'checkout', 'tests', 'cases');
        const files = readdirSync(casesDir);
        expect(files.length).toBeGreaterThanOrEqual(1);
        expect(files.every((file) => /^[a-z0-9_-]+-[a-f0-9]{6}\.yaml$/.test(file))).toBe(true);

        const plan = JSON.parse(readFileSync(join(tempDir, '.qa', 'modules', 'checkout', 'tests', 'plan.json'), 'utf8')) as {
            cases: string[];
        };
        expect(plan.cases.length).toBe(files.length);
    });

    it('conserva un caso con manually_edited: true al volver a planificar', async () => {
        seedModule('checkout');
        await handlePlan('checkout');

        const casesDir = join(tempDir, '.qa', 'modules', 'checkout', 'tests', 'cases');
        const file = readdirSync(casesDir)[0];
        const filePath = join(casesDir, file);
        writeFileSync(filePath, readFileSync(filePath, 'utf8') + 'manually_edited: true\nnotes: editado a mano\n');

        await handlePlan('checkout');

        expect(readFileSync(filePath, 'utf8')).toContain('editado a mano');
    });
        it('conserva un UUID como id dentro del archivo y el caso guardado valida en AJV', async () => {
        seedModule('checkout');

        await handlePlan('checkout');

        const casesDir = join(tempDir, '.qa', 'modules', 'checkout', 'tests', 'cases');
        const file = readdirSync(casesDir)[0];
        const saved = YAML.parse(readFileSync(join(casesDir, file), 'utf8')) as { id: string };

        expect(saved.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-a[0-9a-f]{3}-[0-9a-f]{12}$/);
        expect(new SchemaValidator().validateTcCase(saved).valid).toBe(true);
    });
});