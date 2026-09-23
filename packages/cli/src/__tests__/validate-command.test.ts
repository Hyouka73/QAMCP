import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import YAML from 'yaml';

import { handleValidate } from '../commands/validate.js';
import { DataError, ExitCode } from '../errors.js';

describe('Comando qap validate (QAP v3.0)', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qap-cli-validate-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('valida exitosamente definiciones correctas sin lanzar errores', async () => {
    const modulesDir = path.join(tempDir, 'modules');
    fs.mkdirSync(modulesDir, { recursive: true });

    const mod = {
      id: 'auth',
      name: 'Authentication',
      category: 'core',
      capabilities: [
        {
          id: 'auth.login',
          name: 'Login',
          type: 'ui-interaction',
          moduleId: 'auth',
          prerequisiteGroups: [],
          emits: [],
        },
      ],
    };
    fs.writeFileSync(path.join(modulesDir, 'auth.yaml'), YAML.stringify(mod));

    await expect(handleValidate(tempDir)).resolves.not.toThrow();
  });

  it('lanza DataError con exitCode 65 cuando el directorio no existe', async () => {
    const nonExistentPath = path.join(tempDir, 'does-not-exist');

    try {
      await handleValidate(nonExistentPath);
      expect.fail('Debería haber lanzado DataError');
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(DataError);
      const dataErr = err as DataError;
      expect(dataErr.exitCode).toBe(ExitCode.DATA_ERROR);
      expect(dataErr.message).toContain('El directorio de definiciones no existe');
    }
  });

  it('lanza DataError con código != 0 y mensaje descriptivo ante ciclos en las definiciones', async () => {
    const modulesDir = path.join(tempDir, 'modules');
    fs.mkdirSync(modulesDir, { recursive: true });

    const cyclicModule = {
      id: 'loop',
      name: 'Loop Module',
      category: 'test',
      capabilities: [
        {
          id: 'a',
          name: 'A',
          type: 'ui-interaction',
          moduleId: 'loop',
          prerequisiteGroups: [{ mode: 'ALL', requirements: [{ capabilityId: 'b' }] }],
          emits: [],
        },
        {
          id: 'b',
          name: 'B',
          type: 'ui-interaction',
          moduleId: 'loop',
          prerequisiteGroups: [{ mode: 'ALL', requirements: [{ capabilityId: 'a' }] }],
          emits: [],
        },
      ],
    };
    fs.writeFileSync(path.join(modulesDir, 'loop.yaml'), YAML.stringify(cyclicModule));

    try {
      await handleValidate(tempDir);
      expect.fail('Debería haber lanzado DataError por ciclo');
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(DataError);
      const dataErr = err as DataError;
      expect(dataErr.exitCode).toBe(ExitCode.DATA_ERROR);
      expect(dataErr.exitCode).not.toBe(0);
      expect(dataErr.message).toContain('Ciclo de dependencias detectado:');
      expect(dataErr.message).toMatch(/a → b → a|b → a → b/);
    }
  });

  it('lanza DataError con código != 0 y mensaje descriptivo ante referencia inexistente', async () => {
    const modulesDir = path.join(tempDir, 'modules');
    fs.mkdirSync(modulesDir, { recursive: true });

    const mod = {
      id: 'missing-ref',
      name: 'Missing Ref Module',
      category: 'test',
      capabilities: [
        {
          id: 'valid.cap',
          name: 'Valid',
          type: 'ui-interaction',
          moduleId: 'missing-ref',
          prerequisiteGroups: [
            { mode: 'ALL', requirements: [{ capabilityId: 'missing.cap.id' }] },
          ],
          emits: [],
        },
      ],
    };
    fs.writeFileSync(path.join(modulesDir, 'mod.yaml'), YAML.stringify(mod));

    try {
      await handleValidate(tempDir);
      expect.fail('Debería haber lanzado DataError por referencia inexistente');
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(DataError);
      const dataErr = err as DataError;
      expect(dataErr.exitCode).toBe(ExitCode.DATA_ERROR);
      expect(dataErr.exitCode).not.toBe(0);
      expect(dataErr.message).toContain("la capacidad prerrequisito 'missing.cap.id' no existe");
    }
  });
});
