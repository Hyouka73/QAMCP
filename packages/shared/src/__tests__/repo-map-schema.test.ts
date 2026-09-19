import { describe, it, expect } from 'vitest';

import { normalizeToPosix } from '../utils/path-utils.js';
import { SchemaValidator } from '../validator/schema-validator.js';

describe('RepoMap Schema and POSIX Normalization (S4-005)', () => {
  const validator = new SchemaValidator();

  describe('Validación de module-repo-map.schema.json', () => {
    it('debe aceptar un repo-map válido con rutas POSIX', () => {
      const validRepoMap = {
        _version: '1',
        module: 'simulation',
        files: [
          'src/pages/simulation/index.tsx',
          'src/components/SimulationPanel.tsx',
          'src/hooks/useSimulation.ts',
        ],
      };

      const result = validator.validateRepoMap(validRepoMap);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.data).toEqual(validRepoMap);
    });

    it('debe aceptar un repo-map con lista vacía de archivos', () => {
      const emptyFilesRepoMap = {
        _version: '1',
        module: 'empty-module',
        files: [],
      };

      const result = validator.validateRepoMap(emptyFilesRepoMap);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('debe rechazar cuando falta _version', () => {
      const missingVersion = {
        module: 'simulation',
        files: ['src/index.ts'],
      };

      const result = validator.validateRepoMap(missingVersion);
      expect(result.valid).toBe(false);
      expect(result.errors.some((err) => err.rule === 'required' && err.message.includes('_version'))).toBe(true);
    });

    it('debe rechazar una versión distinta de "1" (const: "1")', () => {
      const invalidVersion = {
        _version: '2',
        module: 'simulation',
        files: ['src/index.ts'],
      };

      const result = validator.validateRepoMap(invalidVersion);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('debe rechazar cuando falta module', () => {
      const missingModule = {
        _version: '1',
        files: ['src/index.ts'],
      };

      const result = validator.validateRepoMap(missingModule);
      expect(result.valid).toBe(false);
      expect(result.errors.some((err) => err.rule === 'required' && err.message.includes('module'))).toBe(true);
    });

    it('debe rechazar cuando falta files', () => {
      const missingFiles = {
        _version: '1',
        module: 'simulation',
      };

      const result = validator.validateRepoMap(missingFiles);
      expect(result.valid).toBe(false);
      expect(result.errors.some((err) => err.rule === 'required' && err.message.includes('files'))).toBe(true);
    });

    it('debe rechazar propiedades adicionales (additionalProperties: false)', () => {
      const extraProperties = {
        _version: '1',
        module: 'simulation',
        files: ['src/index.ts'],
        extraField: 'not allowed',
      };

      const result = validator.validateRepoMap(extraProperties);
      expect(result.valid).toBe(false);
      expect(result.errors.some((err) => err.rule === 'additionalProperties')).toBe(true);
    });

    it('debe rechazar cuando files contiene elementos no string', () => {
      const invalidFileTypes = {
        _version: '1',
        module: 'simulation',
        files: [123, null],
      };

      const result = validator.validateRepoMap(invalidFileTypes);
      expect(result.valid).toBe(false);
      expect(result.errors.some((err) => err.rule === 'type')).toBe(true);
    });
  });

  describe('Función de normalización POSIX (normalizeToPosix)', () => {
    it('debe reemplazar barras invertidas de Windows por barras inclinadas POSIX', () => {
      const windowsPath = 'src\\components\\SimulationPanel.tsx';
      expect(normalizeToPosix(windowsPath)).toBe('src/components/SimulationPanel.tsx');
    });

    it('debe mantener inalteradas las rutas que ya son POSIX', () => {
      const posixPath = 'src/pages/simulation/index.tsx';
      expect(normalizeToPosix(posixPath)).toBe('src/pages/simulation/index.tsx');
    });

    it('debe manejar rutas complejas con mezcla de separadores', () => {
      const mixedPath = 'src\\modules/checkout\\components/Button.tsx';
      expect(normalizeToPosix(mixedPath)).toBe('src/modules/checkout/components/Button.tsx');
    });

    it('debe manejar rutas vacías o inválidas retornando cadena vacía', () => {
      expect(normalizeToPosix('')).toBe('');
      // @ts-expect-error probando valor no string
      expect(normalizeToPosix(null)).toBe('');
    });
  });
});
