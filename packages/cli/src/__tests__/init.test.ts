import { existsSync, mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import YAML from 'yaml';

import { handleInitCommand } from '../commands/init.js';

describe('Suite de Comandos CLI Init', () => {
  let tempDir: string;
  let originalCwd: () => string;
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'qap-init-test-'));
    originalCwd = process.cwd;
    process.cwd = () => tempDir;

    exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`PROCESS_EXIT_${code}`);
    }) as never);

       errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    process.cwd = originalCwd;
    rmSync(tempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  describe('Modo silencioso (--config)', () => {
    it('debe crear exclusivamente el arbol .qa/project, .qa/modules, .qa/cache y .qa/executions con una config valida', async () => {
      const configPath = join(tempDir, 'config.json');
      const validConfig = {
        _version: '1.0',
        projectName: 'mi-proyecto-qa',
        environments: ['local', 'staging'],
      };
      writeFileSync(configPath, JSON.stringify(validConfig), 'utf-8');

      await handleInitCommand({ config: configPath });

      expect(existsSync(join(tempDir, '.qa', 'project'))).toBe(true);
      expect(existsSync(join(tempDir, '.qa', 'modules'))).toBe(true);
      expect(existsSync(join(tempDir, '.qa', 'cache'))).toBe(true);
      expect(existsSync(join(tempDir, '.qa', 'executions'))).toBe(true);

      expect(existsSync(join(tempDir, '.qa', 'seeds'))).toBe(false);
      expect(existsSync(join(tempDir, '.qa', 'environments'))).toBe(false);
    });

    it('debe generar .qa/project/environments.yaml con la libreria yaml', async () => {
      const configPath = join(tempDir, 'config.json');
      writeFileSync(
        configPath,
        JSON.stringify({ _version: '1.0', projectName: 'proyecto-yaml' }),
        'utf-8'
      );

      await handleInitCommand({ config: configPath });

      const yamlPath = join(tempDir, '.qa', 'project', 'environments.yaml');
      expect(existsSync(yamlPath)).toBe(true);

      const parsedYaml = YAML.parse(readFileSync(yamlPath, 'utf-8'));
      expect(parsedYaml).toHaveProperty('authProfile');
      expect(parsedYaml).toHaveProperty('environments');

      expect(existsSync(join(tempDir, '.qa', 'config.json'))).toBe(false);
    });

    it('debe generar .qa/.gitignore ignorando exclusivamente executions/ y cache/', async () => {
      const configPath = join(tempDir, 'config.json');
      writeFileSync(
        configPath,
        JSON.stringify({ _version: '1.0', projectName: 'proyecto-gitignore' }),
        'utf-8'
      );

      await handleInitCommand({ config: configPath });

      const gitignorePath = join(tempDir, '.qa', '.gitignore');
      expect(existsSync(gitignorePath)).toBe(true);

      const content = readFileSync(gitignorePath, 'utf-8');
      expect(content).toContain('executions/');
      expect(content).toContain('cache/');
      expect(content).not.toContain('modules/');
      expect(content).not.toContain('project/');
    });

    it('debe abortar con codigo POSIX != 0 y NO tocar el filesystem si el JSON tiene propiedades adicionales', async () => {
      const configPath = join(tempDir, 'config.json');
      const corruptConfig = {
        _version: '1.0',
        projectName: 'proyecto-corrupto',
        propiedadNoPermitida: 'esto no deberia existir',
      };
      writeFileSync(configPath, JSON.stringify(corruptConfig), 'utf-8');

      await expect(handleInitCommand({ config: configPath })).rejects.toThrow(/PROCESS_EXIT_\d+/);

      expect(exitSpy).toHaveBeenCalled();
      const exitCode = exitSpy.mock.calls[0]?.[0];
      expect(exitCode).not.toBe(0);

      expect(existsSync(join(tempDir, '.qa'))).toBe(false);
    });

    it('debe abortar con codigo POSIX != 0 si un tipo de dato esta corrupto', async () => {
      const configPath = join(tempDir, 'config.json');
      const corruptConfig = {
        _version: '1.0',
        projectName: 12345,
      };
      writeFileSync(configPath, JSON.stringify(corruptConfig), 'utf-8');

      await expect(handleInitCommand({ config: configPath })).rejects.toThrow(/PROCESS_EXIT_\d+/);

      expect(exitSpy).toHaveBeenCalled();
      const exitCode = exitSpy.mock.calls[0]?.[0];
      expect(exitCode).not.toBe(0);
      expect(existsSync(join(tempDir, '.qa'))).toBe(false);
    });

    it('debe abortar con codigo POSIX != 0 si falta un campo requerido (_version)', async () => {
      const configPath = join(tempDir, 'config.json');
      writeFileSync(
        configPath,
        JSON.stringify({ projectName: 'sin-version' }),
        'utf-8'
      );

      await expect(handleInitCommand({ config: configPath })).rejects.toThrow(/PROCESS_EXIT_\d+/);

      expect(existsSync(join(tempDir, '.qa'))).toBe(false);
    });

    it('debe abortar con codigo POSIX != 0 si el archivo no existe', async () => {
      const nonExistentPath = join(tempDir, 'no-existe.json');

      await expect(
        handleInitCommand({ config: nonExistentPath })
      ).rejects.toThrow(/PROCESS_EXIT_\d+/);

      expect(errorSpy).toHaveBeenCalled();
      expect(existsSync(join(tempDir, '.qa'))).toBe(false);
    });

    it('debe abortar con codigo POSIX != 0 si el archivo no es un JSON valido', async () => {
      const configPath = join(tempDir, 'config.json');
      writeFileSync(configPath, '{ esto no es json valido', 'utf-8');

      await expect(handleInitCommand({ config: configPath })).rejects.toThrow(/PROCESS_EXIT_\d+/);

      expect(existsSync(join(tempDir, '.qa'))).toBe(false);
    });
  });

  describe('Detección de Playwright durante init', () => {
    it('debe advertir en consola si el proyecto destino NO tiene Playwright instalado', async () => {
      const configPath = join(tempDir, 'config.json');
      writeFileSync(
        configPath,
        JSON.stringify({ _version: '1.0', projectName: 'proyecto-sin-playwright' }),
        'utf-8'
      );

      // Simulamos el package.json del proyecto destino (sin Playwright)
      const targetPackageJsonPath = join(tempDir, 'package.json');
      writeFileSync(
        targetPackageJsonPath,
        JSON.stringify({ name: 'proyecto-destino', dependencies: {}, devDependencies: {} }),
        'utf-8'
      );

      await handleInitCommand({ config: configPath });

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Playwright no está instalado')
      );
    });

    it('NO debe advertir si el proyecto destino ya tiene @playwright/test instalado', async () => {
      const configPath = join(tempDir, 'config.json');
      writeFileSync(
        configPath,
        JSON.stringify({ _version: '1.0', projectName: 'proyecto-con-playwright' }),
        'utf-8'
      );

      // Simulamos el package.json del proyecto destino (CON Playwright)
      const targetPackageJsonPath = join(tempDir, 'package.json');
      writeFileSync(
        targetPackageJsonPath,
        JSON.stringify({
          name: 'proyecto-destino',
          dependencies: { '@playwright/test': '^1.48.0' },
          devDependencies: {},
        }),
        'utf-8'
      );

      await handleInitCommand({ config: configPath });

      expect(warnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Playwright no está instalado')
      );
    });
  });
});