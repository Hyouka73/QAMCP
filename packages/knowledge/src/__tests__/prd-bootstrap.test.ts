import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import {
  parsePrdContent,
  buildModuleContext,
  buildRepoMap,
  bootstrapModule,
} from '../prd/bootstrap.js';
import { FileSystemStorage } from '../storage/file-storage.js';

describe('PRD Bootstrap (S4-005)', () => {
  let tempDir: string;
  let storage: FileSystemStorage;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'qap-prd-test-'));
    storage = new FileSystemStorage({ rootDir: tempDir });
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('parsePrdContent', () => {
    it('debe parsear un documento Markdown con secciones en español', () => {
      const markdown = `
# PRD: Módulo de Simulación de Préstamo

## Objetivo
Permitir al usuario simular un préstamo calculando cuotas y tasas de interés.

## Usuarios
- Cliente no registrado
- Cliente autenticado
- Asesor de crédito

## Rutas
- /simulation
- /simulation/results

## Riesgos
- Monto fuera de rango no siempre muestra error claro.
- Transición animada puede causar race condition con el runner.

## Notas
El módulo tiene dos vistas: formulario inicial y panel de resultados.

## Selectores Sensibles
- #user-balance
- #account-number
`;

      const parsed = parsePrdContent(markdown, 'https://notion.so/empresa/simulacion');

      expect(parsed.objective).toBe('Permitir al usuario simular un préstamo calculando cuotas y tasas de interés.');
      expect(parsed.users).toEqual(['Cliente no registrado', 'Cliente autenticado', 'Asesor de crédito']);
      expect(parsed.routes).toEqual(['/simulation', '/simulation/results']);
      expect(parsed.risks).toHaveLength(2);
      expect(parsed.notes).toContain('El módulo tiene dos vistas');
      expect(parsed.sensitive_selectors).toEqual(['#user-balance', '#account-number']);
      expect(parsed.prd_source).toBe('https://notion.so/empresa/simulacion');
    });

    it('debe parsear un documento con encabezados en inglés', () => {
      const markdown = `
# Checkout Module Spec

## Goal
Process payments securely and provide receipt to users.

## Users
* Guest user
* Registered customer

## Routes
* /checkout/payment
* /checkout/confirmation

## Risks
* Gateway timeout on slow network
`;

      const parsed = parsePrdContent(markdown);
      expect(parsed.objective).toBe('Process payments securely and provide receipt to users.');
      expect(parsed.users).toEqual(['Guest user', 'Registered customer']);
      expect(parsed.routes).toEqual(['/checkout/payment', '/checkout/confirmation']);
      expect(parsed.risks).toEqual(['Gateway timeout on slow network']);
    });
  });

  describe('buildModuleContext', () => {
    it('debe generar un esqueleto de ModuleContext válido con manually_edited: false', () => {
      const context = buildModuleContext('checkout', {
        objective: 'Completar compra',
        users: ['cliente'],
        routes: ['/checkout'],
        prdSource: 'https://wiki.miapp.com/checkout',
      });

      expect(context._version).toBe('1');
      expect(context.manually_edited).toBe(false);
      expect(context.objective).toBe('Completar compra');
      expect(context.users).toEqual(['cliente']);
      expect(context.routes).toEqual(['/checkout']);
      expect(context.prd_source).toBe('https://wiki.miapp.com/checkout');
    });

    it('debe usar fallback si no se especifican campos', () => {
      const context = buildModuleContext('auth');
      expect(context._version).toBe('1');
      expect(context.manually_edited).toBe(false);
      expect(context.objective).toBe('Módulo auth');
      expect(context.users).toEqual([]);
      expect(context.routes).toEqual([]);
    });
  });

  describe('buildRepoMap', () => {
    it('debe generar RepoMap con _version: "1" y rutas normalizadas a POSIX', () => {
      const windowsFiles = [
        'src\\modules\\checkout\\CheckoutPage.tsx',
        'src\\modules\\checkout\\services\\api.ts',
        'src/modules/checkout/utils.ts',
      ];

      const repoMap = buildRepoMap('checkout', windowsFiles);

      expect(repoMap._version).toBe('1');
      expect(repoMap.module).toBe('checkout');
      expect(repoMap.files).toEqual([
        'src/modules/checkout/CheckoutPage.tsx',
        'src/modules/checkout/services/api.ts',
        'src/modules/checkout/utils.ts',
      ]);
    });
  });

  describe('bootstrapModule (persistencia)', () => {
    it('debe persistir context.yaml y repo-map.json en storage', async () => {
      const result = await bootstrapModule(storage, {
        moduleName: 'simulation',
        objective: 'Simular créditos',
        users: ['admin', 'cliente'],
        routes: ['/simulation'],
        sourceFiles: [
          'src\\pages\\simulation.tsx',
          'src\\services\\credit.ts',
        ],
        prdSource: 'docs/prd-simulation.md',
      });

      expect(result.context.manually_edited).toBe(false);
      expect(result.repoMap?.files).toEqual([
        'src/pages/simulation.tsx',
        'src/services/credit.ts',
      ]);

      // Verificar persistencia en disco mediante FileSystemStorage
      const savedContext = await storage.getModuleContext('simulation');
      expect(savedContext.objective).toBe('Simular créditos');
      expect(savedContext.manually_edited).toBe(false);
      expect(savedContext.prd_source).toBe('docs/prd-simulation.md');

      const savedRepoMap = await storage.getRepoMap('simulation');
      expect(savedRepoMap).not.toBeNull();
      expect(savedRepoMap?.module).toBe('simulation');
      expect(savedRepoMap?.files).toEqual([
        'src/pages/simulation.tsx',
        'src/services/credit.ts',
      ]);
    });
  });
});
